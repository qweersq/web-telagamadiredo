import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  ShieldQuestion,
  X,
  XCircle,
} from "lucide-react";
import Header from "../../components/Com Header/Header";
import instance from "../../config/api";
import { branchService } from "../../services/branchService";

/**
 * Halaman "Lihat Absensi Karyawan" untuk supervisor.
 *
 * Sumber data: `GET /attendance-monitor?date=YYYY-MM-DD&branch_id=`
 *  - satu tanggal + filter outlet (sesuai permintaan owner)
 *  - urutan sudah dari server: skor AI TERENDAH → TERTINGGI, sehingga baris
 *    yang paling perlu dicek manusia ada di paling atas
 *  - baris tanpa skor AI (belum ada foto / verifikasi dilewati) di paling bawah
 *
 * Detail per baris (foto masuk/pulang + alasan AI) dibuka lewat modal.
 */

const fmtTime = (value) => (value ? String(value).substring(0, 5) : "—");

const fmtDateLong = (value) => {
  if (!value) return "";
  try {
    return format(new Date(`${value}T00:00:00`), "EEEE, d MMMM yyyy", { locale: localeId });
  } catch {
    return value;
  }
};

const parseRaw = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const VERDICT_STYLE = {
  verified: {
    label: "Cocok",
    chip: "bg-telaga-50 text-telaga-700 ring-1 ring-telaga-100",
    icon: CheckCircle2,
  },
  review: {
    label: "Perlu dicek",
    chip: "bg-senja-50 text-senja-700 ring-1 ring-senja-100",
    icon: ShieldQuestion,
  },
  reject: {
    label: "Tidak cocok",
    chip: "bg-red-50 text-red-700 ring-1 ring-red-100",
    icon: XCircle,
  },
};

const getVerdict = (verdict) =>
  VERDICT_STYLE[verdict] || {
    label: "Belum dinilai",
    chip: "bg-telaga-900/5 text-telaga-900/50 ring-1 ring-telaga-100",
    icon: AlertTriangle,
  };

const scoreTone = (score) => {
  if (score == null) return "text-telaga-900/35";
  if (score >= 80) return "text-telaga-700";
  if (score >= 60) return "text-senja-600";
  return "text-red-600";
};

// Skor terendah dari dua sesi (masuk & pulang) — dasar pengurutan di backend.
const lowestScore = (row) => {
  const values = [row.ai_clock_in_score, row.ai_clock_out_score].filter(
    (v) => v !== null && v !== undefined
  );
  if (values.length === 0) return null;
  return Math.min(...values);
};

const MonitorAbsensi = () => {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [branchId, setBranchId] = useState("");
  const [search, setSearch] = useState("");

  const [branches, setBranches] = useState([]);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  // ---------- Daftar outlet ----------
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await branchService.getBranches();
        if (res?.success && Array.isArray(res.data)) {
          setBranches(res.data.map((b) => ({ id: b.id, name: b.name })));
        }
      } catch (err) {
        console.error("❌ MonitorAbsensi - Gagal memuat outlet:", err);
      }
    };
    loadBranches();
  }, []);

  // ---------- Data absensi ----------
  const fetchData = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("date", date);
      if (branchId) params.append("branch_id", branchId);

      const res = await instance.get(`/attendance-monitor?${params.toString()}`);
      if (res.data?.success) {
        setRows(res.data.data?.absents || []);
        setSummary(res.data.data?.summary || null);
      } else {
        setRows([]);
        setSummary(null);
        setError("Gagal memuat data absensi.");
      }
    } catch (err) {
      console.error("❌ MonitorAbsensi - Gagal memuat absensi:", err);
      setRows([]);
      setSummary(null);
      setError(
        err?.response?.data?.message || "Gagal memuat data absensi. Coba lagi."
      );
    } finally {
      setLoading(false);
    }
  }, [date, branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Pencarian nama dilakukan di klien supaya tidak menembak API tiap ketikan.
  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      String(row.employee_absent?.name || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  const cards = [
    { key: "total", label: "Total baris", value: summary?.total ?? 0, tone: "text-telaga-950" },
    { key: "reject", label: "Tidak cocok", value: summary?.reject ?? 0, tone: "text-red-600" },
    { key: "review", label: "Perlu dicek", value: summary?.review ?? 0, tone: "text-senja-600" },
    { key: "verified", label: "Cocok", value: summary?.verified ?? 0, tone: "text-telaga-700" },
    { key: "no_ai", label: "Tanpa AI", value: summary?.no_ai ?? 0, tone: "text-telaga-900/40" },
  ];

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-krem font-montserrat">
      <Header showBackButton backPath="/berandasupervisor" />

      <main className="flex-1 overflow-y-auto pb-10">
        <div className="mx-auto max-w-[1200px] px-4 pb-6 pt-[4.5rem] md:px-10">
          {/* Judul + periode */}
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-telaga-950">Absensi Karyawan</h1>
              <p className="truncate text-[11px] text-telaga-900/45">{fmtDateLong(date)}</p>
            </div>
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-telaga-100 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-telaga-700 transition-colors hover:border-telaga-300 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Muat ulang
            </button>
          </div>

          {/* Filter */}
          <div className="mb-3 rounded-2xl border border-telaga-100 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="min-w-0 flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-telaga-100 bg-krem/50 px-3 py-2 text-sm font-semibold text-telaga-950 outline-none focus:border-telaga-400"
                />
              </div>
              <div className="min-w-0 flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                  Outlet
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-telaga-100 bg-krem/50 px-3 py-2 text-sm font-semibold text-telaga-950 outline-none focus:border-telaga-400"
                >
                  <option value="">Semua outlet</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0 flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                  Cari karyawan
                </label>
                <div className="relative mt-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-telaga-900/30" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Nama karyawan"
                    className="w-full rounded-xl border border-telaga-100 bg-krem/50 py-2 pl-8 pr-3 text-sm text-telaga-950 outline-none focus:border-telaga-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ringkasan */}
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {cards.map((card) => (
              <div
                key={card.key}
                className="rounded-xl border border-telaga-100 bg-white px-3 py-2.5 shadow-sm"
              >
                <p className="text-[9px] font-semibold uppercase tracking-wide text-telaga-900/40">
                  {card.label}
                </p>
                <p className={`text-lg font-bold tabular-nums ${card.tone}`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Tabel */}
          <div className="overflow-hidden rounded-2xl border border-telaga-100 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-telaga-100 bg-telaga-50/60 px-4 py-2.5">
              <p className="text-[11px] font-bold text-telaga-900">Daftar absensi</p>
              <p className="text-[10px] text-telaga-900/45">
                Urut skor AI terendah → tertinggi
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-telaga-900/50">
                <Loader2 className="h-4 w-4 animate-spin" /> Memuat data…
              </div>
            ) : error ? (
              <div className="p-4">
                <div className="rounded-xl bg-red-50 px-3 py-2.5 text-[11px] text-red-700 ring-1 ring-red-100">
                  {error}
                </div>
              </div>
            ) : visibleRows.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <Camera className="mx-auto mb-2 h-8 w-8 text-telaga-200" />
                <p className="text-sm font-semibold text-telaga-900/60">
                  Tidak ada absensi
                </p>
                <p className="mt-0.5 text-[11px] text-telaga-900/35">
                  Belum ada data untuk tanggal &amp; outlet yang dipilih
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px]">
                  <thead>
                    <tr className="border-b border-telaga-100 bg-white">
                      <th className="w-10 px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                        No
                      </th>
                      <th className="min-w-[160px] px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                        Karyawan
                      </th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                        Masuk
                      </th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                        Pulang
                      </th>
                      <th className="px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                        Foto
                      </th>
                      <th className="px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                        Skor AI
                      </th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                        Hasil AI
                      </th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-telaga-50">
                    {visibleRows.map((row, idx) => {
                      const lowest = lowestScore(row);
                      const verdict =
                        row.ai_clock_in_verdict === "reject" ||
                        row.ai_clock_out_verdict === "reject"
                          ? "reject"
                          : row.ai_clock_in_verdict === "review" ||
                            row.ai_clock_out_verdict === "review"
                          ? "review"
                          : row.ai_clock_in_verdict || row.ai_clock_out_verdict;
                      const v = getVerdict(verdict);
                      const VIcon = v.icon;

                      return (
                        <tr key={row.id} className="transition-colors hover:bg-telaga-50/40">
                          <td className="px-3 py-2.5 text-[11px] text-telaga-900/35 tabular-nums">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="truncate text-xs font-bold text-telaga-950">
                              {row.employee_absent?.name || "—"}
                            </p>
                            <p className="truncate text-[10px] text-telaga-900/40">
                              {row.branch?.name || "—"}
                            </p>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="text-xs font-semibold text-telaga-950 tabular-nums">
                              {fmtTime(row.clock_in)}
                            </p>
                            {row.is_late && (
                              <p className="text-[9px] font-semibold text-senja-600">
                                telat {row.late_minutes || 0}m
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-xs font-semibold text-telaga-950 tabular-nums">
                            {fmtTime(row.clock_out)}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-center gap-1">
                              {row.photo_clock_in ? (
                                <img
                                  src={row.photo_clock_in}
                                  alt="Foto masuk"
                                  className="h-8 w-8 rounded-md object-cover ring-1 ring-telaga-100"
                                />
                              ) : (
                                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-telaga-900/5 text-[9px] text-telaga-900/30">
                                  —
                                </span>
                              )}
                              {row.photo_clock_out ? (
                                <img
                                  src={row.photo_clock_out}
                                  alt="Foto pulang"
                                  className="h-8 w-8 rounded-md object-cover ring-1 ring-telaga-100"
                                />
                              ) : (
                                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-telaga-900/5 text-[9px] text-telaga-900/30">
                                  —
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span
                                className={`text-sm font-bold tabular-nums ${scoreTone(
                                  row.ai_clock_in_score
                                )}`}
                              >
                                {row.ai_clock_in_score ?? "–"}
                              </span>
                              <span className="text-[9px] text-telaga-900/25">/</span>
                              <span
                                className={`text-sm font-bold tabular-nums ${scoreTone(
                                  row.ai_clock_out_score
                                )}`}
                              >
                                {row.ai_clock_out_score ?? "–"}
                              </span>
                            </div>
                            <p className="text-[9px] text-telaga-900/30">masuk / pulang</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${v.chip}`}
                            >
                              <VIcon className="h-2.5 w-2.5" />
                              {v.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedRow(row)}
                              className="rounded-lg bg-telaga-50 px-2.5 py-1.5 text-[10px] font-bold text-telaga-700 transition-colors hover:bg-telaga-100"
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="mt-2 text-center text-[10px] text-telaga-900/30">
            Skor 0–100. Semakin rendah, semakin besar kemungkinan foto absen tidak
            sesuai (tanggal, jam, lokasi, atau wajah).
          </p>
        </div>
      </main>

      {selectedRow && (
        <DetailAbsenModal row={selectedRow} onClose={() => setSelectedRow(null)} />
      )}
    </div>
  );
};

/* ============================================================
 * Modal detail: foto + hasil AI + bukti GPS
 * ============================================================ */
const DetailAbsenModal = ({ row, onClose }) => {
  const sessions = [
    {
      key: "in",
      title: "Absen Masuk",
      photo: row.photo_clock_in,
      time: row.clock_in,
      score: row.ai_clock_in_score,
      verdict: row.ai_clock_in_verdict,
      reason: row.ai_clock_in_reason,
      status: row.ai_clock_in_status,
      raw: parseRaw(row.ai_clock_in_raw),
      lat: row.clock_in_lat ?? row.latitude,
      lng: row.clock_in_lng ?? row.longitude,
      distance: row.clock_in_distance_m,
      expected: row.expected_clock_in,
    },
    {
      key: "out",
      title: "Absen Pulang",
      photo: row.photo_clock_out,
      time: row.clock_out,
      score: row.ai_clock_out_score,
      verdict: row.ai_clock_out_verdict,
      reason: row.ai_clock_out_reason,
      status: row.ai_clock_out_status,
      raw: parseRaw(row.ai_clock_out_raw),
      lat: row.clock_out_lat,
      lng: row.clock_out_lng,
      distance: row.clock_out_distance_m,
      expected: row.expected_clock_out,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-telaga-950/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-telaga-100 px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-telaga-950">
              {row.employee_absent?.name || "Karyawan"}
            </h2>
            <p className="truncate text-[10px] text-telaga-900/45">
              {fmtDateLong(row.date)} · {row.branch?.name || "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-telaga-900/40 transition-colors hover:bg-telaga-900/5 hover:text-telaga-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {sessions.map((s) => {
            const v = getVerdict(s.verdict);
            const VIcon = v.icon;
            const parts = s.raw?.parts || null;

            return (
              <div
                key={s.key}
                className="overflow-hidden rounded-2xl border border-telaga-100 bg-white"
              >
                <div className="flex items-center justify-between gap-2 border-b border-telaga-50 bg-telaga-50/60 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-telaga-700">
                    {s.title}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold tabular-nums ${scoreTone(s.score)}`}>
                      {s.score ?? "–"}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${v.chip}`}
                    >
                      <VIcon className="h-2.5 w-2.5" />
                      {v.label}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 p-3">
                  {s.photo ? (
                    <a
                      href={s.photo}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0"
                      title="Buka foto ukuran penuh"
                    >
                      <img
                        src={s.photo}
                        alt={`Foto ${s.title}`}
                        className="h-28 w-24 rounded-xl object-cover ring-1 ring-telaga-100"
                      />
                    </a>
                  ) : (
                    <div className="flex h-28 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-telaga-200 text-telaga-900/30">
                      <Camera className="h-4 w-4" />
                      <span className="text-[9px] font-semibold">Tanpa foto</span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      <Field label="Jam absen" value={fmtTime(s.time)} />
                      <Field label="Jadwal" value={fmtTime(s.expected)} />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {s.distance != null ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-telaga-50 px-2 py-0.5 text-[9px] font-semibold text-telaga-700">
                          <MapPin className="h-2.5 w-2.5" />
                          {Number(s.distance).toLocaleString("id-ID")} m dari kantor
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-telaga-900/5 px-2 py-0.5 text-[9px] font-semibold text-telaga-900/40">
                          <MapPin className="h-2.5 w-2.5" /> GPS tidak tercatat
                        </span>
                      )}
                      {s.status && (
                        <span className="rounded-full bg-telaga-900/5 px-2 py-0.5 text-[9px] font-semibold text-telaga-900/40">
                          AI: {s.status}
                        </span>
                      )}
                    </div>

                    {s.reason && (
                      <p className="rounded-lg bg-telaga-50/70 px-2 py-1.5 text-[10px] leading-relaxed text-telaga-900/70">
                        {s.reason}
                      </p>
                    )}
                  </div>
                </div>

                {parts && (
                  <div className="grid grid-cols-2 gap-1.5 border-t border-telaga-50 px-3 py-2 sm:grid-cols-4">
                    {["date", "time", "distance", "presence"].map((key) => {
                      const part = parts[key];
                      if (!part) return null;
                      const labels = {
                        date: "Tanggal",
                        time: "Jam",
                        distance: "Lokasi",
                        presence: "Wajah",
                      };
                      return (
                        <div key={key} className="rounded-lg bg-krem/70 px-2 py-1">
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-telaga-900/35">
                            {labels[key]}
                          </p>
                          <p className={`text-[11px] font-bold tabular-nums ${scoreTone(part.score)}`}>
                            {part.score}
                            <span className="text-[9px] font-medium text-telaga-900/30">
                              {" "}
                              · bobot {part.weight}
                            </span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {row.description && (
            <div className="rounded-xl bg-krem px-3 py-2 ring-1 ring-telaga-100">
              <p className="text-[9px] font-bold uppercase tracking-wide text-telaga-900/35">
                Catatan absen
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-telaga-900/70">
                {row.description}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-telaga-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-telaga-900/5 py-2.5 text-xs font-semibold text-telaga-900/60 transition-colors hover:bg-telaga-900/10"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value }) => (
  <div className="rounded-lg bg-krem/70 px-2 py-1">
    <p className="text-[9px] font-semibold uppercase tracking-wide text-telaga-900/35">
      {label}
    </p>
    <p className="text-[11px] font-bold text-telaga-950 tabular-nums">{value}</p>
  </div>
);

export default MonitorAbsensi;
