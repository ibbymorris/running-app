import { GPSPoint, DistanceUnit } from '../types';

/**
 * Haversine formula to calculate distance between two lat/lng coordinates in kilometers.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function kmToMiles(km: number): number {
  return km * 0.621371;
}

export function milesToKm(miles: number): number {
  return miles / 0.621371;
}

/**
 * Format duration in seconds to "MM:SS" or "HH:MM:SS"
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * Format pace decimal (minutes per unit) into "M:SS /km" or "M:SS /mi"
 */
export function formatPace(paceMinPerUnit: number, unit: DistanceUnit): string {
  if (!isFinite(paceMinPerUnit) || paceMinPerUnit <= 0 || paceMinPerUnit > 99) {
    return `--:-- /${unit}`;
  }
  const min = Math.floor(paceMinPerUnit);
  const sec = Math.round((paceMinPerUnit - min) * 60);
  const formattedSec = sec < 10 ? `0${sec}` : sec === 60 ? '00' : `${sec}`;
  const actualMin = sec === 60 ? min + 1 : min;
  return `${actualMin}:${formattedSec} /${unit}`;
}

/**
 * Converts GPS points array into an SVG path string scaled to fit SVG canvas dimensions.
 */
export function pointsToSvgPath(
  points: GPSPoint[],
  width: number = 300,
  height: number = 300,
  padding: number = 24
): { path: string; bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number } } {
  if (!points || points.length < 2) {
    // Default diagonal smooth line if not enough points
    return {
      path: `M ${padding} ${height - padding} L ${width - padding} ${padding}`,
      bounds: { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 }
    };
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  points.forEach((p) => {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  });

  const latSpan = maxLat - minLat || 0.001;
  const lngSpan = maxLng - minLng || 0.001;

  const drawableW = width - padding * 2;
  const drawableH = height - padding * 2;

  // Scale maintaining aspect ratio
  const scale = Math.min(drawableW / lngSpan, drawableH / latSpan);

  const offsetX = padding + (drawableW - lngSpan * scale) / 2;
  const offsetY = padding + (drawableH - latSpan * scale) / 2;

  const svgCoords = points.map((p) => {
    const x = offsetX + (p.lng - minLng) * scale;
    // Invert Y because SVG 0 is top
    const y = offsetY + (maxLat - p.lat) * scale;
    return { x, y };
  });

  // Build SVG path with slight bezier curve smoothing or simple lines
  let pathStr = `M ${svgCoords[0].x.toFixed(1)} ${svgCoords[0].y.toFixed(1)}`;
  for (let i = 1; i < svgCoords.length; i++) {
    pathStr += ` L ${svgCoords[i].x.toFixed(1)} ${svgCoords[i].y.toFixed(1)}`;
  }

  return {
    path: pathStr,
    bounds: { minLat, maxLat, minLng, maxLng }
  };
}

/**
 * Generate a realistic simulated route around a center point for simulation mode
 */
export function generateSimulatedPoints(
  centerLat: number = 51.5074,
  centerLng: number = -0.1278,
  numPoints: number = 30
): GPSPoint[] {
  const points: GPSPoint[] = [];
  const now = Date.now();
  let currLat = centerLat;
  let currLng = centerLng;

  // Angle progression to create a realistic loop/circuit
  let angle = Math.random() * Math.PI * 2;
  const radiusStep = 0.0003; // approx ~30m per step

  for (let i = 0; i < numPoints; i++) {
    angle += (Math.random() - 0.4) * 0.5; // smooth curve
    currLat += Math.cos(angle) * radiusStep;
    currLng += Math.sin(angle) * radiusStep;

    points.push({
      lat: currLat,
      lng: currLng,
      timestamp: now + i * 3000,
      speed: 2.8 + Math.random() * 0.6, // ~10 km/h or 6:00/km pace
      altitude: 15 + Math.sin(i * 0.3) * 5
    });
  }

  return points;
}

/**
 * High quality stock runner images for social post templates
 */
export const STOCK_RUNNER_PHOTOS = [
  {
    id: 'photo-1',
    name: 'Outdoor Track',
    url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'photo-2',
    name: 'City Marathon',
    url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'photo-3',
    name: 'Sunset Trail',
    url: 'https://images.unsplash.com/photo-1486218119243-1388350ded58?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'photo-4',
    name: 'Morning Jogger',
    url: 'https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'photo-5',
    name: 'Focused Runner',
    url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1000&q=80',
  }
];

export const COLOR_SWATCHES = [
  { id: 'crimson', name: 'Crimson Red', bgClass: 'bg-red-600', textHex: '#ffffff', accentHex: '#dc2626' },
  { id: 'dark-crimson', name: 'Deep Crimson', bgClass: 'bg-red-950', textHex: '#fecaca', accentHex: '#991b1b' },
  { id: 'sand', name: 'Desert Sand', bgClass: 'bg-amber-100', textHex: '#78350f', accentHex: '#f59e0b' },
  { id: 'magenta', name: 'Neon Purple', bgClass: 'bg-purple-600', textHex: '#ffffff', accentHex: '#a855f7' },
  { id: 'amber', name: 'Solar Amber', bgClass: 'bg-amber-500', textHex: '#000000', accentHex: '#f59e0b' },
  { id: 'azure', name: 'Electric Blue', bgClass: 'bg-blue-600', textHex: '#ffffff', accentHex: '#2563eb' },
  { id: 'monochrome', name: 'Obsidian Black', bgClass: 'bg-stone-900', textHex: '#ffffff', accentHex: '#262626' }
];
