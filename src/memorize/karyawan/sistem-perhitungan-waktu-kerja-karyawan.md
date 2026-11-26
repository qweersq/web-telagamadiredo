# Sistem Perhitungan Waktu Kerja Karyawan

## 📋 Overview
Sistem untuk menghitung dan melacak performa kerja karyawan berdasarkan absensi, waktu kerja, ongkir delivery, dan jumlah item yang diproses.

## 🎯 Fitur Utama

### 1. **Dashboard Karyawan**
- List semua karyawan aktif
- Filter berdasarkan cabang/branch
- Status karyawan (aktif/nonaktif)

### 2. **Perhitungan Waktu Kerja**
- **Absensi Harian**: Clock in/out, durasi kerja
- **Kehadiran**: Presentase kehadiran per periode
- **Waktu Kerja**: Total jam kerja per hari/minggu/bulan

### 3. **Perhitungan Ongkir Delivery**
- Total jarak tempuh per hari (dari tabel `deliveries`)
- Perhitungan ongkir berdasarkan jarak
- Tracking odo meter (start/end)

### 4. **Perhitungan Item Diproses**
- Jumlah item yang diproses per karyawan
- Detail status perubahan item (dari `order_detail_status_logs`)
- Tracking order detail ID yang diproses

## 🗄️ Database Analysis

### Tabel Utama yang Terlibat:

#### 1. **Users** (Karyawan)
```sql
- id, name, email, phone, address
- branch_id (relasi ke cabang)
- status (active/inactive)
- role (employee/admin)
- salary, salary_date
```

#### 2. **Absents** (Absensi)
```sql
- employee_id (relasi ke users)
- branch_id (relasi ke branches)
- date, clock_in, clock_out
- status, work_duration
- photo_clock_in
```

#### 3. **Deliveries** (Pengiriman)
```sql
- users_id (relasi ke users)
- quantity, date
- total_distance, total_cost
- odo_start, odo_end
- odo_start_photo_url, odo_end_photo_url
```

#### 4. **OrderDetails** (Detail Pesanan)
```sql
- employee_id (relasi ke users)
- item_id, treatment_id
- status, process_time
- due_date, delivery_date
```

#### 5. **OrderDetailStatusLogs** (Log Status Item)
```sql
- order_detail_id (relasi ke order_details)
- updated_by (relasi ke users)
- old_status, new_status
- created_at
```

## 📊 Perhitungan yang Dibutuhkan

### 1. **Waktu Kerja**
```javascript
// Durasi kerja per hari
work_duration = clock_out - clock_in

// Total jam kerja per periode
total_hours = SUM(work_duration) per periode

// Presentase kehadiran
attendance_rate = (days_present / total_working_days) * 100
```

### 2. **Ongkir Delivery**
```javascript
// Total jarak per hari
daily_distance = SUM(total_distance) per user per date

// Total ongkir per hari
daily_cost = SUM(total_cost) per user per date

// Total ongkir per periode
period_cost = SUM(total_cost) per user per periode
```

### 3. **Item Diproses**
```javascript
// Jumlah item diproses per karyawan
items_processed = COUNT(order_detail_id) per employee per periode

// Detail item yang diproses
item_details = [
  {
    order_detail_id: 123,
    item_name: "Sepatu Nike",
    treatment: "Cuci + Reparasi",
    status_changes: [
      { from: "pending", to: "processing", updated_by: "employee_id" },
      { from: "processing", to: "completed", updated_by: "employee_id" }
    ]
  }
]
```

## 🎨 Frontend Requirements

### 1. **Halaman List Karyawan**
```
┌─────────────────────────────────────┐
│ 📋 Daftar Karyawan Aktif            │
├─────────────────────────────────────┤
│ 🔍 Filter: [Cabang] [Status] [Cari] │
├─────────────────────────────────────┤
│ 👤 Nama Karyawan | Cabang | Status  │
│ 👤 John Doe      | Cabang A | Aktif │
│ 👤 Jane Smith    | Cabang B | Aktif │
└─────────────────────────────────────┘
```

### 2. **Halaman Detail Karyawan**
```
┌─────────────────────────────────────┐
│ 👤 Detail Karyawan: John Doe        │
├─────────────────────────────────────┤
│ 📅 Filter Periode: [Harian/Mingguan/Bulanan] │
│ 📅 Tanggal: [Date Picker]           │
├─────────────────────────────────────┤
│ 📊 Ringkasan:                       │
│ • Total Jam Kerja: 160 jam          │
│ • Kehadiran: 85%                    │
│ • Total Ongkir: Rp 500.000          │
│ • Item Diproses: 45 item            │
├─────────────────────────────────────┤
│ 📈 Grafik Performa                  │
│ [Chart: Jam Kerja per Hari]         │
│ [Chart: Item Diproses per Hari]     │
├─────────────────────────────────────┤
│ 📋 Detail Item Diproses:            │
│ • Order #123 - Sepatu Nike - Selesai│
│ • Order #124 - Tas Gucci - Proses   │
└─────────────────────────────────────┘
```

## 🔧 API Endpoints yang Dibutuhkan

### 1. **GET /api/employees**
- List semua karyawan aktif
- Filter: branch_id, status, search

### 2. **GET /api/employees/:id/summary**
- Ringkasan performa karyawan
- Query params: start_date, end_date, period_type

### 3. **GET /api/employees/:id/attendance**
- Data absensi karyawan
- Query params: start_date, end_date

### 4. **GET /api/employees/:id/deliveries**
- Data delivery karyawan
- Query params: start_date, end_date

### 5. **GET /api/employees/:id/processed-items**
- Data item yang diproses
- Query params: start_date, end_date

### 6. **GET /api/employees/:id/performance-chart**
- Data untuk grafik performa
- Query params: start_date, end_date, chart_type

## 📱 Komponen Frontend

### 1. **EmployeeList.js**
- Tabel list karyawan
- Filter dan search
- Pagination

### 2. **EmployeeDetail.js**
- Detail informasi karyawan
- Filter periode
- Ringkasan performa

### 3. **PerformanceChart.js**
- Grafik jam kerja
- Grafik item diproses
- Grafik ongkir

### 4. **ProcessedItemsList.js**
- List item yang diproses
- Detail status perubahan
- Filter berdasarkan status

## 🚀 Implementasi Priority

### Phase 1: Backend API
1. ✅ Analisis database relations
2. 🔄 Buat controller untuk employee performance
3. 🔄 Buat service untuk perhitungan
4. 🔄 Buat repository untuk query data
5. 🔄 Buat routes untuk API endpoints

### Phase 2: Frontend Components
1. 🔄 Buat halaman list karyawan
2. 🔄 Buat halaman detail karyawan
3. 🔄 Buat komponen grafik performa
4. 🔄 Buat komponen list item diproses

### Phase 3: Testing & Optimization
1. 🔄 Unit testing untuk perhitungan
2. 🔄 Integration testing untuk API
3. 🔄 Performance optimization
4. 🔄 UI/UX improvements

## 📝 Notes
- Sistem ini fokus pada tracking performa karyawan
- Data delivery hanya untuk perhitungan ongkir
- OrderDetailStatusLog untuk tracking item yang diproses
- Absensi untuk perhitungan waktu kerja dan kehadiran
- Bisa diintegrasikan dengan sistem payroll nantinya
