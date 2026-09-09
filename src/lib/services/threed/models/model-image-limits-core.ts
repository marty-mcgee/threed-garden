const MAX_IMAGE_PIXELS = 16 * 1024 * 1024;

/** Read dimensions before asking the browser to allocate decoded image memory. */
export function getBulkLocalImagePixelCount(bytes: Uint8Array, mimeType: string): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width = 0;
  let height = 0;
  if (mimeType === 'image/png' && bytes.length >= 24) {
    width = view.getUint32(16);
    height = view.getUint32(20);
  } else if (mimeType === 'image/jpeg') {
    let offset = 2;
    while (offset + 3 < bytes.length) {
      if (bytes[offset++] !== 0xff) break;
      while (bytes[offset] === 0xff) offset += 1;
      const marker = bytes[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker) && length >= 7) {
        height = view.getUint16(offset + 3);
        width = view.getUint16(offset + 5);
        break;
      }
      offset += length;
    }
  } else if (mimeType === 'image/bmp' && bytes.length >= 26 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    const headerSize = view.getUint32(14, true);
    if (headerSize === 12) {
      width = view.getUint16(18, true);
      height = view.getUint16(20, true);
    } else if (headerSize >= 40) {
      width = view.getInt32(18, true);
      height = Math.abs(view.getInt32(22, true));
    }
  } else if (mimeType === 'image/webp' && bytes.length >= 25) {
    const kind = String.fromCharCode(...bytes.slice(12, 16));
    if (kind === 'VP8X' && bytes.length >= 30) {
      // Animated textures are outside this bounded static-image inspection.
      if ((bytes[20] & 2) !== 0) throw new Error('Animated WebP images are not supported in bulk GLB/GLTF imports.');
      width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
      height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    } else if (kind === 'VP8L' && bytes[20] === 0x2f) {
      const bits = view.getUint32(21, true);
      width = 1 + (bits & 0x3fff);
      height = 1 + ((bits >>> 14) & 0x3fff);
    } else if (kind === 'VP8 ' && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
      width = view.getUint16(26, true) & 0x3fff;
      height = view.getUint16(28, true) & 0x3fff;
    }
  }
  const pixels = width * height;
  if (!Number.isSafeInteger(pixels) || pixels <= 0) throw new Error('A texture image has invalid or unsupported dimensions.');
  if (pixels > MAX_IMAGE_PIXELS) throw new Error('Each texture image must contain at most 16 Mi pixels (16,777,216 pixels).');
  return pixels;
}

