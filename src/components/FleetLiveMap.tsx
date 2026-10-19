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
}

interface FleetLiveMapProps {
    vehicles: ActiveTourVehicle[];
    selectedVehicleId: string | null;
    onSelectVehicle?: (id: string) => void;
    height?: string;
    fitAllTrigger?: number;
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
    const initialFitDoneRef = useRef<boolean>(false);
    const leafletLibRef = useRef<any>(null);

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

    // Update Markers when vehicles change
    useEffect(() => {
        async function refresh() {
            if (!mapInstanceRef.current) return;
            const L = leafletLibRef.current || (await import('leaflet')).default;
            leafletLibRef.current = L;
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

            const marker = L.marker([v.lat, v.lon], { icon: customIcon }).addTo(map);

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
                map.setView([v.lat, v.lon], Math.max(map.getZoom(), 13), { animate: true });
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
            `}</style>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

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
