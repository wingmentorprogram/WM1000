import React from 'react';
import { Plane, ChevronRight, Wind, BookOpen, ArrowRight, HardDrive } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-sky-500 selection:text-white overflow-y-auto relative z-[100]">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-sky-900/20 to-transparent pointer-events-none"></div>

      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3 font-bold text-xl tracking-tight">
          <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center shadow-lg shadow-sky-500/20">
             <Plane className="text-white fill-white" size={20} />
          </div>
          <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">WingMentor</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
           <button className="hover:text-white transition-colors">Platform Features</button>
           <button className="hover:text-white transition-colors">Academy</button>
           <button className="hover:text-white transition-colors">Enterprise</button>
        </div>
        <button onClick={onEnter} className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors border border-white/10 backdrop-blur-sm">
           Student Portal
        </button>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center relative z-10">
         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-bold uppercase tracking-wider mb-8 border border-sky-500/20">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            System Online • v2.4.1
         </div>
         <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
            <span className="block text-white">Precision Flight Training</span>
            <span className="block text-slate-500">Reimagined.</span>
         </h1>
         <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The all-in-one digital cockpit for aspiring aviators. Experience high-fidelity avionics simulation, 
            interactive learning modules, and comprehensive flight data analysis directly in your browser.
         </p>
         
         <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <button 
              onClick={onEnter}
              className="group bg-sky-500 hover:bg-sky-400 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(14,165,233,0.5)] flex items-center gap-2"
            >
              Launch Simulator
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="text-slate-400 hover:text-white px-6 py-4 font-medium transition-colors flex items-center gap-2">
               View Syllabus <ChevronRight className="w-4 h-4" />
            </button>
         </div>
      </div>

      {/* Interface Preview (Abstract) */}
      <div className="relative max-w-6xl mx-auto px-6 mb-24">
         <div className="aspect-[2/1] bg-slate-800 rounded-t-2xl border border-slate-700 border-b-0 shadow-2xl relative overflow-hidden opacity-50 mask-linear-fade">
             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0f172a]"></div>
             {/* Abstract UI shapes */}
             <div className="absolute top-8 left-8 right-8 h-8 bg-slate-700/50 rounded-full"></div>
             <div className="absolute top-24 left-8 w-1/4 bottom-0 bg-slate-700/30 rounded-t-lg"></div>
             <div className="absolute top-24 right-8 w-2/3 bottom-0 bg-slate-700/30 rounded-t-lg"></div>
         </div>
         <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0f172a] to-transparent"></div>
      </div>

      {/* Features Grid */}
      <div className="bg-slate-900 border-t border-slate-800 py-24">
         <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12">
            <div className="space-y-4 p-6 rounded-2xl bg-slate-800/20 border border-slate-800 hover:border-sky-500/30 transition-colors">
               <div className="w-12 h-12 bg-sky-500/10 rounded-xl flex items-center justify-center border border-sky-500/20">
                  <Wind className="text-sky-400 w-6 h-6" />
               </div>
               <h3 className="text-xl font-bold text-white">Live Meteorology</h3>
               <p className="text-slate-400 leading-relaxed">Real-time METAR/TAF integration with visual decoding and route weather planning for safer flights.</p>
            </div>
            <div className="space-y-4 p-6 rounded-2xl bg-slate-800/20 border border-slate-800 hover:border-purple-500/30 transition-colors">
               <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                  <BookOpen className="text-purple-400 w-6 h-6" />
               </div>
               <h3 className="text-xl font-bold text-white">Digital Syllabus</h3>
               <p className="text-slate-400 leading-relaxed">Interactive PPL/CPL handbooks that track your progress through every chapter automatically.</p>
            </div>
            <div className="space-y-4 p-6 rounded-2xl bg-slate-800/20 border border-slate-800 hover:border-amber-500/30 transition-colors">
               <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                  <HardDrive className="text-amber-400 w-6 h-6" />
               </div>
               <h3 className="text-xl font-bold text-white">Blackbox Data Analysis</h3>
               <p className="text-slate-400 leading-relaxed">Review and analyze your flight performance with a detailed data recorder, tracking key metrics from every session.</p>
            </div>
         </div>
      </div>

       {/* Footer */}
       <footer className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center text-slate-600 text-sm border-t border-slate-800">
          <div>© 2024 WingMentor Inc.</div>
          <div className="flex gap-6 mt-4 md:mt-0">
             <a href="#" className="hover:text-slate-400">Privacy</a>
             <a href="#" className="hover:text-slate-400">Terms</a>
             <a href="#" className="hover:text-slate-400">Status</a>
          </div>
       </footer>
    </div>
  );
};

export default LandingPage;