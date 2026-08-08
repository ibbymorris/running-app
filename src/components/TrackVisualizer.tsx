import React from 'react';
import { motion } from 'motion/react';
import { Play, Settings2, Trophy, Navigation, ShieldCheck, Footprints, Flame } from 'lucide-react';
import { DistanceUnit } from '../types';

interface TrackVisualizerProps {
  unit: DistanceUnit;
  onUnitChange: (unit: DistanceUnit) => void;
  useSimulation: boolean;
  onToggleSimulation: (val: boolean) => void;
  onStartRun: () => void;
  weeklyProgressKm: number;
  weeklyGoalKm: number;
  onOpenHistory: () => void;
}

export const TrackVisualizer: React.FC<TrackVisualizerProps> = ({
  unit,
  onUnitChange,
  useSimulation,
  onToggleSimulation,
  onStartRun,
  weeklyProgressKm,
  weeklyGoalKm,
  onOpenHistory,
}) => {
  const displayProgress = unit === 'mi' ? (weeklyProgressKm * 0.621371).toFixed(1) : weeklyProgressKm.toFixed(1);
  const displayGoal = unit === 'mi' ? (weeklyGoalKm * 0.621371).toFixed(1) : weeklyGoalKm.toFixed(0);

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4 py-3 min-h-screen justify-between bg-stone-950 text-white font-jakarta">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pt-2 pb-1">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-700 to-red-500 flex items-center justify-center text-white font-bold font-outfit shadow-lg shadow-red-900/40">
            R
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-red-400 font-semibold font-outfit">Runbuds Track</div>
            <div className="text-sm font-bold text-stone-100">Jan · Week 2</div>
          </div>
        </div>

        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900 border border-stone-800 hover:border-red-500/50 text-xs font-semibold text-stone-300 hover:text-white transition-all shadow-sm"
        >
          <Trophy className="w-3.5 h-3.5 text-red-400" />
          <span>Activities</span>
        </button>
      </div>

      {/* Main Track Oval Visualization */}
      <div className="relative w-full aspect-[4/5] max-h-[380px] my-auto flex items-center justify-center">
        {/* Track SVG Backdrop */}
        <svg
          viewBox="0 0 320 400"
          className="w-full h-full drop-shadow-[0_0_25px_rgba(185,28,28,0.25)]"
          fill="none"
        >
          {/* Outer Stadium Glow */}
          <rect
            x="20"
            y="20"
            width="280"
            height="360"
            rx="140"
            className="stroke-red-950/60"
            strokeWidth="32"
          />

          {/* Lane 3 */}
          <rect
            x="26"
            y="26"
            width="268"
            height="348"
            rx="134"
            className="stroke-red-900/40"
            strokeWidth="4"
            strokeDasharray="8 6"
          />

          {/* Lane 2 */}
          <rect
            x="42"
            y="42"
            width="236"
            height="316"
            rx="118"
            className="stroke-red-700/60"
            strokeWidth="6"
          />

          {/* Lane 1 Main Track Red Glow */}
          <rect
            x="58"
            y="58"
            width="204"
            height="284"
            rx="102"
            className="stroke-red-600"
            strokeWidth="12"
          />

          {/* Inner Field Boundary */}
          <rect
            x="76"
            y="76"
            width="168"
            height="248"
            rx="84"
            className="stroke-stone-900 fill-stone-950"
            strokeWidth="4"
          />

          {/* Animated Runner Dot on Oval Track */}
          <motion.circle
            r="8"
            fill="#FFFFFF"
            className="drop-shadow-[0_0_12px_#EF4444]"
            animate={{
              cx: [160, 262, 262, 160, 58, 58, 160],
              cy: [58, 160, 240, 342, 240, 160, 58],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </svg>

        {/* Center Content Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
          <span className="text-[11px] font-bold uppercase tracking-widest text-red-400 font-outfit mb-1">
            Weekly Progress
          </span>
          <div className="text-4xl font-black font-outfit text-white tracking-tight">
            {displayProgress}
            <span className="text-lg font-semibold text-stone-400 ml-1 uppercase">{unit}</span>
          </div>
          <div className="text-xs text-stone-400 mt-1 font-medium">
            Goal: {displayGoal} {unit}
          </div>

          <div className="flex items-center gap-3 mt-4 pointer-events-auto">
            {/* Unit Toggle */}
            <div className="flex bg-stone-900 border border-stone-800 rounded-full p-1 text-xs">
              <button
                onClick={() => onUnitChange('km')}
                className={`px-3 py-1 rounded-full font-bold transition-all ${
                  unit === 'km' ? 'bg-red-600 text-white shadow-md' : 'text-stone-400 hover:text-white'
                }`}
              >
                KM
              </button>
              <button
                onClick={() => onUnitChange('mi')}
                className={`px-3 py-1 rounded-full font-bold transition-all ${
                  unit === 'mi' ? 'bg-red-600 text-white shadow-md' : 'text-stone-400 hover:text-white'
                }`}
              >
                MI
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Switcher & Stats Quick Peek */}
      <div className="w-full bg-stone-900/80 backdrop-blur-md border border-stone-800/80 rounded-2xl p-3.5 mb-4 shadow-xl">
        <div className="flex items-center justify-between text-xs text-stone-300">
          <div className="flex items-center gap-2">
            <Navigation className={`w-4 h-4 ${useSimulation ? 'text-amber-400' : 'text-red-400'}`} />
            <span className="font-semibold">
              {useSimulation ? 'Simulated Live Run' : 'Real Hardware GPS & Pedometer'}
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={useSimulation}
              onChange={(e) => onToggleSimulation(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>

        {useSimulation && (
          <p className="text-[11px] text-amber-300/80 mt-1.5 leading-snug">
            ✨ Simulation mode creates smooth live running coordinates & step updates automatically.
          </p>
        )}
      </div>

      {/* GO Action Button */}
      <div className="w-full pb-4 flex flex-col items-center">
        <motion.button
          onClick={onStartRun}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group w-28 h-28 rounded-full bg-gradient-to-tr from-red-700 via-red-600 to-red-500 text-white font-black text-2xl font-outfit uppercase tracking-wider flex flex-col items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.5)] border-4 border-red-400/30"
        >
          {/* Pulsing ring */}
          <span className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-20 pointer-events-none" />
          <Play className="w-7 h-7 fill-white translate-x-0.5 mb-0.5" />
          <span>GO</span>
        </motion.button>
      </div>
    </div>
  );
};
