import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaTimes, FaCheck } from 'react-icons/fa';
import AnimatedButton from '../Design/AnimatedButton';

const DateFilterModal = ({ isOpen, onClose, onApplyFilter, onClearFilter, currentFilter }) => {
  const [startDate, setStartDate] = useState(currentFilter?.start_date || '');
  const [endDate, setEndDate] = useState(currentFilter?.end_date || '');
  const [selectedPreset, setSelectedPreset] = useState(currentFilter?.preset || '');

  // Sync state when modal opens or currentFilter changes
  useEffect(() => {
    if (isOpen) {
      setStartDate(currentFilter?.start_date || '');
      setEndDate(currentFilter?.end_date || '');
      setSelectedPreset(currentFilter?.preset || '');
    }
  }, [isOpen, currentFilter]);

  const presets = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'this_week' },
    { label: 'This Month', value: 'this_month' },
    { label: 'Last Month', value: 'last_month' },
    { label: 'Last 7 Days', value: 'last_7_days' },
    { label: 'Last 30 Days', value: 'last_30_days' },
    { label: 'Custom', value: 'custom' }
  ];

  const handlePresetChange = (preset) => {
    setSelectedPreset(preset);
    
    const today = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    switch (preset) {
      case 'today':
        setStartDate(formatDate(today));
        setEndDate(formatDate(today));
        break;
      case 'this_week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        setStartDate(formatDate(startOfWeek));
        setEndDate(formatDate(today));
        break;
      case 'this_month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(formatDate(startOfMonth));
        setEndDate(formatDate(today));
        break;
      case 'last_month':
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        setStartDate(formatDate(startOfLastMonth));
        setEndDate(formatDate(endOfLastMonth));
        break;
      case 'last_7_days':
        const last7Days = new Date(today);
        last7Days.setDate(today.getDate() - 7);
        setStartDate(formatDate(last7Days));
        setEndDate(formatDate(today));
        break;
      case 'last_30_days':
        const last30Days = new Date(today);
        last30Days.setDate(today.getDate() - 30);
        setStartDate(formatDate(last30Days));
        setEndDate(formatDate(today));
        break;
      case 'custom':
        setStartDate('');
        setEndDate('');
        break;
      default:
        break;
    }
  };

  const handleApplyFilter = () => {
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        alert('Start date cannot be after end date');
        return;
      }
    }
    
    // Tentukan preset yang tepat
    // Jika selectedPreset sudah 'custom' atau kosong tapi ada custom date, set ke 'custom'
    let finalPreset = selectedPreset;
    if (selectedPreset === 'custom' || (!selectedPreset && startDate && endDate)) {
      finalPreset = 'custom';
    }
    
    onApplyFilter({
      start_date: startDate || null,
      end_date: endDate || null,
      preset: finalPreset
    });
    onClose();
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setSelectedPreset('');
    if (onClearFilter) {
      onClearFilter();
    } else {
      onApplyFilter({
        start_date: null,
        end_date: null,
        preset: ''
      });
    }
    onClose();
  };

  const formatDateRange = () => {
    if (!startDate && !endDate) return 'All Time';
    if (startDate && endDate) {
      return `${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`;
    }
    if (startDate) return `From ${new Date(startDate).toLocaleDateString('id-ID')}`;
    if (endDate) return `Until ${new Date(endDate).toLocaleDateString('id-ID')}`;
    return 'All Time';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <FaCalendarAlt className="text-blue-600 text-lg" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 font-montserrat">Filter Statistics
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <FaTimes className="text-gray-600 text-sm" />
          </button>
        </div>

        {/* Current Filter Display */}
        <div className="mb-6 p-3 bg-blue-50 rounded-xl">
          <p className="text-sm text-gray-600 font-montserrat mb-1">Current Filter:</p>
          <p className="text-base font-bold text-blue-800 font-montserrat">
            {formatDateRange()}
          </p>
        </div>

        {/* Preset Options */}
        <div className="mb-6">
          <h3 className="text-base font-bold text-gray-700 font-montserrat mb-3">
            Quick Select
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handlePresetChange(preset.value)}
                className={`px-3 py-2 rounded-lg text-sm font-montserrat transition-colors ${
                  selectedPreset === preset.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        <div className="mb-6">
          <h3 className="text-base font-bold text-gray-700 font-montserrat mb-3">
            Custom Date Range
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 font-montserrat mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSelectedPreset('custom');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-montserrat text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 font-montserrat mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSelectedPreset('custom');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-montserrat text-sm"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <AnimatedButton
            onClick={handleClearFilter}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-montserrat text-sm"
          >
            Clear Filter
          </AnimatedButton>
          <AnimatedButton
            onClick={handleApplyFilter}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-montserrat text-sm"
          >
            <FaCheck className="inline mr-2" />
            Apply Filter
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

export default DateFilterModal;
