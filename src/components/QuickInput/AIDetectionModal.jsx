import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Camera, Image as ImageIcon, Sparkles, Check, Plus, Search, AlertCircle
} from 'lucide-react';
import { getUserProfile } from '../../utils/userProfileHelper';
import AiDetectionService from '../../services/aiDetectionService';
import { uploadMultiplePhotos } from '../../utils/uploadHelper';
import instance, { API_URL } from '../../config/api';
import { formatCurrency } from '../../utils/labelFormatter';

const MAX_PHOTOS = 20;
const MAX_PHOTOS_PER_ITEM = 10;

/**
 * AIDetectionModal — AI Batch Detection untuk Quick Order
 *
 * Step flow: photos → detecting → results
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   onResult: (groupedTreatments) => void
 *   treatments: Array<{id, name, price}>
 *   customerId: number | null (optional)
 */
const AIDetectionModal = ({ open, onClose, onResult, treatments = [], customerId = null }) => {
  // Step: 'photos' | 'detecting' | 'results'
  const [step, setStep] = useState('photos');
  const [localPhotos, setLocalPhotos] = useState([]);       // File[] for upload
  const [photoPreviews, setPhotoPreviews] = useState([]);   // preview URLs
  const [uploadedUrls, setUploadedUrls] = useState([]);
  const [userPrompt, setUserPrompt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [aiResults, setAiResults] = useState([]);
  const [selectedTreatmentsForItem, setSelectedTreatmentsForItem] = useState({});
  const [showTreatmentPicker, setShowTreatmentPicker] = useState(null);
  const [treatmentSearch, setTreatmentSearch] = useState('');
  const [editableConditions, setEditableConditions] = useState({});
  const [editableItemFields, setEditableItemFields] = useState({});
  const [editableItemPhotos, setEditableItemPhotos] = useState({});
  const [error, setError] = useState('');
  const [creditBalance, setCreditBalance] = useState(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditPackages, setCreditPackages] = useState([]);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('photos');
      setLocalPhotos([]);
      setPhotoPreviews([]);
      setUploadedUrls([]);
      setUserPrompt('');
      setAiResults([]);
      setSelectedTreatmentsForItem({});
      setShowTreatmentPicker(null);
      setTreatmentSearch('');
      setUploading(false);
      setDetecting(false);
      setConfirming(false);
      setEditableConditions({});
      setEditableItemFields({});
      setEditableItemPhotos({});
      setError('');
      setCreditBalance(null);
      setShowCreditModal(false);
      setCreditPackages([]);

      // Fetch AI credit balance
      (async () => {
        try {
          const profile = await getUserProfile();
          if (profile?.tenant?.ai_credit_balance !== undefined) {
            setCreditBalance(profile.tenant.ai_credit_balance);
          }
        } catch (e) {
          console.error('❌ Failed to fetch credit balance:', e);
        }
      })();
    }
  }, [open]);

  // Reset treatment search when picker opens/closes
  useEffect(() => {
    setTreatmentSearch('');
  }, [showTreatmentPicker]);

  // --- Cleanup preview URLs on unmount ---
  useEffect(() => {
    return () => {
      photoPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);

  // --- Photo Selection ---
  const addPhotosFromFiles = useCallback((files) => {
    const fileArray = Array.from(files);
    const totalPhotos = localPhotos.length + fileArray.length;

    if (totalPhotos > MAX_PHOTOS) {
      setError(`Maksimal ${MAX_PHOTOS} foto`);
      return;
    }

    const newPreviews = fileArray.map(f => URL.createObjectURL(f));
    setLocalPhotos(prev => [...prev, ...fileArray]);
    setPhotoPreviews(prev => [...prev, ...newPreviews]);
    setError('');
  }, [localPhotos.length]);

  const handleCameraCapture = useCallback((e) => {
    if (e.target.files?.length) {
      addPhotosFromFiles(e.target.files);
    }
    e.target.value = '';
  }, [addPhotosFromFiles]);

  const handleGallerySelect = useCallback((e) => {
    if (e.target.files?.length) {
      addPhotosFromFiles(e.target.files);
    }
    e.target.value = '';
  }, [addPhotosFromFiles]);

  const removePhoto = useCallback((index) => {
    setLocalPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // --- Upload + AI Detection ---
  const handleDetect = useCallback(async () => {
    if (localPhotos.length === 0) {
      setError('Pilih minimal 1 foto');
      return;
    }
    if (!treatments || treatments.length === 0) {
      setError('Daftar treatment tidak tersedia');
      return;
    }

    setDetecting(true);
    setStep('detecting');
    setError('');

    try {
      // Upload photos
      setUploading(true);
      const urls = await uploadMultiplePhotos(localPhotos, (progress) => {
        setUploadProgress(progress);
      });

      if (!urls || urls.length === 0) {
        setStep('photos');
        setDetecting(false);
        setUploading(false);
        setError('Gagal upload foto');
        return;
      }

      setUploadedUrls(urls);
      setUploading(false);

      // Convert treatments
      const treatmentList = treatments.map(t => ({
        id: t.id,
        name: t.name,
        price: parseFloat(t.price) || 0,
      }));

      // Call AI detection
      const result = await AiDetectionService.detectItems(urls, treatmentList, userPrompt);

      if (result && result.items && result.items.length > 0) {
        setAiResults(result.items);
        setStep('results');

        // Initialize editable fields
        const initialConditions = {};
        const initialItemFields = {};
        const initialItemPhotos = {};

        result.items.forEach((item, idx) => {
          initialConditions[idx] = item.condition || '';
          initialItemFields[idx] = {
            name: item.item?.name || '',
            brand: item.item?.brand || '',
            color: item.item?.color || '',
            material: item.item?.material || '',
            type: item.item?.type || 'Shoes',
          };
          initialItemPhotos[idx] = item.photos ? [...item.photos] : [];
        });

        setEditableConditions(initialConditions);
        setEditableItemFields(initialItemFields);
        setEditableItemPhotos(initialItemPhotos);

        // Auto-select best treatment(s) — multi-treatment support
        const initialTreatments = {};
        result.items.forEach((item, idx) => {
          const selected = [];
          if (item.treatments && item.treatments.length > 0) {
            const sorted = [...item.treatments].sort((a, b) => b.confidence - a.confidence);
            const toSelect = sorted.filter(t => t.confidence >= 60);
            if (toSelect.length === 0 && sorted.length > 0) {
              toSelect.push(sorted[0]);
            }
            for (const rec of toSelect) {
              const fullTreatment = treatments.find(t => t.id === rec.id);
              if (fullTreatment && !selected.find(st => st.id === fullTreatment.id)) {
                selected.push(fullTreatment);
              }
            }
          }
          initialTreatments[idx] = selected;
        });
        setSelectedTreatmentsForItem(initialTreatments);
      } else {
        setStep('photos');
        setError('AI tidak mendeteksi item apapun. Coba dengan foto yang lebih jelas.');
      }
    } catch (err) {
      console.error('❌ AI Detection error:', err?.response?.data || err.message);

      // Handle AI Credit exhausted
      const errData = err?.response?.data || {};
      if (err?.response?.status === 402 || errData?.error === 'AI_CREDIT_EXHAUSTED') {
        setCreditPackages(errData?.packages || []);
        setCreditBalance(errData?.balance ?? 0);
        setShowCreditModal(true);
        setStep('photos');
        return;
      }

      const msg = err.response?.data?.error?.message || err.message || 'Terjadi kesalahan';
      setError(msg);
      setStep('photos');
    } finally {
      setDetecting(false);
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  }, [localPhotos, treatments, userPrompt]);

  // --- Editable Fields ---
  const updateEditableField = useCallback((resultIdx, field, value) => {
    setEditableItemFields(prev => {
      const updated = { ...prev };
      if (!updated[resultIdx]) return prev;
      updated[resultIdx] = { ...updated[resultIdx], [field]: value };
      return updated;
    });
  }, []);

  // --- Photo per Item ---
  const handleItemPhotoUpload = useCallback(async (resultIdx, e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    e.target.value = '';

    const currentPhotos = editableItemPhotos[resultIdx] || [];
    if (currentPhotos.length + files.length > MAX_PHOTOS_PER_ITEM) {
      setError(`Maksimal ${MAX_PHOTOS_PER_ITEM} foto per item`);
      return;
    }

    try {
      const urls = await uploadMultiplePhotos(files);
      setEditableItemPhotos(prev => {
        const updated = { ...prev };
        updated[resultIdx] = [...(updated[resultIdx] || []), ...urls];
        return updated;
      });
    } catch (err) {
      console.error('❌ Item photo upload error:', err);
      setError('Gagal upload foto');
    }
  }, [editableItemPhotos]);

  const removeItemPhoto = useCallback((resultIdx, photoIdx) => {
    setEditableItemPhotos(prev => {
      const updated = { ...prev };
      if (updated[resultIdx]) {
        updated[resultIdx] = updated[resultIdx].filter((_, i) => i !== photoIdx);
      }
      return updated;
    });
  }, []);

  // --- Group Treatments (simplified from aiToOrderDetails.js) ---
  const groupTreatmentItems = useCallback((convertedList) => {
    if (!convertedList || convertedList.length === 0) return [];

    const defaultDueDate = () => {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      return d.toISOString().slice(0, 10);
    };

    const map = new Map();

    convertedList.forEach(item => {
      const treatmentId = item.treatment?.id;
      if (treatmentId === undefined || treatmentId === null) {
        map.set(`fallback_${item.id}`, { ...item });
        return;
      }

      const key = String(treatmentId);

      if (!map.has(key)) {
        map.set(key, {
          id: `ai_group_${Date.now()}_${treatmentId}`,
          name: item.name,
          treatment: item.treatment,
          qty: 0,
          dueDate: defaultDueDate(),
          discount: null,
          custom_price: null,
          custom_price_reason: null,
          requires_tracking: true,
          items: [],
          _aiMeta: [],
        });
      }

      const group = map.get(key);
      group.qty += 1;
      if (item.items && item.items.length > 0) {
        group.items.push(item.items[0]);
      }
      if (item._aiMeta) {
        group._aiMeta.push(item._aiMeta);
      }
    });

    return Array.from(map.values());
  }, []);

  // --- Handle Confirm ---
  const handleConfirm = useCallback(async () => {
    if (aiResults.length === 0 || confirming) return;
    setConfirming(true);
    setError('');

    try {
      // Step 1: Create new items in DB
      const newItemIds = {};
      for (let resultIdx = 0; resultIdx < aiResults.length; resultIdx++) {
        const aiItem = aiResults[resultIdx];
        try {
          const itemData = {
            name: (editableItemFields[resultIdx]?.name || aiItem.item?.name || ''),
            brand: (editableItemFields[resultIdx]?.brand || aiItem.item?.brand || ''),
            type: (editableItemFields[resultIdx]?.type || aiItem.item?.type || 'Shoes'),
            color: (editableItemFields[resultIdx]?.color || aiItem.item?.color || ''),
            material: (editableItemFields[resultIdx]?.material || aiItem.item?.material || ''),
          };
          const response = await instance.post('/items/bulk-create', { items: [itemData] });
          if (response.data?.success && response.data?.data?.length > 0) {
            newItemIds[resultIdx] = response.data.data[0].id;
          }
        } catch (err) {
          console.error('❌ Failed to create item:', err);
        }
      }

      // Step 2: Convert 1:1 tiap AI item ke format treatment
      const converted = [];
      aiResults.forEach((aiItem, resultIdx) => {
        const selectedT = selectedTreatmentsForItem[resultIdx] || [];
        if (selectedT.length === 0) return;

        const newItemId = newItemIds[resultIdx];

        selectedT.forEach((matchedTreatment, tIdx) => {
          converted.push({
            id: `ai_${Date.now()}_${resultIdx}_${tIdx}`,
            name: matchedTreatment?.name || 'Treatment',
            treatment: matchedTreatment,
            qty: 1,
            dueDate: (() => {
              const d = new Date();
              d.setDate(d.getDate() + 2);
              return d.toISOString().slice(0, 10);
            })(),
            discount: null,
            custom_price: null,
            custom_price_reason: null,
            requires_tracking: true,
            items: [{
              item: {
                name: (editableItemFields[resultIdx]?.name || aiItem.item?.name || ''),
                brand: (editableItemFields[resultIdx]?.brand || aiItem.item?.brand || ''),
                type: (editableItemFields[resultIdx]?.type || aiItem.item?.type || 'Shoes'),
                color: (editableItemFields[resultIdx]?.color || aiItem.item?.color || ''),
                material: (editableItemFields[resultIdx]?.material || aiItem.item?.material || ''),
                ...(newItemId ? { id: newItemId } : {}),
              },
              photos: editableItemPhotos[resultIdx] || aiItem.photos || [],
              notes: editableConditions[resultIdx] || aiItem.condition || '',
            }],
            _aiMeta: {
              condition: editableConditions[resultIdx] || aiItem.condition,
              confidence: matchedTreatment?.confidence || 0,
              matchedItems: aiItem.matched_items || [],
              photosIndices: aiItem.photos_indices || [],
            },
          });
        });
      });

      // Step 3: Group by treatment.id
      const grouped = groupTreatmentItems(converted);

      onResult(grouped);
      onClose();
    } catch (err) {
      console.error('❌ Confirm error:', err);
      setError('Gagal menyimpan. Silakan coba lagi.');
    } finally {
      setConfirming(false);
    }
  }, [aiResults, selectedTreatmentsForItem, editableConditions, editableItemFields, editableItemPhotos, groupTreatmentItems, onResult, onClose, confirming]);

  // ========== RENDER HELPERS ==========

  // --- Step: Photo Selection ---
  const renderPhotoSelection = () => (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Section Title */}
      <h3 className="text-sm font-bold text-gray-800 font-montserrat mb-1">
        Upload Foto Item
      </h3>
      <p className="text-xs text-gray-500 font-montserrat mb-4">
        Ambil foto semua item sekaligus. AI akan mengelompokkan secara otomatis.
      </p>

      {/* Photo Grid */}
      <div className="flex flex-wrap gap-3 mb-3">
        {photoPreviews.map((uri, index) => (
          <div key={`photo-${index}`} className="relative">
            <img
              src={uri}
              alt={`Foto ${index + 1}`}
              className="w-20 h-20 object-cover rounded-xl border border-gray-200"
            />
            <button
              type="button"
              onClick={() => removePhoto(index)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {localPhotos.length < MAX_PHOTOS && (
          <>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <Camera className="w-6 h-6 text-blue-500" />
              <span className="text-[10px] text-blue-600 font-montserrat mt-1">Kamera</span>
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <ImageIcon className="w-6 h-6 text-gray-500" />
              <span className="text-[10px] text-gray-600 font-montserrat mt-1">Galeri</span>
            </button>
          </>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleGallerySelect}
        className="hidden"
      />

      {localPhotos.length > 0 && (
        <p className="text-xs text-gray-500 font-montserrat mb-4">
          {localPhotos.length} foto dipilih (maks {MAX_PHOTOS})
        </p>
      )}

      {/* User Prompt */}
      <h3 className="text-sm font-bold text-gray-800 font-montserrat mt-4 mb-1">
        Catatan untuk AI (opsional)
      </h3>
      <textarea
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none font-montserrat"
        placeholder="Contoh: Ini sepatu anak ukuran 32, sol kiri bolong, bau..."
        value={userPrompt}
        onChange={e => setUserPrompt(e.target.value)}
        rows={3}
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-xs text-red-600 font-montserrat">{error}</span>
        </div>
      )}

      {/* Detect Button */}
      <button
        type="button"
        onClick={handleDetect}
        disabled={localPhotos.length === 0 || detecting}
        className={`w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl font-montserrat font-semibold text-sm transition-all ${
          localPhotos.length === 0 || detecting
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-300 to-blue-400 text-white hover:from-blue-400 hover:to-blue-500 shadow-lg hover:shadow-xl'
        }`}
      >
        {detecting ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Sparkles className="w-5 h-5" />
        )}
        {detecting ? 'Mendeteksi...' : 'Deteksi AI Batch'}
      </button>
    </div>
  );

  // --- Step: Detecting ---
  const renderDetecting = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      <h3 className="text-lg font-bold text-gray-800 font-montserrat mb-2">
        {uploading ? '📤 Upload Foto...' : '🔍 Menganalisis Foto...'}
      </h3>
      {uploading && (
        <p className="text-sm text-gray-500 font-montserrat">
          Upload foto... ({uploadProgress.current}/{uploadProgress.total})
        </p>
      )}
      {!uploading && (
        <p className="text-sm text-gray-500 font-montserrat text-center">
          AI sedang mengelompokkan dan mendeteksi item dari {localPhotos.length} foto
        </p>
      )}
      <div className="mt-6 space-y-3 w-full max-w-xs">
        <div className="flex items-center gap-3">
          {uploading ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check className="w-5 h-5 text-green-500" />
          )}
          <span className="text-sm text-gray-700 font-montserrat">
            {uploading ? '⏳ Upload foto...' : '✅ Foto terupload'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-700 font-montserrat">⏳ AI menganalisa...</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 font-montserrat ml-8">⏳ Mencocokkan dengan database...</span>
        </div>
      </div>
    </div>
  );

  // --- Step: Results ---
  const renderResults = () => {
    const totalSelectedTreatments = aiResults.reduce(
      (sum, _, idx) => sum + ((selectedTreatmentsForItem[idx] || []).length || 0), 0
    );

    return (
      <div className="flex-1 flex flex-col min-h-0">
        {/* Results Header */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-gray-800 font-montserrat">
            AI Mendeteksi {aiResults.length} Item
          </h3>
        </div>

        {/* Results Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {aiResults.map((item, index) => {
            const fields = editableItemFields[index] || {};
            const conditions = editableConditions[index] || '';
            const itemPhotos = editableItemPhotos[index] || [];
            const selectedT = selectedTreatmentsForItem[index] || [];

            return (
              <div
                key={`result-${index}`}
                className="bg-white border-2 border-blue-100 rounded-2xl p-4 shadow-sm"
              >
                {/* Card Header — Editable Name */}
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-montserrat">
                    #{index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={fields.name || ''}
                      onChange={e => updateEditableField(index, 'name', e.target.value)}
                      className="w-full text-base font-bold text-gray-900 font-montserrat bg-transparent border-b-2 border-transparent focus:border-blue-400 focus:outline-none pb-0.5"
                      placeholder="Nama item..."
                    />
                    <p className="text-xs text-gray-500 font-montserrat mt-0.5">
                      {fields.brand || ''}{fields.color ? ` • ${fields.color}` : ''}
                    </p>
                  </div>
                </div>

                {/* Detail Fields Grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="text-[10px] text-gray-500 font-montserrat font-semibold">Merek</label>
                    <input
                      type="text"
                      value={fields.brand || ''}
                      onChange={e => updateEditableField(index, 'brand', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent font-montserrat"
                      placeholder="Merek..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-montserrat font-semibold">Warna</label>
                    <input
                      type="text"
                      value={fields.color || ''}
                      onChange={e => updateEditableField(index, 'color', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent font-montserrat"
                      placeholder="Warna..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-montserrat font-semibold">Material</label>
                    <input
                      type="text"
                      value={fields.material || ''}
                      onChange={e => updateEditableField(index, 'material', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent font-montserrat"
                      placeholder="Material..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-montserrat font-semibold">Tipe</label>
                    <input
                      type="text"
                      value={fields.type || 'Shoes'}
                      onChange={e => updateEditableField(index, 'type', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent font-montserrat"
                      placeholder="Tipe..."
                    />
                  </div>
                </div>

                {/* Condition - Editable TextArea */}
                <div className="mb-3">
                  <label className="text-[10px] text-gray-500 font-montserrat font-semibold">Kondisi:</label>
                  <textarea
                    value={conditions}
                    onChange={e => setEditableConditions(prev => ({ ...prev, [index]: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none font-montserrat mt-1"
                    placeholder="Deskripsi kondisi item..."
                    rows={2}
                  />
                </div>

                {/* Photo Grid */}
                <div className="mb-3">
                  <p className="text-[10px] text-gray-500 font-montserrat font-semibold mb-1">
                    Foto ({itemPhotos.length}/{MAX_PHOTOS_PER_ITEM})
                  </p>

                  {itemPhotos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {itemPhotos.map((photoUrl, pIdx) => (
                        <div key={`rp-${index}-${pIdx}`} className="relative">
                          <img
                            src={typeof photoUrl === 'string' ? photoUrl : photoUrl?.url_photo || photoUrl?.url}
                            alt={`Item ${index + 1} - ${pIdx + 1}`}
                            className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeItemPhoto(index, pIdx)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {itemPhotos.length < MAX_PHOTOS_PER_ITEM && (
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer flex items-center justify-center gap-1 py-1.5 border border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                        <Camera className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[11px] text-blue-600 font-montserrat font-medium">Ambil Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={e => handleItemPhotoUpload(index, e)}
                          className="hidden"
                        />
                      </label>
                      <label className="flex-1 cursor-pointer flex items-center justify-center gap-1 py-1.5 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-[11px] text-gray-600 font-montserrat font-medium">Gallery</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={e => handleItemPhotoUpload(index, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Treatments Section */}
                <div>
                  <p className="text-[10px] text-gray-500 font-montserrat font-semibold mb-1">Layanan:</p>

                  {/* Selected treatment pills */}
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {selectedT.map((t, tIdx) => {
                      const aiRec = item.treatments?.find(aiT => aiT.id === t.id);
                      const confidence = aiRec?.confidence;
                      return (
                        <div
                          key={`tp-${index}-${tIdx}`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-full"
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-medium text-green-800 font-montserrat whitespace-nowrap">
                              {t.name}
                            </span>
                            <span className="text-[10px] text-green-600 font-montserrat">
                              {formatCurrency(t.price || 0)}
                            </span>
                            {confidence !== undefined && (
                              <span className={`text-[9px] px-1 rounded-full font-montserrat ${
                                confidence >= 80 ? 'bg-green-200 text-green-800' :
                                confidence >= 60 ? 'bg-yellow-200 text-yellow-800' :
                                'bg-red-200 text-red-800'
                              }`}>
                                {Math.round(confidence)}%
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTreatmentsForItem(prev => {
                                const current = [...(prev[index] || [])];
                                return { ...prev, [index]: current.filter(st => st.id !== t.id) };
                              });
                            }}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Treatment Button */}
                  <button
                    type="button"
                    onClick={() => setShowTreatmentPicker(index)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-dashed border-blue-300 rounded-full text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium font-montserrat">Tambah Layanan</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Treatment Picker Overlay */}
        {showTreatmentPicker !== null && (
          <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black bg-opacity-40"
              onClick={() => setShowTreatmentPicker(null)}
            />

            {/* Picker Sheet */}
            <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[60vh] flex flex-col shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h4 className="text-sm font-bold text-gray-800 font-montserrat">Pilih Layanan</h4>
                <button
                  type="button"
                  onClick={() => setShowTreatmentPicker(null)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Search */}
              <div className="px-4 py-2 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari layanan..."
                    value={treatmentSearch}
                    onChange={e => setTreatmentSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent font-montserrat"
                    autoFocus
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-2">
                {treatments
                  .filter(t => {
                    if ((selectedTreatmentsForItem[showTreatmentPicker] || []).some(st => st.id === t.id)) return false;
                    if (treatmentSearch.trim()) {
                      return t.name.toLowerCase().includes(treatmentSearch.toLowerCase().trim());
                    }
                    return true;
                  })
                  .map((t, tIdx) => {
                    const item = aiResults[showTreatmentPicker];
                    const aiRec = item?.treatments?.find(aiT => aiT.id === t.id);
                    const confidence = aiRec?.confidence;
                    return (
                      <button
                        key={`tpk-${showTreatmentPicker}-${tIdx}`}
                        type="button"
                        onClick={() => {
                          setSelectedTreatmentsForItem(prev => {
                            const current = [...(prev[showTreatmentPicker] || [])];
                            return { ...prev, [showTreatmentPicker]: [...current, t] };
                          });
                          setShowTreatmentPicker(null);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-blue-50 rounded-xl transition-colors text-left"
                      >
                        <div>
                          <span className="text-sm font-medium text-gray-800 font-montserrat">{t.name}</span>
                          <span className="text-xs text-gray-500 font-montserrat ml-2">
                            {formatCurrency(t.price || 0)}
                          </span>
                        </div>
                        {confidence !== undefined && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-montserrat ${
                            confidence >= 80 ? 'bg-green-100 text-green-700' :
                            confidence >= 60 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {Math.round(confidence)}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                {treatments.filter(t => {
                  if ((selectedTreatmentsForItem[showTreatmentPicker] || []).some(st => st.id === t.id)) return false;
                  if (treatmentSearch.trim()) {
                    return t.name.toLowerCase().includes(treatmentSearch.toLowerCase().trim());
                  }
                  return true;
                }).length === 0 && (
                  <p className="text-center text-sm text-gray-400 font-montserrat py-8">
                    {treatmentSearch.trim() ? 'Layanan tidak ditemukan' : 'Semua layanan sudah dipilih'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="border-t border-gray-200 p-4 space-y-2">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-600 font-montserrat">{error}</span>
            </div>
          )}

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={totalSelectedTreatments === 0 || confirming}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-montserrat font-semibold text-sm transition-all ${
              totalSelectedTreatments === 0 || confirming
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-300 to-blue-400 text-white hover:from-blue-400 hover:to-blue-500 shadow-lg'
            }`}
          >
            {confirming ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            {confirming ? 'Menyimpan...' : `Tambahkan (${totalSelectedTreatments} item)`}
          </button>

          {/* Retry Button */}
          <button
            type="button"
            onClick={() => setStep('photos')}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors font-montserrat text-sm"
          >
            <Camera className="w-4 h-4" />
            Cari Lagi (Ganti Foto)
          </button>
        </div>
      </div>
    );
  };

  // ========== MAIN RENDER ==========
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-gray-50 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-300 to-blue-400 rounded-t-2xl px-6 py-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-bold text-white font-montserrat">AI Deteksi Cepat</h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              {step === 'photos' ? (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-blue-100 font-montserrat">
                    Upload foto, AI akan mendeteksi
                  </p>
                  {creditBalance !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        // Navigate to AI Credit page — adjust path as needed
                        window.location.href = '/ai-credit';
                      }}
                      className="flex items-center gap-1 bg-white/15 hover:bg-white/25 border border-white/25 rounded-full px-2.5 py-0.5 transition-colors"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-white" />
                      <span className="text-[10px] font-bold text-white font-montserrat tracking-wider">
                        AI CREDIT {creditBalance}
                      </span>
                      <span className="text-xs font-bold text-white font-montserrat ml-0.5">+</span>
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-blue-100 font-montserrat">
                  {step === 'detecting' && 'Mohon tunggu...'}
                  {step === 'results' && 'Review hasil deteksi AI'}
                </p>
              )}
            </div>

            {/* Body */}
            {step === 'photos' && renderPhotoSelection()}
            {step === 'detecting' && renderDetecting()}
            {step === 'results' && renderResults()}
          </motion.div>

          {/* Credit Exhausted Modal */}
          {showCreditModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center p-4"
              onClick={() => setShowCreditModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto p-6"
                onClick={e => e.stopPropagation()}
              >
                <div className="text-center mb-4">
                  <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-7 h-7 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 font-montserrat">AI Credit Habis</h3>
                  <p className="text-sm text-gray-500 font-montserrat mt-1">
                    Kuota AI detection kamu sudah habis. Beli credit atau upgrade paket untuk lanjut.
                  </p>
                </div>

                {creditPackages.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-semibold text-gray-600 font-montserrat text-center">Pilih paket credit:</p>
                    {creditPackages.map((pkg) => (
                      <div key={pkg.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                        <span className="text-sm font-semibold text-gray-800 font-montserrat">{pkg.credits} Credit</span>
                        <span className="text-sm font-bold text-blue-600 font-montserrat">Rp {Number(pkg.price).toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowCreditModal(false);
                    onClose();
                    window.location.href = '/ai-credit';
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold font-montserrat rounded-xl transition-colors shadow-md mb-2"
                >
                  Beli Credit
                </button>
                <button
                  onClick={() => setShowCreditModal(false)}
                  className="w-full py-2.5 text-sm text-gray-600 hover:text-gray-800 font-montserrat font-semibold transition-colors"
                >
                  Nanti Saja
                </button>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIDetectionModal;
