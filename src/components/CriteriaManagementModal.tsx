import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Check,
  Sliders,
  Sparkles,
  Info,
} from 'lucide-react';
import { AssessmentCriterion } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface CriteriaManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  criteria: AssessmentCriterion[];
  onAddCriterion: (
    name: string,
    description: string,
    color: string,
    type: 'score' | 'plus_minus',
    stepPoints: number
  ) => void;
  onEditCriterion: (
    id: string,
    name: string,
    description: string,
    type: 'score' | 'plus_minus',
    stepPoints: number
  ) => void;
  onDeleteCriterion: (id: string) => void;
  onResetToDefaults: () => void;
}

const colorPalette = [
  '#0284c7', // Sky
  '#0d9488', // Teal
  '#ea580c', // Orange
  '#7c3aed', // Violet
  '#2563eb', // Blue
  '#059669', // Emerald
  '#e11d48', // Rose
];

export const CriteriaManagementModal: React.FC<CriteriaManagementModalProps> = ({
  isOpen,
  onClose,
  criteria,
  onAddCriterion,
  onEditCriterion,
  onDeleteCriterion,
  onResetToDefaults,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState(colorPalette[0]);
  const [newType, setNewType] = useState<'score' | 'plus_minus'>('score');
  const [newStepPoints, setNewStepPoints] = useState<number>(10);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editType, setEditType] = useState<'score' | 'plus_minus'>('score');
  const [editStepPoints, setEditStepPoints] = useState<number>(10);

  const [criterionToDelete, setCriterionToDelete] = useState<AssessmentCriterion | null>(
    null
  );

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddCriterion(
      newName.trim(),
      newDesc.trim(),
      newColor,
      newType,
      newStepPoints
    );
    setNewName('');
    setNewDesc('');
    setIsAdding(false);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    onEditCriterion(id, editName.trim(), editDesc.trim(), editType, editStepPoints);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-8 animate-in zoom-in-95 duration-150 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Ders Değerlendirme Ölçütleri
              </h2>
              <p className="text-xs text-slate-500">
                Ölçütleri özelleştirin, yenilerini ekleyin veya düzenleyin
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

        {/* Info Banner */}
        <div className="my-3.5 p-3 rounded-xl bg-teal-50/70 border border-teal-100 flex items-start gap-2 text-xs text-teal-900 leading-relaxed">
          <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            Her ölçüt için öğrenciler <strong>100 tam puanla başlar</strong>.
            Tüm ölçütler eşit ağırlıktadır ve <strong>aritmetik ortalaması</strong> alınarak genel ders notu oluşturulur.
          </div>
        </div>

        {/* Criteria List */}
        <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
          {criteria.map((crit) => {
            const isEditingThis = editingId === crit.id;

            return (
              <div
                key={crit.id}
                className="p-3 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all flex flex-col gap-2"
              >
                {isEditingThis ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Ölçüt Adı"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Açıklama (isteğe bağlı)"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />

                    {/* Type selector */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Değerlendirme Tipi:
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditType('score')}
                          className={`p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                            editType === 'score'
                              ? 'border-teal-500 bg-teal-50 text-teal-900 font-bold shadow-2xs'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-bold">🔢 Puan Bazlı</div>
                          <div className="text-[10px] text-slate-500">Doğrudan not girişi (0-100)</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditType('plus_minus')}
                          className={`p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                            editType === 'plus_minus'
                              ? 'border-teal-500 bg-teal-50 text-teal-900 font-bold shadow-2xs'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-bold">➕➖ +/- Adımlı</div>
                          <div className="text-[10px] text-slate-500">Her ekside puan düşüşü</div>
                        </button>
                      </div>
                    </div>

                    {editType === 'plus_minus' && (
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Her Bir İşlem İçin Adım Puanı:
                        </label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[1, 5, 10, 15, 20].map((pts) => (
                            <button
                              key={pts}
                              type="button"
                              onClick={() => setEditStepPoints(pts)}
                              className={`px-2.5 py-1 text-xs rounded-md border font-mono font-bold cursor-pointer transition-colors ${
                                editStepPoints === pts
                                  ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              ±{pts} Puan
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded-md"
                      >
                        Vazgeç
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(crit.id)}
                        className="px-3 py-1 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-md"
                      >
                        Kaydet
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                        style={{ backgroundColor: crit.color || '#0284c7' }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 block truncate">
                            {crit.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${
                              crit.type === 'plus_minus'
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : 'bg-teal-50 text-teal-800 border-teal-200'
                            }`}
                          >
                            {crit.type === 'plus_minus'
                              ? `➕➖ ±${crit.stepPoints || 10} Puan Adımlı`
                              : '🔢 Puan Bazlı (0-100)'}
                          </span>
                        </div>
                        {crit.description && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {crit.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(crit.id);
                          setEditName(crit.name);
                          setEditDesc(crit.description || '');
                          setEditType(crit.type || 'score');
                          setEditStepPoints(crit.stepPoints || 10);
                        }}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 flex items-center justify-center transition-colors cursor-pointer"
                        title="Düzenle"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setCriterionToDelete(crit)}
                        disabled={criteria.length <= 1}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          criteria.length <= 1
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                        }`}
                        title={
                          criteria.length <= 1
                            ? 'En az bir ölçüt bulunmalıdır'
                            : 'Ölçütü Sil'
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add New Criterion Form or Button */}
        {isAdding ? (
          <form
            onSubmit={handleCreate}
            className="mt-3.5 p-3.5 rounded-2xl border border-teal-200 bg-teal-50/40 space-y-2.5 animate-in fade-in"
          >
            <h4 className="font-bold text-xs text-teal-900 uppercase tracking-wide">
              Yeni Ölçüt Tanımla
            </h4>
            <div>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Örn: Laboratuvar Uygulaması, Deneme Sınavı, Proje..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                autoFocus
              />
            </div>
            <div>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Açıklama (isteğe bağlı)"
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Type selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Değerlendirme Tipi:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewType('score')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    newType === 'score'
                      ? 'border-teal-500 bg-white ring-2 ring-teal-500/20 text-teal-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>🔢 Puan Bazlı (0-100)</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Öğrenciye doğrudan not verilir (örn: 85, 90, 75). Sınav, proje ve performanslar için idealdir.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setNewType('plus_minus')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    newType === 'plus_minus'
                      ? 'border-teal-500 bg-white ring-2 ring-teal-500/20 text-teal-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>➕➖ +/- Adımlı Puan</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    100 puandan başlar; her ekside puan düşülür. Kitap kontrolü, MEBİ ve ders kuralları için idealdir.
                  </div>
                </button>
              </div>
            </div>

            {/* Step Points selector if plus_minus */}
            {newType === 'plus_minus' && (
              <div className="p-2.5 rounded-xl bg-white border border-teal-200">
                <label className="text-[11px] font-bold text-teal-900 block mb-1.5">
                  Her Eksi / Artı İçin Adım Puanı:
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1, 5, 10, 15, 20].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setNewStepPoints(pts)}
                      className={`flex-1 py-1.5 px-2 text-xs rounded-lg border font-mono font-bold cursor-pointer transition-colors ${
                        newStepPoints === pts
                          ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ±{pts} Puan
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Renk:
              </label>
              <div className="flex items-center gap-2">
                {colorPalette.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`w-5 h-5 rounded-full transition-transform ${
                      newColor === c
                        ? 'scale-120 ring-2 ring-offset-2 ring-slate-700'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-white rounded-lg"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
              >
                Ölçütü Ekle
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-3.5">
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/30 hover:bg-teal-50 text-teal-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Ölçüt Ekle</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onResetToDefaults}
            className="text-slate-400 hover:text-slate-700 hover:underline"
          >
            Varsayılan Ölçütlere Dön
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
          >
            Kapat
          </button>
        </div>

        {/* Delete Confirmation */}
        <ConfirmModal
          isOpen={criterionToDelete !== null}
          onClose={() => setCriterionToDelete(null)}
          onConfirm={() => {
            if (criterionToDelete) {
              onDeleteCriterion(criterionToDelete.id);
              setCriterionToDelete(null);
            }
          }}
          title={`"${criterionToDelete?.name}" Ölçütünü Sil`}
          description="Bu ölçütü sildiğinizde artık genel not ortalaması hesaplamasına dahil edilmeyecektir. Devam etmek istiyor musunuz?"
          confirmLabel="Evet, Ölçütü Sil"
          cancelLabel="Vazgeç"
          isDestructive={true}
        />
      </div>
    </div>
  );
};
