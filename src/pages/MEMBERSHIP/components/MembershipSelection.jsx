import React from 'react';
import { Crown, CreditCard, Zap } from 'lucide-react';
import { formatCurrency, getMembershipDiscountDisplay } from '../../../utils/labelFormatter';

const MembershipSelection = ({ memberships, selectedMembership, onSelect, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600 font-montserrat">Memuat membership...</span>
      </div>
    );
  }

  if (memberships.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2 font-montserrat">
          Belum ada membership yang bisa dibeli
        </h3>
        <p className="text-gray-500 text-sm font-montserrat">
          Silakan buat membership dengan harga di menu pengaturan
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {memberships.map((membership) => {
        const isSelected = selectedMembership?.id === membership.id;
        const hasMinPoints = membership.min_points !== null && membership.min_points !== undefined;
        const hasPrice = parseFloat(membership.price) > 0;
        const showBothBadge = hasPrice && hasMinPoints;

        return (
          <button
            key={membership.id}
            onClick={() => onSelect(membership)}
            className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
              isSelected
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-base text-gray-900 font-montserrat">
                    {membership.name}
                  </h4>
                </div>
                {membership.description && (
                  <p className="text-xs text-gray-600 font-montserrat mb-2">
                    {membership.description}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              {/* Price */}
              <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                <div className="text-xs text-gray-600 font-medium font-montserrat mb-0.5">
                  Harga
                </div>
                <div className="text-base font-bold text-blue-600 font-montserrat">
                  {formatCurrency(membership.price)}
                </div>
              </div>

              {/* Discount */}
              <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                <div className="text-xs text-gray-600 font-medium font-montserrat mb-0.5">
                  Diskon
                </div>
                <div className="text-base font-bold text-green-600 font-montserrat">
                  {getMembershipDiscountDisplay(membership.discount_percentage)}
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 font-medium font-montserrat">
                  Durasi
                </span>
                <span className="text-xs font-semibold text-gray-800 font-montserrat">
                  {membership.duration_days} hari
                </span>
              </div>
            </div>

            {/* Min Points (if available) */}
            {hasMinPoints && (
              <div className="mt-1.5 pt-1.5 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-medium font-montserrat">
                    Minimum Poin (Alternatif)
                  </span>
                  <span className="text-xs font-semibold text-purple-600 font-montserrat">
                    {membership.min_points.toLocaleString('id-ID')} poin
                  </span>
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default MembershipSelection;

