import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Smartphone,
  QrCode,
  Copy,
  Check,
  Share2,
  Download,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Package,
  RefreshCw,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface MobileInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncToLink?: () => Promise<void> | void;
  isSyncing?: boolean;
}

export const MobileInstallModal: React.FC<MobileInstallModalProps> = ({
  isOpen,
  onClose,
  onSyncToLink,
  isSyncing = false,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'qr' | 'android' | 'ios' | 'apk'>(() => {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'qr';
  });

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // App URL for sharing / QR code - Dynamically uses current deployment URL (Vercel, custom domain, etc.)
  const appUrl = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://ais-pre-d6h6duaquawsqjpt5t3pgf-26917758873.europe-west2.run.app';

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(appUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f766e',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation failed', err));
    }
  }, [isOpen, appUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SınıfTakip+ | Akıllı Sınıf & Not Takibi',
          text: 'Öğretmenler için akıllı sınıf yönetimi ve ölçüt bazlı not takip uygulaması',
          url: appUrl,
        });
      } catch (e) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-8 animate-in zoom-in-95 duration-150 relative text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Telefona Aktar & Yükle
              </h2>
              <p className="text-xs text-slate-500">
                Cep telefonunuzda tıpkı mobil uygulama gibi kullanın
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

        {/* Link Sync & Status Box */}
        <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/90 rounded-2xl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isSyncing ? 'animate-spin' : ''}`} />
                <h4 className="font-extrabold text-xs text-emerald-950">
                  Çalışmayı Linke Aktar & Senkronize Et
                </h4>
              </div>
              <p className="text-[11px] text-emerald-800/90 mt-1 leading-relaxed">
                Burada girdiğiniz tüm sınıflar ve öğrenciler doğrudan paylaşılan linke kaydedilir.
              </p>
            </div>
            {onSyncToLink && (
              <button
                onClick={onSyncToLink}
                disabled={isSyncing}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isSyncing ? 'Kaydediliyor...' : 'Linke Aktar'}
              </button>
            )}
          </div>
        </div>

        {/* Quick Native Install Button (if browser supports direct prompt) */}
        {isInstallable && (
          <div className="mt-4 p-3 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl text-white shadow-md flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-xs">Cihazınıza Doğrudan Yükleyin</h4>
              <p className="text-[11px] text-teal-100 mt-0.5">
                Tek tıkla ana ekranınıza uygulama olarak kurun.
              </p>
            </div>
            <button
              onClick={install}
              className="px-3 py-1.5 bg-white text-teal-800 font-extrabold text-xs rounded-xl shadow-xs hover:bg-teal-50 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              Şimdi Yükle
            </button>
          </div>
        )}

        {/* Tab Selection */}
        <div className="mt-4 grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-[11px] font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('qr')}
            className={`py-1.5 px-1 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
              activeTab === 'qr'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">QR Kod</span>
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`py-1.5 px-1 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
              activeTab === 'android'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <span className="truncate">Android</span>
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`py-1.5 px-1 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
              activeTab === 'ios'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <span className="truncate">iPhone</span>
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`py-1.5 px-1 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
              activeTab === 'apk'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
            <span className="truncate">APK Yap</span>
          </button>
        </div>

        {/* TAB 1: QR CODE */}
        {activeTab === 'qr' && (
          <div className="mt-4 space-y-4 text-center">
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl inline-block shadow-inner mx-auto">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Uygulama QR Kodu"
                  className="w-48 h-48 mx-auto rounded-xl shadow-xs"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                  QR Kod Oluşturuluyor...
                </div>
              )}
            </div>

            <div>
              <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                Telefonunuzun kamerasını ekrandaki QR koda tutun.
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Açılan bağlantıya dokunarak uygulamayı telefonunuzda anında açabilirsiniz.
              </p>
            </div>

            {/* Copy Link & Share */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bağlantı Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Bağlantıyı Kopyala</span>
                  </>
                )}
              </button>

              <button
                onClick={handleNativeShare}
                className="py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Paylaş</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: ANDROID GUIDE */}
        {activeTab === 'android' && (
          <div className="mt-4 space-y-3">
            <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/80">
              <h4 className="font-extrabold text-teal-900 text-xs flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Android'de 3 Kolay Adımda Yükleme</span>
              </h4>
              <p className="text-[11px] text-teal-800/90 leading-relaxed">
                Play Store'a gerek olmadan doğrudan ana ekranınıza tam ekran uygulama olarak eklenir.
              </p>
            </div>

            <ol className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-teal-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <span className="font-bold text-slate-900">Chrome ile Açın:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Telefonunuzda Chrome tarayıcısını açıp uygulama adresine girin.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-teal-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <span className="font-bold text-slate-900">Menüye Dokunun:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Sağ üst köşedeki <strong>üç nokta (⋮)</strong> simgesine dokunun.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-teal-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <span className="font-bold text-slate-900">Ana Ekrana Ekle:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    <strong>"Uygulamayı Yükle"</strong> veya <strong>"Ana ekrana ekle"</strong> seçeneğini seçin.
                  </p>
                </div>
              </li>
            </ol>

            <button
              onClick={handleCopyLink}
              className="w-full mt-2 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bağlantı Kopyalandı!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Bağlantıyı Kopyala (WhatsApp/Mesaj ile Gönder)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* TAB 3: IPHONE / IOS GUIDE */}
        {activeTab === 'ios' && (
          <div className="mt-4 space-y-3">
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80">
              <h4 className="font-extrabold text-indigo-900 text-xs flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>iPhone / iPad'de 3 Kolay Adımda Yükleme</span>
              </h4>
              <p className="text-[11px] text-indigo-800/90 leading-relaxed">
                Safari üzerinden App Store gerektirmeden tam ekran, bildirim çubuğu gizlenmiş olarak yüklenir.
              </p>
            </div>

            <ol className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-indigo-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <span className="font-bold text-slate-900">Safari ile Açın:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Uygulama bağlantısını iPhone'unuzun <strong>Safari</strong> tarayıcısında açın.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-indigo-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <span className="font-bold text-slate-900">Paylaş Simgesine Dokunun:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Safari'nin alt menüsündeki <strong>Paylaş (kare içinde yukarı ok)</strong> simgesine dokunun.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-indigo-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <span className="font-bold text-slate-900">Ana Ekrana Ekle:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Aşağı kaydırıp <strong>"Ana Ekrana Ekle"</strong> butonuna ve ardından sağ üstteki <strong>"Ekle"</strong>ye dokunun.
                  </p>
                </div>
              </li>
            </ol>

            <button
              onClick={handleCopyLink}
              className="w-full mt-2 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bağlantı Kopyalandı!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Bağlantıyı Kopyala (WhatsApp/Mesaj ile Gönder)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* TAB 4: APK YAP (ANDROID PACKAGE) */}
        {activeTab === 'apk' && (
          <div className="mt-4 space-y-3">
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200">
              <h4 className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Evet, Kesinlikle APK Yapılabilir!</span>
              </h4>
              <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                Bu uygulama tam uyumlu bir <strong>PWA</strong> olduğu için tek tıkla imzalı <strong>Android APK</strong> ve <strong>Google Play (AAB)</strong> paketine dönüştürülebilir.
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              {/* Method 1: PWABuilder */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span>PWABuilder ile 1 Dakikada APK İndirin</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                    Önerilen
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Microsoft'un resmi aracı <strong>PWABuilder</strong>, bu sitenin manifest ve ikonlarını otomatik okuyup ücretsiz olarak telefonunuza yükleyebileceğiniz hazır bir <strong>.apk</strong> dosyası üretir.
                </p>
                <a
                  href={`https://www.pwabuilder.com/?url=${encodeURIComponent(appUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>PWABuilder'da APK Oluştur</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                </a>
              </div>

              {/* Method 2: WebAPK Note */}
              <div className="p-3 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-1 text-[11px]">
                <span className="font-bold text-teal-950 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>APK'ya İhtiyaç Duymadan "WebAPK" Kurulumu</span>
                </span>
                <p className="text-teal-900/80 leading-relaxed pl-6.5">
                  Android Chrome'da <strong>"Ana Ekrana Ekle / Uygulamayı Yükle"</strong> dediğinizde telefonunuz arka planda otomatik olarak cihaza özel bir <strong>WebAPK</strong> derleyip kurar. Normal APK ile hiçbir farkı olmaz, güncelleme gerekmez ve yer kaplamaz.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Security & Offline Badge */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>PWA & Offline Uyumlu</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
