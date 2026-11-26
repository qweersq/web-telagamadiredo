/**
 * Generate gradient colors from single base color
 */

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

function adjustBrightness(rgb, percent) {
  if (!rgb) return null;
  return rgbToHex(
    Math.max(0, Math.min(255, Math.round(rgb.r * (1 + percent / 100)))),
    Math.max(0, Math.min(255, Math.round(rgb.g * (1 + percent / 100)))),
    Math.max(0, Math.min(255, Math.round(rgb.b * (1 + percent / 100))))
  );
}

function getLuminance(rgb) {
  if (!rgb) return 0;
  const [r, g, b] = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function generateGradientFromColor(baseColor) {
  if (!baseColor) return ['#3D7AC8', '#5096FC', '#62B3FF'];
  const rgb = hexToRgb(baseColor);
  if (!rgb) return ['#3D7AC8', '#5096FC', '#62B3FF'];
  
  const darker = adjustBrightness(rgb, -15);
  const lighter = adjustBrightness(rgb, 25);
  
  return [darker, baseColor, lighter];
}

// Calculate optimal text color based on background luminance
export function calculateContrastColor(backgroundColor) {
  if (!backgroundColor) return '#000000';
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#000000';
  
  const luminance = getLuminance(rgb);
  // If background is light (luminance > 0.5), return dark text, otherwise light text
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// Darken a color by a certain percentage (for content text from header gradient)
export function darkenColor(baseColor, percent = 60) {
  if (!baseColor) return '#1F2937'; // Default dark gray
  const rgb = hexToRgb(baseColor);
  if (!rgb) return '#1F2937';
  
  // Darken by reducing each RGB value
  return rgbToHex(
    Math.max(0, Math.min(255, Math.round(rgb.r * (1 - percent / 100)))),
    Math.max(0, Math.min(255, Math.round(rgb.g * (1 - percent / 100)))),
    Math.max(0, Math.min(255, Math.round(rgb.b * (1 - percent / 100))))
  );
}

// Lighten a color by a certain percentage (for card backgrounds from header gradient)
export function lightenColor(baseColor, percent = 80) {
  if (!baseColor) return '#F9FAFB'; // Default light gray
  const rgb = hexToRgb(baseColor);
  if (!rgb) return '#F9FAFB';
  
  // Lighten by increasing each RGB value towards white
  return rgbToHex(
    Math.max(0, Math.min(255, Math.round(rgb.r + (255 - rgb.r) * (percent / 100)))),
    Math.max(0, Math.min(255, Math.round(rgb.g + (255 - rgb.g) * (percent / 100)))),
    Math.max(0, Math.min(255, Math.round(rgb.b + (255 - rgb.b) * (percent / 100))))
  );
}

