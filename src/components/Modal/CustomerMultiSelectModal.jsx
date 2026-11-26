import { useState, useEffect } from 'react';
import { Search, X, CheckCircle } from 'lucide-react';
import instance from '../../config/api';

const CustomerMultiSelectModal = ({ isOpen, onClose, onConfirm, selectedCustomerIds = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set(selectedCustomerIds));
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(selectedCustomerIds));
      fetchCustomers(1, false);
    }
  }, [isOpen, selectedCustomerIds]);

  const fetchCustomers = async (page = 1, append = false) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {
        page,
        limit: 20,
        search: searchTerm || undefined
      };

      const { data } = await instance.get('/customers', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        const newCustomers = data.data.customers || [];
        if (append) {
          setCustomers(prev => [...prev, ...newCustomers]);
        } else {
          setCustomers(newCustomers);
        }
        setHasMore(data.data.pagination?.hasNextPage || false);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      alert('Gagal memuat data customer');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCustomers(1, false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleSelect = (customerId) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
      } else {
        newSet.add(customerId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === customers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(customers.map(c => c.id)));
    }
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedIds));
    onClose();
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchCustomers(currentPage + 1, true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 font-montserrat">
            Pilih Customer
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari customer (nama/telepon)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-montserrat"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold font-montserrat hover:bg-orange-600 transition-colors"
            >
              Cari
            </button>
          </div>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && customers.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600 font-montserrat">Memuat customer...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-600 font-montserrat">Tidak ada customer ditemukan</p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-montserrat underline"
                >
                  {selectedIds.size === customers.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </button>
                <span className="text-sm text-gray-600 font-montserrat">
                  {selectedIds.size} customer dipilih
                </span>
              </div>
              <div className="space-y-2">
                {customers.map(customer => (
                  <div
                    key={customer.id}
                    onClick={() => toggleSelect(customer.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors flex items-center gap-3 ${
                      selectedIds.has(customer.id)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedIds.has(customer.id)
                        ? 'bg-orange-500 border-orange-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedIds.has(customer.id) && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 font-montserrat">
                        {customer.name || 'Nama tidak tersedia'}
                      </p>
                      <p className="text-sm text-gray-600 font-montserrat">
                        {customer.phone || 'No HP tidak tersedia'}
                      </p>
                      {customer.points !== undefined && (
                        <p className="text-xs text-gray-500 font-montserrat mt-1">
                          Poin: {customer.points || 0}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {hasMore && (
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="w-full mt-4 py-2 text-sm text-orange-600 hover:text-orange-700 font-montserrat border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Memuat...' : 'Muat Lebih Banyak'}
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-600 font-montserrat">
            {selectedIds.size} customer dipilih
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold font-montserrat hover:bg-gray-300 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold font-montserrat hover:bg-orange-600 transition-colors"
            >
              Pilih ({selectedIds.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerMultiSelectModal;

