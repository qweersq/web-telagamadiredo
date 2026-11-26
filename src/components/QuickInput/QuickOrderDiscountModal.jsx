import React, { useState, useEffect } from 'react';
import { Search, X, Plus, Tag, CheckCircle, Percent } from 'lucide-react';
import { getDiscounts } from '../../pages/ORDER/api/orderApi';
import instance from '../../config/api';
import { getUserData } from '../../utils/userProfileHelper';

const QuickOrderDiscountModal = ({
  discounts = [],
  subtotal = 0,
  activeDiscountId = null,
  onSelect,
  onClose,
  onRefreshDiscounts
}) => {
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'add'
  const [searchTerm, setSearchTerm] = useState('');
  // ✅ Inisialisasi selectedId dari activeDiscountId agar diskon aktif langsung ter-highlight
  const [selectedId, setSelectedId] = useState(activeDiscountId || null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state untuk create discount
  const [newDiscount, setNewDiscount] = useState({ 
    name: '', 
    type: 'percent', 
    discount: '' 
  });
  
  // Validation state
  const [formErrors, setFormErrors] = useState({
    name: '',
    discount: ''
  });

  // Filter discounts berdasarkan search — hanya tampilkan yang aktif
  const filtered = (discounts || []).filter(discount => {
    const name = discount.name || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    // Tampilkan semua (aktif dan tidak aktif) tapi beri tanda
    return matchesSearch;
  });

  // Calculate discount amount dari total tagihan
  const calculateDiscountAmount = (discount) => {
    if (!discount || subtotal <= 0) return 0;
    const discVal = discount.discount != null ? Number(discount.discount) : Number(discount.value) || 0;
    if (discount.type === 'percent') {
      return subtotal * discVal / 100;
    } else if (discount.type === 'nominal') {
      return discVal;
    }
    return 0;
  };

  const handleSelect = (discount) => {
    setSelectedId(discount.id);
    setTimeout(() => {
      onSelect(discount);
      onClose();
    }, 200);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    try {
      // Refresh discounts dari API
      if (onRefreshDiscounts) {
        await onRefreshDiscounts();
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Validate form
  const validateForm = (data) => {
    const errors = {};
    let isValid = true;

    if (!data.name || data.name.trim().length === 0) {
      errors.name = 'Nama diskon wajib diisi';
      isValid = false;
    }

    if (!data.discount || data.discount.toString().trim().length === 0) {
      errors.discount = 'Nilai diskon wajib diisi';
      isValid = false;
    } else {
      const discountValue = parseFloat(data.discount.toString().replace(/[^0-9.]/g, ''));
      if (isNaN(discountValue) || discountValue <= 0) {
        errors.discount = 'Nilai diskon harus lebih dari 0';
        isValid = false;
      }
      if (data.type === 'percent' && discountValue > 100) {
        errors.discount = 'Diskon persentase tidak boleh lebih dari 100%';
        isValid = false;
      }
    }

    return { errors, isValid };
  };

  // Parse formatted number
  const parseFormattedNumber = (value) => {
    if (!value) return 0;
    return parseFloat(value.toString().replace(/[^0-9.]/g, '')) || 0;
  };

  const handleAddDiscount = async () => {
    // Final validation
    const { errors, isValid } = validateForm(newDiscount);
    setFormErrors(errors);

    if (!isValid) {
      alert('Mohon perbaiki kesalahan pada form sebelum menyimpan');
      return;
    }

    try {
      setIsCreating(true);
      const userData = await getUserData();
      
      const payload = {
        name: newDiscount.name.trim(),
        type: newDiscount.type,
        discount: parseFormattedNumber(newDiscount.discount),
        tenant_id: userData?.tenant_id || null
      };

      const response = await instance.post('/discounts', payload);
      
      if (response.data.success && response.data.data) {
        const createdDiscount = response.data.data;
        
        // ✅ FIX RACE CONDITION: Refresh discounts list DULU di parent
        // agar state discounts[] sudah ter-update sebelum modal menutup
        if (onRefreshDiscounts) {
          await onRefreshDiscounts();
        }

        // Baru kemudian select (menutup modal & set discount_id di parent)
        handleSelect(createdDiscount);
        
        // Reset form
        setNewDiscount({ name: '', type: 'percent', discount: '' });
        setFormErrors({ name: '', discount: '' });
        
        alert('Potongan berhasil dibuat');
      }
    } catch (error) {
      console.error('Error creating discount:', error);
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          'Gagal membuat potongan';
      alert(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 sm:p-8 z-50" style={{
      paddingTop: 'max(2rem, env(safe-area-inset-top))',
      paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      paddingLeft: 'max(2rem, env(safe-area-inset-left))',
      paddingRight: 'max(2rem, env(safe-area-inset-right))'
    }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-telaga-100 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] rounded-t-2xl flex-shrink-0 border-b-2 border-telaga-200">
          <h3 className="text-lg font-semibold text-white tracking-wide font-montserrat flex items-center gap-2">
            <Tag className="w-5 h-5" />Pilih Potongan
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-telaga-400 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="px-4 py-4 flex-shrink-0">
          {/* Tab Navigation */}
          <div className="flex mb-4 bg-telaga-50 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-2 px-4 rounded-md font-montserrat text-sm font-medium transition-colors ${
                activeTab === 'search'
                  ? 'bg-white text-telaga-600 shadow-sm'
                  : 'text-telaga-900/70 hover:text-telaga-950'
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Cari Potongan
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`flex-1 py-2 px-4 rounded-md font-montserrat text-sm font-medium transition-colors ${
                activeTab === 'add'
                  ? 'bg-white text-telaga-600 shadow-sm'
                  : 'text-telaga-900/70 hover:text-telaga-950'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Tambah Potongan Baru
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-4 pb-4" style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}>
          {/* Search Tab */}
          {activeTab === 'search' && (
            <>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-telaga-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Cari potongan..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-4 py-3 border border-telaga-100 rounded-lg focus:ring-2 focus:ring-telaga-400 focus:border-transparent text-sm font-montserrat shadow-sm"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={!searchTerm.trim() || isSearching}
                  className="px-4 py-3 bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] text-white rounded-lg hover:from-[#4088EB] hover:to-[#6BC1ED] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-montserrat font-medium"
                >
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    'Cari'
                  )}
                </button>
              </div>

              {/* Discount List */}
              <div className="space-y-2">
                {filtered.length > 0 ? filtered.map(discount => {
                  // ✅ Cek apakah diskon aktif (is_active bisa boolean atau undefined)
                  const isActive = discount.is_active === undefined || discount.is_active === null || discount.is_active === true || discount.is_active === 1;
                  return (
                    <div
                      key={discount.id}
                      onClick={() => isActive ? handleSelect(discount) : null}
                      className={`p-3 border rounded-lg transition-colors shadow-sm flex items-center gap-3 ${
                        !isActive
                          ? 'border-telaga-100 bg-telaga-50/40 opacity-60 cursor-not-allowed'
                          : selectedId === discount.id
                            ? 'border-2 border-telaga-600 bg-telaga-50 ring-2 ring-telaga-200 cursor-pointer'
                            : 'border-telaga-100 hover:border-telaga-400 hover:bg-telaga-50 cursor-pointer'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="space-y-1">
                          {/* Nama Discount + Badge tidak aktif */}
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${selectedId === discount.id ? 'text-telaga-800' : 'text-telaga-700'} font-montserrat`}>
                              {discount.name || 'Nama tidak tersedia'}
                            </span>
                            {!isActive && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-montserrat">
                                Tidak Aktif
                              </span>
                            )}
                          </div>
                          
                          {/* Type & Value */}
                          <div className="flex items-center gap-2 text-xs text-telaga-900/70 font-montserrat">
                            {discount.type === 'percent' ? (
                              <>
                                <Percent className="w-3 h-3" />
                                <span>{discount.discount || discount.value || 0}%</span>
                              </>
                            ) : (
                              <span>Rp {Number(discount.discount || discount.value || 0).toLocaleString()}</span>
                            )}
                          </div>
                          
                          {/* Potongan dari Total Tagihan — hanya jika aktif */}
                          {subtotal > 0 && isActive && (
                            <div className="text-xs font-semibold text-telaga-600 font-montserrat">
                              Potongan: Rp {calculateDiscountAmount(discount).toLocaleString()}
                            </div>
                          )}
                          {!isActive && (
                            <div className="text-xs text-red-500 font-montserrat">
                              Diskon ini tidak dapat dipilih
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Selection Icon */}
                      {isActive && (
                        selectedId === discount.id ? (
                          <CheckCircle className="w-5 h-5 text-telaga-600 font-montserrat" />
                        ) : (
                          <Plus className="w-4 h-4 text-telaga-400 font-montserrat" />
                        )
                      )}
                    </div>
                  );
                }) : (
                  <div className="text-center text-telaga-900/40 text-sm py-4 font-montserrat">
                    {searchTerm ? 'Klik Tombol Cari, jika tidak ditemukan potongan silakan tambahkan potongan baru.' : 'Belum ada potongan yang dicari.'}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Add Discount Tab */}
          {activeTab === 'add' && (
            <div className="space-y-4">
              <div className="text-center text-telaga-900/70 text-sm mb-4 font-montserrat">
                Tambah potongan baru ke sistem
              </div>
              
              {/* Nama Discount */}
              <div>
                <label className="block text-xs font-semibold text-telaga-900/70 mb-1 font-montserrat">
                  Nama Potongan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Diskon Member, Promo Bulan Ini"
                  value={newDiscount.name}
                  onChange={e => {
                    setNewDiscount(prev => ({ ...prev, name: e.target.value }));
                    if (formErrors.name) {
                      setFormErrors(prev => ({ ...prev, name: '' }));
                    }
                  }}
                  className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-telaga-400 focus:border-transparent text-sm font-montserrat ${
                    formErrors.name ? 'border-red-300' : 'border-telaga-100'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-500 mt-1 font-montserrat">{formErrors.name}</p>
                )}
              </div>

              {/* Type Discount */}
              <div>
                <label className="block text-xs font-semibold text-telaga-900/70 mb-1 font-montserrat">
                  Tipe Potongan <span className="text-red-500">*</span>
                </label>
                <select
                  value={newDiscount.type}
                  onChange={e => setNewDiscount(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-3 border border-telaga-100 rounded-lg focus:ring-2 focus:ring-telaga-400 focus:border-transparent text-sm font-montserrat"
                  style={{ WebkitAppearance: 'none' }}
                >
                  <option value="percent">Persentase (%)</option>
                  <option value="nominal">Nominal (Rp)</option>
                </select>
              </div>

              {/* Nilai Discount */}
              <div>
                <label className="block text-xs font-semibold text-telaga-900/70 mb-1 font-montserrat">
                  Nilai Potongan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  {newDiscount.type === 'percent' ? (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-telaga-900/60">
                      <Percent className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-telaga-900/60 font-montserrat">
                      Rp
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder={newDiscount.type === 'percent' ? 'Contoh: 10 (untuk 10%)' : 'Contoh: 5000'}
                    value={newDiscount.discount}
                    onChange={e => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      setNewDiscount(prev => ({ ...prev, discount: value }));
                      if (formErrors.discount) {
                        setFormErrors(prev => ({ ...prev, discount: '' }));
                      }
                    }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-telaga-400 focus:border-transparent text-sm font-montserrat ${
                      formErrors.discount ? 'border-red-300' : 'border-telaga-100'
                    }`}
                  />
                </div>
                {formErrors.discount && (
                  <p className="text-xs text-red-500 mt-1 font-montserrat">{formErrors.discount}</p>
                )}
                {newDiscount.type === 'percent' && (
                  <p className="text-xs text-telaga-900/60 mt-1 font-montserrat">
                    Maksimal 100%
                  </p>
                )}
                
                {/* Preview Perhitungan Potongan */}
                {subtotal > 0 && newDiscount.discount && !formErrors.discount && (
                  <div className="mt-2 p-3 bg-telaga-50 border border-telaga-200 rounded-lg">
                    <div className="text-xs font-semibold text-telaga-800 font-montserrat mb-1">
                      Preview Potongan
                    </div>
                    <div className="text-sm text-telaga-700 font-montserrat">
                      {newDiscount.type === 'percent' ? (
                        <>
                          {newDiscount.discount}% dari Rp {subtotal.toLocaleString()} = Rp {(
                            subtotal * parseFloat(newDiscount.discount || 0) / 100
                          ).toLocaleString()}
                        </>
                      ) : (
                        <>
                          Potongan: Rp {Number(newDiscount.discount || 0).toLocaleString()}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleAddDiscount}
                disabled={!newDiscount.name || !newDiscount.discount || isCreating}
                className="w-full py-3 bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] text-white rounded-lg hover:from-[#4088EB] hover:to-[#6BC1ED] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-montserrat font-medium"
              >
                {isCreating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Membuat...
                  </span>
                ) : (
                  <>
                    <Plus className="w-4 h-4 inline mr-2" />
                    Tambah Potongan
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickOrderDiscountModal;

