// Template Checklist Thermal Printer - Modular
import dayjs from 'dayjs';

// Fungsi untuk format deskripsi panjang dengan line breaks
export function formatLongDescription(description) {
  if (!description || description === '-') return '-';

  const maxCharsPerLine = 32; // Maksimal karakter per baris
  const words = description.split(' ');
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + (currentLine ? ' ' : '') + word;

    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Jika kata tunggal lebih panjang dari maxCharsPerLine
        lines.push(word);
        currentLine = '';
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join('\n');
}

// Dummy DisplayProcessTime jika tidak ada
export function DisplayProcessTime(processTime) {
  if (!processTime || processTime === 'regular') return 'Regular';
  if (processTime === 'next_day') return 'Next Day';
  if (processTime === 'same_day') return 'Same Day';
  return processTime;
}

export function generateChecklistItem(formikData, group, item, globalIndex, totalItems) {
  // Get custom_price_reason from group or item
  const customPriceReason = group?.custom_price_reason || item?.custom_price_reason;
  
  // Get employee name from item
  const employeeName = item?.employee?.name;

  // Nomor antrian harian (dari backend). Fallback: tidak ditampilkan kalau null.
  const tagNumber = item?.tag_number != null ? item.tag_number : null;
  
  let checklistText = `
--------------------------------
${tagNumber != null ? `NO. ANTRIAN : ${tagNumber}\n` : ''}Tag Item ke-${globalIndex + 1}/${totalItems}

Nama : ${formikData?.customer?.name}
Tanggal Masuk : ${dayjs(formikData?.entry_date).format('DD-MMM-YYYY')}

${formatLongDescription(`Treatment : ${group?.treatment?.name}`)}
${customPriceReason ? `${formatLongDescription(`Ket: ${customPriceReason}`)}\n` : ''}Tanggal Selesai : ${dayjs(group?.due_date).format('DD-MMM-YYYY')}

Info Item
${formatLongDescription(`${item?.brand || ''} ${item?.name || ''}`)}
Warna : ${formatLongDescription(item?.color || '')}
${item?.parfum ? `\nParfum : ${formatLongDescription(item.parfum)}\n` : '\n'}
Catatan : 
${formatLongDescription(item?.notes || item?.description || '')}

${employeeName ? `Pencatat Item : ${employeeName}\n` : ''}Teknisi: ____________________
`;
  return checklistText;
}

export function generateSlip(formikData, group, item, globalIndex, totalItems) {
  return `
---------quality check---------
Customer: ${formikData?.customer?.name}
Item: ${formatLongDescription(`${item?.brand || ''} - ${item?.name || ''}`)}
Treatment: ${formatLongDescription(group?.treatment?.name || '')}

Teknisi: ____________________
Status: [ ]Pass  [ ]Need Review
Tgl QC: __/__/__ Paraf: ______
--------------------------------
  `;
}

export async function PrintChecklist(formikData, printerConfig = null, existingCharacteristic = null) {
  console.log('PrintChecklist', formikData);
  console.log('Printer config:', printerConfig);
  console.log('Existing characteristic:', existingCharacteristic ? 'Provided' : 'Not provided');
  try {
    // Loop seluruh items di semua order_details, urutkan global
    const allItems = [];
    (formikData?.order_details || []).forEach(group => {
      (group.items || []).forEach(item => {
        allItems.push({ group, item });
      });
    });
    const totalItems = allItems.length;
    
    // --- Bluetooth printing logic dengan dynamic printer config ---
    const config = printerConfig || {
      name: 'RPP02',
      serviceUUID: 'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
      characteristicUUID: 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f'
    };
    
    let characteristic = existingCharacteristic;
    
    // Jika characteristic sudah ada dari service, gunakan itu (reuse connection)
    if (characteristic) {
      console.log('✅ Reusing existing Bluetooth connection');
      // Cek apakah masih connected
      try {
        // Test connection dengan read properties
        const props = characteristic.properties;
        console.log('Connection is still active');
      } catch (error) {
        console.warn('Existing connection invalid, reconnecting...');
        characteristic = null; // Force reconnect
      }
    }
    
    // Jika belum ada connection, connect baru
    if (!characteristic) {
      console.log('🔌 Connecting to printer...');
      const options = {
        filters: [{ name: config.name }],
        optionalServices: [config.serviceUUID],
      };
      
      console.log('Bluetooth options for checklist:', options);
      const device = await navigator.bluetooth.requestDevice(options);
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(config.serviceUUID);
      characteristic = await service.getCharacteristic(config.characteristicUUID);
      
      if (characteristic === null) {
        console.error('Bluetooth characteristic is null');
        return false;
      }
      console.log('✅ Successfully connected to printer');
    }
    const encoder = new TextEncoder();
    const clearData = async () => {
      await characteristic.writeValue(encoder.encode(''));
    };
    
    // Helper function untuk kirim data dalam chunks (fix untuk Android Chrome BLE MTU limit)
    const sendChunkedData = async (data, chunkSize = 50) => {
      const bytes = encoder.encode(data);
      
      console.log(`📄 Sending checklist data: ${bytes.length} bytes in chunks of ${chunkSize}`);
      
      // Split data menjadi chunks kecil untuk menghindari BLE MTU limit
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        const chunkNumber = Math.floor(i / chunkSize) + 1;
        
        console.log(`📄 Sending chunk ${chunkNumber}: ${chunk.length} bytes (${i}-${i + chunk.length - 1})`);
        
        await characteristic.writeValue(chunk);
        
        // Delay antar chunks untuk memastikan printer bisa process
        await new Promise(resolve => setTimeout(resolve, 50));
        
        console.log(`✅ Chunk ${chunkNumber} sent successfully`);
      }
      
      console.log(`✅ All data sent successfully: ${bytes.length} bytes`);
    };
    
    // Helper function untuk set alignment LEFT (fix center alignment issue)
    const setLeftAlign = async () => {
      // ESC @ = Initialize printer
      await characteristic.writeValue(new Uint8Array([0x1B, 0x40]));
      // ESC a 0 = Set alignment LEFT
      await characteristic.writeValue(new Uint8Array([0x1B, 0x61, 0x00]));
    };
    
    const printData = async (data) => {
      await clearData();
      // Set alignment LEFT sebelum kirim data
      await setLeftAlign();
      // Gunakan chunking untuk menghindari data terpotong di Android Chrome
      await sendChunkedData(data);
    };
    for (let i = 0; i < totalItems; i++) {
      const { group, item } = allItems[i];
      
      // Gunakan original numbering jika tersedia (untuk selected items)
      let originalGlobalIndex = i;
      let originalTotalItems = totalItems;
      
      if (item.originalGlobalIndex !== undefined && formikData.originalTotalItems) {
        originalGlobalIndex = item.originalGlobalIndex;
        originalTotalItems = formikData.originalTotalItems;
      }
      
      console.log('🔍 Print Numbering Debug:', {
        currentIndex: i,
        originalGlobalIndex,
        originalTotalItems,
        group: group?.treatment?.name,
        item: `${item?.brand} ${item?.name}`
      });
      
      const checklistItem = generateChecklistItem(formikData, group, item, originalGlobalIndex, originalTotalItems);
      await printData(checklistItem);
      
      // Tambahkan paper feed dan delay setelah setiap item untuk memastikan semua data terprint
      await characteristic.writeValue(encoder.encode('\n\n'));
      await new Promise(resolve => setTimeout(resolve, 200)); // Wait untuk printer selesai process
      
      // const slip = generateSlip(formikData, group, item, originalGlobalIndex, originalTotalItems);
      // await printData(slip);
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
} 