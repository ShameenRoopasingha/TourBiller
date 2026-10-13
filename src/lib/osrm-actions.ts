'use server';

export interface PlaceSuggestion {
  displayName: string;
  shortName: string;
  lat: number;
  lon: number;
}

export interface RouteResult {
  success: boolean;
  distanceKm?: number;
  durationText?: string;
  startAddress?: string;
  endAddress?: string;
  error?: string;
}

/**
 * Search places using OpenStreetMap Nominatim
 */
export async function searchPlacesOSM(query: string): Promise<PlaceSuggestion[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query.trim()
    )}&limit=5&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'VigilTourManagementPlatform/1.0 (info@vigil.app)',
        'Accept-Language': 'en',
      },
      next: { revalidate: 3600 }, // Cache search queries for 1 hour
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => {
      const parts = (item.display_name || '').split(',');
      const shortName = parts.slice(0, 2).join(',').trim();
      return {
        displayName: item.display_name,
        shortName: shortName || item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      };
    });
  } catch (err) {
    console.error('OSM Places search error:', err);
    return [];
  }
}

/**
 * Geocode a place name into coordinates if not already provided
 */
async function geocodePlace(place: string): Promise<{ lat: number; lon: number; name: string } | null> {
  const suggestions = await searchPlacesOSM(place);
  if (suggestions.length > 0) {
    return {
      lat: suggestions[0].lat,
      lon: suggestions[0].lon,
      name: suggestions[0].shortName || suggestions[0].displayName,
    };
  }
  return null;
}

/**
 * Format duration in seconds to human-readable string (e.g., "2 hr 15 min")
 */
function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} mins`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (remainingMins === 0) return `${hours} hr`;
  return `${hours} hr ${remainingMins} min`;
}

/**
 * Calculate driving route distance & duration using OSRM
 */
export async function calculateRouteOSRM(
  origin: string,
  destination: string,
  originCoords?: { lat: number; lon: number },
  destCoords?: { lat: number; lon: number }
): Promise<RouteResult> {
  try {
    let startPoint = originCoords ? { ...originCoords, name: origin } : await geocodePlace(origin);
    let endPoint = destCoords ? { ...destCoords, name: destination } : await geocodePlace(destination);

    if (!startPoint) {
      return {
        success: false,
        error: `Could not find location: "${origin}". Please check the spelling.`,
      };
    }

    if (!endPoint) {
      return {
        success: false,
        error: `Could not find location: "${destination}". Please check the spelling.`,
      };
    }

    // Call OSRM public routing API (driving profile)
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startPoint.lon},${startPoint.lat};${endPoint.lon},${endPoint.lat}?overview=false`;

    const res = await fetch(osrmUrl, {
      headers: {
        'User-Agent': 'VigilTourManagementPlatform/1.0',
      },
    });

    if (!res.ok) {
      // Fallback: Haversine distance with road curvature factor (1.3x)
      const distanceKm = haversineDistance(startPoint.lat, startPoint.lon, endPoint.lat, endPoint.lon) * 1.3;
      const estimatedMins = Math.round((distanceKm / 45) * 60); // approx 45 km/h avg speed
      return {
        success: true,
        distanceKm: Math.round(distanceKm * 10) / 10,
        durationText: formatDuration(estimatedMins * 60),
        startAddress: startPoint.name,
        endAddress: endPoint.name,
      };
    }

    const data = await res.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      // Fallback: Haversine distance with road factor
      const distanceKm = haversineDistance(startPoint.lat, startPoint.lon, endPoint.lat, endPoint.lon) * 1.3;
      const estimatedMins = Math.round((distanceKm / 45) * 60);
      return {
        success: true,
        distanceKm: Math.round(distanceKm * 10) / 10,
        durationText: formatDuration(estimatedMins * 60),
        startAddress: startPoint.name,
        endAddress: endPoint.name,
      };
    }

    const route = data.routes[0];
    const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
    const durationText = formatDuration(route.duration);

    return {
      success: true,
      distanceKm,
      durationText,
      startAddress: startPoint.name,
      endAddress: endPoint.name,
    };
  } catch (err: any) {
    console.error('OSRM route calculation error:', err);
    return {
      success: false,
      error: 'Failed to calculate driving route. Please try again.',
    };
  }
}

/**
 * Haversine formula for straight-line distance in km
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
