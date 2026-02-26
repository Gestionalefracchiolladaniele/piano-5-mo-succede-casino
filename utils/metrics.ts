export function computeSimulatorOutput(winRate: number, avgDealSize: number, leadsPerMonth: number) {
  const monthlyRevenue = (winRate / 100) * avgDealSize * leadsPerMonth;
  const yearlyProjection = monthlyRevenue * 12;
  const growth = Math.min(100, Math.max(0, (winRate * leadsPerMonth) / 10));

  return { monthlyRevenue, yearlyProjection, growth };
}
