import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedButton from "../../components/Design/AnimatedButton";
import instance from "../../config/api";
import CreatePaymentMethodModal from "./components/CreatePaymentMethodModal";
import EditPaymentMethodModal from "./components/EditPaymentMethodModal";
import { FaRegCheckCircle } from "react-icons/fa";

const PaymentMethodManagement = () => {
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const response = await instance.get('/payment-methods');
      if (response.data.success) {
        setPaymentMethods(response.data.data);
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch payment methods');
      }
    } catch (error) {
      console.error('❌ Error fetching payment methods:', error);
      alert('Gagal memuat data payment methods. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Load payment methods on component mount
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  // Handle delete payment method
  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus payment method ini?')) {
      return;
    }

    try {
      const response = await instance.delete(`/payment-methods/${id}`);
      if (response.data.success) {
        alert('Payment method berhasil dihapus');
        fetchPaymentMethods();
      } else {
        throw new Error(response.data.error?.message || 'Failed to delete payment method');
      }
    } catch (error) {
      console.error('❌ Error deleting payment method:', error);
      alert('Gagal menghapus payment method. Silakan coba lagi.');
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (paymentMethod) => {
    try {
      const response = await instance.put(`/payment-methods/${paymentMethod.id}`, {
        is_active: !paymentMethod.is_active
      });
      if (response.data.success) {
        alert(`Payment method berhasil ${paymentMethod.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
        fetchPaymentMethods();
      } else {
        throw new Error(response.data.error?.message || 'Failed to update payment method');
      }
    } catch (error) {
      console.error('❌ Error updating payment method:', error);
      alert('Gagal mengupdate payment method. Silakan coba lagi.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTypeColor = (type) => {
    const colors = {
      cash: 'bg-green-100 text-green-800',
      bank: 'bg-blue-100 text-blue-800',
      qris: 'bg-purple-100 text-purple-800',
      ewallet: 'bg-orange-100 text-orange-800',
      debit: 'bg-red-100 text-red-800',
      credit: 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/superapp-dashboard')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="Kembali"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-semibold font-montserrat text-gray-900">Payment Method Management</h1>
                <p className="text-sm text-gray-600 font-montserrat">Kelola metode pembayaran sistem</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AnimatedButton
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-montserrat text-lg shadow-lg"
              >
                +
              </AnimatedButton>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6 pb-8">
          {/* Payment Methods List */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900 font-montserrat">Daftar Payment Methods</h2>
            </div>
            
            {loading ? (
              <div className="p-8 text-center">
                <div className="text-gray-500 font-montserrat">⏳ Memuat data...</div>
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-500 font-montserrat">📝 Belum ada payment method</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-gray-600">{method.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 font-montserrat text-sm truncate">{method.name}</h3>
                          <p className="text-xs text-gray-500 font-montserrat truncate">{method.code}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedPaymentMethod(method);
                            setShowEditModal(true);
                          }}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all duration-200"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleActive(method)}
                          className={`p-1.5 rounded text-xs  transition-all duration-200 ${
                            method.is_active 
                              ? 'text-red-600 hover:text-red-800 hover:bg-red-50' 
                              : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                          }`}
                          title={method.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {method.is_active ? (
                            'Aktif'
                          ) : (
                            'Nonaktif'
                          )}
                        </button>
                        {/* <button
                          onClick={() => handleDelete(method.id)}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all duration-200"
                          title="Hapus"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button> */}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(method.type)}`}>
                        {method.type.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${method.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {method.is_active ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreatePaymentMethodModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchPaymentMethods();
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPaymentMethod && (
        <EditPaymentMethodModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPaymentMethod(null);
          }}
          paymentMethod={selectedPaymentMethod}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedPaymentMethod(null);
            fetchPaymentMethods();
          }}
        />
      )}
    </div>
  );
};

export default PaymentMethodManagement;
