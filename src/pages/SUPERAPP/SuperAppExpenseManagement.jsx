import { useState, useEffect } from 'react';
import { Plus, Calendar, DollarSign, Edit2, Trash2, Filter, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import instance from '../../config/api';
import ExpenseModal from '../../components/SuperAppAdmin/ExpenseModal';
import DeleteConfirmModal from '../../components/SuperAppAdmin/DeleteConfirmModal';

const SuperAppExpenseManagement = () => {
  const navigate = useNavigate();
  
  // State untuk data
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // State untuk filter
  const [filters, setFilters] = useState({
    category: '',
    start_date: '',
    end_date: '',
    page: 1,
    limit: 20
  });

  // State untuk modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination
  const [pagination, setPagination] = useState(null);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const { data } = await instance.get('/superapp/expenses/categories');
      if (data.success) {
        setCategories(data.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch summary
  const fetchSummary = async () => {
    try {
      const params = {};
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const { data } = await instance.get('/superapp/expenses/summary', { params });
      if (data.success) {
        setSummary(data.data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  // Fetch expenses
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      const { data } = await instance.get('/superapp/expenses', { params });
      if (data.success) {
        setExpenses(data.data.expenses);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle submit from modal (create or update)
  const handleSubmitExpense = async (formData) => {
    try {
      if (modalMode === 'create') {
        const { data } = await instance.post('/superapp/expenses', formData);
        if (data.success) {
          fetchExpenses();
          fetchSummary();
          alert('Expense berhasil ditambahkan!');
        }
      } else {
        const { data } = await instance.put(`/superapp/expenses/${selectedExpense.id}`, formData);
        if (data.success) {
          fetchExpenses();
          fetchSummary();
          alert('Expense berhasil diupdate!');
        }
      }
    } catch (error) {
      console.error('Error submitting expense:', error);
      throw new Error(error.response?.data?.message || 'Gagal menyimpan data');
    }
  };

  // Delete expense
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { data } = await instance.delete(`/superapp/expenses/${selectedExpense.id}`);
      if (data.success) {
        setShowDeleteModal(false);
        setSelectedExpense(null);
        fetchExpenses();
        fetchSummary();
        alert('Expense berhasil dihapus!');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Gagal menghapus expense: ' + error.response?.data?.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setModalMode('create');
    setSelectedExpense(null);
    setShowExpenseModal(true);
  };

  // Open edit modal
  const openEditModal = (expense) => {
    setModalMode('edit');
    setSelectedExpense(expense);
    setShowExpenseModal(true);
  };

  // Open delete modal
  const openDeleteModal = (expense) => {
    setSelectedExpense(expense);
    setShowDeleteModal(true);
  };

  // Close expense modal
  const closeExpenseModal = () => {
    setShowExpenseModal(false);
    setSelectedExpense(null);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get category label
  const getCategoryLabel = (categoryValue) => {
    const category = categories.find(c => c.value === categoryValue);
    return category ? `${category.icon} ${category.label}` : categoryValue;
  };

  // Apply filters
  const handleApplyFilters = () => {
    setFilters({ ...filters, page: 1 });
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      category: '',
      start_date: '',
      end_date: '',
      page: 1,
      limit: 20
    });
  };

  // Initial load
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    fetchExpenses();
    fetchSummary();
  }, [filters.page, filters.limit]);

  return (
    <div className="min-h-screen bg-gray-50 font-montserrat">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/superapp-dashboard')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Kembali ke Dashboard"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">SuperApp Expenses</h1>
                  <p className="mt-1 text-sm text-gray-500">Kelola pengeluaran operasional sistem</p>
                </div>
              </div>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Expense
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(summary.total_expenses)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Categories</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {summary.by_category?.length || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Filter className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Items</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {pagination?.totalItems || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={handleApplyFilters}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Apply
              </button>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No expenses found
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(expense.expense_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getCategoryLabel(expense.category)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {expense.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => openEditModal(expense)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(expense)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                  {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                  {pagination.totalItems} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={!pagination.hasPrevPage}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={!pagination.hasNextPage}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expense Modal (Create/Edit) */}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={closeExpenseModal}
        onSubmit={handleSubmitExpense}
        expense={selectedExpense}
        categories={categories}
        mode={modalMode}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedExpense(null);
        }}
        onConfirm={handleDelete}
        title="Hapus Expense"
        message="Apakah Anda yakin ingin menghapus expense ini? Data yang sudah dihapus tidak dapat dikembalikan."
        itemName={selectedExpense ? `${getCategoryLabel(selectedExpense.category)} - ${formatCurrency(selectedExpense.amount)}` : null}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default SuperAppExpenseManagement;

