export function transformOrderList(apiOrders) {
  return apiOrders.map(order => {
    const orderDetails = Array.isArray(order.order_details) ? order.order_details : [];
    // Gabungkan semua shoes_photos dari semua order_details
    const photos = orderDetails.flatMap(detail =>
      Array.isArray(detail.shoes_photos)
        ? detail.shoes_photos.map(photo => photo.url_photo)
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
      total_service: order.payment.total_service || 0,
      paid_amount: Number(order.payment.paid_amount || 0),
      remaining_amount: Number(order.payment.remaining_amount || 0),
      additional_cost: Number(order.payment.additional_cost || 0),
      due_date: order.payment.due_date || null,
      notes: order.payment.notes || "",
      total_price: Number(order.payment.total_price || order.total_price || 0),
      total_process_time_cost: Number(order.payment.total_process_time_cost || 0),
      date: order.payment.date || null,
      money: Number(order.payment.money || 0),
      change: Number(order.payment.change || 0),
      evidence_photo: order.payment.evidence_photo || "",
      // Transform payment_details menjadi history untuk frontend
      history: Array.isArray(order.payment.payment_details) 
        ? order.payment.payment_details.map(pd => ({
            id: pd.id,
            method: pd.method,
            amount: Number(pd.amount || pd.final_amount || 0),
            // Simpan semua field payment_details untuk transform balik ke backend
            transaction_id: pd.transaction_id || null,
            payment_id: pd.payment_id || order.payment.id,
            fee: pd.fee || "0.00",
            interest: pd.interest || "0.00",
            final_amount: Number(pd.final_amount || pd.amount || 0),
            evidence_photo: pd.evidence_photo || "",
            account_id: pd.account_id || pd.transaction?.finance_account?.id || null, // ✅ Ensure account_id is present
            date: pd.date || null,
            notes: pd.notes || ""
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
      total_process_time_cost: 0,
      date: null,
      money: 0,
      change: 0,
      evidence_photo: "",
      history: []
    };
    
    console.log('[DEBUG] transformOrderList - Payment:', payment);
    console.log('[DEBUG] transformOrderList - Payment ID:', payment.id);
    console.log('[DEBUG] transformOrderList - Payment History:', payment.history);
    console.log('[DEBUG] transformOrderList - Payment Details from API:', order.payment?.payment_details);
    console.log('[DEBUG] transformOrderList - History with Account ID:', payment.history.filter(h => h.account_id));
    
    return {
      id: order.id,
      customer: order.customer || { name: '-', phone: '-' },
      entry_date: order.entry_date || '-',
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
      quantity: order.quantity || 0,
      order_type: order.order_type || 'offline',
      // Field legacy agar FE lama tetap jalan
      customerName: order.customer?.name || '-',
      customerPhone: order.customer?.phone || '-',
      entryDate: order.entry_date || '-',
      total: payment.final_price,
      items: orderDetails.length,
    };
  });
}

// Group order_details FE: group by treatment_id, discount, process_time, due_date
export function groupOrderDetailsForFE(order_details) {
  if (!Array.isArray(order_details)) return [];
  const groups = {};
  order_details.forEach(od => {
    const key = [
      od.treatment?.id,
      od.discount,
      od.process_time,
      od.due_date
    ].join("|");
    if (!groups[key]) {
      groups[key] = {
        treatment: od.treatment,
        discount: od.discount,
        process_time: od.process_time,
        due_date: od.due_date,
        items: [],
        qty: 0,
        order_detail_ids: [],
      };
    }
    groups[key].items.push({
      ...od.item,
      notes: od.notes,
      parfum: od.parfum,
      shoes_photos: od.shoes_photos,
      order_detail_id: od.id,
      // tambahkan properti item lain jika perlu
    });
    groups[key].qty += 1;
    groups[key].order_detail_ids.push(od.id);
  });
  return Object.values(groups);
}

