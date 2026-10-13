# InteractiveExperimentLab

> **A high-performance, deterministic, local-first scientific experiment workbench running entirely in the browser.**

InteractiveExperimentLab unites three core exploration experiences into a single seamless pipeline:
1. **Procedural Worlds Lab:** 3D procedural terrain generated via deterministic PRNG and Fractal Brownian Motion (FBM) noise.
2. **Interactive Systems Observatory:** Discrete-event colony simulation with deterministic tie-breaking, invariant conservation, real-time tracking, and event streaming.
3. **Binary & Protocol Playground:** Low-level `.ielb` byte inspection featuring a virtualized hex viewer, Kaitai-style AST field inspector, and real-time CRC32 bit-corruption detection.

---

## ⚡ Quick Start

### Prerequisites
- **Node.js:** v18.0.0 or later (v20+ recommended)
- **npm:** v9.0.0 or later
- **Modern Web Browser:** Chrome, Edge, Firefox, or Safari with WebGL 2.0 support.

### Installation & Run

```bash
# 1. Clone repository
git clone https://github.com/KhoiPM23/InteractiveExperimentLab.git
cd InteractiveExperimentLab

# 2. Install dependencies (offline-friendly, zero native build tools required)
npm install

# 3. Start local development server
npm run dev
# The workbench is live at http://localhost:5185/

# 4. Run automated test suites (22/22 unit tests)
npm test

# 5. Typecheck & production build
npm run lint    # tsc --noEmit
npm run build   # tsc && vite build
```

---

## 🧩 Core Modules & Features

### 1. Procedural Worlds Lab
- **Deterministic PRNG:** Powered by Mulberry32 32-bit PRNG (`src/core/prng/mulberry32.ts`). Identical seeds produce bit-for-bit identical heightmaps.
- **Fractal Noise Engine:** Configurable octaves (1–6), persistence (0.1–0.9), lacunarity (1.5–3.5), radial island falloff, and peak multipliers.
- **Three.js WebGL Viewport:** Interactive 3D terrain mesh with orbit camera controls, height-based dynamic biome coloring (Deep Ocean, Shallow, Sand, Grassland, Forest, Rock, Snow), wireframe toggle, and auto-rotation.
- **Checksum Verification:** Computes live CRC32 checksums of the terrain heightmap for exact verification.

### 2. Interactive Systems Observatory
- **Discrete-Event Simulation (DES):** Colony gatherer agents collecting resources on procedural islands under strict physical invariants.
- **Invariant Guarantees:** 
  - Agents cannot traverse water or navigate out of bounds.
  - Energy levels strictly clamped to `[0, 100]`.
  - Resource conservation: total resources across stockpile, agent cargo, and active nodes strictly balance against initial spawn.
- **Interactive Map:** HTML5 Canvas rendering terrain heightmap, colony fortress, resource clusters, agent status rings, and destination path lines.
- **Lifecycle Controls:** Play, Pause, Step (+1 tick), Fast-Forward (+10 ticks), Reset, and variable speed (1x, 2x, 5x).
- **Run Comparison:** Side-by-side run bookmarking to compare diverging parameters.

### 3. Binary & Protocol Playground
- **`.ielb` Binary Specification:** Custom binary format with magic header (`IELB`), versioning, endianness marker (`0xFEFF`), section table, agent/resource record arrays, and trailing CRC32 checksum.
- **Virtualized Hex Viewer:** Smooth 60 FPS scrolling over raw byte arrays with offset addresses and ASCII representation.
- **Bidirectional Field Inspector:** Clicking any byte in HexViewer highlights its corresponding field in the AST inspector; clicking any AST section highlights its exact byte slice.
- **Integrity Testing & QA:** Built-in "Simulate Bit Corruption" flips payload bits to demonstrate live CRC32 integrity detection, and "Restore Original Snapshot" verifies clean state recovery.
- **Import / Export:** Export `.ielb` snapshots or upload existing `.ielb` binaries directly from disk.

---

## 🏗 Architecture Summary

InteractiveExperimentLab runs **100% client-side** with zero backend infrastructure and zero native C++ binaries:

```
+---------------------------------------------------------------------------------+
|                       InteractiveExperimentLab App Shell                        |
|  - Workspace Navigation Tabs ('world' | 'simulation' | 'binary')                |
|  - Centralized Reactive State Store (Zustand: useExperimentStore)               |
+---------------------------------------------------------------------------------+
          |                                   |                              |
          v                                   v                              v
+-----------------------+       +---------------------------+       +-------------------+
|   Procedural Worlds   | ----> |    Systems Observatory    | ----> |  Binary Lab       |
| - Three.js WebGL      |       | - Discrete-Event Engine   |       | - Virtualized Hex |
| - Mulberry32 Noise    |       | - 2D Canvas Map & Metrics |       | - AST Inspector   |
| - CRC32 Heightmap     |       | - Snapshot Generator      |       | - CRC32 Checker   |
+-----------------------+       +---------------------------+       +-------------------+
```

---

## 🧪 Testing & Verification

| Test Suite | Tests | Scope | Status |
|---|---|---|---|
| `tests/prng.test.ts` | 4 | Mulberry32 PRNG determinism, bounds `[0, 1)`, seed divergence | PASS |
| `tests/reproducibility.test.ts` | 6 | Bit-for-bit terrain reproducibility, CRC32 stability, performance budgets | PASS |
| `tests/simulation.test.ts` | 6 | DES loop determinism, resource conservation, boundary invariants, event ordering | PASS |
| `tests/binary.test.ts` | 6 | `.ielb` serialization, AST parsing, round-trip integrity, CRC32 bit corruption | PASS |
| **Total** | **22** | **Full end-to-end coverage across all 3 modules** | **100% PASS** |

---

## 📄 License & Third-Party Notices

This project is licensed under the MIT License. All dependencies (React, Three.js, Zustand, Lucide-react, Tailwind CSS, Vite, Vitest) use permissive MIT / Apache-2.0 licenses. See [THIRD_PARTY_NOTICES.md](file:///d:/Personal_Projects/New%20Project/THIRD_PARTY_NOTICES.md) for full attribution details.
