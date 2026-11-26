import instance, { API_URL } from '../config/api';
import { resizeImageFile } from '../pages/ORDER/components/OrderDetail/ImageResizeUtil';

const MAX_SIZE_MB = 10;

/**
 * Upload a single photo file after resizing
 * @param {File} file - Image file to upload
 * @param {object} options - Resize options
 * @returns {Promise<string>} - URL of uploaded photo
 */
export async function uploadSinglePhoto(file, options = {}) {
  const { maxWidth = 1024, maxHeight = 1024, quality = 0.7 } = options;

  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar');
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`Ukuran maksimal ${MAX_SIZE_MB}MB per foto`);
  }

  // Resize
  const resizedBlob = await resizeImageFile(file, { maxWidth, maxHeight, quality });
  // Hasil resize selalu JPEG, jadi paksa ekstensi .jpg agar lolos validasi backend
  // (backend hanya menerima mimetype image/jpeg + ekstensi .jpg/.jpeg/.png).
  const baseName = (file.name || 'photo').replace(/\.[^.]+$/, '') || 'photo';
  const resizedFile = new File([resizedBlob], `${baseName}.jpg`, { type: 'image/jpeg' });

  // Upload
  const formData = new FormData();
  formData.append('photos', resizedFile);

  const response = await instance.post('/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });

  if (response.data && Array.isArray(response.data.data)) {
    const photos = response.data.data.map(photo => {
      if (photo.url_photo && !photo.url_photo.startsWith('http')) {
        return { ...photo, url_photo: `${API_URL}/${photo.url_photo.replace(/^\//, '')}` };
      }
      return photo;
    });
    return photos[0]?.url_photo || '';
  }

  throw new Error('Upload gagal: response tidak valid');
}

/**
 * Upload satu foto bukti pembayaran (QRIS / transfer).
 * @param {File} file - gambar bukti bayar
 * @returns {Promise<string>} - path foto relatif dari server, mis. "public/images/evidence/Nov-2026/..."
 */
export async function uploadPaymentProof(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar');
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`Ukuran maksimal ${MAX_SIZE_MB}MB`);
  }

  const resizedBlob = await resizeImageFile(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.75 });
  const baseName = (file.name || 'bukti').replace(/\.[^.]+$/, '') || 'bukti';
  const resizedFile = new File([resizedBlob], `${baseName}.jpg`, { type: 'image/jpeg' });

  const formData = new FormData();
  formData.append('photos', resizedFile);

  const response = await instance.post('/uploads-evidence', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });

  const uploaded = response.data?.data?.[0];
  if (!uploaded?.url_photo) {
    throw new Error('Upload gagal: response tidak valid');
  }

  return uploaded.url_photo;
}

/**
 * Upload multiple photos sequentially
 * @param {File[]} files - Array of image files
 * @param {function} [onProgress] - Progress callback ({current, total})
 * @returns {Promise<string[]>} - Array of uploaded photo URLs
 */
export async function uploadMultiplePhotos(files, onProgress) {
  const urls = [];

  for (let i = 0; i < files.length; i++) {
    if (onProgress) onProgress({ current: i + 1, total: files.length });

    const url = await uploadSinglePhoto(files[i]);
    if (url) urls.push(url);
  }

  return urls;
}

/**
 * Convert a data URL to a File object
 * @param {string} dataUrl
 * @param {string} filename
 * @returns {File}
 */
export function dataURLToFile(dataUrl, filename = 'photo.jpg') {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}
