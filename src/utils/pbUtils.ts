import { RunData, DistanceUnit, PersonalBestRecord, RunType } from '../types';
import { formatDuration, formatPace, kmToMiles } from './geoUtils';

export const RUN_TYPE_CONFIG: Record<RunType, { label: string; icon: string; colorClass: string; bgClass: string }> = {
  short: {
    label: 'Short Jog',
    icon: '⚡',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-950/80 border-emerald-800/80',
  },
  long: {
    label: 'Long Run',
    icon: '🏃',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-950/80 border-amber-800/80',
  },
  interval: {
    label: 'Interval Session',
    icon: '🔥',
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-950/80 border-purple-800/80',
  },
  tempo: {
    label: 'Tempo Run',
    icon: '⚡',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-950/80 border-blue-800/80',
  },
  race: {
    label: 'Race Day',
    icon: '🏆',
    colorClass: 'text-red-400',
    bgClass: 'bg-red-950/80 border-red-800/80',
  },
};

/**
 * Calculates personal bests across all completed runs history
 */
export function calculatePersonalBests(runs: RunData[], unit: DistanceUnit): PersonalBestRecord[] {
  let best1Mi: { run: RunData; pace: number } | null = null;
  let best5k: { run: RunData; time: number } | null = null;
  let best10k: { run: RunData; time: number } | null = null;
  let longestRun: RunData | null = null;
  let fastestPaceRun: RunData | null = null;

  runs.forEach((r) => {
    // Check longest distance
    if (!longestRun || r.distanceKm > longestRun.distanceKm) {
      longestRun = r;
    }

    // Check fastest average pace
    const pace = unit === 'mi' ? r.avgPaceMinPerMile : r.avgPaceMinPerKm;
    if (r.distanceKm >= 0.5 && pace > 0) {
      if (!fastestPaceRun) {
        fastestPaceRun = r;
      } else {
        const currentBestPace = unit === 'mi' ? fastestPaceRun.avgPaceMinPerMile : fastestPaceRun.avgPaceMinPerKm;
        if (pace < currentBestPace) {
          fastestPaceRun = r;
        }
      }
    }

    // 1 Mile best (at least 1.6 km)
    if (r.distanceKm >= 1.6) {
      const pace1mi = r.avgPaceMinPerMile;
      if (!best1Mi || pace1mi < best1Mi.pace) {
        best1Mi = { run: r, pace: pace1mi };
      }
    }

    // 5K best (at least 5.0 km)
    if (r.distanceKm >= 5.0) {
      // estimated time for 5k based on pace
      const time5k = r.avgPaceMinPerKm * 5.0 * 60;
      if (!best5k || time5k < best5k.time) {
        best5k = { run: r, time: time5k };
      }
    }

    // 10K best (at least 10.0 km)
    if (r.distanceKm >= 10.0) {
      const time10k = r.avgPaceMinPerKm * 10.0 * 60;
      if (!best10k || time10k < best10k.time) {
        best10k = { run: r, time: time10k };
      }
    }
  });

  return [
    {
      category: '1mi',
      label: 'Fastest 1 Mile',
      valueFormatted: best1Mi ? formatPace(best1Mi.pace, 'mi') : '---',
      subLabel: best1Mi ? `${formatDuration(best1Mi.pace * 60)} pace` : 'Run 1 mi to unlock',
      runId: best1Mi ? best1Mi.run.id : '',
      date: best1Mi ? best1Mi.run.date : '',
      isAchieved: !!best1Mi,
    },
    {
      category: '5k',
      label: 'Fastest 5K',
      valueFormatted: best5k ? formatDuration(best5k.time) : '---',
      subLabel: best5k ? `${formatPace(best5k.run.avgPaceMinPerKm, 'km')} pace` : 'Run 5 km to unlock',
      runId: best5k ? best5k.run.id : '',
      date: best5k ? best5k.run.date : '',
      isAchieved: !!best5k,
    },
    {
      category: '10k',
      label: 'Fastest 10K',
      valueFormatted: best10k ? formatDuration(best10k.time) : '---',
      subLabel: best10k ? `${formatPace(best10k.run.avgPaceMinPerKm, 'km')} pace` : 'Run 10 km to unlock',
      runId: best10k ? best10k.run.id : '',
      date: best10k ? best10k.run.date : '',
      isAchieved: !!best10k,
    },
    {
      category: 'longest',
      label: 'Longest Distance',
      valueFormatted: longestRun
        ? `${(unit === 'mi' ? kmToMiles(longestRun.distanceKm) : longestRun.distanceKm).toFixed(2)} ${unit.toUpperCase()}`
        : '---',
      subLabel: longestRun ? formatDuration(longestRun.durationSeconds) : 'No runs logged',
      runId: longestRun ? longestRun.id : '',
      date: longestRun ? longestRun.date : '',
      isAchieved: !!longestRun,
    },
    {
      category: 'fastest_pace',
      label: 'Best Avg Pace',
      valueFormatted: fastestPaceRun
        ? formatPace(unit === 'mi' ? fastestPaceRun.avgPaceMinPerMile : fastestPaceRun.avgPaceMinPerKm, unit)
        : '---',
      subLabel: fastestPaceRun
        ? `${(unit === 'mi' ? kmToMiles(fastestPaceRun.distanceKm) : fastestPaceRun.distanceKm).toFixed(2)} ${unit}`
        : 'No runs logged',
      runId: fastestPaceRun ? fastestPaceRun.id : '',
      date: fastestPaceRun ? fastestPaceRun.date : '',
      isAchieved: !!fastestPaceRun,
    },
  ];
}
