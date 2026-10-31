import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { PageLayout } from './ui/PageLayout';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  ShieldAlert,
  Users,
  User,
  Heart,
  PhoneCall,
  Sparkles,
  Leaf,
  MessageSquare,
  ChevronLeft,
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { LoopLogo } from './LoopLogo';
import { triggerHaptic } from '../utils/haptics';
import { getPartnerStatusDetails } from './dashboard/PartnerStatusCard';
import { getSemanticToken, SemanticColorType } from './ui/SystemBlocks';

export const ChatView: React.FC = () => {
  const {
    currentPartnerId,
    coupleProfile,
    aiMessages,
    sendAIMessage,
    partnerMessages,
    sendPartnerMessage,
    fetchPartnerMessages,
    isAITyping,
    owlMode,
    setOwlMode,
    currentUser,
    clearUnreadChatCount,
    setActiveTab,
    isPartnerOnline,
    partnerStatusDetails,
  } = useCouple();

  const currentPartner = currentPartnerId === 'partner1' ? coupleProfile.partner1 : coupleProfile.partner2;
  const otherPartner = currentPartnerId === 'partner1' ? coupleProfile.partner2 : coupleProfile.partner1;

  const isPaired = !!currentUser?.partnerLogin;

  // Safe partner fallback aligned with Dashboard
  const safeOtherPartner = otherPartner || {
    id: currentPartnerId === 'partner1' ? 'partner2' : 'partner1',
    name: isPaired ? (currentUser?.partnerLogin || 'Партнёр') : 'Партнёр не подключён',
    avatar: 'heart',
    login: currentUser?.partnerLogin || '',
    gender: 'female',
    lastActiveAt: new Date().toISOString(),
  };

  const partnerDisplayName =
    safeOtherPartner.name && safeOtherPartner.name !== 'Партнёр не подключён' && safeOtherPartner.name !== 'Партнёр 1' && safeOtherPartner.name !== 'Партнёр 2'
      ? safeOtherPartner.name
      : currentUser?.partnerLogin || safeOtherPartner.login || (isPaired ? 'Партнёр' : 'Партнёр не подключён');

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [showCrisisHelp, setShowCrisisHelp] = useState<boolean>(false);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

  const listRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    clearUnreadChatCount();
  }, [clearUnreadChatCount]);

  // Load chat history from backend database on mount and when switching modes
  useEffect(() => {
    fetchPartnerMessages();
  }, [fetchPartnerMessages]);

  useEffect(() => {
    if (owlMode === 'together') {
      fetchPartnerMessages();
    }
  }, [owlMode, fetchPartnerMessages]);

  const scrollToBottom = (smooth = true) => {
    if (listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [aiMessages, partnerMessages, isAITyping, owlMode]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || (owlMode === 'solo' && isAITyping)) return;

    triggerHaptic(50);
    const text = inputMessage.trim();
    setInputMessage('');
    
    if (owlMode === 'solo') {
      await sendAIMessage(text);
    } else {
      await sendPartnerMessage(text);
    }
    setTimeout(() => scrollToBottom(true), 80);
  };

  const handlePromptChipClick = (promptText: string) => {
    setInputMessage(promptText);
    inputRef.current?.focus();
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setInputMessage((prev) => (prev ? prev + ' ' : '') + 'Мы спорим о распределении обязанностей по дому...');
        setIsRecording(false);
      }, 2500);
    } else {
      setIsRecording(false);
    }
  };

  const promptChips = [
    { label: 'Разбор ссоры', text: 'Мы сегодня поссорились из-за бытовых мелочей. Помоги перевести претензии в Я-сообщения.', icon: MessageSquare, color: 'dialogue' },
    { label: 'Метод Готтмана', text: 'Как использовать технику «Мягкого старта» в нашем разговоре сегодня вечером?', icon: Leaf, color: 'care' },
    { label: 'Языки любви', text: `Как мне лучше проявить заботу к ${otherPartner.name} с учётом её/его языка любви?`, icon: Heart, color: 'warmth' },
    { label: 'Сближение', text: 'Посоветуй 3 глубоких вопроса для нашего вечера без телефонов.', icon: Sparkles, color: 'gamification' },
  ];

  return (
    <PageLayout hideHeader className="p-0 sm:p-0 sm:px-0">
      <div className="flex flex-col flex-1 h-full min-h-0 w-full overflow-hidden bg-[var(--bg)]">
      
      {/* 1. SINGLE COMPACT TELEGRAM HEADER */}
      <header className="shrink-0 px-3 pt-[calc(8px+env(safe-area-inset-top,0px))] pb-2 bg-[var(--surface)] border-b border-[var(--divider)] shadow-2xs z-10 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {/* Back button for mobile */}
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="md:hidden -ml-1 w-11 h-11 rounded-full flex items-center justify-center text-[var(--accent)] hover:bg-[var(--surface-2)] active:scale-95 transition-all shrink-0"
              title="Назад"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Red Heart Loop Logo for Owl & Pair Chat */}
            <LoopLogo size="sm" />

            <div className="leading-tight min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-semibold text-[var(--text)]">
                  {owlMode === 'solo' ? 'Сова' : partnerDisplayName}
                </span>
                {owlMode === 'solo' && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/20 shrink-0">
                    ИИ-психолог
                  </span>
                )}
              </div>
              <div className="text-xs font-normal mt-0.5 flex items-center gap-1">
                {owlMode === 'solo' ? (
                  <span className="text-[var(--text-2)]">Сеанс для {currentPartner.name}</span>
                ) : isPartnerOnline ? (
                  <span className="text-emerald-500 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    В сети
                  </span>
                ) : (
                  <span className="text-[var(--text-2)]">
                    {partnerStatusDetails.statusText || (safeOtherPartner.gender === 'female' ? 'Была недавно' : 'Был недавно')}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            {owlMode === 'solo' ? (
              <button
                type="button"
                onClick={() => setShowCrisisHelp((prev) => !prev)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                  showCrisisHelp ? 'bg-rose-100 text-rose-500 dark:bg-rose-950/40' : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]'
                }`}
                title="Экстренная помощь"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => sendPartnerMessage('Сова, помоги нам разобраться с этим.', false)}
                className="px-3 py-1.5 whitespace-nowrap rounded-full bg-[var(--surface-2)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white border border-[var(--divider)] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Позвать Сову в чат"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Позвать Сову</span>
              </button>
            )}
          </div>
        </div>

        {/* Mode Segment Switcher */}
        <div className="grid grid-cols-2 gap-1.5 mt-2 p-1 bg-[var(--surface-2)] rounded-2xl border border-[var(--divider)] shadow-2xs">
          <button
            type="button"
            id="chat-mode-solo"
            onClick={() => setOwlMode('solo')}
            className={`py-2 px-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              owlMode === 'solo'
                ? 'bg-[var(--surface-solid)] text-[var(--accent)] shadow-xs font-bold border border-[var(--accent)]/15 scale-101'
                : 'text-[var(--text-2)] hover:text-[var(--text)] font-semibold'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Соло (с Совой)</span>
          </button>
          <button
            type="button"
            id="chat-mode-together"
            onClick={() => setOwlMode('together')}
            className={`py-2 px-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              owlMode === 'together'
                ? 'bg-[var(--surface-solid)] text-[var(--accent)] shadow-xs font-bold border border-[var(--accent)]/15 scale-101'
                : 'text-[var(--text-2)] hover:text-[var(--text)] font-semibold'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Вместе (с {otherPartner.name})</span>
          </button>
        </div>
      </header>

      {/* Optional Crisis Help Drawer */}
      {showCrisisHelp && (
        <div className="shrink-0 p-3.5 mx-3 mt-2 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs sm:text-sm text-rose-700 dark:text-rose-300 space-y-1 animate-fadeIn font-normal">
          <div className="flex items-center gap-2 font-semibold">
            <PhoneCall className="w-4 h-4" />
            <span>Экстренная психологическая помощь</span>
          </div>
          <p className="text-xs leading-relaxed font-normal">
            Если вы переживаете острый кризис, обратитесь на бесплатную горячую линию: <b>8 (800) 200-01-22</b> (круглосуточно).
          </p>
        </div>
      )}

      {/* 2. MESSAGES SCROLL ZONE (The ONLY scrollable container on page) */}
      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-2 space-y-2.5 no-scrollbar"
      >
        {owlMode === 'solo' ? (
          aiMessages.map((msg) => {
            if (msg.isError) {
              return (
                <div
                  key={msg.id}
                  className="text-center text-xs sm:text-sm text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl my-2 shadow-2xs font-normal"
                >
                  {msg.content}
                </div>
              );
            }
            const isBot = msg.role === 'model' || msg.role === 'system';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[88%] px-4 py-3 rounded-2xl text-sm sm:text-base leading-relaxed ${
                    isBot
                      ? 'bg-[var(--surface)] text-[var(--text)] rounded-bl-xs border border-[var(--divider)] shadow-2xs font-normal'
                      : 'bg-[var(--accent)] text-white rounded-br-xs shadow-xs font-normal'
                  }`}
                >
                  {isBot ? (
                    <div className="space-y-1.5 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:space-y-1 [&_strong]:text-[var(--accent)] [&_strong]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--accent)] [&_blockquote]:pl-2.5 [&_blockquote]:italic">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                <span className="text-xs text-[var(--text-2)] mt-0.5 px-1 font-normal">
                  {isBot ? 'Сова' : msg.authorName || currentPartner.name}
                </span>
              </div>
            );
          })
        ) : (
          partnerMessages.map((msg) => {
            const cleanMsgSender = (msg.senderLogin || '').toLowerCase().trim().replace(/^@/, '');
            const cleanMyLogin = (currentUser?.login || '').toLowerCase().trim().replace(/^@/, '');
            const isBot = cleanMsgSender === 'ai' || cleanMsgSender === 'ai_owl' || msg.role === 'ai';
            const isMe = !isBot && (cleanMsgSender === cleanMyLogin || (!cleanMsgSender && msg.role === (currentPartnerId === 'partner1' ? 'partner1' : 'partner2')));
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] px-4 py-3 rounded-2xl text-sm sm:text-base leading-relaxed ${
                    isBot 
                      ? 'bg-[var(--surface)] text-[var(--text)] rounded-bl-xs border border-[var(--divider)] shadow-2xs font-normal'
                      : isMe
                      ? 'bg-[var(--accent)] text-white rounded-br-xs shadow-xs font-normal'
                      : 'bg-[var(--surface-2)] text-[var(--text)] rounded-bl-xs border border-[var(--divider)] shadow-2xs font-normal'
                  }`}
                >
                   {isBot ? (
                    <div className="space-y-1.5 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:space-y-1 [&_strong]:text-[var(--accent)] [&_strong]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--accent)] [&_blockquote]:pl-2.5 [&_blockquote]:italic">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                <span className="text-xs text-[var(--text-2)] mt-0.5 px-1 font-normal">
                  {isBot ? 'Сова' : isMe ? currentPartner.name : partnerDisplayName}
                </span>
              </div>
            );
          })
        )}

        {isAITyping && owlMode === 'solo' && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--text-2)] p-2.5 bg-[var(--surface)] rounded-2xl w-fit border border-[var(--divider)] animate-pulse shadow-2xs font-normal">
            <Bot className="w-4 h-4 text-[var(--accent)]" />
            <span>Сова формулирует бережный ответ...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. QUICK CHIPS: Single row horizontal scroll (hidden when keyboard open via .chat-chips) */}
      <div className="chat-chips shrink-0 flex gap-2 overflow-x-auto no-scrollbar px-3 py-2 bg-[var(--bg)] border-t border-[var(--divider)]/40">
        {promptChips.map((chip, idx) => {
          const IconComp = chip.icon;
          const token = getSemanticToken(chip.color as SemanticColorType);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handlePromptChipClick(chip.text)}
              className="shrink-0 px-3 py-1.5 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-2)] text-xs sm:text-sm font-semibold text-[var(--text)] border border-[var(--divider)] shadow-2xs transition-all active:scale-95 whitespace-nowrap flex items-center gap-2 cursor-pointer"
            >
              <div
                className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 text-white"
                style={{
                  background: token.gradient,
                  boxShadow: `inset 0 1px 1px rgba(255,255,255,0.4), 0 2px 4px ${token.glow}`,
                }}
              >
                <IconComp className="w-3 h-3 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]" />
              </div>
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. CRISIS NOTE: (hidden when keyboard open via .crisis-note) */}
      <p className="crisis-note shrink-0 text-xs text-center text-[var(--text-2)] py-1.5 opacity-80 bg-[var(--bg)] font-normal">
        В кризисной ситуации Сова предложит связаться со специалистом
      </p>

      {/* 5. INPUT BAR - Telegram Style */}
      <form
        onSubmit={handleSend}
        className={`shrink-0 flex items-center gap-2 px-3 py-2 bg-[var(--surface)] border-t border-[var(--divider)] backdrop-blur-md transition-all ${
          isInputFocused
            ? 'pb-2.5 shadow-md'
            : 'pb-[max(10px,calc(env(safe-area-inset-bottom,0px)+8px))]'
        }`}
      >
        <button
          type="button"
          onClick={toggleRecording}
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
            isRecording
              ? 'bg-rose-500 text-white animate-pulse'
              : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] active:scale-95'
          }`}
          title={isRecording ? 'Идёт запись...' : 'Голосовой ввод'}
        >
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          ref={inputRef}
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onFocus={() => {
            setIsInputFocused(true);
            document.body.classList.add('keyboard-open', 'keyboard-visible');
            setTimeout(() => scrollToBottom(true), 150);
          }}
          onBlur={() => {
            setIsInputFocused(false);
            setTimeout(() => {
              const isStillKeyboard = window.visualViewport && window.innerHeight - window.visualViewport.height > 100;
              if (!isStillKeyboard) {
                document.body.classList.remove('keyboard-open', 'keyboard-visible');
              }
            }, 200);
          }}
          placeholder={owlMode === 'solo' ? "Напишите сообщение Сове..." : "Напишите сообщение партнёру..."}
          className="flex-1 bg-[var(--surface-2)] px-3.5 py-2.5 text-base sm:text-[15px] font-normal rounded-xl text-[var(--text)] placeholder:text-[var(--text-2)] focus:outline-none focus:ring-1.5 focus:ring-[var(--accent)] border border-transparent focus:border-[var(--accent)]/30 transition-all"
        />

        <button
          type="submit"
          disabled={!inputMessage.trim() || (owlMode === 'solo' && isAITyping)}
          className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF453A] to-[#FF2D55] text-white flex items-center justify-center shrink-0 disabled:opacity-30 transition-all shadow-sm active:scale-95 hover:opacity-95"
          title="Отправить"
        >
          <Send className="w-4 h-4 fill-white" />
        </button>
      </form>

      </div>
    </PageLayout>
  );
};

