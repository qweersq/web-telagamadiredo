import React, { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown, Clock, ChevronRight, Loader2, FileDown } from 'lucide-react';
import AnimatedButton from '../../../components/Design/AnimatedButton';
import { getDailyTransactions, exportTransactionsPDF } from '../api/financeApi';

const FinanceTransactionDetailModal = ({
  isOpen,
  onClose,
  selectedPeriod,
  selectedDate,
  selectedBranchId,
  userData,
  onTransactionClick
}) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('income');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowOverlay(true);
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        setShowModal(true);
      }, 100);

      fetchTransactions();
    } else {
      setShowModal(false);
      document.body.style.overflow = "auto";
      setTimeout(() => {
        setShowOverlay(false);
        setTransactions([]);
        setError(null);
        setCurrentPage(1);
        setHasMore(true);
      }, 300);
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen, activeTab, selectedPeriod, selectedDate, selectedBranchId]);

  const fetchTransactions = async (page = 1, append = false) => {
    if (!userData) return;

    try {
      if (page === 1) {
        setLoading(true);
        setCurrentPage(1);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const params = {
        type: activeTab,
        period: selectedPeriod,
        date: selectedDate,
        tenant_id: userData.tenant.id,
        branch_id: selectedBranchId, // null = semua cabang
        page: page,
        limit: 20
      };

      // Adjust date format based on period
      if (selectedPeriod === 'weekly') {
        const date = new Date(selectedDate);
        const startDate = new Date(date);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);

        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = endDate.toISOString().split('T')[0];
      } else if (selectedPeriod === 'monthly') {
        params.date = selectedDate.substring(0, 7);
      }

      const response = await getDailyTransactions(params);
      const transactionsData = response.transactions || [];

      if (append) {
        setTransactions(prev => [...prev, ...transactionsData]);
      } else {
        setTransactions(transactionsData);
      }

      // Check if there are more pages
      setHasMore(transactionsData.length === params.limit);
      setCurrentPage(page);

    } catch (err) {
      setError('Gagal memuat data transaksi. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchTransactions(currentPage + 1, true);
    }
  };

  const handleExportPDF = async () => {
    if (exporting || !userData) return;
    try {
      setExporting(true);
      const params = {
        type: activeTab,
        period: selectedPeriod,
        date: selectedDate,
        tenant_id: userData.tenant?.id || userData.tenant_id,
        branch_id: selectedBranchId,
      };

      // Adjust date format based on period
      if (selectedPeriod === 'weekly') {
        const date = new Date(selectedDate);
        const startDate = new Date(date);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = endDate.toISOString().split('T')[0];
      } else if (selectedPeriod === 'monthly') {
        params.date = selectedDate.substring(0, 7);
      }

      await exportTransactionsPDF(params);
    } catch (error) {
      console.error('Export PDF failed:', error);
      alert('Gagal mengexport PDF. Silakan coba lagi.');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount) => {
    const absoluteAmount = Math.abs(amount || 0);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(absoluteAmount);
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionSign = (transaction) => {
    // For expense tab, always show negative sign
    if (activeTab === 'expense') {
      return '-';
    }

    // Determine sign based on transaction type
    if (transaction.type === 'income') {
      return '+';
    } else if (transaction.type === 'expense') {
      return '-';
    }

    // Fallback: determine by amount if type is not available
    if (transaction.amount && transaction.amount > 0) {
      return '+';
    }
    return '-';
  };

  const getTransactionIcon = (transaction) => {
    const sign = getTransactionSign(transaction);
    if (sign === '+') {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    }
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getTransactionBgColor = (transaction) => {
    const sign = getTransactionSign(transaction);
    if (sign === '+') {
      return 'bg-green-100';
    }
    return 'bg-red-100';
  };

  const getTransactionAmountColor = (transaction) => {
    const sign = getTransactionSign(transaction);
    if (sign === '+') {
      return 'text-green-600';
    }
    return 'text-red-600';
  };

  if (!showOverlay) return null;

  const tabs = [
    { key: 'income', label: 'Income' },
    { key: 'expense', label: 'Expense' }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-8"
      style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(2rem, env(safe-area-inset-left))',
        paddingRight: 'max(2rem, env(safe-area-inset-right))'
      }}
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${showModal ? 'opacity-50' : 'opacity-0'
          }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh] transition-all duration-300 ${showModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-800">Transaksi</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-2 hover:bg-blue-50 rounded-xl transition-colors text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              title="Export PDF"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>{exporting ? 'Loading...' : 'Export PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-gray-100 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          className="p-6 overflow-y-auto flex-1 rounded-b-2xl"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-3 text-sm text-gray-600">Memuat transaksi...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <AnimatedButton
                onClick={fetchTransactions}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Coba Lagi
              </AnimatedButton>
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-sm text-gray-600">Belum ada transaksi untuk periode ini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => {
                return (
                  <div
                    key={transaction.id}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => onTransactionClick && onTransactionClick(transaction)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-8 h-8 ${getTransactionBgColor(transaction)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        {getTransactionIcon(transaction)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <div className="mb-1">
                          <h3 className="font-medium text-gray-800 truncate text-sm">
                            {transaction.description || 'Transaksi'}
                          </h3>
                        </div>

                        {/* Date and Account */}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <div className="flex items-center gap-1 min-w-0">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{formatDateTime(transaction.date)}</span>
                          </div>
                          <span className="flex-shrink-0">•</span>
                          <span className="truncate">{transaction.account_name || 'Cash'}</span>
                        </div>
                      </div>

                      {/* Amount and Arrow */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`font-bold text-sm ${getTransactionAmountColor(transaction)}`}>
                          {getTransactionSign(transaction)}{formatCurrency(transaction.amount)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Load More Button */}
              {hasMore && (
                <div className="pt-3">
                  <AnimatedButton
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memuat...</span>
                      </>
                    ) : (
                      <span>Load More</span>
                    )}
                  </AnimatedButton>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceTransactionDetailModal;