import React from 'react';
import { Plus, Search } from 'lucide-react';

const CustomerSelector = ({
  customers,
  selectedCustomer,
  onSelectCustomer,
  onAddCustomer,
  searchTerm,
  onSearchTermChange,
  disabled = false
}) => (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold font-montserrat font-normal text-gray-800 tracking-wide mb-2">Pilih Pelanggan</h2>
    {/* Customer Terpilih di atas */}
    {selectedCustomer && (
      <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-xl font-montserrat flex flex-col items-start animate-fade-in">
        <div className="font-semibold text-green-800">Pelanggan Terpilih:</div>
        <div className="text-green-700 font-montserrat">{selectedCustomer.name}</div>
        <div className="text-xs text-green-600 font-montserrat">{selectedCustomer.phone}</div>
      </div>
    )}
    {/* Search Customer */}
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="text"
        placeholder="Cari pelanggan..."
        value={searchTerm}
        onChange={e => onSearchTermChange(e.target.value)}
        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-telaga-400 focus:border-transparent text-sm font-montserrat transition-all ${
          disabled 
            ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
            : 'border-gray-200 focus:border-transparent'
        }`}
        disabled={disabled}
      />
    </div>
    {/* Customer List */}
    <div className="max-h-80 overflow-y-auto space-y-2 p-4">
      {customers.map(customer => (
        <div
          key={customer.id}
          onClick={() => !disabled && onSelectCustomer(customer)}
          className={`p-4 border-2 rounded-xl transition-all shadow-sm flex flex-col gap-1 font-montserrat bg-white ${
            disabled 
              ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
              : 'cursor-pointer hover:shadow-lg hover:border-telaga-400 active:scale-[0.97] active:ring-2 active:ring-telaga-200 focus:outline-none focus:ring-2 focus:ring-telaga-400'
          } ${
            selectedCustomer?.id === customer.id
              ? 'border-telaga-500 bg-telaga-50 ring-2 ring-telaga-300 scale-105' : 'border-gray-200'
          }`}
          tabIndex={0}
          role="button"
          aria-pressed={selectedCustomer?.id === customer.id}
        >
          <div className="font-semibold text-gray-800 text-base font-montserrat">{customer.name}</div>
          <div className="text-xs text-gray-500 font-montserrat">{customer.phone}</div>
          <div className="text-xs text-gray-400 font-montserrat">{customer.address}</div>
        </div>
      ))}
    </div>
    {/* Add New Customer Button */}
    <button
      onClick={onAddCustomer}
      disabled={disabled}
      className={`w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed rounded-xl transition-all font-montserrat text-base font-semibold ${
        disabled 
          ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
          : 'border-telaga-300 text-telaga-600 hover:bg-telaga-50 hover:border-telaga-400'
      }`}
    >
      <Plus className="w-6 h-6" />
      Tambah Pelanggan Baru
    </button>
  </div>
);

export default CustomerSelector; 