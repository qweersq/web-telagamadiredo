import React from 'react';
import SubscriptionValidationService from '../../services/subscriptionValidationService';

/**
 * Modal untuk menampilkan validasi subscription limits
 * Clean, modern design dengan actionable buttons
 */
const SubscriptionValidationModal = ({ 
    isOpen, 
    onClose, 
    subscriptionData, 
    validationType, 
    onConfirm, 
    onUpgrade 
}) => {
    if (!isOpen) return null;

    const getValidationResult = () => {
        switch (validationType) {
            case 'branch':
                return SubscriptionValidationService.validateBranchCreation(subscriptionData);
            case 'user':
            case 'users': // Support both singular and plural
                return SubscriptionValidationService.validateUserCreation(subscriptionData);
            case 'order':
                return SubscriptionValidationService.validateOrderCreation(subscriptionData);
            default:
                return { isValid: false, message: 'Invalid validation type', type: 'error' };
        }
    };

    const validation = getValidationResult();
    const { isValid, message, current, max, type } = validation;

    const getIcon = () => {
        switch (type) {
            case 'error':
                return (
                    <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-12 h-12 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                );
            case 'success':
                return (
                    <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const getTitle = () => {
        switch (validationType) {
            case 'branch':
                return 'Validasi Pembuatan Outlet';
            case 'user':
            case 'users': // Support both singular and plural
                return 'Validasi Pembuatan User';
            case 'order':
                return 'Validasi Pembuatan Order';
            default:
                return 'Validasi Subscription';
        }
    };

    const getBackgroundColor = () => {
        switch (type) {
            case 'error':
                return 'bg-red-50';
            case 'warning':
                return 'bg-yellow-50';
            case 'success':
                return 'bg-green-50';
            default:
                return 'bg-gray-50';
        }
    };

    const getBorderColor = () => {
        switch (type) {
            case 'error':
                return 'border-red-200';
            case 'warning':
                return 'border-yellow-200';
            case 'success':
                return 'border-green-200';
            default:
                return 'border-gray-200';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                {/* Header */}
                <div className={`px-6 py-4 rounded-t-lg ${getBackgroundColor()} ${getBorderColor()} border-b`}>
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800">
                            {getTitle()}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="text-center mb-6">
                        <div className="flex justify-center mb-4">
                            {getIcon()}
                        </div>
                        <p className="mt-4 text-gray-700">
                            {message}
                        </p>
                        {max !== 'unlimited' && max !== null && max !== undefined && (
                            <p className="mt-2 text-sm text-gray-500">
                                Penggunaan saat ini: {current !== undefined && current !== null ? current : 0}/{max}
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {isValid ? (
                            <>
                                <button
                                    onClick={onConfirm}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                                >
                                    Lanjutkan
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                                >
                                    Batal
                                </button>
                            </>
                        ) : (
                            <>
                                {onUpgrade && (
                                    <button
                                        onClick={onUpgrade}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                                    >
                                        Upgrade Paket
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                                >
                                    Tutup
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionValidationModal;
