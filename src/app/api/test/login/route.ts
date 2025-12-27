import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/app/actions/auth';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const result = await registerUser(formData);
  
  return NextResponse.json(result);
}