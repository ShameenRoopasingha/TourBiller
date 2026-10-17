import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { auth } from '@/lib/auth';
import { DriverTourActionSchema } from '@/lib/validations';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key-vigil';

// Middleware-like function to verify driver (Bearer token for Mobile App or NextAuth for Web Portal)
async function verifyDriver(req: Request) {
    // 1. Try Bearer token
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            if (decoded?.id && decoded?.companyId) {
                return { driver: decoded };
            }
        } catch {
            // Ignore and try session next
        }
    }

    // 2. Try NextAuth session
    try {
        const session = await auth();
        const user = session?.user as { id?: string; companyId?: string; role?: string } | undefined;
        if (user?.id && user?.companyId && user?.role === 'DRIVER') {
            return {
                driver: {
                    id: user.id,
                    companyId: user.companyId,
                    role: user.role,
                }
            };
        }
    } catch {
        // Session failed
    }

    return { error: 'Unauthorized', status: 401 };
}

// GET: Fetch single tour details with activities, vehicle, and navigation info
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await verifyDriver(req);
        if (auth.error) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

        const resolvedParams = await params;
        const bookingId = resolvedParams.id;
        const driverId = auth.driver.id;

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                company: {
                    select: {
                        id: true,
                        companyName: true,
                        logoUrl: true,
                        phone: true,
                    }
                },
                tripActivities: {
                    orderBy: { timestamp: 'desc' }
                },
                driverLocations: {
                    orderBy: { timestamp: 'desc' },
                    take: 50,
                    select: {
                        lat: true,
                        lon: true,
                        heading: true,
                        speed: true,
                        timestamp: true,
                    }
                }
            }
        });

        if (!booking || booking.driverId !== driverId) {
            return NextResponse.json({ success: false, error: 'Tour not found or unauthorized' }, { status: 404 });
        }

        // Fetch vehicle details if available
        let vehicle = null;
        if (booking.vehicleNo) {
            vehicle = await prisma.vehicle.findFirst({
                where: {
                    companyId: booking.companyId,
                    vehicleNo: booking.vehicleNo
                },
                select: {
                    vehicleNo: true,
                    model: true,
                    category: true,
                    seats: true,
                    acType: true,
                    features: true,
                }
            });

            // If vehicle is an external hire not in the company fleet database
            if (!vehicle) {
                vehicle = {
                    vehicleNo: booking.vehicleNo,
                    model: 'External Hire Vehicle',
                    category: 'HIRE',
                    seats: 4,
                    acType: 'A/C',
                    features: 'Outsourced emergency replacement vehicle',
                };
            }
        }


        // Try to find quotation itinerary for detailed day-by-day stops
        let itineraryDays: any[] = [];
        const quotation = await prisma.quotation.findFirst({
            where: {
                companyId: booking.companyId,
                customerName: booking.customerName,
                vehicleNo: booking.vehicleNo
            },
            include: {
                tourSchedule: {
                    include: {
                        items: {
                            orderBy: { dayNumber: 'asc' }
                        }
                    }
                }
            }
        });

        if (quotation?.tourSchedule?.items) {
            itineraryDays = quotation.tourSchedule.items.map(item => ({
                day: item.dayNumber,
                title: item.title,
                description: item.description,
                distanceKm: item.distanceKm,
            }));
        }

        // Try to find customer phone / email from Customer or Quotation
        let customerPhone: string | null = null;
        let customerEmail: string | null = null;

        const customer = await prisma.customer.findFirst({
            where: {
                companyId: booking.companyId,
                name: booking.customerName,
            },
            select: {
                mobile: true,
                email: true,
            }
        });

        if (customer) {
            customerPhone = customer.mobile;
            customerEmail = customer.email;
        }

        if (quotation) {
            if (!customerPhone && quotation.customerPhone) {
                customerPhone = quotation.customerPhone;
            }
            if (!customerEmail && quotation.customerEmail) {
                customerEmail = quotation.customerEmail;
            }
        }

        // Build navigation target: prefer dropLocation, then destination, then pickup
        const primaryDestination = booking.dropLocation || booking.destination || booking.pickupLocation || '';
        const googleMapsNavUrl = primaryDestination
            ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(primaryDestination)}&travelmode=driving`
            : null;
        const wazeNavUrl = primaryDestination
            ? `https://waze.com/ul?q=${encodeURIComponent(primaryDestination)}&navigate=yes`
            : null;

        return NextResponse.json({
            success: true,
            data: {
                ...booking,
                customerPhone,
                customerEmail,
                vehicle,
                itineraryDays,
                navigation: {
                    target: primaryDestination,
                    googleMapsUrl: googleMapsNavUrl,
                    wazeUrl: wazeNavUrl
                }
            }
        });

    } catch (error) {
        console.error('Fetch tour error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// PUT: Update tour status or add activity
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await verifyDriver(req);
        if (auth.error) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

        const resolvedParams = await params;
        const bookingId = resolvedParams.id;
        const { companyId, id: driverId } = auth.driver;
        
        const body = await req.json();
        const parsed = DriverTourActionSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid action' }, { status: 400 });
        }
        const { action, note, meterReading, reason, location } = parsed.data;

        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking || booking.driverId !== driverId) {
            return NextResponse.json({ success: false, error: 'Tour not found or unauthorized' }, { status: 404 });
        }

        if (action === 'START_TRIP') {
            await prisma.$transaction([
                prisma.booking.update({
                    where: { id: bookingId },
                    data: { status: 'ONGOING' }
                }),
                prisma.user.update({
                    where: { id: driverId },
                    data: { isLiveTracking: true }
                }),
                prisma.tripActivity.create({
                    data: {
                        companyId,
                        bookingId,
                        driverId,
                        type: 'START',
                        note: meterReading ? `Trip Started. Start Meter: ${meterReading}` : 'Trip Started'
                    }
                })
            ]);
            return NextResponse.json({ success: true });
        }

        if (action === 'END_TRIP') {
            await prisma.$transaction([
                prisma.booking.update({
                    where: { id: bookingId },
                    data: { status: 'COMPLETED' }
                }),
                prisma.user.update({
                    where: { id: driverId },
                    data: { isLiveTracking: false }
                }),
                prisma.tripActivity.create({
                    data: {
                        companyId,
                        bookingId,
                        driverId,
                        type: 'END',
                        note: meterReading ? `Trip Ended. End Meter: ${meterReading}` : 'Trip Ended'
                    }
                })
            ]);
            return NextResponse.json({ success: true });
        }

        if (action === 'TAKEOVER') {
            await prisma.$transaction([
                prisma.booking.update({
                    where: { id: bookingId },
                    data: { status: 'ONGOING' }
                }),
                prisma.user.update({
                    where: { id: driverId },
                    data: { isLiveTracking: true }
                }),
                prisma.tripActivity.create({
                    data: {
                        companyId,
                        bookingId,
                        driverId,
                        type: 'TAKEOVER',
                        note: meterReading ? `Tour Taken Over. Takeover Meter: ${meterReading}` : 'Tour Taken Over by Driver'
                    }
                })
            ]);
            return NextResponse.json({ success: true, message: 'Tour takeover confirmed' });
        }

        if (action === 'REQUEST_HANDOVER') {
            if (!meterReading || !meterReading.toString().trim()) {
                return NextResponse.json({ 
                    success: false, 
                    error: 'Current odometer / meter reading is strictly required to request a handover.' 
                }, { status: 400 });
            }

            const handoverReason = reason || 'Driver Request';
            const details = [
                `Reason: ${handoverReason}`,
                `Meter: ${meterReading} km`,
                note ? `Location/Note: ${note}` : null
            ].filter(Boolean).join(' | ');

            const activity = await prisma.tripActivity.create({
                data: {
                    companyId,
                    bookingId,
                    driverId,
                    type: 'HANDOVER_REQUESTED',
                    note: `Handover Requested by Driver: ${details}`,
                }
            });

            return NextResponse.json({ 
                success: true, 
                message: 'Handover request logged and transmitted to dispatch.',
                data: activity 
            });
        }

        if (action === 'REPORT_BREAKDOWN') {
            if (!meterReading || !meterReading.toString().trim()) {
                return NextResponse.json({ 
                    success: false, 
                    error: 'Current odometer / meter reading is strictly required to report a breakdown.' 
                }, { status: 400 });
            }

            const breakdownReason = reason || 'Vehicle Breakdown';
            const details = [
                `Issue: ${breakdownReason}`,
                `Meter: ${meterReading} km`,
                location ? `Location: ${location}` : null,
                note ? `Notes: ${note}` : null
            ].filter(Boolean).join(' | ');

            const activity = await prisma.tripActivity.create({
                data: {
                    companyId,
                    bookingId,
                    driverId,
                    type: 'BREAKDOWN_REPORTED',
                    note: `Vehicle Breakdown Reported by Driver: ${details}`,
                }
            });

            return NextResponse.json({ 
                success: true, 
                message: 'Vehicle breakdown report logged and transmitted to dispatch.',
                data: activity 
            });
        }

        if (action === 'ADD_ACTIVITY') {

            const activity = await prisma.tripActivity.create({
                data: {
                    companyId,
                    bookingId,
                    driverId,
                    type: 'NOTE',
                    note: note || 'Activity recorded'
                }
            });
            return NextResponse.json({ success: true, data: activity });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Update tour error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
