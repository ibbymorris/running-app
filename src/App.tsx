import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Download, 
  X, 
  Upload, 
  Image as ImageIcon, 
  MessageCircle, 
  Camera, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Smartphone, 
  Maximize2,
  Check
} from 'lucide-react';

const formatTime = (totalSeconds: number): string => {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function RunbudsApp() {
  const [activePageIndex, setActivePageIndex] = useState<number>(3); // Default '6:18 avg pace'
  
  // Workout execution states
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [elapsedTime, setElapsedTime] = useState<number>(169); // 2 mins 49 secs
  const [distance, setDistance] = useState<number>(0.5); // 0.5 km
  const [heartRate, setHeartRate] = useState<number>(152);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Share Modal & Story Editor states
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [shareCardIndex, setShareCardIndex] = useState<number>(0); // 0: GPS Route, 1: Stacked Pills, 2: Photo Upload
  const [userPhoto, setUserPhoto] = useState<string>("https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80");
  const [isCreatingStory, setIsCreatingStory] = useState<boolean>(false);
  const [selectedOverlayStyle, setSelectedOverlayStyle] = useState<number>(2); 
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('none'); 
  const [isDoneSaved, setIsDoneSaved] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hold to end run state
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const holdIntervalRef = useRef<any>(null);

  // Touch / Swipe interaction state
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && !showSummary && !isShareOpen) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
        setDistance((prev) => parseFloat((prev + 0.003).toFixed(2)));
        if (Math.random() > 0.6) {
          setHeartRate((prev) => Math.min(185, Math.max(135, prev + (Math.random() > 0.5 ? 1 : -1))));
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, showSummary, isShareOpen]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const startHolding = () => {
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    const startTime = Date.now();
    const duration = 1200;

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        clearInterval(holdIntervalRef.current);
        setTimeout(() => {
          setShowSummary(true);
          setHoldProgress(0);
        }, 100);
      }
    }, 20);
  };

  const stopHolding = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }
    setHoldProgress(0);
  };

  const pages = [
    { id: 'distance', value: distance.toFixed(1), unit: 'km' },
    { id: 'time', value: formatTime(elapsedTime), unit: 'time' },
    { id: 'heart_rate', value: heartRate.toString(), unit: 'bpm' },
    { id: 'avg_pace', value: '6:18', unit: 'avg pace' }
  ];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distanceX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;

    if (isShareOpen && !isCreatingStory) {
      if (distanceX > minSwipeDistance) {
        setShareCardIndex((prev) => (prev < 2 ? prev + 1 : prev));
      } else if (distanceX < -minSwipeDistance) {
        setShareCardIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
    } else if (!showSummary) {
      if (distanceX > minSwipeDistance) {
        setActivePageIndex((prev) => (prev < pages.length - 1 ? prev + 1 : prev));
      } else if (distanceX < -minSwipeDistance) {
        setActivePageIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUserPhoto(reader.result);
          setIsCreatingStory(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getColorFilterStyle = (): React.CSSProperties => {
    switch (selectedColorFilter) {
      case 'grayscale': return { filter: 'grayscale(100%) contrast(1.1)' };
      case 'sepia': return { filter: 'sepia(80%) saturate(1.2)' };
      case 'purple': return { filter: 'hue-rotate(260deg) saturate(1.8)' };
      case 'orange': return { filter: 'hue-rotate(350deg) saturate(2)' };
      case 'blue': return { filter: 'hue-rotate(180deg) saturate(1.5)' };
      case 'yellow': return { filter: 'hue-rotate(45deg) saturate(1.6)' };
      default: return {};
    }
  };

  return (
    <div className="min-h-screen bg-[#62150D] text-white font-sans flex flex-col items-center justify-center p-0 md:p-6 antialiased selection:bg-[#C82A1A] selection:text-white">
      <style>{`
        @font-face {
          font-family: 'Clash Display';
          src: url('https://www.runbuds.app/fonts/ClashDisplay-Medium.ttf') format('truetype');
          font-weight: 600;
        }
        @font-face {
          font-family: 'SF Pro Display';
          src: url('https://www.runbuds.app/fonts/SF-Pro-Display-Regular.ttf') format('truetype');
        }
        @import url('https://fonts.googleapis.com/css?family=Inter:100,200,300,400,500,600,700,800,900&display=swap');

        .font-clash {
          font-family: 'Clash Display', 'Inter', sans-serif;
        }
        .font-sf {
          font-family: 'SF Pro Display', 'Inter', -apple-system, sans-serif;
        }
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
        
        .numeral-glow {
          font-feature-settings: "tnum" 1, "lnum" 1;
        }

        .bg-runbuds-main {
          background: linear-gradient(180deg, #C82A1A 0%, #9e1f13 50%, #62150D 100%);
        }

        .btn-runbuds-black {
          font-family: 'SF Pro Display', sans-serif;
          border-radius: 99px;
          background: #000000;
          color: #ffffff;
          transition: transform 0.12s cubic-bezier(0.2, 0, 0.2, 1);
        }
        .btn-runbuds-black:hover {
          transform: scale(1.04);
        }

        .appicon-outer-box {
          border-radius: 40px;
          background-color: rgba(255, 255, 255, 0.2);
        }
        .appicon-inner-box {
          border-radius: 32px;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Device Frame Toggle Bar */}
      <div className="hidden md:flex items-center justify-between w-full max-w-sm mb-4 px-4 py-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-xs text-neutral-200">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C82A1A] animate-pulse"></span>
          <span className="font-clash font-semibold text-white tracking-wide">Runbuds iOS</span>
        </div>
        <button 
          onClick={() => setIsPhoneFrame(!isPhoneFrame)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full btn-runbuds-black font-sf text-xs cursor-pointer"
        >
          {isPhoneFrame ? <Maximize2 size={13} /> : <Smartphone size={13} />}
          <span>{isPhoneFrame ? 'Full Screen' : 'Device Frame'}</span>
        </button>
      </div>

      {/* Main Container */}
      <div 
        className={`relative w-full overflow-hidden transition-all duration-300 flex flex-col justify-between font-sf ${
          isPhoneFrame 
            ? 'max-w-[390px] h-[844px] md:rounded-[50px] shadow-[0_0_90px_rgba(200,42,26,0.5)] border-0 md:border-[10px] border-neutral-900' 
            : 'max-w-md min-h-screen md:min-h-[844px] md:rounded-3xl shadow-2xl'
        }`}
        style={{
          background: isShareOpen 
            ? 'linear-gradient(180deg, #62150D 0%, #450c06 100%)' 
            : 'linear-gradient(180deg, #C82A1A 0%, #9e1f13 50%, #62150D 100%)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >

        {/* Status Bar Header */}
        <div className="w-full pt-3.5 px-7 flex items-center justify-between text-white font-sf font-semibold text-sm z-40 select-none tracking-tight">
          <div className="flex items-center gap-1">
            <span className="font-sf font-semibold text-[15px]">9:41</span>
            {!isShareOpen && (
              <svg className="w-3 h-3 fill-current ml-0.5" viewBox="0 0 24 24">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
              </svg>
            )}
          </div>

          {/* Dynamic Island / Notch */}
          {isPhoneFrame && (
            <div className="w-28 h-4 bg-black rounded-full absolute top-3 left-1/2 -translate-x-1/2 hidden md:block"></div>
          )}

          {/* Status Icons */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-3 fill-current" viewBox="0 0 24 24">
              <rect x="1" y="14" width="3" height="6" rx="0.5" />
              <rect x="6" y="10" width="3" height="10" rx="0.5" />
              <rect x="11" y="6" width="3" height="14" rx="0.5" />
              <rect x="16" y="2" width="3" height="18" rx="0.5" />
            </svg>
            <svg className="w-4 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M12 18c-.8 0-1.5.7-1.5 1.5S11.2 21 12 21s1.5-.7 1.5-1.5S12.8 18 12 18zm6.4-3.6c-3.5-3.5-9.3-3.5-12.8 0l1.4 1.4c2.8-2.8 7.3-2.8 10.1 0l1.3-1.4zM21.2 11.6c-5.1-5.1-13.3-5.1-18.4 0l1.4 1.4c4.3-4.3 11.3-4.3 15.6 0l1.4-1.4z" />
            </svg>
            <div className="w-5 h-2.5 border border-white rounded-[3px] p-[1px] relative flex items-center">
              <div className="bg-white h-full w-[85%] rounded-[1px]"></div>
              <div className="w-[2px] h-[4px] bg-white absolute -right-[4px] rounded-r-[1px]"></div>
            </div>
          </div>
        </div>

        {/* Global Notification Toast */}
        {toastMessage && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-black/90 backdrop-blur-md text-white text-xs px-4 py-2 rounded-full border border-white/20 animate-fade-in shadow-xl font-sf font-medium flex items-center gap-2">
            <CheckCircle2 size={14} className="text-green-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Hidden file input for custom image uploads */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          accept="image/*" 
          className="hidden" 
        />

        {/* ACTIVE WORKOUT MODE */}
        {!showSummary && !isShareOpen && (
          <>
            {isLocked && (
              <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 bg-black/50 backdrop-blur-md px-3.5 py-1 rounded-full text-xs flex items-center gap-1.5 text-white/90 border border-white/10 font-sf">
                <Lock size={12} />
                <span>Screen Locked</span>
              </div>
            )}

            {/* Metrics Carousel Display */}
            <div className="flex-1 flex flex-col justify-center items-center text-center px-6 relative z-10 select-none -mt-6">
              <button 
                onClick={() => setActivePageIndex((prev) => (prev > 0 ? prev - 1 : pages.length - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-32 flex items-center justify-center opacity-0 hover:opacity-20 transition text-white cursor-pointer"
              >
                <ChevronLeft size={36} />
              </button>

              <button 
                onClick={() => setActivePageIndex((prev) => (prev < pages.length - 1 ? prev + 1 : 0))}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-32 flex items-center justify-center opacity-0 hover:opacity-20 transition text-white cursor-pointer"
              >
                <ChevronRight size={36} />
              </button>

              <div className="w-full">
                <h1 className="text-[104px] sm:text-[114px] font-clash font-semibold tracking-tight text-white leading-none numeral-glow drop-shadow-sm">
                  {pages[activePageIndex].value}
                </h1>
                <p className="text-[34px] sm:text-[38px] font-sf font-light text-white/95 tracking-normal mt-3">
                  {pages[activePageIndex].unit}
                </p>
              </div>

              {/* Pagination Dots */}
              <div className="flex items-center justify-center gap-3.5 mt-14">
                {pages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActivePageIndex(index)}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      index === activePageIndex
                        ? 'w-2.5 h-2.5 bg-white scale-100'
                        : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </div>

            {isRunning ? (
              <div className="relative w-full h-[220px] flex flex-col items-center justify-end pb-12 px-8 z-20">
                <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 390 220" preserveAspectRatio="none" fill="none">
                    <defs>
                      <linearGradient id="arcGradient" x1="195" y1="0" x2="195" y2="220" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#80190e" />
                        <stop offset="40%" stopColor="#62150D" />
                        <stop offset="100%" stopColor="#3d0b06" />
                      </linearGradient>
                    </defs>
                    <path d="M -20 220 L -20 70 C 100 8, 290 8, 410 70 L 410 220 Z" fill="url(#arcGradient)" />
                  </svg>
                </div>

                <div className="relative z-10 flex flex-col items-center gap-5 w-full">
                  {!isLocked ? (
                    <button
                      onClick={() => setIsRunning(false)}
                      className="group transition-transform duration-200 active:scale-95 focus:outline-none cursor-pointer"
                    >
                      <div className="flex items-center justify-center gap-[13px] py-1 px-3">
                        <div className="w-[22px] h-[72px] bg-white rounded-[14px] shadow-lg transition-transform group-hover:scale-105" />
                        <div className="w-[22px] h-[72px] bg-white rounded-[14px] shadow-lg transition-transform group-hover:scale-105" />
                      </div>
                    </button>
                  ) : (
                    <div 
                      onClick={() => setIsLocked(false)}
                      className="flex items-center justify-center gap-2 py-3.5 px-7 bg-black/50 backdrop-blur-md rounded-full border border-white/20 text-white text-xs font-sf font-medium cursor-pointer"
                    >
                      <Lock size={14} />
                      <span>Tap to Unlock</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative w-full flex flex-col items-center justify-between pb-10 px-8 z-20 min-h-[350px] flex-1">
                <div className="flex-1 flex items-center justify-center -mt-10">
                  <button
                    onClick={() => setIsRunning(true)}
                    className="w-[152px] h-[152px] rounded-full bg-white flex items-center justify-center shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-transform active:scale-95 hover:scale-105 cursor-pointer"
                  >
                    <svg className="w-20 h-20 fill-[#C82A1A] ml-2.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                </div>

                <div
                  onMouseDown={startHolding}
                  onMouseUp={stopHolding}
                  onMouseLeave={stopHolding}
                  onTouchStart={startHolding}
                  onTouchEnd={stopHolding}
                  className={`w-full max-w-[320px] h-[58px] rounded-full border transition-all duration-75 relative overflow-hidden flex items-center justify-center cursor-pointer select-none active:scale-[0.99] mb-2 ${
                    holdProgress >= 98 ? 'border-white bg-white' : 'border-white/85 bg-transparent'
                  }`}
                >
                  <div 
                    className="absolute left-0 top-0 bottom-0 bg-white transition-all duration-75 ease-out"
                    style={{ width: `${holdProgress}%` }}
                  />
                  <span 
                    className="relative z-10 font-sf text-[22px] tracking-tight transition-colors duration-75"
                    style={{
                      color: holdProgress > 45 ? '#62150D' : '#ffffff'
                    }}
                  >
                    Hold to end run
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* WORKOUT SUMMARY MODE */}
        {showSummary && !isShareOpen && (
          <div className="absolute inset-0 z-40 flex flex-col justify-between pt-12 pb-10 px-8 animate-fade-in bg-gradient-to-b from-[#C82A1A] via-[#9e1f13] to-[#62150D]">
            <div className="w-full max-w-xs mx-auto pt-4 space-y-3 text-white font-sf">
              <div className="flex justify-between items-center text-[22px] font-normal tracking-tight">
                <span className="opacity-90 font-light">Time</span>
                <span className="font-clash numeral-glow">2:49</span>
              </div>
              <div className="flex justify-between items-center text-[22px] font-normal tracking-tight">
                <span className="opacity-90 font-light">Distance</span>
                <span className="font-clash numeral-glow">0.36 mi</span>
              </div>
              <div className="flex justify-between items-center text-[22px] font-normal tracking-tight">
                <span className="opacity-90 font-light">Pace</span>
                <span className="font-clash numeral-glow">7:48 / mi</span>
              </div>
              <div className="flex justify-between items-center text-[22px] font-normal tracking-tight">
                <span className="opacity-90 font-light">Top speed</span>
                <span className="font-clash numeral-glow">23.7 mph</span>
              </div>
            </div>

            <div className="flex-1 my-6 flex items-center justify-center relative">
              <svg className="w-full h-56 max-w-[240px]" viewBox="0 0 200 300" fill="none">
                <path 
                  d="M 50 270 L 130 110 C 145 80 150 70 135 65 C 125 60 120 62 118 60" 
                  stroke="white" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                />
                <circle cx="118" cy="60" r="3.5" fill="white" />
              </svg>
            </div>

            <div className="w-full max-w-xs mx-auto flex flex-col items-center gap-5 font-sf">
              <button
                onClick={() => {
                  setShowSummary(false);
                  setElapsedTime(0);
                  setDistance(0);
                  setIsRunning(true);
                }}
                className="w-full h-[58px] bg-white text-[#62150D] text-[22px] font-medium rounded-full shadow-lg active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
              >
                Home
              </button>

              <button
                onClick={() => {
                  setIsShareOpen(true);
                  setIsCreatingStory(false);
                }}
                className="text-white text-[21px] font-normal hover:opacity-80 transition active:scale-95 font-clash tracking-wide cursor-pointer"
              >
                Share Run
              </button>
            </div>
          </div>
        )}

        {/* SHARE MODAL / STORY CREATOR */}
        {isShareOpen && (
          <div className="absolute inset-0 z-50 flex flex-col justify-between pt-11 pb-7 px-5 bg-[#62150D] text-white animate-fade-in font-sf select-none">
            
            {/* Header Controls */}
            <div className="w-full flex items-center justify-between z-20">
              <button 
                onClick={() => {
                  if (isCreatingStory) setIsDoneSaved(true);
                  triggerToast("Saved to Camera Roll");
                }}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 active:scale-90 transition cursor-pointer"
                title="Save / Download"
              >
                {isCreatingStory && isDoneSaved ? <Check size={20} className="text-green-400" /> : <Download size={20} />}
              </button>

              <span className="text-[22px] font-clash font-semibold text-white tracking-tight">Today</span>

              <button 
                onClick={() => {
                  if (isCreatingStory) {
                    setIsCreatingStory(false);
                  } else {
                    setIsShareOpen(false);
                  }
                }}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 active:scale-90 transition cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* IF IN STORY CREATOR STUDIO MODE */}
            {isCreatingStory ? (
              <div className="flex-1 my-2 flex flex-col justify-between items-center w-full max-w-[340px] mx-auto">
                
                {/* Main Central Image Canvas */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-[370px] rounded-[32px] relative overflow-hidden shadow-2xl border border-white/10 group cursor-pointer my-auto flex items-center justify-center bg-black/40"
                >
                  <img 
                    src={userPhoto} 
                    alt="Story Canvas" 
                    className="w-full h-full object-cover transition-all duration-300"
                    style={getColorFilterStyle()}
                  />

                  {/* Canvas Style 0 Overlay */}
                  {selectedOverlayStyle === 0 && (
                    <div className="absolute inset-0 p-5 flex flex-col justify-between pointer-events-none">
                      <div className="flex justify-between items-center">
                        <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white font-sf">
                          📍 Location
                        </div>
                        <span className="text-white/80 text-xs font-light font-sf">Jan 6</span>
                      </div>
                      <div className="my-auto flex justify-center">
                        <svg className="w-32 h-32 stroke-white" viewBox="0 0 200 300" fill="none">
                          <path d="M 50 270 L 130 110 C 145 80 150 70 135 65 C 125 60 120 62 118 60" stroke="white" strokeWidth="4" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div className="space-y-1 font-clash font-semibold text-white text-2xl tracking-tight drop-shadow-md">
                        <div>2:49</div>
                        <div>0.5 km</div>
                        <div>6:15 / km</div>
                      </div>
                    </div>
                  )}

                  {/* Canvas Style 1 Overlay */}
                  {selectedOverlayStyle === 1 && (
                    <div className="absolute inset-0 p-6 flex flex-col justify-end items-start text-white pointer-events-none drop-shadow-md">
                      <span className="text-xs uppercase tracking-widest text-white/80 font-bold font-sf">DISTANCE</span>
                      <span className="text-3xl font-clash mb-2">0.5 km</span>
                      <span className="text-xs uppercase tracking-widest text-white/80 font-bold font-sf">PACE</span>
                      <span className="text-3xl font-clash mb-2">6:15 / km</span>
                      <span className="text-xs uppercase tracking-widest text-white/80 font-bold font-sf">TIME</span>
                      <span className="text-3xl font-clash">2:49</span>
                    </div>
                  )}

                  {/* Canvas Style 2 Overlay */}
                  {selectedOverlayStyle === 2 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="flex items-center gap-3 text-center text-white drop-shadow-lg bg-black/30 backdrop-blur-[2px] px-4 py-2 rounded-2xl border border-white/20">
                        <div>
                          <div className="text-[9px] uppercase tracking-wider font-bold text-white/90 font-sf">DISTANCE</div>
                          <div className="text-sm font-clash">0.5 km</div>
                        </div>
                        <div className="w-[1px] h-6 bg-white/40" />
                        <div>
                          <div className="text-[9px] uppercase tracking-wider font-bold text-white/90 font-sf">PACE</div>
                          <div className="text-sm font-clash">6:15 / km</div>
                        </div>
                        <div className="w-[1px] h-6 bg-white/40" />
                        <div>
                          <div className="text-[9px] uppercase tracking-wider font-bold text-white/90 font-sf">TIME</div>
                          <div className="text-sm font-clash">2:49</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white/90 opacity-0 group-hover:opacity-100 transition font-sf">
                    Click to change photo
                  </div>
                </div>

                {/* Layout Selector Cards */}
                <div className="w-full flex items-center justify-between gap-2.5 my-3">
                  
                  {/* Selector Card 0 */}
                  <button
                    onClick={() => setSelectedOverlayStyle(0)}
                    className={`flex-1 h-[95px] rounded-[22px] bg-black/40 p-2.5 flex flex-col justify-between text-left transition-all relative overflow-hidden border-2 cursor-pointer ${
                      selectedOverlayStyle === 0 ? 'border-white scale-[1.02]' : 'border-transparent opacity-80'
                    }`}
                  >
                    <div className="font-clash text-white text-[13px]">0.5 km</div>
                    <div className="text-[9px] text-white/70 font-sf">📍 Location</div>
                  </button>

                  {/* Selector Card 1 */}
                  <button
                    onClick={() => setSelectedOverlayStyle(1)}
                    className={`flex-1 h-[95px] rounded-[22px] bg-black/40 p-2.5 flex flex-col justify-center gap-1 transition-all relative overflow-hidden border-2 cursor-pointer ${
                      selectedOverlayStyle === 1 ? 'border-white scale-[1.02]' : 'border-transparent opacity-80'
                    }`}
                  >
                    <div className="font-clash text-white text-[15px] leading-none">2:49</div>
                    <div className="text-[11px] font-sf text-white/90">6:15 / km</div>
                  </button>

                  {/* Selector Card 2 */}
                  <button
                    onClick={() => setSelectedOverlayStyle(2)}
                    className={`flex-1 h-[95px] rounded-[22px] bg-black/40 p-2 flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden border-2 cursor-pointer ${
                      selectedOverlayStyle === 2 ? 'border-white scale-[1.02]' : 'border-transparent opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[8px] font-clash text-white/90 uppercase tracking-tighter">
                      <span>0.5 km</span>
                      <span>•</span>
                      <span>6:15</span>
                      <span>•</span>
                      <span>2:49</span>
                    </div>
                  </button>

                </div>

                {/* Color Swatches & Done Button */}
                <div className="w-full flex items-center justify-between gap-2 pt-1">
                  
                  {/* Color Filter Swatches Bar */}
                  <div className="flex-1 flex items-center justify-around bg-black/40 rounded-full px-3 py-2 border border-white/10">
                    
                    {/* Grayscale Swatch */}
                    <button
                      onClick={() => setSelectedColorFilter('grayscale')}
                      className={`w-6 h-6 rounded-full bg-gradient-to-tr from-gray-500 to-gray-300 border-2 transition-transform cursor-pointer ${
                        selectedColorFilter === 'grayscale' ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-80'
                      }`}
                      title="Monochrome B&W"
                    />

                    {/* Sepia */}
                    <button
                      onClick={() => setSelectedColorFilter('sepia')}
                      className={`w-6 h-6 rounded-full bg-[#c2a27d] border-2 transition-transform cursor-pointer ${
                        selectedColorFilter === 'sepia' ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-80'
                      }`}
                    />

                    {/* Purple */}
                    <button
                      onClick={() => setSelectedColorFilter('purple')}
                      className={`w-6 h-6 rounded-full bg-[#d922ed] border-2 transition-transform cursor-pointer ${
                        selectedColorFilter === 'purple' ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-80'
                      }`}
                    />

                    {/* Orange */}
                    <button
                      onClick={() => setSelectedColorFilter('orange')}
                      className={`w-6 h-6 rounded-full bg-[#f28e38] border-2 transition-transform cursor-pointer ${
                        selectedColorFilter === 'orange' ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-80'
                      }`}
                    />

                    {/* Blue */}
                    <button
                      onClick={() => setSelectedColorFilter('blue')}
                      className={`w-6 h-6 rounded-full bg-[#398bf2] border-2 transition-transform cursor-pointer ${
                        selectedColorFilter === 'blue' ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-80'
                      }`}
                    />

                    {/* Yellow */}
                    <button
                      onClick={() => setSelectedColorFilter('yellow')}
                      className={`w-6 h-6 rounded-full bg-[#f2d838] border-2 transition-transform cursor-pointer ${
                        selectedColorFilter === 'yellow' ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-80'
                      }`}
                    />
                  </div>

                  {/* Done Button */}
                  <button
                    onClick={() => {
                      setIsDoneSaved(true);
                      triggerToast("Story created successfully!");
                    }}
                    className="h-[46px] px-6 bg-white text-[#62150D] text-[18px] font-sf font-medium rounded-full shadow-lg active:scale-95 transition flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    Done
                  </button>

                </div>

              </div>
            ) : (
              /* STANDARD SHARE CAROUSEL */
              <div className="flex-1 my-3 flex flex-col items-center justify-center relative">
                
                {/* CARD VARIANT 1: GPS Route */}
                {shareCardIndex === 0 && (
                  <div className="w-full max-w-[310px] h-[410px] rounded-[32px] bg-gradient-to-b from-[#C82A1A] via-[#a02013] to-[#62150D] p-6 flex flex-col justify-between shadow-[0_15px_40px_rgba(0,0,0,0.5)] border border-white/15 relative overflow-hidden transition-all">
                    <div className="flex justify-between items-center z-10">
                      <div className="border-[1.5px] border-white/90 rounded-full px-3.5 py-1 flex items-center justify-center bg-white/10 backdrop-blur-sm">
                        <span className="text-white font-clash italic tracking-wider text-xs uppercase">Runbuds</span>
                      </div>
                      <span className="text-white/90 text-sm font-sf font-light">Jan 6</span>
                    </div>

                    <div className="flex-1 flex items-center justify-center my-2 relative">
                      <svg className="w-48 h-48 stroke-white" viewBox="0 0 200 300" fill="none">
                        <path 
                          d="M 50 270 L 130 110 C 145 80 150 70 135 65 C 125 60 120 62 118 60" 
                          stroke="white" 
                          strokeWidth="4" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
                        />
                        <circle cx="118" cy="60" r="4" fill="white" />
                      </svg>
                    </div>

                    <div className="space-y-0.5 text-white font-clash z-10 leading-none">
                      <div className="text-[38px]">2:49</div>
                      <div className="text-[38px]">0.5 km</div>
                      <div className="text-[38px]">6:15 / km</div>
                    </div>
                  </div>
                )}

                {/* CARD VARIANT 2: Stacked White Badges */}
                {shareCardIndex === 1 && (
                  <div className="w-full max-w-[310px] h-[410px] rounded-[32px] bg-gradient-to-b from-[#C82A1A] via-[#a02013] to-[#62150D] p-6 flex flex-col justify-between items-center shadow-[0_15px_40px_rgba(0,0,0,0.5)] border border-white/15 relative overflow-hidden transition-all">
                    <div className="border-[1.5px] border-white/90 rounded-full px-4 py-1 flex items-center justify-center bg-white/10 backdrop-blur-sm mt-1">
                      <span className="text-white font-clash italic tracking-wider text-sm uppercase">Runbuds</span>
                    </div>

                    <div className="flex flex-col items-center gap-3.5 my-auto w-full px-2">
                      <div className="bg-white text-[#62150D] font-clash text-[34px] px-8 py-1.5 rounded-[22px] tracking-tight shadow-lg w-full max-w-[210px] text-center transform -skew-x-2">
                        2:49
                      </div>
                      <div className="bg-white text-[#62150D] font-clash text-[34px] px-8 py-1.5 rounded-[22px] tracking-tight shadow-lg w-full max-w-[230px] text-center transform -skew-x-2">
                        0.5 km
                      </div>
                      <div className="bg-white text-[#62150D] font-clash text-[34px] px-8 py-1.5 rounded-[22px] tracking-tight shadow-lg w-full max-w-[250px] text-center transform -skew-x-2">
                        6:15 / km
                      </div>
                    </div>

                    <span className="text-white/90 text-[19px] font-sf font-light mb-1">Jan 6</span>
                  </div>
                )}

                {/* CARD VARIANT 3: Custom Media Upload */}
                {shareCardIndex === 2 && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full max-w-[310px] h-[410px] rounded-[32px] bg-gradient-to-b from-[#C82A1A] via-[#a02013] to-[#62150D] p-5 flex flex-col items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.5)] border border-white/15 relative overflow-hidden transition-all cursor-pointer hover:opacity-95"
                  >
                    <div className="w-full h-full border-2 border-dashed border-white/70 rounded-[24px] flex flex-col items-center justify-center p-6 text-center group">
                      <div className="w-16 h-12 mb-3 relative flex items-center justify-center">
                        <div className="w-10 h-9 border-2 border-white rounded-lg absolute left-1 top-0 bg-transparent group-hover:scale-105 transition" />
                        <div className="w-10 h-9 border-2 border-white rounded-lg absolute right-1 bottom-0 bg-transparent group-hover:scale-105 transition" />
                        <ImageIcon size={22} className="text-white relative z-10" />
                      </div>

                      <span className="text-white font-clash text-[22px] leading-tight max-w-[180px]">
                        Use your own image/video
                      </span>
                    </div>
                  </div>
                )}

                {/* Pagination Dots */}
                <div className="flex items-center justify-center gap-2.5 mt-5">
                  {[0, 1, 2].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => setShareCardIndex(idx)}
                      className={`transition-all rounded-full cursor-pointer ${
                        shareCardIndex === idx 
                          ? 'w-2 h-2 bg-white' 
                          : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions for Share Carousel */}
            {!isCreatingStory && (
              shareCardIndex !== 2 ? (
                <div className="w-full max-w-xs mx-auto flex items-center justify-evenly pt-2 pb-2">
                  <div className="flex flex-col items-center gap-2">
                    <button 
                      onClick={() => triggerToast("Preparing link...")}
                      className="w-[68px] h-[68px] rounded-full btn-runbuds-black flex items-center justify-center text-white active:scale-95 transition shadow-md cursor-pointer"
                    >
                      <Upload size={26} />
                    </button>
                    <span className="text-xs font-sf font-light text-white/90">Share</span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <button 
                      onClick={() => triggerToast("Opening Instagram...")}
                      className="w-[68px] h-[68px] rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#cc2366] flex items-center justify-center text-white active:scale-95 transition shadow-md cursor-pointer"
                    >
                      <Camera size={28} />
                    </button>
                    <span className="text-xs font-sf font-light text-white/90">Story</span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <button 
                      onClick={() => triggerToast("Opening iMessage...")}
                      className="w-[68px] h-[68px] rounded-full bg-[#4cd964] flex items-center justify-center text-white active:scale-95 transition shadow-md cursor-pointer"
                    >
                      <MessageCircle size={30} className="fill-white stroke-none" />
                    </button>
                    <span className="text-xs font-sf font-light text-white/90">Messages</span>
                  </div>
                </div>
              ) : (
                /* Card 3 White "Create" Button */
                <div className="w-full max-w-[280px] mx-auto pb-2">
                  <button
                    onClick={() => setIsCreatingStory(true)}
                    className="w-full h-[58px] bg-white text-[#62150D] text-[22px] font-sf font-medium rounded-full shadow-lg active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              )
            )}

          </div>
        )}

      </div>

      <div className="mt-4 text-center text-xs text-neutral-300 font-sf hidden md:block">
        Runbuds Tracking Screen • Design updated with Clash Display, SF Pro &amp; exact red gradient.
      </div>
    </div>
  );
}
