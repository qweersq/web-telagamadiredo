# Service Management Components

## Overview
Komponen-komponen untuk mengelola layanan, diskon, dan item dalam aplikasi NotaSepatu.

## Components

### 1. ServiceSetupModal.jsx
Modal untuk setup layanan secara custom dengan fitur:
- Pilih kategori layanan (Cleaning, Repair, Customization, Protection)
- Tambah layanan custom dengan detail lengkap
- Atur diskon dengan berbagai jenis (percent/nominal)
- Tambah item tambahan yang dijual
- Kalkulasi harga otomatis

### 2. QuickSetupModal.jsx
Modal untuk quick setup menggunakan template populer berdasarkan data database:
- Template berdasarkan analisis data database yang ada
- Setup otomatis layanan, diskon, dan item
- Progress tracking selama setup
- Integrasi langsung dengan API backend

## Data Files

### 1. shoeServicesData.js
Data struktur layanan cuci sepatu berdasarkan riset industri:
- Kategori layanan (4 kategori utama)
- Layanan spesifik dengan harga dan detail
- Template diskon
- Item tambahan yang bisa dijual

### 2. quickSetupTemplates.js
Template data untuk Quick Setup berdasarkan analisis database:
- 5 template berbeda (Shoes, Repair, Comprehensive, Bags, Luggage)
- Data sesuai dengan struktur database yang ada
- Helper functions untuk manipulasi template

## API Integration

### Treatment API
- **POST** `/treatments` - Create treatment
- **GET** `/treatments` - Get all treatments
- **PUT** `/treatments/:id` - Update treatment
- **DELETE** `/treatments/:id` - Delete treatment

### Discount API
- **POST** `/discounts` - Create discount
- **GET** `/discounts` - Get all discounts
- **PUT** `/discounts/:id` - Update discount
- **DELETE** `/discounts/:id` - Delete discount

### Item API
- **POST** `/items` - Create item
- **GET** `/items` - Get all items
- **PUT** `/items/:id` - Update item
- **DELETE** `/items/:id` - Delete item

## Usage

### QuickSetupModal
```jsx
import QuickSetupModal from '../components/ServiceManagement/QuickSetupModal';

<QuickSetupModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onComplete={(data) => console.log('Setup completed:', data)}
  tenantId={tenantId}
/>
```

### ServiceSetupModal
```jsx
import ServiceSetupModal from '../components/ServiceManagement/ServiceSetupModal';

<ServiceSetupModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSave={(data) => console.log('Service saved:', data)}
/>
```

## Features

### Quick Setup Templates
1. **Template Cuci Sepatu Dasar** - Layanan cuci standar
2. **Template Reparasi Sepatu** - Layanan perbaikan dengan tingkat kerusakan
3. **Template Lengkap Sepatu** - Semua layanan sepatu
4. **Template Layanan Tas** - Layanan cuci dan perbaikan tas
5. **Template Layanan Koper** - Layanan cuci dan perbaikan koper

### Data Structure
Semua template menggunakan struktur data yang sesuai dengan database:
- **Services**: name, price, type_item, type_service, description
- **Discounts**: name, type (percent/nominal), discount
- **Items**: name, brand, type, color, material

## Error Handling
- API error handling dengan try-catch
- Progress tracking untuk setup yang panjang
- Fallback untuk data yang gagal dibuat
- User feedback yang jelas

## Performance
- Lazy loading untuk template data
- Optimized API calls dengan batching
- Progress tracking untuk UX yang baik
- Efficient state management
