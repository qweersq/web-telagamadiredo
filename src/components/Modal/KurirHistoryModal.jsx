import { useCallback, useEffect, useMemo, useState } from "react";
import { History, X, Search, ShoppingBag, Package, Calendar, CheckCircle, User, Images, Loader } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import instance from "../../config/api";
import PhotoHistoryModal from "../Modal/PhotoHistoryModal";
import { getPhotoUrl } from "../../utils/photoUrlHelper";
import { getUserProfile } from "../../utils/userProfileHelper";

// Ambil 1000 data sekali jalan supaya pengurutan (yang dilakukan di client)
// benar-benar global, bukan per halaman. Load More baru muncul setelah 1000
// data pertama habis.
const PAGE_SIZE = 1000;

/**
 * Riwayat penyerahan kurir (web) — parity dengan
 * `mobile-notasepatu/components/antrian/KurirHistoryModal.js`.
 *
 * Item yang sudah selesai dijemput/diantar hilang dari antrian karena
 * `delivery_status` berubah jadi `delivered`. Modal ini menampilkan kembali
 * item tersebut, difokuskan per tab:
 *  - Penjemputan → HANYA log `not_yet -> antrian`
 *  - Pengantaran → HANYA log `siap_dikirim -> done`
 * Filter & urutan memakai log tersebut saja (log teknisi/QC diabaikan).
 *
 * Data dari `GET /orders-new-raw` dengan filter `delivery_status: delivered`.
 * Foto bukti tetap lewat `PhotoHistoryModal` (`/order-details/:id/photo-history`).
 */

const formatDateForDB = (value) => {
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return format(date, "yyyy-MM-dd");
};

const getThumbnailUrl = (originalUrl) => {
  if (!originalUrl) return null;
  if (originalUrl.includes("cloudinary")) {
    return originalUrl.replace("/upload/", "/upload/w_200,h_200,c_fill/");
  }
  if (originalUrl.includes("imagekit")) {
    return originalUrl + "?tr=w-200,h-200";
  }
  return originalUrl;
};

const safeFormatDate = (value, pattern) => {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  return format(date, pattern, { locale: localeId });
};

/** Log serah-terima sesuai tab. */
const getCompletionLog = (item, type) => {
  const logs = Array.isArray(item?.status_logs) ? item.status_logs : [];
  if (type === "pickup") {
    return logs.find((l) => l.old_status === "not_yet" && l.new_status === "antrian") || null;
  }
  return logs.find((l) => l.old_status === "siap_dikirim" && l.new_status === "done") || null;
};

const getCompletionLogTime = (item, type) => {
  const log = getCompletionLog(item, type);
  const time = new Date(log?.created_at).getTime();
  return isNaN(time) ? 0 : time;
};

const filterByCompletionLog = (list, type) =>
  list.filter((item) => getCompletionLog(item, type) !== null);

const sortByCompletionLog = (list, type) =>
  [...list].sort((a, b) => getCompletionLogTime(b, type) - getCompletionLogTime(a, type));

const KurirHistoryModal = ({ isOpen, onClose, dateRange }) => {
  const [activeTab, setActiveTab] = useState("pickup");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [showPhotoHistory, setShowPhotoHistory] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);

  const resolvedRange = useMemo(() => {
    if (dateRange?.startDate && dateRange?.endDate) return dateRange;
    const today = new Date().toISOString().split("T")[0];
    return { startDate: today, endDate: today };
  }, [dateRange]);

  const fetchHistory = useCallback(
    async ({ nextPage = 1, append = false, tab = "pickup", search = "" } = {}) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const profile = await getUserProfile();
        const tenantId = profile?.tenant?.id;
        const branchId = profile?.branch?.id;

        const startDate = formatDateForDB(resolvedRange.startDate);
        const endDate = formatDateForDB(resolvedRange.endDate);

        const filterObj = {};
        // Ikut `entry_date` (tanggal order dibuat) — backend belum mendukung
        // filter `delivery_date`.
        filterObj.entry_date = startDate === endDate ? startDate : { gte: startDate, lte: endDate };
        filterObj["order_details.delivery_status"] = ["delivered"];
        filterObj["order_details.pickup_method"] = [tab];

        if (search && search.trim()) {
          filterObj.search = search.trim();
        }

        const params = {
          page: nextPage,
          pageSize: PAGE_SIZE,
          filter: JSON.stringify(filterObj),
        };
        if (tenantId) params.tenant_id = tenantId;
        if (branchId) params.branch_id = branchId;

        const response = await instance.get("/orders-new-raw", { params });
        const payload = response?.data?.data;
        const ordersArray = Array.isArray(payload?.orders) ? payload.orders : [];

        const flat = ordersArray.flatMap((order) => {
          const details = Array.isArray(order?.order_details) ? order.order_details : [];
          return details.map((detail) => ({
            ...detail,
            order,
            customerName: order?.customer?.name || "",
            phone: order?.customer?.phone || "",
            customer: order?.customer || null,
            order_type:
              order?.branch_type === "mitra" ? "droppoint" : order?.order_type || "regular",
            branch_name: order?.branch_name || null,
          }));
        });

        const pagination = payload?.pagination;
        setHasNextPage(
          (pagination?.currentPage || 1) < (pagination?.totalPages || 1)
        );
        setPage(nextPage);
        setItems((prev) => {
          const merged = append ? [...prev, ...flat] : flat;
          return sortByCompletionLog(filterByCompletionLog(merged, tab), tab);
        });
      } catch (error) {
        console.error("[ERROR] KurirHistoryModal (web) - gagal memuat riwayat:", error);
        if (!append) setItems([]);
        setHasNextPage(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [resolvedRange]
  );

  useEffect(() => {
    if (!isOpen) return;
    fetchHistory({ nextPage: 1, append: false, tab: activeTab, search: appliedSearch });
  }, [isOpen, activeTab, appliedSearch, fetchHistory]);

  // Satu halaman API bisa kosong setelah difilter padahal masih ada halaman
  // berikutnya → ambil otomatis.
  useEffect(() => {
    if (!isOpen || loading || loadingMore) return;
    if (items.length === 0 && hasNextPage) {
      fetchHistory({
        nextPage: page + 1,
        append: true,
        tab: activeTab,
        search: appliedSearch,
      });
    }
  }, [isOpen, items.length, hasNextPage, loading, loadingMore, page, fetchHistory, activeTab, appliedSearch]);

  const handleApplySearch = () => setAppliedSearch(searchInput.trim());

  const handleClearSearch = () => {
    setSearchInput("");
    setAppliedSearch("");
  };

  const handleLoadMore = () => {
    if (!hasNextPage || loadingMore || loading) return;
    fetchHistory({ nextPage: page + 1, append: true, tab: activeTab, search: appliedSearch });
  };

  const handleOpenPhotos = (item) => {
    setSelectedOrderDetail(item);
    setShowPhotoHistory(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 font-montserrat"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <History className="w-5 h-5 text-white flex-shrink-0" />
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white leading-tight">
                  Riwayat Penyerahan
                </h2>
                <p className="text-xs text-white/90 leading-tight">
                  Item yang sudah selesai dijemput / diantar
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
              title="Tutup"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 px-4 pt-3 flex-shrink-0">
            {[
              { key: "pickup", label: "Penjemputan", Icon: ShoppingBag },
              { key: "delivery", label: "Pengantaran", Icon: Package },
            ].map(({ key, label, Icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-2 flex-shrink-0">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApplySearch();
                }}
                placeholder="Cari nama / no. hp ..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {searchInput.length > 0 && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-200"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>
            <button
              onClick={handleApplySearch}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#3B82F6] rounded-xl hover:bg-blue-600 transition-colors"
            >
              Cari
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader className="w-7 h-7 animate-spin text-blue-500" />
                <p className="text-xs text-gray-500 mt-3">Memuat riwayat...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <History className="w-11 h-11 text-gray-300 mb-3" />
                <p className="text-sm font-semibold text-gray-700">Belum ada riwayat</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  {appliedSearch
                    ? "Tidak ada item yang cocok dengan pencarian."
                    : `Belum ada ${
                        activeTab === "pickup" ? "penjemputan" : "pengantaran"
                      } yang diselesaikan pada rentang tanggal ini.`}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {items.map((item) => {
                  const firstPhoto = item.shoes_photos?.[0]?.url_photo;
                  const thumbnailUrl = firstPhoto
                    ? getThumbnailUrl(getPhotoUrl(firstPhoto))
                    : null;
                  const completionLog = getCompletionLog(item, activeTab);
                  const photoCount = item.shoes_photos?.length || 0;

                  return (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-xl p-3 bg-white hover:shadow-sm transition-shadow"
                    >
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleOpenPhotos(item)}
                          className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0"
                          title="Lihat foto"
                        >
                          {thumbnailUrl ? (
                            <img
                              src={thumbnailUrl}
                              alt={item.customerName || "item"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {item.customerName || "Tanpa Nama"}
                            </p>
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700 flex-shrink-0">
                              <CheckCircle className="w-2.5 h-2.5" />
                              Selesai
                            </span>
                          </div>

                          <p className="text-xs text-gray-600 truncate mt-0.5">
                            {item.item?.brand || item.item?.name || "Item"}
                            {item.treatment?.name ? ` · ${item.treatment.name}` : ""}
                          </p>

                          <p className="flex items-center gap-1 text-[11px] text-gray-500 mt-1">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                              Jadwal {safeFormatDate(item.delivery_date, "dd MMM yyyy")}
                              {item.delivery_time ? `, ${item.delivery_time}` : ""}
                            </span>
                          </p>

                          <p className="flex items-center gap-1 text-[11px] mt-0.5 flex-wrap">
                            <CheckCircle className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            <span className="font-semibold text-emerald-600">
                              {activeTab === "pickup" ? "Dijemput" : "Selesai antar"} ·{" "}
                              {safeFormatDate(completionLog?.created_at, "dd MMM yyyy, HH:mm")}
                            </span>
                            {completionLog?.updated_by_name && (
                              <>
                                <User className="w-3 h-3 text-gray-500 ml-1 flex-shrink-0" />
                                <span className="text-gray-500 truncate">
                                  {completionLog.updated_by_name}
                                </span>
                              </>
                            )}
                          </p>

                          {item.order_type === "droppoint" && item.branch_name && (
                            <p className="text-[11px] text-blue-600 truncate mt-0.5">
                              📍 {item.branch_name}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenPhotos(item)}
                        className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <Images className="w-3.5 h-3.5" />
                        Lihat Foto{photoCount > 0 ? ` (${photoCount})` : ""}
                      </button>
                    </div>
                  );
                })}

                {hasNextPage && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-6 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <Loader className="w-3.5 h-3.5 animate-spin" />
                          Memuat...
                        </>
                      ) : (
                        "Load More"
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showPhotoHistory && (
        <PhotoHistoryModal
          isOpen={showPhotoHistory}
          onClose={() => {
            setShowPhotoHistory(false);
            setSelectedOrderDetail(null);
          }}
          orderDetail={selectedOrderDetail}
        />
      )}
    </>
  );
};

export default KurirHistoryModal;
