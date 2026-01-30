import React, { useState, useEffect } from 'react';
import { PHASE_DETAILS, STATIC_INSIGHTS } from '../constants';
import { CyclePhase } from '../types';
import { Moon, Sparkles, Sun, CloudFog, MessageCircleHeart, Info } from 'lucide-react';
import { getDailyInsight } from '../services/geminiService';

interface PhaseCardProps {
  phase: CyclePhase;
  dayOfCycle: number;
  enableAI: boolean;
  userName?: string;
}

const PhaseCard: React.FC<PhaseCardProps> = ({ phase, dayOfCycle, enableAI, userName = "亲爱的" }) => {
  const info = PHASE_DETAILS[phase];
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Icon mapping
  const Icon = phase === CyclePhase.Menstrual ? Moon :
               phase === CyclePhase.Follicular ? Sparkles :
               phase === CyclePhase.Ovulation ? Sun : CloudFog;

  useEffect(() => {
    const fetchInsight = async () => {
      setLoading(true);
      
      if (enableAI && process.env.API_KEY) {
        // use AI
        try {
          const text = await getDailyInsight(phase, dayOfCycle, [], []);
          setInsight(text);
        } catch (e) {
           // Fallback if AI fails
           const staticList = STATIC_INSIGHTS[phase];
           const randomStatic = staticList[Math.floor(Math.random() * staticList.length)];
           setInsight(randomStatic);
        }
      } else {
        // use Static (Free mode)
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
      {/* Soft Decorative Gradients */}
      <div className={`absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20`}></div>
      <div className={`absolute bottom-0 left-0 w-60 h-60 bg-gradient-to-tr from-white/40 to-transparent rounded-full blur-3xl pointer-events-none -ml-16 -mb-16`}></div>

      <div className="relative z-10 flex flex-col items-center text-center h-full">
        
        {/* Top Spacer - Pushes content to visual center */}
        <div className="flex-[0.5] min-h-[10px]" />

        {/* Top Section: Icon & Main Info */}
        <div className="flex flex-col items-center justify-center flex-shrink-0">
            {/* Animated Icon Container */}
            <div className={`p-4 rounded-full bg-white/60 shadow-sm mb-3 ${info.textColor} ring-4 ring-white/30 transform transition-transform hover:scale-105`}>
              <Icon size={32} strokeWidth={1.5} />
            </div>
            
            <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50 mb-1.5">当前阶段</h2>
            <h1 className={`text-3xl font-bold mb-1 tracking-tight ${info.textColor}`}>{info.name}</h1>
            <p className="text-sm font-medium opacity-60 font-serif">周期第 {dayOfCycle} 天</p>
        </div>

        {/* Gap */}
        <div className="h-6" />

        {/* Middle Section: Insight */}
        {/* Removed flex-1 to prevent it from forcing expansion. Fixed min-height for consistency but allow growth if needed. */}
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

        {/* Bottom Spacer - Larger to lift content up */}
        <div className="flex-[1] min-h-[20px]" />

        {/* Bottom Section: Details Button */}
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide opacity-40 hover:opacity-80 transition-opacity mb-1"
        >
          <Info size={14} />
          {showDetails ? "隐藏详情" : "这是什么阶段？"}
        </button>
        
        {/* Extra buffer for visual balance */}
        <div className="h-1" />

        {showDetails && (
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