import React from 'react';
import { Transaction, CartItem } from '../types';
import { format } from 'date-fns';
import { Printer, X } from 'lucide-react';

interface ReceiptProps {
  transaction: Transaction;
  items: CartItem[];
  onClose: () => void;
}

export const Receipt: React.FC<ReceiptProps> = ({ transaction, items, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:p-0 print:bg-white">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl overflow-hidden print:shadow-none print:w-full print:max-w-none">
        <div className="p-4 border-b flex justify-between items-center print:hidden">
          <h3 className="font-bold">Struk Digital</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="p-2 hover:bg-gray-100 rounded-full text-alfa-blue">
              <Printer size={20} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-6 font-mono text-xs" id="receipt-content">
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold">ALFAMART</h2>
            <p>PT. SUMBER ALFARIA TRIJAYA, TBK</p>
            <p>JL. RAYA CILEUNGSI KM 22</p>
            <p>Telp: 1500889</p>
          </div>

          <div className="border-t border-dashed py-2 mb-2">
            <div className="flex justify-between">
              <span>Tgl: {format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm')}</span>
              <span>{transaction.invoice_no}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir: {transaction.cashier_name}</span>
              <span>{transaction.payment_method}</span>
            </div>
          </div>

          <div className="border-t border-dashed py-2 mb-2">
            {items.map((item, idx) => (
              <div key={idx} className="mb-2">
                <div className="flex justify-between">
                  <span>{item.name}</span>
                </div>
                <div className="flex justify-between pl-4">
                  <span>{item.quantity} x {item.price.toLocaleString()}</span>
                  <span>{(item.quantity * item.price).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed py-2">
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL</span>
              <span>{transaction.total.toLocaleString()}</span>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between">
                <span>DISKON</span>
                <span>-{transaction.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>TUNAI</span>
              <span>{transaction.cash_received.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>KEMBALI</span>
              <span>{transaction.change_amount.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-center mt-6 border-t border-dashed pt-4">
            <p>TERIMA KASIH</p>
            <p>SELAMAT BELANJA KEMBALI</p>
            {transaction.customer_name && (
              <p className="mt-2">Member: {transaction.customer_name}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
