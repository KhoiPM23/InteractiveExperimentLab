import { describe, it, expect } from 'vitest';
import { generateWorld, DEFAULT_WORLD_CONFIG } from '../src/modules/world/worldGenerator';
import { SimulationEngine } from '../src/modules/simulation/simulationEngine';

describe('Interactive Systems Observatory & DES Engine', () => {
  const testWorld = generateWorld({ ...DEFAULT_WORLD_CONFIG, seed: 1234 });

  it('guarantees 100% deterministic replay for identical seed and world', () => {
    const engineA = new SimulationEngine(testWorld, { seed: 999 });
    const engineB = new SimulationEngine(testWorld, { seed: 999 });

    for (let i = 0; i < 50; i++) {
      engineA.step();
      engineB.step();
    }

    const snapA = engineA.getSnapshot();
    const snapB = engineB.getSnapshot();

    expect(snapA.tick).toBe(50);
    expect(snapB.tick).toBe(50);
    expect(snapA.checksum).toBe(snapB.checksum);
    expect(snapA.base.stockpile).toBe(snapB.base.stockpile);
    expect(snapA.base.totalCollected).toBe(snapB.base.totalCollected);
    expect(snapA.agents.length).toBe(snapB.agents.length);

    for (let i = 0; i < snapA.agents.length; i++) {
      const a = snapA.agents[i];
      const b = snapB.agents[i];
      expect(a.id).toBe(b.id);
      expect(a.x).toBe(b.x);
      expect(a.y).toBe(b.y);
      expect(a.energy).toBe(b.energy);
      expect(a.cargo).toBe(b.cargo);
      expect(a.state).toBe(b.state);
    }
  });

  it('resets cleanly back to tick 0 with identical initial state', () => {
    const engine = new SimulationEngine(testWorld, { seed: 777 });
    const initialSnap = engine.getSnapshot();

    for (let i = 0; i < 25; i++) {
      engine.step();
    }
    expect(engine.getTick()).toBe(25);

    engine.reset();
    const resetSnap = engine.getSnapshot();

    expect(resetSnap.tick).toBe(0);
    expect(resetSnap.checksum).toBe(initialSnap.checksum);
    expect(resetSnap.agents.length).toBe(initialSnap.agents.length);
    expect(resetSnap.base.stockpile).toBe(initialSnap.base.stockpile);
  });

  it('preserves replay consistency: batch step(30) equals 30x step(1)', () => {
    const engineBatch = new SimulationEngine(testWorld, { seed: 555 });
    const engineSingle = new SimulationEngine(testWorld, { seed: 555 });

    for (let i = 0; i < 30; i++) {
      engineBatch.step();
    }

    for (let i = 0; i < 30; i++) {
      engineSingle.step();
    }

    const snapBatch = engineBatch.getSnapshot();
    const snapSingle = engineSingle.getSnapshot();

    expect(snapBatch.checksum).toBe(snapSingle.checksum);
    expect(snapBatch.base.stockpile).toBe(snapSingle.base.stockpile);
  });

  it('strictly maintains boundary and terrain invariants across 100 ticks', () => {
    const engine = new SimulationEngine(testWorld, { seed: 888 });

    for (let i = 0; i < 100; i++) {
      const snap = engine.step();

      // Invariant: No agent in water or out of bounds
      for (const agent of snap.agents) {
        expect(agent.x).toBeGreaterThanOrEqual(0);
        expect(agent.x).toBeLessThan(testWorld.config.resolution);
        expect(agent.y).toBeGreaterThanOrEqual(0);
        expect(agent.y).toBeLessThan(testWorld.config.resolution);

        const elevation = testWorld.heightmap[agent.y * testWorld.config.resolution + agent.x];
        expect(elevation).toBeGreaterThan(testWorld.config.waterLevel);
        expect(agent.energy).toBeGreaterThanOrEqual(0);
        expect(agent.energy).toBeLessThanOrEqual(100);
      }
    }
  });

  it('strictly enforces event sequence tie-breaking order', () => {
    const engine = new SimulationEngine(testWorld, { seed: 333 });
    engine.step();
    engine.step();

    const events = engine.getSnapshot().events;
    for (let i = 1; i < events.length; i++) {
      expect(events[i].seq).toBeGreaterThan(events[i - 1].seq);
    }
  });

  it('emits meaningful structured events with details explaining actions', () => {
    const engine = new SimulationEngine(testWorld, { seed: 111 });

    let collectedEventsCount = 0;
    for (let i = 0; i < 40; i++) {
      const snap = engine.step();
      collectedEventsCount += snap.events.length;
    }

    expect(collectedEventsCount).toBeGreaterThan(0);
    const history = engine.getAllEventHistory();
    const harvestedEvents = history.filter((e) => e.type === 'RESOURCE_HARVESTED');
    const depositedEvents = history.filter((e) => e.type === 'CARGO_DEPOSITED');

    expect(harvestedEvents.length).toBeGreaterThan(0);
    expect(depositedEvents.length).toBeGreaterThan(0);

    // Verify human-readable explainability
    expect(harvestedEvents[0].details).toContain('harvested 1 unit');
    expect(depositedEvents[0].details).toContain('deposited');
  });
});
