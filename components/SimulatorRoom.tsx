import React, { useState, useMemo } from 'react';
import { Plane, Compass, Navigation2, Target, MoveUpRight, ChevronLeft, ChevronRight, Radio, Activity, Award, BarChart, Settings, Play } from 'lucide-react';
import { playSound } from '../services/audioService.ts';
import VORSimulator from './VORSimulator.tsx';

interface TrainingModule {
  id: string;
  name: string;
  type: string;
  status: 'Available' | 'Maintenance' | 'In Use';
  image: string;
  specs: string[];
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  objective: string;
  subModules?: TrainingModule[];
}

const difficultyRank: Record<string, number> = {
  'Basic': 0,
  'Intermediate': 1,
  'Advanced': 2
};

const foundationSubModules: TrainingModule[] = [
  { 
    id: 'f-vor', 
    name: 'TRACKING RADIALS AND INTRODUCTION TO INBOUND & OUTBOUND', 
    type: 'STATION IDENTIFICATION', 
    status: 'Available', 
    image: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=1200',
    specs: ['VOR', 'IDENT', '108.10 MHz'],
    difficulty: 'Basic',
    objective: 'Learn the core physics of VOR signal propagation and Morse Code identification.'
  },
  { 
    id: 'f-homing', 
    name: 'STATION HOMING', 
    type: 'DIRECT NAVIGATION', 
    status: 'Available', 
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=1200',
    specs: ['HOMING', 'BEARING', 'DIRECT'],
    difficulty: 'Basic',
    objective: 'Navigate directly to a station by following the bearing pointer regardless of wind drift.'
  },
  { 
    id: 'f-inbound', 
    name: 'INBOUND NAVIGATION', 
    type: 'TO STATION LOGIC', 
    status: 'Available', 
    image: 'https://images.unsplash.com/photo-1544016768-982d1554f0b9?auto=format&fit=crop&q=80&w=1200',
    specs: ['INBOUND', 'TO FLAG', 'RADIAL'],
    difficulty: 'Basic',
    objective: 'Establish an inbound course to a VOR station with a positive TO indication.'
  },
  { 
    id: 'f-outbound', 
    name: 'OUTBOUND NAVIGATION', 
    type: 'FROM STATION LOGIC', 
    status: 'Available', 
    image: 'https://images.unsplash.com/photo-1506012733861-73759c03bb0d?auto=format&fit=crop&q=80&w=1200',
    specs: ['OUTBOUND', 'FROM FLAG', 'RADIAL'],
    difficulty: 'Basic',
    objective: 'Maintain a precise radial departure away from a station after passage.'
  },
  { 
    id: 'f-tracking', 
    name: 'COURSE TRACKING', 
    type: 'WIND CORRECTION', 
    status: 'Available', 
    image: 'https://images.unsplash.com/photo-1464039397811-476f652a343b?auto=format&fit=crop&q=80&w=1200',
    specs: ['TRACKING', 'WCA', 'BRACKETING'],
    difficulty: 'Intermediate',
    objective: 'Master wind correction angles (WCA) to remain on the selected radial centerline.'
  }
];

const trainingScenarios: TrainingModule[] = [
  { 
    id: 'vor-01', 
    name: 'UNDERSTANDING THE FOUNDATION', 
    type: 'CORE NAVIGATION BASICS', 
    status: 'Available', 
    image: 'https://lh3.googleusercontent.com/d/1HpzTC2mR312qpDeG6i1Cy4FU0JeRrfuE',
    specs: ['VOR', 'INBOUND', 'OUTBOUND', 'TRACKING', 'HOMING'],
    difficulty: 'Basic',
    objective: 'The primary entry point for instrument navigation. Covers all fundamental VOR principles.',
    subModules: foundationSubModules
  },
  { 
    id: 'vor-02', 
    name: 'RADIAL INTERCEPTION', 
    type: 'INTERCEPTION TECHNIQUES', 
    status: 'Available', 
    image: 'https://images.unsplash.com/photo-1464039397811-476f652a343b?auto=format&fit=crop&q=80&w=1200',
    specs: ['INTERCEPT', '45° ANGLE', '90° ANGLE'],
    difficulty: 'Intermediate',
    objective: 'Master the procedural turns required to intercept a target radial from any orientation.'
  },
  { 
    id: 'vor-03', 
    name: 'RADIAL TRACKING', 
    type: 'TRACKING & DRIFT', 
    status: 'Available', 
    image: 'https://images.unsplash.com/photo-1544016768-982d1554f0b9?auto=format&fit=crop&q=80&w=1200',
    specs: ['WCA', 'BRACKETING', 'CROSSWIND'],
    difficulty: 'Intermediate',
    objective: 'Advanced tracking techniques for maintaining course in high-velocity crosswinds.'
  },
  { 
    id: 'vor-04', 
    name: 'STATION PASSAGE', 
    type: 'ADVANCED NAV', 
    status: 'In Use', 
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=1200',
    specs: ['STATION PASSAGE', 'TWIST-TURN-TRACK'],
    difficulty: 'Advanced',
    objective: 'Identify the zone of confusion and execute immediate transition to outbound radials.'
  },
];

const ModuleCard: React.FC<{ 
  module: TrainingModule; 
  onClick: () => void; 
  index: number;
}> = ({ module, onClick, index }) => (
  <div 
    onClick={() => {
      if (module.status === 'Available') {
        playSound('click');
        onClick();
      }
    }}
    className={`group relative w-full rounded-2xl overflow-hidden border transition-all duration-500 hover:scale-[1.01] cursor-pointer shadow-2xl animate-fade-in mb-6 ${
        module.status === 'Available' ? 'border-zinc-700/50 hover:border-g1000-cyan' : 'border-zinc-900 opacity-60 grayscale cursor-not-allowed'
    }`}
    style={{ animationDelay: `${index * 0.1}s`, height: '240px' }}
  >
    <img src={module.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt={module.name} />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-95 group-hover:opacity-80 transition-opacity"></div>
    <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent"></div>
    <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
        <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <div className="bg-black/80 backdrop-blur-xl border border-white/10 px-4 py-1.5 rounded-lg flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shadow-[0_0_10px] ${
                      module.status === 'Available' ? 'bg-g1000-green shadow-green-500' : 'bg-g1000-amber shadow-amber-500'
                  }`}></div>
                  <span className="text-[10px] font-black tracking-widest uppercase text-white">{module.status}</span>
              </div>
              <div className="bg-zinc-950 border border-white/10 px-4 py-1.5 rounded-lg">
                  <span className={`text-[10px] font-black tracking-widest uppercase ${
                    module.difficulty === 'Basic' ? 'text-emerald-400' : 
                    module.difficulty === 'Intermediate' ? 'text-amber-400' : 'text-red-400'
                  }`}>{module.difficulty} Level</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/30">
               <span className="text-[10px] font-black tracking-widest uppercase italic">Flight Training System</span>
               <div className="w-px h-3 bg-white/20"></div>
               <span className="text-[10px] font-black tracking-widest uppercase">ID:{module.id}</span>
            </div>
        </div>
        <div className="max-w-2xl">
            <h3 className="text-3xl font-black text-white tracking-tight group-hover:text-g1000-cyan transition-colors duration-300 flex items-center gap-4">
              {module.name}
              <ChevronRight className="w-6 h-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
            </h3>
            <p className="text-xs text-g1000-amber font-black tracking-[0.3em] mb-4 uppercase mt-1 opacity-80">{module.type}</p>
            <p className="text-sm text-zinc-300 font-medium leading-relaxed mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 line-clamp-2">
                {module.objective}
            </p>
            <div className="flex gap-3 flex-wrap">
                {module.specs.map((spec, i) => (
                    <div key={i} className="flex items-center gap-2 text-[9px] text-white font-black uppercase tracking-widest bg-zinc-900/80 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/5 group-hover:border-g1000-cyan/30 transition-colors">
                        {spec.includes('VOR') ? <Radio className="w-3 h-3 text-g1000-cyan" /> : 
                         spec.includes('TRACKING') || spec.includes('TO') ? <Target className="w-3 h-3 text-g1000-cyan" /> : 
                         <Compass className="w-3 h-3 text-g1000-cyan" />}
                        {spec}
                    </div>
                ))}
            </div>
        </div>
    </div>
    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-g1000-cyan scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-500"></div>
    <div className="absolute right-0 bottom-0 w-1/4 h-[2px] bg-white/10"></div>
  </div>
);

const SimulatorRoom: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedSimConfig, setSelectedSimConfig] = useState<'VOR' | 'HSI' | null>(null);
  const [isSimRunning, setIsSimRunning] = useState(false);

  const activeSim = trainingScenarios.find(s => s.id === selectedId);

  const sortedTrainingScenarios = useMemo(() => {
    return [...trainingScenarios].sort((a, b) => difficultyRank[a.difficulty] - difficultyRank[b.difficulty]);
  }, []);

  const sortedSubModules = useMemo(() => {
    if (!activeSim?.subModules) return [];
    return [...activeSim.subModules].sort((a, b) => difficultyRank[a.difficulty] - difficultyRank[b.difficulty]);
  }, [activeSim]);

  const handleLaunchSim = (config: 'VOR' | 'HSI') => {
    playSound('click');
    setSelectedSimConfig(config);
    setIsConfigOpen(false);
    setIsSimRunning(true);
  };

  if (isSimRunning && selectedSimConfig) {
    return <VORSimulator type={selectedSimConfig} onExit={() => setIsSimRunning(false)} />;
  }

  if (selectedId && activeSim) {
    return (
      <div className="h-full w-full bg-[#050505] text-white font-mono flex flex-col animate-fade-in relative overflow-hidden">
        {/* Config Modal Overlay */}
        {isConfigOpen && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center animate-fade-in">
             <div className="absolute inset-0 bg-black/80 backdrop-blur-xl"></div>
             <div className="relative w-full max-w-xl p-1 bg-[#111] border border-white/10 rounded-3xl shadow-[0_0_100px_rgba(0,255,255,0.15)] animate-slide-up">
                <div className="p-8">
                   <div className="flex items-center gap-3 mb-8">
                      <Settings className="w-6 h-6 text-g1000-cyan animate-spin-slow" />
                      <div>
                        <h4 className="text-xl font-black text-white tracking-widest uppercase">Select Instrument</h4>
                        <p className="text-[10px] text-zinc-500 font-bold tracking-[0.3em] uppercase">AVIONICS CONFIGURATION</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <button 
                        onClick={() => handleLaunchSim('VOR')}
                        className="group relative aspect-square bg-zinc-900 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all hover:border-g1000-cyan hover:bg-g1000-cyan/5 active:scale-95 overflow-hidden"
                      >
                         <div className="w-20 h-20 rounded-full border-4 border-zinc-700 flex items-center justify-center group-hover:border-g1000-cyan transition-colors">
                            <Compass className="w-10 h-10 text-zinc-500 group-hover:text-g1000-cyan" />
                         </div>
                         <div className="text-center">
                            <span className="block text-sm font-black text-white tracking-widest">CLASSIC VOR</span>
                            <span className="block text-[8px] text-zinc-500 uppercase mt-1">SBN-94 Analog</span>
                         </div>
                      </button>

                      <button 
                        onClick={() => handleLaunchSim('HSI')}
                        className="group relative aspect-square bg-zinc-900 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all hover:border-g1000-magenta hover:bg-g1000-magenta/5 active:scale-95 overflow-hidden"
                      >
                         <div className="w-20 h-20 rounded-full border-4 border-zinc-700 flex items-center justify-center group-hover:border-g1000-magenta transition-colors overflow-hidden">
                            <img src="https://lh3.googleusercontent.com/d/1ahthu2ZsyfNcYGsQPI9K9GiIxqM8JUI1" className="w-full h-full object-cover p-1 opacity-70 group-hover:opacity-100 transition-opacity" alt="HSI Icon" />
                         </div>
                         <div className="text-center">
                            <span className="block text-sm font-black text-white tracking-widest">GLASS HSI</span>
                            <span className="block text-[8px] text-zinc-500 uppercase mt-1">G1000 Digital</span>
                         </div>
                      </button>
                   </div>
                   
                   <button 
                    onClick={() => setIsConfigOpen(false)}
                    className="w-full mt-8 py-3 rounded-xl border border-white/5 text-[10px] font-black text-zinc-500 tracking-widest uppercase hover:text-white transition-colors"
                   >
                     Cancel Initialization
                   </button>
                </div>
             </div>
          </div>
        )}

        <div className="absolute top-0 right-0 w-96 h-96 bg-g1000-cyan/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="h-24 shrink-0 border-b border-white/10 flex items-center justify-between px-10 bg-black/60 backdrop-blur-md sticky top-0 z-50">
          <button onClick={() => { playSound('click'); setSelectedId(null); }} className="flex items-center gap-3 text-zinc-400 hover:text-white transition-all group px-4 py-2 rounded-lg hover:bg-white/5">
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black tracking-widest uppercase">Return to Syllabus</span>
          </button>
          <div className="text-right">
            <h2 className="text-g1000-cyan font-black text-2xl tracking-widest uppercase">{activeSim.name}</h2>
            <div className="flex items-center justify-end gap-3 mt-1">
                <span className="text-[10px] text-zinc-500 font-bold tracking-[0.3em] uppercase">{activeSim.type}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-g1000-cyan shadow-[0_0_8px_cyan]"></div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {activeSim.subModules ? (
            <div className="max-w-5xl mx-auto">
              <div className="mb-12 flex flex-col md:flex-row items-center gap-8 p-10 bg-zinc-900/20 border border-white/5 rounded-3xl backdrop-blur-sm relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-g1000-amber"></div>
                 <div className="p-5 bg-zinc-950 rounded-2xl text-g1000-amber border border-white/10 shadow-2xl">
                    <Award className="w-10 h-10" />
                 </div>
                 <div className="flex-1">
                    <h4 className="text-lg font-black tracking-widest uppercase text-white mb-2">Detailed Curriculum Modules</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl italic">Each module represents a specific navigation capability. Select VOR Fundamentals to launch the 2D Simulator.</p>
                 </div>
              </div>
              <div className="flex flex-col space-y-2">
                {sortedSubModules.map((sub, i) => (
                  <ModuleCard key={sub.id} module={sub} index={i} onClick={() => {
                      if (sub.id === 'f-vor') {
                        setIsConfigOpen(true);
                      } else {
                        console.log("Launching simulation:", sub.id);
                      }
                      playSound('click');
                  }} />
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center animate-pulse">
               <Activity className="w-20 h-20 text-zinc-800 mb-8" />
               <p className="text-zinc-500 font-black tracking-[0.5em] uppercase text-xl">System Sync in Progress</p>
            </div>
          )}
        </div>
        <div className="h-20 shrink-0 bg-black border-t border-white/10 flex items-center justify-between px-10">
           <div className="flex items-center gap-10">
              <div className="flex flex-col">
                 <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Simulation Type</span>
                 <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Ground-Based Radio Navigation</span>
              </div>
           </div>
           <button onClick={() => playSound('click')} className="bg-white/5 hover:bg-g1000-cyan hover:text-black border border-white/10 px-12 py-3 rounded-xl text-xs font-black tracking-[0.2em] uppercase transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] active:scale-95">
              Auto-Sequencing Start
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#050505] text-white font-mono flex flex-col animate-fade-in relative overflow-hidden">
      <div className="relative h-28 shrink-0 flex items-end px-10 pb-6 bg-gradient-to-b from-zinc-800/10 to-black border-b border-white/10 z-10 backdrop-blur-sm">
        <div className="flex justify-between items-end w-full">
            <div>
                <div className="flex items-center gap-4 mb-2">
                   <BarChart className="w-6 h-6 text-g1000-cyan" />
                   <span className="text-g1000-cyan font-black text-3xl tracking-[0.15em] uppercase drop-shadow-[0_0_15px_rgba(0,255,255,0.4)]">Training Syllabus</span>
                </div>
                <p className="text-[10px] text-zinc-500 font-bold tracking-[0.4em] uppercase">Structured IFR Navigation Progress • v2.0</p>
            </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        <div className="max-w-5xl mx-auto">
          {sortedTrainingScenarios.map((sim, idx) => (
            <ModuleCard key={sim.id} module={sim} index={idx} onClick={() => setSelectedId(sim.id)} />
          ))}
        </div>
      </div>
      <div className="h-16 shrink-0 bg-black border-t border-white/5 flex items-center justify-between px-10 z-10">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-3 text-zinc-500 hover:text-zinc-300 transition-colors cursor-help group">
                <Navigation2 className="w-5 h-5 group-hover:text-g1000-cyan transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Nav-Engine: Passive</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default SimulatorRoom;