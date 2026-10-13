import React, { useState, useMemo } from 'react';
import { parseIELBBinary, ParsedIELBResult } from '../binaryParser';
import { HexViewer } from './HexViewer';
import { BinarySection } from '../../../contracts/types';
import {
  Binary,
  ShieldCheck,
  ShieldAlert,
  Download,
  Upload,
  AlertTriangle,
  RotateCcw,
  Layers,
  Search,
} from 'lucide-react';

interface BinaryPlaygroundViewProps {
  initialBytes: Uint8Array | null;
  onUploadCustomBytes?: (bytes: Uint8Array) => void;
}

export const BinaryPlaygroundView: React.FC<BinaryPlaygroundViewProps> = ({
  initialBytes,
  onUploadCustomBytes,
}) => {
  const [activeBytes, setActiveBytes] = useState<Uint8Array | null>(initialBytes);
  const [selectedSection, setSelectedSection] = useState<BinarySection | null>(null);
  const [inspectedByteOffset, setInspectedByteOffset] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialBytes) {
      setActiveBytes(initialBytes);
    }
  }, [initialBytes]);

  // Parse binary data
  const parseResult: ParsedIELBResult | null = useMemo(() => {
    if (!activeBytes || activeBytes.length === 0) return null;
    try {
      setErrorMsg(null);
      return parseIELBBinary(activeBytes);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse binary format';
      setErrorMsg(msg);
      return null;
    }
  }, [activeBytes]);

  // Highlight range based on selected section or single clicked byte
  const highlightRange: [number, number] | null = useMemo(() => {
    if (selectedSection) {
      return [selectedSection.offset, selectedSection.length];
    }
    if (inspectedByteOffset !== null) {
      return [inspectedByteOffset, 1];
    }
    return null;
  }, [selectedSection, inspectedByteOffset]);

  const handleDownload = () => {
    if (!activeBytes) return;
    const blob = new Blob([activeBytes as BlobPart], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `experiment-snapshot-${parseResult?.ast.tick ?? 0}.ielb`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        const bytes = new Uint8Array(reader.result);
        setActiveBytes(bytes);
        onUploadCustomBytes?.(bytes);
        setSelectedSection(null);
        setInspectedByteOffset(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Hardening & Security verification: Corrupt 1 byte to test CRC32 detection
  const handleCorruptByte = () => {
    if (!activeBytes) return;
    const corrupted = new Uint8Array(activeBytes);
    // Corrupt seed or tick byte
    corrupted[10] = (corrupted[10] ^ 0xff) >>> 0;
    setActiveBytes(corrupted);
  };

  const handleRestoreClean = () => {
    if (initialBytes) {
      setActiveBytes(new Uint8Array(initialBytes));
      setErrorMsg(null);
    }
  };

  const handleByteClick = (offset: number) => {
    setInspectedByteOffset(offset);
    if (!parseResult) return;
    const matchingSection = parseResult.ast.sections.find(
      (s) => offset >= s.offset && offset < s.offset + s.length
    );
    setSelectedSection(matchingSection ?? null);
  };

  // Byte details card
  const selectedByteVal =
    activeBytes && inspectedByteOffset !== null && inspectedByteOffset < activeBytes.length
      ? activeBytes[inspectedByteOffset]
      : null;

  return (
    <div className="flex w-full h-full overflow-hidden select-none">
      {/* Left Sidebar: File Info & Controls */}
      <aside className="w-80 shrink-0 h-full bg-surface border-r border-slate-800 text-slate-200 overflow-y-auto p-4 space-y-5 text-xs">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Binary className="w-5 h-5 text-accent" />
            <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-100">
              Binary & Protocol
            </h2>
          </div>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
            {activeBytes ? `${activeBytes.length} B` : '0 B'}
          </span>
        </div>

        {/* Integrity Badge */}
        {parseResult && (
          <div
            className={`p-3 rounded-lg border flex items-center space-x-2.5 ${
              parseResult.checksumMatches
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                : 'bg-red-950/40 border-red-800 text-red-200'
            }`}
          >
            {parseResult.checksumMatches ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <div className="font-mono text-[11px]">
              <span className="font-bold block">
                {parseResult.checksumMatches ? 'CRC32 Checksum Verified' : 'Integrity Mismatch (Corrupted)'}
              </span>
              <span className="text-[10px] opacity-80">
                0x{parseResult.expectedCRC.toString(16).toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* File Actions */}
        <div className="space-y-2">
          <label className="block text-slate-400 font-medium">Artifact Operations</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownload}
              disabled={!activeBytes}
              className="flex items-center justify-center space-x-1.5 py-2 px-2.5 bg-surface-elevated hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 transition disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              <span>Export .ielb</span>
            </button>

            <label className="flex items-center justify-center space-x-1.5 py-2 px-2.5 bg-surface-elevated hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 transition cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span>Import .ielb</span>
              <input type="file" accept=".ielb,.bin" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Robustness & Security Hardening Actions */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <label className="block text-slate-400 font-medium">Robustness & Integrity Testing</label>
          <div className="space-y-1.5">
            <button
              onClick={handleCorruptByte}
              disabled={!activeBytes}
              className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800 rounded-lg text-red-300 transition text-[11px] disabled:opacity-40"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>Simulate Bit Corruption (Test QA)</span>
            </button>

            <button
              onClick={handleRestoreClean}
              disabled={!initialBytes}
              className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2.5 bg-surface-elevated hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition text-[11px] disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Original Snapshot</span>
            </button>
          </div>
        </div>

        {/* Byte Inspector Tooltip */}
        {selectedByteVal !== null && inspectedByteOffset !== null && (
          <div className="p-3 bg-slate-900 rounded-lg border border-accent/40 space-y-1.5 font-mono text-[11px]">
            <span className="font-bold text-accent block">Inspected Byte</span>
            <div className="flex justify-between text-slate-400">
              <span>Offset:</span>
              <span className="text-slate-100">
                0x{inspectedByteOffset.toString(16).toUpperCase()} ({inspectedByteOffset})
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Hex / Dec:</span>
              <span className="text-slate-100">
                0x{selectedByteVal.toString(16).padStart(2, '0').toUpperCase()} / {selectedByteVal}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Binary:</span>
              <span className="text-slate-100">{selectedByteVal.toString(2).padStart(8, '0')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>ASCII:</span>
              <span className="text-slate-100">
                {selectedByteVal >= 32 && selectedByteVal <= 126
                  ? `'${String.fromCharCode(selectedByteVal)}'`
                  : '<non-printable>'}
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* Center: Virtualized Hex View */}
      <main className="flex-1 h-full p-4 flex flex-col bg-background overflow-hidden">
        {errorMsg ? (
          <div className="p-4 bg-red-950/40 border border-red-800 rounded-lg text-red-200 font-mono text-xs mb-3">
            <span className="font-bold block mb-1">Error Parsing Binary Buffer:</span>
            {errorMsg}
          </div>
        ) : null}

        {activeBytes ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2 px-1">
              <span>Raw Byte Stream (Click byte to inspect / link to AST)</span>
              <span>Total: {activeBytes.length} bytes</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <HexViewer
                bytes={activeBytes}
                highlightRange={highlightRange}
                onByteClick={handleByteClick}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs font-mono">
            <Search className="w-8 h-8 mb-2 opacity-50" />
            <span>No binary snapshot loaded. Run simulation and click "Snapshot & Inspect" or Import a .ielb file.</span>
          </div>
        )}
      </main>

      {/* Right Sidebar: AST Structure Tree */}
      <aside className="w-84 shrink-0 h-full bg-surface border-l border-slate-800 text-slate-200 overflow-y-auto p-4 space-y-4 text-xs select-none">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-accent" />
            <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-100">
              AST Field Inspector
            </h2>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {parseResult?.ast.sections.length ?? 0} fields
          </span>
        </div>

        {parseResult ? (
          <div className="space-y-1.5 font-mono text-[11px]">
            {parseResult.ast.sections.map((sec, idx) => {
              const isSelected = selectedSection?.name === sec.name;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedSection(sec);
                    setInspectedByteOffset(null);
                  }}
                  className={`p-2.5 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? 'bg-accent/15 border-accent text-accent font-bold'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-100 font-semibold truncate">{sec.name}</span>
                    <span className="text-[10px] text-slate-500 shrink-0 font-normal">
                      0x{sec.offset.toString(16).toUpperCase()} ({sec.length}B)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 truncate max-w-[150px]">{sec.decodedValue}</span>
                    <span className="text-slate-500 truncate max-w-[100px]">{sec.hexValue}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-slate-500 text-center py-12">No AST fields available.</div>
        )}
      </aside>
    </div>
  );
};
