import React, { useState } from 'react';
import {
  Sliders,
  Search,
  Copy,
  Check,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  BookOpen,
  Settings,
  HelpCircle,
  ChevronRight,
  LayoutGrid,
  Table2,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { AssessmentCriterion, ClassGroup, Student } from '../types';
import {
  getStudentCriterionScore,
  calculateStudentAverageGrade,
} from '../utils/criteria';

interface CriteriaGradebookViewProps {
  activeClass: ClassGroup | null;
  classes: ClassGroup[];
  criteria: AssessmentCriterion[];
  onSelectClass: (classId: string) => void;
  onOpenManageCriteria: () => void;
  onOpenStudentCriteria: (student: Student) => void;
  onQuickAdjustStudentScore: (
    studentId: string,
    criterionId: string,
    delta: number
  ) => void;
  onSetStudentCriterionScore: (
    studentId: string,
    criterionId: string,
    score: number,
    reason?: string
  ) => void;
}

export const CriteriaGradebookView: React.FC<CriteriaGradebookViewProps> = ({
  activeClass,
  classes,
  criteria,
  onSelectClass,
  onOpenManageCriteria,
  onOpenStudentCriteria,
  onQuickAdjustStudentScore,
  onSetStudentCriterionScore,
}) => {
  // Selected criterion: default to first criterion so the user gets a clean, zero-horizontal-scroll single-criterion view!
  const [selectedCriterionId, setSelectedCriterionId] = useState<string>(() => {
    return criteria[0]?.id || 'all';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [sortBy, setSortBy] = useState<'number' | 'name' | 'score' | 'average'>('number');
  const [showExcelTable, setShowExcelTable] = useState(false);
  const [batchActionToast, setBatchActionToast] = useState<string | null>(null);

  if (!activeClass || !activeClass.students || classes.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-xs max-w-lg mx-auto my-8">
        <h3 className="text-lg font-bold text-slate-900">
          Kayıtlı Sınıf Bulunamadı
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Not çizelgesini görüntülemek için lütfen bir sınıf seçin.
        </p>
      </div>
    );
  }

  // Active Criterion reference if a specific one is selected
  const activeCriterion =
    selectedCriterionId !== 'all'
      ? criteria.find((c) => c.id === selectedCriterionId) || criteria[0]
      : null;

  // Filter students
  const filteredStudents = activeClass.students.filter((st) => {
    return (
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.number.includes(searchQuery)
    );
  });

  // Sort students
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortBy === 'number') {
      return parseInt(a.number, 10) - parseInt(b.number, 10);
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name, 'tr');
    }
    if (sortBy === 'score' && activeCriterion) {
      const scoreA = getStudentCriterionScore(a, activeCriterion.id);
      const scoreB = getStudentCriterionScore(b, activeCriterion.id);
      return scoreB - scoreA;
    }
    if (sortBy === 'average') {
      const avgA = calculateStudentAverageGrade(criteria, a).average;
      const avgB = calculateStudentAverageGrade(criteria, b).average;
      return avgB - avgA;
    }
    return 0;
  });

  // Class averages per criterion
  const criteriaAverages: Record<string, number> = {};
  for (const crit of criteria) {
    const totalScore = activeClass.students.reduce(
      (sum, st) => sum + getStudentCriterionScore(st, crit.id),
      0
    );
    criteriaAverages[crit.id] =
      activeClass.students.length > 0
        ? totalScore / activeClass.students.length
        : 100;
  }

  // Overall class average
  const overallClassAverage =
    criteria.length > 0
      ? Object.values(criteriaAverages).reduce((a, b) => a + b, 0) /
        criteria.length
      : 100;

  // Set all students to 100 for the active criterion
  const handleSetAllTo100 = () => {
    if (!activeCriterion) return;
    for (const st of activeClass.students) {
      onSetStudentCriterionScore(
        st.id,
        activeCriterion.id,
        100,
        'Tüm sınıfa 100 tam puan verildi'
      );
    }
    setBatchActionToast(`"${activeCriterion.name}" için tüm öğrencilere 100 tam puan verildi.`);
    setTimeout(() => setBatchActionToast(null), 3000);
  };

  // Copy table to clipboard (Excel / Sheets tab-separated format)
  const handleCopyGradebook = () => {
    const header = [
      'Okul No',
      'Öğrenci Adı Soyadı',
      ...criteria.map((c) => c.name),
      'Genel Ortalama',
    ].join('\t');

    const rows = sortedStudents.map((st) => {
      const critScores = criteria.map((c) =>
        getStudentCriterionScore(st, c.id)
      );
      const avg = calculateStudentAverageGrade(criteria, st).formatted;
      return [st.number, st.name, ...critScores, avg].join('\t');
    });

    const fullText = [header, ...rows].join('\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="space-y-4 pb-20 w-full overflow-hidden">
      {/* Toast */}
      {batchActionToast && (
        <div className="fixed top-18 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{batchActionToast}</span>
        </div>
      )}

      {/* Top Bar with Class Switcher & Criteria Settings */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-xs"
              style={{ backgroundColor: activeClass.color || '#0284c7' }}
            >
              {activeClass.grade || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  {activeClass.name} Not Çizelgesi
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {activeClass.subject || 'Ders'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {criteria.length} Ölçüt · Eşit Ağırlıklı Ortalama · {activeClass.students.length} Öğrenci
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Manage Criteria Button */}
            <button
              onClick={onOpenManageCriteria}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Ölçütleri Yönet ({criteria.length})</span>
            </button>

            {/* Copy Gradebook for Excel / e-Okul */}
            <button
              onClick={handleCopyGradebook}
              className="px-3 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Tüm ölçütleri ve genel ortalamayı Excel veya e-Okul için kopyala"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Kopyalandı!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Excel Kopyala</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sınıf Özeti Banner */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span>
              Her öğrenci 100 tam puanla başlar. Yapılan değerlendirmelere göre eşit ağırlıklı ortalama hesaplanır.
            </span>
          </div>

          <div className="font-bold text-slate-800 shrink-0">
            Sınıf Genel Ortalaması: <span className="font-mono text-teal-700 text-sm font-black">%{overallClassAverage.toFixed(1)}</span>
          </div>
        </div>
      </section>

      {/* CORE FEATURE: ÖLÇÜT TEK TEK SEÇİCİ ŞERİDİ (Sağa Kayma Olmadan Tekil Değerlendirme) */}
      <section className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              Değerlendirilecek Ölçütü Seçin:
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Single/Cards vs Full Matrix */}
            <button
              type="button"
              onClick={() => setShowExcelTable((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                showExcelTable
                  ? 'bg-slate-800 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>{showExcelTable ? 'Ölçüt Görünümüne Dön' : 'Geniş Tablo Görünümü'}</span>
            </button>
          </div>
        </div>

        {/* Horizontal wrapped Pill Selector - NO horizontal scroll, wraps naturally */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {criteria.map((crit) => {
            const isSelected = selectedCriterionId === crit.id;
            const critAvg = criteriaAverages[crit.id]?.toFixed(0) || '100';
            const isScoreBased = crit.type === 'score';

            return (
              <button
                key={crit.id}
                type="button"
                onClick={() => {
                  setSelectedCriterionId(crit.id);
                  setShowExcelTable(false);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                  isSelected
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs ring-2 ring-teal-500/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/90'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: isSelected ? '#ffffff' : crit.color || '#0284c7' }}
                />
                <span className="truncate">{crit.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    isSelected
                      ? 'bg-teal-800 text-teal-100'
                      : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  {isScoreBased ? 'Puan' : `±${crit.stepPoints || 10}`} · %{critAvg}
                </span>
              </button>
            );
          })}

          {/* 'Tüm Ölçütler / Genel Özet' Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedCriterionId('all');
              setShowExcelTable(false);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              selectedCriterionId === 'all'
                ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/90'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Tüm Ölçütler (Genel Özet)</span>
          </button>
        </div>
      </section>

      {/* Search & Sort Controls (Always 100% full width, zero overflow) */}
      <section className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Öğrenci adı veya numarası ara (örn: 104, Ahmet)..."
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

        <div className="flex items-center gap-1.5 shrink-0 text-xs flex-wrap">
          <span className="text-slate-400 font-medium">Sırala:</span>
          <button
            onClick={() => setSortBy('number')}
            className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              sortBy === 'number'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            No
          </button>
          <button
            onClick={() => setSortBy('name')}
            className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              sortBy === 'name'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            İsim
          </button>
          {activeCriterion && (
            <button
              onClick={() => setSortBy('score')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                sortBy === 'score'
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Ölçüt Puanı
            </button>
          )}
          <button
            onClick={() => setSortBy('average')}
            className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              sortBy === 'average'
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Genel Ortalama
          </button>
        </div>
      </section>

      {/* IF EXCEL TABLE VIEW IS TOGGLED ON */}
      {showExcelTable ? (
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Tüm Ölçütler Matris Tablosu</span>
            <span>Tablo sağa kaydırılabilir</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-3 w-20 text-center font-extrabold text-teal-900">Okul No</th>
                  <th className="py-3 px-3 min-w-[140px]">Öğrenci</th>
                  {criteria.map((crit) => (
                    <th key={crit.id} className="py-3 px-3 text-center min-w-[110px] font-bold">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: crit.color || '#0284c7' }}
                        />
                        <span>{crit.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                        ({crit.type === 'score' ? 'Puan' : `±${crit.stepPoints || 10}`})
                      </span>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center min-w-[90px] bg-teal-50/60 text-teal-900 font-extrabold">
                    Genel Ort.
                  </th>
                  <th className="py-3 px-2 text-center w-16">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedStudents.map((st) => {
                  const { formatted, badgeClass, label } = calculateStudentAverageGrade(criteria, st);
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                        {st.number}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 truncate">
                        {st.name}
                      </td>
                      {criteria.map((crit) => {
                        const score = getStudentCriterionScore(st, crit.id);
                        return (
                          <td key={crit.id} className="py-2.5 px-2 text-center">
                            <span
                              className={`font-mono font-bold text-xs ${
                                score < 70
                                  ? 'text-rose-700'
                                  : score < 100
                                  ? 'text-amber-800'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {score}
                            </span>
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3 text-center bg-teal-50/40">
                        <span className="font-mono font-black text-xs text-slate-900">
                          {formatted}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => onOpenStudentCriteria(st)}
                          className="px-2 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-50 rounded border border-teal-200 cursor-pointer"
                        >
                          Düzenle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : activeCriterion ? (
        /* ========================================================================= */
        /* MODE 1: SINGLE CRITERION FOCUS MODE (SIFIR SAĞA KAYMA, 100% FIT, HIZLI)    */
        /* ========================================================================= */
        <section className="space-y-3">
          {/* Active Criterion Detail Header Card */}
          <div className="bg-gradient-to-r from-teal-50 via-sky-50 to-indigo-50 border border-teal-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-3">
              <span
                className="w-4 h-4 rounded-full shrink-0 mt-1 shadow-xs"
                style={{ backgroundColor: activeCriterion.color || '#0284c7' }}
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    {activeCriterion.name}
                  </h2>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                      activeCriterion.type === 'score'
                        ? 'bg-indigo-100 text-indigo-900 border-indigo-200'
                        : 'bg-teal-100 text-teal-900 border-teal-200'
                    }`}
                  >
                    {activeCriterion.type === 'score'
                      ? '🔢 Doğrudan Puan Bazlı (0-100)'
                      : `➕➖ ±${activeCriterion.stepPoints || 10} Puan Adımlı`}
                  </span>
                </div>
                {activeCriterion.description && (
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {activeCriterion.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-teal-100">
              <div className="text-left sm:text-right mr-2">
                <span className="text-[11px] text-slate-500 font-semibold block">Ölçüt Ortalaması</span>
                <span className="text-lg font-mono font-black text-teal-900">
                  %{criteriaAverages[activeCriterion.id]?.toFixed(1) || '100'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleSetAllTo100}
                className="px-3 py-2 bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                title="Tüm sınıfın bu ölçütteki puanını 100 tam puan yapar"
              >
                <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
                <span>Tüm Sınıfı 100 Yap</span>
              </button>
            </div>
          </div>

          {/* Student List in Single Criterion Focus Mode (Zero spillage) */}
          <div className="space-y-2.5">
            {sortedStudents.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400">
                Arama kriterine uygun öğrenci bulunamadı.
              </div>
            ) : (
              sortedStudents.map((st) => {
                const currentScore = getStudentCriterionScore(st, activeCriterion.id);
                const isScoreBased = activeCriterion.type === 'score';
                const step = activeCriterion.stepPoints || 10;
                const { formatted: avgFormatted, badgeClass: avgBadgeClass } =
                  calculateStudentAverageGrade(criteria, st);

                return (
                  <div
                    key={st.id}
                    className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 hover:border-teal-400 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    {/* Left: Student Identity & Overall Average */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="flex items-center gap-1 bg-slate-100 border border-slate-200/90 text-slate-800 px-2 py-0.5 rounded-lg shrink-0 shadow-2xs"
                        title={`Okul Numarası: ${st.number}`}
                      >
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          No
                        </span>
                        <span className="font-mono font-black text-xs text-slate-800">
                          {st.number}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm sm:text-base text-slate-900 truncate block">
                          {st.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${avgBadgeClass}`}>
                            Genel Ort: {avgFormatted}
                          </span>
                          {st.notes && (
                            <span className="text-[11px] text-amber-800 italic truncate max-w-xs">
                              {st.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Dynamic Scoring Controls (Tailored to Criterion Type) */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                      {isScoreBased ? (
                        /* ===================================== */
                        /* PUAN BAZLI DEĞERLENDİRME CONTROLS     */
                        /* ===================================== */
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Direct Numeric Input */}
                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                            <span className="text-[10px] font-bold text-slate-400">Puan:</span>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={currentScore}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val)) {
                                  onSetStudentCriterionScore(
                                    st.id,
                                    activeCriterion.id,
                                    Math.max(0, Math.min(100, val))
                                  );
                                }
                              }}
                              className="w-12 text-center font-mono font-black text-sm text-slate-900 bg-white rounded border border-slate-200 py-0.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                            <span className="text-xs font-bold text-slate-400">/ 100</span>
                          </div>

                          {/* Fast Score Preset Chips */}
                          <div className="flex items-center gap-1">
                            {[100, 90, 85, 75, 50, 0].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() =>
                                  onSetStudentCriterionScore(st.id, activeCriterion.id, val)
                                }
                                className={`px-2 py-1 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                                  currentScore === val
                                    ? 'bg-teal-600 text-white border-teal-600 shadow-2xs scale-105'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>

                          {/* Minor Adjust Buttons (-1 / +1) */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                onQuickAdjustStudentScore(st.id, activeCriterion.id, -1)
                              }
                              className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                              title="1 puan düşür"
                            >
                              -1
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onQuickAdjustStudentScore(st.id, activeCriterion.id, +1)
                              }
                              className="w-7 h-7 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                              title="1 puan ekle"
                            >
                              +1
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ===================================== */
                        /* +/- ADIMLI DEĞERLENDİRME CONTROLS     */
                        /* ===================================== */
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Large Step Decrement Button */}
                          <button
                            type="button"
                            onClick={() =>
                              onQuickAdjustStudentScore(st.id, activeCriterion.id, -step)
                            }
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 active:scale-95 font-mono font-bold text-xs flex items-center gap-1 transition-all cursor-pointer min-h-[36px]"
                            title={`${step} puan düşür`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                            <span>{step}</span>
                          </button>

                          {/* Minor Decrement (-1) if step != 1 */}
                          {step !== 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                onQuickAdjustStudentScore(st.id, activeCriterion.id, -1)
                              }
                              className="px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-mono font-bold text-xs cursor-pointer min-h-[36px]"
                              title="1 puan düşür"
                            >
                              -1
                            </button>
                          )}

                          {/* Current Score Display */}
                          <div className="flex items-center gap-1 px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl min-w-[75px] justify-center min-h-[36px]">
                            <span
                              className={`font-mono font-black text-sm ${
                                currentScore < 70
                                  ? 'text-rose-600'
                                  : currentScore < 100
                                  ? 'text-amber-700'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {currentScore}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">/ 100</span>
                          </div>

                          {/* Minor Increment (+1) if step != 1 */}
                          {step !== 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                onQuickAdjustStudentScore(st.id, activeCriterion.id, +1)
                              }
                              className="px-2 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-mono font-bold text-xs cursor-pointer min-h-[36px]"
                              title="1 puan ekle"
                            >
                              +1
                            </button>
                          )}

                          {/* Large Step Increment Button */}
                          <button
                            type="button"
                            onClick={() =>
                              onQuickAdjustStudentScore(st.id, activeCriterion.id, +step)
                            }
                            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white active:scale-95 font-mono font-bold text-xs flex items-center gap-1 transition-all cursor-pointer min-h-[36px] shadow-2xs"
                            title={`${step} puan ekle`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{step}</span>
                          </button>

                          {/* Quick Reset to 100 */}
                          {currentScore !== 100 && (
                            <button
                              type="button"
                              onClick={() =>
                                onSetStudentCriterionScore(st.id, activeCriterion.id, 100)
                              }
                              className="px-2 py-1.5 text-xs text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                              title="Bu ölçütü 100 tam puana eşitle"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span className="text-[10px] font-bold">100 Yap</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Detail Modal Trigger */}
                      <button
                        type="button"
                        onClick={() => onOpenStudentCriteria(st)}
                        className="px-2.5 py-1.5 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors cursor-pointer"
                        title="Öğrencinin tüm ölçütlerini ve gerekçe geçmişini aç"
                      >
                        Detay
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      ) : (
        /* ========================================================================= */
        /* MODE 2: TÜM ÖLÇÜTLER (KARTLARLA ÖZET - SIFIR SAĞA TAŞMA GARANTİLİ)         */
        /* ========================================================================= */
        <section className="space-y-3">
          <div className="bg-slate-100/70 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>
              Aşağıda her öğrencinin tüm ölçüt notları özetlenmiştir. Herhangi bir ölçüte tıklayarak doğrudan tekil değerlendirme yapabilirsiniz.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedStudents.map((st) => {
              const { formatted: avgFormatted, badgeClass: avgBadgeClass, label } =
                calculateStudentAverageGrade(criteria, st);

              return (
                <div
                  key={st.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 hover:border-teal-400 transition-all"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-800 px-1.5 py-0.5 rounded-md shrink-0"
                        title={`Okul Numarası: ${st.number}`}
                      >
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                          No
                        </span>
                        <span className="font-mono font-black text-xs text-slate-800">
                          {st.number}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm truncate">
                        {st.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-black text-slate-900">
                        Ort: {avgFormatted}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${avgBadgeClass}`}>
                        {label}
                      </span>
                    </div>
                  </div>

                  {/* Criteria Chips */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {criteria.map((crit) => {
                      const score = getStudentCriterionScore(st, crit.id);
                      return (
                        <button
                          key={crit.id}
                          type="button"
                          onClick={() => setSelectedCriterionId(crit.id)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200/80 hover:border-teal-300 text-left transition-all cursor-pointer flex items-center justify-between gap-1 group"
                          title={`"${crit.name}" ölçütünü değerlendir`}
                        >
                          <div className="min-w-0">
                            <span className="block truncate text-[11px] font-semibold text-slate-700 group-hover:text-teal-900">
                              {crit.name}
                            </span>
                          </div>
                          <span
                            className={`font-mono font-black text-xs shrink-0 ${
                              score < 70
                                ? 'text-rose-600'
                                : score < 100
                                ? 'text-amber-800'
                                : 'text-emerald-700'
                            }`}
                          >
                            {score}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => onOpenStudentCriteria(st)}
                      className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>Tüm Notları Düzenle</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
