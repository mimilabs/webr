/**
 * API Key Authentication Module
 *
 * Provides simple API key authentication for WebR API endpoints.
 * API key must be set in environment variable: API_KEY
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify API key from request headers
 *
 * Supports two authorization formats:
 * - Bearer token: "Authorization: Bearer YOUR_API_KEY"
 * - Plain token: "Authorization: YOUR_API_KEY"
 *
 * @param request - The Next.js request object
 * @returns Object with validation result and optional error message
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
 * Create a standardized 401 Unauthorized response
 *
 * @param error - Error message describing why authentication failed
 * @param headers - Optional additional headers (e.g., CORS headers)
 * @returns NextResponse with 401 status and error details
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
