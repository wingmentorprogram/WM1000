import React from 'react';
import { Page } from '../types';
import { Database, BookOpen, GraduationCap, Users, Plane, BarChart2 } from 'lucide-react';

interface DashboardProps {
  activePage?: Page;
  setPage: (page: Page) => void;
  onSelectSubPage?: (id: string | number) => void;
}

const Instrument = ({ 
    icon, 
    label, 
    page, 
    setPage, 
    bgImage, 
    imgScale = "scale-100",
    objectFit = "object-cover",
    objectPosition = "50% 50%"
}: { 
    icon?: React.ReactNode, 
    label: string, 
    page: Page, 
    setPage: (page: Page) => void, 
    bgImage?: string, 
    imgScale?: string,
    objectFit?: "object-cover" | "object-contain",
    objectPosition?: string
}) => (
    <button 
        onClick={() => { setPage(page); }}
        className="group flex flex-col items-center gap-3 transition-all duration-300 w-full"
    >
        {/* The Square App Frame: Fixed Size, Curved Edges, Black Background */}
        <div className="relative w-full aspect-square rounded-[22%] overflow-hidden transition-all duration-500 transform group-hover:scale-105 group-active:scale-95 group-hover:shadow-[0_0_60px_rgba(0,255,255,0.2)] shadow-2xl bg-[#080808] border border-white/5">
            
            {bgImage ? (
                /* Image Content */
                <img 
                    src={bgImage} 
                    className={`absolute inset-0 w-full h-full ${objectFit} block m-0 p-0 transition-transform duration-500 ${imgScale}`} 
                    style={{ objectPosition }}
                    alt={label} 
                />
            ) : (
                /* Icon Content */
                <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center">
                    <div className="text-zinc-600 group-hover:text-g1000-cyan transition-colors">
                        {icon}
                    </div>
                </div>
            )}
            
            {/* Glossy Overlay for "Screen" look */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/60 pointer-events-none"></div>
            
            {/* Hover Highlight Overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-g1000-cyan/5 pointer-events-none"></div>
        </div>

        {/* Consistent Label below the frame - Slightly dimmed to match screenshot */}
        <span className="text-[9px] font-black tracking-[0.5em] text-white/20 group-hover:text-g1000-cyan transition-all uppercase whitespace-nowrap">
            {label}
        </span>
    </button>
);


const Dashboard: React.FC<DashboardProps> = ({ activePage = Page.DASHBOARD, setPage }) => {
  
  const showSixPack = (activePage === Page.DASHBOARD || activePage === Page.PFD);

  if (showSixPack) {
    return (
        <div className="h-full w-full bg-[#050505] text-white font-mono flex flex-col p-8 items-center justify-center animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
            
            {/* Status LEDs in Top Right - updated to match screenshot showing two lights */}
            <div className="absolute top-8 right-12 flex flex-col gap-10 animate-fade-in" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
                 <div className="w-3 h-3 bg-[#00FF00] rounded-full shadow-[0_0_15px_#00FF00] animate-pulse"></div>
                 <div className="w-3 h-3 bg-[#00FF00] rounded-full shadow-[0_0_15px_#00FF00] animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>

            {/* Centered Header */}
            <div className="w-full flex flex-col items-center mb-20 animate-fade-in">
                <h1 className="text-zinc-400 font-black text-xl tracking-[0.4em] uppercase opacity-80">WingMentor</h1>
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-[8px] text-zinc-600 font-black tracking-[0.6em] uppercase">W1000 NXi</span>
                </div>
            </div>

            {/* Square App Icon Grid */}
            <div className="w-full max-w-4xl grid grid-cols-3 gap-x-12 gap-y-16 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                <Instrument 
                    bgImage="https://lh3.googleusercontent.com/d/1yLM_bGVPN8Sa__fqR95C0EeA1CUsTAA7" 
                    label="BLACKBOX" 
                    page={Page.BLACKBOX} 
                    setPage={setPage} 
                />
                <Instrument 
                    bgImage="https://lh3.googleusercontent.com/d/1GbUopHNGyXMhzi5sW1Ybo5gZMh2_YSKN" 
                    label="HANDBOOK" 
                    page={Page.HANDBOOK} 
                    setPage={setPage} 
                />
                <Instrument 
                    bgImage="https://lh3.googleusercontent.com/d/1HpzTC2mR312qpDeG6i1Cy4FU0JeRrfuE" 
                    label="SIMULATOR" 
                    page={Page.SIMULATOR} 
                    setPage={setPage} 
                    imgScale="scale-[2.1]"
                />
                <Instrument 
                    bgImage="https://lh3.googleusercontent.com/d/1InHXB-jhAZ3UNDXcvHbENwbB5ApY8eOp" 
                    label="FORUM" 
                    page={Page.FORUM} 
                    setPage={setPage} 
                />
                <Instrument 
                    bgImage="https://lh3.googleusercontent.com/d/11j7ZHv874EBZZ6O36etvuHC6rRWWm8kF" 
                    label="EXAMS" 
                    page={Page.EXAMS} 
                    setPage={setPage} 
                />
                <Instrument 
                    bgImage="https://lh3.googleusercontent.com/d/1sUUBI2blGY9oNoutvN9fH1cJ8j6RVOiX" 
                    label="PROFILE" 
                    page={Page.PROFILE} 
                    setPage={setPage} 
                    imgScale="scale-[2.1]" 
                    objectFit="object-cover"
                    objectPosition="38% 50%" 
                />
            </div>

            {/* Bottom Footer Details */}
            <div className="mt-20 flex items-center gap-4 opacity-0 animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
                <div className="text-[8px] text-zinc-800 font-black uppercase tracking-[0.8em]">
                    System Avionics Ready
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="h-full w-full bg-black text-white font-mono flex flex-col items-center justify-center p-2 animate-fade-in">
        <span className="text-g1000-amber font-bold mb-4 text-lg uppercase tracking-widest">Module Active</span>
         <p className="text-zinc-500 text-center mb-6 text-xs tracking-tighter uppercase font-bold">Primary display engaged.<br/>Press MENU to exit.</p>
        <button onClick={() => { setPage(Page.DASHBOARD); }} className="bg-white/5 border border-white/10 px-6 py-2 hover:bg-white/10 text-[10px] font-black tracking-widest uppercase transition-all">Back to Menu</button>
    </div>
  );
};

export default Dashboard;