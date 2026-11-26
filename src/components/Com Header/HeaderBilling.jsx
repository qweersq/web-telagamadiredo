import React from 'react';
import { ArrowLeft } from 'lucide-react';

const HeaderBilling = ({ title, description, onBack }) => {
  return (
    <div className="bg-white/95 backdrop-blur-md border-b border-telaga-100 shadow-sm shadow-telaga-900/5">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Back button and title */}
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-telaga-50 hover:bg-telaga-100 text-telaga-700 transition-all duration-200 hover:shadow-md"
                title="Kembali"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            
            <div>
              <h1 className="text-xl font-bold text-telaga-950 font-montserrat">
                {title}
              </h1>
              <p className="text-sm text-telaga-900/60 font-montserrat">
                {description}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HeaderBilling;
