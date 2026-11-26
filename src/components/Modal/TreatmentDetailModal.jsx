import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AnimatedButton from "../Design/AnimatedButton";
import Check from "../../assets/images/check.svg";
import instance from '../../config/api';
import UploadPhotoModal from './UploadPhotoModal';
import { getUserProfile } from '../../utils/userProfileHelper';

const TreatmentDetailModal = ({
  isOpen,
  onClose,
  treatment,
  description,
  isStarted,
  duration,
  onStart,
  onCancel,
  treatmentId,
  brand,
  color,
  shoesPhotos,
  onFinish,
  employee,
  dueDate,
  processTime,
  finalPrice,
  customPriceReason,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const MAX_DESCRIPTION_LENGTH = 150; // Anda bisa mengubah nilai ini

  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'on_progress' | 'pengeringan'
  const [pendingAction, setPendingAction] = useState(null); // 'start' | 'finish'
  const [pendingArgs, setPendingArgs] = useState(null);
  const [isAutoSwipeActive, setIsAutoSwipeActive] = useState(true);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(0); // Reset to first image when modal opens
      setIsRefreshing(false); // Reset refreshing state when modal opens
    }
  }, [isOpen]);

  // Auto-swipe functionality
  useEffect(() => {
    let interval;
    if (isOpen && shoesPhotos && shoesPhotos.length > 1 && isAutoSwipeActive) {
      interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) =>
          prevIndex === shoesPhotos.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000); // Ganti gambar setiap 5 detik
    }
    return () => clearInterval(interval);
  }, [isOpen, shoesPhotos, isAutoSwipeActive]);

  // Swipe gesture handlers
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    setTouchEndX(e.changedTouches[0].clientX);
    const swipeDistance = touchEndX - touchStartX;
    const swipeThreshold = 50; // Jarak swipe minimal untuk dianggap sebagai gesture

    if (swipeDistance > swipeThreshold) {
      // Swipe right (previous image)
      setIsAutoSwipeActive(false); // Disable auto-swipe when user manually swipes
      handlePrevImage();
    } else if (swipeDistance < -swipeThreshold) {
      // Swipe left (next image)
      setIsAutoSwipeActive(false); // Disable auto-swipe when user manually swipes
      handleNextImage();
    }
  };

  const handlePrevImage = () => {
    setIsAutoSwipeActive(false); // Disable auto-swipe when user manually navigates
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? shoesPhotos.length - 1 : prevIndex - 1
    );
  };

  const handleNextImage = () => {
    setIsAutoSwipeActive(false); // Disable auto-swipe when user manually navigates
    setCurrentImageIndex((prevIndex) =>
      prevIndex === shoesPhotos.length - 1 ? 0 : prevIndex + 1
    );
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = async () => {
    setUploadStatus('on_progress');
    setPendingAction('start');
    setShowUploadModal(true);
  };

  const handleCancel = async () => {
    try {
      await instance.put(`/order-details/${treatmentId}`, { status: "antrian" });
      console.log(`Treatment ${treatmentId} status updated to 'antrian'.`);
      await onCancel(treatmentId);
      onFinish();
      onClose();
    } catch (error) {
      console.error("Error canceling treatment and updating status:", error);
    }
  };

  const handleFinishTreatment = async () => {
    setUploadStatus('pengeringan');
    setPendingAction('finish');
    setShowUploadModal(true);
  };

  // Handler setelah upload foto sukses
  const handlePhotoUploaded = async (photoUrls) => {
    setShowUploadModal(false);
    setIsRefreshing(true);
    try {
      const profile = await getUserProfile();
      const updated_by = profile?.user?.id;
      let old_status = '';
      let new_status = '';
      if (pendingAction === 'start') {
        old_status = 'antrian'; // Bisa dari antrian, not_yet, atau not_ready
        new_status = 'on_progress';
      } else if (pendingAction === 'finish') {
        old_status = 'on_progress';
        new_status = 'pengeringan';
      }
      const payload = {
        old_status,
        new_status,
        updated_by,
        photos: photoUrls,
      };
      await instance.post(`/order-detail-process/${treatmentId}`, payload);
      if (pendingAction === 'start') {
        await onStart(treatmentId);
      } else if (pendingAction === 'finish') {
        await onCancel(treatmentId);
      }
      await onFinish();
      onClose();
    } catch (error) {
      console.error('Error updating treatment status with photo:', error);
      setIsRefreshing(false);
    } finally {
      setPendingAction(null);
      setUploadStatus(null);
      setPendingArgs(null);
    }
  };

  const handleToggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  const handleCancelOnProgress = () => {
    setShowCancelConfirmation(true);
  };

  const handleConfirmCancel = async () => {
    try {
      setShowCancelConfirmation(false);
      await instance.delete(`/order-detail-process/${treatmentId}/cancel`);
      console.log(`Treatment ${treatmentId} canceled and status reverted to 'antrian'.`);
      await onCancel(treatmentId);
      onFinish();
      onClose();
    } catch (error) {
      console.error("Error canceling treatment:", error);
      alert(error.response?.data?.message || 'Gagal membatalkan treatment');
    }
  };

  const handleCancelConfirmationClose = () => {
    setShowCancelConfirmation(false);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[100] overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-center min-h-screen p-6 sm:p-8" style={{
              paddingTop: 'max(2rem, env(safe-area-inset-top))',
              paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
              paddingLeft: 'max(2rem, env(safe-area-inset-left))',
              paddingRight: 'max(2rem, env(safe-area-inset-right))'
            }}>
              <motion.div
                className="fixed inset-0 bg-black transition-opacity z-[101]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.75 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0, ease: "easeInOut" }}
                aria-hidden="true"
                onClick={onClose}
              />

              <motion.div
                className="relative bg-white rounded-2xl text-left shadow-xl transform w-full max-w-lg z-[102] flex flex-col max-h-[85vh]"
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Header - Fixed */}
                <div className="bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] px-6 py-3 flex-shrink-0 rounded-t-2xl flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    Detail Layanan
                  </h3>
                  <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    aria-label="Close modal"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content - Scrollable */}
                <div className="px-6 py-4 flex-1 overflow-y-auto" style={{
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain'
                }}>
                  {/* Image Slider Section */}
                  {shoesPhotos && shoesPhotos.length > 0 && (
                    <div
                      className="relative w-full h-48 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center mb-3 cursor-grab"
                      onTouchStart={handleTouchStart}
                      onTouchEnd={handleTouchEnd}
                    >
                      <img
                        src={shoesPhotos[currentImageIndex]?.url_photo}
                        alt={`Shoes Photo ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Navigation Arrows */}
                      {shoesPhotos.length > 1 && (
                        <>
                          {/* Left Arrow */}
                          <button
                            onClick={handlePrevImage}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1.5 rounded-full transition-all duration-200 z-10"
                            aria-label="Previous image"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          
                          {/* Right Arrow */}
                          <button
                            onClick={handleNextImage}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1.5 rounded-full transition-all duration-200 z-10"
                            aria-label="Next image"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </>
                      )}
                      
                      {/* Image Indicators */}
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                        {shoesPhotos.map((_, idx) => (
                          <span
                            key={idx}
                            className={`block w-1.5 h-1.5 rounded-full ${idx === currentImageIndex ? 'bg-white' : 'bg-gray-400'}`}
                          ></span>
                        ))}
                      </div>
                      
                      {/* Auto-swipe Toggle Button */}
                      {shoesPhotos.length > 1 && (
                        <button
                          onClick={() => setIsAutoSwipeActive(!isAutoSwipeActive)}
                          className="absolute bottom-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1 rounded-full transition-all duration-200 z-10"
                          aria-label={isAutoSwipeActive ? "Disable auto-swipe" : "Enable auto-swipe"}
                        >
                          {isAutoSwipeActive ? (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          ) : (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Treatment Info Section */}
                  <div className="mb-4">
                    <h4 className="text-base font-montserrat font-semibold mb-3 text-gray-800">{treatment}</h4>
                    
                    {/* Custom Price Reason */}
                    {customPriceReason && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 mb-3">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-xs font-montserrat text-blue-600 font-semibold mb-0.5">Ket. Penyesuaian Harga</p>
                            <p className="text-xs font-montserrat text-gray-700 leading-relaxed">{customPriceReason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Item Details */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-2 gap-3 text-sm font-montserrat">
                        <div>
                          <span className="text-xs text-gray-500 font-medium">Brand:</span>
                          <p className="text-xs font-semibold text-gray-800 mt-1">{brand || '-'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 font-medium">Warna:</span>
                          <p className="text-xs font-semibold text-gray-800 mt-1">{color || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Employee Info */}
                    {employee && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-montserrat font-bold">
                              {employee.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-montserrat font-semibold text-gray-800">Pencatat Item</p>
                            <p className="text-xs font-montserrat text-gray-500 capitalize font-medium">{employee.name}</p>
                          </div>
                        </div>
                        {/* <div className="text-xs font-montserrat text-gray-600 space-y-1">
                          <p className="font-medium">Email: <span className="font-normal">{employee.email}</span></p>
                          <p className="font-medium">Phone: <span className="font-normal">{employee.phone}</span></p>
                        </div> */}
                      </div>
                    )}

                    {/* Due Date */}
                    {dueDate && (
                      <div className="bg-orange-50 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <p className="text-xs font-montserrat text-gray-500 font-medium">Tanggal Selesai</p>
                            <p className="text-xs font-montserrat font-semibold text-gray-800">
                              {new Date(dueDate).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {description && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-montserrat text-gray-500 font-medium mb-1">Deskripsi:</p>
                        <p className="text-xs font-montserrat text-gray-700 leading-relaxed">
                          {description.length > MAX_DESCRIPTION_LENGTH ? (
                            <>
                              {showFullDescription
                                ? description
                                : `${description.substring(0, MAX_DESCRIPTION_LENGTH)}...`}
                              <button
                                onClick={handleToggleDescription}
                                className="text-blue-500 hover:underline ml-1 font-medium text-xs"
                              >
                                {showFullDescription ? "Kurang" : "Lebih..."}
                              </button>
                            </>
                          ) : (
                            description
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer - Fixed */}
                <div className="px-6 py-3 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
                  {isRefreshing ? (
                    // Loading state saat refresh data
                    <div className="flex items-center justify-center gap-2 py-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <span className="text-sm text-gray-600 font-montserrat font-semibold">Memperbarui data...</span>
                    </div>
                  ) : isStarted ? (
                    // Footer saat treatment sedang dikerjakan (on progress)
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancelOnProgress}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-montserrat font-semibold text-sm border border-red-200"
                        title="Batalkan Treatment"
                      >
                        ✕
                      </button>
                      <div className="flex-1 px-3 py-2 bg-blue-50 text-[#2E7CF6] rounded-lg font-montserrat font-semibold text-center text-sm border border-blue-200">
                        {formatDuration(duration)}
                      </div>
                      <AnimatedButton
                        onClick={handleFinishTreatment}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-montserrat font-semibold text-sm flex items-center gap-2"
                        title="Selesaikan Treatment"
                      >
                        <img
                          src={Check}
                          alt="Check Icon"
                          className="w-4 h-4"
                        />
                        Selesai
                      </AnimatedButton>
                    </div>
                  ) : (
                    // Footer saat treatment belum dimulai
                    <AnimatedButton
                      onClick={handleStart}
                      className="w-full px-6 py-2.5 bg-[#57AEFF] text-white rounded-xl hover:bg-[#4499e9] transition-colors font-montserrat font-semibold text-sm"
                    >
                      Mulai Sekarang
                    </AnimatedButton>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirmation && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2 font-montserrat">
                Batalkan Treatment?
              </h3>
              <p className="text-sm text-gray-600 font-montserrat">
                Treatment akan kembali ke status antrian dan foto yang sudah diupload akan dihapus. Apakah Anda yakin?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelConfirmationClose}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-montserrat font-semibold text-sm"
              >
                Tidak
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-montserrat font-semibold text-sm"
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      <UploadPhotoModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSubmit={handlePhotoUploaded}
        status={uploadStatus}
      />
    </>
  );
};

export default TreatmentDetailModal;
