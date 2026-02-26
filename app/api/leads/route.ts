import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const leads = await prisma.lead.findMany({ include: { interactions: true } });
  return NextResponse.json(leads);
}
