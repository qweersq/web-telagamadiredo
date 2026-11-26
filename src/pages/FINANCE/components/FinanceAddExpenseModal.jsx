import React, { useEffect, useState } from 'react';
import AnimatedButton from '../../../components/Design/AnimatedButton';
import { getFinanceAccounts, getFinanceCategories, getBranches } from '../api/financeApi';
import { getUserProfile } from '../../../utils/userProfileHelper';
import { formatNumberInput, parseNumberInput, handleNumberInputChange } from '../../../utils/numberInputHelper';

const FinanceAddExpenseModal = ({ isOpen, onClose, onSubmit, selectedDate }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(0);
  const [displayAmount, setDisplayAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [financeAccountId, setFinanceAccountId] = useState('');
  const [financeCategoryId, setFinanceCategoryId] = useState('');
  const [receipt, setReceipt] = useState('');
  const [branchId, setBranchId] = useState('');

  // State untuk finance accounts, categories, dan branches
  const [financeAccounts, setFinanceAccounts] = useState([]);
  const [financeCategories, setFinanceCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowOverlay(true);
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        setShowModal(true);
      }, 100);

      // Set default date from selectedDate prop or today
      if (selectedDate) {
        // If selectedDate is a Date object, convert to YYYY-MM-DD
        const dateValue = selectedDate instanceof Date 
          ? selectedDate.toISOString().split('T')[0]
          : selectedDate.split('T')[0]; // Handle string dates
        setDate(dateValue);
      } else {
        setDate(new Date().toISOString().split('T')[0]);
      }

      // Fetch branches and categories when modal opens
      fetchBranchesAndCategories();
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
  }, [isOpen, selectedDate]);

  // Fetch finance accounts when branch changes
  useEffect(() => {
    if (branchId && isOpen) {
      fetchFinanceAccounts(branchId);
    }
  }, [branchId, isOpen]);

  // Fetch branches and categories (global)
  const fetchBranchesAndCategories = async () => {
    try {
      setLoadingCategories(true);
      setLoadingBranches(true);

      // Get user profile untuk set default branch
      const userProfile = await getUserProfile();
      const currentBranchId = userProfile?.branch?.id;

      // Set default branch
      if (currentBranchId) {
        setBranchId(currentBranchId.toString());
      }

      // tenant_id is automatically taken from JWT token on backend
      const [categoriesData, branchesData] = await Promise.all([
        getFinanceCategories('debit'), // Only fetch expense categories
        getBranches() // Fetch branches
      ]);

      setFinanceCategories(categoriesData || []);
      setBranches(branchesData || []);
    } catch (error) {
      console.error('Error fetching categories and branches:', error);
      // Set empty arrays on error
      setFinanceCategories([]);
      setBranches([]);
    } finally {
      setLoadingCategories(false);
      setLoadingBranches(false);
    }
  };

  // Fetch finance accounts based on selected branch
  const fetchFinanceAccounts = async (selectedBranchId) => {
    if (!selectedBranchId) return;

    try {
      setLoadingAccounts(true);

      // tenant_id is automatically taken from JWT token on backend
      const accountsData = await getFinanceAccounts(selectedBranchId);

      setFinanceAccounts(accountsData || []);
    } catch (error) {
      // Set empty array on error
      setFinanceAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleSubmit = async () => {
    // Validasi input sesuai dengan backend
    if (!name.trim()) {
      alert('Nama pengeluaran harus diisi');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      alert('Nominal harus diisi dengan benar');
      return;
    }

    if (!financeAccountId) {
      alert('Akun keuangan harus dipilih');
      return;
    }

    if (!financeCategoryId) {
      alert('Kategori pengeluaran harus dipilih');
      return;
    }

    if (!branchId) {
      alert('Outlet harus dipilih');
      return;
    }

    try {
      // Get user_id from getUserProfile helper
      const profileData = await getUserProfile();
      const userId = profileData?.user?.id || 1; // Fallback ke 1 jika tidak ada user

      onSubmit({
        user_id: userId,
        name: name.trim(),
        amount: Number(amount),
        description: description.trim() || '',
        date: date || selectedDate || new Date().toISOString().split('T')[0],
        receipt: receipt.trim() || '',
        finance_account_id: Number(financeAccountId),
        finance_category_id: Number(financeCategoryId),
        branch_id: Number(branchId)
        // Removed payment_method - now handled by finance_account.payment_method_id
      });

      // Reset form (keep branchId)
      setName('');
      setAmount(0);
      setDisplayAmount('');
      setDate(selectedDate ? (selectedDate instanceof Date ? selectedDate.toISOString().split('T')[0] : selectedDate.split('T')[0]) : new Date().toISOString().split('T')[0]);
      setDescription('');
      setFinanceAccountId('');
      setFinanceCategoryId('');
      setReceipt('');
      // Don't reset branchId - keep selected branch
    } catch (error) {
      console.error('Error getting user profile:', error);
      alert('Gagal mendapatkan data user. Silakan coba lagi.');
    }
  };

  if (!showOverlay) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8" style={{
      paddingTop: 'max(2rem, env(safe-area-inset-top))',
      paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      paddingLeft: 'max(2rem, env(safe-area-inset-left))',
      paddingRight: 'max(2rem, env(safe-area-inset-right))'
    }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header - Fixed */}
        <div className="bg-white px-6 py-3 flex-shrink-0 border-b-2 border-gray-200 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Tambah Pengeluaran</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="px-6 py-4 flex-1 overflow-y-auto" style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} id="expense-form">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Pengeluaran *
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Bayar Listrik"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nominal *
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors"
                value={displayAmount}
                onChange={(e) => handleNumberInputChange(e, setAmount, setDisplayAmount)}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tanggal Pengeluaran *
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kategori Pengeluaran *
              </label>
              <select
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors"
                value={financeCategoryId}
                onChange={(e) => setFinanceCategoryId(e.target.value)}
                disabled={loadingCategories}
              >
                <option value="">
                  {loadingCategories ? 'Memuat kategori...' : 'Pilih kategori'}
                </option>
                {financeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pilih Outlet *
              </label>
              <select
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                disabled={loadingBranches}
              >
                <option value="">
                  {loadingBranches ? 'Memuat outlet...' : 'Pilih outlet'}
                </option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pilih Pembayaran *
              </label>
              <select
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors"
                value={financeAccountId}
                onChange={(e) => setFinanceAccountId(e.target.value)}
                disabled={loadingAccounts}
              >
                <option value="">
                  {loadingAccounts ? 'Memuat pembayaran...' : 'Pilih pembayaran'}
                </option>
                {financeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nomor Receipt (Opsional)
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors"
                value={receipt}
                onChange={(e) => setReceipt(e.target.value)}
                placeholder="Contoh: INV-001"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Deskripsi (Opsional)
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 focus:outline-none font-montserrat text-sm bg-gray-50 transition-colors resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tambahkan deskripsi pengeluaran..."
              />
            </div>
          </div>
          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="px-6 py-3 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              form="expense-form"
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceAddExpenseModal;
