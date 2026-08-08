export type DistanceUnit = 'km' | 'mi';

export type RunType = 'short' | 'long' | 'interval' | 'tempo' | 'race';

export interface GPSPoint {
  lat: number;
  lng: number;
  timestamp: number;
  altitude?: number | null;
  speed?: number | null; // in m/s
}

export interface RunData {
  id: string;
  date: string; // ISO or formatted date "Jan 6, 2026"
  timestamp: number;
  durationSeconds: number;
  distanceKm: number;
  distanceMiles: number;
  avgPaceMinPerKm: number; // e.g. 6.25 -> 6:15 /km
  avgPaceMinPerMile: number; // e.g. 7.8 -> 7:48 /mi
  topSpeedKmh: number;
  steps: number;
  calories: number;
  elevationGainMeters: number;
  coordinates: GPSPoint[];
  title?: string;
  runType?: RunType;
  isPersonalBest?: boolean;
  prBadges?: string[];
}

export type ShareTemplateId = 
  | 'route-map' 
  | 'stacked-badges' 
  | 'photo-overlay' 
  | 'minimal-grid'
  | 'interval-splits'
  | 'personal-best';

export type AspectRatioType = '9:16' | '1:1' | '16:9';

export interface ColorSwatch {
  id: string;
  name: string;
  bgClass: string;
  textHex: string;
  accentHex: string;
}

export interface PersonalBestRecord {
  category: '1mi' | '5k' | '10k' | 'longest' | 'fastest_pace';
  label: string;
  valueFormatted: string;
  subLabel: string;
  runId: string;
  date: string;
  isAchieved: boolean;
}

export interface SocialShareConfig {
  templateId: ShareTemplateId;
  unit: DistanceUnit;
  aspectRatio: AspectRatioType;
  colorSwatchId: string;
  bgPhotoUrl?: string; // photo background if chosen
  photoFilter: 'none' | 'monochrome' | 'moody' | 'contrast';
  overlayPosition: 'center' | 'bottom' | 'stacked' | 'badge-inline';
  showRouteLine: boolean;
  showLocation: boolean;
  locationName?: string;
}

