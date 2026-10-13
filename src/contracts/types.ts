/**
 * Core Contracts & Type Definitions for InteractiveExperimentLab
 * Strict boundaries, zero unnecessary abstractions.
 */

// --- 1. PRNG & Determinism Contract ---
export interface PRNG {
  nextFloat(): number; // [0, 1)
  nextInt(min: number, max: number): number; // [min, max]
  getSeed(): number;
}

// --- 2. Experiment Lifecycle & Metadata ---
export type ExperimentCategory =
  | 'procedural-world'
  | 'systems-simulation'
  | 'binary-protocol'
  | 'connected-pipeline';

export type RunStatus = 'idle' | 'generating' | 'running' | 'paused' | 'completed' | 'error';

export interface ExperimentMetadata {
  readonly id: string;
  readonly name: string;
  readonly category: ExperimentCategory;
  readonly createdAt: number;
  readonly seed: number;
}

export interface RunLifecycleState {
  status: RunStatus;
  currentTick: number;
  totalTicks?: number;
  stepDeltaMs: number;
  lastError?: string | null;
}

// --- 3. Procedural Worlds Contract ---
export interface WorldConfig {
  seed: number;
  resolution: number; // e.g., 64 (64x64) or 128 (128x128)
  scale: number; // noise scale frequency (0.01 - 0.1)
  octaves: number; // 1 - 6
  persistence: number; // 0.1 - 0.9
  lacunarity: number; // 1.5 - 3.5
  islandFalloff: boolean; // whether edges taper to water
  waterLevel: number; // 0.0 - 0.5
  peakMultiplier: number; // 1.0 - 3.0
}

export interface TerrainMetrics {
  minHeight: number;
  maxHeight: number;
  averageHeight: number;
  waterCoverageRatio: number;
  generationTimeMs: number;
}

export interface WorldData {
  config: WorldConfig;
  heightmap: Float32Array; // resolution * resolution
  metrics: TerrainMetrics;
  checksum: number; // CRC32 of heightmap data for determinism verification
}

// --- 4. Systems Observatory Contract ---
export type AgentActionState = 'idle' | 'foraging' | 'harvesting' | 'returning' | 'exhausted';

export interface AgentState {
  id: number;
  type: 'gatherer' | 'base';
  x: number;
  y: number;
  energy: number; // 0 - 100
  cargo: number; // 0 - 5
  state: AgentActionState;
  targetX: number | null;
  targetY: number | null;
}

export interface ResourceNode {
  id: number;
  x: number;
  y: number;
  remaining: number;
  maxCapacity: number;
}

export interface ColonyBase {
  x: number;
  y: number;
  stockpile: number;
  totalCollected: number;
  spawnCount: number;
}

export type SimulationEventType =
  | 'AGENT_MOVED'
  | 'RESOURCE_HARVESTED'
  | 'CARGO_DEPOSITED'
  | 'AGENT_SPAWNED'
  | 'AGENT_EXHAUSTED'
  | 'BASE_STOCKPILE_CHANGED';

export interface SimulationEvent {
  id: string; // tick-seq
  tick: number;
  seq: number; // deterministic tie-breaker
  entityId: number;
  type: SimulationEventType;
  details: string;
  data: Record<string, unknown>;
}

export interface SimulationConfig {
  seed: number;
  initialAgents: number; // 5 - 30
  resourceNodeCount: number; // 5 - 25
  agentEnergyBurn: number; // energy per move
  spawnThreshold: number; // food required to spawn next agent
  maxTicks: number; // 50 - 500
}

export interface SimulationMetrics {
  tick: number;
  activeAgents: number;
  exhaustedAgents: number;
  totalStockpile: number;
  totalHarvested: number;
  remainingResources: number;
  averageEnergy: number;
}

export interface SimulationSnapshot {
  seed: number;
  tick: number;
  worldConfig: WorldConfig;
  base: ColonyBase;
  resources: ResourceNode[];
  agents: AgentState[];
  events: SimulationEvent[];
  metrics: SimulationMetrics;
  checksum: number; // CRC32 of snapshot state
}


// --- 5. Binary & Protocol Playground Contract ---
export interface BinarySection {
  name: string;
  offset: number;
  length: number;
  hexValue: string;
  decodedValue: string | number;
}

export interface ParsedBinaryAST {
  magic: string;
  version: number;
  seed: number;
  tick: number;
  sections: BinarySection[];
  checksumValid: boolean;
}
