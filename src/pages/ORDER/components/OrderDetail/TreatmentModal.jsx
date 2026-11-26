import React, { useRef } from 'react';

const TreatmentModal = ({ open, treatments, onSelect, onClose }) => {
  const qtyRef = useRef();
  const dueRef = useRef();
  const diskonRef = useRef();
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Pilih Layanan</h3>
        <div className="flex gap-2 mb-2">
          <input ref={qtyRef} type="number" min={1} defaultValue={1} placeholder="Qty" className="w-1/3 p-2 border rounded-lg" />
          <input ref={dueRef} type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-1/3 p-2 border rounded-lg" />
          <input ref={diskonRef} type="number" min={0} defaultValue={0} placeholder="Diskon" className="w-1/3 p-2 border rounded-lg" />
        </div>
        <div className="space-y-2">
          {treatments.map(treatment => (
            <div
              key={treatment.id}
              onClick={() => onSelect(treatment, {
                qty: Number(qtyRef.current.value) || 1,
                due_date: dueRef.current.value || new Date().toISOString().split('T')[0],
                discount: Number(diskonRef.current.value) || 0
              })}
              className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-telaga-300 hover:bg-telaga-50"
            >
              <div className="font-medium">{treatment.name}</div>
              <div className="text-telaga-600 font-medium">Rp {treatment.price.toLocaleString()}</div>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 py-2 border border-gray-300 rounded-lg"
        >
          Batal
        </button>
      </div>
    </div>
  );
};

export default TreatmentModal; 