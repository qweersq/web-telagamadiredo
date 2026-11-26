import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getOrders } from '../api/orderApi';
import { transformOrderListNew } from '../utils/orderTransformNew';

export const useOrderDashboardData = (params) => {
  
  // Memoize params to prevent unnecessary re-renders (without shouldFetch)
  const memoizedParams = useMemo(() => {
    // Extract shouldFetch separately
    const { shouldFetch, ...restParams } = params || {};
    return restParams;
  }, [
    params?.page,
    params?.pageSize,
    params?.search,
    params?.startDate,
    params?.endDate,
    params?.dateFilterType,
    params?.status,
    params?.paymentStatus
    // ✅ FIX: shouldFetch handled separately to prevent double trigger
  ]);
  
  // ✅ FIX: Track shouldFetch separately
  const shouldFetchRef = useRef(params?.shouldFetch || false);
  
  // State untuk orders dan pagination
  const [orders, setOrders] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State untuk infinite scroll pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Helper function untuk build filter object
  const buildFilterObject = useCallback((fetchParams) => {
    const filterObj = {};

    const hasSearch = fetchParams.search && fetchParams.search.trim();

    // Add search filter
    if (hasSearch) {
      filterObj.search = fetchParams.search.trim();
    }

    // Add status filter - hanya jika status ada dan bukan 'all' dan tidak ada search
    if (fetchParams.status && fetchParams.status !== 'all' && fetchParams.status !== '' && !hasSearch) {
      filterObj["order_details.status"] = [fetchParams.status];
    }

    // Add payment status filter - hanya jika paymentStatus ada dan bukan 'all' dan tidak ada search
    if (fetchParams.paymentStatus && fetchParams.paymentStatus !== 'all' && fetchParams.paymentStatus !== '' && !hasSearch) {
      filterObj["payment.status"] = fetchParams.paymentStatus;
    }

    // Add date filter berdasarkan dateFilterType
    if (!hasSearch && fetchParams.startDate && fetchParams.endDate && fetchParams.dateFilterType && fetchParams.dateFilterType.trim()) {
      const startDate = fetchParams.startDate;
      const endDate = fetchParams.endDate;

      switch (fetchParams.dateFilterType) {
        case 'entry_date':
          // Format: {"entry_date": {"gte": "2025-07-25", "lte": "2025-07-28"}}
          if (startDate === endDate) {
            filterObj.entry_date = startDate;
          } else {
            filterObj.entry_date = { gte: startDate, lte: endDate };
          }
          break;

        case 'due_date':
          // Format: {"order_details.due_date": {"gte": "2025-07-25", "lte": "2025-07-28"}}
          if (startDate === endDate) {
            filterObj["order_details.due_date"] = startDate;
          } else {
            filterObj["order_details.due_date"] = { gte: startDate, lte: endDate };
          }
          break;

        case 'payment_date':
          // Format: {"payment_details.created_at": {"gte": "2025-07-25", "lte": "2025-07-28"}}
          if (startDate === endDate) {
            filterObj["payment_details.createdAt"] = startDate;
          } else {
            filterObj["payment_details.createdAt"] = { gte: startDate, lte: endDate };
          }
          break;

        default:
          // Default ke entry_date jika tidak ada yang dipilih
          if (startDate === endDate) {
            filterObj.entry_date = startDate;
          } else {
            filterObj.entry_date = { gte: startDate, lte: endDate };
          }
          break;
      }
    } else {
      // Only add default date filter if there's no search term
      // If there's a search term, we want to search all dates
      if (!hasSearch) {
        // ✅ FIX: Default filter: hari ini untuk entry_date jika tidak ada filter tanggal dan tidak ada search
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        filterObj.entry_date = todayStr; // ✅ FIX: Default hari ini (bukan kemarin-hari ini)
      }
      // If there's a search term, don't add any date filter (search all dates)
    }

    return filterObj;
  }, []);

  // Fetch orders data - untuk initial load atau filter change
  const fetchOrdersData = useCallback(async (fetchParams = memoizedParams, isLoadMore = false, targetPage = null) => {
    
    // ✅ FIX: Skip fetch jika shouldFetch = false (check from ref)
    if (!shouldFetchRef.current) {
      return;
    }
    
    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Build filter object
      const filterObj = buildFilterObject(fetchParams);
      
      // Prepare API params
      const apiParams = {
        page: isLoadMore ? (targetPage || currentPage) : 1, // Gunakan targetPage jika ada
        pageSize: 10, // Fixed page size untuk infinite scroll
      };

      // Add filter jika ada
      if (Object.keys(filterObj).length > 0) {
        apiParams.filter = JSON.stringify(filterObj);
      }

      const apiResponse = await getOrders(apiParams);
      
      if (apiResponse) {
        const transformedOrders = transformOrderListNew(apiResponse.orders || []);
        
        if (isLoadMore) {
          // Append data baru untuk infinite scroll
          setOrders(prev => [...prev, ...transformedOrders]);
        } else {
          // Replace data untuk filter change atau initial load
          setOrders(transformedOrders);
        }
        
        // Update pagination info
        if (apiResponse.pagination) {
          const newTotalItems = apiResponse.pagination.totalItems || 0;
          const newTotalPages = apiResponse.pagination.totalPages || 0;
          const newCurrentPage = apiResponse.pagination.currentPage || 1;
          const newHasMore = newCurrentPage < newTotalPages;
          
          setTotalItems(newTotalItems);
          setTotalPages(newTotalPages);
          
          // Update currentPage dan hasMore
          if (isLoadMore) {
            // Untuk loadMore, gunakan currentPage yang sudah diupdate di loadMore function
          } else {
            // Untuk initial load, gunakan dari response
            setCurrentPage(newCurrentPage);
          }
          
          // Selalu update hasMore berdasarkan response API
          setHasMore(newHasMore);
        }
        
        setStatistics(apiResponse.statistics || null);
      }
    } catch (error) {
      setError(error.message || 'Failed to fetch orders data');
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [buildFilterObject]);

  // Load more data untuk infinite scroll
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) {
      return;
    }
    
    // Double check: jika currentPage sudah mencapai totalPages, jangan fetch
    if (currentPage >= totalPages) {
      setHasMore(false);
      return;
    }
    
    const nextPage = currentPage + 1;
    
    // Update currentPage terlebih dahulu
    setCurrentPage(nextPage);
    
    // Check if this will be the last page
    if (nextPage >= totalPages) {
      setHasMore(false);
    }
    
    // Panggil fetchOrdersData dengan targetPage yang benar
    await fetchOrdersData(memoizedParams, true, nextPage);
  }, [hasMore, isLoadingMore, currentPage, totalPages, fetchOrdersData, orders.length]);

  // Reset pagination saat filter berubah
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setHasMore(true);
    setOrders([]);
  }, []);

  // Add new order to list (for quick input)
  const addOrder = useCallback((newOrder) => {
    setOrders(prev => [newOrder, ...prev]);
  }, []);

  // Update order in list
  const updateOrder = useCallback((orderId, updatedOrder) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? updatedOrder : order
    ));
  }, []);

  // Remove order from list
  const removeOrder = useCallback((orderId) => {
    setOrders(prev => prev.filter(order => order.id !== orderId));
  }, []);

  // Refresh orders data
  const refreshOrders = useCallback(() => {
    resetPagination();
    fetchOrdersData(params, false); // Use params directly instead of memoizedParams
  }, [fetchOrdersData, resetPagination, params]);

  // ✅ FIX: Load data on mount and when params change
  useEffect(() => {
    // Update shouldFetch ref
    const currentShouldFetch = params?.shouldFetch || false;
    shouldFetchRef.current = currentShouldFetch;
    
    // Skip fetch jika shouldFetch = false
    if (!currentShouldFetch) {
      return;
    }
    
    // ✅ FIX: Always trigger fetch when shouldFetch is true
    // (either shouldFetch changed from false to true, or other params changed)
    resetPagination();
    fetchOrdersData(memoizedParams, false);
  }, [fetchOrdersData, memoizedParams, resetPagination, params?.shouldFetch]);
  
  // Removed duplicate useEffect - only use the first one

  return {
    // State
    orders,
    statistics,
    loading,
    error,
    
    // Pagination state
    currentPage,
    hasMore,
    isLoadingMore,
    totalItems,
    totalPages,
    
    // Actions
    addOrder,
    updateOrder,
    removeOrder,
    refreshOrders,
    loadMore,
    resetPagination,
    
    // Functions
    fetchOrdersData
  };
}; 