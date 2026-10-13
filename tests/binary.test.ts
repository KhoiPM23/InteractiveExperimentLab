import { describe, it, expect } from 'vitest';
import { DEFAULT_WORLD_CONFIG, generateWorld } from '../src/modules/world/worldGenerator';
import { SimulationEngine } from '../src/modules/simulation/simulationEngine';
import {
  serializeSimulationSnapshot,
  IELB_MAGIC,
  IELB_VERSION,
  IELB_ENDIANNESS_MARKER,
} from '../src/modules/binary/serializer';
import { parseIELBBinary } from '../src/modules/binary/binaryParser';

describe('Binary & Protocol Playground (.ielb Serializer & Parser)', () => {
  const world = generateWorld(DEFAULT_WORLD_CONFIG);
  const engine = new SimulationEngine(world, { seed: 12345, maxTicks: 50 });
  const snapshot = engine.getSnapshot();

  it('serializes snapshot into strict binary layout with correct magic bytes and headers', () => {
    const bytes = serializeSimulationSnapshot(snapshot);

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(50);

    // Magic Bytes: "IELB"
    expect(bytes[0]).toBe(IELB_MAGIC[0]);
    expect(bytes[1]).toBe(IELB_MAGIC[1]);
    expect(bytes[2]).toBe(IELB_MAGIC[2]);
    expect(bytes[3]).toBe(IELB_MAGIC[3]);

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    // Version = 1
    expect(view.getUint16(4, true)).toBe(IELB_VERSION);
    // Endianness = 0xFEFF
    expect(view.getUint16(6, true)).toBe(IELB_ENDIANNESS_MARKER);
    // Seed matches snapshot
    expect(view.getUint32(8, true)).toBe(snapshot.seed);
    // Tick matches snapshot
    expect(view.getUint32(12, true)).toBe(snapshot.tick);
  });

  it('parses .ielb binary format back into structured AST with matching metadata', () => {
    const bytes = serializeSimulationSnapshot(snapshot);
    const parsed = parseIELBBinary(bytes);

    expect(parsed.ast.magic).toBe('IELB');
    expect(parsed.ast.version).toBe(1);
    expect(parsed.ast.seed).toBe(snapshot.seed);
    expect(parsed.ast.tick).toBe(snapshot.tick);
    expect(parsed.checksumMatches).toBe(true);
    expect(parsed.expectedCRC).toBe(parsed.computedCRC);
  });

  it('preserves agent and resource records across binary serialization round-trip', () => {
    const bytes = serializeSimulationSnapshot(snapshot);
    const parsed = parseIELBBinary(bytes);

    expect(parsed.agents.length).toBe(snapshot.agents.length);
    expect(parsed.resources.length).toBe(snapshot.resources.length);

    // Verify first agent
    const origAgent = snapshot.agents[0];
    const decodedAgent = parsed.agents[0];
    expect(decodedAgent.id).toBe(origAgent.id);
    expect(decodedAgent.x).toBe(origAgent.x);
    expect(decodedAgent.y).toBe(origAgent.y);
    expect(decodedAgent.energy).toBe(origAgent.energy);
    expect(decodedAgent.cargo).toBe(origAgent.cargo);
    expect(decodedAgent.state).toBe(origAgent.state);

    // Verify first resource
    const origRes = snapshot.resources[0];
    const decodedRes = parsed.resources[0];
    expect(decodedRes.id).toBe(origRes.id);
    expect(decodedRes.x).toBe(origRes.x);
    expect(decodedRes.y).toBe(origRes.y);
    expect(decodedRes.remaining).toBe(origRes.remaining);
  });

  it('detects single-bit data corruption via CRC32 integrity check', () => {
    const bytes = serializeSimulationSnapshot(snapshot);
    const corrupted = new Uint8Array(bytes);

    // Corrupt 1 byte in payload (e.g. at offset 10)
    corrupted[10] ^= 0x01;

    const parsed = parseIELBBinary(corrupted);
    expect(parsed.checksumMatches).toBe(false);
    expect(parsed.computedCRC).not.toBe(parsed.expectedCRC);
  });

  it('rejects invalid or corrupted magic bytes with descriptive error', () => {
    const bytes = serializeSimulationSnapshot(snapshot);
    const corrupted = new Uint8Array(bytes);
    corrupted[0] = 0x58; // 'X' instead of 'I'

    expect(() => parseIELBBinary(corrupted)).toThrowError(/Magic bytes mismatch/);
  });

  it('rejects truncated buffers that cannot contain a valid header', () => {
    const truncated = new Uint8Array([0x49, 0x45, 0x4c, 0x42, 0x01]);
    expect(() => parseIELBBinary(truncated)).toThrowError(/too small to contain valid header/);
  });
});
