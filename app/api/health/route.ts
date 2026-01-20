/**
 * Health Check Endpoint
 *
 * GET /api/health
 *
 * Public endpoint (no authentication required) for monitoring server status.
 * Used by load balancers, uptime monitors, and deployment scripts.
 *
 * Returns:
 * - Server status
 * - WebR initialization state
 * - Server uptime
 * - Current timestamp
 */

import { NextRequest, NextResponse } from 'next/server';
import { isWebRInitialized } from '@/lib/webr-singleton';

// Force Node.js runtime (required for WebR)
export const runtime = 'nodejs';

/**
 * CORS configuration for health checks
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Get CORS headers for the request origin
 */
function getCorsHeaders(origin: string | null) {
  const allowedOrigins = [
    'https://www.mimilabs.ai',
    'https://mimilabs.ai'
  ];

  if (origin && allowedOrigins.includes(origin)) {
    return {
      ...corsHeaders,
      'Access-Control-Allow-Origin': origin,
    };
  }

  return corsHeaders;
}

/**
 * Handle OPTIONS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return NextResponse.json({}, { headers: getCorsHeaders(origin) });
}

/**
 * Handle GET requests for health status
 *
 * No authentication required - public endpoint for monitoring
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = getCorsHeaders(origin);
  const status = {
    status: 'ok',
    webrInitialized: isWebRInitialized(),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  return NextResponse.json(status, { headers });
}
