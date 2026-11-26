import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, X, AlertTriangle, Calendar } from 'lucide-react';
import AnimatedButton from '../../components/Design/AnimatedButton';
import { getIncomes, createIncome, deleteIncome, getFinanceAccounts, getFinanceCategories } from './api/incomeApi';
import { getUserProfile, getTenantId, getBranchId } from '../../utils/userProfileHelper';
import { formatCurrency, formatDate } from '../../utils/labelFormatter';

const IncomeManagement = () => {
    const navigate = useNavigate();

    // User data
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Incomes list
    const [incomes, setIncomes] = useState([]);
    const [loadingIncomes, setLoadingIncomes] = useState(false);

    // Finance accounts & categories
    const [financeAccounts, setFinanceAccounts] = useState([]);
    const [financeCategories, setFinanceCategories] = useState([]);

    // Statistics
    const [statistics, setStatistics] = useState({
        total_amount: 0,
        count_income: 0
    });

    // Add modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [addLoading, setAddLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        description: '',
        finance_account_id: '',
        finance_category_id: ''
    });
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedIncome, setSelectedIncome] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Fetch user data
    const fetchUserData = useCallback(async () => {
        try {
            const profile = await getUserProfile();
            if (profile) {
                setUserData(profile);
                return profile;
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
        return null;
    }, []);

    // Fetch incomes
    const fetchIncomes = useCallback(async () => {
        try {
            setLoadingIncomes(true);
            const tenantId = await getTenantId();
            const branchId = await getBranchId();

            const response = await getIncomes({
                tenant_id: tenantId,
                branch_id: branchId,
                page: 1,
                pageSize: 50
            });

            if (response.success) {
                setIncomes(response.data?.incomes || response.data || []);
                if (response.data?.statistics) {
                    setStatistics(response.data.statistics);
                }
            }
        } catch (error) {
            console.error('Error fetching incomes:', error);
        } finally {
            setLoadingIncomes(false);
        }
    }, []);

    // Fetch finance accounts
    const fetchFinanceAccounts = useCallback(async () => {
        try {
            const response = await getFinanceAccounts();
            if (response.success) {
                setFinanceAccounts(response.data || []);
                // Set default
                if (response.data?.length > 0) {
                    const cashAccount = response.data.find(a =>
                        a.name?.toLowerCase().includes('tunai') || a.name?.toLowerCase().includes('cash')
                    );
                    setFormData(prev => ({
                        ...prev,
                        finance_account_id: (cashAccount?.id || response.data[0].id).toString()
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching finance accounts:', error);
        }
    }, []);

    // Fetch finance categories
    const fetchFinanceCategories = useCallback(async () => {
        try {
            const response = await getFinanceCategories('credit');
            if (response.success) {
                setFinanceCategories(response.data || []);
                // Set default
                if (response.data?.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        finance_category_id: response.data[0].id.toString()
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching finance categories:', error);
        }
    }, []);

    // Initial load
    useEffect(() => {
        const init = async () => {
            await fetchUserData();
            await fetchFinanceAccounts();
            await fetchFinanceCategories();
            await fetchIncomes();
            setLoading(false);
        };
        init();
    }, [fetchUserData, fetchIncomes, fetchFinanceAccounts, fetchFinanceCategories]);

    // Format number for input
    const formatNumberInput = (value) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        if (!numericValue) return '';
        return parseInt(numericValue, 10).toLocaleString('id-ID');
    };

    const parseNumberInput = (formattedValue) => {
        return parseInt(formattedValue.replace(/\./g, ''), 10) || 0;
    };

    // Handle add income
    const handleAddIncome = async (e) => {
        e.preventDefault();

        // Validasi lengkap
        if (!formData.name?.trim()) {
            alert('Nama pemasukan harus diisi');
            return;
        }
        if (!formData.amount || parseNumberInput(formData.amount) <= 0) {
            alert('Nominal pemasukan harus diisi dengan angka yang valid');
            return;
        }
        if (!formData.finance_account_id) {
            alert('Pilih akun keuangan terlebih dahulu');
            return;
        }
        if (!formData.finance_category_id) {
            alert('Pilih kategori transaksi terlebih dahulu');
            return;
        }

        try {
            setAddLoading(true);
            const tenantId = await getTenantId();
            const branchId = await getBranchId();

            const incomeData = {
                user_id: userData?.user?.id,
                name: formData.name,
                amount: parseNumberInput(formData.amount),
                description: formData.description,
                finance_account_id: parseInt(formData.finance_account_id, 10),
                finance_category_id: parseInt(formData.finance_category_id, 10),
                tenant_id: tenantId,
                branch_id: branchId,
                date: new Date(selectedDate).toISOString()
            };

            const response = await createIncome(incomeData);

            if (response.success) {
                setShowAddModal(false);
                setFormData({
                    name: '',
                    amount: '',
                    description: '',
                    finance_account_id: formData.finance_account_id,
                    finance_category_id: formData.finance_category_id
                });
                setSelectedDate(new Date().toISOString().split('T')[0]);
                fetchIncomes();
                alert('Pemasukan berhasil ditambahkan!');
            }
        } catch (error) {
            console.error('Error adding income:', error);
            alert('Gagal menambahkan pemasukan');
        } finally {
            setAddLoading(false);
        }
    };

    // Handle delete
    const handleDeleteIncome = (income) => {
        setSelectedIncome(income);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!selectedIncome) return;

        try {
            setDeleteLoading(true);
            await deleteIncome(selectedIncome.id);
            setShowDeleteModal(false);
            setSelectedIncome(null);
            fetchIncomes();
            alert('Pemasukan berhasil dihapus!');
        } catch (error) {
            console.error('Error deleting income:', error);
            alert('Gagal menghapus pemasukan');
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-montserrat">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">Pemasukan Lainnya</h1>
                                <p className="text-sm text-gray-500">Catat pemasukan non-order</p>
                            </div>
                        </div>

                        <AnimatedButton
                            variant="green"
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 text-sm flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah
                        </AnimatedButton>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <p className="text-sm text-gray-500">Total Pemasukan</p>
                        <p className="text-xl font-bold text-emerald-600">
                            {formatCurrency(statistics.total_amount)}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <p className="text-sm text-gray-500">Jumlah Transaksi</p>
                        <p className="text-xl font-bold text-gray-800">
                            {statistics.count_income || incomes.length}
                        </p>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-emerald-700">
                        Catat pemasukan selain dari order, seperti: modal investor, pinjaman, refund, atau pemasukan lainnya.
                    </p>
                </div>

                {/* Incomes List */}
                {loadingIncomes ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                    </div>
                ) : incomes.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                        <div className="text-4xl mb-4">📈</div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Belum Ada Pemasukan</h3>
                        <p className="text-gray-500 mb-4">Tambahkan pemasukan pertama Anda</p>
                        <AnimatedButton
                            variant="green"
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 text-sm"
                        >
                            <Plus className="w-4 h-4 inline mr-2" />
                            Tambah Pemasukan
                        </AnimatedButton>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {incomes.map((income) => (
                            <div
                                key={income.id}
                                className="bg-white rounded-xl p-4 border border-gray-200 hover:border-emerald-300 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-800">{income.name}</h4>
                                        <p className="text-sm text-gray-500">
                                            {formatDate(income.date)}
                                        </p>
                                        {income.description && (
                                            <p className="text-sm text-gray-400 mt-1">{income.description}</p>
                                        )}
                                        {income.finance_category && (
                                            <span className="inline-block mt-2 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                                                {income.finance_category.name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="text-lg font-bold text-emerald-600">
                                            +{formatCurrency(income.amount)}
                                        </p>
                                        <button
                                            onClick={() => handleDeleteIncome(income)}
                                            className="mt-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-800">Tambah Pemasukan</h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleAddIncome} className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nama Pemasukan *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Contoh: Modal Investor"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>

                                {/* Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nominal *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: formatNumberInput(e.target.value) })}
                                        placeholder="Contoh: 1.000.000"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tanggal Pemasukan *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            max={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Finance Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kategori Transaksi
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {financeCategories.length > 0 ? (
                                            financeCategories.map((category) => (
                                                <button
                                                    key={category.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, finance_category_id: category.id.toString() })}
                                                    className={`px-4 py-2 rounded-lg border text-sm transition-colors ${formData.finance_category_id === category.id.toString()
                                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                        : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                                                        }`}
                                                >
                                                    {category.name}
                                                </button>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">
                                                Belum ada kategori. Tambah di menu Kategori Transaksi.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Finance Account */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Akun Keuangan
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {financeAccounts.slice(0, 4).map((account) => (
                                            <button
                                                key={account.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, finance_account_id: account.id.toString() })}
                                                className={`px-4 py-2 rounded-lg border text-sm transition-colors ${formData.finance_account_id === account.id.toString()
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                    : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                                                    }`}
                                            >
                                                {account.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Keterangan (Opsional)
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Tambahkan catatan..."
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                                    />
                                </div>

                                {/* Submit Button */}
                                <AnimatedButton
                                    variant="green"
                                    type="submit"
                                    disabled={addLoading}
                                    className="w-full py-3 text-base"
                                >
                                    {addLoading ? 'Menyimpan...' : 'Simpan Pemasukan'}
                                </AnimatedButton>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedIncome && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-800">Hapus Pemasukan</h2>
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setSelectedIncome(null);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="flex justify-center mb-4">
                                <div className="bg-red-100 p-4 rounded-full">
                                    <AlertTriangle className="w-8 h-8 text-red-600" />
                                </div>
                            </div>

                            <div className="text-center mb-6">
                                <p className="text-gray-600">
                                    Yakin ingin menghapus pemasukan "{selectedIncome.name}"?
                                </p>
                                <p className="text-lg font-bold text-emerald-600 mt-2">
                                    {formatCurrency(selectedIncome.amount)}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setSelectedIncome(null);
                                    }}
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                                    disabled={deleteLoading}
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={deleteLoading}
                                    className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    {deleteLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Menghapus...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            Hapus
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncomeManagement;
