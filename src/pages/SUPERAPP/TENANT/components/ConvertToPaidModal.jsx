import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheckCircle } from 'react-icons/fa';
import tenantService from '../services/tenantService';
import api from '../../../../config/api';

/**
 * Convert to Paid Modal - Simple & Clean
 */
const ConvertToPaidModal = ({ tenant, onClose, onSuccess }) => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingPlans, setFetchingPlans] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setFetchingPlans(true);
      const response = await api.get('/subscription-plans');
      if (response.data.success) {
        const activePlans = response.data.data.filter(plan => plan.is_active && plan.name !== 'Trial');
        setPlans(activePlans);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to load subscription plans');
    } finally {
      setFetchingPlans(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedPlan) {
      setError('Please select a subscription plan');
      return;
    }

    try {
      setLoading(true);
      const response = await tenantService.convertToPaid(tenant.id, selectedPlan);
      
      if (response.success) {
        alert('Tenant successfully converted to paid subscription!');
        onSuccess();
      } else {
        setError(response.message || 'Failed to convert tenant');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Convert to Paid Subscription</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Tenant Info */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-xs text-gray-500">Tenant</div>
              <div className="text-sm font-semibold text-gray-900">{tenant.business_name}</div>
              <div className="text-xs text-gray-500 mt-1">Owner: {tenant.owner_name}</div>
            </div>

            {/* Plans */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Subscription Plan:
              </label>
              
              {fetchingPlans ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading plans...</p>
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600">No active plans available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {plans.map(plan => (
                    <label
                      key={plan.id}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPlan === plan.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={selectedPlan === plan.id}
                        onChange={(e) => setSelectedPlan(parseInt(e.target.value))}
                        className="mr-4"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-gray-900">{plan.name}</div>
                          <div className="text-lg font-bold text-blue-600">
                            {formatCurrency(plan.price)}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {plan.duration_days} days • {plan.description || 'Standard features'}
                        </div>
                      </div>
                      {selectedPlan === plan.id && (
                        <FaCheckCircle className="text-blue-600 ml-3" />
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-sm font-medium text-yellow-900 mb-2">
                ⚠️ Important Information:
              </div>
              <ul className="text-xs text-yellow-800 space-y-1">
                <li>• Trial will end immediately</li>
                <li>• Billing invoice will be generated</li>
                <li>• Paid subscription features will be activated</li>
                <li>• Tenant will be notified via email</li>
              </ul>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedPlan || fetchingPlans}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-sm transition-colors"
            >
              {loading ? 'Converting...' : 'Convert Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConvertToPaidModal;

