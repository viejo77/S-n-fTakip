import React, { useState } from 'react';
import {
  ShieldAlert,
  ExternalLink,
  Copy,
  Check,
  X,
  Globe,
  Sparkles,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { firebaseConfig } from '../services/firebase';

interface FirebaseDomainGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain?: string;
}

export const FirebaseDomainGuideModal: React.FC<FirebaseDomainGuideModalProps> = ({
  isOpen,
  onClose,
  domain,
}) => {
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentHostname =
    domain || (typeof window !== 'undefined' ? window.location.hostname : '');
  const isVercelDomain = currentHostname.includes('vercel.app');
  const recommendedDomain = isVercelDomain ? 'vercel.app' : currentHostname;
  const projectId = firebaseConfig?.projectId || 'gen-lang-client-0690605550';
  const consoleSettingsUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedDomain(text);
      setTimeout(() => setCopiedDomain(null), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 ring-1 ring-amber-500/20">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Vercel Alan Adı İzni Gerekli
              </h2>
              <p className="text-xs text-slate-600">
                Google ile giriş için 30 saniyelik tek seferlik onay
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* Explanation Banner */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 sm:p-3.5 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[12px] sm:text-xs text-amber-900">
              <strong>Neden bu hatayı aldınız?</strong> Google ve Firebase, güvenliğiniz için projenize bağlı olmayan yabancı sitelerden Google ile girişi engeller. Vercel adresinizi Firebase'e <strong>1 kez</strong> eklemeniz yeterlidir.
            </div>
          </div>

          {/* Current Domain Box with One-Click Copy */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-teal-600" />
                Firebase'e Eklenecek Alan Adı:
              </span>
              <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-bold">
                {isVercelDomain ? 'Vercel Önerilen' : 'Geçerli Adres'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-xl text-slate-800 font-mono text-xs sm:text-sm font-semibold truncate select-all">
                {recommendedDomain}
              </code>
              <button
                type="button"
                onClick={() => handleCopy(recommendedDomain)}
                className="py-2 px-3 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
              >
                {copiedDomain === recommendedDomain ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-white" />
                    <span>Kopyala</span>
                  </>
                )}
              </button>
            </div>

            {currentHostname !== recommendedDomain && (
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                <span>Tam adresiniz: <code className="text-slate-700">{currentHostname}</code></span>
                <button
                  type="button"
                  onClick={() => handleCopy(currentHostname)}
                  className="text-teal-600 hover:underline font-semibold cursor-pointer"
                >
                  Bunu kopyala
                </button>
              </div>
            )}
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-3 pt-1">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">
              3 Kolay Adımda Çözüm
            </h3>

            {/* Step 1 */}
            <div className="flex items-start gap-3 bg-white p-3 rounded-2xl border border-slate-200">
              <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                1
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900">
                  Firebase Console Yetkilendirme Ayarlarını Açın
                </p>
                <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5">
                  Aşağıdaki butona tıklayarak doğrudan projenizin ayar sayfasına gidebilirsiniz.
                </p>
                <a
                  href={consoleSettingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 py-1.5 px-3 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>Firebase Ayarlarını Yeni Sekmede Aç</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 bg-white p-3 rounded-2xl border border-slate-200">
              <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                2
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900">
                  "Yetkilendirilen Alan Adları" Bölümünü Bulun
                </p>
                <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5">
                  Sayfayı aşağı kaydırın, <strong>Yetkilendirilen alan adları (Authorized domains)</strong> tablosunu göreceksiniz. <strong>"Alan Adı Ekle" (Add domain)</strong> butonuna tıklayın.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 bg-white p-3 rounded-2xl border border-slate-200">
              <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                3
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900">
                  Kopyaladığınız Adresi Yapıştırın ve Kaydedin
                </p>
                <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5">
                  Metin kutusuna <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-700 font-semibold">{recommendedDomain}</code> yapıştırın ve <strong>Ekle</strong> butonuna basın.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Alternative Notice */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] sm:text-xs text-emerald-900">
              <strong>İpucu:</strong> <code className="font-bold">vercel.app</code> eklediğinizde Vercel üzerindeki tüm güncellemeleriniz ve adresleriniz tek seferde yetkilendirilmiş olur. Ekledikten sonra buraya dönüp sayfayı yenilemeniz yeterlidir!
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-3 sm:px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Kapat
          </button>

          <a
            href={consoleSettingsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-3 sm:px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Firebase Console'a Git</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
