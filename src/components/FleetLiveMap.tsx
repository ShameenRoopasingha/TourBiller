'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { calculateRouteOSRM, type RoutePoint } from '@/lib/osrm-actions';

export interface ActiveTourVehicle {
    id: string;
    bookingId: string;
    customerName: string;
    vehicleNo: string;
    vehicleModel?: string;
    vehicleCategory?: string;
    isExternalVehicle?: boolean;
    isHiredVehicle?: boolean;
    hiredSupplier?: string | null;
    wasSwapped?: boolean;
    driverId?: string | null;
    driverName: string;
    driverEmail?: string;
    pickupLocation?: string | null;
    destination?: string | null;
    dropLocation?: string | null;
    lat: number | null;
    lon: number | null;
    heading: number;
    speed: number;
    lastLocationAt: string | null;
    isFresh: boolean;
    isLiveTracking: boolean;
    hasPendingHandover?: boolean;
    handoverDetails?: {
        reason?: string;
        meterReading?: string;
        location?: string;
        note?: string;
        timestamp?: Date | string;
    } | null;
    hasPendingBreakdown?: boolean;
    breakdownDetails?: {
        reason?: string;
        meterReading?: string;
        location?: string;
        note?: string;
        timestamp?: Date | string;
    } | null;
    routePolyline?: any;
    intermediateStops?: string[];
}

interface FleetLiveMapProps {
    vehicles: ActiveTourVehicle[];
    selectedVehicleId: string | null;
    onSelectVehicle?: (id: string) => void;
    height?: string;
    fitAllTrigger?: number;
}

interface CachedRoute {
    coordinates: [number, number][];
    waypoints: RoutePoint[];
    distanceKm?: number;
    durationText?: string;
    isRoundTrip: boolean;
    splitIndex: number;
}

// Precise SVG Teardrop Pin Factory (matches Quotation & Google Maps)
function createTeardropPin(label: string, markerColor: string, isDual: boolean, L: any) {
    const pinWidth = isDual ? 36 : 28;
    const pinHeight = isDual ? 38 : 36;
    const anchorX = pinWidth / 2;
    const circleR = isDual ? 11 : 9;
    const circleCy = isDual ? 15 : 14;
    const fontSize = isDual ? 9 : 11;
    const textY = isDual ? 18.5 : 18;

    const path = isDual
        ? 'M18 0C8.059 0 0 8.059 0 18C0 28 18 38 18 38C18 38 36 28 36 18C36 8.059 27.941 0 18 0Z'
        : 'M14 0C6.268 0 0 6.268 0 14C0 24.5 14 36 14 36C14 36 28 24.5 28 14C28 6.268 21.732 0 14 0Z';

    const iconHtml = `
        <div style="position: relative; width: ${pinWidth}px; height: ${pinHeight}px;">
            <svg width="${pinWidth}" height="${pinHeight}" viewBox="0 0 ${pinWidth} ${pinHeight}" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
                <path d="${path}" fill="${markerColor}" stroke="#ffffff" stroke-width="2"/>
                <circle cx="${anchorX}" cy="${circleCy}" r="${circleR}" fill="#ffffff"/>
                <text x="${anchorX}" y="${textY}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${fontSize}" font-weight="900" fill="${markerColor}" text-anchor="middle">${label}</text>
            </svg>
        </div>
    `;

    return L.divIcon({
        className: 'custom-map-pin !bg-transparent !border-0',
        html: iconHtml,
        iconSize: [pinWidth, pinHeight],
        iconAnchor: [anchorX, pinHeight],
        popupAnchor: [0, -pinHeight],
    });
}

function parseRoutePolyline(raw: any): [number, number][] {
    if (!raw) return [];
    let coords: any[] = [];
    if (raw.coordinates && Array.isArray(raw.coordinates)) {
        coords = raw.coordinates.map((c: any) => [c[1], c[0]]);
    } else if (Array.isArray(raw)) {
        coords = raw
            .map((item: any) => {
                if (Array.isArray(item)) {
                    if (item[0] > 70 && item[1] < 15) {
                        return [item[1], item[0]];
                    }
                    return [item[0], item[1]];
                }
                if (item && typeof item === 'object' && 'lat' in item && 'lon' in item) {
                    return [item.lat, item.lon];
                }
                return null;
            })
            .filter(Boolean);
    }
    return coords as [number, number][];
}

export function FleetLiveMap({
    vehicles,
    selectedVehicleId,
    onSelectVehicle,
    height = '100%',
    fitAllTrigger,
}: FleetLiveMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<Map<string, any>>(new Map());
    const routeLayersRef = useRef<any[]>([]);
    const waypointMarkersRef = useRef<any[]>([]);
    const routeCacheRef = useRef<Map<string, CachedRoute>>(new Map());
    const initialFitDoneRef = useRef<boolean>(false);
    const leafletLibRef = useRef<any>(null);
    const lastFittedVehicleIdRef = useRef<string | null>(null);

    const [routeVersion, setRouteVersion] = useState<number>(0);
    const [activeRouteInfo, setActiveRouteInfo] = useState<{
        vehicleNo: string;
        isRoundTrip: boolean;
        hasStops: boolean;
        distanceKm?: number;
        durationText?: string;
    } | null>(null);

    // Initialize Map
    useEffect(() => {
        let isMounted = true;

        async function initMap() {
            if (!mapContainerRef.current) return;
            const L = (await import('leaflet')).default;
            leafletLibRef.current = L;

            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }

            if (!isMounted || !mapContainerRef.current) return;

            // Default center of Sri Lanka
            const defaultCenter: [number, number] = [7.8731, 80.7718];
            const map = L.map(mapContainerRef.current, {
                center: defaultCenter,
                zoom: 8,
                zoomControl: true,
            });

            mapInstanceRef.current = map;

            // OpenStreetMap Tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
                maxZoom: 19,
            }).addTo(map);

            updateMarkers(L, map);
            const activeVeh = vehicles.find((v) => v.id === selectedVehicleId) || (vehicles.length === 1 ? vehicles[0] : null);
            updateTourRoute(L, map, activeVeh);
        }

        initMap();

        return () => {
            isMounted = false;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Responsive ResizeObserver to keep map tiles crisp on mobile tab switches or window resize
    useEffect(() => {
        if (!mapContainerRef.current) return;

        const handleResize = () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
            }
        };

        let resizeObserver: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => {
                handleResize();
            });
            resizeObserver.observe(mapContainerRef.current);
        }

        window.addEventListener('resize', handleResize);

        return () => {
            if (resizeObserver) resizeObserver.disconnect();
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Fit all bounds when trigger changes
    useEffect(() => {
        if (fitAllTrigger && fitAllTrigger > 0 && mapInstanceRef.current && leafletLibRef.current) {
            fitAll();
        }
    }, [fitAllTrigger]);

    const fitAll = () => {
        if (!mapInstanceRef.current || !leafletLibRef.current) return;
        const L = leafletLibRef.current;
        const bounds = L.latLngBounds([]);
        let hasPoints = false;
        vehicles.forEach((v) => {
            if (v.lat !== null && v.lon !== null) {
                bounds.extend([v.lat, v.lon]);
                hasPoints = true;
            }
        });
        if (hasPoints) {
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
    };

    // Update Markers & Active Tour Route when vehicles or selection changes
    useEffect(() => {
        async function refresh() {
            if (!mapInstanceRef.current) return;
            const L = leafletLibRef.current || (await import('leaflet')).default;
            leafletLibRef.current = L;
            updateMarkers(L, mapInstanceRef.current);
            const activeVeh = vehicles.find((v) => v.id === selectedVehicleId) || (vehicles.length === 1 ? vehicles[0] : null);
            updateTourRoute(L, mapInstanceRef.current, activeVeh);
        }
        refresh();
    }, [vehicles, selectedVehicleId, routeVersion]);

    // Renders the Quotation-Style Dual Color Route (Royal Blue Outbound + Vibrant Amber Orange Return)
    function updateTourRoute(L: any, map: any, vehicle: ActiveTourVehicle | null) {
        if (!vehicle || (!vehicle.pickupLocation && !vehicle.destination && !vehicle.dropLocation)) {
            routeLayersRef.current.forEach((l) => l.remove());
            routeLayersRef.current = [];
            waypointMarkersRef.current.forEach((m) => m.remove());
            waypointMarkersRef.current = [];
            setActiveRouteInfo(null);
            return;
        }

        const originStr = vehicle.pickupLocation || 'Colombo Fort Station';
        const destStr = vehicle.dropLocation || vehicle.destination || vehicle.pickupLocation || 'Kandy';
        const waypointsStr = (vehicle.intermediateStops || []).join('|');
        const cacheKey = `${vehicle.id}:${originStr}-->${waypointsStr}-->${destStr}`;

        let cached = routeCacheRef.current.get(cacheKey);

        if (!cached) {
            // 1. Check if vehicle already contains a pre-saved routePolyline
            const polyCoords = parseRoutePolyline(vehicle.routePolyline);
            if (polyCoords.length > 1) {
                const waypoints: RoutePoint[] = [
                    { name: originStr, lat: polyCoords[0][0], lon: polyCoords[0][1] },
                ];
                if (vehicle.intermediateStops && vehicle.intermediateStops.length > 0) {
                    vehicle.intermediateStops.forEach((s, idx) => {
                        const fraction = (idx + 1) / (vehicle.intermediateStops!.length + 1);
                        const pt = polyCoords[Math.floor(polyCoords.length * fraction)];
                        waypoints.push({ name: s, lat: pt[0], lon: pt[1] });
                    });
                }
                waypoints.push({
                    name: destStr,
                    lat: polyCoords[polyCoords.length - 1][0],
                    lon: polyCoords[polyCoords.length - 1][1],
                });

                const isRoundTrip =
                    Math.hypot(
                        polyCoords[0][0] - polyCoords[polyCoords.length - 1][0],
                        polyCoords[0][1] - polyCoords[polyCoords.length - 1][1]
                    ) < 0.05;

                cached = {
                    coordinates: polyCoords,
                    waypoints,
                    isRoundTrip,
                    splitIndex: Math.max(1, Math.floor(polyCoords.length / 2)),
                };
                routeCacheRef.current.set(cacheKey, cached);
            } else {
                // 2. Fetch multi-stop route via OSRM Server Action
                calculateRouteOSRM(originStr, destStr, {
                    waypoints: vehicle.intermediateStops?.map((s) => ({ name: s })),
                })
                    .then((res) => {
                        if (res && res.success && res.coordinates && res.coordinates.length > 1) {
                            const isCircuit =
                                res.waypoints &&
                                res.waypoints.length >= 2 &&
                                (Math.hypot(
                                    res.waypoints[0].lat - res.waypoints[res.waypoints.length - 1].lat,
                                    res.waypoints[0].lon - res.waypoints[res.waypoints.length - 1].lon
                                ) < 0.05 ||
                                    res.waypoints[0].name.toLowerCase().trim() ===
                                        res.waypoints[res.waypoints.length - 1].name.toLowerCase().trim());

                            let split = Math.max(1, Math.floor(res.coordinates.length / 2));
                            if (res.waypoints && res.waypoints.length > 2) {
                                const lastStop = res.waypoints[res.waypoints.length - 2];
                                let minDist = Infinity;
                                for (let i = 1; i < res.coordinates.length - 1; i++) {
                                    const d = Math.hypot(
                                        res.coordinates[i][0] - lastStop.lat,
                                        res.coordinates[i][1] - lastStop.lon
                                    );
                                    if (d < minDist) {
                                        minDist = d;
                                        split = i;
                                    }
                                }
                            }

                            routeCacheRef.current.set(cacheKey, {
                                coordinates: res.coordinates,
                                waypoints: res.waypoints || [],
                                distanceKm: res.distanceKm,
                                durationText: res.durationText,
                                isRoundTrip: !!isCircuit,
                                splitIndex: split,
                            });
                            setRouteVersion((v) => v + 1);
                        }
                    })
                    .catch((err) => {
                        console.warn('Live Radar route calculation error:', err);
                    });
                return;
            }
        }

        // Clean up previous layers
        routeLayersRef.current.forEach((l) => l.remove());
        routeLayersRef.current = [];
        waypointMarkersRef.current.forEach((m) => m.remove());
        waypointMarkersRef.current = [];

        const { coordinates: coords, waypoints, isRoundTrip, splitIndex, distanceKm, durationText } = cached;

        // 1. Render Waypoint Pins (Teardrop Markers matching Quotation Map)
        waypoints.forEach((wp, idx) => {
            const isStart = idx === 0;
            const isEnd = idx === waypoints.length - 1;
            const isDual = isStart && isRoundTrip;

            if (isRoundTrip && isEnd && waypoints.length > 1) return;

            let label = 'A';
            let color = '#059669';
            let title = 'Pickup Location (A)';

            if (isDual) {
                label = 'A • B';
                color = '#0f766e';
                title = 'Start & Finish (Round Trip)';
            } else if (isEnd) {
                label = 'B';
                color = '#e11d48';
                title = 'Final Destination (B)';
            } else if (!isStart && !isEnd) {
                label = `${idx}`;
                color = '#2563eb';
                title = `Stop ${idx}`;
            }

            const pinIcon = createTeardropPin(label, color, isDual, L);
            const m = L.marker([wp.lat, wp.lon], { icon: pinIcon, zIndexOffset: 250 }).addTo(map);
            m.bindPopup(`
                <div style="font-family: inherit; font-size: 12px; min-width: 150px; padding: 2px;">
                    <div style="font-weight: 700; color: ${color}; text-transform: uppercase; font-size: 10px; margin-bottom: 2px;">${title}</div>
                    <div style="font-weight: 600; color: #0f172a;">${wp.name}</div>
                </div>
            `);
            waypointMarkersRef.current.push(m);
        });

        // 2. Render Dual-Color Polylines (Blue Outbound + Orange Return)
        if (coords.length > 1) {
            const safeSplit = Math.min(Math.max(1, splitIndex), coords.length - 1);

            // 🔵 Forward / Outbound Route - Royal Blue
            const outboundCoords = coords.slice(0, safeSplit + 1);
            const outbound = L.polyline(outboundCoords, {
                color: '#2563eb', // Blue-600
                weight: 5,
                opacity: 0.9,
                lineJoin: 'round',
            }).addTo(map);

            // 🟠 Return / Final Leg - Vibrant Amber Orange
            const returnCoords = coords.slice(safeSplit);
            const inbound = L.polyline(returnCoords, {
                color: '#ea580c', // Orange-600
                weight: 5,
                opacity: 0.95,
                dashArray: isRoundTrip ? '8, 4' : undefined,
                lineJoin: 'round',
            }).addTo(map);

            routeLayersRef.current.push(outbound, inbound);

            setActiveRouteInfo({
                vehicleNo: vehicle.vehicleNo,
                isRoundTrip,
                hasStops: waypoints.length > 2,
                distanceKm,
                durationText,
            });

            // Smoothly fit bounds when vehicle is selected
            if (lastFittedVehicleIdRef.current !== vehicle.id) {
                const bounds = L.latLngBounds(coords);
                if (vehicle.lat !== null && vehicle.lon !== null) {
                    bounds.extend([vehicle.lat, vehicle.lon]);
                }
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
                lastFittedVehicleIdRef.current = vehicle.id;
            }

            // Invalidate size to guarantee crisp vector rendering
            setTimeout(() => {
                if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
            }, 150);
        }
    }

    function updateMarkers(L: any, map: any) {
        // Clear old markers
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current.clear();

        const bounds = L.latLngBounds([]);
        let hasPoints = false;

        vehicles.forEach((v) => {
            if (v.lat === null || v.lon === null) return;

            hasPoints = true;
            const isSelected = selectedVehicleId === v.id;
            const isMoving = v.speed > 5;

            // Determine pin appearance & priority status
            let statusColor = v.isFresh ? (isMoving ? '#10b981' : '#3b82f6') : '#9ca3af';
            let pinEmoji = '🚗';
            let alertPulseHtml = '';
            let badgeExtra = '';

            if (v.hasPendingBreakdown) {
                statusColor = '#ef4444';
                pinEmoji = '🚨';
                badgeExtra = `<span style="background:#dc2626; color:white; font-size:9px; padding:1px 4px; border-radius:3px; margin-left:4px; font-weight:bold;">🚨 BREAKDOWN</span>`;
                alertPulseHtml = `
                    <span style="
                        position: absolute;
                        top: -4px;
                        width: 44px;
                        height: 44px;
                        border-radius: 50%;
                        background: rgba(239, 68, 68, 0.45);
                        animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
                    "></span>
                `;
            } else if (v.hasPendingHandover) {
                statusColor = '#f59e0b';
                pinEmoji = '⚠️';
                badgeExtra = `<span style="background:#d97706; color:white; font-size:9px; padding:1px 4px; border-radius:3px; margin-left:4px; font-weight:bold;">⚠️ HANDOVER</span>`;
                alertPulseHtml = `
                    <span style="
                        position: absolute;
                        top: -4px;
                        width: 44px;
                        height: 44px;
                        border-radius: 50%;
                        background: rgba(245, 158, 11, 0.45);
                        animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;
                    "></span>
                `;
            } else if (v.isFresh && isMoving) {
                alertPulseHtml = `
                    <span style="
                        position: absolute;
                        top: 4px;
                        width: 44px;
                        height: 44px;
                        border-radius: 50%;
                        background: rgba(16, 185, 129, 0.35);
                        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                    "></span>
                `;
            }

            // HTML Marker with Pulsing radar & Vehicle Badge
            const hiredBadgeHtml = v.isHiredVehicle
                ? `<span style="background:#b45309; color:white; font-size:9px; padding:1px 4px; border-radius:3px; margin-left:3px; font-weight:bold;">🤝 HIRED</span>`
                : '';

            const customIcon = L.divIcon({
                className: 'fleet-custom-marker',
                html: `
                    <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
                        <!-- Radar Pulse Animation -->
                        ${alertPulseHtml}

                        <!-- Vehicle Pin Icon -->
                        <div style="
                            width: 36px;
                            height: 36px;
                            border-radius: 50%;
                            background: ${isSelected ? '#f59e0b' : statusColor};
                            border: ${isSelected ? '3px solid #f59e0b' : v.isHiredVehicle && !v.hasPendingBreakdown ? '3px solid #f59e0b' : '3px solid white'};
                            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-size: 15px;
                            font-weight: bold;
                            z-index: 10;
                            transform: ${v.heading && !v.hasPendingBreakdown && !v.hasPendingHandover ? `rotate(${v.heading}deg)` : 'none'};
                            transition: transform 0.3s ease;
                        ">
                            ${pinEmoji}
                        </div>

                        <!-- Badge Label -->
                        <div style="
                            margin-top: 4px;
                            background: rgba(15, 23, 42, 0.9);
                            color: white;
                            padding: 2px 6px;
                            border-radius: 4px;
                            font-size: 10px;
                            font-weight: 600;
                            white-space: nowrap;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                            border: ${isSelected ? '1px solid #f59e0b' : v.hasPendingBreakdown ? '1px solid #ef4444' : v.hasPendingHandover ? '1px solid #f59e0b' : v.isHiredVehicle ? '1px solid #d97706' : '1px solid #334155'};
                        ">
                            ${v.vehicleNo} • ${Math.round(v.speed)} km/h ${badgeExtra} ${hiredBadgeHtml}
                        </div>
                    </div>
                `,
                iconSize: [40, 56],
                iconAnchor: [20, 28],
                popupAnchor: [0, -28],
            });

            const marker = L.marker([v.lat, v.lon], { icon: customIcon, zIndexOffset: 500 }).addTo(map);

            // Time difference string
            const lastSeenText = v.lastLocationAt
                ? Math.round((Date.now() - new Date(v.lastLocationAt).getTime()) / 1000) + 's ago'
                : 'Unknown';

            // Popup
            const popupContent = `
                <div style="font-family: inherit; font-size: 13px; line-height: 1.4; min-width: 220px;">
                    <div style="font-weight: bold; font-size: 14px; color: #0f172a; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <span>${v.vehicleNo}</span>
                        ${v.isHiredVehicle ? `
                            <span style="background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; font-size: 10px; font-weight: bold; padding: 1px 6px; border-radius: 9999px;">
                                🤝 Hired
                            </span>
                        ` : ''}
                        <span style="font-weight: normal; color: #64748b; font-size: 12px;">(${v.vehicleModel || (v.isHiredVehicle ? 'External Hire' : 'Vehicle')})</span>
                    </div>
                    ${v.isHiredVehicle ? `
                        <div style="margin-bottom: 6px; padding: 4px 8px; background: #fffbeb; border: 1px dashed #f59e0b; border-radius: 6px; color: #92400e; font-size: 11px;">
                            <div style="font-weight: bold;">🤝 External / Outsourced Vehicle</div>
                            ${v.hiredSupplier ? `<div>Supplier: <strong>${v.hiredSupplier}</strong></div>` : ''}
                            ${v.wasSwapped ? `<div style="font-size: 10px; color: #b45309; margin-top: 1px;">Assigned via Emergency Breakdown Swap</div>` : ''}
                        </div>
                    ` : ''}
                    <div style="color: #334155; margin-bottom: 2px;">
                        <strong>Driver:</strong> ${v.driverName}
                    </div>
                    <div style="color: #334155; margin-bottom: 2px;">
                        <strong>Customer:</strong> ${v.customerName}
                    </div>
                    ${v.pickupLocation ? `<div style="color: #334155; margin-bottom: 2px;"><strong>Pickup:</strong> ${v.pickupLocation}</div>` : ''}
                    ${v.destination || v.dropLocation ? `<div style="color: #334155; margin-bottom: 2px;"><strong>Destination:</strong> ${v.destination || v.dropLocation}</div>` : ''}
                    <div style="margin-top: 6px; display: flex; justify-content: space-between; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
                        <span style="color: #059669; font-weight: 600;">⚡ Speed: ${Math.round(v.speed)} km/h</span>
                        <span style="color: #64748b;">🕒 ${lastSeenText}</span>
                    </div>
                    <div style="margin-top: 4px;">
                        <span style="
                            display: inline-block;
                            padding: 2px 6px;
                            border-radius: 9999px;
                            font-size: 10px;
                            font-weight: 600;
                            background: ${v.isFresh ? '#dcfce7' : '#f1f5f9'};
                            color: ${v.isFresh ? '#166534' : '#475569'};
                        ">
                            ${v.isFresh ? '● GPS Connected' : '○ Signal Idle'}
                        </span>
                    </div>
                    ${v.hasPendingBreakdown ? `
                        <div style="margin-top: 8px; padding: 6px 8px; background: #fee2e2; border: 1px solid #ef4444; border-radius: 6px; color: #991b1b;">
                            <div style="font-weight: bold; font-size: 11px;">🚨 Breakdown Reported</div>
                            <div style="font-size: 11px; margin-top: 2px;">${v.breakdownDetails?.reason || 'Vehicle defect'}${v.breakdownDetails?.meterReading ? ` • ${v.breakdownDetails.meterReading} km` : ''}</div>
                            <a href="/bookings/${v.bookingId}#swap-section" style="display: block; margin-top: 5px; text-align: center; background: #dc2626; color: white; padding: 5px 8px; border-radius: 4px; font-weight: bold; text-decoration: none; font-size: 11px;">
                                ⚡ Emergency Vehicle Swap
                            </a>
                        </div>
                    ` : v.hasPendingHandover ? `
                        <div style="margin-top: 8px; padding: 6px 8px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; color: #92400e;">
                            <div style="font-weight: bold; font-size: 11px;">⚠️ Handover Requested</div>
                            <div style="font-size: 11px; margin-top: 2px;">${v.handoverDetails?.reason || 'Driver handover'}${v.handoverDetails?.meterReading ? ` • ${v.handoverDetails.meterReading} km` : ''}</div>
                            ${v.handoverDetails?.location ? `<div style="font-size: 10px; color: #b45309; margin-top: 2px;">📍 ${v.handoverDetails.location}</div>` : ''}
                            ${v.handoverDetails?.note ? `<div style="font-size: 10px; color: #78350f; margin-top: 1px;">📝 ${v.handoverDetails.note}</div>` : ''}
                            <a href="/bookings/${v.bookingId}#handover-section" style="display: block; margin-top: 5px; text-align: center; background: #d97706; color: white; padding: 5px 8px; border-radius: 4px; font-weight: bold; text-decoration: none; font-size: 11px;">
                                ⚡ Reassign Driver
                            </a>
                        </div>
                    ` : ''}
                </div>
            `;
            marker.bindPopup(popupContent);

            marker.on('click', () => {
                if (onSelectVehicle) onSelectVehicle(v.id);
            });

            if (isSelected) {
                marker.openPopup();
            }

            bounds.extend([v.lat, v.lon]);
            markersRef.current.set(v.id, marker);
        });

        // Fit bounds only on initial load so we don't disrupt user's custom zoom/pan on polling
        if (!selectedVehicleId && hasPoints && !initialFitDoneRef.current) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
            initialFitDoneRef.current = true;
        }
    }

    return (
        <div style={{ position: 'relative', width: '100%', height }}>
            <style jsx global>{`
                @keyframes ping {
                    75%, 100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
                .leaflet-touch .leaflet-bar a {
                    width: 36px !important;
                    height: 36px !important;
                    line-height: 36px !important;
                    font-size: 16px !important;
                }
                .leaflet-popup-content {
                    margin: 12px 14px !important;
                }
                .custom-map-pin {
                    background: transparent !important;
                    border: 0 !important;
                }
            `}</style>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

            {/* Quotation-Style Floating Route Legend */}
            {activeRouteInfo && (
                <div className="absolute bottom-6 left-4 z-[900] bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl px-3.5 py-2.5 text-white shadow-2xl flex items-center gap-4 text-xs animate-in fade-in duration-300">
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        <span className="font-semibold text-blue-300">
                            {activeRouteInfo.isRoundTrip ? 'Outbound Route' : activeRouteInfo.hasStops ? 'Forward Route' : 'Departure Leg'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className="w-4 h-1.5 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                            style={{ borderBottom: activeRouteInfo.isRoundTrip ? '2px dashed #f97316' : 'none' }}
                        />
                        <span className="font-semibold text-orange-300">
                            {activeRouteInfo.isRoundTrip ? 'Return Journey' : activeRouteInfo.hasStops ? 'Final Leg' : 'Arrival Leg'}
                        </span>
                    </div>
                    {activeRouteInfo.distanceKm ? (
                        <span className="text-[11px] text-slate-400 font-mono pl-2 border-l border-slate-700">
                            {activeRouteInfo.distanceKm} km
                        </span>
                    ) : null}
                </div>
            )}

            {/* Floating Fit All / Reset View Button */}
            <button
                type="button"
                onClick={fitAll}
                className="absolute bottom-6 right-4 z-[900] flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg border border-slate-700 shadow-xl backdrop-blur transition active:scale-95"
                title="Fit all active vehicles into view"
            >
                <span>🎯</span>
                <span className="hidden sm:inline">Fit All Vehicles</span>
                <span className="sm:hidden">Fit All</span>
            </button>
        </div>
    );
}
