// Template Kitchen Ticket Thermal Printer (58mm)
// Satu tiket = satu dapur produksi. Order yang itemnya diproduksi di beberapa
// dapur (mis. Cafe 2 jual makanan -> dibuat di Cafe 1) akan pecah jadi beberapa
// tiket, mengikuti pola print "tag item" (sequential print per dokumen).
import dayjs from 'dayjs';

const MAX_CHARS = 32;

export function formatKitchenText(text) {
  if (!text || text === '-') return '-';

  const words = String(text).split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    if (testLine.length <= MAX_CHARS) {
      currentLine = testLine;
      return;
    }
    if (currentLine) lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) lines.push(currentLine);
  return lines.join('\n');
}

const parseOptions = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') {
    return Object.entries(value).map(([key, val]) => `${key}: ${val}`);
  }
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.entries(parsed).map(([key, val]) => `${key}: ${val}`);
    }
    return [];
  } catch (error) {
    return [];
  }
};

const serveModeLabel = (serveMode, orderType) => {
  const value = String(serveMode || '').toLowerCase();
  if (value === 'dine-in' || value === 'dine in') return 'Dine In';
  if (value === 'takeaway' || value === 'take away') return 'Bawa Pulang';
  return orderType === 'takeaway' ? 'Bawa Pulang' : 'Dine In';
};

/**
 * Bangun daftar tiket dapur dari data order di frontend.
 * Hasilnya sama dengan payload GET /orders/:id/kitchen-tickets, tapi tanpa
 * request tambahan supaya alur print tetap seperti tab "Tag Item".
 */
export function buildKitchenTickets(orderData) {
  if (!orderData) return [];

  const buckets = new Map();

  (orderData.order_details || []).forEach((group) => {
    (group.items || []).forEach((item) => {
      const productionBranchId = item.production_branch_id ?? group.production_branch_id ?? orderData.branch_id ?? null;
      const branchName =
        group.production_branch?.name
        || orderData.branch?.name
        || 'Dapur';

      if (!buckets.has(productionBranchId)) {
        buckets.set(productionBranchId, {
          production_branch_id: productionBranchId,
          production_branch_name: branchName,
          order_code: orderData.code || orderData.invoice_code || orderData.payment?.code || null,
          order_type: orderData.order_type || null,
          table_number: orderData.table_number || null,
          customer_name: orderData.customer?.name || null,
          selling_branch_name: orderData.branch?.name || null,
          customer_note: orderData.customer_note || null,
          entry_date: orderData.entry_date || null,
          created_at: orderData.created_at || orderData.createdAt || null,
          items: [],
          total_qty: 0,
        });
      }

      const ticket = buckets.get(productionBranchId);
      const treatmentName = group.treatment?.name || item.name || 'Item';
      const options = parseOptions(item.options);
      const note = item.note || item.notes || '';
      const serveMode = serveModeLabel(group.serve_mode || orderData.order_type, orderData.order_type);

      const existing = ticket.items.find(
        (row) =>
          row.treatment_name === treatmentName
          && row.serve_mode === serveMode
          && JSON.stringify(row.options) === JSON.stringify(options)
          && (row.note || '') === (note || ''),
      );

      if (existing) {
        existing.qty += 1;
        if (item.tag_number != null && !existing.tag_numbers.includes(item.tag_number)) {
          existing.tag_numbers.push(item.tag_number);
        }
        if (item.order_detail_id) existing.order_detail_ids.push(item.order_detail_id);
      } else {
        ticket.items.push({
          treatment_id: group.treatment?.id ?? item.treatment_id ?? null,
          treatment_name: treatmentName,
          qty: 1,
          serve_mode: serveMode,
          options,
          note: note || null,
          status: item.status || null,
          tag_number: item.tag_number ?? null,
          tag_numbers: item.tag_number != null ? [item.tag_number] : [],
          order_detail_ids: item.order_detail_id ? [item.order_detail_id] : [],
        });
      }
    });
  });

  return Array.from(buckets.values()).map((ticket) => ({
    ...ticket,
    total_qty: ticket.items.reduce((sum, row) => sum + row.qty, 0),
    all_done: ticket.items.every((row) => row.status === 'done'),
  }));
}

export function generateKitchenTicket(ticket, index, total) {
  const queueNumbers = Array.from(
    new Set(ticket.items.flatMap((row) => row.tag_numbers || [])),
  ).sort((a, b) => a - b);

  const queueLine = queueNumbers.length
    ? `NO. ANTRIAN : ${queueNumbers.join(', ')}\n`
    : '';

  const itemLines = ticket.items
    .map((row) => {
      const lines = [`${row.qty}x ${formatKitchenText(row.treatment_name)}`];
      lines.push(`   Penyajian : ${row.serve_mode}`);
      if (row.options.length) {
        row.options.forEach((option) => lines.push(`   - ${formatKitchenText(option)}`));
      }
      if (row.note) lines.push(`   Catatan: ${formatKitchenText(row.note)}`);
      return lines.join('\n');
    })
    .join('\n\n');

  const printedAt = dayjs().format('DD-MMM-YYYY HH:mm');
  const entryDate = ticket.entry_date ? dayjs(ticket.entry_date).format('DD-MMM-YYYY') : '-';

  return `
--------------------------------
${queueLine}${ticket.production_branch_name || 'DAPUR'} (${index + 1}/${total})
--------------------------------
No. Nota  : ${ticket.order_code || '-'}
Tanggal   : ${printedAt}
Order     : ${entryDate}
Tipe      : ${ticket.order_type || '-'}
${ticket.table_number ? `Meja      : ${ticket.table_number}\n` : ''}Tamu      : ${ticket.customer_name || '-'}
${ticket.selling_branch_name && ticket.selling_branch_name !== ticket.production_branch_name
    ? `Order dr  : ${ticket.selling_branch_name}\n`
    : ''}--------------------------------
${itemLines}

Total Item : ${ticket.total_qty}
${ticket.customer_note ? `\nCatatan Order:\n${formatKitchenText(ticket.customer_note)}\n` : ''}--------------------------------
        DAPUR TELAGA
--------------------------------
`;
}

/**
 * Cetak tiket dapur secara berurutan (sama seperti print tag item).
 * @param {object|Array} payload - hasil buildKitchenTickets() atau { tickets: [] }
 */
export async function PrintKitchenTickets(payload, printerConfig = null, existingCharacteristic = null) {
  try {
    const tickets = Array.isArray(payload) ? payload : payload?.tickets || [];
    if (!tickets.length) {
      console.warn('⚠️ Tidak ada tiket dapur untuk dicetak');
      return false;
    }

    const config = printerConfig || {
      name: 'RPP02',
      serviceUUID: 'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
      characteristicUUID: 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
    };

    let characteristic = existingCharacteristic;

    if (!characteristic) {
      const options = {
        filters: [{ name: config.name }],
        optionalServices: [config.serviceUUID],
      };
      const device = await navigator.bluetooth.requestDevice(options);
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(config.serviceUUID);
      characteristic = await service.getCharacteristic(config.characteristicUUID);

      if (!characteristic) {
        console.error('Bluetooth characteristic is null');
        return false;
      }
    }

    const encoder = new TextEncoder();

    const sendChunkedData = async (data, chunkSize = 50) => {
      const bytes = encoder.encode(data);
      for (let i = 0; i < bytes.length; i += chunkSize) {
        await characteristic.writeValue(bytes.slice(i, i + chunkSize));
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    };

    const setLeftAlign = async () => {
      await characteristic.writeValue(new Uint8Array([0x1B, 0x40]));
      await characteristic.writeValue(new Uint8Array([0x1B, 0x61, 0x00]));
    };

    const printData = async (data) => {
      await characteristic.writeValue(encoder.encode(''));
      await setLeftAlign();
      await sendChunkedData(data);
    };

    for (let i = 0; i < tickets.length; i++) {
      const text = generateKitchenTicket(tickets[i], i, tickets.length);
      await printData(text);
      await characteristic.writeValue(encoder.encode('\n\n'));
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return true;
  } catch (error) {
    console.error('PrintKitchenTickets error:', error);
    return false;
  }
}
