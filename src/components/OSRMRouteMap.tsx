'use client';

import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { RoutePoint } from '@/lib/osrm-actions';
import { MapPin, Navigation, Maximize2 } from 'lucide-react';

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

      // Draw Route Polyline
      if (coordinates.length > 1) {
        const polyline = L.polyline(coordinates, {
          color: '#2563eb', // Blue-600
          weight: 5,
          opacity: 0.85,
          lineJoin: 'round',
        }).addTo(map);

        map.fitBounds(polyline.getBounds(), { padding: [18, 18] });
      }

      // Add HTML DivIcon Markers for all stops (clean, avoids leaflet 404 icon bugs)
      if (waypoints.length > 0) {
        waypoints.forEach((wp, idx) => {
          const isStart = idx === 0;
          const isEnd = idx === waypoints.length - 1;
          const isStop = !isStart && !isEnd;

          let bgColor = 'bg-emerald-600';
          let label = 'A';
          if (isEnd) {
            bgColor = 'bg-rose-600';
            label = 'B';
          } else if (isStop) {
            bgColor = 'bg-blue-600';
            label = `${idx}`;
          }

          const iconHtml = `
            <div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center;">
              <div style="background-color: ${
                isStart ? '#059669' : isEnd ? '#e11d48' : '#2563eb'
              }; color: white; font-weight: bold; font-size: 11px; padding: 3px 6px; border-radius: 9999px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); border: 2px solid white; display: flex; align-items: center; justify-content: center; min-width: 22px; height: 22px;">
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
      <div className="absolute top-2 right-2 z-[400] bg-background/90 backdrop-blur-xs px-2 py-1 rounded-md text-[10px] font-mono border text-muted-foreground shadow-xs flex items-center gap-1 print:hidden">
        <Navigation className="w-3 h-3 text-primary" />
        OSM Live Route
      </div>
    </div>
  );
}
