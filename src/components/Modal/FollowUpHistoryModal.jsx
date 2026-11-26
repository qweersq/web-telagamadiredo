import { useCallback, useEffect, useState } from 'react';
import {
  X,
  Search,
  History,
  Users,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  Phone,
  Calendar,
  Building2,
  User,
  RefreshCw,
} from 'lucide-react';
import instance from '../../config/api';

/**
 * Modal Riwayat Follow-Up Customer (web).
 *
 * Sumber data (backend baru — `customerFollowupHistoryController`):
 *  - GET /customer-followups/summary?days=      → kartu statistik
 *  - GET /customer-followups/followed-up?...    → tab "Per Customer"
 *  - GET /customer-followups/history?...        → tab "Aktivitas"
 *  - GET /customer-followups/customers/:id/history → detail 1 customer
 *
 * Catatan: setelah follow-up ditandai terkirim, customer hilang dari daftar
 * dormant (dormant-byp-period mengecualikan 20 hari terakhir). Daftar di modal
 * ini yang membuat customer tersebut tetap bisa dilacak.
 */

const PAGE_SIZE = 20;

const RANGE_OPTIONS = [
  { value: 7, label: '7 hari' },
  { value: 30, label: '30 hari' },
  { value: 90, label: '90 hari' },
  { value: 365, label: '1 tahun' },
  { value: 3650, label: 'Semua' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'sent', label: 'Terkirim' },
  { value: 'failed', label: 'Gagal' },
];

const pad = (n) => String(n).padStart(2, '0');

const toLocalDateOnly = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const dateFromDays = (days) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return toLocalDateOnly(d);
};

const formatDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const relativeDays = (n) => {
  if (n === null || n === undefined) return '-';
  if (n <= 0) return 'Hari ini';
  if (n === 1) return 'Kemarin';
  return `${n} hari lalu`;
};

const truncate = (text, max = 120) => {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
      status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}
  >
    {status === 'sent' ? 'Terkirim' : 'Gagal'}
  </span>
);

const StatCard = ({ label, value, hint, tone = 'gray' }) => {
  const tones = {
    gray: 'bg-gray-50 text-gray-800',
    blue: 'bg-blue-50 text-blue-800',
    green: 'bg-green-50 text-green-800',
    amber: 'bg-amber-50 text-amber-800',
  };
  return (
    <div className={`rounded-xl p-3 ${tones[tone] || tones.gray}`}>
      <p className="text-[11px] font-medium opacity-80">{label}</p>
      <p className="text-lg font-bold leading-tight">{value}</p>
      {hint && <p className="text-[10px] opacity-70 mt-0.5">{hint}</p>}
    </div>
  );
};

const FollowUpHistoryModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('customers');
  const [rangeDays, setRangeDays] = useState(30);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [customersPage, setCustomersPage] = useState(1);
  const [customersHasNext, setCustomersHasNext] = useState(false);
  const [customersTotal, setCustomersTotal] = useState(0);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersLoadingMore, setCustomersLoadingMore] = useState(false);

  const [activities, setActivities] = useState([]);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [activitiesHasNext, setActivitiesHasNext] = useState(false);
  const [activitiesTotal, setActivitiesTotal] = useState(0);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesLoadingMore, setActivitiesLoadingMore] = useState(false);

  const [errorMessage, setErrorMessage] = useState(null);

  const [detailId, setDetailId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  /* ── debounce search ─────────────────────────────────────────────── */
  useEffect(() => {
    const timer = setTimeout(() => setAppliedSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* ── reset saat modal ditutup ────────────────────────────────────── */
  useEffect(() => {
    if (isOpen) return;
    setActiveTab('customers');
    setRangeDays(30);
    setSearchInput('');
    setAppliedSearch('');
    setStatusFilter('');
    setSummary(null);
    setCustomers([]);
    setActivities([]);
    setDetailId(null);
    setDetailData(null);
    setErrorMessage(null);
  }, [isOpen]);

  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const { data } = await instance.get('/customer-followups/summary', {
        params: { days: rangeDays },
      });
      if (data?.success) setSummary(data.data);
    } catch (error) {
      console.error('[FollowUpHistoryModal] summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  }, [rangeDays]);

  const fetchCustomers = useCallback(
    async (page = 1, append = false) => {
      if (append) setCustomersLoadingMore(true);
      else setCustomersLoading(true);
      setErrorMessage(null);
      try {
        const { data } = await instance.get('/customer-followups/followed-up', {
          params: {
            days: rangeDays,
            page,
            limit: PAGE_SIZE,
            search: appliedSearch || undefined,
            sort: 'last_followup_desc',
          },
        });
        if (data?.success) {
          const rows = data.data.customers || [];
          const pagination = data.data.pagination || {};
          setCustomers((prev) => (append ? [...prev, ...rows] : rows));
          setCustomersPage(pagination.currentPage || page);
          setCustomersHasNext(Boolean(pagination.hasNextPage));
          setCustomersTotal(pagination.totalItems || 0);
        }
      } catch (error) {
        console.error('[FollowUpHistoryModal] followed-up:', error);
        setErrorMessage('Gagal memuat daftar customer. Coba lagi.');
      } finally {
        setCustomersLoading(false);
        setCustomersLoadingMore(false);
      }
    },
    [rangeDays, appliedSearch]
  );

  const fetchActivities = useCallback(
    async (page = 1, append = false) => {
      if (append) setActivitiesLoadingMore(true);
      else setActivitiesLoading(true);
      setErrorMessage(null);
      try {
        const { data } = await instance.get('/customer-followups/history', {
          params: {
            page,
            limit: PAGE_SIZE,
            search: appliedSearch || undefined,
            status: statusFilter || undefined,
            date_from: rangeDays >= 3650 ? undefined : dateFromDays(rangeDays),
            sort: 'sent_at_desc',
          },
        });
        if (data?.success) {
          const rows = data.data.followups || [];
          const pagination = data.data.pagination || {};
          setActivities((prev) => (append ? [...prev, ...rows] : rows));
          setActivitiesPage(pagination.currentPage || page);
          setActivitiesHasNext(Boolean(pagination.hasNextPage));
          setActivitiesTotal(pagination.totalItems || 0);
        }
      } catch (error) {
        console.error('[FollowUpHistoryModal] history:', error);
        setErrorMessage('Gagal memuat aktivitas follow-up. Coba lagi.');
      } finally {
        setActivitiesLoading(false);
        setActivitiesLoadingMore(false);
      }
    },
    [rangeDays, appliedSearch, statusFilter]
  );

  const fetchDetail = useCallback(async (customerId) => {
    try {
      setDetailLoading(true);
      setDetailId(customerId);
      setDetailData(null);
      const { data } = await instance.get(`/customer-followups/customers/${customerId}/history`, {
        params: { page: 1, limit: 100 },
      });
      if (data?.success) setDetailData(data.data);
    } catch (error) {
      console.error('[FollowUpHistoryModal] detail:', error);
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  /* ── loaders ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    fetchSummary();
  }, [isOpen, fetchSummary]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'customers' || detailId) return;
    fetchCustomers(1, false);
  }, [isOpen, activeTab, detailId, fetchCustomers]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'activities' || detailId) return;
    fetchActivities(1, false);
  }, [isOpen, activeTab, detailId, fetchActivities]);

  const handleRefresh = () => {
    fetchSummary();
    if (activeTab === 'customers') fetchCustomers(1, false);
    else fetchActivities(1, false);
  };

  if (!isOpen) return null;

  const isSearching = appliedSearch !== searchInput.trim();

  /* ── render: detail customer ─────────────────────────────────────── */
  const renderDetail = () => {
    const stats = detailData?.statistics || {};
    const customer = detailData?.customer || {};
    const rows = detailData?.followups || [];

    return (
      <div className="space-y-4">
        <button
          onClick={() => {
            setDetailId(null);
            setDetailData(null);
          }}
          className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ChevronLeft className="w-4 h-4" />
          Kembali ke daftar
        </button>

        {detailLoading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-500 mx-auto" />
            <p className="mt-3 text-sm text-gray-600">Memuat riwayat customer...</p>
          </div>
        ) : !detailData ? (
          <div className="py-12 text-center">
            <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Customer tidak ditemukan atau di luar akses Anda.</p>
          </div>
        ) : (
          <>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{customer.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-600">
                    {customer.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </span>
                    )}
                    {customer.branch_name && (
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {customer.branch_name}
                      </span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {stats.total_followups || 0}x follow-up
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <StatCard label="Total Follow-Up" value={stats.total_followups ?? 0} tone="blue" />
              <StatCard
                label="Follow-Up Terakhir"
                value={relativeDays(stats.days_since_last_followup)}
                hint={formatDate(stats.last_followup_at)}
                tone="green"
              />
              <StatCard
                label="Order Terakhir"
                value={relativeDays(stats.days_since_last_order)}
                hint={stats.last_order_date ? formatDate(stats.last_order_date) : 'Belum ada order'}
                tone="amber"
              />
              <StatCard
                label="Total Order"
                value={stats.total_orders ?? 0}
                hint={`${stats.total_branches || 1} cabang`}
              />
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                Timeline Follow-Up ({rows.length})
              </h4>
              {rows.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada riwayat follow-up.</p>
              ) : (
                <div className="relative pl-5">
                  <div className="absolute left-1.5 top-1 bottom-1 w-px bg-gray-200" />
                  <div className="space-y-3">
                    {rows.map((row) => (
                      <div key={row.id} className="relative">
                        <span
                          className={`absolute -left-[14px] top-2 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                            row.status === 'sent' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-xs font-medium text-gray-700">
                              {formatDateTime(row.sent_at)}
                            </span>
                            <StatusBadge status={row.status} />
                          </div>
                          <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {row.message_content}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-gray-500">
                            <span className="inline-flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {row.created_by_name || '-'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {row.branch_name || '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  /* ── render: tab per customer ────────────────────────────────────── */
  const renderCustomers = () => {
    if (customersLoading) {
      return (
        <div className="py-12 text-center">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-3 text-sm text-gray-600">Memuat daftar customer...</p>
        </div>
      );
    }

    if (customers.length === 0) {
      return (
        <div className="py-12 text-center">
          <Users className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">Belum ada customer yang di-follow up</p>
          <p className="text-xs text-gray-500 mt-1">
            {appliedSearch
              ? `Tidak ada hasil untuk "${appliedSearch}"`
              : `Tidak ada follow-up dalam ${rangeDays >= 3650 ? 'semua waktu' : `${rangeDays} hari terakhir`}`}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {customers.map((customer) => (
          <button
            key={customer.id}
            onClick={() => fetchDetail(customer.id)}
            className="w-full text-left bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 rounded-xl p-3 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-gray-900 text-sm truncate">{customer.name}</h4>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                    {customer.total_followups}x
                  </span>
                  {customer.failed_followups > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                      {customer.failed_followups} gagal
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {customer.phone || '-'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <History className="w-3 h-3" />
                    {relativeDays(customer.days_since_last_followup)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    FU terakhir: {formatDate(customer.last_followup_date)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Order terakhir: {customer.last_order_date ? formatDate(customer.last_order_date) : 'Belum ada'}
                  </span>
                </div>

                {customer.last_message && (
                  <p className="mt-1.5 text-[11px] text-gray-500 italic line-clamp-2">
                    &ldquo;{truncate(customer.last_message)}&rdquo;
                  </p>
                )}
              </div>

              <div className="shrink-0 flex flex-col items-end gap-1">
                <StatusBadge status={customer.last_status || 'sent'} />
                {customer.total_branches > 1 && (
                  <span className="text-[10px] text-gray-400">{customer.total_branches} cabang</span>
                )}
              </div>
            </div>
          </button>
        ))}

        {customersHasNext && (
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => fetchCustomers(customersPage + 1, true)}
              disabled={customersLoadingMore}
              className="px-5 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              {customersLoadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                  Memuat...
                </>
              ) : (
                `Muat Lagi (${customers.length}/${customersTotal})`
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  /* ── render: tab aktivitas ───────────────────────────────────────── */
  const renderActivities = () => {
    if (activitiesLoading) {
      return (
        <div className="py-12 text-center">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-3 text-sm text-gray-600">Memuat aktivitas follow-up...</p>
        </div>
      );
    }

    if (activities.length === 0) {
      return (
        <div className="py-12 text-center">
          <MessageSquare className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">Belum ada aktivitas follow-up</p>
          <p className="text-xs text-gray-500 mt-1">
            {appliedSearch
              ? `Tidak ada hasil untuk "${appliedSearch}"`
              : `Tidak ada follow-up dalam ${rangeDays >= 3650 ? 'semua waktu' : `${rangeDays} hari terakhir`}`}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {activities.map((row) => (
          <div key={row.id} className="bg-white border border-gray-200 rounded-xl p-3">
            <div className="flex items-start justify-between gap-2">
              <button
                onClick={() => row.customer_id && fetchDetail(row.customer_id)}
                className="min-w-0 text-left"
              >
                <h4 className="font-semibold text-gray-900 text-sm truncate hover:text-blue-600">
                  {row.customer_name || 'Customer'}
                </h4>
                <p className="text-[11px] text-gray-500">{row.customer_phone || '-'}</p>
              </button>
              <div className="shrink-0 text-right">
                <p className="text-[11px] text-gray-500">{formatDateTime(row.sent_at)}</p>
                <StatusBadge status={row.status} />
              </div>
            </div>

            <div className="mt-2 bg-gray-50 rounded-lg p-2.5">
              <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed line-clamp-4">
                {row.message_content}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1">
                <User className="w-3 h-3" />
                {row.created_by_name || '-'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {row.branch_name || '-'}
              </span>
            </div>
          </div>
        ))}

        {activitiesHasNext && (
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => fetchActivities(activitiesPage + 1, true)}
              disabled={activitiesLoadingMore}
              className="px-5 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              {activitiesLoadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                  Memuat...
                </>
              ) : (
                `Muat Lagi (${activities.length}/${activitiesTotal})`
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] font-montserrat">
        {/* Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b-2 border-gray-100 rounded-t-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                Riwayat Follow-Up
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Customer yang sudah pernah di-follow up & log pengirimannya
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Muat ulang"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Summary */}
          {!detailId && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
              <StatCard
                label="Total Follow-Up"
                value={summaryLoading ? '...' : summary?.total_followups ?? 0}
                tone="blue"
              />
              <StatCard
                label="Customer"
                value={summaryLoading ? '...' : summary?.total_customers ?? 0}
                tone="green"
              />
              <StatCard
                label="Bulan Ini"
                value={summaryLoading ? '...' : summary?.this_month_followups ?? 0}
                hint={`${summary?.this_month_customers ?? 0} customer`}
                tone="amber"
              />
              <StatCard
                label="Tingkat Sukses"
                value={summaryLoading ? '...' : `${summary?.success_rate ?? 0}%`}
                hint={`${summary?.failed_count ?? 0} gagal`}
              />
            </div>
          )}
        </div>

        {/* Toolbar: tabs + range + search */}
        {!detailId && (
          <div className="flex-shrink-0 px-5 pt-3 pb-2 border-b border-gray-100 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setActiveTab('customers')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeTab === 'customers'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Per Customer
                </button>
                <button
                  onClick={() => setActiveTab('activities')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeTab === 'activities'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Aktivitas
                </button>
              </div>

              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Cari nama / no. HP / pesan..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                />
                {isSearching && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-gray-500 mr-0.5">Periode:</span>
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRangeDays(opt.value)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors ${
                    rangeDays === opt.value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}

              {activeTab === 'activities' && (
                <div className="ml-auto flex items-center gap-1">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value || 'all'}
                      onClick={() => setStatusFilter(opt.value)}
                      className={`px-2 py-1 text-[11px] rounded-md border transition-colors ${
                        statusFilter === opt.value
                          ? 'bg-gray-800 text-white border-gray-800'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Body */}
        <div
          className="flex-1 overflow-y-auto px-5 py-3"
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
        >
          {errorMessage && (
            <div className="mb-3 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-2.5 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {detailId ? renderDetail() : activeTab === 'customers' ? renderCustomers() : renderActivities()}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-3 border-t-2 border-gray-100 bg-gray-50 rounded-b-2xl flex items-center justify-between gap-3">
          <p className="text-[11px] text-gray-500">
            {detailId
              ? 'Klik "Kembali" untuk melihat daftar customer'
              : activeTab === 'customers'
                ? `${customersTotal} customer pernah di-follow up`
                : `${activitiesTotal} aktivitas follow-up`}
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default FollowUpHistoryModal;
