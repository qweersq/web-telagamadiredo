import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Clock, ChevronRight, Loader2 } from 'lucide-react';
import AnimatedButton from '../../../components/Design/AnimatedButton';

const FinanceTransactionList = ({ 
  transactions, 
  loading, 
  error, 
  onTransactionClick, 
  onLoadMore, 
  loadingMore, 
  hasNext 
}) => {
  // Debug logging for props
  console.log('FinanceTransactionList props:', {
    transactionsCount: transactions?.length || 0,
    loading,
    loadingMore,
    hasNext,
    hasError: !!error
  });
  const formatCurrency = (amount) => {
    // Use absolute value for formatting to avoid double signs
    const absoluteAmount = Math.abs(amount || 0);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(absoluteAmount);
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    if (type === 'income') {
      return <TrendingUp className="w-5 h-5 text-green-600" />;
    }
    return <TrendingDown className="w-5 h-5 text-red-600" />;
  };

  // Function to determine transaction icon based on sign
  const getTransactionIconBySign = (transaction) => {
    const sign = getTransactionSign(transaction);
    if (sign === '+') {
      return <TrendingUp className="w-5 h-5 text-green-600" />;
    }
    return <TrendingDown className="w-5 h-5 text-red-600" />;
  };

  const getTransactionColor = (type) => {
    if (type === 'income') {
      return 'text-green-600';
    }
    return 'text-red-600';
  };

  // Function to determine transaction color based on sign
  const getTransactionColorBySign = (transaction) => {
    const sign = getTransactionSign(transaction);
    return sign === '+' ? 'text-green-600' : 'text-red-600';
  };

  const getTransactionBgColor = (type) => {
    if (type === 'income') {
      return 'bg-green-100';
    }
    return 'bg-red-100';
  };

  // Function to determine transaction background color based on sign
  const getTransactionBgColorBySign = (transaction) => {
    const sign = getTransactionSign(transaction);
    if (sign === '+') {
      return 'bg-green-100';
    }
    return 'bg-red-100';
  };

  // Function to determine transaction sign based on description and type
  const getTransactionSign = (transaction) => {
    const description = transaction.description?.toLowerCase() || '';
    const type = transaction.type;
    const accountName = transaction.account_name?.toLowerCase() || '';
    const amount = transaction.amount;
    
    // Check if amount already has a sign (negative value)
    const isAmountNegative = amount < 0;
    
    // Check for transfer-related keywords
    const transferKeywords = [
      'transfer', 'pindah', 'mutasi', 'internal', 'cash to bank', 
      'bank to cash', 'setor', 'tarik', 'deposit', 'withdraw'
    ];
    
    // Check if it's a transfer transaction
    const isTransfer = transferKeywords.some(keyword => 
      description.includes(keyword)
    );
    
    // For transfer transactions, determine sign based on context
    if (isTransfer) {
      // Check if this is a transfer TO bank (from cash)
      if (description.includes('to bca') || description.includes('to bank') || 
          description.includes('ke bca') || description.includes('ke bank')) {
        // If account is cash, it's outgoing (negative)
        if (accountName.includes('cash') || accountName.includes('office cash')) {
          return isAmountNegative ? '' : '-'; // If already negative, don't add sign
        }
        // If account is bank, it's incoming (positive)
        if (accountName.includes('bca') || accountName.includes('bank')) {
          return isAmountNegative ? '' : '+'; // If already negative, don't add sign
        }
      }
      
      // Check if this is a transfer FROM bank (to cash)
      if (description.includes('from bca') || description.includes('from bank') || 
          description.includes('dari bca') || description.includes('dari bank')) {
        // If account is cash, it's incoming (positive)
        if (accountName.includes('cash') || accountName.includes('office cash')) {
          return isAmountNegative ? '' : '+'; // If already negative, don't add sign
        }
        // If account is bank, it's outgoing (negative)
        if (accountName.includes('bca') || accountName.includes('bank')) {
          return isAmountNegative ? '' : '-'; // If already negative, don't add sign
        }
      }
      
      // For general transfer keywords
      if (description.includes('setor') || description.includes('deposit')) {
        // If account is cash, it's outgoing (negative)
        if (accountName.includes('cash') || accountName.includes('office cash')) {
          return isAmountNegative ? '' : '-'; // If already negative, don't add sign
        }
        // If account is bank, it's incoming (positive)
        if (accountName.includes('bca') || accountName.includes('bank')) {
          return isAmountNegative ? '' : '+'; // If already negative, don't add sign
        }
      }
      
      if (description.includes('tarik') || description.includes('withdraw')) {
        // If account is cash, it's incoming (positive)
        if (accountName.includes('cash') || accountName.includes('office cash')) {
          return isAmountNegative ? '' : '+'; // If already negative, don't add sign
        }
        // If account is bank, it's outgoing (negative)
        if (accountName.includes('bca') || accountName.includes('bank')) {
          return isAmountNegative ? '' : '-'; // If already negative, don't add sign
        }
      }
      
      // Default for transfer: determine based on account type
      if (accountName.includes('cash') || accountName.includes('office cash')) {
        // For cash accounts in transfers, usually outgoing (negative)
        return isAmountNegative ? '' : '-'; // If already negative, don't add sign
      }
      if (accountName.includes('bca') || accountName.includes('bank')) {
        // For bank accounts in transfers, usually incoming (positive)
        return isAmountNegative ? '' : '+'; // If already negative, don't add sign
      }
      
      // Fallback: negative (money going out)
      return isAmountNegative ? '' : '-'; // If already negative, don't add sign
    }
    
    // For non-transfer transactions, use the type
    if (type === 'income') {
      return isAmountNegative ? '' : '+'; // If already negative, don't add sign
    } else {
      return isAmountNegative ? '' : '-'; // If already negative, don't add sign
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 outline outline-2 outline-[#EEF1F7] animate-pulse">
            <div className="flex items-start gap-2 md:gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-16 flex-shrink-0"></div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-20 flex-shrink-0"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-6 outline outline-2 outline-[#EEF1F7] text-center">
        <div className="text-red-500 mb-2">⚠️</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <div className="flex gap-2 justify-center">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            onClick={() => window.location.reload()}
          >
            Refresh Halaman
          </button>
          <button 
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            onClick={() => window.history.back()}
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 outline outline-2 outline-[#EEF1F7] text-center">
        <div className="text-gray-400 mb-2">📊</div>
        <p className="text-gray-600">Belum ada transaksi untuk periode ini</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction, index) => (
        <div
          key={transaction.id}
          className="bg-white rounded-2xl p-3 md:p-4 outline outline-2 outline-[#EEF1F7] cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => onTransactionClick(transaction)}
        >
          <div className="flex items-start gap-2 md:gap-3">
            {/* Icon */}
            <div className={`w-10 h-10 ${getTransactionBgColorBySign(transaction)} rounded-lg flex items-center justify-center flex-shrink-0`}>
              {getTransactionIconBySign(transaction)}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title and Category */}
              <div className="flex items-start gap-2 mb-1">
                <h3 className="font-medium text-gray-800 truncate flex-1 text-sm md:text-base">
                  {transaction.description || 'Transaksi'}
                </h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex-shrink-0">
                  {transaction.category_name || 'Umum'}
                </span>
              </div>
              
              {/* Date and Account */}
              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 mb-2">
                <div className="flex items-center gap-1 min-w-0">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{formatDateTime(transaction.date)}</span>
                </div>
                <span className="flex-shrink-0">•</span>
                <span className="truncate">{transaction.account_name || 'Cash'}</span>
              </div>
            </div>
            
            {/* Amount and Arrow */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-base md:text-lg font-bold ${getTransactionColorBySign(transaction)} text-right`}>
                {getTransactionSign(transaction)}{formatCurrency(transaction.amount)}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>
          </div>
        </div>
      ))}
      
      {/* Load More Button */}
      {hasNext && transactions.length > 0 && (
        <div className="flex justify-center py-4">
          <AnimatedButton
            onClick={onLoadMore}
            disabled={loadingMore}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              loadingMore 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
            }`}
          >
            {loadingMore ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memuat...</span>
              </div>
            ) : (
              'Load More'
            )}
          </AnimatedButton>
        </div>
      )}
      
      {/* End of List Indicator */}
      {!hasNext && transactions.length > 0 && (
        <div className="text-center py-4">
          <span className="text-sm text-gray-400">Semua transaksi telah dimuat</span>
        </div>
      )}
    </div>
  );
};

export default FinanceTransactionList;
