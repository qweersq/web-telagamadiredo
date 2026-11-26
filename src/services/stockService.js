import instance from '../config/api';

/**
 * Service stok barang per outlet.
 *
 * Backend: server/src/routes/stockRoutes.js
 * Master barang memakai tabel `treatment` (Indomie, Popmie, tiket, ...),
 * angka stok ada di `treatment_stocks` per outlet.
 *
 * Barang yang belum punya baris stok dianggap "belum di-track" sehingga
 * penjualannya tidak memotong stok apa pun.
 */
export const stockService = {
  /** Daftar barang + sisa stok pada satu outlet. */
  async getStocks({ branchId, search, status, onlyTracked } = {}) {
    const params = {};
    if (branchId) params.branch_id = branchId;
    if (search) params.search = search;
    if (status) params.status = status;
    if (onlyTracked) params.only_tracked = 'true';

    const { data } = await instance.get('/stocks', { params });
    return data;
  },

  /** Riwayat keluar-masuk stok. */
  async getMovements({ branchId, type, search, startDate, endDate, page = 1, pageSize = 30 } = {}) {
    const params = { page, page_size: pageSize };
    if (branchId) params.branch_id = branchId;
    if (type) params.type = type;
    if (search) params.search = search;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const { data } = await instance.get('/stocks/movements', { params });
    return data;
  },

  /** Mulai track stok sebuah barang di satu outlet. */
  async startTracking({ branchId, treatmentId, stock = 0, minStock = 0 }) {
    const { data } = await instance.post('/stocks', {
      branch_id: branchId,
      treatment_id: treatmentId,
      stock,
      min_stock: minStock,
    });
    return data;
  },

  /** Ubah min stok / aktif-nonaktifkan tracking. */
  async updateSettings({ branchId, treatmentId, minStock, isActive }) {
    const payload = { branch_id: branchId };
    if (minStock !== undefined) payload.min_stock = minStock;
    if (isActive !== undefined) payload.is_active = isActive;

    const { data } = await instance.patch(`/stocks/${treatmentId}`, payload);
    return data;
  },

  /** Tambah stok masuk. */
  async restock({ branchId, treatmentId, qty, note }) {
    const { data } = await instance.post('/stocks/restock', {
      branch_id: branchId,
      treatment_id: treatmentId,
      qty,
      note,
    });
    return data;
  },

  /** Koreksi stok fisik (stock opname). */
  async adjust({ branchId, treatmentId, physicalStock, note }) {
    const { data } = await instance.post('/stocks/adjust', {
      branch_id: branchId,
      treatment_id: treatmentId,
      physical_stock: physicalStock,
      note,
    });
    return data;
  },

  /** Pindah stok antar outlet. */
  async transfer({ fromBranchId, toBranchId, treatmentId, qty, note }) {
    const { data } = await instance.post('/stocks/transfer', {
      from_branch_id: fromBranchId,
      to_branch_id: toBranchId,
      treatment_id: treatmentId,
      qty,
      note,
    });
    return data;
  },

  /** Buat barang baru (treatment dengan requires_tracking = false). */
  async createProduct({ name, price, typeItem = 'Barang', typeService = 'F&B', description = '' }) {
    const { data } = await instance.post('/treatments', {
      name,
      price,
      type_item: typeItem,
      type_service: typeService,
      description: description || name,
      requires_tracking: false,
    });
    return data;
  },
};

export default stockService;
