import React, { useState } from 'react';
import { X, School, Building2 } from 'lucide-react';
import { SchoolInfo } from '../types';

interface SchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolInfo: SchoolInfo;
  onSaveSchool: (info: SchoolInfo) => void;
}

export const SchoolModal: React.FC<SchoolModalProps> = ({
  isOpen,
  onClose,
  schoolInfo,
  onSaveSchool,
}) => {
  const [name, setName] = useState(schoolInfo.name);
  const [fullName, setFullName] = useState(schoolInfo.fullName);
  const [term, setTerm] = useState(schoolInfo.term);
  const [teacherName, setTeacherName] = useState(schoolInfo.teacherName);
  const [teacherTitle, setTeacherTitle] = useState(schoolInfo.teacherTitle);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSchool({
      ...schoolInfo,
      name: name.trim() || 'TTSİS MTAL',
      fullName: fullName.trim() || 'Mesleki ve Teknik Anadolu Lisesi',
      term: term.trim() || '2. Dönem',
      teacherName: teacherName.trim(),
      teacherTitle: teacherTitle.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <School className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">
              Okul & Dönem Bilgilerini Düzenle
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Okul Kısa Adı (Ekranda Görünen) *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: TTSİS MTAL"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Okulun Tam Adı
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Örn: TTSİS Mesleki ve Teknik Anadolu Lisesi"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Dönem / Yıl
            </label>
            <input
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Örn: 2 (2. Dönem - 2025/2026)"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Öğretmen Adı
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Örn: Ahmet Öğretmen"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Branş
              </label>
              <input
                type="text"
                value={teacherTitle}
                onChange={(e) => setTeacherTitle(e.target.value)}
                placeholder="Örn: Bilişim / Matematik"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
