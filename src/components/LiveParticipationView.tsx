import React, { useState } from 'react';
import {
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Hand,
  AlertTriangle,
  MessageSquare,
  Shuffle,
  Users,
  Search,
  Filter,
  ArrowUpDown,
  RotateCcw,
  Plus,
  Award,
  ChevronDown,
  Sparkles,
  Check,
  Trash2,
  Edit3,
  Sliders,
  Table2,
  FileSpreadsheet,
  Pencil,
  Hash,
  X,
} from 'lucide-react';
import { ClassGroup, Student, AttendanceStatus, ParticipationItem, AssessmentCriterion } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { calculateStudentAverageGrade } from '../utils/criteria';

interface LiveParticipationViewProps {
  activeClass: ClassGroup | null;
  classes: ClassGroup[];
  criteria: AssessmentCriterion[];
  onSelectClass: (id: string) => void;
  onUpdateStudent: (classId: string, updatedStudent: Student) => void;
  onAddStudent: (classId: string) => void;
  onOpenBulkAddStudent?: (classId: string) => void;
  onDeleteStudent?: (classId: string, studentId: string) => void;
  onOpenEditClass?: (classGroup: ClassGroup) => void;
  onDeleteClass?: (classId: string) => void;
  onOpenAddClass?: () => void;
  onOpenRandomPicker: () => void;
  onOpenReport: () => void;
  onResetRound?: (classId: string) => void;
  onOpenStudentCriteria?: (student: Student) => void;
  onOpenManageCriteria?: () => void;
  onNavigateToGradebook?: () => void;
  timerMinutes: number;
  timerSeconds: number;
  isTimerRunning: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
}

export const LiveParticipationView: React.FC<LiveParticipationViewProps> = ({
  activeClass,
  classes,
  criteria,
  onSelectClass,
  onUpdateStudent,
  onAddStudent,
  onOpenBulkAddStudent,
  onDeleteStudent,
  onOpenEditClass,
  onDeleteClass,
  onOpenAddClass,
  onOpenRandomPicker,
  onOpenReport,
  onResetRound,
  onOpenStudentCriteria,
  onOpenManageCriteria,
  onNavigateToGradebook,
  timerMinutes,
  timerSeconds,
  isTimerRunning,
  onToggleTimer,
  onResetTimer,
}) => {
  const [filterMode, setFilterMode] = useState<
    'all' | 'participated' | 'homework_missing' | 'absent' | 'not_called_yet' | 'called_in_round'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'number' | 'name' | 'points'>('number');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedStudentForNote, setSelectedStudentForNote] = useState<Student | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [classToDelete, setClassToDelete] = useState<ClassGroup | null>(null);

  // Inline edit school number on student card
  const [inlineEditingNumberStudentId, setInlineEditingNumberStudentId] = useState<string | null>(null);
  const [inlineNumberValue, setInlineNumberValue] = useState('');

  // Full student edit modal
  const [editingStudentForInfo, setEditingStudentForInfo] = useState<Student | null>(null);
  const [editStudentNumber, setEditStudentNumber] = useState('');
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentGender, setEditStudentGender] = useState<'M' | 'F'>('M');
  const [editStudentNotes, setEditStudentNotes] = useState('');

  // Bulk edit school numbers modal
  const [isBulkNumbersModalOpen, setIsBulkNumbersModalOpen] = useState(false);
  const [bulkNumbersMap, setBulkNumbersMap] = useState<Record<string, string>>({});
  const [pastedNumbersText, setPastedNumbersText] = useState('');
  const [showPastedNumbersInput, setShowPastedNumbersInput] = useState(false);

  // Show quick toast notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  // Handlers for school number editing
  const handleSaveInlineNumber = (student: Student) => {
    const trimmed = inlineNumberValue.trim();
    if (!trimmed || trimmed === student.number) {
      setInlineEditingNumberStudentId(null);
      return;
    }
    const updated: Student = {
      ...student,
      number: trimmed,
    };
    onUpdateStudent(activeClass!.id, updated);
    setInlineEditingNumberStudentId(null);
    triggerToast(`✓ ${student.name} okul numarası güncellendi: ${trimmed}`);
  };

  const handleOpenEditStudentModal = (student: Student) => {
    setEditingStudentForInfo(student);
    setEditStudentNumber(student.number);
    setEditStudentName(student.name);
    setEditStudentGender(student.gender || 'M');
    setEditStudentNotes(student.notes || '');
  };

  const handleSaveStudentInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentForInfo || !editStudentName.trim() || !activeClass) return;

    const updated: Student = {
      ...editingStudentForInfo,
      number: editStudentNumber.trim() || editingStudentForInfo.number,
      name: editStudentName.trim(),
      gender: editStudentGender,
      notes: editStudentNotes.trim(),
    };
    onUpdateStudent(activeClass.id, updated);
    setEditingStudentForInfo(null);
    triggerToast(`✓ ${updated.name} (Okul No: ${updated.number}) bilgileri güncellendi`);
  };

  const handleOpenBulkEditNumbers = () => {
    if (!activeClass) return;
    const initialMap: Record<string, string> = {};
    activeClass.students.forEach((s) => {
      initialMap[s.id] = s.number;
    });
    setBulkNumbersMap(initialMap);
    setPastedNumbersText('');
    setShowPastedNumbersInput(false);
    setIsBulkNumbersModalOpen(true);
  };

  const handleApplyPastedNumbers = () => {
    if (!activeClass || !pastedNumbersText.trim()) return;
    const nums = pastedNumbersText
      .split(/[\r\n\t,;]+/)
      .map((n) => n.trim())
      .filter((n) => /^\d+$/.test(n));

    if (nums.length === 0) {
      triggerToast('Yapıştırılan metinde geçerli numara bulunamadı.');
      return;
    }

    const newMap = { ...bulkNumbersMap };
    activeClass.students.forEach((s, idx) => {
      if (idx < nums.length) {
        newMap[s.id] = nums[idx];
      }
    });
    setBulkNumbersMap(newMap);
    setPastedNumbersText('');
    setShowPastedNumbersInput(false);
    triggerToast(`✓ ${Math.min(nums.length, activeClass.students.length)} öğrenciye okul numarası aktarıldı`);
  };

  const handleSaveBulkNumbers = () => {
    if (!activeClass) return;
    activeClass.students.forEach((s) => {
      const newNum = bulkNumbersMap[s.id]?.trim();
      if (newNum && newNum !== s.number) {
        onUpdateStudent(activeClass.id, {
          ...s,
          number: newNum,
        });
      }
    });
    setIsBulkNumbersModalOpen(false);
    triggerToast('✓ Sınıf okul numaraları başarıyla güncellendi');
  };

  // If no classes exist yet or activeClass is invalid
  if (!activeClass || !activeClass.students || classes.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/90 shadow-xs max-w-lg mx-auto my-8">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
          <Users className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Henüz Kayıtlı Sınıf Yok</h3>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          Katılım takibi yapabilmek için lütfen yeni bir sınıf ekleyin.
        </p>
        {onOpenAddClass && (
          <button
            onClick={onOpenAddClass}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm rounded-xl shadow-sm hover:from-orange-600 hover:to-amber-600 transition-all cursor-pointer"
          >
            + Yeni Sınıf Ekle
          </button>
        )}
      </div>
    );
  }

  // Cycle attendance status
  const cycleAttendance = (student: Student) => {
    const cycleMap: Record<AttendanceStatus, AttendanceStatus> = {
      present: 'late',
      late: 'absent',
      absent: 'present',
      excused: 'present',
    };
    const nextStatus = cycleMap[student.attendance];
    const updated: Student = {
      ...student,
      attendance: nextStatus,
    };
    onUpdateStudent(activeClass.id, updated);
    const label =
      nextStatus === 'present'
        ? 'Burada'
        : nextStatus === 'late'
        ? 'Geç Kaldı'
        : 'Yok / Gelmedi';
    triggerToast(`${student.name}: ${label}`);
  };

  // 1-Tap Quick Participation Action
  const handleQuickAction = (
    student: Student,
    actionType: 'star' | 'homework_plus' | 'homework_minus' | 'hand' | 'minus_point'
  ) => {
    const timeStr = new Date().toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    let pointDelta = 0;
    let label = '';
    let homeworkCount = student.homeworkCount;
    let homeworkMissed = student.homeworkMissed;

    switch (actionType) {
      case 'star':
        pointDelta = 1;
        label = '⭐ Söz Aldı (+1)';
        break;
      case 'homework_plus':
        homeworkCount += 1;
        label = '📝 Ödev Tam (+)';
        break;
      case 'homework_minus':
        homeworkMissed += 1;
        label = '⚠️ Ödev Eksik (-)';
        break;
      case 'hand':
        pointDelta = 1;
        label = '✋ Derse Katkı (+1)';
        break;
      case 'minus_point':
        pointDelta = -1;
        label = '⚠️ Uyarı (-1)';
        break;
    }

    const newParticipation: ParticipationItem = {
      id: 'p-' + Date.now(),
      type: actionType,
      label,
      points: pointDelta,
      timestamp: timeStr,
    };

    const updated: Student = {
      ...student,
      // If student was absent, automatically mark present if they participated
      attendance: student.attendance === 'absent' ? 'present' : student.attendance,
      points: Math.max(0, student.points + pointDelta),
      homeworkCount,
      homeworkMissed,
      participations: [newParticipation, ...student.participations],
    };

    onUpdateStudent(activeClass.id, updated);
    triggerToast(`${student.name}: ${label}`);
  };

  // Undo last action for student
  const handleUndo = (student: Student) => {
    if (student.participations.length === 0) return;
    const lastItem = student.participations[0];
    const remaining = student.participations.slice(1);

    let newPoints = student.points - lastItem.points;
    let newHomework = student.homeworkCount;
    let newMissed = student.homeworkMissed;

    if (lastItem.type === 'homework_plus') {
      newHomework = Math.max(0, newHomework - 1);
    } else if (lastItem.type === 'homework_minus') {
      newMissed = Math.max(0, newMissed - 1);
    }

    const updated: Student = {
      ...student,
      points: Math.max(0, newPoints),
      homeworkCount: newHomework,
      homeworkMissed: newMissed,
      participations: remaining,
    };

    onUpdateStudent(activeClass.id, updated);
    triggerToast(`${student.name}: Son işlem geri alındı`);
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    const updatedStudents = activeClass.students.map((s) => ({
      ...s,
      attendance: 'present' as AttendanceStatus,
    }));
    updatedStudents.forEach((st) => onUpdateStudent(activeClass.id, st));
    triggerToast('Tüm öğrenciler "Burada" olarak işaretlendi');
  };

  // Save Note Modal
  const handleSaveNote = () => {
    if (!selectedStudentForNote) return;
    const updated: Student = {
      ...selectedStudentForNote,
      notes: noteInput,
    };
    onUpdateStudent(activeClass.id, updated);
    setSelectedStudentForNote(null);
    setNoteInput('');
    triggerToast('Öğrenci notu güncellendi');
  };

  // Toggle student's board/turn status manually
  const handleToggleStudentTurn = (student: Student) => {
    const nextStatus = !student.calledInCurrentRound;
    const newCount = nextStatus
      ? (student.calledCount || 0) + 1
      : Math.max(0, (student.calledCount || 1) - 1);
    const updated: Student = {
      ...student,
      calledInCurrentRound: nextStatus,
      calledCount: newCount,
    };
    onUpdateStudent(activeClass.id, updated);
    triggerToast(
      nextStatus
        ? `${student.name}: Tahtaya kalktı olarak işaretlendi (${newCount}. kez)`
        : `${student.name}: Sırası sıfırlandı (bekliyor)`
    );
  };

  // Filter & Search & Sort students
  const filteredStudents = activeClass.students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.number.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterMode === 'participated') return student.points > 0;
    if (filterMode === 'homework_missing') return student.homeworkMissed > 0;
    if (filterMode === 'absent') return student.attendance === 'absent';
    if (filterMode === 'not_called_yet') {
      return (
        (student.attendance === 'present' || student.attendance === 'late') &&
        !student.calledInCurrentRound
      );
    }
    if (filterMode === 'called_in_round') {
      return !!student.calledInCurrentRound;
    }
    return true;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortBy === 'number') {
      return parseInt(a.number, 10) - parseInt(b.number, 10);
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name, 'tr');
    }
    if (sortBy === 'points') {
      return b.points - a.points;
    }
    return 0;
  });

  // Calculate live statistics
  const presentCount = activeClass.students.filter((s) => s.attendance === 'present').length;
  const lateCount = activeClass.students.filter((s) => s.attendance === 'late').length;
  const absentCount = activeClass.students.filter((s) => s.attendance === 'absent').length;
  const totalPoints = activeClass.students.reduce((acc, s) => acc + s.points, 0);

  // Fair turn & round rotation statistics
  const eligibleStudents = activeClass.students.filter(
    (s) => s.attendance === 'present' || s.attendance === 'late'
  );
  const calledInRoundCount = eligibleStudents.filter((s) => s.calledInCurrentRound).length;
  const uncalledInRoundCount = eligibleStudents.filter((s) => !s.calledInCurrentRound).length;
  const currentRound = activeClass.roundNumber || 1;
  const roundProgressPercent =
    eligibleStudents.length > 0
      ? Math.round((calledInRoundCount / eligibleStudents.length) * 100)
      : 0;

  return (
    <div className="space-y-4 pb-24 max-w-full overflow-hidden">
      {/* Toast Pop-up */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg backdrop-blur-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Quick Jump to Student List */}
      <div className="sm:hidden flex items-center justify-between bg-teal-50/90 border border-teal-200/90 rounded-xl px-3 py-2 text-xs font-bold text-teal-900 shadow-2xs">
        <div className="flex items-center gap-1.5 truncate mr-2">
          <Users className="w-4 h-4 text-teal-700 shrink-0" />
          <span className="truncate">{activeClass.name} · {sortedStudents.length} Öğrenci</span>
        </div>
        <button
          type="button"
          onClick={() => {
            document.getElementById('student-cards-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="text-teal-800 bg-white px-2.5 py-1 rounded-lg border border-teal-300 shadow-xs flex items-center gap-1 shrink-0 active:scale-95 cursor-pointer font-bold"
        >
          <span>Listeye İn</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Class Control & Live Session Banner */}
      <section className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200 shadow-xs max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-sm"
              style={{ backgroundColor: activeClass.color || '#0284c7' }}
            >
              {activeClass.grade || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  {activeClass.name}
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {activeClass.subject || 'Ders'}
                </span>
                {onOpenEditClass && (
                  <button
                    onClick={() => onOpenEditClass(activeClass)}
                    className="w-7 h-7 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 flex items-center justify-center transition-colors cursor-pointer"
                    title="Sınıfı Düzenle"
                    aria-label="Sınıfı Düzenle"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDeleteClass && (
                  <button
                    onClick={() => setClassToDelete(activeClass)}
                    className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                    title="Sınıfı Sil"
                    aria-label="Sınıfı Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {activeClass.room || 'Derslik'} · {activeClass.students.length} Kayıtlı Öğrenci
              </p>
            </div>
          </div>

          {/* Lesson Timer & Random Student Launcher */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 40 Min Lesson Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/90 rounded-xl text-xs font-mono font-bold text-slate-700">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>
                {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
              </span>
              <button
                onClick={onToggleTimer}
                className="ml-1 text-[11px] font-sans font-bold text-teal-700 hover:text-teal-900 underline"
              >
                {isTimerRunning ? 'Duraklat' : 'Başlat'}
              </button>
            </div>

            {/* Random Student Picker */}
            <button
              onClick={onOpenRandomPicker}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold shadow-xs hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Rastgele Öğrenci Seç</span>
            </button>

            {/* Daily Report */}
            <button
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-50 text-teal-700 border border-teal-200/80 rounded-xl text-xs font-bold hover:bg-teal-100 transition-colors cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Ders</span> Raporu
            </button>

            {/* Gradebook Matrix View */}
            {onNavigateToGradebook && (
              <button
                onClick={onNavigateToGradebook}
                className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Table2 className="w-3.5 h-3.5" />
                <span>Not Çizelgesi</span>
              </button>
            )}

            {/* Criteria Settings */}
            {onOpenManageCriteria && (
              <button
                onClick={onOpenManageCriteria}
                className="flex items-center gap-1.5 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Ders Değerlendirme Ölçütlerini Yönet"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Ölçütler</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Attendance & Score Stats Bar */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-2.5 text-center">
            <span className="text-[11px] font-bold text-emerald-800 uppercase block">
              Burada
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-emerald-700 font-mono">
              {presentCount}
            </span>
          </div>

          <div className="bg-amber-50/80 border border-amber-100 rounded-xl p-2.5 text-center">
            <span className="text-[11px] font-bold text-amber-800 uppercase block">
              Geç
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-amber-700 font-mono">
              {lateCount}
            </span>
          </div>

          <div className="bg-rose-50/80 border border-rose-100 rounded-xl p-2.5 text-center">
            <span className="text-[11px] font-bold text-rose-800 uppercase block">
              Yok
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-rose-700 font-mono">
              {absentCount}
            </span>
          </div>

          <div className="bg-sky-50/80 border border-sky-100 rounded-xl p-2.5 text-center">
            <span className="text-[11px] font-bold text-sky-800 uppercase block">
              Katılım ⭐
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-sky-700 font-mono">
              +{totalPoints}
            </span>
          </div>
        </div>

        {/* Adil Söz Alma / Tur İlerleme Çubuğu (Kullanıcı Talebi) */}
        <div className="mt-3.5 pt-3 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                  <span>Adil Söz Alma · {currentRound}. Tur</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    ({calledInRoundCount} / {eligibleStudents.length} tahtaya kalktı)
                  </span>
                </div>
                <span className="font-mono font-bold text-teal-700 text-xs">
                  %{roundProgressPercent}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${roundProgressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 justify-between sm:justify-end">
              {uncalledInRoundCount > 0 ? (
                <span className="text-[11px] text-amber-800 font-semibold bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-lg">
                  ⏳ {uncalledInRoundCount} öğrenci bekliyor
                </span>
              ) : (
                <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Herkes kalktı</span>
                </span>
              )}

              {onResetRound && (
                <button
                  type="button"
                  onClick={() => onResetRound(activeClass.id)}
                  className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="Turu sıfırla ve herkesi tekrar eşit sıraya al"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Turu Sıfırla</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Batch Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 text-xs text-slate-500">
          <button
            onClick={handleMarkAllPresent}
            className="text-teal-700 hover:text-teal-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tüm Sınıfı 'Burada' Yap</span>
          </button>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => onAddStudent(activeClass.id)}
              className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-xs"
            >
              <Plus className="w-3.5 h-3.5 text-teal-600" />
              <span>Tek Öğrenci</span>
            </button>

            {onOpenBulkAddStudent && (
              <button
                onClick={() => onOpenBulkAddStudent(activeClass.id)}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1.5 rounded-lg border border-emerald-200/80 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs text-xs"
                title="Excel veya e-Okul'dan toplu öğrenci aktar"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Toplu Öğrenci Ekle (Excel)</span>
              </button>
            )}

            {activeClass.students.length > 0 && (
              <button
                type="button"
                onClick={handleOpenBulkEditNumbers}
                className="bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold px-2.5 py-1.5 rounded-lg border border-teal-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs text-xs"
                title="Sınıftaki öğrencilerin okul numaralarını topluca düzenleyin veya Excel'den numara yapıştırın"
              >
                <Hash className="w-3.5 h-3.5 text-teal-600" />
                <span>Okul Numaralarını Düzenle</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Search, Filter & Sort Controls */}
      <section className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-xs space-y-2.5 max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Öğrenci ara (isim veya no)..."
              className="w-full pl-9 pr-8 py-2 bg-slate-100 text-xs sm:text-sm text-slate-900 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 border border-slate-200/80"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 shrink-0 text-xs flex-wrap">
            <span className="text-slate-400 font-medium">Sırala:</span>
            <button
              onClick={() => setSortBy('number')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors ${
                sortBy === 'number'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Okul No
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors ${
                sortBy === 'name'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              İsim
            </button>
            <button
              onClick={() => setSortBy('points')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors ${
                sortBy === 'points'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Puan ⭐
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100 text-xs">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-full font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tüm Öğrenciler ({activeClass.students.length})
          </button>

          <button
            onClick={() => setFilterMode('participated')}
            className={`px-2.5 py-1 rounded-full font-bold transition-all flex items-center gap-1 ${
              filterMode === 'participated'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>⭐</span>
            <span>Söz Alanlar</span>
          </button>

          <button
            onClick={() => setFilterMode('homework_missing')}
            className={`px-2.5 py-1 rounded-full font-bold transition-all flex items-center gap-1 ${
              filterMode === 'homework_missing'
                ? 'bg-rose-700 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/60'
            }`}
          >
            <span>⚠️</span>
            <span>Ödev Eksik</span>
          </button>

          <button
            onClick={() => setFilterMode('not_called_yet')}
            className={`px-2.5 py-1 rounded-full font-bold transition-all flex items-center gap-1 ${
              filterMode === 'not_called_yet'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <span>⏳</span>
            <span>Bekleyenler ({uncalledInRoundCount})</span>
          </button>

          <button
            onClick={() => setFilterMode('called_in_round')}
            className={`px-2.5 py-1 rounded-full font-bold transition-all flex items-center gap-1 ${
              filterMode === 'called_in_round'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>🎤</span>
            <span>Kalkanlar ({calledInRoundCount})</span>
          </button>

          <button
            onClick={() => setFilterMode('absent')}
            className={`px-2.5 py-1 rounded-full font-bold transition-all flex items-center gap-1 ${
              filterMode === 'absent'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>🔴</span>
            <span>Devamsız ({absentCount})</span>
          </button>
        </div>
      </section>

      {/* STUDENT LIST & INSTANT PARTICIPATION BUTTONS (Core User Request) */}
      <div id="student-cards-section" className="space-y-3 scroll-mt-20">
        {sortedStudents.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-10 text-center border border-slate-200/90 text-slate-500 shadow-2xs">
            {activeClass.students.length === 0 ? (
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shadow-xs">
                  <Users className="w-7 h-7" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-base">
                  Bu Sınıfta Henüz Öğrenci Kayıtlı Değil
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Öğrencilerinizi tek tek girebilir ya da <strong>Excel / e-Okul</strong> listenizi kopyalayarak saniyeler içinde toplu olarak aktarabilirsiniz.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => onAddStudent(activeClass.id)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    + Tek Öğrenci Ekle
                  </button>
                  {onOpenBulkAddStudent && (
                    <button
                      onClick={() => onOpenBulkAddStudent(activeClass.id)}
                      className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                      <span>Toplu Öğrenci Ekle (Excel / e-Okul)</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-slate-700">Aramanıza veya filtreye uygun öğrenci bulunamadı.</p>
                <p className="text-xs text-slate-400 mt-1">Lütfen filtreleri temizleyip tekrar deneyin.</p>
              </div>
            )}
          </div>
        ) : (
          sortedStudents.map((student) => {
            const isAbsent = student.attendance === 'absent';
            const isLate = student.attendance === 'late';
            const { formatted: avgGrade, badgeClass: avgBadgeClass } =
              calculateStudentAverageGrade(criteria, student);

            return (
              <div
                key={student.id}
                className={`bg-white rounded-2xl p-3.5 sm:p-4 border transition-all shadow-xs max-w-full overflow-hidden ${
                  isAbsent
                    ? 'border-rose-200 bg-rose-50/20 opacity-80'
                    : isLate
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-200/90 hover:border-teal-400'
                }`}
              >
                {/* Top Area: Identity, Attendance status, Grade & Actions */}
                <div className="pb-2.5 border-b border-slate-100 space-y-2">
                  {/* Row 1: Student Number + Name & Turn Status + Attendance Toggle */}
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {/* Student School Number Badge (Click to Edit) */}
                      {inlineEditingNumberStudentId === student.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSaveInlineNumber(student);
                          }}
                          className="flex items-center gap-1 bg-white border-2 border-teal-500 rounded-lg p-0.5 shadow-md z-10 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[10px] font-bold text-teal-700 pl-1">No:</span>
                          <input
                            type="text"
                            autoFocus
                            value={inlineNumberValue}
                            onChange={(e) => setInlineNumberValue(e.target.value)}
                            onBlur={() => handleSaveInlineNumber(student)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                setInlineEditingNumberStudentId(null);
                              }
                            }}
                            className="w-16 px-1 py-0.5 text-xs font-mono font-bold text-slate-900 focus:outline-none rounded"
                            placeholder="Okul No"
                          />
                          <button
                            type="submit"
                            className="p-1 text-emerald-600 hover:text-emerald-700 font-bold text-xs"
                            title="Kaydet"
                          >
                            ✓
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setInlineEditingNumberStudentId(student.id);
                            setInlineNumberValue(student.number);
                          }}
                          className="flex items-center gap-1 bg-slate-100 hover:bg-teal-50 hover:border-teal-300 border border-slate-200/90 text-slate-800 px-2 py-0.5 rounded-lg shrink-0 transition-all shadow-2xs group cursor-pointer"
                          title="Okul Numarasını Değiştirmek İçin Dokunun"
                        >
                          <span className="text-[10px] font-bold text-slate-400 group-hover:text-teal-600 uppercase tracking-tight">
                            No
                          </span>
                          <span className="font-mono font-black text-xs text-slate-800 group-hover:text-teal-900">
                            {student.number}
                          </span>
                          <Pencil className="w-2.5 h-2.5 text-slate-400 group-hover:text-teal-600 opacity-60 group-hover:opacity-100 ml-0.5" />
                        </button>
                      )}

                      {/* Student Name & Turn Status Badge */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm sm:text-base text-slate-900 truncate">
                            {student.name}
                          </span>

                          {/* Fair Turn Indicator Badge */}
                          {student.calledInCurrentRound ? (
                            <button
                              type="button"
                              onClick={() => handleToggleStudentTurn(student)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold border border-teal-200 shrink-0 cursor-pointer hover:bg-teal-200 transition-colors"
                              title={`Bu turda tahtaya kalktı (${student.calledCount || 1}. kez). Tıklayarak bekliyor yapabilirsiniz.`}
                            >
                              <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                              <span>Kalktı ({student.calledCount || 1}x)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleStudentTurn(student)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-900 text-[10px] font-semibold border border-amber-200/80 shrink-0 cursor-pointer hover:bg-amber-100 transition-colors"
                              title="Bu turda henüz tahtaya kalkmadı. Tıklayarak kalktı olarak işaretleyebilirsiniz."
                            >
                              <Clock className="w-2.5 h-2.5 text-amber-600" />
                              <span>Bekliyor</span>
                            </button>
                          )}
                        </div>

                        {student.notes && (
                          <p className="text-[11px] text-amber-800 italic truncate max-w-xs mt-0.5">
                            Not: {student.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Attendance Status Button (1-tap cycle) */}
                    <button
                      onClick={() => cycleAttendance(student)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-transform active:scale-95 flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs ${
                        student.attendance === 'present'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : student.attendance === 'late'
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      }`}
                      title="Durumu değiştirmek için tıkla"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          student.attendance === 'present'
                            ? 'bg-emerald-600'
                            : student.attendance === 'late'
                            ? 'bg-amber-500'
                            : 'bg-rose-600'
                        }`}
                      />
                      <span>
                        {student.attendance === 'present'
                          ? 'Burada'
                          : student.attendance === 'late'
                          ? 'Geç'
                          : 'Yok'}
                      </span>
                    </button>
                  </div>

                  {/* Row 2: Criteria Grade + Total Points + Quick Tools (Undo, Edit, Delete) */}
                  <div className="flex items-center justify-between gap-1.5 text-xs pt-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Overall Criteria Grade Badge */}
                      {onOpenStudentCriteria && (
                        <button
                          type="button"
                          onClick={() => onOpenStudentCriteria(student)}
                          className={`px-2 py-0.5 rounded-lg text-xs font-black font-mono border transition-transform active:scale-95 flex items-center gap-1 cursor-pointer ${avgBadgeClass}`}
                          title="Ölçüt notlarını aç (Kitap, MEBİ/EBA, Ders İçi, Performans...)"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>Not: {avgGrade}</span>
                        </button>
                      )}

                      {/* Total Points Badge */}
                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 text-amber-900 px-2 py-0.5 rounded-lg text-xs font-extrabold font-mono">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        <span>+{student.points}</span>
                      </div>
                    </div>

                    {/* Quick Tools */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Undo Button if student has actions */}
                      {student.participations.length > 0 && (
                        <button
                          onClick={() => handleUndo(student)}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                          title="Son işlemi geri al"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Edit Student Button */}
                      <button
                        onClick={() => handleOpenEditStudentModal(student)}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 flex items-center justify-center transition-colors cursor-pointer"
                        title="Öğrenci Bilgilerini Düzenle (Okul No, İsim, Cinsiyet)"
                        aria-label="Öğrenciyi Düzenle"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Student Button */}
                      {onDeleteStudent && (
                        <button
                          onClick={() => setStudentToDelete(student)}
                          className="w-7 h-7 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                          title="Öğrenciyi Sil"
                          aria-label="Öğrenciyi Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: HIZLI KATILIM VE ÖLÇÜT BUTONLARI */}
                <div className="pt-2.5 grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
                  {/* 1. Söz Aldı / Doğru Cevap (+1 Star) */}
                  <button
                    onClick={() => handleQuickAction(student, 'star')}
                    className="py-2 px-1 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1 shadow-xs transition-all cursor-pointer min-h-[44px]"
                    title="Derste söz aldı veya doğru cevap verdi (+1 Puan)"
                  >
                    <Star className="w-4 h-4 fill-white shrink-0" />
                    <span className="truncate">+1 Söz</span>
                  </button>

                  {/* 2. Ödev Tam (+) */}
                  <button
                    onClick={() => handleQuickAction(student, 'homework_plus')}
                    className="py-2 px-1 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1 shadow-xs transition-all cursor-pointer min-h-[44px]"
                    title="Ödevi tam ve hazır"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="truncate">Ödev +</span>
                  </button>

                  {/* 3. Ödev Eksik (-) */}
                  <button
                    onClick={() => handleQuickAction(student, 'homework_minus')}
                    className="py-2 px-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 active:scale-95 font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer min-h-[44px]"
                    title="Ödevi yapmamış veya eksik"
                  >
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="truncate">Ödev -</span>
                  </button>

                  {/* 4. Parmak / Katkı */}
                  <button
                    onClick={() => handleQuickAction(student, 'hand')}
                    className="py-2 px-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 active:scale-95 font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer min-h-[44px]"
                    title="Parmak kaldırdı veya aktif soru sordu"
                  >
                    <Hand className="w-4 h-4 text-sky-600 shrink-0" />
                    <span className="truncate">Parmak</span>
                  </button>

                  {/* 5. Not Ekle Modal Trigger */}
                  <button
                    onClick={() => {
                      setSelectedStudentForNote(student);
                      setNoteInput(student.notes || '');
                    }}
                    className="py-2 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer min-h-[44px]"
                    title="Öğrenciye özel ders içi not yaz"
                  >
                    <MessageSquare className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="truncate">Not</span>
                  </button>

                  {/* 6. Ölçüt Değerlendir Modal Trigger */}
                  {onOpenStudentCriteria && (
                    <button
                      onClick={() => onOpenStudentCriteria(student)}
                      className="py-2 px-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 active:scale-95 font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer min-h-[44px]"
                      title="Ölçüt notlarını düzenle (Kitap, EBA, Ders İçi, Performans)"
                    >
                      <Sliders className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="truncate">Ölçüt</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Note Editing Modal */}
      {selectedStudentForNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Öğrenci Notu Ekle
                </h3>
                <p className="text-xs text-slate-500">
                  Okul No: {selectedStudentForNote.number} · {selectedStudentForNote.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentForNote(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <textarea
              rows={3}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Örn: Tahtada çözdüğü soruyu çok iyi açıkladı. Kitabını unutmuş..."
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedStudentForNote(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                İptal
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
              >
                Notu Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Deletion Confirmation Dialog */}
      <ConfirmModal
        isOpen={studentToDelete !== null}
        onClose={() => setStudentToDelete(null)}
        onConfirm={() => {
          if (studentToDelete && onDeleteStudent) {
            onDeleteStudent(activeClass.id, studentToDelete.id);
            triggerToast(`${studentToDelete.name} sınıftan silindi`);
            setStudentToDelete(null);
          }
        }}
        title={`"${studentToDelete?.name}" Öğrencisini Sil`}
        description={`Bu öğrenci (No: ${studentToDelete?.number}) ve bu derse ait tüm katılım verileri kalıcı olarak silinecektir.`}
        confirmLabel="Evet, Öğrenciyi Sil"
        cancelLabel="Vazgeç"
        isDestructive={true}
      />

      {/* Class Deletion Confirmation Dialog */}
      <ConfirmModal
        isOpen={classToDelete !== null}
        onClose={() => setClassToDelete(null)}
        onConfirm={() => {
          if (classToDelete && onDeleteClass) {
            onDeleteClass(classToDelete.id);
            setClassToDelete(null);
          }
        }}
        title={`"${classToDelete?.name}" Sınıfını Sil`}
        description={`Bu sınıfa ait tüm öğrenciler (${classToDelete?.students.length || 0}) ve katılım kayıtları kalıcı olarak silinecektir.`}
        confirmLabel="Evet, Sınıfı Sil"
        cancelLabel="Vazgeç"
        isDestructive={true}
      />

      {/* Edit Student Info Modal */}
      {editingStudentForInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Öğrenciyi Düzenle
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudentForInfo(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentInfo} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Okul Numarası *
                </label>
                <input
                  type="text"
                  required
                  value={editStudentNumber}
                  onChange={(e) => setEditStudentNumber(e.target.value)}
                  placeholder="Örn: 104, 218..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Adı Soyadı *
                </label>
                <input
                  type="text"
                  required
                  value={editStudentName}
                  onChange={(e) => setEditStudentName(e.target.value)}
                  placeholder="Örn: Bayram Güven"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Cinsiyet
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStudentGender('M')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                      editStudentGender === 'M'
                        ? 'border-sky-600 bg-sky-50 text-sky-800 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    👦 Erkek
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStudentGender('F')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                      editStudentGender === 'F'
                        ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    👧 Kız
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Öğretmen Notu (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={editStudentNotes}
                  onChange={(e) => setEditStudentNotes(e.target.value)}
                  placeholder="Kısa hatırlatma veya not..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudentForInfo(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Edit School Numbers Modal */}
      {isBulkNumbersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Okul Numaralarını Düzenle
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {activeClass.name} · {activeClass.students.length} Öğrenci
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkNumbersModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Excel Paste Helper Toggle */}
            <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-3 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-teal-900 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700" />
                  <span>Excel'den Numaraları Yapıştır</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPastedNumbersInput(!showPastedNumbersInput)}
                  className="text-teal-700 font-bold hover:underline cursor-pointer"
                >
                  {showPastedNumbersInput ? 'Alanı Kapat' : 'Alanı Aç'}
                </button>
              </div>

              {showPastedNumbersInput && (
                <div className="space-y-2 pt-1 animate-in fade-in">
                  <p className="text-[11px] text-teal-800 leading-relaxed">
                    Excel'deki Okul No sütununu kopyalayıp buraya yapıştırırsanız, sırayla listedeki öğrencilere atanır:
                  </p>
                  <textarea
                    rows={3}
                    value={pastedNumbersText}
                    onChange={(e) => setPastedNumbersText(e.target.value)}
                    placeholder="104&#10;215&#10;340..."
                    className="w-full p-2 text-xs font-mono bg-white border border-teal-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPastedNumbers}
                    disabled={!pastedNumbersText.trim()}
                    className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Numaraları Listeye Dağıt
                  </button>
                </div>
              )}
            </div>

            {/* Students Number List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 border border-slate-100 rounded-2xl p-2 bg-slate-50/50 max-h-72">
              {activeClass.students.map((st, idx) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 text-center font-mono text-[11px] text-slate-400 font-bold">
                      {idx + 1}.
                    </span>
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {st.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-slate-400 font-bold">No:</span>
                    <input
                      type="text"
                      value={bulkNumbersMap[st.id] ?? st.number}
                      onChange={(e) =>
                        setBulkNumbersMap((prev) => ({
                          ...prev,
                          [st.id]: e.target.value,
                        }))
                      }
                      className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-center"
                      placeholder="Okul No"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-500">
                {activeClass.students.length} Öğrenci
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkNumbersModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleSaveBulkNumbers}
                  className="px-5 py-2 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Numaraları Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
