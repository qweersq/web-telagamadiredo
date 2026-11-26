import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Loader2, MessageCircle, CheckCircle, X, ChevronRight, Calendar, Clock, Image as ImageIcon, HelpCircle } from 'lucide-react';
import instance from '../../config/api';
import { getPhotoUrl } from '../../utils/photoUrlHelper';

// Status config: label, warna, action buttons
const STATUS_CONFIG = {
  not_yet: {
    label: 'Menunggu Penjemputan',
    apiStatus: 'dalam_penjemputan',
    color: 'blue',
  },
  penjemputan: {
    label: 'Menunggu Penjemputan',
    apiStatus: 'dalam_penjemputan',
    color: 'blue',
  },
  antrian: {
    label: 'Antrian',
    apiStatus: 'antrian',
    color: 'yellow',
  },
  progress: {
    label: 'Proses',
    apiStatus: 'on_progress',
    color: 'yellow',
  },
  pengeringan: {
    label: 'Sedang Dikeringkan',
    apiStatus: 'pengeringan',
    color: 'orange',
  },
  siap_diambil: {
    label: 'Siap Disajikan',
    apiStatus: 'siap_diambil',
    color: 'green',
  },
  siap_dikirim: {
    label: 'Siap Dikirim',
    apiStatus: 'siap_dikirim',
    color: 'teal',
  },
  done: {
    label: 'Selesai',
    apiStatus: 'done',
    color: 'gray',
  },
  cancelled: {
    label: 'Dibatalkan',
    apiStatus: 'cancelled',
    color: 'red',
  },
};

const OperationPanelModal = ({ 
  isOpen, 
  initialStatus, 
  onClose, 
  startDate,
  endDate,
  onOpenMessageModal, 
  onMarkNotified,
  onRefreshCounts 
}) => {
  const [activeStatus, setActiveStatus] = useState(initialStatus || 'antrian');
  const [items, setItems] = useState([]); 
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState('entry_date');
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState(null); // { item, newStatus, label }
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryItem, setDeliveryItem] = useState(null);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const isFetchingRef = useRef(false);
  const searchTimeoutRef = useRef(null);

  // Group items by order.id, sort groups by selected sort key
  const groupedItems = useMemo(() => {
    const groups = {};
    items.forEach(item => {
      const orderId = item.order.id;
      if (!groups[orderId]) {
        groups[orderId] = { order: item.order, customer: item.customer, items: [] };
      }
      groups[orderId].items.push(item);
    });

    return Object.values(groups).sort((a, b) => {
      if (sortBy === 'due_date') {
        const minA = Math.min(...a.items.map(i => new Date(i.due_date).getTime()));
        const minB = Math.min(...b.items.map(i => new Date(i.due_date).getTime()));
        return sortDir === 'asc' ? minA - minB : minB - minA;
      }
      const dA = new Date(a.order.entry_date).getTime();
      const dB = new Date(b.order.entry_date).getTime();
      return sortDir === 'asc' ? dA - dB : dB - dA;
    });
  }, [items, sortBy, sortDir]);

  const handleSearchInput = (value) => {
    setSearchInput(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 400);
  };

  const fetchItems = useCallback(async (page = 1, append = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (page === 1) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const config = STATUS_CONFIG[activeStatus];
      const res = await instance.get('/operation-panel/orders', {
        params: {
          status: config.apiStatus,
          sort_by: sortBy,
          sort_dir: sortDir,
          page,
          pageSize: 20,
          start_date: startDate || null,
          end_date: endDate || null,
          search: searchQuery || null,
        },
      });
      const { orderDetails, pagination: pg } = res.data.data;
      setItems(prev => append ? [...prev, ...orderDetails] : orderDetails);
      setPagination(pg);
      setCurrentPage(page);
    } catch (err) {
      console.error('OperationPanel fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [activeStatus, sortBy, sortDir, startDate, endDate, searchQuery]);

  useEffect(() => {
    if (isOpen) {
      setItems([]);
      setCurrentPage(1);
      fetchItems(1, false);
    }
  }, [isOpen, activeStatus, sortBy, sortDir, fetchItems]);

  // Reset search saat ganti status
  useEffect(() => {
    setSearchInput('');
    setSearchQuery('');
  }, [activeStatus]);

  const handleStatusChange = (item, newStatus, label) => {
    setConfirmAction({ item, newStatus, label });
  };

  const executeStatusChange = async () => {
    if (!confirmAction) return;
    setIsSubmitting(true);
    try {
      await instance.post(`/order-detail-process/${confirmAction.item.id}`, {
        old_status: confirmAction.item.status,
        new_status: confirmAction.newStatus,
        updated_by: null,
      });
      setItems(prev => prev.filter(i => i.id !== confirmAction.item.id));
      setConfirmAction(null);
      onRefreshCounts();
    } catch (err) {
      console.error('Status change error:', err);
    } finally {
      setIsSubmitting(false);
    } 
  };

  const handleSiapDikirim = (item) => {
    setDeliveryItem(item);
    setDeliveryDate('');
    setDeliveryTime('');
    setShowDeliveryModal(true);
  };

  const executeSetDelivery = async () => {
    if (!deliveryDate || !deliveryTime) return;
    setIsSubmitting(true);
    try {
      await instance.put(`/order-details/${deliveryItem.id}`, {
        delivery_date: deliveryDate,
        delivery_time: deliveryTime,
        pickup_method: 'delivery',
        delivery_status: 'scheduled',
      });
      await instance.post(`/order-detail-process/${deliveryItem.id}`, {
        old_status: 'pengeringan',
        new_status: 'siap_dikirim',
        updated_by: null,
      });
      setItems(prev => prev.filter(i => i.id !== deliveryItem.id));
      setShowDeliveryModal(false);
      setDeliveryItem(null);
      onRefreshCounts();
    } catch (err) {
      console.error('Set delivery error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-100">
        {/* Baris 1: Judul + Tombol Close */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div>
            <h2 className="text-lg font-bold text-gray-800 font-montserrat">
              {STATUS_CONFIG[activeStatus]?.label}
            </h2>
            <p className="text-xs text-gray-500 font-montserrat">
              {pagination?.totalItems || 0} item
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Baris 2: Sort Pills sejajar penuh */}
        <div className="flex gap-2 px-4 pb-3">
          {[
            { by: 'entry_date', dir: 'asc',  label: 'Masuk ↑' },
            { by: 'entry_date', dir: 'desc', label: 'Masuk ↓' },
            { by: 'due_date',   dir: 'asc',  label: 'Selesai ↑' },
            { by: 'due_date',   dir: 'desc', label: 'Selesai ↓' },
          ].map(s => (
            <button
              key={`${s.by}-${s.dir}`}
              onClick={() => { setSortBy(s.by); setSortDir(s.dir); }}
              className={`flex-1 py-1.5 rounded-full text-[10px] font-semibold font-montserrat transition ${
                sortBy === s.by && sortDir === s.dir
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={e => handleSearchInput(e.target.value)}
            placeholder="Cari nama pelanggan, no HP, atau treatment..."
            className="w-full pl-9 pr-8 py-2 text-sm font-montserrat bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setSearchQuery(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm text-gray-500 font-montserrat">Memuat data...</p>
          </div>
        ) : groupedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-montserrat">Tidak ada item di bagian ini</p>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto w-full">
            {groupedItems.map(group => (
              <div key={group.order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                {/* Order Header */}
                <div className="px-4 py-3 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800 text-sm truncate font-montserrat flex-1">
                      {group.customer?.name}
                    </h3>
                    {activeStatus === 'siap_diambil' && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => onOpenMessageModal({
                            ...group.order,
                            customer: group.customer,
                            order_details: group.items,
                          })}
                          title="WA Pelanggan"
                          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                            group.order.is_notified
                              ? 'bg-green-50 text-green-500 border border-green-200'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        {!group.order.is_notified && (
                          <button
                            onClick={async () => {
                              await onMarkNotified(group.order.id);
                              setItems(prev => prev.map(i =>
                                i.order.id === group.order.id
                                  ? { ...i, order: { ...i.order, is_notified: true, notified_at: new Date().toISOString() } }
                                  : i
                              ));
                            }}
                            title="Tandai sudah di-WA"
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors text-xs font-bold"
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold text-blue-500 font-montserrat">#{group.order.id}</span>
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-semibold font-montserrat px-2 py-0.5 rounded-md">
                      <Calendar className="w-3 h-3" />
                      Tgl Masuk: {new Date(group.order.entry_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Item rows */}
                <div className="divide-y divide-gray-50">
                  {group.items.map(item => (
                    <div key={item.id} className="p-3 flex gap-3">
                      {/* Thumbnail */}
                      <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-50">
                        {item.thumbnail ? (
                          <img src={getPhotoUrl(item.thumbnail)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Info + Action */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 font-montserrat truncate">
                          {item.treatment?.name}
                        </p>
                        <p className="text-[10px] text-gray-500 font-montserrat truncate">
                          {item.item?.brand} {item.item?.color && `(${item.item.color})`}
                        </p>
                        <div className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg mt-1 ${
                          new Date(item.due_date) < new Date() ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          <Clock className="w-3 h-3" />
                          Estimasi selesai: {new Date(item.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>

                        {/* Per-item action buttons */}
                        <div className="mt-2 flex gap-1.5">
                          {activeStatus === 'not_yet' && (
                            <button
                              onClick={() => handleStatusChange(item, 'antrian', 'Masukkan ke Antrian Kerja?')}
                              className="flex-1 bg-blue-600 text-white py-1.5 rounded-xl text-[10px] font-bold font-montserrat hover:bg-blue-700 transition-colors"
                            >
                              Masukkan Antrian
                            </button>
                          )}
                          {activeStatus === 'antrian' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(item, 'on_progress', 'Mulai kerjakan item ini?')}
                                className="flex-1 bg-blue-600 text-white py-1.5 rounded-xl text-[10px] font-bold font-montserrat hover:bg-blue-700 transition-colors"
                              >
                                Mulai Kerjakan
                              </button>
                              <button
                                onClick={() => handleStatusChange(item, 'cancelled', 'Batalkan pengerjaan item ini?')}
                                className="bg-red-50 text-red-600 px-2.5 py-1.5 rounded-xl text-[10px] font-bold font-montserrat hover:bg-red-100 transition-colors"
                              >
                                Batal
                              </button>
                            </>
                          )}
                          {activeStatus === 'progress' && (
                            <button
                              onClick={() => handleStatusChange(item, 'pengeringan', 'Item sudah selesai dikerjakan?')}
                              className="flex-1 bg-orange-500 text-white py-1.5 rounded-xl text-[10px] font-bold font-montserrat hover:bg-orange-600 transition-colors"
                            >
                              Selesai Dikerjakan
                            </button>
                          )}
                          {activeStatus === 'pengeringan' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(item, 'siap_diambil', 'Item siap diambil pelanggan?')}
                                className="flex-1 bg-green-600 text-white py-1.5 rounded-xl text-[10px] font-bold font-montserrat hover:bg-green-700 transition-colors"
                              >
                                Siap Diambil
                              </button>
                              <button
                                onClick={() => handleSiapDikirim(item)}
                                className="flex-1 bg-teal-600 text-white py-1.5 rounded-xl text-[10px] font-bold font-montserrat hover:bg-teal-700 transition-colors"
                              >
                                Siap Dikirim
                              </button>
                            </>
                          )}
                          {activeStatus === 'siap_diambil' && (
                            <button
                              onClick={() => handleStatusChange(item, 'done', 'Item sudah diambil/diterima pelanggan?')}
                              className="flex-1 bg-blue-600 text-white py-1.5 rounded-xl text-[10px] font-bold font-montserrat hover:bg-blue-700 transition-colors"
                            >
                              Selesai / Diambil
                            </button>
                          )}
                          {activeStatus === 'siap_dikirim' && (
                            <button
                              onClick={() => handleStatusChange(item, 'done', 'Item sudah berhasil dikirim & diterima?')}
                              className="flex-1 bg-blue-600 text-white py-1.5 rounded-xl text-[10px] font-bold font-montserrat hover:bg-blue-700 transition-colors"
                            >
                              Selesai Dikirim
                            </button>
                          )}
                          {activeStatus === 'done' && (
                            <div className="flex-1 bg-gray-100 text-gray-500 py-1.5 rounded-xl text-[10px] font-bold font-montserrat text-center">
                              Item Selesai
                            </div>
                          )}
                          {activeStatus === 'cancelled' && (
                            <div className="flex-1 bg-red-50 text-red-500 py-1.5 rounded-xl text-[10px] font-bold font-montserrat text-center">
                              Item Dibatalkan
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination && currentPage < pagination.totalPages && (
          <div className="p-8 text-center">
            {isLoadingMore ? (
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
            ) : (
              <button 
                onClick={() => fetchItems(currentPage + 1, true)}
                className="px-6 py-2 bg-white border border-blue-200 text-blue-600 text-xs font-bold font-montserrat rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
              >
                Muat Lebih Banyak
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mini Modal Siap Dikirim */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-gray-800 font-montserrat mb-4 text-center text-lg">Jadwalkan Pengiriman</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 font-montserrat uppercase tracking-wider ml-1">Tanggal Kirim</label>
                <input 
                  type="date" 
                  value={deliveryDate} 
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-2xl px-4 py-3 text-sm mt-1 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 font-montserrat uppercase tracking-wider ml-1">Jam Kirim</label>
                <input 
                  type="time" 
                  value={deliveryTime} 
                  onChange={e => setDeliveryTime(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-2xl px-4 py-3 text-sm mt-1 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all" 
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowDeliveryModal(false)}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 text-xs font-bold font-montserrat hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={executeSetDelivery} 
                disabled={!deliveryDate || !deliveryTime || isSubmitting}
                className="flex-1 py-3 rounded-2xl bg-teal-600 text-white text-xs font-bold font-montserrat disabled:opacity-50 hover:bg-teal-700 transition-colors shadow-lg shadow-teal-100"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Simpan Jadwal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-blue-600" />
            </div>
            <p className="font-bold text-gray-800 font-montserrat text-lg mb-1">{confirmAction.label}</p>
            <p className="text-xs text-gray-500 font-montserrat mb-6 bg-gray-50 py-2 px-3 rounded-xl inline-block mx-auto">
              {confirmAction.item.customer?.name} · {confirmAction.item.treatment?.name}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 text-xs font-bold font-montserrat hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={executeStatusChange} 
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold font-montserrat disabled:opacity-50 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationPanelModal;
