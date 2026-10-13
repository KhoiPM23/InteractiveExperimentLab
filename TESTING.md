# TESTING.md

## Testing Strategy & Verification Guide

### Verification Commands
```bash
# 1. Run all unit test suites (22 tests)
npm test

# 2. Strict static analysis & typecheck (0 errors)
npm run lint

# 3. Production bundle build (0 errors)
npm run build

# 4. Start local development server
npm run dev
# Open in browser: http://localhost:5185/
```

---

### Automated Test Suites (Vitest)

#### 1. `tests/prng.test.ts` (4 tests)
- Verifies Mulberry32 produces identical sequence for same seed across 1,000 samples.
- Verifies different seeds generate divergent pseudo-random sequences.
- Verifies strict float bounds `[0, 1)`.
- Verifies integer generation bounds `[min, max]`.

#### 2. `tests/reproducibility.test.ts` (6 tests)
- Verifies bit-for-bit identical heightmaps and CRC32 checksums for identical seeds.
- Verifies seed changes result in divergent terrain geometry and checksums.
- Verifies resolution scaling across 32x32, 64x64, and 128x128 meshes.
- Verifies heightmap normalization strictly within `[0, 1]`.
- Verifies generation time performance budget (< 40ms on 64x64).

#### 3. `tests/simulation.test.ts` (6 tests)
- Verifies discrete-event simulation produces identical state traces when given identical seed & world.
- Verifies clean reset to Tick 0 restoring initial conditions.
- Verifies physical boundary invariants (no water walking, valid energy clamping).
- Verifies resource conservation (stockpile + cargo + remaining nodes balance against initial spawn).
- Verifies deterministic event sequence numbers and tie-breaking order.
- Verifies snapshot explainability and CRC32 stability.

#### 4. `tests/binary.test.ts` (6 tests)
- Verifies serialization into strict `.ielb` binary layout with magic header `IELB`, version 1, and endianness marker `0xFEFF`.
- Verifies parser extracts valid Kaitai-style AST and verifies trailing CRC32 checksum.
- Verifies round-trip data fidelity for agent and resource record arrays.
- Verifies single-bit corruption detection via CRC32 integrity check.
- Verifies descriptive error rejection on corrupted magic bytes.
- Verifies rejection of truncated buffers (< 50 bytes).

---

### Manual Verification Procedure

1. **Procedural Worlds Lab (`Tab 1`):**
   - Click "Randomize Seed": observe new seed value and instant terrain update.
   - Adjust "Water Level" and "Peak Exponent": observe real-time heightmap recoloring and mesh updates.
   - Verify live CRC32 checksum displayed in bottom status bar and control panel.
2. **Interactive Systems Observatory (`Tab 2`):**
   - Click "Play": observe agents moving across land, gathering energy, and returning cargo to base.
   - Click "Step (+1)": observe single deterministic tick advance and event log entry addition.
   - Click "Bookmark Run A", advance ticks, and click "Compare Runs": observe side-by-side metric comparison.
3. **Binary & Protocol Playground (`Tab 3`):**
   - Verify green "CRC32 Checksum Verified" badge.
   - Click any byte in the Hex Viewer: observe offset, hex/dec, binary, and ASCII decoding in the inspector.
   - Click "Simulate Bit Corruption": observe immediate flip to red "Integrity Mismatch (Corrupted)" badge.
   - Click "Restore Original Snapshot": verify return to verified state.
   - Click "Export .ielb": verify binary file downloads properly.
