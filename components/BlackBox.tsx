import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity, Battery, Wifi, Radio, CloudRain, HardDrive } from 'lucide-react';
import { playSound } from '../services/audioService';

// Data moved from Dashboard
const data = [
  { name: 'Mon', flight: 2.0, sim: 1.5 },
  { name: 'Tue', flight: 1.5, sim: 2.0 },
  { name: 'Wed', flight: 4.0, sim: 0.5 },
  { name: 'Thu', flight: 0.0, sim: 3.5 },
  { name: 'Fri', flight: 3.5, sim: 1.0 },
  { name: 'Sat', flight: 5.0, sim: 0.0 },
  { name: 'Sun', flight: 2.0, sim: 2.0 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black border border-white/20 p-2 rounded shadow-xl backdrop-blur-md">
        <p className="text-white text-[10px] font-mono mb-1">{label} LOG</p>
        <div className="flex gap-3 text-xs font-mono">
           <span className="text-sky-400">FLT: {payload[0].value}</span>
           <span className="text-purple-400">SIM: {payload[1].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

const BlackBox: React.FC = () => {
  return (
    <div className="p-4 h-full overflow-y-auto pb-32 scroll-smooth animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
       <header className="mb-6 flex items-center gap-4 border-b border-white/10 pb-6 animate-fade-in opacity-0" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
          <div className="p-3 bg-zinc-800 rounded-lg border border-zinc-700 shadow-lg">
             <img src="https://lh3.googleusercontent.com/d/1yLM_bGVPN8Sa__fqR95C0EeA1CUsTAA7" className="w-10 h-10 object-contain" alt="Blackbox" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white font-mono tracking-widest uppercase">BLACK BOX DATABASE</h2>
            <p className="text-xs text-slate-500 font-mono font-bold tracking-widest">FLIGHT DATA RECORDER // SERIAL: BB-X99_VER_2.4</p>
          </div>
       </header>

       <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">

        {/* === LEFT COLUMN: STATUS === */}
        <div className="col-span-12 lg:col-span-3 grid grid-cols-1 gap-4 animate-fade-in opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
             {/* Environmental / Status Panel */}
            <div className="bg-zinc-900 border-x-4 border-zinc-950 rounded-sm p-5 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-white/5"></div>
                <div className="text-[10px] font-black text-zinc-500 mb-4 tracking-widest uppercase">SYSTEM TELEMETRY</div>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-mono group-hover:bg-white/5 p-1 transition-colors rounded">
                        <span className="text-zinc-400 flex items-center gap-2 uppercase font-bold"><Battery className="w-4 h-4 text-emerald-500" /> Main Bus</span>
                        <span className="text-emerald-400 font-black">28.4 V</span>
                    </div>
                     <div className="flex justify-between items-center text-xs font-mono group-hover:bg-white/5 p-1 transition-colors rounded">
                        <span className="text-zinc-400 flex items-center gap-2 uppercase font-bold"><Wifi className="w-4 h-4 text-sky-500" /> Uplink</span>
                        <span className="text-sky-400 font-black">CONN</span>
                    </div>
                     <div className="flex justify-between items-center text-xs font-mono group-hover:bg-white/5 p-1 transition-colors rounded">
                        <span className="text-zinc-400 flex items-center gap-2 uppercase font-bold"><Activity className="w-4 h-4 text-amber-500" /> Engine</span>
                        <span className="text-emerald-400 font-black tracking-widest">NOMINAL</span>
                    </div>
                    <div className="h-px bg-zinc-800 my-4 shadow-[0_1px_0_rgba(255,255,255,0.05)]"></div>
                     <div className="text-[10px] font-black text-zinc-500 mb-2 tracking-widest uppercase">METAR (LIVE FEED)</div>
                     <div className="bg-black/80 p-3 rounded border border-zinc-800 font-mono text-[11px] text-amber-500 break-words leading-relaxed shadow-inner animate-fade-in">
                        KLAX 27010KT 10SM CLR 22/15 A2992 RMK AO2 SLP134 T02170150
                     </div>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-700/50 p-6 rounded shadow-xl text-center relative group overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-[1px] bg-white/5"></div>
               <h3 className="text-[10px] text-zinc-500 font-black tracking-widest mb-4 uppercase">STORAGE CAPACITY</h3>
               <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-zinc-700 shadow-inner p-[1px]">
                  <div className="h-full w-3/4 bg-gradient-to-r from-zinc-600 to-zinc-400 rounded-full transition-all duration-1000 ease-out group-hover:brightness-110"></div>
               </div>
               <p className="text-[10px] text-zinc-400 mt-2 font-mono font-bold tracking-tighter">750.24 GB / 1024.00 GB (73%)</p>
            </div>
        </div>

        {/* === MAIN: MFD (Glass Cockpit Screen) === */}
        <div className="col-span-12 lg:col-span-9 animate-fade-in opacity-0" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
            <div className="bg-zinc-800 rounded-xl border-[6px] border-zinc-900 shadow-[0_20px_60px_rgba(0,0,0,1)] relative group">
                 {/* Bezel Branding */}
                 <div className="absolute top-1 left-1/2 -translate-x-1/2 text-zinc-600 text-[10px] font-black tracking-[0.3em] pointer-events-none uppercase opacity-50">
                    DATA-LINK SYSTEM
                 </div>
                 
                 {/* Screen Area */}
                 <div className="bg-[#050505] m-1 rounded-sm min-h-[520px] relative overflow-hidden flex flex-col shadow-[inset_0_0_80px_rgba(0,0,0,1)]">
                    {/* Top Status Bar of Screen */}
                    <div className="bg-zinc-900/90 text-white flex justify-between px-4 py-1.5 text-[10px] font-mono border-b border-white/10 shadow-lg relative z-20">
                        <div className="flex gap-6">
                            <span className="font-bold flex items-center gap-1.5">REC <span className="text-red-600 animate-pulse text-base leading-none">●</span></span>
                            <span className="font-bold">SOURCE <span className="text-emerald-400">FDR_LIVE</span></span>
                        </div>
                        <div className="flex gap-6 font-bold">
                            <span>SESSION TAPE <span className="text-g1000-cyan tracking-widest">04:22:19</span></span>
                        </div>
                    </div>

                    {/* Main Chart Content */}
                    <div className="flex-1 p-8 relative">
                        {/* Grid lines overlay for "Map" feel */}
                         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

                        <div className="flex justify-between items-end mb-8 relative z-10">
                             <div className="bg-black/60 px-5 py-2 rounded-sm border border-white/10 backdrop-blur-md shadow-2xl">
                                 <h3 className="text-white font-mono font-black text-xl flex items-center gap-3 tracking-widest uppercase">
                                     <Activity className="w-5 h-5 text-sky-400 drop-shadow-[0_0_5px_rgba(56,189,248,0.5)]" /> Flight Hours Analysis
                                 </h3>
                                 <p className="text-[9px] text-zinc-500 mt-1 font-bold tracking-widest">REALTIME HISTORICAL TELEMETRY LOGS</p>
                             </div>
                             <div className="flex gap-3">
                                <div className="flex items-center gap-2 bg-sky-950/20 px-3 py-1 rounded border border-sky-800/50">
                                   <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                                   <span className="text-[10px] font-mono font-black text-sky-400 tracking-widest uppercase">Real Flight</span>
                                </div>
                                <div className="flex items-center gap-2 bg-purple-950/20 px-3 py-1 rounded border border-purple-800/50">
                                   <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                   <span className="text-[10px] font-mono font-black text-purple-400 tracking-widest uppercase">Simulator</span>
                                </div>
                             </div>
                        </div>

                        <div className="w-full h-[360px] relative z-10 animate-fade-in opacity-0" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
                            <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                <linearGradient id="colorFlight" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.5}/>
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorSim" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.5}/>
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" stroke="#222" vertical={true} horizontal={true} opacity={0.3} />
                                <XAxis 
                                dataKey="name" 
                                stroke="#444" 
                                tick={{fontSize: 10, fill: '#666', fontFamily: 'monospace', fontWeight: 'bold'}} 
                                tickLine={false} 
                                axisLine={false} 
                                />
                                <YAxis 
                                stroke="#444" 
                                tick={{fontSize: 10, fill: '#666', fontFamily: 'monospace', fontWeight: 'bold'}} 
                                tickLine={false} 
                                axisLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1.5, strokeDasharray: '5 5' }} />
                                <Area type="monotone" dataKey="sim" stackId="1" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorSim)" activeDot={{ r: 6, fill: '#fff', stroke: '#a855f7', strokeWidth: 2 }} />
                                <Area type="monotone" dataKey="flight" stackId="2" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorFlight)" activeDot={{ r: 6, fill: '#fff', stroke: '#0ea5e9', strokeWidth: 2 }} />
                            </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bottom MFD Labels for Softkeys */}
                    <div className="bg-zinc-950 border-t border-white/5 flex justify-around px-2 py-2 shadow-[inset_0_5px_15px_rgba(0,0,0,0.8)]">
                        {['LOGS', 'DUMP', 'EXPORT', 'FILTER', 'RANGE', 'ERR', 'MAINT', 'EXIT'].map((label, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1.5 w-full border-r border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer py-1">
                                <span className="text-[10px] font-mono font-black text-zinc-400 tracking-widest">{label}</span>
                                {/* Small Triangle Indicator */}
                                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[5px] border-b-zinc-700"></div>
                            </div>
                        ))}
                    </div>
                 </div>

                 {/* Physical Buttons (Softkeys) */}
                 <div className="flex justify-around px-4 pb-3 pt-1.5 bg-zinc-800 rounded-b-lg border-t border-black/40">
                    {[1,2,3,4,5,6,7,8].map((k) => (
                        <button key={k} onClick={() => playSound('click')} className="w-12 h-7 bg-zinc-900 rounded-[3px] border-b-4 border-black shadow-[0_4px_0_rgba(0,0,0,1)] active:border-b-0 active:translate-y-1 active:shadow-none transition-all hover:brightness-110 material-rubber"></button>
                    ))}
                 </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default BlackBox;