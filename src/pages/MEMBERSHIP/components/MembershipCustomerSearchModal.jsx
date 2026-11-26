import React, { useState } from 'react';
import { Search, X, Plus, UserPlus, CheckCircle } from 'lucide-react';
import { validatePhoneNumber } from '../../../utils/phoneValidation';

const MembershipCustomerSearchModal = ({
  customers = [], 
  searchTerm, 
  setSearchTerm, 
  onSelect, 
  onClose, 
  loading = false, 
  onSearch
}) => {
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'add'
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '', gmaps: '' });
  const [selectedId, setSelectedId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const filtered = (customers || []).filter(customer => {
    const name = customer.name || customer.customer_name || '';
    const phone = customer.phone || customer.phone_number || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           phone.includes(searchTerm);
  });

  const handleSelect = (customer) => {
    setSelectedId(customer.id);
    setTimeout(() => {
      onSelect(customer);
    }, 200); // beri efek highlight sebentar
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    try {
      await onSearch(searchTerm);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) return;
    
    // Validate phone number
    const phoneValidation = validatePhoneNumber(newCustomer.phone);
    if (!phoneValidation.isValid) {
      alert(phoneValidation.error);
      return;
    }
    
    const newCust = {
      id: Date.now(),
      ...newCustomer
    };
    setSelectedId(newCust.id);
    onSelect(newCust);
    setNewCustomer({ name: '', phone: '', address: '', gmaps: '' });
    onClose(); // Tutup modal langsung setelah customer berhasil ditambahkan
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!onClose) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 sm:p-8 z-50 ${
        onClose ? '' : 'hidden'
      }`}
      style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(2rem, env(safe-area-inset-left))',
        paddingRight: 'max(2rem, env(safe-area-inset-right))'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-blue-100 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#5096FC] to-[#7BD1FD] rounded-t-2xl flex-shrink-0 border-b-2 border-blue-200">
          <h3 className="text-lg font-semibold text-white tracking-wide font-montserrat flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Pilih Pelanggan
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-blue-400 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        
        <div className="px-4 py-4 flex-shrink-0">
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm font-montserrat transition-all ${
                activeTab === 'search'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Cari
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm font-montserrat transition-all ${
                activeTab === 'add'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Tambah
            </button>
          </div>

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Cari nama atau nomor HP..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchTerm.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-montserrat"
                >
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Cari'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Add Tab */}
          {activeTab === 'add' && (
            <div className="space-y-3">
              <input
                type="text"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                placeholder="Nama *"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat"
              />
              <input
                type="text"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                placeholder="Nomor HP *"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat"
              />
              <input
                type="text"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                placeholder="Alamat (Opsional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-montserrat"
              />
              <button
                onClick={handleAddCustomer}
                disabled={!newCustomer.name || !newCustomer.phone}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-montserrat"
              >
                Tambah Customer
              </button>
            </div>
          )}
        </div>

        {/* Customer List - Only show in search tab */}
        {activeTab === 'search' && (
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 font-montserrat">
                  {searchTerm ? 'Tidak ada customer ditemukan' : 'Cari atau tambah customer baru'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((customer) => {
                  const isSelected = selectedId === customer.id;
                  return (
                    <button
                      key={customer.id}
                      onClick={() => handleSelect(customer)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 font-montserrat truncate">
                              {customer.name || customer.customer_name}
                            </h4>
                            {isSelected && (
                              <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 font-montserrat truncate">
                            {customer.phone || customer.phone_number || '-'}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MembershipCustomerSearchModal;

