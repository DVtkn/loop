import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  Shield,
  Zap,
  Sparkles,
  ChevronRight,
  Info,
  Copy,
  Check,
  Smile,
  AlertCircle,
  HelpCircle,
  Send,
  MessageCircle,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics.ts';
import { CoupleProfile, PartnerId, TestCategory } from '../../types.ts';
import { DeepCoupleAnalysis } from '../../utils/psychologyEngine.ts';
import { useCouple } from '../../context/CoupleContext.tsx';

interface PartnerCareCheatSheetProps {
  currentPartnerId: PartnerId;
  coupleProfile: CoupleProfile;
  analysis: DeepCoupleAnalysis;
  tests: TestCategory[];
}

export const PartnerCareCheatSheet: React.FC<PartnerCareCheatSheetProps> = ({
  currentPartnerId,
  coupleProfile,
  analysis,
  tests,
}) => {
  const { sendPartnerMessage, triggerConfetti } = useCouple();
  const [viewTarget, setViewTarget] = useState<'aboutPartner' | 'aboutMe'>('aboutPartner');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [sentSection, setSentSection] = useState<string | null>(null);

  const isPartner1 = currentPartnerId === 'partner1';
  const myProfile = isPartner1 ? coupleProfile.partner1 : coupleProfile.partner2;
  const partnerProfile = isPartner1 ? coupleProfile.partner2 : coupleProfile.partner1;

  // The subject person whose cheat-sheet we are looking at
  const subjectName = viewTarget === 'aboutPartner' ? partnerProfile.name || 'Партнёр' : myProfile.name || 'Вы';
  const readerName = viewTarget === 'aboutPartner' ? myProfile.name || 'Вы' : partnerProfile.name || 'Партнёр';

  const subjectPsych = viewTarget === 'aboutPartner'
    ? (isPartner1 ? analysis.partner2Profile : analysis.partner1Profile)
    : (isPartner1 ? analysis.partner1Profile : analysis.partner2Profile);

  // Dynamic practical tips based on tests or calibrated defaults
  const loveLanguageTip = {
    title: 'Язык любви и нежность',
    tag: subjectPsych.topLoveLanguage || 'Качественное время & Забота',
    howToLove:
      viewTarget === 'aboutPartner'
        ? `Для ${subjectName} важнее всего искреннее внимание без телефонов, слова поддержки и тёплые прикосновения в течение дня.`
        : `Вы больше всего чувствуете себя любимым(ой), когда партнёр дарит нераздельное внимание и поддерживает ваши идеи.`,
    action:
      viewTarget === 'aboutPartner'
        ? `Спросите вечером: «Что сегодня сделало тебя счастливым(ой)?» и просто выслушайте с объятием.`
        : `Напомните ${partnerProfile.name}, что короткая записка или неожиданный чай делают ваш день.`,
  };

  const stressTip = {
    title: 'Когда в стрессе или устал(а)',
    tag: subjectPsych.stressPattern || 'Потребность в тишине и валидации',
    howToHelp:
      viewTarget === 'aboutPartner'
        ? `Когда ${subjectName} возвращается уставшим(ей), не начинайте сразу обсуждать бытовые дела или давать советы по решению проблем.`
        : `В состоянии перегруза вам нужно немного личного пространства, чтобы выдохнуть, прежде чем переходить к разговорам.`,
    antidote:
      viewTarget === 'aboutPartner'
        ? `Сделайте тёплый напиток, обнимите и скажите: «Я рядом. Отдохни сколько нужно, всё остальное подождёт».`
        : `Предупредите партнёра мягко: «Я очень рад(а) тебя видеть, мне нужно 15 минут тишины, чтобы перезагрузиться».`,
  };

  const conflictTip = {
    title: 'В моменты разногласий',
    tag: 'Антидот Готтмана: Мягкий старт',
    rule:
      viewTarget === 'aboutPartner'
        ? `Избегайте сарказма и категоричных слов «ты всегда» или «ты никогда». ${subjectName} реагирует на интонацию и принятие.`
        : `Для сохранения эмоциональной безопасности важно начинать сложный разговор со своих чувств, а не с упрёков.`,
    script:
      viewTarget === 'aboutPartner'
        ? `Формула мягкого контакта: «Я чувствую беспокойство из-за ситуации, давай подумаем, как нам сделать лучше для обоих».`
        : `Если пульс зашкаливает, предложите: «Давай сделаем перерыв на 20 минут и вернёмся к теме спокойно».`,
  };

  const quickJoyTip = {
    title: 'Мгновенная искра радости',
    tag: subjectPsych.coreNeed || 'Эмоциональный отклик и признание',
    ideas: [
      `Неожиданное объятие со спины во время домашних дел`,
      `Искренний комплимент его/её решениям или стилю`,
      `Любимый перекус или горячий кофе без повода`,
    ],
  };

  const handleCopy = (text: string, sectionKey: string) => {
    triggerHaptic('light');
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSection(sectionKey);
      setTimeout(() => setCopiedSection(null), 2000);
    }
  };

  const handleSendToChat = (text: string, sectionKey: string) => {
    triggerHaptic('success');
    sendPartnerMessage?.(`💌 Напоминание о заботе: ${text}`, false);
    setSentSection(sectionKey);
    triggerConfetti?.();
    setTimeout(() => setSentSection(null), 2500);
  };

  return (
    <div className="p-5 sm:p-6 rounded-[32px] bg-[var(--surface-solid)] border border-[var(--card-border)] shadow-[var(--card-shadow)] space-y-5 relative overflow-hidden">
      {/* Decorative ambient subtle background bloom */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/10 via-[var(--accent)]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-linear-to-r from-amber-500/15 to-orange-500/10 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-500/20 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Психологическая шпаргалка союза</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-[var(--text)] tracking-tight">
            Чит-код к сердцу: <span className="gradient-text-love">{subjectName}</span>
          </h3>
          <p className="text-xs text-[var(--text-2)] font-medium">
            Практическая выжимка из ваших психологических тестов и шкал отношений
          </p>
        </div>

        {/* Switcher: О партнёре vs Обо мне */}
        <div className="bg-[var(--surface-2)] p-1 rounded-2xl flex items-center shrink-0 border border-[var(--divider)]/70 self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setViewTarget('aboutPartner');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewTarget === 'aboutPartner'
                ? 'bg-[var(--surface-solid)] text-[var(--accent)] shadow-xs border border-[var(--accent)]/15 scale-102'
                : 'text-[var(--text-2)] hover:text-[var(--text)]'
            }`}
          >
            О {partnerProfile.name || 'партнёре'}
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setViewTarget('aboutMe');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewTarget === 'aboutMe'
                ? 'bg-[var(--surface-solid)] text-[var(--accent)] shadow-xs border border-[var(--accent)]/15 scale-102'
                : 'text-[var(--text-2)] hover:text-[var(--text)]'
            }`}
          >
            Обо мне
          </button>
        </div>
      </div>

      {/* Grid of 4 Actionable Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewTarget}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 relative z-10"
        >
          {/* CARD 1: Love Language */}
          <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-br from-rose-500/10 via-[var(--surface-2)]/60 to-transparent dark:from-rose-950/20 dark:via-[var(--surface-2)]/70 border border-rose-500/20 space-y-3 relative group shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0 shadow-2xs">
                  <Heart className="w-4 h-4 fill-rose-500" />
                </div>
                <span className="text-xs font-black text-rose-600 dark:text-rose-400 truncate">
                  {loveLanguageTip.tag}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSendToChat(`${loveLanguageTip.title}: ${loveLanguageTip.action}`, 'love')}
                  className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--accent)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
                  title="Отправить партнеру в чат"
                >
                  {sentSection === 'love' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Send className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(`${loveLanguageTip.title}: ${loveLanguageTip.howToLove} ${loveLanguageTip.action}`, 'love')}
                  className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
                  title="Скопировать совет"
                >
                  {copiedSection === 'love' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <h4 className="text-sm font-bold text-[var(--text)] leading-snug">
              {loveLanguageTip.title}
            </h4>
            <p className="text-xs text-[var(--text-2)] leading-relaxed font-normal">
              {loveLanguageTip.howToLove}
            </p>
            <div className="pt-2 border-t border-rose-500/15 text-xs text-[var(--text)] font-medium bg-rose-500/8 dark:bg-rose-500/12 p-3 rounded-xl">
              <strong className="text-rose-600 dark:text-rose-400 font-black block mb-0.5">Ключевое действие:</strong>
              {loveLanguageTip.action}
            </div>
          </div>

          {/* CARD 2: Stress Coping */}
          <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-br from-blue-500/10 via-[var(--surface-2)]/60 to-transparent dark:from-blue-950/20 dark:via-[var(--surface-2)]/70 border border-blue-500/20 space-y-3 relative group shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0 shadow-2xs">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 truncate">
                  {stressTip.tag}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSendToChat(`${stressTip.title}: ${stressTip.antidote}`, 'stress')}
                  className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--accent)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
                  title="Отправить партнеру в чат"
                >
                  {sentSection === 'stress' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Send className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(`${stressTip.title}: ${stressTip.howToHelp} ${stressTip.antidote}`, 'stress')}
                  className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
                  title="Скопировать совет"
                >
                  {copiedSection === 'stress' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <h4 className="text-sm font-bold text-[var(--text)] leading-snug">
              {stressTip.title}
            </h4>
            <p className="text-xs text-[var(--text-2)] leading-relaxed font-normal">
              {stressTip.howToHelp}
            </p>
            <div className="pt-2 border-t border-blue-500/15 text-xs text-[var(--text)] font-medium bg-blue-500/8 dark:bg-blue-500/12 p-3 rounded-xl">
              <strong className="text-blue-600 dark:text-blue-400 font-black block mb-0.5">Что лучше сделать:</strong>
              {stressTip.antidote}
            </div>
          </div>

          {/* CARD 3: Conflict Antidote */}
          <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-br from-amber-500/10 via-[var(--surface-2)]/60 to-transparent dark:from-amber-950/20 dark:via-[var(--surface-2)]/70 border border-amber-500/20 space-y-3 relative group shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 shadow-2xs">
                  <Zap className="w-4 h-4 fill-amber-500/20" />
                </div>
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 truncate">
                  {conflictTip.tag}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSendToChat(`«${conflictTip.script}»`, 'conflict')}
                  className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--accent)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
                  title="Отправить партнеру в чат"
                >
                  {sentSection === 'conflict' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Send className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(`${conflictTip.title}: ${conflictTip.rule} ${conflictTip.script}`, 'conflict')}
                  className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
                  title="Скопировать совет"
                >
                  {copiedSection === 'conflict' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <h4 className="text-sm font-bold text-[var(--text)] leading-snug">
              {conflictTip.title}
            </h4>
            <p className="text-xs text-[var(--text-2)] leading-relaxed font-normal">
              {conflictTip.rule}
            </p>
            <div className="pt-2 border-t border-amber-500/15 text-xs text-[var(--text)] font-medium bg-amber-500/8 dark:bg-amber-500/12 p-3 rounded-xl">
              <strong className="text-amber-600 dark:text-amber-400 font-black block mb-0.5">Мягкая фраза:</strong>
              «{conflictTip.script}»
            </div>
          </div>

          {/* CARD 4: Instant Joy Triggers */}
          <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-br from-emerald-500/10 via-[var(--surface-2)]/60 to-transparent dark:from-emerald-950/20 dark:via-[var(--surface-2)]/70 border border-emerald-500/20 space-y-3 relative group shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 shadow-2xs">
                  <Smile className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 truncate">
                  {quickJoyTip.tag}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSendToChat(`Идея для улыбки: ${quickJoyTip.ideas[0]}`, 'joy')}
                  className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--accent)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
                  title="Отправить партнеру в чат"
                >
                  {sentSection === 'joy' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Send className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(`${quickJoyTip.title}: ${quickJoyTip.ideas.join(', ')}`, 'joy')}
                  className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
                  title="Скопировать совет"
                >
                  {copiedSection === 'joy' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <h4 className="text-sm font-bold text-[var(--text)] leading-snug">
              {quickJoyTip.title}
            </h4>
            <ul className="space-y-1.5 text-xs text-[var(--text-2)] font-medium">
              {quickJoyTip.ideas.map((idea, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 shrink-0 font-bold">•</span>
                  <span>{idea}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2 text-[11px] text-[var(--text-3)] font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Обновляется по мере прохождения тестов и книги заботы</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
