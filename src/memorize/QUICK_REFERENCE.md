# QUICK REFERENCE - ORDER STATUS KATSIKAT

## 🚀 ORDER BARU

| Order Type | Status | Delivery Status | Pickup Method |
|------------|--------|-----------------|---------------|
| **ONLINE** | `not_yet` | `scheduled` | `pickup` |
| **OFFLINE** | `antrian` | `not_yet` | `null` |

---

## 🚚 KURIR

### PICKUP
- **Awal**: `not_yet` + `scheduled` + `pickup`
- **Berhasil**: `not_yet` → `antrian`, `scheduled` → `delivered`
- **Gagal**: `not_yet` → `cancelled`/`antrian`, `scheduled` → `failed`/`not_yet`

### DELIVERY
- **Awal**: `siap_dikirim` + `scheduled` + `delivery`
- **Berhasil**: `siap_dikirim` → `done`, `scheduled` → `delivered`
- **Gagal**: `siap_dikirim` → `siap`/`done`, `scheduled` → `failed`/`delivered`

---

## 👨‍🔧 TEKNISI

### Item yang Ditampilkan:
- Status: `not_yet`, `antrian`, `on_progress`, `not_ready`

### Aksi:
- **Mulai**: `antrian`/`not_yet`/`not_ready` → `on_progress`
- **Selesai**: `on_progress` → `pengeringan`

---

## 💼 KASIR

### Item yang Ditampilkan:
- Status: `pengeringan`, `siap`, `siap diambil`

### QC (Setelah pengeringan):
- **Lolos**: `pengeringan` → `siap`
- **Tidak Lolos**: `pengeringan` → `not_ready`

### Pilih Metode (Status `siap`):
- **Diantar**: `siap` → `siap_dikirim`, `not_yet`/`delivered` → `scheduled`, `delivery`
- **Diambil**: `siap` → `siap diambil`, `not_yet`/`delivered` → `scheduled`, `pickup`

### Konfirmasi (Status `siap diambil`):
- **Sudah Diambil**: `siap diambil` → `done`, `scheduled` → `delivered`

---

## 📋 STATUS LIST

### Order Status:
- `not_yet` - Order baru (menunggu pickup)
- `antrian` - Masuk antrian teknisi
- `on_progress` - Sedang dikerjakan
- `not_ready` - Gagal QC, perlu perbaikan
- `pengeringan` - Selesai dikerjakan
- `siap` - Lolos QC, siap pilih metode
- `siap diambil` - Siap diambil di toko
- `siap_dikirim` - Siap diantar kurir
- `done` - Order selesai
- `cancelled` - Order dibatalkan

### Delivery Status:
- `not_yet` - Belum ada delivery
- `scheduled` - Delivery dijadwalkan
- `on_the_way` - Sedang dalam perjalanan
- `delivered` - Berhasil diantar
- `failed` - Gagal diantar

### Pickup Method:
- `pickup` - Diambil kurir dari customer
- `delivery` - Diantar kurir ke customer
- `null` - Tidak ada pickup/delivery

---

## 🎯 FLOW SINGKAT

### Order Online:
```
not_yet → antrian → on_progress → pengeringan → siap → siap_dikirim → done
```

### Order Offline:
```
antrian → on_progress → pengeringan → siap → siap diambil → done
```

### Gagal QC:
```
pengeringan → not_ready → on_progress → pengeringan → siap → ...
```

---

## ⚠️ PENTING

### Status dengan Spasi:
- `siap diambil` (bukan `siap_diambil`)

### Status dengan Underscore:
- `not_yet`, `on_progress`, `not_ready`, `siap_dikirim`

### Foto Wajib:
- Mulai pengerjaan teknisi
- Selesai pengerjaan teknisi
- QC kasir
- Pickup/delivery kurir

### Badge Khusus:
- **"Menunggu Pickup"**: `not_yet`/`antrian` + `scheduled` + `pickup`
- **"Gagal QC"**: `not_ready`
- **"Lolos QC"**: `siap`
- **"Antrian Pengiriman"**: `siap_dikirim` 