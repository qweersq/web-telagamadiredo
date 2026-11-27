import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText,
  FileDown,
  Calendar,
  ChevronDown,
  BarChart3,
  PieChart,
  Activity,
  Wallet,
  Filter,
  X,
  Info
} from 'lucide-react';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import AnimatedButton from '../../components/Design/AnimatedButton';
import { getFinancialReport, exportTransactionsPDF } from './api/financeApi';
import { getUserProfile } from '../../utils/userProfileHelper';
import { createFinancialReportPDF } from '../../utils/pdfFormatter';
import instance from '../../config/api';

// Sample data - akan diganti dengan API call nanti jika diperlukan
const sampleReportData = {
  "period": {
    "month": "2025-01",
    "year": 2025,
    "month_name": "Januari",
    "start_date": "2025-01-01",
    "end_date": "2025-01-31"
  },
  "summary": {
    "total_income": 15750000,
    "total_expense": 8250000,
    "net_balance": 7500000,
    "transaction_count": 127,
    "income_transactions": 89,
    "expense_transactions": 38
  },
  "category_breakdown": [
    {
      "category_id": 1,
      "category_name": "Pendapatan",
      "category_type": "credit",
      "total_amount": 15750000,
      "transaction_count": 89,
      "percentage": 100.0
    },
    {
      "category_id": 2,
      "category_name": "Beban Operasional",
      "category_type": "debit",
      "total_amount": 4500000,
      "transaction_count": 15,
      "percentage": 54.5
    },
    {
      "category_id": 3,
      "category_name": "Beban Gaji",
      "category_type": "debit",
      "total_amount": 2500000,
      "transaction_count": 8,
      "percentage": 30.3
    },
    {
      "category_id": 4,
      "category_name": "Beban Listrik",
      "category_type": "debit",
      "total_amount": 800000,
      "transaction_count": 2,
      "percentage": 9.7
    },
    {
      "category_id": 5,
      "category_name": "Beban Air",
      "category_type": "debit",
      "total_amount": 450000,
      "transaction_count": 2,
      "percentage": 5.5
    }
  ],
  "payment_method_breakdown": [
    {
      "payment_method_id": 1,
      "payment_method_name": "Cash (Tunai)",
      "payment_method_code": "cash",
      "total_amount": 5200000,
      "transaction_count": 45,
      "percentage": 33.0,
      "type": "mixed"
    },
    {
      "payment_method_id": 2,
      "payment_method_name": "QRIS",
      "payment_method_code": "qris",
      "total_amount": 6800000,
      "transaction_count": 52,
      "percentage": 43.2,
      "type": "mixed"
    },
    {
      "payment_method_id": 6,
      "payment_method_name": "Bank Transfer",
      "payment_method_code": "bank",
      "total_amount": 3750000,
      "transaction_count": 30,
      "percentage": 23.8,
      "type": "mixed"
    }
  ],
  "account_balances": [
    {
      "account_id": 1,
      "account_name": "BCA Account",
      "current_balance": 62551786,
      "opening_balance": 61000000,
      "monthly_change": 1551786,
      "transaction_count": 25,
      "payment_method": {
        "id": 6,
        "name": "Bank Transfer",
        "code": "bank"
      }
    },
    {
      "account_id": 2,
      "account_name": "Office Cash",
      "current_balance": 22493736,
      "opening_balance": 22000000,
      "monthly_change": 493736,
      "transaction_count": 45,
      "payment_method": {
        "id": 1,
        "name": "Cash (Tunai)",
        "code": "cash"
      }
    },
    {
      "account_id": 3,
      "account_name": "QRIS Gateway",
      "current_balance": 1067000,
      "opening_balance": 800000,
      "monthly_change": 267000,
      "transaction_count": 52,
      "payment_method": {
        "id": 2,
        "name": "QRIS",
        "code": "qris"
      }
    }
  ],
  "top_transactions": [
    {
      "id": 156,
      "date": "2025-01-15",
      "description": "Penjualan produk utama",
      "amount": 2500000,
      "final_amount": 2500000,
      "category": {
        "id": 1,
        "name": "Pendapatan",
        "type": "credit"
      },
      "account": {
        "id": 1,
        "name": "BCA Account"
      },
      "payment_method": {
        "id": 6,
        "name": "Bank Transfer",
        "code": "bank"
      }
    },
    {
      "id": 157,
      "date": "2025-01-20",
      "description": "Pembayaran gaji karyawan",
      "amount": 2500000,
      "final_amount": 2500000,
      "category": {
        "id": 3,
        "name": "Beban Gaji",
        "type": "debit"
      },
      "account": {
        "id": 1,
        "name": "BCA Account"
      },
      "payment_method": {
        "id": 6,
        "name": "Bank Transfer",
        "code": "bank"
      }
    }
  ]
};

const FinanceReport = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(sampleReportData);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isNotaFree, setIsNotaFree] = useState(false);

  // Load initial data
  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (userProfile?.tenant?.id) {
      console.log('🔍 FinanceReport - UserProfile loaded:', {
        tenant_id: userProfile.tenant?.id,
        branch_id: userProfile.branch?.id,
        tenant_name: userProfile.tenant?.business_name,
        branch_name: userProfile.branch?.name
      });
      loadBranches();
      // ✅ FIX: Default ke null (Semua Cabang), tidak auto-set ke branch user
      // setSelectedBranch(userProfile.branch?.id); // ← Dihapus
    }
  }, [userProfile]);

  // Fetch initial data after branches are loaded (atau setelah userProfile tersedia)
  useEffect(() => {
    // ✅ FIX: selectedBranch null = Semua Cabang, tetap fetch
    if (userProfile && branches.length > 0) {
      fetchFinancialReport();
    }
  }, [userProfile, selectedBranch, branches]);

  // Remove auto-fetch on filter change - only fetch when Apply button is clicked
  // useEffect(() => {
  //   if (userProfile && selectedBranch !== null) {
  //     fetchFinancialReport();
  //   }
  // }, [selectedMonth, selectedYear, selectedBranch, userProfile]);

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      setUserProfile(profile);
      
      // Check if user has NotaFree plan
      const planId = profile?.subscription?.plan?.id;
      setIsNotaFree(planId === 4);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError('Gagal memuat profil pengguna');
      setIsNotaFree(false);
    }
  };

  const loadBranches = async () => {
    try {
      if (!userProfile?.tenant?.id) {
        console.log('❌ No tenant.id available yet');
        return;
      }
      
      setBranchesLoading(true);
      console.log('🔄 Loading branches for tenant:', userProfile.tenant.id);
      const response = await instance.get(`/branches?tenant_id=${userProfile.tenant.id}`);
      
      if (response.data.success) {
        const branchesData = response.data.data.map(branch => ({
          id: branch.id,
          name: branch.name
        }));
        setBranches(branchesData);
        console.log('✅ Branches loaded:', branchesData);
      } else {
        console.error('❌ API returned error:', response.data.message);
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('❌ Error loading branches:', error);
      // Fallback to mock data if API fails
      const mockBranches = [
        { id: 4, name: 'NotaSepatu Lawang' },
        { id: 5, name: 'NotaSepatu Malang' },
        { id: 6, name: 'NotaSepatu Surabaya' }
      ];
      setBranches(mockBranches);
      console.log('⚠️ Using fallback branches:', mockBranches);
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchFinancialReport = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        month: selectedMonth,
        year: selectedYear,
        tenant_id: userProfile.tenant.id,
        // ✅ FIX: Hanya kirim branch_id jika dipilih (null = Semua Cabang)
        ...(selectedBranch ? { branch_id: selectedBranch } : {}),
      };
      
      console.log('🔄 Fetching financial report with params:', params);
      const data = await getFinancialReport(params);
      setReportData(data.data || data);
      console.log('✅ Financial report fetched successfully');
    } catch (error) {
      console.error('❌ Error fetching financial report:', error);
      setError('Gagal memuat laporan keuangan');
      // Fallback to sample data if API fails
      setReportData(sampleReportData);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getCategoryIcon = (categoryName) => {
    const icons = {
      'Pendapatan': '💰',
      'Beban Operasional': '🏢',
      'Beban Gaji': '👥',
      'Beban Listrik': '⚡',
      'Beban Air': '💧',
    };
    return icons[categoryName] || '📊';
  };

  const getPaymentMethodIcon = (code) => {
    const icons = {
      'cash': '💵',
      'qris': '📱',
      'bank': '🏦',
      'ewallet': '💳',
    };
    return icons[code] || '💳';
  };

  const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const handleApplyFilter = async () => {
    setShowFilterModal(false);
    await fetchFinancialReport();
  };


  // Export to PDF function
  const exportToPDF = async () => {
    try {
      if (!reportData || !userProfile) {
        alert('Data belum tersedia. Silakan tunggu sebentar.');
        return;
      }

      console.log('🔍 Starting PDF export...');
      
      const selectedBranchData = branches.find(b => b.id === selectedBranch);
      
      // Gunakan komponen PDF formatter
      const filename = await createFinancialReportPDF(
        reportData,
        userProfile,
        selectedBranchData,
        selectedMonth,
        selectedYear,
        months
      );
      
      console.log(`✅ PDF file generated: ${filename}`);
      alert(`Laporan PDF berhasil dibuat: ${filename}`);
      
    } catch (error) {
      console.error('❌ Error exporting PDF:', error);
      if (error.message.includes('jspdf')) {
        alert('Library PDF tidak tersedia. Pastikan jspdf sudah terinstall dengan benar.');
      } else {
        alert(`Gagal mengexport data PDF: ${error.message}`);
      }
    }
  };

  // Export transactions list to PDF
  const exportTransactionsToPDF = async () => {
    try {
      if (!userProfile) {
        alert('Data belum tersedia. Silakan tunggu sebentar.');
        return;
      }

      const params = {
        type: 'all',
        period: 'monthly',
        date: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`,
        tenant_id: userProfile.tenant.id,
        branch_id: selectedBranch || undefined,
      };

      console.log('🔍 Exporting transactions PDF with params:', params);
      await exportTransactionsPDF(params);
      console.log('✅ Transactions PDF exported successfully');
    } catch (error) {
      console.error('❌ Error exporting transactions PDF:', error);
      alert(`Gagal mengexport daftar transaksi: ${error.message}`);
    }
  };

  const getSelectedBranchName = () => {
    const branch = branches.find(b => b.id === selectedBranch);
    return branch ? branch.name : 'Semua Cabang';
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner 
        title="Laporan Keuangan"
        description="Laporan keuangan bulanan"
        showBackButton={true}
        backPath="/berandaowner"
        currentTime={new Date().toLocaleTimeString()}
        hideLogout={true}
        hideUserMenu={true}
      />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pt-10 pb-6">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-[50px]">
            {/* Filter Button */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setShowFilterModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-montserrat text-gray-700">Filter</span>
              </button>
              
              {/* Current Filter Info - Simple */}
              <div className="text-sm text-gray-600 font-montserrat">
                {getSelectedBranchName()} • {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </div>
            </div>

         {/* Export Button */}
         <div className="flex items-center gap-3 mb-6">
           {isNotaFree ? (
             <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg w-full">
               <Info className="w-5 h-5 text-orange-600 flex-shrink-0" />
               <div className="flex-1">
                 <p className="text-sm text-orange-800 font-montserrat font-medium">
                   Ingin download laporan?
                 </p>
                 <p className="text-xs text-orange-600 font-montserrat">
                   Upgrade ke paket berbayar untuk mengakses fitur download laporan.
                 </p>
               </div>
               <button
                 onClick={() => navigate('/billing-active-tenant-payment')}
                 className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-xs font-montserrat font-semibold whitespace-nowrap"
               >
                 Lihat Paket
               </button>
             </div>
           ) : (
             <>
               <button
                 onClick={exportToPDF}
                 disabled={loading || !reportData}
                 className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
               >
                 <FileText className="w-5 h-5" />
                 <span className="text-sm font-montserrat font-semibold">Download PDF</span>
               </button>

               <button
                 onClick={exportTransactionsToPDF}
                 disabled={loading || !reportData}
                 className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
               >
                 <FileDown className="w-5 h-5" />
                 <span className="text-sm font-montserrat font-semibold">Export Transaksi</span>
               </button>
               
               <div className="text-xs text-gray-500 font-montserrat">
                 {loading ? 'Memuat data...' : reportData ? 'Siap download' : 'Belum ada data'}
               </div>
             </>
           )}
         </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 font-montserrat text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-600 font-montserrat text-sm">Memuat laporan keuangan...</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-montserrat">Uang Masuk</p>
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-lg font-bold text-green-600 font-montserrat">
                      {formatCurrency(reportData.summary?.total_income || 0)}
                    </p>
                    <p className="text-xs text-gray-500 font-montserrat">
                      {reportData.summary?.income_transactions || 0} transaksi
                    </p>
                  </>
                )}
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-montserrat">Uang Keluar</p>
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-lg font-bold text-red-600 font-montserrat">
                      {formatCurrency(reportData.summary?.total_expense || 0)}
                    </p>
                    <p className="text-xs text-gray-500 font-montserrat">
                      {reportData.summary?.expense_transactions || 0} transaksi
                    </p>
                  </>
                )}
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-montserrat">Arus Kas Bersih</p>
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                ) : (
                  <>
                    <p className={`text-lg font-bold font-montserrat ${(reportData.summary?.net_balance || 0) < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {formatCurrency(reportData.summary?.net_balance || 0)}
                    </p>
                    <p className="text-xs text-gray-500 font-montserrat">
                      Uang masuk − uang keluar
                    </p>
                  </>
                )}
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-montserrat">Jumlah Transaksi</p>
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-lg font-bold text-gray-800 font-montserrat">
                      {reportData.summary?.transaction_count || 0}
                    </p>
                    <p className="text-xs text-gray-500 font-montserrat">
                      Total semua transaksi
                    </p>
                  </>
                )}
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Laporan Laba Rugi (HPP & Margin) */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-800 font-montserrat tracking-wider">
              Laba Rugi &amp; HPP
            </h3>
            <span className="ml-auto text-xs text-gray-500 font-montserrat">
              {reportData.period?.month_name} {reportData.period?.year}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {/* Kolom kiri: margin produk */}
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-500 font-montserrat uppercase tracking-wider mb-3">
                Laba Kotor (Margin Produk)
              </p>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700 font-montserrat">Omzet Penjualan Item</span>
                <span className="text-sm font-semibold text-gray-800 font-montserrat">
                  {formatCurrency(reportData.summary?.sales_revenue || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700 font-montserrat">HPP (Harga Pokok)</span>
                <span className="text-sm font-semibold text-red-600 font-montserrat">
                  − {formatCurrency(reportData.summary?.hpp_total || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 mt-1 border-t-2 border-gray-300">
                <span className="text-sm font-bold text-gray-800 font-montserrat">Laba Kotor</span>
                <div className="text-right">
                  <p className={`text-base font-bold font-montserrat ${(reportData.summary?.gross_profit || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(reportData.summary?.gross_profit || 0)}
                  </p>
                  <p className="text-xs text-gray-500 font-montserrat">
                    Margin {formatPercentage(reportData.summary?.gross_margin_percent || 0)}
                  </p>
                </div>
              </div>

              <p className="mt-2 text-xs text-gray-500 font-montserrat">
                {reportData.hpp_breakdown?.total_items || 0} item terjual
                {reportData.hpp_breakdown?.items_without_hpp > 0 && (
                  <> · {reportData.hpp_breakdown.items_without_hpp} item dibuat sebelum HPP diisi</>
                )}
              </p>
            </div>

            {/* Kolom kanan: arus kas */}
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-500 font-montserrat uppercase tracking-wider mb-3">
                Arus Kas (Realisasi)
              </p>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700 font-montserrat">Uang Masuk</span>
                <span className="text-sm font-semibold text-green-600 font-montserrat">
                  {formatCurrency(reportData.summary?.total_income || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700 font-montserrat">Uang Keluar (Beban Operasional)</span>
                <span className="text-sm font-semibold text-red-600 font-montserrat">
                  − {formatCurrency(reportData.summary?.total_expense || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 mt-1 border-t-2 border-gray-300">
                <span className="text-sm font-bold text-gray-800 font-montserrat">Arus Kas Bersih</span>
                <p className={`text-base font-bold font-montserrat ${(reportData.summary?.net_balance || 0) < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                  {formatCurrency(reportData.summary?.net_balance || 0)}
                </p>
              </div>

              <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded p-2">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-montserrat leading-relaxed">
                  HPP hanya untuk analisa margin per produk. Pembelian bahan sudah
                  tercatat di Uang Keluar, jadi HPP tidak dikurangkan lagi dari Arus Kas Bersih.
                </p>
              </div>

              {reportData.summary?.hpp_is_estimated && (
                <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded p-2">
                  <Info className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800 font-montserrat leading-relaxed">
                    Sebagian produk belum punya HPP, jadi Laba Kotor di atas <b>lebih tinggi</b> dari seharusnya.
                    Isi HPP di menu Manajemen Produk.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* HPP per Produk */}
        {(reportData.hpp_breakdown?.by_product?.length || 0) > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50">
              <Wallet className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-800 font-montserrat tracking-wider">
                HPP per Produk
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-montserrat">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-2">Produk</th>
                    <th className="text-right px-4 py-2">Qty</th>
                    <th className="text-right px-4 py-2">Omzet</th>
                    <th className="text-right px-4 py-2">HPP</th>
                    <th className="text-right px-4 py-2">Laba Kotor</th>
                    <th className="text-right px-4 py-2">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportData.hpp_breakdown.by_product.map((item) => (
                    <tr key={item.treatment_id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-800">
                        {item.treatment_name}
                        {item.items_without_hpp > 0 && (
                          <span className="ml-2 text-xs text-red-600">
                            ({item.items_without_hpp} dari {item.qty} item tanpa HPP)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600">{item.qty}</td>
                      <td className="px-4 py-2 text-right text-gray-800">{formatCurrency(item.revenue || 0)}</td>
                      <td className="px-4 py-2 text-right text-red-600">{formatCurrency(item.hpp || 0)}</td>
                      <td className={`px-4 py-2 text-right font-semibold ${item.gross_profit < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(item.gross_profit || 0)}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600">
                        {formatPercentage(item.gross_margin_percent || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-800 font-montserrat tracking-wider">
                Rincian Kategori
              </h3>
            </div>
            
            {/* Pemasukan */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-green-600 font-montserrat mb-2">UANG MASUK</h4>
              <div className="space-y-2">
                {reportData.category_breakdown && reportData.category_breakdown.length > 0 ? (
                  reportData.category_breakdown
                    .filter(cat => cat.category_type === 'credit')
                    .map((category) => (
                      <div key={category.category_id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm">{getCategoryIcon(category.category_name)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 font-montserrat">{category.category_name}</p>
                            <p className="text-xs text-gray-500 font-montserrat">{category.transaction_count} transaksi</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600 font-montserrat">{formatCurrency(category.total_amount)}</p>
                          <p className="text-xs text-gray-500 font-montserrat">{formatPercentage(category.percentage)}</p>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-gray-500 font-montserrat text-sm">Belum ada uang masuk</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pengeluaran */}
            <div>
              <h4 className="text-sm font-semibold text-red-600 font-montserrat mb-2">UANG KELUAR</h4>
              <div className="space-y-2">
                {reportData.category_breakdown && reportData.category_breakdown.length > 0 ? (
                  reportData.category_breakdown
                    .filter(cat => cat.category_type === 'debit')
                    .map((category) => (
                      <div key={category.category_id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-sm">{getCategoryIcon(category.category_name)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 font-montserrat">{category.category_name}</p>
                            <p className="text-xs text-gray-500 font-montserrat">{category.transaction_count} transaksi</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600 font-montserrat">{formatCurrency(category.total_amount)}</p>
                          <p className="text-xs text-gray-500 font-montserrat">{formatPercentage(category.percentage)}</p>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-gray-500 font-montserrat text-sm">Belum ada uang keluar</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-800 font-montserrat tracking-wider">
                Metode Pembayaran
              </h3>
            </div>
            
            <div className="space-y-3">
              {reportData.payment_method_breakdown && reportData.payment_method_breakdown.length > 0 ? (
                reportData.payment_method_breakdown.map((method) => (
                  <div key={method.payment_method_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm">{getPaymentMethodIcon(method.payment_method_code)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 font-montserrat">{method.payment_method_name}</p>
                        <p className="text-xs text-gray-500 font-montserrat">{method.transaction_count} transaksi</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800 font-montserrat">{formatCurrency(method.total_amount)}</p>
                      <p className="text-xs text-gray-500 font-montserrat">{formatPercentage(method.percentage)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-500 font-montserrat text-sm">Belum ada metode bayar</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Transactions */}
        <div className="mt-6">
          {/* Top Transactions */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-800 font-montserrat tracking-wider">
                Transaksi Besar
              </h3>
            </div>
            
            <div className="space-y-3">
              {reportData.top_transactions && reportData.top_transactions.length > 0 ? (
                reportData.top_transactions.map((transaction) => (
                  <div key={transaction.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-800 font-montserrat line-clamp-1">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500 font-montserrat">
                          {new Date(transaction.date).toLocaleDateString('id-ID')} • {transaction.account?.name || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold font-montserrat ${transaction.category?.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.category?.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.final_amount)}
                        </p>
                        <p className="text-xs text-gray-500 font-montserrat">
                          {transaction.payment_method?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-montserrat ${
                        transaction.category?.type === 'credit' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {transaction.category?.name || 'N/A'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-500 font-montserrat text-sm">Belum ada transaksi</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8" style={{
            paddingTop: 'max(2rem, env(safe-area-inset-top))',
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(2rem, env(safe-area-inset-left))',
            paddingRight: 'max(2rem, env(safe-area-inset-right))'
          }}>
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]">
              {/* Header - Fixed */}
              <div className="bg-white px-6 py-3 flex-shrink-0 border-b-2 border-gray-200 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-800 font-montserrat">
                    Pilih Filter
                  </h3>
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="px-6 py-4 flex-1 overflow-y-auto" style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}>
                <div className="space-y-4">

                {/* Branch Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                    Pilih Cabang ({branches.length} tersedia)
                  </label>
                  <select
                    value={selectedBranch || ''}
                    onChange={(e) => setSelectedBranch(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-montserrat focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={branchesLoading || branches.length === 0}
                  >
                    <option value="">Semua Cabang</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  {branchesLoading && (
                    <p className="text-xs text-blue-500 mt-1">Memuat daftar cabang...</p>
                  )}
                  {!branchesLoading && branches.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">Tidak ada cabang tersedia</p>
                  )}
                </div>

                {/* Month Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                    Pilih Bulan
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-montserrat focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                    Pilih Tahun
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-montserrat focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                </div>
              </div>

              {/* Footer - Fixed */}
              <div className="px-6 py-3 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-montserrat text-sm font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleApplyFilter}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-montserrat text-sm font-semibold"
                    disabled={loading}
                  >
                    {loading ? 'Memuat...' : 'Pakai Filter'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default FinanceReport;
