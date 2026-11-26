import React, { useState, useEffect } from 'react';
import { FaWrench, FaEdit, FaSave, FaTimes, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import tenantService from '../services/tenantService';

/**
 * ManualBillingFixPanel
 * 
 * Digunakan untuk memperbaiki data billing secara manual ketika
 * QRIS callback bermasalah dan status tidak terupdate otomatis.
 * 
 * Mengubah:
 * - Subscription: plan_id, end_date, price, final_price, notes
 * - Payment: status (→ paid), paid_at
 */
const ManualBillingFixPanel = ({ subscription, payment, onSuccess }) => {
  const [editingSubscription, setEditingSubscription] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
  const [savingSubscription, setSavingSubscription] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);

  // Subscription form state
  const [subForm, setSubForm] = useState({
    plan_id: '',
    end_date: '',
    price: '',
    final_price: '',
    notes: ''
  });

  // Payment form state
  const [payForm, setPayForm] = useState({
    status: '',
    paid_at: ''
  });

  // Alert state
  const [alert, setAlert] = useState(null); // { type: 'success'|'error', message: '' }

  // Populate form saat subscription/payment berubah
  useEffect(() => {
    if (subscription) {
      setSubForm({
        plan_id: subscription.plan_id || '',
        end_date: subscription.end_date ? toDatetimeLocal(subscription.end_date) : '',
        price: subscription.price || '',
        final_price: subscription.final_price || '',
        notes: subscription.notes || ''
      });
    }
  }, [subscription]);

  useEffect(() => {
    if (payment) {
      setPayForm({
        status: payment.status || '',
        paid_at: payment.paid_at ? toDatetimeLocal(payment.paid_at) : ''
      });
    }
  }, [payment]);

  // Ambil daftar plan saat membuka form subscription
  useEffect(() => {
    if (editingSubscription && plans.length === 0) {
      fetchPlans();
    }
  }, [editingSubscription]);

  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      const response = await tenantService.getSubscriptionPlans();
      if (response.success) {
        setPlans(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setPlansLoading(false);
    }
  };

  const toDatetimeLocal = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    // Format: YYYY-MM-DDTHH:mm (required by datetime-local input)
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleSaveSubscription = async () => {
    if (!subscription?.id) return;
    try {
      setSavingSubscription(true);
      const payload = {};
      if (subForm.plan_id) payload.plan_id = parseInt(subForm.plan_id);
      if (subForm.end_date) payload.end_date = new Date(subForm.end_date).toISOString();
      if (subForm.price !== '') payload.price = parseFloat(subForm.price);
      if (subForm.final_price !== '') payload.final_price = parseFloat(subForm.final_price);
      if (subForm.notes !== '') payload.notes = subForm.notes;

      await tenantService.updateSubscription(subscription.id, payload);
      setEditingSubscription(false);
      showAlert('success', 'Subscription berhasil diupdate!');
      if (onSuccess) onSuccess();
    } catch (error) {
      showAlert('error', error?.response?.data?.error?.message || error.message || 'Gagal update subscription');
    } finally {
      setSavingSubscription(false);
    }
  };

  const handleSavePayment = async () => {
    if (!payment?.id) return;
    try {
      setSavingPayment(true);
      const payload = {};
      if (payForm.status) payload.status = payForm.status;
      if (payForm.paid_at) payload.paid_at = new Date(payForm.paid_at).toISOString();
      // Jika status paid dan paid_at kosong, isi otomatis dengan sekarang
      if (payForm.status === 'paid' && !payForm.paid_at) {
        payload.paid_at = new Date().toISOString();
      }

      await tenantService.updatePayment(payment.id, payload);
      setEditingPayment(false);
      showAlert('success', 'Payment berhasil diupdate!');
      if (onSuccess) onSuccess();
    } catch (error) {
      showAlert('error', error?.response?.data?.error?.message || error.message || 'Gagal update payment');
    } finally {
      setSavingPayment(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Jika tidak ada subscription dan payment, jangan render
  if (!subscription && !payment) return null;

  return (
    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <FaWrench className="text-amber-600" size={14} />
        <h3 className="text-sm font-semibold text-amber-900 uppercase tracking-wide">
          Manual Billing Fix
        </h3>
        <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
          Admin Only
        </span>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-sm font-medium ${alert.type === 'success'
          ? 'bg-green-50 border border-green-200 text-green-800'
          : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
          {alert.type === 'success'
            ? <FaCheckCircle size={14} className="shrink-0" />
            : <FaExclamationTriangle size={14} className="shrink-0" />
          }
          {alert.message}
        </div>
      )}

      <div className="space-y-4">
        {/* ==================== SUBSCRIPTION PANEL ==================== */}
        {subscription && (
          <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
            {/* Sub-header */}
            <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-200">
              <div>
                <div className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Subscription</div>
                <div className="text-xs text-amber-600 mt-0.5">ID: {subscription.id}</div>
              </div>
              {!editingSubscription ? (
                <button
                  onClick={() => setEditingSubscription(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                >
                  <FaEdit size={11} /> Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingSubscription(false)}
                    disabled={savingSubscription}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <FaTimes size={11} /> Batal
                  </button>
                  <button
                    onClick={handleSaveSubscription}
                    disabled={savingSubscription}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {savingSubscription
                      ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      : <FaSave size={11} />
                    }
                    Simpan
                  </button>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-4">
              {!editingSubscription ? (
                /* VIEW MODE */
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Plan</div>
                    <div className="font-medium text-gray-900 mt-0.5">{subscription.plan?.name || `Plan #${subscription.plan_id}`}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">End Date</div>
                    <div className="font-medium text-gray-900 mt-0.5">{formatDate(subscription.end_date)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Price</div>
                    <div className="font-medium text-gray-900 mt-0.5">{formatCurrency(subscription.price)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Final Price</div>
                    <div className="font-medium text-gray-900 mt-0.5">{formatCurrency(subscription.final_price)}</div>
                  </div>
                  {subscription.notes && (
                    <div className="col-span-2">
                      <div className="text-xs text-gray-500">Notes</div>
                      <div className="font-medium text-gray-900 mt-0.5 text-xs">{subscription.notes}</div>
                    </div>
                  )}
                </div>
              ) : (
                /* EDIT MODE */
                <div className="space-y-3">
                  {/* Plan ID */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Plan</label>
                    {plansLoading ? (
                      <div className="text-xs text-gray-500">Memuat daftar plan...</div>
                    ) : (
                      <select
                        value={subForm.plan_id}
                        onChange={(e) => setSubForm(f => ({ ...f, plan_id: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                      >
                        <option value="">-- Pilih Plan --</option>
                        {plans.map(plan => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} ({new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(plan.price)})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Berakhir</label>
                    <input
                      type="datetime-local"
                      value={subForm.end_date}
                      onChange={(e) => setSubForm(f => ({ ...f, end_date: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    />
                  </div>

                  {/* Price & Final Price */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Price (Rp)</label>
                      <input
                        type="number"
                        value={subForm.price}
                        onChange={(e) => setSubForm(f => ({ ...f, price: e.target.value }))}
                        placeholder="0"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Final Price (Rp)</label>
                      <input
                        type="number"
                        value={subForm.final_price}
                        onChange={(e) => setSubForm(f => ({ ...f, final_price: e.target.value }))}
                        placeholder="0"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={subForm.notes}
                      onChange={(e) => setSubForm(f => ({ ...f, notes: e.target.value }))}
                      rows={2}
                      placeholder="Catatan manual fix..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== PAYMENT PANEL ==================== */}
        {payment && (
          <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
            {/* Sub-header */}
            <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-200">
              <div>
                <div className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Payment</div>
                <div className="text-xs text-amber-600 mt-0.5">
                  {payment.invoice_number || `INV-${payment.id}`} · ID: {payment.id}
                </div>
              </div>
              {!editingPayment ? (
                <button
                  onClick={() => setEditingPayment(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                >
                  <FaEdit size={11} /> Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingPayment(false)}
                    disabled={savingPayment}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <FaTimes size={11} /> Batal
                  </button>
                  <button
                    onClick={handleSavePayment}
                    disabled={savingPayment}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {savingPayment
                      ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      : <FaSave size={11} />
                    }
                    Simpan
                  </button>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-4">
              {!editingPayment ? (
                /* VIEW MODE */
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Status</div>
                    <div className="mt-0.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          payment.status === 'unpaid' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                        {payment.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Paid At</div>
                    <div className="font-medium text-gray-900 mt-0.5">{formatDate(payment.paid_at) || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Amount</div>
                    <div className="font-medium text-gray-900 mt-0.5">{formatCurrency(payment.amount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Method</div>
                    <div className="font-medium text-gray-900 mt-0.5">{payment.payment_method || '-'}</div>
                  </div>
                </div>
              ) : (
                /* EDIT MODE */
                <div className="space-y-3">
                  {/* Status */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={payForm.status}
                      onChange={(e) => setPayForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    >
                      <option value="">-- Pilih Status --</option>
                      <option value="unpaid">Unpaid</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid ✓</option>
                      <option value="failed">Failed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Paid At */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Paid At
                      {payForm.status === 'paid' && !payForm.paid_at && (
                        <span className="ml-2 text-xs text-amber-600 font-normal">(akan diisi otomatis sekarang)</span>
                      )}
                    </label>
                    <input
                      type="datetime-local"
                      value={payForm.paid_at}
                      onChange={(e) => setPayForm(f => ({ ...f, paid_at: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    />
                  </div>

                  {payForm.status === 'paid' && (
                    <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <FaCheckCircle className="text-green-600 mt-0.5 shrink-0" size={13} />
                      <p className="text-xs text-green-800">
                        Mengubah status ke <strong>PAID</strong> akan menandai pembayaran ini lunas.
                        Pastikan pembayaran sudah diterima sebelum menyimpan.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualBillingFixPanel;
