import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Com Header/Header";
import BreakTimeAlert from "../../components/BreakTimeAlert";
import AnimatedButton from "../../components/Design/AnimatedButton";
import DateRangePickerV2 from "../../components/DateRangePicker/DateRangePickerV2";
import InfoModal from "../../components/Modal/InfoModal";
import { getKurirAntrianData } from "../../services/kurirService";
import { buildDateTime } from "../../utils/dateUtils";
import instance from '../../config/api';
import { getUserProfile } from "../../utils/userProfileHelper";
import {
  saveFilterToStorage,
  getFilterFromStorage,
  clearFilterFromStorage,
  FILTER_TYPES,
  COMPONENT_NAMES
} from "../../utils/filterStorage";

const BerandaKurir = () => {
  const navigate = useNavigate();
  const [selectedEstimasi, setSelectedEstimasi] = useState("pickup");
  const [antrianData, setAntrianData] = useState(null);
  const [antrianTransport, setAntrianTransport] = useState([]);
  const [dateRange, setDateRange] = useState(() => {
    // Load saved date range from filter storage
    const savedRange = getFilterFromStorage(COMPONENT_NAMES.BERANDA_KURIR, FILTER_TYPES.DATE_FILTER);
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
  const [isFromIzin, setIsFromIzin] = useState(false);
  const [isFromPresent, setIsFromPresent] = useState(false);
  const [countRegular, setCountRegular] = useState(0);
  const [countSameDay, setCountSameDay] = useState(0);
  const [countNextDay, setCountNextDay] = useState(0);
  const [loading, setLoading] = useState(false);
  const [groupedPickup, setGroupedPickup] = useState([]);
  const [groupedDelivery, setGroupedDelivery] = useState([]);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Fungsi untuk memformat tanggal ke format database (YYYY-MM-DD)
  const formatDateForDB = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // Group data per customer + delivery_date (untuk memisahkan customer dengan delivery_date berbeda)
  function groupByCustomer(data) {
    const grouped = {};
    data.forEach(item => {
      // Group berdasarkan customer + phone + delivery_date
      const key = item.customerName + '|' + item.phone + '|' + (item.delivery_date || 'no-date');
      if (!grouped[key]) {
        grouped[key] = {
          ...item,
          items: [],
          itemCount: 0,
        };
      }
      grouped[key].items.push(item);
      grouped[key].itemCount += 1;
    });

    // Setelah grouping, ambil requestTime yang paling awal dari semua items
    return Object.values(grouped).map(customer => {
      // Cari requestTime yang paling awal dari semua items customer ini
      const validRequestTimes = customer.items
        .map(item => {
          // Coba ambil dari delivery_date dan delivery_time jika ada
          if (item.delivery_date && item.delivery_time) {
            const parsed = buildDateTime(item.delivery_date, item.delivery_time);
            if (parsed) return parsed;
          }
          // Fallback ke requestTime jika ada
          if (item.requestTime && !isNaN(new Date(item.requestTime))) {
            return new Date(item.requestTime);
          }
          return null;
        })
        .filter(time => time !== null && !isNaN(time));

      // Ambil yang paling awal, atau gunakan waktu sekarang jika tidak ada yang valid
      const earliestRequestTime = validRequestTimes.length > 0 
        ? new Date(Math.min(...validRequestTimes.map(t => t.getTime())))
        : new Date();

      return {
        ...customer,
        requestTime: earliestRequestTime
      };
    });
  }

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
      console.error('[ERROR] BerandaKurir - Failed to get userData from API:', error);
      return null;
    }
  };

  // Handle perubahan input tanggal
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
      COMPONENT_NAMES.BERANDA_KURIR,
      FILTER_TYPES.DATE_FILTER,
      newRange,
      24 // 24 hours expiration
    );
    
    // Also save to localStorage for backward compatibility
    localStorage.setItem("dateRange", JSON.stringify(newRange));
  };

  useEffect(() => {
    const fetchAntrianData = async () => {
      setLoading(true);
      try {
        const userData = await getUserData();
        
        // Format tanggal ke YYYY-MM-DD
        const startDate = formatDateForDB(dateRange.startDate);
        const endDate = formatDateForDB(dateRange.endDate);

        // ✅ SESUAIKAN DENGAN ANTRIANKURIR: 2 API CALL TERPISAH
        // PICKUP: pickup_method = "pickup" & status = "not_yet"
        // DELIVERY: pickup_method = "delivery" & status = "siap_dikirim"
        // Ini memastikan count PERSIS SAMA dengan AntrianKurir.jsx
        
        // 1. API CALL UNTUK PICKUP
        let pickupFilterObj = {};
        if (startDate === endDate) {
          pickupFilterObj.entry_date = startDate;
        } else {
          pickupFilterObj.entry_date = { gte: startDate, lte: endDate };
        }
        pickupFilterObj["order_details.delivery_status"] = ["scheduled"];
        pickupFilterObj["order_details.pickup_method"] = ["pickup"];     // HANYA PICKUP
        pickupFilterObj["order_details.status"] = ["not_yet", "antrian"];          // HANYA NOT_YET

        const pickupParams = {
          page: 1,
          pageSize: 1000,
          filter: JSON.stringify(pickupFilterObj),
        };

        // Add tenant_id and branch_id for data isolation
        if (userData?.tenant_id) {
          pickupParams.tenant_id = userData.tenant_id;
        }
        if (userData?.branch_id) {
          pickupParams.branch_id = userData.branch_id;
        }

        // 2. API CALL UNTUK DELIVERY
        let deliveryFilterObj = {};
        if (startDate === endDate) {
          deliveryFilterObj.entry_date = startDate;
        } else {
          deliveryFilterObj.entry_date = { gte: startDate, lte: endDate };
        }
        deliveryFilterObj["order_details.delivery_status"] = ["scheduled"];
        deliveryFilterObj["order_details.pickup_method"] = ["delivery"];  // HANYA DELIVERY
        deliveryFilterObj["order_details.status"] = ["siap_dikirim"];     // HANYA SIAP_DIKIRIM

        const deliveryParams = {
          page: 1,
          pageSize: 1000,
          filter: JSON.stringify(deliveryFilterObj),
        };

        // Add tenant_id and branch_id for data isolation
        if (userData?.tenant_id) {
          deliveryParams.tenant_id = userData.tenant_id;
        }
        if (userData?.branch_id) {
          deliveryParams.branch_id = userData.branch_id;
        }

        // ✅ PARALLEL API CALLS - Sama seperti AntrianKurir logic
        const [pickupResponse, deliveryResponse] = await Promise.all([
          instance.get('/orders-new-raw', { params: pickupParams }).catch(err => {
            console.error('❌ BerandaKurir - Pickup API Error:', err);
            return { data: { data: { orders: [] } } };
          }),
          instance.get('/orders-new-raw', { params: deliveryParams }).catch(err => {
            console.error('❌ BerandaKurir - Delivery API Error:', err);
            return { data: { data: { orders: [] } } };
          })
        ]);
        
        // ✅ Debug logging untuk memastikan API call konsisten dengan AntrianKurir

        // ✅ PROCESS PICKUP DATA - Sama seperti AntrianKurir logic
        let pickupCount = 0;
        let pickupCustomerCount = 0;
        if (pickupResponse.data && pickupResponse.data.data && Array.isArray(pickupResponse.data.data.orders)) {
          const pickupOrders = pickupResponse.data.data.orders;
          const pickupTransports = pickupOrders.flatMap((order) => {
            const orderDetails = Array.isArray(order?.order_details) ? order.order_details : [];
            return orderDetails.map((detail) => ({
              ...detail,
              customerName: order.customer?.name || '',
              phone: order.customer?.phone || '',
              address: order.customer?.address || '',
              googleMapsUrl: order.customer?.gmaps || '-',
              pickup_method: detail.pickup_method,
              delivery_status: detail.delivery_status,
              status: detail.status,
              id: detail.id,
              delivery_date: detail.delivery_date,
              requestTime: detail.requestTime,
              shoes_photos: detail.shoes_photos || [],
            }));
          });
          pickupCount = pickupTransports.length;
          
          // Group by customer untuk menghitung total customer
          const groupedPickup = groupByCustomer(pickupTransports);
          pickupCustomerCount = groupedPickup.length;
        } else {
        }

        // ✅ PROCESS DELIVERY DATA - Sama seperti AntrianKurir logic
        let deliveryCount = 0;
        let deliveryCustomerCount = 0;
        if (deliveryResponse.data && deliveryResponse.data.data && Array.isArray(deliveryResponse.data.data.orders)) {
          const deliveryOrders = deliveryResponse.data.data.orders;
          const deliveryTransports = deliveryOrders.flatMap((order) => {
            const orderDetails = Array.isArray(order?.order_details) ? order.order_details : [];
            return orderDetails.map((detail) => ({
              ...detail,
              customerName: order.customer?.name || '',
              phone: order.customer?.phone || '',
              address: order.customer?.address || '',
              googleMapsUrl: order.customer?.gmaps || '-',
              pickup_method: detail.pickup_method,
              delivery_status: detail.delivery_status,
              status: detail.status,
              id: detail.id,
              delivery_date: detail.delivery_date,
              requestTime: detail.requestTime,
              shoes_photos: detail.shoes_photos || [],
            }));
          });
          deliveryCount = deliveryTransports.length;
          
          // Group by customer untuk menghitung total customer
          const groupedDelivery = groupByCustomer(deliveryTransports);
          deliveryCustomerCount = groupedDelivery.length;
        } else {
        }

        // ✅ Debug logging untuk memastikan count konsisten dengan AntrianKurir

        setAntrianData({ 
          pickup: pickupCount, 
          delivery: deliveryCount,
          pickupCustomers: pickupCustomerCount,
          deliveryCustomers: deliveryCustomerCount,
          totalCustomers: pickupCustomerCount + deliveryCustomerCount
        });
      } catch (error) {
        console.error('❌ BerandaKurir - Error fetching antrian data:', error);
        if (error.response?.status === 401) {
          console.error('❌ BerandaKurir - Token tidak valid atau expired');
          navigate('/login');
        }
        setAntrianData({ pickup: 0, delivery: 0, pickupCustomers: 0, deliveryCustomers: 0, totalCustomers: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchAntrianData();
    
    // Cek izin dan present seperti sebelumnya
    const fromIzin = sessionStorage.getItem("fromIzin");
    if (fromIzin === "true") setIsFromIzin(true);
    const fromPresent = sessionStorage.getItem("fromPresent");
    if (fromPresent === "true") setIsFromPresent(true);
  }, [dateRange]); // ✅ Konsisten dengan AntrianKurir: hanya dateRange sebagai dependency

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-white font-montserrat">
      <Header />
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
                  COMPONENT_NAMES.BERANDA_KURIR,
                  FILTER_TYPES.DATE_FILTER,
                  newRange,
                  24 // 24 hours expiration
                );
                
                // Also save to localStorage for backward compatibility
                localStorage.setItem("dateRange", JSON.stringify(newRange));
              }}
            />

            {/* Detail Antrian Card */}
            <div className="mb-2 bg-white rounded-3xl p-4 mt-4 opacity-100 outline outline-2 outline-[#EEF1F7]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold font-montserrat">
                    Antrian Kurir
                  </h2>
                  <button
                    onClick={() => setShowInfoModal(true)}
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
                  onClick={() => navigate('/kurir', { state: { dateRange } })}
                  className="h-[35px] px-4 py-2 flex items-center justify-center rounded-xl font-['Montserrat'] font-semibold transition-all bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] text-white hover:from-[#4088EB] hover:to-[#6BC1ED] shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Lihat Antrian
                </AnimatedButton>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5 text-blue-600"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                        />
                      </svg>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-semibold text-gray-800 text-sm font-['Montserrat']">
                        Penjemputan
                      </h3>
                      <p className="text-xs text-gray-500 font-['Montserrat']">
                        {loading ? "..." : antrianData?.pickup || 0} items
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-semibold font-bold text-blue-600 font-['Montserrat']">
                        {loading ? "..." : antrianData?.pickupCustomers || 0}
                      </p>
                      <p className="text-xs text-gray-400 font-['Montserrat']">
                        pelanggan
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5 text-green-600"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm font-['Montserrat']">
                        Pengantaran
                      </h3>
                      <p className="text-xs text-gray-500 font-['Montserrat']">
                        {loading ? "..." : antrianData?.delivery || 0} items
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-semibold font-bold text-green-600 font-['Montserrat']">
                        {loading ? "..." : antrianData?.deliveryCustomers || 0}
                      </p>
                      <p className="text-xs text-gray-400 font-['Montserrat']">
                        pelanggan
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Modal */}
            <InfoModal
              isOpen={showInfoModal}
              onClose={() => setShowInfoModal(false)}
              title="Antrian antar & jemput"
              items={[
                {
                  title: "Data Antar Jemput",
                  description: "Menampilkan jumlah items yang perlu dijemput atau diantar berdasarkan status yang sudah diatur oleh admin. Count menampilkan total items, bukan jumlah customers.",
                  bgColor: "bg-blue-50",
                  dotColor: "bg-blue-500",
                  titleColor: "text-blue-700"
                }
              ]}
              footerInfo={{
                icon: "📋",
                text: "Count items konsisten dengan halaman Antrian Kurir"
              }}
              maxWidth="max-w-lg"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default BerandaKurir;
