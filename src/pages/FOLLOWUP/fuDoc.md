# 📚 FOLLOWUP SEQUENCE API DOCUMENTATION

## 🎯 **BASE URL**
```
/followup-sequences
```

## 🔐 **AUTHENTICATION**
Semua endpoint memerlukan authentication token di header:
```
Authorization: Bearer <your_jwt_token>
```

## 📋 **API ENDPOINTS**

### **1. SEQUENCE MANAGEMENT**

#### **GET /followup-sequences**
Mendapatkan semua followup sequences

**Query Parameters:**
- `page` (optional): Halaman (default: 1)
- `limit` (optional): Jumlah per halaman (default: 10)
- `branch_id` (optional): Filter berdasarkan branch

**Response:**
```json
{
  "success": true,
  "message": "Sequences retrieved successfully",
  "data": {
    "sequences": [
      {
        "id": 1,
        "name": "Default Follow-up Sequence",
        "description": "Sequence follow-up default untuk semua customer",
        "is_active": true,
        "is_default": true,
        "templates": [
          {
            "id": 1,
            "step_number": 1,
            "delay_days": 7,
            "send_time": "09:00:00",
            "template": {
              "id": 17,
              "name": "followup_7_days",
              "title": "Follow-up 7 Hari"
            }
          }
        ]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10
    }
  }
}
```

#### **POST /followup-sequences**
Membuat sequence baru

**Body:**
```json
{
  "name": "Sequence Promo Spesial",
  "description": "Sequence khusus untuk promo bulanan",
  "is_active": true,
  "is_default": false,
  "branch_id": null
}
```

#### **PUT /followup-sequences/:id**
Update sequence

**Body:**
```json
{
  "name": "Updated Sequence Name",
  "is_active": false
}
```

#### **DELETE /followup-sequences/:id**
Hapus sequence (hanya jika tidak ada customer aktif)

---

### **2. SEQUENCE TEMPLATE MANAGEMENT**

#### **GET /followup-sequences/:id/templates**
Mendapatkan template dalam sequence

#### **POST /followup-sequences/:id/templates**
Menambah template ke sequence

**Body:**
```json
{
  "step_number": 2,
  "delay_days": 14,
  "template_id": 18,
  "is_active": true,
  "send_time": "10:00:00",
  "conditions": {}
}
```

#### **PUT /followup-sequences/templates/:id**
Update template dalam sequence

#### **DELETE /followup-sequences/templates/:id**
Hapus template dari sequence

---

### **3. CUSTOMER MANAGEMENT**

#### **POST /followup-sequences/:id/customers**
Menambah customer ke sequence

**Body:**
```json
{
  "customer_ids": [1, 2, 3, 4, 5]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Added 4/5 customers to sequence",
  "data": {
    "results": [
      {
        "customer_id": 1,
        "success": true,
        "message": "Customer added to sequence successfully",
        "next_send_at": "2025-10-06T09:00:00.000Z"
      }
    ],
    "summary": {
      "total": 5,
      "success": 4,
      "failed": 1
    }
  }
}
```

#### **GET /followup-sequences/ready/customers**
Mendapatkan customer yang siap untuk followup

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": 1,
        "customer_id": 123,
        "current_step": 1,
        "next_send_at": "2025-09-29T09:00:00.000Z",
        "customer": {
          "id": 123,
          "name": "John Doe",
          "phone": "081234567890"
        },
        "sequence": {
          "id": 1,
          "name": "Default Follow-up Sequence"
        }
      }
    ],
    "total": 15,
    "ready_for_followup": 15
  }
}
```

---

### **4. EXECUTION & TESTING**

#### **POST /followup-sequences/execute/followup**
Eksekusi followup untuk customer yang siap

**Body:**
```json
{
  "branch_id": 1,
  "limit": 50
}
```

**Response:**
```json
{
  "success": true,
  "message": "Processed 15 customers, 12 successful",
  "data": {
    "results": [
      {
        "customer_id": 123,
        "customer_name": "John Doe",
        "phone": "081234567890",
        "success": true,
        "message": "Message sent successfully",
        "step": 2,
        "template_name": "followup_14_days",
        "next_send_at": "2025-10-13T10:00:00.000Z",
        "completed": false,
        "wa_response": {
          "success": true,
          "message_id": "msg_1727599095_abc123",
          "status": "sent"
        }
      }
    ],
    "summary": {
      "total": 15,
      "success": 12,
      "failed": 3
    }
  }
}
```

#### **POST /followup-sequences/test/template**
Test template dengan data customer

**Body:**
```json
{
  "template_id": 17,
  "customer_id": 123
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "processed_content": "Halo John Doe! 😊\n\nGimana kabarnya? Sepatu yang kemarin sudah dicuci di Katsikat Laundry masih bersih kan?",
    "variables_used": {
      "customer_name": "John Doe",
      "business_name": "Katsikat Laundry"
    },
    "customer": {
      "id": 123,
      "name": "John Doe",
      "phone": "081234567890"
    },
    "is_test": true
  }
}
```

#### **POST /followup-sequences/:id/preview**
Preview sequence untuk customer

**Body:**
```json
{
  "customer_id": 123
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sequence": {
      "id": 1,
      "name": "Default Follow-up Sequence"
    },
    "customer": {
      "id": 123,
      "name": "John Doe"
    },
    "previews": [
      {
        "step": 1,
        "delay_days": 7,
        "send_date": "2025-10-06T09:00:00.000Z",
        "template_name": "followup_7_days",
        "processed_content": "Halo John Doe! 😊..."
      }
    ],
    "total_steps": 4,
    "estimated_duration_days": 60
  }
}
```

---

### **5. ANALYTICS & REPORTING**

#### **GET /followup-sequences/analytics/statistics**
Mendapatkan statistik followup

**Query Parameters:**
- `branch_id` (optional): Filter branch
- `start_date` (optional): Tanggal mulai (YYYY-MM-DD)
- `end_date` (optional): Tanggal akhir (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "total_customers_in_sequence": 150,
    "total_messages_sent": 450,
    "total_responses": 90,
    "total_conversions": 25,
    "response_rate": "20.00",
    "conversion_rate": "16.67"
  }
}
```

#### **GET /followup-sequences/reports/monthly**
Laporan bulanan followup

**Query Parameters:**
- `year` (optional): Tahun (default: tahun sekarang)
- `month` (optional): Bulan (default: bulan sekarang)
- `branch_id` (optional): Filter branch

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "year": 2025,
      "month": 9,
      "month_name": "September"
    },
    "statistics": {
      "total_customers_in_sequence": 150,
      "total_messages_sent": 450,
      "response_rate": "20.00%",
      "conversion_rate": "16.67%"
    },
    "summary": {
      "total_customers_followed_up": 150,
      "estimated_orders_from_followup": 30
    }
  }
}
```

---

## 🔧 **ROLE PERMISSIONS**

| Endpoint | Admin (1) | Manager (2) | Staff (4) |
|----------|-----------|-------------|-----------|
| GET sequences | ✅ | ✅ | ✅ |
| CREATE sequence | ✅ | ✅ | ❌ |
| UPDATE sequence | ✅ | ✅ | ❌ |
| DELETE sequence | ✅ | ❌ | ❌ |
| Execute followup | ✅ | ✅ | ❌ |
| Analytics | ✅ | ✅ | ❌ |
| Testing | ✅ | ✅ | ✅ |

---

## 🎨 **CONTOH PENGGUNAAN**

### **1. Setup Sequence Baru**
```javascript
// 1. Buat sequence
const sequence = await fetch('/followup-sequences', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' },
  body: JSON.stringify({
    name: 'Sequence Promo Ramadan',
    description: 'Follow-up khusus bulan Ramadan'
  })
});

// 2. Tambah template ke sequence
await fetch(`/followup-sequences/${sequence.id}/templates`, {
  method: 'POST',
  body: JSON.stringify({
    step_number: 1,
    delay_days: 7,
    template_id: 17,
    send_time: '09:00:00'
  })
});
```

### **2. Tambah Customer ke Sequence**
```javascript
await fetch(`/followup-sequences/1/customers`, {
  method: 'POST',
  body: JSON.stringify({
    customer_ids: [1, 2, 3, 4, 5]
  })
});
```

### **3. Eksekusi Followup**
```javascript
const result = await fetch('/followup-sequences/execute/followup', {
  method: 'POST',
  body: JSON.stringify({
    limit: 50
  })
});
```

---

## ⚠️ **ERROR RESPONSES**

```json
{
  "success": false,
  "message": "Error message here",
  "error_code": "VALIDATION_ERROR"
}
```

**Common Error Codes:**
- `VALIDATION_ERROR`: Data input tidak valid
- `NOT_FOUND`: Resource tidak ditemukan
- `ACCESS_DENIED`: Tidak memiliki permission
- `SEQUENCE_HAS_ACTIVE_CUSTOMERS`: Tidak bisa hapus sequence yang masih ada customer aktif

---

## 🚀 **READY TO USE!**

API sudah siap digunakan dengan mock WhatsApp service untuk testing. Semua endpoint sudah include:
- ✅ Authentication & Authorization
- ✅ Data validation
- ✅ Error handling
- ✅ Mock WhatsApp integration
- ✅ Analytics & reporting
