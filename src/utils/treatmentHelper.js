// Kategori produk F&B (plus 'Lainnya') hanya dijual di cabang mode 'cafe'.
// 'loket' hanya melayani tiket masuk, retribusi, dan jasa wisata — tanpa tamu & meja.
// 'mixed' menjual keduanya, jadi tidak disaring.
export const PRODUCT_SERVICE_TYPES = ['Makanan', 'Minuman', 'Snack', 'Souvenir', 'Lainnya'];

export const ORDER_MODE = {
  LOKET: 'loket',
  CAFE: 'cafe',
  MIXED: 'mixed',
};

export const orderModeOptions = [
  { value: ORDER_MODE.LOKET, label: 'Loket', description: 'Tiket masuk, retribusi, paket wisata — tanpa data tamu & meja' },
  { value: ORDER_MODE.CAFE, label: 'Cafe', description: 'Makanan & minuman — wajib nama pemesan + no meja' },
  { value: ORDER_MODE.MIXED, label: 'Campur (Loket + Cafe)', description: 'Semua produk; data tamu & meja hanya untuk item F&B' },
];

export const isProductServiceType = (typeService) =>
  PRODUCT_SERVICE_TYPES.includes(String(typeService || '').trim());

export const isFnbTreatment = (treatment) => isProductServiceType(treatment?.type_service);

// Kategori yang dikerjakan dapur (masak/racik). Souvenir & Lainnya tidak masuk
// karena barang siap jual — dipakai untuk menentukan status awal item.
export const KITCHEN_SERVICE_TYPES = ['Makanan', 'Minuman', 'Snack'];

export const isKitchenTreatment = (treatment) =>
  KITCHEN_SERVICE_TYPES.includes(String(treatment?.type_service || '').trim());

// Kategori produk bisa dibatasi ke satu mode outlet lewat kolom order_mode
// ('loket' | 'cafe'). Null berarti tampil di semua outlet.
export const getCategoryOrderMode = (treatment) => {
  const value = String(treatment?.category?.order_mode || '').trim().toLowerCase();
  return value === ORDER_MODE.LOKET || value === ORDER_MODE.CAFE ? value : null;
};

/**
 * Aturan tampil katalog: kolom order_mode pada kategori produk jadi penentu utama.
 * Kalau kategori belum diatur (atau produk tanpa kategori), kembali ke aturan lama
 * berbasis type_service supaya perilaku lama tidak berubah.
 */
export const isTreatmentVisibleInOrderMode = (treatment, orderMode) => {
  if (orderMode !== ORDER_MODE.LOKET && orderMode !== ORDER_MODE.CAFE) return true;

  const categoryMode = getCategoryOrderMode(treatment);
  if (categoryMode) return categoryMode === orderMode;

  return orderMode === ORDER_MODE.CAFE ? isFnbTreatment(treatment) : !isFnbTreatment(treatment);
};

/**
 * Katalog Quick Order mengikuti outlet cabang aktif, murni dari pengaturan
 * `order_mode` pada kategori produk. Kategori yang belum diatur (NULL) berarti
 * tampil di semua outlet, jadi tanpa konfigurasi tidak ada yang disembunyikan.
 * Mode 'mixed' dan mode yang belum diketahui (null) tidak menyaring apa pun.
 */
export const isTreatmentVisibleForOutlet = (treatment, orderMode) => {
  if (orderMode !== ORDER_MODE.LOKET && orderMode !== ORDER_MODE.CAFE) return true;

  const categoryMode = getCategoryOrderMode(treatment);
  return !categoryMode || categoryMode === orderMode;
};

export const filterTreatmentsForOutlet = (treatments, orderMode) => {
  const list = Array.isArray(treatments) ? treatments : [];
  if (orderMode !== ORDER_MODE.LOKET && orderMode !== ORDER_MODE.CAFE) return list;
  return list.filter((treatment) => isTreatmentVisibleForOutlet(treatment, orderMode));
};

/**
 * Saring daftar treatment sesuai mode operasional cabang, supaya tiap kasir
 * hanya melihat katalognya sendiri (termasuk di pencarian & AI detection).
 * Mode 'mixed' dan mode yang belum diketahui (null) tidak menyaring apa pun.
 */
export const filterTreatmentsForOrderMode = (treatments, orderMode) => {
  const list = Array.isArray(treatments) ? treatments : [];
  if (orderMode !== ORDER_MODE.LOKET && orderMode !== ORDER_MODE.CAFE) return list;
  return list.filter((treatment) => isTreatmentVisibleInOrderMode(treatment, orderMode));
};
