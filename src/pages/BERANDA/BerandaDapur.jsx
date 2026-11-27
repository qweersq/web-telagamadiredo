import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChefHat, RefreshCw, Printer, CheckCircle2, PlayCircle, Clock, Utensils, Store } from "lucide-react";
import dayjs from "dayjs";
import Header from "../../components/Com Header/Header";
import instance from "../../config/api";
import { thermalPrinterService } from "../../services/thermalPrinterService";
import { getBranchId, getUserProfile } from "../../utils/userProfileHelper";
import useOrderAlert from "../../hooks/useOrderAlert";
import OrderSoundToggle from "../../components/Notification/OrderSoundToggle";
import OrderAlertStack from "../../components/Notification/OrderAlertStack";

/**
 * Beranda Dapur — layar kerja untuk menyiapkan pesanan.
 *
 * Sumber data: GET /kitchen/tickets (dikelompokkan per dapur produksi).
 * Satu kartu = satu order di dapur ini. Status per item:
 *   antrian -> on_progress -> done
 *
 * Dapur pusat (mis. Cafe 1) otomatis melihat item dari outlet lain yang
 * `production_mode` produknya `central`, karena routing disimpan di
 * `order_details.production_branch_id`.
 */

const REFRESH_INTERVAL_MS = 20000;

const STATUS_TABS = [
  { key: "pending", label: "Perlu Dibuat" },
  { key: "on_progress", label: "Diproses" },
  { key: "done", label: "Selesai" },
];

const statusBadge = (status) => {
  if (status === "done") return "bg-telaga-100 text-telaga-800 ring-telaga-200";
  if (status === "on_progress") return "bg-senja-100 text-senja-800 ring-senja-200";
  return "bg-telaga-900/5 text-telaga-900/70 ring-telaga-100";
};

const statusLabel = (status) => {
  if (status === "done") return "Selesai";
  if (status === "on_progress") return "Diproses";
  return "Baru";
};

const BerandaDapur = () => {
  const [branchId, setBranchId] = useState(null);
  const [branchName, setBranchName] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [updatingIds, setUpdatingIds] = useState([]);
  const [printingOrderId, setPrintingOrderId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showAllDates, setShowAllDates] = useState(false);

  // Dipakai agar polling tidak menimpa state saat user sedang menekan tombol
  const isMountedRef = useRef(true);
  useEffect(() => () => { isMountedRef.current = false; }, []);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const [profile, storedBranchId] = await Promise.all([getUserProfile(), getBranchId()]);
        if (!active) return;
        const id = profile?.branch?.id || storedBranchId || null;
        setBranchId(id ? Number(id) : null);
        setBranchName(profile?.branch?.name || "");
      } catch (err) {
        console.error("❌ BerandaDapur - gagal memuat profil:", err);
        if (active) setError("Gagal memuat data cabang.");
      }
    };

    loadProfile();
    return () => { active = false; };
  }, []);

  const fetchTickets = useCallback(async (isManual = false) => {
    if (!branchId) return;
    if (isManual) setRefreshing(true);

    try {
      const res = await instance.get("/kitchen/tickets", {
        params: {
          branch_id: branchId,
          date: showAllDates ? "all" : dayjs().format("YYYY-MM-DD"),
        },
      });
      const payload = res?.data?.data;
      if (!isMountedRef.current) return;
      setTickets(payload?.tickets || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("❌ BerandaDapur - gagal memuat tiket:", err);
      if (isMountedRef.current) setError("Gagal memuat daftar pesanan. Coba muat ulang.");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    }
  }, [branchId, showAllDates]);

  useEffect(() => {
    if (!branchId) return;
    setLoading(true);
    fetchTickets();

    const timer = setInterval(() => {
      if (document.visibilityState === "visible") fetchTickets();
    }, REFRESH_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") fetchTickets();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [branchId, fetchTickets]);

  // Notifikasi realtime: bel + kartu pesanan masuk, lalu langsung segarkan daftar.
  const { connected, toasts, dismissToast } = useOrderAlert({
    enabled: Boolean(branchId),
    onRefresh: () => fetchTickets(),
  });

  // Flatten: satu baris = satu item (qty bisa > 1 dari detail yang digabung)
  const rows = useMemo(() => {
    const list = [];
    tickets.forEach((ticket) => {
      (ticket.items || []).forEach((item) => {
        list.push({ ticket, item });
      });
    });
    return list.sort((a, b) => {
      const queueA = a.item.tag_number || 0;
      const queueB = b.item.tag_number || 0;
      return queueA - queueB;
    });
  }, [tickets]);

  const counts = useMemo(() => ({
    pending: rows.filter(({ item }) => item.status !== "done" && item.status !== "on_progress").length,
    on_progress: rows.filter(({ item }) => item.status === "on_progress").length,
    done: rows.filter(({ item }) => item.status === "done").length,
  }), [rows]);

  const visibleRows = useMemo(() => {
    if (activeTab === "on_progress") return rows.filter(({ item }) => item.status === "on_progress");
    if (activeTab === "done") return rows.filter(({ item }) => item.status === "done");
    return rows.filter(({ item }) => item.status !== "done" && item.status !== "on_progress");
  }, [rows, activeTab]);

  /**
   * Ubah status semua order_detail dalam satu baris tiket.
   * Satu baris bisa mewakili beberapa detail (digabung karena opsi sama).
   */
  const handleUpdateStatus = async (item, status) => {
    const ids = item.order_detail_ids || [];
    if (!ids.length) return;

    setUpdatingIds((prev) => [...prev, ...ids]);
    try {
      await Promise.all(
        ids.map((id) => instance.patch(`/kitchen/tickets/${id}/status`, { status })),
      );
      // Update lokal dulu supaya UI langsung responsif, lalu sinkronkan ulang.
      setTickets((prev) => prev.map((ticket) => ({
        ...ticket,
        items: (ticket.items || []).map((row) => {
          const sameRow = (row.order_detail_ids || []).some((id) => ids.includes(id));
          return sameRow ? { ...row, status } : row;
        }),
      })));
      fetchTickets();
    } catch (err) {
      console.error("❌ BerandaDapur - gagal ubah status:", err);
      alert(err?.response?.data?.message || "Gagal mengubah status. Coba lagi.");
    } finally {
      if (isMountedRef.current) {
        setUpdatingIds((prev) => prev.filter((id) => !ids.includes(id)));
      }
    }
  };

  const handlePrintTicket = async (orderId) => {
    setPrintingOrderId(orderId);
    try {
      const res = await instance.get(`/orders/${orderId}/kitchen-tickets`, {
        params: { branch_id: branchId },
      });
      const result = thermalPrinterService.printKitchenTickets(res?.data?.data?.tickets || []);
      if (result === false) throw new Error("Print dibatalkan");
      await result;
    } catch (err) {
      console.error("❌ BerandaDapur - gagal cetak tiket:", err);
      alert("Gagal mencetak tiket. Hubungkan printer lewat tombol Printer di menu cetak, lalu coba lagi.");
    } finally {
      if (isMountedRef.current) setPrintingOrderId(null);
    }
  };

  const renderItem = ({ ticket, item }) => {
    const isUpdating = (item.order_detail_ids || []).some((id) => updatingIds.includes(id));
    const done = item.status === "done";
    const inProgress = item.status === "on_progress";

    // Outlet asal pesanan. Kalau beda dengan dapur ini berarti titipan dapur pusat,
    // jadi ditandai lebih jelas supaya kasir dapur tidak tertukar.
    const sellingOutlet = ticket.selling_branch_name || null;
    const isFromOtherOutlet = Boolean(sellingOutlet)
      && ticket.selling_branch_id != null
      && ticket.production_branch_id != null
      && Number(ticket.selling_branch_id) !== Number(ticket.production_branch_id);

    return (
      <div
        key={`${ticket.order_id}-${item.treatment_id}-${(item.order_detail_ids || []).join("-")}`}
        className={`rounded-2xl border p-3 transition-colors ${done ? "border-telaga-100 bg-telaga-50/40" : "border-telaga-100 bg-white"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center justify-center min-w-[26px] h-6 px-1.5 rounded-lg bg-telaga-700 text-white text-xs font-bold">
                {item.qty}x
              </span>
              <h3 className={`font-semibold text-sm text-telaga-950 ${done ? "line-through decoration-telaga-400/60" : ""}`}>
                {item.treatment_name}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 ${statusBadge(item.status)}`}>
                {statusLabel(item.status)}
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-telaga-900/60">
              {sellingOutlet && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ring-1 ${
                    isFromOtherOutlet
                      ? "bg-senja-50 text-senja-800 ring-senja-200"
                      : "bg-telaga-50 text-telaga-700 ring-telaga-100"
                  }`}
                >
                  <Store className="w-3 h-3" />
                  {isFromOtherOutlet ? `Dari ${sellingOutlet}` : `Outlet ${sellingOutlet}`}
                </span>
              )}
              {item.tag_number != null && (
                <span className="font-semibold text-telaga-700">Antrian #{item.tag_number}</span>
              )}
              {item.serve_mode && (
                <span className="inline-flex items-center gap-1">
                  <Utensils className="w-3 h-3" />
                  {item.serve_mode}
                </span>
              )}
              {ticket.table_number && <span>Meja {ticket.table_number}</span>}
              {ticket.customer_name && <span>{ticket.customer_name}</span>}
            </div>

            {(item.options || []).length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {item.options.map((option) => (
                  <li key={option} className="text-[11px] text-telaga-800/80">• {option}</li>
                ))}
              </ul>
            )}

            {item.note && (
              <p className="mt-1.5 text-[11px] text-senja-800 bg-senja-50 ring-1 ring-senja-100 rounded-lg px-2 py-1">
                Catatan: {item.note}
              </p>
            )}
          </div>

          <div className="flex-shrink-0">
            {!done && (
              <button
                onClick={() => handleUpdateStatus(item, inProgress ? "done" : "on_progress")}
                disabled={isUpdating}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold text-white transition-colors disabled:opacity-50 ${inProgress ? "bg-telaga-700 hover:bg-telaga-800" : "bg-senja-600 hover:bg-senja-700"}`}
              >
                {inProgress ? <CheckCircle2 className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                {isUpdating ? "..." : inProgress ? "Selesai" : "Mulai"}
              </button>
            )}
            {done && (
              <button
                onClick={() => handleUpdateStatus(item, "antrian")}
                disabled={isUpdating}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold text-telaga-700 bg-telaga-100 hover:bg-telaga-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Batalkan
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-krem font-montserrat">
      <Header />

      <main className="flex-1 overflow-y-auto pb-10">
        <div className="mx-auto px-4 md:px-10 pt-10 pb-6">
          <div className="max-w-[390px] md:max-w-4xl mx-auto mt-[50px] space-y-4">

            {/* Ringkasan dapur */}
            <section className="rounded-2xl border border-telaga-100 bg-white p-4 shadow-sm shadow-telaga-900/5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-telaga-100 text-telaga-700 shrink-0">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-telaga-900/45">Dapur</p>
                    <h1 className="text-sm font-semibold text-telaga-950 truncate">
                      {branchName || "Dapur Telaga"}
                    </h1>
                    <p className="text-[11px] text-telaga-900/50">
                      {dayjs().format("DD MMM YYYY")}
                      {lastUpdated ? ` · diperbarui ${dayjs(lastUpdated).format("HH:mm")}` : ""}
                      {connected ? " · realtime" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <OrderSoundToggle />
                  <button
                    onClick={() => setShowAllDates((prev) => !prev)}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-colors ${showAllDates ? "bg-telaga-700 text-white" : "bg-telaga-50 text-telaga-700 hover:bg-telaga-100"}`}
                    title={showAllDates ? "Tampilkan hanya hari ini" : "Tampilkan termasuk hari sebelumnya"}
                  >
                    {showAllDates ? "Semua" : "Hari ini"}
                  </button>
                  <button
                    onClick={() => fetchTickets(true)}
                    disabled={refreshing || !branchId}
                    className="p-2 rounded-xl text-telaga-700 bg-telaga-50 hover:bg-telaga-100 transition-colors disabled:opacity-50"
                    title="Muat ulang"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {STATUS_TABS.map((tab) => (
                  <div key={tab.key} className="rounded-xl bg-telaga-50/70 px-2 py-2 text-center">
                    <p className="text-base font-bold text-telaga-900">{counts[tab.key]}</p>
                    <p className="text-[10px] text-telaga-900/50">{tab.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Tab status */}
            <div className="flex gap-1.5 p-1 rounded-xl bg-white border border-telaga-100">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-bold transition-all ${activeTab === tab.key ? "bg-telaga-700 text-white shadow-sm" : "text-telaga-900/50 hover:text-telaga-900/70"}`}
                >
                  {tab.label}
                  <span className={`px-1.5 rounded-full text-[10px] ${activeTab === tab.key ? "bg-white/20" : "bg-telaga-900/5"}`}>
                    {counts[tab.key]}
                  </span>
                </button>
              ))}
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            {/* Daftar pesanan */}
            {loading ? (
              <div className="space-y-2 animate-pulse">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-telaga-100/60" />
                ))}
              </div>
            ) : visibleRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-6 rounded-2xl border border-dashed border-telaga-200 bg-white/60">
                <ChefHat className="w-12 h-12 text-telaga-200 mb-3" />
                <p className="text-sm font-semibold text-telaga-900/70">Tidak ada pesanan</p>
                <p className="text-[11px] text-telaga-900/45 text-center mt-1">
                  {activeTab === "done"
                    ? "Belum ada item yang selesai hari ini."
                    : "Semua pesanan untuk dapur ini sudah ditangani."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleRows.map(renderItem)}
              </div>
            )}

            {/* Cetak ulang tiket per order */}
            {!loading && tickets.length > 0 && (
              <section className="rounded-2xl border border-telaga-100 bg-white p-3">
                <p className="text-[10px] uppercase tracking-wider text-telaga-900/45 mb-2">
                  Cetak ulang tiket
                </p>
                <div className="space-y-1.5">
                  {tickets.map((ticket) => (
                    <div key={ticket.order_id} className="flex items-center justify-between gap-2 rounded-xl bg-telaga-50/70 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-telaga-950 truncate">
                          {ticket.customer_name || "Tanpa Nama"}
                        </p>
                        <p className="text-[10px] text-telaga-900/60 truncate">
                          {ticket.order_code || `Order #${ticket.order_id}`}
                          {` · ${ticket.total_qty} item`}
                          {ticket.table_number ? ` · Meja ${ticket.table_number}` : ""}
                          {ticket.selling_branch_name && ticket.selling_branch_name !== ticket.production_branch_name
                            ? ` · dari ${ticket.selling_branch_name}`
                            : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => handlePrintTicket(ticket.order_id)}
                        disabled={printingOrderId === ticket.order_id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-telaga-700 bg-white ring-1 ring-telaga-200 hover:bg-telaga-50 transition-colors disabled:opacity-50 shrink-0"
                      >
                        {printingOrderId === ticket.order_id
                          ? <Clock className="w-3 h-3 animate-spin" />
                          : <Printer className="w-3 h-3" />}
                        Cetak
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      <OrderAlertStack
        toasts={toasts}
        onDismiss={dismissToast}
        onSelect={() => setActiveTab("pending")}
      />
    </div>
  );
};

export default BerandaDapur;
