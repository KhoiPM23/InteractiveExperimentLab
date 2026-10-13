# ARCHITECTURE.md

## High-Level Architecture
InteractiveExperimentLab is structured as an **Integrated Pipeline Workbench** using React 18, Vite, TypeScript, and Three.js.

```
+--------------------------------------------------------------------+
|                InteractiveExperimentLab Shell                      |
|  - Workspace Navigation (Tabs)                                     |
|  - Shared Lifecycle & Seed Management (Zustand: useExperimentStore)|
+--------------------------------------------------------------------+
          |                            |                     |
          v                            v                     v
+--------------------+       +-------------------+  +----------------+
| Procedural Worlds  | ----> | Systems Sim       |->| Binary Lab     |
| - Three.js WebGL   |       | - DES Engine (TS) |  | - Hex Viewer   |
| - Mulberry32 Noise |       | - 2D Canvas Map   |  | - AST Parsing  |
| - CRC32 Heightmap  |       | - Deep Snapshot   |  | - CRC32 Audit  |
+--------------------+       +-------------------+  +----------------+
```

## Module Boundaries
- `src/contracts/`: Data contracts, metadata, PRNG interfaces, simulation event schemas, and binary AST definitions (`types.ts`).
- `src/core/prng/`: Deterministic Mulberry32 32-bit algorithm (`mulberry32.ts`) and Fractal Brownian Motion (FBM) noise.
- `src/core/math/`: High-performance IEEE 802.3 CRC32 checksum calculator (`crc32.ts`).
- `src/core/state/`: Zustand centralized reactive state store (`useExperimentStore.ts`).
- `src/components/shell/`: Shell topbar, status indicators, tabs, and error boundary banner (`AppShell.tsx`, `States.tsx`).
- `src/modules/world/`: 3D procedural terrain generator, Three.js WebGL orbit viewport, dynamic vertex coloring, and control panels (`worldGenerator.ts`, `WorldViewport.tsx`, `WorldControls.tsx`).
- `src/modules/simulation/`: Deterministic Discrete-Event Simulation engine, HTML5 canvas 2D island map, simulation controls, real-time metrics, event streaming, and run comparator (`simulationEngine.ts`, `SimulationMap.tsx`, `SimulationControls.tsx`, `SimulationMetricsPanel.tsx`, `RunComparisonModal.tsx`).
- `src/modules/binary/`: `.ielb` binary serializer, Kaitai-style AST parser, virtualized HexViewer, byte inspector, and corruption testing (`serializer.ts`, `binaryParser.ts`, `HexViewer.tsx`, `BinaryPlaygroundView.tsx`).

## Data Flow Pipeline
1. **World Generation:** `WorldControls` dispatches `WorldConfig` -> `generateWorld()` calculates heightmap using `Mulberry32` -> computes CRC32 -> Three.js renders 3D mesh.
2. **Simulation Initialization:** `SystemsObservatoryView` mounts `SimulationEngine` with `WorldData` -> agent and colony placed on valid land coordinates -> simulation advances discrete ticks -> captures `SimulationSnapshot`.
3. **Binary Serialization:** `AppShell` streams `SimulationSnapshot` to `serializeSimulationSnapshot()` -> generates `.ielb` byte array with header, directory, records, and CRC32 tail -> `BinaryPlaygroundView` renders interactive hex view and parses AST.
