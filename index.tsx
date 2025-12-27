import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import SimulatorRoom from './components/SimulatorRoom';
import ExamTerminal from './components/ExamTerminal';
import Forum from './components/Forum';
import UserProfile from './components/UserProfile';
import ProgramHandbook from './components/ProgramHandbook';
import BlackBox from './components/BlackBox';
import LandingPage from './components/LandingPage';
import PrimaryFlightDisplay from './components/PrimaryFlightDisplay';
import { Page } from './types';
import { Volume2, Power, ChevronLeft, ChevronRight, Settings2, SlidersHorizontal } from 'lucide-react';
import { playSound } from './services/audioService';

type ScreenView = 'PFD' | 'MFD';

const WelcomeScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const handleStart = (e: KeyboardEvent | MouseEvent) => {
            if (isExiting) return;
            setIsExiting(true);
            playSound('click');
            setTimeout(onStart, 800);
        };

        window.addEventListener('keydown', handleStart);
        window.addEventListener('mousedown', handleStart);

        return () => {
            window.removeEventListener('keydown', handleStart);
            window.removeEventListener('mousedown', handleStart);
        };
    }, [onStart, isExiting]);

    return (
        <div className={`relative h-full w-full bg-[#050505] z-10 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-700 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div 
                className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,100,255,0.3),rgba(255,255,255,0))] opacity-50"
                style={{ animation: 'pulseGlow 5s infinite ease-in-out' }}
            ></div>
             <div 
                className="absolute inset-0 bg-[linear-gradient(90deg,transparent_49%,rgba(255,255,255,0.05)_50%,transparent_51%)] bg-[size:200%_100%] animate-sweep-grid opacity-30"
            ></div>

            <div className="relative text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <div className="flex flex-col items-center justify-center mb-12">
                    <div className="text-g1000-white font-mono text-5xl font-bold tracking-widest leading-none" style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.3)'}}>WingMentor</div>
                    <div className="text-g1000-gray font-mono text-lg font-bold tracking-[0.4em] mt-3">W1000</div>
                </div>
                <div className="mt-24 text-lg text-zinc-300 font-mono tracking-wider animate-pulse-glow" style={{ animationDelay: '1s' }}>
                    PRESS ANY KEY TO START
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [hasLaunched, setHasLaunched] = useState(false);
  const [currentView, setCurrentView] = useState<ScreenView>('MFD');
  const [activeModule, setActiveModule] = useState<Page>(Page.DASHBOARD);
  const [subPageId, setSubPageId] = useState<string | number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [avionicsOn, setAvionicsOn] = useState(true);
  const [isMiniMfdOpen, setIsMiniMfdOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showSidePanel, setShowSidePanel] = useState(true);

  useEffect(() => {
    if (!hasLaunched) return;
    
    setIsLoading(true);
    setLoadingProgress(0);
    
    const timer = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setIsLoading(false), 800);
          return 100;
        }
        return prev + Math.random() * 8;
      });
    }, 40);

    return () => clearInterval(timer);
  }, [hasLaunched]);

  const handleMenuSelection = (page: Page) => {
      setActiveModule(page);
      setSubPageId(null);
      setIsMiniMfdOpen(false);

      if (page === Page.DASHBOARD) {
        setCurrentView('MFD');
        return;
      }

      const directToPfdModules = [Page.SIMULATOR, Page.BLACKBOX, Page.PROFILE, Page.COMMS, Page.PFD];
      if (directToPfdModules.includes(page)) {
        setCurrentView('PFD');
      } else {
        setCurrentView('MFD');
      }
  };

  const handleSubPageSelection = (id: string | number) => {
      setSubPageId(id);
      setCurrentView('PFD');
      setIsMiniMfdOpen(true);
  };
  
  const renderMfdContent = () => {
    switch (activeModule) {
        case Page.DASHBOARD:
            return <Dashboard setPage={handleMenuSelection} />;
        case Page.FORUM:
            return <Forum onSelectSubPage={handleSubPageSelection} />;
        case Page.HANDBOOK:
            return <ProgramHandbook onSelectChapter={handleSubPageSelection} />;
        case Page.EXAMS:
            return <ExamTerminal onSelectExam={handleSubPageSelection} />;
        default:
            return (
                <div className="h-full w-full bg-black text-white font-mono flex flex-col items-center justify-center p-2">
                    <span className="text-g1000-amber font-bold mb-4 text-lg">MODULE ACTIVE</span>
                    <p className="text-zinc-400 text-center mb-6">Content is displayed on the PFD.<br/>Use the arrow or press MENU to return.</p>
                    <button onClick={() => { setCurrentView('PFD'); }} className="bg-white/10 border border-white/30 px-4 py-2 hover:bg-white/20 text-sm">VIEW ON PFD</button>
                </div>
            );
    }
  }
  
  const renderScreenContent = () => {
    if (!avionicsOn) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-[#050505]">
          <div className="text-zinc-800 font-mono text-sm tracking-[0.5em] mb-4">SYSTEM POWER OFF</div>
          <div className="text-zinc-900 font-mono text-xs">PRESS MASTER SWITCH</div>
        </div>
      );
    }
    
    if (isLoading) {
      return (
        <div className="h-full w-full bg-[#050505] flex flex-col items-center justify-center overflow-hidden">
          <div className="flex flex-col items-center justify-center mb-6 animate-fade-in">
              <div className="text-g1000-white font-mono text-3xl font-bold tracking-widest leading-none">WingMentor</div>
              <div className="text-g1000-gray font-mono text-sm font-bold tracking-[0.3em] mt-2">W1000</div>
          </div>
          <div className="w-64 h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-4 animate-fade-in">
              <div className="h-full bg-g1000-green transition-all duration-100" style={{ width: `${loadingProgress}%` }} />
          </div>
          <div className="mt-4 text-[10px] text-zinc-500 font-mono animate-fade-in tracking-widest uppercase">Initializing Avionics...</div>
        </div>
      );
    }

    if (showWelcome) {
      return <WelcomeScreen onStart={() => setShowWelcome(false)} />;
    }

    return (
      <div className="h-full w-full relative">
        {currentView === 'MFD' && renderMfdContent()}
        {currentView === 'PFD' && (
            <PrimaryFlightDisplay 
                  activePage={activeModule} 
                  subPageId={subPageId}
                  isMiniMfdOpen={isMiniMfdOpen}
                  setIsMiniMfdOpen={setIsMiniMfdOpen}
                  onSelectSubPage={handleSubPageSelection}
            />
        )}
      </div>
    );
  };


  if (!hasLaunched) {
    return <LandingPage onEnter={() => { playSound('click'); setHasLaunched(true); }} />;
  }

  const Screw = ({ className }: { className?: string }) => <div className={`screw opacity-70 ${className}`}></div>;

  return (
    <div className="h-screen w-screen bg-[#1a1a1d] material-plastic overflow-hidden flex flex-col relative shadow-[inset_0_0_150px_rgba(0,0,0,1)] animate-fade-in">
        
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] z-10"></div>
        
        <Screw className="absolute top-4 left-4 z-50" />
        <Screw className="absolute top-4 right-4 z-50" />
        <Screw className="absolute bottom-4 left-4 z-50" />
        <Screw className="absolute bottom-4 right-4 z-50" />

        {currentView === 'MFD' && activeModule !== Page.DASHBOARD && subPageId && (
            <button 
                onClick={() => { playSound('click'); setCurrentView('PFD'); }}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-[60] bg-[#111] border-y-2 border-r-2 border-black p-4 rounded-r-xl shadow-xl hover:bg-[#222] group transition-all active:scale-95"
            >
                <div className="text-[9px] text-zinc-500 font-mono mb-1 rotate-90 origin-center absolute -right-4 top-1/2 -translate-y-1/2 w-12 tracking-tighter uppercase">View PFD</div>
                <ChevronLeft className="w-8 h-8 text-g1000-cyan group-hover:scale-110 transition-transform" />
            </button>
        )}

        {currentView === 'PFD' && (
            <button 
                onClick={() => { playSound('click'); setCurrentView('MFD'); }}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-[60] bg-[#111] border-y-2 border-r-2 border-black p-4 rounded-r-xl shadow-xl hover:bg-[#222] group transition-all active:scale-95"
            >
                <div className="text-[9px] text-zinc-500 font-mono mb-1 rotate-90 origin-center absolute -right-4 top-1/2 -translate-y-1/2 w-12 tracking-tighter uppercase">View MFD</div>
                <ChevronLeft className="w-8 h-8 text-g1000-cyan group-hover:scale-110 transition-transform" />
            </button>
        )}

        <div className="h-16 w-full bg-gradient-to-b from-[#252529] via-[#1a1a1d] to-[#121214] border-b-2 border-black/90 shadow-[0_4px_10px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)] flex items-center justify-between px-6 shrink-0 relative z-20">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10 opacity-50"></div>
            
            <div className="flex items-center gap-6 ml-12">
                <div className="flex flex-col">
                    <span className="text-[9px] text-zinc-500 font-bold tracking-widest ml-1 mb-0.5 uppercase">Com1 Vol / Sq</span>
                    <div className="flex items-center gap-2">
                        <div onClick={() => playSound('click')} className="w-8 h-8 rounded-full bg-[#111] border border-black shadow-knob flex items-center justify-center material-rubber relative group cursor-pointer active:scale-90 transition-transform">
                           <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/5 to-transparent opacity-20"></div>
                           <Volume2 className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[6px] text-g1000-cyan font-bold tracking-widest ml-1">ACT</span>
                           <div className="bg-black px-3 py-1 rounded-sm border border-zinc-700 text-g1000-cyan font-mono text-xl font-bold shadow-[inset_0_0_15px_rgba(0,0,0,1)]">118.500</div>
                        </div>
                        <div className="flex flex-col opacity-60">
                           <span className="text-[6px] text-zinc-400 font-bold tracking-widest ml-1">STBY</span>
                           <div className="bg-[#111] px-3 py-1 rounded-sm border border-zinc-800 text-zinc-500 font-mono text-xl font-bold">124.850</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center border-x-2 border-black/90 px-10 h-full bg-gradient-to-br from-[#202024] via-[#121214] to-[#08080a] shadow-[inset_0_8px_16px_rgba(0,0,0,0.9),0_1px_1px_rgba(255,255,255,0.05)] relative overflow-hidden group mx-4 rounded-b-lg">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-white/5 opacity-30"></div>
                <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]"></div>

                <div className="flex flex-col items-center relative z-10">
                    <div className="text-zinc-300 font-black text-sm leading-none tracking-[0.25em] uppercase" 
                         style={{ textShadow: '0 -1px 1px rgba(0,0,0,0.8), 0 1px 1px rgba(255,255,255,0.1)' }}>
                        WingMentor
                    </div>
                    <div className="text-zinc-600 font-bold text-[7px] tracking-[0.45em] mt-2 opacity-70 uppercase">
                        W1000 NXi
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 mr-12">
                <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded border border-white/5 shadow-[inset_0_1px_5px_rgba(0,0,0,0.8)]">
                        <div className="w-2 h-2 bg-g1000-green rounded-full shadow-led-glow animate-pulse"></div>
                        <span className="text-[9px] font-mono text-zinc-400 font-bold">MSG</span>
                    </div>
                 <div className="flex flex-col items-center group cursor-pointer" onClick={() => { playSound('click'); setAvionicsOn(!avionicsOn); }}>
                     <span className="text-[8px] font-mono text-zinc-500 font-bold mb-0.5 uppercase tracking-wider">Avionics</span>
                     <div className={`w-8 h-8 rounded-full bg-[#111] border-2 shadow-knob flex items-center justify-center material-rubber hover:brightness-110 active:scale-95 transition-all ${avionicsOn ? 'border-red-900/40' : 'border-black'}`}>
                        <Power className={`w-3.5 h-3.5 transition-colors ${avionicsOn ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'text-zinc-800'}`} />
                     </div>
                 </div>
            </div>
        </div>
        
        <div className="flex-1 relative mx-4 my-2 flex flex-col min-h-0">
          <div className="bezel-frame flex-1 flex p-[3px] bg-gradient-to-br from-[#333] via-[#111] to-[#000] shadow-[0_10px_40px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <div className="relative bg-[#050505] rounded-sm flex-1 overflow-hidden flex flex-col shadow-[inset_0_0_50px_rgba(0,0,0,1)]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20 z-[45] pointer-events-none"></div>
              <div className="screen-reflection absolute inset-0 z-40 pointer-events-none"></div>
              <div className="pixel-grid absolute inset-0 z-30 pointer-events-none"></div>
              <div className="screen-vignette absolute inset-0 z-30 pointer-events-none"></div>

              <div className={`flex-1 relative bg-aviation-screen overflow-hidden ${avionicsOn ? 'lcd-glow' : ''}`}>
                  <div className="absolute inset-0 z-20 overflow-hidden">
                     {renderScreenContent()}
                  </div>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => { playSound('click'); setShowSidePanel(!showSidePanel); }}
          className={`absolute ${showSidePanel ? 'right-24' : 'right-2'} top-1/2 -translate-y-1/2 z-[60] bg-[#1a1a1d] border-2 border-black/80 w-10 h-24 rounded-l-md shadow-2xl flex flex-col items-center justify-center gap-1 transition-all duration-500 group active:scale-95 overflow-hidden`}
        >
           <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-black/30 pointer-events-none"></div>
           <span className="text-[7px] font-mono text-zinc-500 font-black uppercase rotate-90 tracking-widest mb-2 whitespace-nowrap">Controls</span>
           {showSidePanel ? (
             <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-g1000-cyan transition-colors" />
           ) : (
             <SlidersHorizontal className="w-5 h-5 text-zinc-500 group-hover:text-g1000-cyan transition-colors" />
           )}
        </button>

        <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-50 w-20 items-center pointer-events-auto py-5 bg-gradient-to-b from-[#18181b] to-[#0c0c0e] rounded-l-xl border-y-2 border-l-2 border-black/80 shadow-[0_20px_50px_rgba(0,0,0,1),-5px_0_15px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-500 ${showSidePanel ? 'translate-x-0' : 'translate-x-[110%]'}`}>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-white/5"></div>
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>

            <div className="relative w-12 h-12 group" onClick={() => playSound('click')}>
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] text-zinc-500 font-bold font-mono tracking-tighter uppercase">Range</span>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2a2a2d] to-[#111] shadow-knob border border-black flex items-center justify-center cursor-pointer active:rotate-12 transition-transform material-rubber overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-20"></div>
                    <div className="w-6 h-6 rounded-full bg-[#0a0a0c] border border-zinc-700 shadow-inner"></div>
                </div>
            </div>

            <div className="relative w-10 h-10 group" onClick={() => playSound('click')}>
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] text-zinc-500 font-bold font-mono tracking-tighter uppercase">Menu</span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#222] to-[#050505] shadow-knob border border-black flex items-center justify-center cursor-pointer active:scale-95 material-rubber overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-20"></div>
                   <span className="text-[7px] font-mono text-zinc-400 font-black uppercase">Push</span>
                </div>
            </div>

            <div className="relative w-14 h-14 mt-2 group" onClick={() => playSound('click')}>
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] text-zinc-500 font-bold font-mono tracking-tighter uppercase">FMS</span>
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2a2a2d] to-[#111] shadow-knob border border-black flex items-center justify-center cursor-pointer active:rotate-12 transition-transform material-rubber overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-20"></div>
                    <div className="text-[6px] font-black text-zinc-600 text-center leading-tight uppercase tracking-tighter">Push<br/>Crsr</div>
                </div>
            </div>

             <div className="relative w-10 h-10 mt-2 group" onClick={() => playSound('click')}>
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] text-zinc-500 font-bold font-mono tracking-tighter uppercase">Clr</span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#222] to-[#050505] shadow-knob border border-black flex items-center justify-center cursor-pointer active:scale-95 material-rubber relative">
                   <span className="text-[11px] font-mono text-zinc-500 font-black">D</span>
                   <span className="absolute w-[120%] h-[1px] bg-zinc-700/50 rotate-45 pointer-events-none"></span>
                </div>
            </div>
        </div>

        <div className="h-16 w-full bg-gradient-to-t from-[#0d0d0f] via-[#1a1a1d] to-[#252529] border-t-2 border-black/90 shadow-[0_-5px_20px_rgba(0,0,0,0.8),inset_0_-1px_0_rgba(255,255,255,0.05)] relative shrink-0 z-30">
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/5 opacity-50"></div>
            <Navigation 
              activePage={activeModule} 
              setPage={handleMenuSelection}
              currentView={currentView}
              isMiniMfdOpen={isMiniMfdOpen}
              setIsMiniMfdOpen={setIsMiniMfdOpen}
            />
        </div>
      
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);