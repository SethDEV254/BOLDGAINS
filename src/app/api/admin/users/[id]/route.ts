import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { setUserStatus, adminSetPackage, adminAdjustBalance, deleteUser, getUserById } from '@/lib/db';

async function guard(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard(req);
  if (denied) return denied;

  const { id } = await params;
  const userId = parseInt(id);
  const body = await req.json();

  if (body.action === 'suspend') {
    setUserStatus(userId, 'suspended');
    return NextResponse.json({ success: true, status: 'suspended' });
  }
  if (body.action === 'activate') {
    setUserStatus(userId, 'active');
    return NextResponse.json({ success: true, status: 'active' });
  }
  if (body.action === 'set_package' && body.packageLevel !== undefined) {
    adminSetPackage(userId, body.packageLevel);
    return NextResponse.json({ success: true });
  }
  if (body.action === 'adjust_balance' && body.amount !== undefined) {
    const session = await getSession();
    adminAdjustBalance(userId, body.amount, session!.userId, body.reason || 'Manual adjustment');
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard(req);
  if (denied) return denied;

  const { id } = await params;
  const userId = parseInt(id);
  const user = getUserById(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (user.role === 'admin') return NextResponse.json({ error: 'Cannot delete admin' }, { status: 400 });

  deleteUser(userId);
  return NextResponse.json({ success: true });
}
