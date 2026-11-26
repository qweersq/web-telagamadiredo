import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Image as ImageIcon, Sparkles, Check } from 'lucide-react';
import { uploadMultiplePhotos, dataURLToFile } from '../../utils/uploadHelper';
import AiDetectionService from '../../services/aiDetectionService';
import { getUserProfile } from '../../utils/userProfileHelper';

const MAX_PHOTOS = 30;
const MAX_PHOTOS_PER_ITEM = 10;

/**
 * AIItemDetailModal — Deteksi detail item dari foto (untuk OrderDetail)
 *
 * Step flow: photos → detecting → results
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   onResult: ({ groupIdx, items }) => void
 *   groupIdx: number (index treatment group)
 */
const AIItemDetailModal = ({ open, onClose, onResult, groupIdx }) => {
  // Step: 'photos' | 'detecting' | 'results'
  const [step, setStep] = useState('photos');
  const [localPhotos, setLocalPhotos] = useState([]);
  const [uploadedUrls, setUploadedUrls] = useState([]);
  const [userPrompt, setUserPrompt] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [isDetecting, setIsDetecting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [aiResults, setAiResults] = useState([]);
  const [editableResults, setEditableResults] = useState([]);
  const [creditBalance, setCreditBalance] = useState(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditPackages, setCreditPackages] = useState([]);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const itemCameraInputRef = useRef(null);
  const itemGalleryInputRef = useRef(null);
  const [itemPhotoTarget, setItemPhotoTarget] = useState(null); // { resultIdx, source: 'camera'|'gallery' }

  // Reset state on open
  useEffect(() => {
    if (open) {
      setStep('photos');
      setLocalPhotos([]);
      setUploadedUrls([]);
      setUserPrompt('');
      setAiResults([]);
      setEditableResults([]);
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      setIsDetecting(false);
      setIsConfirming(false);
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

  // --- Pick Photos ---
  const handleCameraClick = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  const handleGalleryClick = useCallback(() => {
    galleryInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const total = localPhotos.length + files.length;
    if (total > MAX_PHOTOS) {
      alert(`Maksimal ${MAX_PHOTOS} foto. Kamu sudah punya ${localPhotos.length} foto.`);
      e.target.value = '';
      return;
    }

    // Convert to data URLs
    const newPhotos = [];
    for (const file of files) {
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(file);
      });
      newPhotos.push(dataUrl);
    }

    setLocalPhotos(prev => [...prev, ...newPhotos]);
    e.target.value = '';
  }, [localPhotos]);

  // --- Remove Photo ---
  const removePhoto = useCallback((index) => {
    setLocalPhotos(prev => prev.filter((_, i) => i !== index));
  }, []);

  // --- Upload Photos ---
  const uploadPhotos = useCallback(async () => {
    if (localPhotos.length === 0) return [];
    setIsUploading(true);
    setUploadProgress({ current: 0, total: localPhotos.length });

    try {
      const uploadedUrls = [];

      for (let i = 0; i < localPhotos.length; i++) {
        const dataUrl = localPhotos[i];
        setUploadProgress({ current: i + 1, total: localPhotos.length });

        // Convert data URL to File and upload (uploadMultiplePhotos handles resize internally)
        const file = dataURLToFile(dataUrl, `ai_photo_${Date.now()}_${i}.jpg`);
        const result = await uploadMultiplePhotos([file]);

        if (result && Array.isArray(result)) {
          for (const url of result) {
            if (url) uploadedUrls.push(url);
          }
        }
      }

      setUploadedUrls(uploadedUrls);
      return uploadedUrls;
    } catch (error) {
      console.error('❌ AIItemDetailModal - Upload error:', error);
      alert('Gagal upload foto');
      return [];
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  }, [localPhotos]);

  // --- Detect Item Details ---
  const handleDetect = useCallback(async () => {
    if (localPhotos.length === 0) {
      alert('Ambil foto sepatu dulu');
      return;
    }

    setStep('detecting');

    // Upload first
    const urls = await uploadPhotos();
    if (urls.length === 0) {
      setStep('photos');
      return;
    }

    // Detect
    setIsDetecting(true);
    try {
      const result = await AiDetectionService.detectItemDetails(urls, userPrompt);
      const items = result?.items || result?.data?.items || null;

      if (items && Array.isArray(items) && items.length > 0) {
        setAiResults(items);

        // Copy to editable results
        const editable = items.map(aiItem => ({
          ...aiItem,
          item: { ...(aiItem.item || {}) },
          shoes_photos: aiItem.photos ? [...aiItem.photos] : [],
          condition: aiItem.condition || aiItem.notes || '',
        }));
        setEditableResults(editable);
        setStep('results');
      } else {
        alert('AI tidak mendeteksi item dari foto yang diupload');
        setStep('photos');
      }
    } catch (error) {
      console.error('❌ AIItemDetailModal - Detect error:', error);

      // Handle AI Credit exhausted
      const errData = error?.response?.data || {};
      if (error?.response?.status === 402 || errData?.error === 'AI_CREDIT_EXHAUSTED') {
        setCreditPackages(errData?.packages || []);
        setCreditBalance(errData?.balance ?? 0);
        setShowCreditModal(true);
        setStep('photos');
        return;
      }

      alert(error.message || 'Gagal mendeteksi item');
      setStep('photos');
    } finally {
      setIsDetecting(false);
    }
  }, [localPhotos, userPrompt, uploadPhotos]);

  // --- Handle Confirm ---
  const handleConfirm = useCallback(() => {
    if (editableResults.length === 0 || isConfirming) return;
    setIsConfirming(true);

    console.log('🔍 [AIItemDetailModal] handleConfirm - groupIdx:', groupIdx);
    console.log('🔍 [AIItemDetailModal] editableResults:', JSON.parse(JSON.stringify(editableResults)));

    const resultItems = editableResults.map(item => ({
      ...item,
      photos: item.shoes_photos || item.photos || [],
    }));

    console.log('🔍 [AIItemDetailModal] resultItems (after photos mapping):', resultItems.map(r => ({
      name: r.item?.name,
      photosType: typeof r.photos?.[0],
      photosCount: r.photos?.length,
      photosSample: r.photos?.[0]?.substring?.(0, 60) || r.photos?.[0],
      condition: r.condition
    })));

    onResult({ groupIdx, items: resultItems });
    onClose();
  }, [editableResults, groupIdx, onResult, onClose, isConfirming]);

  // --- Update editable field ---
  const updateEditableField = useCallback((resultIdx, field, value) => {
    setEditableResults(prev => {
      const updated = [...prev];
      if (!updated[resultIdx]) return prev;
      updated[resultIdx] = {
        ...updated[resultIdx],
        item: {
          ...(updated[resultIdx].item || {}),
          [field]: value,
        },
      };
      return updated;
    });
  }, []);

  // --- Pick Photo for specific item result ---
  const handleItemCameraClick = useCallback((resultIdx) => {
    setItemPhotoTarget({ resultIdx, source: 'camera' });
    setTimeout(() => itemCameraInputRef.current?.click(), 0);
  }, []);

  const handleItemGalleryClick = useCallback((resultIdx) => {
    setItemPhotoTarget({ resultIdx, source: 'gallery' });
    setTimeout(() => itemGalleryInputRef.current?.click(), 0);
  }, []);

  const handleItemPhotoFileChange = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !itemPhotoTarget) return;

    const { resultIdx } = itemPhotoTarget;
    const currentPhotos = editableResults[resultIdx]?.shoes_photos || [];
    const remaining = MAX_PHOTOS_PER_ITEM - currentPhotos.length;

    const filesToProcess = files.slice(0, remaining);

    for (const file of filesToProcess) {
      try {
        // uploadMultiplePhotos handles resize internally
        const result = await uploadMultiplePhotos([file]);

        if (result && Array.isArray(result)) {
          for (const url of result) {
            if (url) {
              setEditableResults(prev => {
                const updated = [...prev];
                if (!updated[resultIdx]) return prev;
                const existing = updated[resultIdx].shoes_photos || [];
                updated[resultIdx] = {
                  ...updated[resultIdx],
                  shoes_photos: [...existing, url],
                };
                return updated;
              });
            }
          }
        }
      } catch (error) {
        console.error('❌ AIItemDetailModal - Item photo upload error:', error);
      }
    }

    e.target.value = '';
    setItemPhotoTarget(null);
  }, [itemPhotoTarget, editableResults]);

  // --- Remove photo from item ---
  const removeItemPhoto = useCallback((resultIdx, photoIdx) => {
    setEditableResults(prev => {
      const updated = [...prev];
      if (!updated[resultIdx]) return prev;
      const currentPhotos = updated[resultIdx].shoes_photos || [];
      updated[resultIdx] = {
        ...updated[resultIdx],
        shoes_photos: currentPhotos.filter((_, i) => i !== photoIdx),
      };
      return updated;
    });
  }, []);

  // --- Update condition directly ---
  const updateCondition = useCallback((resultIdx, value) => {
    setEditableResults(prev => {
      const updated = [...prev];
      if (!updated[resultIdx]) return prev;
      updated[resultIdx] = { ...updated[resultIdx], condition: value };
      return updated;
    });
  }, []);

  // ===== RENDER: Photo Selection =====
  const renderPhotoSelection = () => (
    <div className="p-6 overflow-y-auto flex-1">
      <h3 className="text-lg font-bold text-gray-900 font-montserrat mb-1">Foto Sepatu</h3>
      <p className="text-sm text-gray-500 font-montserrat mb-4">
        Foto sepatu yang mau diisi detailnya. Upload banyak foto sekaligus AI akan otomatis kelompokkan per sepatu.
      </p>

      {/* Photo Grid */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        {localPhotos.map((dataUrl, i) => (
          <div key={`photo-${i}`} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
            <img src={dataUrl} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
            <button
              onClick={() => removePhoto(i)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={10} className="text-white" />
            </button>
          </div>
        ))}
        {localPhotos.length < MAX_PHOTOS && (
          <>
            <button
              onClick={handleCameraClick}
              className="aspect-square rounded-xl border-2 border-dashed border-telaga-300 flex flex-col items-center justify-center gap-1 bg-telaga-50/50 hover:bg-telaga-50 transition-colors"
            >
              <Camera size={24} className="text-telaga-500" />
              <span className="text-[10px] font-semibold text-telaga-600 font-montserrat">Kamera</span>
            </button>
            <button
              onClick={handleGalleryClick}
              className="aspect-square rounded-xl border-2 border-dashed border-telaga-300 flex flex-col items-center justify-center gap-1 bg-telaga-50/50 hover:bg-telaga-50 transition-colors"
            >
              <ImageIcon size={24} className="text-telaga-500" />
              <span className="text-[10px] font-semibold text-telaga-600 font-montserrat">Galeri</span>
            </button>
          </>
        )}
      </div>

      {localPhotos.length > 0 && (
        <p className="text-xs text-gray-500 text-center font-montserrat mb-3">{localPhotos.length} foto dipilih</p>
      )}

      {/* Hidden file inputs */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" multiple={false} onChange={handleFileChange} className="hidden" />
      <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />

      {/* Hidden file inputs for item photos */}
      <input ref={itemCameraInputRef} type="file" accept="image/*" capture="environment" multiple={false} onChange={handleItemPhotoFileChange} className="hidden" />
      <input ref={itemGalleryInputRef} type="file" accept="image/*" multiple onChange={handleItemPhotoFileChange} className="hidden" />

      {/* User Prompt */}
      <h3 className="text-lg font-bold text-gray-900 font-montserrat mb-1 mt-4">Catatan (opsional)</h3>
      <textarea
        value={userPrompt}
        onChange={e => setUserPrompt(e.target.value)}
        placeholder="Contoh: sepatu anak ukuran 32, sol kiri bolong, bau banget"
        className="w-full border border-gray-300 rounded-xl p-3 text-sm font-montserrat text-gray-900 min-h-[60px] resize-none focus:ring-2 focus:ring-telaga-400 focus:border-transparent mb-4"
      />

      {/* Detect Button */}
      <button
        onClick={handleDetect}
        disabled={localPhotos.length === 0 || isDetecting}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base font-montserrat transition-all ${
          localPhotos.length === 0 || isDetecting
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-telaga-600 text-white hover:bg-telaga-700 shadow-md hover:shadow-lg'
        }`}
      >
        {isDetecting ? (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <Sparkles size={20} />
        )}
        {isDetecting ? 'Mendeteksi...' : 'Deteksi Detail Item ✨'}
      </button>
    </div>
  );

  // ===== RENDER: Detecting =====
  const renderDetecting = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-10 gap-4">
      <div className="w-12 h-12 border-4 border-telaga-200 border-t-telaga-600 rounded-full animate-spin" />
      <h3 className="text-lg font-bold text-gray-900 font-montserrat">AI Sedang Menganalisa...</h3>
      <p className="text-sm text-gray-500 font-montserrat text-center">Mengelompokkan foto dan mendeteksi detail sepatu</p>
      {isUploading && (
        <p className="text-xs text-gray-400 font-montserrat">
          Upload foto... ({uploadProgress.current}/{uploadProgress.total})
        </p>
      )}
    </div>
  );

  // ===== RENDER: Results =====
  const renderResults = () => (
    <div className="p-6 overflow-y-auto flex-1">
      <h3 className="text-lg font-bold text-gray-900 font-montserrat mb-1">🎯 Hasil Deteksi AI</h3>
      <p className="text-sm text-gray-500 font-montserrat mb-4">
        AI mendeteksi {editableResults.length} sepatu. Edit detailnya jika perlu, lalu konfirmasi.
      </p>

      {editableResults.map((item, idx) => (
        <div key={`result-${idx}`} className="rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-telaga-50 to-senja-50 border border-telaga-200 p-5">
          {/* Header with editable name */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-telaga-600 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-white font-montserrat">{idx + 1}</span>
            </div>
            <input
              value={item.item?.name || ''}
              onChange={e => updateEditableField(idx, 'name', e.target.value)}
              placeholder="Nama item..."
              className="flex-1 text-base font-bold text-gray-900 font-montserrat border-b-2 border-telaga-200 focus:border-telaga-500 outline-none bg-transparent py-1"
            />
          </div>

          {/* Editable Detail Fields — 2-column grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[11px] text-gray-500 font-montserrat block mb-1">Merek</label>
              <input
                value={item.item?.brand || ''}
                onChange={e => updateEditableField(idx, 'brand', e.target.value)}
                placeholder="Merek..."
                className="w-full text-sm font-semibold text-gray-900 font-montserrat border border-telaga-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-telaga-400 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 font-montserrat block mb-1">Warna</label>
              <input
                value={item.item?.color || ''}
                onChange={e => updateEditableField(idx, 'color', e.target.value)}
                placeholder="Warna..."
                className="w-full text-sm font-semibold text-gray-900 font-montserrat border border-telaga-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-telaga-400 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 font-montserrat block mb-1">Material</label>
              <input
                value={item.item?.material || ''}
                onChange={e => updateEditableField(idx, 'material', e.target.value)}
                placeholder="Material..."
                className="w-full text-sm font-semibold text-gray-900 font-montserrat border border-telaga-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-telaga-400 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 font-montserrat block mb-1">Tipe</label>
              <input
                value={item.item?.type || 'Shoes'}
                onChange={e => updateEditableField(idx, 'type', e.target.value)}
                placeholder="Tipe..."
                className="w-full text-sm font-semibold text-gray-900 font-montserrat border border-telaga-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-telaga-400 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Condition — TextArea */}
          <div className="mb-4">
            <label className="text-[11px] text-gray-500 font-montserrat block mb-1">Catatan / Kondisi</label>
            <textarea
              value={item.condition || ''}
              onChange={e => updateCondition(idx, e.target.value)}
              placeholder="Catatan atau kondisi sepatu..."
              className="w-full border border-telaga-200 rounded-lg p-3 text-sm font-montserrat text-gray-900 min-h-[60px] resize-none bg-white focus:ring-2 focus:ring-telaga-400 focus:border-transparent outline-none"
              rows={3}
            />
          </div>

          {/* Photos Section */}
          <div>
            <p className="text-xs text-gray-500 font-montserrat mb-2">
              Foto ({item.shoes_photos?.length || 0}/{MAX_PHOTOS_PER_ITEM})
            </p>

            {item.shoes_photos && item.shoes_photos.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {item.shoes_photos.map((photoUrl, pIdx) => (
                  <div key={`result-${idx}-photo-${pIdx}`} className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 group">
                    <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeItemPhoto(idx, pIdx)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={8} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {(item.shoes_photos?.length || 0) < MAX_PHOTOS_PER_ITEM && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleItemCameraClick(idx)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-telaga-200 text-telaga-600 hover:bg-telaga-50 text-xs font-montserrat font-semibold transition-colors"
                >
                  <Camera size={12} />
                  Ambil Foto
                </button>
                <button
                  onClick={() => handleItemGalleryClick(idx)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs font-montserrat font-semibold transition-colors"
                >
                  <ImageIcon size={12} />
                  Gallery
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Action Buttons */}
      <button
        onClick={handleConfirm}
        disabled={isConfirming}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base font-montserrat transition-all mb-3 ${
          isConfirming
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
        }`}
      >
        {isConfirming ? (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <Check size={20} />
        )}
        {isConfirming ? 'Menyimpan...' : `Konfirmasi & Isi ${editableResults.length} Item`}
      </button>

      {/* Cari Lagi */}
      <button
        onClick={() => setStep('photos')}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold text-sm font-montserrat transition-colors"
      >
        <Camera size={16} />
        Cari Lagi (Ganti Foto)
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 pt-4 pb-3 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 font-montserrat">
                  {step === 'photos' ? 'AI Deteksi Cepat' : step === 'detecting' ? '⏳ Mendeteksi...' : '🎯 Hasil Deteksi'}
                </h2>
                <div className="flex items-center gap-2">
                  {creditBalance !== null && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        window.location.href = '/ai-credit';
                      }}
                      className="flex items-center gap-1 bg-telaga-50 hover:bg-telaga-100 border border-telaga-200 rounded-full px-2.5 py-0.5 transition-colors"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-telaga-600" />
                      <span className="text-[10px] font-bold text-telaga-700 font-montserrat tracking-wider">
                        AI CREDIT {creditBalance}
                      </span>
                      <span className="text-xs font-bold text-telaga-600 font-montserrat ml-0.5">+</span>
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>
              </div>
              {step === 'results' && (
                <p className="text-xs text-gray-500 font-montserrat mt-1">
                  Group #{groupIdx !== undefined ? groupIdx + 1 : '-'} — {aiResults.length} item terdeteksi
                </p>
              )}
            </div>

            {/* Content */}
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
                        <span className="text-sm font-bold text-telaga-600 font-montserrat">Rp {Number(pkg.price).toLocaleString('id-ID')}</span>
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
                  className="w-full py-3 bg-telaga-600 hover:bg-telaga-700 text-white font-bold font-montserrat rounded-xl transition-colors shadow-md mb-2"
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
        </div>
      )}
    </AnimatePresence>
  );
};

export default AIItemDetailModal;
