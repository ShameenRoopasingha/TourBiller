'use client';

import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export interface ActiveTourVehicle {
    id: string;
    bookingId: string;
    customerName: string;
    vehicleNo: string;
    vehicleModel?: string;
    vehicleCategory?: string;
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
}

interface FleetLiveMapProps {
    vehicles: ActiveTourVehicle[];
    selectedVehicleId: string | null;
    onSelectVehicle?: (id: string) => void;
    height?: string;
}

export function FleetLiveMap({
    vehicles,
    selectedVehicleId,
    onSelectVehicle,
    height = '100%',
}: FleetLiveMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<Map<string, any>>(new Map());

    // Initialize Map
    useEffect(() => {
        let isMounted = true;

        async function initMap() {
            if (!mapContainerRef.current) return;
            const L = (await import('leaflet')).default;

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

    // Update Markers when vehicles change
    useEffect(() => {
        async function refresh() {
            if (!mapInstanceRef.current) return;
            const L = (await import('leaflet')).default;
            updateMarkers(L, mapInstanceRef.current);
        }
        refresh();
    }, [vehicles, selectedVehicleId]);

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
            const statusColor = v.isFresh ? (isMoving ? '#10b981' : '#3b82f6') : '#9ca3af';

            // HTML Marker with Pulsing radar & Vehicle Badge
            const customIcon = L.divIcon({
                className: 'fleet-custom-marker',
                html: `
                    <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
                        <!-- Radar Pulse Animation for active moving vehicle -->
                        ${v.isFresh && isMoving ? `
                            <span style="
                                position: absolute;
                                top: 4px;
                                width: 44px;
                                height: 44px;
                                border-radius: 50%;
                                background: rgba(16, 185, 129, 0.35);
                                animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                            "></span>
                        ` : ''}

                        <!-- Vehicle Pin Icon -->
                        <div style="
                            width: 36px;
                            height: 36px;
                            border-radius: 50%;
                            background: ${isSelected ? '#f59e0b' : statusColor};
                            border: 3px solid white;
                            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-size: 15px;
                            font-weight: bold;
                            z-index: 10;
                            transform: ${v.heading ? `rotate(${v.heading}deg)` : 'none'};
                            transition: transform 0.3s ease;
                        ">
                            🚗
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
                            border: ${isSelected ? '1px solid #f59e0b' : '1px solid #334155'};
                        ">
                            ${v.vehicleNo} • ${Math.round(v.speed)} km/h
                        </div>
                    </div>
                `,
                iconSize: [40, 56],
                iconAnchor: [20, 28],
                popupAnchor: [0, -28],
            });

            const marker = L.marker([v.lat, v.lon], { icon: customIcon }).addTo(map);

            // Time difference string
            const lastSeenText = v.lastLocationAt
                ? Math.round((Date.now() - new Date(v.lastLocationAt).getTime()) / 1000) + 's ago'
                : 'Unknown';

            // Popup
            const popupContent = `
                <div style="font-family: inherit; font-size: 13px; line-height: 1.4; min-width: 200px;">
                    <div style="font-weight: bold; font-size: 14px; color: #0f172a; margin-bottom: 4px;">
                        ${v.vehicleNo} <span style="font-weight: normal; color: #64748b;">(${v.vehicleModel || 'Vehicle'})</span>
                    </div>
                    <div style="color: #334155; margin-bottom: 2px;">
                        <strong>Driver:</strong> ${v.driverName}
                    </div>
                    <div style="color: #334155; margin-bottom: 2px;">
                        <strong>Customer:</strong> ${v.customerName}
                    </div>
                    ${v.destination ? `<div style="color: #334155; margin-bottom: 2px;"><strong>Destination:</strong> ${v.destination}</div>` : ''}
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
                </div>
            `;
            marker.bindPopup(popupContent);

            marker.on('click', () => {
                if (onSelectVehicle) onSelectVehicle(v.id);
            });

            if (isSelected) {
                marker.openPopup();
                map.setView([v.lat, v.lon], Math.max(map.getZoom(), 13), { animate: true });
            }

            bounds.extend([v.lat, v.lon]);
            markersRef.current.set(v.id, marker);
        });

        // If no selected vehicle and multiple points exist on initial load, fit bounds
        if (!selectedVehicleId && hasPoints) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
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
            `}</style>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
}
