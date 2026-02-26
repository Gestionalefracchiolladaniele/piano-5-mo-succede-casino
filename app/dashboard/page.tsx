import dynamic from 'next/dynamic';
import { prisma } from '@/lib/prisma';
import { AnimatedMetric } from '@/components/AnimatedMetric';
import { calculateExpectedRevenue, calculateForecast, calculateVelocity, detectRisk } from '@/lib/revenueEngine';

const ForecastChart = dynamic(() => import('@/components/ForecastChart').then((m) => m.ForecastChart), { ssr: false });

export default async function DashboardPage() {
  const leads = await prisma.lead.findMany({ take: 50, orderBy: { createdAt: 'desc' } });

  const pipeline = leads.reduce((acc, lead) => acc + lead.dealSize, 0);
  const expected = calculateExpectedRevenue(leads);
  const winRate = leads.length ? (leads.filter((l) => l.status === 'won').length / leads.length) * 100 : 0;
  const velocity = calculateVelocity(leads, 45);
  const forecast = calculateForecast(leads);
  const riskAlerts = leads.filter((lead) => detectRisk(lead) === 'high').length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <AnimatedMetric label="Total Pipeline Value" value={`€${pipeline.toLocaleString()}`} />
        <AnimatedMetric label="Expected Revenue" value={`€${Math.round(expected).toLocaleString()}`} />
        <AnimatedMetric label="Win Rate" value={`${winRate.toFixed(1)}%`} />
        <AnimatedMetric label="Velocity" value={`€${Math.round(velocity).toLocaleString()}`} />
        <AnimatedMetric label="Risk Alerts" value={String(riskAlerts)} />
      </div>
      <section className="rounded-xl border border-white/10 bg-surface p-6">
        <h3 className="mb-4 text-lg font-medium">Monthly Forecast</h3>
        <ForecastChart data={forecast} />
      </section>
    </div>
  );
}
