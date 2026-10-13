import { BinarySection, ParsedBinaryAST } from '../../contracts/types';
import { calculateCRC32 } from '../../core/math/crc32';
import { IELB_MAGIC, IELB_ENDIANNESS_MARKER } from './serializer';

export interface DecodedAgentRecord {
  id: number;
  x: number;
  y: number;
  energy: number;
  cargo: number;
  state: string;
  offset: number;
}

export interface DecodedResourceRecord {
  id: number;
  x: number;
  y: number;
  remaining: number;
  maxCapacity: number;
  offset: number;
}

export interface ParsedIELBResult {
  ast: ParsedBinaryAST;
  agents: DecodedAgentRecord[];
  resources: DecodedResourceRecord[];
  rawBytes: Uint8Array;
  checksumMatches: boolean;
  expectedCRC: number;
  computedCRC: number;
}

const STATE_NAMES: Record<number, string> = {
  0: 'idle',
  1: 'foraging',
  2: 'harvesting',
  3: 'returning',
  4: 'exhausted',
};

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
}

export function parseIELBBinary(bytes: Uint8Array): ParsedIELBResult {
  if (bytes.length < 50) {
    throw new Error(`Invalid .ielb file: file size (${bytes.length} bytes) is too small to contain valid header.`);
  }

  // 1. Verify Magic Bytes
  if (
    bytes[0] !== IELB_MAGIC[0] ||
    bytes[1] !== IELB_MAGIC[1] ||
    bytes[2] !== IELB_MAGIC[2] ||
    bytes[3] !== IELB_MAGIC[3]
  ) {
    const magicStr = String.fromCharCode(...bytes.slice(0, 4));
    throw new Error(`Magic bytes mismatch: expected 'IELB', got '${magicStr}'.`);
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // 2. Version & Endianness
  const version = view.getUint16(4, true);
  const endianness = view.getUint16(6, true);
  if (endianness !== IELB_ENDIANNESS_MARKER) {
    throw new Error(`Unsupported endianness marker: 0x${endianness.toString(16)}.`);
  }

  // 3. Header Fields
  const seed = view.getUint32(8, true);
  const tick = view.getUint32(12, true);
  const resolution = view.getUint16(16, true);
  const baseX = view.getUint16(18, true);
  const baseY = view.getUint16(20, true);
  const baseStockpile = view.getUint32(22, true);
  const agentCount = view.getUint16(26, true);
  const resourceCount = view.getUint16(28, true);
  const agentsOffset = view.getUint32(30, true);
  const agentsSize = view.getUint32(34, true);
  const resourcesOffset = view.getUint32(38, true);
  const resourcesSize = view.getUint32(42, true);

  // 4. Verify Checksum
  const checksumOffset = bytes.length - 4;
  const expectedCRC = view.getUint32(checksumOffset, true);
  const computedCRC = calculateCRC32(bytes.subarray(0, checksumOffset));
  const checksumMatches = expectedCRC === computedCRC;

  // 5. Decode Agents
  const agents: DecodedAgentRecord[] = [];
  for (let i = 0; i < agentCount; i++) {
    const offset = agentsOffset + i * 8;
    if (offset + 8 > bytes.length) break;
    const id = view.getUint16(offset, true);
    const x = view.getUint8(offset + 2);
    const y = view.getUint8(offset + 3);
    const energy = view.getUint8(offset + 4);
    const cargo = view.getUint8(offset + 5);
    const stateCode = view.getUint8(offset + 6);
    agents.push({
      id,
      x,
      y,
      energy,
      cargo,
      state: STATE_NAMES[stateCode] ?? 'unknown',
      offset,
    });
  }

  // 6. Decode Resources
  const resources: DecodedResourceRecord[] = [];
  for (let i = 0; i < resourceCount; i++) {
    const offset = resourcesOffset + i * 6;
    if (offset + 6 > bytes.length) break;
    const id = view.getUint16(offset, true);
    const x = view.getUint8(offset + 2);
    const y = view.getUint8(offset + 3);
    const remaining = view.getUint8(offset + 4);
    const maxCapacity = view.getUint8(offset + 5);
    resources.push({
      id,
      x,
      y,
      remaining,
      maxCapacity,
      offset,
    });
  }

  // 7. Construct Sections for AST
  const sections: BinarySection[] = [
    {
      name: 'Magic Header',
      offset: 0,
      length: 4,
      hexValue: toHex(bytes.slice(0, 4)),
      decodedValue: 'IELB',
    },
    {
      name: 'Format Version',
      offset: 4,
      length: 2,
      hexValue: toHex(bytes.slice(4, 6)),
      decodedValue: `v${version}`,
    },
    {
      name: 'Endianness Marker',
      offset: 6,
      length: 2,
      hexValue: toHex(bytes.slice(6, 8)),
      decodedValue: 'Little-Endian (0xFEFF)',
    },
    {
      name: 'Simulation Seed',
      offset: 8,
      length: 4,
      hexValue: toHex(bytes.slice(8, 12)),
      decodedValue: seed,
    },
    {
      name: 'Final Tick',
      offset: 12,
      length: 4,
      hexValue: toHex(bytes.slice(12, 16)),
      decodedValue: tick,
    },
    {
      name: 'World Resolution',
      offset: 16,
      length: 2,
      hexValue: toHex(bytes.slice(16, 18)),
      decodedValue: `${resolution}x${resolution}`,
    },
    {
      name: 'Colony Base Coordinates',
      offset: 18,
      length: 4,
      hexValue: toHex(bytes.slice(18, 22)),
      decodedValue: `(${baseX}, ${baseY})`,
    },
    {
      name: 'Colony Stockpile',
      offset: 22,
      length: 4,
      hexValue: toHex(bytes.slice(22, 26)),
      decodedValue: `${baseStockpile} food`,
    },
    {
      name: 'Agent Count',
      offset: 26,
      length: 2,
      hexValue: toHex(bytes.slice(26, 28)),
      decodedValue: agentCount,
    },
    {
      name: 'Resource Count',
      offset: 28,
      length: 2,
      hexValue: toHex(bytes.slice(28, 30)),
      decodedValue: resourceCount,
    },
    {
      name: 'Directory: Agents Offset/Size',
      offset: 30,
      length: 8,
      hexValue: toHex(bytes.slice(30, 38)),
      decodedValue: `Offset: 0x${agentsOffset.toString(16).toUpperCase()}, Size: ${agentsSize}B`,
    },
    {
      name: 'Directory: Resources Offset/Size',
      offset: 38,
      length: 8,
      hexValue: toHex(bytes.slice(38, 46)),
      decodedValue: `Offset: 0x${resourcesOffset.toString(16).toUpperCase()}, Size: ${resourcesSize}B`,
    },
    {
      name: `Agents Table (${agents.length} Entities)`,
      offset: agentsOffset,
      length: agentsSize,
      hexValue: toHex(bytes.slice(agentsOffset, Math.min(agentsOffset + 16, bytes.length))) + (agentsSize > 16 ? ' ...' : ''),
      decodedValue: `${agents.length} records (${agentsSize} bytes)`,
    },
    {
      name: `Resources Table (${resources.length} Nodes)`,
      offset: resourcesOffset,
      length: resourcesSize,
      hexValue: toHex(bytes.slice(resourcesOffset, Math.min(resourcesOffset + 16, bytes.length))) + (resourcesSize > 16 ? ' ...' : ''),
      decodedValue: `${resources.length} records (${resourcesSize} bytes)`,
    },
    {
      name: 'CRC32 Integrity Checksum',
      offset: checksumOffset,
      length: 4,
      hexValue: toHex(bytes.slice(checksumOffset, bytes.length)),
      decodedValue: `0x${expectedCRC.toString(16).toUpperCase()} [${checksumMatches ? 'VALID' : 'CORRUPTED'}]`,
    },
  ];

  const ast: ParsedBinaryAST = {
    magic: 'IELB',
    version,
    seed,
    tick,
    sections,
    checksumValid: checksumMatches,
  };

  return {
    ast,
    agents,
    resources,
    rawBytes: bytes,
    checksumMatches,
    expectedCRC,
    computedCRC,
  };
}
