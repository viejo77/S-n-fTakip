import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Printer,
  Award,
  CheckCircle,
  AlertCircle,
  Check,
} from 'lucide-react';
import { SchoolInfo, ClassGroup } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolInfo: SchoolInfo;
  activeClass: ClassGroup;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  schoolInfo,
  activeClass,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const total = activeClass.students.length;
  const present = activeClass.students.filter((s) => s.attendance === 'present').length;
  const late = activeClass.students.filter((s) => s.attendance === 'late').length;
  const absentStudents = activeClass.students.filter((s) => s.attendance === 'absent');
  const totalStars = activeClass.students.reduce((acc, s) => acc + s.points, 0);

  // Top 5 active students
  const topStudents = [...activeClass.students]
    .filter((s) => s.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  const missingHomework = activeClass.students.filter((s) => s.homeworkMissed > 0);

  const todayStr = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Generate plain text report suitable for WhatsApp or e-Okul notes
  const reportText = `📋 *${schoolInfo.name} - DERS KATILIM RAPORU*
📅 Tarih: ${todayStr}
🏫 Sınıf: ${activeClass.name} (${activeClass.subject || 'Ders'})
👨‍🏫 Öğretmen: ${schoolInfo.teacherName}

👥 *YOKLAMA BİLGİSİ:*
• Mevcut: ${present} öğrenci
• Geç Gelen: ${late} öğrenci
• Devamsız: ${absentStudents.length} öğrenci ${
    absentStudents.length > 0
      ? `(${absentStudents.map((s) => `#${s.number} ${s.name}`).join(', ')})`
      : '(Yok)'
  }

⭐ *DERS KATILIMI VE EN AKTİF ÖĞRENCİLER:*
• Toplam Verilen Söz/Puan: +${totalStars}
${
  topStudents.length > 0
    ? topStudents
        .map((s, idx) => ` ${idx + 1}. No: ${s.number} - ${s.name} (+${s.points} ⭐)`)
        .join('\n')
    : ' • Henüz puan kaydı girilmedi.'
}

📝 *ÖDEV KONTROLÜ:*
${
  missingHomework.length > 0
    ? `• Eksik Ödevi Olanlar: ${missingHomework
        .map((s) => `${s.name} (No: ${s.number})`)
        .join(', ')}`
    : '• Tüm ödevler eksiksiz tamamlandı.'
}
---
SınıfTakip+ ile oluşturuldu.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-8 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">
                Ders & Katılım Raporu
              </h2>
              <p className="text-xs text-slate-500">
                {activeClass.name} · {todayStr}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Box */}
        <div className="my-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Attendance Stats Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl text-center">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Mevcut
              </span>
              <span className="text-lg font-extrabold text-emerald-600 font-mono">
                {present} / {total}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl text-center">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Devamsız
              </span>
              <span className="text-lg font-extrabold text-rose-600 font-mono">
                {absentStudents.length}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl text-center">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Toplam Katılım
              </span>
              <span className="text-lg font-extrabold text-amber-600 font-mono">
                +{totalStars} ⭐
              </span>
            </div>
          </div>

          {/* Top Active Students */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Dersin Yıldızları (En Çok Katılanlar)
            </h4>
            {topStudents.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Bu derste henüz söz alan öğrenci kaydedilmedi.
              </p>
            ) : (
              <div className="space-y-1.5">
                {topStudents.map((st, idx) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-teal-50/50 border border-teal-100 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800">
                        No: {st.number} · {st.name}
                      </span>
                    </div>
                    <span className="font-extrabold text-amber-600 font-mono">
                      +{st.points} Puan ⭐
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Devamsızlar Listesi */}
          {absentStudents.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wide mb-1.5">
                Derse Gelmeyenler ({absentStudents.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {absentStudents.map((s) => (
                  <span
                    key={s.id}
                    className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium"
                  >
                    No: {s.number} · {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ödev Durumu */}
          {missingHomework.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1.5">
                Ödevi Eksik Olanlar ({missingHomework.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {missingHomework.map((s) => (
                  <span
                    key={s.id}
                    className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-medium"
                  >
                    No: {s.number} · {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Yazdır</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Rapor Panoya Kopyalandı!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>WhatsApp / Metin Olarak Kopyala</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
