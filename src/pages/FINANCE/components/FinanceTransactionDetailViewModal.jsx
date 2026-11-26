import React, { useEffect, useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import AnimatedButton from '../../../components/Design/AnimatedButton';
import { getTransactionDetail } from '../api/financeApi';

const FinanceTransactionDetailViewModal = ({ isOpen, onClose, transaction }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [transactionDetail, setTransactionDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowOverlay(true);
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        setShowModal(true);
      }, 100);
      
      if (transaction?.id) {
        fetchTransactionDetail();
      }
    } else {
      setShowModal(false);
      document.body.style.overflow = "auto";
      setTimeout(() => {
        setShowOverlay(false);
        setTransactionDetail(null);
      }, 300);
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen, transaction]);

  const fetchTransactionDetail = async () => {
    if (!transaction?.id) return;
    
    try {
      setLoading(true);
      const detailData = await getTransactionDetail(transaction.id);
      setTransactionDetail(detailData);
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  if (!showOverlay) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionTypeColor = (type) => {
    if (type === 'income') {
      return 'text-green-600 bg-green-50';
    }
    return 'text-red-600 bg-red-50';
  };

  const getTransactionTypeLabel = (type) => {
    if (type === 'income') {
      return 'Pemasukan';
    }
    return 'Pengeluaran';
  };

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
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          showModal ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[85vh] transition-all duration-300 ${
          showModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-800">Detail Transaksi</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div 
          className="p-6 overflow-y-auto flex-1"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-sm text-gray-600">Memuat detail...</span>
            </div>
          ) : transactionDetail ? (
            <div className="space-y-4">
              {/* Transaction Type */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-600">Jenis Transaksi</span>
                <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getTransactionTypeColor(transactionDetail.type)}`}>
                  {getTransactionTypeLabel(transactionDetail.type)}
                </span>
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-600">Jumlah</span>
                <span className={`text-base font-bold ${getTransactionTypeColor(transactionDetail.type).split(' ')[0]}`}>
                  {formatCurrency(transactionDetail.amount)}
                </span>
              </div>

              {/* Description */}
              <div className="py-2">
                <span className="text-sm font-medium text-gray-600 block mb-2">Deskripsi</span>
                <p className="text-sm text-gray-800">{transactionDetail.description || 'Tidak ada deskripsi'}</p>
              </div>

              {/* Category */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-600">Kategori</span>
                <span className="text-sm text-gray-800">{transactionDetail.category_name || 'Umum'}</span>
              </div>

              {/* Account */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-600">Akun</span>
                <span className="text-sm text-gray-800">{transactionDetail.account_name || 'Cash'}</span>
              </div>

              {/* Date */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-600">Tanggal</span>
                <span className="text-sm text-gray-800">{formatDateTime(transactionDetail.date)}</span>
              </div>

              {/* Source Information */}
              {transactionDetail.source && Object.keys(transactionDetail.source).length > 0 && (
                <div className="py-2">
                  <span className="text-sm font-medium text-gray-600 block mb-3">Informasi Sumber</span>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {transactionDetail.type === 'income' ? (
                      // Income source (payment details)
                      <>
                        {transactionDetail.source.order_id && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Order ID:</span>
                            <span className="text-gray-800 font-medium">{transactionDetail.source.order_id}</span>
                          </div>
                        )}
                        {transactionDetail.source.customer_name && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Customer:</span>
                            <span className="text-gray-800 font-medium">{transactionDetail.source.customer_name}</span>
                          </div>
                        )}
                        {transactionDetail.source.customer_phone && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Phone:</span>
                            <span className="text-gray-800 font-medium">{transactionDetail.source.customer_phone}</span>
                          </div>
                        )}
                        {transactionDetail.source.order_type && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tipe Order:</span>
                            <span className="text-gray-800 font-medium capitalize">{transactionDetail.source.order_type}</span>
                          </div>
                        )}
                        {transactionDetail.source.payment_method && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Payment Method:</span>
                            <span className="text-gray-800 font-medium uppercase">{transactionDetail.source.payment_method}</span>
                          </div>
                        )}
                        {transactionDetail.source.entry_date && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tanggal Entry:</span>
                            <span className="text-gray-800 font-medium">{transactionDetail.source.entry_date}</span>
                          </div>
                        )}
                        {transactionDetail.source.payment && (
                          <>
                            {transactionDetail.source.payment.id && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Payment ID:</span>
                                <span className="text-gray-800 font-medium">{transactionDetail.source.payment.id}</span>
                              </div>
                            )}
                            {transactionDetail.source.payment.final_price && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Final Price:</span>
                                <span className="text-gray-800 font-medium">{formatCurrency(transactionDetail.source.payment.final_price)}</span>
                              </div>
                            )}
                            {transactionDetail.source.payment.status && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Status:</span>
                                <span className={`font-medium px-2 py-1 rounded-lg text-sm ${
                                  transactionDetail.source.payment.status === 'paid' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {transactionDetail.source.payment.status}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      // Expense source
                      <>
                        {transactionDetail.source.expense_id && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Expense ID:</span>
                            <span className="text-gray-800 font-medium">{transactionDetail.source.expense_id}</span>
                          </div>
                        )}
                        {transactionDetail.source.expense_name && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Nama Expense:</span>
                            <span className="text-gray-800 font-medium">{transactionDetail.source.expense_name}</span>
                          </div>
                        )}
                        {transactionDetail.source.expense_description && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Deskripsi:</span>
                            <span className="text-gray-800 font-medium">{transactionDetail.source.expense_description}</span>
                          </div>
                        )}
                        {transactionDetail.source.amount && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Amount:</span>
                            <span className="text-gray-800 font-medium">{formatCurrency(transactionDetail.source.amount)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-sm text-gray-600">Gagal memuat detail transaksi</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
          <AnimatedButton
            onClick={onClose}
            className="w-full py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
          >
            Tutup
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

export default FinanceTransactionDetailViewModal;
