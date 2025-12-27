import React from 'react';
import { MessageSquare, User, ArrowLeft } from 'lucide-react';

interface ForumProps {
  postId?: string | number | null;
  onSelectSubPage?: (id: string | number) => void;
  isMini?: boolean;
}

const forumPosts = [
  { 
    id: '1', 
    author: 'CFI_Dave', 
    title: 'Challenges and Triumphs of a Low-Time Pilot', 
    replies: 78, 
    lastPost: '2 min ago',
    content: 'The journey from zero hours to the right seat of an airliner is a marathon, not a sprint. The initial grind of building hours can be tough, but every flight is a learning opportunity. What are some of your biggest challenges and how did you overcome them?'
  },
  { 
    id: '2', 
    author: 'Recruiter_Sky', 
    title: 'Bridging the Gap: The Global Pilot Shortage', 
    replies: 152, 
    lastPost: '15 min ago',
    content: 'With retirements looming and travel demand soaring, the industry needs new pilots more than ever. This thread is for discussing current hiring trends, what airlines are looking for, and how to position yourself for success.'
  },
  { 
    id: '3', 
    author: 'InvestoPilot', 
    title: 'Case Study: The ROI on Pilot Training Investment', 
    replies: 45, 
    lastPost: '1 hr ago',
    content: 'Let\'s talk numbers. Training is expensive, but the career can be lucrative. I\'m sharing my personal cost breakdown, financing strategies, and projected career earnings. Please contribute your own experiences and advice.'
  },
  {
    id: '4',
    author: 'Capt. Smith',
    title: 'Tips for mastering crosswind landings?',
    replies: 14,
    lastPost: '3 hr ago',
    content: 'Crosswind landings separate the pros from the amateurs. What are your go-to techniques? The wing-low (sideslip) method, the de-crab (kick-out) method, or a combination? Let\'s discuss aileron into the wind and proper rudder usage.'
  },
  {
    id: '5',
    author: 'StudentPilot_99',
    title: 'Best headset for long cross-countries?',
    replies: 28,
    lastPost: '8 hr ago',
    content: 'Looking to invest in a good ANR headset. My budget is around $800. What are the pros and cons of the big brands like Bose, Lightspeed, and David Clark for long flights? Comfort and battery life are my main concerns.'
  },
  {
    id: '6',
    author: 'WeatherEye',
    title: 'Understanding the new TAF codes',
    replies: 5,
    lastPost: '1d ago',
    content: 'Some of the terminology in Terminal Aerodrome Forecasts can be tricky, especially with recent changes. Let\'s break down terms like TEMPO, PROB30, and BECMG and how they should affect our go/no-go decisions.'
  }
];

const Forum: React.FC<ForumProps> = ({ postId, onSelectSubPage, isMini = false }) => {
  // PFD DETAIL VIEW
  if (postId && !isMini) {
    const post = forumPosts.find(p => p.id === postId);
    if (!post) return <div className="p-8 text-center text-red-500 animate-fade-in">Error: Post not found.</div>;
    
    return (
       <div className="h-full overflow-y-auto bg-slate-50 text-slate-900 shadow-2xl relative min-h-[600px] p-8 md:p-12 animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="relative z-10 max-w-3xl mx-auto">
             <div className="mb-8 border-b-2 border-slate-900 pb-4 animate-fade-in opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">{post.title}</h1>
                 <div className="flex items-center gap-4 mt-4 text-sm text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5 bg-slate-200 px-3 py-1 rounded-full"><User className="w-4 h-4" /> {post.author}</div>
                    <div className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> {post.replies} Replies</div>
                 </div>
             </div>
             <div className="prose prose-slate max-w-none text-lg leading-relaxed animate-fade-in opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
               <p className="font-semibold text-slate-700">{post.content}</p>
               <hr className="my-8 border-slate-200" />
               <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.</p>
               <p>The transition to multi-engine operations brings a significant increase in workload. Understanding critical engine failure procedures is paramount. What are your specific checklists for OEI (One Engine Inoperative) scenarios during the climb phase?</p>
             </div>
          </div>
       </div>
    );
  }

  // MFD LIST VIEW or MINI MFD LIST VIEW
  return (
    <div className={`h-full w-full text-white font-mono flex flex-col animate-fade-in opacity-0 ${isMini ? 'bg-transparent p-2' : 'bg-black p-2'}`} style={{ animationFillMode: 'forwards' }}>
      <div className={`flex justify-between items-center border-b pb-1 mb-2 ${isMini ? 'border-white/10' : 'border-white/20'}`}>
        <span className={`text-g1000-magenta font-bold tracking-widest ${isMini ? 'text-base' : 'text-lg'}`}>COMMUNITY FORUM</span>
        {!isMini && <span className="text-xs text-g1000-white">PAGE 1/3</span>}
      </div>
      <div className={`flex-1 overflow-y-auto ${isMini ? '' : 'border border-white/20 bg-black relative'}`}>
         <div className="grid grid-cols-12 bg-g1000-darkgray/40 border-b border-white/20 text-xs text-g1000-cyan font-bold py-1 px-2 sticky top-0 z-10">
            <div className={isMini ? "col-span-10" : "col-span-7"}>TOPIC</div>
            <div className={isMini ? "col-span-2 text-center" : "col-span-2"}>{isMini ? "REP" : "AUTHOR"}</div>
            {!isMini && <div className="col-span-1 text-center">REPLIES</div>}
            {!isMini && <div className="col-span-2 text-right">LAST POST</div>}
         </div>
         <div className="p-1 space-y-0.5">
            {forumPosts.map((post, idx) => (
               <button 
                  key={post.id}
                  onClick={() => { onSelectSubPage?.(post.id); }}
                  className="w-full grid grid-cols-12 py-2 px-2 text-sm border hover:bg-white/10 transition-all text-left border-transparent hover:border-g1000-cyan text-white cursor-pointer group animate-fade-in opacity-0"
                  style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'forwards' }}
               >
                  <div className={`${isMini ? "col-span-10" : "col-span-7"} font-bold truncate group-hover:text-g1000-cyan text-xs`}>{post.title}</div>
                  <div className={`${isMini ? "col-span-2 text-center" : "col-span-2"} text-[10px] pt-0.5 text-slate-400 truncate`}>{isMini ? post.replies : post.author}</div>
                  {!isMini && <div className="col-span-1 text-center text-g1000-amber">{post.replies}</div>}
                  {!isMini && <div className="col-span-2 text-right text-xs pt-0.5 text-slate-500">{post.lastPost}</div>}
               </button>
            ))}
         </div>
         {!isMini && (
             <div className="absolute bottom-2 left-2 right-2 border border-white/30 bg-black p-2 animate-fade-in opacity-0" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
                 <div className="text-[10px] text-g1000-cyan mb-1 font-bold">SELECT A THREAD TO VIEW ON PFD</div>
                 <p className="text-xs text-slate-300 truncate">
                   Use the FMS knob to scroll and press ENT to select a topic.
                 </p>
             </div>
         )}
      </div>
       {!isMini && (
          <div className="mt-2 flex justify-end gap-2 text-black text-[10px] font-bold">
             <div className="bg-g1000-cyan px-2 py-0.5 rounded-sm">SELECT</div>
             <div className="bg-white px-2 py-0.5 rounded-sm">REPLY</div>
             <div className="bg-white px-2 py-0.5 rounded-sm">NEW</div>
             <div className="bg-white px-2 py-0.5 rounded-sm">BACK</div>
          </div>
       )}
    </div>
  );
};

export default Forum;