'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Navigation, Clock, Loader2, Check, X, ArrowRight } from 'lucide-react';
import { searchPlacesOSM, calculateRouteOSRM, type PlaceSuggestion } from '@/lib/osrm-actions';

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

  const [distance, setDistance] = useState<number | null>(null);
  const [durationText, setDurationText] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

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

  const calculateDistance = async () => {
    if (!from.trim() || !to.trim()) {
      setCalcError('Please enter both origin and destination.');
      return;
    }

    setIsCalculating(true);
    setCalcError(null);

    const res = await calculateRouteOSRM(
      from.trim(),
      to.trim(),
      fromCoords || undefined,
      toCoords || undefined
    );

    setIsCalculating(false);

    if (res.success && res.distanceKm !== undefined && res.durationText) {
      setDistance(res.distanceKm);
      setDurationText(res.durationText);
    } else {
      setCalcError(res.error || 'Could not find driving route. Please check location names.');
    }
  };

  const handleApply = () => {
    if (distance === null || !durationText) return;
    const fromTown = from.split(',')[0].trim();
    const toTown = to.split(',')[0].trim();
    const routeTitle = `${fromTown} → ${toTown}`;
    onApplyRoute(routeTitle, distance, durationText);
  };

  return (
    <div className="bg-background border border-primary/20 rounded-lg p-3.5 space-y-3 shadow-xs animate-in fade-in duration-150">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Origin Input */}
        <div className="space-y-1 relative" ref={fromRef}>
          <Label className="text-[11px] text-muted-foreground">From (Origin)</Label>
          <Input
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setFromCoords(null);
              setCalcError(null);
              setDistance(null);
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
          <Label className="text-[11px] text-muted-foreground">To (Destination)</Label>
          <Input
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setToCoords(null);
              setCalcError(null);
              setDistance(null);
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

      {calcError && (
        <div className="text-[11px] text-destructive bg-destructive/10 p-2 rounded-md border border-destructive/20">
          {calcError}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
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

        {distance !== null && durationText && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold bg-muted px-2.5 py-1 rounded-md">
              <span className="text-primary">{distance.toFixed(1)} km</span>
              <span className="text-muted-foreground">•</span>
              <span className="flex items-center gap-1 text-muted-foreground font-normal">
                <Clock className="w-3 h-3 text-blue-500" /> {durationText}
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
    </div>
  );
}
