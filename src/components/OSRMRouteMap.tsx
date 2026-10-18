'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { RoutePoint } from '@/lib/osrm-actions';
import { Navigation } from 'lucide-react';

interface OSRMRouteMapProps {
  coordinates?: [number, number][]; // [lat, lon]
  waypoints?: RoutePoint[];
  height?: string;
  className?: string;
  showOverlayLegend?: boolean;
}

export function OSRMRouteMap({
  coordinates = [],
  waypoints = [],
  height = '320px',
  className = '',
  showOverlayLegend = false,
}: OSRMRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isCircuitRoute, setIsCircuitRoute] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      // Clean up existing map instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      if (!isMounted || !mapContainerRef.current) return;

      // Default Sri Lanka center if no coordinates
      const defaultCenter: [number, number] = [7.8731, 80.7718];
      const initialZoom = coordinates.length > 0 ? 10 : 7;

      const map = L.map(mapContainerRef.current, {
        center: coordinates[0] || defaultCenter,
        zoom: initialZoom,
        scrollWheelZoom: false,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      // Detect if route is a round-trip circuit (origin == destination)
      let isCircuit = false;
      let splitIndex = -1;

      if (coordinates.length > 2 && waypoints.length >= 3) {
        const originWp = waypoints[0];
        const destWp = waypoints[waypoints.length - 1];
        const turnaroundWp = waypoints[waypoints.length - 2];

        const dOriginDest = Math.hypot(originWp.lat - destWp.lat, originWp.lon - destWp.lon);
        const nameOrigin = (originWp.name || '').toLowerCase().split(',')[0].trim();
        const nameDest = (destWp.name || '').toLowerCase().split(',')[0].trim();

        if (
          dOriginDest < 0.05 ||
          nameOrigin === nameDest ||
          (nameOrigin && nameDest && (nameOrigin.includes(nameDest) || nameDest.includes(nameOrigin)))
        ) {
          // Find the index in coordinates closest to the turnaround stop
          let minDist = Infinity;
          for (let i = 1; i < coordinates.length - 1; i++) {
            const dist = Math.hypot(coordinates[i][0] - turnaroundWp.lat, coordinates[i][1] - turnaroundWp.lon);
            if (dist < minDist) {
              minDist = dist;
              splitIndex = i;
            }
          }

          if (splitIndex > 5 && splitIndex < coordinates.length - 5) {
            isCircuit = true;
          }
        }
      }

      setIsCircuitRoute(isCircuit);

      // Draw Route Polylines
      if (coordinates.length > 1) {
        if (isCircuit && splitIndex > 0) {
          // 1. Outbound / Forward Journey - Royal Blue
          const outboundCoords = coordinates.slice(0, splitIndex + 1);
          const outboundPolyline = L.polyline(outboundCoords, {
            color: '#2563eb', // Blue-600
            weight: 5,
            opacity: 0.9,
            lineJoin: 'round',
          }).addTo(map);

          // 2. Return / Inbound Journey - Vibrant Amber Orange with slight dash
          const returnCoords = coordinates.slice(splitIndex);
          const returnPolyline = L.polyline(returnCoords, {
            color: '#ea580c', // Orange-600
            weight: 5,
            opacity: 0.95,
            dashArray: '8, 4',
            lineJoin: 'round',
          }).addTo(map);

          const group = L.featureGroup([outboundPolyline, returnPolyline]);
          map.fitBounds(group.getBounds(), { padding: [18, 18] });
        } else {
          // Standard single route - Blue
          const polyline = L.polyline(coordinates, {
            color: '#2563eb', // Blue-600
            weight: 5,
            opacity: 0.85,
            lineJoin: 'round',
          }).addTo(map);

          map.fitBounds(polyline.getBounds(), { padding: [18, 18] });
        }
      }

      // Add HTML DivIcon Markers for all stops
      if (waypoints.length > 0) {
        const isRoundTrip = isCircuit || (waypoints.length >= 2 && (
          Math.hypot(waypoints[0].lat - waypoints[waypoints.length - 1].lat, waypoints[0].lon - waypoints[waypoints.length - 1].lon) < 0.05 ||
          (waypoints[0].name && waypoints[waypoints.length - 1].name && waypoints[0].name.toLowerCase().split(',')[0].trim() === waypoints[waypoints.length - 1].name.toLowerCase().split(',')[0].trim())
        ));

        waypoints.forEach((wp, idx) => {
          const isStart = idx === 0;
          const isEnd = idx === waypoints.length - 1;

          // If this is a round trip/circuit and this is the final waypoint (same location as start),
          // skip rendering a duplicate marker so it doesn't obscure Marker A
          if (isRoundTrip && isEnd && waypoints.length > 1) {
            return;
          }

          const isStop = !isStart && !isEnd;
          const isDualRole = isStart && isRoundTrip;

          let label = 'A';
          let markerColor = '#059669'; // Green
          let roleLabel = isStart ? 'Origin' : 'Destination';

          if (isDualRole) {
            label = 'A • B';
            roleLabel = 'Start & Finish (Round Trip)';
            markerColor = '#0f766e'; // Teal
          } else if (isEnd) {
            label = 'B';
            markerColor = '#e11d48'; // Rose
            roleLabel = 'Destination';
          } else if (isStop) {
            label = `${idx}`;
            // If it's the turnaround stop in a circuit tour, highlight with amber
            if (isCircuit && idx === waypoints.length - 2) {
              markerColor = '#ea580c'; // Amber Orange
              roleLabel = 'Turnaround Stop';
            } else {
              markerColor = '#2563eb'; // Blue
              roleLabel = `Stop ${idx}`;
            }
          }

          const pinWidth = isDualRole ? 36 : 28;
          const pinHeight = isDualRole ? 38 : 36;
          const anchorX = pinWidth / 2;
          const circleR = isDualRole ? 11 : 9;
          const circleCy = isDualRole ? 15 : 14;
          const fontSize = isDualRole ? 9 : 11;
          const textY = isDualRole ? 18.5 : 18;

          // Precise SVG Teardrop Pin
          const iconHtml = `
            <div style="position: relative; width: ${pinWidth}px; height: ${pinHeight}px;">
              <svg width="${pinWidth}" height="${pinHeight}" viewBox="0 0 ${pinWidth} ${pinHeight}" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
                ${isDualRole ? `
                  <path d="M18 0C8.059 0 0 8.059 0 18C0 28 18 38 18 38C18 38 36 28 36 18C36 8.059 27.941 0 18 0Z" fill="${markerColor}" stroke="#ffffff" stroke-width="2"/>
                ` : `
                  <path d="M14 0C6.268 0 0 6.268 0 14C0 24.5 14 36 14 36C14 36 28 24.5 28 14C28 6.268 21.732 0 14 0Z" fill="${markerColor}" stroke="#ffffff" stroke-width="2"/>
                `}
                <circle cx="${anchorX}" cy="${circleCy}" r="${circleR}" fill="#ffffff"/>
                <text x="${anchorX}" y="${textY}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${fontSize}" font-weight="900" fill="${markerColor}" text-anchor="middle">${label}</text>
              </svg>
            </div>
          `;

          const customIcon = L.divIcon({
            className: 'custom-map-pin !bg-transparent !border-0',
            html: iconHtml,
            iconSize: [pinWidth, pinHeight],
            iconAnchor: [anchorX, pinHeight], // Tip of needle is at exact bottom-center
            popupAnchor: [0, -pinHeight],
          });

          const popupHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 170px; padding: 2px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${markerColor};"></span>
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${markerColor};">
                  ${roleLabel}
                </span>
              </div>
              <div style="font-weight: 600; font-size: 13px; color: #0f172a; line-height: 1.35; margin-bottom: 6px;">
                ${wp.name}
              </div>
              <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; color: #64748b; background: #f1f5f9; padding: 3px 6px; border-radius: 4px; display: inline-block; border: 1px solid #e2e8f0;">
                GPS: ${wp.lat.toFixed(5)}, ${wp.lon.toFixed(5)}
              </div>
            </div>
          `;

          L.marker([wp.lat, wp.lon], { icon: customIcon, title: `${roleLabel}: ${wp.name}` })
            .addTo(map)
            .bindPopup(popupHtml);
        });
      }

      // Invalidate size to guarantee tile rendering on mobile WebViews & flex containers
      setTimeout(() => {
        if (isMounted && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);

      setTimeout(() => {
        if (isMounted && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 500);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coordinates, waypoints]);

  const effectiveHeight = height && height !== '100%' ? height : '190px';

  return (
    <div
      className={`relative w-full rounded-lg overflow-hidden border border-border shadow-xs ${className}`}
      style={{ height: effectiveHeight, minHeight: effectiveHeight }}
    >
      <div
        ref={mapContainerRef}
        style={{ height: effectiveHeight, minHeight: effectiveHeight, width: '100%' }}
        className="z-0 w-full"
      />
      
      {/* Top Right Live Route Indicator (Hidden on print) */}
      <div className="absolute top-2 right-2 z-[400] bg-background/90 backdrop-blur-xs px-2 py-1 rounded-md text-[10px] font-mono border text-muted-foreground shadow-xs flex items-center gap-1 print:hidden">
        <Navigation className="w-3 h-3 text-primary" />
        OSM Live Route
      </div>

      {/* Optional Dual Color Route Legend (Hidden on print and suppressed when header legend is present) */}
      {showOverlayLegend && isCircuitRoute && (
        <div className="absolute bottom-2 left-2 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] border border-gray-300 dark:border-gray-700 shadow-sm flex items-center gap-3 font-semibold print:hidden">
          <div className="flex items-center gap-1.5 text-blue-700">
            <span className="w-3 h-1 bg-blue-600 rounded-full inline-block" />
            <span>Outbound Route</span>
          </div>
          <div className="flex items-center gap-1.5 text-orange-700">
            <span className="w-3 h-1 bg-orange-600 border-t-2 border-orange-600 border-dashed rounded-full inline-block" />
            <span>Return Route</span>
          </div>
        </div>
      )}
    </div>
  );
}
