import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { runRecurringGenerationJob } from '@/lib/workflows/recurring-runner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const startedAt = Date.now();

  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials for cron job');
    }

    const supabase = createServiceClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const summary = await runRecurringGenerationJob(supabase);
    return NextResponse.json({
      success: true,
      durationMs: Date.now() - startedAt,
      ...summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: message,
        durationMs: Date.now() - startedAt,
      },
      { status: 500 }
    );
  }
}
