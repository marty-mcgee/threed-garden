/** A bounded, uncompressed ZIP of original image bytes; no image conversion. */
export function createEmbeddedImageZip(entries: Array<{ name: string; bytes: Uint8Array }>): Uint8Array {
  if (!entries.length || entries.length > 500) throw new Error('Choose between 1 and 500 embedded images.');
  const encoder = new TextEncoder();
  const names = entries.map(entry => encoder.encode(entry.name));
  const total = entries.reduce((sum, entry) => sum + entry.bytes.byteLength, 0);
  if (total > 32 * 1024 * 1024 || names.some(name => !name.length || name.length > 255)
    || new Set(entries.map(entry => entry.name)).size !== entries.length
    || entries.some(entry => entry.name === '.' || entry.name === '..' || /[\\/\u0000-\u001f]/.test(entry.name))) throw new Error('The selected images exceed the download limits.');
  const size = entries.reduce((sum, entry, i) => sum + 30 + names[i].length + entry.bytes.length + 46 + names[i].length, 22);
  const output = new Uint8Array(size), view = new DataView(output.buffer);
  const table = Array.from({ length: 256 }, (_, value) => {
    for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    return value >>> 0;
  });
  const crc = (bytes: Uint8Array) => {
    let value = 0xffffffff;
    for (const byte of bytes) value = (value >>> 8) ^ table[(value ^ byte) & 255];
    return (value ^ 0xffffffff) >>> 0;
  };
  let position = 0;
  const records = entries.map((entry, i) => {
    const offset = position, checksum = crc(entry.bytes), name = names[i];
    view.setUint32(position, 0x04034b50, true); view.setUint16(position + 4, 20, true);
    view.setUint16(position + 6, 0x800, true); view.setUint32(position + 14, checksum, true);
    view.setUint16(position + 12, 0x21, true);
    view.setUint32(position + 18, entry.bytes.length, true); view.setUint32(position + 22, entry.bytes.length, true);
    view.setUint16(position + 26, name.length, true); output.set(name, position + 30);
    position += 30 + name.length; output.set(entry.bytes, position); position += entry.bytes.length;
    return { offset, checksum };
  });
  const directory = position;
  entries.forEach((entry, i) => {
    const name = names[i], record = records[i];
    view.setUint32(position, 0x02014b50, true); view.setUint16(position + 4, 20, true); view.setUint16(position + 6, 20, true);
    view.setUint16(position + 8, 0x800, true); view.setUint32(position + 16, record.checksum, true);
    view.setUint16(position + 14, 0x21, true);
    view.setUint32(position + 20, entry.bytes.length, true); view.setUint32(position + 24, entry.bytes.length, true);
    view.setUint16(position + 28, name.length, true); view.setUint32(position + 42, record.offset, true);
    output.set(name, position + 46); position += 46 + name.length;
  });
  view.setUint32(position, 0x06054b50, true); view.setUint16(position + 8, entries.length, true); view.setUint16(position + 10, entries.length, true);
  view.setUint32(position + 12, position - directory, true); view.setUint32(position + 16, directory, true);
  return output;
}

export function downloadEmbeddedBytes(bytes: Uint8Array, mimeType: string, name: string) {
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: mimeType }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name;
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
