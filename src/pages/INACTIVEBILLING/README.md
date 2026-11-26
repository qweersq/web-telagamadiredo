# 🚨 INACTIVE TENANT BILLING SYSTEM

## 📋 Overview
Sistem billing khusus untuk tenant yang statusnya `suspended` atau `expired`. Tenant ini tidak bisa mengakses halaman normal karena tidak memiliki JWT token yang valid, sehingga menggunakan `EncryptedDataMiddleware` untuk authentication.

## 🎯 Fitur Utama
- **Status Alert** - Menampilkan status suspended dengan info tenant
- **Billing List** - Daftar tagihan unpaid dan pending dengan aksi
- **Payment Modal** - Upload bukti transfer dengan validasi file
- **Change Plan Modal** - Ganti paket dengan logika billing unpaid/buat baru
- **Status Checker** - Auto-refresh status setiap 30 detik
- **Login Modal** - Modal untuk cek status pembayaran

## 🛠️ Teknis
- **Authentication**: Menggunakan `EncryptedDataMiddleware` dari localStorage
- **File Upload**: Support JPEG, PNG, PDF dengan validasi ukuran 5MB
- **Real-time Updates**: Auto-refresh status setiap 30 detik
- **Error Handling**: Comprehensive error handling di semua komponen
- **Responsive Design**: Mobile-first dengan Tailwind CSS

## 📁 Struktur File
```
INACTIVEBILLING/
├── InactiveBillingPage.jsx          # Halaman utama
├── components/
│   ├── StatusAlert.jsx              # Alert status suspended
│   ├── BillingList.jsx              # Daftar tagihan unpaid/pending
│   ├── PaymentModal.jsx             # Modal pembayaran + upload bukti
│   ├── ChangePlanModal.jsx          # Modal ganti paket
│   ├── StatusChecker.jsx            # Cek status real-time
│   └── LoginModal.jsx               # Modal cek status pembayaran
├── services/
│   └── inactiveBillingService.js    # Service API dengan encrypted data
└── index.js                         # Export semua komponen
```

## 🚀 Cara Penggunaan

### 1. Routing
```javascript
// Sudah didaftarkan di App.jsx
<Route path="/inactive-tenant-billing" element={<InactiveBillingPage />} />
```

### 2. API Interceptor
```javascript
// 402 error akan redirect ke /inactive-tenant-billing
// Encrypted data akan disimpan di localStorage
```

### 3. Import Komponen
```javascript
import { InactiveBillingPage } from './pages/INACTIVEBILLING';
```

## 🔧 API Endpoints
- `GET /inactive-tenants/status` - Status tenant dan subscription
- `GET /inactive-tenants/billing-status` - Status billing dan pending
- `GET /inactive-tenants/billing-history` - Riwayat billing
- `GET /inactive-tenants/subscription-plans` - Paket tersedia
- `POST /inactive-tenants/change-plan` - Ganti paket
- `POST /inactive-tenants/submit-payment` - Submit pembayaran
- `GET /inactive-tenants/payment-status/:id` - Cek status pembayaran

## 📱 UI/UX Features
- **Single Page App** - Semua fitur dalam satu halaman
- **Clear Status Indicators** - Warna dan icon yang jelas untuk setiap status
- **Mobile Responsive** - Layout yang optimal untuk mobile dan desktop
- **User-friendly Messages** - Pesan error dan success yang jelas
- **Support Contact** - Tombol hubungi support di bawah

## 🔐 Security
- **Encrypted Data Validation** - Setiap API call menggunakan encrypted data
- **File Upload Validation** - Type dan size validation
- **Rate Limiting** - Prevent abuse
- **Session Timeout** - Security timeout

## 🎨 Design System
- **Colors**: Red (suspended), Yellow (pending), Green (paid), Blue (info)
- **Icons**: Lucide React icons
- **Typography**: Montserrat font
- **Layout**: Mobile-first responsive design

## 📊 Status Flow
1. **Suspended** → User diarahkan ke halaman ini
2. **Unpaid Bills** → User bisa bayar dengan upload bukti
3. **Pending** → Menunggu verifikasi admin
4. **Paid** → Akun diaktifkan kembali

## 🚨 Error Handling
- **Network Errors** - Retry mechanism
- **File Upload Errors** - Clear error messages
- **API Errors** - User-friendly error messages
- **Authentication Errors** - Redirect to login

## 📝 Notes
- Halaman ini hanya bisa diakses oleh tenant yang statusnya suspended/expired
- Menggunakan encrypted data authentication, bukan JWT token
- File upload maksimal 5MB dengan format JPEG, PNG, PDF
- Auto-refresh status setiap 30 detik untuk pending bills
