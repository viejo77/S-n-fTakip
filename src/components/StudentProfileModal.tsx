import React from 'react';
import {
  X,
  Award,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Sliders,
  History,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { Student, AssessmentCriterion } from '../types';
import {
  getStudentCriterionScore,
  calculateStudentAverageGrade,
  getStudentCriterionCounts,
  getStudentCriterionSubScores,
} from '../utils/criteria';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  classNameTitle: string;
  subjectTitle?: string;
  criteria: AssessmentCriterion[];
  onOpenCriteriaScoring?: (student: Student) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  classNameTitle,
  subjectTitle,
  criteria,
  onOpenCriteriaScoring,
}) => {
  if (!isOpen || !student) return null;

  const { average, formatted, badgeClass, label } = calculateStudentAverageGrade(
    criteria,
    student
  );

  const starCount = student.participations.filter((p) => p.type === 'star').length;
  const homeworkPlusCount = student.participations.filter(
    (p) => p.type === 'homework_plus'
  ).length;
  const homeworkMinusCount = student.participations.filter(
    (p) => p.type === 'homework_minus'
  ).length;
  const handCount = student.participations.filter((p) => p.type === 'hand').length;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2.5 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto overscroll-contain animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto relative animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Sticky Fixed Header - ALWAYS fully visible at the top */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-teal-600 text-white font-mono font-black text-sm sm:text-base flex items-center justify-center shadow-xs shrink-0">
              #{student.number}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="font-extrabold text-slate-900 text-base sm:text-lg truncate">
                  {student.name}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
                    student.attendance === 'present'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : student.attendance === 'late'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {student.attendance === 'present'
                    ? '✓ Derste'
                    : student.attendance === 'late'
                    ? '⏳ Geç Geldi'
                    : '✕ Devamsız'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {classNameTitle} {subjectTitle ? `· ${subjectTitle}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* General Average Score Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 via-sky-50 to-indigo-50 border border-teal-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider block">
                Dönem Not Ortalaması
              </span>
              <span className="text-xs text-slate-500">
                {criteria.length} ölçütün eşit ağırlıklı ortalaması
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                {formatted}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${badgeClass}`}>
                {label}
              </span>
            </div>
          </div>

          {/* Quick Classroom Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-center">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Puan ⭐</span>
              <span className="text-base sm:text-lg font-black font-mono text-amber-900">
                +{student.points}
              </span>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-center">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Ödev +</span>
              <span className="text-base sm:text-lg font-black font-mono text-emerald-900">
                {student.homeworkCount || homeworkPlusCount}
              </span>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/80 text-center">
              <span className="text-[10px] font-bold text-rose-800 uppercase block">Ödev -</span>
              <span className="text-base sm:text-lg font-black font-mono text-rose-900">
                {student.homeworkMissed || homeworkMinusCount}
              </span>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/80 text-center">
              <span className="text-[10px] font-bold text-sky-800 uppercase block">Söz Alma</span>
              <span className="text-base sm:text-lg font-black font-mono text-sky-900">
                {student.calledCount || 0}x
              </span>
            </div>
          </div>

          {/* Criteria Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-teal-600" />
                <span>Ölçüt Bazlı Not Dağılımı</span>
              </span>
              {onOpenCriteriaScoring && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCriteriaScoring(student);
                  }}
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline cursor-pointer"
                >
                  Puanları Düzenle →
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {criteria.map((crit) => {
                const score = getStudentCriterionScore(student, crit.id, crit);
                const counts =
                  crit.type === 'plus_minus_average'
                    ? getStudentCriterionCounts(student, crit.id)
                    : null;
                const subScores =
                  crit.type === 'multi_score'
                    ? getStudentCriterionSubScores(student, crit.id)
                    : null;

                return (
                  <div
                    key={crit.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: crit.color || '#0284c7' }}
                      />
                      <div className="truncate">
                        <span className="font-bold text-slate-800 truncate block">
                          {crit.name}
                        </span>
                        {crit.type === 'plus_minus_average' && counts && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {counts.plus} Artı / {counts.minus} Eksi ({counts.plus + counts.minus} kontrol)
                          </span>
                        )}
                        {crit.type === 'multi_score' && subScores && subScores.length > 0 && (
                          <span className="text-[10px] text-indigo-600 font-mono">
                            Notlar: [{subScores.join(', ')}]
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span
                        className={`font-mono font-black text-sm ${
                          score >= 85
                            ? 'text-emerald-700'
                            : score >= 60
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {score}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold block">/ 100</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Teacher Note */}
          {student.notes && (
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs">
              <span className="font-bold text-amber-900 block mb-0.5">Öğretmen Notu:</span>
              <p className="text-amber-800 italic leading-snug">{student.notes}</p>
            </div>
          )}

          {/* Recent History / Log */}
          {student.participations.length > 0 && (
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <History className="w-3 h-3" />
                <span>Son Ders İçi Hareketleri</span>
              </span>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {student.participations.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-600"
                  >
                    <span className="font-semibold truncate">{p.label}</span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                      {p.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Fixed Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/70 shrink-0 flex items-center justify-end gap-2">
          {onOpenCriteriaScoring && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCriteriaScoring(student);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Notları Düzenle
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
