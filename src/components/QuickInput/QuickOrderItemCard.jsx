import React from 'react';
import { Package } from 'lucide-react';
import QuickOrderItemInput from './QuickOrderItemInput';

const QuickOrderItemCard = ({
  items = [],
  qty = 1,
  onItemsChange,
  fillItemDetails = false,
  onToggleFillDetails,
  maxPhotos = 3,
  customerId = null
}) => {
  // Detail item (nama/foto/catatan per item) tidak dipakai di Telaga Madiredo —
  // transaksi tiket/paket cukup qty. Kembalikan `null` agar cepat; hapus baris
  // ini kalau nanti butuh kembali.
  return null;

  if (qty < 1) return null;

  const handleItemChange = (index, updatedItem) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    onItemsChange(newItems);
  };

  return (
    <div className="border-2 border-gray-200 rounded-xl p-4 bg-white">
      {/* Header dengan Toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* <Package className="w-4 h-4 text-blue-600" /> */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={fillItemDetails}
              onChange={(e) => onToggleFillDetails(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <span className="text-sm font-semibold text-gray-700 font-montserrat">
              Isi Detail Item (Opsional)
            </span>
          </label>
        </div>
        {fillItemDetails && (
          <span className="text-xs text-gray-500 font-montserrat">
            {qty} item
          </span>
        )}
      </div>

      {/* Items Grid - Hanya tampil jika toggle aktif */}
      {fillItemDetails && (
        <div className={`grid gap-3 ${
          qty === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
        }`}>
          {Array.from({ length: qty }).map((_, index) => (
            <QuickOrderItemInput
              key={index}
              index={index}
              itemData={items[index] || { item: null, photos: [], notes: '' }}
              onChange={(updatedItem) => handleItemChange(index, updatedItem)}
              maxPhotos={maxPhotos}
              customerId={customerId}
            />
          ))}
        </div>
      )}

      {/* Info Text */}
      {!fillItemDetails && (
        <p className="text-xs text-gray-500 italic font-montserrat">
          Centang untuk mengisi detail item (nama, foto, catatan)
        </p>
      )}
    </div>
  );
};

export default QuickOrderItemCard;

