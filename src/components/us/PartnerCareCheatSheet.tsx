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
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics.ts';
import { CoupleProfile, PartnerId, TestCategory } from '../../types.ts';
import { DeepCoupleAnalysis } from '../../utils/psychologyEngine.ts';

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
  const [viewTarget, setViewTarget] = useState<'aboutPartner' | 'aboutMe'>('aboutPartner');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const isPartner1 = currentPartnerId === 'partner1';
  const myProfile = isPartner1 ? coupleProfile.partner1 : coupleProfile.partner2;
  const partnerProfile = isPartner1 ? coupleProfile.partner2 : coupleProfile.partner1;

  // The subject person whose cheat-sheet we are looking at
  const subjectName = viewTarget === 'aboutPartner' ? partnerProfile.name || 'Партнёр' : myProfile.name || 'Вы';
  const readerName = viewTarget === 'aboutPartner' ? myProfile.name || 'Вы' : partnerProfile.name || 'Партнёр';

  const subjectPsych = viewTarget === 'aboutPartner'
    ? (isPartner1 ? analysis.partner2Profile : analysis.partner1Profile)
    : (isPartner1 ? analysis.partner1Profile : analysis.partner2Profile);

  const hasAttachmentTest = tests.some(
    (t) => (t.id === 'TEST-S2' || t.title.toLowerCase().includes('привязанност')) && (t.partner1Done || t.partner2Done)
  );
  const hasLoveLanguageTest = tests.some(
    (t) => (t.id === 'TEST-S1' || t.title.toLowerCase().includes('язык')) && (t.partner1Done || t.partner2Done)
  );
  const hasConflictTest = tests.some(
    (t) => (t.id === 'TEST-S3' || t.title.toLowerCase().includes('конфликт')) && (t.partner1Done || t.partner2Done)
  );

  // Dynamic practical tips based on tests or calibrated defaults
  const loveLanguageTip = {
    title: 'Язык любви и проявление нежности',
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
        ? `Формула мягкого контакта: «Я чувствую беспокойство из-за [ситуация], давай подумаем, как нам сделать лучше для обоих».`
        : `Если пульс зашкаливает, предложите: «Давай сделаем перерыв на 20 минут и вернёмся к теме спокойно».`,
  };

  const quickJoyTip = {
    title: 'Что дарит мгновенную искру радости',
    tag: subjectPsych.coreNeed || 'Эмоциональный отклик и признание',
    ideas: [
      `Неожиданное объятие со спины во время домашних дел`,
      `Искренний комплимент его/её решениям или внешности`,
      `Любимый перекус или кофе без повода`,
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

  return (
    <div className="p-5 sm:p-6 rounded-[32px] bg-[var(--surface-solid)] border border-[var(--card-border)] shadow-[var(--card-shadow)] space-y-5">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Психологическая шпаргалка союза</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-[var(--text)] tracking-tight">
            Чит-код к сердцу: {subjectName}
          </h3>
          <p className="text-xs text-[var(--text-2)]">
            Практическая выжимка из ваших психологических тестов и шкал отношений
          </p>
        </div>

        {/* Switcher: О партнёре vs Обо мне */}
        <div className="bg-[var(--surface-2)] p-1 rounded-2xl flex items-center shrink-0 border border-[var(--divider)]/50 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setViewTarget('aboutPartner');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewTarget === 'aboutPartner'
                ? 'bg-[var(--surface-solid)] text-[var(--text)] shadow-xs'
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
                ? 'bg-[var(--surface-solid)] text-[var(--text)] shadow-xs'
                : 'text-[var(--text-2)] hover:text-[var(--text)]'
            }`}
          >
            Обо мне
          </button>
        </div>
      </div>

      {/* Grid of 4 Actionable Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        
        {/* CARD 1: Love Language */}
        <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-br from-rose-50/40 via-[var(--surface-2)] to-transparent dark:from-rose-950/15 dark:via-[var(--surface-2)] border border-rose-500/15 space-y-2.5 relative group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
                <Heart className="w-4 h-4 fill-rose-500/20" />
              </div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                {loveLanguageTip.tag}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(`${loveLanguageTip.title}: ${loveLanguageTip.howToLove} ${loveLanguageTip.action}`, 'love')}
              className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
              title="Скопировать совет"
            >
              {copiedSection === 'love' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <h4 className="text-sm font-bold text-[var(--text)] leading-snug">
            {loveLanguageTip.title}
          </h4>
          <p className="text-xs text-[var(--text-2)] leading-relaxed">
            {loveLanguageTip.howToLove}
          </p>
          <div className="pt-2 border-t border-rose-500/10 text-xs text-[var(--text)] font-medium bg-rose-500/5 p-2.5 rounded-xl">
            <strong className="text-rose-600 dark:text-rose-400 font-bold block mb-0.5">Ключевое действие:</strong>
            {loveLanguageTip.action}
          </div>
        </div>

        {/* CARD 2: Stress Coping */}
        <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-br from-blue-50/40 via-[var(--surface-2)] to-transparent dark:from-blue-950/15 dark:via-[var(--surface-2)] border border-blue-500/15 space-y-2.5 relative group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {stressTip.tag}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(`${stressTip.title}: ${stressTip.howToHelp} ${stressTip.antidote}`, 'stress')}
              className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
              title="Скопировать совет"
            >
              {copiedSection === 'stress' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <h4 className="text-sm font-bold text-[var(--text)] leading-snug">
            {stressTip.title}
          </h4>
          <p className="text-xs text-[var(--text-2)] leading-relaxed">
            {stressTip.howToHelp}
          </p>
          <div className="pt-2 border-t border-blue-500/10 text-xs text-[var(--text)] font-medium bg-blue-500/5 p-2.5 rounded-xl">
            <strong className="text-blue-600 dark:text-blue-400 font-bold block mb-0.5">Что лучше сделать:</strong>
            {stressTip.antidote}
          </div>
        </div>

        {/* CARD 3: Conflict Antidote */}
        <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-br from-amber-50/40 via-[var(--surface-2)] to-transparent dark:from-amber-950/15 dark:via-[var(--surface-2)] border border-amber-500/15 space-y-2.5 relative group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {conflictTip.tag}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(`${conflictTip.title}: ${conflictTip.rule} ${conflictTip.script}`, 'conflict')}
              className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
              title="Скопировать совет"
            >
              {copiedSection === 'conflict' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <h4 className="text-sm font-bold text-[var(--text)] leading-snug">
            {conflictTip.title}
          </h4>
          <p className="text-xs text-[var(--text-2)] leading-relaxed">
            {conflictTip.rule}
          </p>
          <div className="pt-2 border-t border-amber-500/10 text-xs text-[var(--text)] font-medium bg-amber-500/5 p-2.5 rounded-xl">
            <strong className="text-amber-600 dark:text-amber-400 font-bold block mb-0.5">Мягкая фраза:</strong>
            «{conflictTip.script}»
          </div>
        </div>

        {/* CARD 4: Instant Joy Triggers */}
        <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-br from-emerald-50/40 via-[var(--surface-2)] to-transparent dark:from-emerald-950/15 dark:via-[var(--surface-2)] border border-emerald-500/15 space-y-2.5 relative group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <Smile className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {quickJoyTip.tag}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(`${quickJoyTip.title}: ${quickJoyTip.ideas.join(', ')}`, 'joy')}
              className="p-1.5 rounded-lg text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
              title="Скопировать совет"
            >
              {copiedSection === 'joy' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <h4 className="text-sm font-bold text-[var(--text)] leading-snug">
            {quickJoyTip.title}
          </h4>
          <ul className="space-y-1.5 text-xs text-[var(--text-2)]">
            {quickJoyTip.ideas.map((idea, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-500 shrink-0 font-bold">•</span>
                <span>{idea}</span>
              </li>
            ))}
          </ul>
          <div className="pt-2 text-[11px] text-[var(--text-3)] font-medium">
            Обновляется по мере прохождения тестов и заполнения книги радостей
          </div>
        </div>

      </div>
    </div>
  );
};
