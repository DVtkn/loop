import React, { useState } from 'react';
import { Sun, Moon, Bell, Award, Flame, User, Heart, Sparkles, X } from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { LoopLogo } from './LoopLogo';

interface HeaderProps {
  onOpenAchievements?: () => void;
  onOpenSettings?: () => void;
  activeTabTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAchievements, onOpenSettings }) => {
  const {
    currentPartnerId,
    setCurrentPartnerId,
    coupleProfile,
    theme,
    setTheme,
    screen,
    setScreen,
    currentUser,
    coupleXP,
    coupleLevelInfo,
    feedItems,
  } = useCouple() as any;

  const partner1 = coupleProfile.partner1;
  const partner2 = coupleProfile.partner2;
  const isPaired = !!currentUser?.partnerLogin;
  const [showActivity, setShowActivity] = useState(false);
  const unreadCount = Array.isArray(feedItems) && feedItems.length > 3 ? feedItems.length : 0;

  return (
    <>
    <header 
      className="shrink-0 z-30 apple-glass border-b border-[var(--divider)] select-none transition-all"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 4px)', paddingBottom: '2px' }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-13 sm:h-14">
          
          {/* Left: Brand */}
          <div className="flex items-center gap-2">
            <LoopLogo size="sm" />
            <span className="font-extrabold text-base tracking-tight text-[var(--text)]">Loop</span>
          </div>

          {/* Right Controls: Global XP Counter, User Avatar (desktop) & Theme */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              id="header-bell-btn"
              onClick={() => setShowActivity(true)}
              className="relative w-10 h-10 min-w-[40px] min-h-[40px] sm:w-8 sm:h-8 sm:min-w-[32px] sm:min-h-[32px] rounded-full bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] border border-[var(--divider)] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              title="Уведомления"
              aria-label="Открыть уведомления"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>

            {/* Global XP / Level Pill */}
            {onOpenAchievements && (
              <button
                id="header-xp-pill-btn"
                onClick={onOpenAchievements}
                className="min-h-[40px] sm:min-h-[32px] px-3 sm:px-2.5 py-1.5 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--divider)] flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer group"
                title={`Уровень ${coupleLevelInfo.level}: ${coupleLevelInfo.levelName} • ${coupleXP} XP`}
              >
                <div className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3 h-3 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-xs font-bold text-[var(--text)]">
                  {coupleXP} <span className="text-[10px] text-[var(--text-3)] font-medium">XP</span>
                </span>
                <span className="text-[10px] font-semibold text-[var(--accent)] bg-[var(--surface-blush)] px-1.5 py-0.2 rounded-full hidden sm:inline">
                  Ур. {coupleLevelInfo.level}
                </span>
              </button>
            )}

            {/* User Profile Pill - Shown on Desktop only; mobile already has dedicated tab in bottom navigation */}
            {currentUser && onOpenSettings && (
              <button
                id="header-profile-btn"
                onClick={onOpenSettings}
                className="hidden sm:flex px-2.5 py-1.5 min-h-[32px] rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--divider)] items-center gap-2 transition-colors cursor-pointer"
                title="Перейти в личный кабинет"
              >
                <div className="w-5 h-5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : currentUser.login[0].toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-[var(--text-2)] hover:text-[var(--text)]">
                  {currentUser.name || `@${currentUser.login}`}
                </span>
                {isPaired && <Heart className="w-3 h-3 text-[var(--accent)] fill-[var(--accent)] shrink-0" />}
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              id="header-theme-btn"
              onClick={() => setTheme(theme === 'night' ? 'aurora' : 'night')}
              className="w-10 h-10 min-w-[40px] min-h-[40px] sm:w-8 sm:h-8 sm:min-w-[32px] sm:min-h-[32px] rounded-full bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] border border-[var(--divider)] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              title="Сменить тему"
            >
              {theme === 'night' ? (
                <Moon className="w-4 h-4 text-[var(--accent)]" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
    {showActivity && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowActivity(false)} />
        <div className="relative w-full sm:max-w-md max-h-[70vh] sm:max-h-[60vh] bg-[var(--surface)] rounded-t-3xl sm:rounded-3xl border border-[var(--divider)] shadow-2xl flex flex-col animate-slideUp overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[var(--divider)]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center"><Bell className="w-4 h-4" /></div>
              <h3 className="font-bold text-[var(--text)]">Уведомления</h3>
              {feedItems.length > 0 && <span className="text-xs bg-[var(--surface-2)] border border-[var(--divider)] px-2 py-0.5 rounded-full">{feedItems.length}</span>}
            </div>
            <button onClick={() => setShowActivity(false)} className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {feedItems.length === 0 ? (
              <div className="py-12 text-center text-sm text-[var(--text-2)]">Пока нет уведомлений — отправьте объятие или пройдите тест ❤️</div>
            ) : (
              feedItems.slice(0, 20).map((it: any) => (
                <div key={it.id} className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)]">
                  <div className="text-xs font-bold text-[var(--text)]">{it.title}</div>
                  <div className="text-[11px] text-[var(--text-2)] mt-0.5">{it.subtitle}</div>
                  <div className="text-[10px] text-[var(--text-3)] mt-1">{it.timeAgo || ''}</div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-[var(--divider)]">
            <button onClick={() => setShowActivity(false)} className="w-full py-3 rounded-xl bg-[var(--accent)] text-white font-bold text-sm">Закрыть</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
