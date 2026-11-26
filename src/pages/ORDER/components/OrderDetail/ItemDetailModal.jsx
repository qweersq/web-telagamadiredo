import React from 'react';
import { X, Camera, Edit2 } from 'lucide-react';
import AnimatedButton from '../../../../components/Design/AnimatedButton';

const ItemDetailModal = ({
  open,
  treatments,
  selectedTreatment,
  onTreatmentChange,
  qty,
  onQtyChange,
  discount,
  onDiscountChange,
  processTime,
  onProcessTimeChange,
  photo,
  onPhotoChange,
  dueDate,
  onDueDateChange,
  itemInputs,
  onEditItem,
  onSave,
  onClose
}) => {
  if (!open || !selectedTreatment) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl border-2 border-telaga-100 shadow-2xl w-full max-w-md p-6 font-montserrat relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
        {/* Treatment, Qty, Discount, Process Time, Foto, Due Date */}
        <div className="space-y-3 mb-4">
          <select
            value={selectedTreatment.id}
            onChange={e => onTreatmentChange(treatments.find(t => t.id === Number(e.target.value)))}
            className="w-full p-3 border-2 border-telaga-200 rounded-xl text-base font-montserrat"
          >
            {treatments.map(t => (
              <option key={t.id} value={t.id}>{t.name} (Rp {t.price.toLocaleString('id-ID')})</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={1}
              value={qty}
              onChange={e => onQtyChange(Number(e.target.value))}
              className="p-3 border-2 border-telaga-200 rounded-xl text-base font-montserrat"
              placeholder="Qty"
            />
            <select
              value={discount}
              onChange={e => onDiscountChange(Number(e.target.value))}
              className="p-3 border-2 border-telaga-200 rounded-xl text-base font-montserrat"
            >
              <option value={0}>Tanpa Diskon</option>
              <option value={5}>5%</option>
              <option value={10}>10%</option>
              <option value={15}>15%</option>
              <option value={20}>20%</option>
            </select>
            <select
              value={processTime}
              onChange={e => onProcessTimeChange(e.target.value)}
              className="p-3 border-2 border-telaga-200 rounded-xl text-base font-montserrat"
            >
              <option value="regular">Regular</option>
              <option value="express">Express</option>
              <option value="super_express">Super Express</option>
            </select>
            <input
              type="date"
              value={dueDate || ''}
              onChange={e => onDueDateChange(e.target.value)}
              className="p-3 border-2 border-telaga-200 rounded-xl text-base font-montserrat"
            />
          </div>
          {/* Upload Foto (satu saja) */}
          <div>
            {photo && (
              <div className="flex gap-2 mb-2">
                <div className="relative">
                  <img
                    src={photo.preview || photo}
                    alt="Item"
                    className="w-24 h-24 object-cover rounded-xl border"
                  />
                  <button
                    onClick={() => onPhotoChange(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    type="button"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => document.getElementById('item-photo-input')?.click()}
              className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-telaga-300 rounded-xl text-telaga-600 hover:bg-telaga-50 hover:border-telaga-400 transition-all font-montserrat text-base font-semibold"
            >
              <Camera className="w-5 h-5" />
              Upload Foto
            </button>
            <input
              id="item-photo-input"
              type="file"
              accept="image/*"
              onChange={e => onPhotoChange(e.target.files[0] ? { file: e.target.files[0], preview: URL.createObjectURL(e.target.files[0]) } : null)}
              className="hidden"
            />
          </div>
        </div>
        {/* List Card Item */}
        <div className="space-y-3">
          {[...Array(qty)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-telaga-50 rounded-xl shadow-sm">
              <div>
                <div className="font-semibold text-telaga-800">Item {i + 1}</div>
                <div className="text-xs text-gray-500">
                  {itemInputs[i]?.name || '-'} | {itemInputs[i]?.brand || '-'} | {itemInputs[i]?.color || '-'}
                </div>
              </div>
              <button
                onClick={() => onEditItem(i)}
                className="p-2 rounded-full bg-white border border-telaga-200 text-telaga-600 hover:bg-telaga-100 shadow-sm transition-all"
                aria-label="Edit Item"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <AnimatedButton
            variant="grey"
            className="flex-1 h-12 p-4"
            onClick={onClose}
          >
            Batal
          </AnimatedButton>
          <AnimatedButton
            variant="telaga"
            className="flex-1 h-12 p-4"
            onClick={onSave}
          >
            Simpan
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal; 