import { WorldConfig, WorldData, TerrainMetrics } from '../../contracts/types';
import { Mulberry32, DeterministicNoise } from '../../core/prng/mulberry32';
import { float32ArrayCRC32 } from '../../core/math/crc32';

export const DEFAULT_WORLD_CONFIG: WorldConfig = {
  seed: 1337,
  resolution: 64, // 64x64 grid
  scale: 0.035, // noise frequency
  octaves: 4,
  persistence: 0.5,
  lacunarity: 2.0,
  islandFalloff: true,
  waterLevel: 0.25,
  peakMultiplier: 1.5,
};

/**
 * Procedural Island / World Generator
 * Guarantees strict determinism for identical configs.
 */
export function generateWorld(config: WorldConfig): WorldData {
  const startTime = performance.now();
  const res = config.resolution;
  const heightmap = new Float32Array(res * res);

  const prng = new Mulberry32(config.seed);
  const noise = new DeterministicNoise(prng);

  const half = (res - 1) / 2;
  const maxDist = Math.SQRT2 * half;

  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let waterCount = 0;

  for (let y = 0; y < res; y++) {
    for (let x = 0; x < res; x++) {
      const idx = y * res + x;

      // 1. Calculate Base Fractal Noise (normalized to [0, 1])
      const nx = x * config.scale;
      const ny = y * config.scale;
      const rawNoise = noise.fbm2D(nx, ny, config.octaves, config.persistence, config.lacunarity);
      let h = (rawNoise + 1) * 0.5; // [-1, 1] -> [0, 1]

      // 2. Island Falloff (taper edges to water)
      if (config.islandFalloff) {
        const dx = x - half;
        const dy = y - half;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const normDist = dist / maxDist; // [0, 1]
        // Smooth cubic edge falloff
        const falloff = Math.max(0, 1 - Math.pow(normDist, 1.8));
        h = h * falloff;
      }

      // 3. Shape peaks
      if (h > config.waterLevel) {
        const aboveWater = (h - config.waterLevel) / (1 - config.waterLevel);
        h = config.waterLevel + Math.pow(aboveWater, config.peakMultiplier) * (1 - config.waterLevel);
      }

      // Clamp to [0, 1]
      h = Math.max(0, Math.min(1, h));
      heightmap[idx] = h;

      if (h < min) min = h;
      if (h > max) max = h;
      sum += h;
      if (h <= config.waterLevel) {
        waterCount++;
      }
    }
  }

  const endTime = performance.now();
  const checksum = float32ArrayCRC32(heightmap);

  const metrics: TerrainMetrics = {
    minHeight: Number(min.toFixed(4)),
    maxHeight: Number(max.toFixed(4)),
    averageHeight: Number((sum / (res * res)).toFixed(4)),
    waterCoverageRatio: Number((waterCount / (res * res)).toFixed(4)),
    generationTimeMs: Number((endTime - startTime).toFixed(2)),
  };

  return {
    config: { ...config },
    heightmap,
    metrics,
    checksum,
  };
}
