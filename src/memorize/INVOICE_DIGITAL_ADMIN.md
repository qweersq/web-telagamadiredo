# Memorize: Invoice Digital (Admin Panel)

## Ringkasan Fitur
- Fitur ini hanya untuk admin, bukan untuk FE pelanggan.
- Admin dapat melakukan preview invoice digital sebelum mengirim ke pelanggan.
- Admin menekan tombol trigger "Kirim Invoice", backend otomatis mengirim link invoice ke WhatsApp pelanggan.
- Jika pengiriman sukses, backend mengembalikan response success.
- FE admin hanya perlu menampilkan status bahwa invoice sudah berhasil dikirim (misal: tanda/success message).
- Tidak perlu menampilkan/mengakses log akses invoice di FE admin, cukup status pengiriman saja.
- Semua log akses hanya disimpan di database.
- Project FE untuk pelanggan berbeda dan tidak di-handle di sini.

## Flow Utama
1. Admin membuat order baru atau memilih order yang sudah ada.
2. Admin dapat preview invoice digital (URL contoh: https://www.katsikat.id/invoice/WG1i9Yq_).
3. Admin menekan tombol "Kirim Invoice".
4. Backend mengirim link invoice ke WhatsApp pelanggan secara otomatis.
5. Jika pengiriman sukses, FE menampilkan status/success message bahwa invoice sudah berhasil dikirim.

## Catatan Teknis
- Endpoint pengiriman invoice: POST /invoice/:token/send atau POST /invoice/send-by-order-id (khusus admin, pakai AuthMiddleware).
- Backend akan mengirim link invoice ke nomor WhatsApp pelanggan yang terdaftar pada order.
- Tidak perlu menampilkan log akses invoice di FE admin.
- Semua log akses hanya untuk keperluan audit di database.

## Contoh URL Invoice
- https://www.katsikat.id/invoice/WG1i9Yq_

---

> Catatan ini khusus untuk implementasi dan referensi fitur Invoice Digital di panel admin. Untuk FE pelanggan, ada project terpisah. 