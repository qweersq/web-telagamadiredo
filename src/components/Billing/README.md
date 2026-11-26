# Billing Components

## Overview
Komponen-komponen untuk menampilkan dan mengelola billing tenant dengan validasi case-case yang berbeda.

## Components

### 1. BillingCard
Komponen card untuk menampilkan informasi billing dengan actions sesuai status.

**Props:**
- `billing` - Data billing object
- `onDetail` - Handler untuk membuka detail modal
- `onPayment` - Handler untuk transfer manual
- `onTripayPayment` - Handler untuk pembayaran via Tripay
- `onCheckPayment` - Handler untuk cek status pembayaran
- `generatingCode` - Loading state untuk generate payment code

**Features:**
- Status-based actions (unpaid, pending, paid, failed, cancelled)
- Transaction detection (ada payment_reference atau tidak)
- Expired transaction handling
- Clean UI dengan status indicators

### 2. BillingDetailModal
Modal detail billing dengan informasi lengkap dan actions sesuai status.

**Props:**
- `isOpen` - Boolean untuk show/hide modal
- `onClose` - Handler untuk close modal
- `billing` - Data billing object
- `onPayment` - Handler untuk transfer manual
- `onTripayPayment` - Handler untuk pembayaran via Tripay
- `onCheckPayment` - Handler untuk cek status pembayaran
- `onRefreshStatus` - Handler untuk refresh status
- `generatingCode` - Loading state untuk generate payment code
- `isConfirmingPayment` - Loading state untuk konfirmasi pembayaran

**Features:**
- Complete billing information display
- Payment information (jika ada transaction)
- Status-based actions dengan validasi
- Copy to clipboard functionality
- Bank selection untuk transfer manual
- Error handling

## Status Cases

### 1. UNPAID (Belum Create Transaction)
- Actions: Bayar via Tripay, Transfer Manual
- UI: Green button untuk Tripay, Gray button untuk Manual

### 2. PENDING (Sudah Create Transaction)
- Actions: Bayar Sekarang, Ganti Metode, Refresh Status
- UI: Green button untuk bayar, Orange untuk ganti metode

### 3. EXPIRED (Transaction Expired)
- Actions: Buat Transaksi Baru
- UI: Blue button dengan warning message

### 4. PAID (Sudah Dibayar)
- Actions: Lihat Detail saja
- UI: Success message dengan check icon

### 5. FAILED (Gagal Bayar)
- Actions: Coba Lagi, Ganti Metode
- UI: Red warning dengan retry options

### 6. CANCELLED (Dibatalkan)
- Actions: Buat Transaksi Baru
- UI: Gray message dengan retry option

## Usage Example

```jsx
import { BillingCard, BillingDetailModal } from '../../components/Billing';

// In your component
const [showDetailModal, setShowDetailModal] = useState(false);
const [selectedBilling, setSelectedBilling] = useState(null);

// Render billing cards
{upcomingBillings.map((billing) => (
  <BillingCard
    key={billing.id}
    billing={billing}
    onDetail={(billing) => {
      setSelectedBilling(billing);
      setShowDetailModal(true);
    }}
    onPayment={handlePayment}
    onTripayPayment={handleTripayPayment}
    onCheckPayment={handleCheckPayment}
    generatingCode={generatingCode}
  />
))}

// Render detail modal
<BillingDetailModal
  isOpen={showDetailModal}
  onClose={() => setShowDetailModal(false)}
  billing={selectedBilling}
  onPayment={handlePayment}
  onTripayPayment={handleTripayPayment}
  onCheckPayment={handleCheckPayment}
  onRefreshStatus={handleRefreshStatus}
  generatingCode={generatingCode}
  isConfirmingPayment={isConfirmingPayment}
/>
```

## Key Features

✅ **Status-based Actions** - Actions sesuai status billing  
✅ **Transaction Detection** - Deteksi apakah sudah create transaction  
✅ **Expired Handling** - Handle transaction yang expired  
✅ **Copy Functionality** - Copy payment reference dan URL  
✅ **Bank Selection** - Pilih bank untuk transfer manual  
✅ **Error Handling** - Proper error display  
✅ **Loading States** - Loading indicators untuk semua actions  
✅ **Responsive Design** - Mobile-friendly layout  
✅ **Clean Code** - Separation of concerns dan reusability  
