import { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import instance from "../../config/api";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import AntrianHeaderV2 from "../../components/Header Antrian/AntrianHeaderV2";
import AnimatedButton from "../../components/Design/AnimatedButton";
import TreatmentDetailModal from "../../components/Modal/TreatmentDetailModal";
import PhotoGalleryModal from "../../components/Modal/PhotoGalleryModal";
import TeknisiHistoryModal from "../../components/Modal/TeknisiHistoryModal";
import { getUserProfile } from "../../utils/userProfileHelper";
import { saveFilterToStorage, getFilterFromStorage, clearFilterFromStorage, FILTER_TYPES, COMPONENT_NAMES } from "../../utils/filterStorage";

const AntrianV2 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { treatment } = useParams();
  const { dateRange } = location.state || {};

  const [userData, setUserData] = useState(null);
  const [antrianTreatment, setAntrianTreatment] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [activeTreatments, setActiveTreatments] = useState({});
  const [intervals, setIntervals] = useState({});
  const [sortBy, setSortBy] = useState('due_date_asc');

  // Riwayat pengerjaan (item yang sudah `pengeringan` → hilang dari antrian)
  const [showHistoryModal, setShowHistoryModal] = useState(false);


  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const data = await getUserData();
        setUserData(data);
      } catch (error) {
        console.error('❌ AntrianV2 - Failed to load user data:', error);
      }
    };

    loadUserData();
  }, []);

  // Load saved search filter on component mount
  useEffect(() => {
    const savedSearch = getFilterFromStorage(COMPONENT_NAMES.ANTRIAN_TEKNISI, FILTER_TYPES.SEARCH);
    if (savedSearch) {
      setSearchQuery(savedSearch);
    }
  }, []);

  // Fungsi untuk memformat tanggal ke format database (YYYY-MM-DD)
  const formatDateForDB = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // Fungsi untuk mendapatkan user data dari API
  const getUserData = async () => {
    try {
      const profile = await getUserProfile();
      if (!profile) return null;

      // Extract data yang dibutuhkan dari profile
      const userData = {
        id: profile.user?.id,
        name: profile.user?.name,
        email: profile.user?.email,
        role: profile.user?.role,
        branch_id: profile.branch?.id,
        branch_name: profile.branch?.name,
        branch_address: profile.branch?.address,
        tenant_id: profile.tenant?.id,
        tenant_name: profile.tenant?.business_name
      };

      return userData;
    } catch (error) {
      console.error('[ERROR] AntrianV2 - Failed to get userData from API:', error);
      return null;
    }
  };

  // Fungsi untuk menghitung durasi dari status logs
  const calculateDurationFromStatusLogs = (statusLogs, currentUserId) => {
    if (!statusLogs || !Array.isArray(statusLogs) || !currentUserId) {
      return null;
    }


    // Cari log status on_progress yang dibuat oleh user yang sama
    const onProgressLog = statusLogs.find(log =>
      log.new_status === 'on_progress' &&
      log.updated_by === currentUserId
    );

    if (!onProgressLog) {
      return null;
    }


    const startTime = new Date(onProgressLog.created_at);
    const now = new Date();
    const durationInSeconds = Math.floor((now - startTime) / 1000);

    // Pastikan durasi tidak negatif
    if (durationInSeconds < 0) {
      return null;
    }


    return {
      isStarted: true,
      startTime: onProgressLog.created_at,
      duration: durationInSeconds
    };
  };

  // Fungsi untuk memulai timer berdasarkan status logs
  const startTimerFromStatusLogs = (treatmentId, statusLogs, currentUser) => {
    if (!currentUser) return;

    const timerData = calculateDurationFromStatusLogs(statusLogs, currentUser.id);
    if (!timerData) return;

    // Clear existing interval untuk treatment ini jika ada
    if (intervals[treatmentId]) {
      clearInterval(intervals[treatmentId]);
    }

    setActiveTreatments((prev) => ({
      ...prev,
      [treatmentId]: timerData,
    }));

    // Start interval untuk update durasi setiap detik
    const newInterval = setInterval(() => {
      setActiveTreatments((prev) => {
        const treatment = prev[treatmentId];
        if (!treatment) return prev;

        const start = new Date(treatment.startTime);
        const now = new Date();
        const duration = Math.floor((now - start) / 1000);

        // Pastikan durasi tidak negatif
        if (duration < 0) {
          return prev;
        }

        return {
          ...prev,
          [treatmentId]: {
            ...treatment,
            duration,
          },
        };
      });
    }, 1000);

    setIntervals((prev) => ({
      ...prev,
      [treatmentId]: newInterval,
    }));
  };

  // Fungsi untuk fetch data antrian
  const fetchAntrianData = async (isLoadMore = false, overridePageSize = null, overridePage = null) => {
    try {
      const userData = await getUserData();
      if (!userData) return;

      // Set loading state
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsInitialLoading(true);
      }


      const formattedStartDate = formatDateForDB(dateRange.startDate);
      const formattedEndDate = formatDateForDB(dateRange.endDate);

      // Build filterObj sesuai backend (range pakai gte/lte, single pakai string)
      let filterObj = {};
      if (formattedStartDate === formattedEndDate) {
        filterObj.entry_date = formattedStartDate;
      } else {
        filterObj.entry_date = { gte: formattedStartDate, lte: formattedEndDate };
      }
      // Status untuk teknisi: multi-value
      filterObj["order_details.status"] = ["not_yet", "antrian", "on_progress", "not_ready"];

      // Add search parameter if search query exists
      if (searchQuery && searchQuery.trim()) {
        filterObj.search = searchQuery.trim();
      }

      const params = {
        page: overridePage !== null ? overridePage : (isLoadMore ? currentPage + 1 : currentPage),
        pageSize: overridePageSize || 20,
        filter: JSON.stringify(filterObj),
      };

      // Add tenant_id and branch_id for data isolation
      if (userData?.tenant_id) {
        params.tenant_id = userData.tenant_id;
      }
      if (userData?.branch_id) {
        params.branch_id = userData.branch_id;
      }

      const response = await instance.get('/orders-new-raw', { params });

      if (response.data && response.data.data && Array.isArray(response.data.data.orders)) {
        const ordersArray = response.data.data.orders;
        const allTreatments = [];

        ordersArray.forEach((order) => {
          if (order.order_details && Array.isArray(order.order_details)) {
            order.order_details.forEach((detail) => {
              allTreatments.push({
                ...detail,
                order: order,
                customer: order.customer,
                payment: order.payment,
              });
            });
          }
        });

        // Filter by treatment if specified
        let filteredByTreatment = allTreatments;
        if (treatment && treatment !== 'semua') {
          // Convert treatment parameter back to original name
          const treatmentName = treatment.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          filteredByTreatment = allTreatments.filter((item) =>
            item.treatment?.name === treatmentName
          );
        } else {
        }


        // Handle pagination data
        const pagination = response.data.data.pagination;
        setHasNextPage(pagination.currentPage < pagination.totalPages);

        if (isLoadMore) {
          // Append new data to existing data
          const newData = [...antrianTreatment, ...filteredByTreatment];
          setAntrianTreatment(newData);
          setCurrentPage(prev => prev + 1);
          // Initialize timers for new data immediately
          setTimeout(() => {
            initializeTimersFromStatusLogs(newData);
          }, 100);
        } else {
          // Replace data for initial load or filter change
          setAntrianTreatment(filteredByTreatment);
          setCurrentPage(1);
          // Initialize timers immediately after setting data
          setTimeout(() => {
            initializeTimersFromStatusLogs(filteredByTreatment);
          }, 100);
        }
      } else {
        if (!isLoadMore) {
          setAntrianTreatment([]);
        }
        setHasNextPage(false);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      if (error.response?.status === 401) {
        console.error("Token tidak valid atau expired");
        navigate("/login");
      }
      if (!isLoadMore) {
        setAntrianTreatment([]);
      }
      setHasNextPage(false);
    } finally {
      setIsInitialLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Fungsi untuk load more data
  const loadMoreData = async () => {
    if (!hasNextPage || isLoadingMore) return;
    await fetchAntrianData(true);
  };

  useEffect(() => {
    if (showPhotoGallery) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showPhotoGallery]);



  // Save/clear search filter
  useEffect(() => {
    if (searchQuery.trim()) {
      saveFilterToStorage(COMPONENT_NAMES.ANTRIAN_TEKNISI, FILTER_TYPES.SEARCH, searchQuery, 24);
    } else {
      clearFilterFromStorage(COMPONENT_NAMES.ANTRIAN_TEKNISI, FILTER_TYPES.SEARCH);
    }
  }, [searchQuery]);

  // Effect untuk memuat timer saat mount dan setelah data treatment diambil
  useEffect(() => {
    if (antrianTreatment.length > 0 && userData) {
      initializeTimersFromStatusLogs();
    }
  }, [antrianTreatment, userData]);

  // Cleanup intervals saat unmount
  useEffect(() => {
    return () => {
      Object.values(intervals).forEach((interval) => clearInterval(interval));
    };
  }, [intervals]);

  // Fungsi untuk menginisialisasi timer dari status logs
  const initializeTimersFromStatusLogs = (treatmentsData = null) => {
    const currentUser = userData;
    if (!currentUser) {
      return;
    }

    // Use provided data or fallback to state
    const dataToProcess = treatmentsData || antrianTreatment;

    // Clear existing intervals
    Object.values(intervals).forEach((interval) => clearInterval(interval));
    setIntervals({});

    // Initialize timers for each treatment that has on_progress status
    dataToProcess.forEach((item) => {
      if (item.status === 'on_progress' && item.status_logs) {
        startTimerFromStatusLogs(item.id, item.status_logs, currentUser);
      }
    });
  };

  // Initial data load
  useEffect(() => {
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      // Reset pagination when date range or treatment changes
      setCurrentPage(1);
      setHasNextPage(false);
      fetchAntrianData();
    }
  }, [dateRange, treatment]);

  // Re-fetch semua data saat sort berubah
  useEffect(() => {
    if (!dateRange?.startDate || !dateRange?.endDate) return;
    setCurrentPage(1);
    setHasNextPage(false);
    setAntrianTreatment([]);
    fetchAntrianData(false, 1000, 1); // fetch semua, page 1
  }, [sortBy]);

  // Handle search
  const handleSearch = async () => {
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      // Reset pagination when search is triggered
      setCurrentPage(1);
      setHasNextPage(false);
      await fetchAntrianData();
    }
  };

  const getThumbnailUrl = (originalUrl) => {
    // Jika menggunakan Cloudinary
    if (originalUrl.includes("cloudinary")) {
      return originalUrl.replace("/upload/", "/upload/w_200,h_200,c_fill/");
    }
    // Jika menggunakan ImageKit
    if (originalUrl.includes("imagekit")) {
      return originalUrl + "?tr=w-200,h-200";
    }
    // Jika tidak menggunakan CDN, gunakan URL original
    return originalUrl;
  };

  // Fungsi untuk memformat durasi
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Fungsi untuk memulai treatment (tidak perlu mengubah status, hanya untuk UI)
  const handleStartTreatment = async (treatmentId) => {
    // Timer akan dimulai otomatis berdasarkan status logs
    // Tidak perlu melakukan apa-apa di sini karena timer sudah dihandle oleh initializeTimersFromStatusLogs
  };

  // Fungsi untuk membatalkan treatment
  const handleCancelTreatment = async (treatmentId) => {
    try {
      // Clear interval untuk treatment ini
      if (intervals[treatmentId]) {
        clearInterval(intervals[treatmentId]);
      }

      setActiveTreatments((prev) => {
        const newState = { ...prev };
        delete newState[treatmentId];
        return newState;
      });

      setIntervals((prev) => {
        const newState = { ...prev };
        delete newState[treatmentId];
        return newState;
      });
    } catch (error) {
      console.error("Error canceling treatment:", error);
    }
  };

  // Fungsi untuk refresh data setelah status berubah
  const handleFinish = async () => {
    // Reset pagination when refreshing data
    setCurrentPage(1);
    setHasNextPage(false);
    await fetchAntrianData();
  };

  // Update treatment card button section
  const renderTreatmentButton = (item) => {
    const activeTreatment = activeTreatments[item.id];
    const currentUser = userData;

    // Hide button if item is still waiting for pickup
    if (
      (item.status === 'not_yet' || item.status === 'antrian') &&
      item.delivery_status === 'scheduled' &&
      item.pickup_method === 'pickup'
    ) {
      return null;
    }

    // Jika status on_progress, cek apakah user yang sedang login yang memulai
    if (item.status === 'on_progress' && item.status_logs && currentUser) {
      const onProgressLog = item.status_logs.find(log =>
        log.new_status === 'on_progress' &&
        log.updated_by === currentUser.id
      );

      // Jika user yang sedang login yang memulai, tampilkan timer
      if (onProgressLog && activeTreatment?.isStarted) {
        return (
          <AnimatedButton
            onClick={() => {
              setSelectedTreatment(item);
              setShowTreatmentModal(true);
            }}
            className="w-full h-[35px] mb-auto mt-4 rounded-xl flex items-center justify-center text-sm font-semibold bg-[#E6EFF9] text-[#2E7CF6] opacity-100 p-4"
          >
            Selesaikan Pengerjaan ({formatDuration(activeTreatment.duration)})
          </AnimatedButton>
        );
      }

      // Jika bukan user yang sedang login yang memulai, tampilkan "Sedang dikerjakan"
      if (!onProgressLog) {
        return (
          <div className="w-full h-[35px] mb-auto mt-4 rounded-xl flex items-center justify-center text-sm font-semibold bg-gray-200 text-gray-600 opacity-100">
            Sedang dikerjakan
          </div>
        );
      }
    }

    // Untuk status not_yet/antrian/not_ready, tampilkan button mulai treatment
    if (!activeTreatment?.isStarted) {
      return (
        <AnimatedButton
          onClick={() => {
            setSelectedTreatment(item);
            setShowTreatmentModal(true);
          }}
          className="w-full h-[35px] mb-auto mt-4 rounded-xl flex items-center justify-center text-sm font-semibold bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] text-white opacity-100"
        >
          Mulai Layanan
        </AnimatedButton>
      );
    }

    return (
      <AnimatedButton
        onClick={() => {
          setSelectedTreatment(item);
          setShowTreatmentModal(true);
        }}
        className="w-full h-[35px] mb-auto mt-4 rounded-xl flex items-center justify-center text-sm font-semibold bg-[#E6EFF9] text-[#2E7CF6] opacity-100 p-4"
      >
        Selesaikan Pengerjaan ({formatDuration(activeTreatment.duration)})
      </AnimatedButton>
    );
  };

  const getSortedTreatments = () => {
    return [...antrianTreatment].sort((a, b) => {
      const getTime = (order) => new Date(order?.createdAt || order?.created_at || 0).getTime();

      switch (sortBy) {
        case 'due_date_asc': {
          const diff = new Date(a.due_date) - new Date(b.due_date);
          if (diff !== 0) return diff;
          return getTime(a.order) - getTime(b.order);
        }
        case 'due_date_desc': {
          const diff = new Date(b.due_date) - new Date(a.due_date);
          if (diff !== 0) return diff;
          return getTime(b.order) - getTime(a.order);
        }
        case 'entry_date_asc': {
          const diff = new Date(a.order?.entry_date) - new Date(b.order?.entry_date);
          if (diff !== 0) return diff;
          return getTime(a.order) - getTime(b.order);
        }
        case 'entry_date_desc': {
          const diff = new Date(b.order?.entry_date) - new Date(a.order?.entry_date);
          if (diff !== 0) return diff;
          return getTime(b.order) - getTime(a.order);
        }
        default: {
          const diff = new Date(a.due_date) - new Date(b.due_date);
          if (diff !== 0) return diff;
          return getTime(a.order) - getTime(b.order);
        }
      }
    });
  };


  return (
    <div className="h-screen overflow-y-auto bg-white font-montserrat">
      {/* Header - Fixed at top */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-white">
        <AntrianHeaderV2
          onSearch={handleSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          rightAction={
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-semibold hover:bg-blue-100 transition-colors"
              title="Riwayat pengerjaan"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Riwayat
            </button>
          }
        />
      </header>

      {/* Main Content - Dengan padding top yang disesuaikan */}
      <main className="mx-auto px-4 md:px-10 pt-[150px] pb-24 h-[100dvh] overflow-y-auto">
        <div className="max-w-[390px] md:max-w-none mx-auto">
          {/* Sort Bar */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs text-gray-500 font-montserrat font-medium">Urutkan:</span>
            {[
              { value: 'due_date_asc',    label: 'Tgl Selesai ↑' },
              { value: 'due_date_desc',   label: 'Tgl Selesai ↓' },
              { value: 'entry_date_asc',  label: 'Tgl Masuk ↑' },
              { value: 'entry_date_desc', label: 'Tgl Masuk ↓' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold font-montserrat transition-all ${
                  sortBy === opt.value
                    ? 'bg-[#2E7CF6] text-white'
                    : 'bg-[#E6EFF9] text-[#2E7CF6] hover:bg-[#65B7FF] hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Initial Loading */}

          {isInitialLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Memuat data...</span>
            </div>
          )}

          {/* Treatment Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {antrianTreatment.length > 0 ? (
              getSortedTreatments().map((item) => (

                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative"
                >
                  {/* Badge prioritas jika status not_ready */}
                  {item.status === 'not_ready' && (
                    <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                      Tidak Lolos QC
                    </div>
                  )}
                  {(item.status === 'not_yet' || item.status === 'antrian') && item.delivery_status === 'scheduled' && item.pickup_method === 'pickup' && (
                    <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                      Menunggu Pickup
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div
                      className="w-[100px] h-[100px] min-w-[100px] bg-gray-100 rounded-xl overflow-hidden cursor-pointer"
                      onClick={() => {
                        if (item.shoes_photos && item.shoes_photos.length > 0) {
                          setSelectedPhotos(item.shoes_photos);
                          setShowPhotoGallery(true);
                        }
                      }}
                    >
                      {item.shoes_photos && item.shoes_photos.length > 0 ? (
                        <img
                          src={getThumbnailUrl(item.shoes_photos[0].url_photo)}
                          alt="Shoes"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onLoad={() => setImageLoading(false)}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">
                            No Image
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate font-montserrat">
                        {item.order?.customer?.name || "No Name"}
                      </p>
                      {/* Droppoint Badge */}
                      {item.order?.branch_type === 'mitra' && item.order?.branch_name && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium text-purple-600 border border-purple-300 rounded-full bg-purple-50 truncate max-w-full">
                          📍 {item.order.branch_name}
                        </span>
                      )}
                      <p className="text-xs text-gray-500 truncate font-montserrat mt-0.5">
                        {item.item?.brand || "No Item"} (
                        {item.treatment?.name || "No Treatment"})
                      </p>
                      {item.description && (
                        <p className="text-xs md:text-sm text-gray-500 truncate mt-1">
                          ⮕ {item.description}
                        </p>
                      )}
                      
                      {/* Date labels */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 border border-gray-200 rounded-full">
                          <span className="text-[9px] text-gray-400 font-montserrat font-medium">Masuk</span>
                          <span className="text-[10px] text-gray-600 font-montserrat font-bold">
                            {item.order?.entry_date
                              ? format(new Date(item.order.entry_date + 'T00:00:00'), 'dd MMM yyyy', { locale: id })
                              : '-'}
                          </span>
                        </span>
                        <span className="text-gray-300 text-xs">→</span>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                          new Date(item.due_date) < new Date()
                            ? 'bg-red-50 border-red-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}>
                          <span className="text-[9px] text-gray-400 font-montserrat font-medium">Selesai</span>
                          <span className={`text-[10px] font-montserrat font-bold ${
                            new Date(item.due_date) < new Date() ? 'text-red-500' : 'text-blue-600'
                          }`}>
                            {item.due_date
                              ? format(new Date(item.due_date), 'dd MMM yyyy', { locale: id })
                              : '-'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  {renderTreatmentButton(item)}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                {searchQuery.trim() !== ""
                  ? "Tidak ada treatment yang sesuai dengan pencarian Anda"
                  : "Tidak ada antrian treatment"}
              </div>
            )}
          </div>

          {/* Load More Button */}
          {hasNextPage && !isInitialLoading && sortBy === 'due_date_asc' && (
            <div className="flex justify-center mt-6">
              <AnimatedButton
                onClick={loadMoreData}
                disabled={isLoadingMore}
                className="px-8 py-3 bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingMore ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memuat...
                  </div>
                ) : (
                  "Load More"
                )}
              </AnimatedButton>
            </div>
          )}
        </div>
      </main>

      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        isOpen={showPhotoGallery}
        onClose={() => {
          setShowPhotoGallery(false);
          setSelectedPhotos([]);
        }}
        photos={selectedPhotos}
        initialIndex={0}
      />

      <TreatmentDetailModal
        isOpen={showTreatmentModal}
        onClose={() => setShowTreatmentModal(false)}
        treatment={selectedTreatment?.treatment?.name}
        description={selectedTreatment?.description}
        brand={selectedTreatment?.item?.brand}
        color={selectedTreatment?.item?.color}
        shoesPhotos={selectedTreatment?.shoes_photos}
        treatmentId={selectedTreatment?.id}
        isStarted={activeTreatments[selectedTreatment?.id]?.isStarted}
        duration={activeTreatments[selectedTreatment?.id]?.duration || 0}
        onStart={handleStartTreatment}
        onCancel={handleCancelTreatment}
        onFinish={handleFinish}
        employee={selectedTreatment?.employee}
        dueDate={selectedTreatment?.due_date}
        processTime={selectedTreatment?.process_time}
        finalPrice={selectedTreatment?.final_price}
        customPriceReason={selectedTreatment?.custom_price_reason}
      />

      {/* Riwayat Pengerjaan Teknisi */}
      <TeknisiHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        dateRange={dateRange}
      />
    </div>
  );
};

export default AntrianV2;
