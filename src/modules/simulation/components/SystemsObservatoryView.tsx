import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { WorldData, SimulationConfig, SimulationSnapshot } from '../../../contracts/types';
import { SimulationEngine, DEFAULT_SIM_CONFIG } from '../simulationEngine';
import { SimulationMap } from './SimulationMap';
import { SimulationControls } from './SimulationControls';
import { SimulationMetricsPanel } from './SimulationMetricsPanel';
import { RunComparisonModal } from './RunComparisonModal';

interface SystemsObservatoryViewProps {
  world: WorldData;
}

export const SystemsObservatoryView: React.FC<SystemsObservatoryViewProps> = ({ world }) => {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_SIM_CONFIG);
  const [speed, setSpeed] = useState<number>(100); // 100ms per tick (Normal)
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);

  // Simulation Engine instance
  const engine = useMemo(() => new SimulationEngine(world, config), [world, config]);
  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(() => engine.getSnapshot());

  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  // Single step helper
  const handleStep = useCallback((count = 1) => {
    let snap: SimulationSnapshot = snapshot;
    for (let i = 0; i < count; i++) {
      snap = engine.step();
    }
    setSnapshot(snap);
  }, [engine, snapshot]);

  // Reset helper
  const handleReset = useCallback(() => {
    setIsRunning(false);
    engine.reset();
    setSnapshot(engine.getSnapshot());
    setSelectedAgentId(null);
  }, [engine]);

  // Play/Pause toggle
  const handleTogglePlay = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  // Simulation tick loop
  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      if (isRunningRef.current) {
        const snap = engine.step();
        setSnapshot(snap);

        if (snap.tick >= config.maxTicks) {
          setIsRunning(false);
        }
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [isRunning, speed, engine, config.maxTicks]);

  const selectedAgent = snapshot.agents.find((a) => a.id === selectedAgentId) ?? null;

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Left: Controls Panel */}
      <aside className="w-80 shrink-0 h-full">
        <SimulationControls
          isRunning={isRunning}
          onTogglePlay={handleTogglePlay}
          onStep={handleStep}
          onReset={handleReset}
          speed={speed}
          onChangeSpeed={setSpeed}
          config={config}
          onChangeConfig={(newCfg) => {
            setConfig(newCfg);
            setIsRunning(false);
          }}
          snapshot={snapshot}
          onOpenCompare={() => setIsCompareOpen(true)}
        />
      </aside>

      {/* Center: 2D Simulation Map */}
      <main className="flex-1 h-full relative">
        <SimulationMap
          world={world}
          snapshot={snapshot}
          selectedAgentId={selectedAgentId}
          onSelectAgent={setSelectedAgentId}
        />
      </main>

      {/* Right: Metrics & Event Log Panel */}
      <aside className="w-84 shrink-0 h-full">
        <SimulationMetricsPanel
          snapshot={snapshot}
          selectedAgent={selectedAgent}
          onClearSelectedAgent={() => setSelectedAgentId(null)}
        />
      </aside>

      {/* Run Comparison Modal */}
      {isCompareOpen && (
        <RunComparisonModal
          currentSnapshot={snapshot}
          onClose={() => setIsCompareOpen(false)}
        />
      )}
    </div>
  );
};
