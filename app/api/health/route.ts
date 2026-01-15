import { NextRequest, NextResponse } from 'next/server';
import { isWebRInitialized } from '@/lib/webr-singleton';

// Force Node.js runtime (required for WebR)
export const runtime = 'nodejs';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return NextResponse.json({}, { headers: getCorsHeaders(origin) });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = getCorsHeaders(origin);

  // Health endpoint is public (no authentication required)
  // This allows load balancers and monitoring tools to check status
  const status = {
    status: 'ok',
    webrInitialized: isWebRInitialized(),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  return NextResponse.json(status, { headers });
}
