import { CyclePhase, PhaseInfo } from './types';
import { Moon, Sparkles, Sun, CloudFog } from 'lucide-react';

export const MOODS = ['开心', '敏感', '精力充沛', '疲惫', '焦虑', '平静', '易怒'];
export const SYMPTOMS = ['痛经', '头痛', '腹胀', '痘痘', '背痛', '嘴馋', '失眠'];

export const PHASE_DETAILS: Record<CyclePhase, PhaseInfo> = {
  [CyclePhase.Menstrual]: {
    name: "月经期",
    description: "周期的冬季。此刻身体需要休息与呵护，像冬眠的小熊一样给自己多一点温暖。",
    color: 'bg-rose-50', // 极淡的粉色
    textColor: 'text-rose-400',
    icon: 'Moon', // 使用月亮代表静谧
    daysRange: '经期记录中'
  },
  [CyclePhase.Follicular]: {
    name: "卵泡期",
    description: "周期的春季。万物复苏，雌激素如春雨般滋润，你的能量正在悄悄发芽。",
    color: 'bg-emerald-50', // 极淡的嫩绿
    textColor: 'text-emerald-500',
    icon: 'Sparkles', // 使用闪光代表活力
    daysRange: '经期结束后 - 第13天'
  },
  [CyclePhase.Ovulation]: {
    name: "排卵期",
    description: "周期的夏季。光芒万丈，魅力值达到顶峰，如同盛夏的阳光般耀眼。",
    color: 'bg-amber-50', // 极淡的暖黄
    textColor: 'text-amber-500',
    icon: 'Sun', // 使用太阳代表热情
    daysRange: '第 14 - 15 天'
  },
  [CyclePhase.Luteal]: {
    name: "黄体期",
    description: "周期的秋季。情绪像秋叶般敏感，身体开始慢下来，准备迎接下一个循环。",
    color: 'bg-slate-50', // 极淡的灰蓝/紫
    textColor: 'text-slate-500',
    icon: 'CloudFog', // 使用云雾代表内省
    daysRange: '第 16 - 28 天'
  }
};

// 免费的本地语录库
export const STATIC_INSIGHTS: Record<CyclePhase, string[]> = {
  [CyclePhase.Menstrual]: [
    "不管是热水袋还是拥抱，今天你值得所有的温暖。",
    "就像月亮需要休息，你也可以心安理得地停下来。",
    "允许自己慢一点，在这个温柔的冬日里。",
    "今天不一定要做很多事，照顾好自己就是最大的成就。",
    "煮一杯红糖姜茶吧，暖暖身体也暖暖心。"
  ],
  [CyclePhase.Follicular]: [
    "感觉到了吗？你的能量正在像春天的嫩芽一样苏醒。",
    "今天你的皮肤状态真不错，是内而外散发的光泽。",
    "适合尝试新鲜事物的一天，世界在等着你探索。",
    "心情轻盈得像微风，去享受这美好的时刻吧。",
    "你的创造力正在回升，有什么新点子想试试吗？"
  ],
  [CyclePhase.Ovulation]: [
    "今天的你光芒万丈，自信是你最好的妆容。",
    "魅力值满分！就像盛夏的阳光一样耀眼。",
    "无论是工作还是社交，今天的你都游刃有余。",
    "听从身体的声音，尽情释放你的热情吧。",
    "你现在处于能量的巅峰，没有什么能难倒你。"
  ],
  [CyclePhase.Luteal]: [
    "如果感到疲惫也没关系，那是身体在提醒你慢下来。",
    "情绪像秋叶一样敏感，记得对自己多一点耐心。",
    "泡个热水澡，读本喜欢的书，享受独处的宁静。",
    "不需要时刻保持完美，现在的你也很可爱。",
    "给情绪一个出口，哪怕只是发发呆也很治愈。"
  ]
};