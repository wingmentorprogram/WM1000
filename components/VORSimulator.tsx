import React, { useEffect, useRef, useState } from 'react';
import { Plane, Target, ChevronLeft, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, AlertCircle, Play, Navigation2, RefreshCw, Info } from 'lucide-react';
import { playSound } from '../services/audioService.ts';

interface VORSimulatorProps {
  type: 'VOR' | 'HSI';
  onExit: () => void;
}

const VORSimulator: React.FC<VORSimulatorProps> = ({ type, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathRef = useRef<{ x: number, y: number }[]>([]);
  const [isPaused, setIsPaused] = useState(true);
  const [planePos, setPlanePos] = useState({ x: 0, y: 0 }); 
  const [heading, setHeading] = useState(0);
  const [obs, setObs] = useState(0);
  const [radial, setRadial] = useState(0);
  const [isTo, setIsTo] = useState(true);
  const [cdiDeflection, setCdiDeflection] = useState(0);
  const [velocity, setVelocity] = useState(0.4); 
  const [headingBug, setHeadingBug] = useState(0);
  
  // Mission Tracking
  const [phase, setPhase] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');
  const [targetRadial, setTargetRadial] = useState(180);
  const [passageAlert, setPassageAlert] = useState(false);
  const [showPassageExplanation, setShowPassageExplanation] = useState(false);

  // State to track steering combo for doubling the turn rate
  const [steerCombo, setSteerCombo] = useState({ dir: null as 'left' | 'right' | null, count: 0, lastTime: 0 });

  // Mission Logic
  const stationPos = { x: 0, y: -5000 }; 
  const crosswindX = 0.12; 

  const currentDmeValue = Math.hypot(planePos.x - stationPos.x, planePos.y - stationPos.y) / 100;
  const currentDme = currentDmeValue.toFixed(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const update = () => {
      if (!isPaused && !showPassageExplanation) {
        setPlanePos(prev => {
          const rad = (heading - 90) * (Math.PI / 180);
          const drift = velocity > 0 ? crosswindX : 0;
          const newX = prev.x + Math.cos(rad) * velocity + drift;
          const newY = prev.y + Math.sin(rad) * velocity;
          
          // Add to path trace
          const lastPoint = pathRef.current[pathRef.current.length - 1];
          if (!lastPoint || Math.hypot(lastPoint.x - newX, lastPoint.y - newY) > 5) {
            pathRef.current.push({ x: newX, y: newY });
            if (pathRef.current.length > 2000) pathRef.current.shift();
          }

          const dx = newX - stationPos.x;
          const dy = newY - stationPos.y;
          const distToStation = Math.hypot(dx, dy) / 100;

          let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
          
          while (angle < 0) angle += 360;
          while (angle >= 360) angle -= 360;
          
          const currentRadial = Math.round(angle);
          setRadial(currentRadial);

          let diff = obs - currentRadial;
          while (diff > 180) diff -= 360;
          while (diff < -180) diff += 360;
          
          const isActuallyTo = Math.abs(diff) > 90;
          
          // TRIGGER STATION PASSAGE EXPLANATION
          if (phase === 'INBOUND' && distToStation < 0.15) {
             setShowPassageExplanation(true);
             setIsPaused(true);
             return prev; // Don't move while explanation is shown
          }

          if (phase === 'INBOUND' && !isActuallyTo) {
             setPhase('OUTBOUND');
             setTargetRadial(360);
             setPassageAlert(true);
             playSound('click');
             setTimeout(() => setPassageAlert(false), 4000);
          }
          
          setIsTo(isActuallyTo);
          
          let cdiError = diff;
          if (isActuallyTo) {
            let toDiff = diff + (diff > 0 ? -180 : 180);
            cdiError = -toDiff;
          }
          
          setCdiDeflection(Math.max(-10, Math.min(10, cdiError)) / 10);

          return { x: newX, y: newY };
        });
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(centerX, centerY);

      ctx.strokeStyle = '#ffffff06';
      ctx.lineWidth = 1;
      const gridSize = 150;
      const startX = Math.floor((planePos.x - centerX) / gridSize) * gridSize;
      const startY = Math.floor((planePos.y - centerY) / gridSize) * gridSize;

      for (let x = startX - 2000; x < startX + 2000; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x - planePos.x, -6000);
        ctx.lineTo(x - planePos.x, 6000);
        ctx.stroke();
      }
      for (let y = startY - 2000; y < startY + 2000; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(-6000, y - planePos.y);
        ctx.lineTo(6000, y - planePos.y);
        ctx.stroke();
      }

      // DRAW FLIGHT PATH TRACE
      ctx.save();
      ctx.strokeStyle = '#3b82f6'; // Bright Aviation Blue
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      pathRef.current.forEach((p, i) => {
        const drawX = p.x - planePos.x;
        const drawY = p.y - planePos.y;
        if (i === 0) ctx.moveTo(drawX, drawY);
        else ctx.lineTo(drawX, drawY);
      });
      // Draw a line to the current aircraft position
      ctx.lineTo(0, 0); 
      ctx.stroke();
      ctx.restore();

      // DRAW RADIAL REFERENCE LINES (PHYSICAL 180 & 360 CORRIDOR)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.setLineDash([]);
      ctx.lineWidth = 2;
      const sX = stationPos.x - planePos.x;
      const sY = stationPos.y - planePos.y;
      
      ctx.beginPath();
      // Line extending South (180 Radial)
      ctx.moveTo(sX, sY);
      ctx.lineTo(sX, sY + 10000);
      // Line extending North (360 Radial)
      ctx.moveTo(sX, sY);
      ctx.lineTo(sX, sY - 10000);
      ctx.stroke();

      ctx.save();
      ctx.translate(sX + 12, sY + 800);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = 'bold 10px "Share Tech Mono"';
      ctx.fillText("RADIAL 180", 0, 0);
      ctx.restore();

      ctx.save();
      ctx.translate(sX + 12, sY - 1200);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = 'bold 10px "Share Tech Mono"';
      ctx.fillText("RADIAL 360", 0, 0);
      ctx.restore();

      // STATION INDICATOR
      const sx = stationPos.x - planePos.x;
      const sy = stationPos.y - planePos.y;
      
      const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, 40);
      gradient.addColorStop(0, 'rgba(255, 204, 0, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 204, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath(); ctx.arc(sx, sy, 40, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#FFCC00';
      ctx.beginPath(); ctx.arc(sx, sy, 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx, sy, 20, 0, Math.PI * 2); ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'black 12px "Share Tech Mono"';
      ctx.fillText("VOR STATION 'WMT'", sx + 30, sy + 5);

      ctx.restore();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((heading - 90) * (Math.PI / 180));
      
      ctx.fillStyle = '#00FFFF';
      ctx.beginPath();
      ctx.moveTo(24, 0);
      ctx.lineTo(-18, -14);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-18, 14);
      ctx.closePath();
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(0, 20);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#00FFFF';
      ctx.stroke();

      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00FFFF';
      ctx.stroke();
      ctx.restore();

      animationFrameId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, heading, velocity, obs, planePos, stationPos, phase, showPassageExplanation]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showPassageExplanation) return;
      if (isPaused) {
        if (e.key === 'Enter' || e.key === ' ') setIsPaused(false);
        return;
      }
      if (e.key === 'ArrowLeft') handleSteer('left');
      if (e.key === 'ArrowRight') handleSteer('right');
      if (e.key === 'q' || e.key === 'Q') { playSound('click'); setObs(o => (o - 1 + 360) % 360); }
      if (e.key === 'e' || e.key === 'E') { playSound('click'); setObs(o => (o + 1) % 360); }
      if (e.key === '[') { playSound('click'); setHeadingBug(h => (h - 1 + 360) % 360); }
      if (e.key === ']') { playSound('click'); setHeadingBug(h => (h + 1) % 360); }
      if (e.key === 'w' || e.key === 'W') handleThrottle('up');
      if (e.key === 's' || e.key === 'S') handleThrottle('down');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, obs, heading, velocity, steerCombo, showPassageExplanation]);

  const handleSteer = (dir: 'left' | 'right') => {
    playSound('click');
    const now = Date.now();
    let newCount = 1;
    if (steerCombo.dir === dir && now - steerCombo.lastTime < 400) {
      newCount = steerCombo.count + 1;
    }
    const delta = newCount > 2 ? 4 : 2;
    const newHdg = dir === 'left' ? (heading - delta + 360) % 360 : (heading + delta) % 360;
    
    setHeading(newHdg);
    setHeadingBug(newHdg);
    setSteerCombo({ dir, count: newCount, lastTime: now });
  };

  const handleThrottle = (dir: 'up' | 'down') => {
    playSound('click');
    setVelocity(v => (dir === 'up' ? Math.min(5, v + 0.1) : Math.max(0, v - 0.1)));
  };

  const syncHeadingBug = () => {
    playSound('click');
    setHeadingBug(heading);
  };

  const closeExplanation = () => {
      playSound('click');
      setPhase('OUTBOUND');
      setTargetRadial(360);
      setIsTo(false);
      setShowPassageExplanation(false);
      setIsPaused(false);
  };

  const renderInstrument = () => {
    if (type === 'VOR') {
      return (
        <div className="relative group w-fit">
          <div className="bg-[#0f0f11] border-[6px] border-zinc-800 p-4 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-3">
            <span className="text-[9px] font-black text-zinc-500 tracking-[0.4em] uppercase">VOR Analogue</span>
            <div className="relative w-48 h-48 rounded-full bg-black border-[6px] border-[#222] shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 transition-transform duration-300" style={{ transform: `rotate(${-obs}deg)` }}>
                {[...Array(36)].map((_, i) => (
                  <div key={i} className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-px flex flex-col items-center" style={{ transform: `rotate(${i * 10}deg)` }}>
                    <div className={`w-px ${i % 3 === 0 ? 'h-3 bg-white/90' : 'h-1.5 bg-white/30'}`}></div>
                    {i % 3 === 0 && (
                      <span className="text-[8px] mt-2 font-bold text-white/80 transform" style={{ transform: `rotate(${-i * 10}deg)` }}>
                        {i === 0 ? 'N' : i === 9 ? 'E' : i === 18 ? 'S' : i === 27 ? 'W' : i}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="relative w-full h-full flex items-center justify-center z-20 pointer-events-none">
                <div className={`absolute top-4 w-4 h-4 border-l-[4px] border-t-[4px] border-g1000-cyan rotate-45 shadow-[0_0_10px_cyan] transition-transform duration-300 ${isTo ? 'rotate-45 translate-y-0' : 'rotate-[225deg] translate-y-3'}`}></div>
                <div className="flex gap-5 items-center">
                  <div className="flex gap-4"><div className="w-1.5 h-1.5 rounded-full border border-white/10"></div><div className="w-1.5 h-1.5 rounded-full border border-white/10"></div></div>
                  <div className="w-8 h-8 rounded-full border-2 border-white/10 bg-white/5"></div>
                  <div className="flex gap-4"><div className="w-1.5 h-1.5 rounded-full border border-white/10"></div><div className="w-1.5 h-1.5 rounded-full border border-white/10"></div></div>
                </div>
                <div className="absolute h-40 w-1.5 bg-white shadow-[0_0_15px_white] transition-transform duration-700 ease-out rounded-full" style={{ transform: `translateX(${cdiDeflection * 70}px)` }}></div>
                <div className="absolute bottom-10 flex flex-col items-center">
                  <div className="bg-zinc-900 px-3 py-1 border border-white/10 rounded-md">
                    <span className={`text-[10px] font-black tracking-widest ${isTo ? 'text-g1000-green' : 'text-g1000-amber'}`}>
                      {isTo ? 'TO' : 'FR'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="absolute top-10 bg-black/80 border border-white/20 px-3 py-1 rounded-md z-30">
                <span className="text-[10px] font-mono font-black text-g1000-cyan tracking-widest uppercase">{obs.toString().padStart(3, '0')}°</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative group w-fit">
        {/* PHYSICAL PANEL BACKGROUND */}
        <div className="bg-[#111113] border-[6px] border-zinc-900 p-8 rounded-[3rem] shadow-2xl flex flex-col items-center gap-4">
          
          {/* TOP INSTRUMENT INFO BAR */}
          <div className="flex justify-between w-full px-2 mb-2">
            <button 
              onClick={syncHeadingBug}
              className="bg-black border border-white/40 px-3 py-1 rounded flex items-center gap-2 hover:bg-zinc-800 transition-colors group/sync"
            >
               <span className="text-[9px] text-g1000-cyan font-black uppercase tracking-tighter">HDG</span>
               <span className="text-g1000-cyan font-mono text-xs font-black">{Math.round(headingBug).toString().padStart(3, '0')}°</span>
               <RefreshCw className="w-2.5 h-2.5 text-g1000-cyan/40 group-hover/sync:rotate-180 transition-transform" />
            </button>
            <div className="flex flex-col items-center justify-center">
               <div className="bg-black border-2 border-white px-3 py-1 rounded shadow-lg">
                  <span className="text-white font-mono text-base font-black tracking-tighter">{Math.round(heading).toString().padStart(3, '0')}°</span>
               </div>
               <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-white mt-1"></div>
            </div>
            <div className="w-16"></div> {/* Spacer to balance */}
          </div>

          {/* COMPASS ROSE HOUSING */}
          <div className="relative w-64 h-64 rounded-full bg-[#1e140d] border-[8px] border-zinc-800 shadow-[inset_0_0_40px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden">
            {/* COMPASS ROSE (ROTATING) */}
            <div className="absolute inset-0 transition-transform duration-75 ease-linear" style={{ transform: `rotate(${-heading}deg)` }}>
               {[...Array(72)].map((_, i) => {
                  const deg = i * 5;
                  const isLarge = deg % 30 === 0;
                  const isMedium = deg % 10 === 0 && !isLarge;
                  const label = deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : deg === 270 ? 'W' : (deg / 10).toString();
                  return (
                    <div key={i} className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-px flex flex-col items-center" style={{ transform: `rotate(${deg}deg)` }}>
                      <div className={`w-px ${isLarge ? 'h-4 bg-white' : isMedium ? 'h-2.5 bg-white/70' : 'h-1.5 bg-white/40'}`}></div>
                      {(deg % 30 === 0) && (
                        <span className="text-[11px] mt-4 font-black text-white transform" style={{ transform: `rotate(${-deg}deg)` }}>
                          {label}
                        </span>
                      )}
                    </div>
                  );
               })}

               {/* HEADING BUG (CYAN) */}
               <div className="absolute inset-0 transition-transform duration-300" style={{ transform: `rotate(${headingBug}deg)` }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-3 bg-g1000-cyan/20 border-x-2 border-b-2 border-g1000-cyan rounded-b-sm shadow-[0_0_10px_cyan]"></div>
               </div>

               {/* COURSE NEEDLE (MAGENTA) */}
               <div className="absolute inset-0 transition-transform duration-300" style={{ transform: `rotate(${obs}deg)` }}>
                   {/* Top Arrow Head */}
                   <div className="absolute top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[20px] border-b-g1000-magenta shadow-[0_0_15px_magenta]"></div>
                   {/* Needle Stems */}
                   <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[3px] h-12 bg-g1000-magenta/60"></div>
                   <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[3px] h-12 bg-g1000-magenta/60"></div>
                   {/* Bottom Bar */}
                   <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-5 h-[3px] bg-g1000-magenta shadow-[0_0_5px_magenta]"></div>
                   
                   {/* SLIDING CDI SEGMENT */}
                   <div className="absolute top-1/2 left-1/2 h-24 w-[5px] bg-g1000-magenta shadow-[0_0_20px_magenta] transition-transform duration-500 ease-out" 
                        style={{ transform: `translate(calc(-50% + ${cdiDeflection * 70}px), -50%)` }}></div>
               </div>
            </div>

            {/* OVERLAY: DEVIATION DOTS & AIRCRAFT (STATIC) */}
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
               <div className="flex gap-8 items-center">
                  {/* Left Dots */}
                  <div className="flex gap-4">
                     <div className="w-2 h-2 rounded-full border-2 border-white/60"></div>
                     <div className="w-2 h-2 rounded-full border-2 border-white/60"></div>
                  </div>
                  {/* Center Circle (Aircraft Position) */}
                  <div className="w-12 h-12 rounded-full border-[3px] border-white/30 flex items-center justify-center">
                    <img 
                      src="https://lh3.googleusercontent.com/d/1ahthu2ZsyfNcYGsQPI9K9GiIxqM8JUI1" 
                      className="w-10 h-10 object-contain drop-shadow-[0_0_10px_white] filter brightness-150 contrast-125" 
                      alt="Aircraft"
                    />
                  </div>
                  {/* Right Dots */}
                  <div className="flex gap-4">
                     <div className="w-2 h-2 rounded-full border-2 border-white/60"></div>
                     <div className="w-2 h-2 rounded-full border-2 border-white/60"></div>
                  </div>
               </div>
               
               {/* GPS LABEL */}
               <div className="absolute left-1/4 top-1/2 -translate-y-1/2 font-black text-g1000-magenta text-sm tracking-widest opacity-80">GPS</div>
            </div>
          </div>

          {/* BOTTOM NAVIGATION INFO */}
          <div className="w-full flex justify-between px-6 mt-2">
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">DTK</span>
              <span className="text-g1000-magenta font-mono text-sm font-black">{obs.toString().padStart(3, '0')}°</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">NAV SRC</span>
              <span className="text-g1000-magenta font-black text-xs uppercase tracking-tighter">GPS Terminal</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-black flex flex-col font-mono text-white overflow-hidden relative">
      
      {/* INITIAL BRIEFING POPUP */}
      {isPaused && !showPassageExplanation && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-transparent pointer-events-auto">
           <div className="bg-black border-2 border-white p-4 shadow-[0_0_60px_rgba(0,0,0,1)] w-[300px] animate-pulse">
              <div className="flex items-center gap-2 mb-3">
                 <div className="p-0.5 bg-white text-black rounded-sm flex items-center justify-center overflow-hidden">
                    <img src="https://lh3.googleusercontent.com/d/1ahthu2ZsyfNcYGsQPI9K9GiIxqM8JUI1" className="w-4 h-4 object-contain" alt="HSI Icon" />
                 </div>
                 <span className="text-[10px] font-black tracking-[0.3em] uppercase">Initial Briefing</span>
              </div>
              <div className="space-y-3 mb-5">
                 <p className="text-[11px] font-bold text-white leading-tight uppercase">
                    INTERCEPT <span className="text-g1000-cyan">RADIAL 180</span>.
                 </p>
                 <p className="text-[9px] text-zinc-400 uppercase font-black tracking-widest leading-tight">
                    CENTER CDI NEEDLE. CORRECT FOR CROSSWIND.
                 </p>
              </div>
              <button 
                onClick={() => setIsPaused(false)}
                className="w-full bg-white text-black py-2 text-[10px] font-black tracking-[0.4em] uppercase hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                CONTINUE
              </button>
           </div>
        </div>
      )}

      {/* STATION PASSAGE TUTORIAL ANIMATION */}
      {showPassageExplanation && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in pointer-events-auto">
            <div className="max-w-4xl w-full bg-[#111] border-2 border-g1000-cyan/50 p-8 rounded-3xl shadow-[0_0_80px_rgba(0,255,255,0.2)] flex flex-col md:flex-row gap-8 items-center">
                
                {/* Visual Demo Side */}
                <div className="w-full md:w-1/2 flex flex-col items-center gap-6">
                    <div className="relative w-48 h-48 bg-black rounded-full border-4 border-zinc-800 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {/* Animated Flag */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Active Indicaion</div>
                                <div className="relative h-12 w-24 flex items-center justify-center bg-zinc-900 rounded border border-white/10 overflow-hidden">
                                    <div className="flex flex-col items-center transition-transform duration-[2000ms] ease-in-out animate-[passage-flag_5s_infinite_alternate]">
                                        <span className="text-g1000-green font-black text-lg py-2">TO</span>
                                        <div className="h-4 w-full bg-red-600/50 flex items-center justify-center"><span className="text-[8px] font-black">OFF / NAV</span></div>
                                        <span className="text-g1000-amber font-black text-lg py-2">FROM</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Moving needle mock */}
                            <div className="absolute h-32 w-1 bg-g1000-cyan animate-[passage-cdi_3s_infinite_alternate] shadow-[0_0_10px_cyan]"></div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="flex items-center gap-2 mb-2">
                            <Plane className="w-4 h-4 text-g1000-cyan animate-bounce" />
                            <span className="text-[11px] font-black text-white uppercase tracking-widest">Entering Cone of Confusion</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 max-w-[280px]">Directly above the station, signals disappear. The instrument will show 'OFF' or fluctuate before flipping the flag.</p>
                    </div>
                </div>

                {/* Description Side */}
                <div className="w-full md:w-1/2 space-y-6">
                    <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                        <div className="p-2 bg-g1000-cyan/20 rounded-lg"><Info className="w-6 h-6 text-g1000-cyan" /></div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-widest uppercase">Station Passage</h3>
                            <p className="text-[10px] text-g1000-cyan font-bold tracking-widest uppercase">Transition: Inbound &rarr; Outbound</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                            <h4 className="text-[11px] font-black text-g1000-green uppercase mb-1 tracking-widest">1. THE INDICATOR FLIP</h4>
                            <p className="text-xs text-zinc-400 leading-relaxed">As you cross the VOR, your instrument automatically detects that you are no longer flying <span className="text-g1000-green font-bold italic">TO</span> the station. The indicator triangle will flip to <span className="text-g1000-amber font-bold italic">FROM</span>.</p>
                        </div>
                        <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                            <h4 className="text-[11px] font-black text-g1000-amber uppercase mb-1 tracking-widest">2. REVERSE SENSING (Analog)</h4>
                            <p className="text-xs text-zinc-400 leading-relaxed">If you were using an analog VOR and didn't rotate the OBS, your needle would now be 'reverse sensing'. Luckily, on a Glass HSI, the needle always points the right way as long as you fly the course!</p>
                        </div>
                        <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                            <h4 className="text-[11px] font-black text-g1000-cyan uppercase mb-1 tracking-widest">3. TWIST - TURN - TRACK</h4>
                            <p className="text-xs text-zinc-400 leading-relaxed">Standard Procedure: <span className="font-bold text-white">TWIST</span> the OBS for the new course, <span className="font-bold text-white">TURN</span> to heading, and <span className="font-bold text-white">TRACK</span> the outbound radial.</p>
                        </div>
                    </div>

                    <button 
                      onClick={closeExplanation}
                      className="w-full bg-white text-black py-4 rounded-xl font-black tracking-[0.4em] uppercase hover:bg-g1000-cyan transition-all active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
                    >
                      RESUME OUTBOUND
                    </button>
                </div>
            </div>
            
            <style>{`
                @keyframes passage-flag {
                    0% { transform: translateY(0px); }
                    30% { transform: translateY(0px); }
                    45% { transform: translateY(-44px); }
                    55% { transform: translateY(-44px); }
                    70% { transform: translateY(-88px); }
                    100% { transform: translateY(-88px); }
                }
                @keyframes passage-cdi {
                    0% { transform: translateX(-30px); }
                    40% { transform: translateX(30px); }
                    50% { transform: translateX(0); opacity: 0.3; }
                    60% { transform: translateX(-40px); opacity: 1; }
                    100% { transform: translateX(40px); }
                }
            `}</style>
        </div>
      )}

      {/* LEFT COCKPIT SIDEBAR (HUD) */}
      <div className="absolute top-8 left-8 z-50 flex flex-col gap-4 max-h-[90%] overflow-y-auto no-scrollbar">
         <button 
           onClick={onExit}
           className="bg-zinc-900/95 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-3 hover:bg-zinc-800 transition-all text-[11px] font-black tracking-[0.2em] uppercase shadow-2xl group w-fit"
         >
            <ChevronLeft className="w-4 h-4 text-g1000-cyan group-hover:-translate-x-1 transition-transform" />
            End Training
         </button>
         
         <div className="bg-black/80 backdrop-blur-md border border-white/5 p-4 rounded-2xl text-[10px] space-y-3 w-56 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
               <span className="text-zinc-500 font-black tracking-widest uppercase">System Link</span>
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-g1000-green shadow-[0_0_10px_#00FF00] animate-pulse"></div>
               </div>
            </div>
            <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                   <span className="text-zinc-400 font-bold uppercase tracking-tighter">HDG</span>
                   <span className="text-g1000-cyan font-black text-sm">{Math.round(heading).toString().padStart(3, '0')}°</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-zinc-400 font-bold uppercase tracking-tighter">SPD</span>
                   <span className="text-g1000-green font-black text-sm">{(velocity * 100).toFixed(0)} <span className="text-[8px] opacity-60 font-black">KTS</span></span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-zinc-400 font-bold uppercase tracking-tighter">DME</span>
                   <span className="text-g1000-green font-black text-sm">{currentDme} <span className="text-[8px] opacity-60 font-black">NM</span></span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
                   <span className="text-zinc-400 font-bold uppercase tracking-tighter">RAD</span>
                   <span className="text-g1000-amber font-black text-sm">{radial.toString().padStart(3, '0')}°</span>
                </div>
            </div>
         </div>

         {/* THROTTLE UNIT */}
         <div className="bg-zinc-900/95 backdrop-blur-md border border-white/10 p-4 rounded-3xl flex flex-col items-center gap-3 shadow-2xl w-56">
            <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Throttle Control</span>
            <div className="flex items-center gap-6">
              <button onMouseDown={() => handleThrottle('up')} className="p-2.5 bg-zinc-800 hover:bg-g1000-green/20 hover:text-g1000-green border border-white/5 rounded-xl transition-all active:scale-90">
                 <ArrowUp className="w-4 h-4" />
              </button>
              <div className="h-16 w-1.5 bg-black rounded-full relative overflow-hidden">
                  <div className="absolute bottom-0 w-full bg-g1000-green transition-all duration-300" style={{ height: `${(velocity / 5) * 100}%` }}></div>
              </div>
              <button onMouseDown={() => handleThrottle('down')} className="p-2.5 bg-zinc-800 hover:bg-red-500/20 hover:text-red-500 border border-white/5 rounded-xl transition-all active:scale-90">
                 <ArrowDown className="w-4 h-4" />
              </button>
            </div>
         </div>

         {/* CONDITIONAL INSTRUMENT RENDERER */}
         {renderInstrument()}

      </div>

      {/* DEFLECTION CAUTION BOX (BOTTOM CENTER OF SCREEN) */}
      {Math.abs(cdiDeflection) > 0.05 && !isPaused && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[60] animate-fade-in pointer-events-none">
           <div className="bg-black/90 border-2 border-red-600 p-4 shadow-[0_0_40px_rgba(255,0,0,0.4)] flex flex-col items-center gap-2 min-w-[280px] backdrop-blur-md rounded-2xl">
              <div className="flex items-center gap-2 text-red-500 font-black tracking-[0.2em] uppercase text-[9px]">
                 <AlertCircle className="w-4 h-4 animate-pulse" /> NAVIGATION ALERT: WIND DRIFT
              </div>
              <div className="text-white text-[11px] font-black uppercase tracking-[0.05em] text-center leading-tight">
                 {cdiDeflection > 0 
                   ? "NEEDLE DEFLECTED RIGHT\nSTEER RIGHT TO INTERCEPT" 
                   : "NEEDLE DEFLECTED LEFT\nSTEER LEFT TO INTERCEPT"}
              </div>
           </div>
        </div>
      )}

      {/* STATION PASSAGE ALERT */}
      {passageAlert && (
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] animate-bounce">
            <div className="bg-g1000-cyan text-black px-8 py-4 rounded-xl font-black tracking-widest uppercase shadow-[0_0_50px_cyan]">
               Station Passage Detected
            </div>
         </div>
      )}

      {/* RIGHT SIDEBAR (GOALS & STEERING) */}
      <div className="absolute top-8 right-8 z-50 flex flex-col items-end gap-6">
        <div className="bg-zinc-950/90 border border-white/10 p-6 rounded-[2rem] shadow-2xl max-w-[280px] animate-fade-in relative overflow-hidden backdrop-blur-md">
           <div className="absolute top-0 right-0 w-24 h-24 bg-g1000-cyan/5 blur-3xl rounded-full"></div>
           <div className="flex items-center gap-3 mb-4 relative">
              <div className="p-2.5 bg-g1000-cyan/10 rounded-xl">
                <Target className="w-4 h-4 text-g1000-cyan animate-pulse" />
              </div>
              <span className="text-xs font-black tracking-[0.2em] uppercase text-white">In-Flight Goals</span>
           </div>
           <div className="space-y-3">
              <div className="flex items-center justify-end gap-3">
                 <span className={`text-[10px] font-black uppercase tracking-widest ${phase === 'INBOUND' ? 'text-g1000-cyan' : 'text-zinc-500 line-through'}`}>1. Inbound Radial 180</span>
                 <div className={`w-2 h-2 rounded-full ${phase === 'OUTBOUND' ? 'bg-g1000-green' : 'bg-zinc-800'}`}></div>
              </div>
              <div className="flex items-center justify-end gap-3">
                 <span className={`text-[10px] font-black uppercase tracking-widest ${phase === 'OUTBOUND' ? 'text-g1000-cyan' : 'text-zinc-500'}`}>2. Outbound Radial 360</span>
                 <div className="w-2 h-2 rounded-full bg-zinc-800"></div>
              </div>
           </div>
           <p className="text-[11px] text-zinc-400 leading-relaxed font-bold relative text-right mt-4 pt-4 border-t border-white/5">
              Current Mission: <span className="text-g1000-amber uppercase">{phase}</span><br/>
              Align <span className={`${type === 'HSI' ? 'text-g1000-magenta' : 'text-g1000-amber'} font-black`}>CDI NEEDLE</span>.
           </p>
        </div>

        <div className="flex gap-4">
           <button onMouseDown={() => handleSteer('left')} className="w-16 h-16 bg-zinc-900/95 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-g1000-cyan/20 hover:border-g1000-cyan transition-all active:scale-90 shadow-2xl group backdrop-blur-sm">
              <ArrowLeft className="w-8 h-8 text-zinc-500 group-hover:text-g1000-cyan" />
           </button>
           <button onMouseDown={() => handleSteer('right')} className="w-16 h-16 bg-zinc-900/95 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-g1000-cyan/20 hover:border-g1000-cyan transition-all active:scale-90 shadow-2xl group backdrop-blur-sm">
              <ArrowRight className="w-8 h-8 text-zinc-500 group-hover:text-g1000-cyan" />
           </button>
        </div>
      </div>

      {/* WORLD VIEW CANVAS */}
      <div className="flex-1 relative">
         <canvas ref={canvasRef} width={800} height={600} className="w-full h-full cursor-crosshair" />
         <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]"></div>
      </div>
      
    </div>
  );
};

export default VORSimulator;