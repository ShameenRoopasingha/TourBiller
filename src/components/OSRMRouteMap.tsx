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
}

export function OSRMRouteMap({
  coordinates = [],
  waypoints = [],
  height = '320px',
  className = '',
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
          // 1. Outbound / Forward Journey (යන ගමන) - Royal Blue
          const outboundCoords = coordinates.slice(0, splitIndex + 1);
          const outboundPolyline = L.polyline(outboundCoords, {
            color: '#2563eb', // Blue-600
            weight: 5,
            opacity: 0.9,
            lineJoin: 'round',
          }).addTo(map);

          // 2. Return / Inbound Journey (ආපසු එන ගමන) - Vibrant Amber Orange with slight dash
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
        waypoints.forEach((wp, idx) => {
          const isStart = idx === 0;
          const isEnd = idx === waypoints.length - 1;
          const isStop = !isStart && !isEnd;

          let label = 'A';
          let markerColor = '#059669'; // Green

          if (isEnd) {
            label = 'B';
            markerColor = '#e11d48'; // Rose
          } else if (isStop) {
            label = `${idx}`;
            // If it's the turnaround stop in a circuit tour, highlight with amber
            if (isCircuit && idx === waypoints.length - 2) {
              markerColor = '#ea580c'; // Amber Orange
            } else {
              markerColor = '#2563eb'; // Blue
            }
          }

          const iconHtml = `
            <div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center;">
              <div style="background-color: ${markerColor}; color: white; font-weight: bold; font-size: 11px; padding: 3px 6px; border-radius: 9999px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); border: 2px solid white; display: flex; align-items: center; justify-content: center; min-width: 22px; height: 22px;">
                ${label}
              </div>
              <div style="width: 2px; height: 6px; background-color: #334155;"></div>
            </div>
          `;

          const customIcon = L.divIcon({
            className: 'custom-map-pin',
            html: iconHtml,
            iconSize: [24, 28],
            iconAnchor: [12, 28],
          });

          L.marker([wp.lat, wp.lon], { icon: customIcon })
            .addTo(map)
            .bindPopup(`<b>${wp.name}</b><br/>${isStart ? 'Origin' : isEnd ? 'Destination' : `Stop ${idx}`}`);
        });
      }
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

  return (
    <div className={`relative rounded-lg overflow-hidden border border-border shadow-xs ${className}`}>
      <div ref={mapContainerRef} style={{ height, width: '100%' }} className="z-0" />
      
      {/* Top Right Live Route Indicator */}
      <div className="absolute top-2 right-2 z-[400] bg-background/90 backdrop-blur-xs px-2 py-1 rounded-md text-[10px] font-mono border text-muted-foreground shadow-xs flex items-center gap-1 print:hidden">
        <Navigation className="w-3 h-3 text-primary" />
        OSM Live Route
      </div>

      {/* Dual Color Route Legend (Printed & On-Screen) for Circuit Tours */}
      {isCircuitRoute && (
        <div className="absolute bottom-2 left-2 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] border border-gray-300 dark:border-gray-700 shadow-sm flex items-center gap-3 font-semibold print:bg-white print:border-gray-400">
          <div className="flex items-center gap-1.5 text-blue-700">
            <span className="w-3 h-1 bg-blue-600 rounded-full inline-block" />
            <span>Outbound (යන ගමන)</span>
          </div>
          <div className="flex items-center gap-1.5 text-orange-700">
            <span className="w-3 h-1 bg-orange-600 border-t-2 border-orange-600 border-dashed rounded-full inline-block" />
            <span>Return (එන ගමන)</span>
          </div>
        </div>
      )}
    </div>
  );
}
