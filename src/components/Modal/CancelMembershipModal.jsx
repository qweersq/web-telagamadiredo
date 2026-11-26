import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { getMembershipBadgeColor } from '../../utils/labelFormatter';

const CancelMembershipModal = ({ isOpen, onClose, customer, onConfirm }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !customer || !customer.current_membership) return null;

  const membership = customer.current_membership;
  const membershipInfo = membership.membership;

  // Calculate days remaining
  const calculateDaysRemaining = () => {
    const endDate = new Date(membership.end_date);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = calculateDaysRemaining();

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(customer);
      onClose();
    } catch (error) {
      console.error('Error cancelling membership:', error);
      alert('Gagal membatalkan membership');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">
            Batalkan Membership
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <FaTimes className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Customer Info */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-gray-600 font-bold text-lg">
                {customer.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-1">{customer.name}</h3>
            <p className="text-gray-600 text-sm mb-3">{customer.phone}</p>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getMembershipBadgeColor(membershipInfo.name)}`}>
              {membershipInfo.name}
            </div>
            
            {/* Membership Type Info */}
            {membership.payment_id ? (
              <div className="mt-2 text-xs text-blue-600 font-medium">
                💳 Membership Bayar Langsung
              </div>
            ) : (
              <div className="mt-2 text-xs text-purple-600 font-medium">
                ⚡ Membership Via Lifetime Points
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-gray-700 text-center mb-2">
              Membership akan dibatalkan dan tidak dapat dikembalikan
            </p>
            {membership.payment_id && (
              <p className="text-xs text-blue-600 text-center">
                Setelah dibatalkan, tier akan dikembalikan sesuai lifetime points saat ini
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                isSubmitting
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Membatalkan...
                </>
              ) : (
                'Batalkan'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelMembershipModal;
