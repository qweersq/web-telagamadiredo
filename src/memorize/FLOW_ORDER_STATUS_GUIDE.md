# PANDUAN FLOW ORDER STATUS KATSIKAT

## 🎯 TUJUAN
Dokumen ini menjelaskan bagaimana order status berubah dari awal sampai selesai di sistem Katsikat, sehingga semua karyawan dapat memahami alur kerja dengan baik.

## 📋 STATUS ORDER DETAILS

### Status yang Digunakan:
- **`not_yet`** - Order baru dibuat (menunggu pickup kurir)
- **`antrian`** - Masuk antrian teknisi (siap dikerjakan)
- **`on_progress`** - Sedang dikerjakan teknisi
- **`not_ready`** - Gagal QC, perlu perbaikan teknisi
- **`pengeringan`** - Selesai dikerjakan, menunggu pengeringan
- **`siap`** - Lolos QC, siap untuk diantar/diambil
- **`siap diambil`** - Siap diambil di toko
- **`siap_dikirim`** - Siap untuk diantar kurir
- **`done`** - Order selesai
- **`cancelled`** - Order dibatalkan

### Delivery Status:
- **`not_yet`** - Belum ada delivery
- **`scheduled`** - Delivery dijadwalkan
- **`on_the_way`** - Sedang dalam perjalanan
- **`delivered`** - Berhasil diantar
- **`failed`** - Gagal diantar

### Pickup Method:
- **`pickup`** - Diambil kurir dari customer
- **`delivery`** - Diantar kurir ke customer
- **`null`** - Tidak ada pickup/delivery (offline)

---

## 🚀 FLOW ORDER BARU

### 1. ORDER ONLINE (Customer order via aplikasi/website)
**Kondisi awal:**
- Status: `not_yet`
- Delivery Status: `scheduled`
- Pickup Method: `pickup`
- Delivery Date: [tanggal pickup]
- Delivery Time: [waktu pickup]

**Penjelasan:** Customer order online dan memilih pickup, jadi kurir akan mengambil sepatu dari customer.

### 2. ORDER OFFLINE (Customer datang ke toko)
**Kondisi awal:**
- Status: `antrian`
- Delivery Status: `not_yet`
- Pickup Method: `null`
- Delivery Date: `null`
- Delivery Time: `null`

**Penjelasan:** Customer datang langsung ke toko, jadi sepatu langsung masuk ke antrian teknisi.

---

## 🚚 FLOW KURIR

### PICKUP (Kurir ambil sepatu dari customer)

**Kondisi awal:**
- Status: `not_yet`
- Delivery Status: `scheduled`
- Pickup Method: `pickup`

**Aksi kurir:**

#### ✅ SELESAI PICKUP
**Setelah kurir ambil foto dan konfirmasi:**
- Status: `not_yet` → `antrian`
- Delivery Status: `scheduled` → `delivered`
- **Penjelasan:** Sepatu berhasil diambil, masuk ke antrian teknisi

#### ❌ GAGAL PICKUP
**Kurir pilih alasan gagal:**
- **Opsi 1 - Customer tidak ada:**
  - Status: `not_yet` → `cancelled`
  - Delivery Status: `scheduled` → `failed`
- **Opsi 2 - Customer datang ke toko:**
  - Status: `not_yet` → `antrian`
  - Delivery Status: `scheduled` → `not_yet`

### DELIVERY (Kurir antar sepatu yang sudah selesai)

**Kondisi awal:**
- Status: `siap_dikirim`
- Delivery Status: `scheduled`
- Pickup Method: `delivery`

**Aksi kurir:**

#### ✅ SELESAI DELIVERY
**Setelah kurir antar dan konfirmasi:**
- Status: `siap_dikirim` → `done`
- Delivery Status: `scheduled` → `delivered`

#### ❌ GAGAL DELIVERY
**Kurir pilih alasan gagal:**
- **Opsi 1 - Customer tidak ada, balik ke kasir:**
  - Status: `siap_dikirim` → `siap`
  - Delivery Status: `scheduled` → `failed`
- **Opsi 2 - Sudah diambil duluan:**
  - Status: `siap_dikirim` → `done`
  - Delivery Status: `scheduled` → `delivered`

---

## 👨‍🔧 FLOW TEKNISI

### Item yang Ditampilkan:
- Status: `not_yet`, `antrian`, `on_progress`, `not_ready`
- Semua delivery status

### Badge Khusus:
- **"Menunggu Pickup"** - Jika delivery_status `scheduled` dan pickup_method `pickup`
- **"Gagal QC"** - Jika status `not_ready`

### Aksi Teknisi:

#### 1. MULAI PENGERJAAN
**Teknisi klik "Mulai Treatment":**
- Status: `antrian`/`not_yet`/`not_ready` → `on_progress`
- **Penjelasan:** Teknisi mulai mengerjakan sepatu

#### 2. AKHIRI PENGERJAAN
**Teknisi klik "Selesai Treatment":**
- Status: `on_progress` → `pengeringan`
- **Penjelasan:** Pengerjaan selesai, sepatu masuk tahap pengeringan

---

## 💼 FLOW KASIR

### Item yang Ditampilkan:
- Status: `pengeringan`, `siap`, `siap diambil`

### Aksi Kasir:

#### 1. QUALITY CHECK (Setelah pengeringan)

**Kasir upload foto dan pilih:**

##### ✅ LOLOS QC
**Kasir klik "Lolos":**
- Status: `pengeringan` → `siap`
- **Penjelasan:** Sepatu lolos QC, siap untuk dipilih diantar/diambil

##### ❌ TIDAK LOLOS QC
**Kasir klik "Tidak Lolos":**
- Status: `pengeringan` → `not_ready`
- **Penjelasan:** Sepatu gagal QC, masuk kembali ke teknisi untuk perbaikan

#### 2. PILIH METODE PENGAMBILAN (Setelah lolos QC)

**Kasir pilih untuk item dengan status `siap`:**

##### 🚚 DIANTAR KURIR
**Kasir pilih "Diantar":**
- Status: `siap` → `siap_dikirim`
- Delivery Status: `not_yet`/`delivered` → `scheduled`
- Pickup Method: `delivery`
- **Penjelasan:** Sepatu masuk ke antrian kurir untuk diantar

##### 🏪 DIAMBIL DI TOKO
**Kasir pilih "Diambil di toko":**
- Status: `siap` → `siap diambil`
- Delivery Status: `not_yet`/`delivered` → `scheduled`
- Pickup Method: `pickup`
- **Penjelasan:** Customer akan mengambil sepatu di toko

#### 3. KONFIRMASI PENGAMBILAN

**Kasir klik "Sudah Diambil":**
- Status: `siap diambil` → `done`
- Delivery Status: `scheduled` → `delivered`
- **Penjelasan:** Customer sudah mengambil sepatu, order selesai

---

## 🔄 RINGKASAN FLOW LENGKAP

### Order Online:
```
not_yet → antrian → on_progress → pengeringan → siap → siap_dikirim → done
```

### Order Offline:
```
antrian → on_progress → pengeringan → siap → siap diambil → done
```

### Jika Gagal QC:
```
pengeringan → not_ready → on_progress → pengeringan → siap → ...
```

---

## ⚠️ PENTING UNTUK DIINGAT

### 1. **Status Huruf Kecil**
Semua status menggunakan huruf kecil dan underscore, contoh: `not_yet`, `siap_dikirim`

### 2. **Status dengan Spasi**
Beberapa status menggunakan spasi, contoh: `siap diambil`

### 3. **Delivery Status Selalu Ada**
Setiap order detail memiliki delivery_status, meskipun order offline

### 4. **Pickup Method untuk Tracking**
Pickup method membantu tracking apakah item diambil atau diantar

### 5. **Foto Wajib**
Setiap perubahan status penting harus disertai foto sebagai bukti

---

## 🆘 TROUBLESHOOTING

### Item tidak muncul di antrian?
- Cek status item
- Cek filter tanggal
- Cek apakah item sudah masuk status yang benar

### Status tidak berubah?
- Cek koneksi internet
- Cek apakah foto sudah diupload
- Cek apakah ada error di console

### Item hilang dari antrian?
- Cek apakah status sudah berubah
- Cek apakah item masuk ke antrian role lain
- Cek filter yang aktif

---

## 📞 KONTAK SUPPORT

Jika ada masalah atau pertanyaan terkait flow order status, silakan hubungi:
- **IT Support**: [nomor telepon]
- **WhatsApp**: [nomor WhatsApp]
- **Email**: [email support]

---

*Dokumen ini dibuat untuk memastikan semua karyawan memahami flow order status dengan baik dan dapat bekerja dengan efisien.* 