import React from 'react';
import { motion } from 'motion/react';
import {
  Home,
  Heart,
  MapPin,
  Bot, MessageCircle,
  User,
  Sparkles,
  Award,
  Sun,
  Moon,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { NavigationTab } from '../types';
import { useCouple } from '../context/CoupleContext';
import { LoopLogo } from './LoopLogo';

interface NavigationProps {
  activeTab: NavigationTab;
  setActiveTab?: (tab: NavigationTab) => void;
  onTabChange?: (tab: NavigationTab) => void;
  onOpenAchievements?: () => void;
  variant?: 'sidebar' | 'bottom' | 'both';
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onTabChange,
  onOpenAchievements,
  variant = 'both',
}) => {
  const {
    currentPartnerId,
    setCurrentPartnerId,
    coupleProfile,
    daysTogether, formattedTimeTogether,
    theme,
    setTheme,
    challenges,
    dateInvites,
    achievements,
    currentUser,
    incomingRequests,
    unreadChatCount,
  } = useCouple();

  const handleTabClick = (tab: NavigationTab) => {
    if (setActiveTab) setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const partner1 = coupleProfile.partner1;
  const partner2 = coupleProfile.partner2;
  const currentPartner = currentPartnerId === 'partner1' ? partner1 : partner2;

  const pendingInvitesCount = dateInvites.filter(
    (i) => i.status === 'PENDING' || i.status === 'PROPOSED'
  ).length;

  const activeChallengeCount = challenges.filter(
    (c) => !(c.partner1Completed && c.partner2Completed)
  ).length;

  const isTabActive = (tabKey: NavigationTab) => {
    if (activeTab === tabKey) return true;
    if (tabKey === 'home' && activeTab === 'dashboard') return true;
    if (tabKey === 'us' && (activeTab === 'tests' || activeTab === 'report' || activeTab === 'care' || activeTab === 'deeptalk')) return true;
    if (tabKey === 'chat' && activeTab === 'owl') return true;
    if (tabKey === 'profile' && activeTab === 'settings') return true;
    return false;
  };

  const navItems: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'home', label: 'Сегодня', icon: Home },
    { id: 'us', label: 'Мы', icon: Heart },
    { id: 'dates', label: 'Свидания', icon: MapPin, badge: pendingInvitesCount > 0 ? pendingInvitesCount : undefined },
    { id: 'chat', label: 'Чат', icon: MessageCircle, badge: unreadChatCount > 0 ? unreadChatCount : undefined },
    { id: 'profile', label: 'Профиль', icon: User, badge: incomingRequests.length > 0 ? incomingRequests.length : undefined },
  ];

  return (
    <>
      {/* DESKTOP SLEEK SIDEBAR */}
      {variant !== 'bottom' && (
        <aside className="hidden md:flex flex-col w-64 apple-glass text-[var(--text)] min-h-screen border-r border-[var(--divider)] shrink-0 sticky top-0 h-screen justify-between z-30 select-none transition-colors">
          
          {/* Brand Header */}
          <div>
            <div className="p-5 border-b border-[var(--divider)] flex items-center justify-between">
              <div className="flex items-center gap-3">
              <LoopLogo size="md" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-[var(--text)]">Loop</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 whitespace-nowrap rounded-full bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--divider)] shadow-2xs">
                    Pro
                  </span>
                </div>
                <p className="text-xs text-[var(--text-2)] font-normal">Гармония пары & ИИ</p>
              </div>
            </div>

            <button
              onClick={() => setTheme(theme === 'night' ? 'aurora' : 'night')}
              className="w-8 h-8 whitespace-nowrap rounded-full bg-[var(--surface-2)] text-[var(--text)] flex items-center justify-center hover:opacity-80 transition-opacity border border-[var(--divider)] active:scale-95 shadow-2xs"
              title="Переключить тему"
            >
              {theme === 'night' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[var(--accent)]" />}
            </button>
          </div>

          {/* Current User Card in Sidebar */}
          <div 
            onClick={() => handleTabClick('profile')}
            className="p-3 mx-3 my-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)] cursor-pointer hover:border-[var(--accent)] hover:shadow-xs transition-all group shadow-2xs"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-[var(--text-2)]">
                Мой профиль
              </span>
              <span className="text-xs font-semibold text-[var(--accent)] group-hover:underline">
                Кабинет →
              </span>
            </div>

            <div className="flex items-center gap-2.5 bg-[var(--surface)] p-2 rounded-xl border border-[var(--divider)] shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 text-xs flex items-center justify-center font-bold text-[var(--accent)]">
                {currentUser?.name ? currentUser.name[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[var(--text)]">
                  {currentUser?.name || partner1.name}
                </div>
                <div className="text-xs text-[var(--text-2)] font-mono">
                  @{currentUser?.login || 'user'}
                </div>
              </div>
            </div>
          </div>

          {/* Nav List */}
          <nav className="px-3 space-y-1.5 mt-2">
            {navItems.map((item) => {
              const active = isTabActive(item.id);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  id={`desktop-nav-${item.id}`}
                  onClick={() => handleTabClick(item.id)}
                  className={`relative w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all group ${
                    active
                      ? 'text-[var(--accent)]'
                      : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]/60'
                  }`}
                >
                  {/* Sliding animated active indicator */}
                  {active && (
                    <motion.div
                      layoutId="desktopActiveTabIndicator"
                      className="absolute inset-0 rounded-xl bg-[var(--surface-2)] border border-[var(--divider)] shadow-xs"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}

                  <div className="relative z-10 flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        active
                          ? 'bg-gradient-to-tr from-[var(--accent)] to-[var(--accent-hover)] text-white shadow-xs shadow-[var(--accent-glow)]'
                          : 'bg-[var(--surface-2)] text-[var(--text-2)] group-hover:text-[var(--text)] border border-[var(--divider)]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold">{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="relative z-10 px-2 py-0.5 text-xs font-semibold rounded-full bg-[var(--accent)] text-white shadow-xs">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Couple Stats */}
        <div className="p-4 border-t border-[var(--divider)] space-y-2.5">
          {onOpenAchievements && (
            <button
              type="button"
              onClick={onOpenAchievements}
              className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--divider)] flex items-center justify-between transition-all cursor-pointer group active:scale-98 shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-[var(--text)]">Награды & Уровень</span>
              </div>
              <span className="text-xs font-semibold text-[var(--accent)] bg-[var(--surface-blush)] px-2 py-0.5 rounded-full">
                🏆 {achievements?.filter(a => a.unlocked)?.length || 0}
              </span>
            </button>
          )}

          <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)] flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-2 overflow-hidden">
                <div className="w-7 h-7 rounded-full bg-[var(--accent)] text-white font-semibold text-xs flex items-center justify-center ring-2 ring-[var(--surface)] shadow-2xs">
                  {partner1.name[0]}
                </div>
                <div className="w-7 h-7 rounded-full bg-[var(--accent-2)] text-white font-semibold text-xs flex items-center justify-center ring-2 ring-[var(--surface)] shadow-2xs">
                  {partner2.name[0]}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--text)] leading-tight">
                  {partner1.name} & {partner2.name}
                </p>
                <p className="text-xs text-[var(--text-2)]">{formattedTimeTogether} вместе</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
      )}

      {/* MOBILE BOTTOM TAB BAR (Native iOS Tabbar Style - 5 permanent tabs) */}
      {variant !== 'sidebar' && (
      <nav 
        aria-label="Основная навигация"
        className="bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-40 select-none bg-[var(--surface-solid)]/90 dark:bg-[var(--surface-solid)]/95 backdrop-blur-2xl border-t border-[var(--divider)] shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-[max(0.6rem,env(safe-area-inset-bottom,0px))]"
      >
        <div className="max-w-md mx-auto px-3">
          <div className="grid grid-cols-5 h-[54px] items-center">
            {navItems.map((item) => {
              const active = isTabActive(item.id);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  id={`mobile-tab-${item.id}`}
                  onClick={() => handleTabClick(item.id)}
                  className={`relative flex flex-col items-center justify-center h-full py-1 transition-all active:scale-90 cursor-pointer ${
                    active ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
                  }`}
                >
                  {/* Radiant active pill background */}
                  {active && (
                    <motion.div
                      layoutId="mobileActiveTab"
                      className="absolute inset-x-1 inset-y-1 rounded-2xl bg-gradient-to-tr from-[var(--surface-blush)] via-[var(--surface-blush)]/90 to-rose-100/60 dark:from-[var(--surface-blush)] dark:to-rose-950/30 border border-[var(--accent)]/20 shadow-2xs -z-10"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <div className="relative">
                    <Icon className={`w-5 h-5 transition-transform ${active ? 'stroke-[2.5] scale-110 drop-shadow-[0_2px_8px_rgba(255,46,99,0.35)]' : 'stroke-[1.8]'}`} />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 min-w-[15px] h-4 px-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs leading-none animate-pulse">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] mt-0.5 tracking-tight leading-none ${active ? 'font-black text-[var(--accent)] scale-102' : 'font-medium text-[var(--text-3)]'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
      )}
    </>
  );
};
