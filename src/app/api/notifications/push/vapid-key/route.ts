import { NextResponse } from 'next/server';

/**
 * GET /api/notifications/push/vapid-key
 * Returns the VAPID public key for push subscription
 */
export async function GET() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;

    if (!publicKey) {
        return NextResponse.json(
            { error: 'Push notifications not configured' },
            { status: 503 }
        );
    }

    return NextResponse.json({ publicKey });
}
