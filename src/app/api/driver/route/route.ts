import { NextResponse } from 'next/server';
import { calculateRouteOSRM } from '@/lib/osrm-actions';

// POST: High-speed server-side OSRM driving route calculator for Driver App
// Avoids mobile carrier CGNAT / Cloudflare blocking on Dialog & Mobitel
export async function POST(req: Request) {
  try {
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

    const relativeExtraKm = Math.max(0, Math.round((routeResult.distanceKm - directDistanceKm) * 10) / 10);

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
  } catch (error: any) {
    console.error('Server route calculation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal route calculation error' },
      { status: 500 }
    );
  }
}
