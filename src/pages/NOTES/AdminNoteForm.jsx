import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Search, X, Eye } from 'lucide-react';
import AnimatedButton from '../../components/Design/AnimatedButton';
import { getUserProfile } from '../../utils/userProfileHelper';
import { searchCustomers } from '../ORDER/api/orderApi';
import { formatCurrency, formatDate } from '../../utils/labelFormatter';
import instance from '../../config/api';

const AdminNoteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [error, setError] = useState('');
  const [branchId, setBranchId] = useState(null);

  // Customer search state
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const customerDropdownRef = useRef(null);

  // Order search state
  const [orderSearch, setOrderSearch] = useState('');
  const [orderResults, setOrderResults] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  const [orderSearchLoading, setOrderSearchLoading] = useState(false);
  const orderDropdownRef = useRef(null);

  // Customer detail modal state
  const [showCustomerDetailModal, setShowCustomerDetailModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    due_date: '',
    customer_id: '',
    order_id: ''
  });

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
      if (orderDropdownRef.current && !orderDropdownRef.current.contains(event.target)) {
        setShowOrderDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profile = await getUserProfile();
        if (profile?.branch?.id) {
          setBranchId(profile.branch.id);

          // If edit mode, fetch note data
          if (isEdit && id) {
            const response = await instance.get(`/admin-notes/${id}`, {
              params: {
                branch_id: profile.branch.id
              }
            });

            if (response.data?.success && response.data.data) {
              const note = response.data.data;
              setFormData({
                title: note.title || '',
                content: note.content || '',
                priority: note.priority || 'normal',
                due_date: note.due_date ? new Date(note.due_date).toISOString().split('T')[0] : '',
                customer_id: note.customer_id ? note.customer_id.toString() : '',
                order_id: note.order_id ? note.order_id.toString() : ''
              });

              // Set selected customer if exists
              if (note.customer) {
                setSelectedCustomer(note.customer);
                setCustomerSearch(note.customer.name || '');
              }

              // Set selected order if exists
              if (note.order) {
                setSelectedOrder(note.order);
                setOrderSearch(`Order #${note.order.id}` || '');
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Gagal memuat data');
      } finally {
        setFormLoading(false);
      }
    };

    fetchData();
  }, [id, isEdit]);

  // Customer search function
  const handleCustomerSearch = async () => {
    if (customerSearch.trim().length < 2) {
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      return;
    }

    try {
      setCustomerSearchLoading(true);
      const results = await searchCustomers(customerSearch.trim());
      setCustomerResults(results || []);
      setShowCustomerDropdown(true);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomerResults([]);
      setShowCustomerDropdown(false);
    } finally {
      setCustomerSearchLoading(false);
    }
  };

  // Order search function
  const handleOrderSearch = async () => {
    if (orderSearch.trim().length < 2) {
      setOrderResults([]);
      setShowOrderDropdown(false);
      return;
    }

    try {
      setOrderSearchLoading(true);
      const userData = await getUserProfile();
      const response = await instance.get('/orders-new-raw', {
        params: {
          page: 1,
          pageSize: 10,
          filter: JSON.stringify({
            search: orderSearch.trim()
          }),
          tenant_id: userData?.tenant_id,
          branch_id: userData?.branch_id || branchId
        }
      });

      if (response.data?.data?.orders) {
        setOrderResults(response.data.data.orders || []);
        setShowOrderDropdown(true);
      } else {
        setOrderResults([]);
        setShowOrderDropdown(true);
      }
    } catch (error) {
      console.error('Error searching orders:', error);
      setOrderResults([]);
      setShowOrderDropdown(false);
    } finally {
      setOrderSearchLoading(false);
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name || '');
    setFormData(prev => ({
      ...prev,
      customer_id: customer.id.toString()
    }));
    setShowCustomerDropdown(false);
  };

  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    const customerName = order.customer?.name || 'Tidak ada customer';
    setOrderSearch(`Order #${order.id} - ${customerName}`);
    setFormData(prev => ({
      ...prev,
      order_id: order.id.toString()
    }));
    setShowOrderDropdown(false);
  };

  const handleCustomerClear = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setFormData(prev => ({
      ...prev,
      customer_id: ''
    }));
  };

  const handleOrderClear = () => {
    setSelectedOrder(null);
    setOrderSearch('');
    setFormData(prev => ({
      ...prev,
      order_id: ''
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.title.trim()) {
      setError('Judul wajib diisi');
      return;
    }

    if (formData.title.trim().length > 100) {
      setError('Judul maksimal 100 karakter');
      return;
    }

    if (!formData.content.trim()) {
      setError('Isi catatan wajib diisi');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        priority: formData.priority,
        due_date: formData.due_date || null,
        customer_id: formData.customer_id ? parseInt(formData.customer_id) : null,
        order_id: formData.order_id ? parseInt(formData.order_id) : null,
        branch_id: branchId
      };

      if (isEdit) {
        await instance.put(`/admin-notes/${id}`, payload);
      } else {
        await instance.post('/admin-notes', payload);
      }

      navigate('/admin-notes');
    } catch (error) {
      console.error('Error saving note:', error);
      setError(error.response?.data?.error?.message || 'Gagal menyimpan catatan');
    } finally {
      setLoading(false);
    }
  };

  if (formLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden font-montserrat bg-gray-50">
      {/* Header */}
      <header 
        className="bg-white border-b border-gray-300 px-4 md:px-10 py-4 relative"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin-notes')}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Kembali"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-[#2C2C2C]">
              {isEdit ? 'Edit Catatan' : 'Tambah Catatan'}
            </h1>
          </div>
          <AnimatedButton
            type="submit"
            form="note-form"
            disabled={loading}
            variant="blue"
            className="px-4 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            <span>Simpan</span>
          </AnimatedButton>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="mx-auto px-4 md:px-10 pt-6 pb-6">
          <div className="max-w-4xl mx-auto">
            <form 
              id="note-form"
              onSubmit={handleSubmit} 
              className="relative bg-white rounded-lg shadow-sm p-8 overflow-hidden"
            >
              {/* Form Content */}
              <div className="relative">
                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Title */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#2C2C2C] mb-2" style={{
                    borderBottom: '1px solid #C0C0C0',
                    paddingBottom: '2px',
                    display: 'inline-block'
                  }}>
                    Judul <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    placeholder="Masukkan judul catatan"
                    required
                    maxLength={100}
                    style={{ marginTop: '0.5rem' }}
                  />
                  <div className="mt-1 text-xs text-gray-500 text-right">
                    {formData.title.length}/100 karakter
                  </div>
                </div>

                {/* Content */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#2C2C2C] mb-2" style={{
                    borderBottom: '1px solid #C0C0C0',
                    paddingBottom: '2px',
                    display: 'inline-block'
                  }}>
                    Isi Catatan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    rows={10}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white resize-none"
                    placeholder="Masukkan isi catatan"
                    required
                    style={{ 
                      marginTop: '0.5rem',
                      lineHeight: '24px',
                      backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, rgba(232, 232, 232, 0.3) 23px, rgba(232, 232, 232, 0.3) 24px)',
                      backgroundPosition: '0 0'
                    }}
                  />
                </div>

                {/* Priority */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#2C2C2C] mb-2" style={{
                    borderBottom: '1px solid #C0C0C0',
                    paddingBottom: '2px',
                    display: 'inline-block'
                  }}>
                    Prioritas
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    style={{ marginTop: '0.5rem' }}
                  >
                    <option value="low">Tidak Urgent</option>
                    <option value="normal">Normal</option>
                    <option value="high">Urgent</option>
                  </select>
                </div>

                {/* Due Date - Hidden */}
                {false && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-[#2C2C2C] mb-2" style={{
                      borderBottom: '1px solid #C0C0C0',
                      paddingBottom: '2px',
                      display: 'inline-block'
                    }}>
                      Tanggal Jatuh Tempo (Opsional)
                    </label>
                    <input
                      type="date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                      style={{ marginTop: '0.5rem' }}
                    />
                  </div>
                )}

                {/* Customer Search */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#2C2C2C] mb-2" style={{
                    borderBottom: '1px solid #C0C0C0',
                    paddingBottom: '2px',
                    display: 'inline-block'
                  }}>
                    Catatan Terkait Customer (Opsional)
                  </label>
                <div className="relative" ref={customerDropdownRef}>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          if (selectedCustomer) {
                            setSelectedCustomer(null);
                            setFormData(prev => ({ ...prev, customer_id: '' }));
                          }
                          setShowCustomerDropdown(false);
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCustomerSearch();
                          }
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        placeholder="Input nama customer atau nomor HP..."
                        style={{ marginTop: '0.5rem' }}
                      />
                      {selectedCustomer && (
                        <button
                          type="button"
                          onClick={handleCustomerClear}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>  
                    <button
                      type="button"
                      onClick={handleCustomerSearch}
                      disabled={customerSearchLoading || customerSearch.trim().length < 2}
                      className="px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md"
                    >
                      <Search size={18} />
                    </button>
                  </div>
                  
                  {showCustomerDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto" style={{ top: '100%' }}>
                      {customerSearchLoading ? (
                        <div className="p-4 text-center text-gray-500 text-sm">Mencari...</div>
                      ) : customerResults.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">Tidak ada hasil</div>
                      ) : (
                        customerResults.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => handleCustomerSelect(customer)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-gray-900">{customer.name || 'Tidak ada nama'}</div>
                            <div className="text-sm text-gray-500">{customer.phone || 'Tidak ada nomor HP'}</div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  
                  {/* Lihat Detail Link - Customer */}
                  {selectedCustomer && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => setShowCustomerDetailModal(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                      >
                        <Eye size={14} />
                        <span>Lihat detail</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>


                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200" style={{ borderTopStyle: 'dashed', borderTopWidth: '1px' }}>
                  <AnimatedButton
                    type="button"
                    onClick={() => navigate('/admin-notes')}
                    variant="grey"
                    className="px-6 py-2.5"
                  >
                    Batal
                  </AnimatedButton>
                  <AnimatedButton
                    type="submit"
                    disabled={loading}
                    variant="blue"
                    className="px-6 py-2.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={18} />
                    <span>{loading ? 'Menyimpan...' : isEdit ? 'Update' : 'Simpan'}</span>
                  </AnimatedButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Customer Detail Modal */}
      {showCustomerDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Detail Customer</h3>
              <button
                onClick={() => setShowCustomerDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Nama</label>
                <p className="text-base text-gray-900">{selectedCustomer.name || 'Tidak ada nama'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Nomor HP</label>
                <p className="text-base text-gray-900">{selectedCustomer.phone || 'Tidak ada nomor HP'}</p>
              </div>

              {selectedCustomer.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Alamat</label>
                  <p className="text-base text-gray-900">{selectedCustomer.address}</p>
                </div>
              )}

              {selectedCustomer.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <p className="text-base text-gray-900">{selectedCustomer.email}</p>
                </div>
              )}

              {selectedCustomer.id && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">ID Customer</label>
                  <p className="text-base text-gray-900">#{selectedCustomer.id}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <AnimatedButton
                onClick={() => setShowCustomerDetailModal(false)}
                variant="grey"
                className="px-4 py-2"
              >
                Tutup
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNoteForm;
