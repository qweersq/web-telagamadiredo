import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import { FileText, BarChart3, PieChart, TrendingUp } from 'lucide-react';

const FinanceReports = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderBerandaOwner 
        title="Laporan" 
        showBackButton={true}
        backPath="/finance-management"
        showLogout={true}
        showUserMenu={true}
      />

      <div className="p-4 md:p-6">
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-12 h-12 text-orange-600" />
          </div>
          <h2 className="text-lg font-semibold font-bold text-gray-800 mb-4">
            Laporan Keuangan
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Fitur untuk melihat laporan keuangan akan segera tersedia. 
            Anda dapat menganalisis performa keuangan bisnis dengan detail.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
              <div className="flex items-center gap-3 mb-3">
                <BarChart3 className="w-6 h-6 text-orange-600" />
                <h3 className="font-semibold text-orange-800">Laporan Harian</h3>
              </div>
              <p className="text-orange-700 text-sm">
                Ringkasan transaksi harian dan perbandingan dengan hari sebelumnya
              </p>
            </div>

            <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
              <div className="flex items-center gap-3 mb-3">
                <PieChart className="w-6 h-6 text-orange-600" />
                <h3 className="font-semibold text-orange-800">Laporan Kategori</h3>
              </div>
              <p className="text-orange-700 text-sm">
                Analisis pengeluaran berdasarkan kategori dan persentase
              </p>
            </div>

            <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-6 h-6 text-orange-600" />
                <h3 className="font-semibold text-orange-800">Laporan Trend</h3>
              </div>
              <p className="text-orange-700 text-sm">
                Grafik trend pemasukan dan pengeluaran dalam periode tertentu
              </p>
            </div>

            <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-6 h-6 text-orange-600" />
                <h3 className="font-semibold text-orange-800">Export Data</h3>
              </div>
              <p className="text-orange-700 text-sm">
                Export laporan ke Excel atau PDF untuk keperluan dokumentasi
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceReports;
