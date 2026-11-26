import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, LogIn, LogOut } from "lucide-react";
import Header from "../../components/Com Header/Header";
import DailyTaskList from "../../components/DailyTasks/DailyTaskList";
import { getUserProfile, invalidateUserProfileCache } from "../../utils/userProfileHelper";

/**
 * Beranda Staff — halaman kerja karyawan non-kasir
 * (kebersihan, dapur, taman, keamanan, dsb).
 *
 * Fokus: kehadiran hari ini + daftar tugas. Bukan halaman analitik.
 */
const BerandaStaff = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Cache profil berdurasi 5 menit, jadi harus dipaksa ambil ulang setiap
    // halaman ini dibuka — kalau tidak, status absen setelah absen masuk/pulang
    // masih menampilkan data lama.
    const load = async (showLoading) => {
      if (showLoading) setLoading(true);
      invalidateUserProfileCache();
      try {
        const data = await getUserProfile();
        if (active) setProfile(data);
      } catch (error) {
        console.error("❌ BerandaStaff - gagal memuat profil:", error);
      } finally {
        if (active && showLoading) setLoading(false);
      }
    };

    load(true);

    // Segarkan juga saat user kembali ke tab/app ini
    const refresh = () => {
      if (document.visibilityState === "visible") load(false);
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const formatClock = (value) => (value ? String(value).substring(0, 5) : null);

  const attendance = profile?.todayAbsent || null;
  const clockIn = formatClock(attendance?.clock_in);
  const clockOut = formatClock(attendance?.clock_out);
  const hasAttended = Boolean(profile?.isAbsent && attendance);

  const attendanceState = clockOut
    ? {
        tone: "done",
        label: "Selesai bekerja",
        hint: `Masuk ${clockIn || "—"} · Pulang ${clockOut}`,
      }
    : hasAttended
    ? {
        tone: "active",
        label: "Sedang bekerja",
        hint: `Masuk ${clockIn || "—"}`,
      }
    : {
        tone: "pending",
        label: "Belum absen",
        hint: "Absen masuk dulu sebelum mulai bekerja",
      };

  const attendanceTone = {
    done: "bg-telaga-50 text-telaga-700 ring-telaga-100",
    active: "bg-senja-50 text-senja-700 ring-senja-100",
    pending: "bg-telaga-900/5 text-telaga-900/70 ring-telaga-100",
  }[attendanceState.tone];

  const attendanceAction = clockOut
    ? null
    : hasAttended
    ? { label: "Absen Pulang", icon: LogOut, path: "/end-work" }
    : { label: "Absen Masuk", icon: LogIn, path: "/attendance" };

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden bg-krem font-montserrat">
        <Header />

        <main className="flex-1 overflow-y-auto pb-10">
          <div className="mx-auto px-4 md:px-10 pt-10 pb-6">
            <div className="max-w-[390px] md:max-w-none mx-auto mt-[50px] animate-pulse space-y-3">
              <div className="h-32 rounded-2xl bg-telaga-100/60" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-krem font-montserrat">
      <Header />

      <main className="flex-1 overflow-y-auto pb-10">
        <div className="mx-auto px-4 md:px-10 pt-10 pb-6">
          <div className="max-w-[390px] md:max-w-none mx-auto mt-[50px]">
            {/* Kehadiran hari ini */}
            <section className="rounded-2xl border border-telaga-100 bg-white p-4 shadow-sm shadow-telaga-900/5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-telaga-900/45">
                    Kehadiran hari ini
                  </p>
                  <p className="mt-1 text-base font-semibold text-telaga-950">{attendanceState.label}</p>
                  <p className="mt-0.5 text-xs text-telaga-900/55">{attendanceState.hint}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${attendanceTone}`}>
                  {clockOut ? "Lengkap" : hasAttended ? "Aktif" : "Belum"}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-krem px-3 py-2.5">
                  <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-telaga-900/45">
                    <Clock className="h-3 w-3" /> Jam masuk
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-telaga-950">{clockIn || "—"}</p>
                </div>
                <div className="rounded-xl bg-krem px-3 py-2.5">
                  <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-telaga-900/45">
                    <Clock className="h-3 w-3" /> Jam pulang
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-telaga-950">{clockOut || "—"}</p>
                </div>
              </div>

              {attendanceAction ? (
                <button
                  onClick={() => navigate(attendanceAction.path)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-telaga-700 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-telaga-800"
                >
                  <attendanceAction.icon className="h-4 w-4" />
                  {attendanceAction.label}
                </button>
              ) : (
                <p className="mt-3 rounded-xl bg-telaga-50 py-2.5 text-center text-xs font-medium text-telaga-700">
                  Terima kasih, pekerjaan hari ini sudah ditutup.
                </p>
              )}
            </section>

            {/* Tugas hari ini */}
            <DailyTaskList />

            <p className="mt-6 text-center text-[10px] text-telaga-900/30">
              Agrowisata Telaga Madiredo · Desa Madiredo, Pujon, Malang
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BerandaStaff;
