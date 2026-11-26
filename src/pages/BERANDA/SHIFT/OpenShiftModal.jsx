import React, {useState} from 'react';
import AnimatedButton from '../../../components/Design/AnimatedButton';
import {useShift} from '../../../contexts/ShiftContext';
import instance from '../../../config/api';
import {getUserProfile, getShiftDetailFull, invalidateUserProfileCache} from '../../../utils/userProfileHelper';
import {formatPaymentMethod, getPaymentMethodColors} from '../../../utils/labelFormatter';

const OpenShiftModal = ({ open, onClose }) => {
  const shiftContext = useShift();

  // Handle case when useShift returns undefined
  if (!shiftContext) {
    console.error('❌ OpenShiftModal - ShiftContext is not available. Make sure ShiftProvider is wrapping this component.');
    return null;
  }

  const { shift, expenses, loading, fetchProfileAndShift, createExpense, endShift, openShift } = shiftContext;
  const [showEndShiftModal, setShowEndShiftModal] = useState(false);
  const [kasAkhirInput, setKasAkhirInput] = useState('');
  const [endShiftError, setEndShiftError] = useState('');
  const [showPengeluaranModal, setShowPengeluaranModal] = useState(false);
  const [pengeluaran, setPengeluaran] = useState('');
  const [catatan, setCatatan] = useState('');
  const [pengeluaranError, setPengeluaranError] = useState('');
  // Tambahan untuk input saldo awal kas
  const [saldoAwalInput, setSaldoAwalInput] = useState('');
  const [openShiftError, setOpenShiftError] = useState('');
  // State untuk finance accounts
  const [financeAccounts, setFinanceAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [showAccountDetailModal, setShowAccountDetailModal] = useState(false);
  const [showTransactionDetailModal, setShowTransactionDetailModal] = useState(false);
  const [selectedAccountForTransaction, setSelectedAccountForTransaction] = useState(null);
  const [shiftDetail, setShiftDetail] = useState(null);
  const [loadingShiftDetail, setLoadingShiftDetail] = useState(false);
  const [isOpeningShift, setIsOpeningShift] = useState(false);
  const [isEndingShift, setIsEndingShift] = useState(false);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Helper functions untuk format number dengan pemisah titik
  const formatNumber = (value) => {
    // Hapus semua karakter non-digit
    const numericValue = value.replace(/\D/g, '');
    // Format dengan pemisah titik setiap 3 digit
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseNumber = (formattedValue) => {
    // Hapus pemisah titik dan return sebagai number
    return parseInt(formattedValue.replace(/\./g, '')) || 0;
  };

  // Fetch cash accounts
  const fetchCashAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const profile = await getUserProfile();
      if (!profile?.tenant?.id) return;

      // Prepare params with tenant_id, branch_id, and is_active
      const params = {
        tenant_id: profile.tenant.id,
        is_active: true
      };

      // Add branch_id if available
      if (profile.branch?.id) {
        params.branch_id = profile.branch.id;
      }

      const { data } = await instance.get('/finance-accounts', { params });

      // Ambil semua finance accounts tanpa filter type
      const allAccounts = data.data;
      setFinanceAccounts(allAccounts);

      // Set default selected account jika ada
      if (allAccounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(allAccounts[0].id);
      }

    } catch (err) {
      console.error('❌ Failed to fetch finance accounts:', err);
      setFinanceAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // ✅ Fetch shift detail lengkap saat dibutuhkan
  const fetchShiftDetail = async () => {
    if (!shift?.id) return;

    setLoadingShiftDetail(true);
    try {
      const fullShiftDetail = await getShiftDetailFull(shift.id);
      setShiftDetail(fullShiftDetail);
    } catch (err) {
      console.error('❌ Failed to fetch shift detail:', err);
      setShiftDetail(null);
    } finally {
      setLoadingShiftDetail(false);
    }
  };

  if (!open) return null;

  const isShiftOpen = !!shift && !shift.end_time;
  const saldoAwal = parseFloat(shift?.cash_initial || 0);
  const kasMasuk = parseFloat(shift?.cash_inflow || 0);
  const kasKeluar = parseFloat(shift?.cash_outflow || 0);
  // Perhitungan saldo akhir yang benar: Saldo Awal + Kas Masuk - Kas Keluar
  const saldoAkhir = parseFloat(shift?.cash_balance || 0);
  const totalPengeluaran = kasKeluar;

  // Helper untuk extract error message
  const getErrorMessage = (error) => {
    const message = error?.response?.data?.message || error?.response?.data?.error?.message || error?.message || '';

    // Map error message BE ke FE yang user-friendly
    if (message.includes('already an active shift') || message.includes('active shift')) {
      return 'Shift sudah dibuka oleh user lain. Silakan refresh halaman untuk melihat data terbaru.';
    }
    if (message.includes('Cash initial must be')) {
      return 'Saldo awal kas tidak valid.';
    }

    return message || 'Gagal membuka shift. Silakan coba lagi.';
  };

  // Handler open shift (panggil context openShift)
  const handleOpenShift = async () => {
    if (isOpeningShift) return;

    const numericValue = parseNumber(saldoAwalInput);

    // Check if input is empty
    if (!saldoAwalInput || saldoAwalInput.trim() === '') {
      setOpenShiftError('Saldo awal kas harus diisi');
      return;
    }

    // Check if value is negative
    if (numericValue < 0) {
      setOpenShiftError('Saldo awal kas tidak boleh negatif');
      return;
    }

    setIsOpeningShift(true);
    try {
      await openShift(numericValue);
      invalidateUserProfileCache();
      setOpenShiftError('');
      setSaldoAwalInput('');
    } catch (error) {
      console.error('❌ Error opening shift:', error);
      setOpenShiftError(getErrorMessage(error));
    } finally {
      setIsOpeningShift(false);
    }
  };

  const handleSimpanPengeluaran = async () => {
    if (isSubmittingExpense) return;  // ← guard double submit

    const numericValue = parseNumber(pengeluaran);
    if (!pengeluaran || numericValue <= 0) {
      setPengeluaranError('Nominal pengeluaran harus diisi dan lebih dari 0');
      return;
    }
    if (!selectedAccountId) {
      setPengeluaranError('Pilih akun kas terlebih dahulu');
      return;
    }

    setIsSubmittingExpense(true);
    try {
      // ✅ Create expense
      await createExpense({
        user_id: shift.employee_id,
        shift_id: shift.id,
        name: catatan || 'Pengeluaran',
        amount: numericValue,
        date: new Date().toISOString(),
        finance_account_id: selectedAccountId, // Use selected account
      });

      // ✅ Refresh profile dan shift data (cache sudah di-invalidate di ShiftContext)
      await fetchProfileAndShift();

      // ✅ Reset form
      setPengeluaran('');
      setCatatan('');
      setShowPengeluaranModal(false);
      setPengeluaranError('');
    } catch (error) {
      setPengeluaranError('Gagal menyimpan pengeluaran. Silakan coba lagi.');
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const handleEndShift = () => {
    setShowEndShiftModal(true);
    setKasAkhirInput('');
    setEndShiftError('');
  };

  const handleConfirmEndShift = async () => {
    if (isEndingShift) return;

    const numericValue = parseNumber(kasAkhirInput);
    if (numericValue !== saldoAkhir) {
      setEndShiftError('Nominal kas akhir tidak sesuai dengan saldo akhir.');
      return;
    }

    setIsEndingShift(true);
    try {
      await endShift(numericValue);
      setShowEndShiftModal(false);
      setKasAkhirInput('');
      setEndShiftError('');
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('❌ Error ending shift:', error);
      const message = error?.response?.data?.message || error?.response?.data?.error?.message || error?.message || '';

      // Map error message BE ke FE yang user-friendly
      if (message.includes('already been ended') || message.includes('already ended')) {
        setEndShiftError('Shift sudah ditutup oleh user lain. Silakan refresh halaman.');
      } else if (message.includes('not found') || message.includes('Shift not found')) {
        setEndShiftError('Shift tidak ditemukan. Silakan refresh halaman.');
      } else if (message.includes('Branch ID') || message.includes('does not match')) {
        setEndShiftError('Shift tidak sesuai dengan cabang Anda. Silakan refresh halaman.');
      } else if (message.includes('No active shift')) {
        setEndShiftError('Tidak ada shift aktif. Silakan buka shift terlebih dahulu.');
      } else {
        setEndShiftError(message || 'Gagal mengakhiri shift. Silakan coba lagi.');
      }
    } finally {
      setIsEndingShift(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-telaga-950/60 flex items-center justify-center z-[9999] p-6 sm:p-8" style={{
      paddingTop: 'max(2rem, env(safe-area-inset-top))',
      paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      paddingLeft: 'max(2rem, env(safe-area-inset-left))',
      paddingRight: 'max(2rem, env(safe-area-inset-right))'
    }}>
      <div className="bg-white rounded-3xl ring-2 ring-telaga-100 shadow-xl shadow-telaga-900/10 w-full max-w-md font-montserrat flex flex-col max-h-[85vh]">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-telaga-100 flex-shrink-0 rounded-t-3xl bg-gradient-to-r from-telaga-50 via-krem to-krem">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold font-montserrat text-telaga-950">{isShiftOpen ? 'Ringkasan Shift' : 'Buka Shift'}</h3>
          </div>
          <button
            className="p-2 rounded-full hover:bg-telaga-100 transition-colors"
            onClick={onClose}
          >
            <span className="text-xl text-telaga-900/70">×</span>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6" style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}>
          {!isShiftOpen ? (
            <>
              <label className="block text-sm font-semibold text-telaga-950 mb-2 font-montserrat">Saldo Awal Laci</label>
              <input
                type="text"
                value={saldoAwalInput}
                onChange={e => setSaldoAwalInput(formatNumber(e.target.value))}
                className="w-full h-11 p-3 border-2 border-telaga-200 rounded-xl text-base font-montserrat bg-krem text-telaga-950 placeholder:text-telaga-900/40 focus:outline-none focus:ring-2 focus:ring-telaga-400 focus:border-telaga-400"
                placeholder="Masukkan saldo awal laci"
              />
              <p className="text-xs text-telaga-900/60 mt-2 font-montserrat leading-relaxed">
                💡 Jumlah uang tunai di laci kasir saat mulai shift. Jika laci kosong, isi 0 saja.
              </p>
              {openShiftError && <div className="text-red-600 text-xs mt-2">{openShiftError}</div>}
            </>
          ) : (
            <>
              {/* ✅ Penjelasan shift aktif */}
              <div className="bg-telaga-50/80 border border-telaga-100 rounded-xl px-3 py-2 mb-4">
                <p className="text-xs text-telaga-900/70 leading-relaxed font-montserrat">
                  Shift sedang aktif. Semua pembayaran tunai (cash) yang diterima akan tercatat sebagai uang masuk, dan pengeluaran yang dicatat akan tercatat sebagai uang keluar secara otomatis.
                </p>
              </div>

              {/* ✅ Ringkasan shift - Cash-focused */}
              <div className="mb-4 rounded-2xl border border-telaga-100 bg-white shadow-sm shadow-telaga-900/5 overflow-hidden">
                <div className="px-3 py-2 bg-gradient-to-r from-telaga-600 to-senja-500">
                  <span className="text-xs font-semibold text-white font-montserrat">Ringkasan Kas Shift</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-telaga-900/60 font-montserrat">Saldo Awal Laci</span>
                    <span className="font-semibold text-telaga-950 font-montserrat">Rp {parseInt(saldoAwal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-telaga-900/60 font-montserrat">Uang Masuk (Cash)</span>
                    <span className="font-semibold text-telaga-700 font-montserrat">Rp {parseInt(shift.cash_inflow || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-telaga-900/60 font-montserrat">Uang Keluar (Cash)</span>
                    <span className="font-semibold text-senja-600 font-montserrat">Rp {parseInt(shift.cash_outflow || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-base border-t border-telaga-100 pt-2 mt-2 bg-telaga-50/60 -mx-3 px-3 py-2 rounded-b-xl">
                    <span className="font-bold text-telaga-950 font-montserrat">Saldo Akhir (Cash)</span>
                    <span className="font-bold text-telaga-800 font-montserrat">Rp {parseInt(shift.cash_balance || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Tombol Detail Akun Keuangan */}
              <div className="mb-4">
                <AnimatedButton
                  variant="default"
                  className="w-full h-10 mb-2 text-sm font-montserrat flex items-center justify-center gap-2 rounded-xl border-2 border-telaga-200 text-telaga-800 hover:bg-telaga-50 transition-colors"
                  onClick={async () => {
                    await fetchShiftDetail();
                    setShowAccountDetailModal(true);
                  }}
                  disabled={loadingShiftDetail}
                >
                  <span>📊</span>
                  {loadingShiftDetail ? 'Loading...' : 'Lihat Detail Pembayaran'}
                </AnimatedButton>
              </div>

              {/* Tombol tambah pengeluaran */}
              <AnimatedButton
                variant="telaga"
                className="w-full h-11 mb-4 text-base font-montserrat"
                onClick={() => {
                  setShowPengeluaranModal(true);
                  // Reset form
                  setPengeluaran('');
                  setCatatan('');
                  setPengeluaranError('');
                  // Set default account if available
                  if (financeAccounts.length > 0) {
                    setSelectedAccountId(financeAccounts[0].id);
                  }
                }}
              >
                + Tambah Pengeluaran
              </AnimatedButton>
              {/* List pengeluaran */}
              <div className="mb-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-telaga-900">Data Pengeluaran</span>
                  <span className="text-xs text-telaga-900/60">Total: Rp {totalPengeluaran.toLocaleString()}</span>
                </div>
                <div className="max-h-32 overflow-y-auto">
                  {expenses.length === 0 ? (
                    <div className="text-xs text-telaga-400 text-center py-2">Belum ada pengeluaran</div>
                  ) : (
                    <table className="w-full text-xs font-montserrat">
                      <thead>
                        <tr className="bg-telaga-50">
                          <th className="py-1 px-2 text-left font-semibold">Tanggal</th>
                          <th className="py-1 px-2 text-right font-semibold">Nominal</th>
                          <th className="py-1 px-2 text-center font-semibold">Metode</th>
                          <th className="py-1 px-2 text-left font-semibold">Catatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((p) => {
                          const paymentMethod = p.finance_account?.payment_method?.code;
                          const colors = getPaymentMethodColors(paymentMethod);
                          return (
                            <tr key={p.id} className="border-b border-telaga-100">
                              <td className="py-1 px-2 whitespace-nowrap">{p.date}</td>
                              <td className="py-1 px-2 text-right text-red-600">Rp {parseInt(p.amount).toLocaleString()}</td>
                              <td className="py-1 px-2 text-center">
                                {paymentMethod ? (
                                  <span className={`px-2 py-1 ${colors.bg} ${colors.text} rounded-full text-xs font-medium`}>
                                    {formatPaymentMethod(paymentMethod)}
                                  </span>
                                ) : (
                                  <span className="text-telaga-400">-</span>
                                )}
                              </td>
                              <td className="py-1 px-2">{p.name || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
              {/* Modal End Shift */}
              {showEndShiftModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-6 sm:p-8" style={{
                  paddingTop: 'max(2rem, env(safe-area-inset-top))',
                  paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
                  paddingLeft: 'max(2rem, env(safe-area-inset-left))',
                  paddingRight: 'max(2rem, env(safe-area-inset-right))'
                }}>
                  <div className="bg-white rounded-3xl ring-2 ring-telaga-100 shadow-xl shadow-telaga-900/10 w-full max-w-xs font-montserrat flex flex-col max-h-[85vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-2 border-b border-telaga-100 flex-shrink-0 rounded-t-3xl bg-gradient-to-r from-telaga-50 via-krem to-krem">
                      <h4 className="text-lg font-bold font-montserrat text-telaga-950">Konfirmasi Akhiri Shift</h4>
                      <button
                        className="p-2 rounded-full hover:bg-telaga-100 transition-colors"
                        onClick={() => setShowEndShiftModal(false)}
                      >
                        <span className="text-xl text-telaga-900/70">×</span>
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6" style={{
                      WebkitOverflowScrolling: 'touch',
                      overscrollBehavior: 'contain'
                    }}>
                      <label className="block text-sm font-semibold text-telaga-900 mb-2">Input Kas Akhir</label>
                      <input
                        type="text"
                        value={kasAkhirInput}
                        onChange={e => setKasAkhirInput(formatNumber(e.target.value))}
                        className="w-full h-10 p-3 border-2 border-telaga-200 rounded-xl text-base font-montserrat focus:outline-none focus:ring-2 focus:ring-telaga-400 focus:border-transparent bg-white"
                        placeholder={`Masukkan kas akhir`}
                      />
                      {endShiftError && <div className="text-red-600 text-xs mt-2">{endShiftError}</div>}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-telaga-100 flex-shrink-0 rounded-b-3xl bg-krem">
                      <AnimatedButton
                        variant="telaga"
                        className="w-full h-11 text-base font-montserrat"
                        onClick={handleConfirmEndShift}
                        disabled={isEndingShift}
                      >
                        {isEndingShift ? 'Mengakhiri Shift...' : 'Konfirmasi & Tutup Shift'}
                      </AnimatedButton>
                    </div>
                  </div>
                </div>
              )}
              {/* Modal Tambah Pengeluaran */}
              {showPengeluaranModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-6 sm:p-8" style={{
                  paddingTop: 'max(2rem, env(safe-area-inset-top))',
                  paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
                  paddingLeft: 'max(2rem, env(safe-area-inset-left))',
                  paddingRight: 'max(2rem, env(safe-area-inset-right))'
                }}>
                  <div className="bg-white rounded-3xl ring-2 ring-telaga-100 shadow-xl shadow-telaga-900/10 w-full max-w-xs font-montserrat flex flex-col max-h-[85vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-2 border-b border-telaga-100 flex-shrink-0 rounded-t-3xl bg-gradient-to-r from-telaga-50 via-krem to-krem">
                      <h4 className="text-lg font-montserrat font-bold text-telaga-950">Tambah Pengeluaran</h4>
                      <button
                        className="p-2 rounded-full hover:bg-telaga-100 transition-colors"
                        onClick={() => {
                          setShowPengeluaranModal(false);
                          setIsSubmittingExpense(false);
                        }}
                      >
                        <span className="text-xl text-telaga-900/70">×</span>
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{
                      WebkitOverflowScrolling: 'touch',
                      overscrollBehavior: 'contain'
                    }}>
                      <div>
                        <label className="block text-sm font-semibold text-telaga-900 mb-2">Pembayaran</label>
                        {loadingAccounts ? (
                          <div className="w-full h-10 p-3 border-2 border-telaga-100 rounded-xl text-sm text-telaga-900/60 bg-telaga-50/40 flex items-center">
                            Loading pembayaran...
                          </div>
                        ) : (
                          <select
                            value={selectedAccountId || ''}
                            onChange={e => setSelectedAccountId(parseInt(e.target.value))}
                            className="w-full p-3 border-2 border-telaga-200 rounded-xl text-xs font-montserrat focus:outline-none focus:ring-2 focus:ring-telaga-400 focus:border-transparent bg-white"
                          >
                            <option value="">Pilih pembayaran</option>
                            {financeAccounts.map(account => (
                              <option key={account.id} value={account.id} className="text-xs font-montserrat">
                                {account.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-telaga-900 mb-2">Nominal Pengeluaran</label>
                        <input
                          type="text"
                          value={pengeluaran}
                          onChange={e => setPengeluaran(formatNumber(e.target.value))}
                          className="w-full h-10 p-3 border-2 border-telaga-200 rounded-xl text-base font-montserrat focus:outline-none focus:ring-2 focus:ring-telaga-400 focus:border-transparent bg-white"
                          placeholder="Contoh: 50.000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-telaga-900 mb-2">Catatan</label>
                        <input
                          type="text"
                          value={catatan}
                          onChange={e => setCatatan(e.target.value)}
                          className="w-full h-10 p-3 border-2 border-telaga-200 rounded-xl text-base font-montserrat focus:outline-none focus:ring-2 focus:ring-telaga-400 focus:border-transparent bg-white"
                          placeholder="Catatan pengeluaran"
                        />
                      </div>

                      {pengeluaranError && <div className="text-red-600 text-xs">{pengeluaranError}</div>}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-telaga-100 flex-shrink-0 rounded-b-3xl bg-krem">
                      <AnimatedButton
                        variant="telaga"
                        className="w-full h-11 text-base font-montserrat"
                        onClick={handleSimpanPengeluaran}
                        disabled={isSubmittingExpense}
                      >
                        {isSubmittingExpense ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                      </AnimatedButton>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="p-4 border-t border-telaga-100 flex-shrink-0 rounded-b-3xl bg-krem">
          {!isShiftOpen ? (
            <AnimatedButton
              variant="telaga"
              className="w-full h-12 text-base font-montserrat"
              onClick={handleOpenShift}
              disabled={isOpeningShift}
            >
              {isOpeningShift ? 'Membuka Shift...' : 'Buka Shift'}
            </AnimatedButton>
          ) : (
            <div className="flex flex-col gap-2">
              <AnimatedButton
                variant="telaga"
                className="w-full h-12 text-base font-montserrat"
                onClick={onClose}
              >
                Mulai Transaksi
              </AnimatedButton>
              <AnimatedButton
                variant="default"
                className="w-full h-12 text-base font-montserrat rounded-xl border-2 border-senja-300 text-senja-700 bg-white hover:bg-senja-50 transition-colors"
                onClick={handleEndShift}
              >
                Akhiri Shift
              </AnimatedButton>
            </div>
          )}
        </div>
      </div>

      {/* Modal Detail Akun Keuangan */}
      {showAccountDetailModal && (
        <div className="fixed inset-0 bg-telaga-950/60 flex items-center justify-center z-[9999] p-6 sm:p-8" style={{
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(2rem, env(safe-area-inset-left))',
          paddingRight: 'max(2rem, env(safe-area-inset-right))'
        }}>
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-telaga-100 flex-shrink-0 rounded-t-2xl bg-gradient-to-r from-telaga-50 to-telaga-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-telaga-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">📊</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-telaga-950 font-['Montserrat']">
                    Detail Transaksi
                  </h2>
                  <p className="text-sm text-telaga-900/70 font-['Montserrat']">
                    Breakdown per akun keuangan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAccountDetailModal(false)}
                className="w-7 h-7 bg-telaga-100 hover:bg-telaga-200 rounded-full flex items-center justify-center transition-colors"
              >
                <span className="text-telaga-900/70 text-lg">×</span>
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1" style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}>
              <div className="p-4 space-y-4">
                {loadingShiftDetail ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 bg-telaga-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-telaga-600 text-lg">⏳</span>
                    </div>
                    <h3 className="text-sm font-medium text-telaga-950 font-['Montserrat'] mb-1">
                      Loading detail pembayaran...
                    </h3>
                    <p className="text-xs text-telaga-900/60 font-['Montserrat']">
                      Mengambil data terbaru dari server
                    </p>
                  </div>
                ) : shiftDetail?.account_breakdown ? (
                  Object.values(shiftDetail.account_breakdown).map(account => (
                    <div key={account.account_id} className="bg-white rounded-lg border border-telaga-100 overflow-hidden">
                      {/* Header - Compact */}
                      <div className="bg-telaga-50/40 px-4 py-3 border-b border-telaga-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-telaga-100 rounded-full flex items-center justify-center">
                              <span className="text-telaga-600 text-sm font-bold">
                                {account.account_name?.charAt(0)?.toUpperCase() || 'A'}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-telaga-950 text-sm font-['Montserrat']">
                                {account.account_name}
                              </h3>
                              <p className="text-xs text-telaga-900/60 font-['Montserrat'] capitalize">
                                {account.account_type}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-bold font-['Montserrat'] ${account.inflow - account.outflow >= 0 ? 'text-telaga-600' : 'text-red-600'}`}>
                              Rp {parseInt(account.inflow - account.outflow || 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-telaga-900/60 font-['Montserrat']">Net Flow</div>
                          </div>
                        </div>
                      </div>

                      {/* Summary - Compact */}
                      <div className="px-4 py-3 bg-telaga-50/40">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-xs text-telaga-900/60 font-['Montserrat']">Uang Masuk</div>
                              <div className="text-sm font-bold text-telaga-600 font-['Montserrat']">
                                Rp {parseInt(account.inflow || 0).toLocaleString()}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-telaga-900/60 font-['Montserrat']">Uang Keluar</div>
                              <div className="text-sm font-bold text-red-600 font-['Montserrat']">
                                Rp {parseInt(account.outflow || 0).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-telaga-900/60 font-['Montserrat']">Transaksi</div>
                            <div className="text-sm font-bold text-telaga-950 font-['Montserrat']">
                              {account.transactions?.length || 0}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Transactions - Compact */}
                      {account.transactions && account.transactions.length > 0 && (
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-telaga-900 text-xs font-['Montserrat']">
                              Transaksi ({account.transactions.length})
                            </h4>
                            <AnimatedButton
                              variant="telaga"
                              className="px-3 py-1 text-xs font-['Montserrat']"
                              onClick={() => {
                                setSelectedAccountForTransaction(account);
                                setShowTransactionDetailModal(true);
                              }}
                            >
                              Detail
                            </AnimatedButton>
                          </div>
                          <div className="space-y-2">
                            {account.transactions.slice(0, 3).map(transaction => (
                              <div key={transaction.id} className="bg-telaga-50/40 rounded-lg p-3 border border-telaga-100">
                                <div className="flex items-center justify-between">
                                  {/* Left: Order Info */}
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="w-6 h-6 bg-telaga-100 rounded-full flex items-center justify-center">
                                      <span className="text-telaga-600 text-xs font-bold">#</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-telaga-950 text-xs font-['Montserrat']">
                                        {transaction.order_id ? `Order #${transaction.order_id}` : `Payment #${transaction.id}`}
                                      </div>
                                      <div className="text-xs text-telaga-900/60 font-['Montserrat'] truncate">
                                        {transaction.customer_name || 'Customer'}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right: Amount & Method */}
                                  <div className="flex items-center gap-2">
                                    <div className="text-right">
                                      <div className="font-bold text-telaga-600 text-xs font-['Montserrat']">
                                        Rp {parseInt(transaction.amount || 0).toLocaleString()}
                                      </div>
                                      <div className="text-xs text-telaga-900/60 font-['Montserrat']">
                                        {formatPaymentMethod(transaction.method)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {account.transactions.length > 3 && (
                              <div className="text-center py-2">
                                <p className="text-xs text-telaga-900/60 font-['Montserrat']">
                                  +{account.transactions.length - 3} transaksi lainnya
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 bg-telaga-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-telaga-400 text-lg">📊</span>
                    </div>
                    <h3 className="text-sm font-medium text-telaga-950 font-['Montserrat'] mb-1">
                      Tidak ada data akun keuangan
                    </h3>
                    <p className="text-xs text-telaga-900/60 font-['Montserrat']">
                      Belum ada transaksi atau data akun keuangan untuk shift ini
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-telaga-100 p-4 bg-krem flex-shrink-0 rounded-b-3xl">
              <AnimatedButton
                variant="telaga"
                className="w-full h-10 text-sm font-['Montserrat']"
                onClick={() => setShowAccountDetailModal(false)}
              >
                Tutup
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Transaksi per Akun */}
      {showTransactionDetailModal && (
        <div className="fixed inset-0 bg-telaga-950/60 flex items-center justify-center z-[9999] p-6 sm:p-8" style={{
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(2rem, env(safe-area-inset-left))',
          paddingRight: 'max(2rem, env(safe-area-inset-right))'
        }}>
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-telaga-100 flex-shrink-0 rounded-t-2xl bg-gradient-to-r from-telaga-50 to-telaga-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-telaga-500 rounded-full flex items-center justify-center">
                  {selectedAccountForTransaction?.account_type === 'cash' && <span className="text-white text-lg">💰</span>}
                  {selectedAccountForTransaction?.account_type === 'bank' && <span className="text-white text-lg">🏦</span>}
                  {selectedAccountForTransaction?.account_type === 'qris' && <span className="text-white text-lg">📱</span>}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-telaga-950 font-['Montserrat']">
                    Detail Transaksi - {selectedAccountForTransaction?.account_name}
                  </h2>
                  <p className="text-sm text-telaga-900/70 font-['Montserrat']">
                    {selectedAccountForTransaction?.transactions?.length || 0} transaksi
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTransactionDetailModal(false);
                  setSelectedAccountForTransaction(null);
                }}
                className="w-7 h-7 bg-telaga-100 hover:bg-telaga-200 rounded-full flex items-center justify-center transition-colors"
              >
                <span className="text-telaga-900/70 text-lg">×</span>
              </button>
            </div>

            {/* Account Summary - Compact */}
            <div className="px-4 py-3 bg-telaga-50/40 border-b-2 border-telaga-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-xs text-telaga-900/60 font-['Montserrat']">Uang Masuk</div>
                    <div className="text-sm font-bold text-telaga-600 font-['Montserrat']">
                      Rp {parseInt(selectedAccountForTransaction?.inflow || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-telaga-900/60 font-['Montserrat']">Uang Keluar</div>
                    <div className="text-sm font-bold text-red-600 font-['Montserrat']">
                      Rp {parseInt(selectedAccountForTransaction?.outflow || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-telaga-900/60 font-['Montserrat']">Net Flow</div>
                    <div className={`text-sm font-bold font-['Montserrat'] ${(selectedAccountForTransaction?.inflow || 0) - (selectedAccountForTransaction?.outflow || 0) >= 0 ? 'text-telaga-600' : 'text-red-600'}`}>
                      Rp {parseInt((selectedAccountForTransaction?.inflow || 0) - (selectedAccountForTransaction?.outflow || 0)).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-telaga-900/60 font-['Montserrat']">Transaksi</div>
                  <div className="text-sm font-bold text-telaga-950 font-['Montserrat']">
                    {selectedAccountForTransaction?.transactions?.length || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1" style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}>
              <div className="p-4">
                {/* Transactions Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-telaga-50/40">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-telaga-900/70 uppercase tracking-wider font-['Montserrat']">
                          Order/Customer
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-telaga-900/70 uppercase tracking-wider font-['Montserrat']">
                          Jumlah
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-telaga-900/70 uppercase tracking-wider font-['Montserrat']">
                          Metode
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-telaga-900/70 uppercase tracking-wider font-['Montserrat']">
                          Waktu
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-telaga-100">
                      {selectedAccountForTransaction?.transactions?.map((transaction, index) => (
                        <tr key={transaction.id} className={`hover:bg-telaga-50/40 ${index % 2 === 0 ? 'bg-white' : 'bg-telaga-50/40'}`}>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-telaga-100 rounded-full flex items-center justify-center">
                                <span className="text-telaga-600 text-xs">#</span>
                              </div>
                              <div>
                                <div className="font-medium text-telaga-950 text-xs font-['Montserrat']">
                                  {transaction.order_id ? `Order #${transaction.order_id}` : `Payment #${transaction.id}`}
                                </div>
                                <div className="text-xs text-telaga-900/60 font-['Montserrat'] truncate max-w-24">
                                  {transaction.customer_name || 'Customer'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-telaga-600 text-xs">Rp</span>
                              <span className="font-bold text-telaga-600 text-xs font-['Montserrat']">
                                {parseInt(transaction.amount || 0).toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-telaga-100 text-telaga-950 font-['Montserrat']">
                              {formatPaymentMethod(transaction.method)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className="text-xs text-telaga-900/60 font-['Montserrat']">
                              {new Date(transaction.time).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Empty State */}
                {(!selectedAccountForTransaction?.transactions || selectedAccountForTransaction.transactions.length === 0) && (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 bg-telaga-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-telaga-400 text-lg">📊</span>
                    </div>
                    <h3 className="text-sm font-medium text-telaga-950 font-['Montserrat'] mb-1">
                      Tidak ada transaksi
                    </h3>
                    <p className="text-xs text-telaga-900/60 font-['Montserrat']">
                      Belum ada transaksi untuk akun {selectedAccountForTransaction?.account_name}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-telaga-100 p-4 bg-krem flex-shrink-0 rounded-b-3xl">
              <div className="flex justify-between items-center">
                <div className="text-xs text-telaga-900/70 font-['Montserrat']">
                  {selectedAccountForTransaction?.transactions?.length || 0} transaksi
                </div>
                <AnimatedButton
                  variant="telaga"
                  className="px-4 py-2 text-sm font-['Montserrat']"
                  onClick={() => {
                    setShowTransactionDetailModal(false);
                    setSelectedAccountForTransaction(null);
                  }}
                >
                  Tutup
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OpenShiftModal; 