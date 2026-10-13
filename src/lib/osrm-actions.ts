'use server';

export interface PlaceSuggestion {
  displayName: string;
  shortName: string;
  lat: number;
  lon: number;
}

export interface RoutePoint {
  name: string;
  lat: number;
  lon: number;
}

export interface RouteLeg {
  distanceKm: number;
  durationText: string;
  fromName: string;
  toName: string;
}

export interface FuelEstimate {
  liters: number;
  estimatedCost: number; // in LKR
  ratePerLiter: number;
  kmPerLiter: number;
}

export interface RouteResult {
  success: boolean;
  distanceKm?: number;
  durationText?: string;
  startAddress?: string;
  endAddress?: string;
  waypoints?: RoutePoint[];
  legs?: RouteLeg[];
  coordinates?: [number, number][]; // [lat, lon] pairs for Leaflet map
  fuelEstimate?: FuelEstimate;
  googleMapsUrl?: string;
  wazeUrl?: string;
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
export async function geocodePlace(place: string): Promise<RoutePoint | null> {
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
 * Generate a 1-click Google Maps Navigation URL with waypoints
 */
function generateGoogleMapsUrl(points: RoutePoint[]): string {
  if (points.length < 2) return '';
  const origin = `${points[0].lat},${points[0].lon}`;
  const dest = `${points[points.length - 1].lat},${points[points.length - 1].lon}`;
  
  if (points.length === 2) {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
  }

  const intermediateWaypoints = points
    .slice(1, -1)
    .map((p) => `${p.lat},${p.lon}`)
    .join('|');

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&waypoints=${encodeURIComponent(
    intermediateWaypoints
  )}&travelmode=driving`;
}

/**
 * Generate a 1-click Waze Navigation URL for the final destination
 */
function generateWazeUrl(destination: RoutePoint): string {
  return `https://waze.com/ul?ll=${destination.lat},${destination.lon}&navigate=yes`;
}

/**
 * Advanced Multi-Stop Route Calculation using OSRM & TSP Optimization
 */
export async function calculateRouteOSRM(
  origin: string,
  destination: string,
  optionsOrOriginCoords?:
    | {
        originCoords?: { lat: number; lon: number };
        destCoords?: { lat: number; lon: number };
        waypoints?: Array<{ name: string; lat?: number; lon?: number }>;
        isRoundTrip?: boolean;
        optimizeWaypoints?: boolean;
        fuelKmPerLiter?: number;
        fuelPricePerLiter?: number;
      }
    | {
        lat: number;
        lon: number;
      },
  legacyDestCoords?: { lat: number; lon: number }
): Promise<RouteResult> {
  try {
    let options: {
      originCoords?: { lat: number; lon: number };
      destCoords?: { lat: number; lon: number };
      waypoints?: Array<{ name: string; lat?: number; lon?: number }>;
      isRoundTrip?: boolean;
      optimizeWaypoints?: boolean;
      fuelKmPerLiter?: number;
      fuelPricePerLiter?: number;
    } = {};

    if (optionsOrOriginCoords && 'lat' in optionsOrOriginCoords && 'lon' in optionsOrOriginCoords) {
      options = {
        originCoords: { lat: optionsOrOriginCoords.lat, lon: optionsOrOriginCoords.lon },
        destCoords: legacyDestCoords ? { lat: legacyDestCoords.lat, lon: legacyDestCoords.lon } : undefined,
      };
    } else if (optionsOrOriginCoords) {
      options = optionsOrOriginCoords;
    }

    const originPoint = options?.originCoords
      ? { ...options.originCoords, name: origin }
      : await geocodePlace(origin);

    const destPoint = options?.destCoords
      ? { ...options.destCoords, name: destination }
      : await geocodePlace(destination);

    if (!originPoint) {
      return { success: false, error: `Could not find origin: "${origin}". Please check spelling.` };
    }
    if (!destPoint) {
      return { success: false, error: `Could not find destination: "${destination}". Please check spelling.` };
    }

    // Geocode any intermediate waypoints
    const intermediatePoints: RoutePoint[] = [];
    if (options?.waypoints && options.waypoints.length > 0) {
      for (const wp of options.waypoints) {
        if (!wp.name?.trim()) continue;
        if (wp.lat !== undefined && wp.lon !== undefined) {
          intermediatePoints.push({ name: wp.name, lat: wp.lat, lon: wp.lon });
        } else {
          const geocoded = await geocodePlace(wp.name);
          if (geocoded) intermediatePoints.push(geocoded);
        }
      }
    }

    // Build complete route list of points
    let allPoints: RoutePoint[] = [originPoint, ...intermediatePoints, destPoint];

    // If round-trip requested, append origin back to the end
    if (options?.isRoundTrip) {
      allPoints.push({ ...originPoint, name: `${originPoint.name} (Return)` });
    }

    const shouldOptimize = options?.optimizeWaypoints && intermediatePoints.length > 1;

    // Construct OSRM endpoint URL (either /trip for TSP optimization or /route)
    const coordsParam = allPoints.map((p) => `${p.lon},${p.lat}`).join(';');
    
    let apiUrl = '';
    if (shouldOptimize) {
      apiUrl = `https://router.project-osrm.org/trip/v1/driving/${coordsParam}?source=first&destination=last&overview=full&geometries=geojson&steps=false`;
    } else {
      apiUrl = `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson&steps=false`;
    }

    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'VigilTourManagementPlatform/1.0',
      },
    });

    if (!res.ok) {
      return fallbackHaversineRoute(allPoints, options);
    }

    const data = await res.json();
    const routeObj = shouldOptimize ? data.trips?.[0] : data.routes?.[0];

    if (!routeObj) {
      return fallbackHaversineRoute(allPoints, options);
    }

    // If optimized, re-order waypoints according to OSRM result
    if (shouldOptimize && data.waypoints) {
      const sortedPoints: RoutePoint[] = new Array(allPoints.length);
      data.waypoints.forEach((wp: any, i: number) => {
        sortedPoints[wp.waypoint_index] = allPoints[i];
      });
      allPoints = sortedPoints.filter(Boolean);
    }

    const totalDistanceKm = Math.round((routeObj.distance / 1000) * 10) / 10;
    const durationText = formatDuration(routeObj.duration);

    // Extract Leaflet-friendly [lat, lon] coordinates from GeoJSON LineString
    const coordinates: [number, number][] = (routeObj.geometry?.coordinates || []).map(
      ([lon, lat]: [number, number]) => [lat, lon]
    );

    // Build leg breakdown
    const legs: RouteLeg[] = (routeObj.legs || []).map((leg: any, idx: number) => ({
      distanceKm: Math.round((leg.distance / 1000) * 10) / 10,
      durationText: formatDuration(leg.duration),
      fromName: allPoints[idx]?.name || `Stop ${idx + 1}`,
      toName: allPoints[idx + 1]?.name || `Stop ${idx + 2}`,
    }));

    // Calculate fuel consumption estimation
    const kmPerLiter = options?.fuelKmPerLiter || 11;
    const ratePerLiter = options?.fuelPricePerLiter || 350; // standard LKR fuel cost
    const fuelLiters = Math.round((totalDistanceKm / kmPerLiter) * 10) / 10;
    const estimatedFuelCost = Math.round(fuelLiters * ratePerLiter);

    return {
      success: true,
      distanceKm: totalDistanceKm,
      durationText,
      startAddress: allPoints[0].name,
      endAddress: allPoints[allPoints.length - 1].name,
      waypoints: allPoints,
      legs,
      coordinates,
      fuelEstimate: {
        liters: fuelLiters,
        estimatedCost: estimatedFuelCost,
        ratePerLiter,
        kmPerLiter,
      },
      googleMapsUrl: generateGoogleMapsUrl(allPoints),
      wazeUrl: generateWazeUrl(allPoints[allPoints.length - 1]),
    };
  } catch (err: any) {
    console.error('OSRM route calculation error:', err);
    return {
      success: false,
      error: 'Failed to calculate driving route. Please check location names.',
    };
  }
}

/**
 * Fallback straight-line distance with 1.3x Sri Lanka road factor if OSRM is unreachable
 */
function fallbackHaversineRoute(
  points: RoutePoint[],
  options?: any
): RouteResult {
  let totalKm = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalKm += haversineDistance(points[i].lat, points[i].lon, points[i + 1].lat, points[i + 1].lon) * 1.3;
  }
  const distanceKm = Math.round(totalKm * 10) / 10;
  const estimatedMins = Math.round((distanceKm / 45) * 60);

  const coordinates: [number, number][] = points.map((p) => [p.lat, p.lon]);
  const kmPerLiter = options?.fuelKmPerLiter || 11;
  const ratePerLiter = options?.fuelPricePerLiter || 350;
  const fuelLiters = Math.round((distanceKm / kmPerLiter) * 10) / 10;
  const estimatedFuelCost = Math.round(fuelLiters * ratePerLiter);

  return {
    success: true,
    distanceKm,
    durationText: formatDuration(estimatedMins * 60),
    startAddress: points[0].name,
    endAddress: points[points.length - 1].name,
    waypoints: points,
    coordinates,
    fuelEstimate: {
      liters: fuelLiters,
      estimatedCost: estimatedFuelCost,
      ratePerLiter,
      kmPerLiter,
    },
    googleMapsUrl: generateGoogleMapsUrl(points),
    wazeUrl: generateWazeUrl(points[points.length - 1]),
  };
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
