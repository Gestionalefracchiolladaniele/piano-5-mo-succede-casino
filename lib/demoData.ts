import type { LeadLike } from '@/lib/revenueEngine';

export const demoLeads: LeadLike[] = [
  { dealSize: 12000, probability: 0.35, urgency: 2, engagementScore: 55, status: 'active', createdAt: new Date('2026-01-10') },
  { dealSize: 18000, probability: 0.6, urgency: 4, engagementScore: 72, status: 'won', createdAt: new Date('2026-01-19') },
  { dealSize: 9000, probability: 0.25, urgency: 3, engagementScore: 40, status: 'stalled', createdAt: new Date('2026-02-03') },
  { dealSize: 26000, probability: 0.45, urgency: 5, engagementScore: 79, status: 'active', createdAt: new Date('2026-02-15') },
  { dealSize: 15000, probability: 0.5, urgency: 3, engagementScore: 67, status: 'active', createdAt: new Date('2026-03-05') },
];
