# DIAGRAM FLOW ORDER STATUS KATSIKAT

## 📊 DIAGRAM FLOW LENGKAP

```
ORDER BARU
    │
    ├── ORDER ONLINE ──────────────────────────────────────────────────────────┐
    │   │                                                                      │
    │   ├── not_yet (menunggu pickup)                                         │
    │   │   │                                                                 │
    │   │   ├── ✅ PICKUP BERHASIL                                            │
    │   │   │   └── antrian (masuk ke teknisi)                               │
    │   │   │                                                                 │
    │   │   └── ❌ PICKUP GAGAL                                               │
    │   │       ├── cancelled (customer tidak ada)                           │
    │   │       └── antrian (customer datang ke toko)                        │
    │   │                                                                     │
    │   └── antrian → on_progress → pengeringan → siap → siap_dikirim → done │
    │                                                                         │
    └── ORDER OFFLINE ────────────────────────────────────────────────────────┘
        │
        └── antrian → on_progress → pengeringan → siap → siap diambil → done
```

## 🔄 FLOW DETAIL PER ROLE

### 🚚 KURIR - PICKUP
```
not_yet (menunggu pickup)
    │
    ├── ✅ BERHASIL
    │   ├── Status: not_yet → antrian
    │   └── Delivery: scheduled → delivered
    │
    └── ❌ GAGAL
        ├── Opsi 1: not_yet → cancelled, scheduled → failed
        └── Opsi 2: not_yet → antrian, scheduled → not_yet
```

### 🚚 KURIR - DELIVERY
```
siap_dikirim (siap diantar)
    │
    ├── ✅ BERHASIL
    │   ├── Status: siap_dikirim → done
    │   └── Delivery: scheduled → delivered
    │
    └── ❌ GAGAL
        ├── Opsi 1: siap_dikirim → siap, scheduled → failed
        └── Opsi 2: siap_dikirim → done, scheduled → delivered
```

### 👨‍🔧 TEKNISI
```
antrian/not_yet/not_ready
    │
    ├── MULAI: antrian/not_yet/not_ready → on_progress
    │
    └── SELESAI: on_progress → pengeringan
```

### 💼 KASIR - QC
```
pengeringan
    │
    ├── ✅ LOLOS: pengeringan → siap
    │
    └── ❌ TIDAK LOLOS: pengeringan → not_ready
```

### 💼 KASIR - PILIH METODE
```
siap
    │
    ├── 🚚 DIANTAR: siap → siap_dikirim
    │   ├── Delivery: not_yet/delivered → scheduled
    │   └── Pickup: delivery
    │
    └── 🏪 DIAMBIL: siap → siap diambil
        ├── Delivery: not_yet/delivered → scheduled
        └── Pickup: pickup
```

### 💼 KASIR - KONFIRMASI
```
siap diambil
    │
    └── SUDAH DIAMBIL: siap diambil → done
        └── Delivery: scheduled → delivered
```

## 📋 STATUS MAPPING

### Status per Role:
- **KURIR**: `not_yet`, `siap_dikirim`
- **TEKNISI**: `not_yet`, `antrian`, `on_progress`, `not_ready`
- **KASIR**: `pengeringan`, `siap`, `siap diambil`

### Delivery Status per Kondisi:
- **`not_yet`**: Belum ada delivery (order offline)
- **`scheduled`**: Delivery dijadwalkan
- **`delivered`**: Berhasil diantar/diambil
- **`failed`**: Gagal diantar/diambil

### Pickup Method per Kondisi:
- **`pickup`**: Diambil kurir dari customer
- **`delivery`**: Diantar kurir ke customer
- **`null`**: Tidak ada pickup/delivery (offline)

## 🎯 CONTOH KASUS

### Kasus 1: Order Online - Pickup & Delivery
```
1. Customer order online → not_yet
2. Kurir pickup berhasil → antrian
3. Teknisi mulai → on_progress
4. Teknisi selesai → pengeringan
5. Kasir QC lolos → siap
6. Kasir pilih diantar → siap_dikirim
7. Kurir delivery berhasil → done
```

### Kasus 2: Order Offline - Diambil di Toko
```
1. Customer datang ke toko → antrian
2. Teknisi mulai → on_progress
3. Teknisi selesai → pengeringan
4. Kasir QC lolos → siap
5. Kasir pilih diambil → siap diambil
6. Customer ambil → done
```

### Kasus 3: Gagal QC - Perbaikan
```
1. Teknisi selesai → pengeringan
2. Kasir QC tidak lolos → not_ready
3. Teknisi perbaiki → on_progress
4. Teknisi selesai → pengeringan
5. Kasir QC lolos → siap
6. ... lanjut seperti biasa
```

## ⚠️ PENTING

### Status yang Perlu Foto:
- Setiap perubahan status penting
- Mulai pengerjaan teknisi
- Selesai pengerjaan teknisi
- QC kasir
- Pickup/delivery kurir

### Status yang Tidak Perlu Foto:
- Perubahan delivery_status
- Perubahan pickup_method
- Status cancelled

### Badge Khusus:
- **"Menunggu Pickup"**: Item yang menunggu kurir pickup
- **"Gagal QC"**: Item yang perlu perbaikan
- **"Lolos QC"**: Item yang sudah lolos QC
- **"Antrian Pengiriman"**: Item yang siap diantar kurir 