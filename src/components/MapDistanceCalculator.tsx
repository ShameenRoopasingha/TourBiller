'use client';

import React, { useState } from 'react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { MapPin, Navigation, Clock, AlertTriangle } from 'lucide-react';
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

  const [startRef, setStartRef] = useState<google.maps.places.Autocomplete | null>(null);
  const [endRef, setEndRef] = useState<google.maps.places.Autocomplete | null>(null);
  
  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  
  const calculateRoute = () => {
    if (!startRef || !endRef) return;
    
    const startPlace = startRef.getPlace();
    const endPlace = endRef.getPlace();
    
    if (!startPlace?.geometry?.location || !endPlace?.geometry?.location) return;

    const directionsService = new google.maps.DirectionsService();
    
    directionsService.route({
      origin: startPlace.geometry.location,
      destination: endPlace.geometry.location,
      travelMode: google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        const route = result.routes[0].legs[0];
        setDistance(route.distance?.text || null);
        setDuration(route.duration?.text || null);
        
        if (onDistanceCalculated && route.distance?.value) {
            onDistanceCalculated(
                route.distance.value / 1000, 
                route.duration?.text || "",
                startPlace.formatted_address || startPlace.name || "",
                endPlace.formatted_address || endPlace.name || ""
            );
        }
      } else {
        console.error("Directions request failed due to " + status);
      }
    });
  };

  if (loadError) return <div className="text-destructive text-sm p-4">Error loading Google Maps.</div>;
  if (!isLoaded) return <div className="text-muted-foreground text-sm p-4 animate-pulse">Loading Maps Engine...</div>;

  // We check if API key exists. If it's missing or empty, Maps will not work properly.
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
                <p>Please add <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your .env file to enable location autocomplete and distance calculation.</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Pickup Location (From)</Label>
            <Autocomplete 
              onLoad={setStartRef} 
              onPlaceChanged={() => {
                if (endRef?.getPlace()) calculateRoute();
              }}
            >
              <Input 
                placeholder="Search pickup location..." 
                disabled={needsKey}
                className="bg-background"
              />
            </Autocomplete>
          </div>
          
          <div className="space-y-2">
            <Label>Drop-off Location (To)</Label>
            <Autocomplete 
              onLoad={setEndRef} 
              onPlaceChanged={calculateRoute}
            >
              <Input 
                placeholder="Search destination..." 
                disabled={needsKey}
                className="bg-background"
              />
            </Autocomplete>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-2">
            <Button type="button" variant="outline" size="sm" onClick={calculateRoute} disabled={needsKey}>
                Calculate Distance
            </Button>
            
            {distance && duration && (
            <div className="flex gap-4 text-sm font-semibold bg-background p-2 rounded-md border">
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
