# PROJECT_CONTEXT.md

## Project Identity
- **Name:** InteractiveExperimentLab
- **Repository:** https://github.com/KhoiPM23/InteractiveExperimentLab.git
- **Primary Goal:** High-performance, unified, local-first interactive digital workbench combining:
  1. Procedural Worlds Lab (Seed & noise-driven 3D worlds)
  2. Interactive Systems Observatory (DES simulator with pause/step & timeline)
  3. Binary & Protocol Playground (Byte offset, AST and protocol inspector)

## Architecture Principles
1. **Local-first & Zero Backend:** 100% Client-side execution in browser or lightweight desktop shell.
2. **Deterministic Reproducibility:** Bit-for-bit identical output from Mulberry32 PRNG given identical seed & config.
3. **Hardware Optimized:** Tailored for Intel Iris Xe integrated graphics and 16 GB RAM (< 500 MB footprint, >= 55 FPS).
4. **Clean Boundaries (SOLID / KISS / YAGNI):** No premature abstractions. Independent modules bound by shared minimal contracts.
