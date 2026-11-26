import React, { useState, useRef, useMemo, useEffect } from 'react';
import dayjs from 'dayjs';
import { CheckCircle, Trash2, Search, Plus, AlertCircle, Ticket, ShoppingCart, ChevronUp, X } from 'lucide-react';
import QuantityInput from '../Design/QuantityInput';
import AnimatedButton from '../Design/AnimatedButton';
import QuickOrderItemCard from './QuickOrderItemCard';

const QuickOrderTreatmentSelect = ({ treatments, selectedTreatments, setSelectedTreatments, updateTreatmentDetail, discounts, customerId = null, onOpenAIDetection, isCafeMode = false, layout = 'stacked', customerSlot = null, outletMode = null, onContinue = null, canContinue = true, continueLabel = 'Lanjut ke Pembayaran' }) => {
  const isSplitLayout = layout === 'split';
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(''); // Filter chip kategori di panel picker
  // Label outlet untuk badge di header picker — katalog sudah disaring oleh
  // pemanggil berdasarkan `order_mode` kategori produk.
  const outletLabel = outletMode === 'loket' ? 'Loket' : outletMode === 'cafe' ? 'Cafe' : null;
  const [editError, setEditError] = useState({}); // {id: errorMsg}
  const [addModal, setAddModal] = useState(null); // {treatment, processTime, discount, qty, custom_price, items: []}
  const [addError, setAddError] = useState('');
  const [treatmentSearch, setTreatmentSearch] = useState(''); // Search untuk treatment di modal
  const [showTreatmentModal, setShowTreatmentModal] = useState(false); // Modal untuk pilih treatment
  const [useCustomPrice, setUseCustomPrice] = useState(false); // Toggle untuk custom price
  const [fillItemDetails, setFillItemDetails] = useState(false); // Toggle untuk isi detail item
  const [showMobileCart, setShowMobileCart] = useState(false); // Sheet keranjang + data customer (mobile)
  const [toastMessage, setToastMessage] = useState(''); // Notifikasi singkat setelah item masuk keranjang
  const prevValues = useRef({});

  // Kunci scroll body selama sheet keranjang terbuka.
  useEffect(() => {
    if (!showMobileCart) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [showMobileCart]);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timer = setTimeout(() => setToastMessage(''), 2200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Dine-in / bawa pulang ditentukan per item. Loket selalu bawa pulang.
  const defaultServeMode = isCafeMode ? 'dine-in' : 'takeaway';
  const SERVE_MODE_OPTIONS = [
    { value: 'dine-in', label: 'Dine-in' },
    { value: 'takeaway', label: 'Bawa Pulang' },
  ];

  // Chip opsi cepat — hanya relevan untuk minuman.
  const isDrinkTreatment = (treatment) => treatment?.type_service === 'Minuman';

  // Penyajian (dine-in / bawa pulang) hanya masuk akal untuk produk F&B.
  // Tiket & paket wisata selalu dipakai di hari yang sama, jadi disembunyikan.
  const PRODUCT_CATEGORIES = ['Makanan', 'Minuman', 'Snack', 'Souvenir'];
  const isServeableTreatment = (treatment) =>
    PRODUCT_CATEGORIES.includes(treatment?.type_service);

  // Opsi cepat tanpa biaya. Yang butuh harga tambahan masuk ke diskon/modifier,
  // bukan ke sini — supaya total tetap bisa dihitung dari `final_price`.
  const DRINK_OPTION_CHIPS = [
    { key: 'sugar', value: 'Less Sugar' },
    { key: 'sugar', value: 'Normal Sugar' },
    { key: 'sugar', value: 'Tanpa Gula' },
    { key: 'ice', value: 'Tanpa Es' },
    { key: 'ice', value: 'Es Normal' },
    { key: 'temperature', value: 'Panas' },
    { key: 'temperature', value: 'Dingin' },
  ];

  const toggleModalOption = (chip) => {
    setAddModal((current) => {
      if (!current) return current;
      const options = { ...(current.options || {}) };
      if (options[chip.key] === chip.value) {
        delete options[chip.key];
      } else {
        options[chip.key] = chip.value;
      }
      return { ...current, options };
    });
  };

  // Helper function untuk format angka yang robust
  const formatPrice = (price) => {
    try {
      const numPrice = Number(price);
      if (isNaN(numPrice)) return '0';
      return numPrice.toLocaleString('id-ID');
    } catch (error) {
      console.error('Error formatting price:', error);
      return '0';
    }
  };

  // Helper: check jika kombinasi layanan, diskon, dan harga custom sama (kecuali indeks tertentu)
  const isDuplicate = (candidate, atIndex = -1) =>
    selectedTreatments.some((existing, idx) => {
      if (idx === atIndex) return false;
      if (existing.id !== candidate.id) return false;

      const existingDiscountId = existing.discount?.id ?? null;
      const candidateDiscountId = candidate.discount?.id ?? null;
      if (existingDiscountId !== candidateDiscountId) return false;

      // Item boleh muncul lebih dari sekali kalau penyajian / catatannya beda
      // (mis. 2 Popmie dine-in + 1 Popmie bawa pulang).
      if ((existing.serve_mode || defaultServeMode) !== (candidate.serve_mode || defaultServeMode)) return false;
      if ((existing.note || '').trim() !== (candidate.note || '').trim()) return false;
      if (JSON.stringify(existing.options || {}) !== JSON.stringify(candidate.options || {})) return false;

      const existingCustomPrice = existing.custom_price != null ? Number(existing.custom_price) : null;
      const candidateCustomPrice = candidate.custom_price != null ? Number(candidate.custom_price) : null;

      const existingReason = (existing.custom_price_reason || '').trim();
      const candidateReason = (candidate.custom_price_reason || '').trim();

      const existingHasCustom = existingCustomPrice !== null;
      const candidateHasCustom = candidateCustomPrice !== null;

      if (!existingHasCustom && !candidateHasCustom) {
        return true;
      }

      if (
        existingHasCustom === candidateHasCustom &&
        existingCustomPrice === candidateCustomPrice &&
        existingReason === candidateReason
      ) {
        return true;
      }

      return false;
    });

  // Filtered search result (selalu tampil, meski sudah ada di keranjang)
  const searchResult = search.trim().length === 0
    ? []
    : treatments.filter(t => t.name.toLowerCase().includes(search.toLowerCase())).slice(0, 15);

  // Filtered treatments untuk modal
  const filteredTreatments = treatmentSearch.trim().length === 0
    ? treatments
    : treatments.filter(t => t.name.toLowerCase().includes(treatmentSearch.toLowerCase()));

  // ── Panel picker (layout split) ─────────────────────────────────────────
  // Kategori dibangun dari data treatment yang sudah dimuat. Item tanpa
  // kategori hanya muncul di chip "Semua".
  const treatmentCategoryId = (treatment) => {
    const raw = treatment?.category_id ?? treatment?.category?.id ?? null;
    return raw === null || raw === undefined || raw === '' ? '' : String(raw);
  };

  const categoryChips = useMemo(() => {
    const byId = new Map();
    treatments.forEach((t) => {
      const key = treatmentCategoryId(t);
      if (!key) return;
      const existing = byId.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        byId.set(key, { key, label: t.category?.name || 'Lainnya', count: 1 });
      }
    });
    return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label, 'id'));
  }, [treatments]);

  // Kategori bisa hilang dari daftar saat cabang aktif berubah — balik ke "Semua".
  useEffect(() => {
    if (activeCategory && !categoryChips.some((chip) => chip.key === activeCategory)) {
      setActiveCategory('');
    }
  }, [activeCategory, categoryChips]);

  const pickerTreatments = useMemo(() => {
    const keyword = treatmentSearch.trim().toLowerCase();
    return treatments.filter((t) => {
      if (activeCategory && treatmentCategoryId(t) !== activeCategory) return false;
      if (keyword && !(t.name || '').toLowerCase().includes(keyword)) return false;
      return true;
    });
  }, [treatments, activeCategory, treatmentSearch]);

  // Qty tiap item yang sudah masuk keranjang — badge kecil di kartu picker.
  const cartQtyByTreatmentId = useMemo(() => {
    const byId = new Map();
    selectedTreatments.forEach((item) => {
      byId.set(item.id, (byId.get(item.id) || 0) + (Number(item.qty) || 1));
    });
    return byId;
  }, [selectedTreatments]);

  const augmentModalData = (base) => {
    const treatmentIsProduct = isProductTreatment(base.treatment);
    const qty = base.qty || 1;
    // Generate items array jika belum ada atau qty berubah
    const items = base.items ? generateItemsArray(qty, base.items) : generateItemsArray(qty);
    
    return {
      ...base,
      dueDate: treatmentIsProduct ? dayjs().format('YYYY-MM-DD') : (base.dueDate || dayjs().add(2, 'day').format('YYYY-MM-DD')),
      requires_tracking: !treatmentIsProduct,
      qty: qty,
      items: items // Include items array
    };
  };

  const isProductTreatment = (treatment) => treatment?.requires_tracking === false;

  // Helper: Generate items array sesuai qty
  const generateItemsArray = (qty, existingItems = []) => {
    const currentLength = existingItems?.length || 0;
    const targetQty = Math.max(1, Number(qty) || 1);
    
    if (targetQty === currentLength) {
      return existingItems;
    }
    
    if (targetQty > currentLength) {
      // Tambah item kosong
      const newItems = Array.from({ length: targetQty - currentLength }, () => ({
        item: null,
        photos: [],
        notes: ''
      }));
      return [...(existingItems || []), ...newItems];
    } else {
      // Kurangi item (ambil yang pertama sesuai qty)
      return existingItems.slice(0, targetQty);
    }
  };

  // Pilih item langsung dari grid (layout split) → buka modal detail yang sama
  // dengan alur "Tambah" lama. Alur simpan tetap lewat `handleAddToCart`.
  const handlePickTreatment = (treatment) => {
    // Klik produk langsung membuka modal qty/detail, tanpa lewat keranjang.
    setAddModal(augmentModalData({
      treatment,
      discount: null,
      qty: 1,
      dueDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
      custom_price: null,
      serve_mode: defaultServeMode,
      note: '',
      options: {},
      items: []
    }));
    setAddError('');
    setUseCustomPrice(false);
    setFillItemDetails(false);
  };

  // Add treatment to keranjang (dari modal)
  const handleAddToCart = () => {
    if (!addModal) return;
    const { treatment, discount, qty, dueDate, editIndex, custom_price, custom_price_reason, items } = addModal;
    // Validasi field wajib
    if (!treatment) {
      setAddError('Pilih produk atau paket terlebih dahulu!');
      setTimeout(() => setAddError(''), 2000);
      return;
    }
    const treatmentIsProduct = isProductTreatment(treatment);
    if (!treatmentIsProduct && (!dueDate || !qty || qty < 1)) {
      setAddError('Semua field wajib diisi dengan benar!');
      setTimeout(() => setAddError(''), 2000);
      return;
    }
    // Validasi custom price jika diaktifkan
    if (useCustomPrice) {
      // Cek apakah custom_price diisi
      if (custom_price === '' || custom_price === null || custom_price === undefined) {
        setAddError('Harga custom harus diisi!');
        setTimeout(() => setAddError(''), 2000);
        return;
      }
      
      const priceValue = Number(custom_price);
      
      // Tolak negative number
      if (priceValue < 0) {
        setAddError('Harga tidak boleh negatif!');
        setTimeout(() => setAddError(''), 2000);
        return;
      }
      
      // Alasan custom price WAJIB diisi (tidak peduli harganya berapa)
      if (!custom_price_reason?.trim()) {
        setAddError('Alasan custom price wajib diisi!');
        setTimeout(() => setAddError(''), 3000);
        return;
      }
    }
    
    // Validasi discount - tidak wajib, bisa null (tanpa diskon)
    // if (!discount) {
    //   setAddError('Pilih diskon terlebih dahulu!');
    //   setTimeout(() => setAddError(''), 2000);
    //   return;
    // }
    
    const normalizedDueDate = treatmentIsProduct
      ? dayjs().format('YYYY-MM-DD')
      : (dueDate || dayjs().add(2, 'day').format('YYYY-MM-DD'));
    const normalizedCustomPrice = useCustomPrice ? Number(custom_price) : null;
    const normalizedReason = useCustomPrice ? custom_price_reason : null;
    const parsedPrice = Number(treatment.price);
    const baseCandidate = {
      treatment: { ...treatment, price: parsedPrice },
      id: treatment.id,
      name: treatment.name,
      price: parsedPrice,
      dueDate: normalizedDueDate,
      discount,
      qty,
      custom_price: normalizedCustomPrice,
      custom_price_reason: normalizedReason,
      requires_tracking: !treatmentIsProduct,
      // Penyajian & catatan per item (bukan per order).
      // Item non-produk (tiket/paket) tidak menyimpan serve_mode.
      serve_mode: isServeableTreatment(treatment)
        ? (addModal.serve_mode || defaultServeMode)
        : null,
      note: (addModal.note || '').trim(),
      options: addModal.options || {},
      items: items || [] // Include items array (opsional, bisa kosong)
    };

    // Check if this is edit mode
    if (editIndex !== undefined) {
      const existing = selectedTreatments[editIndex];
      const candidate = {
        ...existing,
        ...baseCandidate
      };

      if (isDuplicate(candidate, editIndex)) {
        setAddError('Kombinasi item, diskon, dan harga custom sama sudah ada di keranjang.');
        setTimeout(() => setAddError(''), 1500);
        return;
      }

      const newArr = selectedTreatments.map((tt, i) => (i === editIndex ? candidate : tt));
      setSelectedTreatments(newArr);
    } else {
      if (isDuplicate(baseCandidate)) {
        setAddError('Kombinasi item, diskon, dan harga custom sama sudah ada di keranjang.');
        setTimeout(() => setAddError(''), 1500);
        return;
      }

      setSelectedTreatments([
        ...selectedTreatments,
        baseCandidate
      ]);
    }
    
    setAddModal(null);
    setSearch('');
    // Di layout split, kotak pencarian dipakai panel picker → jangan direset.
    if (!isSplitLayout) setTreatmentSearch('');
    setAddError('');
    setUseCustomPrice(false); // Reset custom price toggle
    setFillItemDetails(false); // Reset fill item details toggle
    if (isSplitLayout) setToastMessage(`${treatment.name} ditambahkan ke keranjang`);
  };

  // Remove from keranjang
  const removeTreatment = (id, discountId) => {
    setSelectedTreatments(selectedTreatments.filter(t => !(t.id === id && t.discount?.id === discountId)));
  };

  // Handler edit (qty, dueDate, discount)
  const handleEdit = (idx, field, value) => {
    const t = selectedTreatments[idx];
    let newT = { ...t, [field]: value };
    // For discount, check duplicate
    if (field === 'discount') {
      if (isDuplicate(newT, idx)) {
        setEditError({ [t.id + '-' + idx]: 'Kombinasi item, diskon, dan harga custom sama sudah ada di keranjang.' });
        setTimeout(() => {
          setEditError({});
        }, 1200);
        return;
      }
    }
    setEditError({});
    // Selalu update ke parent agar parent update state dan trigger re-render
    const newArr = selectedTreatments.map((tt, i) => i === idx ? newT : tt);
    setSelectedTreatments(newArr);
  };

  // Helper: hitung harga final per item (setelah diskon)
  function getFinalPrice(selected) {
    // 1. Harga dasar atau custom price
    const base = Number(
      (selected.treatment && selected.treatment.price != null)
        ? selected.treatment.price
        : (selected.price != null ? selected.price : 0)
    );
    const effectivePrice = selected.custom_price != null ? Number(selected.custom_price) : base; // ✅ Custom price priority (termasuk 0)
    
    // 2. Diskon
    const discount = selected.discount && typeof selected.discount === 'object' ? selected.discount : null;
    let finalPrice = effectivePrice;
    if (discount && discount.type) {
      // Ambil nilai diskon dari field 'discount' (atau fallback ke 'value' jika tidak ada)
      const discVal = (discount.discount != null) ? Number(discount.discount) : Number(discount.discount) || 0;
      if (discount.type === 'percent') {
        finalPrice = finalPrice - (finalPrice * (discVal / 100));
      } else if (discount.type === 'nominal') {
        finalPrice = finalPrice - discVal;
      }
    }
    // Jika discount null, harga tetap sama dengan effective price
    const result = Math.max(0, Math.round(finalPrice));
    return isNaN(result) ? 0 : result;
  }
  // Helper: total harga (final x qty)
  function getTotal(selected) {
    return getFinalPrice(selected) * (selected.qty || 1);
  }

  // Panel kiri (layout split): tab kategori + pencarian + grid produk/paket
  const pickerSection = (
    <div className="flex min-w-0 flex-col rounded-2xl border border-telaga-100 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-telaga-100 px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-telaga-100 bg-telaga-50">
          <Ticket size={17} className="text-telaga-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-montserrat text-sm font-bold leading-tight text-telaga-900">
            Pilih Produk &amp; Paket
          </h3>
          <p className="truncate font-montserrat text-[11px] text-telaga-900/50">
            {`${pickerTreatments.length} item tersedia`}
          </p>
        </div>
        {outletLabel && (
          <span
            title="Katalog mengikuti outlet cabang aktif"
            className="shrink-0 rounded-full border border-telaga-100 bg-telaga-50 px-2.5 py-1 font-montserrat text-[10px] font-bold uppercase tracking-wide text-telaga-700"
          >
            {outletLabel}
          </span>
        )}
      </div>

      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-telaga-900/40" />
          <input
            type="text"
            placeholder="Cari produk atau paket..."
            value={treatmentSearch}
            onChange={(e) => setTreatmentSearch(e.target.value)}
            className="w-full rounded-lg border border-telaga-100 py-2 pl-10 pr-4 font-montserrat text-sm focus:border-transparent focus:ring-2 focus:ring-telaga-400"
          />
        </div>
      </div>

      {categoryChips.length > 0 && (
        <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 py-3">
          <button
            type="button"
            onClick={() => setActiveCategory('')}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 font-montserrat text-[11px] font-bold transition-colors ${
              activeCategory === ''
                ? 'border-telaga-500 bg-telaga-500 text-white'
                : 'border-telaga-100 bg-white text-telaga-900/60 hover:bg-telaga-50'
            }`}
          >
            Semua
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
              activeCategory === '' ? 'bg-white/25 text-white' : 'bg-telaga-50 text-telaga-600'
            }`}>
              {treatments.length}
            </span>
          </button>
          {categoryChips.map((chip) => {
            const active = activeCategory === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setActiveCategory(active ? '' : chip.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 font-montserrat text-[11px] font-bold transition-colors ${
                  active
                    ? 'border-telaga-500 bg-telaga-500 text-white'
                    : 'border-telaga-100 bg-white text-telaga-900/60 hover:bg-telaga-50'
                }`}
              >
                {chip.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  active ? 'bg-white/25 text-white' : 'bg-telaga-50 text-telaga-600'
                }`}>
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="max-h-[26rem] min-h-[14rem] overflow-y-auto px-4 pb-4 sm:max-h-[30rem] lg:max-h-[calc(100vh-17rem)] lg:min-h-[24rem]">
        {pickerTreatments.length === 0 ? (
          <div className="py-10 text-center font-montserrat text-sm text-telaga-900/40">
            {treatmentSearch.trim() || activeCategory
              ? 'Produk/paket tidak ditemukan'
              : 'Tidak ada produk/paket tersedia'}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-2.5 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {pickerTreatments.map((treatment) => {
              const inCartQty = cartQtyByTreatmentId.get(treatment.id) || 0;
              return (
                <button
                  key={treatment.id}
                  type="button"
                  onClick={() => handlePickTreatment(treatment)}
                  className="group relative flex min-h-[4.75rem] flex-col items-start justify-between rounded-xl border border-telaga-100 bg-white p-2.5 text-left transition-colors hover:border-telaga-400 hover:bg-telaga-50/60 active:scale-[0.98] sm:min-h-[5.25rem] sm:p-3 lg:min-h-[5.5rem]"
                >
                  {inCartQty > 0 && (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-telaga-500 px-1.5 py-0.5 font-montserrat text-[10px] font-bold text-white sm:right-2 sm:top-2">
                      {inCartQty}×
                    </span>
                  )}
                  <span className="line-clamp-2 pr-5 font-montserrat text-[12.5px] font-semibold leading-snug text-telaga-950 sm:text-[13px] lg:text-sm">
                    {treatment.name}
                  </span>
                  <span className="mt-1 flex w-full items-baseline justify-between gap-1">
                    <span className="font-montserrat text-[13px] font-bold text-telaga-600 sm:text-sm">
                      Rp {formatPrice(treatment.price)}
                    </span>
                    <span className="font-montserrat text-[9.5px] font-semibold uppercase tracking-wide text-telaga-900/35 sm:text-[10px]">
                      {isProductTreatment(treatment) ? 'Produk' : 'Paket'}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const cartSection = (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      {/* <div className="sticky top-0 bg-white z-10 pb-3 border-b border-telaga-100">
        <h3 className="font-medium mb-2 font-montserrat tracking-wide">Produk &amp; Paket</h3>
        <p className="text-xs text-telaga-900/60 font-montserrat">Pilih produk atau paket yang akan ditambahkan ke keranjang</p>
      </div> */}

      {/* Keranjang Section - Scrollable */}
      <div className="flex-1 overflow-y-auto pt-3">
        {/* Header: judul + jumlah item + tombol Tambah */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-telaga-50 border border-telaga-100 flex items-center justify-center">
              <Ticket size={17} className="text-telaga-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-telaga-900 font-montserrat leading-tight">
                Produk &amp; Paket
              </h3>
              <p className="text-[11px] text-telaga-900/50 font-montserrat truncate">
                {selectedTreatments.length > 0
                  ? `${selectedTreatments.length} item dipilih`
                  : 'Belum ada produk atau paket dipilih'}
              </p>
            </div>
          </div>
          {/* Tombol Tambah hanya dipakai layout bertumpuk; di layout split
              pemilihan item langsung dari grid di kolom kiri. */}
          {!isSplitLayout && (
          <button
            onClick={() => {
              if (!customerId) {
                alert('Pilih pelanggan terlebih dahulu sebelum menambah produk atau paket');
                return;
              }
              setAddModal(augmentModalData({
                treatment: null,
                discount: null,
                qty: 1,
                dueDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
                custom_price: null,
                serve_mode: defaultServeMode,
                note: '',
                options: {},
                items: []
              }));
              setShowTreatmentModal(true);
              setTreatmentSearch('');
              setUseCustomPrice(false);
              setFillItemDetails(false);
            }}
            disabled={!customerId}
            className={`flex items-center gap-1.5 shrink-0 px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-200 font-montserrat ${
              customerId
                ? 'bg-gradient-to-r from-telaga-600 to-telaga-500 text-white shadow-md shadow-telaga-600/20 hover:from-telaga-700 hover:to-telaga-600 hover:shadow-lg active:scale-95 cursor-pointer'
                : 'bg-telaga-100 text-telaga-900/40 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            Tambah
          </button>
          )}
        </div>

        {selectedTreatments.length === 0 && (
          <div className="rounded-2xl border border-dashed border-telaga-200 bg-telaga-50/40 px-4 py-8 text-center font-montserrat">
            <div className="w-11 h-11 mx-auto mb-2.5 rounded-full bg-white border border-telaga-100 flex items-center justify-center">
              <Ticket size={19} className="text-telaga-400" />
            </div>
            <p className="text-xs font-semibold text-telaga-900/70 mb-0.5">Belum ada produk atau paket dipilih</p>
            <p className="text-[11px] text-telaga-900/45">
              {isSplitLayout
                ? 'Klik produk di panel sebelah untuk menambahkannya'
                : (
                  <>
                    Klik <span className="font-semibold text-telaga-600">Tambah</span> untuk memilih produk &amp; paket
                  </>
                )}
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          {selectedTreatments.map((selected, idx) => (
            <div
              key={selected.id + '-' + (selected.discount?.id || '')}
              className="relative transition-all duration-300 border border-telaga-100 rounded-2xl shadow-sm hover:shadow-md bg-white animate-fade-in px-4 py-3 overflow-hidden"
            >
              {/* Tombol hapus dan edit kanan atas */}
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                    onClick={() => {
                      setAddModal(augmentModalData({
                        treatment: selected.treatment,
                        discount: selected.requires_tracking === false ? null : (selected.discount || null),
                        qty: selected.qty || 1,
                        dueDate: selected.requires_tracking === false ? dayjs().format('YYYY-MM-DD') : (selected.dueDate || dayjs().add(2, 'day').format('YYYY-MM-DD')),
                        custom_price: selected.custom_price != null ? selected.custom_price : null, // ✅ Include custom_price (termasuk 0)
                        custom_price_reason: selected.custom_price_reason || '', // ✅ Include custom_price_reason
                        serve_mode: selected.serve_mode || defaultServeMode,
                        note: selected.note || '',
                        options: selected.options || {},
                        items: selected.items || [], // Include items jika ada
                        editIndex: idx // Flag untuk edit mode
                      }));
                      setUseCustomPrice(selected.custom_price != null); // ✅ Set toggle based on existing value (termasuk 0)
                      setFillItemDetails(selected.items && selected.items.length > 0 && selected.items.some(i => i.item || i.notes || i.photos?.length > 0)); // Set toggle jika ada item data
                    }}
                  className="p-1 bg-telaga-50 text-telaga-500 border border-telaga-200 hover:bg-telaga-100 hover:border-telaga-300 rounded-full transition-all duration-200 shadow-sm flex items-center justify-center"
                  title={selected.requires_tracking === false ? 'Edit produk' : 'Edit paket'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => removeTreatment(selected.id, selected.discount?.id)}
                  className="p-1 bg-red-50 text-red-500 hover:bg-red-100 shadow-sm border border-red-200 rounded-full transition-all duration-200"
                  title="Hapus item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              {/* Header: nama */}
              <div className="mb-2 pr-16">
                <span className="font-montserrat font-bold text-telaga-950 text-base tracking-tight">{selected.name}</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="font-bold text-base text-telaga-600">Rp {formatPrice(getFinalPrice(selected))}</span>
                  {selected.requires_tracking === false && (
                    <span className="text-[10px] text-telaga-700 font-semibold bg-telaga-100 px-2.5 py-1 rounded-full border border-telaga-200">Produk</span>
                  )}
                  {selected.custom_price != null && (
                    <span className="text-[10px] text-senja-700 font-semibold bg-senja-100 px-2.5 py-1 rounded-full border border-senja-200">Custom</span>
                  )}
                </div>
              </div>
              
              {/* Penyajian per item: satu order boleh campur dine-in & bawa pulang */}
              {isCafeMode && (
                <div className="mb-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {SERVE_MODE_OPTIONS.map((option) => {
                      const active = (selected.serve_mode || defaultServeMode) === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleEdit(idx, 'serve_mode', option.value)}
                          className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold font-montserrat transition-colors ${
                            active
                              ? 'border-telaga-500 bg-telaga-50 text-telaga-700'
                              : 'border-telaga-100 bg-white text-telaga-900/55 hover:bg-telaga-50/60'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Catatan & opsi per item */}
              {(selected.note || Object.keys(selected.options || {}).length > 0) && (
                <div className="mb-2 rounded-lg border border-senja-100 bg-senja-50 px-3 py-2 font-montserrat">
                  {selected.note && (
                    <p className="text-[11px] text-telaga-900/70 leading-relaxed">
                      <span className="font-semibold">Catatan:</span> {selected.note}
                    </p>
                  )}
                  {Object.keys(selected.options || {}).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Object.entries(selected.options).map(([key, value]) => (
                        <span key={key} className="rounded-full border border-senja-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-senja-700">
                          {value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Custom Price Info */}
              {selected.custom_price != null && (
                <div className="mt-2 mb-2 text-xs text-telaga-900/70 font-montserrat leading-relaxed bg-senja-50 border border-senja-100 rounded-lg px-3 py-2">
                  <div className="font-semibold text-senja-700">
                    Harga Custom: Rp {formatPrice(selected.custom_price)}
                  </div>
                  {selected.custom_price_reason && (
                    <div className="text-[11px] text-telaga-900/60 mt-1 italic">
                      Alasan: {selected.custom_price_reason}
                    </div>
                  )}
                </div>
              )}
              
              {/* Info: qty, due date, diskon */}
              <div className="bg-gradient-to-br from-telaga-50 to-telaga-50 border border-telaga-100/60 rounded-lg p-2 mt-2 shadow-sm">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-telaga-900/70 font-montserrat uppercase tracking-wide">Jumlah Item</span>
                    <span className="text-sm font-bold text-telaga-950 font-montserrat">{selected.qty || 1} item</span>
                  </div>
                  <div className="h-px bg-telaga-100"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-telaga-900/70 font-montserrat uppercase tracking-wide">Diskon</span>
                    <span className="text-sm font-bold text-telaga-950 font-montserrat">{selected.discount ? selected.discount.name : 'Tanpa Diskon'}</span>
                  </div>
                </div>
              </div>
              
              {/* Error */}
              {editError[selected.id + '-' + idx] && (
                <div className="flex items-center gap-2 text-xs text-red-500 mt-2"><AlertCircle className="w-4 h-4" />{editError[selected.id + '-' + idx]}</div>
              )}
              
              {/* Harga total per layanan */}
              <div className="flex justify-end items-center pt-2 mt-2 border-t-2 border-telaga-100">
                <span className="text-xs text-telaga-900/70 mr-3 font-montserrat font-semibold uppercase tracking-wide">Total</span>
                <span className="font-bold text-lg text-telaga-600 font-montserrat">Rp {formatPrice(getTotal(selected))}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Modal qty/detail dipakai di semua layout → dirender di luar panel keranjang
  // supaya tetap muncul walau panel keranjang disembunyikan di mobile.
  const modalsSection = (
    <>
      {/* Modal pilih detail sebelum add ke keranjang */}
      {addModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[80] p-6 sm:p-8" style={{
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(2rem, env(safe-area-inset-left))',
          paddingRight: 'max(2rem, env(safe-area-inset-right))'
        }}>
          <div className="bg-white rounded-2xl shadow-xl min-w-[90vw] max-w-[400px] w-full flex flex-col max-h-[85vh] animate-fade-in">
            {/* Header - Fixed */}
            <div className="p-6 pb-4 border-b-2 border-telaga-100 flex-shrink-0 rounded-t-2xl">
              <h4 className="font-semibold mb-2 font-montserrat tracking-wide">
                {addModal.editIndex !== undefined
                  ? (addModal.requires_tracking === false ? 'Edit Produk' : 'Edit Paket')
                  : 'Tambah Produk / Paket'}
              </h4>
              {addModal.treatment && (
                <div className="font-montserrat font-medium text-telaga-800">{addModal.treatment.name}</div>
              )}
            </div>
            
            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 pt-4" style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}>
              <div className="space-y-3">
                {/* Treatment Selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-telaga-900/60 font-medium font-montserrat">
                    {addModal.requires_tracking === false ? 'Produk *' : 'Paket *'}
                  </label>
                  
                  {addModal.treatment ? (
                    <div className="border border-telaga-100 rounded-lg p-3 bg-telaga-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-telaga-950 font-montserrat">{addModal.treatment.name}</div>
                          <div className="text-xs text-telaga-900/60 font-montserrat">Rp {formatPrice(addModal.treatment.price)}</div>
                        </div>
                        <button
                        onClick={() => {
                          setAddModal(augmentModalData({
                            ...addModal,
                            treatment: null,
                            discount: null, // Reset diskon juga saat ganti treatment
                            custom_price: null, // ✅ Reset custom_price saat ganti treatment
                            items: [] // Reset items saat ganti treatment
                          }));
                          setShowTreatmentModal(true);
                          setTreatmentSearch('');
                          setUseCustomPrice(false); // ✅ Reset custom price toggle
                          setFillItemDetails(false); // Reset fill item details toggle
                        }}
                          className="px-3 py-1 text-xs bg-telaga-100 text-telaga-600 rounded-lg hover:bg-telaga-200 transition-colors font-montserrat"
                        >
                          Ganti
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddModal(augmentModalData({
                          treatment: null,
                          discount: null,
                          qty: 1,
                          dueDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
                          custom_price: null,
                          serve_mode: addModal.serve_mode || defaultServeMode,
                          note: addModal.note || '',
                          options: addModal.options || {},
                        }));
                        setShowTreatmentModal(true);
                        setTreatmentSearch('');
                        setUseCustomPrice(false); // ✅ Reset custom price toggle
                      }}
                      className="w-full p-3 border-2 border-dashed border-telaga-200 rounded-lg text-telaga-900/60 hover:border-telaga-400 hover:text-telaga-600 transition-colors font-montserrat text-sm"
                    >
                      + Pilih Produk / Paket
                    </button>
                  )}
                </div>
                
                {/* Checklist Harga Custom disembunyikan (tidak dipakai di Telaga).
                    Data custom_price lama tetap dibaca (read-only) di kartu keranjang. */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-telaga-900/60 font-medium font-montserrat">Diskon</label>
                  <div className="flex gap-2">
                    <select
                      value={addModal.discount?.id ?? ''}
                      onChange={e => {
                        if (e.target.value === '') {
                          setAddModal(m => ({ ...m, discount: null }));
                        } else {
                          const d = (Array.isArray(discounts) && discounts.length > 0) ? discounts.find(d => d.id === Number(e.target.value)) : null;
                          setAddModal(m => ({ ...m, discount: d }));
                        }
                      }}
                      className="flex-1 w-full font-montserrat px-3 py-2 h-10 border border-telaga-100 rounded-lg bg-white text-xs focus:ring-2 focus:ring-telaga-400 focus:border-transparent"
                      style={{ WebkitAppearance: 'none', backgroundColor: 'white' }}
                    >
                      <option value="">Tanpa Diskon</option>
                      {discounts.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    {addModal.discount && (
                      <button
                        onClick={() => setAddModal(m => ({ ...m, discount: null }))}
                        className="px-3 py-2 h-10 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-xs font-montserrat font-medium"
                        title="Hapus diskon"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                  {addModal.discount && (
                    <div className="text-xs text-telaga-600 bg-telaga-50 px-2 py-1 rounded font-montserrat">
                      Diskon: {addModal.discount.name} ({addModal.discount.type === 'percent' ? `${addModal.discount.discount}%` : `Rp ${formatPrice(addModal.discount.discount)}`})
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-telaga-900/60 font-medium font-montserrat">Jumlah Item</label>
                  <QuantityInput
                    value={addModal.qty ?? 1}
                    onChange={(value) => {
                      const newQty = Math.max(1, Number(value) || 1);
                      // Sync items array dengan qty baru
                      const updatedItems = generateItemsArray(newQty, addModal.items);
                      setAddModal(m => ({ ...m, qty: newQty, items: updatedItems }));
                    }}
                    showLabel={false}
                    size="small"
                    min={1}
                  />
                </div>
                
                {/* Penyajian & catatan per item — satu order boleh campur.
                    Tiket/paket wisata tidak punya penyajian, jadi opsi ini disembunyikan. */}
                {isCafeMode && isServeableTreatment(addModal.treatment) && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-telaga-900/60 font-medium font-montserrat">Penyajian</label>
                    <div className="grid grid-cols-2 gap-2">
                      {SERVE_MODE_OPTIONS.map((option) => {
                        const active = (addModal.serve_mode || defaultServeMode) === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setAddModal(m => ({ ...m, serve_mode: option.value }))}
                            className={`rounded-lg border px-3 py-2 text-xs font-bold font-montserrat transition-colors ${
                              active
                                ? 'border-telaga-500 bg-telaga-50 text-telaga-700'
                                : 'border-telaga-100 bg-white text-telaga-900/55 hover:bg-telaga-50/60'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-telaga-900/60 font-medium font-montserrat">Catatan (opsional)</label>
                  <input
                    type="text"
                    value={addModal.note || ''}
                    onChange={(e) => setAddModal(m => ({ ...m, note: e.target.value }))}
                    placeholder="mis. es dipisah, tanpa saus"
                    className="w-full font-montserrat px-3 py-2 border border-telaga-100 rounded-lg bg-white text-xs focus:ring-2 focus:ring-telaga-400 focus:border-transparent"
                  />
                  {isDrinkTreatment(addModal.treatment) && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {DRINK_OPTION_CHIPS.map((chip) => {
                        const active = (addModal.options || {})[chip.key] === chip.value;
                        return (
                          <button
                            key={`${chip.key}-${chip.value}`}
                            type="button"
                            onClick={() => toggleModalOption(chip)}
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold font-montserrat transition-colors ${
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
                  )}
                </div>

                {/* Perhitungan Final Harga */}
                {addModal.treatment && (() => {
                  const basePrice = addModal.treatment.price ? Number(addModal.treatment.price) : 0;
                  const effectivePrice = addModal.custom_price != null 
                    ? Number(addModal.custom_price) 
                    : basePrice;
                  
                  let discountAmount = 0;
                  if (addModal.discount) {
                    const discVal = addModal.discount.discount != null 
                      ? Number(addModal.discount.discount) 
                      : Number(addModal.discount.value) || 0;
                    
                    if (addModal.discount.type === 'percent') {
                      discountAmount = effectivePrice * (discVal / 100);
                    } else if (addModal.discount.type === 'nominal') {
                      discountAmount = discVal;
                    }
                  }
                  
                  const finalPricePerItem = Math.max(0, Math.round(effectivePrice - discountAmount));
                  const totalPrice = finalPricePerItem * (addModal.qty || 1);
                  
                  return (
                    <div className="bg-telaga-50 border-2 border-telaga-200 rounded-xl p-3 mt-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-telaga-900 font-montserrat">Harga per item:</span>
                        <span className="text-sm font-bold text-telaga-700 font-montserrat">Rp {formatPrice(finalPricePerItem)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-telaga-200">
                        <span className="text-xs font-semibold text-telaga-900 font-montserrat">Total ({addModal.qty || 1} item):</span>
                        <span className="text-base font-bold text-telaga-800 font-montserrat">Rp {formatPrice(totalPrice)}</span>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Tanggal selesai disembunyikan — tiket/paket Telaga dipakai di hari yang sama.
                    `dueDate` tetap dikirim (default hari ini) dari state modal. */}

                {/* Detail Item Card */}
                {addModal.treatment && addModal.qty >= 1 && (
                  <QuickOrderItemCard
                    items={addModal.items || []}
                    qty={addModal.qty || 1}
                    onItemsChange={(updatedItems) => {
                      setAddModal(m => ({ ...m, items: updatedItems }));
                    }}
                    fillItemDetails={fillItemDetails}
                    onToggleFillDetails={(checked) => {
                      setFillItemDetails(checked);
                      // Jika toggle aktif, pastikan items array sesuai qty
                      if (checked && (!addModal.items || addModal.items.length !== (addModal.qty || 1))) {
                        const newItems = generateItemsArray(addModal.qty || 1, addModal.items);
                        setAddModal(m => ({ ...m, items: newItems }));
                      }
                    }}
                    maxPhotos={3} // Default untuk Quick Order
                    customerId={customerId}
                  />
                )}

                {addError && <div className="flex items-center gap-2 text-xs text-red-500 mt-2"><AlertCircle className="w-4 h-4" />{addError}</div>}
              </div>
            </div>
            
            {/* Footer - Fixed */}
            <div className="p-6 pt-4 border-t-2 border-telaga-100 flex-shrink-0 rounded-b-2xl bg-white">
              <div className="flex gap-2">
                <AnimatedButton
                  variant="blue"
                  onClick={handleAddToCart}
                  className="flex-1 py-2"
                >
                  {addModal.editIndex !== undefined
                    ? (addModal.requires_tracking === false ? 'Simpan Produk' : 'Simpan Paket')
                    : 'Tambah Produk / Paket'}
                </AnimatedButton>
                <AnimatedButton
                  variant="grey"
                  onClick={() => {
                    setAddModal(null);
                    setTreatmentSearch(''); // Reset search saat batal
                    setUseCustomPrice(false); // ✅ Reset custom price toggle
                    setFillItemDetails(false); // Reset fill item details toggle
                  }}
                  className="flex-1 py-2"
                >
                  Batal
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pilih Treatment */}
      {showTreatmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[80] p-6 sm:p-8" style={{
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(2rem, env(safe-area-inset-left))',
          paddingRight: 'max(2rem, env(safe-area-inset-right))'
        }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[85vh] animate-fade-in">
            {/* Header */}
            <div className="p-6 pb-4 border-b-2 border-telaga-100 flex-shrink-0 rounded-t-2xl">
              <h4 className="font-semibold mb-2 font-montserrat tracking-wide">Pilih Produk / Paket</h4>
              <p className="text-xs text-telaga-900/60 font-montserrat">Cari dan pilih produk atau paket yang akan ditambahkan</p>
            </div>
            
            {/* Search + Treatment List - Scrollable */}
            <div className="flex-1 overflow-y-auto" style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}>
              {/* Search */}
              <div className="p-6 pt-4 pb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-telaga-900/40 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Cari produk atau paket..."
                    value={treatmentSearch}
                    onChange={e => setTreatmentSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-telaga-100 rounded-lg focus:ring-2 focus:ring-telaga-400 focus:border-transparent text-sm font-montserrat"
                  />
                </div>
              </div>
              
              {/* Treatment List */}
              <div className="px-6 pb-4">
              <div className="space-y-2">
                {filteredTreatments.length > 0 ? (
                  filteredTreatments.map(treatment => {
                    const treatmentIsProduct = isProductTreatment(treatment);
                    return (
                      <div
                        key={treatment.id}
                        onClick={() => {
                          setAddModal(m => augmentModalData({ 
                            ...m, 
                            treatment: treatment,
                            discount: null,
                            items: [] // Reset items saat pilih treatment baru
                          }));
                          setShowTreatmentModal(false);
                          setTreatmentSearch('');
                          setUseCustomPrice(false);
                          setFillItemDetails(false); // Reset fill item details toggle
                        }}
                        className="flex items-center justify-between p-3 border border-telaga-100 rounded-lg cursor-pointer hover:border-telaga-400 hover:bg-telaga-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm text-telaga-950 font-montserrat flex items-center gap-2">
                            <span>{treatment.name}</span>
                            {treatmentIsProduct && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-telaga-100 text-telaga-700">Produk</span>
                            )}
                          </div>
                          <div className="text-xs text-telaga-900/60 font-montserrat font-medium">Rp {formatPrice(treatment.price)}</div>
                        </div>
                        <button className="p-1 rounded-full bg-telaga-100 text-telaga-600">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center font-montserrat text-telaga-900/40 text-sm py-8">
                    {treatmentSearch ? 'Produk/paket tidak ditemukan' : 'Tidak ada produk/paket tersedia'}
                  </div>
                )}
              </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-6 pt-4 border-t-2 border-telaga-100 flex-shrink-0 rounded-b-2xl bg-white">
              <AnimatedButton
                variant="grey"
                onClick={() => {
                  setShowTreatmentModal(false);
                  setTreatmentSearch('');
                }}
                className="w-full py-2"
              >
                Batal
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (isSplitLayout) {
    const itemCount = selectedTreatments.length;
    const subtotal = selectedTreatments.reduce((sum, item) => sum + getTotal(item), 0);
    const canProceed = canContinue && itemCount > 0 && Boolean(customerId);

    const handleMobileContinue = () => {
      setShowMobileCart(false);
      if (onContinue) onContinue();
    };

    return (
      <>
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,0.85fr)] xl:gap-5">
          {pickerSection}
          {/* Kolom kanan hanya untuk desktop; di mobile dipindah ke sheet keranjang. */}
          <div className="hidden min-w-0 flex-col gap-4 lg:flex">
            {customerSlot}
            {cartSection}
          </div>
        </div>

        {/* Bar keranjang — mobile only, selalu tampil di step input */}
        <button
          type="button"
          onClick={() => setShowMobileCart(true)}
          className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 lg:hidden"
          aria-label="Buka keranjang"
        >
          <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-2xl border border-telaga-100 bg-white px-4 py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.18)]">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-telaga-100 bg-telaga-50">
                <ShoppingCart size={17} className="text-telaga-600" />
                {itemCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 min-w-[18px] rounded-full bg-senja-500 px-1 text-center font-montserrat text-[10px] font-bold leading-[18px] text-white">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="font-montserrat text-sm font-bold text-telaga-900">Keranjang</span>
            </div>
            <ChevronUp size={18} className="text-telaga-500" />
          </div>
        </button>

        {/* Sheet keranjang + data pelanggan */}
        {showMobileCart && (
          <div className="fixed inset-0 z-[60]">
            <div
              className="absolute inset-0 bg-telaga-950/50 backdrop-blur-sm"
              onClick={() => setShowMobileCart(false)}
            />
            <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-3xl bg-white shadow-2xl animate-slide-up">
              <div className="shrink-0 border-b border-telaga-100 px-4 pb-3 pt-2">
                <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-telaga-100" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-montserrat text-sm font-bold text-telaga-900">Keranjang</h3>
                    <span className="rounded-full border border-telaga-100 bg-telaga-50 px-2 py-0.5 font-montserrat text-[11px] font-bold text-telaga-700">
                      {itemCount} item
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMobileCart(false)}
                    className="rounded-lg p-1.5 text-telaga-900/50 transition-colors hover:bg-telaga-50"
                    aria-label="Tutup keranjang"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3">
                {customerSlot}
                {cartSection}
              </div>

              <div
                className="shrink-0 border-t border-telaga-100 bg-white px-4 pt-3"
                style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-montserrat text-xs font-semibold uppercase tracking-wide text-telaga-900/60">
                    Total
                  </span>
                  <span className="font-montserrat text-base font-bold text-telaga-600">
                    Rp {formatPrice(subtotal)}
                  </span>
                </div>
                {!customerId && (
                  <p className="mb-2 font-montserrat text-[11px] font-semibold text-senja-600">
                    Pilih pelanggan di atas untuk melanjutkan pembayaran.
                  </p>
                )}
                <AnimatedButton
                  variant="blue"
                  onClick={handleMobileContinue}
                  disabled={!canProceed}
                  className="w-full py-3"
                >
                  {continueLabel}
                </AnimatedButton>
              </div>
            </div>
          </div>
        )}

        {modalsSection}

        {/* Toast singkat setelah item masuk keranjang */}
        {toastMessage && (
          <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex justify-center px-4">
            <div className="flex items-center gap-2 rounded-xl bg-telaga-900/95 px-3.5 py-2 font-montserrat text-xs font-semibold text-white shadow-lg">
              <CheckCircle size={15} className="text-telaga-300" />
              {toastMessage}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {cartSection}
      {modalsSection}
    </>
  );
};

export default QuickOrderTreatmentSelect; 