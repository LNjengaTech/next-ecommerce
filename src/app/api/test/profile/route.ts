import { NextResponse } from 'next/server';
import { getUserProfile } from '@/app/actions/auth';

export async function GET() {
  const result = await getUserProfile();
  return NextResponse.json(result);
}