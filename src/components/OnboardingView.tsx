import React, { useState } from 'react';
import { 
  Heart, 
  Sparkles, 
  UserPlus, 
  Link as LinkIcon, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Copy, 
  Share2, 
  Calendar, 
  Smile, 
  Compass
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { AVATAR_PROFILES, ColoredIcon, getAvatarProfileMeta } from './ColoredIcon';
import { apiFetch } from '../utils/api';

interface OnboardingViewProps {
  onComplete?: () => void;
}

type OnboardingStep = 'welcome' | 'create_step1' | 'create_step2' | 'create_step3' | 'create_success' | 'join';

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const { createNewCouple, joinCoupleByCode, loadDemoCouple, coupleProfile } = useCouple();

  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [partner1Name, setPartner1Name] = useState<string>('');
  const [partner2Name, setPartner2Name] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [justStarted, setJustStarted] = useState<boolean>(false);
  const [joinCode, setJoinCode] = useState<string>('');
  const [myJoinName, setMyJoinName] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [createdLinkCode, setCreatedLinkCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState<boolean>(false);

  const [selectedAvatar1, setSelectedAvatar1] = useState<string>('leaf');
  const [selectedAvatar2, setSelectedAvatar2] = useState<string>('sparkles');

  const handleStartCreate = () => {
    setStep('create_step1');
  };

  const handleStep1Next = () => {
    if (!partner1Name.trim()) return;
    setStep('create_step2');
  };

  const handleStep2Next = () => {
    if (!partner2Name.trim()) return;
    setStep('create_step3');
  };

  const handleFinishCreate = async () => {
    setIsGenerating(true);
    try {
      const res = await apiFetch('/api/couple/generate-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (res.ok) {
        const data: any = await res.json();
        if (data.code) setCreatedLinkCode(String(data.code).toUpperCase());
        else {
          const fallback = `LOOP-${Math.floor(100000 + Math.random() * 900000)}`;
          setCreatedLinkCode(fallback);
        }
      } else {
        const fallback = `LOOP-${Math.floor(100000 + Math.random() * 900000)}`;
        setCreatedLinkCode(fallback);
      }
    } catch {
      const fallback = `LOOP-${Math.floor(100000 + Math.random() * 900000)}`;
      setCreatedLinkCode(fallback);
    } finally {
      setIsGenerating(false);
      setStep('create_success');
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim() || !myJoinName.trim()) return;
    setJoinError(null);
    setIsJoining(true);
    try {
      const res = await apiFetch('/api/couple/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: joinCode.trim().toUpperCase() }) });
      if (!res.ok) {
        const data: any = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Неверный код');
      }
      joinCoupleByCode(joinCode.trim().toUpperCase(), myJoinName.trim());
      if (onComplete) onComplete();
    } catch (e: any) {
      setJoinError(e?.message || 'Не удалось присоединиться по коду');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCopyInvite = async () => {
    const inviteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://loopza.vercel.app';
    const code = createdLinkCode || coupleProfile.linkCode || '';
    const text = `Привет! Давай подключимся в приложении Loop для нашей пары: ${inviteUrl}\nМой код сопряжения: ${code}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Приглашение в Loop',
          text,
          url: inviteUrl,
        });
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 3000);
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
      }
    } catch {}
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col justify-center items-center px-4 py-8 sm:px-6 transition-colors">
      <div className="max-w-md w-full bg-[var(--surface)] border border-[var(--divider)] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-[var(--text)]">Loop</span>
        </div>

        {/* STEP: WELCOME */}
        {step === 'welcome' && (
          <div className="text-center space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)] mb-2">
                Пространство для двоих
              </h1>
              <p className="text-sm text-[var(--text-2)] leading-relaxed">
                Глубокие психологические тесты Готтмана, ИИ-психолог Сова, карта желаний и совместные свидания.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                id="onboarding-create-pair-btn"
                onClick={handleStartCreate}
                className="w-full py-3.5 px-5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
              >
                <UserPlus className="w-5 h-5" />
                <span>Создать пространство для нас</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>

              <button
                id="onboarding-join-pair-btn"
                onClick={() => setStep('join')}
                className="w-full py-3.5 px-5 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text)] font-semibold rounded-2xl border border-[var(--divider)] flex items-center justify-center gap-2 transition-all"
              >
                <LinkIcon className="w-4 h-4 text-rose-500" />
                <span>Присоединиться по коду</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-2)] opacity-80 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>100% приватность и шифрование данных</span>
            </div>
          </div>
        )}

        {/* STEP: CREATE STEP 1 - Your Name */}
        {step === 'create_step1' && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <span className="text-xs font-bold text-rose-500">Шаг 1 из 3</span>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] mt-1">Как вас зовут?</h2>
              <p className="text-xs text-[var(--text-2)] mt-1">Имя, под которым вас будет видеть ваш партнёр</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] mb-1.5">Ваше имя</label>
                <input
                  id="onboarding-p1-name-input"
                  type="text"
                  value={partner1Name}
                  onChange={(e) => setPartner1Name(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--divider)] rounded-xl text-[var(--text)] font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] mb-1.5">Выберите иконку профиля</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_PROFILES.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatar1(av.id)}
                      className={`p-1.5 rounded-xl transition-all ${
                        selectedAvatar1 === av.id 
                          ? 'ring-2 ring-rose-500 scale-105 shadow-sm' 
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      <ColoredIcon icon={av.icon} color={av.color} size="sm" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('welcome')}
                className="px-4 py-3 bg-[var(--surface-2)] text-[var(--text-2)] font-medium rounded-xl text-sm"
              >
                Назад
              </button>
              <button
                id="onboarding-step1-next-btn"
                type="button"
                disabled={!partner1Name.trim()}
                onClick={handleStep1Next}
                className="flex-1 py-3 bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-md"
              >
                <span>Далее</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP: CREATE STEP 2 - Partner Name */}
        {step === 'create_step2' && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <span className="text-xs font-bold text-rose-500">Шаг 2 из 3</span>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] mt-1">Имя вашего партнёра</h2>
              <p className="text-xs text-[var(--text-2)] mt-1">Кому вы отправите приглашение в пару?</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] mb-1.5">Имя любимого человека</label>
                <input
                  id="onboarding-p2-name-input"
                  type="text"
                  value={partner2Name}
                  onChange={(e) => setPartner2Name(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--divider)] rounded-xl text-[var(--text)] font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] mb-1.5">Иконка партнёра</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_PROFILES.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatar2(av.id)}
                      className={`p-1.5 rounded-xl transition-all ${
                        selectedAvatar2 === av.id 
                          ? 'ring-2 ring-pink-500 scale-105 shadow-sm' 
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      <ColoredIcon icon={av.icon} color={av.color} size="sm" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('create_step1')}
                className="px-4 py-3 bg-[var(--surface-2)] text-[var(--text-2)] font-medium rounded-xl text-sm"
              >
                Назад
              </button>
              <button
                id="onboarding-step2-next-btn"
                type="button"
                disabled={!partner2Name.trim()}
                onClick={handleStep2Next}
                className="flex-1 py-3 bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-md"
              >
                <span>Далее</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP: CREATE STEP 3 - Relationship Date */}
        {step === 'create_step3' && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <span className="text-xs font-bold text-rose-500">Шаг 3 из 3</span>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] mt-1">Когда началась ваша история?</h2>
              <p className="text-xs text-[var(--text-2)] mt-1">Мы будем считать ваши дни вместе и напоминать о годовщинах</p>
            </div>

            <div className="space-y-3">
              {!justStarted && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-2)] mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-rose-500" />
                    <span>Дата начала отношений</span>
                  </label>
                  <input
                    id="onboarding-date-input"
                    type="date"
                    value={startDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--divider)] rounded-xl text-[var(--text)] font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--divider)] cursor-pointer hover:opacity-90">
                <input
                  type="checkbox"
                  checked={justStarted}
                  onChange={(e) => setJustStarted(e.target.checked)}
                  className="w-4 h-4 accent-rose-500 rounded"
                />
                <span className="text-xs font-semibold text-[var(--text)]">Мы только начали встречаться / недавно познакомились</span>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('create_step2')}
                className="px-4 py-3 bg-[var(--surface-2)] text-[var(--text-2)] font-medium rounded-xl text-sm"
              >
                Назад
              </button>
              <button
                id="onboarding-finish-create-btn"
                type="button"
                onClick={handleFinishCreate}
                disabled={isGenerating}
                className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-md disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGenerating ? 'Создаём...' : 'Создать пару'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP: CREATE SUCCESS */}
        {step === 'create_success' && (
          <div className="text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-[var(--text)]">Пара создана!</h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 whitespace-nowrap rounded-full bg-[var(--surface-2)] border border-[var(--divider)]">
                  <ColoredIcon icon={getAvatarProfileMeta(selectedAvatar1).icon} color={getAvatarProfileMeta(selectedAvatar1).color} size="xs" />
                  <span className="text-xs font-bold text-[var(--text)]">{partner1Name}</span>
                </div>
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                <div className="flex items-center gap-1.5 px-2.5 py-1 whitespace-nowrap rounded-full bg-[var(--surface-2)] border border-[var(--divider)]">
                  <ColoredIcon icon={getAvatarProfileMeta(selectedAvatar2).icon} color={getAvatarProfileMeta(selectedAvatar2).color} size="xs" />
                  <span className="text-xs font-bold text-[var(--text)]">{partner2Name}</span>
                </div>
              </div>
            </div>

            {/* Invite Box */}
            <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)] text-left space-y-2">
              <span className="text-[11px] font-semibold text-[var(--text-2)]">Код для {partner2Name}:</span>
              <div className="flex items-center justify-between bg-[var(--surface)] p-3 rounded-xl border border-[var(--divider)] font-mono font-bold text-lg text-rose-500">
                <span>{createdLinkCode || coupleProfile.linkCode}</span>
                <button
                  onClick={handleCopyInvite}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg text-xs font-sans font-semibold flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode ? 'Скопировано!' : 'Копировать'}</span>
                </button>
              </div>
              <p className="text-[11px] text-[var(--text-2)]">
                Отправьте этот код вашему партнёру в Telegram или WhatsApp, чтобы он(а) подключился(-ась) к вашему общему пространству.
              </p>
            </div>

            <button
              id="onboarding-enter-app-btn"
              onClick={() => {
                const finalDate = justStarted ? new Date().toISOString().split('T')[0] : startDate;
                createNewCouple(partner1Name, partner2Name, finalDate);
                if (onComplete) onComplete();
              }}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2"
            >
              <span>Войти в пространство Loop</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP: JOIN VIA CODE */}
        {step === 'join' && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <span className="text-xs font-bold text-rose-500">Подключение</span>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] mt-1">Присоединиться к паре</h2>
              <p className="text-xs text-[var(--text-2)] mt-1">Введите 6-значный код сопряжения от вашего партнёра</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] mb-1.5">Код сопряжения</label>
                <input
                  id="onboarding-join-code-input"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  autoFocus
                  className="w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--divider)] rounded-xl font-mono text-center text-lg text-rose-500 font-boldst focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-2)] mb-1.5">Ваше имя</label>
                <input
                  id="onboarding-join-my-name-input"
                  type="text"
                  value={myJoinName}
                  onChange={(e) => setMyJoinName(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--divider)] rounded-xl text-[var(--text)] font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {joinError && <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-600">{joinError}</div>}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('welcome')}
                className="px-4 py-3 bg-[var(--surface-2)] text-[var(--text-2)] font-medium rounded-xl text-sm"
              >
                Назад
              </button>
              <button
                id="onboarding-join-submit-btn"
                type="button"
                disabled={!joinCode.trim() || !myJoinName.trim() || isJoining}
                onClick={handleJoin}
                className="flex-1 py-3 bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isJoining ? 'Подключаем...' : 'Присоединиться'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
