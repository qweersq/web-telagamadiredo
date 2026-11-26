import { useCallback, useEffect, useMemo, useState } from "react";
import {
  X,
  Search,
  ShoppingBag,
  Calendar,
  CheckCircle2,
  XCircle,
  User,
  Users,
  Images,
  ClipboardCheck,
  Loader,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import instance from "../../config/api";
import PhotoHistoryModal from "../Modal/PhotoHistoryModal";
import { getPhotoUrl } from "../../utils/photoUrlHelper";
import { getUserProfile } from "../../utils/userProfileHelper";

// Ambil 1000 data sekali jalan supaya pengurutan (yang dilakukan di client)
// benar-benar global, bukan per halaman. Load More baru muncul setelah 1000
// data pertama habis. Sama untuk scope "Saya" karena filter pemilik tetap
// dilakukan di sisi client (lihat catatan di bawah).
const PAGE_SIZE_ALL = 1000;
const PAGE_SIZE_MINE = 1000;

/**
 * Riwayat pemeriksaan QC (web) — parity dengan
 * `mobile-notasepatu/components/antrian/QCHistoryModal.js`.
 *
 * Kenapa perlu: begitu QC menekan "Lolos" / "Tidak Lolos", status item
 * berpindah dari `pengeringan` ke `siap` (lolos) atau `not_ready` (tidak lolos).
 * Halaman Riwayat QC lama (`pages/BERANDA/RiwayatQC`) memfilter berdasarkan
 * STATUS SEKARANG, bukan EVENT QC, sehingga:
 *   - item `not_ready` yang sudah di-rework lalu lolos → riwayat gagalnya hilang
 *   - tidak ada info siapa pemeriksa & kapan diperiksa
 *
 * Sumber data: `GET /orders-new-raw` (endpoint yang sama dengan antrian aktif).
 * Payload raw sudah membawa `status_logs` lengkap (`old_status`, `new_status`,
 * `updated_by`, `updated_by_name`, `created_at`) + `shoes_photos`, jadi
 * TIDAK ADA perubahan backend.
 *
 * Definisi event QC (berbasis status log, bukan status sekarang):
 *   Lolos QC    : old_status === 'pengeringan' && new_status ∈ ['siap',
 *                 'siap_diambil', 'siap_dikirim']
 *   Tidak Lolos : old_status === 'pengeringan' && new_status === 'not_ready'
 *
 * ⚠️ Filter "Saya": `buildOrderDetailsWhereClause` di repository belum mendukung
 * filter `employee_id` / `updated_by`, jadi penyaringan "hanya milik saya"
 * dilakukan di client berdasarkan `status_logs[].updated_by`.
 */

const QC_PASS_STATUSES = ["siap", "siap_diambil", "siap_dikirim"];

const TABS = [
  { key: "lolos", label: "Lolos QC" },
  { key: "tidak_lolos", label: "Tidak Lolos QC" },
];

const RESULT_BADGE = {
  lolos: { label: "Lolos QC", className: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  tidak_lolos: { label: "Tidak Lolos", className: "bg-red-50 border-red-200 text-red-600" },
};

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

/**
 * Semua log hasil QC untuk satu item sesuai tab.
 * Bisa lebih dari satu kalau item pernah gagal QC lalu dikerjakan ulang
 * dan diperiksa lagi.
 */
const getQCResultLogs = (item, tab) => {
  const logs = Array.isArray(item?.status_logs) ? item.status_logs : [];
  return logs.filter((log) => {
    if (log.old_status !== "pengeringan") return false;
    if (tab === "tidak_lolos") return log.new_status === "not_ready";
    return QC_PASS_STATUSES.includes(log.new_status);
  });
};

/** Log hasil QC TERAKHIR untuk tab yang sedang aktif. */
const getQCResultLog = (item, tab) => {
  const logs = getQCResultLogs(item, tab);
  return logs.length > 0 ? logs[logs.length - 1] : null;
};

const getQCResultLogTime = (item, tab) => {
  const time = new Date(getQCResultLog(item, tab)?.created_at).getTime();
  return isNaN(time) ? 0 : time;
};

/** Saring: wajib punya log QC sesuai tab, dan (kalau scope "mine") log itu milik user login. */
const applyClientFilters = (list, tab, scope, userId) =>
  list.filter((item) => {
    const log = getQCResultLog(item, tab);
    if (!log) return false;
    if (scope === "mine") {
      if (userId === undefined || userId === null) return false;
      return Number(log.updated_by) === Number(userId);
    }
    return true;
  });

/** Urutkan: pemeriksaan terbaru di atas. */
const sortByQCResultLog = (list, tab) =>
  [...list].sort((a, b) => getQCResultLogTime(b, tab) - getQCResultLogTime(a, tab));

const QCHistoryModal = ({ isOpen, onClose, dateRange }) => {
  // Tab event QC: 'lolos' | 'tidak_lolos'
  const [tab, setTab] = useState("lolos");
  // 'all' = semua pemeriksa, 'mine' = hanya yang diperiksa user login
  const [scope, setScope] = useState("mine");

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
    async ({
      nextPage = 1,
      append = false,
      nextScope = "all",
      nextTab = "lolos",
      search = "",
    } = {}) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const profile = await getUserProfile();
        const tenantId = profile?.tenant?.id;
        const branchId = profile?.branch?.id;
        const currentUserId = profile?.user?.id;

        const startDate = formatDateForDB(resolvedRange.startDate);
        const endDate = formatDateForDB(resolvedRange.endDate);

        const filterObj = {};
        // Memakai `entry_date` (tanggal order masuk) — sama seperti antrian
        // aktif, karena repository belum mendukung filter berdasarkan tanggal
        // status berubah.
        filterObj.entry_date =
          startDate === endDate ? startDate : { gte: startDate, lte: endDate };
        // Kumpulan status yang mungkin disandang item yang PERNAH melewati QC.
        // `not_ready` ikut karena item gagal QC lalu dikerjakan ulang.
        // `not_yet` / `antrian` tidak mungkin punya log QC, jadi dibuang.
        filterObj["order_details.status"] = [
          "pengeringan",
          "siap",
          "siap_diambil",
          "siap_dikirim",
          "done",
          "not_ready",
          "on_progress",
        ];

        if (search && search.trim()) {
          filterObj.search = search.trim();
        }

        const params = {
          page: nextPage,
          pageSize: nextScope === "mine" ? PAGE_SIZE_MINE : PAGE_SIZE_ALL,
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
        setHasNextPage((pagination?.currentPage || 1) < (pagination?.totalPages || 1));
        setPage(nextPage);
        setItems((prev) => {
          const merged = append ? [...prev, ...flat] : flat;
          return sortByQCResultLog(
            applyClientFilters(merged, nextTab, nextScope, currentUserId),
            nextTab
          );
        });
      } catch (error) {
        console.error("[ERROR] QCHistoryModal (web) - gagal memuat riwayat QC:", error);
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
    fetchHistory({
      nextPage: 1,
      append: false,
      nextScope: scope,
      nextTab: tab,
      search: appliedSearch,
    });
  }, [isOpen, tab, scope, appliedSearch, fetchHistory]);

  // Satu halaman API bisa kosong setelah difilter padahal masih ada halaman
  // berikutnya → ambil otomatis.
  useEffect(() => {
    if (!isOpen || loading || loadingMore) return;
    if (items.length === 0 && hasNextPage) {
      fetchHistory({
        nextPage: page + 1,
        append: true,
        nextScope: scope,
        nextTab: tab,
        search: appliedSearch,
      });
    }
  }, [
    isOpen,
    items.length,
    hasNextPage,
    loading,
    loadingMore,
    page,
    fetchHistory,
    scope,
    tab,
    appliedSearch,
  ]);

  const handleApplySearch = () => setAppliedSearch(searchInput.trim());

  const handleClearSearch = () => {
    setSearchInput("");
    setAppliedSearch("");
  };

  const handleLoadMore = () => {
    if (!hasNextPage || loadingMore || loading) return;
    fetchHistory({
      nextPage: page + 1,
      append: true,
      nextScope: scope,
      nextTab: tab,
      search: appliedSearch,
    });
  };

  const handleOpenPhotos = (item) => {
    setSelectedOrderDetail(item);
    setShowPhotoHistory(true);
  };

  if (!isOpen) return null;

  const isFail = tab === "tidak_lolos";
  const badge = RESULT_BADGE[tab] || RESULT_BADGE.lolos;

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
              <ClipboardCheck className="w-5 h-5 text-white flex-shrink-0" />
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white leading-tight">
                  Riwayat QC
                </h2>
                <p className="text-xs text-white/90 leading-tight">
                  Item yang sudah diperiksa QC
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

          {/* Tab hasil QC: Lolos / Tidak Lolos */}
          <div className="flex gap-2 px-4 pt-3 flex-shrink-0">
            {TABS.map(({ key, label }) => {
              const isActive = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#3B82F6] text-white shadow-lg shadow-blue-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Scope filter: Saya / Semua */}
          <div className="flex gap-2 px-4 pt-2 flex-shrink-0">
            {[
              { key: "mine", label: "Saya", Icon: User },
              { key: "all", label: "Semua", Icon: Users },
            ].map(({ key, label, Icon }) => {
              const isActive = scope === key;
              return (
                <button
                  key={key}
                  onClick={() => setScope(key)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                    isActive
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-gray-100 border-transparent text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="w-3 h-3" />
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
                {isFail ? (
                  <XCircle className="w-11 h-11 text-gray-300 mb-3" />
                ) : (
                  <ClipboardCheck className="w-11 h-11 text-gray-300 mb-3" />
                )}
                <p className="text-sm font-semibold text-gray-700">Belum ada riwayat</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  {appliedSearch
                    ? "Tidak ada item yang cocok dengan pencarian."
                    : scope === "mine"
                      ? `Belum ada item yang ${isFail ? "tidak lolos" : "lolos"} QC olehmu pada rentang tanggal ini.`
                      : `Belum ada item yang ${isFail ? "tidak lolos" : "lolos"} QC pada rentang tanggal ini.`}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {items.map((item) => {
                  const firstPhoto = item.shoes_photos?.[0]?.url_photo;
                  const thumbnailUrl = firstPhoto
                    ? getThumbnailUrl(getPhotoUrl(firstPhoto))
                    : null;
                  const resultLog = getQCResultLog(item, tab);
                  const photoCount = item.shoes_photos?.length || 0;

                  return (
                    <div
                      key={`${tab}-${item.id}`}
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
                            <span
                              className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold flex-shrink-0 ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </div>

                          <p className="text-xs text-gray-600 truncate mt-0.5">
                            {item.item?.brand || item.item?.name || "Item"}
                            {item.treatment?.name ? ` · ${item.treatment.name}` : ""}
                          </p>

                          <p className="flex items-center gap-1 text-[11px] text-gray-500 mt-1">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                              Jadwal{" "}
                              {safeFormatDate(
                                item.due_date || item.order?.entry_date,
                                "dd MMM yyyy"
                              )}
                            </span>
                          </p>

                          <p className="flex items-center gap-1 text-[11px] mt-0.5 flex-wrap">
                            {isFail ? (
                              <XCircle className="w-3 h-3 text-red-600 flex-shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            )}
                            <span
                              className={`font-semibold ${
                                isFail ? "text-red-600" : "text-emerald-600"
                              }`}
                            >
                              {isFail ? "Tidak lolos dicek" : "Lolos dicek"} ·{" "}
                              {safeFormatDate(resultLog?.created_at, "dd MMM yyyy, HH:mm")}
                            </span>
                          </p>

                          <p className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5 flex-wrap">
                            <User className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                              oleh {resultLog?.updated_by_name || "Tidak diketahui"}
                            </span>
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

export default QCHistoryModal;
