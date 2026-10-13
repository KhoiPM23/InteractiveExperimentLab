import React, { useRef, useMemo, useState } from 'react';

interface HexViewerProps {
  bytes: Uint8Array;
  highlightRange: [number, number] | null; // [startOffset, length]
  onByteClick?: (offset: number) => void;
}

const BYTES_PER_ROW = 16;
const ROW_HEIGHT = 22;
const VISIBLE_ROWS_BUFFER = 30;

export const HexViewer: React.FC<HexViewerProps> = ({ bytes, highlightRange, onByteClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalRows = Math.ceil(bytes.length / BYTES_PER_ROW);
  const totalHeight = totalRows * ROW_HEIGHT;

  const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 5);
  const endRow = Math.min(totalRows, startRow + VISIBLE_ROWS_BUFFER);

  const visibleRows = useMemo(() => {
    const rows = [];
    for (let r = startRow; r < endRow; r++) {
      const offset = r * BYTES_PER_ROW;
      const slice = bytes.subarray(offset, Math.min(offset + BYTES_PER_ROW, bytes.length));
      rows.push({
        rowIndex: r,
        offset,
        slice,
      });
    }
    return rows;
  }, [bytes, startRow, endRow]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const isHighlighted = (offset: number): boolean => {
    if (!highlightRange) return false;
    const [start, len] = highlightRange;
    return offset >= start && offset < start + len;
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="relative w-full h-full overflow-y-auto bg-slate-950 font-mono text-xs select-text border border-slate-800 rounded-lg p-3"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${startRow * ROW_HEIGHT}px)` }}>
          {visibleRows.map(({ offset, slice }) => {
            const hexOffset = offset.toString(16).padStart(8, '0').toUpperCase();

            return (
              <div
                key={offset}
                className="flex items-center space-x-4 h-[22px] hover:bg-slate-900/60 transition-colors"
              >
                {/* 1. Address Offset */}
                <span className="text-slate-500 font-bold select-none w-20 shrink-0">
                  {hexOffset}:
                </span>

                {/* 2. Hex Values (16 bytes split into 8 + 8) */}
                <div className="flex space-x-1.5 shrink-0">
                  {Array.from({ length: BYTES_PER_ROW }).map((_, i) => {
                    const byteOffset = offset + i;
                    if (i >= slice.length) {
                      return (
                        <span key={i} className="w-5 text-center text-transparent select-none">
                          ..
                        </span>
                      );
                    }

                    const b = slice[i];
                    const hexStr = b.toString(16).padStart(2, '0').toUpperCase();
                    const highlighted = isHighlighted(byteOffset);

                    return (
                      <span
                        key={i}
                        onClick={() => onByteClick?.(byteOffset)}
                        className={`w-5 text-center cursor-pointer transition-colors ${
                          highlighted
                            ? 'bg-accent text-slate-950 font-bold rounded-sm'
                            : b === 0
                            ? 'text-slate-600 hover:text-slate-300'
                            : 'text-slate-200 hover:bg-slate-800 rounded-sm'
                        }`}
                      >
                        {hexStr}
                      </span>
                    );
                  })}
                </div>

                {/* 3. ASCII Representation */}
                <div className="flex space-x-0.5 text-slate-400 select-none pl-3 border-l border-slate-800">
                  {Array.from(slice).map((b, i) => {
                    const byteOffset = offset + i;
                    const char = b >= 32 && b <= 126 ? String.fromCharCode(b) : '·';
                    const highlighted = isHighlighted(byteOffset);

                    return (
                      <span
                        key={i}
                        onClick={() => onByteClick?.(byteOffset)}
                        className={`w-3 text-center cursor-pointer ${
                          highlighted
                            ? 'bg-accent text-slate-950 font-bold rounded-sm'
                            : 'hover:text-slate-200'
                        }`}
                      >
                        {char}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
