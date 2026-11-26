import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Search, MessageSquare } from 'lucide-react';
import AnimatedButton from '../../../../components/Design/AnimatedButton';

// Opsi cepat tanpa biaya (tidak mengubah harga, hanya dicatat untuk dapur/barista).
// Dua baris: baris 1 gula, baris 2 es & suhu.
const QUICK_OPTION_ROWS = [
  [
    { key: 'sugar', value: 'Less Sugar' },
    { key: 'sugar', value: 'Normal Sugar' },
    { key: 'sugar', value: 'Tanpa Gula' },
  ],
  [
    { key: 'ice', value: 'Tanpa Es' },
    { key: 'ice', value: 'Es Normal' },
    { key: 'temperature', value: 'Panas' },
    { key: 'temperature', value: 'Dingin' },
  ],
];

const NOTE_MAX_LENGTH = 255; // order_details.description = varchar(255)

const AddTreatmentModal = ({
  open,
  treatments,
  discounts,
  selectedTreatment,
  onSelectTreatment,
  qty,
  onQtyChange,
  discount,
  onDiscountChange,
  dueDate,
  onDueDateChange,
  serveMode = null,
  onServeModeChange,
  defaultServeMode = 'dine-in',
  note = '',
  onNoteChange,
  options = {},
  onOptionsChange,
  onAdd,
  onClose,
  title = 'Tambah Produk/Paket',
  actionLabel = 'Tambah Produk/Paket',
}) => {
  // State untuk searchable dropdown
  const [isTreatmentDropdownOpen, setIsTreatmentDropdownOpen] = useState(false);
  const [treatmentSearchTerm, setTreatmentSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const treatmentDropdownRef = useRef(null);

  const getCurrentLocalDate = useCallback(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
  }, []);

  // Dine-in / bawa pulang per item — grup berbeda walau produknya sama
  const SERVE_MODE_OPTIONS = [
    { value: 'dine-in', label: 'Dine-in' },
    { value: 'takeaway', label: 'Bawa Pulang' },
  ];
  const activeServeMode = serveMode || defaultServeMode;

  // Catatan & opsi cepat (gula/es/suhu) hanya relevan untuk minuman.
  const isDrink = selectedTreatment?.type_service === 'Minuman';

  // Penyajian (dine-in / bawa pulang) hanya untuk produk F&B.
  // Tiket & paket wisata selalu dipakai hari itu juga.
  const isServeable = ['Makanan', 'Minuman', 'Snack', 'Souvenir']
    .includes(selectedTreatment?.type_service);

  // Filter treatments berdasarkan search term
  const filteredTreatments = useMemo(() => {
    if (!treatmentSearchTerm.trim()) {
      return treatments;
    }
    return treatments.filter(treatment =>
      treatment.name.toLowerCase().includes(treatmentSearchTerm.toLowerCase())
    );
  }, [treatments, treatmentSearchTerm]);

  // Memoize handlers to prevent infinite loops
  const handleTreatmentChange = useCallback((treatment) => {
    onSelectTreatment(treatment);
    setIsTreatmentDropdownOpen(false);
    setTreatmentSearchTerm('');
    setSelectedIndex(-1);
  }, [onSelectTreatment]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isTreatmentDropdownOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredTreatments.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredTreatments.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredTreatments[selectedIndex]) {
          handleTreatmentChange(filteredTreatments[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsTreatmentDropdownOpen(false);
        setTreatmentSearchTerm('');
        setSelectedIndex(-1);
        break;
    }
  }, [isTreatmentDropdownOpen, selectedIndex, filteredTreatments, handleTreatmentChange]);

  // Reset selected index when search term changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [treatmentSearchTerm]);

  const handleQtyChange = useCallback((e) => {
    onQtyChange(Number(e.target.value));
  }, [onQtyChange]);

  const handleDiscountChange = useCallback((e) => {
    const selectedDiscount = discounts.find(d => d.id === Number(e.target.value));
    onDiscountChange(selectedDiscount || null);
  }, [discounts, onDiscountChange]);

  useEffect(() => {
    if (selectedTreatment?.requires_tracking === false) {
      if (!dueDate) {
        onDueDateChange(getCurrentLocalDate());
      }
    }
  }, [selectedTreatment, dueDate, onDueDateChange, getCurrentLocalDate]);


  const activeOptions = options || {};

  const toggleOption = useCallback((chip) => {
    const next = { ...activeOptions };
    if (next[chip.key] === chip.value) {
      delete next[chip.key];
    } else {
      next[chip.key] = chip.value;
    }
    onOptionsChange?.(next);
  }, [activeOptions, onOptionsChange]);

  const handleAdd = useCallback(() => {
    if (selectedTreatment && qty >= 1) {
      const isProductTreatment = selectedTreatment.requires_tracking === false;
      // Tanggal selesai tidak lagi diisi di kasir: produk otomatis hari ini,
      // layanan memakai due date yang sudah ada (undefined = pertahankan nilai lama).
      const normalizedDueDate = isProductTreatment
        ? (dueDate || getCurrentLocalDate())
        : (dueDate || undefined);

      onAdd(selectedTreatment, {
        qty,
        discount,
        process_time: 'regular', // Default value
        due_date: normalizedDueDate,
        // Tiket/paket tidak punya penyajian → biarkan null (ikut order_type).
        serve_mode: isServeable ? activeServeMode : null,
        // Catatan/opsi hanya disimpan untuk minuman
        note: isDrink ? (note || '').trim().slice(0, NOTE_MAX_LENGTH) : '',
        options: isDrink ? activeOptions : {},
        requires_tracking: !isProductTreatment,
      });
    }
  }, [selectedTreatment, qty, discount, dueDate, onAdd, getCurrentLocalDate, activeServeMode, note, activeOptions, isDrink, isServeable]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (treatmentDropdownRef.current && !treatmentDropdownRef.current.contains(event.target)) {
        setIsTreatmentDropdownOpen(false);
        setTreatmentSearchTerm('');
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Add keyboard event listener
  useEffect(() => {
    if (isTreatmentDropdownOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isTreatmentDropdownOpen, handleKeyDown]);

  // Memoize discount options
  const discountOptions = useMemo(() => {
    return discounts.map(discount => (
      <option key={discount.id} value={discount.id}>
        {discount.name} ({discount.type === 'nominal' ? `Rp ${Number(discount.discount).toLocaleString('id-ID')}` : `${discount.discount}%`})
      </option>
    ));
  }, [discounts]);

  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-6 sm:p-8" style={{
      paddingTop: 'max(2rem, env(safe-area-inset-top))',
      paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      paddingLeft: 'max(2rem, env(safe-area-inset-left))',
      paddingRight: 'max(2rem, env(safe-area-inset-right))'
    }}>
      <div className="bg-white rounded-2xl shadow-xl min-w-[90vw] max-w-[400px] w-full flex flex-col min-h-[60vh] sm:min-h-[65vh] max-h-[92vh] sm:max-h-[90vh] animate-fade-in">
        {/* Header - Fixed */}
        <div className="p-6 pb-4 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl relative">
          <button
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-xl font-bold font-montserrat text-gray-800 mb-1">{title}</h3>
          <p className="text-xs text-gray-500 font-montserrat">Atur detail produk/paket</p>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 pt-4" style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}>
          <div className="space-y-3">
            {/* Treatment Selection Dropdown */}
            <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih Produk/Paket</label>
          <div ref={treatmentDropdownRef} className="relative">
            <div
              className={`flex items-center justify-between w-full h-12 px-4 py-2 border-2 rounded-xl bg-white text-base font-montserrat cursor-pointer transition-all ${
                isTreatmentDropdownOpen 
                  ? 'border-telaga-400 ring-2 ring-telaga-400' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setIsTreatmentDropdownOpen(!isTreatmentDropdownOpen)}
            >
              <span className={selectedTreatment ? 'text-gray-900' : 'text-gray-500'}>
                {selectedTreatment ? `${selectedTreatment.name} - Rp ${Number(selectedTreatment.price).toLocaleString('id-ID')}` : 'Pilih Produk/Paket'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isTreatmentDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
            
            {isTreatmentDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-60 overflow-hidden">
                {/* Search Input */}
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari produk/paket..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-telaga-400 focus:border-transparent text-sm font-montserrat"
                      value={treatmentSearchTerm}
                      onChange={(e) => setTreatmentSearchTerm(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
                
                {/* Treatment List */}
                <div className="max-h-48 overflow-y-auto">
                  {filteredTreatments.length > 0 ? (
                    filteredTreatments.map((treatment, index) => (
                      <div
                        key={treatment.id}
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-telaga-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                          index === selectedIndex ? 'bg-telaga-50' : ''
                        }`}
                        onClick={() => handleTreatmentChange(treatment)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        onMouseLeave={() => setSelectedIndex(-1)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 font-montserrat">{treatment.name}</span>
                          <span className="text-sm text-gray-500 font-montserrat">Rp {Number(treatment.price).toLocaleString('id-ID')}</span>
                        </div>
                        {selectedTreatment?.id === treatment.id && (
                          <div className="w-2 h-2 bg-telaga-500 rounded-full"></div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-gray-500">
                      {treatmentSearchTerm ? 'Produk/paket tidak ditemukan' : 'Tidak ada produk/paket tersedia'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedTreatment && (
          <div className="space-y-3 mb-4">
            {/* Dine-in / Bawa pulang — bagian dari kunci grup, jadi produk yang
                sama dengan penyajian berbeda tampil sebagai kartu terpisah.
                Disembunyikan untuk tiket/paket wisata. */}
            {isServeable && (
            <div className="rounded-xl border-2 border-telaga-200 bg-telaga-50 p-3">
              <p className="mb-2 text-sm font-semibold text-telaga-700 font-montserrat">Penyajian</p>
              <div className="grid grid-cols-2 gap-2">
                {SERVE_MODE_OPTIONS.map((option) => {
                  const active = activeServeMode === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onServeModeChange(option.value)}
                      className={`h-11 rounded-xl border-2 text-sm font-bold font-montserrat transition-all ${
                        active
                          ? 'border-telaga-500 bg-white text-telaga-700 shadow-sm'
                          : 'border-telaga-100 bg-white/60 text-telaga-900/50 hover:bg-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-telaga-600 font-montserrat">
                Produk yang sama dengan penyajian berbeda disimpan sebagai grup terpisah.
              </p>
            </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Diskon</label>
              <select
                value={discount?.id || ''}
                onChange={handleDiscountChange}
                className="w-full h-12 px-4 py-2 border-2 border-telaga-200 rounded-xl text-base font-montserrat bg-white focus:outline-none focus:ring-2 focus:ring-telaga-400 focus:border-transparent"
                style={{ WebkitAppearance: 'none', backgroundColor: 'white' }}
              >
                <option value="">Tanpa Diskon</option>
                {discountOptions}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Jumlah (Qty)</label>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={handleQtyChange}
                className="w-full h-12 px-4 py-2 border-2 border-telaga-200 rounded-xl text-base font-montserrat bg-white focus:outline-none focus:ring-2 focus:ring-telaga-400 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 font-montserrat">
                Tentukan jumlah produk/paket yang dibeli.
              </p>
            </div>

            {/* Catatan & opsi cepat — khusus minuman (mis. less sugar) */}
            {isDrink && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Catatan <span className="font-normal text-gray-400">(opsional)</span>
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-telaga-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={note || ''}
                  maxLength={NOTE_MAX_LENGTH}
                  onChange={(e) => onNoteChange?.(e.target.value)}
                  placeholder="mis. es dipisah, tanpa saus"
                  className="w-full h-10 pl-9 pr-3 border-2 border-telaga-200 rounded-xl text-sm font-montserrat bg-white focus:outline-none focus:ring-2 focus:ring-telaga-400 focus:border-transparent"
                />
              </div>
              <div className="mt-2 flex flex-col gap-1.5">
                {QUICK_OPTION_ROWS.map((row, rowIdx) => (
                  <div key={`row-${rowIdx}`} className="flex flex-wrap gap-1.5">
                    {row.map((chip) => {
                      const active = activeOptions[chip.key] === chip.value;
                      return (
                        <button
                          key={`${chip.key}-${chip.value}`}
                          type="button"
                          onClick={() => toggleOption(chip)}
                          className={`flex-1 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[11px] font-semibold font-montserrat transition-colors ${
                            active
                              ? 'border-telaga-500 bg-telaga-500 text-white'
                              : 'border-telaga-200 bg-white text-telaga-900/60 hover:bg-telaga-50'
                          }`}
                        >
                          {chip.value}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500 font-montserrat">
                Opsi cepat tidak menambah harga, hanya dicatat untuk dapur/barista.
              </p>
            </div>
            )}

            {/* Perhitungan Final Harga */}
            {selectedTreatment && (() => {
              const basePrice = selectedTreatment.price ? Number(selectedTreatment.price) : 0;

              let discountAmount = 0;
              if (discount) {
                const discVal = discount.discount != null
                  ? Number(discount.discount)
                  : Number(discount.value) || 0;

                if (discount.type === 'percent') {
                  discountAmount = basePrice * (discVal / 100);
                } else if (discount.type === 'nominal') {
                  discountAmount = discVal;
                }
              }

              const finalPricePerItem = Math.max(0, Math.round(basePrice - discountAmount));
              const totalPrice = finalPricePerItem * qty;

              return (
                <div className="bg-telaga-50 border-2 border-telaga-200 rounded-xl p-3 mt-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700 font-montserrat">Harga per item:</span>
                    <span className="text-sm font-bold text-telaga-700 font-montserrat">Rp {finalPricePerItem.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-telaga-200">
                    <span className="text-xs font-semibold text-gray-700 font-montserrat">Total ({qty} item):</span>
                    <span className="text-base font-bold text-telaga-800 font-montserrat">Rp {totalPrice.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
          </div>
        </div>
        
        {/* Footer - Fixed */}
        <div className="p-6 pt-4 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
          <AnimatedButton
            variant="telaga"
            className="w-full h-12 py-4"
            onClick={handleAdd}
            disabled={!selectedTreatment}
          >
            {actionLabel}
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

export default AddTreatmentModal; 