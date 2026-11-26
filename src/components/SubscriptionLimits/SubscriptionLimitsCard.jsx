import React from 'react';

/**
 * Component untuk menampilkan subscription limits - DYNAMIC
 * Simple, modern design tanpa progress bar dan persentase
 */
const SubscriptionLimitsCard = ({ subscriptionData, onUpgrade, type = 'branches' }) => {
    if (!subscriptionData || !subscriptionData.plan) {
        return null;
    }

    const { plan } = subscriptionData;
    
    // Dynamic data based on type
    const getLimitData = () => {
        switch (type) {
            case 'users':
                return {
                    current: plan.current_users,
                    max: plan.max_users,
                    label: 'Akun User'
                };
            case 'branches':
            default:
                return {
                    current: plan.current_branches,
                    max: plan.max_branches,
                    label: 'Outlet'
                };
        }
    };

    const limitData = getLimitData();
    const { current, max, label } = limitData;
    
    // Simple status check
    const isAtLimit = max ? current >= max : false;
    const isNearLimit = max ? current >= max * 0.8 : false;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
            {/* Single Row - Just text with justify-between */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">
                    Batasan {label}: {current} dari {max || '∞'} {label.toLowerCase()}
                </span>
                    {/* ✅ NEW: Info untuk users - owner sudah terhitung */}
                    {type === 'users' && (
                        <span className="text-xs text-gray-500 mt-0.5">
                            (Termasuk akun owner Anda)
                        </span>
                    )}
                </div>
                <div></div>
            </div>

            {/* Simple Warning */}
            {(isNearLimit || isAtLimit) && (
                <div className="mt-3 p-2 rounded-lg bg-yellow-50 border border-yellow-200">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs text-yellow-800">
                            {isAtLimit 
                                ? `Anda telah mencapai batas maksimal ${max} ${label.toLowerCase()}`
                                : `Anda hampir mencapai batas maksimal ${max} ${label.toLowerCase()}`
                            }
                        </span>
                    </div>
                </div>
            )}

            {/* Simple Upgrade Button */}
            {/* {isAtLimit && onUpgrade && (
                <div className="mt-3">
                    <button
                        onClick={onUpgrade}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200"
                    >
                        Upgrade Paket
                    </button>
                </div>
            )} */}
        </div>
    );
};

export default SubscriptionLimitsCard;
