import React, { useState, useEffect } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import tenantService from '../services/tenantService';

/**
 * Billing History Modal - Simple & Minimalist
 */
const BillingHistoryModal = ({ tenant, onClose }) => {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchBillings();
  }, [page]);

  const fetchBillings = async () => {
    try {
      setLoading(true);
      const response = await tenantService.getAllBillings(tenant.id, page, 10);
      
      if (response.success) {
        // Handle different response structures
        const data = response.data;
        if (Array.isArray(data)) {
          setBillings(data);
        } else if (data.billings) {
          setBillings(data.billings);
          setTotalPages(data.pagination?.total_pages || 1);
        } else {
          setBillings([]);
        }
      }
    } catch (error) {
      console.error('Error fetching billing history:', error);
      setBillings([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
      unpaid: { bg: 'bg-red-100', text: 'text-red-700', label: 'Unpaid' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      failed: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Failed' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Cancelled' }
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.unpaid;

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Billing History</h2>
            <p className="text-sm text-gray-500 mt-1">{tenant.business_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="text-sm text-gray-500 mt-2">Loading billings...</p>
            </div>
          ) : billings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No billing history found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billings.map((billing) => (
                    <tr key={billing.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">
                          {billing.invoice_number || `INV-${billing.id}`}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(billing.amount)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(billing.due_date)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getStatusBadge(billing.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {billing.payment_method || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(billing.createdAt || billing.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        {!loading && billings.length > 0 && totalPages > 1 && (
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaChevronLeft className="text-gray-600" size={14} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaChevronRight className="text-gray-600" size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingHistoryModal;

