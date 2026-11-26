import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, DollarSign, FileText, Tag } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../utils/labelFormatter';

const ExpenseDetailModal = ({ isOpen, onClose, expense, branchName }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showModal, setShowModal] = useState(false);

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
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col max-h-[85vh]">
          {/* Header - Compact */}
          <div className="flex items-center justify-between p-3 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
            <h2 className="text-lg font-semibold text-gray-800">Detail Pengeluaran</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content - Compact */}
          <div className="p-3 space-y-3 overflow-y-auto flex-1" style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}>
            {/* Status Badge - Compact */}
            <div className="flex items-center justify-center">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                expense.status === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {expense.status === 'completed' ? 'Selesai' : 'Pending'}
              </span>
            </div>

            {/* Expense Info - Compact */}
            <div className="space-y-2">
              {/* Nama Pengeluaran - Compact */}
              <div className="flex items-start gap-2">
                <div className="bg-red-100 p-1.5 rounded-lg">
                  <DollarSign size={14} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-800">{expense.name}</h3>
                  <p className="text-lg font-bold text-red-600 mt-0.5">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>
              </div>

              {/* Info Grid - Compact */}
              <div className="grid grid-cols-1 gap-2">
                {/* Tanggal */}
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-1.5 rounded-lg">
                    <Calendar size={12} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600">Tanggal</p>
                    <p className="text-sm font-medium text-gray-800">{formatDate(expense.date)}</p>
                  </div>
                </div>

                {/* Cabang */}
                <div className="flex items-center gap-2">
                  <div className="bg-green-100 p-1.5 rounded-lg">
                    <MapPin size={12} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600">Cabang</p>
                    <p className="text-sm font-medium text-gray-800">{branchName}</p>
                  </div>
                </div>

                {/* Akun Keuangan */}
                {expense.finance_account && (
                  <div className="flex items-center gap-2">
                    <div className="bg-purple-100 p-1.5 rounded-lg">
                      <FileText size={12} className="text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">Pembayaran</p>
                      <p className="text-sm font-medium text-gray-800">{expense.finance_account.name}</p>
                    </div>
                  </div>
                )}

                {/* Kategori */}
                {expense.finance_category && (
                  <div className="flex items-center gap-2">
                    <div className="bg-orange-100 p-1.5 rounded-lg">
                      <Tag size={12} className="text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">Kategori</p>
                      <p className="text-sm font-medium text-gray-800">{expense.finance_category.name}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Deskripsi - Compact */}
              {expense.description && (
                <div className="bg-gray-50 p-2 rounded-lg">
                  <h4 className="text-xs font-medium text-gray-600 mb-1">Deskripsi</h4>
                  <p className="text-sm text-gray-800">{expense.description}</p>
                </div>
              )}

              {/* Created/Updated Info - Compact */}
              <div className="border-t pt-2">
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>Dibuat: {new Date(expense.createdAt).toLocaleString('id-ID')}</p>
                  {expense.updatedAt !== expense.createdAt && (
                    <p>Diupdate: {new Date(expense.updatedAt).toLocaleString('id-ID')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Compact */}
          <div className="p-3 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
            <button
              onClick={onClose}
              className="w-full px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExpenseDetailModal;
