import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * ExpenseModal - Reusable modal for creating and editing expenses
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onSubmit - Callback when form is submitted
 * @param {Object} props.expense - Expense data for editing (null for creating)
 * @param {Array} props.categories - List of available categories
 * @param {string} props.mode - 'create' or 'edit'
 */
const ExpenseModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  expense = null, 
  categories = [], 
  mode = 'create' 
}) => {
  const [formData, setFormData] = useState({
    expense_date: '',
    category: '',
    amount: '',
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayAmount, setDisplayAmount] = useState(''); // For formatted display

  // Format number with thousand separator (titik)
  const formatNumber = (value) => {
    if (!value) return '';
    // Remove non-numeric characters
    const numericValue = value.toString().replace(/\D/g, '');
    // Add thousand separator
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Remove formatting to get raw number
  const parseNumber = (value) => {
    if (!value) return '';
    return value.toString().replace(/\./g, '');
  };

  // Initialize form data when expense changes
  useEffect(() => {
    if (mode === 'edit' && expense) {
      const amountValue = expense.amount || '';
      setFormData({
        expense_date: expense.expense_date || '',
        category: expense.category || '',
        amount: amountValue,
        description: expense.description || ''
      });
      setDisplayAmount(formatNumber(amountValue));
    } else {
      // Set default date to today for create mode
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        expense_date: today,
        category: '',
        amount: '',
        description: ''
      });
      setDisplayAmount('');
    }
    setErrors({});
  }, [expense, mode, isOpen]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      // Handle amount input with formatting
      const rawValue = parseNumber(value);
      setFormData(prev => ({
        ...prev,
        amount: rawValue
      }));
      setDisplayAmount(formatNumber(rawValue));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.expense_date) {
      newErrors.expense_date = 'Tanggal harus diisi';
    }

    if (!formData.category) {
      newErrors.category = 'Kategori harus dipilih';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Jumlah harus lebih dari 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: error.message || 'Terjadi kesalahan saat menyimpan data' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setFormData({
      expense_date: '',
      category: '',
      amount: '',
      description: ''
    });
    setDisplayAmount('');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 font-montserrat">
            {mode === 'edit' ? 'Edit Expense' : 'Tambah Expense Baru'}
          </h3>
          <button 
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
              Tanggal <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="expense_date"
              required
              value={formData.expense_date}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-montserrat ${
                errors.expense_date ? 'border-red-500' : 'border-gray-300'
              } disabled:bg-gray-100 disabled:cursor-not-allowed`}
            />
            {errors.expense_date && (
              <p className="text-red-500 text-xs mt-1 font-montserrat">{errors.expense_date}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              required
              value={formData.category}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-montserrat ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              } disabled:bg-gray-100 disabled:cursor-not-allowed`}
            >
              <option value="">Pilih kategori</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-xs mt-1 font-montserrat">{errors.category}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
              Jumlah (IDR) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="amount"
              required
              value={displayAmount}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-montserrat ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              } disabled:bg-gray-100 disabled:cursor-not-allowed`}
            />
            {displayAmount && (
              <p className="text-xs text-gray-500 mt-1 font-montserrat">
                = Rp {displayAmount}
              </p>
            )}
            {errors.amount && (
              <p className="text-red-500 text-xs mt-1 font-montserrat">{errors.amount}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
              Deskripsi
            </label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Deskripsi opsional..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-montserrat disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm font-montserrat">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-montserrat font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-montserrat font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Menyimpan...' : mode === 'edit' ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;

