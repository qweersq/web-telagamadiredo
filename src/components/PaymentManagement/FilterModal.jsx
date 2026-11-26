import React from 'react';
import { FaTimes, FaSearch, FaFilter } from 'react-icons/fa';
import AnimatedButton from '../Design/AnimatedButton';

const FilterModal = ({ isOpen, onClose, filters, onFilterChange, onClearFilters, onSearch }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <FaFilter className="text-xl" />
              </div>
              <div>
                <h2 className="text-lg font-semibold font-bold font-montserrat">Filter Payments</h2>
                <p className="text-blue-100 font-montserrat text-sm">Cari dan filter data payment</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors duration-200"
            >
              <FaTimes className="text-lg font-semibold" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Search Section */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-bold text-gray-800 font-montserrat mb-4 flex items-center gap-2">
                <FaSearch className="text-blue-500" />
                Search
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search tenant, payment reference, owner..."
                  value={filters.search}
                  onChange={(e) => onFilterChange('search', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && onSearch()}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-montserrat text-sm"
                />
                <AnimatedButton
                  onClick={onSearch}
                  className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-montserrat text-sm shadow-lg"
                >
                  Cari
                </AnimatedButton>
              </div>
            </div>

            {/* Filters Section */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-bold text-gray-800 font-montserrat mb-4 flex items-center gap-2">
                <FaFilter className="text-green-500" />
                Filters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => onFilterChange('status', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-montserrat text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                {/* Payment Method Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                    Payment Method
                  </label>
                  <select
                    value={filters.payment_method}
                    onChange={(e) => onFilterChange('payment_method', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-montserrat text-sm"
                  >
                    <option value="">All Methods</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="bca">BCA</option>
                    <option value="mandiri">Mandiri</option>
                    <option value="bri">BRI</option>
                    <option value="bni">BNI</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="e_wallet">E-Wallet</option>
                  </select>
                </div>

                {/* Start Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => onFilterChange('start_date', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-montserrat text-sm"
                  />
                </div>

                {/* End Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => onFilterChange('end_date', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-montserrat text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex justify-between">
            <AnimatedButton
              onClick={onClearFilters}
              className="px-6 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 font-montserrat font-medium"
            >
              Clear All Filters
            </AnimatedButton>
            <div className="flex gap-3">
              <AnimatedButton
                onClick={onClose}
                className="px-6 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg hover:from-gray-500 hover:to-gray-600 font-montserrat font-medium"
              >
                Cancel
              </AnimatedButton>
              <AnimatedButton
                onClick={() => {
                  onSearch();
                  onClose();
                }}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-montserrat font-medium"
              >
                Apply Filters
              </AnimatedButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
