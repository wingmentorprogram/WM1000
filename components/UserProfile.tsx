import React from 'react';
import { Medal, Award, Clock, Plane, Calendar, Map, BadgeCheck, Shield, Edit2, CheckCircle2, Lock } from 'lucide-react';

const pilotData = {
  name: "Cpt. Maverick",
  rank: "Student Pilot",
  avatar: "https://picsum.photos/200/200",
  joined: "March 2024",
  homebase: "KLAX (Los Angeles Intl)",
  stats: {
    totalHours: 142.5,
    picHours: 45.2,
    landings: 324,
    simHours: 28.5
  },
  certificates: [
    { name: "Student Pilot Cert", number: "FF-123456", expires: "N/A", status: "Active", type: "Federal Aviation Administration" },
    { name: "Medical Class 3", number: "MED-998877", expires: "Dec 2025", status: "Active", type: "Aviation Medical Examiner" },
    { name: "FCC Radio License", number: "RL-555111", expires: "Lifetime", status: "Active", type: "Federal Comm. Commission" }
  ],
  achievements: [
    { id: 1, title: "First Solo", desc: "Complete your first solo flight without an instructor.", icon: "🛩️", date: "May 15, 2024", unlocked: true },
    { id: 2, title: "Cross Country", desc: "Fly >50nm from home base and land at another airport.", icon: "🗺️", date: "Jun 20, 2024", unlocked: true },
    { id: 3, title: "Ace Pilot", desc: "Score 100% on any written exam.", icon: "⭐", date: "Jul 10, 2024", unlocked: true },
    { id: 4, title: "Night Owl", desc: "Complete 5 full-stop night landings.", icon: "🌙", date: null, unlocked: false },
    { id: 5, title: "Cloud Surfer", desc: "Obtain Instrument Rating (IR).", icon: "☁️", date: null, unlocked: false },
    { id: 6, title: "Mentor", desc: "Answer 10 forum questions marked as helpful.", icon: "🎓", date: null, unlocked: false },
    { id: 7, title: "Iron Bird", desc: "Log 50 hours in the simulator.", icon: "🕹️", date: null, unlocked: false },
    { id: 8, title: "Captain", desc: "Obtain Commercial Pilot License (CPL).", icon: "👨‍✈️", date: null, unlocked: false },
  ]
};

const UserProfile: React.FC = () => {
  return (
    <div className="p-8 h-full overflow-y-auto pb-32 scroll-smooth animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
      <header className="mb-8 animate-fade-in opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Pilot Dossier</h2>
        <p className="text-slate-400 font-medium">Personnel records and verified flight history.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Identity & Certificates */}
        <div className="lg:col-span-1 space-y-6 animate-fade-in opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
          
          {/* Identity Card */}
          <div className="bg-aviation-panel p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-aviation-accent/20 to-transparent"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="relative mb-6">
                <img 
                  src={pilotData.avatar} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full border-4 border-slate-900 shadow-2xl transition-transform group-hover:scale-105 duration-500"
                />
                <button className="absolute bottom-1 right-1 p-2 bg-aviation-accent text-white rounded-full hover:bg-sky-400 transition-all shadow-lg hover:scale-110">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">{pilotData.name}</h3>
              <p className="text-aviation-accent font-bold mb-1 uppercase tracking-widest text-sm">{pilotData.rank}</p>
              <p className="text-xs text-slate-500 mb-8 font-mono">Homebase: {pilotData.homebase}</p>

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Total Time</p>
                  <p className="text-xl font-mono text-white font-bold">{pilotData.stats.totalHours}</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">PIC Time</p>
                  <p className="text-xl font-mono text-white font-bold">{pilotData.stats.picHours}</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Landings</p>
                  <p className="text-xl font-mono text-white font-bold">{pilotData.stats.landings}</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Sim Hours</p>
                  <p className="text-xl font-mono text-white font-bold">{pilotData.stats.simHours}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Certificates */}
          <div className="space-y-4">
            <h4 className="text-white font-bold flex items-center gap-2 text-lg">
              <BadgeCheck className="w-5 h-5 text-aviation-accent" /> Licenses & Certs
            </h4>
            {pilotData.certificates.map((cert, i) => (
              <div key={i} className="bg-slate-900/80 p-5 rounded-xl border border-slate-700 relative overflow-hidden group hover:border-aviation-accent/30 transition-all duration-300">
                <div className="absolute right-0 top-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Shield className="w-20 h-20 text-white" />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{cert.type}</p>
                    <span className="px-2 py-0.5 bg-emerald-900/30 text-emerald-400 border border-emerald-800 rounded text-[10px] font-black uppercase">
                      {cert.status}
                    </span>
                  </div>
                  <h5 className="text-white font-bold text-lg mb-2">{cert.name}</h5>
                  <div className="flex justify-between text-xs text-slate-500 font-mono bg-black/40 p-2 rounded">
                    <span>#: {cert.number}</span>
                    <span>EXP: {cert.expires}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right Column: Achievements & History */}
        <div className="lg:col-span-2 space-y-8 animate-fade-in opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
          
          {/* Achievements Grid */}
          <div>
            <div className="flex justify-between items-end mb-6">
              <div>
                <h4 className="text-white font-bold flex items-center gap-2 text-2xl tracking-tight">
                  <Medal className="w-7 h-7 text-yellow-500" /> Career Milestones
                </h4>
                <p className="text-sm text-slate-400">Track and share your progression and earned badges.</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-white">3</span>
                <span className="text-slate-500 text-lg"> / 8</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {pilotData.achievements.map((ach, idx) => (
                <div 
                  key={ach.id} 
                  className={`p-4 rounded-xl border flex items-start gap-4 transition-all duration-300 group animate-fade-in opacity-0 ${
                    ach.unlocked 
                      ? 'bg-aviation-panel border-slate-600 hover:border-aviation-accent/50 cursor-pointer shadow-lg hover:shadow-aviation-accent/5' 
                      : 'bg-slate-900/50 border-slate-800 opacity-40 grayscale pointer-events-none'
                  }`}
                  style={{ animationDelay: `${0.5 + idx * 0.1}s`, animationFillMode: 'forwards' }}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border transition-all ${
                    ach.unlocked 
                      ? 'bg-slate-800 border-slate-600 group-hover:scale-110 duration-500' 
                      : 'bg-slate-900 border-slate-800'
                  }`}>
                    {ach.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h5 className={`font-bold text-sm ${ach.unlocked ? 'text-white' : 'text-slate-600'}`}>{ach.title}</h5>
                      {ach.unlocked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Lock className="w-3 h-3 text-slate-700" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{ach.desc}</p>
                    {ach.unlocked && (
                      <p className="text-[9px] text-aviation-accent mt-2 font-mono font-bold uppercase tracking-tighter">Awarded: {ach.date}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Heatmap / Recent Log (Visual Placeholder) */}
          <div className="bg-aviation-panel/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-700 shadow-2xl">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-slate-800 rounded-lg"><Calendar className="w-5 h-5 text-aviation-accent" /></div>
                   <h4 className="text-xl font-bold text-white tracking-tight">Recent Flight Operations</h4>
                </div>
                <button className="text-[10px] font-bold text-aviation-accent uppercase tracking-widest hover:text-white transition-colors">Digital Logbook &rarr;</button>
             </div>
             
             <div className="space-y-0">
               {[
                 { date: "Oct 24", aircraft: "Cessna 172S", route: "KLAX -> KSMO", time: "1.2", type: "Dual" },
                 { date: "Oct 22", aircraft: "Cessna 172S", route: "KLAX Local", time: "0.9", type: "Solo" },
                 { date: "Oct 18", aircraft: "Simulator", route: "IFR Procedures", time: "2.0", type: "Sim" },
               ].map((log, i) => (
                 <div key={i} className="flex items-center justify-between py-5 border-b border-slate-800 last:border-0 hover:bg-white/5 px-6 -mx-6 transition-all group rounded-lg">
                    <div className="flex items-center gap-6">
                       <div className="w-14 text-xs font-mono text-slate-500 font-bold uppercase">{log.date}</div>
                       <div>
                         <p className="text-base font-bold text-white group-hover:text-aviation-accent transition-colors">{log.route}</p>
                         <p className="text-xs text-slate-500 font-medium">{log.aircraft}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-lg font-mono text-aviation-accent font-black tracking-tight">{log.time}</p>
                       <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{log.type}</p>
                    </div>
                 </div>
               ))}
             </div>
             
             <div className="mt-10 p-4 bg-black/40 rounded-xl border border-dashed border-slate-800 text-center">
               <p className="text-xs text-slate-500 font-medium">TOTAL LOGGED TIME (ALL CATEGORIES): <span className="text-white font-mono font-bold">142.5 HRS</span></p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfile;