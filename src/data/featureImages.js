// Feature Images Data
// Array of images for each feature (4 screenshots per feature)

export const featureImages = {
  // Feature 1: Item Tracking dengan Foto
  itemTracking: [
    "/images/landingpage/trackingitem1.png", // Input Item Screen
    "/images/landingpage/trackingitem2.png", // Foto Item Screen
    "/images/landingpage/trackingitem3.png", // Status Tracking Screen // QR Code Print Screen
    "/images/landingpage/trackingitem4.png", // Status Tracking Screen // QR Code Print Screen
    "/images/landingpage/trackingitem5.png", // Status Tracking Screen // QR Code Print Screen
  ],

  // Feature 2: Payment Tracking
  paymentTracking: [
    "/images/landingpage/paymenttracking1.png", // DP Payment Screen
    "/images/landingpage/paymenttracking2.png", // Pelunasan Screen
    "/images/landingpage/paymenttracking3.png", // Payment History Screen // Payment Report Screen
  ],

  // Feature 3: Multi-Branch Management
  multiBranch: [
    "/images/landingpage/multibranch1.png", // Branch List Screen
    "/images/landingpage/multibranch2.png", // Switch Branch Screen
    "/images/landingpage/multibranch3.png", // Branch Data Screen
    "/images/landingpage/multibranch4.png", // Branch Summary Screen // Branch Summary Screen
  ],

  // Feature 4: Financial Dashboard
  financialDashboard: [
    "/images/landingpage/financialdashboard1.png", // Chart View Screen
    "/images/landingpage/financialdashboard2.png", // Table View Screen
    "/images/landingpage/financialdashboard3.png", // Export Screen
    "/images/landingpage/financialdashboard4.png"  // Filter Screen
  ],

  // Feature 5: Print Tag Item
  printTagItem: [
    "/images/landingpage/printtag1.png", // Tag Design Screen
    "/images/landingpage/printtag2.png",  // Print History Screen
  ],

  // Feature 6: Customer Management
  customerManagement: [
      "/images/landingpage/customermanajemen6.png",  // Customer Analytics Screen
    "/images/landingpage/customermanajemen1.png", // Customer List Screen
    "/images/landingpage/customermanajemen2.png", // Customer Detail Screen
    "/images/landingpage/customermanajemen3.png", // Membership Screen
    "/images/landingpage/customermanajemen4.png",  // Customer Analytics Screen
    "/images/landingpage/customermanajemen5.png",  // Customer Analytics Screen
  ],

  // Feature 7: Absensi Karyawan
  absensiKaryawan: [
    "/images/landingpage/absensikaryawan1.png", // Clock In/Out Screen
    "/images/landingpage/absensikaryawan2.png", // Shift Management Screen
    "/images/landingpage/absensikaryawan3.png", // Attendance Report Screen
    "/images/landingpage/absensikaryawan4.png",  // Employee List Screen
    "/images/landingpage/absensikaryawan5.png",  // Employee List Screen
    "/images/landingpage/absensikaryawan6.png",  // Employee List Screen
    "/images/landingpage/absensikaryawan7.png",  // Employee List Screen
    "/images/landingpage/absensikaryawan8.png",  // Employee List Screen
    "/images/landingpage/absensikaryawan9.png",  // Employee List Screen
    "/images/landingpage/absensikaryawan10.png",  // Employee List Screen
  ],

  // Feature 8: Follow-up System
  followUpSystem: [
    "/images/landingpage/fumanual1.png", // Follow-up List Screen
    "/images/landingpage/fumanual2.png", // Template Message Screen
    "/images/landingpage/fumanual3.png", // Dormant Customer Screen
    "/images/landingpage/fumanual4.png"  // Follow-up History Screen
  ],

  // Feature 9: Invoice Digital
  invoiceDigital: [
    "/images/landingpage/invoicedigital1.png", // Generate Invoice Screen
    "/images/landingpage/invoicedigital2.png", // Invoice Preview Screen
    "/images/landingpage/invoicedigital3.png", // Send via WA Screen
    "/images/landingpage/invoicedigital4.png"  // Invoice History Screen
  ],

  // Feature 10: Kelola Printer Thermal
  printerThermal: [
    "/images/landingpage/printerthermal1.png", // Printer Settings Screen
    "/images/landingpage/printerthermal2.png", // Test Print Screen
    "/images/landingpage/printerthermal3.png", // Print Queue Screen
    "/images/landingpage/printerthermal4.png", // Print Queue Screen
  ],

  // Feature 11: Multi Role System
  multiRoleSystem: [
    "/images/landingpage/multirole1.png", // Role Selection Screen
    "/images/landingpage/multirole2.png", // Role Dashboard Screen
    "/images/landingpage/multirole3.png", // Role Permissions Screen
    "/images/landingpage/multirole4.png",  // Role Management Screen
    "/images/landingpage/multirole5.png",  // Role Management Screen
    "/images/landingpage/multirole6.png",  // Role Management Screen
    "/images/landingpage/multirole7.png",  // Role Management Screen
    "/images/landingpage/multirole8.png"  // Role Management Screen
  ]
};

// Helper function to get images for a specific feature
export const getFeatureImages = (featureKey) => {
  return featureImages[featureKey] || [];
};

// Helper function to get all feature keys
export const getAllFeatureKeys = () => {
  return Object.keys(featureImages);
};

// Feature descriptions for each image set
export const featureDescriptions = {
  itemTracking: "Item Tracking dengan Foto",
  paymentTracking: "Payment Tracking",
  multiBranch: "Multi-Branch Management", 
  financialDashboard: "Financial Dashboard",
  printTagItem: "Print Tag Item",
  customerManagement: "Customer Management",
  absensiKaryawan: "Absensi Karyawan",
  followUpSystem: "Follow-up System",
  invoiceDigital: "Invoice Digital",
  printerThermal: "Kelola Printer Thermal",
  multiRoleSystem: "Multi Role System"
};
