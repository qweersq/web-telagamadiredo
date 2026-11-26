import React from 'react';

const ItemDetailInputs = ({ treatment, qty, itemInputs, onItemInputChange }) => (
  <div className="bg-white rounded-xl shadow p-4 mt-4">
    <h3 className="text-lg font-montserrat text-gray-800 mb-2">
      Input Item untuk <span className="text-telaga-700">{treatment.name}</span> <span className="text-xs text-gray-500">({qty} item)</span>
    </h3>
    {[...Array(qty)].map((_, i) => (
      <div key={i} className="mb-6 border-b border-gray-100 pb-4">
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Nama Item"
            value={itemInputs[i]?.name || ''}
            onChange={e => onItemInputChange(i, 'name', e.target.value)}
            className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-telaga-400 text-base font-montserrat"
          />
          <input
            type="text"
            placeholder="Brand"
            value={itemInputs[i]?.brand || ''}
            onChange={e => onItemInputChange(i, 'brand', e.target.value)}
            className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-telaga-400 text-base font-montserrat"
          />
          <input
            type="text"
            placeholder="Warna"
            value={itemInputs[i]?.color || ''}
            onChange={e => onItemInputChange(i, 'color', e.target.value)}
            className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-telaga-400 text-base font-montserrat"
          />
          <input
            type="text"
            placeholder="Material"
            value={itemInputs[i]?.material || ''}
            onChange={e => onItemInputChange(i, 'material', e.target.value)}
            className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-telaga-400 text-base font-montserrat"
          />
          <textarea
            placeholder="Catatan/Notes (opsional)"
            value={itemInputs[i]?.notes || ''}
            onChange={e => onItemInputChange(i, 'notes', e.target.value)}
            className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-telaga-400 text-base font-montserrat resize-none"
            rows={2}
          />
        </div>
      </div>
    ))}
  </div>
);

export default ItemDetailInputs; 