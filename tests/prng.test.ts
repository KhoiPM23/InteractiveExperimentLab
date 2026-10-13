import { describe, it, expect } from 'vitest';
import { Mulberry32 } from '../src/core/prng/mulberry32';

describe('Mulberry32 PRNG Determinism', () => {
  it('produces identical sequences for identical seeds', () => {
    const seed = 1337;
    const prng1 = new Mulberry32(seed);
    const prng2 = new Mulberry32(seed);

    for (let i = 0; i < 1000; i++) {
      expect(prng1.nextFloat()).toBe(prng2.nextFloat());
    }
  });

  it('produces distinct sequences for different seeds', () => {
    const prngA = new Mulberry32(100);
    const prngB = new Mulberry32(200);

    let matchCount = 0;
    for (let i = 0; i < 100; i++) {
      if (prngA.nextFloat() === prngB.nextFloat()) {
        matchCount++;
      }
    }
    expect(matchCount).toBeLessThan(5);
  });

  it('bounds values strictly within [0, 1)', () => {
    const prng = new Mulberry32(42);
    for (let i = 0; i < 5000; i++) {
      const val = prng.nextFloat();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('bounds integers strictly within [min, max]', () => {
    const prng = new Mulberry32(999);
    for (let i = 0; i < 2000; i++) {
      const val = prng.nextInt(10, 20);
      expect(val).toBeGreaterThanOrEqual(10);
      expect(val).toBeLessThanOrEqual(20);
      expect(Number.isInteger(val)).toBe(true);
    }
  });
});
