'use client';

import { useSimulatorStore } from '@/store/simulatorStore';
import { computeSimulatorOutput } from '@/utils/metrics';

function SliderRow({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-slate-300">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step ?? 1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </div>
  );
}

export default function SimulatorPage() {
  const { winRate, avgDealSize, leadsPerMonth, salesCycle, setValue } = useSimulatorStore();
  const output = computeSimulatorOutput(winRate, avgDealSize, leadsPerMonth);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-6 rounded-xl border border-white/10 bg-surface p-6">
        <h1 className="text-xl font-semibold">Revenue Simulator</h1>
        <SliderRow label="Win Rate (%)" value={winRate} min={1} max={100} onChange={(v) => setValue('winRate', v)} />
        <SliderRow label="Avg Deal Size (€)" value={avgDealSize} min={1000} max={50000} step={500} onChange={(v) => setValue('avgDealSize', v)} />
        <SliderRow label="Leads per month" value={leadsPerMonth} min={1} max={100} onChange={(v) => setValue('leadsPerMonth', v)} />
        <SliderRow label="Sales Cycle (days)" value={salesCycle} min={7} max={180} onChange={(v) => setValue('salesCycle', v)} />
      </section>
      <section className="space-y-4 rounded-xl border border-white/10 bg-surface p-6">
        <h2 className="text-lg font-medium">Output</h2>
        <p>Monthly Revenue: <strong>€{Math.round(output.monthlyRevenue).toLocaleString()}</strong></p>
        <p>Yearly Projection: <strong>€{Math.round(output.yearlyProjection).toLocaleString()}</strong></p>
        <p>Growth %: <strong>{output.growth.toFixed(1)}%</strong></p>
      </section>
    </div>
  );
}
