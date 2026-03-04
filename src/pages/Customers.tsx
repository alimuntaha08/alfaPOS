import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { Users, Plus, Search, Phone, CreditCard } from 'lucide-react';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    member_id: '',
    name: '',
    phone: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const res = await fetch('/api/customers');
    const data = await res.json();
    setCustomers(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setShowModal(false);
      setFormData({ member_id: '', name: '', phone: '' });
      fetchCustomers();
    } else {
      alert('Gagal menyimpan member');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.member_id.includes(search) ||
    c.phone.includes(search)
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="text-alfa-red" />
          Membership Pelanggan
        </h2>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Tambah Member
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari member (Nama, ID, atau No. Telp)..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="card hover:border-alfa-red transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-red-50 text-alfa-red rounded-full flex items-center justify-center">
                <Users size={24} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Poin Member</p>
                <p className="text-xl font-bold text-alfa-red">{customer.points}</p>
              </div>
            </div>
            <h3 className="font-bold text-lg mb-1">{customer.name}</h3>
            <div className="space-y-1 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CreditCard size={14} />
                <span>ID: {customer.member_id}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} />
                <span>{customer.phone}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold">Tambah Member Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-black">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">ID Member</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.member_id}
                  onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                  placeholder="Contoh: ALFA-001"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nama Lengkap</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">No. Telepon</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg font-bold">Batal</button>
                <button type="submit" className="flex-1 btn-primary">Daftar Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
