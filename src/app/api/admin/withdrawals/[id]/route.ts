import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { approveWithdrawal, rejectWithdrawal } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { action } = await req.json();

  if (action === 'approve') { approveWithdrawal(parseInt(id)); return NextResponse.json({ success: true }); }
  if (action === 'reject') { rejectWithdrawal(parseInt(id)); return NextResponse.json({ success: true }); }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
