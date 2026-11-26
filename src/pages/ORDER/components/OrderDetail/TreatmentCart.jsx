import React from 'react';
import { X } from 'lucide-react';
import { calculateFinalPrice } from '../../utils/orderTransformNew';

const TreatmentCart = ({ cart, onRemove, onEdit }) => {
  // Fungsi untuk menghitung harga per treatment
  const calculateTreatmentPrice = (treatment) => {
    const price = Number(treatment.treatment?.price || 0);
    const discount = treatment.discount;
    
    // ✅ Use calculateFinalPrice for consistency
    return calculateFinalPrice(price, discount, null);
  };

  return (
    <div className="space-y-2">
      {cart.map((t, idx) => {
        const treatmentPrice = calculateTreatmentPrice(t);
        
        return (
          <div
            key={t.id}
            className="flex items-center gap-2 bg-telaga-50 rounded-xl p-2 cursor-pointer hover:bg-telaga-100 transition-all"
            onClick={e => {
              // Jangan trigger edit jika klik tombol hapus
              if (e.target.closest('button')) return;
              onEdit && onEdit(idx);
            }}
            tabIndex={0}
            role="button"
            aria-label={`Edit item untuk ${t.treatment.name}`}
          >
            <span className="font-montserrat font-semibold text-telaga-800 flex-1">{t.treatment.name} ({t.qty} item)</span>
            <span className="text-xs text-gray-500">{t.process_time}</span>
            {t.discount > 0 && <span className="text-green-600">Diskon: {t.discount}%</span>}
            <span className="text-sm font-semibold text-green-700">Rp {treatmentPrice.toLocaleString()}</span>
            <button
              onClick={e => { e.stopPropagation(); onRemove(idx); }}
              className="p-2 rounded-full bg-white border border-red-200 text-red-500 hover:bg-red-100 shadow-sm transition-all"
              aria-label="Hapus Layanan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default TreatmentCart; 