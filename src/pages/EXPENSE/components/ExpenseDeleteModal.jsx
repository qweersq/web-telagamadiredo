import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import AnimatedButton from '../../../components/Design/AnimatedButton';

const ExpenseDeleteModal = ({ isOpen, onClose, onConfirm, expense }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowOverlay(true);
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        setShowModal(true);
      }, 100);
    } else {
      setShowModal(false);
      document.body.style.overflow = "auto";
      setTimeout(() => {
        setShowOverlay(false);
      }, 300);
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
    } catch (error) {
      console.error('Error deleting expense:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen || !expense) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-50 ${
          showOverlay ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-8 transition-all duration-300 ${
          showModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        style={{
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(2rem, env(safe-area-inset-left))',
          paddingRight: 'max(2rem, env(safe-area-inset-right))'
        }}
      >
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
            <h2 className="text-xl font-semibold text-gray-800">Hapus Pengeluaran</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1" style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}>
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-4 rounded-full">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
            </div>

            {/* Warning Message */}
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Apakah Anda yakin?
              </h3>
              <p className="text-gray-600 mb-4">
                Anda akan menghapus pengeluaran berikut:
              </p>
              
              {/* Expense Info */}
              <div className="bg-gray-50 p-4 rounded-lg text-left">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Nama:</span>
                    <span className="font-medium text-gray-800">{expense.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Jumlah:</span>
                    <span className="font-medium text-red-600">{formatCurrency(expense.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tanggal:</span>
                    <span className="font-medium text-gray-800">
                      {new Date(expense.date).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">
                    Perhatian!
                  </h4>
                  <p className="text-sm text-yellow-700">
                    Tindakan ini akan menghapus pengeluaran dan mengembalikan saldo akun keuangan. 
                    Data yang sudah dihapus tidak dapat dikembalikan.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 p-6 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isDeleting}
            >
              Batal
            </button>
            <AnimatedButton
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Hapus
                </>
              )}
            </AnimatedButton>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExpenseDeleteModal;
