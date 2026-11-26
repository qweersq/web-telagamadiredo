import React, { useState, useEffect } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  subDays,
  format,
  getYear,
  getMonth,
  isSameDay,
  isWithinInterval
} from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Sun,
  History,
  CalendarRange,
  CalendarDays,
  CalendarClock,
  CalendarSearch,
  X
} from 'lucide-react';
import InfoModal from '../Modal/InfoModal';
const DateRangePickerV2 = ({ dateRange, setDateRange, onDateChange, label = 'Filter Tanggal Masuk' }) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [activeButton, setActiveButton] = useState(''); // Initialize as empty string
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Get current date
  const getCurrentDate = () => {
    const now = new Date();
    return new Date(now.getTime());
  };

  // Format date for database (YYYY-MM-DD)
  const formatDateForDB = (date) => {
    return format(date, 'yyyy-MM-dd');
  };

  // Determine which button should be active based on dateRange
  const determineActiveButton = (range) => {
    if (!range || !range.startDate || !range.endDate) {
      return '';
    }

    try {
      const startDate = new Date(range.startDate + 'T00:00:00');
      const endDate = new Date(range.endDate + 'T00:00:00');
      const today = getCurrentDate();

      // Check if it's "Hari Ini" (today)
      if (isSameDay(startDate, today) && isSameDay(endDate, today)) {
        return 'today';
      }

      // Check if it's "Kemarin" (yesterday)
      const yesterday = subDays(today, 1);
      if (isSameDay(startDate, yesterday) && isSameDay(endDate, yesterday)) {
        return 'yesterday';
      }

      // Check if it's "30 Hari Lalu" (last 30 days)
      const thirtyDaysAgo = subDays(today, 30);
      if (isSameDay(startDate, thirtyDaysAgo) && isSameDay(endDate, today)) {
        return 'lastMonth';
      }

      // Check if it's "Bulan Ini" (this month)
      const thisMonthStart = startOfMonth(today);
      const thisMonthEnd = endOfMonth(today);
      if (isSameDay(startDate, thisMonthStart) && isSameDay(endDate, thisMonthEnd)) {
        return 'thisMonth';
      }

      // Check if it's a custom month selection
      const startMonth = getMonth(startDate);
      const startYear = getYear(startDate);
      const endMonth = getMonth(endDate);
      const endYear = getYear(endDate);
      
      // If it's a full month selection (start of month to end of month)
      if (startMonth === endMonth && startYear === endYear) {
        const monthStart = startOfMonth(startDate);
        const monthEnd = endOfMonth(startDate);
        if (isSameDay(startDate, monthStart) && isSameDay(endDate, monthEnd)) {
          return 'custom';
        }
      }

      // If none of the above, it's custom
      return 'custom';
    } catch (error) {
      return '';
    }
  };

  // Handle quick date selection
  const handleQuickDateSelect = (type) => {
    console.log('🔵 DateRangePickerV2 handleQuickDateSelect:', type);
    const today = getCurrentDate();
    let startDate, endDate;

    // Set active button
    setActiveButton(type);

    switch (type) {
      case "today":
        // Hari ini
        startDate = today;
        endDate = today;
        break;
      case "yesterday":
        // Kemarin
        const yesterday = subDays(today, 1);
        startDate = yesterday;
        endDate = yesterday;
        break;
      case "lastMonth":
        // 1 bulan lalu (30 hari ke belakang)
        const thirtyDaysAgo = subDays(today, 30);
        startDate = thirtyDaysAgo;
        endDate = today;
        break;
      case "thisMonth":
        // Bulan ini
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case "custom":
        setShowCustomPicker(true);
        setActiveButton('custom');
        return;
      default:
        return;
    }

    const newRange = {
      startDate: formatDateForDB(startDate),
      endDate: formatDateForDB(endDate)
    };

    setDateRange(newRange);
    if (onDateChange) {
      onDateChange(newRange);
    }
  };

  const handleCustomDateChange = (field, value) => {
    const currentStart = dateRange?.startDate || '';
    const currentEnd = dateRange?.endDate || '';

    let newStart = field === 'start' ? value : currentStart;
    let newEnd = field === 'end' ? value : currentEnd;

    if (newStart && newEnd && newEnd < newStart) {
      if (field === 'start') newEnd = newStart;
      else newStart = newEnd;
    }

    const newRange = { startDate: newStart, endDate: newEnd };
    setDateRange(newRange);
    if (onDateChange) onDateChange(newRange);
  };

  // Handle custom month/year selection from modal
  const handleCustomMonthSelect = (month, year) => {
    if (!month || !year) return;
    setActiveButton('custom');
    const yearInt = parseInt(year);
    const monthInt = parseInt(month) - 1;
    const selectedDate = new Date(yearInt, monthInt, 1);
    // Get first and last day of the month
    const startDate = startOfMonth(selectedDate);
    const endDate = endOfMonth(selectedDate);
    
    const newRange = {
      startDate: formatDateForDB(startDate),
      endDate: formatDateForDB(endDate)
    };
    
    setDateRange(newRange);
    if (onDateChange) {
      onDateChange(newRange);
    }
    setShowCustomPicker(false);
  };


  // Get month/year display for selected range
  const getMonthYearDisplay = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    
    try {
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');
      
      const startMonth = format(start, 'MMMM', { locale: id });
      const startYear = getYear(start);
      const endMonth = format(end, 'MMMM', { locale: id });
      const endYear = getYear(end);
      
      // If same month and year, show only once
      if (startMonth === endMonth && startYear === endYear) {
        return `${startMonth} ${startYear}`;
      }
      
      // If different months but same year
      if (startYear === endYear) {
        return `${startMonth} - ${endMonth} ${startYear}`;
      }
      
      // If different years
      return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
    } catch (error) {
      console.error('Error in getMonthYearDisplay:', error);
      return '';
    }
  };

  // Sync activeButton with dateRange when dateRange changes
  useEffect(() => {
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      const determinedButton = determineActiveButton(dateRange);
      setActiveButton(determinedButton);
    }
  }, [dateRange]);

  // Initialize with 30 days ago if no dateRange
  useEffect(() => {
    if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
      const today = getCurrentDate();
      const thirtyDaysAgo = subDays(today, 30);
      
      const initialRange = {
        startDate: formatDateForDB(thirtyDaysAgo),
        endDate: formatDateForDB(today)
      };
      
      setDateRange(initialRange);
      if (onDateChange) {
        onDateChange(initialRange);
      }
    }
  }, [dateRange, onDateChange]);

  // Pilihan cepat rentang tanggal
  const QUICK_OPTIONS = [
    { id: 'today', label: 'Hari Ini', icon: Sun },
    { id: 'yesterday', label: 'Kemarin', icon: History },
    { id: 'lastMonth', label: '30 Hari Lalu', icon: CalendarRange },
    { id: 'thisMonth', label: 'Bulan Ini', icon: CalendarDays },
  ];

  const formatShort = (value) => {
    if (!value) return '';
    try {
      return format(new Date(value + 'T00:00:00'), 'd MMM yy', { locale: id });
    } catch (error) {
      return '';
    }
  };

  const rangeSummary =
    dateRange?.startDate && dateRange?.endDate
      ? formatShort(dateRange.startDate) === formatShort(dateRange.endDate)
        ? formatShort(dateRange.startDate)
        : `${formatShort(dateRange.startDate)} – ${formatShort(dateRange.endDate)}`
      : 'Belum dipilih';

  return (
    <div className="mt-3 mb-2">
      <div className="rounded-2xl border border-telaga-100 bg-white p-3 shadow-sm">
        {/* Header: label + ringkasan rentang aktif */}
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-telaga-50 text-telaga-600">
              <CalendarClock className="h-4 w-4" />
            </div>
            <span className="truncate text-xs font-semibold font-montserrat text-telaga-900">
              {label}
            </span>
          </div>
          <span className="shrink-0 rounded-full bg-telaga-50 px-2.5 py-1 text-[10px] font-semibold font-montserrat text-telaga-700">
            {rangeSummary}
          </span>
        </div>

        {/* Pilihan cepat */}
        <div className="flex gap-1.5 overflow-x-auto flex-nowrap pb-1 scrollbar-hide">
          {QUICK_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = activeButton === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleQuickDateSelect(option.id)}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-1.5 text-xs font-semibold font-montserrat transition-all active:scale-95 ${
                  isActive
                    ? 'border-telaga-600 bg-gradient-to-r from-telaga-600 to-telaga-500 text-white shadow-sm shadow-telaga-600/25'
                    : 'border-telaga-100 bg-telaga-50/60 text-telaga-700 hover:border-telaga-200 hover:bg-telaga-50'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-telaga-500'}`} />
                {option.label}
              </button>
            );
          })}

          <button
            onClick={() => handleQuickDateSelect('custom')}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-1.5 text-xs font-semibold font-montserrat transition-all active:scale-95 ${
              activeButton === 'custom'
                ? 'border-senja-500 bg-gradient-to-r from-senja-500 to-senja-400 text-white shadow-sm shadow-senja-500/25'
                : 'border-senja-100 bg-senja-50/70 text-senja-700 hover:border-senja-200 hover:bg-senja-50'
            }`}
          >
            <CalendarSearch className={`h-3.5 w-3.5 ${activeButton === 'custom' ? 'text-white' : 'text-senja-500'}`} />
            Pilih Tanggal
          </button>
        </div>

        {/* Input rentang kustom */}
        {showCustomPicker && (
          <div className="mt-2.5 rounded-xl border border-senja-100 bg-senja-50/60 p-2.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold font-montserrat text-senja-800">
                Rentang Kustom
              </span>
              <button
                onClick={() => setShowCustomPicker(false)}
                className="flex h-5 w-5 items-center justify-center rounded-md text-senja-500 transition-colors hover:bg-senja-100 hover:text-senja-700"
                title="Tutup"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wide text-telaga-400">
                  Dari
                </span>
                <input
                  type="date"
                  value={dateRange?.startDate || ''}
                  max={dateRange?.endDate || undefined}
                  onChange={(e) => handleCustomDateChange('start', e.target.value)}
                  className="w-full rounded-lg border border-white bg-white py-1.5 pl-11 pr-2 text-xs font-montserrat text-telaga-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-senja-400/30"
                />
              </div>
              <span className="shrink-0 text-[10px] font-bold text-senja-400">s/d</span>
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wide text-telaga-400">
                  Sampai
                </span>
                <input
                  type="date"
                  value={dateRange?.endDate || ''}
                  min={dateRange?.startDate || undefined}
                  onChange={(e) => handleCustomDateChange('end', e.target.value)}
                  className="w-full rounded-lg border border-white bg-white py-1.5 pl-14 pr-2 text-xs font-montserrat text-telaga-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-senja-400/30"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Modal */}
      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Rentang Waktu"
        items={[
          {
            title: "Filter Item",
            description: "Memilih item berdasarkan tanggal masuknya. Pilih bulan untuk melihat item yang masuk pada periode tersebut.",
            bgColor: "bg-telaga-50",
            dotColor: "bg-telaga-500",
            titleColor: "text-telaga-700"
          }
        ]}
        footerInfo={{
          icon: "📅",
          text: "Item akan tampil sesuai periode yang dipilih"
        }}
        maxWidth="max-w-lg"
      />
    </div>

  );
};

export default DateRangePickerV2;
