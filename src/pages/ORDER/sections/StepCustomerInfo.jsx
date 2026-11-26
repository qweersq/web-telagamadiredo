import React, { useMemo } from 'react';
import { Edit2, Crown, MessageSquare } from 'lucide-react';
import CustomerSelector from '../components/OrderDetail/CustomerSelector';
import {
  formatOrderType,
  getMembershipBadgeColor,
  getMembershipDiscountDisplay,
  getTodayDateString,
  ORDER_TYPE,
} from '../../../utils/labelFormatter';

const NOTE_MAX_LENGTH = 500;

/**
 * Catatan bebas dari customer untuk keseluruhan pesanan (orders.customer_note).
 * Disimpan terpisah dari `order_details.description` yang menempel per item.
 */
const CustomerNoteField = ({ value, onChange, disabled }) => {
  const note = value || '';

  return (
    <div className="mt-1">
      <label
        htmlFor="customer_note"
        className="mb-2 flex items-center gap-2 font-montserrat text-xs font-semibold text-gray-700"
      >
        <MessageSquare className="h-4 w-4 text-telaga-500" />
        Catatan dari Customer
      </label>
      <textarea
        id="customer_note"
        rows={3}
        maxLength={NOTE_MAX_LENGTH}
        value={note}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Mis. jangan pakai es, meja dekat kolam, ambil jam 3 sore"
        className="block w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 font-montserrat text-sm text-gray-800 placeholder-gray-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-telaga-400 disabled:bg-gray-50 disabled:text-gray-500"
        disabled={disabled}
      />
      <p className="mt-1 text-right font-montserrat text-[11px] text-gray-400">
        {note.length}/{NOTE_MAX_LENGTH}
      </p>
    </div>
  );
};

const StepCustomerInfo = ({
  orderData,
  customers,
  searchTerm,
  onSearchTermChange,
  onSelectCustomer,
  onAddCustomer,
  onEditCustomer,
  isOrderEditable,
  updateField,
  requestPickup,
  pickupDate,
  pickupTime,
  onRequestPickupChange,
  onPickupDateChange,
  onPickupTimeChange,
  isRequestPickupEditable,
  getRequestPickupWarningMessage,
}) => {
  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone.includes(searchTerm)
      ),
    [customers, searchTerm]
  );

  // Ringkasan item dihitung dari detail pesanan (bukan input manual)
  const totalItemCount = useMemo(() => {
    const groups = Array.isArray(orderData.order_details) ? orderData.order_details : [];
    return groups.reduce((acc, group) => {
      const items = Array.isArray(group.items) ? group.items : [];
      return acc + (items.length > 0 ? items.length : group.qty || 0);
    }, 0);
  }, [orderData.order_details]);

  const customerNoteField = (
    <CustomerNoteField
      value={orderData.customer_note}
      onChange={(value) => updateField('customer_note', value)}
      disabled={!isOrderEditable()}
    />
  );

  return (
    <div className="space-y-4">
      {orderData.customer ? (
        <div className="bg-gradient-to-br from-telaga-50 to-senja-50 rounded-3xl shadow-lg p-6 border border-telaga-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-telaga-100/40 to-transparent rounded-full -translate-y-8 translate-x-8 z-0 pointer-events-none" />

          <button
            onClick={onEditCustomer}
            className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm hover:bg-white text-telaga-600 rounded-full transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 z-20"
            title="Edit Customer"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-telaga-600 to-telaga-400 rounded-full flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118A7.5 7.5 0 0112 15.75a7.5 7.5 0 017.5 4.368" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 text-lg sm:text-xl font-montserrat tracking-wide truncate">
                    {orderData.customer?.name || 'Customer'}
                  </h3>
                  {orderData.customer?.current_membership && orderData.customer.current_membership.status === 'active' && (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getMembershipBadgeColor(orderData.customer.current_membership.membership?.name)}`}>
                      <Crown className="w-3 h-3" />
                      {orderData.customer.current_membership.membership?.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-telaga-600 font-montserrat font-medium">Data Pelanggan</p>
                {orderData.customer?.current_membership && orderData.customer.current_membership.status === 'active' && (
                  <p className="text-xs text-green-600 font-montserrat mt-1">
                    Berikan {getMembershipDiscountDisplay(orderData.customer.current_membership.membership?.discount_percentage)}
                  </p>
                )}
              </div>
            </div>

            {/* Nomor HP & alamat pelanggan disembunyikan — kasir Telaga tidak perlu
                verifikasi data kontak saat membuat pesanan. */}
            {customerNoteField}

            {/* Referral hanya tampil jika memang ada relasi referral */}
            {(orderData.referred_by || orderData.referred_by_phone || orderData.referrer) && (
              <div className="mt-3 border-t border-telaga-200/50 pt-3">
                <span className="mb-1 block font-montserrat text-xs font-semibold text-gray-600">Referral</span>
                {orderData.referrer ? (
                  <div className="font-montserrat text-sm text-gray-700">
                    <span className="font-semibold">{orderData.referrer.name}</span>
                    {orderData.referrer.phone && (
                      <span className="ml-2 text-gray-500">({orderData.referrer.phone})</span>
                    )}
                  </div>
                ) : (
                  <span className="font-montserrat text-sm text-gray-700">{orderData.referred_by_phone}</span>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <CustomerSelector
            customers={filteredCustomers}
            selectedCustomer={orderData.customer}
            onSelectCustomer={onSelectCustomer}
            onAddCustomer={onAddCustomer}
            searchTerm={searchTerm}
            onSearchTermChange={onSearchTermChange}
            disabled={!isOrderEditable()}
          />
          {/* Walk-in juga sering nitip catatan (mis. less sugar) */}
          <div className="rounded-3xl border border-telaga-200 bg-gradient-to-br from-telaga-50 to-senja-50 p-6 shadow-lg">
            {customerNoteField}
          </div>
        </>
      )}

      <div className="bg-gradient-to-br from-telaga-50 to-senja-50 rounded-3xl shadow-lg p-6 border border-telaga-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-telaga-100/40 to-transparent rounded-full -translate-y-8 translate-x-8 z-0 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-telaga-600 to-telaga-400 rounded-full flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-lg font-montserrat tracking-wide">Informasi Pesanan</h3>
              <p className="text-xs text-telaga-600 font-montserrat font-medium">
                {totalItemCount > 0 ? `${totalItemCount} item` : 'Ringkasan transaksi'}
                {orderData.branch_name ? ` • ${orderData.branch_name}` : ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col">
              <label className="block text-xs font-semibold text-gray-700 mb-2 font-montserrat">Tanggal Masuk</label>
              <input
                type="date"
                value={orderData.entry_date || ''}
                onChange={(e) => updateField('entry_date', e.target.value)}
                className="block w-full pl-3 pr-3 py-3 sm:py-3.5 border border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-telaga-400 focus:border-transparent text-sm sm:text-base font-montserrat transition-all"
                style={{ WebkitAppearance: 'none', backgroundColor: 'white' }}
                disabled={!isOrderEditable()}
              />
            </div>
            <div className="flex flex-col">
              <label className="block text-xs font-semibold text-gray-700 mb-2 font-montserrat">Tipe Pesanan</label>
              <select
                value={orderData.order_type || ORDER_TYPE.DINE_IN}
                onChange={(e) => updateField('order_type', e.target.value)}
                className="block w-full pl-3 pr-3 py-3 sm:py-3.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-telaga-400 focus:border-transparent text-sm sm:text-base font-montserrat transition-all"
                style={{ WebkitAppearance: 'none', backgroundColor: 'white' }}
                disabled={!isOrderEditable()}
              >
                <option value={ORDER_TYPE.DINE_IN}>{formatOrderType(ORDER_TYPE.DINE_IN)}</option>
                <option value={ORDER_TYPE.TAKEAWAY}>{formatOrderType(ORDER_TYPE.TAKEAWAY)}</option>
                {/* Rollup dari mode sajian per item di Quick Order */}
                {orderData.order_type === 'mixed' && (
                  <option value="mixed">{formatOrderType('mixed')}</option>
                )}
                {/* Data lama NotaSepatu tetap bisa tampil apa adanya */}
                {(orderData.order_type === ORDER_TYPE.ONLINE || orderData.order_type === ORDER_TYPE.OFFLINE) && (
                  <option value={orderData.order_type}>{formatOrderType(orderData.order_type)}</option>
                )}
              </select>
            </div>
          </div>

          {orderData.order_type === ORDER_TYPE.ONLINE && (
            <div
              className={`p-4 rounded-xl border-2 flex flex-col gap-3 shadow-sm ${
                isRequestPickupEditable()
                  ? 'bg-white/80 backdrop-blur-sm border-telaga-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <label className={`flex items-center gap-3 ${isRequestPickupEditable() ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                <span
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full mr-2 ${
                    isRequestPickupEditable() ? 'bg-telaga-100 text-telaga-500' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h3m4 0V7a2 2 0 00-2-2h-7.5a2 2 0 00-2 2v2" />
                  </svg>
                </span>
                <span className={`font-bold text-base font-montserrat ${isRequestPickupEditable() ? 'text-telaga-700' : 'text-gray-500'}`}>
                  Pickup Service
                </span>
                <input
                  type="checkbox"
                  checked={requestPickup}
                  onChange={(e) => onRequestPickupChange(e.target.checked)}
                  className={`ml-auto w-5 h-5 ${isRequestPickupEditable() ? 'accent-telaga-500' : 'accent-gray-400'}`}
                  disabled={!isRequestPickupEditable()}
                />
              </label>
              {requestPickup && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="flex flex-col">
                    <label className={`text-xs font-semibold mb-1 font-montserrat ${isRequestPickupEditable() ? 'text-telaga-700' : 'text-gray-500'}`}>
                      Tanggal Pickup
                    </label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => onPickupDateChange(e.target.value)}
                      className={`border rounded-lg px-3 py-2 text-sm font-montserrat focus:ring-2 focus:border-transparent w-full ${
                        isRequestPickupEditable()
                          ? 'focus:ring-telaga-400 border-gray-300'
                          : 'focus:ring-gray-400 border-gray-200 bg-gray-100'
                      }`}
                      min={getTodayDateString()}
                      disabled={!isRequestPickupEditable()}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className={`text-xs font-semibold mb-1 font-montserrat ${isRequestPickupEditable() ? 'text-telaga-700' : 'text-gray-500'}`}>
                      Jam Pickup
                    </label>
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={(e) => onPickupTimeChange(e.target.value)}
                      className={`border rounded-lg px-3 py-2 text-sm font-montserrat focus:ring-2 focus:border-transparent w-full ${
                        isRequestPickupEditable()
                          ? 'focus:ring-telaga-400 border-gray-300'
                          : 'focus:ring-gray-400 border-gray-200 bg-gray-100'
                      }`}
                      disabled={!isRequestPickupEditable()}
                    />
                  </div>
                </div>
              )}
              {!isRequestPickupEditable() && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-700 font-semibold font-montserrat">
                    {getRequestPickupWarningMessage()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepCustomerInfo;

