import React from 'react';
import AnimatedButton from '../../../components/Design/AnimatedButton';

const FinanceTransactionTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { key: 'all', label: 'Semua', count: null },
    { key: 'income', label: 'Income', count: null },
    { key: 'expense', label: 'Expense', count: null }
  ];

  return (
    <div className="mb-6 relative z-10">
      <h2 className="text-lg font-semibold font-montserrat mb-4">Transaksi</h2>
      
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl relative z-10">
        {tabs.map((tab) => (
          <AnimatedButton
            key={tab.key}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all relative z-10 cursor-pointer ${
              activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => onTabChange(tab.key)}
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            {tab.label}
            {tab.count !== null && (
              <span className="ml-2 bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
                {tab.count}
              </span>
            )}
          </AnimatedButton>
        ))}
      </div>
    </div>
  );
};

export default FinanceTransactionTabs;
