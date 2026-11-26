# 📄 FOLLOWUP TEMPLATE API DOCUMENTATION

## 📍 **BASE URL**
```
https://api.notasepatu.id/followup-templates
```

## 🔐 **AUTHENTICATION**
Semua endpoint memerlukan JWT token di header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📚 **API ENDPOINTS**

### 1. **GET All Templates**
**Endpoint:** `GET /followup-templates`  
**Access:** Admin, Manager, Staff  
**Description:** Mendapatkan semua template follow-up dengan pagination

#### Query Parameters:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| search | string | No | Cari berdasarkan name atau title |
| is_active | boolean | No | Filter berdasarkan status aktif |
| page | number | No | Halaman (default: 1) |
| limit | number | No | Jumlah per halaman (default: 10) |
| branch_id | number | No | Filter berdasarkan cabang |

#### Example Request:
```bash
curl -X GET "https://api.notasepatu.id/followup-templates?search=promo&is_active=true&page=1&limit=5" \
  -H "Authorization: Bearer <token>"
```

#### Example Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Followup templates retrieved successfully",
  "data": {
    "templates": [
      {
        "id": 17,
        "name": "followup_7_days",
        "category": "followup",
        "title": "Follow-up 7 Hari",
        "description": "Template follow-up setelah 7 hari",
        "template_content": "Halo {customer_name}! 😊\n\nGimana kabarnya?...",
        "variables": ["customer_name", "business_name", "branch_name"],
        "is_active": true,
        "is_default": false,
        "is_system": false,
        "tenant_id": 1,
        "branch_id": null,
        "created_by": 1,
        "updated_by": null,
        "created_at": "2025-09-29T07:59:27.000Z",
        "updated_at": "2025-09-29T07:59:27.000Z",
        "tenant": {
          "id": 1,
          "business_name": "KATSIKAT",
          "owner_name": "Hadad"
        },
        "branch": null,
        "creator": {
          "id": 1,
          "name": "Hadad Al Akbar",
          "email": "katsikat@gmail.com"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 4,
      "itemsPerPage": 10,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

### 2. **GET Template by ID**
**Endpoint:** `GET /followup-templates/{id}`  
**Access:** Admin, Manager, Staff  
**Description:** Mendapatkan detail template berdasarkan ID

#### Example Request:
```bash
curl -X GET "https://api.notasepatu.id/followup-templates/17" \
  -H "Authorization: Bearer <token>"
```

#### Example Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Followup template retrieved successfully",
  "data": {
    "id": 17,
    "name": "followup_7_days",
    "category": "followup",
    "title": "Follow-up 7 Hari",
    "template_content": "Halo {customer_name}! 😊...",
    "variables": ["customer_name", "business_name", "branch_name"],
    "is_active": true,
    "tenant": {...},
    "branch": null,
    "creator": {...}
  }
}
```

---

### 3. **POST Create Template**
**Endpoint:** `POST /followup-templates`  
**Access:** Admin, Manager  
**Description:** Membuat template follow-up baru

#### Request Body:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Nama unique template |
| title | string | Yes | Judul template |
| description | string | No | Deskripsi template |
| template_content | string | Yes | Konten template dengan variables |
| variables | array | No | Array variable names |
| is_active | boolean | No | Status aktif (default: true) |
| is_default | boolean | No | Set sebagai default (default: false) |
| branch_id | number | No | ID cabang (null = semua cabang) |

#### Example Request:
```bash
curl -X POST "https://api.notasepatu.id/followup-templates" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "followup_custom_test",
    "title": "Template Custom Test",
    "description": "Template untuk testing API",
    "template_content": "Halo {customer_name}! Ini test template untuk {business_name}. Sudah {days_since_last_order} hari sejak order terakhir.",
    "variables": ["customer_name", "business_name", "days_since_last_order"],
    "is_active": true
  }'
```

#### Example Response:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Followup template created successfully",
  "data": {
    "id": 21,
    "name": "followup_custom_test",
    "title": "Template Custom Test",
    "template_content": "Halo {customer_name}!...",
    "variables": ["customer_name", "business_name", "days_since_last_order"],
    "is_active": true,
    "created_at": "2025-09-29T02:42:39.000Z"
  }
}
```

---

### 4. **PUT Update Template**
**Endpoint:** `PUT /followup-templates/{id}`  
**Access:** Admin, Manager  
**Description:** Update template follow-up

#### Request Body: (Same as POST, all fields optional)

#### Example Request:
```bash
curl -X PUT "https://api.notasepatu.id/followup-templates/21" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Template Custom Test Updated",
    "is_active": false
  }'
```

---

### 5. **DELETE Template**
**Endpoint:** `DELETE /followup-templates/{id}`  
**Access:** Admin, Manager  
**Description:** Hapus template follow-up

#### Example Request:
```bash
curl -X DELETE "https://api.notasepatu.id/followup-templates/21" \
  -H "Authorization: Bearer <token>"
```

#### Example Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Followup template deleted successfully",
  "data": {
    "success": true,
    "message": "Follow-up template deleted successfully"
  }
}
```

---

### 6. **POST Preview Template**
**Endpoint:** `POST /followup-templates/{id}/preview`  
**Access:** Admin, Manager, Staff  
**Description:** Preview template dengan sample data

#### Request Body:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| sample_data | object | No | Data sample untuk replace variables |

#### Example Request:
```bash
curl -X POST "https://api.notasepatu.id/followup-templates/17/preview" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sample_data": {
      "customer_name": "Budi Santoso",
      "business_name": "KATSIKAT Premium",
      "branch_name": "Jakarta Selatan"
    }
  }'
```

#### Example Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Template preview generated successfully",
  "data": {
    "template": {
      "id": 17,
      "name": "followup_7_days",
      "title": "Follow-up 7 Hari",
      "original_content": "Halo {customer_name}! 😊\n\nGimana kabarnya?...",
      "variables": ["customer_name", "business_name", "branch_name"]
    },
    "preview": {
      "processed_content": "Halo Budi Santoso! 😊\n\nGimana kabarnya? Sepatu yang kemarin sudah dicuci di KATSIKAT Premium masih bersih kan?...",
      "sample_data_used": {
        "customer_name": "Budi Santoso",
        "business_name": "KATSIKAT Premium",
        "branch_name": "Jakarta Selatan",
        "days_since_last_order": "15",
        "last_order_date": "2025-09-14",
        "total_orders": "3"
      },
      "character_count": 240,
      "estimated_message_count": 2
    }
  }
}
```

---

### 7. **POST Duplicate Template**
**Endpoint:** `POST /followup-templates/{id}/duplicate`  
**Access:** Admin, Manager  
**Description:** Duplikasi template yang sudah ada

#### Request Body:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| new_name | string | Yes | Nama untuk template baru |

#### Example Request:
```bash
curl -X POST "https://api.notasepatu.id/followup-templates/17/duplicate" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "new_name": "followup_7_days_copy"
  }'
```

---

### 8. **GET Available Variables**
**Endpoint:** `GET /followup-templates/utils/variables`  
**Access:** Admin, Manager, Staff  
**Description:** Mendapatkan daftar variables yang tersedia

#### Example Request:
```bash
curl -X GET "https://api.notasepatu.id/followup-templates/utils/variables" \
  -H "Authorization: Bearer <token>"
```

#### Example Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Available variables retrieved successfully",
  "data": {
    "variables": [
      {
        "key": "customer_name",
        "label": "Nama Customer",
        "type": "text",
        "required": true
      },
      {
        "key": "business_name",
        "label": "Nama Bisnis",
        "type": "text",
        "required": true
      },
      {
        "key": "days_since_last_order",
        "label": "Hari Sejak Order Terakhir",
        "type": "number",
        "required": false
      }
    ],
    "total": 13,
    "categories": {
      "required": 3,
      "optional": 10
    }
  }
}
```

---

### 9. **GET Template Statistics**
**Endpoint:** `GET /followup-templates/utils/statistics`  
**Access:** Admin, Manager  
**Description:** Mendapatkan statistik template

#### Example Request:
```bash
curl -X GET "https://api.notasepatu.id/followup-templates/utils/statistics" \
  -H "Authorization: Bearer <token>"
```

#### Example Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Template statistics retrieved successfully",
  "data": {
    "total_templates": 5,
    "active_templates": 5,
    "inactive_templates": 0,
    "default_template": null,
    "activation_rate": "100.00"
  }
}
```

---

### 10. **POST Bulk Operations**
**Endpoint:** `POST /followup-templates/utils/bulk`  
**Access:** Admin, Manager  
**Description:** Operasi bulk pada multiple templates

#### Request Body:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| action | string | Yes | Action: 'activate', 'deactivate', 'delete' |
| template_ids | array | Yes | Array of template IDs |
| data | object | No | Additional data untuk operation |

#### Example Request:
```bash
curl -X POST "https://api.notasepatu.id/followup-templates/utils/bulk" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "activate",
    "template_ids": [17, 18, 19]
  }'
```

#### Example Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Bulk activate completed: 3/3 successful",
  "data": {
    "action": "activate",
    "results": [
      {
        "template_id": 17,
        "success": true,
        "result": {...}
      },
      {
        "template_id": 18,
        "success": true,
        "result": {...}
      }
    ],
    "summary": {
      "total": 3,
      "success": 3,
      "failed": 0
    }
  }
}
```

---

### 11. **GET Export Templates**
**Endpoint:** `GET /followup-templates/utils/export`  
**Access:** Admin, Manager  
**Description:** Export semua template ke file

#### Query Parameters:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| format | string | No | Format export (default: 'json') |

#### Example Request:
```bash
curl -X GET "https://api.notasepatu.id/followup-templates/utils/export?format=json" \
  -H "Authorization: Bearer <token>"
```

---

## 📋 **AVAILABLE VARIABLES**

Variables yang bisa digunakan dalam template:

### **Required Variables:**
- `{customer_name}` - Nama Customer
- `{business_name}` - Nama Bisnis  
- `{branch_name}` - Nama Cabang

### **Optional Variables:**
- `{days_since_last_order}` - Hari sejak order terakhir
- `{last_order_date}` - Tanggal order terakhir
- `{total_orders}` - Total order customer
- `{customer_phone}` - Nomor HP customer
- `{promo_code}` - Kode promo
- `{customer_tier}` - Tier customer (Bronze/Silver/Gold)
- `{branch_phone}` - Nomor telepon cabang
- `{branch_address}` - Alamat cabang
- `{current_date}` - Tanggal saat ini
- `{current_time}` - Waktu saat ini

---

## ⚠️ **ERROR CODES**

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Template not found |
| 409 | Conflict - Template name already exists |
| 500 | Internal Server Error |

---

## 🎯 **BEST PRACTICES**

### **1. Template Naming:**
- Gunakan nama yang deskriptif: `followup_7_days`, `promo_weekend`
- Hindari spasi dan karakter khusus
- Maksimal 50 karakter

### **2. Template Content:**
- Gunakan emoji untuk menarik perhatian 😊
- Jaga panjang pesan maksimal 1000 karakter
- Selalu sertakan call-to-action yang jelas

### **3. Variables Usage:**
- Selalu gunakan required variables: `{customer_name}`, `{business_name}`
- Test template dengan preview sebelum digunakan
- Berikan fallback value untuk optional variables

### **4. Template Management:**
- Set hanya 1 template sebagai default per cabang
- Deaktivasi template lama sebelum hapus
- Backup template penting dengan export

---

## 🚀 **QUICK START EXAMPLE**

```bash
# 1. Get all templates
curl -X GET "https://api.notasepatu.id/followup-templates" \
  -H "Authorization: Bearer <token>"

# 2. Create new template
curl -X POST "https://api.notasepatu.id/followup-templates" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "welcome_back",
    "title": "Welcome Back Customer",
    "template_content": "Hi {customer_name}! Welcome back to {business_name}! 🎉",
    "variables": ["customer_name", "business_name"],
    "is_active": true
  }'

# 3. Preview template
curl -X POST "https://api.notasepatu.id/followup-templates/21/preview" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sample_data": {
      "customer_name": "John Doe",
      "business_name": "KATSIKAT"
    }
  }'
```

---

**API Template Follow-up siap digunakan!** 🎉
