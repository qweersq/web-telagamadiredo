import React, { useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { createItem } from '../../api/orderApi';

const AddItemModal = ({ open, newItem, selectedPhotos, onChange, onPhotoAdd, onPhotoRemove, onSave, onClose }) => {
  const fileInputRef = useRef(null);
  
  // Handler untuk menyimpan item baru ke database
  const handleSaveItem = async () => {
    try {
      // Validasi field yang diperlukan - hanya name yang required berdasarkan database schema
      if (!newItem.name || newItem.name.trim() === '') {
        alert('Nama Item harus diisi');
        return;
      }

      // Buat item baru dengan data yang ada
      const itemData = {
        name: newItem.name,
        brand: newItem.brand,
        color: newItem.color || '',
        material: newItem.material || '',
        type: '' // Default type untuk sepatu
      };

      // Simpan ke database menggunakan API yang sudah diperbaiki
      const createdItem = await createItem(itemData);
      
      // Panggil onSave dengan item yang sudah dibuat
      onSave(createdItem);
      
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Gagal menyimpan item baru');
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Tambah Item Baru</h3>
        {/* Photo Capture */}
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto mb-3">
            {selectedPhotos.map(photo => (
              <div key={photo.id} className="relative">
                <img
                  src={photo.preview}
                  alt="Item"
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <button
                  onClick={() => onPhotoRemove(photo.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-lg"
          >
            <Camera className="w-5 h-5" />
            Ambil Foto
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={onPhotoAdd}
            className="hidden"
          />
        </div>
        {/* Item Details */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Nama Item (e.g., Air Force 1, Converse)"
            value={newItem.name}
            onChange={e => onChange({ ...newItem, name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="text"
            placeholder="Brand (e.g., Nike, Adidas, Converse)"
            value={newItem.brand}
            onChange={e => onChange({ ...newItem, brand: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
          <input
            type="text"
            placeholder="Warna (e.g., Putih, Hitam, Biru Navy)"
            value={newItem.color}
            onChange={e => onChange({ ...newItem, color: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
          <input
            type="text"
            placeholder="Material (e.g., Leather, Canvas, Mesh)"
            value={newItem.material}
            onChange={e => onChange({ ...newItem, material: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 rounded-lg"
          >
            Batal
          </button>
          <button
            onClick={handleSaveItem}
            className="flex-1 py-2 bg-telaga-500 text-white rounded-lg"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddItemModal; 