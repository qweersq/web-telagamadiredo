import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, ChevronDown, ArrowRightLeft, Globe, Building } from 'lucide-react';
import AnimatedButton from '../../../components/Design/AnimatedButton';
import FinanceTransferModal from './FinanceTransferModal';
import HelpTooltip from '../../../components/WhatsAppTemplate/HelpTooltip';

const FinanceAccountSummaryCards = ({ 
  accountSummary, 
  loading, 
  type = 'income', // 'income', 'expense', 'profit'
  title = 'Ringkasan Account',
  filterInfo,
  onTransferSuccess
}) => {
  const [showAll, setShowAll] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  // Get icon based on type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'income':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'expense':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'profit':
        return <DollarSign className="w-4 h-4 text-blue-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  // Get color classes based on type
  const getTypeColors = (type) => {
    switch (type) {
      case 'income':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          amount: 'text-green-600'
        };
      case 'expense':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          amount: 'text-red-600'
        };
      case 'profit':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          amount: 'text-blue-600'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          amount: 'text-gray-600'
        };
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Get account type icon
  const getAccountTypeIcon = (accountName) => {
    const name = accountName?.toLowerCase() || '';
    if (name.includes('qris')) return '📱';
    if (name.includes('bank') || name.includes('bca') || name.includes('mandiri')) return '🏦';
    if (name.includes('cash')) return '💵';
    return '💰';
  };

  // Render filter badge
  const renderFilterBadge = () => {
    if (!filterInfo) return null;

    if (filterInfo.is_all_branches) {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
          <Globe className="w-3 h-3" />
          <span>Semua Cabang</span>
        </div>
      );
    } else if (filterInfo.is_specific_branch) {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
          <Building className="w-3 h-3" />
          <span>{filterInfo.branch_name || 'Cabang Spesifik'}</span>
        </div>
      );
    }
    return null;
  };

  const colors = getTypeColors(type);

  // Sort accounts: Global accounts first, then branch-specific accounts
  // Within each group, sort by balance (highest first)
  const sortedAccounts = [...(accountSummary || [])].sort((a, b) => {
    // First, sort by global status (global accounts first)
    if (a.is_global && !b.is_global) return -1;
    if (!a.is_global && b.is_global) return 1;
    
    // If both are same type (both global or both branch-specific), sort by balance
    return Math.abs(b.total_amount || 0) - Math.abs(a.total_amount || 0);
  });
  
  const displayedAccounts = showAll ? sortedAccounts : sortedAccounts.slice(0, 3);
  const hasMoreAccounts = sortedAccounts.length > 3;

  if (loading) {
    return (
      <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
              </div>
              <div>
                <div className="h-5 bg-gray-300 rounded w-24 mb-1 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            </div>
            <div className="h-8 bg-gray-300 rounded-lg w-20 animate-pulse"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!accountSummary || accountSummary.length === 0) {
    return (
      <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                {getTypeIcon(type)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 font-montserrat">{title}</h3>
                <p className="text-sm text-gray-500 font-montserrat">Saldo akun keuangan</p>
              </div>
            </div>
          </div>
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-montserrat text-sm">Tidak ada data untuk periode ini</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              {getTypeIcon(type)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 font-montserrat">{title}</h3>
              <div className="flex items-center gap-2 mt-1">
                {renderFilterBadge()}
              </div>
            </div>
          </div>
          {title === 'Saldo Akun' && (
            <div className="flex items-center gap-2">
              <AnimatedButton
                onClick={() => setShowTransferModal(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <ArrowRightLeft className="w-4 h-4" />
                Transfer
              </AnimatedButton>
              <HelpTooltip 
                title="Transfer Saldo Antar Akun"
                content="Transfer saldo dari satu akun ke akun lainnya. Contoh: QRIS ke Bank, Cash ke Bank, dll. Transfer akan mengurangi saldo akun sumber dan menambah saldo akun tujuan."
                position="top"
                size="md"
              />
            </div>
          )}
        </div>

        {/* Account List */}
        <div className="space-y-3">
          {displayedAccounts.map((account) => (
            <div
              key={account.account_id}
              className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-lg">{getAccountTypeIcon(account.account_name)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-800 text-sm font-montserrat">
                        {account.account_name}
                      </h4>
                      {account.is_global && (
                        <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                          Global
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-montserrat">
                      {account.payment_method_name || 'Akun Keuangan'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-800 font-montserrat">
                    {formatCurrency(account.total_amount)}
                  </div>
                  <div className="text-xs text-gray-500 font-montserrat">
                    {account.transaction_count || 0} transaksi
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Load More Button */}
          {hasMoreAccounts && (
            <div className="pt-2">
              <AnimatedButton
                onClick={() => setShowAll(!showAll)}
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
                {showAll ? 'Tampilkan Lebih Sedikit' : `Tampilkan ${sortedAccounts.length - 3} Lainnya`}
              </AnimatedButton>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Modal */}
      <FinanceTransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        accounts={accountSummary || []}
        onSuccess={(result) => {
          setShowTransferModal(false);
          if (onTransferSuccess) {
            onTransferSuccess(result);
          }
        }}
      />
    </div>
  );
};

export default FinanceAccountSummaryCards;
