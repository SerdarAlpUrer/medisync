import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-middleware';
import { successResponse, errorResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';

/**
 * POST /api/notifications/push/unsubscribe
 * Unsubscribe from push notifications
 */
async function unsubscribe(request: Request) {
    try {
        const session = await withAuth(request);
        if (!session) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const { endpoint } = body;

        if (!endpoint) {
            return errorResponse('Endpoint is required', 400);
        }

        // Delete subscription from database
        await prisma.pushSubscription.deleteMany({
            where: {
                endpoint,
                userId: session.user.id
            }
        });

        logger.info('Push subscription removed', { userId: session.user.id });
        return successResponse({ success: true });
    } catch (error) {
        logger.error('Error unsubscribing from push', error as Error);
        return errorResponse('Failed to unsubscribe', 500);
    }
}

export const POST = unsubscribe;
