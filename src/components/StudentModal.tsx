import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UserPlus,
  Users,
  FileSpreadsheet,
  Upload,
  Sparkles,
  Trash2,
  Check,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  ArrowUpDown,
  HelpCircle,
  FileText,
  Download,
  Copy,
} from 'lucide-react';
import {
  parseRawStudentText,
  parseExcelOrCsvFile,
  ParsedStudentItem,
  toTurkishTitleCase,
} from '../utils/studentParser';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classNameTitle: string;
  initialTab?: 'single' | 'bulk';
  onAddStudent: (studentData: { number: string; name: string; gender: 'M' | 'F' }) => void;
  onAddMultipleStudents?: (
    studentsData: Array<{ number: string; name: string; gender?: 'M' | 'F' }>,
    mode?: 'replace' | 'append'
  ) => void;
  existingCount?: number;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  classNameTitle,
  initialTab = 'single',
  onAddStudent,
  onAddMultipleStudents,
  existingCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>(initialTab);

  // Single Student State
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');

  // Bulk Student State
  const [rawText, setRawText] = useState('');
  const [parsedList, setParsedList] = useState<ParsedStudentItem[]>([]);
  const [formatTitleCase, setFormatTitleCase] = useState(true);
  const [startingNumber, setStartingNumber] = useState<number>(existingCount + 1);
  const [importMode, setImportMode] = useState<'replace' | 'append'>(
    existingCount > 0 ? 'replace' : 'append'
  );
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isPastingNumbers, setIsPastingNumbers] = useState(false);
  const [numbersToDistribute, setNumbersToDistribute] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync tab on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setNumber('');
      setName('');
      setGender('M');
      setRawText('');
      setParsedList([]);
      setFileError(null);
      setSuccessMessage(null);
      setShowHelp(false);
      setStartingNumber(existingCount + 1);
      setImportMode(existingCount > 0 ? 'replace' : 'append');
    }
  }, [isOpen, initialTab, existingCount]);

  if (!isOpen) return null;

  // Handle single submit
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim() || !name.trim()) return;

    onAddStudent({
      number: number.trim(),
      name: formatTitleCase ? toTurkishTitleCase(name.trim()) : name.trim(),
      gender,
    });
    setNumber('');
    setName('');
    onClose();
  };

  // Re-parse when raw text or formatTitleCase changes
  const handleTextChange = (text: string) => {
    setRawText(text);
    setFileError(null);
    setSuccessMessage(null);
    if (!text.trim()) {
      setParsedList([]);
      return;
    }
    const items = parseRawStudentText(text, startingNumber, formatTitleCase);
    setParsedList(items);
  };

  // Handle Excel / CSV File upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setFileError(null);
    setSuccessMessage(null);

    try {
      const items = await parseExcelOrCsvFile(file, formatTitleCase);
      if (items.length === 0) {
        setFileError('Dosyada öğrenci bilgisi bulunamadı. Lütfen Excel veya CSV formatını kontrol edin.');
      } else {
        setParsedList(items);
        const textRep = items
          .map((i) => `${i.number}\t${i.name}\t${i.gender === 'F' ? 'Kız' : 'Erkek'}`)
          .join('\n');
        setRawText(textRep);
        setSuccessMessage(`✓ Excel'den ${items.length} öğrenci başarıyla okundu.`);
      }
    } catch (err) {
      console.error(err);
      setFileError('Dosya okunurken bir hata oluştu. Lütfen geçerli bir .xlsx veya .csv dosyası seçin.');
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Load sample e-Okul student list
  const handleLoadEOkulSample = () => {
    const sample = `Sıra No\tOkul No\tAdı Soyadı\tCinsiyeti
1\t104\tAHMET YILMAZ\tErkek
2\t112\tZEYNEP AYŞE KAYA\tKız
3\t128\tBURAK DEMİRTAŞ\tErkek
4\t135\tELİF SENA ÇELİK\tKız
5\t142\tMUSTAFA CAN ÖZTÜRK\tErkek
6\t150\tFATMA GÜLŞAH YILDIZ\tKız
7\t164\tEMRE ARDA ŞAHİN\tErkek
8\t172\tMERVE NUR AYDIN\tKız`;
    handleTextChange(sample);
    setSuccessMessage('✓ Örnek e-Okul listesi yüklendi. Şimdi inceleyip onaylayabilirsiniz.');
  };

  // Download example CSV template for Excel
  const handleDownloadTemplate = () => {
    const csvContent =
      '\uFEFF' +
      [
        'Okul No;Adı Soyadı;Cinsiyet',
        '104;Ahmet Yılmaz;Erkek',
        '112;Zeynep Kaya;Kız',
        '128;Burak Demir;Erkek',
        '135;Elif Çelik;Kız',
        '142;Kerem Şahin;Erkek',
        '156;Fatma Gül;Kız',
        '164;Murat Yıldız;Erkek',
        '172;Ayşe Öztürk;Kız',
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ornek_ogrenci_sablonu.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSuccessMessage('✓ Örnek Excel şablonu (ornek_ogrenci_sablonu.csv) indirildi. Dosyayı Excel\'de açıp listenizi doldurabilirsiniz.');
  };

  // Copy template text to clipboard
  const handleCopyTemplate = () => {
    const tpl = [
      'Okul No\tAdı Soyadı\tCinsiyet',
      '104\tAhmet Yılmaz\tErkek',
      '112\tZeynep Kaya\tKız',
      '128\tBurak Demir\tErkek',
      '135\tElif Çelik\tKız',
      '142\tKerem Şahin\tErkek',
    ].join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(tpl).then(() => {
        setSuccessMessage('✓ Örnek şablon panoya kopyalandı! Excel veya metin belgesine yapıştırıp kendi listenizi oluşturabilirsiniz.');
      });
    }
  };

  // Fill textbox with clean template data
  const handleFillTemplate = () => {
    const sample = [
      '104\tAhmet Yılmaz\tErkek',
      '112\tZeynep Kaya\tKız',
      '128\tBurak Demir\tErkek',
      '135\tElif Çelik\tKız',
      '142\tKerem Şahin\tErkek',
      '156\tFatma Gül\tKız',
    ].join('\n');
    handleTextChange(sample);
    setSuccessMessage('✓ Örnek şablon metin kutusuna yerleştirildi. İsim ve numaraları kendinize göre değiştirebilirsiniz.');
  };

  // Sort parsed students by school number
  const handleSortByNumber = () => {
    setParsedList((prev) =>
      [...prev].sort((a, b) => {
        const numA = parseInt(a.number, 10);
        const numB = parseInt(b.number, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.number.localeCompare(b.number, 'tr');
      })
    );
  };

  // Auto-number all items consecutively from 1
  const handleAutoNumberAll = (start = 1) => {
    setParsedList((prev) =>
      prev.map((item, idx) => ({
        ...item,
        number: String(start + idx),
      }))
    );
  };

  // Paste school numbers directly from Excel into the parsed list
  const handleApplyNumbersToParsedList = () => {
    const nums = numbersToDistribute
      .split(/[\r\n\t,;]+/)
      .map((n) => n.trim())
      .filter((n) => /^\d+$/.test(n));

    if (nums.length === 0) {
      setFileError('Yapıştırılan metinde geçerli okul numarası bulunamadı.');
      return;
    }

    setParsedList((prev) =>
      prev.map((item, idx) => ({
        ...item,
        number: idx < nums.length ? nums[idx] : item.number,
      }))
    );
    setNumbersToDistribute('');
    setIsPastingNumbers(false);
    setSuccessMessage(`✓ ${Math.min(nums.length, parsedList.length)} öğrenciye okul numaraları aktarıldı.`);
  };

  // Update a single parsed student item in table
  const handleUpdateParsedItem = (
    id: string,
    field: 'number' | 'name' | 'gender',
    val: string
  ) => {
    setParsedList((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          [field]: val,
        };
      })
    );
  };

  // Remove a parsed student item
  const handleRemoveParsedItem = (id: string) => {
    setParsedList((prev) => prev.filter((item) => item.id !== id));
  };

  // Submit bulk items
  const handleBulkSubmit = () => {
    if (parsedList.length === 0) return;

    if (onAddMultipleStudents) {
      onAddMultipleStudents(
        parsedList.map((i) => ({
          number: i.number,
          name: i.name,
          gender: i.gender,
        })),
        importMode
      );
    } else {
      // Fallback
      parsedList.forEach((i) => {
        onAddStudent({
          number: i.number,
          name: i.name,
          gender: i.gender,
        });
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        className={`bg-white rounded-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-auto animate-in zoom-in-95 duration-150 relative transition-all ${
          activeTab === 'bulk' ? 'max-w-2xl' : 'max-w-md'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center shadow-xs">
              {activeTab === 'bulk' ? (
                <Users className="w-5 h-5" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Öğrenci Ekle
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {classNameTitle} {existingCount > 0 && `· (Mevcut: ${existingCount} Öğrenci)`}
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

        {/* Tab Selection */}
        <div className="mt-4 flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'single'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tek Öğrenci Ekle</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bulk')}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'bulk'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Toplu Ekle (Excel / e-Okul)</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
              Hızlı
            </span>
          </button>
        </div>

        {/* ================= TAB 1: TEK ÖĞRENCİ ================= */}
        {activeTab === 'single' && (
          <form onSubmit={handleSingleSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Okul Numarası *
              </label>
              <input
                type="text"
                required
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Örn: 104, 218..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Adı Soyadı *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Ahmet Yılmaz"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Cinsiyet
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('M')}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                    gender === 'M'
                      ? 'border-sky-600 bg-sky-50 text-sky-800 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  👦 Erkek
                </button>
                <button
                  type="button"
                  onClick={() => setGender('F')}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                    gender === 'F'
                      ? 'border-rose-500 bg-rose-50 text-rose-800 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  👧 Kız
                </button>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                Öğrenciyi Kaydet
              </button>
            </div>
          </form>
        )}

        {/* ================= TAB 2: TOPLU ÖĞRENCİ EKLE ================= */}
        {activeTab === 'bulk' && (
          <div className="mt-4 space-y-3.5">
            {/* Action Bar & Quick Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-teal-50/70 border border-teal-200/80 rounded-2xl">
              <div>
                <h4 className="font-extrabold text-teal-950 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>e-Okul veya Excel'den Doğrudan Kopyalayıp Yapıştırın</span>
                </h4>
                <p className="text-[11px] text-teal-900/80 mt-0.5">
                  Tablo sütunları (No, İsim, Cinsiyet) akıllıca otomatik ayrıştırılır.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-upload-input"
                />
                <label
                  htmlFor="excel-upload-input"
                  className="px-2.5 py-1.5 bg-white hover:bg-teal-100 text-teal-800 border border-teal-300 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-teal-600" />
                  <span>Excel / CSV Yükle</span>
                </label>

                <button
                  type="button"
                  onClick={handleLoadEOkulSample}
                  className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-2xs"
                  title="Örnek e-Okul listesi yükleyerek deneyin"
                >
                  Örnek e-Okul Doldur
                </button>

                <button
                  type="button"
                  onClick={() => setShowHelp((prev) => !prev)}
                  className="p-1.5 bg-white hover:bg-slate-100 text-slate-500 rounded-xl border border-slate-200 cursor-pointer"
                  title="Nasıl kopyalanır?"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Help Guide Accordion */}
            {showHelp && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 text-slate-700 animate-in fade-in">
                <p className="font-bold text-slate-900 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span>e-Okul'dan Liste Kopyalama Adımları:</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                  <li><strong>e-Okul</strong>'a giriş yapın ve <em>Şube Öğrenci Listesi</em> veya <em>Hızlı Not Girişi</em> ekranını açın.</li>
                  <li>Öğrenci tablosundaki satırları mouse ile seçip <strong>Ctrl+C</strong> (Kopyala) yapın.</li>
                  <li>Aşağıdaki kutucuğa gelip <strong>Ctrl+V</strong> (Yapıştır) yapın. Sistem isimleri, numaraları ve cinsiyetleri anında algılayacaktır.</li>
                </ol>
              </div>
            )}

            {/* Error or Success Banner */}
            {fileError && (
              <div className="p-2.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{fileError}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Visual Example Template (Örnek Şablon) */}
            <div className="bg-gradient-to-r from-teal-50/70 via-slate-50 to-teal-50/50 border border-teal-200/90 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    📋
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <span>Örnek Yükleme Şablonu</span>
                      <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded-md">
                        Önerilen Format
                      </span>
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Listenizi bu sıraya göre hazırlayıp yapıştırabilir veya hazır Excel dosyasını indirebilirsiniz:
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-2.5 py-1.5 bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    title="Excel'de açabileceğiniz örnek .csv dosyasını indirir"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-600" />
                    <span>Excel Şablonu İndir (.csv)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyTemplate}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Excel'e yapıştırmak üzere şablonu panoya kopyalar"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Şablonu Kopyala</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFillTemplate}
                    className="px-2.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                    title="Örnek verileri hemen aşağıdaki metin kutusuna doldurur"
                  >
                    <span>Kutuya Doldur</span>
                  </button>
                </div>
              </div>

              {/* Visual Table of the Template */}
              <div className="border border-slate-200/90 rounded-xl overflow-hidden bg-white text-xs shadow-2xs">
                <div className="grid grid-cols-3 bg-slate-100/90 font-bold text-slate-700 py-1.5 px-3 border-b border-slate-200 text-[11px]">
                  <span className="text-teal-900">1. Sütun: Okul No</span>
                  <span>2. Sütun: Adı Soyadı</span>
                  <span className="text-slate-500">3. Sütun: Cinsiyet (Opsiyonel)</span>
                </div>
                <div className="divide-y divide-slate-100 font-mono text-[11px]">
                  <div className="grid grid-cols-3 py-1.5 px-3 bg-white hover:bg-slate-50/50">
                    <span className="font-bold text-teal-700">104</span>
                    <span className="font-sans font-semibold text-slate-800">Ahmet Yılmaz</span>
                    <span className="font-sans text-slate-500">Erkek</span>
                  </div>
                  <div className="grid grid-cols-3 py-1.5 px-3 bg-slate-50/40 hover:bg-slate-50">
                    <span className="font-bold text-teal-700">112</span>
                    <span className="font-sans font-semibold text-slate-800">Zeynep Kaya</span>
                    <span className="font-sans text-slate-500">Kız</span>
                  </div>
                  <div className="grid grid-cols-3 py-1.5 px-3 bg-white hover:bg-slate-50/50">
                    <span className="font-bold text-teal-700">128</span>
                    <span className="font-sans font-semibold text-slate-800">Burak Demir</span>
                    <span className="font-sans text-slate-500">Erkek</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-white/70 p-2 rounded-xl border border-teal-100">
                <span className="font-bold text-teal-700 shrink-0">💡 Pratik Kullanım:</span>
                <span>
                  Excel'de bu 3 sütunu oluşturup hücreleri mouse ile seçin, <strong>Ctrl+C</strong> ile kopyalayıp aşağıdaki kutucuğa <strong>Ctrl+V</strong> ile yapıştırın. Sistem tüm öğrencileri anında tanır.
                </span>
              </div>
            </div>

            {/* Textarea Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Öğrenci Listesini Buraya Yapıştırın:
                </label>
                <span className="text-[11px] text-slate-400">
                  Her satıra bir öğrenci
                </span>
              </div>
              <textarea
                rows={4}
                value={rawText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Örnek e-Okul veya Excel kopyası yapıştırın:&#10;104	Ahmet Yılmaz	Erkek&#10;112	Zeynep Kaya	Kız&#10;veya sadece isim listesi yapıştırın..."
                className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono placeholder:font-sans placeholder:text-slate-400 bg-slate-50/50"
              />
            </div>

            {/* Import Mode Selection (Replace vs Append) */}
            {existingCount > 0 && (
              <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-1.5">
                <span className="font-bold text-amber-900 block">
                  Aktarım Şekli ({classNameTitle} sınıfında {existingCount} mevcut öğrenci var):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      importMode === 'replace'
                        ? 'border-amber-500 bg-amber-100/60 font-bold text-amber-950'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>Mevcut öğrencileri temizle, yeni listeyi yükle (Önerilen)</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      importMode === 'append'
                        ? 'border-amber-500 bg-amber-100/60 font-bold text-amber-950'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>Mevcut listenin sonuna ekle</span>
                  </label>
                </div>
              </div>
            )}

            {/* Helper Options & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
              <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={formatTitleCase}
                  onChange={(e) => {
                    setFormatTitleCase(e.target.checked);
                    if (rawText) {
                      const items = parseRawStudentText(
                        rawText,
                        startingNumber,
                        e.target.checked
                      );
                      setParsedList(items);
                    }
                  }}
                  className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <span>Büyük Harfleri Düzelt (AHMET YILMAZ ➔ Ahmet Yılmaz)</span>
              </label>

              {parsedList.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSortByNumber}
                    className="text-teal-700 hover:text-teal-900 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    title="Okul numaralarına göre küçükten büyüğe sırala"
                  >
                    <ArrowUpDown className="w-3 h-3" />
                    <span>Numaraya Göre Sırala</span>
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setIsPastingNumbers(!isPastingNumbers)}
                    className="text-teal-700 hover:text-teal-900 font-bold text-xs underline cursor-pointer"
                    title="Excel'den kopyalanan okul numaralarını sırayla öğrencilere aktar"
                  >
                    {isPastingNumbers ? 'Numara Panelini Kapat' : 'Excel\'den Okul No Yapıştır'}
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleAutoNumberAll(1)}
                    className="text-slate-500 hover:text-slate-700 text-xs underline cursor-pointer"
                    title="Okul numarası yoksa 1, 2, 3... şeklinde sıra numarası atar"
                  >
                    1'den Numaralandır
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setRawText('');
                      setParsedList([]);
                      setSuccessMessage(null);
                    }}
                    className="text-rose-600 hover:text-rose-800 font-bold text-xs cursor-pointer"
                  >
                    Temizle
                  </button>
                </div>
              )}
            </div>

            {/* Quick Excel Number Paste Panel */}
            {isPastingNumbers && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl space-y-2 animate-in fade-in text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-900">
                    Excel'den Okul Numaraları Sütununu Yapıştırın:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPastingNumbers(false)}
                    className="text-teal-600 hover:text-teal-800 font-bold"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-[11px] text-teal-700">
                  Excel'deki okul numaralarını alt alta kopyalayıp buraya yapıştırın. Listedeki öğrencilere 1. sıradan itibaren dağıtılır.
                </p>
                <textarea
                  rows={3}
                  value={numbersToDistribute}
                  onChange={(e) => setNumbersToDistribute(e.target.value)}
                  placeholder="104&#10;215&#10;340..."
                  className="w-full p-2 font-mono bg-white border border-teal-300 rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyNumbersToParsedList}
                  disabled={!numbersToDistribute.trim()}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white rounded-lg font-bold text-xs cursor-pointer transition-all"
                >
                  Numaraları Öğrencilere Ata
                </button>
              </div>
            )}

            {/* Live Preview Table - Always Visible */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-slate-900">
                    Önizleme & Onay Tablosu
                  </span>
                  {parsedList.length > 0 ? (
                    <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{parsedList.length} Öğrenci Algılandı</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      Liste Bekleniyor
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">
                  {parsedList.length > 0
                    ? 'Kutulara tıklayarak doğrudan düzenleyebilirsiniz'
                    : 'Ayrıştırılan öğrenciler burada görünecektir'}
                </span>
              </div>

              {parsedList.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/60 space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    Öğrenci Önizleme Tablosu
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Yukarıdaki kutucuğa e-Okul veya Excel listenizi yapıştırın. İsimler, numaralar ve cinsiyetler burada anında tablo haline gelecektir.
                  </p>
                  <button
                    type="button"
                    onClick={handleLoadEOkulSample}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-200" />
                    <span>Örnek e-Okul Listesini Yükle & Önizle</span>
                  </button>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-52 overflow-y-auto shadow-inner bg-slate-50/40">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th className="py-2 px-3 w-12 text-center text-slate-400 font-normal">Sıra</th>
                        <th className="py-2 px-3 w-28 text-teal-900 font-extrabold">Okul No</th>
                        <th className="py-2 px-3">Adı Soyadı</th>
                        <th className="py-2 px-3 w-28 text-center">Cinsiyet</th>
                        <th className="py-2 px-2 w-10 text-center">Sil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {parsedList.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-teal-50/30 transition-colors">
                          <td className="py-1.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-1.5 px-3">
                            <input
                              type="text"
                              value={item.number}
                              onChange={(e) =>
                                handleUpdateParsedItem(item.id, 'number', e.target.value)
                              }
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-teal-500"
                            />
                          </td>
                          <td className="py-1.5 px-3">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) =>
                                handleUpdateParsedItem(item.id, 'name', e.target.value)
                              }
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-teal-500"
                            />
                          </td>
                          <td className="py-1.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateParsedItem(
                                  item.id,
                                  'gender',
                                  item.gender === 'M' ? 'F' : 'M'
                                )
                              }
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                item.gender === 'M'
                                    ? 'bg-sky-100 text-sky-800 hover:bg-sky-200'
                                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              }`}
                              title="Cinsiyeti değiştirmek için dokunun"
                            >
                              {item.gender === 'M' ? '👦 Erkek' : '👧 Kız'}
                            </button>
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveParsedItem(item.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-md cursor-pointer"
                              title="Listeden çıkar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                {parsedList.length > 0 ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{parsedList.length} Öğrenci Eklenmeye Hazır</span>
                  </span>
                ) : (
                  'Lütfen liste yapıştırın veya dosya yükleyin.'
                )}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="button"
                  disabled={parsedList.length === 0}
                  onClick={handleBulkSubmit}
                  className={`px-5 py-2 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    parsedList.length > 0
                      ? 'bg-teal-700 hover:bg-teal-800 text-white active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {parsedList.length > 0
                      ? `${parsedList.length} Öğrenciyi Sınıfa Kaydet`
                      : 'Öğrencileri Kaydet'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
