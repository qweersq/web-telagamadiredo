import React, { useState } from 'react';
import { X, Clock, CheckCircle, AlertCircle, Loader2, User } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import PhotoGalleryModal from '../../../../components/Modal/PhotoGalleryModal';
import { getPhotoUrl } from '../../../../utils/photoUrlHelper';
import { formatOrderDetailStatus, getOrderDetailStatusColors } from '../../../../utils/labelFormatter';

const StatusHistoryModal = ({ 
  isOpen, 
  onClose, 
  orderDetailId, 
  statusHistory, 
  loading, 
  error 
}) => {
  // State untuk modal foto galeri
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  if (!isOpen) return null;

  // Handler untuk membuka modal foto galeri
  const handleOpenPhotoGallery = (photos, initialIndex = 0) => {
    // Transform photos to match PhotoGalleryModal format
    const transformedPhotos = photos.map(photo => ({
      url_photo: getPhotoUrl(photo.photo_url)
    }));
    setSelectedPhotos(transformedPhotos);
    setSelectedPhotoIndex(initialIndex);
    setShowPhotoGallery(true);
  };

  const handleClosePhotoGallery = (e) => {
    // Prevent event bubbling to parent modal
    if (e) {
      e.stopPropagation();
    }
    setShowPhotoGallery(false);
    setSelectedPhotos([]);
    setSelectedPhotoIndex(0);
  };

  const getStatusIcon = (status) => {
    if (!status) return <AlertCircle className="w-5 h-5 text-orange-500" />;
    switch (status.toLowerCase()) {
      case 'done':
      case 'selesai':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'siap':
      case 'siap_diambil':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'siap_dikirim':
        return <CheckCircle className="w-5 h-5 text-purple-500" />;
      case 'on_progress':
      case 'pengeringan':
        return <Loader2 className="w-5 h-5 text-telaga-500 animate-spin" />;
      case 'not_yet':
      case 'antrian':
        return <Clock className="w-5 h-5 text-gray-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
    }
  };


  const formatDateTime = (dateString) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy 'pukul' HH:mm", { locale: id });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-xl animate-fadeInUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="font-montserrat font-bold text-xl text-gray-800">Riwayat Status Item</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-telaga-500 animate-spin" />
              <span className="ml-2 font-montserrat text-gray-600">Memuat riwayat...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <span className="ml-2 font-montserrat text-red-600">Gagal memuat riwayat</span>
            </div>
          ) : statusHistory && statusHistory.length > 0 ? (
            <div className="space-y-4">
              {statusHistory.map((log, index) => (
                <div key={log.id} className="relative">
                  {/* Timeline line */}
                  {index < statusHistory.length - 1 && (
                    <div className="absolute left-6 top-8 w-0.5 h-12 bg-gray-200"></div>
                  )}
                  
                  <div className="flex items-start space-x-4">
                    {/* Status icon */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                      {getStatusIcon(log.new_status)}
                    </div>
                    
                                         {/* Content */}
                     <div className="flex-1 min-w-0">
                      {/* Status change info */}
                      {log.old_status && log.old_status !== log.new_status ? (
                        <div className="mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getOrderDetailStatusColors(log.old_status)}`}>
                              {formatOrderDetailStatus(log.old_status)}
                            </span>
                            <span className="text-gray-400 text-xs">→</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getOrderDetailStatusColors(log.new_status)}`}>
                              {formatOrderDetailStatus(log.new_status)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getOrderDetailStatusColors(log.new_status)} mb-2`}>
                          {formatOrderDetailStatus(log.new_status)}
                        </div>
                      )}
                       
                                                <p className="text-sm text-gray-600 font-montserrat">
                           {formatDateTime(log.created_at)}
                         </p>
                       
                       {/* Status updater info */}
                       {log.status_updater ? (
                         <div className="mt-2">
                           <div className="flex items-center gap-1">
                             <User className="w-3 h-3 text-gray-400" />
                             <span className="text-xs text-gray-500 font-montserrat">Diperbarui oleh:</span>
                             <span className="text-xs font-semibold text-telaga-600 font-montserrat">
                               {log.status_updater.name}
                             </span>
                           </div>
                         </div>
                       ) : log.updated_by ? (
                         <div className="mt-2">
                           <div className="flex items-center gap-1">
                             <User className="w-3 h-3 text-gray-400" />
                             <span className="text-xs text-gray-500 font-montserrat">Diperbarui oleh:</span>
                             <span className="text-xs font-semibold text-telaga-600 font-montserrat">
                               User ID: {log.updated_by}
                             </span>
                           </div>
                         </div>
                       ) : null}
                      
                                             {/* Photos */}
                       {log.item_status_photos && log.item_status_photos.length > 0 && (
                         <div className="mt-3 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-500 font-montserrat mb-2">Foto status:</p>
                          <div className="flex flex-wrap gap-2">
                            {log.item_status_photos.map((photo, photoIndex) => (
                              <div key={photo.id} className="relative">
                                <img
                                  src={getPhotoUrl(photo.photo_url)}
                                  alt="Status photo"
                                  className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:scale-105 transition-transform duration-200 hover:shadow-md"
                                  onClick={() => handleOpenPhotoGallery(log.item_status_photos, photoIndex)}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mb-3" />
              <p className="font-montserrat text-gray-600 text-center">
                Belum ada riwayat status
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-telaga-600 text-white rounded-xl font-semibold font-montserrat hover:bg-telaga-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        isOpen={showPhotoGallery}
        onClose={handleClosePhotoGallery}
        photos={selectedPhotos}
        initialIndex={selectedPhotoIndex}
      />
    </div>
  );
};

export default StatusHistoryModal; 