import React from 'react';
import AnimatedButton from '../../../components/Design/AnimatedButton';

const FinanceIncomeSubTabs = ({ activeSubTab, onSubTabChange, transactions, loading, accountSummary }) => {
  // Generate dynamic tabs based on payment methods from accountSummary
  const generateDynamicTabs = () => {
    if (!accountSummary || accountSummary.length === 0) {
      return [{ key: 'all', label: 'Semua', count: 0 }];
    }

    const paymentMethodGroups = {};
    let totalCount = 0;

    // Group accounts by payment method
    accountSummary.forEach(account => {
      const methodName = account.payment_method_name || 'Unknown';
      const count = account.transaction_count || 0;
      totalCount += count;
      
      // Create key from payment method name (lowercase, replace spaces with underscores)
      const methodKey = methodName.toLowerCase().replace(/\s+/g, '_');
      
      if (!paymentMethodGroups[methodKey]) {
        paymentMethodGroups[methodKey] = {
          key: methodKey,
          label: methodName,
          count: 0
        };
      }
      paymentMethodGroups[methodKey].count += count;
    });

    // Create tabs array with "All" first, then payment method tabs
    const tabs = [
      { key: 'all', label: 'Semua', count: totalCount },
      ...Object.values(paymentMethodGroups)
    ];

    return tabs;
  };

  const subTabs = generateDynamicTabs();
  
  // Debug logging
  console.log('FinanceIncomeSubTabs - accountSummary:', accountSummary);
  console.log('FinanceIncomeSubTabs - generated tabs:', subTabs);
  console.log('FinanceIncomeSubTabs - transactions length:', transactions?.length);

  return (
    <div className="mb-4 relative z-20" style={{ position: 'relative', zIndex: 20 }}>
      <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide px-1 relative z-20" style={{ position: 'relative', zIndex: 20 }}>
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              console.log('Tab clicked:', tab.key);
              onSubTabChange(tab.key);
            }}
            className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-medium transition-all duration-200 whitespace-nowrap min-w-fit cursor-pointer touch-manipulation button-touch min-touch-target relative z-20 pointer-events-auto ${
              activeSubTab === tab.key
                ? 'bg-green-100 text-green-700 border-2 border-green-300 shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
            }`}
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              cursor: 'pointer',
              pointerEvents: 'auto'
            }}
          >
            <span className="font-medium pointer-events-none">{tab.label}</span>
            <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-xs font-bold min-w-[18px] md:min-w-[20px] text-center pointer-events-none ${
              activeSubTab === tab.key
                ? 'bg-green-200 text-green-800'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FinanceIncomeSubTabs;
