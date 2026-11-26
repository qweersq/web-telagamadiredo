import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  AlertTriangle,
  Camera,
  Check,
  ChevronDown,
  ClipboardList,
  Copy,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  Sparkles,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import InfoModal from "../Modal/InfoModal";
import ConfirmationModal from "../Modal/ConfirmationModal";
import PositionModal from "./PositionModal";
import { dailyTaskService } from "../../services/dailyTaskService";
import { getBranchId } from "../../utils/userProfileHelper";

/**
 * Panel "Tugas Harian" untuk beranda Supervisor.
 *
 * Alur (sesuai desain yang disepakati):
 *   cabang aktif → karyawan → tugas harian
 *
 * - Cabang default = cabang aktif di header (dibaca dari cache profil, tanpa
 *   request tambahan). Supervisor tetap boleh pindah cabang lewat dropdown.
 * - "Salin tugas sebelumnya" memanggil POST /daily-tasks/copy: server menyalin
 *   seluruh tugas dari tanggal terakhir yang punya tugas ke tanggal yang dibuka.
 * - Aman ditekan berkali-kali — tugas yang sudah ada tidak dibuat ulang.
 * - Tugas manual ditambahkan per karyawan, dengan opsi wajib foto bukti.
 * - Foto bukti (dari GPS Camera) dinilai AI: skor 0–100 + verdict
 *   verified / review / reject. Supervisor bisa menilai ulang atau menimpa
 *   verdict lewat lightbox foto. Foto tanpa watermark yang terbaca tidak
 *   pernah otomatis "reject" — selalu masuk "review".
 *
 * ⚠️ Komponen ini memuat datanya sendiri (bukan presentational) karena setiap
 * aksi langsung memicu muat ulang agar angka progres selalu sinkron.
 */

const todayIso = () => format(new Date(), "yyyy-MM-dd");

const formatDayLabel = (iso) => {
  if (!iso) return "";
  try {
    return format(new Date(`${iso}T00:00:00`), "EEEE, d MMM yyyy", { locale: localeId });
  } catch (error) {
    return iso;
  }
};

const formatTime = (value) => {
  if (!value) return null;
  try {
    return format(new Date(value), "HH:mm", { locale: localeId });
  } catch (error) {
    return null;
  }
};

const positionLabel = (position) => {
  if (!position) return "Tanpa posisi";
  return position.charAt(0).toUpperCase() + position.slice(1);
};

// Warna mengikuti palet: telaga = aman, senja = sedang, merah = belum jalan
const progressTone = (progress) => {
  if (progress >= 80) {
    return { bar: "bg-telaga-600", text: "text-telaga-700", chip: "bg-telaga-50 text-telaga-700 ring-telaga-100" };
  }
  if (progress >= 40) {
    return { bar: "bg-senja-500", text: "text-senja-700", chip: "bg-senja-50 text-senja-700 ring-senja-100" };
  }
  return { bar: "bg-red-500", text: "text-red-600", chip: "bg-red-50 text-red-600 ring-red-100" };
};

const STATUS_META = {
  done: { label: "Selesai", chip: "bg-telaga-50 text-telaga-700 ring-telaga-100" },
  pending: { label: "Belum", chip: "bg-senja-50 text-senja-700 ring-senja-100" },
  incomplete: { label: "Tidak selesai", chip: "bg-red-50 text-red-600 ring-red-100" },
};

const AI_META = {
  verified: { label: "Terverifikasi", chip: "bg-telaga-50 text-telaga-700 ring-telaga-100", Icon: ShieldCheck },
  review: { label: "Perlu dicek", chip: "bg-senja-50 text-senja-700 ring-senja-100", Icon: AlertTriangle },
  reject: { label: "Ditolak", chip: "bg-red-50 text-red-600 ring-red-100", Icon: ShieldX },
};

const aiLabel = (verdict) => AI_META[verdict]?.label || "Belum dinilai";

// Jeda polling hasil AI (server menilai foto di latar belakang).
const AI_POLL_INTERVAL_MS = 4000;
const AI_POLL_MAX_ATTEMPTS = 10;

const formatDistance = (meters) => {
  if (meters === null || meters === undefined) return null;
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
};

const DailyTaskPanel = ({ branches = [] }) => {
  const [taskDate, setTaskDate] = useState(todayIso);
  const [branchId, setBranchId] = useState(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [copying, setCopying] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState(null);

  // Form tambah tugas manual — dibuka per karyawan
  const [addTarget, setAddTarget] = useState(null);
  const [addTitle, setAddTitle] = useState("");
  const [addRequiresPhoto, setAddRequiresPhoto] = useState(false);
  const [addSaving, setAddSaving] = useState(false);

  const [confirmTask, setConfirmTask] = useState(null);
  const [positionTarget, setPositionTarget] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [verifyingTaskId, setVerifyingTaskId] = useState(null);
  const [overriding, setOverriding] = useState(false);

  // Cabang default = cabang aktif di header
  useEffect(() => {
    let active = true;

    const resolve = async () => {
      const activeBranch = await getBranchId();
      if (active && activeBranch) setBranchId(activeBranch);
    };

    resolve();

    return () => {
      active = false;
    };
  }, []);

  // Kalau profil tidak punya cabang, pakai cabang pertama dari daftar
  useEffect(() => {
    if (branchId) return;
    if (branches.length > 0) setBranchId(branches[0].id);
  }, [branchId, branches]);

  const fetchTasks = useCallback(async () => {
    if (!branchId || !taskDate) return;

    setLoading(true);
    setError("");
    try {
      const response = await dailyTaskService.getByBranch({ branch_id: branchId, date: taskDate });
      if (response?.success) {
        setData(response.data);
      } else {
        setError(response?.error?.message || "Gagal memuat tugas harian");
        setData(null);
      }
    } catch (err) {
      console.error("❌ DailyTaskPanel - Gagal memuat tugas:", err);
      setError(err?.response?.data?.error?.message || "Gagal memuat tugas harian");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [branchId, taskDate]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Pesan sementara hilang sendiri
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const summary = data?.summary || null;
  const groups = data?.employees || [];
  const withoutTasks = data?.employees_without_tasks || [];
  const aiSummary = data?.ai_summary || null;

  // Foto baru dinilai AI di latar belakang → segarkan otomatis sampai hasilnya masuk.
  const aiPollAttempts = useRef(0);

  useEffect(() => {
    aiPollAttempts.current = 0;
  }, [branchId, taskDate]);

  useEffect(() => {
    if (loading || !data) return undefined;

    const waiting = groups.some((group) =>
      group.tasks.some((task) => task.ai_status === "pending" || task.ai_status === "processing")
    );
    if (!waiting || aiPollAttempts.current >= AI_POLL_MAX_ATTEMPTS) return undefined;

    const timer = setTimeout(() => {
      aiPollAttempts.current += 1;
      fetchTasks();
    }, AI_POLL_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [data, loading, groups, fetchTasks]);

  const tone = progressTone(summary?.progress ?? 0);

  const branchName = useMemo(
    () => branches.find((branch) => branch.id === branchId)?.name || "",
    [branches, branchId]
  );

  const handleBranchSelect = (value) => {
    setBranchId(value ? parseInt(value, 10) : null);
  };

  const handleCopy = async () => {
    if (!branchId) return;

    setCopying(true);
    setNotice("");
    setError("");
    try {
      const response = await dailyTaskService.copyFromPrevious({ branch_id: branchId, date: taskDate });
      if (response?.success) {
        const created = response.data?.created ?? 0;
        const skipped = response.data?.skipped ?? 0;
        setNotice(
          created > 0
            ? `${created} tugas disalin dari ${formatDayLabel(response.data.source_date)}${skipped > 0 ? `, ${skipped} sudah ada` : ""}.`
            : "Semua tugas hari sebelumnya sudah ada di tanggal ini."
        );
        await fetchTasks();
      } else {
        setError(response?.error?.message || "Gagal menyalin tugas");
      }
    } catch (err) {
      console.error("❌ DailyTaskPanel - Gagal salin tugas:", err);
      setError(err?.response?.data?.error?.message || "Gagal menyalin tugas");
    } finally {
      setCopying(false);
    }
  };

  const handleToggle = async (task) => {
    setBusyTaskId(task.id);
    setError("");
    try {
      const response = task.status === "done"
        ? await dailyTaskService.reopen(task.id)
        : await dailyTaskService.complete(task.id);

      if (!response?.success) {
        setError(response?.error?.message || "Gagal mengubah status tugas");
        return;
      }
      await fetchTasks();
    } catch (err) {
      console.error("❌ DailyTaskPanel - Gagal ubah status:", err);
      setError(err?.response?.data?.error?.message || "Gagal mengubah status tugas");
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleVerify = async (task) => {
    setVerifyingTaskId(task.id);
    setError("");
    try {
      const response = await dailyTaskService.verify(task.id);
      if (response?.success) {
        const result = response.data || {};
        setNotice(`AI menilai "${task.title}": skor ${result.score} · ${aiLabel(result.verdict)}.`);
        await fetchTasks();
      } else {
        setError(response?.error?.message || "Gagal memverifikasi foto");
      }
    } catch (err) {
      console.error("❌ DailyTaskPanel - Gagal verifikasi foto:", err);
      setError(err?.response?.data?.error?.message || "Gagal memverifikasi foto");
    } finally {
      setVerifyingTaskId(null);
    }
  };

  const handleOverride = async (task, verdict) => {
    setOverriding(true);
    setError("");
    try {
      const response = await dailyTaskService.override(task.id, { verdict });
      if (response?.success) {
        setPreviewPhoto(null);
        setNotice(`"${task.title}" ditandai ${aiLabel(verdict).toLowerCase()} oleh supervisor.`);
        await fetchTasks();
      } else {
        setError(response?.error?.message || "Gagal memperbarui hasil verifikasi");
      }
    } catch (err) {
      console.error("❌ DailyTaskPanel - Gagal override verifikasi:", err);
      setError(err?.response?.data?.error?.message || "Gagal memperbarui hasil verifikasi");
    } finally {
      setOverriding(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmTask) return;

    const task = confirmTask;
    setConfirmTask(null);
    setBusyTaskId(task.id);
    try {
      const response = await dailyTaskService.remove(task.id);
      if (response?.success) {
        await fetchTasks();
      } else {
        setError(response?.error?.message || "Gagal menghapus tugas");
      }
    } catch (err) {
      console.error("❌ DailyTaskPanel - Gagal hapus tugas:", err);
      setError(err?.response?.data?.error?.message || "Gagal menghapus tugas");
    } finally {
      setBusyTaskId(null);
    }
  };

  const openAddForm = (employee) => {
    setAddTarget(employee);
    setAddTitle("");
    setAddRequiresPhoto(false);
    setError("");
  };

  const handleAddSubmit = async (event) => {
    event.preventDefault();
    if (!addTarget || !addTitle.trim()) return;

    setAddSaving(true);
    setError("");
    try {
      const response = await dailyTaskService.createManual({
        user_id: addTarget.user_id,
        branch_id: branchId,
        date: taskDate,
        title: addTitle.trim(),
        requires_photo: addRequiresPhoto,
      });

      if (response?.success) {
        setAddTarget(null);
        setAddTitle("");
        setAddRequiresPhoto(false);
        await fetchTasks();
      } else {
        setError(response?.error?.message || "Gagal menambah tugas");
      }
    } catch (err) {
      console.error("❌ DailyTaskPanel - Gagal tambah tugas:", err);
      setError(err?.response?.data?.error?.message || "Gagal menambah tugas");
    } finally {
      setAddSaving(false);
    }
  };

  const renderAddForm = (employee) => (
    <form onSubmit={handleAddSubmit} className="mt-2 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={addTitle}
          onChange={(event) => setAddTitle(event.target.value)}
          placeholder={`Tugas untuk ${employee.name}`}
          className="min-w-0 flex-1 rounded-xl border border-telaga-100 bg-krem px-3 py-2 text-xs text-telaga-950 placeholder:text-telaga-900/35 focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
        />
        <button
          type="submit"
          disabled={addSaving || !addTitle.trim()}
          className="shrink-0 rounded-xl bg-telaga-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-telaga-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {addSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Simpan"}
        </button>
        <button
          type="button"
          onClick={() => setAddTarget(null)}
          className="shrink-0 rounded-xl border border-telaga-100 p-2 text-telaga-900/50 transition-colors hover:bg-telaga-50"
          aria-label="Batal"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-1.5 rounded-lg px-1 py-0.5 text-[11px] font-medium text-telaga-900/60 transition-colors hover:text-telaga-800">
        <input
          type="checkbox"
          checked={addRequiresPhoto}
          onChange={(event) => setAddRequiresPhoto(event.target.checked)}
          className="h-3.5 w-3.5 rounded border-telaga-200 text-telaga-700 focus:ring-telaga-400/30"
        />
        <Camera className="h-3 w-3" />
        Wajib foto bukti
      </label>
    </form>
  );

  const renderAiBadge = (task) => {
    const verifying = verifyingTaskId === task.id;

    if (task.ai_status === "done" && task.ai_verdict) {
      const meta = AI_META[task.ai_verdict] || AI_META.review;
      return (
        <button
          onClick={() => setPreviewPhoto(task)}
          title={task.ai_reason || meta.label}
          className={`mt-0.5 flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ring-1 transition-opacity hover:opacity-80 ${meta.chip}`}
        >
          <meta.Icon className="h-2.5 w-2.5" />
          {task.ai_score ?? "–"}
        </button>
      );
    }

    if (task.photo_url && task.ai_status === "processing") {
      return (
        <span
          title="AI sedang menilai foto"
          className="mt-0.5 flex shrink-0 items-center gap-0.5 rounded-full bg-telaga-900/5 px-1.5 py-0.5 text-[9px] font-bold text-telaga-900/45"
        >
          <Loader2 className="h-2.5 w-2.5 animate-spin" />
          AI
        </span>
      );
    }

    if (task.photo_url && (task.ai_status === "pending" || task.ai_status === "failed")) {
      return (
        <button
          onClick={() => handleVerify(task)}
          disabled={verifying}
          title={task.ai_status === "failed" ? `Gagal sebelumnya: ${task.ai_reason || ""}` : "Nilai foto dengan AI"}
          className="mt-0.5 flex shrink-0 items-center gap-0.5 rounded-full bg-telaga-700 px-1.5 py-0.5 text-[9px] font-bold text-white transition-colors hover:bg-telaga-800 disabled:opacity-50"
        >
          {verifying ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
          {verifying ? "AI…" : "AI"}
        </button>
      );
    }

    return null;
  };

  const renderTaskRow = (task) => {
    const meta = STATUS_META[task.status] || STATUS_META.pending;
    const busy = busyTaskId === task.id;
    const done = task.status === "done";

    return (
      <li key={task.id} className="flex items-start gap-2 py-2">
        <button
          onClick={() => handleToggle(task)}
          disabled={busy}
          title={done ? "Batalkan selesai" : "Tandai selesai"}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors disabled:opacity-50 ${
            done
              ? "border-telaga-600 bg-telaga-600 text-white"
              : "border-telaga-200 bg-white text-transparent hover:border-telaga-400"
          }`}
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin text-telaga-700" /> : <Check className="h-3 w-3" />}
        </button>

        <div className="min-w-0 flex-1">
          <p className={`text-xs font-medium ${done ? "text-telaga-900/45 line-through" : "text-telaga-950"}`}>
            {task.title}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-telaga-900/40">
            {task.area || "Tanpa area"}
            {task.requires_photo ? " · wajib foto" : ""}
            {done && task.completed_at ? ` · ${formatTime(task.completed_at)}` : ""}
          </p>
        </div>

        {task.photo_url ? (
          <button
            onClick={() => setPreviewPhoto(task)}
            className="mt-0.5 shrink-0 overflow-hidden rounded-md ring-1 ring-telaga-200 transition-shadow hover:ring-telaga-400"
            aria-label="Lihat foto bukti"
          >
            <img src={task.photo_url} alt={`Bukti ${task.title}`} className="h-7 w-7 object-cover" />
          </button>
        ) : task.requires_photo ? (
          <span
            title="Belum ada foto bukti"
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-dashed border-senja-300 text-senja-500"
          >
            <Camera className="h-3.5 w-3.5" />
          </span>
        ) : null}

        {renderAiBadge(task)}

        <span className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1 ${meta.chip}`}>
          {meta.label}
        </span>

        <div className="mt-0.5 flex shrink-0 items-center gap-0.5">
          {done && (
            <button
              onClick={() => handleToggle(task)}
              disabled={busy}
              className="rounded-md p-1 text-telaga-900/35 transition-colors hover:bg-telaga-50 hover:text-telaga-700 disabled:opacity-40"
              aria-label="Batalkan selesai"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => setConfirmTask(task)}
            disabled={busy}
            className="rounded-md p-1 text-telaga-900/35 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
            aria-label="Hapus tugas"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </li>
    );
  };

  const renderAiDetail = (task) => {
    if (!task.photo_url) return null;

    const verifying = verifyingTaskId === task.id;
    const meta = task.ai_verdict ? AI_META[task.ai_verdict] : null;
    const distance = formatDistance(task.distance_m);

    return (
      <div className="mt-2 rounded-2xl bg-white px-3 py-2.5 text-[10px] text-telaga-900/55">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-telaga-950">Verifikasi AI</span>
          {meta ? (
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-bold ring-1 ${meta.chip}`}>
              <meta.Icon className="h-3 w-3" />
              {task.ai_score} · {meta.label}
            </span>
          ) : (
            <span className="rounded-full bg-telaga-900/5 px-2 py-0.5 font-semibold text-telaga-900/50">
              Belum dinilai
            </span>
          )}
        </div>

        {task.ai_reason && <p className="mt-1.5 leading-relaxed">{task.ai_reason}</p>}

        {(distance || task.photo_taken_at) && (
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-telaga-900/40">
            {distance && <span>Jarak: {distance}</span>}
            {task.photo_taken_at && <span>Foto: {format(new Date(task.photo_taken_at), "d MMM HH:mm", { locale: localeId })}</span>}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => handleVerify(task)}
            disabled={verifying}
            className="flex items-center gap-1 rounded-lg bg-telaga-700 px-2 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-telaga-800 disabled:opacity-50"
          >
            {verifying ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {verifying ? "Menilai…" : task.ai_verdict ? "Nilai ulang" : "Nilai dengan AI"}
          </button>

          {["verified", "review", "reject"]
            .filter((verdict) => verdict !== task.ai_verdict)
            .map((verdict) => {
              const option = AI_META[verdict];
              return (
                <button
                  key={verdict}
                  onClick={() => handleOverride(task, verdict)}
                  disabled={overriding}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold ring-1 transition-opacity hover:opacity-80 disabled:opacity-50 ${option.chip}`}
                >
                  <option.Icon className="h-3 w-3" />
                  {option.label}
                </button>
              );
            })}
        </div>
      </div>
    );
  };

  return (
    <section className="rounded-2xl border border-telaga-100 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded-lg bg-telaga-50 p-1.5 text-telaga-700">
            <ClipboardList className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-telaga-950">Tugas Harian</h2>
            <p className="truncate text-[10px] text-telaga-900/45">
              {formatDayLabel(taskDate)}
              {branchName ? ` · ${branchName}` : ""}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="rounded-lg p-1.5 text-telaga-900/35 transition-colors hover:bg-telaga-50 hover:text-telaga-700 disabled:opacity-40"
            aria-label="Muat ulang tugas"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowInfo(true)}
            className="rounded-lg p-1.5 text-telaga-900/35 transition-colors hover:bg-telaga-50 hover:text-telaga-700"
            aria-label="Penjelasan tugas harian"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Kontrol tanggal & cabang */}
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-telaga-900/45">Tanggal</span>
          <input
            type="date"
            value={taskDate}
            onChange={(event) => setTaskDate(event.target.value || todayIso())}
            className="mt-1 w-full rounded-xl border border-telaga-100 bg-krem px-3 py-2 text-xs text-telaga-950 focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
          />
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-wider text-telaga-900/45">Cabang</span>
          <div className="relative mt-1">
            <select
              value={branchId ?? ""}
              onChange={(event) => handleBranchSelect(event.target.value)}
              className="w-full appearance-none rounded-xl border border-telaga-100 bg-krem px-3 py-2 pr-8 text-xs text-telaga-950 focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
            >
              {branches.length === 0 && <option value="">Memuat cabang…</option>}
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-telaga-900/40" />
          </div>
        </label>
      </div>

      {/* Ringkasan progres + aksi utama */}
      <div className="mt-3 rounded-xl bg-krem p-3">
        {summary ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-telaga-950">
                  {summary.done}/{summary.total_tasks} tugas selesai
                </p>
                <p className="mt-0.5 text-[10px] text-telaga-900/45">
                  {summary.total_employees} karyawan
                  {summary.employees_without_tasks > 0
                    ? ` · ${summary.employees_without_tasks} belum ditugaskan`
                    : ""}
                  {summary.incomplete > 0 ? ` · ${summary.incomplete} tidak selesai` : ""}
                  {aiSummary && aiSummary.needs_review > 0 ? ` · ${aiSummary.needs_review} foto perlu dicek` : ""}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${tone.chip}`}>
                {summary.progress}%
              </span>
            </div>

            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-telaga-900/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${tone.bar}`}
                style={{ width: `${Math.min(summary.progress, 100)}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-xs text-telaga-900/45">
            {loading ? "Memuat tugas…" : "Belum ada data tugas untuk tanggal ini."}
          </p>
        )}

        <button
          onClick={handleCopy}
          disabled={copying || !branchId}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-telaga-700 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-telaga-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
          {copying ? "Menyalin…" : "Salin tugas sebelumnya"}
        </button>
      </div>

      {/* Pesan */}
      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[11px] font-medium text-red-600 ring-1 ring-red-100">
          {error}
        </p>
      )}
      {!error && notice && (
        <p className="mt-3 rounded-xl bg-telaga-50 px-3 py-2 text-[11px] font-medium text-telaga-700 ring-1 ring-telaga-100">
          {notice}
        </p>
      )}

      {/* Daftar per karyawan */}
      <div className="mt-3 divide-y divide-telaga-100/70">
        {groups.map((group) => {
          const groupTone = progressTone(group.progress);

          return (
            <div key={group.user_id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-telaga-950">
                    {group.name || `Karyawan #${group.user_id}`}
                  </p>
                  <p className="truncate text-[10px] text-telaga-900/45">{positionLabel(group.position)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`text-[10px] font-semibold ${groupTone.text}`}>
                    {group.done}/{group.total_tasks}
                  </span>
                  <button
                    onClick={() => openAddForm({ user_id: group.user_id, name: group.name })}
                    className="rounded-md p-1 text-telaga-900/35 transition-colors hover:bg-telaga-50 hover:text-telaga-700"
                    aria-label={`Tambah tugas untuk ${group.name}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <ul className="mt-1 divide-y divide-telaga-100/50">{group.tasks.map(renderTaskRow)}</ul>

              {addTarget?.user_id === group.user_id && renderAddForm(addTarget)}
            </div>
          );
        })}

        {/* Karyawan yang belum punya tugas sama sekali */}
        {withoutTasks.map((employee) => (
          <div key={`empty-${employee.user_id}`} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-telaga-950">{employee.name}</p>
                <p className="truncate text-[10px] text-telaga-900/45">
                  {positionLabel(employee.position)}
                  {!employee.position ? " · isi posisi agar dapat tugas otomatis" : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => setPositionTarget(employee)}
                  className="rounded-lg border border-telaga-100 px-2 py-1 text-[10px] font-semibold text-telaga-900/60 transition-colors hover:bg-telaga-50"
                >
                  Posisi
                </button>
                <button
                  onClick={() => openAddForm({ user_id: employee.user_id, name: employee.name })}
                  className="rounded-lg border border-telaga-100 px-2 py-1 text-[10px] font-semibold text-telaga-700 transition-colors hover:bg-telaga-50"
                >
                  Tugaskan
                </button>
              </div>
            </div>

            {addTarget?.user_id === employee.user_id && renderAddForm(addTarget)}
          </div>
        ))}

        {!loading && groups.length === 0 && withoutTasks.length === 0 && (
          <div className="py-6 text-center">
            <ClipboardList className="mx-auto h-6 w-6 text-telaga-300" />
            <p className="mt-2 text-xs font-medium text-telaga-900/60">Belum ada karyawan di cabang ini</p>
            <p className="mx-auto mt-1 max-w-[18rem] text-[10px] text-telaga-900/40">
              Salin tugas hari sebelumnya atau tambahkan tugas manual per karyawan.
            </p>
          </div>
        )}
      </div>

      <InfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="Cara kerja tugas harian"
        items={[
          {
            title: "1. Salin tugas sebelumnya",
            description: "Menyalin seluruh tugas dari tanggal terakhir yang punya tugas ke tanggal yang sedang dibuka.",
            dotColor: "bg-telaga-600",
            bgColor: "bg-telaga-50",
            titleColor: "text-telaga-900",
          },
          {
            title: "2. Aman ditekan berkali-kali",
            description: "Tugas yang sudah ada tidak dibuat ulang, jadi tidak ada data dobel.",
            dotColor: "bg-telaga-600",
            bgColor: "bg-telaga-50",
            titleColor: "text-telaga-900",
          },
          {
            title: "3. Karyawan centang sendiri",
            description: "Karyawan menandai selesai dari Beranda Staff. Supervisor bisa ikut menandai atau membatalkan.",
            dotColor: "bg-senja-500",
            bgColor: "bg-senja-50",
            titleColor: "text-senja-900",
          },
          {
            title: "4. Sisa tugas otomatis tidak selesai",
            description: "Saat karyawan absen pulang, tugas yang masih belum dicentang berubah jadi \"Tidak selesai\".",
            dotColor: "bg-red-500",
            bgColor: "bg-red-50",
            titleColor: "text-red-700",
          },
          {
            title: "5. Foto bukti dinilai AI",
            description: "Foto dari GPS Camera dibaca watermark-nya (koordinat & waktu), lalu dicocokkan dengan tugas dan radius cabang. Hasilnya skor + status, dan supervisor tetap bisa menimpanya.",
            dotColor: "bg-senja-500",
            bgColor: "bg-senja-50",
            titleColor: "text-senja-900",
          },
        ]}
      />

      <PositionModal
        isOpen={Boolean(positionTarget)}
        onClose={() => setPositionTarget(null)}
        employee={positionTarget}
        onSaved={() => {
          setNotice("Posisi disimpan. Tambahkan tugas manual atau salin dari hari sebelumnya.");
          fetchTasks();
        }}
      />

      <ConfirmationModal
        isOpen={Boolean(confirmTask)}
        onClose={() => setConfirmTask(null)}
        onConfirm={handleDelete}
        title="Hapus tugas ini?"
        message={confirmTask ? `"${confirmTask.title}" akan dihapus dari daftar tugas hari ini.` : ""}
        confirmText="Hapus"
        cancelText="Batal"
      />

      {previewPhoto && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewPhoto(null)}
          role="presentation"
        >
          <div
            className="max-h-full w-full max-w-sm overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
            role="presentation"
          >
            <img
              src={previewPhoto.photo_url}
              alt={`Bukti ${previewPhoto.title}`}
              className="max-h-[55vh] w-full rounded-2xl object-contain"
            />
            <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-telaga-950">{previewPhoto.title}</p>
                <p className="text-[10px] text-telaga-900/45">
                  {previewPhoto.completed_at ? `Selesai ${formatTime(previewPhoto.completed_at)}` : "Belum selesai"}
                </p>
              </div>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="shrink-0 rounded-lg border border-telaga-100 p-1.5 text-telaga-900/50 transition-colors hover:bg-telaga-50"
                aria-label="Tutup"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {renderAiDetail(previewPhoto)}
          </div>
        </div>
      )}
    </section>
  );
};

export default DailyTaskPanel;
