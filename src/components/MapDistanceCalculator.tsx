'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { MapPin, Navigation, Clock, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { searchPlacesOSM, calculateRouteOSRM, type PlaceSuggestion } from '@/lib/osrm-actions';

interface MapDistanceCalculatorProps {
  onDistanceCalculated?: (distanceKm: number, durationText: string, startAddress: string, endAddress: string) => void;
}

export function MapDistanceCalculator({ onDistanceCalculated }: MapDistanceCalculatorProps) {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lon: number } | null>(null);

  const [pickupSuggestions, setPickupSuggestions] = useState<PlaceSuggestion[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showPickupList, setShowPickupList] = useState(false);
  const [showDropoffList, setShowDropoffList] = useState(false);

  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  const pickupWrapperRef = useRef<HTMLDivElement>(null);
  const dropoffWrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
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

  const calculateRoute = async () => {
    if (!pickup.trim() || !dropoff.trim()) {
      setCalcError('Please enter both pickup and drop-off locations.');
      return;
    }

    setIsCalculating(true);
    setCalcError(null);

    const res = await calculateRouteOSRM(
      pickup.trim(),
      dropoff.trim(),
      pickupCoords || undefined,
      dropoffCoords || undefined
    );

    setIsCalculating(false);

    if (res.success && res.distanceKm !== undefined && res.durationText) {
      setDistance(`${res.distanceKm.toFixed(1)} km`);
      setDuration(res.durationText);

      if (onDistanceCalculated) {
        onDistanceCalculated(
          res.distanceKm,
          res.durationText,
          res.startAddress || pickup.trim(),
          res.endAddress || dropoff.trim()
        );
      }
    } else {
      setCalcError(res.error || 'Could not find a driving route between these locations.');
    }
  };

  return (
    <Card className="bg-muted/30 border-dashed shadow-sm">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="font-medium text-sm sm:text-base">Road Route Planner</h3>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full">
            Global Routing (OSRM)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pickup Input with Autocomplete Dropdown */}
          <div className="space-y-2 relative" ref={pickupWrapperRef}>
            <Label htmlFor="osm-pickup">Pickup Location (From)</Label>
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
                  calculateRoute();
                }
              }}
              placeholder="e.g. Kirulapana, Colombo, Airport, London..."
              className="bg-background"
              autoComplete="off"
            />

            {/* Suggestions list */}
            {showPickupList && pickupSuggestions.length > 0 && (
              <ul className="absolute z-50 left-0 right-0 top-[100%] mt-1 bg-popover border rounded-md shadow-lg max-h-56 overflow-auto text-sm divide-y">
                {pickupSuggestions.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors text-xs leading-relaxed"
                    onMouseDown={() => handleSelectPickup(item)}
                  >
                    <div className="font-semibold text-foreground">{item.shortName}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{item.displayName}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Drop-off Input with Autocomplete Dropdown */}
          <div className="space-y-2 relative" ref={dropoffWrapperRef}>
            <Label htmlFor="osm-dropoff">Drop-off Location (To)</Label>
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
                  calculateRoute();
                }
              }}
              placeholder="e.g. Kandy, Galle, Ella, Manchester..."
              className="bg-background"
              autoComplete="off"
            />

            {/* Suggestions list */}
            {showDropoffList && dropoffSuggestions.length > 0 && (
              <ul className="absolute z-50 left-0 right-0 top-[100%] mt-1 bg-popover border rounded-md shadow-lg max-h-56 overflow-auto text-sm divide-y">
                {dropoffSuggestions.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors text-xs leading-relaxed"
                    onMouseDown={() => handleSelectDropoff(item)}
                  >
                    <div className="font-semibold text-foreground">{item.shortName}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{item.displayName}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {calcError && (
          <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-md border border-destructive/20">
            {calcError}
          </div>
        )}

        <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={calculateRoute}
            disabled={isCalculating || !pickup.trim() || !dropoff.trim()}
            className="flex items-center gap-1.5"
          >
            {isCalculating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Calculating Route...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                Calculate Distance
              </>
            )}
          </Button>

          {distance && duration && (
            <div className="flex gap-4 text-sm font-semibold bg-background p-2 rounded-md border shadow-xs animate-in fade-in duration-200">
              <span className="flex items-center gap-1.5 text-primary">
                <Navigation className="w-4 h-4" /> {distance}
              </span>
              <span className="flex items-center gap-1.5 text-blue-600">
                <Clock className="w-4 h-4" /> {duration}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
