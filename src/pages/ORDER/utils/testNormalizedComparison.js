/**
 * Test script untuk memverifikasi normalized comparison
 */

// Simulasi data dengan struktur berbeda tapi content sama
const currentData = {
  customer: {
    id: 844,
    name: "Pak Prayoga",
    phone: "6282230901934",
    address: "Jl. Rawa 137"
  },
  order_details: [
    {
      treatment: { id: 1, name: "Shoes - Deep Clean" },
      discount_id: 1,
      qty: 6,
      due_date: "2025-09-14",
      status: "antrian",
      final_price: "0.00",
      items: [
        { order_detail_id: 9911, status: "antrian", notes: "" },
        { order_detail_id: 9912, status: "antrian", notes: "" }
      ],
      order_detail_ids: [9911, 9912, 9913, 9914, 9915, 9916]
    }
  ],
  payment: {
    method: "cash",
    paid_amount: 150000,
    remaining_amount: 90000,
    final_price: 240000,
    payment_details: [
      { method: "cash", amount: 150000, notes: "" }
    ]
  },
  quantity: 1,
  order_type: "offline",
  entry_date: "2025-09-12"
};

const initialData = {
  customer: {
    id: 844,
    name: "Pak Prayoga",
    phone: "6282230901934",
    email: null,
    gender: null,
    address: "Jl. Rawa 137",
    gmaps: "https://maps.app.goo.gl/dHKtPLmfSAoBHfdL9",
    date_birthday: null,
    city: null,
    hobby: null,
    age: null,
    working_type: null,
    description: "-",
    tenant_id: 1,
    createdAt: "2024-07-23T07:30:59.000Z",
    updatedAt: "2025-09-09T03:22:36.000Z",
    deletedAt: null
  },
  order_details: [
    {
      id: 9911,
      order_id: 4033,
      employee_id: 4,
      treatment_id: 1,
      item_id: null,
      price: "40000.00",
      discount_id: 1,
      process_time: "regular",
      process_time_cost: "0.00",
      final_price: "0.00",
      status: "antrian",
      due_date: "2025-09-14",
      description: "",
      pickup_method: null,
      delivery_date: null,
      delivery_time: null,
      courier_id: null,
      delivery_status: "not_yet",
      perfume: null,
      createdAt: "2025-09-12T12:26:12.000Z",
      updatedAt: "2025-09-12T12:26:12.000Z",
      deletedAt: null,
      treatment: {
        id: 1,
        name: "Shoes - Deep Clean",
        price: "40000.00",
        type_item: "Shoes",
        type_service: "Deep Clean",
        description: "Mencuci keseluruhan bagian sepatu",
        tenant_id: 1,
        is_active: true,
        createdAt: "2024-01-24T01:56:35.000Z",
        updatedAt: "2025-09-11T07:08:15.000Z",
        deletedAt: null
      },
      employee: {
        id: 4,
        branch_id: 1,
        name: "Hadad",
        email: "akbarhadadal@gmail.com",
        password: "$2b$10$4rLz5/gczUyrYzjE2ThcSeA6p6onO/ntO3zFl2h/vQDvbNgdTbHrK",
        phone: "082255355740",
        address: null,
        status: "active",
        role: "superadmin",
        salary: null,
        salary_date: null,
        tenant_id: 1,
        createdAt: "2024-01-16T04:19:06.000Z",
        updatedAt: "2025-09-09T02:59:11.000Z",
        deletedAt: null
      },
      discount: {
        id: 1,
        name: "Normal Price",
        type: "nominal",
        discount: "0.00",
        is_active: true,
        tenant_id: 1,
        createdAt: "2024-01-24T06:50:54.000Z",
        updatedAt: "2025-09-11T08:33:20.000Z",
        deletedAt: null
      },
      shoes_photos: [],
      courier: null,
      status_logs: []
    }
  ],
  payment: {
    id: 4069,
    code: "KAT20250912255465",
    status: "dp",
    method: "cash",
    total_discount: 0,
    final_price: 240000,
    subtotal: 240000,
    total_service: 240000,
    paid_amount: 150000,
    remaining_amount: 90000,
    additional_cost: 0,
    due_date: null,
    notes: "",
    payment_details: [
      {
        id: 4270,
        method: "cash",
        amount: 150000,
        transaction_id: 5037,
        payment_id: 4069,
        fee: "0.00",
        interest: "0.00",
        final_amount: 150000,
        evidence_photo: "",
        notes: ""
      }
    ],
    total_price: 240000,
    total_process_time_cost: 0,
    date: "2025-09-12",
    money: 150000,
    change: 0,
    evidence_photo: ""
  },
  quantity: 1,
  order_type: "offline",
  entry_date: "2025-09-12"
};

console.log('🧪 TESTING NORMALIZED COMPARISON');
console.log('=================================');

// Normalize function (sama dengan di OrderDetail.jsx)
const normalizeForComparison = (data) => {
  return {
    // Customer - hanya field yang bisa diubah user
    customer: data.customer ? {
      id: data.customer.id,
      name: data.customer.name,
      phone: data.customer.phone,
      address: data.customer.address
    } : null,
    
    // Order details - bandingkan struktur yang sama
    order_details: data.order_details ? data.order_details.map(detail => ({
      treatment_id: detail.treatment?.id || detail.treatment_id,
      discount_id: detail.discount_id,
      qty: detail.qty,
      due_date: detail.due_date,
      status: detail.status,
      final_price: detail.final_price,
      items: detail.items ? detail.items.map(item => ({
        order_detail_id: item.order_detail_id,
        status: item.status,
        notes: item.notes
      })) : [],
      order_detail_ids: detail.order_detail_ids || []
    })) : [],
    
    // Payment - hanya field yang bisa diubah user
    payment: data.payment ? {
      method: data.payment.method,
      paid_amount: data.payment.paid_amount,
      remaining_amount: data.payment.remaining_amount,
      final_price: data.payment.final_price,
      payment_details: data.payment.payment_details ? data.payment.payment_details.map(pd => ({
        method: pd.method,
        amount: pd.amount,
        notes: pd.notes
      })) : []
    } : null,
    
    // Basic fields
    quantity: data.quantity,
    order_type: data.order_type,
    entry_date: data.entry_date
  };
};

console.log('\n📊 ORIGINAL DATA COMPARISON:');
console.log('Current structure:', Object.keys(currentData));
console.log('Initial structure:', Object.keys(initialData));
console.log('Customer fields - Current:', Object.keys(currentData.customer));
console.log('Customer fields - Initial:', Object.keys(initialData.customer));

const currentNormalized = normalizeForComparison(currentData);
const initialNormalized = normalizeForComparison(initialData);

console.log('\n🔧 NORMALIZED DATA:');
console.log('Current normalized:', JSON.stringify(currentNormalized, null, 2));
console.log('Initial normalized:', JSON.stringify(initialNormalized, null, 2));

const currentJson = JSON.stringify(currentNormalized, null, 2);
const initialJson = JSON.stringify(initialNormalized, null, 2);
const isDataEqual = currentJson === initialJson;

console.log('\n🔍 COMPARISON RESULT:');
console.log('Are normalized data equal:', isDataEqual);
console.log('Should isDirty be:', !isDataEqual);

if (isDataEqual) {
  console.log('\n✅ SUCCESS: Normalized data is identical');
  console.log('✅ isDirty should be FALSE');
  console.log('✅ Alert should NOT appear');
} else {
  console.log('\n❌ FAILURE: Normalized data is different');
  console.log('❌ isDirty would be TRUE');
  console.log('❌ Alert would appear');
  
  // Show differences
  console.log('\n🔍 DIFFERENCES:');
  const currentKeys = Object.keys(currentNormalized);
  const initialKeys = Object.keys(initialNormalized);
  
  currentKeys.forEach(key => {
    if (JSON.stringify(currentNormalized[key]) !== JSON.stringify(initialNormalized[key])) {
      console.log(`❌ ${key}:`);
      console.log('  Current:', JSON.stringify(currentNormalized[key], null, 2));
      console.log('  Initial:', JSON.stringify(initialNormalized[key], null, 2));
    }
  });
}

console.log('\n🎯 EXPECTED BEHAVIOR:');
console.log('1. Normalize data to same structure');
console.log('2. Compare only user-editable fields');
console.log('3. Ignore database metadata (createdAt, updatedAt, etc.)');
console.log('4. Return TRUE if content is same, regardless of structure');

console.log('\n✅ TEST COMPLETED');
