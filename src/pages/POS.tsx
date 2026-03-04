import React, { useState, useEffect, useRef } from 'react';
import { User, Product, CartItem, Customer, Transaction } from '../types';
import { Search, ShoppingCart, User as UserIcon, ScanLine, Trash2, Plus, Minus, CreditCard, Banknote, Receipt as ReceiptIcon } from 'lucide-react';
import { Scanner } from '../components/Scanner';
import { Receipt } from '../components/Receipt';
import { motion, AnimatePresence } from 'motion/react';

interface POSProps {
  user: User;
}

export const POS: React.FC<POSProps> = ({ user }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [memberId, setMemberId] = useState('');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'ewallet'>('cash');
  const [showReceipt, setShowReceipt] = useState<Transaction | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
    searchInputRef.current?.focus();
  }, []);

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setSearch('');
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleBarcodeScan = async (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      addToCart(product);
    } else {
      alert('Produk tidak ditemukan');
    }
  };

  const checkMember = async () => {
    if (!memberId) return;
    try {
      const res = await fetch(`/api/customers/${memberId}`);
      if (res.ok) {
        const data = await res.json();
        setCustomer(data);
      } else {
        alert('Member tidak ditemukan');
      }
    } catch (err) {
      alert('Gagal mengecek member');
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = customer ? Math.floor(subtotal * 0.05) : 0; // 5% discount for members
  const total = subtotal - discount;
  const change = cashReceived - total;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'cash' && cashReceived < total) {
      alert('Uang tunai kurang');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          total,
          discount,
          payment_method: paymentMethod,
          cash_received: paymentMethod === 'cash' ? cashReceived : total,
          change_amount: paymentMethod === 'cash' ? change : 0,
          customer_id: customer?.id,
          user_id: user.id
        }),
      });

      if (res.ok) {
        const result = await res.json();
        // Fetch full transaction for receipt
        const txRes = await fetch(`/api/transactions/${result.transaction_id}`);
        const txData = await txRes.json();
        setShowReceipt(txData);
        setCart([]);
        setCustomer(null);
        setMemberId('');
        setCashReceived(0);
      } else {
        alert('Gagal memproses transaksi');
      }
    } catch (err) {
      alert('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.barcode.includes(search)
  );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Left Side: Product Search & Selection */}
      <div className="flex-1 flex flex-col bg-white border-r">
        <div className="p-4 border-b bg-gray-50 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari nama produk atau scan barcode..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredProducts.length === 1) {
                  addToCart(filteredProducts[0]);
                }
              }}
            />
          </div>
          <button 
            onClick={() => setShowScanner(true)}
            className="p-2 bg-alfa-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ScanLine size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <motion.button
                whileTap={{ scale: 0.95 }}
                key={product.id}
                onClick={() => addToCart(product)}
                className="card p-3 text-left hover:border-alfa-red transition-all group"
              >
                <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-gray-300">
                  <ShoppingCart size={32} />
                </div>
                <h4 className="font-bold text-sm line-clamp-2 mb-1 group-hover:text-alfa-red">{product.name}</h4>
                <p className="text-alfa-red font-bold">Rp {product.price.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 mt-1">Stok: {product.stock}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Cart & Checkout */}
      <div className="w-96 flex flex-col bg-gray-50">
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <ShoppingCart size={20} className="text-alfa-red" />
              Keranjang Belanja
            </h3>
            <span className="bg-alfa-red text-white text-xs px-2 py-1 rounded-full">{cart.length} Item</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="ID Member"
              className="input-field text-sm"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            />
            <button onClick={checkMember} className="btn-secondary text-sm px-3">Cek</button>
          </div>
          {customer && (
            <div className="mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold">{customer.name}</p>
                <p className="text-[10px] text-gray-500">Poin: {customer.points}</p>
              </div>
              <button onClick={() => setCustomer(null)} className="text-gray-400 hover:text-red-500">✕</button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {cart.map(item => (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                key={item.id}
                className="bg-white p-3 rounded-xl shadow-sm border border-gray-100"
              >
                <div className="flex justify-between mb-2">
                  <h5 className="text-sm font-bold line-clamp-1">{item.name}</h5>
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-alfa-red font-bold text-sm">Rp {(item.price * item.quantity).toLocaleString()}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 bg-gray-100 rounded hover:bg-gray-200">
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 bg-gray-100 rounded hover:bg-gray-200">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
              <ShoppingCart size={48} className="mb-2" />
              <p>Keranjang Kosong</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t space-y-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>Rp {subtotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Diskon Member (5%)</span>
                <span>-Rp {discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
              <span>TOTAL</span>
              <span className="text-alfa-red">Rp {total.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setPaymentMethod('cash')}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all",
                paymentMethod === 'cash' ? "border-alfa-red bg-red-50 text-alfa-red" : "border-gray-100 text-gray-400"
              )}
            >
              <Banknote size={20} />
              <span className="text-[10px] font-bold mt-1">TUNAI</span>
            </button>
            <button 
              onClick={() => setPaymentMethod('ewallet')}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all",
                paymentMethod === 'ewallet' ? "border-alfa-blue bg-blue-50 text-alfa-blue" : "border-gray-100 text-gray-400"
              )}
            >
              <CreditCard size={20} />
              <span className="text-[10px] font-bold mt-1">E-WALLET</span>
            </button>
          </div>

          {paymentMethod === 'cash' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500">Uang Tunai</label>
              <div className="grid grid-cols-3 gap-1 mb-2">
                {[10000, 20000, 50000, 100000].map(amt => (
                  <button 
                    key={amt}
                    onClick={() => setCashReceived(amt)}
                    className="text-[10px] bg-gray-100 py-1 rounded hover:bg-gray-200"
                  >
                    {amt/1000}k
                  </button>
                ))}
                <button onClick={() => setCashReceived(total)} className="text-[10px] bg-alfa-yellow py-1 rounded font-bold">Pas</button>
              </div>
              <input
                type="number"
                className="input-field text-right font-bold text-lg"
                value={cashReceived || ''}
                onChange={(e) => setCashReceived(Number(e.target.value))}
              />
              {change >= 0 && (
                <div className="flex justify-between text-sm font-bold text-alfa-blue">
                  <span>Kembalian</span>
                  <span>Rp {change.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          <button 
            disabled={loading || cart.length === 0}
            onClick={handleCheckout}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-lg disabled:opacity-50"
          >
            <ReceiptIcon size={24} />
            BAYAR SEKARANG
          </button>
        </div>
      </div>

      {showScanner && (
        <Scanner 
          onScan={handleBarcodeScan} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      {showReceipt && (
        <Receipt 
          transaction={showReceipt} 
          items={showReceipt.items as any} 
          onClose={() => setShowReceipt(null)} 
        />
      )}
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
