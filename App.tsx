import React, { useState, useEffect, useMemo } from 'react';
import { CycleData, DailyLog, CyclePhase, ViewState } from './types';
import PhaseCard from './components/PhaseCard';
import LogModal from './components/LogModal';
import { Calendar as CalendarIcon, Home, Plus, Droplet, Heart, ChevronLeft, ChevronRight, Check, Rewind, FastForward, Sparkles } from 'lucide-react';

// --- Helper Functions ---
const formatLocalYMD = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalYMD = (dateStr: string) => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
};

const getDaysDiff = (date1: Date, date2: Date) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const d1 = new Date(date1); d1.setHours(0,0,0,0);
  const d2 = new Date(date2); d2.setHours(0,0,0,0);
  return Math.round((d1.getTime() - d2.getTime()) / oneDay);
};

// --- Custom Components ---

const HandDrawnHeartIcon = ({ 
    className, 
    fillOpacity = 0, 
    strokeWidth = 1.5 
}: { 
    className?: string, 
    fillOpacity?: number, 
    strokeWidth?: number 
}) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    <path 
      d="M12.08 7.2C12.3 4.5 14.5 2.5 17.2 2.5C20.2 2.5 22.5 5 22.5 8C22.5 13.5 16 18.5 12 22C8 18.5 1.5 13.5 1.5 8C1.5 5 3.8 2.5 6.8 2.5C9.5 2.5 11.7 4.5 12 7.2H12.08Z" 
      stroke="currentColor" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity={fillOpacity}
    />
  </svg>
);

const App: React.FC = () => {
  // --- State ---
  const [cycles, setCycles] = useState<CycleData[]>([]);
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [view, setView] = useState<ViewState>('HOME');
  const [showLogModal, setShowLogModal] = useState(false);
  const [today, setToday] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState(formatLocalYMD(new Date()));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [enableAI, setEnableAI] = useState(false);

  // --- Initialization ---
  useEffect(() => {
    const savedCycles = localStorage.getItem('cycles');
    const savedLogs = localStorage.getItem('logs');
    if (savedCycles) setCycles(JSON.parse(savedCycles));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  useEffect(() => {
    localStorage.setItem('cycles', JSON.stringify(cycles));
    localStorage.setItem('logs', JSON.stringify(logs));
  }, [cycles, logs]);

  // --- Computed Data ---
  const currentCycleStart = useMemo(() => {
    if (cycles.length === 0) return null;
    return cycles.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
  }, [cycles]);

  const cycleDay = useMemo(() => {
    if (!currentCycleStart) return 1;
    const start = parseLocalYMD(currentCycleStart.startDate);
    const current = new Date(today);
    const diff = getDaysDiff(current, start);
    return diff >= 0 ? diff + 1 : 1; 
  }, [currentCycleStart, today]);

  const isPeriodOngoing = useMemo(() => {
    if (!currentCycleStart) return false;
    if (!currentCycleStart.endDate) return true;
    const todayStr = formatLocalYMD(today);
    return todayStr <= currentCycleStart.endDate;
  }, [currentCycleStart, today]);

  const currentPhase = useMemo((): CyclePhase => {
    if (!currentCycleStart) return CyclePhase.Follicular; 

    const current = new Date(today);
    current.setHours(0,0,0,0);
    const start = parseLocalYMD(currentCycleStart.startDate);
    start.setHours(0,0,0,0);

    if (current < start) return CyclePhase.Follicular;

    if (isPeriodOngoing) return CyclePhase.Menstrual;
    if (cycleDay < 14) return CyclePhase.Follicular;
    if (cycleDay >= 14 && cycleDay <= 15) return CyclePhase.Ovulation;
    return CyclePhase.Luteal;
  }, [cycleDay, isPeriodOngoing, currentCycleStart, today]);


  // --- Handlers ---
  const handleSaveLog = (log: DailyLog) => {
    setLogs(prev => ({ ...prev, [log.date]: log }));
  };

  const startPeriodToday = () => {
    const todayStr = formatLocalYMD(today);
    if (currentCycleStart && currentCycleStart.startDate === todayStr) return;
    const newCycle: CycleData = { startDate: todayStr };
    setCycles(prev => [...prev, newCycle]);
    handleSaveLog({
      date: todayStr,
      flow: 'Medium',
      mood: [],
      symptoms: [],
      loveCount: (logs[todayStr]?.loveCount || 0),
      intimacy: (logs[todayStr]?.intimacy || false)
    });
  };

  const endPeriodToday = () => {
    if (!currentCycleStart) return;
    const todayStr = formatLocalYMD(today);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = formatLocalYMD(yesterday);

    if (currentCycleStart.startDate === todayStr) {
         setCycles(prev => prev.filter(c => c.startDate !== todayStr));
         return;
    }

    const updatedCycles = cycles.map(c => {
        if (c.startDate === currentCycleStart.startDate) {
            return { ...c, endDate: yesterdayStr };
        }
        return c;
    });
    setCycles(updatedCycles);
  };
  
  const handleLoveClick = () => {
    const todayStr = formatLocalYMD(today);
    const currentLog = logs[todayStr] || { date: todayStr };
    const newCount = (currentLog.loveCount || 0) + 1;
    handleSaveLog({ ...currentLog, loveCount: newCount });
  };

  const handleIntimacyToggle = () => {
    const todayStr = formatLocalYMD(today);
    const currentLog = logs[todayStr] || { date: todayStr };
    handleSaveLog({ ...currentLog, intimacy: !currentLog.intimacy });
  };

  const shiftTime = (days: number) => {
    const newDate = new Date(today);
    newDate.setDate(today.getDate() + days);
    setToday(newDate);
  };

  // --- Calendar Helpers ---
  const getPeriodStatus = (dateStr: string): 'Light' | 'Medium' | 'Heavy' | null => {
    const log = logs[dateStr];
    if (log?.flow) return log.flow;
    const todayStr = formatLocalYMD(today);
    for (const cycle of cycles) {
      if (cycle.endDate) {
        if (dateStr >= cycle.startDate && dateStr <= cycle.endDate) return 'Medium';
      } else if (cycle.startDate === currentCycleStart?.startDate) {
         if (dateStr >= cycle.startDate && dateStr <= todayStr) return 'Medium';
      }
    }
    return null;
  };

  const getPeriodColorClass = (status: 'Light' | 'Medium' | 'Heavy' | null, isToday: boolean) => {
    if (!status) return isToday ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100';
    const baseClass = isToday ? 'border-2 border-gray-800' : 'shadow-md shadow-rose-200';
    switch (status) {
        case 'Light': return `${baseClass} bg-rose-200 text-rose-800`;
        case 'Heavy': return `${baseClass} bg-rose-400 text-white`;
        case 'Medium': 
        default: return `${baseClass} bg-rose-300 text-white`;
    }
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  };
  
  const todayStr = formatLocalYMD(today);
  const todayLoveCount = logs[todayStr]?.loveCount || 0;
  const todayIntimacy = logs[todayStr]?.intimacy || false;

  return (
    <div className="h-full w-full bg-[#fffcfb] text-gray-800 relative overflow-hidden font-sans flex flex-col">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-pink-100/40 rounded-full blur-[120px] mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-50/50 rounded-full blur-[100px] mix-blend-multiply"></div>
      </div>

      {/* Main Content Area */}
      {/* UPDATED: Added safe-area padding to top (pt) and bottom (pb) */}
      <main className="relative z-10 w-full max-w-md mx-auto flex-1 flex flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(6rem,env(safe-area-inset-bottom))] overflow-hidden">
        
        {/* Header - Fixed Top */}
        <header className="flex justify-between items-center mb-2 pt-2 flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">悦悦，今天好</h1>
            <p className="text-gray-400 text-xs font-medium mt-0.5">
              {today.toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
             <button 
                onClick={() => setEnableAI(!enableAI)}
                className={`flex items-center justify-center p-2.5 rounded-full shadow-sm border transition-all duration-300 ${
                  enableAI 
                  ? 'bg-gradient-to-tr from-indigo-100 to-purple-100 border-purple-200 text-purple-600' 
                  : 'bg-white/50 border-gray-100 text-gray-300'
                }`}
             >
                <Sparkles size={16} fill={enableAI ? "currentColor" : "none"} />
             </button>
            <div className="flex items-center gap-1 bg-white/50 backdrop-blur-sm p-1 rounded-full shadow-sm border border-gray-100">
              <button onClick={() => shiftTime(-1)} className="p-1.5 rounded-full hover:bg-white text-gray-400 hover:text-rose-400">
                <Rewind size={16} />
              </button>
              <div className="w-px h-3 bg-gray-200"></div>
              <button onClick={() => shiftTime(1)} className="p-1.5 rounded-full hover:bg-white text-gray-400 hover:text-emerald-400">
                <FastForward size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Content - Fills the space */}
        <div className="flex-1 flex flex-col min-h-0">
          {view === 'HOME' && (
            <div className="animate-fade-in-up flex-1 flex flex-col h-full">
              
              {/* Spacer - Top (Increased for balance) */}
              <div className="flex-[4]" /> 

              {/* Main Card - Takes dominant space */}
              <div className="flex-shrink-0 flex-grow-[5] flex flex-col justify-center min-h-[360px] w-full">
                {currentCycleStart ? (
                  <PhaseCard 
                    phase={currentPhase} 
                    dayOfCycle={cycleDay} 
                    enableAI={enableAI}
                  />
                ) : (
                  <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-6 text-center shadow-xl border border-white/50 h-full flex flex-col items-center justify-between">
                    <div className="flex-shrink-0 mt-4 mb-2">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">欢迎来到 Luna</h2>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            开始记录，<br/>更加了解身体的节奏。
                        </p>
                    </div>
                    
                    <div className="flex-1 w-full flex items-center justify-center min-h-0 overflow-hidden py-2">
                        <img 
                            src="ikaola.jpeg" 
                            alt="Welcome Koala" 
                            className="w-full h-full object-contain max-h-[220px] drop-shadow-xl"
                        />
                    </div>

                    <div className="h-2 flex-shrink-0" />
                  </div>
                )}
              </div>

              {/* Spacer - Middle (Significantly increased to separate card and buttons) */}
              <div className="flex-[3]" />

              {/* Quick Actions - Pushed lower by the spacer above */}
              <div className="grid grid-cols-3 gap-4 mb-1 flex-shrink-0">
                <button 
                  onClick={() => {
                    setSelectedDate(formatLocalYMD(today));
                    setShowLogModal(true);
                  }}
                  className="bg-white/80 backdrop-blur-sm py-4 px-2 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group border border-gray-100"
                >
                  <div className="p-2.5 bg-indigo-50/50 text-indigo-400 rounded-full group-hover:bg-indigo-100 transition-colors">
                     <Plus size={18} />
                  </div>
                  <span className="font-semibold text-gray-600 text-xs">记录今天</span>
                </button>
                
                <button 
                  onClick={isPeriodOngoing ? endPeriodToday : startPeriodToday}
                  className="bg-white/80 backdrop-blur-sm py-4 px-2 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group border border-gray-100"
                >
                  <div className={`p-2.5 rounded-full transition-colors ${
                      isPeriodOngoing 
                      ? 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100' 
                      : 'bg-rose-50 text-rose-400 group-hover:bg-rose-100'
                  }`}>
                     {isPeriodOngoing ? <Check size={18} /> : <Droplet size={18} />}
                  </div>
                  <span className="font-semibold text-gray-600 text-xs">
                      {isPeriodOngoing ? "经期结束" : "经期开始"}
                  </span>
                </button>

                <button 
                  onClick={handleLoveClick}
                  className="bg-white/80 backdrop-blur-sm py-4 px-2 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group border border-gray-100 relative overflow-hidden"
                >
                  <div className="p-2.5 bg-purple-50 text-purple-400 rounded-full group-hover:bg-purple-100 transition-colors group-active:scale-125 duration-150">
                     <HandDrawnHeartIcon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <span className="font-semibold text-gray-600 text-xs">想帅帅了</span>
                  {todayLoveCount > 0 && (
                      <span className="absolute top-2 right-2 bg-purple-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                          {todayLoveCount}
                      </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {view === 'CALENDAR' && (
            <div className="animate-fade-in-up h-full flex flex-col pb-4">
               <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-5 shadow-xl flex-1 border border-white/60 flex flex-col">
                  <div className="flex justify-between items-center mb-6 px-1 flex-shrink-0">
                     <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                       <ChevronLeft size={20} />
                     </button>
                     <h2 className="text-lg font-bold text-gray-800 tracking-wide">
                       {currentMonth.toLocaleDateString('zh-CN', { month: 'long', year: 'numeric' })}
                     </h2>
                     <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                       <ChevronRight size={20} />
                     </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2 flex-shrink-0">
                    {['日','一','二','三','四','五','六'].map(d => (
                      <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-y-3 gap-x-1 flex-1 content-start overflow-y-auto no-scrollbar">
                    {generateCalendarDays().map((date, idx) => {
                      if (!date) return <div key={`empty-${idx}`} />;
                      
                      const dateStr = formatLocalYMD(date);
                      const isToday = today.toDateString() === date.toDateString();
                      const periodStatus = getPeriodStatus(dateStr);
                      const colorClass = getPeriodColorClass(periodStatus, isToday);
                      const hasLog = logs[dateStr];
                      const hasIntimacy = logs[dateStr]?.intimacy;
                      const loveCount = logs[dateStr]?.loveCount || 0;

                      return (
                        <button 
                          key={idx}
                          onClick={() => {
                            setSelectedDate(dateStr);
                            setShowLogModal(true);
                          }}
                          className={`
                            relative h-10 w-10 mx-auto rounded-full flex items-center justify-center text-sm font-medium transition-all
                            ${colorClass}
                          `}
                        >
                          {date.getDate()}
                          
                          {hasIntimacy && (
                              <Heart size={8} className="absolute top-0 right-0 translate-x-1 -translate-y-1 text-rose-500 fill-rose-500 drop-shadow-sm" />
                          )}

                          {loveCount > 0 && (
                              <div className={`absolute bottom-[-3px] right-[-3px] transition-transform ${
                                  loveCount >= 6 ? 'scale-110' : 'scale-100'
                              }`}>
                                  <HandDrawnHeartIcon 
                                      className={`drop-shadow-sm transition-colors ${
                                          loveCount >= 6 
                                              ? 'text-purple-700 w-3 h-3' 
                                              : loveCount >= 2 
                                                  ? 'text-purple-500 w-2.5 h-2.5' 
                                                  : 'text-purple-300 w-2.5 h-2.5' 
                                      }`}
                                      fillOpacity={loveCount >= 6 ? 0.8 : loveCount >= 2 ? 0.3 : 0}
                                      strokeWidth={loveCount >= 6 ? 2.5 : loveCount >= 2 ? 2 : 1.5}
                                  />
                              </div>
                          )}

                          {hasLog && !periodStatus && !isToday && !hasIntimacy && loveCount === 0 && (
                             <span className="absolute bottom-1 w-1 h-1 rounded-full bg-gray-400"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
               </div>
            </div>
          )}
        </div>

      </main>

      {/* Floating Navigation */}
      {/* UPDATED: Added safe-area padding to bottom */}
      <nav className="fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur-xl px-10 py-4 rounded-[2.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] flex gap-12 items-center border border-white/50">
        <button 
          onClick={() => setView('HOME')}
          className={`transition-all duration-300 ${view === 'HOME' ? 'text-gray-900 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Home size={24} strokeWidth={view === 'HOME' ? 2.5 : 2} />
        </button>
        {/* Intimacy toggle button */}
        <button 
           onClick={handleIntimacyToggle}
           className={`p-4 rounded-full shadow-lg -mt-12 border-[5px] border-[#fffcfb] transform active:scale-95 transition-all duration-300 ${
               todayIntimacy 
               ? 'bg-rose-500 text-white shadow-rose-200' 
               : 'bg-white text-rose-300 shadow-gray-200 hover:text-rose-400'
           }`}
        >
          <Heart size={28} fill={todayIntimacy ? "currentColor" : "none"} />
        </button>
        <button 
          onClick={() => setView('CALENDAR')}
          className={`transition-all duration-300 ${view === 'CALENDAR' ? 'text-gray-900 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <CalendarIcon size={24} strokeWidth={view === 'CALENDAR' ? 2.5 : 2} />
        </button>
      </nav>

      {/* Modals */}
      {showLogModal && (
        <LogModal 
          date={selectedDate}
          onSave={handleSaveLog}
          onClose={() => setShowLogModal(false)}
          existingLog={logs[selectedDate]}
        />
      )}
    </div>
  );
};

export default App;