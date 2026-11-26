import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Clock,
  Loader2,
  Pencil,
  Search,
  Users,
  X,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import HeaderBerandaOwner from '../../components/Com Header/HeaderBerandaOwner';
import instance from '../../config/api';
import { workScheduleService } from '../../services/workScheduleService';

/**
 * Pengaturan jadwal kerja karyawan (pola mingguan).
 *
 * Satu karyawan punya satu jadwal aktif berisi 7 hari — cukup diatur sekali,
 * berlaku terus sampai diubah. Weekday dan weekend bisa beda jam, dan
 * fulltime/parttime hanya pembeda label (jamnya tetap per hari).
 *
 * Jam di sini tidak memblokir absen; hanya dipakai server untuk menghitung
 * `late_minutes` / `is_late` saat karyawan check-in.
 */

const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

// 1=Senin ... 7=Minggu (ISO), sesuai kolom work_schedule_days.day_of_week
const DAYS = DAY_NAMES.map((name, index) => ({ day_of_week: index + 1, name }));

const EMPLOYMENT_META = {
  fulltime: { label: 'Fulltime', chip: 'bg-telaga-50 text-telaga-700 ring-telaga-100' },
  parttime: { label: 'Parttime', chip: 'bg-senja-50 text-senja-700 ring-senja-100' },
};

const toTimeInput = (value) => (value ? String(value).slice(0, 5) : '');

const buildEmptyDays = () =>
  DAYS.map((day) => ({
    day_of_week: day.day_of_week,
    is_rest_day: day.day_of_week >= 6,
    clock_in_target: day.day_of_week >= 6 ? '' : '08:00',
    clock_out_target: day.day_of_week >= 6 ? '' : '17:00',
    break_minutes: 60,
    tolerance_minutes: 15,
  }));

const buildDaysFromSchedule = (schedule) => {
  const saved = new Map((schedule?.days || []).map((day) => [Number(day.day_of_week), day]));

  return DAYS.map((day) => {
    const found = saved.get(day.day_of_week);
    if (!found) {
      return {
        day_of_week: day.day_of_week,
        is_rest_day: false,
        clock_in_target: '',
        clock_out_target: '',
        break_minutes: 60,
        tolerance_minutes: 15,
      };
    }

    return {
      day_of_week: day.day_of_week,
      is_rest_day: Boolean(found.is_rest_day),
      clock_in_target: toTimeInput(found.clock_in_target),
      clock_out_target: toTimeInput(found.clock_out_target),
      break_minutes: Number(found.break_minutes ?? 60),
      tolerance_minutes: Number(found.tolerance_minutes ?? 15),
    };
  });
};

/** Ringkasan singkat: kelompokkan hari yang jamnya sama. */
const summarizeDays = (schedule) => {
  if (!schedule || !schedule.days?.length) return 'Jadwal belum diatur';

  const buckets = new Map();

  schedule.days.forEach((day) => {
    const name = DAY_NAMES[Number(day.day_of_week) - 1];
    const key = day.is_rest_day
      ? 'LIBUR'
      : `${toTimeInput(day.clock_in_target)}-${toTimeInput(day.clock_out_target)}`;

    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(name.slice(0, 3));
  });

  return Array.from(buckets.entries())
    .map(([key, days]) => `${days.join(', ')} ${key === 'LIBUR' ? 'libur' : key}`)
    .join(' · ');
};

const WorkSchedulePage = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ employment_type: 'fulltime', effective_from: '', days: buildEmptyDays() });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = useCallback(async () => {
    setError('');
    try {
      const [usersResponse, scheduleResponse] = await Promise.all([
        instance.get('/users', { params: { status: 'active' } }),
        workScheduleService.list(),
      ]);

      const list = (usersResponse?.data?.data || []).filter((user) =>
        ['employee', 'admin'].includes(user.role) && user.status === 'active'
      );

      setEmployees(list);
      setSchedules(scheduleResponse?.success ? scheduleResponse.data || [] : []);
    } catch (err) {
      console.error('❌ WorkSchedulePage - gagal memuat data:', err);
      setError(err?.response?.data?.error?.message || 'Gagal memuat jadwal kerja');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const scheduleByEmployee = useMemo(() => {
    const map = new Map();
    schedules
      .filter((schedule) => schedule.is_active)
      .forEach((schedule) => {
        if (!map.has(schedule.employee_id)) map.set(schedule.employee_id, schedule);
      });
    return map;
  }, [schedules]);

  const rows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return employees
      .filter((employee) => !keyword || String(employee.name || '').toLowerCase().includes(keyword))
      .map((employee) => ({
        employee,
        schedule: scheduleByEmployee.get(employee.id) || null,
      }));
  }, [employees, scheduleByEmployee, search]);

  const stats = useMemo(() => {
    let fulltime = 0;
    let parttime = 0;
    let unset = 0;

    employees.forEach((employee) => {
      const schedule = scheduleByEmployee.get(employee.id);
      if (!schedule) {
        unset += 1;
        return;
      }
      if (schedule.employment_type === 'parttime') parttime += 1;
      else fulltime += 1;
    });

    return { fulltime, parttime, unset };
  }, [employees, scheduleByEmployee]);

  const openEditor = (employee, schedule) => {
    setFormError('');
    setEditing({ employee, schedule });
    setForm({
      employment_type: schedule?.employment_type || 'fulltime',
      effective_from: schedule?.effective_from || new Date().toISOString().slice(0, 10),
      days: schedule ? buildDaysFromSchedule(schedule) : buildEmptyDays(),
    });
  };

  const closeEditor = () => {
    if (saving) return;
    setEditing(null);
    setFormError('');
  };

  const patchDay = (dayOfWeek, changes) => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.map((day) => (day.day_of_week === dayOfWeek ? { ...day, ...changes } : day)),
    }));
  };

  const handleSave = async () => {
    if (!editing) return;
    setFormError('');

    const invalid = form.days.find(
      (day) => !day.is_rest_day && (!day.clock_in_target || !day.clock_out_target)
    );
    if (invalid) {
      setFormError(`Jam masuk dan jam pulang ${DAY_NAMES[invalid.day_of_week - 1]} wajib diisi`);
      return;
    }

    setSaving(true);
    try {
      const response = await workScheduleService.save(editing.employee.id, {
        employment_type: form.employment_type,
        effective_from: form.effective_from || undefined,
        days: form.days.map((day) => ({
          day_of_week: day.day_of_week,
          is_rest_day: day.is_rest_day,
          clock_in_target: day.is_rest_day ? null : day.clock_in_target,
          clock_out_target: day.is_rest_day ? null : day.clock_out_target,
          break_minutes: Number(day.break_minutes) || 0,
          tolerance_minutes: Number(day.tolerance_minutes) || 0,
        })),
      });

      if (!response?.success) {
        setFormError(response?.error?.message || 'Gagal menyimpan jadwal');
        return;
      }

      setEditing(null);
      await loadData();
    } catch (err) {
      console.error('❌ WorkSchedulePage - gagal menyimpan jadwal:', err);
      setFormError(err?.response?.data?.error?.message || 'Gagal menyimpan jadwal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-krem font-montserrat">
      <HeaderBerandaOwner
        title="Jadwal Kerja"
        description="Atur jam masuk & pulang karyawan"
        showBackButton={true}
        backPath={location.state?.from === 'berandaowner' ? '/berandaowner' : '/manajemen-karyawan'}
        currentTime={new Date().toLocaleTimeString()}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6">
          {error && (
            <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 ring-1 ring-red-100">
              {error}
            </p>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-telaga-100 bg-white p-3 text-center">
              <p className="text-lg font-bold text-telaga-900">{stats.fulltime}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-telaga-900/40">Fulltime</p>
            </div>
            <div className="rounded-2xl border border-telaga-100 bg-white p-3 text-center">
              <p className="text-lg font-bold text-senja-700">{stats.parttime}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-telaga-900/40">Parttime</p>
            </div>
            <div className="rounded-2xl border border-telaga-100 bg-white p-3 text-center">
              <p className="text-lg font-bold text-telaga-900/40">{stats.unset}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-telaga-900/40">Belum diatur</p>
            </div>
          </div>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-telaga-900/30" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari karyawan…"
              className="w-full rounded-xl border border-telaga-100 bg-white py-2.5 pl-9 pr-3 text-xs text-telaga-950 outline-none placeholder:text-telaga-900/30 focus:border-telaga-400"
            />
          </div>

          {loading ? (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-telaga-200 py-12 text-xs text-telaga-900/45">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat jadwal…
            </div>
          ) : rows.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-telaga-200 py-12 text-center">
              <Users className="mx-auto h-8 w-8 text-telaga-300" />
              <p className="mt-2 text-sm font-medium text-telaga-900/60">Belum ada karyawan</p>
              <p className="mx-auto mt-1 max-w-[16rem] text-xs text-telaga-900/40">
                Tambahkan karyawan lebih dulu di menu Data Karyawan.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {rows.map(({ employee, schedule }) => {
                const meta = EMPLOYMENT_META[schedule?.employment_type] || null;

                return (
                  <li
                    key={employee.id}
                    className="rounded-2xl border border-telaga-100 bg-white p-3.5 shadow-sm shadow-telaga-900/5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-telaga-50 text-xs font-bold text-telaga-700">
                        {String(employee.name || 'K').charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-telaga-950">{employee.name}</p>
                          {meta ? (
                            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ${meta.chip}`}>
                              {meta.label}
                            </span>
                          ) : (
                            <span className="rounded-full bg-telaga-900/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-telaga-900/40">
                              Belum diatur
                            </span>
                          )}
                        </div>

                        <p className="mt-1 flex items-start gap-1 text-[10px] leading-relaxed text-telaga-900/45">
                          <Clock className="mt-0.5 h-3 w-3 shrink-0" />
                          <span>{summarizeDays(schedule)}</span>
                        </p>

                        {schedule?.effective_from && (
                          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-telaga-900/35">
                            <CalendarDays className="h-3 w-3" />
                            Berlaku dari {schedule.effective_from}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => openEditor(employee, schedule)}
                        className="flex shrink-0 items-center gap-1 rounded-lg bg-telaga-900/5 px-2.5 py-1.5 text-[10px] font-semibold text-telaga-900/60 transition-colors hover:bg-telaga-900/10 hover:text-telaga-900"
                      >
                        <Pencil className="h-3 w-3" />
                        Atur
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="mt-5 flex items-start gap-1.5 rounded-xl bg-telaga-50 px-3 py-2.5 text-[10px] leading-relaxed text-telaga-700">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
              Jadwal dipakai untuk menghitung keterlambatan saat absen. Karyawan tanpa jadwal tetap bisa
              absen, hanya saja tidak dinilai telat.
            </span>
          </p>
        </div>
      </main>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-telaga-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={closeEditor}
        >
          <div
            className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-telaga-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-bold text-telaga-950">Jadwal {editing.employee.name}</h2>
                <p className="text-[10px] text-telaga-900/45">Atur sekali, berlaku sampai diubah</p>
              </div>
              <button
                onClick={closeEditor}
                className="rounded-lg p-1.5 text-telaga-900/40 transition-colors hover:bg-telaga-900/5 hover:text-telaga-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              <label className="text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">Tipe Kerja</label>
              <div className="mt-1.5 flex gap-2">
                {['fulltime', 'parttime'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setForm((prev) => ({ ...prev, employment_type: type }))}
                    className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold ring-1 transition-colors ${
                      form.employment_type === type
                        ? 'bg-telaga-600 text-white ring-telaga-600'
                        : 'bg-white text-telaga-900/50 ring-telaga-100 hover:bg-telaga-50'
                    }`}
                  >
                    {EMPLOYMENT_META[type].label}
                  </button>
                ))}
              </div>

              <label className="mt-3 block text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                Berlaku Mulai
              </label>
              <input
                type="date"
                value={form.effective_from}
                onChange={(event) => setForm((prev) => ({ ...prev, effective_from: event.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-telaga-100 px-3 py-2 text-xs text-telaga-950 outline-none focus:border-telaga-400"
              />

              <div className="mt-4 flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wide text-telaga-900/40">
                  Jam per Hari
                </label>
                <span className="text-[9px] text-telaga-900/35">Istirahat & toleransi dalam menit</span>
              </div>

              <div className="mt-1.5 space-y-1.5">
                {DAYS.map((day) => {
                  const value = form.days.find((item) => item.day_of_week === day.day_of_week);
                  if (!value) return null;

                  return (
                    <div
                      key={day.day_of_week}
                      className={`rounded-xl border px-2.5 py-2 transition-colors ${
                        value.is_rest_day ? 'border-telaga-100 bg-telaga-50/50' : 'border-telaga-100 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="w-14 shrink-0 text-[11px] font-semibold text-telaga-950">{day.name}</span>

                        {value.is_rest_day ? (
                          <span className="flex-1 text-[10px] font-medium italic text-telaga-900/40">
                            Hari libur
                          </span>
                        ) : (
                          <div className="flex flex-1 items-center gap-1">
                            <input
                              type="time"
                              value={value.clock_in_target}
                              onChange={(event) =>
                                patchDay(day.day_of_week, { clock_in_target: event.target.value })
                              }
                              className="w-full rounded-lg border border-telaga-100 px-1.5 py-1 text-[11px] text-telaga-950 outline-none focus:border-telaga-400"
                            />
                            <span className="text-[10px] text-telaga-900/30">–</span>
                            <input
                              type="time"
                              value={value.clock_out_target}
                              onChange={(event) =>
                                patchDay(day.day_of_week, { clock_out_target: event.target.value })
                              }
                              className="w-full rounded-lg border border-telaga-100 px-1.5 py-1 text-[11px] text-telaga-950 outline-none focus:border-telaga-400"
                            />
                          </div>
                        )}

                        <button
                          onClick={() =>
                            patchDay(day.day_of_week, {
                              is_rest_day: !value.is_rest_day,
                              clock_in_target: value.is_rest_day ? '08:00' : '',
                              clock_out_target: value.is_rest_day ? '17:00' : '',
                            })
                          }
                          title={value.is_rest_day ? 'Jadikan hari kerja' : 'Jadikan hari libur'}
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ring-1 transition-colors ${
                            value.is_rest_day
                              ? 'bg-telaga-100 text-telaga-700 ring-telaga-200'
                              : 'bg-white text-telaga-900/30 ring-telaga-100 hover:text-telaga-700'
                          }`}
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      </div>

                      {!value.is_rest_day && (
                        <div className="mt-1.5 flex items-center gap-1.5 pl-14">
                          <label className="flex items-center gap-1 text-[9px] text-telaga-900/40">
                            Istirahat
                            <input
                              type="number"
                              min="0"
                              value={value.break_minutes}
                              onChange={(event) =>
                                patchDay(day.day_of_week, { break_minutes: event.target.value })
                              }
                              className="w-11 rounded-md border border-telaga-100 px-1 py-0.5 text-center text-[10px] text-telaga-950 outline-none focus:border-telaga-400"
                            />
                          </label>
                          <label className="flex items-center gap-1 text-[9px] text-telaga-900/40">
                            Toleransi
                            <input
                              type="number"
                              min="0"
                              value={value.tolerance_minutes}
                              onChange={(event) =>
                                patchDay(day.day_of_week, { tolerance_minutes: event.target.value })
                              }
                              className="w-11 rounded-md border border-telaga-100 px-1 py-0.5 text-center text-[10px] text-telaga-950 outline-none focus:border-telaga-400"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {formError && (
                <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[11px] font-medium text-red-600 ring-1 ring-red-100">
                  {formError}
                </p>
              )}
            </div>

            <div className="flex gap-2 border-t border-telaga-100 px-4 py-3">
              <button
                onClick={closeEditor}
                disabled={saving}
                className="flex-1 rounded-xl bg-telaga-900/5 px-3 py-2.5 text-xs font-semibold text-telaga-900/60 transition-colors hover:bg-telaga-900/10 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-telaga-600 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-telaga-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                {saving ? 'Menyimpan…' : 'Simpan Jadwal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkSchedulePage;
