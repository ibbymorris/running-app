import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';
import { Share2, Home, Trophy, Flame, Footprints, Zap, Clock, Compass, ArrowRight } from 'lucide-react';
import { RunData, DistanceUnit } from '../types';
import { formatDuration, formatPace, pointsToSvgPath, kmToMiles } from '../utils/geoUtils';

interface RunSummaryViewProps {
  run: RunData;
  unit: DistanceUnit;
  onOpenShareModal: () => void;
  onBackToTrack: () => void;
}

export const RunSummaryView: React.FC<RunSummaryViewProps> = ({
  run,
  unit,
  onOpenShareModal,
  onBackToTrack,
}) => {
  useEffect(() => {
    // Fire celebratory confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#EF4444', '#DC2626', '#991B1B', '#FFFFFF', '#F59E0B']
    });
  }, []);

  const displayDistance = unit === 'mi' ? run.distanceMiles : run.distanceKm;
  const paceVal = unit === 'mi' ? run.avgPaceMinPerMile : run.avgPaceMinPerKm;
  const speedVal = unit === 'mi' ? kmToMiles(run.topSpeedKmh) : run.topSpeedKmh;

  const { path } = pointsToSvgPath(run.coordinates, 280, 180, 20);

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-md mx-auto min-h-screen p-4 bg-stone-950 text-white font-jakarta overflow-y-auto">
      {/* Top Header */}
      <div className="w-full text-center pt-2 pb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/80 text-xs font-bold text-red-400 font-outfit uppercase tracking-widest mb-2">
          <Trophy className="w-3.5 h-3.5" />
          <span>RUN COMPLETED</span>
        </div>
        <h1 className="text-2xl font-black font-outfit text-stone-100">{run.title || 'Outdoor Workout'}</h1>
        <p className="text-xs text-stone-400 mt-0.5">{run.date}</p>
      </div>

      {/* Vector Route Artwork Card */}
      <div className="w-full bg-gradient-to-br from-stone-900 to-stone-950 border border-stone-800 rounded-3xl p-4 shadow-2xl relative overflow-hidden my-2">
        {/* Subtle background glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-red-600/15 blur-2xl pointer-events-none" />

        <div className="w-full h-44 flex items-center justify-center relative">
          <svg viewBox="0 0 280 180" className="w-full h-full drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
            <path
              d={path}
              fill="none"
              stroke="#EF4444"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Major Banner Metrics */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-800/80">
          <div>
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider font-outfit">
              Distance
            </div>
            <div className="text-3xl font-black font-outfit text-white">
              {displayDistance.toFixed(2)}{' '}
              <span className="text-xs font-bold text-red-400 uppercase">{unit}</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider font-outfit">
              Duration
            </div>
            <div className="text-3xl font-black font-outfit text-white">
              {formatDuration(run.durationSeconds)}
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Metric Grid */}
      <div className="w-full grid grid-cols-2 gap-2.5 my-3">
        <div className="bg-stone-900/80 border border-stone-800/80 p-3 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-950 text-red-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-stone-400 uppercase">Avg Pace</div>
            <div className="text-base font-extrabold font-outfit text-stone-100">
              {formatPace(paceVal, unit).split(' ')[0]} <span className="text-xs text-stone-400">/{unit}</span>
            </div>
          </div>
        </div>

        <div className="bg-stone-900/80 border border-stone-800/80 p-3 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-950 text-red-400">
            <Footprints className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-stone-400 uppercase">Total Steps</div>
            <div className="text-base font-extrabold font-outfit text-stone-100">
              {run.steps.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-stone-900/80 border border-stone-800/80 p-3 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-950 text-red-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-stone-400 uppercase">Calories</div>
            <div className="text-base font-extrabold font-outfit text-stone-100">
              {run.calories} kcal
            </div>
          </div>
        </div>

        <div className="bg-stone-900/80 border border-stone-800/80 p-3 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-950 text-red-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-stone-400 uppercase">Top Speed</div>
            <div className="text-base font-extrabold font-outfit text-stone-100">
              {speedVal.toFixed(1)} <span className="text-xs text-stone-400">{unit === 'mi' ? 'mph' : 'km/h'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="w-full flex flex-col gap-3 pt-2 pb-4">
        <motion.button
          onClick={onOpenShareModal}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white font-extrabold text-base font-outfit uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(220,38,38,0.4)] border border-red-400/40"
        >
          <Share2 className="w-5 h-5" />
          <span>Share to Social Media</span>
          <ArrowRight className="w-5 h-5 ml-auto" />
        </motion.button>

        <button
          onClick={onBackToTrack}
          className="w-full py-3 px-6 rounded-2xl bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-white font-bold text-sm font-outfit flex items-center justify-center gap-2 transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Back to Track Dashboard</span>
        </button>
      </div>
    </div>
  );
};
