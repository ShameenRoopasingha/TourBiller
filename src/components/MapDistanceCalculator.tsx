'use client';

import React, { useState } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { MapPin, Navigation, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

const libraries: ("places")[] = ["places"];

interface MapDistanceCalculatorProps {
  onDistanceCalculated?: (distanceKm: number, durationText: string, startAddress: string, endAddress: string) => void;
}

export function MapDistanceCalculator({ onDistanceCalculated }: MapDistanceCalculatorProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  const calculateRoute = () => {
    if (!pickup.trim() || !dropoff.trim()) {
      setCalcError('Please enter both pickup and drop-off locations.');
      return;
    }

    if (!window.google?.maps?.DirectionsService) {
      setCalcError('Google Maps Directions service is not loaded yet.');
      return;
    }

    setIsCalculating(true);
    setCalcError(null);

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: pickup.trim(),
        destination: dropoff.trim(),
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        setIsCalculating(false);

        if (status === google.maps.DirectionsStatus.OK && result) {
          const route = result.routes[0].legs[0];
          const distText = route.distance?.text || null;
          const durText = route.duration?.text || null;
          const startAddr = route.start_address || pickup.trim();
          const endAddr = route.end_address || dropoff.trim();

          setDistance(distText);
          setDuration(durText);

          if (onDistanceCalculated && route.distance?.value) {
            onDistanceCalculated(
              route.distance.value / 1000,
              durText || "",
              startAddr,
              endAddr
            );
          }
        } else {
          console.warn("Directions request status:", status);
          if (status === 'ZERO_RESULTS') {
            setCalcError('No driving route found between these two locations. Please check the spellings.');
          } else if (status === 'NOT_FOUND') {
            setCalcError('One or both locations could not be identified. Try adding city or country name (e.g. "Kandy, Sri Lanka").');
          } else {
            setCalcError(`Could not calculate route (${status}). Please check your inputs.`);
          }
        }
      }
    );
  };

  if (loadError) {
    return <div className="text-destructive text-sm p-4">Error loading Google Maps Engine.</div>;
  }

  // Check if API key exists
  const needsKey = !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <Card className="bg-muted/30 border-dashed shadow-sm">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="font-medium">Map Route Planner</h3>
        </div>

        {needsKey && (
          <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-3 rounded-md text-sm border border-amber-200">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Google Maps API Key Missing!</p>
              <p>Please add <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your .env file to enable distance calculation.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="map-pickup">Pickup Location (From)</Label>
            <Input
              id="map-pickup"
              value={pickup}
              onChange={(e) => {
                setPickup(e.target.value);
                setCalcError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  calculateRoute();
                }
              }}
              placeholder="e.g. Kirulapana, Colombo, Airport..."
              disabled={needsKey || !isLoaded}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="map-dropoff">Drop-off Location (To)</Label>
            <Input
              id="map-dropoff"
              value={dropoff}
              onChange={(e) => {
                setDropoff(e.target.value);
                setCalcError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  calculateRoute();
                }
              }}
              placeholder="e.g. Kandy, Galle, Ella, Sigiriya..."
              disabled={needsKey || !isLoaded}
              className="bg-background"
            />
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
            disabled={needsKey || !isLoaded || isCalculating || !pickup.trim() || !dropoff.trim()}
            className="flex items-center gap-1.5"
          >
            {isCalculating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Calculating...
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

