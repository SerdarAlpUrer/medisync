import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPush } from '@/lib/notifications/push-service';
import { logger } from '@/lib/logger';

interface ReminderNotification {
    title: string;
    body: string;
    url: string;
}

/**
 * GET /api/notifications/check-reminders
 * Check for upcoming maintenance and calibration reminders
 * Can be called by cron job or service worker
 */
export async function GET() {
    try {
        const notifications: ReminderNotification[] = [];
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Check upcoming maintenance
        const upcomingMaintenance = await prisma.maintenanceRecord.findMany({
            where: {
                status: 'SCHEDULED',
                scheduledDate: {
                    gte: now,
                    lte: threeDaysFromNow
                }
            },
            include: {
                device: {
                    select: { name: true, tagNumber: true }
                }
            },
            take: 10
        });

        for (const record of upcomingMaintenance) {
            const daysUntil = Math.ceil((new Date(record.scheduledDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            notifications.push({
                title: '🔧 Bakım Hatırlatması',
                body: `${record.device.name} (${record.device.tagNumber}) için bakım ${daysUntil} gün içinde yapılmalı`,
                url: `/dashboard/maintenance/${record.id}`
            });
        }

        // Check upcoming calibrations
        const upcomingCalibrations = await prisma.calibrationRecord.findMany({
            where: {
                status: 'SCHEDULED',
                scheduledDate: {
                    gte: now,
                    lte: sevenDaysFromNow
                }
            },
            include: {
                device: {
                    select: { name: true, tagNumber: true }
                }
            },
            take: 10
        });

        for (const record of upcomingCalibrations) {
            const daysUntil = Math.ceil((new Date(record.scheduledDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            notifications.push({
                title: '📏 Kalibrasyon Hatırlatması',
                body: `${record.device.name} (${record.device.tagNumber}) için kalibrasyon ${daysUntil} gün içinde yapılmalı`,
                url: `/dashboard/calibration/${record.id}`
            });
        }

        // Check expiring calibrations
        const expiringCalibrations = await prisma.calibrationRecord.findMany({
            where: {
                status: 'COMPLETED',
                expiryDate: {
                    gte: now,
                    lte: sevenDaysFromNow
                }
            },
            include: {
                device: {
                    select: { name: true, tagNumber: true }
                }
            },
            take: 10
        });

        for (const record of expiringCalibrations) {
            const daysUntil = Math.ceil((new Date(record.expiryDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            notifications.push({
                title: '⚠️ Kalibrasyon Süresi Dolmak Üzere',
                body: `${record.device.name} (${record.device.tagNumber}) kalibrasyon sertifikası ${daysUntil} gün içinde dolacak`,
                url: `/dashboard/calibration`
            });
        }

        // Check overdue work orders
        const overdueWorkOrders = await prisma.workOrder.findMany({
            where: {
                status: { in: ['OPEN', 'IN_PROGRESS'] },
                dueDate: {
                    lt: now
                }
            },
            include: {
                device: {
                    select: { name: true, tagNumber: true }
                }
            },
            take: 10
        });

        for (const order of overdueWorkOrders) {
            notifications.push({
                title: '🚨 Gecikmiş İş Emri',
                body: `${order.workOrderNumber}: ${order.device.name} için iş emri gecikti`,
                url: `/dashboard/work-orders/${order.id}`
            });
        }

        logger.info('Checked reminders', { count: notifications.length });

        return NextResponse.json({
            notifications,
            checkedAt: now.toISOString()
        });
    } catch (error) {
        logger.error('Error checking reminders', error as Error);
        return NextResponse.json(
            { error: 'Failed to check reminders' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/notifications/check-reminders
 * Send push notifications for reminders to all subscribed users
 * Should be triggered by cron job
 */
export async function POST() {
    try {
        const pushEnabled = process.env.PUSH_ENABLED === 'true';
        if (!pushEnabled) {
            return NextResponse.json({ message: 'Push notifications disabled' });
        }

        // Get all users with push subscriptions
        const usersWithSubscriptions = await prisma.user.findMany({
            where: {
                pushSubscriptions: { some: {} }
            },
            select: { id: true }
        });

        let sentCount = 0;
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

        // Check for overdue maintenance per user hospital
        for (const user of usersWithSubscriptions) {
            const userDetails = await prisma.user.findUnique({
                where: { id: user.id },
                select: { hospitalId: true }
            });

            if (!userDetails?.hospitalId) continue;

            const overdueMaintenance = await prisma.maintenanceRecord.count({
                where: {
                    hospitalId: userDetails.hospitalId,
                    status: 'SCHEDULED',
                    scheduledDate: { lt: now }
                }
            });

            if (overdueMaintenance > 0) {
                const success = await sendPush(user.id, {
                    title: '⚠️ Gecikmiş Bakım',
                    message: `${overdueMaintenance} adet bakım tarihi geçmiş cihaz var`,
                    priority: 'high',
                    actionUrl: '/dashboard/maintenance'
                });
                if (success) sentCount++;
            }

            // Check upcoming maintenance
            const upcomingMaintenance = await prisma.maintenanceRecord.count({
                where: {
                    hospitalId: userDetails.hospitalId,
                    status: 'SCHEDULED',
                    scheduledDate: {
                        gte: now,
                        lte: threeDaysFromNow
                    }
                }
            });

            if (upcomingMaintenance > 0) {
                const success = await sendPush(user.id, {
                    title: '🔧 Yaklaşan Bakım',
                    message: `${upcomingMaintenance} cihazın bakım tarihi 3 gün içinde`,
                    priority: 'medium',
                    actionUrl: '/dashboard/maintenance'
                });
                if (success) sentCount++;
            }
        }

        logger.info('Sent reminder push notifications', { sentCount });

        return NextResponse.json({
            success: true,
            sentCount,
            timestamp: now.toISOString()
        });
    } catch (error) {
        logger.error('Error sending reminder pushes', error as Error);
        return NextResponse.json(
            { error: 'Failed to send reminder notifications' },
            { status: 500 }
        );
    }
}
