import React, { useState } from 'react';
import {
  X,
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  Trash2,
  Edit3,
  Hash,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { Student, AssessmentCriterion } from '../types';
import { calculateStudentAverageGrade } from '../utils/criteria';

interface StudentListModalProps {
  isOpen: boolean;
  onClose: () => void;
  classNameTitle: string;
  students: Student[];
  criteria: AssessmentCriterion[];
  onAddStudent: () => void;
  onOpenBulkAddStudent?: () => void;
  onOpenBulkEditNumbers?: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
  onSelectStudentProfile: (student: Student) => void;
}

export const StudentListModal: React.FC<StudentListModalProps> = ({
  isOpen,
  onClose,
  classNameTitle,
  students,
  criteria,
  onAddStudent,
  onOpenBulkAddStudent,
  onOpenBulkEditNumbers,
  onEditStudent,
  onDeleteStudent,
  onSelectStudentProfile,
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'number' | 'name' | 'score'>('number');

  if (!isOpen) return null;

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.number.includes(search)
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'number') {
      const numA = parseInt(a.number, 10);
      const numB = parseInt(b.number, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.number.localeCompare(b.number, 'tr');
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name, 'tr');
    }
    if (sortBy === 'score') {
      const avgA = calculateStudentAverageGrade(criteria, a).average;
      const avgB = calculateStudentAverageGrade(criteria, b).average;
      return avgB - avgA;
    }
    return 0;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2.5 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto overscroll-contain animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-100 my-auto animate-in zoom-in-95 duration-150 relative flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Sınıf Listesi ({students.length} Öğrenci)
              </h2>
              <p className="text-xs text-slate-500">{classNameTitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Action Buttons Toolbar */}
        <div className="flex items-center justify-between gap-2 my-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddStudent();
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 text-teal-700" />
              <span>Tek Öğrenci Ekle</span>
            </button>

            {onOpenBulkAddStudent && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBulkAddStudent();
                }}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel'den Toplu Ekle</span>
              </button>
            )}

            {onOpenBulkEditNumbers && students.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBulkEditNumbers();
                }}
                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Hash className="w-3.5 h-3.5 text-teal-600" />
                <span>Numaraları Düzenle</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-2.5 shrink-0">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Öğrenci ara (isim veya no)..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="flex items-center gap-1 text-xs shrink-0">
            <span className="text-[11px] text-slate-400 font-semibold">Sırala:</span>
            <button
              type="button"
              onClick={() => setSortBy('number')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                sortBy === 'number'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => setSortBy('name')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                sortBy === 'name'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              İsim
            </button>
            <button
              type="button"
              onClick={() => setSortBy('score')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                sortBy === 'score'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Not Ort.
            </button>
          </div>
        </div>

        {/* Student Table / Cards List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
          {sorted.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              Aramanıza uygun öğrenci bulunamadı.
            </div>
          ) : (
            sorted.map((st) => {
              const { formatted: avgFormatted, badgeClass: avgBadgeClass } =
                calculateStudentAverageGrade(criteria, st);

              return (
                <div
                  key={st.id}
                  className="flex items-center justify-between py-2 px-1 hover:bg-slate-50/80 rounded-xl transition-colors group"
                >
                  {/* Click to open Student Profile Modal */}
                  <div
                    onClick={() => onSelectStudentProfile(st)}
                    className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1 pr-2"
                  >
                    <span className="w-8 text-center font-mono font-black text-xs text-slate-400 group-hover:text-teal-700 shrink-0">
                      #{st.number}
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-teal-900 truncate block">
                        {st.name}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${avgBadgeClass}`}
                        >
                          Not: {avgFormatted}
                        </span>
                        <span className="text-[10px] text-amber-700 font-mono font-bold">
                          +{st.points} ⭐
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Edit / Delete) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectStudentProfile(st)}
                      className="px-2.5 py-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 cursor-pointer transition-colors"
                      title="Öğrenci detaylarını, istatistiklerini ve notlarını görüntüle"
                    >
                      Detay / Profil
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEditStudent(st);
                      }}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 flex items-center justify-center transition-colors cursor-pointer"
                      title="Öğrenci Bilgilerini Düzenle"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {onDeleteStudent && (
                      <button
                        type="button"
                        onClick={() => onDeleteStudent(st.id)}
                        className="w-7 h-7 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                        title="Öğrenciyi Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between shrink-0 text-xs text-slate-400">
          <span>Öğrenci ismine tıklayarak detay ve istatistik profilini açabilirsiniz.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
