import { calculateFinalPrice } from './orderTransformNew';

// Jumlah item efektif dalam satu grup (produk pakai qty, layanan pakai jumlah item)
export const getGroupQty = (group) => {
  if (!group) return 0;
  const itemsLength = Array.isArray(group.items) ? group.items.length : 0;
  const qtyValue = group.qty != null ? Number(group.qty) : 0;
  const productGroup = group.requires_tracking === false || group.treatment?.requires_tracking === false;

  if (productGroup) return Math.max(qtyValue, 1);
  if (itemsLength > 0) return Math.max(itemsLength, qtyValue);
  return Math.max(qtyValue, 0);
};

export const calculateGroupTotal = (group) => {
  // ✅ Always calculate manually using calculateFinalPrice to ensure consistency
  // Even if final_price exists from API, we recalculate to handle edge cases:
  // - When user edits discount
  // - When order details are modified
  // - Data consistency issues
  // Calculate final price per item
  const finalPricePerItem = calculateFinalPrice(
    group.treatment?.price,
    group.discount,
    group.custom_price
  );

  return finalPricePerItem * getGroupQty(group);
};

export const isProductGroup = (group) => {
  if (!group) return false;
  const requires = group.requires_tracking;
  const treatmentRequires = group.treatment?.requires_tracking;
  return requires === false || requires === 0 || treatmentRequires === false || treatmentRequires === 0;
};

export const recalculateOrderQuantity = (orderDetails) => {
  if (!Array.isArray(orderDetails)) return 0;
  return orderDetails.reduce((sum, group) => {
    const productGroup = isProductGroup(group);
    if (productGroup) {
      const qtyValue = group.qty != null ? Number(group.qty) : 0;
      return sum + Math.max(qtyValue, 1);
    }
    const itemCount = Array.isArray(group.items) ? group.items.length : 0;
    return sum + itemCount;
  }, 0);
};

export const createPlaceholderItem = ({
  requiresTracking = true,
  status,
} = {}) => ({
  order_detail_id: 0,
  id: null,
  item_id: null,
  name: '',
  brand: '',
  color: '',
  material: '',
  size: '',
  parfum: '',
  notes: '',
  shoes_photos: [],
  status: status || (requiresTracking ? 'antrian' : 'done'),
  quantity: 1,
  pickup_method: null,
  delivery_status: requiresTracking ? null : 'done',
  delivery_time: null,
  delivery_date: null,
  requires_tracking: requiresTracking,
});

