import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

const DateFilter = ({ dateFilter, onDateFilterChange, customDateRange, onCustomDateRangeChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const dateOptions = [
    { value: 'today', label: 'Hari Ini' },
    { value: '7days', label: '7 Hari Terakhir' },
    { value: '30days', label: '30 Hari Terakhir' },
    { value: 'custom', label: 'Custom Tanggal' },
    { value: 'all', label: 'Semua' }
  ];

  const selectedOption = dateOptions.find(option => option.value === dateFilter);

  return (
    <div className="space-y-2">
      <div className="relative z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between rounded-xl border border-telaga-100 bg-krem px-3 py-2.5 text-left font-montserrat transition-colors hover:bg-telaga-50 focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
        >
          <div className="flex items-center space-x-2">
            <Calendar className="h-3.5 w-3.5 text-telaga-700" />
            <span className="text-sm font-semibold text-telaga-950">
              {selectedOption ? selectedOption.label : 'Pilih Periode'}
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 text-telaga-900/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-telaga-100 bg-white shadow-xl">
            <div className="py-2">
              {dateOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onDateFilterChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-left font-montserrat text-sm transition-colors ${
                    dateFilter === option.value ? 'bg-telaga-50 font-semibold text-telaga-800' : 'text-telaga-900/70 hover:bg-krem'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-telaga-600" />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Custom Date Range Inputs */}
      {dateFilter === 'custom' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-telaga-900/45">Dari tanggal</label>
            <input
              type="date"
              value={customDateRange.start}
              onChange={(e) => onCustomDateRangeChange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full rounded-xl border border-telaga-100 bg-krem px-3 py-2.5 font-montserrat text-sm focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-telaga-900/45">Sampai tanggal</label>
            <input
              type="date"
              value={customDateRange.end}
              onChange={(e) => onCustomDateRangeChange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full rounded-xl border border-telaga-100 bg-krem px-3 py-2.5 font-montserrat text-sm focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DateFilter;
