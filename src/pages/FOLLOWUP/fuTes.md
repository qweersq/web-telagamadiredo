# 🧪 FOLLOWUP API TESTING EXAMPLES

## 🔧 **SETUP TESTING**

### **1. Set Environment Variables**
```bash
export BASE_URL="http://localhost:3000"
export AUTH_TOKEN="your_jwt_token_here"
```

### **2. Test Authentication**
```bash
curl -X GET "$BASE_URL/followup-sequences" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

## 📋 **BASIC CRUD OPERATIONS**

### **1. Get All Sequences**
```bash
curl -X GET "$BASE_URL/followup-sequences?page=1&limit=10" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

### **2. Create New Sequence**
```bash
curl -X POST "$BASE_URL/followup-sequences" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Sequence API",
    "description": "Sequence untuk testing API",
    "is_active": true,
    "is_default": false
  }'
```

### **3. Get Sequence by ID**
```bash
curl -X GET "$BASE_URL/followup-sequences/1" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

### **4. Update Sequence**
```bash
curl -X PUT "$BASE_URL/followup-sequences/1" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Sequence",
    "is_active": false
  }'
```

## 🎨 **TEMPLATE MANAGEMENT**

### **1. Get Sequence Templates**
```bash
curl -X GET "$BASE_URL/followup-sequences/1/templates" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

### **2. Add Template to Sequence**
```bash
curl -X POST "$BASE_URL/followup-sequences/1/templates" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "step_number": 5,
    "delay_days": 90,
    "template_id": 20,
    "is_active": true,
    "send_time": "14:00:00"
  }'
```

### **3. Update Template**
```bash
curl -X PUT "$BASE_URL/followup-sequences/templates/5" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "delay_days": 120,
    "send_time": "15:30:00"
  }'
```

## 👥 **CUSTOMER MANAGEMENT**

### **1. Add Customers to Sequence**
```bash
curl -X POST "$BASE_URL/followup-sequences/1/customers" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_ids": [1, 2, 3, 4, 5]
  }'
```

### **2. Get Customers Ready for Followup**
```bash
curl -X GET "$BASE_URL/followup-sequences/ready/customers" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

## 🚀 **EXECUTION & TESTING**

### **1. Execute Followup**
```bash
curl -X POST "$BASE_URL/followup-sequences/execute/followup" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 10
  }'
```

### **2. Test Template**
```bash
curl -X POST "$BASE_URL/followup-sequences/test/template" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": 17,
    "customer_id": 1
  }'
```

### **3. Preview Sequence**
```bash
curl -X POST "$BASE_URL/followup-sequences/1/preview" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1
  }'
```

## 📊 **ANALYTICS & REPORTING**

### **1. Get Statistics**
```bash
curl -X GET "$BASE_URL/followup-sequences/analytics/statistics" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

### **2. Get Monthly Report**
```bash
curl -X GET "$BASE_URL/followup-sequences/reports/monthly?year=2025&month=9" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json"
```

## 🔄 **COMPLETE WORKFLOW TESTING**

### **Step 1: Setup Complete Sequence**
```bash
#!/bin/bash

# 1. Create sequence
SEQUENCE_RESPONSE=$(curl -s -X POST "$BASE_URL/followup-sequences" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Complete Test Sequence",
    "description": "Full workflow testing"
  }')

SEQUENCE_ID=$(echo $SEQUENCE_RESPONSE | jq -r '.data.id')
echo "Created sequence ID: $SEQUENCE_ID"

# 2. Add templates
curl -X POST "$BASE_URL/followup-sequences/$SEQUENCE_ID/templates" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "step_number": 1,
    "delay_days": 7,
    "template_id": 17,
    "send_time": "09:00:00"
  }'

curl -X POST "$BASE_URL/followup-sequences/$SEQUENCE_ID/templates" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "step_number": 2,
    "delay_days": 14,
    "template_id": 18,
    "send_time": "10:00:00"
  }'

# 3. Add customers
curl -X POST "$BASE_URL/followup-sequences/$SEQUENCE_ID/customers" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_ids": [1, 2, 3]
  }'

echo "Sequence setup complete!"
```

### **Step 2: Test Execution**
```bash
# 1. Check ready customers
curl -X GET "$BASE_URL/followup-sequences/ready/customers" \
  -H "Authorization: Bearer $AUTH_TOKEN"

# 2. Execute followup
curl -X POST "$BASE_URL/followup-sequences/execute/followup" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit": 5}'

# 3. Check statistics
curl -X GET "$BASE_URL/followup-sequences/analytics/statistics" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

## 🐛 **ERROR TESTING**

### **1. Test Validation Errors**
```bash
# Missing required fields
curl -X POST "$BASE_URL/followup-sequences" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Invalid customer IDs
curl -X POST "$BASE_URL/followup-sequences/1/customers" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_ids": []
  }'
```

### **2. Test Not Found Errors**
```bash
# Non-existent sequence
curl -X GET "$BASE_URL/followup-sequences/999" \
  -H "Authorization: Bearer $AUTH_TOKEN"

# Non-existent template
curl -X PUT "$BASE_URL/followup-sequences/templates/999" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"delay_days": 30}'
```

## 📝 **EXPECTED RESPONSES**

### **Success Response Format:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### **Error Response Format:**
```json
{
  "success": false,
  "message": "Error description",
  "error_code": "ERROR_TYPE"
}
```

### **Mock WhatsApp Response:**
```json
{
  "success": true,
  "message_id": "msg_1727599095_abc123",
  "status": "sent",
  "phone_number": "081234567890",
  "response_time": 1250
}
```

## 🎯 **TESTING CHECKLIST**

- [ ] ✅ Authentication works
- [ ] ✅ CRUD operations for sequences
- [ ] ✅ Template management
- [ ] ✅ Customer management  
- [ ] ✅ Followup execution
- [ ] ✅ Mock WhatsApp responses
- [ ] ✅ Analytics & reporting
- [ ] ✅ Error handling
- [ ] ✅ Role-based permissions
- [ ] ✅ Data validation

## 🚀 **READY TO TEST!**

Semua endpoint sudah siap untuk testing dengan mock WhatsApp service. Response akan random antara success/failed untuk simulasi real-world scenario.
