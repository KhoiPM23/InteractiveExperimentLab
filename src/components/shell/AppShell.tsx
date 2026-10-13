import React, { useMemo } from 'react';
import { useExperimentStore } from '../../core/state/useExperimentStore';
import { WorldViewport } from '../../modules/world/components/WorldViewport';
import { WorldControls } from '../../modules/world/components/WorldControls';
import { ErrorBanner } from './States';
import { SystemsObservatoryView } from '../../modules/simulation/components/SystemsObservatoryView';
import { BinaryPlaygroundView } from '../../modules/binary/components/BinaryPlaygroundView';
import { serializeSimulationSnapshot } from '../../modules/binary/serializer';
import { SimulationEngine } from '../../modules/simulation/simulationEngine';
import { Globe2, Activity, Binary, Terminal, Cpu } from 'lucide-react';

export const AppShell: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    worldConfig,
    worldData,
    setWorldConfig,
    regenerateWorld,
    wireframe,
    setWireframe,
    autoRotate,
    setAutoRotate,
    error,
    resetError,
  } = useExperimentStore();

  const defaultSnapshotBytes = useMemo(() => {
    try {
      const engine = new SimulationEngine(worldData);
      const snap = engine.getSnapshot();
      return serializeSimulationSnapshot(snap);
    } catch {
      return null;
    }
  }, [worldData]);

  return (
    <div className="flex flex-col w-screen h-screen bg-background overflow-hidden text-slate-100 font-sans">
      {/* 1. Header Navigation */}
      <header className="h-12 border-b border-slate-800 bg-surface/90 backdrop-blur px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-accent/15 border border-accent/30 rounded-lg text-accent">
            <Globe2 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-100 flex items-center space-x-2">
              <span>InteractiveExperimentLab</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-400 font-mono rounded border border-slate-700">
                v0.1.0
              </span>
            </h1>
          </div>
        </div>

        {/* Tab Switcher */}
        <nav className="flex items-center space-x-1 bg-surface-elevated/70 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('procedural-world')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'procedural-world'
                ? 'bg-accent text-slate-900 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>1. Procedural Worlds</span>
          </button>

          <button
            onClick={() => setActiveTab('systems-simulation')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'systems-simulation'
                ? 'bg-accent text-slate-900 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>2. Systems Observatory</span>
          </button>

          <button
            onClick={() => setActiveTab('binary-protocol')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'binary-protocol'
                ? 'bg-accent text-slate-900 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            <span>3. Binary Playground</span>
          </button>
        </nav>

        {/* Header Right Status */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-500">Seed:</span>
            <span className="text-accent font-semibold">{worldConfig.seed}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono">READY</span>
          </div>
        </div>
      </header>

      {/* Error Banner if error occurs */}
      {error && <ErrorBanner message={error} onDismiss={resetError} />}

      {/* 2. Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'procedural-world' && (
          <>
            {/* Left Sidebar: Controls */}
            <aside className="w-80 shrink-0 h-full">
              <WorldControls
                config={worldConfig}
                onChangeConfig={setWorldConfig}
                onRegenerate={regenerateWorld}
                worldData={worldData}
                wireframe={wireframe}
                setWireframe={setWireframe}
                autoRotate={autoRotate}
                setAutoRotate={setAutoRotate}
              />
            </aside>

            {/* Center: 3D Viewport */}
            <main className="flex-1 h-full relative">
              <WorldViewport
                worldData={worldData}
                wireframe={wireframe}
                autoRotate={autoRotate}
              />
            </main>
          </>
        )}

        {activeTab === 'systems-simulation' && (
          <SystemsObservatoryView world={worldData} />
        )}

        {activeTab === 'binary-protocol' && (
          <main className="flex-1 h-full">
            <BinaryPlaygroundView initialBytes={defaultSnapshotBytes} />
          </main>
        )}
      </div>

      {/* 3. Bottom Status Bar */}
      <footer className="h-7 border-t border-slate-800 bg-surface px-3 flex items-center justify-between text-[11px] text-slate-400 font-mono shrink-0">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <Cpu className="w-3 h-3 text-slate-500" />
            <span>Target: Windows 11 / Intel Iris Xe</span>
          </span>
          <span className="text-slate-600">|</span>
          <span>Engine: Three.js + Mulberry32 PRNG</span>
          <span className="text-slate-600">|</span>
          <span>Mesh: {worldConfig.resolution}x{worldConfig.resolution} ({worldConfig.resolution * worldConfig.resolution} vertices)</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <Terminal className="w-3 h-3 text-slate-500" />
            <span>Deterministic CRC32: 0x{worldData.checksum.toString(16).toUpperCase()}</span>
          </span>
        </div>
      </footer>
    </div>
  );
};
