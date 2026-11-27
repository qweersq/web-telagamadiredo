/**
 * Thermal Printer Invoice 80mm Bitmap Service
 * Handle print invoice and tags in 80mm paper using bitmap mode (all content as bitmap)
 */

import { generateInvoiceContent } from './thermalPrinterInvoiceTemplate';
import { generateInvoiceContent80mm } from './thermalPrinterInvoiceTemplate80mm';
import { generateChecklistItem } from './thermalPrinterChecklistTemplate';
import { imageToEscPos, textBlockToDataUrl, generateQRCodeImage } from '../utils/printerImageHelper';
import instance from '../config/api';

/**
 * Helper: Center align text for 80mm paper (48 chars width)
 * NOTE: Not used anymore - all text should be LEFT aligned
 */
function centerAlign80mm(text) {
  if (!text) return '';
  const width = 48; // 80mm paper width
  const textLength = text.length;
  const padding = Math.max(0, Math.floor((width - textLength) / 2));
  return ' '.repeat(padding) + text;
}

/**
 * Post-process invoice content to fix alignment for 80mm paper
 * ALL TEXT MUST BE LEFT ALIGNED (no center, no right)
 * - LEFT align for: Nama, Alamat, No.Inv, Tgl, Nama Layanan, *** TERIMA KASIH ***, INFORMASI PENTING, etc
 * @param {string} content - Invoice content from template (32 chars width)
 * @returns {string} - Fixed content for 80mm paper (48 chars width) - ALL LEFT ALIGNED
 */
function fixAlignmentFor80mm(content) {
  if (!content) return '';
  
  const lines = content.split('\n');
  const fixedLines = [];
  let isInAddressSection = false;
  let isInLayananSection = false;
  let isInFooterSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Track if we're in address section (for wrapped lines)
    if (trimmed.startsWith('Alamat :') || trimmed.startsWith('Alamat:')) {
      isInAddressSection = true;
      fixedLines.push(trimmed); // LEFT align - remove leading spaces
      continue;
    }
    
    // Track if we're in layanan section
    if (trimmed.match(/^[^:]+x\d+$/) || trimmed.match(/^[^:]+ x\d+$/)) {
      isInLayananSection = true;
      fixedLines.push(trimmed); // LEFT align - remove leading spaces
      continue;
    }
    
    // Track footer section (after TERIMA KASIH)
    if (trimmed.includes('***') && trimmed.includes('TERIMA') && trimmed.includes('KASIH')) {
      isInFooterSection = true;
      fixedLines.push(trimmed); // LEFT align - remove leading spaces
      continue;
    }
    
    // Reset address section when we hit separators or next fields
    if (trimmed === '--------------------------------' || trimmed === '================================') {
      isInAddressSection = false;
      // Check next line to see if we're done with footer
      if (i + 1 < lines.length) {
        const nextTrimmed = lines[i + 1].trim();
        if (nextTrimmed && !nextTrimmed.match(/^-+$/) && !nextTrimmed.includes('TERIMA') && !nextTrimmed.includes('INFORMASI') && !nextTrimmed.includes('PROMO')) {
          isInFooterSection = false;
        }
      }
    }
    
    // Reset layanan section when we hit separator or payment section
    if (trimmed === '================================' || trimmed.startsWith('Sub Total') || 
        trimmed.startsWith('Bayar') || trimmed.startsWith('Sisa') || trimmed.startsWith('Status')) {
      isInLayananSection = false;
    }
    
    // Reset address section if we hit next field
    if (trimmed.startsWith('No.Inv') || trimmed.startsWith('Tgl') || trimmed.startsWith('Kasir')) {
      isInAddressSection = false;
    }
    
    // LEFT ALIGN: Nama, No.Inv, Tgl, Kasir
    if (
      trimmed.startsWith('Nama') ||
      trimmed.startsWith('No.Inv :') ||
      trimmed.startsWith('No.Inv:') ||
      trimmed.startsWith('No.Inv ') ||
      trimmed.startsWith('Tgl    :') ||
      trimmed.startsWith('Tgl:') ||
      trimmed.startsWith('Tgl ') ||
      trimmed.startsWith('Kasir  :') ||
      trimmed.startsWith('Kasir:') ||
      trimmed.startsWith('Kasir ')
    ) {
      fixedLines.push(trimmed); // LEFT align - remove leading spaces
      continue;
    }
    
    // LEFT ALIGN: Wrapped address lines (continuation of "Alamat :")
    if (isInAddressSection && trimmed && !trimmed.startsWith('Alamat') && 
        trimmed !== '' && trimmed !== '--------------------------------') {
      fixedLines.push(trimmed); // LEFT align
      // Reset address section after empty line or separator
      if (i + 1 < lines.length) {
        const nextTrimmed = lines[i + 1].trim();
        if (nextTrimmed === '' || nextTrimmed === '--------------------------------' || 
            nextTrimmed.startsWith('No.Inv') || nextTrimmed.startsWith('Tgl')) {
          isInAddressSection = false;
        }
      }
      continue;
    }
    
    // LEFT ALIGN: Layanan name lines (continuation after "Nama Layanan x1")
    if (isInLayananSection && trimmed && !trimmed.match(/^[^:]+x\d+$/) && 
        !trimmed.match(/^[^:]+ x\d+$/) && !trimmed.startsWith('Ket:') && 
        !trimmed.startsWith('Diskon') && !trimmed.startsWith('Harga') &&
        trimmed !== '--------------------------------') {
      fixedLines.push(trimmed); // LEFT align
      continue;
    }
    
    // LEFT ALIGN: Nama Layanan (treatment name x quantity)
    if (trimmed.match(/^[^:]+x\d+$/) || trimmed.match(/^[^:]+ x\d+$/)) {
      fixedLines.push(trimmed); // LEFT align
      continue;
    }
    
    // LEFT ALIGN: *** TERIMA KASIH *** (remove center alignment, make LEFT)
    const terimakasihPattern = /^\*{3}\s*TERIMA\s*KASIH\s*\*{3}$/i;
    if (terimakasihPattern.test(trimmed) || 
        (trimmed.includes('***') && trimmed.includes('TERIMA') && trimmed.includes('KASIH'))) {
      fixedLines.push('*** TERIMA KASIH ***'); // LEFT align - no padding
      continue;
    }
    
    // LEFT ALIGN: INFORMASI PENTING (remove center alignment, make LEFT)
    if (trimmed.toUpperCase() === 'INFORMASI PENTING' || 
        trimmed === 'INFORMASI PENTING') {
      fixedLines.push('INFORMASI PENTING'); // LEFT align - no padding
      continue;
    }
    
    // LEFT ALIGN: PROMO SAAT INI (remove center alignment, make LEFT)
    if (trimmed.toUpperCase() === 'PROMO SAAT INI' || 
        trimmed === 'PROMO SAAT INI') {
      fixedLines.push('PROMO SAAT INI'); // LEFT align - no padding
      continue;
    }
    
    // LEFT ALIGN: Footer content (all text after TERIMA KASIH, INFORMASI PENTING should be LEFT)
    if (isInFooterSection && trimmed && 
        !trimmed.match(/^-+$/) && 
        trimmed !== '' &&
        !trimmed.includes('***') &&
        !trimmed.includes('TERIMA') &&
        !trimmed.includes('INFORMASI') &&
        !trimmed.includes('PROMO')) {
      fixedLines.push(trimmed); // LEFT align footer content
      continue;
    }
    
    // For ALL other lines: Remove leading spaces to ensure LEFT align
    // This handles any center-aligned text from template
    if (line.startsWith(' ') && trimmed) {
      // Remove leading spaces - force LEFT align
      fixedLines.push(trimmed);
      continue;
    }
    
    // Default: keep line as is (separators, empty lines, etc)
    fixedLines.push(line);
  }
  
  return fixedLines.join('\n');
}

/**
 * Post-process tag item content to fix alignment for 80mm paper
 * - Ensure LEFT align for: Tanggal Masuk, Treatment, Tanggal Selesai, Info Item, Catatan, Teknisi
 * @param {string} content - Tag item content from template (32 chars width)
 * @returns {string} - Fixed content for 80mm paper (48 chars width)
 */
function fixTagAlignmentFor80mm(content) {
  if (!content) return '';
  
  const lines = content.split('\n');
  const fixedLines = [];
  let isInWrappedSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // LEFT ALIGN: Remove any leading spaces to ensure left align for:
    // - Tanggal Masuk
    // - Treatment
    // - Tanggal Selesai
    // - Info Item
    // - Catatan
    // - Teknisi
    // - Warna, Parfum, Nama
    // - NO. ANTRIAN
    if (
      trimmed.startsWith('NO. ANTRIAN') ||
      trimmed.startsWith('Tanggal Masuk :') ||
      trimmed.startsWith('Tanggal Masuk:') ||
      trimmed.startsWith('Treatment :') ||
      trimmed.startsWith('Treatment:') ||
      trimmed.startsWith('Tanggal Selesai :') ||
      trimmed.startsWith('Tanggal Selesai:') ||
      trimmed.startsWith('Info Item') ||
      trimmed.startsWith('Catatan :') ||
      trimmed.startsWith('Catatan:') ||
      trimmed.startsWith('Teknisi:') ||
      trimmed.startsWith('Teknisi :') ||
      trimmed.startsWith('Warna :') ||
      trimmed.startsWith('Warna:') ||
      trimmed.startsWith('Parfum :') ||
      trimmed.startsWith('Parfum:') ||
      trimmed.startsWith('Nama :') ||
      trimmed.startsWith('Nama:')
    ) {
      // Remove any leading spaces to ensure left align
      fixedLines.push(trimmed);
      
      // Mark that we're in a section that might have wrapped lines
      if (trimmed.startsWith('Treatment') || trimmed.startsWith('Catatan') || trimmed.startsWith('Info Item')) {
        isInWrappedSection = true;
      } else {
        isInWrappedSection = false;
      }
      continue;
    }
    
    // LEFT ALIGN: Wrapped lines (continuation of multi-line fields like Treatment, Catatan, Info Item)
    if (isInWrappedSection && trimmed && 
        !trimmed.includes(':') && 
        !trimmed.match(/^-+$/) && 
        trimmed !== '' &&
        !trimmed.startsWith('Tag Item') &&
        !trimmed.match(/^\d+\/\d+$/)) {
      // This is a wrapped line from Treatment/Catatan/Info Item, keep left aligned
      fixedLines.push(trimmed);
      
      // Check if we're done with wrapped section (next line is empty or new field)
      if (i + 1 < lines.length) {
        const nextTrimmed = lines[i + 1].trim();
        if (nextTrimmed === '' || nextTrimmed.match(/^-+$/) || nextTrimmed.includes(':')) {
          isInWrappedSection = false;
        }
      }
      continue;
    }
    
    // LEFT ALIGN: Content lines after "Info Item" (brand name, item name, etc) - lines without colons
    if (i > 0) {
      const prevLine = lines[i - 1].trim();
      if (prevLine === 'Info Item' && trimmed && 
          !trimmed.includes(':') && 
          !trimmed.match(/^-+$/) && 
          trimmed !== '') {
        // This is content after "Info Item", keep left aligned
        fixedLines.push(trimmed);
        continue;
      }
    }
    
    // Reset wrapped section on separators or empty lines
    if (trimmed === '' || trimmed.match(/^-+$/)) {
      isInWrappedSection = false;
    }
    
    // Default: keep line as is (separators, headers, etc)
    fixedLines.push(line);
  }
  
  return fixedLines.join('\n');
}

/**
 * Convert text content to bitmap for 80mm printer
 * @param {string} textContent - Text content to convert
 * @param {number} paperWidth - Paper width in mm (default 80)
 * @returns {Promise<Uint8Array>} - ESC/POS bitmap command
 */
export async function convertTextToBitmap(textContent, paperWidth = 80) {
  const maxWidth = paperWidth === 80 ? 640 : 384;
  const fontSize = paperWidth === 80 ? 28 : 22; // Large font for 80mm
  
  console.log('🎨 Converting text to Canvas (bitmap mode)...');
  
  // Convert text to Canvas using textBlockToDataUrl
  const dataUrl = textBlockToDataUrl(textContent, {
    maxWidth: maxWidth,
    padding: 16,
    background: '#FFFFFF',
    color: '#000000',
    fontFamily: 'monospace',
    baseFontSize: fontSize,
    lineGap: 4,
    scaleToWidth: true,
  });
  
  console.log('✅ Image data URL generated');
  
  // Convert Canvas to ESC/POS bitmap (full resolution for large text)
  const targetWidth = maxWidth; // 100% width - FULL RESOLUTION
  console.log('🖼️ Converting to ESC/POS bitmap...');
  const bitmapCommand = await imageToEscPos(dataUrl, targetWidth, 2000, {
    threshold: 130, // Better quality for large text
    dither: false,  // No dithering
    invert: false,
  });
  
  console.log('✅ Bitmap generated:', bitmapCommand.length, 'bytes');
  return bitmapCommand;
}

/**
 * Send bitmap to printer in optimized chunks (480 bytes, no delay)
 * @param {Uint8Array} bitmapCommand - ESC/POS bitmap command
 * @param {BluetoothRemoteGATTCharacteristic} characteristic - BLE characteristic
 */
export async function sendBitmapToPrinter(bitmapCommand, characteristic) {
  console.log('📤 Sending bitmap (BLE max 512 bytes per write - using 480 byte chunks)...');
  
  // BLE API has hard limit of 512 bytes per writeValue()
  // Use 480 bytes to be safe (below 512 limit)
  const chunkSize = 480; // Maximum safe chunk size (below 512 BLE limit)
  
  let chunksSent = 0;
  const totalChunks = Math.ceil(bitmapCommand.length / chunkSize);
  
  for (let i = 0; i < bitmapCommand.length; i += chunkSize) {
    const chunk = bitmapCommand.slice(i, i + chunkSize);
    await characteristic.writeValue(chunk);
    chunksSent++;
    // NO DELAY - maximum speed, printer/BLE handles it internally
    // Log progress every 10 chunks to avoid spam
    if (chunksSent % 10 === 0 || chunksSent === totalChunks) {
      console.log(`📤 Sent ${chunksSent}/${totalChunks} chunks (${i + chunk.length}/${bitmapCommand.length} bytes)`);
    }
  }
  
  console.log(`✅ Bitmap sent successfully in ${chunksSent} chunks (480 bytes each)!`);
}

/**
 * Print invoice in 80mm paper using bitmap mode (all content as bitmap)
 * Flow: Logo (bitmap) → Text (bitmap) → QR Code (bitmap)
 * @param {Object} orderData - Order data
 * @param {Object} tenantInfo - Tenant information
 * @param {Object} branchInfo - Branch information
 * @param {Object} printerSettings - Printer settings (logo, QR code, etc)
 * @param {Object} thermalPrinterService - Thermal printer service instance (for connection and logo/QR printing)
 * @param {number} paperWidth - Paper width in mm (default 80)
 * @returns {Promise<boolean>}
 */
export async function printInvoice80mmBitmap(
  orderData,
  tenantInfo,
  branchInfo,
  printerSettings,
  thermalPrinterService,
  paperWidth = 80
) {
  try {
    console.log('🖼️ Starting printInvoice80mmBitmap...');
    
    // Check Web Bluetooth API
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth API tidak tersedia. Pastikan menggunakan browser yang support (Chrome/Edge) dan koneksi HTTPS.');
    }
    
    // Get current printer config
    const config = thermalPrinterService.getCurrentPrinter();
    if (!config || !config.name) {
      throw new Error('Printer configuration is invalid or missing. Please select a printer first.');
    }
    
    // Connect to printer if not already connected
    if (!thermalPrinterService.connectedDevice) {
      console.log('Connecting to printer for invoice 80mm...');
      await thermalPrinterService.connectToPrinter();
    }
    
    const { characteristic } = thermalPrinterService.connectedDevice;
    
    // Initialize printer
    await characteristic.writeValue(new Uint8Array([0x1B, 0x40])); // ESC @ (Initialize)
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // STEP 1: Print Logo (bitmap) - if enabled
    let effectivePrinterSettings = printerSettings;
    if (printerSettings?.show_logo && printerSettings?.logo_url) {
      try {
        let logoUrl = printerSettings.logo_url;
        if (!logoUrl.startsWith('http')) {
          logoUrl = `${instance.defaults.baseURL}/${logoUrl}`;
        }
        
        console.log('🖼️ Printing logo (bitmap):', logoUrl);
        // Logo size: maxWidth 640px for 80mm paper
        await thermalPrinterService.printLogo(logoUrl, 640, 200);
        console.log('✅ Logo printed successfully!');
      } catch (logoError) {
        console.warn('⚠️ Failed to print logo, continuing with text header fallback:', logoError);
        // Fallback: gunakan text header karena bitmap logo gagal cetak
        effectivePrinterSettings = { ...printerSettings, show_logo: false };
      }
    }
    
    // STEP 2: Generate invoice content text (gunakan effectivePrinterSettings untuk fallback logo)
    // Get earn_rate, bonus_points, is_first_order, and points_enabled from orderData if available, or use default
    const earnRate = orderData?.earn_rate || 1000;
    const bonusPoints = orderData?.bonus_points || { firstOrder: 0, referral: 0 };
    const isFirstOrder = orderData?.is_first_order || false;
    const pointsEnabled = orderData?.points_enabled !== undefined ? Boolean(orderData.points_enabled) : false;
    let invoiceContent = generateInvoiceContent80mm(orderData, tenantInfo, branchInfo, effectivePrinterSettings, earnRate, bonusPoints, isFirstOrder, pointsEnabled);
    
    // STEP 2.5: Fix alignment for 80mm paper (LEFT: Alamat, No.Inv, Tgl, Nama Layanan | CENTER: TERIMA KASIH, INFORMASI PENTING, PROMO SAAT INI)
    invoiceContent = fixAlignmentFor80mm(invoiceContent);
    console.log('📄 Generated invoice content length:', invoiceContent.length, 'chars');
    
    // STEP 3: Convert invoice text to bitmap
    const textBitmap = await convertTextToBitmap(invoiceContent, paperWidth);
    
    // STEP 4: Send text bitmap to printer
    await sendBitmapToPrinter(textBitmap, characteristic);
    
    // STEP 5: Print QR Code (bitmap) - if enabled
    if (printerSettings?.show_qr_code) {
      const qrCodeUrl = orderData?.invoiceUrl || orderData?.invoice_url;
      
      if (qrCodeUrl) {
        try {
          console.log('📱 Printing QR Code (bitmap):', qrCodeUrl);
          
          // Spacing before QR Code
          const spacingText = 'Scan untuk lihat invoice digital';
          const spacingBitmap = await convertTextToBitmap(spacingText + '\n\n', paperWidth);
          await sendBitmapToPrinter(spacingBitmap, characteristic);
          
          // QR Code size: 200px for 80mm paper
          await thermalPrinterService.printQRCodeAsBitmap(qrCodeUrl, 200, 200);
          console.log('✅ QR Code printed successfully!');
        } catch (qrError) {
          console.warn('⚠️ Failed to print QR Code, continuing:', qrError);
        }
      }
    }
    
    // Paper feed
    await characteristic.writeValue(new Uint8Array([0x1B, 0x64, 0x03])); // ESC d 3
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('✅ Invoice 80mm (bitmap mode) printed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error printing invoice 80mm bitmap:', error);
    throw error;
  }
}

/**
 * Print all tags in 80mm paper using bitmap mode
 * Loop through all items and print each tag as bitmap
 * @param {Object} orderData - Order data with order_details
 * @param {Object} thermalPrinterService - Thermal printer service instance
 * @param {number} paperWidth - Paper width in mm (default 80)
 * @returns {Promise<boolean>}
 */
export async function printAllTags80mmBitmap(
  orderData,
  thermalPrinterService,
  paperWidth = 80
) {
  try {
    console.log('🖼️ Starting printAllTags80mmBitmap...');
    
    // Check Web Bluetooth API
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth API tidak tersedia. Pastikan menggunakan browser yang support (Chrome/Edge) dan koneksi HTTPS.');
    }
    
    // Get current printer config
    const config = thermalPrinterService.getCurrentPrinter();
    if (!config || !config.name) {
      throw new Error('Printer configuration is invalid or missing. Please select a printer first.');
    }
    
    // Connect to printer if not already connected
    if (!thermalPrinterService.connectedDevice) {
      console.log('Connecting to printer for tags 80mm...');
      await thermalPrinterService.connectToPrinter();
    }
    
    const { characteristic } = thermalPrinterService.connectedDevice;
    
    // Initialize printer
    await characteristic.writeValue(new Uint8Array([0x1B, 0x40])); // ESC @ (Initialize)
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Collect all items with their groups (global index)
    const allItems = [];
    let globalIndex = 0;
    
    (orderData?.order_details || []).forEach(group => {
      (group.items || []).forEach(item => {
        allItems.push({ group, item, globalIndex });
        globalIndex++;
      });
    });
    
    const totalItems = allItems.length;
    console.log(`📋 Total items to print: ${totalItems}`);
    
    if (totalItems === 0) {
      throw new Error('Tidak ada item untuk dicetak');
    }
    
    // Print each tag as bitmap
    for (let i = 0; i < allItems.length; i++) {
      const { group, item, globalIndex: itemIndex } = allItems[i];
      
      console.log(`📄 Printing tag ${i + 1}/${totalItems}...`);
      
      // Generate tag content text
      let tagContent = generateChecklistItem(
        orderData,
        group,
        item,
        itemIndex,
        totalItems
      );
      
      // Fix alignment for 80mm paper (LEFT: Tanggal Masuk, Treatment, Tanggal Selesai, Info Item, Catatan, Teknisi)
      tagContent = fixTagAlignmentFor80mm(tagContent);
      
      // Convert tag text to bitmap
      const tagBitmap = await convertTextToBitmap(tagContent, paperWidth);
      
      // Send tag bitmap to printer
      await sendBitmapToPrinter(tagBitmap, characteristic);
      
      // Paper feed between tags (except last one)
      if (i < allItems.length - 1) {
        await characteristic.writeValue(new Uint8Array([0x1B, 0x64, 0x02])); // ESC d 2 (Feed 2 lines)
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Final paper feed
    await characteristic.writeValue(new Uint8Array([0x1B, 0x64, 0x03])); // ESC d 3
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log(`✅ All ${totalItems} tags printed successfully in 80mm bitmap mode!`);
    return true;
  } catch (error) {
    console.error('❌ Error printing tags 80mm bitmap:', error);
    throw error;
  }
}

