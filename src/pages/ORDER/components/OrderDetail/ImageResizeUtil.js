// Utility untuk resize image file di frontend sebelum upload
// Usage: resizeImageFile(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.7 })
// Returns: Promise<Blob>

export function resizeImageFile(file, { maxWidth = 1024, maxHeight = 1024, quality = 0.7 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = e => {
      img.onload = () => {
        let { width, height } = img;
        let newWidth = width;
        let newHeight = height;
        // Resize logic
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          newWidth = Math.round(width * ratio);
          newHeight = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        canvas.toBlob(
          blob => {
            if (blob) resolve(blob);
            else reject(new Error('Resize failed'));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = err => reject(err);
      img.src = e.target.result;
    };
    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
} 