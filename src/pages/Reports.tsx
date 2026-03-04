import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { BarChart3, TrendingUp, ShoppingBag, Users, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const Reports: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ total_transactions: 0, total_revenue: 0, total_discount: 0 });
  const [topProducts, setTopProducts] = useState<{ name: string, total_sold: number }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [txRes, summaryRes] = await Promise.all([
      fetch('/api/transactions'),
      fetch('/api/reports/summary')
    ]);
    
    setTransactions(await txRes.json());
    const summaryData = await summaryRes.json();
    setSummary(summaryData.summary);
    setTopProducts(summaryData.topProducts);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(transactions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Penjualan");
    XLSX.writeFile(wb, `Laporan_Penjualan_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Laporan Penjualan AlfaPOS", 14, 15);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22);

    const tableData = transactions.map(t => [
      t.invoice_no,
      format(new Date(t.created_at), 'dd/MM/yyyy'),
      t.cashier_name,
      t.payment_method,
      t.total.toLocaleString()
    ]);

    (doc as any).autoTable({
      head: [['Invoice', 'Tanggal', 'Kasir', 'Metode', 'Total']],
      body: tableData,
      startY: 30,
    });

    doc.save(`Laporan_Penjualan_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="text-alfa-red" />
          Laporan Penjualan
        </h2>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">
            <FileSpreadsheet size={18} />
            Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">
            <FileText size={18} />
            PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card border-l-4 border-l-alfa-red">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total Penjualan Hari Ini</p>
              <h3 className="text-2xl font-bold">Rp {(summary?.total_revenue || 0).toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-red-50 text-alfa-red rounded-xl">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
        <div className="card border-l-4 border-l-alfa-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Jumlah Transaksi</p>
              <h3 className="text-2xl font-bold">{summary?.total_transactions || 0}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-alfa-blue rounded-xl">
              <ShoppingBag size={24} />
            </div>
          </div>
        </div>
        <div className="card border-l-4 border-l-alfa-yellow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total Diskon</p>
              <h3 className="text-2xl font-bold">Rp {(summary?.total_discount || 0).toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-yellow-50 text-alfa-yellow rounded-xl">
              <Users size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-bold">Transaksi Terbaru</h4>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2">Invoice</th>
                <th className="px-4 py-2">Waktu</th>
                <th className="px-4 py-2">Kasir</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.slice(0, 10).map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono">{t.invoice_no}</td>
                  <td className="px-4 py-3 text-gray-500">{format(new Date(t.created_at), 'HH:mm')}</td>
                  <td className="px-4 py-3">{t.cashier_name}</td>
                  <td className="px-4 py-3 text-right font-bold">Rp {t.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Products */}
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-bold">Produk Terlaris Hari Ini</h4>
          </div>
          <div className="p-4 space-y-4">
            {topProducts.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-xs font-bold">{idx + 1}</span>
                  <p className="text-sm font-medium">{p.name}</p>
                </div>
                <span className="text-xs font-bold bg-alfa-red/10 text-alfa-red px-2 py-1 rounded-full">{p.total_sold} terjual</span>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-center text-gray-400 py-8">Belum ada data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
