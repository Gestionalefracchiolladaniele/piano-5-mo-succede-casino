export type LeadLike = {
  dealSize: number;
  probability: number;
  urgency: number;
  engagementScore: number;
  status: string;
  createdAt: Date;
};

export function calculateExpectedRevenue(leads: LeadLike[]) {
  return leads.reduce((total, lead) => total + lead.dealSize * lead.probability, 0);
}

export function calculateVelocity(leads: LeadLike[], avgSalesCycle: number) {
  if (!leads.length || avgSalesCycle <= 0) return 0;
  const qualified = leads.filter((l) => l.status !== 'lost').length;
  const pipeline = leads.reduce((sum, lead) => sum + lead.dealSize, 0);
  return (qualified * pipeline) / avgSalesCycle;
}

export function calculateHeatScore(lead: LeadLike) {
  return lead.probability * 50 + lead.urgency * 3 + lead.engagementScore * 2;
}

export function calculateForecast(leads: LeadLike[]) {
  const monthMap = new Map<string, number>();
  leads.forEach((lead) => {
    const month = `${lead.createdAt.getFullYear()}-${String(lead.createdAt.getMonth() + 1).padStart(2, '0')}`;
    const value = lead.dealSize * lead.probability;
    monthMap.set(month, (monthMap.get(month) || 0) + value);
  });

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({ month, revenue }));
}

export function detectRisk(lead: LeadLike) {
  const heat = calculateHeatScore(lead);
  if (lead.status === 'stalled' || heat < 45) return 'high';
  if (heat < 70) return 'medium';
  return 'low';
}
