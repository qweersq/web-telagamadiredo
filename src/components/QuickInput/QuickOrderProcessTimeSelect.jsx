import React from 'react';

const options = [
  { value: 'regular', label: 'Regular', extra: 0 },
  { value: 'next_day', label: 'Next Day', extra: 10000 },
  { value: 'same_day', label: 'Same Day', extra: 20000 },
];

const QuickOrderProcessTimeSelect = ({ processTime, setProcessTime }) => (
  <div>
    <h3 className="font-medium mb-2">Waktu Pengerjaan</h3>
    <div className="flex gap-2">
      {options.map(opt => (
        <label key={opt.value} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${processTime === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
          <input
            type="radio"
            name="processTime"
            value={opt.value}
            checked={processTime === opt.value}
            onChange={() => setProcessTime(opt.value)}
            className="form-radio accent-blue-500 font-montserrat"
          />
          <span>{opt.label}</span>
          {opt.extra > 0 && <span className="text-xs text-blue-500 font-semibold ml-2">+Rp {opt.extra.toLocaleString()}</span>}
        </label>
      ))}
    </div>
  </div>
);

export default QuickOrderProcessTimeSelect; 