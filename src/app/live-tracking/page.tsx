'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
    Navigation, 
    RefreshCw, 
    Car, 
    User, 
    MapPin, 
    Clock, 
    Radio, 
    AlertCircle,
    ChevronRight,
    Search,
    Map as MapIcon,
    ListFilter,
    X,
    ExternalLink,
    Compass,
    AlertTriangle,
    ShieldAlert,
    Wrench,
    Volume2,
    VolumeX
} from 'lucide-react';
import { ActiveTourVehicle } from '@/components/FleetLiveMap';
import { 
    playBreakdownAlarm, 
    playHandoverChime, 
    isDispatchAudioEnabled, 
    setDispatchAudioEnabled, 
    unlockDispatchAudio 
} from '@/lib/dispatch-audio';

// Dynamically import FleetLiveMap to avoid SSR leaflet window errors
const FleetLiveMap = dynamic(
    () => import('@/components/FleetLiveMap').then((mod) => mod.FleetLiveMap),
    { ssr: false, loading: () => (
        <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Radio className="w-8 h-8 text-emerald-400 animate-pulse" />
            <span className="text-xs font-medium">Loading Fleet Radar Map...</span>
        </div>
    ) }
);

type StatusFilter = 'all' | 'moving' | 'parked' | 'offline' | 'alerts';

export default function LiveTrackingPage() {
    const [vehicles, setVehicles] = useState<ActiveTourVehicle[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map');
    const [error, setError] = useState<string | null>(null);
    const [fitAllTrigger, setFitAllTrigger] = useState<number>(0);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [showSoundPopover, setShowSoundPopover] = useState<boolean>(false);

    const prevBreakdownsRef = useRef<Set<string>>(new Set());
    const prevHandoversRef = useRef<Set<string>>(new Set());
    const isInitialLoadRef = useRef<boolean>(true);

    useEffect(() => {
        setSoundEnabled(isDispatchAudioEnabled());
    }, []);

    const fetchLiveLocations = useCallback(async (manual = false) => {
        if (manual) setIsRefreshing(true);
        try {
            const res = await fetch('/api/fleet/live-locations');
            const data = await res.json();
            if (data.success && data.data) {
                const tours: ActiveTourVehicle[] = data.data.activeTours || [];
                setVehicles(tours);
                setLastUpdated(new Date());
                setError(null);

                // Detect newly reported breakdowns or handovers to play distinct alert sounds
                const currentBreakdowns = new Set<string>(
                    tours.filter(t => t.hasPendingBreakdown).map(t => t.id)
                );
                const currentHandovers = new Set<string>(
                    tours.filter(t => t.hasPendingHandover).map(t => t.id)
                );

                if (!isInitialLoadRef.current) {
                    const hasNewBreakdown = Array.from(currentBreakdowns).some(id => !prevBreakdownsRef.current.has(id));
                    const hasNewHandover = Array.from(currentHandovers).some(id => !prevHandoversRef.current.has(id));

                    if (hasNewBreakdown) {
                        playBreakdownAlarm();
                    } else if (hasNewHandover) {
                        playHandoverChime();
                    }
                } else {
                    isInitialLoadRef.current = false;
                }

                prevBreakdownsRef.current = currentBreakdowns;
                prevHandoversRef.current = currentHandovers;
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

    // Aggregate statistics
    const totalTours = vehicles.length;
    const movingCount = vehicles.filter(v => v.isFresh && v.speed > 5).length;
    const stationaryCount = vehicles.filter(v => v.isFresh && v.speed <= 5).length;
    const offlineCount = vehicles.filter(v => !v.isFresh || v.lat === null).length;
    const alertCount = vehicles.filter(v => v.hasPendingHandover || v.hasPendingBreakdown).length;

    // Filter vehicles by search query & status filter
    const filteredVehicles = vehicles.filter(v => {
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch = !query || 
            v.vehicleNo.toLowerCase().includes(query) ||
            v.driverName.toLowerCase().includes(query) ||
            v.customerName.toLowerCase().includes(query) ||
            (v.destination && v.destination.toLowerCase().includes(query));

        if (!matchesSearch) return false;

        if (statusFilter === 'alerts') return !!(v.hasPendingHandover || v.hasPendingBreakdown);
        if (statusFilter === 'moving') return v.isFresh && v.speed > 5;
        if (statusFilter === 'parked') return v.isFresh && v.speed <= 5;
        if (statusFilter === 'offline') return !v.isFresh || v.lat === null;
        return true;
    });

    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || null;

    const handleSelectVehicle = (id: string) => {
        setSelectedVehicleId(id);
        // On mobile, automatically show the map when a vehicle is selected from the list
        setMobileTab('map');
    };

    return (
        <div className="-m-2 sm:-m-4 md:-m-8 h-[calc(100dvh-4rem)] flex flex-col overflow-hidden bg-slate-950 text-slate-100">
            {/* Top Command Bar */}
            <header className="bg-slate-900 border-b border-slate-800 px-3 sm:px-4 py-2 sm:py-2.5 shrink-0 z-20">
                <div className="flex items-center justify-between gap-2">
                    {/* Brand / Title */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="p-1.5 sm:p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 shrink-0">
                            <Radio className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                                    Fleet Live Tracking
                                </h1>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
                                    LIVE
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 hidden sm:block truncate">
                                Real-time GPS tracking for active tours and drivers
                            </p>
                        </div>
                    </div>

                    {/* Mobile Segmented Tab Switch (Map vs Tours List) */}
                    <div className="flex md:hidden items-center bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
                        <button
                            type="button"
                            onClick={() => setMobileTab('map')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                                mobileTab === 'map'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <MapIcon className="w-3.5 h-3.5" />
                            <span>Map</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMobileTab('list')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                                mobileTab === 'list'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <ListFilter className="w-3.5 h-3.5" />
                            <span>Tours</span>
                            {totalTours > 0 && (
                                <span className={`text-[10px] px-1 rounded-full ${
                                    mobileTab === 'list' ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-300'
                                }`}>
                                    {totalTours}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Actions: Sound Alerts, Refresh & Time */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Audio Alert Toggle & Test Tones */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    unlockDispatchAudio();
                                    setShowSoundPopover(v => !v);
                                }}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition active:scale-95 ${
                                    soundEnabled
                                        ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700'
                                        : 'bg-red-950/40 border-red-800/60 text-red-400 hover:bg-red-900/60'
                                }`}
                                title="Emergency Audio Alert Settings & Test Tones"
                            >
                                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                                <span className="hidden sm:inline">{soundEnabled ? 'Siren ON' : 'Muted'}</span>
                            </button>

                            {/* Sound Control Dropdown Popover */}
                            {showSoundPopover && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 text-slate-200 space-y-2.5">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                                            Dispatch Audio Alerts
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const next = !soundEnabled;
                                                setSoundEnabled(next);
                                                setDispatchAudioEnabled(next);
                                            }}
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${
                                                soundEnabled
                                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                                                    : 'bg-red-950 text-red-300 border-red-700 hover:bg-red-900'
                                            }`}
                                        >
                                            {soundEnabled ? 'ACTIVE' : 'MUTED'}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-tight">
                                        Distinct sirens play when new vehicle breakdowns or mid-tour handovers are reported.
                                    </p>
                                    <div className="space-y-1.5 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                unlockDispatchAudio();
                                                playBreakdownAlarm(true);
                                            }}
                                            className="w-full flex items-center justify-between px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900/80 border border-red-800/80 rounded-lg text-red-200 text-xs font-semibold transition"
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                                                Breakdown Alarm
                                            </span>
                                            <span className="text-[10px] text-red-400 underline">▶ Test Siren</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                unlockDispatchAudio();
                                                playHandoverChime(true);
                                            }}
                                            className="w-full flex items-center justify-between px-2.5 py-1.5 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/80 rounded-lg text-amber-200 text-xs font-semibold transition"
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                                Handover Chime
                                            </span>
                                            <span className="text-[10px] text-amber-400 underline">▶ Test Chime</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <span className="text-[11px] text-slate-400 hidden lg:inline">
                            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Connecting...'}
                        </span>
                        <button
                            type="button"
                            onClick={() => fetchLiveLocations(true)}
                            disabled={isRefreshing}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition active:scale-95 disabled:opacity-50"
                            title="Refresh GPS positions"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Filter KPI Chips (Horizontal scrollable on mobile) */}
                <div className="flex items-center gap-1.5 sm:gap-2 mt-2 pt-2 border-t border-slate-800/80 overflow-x-auto no-scrollbar text-xs">
                    <span className="text-[11px] font-medium text-slate-400 mr-1 shrink-0 hidden sm:inline">
                        Filter:
                    </span>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('all')}
                        className={`px-2.5 py-1 rounded-full border transition flex items-center gap-1.5 shrink-0 ${
                            statusFilter === 'all'
                                ? 'bg-slate-700 border-slate-500 text-white font-bold'
                                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                    >
                        <span>All</span>
                        <span className="px-1.5 py-0.2 bg-slate-900 rounded-full text-[10px] text-white">
                            {totalTours}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setStatusFilter('moving')}
                        className={`px-2.5 py-1 rounded-full border transition flex items-center gap-1.5 shrink-0 ${
                            statusFilter === 'moving'
                                ? 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold'
                                : 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300 hover:bg-emerald-950/70'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                        <span>Moving</span>
                        <span className="px-1.5 py-0.2 bg-emerald-900 rounded-full text-[10px] font-bold text-emerald-200">
                            {movingCount}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setStatusFilter('parked')}
                        className={`px-2.5 py-1 rounded-full border transition flex items-center gap-1.5 shrink-0 ${
                            statusFilter === 'parked'
                                ? 'bg-blue-950 border-blue-500 text-blue-200 font-bold'
                                : 'bg-blue-950/40 border-blue-800/50 text-blue-300 hover:bg-blue-950/70'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                        <span>Parked</span>
                        <span className="px-1.5 py-0.2 bg-blue-900 rounded-full text-[10px] font-bold text-blue-200">
                            {stationaryCount}
                        </span>
                    </button>

                    {alertCount > 0 && (
                        <button
                            type="button"
                            onClick={() => setStatusFilter('alerts')}
                            className={`px-2.5 py-1 rounded-full border transition flex items-center gap-1.5 shrink-0 ${
                                statusFilter === 'alerts'
                                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                                    : 'bg-amber-950/70 border-amber-500/60 text-amber-300 hover:bg-amber-950/90 animate-pulse'
                            }`}
                        >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Dispatch Alerts</span>
                            <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black">
                                {alertCount}
                            </span>
                        </button>
                    )}

                    {offlineCount > 0 && (
                        <button
                            type="button"
                            onClick={() => setStatusFilter('offline')}
                            className={`px-2.5 py-1 rounded-full border transition flex items-center gap-1.5 shrink-0 ${
                                statusFilter === 'offline'
                                    ? 'bg-amber-950 border-amber-500 text-amber-200 font-bold'
                                    : 'bg-amber-950/40 border-amber-800/50 text-amber-300 hover:bg-amber-950/70'
                            }`}
                        >
                            <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>Signal Idle</span>
                            <span className="px-1.5 py-0.2 bg-amber-900 rounded-full text-[10px] font-bold text-amber-200">
                                {offlineCount}
                            </span>
                        </button>
                    )}
                </div>
            </header>

            {/* Error Banner */}
            {error && (
                <div className="bg-amber-900/60 border-b border-amber-700/60 px-4 py-2 text-xs text-amber-200 flex items-center gap-2 shrink-0">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="truncate">{error}</span>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Tour/Vehicle List Panel: Full width on mobile when tab='list', Sidebar on desktop */}
                <aside className={`
                    ${mobileTab === 'list' ? 'flex w-full' : 'hidden'}
                    md:flex md:w-80 lg:w-96 bg-slate-900 border-r border-slate-800 flex-col shrink-0 z-10 h-full overflow-hidden
                `}>
                    {/* Search Bar */}
                    <div className="p-3 border-b border-slate-800 shrink-0">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search vehicle, driver, destination..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Vehicle List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 touch-pan-y">
                        {isLoading ? (
                            <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                                <RefreshCw className="w-5 h-5 mx-auto animate-spin text-emerald-500" />
                                <p>Loading active tours and GPS signals...</p>
                            </div>
                        ) : filteredVehicles.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <Car className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                                <p className="text-sm font-semibold text-slate-400">
                                    {vehicles.length === 0 ? 'No Active Ongoing Tours' : 'No Matching Vehicles'}
                                </p>
                                <p className="text-xs mt-1 text-slate-500">
                                    {vehicles.length === 0 
                                        ? 'When a driver starts a trip from the mobile app, their vehicle and live radar location will appear here automatically.'
                                        : 'Try adjusting your search query or filter status above.'}
                                </p>
                                {statusFilter !== 'all' && (
                                    <button
                                        onClick={() => setStatusFilter('all')}
                                        className="mt-3 px-3 py-1 bg-slate-800 text-emerald-400 text-xs rounded-md border border-slate-700 hover:bg-slate-700"
                                    >
                                        Show All Tours
                                    </button>
                                )}
                            </div>
                        ) : (
                            filteredVehicles.map((tour) => {
                                const isSelected = selectedVehicleId === tour.id;
                                const isMoving = tour.speed > 5;
                                return (
                                    <div
                                        key={tour.id}
                                        onClick={() => handleSelectVehicle(tour.id)}
                                        className={`p-3 sm:p-3.5 cursor-pointer transition flex flex-col gap-2 ${
                                            isSelected 
                                                ? 'bg-slate-800/90 border-l-4 border-amber-400' 
                                                : tour.hasPendingBreakdown
                                                    ? 'bg-red-950/20 border-l-4 border-red-500 hover:bg-red-950/30'
                                                    : tour.hasPendingHandover
                                                        ? 'bg-amber-950/20 border-l-4 border-amber-500 hover:bg-amber-950/30'
                                                        : 'hover:bg-slate-800/50 active:bg-slate-800/70'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`p-2 rounded-lg shrink-0 ${
                                                    tour.hasPendingBreakdown
                                                        ? 'bg-red-500/20 text-red-400 animate-pulse'
                                                        : tour.hasPendingHandover
                                                            ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                                                            : tour.isFresh 
                                                                ? (isMoving ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400')
                                                                : 'bg-slate-800 text-slate-400'
                                                }`}>
                                                    {tour.hasPendingBreakdown ? (
                                                        <ShieldAlert className="w-4 h-4 text-red-400" />
                                                    ) : tour.hasPendingHandover ? (
                                                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                                                    ) : (
                                                        <Car className="w-4 h-4" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-sm text-white flex items-center gap-1.5 truncate">
                                                        <span>{tour.vehicleNo}</span>
                                                        <span className="text-[10px] font-normal text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded truncate">
                                                            {tour.vehicleModel || 'Vehicle'}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-300 flex items-center gap-1 truncate">
                                                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                                                        <span className="truncate">{tour.driverName}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    tour.hasPendingBreakdown
                                                        ? 'bg-red-950 text-red-300 border border-red-800 animate-pulse'
                                                        : tour.hasPendingHandover
                                                            ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                                                            : tour.isFresh 
                                                                ? (isMoving ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-blue-950 text-blue-300 border border-blue-800')
                                                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        tour.hasPendingBreakdown
                                                            ? 'bg-red-400'
                                                            : tour.hasPendingHandover
                                                                ? 'bg-amber-400'
                                                                : tour.isFresh 
                                                                    ? (isMoving ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400')
                                                                    : 'bg-slate-500'
                                                    }`}></span>
                                                    {tour.hasPendingBreakdown ? 'Breakdown' : tour.hasPendingHandover ? 'Handover' : tour.isFresh ? `${Math.round(tour.speed)} km/h` : 'No Signal'}
                                                </div>
                                            </div>
                                        </div>

                                        {tour.hasPendingBreakdown && (
                                            <div className="flex items-center justify-between text-[11px] font-bold text-red-300 bg-red-950/80 border border-red-500/40 px-2 py-1 rounded animate-pulse">
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                                    <span className="truncate">Breakdown: {tour.breakdownDetails?.reason || 'Defect reported'}</span>
                                                </div>
                                                <span className="text-[10px] underline ml-2 shrink-0">Swap</span>
                                            </div>
                                        )}

                                        {tour.hasPendingHandover && (
                                            <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-1 rounded animate-pulse">
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                                    <span className="truncate">Handover: {tour.handoverDetails?.reason || 'Driver request'}</span>
                                                </div>
                                                <span className="text-[10px] underline ml-2 shrink-0">Review</span>
                                            </div>
                                        )}

                                        <div className="text-xs text-slate-400 space-y-0.5 pl-1">
                                            <div className="truncate">
                                                <span className="text-slate-500 font-medium">Customer:</span>{' '}
                                                <span className="text-slate-300">{tour.customerName}</span>
                                            </div>
                                            {tour.destination && (
                                                <div className="truncate flex items-center gap-1">
                                                    <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                                                    <span className="truncate text-slate-300">{tour.destination}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/80">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-slate-500" />
                                                {tour.lastLocationAt
                                                    ? `${Math.round((Date.now() - new Date(tour.lastLocationAt).getTime()) / 1000)}s ago`
                                                    : 'Never synced'}
                                            </span>
                                            <span className="text-emerald-400 font-semibold flex items-center gap-0.5 text-xs">
                                                View on Map <ChevronRight className="w-3.5 h-3.5" />
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Bottom Status / Legend */}
                    <div className="p-2.5 sm:p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1 shrink-0">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Green: Moving (20s GPS)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            <span>Blue: Parked (60s GPS)</span>
                        </div>
                    </div>
                </aside>

                {/* Center / Fullscreen Map Area: Visible when tab='map' on mobile, always on desktop */}
                <main className={`
                    ${mobileTab === 'map' ? 'flex flex-1' : 'hidden md:flex md:flex-1'}
                    h-full relative overflow-hidden
                `}>
                    <FleetLiveMap
                        vehicles={filteredVehicles}
                        selectedVehicleId={selectedVehicleId}
                        onSelectVehicle={(id) => setSelectedVehicleId(id)}
                        fitAllTrigger={fitAllTrigger}
                    />

                    {/* Mobile Floating Action Button: Quick view list */}
                    <div className="md:hidden absolute top-3 left-3 z-[900]">
                        <button
                            type="button"
                            onClick={() => setMobileTab('list')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 text-white rounded-full border border-slate-700 shadow-xl backdrop-blur text-xs font-semibold active:scale-95 transition"
                        >
                            <ListFilter className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Tours ({filteredVehicles.length})</span>
                        </button>
                    </div>

                    {/* Responsive Selected Tour Info: Mobile Bottom Sheet / Desktop Floating Card */}
                    {selectedVehicle && (
                        <div className={`
                            fixed bottom-0 inset-x-0 z-[1000] bg-slate-900/95 backdrop-blur-md border-t border-slate-700/80 rounded-t-2xl p-4 shadow-2xl max-h-[75vh] overflow-y-auto
                            md:absolute md:top-4 md:right-4 md:bottom-auto md:inset-x-auto md:w-80 md:rounded-xl md:border md:border-slate-700/80 md:p-4 md:max-h-none
                            text-slate-200 transition-all
                        `}>
                            {/* Mobile Drag Handle */}
                            <div 
                                className="w-12 h-1 bg-slate-600 rounded-full mx-auto mb-3 md:hidden cursor-pointer"
                                onClick={() => setSelectedVehicleId(null)}
                            />

                            {/* Header */}
                            <div className="flex items-start justify-between border-b border-slate-800 pb-2.5 mb-3">
                                <div>
                                    <div className="text-base font-bold text-white flex items-center gap-2">
                                        <span>{selectedVehicle.vehicleNo}</span>
                                        <span className="text-xs font-normal text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                            {selectedVehicle.vehicleModel || 'Vehicle'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span>Tour in Progress</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedVehicleId(null)}
                                    className="text-slate-400 hover:text-white text-xs bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg transition"
                                    title="Close details"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Urgent Dispatch Action Banners */}
                            {selectedVehicle.hasPendingBreakdown && (
                                <div className="mb-3 p-3 bg-red-950/80 border-2 border-red-500/80 rounded-xl space-y-2 animate-pulse shadow-lg">
                                    <div className="flex items-center gap-2 font-bold text-xs text-red-300">
                                        <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                                        <span>🚨 VEHICLE BREAKDOWN REPORTED</span>
                                    </div>
                                    <div className="text-[11px] space-y-0.5 text-red-100">
                                        <div><span className="text-red-400 font-semibold">Reported Issue:</span> {selectedVehicle.breakdownDetails?.reason || 'Vehicle defect'}</div>
                                        {selectedVehicle.breakdownDetails?.meterReading && (
                                            <div><span className="text-red-400 font-semibold">Odometer:</span> {selectedVehicle.breakdownDetails.meterReading} km</div>
                                        )}
                                        {selectedVehicle.breakdownDetails?.location && (
                                            <div><span className="text-red-400 font-semibold">Location:</span> {selectedVehicle.breakdownDetails.location}</div>
                                        )}
                                        {selectedVehicle.breakdownDetails?.note && (
                                            <div><span className="text-red-400 font-semibold">Notes:</span> {selectedVehicle.breakdownDetails.note}</div>
                                        )}
                                    </div>
                                    <a
                                        href={`/bookings/${selectedVehicle.bookingId}#swap-section`}
                                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shadow-md transition"
                                    >
                                        <Wrench className="w-3.5 h-3.5" />
                                        <span>⚡ Dispatch Emergency Vehicle Swap</span>
                                    </a>
                                </div>
                            )}

                            {selectedVehicle.hasPendingHandover && (
                                <div className="mb-3 p-3 bg-amber-950/80 border-2 border-amber-500/80 rounded-xl space-y-2 animate-pulse shadow-lg">
                                    <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
                                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                        <span>⚠️ MID-TOUR HANDOVER REQUESTED</span>
                                    </div>
                                    <div className="text-[11px] space-y-0.5 text-amber-100">
                                        <div><span className="text-amber-400 font-semibold">Reason:</span> {selectedVehicle.handoverDetails?.reason || 'Driver request'}</div>
                                        {selectedVehicle.handoverDetails?.meterReading && (
                                            <div><span className="text-amber-400 font-semibold">Odometer:</span> {selectedVehicle.handoverDetails.meterReading} km</div>
                                        )}
                                        {selectedVehicle.handoverDetails?.note && (
                                            <div><span className="text-amber-400 font-semibold">Location/Note:</span> {selectedVehicle.handoverDetails.note}</div>
                                        )}
                                    </div>
                                    <a
                                        href={`/bookings/${selectedVehicle.bookingId}#handover-section`}
                                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg shadow-md transition"
                                    >
                                        <User className="w-3.5 h-3.5" />
                                        <span>⚡ Reassign Replacement Driver</span>
                                    </a>
                                </div>
                            )}

                            {/* Details List */}
                            <div className="space-y-2.5 text-xs">
                                <div>
                                    <span className="text-slate-400 text-[11px]">DRIVER</span>
                                    <div className="font-semibold text-white text-sm flex items-center gap-1.5 mt-0.5">
                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{selectedVehicle.driverName}</span>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-slate-400 text-[11px]">CUSTOMER</span>
                                    <div className="font-semibold text-white mt-0.5">{selectedVehicle.customerName}</div>
                                </div>

                                {selectedVehicle.pickupLocation && (
                                    <div>
                                        <span className="text-slate-400 text-[11px]">PICKUP</span>
                                        <div className="text-slate-200 truncate mt-0.5 flex items-center gap-1">
                                            <Compass className="w-3 h-3 text-blue-400 shrink-0" />
                                            <span className="truncate">{selectedVehicle.pickupLocation}</span>
                                        </div>
                                    </div>
                                )}

                                {selectedVehicle.destination && (
                                    <div>
                                        <span className="text-slate-400 text-[11px]">DESTINATION</span>
                                        <div className="text-slate-200 truncate mt-0.5 flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                                            <span className="truncate">{selectedVehicle.destination}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Speed & Last Ping Card */}
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                                        <div className="text-slate-400 text-[10px] font-semibold tracking-wider">CURRENT SPEED</div>
                                        <div className="text-lg font-black text-emerald-400 mt-0.5">
                                            {Math.round(selectedVehicle.speed)}{' '}
                                            <span className="text-xs font-normal text-slate-400">km/h</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                                        <div className="text-slate-400 text-[10px] font-semibold tracking-wider">LAST GPS PING</div>
                                        <div className="text-xs font-semibold text-slate-200 mt-1">
                                            {selectedVehicle.lastLocationAt 
                                                ? `${Math.round((Date.now() - new Date(selectedVehicle.lastLocationAt).getTime()) / 1000)}s ago`
                                                : 'None'}
                                        </div>
                                    </div>
                                </div>

                                {/* External Navigation / Actions */}
                                {selectedVehicle.lat !== null && selectedVehicle.lon !== null && (
                                    <div className="pt-2">
                                        <a
                                            href={`https://www.google.com/maps?q=${selectedVehicle.lat},${selectedVehicle.lon}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>Open in Google Maps</span>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
