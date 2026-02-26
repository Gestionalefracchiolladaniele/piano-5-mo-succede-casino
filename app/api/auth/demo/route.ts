import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';

export async function GET(req: Request) {
  const token = signToken('demo-user');
  const response = NextResponse.redirect(new URL('/dashboard', req.url));
  response.cookies.set('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
