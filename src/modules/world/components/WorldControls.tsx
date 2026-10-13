import React from 'react';
import { WorldConfig, WorldData } from '../../../contracts/types';
import { Shuffle, RefreshCw, Eye, Layers, Mountain, Waves, Compass } from 'lucide-react';

interface WorldControlsProps {
  config: WorldConfig;
  onChangeConfig: (newConfig: WorldConfig) => void;
  onRegenerate: () => void;
  worldData: WorldData;
  wireframe: boolean;
  setWireframe: (val: boolean) => void;
  autoRotate: boolean;
  setAutoRotate: (val: boolean) => void;
}

export const WorldControls: React.FC<WorldControlsProps> = ({
  config,
  onChangeConfig,
  onRegenerate,
  worldData,
  wireframe,
  setWireframe,
  autoRotate,
  setAutoRotate,
}) => {
  const updateField = <K extends keyof WorldConfig>(key: K, value: WorldConfig[K]) => {
    onChangeConfig({
      ...config,
      [key]: value,
    });
  };

  const handleRandomSeed = () => {
    const nextSeed = Math.floor(Math.random() * 1000000);
    updateField('seed', nextSeed);
  };

  const applyPreset = (presetName: string) => {
    switch (presetName) {
      case 'archipelago':
        onChangeConfig({
          ...config,
          scale: 0.045,
          octaves: 5,
          persistence: 0.55,
          waterLevel: 0.35,
          islandFalloff: true,
          peakMultiplier: 1.2,
        });
        break;
      case 'alpine':
        onChangeConfig({
          ...config,
          scale: 0.03,
          octaves: 5,
          persistence: 0.5,
          waterLevel: 0.15,
          islandFalloff: true,
          peakMultiplier: 2.2,
        });
        break;
      case 'atoll':
        onChangeConfig({
          ...config,
          scale: 0.06,
          octaves: 3,
          persistence: 0.35,
          waterLevel: 0.45,
          islandFalloff: true,
          peakMultiplier: 1.0,
        });
        break;
      case 'continents':
        onChangeConfig({
          ...config,
          scale: 0.02,
          octaves: 4,
          persistence: 0.5,
          waterLevel: 0.25,
          islandFalloff: false,
          peakMultiplier: 1.4,
        });
        break;
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface border-r border-slate-800 text-slate-200 overflow-y-auto">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Compass className="w-5 h-5 text-accent" />
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-100">World Parameters</h2>
        </div>
        <button
          onClick={onRegenerate}
          title="Regenerate"
          className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium bg-accent hover:bg-accent-hover text-slate-900 rounded-md transition shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Generate</span>
        </button>
      </div>

      <div className="p-4 space-y-5 text-xs">
        {/* Presets */}
        <div>
          <label className="block text-slate-400 font-medium mb-1.5">Presets</label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'archipelago', label: 'Archipelago' },
              { id: 'alpine', label: 'Alpine Peak' },
              { id: 'atoll', label: 'Coral Atoll' },
              { id: 'continents', label: 'Continents' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className="px-2 py-1.5 bg-surface-elevated hover:bg-slate-700/60 rounded border border-slate-700/50 text-slate-300 text-left transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Seed Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-slate-400 font-medium">Seed (PRNG)</label>
            <span className="text-[10px] text-slate-500 font-mono">32-bit unsigned</span>
          </div>
          <div className="flex space-x-2">
            <input
              type="number"
              value={config.seed}
              onChange={(e) => updateField('seed', Number(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-accent"
            />
            <button
              onClick={handleRandomSeed}
              title="Randomize Seed"
              className="px-2.5 py-1.5 bg-surface-elevated hover:bg-slate-700 border border-slate-700 rounded text-slate-300 transition"
            >
              <Shuffle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Resolution */}
        <div>
          <label className="block text-slate-400 font-medium mb-1.5">Grid Mesh Resolution</label>
          <div className="grid grid-cols-3 gap-2">
            {[32, 64, 128].map((r) => (
              <button
                key={r}
                onClick={() => updateField('resolution', r)}
                className={`py-1 rounded border text-center font-mono transition ${
                  config.resolution === r
                    ? 'bg-accent/20 border-accent text-accent font-bold'
                    : 'bg-surface-elevated border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}x{r}
              </button>
            ))}
          </div>
        </div>

        {/* Noise Parameters */}
        <div className="space-y-3.5 pt-2 border-t border-slate-800">
          <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
            <Layers className="w-3.5 h-3.5 text-accent" />
            <span>Fractal Noise (FBM)</span>
          </div>

          {/* Scale */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Frequency Scale</span>
              <span className="font-mono text-slate-200">{config.scale.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.08"
              step="0.005"
              value={config.scale}
              onChange={(e) => updateField('scale', parseFloat(e.target.value))}
              className="w-full accent-accent bg-slate-900 cursor-pointer"
            />
          </div>

          {/* Octaves */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Octaves (Detail Layers)</span>
              <span className="font-mono text-slate-200">{config.octaves}</span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              step="1"
              value={config.octaves}
              onChange={(e) => updateField('octaves', parseInt(e.target.value, 10))}
              className="w-full accent-accent bg-slate-900 cursor-pointer"
            />
          </div>

          {/* Persistence */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Persistence (Roughness)</span>
              <span className="font-mono text-slate-200">{config.persistence.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={config.persistence}
              onChange={(e) => updateField('persistence', parseFloat(e.target.value))}
              className="w-full accent-accent bg-slate-900 cursor-pointer"
            />
          </div>

          {/* Lacunarity */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Lacunarity</span>
              <span className="font-mono text-slate-200">{config.lacunarity.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="1.5"
              max="3.5"
              step="0.1"
              value={config.lacunarity}
              onChange={(e) => updateField('lacunarity', parseFloat(e.target.value))}
              className="w-full accent-accent bg-slate-900 cursor-pointer"
            />
          </div>
        </div>

        {/* Shaping & Biomes */}
        <div className="space-y-3.5 pt-2 border-t border-slate-800">
          <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
            <Mountain className="w-3.5 h-3.5 text-accent" />
            <span>Landform & Water</span>
          </div>

          {/* Island Falloff */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Radial Island Falloff</span>
            <input
              type="checkbox"
              checked={config.islandFalloff}
              onChange={(e) => updateField('islandFalloff', e.target.checked)}
              className="w-4 h-4 accent-accent cursor-pointer"
            />
          </div>

          {/* Water Level */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span className="flex items-center space-x-1">
                <Waves className="w-3 h-3 text-cyan-400" />
                <span>Water Level</span>
              </span>
              <span className="font-mono text-slate-200">{config.waterLevel.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.02"
              value={config.waterLevel}
              onChange={(e) => updateField('waterLevel', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-900 cursor-pointer"
            />
          </div>

          {/* Peak Multiplier */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Peak Exponent</span>
              <span className="font-mono text-slate-200">{config.peakMultiplier.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={config.peakMultiplier}
              onChange={(e) => updateField('peakMultiplier', parseFloat(e.target.value))}
              className="w-full accent-accent bg-slate-900 cursor-pointer"
            />
          </div>
        </div>

        {/* View Options */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <div className="flex items-center space-x-1.5 text-slate-300 font-medium mb-1">
            <Eye className="w-3.5 h-3.5 text-accent" />
            <span>View Options</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Wireframe</span>
            <input
              type="checkbox"
              checked={wireframe}
              onChange={(e) => setWireframe(e.target.checked)}
              className="w-4 h-4 accent-accent cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Auto Rotate</span>
            <input
              type="checkbox"
              checked={autoRotate}
              onChange={(e) => setAutoRotate(e.target.checked)}
              className="w-4 h-4 accent-accent cursor-pointer"
            />
          </div>
        </div>

        {/* Live Metrics */}
        <div className="pt-3 border-t border-slate-800 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Run Metadata</div>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 block">Checksum CRC32</span>
              <span className="text-emerald-400 font-bold">0x{worldData.checksum.toString(16).toUpperCase()}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Gen Latency</span>
              <span className="text-slate-300">{worldData.metrics.generationTimeMs} ms</span>
            </div>
            <div>
              <span className="text-slate-500 block">Elevation Min/Max</span>
              <span className="text-slate-300">
                {worldData.metrics.minHeight} / {worldData.metrics.maxHeight}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Water Coverage</span>
              <span className="text-slate-300">{(worldData.metrics.waterCoverageRatio * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
