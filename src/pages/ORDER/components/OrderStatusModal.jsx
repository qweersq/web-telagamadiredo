import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, AlertCircle, Play, Pause, RotateCcw, Package, Truck, Home, ChevronRight, User, ArrowDownCircle, ArrowUpCircle, HelpCircle } from 'lucide-react';
import InfoModal from '../../../components/Modal/InfoModal';
import { 
  formatOrderDetailStatus,
  getOrderDetailStatusColors,
  ORDER_DETAIL_STATUS,
  isOrderDetailStatusEditable
} from '../../../utils/labelFormatter';
import { getUserProfile } from '../../../utils/userProfileHelper';
import instance from '../../../config/api';
import PhotoPopup from './PhotoPopup';
import DeliveryScheduleModal from './DeliveryScheduleModal';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const OrderStatusModal = ({ isOpen, onClose, order }) => {
  const [loading, setLoading] = useState(false);
  const [showPhotoPopup, setShowPhotoPopup] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [statusChangeData, setStatusChangeData] = useState(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedOrderDetailForDelivery, setSelectedOrderDetailForDelivery] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(order);
  const [statusHistoryData, setStatusHistoryData] = useState({});
  const [loadingHistory, setLoadingHistory] = useState({});
  const [tenantId, setTenantId] = useState(null);
  const [batchUpdating, setBatchUpdating] = useState(false);
  const [showBatchDeliveryModal, setShowBatchDeliveryModal] = useState(false);
  const [eligibleItemsForBatch, setEligibleItemsForBatch] = useState([]);
  const [showBatchInfoModal, setShowBatchInfoModal] = useState(false);
  const [completingItemId, setCompletingItemId] = useState(null);
  const [eligibleItemsForComplete, setEligibleItemsForComplete] = useState([]);
  const [batchCompleting, setBatchCompleting] = useState(false);

  // Update currentOrder when order prop changes
  useEffect(() => {
    if (order) {
      setCurrentOrder(order);
    }
  }, [order]);

  // Update eligible items for batch update when currentOrder changes
  useEffect(() => {
    if (currentOrder?.order_details) {
      // Semua item yang belum selesai / batal / sudah terjadwal pengantaran
      // kini bisa dijadwalkan pengantaran, bukan hanya SIAP & SIAP_DIAMBIL.
      const eligible = currentOrder.order_details.filter(detail => {
        const status = detail.status;
        return (
          status !== ORDER_DETAIL_STATUS.DONE &&
          status !== ORDER_DETAIL_STATUS.CANCELLED &&
          status !== ORDER_DETAIL_STATUS.SIAP_DIKIRIM
        );
      });
      setEligibleItemsForBatch(eligible);

      // Update eligible items for complete (all items that are not DONE and not CANCELLED)
      const eligibleForComplete = currentOrder.order_details.filter(detail => {
        const status = detail.status;
        return (
          status !== ORDER_DETAIL_STATUS.DONE &&
          status !== ORDER_DETAIL_STATUS.CANCELLED
        );
      });
      setEligibleItemsForComplete(eligibleForComplete);
    }
  }, [currentOrder]);

  // Load tenant ID and fetch status history when modal opens
  useEffect(() => {
    const loadTenantAndFetchHistory = async () => {
      if (isOpen && currentOrder?.order_details) {
        try {
          // Get tenant ID from user profile
          const profile = await getUserProfile();
          const userTenantId = profile?.user?.tenant_id;
          setTenantId(userTenantId);
          
          // Fetch status history for all order details
          await fetchAllStatusHistory(currentOrder.order_details, userTenantId);
        } catch (error) {
          console.error('Error loading tenant or fetching history:', error);
        }
      }
    };

    loadTenantAndFetchHistory();
  }, [isOpen, currentOrder]);

  // Fetch status history for single order detail
  const fetchStatusHistory = async (orderDetailId, userTenantId) => {
    try {
      setLoadingHistory(prev => ({ ...prev, [orderDetailId]: true }));
      
      const response = await instance.get(`/order-detail-status-log/${orderDetailId}/history?tenant_id=${userTenantId}`);
      
      if (response.data.success) {
        setStatusHistoryData(prev => ({
          ...prev,
          [orderDetailId]: response.data.data
        }));
      }
    } catch (error) {
      console.error(`Error fetching status history for order detail ${orderDetailId}:`, error);
      // Set empty array as fallback
      setStatusHistoryData(prev => ({
        ...prev,
        [orderDetailId]: []
      }));
    } finally {
      setLoadingHistory(prev => ({ ...prev, [orderDetailId]: false }));
    }
  };

  // Fetch status history for all order details
  const fetchAllStatusHistory = async (orderDetails, userTenantId) => {
    if (!userTenantId || !orderDetails?.length) return;
    
    const promises = orderDetails.map(detail => 
      fetchStatusHistory(detail.id, userTenantId)
    );
    
    await Promise.all(promises);
  };

  if (!isOpen || !currentOrder) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case ORDER_DETAIL_STATUS.NOT_YET:
        return <Clock className="w-3 h-3" />;
      case ORDER_DETAIL_STATUS.ANTRIAN:
        return <Play className="w-3 h-3" />;
      case ORDER_DETAIL_STATUS.ON_PROGRESS:
        return <RotateCcw className="w-3 h-3" />;
      case ORDER_DETAIL_STATUS.PENGERINGAN:
        return <Pause className="w-3 h-3" />;
      case ORDER_DETAIL_STATUS.SIAP:
      case ORDER_DETAIL_STATUS.SIAP_DIAMBIL:
        return <Package className="w-3 h-3" />;
      case ORDER_DETAIL_STATUS.SIAP_DIKIRIM:
        return <Truck className="w-3 h-3" />;
      case ORDER_DETAIL_STATUS.DONE:
        return <CheckCircle className="w-3 h-3" />;
      case ORDER_DETAIL_STATUS.CANCELLED:
      case ORDER_DETAIL_STATUS.NOT_READY:
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getStatusProgress = (status) => {
    const progressMap = {
      [ORDER_DETAIL_STATUS.NOT_YET]: 10,
      [ORDER_DETAIL_STATUS.ANTRIAN]: 20,
      [ORDER_DETAIL_STATUS.ON_PROGRESS]: 40,
      [ORDER_DETAIL_STATUS.PENGERINGAN]: 60,
      [ORDER_DETAIL_STATUS.SIAP]: 80,
      [ORDER_DETAIL_STATUS.SIAP_DIAMBIL]: 90,
      [ORDER_DETAIL_STATUS.SIAP_DIKIRIM]: 90,
      [ORDER_DETAIL_STATUS.DONE]: 100,
      [ORDER_DETAIL_STATUS.CANCELLED]: 0,
      [ORDER_DETAIL_STATUS.NOT_READY]: 0
    };
    return progressMap[status] || 0;
  };

  const formatDateTime = (dateString) => {
    try {
      return format(new Date(dateString), "dd MMM HH:mm", { locale: id });
    } catch (error) {
      return dateString;
    }
  };

  // Status sequence untuk menentukan urutan
  const STATUS_SEQUENCE = [
    ORDER_DETAIL_STATUS.NOT_YET,      // 0
    ORDER_DETAIL_STATUS.ANTRIAN,       // 1
    ORDER_DETAIL_STATUS.ON_PROGRESS,   // 2
    ORDER_DETAIL_STATUS.PENGERINGAN,   // 3
    ORDER_DETAIL_STATUS.SIAP,          // 4
    ORDER_DETAIL_STATUS.SIAP_DIKIRIM,  // 5
    ORDER_DETAIL_STATUS.DONE           // 6
  ];

  // Normalize status (SIAP_DIAMBIL = SIAP untuk display)
  const normalizeStatus = (status) => {
    return status === ORDER_DETAIL_STATUS.SIAP_DIAMBIL ? ORDER_DETAIL_STATUS.SIAP : status;
  };

  // Get status state berdasarkan sequence
  const getStatusState = (statusValue, currentStatus) => {
    const normalizedCurrent = normalizeStatus(currentStatus);
    const normalizedStatus = normalizeStatus(statusValue);
    
    const currentIndex = STATUS_SEQUENCE.indexOf(normalizedCurrent);
    const statusIndex = STATUS_SEQUENCE.indexOf(normalizedStatus);
    
    if (statusIndex === -1 || currentIndex === -1) {
      return 'disabled'; // Status tidak valid
    }
    
    if (statusIndex < currentIndex) {
      return 'completed'; // Status sudah lewat, harus ter-centang
    } else if (statusIndex === currentIndex) {
      return 'current'; // Status saat ini
    } else if (statusIndex === currentIndex + 1) {
      return 'available'; // Status berikutnya yang bisa dipilih
    } else if (normalizedCurrent === ORDER_DETAIL_STATUS.SIAP && 
               [ORDER_DETAIL_STATUS.SIAP_DIKIRIM, ORDER_DETAIL_STATUS.DONE].includes(normalizedStatus)) {
      return 'available'; // Flexible flow setelah SIAP
    } else if (normalizedCurrent === ORDER_DETAIL_STATUS.SIAP_DIKIRIM && 
               normalizedStatus === ORDER_DETAIL_STATUS.DONE) {
      return 'available'; // Flexible flow dari SIAP_DIKIRIM ke DONE
    } else {
      return 'disabled'; // Status yang belum bisa dipilih
    }
  };

  // Sequential flow (harus satu-satu sebelum SIAP)
  const getSequentialFlow = (currentStatus) => {
    const sequentialFlow = {
      [ORDER_DETAIL_STATUS.NOT_YET]: [ORDER_DETAIL_STATUS.ANTRIAN],
      [ORDER_DETAIL_STATUS.ANTRIAN]: [ORDER_DETAIL_STATUS.ON_PROGRESS],
      [ORDER_DETAIL_STATUS.ON_PROGRESS]: [ORDER_DETAIL_STATUS.PENGERINGAN],
      [ORDER_DETAIL_STATUS.PENGERINGAN]: [ORDER_DETAIL_STATUS.SIAP, ORDER_DETAIL_STATUS.SIAP_DIKIRIM], // Bisa ke SIAP atau SIAP_DIKIRIM
      [ORDER_DETAIL_STATUS.NOT_READY]: [ORDER_DETAIL_STATUS.ANTRIAN, ORDER_DETAIL_STATUS.ON_PROGRESS] // Retry only
    };
    
    return sequentialFlow[currentStatus] || [];
  };

  // Flexible flow (setelah SIAP bisa lompat)
  const getFlexibleFlow = (currentStatus) => {
    const flexibleFlow = {
      [ORDER_DETAIL_STATUS.SIAP]: [ORDER_DETAIL_STATUS.SIAP_DIAMBIL, ORDER_DETAIL_STATUS.SIAP_DIKIRIM, ORDER_DETAIL_STATUS.DONE],
      [ORDER_DETAIL_STATUS.SIAP_DIAMBIL]: [ORDER_DETAIL_STATUS.SIAP_DIKIRIM, ORDER_DETAIL_STATUS.DONE],
      [ORDER_DETAIL_STATUS.SIAP_DIKIRIM]: [ORDER_DETAIL_STATUS.DONE]
    };
    
    return flexibleFlow[currentStatus] || [];
  };

  // Main flow function
  const getAvailableStatuses = (currentStatus) => {
    // Jika status sudah SIAP atau setelahnya, gunakan flexible flow
    if ([ORDER_DETAIL_STATUS.SIAP, ORDER_DETAIL_STATUS.SIAP_DIAMBIL, ORDER_DETAIL_STATUS.SIAP_DIKIRIM].includes(currentStatus)) {
      return getFlexibleFlow(currentStatus);
    }
    
    // Jika status sebelum SIAP, gunakan sequential flow
    return getSequentialFlow(currentStatus);
  };

  // Check if status can be cancelled
  const canCancel = (currentStatus) => {
    const cancelableStatuses = [
      ORDER_DETAIL_STATUS.NOT_YET,
      ORDER_DETAIL_STATUS.ANTRIAN,
      ORDER_DETAIL_STATUS.ON_PROGRESS,
      ORDER_DETAIL_STATUS.PENGERINGAN
    ];
    
    return cancelableStatuses.includes(currentStatus);
  };

  // Get status sequence from current status to DONE
  const getStatusSequenceToDone = (currentStatus) => {
    const sequenceMap = {
      [ORDER_DETAIL_STATUS.NOT_YET]: [
        ORDER_DETAIL_STATUS.ANTRIAN,
        ORDER_DETAIL_STATUS.ON_PROGRESS,
        ORDER_DETAIL_STATUS.PENGERINGAN,
        ORDER_DETAIL_STATUS.SIAP,
        ORDER_DETAIL_STATUS.DONE,
      ],
      [ORDER_DETAIL_STATUS.ANTRIAN]: [
        ORDER_DETAIL_STATUS.ON_PROGRESS,
        ORDER_DETAIL_STATUS.PENGERINGAN,
        ORDER_DETAIL_STATUS.SIAP,
        ORDER_DETAIL_STATUS.DONE,
      ],
      [ORDER_DETAIL_STATUS.ON_PROGRESS]: [
        ORDER_DETAIL_STATUS.PENGERINGAN,
        ORDER_DETAIL_STATUS.SIAP,
        ORDER_DETAIL_STATUS.DONE,
      ],
      [ORDER_DETAIL_STATUS.PENGERINGAN]: [
        ORDER_DETAIL_STATUS.SIAP,
        ORDER_DETAIL_STATUS.DONE,
      ],
      [ORDER_DETAIL_STATUS.SIAP]: [ORDER_DETAIL_STATUS.DONE],
      [ORDER_DETAIL_STATUS.SIAP_DIKIRIM]: [ORDER_DETAIL_STATUS.DONE],
      [ORDER_DETAIL_STATUS.NOT_READY]: [
        ORDER_DETAIL_STATUS.ANTRIAN,
        ORDER_DETAIL_STATUS.ON_PROGRESS,
        ORDER_DETAIL_STATUS.PENGERINGAN,
        ORDER_DETAIL_STATUS.SIAP,
        ORDER_DETAIL_STATUS.DONE,
      ],
    };

    return sequenceMap[currentStatus] || [];
  };

  // Check if item can be completed (not DONE and not CANCELLED)
  const canCompleteItem = (currentStatus) => {
    return (
      currentStatus !== ORDER_DETAIL_STATUS.DONE &&
      currentStatus !== ORDER_DETAIL_STATUS.CANCELLED
    );
  };

  // Jadwalkan pengantaran bisa dilakukan dari status apa pun yang belum
  // selesai/batal dan belum berstatus siap dikirim.
  const canScheduleDelivery = (currentStatus) => {
    return (
      currentStatus !== ORDER_DETAIL_STATUS.DONE &&
      currentStatus !== ORDER_DETAIL_STATUS.CANCELLED &&
      currentStatus !== ORDER_DETAIL_STATUS.SIAP_DIKIRIM
    );
  };

  // Handle complete item (auto-progress to DONE)
  const handleCompleteItem = (orderDetailId) => {
    const orderDetail = currentOrder.order_details.find(d => d.id === orderDetailId);
    if (!orderDetail) return;

    const currentStatus = orderDetail.status;
    if (!canCompleteItem(currentStatus)) return;

    // Get sequence to DONE
    const sequence = getStatusSequenceToDone(currentStatus);
    if (sequence.length === 0) return;

    // Show confirmation
    setConfirmationData({
      orderDetailId,
      oldStatus: currentStatus,
      newStatus: ORDER_DETAIL_STATUS.DONE,
      orderDetail: orderDetail,
      isCompleteSequence: true,
      sequence: sequence,
    });
    setShowConfirmationModal(true);
  };

  // Handle confirm complete item (execute sequence)
  const handleConfirmCompleteItem = async () => {
    if (!confirmationData || !confirmationData.isCompleteSequence) return;

    // If this is batch complete, use the batch handler
    if (confirmationData.isBatchComplete) {
      await handleConfirmBatchCompleteItems();
      return;
    }

    try {
      setLoading(true);
      setCompletingItemId(confirmationData.orderDetailId);

      const profile = await getUserProfile();
      const userId = profile?.user?.id;

      if (!userId) {
        throw new Error('User ID tidak ditemukan');
      }

      const sequence = confirmationData.sequence;
      let updatedOrder = { ...currentOrder };
      let lastStatus = confirmationData.oldStatus;

      // Execute sequence one by one
      for (let i = 0; i < sequence.length; i++) {
        const newStatus = sequence[i];
        
        const payload = {
          old_status: lastStatus,
          new_status: newStatus,
          updated_by: userId,
          photos: [],
        };

        await instance.post(`/order-detail-process/${confirmationData.orderDetailId}`, payload);

        // Update local state after each step
        updatedOrder = {
          ...updatedOrder,
          order_details: updatedOrder.order_details.map(detail =>
            detail.id === confirmationData.orderDetailId
              ? {
                  ...detail,
                  status: newStatus,
                }
              : detail
          ),
        };

        setCurrentOrder(updatedOrder);
        lastStatus = newStatus;

        // Small delay between steps for better UX
        if (i < sequence.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // Refresh status history for the completed item
      if (tenantId) {
        await fetchStatusHistory(confirmationData.orderDetailId, tenantId);
      }

      // Trigger parent component to refresh
      window.dispatchEvent(new CustomEvent('orderStatusUpdated', { 
        detail: { orderId: currentOrder.id, updatedOrder } 
      }));

      // Show status change modal
      setStatusChangeData({
        orderDetailId: confirmationData.orderDetailId,
        oldStatus: confirmationData.oldStatus,
        newStatus: ORDER_DETAIL_STATUS.DONE,
        employee: profile?.user?.name || 'Unknown'
      });
      setShowStatusChangeModal(true);

      // Close confirmation modal
      setShowConfirmationModal(false);
      setConfirmationData(null);
    } catch (error) {
      console.error('Error completing item:', error);
      alert('Gagal menyelesaikan item: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
      setCompletingItemId(null);
    }
  };

  // Handle batch complete items
  const handleBatchCompleteItems = () => {
    if (eligibleItemsForComplete.length === 0) {
      return;
    }

    // Show confirmation with batch info
    setConfirmationData({
      orderDetailId: null, // null for batch
      oldStatus: null,
      newStatus: ORDER_DETAIL_STATUS.DONE,
      orderDetail: null,
      isCompleteSequence: true,
      isBatchComplete: true,
      batchItems: eligibleItemsForComplete,
      batchCount: eligibleItemsForComplete.length,
    });
    setShowConfirmationModal(true);
  };

  // Handle confirm batch complete items (execute sequence for all items)
  const handleConfirmBatchCompleteItems = async () => {
    if (!confirmationData || !confirmationData.isBatchComplete) return;

    try {
      setBatchCompleting(true);
      setLoading(true);

      const profile = await getUserProfile();
      const userId = profile?.user?.id;

      if (!userId) {
        throw new Error('User ID tidak ditemukan');
      }

      const batchItems = confirmationData.batchItems || [];
      const successItems = [];
      const failedItems = [];
      let updatedOrder = { ...currentOrder };

      // Loop semua item, untuk setiap item jalankan sequence sampai DONE
      for (const item of batchItems) {
        try {
          const currentStatus = item.status;
          const sequence = getStatusSequenceToDone(currentStatus);
          
          if (sequence.length === 0) {
            continue; // Skip jika tidak ada sequence
          }

          let lastStatus = currentStatus;

          // Execute sequence untuk item ini
          for (let i = 0; i < sequence.length; i++) {
            const newStatus = sequence[i];
            
            const payload = {
              old_status: lastStatus,
              new_status: newStatus,
              updated_by: userId,
              photos: [],
            };

            await instance.post(`/order-detail-process/${item.id}`, payload);

            // Update local state after each step
            updatedOrder = {
              ...updatedOrder,
              order_details: updatedOrder.order_details.map(detail =>
                detail.id === item.id
                  ? {
                      ...detail,
                      status: newStatus,
                    }
                  : detail
              ),
            };

            setCurrentOrder(updatedOrder);
            lastStatus = newStatus;

            // Small delay between steps for better UX
            if (i < sequence.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }

          // Refresh status history for the completed item
          if (tenantId) {
            await fetchStatusHistory(item.id, tenantId);
          }

          successItems.push(item);
        } catch (error) {
          console.error(`Error completing item ${item.id}:`, error);
          failedItems.push(item);
        }
      }

      // Trigger parent component to refresh
      window.dispatchEvent(new CustomEvent('orderStatusUpdated', { 
        detail: { orderId: currentOrder.id, updatedOrder } 
      }));

      // Show status change modal dengan info batch
      setStatusChangeData({
        orderDetailId: null, // null untuk batch
        oldStatus: null,
        newStatus: ORDER_DETAIL_STATUS.DONE,
        employee: profile?.user?.name || 'Unknown',
        batchCount: successItems.length,
        failedCount: failedItems.length
      });
      setShowStatusChangeModal(true);

      // Close confirmation modal
      setShowConfirmationModal(false);
      setConfirmationData(null);
    } catch (error) {
      console.error('Error batch completing items:', error);
      alert('Gagal menyelesaikan semua item: ' + (error.response?.data?.message || error.message));
    } finally {
      setBatchCompleting(false);
      setLoading(false);
    }
  };

  const isCancelledStatus = (status) => {
    return status === ORDER_DETAIL_STATUS.CANCELLED;
  };

  const getAllStatuses = () => [
    { value: ORDER_DETAIL_STATUS.NOT_YET, label: 'Menunggu' },
    { value: ORDER_DETAIL_STATUS.ANTRIAN, label: 'Antrian Kerja' },
    { value: ORDER_DETAIL_STATUS.ON_PROGRESS, label: 'Sedang Dikerjakan' },
    { value: ORDER_DETAIL_STATUS.PENGERINGAN, label: 'Sedang Dikeringkan' },
    { value: ORDER_DETAIL_STATUS.SIAP, label: 'Siap Diambil' },
    { value: ORDER_DETAIL_STATUS.SIAP_DIKIRIM, label: 'Siap Dikirim' },
    { value: ORDER_DETAIL_STATUS.DONE, label: 'Selesai' }
  ];

  // Check if penjemputan status is active
  const isPenjemputanActive = (orderDetail) => {
    return orderDetail.status === ORDER_DETAIL_STATUS.NOT_YET &&
           orderDetail.pickup_method === 'pickup' &&
           orderDetail.delivery_status === 'scheduled';
  };

  // Check if pengantaran status is active
  const isPengantaranActive = (orderDetail) => {
    return orderDetail.status === ORDER_DETAIL_STATUS.SIAP_DIKIRIM &&
           orderDetail.pickup_method === 'delivery' &&
           orderDetail.delivery_status === 'scheduled';
  };

  const getStatusHistory = (orderDetail) => {
    const history = [];
    const orderDetailId = orderDetail.id;
    
    // Get fetched status history data
    const fetchedHistory = statusHistoryData[orderDetailId] || [];
    
    // Add input item (from order_details.employee)
    if (orderDetail.employee) {
      history.push({
        status: ORDER_DETAIL_STATUS.NOT_YET,
        employee: orderDetail.employee,
        timestamp: orderDetail.createdAt || orderDetail.created_at,
        type: 'input'
      });
    }
    
    // Add status changes from fetched API data
    fetchedHistory.forEach(log => {
      history.push({
        status: log.new_status,
        employee: log.status_updater,
        timestamp: log.created_at,
        type: 'status_change',
        photos: log.item_status_photos || []
      });
    });
    
    return history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };

  const handleStatusChange = async (orderDetailId, newStatus) => {
    // Check if it's delivery status
    if (newStatus === ORDER_DETAIL_STATUS.SIAP_DIKIRIM) {
      const orderDetail = currentOrder.order_details.find(d => d.id === orderDetailId);
      setSelectedOrderDetailForDelivery(orderDetail);
      setShowDeliveryModal(true);
      return;
    }

    // Show confirmation modal for all status changes
    const orderDetail = currentOrder.order_details.find(d => d.id === orderDetailId);
    setConfirmationData({
      orderDetailId,
      oldStatus: orderDetail.status,
      newStatus: newStatus,
      orderDetail: orderDetail
    });
    setShowConfirmationModal(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmationData) return;

    // If this is a complete sequence, use the complete handler
    if (confirmationData.isCompleteSequence) {
      await handleConfirmCompleteItem();
      return;
    }

    try {
      setLoading(true);
      
      // Get user ID from profile
      const profile = await getUserProfile();
      const userId = profile?.user?.id;
      
      if (!userId) {
        throw new Error('User ID tidak ditemukan');
      }
      
      const payload = {
        old_status: confirmationData.oldStatus,
        new_status: confirmationData.newStatus,
        updated_by: userId,
        photos: [] // No photos required for quick status change
      };

      // Step 1: Update status via order-detail-process
      await instance.post(`/order-detail-process/${confirmationData.orderDetailId}`, payload);
      
      // Step 2: Check if this is pickup completion (not_yet -> antrian with pickup_method = 'pickup')
      const orderDetail = confirmationData.orderDetail;
      const isPickupCompletion = 
        confirmationData.oldStatus === ORDER_DETAIL_STATUS.NOT_YET &&
        confirmationData.newStatus === ORDER_DETAIL_STATUS.ANTRIAN &&
        orderDetail?.pickup_method === 'pickup' &&
        orderDetail?.delivery_status === 'scheduled';

      // Step 3: Check if this is delivery completion (siap_dikirim -> done with pickup_method = 'delivery')
      const isDeliveryCompletion = 
        confirmationData.oldStatus === ORDER_DETAIL_STATUS.SIAP_DIKIRIM &&
        confirmationData.newStatus === ORDER_DETAIL_STATUS.DONE &&
        orderDetail?.pickup_method === 'delivery' &&
        orderDetail?.delivery_status === 'scheduled';

      // Step 4: If pickup completion, update delivery_status to delivered (same as antrian kurir)
      if (isPickupCompletion) {
        await instance.put(`/order-details/${confirmationData.orderDetailId}`, {
          delivery_status: 'delivered'
        });
      }

      // Step 5: If delivery completion, update delivery_status to delivered (same as antrian kurir)
      if (isDeliveryCompletion) {
        await instance.put(`/order-details/${confirmationData.orderDetailId}`, {
          delivery_status: 'delivered'
        });
      }
      
      // Update local state
      const updatedOrder = {
        ...currentOrder,
        order_details: currentOrder.order_details.map(detail => 
          detail.id === confirmationData.orderDetailId 
            ? { 
                ...detail, 
                status: confirmationData.newStatus,
                ...((isPickupCompletion || isDeliveryCompletion) && { delivery_status: 'delivered' })
              }
            : detail
        )
      };
      
      // Update current order state
      setCurrentOrder(updatedOrder);
      
      // Trigger parent component to refresh
      window.dispatchEvent(new CustomEvent('orderStatusUpdated', { 
        detail: { orderId: currentOrder.id, updatedOrder } 
      }));
      
      // Show status change modal
      setStatusChangeData({
        orderDetailId: confirmationData.orderDetailId,
        oldStatus: confirmationData.oldStatus,
        newStatus: confirmationData.newStatus,
        employee: profile?.user?.name || 'Unknown'
      });
      setShowStatusChangeModal(true);
      
      // Close confirmation modal
      setShowConfirmationModal(false);
      setConfirmationData(null);
      
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Gagal mengubah status: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverySchedule = async (deliveryData) => {
    try {
      setLoading(true);
      
      // Get user ID from profile
      const profile = await getUserProfile();
      const userId = profile?.user?.id;
      
      if (!userId) {
        throw new Error('User ID tidak ditemukan');
      }
      
      // Step 1: Update status via order-detail-process
      const statusPayload = {
        old_status: selectedOrderDetailForDelivery.status,
        new_status: ORDER_DETAIL_STATUS.SIAP_DIKIRIM,
        updated_by: userId,
        photos: []
      };

      await instance.post(`/order-detail-process/${selectedOrderDetailForDelivery.id}`, statusPayload);
      
      // Step 2: Update delivery data via PUT order-details
      const deliveryPayload = {
        delivery_date: deliveryData.delivery_date,
        delivery_time: deliveryData.delivery_time,
        delivery_status: 'scheduled',
        pickup_method: deliveryData.pickup_method || 'delivery' // ✅ Include pickup_method
      };

      await instance.put(`/order-details/${selectedOrderDetailForDelivery.id}`, deliveryPayload);
      
      // Update local state
      const updatedOrder = {
        ...currentOrder,
        order_details: currentOrder.order_details.map(detail => 
          detail.id === selectedOrderDetailForDelivery.id 
            ? { 
                ...detail, 
                status: ORDER_DETAIL_STATUS.SIAP_DIKIRIM,
                delivery_date: deliveryData.delivery_date,
                delivery_time: deliveryData.delivery_time,
                delivery_status: 'scheduled',
                pickup_method: deliveryData.pickup_method || 'delivery' // ✅ Include pickup_method
              }
            : detail
        )
      };
      
      // Update current order state
      setCurrentOrder(updatedOrder);
      
      // Trigger parent component to refresh
      window.dispatchEvent(new CustomEvent('orderStatusUpdated', { 
        detail: { orderId: currentOrder.id, updatedOrder } 
      }));
      
      // Show status change modal
      setStatusChangeData({
        orderDetailId: selectedOrderDetailForDelivery.id,
        oldStatus: selectedOrderDetailForDelivery.status,
        newStatus: ORDER_DETAIL_STATUS.SIAP_DIKIRIM,
        employee: profile?.user?.name || 'Unknown',
        deliveryInfo: `${deliveryData.delivery_date} ${deliveryData.delivery_time}`
      });
      setShowStatusChangeModal(true);
      
      // Close delivery modal
      setShowDeliveryModal(false);
      setSelectedOrderDetailForDelivery(null);
      
    } catch (error) {
      console.error('Error updating delivery schedule:', error);
      alert('Gagal mengatur jadwal pengiriman: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk batch update ke Siap Dikirim
  const handleBatchStatusChange = () => {
    if (eligibleItemsForBatch.length === 0) {
      alert('Tidak ada item yang dapat diubah ke Siap Dikirim');
      return;
    }
    setShowBatchDeliveryModal(true);
  };

  // Handler untuk batch delivery schedule
  const handleBatchDeliverySchedule = async (deliveryData) => {
    if (eligibleItemsForBatch.length === 0) return;

    try {
      setBatchUpdating(true);
      
      // Get user ID from profile
      const profile = await getUserProfile();
      const userId = profile?.user?.id;
      
      if (!userId) {
        throw new Error('User ID tidak ditemukan');
      }

      const successItems = [];
      const failedItems = [];

      // Loop semua eligible items dan update satu per satu
      for (const item of eligibleItemsForBatch) {
        try {
          // Step 1: Update status via order-detail-process
          const statusPayload = {
            old_status: item.status,
            new_status: ORDER_DETAIL_STATUS.SIAP_DIKIRIM,
            updated_by: userId,
            photos: []
          };

          await instance.post(`/order-detail-process/${item.id}`, statusPayload);
          
          // Step 2: Update delivery data via PUT order-details
          const deliveryPayload = {
            delivery_date: deliveryData.delivery_date,
            delivery_time: deliveryData.delivery_time,
            delivery_status: 'scheduled',
            pickup_method: deliveryData.pickup_method || 'delivery'
          };

          await instance.put(`/order-details/${item.id}`, deliveryPayload);
          
          successItems.push(item);
        } catch (error) {
          console.error(`Error updating item ${item.id}:`, error);
          failedItems.push(item);
        }
      }

      // Update local state untuk semua item yang berhasil
      const updatedOrder = {
        ...currentOrder,
        order_details: currentOrder.order_details.map(detail => {
          const updatedItem = successItems.find(s => s.id === detail.id);
          if (updatedItem) {
            return {
              ...detail,
              status: ORDER_DETAIL_STATUS.SIAP_DIKIRIM,
              delivery_date: deliveryData.delivery_date,
              delivery_time: deliveryData.delivery_time,
              delivery_status: 'scheduled',
              pickup_method: deliveryData.pickup_method || 'delivery'
            };
          }
          return detail;
        })
      };
      
      // Update current order state
      setCurrentOrder(updatedOrder);
      
      // Trigger parent component to refresh
      window.dispatchEvent(new CustomEvent('orderStatusUpdated', { 
        detail: { orderId: currentOrder.id, updatedOrder } 
      }));
      
      // Close batch delivery modal
      setShowBatchDeliveryModal(false);
      
      // Show status change modal dengan info batch
      setStatusChangeData({
        orderDetailId: null, // null untuk batch
        oldStatus: null,
        newStatus: ORDER_DETAIL_STATUS.SIAP_DIKIRIM,
        employee: profile?.user?.name || 'Unknown',
        deliveryInfo: `${deliveryData.delivery_date} ${deliveryData.delivery_time}`,
        batchCount: successItems.length,
        failedCount: failedItems.length
      });
      setShowStatusChangeModal(true);
      
    } catch (error) {
      console.error('Error batch updating delivery schedule:', error);
      alert('Gagal mengatur jadwal pengiriman batch: ' + (error.response?.data?.message || error.message));
    } finally {
      setBatchUpdating(false);
    }
  };

  const handlePhotoClick = (orderDetail, photoIndex) => {
    setSelectedOrderDetail(orderDetail);
    setSelectedPhotoIndex(photoIndex);
    setShowPhotoPopup(true);
  };

  const getOrderDetailPhotos = (orderDetail) => {
    // Get photos from order detail's shoes_photos or item_status_photos
    const shoePhotos = orderDetail.shoes_photos || [];
    const statusPhotos = orderDetail.status_logs?.flatMap(log => 
      log.item_status_photos?.map(photo => photo.photo_url) || []
    ) || [];
    
    return [...shoePhotos.map(photo => photo.url_photo), ...statusPhotos];
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-6 sm:p-8" style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(2rem, env(safe-area-inset-left))',
        paddingRight: 'max(2rem, env(safe-area-inset-right))'
      }}>
        <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col max-h-[85vh] shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b-2 border-gray-100 flex-shrink-0 rounded-t-2xl">
            <h2 className="text-lg font-bold text-gray-800 font-montserrat">
              Status Pesanan #{currentOrder.id}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4" style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}>
          {/* Modern Customer Info */}
          <div className="mb-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-base font-semibold text-gray-800 font-montserrat">
                  {currentOrder.customer?.name || 'Customer'}
                </div>
                <div className="text-sm text-gray-600 font-montserrat">
                  {currentOrder.customer?.phone || 'Tidak ada nomor telepon'}
                </div>
              </div>
            </div>
          </div>

          {/* Order Details List - Interactive Checklist */}
          <div className="space-y-3">
            {currentOrder.order_details?.map((detail, index) => {
              const photos = getOrderDetailPhotos(detail);
              const currentStatus = detail.status;
              const availableStatuses = getAvailableStatuses(currentStatus);
              const allStatuses = getAllStatuses();
              const statusHistory = getStatusHistory(detail);
              const isHistoryLoading = loadingHistory[detail.id] || false;

              return (
                <div key={detail.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                  {/* Modern Item Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">T</span>
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-800 font-montserrat">
                            {detail.treatment?.name || 'Treatment'}
                          </h3>
                        </div>
                      </div>
                    </div>
                    
                    {/* Modern Current Status */}
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        currentStatus === ORDER_DETAIL_STATUS.DONE ? 'bg-green-500' :
                        currentStatus === ORDER_DETAIL_STATUS.CANCELLED ? 'bg-red-500' :
                        currentStatus === ORDER_DETAIL_STATUS.ON_PROGRESS ? 'bg-blue-500' :
                        'bg-gray-400'
                      }`}></div>
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        currentStatus === ORDER_DETAIL_STATUS.DONE ? 'bg-green-100 text-green-700' :
                        currentStatus === ORDER_DETAIL_STATUS.CANCELLED ? 'bg-red-100 text-red-700' :
                        currentStatus === ORDER_DETAIL_STATUS.ON_PROGRESS ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {formatOrderDetailStatus(currentStatus)}
                      </span>
                    </div>
                  </div>

                  {/* Item Name - Format: [BRAND] - [NAME] (WARNA) */}
                  {detail.item && (
                    <div className="mb-2">
                      <div className="text-sm font-semibold text-gray-700 font-montserrat">
                        {(() => {
                          const brand = detail.item?.brand || '';
                          const name = detail.item?.name || 'Item Belum di Input';
                          const color = detail.item?.color || '';
                          const parts = [];
                          if (brand) parts.push(brand);
                          if (name) parts.push(name);
                          const itemText = parts.length > 0 ? parts.join(' - ') : 'Item Belum di Input';
                          const colorText = color ? ` (${color})` : '';
                          return `${itemText}${colorText}`;
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Item Details: Created Date, Due Date & Employee - Redesigned */}
                  <div className="mb-4 space-y-2">
                    {detail.due_date && (
                      <div className="flex items-center gap-2 bg-red-50 border-l-4 border-red-500 px-3 py-2 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-sm font-semibold text-red-700 font-montserrat">
                          Estimasi: {format(new Date(detail.due_date), 'dd MMM yyyy', { locale: id })}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4">
                      {detail.createdAt && (
                        <div className="flex-1 min-w-[120px]">
                          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-montserrat mb-1">
                            Dibuat
                          </div>
                          <div className="text-xs font-semibold text-gray-700 font-montserrat">
                            {format(new Date(detail.createdAt), 'dd MMM yyyy', { locale: id })}
                          </div>
                        </div>
                      )}
                      {detail.employee?.name && (
                        <div className="flex-1 min-w-[120px]">
                          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-montserrat mb-1">
                            Pencatat
                          </div>
                          <div className="text-xs font-semibold text-gray-700 font-montserrat">
                            {detail.employee.name}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modern Photos Preview - Moved after item details, before status progress */}
                  {photos.length > 0 && (
                    <div className="mb-4">
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {photos.slice(0, 3).map((url, idx) => (
                          <div
                            key={idx}
                            onClick={() => handlePhotoClick(detail, idx)}
                            className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:scale-105 transition-transform shadow-sm"
                          >
                            <img
                              src={url}
                              alt={`Photo ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {photos.length > 3 && (
                          <button
                            onClick={() => handlePhotoClick(detail, 3)}
                            className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 text-gray-500 text-xs border border-gray-200 hover:bg-gray-200 transition-colors"
                          >
                            +{photos.length - 3}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Modern Status Progress - Clean Design */}
                  <div className="space-y-2">
                    {isHistoryLoading ? (
                      <div className="flex items-center justify-center py-4 bg-gray-50 rounded-lg">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                        <span className="ml-2 text-sm text-gray-500">Loading status history...</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {/* Status "Item Dibuat" - selalu muncul di awal */}
                        {detail.createdAt && (
                          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-green-50 border-l-4 border-l-green-500 text-green-800">
                            <div className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full">
                              <span className="text-white text-xs font-bold">✓</span>
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium">Item Dibuat</span>
                              {detail.employee && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {detail.employee?.name || 'Unknown'} • {formatDateTime(detail.createdAt)}
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                              Selesai
                            </span>
                          </div>
                        )}

                        {allStatuses.map((status, index) => {
                          // Skip not_yet jika tidak ada penjemputan aktif (karena sudah ada "Item Dibuat" di awal)
                          if (status.value === ORDER_DETAIL_STATUS.NOT_YET && !isPenjemputanActive(detail)) {
                            return null;
                          }

                          // Skip siap_dikirim jika pengantaran aktif
                          if (status.value === ORDER_DETAIL_STATUS.SIAP_DIKIRIM && isPengantaranActive(detail)) {
                            return (
                              <React.Fragment key={status.value}>
                                {/* Status Pengantaran - menggantikan siap_dikirim */}
                                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-indigo-50 border-l-4 border-l-indigo-500 text-indigo-800">
                                  <div className="flex items-center justify-center w-5 h-5 bg-indigo-500 rounded-full">
                                    <ArrowUpCircle className="w-3 h-3 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <span className="text-sm font-medium">Menunggu Pengantaran</span>
                                    {detail.delivery_date && detail.delivery_time && (
                                      <div className="text-xs text-indigo-600 mt-0.5">
                                        {format(new Date(detail.delivery_date), "dd MMM yyyy", { locale: id })} • {detail.delivery_time}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                                    Terjadwal
                                  </span>
                                </div>
                              </React.Fragment>
                            );
                          }

                          const statusState = getStatusState(status.value, currentStatus);
                          const historyItem = statusHistory.find(h => h.status === status.value);
                          const isClickable = statusState === 'available';

                          // Modern status styling
                          const getStatusStyle = () => {
                            switch (statusState) {
                              case 'completed':
                                return 'bg-green-50 border-l-4 border-l-green-500 text-green-800';
                              case 'current':
                                return 'bg-blue-50 border-l-4 border-l-blue-500 text-blue-800';
                              case 'available':
                                return 'bg-gray-50 border-l-4 border-l-gray-300 text-gray-700 cursor-pointer hover:bg-gray-100 hover:border-l-gray-400';
                              case 'disabled':
                                return 'bg-gray-25 border-l-4 border-l-gray-200 text-gray-400';
                              default:
                                return 'bg-gray-25 border-l-4 border-l-gray-200 text-gray-400';
                            }
                          };

                          // Modern status indicator
                          const getStatusIndicator = () => {
                            switch (statusState) {
                              case 'completed':
                                return (
                                  <div className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full">
                                    <span className="text-white text-xs font-bold">✓</span>
                                  </div>
                                );
                              case 'current':
                                return (
                                  <div className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full">
                                    <span className="text-white text-xs font-bold">●</span>
                                  </div>
                                );
                              case 'available':
                                return (
                                  <div className="flex items-center justify-center w-5 h-5 border-2 border-gray-400 rounded-full hover:border-gray-500">
                                    <span className="text-gray-400 text-xs">○</span>
                                  </div>
                                );
                              case 'disabled':
                                return (
                                  <div className="flex items-center justify-center w-5 h-5 border-2 border-gray-300 rounded-full bg-gray-100">
                                    <span className="text-gray-300 text-xs">○</span>
                                  </div>
                                );
                              default:
                                return (
                                  <div className="flex items-center justify-center w-5 h-5 border-2 border-gray-300 rounded-full bg-gray-100">
                                    <span className="text-gray-300 text-xs">○</span>
                                  </div>
                                );
                            }
                          };

                          return (
                            <React.Fragment key={status.value}>
                              <div
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${getStatusStyle()}`}
                                onClick={isClickable ? () => handleStatusChange(detail.id, status.value) : undefined}
                                title={historyItem ? `${historyItem.employee?.name || 'Unknown'} • ${formatDateTime(historyItem.timestamp)}` : (isClickable ? 'Click to change status' : 'Not available')}
                              >
                                {/* Modern Status Indicator */}
                                {getStatusIndicator()}

                                {/* Status Label */}
                                <div className="flex-1">
                                  <span className="text-sm font-medium">
                                    {status.label}
                                  </span>
                                  {historyItem && (
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      {historyItem.employee?.name || 'Unknown'} • {formatDateTime(historyItem.timestamp)}
                                    </div>
                                  )}
                                </div>

                                {/* Status Badge */}
                                {statusState === 'completed' && (
                                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                    Selesai
                                  </span>
                                )}
                                {statusState === 'current' && (
                                  <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                    Aktif
                                  </span>
                                )}
                                {statusState === 'available' && (
                                  <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                    Tersedia
                                  </span>
                                )}
                              </div>

                              {/* Status Penjemputan - muncul setelah not_yet jika kondisi terpenuhi */}
                              {status.value === ORDER_DETAIL_STATUS.NOT_YET && isPenjemputanActive(detail) && (
                                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-purple-50 border-l-4 border-l-purple-500 text-purple-800">
                                  <div className="flex items-center justify-center w-5 h-5 bg-purple-500 rounded-full">
                                    <ArrowDownCircle className="w-3 h-3 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <span className="text-sm font-medium">Menunggu Penjemputan</span>
                                    {detail.delivery_date && detail.delivery_time && (
                                      <div className="text-xs text-purple-600 mt-0.5">
                                        {format(new Date(detail.delivery_date), "dd MMM yyyy", { locale: id })} • {detail.delivery_time}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                                    Terjadwal
                                  </span>
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Modern Complete Item Button */}
                  {canCompleteItem(currentStatus) && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleCompleteItem(detail.id)}
                        disabled={loading && completingItemId === detail.id}
                        className={`w-full px-4 py-3 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 hover:border-green-300 transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2 ${
                          loading && completingItemId === detail.id ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                      >
                        {loading && completingItemId === detail.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Menyelesaikan...</span>
                          </>
                        ) : (
                          <>
                            <span className="text-green-600">✓</span>
                            <span>Selesaikan Item</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Jadwalkan Pengantaran - tersedia dari status apa pun */}
                  {canScheduleDelivery(currentStatus) && (
                    <div className="mt-2">
                      <button
                        onClick={() => handleStatusChange(detail.id, ORDER_DETAIL_STATUS.SIAP_DIKIRIM)}
                        disabled={loading}
                        className={`w-full px-4 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2 ${
                          loading ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                      >
                        <Truck className="w-4 h-4" />
                        <span>Jadwalkan Pengantaran</span>
                      </button>
                    </div>
                  )}

                  {/* Modern Delivery Info */}
                  {/* {detail.delivery_date && detail.delivery_time && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">Info Pengiriman</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-xs font-semibold">D</span>
                          <span>{formatDateTime(detail.delivery_date)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-xs font-semibold">T</span>
                          <span>{detail.delivery_time}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-xs font-semibold">A</span>
                          <span>{currentOrder.customer?.address || 'Tidak ada alamat'}</span>
                        </div>
                        {detail.delivery_status && (
                          <div className="mt-3">
                            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                              detail.delivery_status === 'scheduled' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              detail.delivery_status === 'on_the_way' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                              detail.delivery_status === 'delivered' ? 'bg-green-50 text-green-700 border border-green-200' :
                              detail.delivery_status === 'failed' ? 'bg-red-50 text-red-700 border border-red-200' :
                              'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${
                                detail.delivery_status === 'scheduled' ? 'bg-blue-500' :
                                detail.delivery_status === 'on_the_way' ? 'bg-yellow-500' :
                                detail.delivery_status === 'delivered' ? 'bg-green-500' :
                                detail.delivery_status === 'failed' ? 'bg-red-500' :
                                'bg-gray-500'
                              }`}></div>
                              <span>
                                {detail.delivery_status === 'scheduled' ? 'Dijadwalkan' :
                                 detail.delivery_status === 'on_the_way' ? 'Sedang Dikirim' :
                                 detail.delivery_status === 'delivered' ? 'Sudah Diterima' :
                                 detail.delivery_status === 'failed' ? 'Gagal Dikirim' :
                                 detail.delivery_status}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )} */}

                </div>
              );
            })}
          </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white space-y-3">
            {/* Batch Complete Items Button */}
            {eligibleItemsForComplete.length > 0 && (
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={handleBatchCompleteItems}
                  disabled={batchCompleting || loading}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all font-semibold font-montserrat text-xs shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {batchCompleting ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Menyelesaikan...</span>
                    </>
                  ) : (
                    <>
                      <span>Selesaikan {eligibleItemsForComplete.length} Item</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Batch Update Button */}
            {eligibleItemsForBatch.length > 0 && (
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={handleBatchStatusChange}
                  disabled={batchUpdating || loading}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all font-semibold font-montserrat text-xs shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {batchUpdating ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span>Jadwalkan Pengantaran {eligibleItemsForBatch.length} Item</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowBatchInfoModal(true)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
                  title="Penjelasan Batch Update"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium font-montserrat"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Popup */}
      {showPhotoPopup && selectedOrderDetail && (
        <PhotoPopup
          photos={getOrderDetailPhotos(selectedOrderDetail)}
          isOpen={showPhotoPopup}
          onClose={() => setShowPhotoPopup(false)}
          initialIndex={selectedPhotoIndex}
        />
      )}

      {/* Status Change Success Modal */}
      {showStatusChangeModal && statusChangeData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-6 sm:p-8" style={{
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(2rem, env(safe-area-inset-left))',
          paddingRight: 'max(2rem, env(safe-area-inset-right))'
        }}>
          <div className="bg-white rounded-2xl w-full max-w-sm flex flex-col max-h-[85vh] shadow-xl">
            <div className="flex-1 overflow-y-auto p-6 text-center" style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}>
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              
              {/* Success Message */}
              <h3 className="text-lg font-bold text-gray-800 mb-2 font-montserrat">
                Status Berhasil Diubah!
              </h3>
              
              {/* Status Change Info */}
              <div className="text-sm text-gray-600 mb-4">
                {statusChangeData.orderDetailId ? (
                  // Single item update
                  <>
                    <div className="mb-2">
                      <span className="font-semibold">Dari:</span> {formatOrderDetailStatus(statusChangeData.oldStatus)}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Ke:</span> {formatOrderDetailStatus(statusChangeData.newStatus)}
                    </div>
                    {statusChangeData.deliveryInfo && (
                      <div className="mb-2">
                        <span className="font-semibold">Pengiriman:</span> {statusChangeData.deliveryInfo}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Diubah oleh: {statusChangeData.employee}
                    </div>
                  </>
                ) : (
                  // Batch update
                  <>
                    <div className="mb-2">
                      <span className="font-semibold">Status:</span> {formatOrderDetailStatus(statusChangeData.newStatus)}
                    </div>
                    {statusChangeData.deliveryInfo && (
                      <div className="mb-2">
                        <span className="font-semibold">Pengiriman:</span> {statusChangeData.deliveryInfo}
                      </div>
                    )}
                    <div className="mb-2">
                      <span className="font-semibold text-green-600">
                        ✓ {statusChangeData.batchCount || 0} item berhasil diubah
                      </span>
                    </div>
                    {statusChangeData.failedCount > 0 && (
                      <div className="mb-2">
                        <span className="font-semibold text-red-600">
                          ✗ {statusChangeData.failedCount} item gagal diubah
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Diubah oleh: {statusChangeData.employee}
                    </div>
                  </>
                )}
              </div>
            </div>
              
            {/* Footer with Close Button */}
            <div className="p-4 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
              <button
                onClick={() => {
                  setShowStatusChangeModal(false);
                  setStatusChangeData(null);
                }}
                className="w-full px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors font-montserrat"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Schedule Modal - Single Item */}
      <DeliveryScheduleModal
        isOpen={showDeliveryModal}
        onClose={() => {
          setShowDeliveryModal(false);
          setSelectedOrderDetailForDelivery(null);
        }}
        onSchedule={handleDeliverySchedule}
        orderDetail={selectedOrderDetailForDelivery}
        customer={currentOrder?.customer}
        loading={loading}
      />

      {/* Delivery Schedule Modal - Batch Update */}
      <DeliveryScheduleModal
        isOpen={showBatchDeliveryModal}
        onClose={() => {
          setShowBatchDeliveryModal(false);
        }}
        onSchedule={handleBatchDeliverySchedule}
        orderDetail={null}
        customer={currentOrder?.customer}
        loading={batchUpdating}
        isBatchMode={true}
        batchCount={eligibleItemsForBatch.length}
      />

      {/* Batch Update Info Modal */}
      <InfoModal
        isOpen={showBatchInfoModal}
        onClose={() => setShowBatchInfoModal(false)}
        title="Penjelasan Jadwalkan Pengantaran (Batch)"
        items={[
          {
            title: "Fungsi",
            description: "Menjadwalkan pengantaran beberapa item sekaligus. Status item langsung menjadi 'Siap Dikirim' (Menunggu Pengantaran) beserta tanggal & waktu pengiriman",
            bgColor: "bg-blue-50",
            dotColor: "bg-blue-500",
            titleColor: "text-blue-700"
          },
          {
            title: "Item yang Bisa Dijadwalkan",
            description: "Semua item yang belum 'Selesai', belum 'Dibatalkan', dan belum 'Siap Dikirim' — termasuk yang masih Antrian Kerja / Sedang Dikerjakan / Sedang Dikeringkan",
            bgColor: "bg-green-50",
            dotColor: "bg-green-500",
            titleColor: "text-green-700"
          },
          {
            title: "Jadwal Pengiriman",
            description: "Semua item akan dijadwalkan dengan tanggal dan waktu pengiriman yang sama",
            bgColor: "bg-purple-50",
            dotColor: "bg-purple-500",
            titleColor: "text-purple-700"
          }
        ]}
        footerInfo={{
          icon: "💡",
          text: "Item yang dilompati ke Siap Dikirim akan melewati tahapan QC & tidak punya riwayat QC"
        }}
      />

      {/* Confirmation Modal */}
      {showConfirmationModal && confirmationData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-6 sm:p-8" style={{
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(2rem, env(safe-area-inset-left))',
          paddingRight: 'max(2rem, env(safe-area-inset-right))'
        }}>
          <div className="bg-white rounded-2xl max-w-md w-full flex flex-col max-h-[85vh] shadow-xl font-montserrat">
            <div className="flex-1 overflow-y-auto p-6 text-center" style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}>
              <h3 className="text-lg font-bold text-gray-800 mb-4 font-montserrat">Konfirmasi Perubahan Status</h3>
              
              {confirmationData.isCompleteSequence ? (
                <>
                  {confirmationData.isBatchComplete ? (
                    <>
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2 font-montserrat">Anda akan menyelesaikan semua item:</p>
                        <p className="font-bold text-gray-800 font-montserrat">{confirmationData.batchCount} Item</p>
                        <p className="text-sm text-gray-600 mb-2 mt-2 font-montserrat">Semua item akan diupdate secara berurutan sampai:</p>
                        <p className="font-bold text-blue-600 font-montserrat">{formatOrderDetailStatus(confirmationData.newStatus)}</p>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800 font-montserrat">
                          ⚠️ <strong className="font-montserrat">PERINGATAN:</strong> Semua item akan diupdate secara berurutan satu per satu. Proses ini tidak dapat dibatalkan!
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2 font-montserrat">Anda akan menyelesaikan item ini:</p>
                        <p className="font-bold text-gray-800 font-montserrat">{formatOrderDetailStatus(confirmationData.oldStatus)}</p>
                        <p className="text-sm text-gray-600 mb-2 mt-2 font-montserrat">Status akan diupdate secara berurutan sampai:</p>
                        <p className="font-bold text-blue-600 font-montserrat">{formatOrderDetailStatus(confirmationData.newStatus)}</p>
                      </div>



                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800 font-montserrat">
                          ⚠️ <strong className="font-montserrat">PERINGATAN:</strong> Status akan diupdate secara berurutan. Proses ini tidak dapat dibatalkan!
                        </p>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2 font-montserrat">Anda akan mengubah status dari:</p>
                    <p className="font-bold text-gray-800 font-montserrat">{formatOrderDetailStatus(confirmationData.oldStatus)}</p>
                    <p className="text-sm text-gray-600 mb-2 mt-2 font-montserrat">Menjadi:</p>
                    <p className="font-bold text-blue-600 font-montserrat">{formatOrderDetailStatus(confirmationData.newStatus)}</p>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 font-montserrat">
                      ⚠️ <strong className="font-montserrat">PERINGATAN:</strong> Perubahan status tidak dapat dibatalkan!
                      Pastikan status yang dipilih sudah benar.
                    </p>
                  </div>
                </>
              )}
            </div>
              
            {/* Footer with Action Buttons */}
            <div className="p-4 border-t-2 border-gray-100 flex-shrink-0 rounded-b-2xl bg-white">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmationModal(false);
                    setConfirmationData(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold font-montserrat text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmStatusChange}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold font-montserrat text-sm disabled:opacity-50 text-center"
                >
                  {loading 
                    ? 'Memproses...' 
                    : confirmationData.isCompleteSequence
                      ? confirmationData.isBatchComplete
                        ? `Ya, Selesaikan ${confirmationData.batchCount} Item`
                        : 'Ya, Selesaikan Item'
                      : 'Ya, Ubah Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderStatusModal;
