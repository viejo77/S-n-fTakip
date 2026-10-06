import React, { useState, useEffect } from 'react';
import { X, Plus, BookOpen, Layers, Trash2 } from 'lucide-react';
import { ClassGroup } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveClass: (classData: {
    id?: string;
    name: string;
    grade: string;
    section: string;
    subject: string;
    room: string;
    color: string;
  }) => void;
  onDeleteClass?: (classId: string) => void;
  editingClass?: ClassGroup | null;
}

const colorPalette = [
  '#0284c7', // Sky
  '#0d9488', // Teal
  '#2563eb', // Blue
  '#7c3aed', // Violet
  '#ea580c', // Orange
  '#059669', // Emerald
  '#e11d48', // Rose
];

export const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  onSaveClass,
  onDeleteClass,
  editingClass,
}) => {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('9');
  const [section, setSection] = useState('A');
  const [subject, setSubject] = useState('Matematik');
  const [room, setRoom] = useState('Derslik 101');
  const [color, setColor] = useState('#0284c7');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (editingClass) {
      setName(editingClass.name);
      setGrade(editingClass.grade);
      setSection(editingClass.section);
      setSubject(editingClass.subject);
      setRoom(editingClass.room || 'Derslik 101');
      setColor(editingClass.color || '#0284c7');
    } else {
      setName('');
      setGrade('9');
      setSection('A');
      setSubject('Matematik');
      setRoom('Derslik 101');
      setColor('#0284c7');
    }
  }, [editingClass, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveClass({
      id: editingClass ? editingClass.id : undefined,
      name: name.trim(),
      grade,
      section,
      subject: subject.trim(),
      room: room.trim(),
      color,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">
              {editingClass ? 'Sınıfı Düzenle' : 'Yeni Sınıf Ekle'}
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
              Sınıf Adı *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: 11-A, ATP 9-A, AMP 10-B"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Sınıf Düzeyi
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="9">9. Sınıf</option>
                <option value="10">10. Sınıf</option>
                <option value="11">11. Sınıf</option>
                <option value="12">12. Sınıf</option>
                <option value="Hazırlık">Hazırlık</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Şube
              </label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="A, B, C..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Ders Adı
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Matematik, Fizik..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Derslik / Atölye
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Derslik 101, Lab..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Tema Rengi
            </label>
            <div className="flex items-center gap-2">
              {colorPalette.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-115 ring-2 ring-offset-2 ring-slate-700' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-100">
            {editingClass && onDeleteClass ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="py-2 px-3 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sınıfı Sil</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-xs cursor-pointer"
              >
                {editingClass ? 'Güncelle' : 'Sınıfı Kaydet'}
              </button>
            </div>
          </div>
        </form>

        {/* Delete Confirmation inside ClassModal */}
        {editingClass && onDeleteClass && (
          <ConfirmModal
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={() => {
              setShowDeleteConfirm(false);
              onDeleteClass(editingClass.id);
              onClose();
            }}
            title={`"${editingClass.name}" Sınıfını Sil`}
            description={`Bu sınıfa kayıtlı ${editingClass.students.length} öğrenci ve tüm katılım kayıtları kalıcı olarak silinecektir.`}
            confirmLabel="Evet, Sınıfı Sil"
            cancelLabel="Vazgeç"
            isDestructive={true}
          />
        )}
      </div>
    </div>
  );
};
