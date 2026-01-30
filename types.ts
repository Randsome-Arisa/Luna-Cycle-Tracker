
export enum CyclePhase {
  Menstrual = 'Menstrual',
  Follicular = 'Follicular',
  Ovulation = 'Ovulation',
  Luteal = 'Luteal',
}

export interface CycleData {
  startDate: string; // ISO Date string
  endDate?: string; // ISO Date string
}

export interface DailyLog {
  date: string; // ISO Date string YYYY-MM-DD
  flow?: 'Light' | 'Medium' | 'Heavy';
  mood?: string[];
  symptoms?: string[];
  note?: string;
  loveCount?: number; // Counter for "Miss You" clicks
  intimacy?: boolean; // Track sexual activity
}

export interface PhaseInfo {
  name: string;
  description: string;
  color: string;
  textColor: string;
  icon: string;
  daysRange: string;
}

export type ViewState = 'HOME' | 'CALENDAR' | 'LOG' | 'INSIGHTS';
