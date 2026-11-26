// Date utility functions

/**
 * Format tanggal dari komponen LOKAL.
 * `date.toISOString()` mengonversi ke UTC sehingga di WIB (UTC+7) tanggal
 * bisa bergeser mundur 1 hari (mis. pilih 19 Okt → tersimpan 18 Okt).
 */
export const toLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Normalisasi nilai jam (legacy) menjadi "HH:mm".
 * Data lama menyimpan range seperti "16:00-18:00"; ambil jam mulainya agar
 * tetap kompatibel dengan `<input type="time">` dan `new Date(date + 'T' + time)`.
 */
export const normalizeTimeString = (time) => {
  if (!time) return '';
  const value = String(time).trim();
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return '';
  return `${String(match[1]).padStart(2, '0')}:${match[2]}`;
};

/**
 * Gabungkan tanggal (YYYY-MM-DD) + jam (HH:mm / range legacy) menjadi Date.
 * Mengembalikan null kalau tidak valid.
 */
export const buildDateTime = (dateString, timeString) => {
  const date = String(dateString || '').slice(0, 10);
  const time = normalizeTimeString(timeString) || '00:00';
  if (!date) return null;
  const parsed = new Date(`${date}T${time}`);
  return isNaN(parsed.getTime()) ? null : parsed;
};
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const formatted = date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  // Trim any extra whitespace or characters
  return formatted.trim();
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDaysRemaining = (endDate) => {
  if (!endDate) return 0;
  
  const today = new Date();
  const end = new Date(endDate);
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

export const formatDaysSince = (dateString) => {
  if (!dateString) return 0;
  
  const today = new Date();
  const date = new Date(dateString);
  const diffTime = today - date;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

export const isToday = (dateString) => {
  if (!dateString) return false;
  
  const today = new Date();
  const date = new Date(dateString);
  
  return date.toDateString() === today.toDateString();
};

export const isExpired = (endDate) => {
  if (!endDate) return false;
  
  const today = new Date();
  const end = new Date(endDate);
  
  return end < today;
};

export const getTimeAgo = (dateString) => {
  if (!dateString) return 'N/A';
  
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(dateString);
};
