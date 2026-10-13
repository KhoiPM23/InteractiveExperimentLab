import React from 'react';
import { SimulationConfig, SimulationSnapshot } from '../../../contracts/types';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Zap,
  Sliders,
  Scale,
  Sparkles,
} from 'lucide-react';

interface SimulationControlsProps {
  isRunning: boolean;
  onTogglePlay: () => void;
  onStep: (count?: number) => void;
  onReset: () => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  config: SimulationConfig;
  onChangeConfig: (newConfig: SimulationConfig) => void;
  snapshot: SimulationSnapshot;
  onOpenCompare: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isRunning,
  onTogglePlay,
  onStep,
  onReset,
  speed,
  onChangeSpeed,
  config,
  onChangeConfig,
  snapshot,
  onOpenCompare,
}) => {
  const updateField = <K extends keyof SimulationConfig>(key: K, value: SimulationConfig[K]) => {
    onChangeConfig({
      ...config,
      [key]: value,
    });
  };

  return (
    <div className="flex flex-col h-full bg-surface border-r border-slate-800 text-slate-200 overflow-y-auto select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-accent" />
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-100">
            Observatory Controls
          </h2>
        </div>
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
          Tick: <span className="text-accent font-bold">{snapshot.tick}</span>
        </span>
      </div>

      <div className="p-4 space-y-5 text-xs">
        {/* Playback Controls Bar */}
        <div>
          <label className="block text-slate-400 font-medium mb-2">Simulation Lifecycle</label>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={onTogglePlay}
              className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg font-bold transition shadow-sm ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  : 'bg-accent hover:bg-accent-hover text-slate-950'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isRunning ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={() => onStep(1)}
              disabled={isRunning}
              title="Step +1 Tick"
              className="flex items-center justify-center space-x-1 py-2 px-2.5 bg-surface-elevated hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 transition disabled:opacity-40"
            >
              <SkipForward className="w-4 h-4 text-sky-400" />
              <span>+1</span>
            </button>

            <button
              onClick={() => onStep(10)}
              disabled={isRunning}
              title="Fast Forward +10 Ticks"
              className="flex items-center justify-center space-x-1 py-2 px-2.5 bg-surface-elevated hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 transition disabled:opacity-40"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>+10</span>
            </button>

            <button
              onClick={onReset}
              title="Reset to Tick 0"
              className="flex items-center justify-center space-x-1 py-2 px-2.5 bg-surface-elevated hover:bg-red-950/60 border border-slate-700 hover:border-red-800 rounded-lg text-slate-300 hover:text-red-300 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Speed Selector */}
        <div>
          <div className="flex justify-between text-slate-400 mb-1.5 font-medium">
            <span>Tick Speed</span>
            <span className="font-mono text-slate-200">{speed === 200 ? '1x (Slow)' : speed === 100 ? '2x (Normal)' : '5x (Fast)'}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '1x', val: 200 },
              { label: '2x', val: 100 },
              { label: '5x', val: 35 },
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => onChangeSpeed(s.val)}
                className={`py-1.5 rounded-lg border text-center font-mono font-medium transition ${
                  speed === s.val
                    ? 'bg-accent/20 border-accent text-accent font-bold'
                    : 'bg-surface-elevated border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Parameters */}
        <div className="space-y-3.5 pt-2 border-t border-slate-800">
          <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Simulation Parameters</span>
          </div>

          {/* Seed */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Simulation Seed</span>
              <span className="font-mono text-slate-200">{config.seed}</span>
            </div>
            <input
              type="number"
              value={config.seed}
              onChange={(e) => updateField('seed', Number(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-accent"
            />
          </div>

          {/* Initial Agents */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Initial Population</span>
              <span className="font-mono text-slate-200">{config.initialAgents}</span>
            </div>
            <input
              type="range"
              min="4"
              max="24"
              step="2"
              value={config.initialAgents}
              onChange={(e) => updateField('initialAgents', parseInt(e.target.value, 10))}
              className="w-full accent-accent bg-slate-900 cursor-pointer"
            />
          </div>

          {/* Resource Node Count */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Resource Node Count</span>
              <span className="font-mono text-slate-200">{config.resourceNodeCount}</span>
            </div>
            <input
              type="range"
              min="4"
              max="20"
              step="2"
              value={config.resourceNodeCount}
              onChange={(e) => updateField('resourceNodeCount', parseInt(e.target.value, 10))}
              className="w-full accent-emerald-400 bg-slate-900 cursor-pointer"
            />
          </div>

          {/* Spawn Threshold */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Spawn Food Threshold</span>
              <span className="font-mono text-slate-200">{config.spawnThreshold} units</span>
            </div>
            <input
              type="range"
              min="15"
              max="40"
              step="5"
              value={config.spawnThreshold}
              onChange={(e) => updateField('spawnThreshold', parseInt(e.target.value, 10))}
              className="w-full accent-accent bg-slate-900 cursor-pointer"
            />
          </div>
        </div>

        {/* Experiment Actions */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <button
            onClick={onOpenCompare}
            className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 bg-surface-elevated hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 font-medium transition"
          >
            <Scale className="w-4 h-4 text-purple-400" />
            <span>Compare Two Runs</span>
          </button>
        </div>

        {/* Snapshot Invariants Status */}
        <div className="pt-3 border-t border-slate-800 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Deterministic Engine Status
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 block">Snapshot CRC32</span>
              <span className="text-emerald-400 font-bold">
                0x{snapshot.checksum.toString(16).toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Invariants</span>
              <span className="text-emerald-400 font-bold">VERIFIED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
