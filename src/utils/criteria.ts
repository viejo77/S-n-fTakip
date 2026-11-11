import { AssessmentCriterion, Student } from '../types';

export const initialCriteria: AssessmentCriterion[] = [
  {
    id: 'crit-book',
    name: 'Kitap Kontrolü',
    description: 'Ders kitabı, defter ve araç-gereç hazır bulundurma durumu (Her eksik için -10 puan)',
    defaultScore: 100,
    color: '#0284c7', // Sky
    type: 'plus_minus',
    stepPoints: 10,
  },
  {
    id: 'crit-eba',
    name: 'MEBİ / EBA Takibi',
    description: 'MEBİ ve EBA üzerinden verilen içerik, test ve video takibi',
    defaultScore: 100,
    color: '#0d9488', // Teal
    type: 'plus_minus',
    stepPoints: 10,
  },
  {
    id: 'crit-participation',
    name: 'Ders İçi Durumu',
    description: 'Derse aktif katılım, odaklanma, parmak kaldırma ve sınıf kuralları (±1 puan)',
    defaultScore: 100,
    color: '#ea580c', // Orange
    type: 'plus_minus',
    stepPoints: 1,
    isDefault: true,
  },
  {
    id: 'crit-performance',
    name: 'Performans Ödevi',
    description: 'Dönem içi proje, araştırma ve verilen performans görevleri (0-100 doğrudan puan)',
    defaultScore: 100,
    color: '#7c3aed', // Violet
    type: 'score',
    stepPoints: 10,
  },
];

/**
 * Returns student's plus and minus counts for a specific criterion
 */
export const getStudentCriterionCounts = (
  student: Student,
  criterionId: string
): { plus: number; minus: number } => {
  if (student.criteriaCounts && student.criteriaCounts[criterionId]) {
    return {
      plus: Math.max(0, student.criteriaCounts[criterionId].plus || 0),
      minus: Math.max(0, student.criteriaCounts[criterionId].minus || 0),
    };
  }
  return { plus: 0, minus: 0 };
};

/**
 * Calculates percentage / arithmetic mean score from plus and minus counts.
 * E.g. 4 plus, 1 minus -> 4/5 * 100 = 80
 * If 0 plus and 0 minus, returns defaultScore (defaults to 100)
 */
export const calculatePlusMinusAverageScore = (
  plus: number,
  minus: number,
  defaultScore: number = 100
): number => {
  const total = plus + minus;
  if (total === 0) return defaultScore;
  return Math.round((plus / total) * 100);
};

/**
 * Returns student's sub-scores array for a specific multi_score criterion.
 */
export const getStudentCriterionSubScores = (
  student: Student,
  criterionId: string
): number[] => {
  if (student.criteriaSubScores && Array.isArray(student.criteriaSubScores[criterionId])) {
    return student.criteriaSubScores[criterionId].map((val) =>
      typeof val === 'number' && !isNaN(val) ? Math.max(0, Math.min(100, Math.round(val))) : 0
    );
  }
  return [];
};

/**
 * Calculates arithmetic average of multiple scores (0-100).
 * E.g. [80, 90] -> (80 + 90) / 2 = 85.
 * If list is empty, returns defaultScore (defaults to 100).
 */
export const calculateMultiScoreAverage = (
  scores: number[],
  defaultScore: number = 100
): number => {
  const validScores = scores.filter((s) => typeof s === 'number' && !isNaN(s));
  if (validScores.length === 0) return defaultScore;
  const sum = validScores.reduce((acc, curr) => acc + curr, 0);
  return Math.round(sum / validScores.length);
};

/**
 * Returns a student's score for a specific criterion, defaulting to 100 if not yet modified.
 */
export const getStudentCriterionScore = (
  student: Student,
  criterionId: string,
  criterion?: AssessmentCriterion
): number => {
  if (criterion?.type === 'plus_minus_average' && student.criteriaCounts?.[criterionId]) {
    const { plus, minus } = getStudentCriterionCounts(student, criterionId);
    if (plus + minus > 0) {
      return calculatePlusMinusAverageScore(plus, minus, criterion.defaultScore ?? 100);
    }
  }

  if (criterion?.type === 'multi_score') {
    const subScores = getStudentCriterionSubScores(student, criterionId);
    if (subScores.length > 0) {
      return calculateMultiScoreAverage(subScores, criterion.defaultScore ?? 100);
    }
  }

  if (
    student.criteriaScores &&
    typeof student.criteriaScores[criterionId] === 'number'
  ) {
    return student.criteriaScores[criterionId];
  }
  return criterion?.defaultScore ?? 100;
};

/**
 * Calculates the arithmetic mean (equal-weight average) of all active criteria for a student.
 */
export const calculateStudentAverageGrade = (
  criteria: AssessmentCriterion[],
  student: Student
): {
  average: number;
  formatted: string;
  badgeClass: string;
  label: string;
} => {
  if (!criteria || criteria.length === 0) {
    return {
      average: 100,
      formatted: '100',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      label: 'Pekiyi',
    };
  }

  let total = 0;
  for (const crit of criteria) {
    total += getStudentCriterionScore(student, crit.id);
  }

  const average = total / criteria.length;
  const formatted = Number.isInteger(average)
    ? average.toString()
    : average.toFixed(1);

  let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  let label = 'Pekiyi';

  if (average >= 85) {
    badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    label = 'Pekiyi';
  } else if (average >= 70) {
    badgeClass = 'bg-sky-100 text-sky-800 border-sky-200';
    label = 'İyi';
  } else if (average >= 55) {
    badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
    label = 'Orta';
  } else if (average >= 45) {
    badgeClass = 'bg-orange-100 text-orange-800 border-orange-200';
    label = 'Geçer';
  } else {
    badgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
    label = 'Zayıf';
  }

  return { average, formatted, badgeClass, label };
};
