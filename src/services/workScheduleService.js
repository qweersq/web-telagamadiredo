import instance from '../config/api';

/**
 * Client API untuk jadwal kerja karyawan (pola mingguan) dan hari libur.
 *
 * Satu karyawan punya satu jadwal aktif berisi 7 hari. Cukup assign sekali,
 * berlaku terus sampai diubah — bukan assign per tanggal.
 *
 * Bentuk respons selalu { success, message, data } dari ResponseHelper.
 */
export const workScheduleService = {
  /** Daftar jadwal + 7 hari tiap jadwal. */
  async list(params = {}) {
    const response = await instance.get('/work-schedules', { params });
    return response.data;
  },

  /** Jadwal aktif satu karyawan. */
  async getByEmployee(employeeId) {
    const response = await instance.get(`/work-schedules/employee/${employeeId}`);
    return response.data;
  },

  /**
   * Simpan jadwal karyawan. Jadwal aktif lama otomatis dinonaktifkan.
   * @param {number} employeeId
   * @param {{ employment_type: string, effective_from?: string, note?: string,
   *   days: Array<{ day_of_week: number, is_rest_day: boolean,
   *   clock_in_target?: string, clock_out_target?: string,
   *   break_minutes?: number, tolerance_minutes?: number }> }} payload
   */
  async save(employeeId, payload) {
    const response = await instance.put(`/work-schedules/employee/${employeeId}`, payload);
    return response.data;
  },

  /** Target jam masuk/pulang karyawan pada satu tanggal (termasuk cek hari libur). */
  async resolve(params = {}) {
    const response = await instance.get('/work-schedules/resolve', { params });
    return response.data;
  },

  async listHolidays(params = {}) {
    const response = await instance.get('/holidays', { params });
    return response.data;
  },

  async createHoliday(payload) {
    const response = await instance.post('/holidays', payload);
    return response.data;
  },

  async deleteHoliday(id) {
    const response = await instance.delete(`/holidays/${id}`);
    return response.data;
  },
};
