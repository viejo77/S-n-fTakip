import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Search,
  Check,
} from 'lucide-react';
import { Student, AttendanceStatus } from '../types';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  classNameTitle: string;
  students: Student[];
  onUpdateAttendance: (studentId: string, status: AttendanceStatus) => void;
  onMarkAllPresent: () => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  classNameTitle,
  students,
  onUpdateAttendance,
  onMarkAllPresent,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const presentCount = students.filter((s) => s.attendance === 'present').length;
  const lateCount = students.filter((s) => s.attendance === 'late').length;
  const absentCount = students.filter((s) => s.attendance === 'absent').length;

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.number.includes(search)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2.5 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto overscroll-contain animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-100 my-auto animate-in zoom-in-95 duration-150 relative flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Yoklama Listesi
              </h2>
              <p className="text-xs text-slate-500">
                {classNameTitle} · {students.length} Kayıtlı Öğrenci
              </p>
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

        {/* Quick Stats & Mark All Present */}
        <div className="grid grid-cols-3 gap-2 my-3 shrink-0">
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-center">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Burada</span>
            <span className="text-lg font-black font-mono text-emerald-700">{presentCount}</span>
          </div>

          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/80 text-center">
            <span className="text-[10px] font-bold text-amber-800 uppercase block">Geç</span>
            <span className="text-lg font-black font-mono text-amber-700">{lateCount}</span>
          </div>

          <div className="p-2 rounded-xl bg-rose-50 border border-rose-200/80 text-center">
            <span className="text-[10px] font-bold text-rose-800 uppercase block">Yok</span>
            <span className="text-lg font-black font-mono text-rose-700">{absentCount}</span>
          </div>
        </div>

        {/* Search Bar & Batch Button */}
        <div className="flex items-center gap-2 mb-2 shrink-0">
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

          <button
            type="button"
            onClick={onMarkAllPresent}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors shrink-0 cursor-pointer flex items-center gap-1"
            title="Tüm sınıfı burada olarak işaretle"
          >
            <Check className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hepsini</span> 'Burada' Yap
          </button>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Aramanıza uygun öğrenci bulunamadı.
            </div>
          ) : (
            filtered.map((st) => (
              <div
                key={st.id}
                className="flex items-center justify-between py-2 px-1 hover:bg-slate-50/70 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-8 text-center font-mono font-bold text-xs text-slate-400 shrink-0">
                    #{st.number}
                  </span>
                  <span className="font-bold text-xs text-slate-800 truncate">
                    {st.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onUpdateAttendance(st.id, 'present')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      st.attendance === 'present'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    Burada
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateAttendance(st.id, 'late')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      st.attendance === 'late'
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                    }`}
                  >
                    Geç
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateAttendance(st.id, 'absent')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      st.attendance === 'absent'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                    }`}
                  >
                    Yok
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Tamamla
          </button>
        </div>
      </div>
    </div>
  );
};
