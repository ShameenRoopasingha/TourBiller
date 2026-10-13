'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  MapPin,
  Navigation,
  Clock,
  Loader2,
  Plus,
  Trash2,
  Fuel,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Map as MapIcon,
  ChevronDown,
  ChevronUp,
  Settings2,
  Route,
} from 'lucide-react';
import {
  searchPlacesOSM,
  calculateRouteOSRM,
  type PlaceSuggestion,
  type RouteResult,
  type RoutePoint,
  type RouteLeg,
  type FuelEstimate,
} from '@/lib/osrm-actions';

// Dynamic import for Leaflet to ensure 100% SSR safety in Next.js
const OSRMRouteMap = dynamic(
  () => import('./OSRMRouteMap').then((mod) => mod.OSRMRouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 flex items-center justify-center bg-muted/40 rounded-lg text-xs text-muted-foreground animate-pulse border border-border">
        Loading Interactive Route Map...
      </div>
    ),
  }
);

interface WaypointItem {
  id: string;
  name: string;
  lat?: number;
  lon?: number;
  suggestions: PlaceSuggestion[];
  showList: boolean;
}

interface MapDistanceCalculatorProps {
  onDistanceCalculated?: (
    distanceKm: number,
    durationText: string,
    startAddress: string,
    endAddress: string,
    details?: {
      waypoints?: RoutePoint[];
      legs?: RouteLeg[];
      fuelEstimate?: FuelEstimate;
      googleMapsUrl?: string;
      wazeUrl?: string;
    }
  ) => void;
  className?: string;
}

export function MapDistanceCalculator({
  onDistanceCalculated,
  className = '',
}: MapDistanceCalculatorProps) {
  // Endpoints
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Suggestions & Dropdown controls
  const [pickupSuggestions, setPickupSuggestions] = useState<PlaceSuggestion[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showPickupList, setShowPickupList] = useState(false);
  const [showDropoffList, setShowDropoffList] = useState(false);

  // Multi-stop intermediate waypoints
  const [waypoints, setWaypoints] = useState<WaypointItem[]>([]);

  // Route Options
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [optimizeWaypoints, setOptimizeWaypoints] = useState(false);

  // Fuel Estimator Settings
  const [showFuelSettings, setShowFuelSettings] = useState(false);
  const [fuelKmPerLiter, setFuelKmPerLiter] = useState(11);
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState(350);

  // Results & UI state
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [showLegs, setShowLegs] = useState(false);

  const pickupWrapperRef = useRef<HTMLDivElement>(null);
  const dropoffWrapperRef = useRef<HTMLDivElement>(null);

  // Close pickup/dropoff dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickupWrapperRef.current && !pickupWrapperRef.current.contains(event.target as Node)) {
        setShowPickupList(false);
      }
      if (dropoffWrapperRef.current && !dropoffWrapperRef.current.contains(event.target as Node)) {
        setShowDropoffList(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for Pickup
  useEffect(() => {
    if (!pickup.trim() || pickup.length < 2) {
      setPickupSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchPlacesOSM(pickup);
      setPickupSuggestions(results);
      if (results.length > 0) setShowPickupList(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [pickup]);

  // Debounced search for Drop-off
  useEffect(() => {
    if (!dropoff.trim() || dropoff.length < 2) {
      setDropoffSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchPlacesOSM(dropoff);
      setDropoffSuggestions(results);
      if (results.length > 0) setShowDropoffList(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [dropoff]);

  const handleSelectPickup = (item: PlaceSuggestion) => {
    setPickup(item.shortName || item.displayName);
    setPickupCoords({ lat: item.lat, lon: item.lon });
    setShowPickupList(false);
  };

  const handleSelectDropoff = (item: PlaceSuggestion) => {
    setDropoff(item.shortName || item.displayName);
    setDropoffCoords({ lat: item.lat, lon: item.lon });
    setShowDropoffList(false);
  };

  // Add intermediate waypoint
  const handleAddWaypoint = () => {
    setWaypoints((prev) => [
      ...prev,
      {
        id: `wp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: '',
        suggestions: [],
        showList: false,
      },
    ]);
  };

  // Remove intermediate waypoint
  const handleRemoveWaypoint = (id: string) => {
    setWaypoints((prev) => prev.filter((wp) => wp.id !== id));
  };

  // Update waypoint input and debounce search
  const handleWaypointChange = async (id: string, value: string) => {
    setWaypoints((prev) =>
      prev.map((wp) =>
        wp.id === id ? { ...wp, name: value, lat: undefined, lon: undefined } : wp
      )
    );

    if (value.trim().length >= 2) {
      const results = await searchPlacesOSM(value);
      setWaypoints((prev) =>
        prev.map((wp) =>
          wp.id === id ? { ...wp, suggestions: results, showList: results.length > 0 } : wp
        )
      );
    } else {
      setWaypoints((prev) =>
        prev.map((wp) => (wp.id === id ? { ...wp, suggestions: [], showList: false } : wp))
      );
    }
  };

  const handleSelectWaypoint = (id: string, item: PlaceSuggestion) => {
    setWaypoints((prev) =>
      prev.map((wp) =>
        wp.id === id
          ? {
              ...wp,
              name: item.shortName || item.displayName,
              lat: item.lat,
              lon: item.lon,
              showList: false,
            }
          : wp
      )
    );
  };

  // Calculate Route
  const handleCalculateRoute = async () => {
    if (!pickup.trim() || !dropoff.trim()) {
      setCalcError('Please enter both pickup and drop-off locations.');
      return;
    }

    setIsCalculating(true);
    setCalcError(null);

    const activeWaypoints = waypoints
      .filter((wp) => wp.name.trim().length > 0)
      .map((wp) => ({
        name: wp.name.trim(),
        lat: wp.lat,
        lon: wp.lon,
      }));

    const res = await calculateRouteOSRM(pickup.trim(), dropoff.trim(), {
      originCoords: pickupCoords || undefined,
      destCoords: dropoffCoords || undefined,
      waypoints: activeWaypoints,
      isRoundTrip,
      optimizeWaypoints,
      fuelKmPerLiter,
      fuelPricePerLiter,
    });

    setIsCalculating(false);

    if (res.success && res.distanceKm !== undefined && res.durationText) {
      setRouteResult(res);
      setShowMap(true);

      if (onDistanceCalculated) {
        onDistanceCalculated(
          res.distanceKm,
          res.durationText,
          res.startAddress || pickup.trim(),
          res.endAddress || dropoff.trim(),
          {
            waypoints: res.waypoints,
            legs: res.legs,
            fuelEstimate: res.fuelEstimate,
            googleMapsUrl: res.googleMapsUrl,
            wazeUrl: res.wazeUrl,
          }
        );
      }
    } else {
      setCalcError(res.error || 'Could not find a driving route between these locations.');
    }
  };

  const handleReset = () => {
    setPickup('');
    setDropoff('');
    setPickupCoords(null);
    setDropoffCoords(null);
    setWaypoints([]);
    setIsRoundTrip(false);
    setOptimizeWaypoints(false);
    setRouteResult(null);
    setCalcError(null);
  };

  return (
    <Card className={`bg-card/50 border shadow-xs overflow-hidden ${className}`}>
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Route className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base leading-none">Smart Route & Distance Planner</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                OSRM Global Road Routing • Multi-Stop • TSP Optimization
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
              100% Free & Unlimited
            </Badge>
          </div>
        </div>

        {/* Locations Inputs Section */}
        <div className="space-y-3">
          {/* Pickup Location */}
          <div className="relative" ref={pickupWrapperRef}>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="osm-pickup" className="text-xs font-medium flex items-center gap-1.5 text-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Pickup Location (From)
              </Label>
              {pickupCoords && (
                <span className="text-[10px] text-emerald-600 font-mono">Pinned</span>
              )}
            </div>
            <Input
              id="osm-pickup"
              value={pickup}
              onChange={(e) => {
                setPickup(e.target.value);
                setPickupCoords(null);
                setCalcError(null);
              }}
              onFocus={() => {
                if (pickupSuggestions.length > 0) setShowPickupList(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setShowPickupList(false);
                  handleCalculateRoute();
                }
              }}
              placeholder="e.g. Bandaranaike Airport (CMB), Colombo, Hotel..."
              className="bg-background text-xs sm:text-sm h-9"
              autoComplete="off"
            />
            {showPickupList && pickupSuggestions.length > 0 && (
              <ul className="absolute z-50 left-0 right-0 top-[100%] mt-1 bg-popover border rounded-md shadow-lg max-h-52 overflow-auto text-xs divide-y">
                {pickupSuggestions.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors leading-relaxed"
                    onMouseDown={() => handleSelectPickup(item)}
                  >
                    <div className="font-semibold text-foreground">{item.shortName}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{item.displayName}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Intermediate Waypoints */}
          {waypoints.length > 0 && (
            <div className="space-y-2 pl-3 border-l-2 border-primary/20 my-2">
              {waypoints.map((wp, index) => (
                <div key={wp.id} className="relative group">
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-[11px] font-medium flex items-center gap-1.5 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                      Intermediate Stop {index + 1}
                    </Label>
                    <button
                      type="button"
                      onClick={() => handleRemoveWaypoint(wp.id)}
                      className="text-muted-foreground hover:text-destructive p-0.5 rounded transition-colors"
                      title="Remove stop"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      value={wp.name}
                      onChange={(e) => handleWaypointChange(wp.id, e.target.value)}
                      placeholder="e.g. Pinnawala Elephant Orphanage, Sigiriya, Dambulla..."
                      className="bg-background text-xs h-8 pr-8"
                      autoComplete="off"
                    />
                    {wp.showList && wp.suggestions.length > 0 && (
                      <ul className="absolute z-50 left-0 right-0 top-[100%] mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto text-xs divide-y">
                        {wp.suggestions.map((item, sIdx) => (
                          <li
                            key={sIdx}
                            className="p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors leading-relaxed"
                            onMouseDown={() => handleSelectWaypoint(wp.id, item)}
                          >
                            <div className="font-medium text-foreground">{item.shortName}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{item.displayName}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Stop Button */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddWaypoint}
              className="text-xs text-primary hover:text-primary/80 h-7 px-2 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Intermediate Stop / Waypoint
            </Button>
          </div>

          {/* Drop-off Location */}
          <div className="relative" ref={dropoffWrapperRef}>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="osm-dropoff" className="text-xs font-medium flex items-center gap-1.5 text-foreground">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                {isRoundTrip ? 'Main Destination (Turnaround Point)' : 'Drop-off Location (To)'}
              </Label>
              {isRoundTrip ? (
                <span className="text-[10px] text-blue-600 font-mono font-medium">Auto-returns to Pickup</span>
              ) : dropoffCoords ? (
                <span className="text-[10px] text-emerald-600 font-mono">Pinned</span>
              ) : null}
            </div>
            <Input
              id="osm-dropoff"
              value={dropoff}
              onChange={(e) => {
                setDropoff(e.target.value);
                setDropoffCoords(null);
                setCalcError(null);
              }}
              onFocus={() => {
                if (dropoffSuggestions.length > 0) setShowDropoffList(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setShowDropoffList(false);
                  handleCalculateRoute();
                }
              }}
              placeholder={
                isRoundTrip
                  ? "e.g. Kandy, Yala, Kataragama (returns to pickup)..."
                  : "e.g. Kandy, Galle Fort, Ella, Mirissa..."
              }
              className="bg-background text-xs sm:text-sm h-9"
              autoComplete="off"
            />
            {showDropoffList && dropoffSuggestions.length > 0 && (
              <ul className="absolute z-50 left-0 right-0 top-[100%] mt-1 bg-popover border rounded-md shadow-lg max-h-52 overflow-auto text-xs divide-y">
                {dropoffSuggestions.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors leading-relaxed"
                    onMouseDown={() => handleSelectDropoff(item)}
                  >
                    <div className="font-semibold text-foreground">{item.shortName}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{item.displayName}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Route Controls: Round Trip, TSP Optimization, Fuel Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-muted/40 rounded-lg text-xs border border-border/50">
          <div className="flex flex-wrap items-center gap-4">
            {/* Round trip toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isRoundTrip}
                onChange={(e) => setIsRoundTrip(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
              />
              <span className="flex items-center gap-1 font-medium">
                <RotateCcw className="w-3 h-3 text-primary" />
                Round-Trip (Return to Pickup)
              </span>
            </label>

            {/* Smart TSP Optimization (when 2+ stops) */}
            {waypoints.length > 1 && (
              <label className="flex items-center gap-2 cursor-pointer select-none text-purple-700 dark:text-purple-300">
                <input
                  type="checkbox"
                  checked={optimizeWaypoints}
                  onChange={(e) => setOptimizeWaypoints(e.target.checked)}
                  className="rounded border-border text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                />
                <span className="flex items-center gap-1 font-semibold">
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  Optimize Route Order (TSP)
                </span>
              </label>
            )}
          </div>

          {/* Fuel settings button */}
          <button
            type="button"
            onClick={() => setShowFuelSettings(!showFuelSettings)}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <Fuel className="w-3 h-3 text-amber-500" />
            <span>Fuel Config ({fuelKmPerLiter} km/L • Rs. {fuelPricePerLiter})</span>
            {showFuelSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Collapsible Fuel Settings */}
        {showFuelSettings && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg border text-xs animate-in fade-in duration-150">
            <div>
              <Label className="text-[11px] text-muted-foreground">Fuel Efficiency (km per Liter)</Label>
              <Input
                type="number"
                min="3"
                max="35"
                value={fuelKmPerLiter}
                onChange={(e) => setFuelKmPerLiter(parseFloat(e.target.value) || 11)}
                className="h-7 text-xs bg-background mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Fuel Price (LKR per Liter)</Label>
              <Input
                type="number"
                min="100"
                max="800"
                value={fuelPricePerLiter}
                onChange={(e) => setFuelPricePerLiter(parseFloat(e.target.value) || 350)}
                className="h-7 text-xs bg-background mt-1"
              />
            </div>
          </div>
        )}

        {/* Error Notification */}
        {calcError && (
          <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-md border border-destructive/20 animate-in fade-in">
            {calcError}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleCalculateRoute}
              disabled={isCalculating || !pickup.trim() || !dropoff.trim()}
              className="flex items-center gap-1.5 text-xs h-8 px-3"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Calculating Route...
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5" />
                  Calculate Route
                </>
              )}
            </Button>

            {routeResult && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMap(!showMap)}
                className="text-xs h-8 px-2.5 flex items-center gap-1 text-muted-foreground"
              >
                <MapIcon className="w-3.5 h-3.5" />
                {showMap ? 'Hide Map' : 'Show Map'}
              </Button>
            )}
          </div>

          {(pickup || dropoff || waypoints.length > 0) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
            >
              Reset
            </Button>
          )}
        </div>

        {/* Calculation Results Card */}
        {routeResult && (
          <div className="space-y-3 pt-2 border-t border-border/70 animate-in fade-in duration-200">
            {/* Primary Stats: Distance & Duration */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Total Distance</span>
                <span className="text-base sm:text-lg font-bold text-primary flex items-center gap-1">
                  <Navigation className="w-4 h-4 shrink-0" />
                  {routeResult.distanceKm?.toFixed(1)} km
                </span>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-2.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Est. Drive Time</span>
                <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <Clock className="w-4 h-4 shrink-0" />
                  {routeResult.durationText}
                </span>
              </div>

              {routeResult.fuelEstimate && (
                <>
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-2.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Fuel Required</span>
                    <span className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Fuel className="w-4 h-4 shrink-0" />
                      ~{routeResult.fuelEstimate.liters.toFixed(1)} L
                    </span>
                  </div>

                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Est. Fuel Cost</span>
                    <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      Rs. {routeResult.fuelEstimate.estimatedCost.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Interactive Leaflet Map Preview */}
            {showMap && routeResult.coordinates && routeResult.coordinates.length > 0 && (
              <div className="animate-in fade-in duration-200">
                <OSRMRouteMap
                  coordinates={routeResult.coordinates}
                  waypoints={routeResult.waypoints}
                  height="280px"
                />
              </div>
            )}

            {/* Multi-Leg Breakdown (if multiple stops) */}
            {routeResult.legs && routeResult.legs.length > 1 && (
              <div className="bg-muted/30 rounded-lg border p-2.5 text-xs">
                <div
                  className="flex items-center justify-between cursor-pointer font-medium text-foreground select-none"
                  onClick={() => setShowLegs(!showLegs)}
                >
                  <span className="flex items-center gap-1.5">
                    <Route className="w-3.5 h-3.5 text-primary" />
                    Leg-by-Leg Route Breakdown ({routeResult.legs.length} legs)
                  </span>
                  {showLegs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>

                {showLegs && (
                  <div className="mt-2 space-y-1.5 divide-y divide-border/40 pt-1">
                    {routeResult.legs.map((leg, lIdx) => (
                      <div key={lIdx} className="pt-1.5 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground truncate max-w-[65%]">
                          <strong className="text-foreground">Leg {lIdx + 1}:</strong> {leg.fromName} → {leg.toName}
                        </span>
                        <span className="font-mono font-medium text-foreground">
                          {leg.distanceKm} km ({leg.durationText})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 1-Click Driver Navigation Links */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 bg-muted/20 p-2.5 rounded-lg border border-border/40">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-primary" />
                1-Click Driver Navigation:
              </span>
              <div className="flex items-center gap-2">
                {routeResult.googleMapsUrl && (
                  <a
                    href={routeResult.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
                  >
                    Google Maps
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {routeResult.wazeUrl && (
                  <a
                    href={routeResult.wazeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-sky-500 hover:bg-sky-600 text-white transition-colors shadow-xs"
                  >
                    Waze
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
