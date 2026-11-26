import { getActiveShiftId, getUserData } from '../../../utils/userProfileHelper';
import { getPhotoUrl } from '../../../utils/photoUrlHelper';
import instance from '../../../config/api';

// Cache for points settings
let pointsSettingsCache = { redeem_rate: 50 }; // Default: 50 (100 poin = Rp 5.000)
let pointsSettingsCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to get redeem rate synchronously (uses cached value)
function getRedeemRateSync() {
  return pointsSettingsCache.redeem_rate;
}

// Fetch points settings in background and update cache
function fetchPointsSettingsInBackground() {
  const now = Date.now();
  // Skip if cache is still valid
  if (pointsSettingsCacheTime > 0 && (now - pointsSettingsCacheTime) < CACHE_DURATION) {
    return;
  }

  // ✅ FIX: Skip fetch if on public invoice page (no auth required)
  const currentPath = window.location.pathname;
  if (currentPath && currentPath.startsWith('/invoice/')) {
    return; // Don't fetch on public invoice page
  }

  // ✅ FIX: Skip fetch if no token (user not logged in)
  const token = localStorage.getItem('token');
  if (!token) {
    return; // Don't fetch if user not logged in
  }

  // Fetch in background
  (async () => {
    try {
      const response = await instance.get('/points-settings', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const apiData = response.data.data;
        pointsSettingsCache = {
          redeem_rate: apiData.redeem_rate !== undefined ? apiData.redeem_rate : 50
        };
        pointsSettingsCacheTime = now;
      }
    } catch (error) {
      console.error('Error fetching points settings:', error);
      // Keep cached value or default
    }
  })();
}

// Initialize: fetch settings once on module load
if (typeof window !== 'undefined') {
  fetchPointsSettingsInBackground();
  // Refresh cache every 5 minutes
  setInterval(fetchPointsSettingsInBackground, CACHE_DURATION);
}

/**
 * Order Transform Utility - New Version
 * 
 * Logic Employee ID:
 * - Untuk CREATE ORDER: employee_id = user yang sedang login (QuickOrderInput)
 * - Untuk UPDATE ORDER: 
 *   - Item yang sudah ada (order_detail_id > 0): employee_id tetap sama dengan yang pertama kali dibuat
 *   - Item baru (order_detail_id = 0): employee_id = user yang sedang login
 * 
 * Ini memastikan bahwa setiap order detail memiliki employee_id yang konsisten:
 * - Order yang dibuat oleh user A tetap memiliki employee_id user A
 * - Item baru yang ditambahkan oleh user B akan memiliki employee_id user B
 */


// Helper function untuk menentukan employee_id yang tepat
function getEmployeeIdForOrderDetail(item, currentEmployeeId) {
  // Jika item sudah ada di database (order_detail_id > 0), gunakan employee_id yang sudah ada
  // Jika item baru (order_detail_id = 0), gunakan employee_id dari user yang sedang login
  if (item.order_detail_id > 0) {
    // Item yang sudah ada - gunakan employee_id yang sudah ada, fallback ke currentEmployeeId jika tidak ada
    return item.employee_id || currentEmployeeId;
  } else {
    // Item baru - gunakan employee_id dari user yang sedang login
    return currentEmployeeId;
  }
}

// Transform API data ke FE template
export function transformApiToFETemplate(apiOrder) {
  if (!apiOrder) return null;

  // Transform order details dengan grouping by treatment
  const groupedOrderDetails = groupOrderDetailsForFE(apiOrder.order_details || []);

  // Transform payment details
  const paymentDetails = (apiOrder.payment?.payment_details || []).map(pd => ({
    id: pd.id,
    method: pd.method,
    amount: Number(pd.amount),
    transaction_id: pd.transaction_id,
    payment_id: pd.payment_id,
    fee: pd.fee || "0.00",
    interest: pd.interest || "0.00",
    final_amount: Number(pd.final_amount || pd.amount),
    evidence_photo: pd.evidence_photo || "",
    account_id: pd.account_id,
    account_name: pd.account_name || pd.transaction?.finance_account?.name, // ✅ Use finance_account.name as fallback
    account_type: pd.account_type || pd.transaction?.finance_account?.payment_method?.name || 'General Account', // ✅ Use payment_method.name as fallback
    finance_category_id: pd.finance_category_id, // ✅ Add finance_category_id
    shift_id: pd.shift_id, // ✅ Add shift_id
    payment_method_id: pd.payment_method_id, // ✅ Add payment_method_id
    payment_method_name: pd.payment_method_name || pd.payment_method?.name, // ✅ Add payment_method_name
    payment_method_code: pd.payment_method_code || pd.payment_method?.code, // ✅ Add payment_method_code
    payment_method_type: pd.payment_method_type || pd.payment_method?.type, // ✅ Add payment_method_type
    payment_method_icon: pd.payment_method_icon || pd.payment_method?.icon, // ✅ Add payment_method_icon
    money_received: pd.money_received ? Number(pd.money_received) : null, // ✅ NEW: Cash change tracking
    change_amount: pd.change_amount ? Number(pd.change_amount) : null, // ✅ NEW: Cash change tracking
    date: pd.date,
    notes: pd.notes || "",
    createdAt: pd.createdAt,
    updatedAt: pd.updatedAt,
    // ✅ Include transaction data for finance account info
    transaction: pd.transaction ? {
      id: pd.transaction.id,
      account_id: pd.transaction.account_id,
      finance_account: pd.transaction.finance_account ? {
        id: pd.transaction.finance_account.id,
        name: pd.transaction.finance_account.name,
        payment_method_id: pd.transaction.finance_account.payment_method_id,
        payment_method: pd.transaction.finance_account.payment_method
      } : null
    } : null,
    // ✅ Include payment method data
    payment_method: pd.payment_method ? {
      id: pd.payment_method.id,
      name: pd.payment_method.name,
      code: pd.payment_method.code,
      type: pd.payment_method.type,
      icon: pd.payment_method.icon
    } : null
  }));

  // Transform payment
  const payment = apiOrder.payment ? {
    id: apiOrder.payment.id,
    code: apiOrder.payment.code || '',
    status: apiOrder.payment.status || 'unpaid',
    method: apiOrder.payment.method || '',
    total_discount: Number(apiOrder.payment.total_discount || 0),
    final_price: Number(apiOrder.payment.final_price || 0),
    subtotal: Number(apiOrder.payment.subtotal || 0),
    total_service: Number(apiOrder.payment.total_service || 0),
    paid_amount: Number(apiOrder.payment.paid_amount || 0),
    remaining_amount: Number(apiOrder.payment.remaining_amount || 0),
    additional_cost: Number(apiOrder.payment.additional_cost || 0),
    due_date: apiOrder.payment.due_date,
    notes: apiOrder.payment.notes || '',
    discount_id: apiOrder.payment.discount_id || null, // Payment-level discount ID
    discount: apiOrder.payment.discount || null, // Payment-level discount object
    // ✅ FIX: Map points_discount dan membership_discount dari backend jika ada, atau hitung dari total_discount
    ...(function () {
      const totalDiscount = Number(apiOrder.payment.total_discount || 0);
      const pointsDiscountFromBackend = Number(apiOrder.payment.points_discount || 0);
      const membershipDiscountFromBackend = Number(apiOrder.payment.membership_discount || 0);
      const pointsToRedeemFromBackend = Number(apiOrder.payment.points_to_redeem || 0);

      // Jika points_discount sudah ada di response, gunakan langsung
      if (pointsDiscountFromBackend > 0) {
        const redeemRate = getRedeemRateSync();
        const redeemRateValue = redeemRate * 100; // Convert to rupiah per 100 points
        return {
          points_discount: pointsDiscountFromBackend,
          membership_discount: membershipDiscountFromBackend,
          points_to_redeem: pointsToRedeemFromBackend > 0
            ? pointsToRedeemFromBackend
            : Math.round((pointsDiscountFromBackend / redeemRateValue) * 100)
        };
      }

      // Jika points_discount tidak ada di response, hitung dari total_discount
      if (totalDiscount > 0) {
        // Hitung payment discount amount
        let paymentDiscountAmount = 0;
        const paymentDiscount = apiOrder.payment.discount;
        if (paymentDiscount && paymentDiscount.type) {
          const discVal = paymentDiscount.discount != null
            ? Number(paymentDiscount.discount)
            : Number(paymentDiscount.value) || 0;

          // ✅ FIX: Support 'percent' dan 'percentage' sebagai alias yang sama
          if (paymentDiscount.type === 'percent' || paymentDiscount.type === 'percentage') {
            const subtotal = Number(apiOrder.payment.subtotal || 0);
            paymentDiscountAmount = Math.round(subtotal * (discVal / 100));
          } else if (paymentDiscount.type === 'nominal') {
            paymentDiscountAmount = discVal;
          }
        }

        // Hitung points_discount dari total_discount - payment_discount - membership_discount
        const calculatedPointsDiscount = Math.max(0, totalDiscount - paymentDiscountAmount - membershipDiscountFromBackend);

        // Jika calculatedPointsDiscount > 0, berarti ada points discount
        if (calculatedPointsDiscount > 0) {
          const redeemRate = getRedeemRateSync();
          const redeemRateValue = redeemRate * 100; // Convert to rupiah per 100 points
          return {
            points_discount: calculatedPointsDiscount,
            membership_discount: membershipDiscountFromBackend,
            // Hitung points_to_redeem dari points_discount (reverse calculation)
            // ✅ FIX: Use Math.round() to avoid floating point precision issues
            points_to_redeem: Math.round((calculatedPointsDiscount / redeemRateValue) * 100)
          };
        }
      }

      // Default: tidak ada points discount
      return {
        points_discount: 0,
        membership_discount: membershipDiscountFromBackend,
        points_to_redeem: pointsToRedeemFromBackend
      };
    })(),
    payment_details: paymentDetails,
    total_price: Number(apiOrder.payment.total_price || 0),
    total_process_time_cost: 0, // Process time cost dihilangkan
    date: apiOrder.payment.date,
    money: Number(apiOrder.payment.money || 0),
    change: Number(apiOrder.payment.change || 0),
    evidence_photo: apiOrder.payment.evidence_photo || ''
  } : {
    id: null,
    code: '',
    status: 'unpaid',
    method: '',
    total_discount: 0,
    final_price: 0,
    subtotal: 0,
    total_service: 0,
    paid_amount: 0,
    remaining_amount: 0,
    additional_cost: 0,
    due_date: null,
    notes: '',
    discount_id: null, // Payment-level discount ID
    discount: null, // Payment-level discount object
    points_discount: 0, // Points discount amount
    membership_discount: 0, // Membership discount amount
    points_to_redeem: 0, // Points to redeem for discount
    payment_details: [],
    total_price: 0,
    total_process_time_cost: 0, // Process time cost dihilangkan
    date: null,
    money: 0,
    change: 0,
    evidence_photo: ''
  };

  // Transform customer
  const customer = apiOrder.customer ? {
    id: apiOrder.customer.id,
    name: apiOrder.customer.name || '',
    phone: apiOrder.customer.phone || '',
    address: apiOrder.customer.address || '',
    gmaps: apiOrder.customer.gmaps || '',
    points: apiOrder.customer.points != null ? Number(apiOrder.customer.points) : 0, // ✅ Include customer points
    lifetime_points: apiOrder.customer.lifetime_points != null ? Number(apiOrder.customer.lifetime_points) : 0, // ✅ Include lifetime points
    has_received_first_order_bonus: apiOrder.customer.has_received_first_order_bonus != null ? Boolean(apiOrder.customer.has_received_first_order_bonus) : false, // ✅ Include has_received_first_order_bonus flag
    current_membership: apiOrder.customer.current_membership || null
  } : null;

  const creator = apiOrder.creator ? {
    id: apiOrder.creator.id,
    name: apiOrder.creator.name || '',
    phone: apiOrder.creator.phone || '',
    address: apiOrder.creator.address || ''
  } : null;

  const result = {
    id: apiOrder.id,
    customer,
    branch_id: apiOrder.branch_id || 1,
    branch_type: apiOrder.branch?.branch_type || null, // For droppoint badge
    branch_name: apiOrder.branch?.name || null, // For droppoint badge
    tenant_id: apiOrder.tenant_id || null,
    entry_date: apiOrder.entry_date || new Date().toISOString().split('T')[0],
    created_at: apiOrder.created_at || apiOrder.createdAt || null, // jam pembuatan order
    quantity: apiOrder.quantity || 0,
    order_type: apiOrder.order_type || 'offline',
    order_details: groupedOrderDetails,
    payment,
    creator,
    referred_by: apiOrder.referred_by || null, // Referral customer ID
    referred_by_phone: apiOrder.referred_by_phone || null, // Referral phone number
    referrer: apiOrder.referrer || null, // Referral customer object
    customer_note: apiOrder.customer_note || '', // Catatan dari customer
    table_number: apiOrder.table_number || '', // Nomor meja (dine-in)
    loading: false,
    error: null,
    currentStep: 1
  };

  return result;
}

// Group order_details FE: group by treatment_id, discount, due_date,
// custom_price, custom_price_reason, dan serve_mode.
// serve_mode ikut jadi kunci supaya produk yang sama tetap terpisah antara
// porsi dine-in dan bawa pulang (mis. 2 Popmie dine-in + 1 Popmie takeaway).
// `options_json` bisa datang sebagai object (endpoint list) atau string JSON
// (kolom longtext dari endpoint detail). Selalu normalisasi jadi object.
export function parseItemOptions(value) {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
      return {};
    }
  }
  return typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function groupOrderDetailsForFE(order_details) {
  if (!Array.isArray(order_details)) return [];

  const groups = {};
  order_details.forEach(od => {
    const detailRequiresTracking = od.requires_tracking !== undefined
      ? od.requires_tracking
      : od.treatment?.requires_tracking !== false;
    // Produk tanpa tracking memakai catatan/opsi sebagai pembeda grup
    // (mis. 2 Popmie less sugar vs 2 Popmie original). Layanan tetap
    // dikelompokkan per treatment karena catatan ada di level item.
    const isProductDetail = detailRequiresTracking === false;
    const noteKey = isProductDetail ? (od.description || '') : '';
    const itemOptions = isProductDetail ? parseItemOptions(od.options_json) : {};
    const optionsKey = isProductDetail ? JSON.stringify(itemOptions) : '';

    const key = [
      od.treatment?.id,
      od.discount_id,
      od.due_date,
      od.custom_price != null ? od.custom_price : 'no_custom',
      od.custom_price_reason || 'no_reason',
      od.serve_mode || 'no_serve_mode',
      noteKey,
      optionsKey
    ].join("|");

    if (!groups[key]) {
      groups[key] = {
        treatment: od.treatment,
        discount: od.discount, // Tetap simpan object discount untuk display
        discount_id: od.discount_id, // Tambahkan discount_id untuk API
        due_date: od.due_date,
        custom_price: od.custom_price != null ? od.custom_price : null, // ✅ Map custom_price
        custom_price_reason: od.custom_price_reason || null, // ✅ Map custom_price_reason
        serve_mode: od.serve_mode || null, // Dine-in / takeaway per item
        // Dapur produksi item ini (outlet penjual atau dapur pusat)
        production_branch_id: od.production_branch_id ?? null,
        production_branch: od.productionBranch || null,
        note: isProductDetail ? (od.description || '') : '', // Catatan grup (produk)
        options: itemOptions, // Opsi cepat grup (produk)
        requires_tracking: od.requires_tracking !== undefined
          ? od.requires_tracking
          : od.treatment?.requires_tracking !== false,
        items: [],
        qty: 0,
        order_detail_ids: [],
      };
    }

    groups[key].items.push({
      ...od.item,
      notes: od.description,
      parfum: od.perfume,
      shoes_photos: od.shoes_photos,
      order_detail_id: od.id,
      status: od.status,
      pickup_method: od.pickup_method,
      delivery_status: od.delivery_status,
      delivery_time: od.delivery_time,
      delivery_date: od.delivery_date,
      employee_id: od.employee_id, // Simpan employee_id dari API
      employee: od.employee, // Simpan employee object dari API (untuk print tag)
      custom_price_reason: od.custom_price_reason, // Simpan custom_price_reason di item level
      requires_tracking: od.requires_tracking !== undefined
        ? od.requires_tracking
        : od.treatment?.requires_tracking !== false,
      final_price: od.final_price, // ✅ Tambahkan final_price dari API
      tag_number: od.tag_number != null ? od.tag_number : null, // ✅ Nomor antrian tag (reset harian per cabang)
      tag_date: od.tag_date || null, // ✅ Tanggal dasar penomoran antrian
      production_branch_id: od.production_branch_id ?? null, // Dapur produksi per item
    });

    groups[key].qty += 1;
    groups[key].order_detail_ids.push(od.id);
  });

  return Object.values(groups);
}

// Transform FE template ke API payload
export async function transformFETemplateToApi(feTemplate) {
  if (!feTemplate) return null;

  // Get userData untuk employee_id (hanya untuk item baru)
  const userData = await getUserData();
  const currentEmployeeId = userData?.id || 1; // Fallback ke 1 jika tidak ada userData

  // Get active shift ID untuk consistency
  const activeShiftId = await getActiveShiftId();

  const todayIso = new Date().toISOString().slice(0, 10);

  // Flatten grouped order details back to individual order details
  const orderDetails = feTemplate.order_details.flatMap((group, groupIndex) => {
    return group.items.map((item, itemIndex) => {
      // Tentukan employee_id menggunakan helper function
      const employeeId = getEmployeeIdForOrderDetail(item, currentEmployeeId);

      const treatmentRequiresTracking = group.requires_tracking !== undefined
        ? group.requires_tracking
        : group.treatment?.requires_tracking !== false;
      const itemRequiresTracking = item.requires_tracking;
      const isProduct = itemRequiresTracking === false || treatmentRequiresTracking === false;

      let status = item.status || 'not_yet';
      if (isProduct) {
        if (!item.order_detail_id || ['not_yet', 'antrian', null, undefined, ''].includes(status)) {
          status = 'done';
        }
      }

      const deliveryStatus = isProduct
        ? 'done'
        : (item.delivery_status || null);

      const pickupMethod = isProduct ? null : (item.pickup_method || null);
      const deliveryDate = isProduct ? null : (item.delivery_date || null);
      const deliveryTime = isProduct ? null : (item.delivery_time || null);
      const dueDateValue = group.due_date || (isProduct ? todayIso : null);

      return {
        id: item.order_detail_id || 0, // 0 for new items
        order_id: feTemplate.id,
        employee_id: employeeId || currentEmployeeId, // Fallback ke currentEmployeeId jika employeeId null/undefined
        treatment_id: group.treatment?.id || null,
        item_id: item.id || null,
        discount_id: group.discount_id || group.discount?.id || null,
        due_date: dueDateValue,
        price: Number(group.treatment?.price || 0),
        custom_price: group.custom_price != null ? Number(group.custom_price) : null, // ✅ Include custom_price
        custom_price_reason: group.custom_price_reason || null, // ✅ Include custom_price_reason
        final_price: calculateFinalPrice(group.treatment?.price, group.discount, group.custom_price),
        status,
        serve_mode: group.serve_mode || item.serve_mode || null, // Dine-in / takeaway per item
        // Produk: catatan & opsi ada di level grup (berlaku untuk semua qty),
        // layanan: catatan tetap per item.
        options_json: (() => {
          const source = isProduct ? parseItemOptions(group.options) : parseItemOptions(item.options_json);
          return Object.keys(source).length > 0 ? source : null;
        })(),
        description: isProduct ? (group.note || '') : (item.notes || ''),
        perfume: item.parfum || '',
        pickup_method: pickupMethod,
        delivery_status: deliveryStatus,
        delivery_time: deliveryTime,
        delivery_date: deliveryDate,
        shoes_photos: (item.shoes_photos || []).map(photo => {
          // Handle both string URL and { url_photo } object formats
          if (typeof photo === 'string') {
            return { url_photo: photo };
          }
          return {
            id: photo.id || 0,
            order_detail_id: item.order_detail_id || 0,
            url_photo: photo.url_photo || photo.url || ""
          };
        })
      };
    });
  });

  // Transform payment details
  const paymentDetails = (feTemplate.payment?.payment_details || []).map(pd => ({
    id: pd.id || 0, // 0 for new payment details
    transaction_id: pd.transaction_id || null,
    payment_id: feTemplate.payment?.id || 0,
    method: pd.method || '',
    amount: Number(pd.amount),
    fee: pd.fee || "0.00",
    interest: pd.interest || "0.00",
    final_amount: Number(pd.final_amount || pd.amount),
    evidence_photo: pd.evidence_photo || "",
    account_id: pd.account_id || pd.transaction?.finance_account?.id || null, // ✅ Ensure account_id is present
    account_name: pd.account_name, // ✅ Add account_name
    account_type: pd.account_type, // ✅ Add account_type
    finance_category_id: pd.finance_category_id || 1, // ✅ Default to income category
    shift_id: pd.shift_id || activeShiftId, // ✅ Use active shift ID for consistency
    payment_method_id: pd.payment_method_id, // ✅ Add payment_method_id
    money_received: pd.money_received ? Number(pd.money_received) : null, // ✅ NEW: Cash change tracking
    change_amount: pd.change_amount ? Number(pd.change_amount) : null, // ✅ NEW: Cash change tracking
    date: pd.date || null,
    notes: pd.notes || "",
    createdAt: pd.createdAt,
    updatedAt: pd.updatedAt,
  }));

  // Transform payment
  const payment = {
    id: feTemplate.payment?.id || 0,
    code: feTemplate.payment?.code || '',
    status: feTemplate.payment?.payment_details?.length == 0 ? 'unpaid' : feTemplate.payment?.status,
    method: feTemplate.payment?.method || '',
    total_discount: Number(feTemplate.payment?.total_discount || 0),
    final_price: Number(feTemplate.payment?.final_price || 0),
    subtotal: Number(feTemplate.payment?.subtotal || 0),
    total_service: Number(feTemplate.payment?.total_service || 0),
    paid_amount: Number(feTemplate.payment?.paid_amount || 0),
    remaining_amount: Number(feTemplate.payment?.remaining_amount || 0),
    additional_cost: Number(feTemplate.payment?.additional_cost || 0),
    due_date: feTemplate.payment?.due_date || null,
    notes: feTemplate.payment?.notes || '',
    discount_id: feTemplate.payment?.discount_id || null, // Payment-level discount ID
    points_to_redeem: feTemplate.payment?.points_to_redeem || null, // ✅ Points to redeem (null if not set, 0 if explicitly set to 0)
    payment_details: paymentDetails,
    total_price: Number(feTemplate.payment?.total_price || 0),
    total_process_time_cost: 0, // Process time cost dihilangkan
    date: feTemplate.payment?.date || null,
    money: Number(feTemplate.payment?.money || 0),
    change: Number(feTemplate.payment?.change || 0),
    evidence_photo: feTemplate.payment?.evidence_photo || ''
  };

  const isNewOrder = !feTemplate.id;

  const result = {
    id: feTemplate.id,
    payment_id: feTemplate.payment?.id || 0,
    payment,
    customer_id: feTemplate.customer?.id || 0,
    branch_id: feTemplate.branch_id || 1,
    tenant_id: feTemplate.tenant_id || null, // Tambahkan tenant_id
    entry_date: feTemplate.entry_date || '',
    quantity: feTemplate.quantity || orderDetails.length || 0,
    order_type: feTemplate.order_type || 'offline',
    created_by: feTemplate.creator?.id || 0,
    referred_by: feTemplate.referred_by || null, // Referral customer ID
    referred_by_phone: feTemplate.referred_by_phone || null, // Referral phone number
    customer_note: feTemplate.customer_note || '', // Catatan dari customer
    table_number: feTemplate.table_number || null, // Nomor meja, jangan sampai terhapus saat edit
    order_details: orderDetails
  };

  if (isNewOrder) {
    result.shift_id = feTemplate.shift_id || activeShiftId;
  }

  return result;
}

// Transform order list untuk dashboard
export function transformOrderListNew(apiOrders) {
  return apiOrders.map(order => {
    const orderDetails = Array.isArray(order.order_details) ? order.order_details : [];

    // Gabungkan semua shoes_photos dari semua order_details
    // Normalize URL menggunakan getPhotoUrl untuk handle relative/absolute URLs dan malformed URLs
    const photos = orderDetails.flatMap(detail =>
      Array.isArray(detail.shoes_photos)
        ? detail.shoes_photos.map(photo => getPhotoUrl(photo.url_photo))
        : []
    );

    // Transform payment data dengan lengkap
    const payment = order.payment ? {
      id: order.payment.id,
      code: order.payment.code || '',
      status: order.payment.status || 'unpaid',
      method: order.payment.method || '',
      total_discount: Number(order.payment.total_discount || 0),
      final_price: Number(order.payment.final_price || order.payment.total_price || order.total_price || 0),
      subtotal: order.payment.subtotal || "0.00",
      total_service: Number(order.payment.total_service || 0),
      paid_amount: Number(order.payment.paid_amount || 0),
      remaining_amount: Number(order.payment.remaining_amount || 0),
      additional_cost: Number(order.payment.additional_cost || 0),
      due_date: order.payment.due_date || null,
      notes: order.payment.notes || "",
      discount_id: order.payment.discount_id || null, // Payment-level discount ID
      discount: order.payment.discount || null, // Payment-level discount object
      // ✅ FIX: Map points_discount dan membership_discount dari backend jika ada, atau hitung dari total_discount
      ...(function () {
        const totalDiscount = Number(order.payment.total_discount || 0);
        const pointsDiscountFromBackend = Number(order.payment.points_discount || 0);
        const membershipDiscountFromBackend = Number(order.payment.membership_discount || 0);
        const pointsToRedeemFromBackend = Number(order.payment.points_to_redeem || 0);

        // Jika points_discount sudah ada di response, gunakan langsung
        if (pointsDiscountFromBackend > 0) {
          const redeemRate = getRedeemRateSync();
          const redeemRateValue = redeemRate * 100; // Convert to rupiah per 100 points
          return {
            points_discount: pointsDiscountFromBackend,
            membership_discount: membershipDiscountFromBackend,
            points_to_redeem: pointsToRedeemFromBackend > 0
              ? pointsToRedeemFromBackend
              : Math.round((pointsDiscountFromBackend / redeemRateValue) * 100)
          };
        }

        // Jika points_discount tidak ada di response, hitung dari total_discount
        if (totalDiscount > 0) {
          // Hitung payment discount amount
          let paymentDiscountAmount = 0;
          const paymentDiscount = order.payment.discount;
          if (paymentDiscount && paymentDiscount.type) {
            const discVal = paymentDiscount.discount != null
              ? Number(paymentDiscount.discount)
              : Number(paymentDiscount.value) || 0;

            // ✅ FIX: Support 'percent' dan 'percentage' sebagai alias yang sama
            if (paymentDiscount.type === 'percent' || paymentDiscount.type === 'percentage') {
              const subtotal = Number(order.payment.subtotal || order.payment.total_price || order.total_price || 0);
              paymentDiscountAmount = Math.round(subtotal * (discVal / 100));
            } else if (paymentDiscount.type === 'nominal') {
              paymentDiscountAmount = discVal;
            }
          }

          // Hitung points_discount dari total_discount - payment_discount - membership_discount
          const calculatedPointsDiscount = Math.max(0, totalDiscount - paymentDiscountAmount - membershipDiscountFromBackend);

          // Jika calculatedPointsDiscount > 0, berarti ada points discount
          if (calculatedPointsDiscount > 0) {
            const redeemRate = getRedeemRateSync();
            const redeemRateValue = redeemRate * 100; // Convert to rupiah per 100 points
            return {
              points_discount: calculatedPointsDiscount,
              membership_discount: membershipDiscountFromBackend,
              // Hitung points_to_redeem dari points_discount (reverse calculation)
              points_to_redeem: Math.floor((calculatedPointsDiscount / redeemRateValue) * 100)
            };
          }
        }

        // Default: tidak ada points discount
        return {
          points_discount: 0,
          membership_discount: membershipDiscountFromBackend,
          points_to_redeem: pointsToRedeemFromBackend
        };
      })(),
      total_price: Number(order.payment.total_price || order.total_price || 0),
      total_process_time_cost: 0, // Process time cost dihilangkan
      date: order.payment.date || null,
      money: Number(order.payment.money || 0),
      change: Number(order.payment.change || 0),
      evidence_photo: order.payment.evidence_photo || "",
      payment_details: order.payment.payment_details || [],
      // Transform payment_details menjadi history untuk frontend
      history: Array.isArray(order.payment.payment_details)
        ? order.payment.payment_details.map(pd => ({
          id: pd.id,
          method: pd.method,
          amount: Number(pd.amount || pd.final_amount || 0),
          transaction_id: pd.transaction_id || null,
          payment_id: pd.payment_id || order.payment.id,
          fee: pd.fee || "0.00",
          interest: pd.interest || "0.00",
          final_amount: Number(pd.final_amount || pd.amount || 0),
          evidence_photo: pd.evidence_photo || "",
          account_id: pd.account_id || pd.transaction?.finance_account?.id || null, // ✅ Ensure account_id is present
          account_name: pd.account_name, // ✅ Add account_name
          account_type: pd.account_type || pd.transaction?.finance_account?.payment_method?.name || 'General Account', // ✅ Use payment_method.name as fallback
          finance_category_id: pd.finance_category_id, // ✅ Add finance_category_id
          shift_id: pd.shift_id, // ✅ Add shift_id
          payment_method_id: pd.payment_method_id, // ✅ Add payment_method_id
          payment_method_name: pd.payment_method_name || pd.payment_method?.name, // ✅ Add payment_method_name
          payment_method_code: pd.payment_method_code || pd.payment_method?.code, // ✅ Add payment_method_code
          payment_method_type: pd.payment_method_type || pd.payment_method?.type, // ✅ Add payment_method_type
          payment_method_icon: pd.payment_method_icon || pd.payment_method?.icon, // ✅ Add payment_method_icon
          money_received: pd.money_received ? Number(pd.money_received) : null, // ✅ NEW: Cash change tracking
          change_amount: pd.change_amount ? Number(pd.change_amount) : null, // ✅ NEW: Cash change tracking
          date: pd.date || null,
          notes: pd.notes || "",
          // ✅ Include transaction data for finance account info
          transaction: pd.transaction ? {
            id: pd.transaction.id,
            account_id: pd.transaction.account_id,
            finance_account: pd.transaction.finance_account ? {
              id: pd.transaction.finance_account.id,
              name: pd.transaction.finance_account.name,
              payment_method_id: pd.transaction.finance_account.payment_method_id,
              payment_method: pd.transaction.finance_account.payment_method
            } : null
          } : null,
          // ✅ Include payment method data
          payment_method: pd.payment_method ? {
            id: pd.payment_method.id,
            name: pd.payment_method.name,
            code: pd.payment_method.code,
            type: pd.payment_method.type,
            icon: pd.payment_method.icon
          } : null
        }))
        : []
    } : {
      id: 0,
      code: '',
      status: 'unpaid',
      method: '',
      total_discount: 0,
      final_price: Number(order.total_price || 0),
      subtotal: "0.00",
      total_service: 0,
      paid_amount: 0,
      remaining_amount: Number(order.total_price || 0),
      additional_cost: 0,
      due_date: null,
      notes: "",
      total_price: Number(order.total_price || 0),
      total_process_time_cost: 0, // Process time cost dihilangkan
      date: null,
      money: 0,
      change: 0,
      evidence_photo: "",
      history: []
    };

    return {
      id: order.id,
      customer: order.customer || { name: '-', phone: '-' },
      entry_date: order.entry_date || '-',
      created_at: order.createdAt || order.created_at || null,
      status: payment.status || order.status || '-',
      total_price: payment.final_price,
      order_details: orderDetails,
      payment_id: payment.id,
      payment, // Simpan object payment yang lengkap
      paymentMethod: payment.method || '-',
      paymentStatus: payment.status || '-',
      paymentDetails: payment.history || [],
      photos, // array url_photo
      branch_id: order.branch_id || 1,
      branch_name: order.branch_name || null,
      branch_type: order.branch_type || null,
      quantity: order.quantity || 0,
      order_type: order.order_type || 'offline',
      referred_by: order.referred_by || null, // Referral customer ID
      referred_by_phone: order.referred_by_phone || null, // Referral phone number
      referrer: order.referrer || null, // Referral customer object
      // Field legacy agar FE lama tetap jalan
      customerName: order.customer?.name || '-',
      customerPhone: order.customer?.phone || '-',
      entryDate: order.entry_date || '-',
      total: payment.final_price,
      items: orderDetails.length,
      creator: order.creator || { name: '-', phone: '-' },
    };
  });
}

// Helper functions
export function calculateFinalPrice(basePrice, discount, customPrice = null) {
  // ✅ Custom price sebagai base, tetap dipotong diskon jika ada
  let finalPrice;

  if (customPrice != null) {
    // Gunakan custom price sebagai base
    finalPrice = Number(customPrice);
  } else {
    // Gunakan base price sebagai base
    finalPrice = Number(basePrice || 0);
  }

  // ✅ Apply discount ke custom price atau base price
  if (discount) {
    if (discount.type === 'nominal') {
      finalPrice -= Number(discount.discount || 0);
    } else if (discount.type === 'percent' || discount.type === 'percentage') {
      const discountAmount = finalPrice * (Number(discount.discount || 0) / 100);
      finalPrice -= discountAmount;
    }
  }

  // ✅ Validasi: final price tidak boleh minus (minimum Rp 0)
  return Math.max(0, finalPrice);
}

/**
 * Calculate total with payment-level discount
 * @param {Array} orderDetails - Array of order detail groups
 * @param {Object} paymentDiscount - Payment-level discount object (optional)
 * @returns {Object} { subtotal, discountAmount, finalTotal }
 */
export function calculateTotalWithPaymentDiscount(orderDetails, paymentDiscount = null) {
  // Calculate subtotal from order_details
  let subtotal = 0;

  if (orderDetails && Array.isArray(orderDetails)) {
    orderDetails.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach(item => {
          const finalPrice = calculateFinalPrice(
            group.treatment?.price,
            group.discount,
            group.custom_price
          );
          subtotal += finalPrice;
        });
      }
    });
  }

  // Apply payment-level discount if exists
  let discountAmount = 0;
  let finalTotal = subtotal;

  if (paymentDiscount && paymentDiscount.type) {
    const discVal = paymentDiscount.discount != null
      ? Number(paymentDiscount.discount)
      : Number(paymentDiscount.value) || 0;

    // ✅ FIX: Support 'percent' dan 'percentage' sebagai alias yang sama
    if (paymentDiscount.type === 'percent' || paymentDiscount.type === 'percentage') {
      discountAmount = Math.round(subtotal * (discVal / 100));
    } else if (paymentDiscount.type === 'nominal') {
      discountAmount = discVal;
    }

    finalTotal = Math.max(0, subtotal - discountAmount);
  }

  return {
    subtotal: Math.round(subtotal),
    discountAmount: Math.round(discountAmount),
    finalTotal: Math.round(finalTotal)
  };
} 