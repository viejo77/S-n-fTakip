import React, { useState, useEffect, useRef } from 'react';
import {
  Shuffle,
  Star,
  CheckCircle2,
  X,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Sliders,
  Check,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Award,
  ChevronRight,
  Plus,
  Minus,
} from 'lucide-react';
import { Student, AssessmentCriterion, CriterionScoreHistory } from '../types';
import { speakTurkish, stopSpeech } from '../utils/speech';
import {
  getStudentCriterionScore,
  calculateStudentAverageGrade,
  getStudentCriterionCounts,
  getStudentCriterionSubScores,
} from '../utils/criteria';

interface RandomStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  currentRound?: number;
  criterionRounds?: Record<string, number>;
  initialCriterionId?: string | null;
  criteria?: AssessmentCriterion[];
  onAwardStudent: (student: Student, type: 'star' | 'homework_plus') => void;
  onUpdateScores?: (
    studentId: string,
    newScores: Record<string, number>,
    newHistoryItem?: CriterionScoreHistory
  ) => void;
  onAdjustStudentCounts?: (
    studentId: string,
    criterionId: string,
    deltaPlus: number,
    deltaMinus: number,
    reason?: string
  ) => void;
  onSetStudentCounts?: (
    studentId: string,
    criterionId: string,
    exactPlus: number,
    exactMinus: number,
    reason?: string
  ) => void;
  onUpdateStudentSubScore?: (
    studentId: string,
    criterionId: string,
    scoreIndex: number,
    value: number
  ) => void;
  onOpenCriteriaModal?: (student: Student) => void;
  onSetDefaultCriterion?: (criterionId: string) => void;
  onMarkStudentCalled: (studentId: string, criterionId?: string) => void;
  onResetRound: (criterionId?: string) => void;
}

export const RandomStudentModal: React.FC<RandomStudentModalProps> = ({
  isOpen,
  onClose,
  students,
  currentRound = 1,
  criterionRounds = {},
  initialCriterionId = null,
  criteria = [],
  onAwardStudent,
  onUpdateScores,
  onAdjustStudentCounts,
  onSetStudentCounts,
  onUpdateStudentSubScore,
  onOpenCriteriaModal,
  onSetDefaultCriterion,
  onMarkStudentCalled,
  onResetRound,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [displayCandidateName, setDisplayCandidateName] = useState('');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [roundCompletedCelebration, setRoundCompletedCelebration] = useState(false);
  const [showStatusList, setShowStatusList] = useState(false);

  // Helper to determine the default criterion ID
  const getDefaultCriterionId = () => {
    if (initialCriterionId) return initialCriterionId;
    const def = criteria.find((c) => c.isDefault) || criteria[0];
    return def ? def.id : '';
  };

  // Active Criterion for grading and independent pool tracking
  const [activeCriterionId, setActiveCriterionId] = useState<string>(getDefaultCriterionId);
  const [customReason, setCustomReason] = useState<string>('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Find live selected student from `students` array to guarantee reactivity
  const liveStudent = selectedStudentId
    ? students.find((s) => s.id === selectedStudentId) || null
    : null;

  // Active criterion object
  const activeCriterion =
    criteria.find((c) => c.id === activeCriterionId) ||
    criteria.find((c) => c.isDefault) ||
    criteria[0] ||
    null;

  // Active criterion round number
  const activeCritRound =
    (activeCriterion && criterionRounds[activeCriterion.id]) || currentRound || 1;

  // Eligible present/late students
  const eligibleStudents = students.filter(
    (s) => s.attendance === 'present' || s.attendance === 'late'
  );

  // Helper: has student been called in the active criterion?
  const isStudentCalledInActiveCriterion = (s: Student): boolean => {
    if (activeCriterion) {
      return Boolean(s.criterionCalled?.[activeCriterion.id]);
    }
    return Boolean(s.calledInCurrentRound);
  };

  // Students who have NOT been called yet in this active criterion for its current round
  const uncalledStudents = eligibleStudents.filter(
    (s) => !isStudentCalledInActiveCriterion(s)
  );
  const calledStudents = eligibleStudents.filter((s) =>
    isStudentCalledInActiveCriterion(s)
  );

  // Sync active criterion when modal opens or initialCriterionId changes
  useEffect(() => {
    if (isOpen) {
      if (initialCriterionId) {
        setActiveCriterionId(initialCriterionId);
      } else if (criteria.length > 0) {
        const def = criteria.find((c) => c.isDefault) || criteria[0];
        if (def && !activeCriterionId) {
          setActiveCriterionId(def.id);
        }
      }
    }
  }, [isOpen, initialCriterionId]);

  // Read student name aloud
  const announceStudent = (student: Student) => {
    if (!isAudioEnabled) return;
    setIsSpeaking(true);
    speakTurkish(student.name, () => {
      setIsSpeaking(false);
    });
  };

  const startShuffle = () => {
    setFeedbackToast(null);
    setCustomReason('');

    // If all eligible students were already called for this criterion, auto-reset its round!
    if (uncalledStudents.length === 0) {
      if (eligibleStudents.length === 0) return;
      onResetRound(activeCriterion?.id);
    }

    const pool = uncalledStudents.length > 0 ? uncalledStudents : eligibleStudents;
    if (pool.length === 0) return;

    setIsShuffling(true);
    setSelectedStudentId(null);
    setRoundCompletedCelebration(false);
    stopSpeech();

    let count = 0;
    const interval = setInterval(() => {
      const randIndex = Math.floor(Math.random() * pool.length);
      const candidate = pool[randIndex];
      setDisplayCandidateName(`#${candidate.number} ${candidate.name}`);
      count++;

      if (count > 16) {
        clearInterval(interval);
        const finalStudent = pool[Math.floor(Math.random() * pool.length)];
        setSelectedStudentId(finalStudent.id);
        setIsShuffling(false);

        // Keep the teacher's selected criterion active (do NOT reset activeCriterionId)

        // Mark student as called in this specific criterion (and general round)
        onMarkStudentCalled(finalStudent.id, activeCriterion?.id);

        // Check if this was the last remaining uncalled student in this criterion
        if (pool.length === 1) {
          setRoundCompletedCelebration(true);
        }

        // Voice announce
        announceStudent(finalStudent);
      }
    }, 85);
  };

  useEffect(() => {
    if (isOpen) {
      startShuffle();
    } else {
      stopSpeech();
      setIsShuffling(false);
      setSelectedStudentId(null);
      setFeedbackToast(null);
    }
    return () => {
      stopSpeech();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const totalEligible = eligibleStudents.length;
  const calledCountInRound = calledStudents.length;
  const remainingInRound = uncalledStudents.length;

  // Grade adjustment handler for the selected student & active criterion
  const handleAdjustCriterionScore = (delta: number, overrideReason?: string) => {
    if (!liveStudent || !activeCriterion || !onUpdateScores) return;

    const currentScore = getStudentCriterionScore(liveStudent, activeCriterion.id);
    const nextScore = Math.max(0, Math.min(100, currentScore + delta));

    const newScores = {
      ...(liveStudent.criteriaScores || {}),
      [activeCriterion.id]: nextScore,
    };

    const reason =
      overrideReason ||
      customReason.trim() ||
      (delta >= 0 ? `+${delta} Puan Eklendi` : `${delta} Puan Kesildi`);

    const historyItem: CriterionScoreHistory = {
      id: 'h-' + Date.now(),
      criterionId: activeCriterion.id,
      criterionName: activeCriterion.name,
      change: delta,
      newScore: nextScore,
      reason,
      timestamp: new Date().toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    onUpdateScores(liveStudent.id, newScores, historyItem);

    setFeedbackToast(`✓ ${activeCriterion.name}: ${nextScore} puan kaydedildi!`);
    setCustomReason('');
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handleSetExactCriterionScore = (value: number, overrideReason?: string) => {
    if (!liveStudent || !activeCriterion || !onUpdateScores) return;

    const currentScore = getStudentCriterionScore(liveStudent, activeCriterion.id);
    const nextScore = Math.max(0, Math.min(100, value));
    const delta = nextScore - currentScore;

    const newScores = {
      ...(liveStudent.criteriaScores || {}),
      [activeCriterion.id]: nextScore,
    };

    const reason = overrideReason || customReason.trim() || `Not Doğrudan ${nextScore} Olarak Ayarlandı`;

    const historyItem: CriterionScoreHistory = {
      id: 'h-' + Date.now(),
      criterionId: activeCriterion.id,
      criterionName: activeCriterion.name,
      change: delta,
      newScore: nextScore,
      reason,
      timestamp: new Date().toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    onUpdateScores(liveStudent.id, newScores, historyItem);

    setFeedbackToast(`✓ ${activeCriterion.name}: ${nextScore} puan kaydedildi!`);
    setCustomReason('');
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const studentGrade = liveStudent
    ? calculateStudentAverageGrade(criteria, liveStudent)
    : null;

  const currentCriterionScore = liveStudent && activeCriterion
    ? getStudentCriterionScore(liveStudent, activeCriterion.id)
    : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-100 text-center relative overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Top Header Bar */}
        <div className="p-3.5 sm:p-4 pb-2 sm:pb-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextState = !isAudioEnabled;
              setIsAudioEnabled(nextState);
              if (!nextState) stopSpeech();
              else if (liveStudent) announceStudent(liveStudent);
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isAudioEnabled
                ? 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                : 'bg-slate-200/70 text-slate-500 hover:bg-slate-300'
            }`}
            title={isAudioEnabled ? 'Sesli Okuma Açık' : 'Sesli Okuma Kapalı'}
          >
            {isAudioEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span>{isAudioEnabled ? 'Ses Açık' : 'Sessiz'}</span>
          </button>

          {/* Per-Criterion Round Badge */}
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100/90 text-amber-950 text-xs font-bold border border-amber-200/60">
            <Shuffle className="w-3 h-3 text-amber-700 shrink-0" />
            <span className="truncate max-w-[170px]" title={`${activeCriterion ? activeCriterion.name : 'Genel'}: ${activeCritRound}. Tur`}>
              {activeCriterion ? `${activeCriterion.name}: ` : ''}{activeCritRound}. Tur ({calledCountInRound}/{totalEligible})
            </span>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              stopSpeech();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {/* Slot Machine / Shuffle View */}
          <div className="p-3 bg-gradient-to-b from-slate-50 to-teal-50/40 rounded-2xl border border-teal-100 relative">
            {isShuffling ? (
              <div className="py-3.5 space-y-2">
                <span className="text-xs text-teal-700 font-semibold animate-pulse block">
                  {activeCriterion ? `"${activeCriterion.name}" için kalan öğrenciler taranıyor...` : 'Öğrenciler taranıyor...'}
                </span>
                <p className="font-extrabold text-xl sm:text-2xl text-slate-800 font-mono tracking-tight animate-bounce">
                  {displayCandidateName}
                </p>
              </div>
            ) : liveStudent ? (
              <div className="space-y-1.5 animate-in zoom-in-95">
                {/* Okul No & Voice Pulse */}
                <div className="flex items-center justify-center gap-2">
                  <div className="relative inline-block">
                    <span className="font-mono font-black text-sm bg-teal-600 text-white px-2.5 py-0.5 rounded-lg shadow-2xs">
                      #{liveStudent.number}
                    </span>
                    {isSpeaking && (
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500" />
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">
                    {liveStudent.name}
                  </h3>

                  <button
                    type="button"
                    onClick={() => announceStudent(liveStudent)}
                    className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 hover:bg-teal-200 flex items-center justify-center transition-colors cursor-pointer"
                    title="İsmi tekrar oku"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Student Mini Stats Row */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] pt-0.5">
                  {studentGrade && (
                    <span className={`px-2 py-0.5 rounded-full font-bold border ${studentGrade.badgeClass}`}>
                      Ortalama: {studentGrade.formatted} ({studentGrade.label})
                    </span>
                  )}
                  <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                    +{liveStudent.points} ⭐
                  </span>
                  {activeCriterion && (
                    <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full font-semibold">
                      {activeCriterion.name}: {liveStudent.criterionCalledCount?.[activeCriterion.id] || 1}. kez seçildi
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-3">
                <p className="text-xs font-semibold text-slate-600">
                  {activeCriterion
                    ? `"${activeCriterion.name}" ölçütünde sınıftaki herkes değerlendirildi.`
                    : 'Seçilecek uygun öğrenci kalmadı.'}
                </p>
                <button
                  type="button"
                  onClick={() => onResetRound(activeCriterion?.id)}
                  className="mt-2 text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  {activeCriterion ? `"${activeCriterion.name}" Yeni Turunu Başlat` : 'Yeni Turu Hemen Başlat'}
                </button>
              </div>
            )}
          </div>

          {/* Round Complete Banner */}
          {roundCompletedCelebration && !isShuffling && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-left text-[11px] leading-tight">
                Tebrikler! <strong>{activeCriterion ? activeCriterion.name : 'Bu'}</strong> ölçütünde sınıftaki tüm öğrenciler değerlendirildi ({activeCritRound}. Tur tamamlandı). Sıradaki seçimde otomatik yeni tur başlayacak.
              </span>
            </div>
          )}

          {/* Feedback Toast Banner */}
          {feedbackToast && (
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md animate-in fade-in duration-150">
              <Check className="w-4 h-4 text-emerald-200" />
              <span>{feedbackToast}</span>
            </div>
          )}

          {/* CORE FEATURE: ALL CRITERIA VISIBLE & INDEPENDENT PROGRESS TRACKING */}
          {liveStudent && !isShuffling && criteria.length > 0 && (
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 space-y-2.5 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Ölçüt Değerlendirmesi
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                  Tüm Ölçütler ({criteria.length})
                </span>
              </div>

              {/* 1. All Criteria Cards Grid - shows per-criterion called/evaluated progress! */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                {criteria.map((c) => {
                  const isSelected = activeCriterion?.id === c.id;
                  const critScore = getStudentCriterionScore(liveStudent, c.id);
                  const color = c.color || '#0d9488';
                  const isDef = !!c.isDefault;
                  const critCalledCount = eligibleStudents.filter((s) => s.criterionCalled?.[c.id]).length;
                  const critRound = criterionRounds[c.id] || 1;

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveCriterionId(c.id)}
                      style={{
                        borderColor: isSelected ? color : undefined,
                        backgroundColor: isSelected ? `${color}15` : undefined,
                      }}
                      className={`p-2 rounded-xl text-left transition-all border flex flex-col justify-between cursor-pointer relative ${
                        isSelected
                          ? 'text-slate-900 shadow-xs ring-2'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 w-full">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-bold text-xs truncate leading-snug">
                            {c.name}
                          </span>
                        </div>
                        {isDef && (
                          <span
                            className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 shrink-0 flex items-center gap-0.5"
                            title="Bu ölçüt varsayılan olarak seçilidir"
                          >
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                            <span>Varsayılan</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100 w-full text-[10px]">
                        <span className="text-slate-500 font-semibold truncate" title={`${c.name} tur ilerlemesi`}>
                          {critRound}. Tur ({critCalledCount}/{totalEligible})
                        </span>
                        <span
                          className={`font-mono font-black text-xs px-1.5 py-0.2 rounded ${
                            critScore >= 85
                              ? 'bg-emerald-100 text-emerald-800'
                              : critScore >= 60
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {critScore}/100
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 2. Active Selected Criterion Panel */}
              {activeCriterion && (
                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: activeCriterion.color || '#0d9488' }}
                        />
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {activeCriterion.name}
                        </h4>

                        {/* Set as Default Button / Badge */}
                        {onSetDefaultCriterion && (
                          activeCriterion.isDefault ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                              <span>Varsayılan Ölçüt</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onSetDefaultCriterion(activeCriterion.id)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-800 border border-slate-200 hover:border-amber-300 transition-colors cursor-pointer"
                              title="Rastgele öğrenci seçildiğinde ilk bu ölçüt açılsın"
                            >
                              <Star className="w-2.5 h-2.5 text-slate-400" />
                              <span>Varsayılan Yap</span>
                            </button>
                          )
                        )}
                      </div>

                      {activeCriterion.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {activeCriterion.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">
                        {activeCriterion.type === 'plus_minus_average' ? 'Ortalama Not' : 'Mevcut Not'}
                      </span>
                      <span
                        className={`font-mono text-lg font-black leading-tight ${
                          currentCriterionScore >= 85
                            ? 'text-emerald-700'
                            : currentCriterionScore >= 60
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {activeCriterion.type === 'plus_minus_average' ? `%${currentCriterionScore}` : currentCriterionScore}
                        <span className="text-xs font-normal text-slate-400">/100</span>
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Controls based on Criterion Type */}
                  {activeCriterion.type === 'plus_minus_average' ? (
                    (() => {
                      const counts = liveStudent
                        ? getStudentCriterionCounts(liveStudent, activeCriterion.id)
                        : { plus: 0, minus: 0 };
                      const totalCounts = counts.plus + counts.minus;
                      const currentRatio =
                        totalCounts > 0 ? Math.round((counts.plus / totalCounts) * 100) : 100;

                      return (
                        <div className="space-y-2 pt-0.5">
                          {/* Big Plus / Minus Buttons */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (liveStudent && onAdjustStudentCounts) {
                                  onAdjustStudentCounts(
                                    liveStudent.id,
                                    activeCriterion.id,
                                    1,
                                    0,
                                    'Ödev/Kontrol Başarılı (+1 Artı)'
                                  );
                                  setFeedbackToast(
                                    `✓ +1 Artı eklendi! (Not: %${Math.round(
                                      ((counts.plus + 1) / (totalCounts + 1)) * 100
                                    )})`
                                  );
                                  setTimeout(() => setFeedbackToast(null), 2500);
                                }
                              }}
                              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span>+1 Artı Ver</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (liveStudent && onAdjustStudentCounts) {
                                  onAdjustStudentCounts(
                                    liveStudent.id,
                                    activeCriterion.id,
                                    0,
                                    1,
                                    'Ödev/Kontrol Eksik (+1 Eksi)'
                                  );
                                  setFeedbackToast(
                                    `✕ +1 Eksi eklendi! (Not: %${Math.round(
                                      (counts.plus / (totalCounts + 1)) * 100
                                    )})`
                                  );
                                  setTimeout(() => setFeedbackToast(null), 2500);
                                }
                              }}
                              className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                            >
                              <Minus className="w-4 h-4" />
                              <span>+1 Eksi Ver</span>
                            </button>
                          </div>

                          {/* Current Counts Bar & Steppers */}
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/90 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 bg-white border border-emerald-300 rounded-lg px-2 py-0.5 shadow-2xs">
                                <span className="text-[10px] font-extrabold text-emerald-800">Artı:</span>
                                <span className="font-mono font-black text-xs text-emerald-950">
                                  {counts.plus}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onAdjustStudentCounts?.(
                                      liveStudent!.id,
                                      activeCriterion.id,
                                      -1,
                                      0,
                                      'Artı 1 azaltıldı'
                                    )
                                  }
                                  disabled={counts.plus <= 0}
                                  className="w-4 h-4 rounded text-slate-400 hover:text-emerald-700 disabled:opacity-30 cursor-pointer text-[10px] font-bold"
                                  title="1 Artı Azalt"
                                >
                                  -
                                </button>
                              </div>

                              <div className="flex items-center gap-1 bg-white border border-rose-300 rounded-lg px-2 py-0.5 shadow-2xs">
                                <span className="text-[10px] font-extrabold text-rose-800">Eksi:</span>
                                <span className="font-mono font-black text-xs text-rose-950">
                                  {counts.minus}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onAdjustStudentCounts?.(
                                      liveStudent!.id,
                                      activeCriterion.id,
                                      0,
                                      -1,
                                      'Eksi 1 azaltıldı'
                                    )
                                  }
                                  disabled={counts.minus <= 0}
                                  className="w-4 h-4 rounded text-slate-400 hover:text-rose-700 disabled:opacity-30 cursor-pointer text-[10px] font-bold"
                                  title="1 Eksi Azalt"
                                >
                                  -
                                </button>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] font-semibold text-slate-500 block leading-tight">
                                Ortalama ({counts.plus}/{totalCounts > 0 ? totalCounts : 0}):
                              </span>
                              <span className="font-mono font-black text-sm text-teal-800">
                                %{currentRatio}
                              </span>
                            </div>
                          </div>

                          {/* Preset Reasons Chips */}
                          <div className="pt-1 border-t border-slate-100 flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onAdjustStudentCounts?.(
                                  liveStudent!.id,
                                  activeCriterion.id,
                                  1,
                                  0,
                                  'Ödev Tam ve Eksiksiz (+1 Artı)'
                                );
                                setFeedbackToast('✓ +1 Artı Eklendi!');
                                setTimeout(() => setFeedbackToast(null), 2500);
                              }}
                              className="px-2 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-semibold transition-colors cursor-pointer"
                            >
                              ✓ Eksiksiz (+1 Artı)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onAdjustStudentCounts?.(
                                  liveStudent!.id,
                                  activeCriterion.id,
                                  0,
                                  1,
                                  'Ödev Eksik / Yapılmamış (+1 Eksi)'
                                );
                                setFeedbackToast('✕ +1 Eksi Eklendi!');
                                setTimeout(() => setFeedbackToast(null), 2500);
                              }}
                              className="px-2 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-800 text-[10px] font-semibold transition-colors cursor-pointer"
                            >
                              ✕ Eksik (+1 Eksi)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onSetStudentCounts?.(
                                  liveStudent!.id,
                                  activeCriterion.id,
                                  0,
                                  0,
                                  'Artı ve Eksi Sıfırlandı'
                                );
                                setFeedbackToast('Tüm Artı/Eksiler Sıfırlandı');
                                setTimeout(() => setFeedbackToast(null), 2500);
                              }}
                              className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold transition-colors cursor-pointer ml-auto"
                            >
                              Sıfırla
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : activeCriterion.type === 'multi_score' ? (
                    (() => {
                      const subScoresCount = activeCriterion.subScoresCount || 2;
                      const subScores = liveStudent
                        ? getStudentCriterionSubScores(liveStudent, activeCriterion.id)
                        : [];
                      const calculatedAvg = liveStudent
                        ? getStudentCriterionScore(liveStudent, activeCriterion.id, activeCriterion)
                        : 100;

                      return (
                        <div className="space-y-2.5 pt-0.5">
                          <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-indigo-900">
                                Çoklu Not Girişi ({subScoresCount} Not):
                              </span>
                              <span className="text-xs font-mono font-black text-indigo-900 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                                Ort: {calculatedAvg} / 100
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {Array.from({ length: subScoresCount }).map((_, idx) => {
                                const val = subScores[idx] !== undefined ? subScores[idx] : 100;
                                return (
                                  <div
                                    key={idx}
                                    className="p-1.5 rounded-lg bg-white border border-indigo-200/80 shadow-2xs space-y-1"
                                  >
                                    <div className="flex items-center justify-between text-[10px] font-bold text-indigo-800">
                                      <span>Not {idx + 1}:</span>
                                      <span className="font-mono">{val}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={val}
                                        onChange={(e) => {
                                          const parsed = parseInt(e.target.value, 10);
                                          if (!isNaN(parsed) && liveStudent && onUpdateStudentSubScore) {
                                            onUpdateStudentSubScore(
                                              liveStudent.id,
                                              activeCriterion.id,
                                              idx,
                                              Math.max(0, Math.min(100, parsed))
                                            );
                                          }
                                        }}
                                        className="w-full text-center font-mono font-bold text-xs py-1 rounded bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                                      />
                                    </div>
                                    {/* Quick Preset Buttons */}
                                    <div className="flex items-center justify-center gap-0.5 pt-0.5">
                                      {[100, 85, 70, 50].map((quick) => (
                                        <button
                                          key={quick}
                                          type="button"
                                          onClick={() => {
                                            if (liveStudent && onUpdateStudentSubScore) {
                                              onUpdateStudentSubScore(
                                                liveStudent.id,
                                                activeCriterion.id,
                                                idx,
                                                quick
                                              );
                                            }
                                          }}
                                          className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-900 border border-slate-200 cursor-pointer"
                                        >
                                          {quick}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <>
                      {/* Quick Delta Buttons */}
                      <div className="pt-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Hızlı Puan Ver / Kes:
                        </span>
                        <div className="grid grid-cols-6 gap-1">
                          <button
                            type="button"
                            onClick={() => handleAdjustCriterionScore(-10, '10 Puan Kesildi')}
                            className="py-1.5 px-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-black transition-all active:scale-95 cursor-pointer text-center"
                            title="-10 Puan Kes"
                          >
                            -10
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustCriterionScore(-5, '5 Puan Kesildi')}
                            className="py-1.5 px-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-black transition-all active:scale-95 cursor-pointer text-center"
                            title="-5 Puan Kes"
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustCriterionScore(1, '+1 Puan Eklendi')}
                            className="py-1.5 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-black transition-all active:scale-95 cursor-pointer text-center"
                            title="+1 Puan Ekle"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustCriterionScore(5, '+5 Puan Eklendi')}
                            className="py-1.5 px-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-black transition-all active:scale-95 cursor-pointer text-center"
                            title="+5 Puan Ekle"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustCriterionScore(10, '+10 Puan Eklendi')}
                            className="py-1.5 px-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-black transition-all active:scale-95 cursor-pointer text-center shadow-xs"
                            title="+10 Puan Ekle"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetExactCriterionScore(100, 'Tam Puan (100) Verildi')}
                            className="py-1.5 px-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-black transition-all active:scale-95 cursor-pointer text-center"
                            title="100 Tam Puan Ver"
                          >
                            💯 100
                          </button>
                        </div>
                      </div>

                      {/* Preset Reasons Chips */}
                      <div className="pt-1 border-t border-slate-100 flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => handleAdjustCriterionScore(10, 'Soruyu Doğru Yanıtladı (+10)')}
                          className="px-2 py-1 rounded-md bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          ✓ Doğru Yanıt (+10)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustCriterionScore(5, 'Derse Aktif Katıldı (+5)')}
                          className="px-2 py-1 rounded-md bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          ✓ Aktif Katılım (+5)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustCriterionScore(-10, 'Eksik veya Hazırlıksız (-10)')}
                          className="px-2 py-1 rounded-md bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-800 text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          ✕ Eksik / Hazırlıksız (-10)
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Full Criteria Modal Button */}
              {onOpenCriteriaModal && (
                <button
                  type="button"
                  onClick={() => {
                    stopSpeech();
                    onOpenCriteriaModal(liveStudent);
                    onClose();
                  }}
                  className="w-full py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                    <span>Tüm Ölçüt Çizelgesini Aç (Detaylı Notlandır)</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}

              {/* Student Queue / Progress for active criterion */}
              {activeCriterion && (
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowStatusList((prev) => !prev)}
                    className="w-full py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: activeCriterion.color || '#0d9488' }}
                      />
                      <span className="truncate">
                        {activeCriterion.name} Takip Listesi ({calledStudents.length} Yapıldı · {uncalledStudents.length} Kalan)
                      </span>
                    </span>
                    <span className="text-[10px] text-teal-700 font-bold shrink-0 ml-1">
                      {showStatusList ? 'Gizle ▲' : 'Göster ▼'}
                    </span>
                  </button>

                  {showStatusList && (
                    <div className="mt-2 p-2.5 bg-white border border-slate-200 rounded-xl space-y-2 max-h-36 overflow-y-auto text-left shadow-2xs">
                      {uncalledStudents.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">
                            ⏳ Sıra Bekleyenler ({uncalledStudents.length}):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {uncalledStudents.map((st) => (
                              <span
                                key={st.id}
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900"
                              >
                                #{st.number} {st.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {calledStudents.length > 0 && (
                        <div className="pt-1 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                            ✓ Kontrol Edilenler ({calledStudents.length}):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {calledStudents.map((st) => (
                              <span
                                key={st.id}
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900"
                              >
                                ✓ #{st.number} {st.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Bonus Buttons (+1 Star / Homework) */}
          {liveStudent && !isShuffling && (
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  onAwardStudent(liveStudent, 'star');
                  setFeedbackToast('✓ +1 Söz Hakkı Yıldızı Eklendi!');
                  setTimeout(() => setFeedbackToast(null), 2500);
                }}
                className="py-2 px-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-transform cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-white" />
                <span>+1 Söz Ver (Yıldız)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onAwardStudent(liveStudent, 'homework_plus');
                  setFeedbackToast('✓ Ödev Başarıyla Tamamlandı!');
                  setTimeout(() => setFeedbackToast(null), 2500);
                }}
                className="py-2 px-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-transform cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ödevini Tamamla</span>
              </button>
            </div>
          )}

          {/* Next Student Shuffle Button */}
          {liveStudent && !isShuffling && (
            <button
              type="button"
              onClick={startShuffle}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Shuffle className="w-4 h-4 text-amber-400" />
              <span>
                {remainingInRound > 1
                  ? `Sıradaki Öğrenciyi Seç (${remainingInRound - 1} kaldı)`
                  : 'Yeni Tur Başlat & Seç'}
              </span>
            </button>
          )}

          {/* Turu Sıfırla Action */}
          {!isShuffling && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="truncate mr-2">Her ölçüt kendi sırasını hatırlar</span>
              <button
                type="button"
                onClick={() => {
                  onResetRound(activeCriterion?.id);
                  stopSpeech();
                  onClose();
                }}
                className="text-slate-500 hover:text-teal-700 font-semibold flex items-center gap-1 hover:underline cursor-pointer shrink-0"
                title={activeCriterion ? `Sadece "${activeCriterion.name}" ölçütünün turunu sıfırlar` : 'Turu Sıfırla'}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{activeCriterion ? `"${activeCriterion.name}" Turunu Sıfırla` : 'Turu Sıfırla'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
