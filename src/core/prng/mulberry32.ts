import { PRNG } from '../../contracts/types';

/**
 * Mulberry32: Fast, high-quality 32-bit deterministic PRNG.
 * Produces identical sequences for a given seed across all platforms.
 */
export class Mulberry32 implements PRNG {
  private state: number;
  private readonly initialSeed: number;

  constructor(seed: number) {
    // Force seed to 32-bit unsigned integer
    this.state = (seed >>> 0) || 1;
    this.initialSeed = this.state;
  }

  /**
   * Return float in range [0, 1)
   */
  nextFloat(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Return integer in range [min, max] inclusive
   */
  nextInt(min: number, max: number): number {
    const f = this.nextFloat();
    return Math.floor(f * (max - min + 1)) + min;
  }

  getSeed(): number {
    return this.initialSeed;
  }
}

/**
 * Fast 2D Value/Perlin Gradient Noise for Procedural Worlds
 * Purely deterministic based on Mulberry32 PRNG permutation table.
 */
export class DeterministicNoise {
  private readonly perm: Uint8Array = new Uint8Array(512);

  constructor(prng: PRNG) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    // Fisher-Yates shuffle using deterministic PRNG
    for (let i = 255; i > 0; i--) {
      const j = prng.nextInt(0, i);
      const tmp = p[i];
      p[i] = p[j];
      p[j] = tmp;
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  /**
   * 2D Perlin noise in [-1, 1]
   */
  noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const A = this.perm[X] + Y;
    const B = this.perm[X + 1] + Y;

    return this.lerp(
      v,
      this.lerp(u, this.grad(this.perm[A], xf, yf), this.grad(this.perm[B], xf - 1, yf)),
      this.lerp(u, this.grad(this.perm[A + 1], xf, yf - 1), this.grad(this.perm[B + 1], xf - 1, yf - 1))
    );
  }

  /**
   * Fractal Brownian Motion (FBM) with multiple octaves
   */
  fbm2D(x: number, y: number, octaves: number, persistence: number, lacunarity: number): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }
}
