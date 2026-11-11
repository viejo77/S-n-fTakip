import React, { useState } from 'react';
import {
  Shuffle,
  Users,
  Search,
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
  Hash,
  X,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Star,
  Info,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  ClassGroup,
  Student,
  AttendanceStatus,
  AssessmentCriterion,
} from '../types';
import { ConfirmModal } from './ConfirmModal';
import { StudentProfileModal } from './StudentProfileModal';
import { AttendanceModal } from './AttendanceModal';
import { StudentListModal } from './StudentListModal';
import {
  getStudentCriterionScore,
  getStudentCriterionCounts,
  getStudentCriterionSubScores,
  calculateStudentAverageGrade,
} from '../utils/criteria';

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
  onOpenRandomPicker: (criterionId?: string) => void;
  onOpenReport: () => void;
  onResetRound?: (classId: string, criterionId?: string) => void;
  onOpenStudentCriteria?: (student: Student) => void;
  onOpenManageCriteria?: () => void;
  onNavigateToGradebook?: () => void;
  onQuickAdjustStudentScore?: (
    studentId: string,
    criterionId: string,
    delta: number
  ) => void;
  onSetStudentCriterionScore?: (
    studentId: string,
    criterionId: string,
    score: number,
    reason?: string
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
  onQuickAdjustStudentScore,
  onSetStudentCriterionScore,
  onAdjustStudentCounts,
  onSetStudentCounts,
  onUpdateStudentSubScore,
  timerMinutes,
  timerSeconds,
  isTimerRunning,
  onToggleTimer,
  onResetTimer,
}) => {
  // Navigation & selection state
  const [selectedCriterionId, setSelectedCriterionId] = useState<string | null>(null);

  // Modals
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isStudentListModalOpen, setIsStudentListModalOpen] = useState(false);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [classToDelete, setClassToDelete] = useState<ClassGroup | null>(null);

  // Student Edit Modal
  const [editingStudentForInfo, setEditingStudentForInfo] = useState<Student | null>(null);
  const [editStudentNumber, setEditStudentNumber] = useState('');
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentGender, setEditStudentGender] = useState<'M' | 'F'>('M');
  const [editStudentNotes, setEditStudentNotes] = useState('');

  // Bulk Edit Numbers Modal
  const [isBulkNumbersModalOpen, setIsBulkNumbersModalOpen] = useState(false);
  const [bulkNumbersMap, setBulkNumbersMap] = useState<Record<string, string>>({});
  const [pastedNumbersText, setPastedNumbersText] = useState('');
  const [showPastedNumbersInput, setShowPastedNumbersInput] = useState(false);

  // Search & Filter in Selected Criterion List
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<
    'all' | 'uncalled' | 'called' | 'absent'
  >('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  // If no classes exist yet
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

  const selectedCriterion = criteria.find((c) => c.id === selectedCriterionId) || null;

  // Attendance stats
  const presentCount = activeClass.students.filter((s) => s.attendance === 'present').length;
  const lateCount = activeClass.students.filter((s) => s.attendance === 'late').length;
  const absentCount = activeClass.students.filter((s) => s.attendance === 'absent').length;

  // Single attendance update
  const handleUpdateAttendance = (studentId: string, status: AttendanceStatus) => {
    const student = activeClass.students.find((s) => s.id === studentId);
    if (!student) return;
    const updated: Student = {
      ...student,
      attendance: status,
    };
    onUpdateStudent(activeClass.id, updated);
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    activeClass.students.forEach((s) => {
      onUpdateStudent(activeClass.id, {
        ...s,
        attendance: 'present',
      });
    });
    triggerToast('Tüm öğrenciler "Burada" olarak işaretlendi');
  };

  // Cycle attendance quickly on student row
  const cycleAttendance = (student: Student) => {
    const cycleMap: Record<AttendanceStatus, AttendanceStatus> = {
      present: 'late',
      late: 'absent',
      absent: 'present',
      excused: 'present',
    };
    const nextStatus = cycleMap[student.attendance];
    handleUpdateAttendance(student.id, nextStatus);
    const label =
      nextStatus === 'present'
        ? 'Burada'
        : nextStatus === 'late'
        ? 'Geç'
        : 'Yok';
    triggerToast(`${student.name}: ${label}`);
  };

  // Student editing helpers
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
    triggerToast(`✓ ${updated.name} bilgileri güncellendi`);
  };

  // Bulk edit school numbers
  const handleOpenBulkEditNumbers = () => {
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
    triggerToast('✓ Okul numaraları güncellendi');
  };

  // Toggle student called status in this criterion
  const handleToggleCriterionCalled = (student: Student, criterionId: string) => {
    const isCurrentlyCalled = student.criterionCalled?.[criterionId] ?? false;
    const nextStatus = !isCurrentlyCalled;
    const updated: Student = {
      ...student,
      criterionCalled: {
        ...(student.criterionCalled || {}),
        [criterionId]: nextStatus,
      },
    };
    onUpdateStudent(activeClass.id, updated);
    triggerToast(
      nextStatus
        ? `${student.name}: Bu ölçütte çağrıldı`
        : `${student.name}: Bu ölçütte bekliyor`
    );
  };

  // Statistics for selected criterion
  const eligibleStudents = activeClass.students.filter(
    (s) => s.attendance === 'present' || s.attendance === 'late'
  );

  const critCalledCount = selectedCriterion
    ? eligibleStudents.filter((s) => s.criterionCalled?.[selectedCriterion.id]).length
    : 0;

  const critUncalledCount = selectedCriterion
    ? eligibleStudents.filter((s) => !s.criterionCalled?.[selectedCriterion.id]).length
    : 0;

  const critRoundNumber = selectedCriterion
    ? activeClass.criterionRounds?.[selectedCriterion.id] || 1
    : 1;

  const critProgressPercent =
    eligibleStudents.length > 0
      ? Math.round((critCalledCount / eligibleStudents.length) * 100)
      : 0;

  // Filtered students when a criterion is selected
  const filteredStudentsForCriterion = activeClass.students.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.number.includes(searchQuery);
    if (!matchesSearch) return false;

    if (!selectedCriterion) return true;

    if (filterMode === 'called') {
      return !!st.criterionCalled?.[selectedCriterion.id];
    }
    if (filterMode === 'uncalled') {
      return (
        (st.attendance === 'present' || st.attendance === 'late') &&
        !st.criterionCalled?.[selectedCriterion.id]
      );
    }
    if (filterMode === 'absent') {
      return st.attendance === 'absent';
    }
    return true;
  });

  const sortedStudentsForCriterion = [...filteredStudentsForCriterion].sort((a, b) => {
    const numA = parseInt(a.number, 10);
    const numB = parseInt(b.number, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.number.localeCompare(b.number, 'tr');
  });

  // Calculate class average for a criterion
  const calculateClassCriterionAverage = (criterion: AssessmentCriterion): number => {
    if (activeClass.students.length === 0) return criterion.defaultScore ?? 100;
    const scores = activeClass.students.map((st) =>
      getStudentCriterionScore(st, criterion.id, criterion)
    );
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    return Math.round(sum / scores.length);
  };

  return (
    <div className="space-y-4 pb-24 max-w-full overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg backdrop-blur-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SADE VE ŞIK SINIF BAŞLIĞI (User Request: Sade, sınıf ismi & ders yazılı, yoklama ve sınıf listesi butonları olan temiz ekran) */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs max-w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Sınıf & Ders Başlığı */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm shrink-0"
              style={{ backgroundColor: activeClass.color || '#0d9488' }}
            >
              {activeClass.grade || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {activeClass.name}
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/80">
                  {activeClass.subject || 'Ders'}
                </span>
                {activeClass.room && (
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                    · {activeClass.room}
                  </span>
                )}
                {onOpenEditClass && (
                  <button
                    onClick={() => onOpenEditClass(activeClass)}
                    className="w-7 h-7 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 flex items-center justify-center transition-colors cursor-pointer"
                    title="Sınıfı Düzenle"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDeleteClass && (
                  <button
                    onClick={() => setClassToDelete(activeClass)}
                    className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                    title="Sınıfı Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {activeClass.students.length} Kayıtlı Öğrenci · {criteria.length} Değerlendirme Ölçütü
              </p>
            </div>
          </div>

          {/* Temel Butonlar: Sınıf Listesi, Yoklama, Rastgele Seçim, Rapor & Zamanlayıcı */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sınıf Listesi Butonu (User Request) */}
            <button
              type="button"
              onClick={() => setIsStudentListModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Tüm sınıf listesini görüntüle ve düzenle"
            >
              <Users className="w-4 h-4 text-slate-600" />
              <span>Sınıf Listesi</span>
              <span className="ml-1 px-1.5 py-0.2 bg-white rounded-full text-[10px] font-mono font-bold text-slate-700 border border-slate-200">
                {activeClass.students.length}
              </span>
            </button>

            {/* Yoklama Butonu (User Request) */}
            <button
              type="button"
              onClick={() => setIsAttendanceModalOpen(true)}
              className={`flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs ${
                absentCount > 0
                  ? 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
              title="Yoklama Al veya Güncelle"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Yoklama</span>
              {absentCount > 0 ? (
                <span className="ml-1 px-1.5 py-0.2 bg-rose-200/80 rounded-full text-[10px] font-bold text-rose-900">
                  {absentCount} Yok
                </span>
              ) : (
                <span className="ml-1 px-1.5 py-0.2 bg-emerald-200/80 rounded-full text-[10px] font-bold text-emerald-900">
                  Tam
                </span>
              )}
            </button>

            {/* Rastgele Öğrenci Seç (Genel veya Seçili Ölçütte) */}
            <button
              type="button"
              onClick={() => onOpenRandomPicker(selectedCriterionId || undefined)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Rastgele Seç</span>
            </button>

            {/* Ders Raporu */}
            <button
              type="button"
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl border border-teal-200/80 transition-colors cursor-pointer"
              title="Ders Raporu ve İstatistikler"
            >
              <Award className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden sm:inline">Rapor</span>
            </button>

            {/* 40 Dk Ders Saati */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100/90 rounded-xl text-xs font-mono font-bold text-slate-700">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>
                {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={onToggleTimer}
                className="ml-1 text-[11px] font-sans font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
              >
                {isTimerRunning ? 'Duraklat' : 'Başlat'}
              </button>
            </div>

            {/* Ölçütleri Yönet Butonu */}
            {onOpenManageCriteria && (
              <button
                type="button"
                onClick={onOpenManageCriteria}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Değerlendirme Ölçütlerini Düzenle / Ekle"
              >
                <Sliders className="w-4 h-4 text-slate-600" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* DURUM 1: HİÇBİR ÖLÇÜT SEÇİLİ DEĞİLKEN -> SADECE BELİRLENEN ÖLÇÜTLER GÖRÜNSÜN (User Request) */}
      {!selectedCriterion && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-700" />
                <span>Ders Değerlendirme Ölçütleri</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Değerlendirme yapmak istediğiniz ölçüte tıklayın. Öğrenci listesi ve puanlama araçları açılacaktır.
              </p>
            </div>

            {onOpenManageCriteria && (
              <button
                type="button"
                onClick={onOpenManageCriteria}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl border border-teal-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-teal-700" />
                <span>Yeni Ölçüt Ekle</span>
              </button>
            )}
          </div>

          {criteria.length === 0 ? (
            /* Ölçüt Yoksa Gösterilen Boş Durum (User Request: "eğer ölçüt yoksa ölçüt eklemek için bir buton olsa") */
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border-2 border-dashed border-slate-200 max-w-lg mx-auto space-y-4 my-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shadow-xs">
                <Sliders className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Bu Ders İçin Henüz Ölçüt Belirlenmedi
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                  Kitap kontrolü, ders içi katılım, performans ödevi veya + / - puanlama gibi istediğiniz değerlendirme ölçütlerini ekleyerek hemen başlayın.
                </p>
              </div>
              {onOpenManageCriteria && (
                <button
                  type="button"
                  onClick={onOpenManageCriteria}
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Yeni Ölçüt Ekle</span>
                </button>
              )}
            </div>
          ) : (
            /* Ölçüt Kartları Izgarası (Sade ve Şık Görünüm) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3.5">
              {criteria.map((crit) => {
                const classAvg = calculateClassCriterionAverage(crit);
                const isDefault = crit.isDefault;
                const roundNum = activeClass.criterionRounds?.[crit.id] || 1;
                const calledCount = activeClass.students.filter(
                  (s) => s.criterionCalled?.[crit.id]
                ).length;

                return (
                  <div
                    key={crit.id}
                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-teal-400 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer relative overflow-hidden"
                    onClick={() => {
                      setSelectedCriterionId(crit.id);
                      setFilterMode('all');
                      setSearchQuery('');
                    }}
                  >
                    {/* Top Color Accent */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: crit.color || '#0d9488' }}
                    />

                    <div>
                      {/* Badge Row */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span
                          className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold text-white shadow-2xs"
                          style={{ backgroundColor: crit.color || '#0d9488' }}
                        >
                          {crit.type === 'score'
                            ? "100'lük Puan"
                            : crit.type === 'plus_minus_average'
                            ? '+ / - Ortalama'
                            : crit.type === 'multi_score'
                            ? 'Çoklu Puan Ortalaması'
                            : '± Puanlama'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {isDefault && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span>Varsayılan</span>
                            </span>
                          )}
                          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {roundNum}. Tur
                          </span>
                        </div>
                      </div>

                      {/* Criterion Title */}
                      <h3 className="font-extrabold text-slate-900 text-base sm:text-lg group-hover:text-teal-700 transition-colors flex items-center justify-between">
                        <span>{crit.name}</span>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                      </h3>

                      {crit.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {crit.description}
                        </p>
                      )}
                    </div>

                    {/* Quick Stats & Evaluation Button */}
                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] font-semibold">
                            Sınıf Ort.
                          </span>
                          <span className="font-mono font-extrabold text-slate-800 text-sm">
                            {classAvg} Puan
                          </span>
                        </div>
                        <div className="border-l border-slate-200 pl-3">
                          <span className="text-slate-400 block text-[10px] font-semibold">
                            Bu Turda Çağrılan
                          </span>
                          <span className="font-mono font-bold text-teal-800 text-sm">
                            {calledCount} / {activeClass.students.length}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {/* Quick Random Picker for this criterion */}
                        <button
                          type="button"
                          onClick={() => onOpenRandomPicker(crit.id)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="Bu ölçütte rastgele öğrenci çağır"
                        >
                          <Shuffle className="w-3.5 h-3.5 text-amber-600" />
                          <span className="hidden sm:inline">Rastgele</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCriterionId(crit.id);
                            setFilterMode('all');
                            setSearchQuery('');
                          }}
                          className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                        >
                          <span>Değerlendir</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* DURUM 2: ÖLÇÜT SEÇİLDİKTEN SONRA -> SINIF LİSTESİ VE ÖLÇÜTE ÖZGÜ PUANLAMA ALANI (User Request) */}
      {selectedCriterion && (
        <section className="space-y-3.5 animate-in fade-in duration-150">
          {/* Seçili Ölçüt Başlığı & Geri Dön Butonu */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedCriterionId(null)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Tüm Ölçütler</span>
                </button>

                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: selectedCriterion.color || '#0d9488' }}
                  />
                  <h2 className="font-black text-slate-900 text-base sm:text-lg truncate">
                    {selectedCriterion.name}
                  </h2>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 shrink-0">
                    {selectedCriterion.type === 'score'
                      ? "100'lük Puan"
                      : selectedCriterion.type === 'plus_minus_average'
                      ? '+ / - Ortalama'
                      : selectedCriterion.type === 'multi_score'
                      ? 'Çoklu Puan Ortalaması'
                      : '± Puan'}
                  </span>
                </div>
              </div>

              {/* Bu Ölçütte Rastgele Seç Butonu (User Request) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenRandomPicker(selectedCriterion.id)}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Bu Ölçütte Rastgele Seç</span>
                </button>

                {onOpenManageCriteria && (
                  <button
                    type="button"
                    onClick={onOpenManageCriteria}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs transition-colors cursor-pointer"
                    title="Ölçüt Ayarları"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Adil Tur & İlerleme Çubuğu (Kaldığı Yerden Devam Etsin) */}
            <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-1">
                <span className="font-bold text-slate-800 shrink-0 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                  <span>{critRoundNumber}. Tur:</span>
                </span>
                <div className="flex-1 max-w-xs bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-300"
                    style={{ width: `${critProgressPercent}%` }}
                  />
                </div>
                <span className="font-mono font-bold text-slate-600">
                  {critCalledCount} / {eligibleStudents.length} (%{critProgressPercent})
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {critUncalledCount > 0 ? (
                  <span className="text-[11px] text-amber-800 font-semibold bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-lg">
                    ⏳ {critUncalledCount} öğrenci bekliyor
                  </span>
                ) : (
                  <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Herkes değerlendirildi</span>
                  </span>
                )}

                {onResetRound && (
                  <button
                    type="button"
                    onClick={() => onResetRound(activeClass.id, selectedCriterion.id)}
                    className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    title="Bu ölçütün turunu sıfırla"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Turu Sıfırla</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Arama ve Filtreleme */}
          <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Öğrenci ara (İsim veya Okul No)..."
                className="w-full pl-9 pr-8 py-1.5 bg-slate-100 text-xs sm:text-sm text-slate-900 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 border border-slate-200/80"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-full font-bold transition-all ${
                  filterMode === 'all'
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tümü ({activeClass.students.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('uncalled')}
                className={`px-2.5 py-1 rounded-full font-bold transition-all ${
                  filterMode === 'uncalled'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
              >
                Bekleyen ({critUncalledCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('called')}
                className={`px-2.5 py-1 rounded-full font-bold transition-all ${
                  filterMode === 'called'
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Çağrılan ({critCalledCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('absent')}
                className={`px-2.5 py-1 rounded-full font-bold transition-all ${
                  filterMode === 'absent'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Devamsız ({absentCount})
              </button>
            </div>
          </div>

          {/* ÖĞRENCİ LİSTESİ & ÖLÇÜT İÇİN GEREKENLER (Puan, +-, Çoklu Puan vs.) */}
          {/* User Request: "bu ekranda ölçüt seçildikten sonra sınıf listesi ve ölçüt için gerekenler gelse(puan, +- vs.) ... öğrenci ismine tıklandığında öğrenci bilgileri isttistikleri notları vs görünen bir modal açılsa" */}
          <div className="space-y-2.5">
            {sortedStudentsForCriterion.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/90 text-slate-500 text-xs">
                Aramanıza veya filtreye uygun öğrenci bulunamadı.
              </div>
            ) : (
              sortedStudentsForCriterion.map((student) => {
                const isAbsent = student.attendance === 'absent';
                const isLate = student.attendance === 'late';
                const isCalled = student.criterionCalled?.[selectedCriterion.id];
                const currentScore = getStudentCriterionScore(
                  student,
                  selectedCriterion.id,
                  selectedCriterion
                );
                const counts = getStudentCriterionCounts(
                  student,
                  selectedCriterion.id
                );
                const subScores = getStudentCriterionSubScores(
                  student,
                  selectedCriterion.id
                );

                return (
                  <div
                    key={student.id}
                    className={`bg-white rounded-2xl p-3 sm:p-3.5 border transition-all shadow-2xs max-w-full overflow-hidden ${
                      isAbsent
                        ? 'border-rose-200 bg-rose-50/20 opacity-75'
                        : isLate
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-slate-200/90 hover:border-teal-400'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Sol Bölüm: Okul No, Öğrenci İsmi (Tıklanınca Profil Modalı Açılır), Durum */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Okul Numarası */}
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-mono font-black text-xs flex items-center justify-center shrink-0">
                          #{student.number}
                        </div>

                        {/* Öğrenci İsmi (CLICKABLE! Opens StudentProfileModal) */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setProfileStudent(student)}
                              className="font-extrabold text-sm sm:text-base text-slate-900 hover:text-teal-700 transition-colors text-left truncate cursor-pointer underline decoration-dotted decoration-teal-300 underline-offset-4"
                              title="Öğrencinin tüm istatistiklerini ve notlarını görmek için dokunun"
                            >
                              {student.name}
                            </button>

                            {/* Bu Ölçütte Çağrılma Durumu */}
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleCriterionCalled(
                                  student,
                                  selectedCriterion.id
                                )
                              }
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                isCalled
                                  ? 'bg-teal-100 text-teal-800 border border-teal-200 hover:bg-teal-200'
                                  : 'bg-amber-50 text-amber-900 border border-amber-200/70 hover:bg-amber-100'
                              }`}
                              title={
                                isCalled
                                  ? 'Bu ölçütte çağrıldı. Tıklayarak bekliyor yapabilirsiniz.'
                                  : 'Bu ölçütte henüz çağrılmadı. Tıklayarak çağrıldı yapabilirsiniz.'
                              }
                            >
                              {isCalled ? (
                                <>
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Çağrıldı</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-2.5 h-2.5 text-amber-600" />
                                  <span>Bekliyor</span>
                                </>
                              )}
                            </button>

                            {/* Devamsızlık Butonu (1-Tap Cycle) */}
                            <button
                              type="button"
                              onClick={() => cycleAttendance(student)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-transform active:scale-95 ${
                                student.attendance === 'present'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : student.attendance === 'late'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                              title="Yoklama durumunu değiştirmek için dokunun"
                            >
                              {student.attendance === 'present'
                                ? 'Burada'
                                : student.attendance === 'late'
                                ? 'Geç'
                                : 'Yok'}
                            </button>
                          </div>

                          {student.notes && (
                            <p className="text-[11px] text-amber-800 italic truncate max-w-xs mt-0.5">
                              Not: {student.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Sağ Bölüm: ÖLÇÜT TÜRÜNE GÖRE DEĞERLENDİRME ARAÇLARI */}
                      <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end shrink-0">
                        {/* 1. TÜR: 100'lük Doğrudan Puan (0-100) */}
                        {selectedCriterion.type === 'score' && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-slate-400">
                              Puan:
                            </span>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={currentScore}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val) && onSetStudentCriterionScore) {
                                  onSetStudentCriterionScore(
                                    student.id,
                                    selectedCriterion.id,
                                    Math.max(0, Math.min(100, val))
                                  );
                                }
                              }}
                              className="w-16 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-black text-slate-900 text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />

                            {/* Hızlı Puan Butonları */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  onQuickAdjustStudentScore &&
                                  onQuickAdjustStudentScore(
                                    student.id,
                                    selectedCriterion.id,
                                    -10
                                  )
                                }
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                              >
                                -10
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onQuickAdjustStudentScore &&
                                  onQuickAdjustStudentScore(
                                    student.id,
                                    selectedCriterion.id,
                                    10
                                  )
                                }
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                              >
                                +10
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onSetStudentCriterionScore &&
                                  onSetStudentCriterionScore(
                                    student.id,
                                    selectedCriterion.id,
                                    100
                                  )
                                }
                                className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                                title="100 Tam Puan Ver"
                              >
                                100
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 2. TÜR: + / - Sayısı ve Otomatik Yüzde/Ortalama Puan */}
                        {selectedCriterion.type === 'plus_minus_average' && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Artı Sayacı */}
                            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-xl px-2 py-0.5">
                              <span className="text-xs font-extrabold text-emerald-800">
                                +
                              </span>
                              <span className="font-mono font-black text-xs text-emerald-950 w-5 text-center">
                                {counts.plus}
                              </span>
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onAdjustStudentCounts &&
                                    onAdjustStudentCounts(
                                      student.id,
                                      selectedCriterion.id,
                                      1,
                                      0
                                    )
                                  }
                                  className="w-5 h-5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                                  title="+1 Artır"
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  disabled={counts.plus <= 0}
                                  onClick={() =>
                                    onAdjustStudentCounts &&
                                    onAdjustStudentCounts(
                                      student.id,
                                      selectedCriterion.id,
                                      -1,
                                      0
                                    )
                                  }
                                  className="w-5 h-5 rounded bg-emerald-100 disabled:opacity-40 hover:bg-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                                  title="1 Azalt"
                                >
                                  -
                                </button>
                              </div>
                            </div>

                            {/* Eksi Sayacı */}
                            <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-xl px-2 py-0.5">
                              <span className="text-xs font-extrabold text-rose-800">
                                -
                              </span>
                              <span className="font-mono font-black text-xs text-rose-950 w-5 text-center">
                                {counts.minus}
                              </span>
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onAdjustStudentCounts &&
                                    onAdjustStudentCounts(
                                      student.id,
                                      selectedCriterion.id,
                                      0,
                                      1
                                    )
                                  }
                                  className="w-5 h-5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                                  title="+1 Eksi Ekle"
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  disabled={counts.minus <= 0}
                                  onClick={() =>
                                    onAdjustStudentCounts &&
                                    onAdjustStudentCounts(
                                      student.id,
                                      selectedCriterion.id,
                                      0,
                                      -1
                                    )
                                  }
                                  className="w-5 h-5 rounded bg-rose-100 disabled:opacity-40 hover:bg-rose-200 text-rose-800 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                                  title="1 Azalt"
                                >
                                  -
                                </button>
                              </div>
                            </div>

                            {/* Otomatik Hesaplanan Ortalama Rozeti */}
                            <div className="px-2.5 py-1 bg-slate-900 text-white rounded-xl font-mono font-bold text-xs shadow-2xs">
                              {currentScore} P
                            </div>
                          </div>
                        )}

                        {/* 3. TÜR: Çoklu Puan Bölümleri (P1, P2, P3...) ve Otomatik Ortalama */}
                        {selectedCriterion.type === 'multi_score' && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Var olan alt puanlar */}
                            {(subScores.length > 0 ? subScores : [100]).map(
                              (scoreVal, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-0.5"
                                >
                                  <span className="text-[10px] font-bold text-slate-500 font-mono">
                                    P{idx + 1}:
                                  </span>
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={scoreVal}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10);
                                      if (
                                        !isNaN(val) &&
                                        onUpdateStudentSubScore
                                      ) {
                                        onUpdateStudentSubScore(
                                          student.id,
                                          selectedCriterion.id,
                                          idx,
                                          Math.max(0, Math.min(100, val))
                                        );
                                      }
                                    }}
                                    className="w-12 text-center text-xs font-mono font-bold bg-white border border-slate-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                  />
                                </div>
                              )
                            )}

                            {/* Yeni Puan Bölümü Aç Butonu */}
                            {onUpdateStudentSubScore && (
                              <button
                                type="button"
                                onClick={() => {
                                  const currentLen =
                                    subScores.length > 0
                                      ? subScores.length
                                      : 1;
                                  onUpdateStudentSubScore(
                                    student.id,
                                    selectedCriterion.id,
                                    currentLen,
                                    100
                                  );
                                  triggerToast(
                                    `✓ ${student.name} için P${
                                      currentLen + 1
                                    } puan hanesi eklendi`
                                  );
                                }}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                title="Bu öğrenciye yeni bir puan hanesi (P2, P3...) ekle"
                              >
                                + Puan
                              </button>
                            )}

                            {/* Ortalama Rozeti */}
                            <div className="px-2.5 py-1 bg-indigo-700 text-white rounded-xl font-mono font-bold text-xs shadow-2xs">
                              Ort: {currentScore}
                            </div>
                          </div>
                        )}

                        {/* 4. TÜR: ± Puan (Adımlı Artırma / Azaltma) */}
                        {selectedCriterion.type === 'plus_minus' && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-extrabold text-sm px-2.5 py-1 bg-slate-100 rounded-xl text-slate-900 border border-slate-200">
                              {currentScore} Puan
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onQuickAdjustStudentScore &&
                                onQuickAdjustStudentScore(
                                  student.id,
                                  selectedCriterion.id,
                                  -(selectedCriterion.stepPoints || 10)
                                )
                              }
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                            >
                              -{selectedCriterion.stepPoints || 10}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onQuickAdjustStudentScore &&
                                onQuickAdjustStudentScore(
                                  student.id,
                                  selectedCriterion.id,
                                  selectedCriterion.stepPoints || 10
                                )
                              }
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                            >
                              +{selectedCriterion.stepPoints || 10}
                            </button>
                          </div>
                        )}

                        {/* Öğrenci Detay Modalı Açıcı Küçük Buton */}
                        <button
                          type="button"
                          onClick={() => setProfileStudent(student)}
                          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                          title="Öğrencinin tüm not ve katılım profilini aç"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* 1. ÖĞRENCİ BİLGİ & İSTATİSTİK MODALI (User Request: "öğrenci ismine tıklandığında öğrenci bilgileri istatistikleri notları vs görünen bir modal açılsa") */}
      <StudentProfileModal
        isOpen={!!profileStudent}
        onClose={() => setProfileStudent(null)}
        student={profileStudent}
        classNameTitle={activeClass.name}
        subjectTitle={activeClass.subject}
        criteria={criteria}
        onOpenCriteriaScoring={(st) => {
          if (onOpenStudentCriteria) {
            onOpenStudentCriteria(st);
          }
        }}
      />

      {/* 2. YOKLAMA MODALI (User Request: "yoklama butonu da olsa") */}
      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        classNameTitle={activeClass.name}
        students={activeClass.students}
        onUpdateAttendance={handleUpdateAttendance}
        onMarkAllPresent={handleMarkAllPresent}
      />

      {/* 3. SINIF LİSTESİ MODALI (User Request: "sınıf listesinin tamamı bu ekranda olmasa sınıf listesi için bir sekme veya buton olsa") */}
      <StudentListModal
        isOpen={isStudentListModalOpen}
        onClose={() => setIsStudentListModalOpen(false)}
        classNameTitle={activeClass.name}
        students={activeClass.students}
        criteria={criteria}
        onAddStudent={() => onAddStudent(activeClass.id)}
        onOpenBulkAddStudent={
          onOpenBulkAddStudent
            ? () => onOpenBulkAddStudent(activeClass.id)
            : undefined
        }
        onOpenBulkEditNumbers={handleOpenBulkEditNumbers}
        onEditStudent={handleOpenEditStudentModal}
        onDeleteStudent={
          onDeleteStudent
            ? (studentId) => {
                const target = activeClass.students.find((s) => s.id === studentId);
                if (target) setStudentToDelete(target);
              }
            : undefined
        }
        onSelectStudentProfile={(student) => {
          setProfileStudent(student);
        }}
      />

      {/* 4. TEK ÖĞRENCİ BİLGİLERİNİ DÜZENLEME MODALI */}
      {editingStudentForInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">
                Öğrenci Bilgilerini Düzenle
              </h3>
              <button
                type="button"
                onClick={() => setEditingStudentForInfo(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentInfo} className="space-y-3">
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

      {/* 5. TOPLU OKUL NUMARALARI DÜZENLEME MODALI */}
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

            {/* Excel Yapıştırma Alanı */}
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

            {/* Öğrenci Numara Listesi */}
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

            {/* Alt Butonlar */}
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

      {/* 6. ONAY MODALLARI (Öğrenci / Sınıf Silme) */}
      {studentToDelete && (
        <ConfirmModal
          isOpen={!!studentToDelete}
          title="Öğrenciyi Sil"
          description={`"${studentToDelete.name}" isimli öğrenciyi ve tüm katılım kayıtlarını silmek istediğinize emin misiniz?`}
          confirmLabel="Evet, Sil"
          isDestructive={true}
          onConfirm={() => {
            if (onDeleteStudent && studentToDelete) {
              onDeleteStudent(activeClass.id, studentToDelete.id);
              triggerToast(`"${studentToDelete.name}" sınıftan silindi`);
              setStudentToDelete(null);
            }
          }}
          onClose={() => setStudentToDelete(null)}
        />
      )}

      {classToDelete && (
        <ConfirmModal
          isOpen={!!classToDelete}
          title="Sınıfı Sil"
          description={`"${classToDelete.name}" sınıfını ve kayıtlı tüm öğrencileri silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
          confirmLabel="Evet, Sınıfı Sil"
          isDestructive={true}
          onConfirm={() => {
            if (onDeleteClass && classToDelete) {
              onDeleteClass(classToDelete.id);
              setClassToDelete(null);
            }
          }}
          onClose={() => setClassToDelete(null)}
        />
      )}
    </div>
  );
};
