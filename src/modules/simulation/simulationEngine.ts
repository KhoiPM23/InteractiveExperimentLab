import {
  WorldData,
  SimulationConfig,
  SimulationSnapshot,
  SimulationEvent,
  SimulationMetrics,
  AgentState,
  ResourceNode,
  ColonyBase,
} from '../../contracts/types';
import { Mulberry32 } from '../../core/prng/mulberry32';
import { calculateCRC32 } from '../../core/math/crc32';

export const DEFAULT_SIM_CONFIG: SimulationConfig = {
  seed: 42,
  initialAgents: 8,
  resourceNodeCount: 12,
  agentEnergyBurn: 1,
  spawnThreshold: 25,
  maxTicks: 300,
};

export class SimulationEngine {
  private readonly world: WorldData;
  private readonly config: SimulationConfig;
  private prng: Mulberry32;

  private tick = 0;
  private seqCounter = 0;
  private base: ColonyBase;
  private resources: ResourceNode[] = [];
  private agents: AgentState[] = [];
  private recentEvents: SimulationEvent[] = [];
  private allEventHistory: SimulationEvent[] = [];
  private metricsHistory: SimulationMetrics[] = [];
  private totalSpawnedResources = 0;
  private totalConsumedUpkeep = 0;

  constructor(world: WorldData, config: Partial<SimulationConfig> = {}) {
    this.world = world;
    this.config = { ...DEFAULT_SIM_CONFIG, ...config };
    this.prng = new Mulberry32(this.config.seed);

    // Initial setup
    this.base = this.placeColonyBase();
    this.initialize();
  }

  /**
   * Reset simulation to Tick 0 with deterministic initial state
   */
  public reset(): void {
    this.tick = 0;
    this.seqCounter = 0;
    this.prng = new Mulberry32(this.config.seed);
    this.recentEvents = [];
    this.allEventHistory = [];
    this.metricsHistory = [];
    this.totalConsumedUpkeep = 0;
    this.base = this.placeColonyBase();
    this.initialize();
  }

  private isLand(x: number, y: number): boolean {
    const res = this.world.config.resolution;
    if (x < 0 || x >= res || y < 0 || y >= res) return false;
    const h = this.world.heightmap[y * res + x] ?? 0;
    return h > this.world.config.waterLevel;
  }

  private placeColonyBase(): ColonyBase {
    const res = this.world.config.resolution;
    const half = Math.floor(res / 2);

    // Search for closest fertile land to center
    let bestX = half;
    let bestY = half;
    let found = false;

    for (let r = 0; r < half && !found; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const x = half + dx;
          const y = half + dy;
          if (this.isLand(x, y)) {
            const h = this.world.heightmap[y * res + x] ?? 0;
            if (h > this.world.config.waterLevel && h < 0.65) {
              bestX = x;
              bestY = y;
              found = true;
              break;
            }
          }
        }
        if (found) break;
      }
    }

    return {
      x: bestX,
      y: bestY,
      stockpile: 20,
      totalCollected: 0,
      spawnCount: 0,
    };
  }

  private initialize(): void {
    const res = this.world.config.resolution;
    this.resources = [];
    this.agents = [];
    this.totalSpawnedResources = 0;

    // 1. Deterministic Resource Nodes Placement
    const candidateTiles: { x: number; y: number }[] = [];
    for (let y = 1; y < res - 1; y++) {
      for (let x = 1; x < res - 1; x++) {
        const distToBase = Math.hypot(x - this.base.x, y - this.base.y);
        if (distToBase > 3 && this.isLand(x, y)) {
          candidateTiles.push({ x, y });
        }
      }
    }

    // Pick deterministic positions using PRNG
    const numNodes = Math.min(this.config.resourceNodeCount, candidateTiles.length);
    for (let i = 0; i < numNodes; i++) {
      const idx = this.prng.nextInt(0, candidateTiles.length - 1);
      const pos = candidateTiles.splice(idx, 1)[0];
      const capacity = this.prng.nextInt(20, 40);
      this.resources.push({
        id: i + 1,
        x: pos.x,
        y: pos.y,
        remaining: capacity,
        maxCapacity: capacity,
      });
      this.totalSpawnedResources += capacity;
    }

    // 2. Initial Agents spawned at Colony Base
    for (let i = 0; i < this.config.initialAgents; i++) {
      this.agents.push({
        id: i + 1,
        type: 'gatherer',
        x: this.base.x,
        y: this.base.y,
        energy: 100,
        cargo: 0,
        state: 'foraging',
        targetX: null,
        targetY: null,
      });
    }

    this.base.spawnCount = this.agents.length;
    this.recordMetrics();
  }

  private emitEvent(
    entityId: number,
    type: SimulationEvent['type'],
    details: string,
    data: Record<string, unknown> = {}
  ): void {
    const event: SimulationEvent = {
      id: `${this.tick}-${this.seqCounter}`,
      tick: this.tick,
      seq: this.seqCounter++,
      entityId,
      type,
      details,
      data,
    };
    this.recentEvents.push(event);
    this.allEventHistory.push(event);
  }

  /**
   * Advance simulation by exactly 1 tick
   */
  public step(): SimulationSnapshot {
    this.tick++;
    this.seqCounter = 0;
    this.recentEvents = [];

    // Phase 1: Resource regeneration
    if (this.tick % 10 === 0) {
      for (const resNode of this.resources) {
        if (resNode.remaining < resNode.maxCapacity) {
          resNode.remaining++;
          this.totalSpawnedResources++;
        }
      }
    }

    // Phase 2: Agents act in strict ascending order of ID (Tie-breaking)
    const sortedAgents = [...this.agents].sort((a, b) => a.id - b.id);

    for (const agent of sortedAgents) {
      if (agent.energy <= 0) {
        if (agent.state !== 'exhausted') {
          agent.state = 'exhausted';
          this.emitEvent(agent.id, 'AGENT_EXHAUSTED', `Agent #${agent.id} ran out of energy at (${agent.x}, ${agent.y})`);
        }
        continue;
      }

      // Check if carrying maximum cargo -> must return to base
      if (agent.cargo >= 3) {
        agent.state = 'returning';
        agent.targetX = this.base.x;
        agent.targetY = this.base.y;
      }

      // Action: Returning to base
      if (agent.state === 'returning') {
        if (agent.x === this.base.x && agent.y === this.base.y) {
          // Deposit cargo
          const deposit = agent.cargo;
          agent.cargo = 0;
          this.base.stockpile += deposit;
          this.base.totalCollected += deposit;
          agent.energy = Math.min(100, agent.energy + 35);
          agent.state = 'foraging';
          agent.targetX = null;
          agent.targetY = null;
          this.emitEvent(
            agent.id,
            'CARGO_DEPOSITED',
            `Agent #${agent.id} deposited ${deposit} food at Colony Base. Recharged energy to ${agent.energy}.`,
            { deposited: deposit, stockpile: this.base.stockpile }
          );
        } else {
          this.moveAgentTowards(agent, this.base.x, this.base.y);
        }
        continue;
      }

      // Action: Foraging / Harvesting
      const activeNodes = this.resources.filter((r) => r.remaining > 0);
      if (activeNodes.length === 0) {
        // No resources left on island -> wander or return
        agent.state = 'returning';
        this.moveAgentTowards(agent, this.base.x, this.base.y);
        continue;
      }

      // Find closest resource node
      let closestNode: ResourceNode | null = null;
      let minDist = Infinity;
      for (const node of activeNodes) {
        const dist = Math.hypot(node.x - agent.x, node.y - agent.y);
        if (dist < minDist) {
          minDist = dist;
          closestNode = node;
        }
      }

      if (closestNode) {
        agent.targetX = closestNode.x;
        agent.targetY = closestNode.y;

        if (agent.x === closestNode.x && agent.y === closestNode.y) {
          // Harvest resource
          if (closestNode.remaining > 0) {
            closestNode.remaining--;
            agent.cargo++;
            agent.energy = Math.max(0, agent.energy - 1);
            agent.state = 'harvesting';
            this.emitEvent(
              agent.id,
              'RESOURCE_HARVESTED',
              `Agent #${agent.id} harvested 1 unit from Node #${closestNode.id} (${closestNode.remaining} left).`,
              { nodeId: closestNode.id, remaining: closestNode.remaining, cargo: agent.cargo }
            );

            if (agent.cargo >= 3) {
              agent.state = 'returning';
            }
          }
        } else {
          // Move towards node
          agent.state = 'foraging';
          this.moveAgentTowards(agent, closestNode.x, closestNode.y);
        }
      }
    }

    // Phase 3: Colony Base Update
    // Base Upkeep consumption
    if (this.tick % 8 === 0 && this.base.stockpile > 0) {
      this.base.stockpile--;
      this.totalConsumedUpkeep++;
      this.emitEvent(0, 'BASE_STOCKPILE_CHANGED', `Colony consumed 1 food for upkeep (${this.base.stockpile} remaining).`, {
        stockpile: this.base.stockpile,
      });
    }

    // Spawn new agent if threshold met and under population cap (max 25)
    if (this.base.stockpile >= this.config.spawnThreshold && this.agents.length < 25) {
      this.base.stockpile -= this.config.spawnThreshold;
      const newId = this.agents.length + 1;
      const newAgent: AgentState = {
        id: newId,
        type: 'gatherer',
        x: this.base.x,
        y: this.base.y,
        energy: 100,
        cargo: 0,
        state: 'foraging',
        targetX: null,
        targetY: null,
      };
      this.agents.push(newAgent);
      this.base.spawnCount++;
      this.emitEvent(
        newId,
        'AGENT_SPAWNED',
        `New Agent #${newId} spawned at Colony Base! Total population: ${this.agents.length}.`,
        { agentId: newId, population: this.agents.length }
      );
    }

    // Phase 4: Record metrics & verify invariants
    this.recordMetrics();
    this.assertInvariants();

    return this.getSnapshot();
  }

  private moveAgentTowards(agent: AgentState, targetX: number, targetY: number): void {
    const dx = Math.sign(targetX - agent.x);
    const dy = Math.sign(targetY - agent.y);

    // Try primary step
    const candX = agent.x + dx;
    const candY = agent.y + dy;

    if (this.isLand(candX, candY)) {
      agent.x = candX;
      agent.y = candY;
    } else if (dx !== 0 && this.isLand(agent.x + dx, agent.y)) {
      // Try horizontal step
      agent.x += dx;
    } else if (dy !== 0 && this.isLand(agent.x, agent.y + dy)) {
      // Try vertical step
      agent.y += dy;
    } else {
      // Blocked by water: try deterministic alternate neighbor
      const neighbors = [
        { x: agent.x + 1, y: agent.y },
        { x: agent.x - 1, y: agent.y },
        { x: agent.x, y: agent.y + 1 },
        { x: agent.x, y: agent.y - 1 },
      ];
      for (const n of neighbors) {
        if (this.isLand(n.x, n.y)) {
          agent.x = n.x;
          agent.y = n.y;
          break;
        }
      }
    }

    agent.energy = Math.max(0, agent.energy - this.config.agentEnergyBurn);
  }

  private recordMetrics(): void {
    const active = this.agents.filter((a) => a.energy > 0).length;
    const exhausted = this.agents.length - active;
    const remainingRes = this.resources.reduce((sum, r) => sum + r.remaining, 0);
    const avgEnergy =
      this.agents.length > 0 ? this.agents.reduce((sum, a) => sum + a.energy, 0) / this.agents.length : 0;

    const metric: SimulationMetrics = {
      tick: this.tick,
      activeAgents: active,
      exhaustedAgents: exhausted,
      totalStockpile: this.base.stockpile,
      totalHarvested: this.base.totalCollected,
      remainingResources: remainingRes,
      averageEnergy: Number(avgEnergy.toFixed(1)),
    };
    this.metricsHistory.push(metric);
  }

  /**
   * Strict Invariant Assertions
   */
  public assertInvariants(): void {
    // 1. Boundary & Terrain invariant: No agent on water
    for (const agent of this.agents) {
      if (!this.isLand(agent.x, agent.y)) {
        throw new Error(`Invariant Violated: Agent #${agent.id} at (${agent.x}, ${agent.y}) is in water or out of bounds!`);
      }
      if (agent.energy < 0 || agent.energy > 100) {
        throw new Error(`Invariant Violated: Agent #${agent.id} energy (${agent.energy}) is out of [0, 100]!`);
      }
    }

    // 2. Resource Conservation Check
    const inStockpile = this.base.stockpile;
    const inCargo = this.agents.reduce((sum, a) => sum + a.cargo, 0);
    const inNodes = this.resources.reduce((sum, r) => sum + r.remaining, 0);
    const totalCurrent = inStockpile + inCargo + inNodes + this.totalConsumedUpkeep;

    if (totalCurrent > this.totalSpawnedResources + 20) {
      // 20 is initial stockpile
      throw new Error(`Invariant Violated: Resources generated (${totalCurrent}) exceeds total spawned (${this.totalSpawnedResources + 20})!`);
    }
  }

  /**
   * Return immutable deep snapshot with CRC32 checksum
   */
  public getSnapshot(): SimulationSnapshot {
    const currentMetric = this.metricsHistory[this.metricsHistory.length - 1] ?? {
      tick: this.tick,
      activeAgents: this.agents.length,
      exhaustedAgents: 0,
      totalStockpile: this.base.stockpile,
      totalHarvested: 0,
      remainingResources: 0,
      averageEnergy: 100,
    };

    // Serialize state into byte stream for checksum
    const stateStr = JSON.stringify({
      tick: this.tick,
      base: this.base,
      agents: this.agents.map((a) => ({ id: a.id, x: a.x, y: a.y, e: a.energy, c: a.cargo, s: a.state })),
      resources: this.resources.map((r) => ({ id: r.id, rem: r.remaining })),
    });
    const bytes = new TextEncoder().encode(stateStr);
    const checksum = calculateCRC32(bytes);

    return {
      seed: this.config.seed,
      tick: this.tick,
      worldConfig: this.world.config,
      base: { ...this.base },
      resources: this.resources.map((r) => ({ ...r })),
      agents: this.agents.map((a) => ({ ...a })),
      events: [...this.recentEvents],
      metrics: { ...currentMetric },
      checksum,
    };
  }

  public getMetricsHistory(): SimulationMetrics[] {
    return [...this.metricsHistory];
  }

  public getAllEventHistory(): SimulationEvent[] {
    return [...this.allEventHistory];
  }

  public getTick(): number {
    return this.tick;
  }
}
