'use client';

import { create } from 'zustand';

type SimulatorState = {
  winRate: number;
  avgDealSize: number;
  leadsPerMonth: number;
  salesCycle: number;
  setValue: (key: 'winRate' | 'avgDealSize' | 'leadsPerMonth' | 'salesCycle', value: number) => void;
};

export const useSimulatorStore = create<SimulatorState>((set) => ({
  winRate: 30,
  avgDealSize: 12000,
  leadsPerMonth: 20,
  salesCycle: 45,
  setValue: (key, value) => set((state) => ({ ...state, [key]: value })),
}));
