import React, { useState } from 'react';
import { SimulationSnapshot } from '../../../contracts/types';
import { X, BookmarkPlus, Scale, CheckCircle2 } from 'lucide-react';

interface RunComparisonModalProps {
  currentSnapshot: SimulationSnapshot;
  onClose: () => void;
}

export const RunComparisonModal: React.FC<RunComparisonModalProps> = ({
  currentSnapshot,
  onClose,
}) => {
  const [bookmarkedRun, setBookmarkedRun] = useState<SimulationSnapshot | null>(null);

  const handleBookmark = () => {
    setBookmarkedRun({ ...currentSnapshot });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full p-6 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-slate-100">Compare Two Simulation Runs</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Lưu vết (Bookmark) một lần chạy làm mốc tham chiếu (Run A), sau đó tiếp tục điều chỉnh Seed hoặc tham số để so sánh độ chênh lệch kết quả với Run B.
        </p>

        <div className="grid grid-cols-2 gap-4 text-xs font-mono mb-6">
          {/* Run A Column */}
          <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
              <span className="font-bold text-sky-400">Run A (Reference)</span>
              {bookmarkedRun ? (
                <span className="text-[10px] text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Saved</span>
                </span>
              ) : (
                <button
                  onClick={handleBookmark}
                  className="flex items-center space-x-1 text-[11px] px-2 py-0.5 bg-accent text-slate-950 font-bold rounded"
                >
                  <BookmarkPlus className="w-3 h-3" />
                  <span>Save Current</span>
                </button>
              )}
            </div>

            {bookmarkedRun ? (
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Seed:</span>
                  <span>{bookmarkedRun.seed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tick:</span>
                  <span>{bookmarkedRun.tick}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Colony Stockpile:</span>
                  <span className="text-amber-400 font-bold">{bookmarkedRun.base.stockpile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Harvested:</span>
                  <span>{bookmarkedRun.base.totalCollected}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Agents:</span>
                  <span>{bookmarkedRun.metrics.activeAgents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Avg Energy:</span>
                  <span>{bookmarkedRun.metrics.averageEnergy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">CRC32:</span>
                  <span className="text-emerald-400">
                    0x{bookmarkedRun.checksum.toString(16).toUpperCase()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">Chưa lưu Run A làm mốc.</div>
            )}
          </div>

          {/* Run B Column */}
          <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
              <span className="font-bold text-purple-400">Run B (Current Live)</span>
              <span className="text-[10px] text-slate-500">Live State</span>
            </div>

            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Seed:</span>
                <span>{currentSnapshot.seed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tick:</span>
                <span>{currentSnapshot.tick}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Colony Stockpile:</span>
                <span className="text-amber-400 font-bold">{currentSnapshot.base.stockpile}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Harvested:</span>
                <span>{currentSnapshot.base.totalCollected}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active Agents:</span>
                <span>{currentSnapshot.metrics.activeAgents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Avg Energy:</span>
                <span>{currentSnapshot.metrics.averageEnergy}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CRC32:</span>
                <span className="text-emerald-400">
                  0x{currentSnapshot.checksum.toString(16).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          {bookmarkedRun && (
            <button
              onClick={() => setBookmarkedRun(null)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
            >
              Clear Run A
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-slate-950 font-bold rounded-lg text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
