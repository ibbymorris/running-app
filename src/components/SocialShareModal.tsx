import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  Image as ImageIcon,
  Palette,
  Layout,
  Maximize2,
  Sparkles,
  Upload,
  Trophy,
  CheckCircle2,
  MapPin,
  Flame,
  Zap,
  Medal,
  Award,
  Activity,
} from 'lucide-react';
import {
  RunData,
  DistanceUnit,
  ShareTemplateId,
  AspectRatioType,
  RunType,
} from '../types';
import {
  formatDuration,
  formatPace,
  pointsToSvgPath,
  kmToMiles,
  STOCK_RUNNER_PHOTOS,
  COLOR_SWATCHES,
} from '../utils/geoUtils';
import { RUN_TYPE_CONFIG } from '../utils/pbUtils';

interface SocialShareModalProps {
  run: RunData;
  unit: DistanceUnit;
  onClose: () => void;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  run,
  unit,
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Customization States
  const [templateId, setTemplateId] = useState<ShareTemplateId>('route-map');
  const [runType, setRunType] = useState<RunType>(run.runType || 'short');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('9:16');
  const [colorSwatchId, setColorSwatchId] = useState<string>('crimson');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>(STOCK_RUNNER_PHOTOS[0].url);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null);
  const [photoFilter, setPhotoFilter] = useState<'none' | 'monochrome' | 'moody'>('none');
  const [displayUnit, setDisplayUnit] = useState<DistanceUnit>(unit);
  const [locationName, setLocationName] = useState<string>('Central Park Loop');
  const [prTag, setPrTag] = useState<string>(run.distanceKm >= 5 ? '5K Personal Record' : 'Personal Record');

  // Export States
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const activeSwatch = COLOR_SWATCHES.find((s) => s.id === colorSwatchId) || COLOR_SWATCHES[0];
  const bgPhoto = customPhotoUrl || selectedPhotoUrl;

  const distVal = displayUnit === 'mi' ? run.distanceMiles : run.distanceKm;
  const paceVal = displayUnit === 'mi' ? run.avgPaceMinPerMile : run.avgPaceMinPerKm;

  const runTypeMeta = RUN_TYPE_CONFIG[runType];

  // Generate SVG Route Path
  const { path } = pointsToSvgPath(
    run.coordinates,
    aspectRatio === '9:16' ? 320 : aspectRatio === '1:1' ? 300 : 400,
    aspectRatio === '9:16' ? 240 : aspectRatio === '1:1' ? 180 : 160,
    28
  );

  // Custom File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomPhotoUrl(event.target.result as string);
          setTemplateId('photo-overlay');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Export Card as Image PNG
  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Runbuds-Run-${run.date.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Web Share API or Clipboard Copy
  const handleNativeShare = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'runbuds-stats.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Runbuds Run Stats',
          text: `Crushed a ${distVal.toFixed(2)} ${displayUnit} ${runTypeMeta.label} in ${formatDuration(run.durationSeconds)}! #Runbuds`,
        });
      } else {
        handleDownload();
      }
    } catch (err) {
      console.error('Share error:', err);
      handleDownload();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-xl flex flex-col justify-between overflow-y-auto text-white font-jakarta">
      {/* Header Modal Bar */}
      <div className="w-full max-w-lg mx-auto p-4 flex items-center justify-between border-b border-stone-800/80 bg-stone-950/80 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-black font-outfit text-white">Social Post Generator</h2>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full bg-stone-900 border border-stone-800 hover:border-red-500 text-stone-300 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="w-full max-w-md mx-auto p-4 flex flex-col items-center flex-1 justify-center">
        {/* PREVIEW CANVAS AREA */}
        <div className="w-full flex items-center justify-center my-2 py-2">
          <div
            ref={cardRef}
            className={`relative overflow-hidden shadow-2xl transition-all duration-300 rounded-3xl flex flex-col justify-between p-6 ${
              aspectRatio === '9:16'
                ? 'w-[280px] h-[480px]'
                : aspectRatio === '1:1'
                ? 'w-[320px] h-[320px]'
                : 'w-[340px] h-[200px]'
            } ${
              templateId === 'personal-best'
                ? 'bg-gradient-to-br from-amber-950 via-stone-900 to-stone-950 border-2 border-amber-500/60'
                : templateId !== 'photo-overlay'
                ? activeSwatch.bgClass
                : 'bg-stone-900'
            }`}
          >
            {/* PHOTO BACKGROUND LAYER IF PHOTO TEMPLATE */}
            {templateId === 'photo-overlay' && (
              <div className="absolute inset-0 z-0">
                <img
                  src={bgPhoto}
                  alt="Runner background"
                  className={`w-full h-full object-cover ${
                    photoFilter === 'monochrome'
                      ? 'grayscale contrast-125'
                      : photoFilter === 'moody'
                      ? 'brightness-75 contrast-125'
                      : ''
                  }`}
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />
              </div>
            )}

            {/* BRAND BADGE HEADER */}
            <div className="relative z-10 flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white font-extrabold text-[10px] font-outfit tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                RUNBUDS
              </div>

              <div className="flex items-center gap-1">
                <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold text-white font-outfit flex items-center gap-1">
                  <span>{runTypeMeta.icon}</span>
                  <span>{runTypeMeta.label}</span>
                </span>
              </div>
            </div>

            {/* TEMPLATE CONTENT VARIATIONS */}

            {/* 1. ROUTE MAP TEMPLATE */}
            {templateId === 'route-map' && (
              <div className="relative z-10 flex-1 flex flex-col justify-between py-2">
                <div className="w-full h-full flex items-center justify-center my-auto">
                  <svg
                    viewBox={`0 0 ${aspectRatio === '9:16' ? 320 : 300} ${
                      aspectRatio === '9:16' ? 240 : 180
                    }`}
                    className="w-full h-full max-h-[180px] drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                  >
                    <path
                      d={path}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div className="w-full pt-2 border-t border-white/20 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider font-bold opacity-80">TIME</div>
                    <div className="text-xl font-black font-outfit leading-tight">
                      {formatDuration(run.durationSeconds)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider font-bold opacity-80">DIST</div>
                    <div className="text-xl font-black font-outfit leading-tight">
                      {distVal.toFixed(2)} <span className="text-[10px]">{displayUnit}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider font-bold opacity-80">PACE</div>
                    <div className="text-xl font-black font-outfit leading-tight">
                      {formatPace(paceVal, displayUnit).split(' ')[0]}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. STACKED BADGES TEMPLATE */}
            {templateId === 'stacked-badges' && (
              <div className="relative z-10 flex-1 flex flex-col justify-center gap-2.5 my-auto">
                <div className="bg-white text-stone-950 px-4 py-2 rounded-2xl shadow-lg -rotate-1 transform flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-600 font-outfit">DURATION</span>
                  <span className="text-2xl font-black font-outfit">{formatDuration(run.durationSeconds)}</span>
                </div>

                <div className="bg-black/80 backdrop-blur-md text-white border border-white/20 px-4 py-2 rounded-2xl shadow-lg rotate-1 transform flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-400 font-outfit">DISTANCE</span>
                  <span className="text-2xl font-black font-outfit">
                    {distVal.toFixed(2)} <span className="text-xs uppercase">{displayUnit}</span>
                  </span>
                </div>

                <div className="bg-red-600 text-white px-4 py-2 rounded-2xl shadow-lg -rotate-1 transform flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/80 font-outfit font-bold">AVG PACE</span>
                  <span className="text-2xl font-black font-outfit">{formatPace(paceVal, displayUnit).split(' ')[0]}</span>
                </div>
              </div>
            )}

            {/* 3. PHOTO OVERLAY TEMPLATE */}
            {templateId === 'photo-overlay' && (
              <div className="relative z-10 flex-1 flex flex-col justify-end py-2">
                <div className="bg-black/60 backdrop-blur-md border border-white/20 p-3.5 rounded-2xl shadow-2xl">
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10">
                    <span className="text-xs font-black uppercase font-outfit tracking-wider text-red-400">
                      {runTypeMeta.label.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-bold text-stone-300">{run.steps} steps</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-white">
                    <div>
                      <div className="text-[9px] uppercase font-bold text-stone-300">DISTANCE</div>
                      <div className="text-lg font-black font-outfit">
                        {distVal.toFixed(2)} <span className="text-[10px]">{displayUnit}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-bold text-stone-300">TIME</div>
                      <div className="text-lg font-black font-outfit">{formatDuration(run.durationSeconds)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-bold text-stone-300">PACE</div>
                      <div className="text-lg font-black font-outfit">{formatPace(paceVal, displayUnit).split(' ')[0]}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. MINIMAL GRID TEMPLATE */}
            {templateId === 'minimal-grid' && (
              <div className="relative z-10 flex-1 flex flex-col justify-between py-4">
                <div className="text-center my-auto">
                  <div className="text-[10px] font-bold tracking-widest text-white/70 uppercase">TOTAL DISTANCE</div>
                  <div className="text-5xl font-black font-outfit tracking-tighter my-1">
                    {distVal.toFixed(2)}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest opacity-80">{displayUnit}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-black/30 backdrop-blur-sm p-2.5 rounded-2xl border border-white/10 text-center">
                  <div>
                    <div className="text-[9px] font-bold opacity-70">DURATION</div>
                    <div className="text-base font-black font-outfit">{formatDuration(run.durationSeconds)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold opacity-70">PACE</div>
                    <div className="text-base font-black font-outfit">{formatPace(paceVal, displayUnit).split(' ')[0]}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. INTERVAL SPLITS TEMPLATE */}
            {templateId === 'interval-splits' && (
              <div className="relative z-10 flex-1 flex flex-col justify-between py-2">
                <div className="flex flex-col items-center justify-center my-auto text-center">
                  <div className="px-3 py-1 rounded-full bg-purple-900/80 border border-purple-500/50 text-purple-200 text-[10px] font-black uppercase tracking-widest mb-2 font-outfit">
                    🔥 INTERVAL WORKOUT
                  </div>
                  <div className="text-4xl font-black font-outfit tracking-tight text-white mb-1">
                    {distVal.toFixed(2)} {displayUnit.toUpperCase()}
                  </div>
                  <div className="text-xs text-stone-200 font-bold">
                    Avg Pace: {formatPace(paceVal, displayUnit)}
                  </div>
                </div>

                {/* Split Laps Sample */}
                <div className="bg-black/50 backdrop-blur-md rounded-2xl p-2.5 border border-white/15 grid grid-cols-3 gap-1 text-center text-[10px] font-outfit font-bold">
                  <div className="bg-white/10 p-1.5 rounded-xl">
                    <div className="text-stone-300">LAP 1</div>
                    <div className="text-white text-xs font-black">5:45/km</div>
                  </div>
                  <div className="bg-white/10 p-1.5 rounded-xl">
                    <div className="text-stone-300">LAP 2</div>
                    <div className="text-white text-xs font-black">5:30/km</div>
                  </div>
                  <div className="bg-white/10 p-1.5 rounded-xl">
                    <div className="text-stone-300">LAP 3</div>
                    <div className="text-white text-xs font-black">5:15/km</div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. PERSONAL BEST PR TEMPLATE */}
            {templateId === 'personal-best' && (
              <div className="relative z-10 flex-1 flex flex-col justify-between py-2">
                <div className="flex flex-col items-center justify-center my-auto text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400 text-amber-400 flex items-center justify-center mb-2 shadow-lg shadow-amber-500/20">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-black uppercase font-outfit text-amber-400 tracking-widest mb-1">
                    NEW PERSONAL RECORD!
                  </div>
                  <div className="text-4xl font-black font-outfit tracking-tight text-white mb-1">
                    {distVal.toFixed(2)} {displayUnit.toUpperCase()}
                  </div>
                  <div className="text-sm font-extrabold text-stone-200 font-outfit">
                    Time: {formatDuration(run.durationSeconds)} • Pace: {formatPace(paceVal, displayUnit).split(' ')[0]}
                  </div>
                </div>

                <div className="bg-amber-500 text-stone-950 font-black text-xs py-2 px-3 rounded-xl text-center uppercase tracking-wider shadow-lg">
                  🏆 {prTag}
                </div>
              </div>
            )}

            {/* FOOTER HASHTAG & LOCATION */}
            <div className="relative z-10 flex items-center justify-between text-[10px] font-bold font-outfit opacity-80 pt-1">
              <span>#RunbudsApp</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-400" />
                <span>{locationName}</span>
              </span>
            </div>
          </div>
        </div>

        {/* CUSTOMIZATION CONTROLS */}
        <div className="w-full bg-stone-900 border border-stone-800 rounded-3xl p-4 my-3 flex flex-col gap-4">
          {/* Template Selector */}
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider font-outfit mb-2 flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5 text-red-400" />
              <span>Select Post Template</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'route-map', label: 'Route Map' },
                { id: 'stacked-badges', label: 'Badges' },
                { id: 'photo-overlay', label: 'Photo' },
                { id: 'minimal-grid', label: 'Minimal' },
                { id: 'interval-splits', label: 'Intervals' },
                { id: 'personal-best', label: 'PR Trophy' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplateId(t.id as ShareTemplateId)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold font-outfit transition-all border ${
                    templateId === t.id
                      ? 'bg-red-600 border-red-500 text-white shadow-md'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Run Type Selector */}
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider font-outfit mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-red-400" />
              <span>Run Type Tag</span>
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {(Object.keys(RUN_TYPE_CONFIG) as RunType[]).map((tKey) => {
                const cfg = RUN_TYPE_CONFIG[tKey];
                return (
                  <button
                    key={tKey}
                    onClick={() => setRunType(tKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-outfit whitespace-nowrap transition-all border flex items-center gap-1 ${
                      runType === tKey
                        ? 'bg-red-600 border-red-500 text-white shadow-md'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white'
                    }`}
                  >
                    <span>{cfg.icon}</span>
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location & Title custom input */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider font-outfit mb-1.5 block">
                Location Label
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 font-outfit"
                placeholder="e.g. Central Park"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider font-outfit mb-1.5 block">
                Unit
              </label>
              <div className="flex bg-stone-950 border border-stone-800 rounded-xl p-1 text-xs">
                <button
                  onClick={() => setDisplayUnit('km')}
                  className={`flex-1 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    displayUnit === 'km' ? 'bg-red-600 text-white' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  KM
                </button>
                <button
                  onClick={() => setDisplayUnit('mi')}
                  className={`flex-1 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    displayUnit === 'mi' ? 'bg-red-600 text-white' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  MI
                </button>
              </div>
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider font-outfit mb-2 flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-red-400" />
              <span>Canvas Aspect Ratio</span>
            </label>
            <div className="flex bg-stone-950 border border-stone-800 rounded-xl p-1 text-xs">
              {(['9:16', '1:1', '16:9'] as AspectRatioType[]).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                    aspectRatio === ratio
                      ? 'bg-red-600 text-white'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Color Swatch Selector (For Solid Templates) */}
          {templateId !== 'photo-overlay' && templateId !== 'personal-best' && (
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider font-outfit mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-red-400" />
                <span>Theme Colors</span>
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.id}
                    onClick={() => setColorSwatchId(swatch.id)}
                    className={`w-8 h-8 rounded-full ${swatch.bgClass} border-2 flex items-center justify-center transition-transform ${
                      colorSwatchId === swatch.id
                        ? 'scale-110 border-white ring-2 ring-red-500'
                        : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    {colorSwatchId === swatch.id && <Check className="w-4 h-4 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Background Runner Photo Selector (For Photo Overlay Template) */}
          {templateId === 'photo-overlay' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider font-outfit flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-red-400" />
                  <span>Background Photo</span>
                </span>
                <label className="text-[11px] text-red-400 font-bold hover:underline cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  <span>Upload Mine</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </label>

              <div className="grid grid-cols-5 gap-2">
                {STOCK_RUNNER_PHOTOS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPhotoUrl(p.url);
                      setCustomPhotoUrl(null);
                    }}
                    className={`h-12 rounded-xl overflow-hidden border-2 transition-all relative ${
                      selectedPhotoUrl === p.url && !customPhotoUrl
                        ? 'border-red-500 ring-2 ring-red-500/50 scale-105'
                        : 'border-stone-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Photo Filter Switch */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-bold text-stone-400">Filter:</span>
                {(['none', 'monochrome', 'moody'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setPhotoFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      photoFilter === filter ? 'bg-red-600 text-white' : 'bg-stone-950 text-stone-400'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full grid grid-cols-2 gap-3 pb-6">
          <motion.button
            onClick={handleNativeShare}
            disabled={isExporting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white font-extrabold text-sm font-outfit uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-900/40 border border-red-400/30 disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            <span>{isExporting ? 'Preparing...' : 'Share Post'}</span>
          </motion.button>

          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="py-3.5 px-4 rounded-2xl bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-200 hover:text-white font-bold text-sm font-outfit uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
