import React, { useState, useEffect, useRef } from 'react';
import { Search, Camera, X, Plus, Image as ImageIcon, History } from 'lucide-react';
import { searchItems, createItem } from '../../pages/ORDER/api/orderApi';
import instance, { API_URL } from '../../config/api';
import { resizeImageFile } from '../../pages/ORDER/components/OrderDetail/ImageResizeUtil';
import { getUserProfile } from '../../utils/userProfileHelper';

const QuickOrderItemInput = ({
  itemData = { item: null, photos: [], notes: '' },
  onChange,
  index,
  maxPhotos: maxPhotosProp = 3, // Default untuk Quick Order (lebih simple)
  customerId = null
}) => {
  // Debug: Log customerId
  useEffect(() => {
    console.log('🔍 QuickOrderItemInput - Props:', { customerId, index });
  }, [customerId, index]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItemFields, setNewItemFields] = useState({ name: '', brand: '', color: '', material: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [maxPhotos, setMaxPhotos] = useState(maxPhotosProp); // State untuk max photos dinamis
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [customerItemsHistory, setCustomerItemsHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // Fetch subscription plan untuk menentukan max photos
  useEffect(() => {
    const fetchMaxPhotos = async () => {
      try {
        const profile = await getUserProfile();
        // Subscription ada di level root, bukan di dalam tenant
        const planId = profile?.subscription?.plan?.id;
        
        // NotaFree (plan_id = 4): max 3 foto, Paid plans: max 10 foto
        if (planId === 4) {
          setMaxPhotos(3);
        } else {
          setMaxPhotos(10);
        }
      } catch (error) {
        console.error('Error fetching subscription plan:', error);
        // Fallback ke default dari props
        setMaxPhotos(maxPhotosProp);
      }
    };

    fetchMaxPhotos();
  }, [maxPhotosProp]);

  // Fetch customer items history saat component mount
  useEffect(() => {
    const fetchHistory = async () => {
      if (!customerId) {
        setCustomerItemsHistory([]);
        return;
      }
      
      setLoadingHistory(true);
      try {
        const response = await instance.get(`/customers/${customerId}/items-history`);
        if (response.data.success) {
          const historyData = response.data.data || [];
          setCustomerItemsHistory(historyData);
          console.log('✅ QuickOrderItemInput - History fetched:', historyData.length, 'items');
        }
      } catch (error) {
        console.error('❌ QuickOrderItemInput - Error fetching customer items history:', error);
        setCustomerItemsHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [customerId]);

  // Filter history items berdasarkan search
  const filteredHistoryItems = customerItemsHistory.filter(historyItem => {
    if (!historySearch.trim()) return true;
    const searchLower = historySearch.toLowerCase();
    const item = historyItem.item;
    return (
      item.name?.toLowerCase().includes(searchLower) ||
      item.brand?.toLowerCase().includes(searchLower) ||
      item.color?.toLowerCase().includes(searchLower) ||
      item.material?.toLowerCase().includes(searchLower)
    );
  });

  // Handler pilih item dari history
  const handleSelectHistoryItem = (historyItem) => {
    onChange({
      ...itemData,
      item: historyItem.item
    });
    setShowHistoryModal(false);
    setHistorySearch('');
  };

  // Debounce search
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchItems(search);
        setSearchResults(results || []);
      } catch (error) {
        console.error('Error searching items:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Handler pilih item dari search
  const handleSelectItem = (selectedItem) => {
    onChange({
      ...itemData,
      item: selectedItem
    });
    setSearch('');
    setSearchResults([]);
  };

  // Handler create item baru
  const handleCreateItem = async () => {
    if (!newItemFields.name?.trim()) {
      alert('Nama item wajib diisi');
      return;
    }

    try {
      const created = await createItem({
        name: newItemFields.name,
        brand: newItemFields.brand || '',
        color: newItemFields.color || '',
        material: newItemFields.material || '',
        type: 'Shoes'
      });
      
      onChange({
        ...itemData,
        item: created
      });
      
      setShowNewItemForm(false);
      setNewItemFields({ name: '', brand: '', color: '', material: '' });
      setSearch('');
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Gagal membuat item baru');
    }
  };

  // Handler upload photo
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const currentPhotos = itemData.photos || [];
    const newPhotosCount = files.length;
    const totalPhotos = currentPhotos.length + newPhotosCount;

    if (totalPhotos > maxPhotos) {
      setUploadError(`Maksimal ${maxPhotos} foto`);
      return;
    }

    // Validasi file
    const MAX_SIZE_MB = 10;
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setUploadError('File harus berupa gambar');
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setUploadError(`Ukuran maksimal ${MAX_SIZE_MB}MB per foto`);
        return;
      }
    }

    setUploading(true);
    setUploadError('');

    try {
      const uploadedPhotos = [];
      
      for (const file of files) {
        // Resize
        const resizedBlob = await resizeImageFile(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.7 });
        const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });
        
        // Upload
        const formData = new FormData();
        formData.append('photos', resizedFile);
        
        const res = await instance.post('/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
        });
        
        if (res.data && Array.isArray(res.data.data)) {
          const photos = res.data.data.map(photo => {
            if (photo.url_photo && !photo.url_photo.startsWith('http')) {
              return { ...photo, url_photo: `${API_URL}/${photo.url_photo.replace(/^\//, '')}` };
            }
            return photo;
          });
          uploadedPhotos.push(...photos);
        }
      }

      onChange({
        ...itemData,
        photos: [...currentPhotos, ...uploadedPhotos]
      });
    } catch (error) {
      console.error('Error uploading photos:', error);
      setUploadError('Gagal upload foto');
    } finally {
      setUploading(false);
      // Reset both file inputs
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (galleryInputRef.current) {
        galleryInputRef.current.value = '';
      }
    }
  };

  // Handler remove photo
  const handleRemovePhoto = (idx) => {
    const newPhotos = (itemData.photos || []).filter((_, i) => i !== idx);
    onChange({
      ...itemData,
      photos: newPhotos
    });
  };

  // Handler remove item
  const handleRemoveItem = () => {
    onChange({
      item: null,
      photos: [],
      notes: ''
    });
  };

  const hasItem = !!itemData.item;
  const hasData = hasItem || (itemData.photos?.length > 0) || itemData.notes;

  return (
    <div className={`border-2 rounded-xl p-3 transition-all ${
      hasData 
        ? 'border-blue-300 bg-blue-50' 
        : 'border-dashed border-gray-300 bg-gray-50'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-700 font-montserrat">
          Item {index + 1}
        </span>
        {hasItem && (
          <button
            onClick={handleRemoveItem}
            className="text-xs text-red-500 hover:text-red-700 font-montserrat"
            title="Hapus item"
          >
            Hapus
          </button>
        )}
      </div>

      {/* Button Cek Item Sebelumnya */}
      {!hasItem && customerId && (
        loadingHistory ? (
          <div className="w-full flex items-center justify-center gap-2 py-2 px-3 mb-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 font-montserrat font-medium text-xs">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            Memuat riwayat item...
          </div>
        ) : customerItemsHistory.length > 0 ? (
          <button
            onClick={() => setShowHistoryModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 mb-3 bg-green-50 border border-green-500 rounded-lg text-green-600 hover:bg-green-100 transition-all duration-200 font-montserrat font-medium text-xs"
          >
            <History className="w-4 h-4" />
            Cek Item sebelumnya ({customerItemsHistory.length} item)
          </button>
        ) : null
      )}

      {/* Search Item */}
      {!hasItem && (
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent font-montserrat"
            />
            {isSearching && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-1 max-h-32 overflow-y-auto border border-gray-200 rounded-lg bg-white">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="text-xs font-medium text-gray-900 font-montserrat">{item.name}</div>
                  {(item.brand || item.color) && (
                    <div className="text-[10px] text-gray-500 font-montserrat">
                      {[item.brand, item.color].filter(Boolean).join(' • ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Button Create New */}
          {!showNewItemForm && (
            <button
              onClick={() => setShowNewItemForm(true)}
              className="mt-2 w-full flex items-center justify-center gap-1 py-1.5 text-xs border border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 font-montserrat"
            >
              <Plus className="w-3 h-3" />
              Buat Item Baru
            </button>
          )}

          {/* New Item Form */}
          {showNewItemForm && (
            <div className="mt-2 p-2 border border-blue-200 rounded-lg bg-white">
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Nama Item *"
                  value={newItemFields.name}
                  onChange={(e) => setNewItemFields({ ...newItemFields, name: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-400 font-montserrat"
                />
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="text"
                    placeholder="Brand"
                    value={newItemFields.brand}
                    onChange={(e) => setNewItemFields({ ...newItemFields, brand: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-400 font-montserrat"
                  />
                  <input
                    type="text"
                    placeholder="Warna"
                    value={newItemFields.color}
                    onChange={(e) => setNewItemFields({ ...newItemFields, color: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-400 font-montserrat"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Material"
                  value={newItemFields.material}
                  onChange={(e) => setNewItemFields({ ...newItemFields, material: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-400 font-montserrat"
                />
                <div className="flex gap-1">
                  <button
                    onClick={handleCreateItem}
                    className="flex-1 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-montserrat"
                  >
                    Simpan
                  </button>
                  <button
                    onClick={() => {
                      setShowNewItemForm(false);
                      setNewItemFields({ name: '', brand: '', color: '', material: '' });
                    }}
                    className="flex-1 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-montserrat"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Item Display */}
      {hasItem && (
        <div className="mb-2 p-2 bg-white rounded border border-blue-200">
          <div className="text-xs font-medium text-gray-900 font-montserrat">{itemData.item.name}</div>
          {itemData.item.brand && (
            <div className="text-[10px] text-gray-500 font-montserrat">{itemData.item.brand}</div>
          )}
        </div>
      )}

      {/* Photo Upload */}
      <div className="mb-2">
        {/* Input untuk Ambil Foto (camera) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoUpload}
          className="hidden"
          disabled={uploading || (itemData.photos?.length || 0) >= maxPhotos}
        />
        {/* Input untuk Gallery (multiple) */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoUpload}
          className="hidden"
          disabled={uploading || (itemData.photos?.length || 0) >= maxPhotos}
        />
        
        {/* Button Group: Ambil Foto & Gallery */}
        {(itemData.photos?.length || 0) < maxPhotos ? (
          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer flex items-center justify-center border border-blue-300 rounded-lg px-2 py-1.5 bg-blue-50 hover:bg-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed">
              <Camera className="w-3 h-3 text-blue-500 mr-1" />
              <span className="text-blue-600 font-medium text-xs font-montserrat">Ambil Foto</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploading || (itemData.photos?.length || 0) >= maxPhotos}
              />
            </label>
            <label className="flex-1 cursor-pointer flex items-center justify-center border border-gray-300 rounded-lg px-2 py-1.5 bg-gray-50 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed">
              <ImageIcon className="w-3 h-3 text-gray-500 mr-1" />
              <span className="text-gray-600 font-medium text-xs font-montserrat">Gallery</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploading || (itemData.photos?.length || 0) >= maxPhotos}
              />
            </label>
          </div>
        ) : (
          <div className="text-xs text-gray-500 font-montserrat text-center py-1.5">
            Maksimal {maxPhotos} foto telah tercapai
          </div>
        )}
        
        {/* Info: Foto count */}
        <div className="text-[10px] text-gray-500 font-montserrat text-center mt-1">
          Foto: {(itemData.photos?.length || 0)}/{maxPhotos}
        </div>
        
        {uploadError && (
          <div className="mt-1 text-[10px] text-red-500 font-montserrat">{uploadError}</div>
        )}
        {uploading && (
          <div className="mt-1 text-[10px] text-blue-500 font-montserrat text-center">Uploading...</div>
        )}
      </div>

      {/* Photo Preview */}
      {itemData.photos && itemData.photos.length > 0 && (
        <div className="mb-2 flex gap-1 flex-wrap">
          {itemData.photos.map((photo, idx) => (
            <div key={idx} className="relative">
              <img
                src={photo.url_photo || photo}
                alt={`Photo ${idx + 1}`}
                className="w-12 h-12 object-cover rounded border border-gray-200"
              />
              <button
                onClick={() => handleRemovePhoto(idx)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      <div>
        <textarea
          placeholder="Catatan (opsional)"
          value={itemData.notes || ''}
          onChange={(e) => onChange({ ...itemData, notes: e.target.value })}
          rows={2}
          className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-400 resize-none font-montserrat"
        />
      </div>

      {/* History Items Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setHistorySearch('');
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              <h3 className="text-lg font-bold text-gray-800 font-montserrat">Item Sebelumnya</h3>
              <div className="w-7"></div>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cari item..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent font-montserrat"
                />
              </div>
            </div>

            {/* List Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredHistoryItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 font-montserrat">
                    {historySearch ? 'Tidak ada item yang cocok' : 'Belum ada riwayat item'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredHistoryItems.map((historyItem, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectHistoryItem(historyItem)}
                      className="w-full p-2 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
                    >
                      <div className="text-xs font-semibold text-green-800 font-montserrat">
                        {historyItem.item.brand} {historyItem.item.name} {historyItem.item.color && `(${historyItem.item.color})`}
                      </div>
                      <div className="text-[10px] text-gray-600 font-montserrat mt-1">
                        Digunakan {historyItem.usage_count}x • Terakhir: {new Date(historyItem.last_used_at).toLocaleDateString('id-ID')}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickOrderItemInput;

