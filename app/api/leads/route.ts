import { NextResponse } from 'next/server';
import { getLeadsSafe } from '@/lib/leads';

export async function GET() {
  const leads = await getLeadsSafe();
  return NextResponse.json(leads);
}
