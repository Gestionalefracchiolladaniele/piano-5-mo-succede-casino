import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@revenueos.app' },
    update: {},
    create: { email: 'demo@revenueos.app', password },
  });

  await prisma.interaction.deleteMany();
  await prisma.lead.deleteMany({ where: { userId: user.id } });

  const leads = await prisma.$transaction(
    Array.from({ length: 8 }).map((_, i) =>
      prisma.lead.create({
        data: {
          name: `Lead ${i + 1}`,
          company: `Company ${i + 1}`,
          dealSize: 8000 + i * 3500,
          probability: 0.25 + (i % 4) * 0.15,
          urgency: (i % 5) + 1,
          engagementScore: 40 + i * 6,
          status: i % 5 === 0 ? 'stalled' : i % 3 === 0 ? 'won' : 'active',
          createdAt: new Date(2025, i % 6, 5 + i),
          userId: user.id,
        },
      }),
    ),
  );

  await prisma.interaction.createMany({
    data: leads.map((lead, i) => ({
      leadId: lead.id,
      type: 'email',
      notes: `Follow-up touchpoint #${i + 1}`,
    })),
  });
}

main().finally(async () => prisma.$disconnect());
