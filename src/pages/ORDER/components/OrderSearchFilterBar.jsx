import React, { useState, useEffect, useRef } from "react";
import { Search, RotateCcw, Calendar, Filter, ChevronDown, BarChart2, RefreshCw } from "lucide-react";
import dayjs from "dayjs";

const OrderSearchFilterBar = ({
  searchTerm,
  setSearchTerm,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  dateFilterType,
  setDateFilterType,
  orderDetailStatus,
  setOrderDetailStatus,
  paymentStatus,
  setPaymentStatus,
  onReset,
  onResetFilter,
  showQuickStats,
  setShowQuickStats,
  refreshOrders,
  loading,
}) => {
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [quickDateFilter, setQuickDateFilter] = useState('today');
  const [showFilterSection, setShowFilterSection] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'dateType' | 'orderStatus' | 'paymentStatus'
  const isInitialized = useRef(false);

  const DATE_TYPE_OPTIONS = [
    { value: 'entry_date', label: 'Tgl Masuk' },
    { value: 'due_date', label: 'Tgl Selesai' },
    { value: 'payment_date', label: 'Tgl Bayar' },
  ];
  const ORDER_STATUS_OPTIONS = [
    { value: 'all', label: 'Semua' },
    { value: 'not_yet', label: 'Belum Dikerjakan' },
    { value: 'antrian', label: 'Antrian' },
    { value: 'on_progress', label: 'Proses' },
    { value: 'pengeringan', label: 'Pengeringan' },
    { value: 'siap', label: 'Siap Diambil' },
    { value: 'done', label: 'Selesai' },
    { value: 'cancelled', label: 'Dibatalkan' },
  ];
  const PAYMENT_STATUS_OPTIONS = [
    { value: 'all', label: 'Semua' },
    { value: 'unpaid', label: 'Belum Lunas' },
    { value: 'paid', label: 'Lunas' },
    { value: 'dp', label: 'DP' },
    { value: 'cancelled', label: 'Dibatalkan' },
  ];

  // Sync local search with prop
  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  // Handle reset from parent
  useEffect(() => {
    if (onReset > 0) {
      setQuickDateFilter('today');
      setLocalSearch("");
      setShowFilterSection(false);
      setOpenDropdown(null);
    }
  }, [onReset]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdown) return;
    const handler = () => setOpenDropdown(null);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openDropdown]);

  // Detect quick date filter based on dates
  useEffect(() => {
    if (!startDate || !endDate) {
      // Fallback: set pill ke 'today' (parent sudah inisialisasi default, ini jaga-jaga)
      setQuickDateFilter('today');
      return;
    }

    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const thisMonthStart = dayjs().startOf('month').format('YYYY-MM-DD');

    if (startDate === today && endDate === today) {
      setQuickDateFilter('today');
    } else if (startDate === yesterday && endDate === yesterday) {
      setQuickDateFilter('yesterday');
    } else if (startDate === thisMonthStart && endDate === today) {
      setQuickDateFilter('thisMonth');
    } else {
      setQuickDateFilter('custom');
    }
  }, [startDate, endDate]);

  const handleQuickDateSelect = (type) => {
    setQuickDateFilter(type);
    const today = dayjs().format('YYYY-MM-DD');

    switch (type) {
      case 'today':
        setStartDate(today);
        setEndDate(today);
        break;
      case 'yesterday':
        const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
        setStartDate(yesterday);
        setEndDate(yesterday);
        break;
      case 'thisMonth':
        setStartDate(dayjs().startOf('month').format('YYYY-MM-DD'));
        setEndDate(today);
        break;
      case 'custom':
        // Keep current dates
        break;
      default:
        break;
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setSearchTerm(localSearch);
  };

  const isSearchActive = searchTerm && searchTerm.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Top Row: Search + Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-telaga-600 transition-colors" />
          <input
            type="text"
            placeholder="Cari Pesanan (Nama/HP)..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-telaga-500/20 focus:border-telaga-500 transition-all font-montserrat"
          />
          {localSearch !== searchTerm && (
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-telaga-600 text-white text-[10px] px-2 py-1 rounded font-bold hover:bg-telaga-700 animate-in fade-in"
            >
              Apply
            </button>
          )}
        </form>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQuickStats(!showQuickStats)}
            className={`p-2 rounded-lg border transition-all flex items-center gap-2 text-sm font-medium font-montserrat ${
              showQuickStats
                ? 'bg-telaga-600 text-white border-telaga-600 shadow-md'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
            title="Toggle Statistics"
          >
            <BarChart2 className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Stats</span>
          </button>

          <button
            onClick={() => setShowFilterSection(prev => !prev)}
            className={`p-2 rounded-lg border transition-all flex items-center gap-2 text-sm font-medium font-montserrat ${
              showFilterSection
                ? 'bg-telaga-600 text-white border-telaga-600 shadow-md'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
            title="Toggle Filter"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Filter</span>
          </button>

          <button
            onClick={refreshOrders}
            disabled={loading}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-40"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>


        </div>
      </div>

      {/* Filter Section: collapsible via Filter toggle */}
      {showFilterSection && (
        <div className="flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200">
          {/* Date Pills */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 relative flex items-center gap-1 bg-gray-50 px-1.5 py-1 rounded-lg border border-gray-100">
              <Calendar className="w-3 h-3 text-gray-400" />
              {!isSearchActive ? (
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'dateType' ? null : 'dateType')}
                  className="text-[10px] font-bold font-montserrat text-telaga-700 hover:text-telaga-600 leading-none flex items-center gap-0.5"
                >
                  {DATE_TYPE_OPTIONS.find(o => o.value === dateFilterType)?.label}
                  <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
                </button>
              ) : (
                <span className="text-[10px] font-bold text-gray-400 leading-none">Semua Tgl</span>
              )}
              {openDropdown === 'dateType' && (
                <div onMouseDown={(e) => e.stopPropagation()} className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[120px] overflow-hidden">
                  {DATE_TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setDateFilterType(opt.value); setOpenDropdown(null); }}
                      className={`w-full text-left px-3 py-2 text-xs font-montserrat transition-colors ${
                        dateFilterType === opt.value
                          ? 'bg-telaga-50 text-telaga-700 font-bold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5 py-1">
                {[
                  { id: 'today', label: 'Hari Ini' },
                  { id: 'yesterday', label: 'Kemarin' },
                  { id: 'thisMonth', label: 'Bulan Ini' },
                  { id: 'custom', label: 'Kustom' },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    disabled={isSearchActive}
                    onClick={() => handleQuickDateSelect(pill.id)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all font-montserrat ${
                      isSearchActive
                        ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                        : quickDateFilter === pill.id
                        ? 'bg-gradient-to-r from-telaga-600 to-telaga-500 text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {quickDateFilter === 'custom' && !isSearchActive && (
            <div className="flex flex-wrap items-center gap-3 p-2 bg-telaga-50/60 border border-telaga-100 rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white border border-gray-200 rounded px-2 py-1.5 text-sm font-montserrat w-full focus:ring-1 focus:ring-telaga-500 focus:outline-none"
                />
                <span className="text-xs text-telaga-500 font-bold">ke</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white border border-gray-200 rounded px-2 py-1.5 text-sm font-montserrat w-full focus:ring-1 focus:ring-telaga-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Status Dropdowns */}
          <div className="flex flex-wrap gap-2">
            {/* Pengerjaan */}
            <div className="flex-1 min-w-[120px] relative">
              <button
                disabled={isSearchActive}
                onClick={() => !isSearchActive && setOpenDropdown(openDropdown === 'orderStatus' ? null : 'orderStatus')}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg transition-all ${
                  isSearchActive ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3 h-3 text-gray-400" />
                  <span className="text-xs font-semibold font-montserrat text-gray-700">
                    Pengerjaan: {ORDER_STATUS_OPTIONS.find(o => o.value === orderDetailStatus)?.label}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
              </button>
              {openDropdown === 'orderStatus' && (
                <div onMouseDown={(e) => e.stopPropagation()} className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {ORDER_STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setOrderDetailStatus(opt.value); setOpenDropdown(null); }}
                      className={`w-full flex items-center justify-start px-3 py-2.5 text-xs font-montserrat transition-colors border-b border-gray-50 last:border-0 ${
                        orderDetailStatus === opt.value
                          ? 'bg-telaga-50 text-telaga-700 font-bold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pembayaran */}
            <div className="flex-1 min-w-[120px] relative">
              <button
                disabled={isSearchActive}
                onClick={() => !isSearchActive && setOpenDropdown(openDropdown === 'paymentStatus' ? null : 'paymentStatus')}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg transition-all ${
                  isSearchActive ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3 h-3 text-gray-400" />
                  <span className="text-xs font-semibold font-montserrat text-gray-700">
                    Bayar: {PAYMENT_STATUS_OPTIONS.find(o => o.value === paymentStatus)?.label}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
              </button>
              {openDropdown === 'paymentStatus' && (
                <div onMouseDown={(e) => e.stopPropagation()} className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {PAYMENT_STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setPaymentStatus(opt.value); setOpenDropdown(null); }}
                      className={`w-full flex items-center justify-start px-3 py-2.5 text-xs font-montserrat transition-colors border-b border-gray-50 last:border-0 ${
                        paymentStatus === opt.value
                          ? 'bg-telaga-50 text-telaga-700 font-bold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        <button
            onClick={onResetFilter}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-gray-500 hover:text-red-500 border border-dashed border-gray-200 hover:border-red-200 rounded-lg transition-all font-montserrat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filter
          </button>


          {isSearchActive && (
            <div className="text-xs text-green-600 font-bold bg-green-50 px-3 py-2 rounded-lg border border-green-100 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Mode Pencarian: Filter tanggal & status dinonaktifkan (Global Search).
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderSearchFilterBar;