import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CheckCircle, Crown, UserRound, UserPlus, ArrowLeft } from 'lucide-react';
import { getMembershipBadgeColor } from '../../utils/labelFormatter';
import { validateFullPhone } from '../../utils/phoneValidation';
import PhoneInputWithCountry from '../PhoneInput/PhoneInputWithCountry';
import { WALK_IN_CUSTOMER_NAME } from './QuickOrderCustomerSelect';

const QuickOrderCustomerSearchModal = ({
  customers = [], searchTerm, setSearchTerm, onSelect, onClose, loading = false, onSearch
}) => {
  const [mode, setMode] = useState('search'); // 'search' | 'add'
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  const [selectedId, setSelectedId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef(null);

  // Debounce: auto search 2 detik setelah user berhenti ngetik
  useEffect(() => {
    if (!searchTerm.trim()) return;

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        if (onSearch) await onSearch(searchTerm);
      } finally {
        setIsSearching(false);
      }
    }, 2000);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
    };
  }, [searchTerm]);

  const filtered = (customers || []).filter((customer) => {
    const name = customer.name || customer.customer_name || '';
    const phone = customer.phone || customer.phone_number || '';
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) || phone.includes(searchTerm)
    );
  });

  const handleSelect = (customer) => {
    setSelectedId(customer.id);
    setTimeout(() => {
      onSelect(customer);
    }, 150);
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleAddMember = () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) return;

    const phoneError = validateFullPhone(newCustomer.phone);
    if (phoneError) {
      alert(phoneError);
      return;
    }

    onSelect({
      name: newCustomer.name.trim(),
      phone: newCustomer.phone.trim(),
    });
    setNewCustomer({ name: '', phone: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-telaga-950/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-3xl ring-2 ring-telaga-100 w-full max-w-md shadow-xl shadow-telaga-900/10 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-telaga-600 to-senja-500 flex-shrink-0">
          <h3 className="text-base font-semibold text-white tracking-wide font-montserrat flex items-center gap-2">
            {mode === 'add' ? <UserPlus className="w-4 h-4" /> : <UserRound className="w-4 h-4" />}
            {mode === 'add' ? 'Tambah Member' : 'Pilih Pelanggan'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto p-4 bg-krem"
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
        >
          {mode === 'search' ? (
            <>
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-telaga-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Cari nama atau no. HP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-telaga-100 rounded-xl text-sm font-montserrat text-telaga-950 placeholder:text-telaga-900/40 focus:outline-none focus:ring-2 focus:ring-telaga-400"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={!searchTerm.trim() || isSearching}
                  className="px-4 py-2.5 bg-telaga-600 text-white rounded-xl hover:bg-telaga-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-montserrat text-sm font-semibold"
                >
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    'Cari'
                  )}
                </button>
              </div>

              <button
                onClick={() => setMode('add')}
                className="w-full mb-3 py-2.5 rounded-xl border-2 border-dashed border-telaga-200 text-telaga-700 bg-white hover:bg-telaga-50 transition-colors font-montserrat text-sm font-semibold inline-flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                Tambah Member Baru
              </button>

              <div className="space-y-2">
                {loading ? (
                  <div className="text-center text-telaga-900/50 py-6 text-sm font-montserrat">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-telaga-500 mx-auto mb-2" />
                    Memuat pelanggan...
                  </div>
                ) : filtered.length > 0 ? (
                  filtered.map((customer) => {
                    const isGuestRow = customer.name === WALK_IN_CUSTOMER_NAME;
                    const active = selectedId === customer.id;
                    return (
                      <div
                        key={customer.id}
                        onClick={() => handleSelect(customer)}
                        className={`p-3 rounded-xl cursor-pointer transition-colors bg-white border flex items-center gap-2 ${
                          active
                            ? 'border-telaga-500 ring-2 ring-telaga-100'
                            : 'border-telaga-100 hover:border-telaga-300 hover:bg-telaga-50/40'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-telaga-950 font-montserrat text-sm truncate">
                              {customer.name || customer.customer_name || 'Tanpa nama'}
                            </span>
                            {isGuestRow && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-telaga-50 text-telaga-700 border border-telaga-100">
                                Walk-in
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-telaga-900/60 font-montserrat mt-0.5">
                            {customer.phone || customer.phone_number || 'Tanpa no. HP'}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          {customer.current_membership?.status === 'active' && (
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${getMembershipBadgeColor(
                                customer.current_membership.membership?.name
                              )}`}
                            >
                              <Crown className="w-2.5 h-2.5" />
                              {customer.current_membership.membership?.name}
                            </span>
                          )}
                          <CheckCircle
                            className={`w-4 h-4 ${active ? 'text-telaga-600' : 'text-telaga-200'}`}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-telaga-900/50 text-sm py-6 font-montserrat">
                    Pelanggan tidak ditemukan.
                    <br />
                    <button
                      onClick={() => setMode('add')}
                      className="mt-2 inline-flex items-center gap-1 px-3 py-2 bg-telaga-600 text-white rounded-xl text-xs font-semibold hover:bg-telaga-700 transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Tambah member baru
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => setMode('search')}
                className="inline-flex items-center gap-1 text-xs font-semibold font-montserrat text-telaga-700 hover:text-telaga-900"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke pencarian
              </button>

              <p className="text-xs text-telaga-900/60 font-montserrat">
                Cukup nama dan no. HP. Data member dipakai untuk riwayat & poin kunjungan.
              </p>

              <div>
                <label className="text-xs font-semibold text-telaga-900/60 font-montserrat mb-1 block">
                  Nama
                </label>
                <input
                  type="text"
                  placeholder="Nama member"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-telaga-100 bg-white rounded-xl px-3 py-2.5 text-sm font-montserrat text-telaga-950 focus:outline-none focus:ring-2 focus:ring-telaga-400"
                />
              </div>

              <PhoneInputWithCountry
                value={newCustomer.phone}
                onChange={(v) => setNewCustomer((p) => ({ ...p, phone: v }))}
                label="No. HP"
              />

              <button
                onClick={handleAddMember}
                disabled={!newCustomer.name.trim() || !newCustomer.phone.trim()}
                className="w-full py-2.5 bg-telaga-600 text-white rounded-xl hover:bg-telaga-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-montserrat text-sm font-semibold inline-flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Simpan & Pakai Member
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickOrderCustomerSearchModal;
