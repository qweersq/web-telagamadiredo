import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBerandaOwner from '../../../components/Com Header/HeaderBerandaOwner';
import { Filter, Building2, Eye, Clock } from 'lucide-react';
import ShiftDetailModal from './ShiftDetailModal';
import BranchFilter from './components/BranchFilter';
import DateFilter from './components/DateFilter';
import { getUserProfile, getShiftDetailFull } from '../../../utils/userProfileHelper';
import instance from '../../../config/api';

const ShiftManagement = () => {
  const navigate = useNavigate();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [dateFilter, setDateFilter] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Fetch branches on component mount
  useEffect(() => {
    fetchBranches();
  }, []);

  // Fetch shifts when filters change
  useEffect(() => {
    if (selectedBranch) {
      fetchShifts();
    }
  }, [selectedBranch, dateFilter, customDateRange, pagination.currentPage]);

  const fetchBranches = async () => {
    try {
      const { data } = await instance.get('/shifts/branches/active');
      const list = data.data || [];
      setBranches(list);
      if (list.length > 0) {
        setSelectedBranch(list[0].id);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchShifts = async () => {
    if (!selectedBranch) return;
    
    setLoading(true);
    try {
      let url = `/shifts?branch_id=${selectedBranch}&page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`;

      // Add date filter
      if (dateFilter !== 'all') {
        url += `&date_filter=${dateFilter}`;
        if (dateFilter === 'custom' && customDateRange.start && customDateRange.end) {
          url += `&start_date=${customDateRange.start}&end_date=${customDateRange.end}`;
        }
      }

      const { data } = await instance.get(url);
      setShifts(data.data?.shifts || []);
      setPagination(data.data?.pagination || pagination);
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch shift detail lengkap saat dibutuhkan
  const handleShiftDetail = async (shiftId) => {
    try {
      console.log('🔍 Fetching full shift detail for ID:', shiftId);
      const fullShiftDetail = await getShiftDetailFull(shiftId);
      console.log('✅ Full shift detail fetched:', fullShiftDetail);
      setSelectedShift(fullShiftDetail);
      setShowDetailModal(true);
    } catch (error) {
      console.error('❌ Error fetching shift detail:', error);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (shift) => {
    if (!shift.end_time) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-telaga-100 px-2 py-0.5 text-[11px] font-semibold text-telaga-800">
          <span className="h-1.5 w-1.5 rounded-full bg-telaga-600" />
          Aktif
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-telaga-50 px-2 py-0.5 text-[11px] font-semibold text-telaga-900/55">
        <span className="h-1.5 w-1.5 rounded-full bg-telaga-300" />
        Selesai
      </span>
    );
  };

  const getSelectedBranchName = () => {
    const branch = branches.find(b => b.id === selectedBranch);
    return branch ? branch.name : 'Pilih Cabang';
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
        <HeaderBerandaOwner
          title="Manajemen Shift"
          description="Pantau shift & kas kasir"
          showBackButton={true}
          backPath="/berandaowner"
          currentTime={new Date().toLocaleTimeString()}
        />
        <main className="flex flex-1 items-center justify-center overflow-y-auto">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-telaga-100 border-b-telaga-600"></div>
            <p className="mt-4 text-sm text-telaga-900/55">Memuat data shift...</p>
          </div>
        </main>
      </div>
    );
  }

  const activeShifts = shifts.filter((s) => !s.end_time).length;
  const totalRevenue = shifts.reduce((sum, s) => sum + (parseFloat(s.sales) || 0), 0);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat">
      <HeaderBerandaOwner
        title="Manajemen Shift"
        description="Pantau shift & kas kasir Agrowisata Telaga"
        showBackButton={true}
        backPath="/berandaowner"
        currentTime={new Date().toLocaleTimeString()}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto px-4 md:px-10 pb-6 mt-20">
          <div className="max-w-[390px] md:max-w-none mx-auto">

            {/* Summary */}
            <div className="mb-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-telaga-100 bg-white px-3 py-2.5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-telaga-900/40">Total shift</p>
                <p className="text-lg font-bold text-telaga-950">{pagination.totalItems}</p>
              </div>
              <div className="rounded-xl border border-telaga-100 bg-white px-3 py-2.5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-telaga-900/40">Aktif</p>
                <p className="text-lg font-bold text-telaga-700">{activeShifts}</p>
              </div>
              <div className="rounded-xl border border-telaga-100 bg-white px-3 py-2.5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-telaga-900/40">Revenue</p>
                <p className="truncate text-sm font-bold text-senja-700">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-3 rounded-2xl border border-telaga-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-telaga-50 text-telaga-700">
                  <Filter className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-sm font-bold text-telaga-950">Filter Data</h3>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-telaga-900/45">
                    Cabang
                  </label>
                  <BranchFilter
                    branches={branches}
                    selectedBranch={selectedBranch}
                    onBranchChange={setSelectedBranch}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-telaga-900/45">
                    Periode
                  </label>
                  <DateFilter
                    dateFilter={dateFilter}
                    onDateFilterChange={setDateFilter}
                    customDateRange={customDateRange}
                    onCustomDateRangeChange={setCustomDateRange}
                  />
                </div>
              </div>
            </div>

            {shifts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-telaga-200 bg-white/60 px-6 py-10 text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-telaga-50 text-telaga-600">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-telaga-950">Tidak ada data shift</h3>
                <p className="mt-1 text-xs text-telaga-900/55">Belum ada shift pada periode yang dipilih</p>
              </div>
            ) : (
              <>
                {/* Shifts List */}
                <div className="space-y-2">
                  {shifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="rounded-2xl border border-telaga-100 bg-white p-3 shadow-sm transition-colors hover:border-telaga-200"
                    >
                      <div className="mb-2.5 flex items-center gap-2">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-telaga-50 text-telaga-700">
                          <Building2 className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-telaga-950">
                            {shift.employee_shift?.name || 'Karyawan tidak diketahui'}
                          </p>
                          <p className="text-[11px] text-telaga-900/45">Shift #{shift.id}</p>
                        </div>
                        {getStatusBadge(shift)}
                        <button
                          onClick={() => handleShiftDetail(shift.id)}
                          className="flex-shrink-0 rounded-lg border border-telaga-100 bg-telaga-50 p-1.5 text-telaga-700 transition-colors hover:bg-telaga-100"
                          title="Detail shift"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                        <div className="rounded-lg bg-krem px-2 py-1.5">
                          <p className="text-[10px] font-medium text-telaga-900/45">Mulai</p>
                          <p className="truncate text-xs font-semibold text-telaga-950">{formatDate(shift.start_time)}</p>
                        </div>
                        <div className="rounded-lg bg-krem px-2 py-1.5">
                          <p className="text-[10px] font-medium text-telaga-900/45">Selesai</p>
                          <p className="truncate text-xs font-semibold text-telaga-950">
                            {shift.end_time ? formatDate(shift.end_time) : '-'}
                          </p>
                        </div>
                        <div className="rounded-lg bg-telaga-50 px-2 py-1.5">
                          <p className="text-[10px] font-medium text-telaga-700">Revenue</p>
                          <p className="truncate text-xs font-semibold text-telaga-800">{formatCurrency(shift.sales)}</p>
                        </div>
                        <div className="rounded-lg bg-krem px-2 py-1.5">
                          <p className="text-[10px] font-medium text-telaga-900/45">Kas akhir</p>
                          <p className="truncate text-xs font-semibold text-telaga-950">{formatCurrency(shift.cash_balance)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="rounded-xl border border-telaga-200 px-3 py-2 text-xs font-semibold text-telaga-800 transition-colors hover:bg-telaga-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Sebelumnya
                    </button>
                    <span className="rounded-xl bg-telaga-50 px-3 py-2 text-xs font-semibold text-telaga-800">
                      {pagination.currentPage} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="rounded-xl border border-telaga-200 px-3 py-2 text-xs font-semibold text-telaga-800 transition-colors hover:bg-telaga-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Berikutnya
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Shift Detail Modal */}
      {showDetailModal && selectedShift && (
        <ShiftDetailModal
          shift={selectedShift}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedShift(null);
          }}
        />
      )}
    </div>
  );
};

export default ShiftManagement;
