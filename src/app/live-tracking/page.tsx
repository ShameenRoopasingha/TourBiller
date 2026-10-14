'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
    Navigation, 
    RefreshCw, 
    Car, 
    User, 
    MapPin, 
    Gauge, 
    Clock, 
    ShieldAlert, 
    Radio, 
    CheckCircle2, 
    AlertCircle,
    ChevronRight,
    Search
} from 'lucide-react';
import { ActiveTourVehicle } from '@/components/FleetLiveMap';

// Dynamically import FleetLiveMap to avoid SSR leaflet window errors
const FleetLiveMap = dynamic(
    () => import('@/components/FleetLiveMap').then((mod) => mod.FleetLiveMap),
    { ssr: false, loading: () => <div className="h-full w-full bg-slate-900 flex items-center justify-center text-slate-400">Loading Fleet Map...</div> }
);

export default function LiveTrackingPage() {
    const [vehicles, setVehicles] = useState<ActiveTourVehicle[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);

    const fetchLiveLocations = useCallback(async (manual = false) => {
        if (manual) setIsRefreshing(true);
        try {
            const res = await fetch('/api/fleet/live-locations');
            const data = await res.json();
            if (data.success && data.data) {
                setVehicles(data.data.activeTours || []);
                setLastUpdated(new Date());
                setError(null);
            } else {
                setError(data.error || 'Failed to fetch live locations');
            }
        } catch (err: any) {
            console.error('Error fetching fleet locations:', err);
            setError('Network connection error while fetching live positions');
        } finally {
            setIsLoading(false);
            if (manual) setIsRefreshing(false);
        }
    }, []);

    // Polling every 10 seconds
    useEffect(() => {
        fetchLiveLocations();
        const interval = setInterval(() => {
            fetchLiveLocations();
        }, 10000);

        return () => clearInterval(interval);
    }, [fetchLiveLocations]);

    const filteredVehicles = vehicles.filter(v => 
        v.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.destination && v.destination.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || null;

    // Aggregate statistics
    const totalTours = vehicles.length;
    const movingCount = vehicles.filter(v => v.isFresh && v.speed > 5).length;
    const stationaryCount = vehicles.filter(v => v.isFresh && v.speed <= 5).length;
    const offlineCount = vehicles.filter(v => !v.isFresh || v.lat === null).length;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-950 text-slate-100">
            {/* Top Command Bar */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 z-20">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                        <Radio className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white flex items-center gap-2">
                            Fleet Live Tracking
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
                                LIVE RADAR
                            </span>
                        </h1>
                        <p className="text-xs text-slate-400">
                            Real-time GPS tracking for active tours and drivers
                        </p>
                    </div>
                </div>

                {/* Quick KPI stats */}
                <div className="flex items-center gap-2 text-xs">
                    <div className="bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700 flex items-center gap-2">
                        <span className="text-slate-400">Total Active:</span>
                        <span className="font-bold text-white text-sm">{totalTours}</span>
                    </div>
                    <div className="bg-emerald-950/40 px-3 py-1.5 rounded-md border border-emerald-800/50 flex items-center gap-2 text-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span>Moving:</span>
                        <span className="font-bold text-sm">{movingCount}</span>
                    </div>
                    <div className="bg-blue-950/40 px-3 py-1.5 rounded-md border border-blue-800/50 flex items-center gap-2 text-blue-300">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span>Parked/Idle:</span>
                        <span className="font-bold text-sm">{stationaryCount}</span>
                    </div>
                    {offlineCount > 0 && (
                        <div className="bg-amber-950/40 px-3 py-1.5 rounded-md border border-amber-800/50 flex items-center gap-2 text-amber-300">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                            <span>Signal Idle:</span>
                            <span className="font-bold text-sm">{offlineCount}</span>
                        </div>
                    )}
                </div>

                {/* Refresh and Time Info */}
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 hidden sm:inline">
                        {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Connecting...'}
                    </span>
                    <button
                        onClick={() => fetchLiveLocations(true)}
                        disabled={isRefreshing}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-amber-900/60 border-b border-amber-700/60 px-4 py-2 text-xs text-amber-200 flex items-center gap-2 shrink-0">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Tour/Vehicle List Panel */}
                <div className="w-80 md:w-96 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 z-10">
                    {/* Search Bar */}
                    <div className="p-3 border-b border-slate-800">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search vehicle, driver, customer..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                            />
                        </div>
                    </div>

                    {/* Vehicle List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
                        {isLoading ? (
                            <div className="p-8 text-center text-xs text-slate-500">
                                Loading active tours and GPS signals...
                            </div>
                        ) : filteredVehicles.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <Car className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm font-semibold text-slate-400">No Active Ongoing Tours</p>
                                <p className="text-xs mt-1">When a driver starts a trip from the mobile app, their vehicle and live radar location will appear here automatically.</p>
                            </div>
                        ) : (
                            filteredVehicles.map((tour) => {
                                const isSelected = selectedVehicleId === tour.id;
                                const isMoving = tour.speed > 5;
                                return (
                                    <div
                                        key={tour.id}
                                        onClick={() => setSelectedVehicleId(tour.id)}
                                        className={`p-3.5 cursor-pointer transition flex flex-col gap-2 ${
                                            isSelected 
                                                ? 'bg-slate-800/90 border-l-4 border-amber-400' 
                                                : 'hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-2 rounded-lg ${
                                                    tour.isFresh 
                                                        ? (isMoving ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400')
                                                        : 'bg-slate-800 text-slate-400'
                                                }`}>
                                                    <Car className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-white flex items-center gap-1.5">
                                                        {tour.vehicleNo}
                                                        <span className="text-[10px] font-normal text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                                            {tour.vehicleModel || 'Vehicle'}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-300 flex items-center gap-1">
                                                        <User className="w-3 h-3 text-slate-400" />
                                                        <span>{tour.driverName}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    tour.isFresh 
                                                        ? (isMoving ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-blue-950 text-blue-300 border border-blue-800')
                                                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        tour.isFresh 
                                                            ? (isMoving ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400')
                                                            : 'bg-slate-500'
                                                    }`}></span>
                                                    {tour.isFresh ? `${Math.round(tour.speed)} km/h` : 'No Signal'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-xs text-slate-400 space-y-0.5 pl-1">
                                            <div className="truncate">
                                                <strong className="text-slate-300">Customer:</strong> {tour.customerName}
                                            </div>
                                            {tour.destination && (
                                                <div className="truncate flex items-center gap-1">
                                                    <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                                                    <span className="truncate">{tour.destination}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                {tour.lastLocationAt
                                                    ? `${Math.round((Date.now() - new Date(tour.lastLocationAt).getTime()) / 1000)}s ago`
                                                    : 'Never synced'}
                                            </span>
                                            <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                                                Locate <ChevronRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Bottom Status Help */}
                    <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            <span>Green: Moving (20s GPS interval)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                            <span>Blue: Parked/Stationary (60s GPS interval)</span>
                        </div>
                    </div>
                </div>

                {/* Center / Fullscreen Map */}
                <div className="flex-1 h-full relative">
                    <FleetLiveMap
                        vehicles={filteredVehicles}
                        selectedVehicleId={selectedVehicleId}
                        onSelectVehicle={(id) => setSelectedVehicleId(id)}
                    />

                    {/* Float Tour Info Card if selected */}
                    {selectedVehicle && (
                        <div className="absolute top-4 right-4 z-[1000] w-80 bg-slate-900/95 backdrop-blur border border-slate-700/80 rounded-xl p-4 shadow-2xl text-slate-200">
                            <div className="flex items-start justify-between border-b border-slate-800 pb-2 mb-3">
                                <div>
                                    <div className="text-base font-bold text-white flex items-center gap-2">
                                        {selectedVehicle.vehicleNo}
                                        <span className="text-xs font-normal text-slate-400">
                                            {selectedVehicle.vehicleModel}
                                        </span>
                                    </div>
                                    <div className="text-xs text-emerald-400 font-medium">
                                        ● Tour in Progress
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedVehicleId(null)}
                                    className="text-slate-400 hover:text-white text-xs bg-slate-800 px-2 py-1 rounded"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div>
                                    <span className="text-slate-400">Driver:</span>
                                    <div className="font-semibold text-white">{selectedVehicle.driverName}</div>
                                </div>
                                <div>
                                    <span className="text-slate-400">Customer:</span>
                                    <div className="font-semibold text-white">{selectedVehicle.customerName}</div>
                                </div>
                                {selectedVehicle.pickupLocation && (
                                    <div>
                                        <span className="text-slate-400">Pickup:</span>
                                        <div className="text-white truncate">{selectedVehicle.pickupLocation}</div>
                                    </div>
                                )}
                                {selectedVehicle.destination && (
                                    <div>
                                        <span className="text-slate-400">Destination:</span>
                                        <div className="text-white truncate">{selectedVehicle.destination}</div>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                                    <div className="bg-slate-950 p-2 rounded">
                                        <div className="text-slate-400 text-[10px]">CURRENT SPEED</div>
                                        <div className="text-base font-bold text-emerald-400">
                                            {Math.round(selectedVehicle.speed)} <span className="text-xs font-normal">km/h</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-950 p-2 rounded">
                                        <div className="text-slate-400 text-[10px]">LAST PING</div>
                                        <div className="text-xs font-semibold text-slate-200 mt-1">
                                            {selectedVehicle.lastLocationAt 
                                                ? `${Math.round((Date.now() - new Date(selectedVehicle.lastLocationAt).getTime()) / 1000)}s ago`
                                                : 'None'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
