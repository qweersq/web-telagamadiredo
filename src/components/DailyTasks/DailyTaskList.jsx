import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Check, ClipboardList, Loader2 } from "lucide-react";
import { dailyTaskService } from "../../services/dailyTaskService";
import { uploadSinglePhoto } from "../../utils/uploadHelper";

/**
 * Daftar tugas harian milik karyawan (Beranda Staff).
 *
 * - Hanya menampilkan tugas milik sendiri (GET /daily-tasks/me).
 * - Karyawan mencentang tugasnya sendiri. Tugas bertanda `requires_photo`
 *   wajib melampirkan foto bukti; server menolak tanpa foto, jadi upload
 *   dilakukan lebih dulu lalu status dikirim sekaligus.
 * - Setelah foto terunggah, server langsung menilai dengan AI di latar
 *   belakang. Daftar ini di-refresh berkala sampai hasil penilaian masuk.
 * - Saat absen pulang, server otomatis menandai sisa tugas "tidak selesai",
 *   sehingga daftar ini perlu disegarkan ketika tab kembali aktif.
 */

const AI_BADGE = {
  verified: { label: "Terverifikasi", chip: "bg-telaga-50 text-telaga-700 ring-telaga-100" },
  review: { label: "Perlu dicek", chip: "bg-senja-50 text-senja-700 ring-senja-100" },
  reject: { label: "Ditolak", chip: "bg-red-50 text-red-600 ring-red-100" },
};

// Jeda polling hasil AI: ~40 detik total, biasanya cukup 1 panggilan Gemini.
const AI_POLL_INTERVAL_MS = 3000;
const AI_POLL_MAX_ATTEMPTS = 14;

const todayIso = () => format(new Date(), "yyyy-MM-dd");

const formatTime = (value) => {
  if (!value) return null;
  try {
    return format(new Date(value), "HH:mm");
  } catch (error) {
    return null;
  }
};

const DailyTaskList = () => {
  const [date, setDate] = useState(todayIso);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [photoTask, setPhotoTask] = useState(null);

  const fileInputRef = useRef(null);
  const aiPollRef = useRef(null);

  const fetchTasks = useCallback(async () => {
    setError("");
    try {
      const response = await dailyTaskService.getMine({ date });
      if (response?.success) {
        setData(response.data);
        return response.data;
      }
      setError(response?.error?.message || "Gagal memuat tugas");
      return null;
    } catch (err) {
      console.error("❌ DailyTaskList - gagal memuat tugas:", err);
      setError(err?.response?.data?.error?.message || "Gagal memuat tugas");
      return null;
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const stopAiPoll = useCallback(() => {
    if (aiPollRef.current) {
      clearTimeout(aiPollRef.current);
      aiPollRef.current = null;
    }
  }, []);

  useEffect(() => stopAiPoll, [stopAiPoll]);

  /**
   * Penilaian AI berjalan di server setelah respons tersimpan, jadi hasilnya
   * tidak bisa langsung dibaca. Cek berkala sampai tidak ada lagi tugas
   * berstatus pending/processing.
   */
  const pollAiResult = useCallback(() => {
    stopAiPoll();
    let attempts = 0;

    const tick = async () => {
      attempts += 1;
      const payload = await fetchTasks();
      const stillRunning = (payload?.tasks || []).some(
        (task) => task.ai_status === "pending" || task.ai_status === "processing"
      );

      if (stillRunning && attempts < AI_POLL_MAX_ATTEMPTS) {
        aiPollRef.current = setTimeout(tick, AI_POLL_INTERVAL_MS);
      }
    };

    aiPollRef.current = setTimeout(tick, 1500);
  }, [fetchTasks, stopAiPoll]);

  // Tugas bisa berubah dari sisi supervisor / penutupan absen, jadi segarkan
  // saat karyawan kembali ke tab ini.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") fetchTasks();
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [fetchTasks]);

  const tasks = data?.tasks || [];
  const total = data?.total_tasks ?? 0;
  const done = data?.done ?? 0;
  const progress = data?.progress ?? 0;

  const submitComplete = async (task, photoUrl = null) => {
    setBusyId(task.id);
    setError("");
    try {
      const response = await dailyTaskService.complete(task.id, photoUrl ? { photo_url: photoUrl } : {});
      if (!response?.success) {
        setError(response?.error?.message || "Gagal menandai selesai");
        return false;
      }
      await fetchTasks();
      // Foto baru otomatis dinilai AI di server → tunggu hasilnya masuk.
      if (photoUrl) pollAiResult();
      return true;
    } catch (err) {
      console.error("❌ DailyTaskList - gagal menandai selesai:", err);
      setError(err?.response?.data?.error?.message || "Gagal menandai selesai");
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const handleToggle = async (task) => {
    if (task.status === "done") {
      setBusyId(task.id);
      setError("");
      try {
        const response = await dailyTaskService.reopen(task.id);
        if (!response?.success) {
          setError(response?.error?.message || "Gagal membatalkan tugas");
          return;
        }
        await fetchTasks();
      } catch (err) {
        console.error("❌ DailyTaskList - gagal membatalkan:", err);
        setError(err?.response?.data?.error?.message || "Gagal membatalkan tugas");
      } finally {
        setBusyId(null);
      }
      return;
    }

    // Tugas wajib foto → buka pemilih file dulu
    if (task.requires_photo && !task.photo_url) {
      setPhotoTask(task);
      fileInputRef.current?.click();
      return;
    }

    await submitComplete(task, task.photo_url);
  };

  const handlePhotoPicked = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !photoTask) return;

    const task = photoTask;
    setPhotoTask(null);
    setBusyId(task.id);
    setError("");

    try {
      const photoUrl = await uploadSinglePhoto(file);
      await submitComplete(task, photoUrl);
    } catch (err) {
      console.error("❌ DailyTaskList - gagal upload foto:", err);
      setError(err?.message || "Gagal mengunggah foto");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="mt-4 rounded-2xl border border-telaga-100 bg-white p-4 shadow-sm shadow-telaga-900/5">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoPicked}
        className="hidden"
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-telaga-50 p-1.5 text-telaga-700">
            <ClipboardList className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold text-telaga-950">Tugas hari ini</h2>
        </div>
        <span className="rounded-full bg-telaga-900/5 px-2 py-0.5 text-[10px] font-semibold text-telaga-900/50">
          {done}/{total} tugas
        </span>
      </div>

      {total > 0 && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-telaga-900/10">
            <div
              className="h-full rounded-full bg-telaga-600 transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-telaga-900/45">{progress}% selesai</p>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[11px] font-medium text-red-600 ring-1 ring-red-100">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-telaga-200 py-8 text-xs text-telaga-900/45">
          <Loader2 className="h-4 w-4 animate-spin" /> Memuat tugas…
        </div>
      ) : tasks.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-telaga-200 py-8 text-center">
          <ClipboardList className="mx-auto h-7 w-7 text-telaga-300" />
          <p className="mt-2 text-sm font-medium text-telaga-900/60">Belum ada tugas</p>
          <p className="mx-auto mt-1 max-w-[15rem] text-xs text-telaga-900/40">
            Daftar tugas harian akan muncul di sini setelah ditugaskan oleh supervisor.
          </p>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-telaga-100/60">
          {tasks.map((task) => {
            const isDone = task.status === "done";
            const isBusy = busyId === task.id;

            return (
              <li key={task.id} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
                <button
                  onClick={() => handleToggle(task)}
                  disabled={isBusy}
                  aria-label={isDone ? "Batalkan selesai" : "Tandai selesai"}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors disabled:opacity-50 ${
                    isDone
                      ? "border-telaga-600 bg-telaga-600 text-white"
                      : "border-telaga-300 bg-white text-transparent hover:border-telaga-500"
                  }`}
                >
                  {isBusy ? <Loader2 className="h-3 w-3 animate-spin text-telaga-700" /> : <Check className="h-3 w-3" />}
                </button>

                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-medium ${isDone ? "text-telaga-900/45 line-through" : "text-telaga-950"}`}>
                    {task.title}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-telaga-900/40">
                    {task.area || "Tanpa area"}
                    {task.requires_photo ? " · wajib foto" : ""}
                    {isDone && task.completed_at ? ` · ${formatTime(task.completed_at)}` : ""}
                    {task.status === "incomplete" ? " · tidak selesai" : ""}
                  </p>
                </div>

                {task.status === "incomplete" && (
                  <span className="mt-0.5 shrink-0 rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold text-red-600 ring-1 ring-red-100">
                    Lewat
                  </span>
                )}

                {task.photo_url && (task.ai_status === "pending" || task.ai_status === "processing") && (
                  <span className="mt-0.5 flex shrink-0 items-center gap-1 rounded-full bg-telaga-900/5 px-1.5 py-0.5 text-[9px] font-semibold text-telaga-900/45">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    AI
                  </span>
                )}

                {task.ai_status === "done" && AI_BADGE[task.ai_verdict] && (
                  <span
                    title={task.ai_reason || ""}
                    className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1 ${AI_BADGE[task.ai_verdict].chip}`}
                  >
                    {task.ai_score} · {AI_BADGE[task.ai_verdict].label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default DailyTaskList;
