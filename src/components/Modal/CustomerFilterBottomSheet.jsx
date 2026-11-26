import React, { useState, useEffect } from 'react';
import { X, Search, Filter, RotateCcw, MapPin, User, ArrowUpDown, ChevronDown, Check } from 'lucide-react';

const CustomerFilterBottomSheet = ({
  isOpen,
  onClose,
  // Initial values
  searchTerm: initialSearchTerm,
  membershipFilter: initialMembershipFilter,
  sortBy: initialSortBy,
  selectedBranchId: initialSelectedBranchId,
  branches = [],
  userRole,
  userBranchName,
  showBranchFilter = false,
  // Callbacks
  onApplyFilter,
  onResetFilter,
}) => {
  // Local state for filter values
  const [filterState, setFilterState] = useState({
    searchTerm: '',
    membershipFilter: 'all',
    sortBy: 'newest',
    selectedBranchId: null,
  });

  // Dropdown states
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showMembershipDropdown, setShowMembershipDropdown] = useState(false);

  // Sync props saat bottom sheet dibuka
  useEffect(() => {
    if (isOpen) {
      setFilterState({
        searchTerm: initialSearchTerm || '',
        membershipFilter: initialMembershipFilter || 'all',
        sortBy: initialSortBy || 'newest',
        selectedBranchId: initialSelectedBranchId || null,
      });
    }
  }, [isOpen]); // Hanya depend on isOpen untuk avoid loop

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!isOpen) {
      setShowBranchDropdown(false);
      setShowMembershipDropdown(false);
    }
  }, [isOpen]);

  const handleApply = () => {
    if (onApplyFilter) {
      // Jika search aktif, reset filter lain ke default
      if (filterState.searchTerm && filterState.searchTerm.trim()) {
        onApplyFilter({
          searchTerm: filterState.searchTerm.trim(),
          membershipFilter: 'all',
          sortBy: 'newest',
          selectedBranchId: null,
        });
      } else {
        onApplyFilter({
          searchTerm: filterState.searchTerm,
          membershipFilter: filterState.membershipFilter,
          sortBy: filterState.sortBy,
          selectedBranchId: filterState.selectedBranchId,
        });
      }
    }
    onClose();
  };

  const handleReset = () => {
    setFilterState({
      searchTerm: '',
      membershipFilter: 'all',
      sortBy: 'newest',
      selectedBranchId: null,
    });
    if (onResetFilter) {
      onResetFilter();
    }
  };

  const updateFilterState = (key, value) => {
    setFilterState(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (!isOpen) return null;

  // Check if search is active
  const isSearchActive = filterState.searchTerm && filterState.searchTerm.trim().length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[85vh] flex flex-col animate-slide-up">
        {/* Handle Bar */}
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-800 font-montserrat">Filter Pelanggan</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Search Section */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
              Cari Pelanggan
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari Nama, No HP, Alamat"
                value={filterState.searchTerm}
                onChange={(e) => updateFilterState('searchTerm', e.target.value)}
                className="w-full pl-12 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm bg-gray-50 font-medium"
              />
              {filterState.searchTerm && (
                <button
                  onClick={() => updateFilterState('searchTerm', '')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Branch Filter Section - Only for superadmin */}
          {showBranchFilter && userRole && !['admin', 'employee'].includes(userRole) && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                Filter Outlet
                {isSearchActive && (
                  <span className="ml-2 text-xs text-gray-500 font-normal">(Dinonaktifkan saat pencarian aktif)</span>
                )}
              </label>
              <div className="relative">
                <button
                  onClick={() => {
                    if (!isSearchActive) {
                      setShowMembershipDropdown(false);
                      setShowBranchDropdown(!showBranchDropdown);
                    }
                  }}
                  disabled={isSearchActive}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-3 border-2 rounded-xl transition-colors text-left ${
                    isSearchActive
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className={`w-4 h-4 ${isSearchActive ? 'text-gray-400' : 'text-gray-600'}`} />
                    <span className={`text-sm font-medium ${isSearchActive ? 'text-gray-400' : 'text-gray-800'}`}>
                      {filterState.selectedBranchId
                        ? branches.find(b => String(b.id) === String(filterState.selectedBranchId))?.name || 'Semua Outlet'
                        : 'Semua Outlet'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 ${isSearchActive ? 'text-gray-400' : 'text-gray-600'} transition-transform ${showBranchDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showBranchDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-[1002] max-h-60 overflow-y-auto">
                    <button
                      onClick={() => {
                        updateFilterState('selectedBranchId', null);
                        setShowBranchDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                        !filterState.selectedBranchId ? 'bg-blue-50' : ''
                      }`}
                    >
                      <span className={`text-sm font-medium ${!filterState.selectedBranchId ? 'text-blue-600' : 'text-gray-800'}`}>
                        Semua Outlet
                      </span>
                      {!filterState.selectedBranchId && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                    {branches.map((branch) => {
                      const branchValue = String(branch.id);
                      const isSelected = String(filterState.selectedBranchId) === branchValue;
                      return (
                        <button
                          key={branch.id}
                          onClick={() => {
                            updateFilterState('selectedBranchId', branchValue);
                            setShowBranchDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-50 transition-colors border-t border-gray-100 ${
                            isSelected ? 'bg-blue-50' : ''
                          }`}
                        >
                          <span className={`text-sm font-medium ${isSelected ? 'text-blue-600' : 'text-gray-800'}`}>
                            {branch.name}
                          </span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Branch Info for Admin/Employee */}
          {userRole && ['admin', 'employee'].includes(userRole) && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
                Outlet
              </label>
              <div className="flex items-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">{userBranchName || 'Loading...'}</span>
              </div>
            </div>
          )}

          {/* Membership Filter Section */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
              Filter Membership
              {isSearchActive && (
                <span className="ml-2 text-xs text-gray-500 font-normal">(Dinonaktifkan saat pencarian aktif)</span>
              )}
            </label>
            <div className="relative">
              <button
                onClick={() => {
                  if (!isSearchActive) {
                    setShowBranchDropdown(false);
                    setShowMembershipDropdown(!showMembershipDropdown);
                  }
                }}
                disabled={isSearchActive}
                className={`w-full flex items-center justify-between gap-2 px-4 py-3 border-2 rounded-xl transition-colors text-left ${
                  isSearchActive
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className={`w-4 h-4 ${isSearchActive ? 'text-gray-400' : 'text-gray-600'}`} />
                  <span className={`text-sm font-medium ${isSearchActive ? 'text-gray-400' : 'text-gray-800'}`}>
                    {filterState.membershipFilter === 'all' && 'Semua'}
                    {filterState.membershipFilter === 'with_membership' && 'Member'}
                    {filterState.membershipFilter === 'without_membership' && 'Non-Member'}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 ${isSearchActive ? 'text-gray-400' : 'text-gray-600'} transition-transform ${showMembershipDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showMembershipDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-[1001] max-h-60 overflow-y-auto">
                  <button
                    onClick={() => {
                      updateFilterState('membershipFilter', 'all');
                      setShowMembershipDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                      filterState.membershipFilter === 'all' ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span className={`text-sm font-medium ${filterState.membershipFilter === 'all' ? 'text-blue-600' : 'text-gray-800'}`}>
                      Semua
                    </span>
                    {filterState.membershipFilter === 'all' && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      updateFilterState('membershipFilter', 'with_membership');
                      setShowMembershipDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-50 transition-colors border-t border-gray-100 ${
                      filterState.membershipFilter === 'with_membership' ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span className={`text-sm font-medium ${filterState.membershipFilter === 'with_membership' ? 'text-blue-600' : 'text-gray-800'}`}>
                      Member
                    </span>
                    {filterState.membershipFilter === 'with_membership' && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      updateFilterState('membershipFilter', 'without_membership');
                      setShowMembershipDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-50 transition-colors border-t border-gray-100 ${
                      filterState.membershipFilter === 'without_membership' ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span className={`text-sm font-medium ${filterState.membershipFilter === 'without_membership' ? 'text-blue-600' : 'text-gray-800'}`}>
                      Non-Member
                    </span>
                    {filterState.membershipFilter === 'without_membership' && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sort Section */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">
              Urutkan
              {isSearchActive && (
                <span className="ml-2 text-xs text-gray-500 font-normal">(Dinonaktifkan saat pencarian aktif)</span>
              )}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (!isSearchActive) {
                    updateFilterState('sortBy', 'newest');
                  }
                }}
                disabled={isSearchActive}
                className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-xl transition-all ${
                  isSearchActive
                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    : filterState.sortBy === 'newest'
                    ? 'bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ArrowUpDown className={`w-4 h-4 ${isSearchActive ? 'text-gray-400' : filterState.sortBy === 'newest' ? 'text-blue-600' : 'text-gray-600'}`} />
                <span className={`text-sm font-medium ${filterState.sortBy === 'newest' && !isSearchActive ? 'font-semibold' : ''}`}>
                  Customer Baru
                </span>
              </button>
              <button
                onClick={() => {
                  if (!isSearchActive) {
                    updateFilterState('sortBy', 'most_services');
                  }
                }}
                disabled={isSearchActive}
                className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-xl transition-all ${
                  isSearchActive
                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    : filterState.sortBy === 'most_services'
                    ? 'bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ArrowUpDown className={`w-4 h-4 ${isSearchActive ? 'text-gray-400' : filterState.sortBy === 'most_services' ? 'text-blue-600' : 'text-gray-600'}`} />
                <span className={`text-sm font-medium ${filterState.sortBy === 'most_services' ? 'font-semibold' : ''}`}>
                  Layanan Terbanyak
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-white rounded-b-3xl">
          <button
            onClick={handleReset}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            Terapkan Filter
          </button>
        </div>
      </div>
    </>
  );
};

export default CustomerFilterBottomSheet;
