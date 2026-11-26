import React from 'react';
import { DollarSign } from 'lucide-react';

const QuickOrderTotal = ({ total }) => {
  const safeTotal = (typeof total === 'number' && !isNaN(total)) ? total : 0;
  return (
    <div className="border-t pt-4">
      <div className="flex justify-between items-center text-lg font-semibold">
        <span className="font-montserrat tracking-wide text-blue-700">Total</span>
        <span className="flex items-center gap-1 font-montserrat font-bold text-blue-700">
          {/* <DollarSign className="w-4 h-4" /> */}
          Rp {safeTotal.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default QuickOrderTotal;
