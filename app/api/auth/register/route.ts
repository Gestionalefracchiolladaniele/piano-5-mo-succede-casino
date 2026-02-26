import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: 'User already exists' }, { status: 409 });

  const user = await prisma.user.create({ data: { email, password: await hashPassword(password) } });
  const token = signToken(user.id);

  const response = NextResponse.json({ id: user.id, email: user.email });
  response.cookies.set('token', token, { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production' });
  return response;
}
