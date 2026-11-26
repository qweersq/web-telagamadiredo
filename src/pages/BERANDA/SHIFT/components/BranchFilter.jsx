import React, { useState } from 'react';
import { Building2, ChevronDown } from 'lucide-react';

const BranchFilter = ({ branches, selectedBranch, onBranchChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedBranchData = branches.find(b => b.id === selectedBranch);

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-telaga-100 bg-krem px-3 py-2.5 text-left font-montserrat transition-colors hover:bg-telaga-50 focus:border-telaga-400 focus:outline-none focus:ring-2 focus:ring-telaga-400/25"
      >
        <div className="flex items-center space-x-2">
          <Building2 className="h-3.5 w-3.5 text-telaga-700" />
          <span className="text-sm font-semibold text-telaga-950">
            {selectedBranchData ? selectedBranchData.name : 'Pilih Cabang'}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-telaga-900/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-telaga-100 bg-white shadow-xl">
          <div className="py-2">
            {branches.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-telaga-900/45">
                Tidak ada cabang aktif
              </div>
            )}
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => {
                  onBranchChange(branch.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-left font-montserrat text-sm transition-colors ${
                  selectedBranch === branch.id ? 'bg-telaga-50 text-telaga-800' : 'text-telaga-900/70 hover:bg-krem'
                }`}
              >
                <Building2 className="h-3.5 w-3.5 text-telaga-700" />
                <div>
                  <div className="truncate text-xs font-semibold">{branch.name}</div>
                  <div className="truncate text-[11px] text-telaga-900/45">{branch.address}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchFilter;
