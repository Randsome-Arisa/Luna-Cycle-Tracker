import React, { useState } from 'react';
import { MOODS, SYMPTOMS } from '../constants';
import { DailyLog } from '../types';
import { X, Check, Heart } from 'lucide-react';

interface LogModalProps {
  date: string;
  onSave: (log: DailyLog) => void;
  onClose: () => void;
  existingLog?: DailyLog;
}

const LogModal: React.FC<LogModalProps> = ({ date, onSave, onClose, existingLog }) => {
  const [flow, setFlow] = useState<'Light' | 'Medium' | 'Heavy' | undefined>(existingLog?.flow);
  const [selectedMoods, setSelectedMoods] = useState<string[]>(existingLog?.mood || []);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(existingLog?.symptoms || []);
  const [note, setNote] = useState(existingLog?.note || '');
  const [intimacy, setIntimacy] = useState(existingLog?.intimacy || false);
  const existingLoveCount = existingLog?.loveCount || 0;

  // Helper to safely parse YYYY-MM-DD for display without UTC shift
  const getDisplayDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const localDate = new Date(year, month, day);
    return localDate.toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const toggleSelection = (item: string, list: string[], setList: (l: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSave = () => {
    onSave({
      date,
      flow,
      mood: selectedMoods,
      symptoms: selectedSymptoms,
      note,
      intimacy,
      loveCount: existingLoveCount
    });
    onClose();
  };

  const flowOptions = [
    { label: '少量', value: 'Light' },
    { label: '适中', value: 'Medium' },
    { label: '多量', value: 'Heavy' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white/90 backdrop-blur-xl w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">记录详情</h2>
            <p className="text-sm text-gray-500">{getDisplayDate(date)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto no-scrollbar space-y-8">
          
          {/* Flow Section */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">经期流量</h3>
            <div className="flex gap-3">
              {flowOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFlow(flow === option.value ? undefined : option.value as any)}
                  className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    flow === option.value 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' 
                    : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          {/* Intimacy Section */}
          <section>
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">亲密时刻</h3>
             <button
                onClick={() => setIntimacy(!intimacy)}
                className={`w-full py-3 px-4 rounded-2xl flex items-center gap-3 transition-all ${
                    intimacy
                    ? 'bg-rose-50 border border-rose-100 text-rose-500'
                    : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
                }`}
             >
                <div className={`p-2 rounded-full ${intimacy ? 'bg-rose-500 text-white' : 'bg-gray-100'}`}>
                    <Heart size={18} fill={intimacy ? "currentColor" : "none"} />
                </div>
                <span className="font-semibold">{intimacy ? "今天有爱爱" : "今天没有爱爱"}</span>
             </button>
          </section>

          {/* Mood Section */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">心情</h3>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => toggleSelection(m, selectedMoods, setSelectedMoods)}
                  className={`px-4 py-2 rounded-xl text-sm transition-all ${
                    selectedMoods.includes(m)
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-white border border-gray-100 text-gray-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </section>

          {/* Symptoms Section */}
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">身体感受</h3>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSelection(s, selectedSymptoms, setSelectedSymptoms)}
                  className={`px-4 py-2 rounded-xl text-sm transition-all ${
                    selectedSymptoms.includes(s)
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-white border border-gray-100 text-gray-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

           {/* Note Section */}
           <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">私密笔记</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="此刻感觉如何？"
              className="w-full p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-rose-200 resize-none text-gray-700"
              rows={3}
            />
          </section>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-white/50">
          <button 
            onClick={handleSave}
            className="w-full py-4 rounded-2xl bg-gray-900 text-white font-bold text-lg shadow-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
          >
            <Check size={20} />
            保存记录
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogModal;