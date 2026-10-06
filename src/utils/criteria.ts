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
 * Returns a student's score for a specific criterion, defaulting to 100 if not yet modified.
 */
export const getStudentCriterionScore = (
  student: Student,
  criterionId: string
): number => {
  if (
    student.criteriaScores &&
    typeof student.criteriaScores[criterionId] === 'number'
  ) {
    return student.criteriaScores[criterionId];
  }
  return 100;
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
