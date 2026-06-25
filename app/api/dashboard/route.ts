/**
 * KASA v4.0 — Dashboard API
 * 
 * Returns real-time telemetry data from session store,
 * MCP client, and ghost cart for the dashboard UI.
 */

import { getSessionStats, getMCPTelemetry } from '@/app/lib/ai/session-store';
import { getGhostCartStats } from '@/app/lib/ai/ghost-cart';

export async function GET() {
  try {
    const sessions = getSessionStats();
    const telemetry = getMCPTelemetry();
    const ghostCart = getGhostCartStats();

    return new Response(
      JSON.stringify({ sessions, telemetry, ghostCart }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
        },
      }
    );
  } catch (err) {
    console.error('[Dashboard API] Error:', err);
    return new Response(JSON.stringify({ error: 'internal' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
