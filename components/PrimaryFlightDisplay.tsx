import React, { useState, useEffect } from 'react';
import { Wind, Plane } from 'lucide-react';
import { Page } from '../types.ts';
import SimulatorRoom from './SimulatorRoom.tsx';
import ExamTerminal from './ExamTerminal.tsx';
import Forum from './Forum.tsx';
import UserProfile from './UserProfile.tsx';
import ProgramHandbook from './ProgramHandbook.tsx';
import BlackBox from './BlackBox.tsx';

interface PrimaryFlightDisplayProps {
    activePage: Page;
    subPageId?: string | number | null;
    isMiniMfdOpen: boolean;
    setIsMiniMfdOpen: (isOpen: boolean) => void;
    onSelectSubPage: (id: string | number) => void;
}

const PrimaryFlightDisplay: React.FC<PrimaryFlightDisplayProps> = ({ activePage, subPageId, isMiniMfdOpen, setIsMiniMfdOpen, onSelectSubPage }) => {
  // Simulated flight data state
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [heading, setHeading] = useState(360);
  const [altitude, setAltitude] = useState(5500);
  const [airspeed, setAirspeed] = useState(110);

  // Simple animation loop to make it feel alive
  useEffect(() => {
    const interval = setInterval(() => {
        const time = Date.now() / 1000;
        setPitch(Math.sin(time * 0.5) * 2); // +/- 2 degrees
        setRoll(Math.sin(time * 0.3) * 3);  // +/- 3 degrees
        setAltitude(5500 + Math.sin(time * 0.2) * 20);
        setAirspeed(110 + Math.sin(time * 0.8) * 2);
        setHeading((prev) => (prev + 0.1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
      switch (activePage) {
          case Page.HANDBOOK: return <ProgramHandbook selectedChapterId={subPageId} />;
          case Page.EXAMS: return <ExamTerminal examId={subPageId} />;
          case Page.SIMULATOR: return <SimulatorRoom />;
          case Page.COMMS: return (
               <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-black">
                  <div className="text-g1000-cyan font-mono text-sm mb-2">ACTIVE FREQ</div>
                  <div className="text-6xl text-g1000-green font-mono font-bold tracking-widest border-2 border-g1000-darkgray p-4 rounded bg-g1000-darkgray/20 shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
                     121.500
                  </div>
                  <div className="mt-4 text-g1000-white font-mono text-xs">GUARD MONITORING ENABLED</div>
               </div>
          );
          case Page.FORUM: return <Forum postId={subPageId} />;
          case Page.BLACKBOX: return <BlackBox />;
          case Page.PROFILE: return <UserProfile />;
          case Page.PFD:
          default: 
            // This is shown if the user is on the PFD but hasn't selected a specific item from a list module
            return (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 font-mono text-xs">
                    <p>NO SUB-PAGE SELECTED</p>
                    <p>USE MFD TO SELECT A TOPIC</p>
                </div>
            );
      }
  };
  
  const handleMiniMfdSelect = (id: string | number) => {
    onSelectSubPage(id);
    setIsMiniMfdOpen(false); // Close menu on selection
  };

  const renderMiniMfdContent = () => {
    switch (activePage) {
        case Page.FORUM:
            return <Forum onSelectSubPage={handleMiniMfdSelect} isMini={true} />;
        case Page.HANDBOOK:
            return <ProgramHandbook onSelectChapter={handleMiniMfdSelect} isMini={true} />;
        case Page.EXAMS:
            return <ExamTerminal onSelectExam={handleMiniMfdSelect} isMini={true} />;
        default:
            return null;
    }
  };

  const showInstruments = activePage === Page.PFD || (!subPageId && [Page.HANDBOOK, Page.EXAMS, Page.FORUM].includes(activePage));

  return (
    <div className="w-full h-full bg-black relative flex flex-col font-mono text-white select-none">
        
        {isMiniMfdOpen && (
            <div className="absolute top-0 left-0 w-[320px] h-full bg-black/80 backdrop-blur-md z-40 border-r-2 border-g1000-cyan/50 shadow-2xl animate-slide-in-left">
                {renderMiniMfdContent()}
            </div>
        )}

        {showInstruments ? (
        <div className="h-full relative w-full overflow-hidden shrink-0">
            {/* Top Status Bar */}
            <div className="absolute top-0 w-full h-6 bg-[#1a1a1a] border-b border-white/20 flex justify-between items-center px-4 z-20 shadow-lg">
                <div className="flex gap-4">
                    <div className="text-g1000-cyan font-bold text-xs">NAV1 <span className="text-g1000-green text-sm">113.50</span></div>
                    <div className="text-zinc-400 text-xs flex items-center gap-1">WPT <span className="text-white">LAX</span></div>
                </div>
                <div className="flex gap-4 text-g1000-magenta font-bold tracking-widest text-xs">
                    <span>GPS ENR</span>
                </div>
                <div className="flex gap-4">
                    <div className="text-g1000-cyan font-bold text-right text-xs">NAV2 <span className="text-zinc-400 text-sm">108.00</span></div>
                </div>
            </div>

            {/* ATTITUDE INDICATOR (Background) */}
            <div className="absolute inset-0 z-0">
                <div 
                    className="w-[200%] h-[200%] absolute top-[-50%] left-[-50%] origin-center"
                    style={{ transform: `rotate(${-roll}deg) translateY(${pitch * 4}px)` }}
                >
                    <div className="w-full h-1/2 bg-gradient-to-b from-[#4F8DCE] to-[#2E5C9A] border-b-2 border-white"></div> {/* Sky */}
                    <div className="w-full h-1/2 bg-gradient-to-b from-[#8B4513] to-[#5D2B0C]"></div> {/* Ground */}
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="space-y-12 opacity-90">
                            <div className="w-32 h-px bg-white/70 flex justify-between items-center">
                                <span className="text-[10px] -ml-4">10</span>
                                <span className="text-[10px] -mr-4">10</span>
                            </div>
                            <div className="w-16 h-px bg-white/70"></div>
                            <div className="w-32 h-px bg-white/70 flex justify-between items-center">
                                <span className="text-[10px] -ml-4">10</span>
                                <span className="text-[10px] -mr-4">10</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none scale-75">
                    <div className="relative w-64 h-2 flex items-center justify-center">
                        <div className="w-2 h-2 bg-black rounded-full absolute"></div>
                        <div className="w-20 h-1.5 bg-g1000-amber border border-black shadow-lg rounded-full"></div> 
                        <div className="absolute left-0 w-20 h-1.5 bg-g1000-amber border border-black shadow-lg rounded-full"></div> 
                        <div className="absolute right-0 w-20 h-1.5 bg-g1000-amber border border-black shadow-lg rounded-full"></div> 
                    </div>
                    <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[16px] border-b-white drop-shadow-md"></div>
                    <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full border-t-2 border-white/60"></div>
                </div>
            </div>

            {/* AIRSPEED TAPE (Left) */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[70%] w-20 bg-black/40 backdrop-blur-md border-r border-white/30 overflow-hidden z-10 flex flex-col items-end py-2 shadow-2xl">
                <div className="absolute top-0 w-full h-6 bg-[#111] border-b border-white text-g1000-magenta text-center text-[10px] font-bold pt-1 tracking-wider">
                    TAS {Math.round(airspeed + 2)}
                </div>
                <div className="flex-1 w-full relative overflow-hidden my-4">
                    <div className="absolute right-0 w-2 h-full bg-zinc-800/80 border-l border-white/10"></div>
                    <div className="absolute top-1/2 -translate-y-1/2 right-0 w-16 h-10 bg-black border-2 border-white flex items-center justify-center text-xl font-bold z-20 shadow-xl">
                        {Math.round(airspeed)}
                    </div>
                    <div className="absolute right-0 top-1/2 w-full" style={{ transform: `translateY(${(airspeed % 10) * 5}px)` }}>
                        {[-60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60].map(offset => (
                            <div key={offset} className="absolute right-0 h-px bg-white w-3 flex items-center justify-end pr-5" style={{ top: `${offset * 5}px` }}>
                                <span className="text-xs font-bold mr-1 text-white drop-shadow-md">{ (Math.round(airspeed / 10) * 10 - offset * 2) }</span>
                            </div>
                        ))}
                    </div>
                    <div className="absolute bottom-0 right-0 w-2 h-32 bg-[repeating-linear-gradient(45deg,red,red_5px,white_5px,white_10px)] opacity-80"></div>
                </div>
            </div>

            {/* ALTIMETER TAPE (Right) */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[70%] w-24 bg-black/40 backdrop-blur-md border-l border-white/30 overflow-hidden z-10 flex flex-col items-start py-2 shadow-2xl">
                <div className="absolute top-0 w-full h-6 bg-[#111] border-b border-white text-g1000-cyan text-center text-[10px] font-bold pt-1 tracking-wider">
                    29.92 IN
                </div>
                <div className="flex-1 w-full relative overflow-hidden my-4">
                    <div className="absolute left-0 w-2 h-full bg-zinc-800/80 border-r border-white/10"></div>
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 w-20 h-10 bg-black border-2 border-white flex items-center justify-center text-xl font-bold z-20 shadow-xl">
                        {Math.round(altitude)}
                    </div>
                    <div className="absolute top-[30%] left-0 w-2 h-4 bg-g1000-cyan border border-white/50"></div>
                    <div className="absolute left-0 top-1/2 w-full" style={{ transform: `translateY(${(altitude % 100) / 2}px)` }}>
                        {[-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100].map(offset => (
                            <div key={offset} className="absolute left-0 h-px bg-white w-3 flex items-center justify-start pl-5" style={{ top: `${offset * 3}px` }}>
                                <span className="text-xs font-bold ml-1 text-white drop-shadow-md">{ (Math.round(altitude / 100) * 100 - offset * 10) }</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* HSI (Bottom Center - Small version) */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-48 h-24 z-10 overflow-hidden">
                <div className="w-full h-full relative flex flex-col items-center">
                    <div className="bg-black border border-white px-2 py-0.5 rounded text-lg font-bold mb-1 shadow-lg z-20">
                        {`${Math.round(heading)}`.padStart(3, '0')}°
                    </div>
                    {/* FIXED: Removed transition-transform to prevent 360-degree flip animation crossing North */}
                    <div className="w-48 h-48 rounded-full bg-[#111]/80 border-2 border-white/30 flex items-start justify-center relative shadow-2xl overflow-hidden -mb-32">
                        <div className="w-full h-full relative" style={{ transform: `rotate(${-heading}deg)` }}>
                            {[0, 90, 180, 270].map(deg => (
                                <div key={deg} className="absolute top-0 left-1/2 h-full w-0.5 origin-bottom" style={{ transform: `translateX(-50%) rotate(${deg}deg)` }}>
                                    <div className="w-0.5 h-3 bg-white"></div>
                                    <span className="absolute top-4 left-1/2 -translate-x-1/2 text-sm font-bold text-white transform" style={{ transform: `rotate(${-deg}deg)` }}>
                                        {deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : deg === 270 ? 'W' : ''}
                                    </span>
                                </div>
                            ))}
                            {[30, 60, 120, 150, 210, 240, 300, 330].map(deg => (
                                <div key={deg} className="absolute top-0 left-1/2 h-full w-px origin-bottom" style={{ transform: `translateX(-50%) rotate(${deg}deg)` }}>
                                    <div className="w-px h-2 bg-white/70"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
                        <Plane className="w-6 h-6 text-g1000-amber drop-shadow-lg fill-current" />
                    </div>
                </div>
            </div>
            
            <div className="absolute bottom-4 left-4 w-24 h-16 bg-black/60 backdrop-blur-sm border border-white/20 p-2 z-10 rounded shadow-xl">
                <div className="flex items-center gap-1 mb-1">
                    <Wind className="w-3 h-3 text-white" />
                    <span className="text-xs font-bold">270° <span className="text-[10px] text-g1000-cyan">12</span></span>
                </div>
                <div className="flex justify-between text-[9px]">
                    <span className="text-zinc-400">OAT</span>
                    <span className="text-white font-bold">15°C</span>
                </div>
            </div>
            {/* Display fallback content if applicable */}
            {renderContent()}
        </div>
        ) : (
        <div className="flex-1 h-full overflow-hidden relative bg-[#050505] flex">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent z-10 pointer-events-none"></div>
            <div className="flex-1 h-full overflow-y-auto overflow-x-hidden scroll-smooth custom-scrollbar">
                {renderContent()}
            </div>
        </div>
        )}

    </div>
  );
};

export default PrimaryFlightDisplay;