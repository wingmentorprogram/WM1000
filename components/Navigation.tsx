import React from 'react';
import { Page } from '../types.ts';
import { playSound } from '../services/audioService.ts';

interface NavigationProps {
  activePage: Page;
  setPage: (page: Page) => void;
  currentView: 'PFD' | 'MFD';
  isMiniMfdOpen: boolean;
  setIsMiniMfdOpen: (isOpen: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activePage, setPage, currentView, isMiniMfdOpen, setIsMiniMfdOpen }) => {
  const hasMiniMfd = [Page.HANDBOOK, Page.EXAMS, Page.FORUM].includes(activePage);
  
  let miniMfdLabel = 'INDEX';
  if (activePage === Page.HANDBOOK) miniMfdLabel = 'CHAPTERS';
  if (activePage === Page.EXAMS) miniMfdLabel = 'EXAMS';
  if (activePage === Page.FORUM) miniMfdLabel = 'TOPICS';

  const navItems = [
    { page: Page.DASHBOARD, label: 'MENU' },
    { page: Page.HANDBOOK, label: 'HNDBK' },
    { page: Page.EXAMS, label: 'EXAMS' },
    { page: Page.SIMULATOR, label: 'SIM' },
    { page: Page.BLACKBOX, label: 'DATA' },
    { page: Page.COMMS, label: 'COMMS' },
    { page: Page.FORUM, label: 'FORUM' },
    { page: Page.PROFILE, label: 'PROF' },
    (currentView === 'PFD' && hasMiniMfd) ? { 
        label: isMiniMfdOpen ? `CLOSE` : miniMfdLabel, 
        action: () => setIsMiniMfdOpen(!isMiniMfdOpen),
        isActive: isMiniMfdOpen
    } : null,
    null,
    null,
    { page: Page.DASHBOARD, label: 'BACK', isBack: true },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-end px-4 pb-2 relative z-20">
       
       <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none"></div>

        {/* Bezel strip for labels */}
        <div className="flex justify-between items-center w-full h-6 mb-1">
          {navItems.map((item, i) => {
             let isActive = false;
             if (item) {
                 if ('page' in item) {
                     isActive = activePage === item.page && !item.isBack;
                 } else {
                     isActive = !!item.isActive;
                 }
             }
             return (
                <div key={`label-${i}`} className="flex-1 text-center">
                    {item ? (
                        <span className={`text-[10px] font-mono font-bold tracking-tight transition-colors ${isActive ? 'text-g1000-cyan' : 'text-g1000-white/70'}`}>
                            {item.label}
                        </span>
                    ) : <div />}
                </div>
            )
          })}
        </div>

       {/* Buttons row */}
       <div className="flex justify-between items-end w-full gap-1">
         {navItems.map((item, i) => (
           <div key={i} className="flex flex-col items-center justify-end w-full relative group">
              <button
                onClick={() => {
                  playSound('click');
                  if (item) {
                    if ('page' in item) setPage(item.page);
                    if ('action' in item) (item as any).action();
                  }
                }}
                disabled={!item}
                className={`
                  relative w-full h-8 rounded-[3px] transition-all duration-75 material-rubber
                  border-t border-white/10 border-x border-black/60 border-b border-black
                  ${item 
                    ? 'cursor-pointer shadow-softkey active:shadow-softkey-pressed active:translate-y-[2px] active:border-t-transparent hover:brightness-125' 
                    : 'cursor-default opacity-30 shadow-none border-none bg-[#111]'
                  }
                `}
              >
                 {item && (
                   <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[60%] h-[2px] bg-black/50 border-b border-white/10 rounded-full shadow-[0_1px_0_rgba(255,255,255,0.1)]"></div>
                 )}
              </button>
           </div>
         ))}
       </div>
    </div>
  );
};

export default Navigation;