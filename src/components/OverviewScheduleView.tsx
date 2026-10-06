import React, { useState } from 'react';
import {
  Menu as MenuIcon,
  Edit3,
  MoreVertical,
  Plus,
  Play,
  Users,
  Clock,
  Sparkles,
  ChevronRight,
  BookOpen,
  Trash2,
} from 'lucide-react';
import { SchoolInfo, ClassGroup, ScheduleSlot } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { FileSpreadsheet } from 'lucide-react';

interface OverviewScheduleViewProps {
  schoolInfo: SchoolInfo;
  classes: ClassGroup[];
  scheduleSlots: ScheduleSlot[];
  activeClassId: string;
  onSelectClass: (id: string) => void;
  onStartLessonWithClass: (classId: string, subjectName?: string) => void;
  onOpenEditSchool: () => void;
  onOpenAddClass: () => void;
  onOpenEditClass: (classGroup: ClassGroup) => void;
  onDeleteClass: (classId: string) => void;
  onOpenBulkAddStudent?: (classId: string) => void;
}

export const OverviewScheduleView: React.FC<OverviewScheduleViewProps> = ({
  schoolInfo,
  classes,
  scheduleSlots,
  activeClassId,
  onSelectClass,
  onStartLessonWithClass,
  onOpenEditSchool,
  onOpenAddClass,
  onOpenEditClass,
  onDeleteClass,
  onOpenBulkAddStudent,
}) => {
  const [selectedDay, setSelectedDay] = useState<ScheduleSlot['day']>('Perşembe');
  const [activeMenuClassId, setActiveMenuClassId] = useState<string | null>(null);
  const [classToDelete, setClassToDelete] = useState<ClassGroup | null>(null);

  const days: ScheduleSlot['day'][] = [
    'Pazartesi',
    'Salı',
    'Çarşamba',
    'Perşembe',
    'Cuma',
  ];

  const filteredSlots = scheduleSlots.filter((slot) => slot.day === selectedDay);

  return (
    <div className="space-y-6 pb-20">
      {/* 1. OKUL BİLGİLERİ SECTION */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <span>OKUL BİLGİLERİ</span>
          </h2>
          <button
            onClick={onOpenEditSchool}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            Düzenle
          </button>
        </div>

        <div className="space-y-2.5">
          {/* School Name Card - Matching the TeachPad screenshot style */}
          <div
            onClick={onOpenEditSchool}
            className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border-2 border-teal-900/10 hover:border-teal-600 bg-white cursor-pointer group transition-all"
          >
            <div className="flex items-center gap-3">
              {/* Hamburger-like prefix icon from screenshot */}
              <div className="flex flex-col gap-0.5 text-slate-400 group-hover:text-teal-600 transition-colors">
                <span className="w-3.5 h-0.5 bg-current rounded-full" />
                <span className="w-2.5 h-0.5 bg-current rounded-full" />
                <span className="w-3 h-0.5 bg-current rounded-full" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {schoolInfo.name}
                </span>
                <p className="text-xs text-slate-500 font-medium hidden sm:block">
                  {schoolInfo.fullName}
                </p>
              </div>
            </div>

            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-teal-600 bg-teal-50 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Edit3 className="w-4 h-4" />
            </div>
          </div>

          {/* Term Card - Matching the screenshot style */}
          <div
            onClick={onOpenEditSchool}
            className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border-2 border-teal-900/10 hover:border-teal-600 bg-white cursor-pointer group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-0.5 text-slate-400 group-hover:text-teal-600 transition-colors">
                <span className="w-3.5 h-0.5 bg-current rounded-full" />
                <span className="w-2 h-0.5 bg-current rounded-full" />
              </div>
              <span className="text-base sm:text-lg font-bold text-slate-900">
                {schoolInfo.term}
              </span>
            </div>

            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-teal-600 bg-teal-50 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Edit3 className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. SINIF LİSTESİ SECTION */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider">
              SINIF LİSTESİ
            </h2>
            <span className="text-xs text-slate-500">
              ({classes.length} kayıtlı sınıf)
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Tıklayarak katılım takibine başlayın
          </span>
        </div>

        {/* Classes Grid - Matching 3-column / 2-column screenshot layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {classes.map((cls) => {
            const isSelected = cls.id === activeClassId;
            return (
              <div
                key={cls.id}
                className={`relative rounded-xl border p-3 flex items-center justify-between transition-all bg-white hover:shadow-sm ${
                  isSelected
                    ? 'border-teal-600 ring-2 ring-teal-500/20 shadow-xs'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Clickable Area to start attendance */}
                <div
                  onClick={() => onStartLessonWithClass(cls.id, cls.subject)}
                  className="flex-1 cursor-pointer min-w-0 pr-1"
                >
                  <span className="font-bold text-sm sm:text-base text-slate-800 truncate block">
                    {cls.name}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate block">
                    {cls.students.length} Öğrenci · {cls.subject || 'Ders'}
                  </span>
                </div>

                {/* 3-dots Context Menu Button */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuClassId(
                        activeMenuClassId === cls.id ? null : cls.id
                      );
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    aria-label="Sınıf Seçenekleri"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenuClassId === cls.id && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setActiveMenuClassId(null)}
                      />
                      <div className="absolute right-0 top-8 z-40 w-44 bg-white rounded-xl shadow-xl border border-slate-100 p-1 py-1.5 animate-in fade-in zoom-in-95">
                        <button
                          onClick={() => {
                            setActiveMenuClassId(null);
                            onStartLessonWithClass(cls.id, cls.subject);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Katılımı Başlat</span>
                        </button>
                        {onOpenBulkAddStudent && (
                          <button
                            onClick={() => {
                              setActiveMenuClassId(null);
                              onSelectClass(cls.id);
                              onOpenBulkAddStudent(cls.id);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2 cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Toplu Öğrenci Ekle</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setActiveMenuClassId(null);
                            onOpenEditClass(cls);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Sınıfı Düzenle</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuClassId(null);
                            setClassToDelete(cls);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Sınıfı Sil</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Prominent Action Buttons */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={onOpenAddClass}
            className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.99] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <span>Yeni Sınıf Ekle</span>
          </button>

          {onOpenBulkAddStudent && (
            <button
              onClick={() => onOpenBulkAddStudent(activeClassId || (classes[0]?.id ?? ''))}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Toplu Öğrenci Ekle (Excel / e-Okul)</span>
            </button>
          )}
        </div>
      </section>

      {/* 3. DERS PROGRAMI SECTION */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider">
              {selectedDay.toUpperCase()} DERS PROGRAMI
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              ({filteredSlots.length} Ders Saati)
            </span>
          </div>

          {/* Day Selector Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedDay === day
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Timetable Cards Row / Grid - Exactly matching TeachPad's blue pill top & white body */}
        {filteredSlots.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
            {selectedDay} günü için tanımlı ders bulunamadı.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredSlots.map((slot) => {
              const matchedClass = classes.find((c) => c.id === slot.classId);
              return (
                <div
                  key={slot.id}
                  onClick={() => onStartLessonWithClass(slot.classId, slot.subject)}
                  className="rounded-xl overflow-hidden border border-slate-200/90 shadow-xs bg-white hover:shadow-md hover:border-teal-500 transition-all cursor-pointer group flex flex-col"
                >
                  {/* Blue Time Pill Banner from screenshot */}
                  <div className="bg-[#026aa7] text-white py-1.5 px-2 text-center text-xs font-bold tracking-tight">
                    {slot.timeSlot}
                  </div>

                  {/* Body Content from screenshot */}
                  <div className="p-3 text-center flex-1 flex flex-col justify-center">
                    <span className="font-extrabold text-slate-800 text-sm sm:text-base group-hover:text-teal-700 transition-colors">
                      {slot.className}
                    </span>
                    <span className="text-xs text-slate-500 mt-0.5">
                      {slot.subject}
                    </span>

                    {/* Quick Launch Tag on hover / mobile */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-center gap-1 text-[11px] font-semibold text-teal-700 opacity-90 group-hover:opacity-100">
                      <Play className="w-3 h-3 fill-current" />
                      <span>Katılımı Başlat</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Class Deletion Confirmation Dialog */}
      <ConfirmModal
        isOpen={classToDelete !== null}
        onClose={() => setClassToDelete(null)}
        onConfirm={() => {
          if (classToDelete) {
            onDeleteClass(classToDelete.id);
            setClassToDelete(null);
          }
        }}
        title={`"${classToDelete?.name}" Sınıfını Sil`}
        description={`Bu sınıfa kayıtlı ${classToDelete?.students.length || 0} öğrenci ve tüm katılım/ödev geçmişi kalıcı olarak silinecektir. Silmek istediğinize emin misiniz?`}
        confirmLabel="Evet, Sınıfı Sil"
        cancelLabel="Vazgeç"
        isDestructive={true}
      />
    </div>
  );
};
