# Memorize: Perubahan Sistem Filter API Antrian/Treatment (Dashboard Operasional)

## Tujuan
- Mempercepat dan menyederhanakan proses pengambilan data antrian/treatment di dashboard operasional (teknisi, kasir, kurir).
- Mengurangi kompleksitas logic di frontend, karena filter status sudah di-handle langsung oleh backend.

## Perubahan Utama
- **Sebelumnya:**
  - Frontend mengambil semua order, lalu melakukan filter dan mapping status order detail di sisi client (JS).
  - Logic filter cukup rumit dan menyebabkan loading lama, terutama jika data banyak.
- **Sekarang:**
  - Backend sudah menyediakan endpoint baru yang bisa menerima filter dinamis via query string.
  - Filter status order detail cukup dikirim lewat query param, misal:
    - `filter[order_details.status]=not_yet` (teknisi/antrian)
    - `filter[order_details.status]=pengeringan` (kasir)
    - `filter[order_details.status]=siap` (kurir)
  - Endpoint:
    - `GET /api/orders/getAllNew?filter[order_details.status]=<status>`
  - Response structure tetap sama seperti sebelumnya, hanya payload filter yang berubah.

## Implikasi untuk Frontend
- **Query ke backend lebih sederhana:**
  - Tidak perlu lagi fetch semua data lalu filter manual di frontend.
  - Cukup panggil endpoint baru dengan filter status yang diinginkan.
- **Logic frontend jadi lebih ringan dan cepat:**
  - Data yang diterima sudah pasti relevan dengan kebutuhan tampilan.
  - Proses mapping dan counting di frontend bisa lebih efisien.
- **Perubahan utama di frontend:**
  - Ubah endpoint dan payload filter pada fungsi fetch data antrian/treatment.
  - Pastikan mapping data dan render tetap sesuai dengan response lama.

## Catatan Teknis
- **Endpoint baru:**
  - `/api/orders/getAllNew?filter[order_details.status]=not_yet` (contoh untuk teknisi)
- **Query param bisa diganti sesuai kebutuhan role/dashboard.**
- **Response structure tidak berubah, jadi komponen frontend tidak perlu diubah besar-besaran.**
- **Untuk filter range tanggal, backend MENGHARAPKAN key-nya adalah `gte` dan `lte` (tanpa `$`),**
  **bukan `$gte`/`$lte`.**
  - Contoh filterObj yang benar:
    ```js
    filterObj.entry_date = { gte: '2024-07-01', lte: '2024-07-31' };
    ```
  - Jika tanggal sama, tetap gunakan string:
    ```js
    filterObj.entry_date = '2024-07-01';
    ```
- **Untuk filter status order_details (teknisi), bisa multi-value (array):**
  - Contoh:
    ```js
    filterObj["order_details.status"] = ["not_yet", "antrian", "on_progress", "not_ready"];
    ```

---

> Untuk pengambilan data antrian/treatment di dashboard operasional (teknisi, kasir, kurir), gunakan endpoint baru `/api/orders/getAllNew` dengan query param `filter[order_details.status]=<status>`. Tidak perlu lagi filter manual di frontend, cukup kirim status yang diinginkan lewat query param. Response structure sama, hanya payload filter yang berubah. 

---

## Analisa & Rencana Refactor BerandaTeknisi.jsx

### 1. Data yang Dipakai
- **Order dan Order Detail:**
  - Data utama adalah daftar order beserta order_details (treatment) di dalamnya.
  - Setiap order_detail (treatment) memiliki status, process_time (regular, same_day, next_day), dan info item/customer.
- **Status Fokus:**
  - Untuk dashboard teknisi, status yang diambil adalah `not_yet` (treatment yang belum dikerjakan).
- **Perhitungan & Filter:**
  - Data dipecah berdasarkan estimasi pengerjaan (`process_time`): regular, same_day, next_day.
  - Hanya treatment dengan status `not_yet` yang dihitung dan ditampilkan.
  - Data treatment di-flatten dari order ke array treatment, lalu di-filter dan di-count di frontend.
- **Rentang Tanggal:**
  - Ada filter rentang tanggal (`startDate`, `endDate`) untuk membatasi data order yang diambil.
- **Quick Date Selection:**
  - Fitur quick select (hari ini, kemarin, besok) untuk memudahkan filter tanggal.

### 2. Permasalahan Implementasi Lama
- Semua order di-fetch, lalu diolah manual di frontend (flatten, filter, count), menyebabkan loading lama jika data banyak.
- Logic frontend menjadi rumit dan berat.

### 3. Rencana Perubahan (Dengan API Filter Baru)
- **Ambil data treatment dengan status `not_yet` langsung dari backend:**
  - Endpoint: `/api/orders/getAllNew?filter[order_details.status]=not_yet`
  - Sertakan filter tanggal jika backend mendukung: `&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- **Frontend hanya mapping dan counting ringan:**
  - Data yang diterima sudah pasti hanya treatment dengan status `not_yet`.
  - Tinggal dipecah berdasarkan `process_time` (regular, same_day, next_day) untuk counting dan display.
- **Logic frontend lebih sederhana dan efisien:**
  - Tidak perlu flatten dan filter manual dari semua order.
  - Proses render dan update state jadi lebih cepat.

### 4. Hal-hal yang Akan Dilakukan
- Refactor fungsi fetch data (`fetchAntrianData`) agar menggunakan endpoint dan filter baru.
- Pastikan filter tanggal tetap dikirim ke backend (jika didukung).
- Update proses mapping dan counting agar hanya berdasarkan data yang sudah terfilter dari backend.
- Pastikan UI dan fitur quick date selection tetap berjalan seperti sebelumnya.
- Dokumentasikan perubahan dan logic baru di file memorize ini. 

---

# Analisis OrderController.getAll & Rencana Refactor getAllNew

## Permasalahan pada getAll Saat Ini
- Banyak query param spesifik: `startDate`, `dueStartDate`, `paymentStartDate`, dst.
- Di service & repository, filter diterapkan dengan blok if terpisah untuk masing-masing field/relasi (Order, OrderDetail, PaymentDetail).
- Jika ingin menambah filter baru (misal status order detail), harus menambah blok baru → tidak scalable, banyak perulangan, dan sulit maintain.
- Tidak mendukung filter dinamis/multi-value (misal status order detail: ['on_progress', 'done']).

## Contoh Query Param Lama
```
{
  page: 1,
  pageSize: 10,
  startDate: '2024-07-01',
  endDate: '2024-07-31',
  dueStartDate: '2024-07-01',
  dueEndDate: '2024-07-31',
  paymentStartDate: '2024-07-01',
  paymentEndDate: '2024-07-31',
  search: 'John'
}
```

## Dampak
- Kode di service & repository penuh if/else untuk setiap filter.
- Menambah filter baru = tambah blok baru di banyak tempat.
- Tidak scalable untuk kebutuhan filter yang terus bertambah.

---

## Rencana Refactor: getAllNew
### Tujuan
- Query param filter lebih dinamis, misal: `filter[field]=value`, `filter[order_detail_status]=done`, `filter[status]=paid`, dst.
- Di repository, filter di-parse dan diterapkan ke model/relasi yang sesuai (Order, OrderDetail, Payment, dst) secara fleksibel.
- Mendukung filter multi-value (misal: `filter[order_detail_status]=on_progress,done`).
- Menambah filter status order detail (OrderDetail.status) jadi mudah.
- Return tetap sama persis dengan getAll lama (ada statistics, orders, pagination).

### Contoh Query Param Baru
```
{
  page: 1,
  pageSize: 10,
  filter: {
    entry_date: { gte: '2024-07-01', lte: '2024-07-31' },
    'order_details.status': ['on_progress', 'done'],
    'payment.status': 'paid',
    search: 'John'
  }
}
```

### Langkah Teknis
1. **Controller**: parsing query param filter jadi object dinamis.
2. **Service**: terima object filter, teruskan ke repository.
3. **Repository**: mapping filter ke where/include yang sesuai, support multi-level relasi.
4. **Statistics**: perhitungan tetap sama, hanya sumber data yang lebih fleksibel.
5. **Testing**: pastikan hasil response sama persis dengan getAll lama.

### Catatan Teknis
- Untuk filter relasi (misal order_details.status), perlu include + where di level relasi.
- Untuk filter multi-value, gunakan `[Op.in]`.
- Untuk filter range (tanggal), gunakan `[Op.gte]`, `[Op.lte]`.
- Pastikan pagination, sorting, dan statistik tetap berjalan.

---

## Kesimpulan
Dengan refactor ke getAllNew yang dinamis, penambahan filter baru (termasuk status order detail) akan jauh lebih mudah, scalable, dan maintainable. Kode di controller/service/repository jadi lebih clean dan siap untuk kebutuhan filter yang terus berkembang.

---

*Catatan: File ini dibuat otomatis oleh AI untuk dokumentasi internal pengembangan fitur order getAll yang lebih dinamis.* 