import React, { useState, useEffect } from 'react';
import { X, MapPin, Phone, Users, ShoppingCart, CreditCard, TrendingUp, Calendar, Wifi, UserCheck, Building2, Store, Link2 } from 'lucide-react';
import instance from '../../config/api';

const BranchDetailModal = ({ isOpen, onClose, branchId, branchName }) => {
    const [branchData, setBranchData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && branchId) {
            fetchBranchDetail();
        }
    }, [isOpen, branchId]);

    const fetchBranchDetail = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await instance.get(`/branches-detail/${branchId}`);
            setBranchData(data.data);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch branch details');
            console.error('Error fetching branch details:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('id-ID').format(num);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8"
            style={{
                paddingTop: 'max(2rem, env(safe-area-inset-top))',
                paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
                paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
                paddingRight: 'max(1.5rem, env(safe-area-inset-right))'
            }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh]">
                {/* Header - Fixed */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex-shrink-0 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-start gap-3 flex-col">
                                <h2 className="text-xl font-bold">{branchName || 'Detail Cabang'}</h2>
                                {branchData?.branch_type === 'main' ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white border border-white/30">
                                        OUTLET
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500 text-white border border-purple-400">
                                        MITRA/DROPPOINT
                                    </span>
                                )}
                            </div>
                            <p className="text-blue-100 mt-1 text-sm">Informasi lengkap cabang toko</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div
                    className="p-6 overflow-y-auto flex-1"
                    style={{
                        WebkitOverflowScrolling: 'touch',
                        overscrollBehavior: 'contain'
                    }}
                >
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <div className="text-red-500 text-lg font-semibold mb-2">Gagal Memuat Data</div>
                            <p className="text-gray-600">{error}</p>
                            <button
                                onClick={fetchBranchDetail}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    ) : branchData ? (
                        <div className="space-y-8">
                            {/* Basic Information */}
                            <div className="bg-gray-50 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <MapPin className="mr-2 text-blue-600" size={18} />
                                    Informasi Dasar
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Nama Cabang</label>
                                        <p className="text-base font-semibold text-gray-800">{branchData.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Status</label>
                                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${branchData.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {branchData.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Alamat</label>
                                        <p className="text-gray-800">{branchData.address}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Telepon</label>
                                        <p className="text-gray-800 flex items-center">
                                            <Phone className="mr-1" size={16} />
                                            {branchData.phone}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Kota</label>
                                        <p className="text-gray-800">{branchData.city}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Mitra Connection Info */}
                            {(branchData.branch_type === 'mitra' || (branchData.mitraRelations && branchData.mitraRelations.length > 0)) && (
                                <div className="bg-purple-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <Link2 className="mr-2 text-purple-600" size={18} />
                                        Koneksi Mitra
                                    </h3>

                                    {branchData.branch_type === 'mitra' && branchData.parentRelation ? (
                                        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-500">
                                            <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Terhubung ke Outlet Utama</p>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <Building2 className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{branchData.parentRelation.parentBranch?.name}</p>
                                                    <p className="text-sm text-gray-600">{branchData.parentRelation.parentBranch?.address}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : branchData.branch_type === 'main' && branchData.mitraRelations?.length > 0 ? (
                                        <div className="space-y-3">
                                            <p className="text-sm text-gray-600 mb-2">Memiliki {branchData.mitraRelations.length} Droppoint:</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {branchData.mitraRelations.map(rel => (
                                                    <div key={rel.id} className="bg-white rounded-lg p-3 shadow-sm flex items-center gap-3 border border-gray-100">
                                                        <div className="p-2 bg-purple-100 rounded-lg">
                                                            <Store className="w-4 h-4 text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 text-sm">{rel.mitraBranch?.name}</p>
                                                            <p className="text-xs text-gray-500 truncate max-w-[150px]">{rel.mitraBranch?.address}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-gray-500 italic text-sm">Tidak ada koneksi mitra.</div>
                                    )}
                                </div>
                            )}

                            {/* Financial Performance */}
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <TrendingUp className="mr-2 text-green-600" size={18} />
                                    Performa Keuangan
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Total Pendapatan</p>
                                                <p className="text-lg font-bold text-green-600">
                                                    {formatCurrency(branchData.total_revenue)}
                                                </p>
                                            </div>
                                            <CreditCard className="text-green-600" size={20} />
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Total Uang Masuk</p>
                                                <p className="text-lg font-bold text-blue-600">
                                                    {formatCurrency(branchData.total_sales)}
                                                </p>
                                            </div>
                                            <TrendingUp className="text-blue-600" size={20} />
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Rata-rata Pesanan</p>
                                                <p className="text-lg font-bold text-purple-600">
                                                    {formatCurrency(branchData.avg_order_value)}
                                                </p>
                                            </div>
                                            <ShoppingCart className="text-purple-600" size={20} />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    {/* <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Transaksi Tunai</p>
                                                <p className="text-xl font-semibold text-gray-800">
                                                    {formatCurrency(branchData.total_cash)}
                                                </p>
                                            </div>
                                        </div>
                                    </div> */}
                                    {/* <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Transfer Bank</p>
                                                <p className="text-xl font-semibold text-gray-800">
                                                    {formatCurrency(branchData.total_bank_transfer)}
                                                </p>
                                            </div>
                                        </div>
                                    </div> */}
                                </div>
                            </div>

                            {/* Operational Metrics */}
                            <div className="bg-gray-50 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <Users className="mr-2 text-indigo-600" size={18} />
                                    Data Operasional
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                                        <Users className="mx-auto text-blue-600 mb-2" size={20} />
                                        <p className="text-xl font-bold text-gray-800">{formatNumber(branchData.total_users)}</p>
                                        <p className="text-xs text-gray-500">Karyawan</p>
                                    </div>
                                    <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                                        <ShoppingCart className="mx-auto text-green-600 mb-2" size={20} />
                                        <p className="text-xl font-bold text-gray-800">{formatNumber(branchData.total_orders)}</p>
                                        <p className="text-xs text-gray-500">Pesanan</p>
                                    </div>
                                    <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                                        <Users className="mx-auto text-purple-600 mb-2" size={20} />
                                        <p className="text-xl font-bold text-gray-800">{formatNumber(branchData.total_customers)}</p>
                                        <p className="text-xs text-gray-500">Pelanggan</p>
                                    </div>
                                    <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                                        <Calendar className="mx-auto text-orange-600 mb-2" size={20} />
                                        <p className="text-xl font-bold text-gray-800">{formatNumber(branchData.total_shifts)}</p>
                                        <p className="text-xs text-gray-500">Shift Kerja</p>
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <p className="text-sm font-medium text-gray-500">Total Item</p>
                                        <p className="text-lg font-semibold text-gray-800">{formatNumber(branchData.total_items_sold)}</p>
                                    </div>
                                    {/* <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <p className="text-sm font-medium text-gray-500">Koneksi WhatsApp</p>
                                        <div className="flex items-center">
                                            <Wifi className={`mr-2 ${branchData.wa_connected ? 'text-green-600' : 'text-red-600'}`} size={20} />
                                            <span className={`font-semibold ${branchData.wa_connected ? 'text-green-600' : 'text-red-600'}`}>
                                                {branchData.wa_connected ? 'Terhubung' : 'Tidak Terhubung'}
                                            </span>
                                        </div>
                                    </div> */}
                                </div>
                            </div>

                            {/* Tenant Information */}
                            {branchData.tenant && (
                                <div className="bg-blue-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Bisnis</h3>
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Nama Bisnis</p>
                                                <p className="text-base font-semibold text-gray-800">{branchData.tenant.business_name}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${branchData.tenant.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {branchData.tenant.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Footer - Fixed */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end flex-shrink-0 border-t-2 border-gray-100 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BranchDetailModal;

