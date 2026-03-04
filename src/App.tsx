import React, { useState, useEffect } from 'react';
import { User } from './types';
import { Login } from './pages/Login';
import { POS } from './pages/POS';
import { Products } from './pages/Products';
import { Reports } from './pages/Reports';
import { Customers } from './pages/Customers';
import { Store, ShoppingCart, Package, BarChart3, Users, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'pos' | 'products' | 'reports' | 'customers'>('pos');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load user from local storage
  useEffect(() => {
    const savedUser = localStorage.getItem('alfa_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('alfa_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('alfa_user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const navItems = [
    { id: 'pos', label: 'Kasir (POS)', icon: ShoppingCart, roles: ['admin', 'cashier'] },
    { id: 'products', label: 'Produk & Stok', icon: Package, roles: ['admin'] },
    { id: 'reports', label: 'Laporan', icon: BarChart3, roles: ['admin'] },
    { id: 'customers', label: 'Membership', icon: Users, roles: ['admin', 'cashier'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="bg-white border-r flex flex-col z-40 shadow-sm"
      >
        <div className="p-4 border-b flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-alfa-red rounded-xl flex items-center justify-center text-white shrink-0">
              <Store size={24} />
            </div>
            {isSidebarOpen && <span className="font-bold text-xl tracking-tight">AlfaPOS</span>}
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {filteredNavItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-alfa-red text-white shadow-md shadow-red-200' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <item.icon size={24} className="shrink-0" />
              {isSidebarOpen && <span className="font-semibold">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className={`flex items-center gap-3 mb-4 overflow-hidden ${!isSidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 bg-alfa-blue rounded-full flex items-center justify-center text-white shrink-0">
              {user.name.charAt(0)}
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="font-bold text-sm truncate">{user.name}</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold">{user.role}</p>
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 transition-all ${!isSidebarOpen && 'justify-center'}`}
          >
            <LogOut size={24} className="shrink-0" />
            {isSidebarOpen && <span className="font-semibold">Keluar</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0">
          <h2 className="font-bold text-gray-500 uppercase tracking-widest text-xs">
            {navItems.find(i => i.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-400">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'pos' && <POS user={user} />}
              {activeTab === 'products' && <Products />}
              {activeTab === 'reports' && <Reports />}
              {activeTab === 'customers' && <Customers />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
