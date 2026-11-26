// Thermal Printer Service - Dynamic Configuration
import { generateInvoiceContent } from './thermalPrinterInvoiceTemplate';
import { PrintChecklist } from './thermalPrinterChecklistTemplate';
import { PrintKitchenTickets } from './thermalPrinterKitchenTicketTemplate';
import { imageToEscPos, textBlockToDataUrl, generateQRCodeImage } from '../utils/printerImageHelper';
import { printInvoice80mmBitmap, printAllTags80mmBitmap } from './thermalPrinterInvoice80mmBitmapService';
import instance from '../config/api';

const DEVICE_ID_KEY = 'thermalPrinterDeviceId';

// Service UUID printer thermal yang umum. Dipakai saat pairing supaya
// characteristic-nya bisa diakses tanpa perlu daftar ke server dulu.
const COMMON_PRINTER_SERVICES = [
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // RPP02 & sejenis
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip / ISSC
  '000018f0-0000-1000-8000-00805f9b34fb', // Printer generik
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10
  '0000ffe1-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb',
  '0000180a-0000-1000-8000-00805f9b34fb', // Device Information
  '0000180f-0000-1000-8000-00805f9b34fb'  // Battery
];

class ThermalPrinterService {
  constructor() {
    this.connectedDevice = null;
    this.printerConfigs = this.loadPrinterConfigs();
    this.currentConfig = null;
  }

  // Load printer configurations from localStorage
  loadPrinterConfigs() {
    const configs = localStorage.getItem('thermalPrinterConfigs');
    return configs ? JSON.parse(configs) : {
      'RPP02': {
        name: 'RPP02',
        serviceUUID: 'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        characteristicUUID: 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
        paperWidth: 58, // mm
        encoding: 'CP437'
      },
      'default': {
        name: 'RPP02',
        serviceUUID: 'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        characteristicUUID: 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
        paperWidth: 58,
        encoding: 'CP437'
      }
    };
  }

  // Save printer configurations
  savePrinterConfigs() {
    localStorage.setItem('thermalPrinterConfigs', JSON.stringify(this.printerConfigs));
  }

  // Add new printer configuration
  addPrinterConfig(name, serviceUUID, characteristicUUID, paperWidth = 58) {
    // Ensure paperWidth is valid (minimum 32mm, maximum 80mm)
    const validPaperWidth = Math.max(32, Math.min(80, paperWidth || 58));
    
    this.printerConfigs[name] = {
      name,
      serviceUUID,
      characteristicUUID,
      paperWidth: validPaperWidth,
      encoding: 'CP437'
    };
    this.savePrinterConfigs();
  }

  // Get available printer configurations
  getAvailablePrinters() {
    return Object.keys(this.printerConfigs);
  }

  // Set current printer configuration
  setCurrentPrinter(printer) {
    // Handle both string (legacy) and object (from API) formats
    if (typeof printer === 'string') {
      // Legacy format - printer name string
      this.currentConfig = this.printerConfigs[printer];
      localStorage.setItem('currentThermalPrinter', printer);
    } else if (printer && typeof printer === 'object') {
      // New format - printer object from API
      this.currentConfig = {
        name: printer.name || printer.device_name || 'Unknown Printer',
        serviceUUID: printer.service_uuid || 'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        characteristicUUID: printer.characteristic_uuid || 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
        paperWidth: printer.paper_width || 58,
        encoding: printer.encoding || 'CP437',
        deviceName: printer.device_name,
        deviceId: printer.device_id || printer.deviceId || null,
        status: printer.status,
        isDefault: printer.is_default
      };
      localStorage.setItem('currentThermalPrinter', JSON.stringify(this.currentConfig));
      if (this.currentConfig.deviceId) this.saveDeviceId(this.currentConfig.deviceId);
    } else {
      console.error('Invalid printer format:', printer);
      // Fallback to default
      this.currentConfig = this.printerConfigs['default'];
    }
  }

  // Get current printer configuration
  getCurrentPrinter() {
    if (!this.currentConfig) {
      const savedPrinter = localStorage.getItem('currentThermalPrinter');
      if (savedPrinter) {
        try {
          // Try to parse as JSON (new format)
          const parsed = JSON.parse(savedPrinter);
          if (parsed && typeof parsed === 'object' && parsed.name) {
            this.currentConfig = parsed;
          } else {
            // Fallback to legacy format
            this.currentConfig = this.printerConfigs[savedPrinter] || this.printerConfigs['default'];
          }
        } catch (e) {
          // Fallback to legacy format
          this.currentConfig = this.printerConfigs[savedPrinter] || this.printerConfigs['default'];
        }
      } else {
        this.currentConfig = this.printerConfigs['default'];
      }
    }
    return this.currentConfig;
  }

  // ---- Printer Bluetooth tanpa perlu daftar ke server ----
  // Device yang sudah pernah diizinkan disimpan id-nya di localStorage, lalu
  // di-reconnect lewat navigator.bluetooth.getDevices() (tanpa chooser).

  isBluetoothSupported() {
    return typeof navigator !== 'undefined' && Boolean(navigator.bluetooth);
  }

  getSavedDeviceId() {
    return localStorage.getItem(DEVICE_ID_KEY);
  }

  saveDeviceId(deviceId) {
    if (deviceId) localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  clearSavedDeviceId() {
    localStorage.removeItem(DEVICE_ID_KEY);
  }

  // Config printer yang tersimpan di browser saja (tanpa data dari server).
  getLocalPrinter() {
    const saved = localStorage.getItem('currentThermalPrinter');
    if (!saved) return null;

    let config = null;
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') config = parsed;
    } catch (error) {
      // Format lama: hanya nama printer
      config = this.printerConfigs[saved] || null;
    }
    if (!config?.name) return null;

    return {
      id: `local-${config.name}`,
      device_id: config.deviceId || this.getSavedDeviceId() || null,
      device_name: config.name,
      service_uuid: config.serviceUUID,
      characteristic_uuid: config.characteristicUUID,
      paper_width: config.paperWidth || 58,
      status: 'active',
      is_default: true,
      source: 'local'
    };
  }

  async requestPrinterDevice({ deviceName = null } = {}) {
    if (!this.isBluetoothSupported()) {
      throw new Error('Browser ini tidak mendukung Web Bluetooth. Gunakan Chrome atau Edge.');
    }

    const config = this.getCurrentPrinter() || {};
    const optionalServices = Array.from(new Set([
      ...COMMON_PRINTER_SERVICES,
      ...(config.serviceUUID ? [config.serviceUUID] : [])
    ]));

    const options = deviceName
      ? { filters: [{ name: deviceName }], optionalServices }
      : { acceptAllDevices: true, optionalServices };

    return navigator.bluetooth.requestDevice(options);
  }

  // Cari service + characteristic yang bisa ditulis (write / writeWithoutResponse)
  async resolvePrinterCharacteristic(server, config = {}) {
    const candidates = [];
    if (config.serviceUUID) {
      candidates.push({ serviceUuid: config.serviceUUID, characteristicUuid: config.characteristicUUID });
    }
    COMMON_PRINTER_SERVICES.forEach((uuid) => {
      if (uuid !== config.serviceUUID) candidates.push({ serviceUuid: uuid });
    });

    for (const candidate of candidates) {
      try {
        const service = await server.getPrimaryService(candidate.serviceUuid);
        let characteristic = null;
        if (candidate.characteristicUuid) {
          try {
            characteristic = await service.getCharacteristic(candidate.characteristicUuid);
          } catch (error) {
            characteristic = null;
          }
        }
        if (!characteristic) {
          const chars = await service.getCharacteristics();
          characteristic = chars.find((c) => c.properties.write || c.properties.writeWithoutResponse) || null;
        }
        if (characteristic) {
          return { service, characteristic, serviceUUID: candidate.serviceUuid, characteristicUUID: characteristic.uuid };
        }
      } catch (error) {
        // Service tidak ada di perangkat ini, lanjut ke kandidat berikutnya
      }
    }

    // Terakhir: telusuri semua service yang boleh diakses halaman ini
    try {
      const services = await server.getPrimaryServices();
      for (const service of services) {
        const chars = await service.getCharacteristics();
        const characteristic = chars.find((c) => c.properties.write || c.properties.writeWithoutResponse);
        if (characteristic) {
          return { service, characteristic, serviceUUID: service.uuid, characteristicUUID: characteristic.uuid };
        }
      }
    } catch (error) {
      // abaikan, lempar error di bawah
    }

    throw new Error('Tidak menemukan service printer yang bisa ditulis pada perangkat ini.');
  }

  async connectToDevice(device, config = {}) {
    const server = device.gatt.connected ? device.gatt : await device.gatt.connect();
    const resolved = await this.resolvePrinterCharacteristic(server, config);
    this.connectedDevice = {
      device,
      server,
      service: resolved.service,
      characteristic: resolved.characteristic
    };
    return resolved;
  }

  // Simpan konfigurasi hasil koneksi ke localStorage supaya print berikutnya
  // tidak perlu memilih perangkat lagi.
  rememberConnection(device, resolved, fallback = {}) {
    const name = device.name || fallback.name || 'Printer';
    const paperWidth = fallback.paperWidth || fallback.paper_width || 58;

    this.addPrinterConfig(name, resolved.serviceUUID, resolved.characteristicUUID, paperWidth);
    this.currentConfig = {
      name,
      serviceUUID: resolved.serviceUUID,
      characteristicUUID: resolved.characteristicUUID,
      paperWidth,
      encoding: fallback.encoding || 'CP437',
      deviceName: name,
      deviceId: device.id,
      status: 'active',
      isDefault: true
    };
    localStorage.setItem('currentThermalPrinter', JSON.stringify(this.currentConfig));
    this.saveDeviceId(device.id);

    return this.getLocalPrinter();
  }

  // Dipakai tombol "Hubungkan / Ganti Printer": selalu membuka chooser browser.
  async pairPrinter() {
    const currentConfig = this.getCurrentPrinter() || {};
    const device = await this.requestPrinterDevice();
    const resolved = await this.connectToDevice(device, currentConfig);
    return this.rememberConnection(device, resolved, currentConfig);
  }

  // Auto-detect available Bluetooth devices
  async discoverPrinters() {
    return this.requestPrinterDevice();
  }

  // Connect ke printer. Default: coba senyap pakai device yang sudah diizinkan,
  // baru buka chooser kalau gagal / belum pernah pairing.
  async connectToPrinter({ silent = true, forcePrompt = false } = {}) {
    if (this.connectedDevice?.server?.connected) {
      return this.connectedDevice;
    }

    const config = this.getCurrentPrinter() || {};
    const savedDeviceId = this.getSavedDeviceId();

    if (!forcePrompt && silent && savedDeviceId && typeof navigator?.bluetooth?.getDevices === 'function') {
      try {
        const devices = await navigator.bluetooth.getDevices();
        const device = devices.find((d) => d.id === savedDeviceId);
        if (device) {
          const resolved = await this.connectToDevice(device, config);
          this.rememberConnection(device, resolved, config);
          console.log('Reconnect ke printer tersimpan berhasil:', device.name);
          return this.connectedDevice;
        }
      } catch (error) {
        console.warn('Gagal reconnect ke printer tersimpan, membuka pemilihan printer:', error);
        this.connectedDevice = null;
      }
    }

    if (!this.isBluetoothSupported()) {
      throw new Error('Browser ini tidak mendukung Web Bluetooth. Gunakan Chrome atau Edge.');
    }

    const device = await this.requestPrinterDevice({ deviceName: savedDeviceId ? config.name : null });
    const resolved = await this.connectToDevice(device, config);
    this.rememberConnection(device, resolved, config);
    console.log('Terhubung ke printer:', device.name);
    return this.connectedDevice;
  }

  // Send data to printer in chunks
  async sendChunkedData(encoder, characteristic, data, chunkSize = 200) {
    const bytes = encoder.encode(data);
    
    console.log(`📄 Sending data: ${bytes.length} bytes in chunks of ${chunkSize}`);
    
    // Validate data size
    if (bytes.length === 0) {
      throw new Error('Data is empty');
    }
    
    if (bytes.length > 10000) { // Reasonable limit for thermal printer
      throw new Error('Data too large for thermal printer');
    }
    
    // Validate chunk size
    if (chunkSize > 512) {
      throw new Error(`Chunk size ${chunkSize} exceeds 512 bytes limit`);
    }
    
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      const chunkNumber = Math.floor(i / chunkSize) + 1;
      
      // Validate chunk size
      if (chunk.length > 512) {
        throw new Error(`Chunk size ${chunk.length} exceeds 512 bytes limit`);
      }
      
      console.log(`📄 Sending chunk ${chunkNumber}: ${chunk.length} bytes (${i}-${i + chunk.length - 1})`);
      
      // Log chunk content for debugging
      const chunkText = new TextDecoder().decode(chunk);
      console.log(`📄 Chunk ${chunkNumber} content:`, chunkText);
      
      await characteristic.writeValue(chunk);
      await new Promise(resolve => setTimeout(resolve, 100)); // Increased delay between chunks
      
      console.log(`✅ Chunk ${chunkNumber} sent successfully`);
    }
    
    console.log(`✅ Data sent successfully: ${bytes.length} bytes`);
    
    // Add paper feed command to ensure all data is printed
    console.log('📄 Sending paper feed command...');
    await characteristic.writeValue(encoder.encode('\n\n\n'));
    await new Promise(resolve => setTimeout(resolve, 200)); // Wait for paper feed
    
    console.log('✅ Paper feed command sent');
  }

  // Generate invoice content
  generateInvoiceContent(orderData) {
    const config = this.getCurrentPrinter();
    const paperWidth = config.paperWidth;
    const maxChars = Math.floor(paperWidth / 8); // Approximate characters per line

    const centerText = (text) => {
      const padding = Math.max(0, Math.floor((maxChars - text.length) / 2));
      return ' '.repeat(padding) + text;
    };

    const formatLine = (left, right = '') => {
      const leftPart = left.padEnd(maxChars - right.length);
      return leftPart + right;
    };

    let content = '';

    // Header
    content += centerText('NotaSepatu') + '\n';
    content += centerText('Shoe Care & Laundry') + '\n';
    content += '='.repeat(maxChars) + '\n';

    // Order Info
    content += formatLine('Order ID:', `#${orderData.id}`) + '\n';
    content += formatLine('Date:', new Date().toLocaleDateString('id-ID')) + '\n';
    content += formatLine('Time:', new Date().toLocaleTimeString('id-ID')) + '\n';
    content += '-'.repeat(maxChars) + '\n';

    // Customer Info
    content += 'CUSTOMER:\n';
    content += formatLine('Name:', orderData.customer?.name || '') + '\n';
    content += formatLine('Phone:', orderData.customer?.phone || '') + '\n';
    if (orderData.customer?.address) {
      content += formatLine('Address:', orderData.customer.address) + '\n';
    }
    content += '-'.repeat(maxChars) + '\n';

    // Order Details
    content += 'SERVICES:\n';
    orderData.order_details?.forEach((item, index) => {
      const treatment = item.treatment || item;
      const qty = item.qty || 1;
      const price = treatment.price || 0;
      const total = price * qty;

      content += formatLine(`${treatment.name}`, `x${qty}`) + '\n';
      content += formatLine('', `@${price.toLocaleString()}`) + '\n';
      content += formatLine('', `=${total.toLocaleString()}`) + '\n';

      if (item.process_time && item.process_time !== 'regular') {
        content += formatLine(`  ${item.process_time}`, `+${item.process_time_cost?.toLocaleString() || 0}`) + '\n';
      }

      if (item.discount && item.discount.value > 0) {
        const discountText = item.discount.type === 'percent'
          ? `-${item.discount.value}%`
          : `-${item.discount.value.toLocaleString()}`;
        content += formatLine('  Discount:', discountText) + '\n';
      }
    });

    content += '='.repeat(maxChars) + '\n';

    // Payment Summary
    const total = orderData.total || 0;
    const paid = orderData.payment?.payment_details?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
    const change = paid - total;

    content += formatLine('TOTAL:', total.toLocaleString()) + '\n';
    content += formatLine('PAID:', paid.toLocaleString()) + '\n';
    if (change > 0) {
      content += formatLine('CHANGE:', change.toLocaleString()) + '\n';
    }
    content += formatLine('STATUS:', orderData.isDP ? 'DP' : 'LUNAS') + '\n';

    // Payment Methods
    if (orderData.payment?.payment_details?.length > 0) {
      content += '-'.repeat(maxChars) + '\n';
      content += 'PAYMENT METHODS:\n';
      orderData.payment.payment_details.forEach(payment => {
        if (payment.method && payment.amount > 0) {
          content += formatLine(payment.method.toUpperCase(), payment.amount.toLocaleString()) + '\n';
        }
      });
    }

    // Footer
    content += '='.repeat(maxChars) + '\n';
    content += centerText('Thank You!') + '\n';
    content += centerText('Please Come Again') + '\n';
    content += '\n\n\n'; // Feed paper

    return content;
  }

  // Generate checklist content
  // generateChecklistContent(orderData) {
  //   const config = this.getCurrentPrinter();
  //   const paperWidth = config.paperWidth;
  //   const maxChars = Math.floor(paperWidth / 8); // Approximate characters per line

  //   const centerText = (text) => {
  //     const padding = Math.max(0, Math.floor((maxChars - text.length) / 2));
  //     return ' '.repeat(padding) + text;
  //   };

  //   const formatLine = (left, right = '') => {
  //     const leftPart = left.padEnd(maxChars - right.length);
  //     return leftPart + right;
  //   };

  //   let content = '';

  //   // Header
  //   content += centerText('KATSIKAT') + '\n';
  //   content += centerText('ITEM CHECKLIST') + '\n';
  //   content += '='.repeat(maxChars) + '\n';

  //   // Order Info
  //   content += formatLine('Order ID:', `#${orderData.id}`) + '\n';
  //   content += formatLine('Date:', new Date().toLocaleDateString('id-ID')) + '\n';
  //   content += formatLine('Customer:', orderData.customer?.name || '') + '\n';
  //   content += formatLine('Phone:', orderData.customer?.phone || '') + '\n';
  //   content += '-'.repeat(maxChars) + '\n';

  //   // Generate checklist per item
  //   let checklistNumber = 1;

  //   orderData.order_details?.forEach((group, groupIdx) => {
  //     const treatment = group.treatment || group;

  //     if (group.items && group.items.length > 0) {
  //       group.items.forEach((item, itemIdx) => {
  //         // Header untuk setiap checklist item
  //         content += `CHECKLIST #${checklistNumber}\n`;
  //         content += '-'.repeat(maxChars) + '\n';

  //         // Item details
  //         content += formatLine('Item:', item.name) + '\n';
  //         content += formatLine('Brand:', item.brand || '-') + '\n';
  //         content += formatLine('Color:', item.color || '-') + '\n';
  //         content += formatLine('Treatment:', treatment.name) + '\n';
  //         content += formatLine('Process:', group.process_time || 'regular') + '\n';

  //         // Due date
  //         const dueDate = group.due_date ? new Date(group.due_date).toLocaleDateString('id-ID') : 'Not set';
  //         content += formatLine('Due Date:', dueDate) + '\n';

  //         // Customer info
  //         content += formatLine('Customer:', orderData.customer?.name || '') + '\n';
  //         content += formatLine('Phone:', orderData.customer?.phone || '') + '\n';

  //         // Notes and parfum
  //         if (item.notes) {
  //           content += formatLine('Notes:', item.notes) + '\n';
  //         }
  //         if (item.parfum) {
  //           content += formatLine('Parfum:', item.parfum) + '\n';
  //         }

  //         // Checkboxes for process steps
  //         content += '-'.repeat(maxChars) + '\n';
  //         content += 'PROCESS STEPS:\n';
  //         content += '□ Received & Checked\n';
  //         content += '□ Treatment Started\n';
  //         content += '□ Treatment Completed\n';
  //         content += '□ Quality Check\n';
  //         content += '□ Ready for Pickup\n';
  //         content += '□ Picked Up\n';

  //         // Signature line
  //         content += '-'.repeat(maxChars) + '\n';
  //         content += 'Technician: ________________\n';
  //         content += 'Date: ________________\n';

  //         // Separator between items
  //         if (checklistNumber < this.getTotalItems(orderData)) {
  //           content += '\n\n';
  //           content += '='.repeat(maxChars) + '\n';
  //           content += '\n';
  //         }

  //         checklistNumber++;
  //       });
  //     } else {
  //       // Jika group tidak punya items, buat checklist kosong
  //       content += `CHECKLIST #${checklistNumber}\n`;
  //       content += '-'.repeat(maxChars) + '\n';
  //       content += formatLine('Treatment:', treatment.name) + '\n';
  //       content += formatLine('Process:', group.process_time || 'regular') + '\n';
  //       content += formatLine('Due Date:', group.due_date ? new Date(group.due_date).toLocaleDateString('id-ID') : 'Not set') + '\n';
  //       content += formatLine('Customer:', orderData.customer?.name || '') + '\n';
  //       content += '□ No items added yet\n';
  //       content += '-'.repeat(maxChars) + '\n';
  //       content += 'Technician: ________________\n';
  //       content += 'Date: ________________\n';

  //       if (checklistNumber < this.getTotalItems(orderData)) {
  //         content += '\n\n';
  //         content += '='.repeat(maxChars) + '\n';
  //         content += '\n';
  //       }

  //       checklistNumber++;
  //     }
  //   });

  //   // Footer
  //   content += '\n\n';
  //   content += '='.repeat(maxChars) + '\n';
  //   content += centerText('Internal Use Only') + '\n';
  //   content += centerText(`Total Items: ${this.getTotalItems(orderData)}`) + '\n';
  //   content += '\n\n\n'; // Feed paper

  //   return content;
  // }

  // Helper function to count total items
  getTotalItems(orderData) {
    let total = 0;
    orderData.order_details?.forEach(group => {
      if (group.items && group.items.length > 0) {
        total += group.items.length;
      } else {
        total += 1; // Count group even if no items
      }
    });
    return total;
  }

  // Print invoice
  async printInvoice(orderData, tenantInfo = null, branchInfo = null, printerSettings = null, earnRate = 1000, bonusPoints = { firstOrder: 0, referral: 0 }, isFirstOrder = false, pointsEnabled = false) {
    try {
      console.log('Starting printInvoice with orderData:', orderData);
      console.log('Tenant info:', tenantInfo);
      console.log('Branch info:', branchInfo);
      console.log('Printer settings:', printerSettings);
      console.log('Earn rate:', earnRate);
      console.log('Bonus points:', bonusPoints);
      console.log('Points enabled:', pointsEnabled);
      
      // Generate invoice content with tenant, branch info, printer settings, earn rate, bonus points, isFirstOrder, and pointsEnabled
      let content = generateInvoiceContent(orderData, tenantInfo, branchInfo, printerSettings, earnRate, bonusPoints, isFirstOrder, pointsEnabled);
      console.log('Generated invoice content length:', content.length);
      
      // Get current printer config
      const config = this.getCurrentPrinter();
      console.log('Current printer config for invoice:', config);
      
      if (!config || !config.name) {
        throw new Error('Printer configuration is invalid or missing. Please select a printer first.');
      }
      
      // Connect to printer if not already connected
      if (!this.connectedDevice) {
        console.log('Connecting to printer for invoice...');
        await this.connectToPrinter();
      }
      
      const { characteristic } = this.connectedDevice;
      const encoder = new TextEncoder();
      
      // Reset printer dan set alignment ke LEFT (bukan center)
      await characteristic.writeValue(new Uint8Array([0x1B, 0x40])); // ESC @ (Initialize)
      await characteristic.writeValue(new Uint8Array([0x1B, 0x61, 0x00])); // ESC a 0 (Left align)
      
      // Print Logo jika aktif (SEBELUM content text)
      // Note: Tenant business name dengan box design sudah di-handle oleh generateHeaderInvoice di template
      if (printerSettings?.show_logo && printerSettings?.logo_url) {
        try {
          // Build full logo URL (handle relative/absolute paths)
          // Konsisten dengan cara di InvoiceContentPreview
          let logoUrl = printerSettings.logo_url;
          if (!logoUrl.startsWith('http')) {
            // Jika relative path, gunakan base URL dari instance (API base URL)
            logoUrl = `${instance.defaults.baseURL}/${logoUrl}`;
          }
          
          console.log('🖼️ Printing logo:', logoUrl);
          // Logo size: maxWidth 384px (full width untuk 58mm paper), maxHeight 200px
          await this.printLogo(logoUrl, 384, 200);
          console.log('✅ Logo printed successfully!');
        } catch (logoError) {
          console.warn('⚠️ Failed to print logo, continuing with text only:', logoError);
          // Regenerate content dengan text header (seolah show_logo=false)
          // karena bitmap logo gagal cetak, text header harus diaktifkan sebagai fallback
          const modifiedSettings = { ...printerSettings, show_logo: false };
          content = generateInvoiceContent(orderData, tenantInfo, branchInfo, modifiedSettings, earnRate, bonusPoints, isFirstOrder, pointsEnabled);
          console.log('✅ Content regenerated with text header fallback, length:', content.length);
          // Continue printing even if logo fails
        }
      }
      
      // Reset alignment ke LEFT untuk content text (setelah logo)
      // Tenant business name dengan box design sudah di-include di content dari generateHeaderInvoice
      await characteristic.writeValue(new Uint8Array([0x1B, 0x61, 0x00])); // ESC a 0 (Left align)
      
      // Send content in chunks (SEBELUM QR code)
      console.log('Sending invoice content to printer...');
      await this.sendChunkedData(encoder, characteristic, content);
      
      // Print QR Code jika aktif (SETELAH semua content dan footer lainnya)
      // QR Code otomatis dari Invoice Digital URL di orderData
      if (printerSettings?.show_qr_code) {
        const qrCodeUrl = orderData?.invoiceUrl || orderData?.invoice_url;
        
        if (qrCodeUrl) {
          console.log('📱 Printing QR Code (Invoice Digital) as bitmap:', qrCodeUrl);
          
          const encoder = new TextEncoder();
          
          // Spacing minimal: separator + line feed sebelum QR Code
          await characteristic.writeValue(encoder.encode('Scan untuk lihat invoice digital'));
          
          // Center align untuk QR code
          await characteristic.writeValue(new Uint8Array([0x1B, 0x61, 0x01])); // ESC a 1 (Center align)
          
          // Line feed sebelum QR Code bitmap untuk spacing minimal
          await characteristic.writeValue(new Uint8Array([0x0A])); // Line feed
          
          // QR Code size: 160px = ~20ch untuk 58mm paper (8px per char)
          await this.printQRCodeAsBitmap(qrCodeUrl, 160, 160);
          // Return to left align
          await characteristic.writeValue(new Uint8Array([0x1B, 0x61, 0x00])); // ESC a 0 (Left align)
        } else {
          console.warn('⚠️ QR Code diaktifkan tapi invoiceUrl tidak ditemukan di orderData');
        }
      }
      
      
      // Cut paper command (optional)
      // await characteristic.writeValue(encoder.encode('\x1D\x56\x41\x10'));
      
      console.log('Invoice printed successfully!');
      return true;
    } catch (error) {
      console.error('Print invoice error:', error);
      this.connectedDevice = null; // Reset connection on error
      throw error;
    }
  }

  // Print checklist
  async printChecklist(orderData) {
    try {
      console.log('Starting printChecklist with orderData:', orderData);
      
      // Get current printer config
      const config = this.getCurrentPrinter();
      console.log('Current printer config for checklist:', config);
      
      if (!config || !config.name) {
        throw new Error('Printer configuration is invalid or missing. Please select a printer first.');
      }

      // Connect to printer if not already connected
      if (!this.connectedDevice) {
        console.log('Connecting to printer for checklist...');
        await this.connectToPrinter();
      }
      
      // Pass characteristic dari service ke PrintChecklist untuk reuse connection (fix double pairing)
      const existingCharacteristic = this.connectedDevice?.characteristic || null;
      
      // Panggil PrintChecklist dari template baru dengan printer config dan existing characteristic
      const result = await PrintChecklist(orderData, config, existingCharacteristic);
      
      // Cek apakah print berhasil atau tidak
      if (result === false || result === null || result === undefined) {
        throw new Error('Print checklist cancelled or failed');
      }
      
      console.log('Checklist printed successfully!');
      return true;
    } catch (error) {
      console.error('Print checklist error:', error);
      this.connectedDevice = null; // Reset connection on error
      throw error;
    }
  }

  // Print kitchen ticket per dapur produksi (pola sama seperti tag item)
  async printKitchenTickets(payload) {
    try {
      console.log('Starting printKitchenTickets:', payload);

      const config = this.getCurrentPrinter();
      if (!config || !config.name) {
        throw new Error('Printer configuration is invalid or missing. Please select a printer first.');
      }

      if (!this.connectedDevice) {
        await this.connectToPrinter();
      }

      const existingCharacteristic = this.connectedDevice?.characteristic || null;
      const result = await PrintKitchenTickets(payload, config, existingCharacteristic);

      if (result === false || result === null || result === undefined) {
        throw new Error('Print kitchen ticket cancelled or failed');
      }

      return true;
    } catch (error) {
      console.error('Print kitchen ticket error:', error);
      this.connectedDevice = null;
      throw error;
    }
  }

  // Print invoice 80mm using bitmap mode (all content as bitmap)
  async printInvoice80mm(orderData, tenantInfo = null, branchInfo = null, printerSettings = null, earnRate = 1000, bonusPoints = { firstOrder: 0, referral: 0 }, isFirstOrder = false, pointsEnabled = false) {
    try {
      console.log('Starting printInvoice80mm with bitmap mode...');
      
      // Get current printer config
      const config = this.getCurrentPrinter();
      const paperWidth = config?.paperWidth || 80;
      
      // Temporarily set paper width to 80mm for this print
      const originalPaperWidth = config.paperWidth;
      config.paperWidth = 80;
      
      try {
        // Pass earnRate, bonusPoints, isFirstOrder, and pointsEnabled to orderData for printInvoice80mmBitmap
        const orderDataWithEarnRate = {
          ...orderData,
          earn_rate: earnRate,
          bonus_points: bonusPoints,
          is_first_order: isFirstOrder,
          points_enabled: pointsEnabled
        };
        // Call bitmap service
        const result = await printInvoice80mmBitmap(
          orderDataWithEarnRate,
          tenantInfo,
          branchInfo,
          printerSettings,
          this, // Pass thermalPrinterService instance
          paperWidth
        );
        
        return result;
      } finally {
        // Restore original paper width
        config.paperWidth = originalPaperWidth;
      }
    } catch (error) {
      console.error('Print invoice 80mm error:', error);
      this.connectedDevice = null; // Reset connection on error
      throw error;
    }
  }

  // Print all tags 80mm using bitmap mode (all content as bitmap)
  async printAllTags80mm(orderData) {
    try {
      console.log('Starting printAllTags80mm with bitmap mode...');
      
      // Get current printer config
      const config = this.getCurrentPrinter();
      const paperWidth = config?.paperWidth || 80;
      
      // Temporarily set paper width to 80mm for this print
      const originalPaperWidth = config.paperWidth;
      config.paperWidth = 80;
      
      try {
        // Call bitmap service
        const result = await printAllTags80mmBitmap(
          orderData,
          this, // Pass thermalPrinterService instance
          paperWidth
        );
        
        return result;
      } finally {
        // Restore original paper width
        config.paperWidth = originalPaperWidth;
      }
    } catch (error) {
      console.error('Print all tags 80mm error:', error);
      this.connectedDevice = null; // Reset connection on error
      throw error;
    }
  }

  // Generate test print content
  generateTestPrintContent() {
    const config = this.getCurrentPrinter();
    const paperWidth = config.paperWidth || 58; // Default to 58mm if not set
    const maxChars = Math.max(32, Math.floor(paperWidth / 8)); // Minimum 32 chars, approximate characters per line

    const centerText = (text) => {
      const padding = Math.max(0, Math.floor((maxChars - text.length) / 2));
      return ' '.repeat(padding) + text;
    };

    const formatLine = (left, right = '') => {
      const availableSpace = Math.max(10, maxChars - right.length); // Ensure minimum space
      const leftPart = left.padEnd(availableSpace);
      return leftPart + right;
    };

    let content = '';

    // Header
    content += centerText('NotaSepatu') + '\n';
    content += centerText('PRINTER TEST') + '\n';
    content += '='.repeat(maxChars) + '\n';

    // Test Info
    content += formatLine('Test Date:', new Date().toLocaleDateString('id-ID')) + '\n';
    content += formatLine('Test Time:', new Date().toLocaleTimeString('id-ID')) + '\n';
    content += formatLine('Printer:', config.name) + '\n';
    content += formatLine('Paper Width:', `${paperWidth}mm`) + '\n';
    content += formatLine('Encoding:', config.encoding) + '\n';
    content += '-'.repeat(maxChars) + '\n';

    // Test Content
    content += 'TEST CONTENT:\n';
    content += 'This is a test print to verify\n';
    content += 'printer functionality.\n\n';
    
    content += 'Character Test:\n';
    content += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ\n';
    content += 'abcdefghijklmnopqrstuvwxyz\n';
    content += '0123456789\n';
    content += '!@#$%^&*()_+-=[]{}|;:,.<>?\n\n';

    content += 'Line Test:\n';
    for (let i = 1; i <= 5; i++) {
      const lineLength = Math.max(10, maxChars - 10); // Ensure minimum line length
      content += `Line ${i}: ${'='.repeat(lineLength)}` + '\n';
    }

    content += '\n';
    content += 'Status: PRINTER WORKING\n';
    content += 'Connection: SUCCESSFUL\n';

    // Footer
    content += '='.repeat(maxChars) + '\n';
    content += centerText('Test Completed') + '\n';
    content += centerText('Printer is Ready!') + '\n';
    content += '\n\n\n'; // Feed paper

    return content;
  }

  // Test print function
  async testPrint(printToPrinter = false, logoUrl = null) {
    try {
      const config = this.getCurrentPrinter();
      console.log('Printer config for test:', config);
      
      const content = this.generateTestPrintContent();
      
      // Always log to console for debugging
      console.log('=== TEST PRINT THERMAL PRINTER ===\n' + content);
      
      if (printToPrinter) {
        // Print to actual printer
        if (!this.connectedDevice) {
          await this.connectToPrinter();
        }
        const { characteristic } = this.connectedDevice;
        const encoder = new TextEncoder();
        
        // Print logo first if provided
        if (logoUrl) {
          try {
            console.log('🖼️ Printing logo:', logoUrl);
            await this.printLogo(logoUrl, 256, 128);
            console.log('✅ Logo printed successfully!');
          } catch (logoError) {
            console.warn('⚠️ Failed to print logo, continuing with text only:', logoError);
          }
        }
        
        // Print text content
        await this.sendChunkedData(encoder, characteristic, content);
        console.log('✅ Test print sent to printer successfully!');
        return true;
      } else {
        // Console only mode
        console.log('📄 Test print content generated (console only)');
        if (logoUrl) {
          console.log('🖼️ Logo URL provided:', logoUrl);
        }
        return true;
      }
    } catch (error) {
      console.error('Test print error:', error);
      this.connectedDevice = null; // Reset connection on error
      throw error;
    }
  }

  // Test print to console only (for debugging)
  async testPrintConsole() {
    return await this.testPrint(false);
  }

  // Helper function to send content in chunks to avoid 512 bytes limit
  async sendContentInChunks(content, characteristic, chunkSize = 100) {
    const encoder = new TextEncoder();
    const contentBytes = encoder.encode(content);
    
    console.log(`📄 Sending content: ${contentBytes.length} bytes in chunks of ${chunkSize}`);
    
    // Validate content size
    if (contentBytes.length === 0) {
      throw new Error('Content is empty');
    }
    
    if (contentBytes.length > 10000) { // Reasonable limit for thermal printer
      throw new Error('Content too large for thermal printer');
    }
    
    // Send in chunks
    for (let i = 0; i < contentBytes.length; i += chunkSize) {
      const chunk = contentBytes.slice(i, i + chunkSize);
      
      // Validate chunk size
      if (chunk.length > 512) {
        throw new Error(`Chunk size ${chunk.length} exceeds 512 bytes limit`);
      }
      
      await characteristic.writeValue(chunk);
      await new Promise(resolve => setTimeout(resolve, 50)); // Delay optimized for mobile Bluetooth
      
      if (i % (chunkSize * 5) === 0) { // Log every 5 chunks
        console.log(`📄 Sent ${i + chunk.length}/${contentBytes.length} bytes`);
      }
    }
    
    console.log(`✅ Content sent successfully: ${contentBytes.length} bytes`);
  }

  // Test print to actual printer
  async testPrintToPrinter(printerData = null) {
    try {
      if (!this.connectedDevice) {
        await this.connectToPrinter();
      }
      
      const { characteristic } = this.connectedDevice;
      const encoder = new TextEncoder();
      
      // Initialize printer
      await characteristic.writeValue(encoder.encode('\x1B\x40')); // ESC @
      await new Promise(resolve => setTimeout(resolve, 150)); // Wait for printer initialization
      
      // Set alignment to center
      await characteristic.writeValue(encoder.encode('\x1B\x61\x01')); // ESC a 1
      await new Promise(resolve => setTimeout(resolve, 50)); // Wait for command processing
      
      // Get current printer config
      const config = this.getCurrentPrinter();
      const paperWidth = config.paperWidth || 58;
      const maxChars = Math.max(32, Math.floor(paperWidth / 8));
      
      // Helper functions
      const centerText = (text) => {
        const padding = Math.max(0, Math.floor((maxChars - text.length) / 2));
        return ' '.repeat(padding) + text;
      };
      
      const formatLine = (left, right = '') => {
        const availableSpace = Math.max(10, maxChars - right.length);
        const leftPart = left.padEnd(availableSpace);
        return leftPart + right;
      };
      
      // Simple test content with tenant and branch info
      let content = '';
      
      // Header
      content += centerText(printerData.tenant.business_name) + '\n';
      content += '='.repeat(maxChars) + '\n\n';
      
      // Test print info
      content += centerText('TEST PRINT') + '\n';
      content += centerText('Printer berfungsi dengan baik!') + '\n\n';
      
      // Tenant and branch info
      if (printerData) {
        content += '-'.repeat(maxChars) + '\n';
        content += 'PRINTER INFO:\n';
        
        if (printerData.tenant) {
          content += formatLine('Tenant:', printerData.tenant.business_name || 'N/A') + '\n';
          // content += formatLine('Alamat:', printerData.tenant.address || 'N/A') + '\n';
          // content += formatLine('Kota:', printerData.tenant.city || 'N/A') + '\n';
        }
        
        if (printerData.branch) {
          content += formatLine('Cabang:', printerData.branch.name || 'N/A') + '\n';
          content += formatLine('Alamat Cabang:', printerData.branch.address || 'N/A') + '\n';
        }
        
        content += formatLine('Printer:', printerData.name || 'N/A') + '\n';
        content += formatLine('Device:', printerData.device_name || 'N/A') + '\n';
        
        content += '-'.repeat(maxChars) + '\n';
      }
      
      // Footer
      content += centerText('Terima kasih!') + '\n';
      content += '='.repeat(maxChars) + '\n\n\n';
      
      // Send content to printer using helper function
      await this.sendContentInChunks(content, characteristic);
      
      console.log('✅ Test print sent to printer successfully!');
      return true;
    } catch (error) {
      console.error('Error testing print to printer:', error);
      throw error;
    }
  }





  // Generate invoice content (simplified)
  async generateInvoiceContent(orderData) {
    const config = this.getCurrentPrinter();
    const paperWidth = config.paperWidth || 58;
    const maxChars = Math.max(32, Math.floor(paperWidth / 8));

    const centerText = (text) => {
      const padding = Math.max(0, Math.floor((maxChars - text.length) / 2));
      return ' '.repeat(padding) + text;
    };

    const formatLine = (left, right = '') => {
      const availableSpace = Math.max(10, maxChars - right.length);
      const leftPart = left.padEnd(availableSpace);
      return leftPart + right;
    };

    let content = '';


    // Header text
    content += centerText('NotaSepatu') + '\n';
    content += centerText('Shoe Care & Laundry') + '\n';
    content += '='.repeat(maxChars) + '\n';

    // Order Info
    content += formatLine('Order ID:', `#${orderData.id}`) + '\n';
    content += formatLine('Date:', new Date().toLocaleDateString('id-ID')) + '\n';
    content += formatLine('Time:', new Date().toLocaleTimeString('id-ID')) + '\n';
    content += '-'.repeat(maxChars) + '\n';

    // Customer Info
    content += 'CUSTOMER:\n';
    content += formatLine('Name:', orderData.customer?.name || '') + '\n';
    content += formatLine('Phone:', orderData.customer?.phone || '') + '\n';
    if (orderData.customer?.address) {
      content += formatLine('Address:', orderData.customer.address) + '\n';
    }
    content += '-'.repeat(maxChars) + '\n';

    // Order Details
    content += 'SERVICES:\n';
    orderData.order_details?.forEach((item, index) => {
      const treatment = item.treatment || item;
      const qty = item.qty || 1;
      const price = treatment.price || 0;
      const total = price * qty;

      content += formatLine(`${treatment.name}`, `x${qty}`) + '\n';
      content += formatLine('', `@${price.toLocaleString()}`) + '\n';
      content += formatLine('', `=${total.toLocaleString()}`) + '\n';

      if (item.process_time && item.process_time !== 'regular') {
        content += formatLine(`  ${item.process_time}`, `+${item.process_time_cost?.toLocaleString() || 0}`) + '\n';
      }

      if (item.discount && item.discount.value > 0) {
        const discountText = item.discount.type === 'percent'
          ? `-${item.discount.value}%`
          : `-${item.discount.value.toLocaleString()}`;
        content += formatLine('  Discount:', discountText) + '\n';
      }
    });

    content += '='.repeat(maxChars) + '\n';

    // Payment Summary
    const total = orderData.total || 0;
    const paid = orderData.payment?.payment_details?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
    const change = paid - total;

    content += formatLine('TOTAL:', total.toLocaleString()) + '\n';
    content += formatLine('PAID:', paid.toLocaleString()) + '\n';
    if (change > 0) {
      content += formatLine('CHANGE:', change.toLocaleString()) + '\n';
    }
    content += formatLine('STATUS:', orderData.isDP ? 'DP' : 'LUNAS') + '\n';

    // Payment Methods
    if (orderData.payment?.payment_details?.length > 0) {
      content += '-'.repeat(maxChars) + '\n';
      content += 'PAYMENT METHODS:\n';
      orderData.payment.payment_details.forEach(payment => {
        if (payment.method && payment.amount > 0) {
          content += formatLine(payment.method.toUpperCase(), payment.amount.toLocaleString()) + '\n';
        }
      });
    }

    // Footer
    content += '='.repeat(maxChars) + '\n';
    content += centerText('Thank You!') + '\n';
    content += centerText('Please Come Again') + '\n';
    content += '\n\n\n'; // Feed paper

    return content;
  }

  // Helper function untuk center align text (dipakai di printInvoice)
  centerAlignText(text, width = 32) {
    if (!text) return '';
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  // Print QR Code as Bitmap (REUSABLE FUNCTION)
  // Generate QR Code image → Convert to bitmap → Print
  async printQRCodeAsBitmap(data, qrSize = 160, maxWidth = 160) {
    try {
      console.log('📱 Generating QR Code image from:', data);
      
      // Step 1: Generate QR Code image
      const qrCodeImageUrl = await generateQRCodeImage(data, qrSize);
      
      // Step 2: Convert QR Code image to ESC/POS bitmap (same as logo)
      const bitmapCommand = await imageToEscPos(qrCodeImageUrl, maxWidth, qrSize, {
        threshold: 128, // Binary threshold for QR Code (black/white)
        dither: false,  // No dithering for QR Code (clean black/white)
        invert: false,
      });
      
      // Step 3: Connect if not connected
      if (!this.connectedDevice) {
        await this.connectToPrinter();
      }
      
      const { characteristic } = this.connectedDevice;
      
      // Step 4: Send bitmap command in chunks (same as logo)
      console.log('📤 Sending QR Code bitmap to printer...');
      const chunkSize = 128; // BLE MTU conservative size
      
      for (let i = 0; i < bitmapCommand.length; i += chunkSize) {
        const chunk = bitmapCommand.slice(i, i + chunkSize);
        await characteristic.writeValue(chunk);
        await new Promise(resolve => setTimeout(resolve, 20));
        console.log(`📤 Sent ${i + chunk.length}/${bitmapCommand.length} bytes`);
      }
      
      // Tidak perlu line feed di sini karena separator sudah ada newline
      // Dan text "Scan..." akan ditambahkan setelahnya dengan spacing yang sesuai
      
      console.log('✅ QR Code (bitmap) printed successfully!');
      return true;
    } catch (error) {
      console.error('❌ Print QR Code (bitmap) error:', error);
      throw error;
    }
  }

  // Print QR Code using ESC/POS native commands (NO LIBRARY NEEDED)
  // GS ( k [function] [pL] [pH] [cn] [fn] [data] [print]
  async printQRCode(data, size = 6) {
    try {
      if (!this.connectedDevice) {
        await this.connectToPrinter();
      }
      
      const { characteristic } = this.connectedDevice;
      
      // ESC/POS QR Code Commands (GS ( k)
      // Function 49 (0x31): Store QR Code data
      // Function 50 (0x32): Print QR Code
      // Model: 1 = Model 2 (most common)
      // Size: 1-16 (6 = default, good balance)
      // Error correction: 48 = L (Low), 49 = M, 50 = Q, 51 = H
      
      const qrSize = Math.max(1, Math.min(16, size)); // 1-16
      const dataBytes = new TextEncoder().encode(data);
      
      // Step 1: Store QR Code data (Function 49)
      // GS ( k [pL] [pH] [cn] [fn] [m] [size] [error] [data]
      const pL1 = dataBytes.length + 3; // data + 3 params (m, size, error)
      const pH1 = (pL1 >> 8) & 0xFF;
      const storeCommand = new Uint8Array([
        0x1D, 0x28, 0x6B,           // GS ( k
        pL1 & 0xFF,                 // pL (low byte)
        pH1,                        // pH (high byte)
        0x01,                        // cn = 1
        0x31,                        // fn = 49 (Store)
        0x31,                        // m = 1 (Model 2)
        qrSize,                      // size
        0x30,                        // error = 0x30 = 48 = L (Low) - FIXED!
        ...dataBytes                 // data
      ]);
      
      // Step 2: Print QR Code (Function 50)
      // GS ( k [03] [00] [01] [50] [30]
      const printCommand = new Uint8Array([
        0x1D, 0x28, 0x6B,           // GS ( k
        0x03, 0x00,                 // pL=3, pH=0
        0x01,                        // cn = 1
        0x50,                        // fn = 50 (Print)
        0x30                         // m = 0
      ]);
      
      // Send commands
      await characteristic.writeValue(storeCommand);
      await characteristic.writeValue(printCommand);
      await characteristic.writeValue(new Uint8Array([0x0A])); // Line feed
      
      console.log('✅ QR Code printed successfully!');
      return true;
    } catch (error) {
      console.error('❌ Print QR Code error:', error);
      throw error;
    }
  }

  // Print Logo (Image to ESC/POS Bitmap)
  async printLogo(logoUrl, maxWidth = 384, maxHeight = 200) {
    try {
      console.log('🖼️ Converting image to ESC/POS bitmap...');
      
      // Convert image to ESC/POS command
      const bitmapCommand = await imageToEscPos(logoUrl, maxWidth, maxHeight, {
        threshold: 135, // darker, more detail
        dither: true,   // preserve gradients
        invert: false,
      });
      
      // Connect if not connected
      if (!this.connectedDevice) {
        await this.connectToPrinter();
      }
      
      const { characteristic } = this.connectedDevice;
      
      // Send bitmap command in chunks (max 512 bytes per chunk)
      console.log('📤 Sending bitmap to printer...');
      // BLE MTU is often ~185 bytes, use conservative 128
      const chunkSize = 128;
      
      for (let i = 0; i < bitmapCommand.length; i += chunkSize) {
        const chunk = bitmapCommand.slice(i, i + chunkSize);
        await characteristic.writeValue(chunk);
        await new Promise(resolve => setTimeout(resolve, 20));
        console.log(`📤 Sent ${i + chunk.length}/${bitmapCommand.length} bytes`);
      }
      
      // No extra feed - bitmap command sudah include line feed
      // Invoice akan langsung follow setelah logo
      
      console.log('✅ Logo printed successfully!');
      return true;
    } catch (error) {
      console.error('❌ Print logo error:', error);
      throw error;
    }
  }

  // Print styled text using ESC/POS (plain/ascii text)
  async printText(text, options = {}) {
    const {
      align = 'center', // 'left' | 'center' | 'right'
      bold = false,
      doubleWidth = false,
      doubleHeight = false,
      feed = 2,
    } = options;

    try {
      if (!this.connectedDevice) {
        await this.connectToPrinter();
      }

      const { characteristic } = this.connectedDevice;
      const encoder = new TextEncoder();

      // Init
      await characteristic.writeValue(new Uint8Array([0x1B, 0x40])); // ESC @

      // Align
      const alignMap = { left: 0, center: 1, right: 2 };
      await characteristic.writeValue(new Uint8Array([0x1B, 0x61, alignMap[align] ?? 1]));

      // Bold
      await characteristic.writeValue(new Uint8Array([0x1B, 0x45, bold ? 1 : 0])); // ESC E n

      // Size (ESC ! n)
      let mode = 0x00;
      if (doubleWidth) mode |= 0x20;  // bit 5
      if (doubleHeight) mode |= 0x10; // bit 4
      await characteristic.writeValue(new Uint8Array([0x1B, 0x21, mode]));

      // Write text
      const payload = encoder.encode(text + "\n");
      const chunkSize = 128;
      for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        await characteristic.writeValue(chunk);
        await new Promise(r => setTimeout(r, 10));
      }

      if (feed > 0) {
        await characteristic.writeValue(encoder.encode("\n".repeat(feed)));
      }

      return true;
    } catch (error) {
      console.error('❌ Print text error:', error);
      throw error;
    }
  }

  // Print ASCII header as bitmap (rendered via canvas to full width)
  async printAsciiHeaderBitmap(figletText, opts = {}) {
    try {
      // 1) Render figlet text to canvas data URL at full width
      const dataUrl = textBlockToDataUrl(figletText, {
        maxWidth: 384,
        baseFontSize: 12,
        lineGap: 2,
        fontFamily: 'monospace',
        background: '#FFFFFF',
        color: '#000000',
        scaleToWidth: true,
      });

      // 2) Convert to ESC/POS bitmap
      const bitmapCommand = await imageToEscPos(dataUrl, 384, 240, {
        threshold: 135,
        dither: true,
        invert: false,
      });

      // 3) Ensure connection
      if (!this.connectedDevice) {
        await this.connectToPrinter();
      }

      const { characteristic } = this.connectedDevice;
      const chunkSize = 128;
      for (let i = 0; i < bitmapCommand.length; i += chunkSize) {
        const chunk = bitmapCommand.slice(i, i + chunkSize);
        await characteristic.writeValue(chunk);
        await new Promise(r => setTimeout(r, 15));
      }

      const encoder = new TextEncoder();
      await characteristic.writeValue(encoder.encode('\n'));
      return true;
    } catch (error) {
      console.error('❌ Print ASCII header bitmap error:', error);
      throw error;
    }
  }

  // Disconnect from printer
  async disconnect() {
    if (this.connectedDevice?.server) {
      await this.connectedDevice.server.disconnect();
      this.connectedDevice = null;
    }
  }
}

// Export singleton instance
export const thermalPrinterService = new ThermalPrinterService();

// Legacy function for backward compatibility
export const PrintInvoice = async (orderData) => {
  return await thermalPrinterService.printInvoice(orderData);
}; 