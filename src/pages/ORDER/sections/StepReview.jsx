import React from 'react';
import { Crown, Hash, MessageSquare } from 'lucide-react';
import ServiceCardReview from '../components/OrderDetail/ServiceCardReview';
import { formatCurrency, formatDate, getMembershipBadgeColor, getMembershipDiscountDisplay } from '../../../utils/labelFormatter';

const StepReview = ({
  orderData,
  groupedOrderDetails,
  total,
  getStatusColor,
  getOrderDetailStatusLabel,
  onOpenPhotoGallery,
}) => {
  return (
    <div className="space-y-6">
      {/* Customer Info */}
      <div className="bg-gradient-to-br from-telaga-50 to-senja-50 rounded-3xl shadow-lg p-6 border border-telaga-200 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-telaga-100/40 to-transparent rounded-full -translate-y-8 translate-x-8 z-0 pointer-events-none"></div>

        {/* Customer Info */}
        <div className="relative z-10">
          {/* Avatar & Name */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-telaga-600 to-telaga-400 rounded-full flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118A7.5 7.5 0 0112 15.75a7.5 7.5 0 017.5 4.368" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900 text-lg sm:text-xl font-montserrat tracking-wide truncate">
                  {orderData.customer?.name || 'Pelanggan'}
                </h3>
                {orderData.customer?.current_membership && orderData.customer.current_membership.status === 'active' && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getMembershipBadgeColor(orderData.customer.current_membership.membership?.name)}`}>
                    <Crown className="w-3 h-3" />
                    {orderData.customer.current_membership.membership?.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-telaga-600 font-montserrat font-medium">
                Data Pelanggan
              </p>
              {orderData.customer?.current_membership && orderData.customer.current_membership.status === 'active' && (
                <p className="text-xs text-green-600 font-montserrat mt-1">
                  Dapat {getMembershipDiscountDisplay(orderData.customer.current_membership.membership?.discount_percentage)}
                </p>
              )}
            </div>
          </div>

          {/* No. HP & alamat tidak ditampilkan — kasir Telaga tidak memverifikasi
              kontak saat membuat pesanan. Yang relevan: nomor meja & catatan. */}
          {(orderData.table_number || orderData.entry_date) && (
          <div className="flex flex-wrap items-center gap-2">
            {orderData.table_number && (
              <span className="inline-flex items-center gap-1 rounded-full border border-telaga-200 bg-white/80 px-2.5 py-1 font-montserrat text-xs font-semibold text-telaga-700">
                <Hash className="h-3.5 w-3.5 text-telaga-500" />
                Meja {orderData.table_number}
              </span>
            )}
            {orderData.entry_date && (
              <span className="inline-flex items-center rounded-full border border-telaga-200 bg-white/80 px-2.5 py-1 font-montserrat text-xs font-semibold text-telaga-700">
                {formatDate(orderData.entry_date)}
              </span>
            )}
          </div>
          )}

          {/* Catatan dari customer (orders.customer_note) */}
          {orderData.customer_note ? (
            <div className="mt-3 rounded-xl border border-telaga-200/70 bg-white/70 p-3">
              <p className="mb-1 flex items-center gap-1.5 font-montserrat text-xs font-semibold text-gray-600">
                <MessageSquare className="h-3.5 w-3.5 text-telaga-500" />
                Catatan dari Customer
              </p>
              <p className="whitespace-pre-line font-montserrat text-sm leading-relaxed text-gray-700">
                {orderData.customer_note}
              </p>
            </div>
          ) : (
            <p className="mt-3 font-montserrat text-xs italic text-gray-400">
              Tanpa catatan tambahan dari customer
            </p>
          )}
        </div>
      </div>

      {/* Layanan & Item List */}
      <div className="space-y-4">
        {groupedOrderDetails.map((group, idx) => (
          <ServiceCardReview
            key={idx}
            group={group}
            idx={idx}
            getStatusColor={getStatusColor}
            getOrderDetailStatusLabel={getOrderDetailStatusLabel}
            onOpenPhotoGallery={onOpenPhotoGallery}
          />
        ))}
      </div>

      {/* Total */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl shadow-lg p-6 border border-green-200 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-100/30 to-transparent rounded-full -translate-y-8 translate-x-8 z-0 pointer-events-none"></div>

        <div className="relative z-10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg font-montserrat tracking-wide">
                Total Pesanan
              </h3>
              <p className="text-xs text-green-600 font-montserrat font-medium">
                Total Akhir
              </p>
            </div>
          </div>
          <span className="font-extrabold text-xl text-green-700 font-montserrat">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
};

export default StepReview;

