import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  AlertTriangle,
  Bot,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Sun,
  Timer,
  X,
} from 'lucide-react';
import instance from '../../config/api';
import Header from '../../components/Com Header/Header';
import AnimatedButton from '../../components/Design/AnimatedButton';
import LoadingDots from '../../components/Design/LoadingDots';
import { getUserProfile, invalidateUserProfileCache } from '../../utils/userProfileHelper';
import { uploadSinglePhoto } from '../../utils/uploadHelper';

const STATUS_META = {
  Present: { label: 'Hadir', chip: 'bg-telaga-50 text-telaga-700 ring-telaga-100' },
  hadir: { label: 'Hadir', chip: 'bg-telaga-50 text-telaga-700 ring-telaga-100' },
  PersonalLeave: { label: 'Izin Pribadi', chip: 'bg-senja-50 text-senja-700 ring-senja-100' },
  AnnualLeave: { label: 'Cuti Tahunan', chip: 'bg-senja-50 text-senja-700 ring-senja-100' },
  EmergencyLeave: { label: 'Izin Darurat', chip: 'bg-senja-50 text-senja-700 ring-senja-100' },
  izin: { label: 'Izin', chip: 'bg-senja-50 text-senja-700 ring-senja-100' },
  DayOffPersonal: { label: 'Libur Pribadi', chip: 'bg-telaga-900/5 text-telaga-900/50 ring-telaga-100' },
  DayOffGeneral: { label: 'Libur Bersama', chip: 'bg-telaga-900/5 text-telaga-900/50 ring-telaga-100' },
  Sick: { label: 'Sakit', chip: 'bg-red-50 text-red-600 ring-red-100' },
  Absent: { label: 'Tanpa Keterangan', chip: 'bg-red-50 text-red-600 ring-red-100' },
};

const AI_CHIP_STYLE = {
  verified: 'bg-telaga-50 text-telaga-700 ring-telaga-100',
  review: 'bg-amber-50 text-amber-700 ring-amber-100',
  reject: 'bg-red-50 text-red-600 ring-red-100',
};

const AI_CHIP_LABEL = {
  verified: 'cocok',
  review: 'perlu dicek',
  reject: 'tidak cocok',
};

const chipBase = 'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1';

// Warna kartu status validasi GPS di modal absen masuk
const GPS_STATUS_STYLE = {
  idle: 'bg-telaga-900/5 text-telaga-900/50 ring-telaga-100',
  locating: 'bg-telaga-50 text-telaga-700 ring-telaga-100',
  ok: 'bg-telaga-50 text-telaga-700 ring-telaga-100',
  far: 'bg-senja-50 text-senja-700 ring-senja-100',
  error: 'bg-red-50 text-red-600 ring-red-100',
};

const AiChip = ({ kind, status, verdict, score, reason }) => {
  if (!status || status === 'skipped') return null;

  if (status === 'pending' || status === 'processing') {
    return (
      <span className={`${chipBase} bg-telaga-900/5 text-telaga-900/50 ring-telaga-100`}>
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
        AI {kind} menilai…
      </span>
    );
  }

  if (status === 'failed') {
    return (
      <span title={reason || ''} className={`${chipBase} bg-telaga-900/5 text-telaga-900/40 ring-telaga-100`}>
        <Bot className="h-2.5 w-2.5" /> AI {kind} gagal
      </span>
    );
  }

  return (
    <span
      title={reason || ''}
      className={`${chipBase} ${AI_CHIP_STYLE[verdict] || 'bg-telaga-900/5 text-telaga-900/50 ring-telaga-100'}`}
    >
      <Bot className="h-2.5 w-2.5" />
      Foto {kind}: {AI_CHIP_LABEL[verdict] || verdict}
      {score != null ? ` · ${score}` : ''}
    </span>
  );
};

const UnifiedAttendancePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalWorkHours: 0,
    totalAttendance: 0,
    totalDays: 0
  });
  const [error, setError] = useState(null);
  const [showAbsenModal, setShowAbsenModal] = useState(false);
  const [showEndWorkModal, setShowEndWorkModal] = useState(false);
  const [showIzinModal, setShowIzinModal] = useState(false);
  const [selectedAbsent, setSelectedAbsent] = useState(null);
  const [endWorkTime, setEndWorkTime] = useState('');
  const [izinDescription, setIzinDescription] = useState('');
  const [izinDate, setIzinDate] = useState('');
  const [updating, setUpdating] = useState(false);
  const [submittingIzin, setSubmittingIzin] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [checkingLocation, setCheckingLocation] = useState(false);
  // Status validasi GPS saat modal absen masuk dibuka
  const [gpsCheck, setGpsCheck] = useState({ status: 'idle', distance: null, message: null });
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Foto bukti dari aplikasi GPS Camera (watermark koordinat + waktu)
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [aiChecking, setAiChecking] = useState(false);
  const [aiMessage, setAiMessage] = useState(null);

  // Jam berjalan untuk kartu status hari ini
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Hilangkan toast AI setelah beberapa saat
  useEffect(() => {
    if (!aiMessage || aiChecking) return;
    const timer = setTimeout(() => setAiMessage(null), 8000);
    return () => clearTimeout(timer);
  }, [aiMessage, aiChecking]);

  // Get user data from API
  const getUserData = async () => {    try {
      const profile = await getUserProfile();
      if (!profile) return null;
      
      // Extract data yang dibutuhkan dari profile
      const userData = {
        id: profile.user?.id,
        name: profile.user?.name,
        email: profile.user?.email,
        role: profile.user?.role,
        branch_id: profile.branch?.id,
        branch_name: profile.branch?.name,
        branch_address: profile.branch?.address,
        branch_latitude: profile.branch?.latitude ?? null,
        branch_longitude: profile.branch?.longitude ?? null,
        checkin_radius_m: Number(profile.branch?.checkin_radius_m) || 150,
        tenant_id: profile.tenant?.id,
        tenant_name: profile.tenant?.business_name
      };
      
      return userData;
    } catch (error) {
      console.error('[ERROR] UnifiedAttendancePage - Failed to get userData from API:', error);
      return null;
    }
  };

  // Get Indonesia time (UTC+7)
  const getIndonesiaTime = () => {
    return new Date();
  };

  // Calculate attendance statistics
  const calculateAttendanceStats = (attendanceList) => {
    let totalHadir = 0;
    let totalIzin = 0;
    let totalDays = 0;

    attendanceList.forEach(absen => {
      // Count Present status as "Hadir"
      if (absen.status === "Present") {
        totalHadir++;
      }
      // Count all izin types as "Izin"
      else if (absen.status === "PersonalLeave" || 
               absen.status === "AnnualLeave" || 
               absen.status === "EmergencyLeave" ||
               absen.status === "Sick" ||
               absen.status === "DayOffPersonal" ||
               absen.status === "DayOffGeneral" ||
               absen.status === "izin") {
        totalIzin++;
      }
      totalDays++;
    });

    return {
      totalHadir,
      totalIzin,
      totalDays
    };
  };

  // Check today's attendance status
  const checkAttendanceStatus = async () => {
    try {
      const userData = await getUserData();
      if (!userData?.id) return;

      const { data } = await instance.get('/get-profile');
      setAttendanceData(data.data);
    } catch (error) {
      console.error('Error checking attendance status:', error);
    }
  };

  // Fetch attendance list
  const fetchAttendanceList = async (isListOnly = false) => {
    try {
      if (isListOnly) {
        setListLoading(true);
      }
      
      const userData = await getUserData();
      if (!userData?.id) return;

      const res = await instance.get(`/absents-user/${userData.id}`, {
        params: { month: currentMonth, year: currentYear }
      });

      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        const mapped = res.data.data.map(absen => ({
          id: absen.id,
          date: absen.date,
          clockIn: absen.clock_in,
          clockOut: absen.clock_out,
          status: absen.status,
          description: absen.description,
          photoClockIn: absen.photo_clock_in,
          photoClockOut: absen.photo_clock_out,
          aiClockInStatus: absen.ai_clock_in_status,
          aiClockInVerdict: absen.ai_clock_in_verdict,
          aiClockInScore: absen.ai_clock_in_score,
          aiClockInReason: absen.ai_clock_in_reason,
          aiClockOutStatus: absen.ai_clock_out_status,
          aiClockOutVerdict: absen.ai_clock_out_verdict,
          aiClockOutScore: absen.ai_clock_out_score,
          aiClockOutReason: absen.ai_clock_out_reason,
          isLate: absen.is_late,
          lateMinutes: absen.late_minutes,
          expectedIn: absen.expected_clock_in,
          expectedOut: absen.expected_clock_out
        }));
        setAttendanceList(mapped);
        
        // Calculate statistics
        const stats = calculateAttendanceStats(mapped);
        setAttendanceStats(stats);
      }
    } catch (error) {
      console.error('Error fetching attendance list:', error);
    } finally {
      if (isListOnly) {
        setListLoading(false);
      }
    }
  };

  // Get current location
  const getCurrentLocation = () => {    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung oleh browser ini'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(new Error('Gagal mendapatkan lokasi: ' + error.message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  // Jarak dua koordinat (meter) — Haversine, sama dengan backend
  const distanceInMeters = (lat1, lon1, lat2, lon2) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371e3;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return Math.round(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  // Cek lokasi sebelum absen masuk: wajib aktif & harus di dalam radius kantor.
  const runGpsCheck = async () => {
    setGpsCheck({ status: 'locating', distance: null, message: null });

    const userData = await getUserData();
    if (!userData) {
      const message = 'Data user tidak ditemukan.';
      setGpsCheck({ status: 'error', distance: null, message });
      return { ok: false, message };
    }

    let loc;
    try {
      loc = await getCurrentLocation();
    } catch (error) {
      const message = 'Lokasi tidak terbaca. Izinkan akses lokasi di browser lalu coba lagi.';
      setGpsCheck({ status: 'error', distance: null, message });
      return { ok: false, message };
    }

    if (userData.branch_latitude == null || userData.branch_longitude == null) {
      // Cabang belum diset koordinatnya — tidak ada acuan, GPS tetap dicatat.
      const message = 'Lokasi kantor belum diset, GPS dicatat tanpa radius.';
      setGpsCheck({ status: 'ok', distance: null, message });
      return { ok: true, message };
    }

    const distance = distanceInMeters(
      loc.latitude,
      loc.longitude,
      Number(userData.branch_latitude),
      Number(userData.branch_longitude)
    );
    const radius = userData.checkin_radius_m;

    if (distance > radius) {
      const message = `Anda ${distance} m dari kantor. Maksimal ${radius} m.`;
      setGpsCheck({ status: 'far', distance, message });
      return { ok: false, message };
    }

    const message = `${distance} m dari kantor`;
    setGpsCheck({ status: 'ok', distance, message });
    return { ok: true, message };
  };

  const resetPhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  const handlePhotoPicked = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhoto = async () => {
    if (!photoFile) return null;
    try {
      // Resolusi lebih tinggi dari default supaya teks watermark tetap terbaca AI.
      return await uploadSinglePhoto(photoFile, { maxWidth: 1600, maxHeight: 1600, quality: 0.85 });
    } catch (uploadError) {
      console.warn('Upload foto absen gagal, absen tetap dilanjutkan:', uploadError.message);
      return null;
    }
  };

  /**
   * Tunggu hasil verifikasi AI (dipicu otomatis oleh backend setelah upload).
   * Tidak pernah menggagalkan absen — kalau AI lambat/gagal, cukup berhenti.
   */
  const pollVerification = async (absentId, kind) => {
    const statusKey = kind === 'clock_in' ? 'ai_clock_in_status' : 'ai_clock_out_status';
    const verdictKey = kind === 'clock_in' ? 'ai_clock_in_verdict' : 'ai_clock_out_verdict';
    const scoreKey = kind === 'clock_in' ? 'ai_clock_in_score' : 'ai_clock_out_score';

    setAiChecking(true);
    setAiMessage('AI sedang menilai foto bukti...');

    try {
      for (let attempt = 0; attempt < 12; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 4000));

        const { data } = await instance.get(`/absents/${absentId}`);
        const absent = data?.data;
        const status = absent?.[statusKey];

        if (status === 'done') {
          setAiMessage(`Verifikasi AI: ${absent[verdictKey] || 'selesai'} (skor ${absent[scoreKey] ?? '-'})`);
          await fetchAttendanceList();
          return;
        }
        if (status === 'failed' || status === 'skipped') {
          setAiMessage('Verifikasi AI tidak tersedia, absen tetap tercatat.');
          await fetchAttendanceList();
          return;
        }
      }

      setAiMessage('Verifikasi AI masih berjalan, cek lagi nanti.');
      await fetchAttendanceList();
    } catch (pollError) {
      console.warn('Polling verifikasi AI gagal:', pollError.message);
      setAiMessage(null);
    } finally {
      setAiChecking(false);
    }
  };

  // Handle attendance check-in
  const handleAbsenMasuk = async () => {
    try {
      setCheckingLocation(true);
      setLocationError(null); // Clear any previous errors

      const userData = await getUserData();
      if (!userData) {
        setLocationError('Data user tidak ditemukan');
        return;
      }

      // Foto bukti wajib — jadi acuan verifikasi AI.
      if (!photoFile) {
        setLocationError('Foto bukti absen wajib diunggah. Gunakan aplikasi GPS Camera.');
        return;
      }

      // Lokasi GPS wajib & harus di dalam radius kantor.
      const gpsResult = await runGpsCheck();
      if (!gpsResult.ok) {
        setLocationError(gpsResult.message);
        return;
      }

      let currentLocation = null;
      try {
        currentLocation = await getCurrentLocation();
      } catch (locationError) {
        setLocationError('Lokasi GPS wajib aktif. Izinkan akses lokasi lalu coba lagi.');
        return;
      }

      // Get Indonesia time
      const indonesiaTime = getIndonesiaTime();
      const year = indonesiaTime.getFullYear();
      const month = String(indonesiaTime.getMonth() + 1).padStart(2, '0');
      const day = String(indonesiaTime.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const hours = String(indonesiaTime.getHours()).padStart(2, '0');
      const minutes = String(indonesiaTime.getMinutes()).padStart(2, '0');
      const seconds = String(indonesiaTime.getSeconds()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}:${seconds}`;

      const photoUrl = await uploadPhoto();

      const absentData = {
        employee_id: userData.id,
        branch_id: userData.branch_id,
        date: dateStr,
        clock_in: timeStr,
        status: 'Present',
        description: photoUrl
          ? 'Absen masuk hari ini (foto GPS camera)'
          : 'Absen masuk hari ini (tanpa foto)',
        // Location data (only if available)
        ...(currentLocation && {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy
        }),
        ...(photoUrl && { photo_clock_in: photoUrl })
      };

      const { data } = await instance.post('/absents', absentData);
      
      // Refresh data
      await checkAttendanceStatus();
      await fetchAttendanceList();

      // Pastikan beranda (dan header) membaca ulang status absen terbaru
      invalidateUserProfileCache();
      
      setShowAbsenModal(false);
      resetPhoto();

      const absentId = data?.data?.id;
      if (photoUrl && absentId) {
        alert('Absensi berhasil! Foto bukti sedang dinilai AI.');
        pollVerification(absentId, 'clock_in');
      } else {
        alert(photoUrl === null && photoFile
          ? 'Absensi berhasil, tetapi foto gagal diunggah.'
          : 'Absensi berhasil! Selamat bekerja.');
      }
      
      // Clear return path session storage after successful attendance
      const returnPath = sessionStorage.getItem('returnAfterAttendance');
      if (returnPath) {
        sessionStorage.removeItem('returnAfterAttendance');
      }
      
    } catch (error) {
      console.error('Error during attendance:', error);
      
      // Handle backend validation errors
      if (error.response?.data?.error?.message) {
        // Backend error format: { error: { message: "..." } }
        setLocationError(error.response.data.error.message);
      } else if (error.response?.data?.message) {
        // Alternative backend error format: { message: "..." }
        setLocationError(error.response.data.message);
      } else if (error.message) {
        // Frontend error (GPS, network, etc.)
        setLocationError(error.message);
      } else {
        setLocationError('Terjadi kesalahan saat melakukan absensi');
      }
    } finally {
      setCheckingLocation(false);
    }
  };

  // Handle end work
  const handleEndWork = async () => {
    if (!endWorkTime) {
      setLocationError('Silakan pilih jam pulang');
      return;
    }

    if (!photoFile) {
      setLocationError('Foto bukti pulang wajib diunggah. Gunakan aplikasi GPS Camera.');
      return;
    }

    const gpsResult = await runGpsCheck();
    if (!gpsResult.ok) {
      setLocationError(gpsResult.message);
      return;
    }

    try {
      setUpdating(true);

      const photoUrl = await uploadPhoto();
      if (!photoUrl) {
        setLocationError('Foto gagal diunggah. Periksa koneksi lalu pilih ulang foto.');
        return;
      }

      // Ambil koordinat final (bisa beda dari hasil cek awal) untuk divalidasi backend.
      let coords = null;
      try {
        coords = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos.coords),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
          );
        });
      } catch {
        coords = null;
      }

      const updateData = {
        clock_out: endWorkTime,
        description: 'Absen pulang (foto GPS camera)',
        photo_clock_out: photoUrl,
        ...(coords && {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy
        })
      };

      await instance.put(`/absents/${selectedAbsent.id}`, updateData);
      
      // Refresh data
      await checkAttendanceStatus();
      await fetchAttendanceList();
      
      setShowEndWorkModal(false);
      resetPhoto();

      alert('Absensi pulang tercatat. Foto bukti sedang dinilai AI.');
      pollVerification(selectedAbsent.id, 'clock_out');
      
    } catch (error) {
      console.error('Error updating attendance:', error);
      setLocationError(
        error?.response?.data?.message ||
          error?.response?.data?.data?.message ||
          'Gagal menyimpan absen pulang. Coba lagi.'
      );
    } finally {
      setUpdating(false);
    }
  };

  // Handle izin submission
  const handleIzinSubmit = async () => {
    if (!izinDescription.trim()) {
      alert('Silakan isi alasan izin');
      return;
    }

    if (izinDescription.trim().length < 10) {
      alert('Alasan izin minimal 10 karakter');
      return;
    }

    if (!izinDate) {
      alert('Silakan pilih tanggal izin');
      return;
    }

    try {
      setSubmittingIzin(true);
      
      const izinData = {
        status: 'PersonalLeave', // Status izin umum
        description: izinDescription.trim(),
        date: izinDate // Tanggal izin yang dipilih
      };

      await instance.post('/permissions', izinData);
      
      // Refresh data
      await checkAttendanceStatus();
      await fetchAttendanceList();
      
      setShowIzinModal(false);
      setIzinDescription('');
      setIzinDate('');
      alert('Pengajuan izin berhasil disubmit');
      
    } catch (error) {
      console.error('Error submitting izin:', error);
      const errorMessage = error.response?.data?.message || 'Gagal mengajukan izin';
      alert(errorMessage);
    } finally {
      setSubmittingIzin(false);
    }
  };

  // Format time
  const formatTime = (dateString, timeString) => {
    if (!dateString || !timeString) return "-";
    const dateTime = `${dateString}T${timeString}`;
    return new Date(dateTime).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric"
    });
  };

  // Nama hari singkat (Sen, Sel, ...)
  const formatWeekday = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("id-ID", { weekday: "short" });
  };

  // Durasi kerja dari jam masuk & pulang
  const formatDuration = (dateString, clockIn, clockOut) => {
    if (!dateString || !clockIn || !clockOut) return null;
    const start = new Date(`${dateString}T${clockIn}`);
    const end = new Date(`${dateString}T${clockOut}`);
    const minutes = Math.round((end - start) / 60000);
    if (!Number.isFinite(minutes) || minutes <= 0) return null;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return hours > 0 ? `${hours}j ${rest}m` : `${rest}m`;
  };

  const shiftMonth = (delta) => {
    const next = new Date(currentYear, currentMonth - 1 + delta, 1);
    setCurrentYear(next.getFullYear());
    setCurrentMonth(next.getMonth() + 1);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    localStorage.removeItem("workStartTime");
    sessionStorage.removeItem("fromPresent");
    sessionStorage.removeItem("fromIzin");
    navigate('/');
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          checkAttendanceStatus(),
          fetchAttendanceList()
        ]);
      } catch (error) {
        setError('Gagal memuat data kehadiran');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Set default izin date when modal opens
  useEffect(() => {
    if (showIzinModal) {
      const today = getIndonesiaTime();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setIzinDate(`${year}-${month}-${day}`);
    }
  }, [showIzinModal]);

  // Separate effect for month/year changes
  useEffect(() => {
    if (currentMonth && currentYear) {
      fetchAttendanceList(true);
    }
  }, [currentMonth, currentYear]);

  const todayAbsent = attendanceData?.todayAbsent || null;
  const todayDate = todayAbsent?.date || null;
  const todayIn = todayAbsent?.clock_in ? formatTime(todayDate, todayAbsent.clock_in) : null;
  const todayOut = todayAbsent?.clock_out ? formatTime(todayDate, todayAbsent.clock_out) : null;
  const todayDuration = formatDuration(todayDate, todayAbsent?.clock_in, todayAbsent?.clock_out);
  const todayExpectedIn = todayAbsent?.expected_clock_in
    ? String(todayAbsent.expected_clock_in).slice(0, 5)
    : null;
  const todayExpectedOut = todayAbsent?.expected_clock_out
    ? String(todayAbsent.expected_clock_out).slice(0, 5)
    : null;

  const clockText = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const dateText = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  const monthLabel = new Date(currentYear, currentMonth - 1, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric'
  });

  // Tombol absen masuk hanya aktif kalau foto & lokasi sudah valid
  const canSubmitAbsen = Boolean(photoFile) && gpsCheck.status === 'ok' && !checkingLocation;

  const closeAbsenModal = () => {
    setShowAbsenModal(false);
    setLocationError(null);
    setGpsCheck({ status: 'idle', distance: null, message: null });
  };

  // Begitu modal absen (masuk/pulang) dibuka, langsung cek GPS + radius kantor.
  useEffect(() => {
    if (!showAbsenModal && !showEndWorkModal) return;
    setLocationError(null);
    runGpsCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAbsenModal, showEndWorkModal]);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-krem">
        <LoadingDots />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-krem font-montserrat">
      <Header
        onLogout={handleLogout}
        showBackButton={true}
        backPath={sessionStorage.getItem('returnAfterAttendance') || null}
        title="Kehadiran"
        description="Absensi harian & riwayat"
      />

      <main className="mx-auto w-full max-w-md px-4 pb-28 pt-[4.5rem]">
        {/* Kartu status hari ini */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-telaga-900 via-telaga-800 to-telaga-700 p-5 text-white shadow-lg shadow-telaga-900/20">
          <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-white/5" />

          <div className="relative">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-telaga-200/80">
                  <Sun className="h-3 w-3" />
                  <span className="truncate">{dateText}</span>
                </p>
                <p className="mt-1 text-[26px] font-bold leading-none tabular-nums">{clockText}</p>
              </div>

              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${
                  attendanceData?.isAbsent
                    ? 'bg-telaga-400/20 text-telaga-100 ring-telaga-300/30'
                    : 'bg-senja-400/20 text-senja-100 ring-senja-300/30'
                }`}
              >
                {attendanceData?.isAbsent ? 'Sudah absen' : 'Belum absen'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-telaga-200/70">Masuk</p>
                <p className="mt-0.5 text-base font-bold leading-none tabular-nums">
                  {todayIn || '--:--'}
                </p>
                {todayExpectedIn && (
                  <p className="mt-1 text-[9px] text-telaga-200/60">jadwal {todayExpectedIn}</p>
                )}
              </div>

              <div className="rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-telaga-200/70">Pulang</p>
                <p className="mt-0.5 text-base font-bold leading-none tabular-nums">
                  {todayOut || '--:--'}
                </p>
                {todayExpectedOut && (
                  <p className="mt-1 text-[9px] text-telaga-200/60">jadwal {todayExpectedOut}</p>
                )}
              </div>
            </div>

            {(todayDuration || todayAbsent?.is_late || attendanceData?.hasUnfinishedAbsent) && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {todayDuration && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-telaga-100 ring-1 ring-white/10">
                    <Timer className="h-2.5 w-2.5" /> {todayDuration} bekerja
                  </span>
                )}
                {todayAbsent?.is_late && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-senja-400/20 px-2 py-0.5 text-[10px] font-semibold text-senja-100 ring-1 ring-senja-300/30">
                    <AlertTriangle className="h-2.5 w-2.5" /> Telat {todayAbsent.late_minutes} mnt
                  </span>
                )}
                {attendanceData?.hasUnfinishedAbsent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-100 ring-1 ring-amber-300/30">
                    <AlertTriangle className="h-2.5 w-2.5" /> Lupa absen pulang kemarin
                  </span>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Aksi utama */}
        {!attendanceData?.isAbsent ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <AnimatedButton
              variant="telaga"
              onClick={() => {
                resetPhoto();
                setLocationError(null);
                setShowAbsenModal(true);
              }}
              className="flex items-center justify-center gap-1.5 rounded-2xl py-3 text-xs"
            >
              <MapPin className="h-3.5 w-3.5" /> Absen Masuk
            </AnimatedButton>

            <button
              type="button"
              onClick={() => setShowIzinModal(true)}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-senja-200 bg-white py-3 text-xs font-semibold text-senja-700 transition-colors hover:bg-senja-50"
            >
              <CalendarDays className="h-3.5 w-3.5" /> Ajukan Izin
            </button>
          </div>
        ) : todayAbsent && !todayAbsent.clock_out && (todayAbsent.status === 'Present' || todayAbsent.status === 'hadir') ? (
          <button
            type="button"
            onClick={() => {
              setSelectedAbsent({
                id: todayAbsent.id,
                date: todayAbsent.date,
                clockIn: todayAbsent.clock_in,
                clockOut: todayAbsent.clock_out,
                status: todayAbsent.status
              });
              resetPhoto();
              const current = getIndonesiaTime();
              setEndWorkTime(
                `${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}`
              );
              setShowEndWorkModal(true);
            }}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-telaga-200 bg-white py-3 text-xs font-semibold text-telaga-800 transition-colors hover:bg-telaga-50"
          >
            <Clock className="h-3.5 w-3.5" /> Absen Pulang Sekarang
          </button>
        ) : null}

        {/* Statistik bulan ini */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-telaga-100 bg-white p-3 text-center">
            <p className="text-lg font-bold leading-none text-telaga-900">{attendanceStats.totalHadir}</p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-telaga-900/40">Hadir</p>
          </div>
          <div className="rounded-2xl border border-telaga-100 bg-white p-3 text-center">
            <p className="text-lg font-bold leading-none text-senja-700">{attendanceStats.totalIzin}</p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-telaga-900/40">Izin</p>
          </div>
          <div className="rounded-2xl border border-telaga-100 bg-white p-3 text-center">
            <p className="text-lg font-bold leading-none text-telaga-900/40">{attendanceStats.totalDays}</p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-telaga-900/40">Total hari</p>
          </div>
        </div>

        {/* Navigasi bulan */}
        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wide text-telaga-900/50">Riwayat</h2>

          <div className="flex items-center gap-1 rounded-full border border-telaga-100 bg-white p-0.5">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Bulan sebelumnya"
              className="rounded-full p-1 text-telaga-900/50 transition-colors hover:bg-telaga-50 hover:text-telaga-900"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[6.5rem] text-center text-[10px] font-semibold capitalize text-telaga-950">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Bulan berikutnya"
              className="rounded-full p-1 text-telaga-900/50 transition-colors hover:bg-telaga-50 hover:text-telaga-900"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Daftar kehadiran */}
        {listLoading ? (
          <ul className="mt-3 space-y-2">
            {[...Array(4)].map((_, index) => (
              <li
                key={index}
                className="flex items-center gap-3 rounded-2xl border border-telaga-100 bg-white p-3"
              >
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-telaga-900/5" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 animate-pulse rounded bg-telaga-900/5" />
                  <div className="h-2.5 w-16 animate-pulse rounded bg-telaga-900/5" />
                </div>
              </li>
            ))}
          </ul>
        ) : attendanceList.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-telaga-200 py-12 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-telaga-300" />
            <p className="mt-2 text-sm font-semibold text-telaga-900/60">Belum ada kehadiran</p>
            <p className="mx-auto mt-1 max-w-[15rem] text-[11px] leading-relaxed text-telaga-900/40">
              Tidak ada data absensi pada {monthLabel}.
            </p>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {attendanceList.map((absen, index) => {
              const meta = STATUS_META[absen.status] || {
                label: absen.status,
                chip: 'bg-telaga-900/5 text-telaga-900/50 ring-telaga-100'
              };
              const duration = formatDuration(absen.date, absen.clockIn, absen.clockOut);
              const isOpen =
                !absen.clockOut && (absen.status === 'Present' || absen.status === 'hadir');

              return (
                <li
                  key={`${absen.id}-${index}`}
                  className="rounded-2xl border border-telaga-100 bg-white p-3 shadow-sm shadow-telaga-900/5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-telaga-50">
                      <span className="text-base font-bold leading-none text-telaga-900">
                        {formatDate(absen.date)}
                      </span>
                      <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-telaga-700/60">
                        {formatWeekday(absen.date)}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-telaga-950 tabular-nums">
                          {formatTime(absen.date, absen.clockIn)}
                          <ArrowRight className="h-3 w-3 text-telaga-900/25" />
                          {absen.clockOut ? (
                            formatTime(absen.date, absen.clockOut)
                          ) : (
                            <span className="text-telaga-900/30">--:--</span>
                          )}
                        </span>

                        {duration && (
                          <span className="rounded-md bg-telaga-900/5 px-1.5 py-0.5 text-[9px] font-semibold text-telaga-900/50">
                            {duration}
                          </span>
                        )}

                        <span className={`${chipBase} ${meta.chip}`}>
                          {absen.status === 'Present' || absen.status === 'hadir' ? (
                            <CheckCircle2 className="h-2.5 w-2.5" />
                          ) : (
                            <AlertTriangle className="h-2.5 w-2.5" />
                          )}
                          {meta.label}
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        {absen.isLate && (
                          <span className={`${chipBase} bg-senja-50 text-senja-700 ring-senja-100`}>
                            <Clock className="h-2.5 w-2.5" />
                            Telat {absen.lateMinutes} mnt
                            {absen.expectedIn ? ` · jadwal ${String(absen.expectedIn).slice(0, 5)}` : ''}
                          </span>
                        )}
                        <AiChip
                          kind="masuk"
                          status={absen.aiClockInStatus}
                          verdict={absen.aiClockInVerdict}
                          score={absen.aiClockInScore}
                          reason={absen.aiClockInReason}
                        />
                        <AiChip
                          kind="pulang"
                          status={absen.aiClockOutStatus}
                          verdict={absen.aiClockOutVerdict}
                          score={absen.aiClockOutScore}
                          reason={absen.aiClockOutReason}
                        />
                      </div>

                      {absen.description && absen.description !== '-' && (
                        <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-telaga-900/40">
                          {absen.description}
                        </p>
                      )}
                    </div>

                    {isOpen && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAbsent(absen);
                          resetPhoto();
                          const current = getIndonesiaTime();
                          setEndWorkTime(
                            `${String(current.getHours()).padStart(2, '0')}:${String(
                              current.getMinutes()
                            ).padStart(2, '0')}`
                          );
                          setShowEndWorkModal(true);
                        }}
                        className="shrink-0 rounded-xl bg-red-50 px-2 py-1.5 text-[10px] font-semibold text-red-600 ring-1 ring-red-100 transition-colors hover:bg-red-100"
                      >
                        Akhiri
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {/* Modal Absen Masuk */}
      {showAbsenModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-telaga-950/50 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl">
            <div className="flex items-start justify-between border-b border-telaga-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-bold text-telaga-950">Absen Masuk</h2>
                <p className="text-[10px] text-telaga-900/45">
                  {checkingLocation ? 'Memproses absensi…' : 'Pakai foto GPS Camera sebagai bukti'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAbsenModal}
                className="rounded-lg p-1.5 text-telaga-900/40 transition-colors hover:bg-telaga-900/5 hover:text-telaga-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {locationError && (
                <div className="mb-3 rounded-xl bg-red-50 px-3 py-2.5 ring-1 ring-red-100">
                  <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-red-700">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    {locationError}
                  </p>
                </div>
              )}

              <div className="rounded-xl bg-telaga-50 px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-telaga-800">
                  <Clock className="h-3 w-3" />
                  {getIndonesiaTime().toLocaleString('id-ID', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <p className="mt-1 flex items-start gap-1.5 text-[10px] leading-relaxed text-telaga-700/70">
                  <MapPin className="mt-0.5 h-2.5 w-2.5 shrink-0" />
                  Lokasi & foto wajib. Foto watermark jadi acuan validasi AI.
                </p>
              </div>

              {/* Status validasi GPS */}
              <div
                className={`mt-2 flex items-center justify-between gap-2 rounded-xl px-3 py-2 ring-1 ${
                  GPS_STATUS_STYLE[gpsCheck.status] || GPS_STATUS_STYLE.idle
                }`}
              >
                <p className="flex min-w-0 items-center gap-1.5 text-[10px] font-semibold leading-snug">
                  {gpsCheck.status === 'locating' ? (
                    <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                  ) : gpsCheck.status === 'ok' ? (
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                  ) : gpsCheck.status === 'idle' ? (
                    <MapPin className="h-3 w-3 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                  )}
                  <span className="truncate">
                    {gpsCheck.status === 'locating'
                      ? 'Mendeteksi lokasi…'
                      : gpsCheck.message || 'Lokasi belum dicek'}
                  </span>
                </p>
                {gpsCheck.status !== 'locating' && (
                  <button
                    type="button"
                    onClick={runGpsCheck}
                    className="shrink-0 rounded-lg bg-white/70 px-2 py-1 text-[9px] font-bold uppercase tracking-wide transition-colors hover:bg-white"
                  >
                    Cek ulang
                  </button>
                )}
              </div>

              <div className="mt-3">
                <label className="text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                  Foto bukti masuk
                </label>

                {photoPreview ? (
                  <div className="relative mt-1.5">
                    <img
                      src={photoPreview}
                      alt="Foto bukti absen masuk"
                      className="h-40 w-full rounded-xl object-cover ring-1 ring-telaga-100"
                    />
                    <button
                      type="button"
                      onClick={resetPhoto}
                      className="absolute right-2 top-2 rounded-full bg-telaga-950/60 p-1.5 text-white backdrop-blur-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="mt-1.5 flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-telaga-200 text-telaga-900/40 transition-colors hover:border-telaga-400 hover:text-telaga-700">
                    <Camera className="h-5 w-5" />
                    <span className="text-[10px] font-semibold">Pilih foto dari GPS Camera</span>
                    <span className="text-[9px] text-telaga-900/30">Wajib terlihat tanggal, jam & lokasi</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoPicked} />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-2 border-t border-telaga-100 px-4 py-3">
              <button
                type="button"
                onClick={closeAbsenModal}
                className="flex-1 rounded-xl bg-telaga-900/5 py-2.5 text-xs font-semibold text-telaga-900/60 transition-colors hover:bg-telaga-900/10"
              >
                Batal
              </button>
              <AnimatedButton
                variant="telaga"
                onClick={handleAbsenMasuk}
                disabled={!canSubmitAbsen}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs disabled:cursor-not-allowed disabled:bg-telaga-900/10 disabled:text-telaga-900/40 disabled:shadow-none"
              >
                {checkingLocation ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memproses
                  </>
                ) : gpsCheck.status === 'locating' ? (
                  'Cek lokasi…'
                ) : !photoFile ? (
                  'Foto belum dipilih'
                ) : gpsCheck.status !== 'ok' ? (
                  'Lokasi belum valid'
                ) : (
                  'Absen Masuk'
                )}
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal Absen Pulang */}
      {showEndWorkModal && selectedAbsent && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-telaga-950/50 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl">
            <div className="flex items-start justify-between border-b border-telaga-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-bold text-telaga-950">Absen Pulang</h2>
                <p className="text-[10px] text-telaga-900/45">
                  {formatWeekday(selectedAbsent.date)}, {formatDate(selectedAbsent.date)}{' '}
                  {new Date(selectedAbsent.date).toLocaleDateString('id-ID', { month: 'long' })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEndWorkModal(false)}
                className="rounded-lg p-1.5 text-telaga-900/40 transition-colors hover:bg-telaga-900/5 hover:text-telaga-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {locationError && (
                <div className="mb-3 rounded-xl bg-red-50 px-3 py-2.5 ring-1 ring-red-100">
                  <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-red-700">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    {locationError}
                  </p>
                </div>
              )}

              <div className="rounded-xl bg-telaga-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-telaga-700/60">
                  Jam masuk
                </p>
                <p className="mt-0.5 text-sm font-bold text-telaga-900 tabular-nums">
                  {formatTime(selectedAbsent.date, selectedAbsent.clockIn)}
                </p>
              </div>

              <label className="mt-3 block text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                Jam pulang
              </label>
              <input
                type="time"
                value={endWorkTime}
                onChange={(e) => setEndWorkTime(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-telaga-100 px-3 py-2.5 text-sm font-semibold text-telaga-950 tabular-nums outline-none focus:border-telaga-400"
              />

              <div className="mt-3">
                <label className="text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                  Foto bukti pulang
                </label>

                {photoPreview ? (
                  <div className="relative mt-1.5">
                    <img
                      src={photoPreview}
                      alt="Foto bukti absen pulang"
                      className="h-40 w-full rounded-xl object-cover ring-1 ring-telaga-100"
                    />
                    <button
                      type="button"
                      onClick={resetPhoto}
                      className="absolute right-2 top-2 rounded-full bg-telaga-950/60 p-1.5 text-white backdrop-blur-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="mt-1.5 flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-telaga-200 text-telaga-900/40 transition-colors hover:border-telaga-400 hover:text-telaga-700">
                    <Camera className="h-5 w-5" />
                    <span className="text-[10px] font-semibold">Pilih foto dari GPS Camera</span>
                    <span className="text-[9px] text-telaga-900/30">Wajib terlihat tanggal, jam & lokasi</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoPicked} />
                  </label>
                )}
              </div>

              {/* Status validasi GPS */}
              <div
                className={`mt-2 flex items-center justify-between gap-2 rounded-xl px-3 py-2 ring-1 ${
                  GPS_STATUS_STYLE[gpsCheck.status] || GPS_STATUS_STYLE.idle
                }`}
              >
                <p className="flex min-w-0 items-center gap-1.5 text-[10px] font-semibold leading-snug">
                  {gpsCheck.status === 'locating' ? (
                    <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                  ) : gpsCheck.status === 'ok' ? (
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                  ) : gpsCheck.status === 'idle' ? (
                    <MapPin className="h-3 w-3 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                  )}
                  <span className="truncate">
                    {gpsCheck.status === 'locating'
                      ? 'Mendeteksi lokasi…'
                      : gpsCheck.message || 'Lokasi belum dicek'}
                  </span>
                </p>
                {gpsCheck.status !== 'locating' && (
                  <button
                    type="button"
                    onClick={runGpsCheck}
                    className="shrink-0 rounded-lg bg-white/70 px-2 py-1 text-[9px] font-bold uppercase tracking-wide transition-colors hover:bg-white"
                  >
                    Cek ulang
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 border-t border-telaga-100 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setShowEndWorkModal(false);
                  setLocationError(null);
                  setGpsCheck({ status: 'idle', distance: null, message: null });
                }}
                className="flex-1 rounded-xl bg-telaga-900/5 py-2.5 text-xs font-semibold text-telaga-900/60 transition-colors hover:bg-telaga-900/10"
              >
                Batal
              </button>
              <AnimatedButton
                variant="telaga"
                onClick={handleEndWork}
                disabled={updating || !endWorkTime || !photoFile || gpsCheck.status !== 'ok'}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs disabled:cursor-not-allowed disabled:bg-telaga-900/10 disabled:text-telaga-900/40 disabled:shadow-none"
              >
                {updating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyimpan
                  </>
                ) : gpsCheck.status === 'locating' ? (
                  'Cek lokasi…'
                ) : !photoFile ? (
                  'Foto belum dipilih'
                ) : gpsCheck.status !== 'ok' ? (
                  'Lokasi belum valid'
                ) : (
                  'Simpan'
                )}
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal Izin */}
      {showIzinModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-telaga-950/50 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl">
            <div className="flex items-start justify-between border-b border-telaga-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-bold text-telaga-950">Ajukan Izin</h2>
                <p className="text-[10px] text-telaga-900/45">Isi tanggal dan alasan izin</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowIzinModal(false);
                  setIzinDescription('');
                  setIzinDate('');
                }}
                className="rounded-lg p-1.5 text-telaga-900/40 transition-colors hover:bg-telaga-900/5 hover:text-telaga-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <label className="block text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                Tanggal izin
              </label>
              <input
                type="date"
                value={izinDate}
                onChange={(e) => setIzinDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-telaga-100 px-3 py-2.5 text-sm text-telaga-950 outline-none focus:border-telaga-400"
              />

              <label className="mt-3 block text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                Alasan izin
              </label>
              <textarea
                value={izinDescription}
                onChange={(e) => setIzinDescription(e.target.value)}
                placeholder="Contoh: keperluan keluarga, kondisi tidak fit…"
                className="mt-1.5 h-24 w-full resize-none rounded-xl border border-telaga-100 px-3 py-2.5 text-xs leading-relaxed text-telaga-950 outline-none placeholder:text-telaga-900/30 focus:border-telaga-400"
                maxLength={500}
              />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[9px] text-telaga-900/35">Minimal 10 karakter</span>
                <span className="text-[9px] text-telaga-900/35">{izinDescription.length}/500</span>
              </div>
            </div>

            <div className="flex gap-2 border-t border-telaga-100 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setShowIzinModal(false);
                  setIzinDescription('');
                  setIzinDate('');
                }}
                className="flex-1 rounded-xl bg-telaga-900/5 py-2.5 text-xs font-semibold text-telaga-900/60 transition-colors hover:bg-telaga-900/10"
              >
                Batal
              </button>
              <AnimatedButton
                variant="senja"
                onClick={handleIzinSubmit}
                disabled={submittingIzin || izinDescription.trim().length < 10}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs disabled:cursor-not-allowed disabled:bg-telaga-900/10 disabled:text-telaga-900/40 disabled:shadow-none"
              >
                {submittingIzin ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mengirim
                  </>
                ) : (
                  'Ajukan Izin'
                )}
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}

      {/* Toast status verifikasi AI */}
      {aiMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 flex max-w-[92%] -translate-x-1/2 items-center gap-2 rounded-full bg-telaga-950/90 px-4 py-2 text-[10px] font-semibold text-white shadow-lg backdrop-blur-sm">
          {aiChecking ? (
            <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
          ) : (
            <Bot className="h-3 w-3 shrink-0" />
          )}
          <span className="leading-tight">{aiMessage}</span>
        </div>
      )}
    </div>
  );
};

export default UnifiedAttendancePage;
