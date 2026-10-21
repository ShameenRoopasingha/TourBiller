import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { auth } from '@/lib/auth';
import { DriverTourActionSchema } from '@/lib/validations';
import { getJwtSecret } from '@/lib/jwt';
import { extractHandoverNavigation } from '@/lib/handover-navigation';
import { formatApiErrorResponse } from '@/lib/error-handler';

// Middleware-like function to verify driver (Bearer token for Mobile App or NextAuth for Web Portal)
async function verifyDriver(req: Request) {
    // 1. Try Bearer token
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, getJwtSecret()) as any;
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

        const { needsTakeover, handoverDetails } = extractHandoverNavigation(booking);

        return NextResponse.json({
            success: true,
            data: {
                ...booking,
                customerPhone,
                customerEmail,
                vehicle,
                itineraryDays,
                needsTakeover,
                handoverDetails,
                navigation: {
                    target: primaryDestination,
                    googleMapsUrl: googleMapsNavUrl,
                    wazeUrl: wazeNavUrl
                }
            }
        });

    } catch (error) {
        return formatApiErrorResponse(error, 'Error fetching tour details');
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
        
        let body: any;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ success: false, error: 'Invalid JSON request payload' }, { status: 400 });
        }

        const parsed = DriverTourActionSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid action' }, { status: 400 });
        }
        const { action, note, meterReading, reason, location, changeType, extraKm, agreedByCustomer, pickupLocation, dropLocation, destination: destParam, stops, routePolyline } = parsed.data;

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
            // 1. Fetch raw telemetry coordinates for this booking
            const locations = await prisma.driverLocation.findMany({
                where: { bookingId },
                orderBy: { timestamp: 'asc' },
                select: {
                    lat: true,
                    lon: true,
                    timestamp: true
                }
            });

            // 2. Aggregate coordinates into compressed JSON array [[lat, lon, timestamp], ...]
            const routePolyline = locations.map(loc => [
                loc.lat,
                loc.lon,
                loc.timestamp.toISOString()
            ]);

            await prisma.$transaction([
                prisma.booking.update({
                    where: { id: bookingId },
                    data: {
                        status: 'COMPLETED',
                        ...(routePolyline.length > 0 ? { routePolyline: routePolyline as any } : {})
                    }
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

            // 3. Telemetry bloat prevention: delete raw DriverLocation rows older than 7 days
            try {
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                await prisma.driverLocation.deleteMany({
                    where: {
                        companyId,
                        timestamp: { lt: sevenDaysAgo }
                    }
                });
            } catch (pruneErr) {
                console.warn('Telemetry pruning non-critical error:', pruneErr);
            }

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
                note ? (note.includes('Location:') ? note : `Location/Note: ${note}`) : null
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

            // Set persistent emergency breakdown state on Booking (Section 1.3)
            await prisma.booking.update({
                where: { id: bookingId },
                data: {
                    isEmergencyActive: true,
                    emergencyReason: breakdownReason,
                    emergencyTriggeredAt: new Date(),
                    emergencyAcknowledgedAt: null,
                    emergencyAcknowledgedById: null,
                }
            });

            return NextResponse.json({ 
                success: true, 
                message: 'Vehicle breakdown report logged and transmitted to dispatch.',
                data: activity 
            });
        }

        if (action === 'CHANGE_ROUTE') {
            const formattedLocation = (location || '').trim();
            const formattedPickup = (pickupLocation || '').trim();
            const formattedDrop = (dropLocation || destParam || '').trim();

            if (!formattedLocation && !formattedPickup && !formattedDrop && (!Array.isArray(stops) || stops.length === 0)) {
                return NextResponse.json({
                    success: false,
                    error: 'At least one route location or intermediate stop is required'
                }, { status: 400 });
            }

            const routeReason = reason || 'Guest Requested Alteration';
            const extraKmText = extraKm && extraKm > 0 ? `~${extraKm} km extra` : 'Standard route';
            const agreedText = agreedByCustomer ? 'Guests agreed to extra charges' : 'Standard tour terms';

            const updateData: { pickupLocation?: string; destination?: string; dropLocation?: string; notes?: string; routePolyline?: any } = {};
            if (routePolyline) { updateData.routePolyline = routePolyline; }

            if (formattedPickup) {
                updateData.pickupLocation = formattedPickup;
            }
            if (formattedDrop || changeType === 'DESTINATION') {
                const targetEnd = formattedDrop || formattedLocation;
                if (targetEnd) {
                    updateData.destination = targetEnd;
                    updateData.dropLocation = targetEnd;
                }
            }

            const stopsStr = Array.isArray(stops) && stops.length > 0
                ? stops.map((s: any) => typeof s === 'string' ? s : (s.name || s.displayName || '')).filter(Boolean).join(' ➔ ')
                : (changeType === 'DETOUR' ? formattedLocation : '');

            let activityNote = '';
            if (changeType === 'ITINERARY' || (stopsStr && (formattedPickup || formattedDrop))) {
                const parts: string[] = [];
                if (updateData.pickupLocation || booking.pickupLocation) parts.push(`Pickup: ${updateData.pickupLocation || booking.pickupLocation}`);
                if (stopsStr) parts.push(`Stops: ${stopsStr}`);
                if (updateData.dropLocation || booking.dropLocation) parts.push(`Drop: ${updateData.dropLocation || booking.dropLocation}`);
                activityNote = `Tour Itinerary Alteration: ${parts.join(' ➔ ')} (${extraKmText} | ${agreedText} | Reason: ${routeReason}${note ? ` | Note: ${note}` : ''})`;
            } else if (changeType === 'DESTINATION') {
                activityNote = `Mid-Tour Destination Changed to: ${updateData.dropLocation || formattedLocation} (${extraKmText} | ${agreedText} | Reason: ${routeReason}${note ? ` | Note: ${note}` : ''})`;
            } else {
                activityNote = `Mid-Tour Detour / Stops Added: ${stopsStr || formattedLocation} (${extraKmText} | ${agreedText} | Reason: ${routeReason}${note ? ` | Note: ${note}` : ''})`;
            }

            const appendNote = `[Route Alteration ${new Date().toLocaleDateString('en-GB')}]: ${stopsStr ? `Stops: ${stopsStr}` : `Destination: ${updateData.dropLocation || formattedLocation}`} (${extraKmText})`;
            updateData.notes = booking.notes ? `${booking.notes}\n${appendNote}` : appendNote;

            const [updatedBooking, activity] = await prisma.$transaction([
                prisma.booking.update({
                    where: { id: bookingId },
                    data: updateData,
                }),
                prisma.tripActivity.create({
                    data: {
                        companyId,
                        bookingId,
                        driverId,
                        type: 'ROUTE_CHANGE',
                        note: activityNote,
                    }
                })
            ]);

            return NextResponse.json({
                success: true,
                message: changeType === 'DESTINATION' ? 'Tour destination updated successfully.' : 'Extra stop / detour added to tour itinerary.',
                data: {
                    booking: updatedBooking,
                    activity
                }
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
        return formatApiErrorResponse(error, 'Error updating tour status');
    }
}
