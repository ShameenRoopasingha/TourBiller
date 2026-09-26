import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        // Vercel Cron secures the endpoint automatically via header if configured,
        // but it's good practice to verify authorization headers here in production.

        const now = new Date();
        const allVehicles = await prisma.vehicle.findMany({
            where: { status: 'ACTIVE' },
            include: { company: true }
        });

        const notificationsSent = [];

        for (const v of allVehicles) {
            const alerts = [];
            if (v.currentMileage - v.lastOilChangeMileage >= v.oilChangeInterval - 100) alerts.push('Oil Change');
            if (v.currentMileage - v.lastFilterChangeMileage >= v.filterChangeInterval - 100) alerts.push('Filter Change');
            if (v.currentMileage - v.lastWashMileage >= v.washInterval) alerts.push('Wash');
            if (v.insuranceExpiry && (v.insuranceExpiry.getTime() - now.getTime()) / (1000 * 3600 * 24) <= 30) alerts.push('Insurance Expiring');
            if (v.revenueLicenseExpiry && (v.revenueLicenseExpiry.getTime() - now.getTime()) / (1000 * 3600 * 24) <= 30) alerts.push('License Expiring');

            if (alerts.length > 0) {
                // Here we would integrate Resend, SendGrid, or nodemailer to send the actual email.
                // For now, we simulate the notification generation.
                const notificationMessage = `Vehicle ${v.vehicleNo} requires attention: ${alerts.join(', ')}`;
                console.log(`[CRON ALERT] Company: ${v.company.companyName} | ${notificationMessage}`);
                
                notificationsSent.push({
                    vehicleNo: v.vehicleNo,
                    company: v.company.companyName,
                    alerts
                });
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Processed ${allVehicles.length} vehicles. Triggered ${notificationsSent.length} alerts.`,
            alerts: notificationsSent
        });
    } catch (error) {
        console.error('[CRON ERROR]', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
