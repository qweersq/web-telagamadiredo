import React from 'react';
import { FaTimes, FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

/**
 * Validation Results Modal - Show billing validation results
 */
const ValidationResultsModal = ({ results, tenant, onClose, onRefresh }) => {
  if (!results) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'generated':
      case 'valid':
        return <FaCheckCircle className="text-green-600" />;
      case 'error':
      case 'invalid':
        return <FaExclamationCircle className="text-red-600" />;
      default:
        return <FaInfoCircle className="text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'generated':
      case 'valid':
        return 'bg-green-50 border-green-200';
      case 'error':
      case 'invalid':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const validationTypes = {
    'active_subscription_expiration': 'Subscription Expiration Check',
    'active_expired_billing': 'Active Expired Billing',
    'h1_trial_billing': 'H-1 Trial Billing',
    'h7_active_billing': 'H-7 Active Billing',
    'expired_tenant_billing': 'Expired Tenant Billing',
    'single_billing_rule': 'Single Billing Rule'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold">⚡ Billing Validation Results</h2>
            <p className="text-sm text-gray-300 mt-1">{tenant?.business_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FaTimes className="text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Tenant Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm font-semibold text-blue-900">Tenant Status</div>
                <div className="text-sm text-blue-700 mt-1">
                  <span className="font-medium">Status:</span> {results.tenant_status} • 
                  <span className="font-medium ml-2">Subscription:</span> {results.subscription_status}
                </div>
              </div>
            </div>
          </div>

          {/* Validation Results */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              Validation Checks ({results.validations?.length || 0})
            </h3>
            
            {results.validations?.map((validation, index) => (
              <div 
                key={index}
                className={`border rounded-lg p-4 ${getStatusColor(validation.status)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getStatusIcon(validation.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {validationTypes[validation.type] || validation.type}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        validation.status === 'generated' || validation.status === 'valid' ? 'bg-green-100 text-green-700' :
                        validation.status === 'error' || validation.status === 'invalid' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {validation.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {validation.message}
                    </p>
                    
                    {/* Show additional details if available */}
                    {validation.result?.count > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-600">
                          Generated {validation.result.count} billing(s)
                        </p>
                      </div>
                    )}
                    
                    {validation.error && (
                      <div className="mt-2 pt-2 border-t border-red-200">
                        <p className="text-xs text-red-600">
                          Error: {validation.error}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {results.validations?.filter(v => v.status === 'generated' || v.status === 'valid').length || 0}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Success</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600">
                    {results.validations?.filter(v => v.status === 'skipped').length || 0}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Skipped</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {results.validations?.filter(v => v.status === 'error').length || 0}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Errors</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onRefresh();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Refresh Billing
          </button>
        </div>
      </div>
    </div>
  );
};

export default ValidationResultsModal;

