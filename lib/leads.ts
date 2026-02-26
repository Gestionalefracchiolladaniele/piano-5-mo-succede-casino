import { prisma } from '@/lib/prisma';
import { demoLeads } from '@/lib/demoData';
import type { LeadLike } from '@/lib/revenueEngine';

export async function getLeadsSafe(): Promise<LeadLike[]> {
  try {
    const leads = await prisma.lead.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        dealSize: true,
        probability: true,
        urgency: true,
        engagementScore: true,
        status: true,
        createdAt: true,
      },
    });

    if (!leads.length) return demoLeads;
    return leads;
  } catch {
    return demoLeads;
  }
}
