'use server';

import { getBusinessProfile } from '@/lib/actions';

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
 * Curated Sri Lanka Tourist Landmarker & Vehicle Entrance Dictionary
 * National park centroids are often deep in untraversable wilderness; these coordinates
 * pin directly to the actual tourist vehicle ticket gates, safari entrances, and visitor parking.
 */
const SRI_LANKA_LANDMARKS = [
  {
    name: 'Bandaranaike International Airport (BIA), Katunayake',
    shortName: 'BIA Airport, Katunayake',
    aliases: ['bia', 'airport', 'colombo airport', 'katunayake', 'katunayake airport', 'bandaranaike', 'bandaranaike international airport', 'cmb airport'],
    lat: 7.1804,
    lon: 79.8841,
  },
  {
    name: 'Yala National Park (Palatupana Main Gate Entrance)',
    shortName: 'Yala National Park (Palatupana Gate)',
    aliases: ['yala', 'yala national park', 'yala safari', 'palatupana', 'palatupana entrance'],
    lat: 6.2738,
    lon: 81.4288,
  },
  {
    name: 'Sigiriya Rock Fortress (Visitor Center & Parking)',
    shortName: 'Sigiriya Lion Rock',
    aliases: ['sigiriya', 'sigiriya rock', 'lion rock', 'sigiriya fortress'],
    lat: 7.9541,
    lon: 80.7553,
  },
  {
    name: 'Pinnawala Elephant Orphanage (Main Entrance)',
    shortName: 'Pinnawala Elephant Orphanage',
    aliases: ['pinnawala', 'pinnawala elephant orphanage', 'elephant orphanage', 'pinnawela'],
    lat: 7.3013,
    lon: 80.3871,
  },
  {
    name: 'Temple of the Sacred Tooth Relic (Dalada Maligawa), Kandy',
    shortName: 'Temple of the Tooth, Kandy',
    aliases: ['dalada maligawa', 'temple of the tooth', 'tooth temple', 'kandy temple', 'sri dalada maligawa'],
    lat: 7.2936,
    lon: 80.6413,
  },
  {
    name: 'Galle Fort (Main Gate Vehicle Entrance)',
    shortName: 'Galle Fort Main Gate',
    aliases: ['galle fort', 'galle rampart', 'dutch fort galle', 'galle dutch fort'],
    lat: 6.0354,
    lon: 80.2173,
  },
  {
    name: 'Nine Arches Bridge (Viewpoint Access), Ella',
    shortName: 'Nine Arches Bridge, Ella',
    aliases: ['nine arch', 'nine arches', 'nine arches bridge', 'demodara bridge', 'demodara nine arch'],
    lat: 6.8768,
    lon: 81.0608,
  },
  {
    name: 'Little Adam\'s Peak (Trailhead Entrance), Ella',
    shortName: 'Little Adam\'s Peak, Ella',
    aliases: ['little adam', 'little adams', 'little adams peak', 'punchi sri pada'],
    lat: 6.8624,
    lon: 81.0645,
  },
  {
    name: 'Adam\'s Peak (Sri Pada - Nallathanniya Base Trailhead)',
    shortName: 'Adam\'s Peak (Nallathanniya Base)',
    aliases: ['adams peak', 'adam\'s peak', 'sri pada', 'nallathanniya', 'sripada'],
    lat: 6.8164,
    lon: 80.5218,
  },
  {
    name: 'Horton Plains National Park (Visitor Entrance & Ticket Office)',
    shortName: 'Horton Plains (World\'s End)',
    aliases: ['horton plains', 'horton plain', 'worlds end', 'world\'s end', 'horton plains national park'],
    lat: 6.8096,
    lon: 80.8144,
  },
  {
    name: 'Udawalawe National Park (Main Safari Gate)',
    shortName: 'Udawalawe National Park',
    aliases: ['udawalawe', 'udawalawa', 'uda walawe', 'udawalawe national park', 'udawalawe safari'],
    lat: 6.4746,
    lon: 80.8893,
  },
  {
    name: 'Wilpattu National Park (Hunuwilgama Main Gate)',
    shortName: 'Wilpattu National Park',
    aliases: ['wilpattu', 'wilpattu national park', 'wilpattu safari', 'hunuwilgama'],
    lat: 8.3182,
    lon: 80.1472,
  },
  {
    name: 'Minneriya National Park (Main Entrance Gate)',
    shortName: 'Minneriya National Park',
    aliases: ['minneriya', 'minneriya national park', 'minneriya elephant gathering', 'minneriya safari'],
    lat: 8.0315,
    lon: 80.8315,
  },
  {
    name: 'Dambulla Cave Temple (Golden Buddha Vehicle Entrance)',
    shortName: 'Dambulla Golden Cave Temple',
    aliases: ['dambulla cave temple', 'golden temple dambulla', 'dambulla temple', 'dambulla rock temple'],
    lat: 7.8569,
    lon: 80.6485,
  },
  {
    name: 'Mirissa Beach & Whale Watching Harbor',
    shortName: 'Mirissa Beach & Harbor',
    aliases: ['mirissa', 'mirissa beach', 'mirissa harbor', 'mirissa harbour', 'mirissa whale watching'],
    lat: 5.9483,
    lon: 80.4589,
  },
  {
    name: 'Unawatuna Beach (Main Access Road)',
    shortName: 'Unawatuna Beach',
    aliases: ['unawatuna', 'unawatuna beach', 'unawatuna bay'],
    lat: 6.0108,
    lon: 80.2486,
  },
  {
    name: 'Bentota Beach & Watersports Center',
    shortName: 'Bentota Beach',
    aliases: ['bentota', 'bentota beach', 'bentota river'],
    lat: 6.4258,
    lon: 79.9984,
  },
  {
    name: 'Arugam Bay (Main Surf Beach)',
    shortName: 'Arugam Bay Surf Point',
    aliases: ['arugam bay', 'arugambay', 'arugam bay surf'],
    lat: 6.8422,
    lon: 81.8315,
  },
  {
    name: 'Polonnaruwa Ancient City (Museum & Ticket Counter)',
    shortName: 'Polonnaruwa Ancient City',
    aliases: ['polonnaruwa', 'polonnaruwa ancient city', 'polonnaruwa ruins'],
    lat: 7.9403,
    lon: 81.0028,
  },
  {
    name: 'Anuradhapura Sacred City (Ruwanwelisaya & Sri Maha Bodhi)',
    shortName: 'Anuradhapura Sacred City',
    aliases: ['anuradhapura', 'anuradhapura sacred city', 'ruwanwelisaya', 'sri maha bodhi', 'jaya sri maha bodhi'],
    lat: 8.3449,
    lon: 80.3964,
  },
  {
    name: 'Lake Gregory Promenade & Recreation Park, Nuwara Eliya',
    shortName: 'Gregory Lake, Nuwara Eliya',
    aliases: ['lake gregory', 'gregory lake', 'gregory lake nuwara eliya'],
    lat: 6.9535,
    lon: 80.7788,
  },
  {
    name: 'Royal Botanical Gardens (Main Entrance Gate), Peradeniya',
    shortName: 'Peradeniya Botanical Gardens',
    aliases: ['peradeniya gardens', 'royal botanical gardens', 'peradeniya botanical gardens', 'peradeniya garden'],
    lat: 7.2715,
    lon: 80.5962,
  },
  {
    name: 'Ambuluwawa Biodiversity Complex & Tower, Gampola',
    shortName: 'Ambuluwawa Tower',
    aliases: ['ambuluwawa', 'ambuluwawa tower', 'ambuluwawa temple'],
    lat: 7.1702,
    lon: 80.5488,
  },
  {
    name: 'Sinharaja Forest Reserve (Kudawa Conservation Center Entrance)',
    shortName: 'Sinharaja Rain Forest (Kudawa Gate)',
    aliases: ['sinharaja', 'sinharaja forest', 'sinharaja rain forest', 'sinharaja rainforest', 'kudawa entrance'],
    lat: 6.4397,
    lon: 80.4206,
  },
  {
    name: 'Colombo Fort Railway Station & Transit Hub',
    shortName: 'Colombo Fort Station',
    aliases: ['colombo fort', 'fort railway station', 'colombo fort station', 'fort station'],
    lat: 6.9344,
    lon: 79.8519,
  },
  {
    name: 'Colombo Port City (Main Entrance & Promenade)',
    shortName: 'Colombo Port City',
    aliases: ['port city', 'colombo port city', 'port city colombo'],
    lat: 6.9344,
    lon: 79.8428,
  },
  {
    name: 'Kandy City Centre (KCC Shopping & Transit)',
    shortName: 'Kandy City Centre (KCC)',
    aliases: ['kcc', 'kandy city centre', 'kandy city center', 'kandy town'],
    lat: 7.2917,
    lon: 80.6358,
  },
  {
    name: 'Hikkaduwa Coral Reef & Beach',
    shortName: 'Hikkaduwa Beach',
    aliases: ['hikkaduwa', 'hikkaduwa beach', 'hikkaduwa coral sanctuary'],
    lat: 6.1394,
    lon: 80.1008,
  },
  {
    name: 'Weligama Bay Surf Point',
    shortName: 'Weligama Bay',
    aliases: ['weligama', 'weligama beach', 'weligama surf'],
    lat: 5.9733,
    lon: 80.4285,
  },
  {
    name: 'Nilaveli Beach & Pigeon Island Launch, Trincomalee',
    shortName: 'Nilaveli Beach, Trincomalee',
    aliases: ['nilaveli', 'nilaveli beach', 'pigeon island'],
    lat: 8.6897,
    lon: 81.1963,
  },
  {
    name: 'Pidurangala Rock (Temple Entrance & Ticket Office)',
    shortName: 'Pidurangala Rock',
    aliases: ['pidurangala', 'pidurangala rock'],
    lat: 7.9654,
    lon: 80.7632,
  },
  {
    name: 'Ravana Waterfall & Viewpoint, Ella',
    shortName: 'Ravana Falls, Ella',
    aliases: ['ravana falls', 'rawana falls', 'ravana waterfall'],
    lat: 6.8409,
    lon: 81.0543,
  },
  {
    name: 'Lipton\'s Seat (Dambatenne Tea Estate Entry), Haputale',
    shortName: 'Lipton\'s Seat, Haputale',
    aliases: ['liptons seat', 'lipton\'s seat', 'dambatenne'],
    lat: 6.7797,
    lon: 81.0142,
  },
  {
    name: 'Kataragama Sacred City (Kiri Vehera & Maha Devalaya)',
    shortName: 'Kataragama Sacred City',
    aliases: ['kataragama', 'kataragama temple', 'kiri vehera', 'kataragama devalaya'],
    lat: 6.4216,
    lon: 81.3342,
  }
];

/**
 * Search places using OpenStreetMap Nominatim with intelligent regional prioritization
 * based on the tenant's configured country (e.g. lk, gb, ae, us, au, in), backed by full worldwide coverage.
 */
export async function searchPlacesOSM(
  query: string,
  explicitCountryCode?: string
): Promise<PlaceSuggestion[]> {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.trim().toLowerCase();
  const matchedCurated: PlaceSuggestion[] = [];

  // Determine active country code (explicit, or from business profile, or fallback to global)
  let activeCountryCode = explicitCountryCode ? explicitCountryCode.toLowerCase().trim() : undefined;
  if (!activeCountryCode) {
    try {
      const profileResult = await getBusinessProfile();
      if (profileResult.success && profileResult.data?.countryCode) {
        activeCountryCode = profileResult.data.countryCode.toLowerCase().trim();
      }
    } catch {
      // ignore
    }
  }

  // If in Sri Lanka or when specifically searching a distinct Sri Lankan landmark, match exact aliases
  if (activeCountryCode === 'lk' || !activeCountryCode) {
    for (const lm of SRI_LANKA_LANDMARKS) {
      const isDirectMatch = lm.aliases.some(
        (a) => cleanQuery === a || cleanQuery.startsWith(a + ' ') || cleanQuery.endsWith(' ' + a) || (cleanQuery.includes(a) && a.length > 4)
      );
      if (isDirectMatch) {
        matchedCurated.push({
          displayName: lm.name,
          shortName: lm.shortName,
          lat: lm.lat,
          lon: lm.lon,
        });
        if (matchedCurated.length >= 2) break;
      }
    }
  }

  try {
    let data: any[] = [];

    // 1. If country code is configured (and not global), prioritize searches within the tenant's country
    if (activeCountryCode && activeCountryCode !== 'global' && activeCountryCode !== 'all' && activeCountryCode !== 'eu') {
      const countryUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query.trim()
      )}&countrycodes=${encodeURIComponent(activeCountryCode)}&limit=6&addressdetails=1`;

      const res = await fetch(countryUrl, {
        headers: {
          'User-Agent': 'VigilTourManagementPlatform/1.0 (info@vigil.app)',
          'Accept-Language': 'en',
        },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          data = json;
        }
      }
    }

    // 2. If country search returned fewer than 3 results or no country code is set, run global search
    if (data.length < 3) {
      const globalUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query.trim()
      )}&limit=8&addressdetails=1`;

      const res = await fetch(globalUrl, {
        headers: {
          'User-Agent': 'VigilTourManagementPlatform/1.0 (info@vigil.app)',
          'Accept-Language': 'en',
        },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const globalJson = await res.json();
        if (Array.isArray(globalJson)) {
          for (const item of globalJson) {
            if (!data.some((d) => d.place_id === item.place_id)) {
              data.push(item);
            }
          }
        }
      }
    }

    const osmResults: PlaceSuggestion[] = data.map((item: any) => {
      const parts = (item.display_name || '').split(',');
      const shortName = parts.slice(0, 2).join(',').trim();
      return {
        displayName: item.display_name,
        shortName: shortName || item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      };
    });

    // 3. Merge curated results with OSM results, preventing duplicate locations
    const combined: PlaceSuggestion[] = [...matchedCurated];
    for (const osm of osmResults) {
      const alreadyIncluded = combined.some(
        (c) =>
          haversineDistance(c.lat, c.lon, osm.lat, osm.lon) < 0.5 ||
          c.shortName.toLowerCase() === osm.shortName.toLowerCase()
      );
      if (!alreadyIncluded) {
        combined.push(osm);
      }
    }

    return combined.slice(0, 8);
  } catch (err) {
    console.error('OSM Places search error:', err);
    return matchedCurated;
  }
}

/**
 * Geocode a place name into coordinates if not already provided
 */
export async function geocodePlace(place: string, countryCode?: string): Promise<RoutePoint | null> {
  const clean = place.trim().toLowerCase();
  const directLandmark = SRI_LANKA_LANDMARKS.find((lm) =>
    lm.aliases.some((a) => clean === a || clean.startsWith(a + ' ') || clean.endsWith(' ' + a))
  );

  if (directLandmark) {
    return {
      lat: directLandmark.lat,
      lon: directLandmark.lon,
      name: directLandmark.shortName,
    };
  }

  const suggestions = await searchPlacesOSM(place, countryCode);
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

    // Check if destination is already essentially the origin (distance < 1km or matching town name)
    const isAlreadyReturning =
      haversineDistance(originPoint.lat, originPoint.lon, destPoint.lat, destPoint.lon) < 1.0 ||
      originPoint.name.split(',')[0].trim().toLowerCase() === destPoint.name.split(',')[0].trim().toLowerCase();

    // If round-trip requested and destination is not already the origin, append origin back to the end
    if (options?.isRoundTrip && !isAlreadyReturning) {
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

    // Snap waypoints to exact road coordinates returned by OSRM to guarantee 100% pin-on-road accuracy
    if (data.waypoints && data.waypoints.length === allPoints.length) {
      if (shouldOptimize) {
        const sortedPoints: RoutePoint[] = new Array(allPoints.length);
        data.waypoints.forEach((wp: any, i: number) => {
          const originalPoint = allPoints[i];
          const roadLat = Array.isArray(wp.location) && wp.location.length >= 2 ? wp.location[1] : originalPoint.lat;
          const roadLon = Array.isArray(wp.location) && wp.location.length >= 2 ? wp.location[0] : originalPoint.lon;
          sortedPoints[wp.waypoint_index] = {
            ...originalPoint,
            lat: roadLat,
            lon: roadLon,
          };
        });
        allPoints = sortedPoints.filter(Boolean);
      } else {
        allPoints = allPoints.map((point, i) => {
          const wp = data.waypoints[i];
          if (wp && Array.isArray(wp.location) && wp.location.length >= 2) {
            return {
              ...point,
              lat: wp.location[1],
              lon: wp.location[0],
            };
          }
          return point;
        });
      }
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
