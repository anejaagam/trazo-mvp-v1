import { NextResponse } from 'next/server'

// POST /api/auth/sign-up
// Stub implementation to satisfy typechecking; real implementation can be added later.
export async function POST() {
	return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}

// Optionally provide a GET that informs clients this route expects POST
export async function GET() {
	return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}

export const dynamic = 'force-dynamic'
