/**
 * Test script untuk memverifikasi dirty state detection yang akurat
 */

// Simulasi data yang identik
const initialData = {
  id: 4033,
  customer: { id: 844, name: "Pak Prayoga" },
  quantity: 1,
  order_type: "offline",
  order_details: [
    {
      treatment: { id: 1, name: "Shoes - Deep Clean" },
      discount_id: 1,
      qty: 6,
      items: [
        { order_detail_id: 9911, status: "antrian" },
        { order_detail_id: 9912, status: "antrian" }
      ],
      order_detail_ids: [9911, 9912, 9913, 9914, 9915, 9916]
    }
  ],
  payment: {
    id: 4069,
    method: "cash",
    final_price: 240000,
    paid_amount: 150000
  }
};

const currentData = {
  id: 4033,
  customer: { id: 844, name: "Pak Prayoga" },
  quantity: 1,
  order_type: "offline",
  order_details: [
    {
      treatment: { id: 1, name: "Shoes - Deep Clean" },
      discount_id: 1,
      qty: 6,
      items: [
        { order_detail_id: 9911, status: "antrian" },
        { order_detail_id: 9912, status: "antrian" }
      ],
      order_detail_ids: [9911, 9912, 9913, 9914, 9915, 9916]
    }
  ],
  payment: {
    id: 4069,
    method: "cash",
    final_price: 240000,
    paid_amount: 150000
  }
};

console.log('🧪 TESTING DIRTY STATE DETECTION');
console.log('=================================');

// Simulasi logic dirty state detection
const fields = [
  'id', 'customer', 'order_details', 'payment', 'quantity', 'order_type', 'entry_date', 'branch_id'
];
const pick = (obj) => fields.reduce((acc, key) => { acc[key] = obj[key]; return acc; }, {});

const current = pick(currentData);
const initial = pick(initialData);

console.log('\n📊 EXTRACTED FIELDS:');
console.log('Current:', JSON.stringify(current, null, 2));
console.log('Initial:', JSON.stringify(initial, null, 2));

// JSON comparison
const currentJson = JSON.stringify(current, null, 2);
const initialJson = JSON.stringify(initial, null, 2);
const isDataEqual = currentJson === initialJson;

console.log('\n🔍 JSON COMPARISON:');
console.log('Current JSON:', currentJson);
console.log('Initial JSON:', initialJson);
console.log('Are equal:', isDataEqual);
console.log('Should isDirty be:', !isDataEqual);

if (isDataEqual) {
  console.log('\n✅ SUCCESS: Data is identical');
  console.log('✅ isDirty should be FALSE');
  console.log('✅ Alert should NOT appear');
} else {
  console.log('\n❌ FAILURE: Data appears different when it should be identical');
  console.log('❌ isDirty would be TRUE incorrectly');
  console.log('❌ Alert would appear incorrectly');
}

console.log('\n🎯 EXPECTED BEHAVIOR:');
console.log('1. Data comparison should return TRUE (identical)');
console.log('2. isDirty should be FALSE');
console.log('3. Back button should NOT show alert');
console.log('4. No "Ada perubahan yang belum disimpan" message');

console.log('\n✅ TEST COMPLETED');
