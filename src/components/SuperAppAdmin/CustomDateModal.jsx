import { useState, useEffect } from 'react';

/**
 * Simple Custom Date Range Modal
 */
const CustomDateModal = ({ isOpen, onClose, onApply, currentFilter }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sync with current filter
  useEffect(() => {
    if (isOpen && currentFilter) {
      setStartDate(currentFilter.start_date || '');
      setEndDate(currentFilter.end_date || '');
    }
  }, [isOpen, currentFilter]);

  const handleSubmit = () => {
    if (!startDate || !endDate) {
      alert('Pilih tanggal awal dan akhir');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('Tanggal awal tidak boleh lebih besar dari tanggal akhir');
      return;
    }

    onApply({
      start_date: startDate,
      end_date: endDate,
      preset: 'custom'
    });

    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 font-montserrat">Custom Date Range</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 font-montserrat mb-1">
              Tanggal Awal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-montserrat"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 font-montserrat mb-1">
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-montserrat"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-2">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-montserrat font-medium"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-montserrat font-medium"
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomDateModal;

