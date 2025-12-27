import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, FileText, Clock, BarChart2, BookOpen } from 'lucide-react';
import { ExamType } from '../types';

interface ExamTerminalProps {
  examId?: string | number | null;
  onSelectExam?: (id: string | number) => void;
  isMini?: boolean;
}

const exams = [
  { id: 1, title: 'Air Law & Operational Procedures', type: ExamType.PPL, questions: 20, time: '30 min', difficulty: 'Medium' },
  { id: 2, title: 'Aircraft General Knowledge', type: ExamType.PPL, questions: 25, time: '40 min', difficulty: 'Hard' },
  { id: 3, title: 'Flight Planning & Performance', type: ExamType.CPL, questions: 30, time: '60 min', difficulty: 'Hard' },
  { id: 4, title: 'Meteorology Advanced', type: ExamType.IR, questions: 40, time: '50 min', difficulty: 'Extreme' },
  { id: 5, title: 'Multi-Engine Aerodynamics', type: ExamType.ME, questions: 15, time: '20 min', difficulty: 'Medium' },
  { id: 6, title: 'Human Performance', type: ExamType.CPL, questions: 20, time: '25 min', difficulty: 'Easy' },
];

const ExamTerminal: React.FC<ExamTerminalProps> = ({ examId, onSelectExam, isMini = false }) => {
  const [selectedType, setSelectedType] = useState<ExamType>(ExamType.PPL);

  // PFD DETAIL/ACTION VIEW
  if (examId && !isMini) {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return <div className="p-8 text-center text-red-500 animate-fade-in">Error: Exam not found.</div>;
    
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center text-center pb-32 animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
        <div className="p-4 bg-slate-800 rounded-full mb-6 border-4 border-slate-700 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
           <BookOpen className="w-16 h-16 text-aviation-accent" />
        </div>
        <p className="text-aviation-accent font-bold mb-2 tracking-widest">{exam.type} RATING EXAM</p>
        <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">{exam.title}</h2>
        <div className="flex items-center gap-6 text-lg text-slate-400 mb-8">
            <div className="flex items-center gap-2"><Clock className="w-5 h-5" /> {exam.time}</div>
            <div className="flex items-center gap-2"><FileText className="w-5 h-5" /> {exam.questions} Questions</div>
        </div>
        <button className="group bg-emerald-600 hover:bg-emerald-500 text-white px-12 py-4 rounded-full font-bold text-xl transition-all shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] flex items-center gap-3 active:scale-95">
          Begin Assessment
          <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>
        <p className="text-xs text-slate-600 mt-4 font-mono">THIS IS A TIMED ASSESSMENT. DATA IS TRANSMITTED IN REAL-TIME.</p>
      </div>
    );
  }

  // MFD LIST VIEW or MINI MFD LIST VIEW
  const filteredExams = exams.filter(exam => exam.type === selectedType);
  return (
    <div className={`h-full w-full text-white font-mono flex flex-col animate-fade-in opacity-0 ${isMini ? 'bg-transparent p-2' : 'bg-black p-2'}`} style={{ animationFillMode: 'forwards' }}>
      <div className={`flex justify-between items-center border-b pb-1 mb-2 ${isMini ? 'border-white/10' : 'border-white/20'}`}>
        <span className={`text-g1000-magenta font-bold tracking-widest ${isMini ? 'text-base' : 'text-lg'}`}>EXAM TERMINAL</span>
        <div className="flex gap-1">
          {Object.values(ExamType).map(type => (
            <button key={type} onClick={() => { setSelectedType(type); }} className={`px-2 py-0.5 text-[10px] rounded-sm font-bold transition-colors ${selectedType === type ? 'bg-g1000-cyan text-black' : 'bg-g1000-darkgray text-white hover:bg-zinc-700'}`}>
              {type}
            </button>
          ))}
        </div>
      </div>
      <div className={`flex-1 overflow-y-auto ${isMini ? '' : 'border border-white/20 bg-black relative'}`}>
         <div className="grid grid-cols-12 bg-g1000-darkgray/40 border-b border-white/20 text-xs text-g1000-cyan font-bold py-1 px-2 sticky top-0">
            <div className="col-span-8">EXAM TITLE</div>
            <div className="col-span-2 text-center">Q'S</div>
            <div className="col-span-2 text-right">TIME</div>
         </div>
         <div className="p-1 space-y-0.5">
            {filteredExams.map((exam, idx) => (
               <button 
                  key={exam.id}
                  onClick={() => { onSelectExam?.(exam.id); }}
                  className="w-full grid grid-cols-12 py-2 px-2 border hover:bg-white/10 transition-all text-left border-transparent hover:border-g1000-cyan text-white cursor-pointer group animate-fade-in opacity-0"
                  style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'forwards' }}
               >
                  <div className="col-span-8 font-bold truncate group-hover:text-g1000-cyan text-xs">{exam.title}</div>
                  <div className="col-span-2 text-center text-g1000-amber text-xs">{exam.questions}</div>
                  <div className="col-span-2 text-right text-[10px] pt-0.5 text-slate-400">{exam.time}</div>
               </button>
            ))}
             {filteredExams.length === 0 && (
               <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                 No exams for this rating.
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default ExamTerminal;