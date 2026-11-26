import React, { useState, useEffect } from 'react';
import AnimatedButton from '../Design/AnimatedButton';
import InfoModal from '../Modal/InfoModal';
import PhotoGalleryModal from '../Modal/PhotoGalleryModal';
import dayjs from 'dayjs';


const TreatmentQueueV2 = ({ orders, onOpenQueue, onTreatmentClick }) => {
  const [treatmentGroups, setTreatmentGroups] = useState([]);
  const [totalQueue, setTotalQueue] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [displayedTreatments, setDisplayedTreatments] = useState([]);
  const [showTooltipModal, setShowTooltipModal] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);

  const openGallery = (photos, startIndex = 0) => {
    setGalleryPhotos(photos);
    setGalleryInitialIndex(startIndex);
    setShowGallery(true);
  };


  const handleTreatmentClick = (treatment) => {
    if (!orders || !Array.isArray(orders)) return;

    const ACTIVE_STATUSES = ['not_yet', 'antrian', 'on_progress', 'not_ready'];
    const items = [];
    orders.forEach(order => {
      const matchingDetails = (order.order_details || []).filter(
        detail => 
          detail.treatment?.id === treatment.id && 
          ACTIVE_STATUSES.includes(detail.status)
      );
      
      if (matchingDetails.length > 0) {
        items.push({
          orderId: order.id,
          customerName: order.customer?.name || 'Unknown',
          customerPhone: order.customer?.phone || '',
          entryDate: order.entry_date || null,
          dueDate: matchingDetails[0]?.due_date || null,
          details: matchingDetails.map(d => ({ 
            id: d.id,
            status: d.status,
            processTime: d.process_time,
            photos: Array.isArray(d.shoes_photos)
              ? d.shoes_photos.filter(p => p?.url_photo)
              : []
          }))
        });
      } 
    });
    setSelectedTreatment({ treatment, items });
  };



  // Group orders by treatment and count
  useEffect(() => {
    if (!orders || !Array.isArray(orders)) {
      setTreatmentGroups([]);
      setTotalQueue(0);
      return;
    }

    // Create a map to group by treatment_id
    const treatmentMap = new Map();
    let totalCount = 0;

    orders.forEach(order => {
      if (order.order_details && Array.isArray(order.order_details)) {
        order.order_details.forEach(detail => {
          if (detail.treatment) {
            const treatmentId = detail.treatment.id;
            const treatmentName = detail.treatment.name;
            const treatmentType = detail.treatment.type_service || 'Unknown';
            
            if (treatmentMap.has(treatmentId)) {
              treatmentMap.get(treatmentId).count += 1;
            } else {
              treatmentMap.set(treatmentId, {
                id: treatmentId,
                name: treatmentName,
                type: treatmentType,
                count: 1
              });
            }
            totalCount += 1;
          }
        });
      }
    });

    // Convert map to array and sort by count (descending)
    const sortedTreatments = Array.from(treatmentMap.values())
      .sort((a, b) => b.count - a.count);

    setTreatmentGroups(sortedTreatments);
    setTotalQueue(totalCount);
  }, [orders]);

  // Update displayed treatments based on showAll state
  useEffect(() => {
    if (showAll) {
      setDisplayedTreatments(treatmentGroups);
    } else {
      setDisplayedTreatments(treatmentGroups.slice(0, 5));
    }
  }, [treatmentGroups, showAll]);

  return (
    <div className="mb-2 rounded-3xl p-4 mt-4 outline outline-2 outline-[#EEF1F7]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold font-montserrat">
            Antrian Item
          </h2>
          <button
            onClick={() => setShowTooltipModal(true)}
            className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </button>
        </div>
        <AnimatedButton
          onClick={onOpenQueue}
          className="h-[35px] px-4 py-2 flex items-center justify-center rounded-xl font-['Montserrat'] font-semibold transition-all bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] text-white hover:from-[#4088EB] hover:to-[#6BC1ED] shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
        >
          Lihat Antrian
        </AnimatedButton>
      </div>

      {/* Treatment Groups */}
      <div className="space-y-3 mb-4">
        {displayedTreatments.length > 0 ? (
          displayedTreatments.map((treatment, index) => (
            <div
              key={treatment.id}
              className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
              onClick={() => handleTreatmentClick(treatment)}
              role="button"
            >

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm font-['Montserrat']">
                    {treatment.name}
                  </h3>
                  <p className="text-xs text-gray-500 font-['Montserrat']">
                    {treatment.count} antrian
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-lg font-semibold font-bold text-blue-600 font-['Montserrat']">
                    {treatment.count}
                  </p>
                  <p className="text-xs text-gray-400 font-['Montserrat']">
                    items
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 font-['Montserrat']">
            <p>Tidak ada treatment yang perlu dicek</p>
          </div>
        )}
      </div>

      {/* Load More Button */}
      {treatmentGroups.length > 5 && (
        <div className="mb-4">
          <AnimatedButton
            onClick={() => setShowAll(!showAll)}
            className="w-full h-[35px] py-2 flex items-center justify-center rounded-xl font-['Montserrat'] font-semibold transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
          >
            {showAll ? 'Tampilkan Lebih Sedikit' : `Tampilkan Semua (${treatmentGroups.length})`}
          </AnimatedButton>
        </div>
      )}

      {/* Total antrian */}
      <div className="mt-4 text-center outline outline-2 outline-[#EEF1F7] rounded-3xl p-3">
        <p className="text-sm text-gray-600 font-['Montserrat']">
          Total Antrian: <span className="font-bold text-blue-600">{totalQueue}</span>
        </p>
      </div>

      {/* Info Modal */}
      <InfoModal
        isOpen={showTooltipModal}
        onClose={() => setShowTooltipModal(false)}
        title="Status Antrian Item"
        items={[
          {
            title: "Penjelasan Antrian",
            description: "Menampilkan semua item dengan status 'Antrian', 'Proses', dan 'Pengeringan'. Item akan otomatis berpindah status sesuai progress pengerjaan.",
            bgColor: "bg-blue-50",
            dotColor: "bg-blue-500",
            titleColor: "text-blue-700"
          },
          {
            title: "Workflow",
            description: "Status akan otomatis berubah: Antrian → Proses → Pengeringan",
            bgColor: "bg-gray-50",
            dotColor: "bg-gray-500",
            titleColor: "text-gray-700"
          }
        ]}
        footerInfo={{
          icon: "📸",
          text: "Foto Before & After tersedia untuk setiap item"
        }}
        maxWidth="max-w-lg"
      />

      {/* Treatment Detail Modal */}
      {selectedTreatment && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedTreatment(null)}
        > 
          <div
            className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          > 
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 font-montserrat leading-tight">
                    {selectedTreatment.treatment.name}
                  </h3>
                  <p className="text-xs text-gray-400 font-montserrat font-medium mt-0.5">
                    {selectedTreatment.items.length} customer antri
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTreatment(null)}
                className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {selectedTreatment.items.length > 0 ? (
                selectedTreatment.items.map((item, idx) => {
                  // Get dominant status (most frequent)
                  const statusCounts = item.details.reduce((acc, d) => {
                    acc[d.status] = (acc[d.status] || 0) + 1;
                    return acc;
                  }, {});
                  const dominantStatus = Object.keys(statusCounts).reduce((a, b) => statusCounts[a] > statusCounts[b] ? a : b);

                  const statusLabels = {
                    not_yet: { label: 'Menunggu', color: 'text-gray-500 bg-gray-50' },
                    antrian: { label: 'Antrian', color: 'text-blue-600 bg-blue-50' },
                    on_progress: { label: 'Proses', color: 'text-orange-600 bg-orange-50' },
                    not_ready: { label: 'Tidak Lolos QC', color: 'text-red-600 bg-red-50' }
                  };

                  const currentStatus = statusLabels[dominantStatus] || { label: dominantStatus, color: 'text-gray-500 bg-gray-50' };

                  return (
                    <div key={idx} className="flex flex-col gap-1 p-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-black text-gray-800 font-montserrat text-sm">
                            {idx + 1}. {item.customerName}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-montserrat font-medium mb-1">
                            {item.customerPhone}
                          </p>
                          {/* Date chips */}
                          {(item.entryDate || item.dueDate) && (
                            <div className="flex items-center gap-1.5 mt-1 mb-1 flex-wrap">
                              {item.entryDate && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 border border-gray-200 rounded-full">
                                  <span className="text-[9px] text-gray-400 font-['Montserrat']">Masuk</span>
                                  <span className="text-[10px] text-gray-600 font-['Montserrat'] font-bold">
                                    {dayjs(item.entryDate).format('D MMM YYYY')}
                                  </span>
                                </span>
                              )}
                              {item.dueDate && (
                                <>
                                  <span className="text-gray-300 text-[10px]">→</span>
                                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${dayjs(item.dueDate).isBefore(dayjs(), 'day')
                                      ? 'bg-red-50 border-red-200'
                                      : 'bg-blue-50 border-blue-200'
                                    }`}>
                                    <span className="text-[9px] text-gray-400 font-['Montserrat']">Selesai</span>
                                    <span className={`text-[10px] font-['Montserrat'] font-bold ${dayjs(item.dueDate).isBefore(dayjs(), 'day') ? 'text-red-500' : 'text-blue-600'
                                      }`}>
                                      {dayjs(item.dueDate).format('D MMM YYYY')}
                                    </span>
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${currentStatus.color}`}>
                          {currentStatus.label}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-gray-500 font-montserrat bg-gray-100 px-2 py-0.5 rounded-md">
                          {item.details.length} item
                        </span>
                        {item.details.some(d => d.processTime === 'same_day') && (
                          <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md animate-pulse">
                            KILAT
                          </span>
                        )}
                      </div>

                      {/* Photo thumbnails */}
                      {(() => {
                        // Gabungkan semua foto dari semua details customer ini
                        const allPhotos = item.details.flatMap(d => d.photos || []);
                        if (allPhotos.length === 0) return null;
                        return (
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {allPhotos.slice(0, 4).map((photo, photoIdx) => (
                              <button
                                key={photoIdx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openGallery(allPhotos, photoIdx);
                                }}
                                className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 hover:border-blue-300 transition-all hover:scale-105 active:scale-95"
                              >
                                <img
                                  src={photo.url_photo}
                                  alt={`foto ${photoIdx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                            {allPhotos.length > 4 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openGallery(allPhotos, 4);
                                }}
                                className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 hover:bg-gray-200 transition-all"
                              >
                                +{allPhotos.length - 4}
                              </button>
                            )}
                          </div>
                        );
                      })()}

                      <div className="h-[1px] bg-gray-50 w-full mt-3" />

                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 opacity-40">
                  <p className="font-montserrat text-sm font-medium">Data tidak ditemukan</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 bg-gray-50 flex justify-center">
              <button 
                onClick={() => setSelectedTreatment(null)}
                className="w-full py-3 bg-white border border-gray-200 rounded-2xl text-sm font-black text-gray-700 font-montserrat hover:bg-gray-100 transition-all shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <PhotoGalleryModal
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        photos={galleryPhotos}
        initialIndex={galleryInitialIndex}
      />
    </div>


  );
};

export default TreatmentQueueV2;
