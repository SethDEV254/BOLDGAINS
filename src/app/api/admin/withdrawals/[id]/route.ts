import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { approveWithdrawal, rejectWithdrawal } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { action } = await req.json();

  if (action === 'approve') { await approveWithdrawal(parseInt(id)); return NextResponse.json({ success: true }); }
  if (action === 'reject') { await rejectWithdrawal(parseInt(id)); return NextResponse.json({ success: true }); }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
