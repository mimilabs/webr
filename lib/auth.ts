import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify API key from request headers
 * Expects: Authorization: Bearer YOUR_API_KEY
 */
export function verifyApiKey(request: NextRequest): { valid: boolean; error?: string } {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error('[Auth] API_KEY not configured in environment');
    return { valid: false, error: 'Server configuration error' };
  }

  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return { valid: false, error: 'Missing Authorization header' };
  }

  // Support both "Bearer TOKEN" and just "TOKEN"
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  if (token !== apiKey) {
    return { valid: false, error: 'Invalid API key' };
  }

  return { valid: true };
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(error: string, headers?: Record<string, string>) {
  return NextResponse.json(
    {
      success: false,
      error: `Unauthorized: ${error}`,
      message: 'Please provide a valid API key in the Authorization header'
    },
    {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Bearer',
        ...headers
      }
    }
  );
}
