// Template data untuk Quick Setup berdasarkan analisis database
export const quickSetupTemplates = [
  {
    id: 'basic-shoe-cleaning',
    name: 'Template Cuci Sepatu Dasar',
    description: 'Layanan cuci sepatu standar dengan harga kompetitif',
    icon: '🧽',
    color: 'blue',
    services: [
      { 
        name: 'Shoes - Deep Clean', 
        price: 40000, 
        type_item: 'Shoes', 
        type_service: 'Deep Clean', 
        description: 'Mencuci keseluruhan bagian sepatu' 
      },
      { 
        name: 'Shoes - Outside Clean', 
        price: 30000, 
        type_item: 'Shoes', 
        type_service: 'Outside Clean', 
        description: 'Mencuci luar bagian sepatu' 
      },
      { 
        name: 'Shoes (Small) - Deep Clean', 
        price: 30000, 
        type_item: 'Shoes (Small)', 
        type_service: 'Deep Clean', 
        description: 'Mencuci keselurahan bagian sepatu kecil maksimal ukuran 35' 
      },
      { 
        name: 'Shoes (Small) - Outside Clean', 
        price: 25000, 
        type_item: 'Shoes (Small)', 
        type_service: 'Outside Clean', 
        description: 'Mencuci Bagian luar sepatu kecil maksimal ukuran 35' 
      }
    ],
    discounts: [
      { name: 'Normal Price', type: 'nominal', discount: 0 },
      { name: 'Discount 10%', type: 'percent', discount: 10 },
      { name: 'Discount 20%', type: 'percent', discount: 20 }
    ],
    items: [
      { name: 'Air Force 1', brand: 'Nike', type: 'Sneakers', color: 'Putih', material: 'Leather' },
      { name: 'Converse', brand: 'Converse', type: 'Sneakers', color: 'Putih, Hitam', material: 'Canvas' },
      { name: 'Ultraboost', brand: 'Adidas', type: 'Sport', color: 'Putih', material: 'Mesh' }
    ]
  },
  {
    id: 'shoe-repair',
    name: 'Template Reparasi Sepatu',
    description: 'Layanan perbaikan sepatu dengan berbagai tingkat kerusakan',
    icon: '🔧',
    color: 'orange',
    services: [
      { 
        name: 'Shoes - Reglue Minor (<10%)', 
        price: 15000, 
        type_item: 'Shoes', 
        type_service: 'Reglue Minor (<10%)', 
        description: 'Pengeleman Sepatu Minor (<10%) Kerusakan' 
      },
      { 
        name: 'Shoes - Reglue (15%-25%)', 
        price: 25000, 
        type_item: 'Shoes', 
        type_service: 'Reglue (15%-25%)', 
        description: 'Reglue Sepatu kerusakan (15%-25%)' 
      },
      { 
        name: 'Shoes - Reglue (25%-50%)', 
        price: 30000, 
        type_item: 'Shoes', 
        type_service: 'Reglue (25%-50%)', 
        description: 'Reglue Sepatu dengan kerusakan 25% - 50%' 
      },
      { 
        name: 'Shoes - Reglue (50%-75%)', 
        price: 35000, 
        type_item: 'Shoes', 
        type_service: 'Reglue (50%-75%)', 
        description: 'Reglue Sepatu dengan kerusakan 50%-75%' 
      },
      { 
        name: 'Shoes - Reglue (75%-100%)', 
        price: 40000, 
        type_item: 'Shoes', 
        type_service: 'Reglue (75%-100%)', 
        description: 'Reglue Sepatu dengan kerusakan 75%-100%' 
      }
    ],
    discounts: [
      { name: 'Normal Price', type: 'nominal', discount: 0 },
      { name: 'Discount 10%', type: 'percent', discount: 10 },
      { name: 'Discount 30%', type: 'percent', discount: 30 }
    ],
    items: [
      { name: 'Nike', brand: 'Nike', type: 'Casual', color: 'Putih', material: 'Leather' },
      { name: 'New Balance', brand: 'New Balance', type: 'Running', color: 'Abu - abu', material: 'Mesh, Suede' }
    ]
  },
  {
    id: 'comprehensive-shoe',
    name: 'Template Lengkap Sepatu',
    description: 'Semua layanan sepatu: cuci, reparasi, dan repaint',
    icon: '👟',
    color: 'purple',
    services: [
      // Cleaning Services
      { 
        name: 'Shoes - Deep Clean', 
        price: 40000, 
        type_item: 'Shoes', 
        type_service: 'Deep Clean', 
        description: 'Mencuci keseluruhan bagian sepatu' 
      },
      { 
        name: 'Shoes - Outside Clean', 
        price: 30000, 
        type_item: 'Shoes', 
        type_service: 'Outside Clean', 
        description: 'Mencuci luar bagian sepatu' 
      },
      // Repair Services
      { 
        name: 'Shoes - Reglue Minor (<10%)', 
        price: 15000, 
        type_item: 'Shoes', 
        type_service: 'Reglue Minor (<10%)', 
        description: 'Pengeleman Sepatu Minor (<10%) Kerusakan' 
      },
      { 
        name: 'Shoes - Reglue (25%-50%)', 
        price: 30000, 
        type_item: 'Shoes', 
        type_service: 'Reglue (25%-50%)', 
        description: 'Reglue Sepatu dengan kerusakan 25% - 50%' 
      },
      // Repaint Services
      { 
        name: 'Shoes - Repaint Minor', 
        price: 20000, 
        type_item: 'Shoes', 
        type_service: 'Repaint Minor', 
        description: 'Repaint minor sepatu' 
      },
      { 
        name: 'Shoes - Repaint Minor', 
        price: 30000, 
        type_item: 'Shoes', 
        type_service: 'Repaint Minor', 
        description: 'Repaint minor sepatu' 
      }
    ],
    discounts: [
      { name: 'Normal Price', type: 'nominal', discount: 0 },
      { name: 'Discount 10%', type: 'percent', discount: 10 },
      { name: 'Discount 20%', type: 'percent', discount: 20 },
      { name: 'Discount 30%', type: 'percent', discount: 30 },
      { name: 'Discount 50%', type: 'percent', discount: 50 }
    ],
    items: [
      { name: 'Air Force 1', brand: 'Nike', type: 'Sneakers', color: 'Putih', material: 'Leather' },
      { name: 'Converse', brand: 'Converse', type: 'Sneakers', color: 'Putih', material: 'Canvas' },
      { name: 'Ultraboost', brand: 'Adidas', type: 'Sport', color: 'Putih', material: 'Mesh' },
      { name: 'New Balance', brand: 'New Balance', type: 'Running', color: 'Abu - abu', material: 'Mesh, Suede' },
      { name: 'PG 4', brand: 'Nike', type: 'Sport', color: 'Putih, Hitam', material: 'Mesh' }
    ]
  },
  {
    id: 'bag-services',
    name: 'Template Layanan Tas',
    description: 'Layanan cuci dan perbaikan tas berbagai ukuran',
    icon: '👜',
    color: 'green',
    services: [
      { 
        name: 'Bag (Small) - Deep Clean', 
        price: 25000, 
        type_item: 'Bag (Small)', 
        type_service: 'Deep Clean', 
        description: 'Cuci dalam tas kecil' 
      },
      { 
        name: 'Bag (Medium) - Deep Clean', 
        price: 35000, 
        type_item: 'Bag (Medium)', 
        type_service: 'Deep Clean', 
        description: 'Cuci dalam tas sedang' 
      },
      { 
        name: 'Bag (Large) - Deep Clean', 
        price: 45000, 
        type_item: 'Bag (Large)', 
        type_service: 'Deep Clean', 
        description: 'Cuci dalam tas besar' 
      }
    ],
    discounts: [
      { name: 'Normal Price', type: 'nominal', discount: 0 },
      { name: 'Discount 15%', type: 'percent', discount: 15 },
      { name: 'Discount 25%', type: 'percent', discount: 25 }
    ],
    items: [
      { name: 'Tas Wanita', brand: 'Unknown', type: 'Tas Wanita', color: 'Hitam', material: 'Leather' },
      { name: 'Tas Gunung Carrier', brand: 'Unknown', type: 'Tas Gunung Carrier', color: 'Hitam', material: 'Canvas' },
      { name: 'Tote Bag', brand: 'Unknown', type: 'Tote Bag', color: 'Putih', material: 'Canvas' }
    ]
  },
  {
    id: 'luggage-services',
    name: 'Template Layanan Koper',
    description: 'Layanan cuci dan perbaikan koper berbagai ukuran',
    icon: '🧳',
    color: 'indigo',
    services: [
      { 
        name: 'Koper (Small) - Deep Clean', 
        price: 30000, 
        type_item: 'Koper (Small)', 
        type_service: 'Deep Clean', 
        description: 'Cuci dalam koper kecil' 
      },
      { 
        name: 'Koper (Medium) - Deep Clean', 
        price: 40000, 
        type_item: 'Koper (Medium)', 
        type_service: 'Deep Clean', 
        description: 'Cuci dalam koper sedang' 
      },
      { 
        name: 'Koper (Large) - Deep Clean', 
        price: 50000, 
        type_item: 'Koper (Large)', 
        type_service: 'Deep Clean', 
        description: 'Cuci dalam koper besar' 
      }
    ],
    discounts: [
      { name: 'Normal Price', type: 'nominal', discount: 0 },
      { name: 'Discount 20%', type: 'percent', discount: 20 },
      { name: 'Discount Tahun 2024', type: 'percent', discount: 24 }
    ],
    items: [
      { name: 'Medium Koper', brand: 'Unknown', type: 'Medium Koper', color: 'Hitam', material: 'Synthetic Leather' },
      { name: 'Small Koper', brand: 'Unknown', type: 'Small Koper', color: 'Biru', material: 'Synthetic Leather' }
    ]
  }
];

// Helper functions untuk template
export const getTemplateById = (id) => {
  return quickSetupTemplates.find(template => template.id === id);
};

export const getTemplatesByCategory = (category) => {
  return quickSetupTemplates.filter(template => 
    template.services.some(service => service.type_item.includes(category))
  );
};

export const getTemplateStats = () => {
  return quickSetupTemplates.map(template => ({
    id: template.id,
    name: template.name,
    totalItems: template.services.length + template.discounts.length + template.items.length,
    services: template.services.length,
    discounts: template.discounts.length,
    items: template.items.length
  }));
};
