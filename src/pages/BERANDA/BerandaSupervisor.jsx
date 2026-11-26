import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, endOfMonth, startOfMonth } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Boxes, ChevronRight, ClipboardList, Users } from "lucide-react";
import Header from "../../components/Com Header/Header";
import DateRangePickerV2 from "../../components/DateRangePicker/DateRangePickerV2";
import BranchPerformanceList from "../../components/BranchPerformance/BranchPerformanceList";
import BranchDetailModal from "../../components/BranchPerformance/BranchDetailModal";
import { branchService } from "../../services/branchService";
import { getBranchesPerformance } from "../OPERASIONAL/api/operationalApi";
import {
  saveFilterToStorage,
  getFilterFromStorage,
  FILTER_TYPES,
  COMPONENT_NAMES,
} from "../../utils/filterStorage";

/**
 * Beranda Supervisor.
 *
 * Shell halaman ini sengaja dibuat identik dengan beranda lain
 * (admin / teknisi / kurir / owner) agar header & perilakunya seragam:
 *   - <Header /> fixed di atas → konten wajib punya `mt-[50px]` + `pt-10`
 *   - Header otomatis menampilkan badge peran ("Supervisor") di kiri
 *     (membuka modal "Pilih peran anda" + Ganti Outlet) dan nama user + menu
 *     di kanan, karena `/berandasupervisor` sudah masuk daftar isBerandaPage().
 *
 * Isi:
 *   1. Ringkasan outlet      → jumlah total / aktif
 *   2. Menu Tugas Harian     → hanya pintasan ke halaman /tugas-harian
 *                              (CRUD-nya ada di sana, bukan di beranda)
 *   3. Filter periode        → DateRangePickerV2 (pola sama dengan beranda Teknisi)
 *   4. "Top Outlet"          → daftar outlet diurutkan omzet tertinggi
 *      → datanya dari GET /operational/branches-performance?start_date=&end_date=
 *      → diklik: modal detail outlet (BranchDetailModal), datanya dari
 *        endpoint yang sama dengan "Laporan Operasional" milik owner:
 *        GET /operational/report?branch_id=&start_date=&end_date=
 *
 * ⚠️ Outlet aktif TIDAK lagi ditulis di isi konten — sudah pindah ke chip kecil
 * di tengah <Header /> (components/Com Header/BranchActiveChip.jsx), sama seperti
 * beranda role lain. Jangan tampilkan lagi di konten supaya tidak duplikat.
 *
 * Definisi angka (sengaja disamakan dengan yang dilihat owner supaya tidak ada
 * dua versi angka yang berbeda):
 *   - Omzet      → SUM(payments.final_price) via orders.payment_id, basis orders.entry_date
 *                  = sama dengan "Laporan Operasional" owner (semua order, termasuk yang belum dibayar)
 *   - Uang Masuk → buku besar (finance_transactions kategori 'credit'), basis tanggal uang diterima
 *                  = sama dengan kartu "Uang Masuk" di "Laporan Keuangan" owner
 *   - Layanan / Item → COUNT(order_details)
 *
 * ⚠️ Batas akses: beranda ini untuk SUPERVISOR. Sesuai keputusan owner, supervisor
 * boleh melihat data & omzet SEMUA outlet. Namun data keuangan perusahaan
 * (uang keluar, beban, gaji, laba) TETAP tidak ditampilkan di sini — itu ranah owner.
 */

// Periode default: bulan berjalan (sama dengan tombol "Bulan Ini" di DateRangePickerV2).
const getDefaultDateRange = () => {
  const saved = getFilterFromStorage(
    COMPONENT_NAMES.BERANDA_SUPERVISOR,
    FILTER_TYPES.DATE_FILTER
  );
  if (saved?.startDate && saved?.endDate) return saved;

  const today = new Date();
  return {
    startDate: format(startOfMonth(today), "yyyy-MM-dd"),
    endDate: format(endOfMonth(today), "yyyy-MM-dd"),
  };
};

// Label periode untuk chip di header list, mis. "1 – 31 Okt 2026"
const buildPeriodLabel = (range) => {
  if (!range?.startDate || !range?.endDate) return "";
  try {
    const start = new Date(`${range.startDate}T00:00:00`);
    const end = new Date(`${range.endDate}T00:00:00`);
    const sameMonth =
      start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

    if (sameMonth) {
      return `${format(start, "d", { locale: localeId })} – ${format(end, "d MMM yyyy", {
        locale: localeId,
      })}`;
    }
    return `${format(start, "d MMM", { locale: localeId })} – ${format(end, "d MMM yyyy", {
      locale: localeId,
    })}`;
  } catch (error) {
    return "";
  }
};

// ============================================================
// Komponen
// ============================================================
const BerandaSupervisor = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState(getDefaultDateRange);

  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Metrik per outlet: { [branch_id]: { revenue, cashIn, treatments, items, orders, delta } }
  // Semua key diambil dari endpoint, jadi outlet tanpa transaksi pun tetap dapat entri berisi 0.
  const [branchMetrics, setBranchMetrics] = useState({});
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Outlet yang sedang dibuka detailnya (modal)
  const [selectedBranch, setSelectedBranch] = useState(null);

  // ===== Daftar outlet =====
  const fetchBranches = useCallback(async () => {
    setLoadingBranches(true);
    try {
      // Endpoint: GET /tenants/:tenant_id/branches (tenant selalu dari token)
      const response = await branchService.getBranches();
      if (response?.success && Array.isArray(response.data)) {
        setBranches(response.data);
      } else {
        setBranches([]);
      }
    } catch (error) {
      console.error("❌ BerandaSupervisor - Gagal memuat daftar outlet:", error);
      setBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // ===== Metrik per outlet (omzet, uang masuk, layanan, item) =====
  //
  // Endpoint: GET /operational/branches-performance?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
  //   → { success: true, data: { [branch_id]: { revenue, cashIn, treatments, items, orders, delta } } }
  //
  // Definisi (mengikuti laporan KATSIKAT — dijaga persis di sisi server supaya
  // rumusnya hanya ada di satu tempat):
  //   - Omzet       = SUM(payments.final_price) lewat orders.payment_id, basis `orders.entry_date`
  //                   (semua order, termasuk yang belum dibayar) — sama dengan Laporan Operasional
  //   - Uang Masuk  = buku besar `finance_transactions` kategori 'credit' — sama dengan
  //                   kartu "Uang Masuk" di Laporan Keuangan owner
  //   - Total Layanan = COUNT(order_details)
  //   - Total Item    = COUNT(order_details WHERE item_id IS NOT NULL)
  //   - delta = % omzet vs periode pembanding (rentang sama panjang sebelumnya),
  //             `null` kalau outlet belum punya pembanding (outlet baru)
  //
  // Outlet tanpa transaksi tetap muncul karena server LEFT JOIN dari `branches`.
  const fetchBranchMetrics = useCallback(async () => {
    if (!dateRange?.startDate || !dateRange?.endDate) return;

    setLoadingMetrics(true);
    try {
      const response = await getBranchesPerformance({
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
      });

      if (response?.success && response.data) {
        setBranchMetrics(response.data);
      } else {
        setBranchMetrics({});
      }
    } catch (error) {
      console.error("❌ BerandaSupervisor - Gagal memuat performa outlet:", error);
      setBranchMetrics({});
    } finally {
      setLoadingMetrics(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchBranchMetrics();
  }, [fetchBranchMetrics]);

  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
    saveFilterToStorage(
      COMPONENT_NAMES.BERANDA_SUPERVISOR,
      FILTER_TYPES.DATE_FILTER,
      newRange,
      24 // jam
    );
  };

  const periodLabel = useMemo(() => buildPeriodLabel(dateRange), [dateRange]);

  // ===== Ringkasan outlet (data nyata dari daftar outlet) =====
  const branchSummary = useMemo(() => {
    const total = branches.length;
    const active = branches.filter((branch) => branch.status === "active").length;
    const mitra = branches.filter((branch) => branch.branch_type === "mitra").length;
    return { total, active, mitra };
  }, [branches]);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-krem font-montserrat">
      <Header />

      {/* Main Content dengan overflow scroll */}
      <main className="flex-1 overflow-y-auto pb-10">
        <div className="mx-auto px-4 md:px-10 pt-10 pb-6">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-[50px]">

            {/* Ringkasan Outlet */}
            <div className="mb-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-telaga-100 bg-white px-3 py-2.5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-telaga-900/40">
                  Total outlet
                </p>
                <p className="text-lg font-bold text-telaga-950">{branchSummary.total}</p>
              </div>
              <div className="rounded-xl border border-telaga-100 bg-white px-3 py-2.5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-telaga-900/40">
                  Aktif
                </p>
                <p className="text-lg font-bold text-telaga-700">{branchSummary.active}</p>
              </div>
              <div className="rounded-xl border border-telaga-100 bg-white px-3 py-2.5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-telaga-900/40">
                  Mitra
                </p>
                <p className="text-lg font-bold text-senja-700">{branchSummary.mitra}</p>
              </div>
            </div>

            {/* Menu — pintasan ke halaman terpisah (bukan CRUD di beranda) */}
            <div className="mb-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-telaga-900/40">
                Menu
              </p>
              <button
                onClick={() => navigate("/tugas-harian")}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-telaga-100 bg-white p-4 text-left shadow-sm transition-colors hover:border-telaga-300 hover:bg-telaga-50/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="rounded-lg bg-telaga-50 p-2 text-telaga-700">
                    <ClipboardList className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-telaga-950">Tugas Harian</p>
                    <p className="truncate text-[10px] text-telaga-900/45">
                      Buat, pantau, dan tugaskan pekerjaan karyawan
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-telaga-300" />
              </button>

              <button
                onClick={() => navigate("/monitor-absensi")}
                className="mt-1.5 flex w-full items-center justify-between gap-3 rounded-2xl border border-telaga-100 bg-white p-4 text-left shadow-sm transition-colors hover:border-telaga-300 hover:bg-telaga-50/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="rounded-lg bg-telaga-50 p-2 text-telaga-700">
                    <Users className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-telaga-950">Lihat Absensi Karyawan</p>
                    <p className="truncate text-[10px] text-telaga-900/45">
                      Cek jam absen, foto & hasil verifikasi AI
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-telaga-300" />
              </button>

              <button
                onClick={() => navigate("/stok-barang")}
                className="mt-1.5 flex w-full items-center justify-between gap-3 rounded-2xl border border-telaga-100 bg-white p-4 text-left shadow-sm transition-colors hover:border-telaga-300 hover:bg-telaga-50/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="rounded-lg bg-telaga-50 p-2 text-telaga-700">
                    <Boxes className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-telaga-950">Stok Barang</p>
                    <p className="truncate text-[10px] text-telaga-900/45">
                      Pantau sisa stok & pergerakan per outlet
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-telaga-300" />
              </button>
            </div>

            {/* Filter periode */}
            <DateRangePickerV2
              dateRange={dateRange}
              setDateRange={setDateRange}
              onDateChange={handleDateRangeChange}
              label="Periode laporan"
            />

            {/* Top Outlet */}
            <BranchPerformanceList
              branches={branches}
              metrics={branchMetrics}
              periodLabel={periodLabel}
              loading={loadingBranches || loadingMetrics}
              onOpenDetail={(branch) => setSelectedBranch(branch)}
            />
          </div>
        </div>
      </main>

      {/* Detail outlet — muncul saat baris Top Outlet diklik */}
      <BranchDetailModal
        isOpen={Boolean(selectedBranch)}
        onClose={() => setSelectedBranch(null)}
        branch={selectedBranch}
        dateRange={dateRange}
        periodLabel={periodLabel}
      />
    </div>
  );
};

export default BerandaSupervisor;
