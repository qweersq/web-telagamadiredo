import { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, Calendar, Package, CreditCard, MessageSquare, Camera, Crown, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import CustomerDetailApi from '../../services/customerDetailApi';
import PhotoGalleryModal from './PhotoGalleryModal';
import { getPhotoUrl } from '../../utils/photoUrlHelper';
import { 
  formatPhoneNumber, 
  getMembershipBadgeColor, 
  formatCurrency, 
  formatDate, 
  formatDateTime,
  formatPaymentStatus,
  getPaymentStatusColors,
  formatOrderDetailStatus,
  getOrderDetailStatusColors,
  formatOrderType
} from '../../utils/labelFormatter';
import './CustomerDetailModal.css';

const CustomerDetailModal = ({ isOpen, onClose, customer }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [paymentsData, setPaymentsData] = useState({ data: [], pagination: {} });
  const [ordersData, setOrdersData] = useState({ data: [], pagination: {} });
  const [itemsData, setItemsData] = useState({ data: [], pagination: {} });
  const [followupsData, setFollowupsData] = useState({ data: [], pagination: {} });
  const [photosData, setPhotosData] = useState({ data: [], pagination: {} });
  const [progressData, setProgressData] = useState({ data: [], pagination: {} });
  
  // Photo gallery modal states
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  
  // Pagination states for each tab
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [itemsPage, setItemsPage] = useState(1);
  const [followupsPage, setFollowupsPage] = useState(1);
  const [photosPage, setPhotosPage] = useState(1);
  const [progressPage, setProgressPage] = useState(1);
  
  // Loading states for load more
  const [loadingMore, setLoadingMore] = useState({
    payments: false,
    orders: false,
    items: false,
    followups: false,
    photos: false,
    progress: false
  });

  // Load summary data when modal opens
  useEffect(() => {
    if (isOpen && customer) {
      loadSummaryData();
    }
  }, [isOpen, customer]);

  const loadSummaryData = async () => {
    try {
      setLoading(true);
      const response = await CustomerDetailApi.getCustomerDetailSummary(customer.id);
      setSummaryData(response.data || null);
    } catch (error) {
      console.error('Error loading summary data:', error);
      setSummaryData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tab) => {
    if (!customer) return;

    try {
      setLoading(true);
      let response;

      switch (tab) {
        case 'payments':
          response = await CustomerDetailApi.getCustomerPayments(customer.id, 1, 10);
          setPaymentsData(response.data || { data: [], pagination: {} });
          setPaymentsPage(1);
          break;
        case 'orders':
          response = await CustomerDetailApi.getCustomerOrders(customer.id, 1, 10);
          setOrdersData(response.data || { data: [], pagination: {} });
          setOrdersPage(1);
          break;
        case 'items':
          response = await CustomerDetailApi.getCustomerItemsServices(customer.id, 1, 20);
          setItemsData(response.data || { data: [], pagination: {} });
          setItemsPage(1);
          break;
        case 'followups':
          response = await CustomerDetailApi.getCustomerFollowups(customer.id, 1, 10);
          setFollowupsData(response.data || { data: [], pagination: {} });
          setFollowupsPage(1);
          break;
        case 'photos':
          response = await CustomerDetailApi.getCustomerShoesPhotos(customer.id, 1, 20);
          setPhotosData(response.data || { data: [], pagination: {} });
          setPhotosPage(1);
          break;
        case 'progress':
          response = await CustomerDetailApi.getCustomerProgressPhotos(customer.id, 1, 10);
          setProgressData(response.data || { data: [], pagination: {} });
          setProgressPage(1);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error loading ${tab} data:`, error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreData = async (tab) => {
    if (!customer) return;

    try {
      setLoadingMore(prev => ({ ...prev, [tab]: true }));
      let response;
      let nextPage;

      switch (tab) {
        case 'payments':
          nextPage = paymentsPage + 1;
          response = await CustomerDetailApi.getCustomerPayments(customer.id, nextPage, 10);
          setPaymentsData(prev => ({
            data: [...prev.data, ...(response.data?.data || [])],
            pagination: response.data?.pagination || prev.pagination
          }));
          setPaymentsPage(nextPage);
          break;
        case 'orders':
          nextPage = ordersPage + 1;
          response = await CustomerDetailApi.getCustomerOrders(customer.id, nextPage, 10);
          setOrdersData(prev => ({
            data: [...prev.data, ...(response.data?.data || [])],
            pagination: response.data?.pagination || prev.pagination
          }));
          setOrdersPage(nextPage);
          break;
        case 'items':
          nextPage = itemsPage + 1;
          response = await CustomerDetailApi.getCustomerItemsServices(customer.id, nextPage, 20);
          setItemsData(prev => ({
            data: [...prev.data, ...(response.data?.data || [])],
            pagination: response.data?.pagination || prev.pagination
          }));
          setItemsPage(nextPage);
          break;
        case 'followups':
          nextPage = followupsPage + 1;
          response = await CustomerDetailApi.getCustomerFollowups(customer.id, nextPage, 10);
          setFollowupsData(prev => ({
            data: [...prev.data, ...(response.data?.data || [])],
            pagination: response.data?.pagination || prev.pagination
          }));
          setFollowupsPage(nextPage);
          break;
        case 'photos':
          nextPage = photosPage + 1;
          response = await CustomerDetailApi.getCustomerShoesPhotos(customer.id, nextPage, 20);
          setPhotosData(prev => ({
            data: [...prev.data, ...(response.data?.data || [])],
            pagination: response.data?.pagination || prev.pagination
          }));
          setPhotosPage(nextPage);
          break;
        case 'progress':
          nextPage = progressPage + 1;
          response = await CustomerDetailApi.getCustomerProgressPhotos(customer.id, nextPage, 10);
          setProgressData(prev => ({
            data: [...prev.data, ...(response.data?.data || [])],
            pagination: response.data?.pagination || prev.pagination
          }));
          setProgressPage(nextPage);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error loading more ${tab} data:`, error);
    } finally {
      setLoadingMore(prev => ({ ...prev, [tab]: false }));
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab !== 'summary') {
      loadTabData(tab);
    }
  };

  // Photo gallery functions
  const openPhotoGallery = (photos, initialIndex = 0) => {
    // Convert photo_url to url_photo for PhotoGalleryModal compatibility
    const convertedPhotos = photos.map(photo => ({
      ...photo,
      url_photo: getPhotoUrl(photo.photo_url || photo.url_photo)
    }));
    setGalleryPhotos(convertedPhotos);
    setGalleryInitialIndex(initialIndex);
    setIsPhotoGalleryOpen(true);
  };

  const closePhotoGallery = () => {
    setIsPhotoGalleryOpen(false);
    setGalleryPhotos([]);
    setGalleryInitialIndex(0);
  };


  // Load More Button Component
  const LoadMoreButton = ({ tab, pagination, isLoading }) => {
    if (!pagination?.hasNextPage) return null;

    return (
      <div className="flex justify-center mt-4">
        <button
          onClick={() => loadMoreData(tab)}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            isLoading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              Memuat...
            </>
          ) : (
            'Muat Lebih Banyak'
          )}
        </button>
      </div>
    );
  };

  if (!isOpen || !customer) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 sm:p-8"
      style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(2rem, env(safe-area-inset-left))',
        paddingRight: 'max(2rem, env(safe-area-inset-right))'
      }}
    >
      <div 
        key={`modal-${customer?.id}-${isOpen}`}
        className="customer-detail-modal bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 md:p-6 flex-shrink-0 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold truncate">{customer.name}</h2>
                <div className="space-y-1 mt-1">
                  <div className="flex items-center gap-1 text-sm text-blue-100">
                    <Phone className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    <span className="truncate">{formatPhoneNumber(customer.phone)}</span>
                  </div>
                  {customer.branch && (
                    <div className="flex items-center gap-1 text-sm text-blue-100">
                      <MapPin className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                      <span className="truncate">{customer.branch.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors flex-shrink-0 ml-2"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>

        {/* Tabs - Fixed */}
        <div className="border-b border-gray-200 flex-shrink-0">
          <div className="customer-detail-tabs flex overflow-x-auto">
            {[
              { id: 'summary', label: 'Ringkasan', icon: TrendingUp, shortLabel: 'Ringkasan' },
              { id: 'payments', label: 'Pembayaran', icon: CreditCard, shortLabel: 'Bayar' },
              { id: 'orders', label: 'Pesanan', icon: Package, shortLabel: 'Order' },
              { id: 'items', label: 'Item & Layanan', icon: Package, shortLabel: 'Item' },
              { id: 'followups', label: 'Follow-up', icon: MessageSquare, shortLabel: 'Follow' },
              { id: 'photos', label: 'Foto Sepatu', icon: Camera, shortLabel: 'Foto' },
              { id: 'progress', label: 'Progress Status', icon: Clock, shortLabel: 'Progress' }
            ].map(({ id, label, icon: Icon, shortLabel }) => (
              <button
                key={id}
                onClick={() => handleTabClick(id)}
                className={`flex flex-col items-center gap-1 px-3 py-3 md:px-6 md:py-4 text-xs md:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors min-w-0 flex-shrink-0 ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4 md:w-4 md:h-4" />
                <span className="hidden md:inline">{label}</span>
                <span className="md:hidden">{shortLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div 
          className="customer-detail-content p-4 md:p-6 overflow-y-auto flex-1"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Summary Tab - Mobile Optimized */}
              {activeTab === 'summary' && summaryData && (
                <div className="space-y-4 md:space-y-6">
                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-xl p-3 md:p-4">
                    <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">Informasi Pelanggan</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                      <div>
                        <label className="text-xs md:text-sm text-gray-600">Nama Lengkap</label>
                        <p className="font-medium text-sm md:text-base">{summaryData.customer.name}</p>
                      </div>
                      <div>
                        <label className="text-xs md:text-sm text-gray-600">Nomor Telepon</label>
                        <p className="font-medium text-sm md:text-base">{formatPhoneNumber(summaryData.customer.phone)}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs md:text-sm text-gray-600">Alamat</label>
                        <p className="font-medium text-sm md:text-base">{summaryData.customer.address || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs md:text-sm text-gray-600">Outlet</label>
                        <p className="font-medium text-sm md:text-base">{summaryData.customer.branch?.name || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Statistics - Mobile Grid */}
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                    <div className="bg-blue-50 rounded-xl p-3 md:p-4 text-center">
                      <div className="text-lg md:text-2xl font-bold text-blue-600">{summaryData.summary.total_orders}</div>
                      <div className="text-xs md:text-sm text-blue-800">Total Pesanan</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 md:p-4 text-center">
                      <div className="text-lg md:text-2xl font-bold text-green-600">{summaryData.summary.total_payments}</div>
                      <div className="text-xs md:text-sm text-green-800">Total Pembayaran</div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3 md:p-4 text-center">
                      <div className="text-lg md:text-2xl font-bold text-purple-600">{summaryData.summary.total_items}</div>
                      <div className="text-xs md:text-sm text-purple-800">Total Item</div>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-3 md:p-4 text-center">
                      <div className="text-lg md:text-2xl font-bold text-orange-600">{summaryData.summary.total_services}</div>
                      <div className="text-xs md:text-sm text-orange-800">Total Layanan</div>
                    </div>
                  </div>

                  {/* Additional Info - Mobile Stack */}
                  <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                    <div className="bg-gray-50 rounded-xl p-3 md:p-4">
                      <h4 className="font-semibold text-gray-800 mb-2 text-sm md:text-base">Informasi Terkini</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs md:text-sm text-gray-600">Pesanan Terakhir:</span>
                          <span className="text-xs md:text-sm font-medium text-right">{formatDate(summaryData.summary.last_order_date)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs md:text-sm text-gray-600">Follow-up:</span>
                          <span className="text-xs md:text-sm font-medium">{summaryData.summary.follow_up_count} kali</span>
                        </div>
                        {/* <div className="flex justify-between items-center">
                          <span className="text-xs md:text-sm text-gray-600">Reminder:</span>
                          <span className="text-xs md:text-sm font-medium">{summaryData.summary.reminder_count} kali</span>
                        </div> */}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3 md:p-4">
                      <h4 className="font-semibold text-gray-800 mb-2 text-sm md:text-base">Membership</h4>
                      {summaryData.customer.current_membership && summaryData.customer.current_membership.status === 'active' ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                            <span className="font-medium text-sm md:text-base truncate">{summaryData.customer.current_membership.membership?.name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Badge untuk tier-based vs paid membership */}
                            {summaryData.customer.current_membership.payment_id === null || summaryData.customer.current_membership.payment_id === undefined ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                Tier-based (Poin)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                Paid Membership
                              </span>
                            )}
                          </div>
                          <div className="text-xs md:text-sm text-gray-600 space-y-1">
                            <div>
                              Mulai: {formatDate(summaryData.customer.current_membership.start_date)}
                            </div>
                            <div>
                              Berakhir: {
                                summaryData.customer.current_membership.end_date 
                                  ? formatDate(summaryData.customer.current_membership.end_date)
                                  : '(Permanen)'
                              }
                            </div>
                            {summaryData.customer.current_membership.end_date && (
                              <div className="text-blue-600 font-medium">
                                {(() => {
                                  const endDate = new Date(summaryData.customer.current_membership.end_date);
                                  const now = new Date();
                                  const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                                  if (daysRemaining > 0) {
                                    return `${daysRemaining} hari tersisa`;
                                  } else {
                                    return 'Expired';
                                  }
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm md:text-base">Tidak ada membership aktif</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Payments Tab - Mobile Optimized */}
              {activeTab === 'payments' && (
                <div className="space-y-3 md:space-y-4">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800">Riwayat Pembayaran</h3>
                  {!paymentsData.data || paymentsData.data.length === 0 ? (
                    <div className="text-center py-6 md:py-8 text-gray-500">
                      <CreditCard className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm md:text-base">Belum ada data pembayaran</p>
                    </div>
                  ) : (
                    <div className="space-y-2 md:space-y-3">
                      {paymentsData.data.map((payment) => (
                        <div key={payment.id} className="bg-gray-50 rounded-xl p-3 md:p-4">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm md:text-base truncate">{payment.code}</div>
                              <div className="text-xs md:text-sm text-gray-600">{formatDateTime(payment.createdAt)}</div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-semibold text-green-600 text-sm md:text-base">{formatCurrency(payment.final_price)}</div>
                              <div className={`text-xs px-2 py-1 rounded-full ${getPaymentStatusColors(payment.status)}`}>
                                {formatPaymentStatus(payment.status)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <LoadMoreButton 
                    tab="payments" 
                    pagination={paymentsData.pagination} 
                    isLoading={loadingMore.payments} 
                  />
                </div>
              )}

              {/* Orders Tab - Mobile Optimized */}
              {activeTab === 'orders' && (
                <div className="space-y-3 md:space-y-4">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800">Riwayat Pesanan</h3>
                  {!ordersData.data || ordersData.data.length === 0 ? (
                    <div className="text-center py-6 md:py-8 text-gray-500">
                      <Package className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm md:text-base">Belum ada data pesanan</p>
                    </div>
                  ) : (
                    <div className="space-y-2 md:space-y-3">
                      {ordersData.data.map((order) => (
                        <div key={order.id} className="bg-gray-50 rounded-xl p-3 md:p-4">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm md:text-base">Pesanan #{order.id}</div>
                              <div className="text-xs md:text-sm text-gray-600">{formatDate(order.entry_date)}</div>
                              <div className="text-xs text-blue-600">{formatOrderType(order.order_type)}</div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-semibold text-sm md:text-base">{order.quantity} item</div>
                              <div className="text-xs md:text-sm text-gray-600">{formatCurrency(order.payment?.final_price)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <LoadMoreButton 
                    tab="orders" 
                    pagination={ordersData.pagination} 
                    isLoading={loadingMore.orders} 
                  />
                </div>
              )}

              {/* Items Tab - Mobile Optimized */}
              {activeTab === 'items' && (
                <div className="space-y-3 md:space-y-4">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800">Item & Layanan</h3>
                  {!itemsData.data || itemsData.data.length === 0 ? (
                    <div className="text-center py-6 md:py-8 text-gray-500">
                      <Package className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm md:text-base">Belum ada data item/layanan</p>
                    </div>
                  ) : (
                    <div className="space-y-2 md:space-y-3">
                      {itemsData.data.map((item) => (
                        <div key={item.id} className="bg-gray-50 rounded-xl p-3 md:p-4">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm md:text-base truncate">{item.item?.name || 'Item'}</div>
                              <div className="text-xs md:text-sm text-gray-600 truncate">{item.treatment?.name}</div>
                              <div className="text-xs text-blue-600">{formatDate(item.order?.entry_date)}</div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-semibold text-sm md:text-base">{formatCurrency(item.final_price)}</div>
                              <div className={`text-xs px-2 py-1 rounded-full ${getOrderDetailStatusColors(item.status)}`}>
                                {formatOrderDetailStatus(item.status)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <LoadMoreButton 
                    tab="items" 
                    pagination={itemsData.pagination} 
                    isLoading={loadingMore.items} 
                  />
                </div>
              )}

              {/* Follow-ups Tab - Mobile Optimized */}
              {activeTab === 'followups' && (
                <div className="space-y-3 md:space-y-4">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800">Riwayat Follow-up</h3>
                  {!followupsData.data || followupsData.data.length === 0 ? (
                    <div className="text-center py-6 md:py-8 text-gray-500">
                      <MessageSquare className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm md:text-base">Belum ada data follow-up</p>
                    </div>
                  ) : (
                    <div className="space-y-2 md:space-y-3">
                      {followupsData.data.map((followup) => (
                        <div key={followup.id} className="bg-gray-50 rounded-xl p-3 md:p-4">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs md:text-sm text-gray-600 mb-2">{formatDateTime(followup.sent_at)}</div>
                              <div className="text-xs md:text-sm line-clamp-3">{followup.message_content}</div>
                            </div>
                            <div className="flex-shrink-0 ml-2">
                              <div className={`text-xs px-2 py-1 rounded-full ${
                                followup.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {followup.status === 'sent' ? 'Terkirim' : 'Belum Terkirim'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <LoadMoreButton 
                    tab="followups" 
                    pagination={followupsData.pagination} 
                    isLoading={loadingMore.followups} 
                  />
                </div>
              )}

              {/* Photos Tab - Mobile Optimized */}
              {activeTab === 'photos' && (
                <div className="space-y-3 md:space-y-4">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800">Foto Sepatu</h3>
                  {!photosData.data || photosData.data.length === 0 ? (
                    <div className="text-center py-6 md:py-8 text-gray-500">
                      <Camera className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm md:text-base">Belum ada foto sepatu</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                      {photosData.data.map((photo, index) => (
                        <div 
                          key={photo.id} 
                          className="bg-gray-50 rounded-xl p-2 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => openPhotoGallery(photosData.data, index)}
                        >
                          <img
                            src={photo.url_photo}
                            alt="Shoe photo"
                            className="w-full h-24 md:h-32 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <div className="text-xs text-gray-600 mt-2 text-center">
                            {formatDate(photo.createdAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <LoadMoreButton 
                    tab="photos" 
                    pagination={photosData.pagination} 
                    isLoading={loadingMore.photos} 
                  />
                </div>
              )}

              {/* Progress Status Tab - Gallery Focus */}
              {activeTab === 'progress' && (
                <div className="space-y-3 md:space-y-4">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800">Progress Status</h3>
                  {!progressData.data || progressData.data.length === 0 ? (
                    <div className="text-center py-6 md:py-8 text-gray-500">
                      <Clock className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm md:text-base">Belum ada progress status</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {progressData.data.map((orderDetail) => (
                        <div key={orderDetail.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                          {/* Header Info */}
                          <div className="p-4 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-800 text-sm md:text-base">
                                  {orderDetail.item?.brand || 'Unknown Brand'} {orderDetail.item?.name || 'Unknown Item'}
                                </h4>
                                <p className="text-xs md:text-sm text-gray-600 mt-1">
                                  {orderDetail.treatment?.name || 'Unknown Treatment'}
                                </p>
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                orderDetail.status === 'done' ? 'bg-green-100 text-green-800' :
                                orderDetail.status === 'on_progress' ? 'bg-blue-100 text-blue-800' :
                                orderDetail.status === 'pengeringan' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {formatOrderDetailStatus(orderDetail.status)}
                              </span>
                            </div>
                          </div>

                          {/* Gallery */}
                          <div className="p-4">
                            {orderDetail.status_logs && orderDetail.status_logs.length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {orderDetail.status_logs.map((log) => (
                                  log.item_status_photos && log.item_status_photos.map((photo, photoIndex) => {
                                    // Collect all photos for gallery
                                    const allPhotos = orderDetail.status_logs.flatMap(log => 
                                      log.item_status_photos || []
                                    );
                                    const currentPhotoIndex = allPhotos.findIndex(p => p.id === photo.id);
                                    
                                    return (
                                      <div 
                                        key={photo.id} 
                                        className="group relative cursor-pointer"
                                        onClick={() => openPhotoGallery(allPhotos, currentPhotoIndex)}
                                      >
                                        <img
                                          src={getPhotoUrl(photo.photo_url)}
                                          alt="Progress photo"
                                          className="w-full h-24 md:h-28 object-cover rounded-lg border border-gray-200 group-hover:shadow-md transition-shadow"
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                          }}
                                        />
                                        <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-60 text-white text-xs p-1 rounded text-center">
                                          {formatDateTime(log.created_at)}
                                        </div>
                                      </div>
                                    );
                                  })
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <Camera className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">Belum ada foto progress</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <LoadMoreButton 
                    tab="progress" 
                    pagination={progressData.pagination} 
                    isLoading={loadingMore.progress} 
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="border-t-2 border-gray-100 p-3 md:p-4 flex-shrink-0 bg-white rounded-b-2xl">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 md:px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm md:text-base font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        isOpen={isPhotoGalleryOpen}
        onClose={closePhotoGallery}
        photos={galleryPhotos}
        initialIndex={galleryInitialIndex}
      />
    </div>
  );
};

export default CustomerDetailModal;
