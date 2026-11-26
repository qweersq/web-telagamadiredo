import React from 'react';
import { Info, Edit2, Trash2 } from 'lucide-react';
import { ORDER_DETAIL_STATUS } from '../../../../utils/labelFormatter';

const ItemCard = ({
  item,
  itemIdx,
  groupIdx,
  onShowStatusHistory,
  onEditItem,
  onRemoveItem,
  isItemEditable,
  isItemRemovable,
  getStatusColor,
  getOrderDetailStatusLabel,
  onOpenPhotoGallery,
}) => {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-md p-4 border border-gray-200 relative font-montserrat hover:shadow-lg transition-all duration-200">
      {/* Icon aksi dan status badge pojok kanan atas */}
      <div className="absolute top-3 right-2 flex flex-col gap-2 z-10 items-end">
        {/* Action Buttons */}
        <div className="flex gap-1">
          {/* Info button untuk status history */}
          <button
            className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-gray-600 shadow-md hover:shadow-lg transition-all duration-200"
            title="Lihat Riwayat Status Barang"
            onClick={() => onShowStatusHistory(item)}
          >
            <Info className="w-4 h-4" />
          </button>
          {isItemEditable(item) && (
            <button
              className="p-1.5 rounded-full bg-telaga-50/80 backdrop-blur-sm hover:bg-telaga-100 text-telaga-600 shadow-md hover:shadow-lg transition-all duration-200"
              title="Edit Barang"
              onClick={() => onEditItem(groupIdx, itemIdx)}
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {isItemRemovable(item) && (
            <button
              className="p-1.5 rounded-full bg-red-50/80 backdrop-blur-sm hover:bg-red-100 text-red-500 shadow-md hover:shadow-lg transition-all duration-200"
              title="Hapus Barang"
              onClick={() => onRemoveItem(groupIdx, itemIdx)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        {/* Status Badge */}
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

      {/* Shoes Photos */}
      {item.shoes_photos && item.shoes_photos.length > 0 && (
        <div className="mt-1">
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {item.shoes_photos.map((photo, pi) => (
              <img
                key={pi}
                src={photo.url_photo}
                alt="Foto"
                className="w-10 h-10 object-cover rounded border cursor-pointer hover:scale-105 transition-transform duration-200 hover:shadow-md flex-shrink-0"
                onClick={() => onOpenPhotoGallery(item.shoes_photos, pi)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Done Badge */}
      {item.status === ORDER_DETAIL_STATUS.DONE && (
        <span className="px-3 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold mt-2 font-montserrat">
          ✓ Selesai
        </span>
      )}
    </div>
  );
};

export default ItemCard;

