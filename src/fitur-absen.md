# Fitur Absen - Dokumentasi Logic

## Overview
Sistem absen di aplikasi NotaSepatu menggunakan logic yang memastikan user hanya bisa absen sekali per hari dan mengikuti alur yang tepat berdasarkan status absen mereka.

## Komponen Utama

### 1. AbsenAwal.jsx
**Fungsi**: Halaman absen masuk (clock in) untuk karyawan

#### Logic Utama:
- **Validasi Lokasi**: User harus berada dalam radius 10-50 meter dari outlet (kecuali superadmin)
- **Validasi Waktu**: Absen hanya bisa dilakukan dalam rentang waktu tertentu
- **Cek Status Absen**: Mengecek apakah user sudah absen hari ini

#### Flow:
1. **Mount Component**:
   - Ambil `employeeId` dari localStorage
   - Set `userRole` untuk validasi

2. **Button "Saya Hadir"**:
   - Jika `userRole === 'superadmin'`: Langsung `handleHadir()`
   - Jika bukan superadmin: Jalankan `checkLocation()`

3. **Validasi Lokasi**:
   - Gunakan `navigator.geolocation.getCurrentPosition()`
   - Hitung jarak ke outlet menggunakan `validateLocation()`
   - Jika dalam radius: Lanjut ke `handleHadir()`
   - Jika di luar radius: Tampilkan alert error

4. **Proses Absen Hadir**:
   - Ambil data user dari localStorage
   - POST ke endpoint `/absents` dengan payload:
     ```javascript
     {
       employee_id: user.id,
       branch_id: user.branch_id || 1,
       date: today,
       clock_in: currentTime,
       status: 'Present',
       description: 'Regular Absent'
     }
     ```
   - Jika sukses:
     - Set `sessionStorage.setItem('fromPresent', 'true')`
     - Set `localStorage.setItem("workStartTime", new Date().toISOString())`
     - Set `localStorage.setItem("currentAbsentId", data.data.id)`
     - Navigate ke `/loginSuccess`

#### Fitur Tambahan:
- **Izin/Libur**: Modal untuk input alasan izin (sakit, libur bersama, keperluan pribadi)
- **Audio Feedback**: Memainkan suara saat absen berhasil
- **Loading States**: Modal loading saat cek lokasi

### 2. AbsenAkhir.jsx
**Fungsi**: Halaman absen pulang (clock out) untuk karyawan

#### Logic Utama:
- **Cek Status Absen Hari Ini**: Mengecek apakah user sudah absen pulang
- **Hitung Durasi Kerja**: Menghitung waktu kerja dari `workStartTime`
- **Validasi Deskripsi**: Minimal 3 kata untuk evaluasi harian

#### Flow:
1. **Mount Component**:
   - Cek status absen hari ini via `/check-today?employee_id=${employeeId}`
   - Jika sudah `clock_out`: Set `alreadyClockedOut = true`
   - Hitung durasi kerja dari `localStorage.getItem("workStartTime")`

2. **Jika Sudah Absen Pulang**:
   - Tampilkan pesan "TERIMA KASIH" dengan durasi kerja
   - Button "Keluar" untuk logout

3. **Jika Belum Absen Pulang**:
   - Tampilkan form input deskripsi (min. 3 kata)
   - Button "Absen Pulang"

4. **Proses Absen Pulang**:
   - Validasi deskripsi minimal 3 kata
   - PUT ke endpoint `/absents/${currentAbsentId}` dengan payload:
     ```javascript
     {
       clock_out: currentTime,
       description: deskripsi
     }
     ```
   - Jika sukses:
     - Hapus semua data dari localStorage/sessionStorage
     - Navigate ke `/` (login page)

#### Fitur Tambahan:
- **Durasi Kerja Real-time**: Menampilkan jam, menit, detik kerja
- **Cleanup Data**: Menghapus semua data user saat logout

### 3. KurirTransport.jsx
**Fungsi**: Halaman khusus untuk kurir menginput data transportasi

#### Logic Utama:
- **Input ODO Meter**: ODO mulai dan selesai untuk hitung jarak
- **Upload Foto**: Bukti foto ODO meter
- **Hitung Biaya Bensin**: Otomatis berdasarkan jarak

#### Flow:
1. **Initial Modal**:
   - Tanya apakah ada antar jemput hari ini
   - Jika "Tidak Ada": Navigate ke `/absenakhir`
   - Jika "Ada": Lanjut ke form

2. **Input Data**:
   - ODO Mulai (angka)
   - ODO Selesai (angka, harus > ODO Mulai)
   - Quantity (jumlah pengantaran)
   - Upload 2 foto (ODO mulai & selesai)

3. **Validasi**:
   - Semua field harus diisi
   - ODO Selesai > ODO Mulai
   - Harus upload 2 foto

4. **Proses Submit**:
   - Upload foto ke `/uploads-odo`
   - POST ke `/deliveries-odo` dengan payload:
     ```javascript
     {
       users_id: user.id,
       quantity: quantityNum,
       date: today,
       odoStart: odoStartNum,
       odoEnd: odoEndNum,
       totalDistance: odoEndNum - odoStartNum,
       totalCost: fuelCost,
       odoStartPhoto: uploadedUrls[0].url_photo,
       odoEndPhoto: uploadedUrls[1].url_photo
     }
     ```
   - Jika sukses: Navigate ke `/absenakhir`

## Logic Backend (Berdasarkan Analisis Frontend)

### 1. Cek Status Absen Hari Ini
**Endpoint**: `GET /check-today?employee_id=${employeeId}`

**Response**:
```javascript
{
  success: true,
  data: {
    absentData: {
      id: number,
      employee_id: number,
      date: "YYYY-MM-DD",
      clock_in: "HH:mm:ss",
      clock_out: "HH:mm:ss" | null,
      status: "Present" | "Sick" | "Libur Bersama" | "Keperluan Pribadi",
      description: string
    }
  }
}
```

### 2. Absen Masuk
**Endpoint**: `POST /absents`

**Payload**:
```javascript
{
  employee_id: number,
  branch_id: number,
  date: "YYYY-MM-DD",
  clock_in: "HH:mm:ss",
  status: "Present",
  description: "Regular Absent"
}
```

### 3. Absen Pulang
**Endpoint**: `PUT /absents/${absentId}`

**Payload**:
```javascript
{
  clock_out: "HH:mm:ss",
  description: string
}
```

### 4. Izin/Libur
**Endpoint**: `POST /permissions`

**Payload**:
```javascript
{
  status: "Sick" | "Libur Bersama" | "Keperluan Pribadi",
  date: "YYYY-MM-DD",
  description: string,
  clock_in: "HH:mm:ss",
  employee_id: number
}
```

## SOLUSI MASALAH: Lupa Absen Pulang

### **Masalah yang Ditemukan**:
- User lupa absen pulang kemarin
- Hari ini buka aplikasi lagi (masih login)
- Aplikasi langsung masuk tanpa validasi absen kemarin
- User bisa kerja tanpa absen masuk hari ini

### **Solusi Implementasi**:

#### 1. **Backend Enhancement - API `/get-profile`**
**Endpoint**: `GET /get-profile`

**Response Baru**:
```javascript
{
  success: true,
  data: {
    user: {
      id: number,
      name: string,
      role: string,
      // ... data user lainnya
    },
    // Field baru untuk validasi absen
    hasUnfinishedAbsent: boolean,  // true jika ada absen kemarin yang belum clock_out
    unfinishedAbsentData: {        // data absen yang belum selesai (jika ada)
      id: number,
      date: "YYYY-MM-DD",
      clock_in: "HH:mm:ss",
      description: string
    }
  }
}
```

#### 2. **Auto-Close Logic di Backend**
Ketika `hasUnfinishedAbsent = true`:
- Auto-close absen kemarin dengan:
  - `clock_out` = sama dengan `clock_in` (hardcode)
  - `description` = "Lupa absen pulang - Auto close by system"
- Set `hasUnfinishedAbsent = false`

#### 3. **Frontend Validation**
**Lokasi**: Di komponen yang menggunakan `get-profile` (biasanya App.jsx atau layout utama)

**Logic**:
```javascript
// Setelah get-profile berhasil
if (response.data.hasUnfinishedAbsent) {
  // Auto logout user
  localStorage.removeItem("token");
  localStorage.removeItem("userData");
  localStorage.removeItem("workStartTime");
  localStorage.removeItem("currentAbsentId");
  sessionStorage.removeItem("fromPresent");
  sessionStorage.removeItem("fromIzin");
  
  // Redirect ke login
  navigate("/");
  
  // Optional: Tampilkan notifikasi
  alert("Anda lupa absen pulang kemarin. Silakan login ulang untuk absen hari ini.");
}
```

#### 4. **Flow Lengkap**:
```
User buka app → 
Call /get-profile → 
Jika hasUnfinishedAbsent = true → 
Backend auto-close absen kemarin → 
Frontend logout otomatis → 
User login lagi → 
Absen masuk hari ini
```

### **Keuntungan Solusi Ini**:

✅ **Minimal Frontend Changes**: Hanya perlu validasi di satu tempat  
✅ **Backend Handles Logic**: Auto-close dan validasi di backend  
✅ **User Experience**: Otomatis logout tanpa intervensi manual  
✅ **Data Integrity**: Absen kemarin tetap tercatat dengan keterangan jelas  
✅ **Audit Trail**: Ada log bahwa sistem yang auto-close  

### **Implementasi yang Diperlukan**:

#### **Backend**:
1. Update endpoint `/get-profile` untuk menambahkan field `hasUnfinishedAbsent`
2. Logic auto-close absen kemarin dengan `clock_out = clock_in`
3. Update deskripsi menjadi "Lupa absen pulang - Auto close by system"

#### **Frontend**:
1. Validasi `hasUnfinishedAbsent` setelah call `/get-profile`
2. Auto logout jika `hasUnfinishedAbsent = true`
3. Redirect ke login page

### **Tidak Perlu Diubah**:
- Layout komponen yang sudah ada
- State management yang sudah ada
- Flow absen normal yang sudah berjalan
- Komponen-komponen lain

## Alur Logic Utama

### 1. **User Belum Absen Hari Ini**
- Masuk ke halaman `AbsenAwal`
- Validasi lokasi (kecuali superadmin)
- Input absen masuk
- Navigate ke halaman utama aplikasi

### 2. **User Sudah Absen Masuk, Belum Absen Pulang**
- Masuk ke halaman utama aplikasi
- Saat logout/keluar: Navigate ke `AbsenAkhir`
- Input deskripsi evaluasi harian
- Absen pulang
- Logout dan kembali ke login

### 3. **User Sudah Absen Pulang**
- Masuk ke halaman utama aplikasi
- Saat logout: Langsung ke login (tidak perlu absen lagi)

### 4. **Khusus Kurir**
- Setelah absen masuk: Tanya apakah ada antar jemput
- Jika ada: Input data transportasi di `KurirTransport`
- Jika tidak: Langsung ke `AbsenAkhir`

### 5. **User Lupa Absen Pulang Kemarin** ⭐ **BARU**
- User buka aplikasi hari ini
- Backend detect ada absen kemarin yang belum selesai
- Auto-close absen kemarin dengan keterangan
- Frontend auto logout user
- User login ulang dan absen masuk hari ini

## Validasi dan Keamanan

### 1. **Validasi Lokasi**
- Radius 10-50 meter dari outlet
- Menggunakan HTML5 Geolocation API
- Error handling untuk berbagai kasus GPS

### 2. **Validasi Waktu**
- Absen masuk: 08:00-08:30 atau 16:00-24:00
- Absen pulang: Setelah absen masuk

### 3. **Validasi Data**
- Employee ID harus valid
- Deskripsi minimal 3 kata
- Foto ODO meter wajib untuk kurir

### 4. **Session Management**
- Token dan userData disimpan di localStorage
- Cleanup data saat logout/absen pulang
- Tracking alur login via sessionStorage

### 5. **Validasi Absen Kemarin** ⭐ **BARU**
- Cek absen kemarin yang belum selesai
- Auto-close dengan keterangan sistem
- Force logout untuk absen ulang hari ini

## State Management

### LocalStorage Keys:
- `token`: Token autentikasi
- `userData`: Data user (id, role, branch_id)
- `workStartTime`: Waktu mulai kerja
- `currentAbsentId`: ID absen hari ini

### SessionStorage Keys:
- `fromPresent`: Flag untuk tracking alur absen
- `fromIzin`: Flag untuk tracking alur izin

## Error Handling

### 1. **Lokasi Error**
- GPS tidak aktif
- Izin lokasi ditolak
- Timeout mendapatkan lokasi
- Browser tidak support geolocation

### 2. **Network Error**
- Gagal upload foto
- Gagal POST/PUT data absen
- Token expired/invalid

### 3. **Validation Error**
- Field required tidak diisi
- Format data tidak valid
- Durasi kerja tidak cukup

### 4. **Absen Kemarin Error** ⭐ **BARU**
- Gagal auto-close absen kemarin
- Gagal logout otomatis
- Data absen kemarin tidak ditemukan

## Fitur Khusus

### 1. **Superadmin Bypass**
- Tidak perlu validasi lokasi
- Bisa absen dari mana saja

### 2. **Audio Feedback**
- Suara saat absen berhasil
- Volume diatur ke 70%

### 3. **Loading States**
- Modal loading saat cek lokasi
- Disable button saat proses
- Progress indicator

### 4. **Responsive Design**
- Mobile-first approach
- Touch-friendly interface
- Adaptive layout

### 5. **Auto-Close Absen Kemarin** ⭐ **BARU**
- Detect absen kemarin yang belum selesai
- Auto-close dengan keterangan sistem
- Force logout untuk absen ulang

## Kesimpulan

Sistem absen ini dirancang dengan logic yang ketat untuk memastikan:
1. **Satu absen per hari**: User tidak bisa absen ganda
2. **Validasi lokasi**: Memastikan user benar-benar di outlet
3. **Tracking waktu**: Menghitung durasi kerja yang akurat
4. **Evaluasi harian**: Memaksa user memberikan feedback
5. **Khusus kurir**: Tracking transportasi dan biaya bensin
6. **Auto-handle lupa absen**: Menangani kasus lupa absen pulang dengan otomatis

Logic ini memastikan integritas data absen dan memberikan pengalaman yang smooth untuk user, termasuk penanganan kasus edge seperti lupa absen pulang. 