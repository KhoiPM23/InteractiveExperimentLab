import { describe, it, expect } from 'vitest';
import { generateWorld, DEFAULT_WORLD_CONFIG } from '../src/modules/world/worldGenerator';

describe('Procedural World Reproducibility & Boundaries', () => {
  it('guarantees bit-for-bit identical heightmaps and CRC32 for identical seeds', () => {
    const config = { ...DEFAULT_WORLD_CONFIG, seed: 424242 };

    const runA = generateWorld(config);
    const runB = generateWorld(config);

    expect(runA.checksum).toBe(runB.checksum);
    expect(runA.heightmap.length).toBe(runB.heightmap.length);

    for (let i = 0; i < runA.heightmap.length; i++) {
      expect(runA.heightmap[i]).toBe(runB.heightmap[i]);
    }

    expect(runA.metrics.minHeight).toBe(runB.metrics.minHeight);
    expect(runA.metrics.maxHeight).toBe(runB.metrics.maxHeight);
    expect(runA.metrics.waterCoverageRatio).toBe(runB.metrics.waterCoverageRatio);
  });

  it('changes terrain and checksum when seed is altered', () => {
    const world1 = generateWorld({ ...DEFAULT_WORLD_CONFIG, seed: 1001 });
    const world2 = generateWorld({ ...DEFAULT_WORLD_CONFIG, seed: 2002 });

    expect(world1.checksum).not.toBe(world2.checksum);
  });

  it('handles small and large grid resolutions correctly', () => {
    const worldSmall = generateWorld({ ...DEFAULT_WORLD_CONFIG, resolution: 32 });
    expect(worldSmall.heightmap.length).toBe(32 * 32);

    const worldLarge = generateWorld({ ...DEFAULT_WORLD_CONFIG, resolution: 128 });
    expect(worldLarge.heightmap.length).toBe(128 * 128);
  });

  it('ensures heightmap values remain strictly clamped in [0, 1]', () => {
    const world = generateWorld({
      ...DEFAULT_WORLD_CONFIG,
      octaves: 6,
      peakMultiplier: 3.0,
      scale: 0.08,
    });

    for (let i = 0; i < world.heightmap.length; i++) {
      const h = world.heightmap[i];
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(1);
    }
  });

  it('executes within performance budget (< 40ms for 64x64 grid)', () => {
    const world = generateWorld(DEFAULT_WORLD_CONFIG);
    // Performance budget check on standard CPU
    expect(world.metrics.generationTimeMs).toBeLessThan(40);
  });

  it('correctly calculates water coverage when water level is raised', () => {
    const worldLowWater = generateWorld({ ...DEFAULT_WORLD_CONFIG, waterLevel: 0.1 });
    const worldHighWater = generateWorld({ ...DEFAULT_WORLD_CONFIG, waterLevel: 0.45 });

    expect(worldHighWater.metrics.waterCoverageRatio).toBeGreaterThan(
      worldLowWater.metrics.waterCoverageRatio
    );
  });
});
