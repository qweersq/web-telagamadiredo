import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import tenantService from '../services/tenantService';

/**
 * Extend Trial Modal - Simple & Clean
 */
const ExtendTrialModal = ({ tenant, onClose, onSuccess }) => {
  const [selectedDays, setSelectedDays] = useState(7);
  const [customDays, setCustomDays] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dayOptions = [
    { value: 3, label: '3 days', date: getDateAfterDays(3) },
    { value: 7, label: '7 days', date: getDateAfterDays(7) },
    { value: 14, label: '14 days', date: getDateAfterDays(14) },
  ];

  function getDateAfterDays(days) {
    const date = new Date(tenant.trial_end_date);
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const days = selectedDays === 'custom' ? parseInt(customDays) : selectedDays;

    if (!days || days < 1 || days > 90) {
      setError('Please enter a valid number of days (1-90)');
      return;
    }

    try {
      setLoading(true);
      const response = await tenantService.extendTrial(tenant.id, days);
      
      if (response.success) {
        alert(`Trial extended successfully! New end date: ${getDateAfterDays(days)}`);
        onSuccess();
      } else {
        setError(response.message || 'Failed to extend trial');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Extend Trial Period</h3>
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
              <div className="text-xs text-gray-500 mt-1">
                Current end: {new Date(tenant.trial_end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>

            {/* Days Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extend by:
              </label>
              <div className="space-y-2">
                {dayOptions.map(option => (
                  <label
                    key={option.value}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="days"
                      value={option.value}
                      checked={selectedDays === option.value}
                      onChange={(e) => setSelectedDays(parseInt(e.target.value))}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{option.label}</div>
                      <div className="text-xs text-gray-500">New end: {option.date}</div>
                    </div>
                  </label>
                ))}
                
                {/* Custom Option */}
                <label className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="days"
                    value="custom"
                    checked={selectedDays === 'custom'}
                    onChange={() => setSelectedDays('custom')}
                    className="mr-3 mt-1"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 mb-2">Custom</div>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      placeholder="Enter days"
                      disabled={selectedDays !== 'custom'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                    />
                  </div>
                </label>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional):
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows="3"
                placeholder="Why are you extending the trial?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              />
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
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm transition-colors"
            >
              {loading ? 'Extending...' : 'Extend Trial'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExtendTrialModal;

