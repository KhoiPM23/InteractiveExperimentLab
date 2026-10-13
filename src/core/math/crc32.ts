/**
 * CRC32 Checksum implementation for ArrayBuffer and TypedArray.
 * Used for verifying bit-level determinism and data integrity.
 */
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

export function calculateCRC32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function float32ArrayCRC32(data: Float32Array): number {
  const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  return calculateCRC32(bytes);
}
