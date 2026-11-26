import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Filter } from 'lucide-react';
import AnimatedButton from '../Design/AnimatedButton';

const FilterModal = ({ isOpen, onClose, branches, selectedBranchId, onBranchChange, startDate, endDate, onDateChange, onApplyFilter }) => {
  const [localBranchId, setLocalBranchId] = useState(selectedBranchId);
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);

  useEffect(() => {
    if (isOpen) {
      setLocalBranchId(selectedBranchId);
      setLocalStartDate(startDate);
      setLocalEndDate(endDate);
    }
  }, [isOpen, selectedBranchId, startDate, endDate]);

  const handleApply = () => {
    onBranchChange(localBranchId);
    onDateChange(localStartDate, localEndDate);
    onApplyFilter();
    onClose();
  };

  const handleReset = () => {
    setLocalBranchId(null);
    setLocalStartDate('');
    setLocalEndDate('');
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 10);
  };

  const getTodayDate = () => {
    return new Date().toISOString().slice(0, 10);
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`bg-white rounded-2xl max-w-md w-full transform transition-transform shadow-2xl ${isOpen ? 'scale-100' : 'scale-95'}`}>
        {/* Header - Modern */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Filter Shift</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Content - Modern */}
        <div className="p-6 space-y-6">
          {/* Branch Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Cabang
            </label>
            <select
              value={localBranchId || ''}
              onChange={(e) => setLocalBranchId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 font-medium transition-all duration-200"
            >
              <option value="">Semua Cabang</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range - Modern */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Tanggal
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="date"
                  value={formatDateForInput(localStartDate)}
                  onChange={(e) => setLocalStartDate(e.target.value)}
                  max={getTodayDate()}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 font-medium transition-all duration-200"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={formatDateForInput(localEndDate)}
                  onChange={(e) => setLocalEndDate(e.target.value)}
                  max={getTodayDate()}
                  min={formatDateForInput(localStartDate)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 font-medium transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Modern */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Reset
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Batal
            </button>
            <AnimatedButton
              onClick={handleApply}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Terapkan
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
