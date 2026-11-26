import React from 'react';
import AnimatedButton from '../Design/AnimatedButton';

const PaymentFilter = ({ filters, onFilterChange, onClearFilters, onSearch }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
      <h3 className="text-xl font-bold text-gray-800 font-montserrat mb-6">
        🔍 Filter Payments
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 font-montserrat mb-2">
            Search
          </label>
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
            <option value="manual_bank_transfer">Manual Bank Transfer</option>
            <option value="credit_card">Credit Card</option>
            <option value="e_wallet">E-Wallet</option>
          </select>
        </div>

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

        <div className="flex items-end">
          <AnimatedButton
            onClick={onClearFilters}
            className="w-full px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 font-montserrat text-sm shadow-lg"
          >
            Clear Filters
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

export default PaymentFilter;
