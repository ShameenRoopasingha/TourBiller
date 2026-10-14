'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Navigation, Radio, MapPin, ExternalLink, ShieldCheck, AlertCircle, WifiOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DriverLiveNavigationCardProps {
    bookingId: string;
    destination?: string | null;
    pickupLocation?: string | null;
    dropLocation?: string | null;
}

export function DriverLiveNavigationCard({
    bookingId,
    destination,
    pickupLocation,
    dropLocation,
}: DriverLiveNavigationCardProps) {
    const [isStreaming, setIsStreaming] = useState(true);
    const [speed, setSpeed] = useState<number>(0);
    const [lastPingTime, setLastPingTime] = useState<Date | null>(null);
    const [offlineCount, setOfflineCount] = useState<number>(0);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const watchIdRef = useRef<number | null>(null);
    const latestCoordsRef = useRef<GeolocationCoordinates | null>(null);
    const timerRef = useRef<any>(null);

    const primaryDest = dropLocation || destination || pickupLocation || '';

    // Initialize GPS tracking
    useEffect(() => {
        if (!isStreaming || typeof window === 'undefined' || !navigator.geolocation) {
            return;
        }

        // 1. Watch position
        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                latestCoordsRef.current = pos.coords;
                // Speed is in m/s
                const speedKmh = pos.coords.speed && pos.coords.speed > 0 ? pos.coords.speed * 3.6 : 0;
                setSpeed(speedKmh);
                setErrorMsg(null);
            },
            (err) => {
                console.warn('Geolocation watch error:', err.message);
                setErrorMsg(err.message);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 20000,
            }
        );

        // 2. Adaptive transmit loop
        function scheduleNextTransmit() {
            if (timerRef.current) clearTimeout(timerRef.current);
            // 20s if moving (>5 km/h), 60s if stationary
            const intervalMs = (speed > 5) ? 20000 : 60000;
            timerRef.current = setTimeout(async () => {
                await transmitLocation();
                scheduleNextTransmit();
            }, intervalMs);
        }

        scheduleNextTransmit();

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isStreaming, speed, bookingId]);

    // Transmit location or cache in localStorage if offline
    async function transmitLocation() {
        const coords = latestCoordsRef.current;
        if (!coords) return;

        const ping = {
            lat: coords.latitude,
            lon: coords.longitude,
            heading: coords.heading && coords.heading >= 0 ? coords.heading : null,
            speed: coords.speed && coords.speed > 0 ? coords.speed * 3.6 : 0,
            accuracy: coords.accuracy || null,
            timestamp: new Date().toISOString(),
        };

        try {
            // Check for cached offline points first
            const cachedStr = localStorage.getItem('vigil_offline_gps');
            const cachedList = cachedStr ? JSON.parse(cachedStr) : [];

            if (Array.isArray(cachedList) && cachedList.length > 0) {
                // Batch flush
                const res = await fetch('/api/driver/location', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        bookingId,
                        batch: [...cachedList, ping],
                    }),
                });
                if (res.ok) {
                    localStorage.removeItem('vigil_offline_gps');
                    setOfflineCount(0);
                    setLastPingTime(new Date());
                    return;
                }
            }

            // Normal single ping
            const res = await fetch('/api/driver/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId,
                    ...ping,
                }),
            });

            if (res.ok) {
                setLastPingTime(new Date());
                setErrorMsg(null);
            } else {
                throw new Error('Server returned non-200');
            }
        } catch {
            // Network failure: Cache offline
            try {
                const cachedStr = localStorage.getItem('vigil_offline_gps');
                const cachedList = cachedStr ? JSON.parse(cachedStr) : [];
                cachedList.push(ping);
                localStorage.setItem('vigil_offline_gps', JSON.stringify(cachedList.slice(-200)));
                setOfflineCount(cachedList.length);
            } catch (storageErr) {
                console.error('Storage error:', storageErr);
            }
        }
    }

    const googleMapsUrl = primaryDest
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(primaryDest)}&travelmode=driving`
        : null;

    const wazeUrl = primaryDest
        ? `https://waze.com/ul?q=${encodeURIComponent(primaryDest)}&navigate=yes`
        : null;

    return (
        <Card className="border border-emerald-500/30 bg-emerald-950/20 shadow-md">
            <CardContent className="p-4 space-y-3">
                {/* Live Tracking Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="relative flex items-center justify-center">
                            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                            <span className="absolute w-5 h-5 rounded-full bg-emerald-500/40 animate-ping"></span>
                        </div>
                        <div>
                            <span className="text-sm font-bold text-emerald-400">
                                Live GPS Radar Active
                            </span>
                            <div className="text-[11px] text-muted-foreground">
                                Broadcasting to office admin map
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <span className="text-xs font-mono font-bold bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/60">
                            {speed > 5 ? '20s (Moving)' : '60s (Parked)'}
                        </span>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                            {Math.round(speed)} km/h
                        </div>
                    </div>
                </div>

                {/* Status or Offline Badge */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-900/40">
                    <span className="text-muted-foreground">
                        {lastPingTime
                            ? `Last ping: ${Math.round((Date.now() - lastPingTime.getTime()) / 1000)}s ago`
                            : 'Acquiring GPS fix...'}
                    </span>
                    {offlineCount > 0 && (
                        <span className="flex items-center gap-1 text-amber-400 font-semibold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800">
                            <WifiOff className="w-3 h-3" />
                            {offlineCount} offline points cached
                        </span>
                    )}
                </div>

                {errorMsg && (
                    <div className="text-[11px] text-amber-400 flex items-center gap-1 bg-amber-950/30 p-2 rounded">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errorMsg} (Please ensure device Location/GPS is enabled in browser)</span>
                    </div>
                )}

                {/* Navigation Launchers */}
                {primaryDest && (
                    <div className="pt-2 border-t border-border/50">
                        <div className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            <span>Destination: {primaryDest}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {googleMapsUrl && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs font-bold border-blue-600/30 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                    asChild
                                >
                                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                                        <Navigation className="w-3.5 h-3.5 mr-1 text-blue-600" />
                                        Google Maps
                                    </a>
                                </Button>
                            )}
                            {wazeUrl && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs font-bold border-cyan-600/30 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/30"
                                    asChild
                                >
                                    <a href={wazeUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-3.5 h-3.5 mr-1 text-cyan-600" />
                                        Waze App
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
