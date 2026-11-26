# WhatsApp Automation API - Updated Documentation

**Base URL:** `http://localhost:3000/api` (Backend Server)

## 📋 Table of Contents
- [Session Management](#session-management)
- [WhatsApp Status & QR Code](#whatsapp-status--qr-code)
- [Message Routes](#message-routes)
- [Service Management](#service-management)

---

## 🔐 Session Management

### 1. Create Session
**POST** `/wa/session/create`

Creates a new WhatsApp session using the API Gateway.

**Response:**
```json
{
  "success": true,
  "message": "Session created. Please scan QR code.",
  "sessionId": "SESSION-87a3eb63-7820-4de5-a8ef-e96c50c5e351",
  "timestamp": "2025-01-07T07:36:43.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to create WhatsApp session",
  "error": "Error details",
  "timestamp": "2025-01-07T07:36:43.000Z"
}
```

---

### 2. Get All Sessions
**GET** `/wa/session/list`

Gets all active WhatsApp sessions.

**Response:**
```json
{
  "success": true,
  "count": 2,
  "sessions": [
    {
      "id": "SESSION-87a3eb63-7820-4de5-a8ef-e96c50c5e351",
      "status": "READY",
      "meta": {
        "phone_number": "6281234567890",
        "name": "John Doe",
        "chats": 25,
        "groups": 5,
        "privates": 20,
        "unread": 3
      }
    }
  ],
  "timestamp": "2025-01-07T07:36:43.000Z"
}
```

---

### 3. Get Session Detail
**GET** `/wa/session/detail?sessionId={sessionId}`

Gets detailed information about a specific session.

**Query Parameters:**
- `sessionId` (string, optional): Session ID (uses current session if not provided)

**Response:**
```json
{
  "success": true,
  "sessionId": "SESSION-87a3eb63-7820-4de5-a8ef-e96c50c5e351",
  "status": "READY",
  "metadata": {
    "phone_number": "6281234567890",
    "name": "John Doe",
    "chats": 25,
    "groups": 5,
    "privates": 20,
    "unread": 3
  },
  "timestamp": "2025-01-07T07:36:43.000Z"
}
```

---

### 4. Logout Session
**DELETE** `/wa/session/logout`

Logs out and destroys a session.

**Request Body:**
```json
{
  "sessionId": "SESSION-87a3eb63-7820-4de5-a8ef-e96c50c5e351"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session SESSION-87a3eb63-7820-4de5-a8ef-e96c50c5e351 successfully logged out.",
  "timestamp": "2025-01-07T07:36:43.000Z"
}
```

---

### 5. Destroy Session
**DELETE** `/wa/session/destroy`

Destroys a session (same as logout).

**Request Body:**
```json
{
  "sessionId": "SESSION-87a3eb63-7820-4de5-a8ef-e96c50c5e351"
}
```

---

## 📱 WhatsApp Status & QR Code

### 1. Get Status
**GET** `/wa/status?sessionId={sessionId}`

Gets the current status of a WhatsApp session.

**Query Parameters:**
- `sessionId` (string, optional): Session ID (uses current session if not provided)

**Response:**
```json
{
  "success": true,
  "status": "READY",
  "sessionId": "SESSION-87a3eb63-7820-4de5-a8ef-e96c50c5e351"
}
```

**Possible Status Values:**
- `PENDING` - Waiting for QR scan
- `READY` - Connected and ready
- `DISCONNECTED` - Disconnected
- `FAILED` - Authentication failed
- `ERROR` - Error occurred

---

### 2. Get QR Code
**GET** `/wa/qr?sessionId={sessionId}`

Gets the QR code for session authentication.

**Query Parameters:**
- `sessionId` (string, optional): Session ID (uses current session if not provided)

**Response:**
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "sessionId": "SESSION-87a3eb63-7820-4de5-a8ef-e96c50c5e351"
}
```

---

### 3. Test Connection
**GET** `/wa/test?sessionId={sessionId}`

Tests the WhatsApp connection and returns status information.

**Query Parameters:**
- `sessionId` (string, optional): Session ID (uses current session if not provided)

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp automation test completed",
  "timestamp": "2025-01-07T07:36:43.000Z",
  "status": {
    "success": true,
    "status": "READY",
    "sessionId": "SESSION-87a3eb63-7820-4de5-a8ef-e96c50c5e351"
  },
  "qrAvailable": true
}
```

---

## 💬 Message Routes

### 1. Send Text Message
**POST** `/wa/send-message`

Sends a text message to a WhatsApp number.

**Request Body:**
```json
{
  "phone": "6281234567890",
  "message": "Hello, this is a test message!",
  "sessionId": "SESSION-87a3eb63-7820-4de5-a8ef-e96c50c5e351"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "success": true,
    "recipient": "6281234567890",
    "message": "Message sent successfully"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "No active session. Please create a session first.",
  "error": "No session ID available"
}
```

---

### 2. Send File Message
**POST** `/wa/send-file`

Sends a message with file attachment.

**Request Body:**
```json
{
  "phone": "6281234567890",
  "message": "Check this file!",
  "filePath": "/path/to/your/file.pdf",
  "sessionId": "SESSION-87a3eb63-7820-4de5-a8ef-e96c50c5e351"
}
```

**Response:**
```json
{
  "success": true,
  "message": "File message sent successfully",
  "data": {
    "success": true,
    "recipient": "6281234567890",
    "message": "Message sent successfully"
  }
}
```

---

## 🔧 Service Management

### 1. Restart Service
**POST** `/wa/restart`

Restarts the WhatsApp service by logging out current session and creating a new one.

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp service restarted successfully",
  "sessionId": "SESSION-new-session-id",
  "timestamp": "2025-01-07T07:36:43.000Z"
}
```

---

## 📝 Usage Examples

### Complete Flow Example

```bash
# 1. Create session
curl -X POST http://localhost:3000/api/wa/session/create

# Response: {"success": true, "message": "Session created. Please scan QR code.", "sessionId": "SESSION-123"}

# 2. Get QR code
curl "http://localhost:3000/api/wa/qr?sessionId=SESSION-123"

# 3. Check status (repeat until status is "READY")
curl "http://localhost:3000/api/wa/status?sessionId=SESSION-123"

# 4. Send message
curl -X POST http://localhost:3000/api/wa/send-message \
  -H "Content-Type: application/json" \
  -d '{"phone": "6281234567890", "message": "Hello from API!", "sessionId": "SESSION-123"}'

# 5. Send file
curl -X POST http://localhost:3000/api/wa/send-file \
  -H "Content-Type: application/json" \
  -d '{"phone": "6281234567890", "message": "Check this file!", "filePath": "/path/to/file.pdf", "sessionId": "SESSION-123"}'

# 6. Logout session
curl -X DELETE http://localhost:3000/api/wa/session/logout \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "SESSION-123"}'
```

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

const baseURL = 'http://localhost:3000/api';

// Create session
const createSession = async () => {
  const response = await axios.post(`${baseURL}/wa/session/create`);
  return response.data.sessionId;
};

// Get QR code
const getQRCode = async (sessionId) => {
  const response = await axios.get(`${baseURL}/wa/qr?sessionId=${sessionId}`);
  return response.data.qrCode;
};

// Check status
const checkStatus = async (sessionId) => {
  const response = await axios.get(`${baseURL}/wa/status?sessionId=${sessionId}`);
  return response.data.status;
};

// Send message
const sendMessage = async (phone, message, sessionId) => {
  const response = await axios.post(`${baseURL}/wa/send-message`, {
    phone,
    message,
    sessionId
  });
  return response.data;
};

// Usage
(async () => {
  const sessionId = await createSession();
  console.log('Session created:', sessionId);
  
  const qrCode = await getQRCode(sessionId);
  console.log('QR Code:', qrCode);
  
  // Wait for QR scan...
  let status = await checkStatus(sessionId);
  while (status !== 'READY') {
    console.log('Status:', status);
    await new Promise(resolve => setTimeout(resolve, 5000));
    status = await checkStatus(sessionId);
  }
  
  const result = await sendMessage('6281234567890', 'Hello!', sessionId);
  console.log('Message sent:', result);
})();
```

---

## ⚠️ Important Notes

1. **Phone Number Format**: Use international format without '+' (e.g., `6281234567890` for Indonesia)
2. **Session Management**: Always create a session before sending messages
3. **QR Code**: Scan QR code using WhatsApp mobile app to authenticate
4. **Session ID**: Optional parameter - if not provided, uses the current active session
5. **Error Handling**: Always check the `success` field in responses
6. **File Paths**: Use absolute paths for file uploads

---

## 🔄 Migration from Old API

The API has been updated to use the new WhatsApp API Gateway. Key changes:

- **New Helper**: `waGatewayHelper.js` replaces `waHelper.js`
- **Session Management**: Now supports multiple sessions
- **New Endpoints**: Added session management endpoints
- **File Support**: Added file message support
- **Better Error Handling**: Improved error messages and status codes

---

## 🚀 Quick Start

1. Start the backend server: `npm start`
2. Start the WhatsApp API Gateway: `cd wa-api-gateway && npm start`
3. Create session: `POST /api/wa/session/create`
4. Get QR code: `GET /api/wa/qr?sessionId={sessionId}`
5. Scan QR with WhatsApp mobile app
6. Check status: `GET /api/wa/status?sessionId={sessionId}`
7. Send messages: `POST /api/wa/send-message`
