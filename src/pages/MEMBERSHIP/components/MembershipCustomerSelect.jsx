import React from 'react';
import { User, X, Search, Plus, Crown, Coins } from 'lucide-react';
import { formatNumber } from '../../../utils/labelFormatter';

const MembershipCustomerSelect = ({ 
  selectedCustomer, 
  onSelect, 
  onRemove,
  onCustomerUpdate 
}) => {
  if (selectedCustomer) {
    const customerPoints = selectedCustomer.points ?? 0;
    const customerLifetimePoints = selectedCustomer.lifetime_points ?? 0;
    const hasPoints = customerPoints !== undefined || customerLifetimePoints !== undefined;

    return (
      <div className="bg-white rounded-xl border-2 border-blue-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-base text-gray-900 font-montserrat truncate">
                {selectedCustomer.name}
              </h4>
              <p className="text-sm text-gray-600 font-montserrat truncate">
                {selectedCustomer.phone || selectedCustomer.phone_number || '-'}
              </p>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="w-8 h-8 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
            title="Hapus customer"
          >
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>

        {/* Points Info */}
        {hasPoints && (
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200">
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
              <div className="flex items-center gap-1 mb-1">
                <Coins className="w-3 h-3 text-blue-600" />
                <span className="text-xs text-gray-600 font-medium font-montserrat">
                  Points
                </span>
              </div>
              <div className="text-sm font-bold text-blue-600 font-montserrat">
                {formatNumber(customerPoints)}
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
              <div className="flex items-center gap-1 mb-1">
                <Coins className="w-3 h-3 text-purple-600" />
                <span className="text-xs text-gray-600 font-medium font-montserrat">
                  Lifetime Points
                </span>
              </div>
              <div className="text-sm font-bold text-purple-600 font-montserrat">
                {formatNumber(customerLifetimePoints)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={onSelect}
      className="w-full bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 p-6 transition-all duration-200 group"
    >
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 bg-gray-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center transition-colors">
          <User className="w-8 h-8 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-700 font-montserrat group-hover:text-blue-700 transition-colors">
            Pilih Customer
          </p>
          <p className="text-xs text-gray-500 font-montserrat mt-1">
            Klik untuk mencari customer
          </p>
        </div>
      </div>
    </button>
  );
};

export default MembershipCustomerSelect;

