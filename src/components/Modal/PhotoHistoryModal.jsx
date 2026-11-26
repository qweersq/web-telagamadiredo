import React, { useState, useEffect } from 'react';
import { X, Camera, Wrench, CheckCircle, Loader } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import PhotoGalleryModal from './PhotoGalleryModal';
import instance from '../../config/api';
import { getPhotoUrl } from '../../utils/photoUrlHelper';

const PhotoHistoryModal = ({ isOpen, onClose, orderDetail }) => {
  const [showGallery, setShowGallery] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [photoData, setPhotoData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch photo history when modal opens
  useEffect(() => {
    const fetchPhotoHistory = async () => {
      if (!isOpen || !orderDetail?.id) return;
      
      setLoading(true);
      try {
        const response = await instance.get(`/order-details/${orderDetail.id}/photo-history`);
        if (response.data && response.data.success) {
          const data = response.data.data;
          
          // Transform all photo URLs to include base URL
          const transformedData = {
            ...data,
            shoes_photos: data.shoes_photos?.map(p => ({
              ...p,
              url_photo: getPhotoUrl(p.url_photo)
            })) || [],
            status_logs: data.status_logs?.map(log => ({
              ...log,
              photos: log.photos?.map(p => ({
                ...p,
                url_photo: getPhotoUrl(p.url_photo)
              })) || []
            })) || []
          };
          
          setPhotoData(transformedData);
        }
      } catch (error) {
        console.error('Error fetching photo history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotoHistory();
  }, [isOpen, orderDetail?.id]);

  if (!isOpen) return null;

  // Extract photos from API response
  const initialPhotos = photoData?.shoes_photos || [];
  
  // Extract photos from status logs - GET ALL logs with photos
  const statusLogs = photoData?.status_logs || [];
  const logsWithPhotos = statusLogs.filter(log => log.photos && log.photos.length > 0);
  
  // Helper function to get label & icon for status transition
  const getStatusLabel = (log) => {
    if (log.old_status === 'not_yet' && log.new_status === 'antrian') {
      return { label: 'Penjemputan', icon: Camera, color: 'border-purple-400' };
    } else if (log.old_status === 'antrian' && log.new_status === 'on_progress') {
      return { label: 'Sebelum Dikerjakan', icon: Wrench, color: 'border-yellow-400' };
    } else if (log.old_status === 'on_progress' && log.new_status === 'pengeringan') {
      return { label: 'Setelah Dikerjakan', icon: CheckCircle, color: 'border-green-400' };
    } else if (log.new_status === 'not_ready') {
      return { label: 'Tidak Lolos QC', icon: Camera, color: 'border-red-400' };
    } else if (log.new_status === 'siap') {
      return { label: 'Lolos QC', icon: CheckCircle, color: 'border-blue-400' };
    } else if (log.old_status === 'siap_dikirim' && log.new_status === 'done') {
      return { label: 'Selesai Antar', icon: CheckCircle, color: 'border-green-500' };
    } else {
      return { label: `Status: ${log.old_status || ''} → ${log.new_status}`, icon: Camera, color: 'border-gray-400' };
    }
  };

  const handlePhotoClick = (photos, index = 0) => {
    setSelectedPhotos(photos);
    setSelectedIndex(index);
    setShowGallery(true);
  };

  const PhotoSection = ({ icon: Icon, title, photos, userName, timestamp, color }) => {
    if (!photos || photos.length === 0) return null;

    return (
      <div className="mb-6 last:mb-0">
        {/* Section Header */}
        <div className={`flex items-center gap-2 mb-3 pb-2 border-b-2 ${color}`}>
          <Icon className="w-5 h-5" />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          {photos.slice(0, 6).map((photo, index) => (
            <button
              key={index}
              onClick={() => handlePhotoClick(photos, index)}
              className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all duration-200 hover:scale-105"
            >
              <img
                src={photo.url_photo}
                alt={`${title} ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className="font-medium">
            {userName ? `By: ${userName}` : 'Sistem'}
          </span>
          {timestamp && (
            <span>
              {format(new Date(timestamp), 'dd MMM yyyy, HH:mm', { locale: id })}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Main Modal */}
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-800 font-montserrat">
                History Foto
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {orderDetail?.item?.name} - {orderDetail?.treatment?.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div 
            className="flex-1 overflow-y-auto p-4"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}
          >
            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                <p className="text-sm text-gray-500">Memuat foto...</p>
              </div>
            )}

            {/* Content */}
            {!loading && (
              <>
                {/* Foto Awal */}
                <PhotoSection
                  icon={Camera}
                  title="Foto Awal (Input)"
                  photos={initialPhotos}
                  userName={photoData?.employee_name}
                  timestamp={photoData?.created_at}
                  color="border-purple-400"
                />

                {/* Status Logs Photos - Loop ALL logs with photos */}
                {logsWithPhotos.map((log, index) => {
                  const { label, icon, color } = getStatusLabel(log);
                  return (
                    <PhotoSection
                      key={`${log.id}-${index}`}
                      icon={icon}
                      title={label}
                      photos={log.photos}
                      userName={log.updated_by_name}
                      timestamp={log.created_at}
                      color={color}
                    />
                  );
                })}

                {/* Empty State */}
                {initialPhotos.length === 0 && logsWithPhotos.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Belum ada foto yang tersedia</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Photo Gallery Modal (Nested) */}
      <PhotoGalleryModal
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        photos={selectedPhotos}
        initialIndex={selectedIndex}
      />
    </>
  );
};

export default PhotoHistoryModal;

