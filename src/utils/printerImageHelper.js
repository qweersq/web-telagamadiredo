/**
 * Printer Image Helper - Convert image to ESC/POS bitmap
 * Simple & Clean Implementation
 */

import QRCode from 'qrcode';

// Helper: ambil gambar via fetch lalu ubah ke data URL (base64)
// Tujuan: menghindari canvas "tainted" walau response CDN ter-cache tanpa header CORS
const fetchAsDataUrl = async (url) => {
  const res = await fetch(url, { mode: 'cors', cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Fetch failed (HTTP ${res.status}) for ${url}`);
  }
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
};

// Helper: load image dari src string (data URL / blob URL / url biasa)
const loadImageFromSrc = (src, useCors) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // data:/blob: tidak perlu crossOrigin dan tidak akan men-taint canvas
    if (useCors) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

// Tambahkan cache-buster ke URL.
// PENTING: response CDN yang ter-cache SEBELUM header CORS dipasang tidak punya
// Access-Control-Allow-Origin. Request tanpa cache akan dapat header yang benar.
const withCacheBuster = (url) => {
  const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  try {
    const u = new URL(url, window.location.href);
    u.searchParams.set('_cb', stamp);
    return u.toString();
  } catch {
    return `${url}${url.includes('?') ? '&' : '?'}_cb=${stamp}`;
  }
};

// Load image from URL
// Urutan percobaan:
// 1) fetch -> blob -> data URL  (paling aman, canvas tidak tainted)
// 2) fetch + cache-buster        (bypass response CDN lama yang belum punya header CORS)
// 3) Image + crossOrigin='anonymous'
export const loadImage = async (url) => {
  // Data URL / blob URL langsung dipakai
  if (typeof url === 'string' && (url.startsWith('data:') || url.startsWith('blob:'))) {
    return loadImageFromSrc(url, false);
  }

  const errors = [];

  // 1) fetch -> data URL
  if (typeof fetch === 'function') {
    try {
      const dataUrl = await fetchAsDataUrl(url);
      console.log('✅ Image fetched as data URL:', url);
      return await loadImageFromSrc(dataUrl, false);
    } catch (err) {
      errors.push(`fetch: ${err?.message || err}`);
      console.warn('⚠️ fetch image failed, retry with cache-buster:', err?.message || err);
    }

    // 2) fetch + cache-buster (bypass cache CDN lama)
    try {
      const bustedUrl = withCacheBuster(url);
      const dataUrl = await fetchAsDataUrl(bustedUrl);
      console.log('✅ Image fetched as data URL (cache-busted):', bustedUrl);
      return await loadImageFromSrc(dataUrl, false);
    } catch (err) {
      errors.push(`fetch+cachebuster: ${err?.message || err}`);
      console.warn('⚠️ cache-busted fetch failed, fallback to <img crossorigin>:', err?.message || err);
    }
  }

  // 3) Image + CORS
  try {
    return await loadImageFromSrc(url, true);
  } catch (err) {
    errors.push(`img-cors: ${err?.message || err}`);
  }

  // Semua gagal -> lempar error jelas (jangan return gambar tainted)
  throw new Error(`Gagal memuat gambar (CORS/cache): ${errors.join(' | ')}`);
};

// Resize image to fit printer width (FORCE full width - 384px for 58mm paper)
export const resizeImage = (img, maxWidth = 384, maxHeight = 200) => {
  // ALWAYS scale to full printer width (58mm = 384px)
  // Maintain aspect ratio - don't squash/stretch
  const aspectRatio = img.width / img.height;
  
  // Force full width first (round to nearest 8 for ESC/POS)
  let width = Math.floor(maxWidth / 8) * 8; // 384 -> 384, guaranteed divisible by 8
  // Calculate height based on aspect ratio (maintain proportions)
  let height = Math.floor(width / aspectRatio);
  
  // Keep width full (384px) and let height follow aspect ratio
  // Don't constrain height if it makes logo look squashed
  // If user wants to limit height, they should upload a properly sized logo
  
  return { width, height };
};

// Convert image to monochrome bitmap
export const imageToMonochrome = (img, targetWidth, targetHeight, options = {}) => {
  const {
    threshold = 160, // a bit higher for thermal printers
    dither = true,
    invert = false,
  } = options;
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  
  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const pixels = imageData.data;
  const width = targetWidth;
  const height = targetHeight;

  // Convert to grayscale first
  const gray = new Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      // Luminance
      gray[y * width + x] = 0.299 * r + 0.587 * g + 0.114 * b;
    }
  }

  // Floyd–Steinberg dithering (optional)
  if (dither) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const oldVal = gray[i];
        const newVal = oldVal < threshold ? 0 : 255;
        const err = oldVal - newVal;
        gray[i] = newVal;

        // Distribute error
        if (x + 1 < width) gray[i + 1] = Math.max(0, Math.min(255, gray[i + 1] + err * 7 / 16));
        if (y + 1 < height) {
          if (x > 0) gray[i + width - 1] = Math.max(0, Math.min(255, gray[i + width - 1] + err * 3 / 16));
          gray[i + width] = Math.max(0, Math.min(255, gray[i + width] + err * 5 / 16));
          if (x + 1 < width) gray[i + width + 1] = Math.max(0, Math.min(255, gray[i + width + 1] + err * 1 / 16));
        }
      }
    }
  }

  // Binarize to 1-bit
  const monochrome = new Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = gray[y * width + x];
      const bit = v < threshold ? 1 : 0; // 1 = black
      monochrome[y * width + x] = invert ? 1 - bit : bit;
    }
  }

  return monochrome;
};

// Convert monochrome pixels to bitmap bytes (8 pixels = 1 byte)
export const pixelsToBitmap = (pixels, width, height) => {
  const bytesPerRow = Math.floor(width / 8);
  const bytes = new Array(bytesPerRow * height);

  for (let y = 0; y < height; y++) {
    for (let bx = 0; bx < bytesPerRow; bx++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const x = bx * 8 + bit;
        const p = pixels[y * width + x];
        if (p === 1) byte |= (0x80 >> bit);
      }
      bytes[y * bytesPerRow + bx] = byte;
    }
  }

  return bytes;
};

// Build ESC/POS bitmap command (GS v 0)
export const buildBitmapCommand = (width, height, bitmapBytes, { align = 'center' } = {}) => {
  const bytesPerRow = Math.floor(width / 8);
  const init = [0x1B, 0x40]; // ESC @ initialize
  const alignMap = { left: 0, center: 1, right: 2 };
  const setAlign = [0x1B, 0x61, alignMap[align] ?? 1]; // ESC a n
  const command = [
    0x1D, 0x76, 0x30, 0x00,  // GS v 0 (print raster bitmap)
    bytesPerRow & 0xFF, (bytesPerRow >> 8) & 0xFF,  // width in bytes (low, high)
    height & 0xFF, (height >> 8) & 0xFF,  // height (low, high)
    ...bitmapBytes
  ];

  // Minimal feed - hanya 1 line break (0x0A = \n)
  // Invoice akan langsung follow setelah logo
  return new Uint8Array([...init, ...setAlign, ...command, 0x0A]);
};

// Main function: Convert image URL to ESC/POS command
/**
 * Generate QR Code as Data URL (REUSABLE FUNCTION)
 * @param {string} data - Data to encode (URL, text, etc)
 * @param {number} size - QR Code size in pixels (default: 200)
 * @returns {Promise<string>} - Data URL of QR Code image
 */
export const generateQRCodeImage = async (data, size = 200) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M' // Medium error correction
    });
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR Code:', error);
    throw error;
  }
};

export const imageToEscPos = async (imageUrl, maxWidth = 384, maxHeight = 200, opts = {}) => {
  try {
    // 1. Load image
    const img = await loadImage(imageUrl);
    
    // 2. Calculate resize dimensions
    const { width, height } = resizeImage(img, maxWidth, maxHeight);
    
    // 3. Convert to monochrome
    const monochrome = imageToMonochrome(img, width, height, opts);
    
    // 4. Convert to bitmap bytes
    const bitmapBytes = pixelsToBitmap(monochrome, width, height);
    
    // 5. Build ESC/POS command
    const command = buildBitmapCommand(width, height, bitmapBytes, { align: 'center' });
    
    console.log(`✅ Image converted: ${width}x${height}px, ${command.length} bytes`);
    
    return command;
  } catch (error) {
    console.error('❌ Image conversion failed:', error);
    throw error;
  }
}

// Render multi-line text into a canvas and return data URL (used for ASCII header)
export const textBlockToDataUrl = (text, options = {}) => {
  const {
    maxWidth = 384,
    padding = 8,
    background = '#FFFFFF',
    color = '#000000',
    fontFamily = 'monospace',
    baseFontSize = 12, // px
    lineGap = 2, // px
    scaleToWidth = true,
  } = options;

  const lines = (text || '').toString().replace(/\r/g, '').split('\n');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Initial font
  ctx.font = `${baseFontSize}px ${fontFamily}`;

  // Measure widest line
  let maxLineWidth = 0;
  for (const line of lines) {
    const w = ctx.measureText(line).width;
    if (w > maxLineWidth) maxLineWidth = w;
  }

  // Calculate scale so content width fits (maxWidth - 2*padding)
  const contentWidth = Math.max(1, maxWidth - padding * 2);
  const scale = scaleToWidth && maxLineWidth > 0 ? Math.min(4, contentWidth / maxLineWidth) : 1;
  const fontSize = Math.max(8, Math.floor(baseFontSize * scale));
  const lineHeight = Math.floor(fontSize * 1.1) + lineGap;

  // Re-apply font with scaled size and re-measure widest line
  ctx.font = `${fontSize}px ${fontFamily}`;
  maxLineWidth = 0;
  for (const line of lines) {
    const w = ctx.measureText(line).width;
    if (w > maxLineWidth) maxLineWidth = w;
  }
  const drawWidth = Math.min(contentWidth, Math.ceil(maxLineWidth));
  const drawHeight = Math.max(lineHeight, lines.length * lineHeight);

  canvas.width = maxWidth; // full printer width
  canvas.height = drawHeight + padding * 2;

  // Draw background
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw text centered horizontally
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'top';
  let x = Math.floor((canvas.width - drawWidth) / 2);
  let y = padding;
  for (const line of lines) {
    const w = ctx.measureText(line).width;
    const lineX = x + Math.floor((drawWidth - w) / 2);
    ctx.fillText(line, lineX, y);
    y += lineHeight;
  }

  return canvas.toDataURL('image/png');
};

