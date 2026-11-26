import React, { useState, useEffect } from 'react';
import { X, Search, Camera, Image } from 'lucide-react';
import instance, { API_URL } from '../../../../config/api';
import { createItem } from '../../api/orderApi';
import AnimatedButton from '../../../../components/Design/AnimatedButton';
import { resizeImageFile } from './ImageResizeUtil';
import { getUserProfile } from '../../../../utils/userProfileHelper';

const EditItemModal = ({
  open,
  item: initialItem,
  mode = 'edit', // 'add' | 'edit'
  onChange,
  onSave,
  onClose,
  itemOptions,
  onItemSearch,
  isSearching = false, // Loading state dari parent
  customerId = null, // Customer ID untuk fetch history
}) => {
  const [item, setItem] = useState(initialItem || {});
  const [search, setSearch] = useState('');
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newItemFields, setNewItemFields] = useState({ name: '', brand: '', color: '', type: '', material: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, totalSize: 0 });
  const [lastUploadSize, setLastUploadSize] = useState(0);
  const [maxPhotos, setMaxPhotos] = useState(10); // Default untuk backward compatibility
  const [customerItemsHistory, setCustomerItemsHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // Reset search & hasil search saat modal dibuka (edit/ganti item)
  useEffect(() => {
    if (open && mode === 'edit') {
      setSearch('');
      if (onItemSearch) onItemSearch('', null);
    }
  }, [open, mode]);

  useEffect(() => {
    // Ambil value awal parfum dan notes dari initialItem (support field perfume/description)
    let base = initialItem || {};
    let parfum = base.parfum || base.perfume || '';
    let notes = base.notes || base.description || '';
    setItem({ ...base, parfum, notes });
    // Reset upload size saat item berbeda atau modal dibuka
    setLastUploadSize(0);
  }, [initialItem, open]);

  // Fetch subscription plan untuk menentukan max photos
  useEffect(() => {
    const fetchMaxPhotos = async () => {
      if (!open) return;
      
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
        // Fallback ke default
        setMaxPhotos(10);
      }
    };

    fetchMaxPhotos();
  }, [open]);

  // Fetch customer items history saat modal dibuka
  useEffect(() => {
    const fetchHistory = async () => {
      if (!open || !customerId) return;
      
      setLoadingHistory(true);
      try {
        const response = await instance.get(`/customers/${customerId}/items-history`);
        if (response.data.success) {
          setCustomerItemsHistory(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching customer items history:', error);
        setCustomerItemsHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [open, customerId]);

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

  if (!open) return null;
  const isExistingItem = !!item?.id && !showNewItemModal;

  // Handler ganti item
  const handleChangeItem = () => {
    const currentPhotos = item.shoes_photos || []; // Preserve current photos
    setItem({ parfum: '', notes: '', shoes_photos: currentPhotos });
    setSearch('');
    setLastUploadSize(0); // Reset upload size saat ganti item
    if (onItemSearch) onItemSearch('', null);
  };

  // Handler upload foto
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    // Validasi maksimal foto berdasarkan subscription plan
    const currentPhotosCount = item.shoes_photos?.length || 0;
    const newPhotosCount = files.length;
    const totalPhotos = currentPhotosCount + newPhotosCount;
    
    if (totalPhotos > maxPhotos) {
      setUploadError(`Maksimal ${maxPhotos} foto. Anda sudah memiliki ${currentPhotosCount} foto dan mencoba upload ${newPhotosCount} foto.`);
      return;
    }
    
    // Validasi tipe file dan ukuran
    const MAX_SIZE_MB = 10;
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Semua file harus berupa gambar!');
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setUploadError(`Ukuran gambar maksimal ${MAX_SIZE_MB}MB per foto!`);
        return;
      }
    }
    
    setUploading(true);
    setUploadError('');
    setUploadProgress({ current: 0, total: files.length, totalSize: 0 });
    setLastUploadSize(0); // Reset last upload size saat mulai upload baru
    
    try {
      const uploadedPhotos = [];
      let totalResizedSize = 0; // Total size setelah resize
      
      // Upload sequential per batch (1 foto per batch)
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress({ current: i + 1, total: files.length });
        
        // Resize file
        const resizedBlob = await resizeImageFile(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.7 });
        const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });
        
        // Hitung size setelah resize
        totalResizedSize += resizedBlob.size;
        setUploadProgress(prev => ({ ...prev, totalSize: totalResizedSize }));
        
        // Upload 1 foto per request
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
      
      // Update state dengan semua foto yang berhasil diupload
      setItem(prev => ({
        ...prev,
        shoes_photos: [...(prev.shoes_photos || []), ...uploadedPhotos],
      }));
      
      // Simpan total size setelah resize untuk ditampilkan
      setLastUploadSize(totalResizedSize);
    } catch (err) {
      setLastUploadSize(0); // Reset jika error
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setUploadError('Upload terlalu lama. Pastikan koneksi internet stabil dan coba lagi.');
      } else if (err.response?.data?.message) {
        setUploadError(err.response.data.message);
      } else {
        setUploadError('Gagal upload foto. Silakan coba lagi.');
      }
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0, totalSize: 0 });
    }
  };
  const handleRemovePhoto = (idx) => {
    setItem(prev => ({
      ...prev,
      shoes_photos: (prev.shoes_photos || []).filter((_, i) => i !== idx),
    }));
  };

  // Handler tambah item baru
  const handleAddNewItem = async () => {
    try {
      // Validasi field yang diperlukan - hanya name yang required berdasarkan database schema
      if (!newItemFields.name || newItemFields.name.trim() === '') {
        alert('Nama Item harus diisi');
        return;
      }

      // Buat item baru dengan data yang ada
      const itemData = {
        name: newItemFields.name,
        brand: newItemFields.brand,
        color: newItemFields.color || '',
        material: newItemFields.material || '',
        type: newItemFields.type || 'Shoes' // Default type untuk sepatu
      };

      const created = await createItem(itemData);
      const currentPhotos = item.shoes_photos || []; // Preserve current photos
      setItem({ ...created, parfum: '', notes: '', shoes_photos: currentPhotos });
      setShowNewItemModal(false);
      setNewItemFields({ name: '', brand: '', color: '', type: '', material: '' });
    } catch (err) {
      console.error('Error creating item:', err);
      alert('Gagal tambah item baru');
    }
  };

  // Handler pilih item dari search
  const handleSelectItem = (opt) => {
    const currentPhotos = item.shoes_photos || []; // Preserve current photos
    setItem({ ...opt, parfum: '', notes: '', shoes_photos: currentPhotos });
    setSearch('');
    setLastUploadSize(0); // Reset upload size saat pilih item baru
  };

  // Handler pilih item dari history
  const handleSelectHistoryItem = (historyItem) => {
    const currentPhotos = item.shoes_photos || []; // Preserve current photos
    setItem({ ...historyItem.item, parfum: '', notes: '', shoes_photos: currentPhotos });
    setLastUploadSize(0); // Reset upload size saat pilih item baru
  };

  // Handler simpan
  const handleSave = () => {
    // Pastikan order_detail_id tetap ada
    const itemToSave = { ...item };
    if (initialItem && initialItem.order_detail_id) {
      itemToSave.order_detail_id = initialItem.order_detail_id;
    }
    // Reset upload size setelah simpan
    setLastUploadSize(0);
    onSave(itemToSave);
  };

  // Handler search
  const handleSearchChange = (val) => {
    setSearch(val);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl border-2 border-telaga-100 shadow-2xl w-full max-w-md p-6 font-montserrat relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-montserrat font-bold text-gray-800 mb-4 text-center">{mode === 'add' ? 'Tambah Item' : 'Edit Item'}</h3>
        {/* Item Sebelumnya */}
        {!showNewItemModal && !item?.id && customerId && (
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Item Sebelumnya</div>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              </div>
            ) : customerItemsHistory.length > 0 ? (
              <>
                <div className="space-y-1.5 max-h-40 overflow-y-auto mb-3">
                  {customerItemsHistory.slice(0, 5).map((historyItem, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectHistoryItem(historyItem)}
                      className="p-2 rounded-md cursor-pointer bg-green-50 hover:bg-green-100 border border-green-200 transition-all"
                    >
                      <div className="text-xs font-semibold text-green-800 leading-tight">
                        {historyItem.item.brand} {historyItem.item.name} {historyItem.item.color && `(${historyItem.item.color})`}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 leading-tight">
                        {historyItem.usage_count}x • {new Date(historyItem.last_used_at).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
                {customerItemsHistory.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(true)}
                    className="w-full py-2 text-sm text-green-600 hover:text-green-700 font-semibold border border-green-300 rounded-lg hover:bg-green-50 transition-all font-montserrat"
                  >
                    Lihat Semua ({customerItemsHistory.length} item)
                  </button>
                )}
              </>
            ) : null}
          </div>
        )}
        {/* Search Item & Tambah Item Baru */}
        {!showNewItemModal && !item?.id && (
          <div className="mb-4">
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari item..."
                  value={search}
                  onChange={e => handleSearchChange(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && onItemSearch && !isSearching) {
                      onItemSearch(search, e);
                    }
                  }}
                  className="w-full h-12 pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-telaga-400 text-sm font-montserrat transition-all"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onItemSearch && search.trim()) {
                    const syntheticEvent = { preventDefault: () => {} };
                    onItemSearch(search, syntheticEvent);
                  }
                }}
                disabled={isSearching || !search.trim()}
                className="h-12 px-5 bg-gradient-to-r from-telaga-700 to-telaga-500 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
              >
                {isSearching ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm">Cari</span>
                  </div>
                ) : (
                  'Cari'
                )}
              </button>
            </div>
            {itemOptions && itemOptions.length > 0 && !item?.id && (
              <div className="max-h-80 overflow-y-auto space-y-1">
                {itemOptions.map((opt, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectItem(opt)}
                    className="p-2 rounded-lg cursor-pointer bg-telaga-50 hover:bg-telaga-100 border border-telaga-200 text-sm font-montserrat mb-1"
                  >
                    {opt.name} <span className="text-gray-400">({opt.brand}, {opt.color})</span>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              className="mt-2 w-full py-2 border-2 border-dashed border-telaga-300 rounded-xl text-telaga-600 hover:bg-telaga-50 hover:border-telaga-400 transition-all font-montserrat text-base font-semibold"
              onClick={() => setShowNewItemModal(true)}
            >
              + Tambah Item Baru
            </button>
          </div>
        )}
        {/* Ringkasan item terpilih + tombol ganti item */}
        {!showNewItemModal && item?.id && (
          <div className="mb-4 flex items-center gap-3 justify-between bg-telaga-50 border border-telaga-200 rounded-xl p-3">
            <div>
              <div className="font-semibold text-telaga-800">{item.name}</div>
              <div className="text-xs text-gray-600">{item.brand} {item.color} {item.material}</div>
            </div>
            <button
              type="button"
              className="px-3 py-1 rounded bg-telaga-100 text-telaga-700 text-xs font-semibold hover:bg-telaga-200 transition-all"
              onClick={handleChangeItem}
            >
              Ganti Item
            </button>
          </div>
        )}
        {/* Modal History Items */}
        {showHistoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl border-2 border-green-100 shadow-2xl w-full max-w-md p-6 font-montserrat relative max-h-[80vh] overflow-y-auto">
              <button
                className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100"
                onClick={() => {
                  setShowHistoryModal(false);
                  setHistorySearch('');
                }}
              >
                <X className="w-5 h-5" />
              </button>
              <h4 className="text-lg font-montserrat text-gray-800 mb-4 font-bold text-center">Item Sebelumnya</h4>
              
              {/* Search Input */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Cari item..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm font-montserrat"
                  />
                </div>
              </div>

              {/* List Items */}
              {filteredHistoryItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {historySearch ? 'Tidak ada item yang cocok' : 'Belum ada riwayat item'}
                </div>
              ) : (
                <div className="space-y-1.5 max-h-96 overflow-y-auto">
                  {filteredHistoryItems.map((historyItem, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        handleSelectHistoryItem(historyItem);
                        setShowHistoryModal(false);
                        setHistorySearch('');
                      }}
                      className="p-2 rounded-md cursor-pointer bg-green-50 hover:bg-green-100 border border-green-200 transition-all"
                    >
                      <div className="text-xs font-semibold text-green-800 leading-tight">
                        {historyItem.item.brand} {historyItem.item.name} {historyItem.item.color && `(${historyItem.item.color})`}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 leading-tight">
                        {historyItem.usage_count}x • {new Date(historyItem.last_used_at).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Modal Tambah Item Baru */}
        {showNewItemModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-auto relative">
              <button
                className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100"
                onClick={() => setShowNewItemModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
              <h4 className="text-lg font-montserrat text-gray-800 mb-4 font-bold text-center">Tambah Item Baru</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nama Item (e.g., Air Force 1, All Star)"
                  value={newItemFields.name}
                  onChange={e => setNewItemFields(f => ({ ...f, name: e.target.value }))}
                  className="w-full h-12 p-4 border-2 border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-telaga-400 text-base font-montserrat"
                  required
                />
                <input
                  type="text"
                  placeholder="Brand (e.g., Nike, Adidas, Converse)"
                  value={newItemFields.brand}
                  onChange={e => setNewItemFields(f => ({ ...f, brand: e.target.value }))}
                  className="w-full h-12 p-4 border-2 border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-telaga-400 text-base font-montserrat"
                />
                <input
                  type="text"
                  placeholder="Warna (e.g., Putih, Hitam, Biru Navy)"
                  value={newItemFields.color}
                  onChange={e => setNewItemFields(f => ({ ...f, color: e.target.value }))}
                  className="w-full h-12 p-4 border-2 border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-telaga-400 text-base font-montserrat"
                />
                <input
                  type="text"
                  placeholder="Tipe (e.g., Sneakers, Sport, Running)"
                  value={newItemFields.type}
                  onChange={e => setNewItemFields(f => ({ ...f, type: e.target.value }))}
                  className="w-full h-12 p-4 border-2 border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-telaga-400 text-base font-montserrat"
                />
                <input
                  type="text"
                  placeholder="Material (e.g., Leather, Canvas, Mesh)"
                  value={newItemFields.material}
                  onChange={e => setNewItemFields(f => ({ ...f, material: e.target.value }))}
                  className="w-full h-12 p-4 border-2 border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-telaga-400 text-base font-montserrat"
                />
              </div>
              <button
                onClick={handleAddNewItem}
                className="w-full mt-4 py-3 rounded-xl bg-telaga-500 text-white font-semibold hover:bg-telaga-600 transition-all shadow-sm"
              >
                Simpan Item
              </button>
            </div>
          </div>
        )}
        {/* Foto Preview & Upload */}
        {!showNewItemModal && (
          <div className="mb-4">
            {/* Counter foto */}
            <div className="text-xs text-gray-600 font-montserrat mb-2">
              Foto: {(item.shoes_photos || []).length}/{maxPhotos}
              {uploadProgress.total > 0 && (
                <span className="ml-2 text-telaga-600">
                  (Uploading: {uploadProgress.current}/{uploadProgress.total})
                </span>
              )}
            </div>
            
            <div className="flex gap-2 flex-wrap mb-2">
              {(item.shoes_photos || []).map((photo, idx) => (
                <div key={idx} className="relative group">
                  <img src={photo.url_photo} alt="Foto" className="w-16 h-16 object-cover rounded border" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-80 group-hover:opacity-100"
                    title="Hapus Foto"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
            </div>
            
            {/* Tombol upload - hanya muncul jika belum mencapai max foto */}
            {(item.shoes_photos?.length || 0) < maxPhotos && (
              <div className="flex gap-2 mt-2">
                <label className="flex-1 cursor-pointer flex items-center justify-center border border-telaga-300 rounded-lg px-3 py-2 bg-telaga-50 hover:bg-telaga-100 transition">
                  <Camera className="w-4 h-4 text-telaga-500 mr-1" />
                  <span className="text-telaga-600 font-medium text-xs">Ambil Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                <label className="flex-1 cursor-pointer flex items-center justify-center border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 hover:bg-gray-100 transition">
                  <Image className="w-4 h-4 text-gray-500 mr-1" />
                  <span className="text-gray-600 font-medium text-xs">Gallery</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            )}
            
            {/* Pesan info jika sudah maksimal */}
            {(item.shoes_photos?.length || 0) >= maxPhotos && (
              <div className="text-xs text-gray-500 font-montserrat mb-1 mt-2">
                Maksimal {maxPhotos} foto telah tercapai
              </div>
            )}
            
            {uploadError && <div className="text-xs text-red-500 font-montserrat mb-1">{uploadError}</div>}
            {uploading && (
              <div className="text-xs text-telaga-500 font-montserrat mb-1">
                Mengupload {uploadProgress.current}/{uploadProgress.total} foto
                {uploadProgress.totalSize > 0 && (
                  <span className="ml-1">
                    (Total: {(uploadProgress.totalSize / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                )}
              </div>
            )}
            {!uploading && lastUploadSize > 0 && (
              <div className="text-xs text-green-600 font-montserrat mb-1">
                ✓ Upload berhasil (Total: {(lastUploadSize / (1024 * 1024)).toFixed(2)} MB)
              </div>
            )}
          </div>
        )}
        {/* Input Item Detail */}
        {!showNewItemModal && (
          <div className="space-y-3">
            {/* Field parfum & notes selalu muncul jika sudah pilih item atau tambah baru */}
            {(isExistingItem || item?.name) && (
              <>
                <input
                  type="text"
                  value={item?.parfum || ''}
                  onChange={e => setItem({ ...item, parfum: e.target.value })}
                  placeholder="Parfum (kosongkan jika tanpa parfum)"
                  className="w-full min-h-12 h-auto p-4 border-2 border-telaga-200 rounded-xl text-sm font-montserrat focus:outline-none focus:ring-2 focus:ring-telaga-400 focus:border-transparent bg-white"
                />
                <textarea 
                  placeholder="Catatan/Notes (opsional)"
                  value={item?.notes || ''}
                  onChange={e => setItem({ ...item, notes: e.target.value })}
                  maxLength={160}
                  className="w-full min-h-12 h-auto p-4 border-2 border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-telaga-400 focus:border-transparent text-base font-montserrat resize-y"
                  rows={2}
                />
                <div className="flex justify-between items-center mt-1">
                  <div className="text-xs text-gray-500 font-montserrat">
                    {item?.notes?.length > 120 && (
                      <span className="text-orange-500">⚠️ Mendekati batas karakter</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 font-montserrat">
                    {item?.notes?.length || 0}/160 karakter
                  </div>
                </div>
              </>
            )}
          </div>
        )}
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
            onClick={handleSave}
          >
            Simpan
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

export default EditItemModal; 