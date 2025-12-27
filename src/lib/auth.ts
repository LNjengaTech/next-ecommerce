//JWT creation and verification, cookie management, and middleware helpers


import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long'
);

const TOKEN_NAME = 'auth-token';
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60; //7 days in seconds

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'customer' | 'admin';
  iat?: number;
  exp?: number;
}

//create JWT token
export async function createToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

//verify JWT token
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    
    //convert to unknown first, then to the custom interface
    return (verified.payload as unknown) as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}
//set auth cookie (for Server Actions)
export async function setAuthCookie(payload: JWTPayload): Promise<void> {
  const token = await createToken(payload);
  const cookieStore = await cookies();
  
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_MAX_AGE,
    path: '/'
  });
}

//remove auth cookie
export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

//get current user from cookie (Server Components & Server Actions)
export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_NAME)?.value;
    
    if (!token) return null;
    
    return await verifyToken(token);
  } catch (error) {
    console.error('Get current user failed:', error);
    return null;
  }
}

//middleware helper - get user from request
export async function getUserFromRequest(
  request: NextRequest
): Promise<JWTPayload | null> {
  try {
    const token = request.cookies.get(TOKEN_NAME)?.value;
    
    if (!token) return null;
    
    return await verifyToken(token);
  } catch (error) {
    return null;
  }
}

//middleware helper - check if user is admin
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const user = await getUserFromRequest(request);
  return user?.role === 'admin';
}

//middleware helper - Redirect to login
export function redirectToLogin(request: NextRequest): NextResponse {
  const url = new URL('/auth/login', request.url);
  url.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

//middleware helper - set auth cookie in response
export async function setAuthCookieInResponse(
  response: NextResponse,
  payload: JWTPayload
): Promise<NextResponse> {
  const token = await createToken(payload);
  
  response.cookies.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE,
    path: '/'
  });
  
  return response;
}