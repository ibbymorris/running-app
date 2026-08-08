import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { GPSPoint } from '../types';

interface LeafletMapProps {
  coordinates: GPSPoint[];
  isLive?: boolean;
  className?: string;
  darkStyle?: boolean;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  coordinates,
  isLive = false,
  className = 'w-full h-full min-h-[220px]',
  darkStyle = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const startMarkerRef = useRef<L.CircleMarker | null>(null);
  const currentMarkerRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map if not initialized
    if (!mapInstanceRef.current) {
      const defaultLat = coordinates.length > 0 ? coordinates[coordinates.length - 1].lat : 51.5074;
      const defaultLng = coordinates.length > 0 ? coordinates[coordinates.length - 1].lng : -0.1278;

      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      // CartoDB Dark Matter tile layer for slick high-contrast running feel
      const tileUrl = darkStyle
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      L.tileLayer(tileUrl, {
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Convert coordinates to LatLngExpression array
    const latLngs: L.LatLngExpression[] = coordinates.map((pt) => [pt.lat, pt.lng]);

    // Update or create polyline
    if (polylineRef.current) {
      polylineRef.current.setLatLngs(latLngs);
    } else if (latLngs.length > 0) {
      polylineRef.current = L.polyline(latLngs, {
        color: '#EF4444', // Red-500
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
    }

    // Update Start Marker
    if (latLngs.length > 0) {
      const startCoord = latLngs[0];
      if (!startMarkerRef.current) {
        startMarkerRef.current = L.circleMarker(startCoord, {
          radius: 7,
          fillColor: '#22C55E', // Green start
          color: '#FFFFFF',
          weight: 2,
          fillOpacity: 1,
        }).addTo(map);
      } else {
        startMarkerRef.current.setLatLng(startCoord);
      }
    }

    // Update Current Position Marker
    if (latLngs.length > 0) {
      const currCoord = latLngs[latLngs.length - 1];
      if (!currentMarkerRef.current) {
        currentMarkerRef.current = L.circleMarker(currCoord, {
          radius: 9,
          fillColor: '#3B82F6', // Blue location
          color: '#FFFFFF',
          weight: 3,
          fillOpacity: 1,
        }).addTo(map);
      } else {
        currentMarkerRef.current.setLatLng(currCoord);
      }

      if (isLive) {
        map.panTo(currCoord, { animate: true });
      } else if (latLngs.length > 1) {
        // Fit bounds for completed run summary
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    }

    // Force resize calculation
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      // Map cleanup on unmount handled gracefully
    };
  }, [coordinates, isLive, darkStyle]);

  // Clean destroy map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full rounded-2xl" />
    </div>
  );
};
