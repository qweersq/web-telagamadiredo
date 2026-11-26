import React from 'react';
import { calculateGroupTotal, getGroupQty, isProductGroup } from '../../utils/orderCalculations';
import { parseItemOptions } from '../../utils/orderTransformNew';
import { formatCurrency, formatDiscountDisplay, getOrderDetailStatusColors, formatOrderDetailStatus } from '../../../../utils/labelFormatter';

const ServiceCardReview = ({
  group,
  idx,
  getStatusColor = (status) => getOrderDetailStatusColors(status),
  getOrderDetailStatusLabel = (status) => formatOrderDetailStatus(status),
  onOpenPhotoGallery,
}) => {
  const groupTotal = calculateGroupTotal(group);
  const isProductGroupVal = isProductGroup(group);
  const groupQty = getGroupQty(group);
  const groupOptions = parseItemOptions(group.options);
  const itemsLength = Array.isArray(group.items) ? group.items.length : 0;
  const qtyValue = group.qty != null ? Number(group.qty) : 0;

  return (
    <div className="bg-gradient-to-br from-telaga-50 to-senja-50 rounded-3xl shadow-lg p-6 border border-telaga-200 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-telaga-100/40 to-transparent rounded-full -translate-y-8 translate-x-8 z-0 pointer-events-none"></div>

      {/* Harga */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20 items-end">
        <span className="inline-block px-3 py-1.5 rounded-full bg-green-50 text-green-700 font-montserrat text-sm font-bold border border-green-200 shadow-sm bg-white/90 backdrop-blur-sm">
          {formatCurrency(groupTotal)}
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 bg-gradient-to-br from-telaga-600 to-telaga-400 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 text-base font-montserrat truncate">
                {group.treatment?.name || 'Treatment'}
              </h3>
              {group.serve_mode && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-montserrat uppercase tracking-wide ${
                  group.serve_mode === 'takeaway'
                    ? 'bg-senja-100 text-senja-700 border border-senja-200'
                    : 'bg-telaga-100 text-telaga-700 border border-telaga-200'
                }`}>
                  {group.serve_mode === 'takeaway' ? 'Bawa Pulang' : 'Dine In'}
                </span>
              )}
              {groupQty > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-montserrat bg-white/80 text-gray-700 border border-gray-200">
                  {groupQty}x
                </span>
              )}
            </div>
            <p className="text-xs text-telaga-600 font-montserrat font-medium">
              Detail {isProductGroupVal ? 'Produk' : 'Layanan'}
            </p>
          </div>
        </div>

        {/* Catatan & opsi cepat (mis. less sugar) */}
        {(group.note || Object.keys(groupOptions).length > 0) && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {Object.entries(groupOptions).map(([key, value]) => (
              <span
                key={`${key}-${value}`}
                className="inline-flex items-center rounded-full bg-senja-100 text-senja-700 border border-senja-200 px-2 py-0.5 text-[10px] font-bold font-montserrat uppercase tracking-wide"
              >
                {value}
              </span>
            ))}
            {group.note && (
              <span className="text-xs italic text-gray-600 font-montserrat">
                “{group.note}”
              </span>
            )}
          </div>
        )}

        {/* Detail tambahan hanya dirender kalau memang ada isinya */}
        {(group.custom_price != null || group.discount) && (
        <div className="space-y-2 mb-4 text-sm">
          {/* Custom Price - Highlighted Section */}
          {group.custom_price != null && (
            <div className="p-3 bg-telaga-50 border-l-4 border-telaga-400 rounded-r-lg space-y-1.5">
              <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
                <span className="text-gray-500 font-montserrat">Custom Price:</span>
                <span className="text-telaga-700 font-semibold font-montserrat">{formatCurrency(group.custom_price)}</span>
              </div>
              {/* Custom Price Reason */}
              {group.custom_price_reason && (
                <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
                  <span className="text-gray-500 font-montserrat text-xs">Ket. Penyesuaian:</span>
                  <span className="text-telaga-700 font-medium font-montserrat italic text-xs">{group.custom_price_reason}</span>
                </div>
              )}
            </div>
          )}

          {/* Diskon */}
          {group.discount && (
            <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
              <span className="text-gray-500 font-montserrat">Diskon:</span>
              <span className="text-gray-900 font-medium font-montserrat">{formatDiscountDisplay(group.discount)}</span>
            </div>
          )}
        </div>
        )}

        {/* Item List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {!isProductGroupVal && group.items.map((item, i) => (
            <div key={i} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-md p-4 border border-gray-200 relative font-montserrat hover:shadow-lg transition-all duration-200">
              {/* Status Badge */}
              <div className="absolute top-3 right-2 flex flex-col gap-2 z-10 items-end">
                {item.status && (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-montserrat font-semibold shadow-sm border ${getStatusColor(item.status)} bg-white/90 backdrop-blur-sm`}>
                    {getOrderDetailStatusLabel(item.status)}
                  </span>
                )}
              </div>

              {/* Item Info */}
              <div className="pr-16">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-md font-montserrat tracking-wide truncate" title={item.name}>
                      {item.id ? (
                        item.name
                          ? item.name.split(' ').slice(0, 3).join(' ') + (item.name.split(' ').length > 3 ? '...' : '')
                          : ''
                      ) : (
                        <span className="italic text-gray-400 text-sm font-montserrat">Item belum dilengkapi</span>
                      )}
                    </h4>
                    <p className="text-xs text-telaga-600 font-montserrat font-medium">
                      {item.brand}, {item.color}
                    </p>
                  </div>
                </div>
              </div>

              {/* Item Details */}
              <div className="space-y-1.5 mt-3">
                {item.notes && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 font-montserrat">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                    <span className="font-medium">Catatan:</span>
                    <span className="text-gray-700">{item.notes}</span>
                  </div>
                )}
                {item.parfum && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 font-montserrat">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M12 5.25V3m4.227 4.227l1.591-1.591M18.75 12H21m-4.773 4.773l1.591 1.591M12 18.75V21" />
                    </svg>
                    <span className="font-medium">Parfum:</span>
                    <span className="text-gray-700">{item.parfum}</span>
                  </div>
                )}
              </div>

              {/* Photos */}
              {item.shoes_photos && item.shoes_photos.length > 0 && (
                <div className="mt-3">
                  <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {item.shoes_photos.map((photo, pi) => (
                      <img
                        key={pi}
                        src={photo.url_photo}
                        alt="Foto"
                        className="w-10 h-10 object-cover rounded-lg border shadow-sm cursor-pointer hover:scale-105 transition-transform duration-200 hover:shadow-md flex-shrink-0"
                        onClick={() => onOpenPhotoGallery(item.shoes_photos, pi)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {isProductGroupVal && (!group.items || group.items.length === 0) && (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-md p-4 border border-gray-200 text-sm text-gray-600 font-montserrat">
              Produk tidak memerlukan item detail. Qty layanan: {Math.max(qtyValue, 1)}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceCardReview;

