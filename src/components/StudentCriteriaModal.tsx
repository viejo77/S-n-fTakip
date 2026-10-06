import React, { useState } from 'react';
import {
  X,
  Sliders,
  Check,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  History,
  BookOpen,
} from 'lucide-react';
import { AssessmentCriterion, Student, CriterionScoreHistory } from '../types';
import {
  getStudentCriterionScore,
  calculateStudentAverageGrade,
} from '../utils/criteria';

interface StudentCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  criteria: AssessmentCriterion[];
  onUpdateScores: (
    studentId: string,
    newScores: Record<string, number>,
    newHistoryItem?: CriterionScoreHistory
  ) => void;
}

export const StudentCriteriaModal: React.FC<StudentCriteriaModalProps> = ({
  isOpen,
  onClose,
  student,
  criteria,
  onUpdateScores,
}) => {
  if (!isOpen || !student) return null;

  // Local state for draft scores
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const c of criteria) {
      initial[c.id] = getStudentCriterionScore(student, c.id);
    }
    return initial;
  });

  const [reasonInputs, setReasonInputs] = useState<Record<string, string>>({});

  // Compute live preview average
  const tempStudent: Student = {
    ...student,
    criteriaScores: scores,
  };
  const { average, formatted, badgeClass, label } = calculateStudentAverageGrade(
    criteria,
    tempStudent
  );

  const handleAdjustScore = (
    criterionId: string,
    delta: number,
    criterionName: string
  ) => {
    const current = scores[criterionId] ?? 100;
    const nextScore = Math.max(0, Math.min(100, current + delta));
    const newScores = {
      ...scores,
      [criterionId]: nextScore,
    };
    setScores(newScores);

    const reason = reasonInputs[criterionId]?.trim() || (delta < 0 ? `${delta} Puan Kesildi` : `+${delta} Puan Eklendi`);

    const historyItem: CriterionScoreHistory = {
      id: 'h-' + Date.now(),
      criterionId,
      criterionName,
      change: delta,
      newScore: nextScore,
      reason,
      timestamp: new Date().toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    onUpdateScores(student.id, newScores, historyItem);
    setReasonInputs((prev) => ({ ...prev, [criterionId]: '' }));
  };

  const handleSetExactScore = (
    criterionId: string,
    value: number,
    criterionName: string
  ) => {
    const nextScore = Math.max(0, Math.min(100, value));
    const current = scores[criterionId] ?? 100;
    const delta = nextScore - current;
    const newScores = {
      ...scores,
      [criterionId]: nextScore,
    };
    setScores(newScores);

    if (delta !== 0) {
      const historyItem: CriterionScoreHistory = {
        id: 'h-' + Date.now(),
        criterionId,
        criterionName,
        change: delta,
        newScore: nextScore,
        reason: 'Puan doğrudan güncellendi',
        timestamp: new Date().toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      onUpdateScores(student.id, newScores, historyItem);
    }
  };

  const handleResetCriterion = (criterionId: string, criterionName: string) => {
    handleSetExactScore(criterionId, 100, criterionName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-8 animate-in zoom-in-95 duration-150 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded-lg shrink-0"
                title={`Okul Numarası: ${student.number}`}
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase">No</span>
                <span className="font-mono font-bold text-xs text-slate-800">{student.number}</span>
              </div>
              <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
                {student.name}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ölçüt Bazlı Notlandırma (100 Tam Puan Üzerinden Eşit Ağırlık)
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Average Note Banner */}
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-teal-50 via-sky-50 to-indigo-50 border border-teal-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
              Genel Not Ortalaması
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              {criteria.length} ölçütün eşit ağırlıklı aritmetik ortalaması
            </p>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {formatted}
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md border ${badgeClass}`}
            >
              {label}
            </span>
          </div>
        </div>

        {/* Criteria List */}
        <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
          {criteria.map((crit) => {
            const currentScore = scores[crit.id] ?? 100;
            const scorePercent = currentScore;

            return (
              <div
                key={crit.id}
                className="p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2.5"
              >
                {/* Title & Score Indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: crit.color || '#0284c7' }}
                    />
                    <span className="font-bold text-sm text-slate-800">
                      {crit.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={currentScore}
                      onChange={(e) =>
                        handleSetExactScore(
                          crit.id,
                          parseInt(e.target.value, 10) || 0,
                          crit.name
                        )
                      }
                      className="w-14 text-center font-mono font-extrabold text-sm py-1 px-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500"
                    />
                    <span className="text-xs font-bold text-slate-400">/ 100</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      currentScore >= 85
                        ? 'bg-emerald-500'
                        : currentScore >= 70
                        ? 'bg-sky-500'
                        : currentScore >= 50
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${scorePercent}%` }}
                  />
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center justify-between gap-1 flex-wrap pt-0.5">
                  {crit.type === 'score' ? (
                    /* Puan Bazlı: Hızlı Not Seçenekleri & Küçük Ayar */
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-bold mr-0.5">Hızlı Not:</span>
                      {[100, 90, 85, 75, 50, 0].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleSetExactScore(crit.id, val, crit.name)}
                          className={`px-2 py-0.5 text-xs font-mono font-bold rounded-md border transition-all cursor-pointer ${
                            currentScore === val
                              ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          type="button"
                          onClick={() => handleAdjustScore(crit.id, -1, crit.name)}
                          className="px-1.5 py-0.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100 cursor-pointer"
                          title="1 puan düşür"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustScore(crit.id, +1, crit.name)}
                          className="px-1.5 py-0.5 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 rounded hover:bg-teal-100 cursor-pointer"
                          title="1 puan ekle"
                        >
                          +1
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* +/- Adımlı: Belirlenen Adım Puanı ile Hızlı Artırma / Azaltma */
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleAdjustScore(
                            crit.id,
                            -(crit.stepPoints || 10),
                            crit.name
                          )
                        }
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200/70 transition-transform active:scale-95 cursor-pointer font-mono"
                        title={`${crit.stepPoints || 10} Puan Düşür`}
                      >
                        -{crit.stepPoints || 10}
                      </button>
                      {(crit.stepPoints || 10) !== 1 && (
                        <button
                          type="button"
                          onClick={() => handleAdjustScore(crit.id, -1, crit.name)}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg border border-amber-200/70 transition-transform active:scale-95 cursor-pointer font-mono"
                          title="1 Puan Düşür"
                        >
                          -1
                        </button>
                      )}
                      {(crit.stepPoints || 10) !== 1 && (
                        <button
                          type="button"
                          onClick={() => handleAdjustScore(crit.id, +1, crit.name)}
                          className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-lg border border-teal-200/70 transition-transform active:scale-95 cursor-pointer font-mono"
                          title="1 Puan Ekle"
                        >
                          +1
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          handleAdjustScore(
                            crit.id,
                            +(crit.stepPoints || 10),
                            crit.name
                          )
                        }
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200/70 transition-transform active:scale-95 cursor-pointer font-mono"
                        title={`${crit.stepPoints || 10} Puan Ekle`}
                      >
                        +{crit.stepPoints || 10}
                      </button>
                    </div>
                  )}

                  {currentScore !== 100 && (
                    <button
                      type="button"
                      onClick={() => handleResetCriterion(crit.id, crit.name)}
                      className="text-[11px] font-semibold text-slate-400 hover:text-teal-700 flex items-center gap-1 hover:underline cursor-pointer shrink-0 ml-auto"
                      title="Bu ölçütü 100 tam puana sıfırla"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>100 Yap</span>
                    </button>
                  )}
                </div>

                {/* Optional Reason Input */}
                <input
                  type="text"
                  placeholder="Gerekçe (ör: Kitap getirmedi, EBA ödevi tamamlandı...)"
                  value={reasonInputs[crit.id] || ''}
                  onChange={(e) =>
                    setReasonInputs((prev) => ({
                      ...prev,
                      [crit.id]: e.target.value,
                    }))
                  }
                  className="w-full px-2.5 py-1 text-xs bg-slate-50 text-slate-700 rounded-lg border border-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white"
                />
              </div>
            );
          })}
        </div>

        {/* History Preview */}
        {student.criteriaHistory && student.criteriaHistory.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1 mb-1.5">
              <History className="w-3 h-3" />
              <span>Son Not Değişiklikleri</span>
            </span>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {student.criteriaHistory.slice(0, 4).map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className={`font-mono font-bold text-[11px] ${
                        h.change > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {h.change > 0 ? `+${h.change}` : h.change}
                    </span>
                    <span className="font-semibold text-slate-700 truncate">
                      {h.criterionName}
                    </span>
                    {h.reason && (
                      <span className="text-slate-400 italic truncate">
                        ({h.reason})
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {h.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Tamamla & Kaydet</span>
          </button>
        </div>
      </div>
    </div>
  );
};
