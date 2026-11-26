import React, { useState, useEffect } from 'react';
import AnimatedButton from '../Design/AnimatedButton';

const DateRangePicker = ({ dateRange, setDateRange, onDateChange }) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Format date untuk input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Format date untuk database
  const formatDateForDB = (dateString) => {
    const date = new Date(dateString);
    const formatted = date.toISOString().split('T')[0];
    console.log('formatDateForDB - input:', dateString);
    console.log('formatDateForDB - date object:', date);
    console.log('formatDateForDB - output:', formatted);
    return formatted;
  };

  // Get Indonesia time
  const getIndonesiaTime = () => {
    const now = new Date();
    // Get Indonesia time by adding 7 hours to UTC
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const indonesiaTime = new Date(utc + (7 * 3600000));
    return indonesiaTime;
  };

  // Handle quick date selection
  const handleQuickDateSelect = (type) => {
    const today = getIndonesiaTime();
    let newStartDate, newEndDate;

    switch (type) {
      case "lastMonth":
        // 1 bulan lalu
        const lastYear = today.getFullYear();
        const lastMonth = today.getMonth() - 1;
        newStartDate = new Date(lastYear, lastMonth, 1);
        newEndDate = new Date(lastYear, lastMonth + 1, 0);
        break;
      case "thisMonth":
        // Bulan ini
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        newStartDate = new Date(currentYear, currentMonth, 1);
        newEndDate = new Date(currentYear, currentMonth + 1, 0);
        
        console.log('thisMonth - today:', today);
        console.log('thisMonth - currentYear:', currentYear);
        console.log('thisMonth - currentMonth:', currentMonth);
        console.log('thisMonth - newStartDate:', newStartDate);
        console.log('thisMonth - newEndDate:', newEndDate);
        break;
      case "custom":
        // Custom - show date picker
        setShowCustomPicker(true);
        return;
      default:
        return;
    }

    const formattedStartDate = formatDateForDB(newStartDate);
    const formattedEndDate = formatDateForDB(newEndDate);

    const newRange = {
      startDate: formattedStartDate,
      endDate: formattedEndDate,
    };

    setDateRange(newRange);
    if (onDateChange) {
      onDateChange(newRange);
    }
  };

  // Handle custom month/year selection
  const handleCustomMonthSelect = () => {
    if (!selectedMonth || !selectedYear) return;
    
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth) - 1; // Convert to 0-based month
    
    // First day of selected month
    const startDate = new Date(year, month, 1);
    // Last day of selected month
    const endDate = new Date(year, month + 1, 0);
    
    console.log('Custom month - selectedYear:', selectedYear, 'selectedMonth:', selectedMonth);
    console.log('Custom month - year:', year, 'month (0-based):', month);
    console.log('Custom month - startDate:', startDate);
    console.log('Custom month - endDate:', endDate);
    
    const newRange = {
      startDate: formatDateForDB(startDate),
      endDate: formatDateForDB(endDate)
    };
    
    console.log('Custom month - newRange:', newRange);
    
    setDateRange(newRange);
    if (onDateChange) {
      onDateChange(newRange);
    }
    setShowCustomPicker(false);
  };

  // Handle month input change
  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  // Handle year input change
  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
  };

  // Get month/year display for selected range
  const getMonthYearDisplay = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    
    // Parse dates with explicit timezone to avoid timezone issues
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const startMonth = monthNames[start.getMonth()];
    const startYear = start.getFullYear();
    const endMonth = monthNames[end.getMonth()];
    const endYear = end.getFullYear();
    
    // Check if it's the same month and year
    const isSameMonth = start.getMonth() === end.getMonth();
    const isSameYear = start.getFullYear() === end.getFullYear();
    
    // If same month and year, show only once
    if (isSameMonth && isSameYear) {
      return `${startMonth} ${startYear}`;
    }
    
    // If different months but same year
    if (isSameYear) {
      return `${startMonth} - ${endMonth} ${startYear}`;
    }
    
    // If different years
    return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
  };

  // Initialize with this month if no dateRange
  useEffect(() => {
    if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
      // Only initialize if no dateRange exists
      const today = getIndonesiaTime();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
      
      console.log('Initialize - today:', today);
      console.log('Initialize - currentYear:', currentYear);
      console.log('Initialize - currentMonth:', currentMonth);
      console.log('Initialize - startOfMonth:', startOfMonth);
      console.log('Initialize - endOfMonth:', endOfMonth);
      
      const initialRange = {
        startDate: formatDateForDB(startOfMonth),
        endDate: formatDateForDB(endOfMonth)
      };
      
      console.log('Initialize - initialRange:', initialRange);
      
      setDateRange(initialRange);
      if (onDateChange) {
        onDateChange(initialRange);
      }
    }
  }, [dateRange, onDateChange]);

  return (
    <div className="mb-2 bg-white rounded-3xl p-4 mt-4 opacity-100 outline outline-2 outline-[#EEF1F7]">
      <h2 className="text-lg font-semibold font-montserrat mb-3">Rentang Waktu</h2>

      {/* Quick Date Selection Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <AnimatedButton
          onClick={() => handleQuickDateSelect("lastMonth")}
          className="h-[35px] rounded-xl flex items-center justify-center text-sm font-semibold bg-[#E6EFF9] text-[#2E7CF6] hover:bg-[#65B7FF] hover:text-white transition-all"
        >
          1 Bulan Lalu
        </AnimatedButton>
        <AnimatedButton
          onClick={() => handleQuickDateSelect("thisMonth")}
          className="h-[35px] rounded-xl flex items-center justify-center text-sm font-semibold bg-[#E6EFF9] text-[#2E7CF6] hover:bg-[#65B7FF] hover:text-white transition-all"
        >
          Bulan Ini
        </AnimatedButton>
        <AnimatedButton
          onClick={() => handleQuickDateSelect("custom")}
          className="h-[35px] rounded-xl flex items-center justify-center text-sm font-semibold bg-[#E6EFF9] text-[#2E7CF6] hover:bg-[#65B7FF] hover:text-white transition-all"
        >
          Custom Bulan
        </AnimatedButton>
      </div>

      {/* Custom Month/Year Picker */}
      {showCustomPicker && (
        <div className="font-montserrat mb-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Bulan
              </label>
              <select
                value={selectedMonth}
                onChange={handleMonthChange}
                className="bg-[#E6EFF9] text-gray-600 shadow shadow-white opacity-100 outline outline-1 outline-white w-full p-2 rounded-xl font-semibold"
              >
                <option value="">Pilih Bulan</option>
                <option value="1">Januari</option>
                <option value="2">Februari</option>
                <option value="3">Maret</option>
                <option value="4">April</option>
                <option value="5">Mei</option>
                <option value="6">Juni</option>
                <option value="7">Juli</option>
                <option value="8">Agustus</option>
                <option value="9">September</option>
                <option value="10">Oktober</option>
                <option value="11">November</option>
                <option value="12">Desember</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Tahun
              </label>
              <select
                value={selectedYear}
                onChange={handleYearChange}
                className="bg-[#E6EFF9] text-gray-600 shadow shadow-white opacity-100 outline outline-1 outline-white w-full p-2 rounded-xl font-semibold"
              >
                <option value="">Pilih Tahun</option>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <AnimatedButton
              onClick={handleCustomMonthSelect}
              disabled={!selectedMonth || !selectedYear}
              className="flex-1 h-[35px] rounded-xl flex items-center justify-center text-sm font-semibold bg-[#2E7CF6] text-white hover:bg-[#1E5BB8] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
            >
              Terapkan
            </AnimatedButton>
            <AnimatedButton
              onClick={() => setShowCustomPicker(false)}
              className="flex-1 h-[35px] rounded-xl flex items-center justify-center text-sm font-semibold bg-gray-400 text-white hover:bg-gray-500 transition-all"
            >
              Batal
            </AnimatedButton>
          </div>
        </div>
      )}

      {/* Selected Date Range Display */}
      {dateRange && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-600 font-montserrat">
            <strong>Periode Terpilih:</strong>
          </div>
          <div className="text-sm text-gray-800 font-montserrat">
            {getMonthYearDisplay(dateRange.startDate, dateRange.endDate)}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
