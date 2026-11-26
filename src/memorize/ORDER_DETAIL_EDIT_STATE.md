# Memorize: Sistem Edit State & Penyimpanan Order Detail (OrderDetail.jsx)

## Tujuan
Mencegah kehilangan data perubahan order detail jika user belum melakukan update order, serta memberi peringatan jika user keluar sebelum menyimpan perubahan.

## Fitur Utama
- **Dirty State Context**: Jika ada perubahan di order detail (belum di-update ke server), tampilkan penanda (misal: badge, icon, atau alert) bahwa ada perubahan yang belum disimpan.
- **Alert Keluar**: Jika user mencoba keluar/navigate dari halaman order detail saat ada perubahan yang belum disimpan, munculkan alert/confirm: "Simpan perubahan sebelum keluar?" (opsi: Simpan, Jangan Simpan, Batal).
- **Penyimpanan Local Storage**: Semua perubahan order detail (yang belum di-update ke server) otomatis disimpan di local storage dengan key unik per order_id. Jika user reload/close tab, data perubahan tetap ada.
- **Restore/Hapus Draft**: Jika user masuk ke order detail dan ada draft perubahan di local storage, tampilkan opsi: "Lanjut Edit" (restore draft ke context) atau "Hapus Perubahan Sebelumnya" (hapus draft, load data asli dari server).
- **Tidak Mengganggu State Lama**: Sistem ini tidak mengubah state utama yang sudah berjalan, hanya menambah layer penyimpanan draft & validasi keluar.

## Flow Singkat
1. User edit order detail (belum klik update order) → context dirty, simpan draft ke local storage.
2. User keluar/close tab/navigate → alert konfirmasi simpan perubahan.
3. User kembali ke order detail → jika ada draft, bisa lanjut edit atau hapus draft.
4. Jika klik update order, draft di local storage dihapus.

## Catatan Teknis
- Draft disimpan di local storage dengan key: `order_draft_{order_id}`.
- Dirty state bisa dideteksi dengan membandingkan context order detail dengan data awal dari server.
- Alert keluar bisa pakai event `beforeunload` dan intercept react-router navigation.
- Restore draft: replace context order detail dengan data dari local storage.
- Hapus draft: remove dari local storage, reload data dari server.

## Langkah Implementasi (Progress)

### 1. Helper Local Storage Draft
- [x] Buat helper untuk simpan/ambil/hapus draft order detail di local storage (key: order_draft_{order_id}).

### 2. Restore/Hapus Draft Saat Masuk Order Detail
- [x] Saat komponen mount, cek apakah ada draft di local storage untuk order_id.
- [x] Jika ada, tampilkan modal/alert: "Lanjut edit draft?" atau "Hapus perubahan sebelumnya?"
- [x] Jika user pilih lanjut, restore draft ke context.
- [x] Jika user pilih hapus, hapus draft dan load data asli dari server.

### 3. Dirty State & Auto Save (Next)
- [ ] Deteksi dirty state (bandingkan context dengan data awal server).
- [ ] Jika dirty, auto-save ke local storage (debounce).

### 4. Alert Keluar (Next)
- [ ] Tambahkan event beforeunload & intercept navigation jika dirty state true.
- [ ] Tampilkan alert konfirmasi simpan perubahan.

### 5. Hapus Draft Setelah Update (Next)
- [ ] Setelah update order sukses, hapus draft dari local storage.

### Catatan Implementasi Terakhir
- [x] Restore/hapus draft saat mount sudah diimplementasikan di OrderDetail.jsx.
  - Jika ada draft di local storage, muncul modal: Lanjut Edit (restore draft ke context) atau Hapus Perubahan (hapus draft, reload data asli).
  - Tidak mengubah state utama yang sudah berjalan.
- [x] Dirty state detection sudah diimplementasikan.
  - State isDirty otomatis true jika ada perubahan pada order detail (dibandingkan data awal dari server atau draft).
  - Perbandingan hanya pada field penting: id, customer, order_details, payment, quantity, order_type, entry_date, branch_id.
- [x] Auto-save draft ke local storage jika dirty state true.
  - Draft otomatis disimpan (debounce 1 detik) setiap ada perubahan.
- [x] Alert keluar (beforeunload & navigation block) jika ada perubahan yang belum disimpan.
  - Muncul confirm dialog saat close tab/navigate jika isDirty true.
- [x] Hapus draft setelah update order sukses.
  - Draft di local storage otomatis dihapus setelah handleSubmit berhasil.

### Next Step
- [ ] (Opsional) Penanda visual dirty state di UI (badge/icon).
- [ ] (Opsional) Opsi simpan draft manual atau reset draft dari UI.

### Catatan Masalah & Solusi
- [!] **BUG:** Modal "Lanjutkan Perubahan Order" (restore/hapus draft) muncul berulang kali setiap ada perubahan (misal pindah step, update quantity, dsb), padahal seharusnya hanya muncul sekali saat awal masuk jika ada draft.
- [!] **BUG:** Modal juga kadang muncul lagi setelah update field tertentu.
- **Solusi yang Diinginkan:**
  - Modal restore/hapus draft hanya muncul sekali saat awal masuk halaman jika ada draft di local storage.
  - Setelah user memilih (lanjut edit/hapus), modal tidak muncul lagi selama sesi edit order detail.
  - Modal tidak muncul saat pindah step, update field, atau edit data selama masih di halaman yang sama.
  - Modal hanya muncul lagi jika user keluar lalu masuk kembali ke halaman order detail dan draft masih ada.

---

> Checklist ini akan diupdate setiap progress implementasi fitur penyimpanan draft & dirty state di OrderDetail.jsx. 