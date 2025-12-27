import React from 'react';
import { Bookmark, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

interface ProgramHandbookProps {
    selectedChapterId?: string | number | null;
    onSelectChapter?: (id: string | number) => void;
    isMini?: boolean;
}

const chapters = [
    { id: 1, title: '01. Introduction to Flight', pages: 12, completed: true },
    { id: 2, title: '02. Aircraft Systems', pages: 24, completed: true },
    { id: 3, title: '03. Aerodynamics', pages: 18, completed: false },
    { id: 4, title: '04. Meteorology', pages: 30, completed: false },
    { id: 5, title: '05. Navigation', pages: 22, completed: false },
    { id: 6, title: '06. Air Law', pages: 15, completed: false },
    { id: 7, title: '07. Human Performance', pages: 10, completed: false },
    { id: 8, title: '08. Flight Operations', pages: 19, completed: false },
    { id: 9, title: '09. Radio Navigation', pages: 25, completed: false },
    { id: 10, title: '10. IFR Procedures', pages: 40, completed: false },
];

const ProgramHandbook: React.FC<ProgramHandbookProps> = ({ selectedChapterId, onSelectChapter, isMini = false }) => {
  // PFD DETAIL VIEW
  if (selectedChapterId && !isMini) {
    const chapter = chapters.find(c => c.id === selectedChapterId) || chapters[0];

    return (
      <div className="h-full overflow-y-auto bg-slate-50 text-slate-900 shadow-2xl relative min-h-[600px] p-8 md:p-12 animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 pointer-events-none"></div>
            <div className="relative z-10 max-w-3xl mx-auto">
               <div className="flex justify-between items-start mb-10 border-b-2 border-slate-900 pb-6 animate-fade-in opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                  <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">{chapter.title}</h1>
                  <div className="p-2 bg-red-800 rounded-sm shadow-lg"><Bookmark className="w-8 h-8 text-white" /></div>
               </div>
               <div className="prose prose-slate max-w-none text-xl leading-relaxed animate-fade-in opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
                 <h3 className="font-black text-2xl mb-6 text-slate-800">The Four Forces of Flight</h3>
                 <p className="text-slate-700">During flight, there are four forces acting on an airplane. These forces are lift, weight, thrust, and drag. Flight is possible when these forces are manipulated by the pilot to achieve a desired outcome.</p>
                 <div className="my-10 p-10 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded border border-slate-200 text-center font-mono text-sm relative group">
                   <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-100 text-[10px] text-slate-400 font-bold rounded">REF_DIAG_{chapter.id}A</div>
                   <div className="w-full h-48 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-slate-50 rounded group-hover:bg-white transition-colors duration-500">[ILLUSTRATION: FORCE VECTOR ANALYSIS IN STEADY STATE FLIGHT]</div>
                   <p className="mt-4 text-xs font-bold text-slate-500 italic uppercase tracking-wider">Fig {chapter.id}.1 - Principal Force Vectors Acting on an Airfoil</p>
                 </div>
                 <p className="text-slate-700">Bernoulli's principle and Newton's Third Law are fundamental to understanding how an airfoil generates lift. The shape of the wing is designed to create a pressure differential, resulting in an upward force.</p>
                 <p className="mt-4">When thrust is greater than drag, the aircraft accelerates. When lift is greater than weight, the aircraft climbs. In steady, unaccelerated flight, these forces are in equilibrium.</p>
               </div>
               <div className="mt-20 pt-10 border-t-2 border-slate-200 flex justify-between animate-fade-in opacity-0" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
                  <button className="flex items-center gap-3 px-8 py-4 border-2 border-slate-300 rounded hover:bg-slate-100 transition-all font-black text-slate-600 active:scale-95"><ChevronLeft className="w-5 h-5" /> Back</button>
                  <button className="flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded hover:bg-slate-700 transition-all font-black shadow-2xl active:scale-95">Continue Module <ChevronRight className="w-5 h-5" /></button>
               </div>
            </div>
      </div>
    );
  }

  // MFD LIST VIEW or MINI MFD LIST VIEW
  return (
    <div className={`h-full w-full text-white font-mono flex flex-col animate-fade-in opacity-0 ${isMini ? 'bg-transparent p-2' : 'bg-black p-2'}`} style={{ animationFillMode: 'forwards' }}>
      <div className={`flex justify-between items-center border-b pb-1 mb-2 ${isMini ? 'border-white/10' : 'border-white/20'}`}>
        <span className={`text-g1000-magenta font-bold tracking-widest ${isMini ? 'text-base' : 'text-lg'}`}>PPL HANDBOOK</span>
        {!isMini && <span className="text-xs text-g1000-white font-bold">COURSE SYLLABUS</span>}
      </div>
      <div className={`flex-1 overflow-y-auto ${isMini ? '' : 'border border-white/20 bg-black relative'}`}>
         <div className="grid grid-cols-12 bg-g1000-darkgray/40 border-b border-white/20 text-xs text-g1000-cyan font-bold py-1 px-2 sticky top-0 z-10">
            <div className="col-span-2">STATUS</div>
            <div className="col-span-8">CHAPTER</div>
            <div className="col-span-2 text-right">PAGES</div>
         </div>
         <div className="p-1 space-y-0.5">
            {chapters.map((chapter, idx) => (
               <button 
                  key={chapter.id}
                  onClick={() => { onSelectChapter?.(chapter.id); }}
                  className="w-full grid grid-cols-12 py-3 px-2 text-sm border hover:bg-white/10 transition-all text-left border-transparent hover:border-g1000-cyan text-white cursor-pointer group animate-fade-in opacity-0"
                  style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'forwards' }}
               >
                  <div className="col-span-2 flex items-center">
                    {chapter.completed ? <CheckCircle2 className="w-4 h-4 text-g1000-green drop-shadow-[0_0_5px_rgba(0,255,0,0.5)]" /> : <div className="w-4 h-4 border border-zinc-700 rounded-full"></div>}
                  </div>
                  <div className="col-span-8 font-bold truncate group-hover:text-g1000-cyan transition-colors text-xs">{chapter.title}</div>
                  <div className="col-span-2 text-right text-g1000-amber font-bold text-xs">{chapter.pages}</div>
               </button>
            ))}
         </div>
         {!isMini && (
             <div className="absolute bottom-2 left-2 right-2 border border-white/30 bg-black/80 backdrop-blur p-3 animate-fade-in opacity-0" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
                 <div className="text-[10px] text-g1000-cyan mb-1 font-black tracking-widest uppercase">READING PROGRESS: 20%</div>
                 <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mb-2">
                    <div className="h-full w-1/5 bg-g1000-green"></div>
                 </div>
                 <p className="text-[10px] text-slate-400 font-medium">Select a chapter using the FMS knob to continue your flight training.</p>
             </div>
         )}
      </div>
    </div>
  );
};

export default ProgramHandbook;