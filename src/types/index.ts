export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

export interface ParticipationItem {
  id: string;
  type: 'star' | 'homework_plus' | 'homework_minus' | 'hand' | 'minus_point' | 'note';
  label: string;
  points: number;
  timestamp: string;
  note?: string;
}

export interface CriterionScoreHistory {
  id: string;
  criterionId: string;
  criterionName: string;
  change: number; // e.g. -10, +5
  newScore: number;
  reason?: string;
  timestamp: string;
}

export type CriterionType = 'score' | 'plus_minus';

export interface AssessmentCriterion {
  id: string;
  name: string; // e.g. "Kitap Kontrolü", "MEBİ / EBA", "Ders İçi Durumu", "Performans Ödevi"
  description?: string;
  defaultScore: number; // Starts at 100
  color?: string;
  type?: CriterionType; // 'score': Doğrudan Puan Bazlı (0-100), 'plus_minus': +/- Adımlı (100'den düşmeli/eklemeli)
  stepPoints?: number; // e.g. 5, 10, 15, 20
  maxScore?: number;
}

export interface Student {
  id: string;
  number: string;
  name: string;
  avatarSeed?: string;
  gender?: 'M' | 'F';
  attendance: AttendanceStatus;
  points: number;
  homeworkCount: number;
  homeworkMissed: number;
  participations: ParticipationItem[];
  notes?: string;
  calledCount?: number;
  calledInCurrentRound?: boolean;
  criteriaScores?: Record<string, number>; // criterionId -> score (0-100, default 100)
  criteriaHistory?: CriterionScoreHistory[];
}

export interface ClassGroup {
  id: string;
  name: string; // e.g. "ATP 9-A"
  grade: string; // e.g. "9"
  section: string; // e.g. "A"
  subject: string; // e.g. "Matematik"
  room?: string; // e.g. "Derslik 204"
  color: string;
  roundNumber?: number;
  students: Student[];
}

export interface ScheduleSlot {
  id: string;
  day: 'Pazartesi' | 'Salı' | 'Çarşamba' | 'Perşembe' | 'Cuma';
  periodNumber: number;
  timeSlot: string; // "08.15 - 08.55"
  classId: string;
  className: string;
  subject: string;
}

export interface SchoolInfo {
  name: string; // "TTSİS MTAL"
  fullName: string; // "TTSİS Mesleki ve Teknik Anadolu Lisesi"
  term: string; // "2. Dönem - 2025/2026"
  academicYear: string;
  teacherName: string;
  teacherTitle: string;
}
