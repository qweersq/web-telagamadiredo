# ORDER STATUS FLOW KATSIKAT

## STATUS ORDER DETAIL
- `not_yet` - Order baru dibuat
- `antrian` - Masuk antrian teknisi
- `on_progress` - Sedang dikerjakan teknisi
- `not_ready` - Gagal QC, perlu perbaikan
- `pengeringan` - Selesai dikerjakan, menunggu pengeringan
- `siap` - Lolos QC, siap untuk diantar/diambil
- `siap diambil` - Siap diambil di toko
- `siap_dikirim` - Siap untuk diantar kurir
- `done` - Order selesai
- `cancelled` - Order dibatalkan

## DELIVERY STATUS
- `not_yet` - Belum ada delivery
- `scheduled` - Delivery dijadwalkan
- `on_the_way` - Sedang dalam perjalanan
- `delivered` - Berhasil diantar
- `failed` - Gagal diantar

## PICKUP METHOD
- `pickup` - Diambil kurir dari customer
- `delivery` - Diantar kurir ke customer
- `null` - Tidak ada pickup/delivery (offline)

## FLOW ORDER BARU

### 1. ORDERTYPE = ONLINE
- status: `not_yet`
- delivery_status: `scheduled`
- pickup_method: `pickup`
- delivery_date: [tanggal]
- delivery_time: [waktu]

### 2. ORDERTYPE = OFFLINE
- status: `antrian`
- delivery_status: `not_yet`
- pickup_method: `null`
- delivery_date: `null`
- delivery_time: `null`

## FLOW KURIR

### PICKUP (Ambil item customer)
- **Awal**: status=`not_yet`, delivery_status=`scheduled`
- **Gagal Pickup** (popup pilihan):
  - Opsi 1: status=`not_yet`→`cancelled`, delivery_status=`scheduled`→`failed`
  - Opsi 2: status=`not_yet`→`antrian`, delivery_status=`scheduled`→`not_yet` (customer datang ke toko)
- **Selesai Pickup**: status=`not_yet`→`antrian`, delivery_status=`scheduled`→`delivered`

### DELIVERY (Antar sepatu selesai)
- **Awal**: status=`siap_dikirim`, delivery_status=`scheduled`
- **Gagal Delivery** (popup pilihan):
  - Opsi 1: status=`siap_dikirim`→`siap`, delivery_status=`scheduled`→`failed` (balik ke kasir)
  - Opsi 2: status=`siap_dikirim`→`done`, delivery_status=`scheduled`→`delivered`, pickup_method=`delivery`→`pickup` (sudah diambil duluan)
- **Selesai Delivery**: status=`siap_dikirim`→`done`, delivery_status=`scheduled`→`delivered`

## FLOW KASIR

### 1. PILIHAN LOLOS/TIDAK LOLOS (setelah pengeringan)
- **Lolos**: status=`pengeringan`→`siap`
- **Tidak Lolos**: status=`pengeringan`→`not_ready`

### 2. PILIHAN DIANTAR/DIAMBIL DITOKO
- **Diantar**: 
  - status=`siap`→`siap_dikirim`
  - delivery_status=`not_yet`/`delivered`→`scheduled`
  - pickup_method=`delivery`
- **Diambil di toko**:
  - status=`siap`→`siap diambil`
  - delivery_status=`not_yet`/`delivered`→`scheduled`
  - pickup_method=`pickup`

## FLOW TEKNISI

### Item yang ditampilkan
- Status: `not_yet`, `antrian`, `on_progress`, `not_ready`
- Semua delivery_status
- Badge "Menunggu Pickup" jika delivery_status=`scheduled` dan pickup_method=`pickup`
- Badge "Gagal QC" jika status=`not_ready`

### Aksi Teknisi
1. **Mulai Pengerjaan**:
   - status=`antrian`→`on_progress` atau `not_ready`→`on_progress`
2. **Akhiri Pengerjaan**:
   - status=`on_progress`→`pengeringan`

## PERTANYAAN UNTUK KONFIRMASI
1. Apakah ada status tambahan yang perlu ditambahkan?
2. Apakah flow untuk gagal pickup/delivery sudah benar?
3. Apakah ada kondisi khusus yang belum tercakup?
4. Bagaimana dengan order yang dibatalkan di tengah proses? 