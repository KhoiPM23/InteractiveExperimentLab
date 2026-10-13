import React from 'react';
import { SimulationSnapshot, AgentState } from '../../../contracts/types';
import {
  Activity,
  Battery,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
  Truck,
  Pickaxe,
  Footprints,
} from 'lucide-react';

interface SimulationMetricsPanelProps {
  snapshot: SimulationSnapshot;
  selectedAgent: AgentState | null;
  onClearSelectedAgent: () => void;
}

export const SimulationMetricsPanel: React.FC<SimulationMetricsPanelProps> = ({
  snapshot,
  selectedAgent,
  onClearSelectedAgent,
}) => {
  const { metrics, base, resources, agents, events } = snapshot;

  const initialTotalRes = resources.reduce((sum, r) => sum + r.maxCapacity, 0);
  const remainingRes = resources.reduce((sum, r) => sum + r.remaining, 0);
  const depletedPct =
    initialTotalRes > 0 ? (((initialTotalRes - remainingRes) / initialTotalRes) * 100).toFixed(0) : 0;

  // State Counts
  const foragingCount = agents.filter((a) => a.state === 'foraging').length;
  const harvestingCount = agents.filter((a) => a.state === 'harvesting').length;
  const returningCount = agents.filter((a) => a.state === 'returning').length;
  const exhaustedCount = agents.filter((a) => a.state === 'exhausted').length;

  return (
    <div className="flex flex-col h-full bg-surface border-l border-slate-800 text-slate-200 overflow-y-auto select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-accent" />
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-100">
            Observatory Metrics
          </h2>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
          Active: {metrics.activeAgents}
        </span>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Core Metric Cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 bg-surface-elevated/70 rounded-lg border border-slate-700/60">
            <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>Colony Stockpile</span>
            </div>
            <div className="text-base font-bold font-mono text-slate-100">
              {base.stockpile} <span className="text-xs font-normal text-slate-400">food</span>
            </div>
          </div>

          <div className="p-2.5 bg-surface-elevated/70 rounded-lg border border-slate-700/60">
            <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
              <span>Avg Energy</span>
            </div>
            <div className="text-base font-bold font-mono text-slate-100">
              {metrics.averageEnergy}%
            </div>
          </div>

          <div className="p-2.5 bg-surface-elevated/70 rounded-lg border border-slate-700/60">
            <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Total Harvested</span>
            </div>
            <div className="text-base font-bold font-mono text-slate-100">
              {base.totalCollected} <span className="text-xs font-normal text-slate-400">units</span>
            </div>
          </div>

          <div className="p-2.5 bg-surface-elevated/70 rounded-lg border border-slate-700/60">
            <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span>Nodes Depleted</span>
            </div>
            <div className="text-base font-bold font-mono text-slate-100">
              {depletedPct}%
            </div>
          </div>
        </div>

        {/* State Distribution Bar */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
            <span>Agent State Distribution ({agents.length} Total)</span>
          </div>
          <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-slate-900 border border-slate-800">
            <div
              style={{ width: `${(foragingCount / agents.length) * 100}%` }}
              title={`Foraging: ${foragingCount}`}
              className="bg-sky-400 transition-all duration-300"
            />
            <div
              style={{ width: `${(harvestingCount / agents.length) * 100}%` }}
              title={`Harvesting: ${harvestingCount}`}
              className="bg-amber-400 transition-all duration-300"
            />
            <div
              style={{ width: `${(returningCount / agents.length) * 100}%` }}
              title={`Returning: ${returningCount}`}
              className="bg-purple-400 transition-all duration-300"
            />
            <div
              style={{ width: `${(exhaustedCount / agents.length) * 100}%` }}
              title={`Exhausted: ${exhaustedCount}`}
              className="bg-red-400 transition-all duration-300"
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span className="text-sky-400">Forage: {foragingCount}</span>
            <span className="text-amber-400">Harvest: {harvestingCount}</span>
            <span className="text-purple-400">Return: {returningCount}</span>
            <span className="text-red-400">Exhausted: {exhaustedCount}</span>
          </div>
        </div>

        {/* Selected Agent Inspector */}
        {selectedAgent && (
          <div className="p-3 bg-slate-900/80 rounded-lg border border-accent/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-accent">Inspector: Agent #{selectedAgent.id}</span>
              <button
                onClick={onClearSelectedAgent}
                className="text-[10px] text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block">Position</span>
                <span className="text-slate-200">
                  ({selectedAgent.x}, {selectedAgent.y})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">State</span>
                <span className="text-sky-300 font-semibold uppercase">{selectedAgent.state}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Cargo</span>
                <span className="text-amber-300">{selectedAgent.cargo} / 3 food</span>
              </div>
              <div>
                <span className="text-slate-500 block">Energy</span>
                <span className={selectedAgent.energy < 20 ? 'text-red-400' : 'text-emerald-400'}>
                  {selectedAgent.energy}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Event Stream Log */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">Event Stream (Recent)</span>
            <span className="text-[10px] font-mono text-slate-500">Total: {events.length}</span>
          </div>

          <div className="h-56 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
            {events.length === 0 ? (
              <div className="text-slate-500 text-center py-8">
                Click Play or Step to emit simulation events.
              </div>
            ) : (
              events
                .slice()
                .reverse()
                .map((ev) => {
                  let Icon = Footprints;
                  let color = 'text-sky-400';
                  if (ev.type === 'RESOURCE_HARVESTED') {
                    Icon = Pickaxe;
                    color = 'text-amber-400';
                  } else if (ev.type === 'CARGO_DEPOSITED') {
                    Icon = Truck;
                    color = 'text-emerald-400';
                  } else if (ev.type === 'AGENT_SPAWNED') {
                    Icon = CheckCircle2;
                    color = 'text-purple-400';
                  } else if (ev.type === 'AGENT_EXHAUSTED') {
                    Icon = AlertCircle;
                    color = 'text-red-400';
                  }

                  return (
                    <div
                      key={ev.id}
                      className="p-2 bg-slate-900/60 rounded border border-slate-800 flex items-start space-x-2"
                    >
                      <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${color}`} />
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>{ev.type}</span>
                          <span>T:{ev.tick}</span>
                        </div>
                        <p className="text-slate-300 text-[10px] leading-tight truncate">
                          {ev.details}
                        </p>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
