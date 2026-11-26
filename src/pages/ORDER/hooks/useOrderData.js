import { useState, useEffect } from "react";
import { getOrders } from "../api/orderApi";
import { transformOrderListNew } from "../utils/orderTransformNew";

export default function useOrderData(params) {
  const [orders, setOrders] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getOrders(params)
      .then(data => {
        const transformedOrders = transformOrderListNew(data.data.orders || []);
        setOrders(transformedOrders);
        setStatistics(data.statistics || null);
      })
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, [JSON.stringify(params)]);

  return { orders, statistics, loading, error };
}
