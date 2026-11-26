import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { History } from "lucide-react";
import instance from "../../../config/api";
import AntrianHeaderV2 from "../../../components/Header Antrian/AntrianHeaderV2";
import LoadingDots from "../../../components/Design/LoadingDots";
import AnimatedButton from "../../../components/Design/AnimatedButton";
import PhotoHistoryModal from '../../../components/Modal/PhotoHistoryModal';
import { getUserProfile } from "../../../utils/userProfileHelper";

const RiwayatQC = () => {
  const location = useLocation();
  const { dateRange } = location.state || {};
  const navigate = useNavigate();

  // Tab Management
  const [activeTab, setActiveTab] = useState('selesai');

  // Data States
  const [antrianData, setAntrianData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPhotoHistory, setShowPhotoHistory] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  // Fungsi untuk memformat tanggal ke format database (YYYY-MM-DD)
  const formatDateForDB = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // Helper function untuk mendapatkan userData dari API
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
        branch_address: profile.branch?.address,
        tenant_id: profile.tenant?.id,
        tenant_name: profile.tenant?.business_name
      };

      return userData;
    } catch (error) {
      console.error('[ERROR] RiwayatQC - Failed to get userData from API:', error);
      return null;
    }
  };

  // Fungsi untuk mengambil data berdasarkan tab aktif
  const fetchAntrianData = async (isLoadMore = false) => {
    // Check if dateRange exists
    if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
      console.error('Date range is not available');
      setIsInitialLoading(false);
      setIsLoadingMore(false);
      return;
    }

    try {
      // Set loading state
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsInitialLoading(true);
      }

      const userData = await getUserData();
      const formattedStartDate = formatDateForDB(dateRange.startDate);
      const formattedEndDate = formatDateForDB(dateRange.endDate);

      // Build filterObj sesuai backend
      let filterObj = {};
      if (formattedStartDate === formattedEndDate) {
        filterObj.entry_date = formattedStartDate;
      } else {
        filterObj.entry_date = { gte: formattedStartDate, lte: formattedEndDate };
      }

      // ✅ FILTER STATUS BERDASARKAN TAB - MUST BE ARRAY
      const statusMap = {
        'selesai': ['done'],
        'siap_dikirim': ['siap_dikirim'],
        'tidak_lolos': ['not_ready']
      };
      filterObj["order_details.status"] = statusMap[activeTab] || [];

      // Add search parameter if exists
      if (searchQuery && searchQuery.trim()) {
        filterObj.search = searchQuery.trim();
      }

      const params = {
        page: isLoadMore ? currentPage + 1 : currentPage,
        pageSize: 20,
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
        // Flatten order_details into a single array
        const allTreatments = ordersArray.flatMap((order) => {
          const orderDetails = Array.isArray(order?.order_details)
            ? order.order_details
            : [];
          return orderDetails.map((detail) => ({ ...detail, order: order }));
        });

        // Handle pagination data
        const pagination = response.data.data.pagination;
        setHasNextPage(pagination.currentPage < pagination.totalPages);

        if (isLoadMore) {
          // Append new data to existing data
          setAntrianData(prev => [...prev, ...allTreatments]);
          setCurrentPage(prev => prev + 1);
        } else {
          // Replace data for initial load or filter change
          setAntrianData(allTreatments);
          setCurrentPage(1);
        }
      } else {
        if (!isLoadMore) {
          setAntrianData([]);
        }
        setHasNextPage(false);
      }
    } catch (error) {
      console.error("Error fetching QC history:", error);
      if (error.response?.status === 401) {
        console.error("Token tidak valid atau expired");
        navigate("/login");
      }
      if (!isLoadMore) {
        setAntrianData([]);
      }
      setHasNextPage(false);
    } finally {
      setIsInitialLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Load more data handler
  const loadMoreData = async () => {
    if (!hasNextPage || isLoadingMore) return;
    await fetchAntrianData(true);
  };

  // Handler untuk search
  const handleSearch = async () => {
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      setCurrentPage(1);
      setHasNextPage(false);
      await fetchAntrianData();
    }
  };

  // Effect untuk fetch data saat tab, dateRange, atau searchQuery berubah
  useEffect(() => {
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      setCurrentPage(1);
      setHasNextPage(false);
      fetchAntrianData();
    }
  }, [dateRange, activeTab]);

  // Effect untuk handle search query change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (dateRange && dateRange.startDate && dateRange.endDate) {
        setCurrentPage(1);
        setHasNextPage(false);
        fetchAntrianData();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

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

  // Get badge color and text based on status
  const getBadgeInfo = () => {
    const badges = {
      'selesai': { text: 'Selesai', color: 'bg-green-500' },
      'siap_dikirim': { text: 'Siap Dikirim', color: 'bg-blue-500' },
      'tidak_lolos': { text: 'Tidak Lolos', color: 'bg-red-500' }
    };
    return badges[activeTab] || { text: '', color: '' };
  };

  const badgeInfo = getBadgeInfo();

  return (
    <div className="h-screen overflow-y-auto font-montserrat">
      {/* Header - Fixed at top */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-white">
        <AntrianHeaderV2
          onSearch={handleSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          title="Riwayat"
        />
      </header>

      {/* Main Content */}
      <main className="mx-auto px-4 md:px-10 pt-[100px] pb-24 h-[100dvh] overflow-y-auto">
        <div className="max-w-[390px] md:max-w-none mx-auto">
          {/* Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto mt-12">
            <button
              onClick={() => setActiveTab('selesai')}
              className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${activeTab === 'selesai'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
                }`}
            >
              Selesai
            </button>
            <button
              onClick={() => setActiveTab('siap_dikirim')}
              className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${activeTab === 'siap_dikirim'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
                }`}
            >
              Siap Dikirim
            </button>
            <button
              onClick={() => setActiveTab('tidak_lolos')}
              className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${activeTab === 'tidak_lolos'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
                }`}
            >
              Tidak Lolos
            </button>
          </div>

          {/* Initial Loading */}
          {isInitialLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Memuat data...</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {antrianData.length > 0 ? (
              antrianData.map((item) => {
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl p-4 outline outline-1 outline-[#C1C1C1] relative"
                  >
                    {/* Badge status */}
                    {badgeInfo.text && (
                      <div className={`absolute top-4 right-4 ${badgeInfo.color} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                        {badgeInfo.text}
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      <div
                        className="w-[100px] h-[100px] min-w-[100px] bg-gray-200 rounded-lg overflow-hidden shadow-md cursor-pointer"
                        onClick={() => {
                          setSelectedOrderDetail(item);
                          setShowPhotoHistory(true);
                        }}
                      >
                        {item.shoes_photos && item.shoes_photos.length > 0 ? (
                          <img
                            src={getThumbnailUrl(item.shoes_photos[0].url_photo)}
                            alt="Shoes"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-sm">
                              Tidak ada gambar
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-md md:text-base truncate">
                          {item.order?.customer?.name || "No Name"}
                        </p>
                        {/* Droppoint Badge */}
                        {item.order?.branch_type === 'mitra' && item.order?.branch_name && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium text-purple-600 border border-purple-300 rounded-full bg-purple-50 truncate max-w-full">
                            📍 {item.order.branch_name}
                          </span>
                        )}
                        <p className="text-xs md:text-sm text-gray-600 truncate">
                          {item.item?.brand || "No Item"} ({item.treatment?.name || "No Treatment"})
                        </p>
                        {/* Custom Price Reason */}
                        {item.custom_price_reason && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-1.5">
                            <p className="text-[10px] md:text-xs font-semibold text-blue-600 mb-0.5">Ket. Penyesuaian Harga</p>
                            <p className="text-[10px] md:text-xs text-gray-700 line-clamp-2">{item.custom_price_reason}</p>
                          </div>
                        )}
                        <p className="text-xs md:text-sm text-gray-500 mt-1 line-clamp-2 text-[#AA3328]">
                          {item.description}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500 mt-2 font-bold">
                          {format(new Date(item.due_date), "EEEE, dd MMMM yyyy", {
                            locale: id,
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Footer - Detail Button Only */}
                    <div className="flex items-center gap-2 mt-4">
                      <AnimatedButton
                        onClick={() => {
                          setSelectedOrderDetail(item);
                          setShowPhotoHistory(true);
                        }}
                        className="w-full h-[35px] px-3 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        title="Lihat riwayat foto"
                      >
                        <History className="w-4 h-4" />
                        <span>Detail</span>
                      </AnimatedButton>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                {searchQuery.trim() !== ""
                  ? "Tidak ada item yang cocok dengan pencarian Anda"
                  : "Tidak ada data untuk ditampilkan"}
              </div>
            )}
          </div>

          {/* Load More Button */}
          {hasNextPage && !isInitialLoading && (
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

      {/* Photo History Modal */}
      <PhotoHistoryModal
        isOpen={showPhotoHistory}
        onClose={() => {
          setShowPhotoHistory(false);
          setSelectedOrderDetail(null);
        }}
        orderDetail={selectedOrderDetail}
      />
    </div>
  );
};

export default RiwayatQC;

