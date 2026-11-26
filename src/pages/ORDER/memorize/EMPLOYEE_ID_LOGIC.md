# Employee ID Logic Update

## Masalah Sebelumnya
Sebelumnya, setiap kali ada request POST/UPDATE ke API, `employee_id` selalu diambil dari `userData` yang sedang login saat ini. Ini menyebabkan:
- Item yang dibuat oleh user A bisa berubah menjadi user B jika user B melakukan update
- Tidak ada tracking yang jelas siapa yang membuat item apa

## Solusi Baru

### 1. Create Order (QuickOrderInput)
- **Logic**: `employee_id = user yang sedang login`
- **Lokasi**: `client/src/components/QuickInput/QuickOrderInput.jsx` baris 317
- **Alasan**: Saat create order baru, memang harus menggunakan user yang sedang login

### 2. Update Order (OrderDetail)
- **Logic**: 
  - Item yang sudah ada (`order_detail_id > 0`): `employee_id = employee_id yang sudah ada`
  - Item baru (`order_detail_id = 0`): `employee_id = user yang sedang login`
- **Lokasi**: `client/src/pages/ORDER/utils/orderTransformNew.js`
- **Alasan**: Mempertahankan employee_id asli untuk item yang sudah ada, hanya item baru yang menggunakan user yang sedang login

### 3. Helper Function
- **Function**: `getEmployeeIdForOrderDetail(item, currentEmployeeId)`
- **Lokasi**: `client/src/pages/ORDER/utils/orderTransformNew.js`
- **Fungsi**: Menentukan employee_id yang tepat berdasarkan status item (existing atau new)

## Implementasi

### Di transformFETemplateToApi
```javascript
// Tentukan employee_id menggunakan helper function
const employeeId = getEmployeeIdForOrderDetail(item, currentEmployeeId);

return {
  id: item.order_detail_id || 0, // 0 for new items
  order_id: feTemplate.id,
  employee_id: employeeId, // Gunakan employee_id yang sesuai (existing atau current user)
  // ... other fields
};
```

### Di groupOrderDetailsForFE
```javascript
groups[key].items.push({
  ...od.item,
  // ... other fields
  employee_id: od.employee_id, // Simpan employee_id dari API
});
```

## Hasil
- **Tracking yang jelas**: Setiap item memiliki employee_id yang konsisten
- **Audit trail**: Bisa melacak siapa yang membuat item apa
- **Fleksibilitas**: Item baru bisa dibuat oleh user yang berbeda
- **Konsistensi**: Item yang sudah ada tidak berubah employee_id-nya

## Testing
Untuk memastikan logic berjalan dengan benar:
1. User A membuat order dengan beberapa item
2. User B login dan tambah item baru ke order tersebut
3. User B update order
4. Verifikasi: item lama tetap employee_id user A, item baru employee_id user B 