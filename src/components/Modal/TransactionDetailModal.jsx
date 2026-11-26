import React from 'react';
import { X, Receipt, Banknote, CreditCard, QrCode, User, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/labelFormatter';
import { formatPaymentMethod } from '../../utils/labelFormatter';

const TransactionDetailModal = ({ isOpen, onClose, account }) => {
  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header - Compact */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              {account.account_type === 'cash' && <Banknote className="w-4 h-4 text-white" />}
              {account.account_type === 'bank' && <CreditCard className="w-4 h-4 text-white" />}
              {account.account_type === 'qris' && <QrCode className="w-4 h-4 text-white" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 font-['Montserrat']">
                {account.account_name}
              </h2>
              <div className="flex items-center gap-3 text-sm text-gray-600 font-['Montserrat']">
                <span>{account.transactions?.length || 0} transaksi</span>
                <span>•</span>
                <span className="capitalize">{account.account_type}</span>
                <span>•</span>
                <span className="font-semibold text-green-600">{formatCurrency(account.inflow)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3 text-gray-600" />
          </button>
        </div>

        {/* Account Summary - Compact */}
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-500 font-['Montserrat']">Masuk</div>
                <div className="text-sm font-bold text-green-600 font-['Montserrat']">
                  {formatCurrency(account.inflow)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 font-['Montserrat']">Keluar</div>
                <div className="text-sm font-bold text-red-600 font-['Montserrat']">
                  {formatCurrency(account.outflow)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 font-['Montserrat']">Net</div>
                <div className={`text-sm font-bold font-['Montserrat'] ${account.inflow - account.outflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(account.inflow - account.outflow)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 font-['Montserrat']">Total Transaksi</div>
              <div className="text-sm font-bold text-blue-600 font-['Montserrat']">
                {account.transactions?.length || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Content - Compact */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-3">
            {/* Transactions Table - Compact */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider font-['Montserrat']">
                      Order/Customer
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider font-['Montserrat']">
                      Jumlah
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider font-['Montserrat']">
                      Metode
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider font-['Montserrat']">
                      Waktu
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {account.transactions?.map((transaction, index) => (
                    <tr key={transaction.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-xs font-['Montserrat']">
                              {transaction.order_id ? `#${transaction.order_id}` : `#${transaction.id}`}
                            </div>
                            <div className="text-xs text-gray-500 font-['Montserrat'] truncate max-w-24">
                              {transaction.customer_name || 'Customer'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <DollarSign className="w-3 h-3 text-green-600" />
                          <span className="font-bold text-green-600 text-xs font-['Montserrat']">
                            {formatCurrency(transaction.amount)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 font-['Montserrat']">
                          {formatPaymentMethod(transaction.method)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500 font-['Montserrat']">
                            {formatDate(transaction.time, { includeTime: true })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State - Compact */}
            {(!account.transactions || account.transactions.length === 0) && (
              <div className="text-center py-8">
                <Receipt className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <h3 className="text-sm font-medium text-gray-900 font-['Montserrat'] mb-1">
                  Tidak ada transaksi
                </h3>
                <p className="text-xs text-gray-500 font-['Montserrat']">
                  Belum ada transaksi untuk akun {account.account_name}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Compact */}
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-600 font-['Montserrat']">
              {account.transactions?.length || 0} transaksi
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-xs font-['Montserrat'] transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;
