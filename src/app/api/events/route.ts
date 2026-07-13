import { getSession } from '@/lib/auth';
import { getLatestActivityId } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

const POLL_MS = 1500;
// Keep each invocation well under Vercel's shortest serverless duration ceiling
// (10s on Hobby without Fluid Compute) so it always closes gracefully instead
// of being force-killed mid-response — EventSource reconnects immediately,
// so this "short-lived connection, fast reconnect" loop is still near-instant.
const MAX_CONNECTION_MS = 8000;

export async function GET() {
  const session = await getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const scopeUserId = session.role === 'admin' ? null : session.userId;
  const encoder = new TextEncoder();

  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Browsers default to ~3s between reconnects; since each connection is
      // intentionally short-lived, ask for a near-instant reconnect instead.
      controller.enqueue(encoder.encode('retry: 250\n\n'));

      const { earningsMaxId, txMaxId } = await getLatestActivityId(scopeUserId);
      const startedAt = Date.now();

      while (!closed && Date.now() - startedAt < MAX_CONNECTION_MS) {
        await new Promise(r => setTimeout(r, POLL_MS));
        if (closed) break;

        try {
          const latest = await getLatestActivityId(scopeUserId);
          if (latest.earningsMaxId !== earningsMaxId || latest.txMaxId !== txMaxId) {
            controller.enqueue(encoder.encode('event: update\ndata: {}\n\n'));
            break;
          }
        } catch {
          break;
        }
      }
      try { controller.close(); } catch {}
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
