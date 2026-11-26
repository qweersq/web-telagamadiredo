import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import AnimatedButton from '../../../components/Design/AnimatedButton';
import { updateExpense, getFinanceCategories } from '../api/expenseApi';
import { formatNumberInput, parseNumberInput, handleNumberInputChange } from '../../../utils/numberInputHelper';
import { formatCurrency } from '../../../utils/labelFormatter';

const ExpenseEditModal = ({ isOpen, onClose, onSubmit, expense, branches, onBranchChange, financeAccounts, userData }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Data states
  const [financeCategories, setFinanceCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    if (isOpen && expense) {
      setShowOverlay(true);
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        setShowModal(true);
      }, 100);
      
      // Set form values from expense data
      setName(expense.name || '');
      // Parse amount from database (could be string with decimal) to number first
      const numericAmount = expense.amount ? parseFloat(expense.amount) : 0;
      setAmount(numericAmount);
      setDisplayAmount(numericAmount ? formatNumberInput(numericAmount.toString()) : '');
      // Set date from expense (format: YYYY-MM-DD)
      if (expense.date) {
        const expenseDate = new Date(expense.date);
        const formattedDate = expenseDate.toISOString().split('T')[0];
        setDate(formattedDate);
      } else {
        // Default to today if no date
        setDate(new Date().toISOString().split('T')[0]);
      }
      setDescription(expense.description || '');
      setSelectedBranch(expense.branch_id ? expense.branch_id.toString() : '');
      setSelectedAccount(expense.finance_account_id ? expense.finance_account_id.toString() : '');
      setSelectedCategory(expense.finance_category_id ? expense.finance_category_id.toString() : '');
      
      fetchFinanceCategories();
    } else {
      setShowModal(false);
      document.body.style.overflow = "auto";
      setTimeout(() => {
        setShowOverlay(false);
      }, 300);
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen, expense]);

  useEffect(() => {
    if (selectedBranch) {
      onBranchChange(selectedBranch);
    }
  }, [selectedBranch, onBranchChange]);

  const fetchFinanceCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const response = await getFinanceCategories('debit', userData?.tenant_id); // Only fetch expense categories with tenant_id
      setFinanceCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching finance categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  }, [userData?.tenant_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Nama pengeluaran wajib diisi');
      return;
    }
    
    if (!amount || parseNumberInput(amount) <= 0) {
      setError('Nominal harus lebih dari 0');
      return;
    }
    
    if (!selectedBranch) {
      setError('Pilih cabang');
      return;
    }
    
    if (!selectedAccount) {
      setError('Pilih akun keuangan');
      return;
    }
    
    if (!selectedCategory) {
      setError('Pilih kategori');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const expenseData = {
        name: name.trim(),
        amount: parseNumberInput(amount),
        date: date || new Date().toISOString().split('T')[0],
        description: description.trim(),
        finance_account_id: parseInt(selectedAccount),
        finance_category_id: parseInt(selectedCategory),
        branch_id: parseInt(selectedBranch),
        status: expense.status || 'completed',
        user_id: userData?.id
      };

      console.log('Updating expense:', expense.id, expenseData);
      await updateExpense(expense.id, expenseData);
      
      onSubmit();
    } catch (error) {
      console.error('Error updating expense:', error);
      setError(error.response?.data?.error?.message || error.message || 'Gagal mengupdate pengeluaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (e) => {
    handleNumberInputChange(e, setAmount, setDisplayAmount);
  };

  if (!isOpen || !expense) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-50 ${
          showOverlay ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-8 transition-all duration-300 ${
          showModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        style={{
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(2rem, env(safe-area-inset-left))',
          paddingRight: 'max(2rem, env(safe-area-inset-right))'
        }}
      >
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
            <h2 className="text-xl font-semibold text-gray-800">Edit Pengeluaran</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 space-y-4 overflow-y-auto flex-1" style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Nama Pengeluaran */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Pengeluaran *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Contoh: Beli deterjen"
                required
              />
            </div>

            {/* Nominal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nominal *
              </label>
              <input
                type="text"
                value={displayAmount}
                onChange={handleAmountChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                required
              />
            </div>

            {/* Tanggal Pengeluaran */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Pengeluaran *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Cabang */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cabang *
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Pilih Cabang</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Akun Keuangan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Pembayaran *
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={!selectedBranch}
              >
                <option value="">Pilih Pembayaran</option>
                {financeAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} 
                  </option>
                ))}
              </select>
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori *
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loadingCategories}
              >
                <option value="">Pilih Kategori</option>
                {financeCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Deskripsi pengeluaran (opsional)"
              />
            </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 p-6 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <AnimatedButton
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Menyimpan...' : 'Update'}
              </AnimatedButton>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ExpenseEditModal;
