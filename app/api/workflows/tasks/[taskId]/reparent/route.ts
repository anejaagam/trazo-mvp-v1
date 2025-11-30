import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canPerformAction } from '@/lib/rbac/guards';
import { moveTaskUnderParent } from '@/lib/supabase/queries/workflows';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userRecord || !canPerformAction(userRecord.role, 'task:update').allowed) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parentTaskId = typeof body?.parentTaskId === 'string' ? body.parentTaskId : null;

  const result = await moveTaskUnderParent(taskId, parentTaskId);
  if (result.error) {
    const message = result.error instanceof Error ? result.error.message : 'Unable to move task';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ data: result.data });
}
