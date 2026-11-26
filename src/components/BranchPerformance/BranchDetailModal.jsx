import { useCallback, useEffect, useState } from "react";
import { getOperationalReport } from "../../pages/OPERASIONAL/api/operationalApi";
import AnimatedButton from "../Design/AnimatedButton";
import { formatCurrency, formatNumber } from "../../utils/labelFormatter";
import EmployeePerformancePanel from "../EmployeePerformance/EmployeePerformancePanel";

/**
 * Detail satu outlet untuk beranda Supervisor.
 *
 * Ada 2 tab:
 *  1. "Ringkasan" — sumber data `GET /operational/report?branch_id=&start_date=&end_date=`
 *     (endpoint yang SAMA dipakai halaman "Laporan Operasional" milik owner).
 *  2. "Kinerja Karyawan" — sumber data `GET /employee-daily-report?start_date=&end_date=&branch_id=`
 *     lewat komponen `EmployeePerformancePanel` yang juga dipakai halaman
 *     "Laporan Kinerja" milik owner. Angka-angkanya ikut rentang tanggal filter beranda.
 *
 * ⚠️ Batas data supervisor: hanya data OPERASIONAL outlet (omzet, order, layanan,
 * item, pelanggan, diskon) + aktivitas karyawan. Sengaja TIDAK menampilkan uang
 * keluar / beban / gaji / laba / kas — itu ranah owner (Laporan Keuangan).
 *
 * Props:
 * - isOpen      : boolean
 * - onClose     : () => void
 * - branch      : objek outlet (butuh `id`, `name`, `branch_type`, `status`)
 * - dateRange   : { startDate: 'yyyy-MM-dd', endDate: 'yyyy-MM-dd' }
 * - periodLabel : teks periode, mis. "1 – 31 Okt 2026"
 */
const BranchDetailModal = ({ isOpen, onClose, branch, dateRange, periodLabel = "" }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [activeTab, setActiveTab] = useState("ringkasan");

  const branchId = branch?.id;
  const startDate = dateRange?.startDate;
  const endDate = dateRange?.endDate;

  const fetchReport = useCallback(async () => {
    if (!isOpen || !branchId || !startDate || !endDate) return;

    setLoading(true);
    setError(null);
    try {
      const response = await getOperationalReport({
        branch_id: branchId,
        start_date: startDate,
        end_date: endDate,
      });

      if (response?.success) {
        setReport(response.data);
      } else {
        throw new Error(response?.error?.message || "Gagal memuat laporan operasional");
      }
    } catch (err) {
      console.error("❌ BranchDetailModal - Gagal memuat detail outlet:", err);
      setError(err?.message || "Gagal memuat data outlet");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [isOpen, branchId, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Bersihkan data lama saat modal ditutup supaya tidak "berkedip" data outlet sebelumnya
  useEffect(() => {
    if (!isOpen) {
      setReport(null);
      setActiveTab("ringkasan");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const summary = report?.summary || {};
  const topServices = Array.isArray(report?.top_services) ? report.top_services.slice(0, 5) : [];
  const topItems = Array.isArray(report?.item_analysis) ? report.item_analysis.slice(0, 5) : [];

  const isMitra = branch?.branch_type === "mitra";

  const metrics = [
    {
      label: "Omzet",
      value: formatCurrency(summary.total_revenue || 0),
      className: "text-telaga-800",
      bg: "bg-telaga-50",
    },
    {
      label: "Total Order",
      value: formatNumber(summary.total_orders || 0),
      className: "text-telaga-700",
      bg: "bg-telaga-50/70",
    },
    {
      label: "Total Layanan",
      value: formatNumber(summary.total_services || 0),
      className: "text-telaga-700",
      bg: "bg-telaga-50/70",
    },
    {
      label: "Total Item",
      value: formatNumber(summary.total_items || 0),
      className: "text-senja-700",
      bg: "bg-senja-50",
    },
    {
      label: "Pelanggan",
      value: formatNumber(summary.total_customers || 0),
      className: "text-telaga-700",
      bg: "bg-telaga-50/70",
    },
    {
      label: "Pelanggan Baru",
      value: formatNumber(summary.total_new_customers || 0),
      className: "text-telaga-600",
      bg: "bg-telaga-50/70",
    },
    {
      label: "Total Diskon",
      value: formatCurrency(summary.total_discounts || 0),
      className: "text-senja-700",
      bg: "bg-senja-50",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-telaga-950/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-telaga-100 bg-white shadow-2xl">
        {/* Header */}
        <div className="relative shrink-0 bg-gradient-to-br from-telaga-700 via-telaga-800 to-telaga-950 px-5 py-4">
          <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-senja-400/25 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-white font-montserrat">
                {branch?.name || "Detail Outlet"}
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold font-montserrat ${
                    isMitra
                      ? "bg-senja-400/20 text-senja-100 ring-1 ring-senja-300/30"
                      : "bg-white/15 text-white ring-1 ring-white/25"
                  }`}
                >
                  {isMitra ? "Mitra" : "Utama"}
                </span>
                {periodLabel && (
                  <span className="text-[11px] text-white/70 font-montserrat">{periodLabel}</span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-white transition-colors hover:bg-white/20"
              aria-label="Tutup detail outlet"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="shrink-0 border-b border-telaga-100 px-4 py-2">
          <div className="flex items-center gap-1.5">
            {[
              { id: "ringkasan", label: "Ringkasan" },
              { id: "kinerja", label: "Kinerja Karyawan" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold font-montserrat transition-all active:scale-95 ${
                    isActive
                      ? "bg-telaga-700 text-white shadow-sm shadow-telaga-700/25"
                      : "border border-telaga-100 bg-telaga-50/60 text-telaga-700 hover:bg-telaga-50"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body — tab Ringkasan */}
        {activeTab === "ringkasan" && (
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-[68px] animate-pulse rounded-xl bg-telaga-50" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center">
                <p className="text-sm text-red-600 font-montserrat">{error}</p>
                <button
                  onClick={fetchReport}
                  className="mt-3 rounded-xl bg-telaga-700 px-4 py-2 text-xs font-semibold text-white font-montserrat transition-colors hover:bg-telaga-800"
                >
                  Coba Lagi
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Ringkasan operasional */}
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {metrics.map((metric) => (
                    <div key={metric.label} className={`${metric.bg} rounded-xl p-3`}>
                      <p className="text-[10px] uppercase tracking-wide text-telaga-900/40 font-montserrat">
                        {metric.label}
                      </p>
                      <p className={`mt-0.5 truncate text-sm font-bold font-montserrat ${metric.className}`}>
                        {metric.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Layanan terpopuler */}
                <div>
                  <h4 className="mb-2.5 text-sm font-bold text-telaga-950 font-montserrat">
                    Layanan Terpopuler
                  </h4>
                  {topServices.length > 0 ? (
                    <div className="space-y-2">
                      {topServices.map((service, index) => (
                        <div
                          key={`${service.treatment_name}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-telaga-100 bg-krem p-2.5"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-telaga-50 text-[11px] font-bold text-telaga-700">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-telaga-950 font-montserrat">
                                {service.treatment_name}
                              </p>
                              <p className="truncate text-[11px] text-telaga-900/45 font-montserrat">
                                {formatNumber(service.total_orders)} pesanan
                                {service.type_service ? ` · ${service.type_service}` : ""}
                              </p>
                            </div>
                          </div>
                          <p className="shrink-0 text-xs font-semibold text-telaga-900/80 font-montserrat">
                            {formatCurrency(service.total_revenue)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-telaga-200 bg-krem px-4 py-6 text-center">
                      <p className="text-xs text-telaga-900/55 font-montserrat">
                        Belum ada layanan pada periode ini
                      </p>
                    </div>
                  )}
                </div>

                {/* Item terbanyak */}
                <div>
                  <h4 className="mb-2.5 text-sm font-bold text-telaga-950 font-montserrat">
                    Item Terbanyak
                  </h4>
                  {topItems.length > 0 ? (
                    <div className="space-y-2">
                      {topItems.map((item, index) => (
                        <div
                          key={`${item.item_name}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-telaga-100 bg-krem p-2.5"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-senja-50 text-[11px] font-bold text-senja-700">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-telaga-950 font-montserrat">
                                {item.item_name}
                              </p>
                              <p className="truncate text-[11px] text-telaga-900/45 font-montserrat">
                                {formatNumber(item.total_treatments)} terjual
                                {item.brand ? ` · ${item.brand}` : ""}
                              </p>
                            </div>
                          </div>
                          <p className="shrink-0 text-xs font-semibold text-telaga-900/80 font-montserrat">
                            {formatCurrency(item.total_revenue)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-telaga-200 bg-krem px-4 py-6 text-center">
                      <p className="text-xs text-telaga-900/55 font-montserrat">
                        Belum ada item pada periode ini
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Body — tab Kinerja Karyawan */}
        {activeTab === "kinerja" && (
          <div className="flex-1 overflow-y-auto p-4">
            <EmployeePerformancePanel
              branchId={branchId || ""}
              startDate={startDate}
              endDate={endDate}
              branchName={branch?.name || ""}
              title="Kinerja Karyawan"
            />
          </div>
        )}

        {/* Footer */}
        <div className="shrink-0 border-t border-telaga-100 px-5 py-3">
          <AnimatedButton
            onClick={onClose}
            className="w-full rounded-xl bg-telaga-700 py-2.5 text-sm font-semibold text-white font-montserrat transition-colors hover:bg-telaga-800"
          >
            Tutup
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

export default BranchDetailModal;
