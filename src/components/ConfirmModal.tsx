import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Evet, Sil',
  cancelLabel = 'Vazgeç',
  isDestructive = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center relative overflow-hidden animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          aria-label="Kapat"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
          <Trash2 className="w-6 h-6 stroke-[2.2]" />
        </div>

        <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">
          {title}
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          {description}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`py-2.5 px-4 text-xs sm:text-sm font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-rose-600/20'
                : 'bg-teal-600 hover:bg-teal-700 active:scale-95'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
