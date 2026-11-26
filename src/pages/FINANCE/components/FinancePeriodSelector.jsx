import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import AnimatedButton from '../../../components/Design/AnimatedButton';
import { getPeriods } from '../api/financeApi';

const FinancePeriodSelector = ({ selectedPeriod, selectedDate, onPeriodChange }) => {
  const [periods, setPeriods] = useState({
    daily: [],
    weekly: [],
    monthly: []
  });
  const [showCalendar, setShowCalendar] = useState(false);

  // Helper function to get start of week (Monday)
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Helper function to get end of week (Sunday)
  const getEndOfWeek = (date) => {
    const startOfWeek = getStartOfWeek(date);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return endOfWeek;
  };

  // Fetch periods data
  const fetchPeriods = async () => {
    try {
      const periodsData = await getPeriods();
      setPeriods(periodsData);
    } catch (error) {
      console.error('Error fetching periods:', error);
      // Fallback to dummy data if API fails
      const today = new Date();
      const dummyPeriods = {
        daily: [
          { date: today.toISOString().split('T')[0], label: today.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }
        ],
        weekly: [
          { 
            week: 1, 
            start_date: '2025-01-13', 
            end_date: '2025-01-19', 
            label: '13 Jan - 19 Jan 2025' 
          }
        ],
        monthly: [
          { 
            month: '2025-01', 
            name: 'Januari 2025' 
          }
        ]
      };
      setPeriods(dummyPeriods);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCalendar && !event.target.closest('.calendar-container')) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  const handlePeriodChange = (period) => {
    let newDate = selectedDate;
    
    if (period === 'daily') {
      newDate = new Date().toISOString().split('T')[0];
    } else if (period === 'weekly') {
      // Get current week start (Monday)
      const today = new Date();
      const startOfWeek = getStartOfWeek(today);
      newDate = startOfWeek.toISOString().split('T')[0];
    } else if (period === 'monthly') {
      // Get current month
      const today = new Date();
      newDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    }
    
    onPeriodChange(period, newDate);
  };

  const formatDateLabel = (date) => {
    if (selectedPeriod === 'daily') {
      return new Date(date).toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } else if (selectedPeriod === 'weekly') {
      // Format weekly range: "13 Jan - 19 Jan 2025"
      const startOfWeek = getStartOfWeek(date);
      const endOfWeek = getEndOfWeek(date);
      
      const startFormatted = startOfWeek.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'short' 
      });
      const endFormatted = endOfWeek.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
      
      return `${startFormatted} - ${endFormatted}`;
    } else if (selectedPeriod === 'monthly') {
      const [year, month] = date.split('-');
      return new Date(year, month - 1).toLocaleDateString('id-ID', { 
        month: 'long', 
        year: 'numeric' 
      });
    }
    return date;
  };

  // Handle navigation (previous/next)
  const handleNavigate = (direction) => {
    let newDate = selectedDate;
    
    if (selectedPeriod === 'daily') {
      const currentDate = new Date(selectedDate);
      if (direction === 'prev') {
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
      }
      newDate = currentDate.toISOString().split('T')[0];
    } else if (selectedPeriod === 'weekly') {
      // Navigate to previous/next week
      const currentDate = new Date(selectedDate);
      
      if (direction === 'prev') {
        // Go to previous week (7 days back)
        currentDate.setDate(currentDate.getDate() - 7);
      } else {
        // Go to next week (7 days forward)
        currentDate.setDate(currentDate.getDate() + 7);
      }
      // Ensure we stay at the start of the week (Monday)
      const startOfWeek = getStartOfWeek(currentDate);
      newDate = startOfWeek.toISOString().split('T')[0];
    } else if (selectedPeriod === 'monthly') {
      const [year, month] = selectedDate.split('-');
      const currentDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      if (direction === 'prev') {
        currentDate.setMonth(currentDate.getMonth() - 1);
      } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      newDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    }
    
    onPeriodChange(selectedPeriod, newDate);
  };

  // Check if navigation buttons should be disabled
  const isPrevDisabled = () => {
    // For now, allow all navigation to test functionality
    // Can be restricted later if needed
    return false;
  };

  const isNextDisabled = () => {
    // For now, allow all navigation to test functionality
    // Can be restricted later if needed
    return false;
  };

  // Handle calendar click
  const handleCalendarClick = () => {
    if (selectedPeriod === 'daily') {
      setShowCalendar(!showCalendar);
    }
  };

  // Handle date selection from calendar
  const handleDateSelect = (event) => {
    const selectedDateValue = event.target.value;
    onPeriodChange(selectedPeriod, selectedDateValue);
    setShowCalendar(false);
  };

  return (
    <div className="bg-gray-50 rounded p-2">
      {/* Period Type Selector */}
      <div className="flex gap-1 mb-2">
        <AnimatedButton
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
            selectedPeriod === 'daily'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
          onClick={() => handlePeriodChange('daily')}
        >
          Harian
        </AnimatedButton>
        
        <AnimatedButton
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
            selectedPeriod === 'weekly'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
          onClick={() => handlePeriodChange('weekly')}
        >
          Mingguan
        </AnimatedButton>
        
        <AnimatedButton
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
            selectedPeriod === 'monthly'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
          onClick={() => handlePeriodChange('monthly')}
        >
          Bulanan
        </AnimatedButton>
      </div>

      {/* Date/Period Display */}
      <div className="flex items-center justify-between p-3 bg-white rounded-xl border-2 border-gray-200 shadow-sm">
        <button 
          onClick={() => handleNavigate('prev')}
          disabled={isPrevDisabled()}
          className={`p-2 rounded-lg transition-all duration-200 ${
            isPrevDisabled() 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'hover:bg-gray-100 text-gray-600 hover:shadow-sm'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleCalendarClick}
            className="calendar-container flex items-center gap-2 hover:bg-gray-50 px-3 py-2 rounded-lg transition-all duration-200 hover:shadow-sm"
          >
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-gray-800 text-sm font-montserrat">
              {formatDateLabel(selectedDate)}
            </span>
          </button>
        </div>
        
        <button 
          onClick={() => handleNavigate('next')}
          disabled={isNextDisabled()}
          className={`p-2 rounded-lg transition-all duration-200 ${
            isNextDisabled() 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'hover:bg-gray-100 text-gray-600 hover:shadow-sm'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Picker for Daily Period */}
      {showCalendar && selectedPeriod === 'daily' && (
        <div className="calendar-container mt-3 p-4 bg-white rounded-xl border-2 border-gray-200 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700 font-montserrat">Pilih Tanggal</span>
            <button
              onClick={() => setShowCalendar(false)}
              className="text-gray-400 hover:text-gray-600 text-sm p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateSelect}
            className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-montserrat transition-all duration-200"
          />
        </div>
      )}
    </div>
  );
};

export default FinancePeriodSelector;
