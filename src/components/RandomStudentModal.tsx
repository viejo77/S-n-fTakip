import React, { useState, useEffect, useRef } from 'react';
import {
  Shuffle,
  Star,
  Award,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Check,
  Users,
} from 'lucide-react';
import { Student } from '../types';
import { speakTurkish, stopSpeech, isSpeechSupported } from '../utils/speech';

interface RandomStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  currentRound?: number;
  onAwardStudent: (student: Student, type: 'star' | 'homework_plus') => void;
  onMarkStudentCalled: (studentId: string) => void;
  onResetRound: () => void;
}

export const RandomStudentModal: React.FC<RandomStudentModalProps> = ({
  isOpen,
  onClose,
  students,
  currentRound = 1,
  onAwardStudent,
  onMarkStudentCalled,
  onResetRound,
}) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [displayCandidateName, setDisplayCandidateName] = useState('');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [roundCompletedCelebration, setRoundCompletedCelebration] = useState(false);

  const shuffleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Eligible present/late students
  const eligibleStudents = students.filter(
    (s) => s.attendance === 'present' || s.attendance === 'late'
  );

  // Students who have NOT been called in the current round
  const uncalledStudents = eligibleStudents.filter((s) => !s.calledInCurrentRound);

  // Read student name aloud
  const announceStudent = (student: Student) => {
    if (!isAudioEnabled) return;
    setIsSpeaking(true);
    speakTurkish(student.name, () => {
      setIsSpeaking(false);
    });
  };

  const startShuffle = () => {
    // If all eligible students were already called, reset the round automatically first!
    if (uncalledStudents.length === 0) {
      if (eligibleStudents.length === 0) return;
      onResetRound();
      // Uncalled pool becomes all eligible students
    }

    const pool = uncalledStudents.length > 0 ? uncalledStudents : eligibleStudents;
    if (pool.length === 0) return;

    setIsShuffling(true);
    setSelectedStudent(null);
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
        setSelectedStudent(finalStudent);
        setIsShuffling(false);

        // Mark student as called in current round
        onMarkStudentCalled(finalStudent.id);

        // Check if this was the last uncalled student in the class
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
      setSelectedStudent(null);
    }
    return () => {
      stopSpeech();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const totalEligible = eligibleStudents.length;
  const calledCountInRound = eligibleStudents.filter((s) => s.calledInCurrentRound).length;
  const remainingInRound = uncalledStudents.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center relative overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-2">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextState = !isAudioEnabled;
              setIsAudioEnabled(nextState);
              if (!nextState) stopSpeech();
              else if (selectedStudent) announceStudent(selectedStudent);
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isAudioEnabled
                ? 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
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

          {/* Close Button */}
          <button
            onClick={() => {
              stopSpeech();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Round Badge & Progress */}
        <div className="my-2 flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
            <Shuffle className="w-3.5 h-3.5 text-amber-700" />
            <span>Adil Söz Alma · {currentRound}. Tur</span>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 mt-1.5 font-medium">
            <span>
              Kalkan: <strong className="text-teal-700">{calledCountInRound}</strong> / {totalEligible}
            </span>
            <span>·</span>
            <span>
              Kalan: <strong className="text-amber-700">{remainingInRound}</strong>
            </span>
          </div>
        </div>

        {/* Slot Machine / Shuffle Card */}
        <div className="my-4 min-h-[140px] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-teal-50/50 rounded-2xl border border-teal-100 relative">
          {isShuffling ? (
            <div className="space-y-2">
              <span className="text-xs text-teal-700 font-semibold animate-pulse block">
                Öğrenciler taranıyor...
              </span>
              <p className="font-extrabold text-xl sm:text-2xl text-slate-800 font-mono tracking-tight animate-bounce">
                {displayCandidateName}
              </p>
            </div>
          ) : selectedStudent ? (
            <div className="space-y-1.5 animate-in zoom-in-90">
              <div className="relative inline-block">
                <div
                  className="min-w-16 px-3 py-1 mx-auto rounded-2xl bg-teal-600 text-white font-extrabold flex flex-col items-center justify-center shadow-md shadow-teal-600/30"
                  title={`Okul Numarası: ${selectedStudent.number}`}
                >
                  <span className="text-[9px] uppercase tracking-wider text-teal-200 font-bold leading-none">
                    Okul No
                  </span>
                  <span className="font-mono font-black text-lg leading-tight">
                    {selectedStudent.number}
                  </span>
                </div>
                {/* Voice animation pulse */}
                {isSpeaking && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 items-center justify-center text-[9px] text-white">
                      🔊
                    </span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5 mt-1.5">
                <h3 className="font-extrabold text-xl text-slate-900">
                  {selectedStudent.name}
                </h3>
                {/* Re-read audio button */}
                <button
                  type="button"
                  onClick={() => announceStudent(selectedStudent)}
                  className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 hover:bg-teal-200 flex items-center justify-center transition-colors cursor-pointer"
                  title="İsmi tekrar sesli oku"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-0.5">
                <span>Puan: +{selectedStudent.points} ⭐</span>
                <span>·</span>
                <span className="text-teal-700 font-bold">
                  {(selectedStudent.calledCount || 0) + 1}. kez kalktı
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm font-semibold text-slate-700">
                Seçilecek öğrenci bulunamadı
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Tüm öğrenciler devamsız olabilir veya tur tamamlanmış olabilir.
              </p>
            </div>
          )}
        </div>

        {/* Round Complete Celebration Banner */}
        {roundCompletedCelebration && !isShuffling && (
          <div className="mb-3 p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-left text-[11px] leading-tight">
              Tebrikler! Sınıftaki herkes bu turda söz aldı. Bir sonraki seçimde yeni tur başlayacak.
            </span>
          </div>
        )}

        {/* Action Buttons if Student Picked */}
        {selectedStudent && !isShuffling && (
          <div className="space-y-2 pt-1">
            <p className="text-xs text-slate-500 font-medium mb-1.5">
              Öğrenci cevabı için anlık değerlendirme:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  stopSpeech();
                  onAwardStudent(selectedStudent, 'star');
                  onClose();
                }}
                className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform cursor-pointer"
              >
                <Star className="w-4 h-4 fill-white" />
                <span>+1 Söz Ver</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopSpeech();
                  onAwardStudent(selectedStudent, 'homework_plus');
                  onClose();
                }}
                className="py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ödevini Tamamla</span>
              </button>
            </div>

            {/* Next Student Button (Honors fair round rotation) */}
            <button
              type="button"
              onClick={startShuffle}
              className="w-full mt-2 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {remainingInRound > 1
                  ? `Sıradaki Öğrenciyi Seç (${remainingInRound - 1} kaldı)`
                  : 'Yeni Tur Başlat & Seç'}
              </span>
            </button>
          </div>
        )}

        {/* Manual Reset Round button */}
        {!isShuffling && (
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Herkes eşit sayıda kalkar</span>
            <button
              type="button"
              onClick={() => {
                onResetRound();
                stopSpeech();
                onClose();
              }}
              className="text-slate-500 hover:text-teal-700 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Turu Sıfırla</span>
            </button>
          </div>
        )}

        {isShuffling && (
          <div className="text-xs text-slate-400 py-1">
            Lütfen bekleyin, şanslı öğrenci seçiliyor...
          </div>
        )}
      </div>
    </div>
  );
};
