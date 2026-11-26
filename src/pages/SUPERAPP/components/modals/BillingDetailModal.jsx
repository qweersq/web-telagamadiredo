import React from 'react';
import { FaTimes, FaSpinner } from 'react-icons/fa';
import BillingDetailContent from '../BillingDetailContent';
import BillingActionButtons from './BillingActionButtons';

const BillingDetailModal = ({ 
  isOpen, 
  onClose, 
  billing, 
  tenant, 
  subscription, 
  plan,
  availableActions = [],
  onAction,
  isLoading = false,
  title = "Billing Details"
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 font-montserrat">
                {title}
              </h2>
              <p className="text-sm text-gray-500 font-montserrat">
                {billing?.invoice_number ? `Invoice: ${billing.invoice_number}` : 'Billing Information'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            disabled={isLoading}
          >
            <FaTimes className="text-gray-500 text-lg" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FaSpinner className="text-4xl text-blue-600 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 font-montserrat mb-2">
                  Loading...
                </h3>
                <p className="text-sm text-gray-500 font-montserrat">
                  Please wait while we fetch the billing details
                </p>
              </div>
            </div>
          ) : (
            <BillingDetailContent 
              billing={billing}
              tenant={tenant}
              subscription={subscription}
              plan={plan}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <BillingActionButtons
            billing={billing}
            availableActions={availableActions}
            onAction={onAction}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default BillingDetailModal;
