import React from 'react';
import {
  Menu,
  Search,
  Calendar,
  Users,
  BarChart3,
  Plus,
  Sparkles,
  Sliders,
  Table2,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { Logo } from './Logo';
import { ClassGroup } from '../types';

interface HeaderProps {
  currentTab: 'overview' | 'live' | 'gradebook' | 'report';
  onChangeTab: (tab: 'overview' | 'live' | 'gradebook' | 'report') => void;
  onOpenDrawer: () => void;
  onOpenAddClass: () => void;
  onOpenMobileInstall?: () => void;
  onSyncToLink?: () => void;
  isSyncing?: boolean;
  classes: ClassGroup[];
  activeClassId: string;
  onSelectClass: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isSearchOpen: boolean;
  onToggleSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onChangeTab,
  onOpenDrawer,
  onOpenAddClass,
  onOpenMobileInstall,
  onSyncToLink,
  isSyncing = false,
  classes,
  activeClassId,
  onSelectClass,
  searchQuery,
  onSearchChange,
  isSearchOpen,
  onToggleSearch,
}) => {
  const activeClass = classes.find((c) => c.id === activeClassId) || classes[0];

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs w-full max-w-full overflow-hidden">
      <div className="max-w-6xl mx-auto px-2.5 sm:px-6">
        <div className="flex items-center justify-between h-13 sm:h-16 gap-1.5 sm:gap-2">
          {/* Left Zone: Hamburger + Logo */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
            <button
              onClick={onOpenDrawer}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-transform cursor-pointer shrink-0"
              aria-label="Menüyü Aç"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
            </button>

            <div
              className="cursor-pointer shrink-0"
              onClick={() => onChangeTab('overview')}
            >
              <Logo size="md" />
            </div>
          </div>

          {/* Middle Zone: Clean Tab Navigation (Desktop / Tablet) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl">
            <button
              onClick={() => onChangeTab('overview')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'overview'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Program & Sınıflar</span>
            </button>

            <button
              onClick={() => onChangeTab('live')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'live'
                  ? 'bg-white text-teal-800 shadow-xs ring-1 ring-teal-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-amber-500" />
              <span>Canlı Katılım Takibi</span>
              {activeClass && (
                <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded">
                  {activeClass.name}
                </span>
              )}
            </button>

            <button
              onClick={() => onChangeTab('gradebook')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'gradebook'
                  ? 'bg-white text-teal-900 shadow-xs ring-1 ring-teal-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table2 className="w-4 h-4 text-teal-600" />
              <span>Not Çizelgesi (Ölçütler)</span>
            </button>

            <button
              onClick={() => onChangeTab('report')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                currentTab === 'report'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <span>Katılım Raporu</span>
            </button>
          </nav>

          {/* Right Zone: Quick Class Switcher & Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Quick Class Dropdown */}
            {classes.length > 0 && (
              <div className="relative max-w-[105px] sm:max-w-[200px]">
                <select
                  value={activeClassId}
                  onChange={(e) => onSelectClass(e.target.value)}
                  className="w-full bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-semibold text-xs sm:text-sm pl-2 pr-5 py-1.5 sm:py-2 rounded-xl border-none cursor-pointer focus:ring-2 focus:ring-teal-500 appearance-none truncate transition-colors"
                  aria-label="Aktif Sınıf Seçimi"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.students.length} Öğr)
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}

            {/* Mobile Transfer & Install Button */}
            {onOpenMobileInstall && (
              <button
                onClick={onOpenMobileInstall}
                className="p-1.5 sm:px-2.5 sm:py-2 bg-gradient-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 text-teal-800 border border-teal-200/90 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
                title="Telefona Aktar & Yükle (QR Kod ile Aç)"
              >
                <Smartphone className="w-4 h-4 text-teal-700 shrink-0" />
                <span className="hidden sm:inline ml-1.5">Telefona Yükle</span>
              </button>
            )}

            {/* Sync to Link Button */}
            {onSyncToLink && (
              <button
                onClick={onSyncToLink}
                disabled={isSyncing}
                className="p-1.5 sm:px-2.5 sm:py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
                title="Çalışmanızı kaydedip paylaşılan linkte anında güncelleyin"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline ml-1.5">Linkte Güncelle</span>
              </button>
            )}

            {/* Search Trigger */}
            <button
              onClick={onToggleSearch}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isSearchOpen || searchQuery
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              aria-label="Öğrenci veya Sınıf Ara"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* Expandable Search Input (if active) */}
        {isSearchOpen && (
          <div className="pb-3 pt-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Öğrenci adı, numarası veya sınıf ara (örn: 104, Zeynep)..."
                autoFocus
                className="w-full pl-10 pr-10 py-2.5 bg-slate-100/90 text-sm text-slate-900 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 border border-slate-200"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-700 px-1 py-0.5 cursor-pointer"
                >
                  Temizle
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>

    {/* Mobile Bottom Tab Bar (Ekranın Altında - Kartları ve Başlığı Kapatmaz) */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1.5 flex items-center justify-around w-full max-w-full">
      <button
        onClick={() => onChangeTab('overview')}
        className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
          currentTab === 'overview'
            ? 'text-teal-700 bg-teal-50'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Calendar className="w-4 h-4" />
        <span>Program</span>
      </button>

      <button
        onClick={() => onChangeTab('live')}
        className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
          currentTab === 'live'
            ? 'text-white bg-teal-600 shadow-xs ring-1 ring-teal-700/20'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Users className="w-4 h-4" />
        <span>Katılım</span>
      </button>

      <button
        onClick={() => onChangeTab('gradebook')}
        className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
          currentTab === 'gradebook'
            ? 'text-teal-800 bg-teal-50'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Table2 className="w-4 h-4" />
        <span>Notlar</span>
      </button>

      <button
        onClick={() => onChangeTab('report')}
        className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
          currentTab === 'report'
            ? 'text-indigo-700 bg-indigo-50'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <BarChart3 className="w-4 h-4" />
        <span>Rapor</span>
      </button>
    </nav>
    </>
  );
};
