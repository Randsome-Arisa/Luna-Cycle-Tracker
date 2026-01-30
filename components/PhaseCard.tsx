
import React, { useState, useEffect } from 'react';
import { PHASE_DETAILS, STATIC_INSIGHTS } from '../constants';
import { CyclePhase } from '../types';
import { Moon, Sparkles, Sun, CloudFog, MessageCircleHeart, Info, HelpCircle } from 'lucide-react';
import { getDailyInsight } from '../services/geminiService';

interface PhaseCardProps {
  phase: CyclePhase | null;
  dayOfCycle: number | null;
  enableAI: boolean;
  userName?: string;
}

const PhaseCard: React.FC<PhaseCardProps> = ({ phase, dayOfCycle, enableAI, userName = "亲爱的" }) => {
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Fallback info for "no phase"
  const info = phase ? PHASE_DETAILS[phase] : {
    name: "未知阶段",
    description: "我们需要更多的记录来了解你的身体节奏。",
    color: 'bg-gray-50',
    textColor: 'text-gray-400',
    icon: 'HelpCircle',
    daysRange: '-'
  };

  // Icon mapping
  const Icon = phase === CyclePhase.Menstrual ? Moon :
               phase === CyclePhase.Follicular ? Sparkles :
               phase === CyclePhase.Ovulation ? Sun : 
               phase === CyclePhase.Luteal ? CloudFog : HelpCircle;

  useEffect(() => {
    const fetchInsight = async () => {
      if (!phase) {
        setInsight("今天也要好好爱自己，等待身体的信号。");
        return;
      }

      setLoading(true);
      
      if (enableAI && process.env.API_KEY) {
        try {
          const text = await getDailyInsight(phase, dayOfCycle || 1, [], []);
          setInsight(text);
        } catch (e) {
           const staticList = STATIC_INSIGHTS[phase];
           const randomStatic = staticList[Math.floor(Math.random() * staticList.length)];
           setInsight(randomStatic);
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 300));
        const staticList = STATIC_INSIGHTS[phase];
        const randomStatic = staticList[Math.floor(Math.random() * staticList.length)];
        setInsight(randomStatic);
      }
      
      setLoading(false);
    };

    fetchInsight();
  }, [phase, dayOfCycle, enableAI]);

  return (
    <div className={`relative overflow-hidden rounded-[2.5rem] p-6 shadow-xl transition-all duration-700 ${info.color} border border-white/60 w-full h-full flex flex-col`}>
      <div className={`absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20`}></div>
      <div className={`absolute bottom-0 left-0 w-60 h-60 bg-gradient-to-tr from-white/40 to-transparent rounded-full blur-3xl pointer-events-none -ml-16 -mb-16`}></div>

      <div className="relative z-10 flex flex-col items-center text-center h-full">
        
        <div className="flex-[0.5] min-h-[10px]" />

        <div className="flex flex-col items-center justify-center flex-shrink-0">
            <div className={`p-4 rounded-full bg-white/60 shadow-sm mb-3 ${info.textColor} ring-4 ring-white/30 transform transition-transform hover:scale-105`}>
              <Icon size={32} strokeWidth={1.5} />
            </div>
            
            <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50 mb-1.5">当前阶段</h2>
            <h1 className={`text-3xl font-bold mb-1 tracking-tight ${info.textColor}`}>{info.name}</h1>
            <p className="text-sm font-medium opacity-60 font-serif">
               {dayOfCycle !== null ? `周期第 ${dayOfCycle} 天` : "尚未开始记录"}
            </p>
        </div>

        <div className="h-6" />

        <div className="w-full flex-shrink-0 relative">
            <div className="bg-white/50 rounded-[2rem] p-5 shadow-sm border border-white/40 backdrop-blur-sm w-full flex flex-col min-h-[120px]">
              <div className="flex justify-center mb-3">
                  <div className="flex items-center gap-1.5 text-gray-500/80">
                    <MessageCircleHeart size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                        {enableAI ? "AI 悄悄话" : "每日悄悄话"}
                    </span>
                  </div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-700 leading-6 text-base font-medium text-center px-1">
                    {loading ? (
                        <span className="animate-pulse opacity-50">正在选取最温暖的话语...</span>
                    ) : (
                        `“${insight}”`
                    )}
                  </p>
              </div>
            </div>
        </div>

        <div className="flex-[1] min-h-[20px]" />

        {phase && (
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide opacity-40 hover:opacity-80 transition-opacity mb-1"
          >
            <Info size={14} />
            {showDetails ? "隐藏详情" : "这是什么阶段？"}
          </button>
        )}
        
        <div className="h-1" />

        {showDetails && phase && (
          <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-8 flex items-center justify-center animate-fadeIn">
            <div className="text-center max-w-xs">
                <h3 className={`text-xl font-bold mb-4 ${info.textColor}`}>{info.name}</h3>
                <p className="text-base text-gray-600 leading-7 mb-8">{info.description}</p>
                <button 
                  onClick={() => setShowDetails(false)}
                  className="px-6 py-3 bg-gray-100 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest hover:bg-gray-200 transition-colors"
                >
                    关闭
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhaseCard;
