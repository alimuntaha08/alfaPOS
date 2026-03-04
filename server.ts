import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const db = new Database("pos.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'cashier',
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode TEXT UNIQUE,
    name TEXT,
    price REAL,
    cost_price REAL,
    stock INTEGER DEFAULT 0,
    category TEXT,
    promo_price REAL,
    promo_expiry DATE
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id TEXT UNIQUE,
    name TEXT,
    phone TEXT,
    points INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_no TEXT UNIQUE,
    total REAL,
    discount REAL,
    payment_method TEXT,
    cash_received REAL,
    change_amount REAL,
    customer_id INTEGER,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES customers(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transaction_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price REAL,
    subtotal REAL,
    FOREIGN KEY(transaction_id) REFERENCES transactions(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS returns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(transaction_id) REFERENCES transactions(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );
`);

// Seed initial admin user if not exists
const admin = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!admin) {
  db.prepare("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)").run(
    "admin",
    "admin123",
    "admin",
    "Administrator"
  );
}

// Seed some initial products for testing
const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get().count;
if (productCount === 0) {
  const insertProduct = db.prepare("INSERT INTO products (barcode, name, price, cost_price, stock, category) VALUES (?, ?, ?, ?, ?, ?)");
  insertProduct.run("8992761123456", "Aqua 600ml", 3500, 2500, 100, "Minuman");
  insertProduct.run("8999999123456", "Indomie Goreng", 3000, 2200, 200, "Makanan");
  insertProduct.run("8991234567890", "Chitato Sapi Panggang", 12000, 9500, 50, "Snack");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- API Routes ---

  // Auth
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT id, username, role, name FROM users WHERE username = ? AND password = ?").get(username, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Username atau password salah" });
    }
  });

  // Products
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    res.json(products);
  });

  app.get("/api/products/:barcode", (req, res) => {
    const product = db.prepare("SELECT * FROM products WHERE barcode = ?").get(req.params.barcode);
    if (product) res.json(product);
    else res.status(404).json({ error: "Produk tidak ditemukan" });
  });

  app.post("/api/products", (req, res) => {
    const { barcode, name, price, cost_price, stock, category } = req.body;
    try {
      const info = db.prepare("INSERT INTO products (barcode, name, price, cost_price, stock, category) VALUES (?, ?, ?, ?, ?, ?)")
        .run(barcode, name, price, cost_price, stock, category);
      res.json({ id: info.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "Barcode sudah ada atau data tidak valid" });
    }
  });

  app.put("/api/products/:id", (req, res) => {
    const { barcode, name, price, cost_price, stock, category } = req.body;
    db.prepare("UPDATE products SET barcode = ?, name = ?, price = ?, cost_price = ?, stock = ?, category = ? WHERE id = ?")
      .run(barcode, name, price, cost_price, stock, category, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", (req, res) => {
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Customers
  app.get("/api/customers", (req, res) => {
    res.json(db.prepare("SELECT * FROM customers").all());
  });

  app.get("/api/customers/:member_id", (req, res) => {
    const customer = db.prepare("SELECT * FROM customers WHERE member_id = ?").get(req.params.member_id);
    if (customer) res.json(customer);
    else res.status(404).json({ error: "Member tidak ditemukan" });
  });

  app.post("/api/customers", (req, res) => {
    const { member_id, name, phone } = req.body;
    try {
      const info = db.prepare("INSERT INTO customers (member_id, name, phone) VALUES (?, ?, ?)")
        .run(member_id, name, phone);
      res.json({ id: info.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "ID Member sudah ada" });
    }
  });

  // Transactions
  app.post("/api/transactions", (req, res) => {
    const { items, total, discount, payment_method, cash_received, change_amount, customer_id, user_id } = req.body;
    const invoice_no = `INV-${Date.now()}`;

    const transaction = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO transactions (invoice_no, total, discount, payment_method, cash_received, change_amount, customer_id, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(invoice_no, total, discount, payment_method, cash_received, change_amount, customer_id, user_id);

      const transaction_id = info.lastInsertRowid;

      for (const item of items) {
        db.prepare(`
          INSERT INTO transaction_items (transaction_id, product_id, quantity, price, subtotal)
          VALUES (?, ?, ?, ?, ?)
        `).run(transaction_id, item.id, item.quantity, item.price, item.price * item.quantity);

        // Update stock
        db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?").run(item.quantity, item.id);
      }

      // Update customer points if member
      if (customer_id) {
        const pointsEarned = Math.floor(total / 1000); // 1 point per 1000 IDR
        db.prepare("UPDATE customers SET points = points + ? WHERE id = ?").run(pointsEarned, customer_id);
      }

      return { transaction_id, invoice_no };
    });

    try {
      const result = transaction();
      res.json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Gagal memproses transaksi" });
    }
  });

  app.get("/api/transactions", (req, res) => {
    const transactions = db.prepare(`
      SELECT t.*, u.name as cashier_name, c.name as customer_name 
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN customers c ON t.customer_id = c.id
      ORDER BY t.created_at DESC
    `).all();
    res.json(transactions);
  });

  app.get("/api/transactions/:id", (req, res) => {
    const transaction = db.prepare(`
      SELECT t.*, u.name as cashier_name, c.name as customer_name 
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!transaction) return res.status(404).json({ error: "Transaksi tidak ditemukan" });

    const items = db.prepare(`
      SELECT ti.*, p.name as product_name, p.barcode
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      WHERE ti.transaction_id = ?
    `).all(req.params.id);

    res.json({ ...transaction, items });
  });

  // Reports
  app.get("/api/reports/summary", (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(total) as total_revenue,
        SUM(discount) as total_discount
      FROM transactions
      WHERE DATE(created_at) = ?
    `).get(today);
    
    const topProducts = db.prepare(`
      SELECT p.name, SUM(ti.quantity) as total_sold
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE DATE(t.created_at) = ?
      GROUP BY ti.product_id
      ORDER BY total_sold DESC
      LIMIT 5
    `).all(today);

    res.json({ summary, topProducts });
  });

  // Returns
  app.post("/api/returns", (req, res) => {
    const { transaction_id, product_id, quantity, reason } = req.body;
    const transaction = db.transaction(() => {
      db.prepare("INSERT INTO returns (transaction_id, product_id, quantity, reason) VALUES (?, ?, ?, ?)")
        .run(transaction_id, product_id, quantity, reason);
      
      // Add back to stock
      db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?").run(quantity, product_id);
    });
    
    try {
      transaction();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Gagal memproses retur" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(3000, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:3000`);
  });
}

startServer();
