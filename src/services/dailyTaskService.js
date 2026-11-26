import instance from '../config/api';

/**
 * Client API untuk modul Tugas Harian.
 *
 * Semua endpoint sudah tenant-scoped di server (`req.user.tenant_id`), jadi
 * frontend tidak perlu mengirim tenant_id. Cukup kirim cabang & tanggal.
 *
 * Catatan bentuk respons (semua dibungkus ResponseHelper):
 *   { success: true, message, data: ... }
 * Fungsi di bawah mengembalikan `response.data` utuh agar pemanggil bisa
 * membaca `data` maupun `message` bila perlu.
 */
export const dailyTaskService = {
  /**
   * Daftar tugas satu cabang pada satu tanggal (halaman supervisor).
   * @param {{ branch_id?: number, date?: string, position?: string, status?: string }} params
   */
  async getByBranch(params = {}) {
    const response = await instance.get('/daily-tasks', { params });
    return response.data;
  },

  /**
   * Tugas milik user yang sedang login (halaman staff).
   * @param {{ date?: string }} params
   */
  async getMine(params = {}) {
    const response = await instance.get('/daily-tasks/me', { params });
    return response.data;
  },

  /**
   * Generate massal dari template aktif. Aman dipanggil berulang
   * (server memakai unique user_id + task_date + task_template_id).
   * @param {{ branch_id?: number, date?: string, position?: string, user_ids?: number[] }} payload
   */
  async generate(payload = {}) {
    const response = await instance.post('/daily-tasks/generate', payload);
    return response.data;
  },

  /**
   * Salin semua tugas dari hari sebelumnya (atau `source_date` tertentu)
   * ke tanggal yang sedang dibuka. Tugas yang sudah ada tidak diduplikasi.
   * @param {{ branch_id?: number, date: string, source_date?: string }} payload
   */
  async copyFromPrevious(payload = {}) {
    const response = await instance.post('/daily-tasks/copy', payload);
    return response.data;
  },

  /**
   * Tambah satu tugas manual (untuk tugas yang tidak ada di template,
   * mis. karyawan yang belum punya `position`).
   * @param {{ user_id: number, title: string, area?: string, note?: string, date?: string, branch_id?: number }} payload
   */
  async createManual(payload) {
    const response = await instance.post('/daily-tasks', payload);
    return response.data;
  },

  /** Tandai selesai. `payload.photo_url` wajib bila template requires_photo. */
  async complete(id, payload = {}) {
    const response = await instance.patch(`/daily-tasks/${id}/complete`, payload);
    return response.data;
  },

  /** Batalkan tanda selesai (kembali ke pending). */
  async reopen(id) {
    const response = await instance.patch(`/daily-tasks/${id}/reopen`);
    return response.data;
  },

  async remove(id) {
    const response = await instance.delete(`/daily-tasks/${id}`);
    return response.data;
  },

  /** Minta AI menilai foto bukti (watermark GPS + kesesuaian tugas). */
  async verify(id) {
    const response = await instance.post(`/daily-tasks/${id}/verify`);
    return response.data;
  },

  /** Supervisor menimpa verdict AI. `verdict`: verified | review | reject. */
  async override(id, payload) {
    const response = await instance.patch(`/daily-tasks/${id}/override`, payload);
    return response.data;
  },

  /**
   * Tutup hari: semua tugas `pending` sampai tanggal tersebut jadi `incomplete`.
   * Biasanya dipanggil server saat absen pulang, endpoint ini untuk manual.
   * @param {{ date?: string, user_id?: number, branch_id?: number }} payload
   */
  async closeDay(payload = {}) {
    const response = await instance.post('/daily-tasks/close-day', payload);
    return response.data;
  },
};

/** Master template tugas (dipakai nanti di halaman kelola template). */
export const taskTemplateService = {
  async getAll(params = {}) {
    const response = await instance.get('/task-templates', { params });
    return response.data;
  },

  async getPositions(params = {}) {
    const response = await instance.get('/task-templates/positions', { params });
    return response.data;
  },

  async create(payload) {
    const response = await instance.post('/task-templates', payload);
    return response.data;
  },

  async update(id, payload) {
    const response = await instance.put(`/task-templates/${id}`, payload);
    return response.data;
  },

  async toggleStatus(id) {
    const response = await instance.patch(`/task-templates/${id}/toggle-status`);
    return response.data;
  },

  async remove(id) {
    const response = await instance.delete(`/task-templates/${id}`);
    return response.data;
  },
};

export default dailyTaskService;
