
import React, { useState, useEffect, useMemo } from 'react';
import { CycleData, DailyLog, CyclePhase, ViewState } from './types';
import PhaseCard from './components/PhaseCard';
import LogModal from './components/LogModal';
import { Calendar as CalendarIcon, Home, Plus, Droplet, Heart, ChevronLeft, ChevronRight, Check, Rewind, FastForward, Sparkles } from 'lucide-react';

// Fix: Define HandDrawnHeartIcon as an alias for the imported Heart component from lucide-react
const HandDrawnHeartIcon = Heart;

// --- Constants ---
const DEFAULT_CYCLE_LENGTH = 28;
const MIN_CYCLE_GAP = 15; // 两个经期起始点之间的最小间隔（天）
const SAFETY_PERIOD_LIMIT = 10; // 经期自动失效的安全天数
const LOVE_COLOR = '#B564E3'; // 统一的爱心颜色

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
  
  // 核心逻辑：寻找相对于“当前查看日期”的最后一次月经开始时间
  const activeCycle = useMemo(() => {
    if (cycles.length === 0) return null;
    const todayStr = formatLocalYMD(today);
    // 过滤掉所有在“today”之后的经期起始记录，并按时间倒序排列
    const pastCycles = [...cycles]
      .filter(c => c.startDate <= todayStr)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    
    return pastCycles[0] || null;
  }, [cycles, today]);

  const cycleDay = useMemo(() => {
    if (!activeCycle) return null;
    const start = parseLocalYMD(activeCycle.startDate);
    const current = new Date(today);
    const diff = getDaysDiff(current, start);
    return diff + 1; 
  }, [activeCycle, today]);

  // 经期判定逻辑
  const isPeriodOngoing = useMemo(() => {
    if (!activeCycle) return false;
    const todayStr = formatLocalYMD(today);
    const start = parseLocalYMD(activeCycle.startDate);
    const diff = getDaysDiff(today, start);
    
    if (activeCycle.endDate) {
       // 如果有结束日期：月经期包含开始当天，但不包含结束当天
       return todayStr >= activeCycle.startDate && todayStr < activeCycle.endDate;
    } else {
       // 如果没有结束日期：在安全限制内（10天）认为是月经期
       return diff >= 0 && diff < SAFETY_PERIOD_LIMIT;
    }
  }, [activeCycle, today]);

  // Fix: Corrected double assignment typo 'const currentPhase = currentPhase = ...' to 'const currentPhase = ...'
  const currentPhase = useMemo((): CyclePhase | null => {
    if (!activeCycle || cycleDay === null) return null; 

    // 如果在月经持续判定中，显示月经期
    if (isPeriodOngoing) return CyclePhase.Menstrual;
    
    // 如果没有结束日期且超过了安全限制天数，恢复到默认界面
    if (!activeCycle.endDate && cycleDay > SAFETY_PERIOD_LIMIT) return null;

    // 默认周期阶段划分
    if (cycleDay < 14) return CyclePhase.Follicular;
    if (cycleDay >= 14 && cycleDay <= 15) return CyclePhase.Ovulation;
    if (cycleDay > 15 && cycleDay <= 32) return CyclePhase.Luteal;
    
    return CyclePhase.Luteal; 
  }, [cycleDay, isPeriodOngoing, activeCycle]);


  // --- Handlers ---
  const handleSaveLog = (log: DailyLog) => {
    setLogs(prev => ({ ...prev, [log.date]: log }));
  };

  const startPeriodToday = () => {
    const todayStr = formatLocalYMD(today);
    const targetDate = parseLocalYMD(todayStr);

    const nearbyCycleIndex = cycles.findIndex(c => {
        const cDate = parseLocalYMD(c.startDate);
        const diff = Math.abs(getDaysDiff(targetDate, cDate));
        return diff < MIN_CYCLE_GAP;
    });

    let newCycles = [...cycles];

    if (nearbyCycleIndex !== -1) {
        const existing = newCycles[nearbyCycleIndex];
        if (todayStr < existing.startDate) {
            newCycles[nearbyCycleIndex] = { ...existing, startDate: todayStr };
        } else if (todayStr === existing.startDate) {
            return; 
        } else {
            return; 
        }
    } else {
        newCycles.push({ startDate: todayStr });
    }

    newCycles.sort((a, b) => a.startDate.localeCompare(b.startDate));
    setCycles(newCycles);

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
    if (!activeCycle) return;
    const todayStr = formatLocalYMD(today);
    
    // 如果当天开始当天点结束，则视为误触，删除记录
    if (activeCycle.startDate === todayStr) {
         setCycles(prev => prev.filter(c => c.startDate !== todayStr));
         return;
    }

    const updatedCycles = cycles.map(c => {
        if (c.startDate === activeCycle.startDate) {
            return { ...c, endDate: todayStr };
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
    
    for (const cycle of cycles) {
      if (cycle.endDate) {
        if (dateStr >= cycle.startDate && dateStr < cycle.endDate) return 'Medium';
      } else {
        const start = parseLocalYMD(cycle.startDate);
        const date = parseLocalYMD(dateStr);
        const diff = getDaysDiff(date, start);
        if (diff >= 0 && diff < SAFETY_PERIOD_LIMIT) return 'Medium';
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
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-pink-100/40 rounded-full blur-[120px] mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-50/50 rounded-full blur-[100px] mix-blend-multiply"></div>
      </div>

      <main className="relative z-10 w-full max-w-md mx-auto flex-1 flex flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(6rem,env(safe-area-inset-bottom))] overflow-hidden">
        
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

        <div className="flex-1 flex flex-col min-h-0">
          {view === 'HOME' && (
            <div className="animate-fade-in-up flex-1 flex flex-col h-full">
              
              <div className="flex-[4]" /> 

              <div className="flex-shrink-0 flex-grow-[5] flex flex-col justify-center min-h-[360px] w-full">
                {currentPhase && cycleDay !== null ? (
                  <PhaseCard 
                    phase={currentPhase} 
                    dayOfCycle={cycleDay} 
                    enableAI={enableAI}
                  />
                ) : (
                  <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-6 text-center shadow-xl border border-white/50 h-full flex flex-col items-center justify-center group overflow-hidden relative">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-50 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex-shrink-0 mt-2 mb-4 relative z-10">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">待开启的 Luna</h2>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-[200px] mx-auto">
                            {cycles.length === 0 
                              ? "记录第一笔月经，开启你的身体韵律之旅。"
                              : "在该日期之前没有记录哦，要追溯更早的时光吗？"}
                        </p>
                    </div>
                    
                    <div className="w-full flex-1 flex items-center justify-center min-h-[180px] overflow-hidden py-4">
                        <div className="relative w-full h-full flex items-center justify-center">
                            <div className="absolute inset-0 bg-rose-200/20 rounded-full blur-3xl scale-110"></div>
                            <img 
                                src="./public/ikaola.jpeg" 
                                alt="Luna Illustration" 
                                className="w-48 h-48 md:w-56 md:h-56 object-contain drop-shadow-2xl relative z-10"
                            />
                        </div>
                    </div>
                    
                    <div className="h-8" />
                  </div>
                )}
              </div>

              <div className="flex-[3]" />

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
                  <span className="font-semibold text-gray-600 text-xs text-center leading-tight">
                      {isPeriodOngoing ? "经期结束" : "经期开始"}
                  </span>
                </button>

                <button 
                  onClick={handleLoveClick}
                  className="bg-white/80 backdrop-blur-sm py-4 px-2 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group border border-gray-100 relative overflow-hidden"
                >
                  <div className="p-2.5 bg-purple-50 text-purple-400 rounded-full group-hover:bg-purple-100 transition-colors group-active:scale-125 duration-150">
                     <HandDrawnHeartIcon className="w-5 h-5" strokeWidth={2} style={{ color: LOVE_COLOR }} />
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
                      const currentLoveCount = logs[dateStr]?.loveCount || 0;

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

                          {currentLoveCount > 0 && (
                              <div className={`absolute bottom-[-3px] right-[-3px] transition-transform ${
                                  currentLoveCount >= 6 ? 'scale-125' : (currentLoveCount >= 2 ? 'scale-110' : 'scale-100')
                              }`}>
                                  <HandDrawnHeartIcon 
                                      style={{ color: LOVE_COLOR }}
                                      className={`drop-shadow-sm transition-all ${
                                          currentLoveCount >= 6 
                                              ? 'w-3.5 h-3.5' 
                                              : currentLoveCount >= 2 
                                                  ? 'w-3 h-3' 
                                                  : 'w-2.5 h-2.5' 
                                      }`}
                                      fill={currentLoveCount === 1 ? 'none' : LOVE_COLOR}
                                      fillOpacity={currentLoveCount >= 6 ? 0.8 : (currentLoveCount >= 2 ? 0.4 : 0)}
                                      strokeWidth={currentLoveCount >= 6 ? 2.5 : (currentLoveCount >= 2 ? 2.5 : 2)}
                                  />
                              </div>
                          )}

                          {hasLog && !periodStatus && !isToday && !hasIntimacy && currentLoveCount === 0 && (
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

      <nav className="fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur-xl px-10 py-4 rounded-[2.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] flex gap-12 items-center border border-white/50">
        <button 
          onClick={() => setView('HOME')}
          className={`transition-all duration-300 ${view === 'HOME' ? 'text-gray-900 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Home size={24} strokeWidth={view === 'HOME' ? 2.5 : 2} />
        </button>
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
