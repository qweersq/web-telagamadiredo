import React from 'react';
import { Crown, Coins, Calendar, Percent, CreditCard, Zap } from 'lucide-react';
import { formatCurrency, formatNumber, getMembershipDiscountDisplay } from '../../../utils/labelFormatter';

const MembershipReview = ({ customer, customerDetail, membership }) => {
  if (!customer || !membership) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 font-montserrat">Data tidak lengkap</p>
      </div>
    );
  }

  // Get customer points info
  const customerPoints = customer?.points ?? customerDetail?.customer?.points ?? 0;
  const customerLifetimePoints = customer?.lifetime_points ?? customerDetail?.customer?.lifetime_points ?? 0;
  const currentMembership = customerDetail?.customer?.current_membership;

  // Calculate expiry date
  const calculateExpiryDate = () => {
    if (!membership.duration_days) return null;
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + parseInt(membership.duration_days));
    return endDate.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const expiryDate = calculateExpiryDate();
  const hasMinPoints = membership.min_points !== null && membership.min_points !== undefined;
  const canUseLifetimePoints = hasMinPoints && customerLifetimePoints >= membership.min_points;

  return (
    <div className="space-y-6">
      {/* Customer Info */}
      <div>
        <h3 className="font-semibold text-lg mb-4 text-blue-700 font-montserrat tracking-wide mt-8">
          Informasi Customer
        </h3>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-lg text-gray-900 font-montserrat">
                {customer.name}
              </h4>
              <p className="text-sm text-gray-600 font-montserrat">
                {customer.phone || customer.phone_number || '-'}
              </p>
            </div>
          </div>

          {/* Points Info */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Coins className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-gray-600 font-medium font-montserrat">
                  Points
                </span>
              </div>
              <div className="text-lg font-bold text-blue-600 font-montserrat">
                {formatNumber(customerPoints)}
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <Coins className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-gray-600 font-medium font-montserrat">
                  Lifetime Points
                </span>
              </div>
              <div className="text-lg font-bold text-purple-600 font-montserrat">
                {formatNumber(customerLifetimePoints)}
              </div>
            </div>
          </div>

          {/* Current Membership */}
          {currentMembership && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-600 font-medium font-montserrat mb-1">
                Membership Saat Ini
              </div>
              <div className="text-sm font-semibold text-gray-800 font-montserrat">
                {currentMembership.membership?.name || 'Tidak ada'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Membership Details */}
      <div>
        <h3 className="font-semibold text-md mb-4 text-blue-700 font-montserrat tracking-wide">
          Detail Membership yang Akan Dibeli
        </h3>
        <div className="bg-white rounded-xl border-2 border-blue-200 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-lg text-gray-900 font-montserrat">
                {membership.name}
              </h4>
              {membership.description && (
                <p className="text-sm text-gray-600 font-montserrat mt-1">
                  {membership.description}
                </p>
              )}
            </div>
          </div>

          {/* Membership Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="text-xs text-gray-600 font-medium font-montserrat mb-1">
                Harga
              </div>
              <div className="text-lg font-bold text-green-600 font-montserrat">
                {formatCurrency(membership.price)}
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-1 mb-1">
                <Percent className="w-3 h-3 text-blue-600" />
                <span className="text-xs text-gray-600 font-medium font-montserrat">
                  Diskon
                </span>
              </div>
              <div className="text-lg font-bold text-blue-600 font-montserrat">
                {getMembershipDiscountDisplay(membership.discount_percentage)}
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-gray-600 font-medium font-montserrat">
                Durasi
              </span>
            </div>
            <div className="text-sm font-semibold text-purple-800 font-montserrat">
              {membership.duration_days} hari
            </div>
            {expiryDate && (
              <div className="text-xs text-purple-600 font-montserrat mt-1">
                Berlaku hingga: {expiryDate}
              </div>
            )}
          </div>

          {/* How to Get Membership */}
          <div className="border-t border-gray-200 pt-4">
            <div className="text-xs text-gray-600 font-medium font-montserrat mb-3">
              Cara Mendapatkan Membership:
            </div>
            <div className="space-y-2">
              {/* Bayar Langsung */}
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-800 font-montserrat">
                    Bayar Langsung
                  </span>
                </div>
                <p className="text-xs text-green-700 font-montserrat">
                  Bayar {formatCurrency(membership.price)} untuk mendapatkan membership selama {membership.duration_days} hari
                </p>
              </div>

              {/* Dengan Lifetime Points (if available) */}
              {hasMinPoints && (
                <div className={`rounded-lg p-3 border ${
                  canUseLifetimePoints
                    ? 'bg-purple-50 border-purple-200'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <span className={`text-sm font-semibold font-montserrat ${
                      canUseLifetimePoints ? 'text-purple-800' : 'text-gray-600'
                    }`}>
                      Dengan Lifetime Points
                    </span>
                  </div>
                  {canUseLifetimePoints ? (
                    <p className="text-xs text-purple-700 font-montserrat">
                      Anda memiliki {formatNumber(customerLifetimePoints)} lifetime points (min: {formatNumber(membership.min_points)})
                    </p>
                  ) : (
                    <p className="text-xs text-gray-600 font-montserrat">
                      Butuh {formatNumber(membership.min_points)} lifetime points (Anda punya: {formatNumber(customerLifetimePoints)})
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipReview;

