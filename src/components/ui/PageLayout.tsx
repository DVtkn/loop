import React, { useEffect, useRef } from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { useCouple } from '../../context/CoupleContext';
import { triggerHaptic } from '../../utils/haptics';

interface PageLayoutProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  onBack?: () => void;
  onHome?: () => void;
  className?: string;
  hideHeader?: boolean;
}

export function PageLayout({
  title,
  subtitle,
  children,
  headerAction,
  onBack,
  onHome,
  className = '',
  hideHeader = false
}: PageLayoutProps) {
  const { activeTab } = useCouple();
  const isChatTab = activeTab === 'chat' || activeTab === 'owl';
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    document.body.classList.toggle('in-chat-view', isChatTab);
  }, [isChatTab]);

  // Native iOS / Telegram Edge Swipe Back gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!onBack || e.touches.length !== 1) return;
    const touch = e.touches[0];
    if (touch.clientX < 45) {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!onBack || !touchStartRef.current || e.changedTouches.length !== 1) {
      touchStartRef.current = null;
      return;
    }
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);

    if (dx > 70 && dy < 65) {
      triggerHaptic('light');
      onBack();
    }
    touchStartRef.current = null;
  };

  return (
    <main
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`flex-1 min-h-0 flex flex-col min-w-0 w-full mx-auto ${
      isChatTab
        ? 'max-w-xl px-0 pb-0 h-full overflow-hidden'
        : 'max-w-3xl px-4 sm:px-6 pt-2 sm:pt-3 pb-24 md:pb-10 overflow-y-auto'
    } ${className}`}>
      {!hideHeader && !isChatTab && (title || onBack || onHome) && (
        <div className="flex items-center justify-between pb-3 sm:pb-4 gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {(onBack || onHome) && (
              <div className="flex items-center gap-1 shrink-0">
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center -ml-1.5 rounded-xl text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                    title="Назад"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                {onHome && (
                  <button
                    type="button"
                    onClick={onHome}
                    className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                    title="На главную"
                  >
                    <Home className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
            
            {(title || subtitle) && (
              <div className="min-w-0 flex-1">
                {title && <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">{title}</h1>}
                {subtitle && <p className="text-xs sm:text-sm text-[var(--text-2)] font-normal mt-0.5 line-clamp-2">{subtitle}</p>}
              </div>
            )}
          </div>

          {headerAction && (
            <div className="shrink-0 flex items-center gap-2">
              {headerAction}
            </div>
          )}
        </div>
      )}

      <div className={isChatTab ? "flex-1 min-h-0 flex flex-col space-y-4" : "w-full space-y-5"}>
        {children}
      </div>
    </main>
  );
}
