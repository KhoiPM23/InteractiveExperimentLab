import { SimulationSnapshot } from '../../contracts/types';
import { calculateCRC32 } from '../../core/math/crc32';

/**
 * Interactive Experiment Lab Binary (.ielb) Serializer
 * Strict binary layout specification:
 * [0x00 - 0x03]: Magic Bytes 'IELB' (0x49, 0x45, 0x4C, 0x42)
 * [0x04 - 0x05]: Version uint16 (0x0001)
 * [0x06 - 0x07]: Endianness uint16 (0xFEFF)
 * [0x08 - 0x0B]: Seed uint32
 * [0x0C - 0x0F]: Tick uint32
 * [0x10 - 0x11]: World Resolution uint16
 * [0x12 - 0x13]: Base X uint16
 * [0x14 - 0x15]: Base Y uint16
 * [0x16 - 0x19]: Base Stockpile uint32
 * [0x1A - 0x1B]: Agent Count uint16
 * [0x1C - 0x1D]: Resource Count uint16
 * [0x1E - 0x21]: Agents Section Offset uint32
 * [0x22 - 0x25]: Agents Section Length uint32
 * [0x26 - 0x29]: Resources Section Offset uint32
 * [0x2A - 0x2D]: Resources Section Length uint32
 * [Agents Section]: 8 bytes per agent
 * [Resources Section]: 6 bytes per resource node
 * [Tail (4 bytes)]: CRC32 Checksum uint32
 */

export const IELB_MAGIC = new Uint8Array([0x49, 0x45, 0x4c, 0x42]); // "IELB"
export const IELB_VERSION = 1;
export const IELB_ENDIANNESS_MARKER = 0xfeff;

const STATE_CODES: Record<string, number> = {
  idle: 0,
  foraging: 1,
  harvesting: 2,
  returning: 3,
  exhausted: 4,
};

export function serializeSimulationSnapshot(snapshot: SimulationSnapshot): Uint8Array {
  const headerSize = 46; // 0x00 - 0x2D
  const agentRecordSize = 8;
  const resourceRecordSize = 6;
  const checksumSize = 4;

  const agentsSize = snapshot.agents.length * agentRecordSize;
  const resourcesSize = snapshot.resources.length * resourceRecordSize;

  const agentsOffset = headerSize;
  const resourcesOffset = headerSize + agentsSize;
  const totalLength = headerSize + agentsSize + resourcesSize + checksumSize;

  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // 1. Magic bytes
  bytes[0] = IELB_MAGIC[0];
  bytes[1] = IELB_MAGIC[1];
  bytes[2] = IELB_MAGIC[2];
  bytes[3] = IELB_MAGIC[3];

  // 2. Version & Endianness
  view.setUint16(4, IELB_VERSION, true); // Little-endian
  view.setUint16(6, IELB_ENDIANNESS_MARKER, true);

  // 3. Metadata
  view.setUint32(8, snapshot.seed >>> 0, true);
  view.setUint32(12, snapshot.tick >>> 0, true);
  view.setUint16(16, snapshot.worldConfig.resolution, true);
  view.setUint16(18, snapshot.base.x, true);
  view.setUint16(20, snapshot.base.y, true);
  view.setUint32(22, snapshot.base.stockpile >>> 0, true);
  view.setUint16(26, snapshot.agents.length, true);
  view.setUint16(28, snapshot.resources.length, true);

  // 4. Section directory
  view.setUint32(30, agentsOffset, true);
  view.setUint32(34, agentsSize, true);
  view.setUint32(38, resourcesOffset, true);
  view.setUint32(42, resourcesSize, true);

  // 5. Agents Records
  let currentOffset = agentsOffset;
  for (const agent of snapshot.agents) {
    view.setUint16(currentOffset, agent.id, true);
    view.setUint8(currentOffset + 2, agent.x);
    view.setUint8(currentOffset + 3, agent.y);
    view.setUint8(currentOffset + 4, Math.min(100, Math.max(0, agent.energy)));
    view.setUint8(currentOffset + 5, agent.cargo);
    view.setUint8(currentOffset + 6, STATE_CODES[agent.state] ?? 0);
    view.setUint8(currentOffset + 7, 0); // reserved
    currentOffset += agentRecordSize;
  }

  // 6. Resources Records
  currentOffset = resourcesOffset;
  for (const res of snapshot.resources) {
    view.setUint16(currentOffset, res.id, true);
    view.setUint8(currentOffset + 2, res.x);
    view.setUint8(currentOffset + 3, res.y);
    view.setUint8(currentOffset + 4, res.remaining);
    view.setUint8(currentOffset + 5, res.maxCapacity);
    currentOffset += resourceRecordSize;
  }

  // 7. Calculate and append CRC32 checksum of all preceding data
  const payloadBeforeChecksum = new Uint8Array(buffer, 0, totalLength - checksumSize);
  const calculatedCRC = calculateCRC32(payloadBeforeChecksum);
  view.setUint32(totalLength - checksumSize, calculatedCRC, true);

  return bytes;
}
