import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import AnimatedButton from '../../../components/Design/AnimatedButton';
import { getFinanceAccounts, getFinanceCategories } from '../api/financeApi';
import { getUserProfile } from '../../../utils/userProfileHelper';

const FinanceAddExternalIncomeModal = ({ isOpen, onClose, onSubmit, selectedDate }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [financeAccountId, setFinanceAccountId] = useState('');
  const [financeCategoryId, setFinanceCategoryId] = useState('');
  const [receipt, setReceipt] = useState('');
  
  // State untuk finance accounts dan categories
  const [financeAccounts, setFinanceAccounts] = useState([]);
  const [financeCategories, setFinanceCategories] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowOverlay(true);
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        setShowModal(true);
      }, 100);
      
      // Fetch accounts and categories when modal opens
      fetchAccountsAndCategories();
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
  }, [isOpen]);

  // Fetch accounts and categories
  const fetchAccountsAndCategories = async () => {
    try {
      setLoadingAccounts(true);
      setLoadingCategories(true);
      
      // tenant_id is automatically taken from JWT token on backend
      const [accountsData, categoriesData] = await Promise.all([
        getFinanceAccounts(),
        getFinanceCategories('credit') // Only fetch income categories
      ]);
      
      setFinanceAccounts(accountsData || []);
      setFinanceCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching accounts and categories:', error);
      // Fallback to dummy data if API fails
      setFinanceAccounts([
        { id: 1, name: 'Cash' },
        { id: 2, name: 'Bank BCA' },
        { id: 3, name: 'Bank Mandiri' },
        { id: 4, name: 'QRIS Gateway' }
      ]);
      setFinanceCategories([
        { id: 1, name: 'Pendapatan Lainnya' },
        { id: 2, name: 'Komisi' },
        { id: 3, name: 'Investasi' },
        { id: 4, name: 'Hadiah' },
        { id: 5, name: 'Refund' },
        { id: 6, name: 'Lainnya' }
      ]);
    } finally {
      setLoadingAccounts(false);
      setLoadingCategories(false);
    }
  };

  const handleSubmit = () => {
    // Validasi input
    if (!name.trim()) {
      alert('Nama pendapatan harus diisi');
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
      alert('Kategori pendapatan harus dipilih');
      return;
    }

    // Get user_id from localStorage or context
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || 1; // Fallback ke 1 jika tidak ada user

    onSubmit({
      user_id: userId,
      name: name.trim(),
      amount: Number(amount),
      description: description.trim() || '',
      date: selectedDate,
      payment_method: paymentMethod,
      receipt: receipt.trim() || '',
      finance_account_id: Number(financeAccountId),
      finance_category_id: Number(financeCategoryId)
    });

    // Reset form
    setName('');
    setAmount('');
    setDescription('');
    setPaymentMethod('cash');
    setFinanceAccountId('');
    setFinanceCategoryId('');
    setReceipt('');
  };

  if (!showOverlay) return null;

  return (
    <div className={`fixed inset-0 bg-black transition-opacity duration-300 flex items-center justify-center z-50 overflow-y-auto ${showOverlay ? "bg-opacity-50" : "bg-opacity-0"}`}>
      <div className={`bg-white rounded-lg p-4 w-[90%] max-w-md transform transition-all duration-300 my-4 ${showModal ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-full scale-150"}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-montserrat text-lg">Tambah Pendapatan</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nama Pendapatan *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Contoh: Komisi Penjualan"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nominal *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Kategori Pendapatan *
            </label>
            <select
              value={financeCategoryId}
              onChange={(e) => setFinanceCategoryId(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
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
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Pilih Pembayaran *
            </label>
            <select
              value={financeAccountId}
              onChange={(e) => setFinanceAccountId(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
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
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Metode Pembayaran
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="qris">QRIS</option>
              <option value="card">Card</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nomor Receipt (Opsional)
            </label>
            <input
              type="text"
              value={receipt}
              onChange={(e) => setReceipt(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Contoh: INV-001"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Deskripsi (Opsional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
              rows="2"
              placeholder="Tambahkan deskripsi pendapatan..."
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t flex gap-2">
          <AnimatedButton
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors text-sm"
          >
            Batal
          </AnimatedButton>
          <AnimatedButton
            onClick={handleSubmit}
            className="flex-1 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
          >
            Simpan
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

export default FinanceAddExternalIncomeModal;
