import React, { useState } from 'react';
import { X, Trophy, Share2, Calendar, Footprints, Flame, ChevronRight, Trash2, Medal, Zap, Award, History } from 'lucide-react';
import { RunData, DistanceUnit } from '../types';
import { formatDuration, formatPace, kmToMiles, pointsToSvgPath } from '../utils/geoUtils';
import { calculatePersonalBests, RUN_TYPE_CONFIG } from '../utils/pbUtils';

interface ActivityHistoryModalProps {
  runs: RunData[];
  unit: DistanceUnit;
  onClose: () => void;
  onSelectShare: (run: RunData) => void;
  onClearHistory: () => void;
}

export const ActivityHistoryModal: React.FC<ActivityHistoryModalProps> = ({
  runs,
  unit,
  onClose,
  onSelectShare,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'workouts' | 'records'>('workouts');

  const totalKm = runs.reduce((acc, r) => acc + r.distanceKm, 0);
  const totalDist = unit === 'mi' ? kmToMiles(totalKm) : totalKm;
  const totalSteps = runs.reduce((acc, r) => acc + r.steps, 0);

  const personalBests = calculatePersonalBests(runs, unit);

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-xl flex flex-col justify-between overflow-y-auto text-white font-jakarta">
      {/* Header */}
      <div className="w-full max-w-lg mx-auto p-4 flex items-center justify-between border-b border-stone-800 bg-stone-950/90 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-black font-outfit text-white">Activities & Records</h2>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full bg-stone-900 border border-stone-800 hover:border-red-500 text-stone-300 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="w-full max-w-md mx-auto p-4 flex-1 flex flex-col gap-4">
        {/* Cumulative Stats Banner */}
        <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 border border-stone-800 rounded-3xl p-4 flex items-center justify-around text-center shadow-xl">
          <div>
            <div className="text-[10px] font-bold text-stone-400 uppercase font-outfit">Total Distance</div>
            <div className="text-2xl font-black font-outfit text-white">
              {totalDist.toFixed(1)} <span className="text-xs text-red-400 uppercase">{unit}</span>
            </div>
          </div>

          <div className="h-8 w-px bg-stone-800" />

          <div>
            <div className="text-[10px] font-bold text-stone-400 uppercase font-outfit font-semibold">Total Runs</div>
            <div className="text-2xl font-black font-outfit text-white">{runs.length}</div>
          </div>

          <div className="h-8 w-px bg-stone-800" />

          <div>
            <div className="text-[10px] font-bold text-stone-400 uppercase font-outfit">Total Steps</div>
            <div className="text-2xl font-black font-outfit text-white">{totalSteps.toLocaleString()}</div>
          </div>
        </div>

        {/* Tab Switcher: Workouts vs Records */}
        <div className="flex bg-stone-900 border border-stone-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('workouts')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold font-outfit flex items-center justify-center gap-2 transition-all ${
              activeTab === 'workouts'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Workouts Log ({runs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold font-outfit flex items-center justify-center gap-2 transition-all ${
              activeTab === 'records'
                ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Medal className="w-3.5 h-3.5 text-amber-400" />
            <span>Personal Bests</span>
          </button>
        </div>

        {/* TAB 1: WORKOUTS LOG */}
        {activeTab === 'workouts' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-bold text-stone-400 uppercase tracking-wider font-outfit px-1">
              <span>Completed Workouts</span>
              {runs.length > 0 && (
                <button
                  onClick={onClearHistory}
                  className="text-stone-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {runs.length === 0 ? (
              <div className="text-center py-12 text-stone-500 text-sm bg-stone-900/50 rounded-3xl border border-stone-800/60 p-6">
                No runs recorded yet! Tap <strong className="text-stone-300">GO</strong> on the track view to record your first run.
              </div>
            ) : (
              runs.map((run) => {
                const d = unit === 'mi' ? run.distanceMiles : run.distanceKm;
                const p = unit === 'mi' ? run.avgPaceMinPerMile : run.avgPaceMinPerKm;
                const { path } = pointsToSvgPath(run.coordinates, 80, 60, 8);
                const runTypeMeta = RUN_TYPE_CONFIG[run.runType || 'short'];

                return (
                  <div
                    key={run.id}
                    className="bg-stone-900/90 border border-stone-800 hover:border-red-900/80 rounded-2xl p-3.5 flex items-center justify-between transition-all group"
                  >
                    {/* Route Vector Mini Thumbnail */}
                    <div className="w-16 h-14 bg-stone-950 rounded-xl border border-stone-800/80 p-1 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 80 60" className="w-full h-full">
                        <path d={path} fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    </div>

                    {/* Stats Info */}
                    <div className="flex-1 px-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black font-outfit text-white">
                          {d.toFixed(2)} {unit.toUpperCase()}
                        </span>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${runTypeMeta.bgClass} ${runTypeMeta.colorClass}`}>
                          {runTypeMeta.icon} {runTypeMeta.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-stone-400 mt-1 font-outfit">
                        <span>{run.date}</span>
                        <span>•</span>
                        <span>{formatDuration(run.durationSeconds)}</span>
                        <span>•</span>
                        <span>{formatPace(p, unit).split(' ')[0]} /{unit}</span>
                      </div>
                    </div>

                    {/* Share Action */}
                    <button
                      onClick={() => onSelectShare(run)}
                      className="p-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-400 hover:text-white transition-all shrink-0"
                      title="Generate Social Post"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: PERSONAL BESTS (PBs / RECORDS) */}
        {activeTab === 'records' && (
          <div className="flex flex-col gap-3">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider font-outfit px-1 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Personal Bests & Trophies</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {personalBests.map((record) => {
                const targetRun = runs.find((r) => r.id === record.runId);

                return (
                  <div
                    key={record.category}
                    className={`rounded-2xl p-4 border flex items-center justify-between transition-all shadow-lg ${
                      record.isAchieved
                        ? 'bg-gradient-to-r from-stone-900 via-amber-950/20 to-stone-900 border-amber-500/40'
                        : 'bg-stone-900/50 border-stone-800/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl ${record.isAchieved ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-stone-800 text-stone-500'}`}>
                        <Trophy className="w-6 h-6" />
                      </div>

                      <div>
                        <div className="text-xs font-bold text-stone-400 uppercase font-outfit">
                          {record.label}
                        </div>
                        <div className="text-2xl font-black font-outfit text-white tracking-tight">
                          {record.valueFormatted}
                        </div>
                        <div className="text-[11px] text-stone-400 mt-0.5">
                          {record.subLabel} {record.date && `• ${record.date}`}
                        </div>
                      </div>
                    </div>

                    {record.isAchieved && targetRun && (
                      <button
                        onClick={() => onSelectShare(targetRun)}
                        className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs font-outfit flex items-center gap-1.5 transition-all shadow-md shrink-0"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share PR</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
