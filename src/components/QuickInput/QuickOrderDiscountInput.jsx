import React from 'react';

const QuickOrderDiscountInput = ({ discount, setDiscount }) => (
  <div>
    <h3 className="font-medium mb-2">Diskon</h3>
    <div className="flex gap-2 items-center">
      <select
        value={discount.type}
        onChange={e => setDiscount({ ...discount, type: e.target.value })}
        className="px-2 py-1 border border-gray-200 rounded-lg bg-white/80 text-xs"
      >
        <option value="nominal">Nominal (Rp)</option>
        <option value="percent">Persen (%)</option>
      </select>
      <input
        type="number"
        min={0}
        value={discount.value}
        onChange={e => setDiscount({ ...discount, value: Number(e.target.value) })}
        className="w-24 px-2 py-1 border border-gray-200 rounded-lg bg-white/80 text-xs"
        placeholder="0"
      />
      <span className="text-xs text-gray-500">{discount.type === 'percent' ? '%' : 'Rp'}</span>
    </div>
    {discount.value > 0 && (
      <div className="text-xs text-blue-500 mt-1">Diskon diterapkan: {discount.type === 'percent' ? discount.value + '%' : 'Rp ' + discount.value.toLocaleString()}</div>
    )}
  </div>
);

export default QuickOrderDiscountInput; 