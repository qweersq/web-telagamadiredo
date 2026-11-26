import { useEffect, useState } from "react";
import AnimatedButton from "../Design/AnimatedButton";
import InfoModal from "../Modal/InfoModal";
import { formatCurrency, formatNumber } from "../../utils/labelFormatter";

/**
 * Daftar performa outlet (Top Outlet) untuk beranda Supervisor.
 *
 * Tampilan sengaja dibuat satu pola dengan `TreatmentQueueV2` (daftar "Antrian Item"
 * di beranda Teknisi): kartu outline `rounded-3xl`, list peringkat bernomor,
 * tombol "Tampilkan Semua", dan baris total di bagian bawah.
 *
 * ⚠️ Komponen ini MURNI PRESENTASIONAL — tidak memanggil API sendiri.
 * Tujuannya supaya sumber datanya bisa diganti (endpoint agregasi baru, data dari
 * parent, dsb) tanpa menyentuh UI sama sekali.
 *
 * Props:
 * - branches    : array outlet (hasil `branchService.getBranches()`)
 * - metrics     : { [branch_id]: { revenue, cashIn, treatments, items, orders, delta } }
 *                 `revenue`    = omzet periode          `cashIn` = uang masuk periode
 *                 `treatments` = total layanan dikerjakan `items`  = total item
 *                 `orders`     = jumlah order            `delta`  = % vs periode sebelumnya
 *                 Semua boleh dikosongkan / sebagian → UI otomatis tampil "—"
 * - periodLabel : teks periode untuk chip & label total, mis. "1 – 15 Okt 2026"
 * - loading     : boolean
 * - onOpenDetail: (branch) => void — dipanggil saat baris diklik (opsional)
 */
const BranchPerformanceList = ({
  branches = [],
  metrics = {},
  periodLabel = "",
  loading = false,
  onOpenDetail,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Reset saat daftar berubah (mis. setelah ganti periode / ganti outlet)
  useEffect(() => {
    setShowAll(false);
  }, [branches]);

  const rows = (Array.isArray(branches) ? branches : [])
    .map((branch) => {
      const metric = metrics?.[branch.id] || {};
      const pick = (key) => (typeof metric[key] === "number" ? metric[key] : null);
      return {
        ...branch,
        revenue: pick("revenue"),
        cashIn: pick("cashIn"),
        treatments: pick("treatments"),
        items: pick("items"),
        orders: pick("orders"),
        delta: pick("delta"),
      };
    })
    .sort((a, b) => {
      // Peringkat: pendapatan tertinggi dulu. Outlet tanpa data ditaruh paling bawah.
      const aVal = a.revenue ?? -1;
      const bVal = b.revenue ?? -1;
      if (bVal !== aVal) return bVal - aVal;
      return (a.name || "").localeCompare(b.name || "");
    });

  const maxRevenue = rows.reduce((max, row) => Math.max(max, row.revenue ?? 0), 0);
  const totalRevenue = rows.reduce((sum, row) => sum + (row.revenue ?? 0), 0);
  const totalCashIn = rows.reduce((sum, row) => sum + (row.cashIn ?? 0), 0);
  const totalTreatments = rows.reduce((sum, row) => sum + (row.treatments ?? 0), 0);
  const totalItems = rows.reduce((sum, row) => sum + (row.items ?? 0), 0);
  const totalOrders = rows.reduce((sum, row) => sum + (row.orders ?? 0), 0);
  const hasAnyMetric = rows.some((row) => row.revenue !== null);

  const displayedRows = showAll ? rows : rows.slice(0, 5);

  const rankClass = (index) => {
    if (index === 0) return "bg-telaga-700 text-white";
    if (index === 1) return "bg-telaga-600 text-white";
    if (index === 2) return "bg-telaga-500 text-white";
    return "bg-telaga-50 text-telaga-700";
  };

  const getTypeLabel = (branch) => (branch.branch_type === "mitra" ? "Mitra" : "Utama");

  const getStatusLabel = (branch) => {
    switch (branch.status) {
      case "active":
        return "Aktif";
      case "maintenance":
        return "Maintenance";
      case "suspended":
        return "Suspended";
      case "inactive":
        return "Nonaktif";
      case "closed":
        return "Tutup";
      default:
        return branch.status || "-";
    }
  };

  return (
    <div className="mb-2 rounded-2xl border border-telaga-100 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-telaga-50 text-telaga-700">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20V10m6 10V4m6 16v-7m4 7H2" />
            </svg>
          </div>
          <h2 className="truncate text-sm font-bold text-telaga-950 font-montserrat">Top Outlet</h2>
          <button
            onClick={() => setShowInfoModal(true)}
            className="h-4 w-4 shrink-0 text-telaga-900/30 transition-colors hover:text-telaga-700"
            aria-label="Penjelasan Top Outlet"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>

        {periodLabel && (
          <span className="shrink-0 whitespace-nowrap rounded-full bg-telaga-50 px-2.5 py-1 text-[10px] font-semibold text-telaga-700 font-montserrat">
            {periodLabel}
          </span>
        )}
      </div>

      {/* List outlet */}
      <div className="mb-3 space-y-2">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-[92px] animate-pulse rounded-xl bg-telaga-50" />
            ))}
          </div>
        ) : displayedRows.length > 0 ? (
          displayedRows.map((branch, index) => {
            const percentage =
              maxRevenue > 0 && branch.revenue !== null ? (branch.revenue / maxRevenue) * 100 : 0;

            return (
              <div
                key={branch.id}
                className={`rounded-xl border border-telaga-100 bg-krem p-3 transition-colors hover:border-telaga-200 ${
                  onOpenDetail ? "cursor-pointer active:scale-[0.99]" : ""
                }`}
                onClick={() => onOpenDetail && onOpenDetail(branch)}
                role={onOpenDetail ? "button" : undefined}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${rankClass(index)}`}
                    >
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-telaga-950 font-montserrat">
                        {branch.name}
                      </h3>
                      <p className="truncate text-[11px] text-telaga-900/45 font-montserrat">
                        {getTypeLabel(branch)}
                        {branch.orders !== null && ` · ${formatNumber(branch.orders)} pesanan`}
                        {branch.status !== "active" && ` · ${getStatusLabel(branch)}`}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-telaga-950 font-montserrat">
                      {branch.revenue !== null ? formatCurrency(branch.revenue) : "—"}
                    </p>
                    {branch.delta !== null ? (
                      <span
                        className={`text-[11px] font-semibold font-montserrat ${
                          branch.delta >= 0 ? "text-telaga-600" : "text-red-500"
                        }`}
                      >
                        {branch.delta >= 0 ? "▲" : "▼"} {Math.abs(branch.delta).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-[11px] text-telaga-900/35 font-montserrat">
                        {hasAnyMetric ? "tanpa pembanding" : "menunggu data"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bar relatif terhadap outlet #1 */}
                {maxRevenue > 0 && branch.revenue !== null && (
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-telaga-100/70">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-telaga-600 to-telaga-400"
                      style={{ width: `${Math.max(percentage, branch.revenue > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                )}

                {/* Detail metrik outlet */}
                <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-telaga-100 pt-2.5">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-telaga-900/40 font-montserrat">
                      Uang Masuk
                    </p>
                    <p className="truncate text-xs font-semibold text-telaga-900/80 font-montserrat">
                      {branch.cashIn !== null ? formatCurrency(branch.cashIn) : "—"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-wide text-telaga-900/40 font-montserrat">
                      Layanan
                    </p>
                    <p className="truncate text-xs font-semibold text-telaga-900/80 font-montserrat">
                      {branch.treatments !== null ? formatNumber(branch.treatments) : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wide text-telaga-900/40 font-montserrat">
                      Item
                    </p>
                    <p className="truncate text-xs font-semibold text-telaga-900/80 font-montserrat">
                      {branch.items !== null ? formatNumber(branch.items) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-telaga-200 bg-krem px-6 py-8 text-center">
            <p className="text-xs text-telaga-900/55 font-montserrat">
              Belum ada outlet yang bisa ditampilkan
            </p>
          </div>
        )}
      </div>

      {/* Tampilkan semua */}
      {rows.length > 5 && (
        <div className="mb-3">
          <AnimatedButton
            onClick={() => setShowAll(!showAll)}
            className="flex w-full items-center justify-center rounded-xl border border-telaga-100 bg-telaga-50/70 py-2 text-xs font-semibold text-telaga-700 font-montserrat transition-colors hover:bg-telaga-50"
          >
            {showAll ? "Tampilkan Lebih Sedikit" : `Tampilkan Semua (${rows.length})`}
          </AnimatedButton>
        </div>
      )}

      {/* Total */}
      <div className="rounded-xl border border-telaga-100 bg-telaga-50/60 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-telaga-900/70 font-montserrat">
            Total omzet{periodLabel ? ` · ${periodLabel}` : ""}
          </p>
          <p className="text-sm font-bold text-telaga-800 font-montserrat">
            {hasAnyMetric ? formatCurrency(totalRevenue) : "—"}
          </p>
        </div>
        {hasAnyMetric && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-telaga-100 pt-2 text-[11px] text-telaga-900/45 font-montserrat">
            <span>
              Uang masuk:{" "}
              <span className="font-semibold text-telaga-900/80">{formatCurrency(totalCashIn)}</span>
            </span>
            <span>
              Layanan:{" "}
              <span className="font-semibold text-telaga-900/80">{formatNumber(totalTreatments)}</span>
            </span>
            <span>
              Item:{" "}
              <span className="font-semibold text-telaga-900/80">{formatNumber(totalItems)}</span>
            </span>
            {totalOrders > 0 && (
              <span>
                Pesanan:{" "}
                <span className="font-semibold text-telaga-900/80">{formatNumber(totalOrders)}</span>
              </span>
            )}
          </div>
        )}
      </div>

      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Cara Baca Top Outlet"
        items={[
          {
            title: "Peringkat",
            description:
              "Outlet diurutkan dari omzet tertinggi ke terendah pada periode yang dipilih. Outlet yang belum punya pesanan otomatis ada di paling bawah.",
            bgColor: "bg-telaga-50",
            dotColor: "bg-telaga-500",
            titleColor: "text-telaga-700",
          },
          {
            title: "Utama vs Mitra",
            description:
              "Utama = outlet milik sendiri. Mitra = outlet kerja sama / droppoint.",
            bgColor: "bg-krem",
            dotColor: "bg-telaga-400",
            titleColor: "text-telaga-800",
          },
          {
            title: "Angka per Outlet",
            description:
              "Omzet = total nilai pesanan pada periode ini (termasuk yang belum dibayar), sama dengan Laporan Operasional. Uang Masuk = uang yang benar-benar diterima menurut buku besar, sama dengan kartu Uang Masuk di Laporan Keuangan. Layanan = jumlah layanan/paket terjual, Item = jumlah tiket/barang terjual.",
            bgColor: "bg-senja-50",
            dotColor: "bg-senja-400",
            titleColor: "text-senja-700",
          },
          {
            title: "Angka Pembanding",
            description:
              "Tanda ▲ / ▼ menunjukkan perubahan omzet dibanding periode sebelumnya dengan panjang rentang yang sama. Kalau outlet belum punya data pembanding, muncul keterangan “tanpa pembanding”.",
            bgColor: "bg-telaga-50",
            dotColor: "bg-telaga-600",
            titleColor: "text-telaga-700",
          },
        ]}
        footerInfo={{
          icon: "🏆",
          text: "Baris total di bawah adalah gabungan seluruh outlet pada periode ini",
        }}
        maxWidth="max-w-lg"
      />
    </div>
  );
};

export default BranchPerformanceList;
