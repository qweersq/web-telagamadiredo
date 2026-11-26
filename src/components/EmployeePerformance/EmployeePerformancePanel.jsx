import React, { useCallback, useEffect, useState } from "react";
import instance from "../../config/api";
import { formatDate } from "../../utils/labelFormatter";

/**
 * Panel "Kinerja Karyawan" — dipakai di dua tempat:
 *  1. Halaman `Laporan Kinerja` milik owner (satu tanggal).
 *  2. Tab "Kinerja Karyawan" di dalam detail cabang pada beranda Supervisor
 *     (mengikuti rentang tanggal filter beranda).
 *
 * Sumber data: `GET /employee-daily-report`
 *  - satu hari  : `?date=YYYY-MM-DD`                       (dipakai aplikasi mobile)
 *  - rentang    : `?start_date=YYYY-MM-DD&end_date=...`    (dipakai web)
 *
 * Kolom absensi berubah sesuai mode:
 *  - satu hari  → Jam Masuk / Jam Pulang / Jam Kerja
 *  - rentang    → Hari Hadir / Total Jam Kerja
 *    (jam masuk & jam pulang tidak bermakna kalau periodenya beberapa hari)
 *
 * Props:
 * - branchId    : string|number  → filter cabang (kosong = semua cabang tenant)
 * - startDate   : 'YYYY-MM-DD'   → wajib
 * - endDate     : 'YYYY-MM-DD'   → wajib
 * - branchName  : nama cabang, hanya untuk tampilan
 * - title       : judul di header panel
 */
const EmployeePerformancePanel = ({
  branchId = "",
  startDate,
  endDate,
  branchName = "",
  title = "Laporan Kinerja Karyawan",
}) => {
  const isSingleDay = Boolean(startDate && endDate && startDate === endDate);

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const periodLabel = isSingleDay
    ? formatDate(startDate)
    : `${formatDate(startDate)} – ${formatDate(endDate)}`;

  // ---------- Ambil laporan utama ----------
  const fetchReport = useCallback(async () => {
    if (!startDate || !endDate) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("start_date", startDate);
      params.append("end_date", endDate);
      if (branchId) params.append("branch_id", branchId);

      const res = await instance.get(`/employee-daily-report?${params.toString()}`);
      if (res.data.success) {
        setReportData(res.data.data);
      } else {
        setError("Gagal memuat laporan");
        setReportData(null);
      }
    } catch (err) {
      console.error("Error fetching report:", err);
      setError("Gagal memuat laporan");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [branchId, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ---------- Helper untuk 6 modal detail ----------
  // Semua modal punya bentuk state & pemanggilan endpoint yang sama,
  // jadi dibuat satu helper supaya tidak duplikasi 6x.
  const emptyModal = { visible: false, loading: false, employee: null, rows: [] };

  const [inputModal, setInputModal] = useState(emptyModal);
  const [pickupModal, setPickupModal] = useState(emptyModal);
  const [deliveryModal, setDeliveryModal] = useState(emptyModal);
  const [onProgressModal, setOnProgressModal] = useState(emptyModal);
  const [selesaiModal, setSelesaiModal] = useState(emptyModal);
  const [qcModal, setQcModal] = useState(emptyModal);

  const fetchDetail = useCallback(
    async (endpoint, employee, setModal) => {
      setModal({ visible: true, loading: true, employee, rows: [] });

      try {
        const params = new URLSearchParams();
        params.append("employee_id", employee.id);
        params.append("start_date", startDate);
        params.append("end_date", endDate);
        if (branchId) params.append("branch_id", branchId);

        const res = await instance.get(`/employee-daily-report/${endpoint}?${params.toString()}`);
        const rows = res.data.success && Array.isArray(res.data.data) ? res.data.data : [];
        setModal({ visible: true, loading: false, employee, rows });
      } catch (err) {
        console.error(`Error fetching ${endpoint}:`, err);
        setModal({ visible: true, loading: false, employee, rows: [] });
      }
    },
    [branchId, startDate, endDate]
  );

  const closeModal = (setModal) => setModal((prev) => ({ ...prev, visible: false }));

  const formatClock = (value) => (value ? String(value).substring(0, 5) : "—");

  const formatHour = (value) => (value ? String(value) : "—");

  const formatTime = (value) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "—";
    }
  };

  const formatRupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value || 0);

  // ---------- Gaya tombol angka aktivitas ----------
  const metricButtonClass = (value, color) => {
    if (value > 0) {
      return `${color} cursor-pointer active:scale-95`;
    }
    return "text-gray-400 cursor-default";
  };

  const DetailModal = ({ modal, setModal, title: modalTitle, columns, children, footerNoun }) => {
    if (!modal.visible) return null;

    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
        onClick={() => closeModal(setModal)}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-800">{modalTitle}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {modal.employee?.name} — {periodLabel}
              </p>
            </div>
            <button
              onClick={() => closeModal(setModal)}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              aria-label="Tutup"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {modal.loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-sm text-gray-500">Memuat data...</span>
              </div>
            ) : modal.rows.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">Tidak ada data</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      {columns.map((c) => (
                        <th
                          key={c.label}
                          className={`px-3 py-2.5 text-xs font-semibold text-gray-600 ${
                            c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left"
                          }`}
                        >
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {modal.rows.map((row, idx) => (
                      <tr key={row.order_id || row.id || idx} className="hover:bg-gray-50 transition-colors">
                        {children(row, idx)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
            <span className="text-xs text-gray-500">
              Total {modal.rows.length} {footerNoun}
            </span>
            <button
              onClick={() => closeModal(setModal)}
              className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header info */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-600 mt-0.5 truncate">
              {periodLabel}
              {branchName ? ` — ${branchName}` : ""}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs text-gray-500">Total Karyawan</span>
            <p className="text-lg font-bold text-blue-600">{reportData?.total_employees ?? 0}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : error ? (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
          <button
            onClick={fetchReport}
            className="mt-3 px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      ) : !reportData || reportData.employees.length === 0 ? (
        <div className="p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-500 font-medium">Tidak ada data karyawan</p>
          <p className="text-gray-400 text-sm mt-1">
            Tidak ada karyawan ditemukan untuk filter yang dipilih
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-12 sticky left-0 z-20 bg-gray-50">No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 min-w-[150px] sticky left-12 z-20 bg-gray-50 border-r-2 border-r-gray-200">Karyawan</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600">Input</th>
                {false && (<>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600">Pickup</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600">Mulai Pengerjaan</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600">Selesai Pengerjaan</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600">QC Item</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600">Delivery</th>
                </>)}
                {isSingleDay ? (
                  <>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600">Jam Masuk</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600">Jam Pulang</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600">Jam Kerja</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600">Hari Hadir</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600">Total Jam Kerja</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {reportData.employees.map((emp, idx) => (
                <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-500 sticky left-0 z-10 bg-white">{idx + 1}</td>
                  <td className="px-4 py-3 sticky left-12 z-10 bg-white border-r-2 border-r-gray-200">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-blue-600">
                          {emp.name ? emp.name.charAt(0) : "?"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{emp.name}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => fetchDetail("input-detail", emp, setInputModal)}
                      disabled={emp.input === 0}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold transition-all ${metricButtonClass(emp.input, "bg-indigo-100 text-indigo-700 hover:bg-indigo-200")}`}
                    >
                      {emp.input}
                    </button>
                  </td>
                  {false && (<>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => fetchDetail("pickup-detail", emp, setPickupModal)}
                      disabled={emp.pickup === 0}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold transition-all ${metricButtonClass(emp.pickup, "bg-purple-100 text-purple-700 hover:bg-purple-200")}`}
                    >
                      {emp.pickup}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => fetchDetail("mulai-pengerjaan-detail", emp, setOnProgressModal)}
                      disabled={emp.dikerjakan === 0}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold transition-all ${metricButtonClass(emp.dikerjakan, "bg-yellow-100 text-yellow-700 hover:bg-yellow-200")}`}
                    >
                      {emp.dikerjakan}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => fetchDetail("selesai-pengerjaan-detail", emp, setSelesaiModal)}
                      disabled={emp.selesai === 0}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold transition-all ${metricButtonClass(emp.selesai, "bg-cyan-100 text-cyan-700 hover:bg-cyan-200")}`}
                    >
                      {emp.selesai}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => fetchDetail("qc-item-detail", emp, setQcModal)}
                      disabled={emp.qc_item === 0}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold transition-all ${metricButtonClass(emp.qc_item, "bg-green-100 text-green-700 hover:bg-green-200")}`}
                    >
                      {emp.qc_item}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => fetchDetail("delivery-detail", emp, setDeliveryModal)}
                      disabled={emp.delivery === 0}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold transition-all ${metricButtonClass(emp.delivery, "bg-orange-100 text-orange-700 hover:bg-orange-200")}`}
                    >
                      {emp.delivery}
                    </button>
                  </td>
                  </>)}

                  {isSingleDay ? (
                    <>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs font-medium text-gray-700">
                          {formatClock(emp.attendance?.clock_in)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs font-medium text-gray-700">
                          {formatClock(emp.attendance?.clock_out)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-1 rounded-lg text-xs font-semibold ${
                            emp.attendance?.total_work_hours ? "bg-blue-100 text-blue-700" : "text-gray-400"
                          }`}
                        >
                          {formatHour(emp.attendance?.total_work_hours)}
                        </span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-1 rounded-lg text-xs font-semibold ${
                            emp.attendance?.days_present ? "bg-emerald-100 text-emerald-700" : "text-gray-400"
                          }`}
                        >
                          {emp.attendance?.days_present ? `${emp.attendance.days_present} hari` : "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-1 rounded-lg text-xs font-semibold ${
                            emp.attendance?.total_work_hours ? "bg-blue-100 text-blue-700" : "text-gray-400"
                          }`}
                        >
                          {formatHour(emp.attendance?.total_work_hours)}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------- Modal: Detail Input Order ---------- */}
      <DetailModal
        modal={inputModal}
        setModal={setInputModal}
        title="Detail Input Order"
        footerNoun="order"
        columns={[
          { label: "Order ID" },
          { label: "Pelanggan" },
          { label: "Total Item", align: "center" },
          { label: "Total Layanan", align: "center" },
          { label: "Total Harga", align: "right" },
          { label: "Status", align: "center" },
          { label: "Jam", align: "center" },
        ]}
      >
        {(row) => (
          <>
            <td className="px-3 py-2.5 text-sm font-semibold text-indigo-600">#{row.id || "-"}</td>
            <td className="px-3 py-2.5 text-sm text-gray-700">{row.customer_name || "-"}</td>
            <td className="px-3 py-2.5 text-sm text-center font-bold text-gray-800">{row.total_qty}</td>
            <td className="px-3 py-2.5 text-sm text-center font-bold text-gray-800">{row.total_treatments}</td>
            <td className="px-3 py-2.5 text-sm text-right font-semibold text-gray-800">{formatRupiah(row.total)}</td>
            <td className="px-3 py-2.5 text-center">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                  row.payment_status === "paid"
                    ? "bg-green-100 text-green-700"
                    : row.payment_status === "dp"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {row.payment_status === "paid" ? "Lunas" : row.payment_status === "dp" ? "DP" : "Belum Bayar"}
              </span>
            </td>
            <td className="px-3 py-2.5 text-sm text-center text-gray-500">{formatTime(row.created_at)}</td>
          </>
        )}
      </DetailModal>

      {false && (<>
      {/* ---------- Modal: Detail Pickup ---------- */}
      <DetailModal
        modal={pickupModal}
        setModal={setPickupModal}
        title="Detail Pickup"
        footerNoun="item"
        columns={[
          { label: "Order ID" },
          { label: "Pelanggan" },
          { label: "Treatment" },
          { label: "Jam", align: "center" },
        ]}
      >
        {(row) => (
          <>
            <td className="px-3 py-2.5 text-sm font-semibold text-purple-600">#{row.order_id || "-"}</td>
            <td className="px-3 py-2.5 text-sm text-gray-700">{row.customer_name || "-"}</td>
            <td className="px-3 py-2.5 text-sm text-gray-700">{row.treatment_name || "-"}</td>
            <td className="px-3 py-2.5 text-sm text-center text-gray-500">{formatTime(row.pickup_time)}</td>
          </>
        )}
      </DetailModal>

      {/* ---------- Modal: Detail Mulai Pengerjaan ---------- */}
      <DetailModal
        modal={onProgressModal}
        setModal={setOnProgressModal}
        title="Detail Mulai Pengerjaan"
        footerNoun="item"
        columns={[
          { label: "Order ID" },
          { label: "Pelanggan" },
          { label: "Treatment" },
          { label: "Jam", align: "center" },
        ]}
      >
        {(row) => (
          <>
            <td className="px-3 py-2.5 text-sm font-semibold text-yellow-600">#{row.order_id || "-"}</td>
            <td className="px-3 py-2.5 text-sm text-gray-700">{row.customer_name || "-"}</td>
            <td className="px-3 py-2.5 text-sm text-gray-700">{row.treatment_name || "-"}</td>
            <td className="px-3 py-2.5 text-sm text-center text-gray-500">{formatTime(row.start_time)}</td>
          </>
        )}
      </DetailModal>

      {/* ---------- Modal: Detail Selesai Pengerjaan ---------- */}
      <DetailModal
        modal={selesaiModal}
        setModal={setSelesaiModal}
        title="Detail Selesai Pengerjaan"
        footerNoun="item"
        columns={[
          { label: "Order ID" },
          { label: "Pelanggan" },
          { label: "Treatment" },
          { label: "Jam", align: "center" },
        ]}
      >
        {(row) => (
          <>
            <td className="px-3 py-2.5 text-sm font-semibold text-cyan-600">#{row.order_id || "-"}</td>
            <td className="px-3 py-2.5 text-sm text-gray-700">{row.customer_name || "-"}</td>
            <td className="px-3 py-2.5 text-sm text-gray-700">{row.treatment_name || "-"}</td>
            <td className="px-3 py-2.5 text-sm text-center text-gray-500">{formatTime(row.completion_time)}</td>
          </>
        )}
      </DetailModal>

      {/* ---------- Modal: Detail QC Item ---------- */}
      <DetailModal
        modal={qcModal}
        setModal={setQcModal}
        title="Detail QC Item"
        footerNoun="item"
        columns={[
          { label: "Order ID" },
          { label: "Pelanggan" },
          { label: "Treatment" },
          { label: "Status", align: "center" },
          { label: "Jam", align: "center" },
        ]}
      >
        {(row) => (
          <>
            <td className="px-3 py-2.5 text-sm font-semibold text-green-600">#{row.order_id || "-"}</td>
            <td className="px-3 py-2.5 text-sm text-gray-700">{row.customer_name || "-"}</td>
            <td className="px-3 py-2.5 text-sm text-gray-700">{row.treatment_name || "-"}</td>
            <td className="px-3 py-2.5 text-center">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                  row.qc_status === "siap_diambil"
                    ? "bg-blue-100 text-blue-700"
                    : row.qc_status === "siap"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {row.qc_status === "siap_diambil" ? "Siap Diambil" : row.qc_status === "siap" ? "Siap" : "Siap Dikirim"}
              </span>
            </td>
            <td className="px-3 py-2.5 text-sm text-center text-gray-500">{formatTime(row.qc_time)}</td>
          </>
        )}
      </DetailModal>

      {/* ---------- Modal: Detail Delivery ---------- */}
      <DetailModal
        modal={deliveryModal}
        setModal={setDeliveryModal}
        title="Detail Delivery"
        footerNoun="delivery"
        columns={[
          { label: "Order ID" },
          { label: "Pelanggan" },
          { label: "Treatment" },
          { label: "Qty", align: "center" },
          { label: "Jam", align: "center" },
        ]}
      >
        {(row) => (
          <>
            <td className="px-3 py-2.5 text-sm font-semibold text-orange-600">#{row.order_id || "-"}</td>
            <td className="px-3 py-2.5 text-sm text-gray-700">{row.customer_name || "-"}</td>
            <td className="px-3 py-2.5 text-sm text-gray-700 max-w-[250px] truncate">
              {row.treatment_names || "-"}
            </td>
            <td className="px-3 py-2.5 text-sm text-center font-bold text-gray-800">{row.qty}</td>
            <td className="px-3 py-2.5 text-sm text-center text-gray-500">{formatTime(row.delivery_time)}</td>
          </>
        )}
      </DetailModal>
        </>)}
    </div>
  );
};

export default EmployeePerformancePanel;
