import React, { useEffect } from 'react';
import { Sparkles, X, CheckCircle2, Send } from 'lucide-react';
import { Venue } from '../../types.ts';

interface InviteBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  inviteNote: string;
  setInviteNote: (note: string) => void;
  selectedVenueId: string;
  setSelectedVenueId: (id: string) => void;
  customLocationName: string;
  setCustomLocationName: (name: string) => void;
  inviteDate: string;
  setInviteDate: (date: string) => void;
  inviteTime: string;
  setInviteTime: (time: string) => void;
  venues: Venue[];
  inviteSentSuccess: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const InviteBuilderModal: React.FC<InviteBuilderModalProps> = ({
  isOpen,
  onClose,
  partnerName,
  inviteNote,
  setInviteNote,
  selectedVenueId,
  setSelectedVenueId,
  customLocationName,
  setCustomLocationName,
  inviteDate,
  setInviteDate,
  inviteTime,
  setInviteTime,
  venues,
  inviteSentSuccess,
  onSubmit,
}) => {
  useEffect(() => {
    if (!isOpen) {
      setInviteNote('Приглашаю тебя провести этот особенный вечер вдвоём');
      setSelectedVenueId('');
      setCustomLocationName('');
      setInviteDate('');
      setInviteTime('');
    }
  }, [isOpen, setInviteNote, setSelectedVenueId, setCustomLocationName, setInviteDate, setInviteTime]);
  const handleClose = () => {
    setInviteNote('Приглашаю тебя провести этот особенный вечер вдвоём');
    setSelectedVenueId('');
    setCustomLocationName('');
    setInviteDate('');
    setInviteTime('');
    onClose();
  };
  const handleSubmit = (e: React.FormEvent) => {
    onSubmit(e);
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[var(--surface)] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[var(--divider)] space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[var(--text)] tracking-tight">
                Приглашение на свидание
              </h3>
              <p className="text-xs text-[var(--text-2)]">Для любимого человека: {partnerName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {inviteSentSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h4 className="text-lg font-bold text-[var(--text)]">
              Приглашение отправлено!
            </h4>
            <p className="text-xs text-[var(--text-2)] max-w-xs mx-auto leading-relaxed">
              {partnerName} получит красивый билет в приложении и сможет согласовать удобное время 💕
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <label className="text-xs font-bold text-[var(--text)] block mb-1.5">
                Тёплые слова & повод *
              </label>
              <textarea
                required
                rows={3}
                value={inviteNote}
                onChange={(e) => setInviteNote(e.target.value)}
                placeholder="Напишите, почему вы хотите провести этот вечер вместе..."
                className="w-full p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)] text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] resize-none transition-all leading-relaxed"
              />
            </div>

            {venues.length > 0 && (
              <div>
                <label className="text-xs font-bold text-[var(--text)] block mb-1.5">
                  Выбрать из ваших любимых мест
                </label>
                <select
                  value={selectedVenueId}
                  onChange={(e) => {
                    setSelectedVenueId(e.target.value);
                    if (e.target.value) setCustomLocationName('');
                  }}
                  className="w-full p-3 rounded-2xl bg-[var(--surface-2)] text-xs border border-[var(--divider)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                >
                  <option value="">-- Выберите сохранённое заведение --</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.priceLevel})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-[var(--text)] block mb-1.5">
                {venues.length > 0 ? 'Или другое место' : 'Место свидания'}
              </label>
              <input
                type="text"
                value={customLocationName}
                onChange={(e) => {
                  setCustomLocationName(e.target.value);
                  setSelectedVenueId('');
                }}
                placeholder="Например: Панорамная крыша, парк у озера или дома при свечах"
                className="w-full p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)] text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-bold text-[var(--text)] block mb-1.5">
                  Желаемый день
                </label>
                <input
                  type="text"
                  value={inviteDate}
                  onChange={(e) => setInviteDate(e.target.value)}
                  placeholder="В эту пятницу"
                  className="w-full p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)] text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text)] block mb-1.5">
                  Время
                </label>
                <input
                  type="text"
                  value={inviteTime}
                  onChange={(e) => setInviteTime(e.target.value)}
                  placeholder="19:30"
                  className="w-full p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)] text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-extrabold text-xs shadow-md shadow-[var(--accent)]/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>Отправить романтический инвайт</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
