// Data struktur layanan cuci sepatu berdasarkan riset industri
export const shoeServiceCategories = [
  {
    id: 'cleaning',
    name: 'Pembersihan & Cuci',
    description: 'Layanan pembersihan dan pencucian sepatu',
    icon: '🧽',
    color: 'blue'
  },
  {
    id: 'repair',
    name: 'Reparasi & Perbaikan',
    description: 'Layanan perbaikan dan reparasi sepatu',
    icon: '🔧',
    color: 'orange'
  },
  {
    id: 'customization',
    name: 'Kustomisasi & Repaint',
    description: 'Layanan kustomisasi dan repaint sepatu',
    icon: '🎨',
    color: 'purple'
  },
  {
    id: 'protection',
    name: 'Perlindungan & Treatment',
    description: 'Layanan perlindungan dan treatment sepatu',
    icon: '🛡️',
    color: 'green'
  }
];

export const shoeServices = [
  // PEMBERSIHAN & CUCI
  {
    id: 'basic-cleaning',
    category: 'cleaning',
    name: 'Cuci Dasar',
    description: 'Pembersihan dasar sepatu dengan sabun khusus',
    basePrice: 15000,
    estimatedTime: 30, // menit
    difficulty: 'easy',
    items: [
      { name: 'Sabun Khusus Sepatu', price: 2000 },
      { name: 'Sikat Halus', price: 1000 },
      { name: 'Air Bersih', price: 500 }
    ],
    requirements: ['Sepatu dalam kondisi normal']
  },
  {
    id: 'deep-cleaning',
    category: 'cleaning',
    name: 'Cuci Dalam',
    description: 'Pembersihan mendalam termasuk bagian dalam sepatu',
    basePrice: 25000,
    estimatedTime: 45,
    difficulty: 'medium',
    items: [
      { name: 'Sabun Khusus Sepatu', price: 2000 },
      { name: 'Sikat Halus', price: 1000 },
      { name: 'Sikat Kasar', price: 1500 },
      { name: 'Air Bersih', price: 500 },
      { name: 'Deodorizer', price: 3000 }
    ],
    requirements: ['Sepatu dalam kondisi normal', 'Tidak ada kerusakan parah']
  },
  {
    id: 'premium-cleaning',
    category: 'cleaning',
    name: 'Cuci Premium',
    description: 'Pembersihan premium dengan treatment khusus',
    basePrice: 40000,
    estimatedTime: 60,
    difficulty: 'hard',
    items: [
      { name: 'Sabun Premium', price: 5000 },
      { name: 'Sikat Halus', price: 1000 },
      { name: 'Sikat Kasar', price: 1500 },
      { name: 'Air Bersih', price: 500 },
      { name: 'Deodorizer Premium', price: 5000 },
      { name: 'Conditioner', price: 3000 }
    ],
    requirements: ['Sepatu dalam kondisi baik', 'Tidak ada kerusakan parah']
  },

  // REPARASI & PERBAIKAN
  {
    id: 'sole-repair',
    category: 'repair',
    name: 'Perbaikan Sol',
    description: 'Perbaikan dan penggantian sol sepatu',
    basePrice: 50000,
    estimatedTime: 120,
    difficulty: 'hard',
    items: [
      { name: 'Sol Baru', price: 20000 },
      { name: 'Lem Khusus', price: 5000 },
      { name: 'Alat Reparasi', price: 3000 }
    ],
    requirements: ['Sol dalam kondisi rusak', 'Sepatu masih layak diperbaiki']
  },
  {
    id: 'stitching-repair',
    category: 'repair',
    name: 'Perbaikan Jahitan',
    description: 'Perbaikan jahitan yang rusak atau terlepas',
    basePrice: 30000,
    estimatedTime: 90,
    difficulty: 'medium',
    items: [
      { name: 'Benang Khusus', price: 2000 },
      { name: 'Jarum Reparasi', price: 1000 },
      { name: 'Lem Jahit', price: 3000 }
    ],
    requirements: ['Jahitan rusak atau terlepas', 'Material masih layak diperbaiki']
  },
  {
    id: 'heel-repair',
    category: 'repair',
    name: 'Perbaikan Hak',
    description: 'Perbaikan dan penggantian hak sepatu',
    basePrice: 40000,
    estimatedTime: 100,
    difficulty: 'hard',
    items: [
      { name: 'Hak Baru', price: 15000 },
      { name: 'Lem Khusus', price: 5000 },
      { name: 'Alat Reparasi', price: 3000 }
    ],
    requirements: ['Hak rusak atau aus', 'Sepatu masih layak diperbaiki']
  },

  // KUSTOMISASI & REPAINT
  {
    id: 'color-change',
    category: 'customization',
    name: 'Ganti Warna',
    description: 'Mengubah warna sepatu dengan cat khusus',
    basePrice: 80000,
    estimatedTime: 180,
    difficulty: 'hard',
    items: [
      { name: 'Cat Sepatu Premium', price: 25000 },
      { name: 'Primer', price: 10000 },
      { name: 'Clear Coat', price: 15000 },
      { name: 'Alat Cat', price: 5000 }
    ],
    requirements: ['Sepatu dalam kondisi baik', 'Material cocok untuk dicat']
  },
  {
    id: 'custom-design',
    category: 'customization',
    name: 'Desain Kustom',
    description: 'Membuat desain kustom sesuai permintaan',
    basePrice: 120000,
    estimatedTime: 240,
    difficulty: 'expert',
    items: [
      { name: 'Cat Sepatu Premium', price: 30000 },
      { name: 'Primer', price: 10000 },
      { name: 'Clear Coat', price: 15000 },
      { name: 'Alat Cat Khusus', price: 10000 },
      { name: 'Stencil Kustom', price: 20000 }
    ],
    requirements: ['Sepatu dalam kondisi baik', 'Desain sudah disetujui']
  },
  {
    id: 'logo-application',
    category: 'customization',
    name: 'Aplikasi Logo',
    description: 'Menambahkan logo atau emblem pada sepatu',
    basePrice: 60000,
    estimatedTime: 120,
    difficulty: 'medium',
    items: [
      { name: 'Logo/Emblem', price: 20000 },
      { name: 'Lem Khusus', price: 5000 },
      { name: 'Alat Aplikasi', price: 3000 }
    ],
    requirements: ['Sepatu dalam kondisi baik', 'Logo tersedia']
  },

  // PERLINDUNGAN & TREATMENT
  {
    id: 'waterproof-treatment',
    category: 'protection',
    name: 'Treatment Anti Air',
    description: 'Memberikan perlindungan anti air pada sepatu',
    basePrice: 35000,
    estimatedTime: 60,
    difficulty: 'medium',
    items: [
      { name: 'Spray Anti Air', price: 15000 },
      { name: 'Primer Anti Air', price: 8000 },
      { name: 'Alat Aplikasi', price: 2000 }
    ],
    requirements: ['Sepatu dalam kondisi baik', 'Material cocok untuk treatment']
  },
  {
    id: 'leather-conditioning',
    category: 'protection',
    name: 'Conditioning Kulit',
    description: 'Treatment khusus untuk sepatu kulit',
    basePrice: 25000,
    estimatedTime: 45,
    difficulty: 'easy',
    items: [
      { name: 'Conditioner Kulit', price: 12000 },
      { name: 'Sikat Halus', price: 1000 },
      { name: 'Kain Microfiber', price: 2000 }
    ],
    requirements: ['Sepatu berbahan kulit', 'Kondisi kulit masih baik']
  },
  {
    id: 'odor-elimination',
    category: 'protection',
    name: 'Eliminasi Bau',
    description: 'Treatment khusus untuk menghilangkan bau tidak sedap',
    basePrice: 20000,
    estimatedTime: 30,
    difficulty: 'easy',
    items: [
      { name: 'Deodorizer Premium', price: 8000 },
      { name: 'Spray Anti Bau', price: 5000 },
      { name: 'Sachet Penyerap Bau', price: 3000 }
    ],
    requirements: ['Sepatu memiliki masalah bau', 'Tidak ada kerusakan parah']
  }
];

// Data diskon berdasarkan kategori
export const discountTemplates = [
  {
    id: 'new-customer',
    name: 'Diskon Pelanggan Baru',
    description: 'Diskon untuk pelanggan baru',
    percentage: 20,
    minOrder: 50000,
    validDays: 30
  },
  {
    id: 'bulk-order',
    name: 'Diskon Pesanan Besar',
    description: 'Diskon untuk pesanan lebih dari 3 pasang',
    percentage: 15,
    minOrder: 100000,
    validDays: 7
  },
  {
    id: 'seasonal',
    name: 'Diskon Musiman',
    description: 'Diskon khusus musim tertentu',
    percentage: 25,
    minOrder: 75000,
    validDays: 14
  },
  {
    id: 'loyalty',
    name: 'Diskon Loyalitas',
    description: 'Diskon untuk pelanggan setia',
    percentage: 10,
    minOrder: 0,
    validDays: 365
  }
];

// Data item tambahan yang bisa dijual
export const additionalItems = [
  {
    id: 'shoe-box',
    name: 'Box Sepatu Premium',
    description: 'Box sepatu dengan desain premium',
    price: 15000,
    category: 'accessories'
  },
  {
    id: 'shoe-trees',
    name: 'Shoe Trees',
    description: 'Alat untuk menjaga bentuk sepatu',
    price: 25000,
    category: 'accessories'
  },
  {
    id: 'shoe-bags',
    name: 'Tas Sepatu',
    description: 'Tas khusus untuk membawa sepatu',
    price: 20000,
    category: 'accessories'
  },
  {
    id: 'cleaning-kit',
    name: 'Kit Pembersih',
    description: 'Kit lengkap untuk membersihkan sepatu sendiri',
    price: 50000,
    category: 'tools'
  },
  {
    id: 'protection-spray',
    name: 'Spray Pelindung',
    description: 'Spray untuk melindungi sepatu dari air dan kotoran',
    price: 30000,
    category: 'tools'
  }
];
