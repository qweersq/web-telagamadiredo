// Utility to parse 'HH.mm' or 'HH:MM' to Date object (today)
function parseTime(dateString, timeString) {
  if (!dateString || !timeString) return null;
  // Accept both '09.40' and '09:40'
  const [h, m] = timeString.replace('.', ':').split(':');
  const date = new Date(dateString);
  date.setHours(Number(h), Number(m), 0, 0);
  return date;
}

export function calculateAttendanceSummary(absenData) {
  if (!Array.isArray(absenData)) return {
    totalHadir: 0,
    totalAlpha: 0,
    totalIzin: 0,
    totalJamKerja: 0,
  };

  let totalHadir = 0;
  let totalAlpha = 0;
  let totalIzin = 0;
  let totalJamKerja = 0;

  absenData.forEach(absen => {
    const status = absen.status?.toLowerCase();
    if (status === 'present' || status === 'hadir') {
      totalHadir++;
      // Hitung jam kerja jika clockIn dan clockOut ada
      if (absen.clockIn && absen.clockOut && absen.date) {
        const clockInDate = parseTime(absen.date, absen.clockIn);
        const clockOutDate = parseTime(absen.date, absen.clockOut);
        if (clockInDate && clockOutDate && clockOutDate > clockInDate) {
          const jamKerja = (clockOutDate - clockInDate) / (1000 * 60 * 60);
          totalJamKerja += jamKerja;
        }
      }
    } else if (status === 'alpha') {
      totalAlpha++;
    } else if (status === 'izin') {
      totalIzin++;
    }
  });

  return {
    totalHadir,
    totalAlpha,
    totalIzin,
    totalJamKerja,
  };
} 