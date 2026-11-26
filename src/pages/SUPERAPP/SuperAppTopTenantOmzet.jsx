import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import topTenantService from '../../services/topTenantService';
import {
    FaArrowLeft,
    FaChevronDown,
    FaChevronUp,
    FaBuilding,
    FaStore,
    FaMoneyBillWave,
    FaReceipt,
    FaCalendarAlt
} from 'react-icons/fa';

const SuperAppTopTenantOmzet = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [expandedTenant, setExpandedTenant] = useState(null);
    const [branchData, setBranchData] = useState({});
    const [branchLoading, setBranchLoading] = useState({});

    // Filter state
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());

    // Month options
    const months = [
        { value: 1, label: 'Januari' },
        { value: 2, label: 'Februari' },
        { value: 3, label: 'Maret' },
        { value: 4, label: 'April' },
        { value: 5, label: 'Mei' },
        { value: 6, label: 'Juni' },
        { value: 7, label: 'Juli' },
        { value: 8, label: 'Agustus' },
        { value: 9, label: 'September' },
        { value: 10, label: 'Oktober' },
        { value: 11, label: 'November' },
        { value: 12, label: 'Desember' }
    ];

    // Year options (last 3 years)
    const years = [];
    for (let y = now.getFullYear(); y >= now.getFullYear() - 2; y--) {
        years.push(y);
    }

    useEffect(() => {
        fetchTopTenants();
    }, [month, year]);

    const fetchTopTenants = async () => {
        try {
            setLoading(true);
            const response = await topTenantService.getTopTenants({ month, year, limit: 50 });
            if (response.success) {
                setData(response.data);
            }
        } catch (error) {
            console.error('Error fetching top tenants:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExpandTenant = async (tenantId) => {
        if (expandedTenant === tenantId) {
            setExpandedTenant(null);
            return;
        }

        setExpandedTenant(tenantId);

        // Fetch branch data if not already fetched
        if (!branchData[tenantId]) {
            try {
                setBranchLoading(prev => ({ ...prev, [tenantId]: true }));
                const response = await topTenantService.getTenantBranches(tenantId, { month, year });
                if (response.success) {
                    setBranchData(prev => ({ ...prev, [tenantId]: response.data }));
                }
            } catch (error) {
                console.error('Error fetching branches:', error);
            } finally {
                setBranchLoading(prev => ({ ...prev, [tenantId]: false }));
            }
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value || 0);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-montserrat">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                            >
                                <FaArrowLeft className="text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 font-montserrat">
                                    Top Tenant Omzet
                                </h1>
                                <p className="text-sm text-gray-600 font-montserrat">
                                    Ranking tenant berdasarkan omzet bulanan
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Filter */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Periode:</span>
                        </div>
                        <select
                            value={month}
                            onChange={(e) => {
                                setMonth(parseInt(e.target.value));
                                setBranchData({});
                                setExpandedTenant(null);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                        <select
                            value={year}
                            onChange={(e) => {
                                setYear(parseInt(e.target.value));
                                setBranchData({});
                                setExpandedTenant(null);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Summary Cards */}
                {data?.summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <FaBuilding className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Total Tenant</p>
                                    <p className="text-lg font-bold text-gray-900">{data.summary.total_tenants}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <FaReceipt className="text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Total Order</p>
                                    <p className="text-lg font-bold text-gray-900">{data.summary.total_orders.toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <FaMoneyBillWave className="text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Total Omzet</p>
                                    <p className="text-lg font-bold text-gray-900">{formatCurrency(data.summary.total_omzet)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <FaMoneyBillWave className="text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Total Pemasukan</p>
                                    <p className="text-lg font-bold text-gray-900">{formatCurrency(data.summary.total_pemasukan)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tenant List */}
                {loading ? (
                    <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading data...</p>
                    </div>
                ) : data?.tenants?.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {data.tenants.map((tenant) => (
                                <div key={tenant.tenant_id}>
                                    {/* Tenant Row */}
                                    <div
                                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => handleExpandTenant(tenant.tenant_id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Rank */}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${tenant.rank === 1 ? 'bg-yellow-500' :
                                                tenant.rank === 2 ? 'bg-gray-400' :
                                                    tenant.rank === 3 ? 'bg-amber-600' :
                                                        'bg-gray-300'
                                                }`}>
                                                {tenant.rank}
                                            </div>

                                            {/* Tenant Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-bold text-gray-900 truncate">
                                                    {tenant.business_name}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {tenant.owner_name} • {tenant.city || '-'}
                                                </p>
                                            </div>

                                            {/* Stats */}
                                            <div className="hidden md:flex items-center gap-6">
                                                <div className="text-center">
                                                    <p className="text-xs text-gray-500">Orders</p>
                                                    <p className="text-sm font-semibold text-gray-900">{tenant.total_orders}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-gray-500">Cabang</p>
                                                    <p className="text-sm font-semibold text-gray-900">{tenant.total_branches}</p>
                                                </div>
                                                <div className="text-center min-w-[120px]">
                                                    <p className="text-xs text-gray-500">Omzet</p>
                                                    <p className="text-sm font-bold text-green-600">{formatCurrency(tenant.total_omzet)}</p>
                                                </div>
                                                <div className="text-center min-w-[120px]">
                                                    <p className="text-xs text-gray-500">Pemasukan</p>
                                                    <p className="text-sm font-bold text-emerald-600">{formatCurrency(tenant.total_pemasukan)}</p>
                                                </div>
                                            </div>

                                            {/* Expand Icon */}
                                            <div className="flex-shrink-0">
                                                {expandedTenant === tenant.tenant_id ? (
                                                    <FaChevronUp className="text-gray-400" />
                                                ) : (
                                                    <FaChevronDown className="text-gray-400" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Mobile Stats */}
                                        <div className="md:hidden mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-xs text-gray-500">Omzet</p>
                                                <p className="text-sm font-bold text-green-600">{formatCurrency(tenant.total_omzet)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Pemasukan</p>
                                                <p className="text-sm font-bold text-emerald-600">{formatCurrency(tenant.total_pemasukan)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Branch Details */}
                                    {expandedTenant === tenant.tenant_id && (
                                        <div className="bg-gray-50 px-4 pb-4">
                                            {branchLoading[tenant.tenant_id] ? (
                                                <div className="py-4 text-center">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                                </div>
                                            ) : branchData[tenant.tenant_id]?.branches?.length > 0 ? (
                                                <div className="space-y-2">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-2">
                                                        Detail Cabang
                                                    </p>
                                                    {branchData[tenant.tenant_id].branches.map((branch, idx) => (
                                                        <div
                                                            key={branch.branch_id}
                                                            className="bg-white rounded-lg p-3 border border-gray-200"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                                    <FaStore className="text-gray-500 text-sm" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                                        {branch.branch_name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {branch.city || '-'} • {branch.total_orders} orders
                                                                    </p>
                                                                </div>
                                                                <div className="text-right space-y-1">
                                                                    <div>
                                                                        <p className="text-xs text-gray-400">Omzet</p>
                                                                        <p className="text-sm font-bold text-green-600">
                                                                            {formatCurrency(branch.total_omzet)}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-400">Pemasukan</p>
                                                                        <p className="text-sm font-bold text-emerald-600">
                                                                            {formatCurrency(branch.total_pemasukan)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-4 text-center text-sm text-gray-500">
                                                    Tidak ada data cabang
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
                        <FaReceipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Tidak ada data
                        </h3>
                        <p className="text-gray-500">
                            Belum ada data omzet untuk periode ini.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperAppTopTenantOmzet;
