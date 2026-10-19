/**
 * Helper to extract mid-tour driver handover details and construct
 * Google Maps and Waze turn-by-turn navigation URLs for the newly assigned driver.
 */

export interface HandoverDetails {
    isHandover: boolean;
    needsTakeover: boolean;
    previousDriverName: string | null;
    meterReading: string | null;
    reason: string | null;
    location: string;
    instructions: string | null;
    coordinates: { lat: number; lon: number } | null;
    googleMapsUrl: string | null;
    wazeUrl: string | null;
}

export function extractHandoverNavigation(booking: {
    status: string;
    tripActivities?: Array<{ type: string; note?: string | null; timestamp: Date | string }>;
    driverLocations?: Array<{ lat: number; lon: number; timestamp?: Date | string }>;
}): { needsTakeover: boolean; handoverDetails: HandoverDetails | null } {
    const activities = booking.tripActivities || [];
    const handoverIdx = activities.findIndex((a) => a.type === 'HANDOVER');
    const takeoverIdx = activities.findIndex((a) => a.type === 'TAKEOVER');
    const handoverReqIdx = activities.findIndex((a) => a.type === 'HANDOVER_REQUESTED');
    const breakdownReqIdx = activities.findIndex((a) => a.type === 'BREAKDOWN_REPORTED');

    const isOngoing = booking.status === 'ONGOING';
    const needsTakeover = isOngoing && handoverIdx !== -1 && (takeoverIdx === -1 || handoverIdx < takeoverIdx);
    const hasHandover = handoverIdx !== -1 || handoverReqIdx !== -1;

    if (!hasHandover && !needsTakeover) {
        return { needsTakeover: false, handoverDetails: null };
    }

    const handoverAct = handoverIdx !== -1 ? activities[handoverIdx] : null;
    const handoverReqAct = handoverReqIdx !== -1 ? activities[handoverReqIdx] : null;
    const breakdownAct = breakdownReqIdx !== -1 ? activities[breakdownReqIdx] : null;

    // 1. Previous driver name
    let previousDriverName: string | null = null;
    if (handoverAct?.note) {
        const prevMatch = handoverAct.note.match(/Reassigned from\s+([^ to]+)\s+to/i);
        if (prevMatch) previousDriverName = prevMatch[1].trim();
    }

    // 2. Handover Meter Reading
    let meterReading: string | null = null;
    const meterMatch = 
        handoverAct?.note?.match(/Meter:\s*([0-9.]+)/i) ||
        handoverReqAct?.note?.match(/Meter:\s*([0-9.]+)/i) ||
        breakdownAct?.note?.match(/Meter:\s*([0-9.]+)/i);
    if (meterMatch) meterReading = meterMatch[1].trim();

    // 3. Reason
    let reason: string | null = null;
    const reasonMatch =
        handoverAct?.note?.match(/Reason:\s*([^|]+)/i) ||
        handoverReqAct?.note?.match(/Reason:\s*([^|]+)/i) ||
        breakdownAct?.note?.match(/Issue:\s*([^|]+)/i);
    if (reasonMatch) reason = reasonMatch[1].trim();

    // 4. Location
    let locationText: string | null = null;
    const locMatch =
        handoverAct?.note?.match(/Location:\s*([^|]+)/i) ||
        handoverReqAct?.note?.match(/Location:\s*([^|]+)/i) ||
        breakdownAct?.note?.match(/Location:\s*([^|]+)/i) ||
        handoverAct?.note?.match(/(?:Location\/Note|Meet Point):\s*([^|]+)/i);
    if (locMatch) locationText = locMatch[1].trim();

    // 5. Notes / Instructions
    let instructions: string | null = null;
    const notesMatch =
        handoverAct?.note?.match(/Notes:\s*([^|]+)/i) ||
        handoverReqAct?.note?.match(/Notes:\s*([^|]+)/i) ||
        breakdownAct?.note?.match(/Notes:\s*([^|]+)/i);
    if (notesMatch) instructions = notesMatch[1].trim();

    // 6. Coordinates from latest GPS location
    let coordinates: { lat: number; lon: number } | null = null;
    if (booking.driverLocations && booking.driverLocations.length > 0) {
        const latest = booking.driverLocations[0];
        if (typeof latest.lat === 'number' && typeof latest.lon === 'number') {
            coordinates = { lat: latest.lat, lon: latest.lon };
        }
    }

    // 7. Navigation URLs (prefer exact GPS coordinates for pin-point directions, fallback to location address)
    let googleMapsUrl: string | null = null;
    let wazeUrl: string | null = null;

    if (coordinates) {
        googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lon}&travelmode=driving`;
        wazeUrl = `https://waze.com/ul?ll=${coordinates.lat},${coordinates.lon}&navigate=yes`;
    } else if (locationText) {
        const encoded = encodeURIComponent(locationText);
        googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=driving`;
        wazeUrl = `https://waze.com/ul?q=${encoded}&navigate=yes`;
    }

    const displayLocation = locationText || (coordinates ? `Vehicle GPS Location (${coordinates.lat.toFixed(5)}, ${coordinates.lon.toFixed(5)})` : 'Assigned Handover Location');

    return {
        needsTakeover,
        handoverDetails: {
            isHandover: true,
            needsTakeover,
            previousDriverName,
            meterReading,
            reason,
            location: displayLocation,
            instructions,
            coordinates,
            googleMapsUrl,
            wazeUrl,
        }
    };
}
