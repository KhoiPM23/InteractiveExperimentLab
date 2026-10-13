# DECISIONS.md (Architecture Decision Records)

## ADR-01: Integrated Pipeline Workbench Pattern
- **Decision:** Use an App Shell with 3 tabs connected by an end-to-end data pipeline (`World -> Sim -> Binary`).
- **Rationale:** Keeps each module independently testable and maintainable while providing a coherent demo story.

## ADR-02: Zero Python / Zero Native C++ Backend
- **Decision:** Implement all algorithms (PRNG, FBM noise, DES loop, buffer parsing) purely in TypeScript.
- **Rationale:** 100% offline, zero installation burden, zero IPC latency, perfectly suited for standard web browsers and Intel Iris Xe.

## ADR-03: Deterministic Mulberry32 PRNG
- **Decision:** Replace `Math.random()` with Mulberry32 32-bit PRNG.
- **Rationale:** Bit-for-bit repeatability across platforms and identical CRC32 checksums for reproducible science experiments.

## ADR-04: Custom `.ielb` Binary Specification with Trailing CRC32
- **Decision:** Define a deterministic, self-describing binary format with a 46-byte header, section directory table, packed record entries, and 4-byte CRC32 trailer.
- **Rationale:** Demonstrates low-level protocol encoding and byte alignment without heavy external protocol-buffer runtimes, allowing instantaneous client-side byte inspections.

## ADR-05: Virtualized Windowing for Hex Viewer
- **Decision:** Implement windowed DOM row rendering in `HexViewer.tsx` (only rendering visible rows + buffer).
- **Rationale:** Guarantees locked 60 FPS scrolling and negligible memory overhead even when inspecting thousands of bytes.
