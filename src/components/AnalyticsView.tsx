import React from 'react';
import { Award, Star, AlertTriangle, Users, BookOpen, CheckCircle, TrendingUp } from 'lucide-react';
import { SchoolInfo, ClassGroup } from '../types';

interface AnalyticsViewProps {
  schoolInfo: SchoolInfo;
  classes: ClassGroup[];
  onSelectClassAndGoLive: (classId: string) => void;
  onOpenReportModal: (classGroup: ClassGroup) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  schoolInfo,
  classes,
  onSelectClassAndGoLive,
  onOpenReportModal,
}) => {
  const allStudents = classes.flatMap((c) =>
    c.students.map((s) => ({ ...s, className: c.name, classId: c.id }))
  );

  const totalStudents = allStudents.length;
  const presentCount = allStudents.filter((s) => s.attendance === 'present').length;
  const totalStars = allStudents.reduce((acc, s) => acc + s.points, 0);

  // Top 8 active students
  const leaderboard = [...allStudents]
    .sort((a, b) => b.points - a.points)
    .slice(0, 8);

  // Students with missed homeworks
  const needsAttention = allStudents.filter((s) => s.homeworkMissed > 0);

  return (
    <div className="space-y-6 pb-20">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-teal-600 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded">
              Toplam
            </span>
          </div>
          <span className="text-2xl font-black text-slate-900 font-mono">
            {totalStudents}
          </span>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Kayıtlı Öğrenci ({classes.length} Sınıf)
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
              Katılım Oranı
            </span>
          </div>
          <span className="text-2xl font-black text-emerald-600 font-mono">
            %{totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0}
          </span>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {presentCount} Öğrenci Derste
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <Star className="w-5 h-5 fill-amber-400" />
            <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded">
              Puan
            </span>
          </div>
          <span className="text-2xl font-black text-amber-600 font-mono">
            +{totalStars}
          </span>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Verilen Söz & Katılım Yıldızı
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-rose-500 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">
              Takip
            </span>
          </div>
          <span className="text-2xl font-black text-rose-600 font-mono">
            {needsAttention.length}
          </span>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Eksik Ödev Kaydı
          </p>
        </div>
      </div>

      {/* Class by Class Quick Cards */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
        <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-3">
          SINIF BAZLI KATILIM VE RAPORLAR
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classes.map((cls) => {
            const clsPresent = cls.students.filter((s) => s.attendance === 'present').length;
            const clsStars = cls.students.reduce((acc, s) => acc + s.points, 0);

            return (
              <div
                key={cls.id}
                className="p-3.5 rounded-xl border border-slate-200/80 hover:border-teal-500 bg-slate-50/50 hover:bg-white transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {cls.name}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded">
                      +{clsStars} ⭐
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {cls.subject} · {cls.students.length} Öğrenci
                  </p>
                  <div className="mt-2 text-xs text-slate-600">
                    <span className="text-emerald-700 font-bold">{clsPresent} Mevcut</span>
                    <span className="mx-1.5 text-slate-300">·</span>
                    <span className="text-rose-700 font-semibold">
                      {cls.students.length - clsPresent} Devamsız
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectClassAndGoLive(cls.id)}
                    className="flex-1 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-50 rounded-lg text-center transition-colors"
                  >
                    Canlı Katılımı Aç
                  </button>
                  <button
                    onClick={() => onOpenReportModal(cls)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
                  >
                    Rapor Al
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top Active Students Leaderboard */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 mb-3.5">
          <Award className="w-5 h-5 text-amber-500" />
          <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider">
            EN AKTİF ÖĞRENCİLER LİDERLİK TABLOSU
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {leaderboard.map((student, idx) => (
            <div
              key={student.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                    idx === 0
                      ? 'bg-amber-400 text-amber-950 shadow-xs'
                      : idx === 1
                      ? 'bg-slate-300 text-slate-800'
                      : idx === 2
                      ? 'bg-amber-700/60 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {idx + 1}
                </span>

                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 block truncate">
                    No: {student.number} · {student.name}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {student.className} · {student.homeworkCount} Tam Ödev
                  </span>
                </div>
              </div>

              <span className="font-mono font-extrabold text-xs sm:text-sm text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                +{student.points} ⭐
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
