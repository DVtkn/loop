import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  X,
  Heart,
  Camera,
  Award,
  Sparkles,
  Calendar,
  Smile,
  CheckCircle2,
  Trash2,
  MessageCircle,
} from 'lucide-react';
import { FeedItem } from '../context/CoupleContext';
import { triggerHaptic } from '../utils/haptics';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedItems: FeedItem[];
  onClearAll?: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  feedItems,
  onClearAll,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getItemIcon = (type?: string) => {
    switch (type) {
      case 'heart':
      case 'hug':
      case 'touch':
        return <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />;
      case 'photo':
        return <Camera className="w-4 h-4 text-amber-500" />;
      case 'achievement':
      case 'xp':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'date':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'mood':
        return <Smile className="w-4 h-4 text-emerald-500" />;
      case 'quiz':
      case 'test':
        return <Sparkles className="w-4 h-4 text-indigo-500" />;
      default:
        return <Bell className="w-4 h-4 text-[var(--accent)]" />;
    }
  };

  const getItemBadgeBg = (type?: string) => {
    switch (type) {
      case 'heart':
      case 'hug':
      case 'touch':
        return 'bg-rose-500/15 border-rose-500/20';
      case 'photo':
        return 'bg-amber-500/15 border-amber-500/20';
      case 'achievement':
      case 'xp':
        return 'bg-amber-500/15 border-amber-500/20';
      case 'date':
        return 'bg-purple-500/15 border-purple-500/20';
      case 'mood':
        return 'bg-emerald-500/15 border-emerald-500/20';
      case 'quiz':
      case 'test':
        return 'bg-indigo-500/15 border-indigo-500/20';
      default:
        return 'bg-rose-500/15 border-rose-500/20';
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          triggerHaptic('light');
          onClose();
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
      />

      {/* Modal Drawer */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full sm:max-w-lg max-h-[85vh] sm:max-h-[75vh] bg-[var(--surface-solid)] rounded-t-[32px] sm:rounded-[32px] border border-[var(--card-border)] shadow-2xl flex flex-col overflow-hidden pb-[max(1rem,calc(env(safe-area-inset-bottom,0px)+1rem))]"
      >
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 rounded-full bg-[var(--divider)] mx-auto mt-3 mb-1 shrink-0 sm:hidden opacity-80" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--divider)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0 border border-rose-500/20 shadow-2xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[var(--text)] tracking-tight">
                  Уведомления
                </h3>
                {feedItems.length > 0 && (
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-2xs">
                    {feedItems.length}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-3)] font-medium">
                События, ответы и касания союза
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {feedItems.length > 0 && onClearAll && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  onClearAll();
                }}
                className="p-2 text-xs font-semibold text-[var(--text-3)] hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                title="Очистить все"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Очистить</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text)] flex items-center justify-center transition-colors cursor-pointer"
              title="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[160px]">
          {feedItems.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-[var(--accent)] flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-[var(--text)]">Все уведомления прочитаны</h4>
                <p className="text-xs text-[var(--text-2)] max-w-xs mx-auto leading-relaxed">
                  Здесь появятся важные моменты: быстрые объятия, ответы на вопрос дня и новые фото.
                </p>
              </div>
            </div>
          ) : (
            feedItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-[var(--surface-2)]/70 hover:bg-[var(--surface-2)] border border-[var(--divider)] flex items-start gap-3 transition-all shadow-2xs"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 shadow-2xs ${getItemBadgeBg(
                    item.type
                  )}`}
                >
                  {getItemIcon(item.type)}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-[var(--text)] leading-snug break-words">
                      {item.title}
                    </h4>
                    {item.timeAgo && (
                      <span className="text-[10px] font-semibold text-[var(--text-3)] shrink-0">
                        {item.timeAgo}
                      </span>
                    )}
                  </div>

                  {item.subtitle && (
                    <p className="text-xs text-[var(--text-2)] leading-relaxed break-words font-medium">
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 pt-3 border-t border-[var(--divider)] shrink-0">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[var(--accent)] to-pink-500 text-white font-black text-sm shadow-xs hover:opacity-95 active:scale-98 transition-all cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
};