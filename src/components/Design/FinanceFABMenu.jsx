import React, { useState } from 'react';
import { useCurrentUserRole } from '../../utils/roleValidator';

const financeMenuItems = [
  {
    key: 'external-income',
    label: 'Add External Income',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
  {
    key: 'cash-to-bank',
    label: 'Cash to Bank',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        <path d="M3 12h18"/>
      </svg>
    ),
  },
  {
    key: 'expenses',
    label: 'Add Expenses',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        <path d="M3 12h18"/>
        <path d="M9 12l6 0"/>
      </svg>
    ),
  },
];

const FinanceFABMenu = ({ onExternalIncome, onCashToBank, onExpenses }) => {
  // Check if user is superadmin
  const { userRole } = useCurrentUserRole();
  const isSuperAdmin = userRole === 'superadmin';
  
  // Debug logging
  console.log('FinanceFABMenu - User role:', userRole, 'Is superadmin:', isSuperAdmin);
  
  // If not superadmin, don't render the menu
  if (!isSuperAdmin) {
    console.log('FinanceFABMenu - User is not superadmin, hiding menu');
    return null;
  }
  const [open, setOpen] = useState(false);

  const handleClick = (key) => {
    setOpen(false);
    if (key === 'external-income' && onExternalIncome) onExternalIncome();
    if (key === 'cash-to-bank' && onCashToBank) onCashToBank();
    if (key === 'expenses' && onExpenses) onExpenses();
  };

  return (
    <>
      {/* Overlay untuk klik di luar menu */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Speed dial menu */}
        <div className={`flex flex-col items-end mb-2 transition-all duration-200 ${open ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-2'}`}>
          {financeMenuItems.map((item, idx) => (
            <button
              key={item.key}
              onClick={() => handleClick(item.key)}
              className="flex items-center gap-2 mb-2 px-4 py-2 rounded-xl bg-white shadow-lg text-gray-800 font-montserrat text-sm hover:bg-green-50 active:scale-95 transition-all min-w-[140px]"
              style={{ transitionDelay: open ? `${idx * 40}ms` : '0ms' }}
            >
              <span className="text-green-500">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        {/* FAB */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`w-16 h-16 rounded-full bg-green-500 shadow-xl flex items-center justify-center hover:bg-green-600 active:scale-95 transition-all duration-150 ${open ? 'rotate-45' : ''}`}
          aria-label="Finance Menu"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
    </>
  );
};

export default FinanceFABMenu;
