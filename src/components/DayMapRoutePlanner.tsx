'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import {
  Navigation,
  Clock,
  Loader2,
  Check,
  X,
  Plus,
  Trash2,
  RotateCcw,
  Fuel,
  ExternalLink,
  Map as MapIcon,
  Sparkles,
} from 'lucide-react';
import {
  searchPlacesOSM,
  calculateRouteOSRM,
  type PlaceSuggestion,
  type RouteResult,
} from '@/lib/osrm-actions';

const OSRMRouteMap = dynamic(
  () => import('./OSRMRouteMap').then((mod) => mod.OSRMRouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-44 flex items-center justify-center bg-muted/30 rounded-lg text-xs text-muted-foreground animate-pulse">
        Loading Route Map...
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

interface DayMapRoutePlannerProps {
  dayNumber: number;
  initialFrom?: string;
  initialTo?: string;
  onApplyRoute: (routeTitle: string, distanceKm: number, durationText: string) => void;
  onCancel: () => void;
}

export function DayMapRoutePlanner({
  dayNumber,
  initialFrom = '',
  initialTo = '',
  onApplyRoute,
  onCancel,
}: DayMapRoutePlannerProps) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [fromCoords, setFromCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [toCoords, setToCoords] = useState<{ lat: number; lon: number } | null>(null);

  const [fromSuggestions, setFromSuggestions] = useState<PlaceSuggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showFromList, setShowFromList] = useState(false);
  const [showToList, setShowToList] = useState(false);

  // Intermediate Waypoints
  const [waypoints, setWaypoints] = useState<WaypointItem[]>([]);
  const [isRoundTrip, setIsRoundTrip] = useState(false);

  // Calculated results
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fromRef.current && !fromRef.current.contains(event.target as Node)) {
        setShowFromList(false);
      }
      if (toRef.current && !toRef.current.contains(event.target as Node)) {
        setShowToList(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for "From"
  useEffect(() => {
    if (!from.trim() || from.length < 2) {
      setFromSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchPlacesOSM(from);
      setFromSuggestions(results);
      if (results.length > 0) setShowFromList(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [from]);

  // Debounced search for "To"
  useEffect(() => {
    if (!to.trim() || to.length < 2) {
      setToSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchPlacesOSM(to);
      setToSuggestions(results);
      if (results.length > 0) setShowToList(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [to]);

  const handleSelectFrom = (item: PlaceSuggestion) => {
    setFrom(item.shortName || item.displayName);
    setFromCoords({ lat: item.lat, lon: item.lon });
    setShowFromList(false);
  };

  const handleSelectTo = (item: PlaceSuggestion) => {
    setTo(item.shortName || item.displayName);
    setToCoords({ lat: item.lat, lon: item.lon });
    setShowToList(false);
  };

  const handleAddWaypoint = () => {
    setWaypoints((prev) => [
      ...prev,
      {
        id: `wp-day-${Date.now()}`,
        name: '',
        suggestions: [],
        showList: false,
      },
    ]);
  };

  const handleRemoveWaypoint = (id: string) => {
    setWaypoints((prev) => prev.filter((wp) => wp.id !== id));
  };

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

  const calculateDistance = async () => {
    if (!from.trim() || !to.trim()) {
      setCalcError('Please enter both origin and destination.');
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

    const res = await calculateRouteOSRM(from.trim(), to.trim(), {
      originCoords: fromCoords || undefined,
      destCoords: toCoords || undefined,
      waypoints: activeWaypoints,
      isRoundTrip,
    });

    setIsCalculating(false);

    if (res.success && res.distanceKm !== undefined && res.durationText) {
      setRouteResult(res);
    } else {
      setCalcError(res.error || 'Could not find driving route. Please check location names.');
    }
  };

  const handleApply = () => {
    if (!routeResult || routeResult.distanceKm === undefined || !routeResult.durationText) return;
    
    // Construct route title e.g. "Colombo → Pinnawala → Kandy"
    const fromTown = from.split(',')[0].trim();
    const wpTowns = waypoints
      .filter((wp) => wp.name.trim().length > 0)
      .map((wp) => wp.name.split(',')[0].trim());
    const toTown = to.split(',')[0].trim();

    const stops = [fromTown, ...wpTowns, toTown];
    if (isRoundTrip) {
      stops.push(fromTown);
    }
    const routeTitle = stops.join(' → ');

    onApplyRoute(routeTitle, routeResult.distanceKm, routeResult.durationText);
  };

  return (
    <div className="bg-background border border-primary/25 rounded-lg p-3.5 space-y-3 shadow-xs animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Navigation className="w-3.5 h-3.5" />
          <span>Day {dayNumber} Road Route Planner (OSRM)</span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground text-xs p-1 rounded-md"
          title="Close Planner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Origin Input */}
        <div className="space-y-1 relative" ref={fromRef}>
          <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            From (Origin)
          </Label>
          <Input
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setFromCoords(null);
              setCalcError(null);
              setRouteResult(null);
            }}
            onFocus={() => {
              if (fromSuggestions.length > 0) setShowFromList(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setShowFromList(false);
                calculateDistance();
              }
            }}
            placeholder="e.g. Airport, Colombo..."
            className="h-8 text-xs bg-muted/20"
            autoComplete="off"
          />
          {showFromList && fromSuggestions.length > 0 && (
            <ul className="absolute z-50 left-0 right-0 top-[100%] mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto text-xs divide-y">
              {fromSuggestions.map((item, idx) => (
                <li
                  key={idx}
                  className="p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors leading-tight"
                  onMouseDown={() => handleSelectFrom(item)}
                >
                  <div className="font-medium text-foreground">{item.shortName}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{item.displayName}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Destination Input */}
        <div className="space-y-1 relative" ref={toRef}>
          <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
            To (Destination)
          </Label>
          <Input
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setToCoords(null);
              setCalcError(null);
              setRouteResult(null);
            }}
            onFocus={() => {
              if (toSuggestions.length > 0) setShowToList(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setShowToList(false);
                calculateDistance();
              }
            }}
            placeholder="e.g. Sigiriya, Kandy, Galle..."
            className="h-8 text-xs bg-muted/20"
            autoComplete="off"
          />
          {showToList && toSuggestions.length > 0 && (
            <ul className="absolute z-50 left-0 right-0 top-[100%] mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto text-xs divide-y">
              {toSuggestions.map((item, idx) => (
                <li
                  key={idx}
                  className="p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors leading-tight"
                  onMouseDown={() => handleSelectTo(item)}
                >
                  <div className="font-medium text-foreground">{item.shortName}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{item.displayName}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Intermediate Stops */}
      {waypoints.length > 0 && (
        <div className="space-y-2 pl-2.5 border-l-2 border-primary/20">
          {waypoints.map((wp, index) => (
            <div key={wp.id} className="relative group">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-muted-foreground">
                  Intermediate Attraction / Stop {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveWaypoint(wp.id)}
                  className="text-muted-foreground hover:text-destructive p-0.5"
                  title="Remove stop"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <Input
                value={wp.name}
                onChange={(e) => handleWaypointChange(wp.id, e.target.value)}
                placeholder="e.g. Pinnawala, Dambulla Cave Temple..."
                className="h-7 text-xs bg-background"
                autoComplete="off"
              />
              {wp.showList && wp.suggestions.length > 0 && (
                <ul className="absolute z-50 left-0 right-0 top-[100%] mt-1 bg-popover border rounded-md shadow-lg max-h-44 overflow-auto text-xs divide-y">
                  {wp.suggestions.map((item, sIdx) => (
                    <li
                      key={sIdx}
                      className="p-1.5 hover:bg-accent cursor-pointer text-xs"
                      onMouseDown={() => handleSelectWaypoint(wp.id, item)}
                    >
                      <div className="font-medium">{item.shortName}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{item.displayName}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Options: Add stop, Round-trip */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-0.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAddWaypoint}
          className="text-xs text-primary hover:text-primary/80 h-6 px-1.5 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Add Stop (Attraction)
        </Button>

        <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground select-none text-[11px]">
          <input
            type="checkbox"
            checked={isRoundTrip}
            onChange={(e) => setIsRoundTrip(e.target.checked)}
            className="rounded border-border text-primary w-3 h-3"
          />
          <RotateCcw className="w-3 h-3 text-primary" />
          Round-trip for Day {dayNumber}
        </label>
      </div>

      {calcError && (
        <div className="text-[11px] text-destructive bg-destructive/10 p-2 rounded-md border border-destructive/20">
          {calcError}
        </div>
      )}

      {/* Action / Result */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs flex items-center gap-1.5"
            onClick={calculateDistance}
            disabled={isCalculating || !from.trim() || !to.trim()}
          >
            {isCalculating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5" />
                Calculate Distance
              </>
            )}
          </Button>

          {routeResult && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowMap(!showMap)}
              className="h-7 text-xs text-muted-foreground px-2 flex items-center gap-1"
            >
              <MapIcon className="w-3 h-3" />
              {showMap ? 'Hide Map' : 'Map'}
            </Button>
          )}
        </div>

        {routeResult && routeResult.distanceKm !== undefined && routeResult.durationText && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold bg-muted px-2.5 py-1 rounded-md">
              <span className="text-primary">{routeResult.distanceKm.toFixed(1)} km</span>
              <span className="text-muted-foreground">•</span>
              <span className="flex items-center gap-1 text-muted-foreground font-normal">
                <Clock className="w-3 h-3 text-blue-500" /> {routeResult.durationText}
              </span>
            </div>

            <Button
              type="button"
              size="sm"
              className="h-7 text-xs flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleApply}
            >
              <Check className="w-3.5 h-3.5" />
              Apply to Day {dayNumber}
            </Button>
          </div>
        )}
      </div>

      {/* Optional Map Preview in Day Planner */}
      {showMap && routeResult?.coordinates && routeResult.coordinates.length > 0 && (
        <div className="pt-2 animate-in fade-in duration-150">
          <OSRMRouteMap
            coordinates={routeResult.coordinates}
            waypoints={routeResult.waypoints}
            height="220px"
          />
        </div>
      )}
    </div>
  );
}
