import { NextResponse } from 'next/server';
import { calculateRouteOSRM } from '@/lib/osrm-actions';
import { authenticateBearerOrSession, getClientIp } from '@/lib/security';
import { checkDistributedRateLimit } from '@/lib/rate-limit';

// POST: High-speed server-side OSRM driving route calculator for Driver App
// Avoids mobile carrier CGNAT / Cloudflare blocking on Dialog & Mobitel
export async function POST(req: Request) {
  try {
    const authRes = await authenticateBearerOrSession(req, ['DRIVER', 'ADMIN', 'OWNER']);
    if (!authRes.authenticated) {
      return NextResponse.json({ success: false, error: authRes.error }, { status: authRes.status });
    }

    const ip = getClientIp(req);
    const { limited } = await checkDistributedRateLimit(`driver-route:${authRes.userId}:${ip}`, 60, 60 * 1000);
    if (limited) {
      return NextResponse.json(
        { success: false, error: 'Too many route calculation requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { origin, destination, originCoords, destCoords, waypoints } = body;

    if (!origin || !destination) {
      return NextResponse.json(
        { success: false, error: 'Origin and destination are required' },
        { status: 400 }
      );
    }

    const routeResult = await calculateRouteOSRM(origin, destination, {
      originCoords: originCoords?.lat && originCoords?.lon ? originCoords : undefined,
      destCoords: destCoords?.lat && destCoords?.lon ? destCoords : undefined,
      waypoints: Array.isArray(waypoints) ? waypoints : undefined,
    });

    if (!routeResult.success) {
      return NextResponse.json({ success: false, error: routeResult.error }, { status: 500 });
    }

    // Direct baseline calculation if intermediate waypoints exist
    let directDistanceKm = routeResult.distanceKm;
    let directCoordinates = routeResult.coordinates;
    if (waypoints && waypoints.length > 0 && originCoords && destCoords) {
      try {
        const directRes = await calculateRouteOSRM(origin, destination, {
          originCoords,
          destCoords,
        });
        if (directRes.success) {
          directDistanceKm = directRes.distanceKm;
          directCoordinates = directRes.coordinates;
        }
      } catch {
        // use fallback direct
      }
    }

    const distKm = routeResult.distanceKm || 0;
    const dirKm = directDistanceKm || 0;
    const relativeExtraKm = Math.max(0, Math.round((distKm - dirKm) * 10) / 10);

    return NextResponse.json({
      success: true,
      distanceKm: routeResult.distanceKm,
      totalDistanceKm: routeResult.distanceKm,
      directDistanceKm,
      relativeExtraKm,
      durationText: routeResult.durationText,
      totalDurationText: routeResult.durationText,
      coordinates: routeResult.coordinates, // [[lat, lon], ...]
      directCoordinates,
      routeGeoJson: {
        type: 'LineString',
        coordinates: (routeResult.coordinates || []).map(([lat, lon]: [number, number]) => [lon, lat]),
      },
      directGeoJson: {
        type: 'LineString',
        coordinates: (directCoordinates || []).map(([lat, lon]: [number, number]) => [lon, lat]),
      },
      legs: routeResult.legs || [],
      waypoints: routeResult.waypoints || [],
    });
  } catch (error: unknown) {
    console.error('Server route calculation error:', error);
    const message = error instanceof Error ? error.message : 'Internal route calculation error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
