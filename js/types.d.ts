// ===== TYPE DEFINITIONS FOR MOI ET TOI (#20) =====
// Gradual TypeScript adoption — add types as files are converted.

/** Mood entry as stored in Firebase */
interface MoodEntry {
  mood: number;
  energy: number;
  note?: string;
  user: 'her' | 'him';
  userName: string;
  timestamp: number;
  date: string;
  sleep?: number;
  stress?: number;
  tags?: string[];
  dedicatedTo?: 'her' | 'him';
}

/** Tap (quick interaction) entry */
interface TapEntry {
  type: 'hug' | 'kiss' | 'love' | 'miss' | 'thinking';
  from: 'her' | 'him';
  fromName: string;
  timestamp: number;
}

/** Letter entry */
interface LetterEntry {
  from: 'her' | 'him';
  fromName: string;
  message: string;
  timestamp: number;
  read: boolean;
}

/** Workout entry */
interface WorkoutEntry {
  program: string;
  date: string;
  timestamp: number;
  duration: number;
  totalVolume: number;
  exercises: WorkoutExercise[];
  user: 'her' | 'him';
}

interface WorkoutExercise {
  name: string;
  category: string;
  sets: number;
  reps: number;
  weight: number;
  allSets?: WorkoutSet[];
}

interface WorkoutSet {
  weight: number;
  reps: number;
  done: boolean;
}

/** Mood stats computed by metrics engine */
interface MoodStats {
  avg7d: number;
  avg30d: number;
  avg90d: number;
  streak: number;
  total: number;
  trend: 'up' | 'down' | 'stable';
  dayOfWeek: number[];
}

/** Metrics engine global */
interface METData {
  mood: {
    byUser: Record<string, MoodEntry[]>;
    byDate: Record<string, MoodEntry[]>;
    byWeek: Record<string, MoodEntry[]>;
    byMonth: Record<string, MoodEntry[]>;
    all: MoodEntry[];
    stats: Record<string, MoodStats>;
  };
  fitness: { workouts: WorkoutEntry[]; stats: Record<string, unknown> };
  finance: { expenses: unknown[]; stats: Record<string, unknown> };
  relationship: { score: number; breakdown: Record<string, unknown>; history: unknown[] };
  _ready: boolean;
  _listeners: ((type: string) => void)[];
}

/** Calendar event */
interface CalendarEvent {
  title: string;
  date: string;
  time?: string;
  emoji?: string;
  color?: string;
  recurring?: boolean;
  user: 'her' | 'him' | 'both';
}

/** User role */
type UserRole = 'her' | 'him';

// Global variables available across script files
declare let db: any;
declare let user: UserRole;
declare let partner: UserRole;
declare let authUser: any;
declare let NAMES: { her: string; him: string };
declare let NICKNAMES: { herCallsHim: string; himCallsHer: string };
declare const MET: METData;
declare function esc(str: string): string;
declare function toast(msg: string): void;
declare function localDate(): string;
declare function timeAgo(date: Date): string;
declare function go(page: string): void;
declare function openModal(html: string): void;
declare function closeModal(): void;
declare function showEl(el: string | HTMLElement): void;
declare function hideEl(el: string | HTMLElement): void;
