import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import instance from "../../config/api";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import AntrianHeader from "../../components/Header Antrian/AntrianHeader";
import FilterAndSearch from "../../components/Header Antrian/FilterAndSearch";
import AnimatedButton from "../../components/Design/AnimatedButton";
import TreatmentDetailModal from "../../components/Modal/TreatmentDetailModal";
import { getUserProfile } from "../../utils/userProfileHelper";
import { saveFilterToStorage, getFilterFromStorage, clearFilterFromStorage, FILTER_TYPES, COMPONENT_NAMES } from "../../utils/filterStorage";

const Antrian = () => {
  const navigate = useNavigate();
  const { estimasi } = useParams();
  const location = useLocation();
  const { dateRange } = location.state || {};
  const { antrianData: antrianFromState } = location.state || {};

  const [userData, setUserData] = useState(null);
  const [antrianTreatment, setAntrianTreatment] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("cleaning");
  const [cleaningCount, setCleaningCount] = useState(0);
  const [repairCount, setRepairCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filteredTreatments, setFilteredTreatments] = useState([]);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [activeTreatments, setActiveTreatments] = useState({});
  const [intervals, setIntervals] = useState({});
  const [countRegular, setCountRegular] = useState(0);
  const [countSameDay, setCountSameDay] = useState(0);
  const [countNextDay, setCountNextDay] = useState(0);
  const [countRegularCleaning, setCountRegularCleaning] = useState(0);
  const [countRegularRepair, setCountRegularRepair] = useState(0);
  const [countSameDayCleaning, setCountSameDayCleaning] = useState(0);
  const [countSameDayRepair, setCountSameDayRepair] = useState(0);
  const [countNextDayCleaning, setCountNextDayCleaning] = useState(0);
  const [countNextDayRepair, setCountNextDayRepair] = useState(0);

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
      
      const userData = {
        id: profile.user?.id,
        name: profile.user?.name,
        email: profile.user?.email,
        role: profile.user?.role,
        branch_id: profile.branch?.id,
        branch_name: profile.branch?.name,
        tenant_id: profile.tenant?.id,
        tenant_name: profile.tenant?.business_name
      };
      
      // Untuk role admin dan employee, gunakan data asli dari login
      // Untuk superadmin, gunakan data yang mungkin sudah diupdate dengan branch selection
      if (userData.role === 'admin' || userData.role === 'employee') {
        // Kembalikan data asli dari login (tidak ada selected_role atau branch yang dipilih)
        return {
          ...userData,
          // Pastikan tidak ada data branch yang dipilih
          selected_role: undefined,
          branch_name: undefined,
          branch_address: undefined
        };
      }
      
      // Untuk superadmin dan role lainnya, gunakan data yang ada
      return userData;
    } catch (error) {
      console.error('Error parsing userData:', error);
      return null;
    }
  };

  // Fungsi untuk menghitung durasi dari status logs
  const calculateDurationFromStatusLogs = (statusLogs, currentUserId) => {
    if (!statusLogs || !Array.isArray(statusLogs) || !currentUserId) {
      console.log('Invalid input for calculateDurationFromStatusLogs:', { statusLogs, currentUserId });
      return null;
    }

    console.log('Calculating duration for user:', currentUserId, 'with status_logs:', statusLogs);

    // Cari log status on_progress yang dibuat oleh user yang sama
    const onProgressLog = statusLogs.find(log => 
      log.new_status === 'on_progress' && 
      log.updated_by === currentUserId
    );

    if (!onProgressLog) {
      console.log('No on_progress log found for user:', currentUserId);
      return null;
    }

    console.log('Found on_progress log:', onProgressLog);

    const startTime = new Date(onProgressLog.created_at);
    const now = new Date();
    const durationInSeconds = Math.floor((now - startTime) / 1000);

    // Pastikan durasi tidak negatif
    if (durationInSeconds < 0) {
      console.log('Duration is negative:', durationInSeconds);
      return null;
    }

    console.log('Calculated duration:', durationInSeconds, 'seconds');

    return {
      isStarted: true,
      startTime: onProgressLog.created_at,
      duration: durationInSeconds
    };
  };

  // Fungsi untuk memulai timer berdasarkan status logs
  const startTimerFromStatusLogs = (treatmentId, statusLogs) => {
    const currentUser = getUserData();
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

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showModal]);

  // Load saved search filter on component mount
  useEffect(() => {
    const savedSearch = getFilterFromStorage(COMPONENT_NAMES.ANTRIAN_TEKNISI, FILTER_TYPES.SEARCH);
    if (savedSearch) {
      console.log('Antrian.jsx - Loaded saved search:', savedSearch);
      setSearchQuery(savedSearch);
      setDebouncedSearch(savedSearch);
    }
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter data berdasarkan pencarian
  useEffect(() => {
    if (debouncedSearch.trim() === "") {
      // If search is cleared, reset filteredTreatments to show all fetched data
      setFilteredTreatments(antrianTreatment);
      // Clear saved search filter
      clearFilterFromStorage(COMPONENT_NAMES.ANTRIAN_TEKNISI, FILTER_TYPES.SEARCH);
    } else {
      // If there's a search query, filter the already fetched antrianTreatment
      const searchLower = debouncedSearch.toLowerCase();
      const filtered = antrianTreatment.filter(
        (item) =>
          item.order?.customer?.name?.toLowerCase().includes(searchLower) ||
          item.treatment?.name?.toLowerCase().includes(searchLower)
      );
      setFilteredTreatments(filtered);
      // Save search filter
      saveFilterToStorage(COMPONENT_NAMES.ANTRIAN_TEKNISI, FILTER_TYPES.SEARCH, debouncedSearch, 24);
    }
  }, [debouncedSearch, antrianTreatment]);

  // Effect untuk memuat timer saat mount dan setelah data treatment diambil
  useEffect(() => {
    if (filteredTreatments.length > 0) {
      initializeTimersFromStatusLogs();
    }
  }, [filteredTreatments]);

  // Cleanup intervals saat unmount
  useEffect(() => {
    return () => {
      Object.values(intervals).forEach((interval) => clearInterval(interval));
    };
  }, [intervals]);

  // Fungsi untuk menginisialisasi timer dari status logs
  const initializeTimersFromStatusLogs = () => {
    const currentUser = getUserData();
    if (!currentUser) {
      console.log('User data tidak ditemukan');
      return;
    }

    console.log('Initializing timers for user:', currentUser.id);

    // Clear existing intervals
    Object.values(intervals).forEach((interval) => clearInterval(interval));
    setIntervals({});

    // Initialize timers for each treatment that has on_progress status
    filteredTreatments.forEach((item) => {
      if (item.status === 'on_progress' && item.status_logs) {
        console.log('Found on_progress treatment:', item.id, 'with status_logs:', item.status_logs);
        startTimerFromStatusLogs(item.id, item.status_logs);
      }
    });
  };

  const fetchAntrianData = async () => {
    try {
      const userData = getUserData();
      console.log('Antrian.jsx - userData:', userData);
      console.log('Antrian.jsx - tenant_id:', userData?.tenant_id);
      console.log('Antrian.jsx - branch_id:', userData?.branch_id);
      
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

      const params = {
        page: 1,
        pageSize: 1000,
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
      // console.log('Request Params:', params);
      // console.log('Response:', response.data);

      if (response.data && response.data.data && Array.isArray(response.data.data.orders)) {
        const ordersArray = response.data.data.orders;
        // Flatten order_details into a single array of treatments for easier filtering
        const allTreatments = ordersArray.flatMap((order) => {
          const orderDetails = Array.isArray(order?.order_details)
            ? order.order_details
            : [];
          return orderDetails.map((detail) => ({
            ...detail,
            order: {
              customer: order.customer,
              id: order.id,
              entry_date: order.entry_date,
            },
          }));
        });

        // Filter by estimasi (process_time) saja, status sudah di-backend
        const processTimeMap = {
          regular: "regular",
          sameDay: "same_day",
          nextDay: "next_day",
        };
        const currentProcessTime = processTimeMap[estimasi];
        let initialFilteredData = allTreatments.filter(
          (item) => item.process_time?.toLowerCase() === currentProcessTime
        );

        // Apply search query filter directly here as well
        if (searchQuery.trim() !== "") {
          const searchLower = searchQuery.toLowerCase();
          initialFilteredData = initialFilteredData.filter(
            (item) =>
              item.order?.customer?.name?.toLowerCase().includes(searchLower) ||
              item.treatment?.name?.toLowerCase().includes(searchLower)
          );
        }

        setAntrianTreatment(initialFilteredData); // Set this as the base data
        setFilteredTreatments(initialFilteredData); // Initial display data
      } else {
        setAntrianTreatment([]);
        setFilteredTreatments([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      if (error.response?.status === 401) {
        console.error("Token tidak valid atau expired");
        navigate("/login");
      }
      setAntrianTreatment([]);
      setCountNextDayRepair(0);
    }
  };

  // Initial data load or refetch when dateRange/estimasi/debouncedSearch changes
  useEffect(() => {
    // Removed antrianFromState logic here, always fetch if dateRange is available
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      fetchAntrianData();
    }
  }, [dateRange, estimasi, searchQuery]); // Added estimasi and searchQuery to dependencies

  // useEffect to apply cleaning/repair filter on top of the already fetched and filtered data
  useEffect(() => {
    // Define categories for cleaning and repair based on keywords in treatment name
    const cleaningKeywords = ["clean", "cuci", "deep"];
    const repairKeywords = ["reglue", "repaint", "un-yellowing", "karet", "insole", "repair", "ganti"];

    const isCleaning = (treatmentName) => {
      if (!treatmentName) return false;
      const name = treatmentName.toLowerCase();
      return cleaningKeywords.some((kw) => name.includes(kw));
    };
    const isRepair = (treatmentName) => {
      if (!treatmentName) return false;
      const name = treatmentName.toLowerCase();
      return repairKeywords.some((kw) => name.includes(kw));
    };

    let dataToFilter = antrianTreatment; // Start with the data already filtered by status and estimasi

    let finalDisplayData = [];
    if (selectedFilter === "cleaning") {
      finalDisplayData = dataToFilter.filter((item) =>
        isCleaning(item.treatment?.name)
      );
    } else if (selectedFilter === "repair") {
      finalDisplayData = dataToFilter.filter((item) =>
        isRepair(item.treatment?.name)
      );
    } else {
      finalDisplayData = dataToFilter; // If "all" or other, show all from antrianTreatment
    }

    setFilteredTreatments(finalDisplayData);

    // Update cleaningCount and repairCount based on the data filtered by estimasi (antrianTreatment)
    setCleaningCount(
      antrianTreatment.filter((item) =>
        isCleaning(item.treatment?.name)
      ).length
    );
    setRepairCount(
      antrianTreatment.filter((item) => isRepair(item.treatment?.name))
        .length
    );

    // Update overall counts for regular, same day, next day from antrianTreatment (base data)
    setCountRegular(
      antrianTreatment.filter(
        (item) => item.process_time?.toLowerCase() === "regular"
      ).length
    );
    setCountSameDay(
      antrianTreatment.filter(
        (item) => item.process_time?.toLowerCase() === "same_day"
      ).length
    );
    setCountNextDay(
      antrianTreatment.filter(
        (item) => item.process_time?.toLowerCase() === "next_day"
      ).length
    );
  }, [antrianTreatment, selectedFilter]); // Dependencies changed

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    // fetchAntrianData will be triggered by useEffect
  };

  const handleLogout = async () => {
    try {
      // Clear all intervals
      Object.values(intervals).forEach((interval) => clearInterval(interval));
      setIntervals({});
      setActiveTreatments({});

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
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
    await fetchAntrianData();
  };

  // Update treatment card button section
  const renderTreatmentButton = (item) => {
    const activeTreatment = activeTreatments[item.id];
    const currentUser = getUserData();

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
            Cek Detail Layanan ({formatDuration(activeTreatment.duration)})
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
          Mulai Treatment
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
        Cek Detail Layanan ({formatDuration(activeTreatment.duration)})
      </AnimatedButton>
    );
  };

  return (
    <div className="h-screen overflow-y-auto bg-white font-montserrat">
      {/* Header - Fixed at top */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-white">
        {/* <AntrianHeader /> */}
        <FilterAndSearch
          estimasi={estimasi}
          selectedFilter={selectedFilter}
          handleFilterChange={handleFilterChange}
          cleaningCount={cleaningCount}
          repairCount={repairCount}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </header>

      {/* Main Content - Dengan padding top yang disesuaikan */}
      <main className="mx-auto px-4 md:px-10 pt-[220px] pb-24 h-[100dvh] overflow-y-auto">
        <div className="max-w-[390px] md:max-w-none mx-auto">
          {/* Treatment Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTreatments.length > 0 ? (
              filteredTreatments.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-4 opacity-100 outline outline-1 outline-[#C1C1C1] relative"
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
                      className="w-[100px] h-[100px] min-w-[100px] bg-gray-200 rounded-lg overflow-hidden shadow-md cursor-pointer"
                      onClick={() => {
                        if (item.shoes_photos && item.shoes_photos.length > 0) {
                          setSelectedImage(item.shoes_photos[0].url_photo);
                          setShowModal(true);
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
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">
                            No Image
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-md md:text-base truncate">
                        {item.order?.customer?.name || "No Name"}
                      </p>
                      <p className="text-xs md:text-sm text-gray-600 truncate">
                        {item.item?.brand || "No Item"} (
                        {item.treatment?.name || "No Treatment"})
                      </p>
                      {item.description && (
                        <p className="text-xs md:text-sm text-gray-500 truncate mt-1">
                          ⮕ {item.description}
                        </p>
                      )}
                      <p className="text-xs md:text-sm text-gray-500 mt-2 font-bold">
                        ⮕{" "}
                        {format(new Date(item.due_date), "EEEE, dd MMMM yyyy", {
                          locale: id,
                        })}
                      </p>
                    </div>
                  </div>
                  {renderTreatmentButton(item)}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                {searchQuery.trim() !== ""
                  ? "Tidak ada treatment yang sesuai dengan pencarian Anda"
                  : `Tidak ada antrian treatment untuk kategori ${selectedFilter}`}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Image Preview Modal dengan animasi yang sama dengan ConfirmationModal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay dengan animasi fade */}
            <div
              className={`fixed inset-0 bg-black transition-opacity duration-300 ${showModal ? "bg-opacity-75" : "bg-opacity-0"
                }`}
              aria-hidden="true"
              onClick={() => {
                setShowModal(false);
                setSelectedImage(null);
              }}
            />

            {/* Modal container untuk centering */}
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            {/* Modal content dengan animasi */}
            <div
              className={`inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all duration-300 sm:my-8 sm:align-middle sm:max-w-3xl w-full outline outline-2 outline-white
                ${showModal
                  ? "opacity-100 translate-y-0 sm:scale-100"
                  : "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                }`}
            >
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
                <div className="p-4 bg-white flex justify-center">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedImage(null);
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-montserrat shadow-[4px_4px_10px_rgba(0,0,0,0.15)] opacity-100 outline outline-1 outline-white"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
        customPriceReason={selectedTreatment?.custom_price_reason}
      />
    </div>
  );
};

export default Antrian;
