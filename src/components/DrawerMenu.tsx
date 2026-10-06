import React, { useState } from 'react';
import {
  X,
  School,
  Calendar,
  Users,
  Award,
  Download,
  Upload,
  Settings,
  HelpCircle,
  Sparkles,
  Table2,
  Sliders,
  Smartphone,
  FileSpreadsheet,
  RefreshCw,
  Share2,
  Cloud,
  LogOut,
  LogIn,
  CheckCircle2,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Logo } from './Logo';
import { SchoolInfo, ClassGroup } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  schoolInfo: SchoolInfo;
  classes: ClassGroup[];
  activeClassId: string;
  onSelectClass: (classId: string) => void;
  onOpenSchoolModal: () => void;
  onOpenReportModal: () => void;
  onNavigateTab?: (tab: 'overview' | 'live' | 'gradebook' | 'report') => void;
  onOpenCriteriaManage?: () => void;
  onOpenMobileInstall?: () => void;
  onOpenBulkAddStudent?: () => void;
  onResetData: () => void;
  onSyncToLink?: () => void;
  onImportState?: (data: any) => void;
  currentUser?: User | null;
  onSignInWithGoogle?: () => void;
  onLogOut?: () => void;
  onSaveToCloud?: () => void;
  isCloudSyncing?: boolean;
}

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  isOpen,
  onClose,
  schoolInfo,
  classes,
  activeClassId,
  onSelectClass,
  onOpenSchoolModal,
  onOpenReportModal,
  onNavigateTab,
  onOpenCriteriaManage,
  onOpenMobileInstall,
  onOpenBulkAddStudent,
  onResetData,
  onSyncToLink,
  onImportState,
  currentUser,
  onSignInWithGoogle,
  onLogOut,
  onSaveToCloud,
  isCloudSyncing = false,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.classes && onImportState) {
          onImportState(parsed);
          onClose();
        }
      } catch (err) {
        console.error('Import error', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportData = () => {
    const dataStr =
      localStorage.getItem('siniftakip_state_v1') ||
      localStorage.getItem('siniftakip_state');
    if (!dataStr) return;
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SınıfTakip_Yedek_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 to-sky-50">
          <Logo size="sm" />
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white/80 transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Teacher & School Info Box */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Aktif Okul & Dönem</p>
              <h3 className="font-bold text-slate-900 text-sm mt-0.5">{schoolInfo.name}</h3>
              <p className="text-xs text-slate-600 mt-0.5">{schoolInfo.term}</p>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenSchoolModal();
              }}
              className="px-2 py-1 text-xs font-semibold text-teal-700 bg-teal-100/70 rounded hover:bg-teal-200/80 transition-colors"
            >
              Düzenle
            </button>
          </div>
        </div>

        {/* Google Firebase Cloud Sync Status Card */}
        <div className="p-3.5 border-b border-slate-100 bg-gradient-to-br from-teal-50/70 to-emerald-50/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-teal-900">
              <Cloud className="w-4 h-4 text-teal-600" />
              <span>Firebase Bulut Eşitleme</span>
            </div>
            {currentUser && (
              <span className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>Aktif</span>
              </span>
            )}
          </div>

          {currentUser ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Kullanıcı'}
                    className="w-7 h-7 rounded-full border border-teal-200"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                    {(currentUser.displayName || currentUser.email || 'Ö')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {currentUser.displayName || 'Öğretmen'}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                {onSaveToCloud && (
                  <button
                    onClick={onSaveToCloud}
                    disabled={isCloudSyncing}
                    className="flex-1 py-1.5 px-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                    <span>{isCloudSyncing ? 'Kaydediliyor...' : 'Buluta Kaydet'}</span>
                  </button>
                )}

                {onLogOut && (
                  <button
                    onClick={onLogOut}
                    className="py-1.5 px-2.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    title="Çıkış Yap"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Çıkış</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-600 leading-snug">
                Google ile giriş yapın; sınıflarınız <strong>Vercel, telefon ve bilgisayarınız</strong> arasında anında eşitlensin.
              </p>
              {onSignInWithGoogle && (
                <button
                  onClick={onSignInWithGoogle}
                  className="w-full py-2 px-3 bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Google ile Giriş Yap & Eşitle</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation & Classes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 px-2">
              Sınıflarım ({classes.length})
            </span>
            <div className="space-y-1">
              {classes.map((c) => {
                const isActive = c.id === activeClassId;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectClass(c.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-all ${
                      isActive
                        ? 'bg-teal-600 text-white font-semibold shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: isActive ? '#ffffff' : c.color }}
                      />
                      <span className="truncate">{c.name}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                      }`}
                    >
                      {c.students.length} Öğr.
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 px-2">
              Hızlı Araçlar
            </span>
            <div className="space-y-1">
              {onOpenMobileInstall && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenMobileInstall();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-900 hover:from-teal-100 hover:to-emerald-100 text-sm font-bold transition-all border border-teal-200/80 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-teal-700" />
                  <span>Telefona Aktar & Yükle (QR Kod)</span>
                </button>
              )}

              {onOpenBulkAddStudent && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenBulkAddStudent();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-emerald-800 hover:bg-emerald-50 text-sm font-semibold transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Toplu Öğrenci Ekle (Excel / e-Okul)</span>
                </button>
              )}

              {onNavigateTab && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateTab('gradebook');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-teal-800 hover:bg-teal-50 text-sm font-semibold transition-colors cursor-pointer"
                >
                  <Table2 className="w-4 h-4 text-teal-600" />
                  <span>Not Çizelgesi (Ölçütler)</span>
                </button>
              )}

              {onOpenCriteriaManage && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenCriteriaManage();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 text-sm font-medium transition-colors cursor-pointer"
                >
                  <Sliders className="w-4 h-4 text-teal-600" />
                  <span>Ölçütleri Yönet</span>
                </button>
              )}

              <button
                onClick={() => {
                  onClose();
                  onOpenReportModal();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 text-sm font-medium transition-colors"
              >
                <Award className="w-4 h-4 text-amber-500" />
                <span>Günlük Katılım Raporu</span>
              </button>

              {onSyncToLink && (
                <button
                  onClick={() => {
                    onClose();
                    onSyncToLink();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-teal-50/80 text-teal-800 hover:bg-teal-100 text-sm font-bold transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-teal-600" />
                  <span>Çalışmayı Linkte Güncelle</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 text-sm font-medium transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Yedeği İçe Aktar (JSON)</span>
              </button>

              <button
                onClick={handleExportData}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 text-sm font-medium transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-sky-600" />
                <span>Verileri Yedekle (JSON)</span>
              </button>

              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 text-sm font-medium transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-rose-500" />
                <span>Örnek Verileri Sıfırla</span>
              </button>
            </div>
          </div>

          {/* Quick Tip */}
          <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl">
            <div className="flex items-center gap-1.5 text-amber-800 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Öğretmen İpucu</span>
            </div>
            <p className="text-[11px] text-amber-900/80 leading-relaxed">
              Derste hızlı soru sormak için <strong>"Rastgele Seçici"</strong>yi kullanabilir, öğrencilerin cevaplarını <strong>+1 Söz</strong> butonuyla anında kaydedebilirsiniz.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 text-center text-xs text-slate-400">
          SınıfTakip+ v2.4 · Öğretmen Asistanı
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => {
          onResetData();
          onClose();
        }}
        title="Verileri Sıfırla"
        description="Tüm sınıflar, öğrenciler ve ders programı ilk varsayılan haline döndürülecektir. Devam etmek istiyor musunuz?"
        confirmLabel="Evet, Sıfırla"
        cancelLabel="Vazgeç"
        isDestructive={true}
      />
    </div>
  );
};
