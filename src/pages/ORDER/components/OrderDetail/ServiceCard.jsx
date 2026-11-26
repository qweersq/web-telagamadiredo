import React from 'react';
import { Edit2, Trash2, Plus, Sparkles } from 'lucide-react';
import ItemCard from './ItemCard';
import { calculateGroupTotal, getGroupQty, isProductGroup } from '../../utils/orderCalculations';
import { parseItemOptions } from '../../utils/orderTransformNew';
import { formatCurrency, formatDiscountDisplay } from '../../../../utils/labelFormatter';

const ServiceCard = ({
  group,
  idx,
  groupedOrderDetails,
  orderData,
  hasDoneItems,
  isOrderEditable,
  isTreatmentRemovable,
  onEditGroup,
  onRemoveGroup,
  onAddItem,
  onAIDetectItem,
  onShowStatusHistory,
  onEditItem,
  onRemoveItem,
  isItemEditable,
  isItemRemovable,
  getStatusColor,
  getOrderDetailStatusLabel,
  onOpenPhotoGallery,
}) => {
  const groupTotal = calculateGroupTotal(group);
  const isProductGroupVal = isProductGroup(group);
  const groupQty = getGroupQty(group);
  const groupOptions = parseItemOptions(group.options);

  return (
    <div className="bg-gradient-to-br from-telaga-50 to-senja-50 rounded-3xl shadow-lg p-6 border border-telaga-200 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-telaga-100/40 to-transparent rounded-full -translate-y-8 translate-x-8 z-0 pointer-events-none"></div>

      {/* Tombol aksi dan harga pojok kanan atas */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20 items-end">
        {/* Action Buttons */}
        <div className="flex gap-1">
          {!hasDoneItems && (
            <button
              onClick={() => onEditGroup(group, idx)}
              className={`p-2 rounded-full transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 ${
                isOrderEditable()
                  ? 'bg-white/80 backdrop-blur-sm hover:bg-white text-telaga-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              disabled={!isOrderEditable()}
              title="Edit produk/paket"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {isTreatmentRemovable(group) && (groupedOrderDetails.length > 1 || isProductGroupVal) && (
            <button
              className="p-2 bg-white/80 backdrop-blur-sm hover:bg-white text-red-500 rounded-full transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
              title="Hapus produk/paket"
              onClick={() => onRemoveGroup(idx)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        {/* Harga */}
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
              {isProductGroupVal ? 'Detail Produk' : 'Detail Layanan'}
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
              {/* Custom Price Reason - Langsung dibawah custom price */}
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

        {/* AI Detail Button — between due date and items, full-width purple gradient */}
          {!isProductGroupVal && isOrderEditable() && (
            <button
              onClick={() => onAIDetectItem(idx)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold font-montserrat shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.01] mb-3"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}
            >
              <Sparkles className="w-4 h-4" />
              AI Deteksi Cepat
            </button>
          )}

          {/* Items List - Only for services, not products */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {!isProductGroupVal && group.items.map((item, i) => (
            <ItemCard
              key={i}
              item={item}
              itemIdx={i}
              groupIdx={idx}
              onShowStatusHistory={onShowStatusHistory}
              onEditItem={onEditItem}
              onRemoveItem={onRemoveItem}
              isItemEditable={isItemEditable}
              isItemRemovable={isItemRemovable}
              getStatusColor={getStatusColor}
              getOrderDetailStatusLabel={getOrderDetailStatusLabel}
              onOpenPhotoGallery={onOpenPhotoGallery}
            />
          ))}
        </div>

        {/* Tambah tombol Tambah Item di bawah item list */}
        {isOrderEditable() && !isProductGroupVal && (
          <button
            onClick={() => onAddItem(idx)}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-telaga-300 rounded-xl text-telaga-600 hover:bg-telaga-50 hover:border-telaga-400 transition-all font-montserrat text-sm font-semibold"
          >
            <Plus className="w-5 h-5" /> Tambah Item
          </button>
        )}
      </div>
    </div>
  );
};

export default ServiceCard;

