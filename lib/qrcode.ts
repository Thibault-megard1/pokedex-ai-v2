// QR Code generation utilities
// Uses a lightweight QR code generation library

/**
 * Generates a QR code as a data URL
 * @param text - The text to encode
 * @param size - Size of the QR code (default: 256)
 * @returns Data URL of the QR code image
 */
export async function generateQRCode(text: string, size: number = 256): Promise<string> {
  // Using a simple canvas-based approach
  // In production, consider using a library like 'qrcode' or 'qr-code-styling'
  
  try {
    // For now, use a public API as a simple solution
    // In production, implement client-side generation
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
    return url;
  } catch (error) {
    console.error('QR code generation failed:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Download QR code as image
 */
export async function downloadQRCode(dataUrl: string, filename: string = 'team-qr.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/**
 * Copy QR code data URL to clipboard
 */
export async function copyQRToClipboard(dataUrl: string): Promise<boolean> {
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
    return true;
  } catch (error) {
    console.error('Failed to copy QR code:', error);
    return false;
  }
}
