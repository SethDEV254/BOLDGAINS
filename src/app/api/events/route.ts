import { getSession } from '@/lib/auth';
import { getLatestActivityId } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const POLL_MS = 1500;
const HEARTBEAT_MS = 15000;

export async function GET() {
  const session = await getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const scopeUserId = session.role === 'admin' ? null : session.userId;
  const encoder = new TextEncoder();

  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      let { earningsMaxId, txMaxId } = await getLatestActivityId(scopeUserId);
      let lastHeartbeat = Date.now();

      while (!closed) {
        await new Promise(r => setTimeout(r, POLL_MS));
        if (closed) break;

        try {
          const latest = await getLatestActivityId(scopeUserId);
          if (latest.earningsMaxId !== earningsMaxId || latest.txMaxId !== txMaxId) {
            earningsMaxId = latest.earningsMaxId;
            txMaxId = latest.txMaxId;
            controller.enqueue(encoder.encode('event: update\ndata: {}\n\n'));
          } else if (Date.now() - lastHeartbeat > HEARTBEAT_MS) {
            lastHeartbeat = Date.now();
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          }
        } catch {
          break;
        }
      }
      controller.close();
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
    },
  });
}
