import { create } from 'zustand';
import { WorldConfig, WorldData, RunLifecycleState } from '../../contracts/types';
import { DEFAULT_WORLD_CONFIG, generateWorld } from '../../modules/world/worldGenerator';

export type LabTab = 'procedural-world' | 'systems-simulation' | 'binary-protocol';

interface ExperimentStore {
  activeTab: LabTab;
  setActiveTab: (tab: LabTab) => void;

  worldConfig: WorldConfig;
  worldData: WorldData;
  setWorldConfig: (config: WorldConfig) => void;
  regenerateWorld: () => void;

  lifecycle: RunLifecycleState;
  setLifecycleStatus: (status: RunLifecycleState['status']) => void;

  wireframe: boolean;
  setWireframe: (val: boolean) => void;
  autoRotate: boolean;
  setAutoRotate: (val: boolean) => void;

  error: string | null;
  setError: (err: string | null) => void;
  resetError: () => void;
}

export const useExperimentStore = create<ExperimentStore>((set, get) => {
  const initialWorld = generateWorld(DEFAULT_WORLD_CONFIG);

  return {
    activeTab: 'procedural-world',
    setActiveTab: (tab) => set({ activeTab: tab }),

    worldConfig: DEFAULT_WORLD_CONFIG,
    worldData: initialWorld,

    setWorldConfig: (newConfig) => {
      try {
        const nextWorld = generateWorld(newConfig);
        set({
          worldConfig: newConfig,
          worldData: nextWorld,
          error: null,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to generate terrain';
        set({ error: msg });
      }
    },

    regenerateWorld: () => {
      const config = get().worldConfig;
      try {
        const nextWorld = generateWorld(config);
        set({ worldData: nextWorld, error: null });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to regenerate terrain';
        set({ error: msg });
      }
    },

    lifecycle: {
      status: 'idle',
      currentTick: 0,
      stepDeltaMs: 16,
      lastError: null,
    },
    setLifecycleStatus: (status) =>
      set((state) => ({
        lifecycle: { ...state.lifecycle, status },
      })),

    wireframe: false,
    setWireframe: (wireframe) => set({ wireframe }),
    autoRotate: true,
    setAutoRotate: (autoRotate) => set({ autoRotate }),

    error: null,
    setError: (error) => set({ error }),
    resetError: () => set({ error: null }),
  };
});
