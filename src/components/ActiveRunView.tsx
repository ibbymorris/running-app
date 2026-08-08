import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pause, Play, Map, BarChart3, Volume2, VolumeX, ShieldAlert, Footprints, Zap, Flame, Compass } from 'lucide-react';
import { DistanceUnit, GPSPoint, RunData, RunType } from '../types';
import { calculateHaversineDistanceKm, kmToMiles, formatDuration, formatPace, generateSimulatedPoints } from '../utils/geoUtils';
import { RUN_TYPE_CONFIG } from '../utils/pbUtils';
import { LeafletMap } from './LeafletMap';

interface ActiveRunViewProps {
  unit: DistanceUnit;
  useSimulation: boolean;
  onFinishRun: (run: RunData) => void;
  onCancelRun: () => void;
}

export const ActiveRunView: React.FC<ActiveRunViewProps> = ({
  unit,
  useSimulation,
  onFinishRun,
  onCancelRun,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [selectedRunType, setSelectedRunType] = useState<RunType>('short');
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [distanceKm, setDistanceKm] = useState<number>(0);

  const [steps, setSteps] = useState<number>(0);
  const [coordinates, setCoordinates] = useState<GPSPoint[]>([]);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number>(0);
  const [topSpeedKmh, setTopSpeedKmh] = useState<number>(0);
  const [elevationMeters, setElevationMeters] = useState<number>(0);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [activeMetricTab, setActiveMetricTab] = useState<number>(0); // 0: Distance, 1: Pace, 2: Steps, 3: Calories
  const [audioMuted, setAudioMuted] = useState<boolean>(false);

  // Press and hold to finish states
  const [holdProgress, setHoldProgress] = useState<number>(0); // 0 to 100
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Geo / Accel refs
  const watchIdRef = useRef<number | null>(null);
  const lastAccelRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const stepThresholdRef = useRef<number>(11.5); // Accel magnitude threshold
  const lastStepTimeRef = useRef<number>(0);

  // Timer Tick Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning) {
      timer = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning]);

  // Simulation Runner Effect
  useEffect(() => {
    if (!useSimulation || !isRunning) return;

    // Generate initial center point (e.g. London or Central Park or SF)
    if (coordinates.length === 0) {
      const initialPoints = generateSimulatedPoints(51.5074, -0.1278, 1);
      setCoordinates(initialPoints);
    }

    const interval = setInterval(() => {
      setCoordinates((prev) => {
        const last = prev.length > 0 ? prev[prev.length - 1] : { lat: 51.5074, lng: -0.1278, timestamp: Date.now() };
        // Advance slightly
        const deltaLat = (Math.random() - 0.3) * 0.00015;
        const deltaLng = (Math.random() - 0.2) * 0.00018;
        const newPt: GPSPoint = {
          lat: last.lat + deltaLat,
          lng: last.lng + deltaLng,
          timestamp: Date.now(),
          speed: 2.8 + Math.random() * 0.8,
          altitude: 15 + Math.sin(prev.length * 0.2) * 4
        };

        const addedDist = calculateHaversineDistanceKm(last.lat, last.lng, newPt.lat, newPt.lng);
        setDistanceKm((d) => d + addedDist);
        setSteps((s) => s + Math.floor(Math.random() * 3) + 2); // 2-4 steps per sec
        
        const speedKmh = (newPt.speed || 3) * 3.6;
        setCurrentSpeedKmh(speedKmh);
        setTopSpeedKmh((top) => Math.max(top, speedKmh));
        setElevationMeters((e) => e + (Math.random() > 0.7 ? 1 : 0));

        return [...prev, newPt];
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [useSimulation, isRunning, coordinates.length]);

  // Real Hardware GPS Location Listener
  useEffect(() => {
    if (useSimulation || !isRunning || !('geolocation' in navigator)) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPt: GPSPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: pos.timestamp,
          altitude: pos.coords.altitude,
          speed: pos.coords.speed,
        };

        setCoordinates((prev) => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const addedDist = calculateHaversineDistanceKm(last.lat, last.lng, newPt.lat, newPt.lng);
            // Ignore minor GPS jitter (< 2 meters)
            if (addedDist > 0.002) {
              setDistanceKm((d) => d + addedDist);
            }
          }
          return [...prev, newPt];
        });

        if (pos.coords.speed) {
          const speedKmh = pos.coords.speed * 3.6;
          setCurrentSpeedKmh(speedKmh);
          setTopSpeedKmh((top) => Math.max(top, speedKmh));
        }
      },
      (err) => {
        console.warn('GPS Warning:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [useSimulation, isRunning]);

  // Real Hardware Device Motion / Accelerometer Pedometer
  useEffect(() => {
    if (useSimulation || !isRunning || typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return;

    const handleMotion = (event: DeviceMotionEvent) => {
      if (!event.accelerationIncludingGravity) return;
      const { x, y, z } = event.accelerationIncludingGravity;
      if (x === null || y === null || z === null) return;

      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      // Simple peak detection for step counting with debouncing (>300ms)
      if (magnitude > stepThresholdRef.current && now - lastStepTimeRef.current > 320) {
        setSteps((s) => s + 1);
        lastStepTimeRef.current = now;
      }
      lastAccelRef.current = { x, y, z };
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [useSimulation, isRunning]);

  // Computed metrics
  const displayDist = unit === 'mi' ? kmToMiles(distanceKm) : distanceKm;
  const avgPaceMinPerKm = distanceKm > 0.01 ? durationSeconds / 60 / distanceKm : 0;
  const avgPaceMinPerMile = distanceKm > 0.01 ? durationSeconds / 60 / kmToMiles(distanceKm) : 0;
  const currentPace = unit === 'mi' ? avgPaceMinPerMile : avgPaceMinPerKm;
  const calories = Math.round(distanceKm * 65); // Approx ~65 kcal per km

  // Press and hold handler for ending run
  const startHold = () => {
    setHoldProgress(0);
    const startTime = Date.now();
    const duration = 1500; // 1.5 seconds hold

    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setHoldProgress(pct);

      if (pct >= 100) {
        clearInterval(holdTimerRef.current as NodeJS.Timeout);
        triggerFinish();
      }
    }, 30);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(0);
  };

  const triggerFinish = () => {
    const runTypeMeta = RUN_TYPE_CONFIG[selectedRunType];
    const finalRun: RunData = {
      id: `run-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timestamp: Date.now(),
      durationSeconds: Math.max(1, durationSeconds),
      distanceKm,
      distanceMiles: kmToMiles(distanceKm),
      avgPaceMinPerKm: avgPaceMinPerKm || 6.0,
      avgPaceMinPerMile: avgPaceMinPerMile || 7.5,
      topSpeedKmh: Math.max(topSpeedKmh, 12),
      steps: Math.max(steps, Math.floor(distanceKm * 1300)),
      calories: Math.max(calories, 20),
      elevationGainMeters: elevationMeters || 12,
      coordinates: coordinates.length > 0 ? coordinates : generateSimulatedPoints(51.5074, -0.1278, 25),
      title: `${runTypeMeta.label}`,
      runType: selectedRunType,
    };

    onFinishRun(finalRun);
  };

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-md mx-auto h-screen p-4 bg-stone-950 text-white font-jakarta select-none overflow-hidden">
      {/* Top Header Controls */}
      <div className="w-full flex items-center justify-between pt-2">
        <button
          onClick={() => setShowMap(!showMap)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold transition-all shadow-md ${
            showMap
              ? 'bg-red-600 border-red-500 text-white'
              : 'bg-stone-900 border-stone-800 text-stone-300 hover:text-white'
          }`}
        >
          <Map className="w-4 h-4" />
          <span>{showMap ? 'Show Metrics' : 'Live Map'}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/80 border border-red-800/80 text-[11px] font-bold text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </span>

          <button
            onClick={() => setAudioMuted(!audioMuted)}
            className="p-2 rounded-full bg-stone-900 border border-stone-800 text-stone-300 hover:text-white transition-all"
          >
            {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Run Type Selector Pills */}
      <div className="w-full flex items-center justify-start gap-1.5 overflow-x-auto py-2 no-scrollbar">
        {(Object.keys(RUN_TYPE_CONFIG) as RunType[]).map((typeKey) => {
          const cfg = RUN_TYPE_CONFIG[typeKey];
          const isSelected = selectedRunType === typeKey;
          return (
            <button
              key={typeKey}
              onClick={() => setSelectedRunType(typeKey)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold font-outfit whitespace-nowrap transition-all flex items-center gap-1 border ${
                isSelected
                  ? 'bg-red-600 border-red-500 text-white shadow-md'
                  : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              <span>{cfg.icon}</span>
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main View Area: Either Leaflet Map OR Clean Metric Focus */}
      <div className="w-full flex-1 flex flex-col justify-center my-auto py-2">
        {showMap ? (
          <div className="w-full h-full max-h-[380px] rounded-3xl overflow-hidden border border-stone-800 shadow-2xl relative">
            <LeafletMap coordinates={coordinates} isLive={true} />
            <div className="absolute top-3 left-3 z-[20] bg-stone-950/90 backdrop-blur-md border border-stone-800/80 px-3 py-1.5 rounded-full text-xs font-bold font-outfit text-white shadow-lg">
              {displayDist.toFixed(2)} {unit.toUpperCase()}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-4">
            {/* Live Timer readout */}
            <div className="text-stone-400 text-xs font-bold tracking-widest uppercase mb-1 font-outfit flex items-center gap-1.5">
              <span>ELAPSED TIME</span>
            </div>
            <div className="text-5xl font-extrabold font-outfit tracking-tight text-stone-100 mb-6">
              {formatDuration(durationSeconds)}
            </div>

            {/* Dynamic Metric Carousel / Tab Switcher */}
            <div className="relative w-full max-w-xs flex flex-col items-center">
              <AnimatePresence mode="wait">
                {activeMetricTab === 0 && (
                  <motion.div
                    key="distance"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 font-outfit mb-1">
                      Distance
                    </span>
                    <div className="text-7xl font-black font-outfit text-white tracking-tighter leading-none">
                      {displayDist.toFixed(2)}
                    </div>
                    <span className="text-lg font-bold text-stone-400 mt-1 uppercase font-outfit">
                      {unit}
                    </span>
                  </motion.div>
                )}

                {activeMetricTab === 1 && (
                  <motion.div
                    key="pace"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 font-outfit mb-1">
                      Average Pace
                    </span>
                    <div className="text-6xl font-black font-outfit text-white tracking-tighter leading-none">
                      {formatPace(currentPace, unit).split(' ')[0]}
                    </div>
                    <span className="text-sm font-bold text-stone-400 mt-2 uppercase font-outfit">
                      /{unit}
                    </span>
                  </motion.div>
                )}

                {activeMetricTab === 2 && (
                  <motion.div
                    key="steps"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 font-outfit mb-1">
                      Steps Counted
                    </span>
                    <div className="text-6xl font-black font-outfit text-white tracking-tighter leading-none">
                      {steps.toLocaleString()}
                    </div>
                    <span className="text-sm font-bold text-stone-400 mt-2 uppercase font-outfit">
                      STEPS
                    </span>
                  </motion.div>
                )}

                {activeMetricTab === 3 && (
                  <motion.div
                    key="calories"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 font-outfit mb-1">
                      Calories Burned
                    </span>
                    <div className="text-6xl font-black font-outfit text-white tracking-tighter leading-none">
                      {calories}
                    </div>
                    <span className="text-sm font-bold text-stone-400 mt-2 uppercase font-outfit">
                      KCAL
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Indicator Dots */}
              <div className="flex items-center gap-2 mt-6">
                {[0, 1, 2, 3].map((tabIdx) => (
                  <button
                    key={tabIdx}
                    onClick={() => setActiveMetricTab(tabIdx)}
                    className={`h-2 rounded-full transition-all ${
                      activeMetricTab === tabIdx ? 'w-6 bg-red-500' : 'w-2 bg-stone-800 hover:bg-stone-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Secondary Metrics Bar */}
      <div className="w-full grid grid-cols-3 gap-2 bg-stone-900/90 border border-stone-800/80 rounded-2xl p-3 shadow-xl mb-4">
        <div className="flex flex-col items-center text-center border-r border-stone-800">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-stone-400 mb-0.5">
            <Zap className="w-3 h-3 text-red-400" />
            <span>Pace</span>
          </div>
          <div className="text-base font-bold font-outfit text-stone-100">
            {formatPace(currentPace, unit).split(' ')[0]}
          </div>
        </div>

        <div className="flex flex-col items-center text-center border-r border-stone-800">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-stone-400 mb-0.5">
            <Footprints className="w-3 h-3 text-red-400" />
            <span>Steps</span>
          </div>
          <div className="text-base font-bold font-outfit text-stone-100">
            {steps}
          </div>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-stone-400 mb-0.5">
            <Flame className="w-3 h-3 text-red-400" />
            <span>Calories</span>
          </div>
          <div className="text-base font-bold font-outfit text-stone-100">
            {calories} kcal
          </div>
        </div>
      </div>

      {/* Action Controls: Pause / Play & Hold to End */}
      <div className="w-full flex items-center justify-center gap-6 pb-4">
        {/* Pause/Resume button */}
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-white transition-all shadow-lg border ${
            isRunning
              ? 'bg-stone-900 border-stone-800 hover:bg-stone-800'
              : 'bg-emerald-600 border-emerald-500 hover:bg-emerald-500'
          }`}
        >
          {isRunning ? <Pause className="w-7 h-7 fill-white" /> : <Play className="w-7 h-7 fill-white translate-x-0.5" />}
        </button>

        {/* Press and Hold to Finish Button */}
        <div className="relative">
          <button
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-red-700 to-red-500 border-2 border-red-400/40 text-white font-extrabold text-xs font-outfit uppercase tracking-wider flex flex-col items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.4)] active:scale-95 transition-all overflow-hidden"
          >
            {/* Fill progress layer */}
            <div
              className="absolute inset-0 bg-stone-950/80 transition-all duration-75 origin-bottom"
              style={{ height: `${100 - holdProgress}%` }}
            />
            <span className="relative z-10 text-[11px] font-black text-center leading-tight">
              HOLD TO<br />FINISH
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
