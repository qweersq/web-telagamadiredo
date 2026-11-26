import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import AnimatedButton from '../../../components/Design/AnimatedButton';
import { getFinanceAccounts } from '../api/financeApi';

const FinanceCashToBankModal = ({ isOpen, onClose, onSubmit, selectedDate }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [financeAccountId, setFinanceAccountId] = useState('');
  
  // State untuk finance accounts
  const [financeAccounts, setFinanceAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowOverlay(true);
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        setShowModal(true);
      }, 100);
      
      // Fetch accounts when modal opens
      fetchAccounts();
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

  // Fetch accounts
  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true);
      
      const accountsData = await getFinanceAccounts();
      
      // Filter hanya bank accounts (exclude cash)
      const bankAccounts = (accountsData || []).filter(account => 
        account.name.toLowerCase().includes('bank') || 
        account.name.toLowerCase().includes('bca') ||
        account.name.toLowerCase().includes('mandiri')
      );
      
      setFinanceAccounts(bankAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      // Fallback to dummy bank data if API fails
      setFinanceAccounts([
        { id: 2, name: 'Bank BCA' },
        { id: 3, name: 'Bank Mandiri' }
      ]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleSubmit = () => {
    // Validasi input
    if (!amount || Number(amount) <= 0) {
      alert('Nominal harus diisi dengan benar');
      return;
    }
    
    if (!financeAccountId) {
      alert('Akun bank harus dipilih');
      return;
    }

    // Get user_id from localStorage or context
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || 1; // Fallback ke 1 jika tidak ada user

    onSubmit({
      user_id: userId,
      amount: Number(amount),
      description: description.trim() || 'Transfer Cash ke Bank',
      date: selectedDate,
      finance_account_id: Number(financeAccountId)
    });

    // Reset form
    setAmount('');
    setDescription('');
    setFinanceAccountId('');
  };

  if (!showOverlay) return null;

  return (
    <div className={`fixed inset-0 bg-black transition-opacity duration-300 flex items-center justify-center z-50 overflow-y-auto ${showOverlay ? "bg-opacity-50" : "bg-opacity-0"}`}>
      <div className={`bg-white rounded-lg p-4 w-[90%] max-w-md transform transition-all duration-300 my-4 ${showModal ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-full scale-150"}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-montserrat text-lg">Cash to Bank</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="bg-blue-50 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="text-xs font-medium text-blue-800">Transfer Cash ke Bank</span>
            </div>
            <p className="text-xs text-blue-700">
              Memindahkan uang dari kas ke rekening bank yang dipilih
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nominal Transfer *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Akun Bank Tujuan *
            </label>
            <select
              value={financeAccountId}
              onChange={(e) => setFinanceAccountId(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loadingAccounts}
            >
              <option value="">
                {loadingAccounts ? 'Memuat akun bank...' : 'Pilih akun bank'}
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
              Catatan (Opsional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows="2"
              placeholder="Tambahkan catatan transfer..."
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
            className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
          >
            Transfer
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

export default FinanceCashToBankModal;
