import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AnimatedButton from '../Design/AnimatedButton';
import { resizeImageFile } from '../../pages/ORDER/components/OrderDetail/ImageResizeUtil';
import { Camera, Image } from 'lucide-react';
import instance from '../../config/api';
import { useLocation } from 'react-router-dom';
import { getUserProfile } from '../../utils/userProfileHelper';

const MAX_SIZE_MB = 10;

const UploadPhotoModal = ({ isOpen, onClose, onSubmit, status, onSendAuto, onSendManual }) => {
  const [selectedFiles, setSelectedFiles] = useState([]); // Array of Blobs
  const [previewUrls, setPreviewUrls] = useState([]); // Array of URLs
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0); // Tambahan
  const location = useLocation();
  const [showSendModal, setShowSendModal] = useState(false);
  const [maxFiles, setMaxFiles] = useState(6); // Default untuk backward compatibility
  const [isNotaFree, setIsNotaFree] = useState(false);

  // Fetch subscription plan untuk menentukan max files
  useEffect(() => {
    const fetchMaxFiles = async () => {
      if (!isOpen) return;
      
      try {
        const profile = await getUserProfile();
        // Subscription ada di level root, bukan di dalam tenant
        const planId = profile?.subscription?.plan?.id;
        
        // NotaFree (plan_id = 4): max 3 foto, Paid plans: max 6 foto
        if (planId === 4) {
          setMaxFiles(3);
          setIsNotaFree(true);
        } else {
          setMaxFiles(6);
          setIsNotaFree(false);
        }
      } catch (error) {
        console.error('❌ UploadPhotoModal - Error fetching subscription plan:', error);
        // Fallback ke default
        setMaxFiles(6);
        setIsNotaFree(false);
      }
    };

    fetchMaxFiles();
  }, [isOpen]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (files.length + selectedFiles.length > maxFiles) {
      setError(`Maksimal upload ${maxFiles} foto!`);
      return;
    }
    setError('');
    setLoading(true);
    const newFiles = [];
    const newUrls = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Semua file harus berupa gambar!');
        setLoading(false);
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`Ukuran gambar maksimal ${MAX_SIZE_MB}MB per foto!`);
        setLoading(false);
        return;
      }
      try {
        const resized = await resizeImageFile(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.7 });
        newFiles.push(resized);
        newUrls.push(URL.createObjectURL(resized));
      } catch (err) {
        setError('Gagal resize gambar.');
        setLoading(false);
        return;
      }
    }
    setSelectedFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
    setPreviewUrls(prev => [...prev, ...newUrls].slice(0, maxFiles));
    setLoading(false);
  };

  const handleRemove = (idx) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviewUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!selectedFiles.length) {
      setError('Wajib upload minimal 1 foto sebagai bukti!');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const BATCH_SIZE = 1;
      const allUrls = [];
      
      // Upload sequential per batch
      for (let i = 0; i < selectedFiles.length; i += BATCH_SIZE) {
        const batch = selectedFiles.slice(i, i + BATCH_SIZE);
        const formData = new FormData();
        batch.forEach((file) => {
          formData.append('photos', file, file.name || 'photo.jpg');
        });
        
        const res = await instance.post('/uploads-process', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
        });
        
        if (res.data.success && Array.isArray(res.data.data)) {
          const batchUrls = res.data.data.map((item) => item.url_photo);
          allUrls.push(...batchUrls);
        } else {
          throw new Error('Gagal upload batch foto.');
        }
      }
      
      setSelectedFiles([]);
      setPreviewUrls([]);
      setError('');
      setFailedAttempts(0);
      
      if (location.pathname.includes('/antriankasir')) {
        const isQCNotPass = window.qcType === 'not_yet';
        if (isQCNotPass) {
          onSubmit(allUrls);
          onClose();
        } else {
          onSubmit(allUrls);
          onSendManual && onSendManual();
          onClose();
        }
      } else {
        onSubmit(allUrls);
        onClose();
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Upload terlalu lama. Pastikan koneksi internet stabil dan coba lagi.');
      } else if (err.response?.data?.error?.message) {
        setError(err.response.data.error.message);
      } else {
        setError('Gagal upload foto. Silakan coba lagi.');
      }
      setFailedAttempts(f => f + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setError('');
    setFailedAttempts(0);
    onClose();
  };

  // Handler skip
  const handleSkip = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setError('');
    setFailedAttempts(0);
    onSubmit([""]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Modal utama upload foto */}
          <motion.div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs flex flex-col items-center relative border-2 border-blue-100"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center w-full">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-2 border-2 border-blue-200">
                <Camera className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-lg font-montserrat font-bold text-center mb-1">Upload Foto Item</h3>
              <p className="text-xs text-gray-600 mb-2 text-center">
                Pastikan foto item terlihat jelas dan sesuai dengan yang diinputkan.
              </p>
              {isNotaFree ? (
                <p className="text-[10px] text-orange-600 mb-4 text-center">
                  Maksimal {maxFiles} foto untuk paket NotaFree
                </p>
              ) : (
                <p className="text-[10px] text-gray-500 mb-4 text-center">
                  Maksimal {maxFiles} foto
                </p>
              )}
              
              {previewUrls.length > 0 && (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-2 w-full">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img src={url} alt={`Preview ${idx + 1}`} className="w-20 h-20 object-cover rounded-xl border-2 border-blue-200 shadow" />
                        <button
                          type="button"
                          onClick={() => handleRemove(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-80 group-hover:opacity-100"
                          title="Hapus foto"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mb-3 text-center">
                    Total: {selectedFiles.length} foto • Ukuran total: {(selectedFiles.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </>
              )}
              
              {/* Tombol pilihan sumber foto - selalu ada di bawah */}
              <div className="w-full flex gap-2 mb-3">
                <label htmlFor="photo-camera" className="flex-1 cursor-pointer flex items-center justify-center border border-blue-300 rounded-lg px-3 py-2 bg-blue-50 hover:bg-blue-100 transition">
                  <Camera className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-blue-600 font-medium text-xs">Ambil Foto</span>
                  <input
                    id="photo-camera"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={loading || selectedFiles.length >= maxFiles}
                  />
                </label>
                <label htmlFor="photo-gallery" className="flex-1 cursor-pointer flex items-center justify-center border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 hover:bg-gray-100 transition">
                  <Image className="w-4 h-4 text-gray-500 mr-1" />
                  <span className="text-gray-600 font-medium text-xs">Gallery</span>
                  <input
                    id="photo-gallery"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={loading || selectedFiles.length >= maxFiles}
                  />
                </label>
              </div>
              
              {loading && <span className="text-xs text-blue-400 mb-2 text-center">Memproses gambar...</span>}
              {error && <div className="text-red-500 text-xs mb-2 text-center">{error}</div>}
            </div>
            <div className="flex gap-2 w-full mt-2">
              <AnimatedButton onClick={handleClose} variant="grey" className="flex-1 py-2" disabled={loading}>Batal</AnimatedButton>
              <AnimatedButton onClick={handleSubmit} variant="blue" className="flex-1 py-2" disabled={loading}>
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Mengupload...</span>
                  </div>
                ) : (
                  'Upload'
                )}
              </AnimatedButton>
            </div>
            {/* Skip button jika gagal 3x */}
            {failedAttempts >= 3 && (
              <div className="w-full flex flex-col items-center mt-3">
                <span className="text-xs text-gray-400 mb-1">Gagal upload 3x? Lanjut tanpa foto.</span>
                <AnimatedButton onClick={handleSkip} variant="grey" className="w-full py-2">Skip Foto</AnimatedButton>
              </div>
            )}
          </motion.div>
          {/* Modal konfirmasi kirim pesan ke customer */}
          {showSendModal && (
            <motion.div
              className="fixed inset-0 z-[201] px-4 flex items-center justify-center bg-black bg-opacity-60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="bg-white rounded-xl shadow-lg p-6 max-w-xs w-full font-montserrat flex flex-col items-center">
                <h3 className="text-lg font-montserrat text-blue-700 mb-2">Kirim Pesan ke Customer?</h3>
                <p className="text-sm text-gray-700 mb-4 text-center">Item sudah selesai. Ingin kirim pesan WhatsApp otomatis ke customer?</p>
                <div className="flex flex-col gap-2 w-full mt-2">
                  <AnimatedButton
                    onClick={() => {
                      setShowSendModal(false);
                      if (pendingUrls) onSubmit(pendingUrls);
                      onSendAuto('semua');
                      onClose();
                    }}
                    variant="blue"
                    className="w-full py-2"
                  >Kabari Semua Selesai</AnimatedButton>
                  <AnimatedButton
                    onClick={() => {
                      setShowSendModal(false);
                      if (pendingUrls) onSubmit(pendingUrls);
                      onSendAuto && onSendAuto('sebagian');
                      onClose();
                    }}
                    variant="blue"
                    className="w-full py-2"
                  >Kabari Item Ini Saja</AnimatedButton>
                  <AnimatedButton
                    onClick={() => {
                      setShowSendModal(false);
                      if (pendingUrls) onSubmit(pendingUrls);
                      onSendManual && onSendManual();
                      onClose();
                    }}
                    variant="grey"
                    className="w-full py-2"
                  >Nanti Saja</AnimatedButton>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadPhotoModal;