import React, { useState } from 'react';
import { 
  FaTimes, 
  FaExclamationTriangle, 
  FaClock, 
  FaCheckCircle,
  FaReceipt,
  FaSpinner
} from 'react-icons/fa';
import AnimatedButton from '../../../../components/Design/AnimatedButton';

const BillingActionButtons = ({ 
  billing, 
  availableActions, 
  onAction, 
  onCancel, 
  isLoading = false 
}) => {
  const [confirmAction, setConfirmAction] = useState(null);

  if (!availableActions || availableActions.length === 0) {
    return (
      <div className="flex justify-end">
        <AnimatedButton
          onClick={onCancel}
          variant="gray"
          className="px-6 py-2 text-sm font-semibold flex items-center gap-2 whitespace-nowrap"
        >
          <FaTimes className="text-sm flex-shrink-0" />
          <span>Close</span>
        </AnimatedButton>
      </div>
    );
  }

  const getActionConfig = (action) => {
    const configs = {
      'failed': {
        label: 'Mark as Failed',
        icon: FaExclamationTriangle,
        variant: 'red',
        confirmMessage: 'Are you sure you want to mark this billing as failed? This will suspend the tenant.'
      },
      'pending': {
        label: 'Mark as Pending',
        icon: FaClock,
        variant: 'yellow',
        confirmMessage: 'Are you sure you want to mark this billing as pending?'
      },
      'paid': {
        label: 'Mark as Paid',
        icon: FaCheckCircle,
        variant: 'green',
        confirmMessage: 'Are you sure you want to mark this billing as paid?'
      },
      'unpaid': {
        label: 'Mark as Unpaid',
        icon: FaTimes,
        variant: 'gray',
        confirmMessage: 'Are you sure you want to mark this billing as unpaid?'
      },
      'cancelled': {
        label: 'Cancel Billing',
        icon: FaTimes,
        variant: 'gray',
        confirmMessage: 'Are you sure you want to cancel this billing? This action cannot be undone.'
      },
      'refunded': {
        label: 'Refund Billing',
        icon: FaReceipt,
        variant: 'blue',
        confirmMessage: 'Are you sure you want to refund this billing? This action cannot be undone.'
      }
    };
    return configs[action] || {
      label: action.charAt(0).toUpperCase() + action.slice(1),
      icon: FaCheckCircle,
      variant: 'blue',
      confirmMessage: `Are you sure you want to mark this billing as ${action}?`
    };
  };

  const handleActionClick = (action) => {
    setConfirmAction(action);
  };

  const handleConfirmAction = () => {
    if (confirmAction && onAction) {
      onAction(billing.id, confirmAction);
    }
    setConfirmAction(null);
  };

  const handleCancelConfirm = () => {
    setConfirmAction(null);
  };

  return (
    <div className="space-y-4">
      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FaExclamationTriangle className="text-yellow-600 text-lg" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 font-montserrat">Confirm Action</h3>
            </div>
            <p className="text-sm text-gray-600 font-montserrat mb-6">
              {getActionConfig(confirmAction).confirmMessage}
            </p>
            <div className="flex gap-3 justify-end">
              <AnimatedButton
                onClick={handleCancelConfirm}
                variant="gray"
                className="px-4 py-2 text-sm font-semibold flex items-center gap-2 whitespace-nowrap"
              >
                <FaTimes className="text-sm flex-shrink-0" />
                <span>Cancel</span>
              </AnimatedButton>
              <AnimatedButton
                onClick={handleConfirmAction}
                variant={getActionConfig(confirmAction).variant}
                className="px-4 py-2 text-sm font-semibold flex items-center gap-2 whitespace-nowrap"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="text-sm flex-shrink-0 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    {React.createElement(getActionConfig(confirmAction).icon, { className: "text-sm flex-shrink-0" })}
                    <span>Confirm</span>
                  </>
                )}
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-end">
        {availableActions.map((action) => {
          const config = getActionConfig(action);
          const IconComponent = config.icon;
          
          return (
            <AnimatedButton
              key={action}
              onClick={() => handleActionClick(action)}
              variant={config.variant}
              className="px-4 py-2 text-sm font-semibold flex items-center gap-2 whitespace-nowrap"
              disabled={isLoading}
            >
              <IconComponent className="text-sm flex-shrink-0" />
              <span>{config.label}</span>
            </AnimatedButton>
          );
        })}
        
        <AnimatedButton
          onClick={onCancel}
          variant="gray"
          className="px-4 py-2 text-sm font-semibold flex items-center gap-2 whitespace-nowrap"
          disabled={isLoading}
        >
          <FaTimes className="text-sm flex-shrink-0" />
          <span>Cancel</span>
        </AnimatedButton>
      </div>
    </div>
  );
};

export default BillingActionButtons;
