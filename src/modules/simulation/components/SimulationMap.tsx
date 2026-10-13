import React, { useRef, useEffect, useState } from 'react';
import { WorldData, SimulationSnapshot } from '../../../contracts/types';

interface SimulationMapProps {
  world: WorldData;
  snapshot: SimulationSnapshot;
  selectedAgentId: number | null;
  onSelectAgent: (agentId: number | null) => void;
}

export const SimulationMap: React.FC<SimulationMapProps> = ({
  world,
  snapshot,
  selectedAgentId,
  onSelectAgent,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);

  const res = world.config.resolution;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cellSize = width / res;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Terrain from heightmap
    for (let y = 0; y < res; y++) {
      for (let x = 0; x < res; x++) {
        const h = world.heightmap[y * res + x] ?? 0;
        let color = '#0369a1'; // Deep water

        if (h <= world.config.waterLevel) {
          color = '#0284c7'; // Shallow water
        } else if (h <= world.config.waterLevel + 0.05) {
          color = '#d97706'; // Sand
        } else if (h <= 0.55) {
          color = '#15803d'; // Grass/Forest
        } else if (h <= 0.8) {
          color = '#475569'; // Rock
        } else {
          color = '#f8fafc'; // Snow
        }

        ctx.fillStyle = color;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize + 0.5, cellSize + 0.5);
      }
    }

    // 2. Draw Resource Nodes
    for (const node of snapshot.resources) {
      const px = (node.x + 0.5) * cellSize;
      const py = (node.y + 0.5) * cellSize;
      const radius = Math.max(3, cellSize * 0.45);

      if (node.remaining > 0) {
        // Glowing Green Crystal
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Capacity indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${node.remaining}`, px, py - radius - 2);
      } else {
        // Depleted node
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(px, py, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Draw Colony Base
    const bx = (snapshot.base.x + 0.5) * cellSize;
    const by = (snapshot.base.y + 0.5) * cellSize;
    const baseSize = cellSize * 1.4;

    ctx.fillStyle = '#eab308'; // Gold fortress
    ctx.fillRect(bx - baseSize / 2, by - baseSize / 2, baseSize, baseSize);
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx - baseSize / 2, by - baseSize / 2, baseSize, baseSize);

    // Fortress icon center
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(bx, by, baseSize * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // 4. Draw Selected Agent Target Path Line
    if (selectedAgentId !== null) {
      const selected = snapshot.agents.find((a) => a.id === selectedAgentId);
      if (selected && selected.targetX !== null && selected.targetY !== null) {
        const ax = (selected.x + 0.5) * cellSize;
        const ay = (selected.y + 0.5) * cellSize;
        const tx = (selected.targetX + 0.5) * cellSize;
        const ty = (selected.targetY + 0.5) * cellSize;

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 5. Draw Agents
    for (const agent of snapshot.agents) {
      const ax = (agent.x + 0.5) * cellSize;
      const ay = (agent.y + 0.5) * cellSize;
      const agentRadius = Math.max(3, cellSize * 0.35);

      // State Colors
      let agentColor = '#38bdf8'; // Foraging (Sky)
      if (agent.state === 'harvesting') agentColor = '#facc15'; // Harvesting (Yellow)
      if (agent.state === 'returning') agentColor = '#c084fc'; // Returning (Purple)
      if (agent.state === 'exhausted') agentColor = '#ef4444'; // Exhausted (Red)

      // Outer ring if selected
      if (agent.id === selectedAgentId) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(ax, ay, agentRadius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = agentColor;
      ctx.beginPath();
      ctx.arc(ax, ay, agentRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Cargo badge if carrying food
      if (agent.cargo > 0) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(ax + agentRadius, ay - agentRadius, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [world, snapshot, selectedAgentId]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellSize = canvas.width / res;
    const gridX = Math.floor(x / cellSize);
    const gridY = Math.floor(y / cellSize);

    // Check if clicked an agent
    const clickedAgent = snapshot.agents.find(
      (a) => Math.hypot(a.x - gridX, a.y - gridY) <= 1.5
    );

    if (clickedAgent) {
      onSelectAgent(clickedAgent.id);
    } else {
      onSelectAgent(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellSize = canvas.width / res;
    const gridX = Math.floor(x / cellSize);
    const gridY = Math.floor(y / cellSize);

    const agent = snapshot.agents.find((a) => a.x === gridX && a.y === gridY);
    if (agent) {
      setHoveredEntity(`Agent #${agent.id} | State: ${agent.state} | Energy: ${agent.energy}% | Cargo: ${agent.cargo}/3`);
      return;
    }

    const node = snapshot.resources.find((r) => r.x === gridX && r.y === gridY);
    if (node) {
      setHoveredEntity(`Resource Node #${node.id} | Capacity: ${node.remaining}/${node.maxCapacity}`);
      return;
    }

    if (snapshot.base.x === gridX && snapshot.base.y === gridY) {
      setHoveredEntity(`Colony Base | Stockpile: ${snapshot.base.stockpile} food | Spawns: ${snapshot.base.spawnCount}`);
      return;
    }

    const h = world.heightmap[gridY * res + gridX] ?? 0;
    const type = h <= world.config.waterLevel ? 'Water' : h <= world.config.waterLevel + 0.05 ? 'Sand' : 'Land';
    setHoveredEntity(`Tile (${gridX}, ${gridY}) | Elevation: ${h.toFixed(3)} [${type}]`);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 bg-background relative select-none">
      <div className="relative border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-surface">
        <canvas
          ref={canvasRef}
          width={576}
          height={576}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setHoveredEntity(null)}
          className="cursor-crosshair block"
        />

        {/* Legend Overlay */}
        <div className="absolute top-2 left-2 bg-surface/90 backdrop-blur px-2.5 py-1.5 rounded-lg border border-slate-700/60 text-[11px] text-slate-300 space-y-1">
          <div className="flex items-center space-x-2 font-mono">
            <span className="w-2.5 h-2.5 rounded bg-amber-400" />
            <span>Colony Base</span>
          </div>
          <div className="flex items-center space-x-2 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Resource Node</span>
          </div>
          <div className="flex items-center space-x-2 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>Agent (Click to inspect)</span>
          </div>
        </div>

        {/* Hover Inspector Tooltip */}
        {hoveredEntity && (
          <div className="absolute bottom-2 left-2 right-2 bg-slate-950/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono text-slate-200">
            {hoveredEntity}
          </div>
        )}
      </div>
    </div>
  );
};
