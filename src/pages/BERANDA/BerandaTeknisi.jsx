import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import instance from "../../config/api";
import { getUserProfile, getBranchId, getTenantId } from "../../utils/userProfileHelper";
import {
  saveFilterToStorage,
  getFilterFromStorage,
  clearFilterFromStorage,
  FILTER_TYPES,
  COMPONENT_NAMES
} from "../../utils/filterStorage";
import {
  format,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  parseISO,
  setHours,
  setMinutes,
  setSeconds,
} from "date-fns";
import ConfirmationModal from "../../components/Modal/ConfirmationModal";
import Header from "../../components/Com Header/Header";
import BreakTimeAlert from "../../components/BreakTimeAlert";
import AnimatedButton from "../../components/Design/AnimatedButton";
import DateRangePickerV2 from "../../components/DateRangePicker/DateRangePickerV2";
import TreatmentQueueV2 from "../../components/TreatmentQueue/TreatmentQueueV2";

const BerandaTeknisi = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [selectedEstimasi, setSelectedEstimasi] = useState("regular");
  const [antrianData, setAntrianData] = useState(null);
  const [fetchedOrders, setFetchedOrders] = useState([]);
  const [antrianTreatment, setAntrianTreatment] = useState([]);
  const [dateRange, setDateRange] = useState(() => {
    // Load saved date range from filter storage
    const savedRange = getFilterFromStorage(COMPONENT_NAMES.BERANDA_TEKNISI, FILTER_TYPES.DATE_FILTER);
    if (savedRange) {
      return savedRange;
    }
    // Fallback to localStorage for backward compatibility
    const localSavedRange = localStorage.getItem("dateRange");
    if (localSavedRange) {
      return JSON.parse(localSavedRange);
    }
    const today = new Date().toISOString().split("T")[0];
    return {
      startDate: today,
      endDate: today,
    };
  });
  const [tempDateRange, setTempDateRange] = useState(() => {
    // Load saved date range from filter storage
    const savedRange = getFilterFromStorage(COMPONENT_NAMES.BERANDA_TEKNISI, FILTER_TYPES.DATE_FILTER);
    if (savedRange) {
      return savedRange;
    }
    // Fallback to localStorage for backward compatibility
    const localSavedRange = localStorage.getItem("dateRange");
    if (localSavedRange) {
      return JSON.parse(localSavedRange);
    }
    const today = new Date().toISOString().split("T")[0];
    return {
      startDate: today,
      endDate: today,
    };
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSwitchRoleModal, setShowSwitchRoleModal] = useState(false);
  const [showOvertimeWarning, setShowOvertimeWarning] = useState(false);
  const [canTakeOvertime, setCanTakeOvertime] = useState(false);
  const [workDuration, setWorkDuration] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [showBreakWarning, setShowBreakWarning] = useState(false);
  const [showReturnWarning, setShowReturnWarning] = useState(false);
  const [breakCountdown, setBreakCountdown] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [returnCountdown, setReturnCountdown] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [currentTime, setCurrentTime] = useState("");
  const [isFromIzin, setIsFromIzin] = useState(false);
  const [isFromPresent, setIsFromPresent] = useState(false);
  const [countRegular, setCountRegular] = useState(0);
  const [countSameDay, setCountSameDay] = useState(0);
  const [countNextDay, setCountNextDay] = useState(0);

  // Fungsi untuk mendapatkan waktu WIB
  const getJakartaTime = () => {
    const date = new Date();
    return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  };

  // Fungsi untuk mengecek waktu istirahat
  const checkBreakTime = () => {
    const jakartaTime = getJakartaTime();

    // Set target times
    const breakTime = setHours(setMinutes(setSeconds(jakartaTime, 0), 0), 12); // 12:00:00
    const warningTime = setHours(
      setMinutes(setSeconds(jakartaTime, 0), 45),
      11
    ); // 11:45:00
    const returnTime = setHours(setMinutes(setSeconds(jakartaTime, 0), 0), 13); // 13:00:00

    // Hitung countdown ke waktu istirahat
    if (jakartaTime < breakTime) {
      const diff = breakTime.getTime() - jakartaTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setBreakCountdown({ hours, minutes, seconds });
    }

    // Hitung countdown ke waktu kembali
    if (jakartaTime >= breakTime && jakartaTime < returnTime) {
      const diff = returnTime.getTime() - jakartaTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setReturnCountdown({ hours, minutes, seconds });
    }

    // Tampilkan peringatan 15 menit sebelum istirahat
    if (jakartaTime >= warningTime && jakartaTime < breakTime) {
      setShowBreakWarning(true);
      setShowReturnWarning(false);
    }
    // Tampilkan peringatan selama waktu istirahat
    else if (jakartaTime >= breakTime && jakartaTime < returnTime) {
      setShowBreakWarning(false);
      setShowReturnWarning(true);
    }
    // Sembunyikan semua peringatan
    else {
      setShowBreakWarning(false);
      setShowReturnWarning(false);
    }
  };

  // Jalankan pengecekan waktu istirahat setiap detik
  useEffect(() => {
    checkBreakTime();
    const interval = setInterval(checkBreakTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fungsi untuk memformat tanggal ke format database (YYYY-MM-DD)
  const formatDateForDB = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // Fungsi untuk memfilter data berdasarkan rentang tanggal
  const filterByDateRange = (data) => {
    return data.filter((item) => {
      const dueDate = new Date(item.due_date).toISOString().split("T")[0];
      const startDate = formatDateForDB(dateRange.startDate);
      const endDate = formatDateForDB(dateRange.endDate);

      return dueDate >= startDate && dueDate <= endDate;
    });
  };

  // Handle perubahan input tanggal dengan auto-refresh
  const handleDateInputChange = async (e) => {
    const { name, value } = e.target;
    const formattedValue = formatDateForDB(value);

    const newRange = {
      ...dateRange,
      [name]: formattedValue,
    };

    // Validasi rentang
    if (name === "startDate" && formattedValue > dateRange.endDate) {
      newRange.endDate = formattedValue;
    } else if (name === "endDate" && formattedValue < dateRange.startDate) {
      newRange.startDate = formattedValue;
    }

    setDateRange(newRange);
    
    // Save to filter storage
    saveFilterToStorage(
      COMPONENT_NAMES.BERANDA_TEKNISI,
      FILTER_TYPES.DATE_FILTER,
      newRange,
      24 // 24 hours expiration
    );
    
    // Also save to localStorage for backward compatibility
    localStorage.setItem("dateRange", JSON.stringify(newRange));
    fetchAntrianData(newRange);
  };

  // Helper function untuk mendapatkan userData dari API
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
      console.error('[ERROR] Failed to get userData from API:', error);
      return null;
    }
  };

  // Update fetchAntrianData untuk menggunakan endpoint dan filter baru
  const fetchAntrianData = async (range = dateRange) => {
    try {
      const userData = await getUserData();
      
      // Format tanggal ke YYYY-MM-DD
      const startDate = formatDateForDB(range.startDate);
      const endDate = formatDateForDB(range.endDate);

      // Build filterObj sesuai support backend (range pakai $gte/$lte, single pakai string)
      let filterObj = {};
      if (startDate === endDate) {
        filterObj.entry_date = startDate;
      } else {
        // Kirim sebagai range (tanpa $ sesuai backend)
        filterObj.entry_date = { gte: startDate, lte: endDate };
      }
      // Status untuk teknisi: not_yet
      filterObj["order_details.status"] = ["not_yet", "antrian", "on_progress", "not_ready"];

      // Query param filter harus dikirim sebagai JSON string
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

      const response = await instance.get("/orders-new-raw", { params });

      if (response.data && response.data.data && Array.isArray(response.data.data.orders)) {
        // Data sudah terfilter, langsung flatten order_details
        const ordersArray = response.data.data.orders;
        let allTreatments = [];
        ordersArray.forEach(order => {
          if (Array.isArray(order.order_details)) {
            order.order_details.forEach(detail => {
              if (detail && typeof detail === "object") {
                allTreatments.push({ ...detail, order });
              }
            });
          }
        });

        // Hitung jumlah per estimasi
        const regularCount = allTreatments.filter(
          (item) => item.process_time?.toLowerCase() === "regular"
        ).length;
        const sameDayCount = allTreatments.filter(
          (item) => item.process_time?.toLowerCase() === "same_day"
        ).length;
        const nextDayCount = allTreatments.filter(
          (item) => item.process_time?.toLowerCase() === "next_day"
        ).length;

        setCountRegular(regularCount);
        setCountSameDay(sameDayCount);
        setCountNextDay(nextDayCount);
        setAntrianData({ total: allTreatments.length });
        setFetchedOrders(ordersArray); // Simpan orders mentah jika perlu

        // Filter untuk display sesuai selectedEstimasi
        const processTimeMap = {
          regular: "regular",
          sameDay: "same_day",
          nextDay: "next_day",
        };
        const currentProcessTime = processTimeMap[selectedEstimasi];
        const filteredForDisplay = allTreatments.filter(
          (item) => item.process_time?.toLowerCase() === currentProcessTime
        );
        setAntrianTreatment(filteredForDisplay);
      } else {
        setFetchedOrders([]);
        setAntrianTreatment([]);
        setCountRegular(0);
        setCountSameDay(0);
        setCountNextDay(0);
        setAntrianData({ total: 0 });
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      if (error.response?.status === 401) {
        console.error("Token tidak valid atau expired");
        navigate("/login");
      }
      setFetchedOrders([]);
      setAntrianTreatment([]);
      setCountRegular(0);
      setCountSameDay(0);
      setCountNextDay(0);
      setAntrianData({ total: 0 });
    }
  };

  useEffect(() => {
  }, []);

  useEffect(() => {
    // Cek izin dan present seperti sebelumnya
    const fromIzin = sessionStorage.getItem("fromIzin");
    if (fromIzin === "true") setIsFromIzin(true);
    const fromPresent = sessionStorage.getItem("fromPresent");
    if (fromPresent === "true") setIsFromPresent(true);
  }, []);

  useEffect(() => {
    // Flatten order_details to get all individual treatments with order info
    const allTreatments = fetchedOrders
      .filter((order) => order && typeof order === "object") // Pastikan tidak ada order null/undefined atau non-objek
      .flatMap((order) => {
        // Pastikan orderDetails adalah array, default ke array kosong jika order.order_details undefined atau bukan array
        const orderDetails = Array.isArray(order?.order_details)
          ? order.order_details
          : [];

        // Sekarang filter keluar setiap detail null/undefined atau non-objek dari array yang valid
        const filteredDetails = orderDetails.filter(
          (detail) => detail && typeof detail === "object"
        );

        return filteredDetails.map((detail) => ({ ...detail, order: order }));
      });

    // Filter for "not_yet" status for counts and display
    const allNotYetTreatments = allTreatments.filter(
      (item) => item.status === "not_yet" || item.status === "antrian" || item.status === "on_progress" || item.status === "not_ready"
    );

    // Calculate total counts for each estimasi from not_yet treatments
    const regularCount = allNotYetTreatments.filter(
      (item) => item.process_time?.toLowerCase() === "regular"
    ).length;
    const sameDayCount = allNotYetTreatments.filter(
      (item) => item.process_time?.toLowerCase() === "same_day"
    ).length;
    const nextDayCount = allNotYetTreatments.filter(
      (item) => item.process_time?.toLowerCase() === "next_day"
    ).length;

    setCountRegular(regularCount);
    setCountSameDay(sameDayCount);
    setCountNextDay(nextDayCount);


    // Filter data for display based on selected estimasi
    const processTimeMap = {
      regular: "regular",
      sameDay: "same_day",
      nextDay: "next_day",
    };
    const currentProcessTime = processTimeMap[selectedEstimasi];

    const filteredForDisplay = allNotYetTreatments.filter(
      (item) => item.process_time?.toLowerCase() === currentProcessTime
    );
    setAntrianTreatment(filteredForDisplay); // Set the filtered data to antrianTreatment
  }, [fetchedOrders, selectedEstimasi]);

  // Ubah fungsi filterTreatment
  const filterTreatment = async (estimasi) => {
    setSelectedEstimasi(estimasi);
    // fetchAntrianData will be triggered by useEffect due to selectedEstimasi change
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Tambahkan useEffect untuk memantau perubahan dateRange
  useEffect(() => {
    fetchAntrianData(dateRange);
  }, [dateRange]);

  // Tambahkan useEffect untuk mengambil data user dari API
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataFromAPI = await getUserData();
        if (userDataFromAPI) {
          setUserData(userDataFromAPI);
        }
      } catch (error) {
        console.error("❌ Failed to load user data:", error);
      }
    };
    
    loadUserData();
  }, []);

  const handleLogoutConfirm = () => {
    localStorage.removeItem("token");
    navigate("/");
    setShowLogoutModal(false);
  };

  const handleSwitchRoleConfirm = () => {
    navigate("/kurir/transport");
    setShowSwitchRoleModal(false);
  };

  // Tambahkan fungsi untuk update waktu
  const updateTime = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString("id-ID", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Jakarta",
    });
    setCurrentTime(timeString);
  };

  // Tambahkan useEffect untuk update waktu setiap detik
  useEffect(() => {
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-white font-montserrat">
      <Header />

      {/* Main Content dengan overflow scroll */}
      <main className="flex-1 overflow-y-auto pb-10">
        <div className="mx-auto px-4 md:px-10 pt-10 pb-6">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-[50px]">
            <BreakTimeAlert />

            {/* Date Range Picker */}
            <DateRangePickerV2 
              dateRange={dateRange}
              setDateRange={setDateRange}
              onDateChange={(newRange) => {
                setDateRange(newRange);
                
                // Save to filter storage
                saveFilterToStorage(
                  COMPONENT_NAMES.BERANDA_TEKNISI,
                  FILTER_TYPES.DATE_FILTER,
                  newRange,
                  24 // 24 hours expiration
                );
                
                // Also save to localStorage for backward compatibility
                localStorage.setItem("dateRange", JSON.stringify(newRange));
              }}
            />

            {/* Detail Antrian Treatment V2 */}
            <TreatmentQueueV2 
              orders={fetchedOrders}
              onOpenQueue={() => navigate('/antrian-v2', {
                state: { dateRange }
              })}
              onTreatmentClick={(treatmentName) => {
                // Konversi treatment name ke format yang sesuai untuk navigasi
                const treatmentFormat = treatmentName.toLowerCase().replace(/\s+/g, '_');
                
                navigate(`/antrian-v2/${treatmentFormat}`, {
                  state: {
                    dateRange,
                    treatment: treatmentFormat,
                  },
                });
              }}
            />
          </div>
        </div>
      </main>

      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        title="Logout Confirmation"
        message="Are you sure you want to logout? Logging out is recommended when work hours are finished."
      />

      <ConfirmationModal
        isOpen={showSwitchRoleModal}
        onClose={() => setShowSwitchRoleModal(false)}
        onConfirm={handleSwitchRoleConfirm}
        title="Switch Role Confirmation"
        message="Are you sure you want to switch to courier page?"
      />
    </div>
  );
};

export default BerandaTeknisi;
