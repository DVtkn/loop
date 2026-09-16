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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--text)]">
                Приглашение на свидание
              </h3>
              <p className="text-[11px] text-[var(--text-2)]">Для {partnerName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 text-[var(--text-2)] hover:text-[var(--text)] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {inviteSentSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-[var(--text)]">
              Приглашение успешно отправлено!
            </h4>
            <p className="text-xs text-[var(--text-2)]">
              Партнёр получит уведомление и сможет согласовать время
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-bold text-[var(--text-2)] block mb-1">
                Текст приглашения *
              </label>
              <textarea
                required
                rows={3}
                value={inviteNote}
                onChange={(e) => setInviteNote(e.target.value)}
                className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--divider)] text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
              />
            </div>

            {venues.length > 0 && (
              <div>
                <label className="text-[10px] font-bold text-[var(--text-2)] block mb-1">
                  Выбрать из списка сохранённых мест:
                </label>
                <select
                  value={selectedVenueId}
                  onChange={(e) => {
                    setSelectedVenueId(e.target.value);
                    if (e.target.value) setCustomLocationName('');
                  }}
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] text-xs border border-[var(--divider)] text-[var(--text)] focus:outline-none"
                >
                  <option value="">-- Выбрать место пары или ввести своё --</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.priceLevel})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-[var(--text-2)] block mb-1">
                Или укажите своё место
              </label>
              <input
                type="text"
                value={customLocationName}
                onChange={(e) => {
                  setCustomLocationName(e.target.value);
                  setSelectedVenueId('');
                }}
                placeholder="Например: Панорамная крыша или парк"
                className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--divider)] text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-[var(--text-2)] block mb-1">
                  Желаемый день
                </label>
                <input
                  type="text"
                  value={inviteDate}
                  onChange={(e) => setInviteDate(e.target.value)}
                  placeholder="Пятница или 14 февраля"
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--divider)] text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[var(--text-2)] block mb-1">
                  Время
                </label>
                <input
                  type="text"
                  value={inviteTime}
                  onChange={(e) => setInviteTime(e.target.value)}
                  placeholder="19:30"
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--divider)] text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Отправить приглашение {partnerName}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
