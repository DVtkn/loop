import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Award, Star, Moon, Sun, Bell, BellRing, Lock, Download, 
  RotateCcw, LogOut, Edit2, Heart, UserPlus, Copy, CheckCircle2, ChevronRight, ShieldCheck
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext';
import { getPushStatus, requestPushPermission, triggerLocalTestPush } from '../utils/pushManager';
import { PageLayout } from './ui/PageLayout';
import { StatTile, ActionRow, PrimaryCTA, CarouselTile, CarouselItem } from './ui/SystemBlocks';
import { IOSInstallPrompt } from './IOSInstallPrompt';

export const SettingsView: React.FC = () => {
  const {
    currentUser, coupleProfile, currentPartnerId,
    theme, setTheme, coupleXP, coupleLevelInfo,
    updateUserProfile, authLogout, changePassword,
    sendPairRequestByLogin, incomingRequests, acceptPairRequest, rejectPairRequest, disconnectPair, resetTests,
    loadDemoCouple, triggerConfetti, setActiveTab: setAppActiveTab
  } = useCouple();

  const isPaired = !!currentUser?.partnerLogin;
  const otherPartner = currentPartnerId === 'partner1' ? coupleProfile.partner2 : coupleProfile.partner1;

  // Modals / State
  const [showEditName, setShowEditName] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser?.name || '');
  const [showPairModal, setShowPairModal] = useState(false);
  const [targetLogin, setTargetLogin] = useState('');
  const [pairMessage, setPairMessage] = useState<{ text: string; isError: boolean } | null>(null);
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showResetTestsModal, setShowResetTestsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showIOSHelper, setShowIOSHelper] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  
  const pushStatus = getPushStatus();

  // Actions
  const handleSaveName = async () => {
    if (nameInput.trim()) {
      await updateUserProfile({ name: nameInput.trim() });
      setShowEditName(false);
    }
  };

  const handlePair = async () => {
    const res = await sendPairRequestByLogin(targetLogin);
    setPairMessage({ text: res.message || res.error || '', isError: !res.success });
    if (res.success) setTargetLogin('');
  };

  const handleChangePassword = async () => {
    const res = await changePassword(oldPassword, newPassword);
    setPasswordMsg({ text: res.success ? 'Пароль изменён' : (res.error || 'Ошибка'), isError: !res.success });
    if (res.success) {
      setTimeout(() => setShowPasswordModal(false), 1500);
    }
  };

  const handleDisconnect = async () => {
    await disconnectPair();
    setShowDisconnectModal(false);
  };

  const handleResetTests = () => {
    resetTests();
    setShowResetTestsModal(false);
    triggerConfetti();
  };

  const handleEnablePush = async () => {
    if (pushStatus.isIOS && !pushStatus.isStandalone) {
      setShowIOSHelper(true);
      return;
    }
    const res = await requestPushPermission(currentUser?.id, coupleProfile?.id);
    if (res === 'granted') {
      triggerConfetti();
      triggerLocalTestPush('Loop', 'Уведомления включены!');
    }
  };

  const handleCopyLinkCode = async () => {
    const inviteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://loopza.vercel.app';
    const code = coupleProfile.linkCode || '';
    const text = `Привет! Давай подключимся в приложении Loop для нашей пары: ${inviteUrl}\nКод сопряжения: ${code}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Код сопряжения Loop',
          text,
          url: inviteUrl,
        });
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch {}
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleExportData = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(coupleProfile, null, 2));
      const a = document.createElement('a');
      a.href = dataStr;
      a.download = `loop-data-${coupleProfile.id}.json`;
      a.click();
    } catch {}
  };

  // Carousel Items
  const settingsItems: CarouselItem[] = [
    { id: 'theme', icon: theme === 'night' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />, title: 'Тема', onClick: () => setTheme(theme === 'night' ? 'aurora' : 'night'), color: 'warmth' },
    { id: 'push', icon: pushStatus.permission === 'granted' ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />, title: 'Уведомления', onClick: handleEnablePush, color: 'time' },
    { id: 'password', icon: <Lock className="w-5 h-5" />, title: 'Пароль', onClick: () => setShowPasswordModal(true), color: 'dialogue' },
    { id: 'export', icon: <Download className="w-5 h-5" />, title: 'Экспорт', onClick: handleExportData, color: 'care' },
    { id: 'reset', icon: <RotateCcw className="w-5 h-5" />, title: 'Сброс тестов', onClick: () => setShowResetTestsModal(true), color: 'mood' },
    { id: 'privacy', icon: <ShieldCheck className="w-5 h-5" />, title: 'Приватность', onClick: () => setShowPrivacyModal(true), color: 'dialogue' },
    { id: 'demo', icon: <Sparkles className="w-5 h-5" />, title: 'Демо-режим', onClick: loadDemoCouple, color: 'gamification' },
    { id: 'logout', icon: <LogOut className="w-5 h-5" />, title: 'Выйти', onClick: authLogout, color: 'warmth' }
  ];

  return (
    <PageLayout title="Профиль" hideHeader>
      <div className="pt-2 px-4 sm:px-6 space-y-4 pb-8">
        
        {/* Block 1: Stat Grid */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <StatTile 
            icon={<Award className="w-6 h-6" />} 
            value={coupleLevelInfo.level}
            label={coupleLevelInfo.levelName}
            color="gamification"
          />
          <StatTile 
            icon={<Star className="w-6 h-6" />} 
            value={coupleXP}
            label="Опыт пары"
            color="mood"
          />
        </div>

        {/* Block 2: Action Rows Group (Max 2) */}
        <div className="rounded-2xl overflow-hidden shadow-xs space-y-2">
          <ActionRow 
            icon={<Edit2 className="w-4 h-4" />}
            title={currentUser?.name || 'Мой профиль'}
            value={`@${currentUser?.login}`}
            onClick={() => setShowEditName(true)}
            color="dialogue"
          />
          {isPaired ? (
            <ActionRow 
              icon={<Heart className="w-4 h-4" />}
              title={(otherPartner?.name && otherPartner.name !== 'Партнёр не подключён' && otherPartner.name !== 'Партнёр 1' && otherPartner.name !== 'Партнёр 2') ? otherPartner.name : `@${currentUser?.partnerLogin}`}
              value="В союзе"
              onClick={() => setShowDisconnectModal(true)}
              color="warmth"
            />
          ) : (
            <ActionRow 
              icon={<UserPlus className="w-4 h-4" />}
              title="Пара не создана"
              value="Связать"
              onClick={() => setShowPairModal(true)}
              color="warmth"
            />
          )}
        </div>

        {/* Block 2.5: Incoming Requests */}
        {incomingRequests && incomingRequests.length > 0 && (
          <div className="rounded-2xl overflow-hidden shadow-xs space-y-2 mt-4 bg-[var(--surface-2)] border border-[var(--divider)] p-4">
            <h4 className="text-xs font-bold text-[var(--text-2)] mb-2">
              Входящие запросы в пару
            </h4>
            <div className="space-y-2">
              {incomingRequests.map((req) => (
                <div key={req.id} className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--divider)] flex items-center justify-between shadow-xs">
                  <div>
                    <p className="text-sm font-bold text-[var(--text)]">@{req.fromLogin}</p>
                    <p className="text-[11px] text-[var(--text-3)] font-medium">Хочет создать союз</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => acceptPairRequest(req.fromLogin)} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold transition-colors hover:bg-emerald-500/20 active:scale-95">Принять</button>
                    <button onClick={() => rejectPairRequest(req.fromLogin)} className="px-3 py-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold transition-colors hover:bg-rose-500/20 active:scale-95">Скрыть</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Block 3: Primary CTA */}
        <PrimaryCTA 
          icon={copiedCode ? <CheckCircle2 className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
          title={copiedCode ? "Скопировано!" : "Код для связи"}
          subtitle={`Ваш код: ${coupleProfile.linkCode || '@' + currentUser?.login}`}
          color="gamification"
          onClick={handleCopyLinkCode}
        />

        {/* Block 4: Carousel Settings */}
        <CarouselTile items={settingsItems} title="Настройки системы" />

      </div>

      {/* MODALS */}
      
      {/* Edit Name Modal */}
      {showEditName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--divider)] p-5 shadow-2xl">
            <h3 className="text-lg font-black text-[var(--text)] mb-4">Мой профиль</h3>
            <input 
              type="text" 
              value={nameInput} 
              onChange={e => setNameInput(e.target.value)} 
              className="w-full bg-[var(--surface-2)] border border-[var(--divider)] rounded-xl px-4 py-3 text-[var(--text)] font-medium outline-none focus:border-[var(--accent)] mb-4"
              placeholder="Ваше имя"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowEditName(false)} className="flex-1 py-3 rounded-xl bg-[var(--surface-2)] font-bold text-sm text-[var(--text)]">Отмена</button>
              <button onClick={handleSaveName} className="flex-1 py-3 rounded-xl bg-[var(--accent)] font-bold text-sm text-white">Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Pair Modal */}
      {showPairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--divider)] p-5 shadow-2xl">
            <h3 className="text-lg font-black text-[var(--text)] mb-1">Создать союз</h3>
            <p className="text-xs font-medium text-[var(--text-2)] mb-4">Введите логин партнёра для связи аккаунтов.</p>
            <input 
              type="text" 
              value={targetLogin} 
              onChange={e => setTargetLogin(e.target.value)} 
              className="w-full bg-[var(--surface-2)] border border-[var(--divider)] rounded-xl px-4 py-3 text-[var(--text)] font-medium outline-none focus:border-[var(--accent)] mb-2"
              placeholder="Логин партнёра"
            />
            {pairMessage && <p className={`text-xs font-bold mb-4 ${pairMessage.isError ? 'text-rose-500' : 'text-emerald-500'}`}>{pairMessage.text}</p>}
            <div className="flex gap-2 mt-2">
              <button onClick={() => setShowPairModal(false)} className="flex-1 py-3 rounded-xl bg-[var(--surface-2)] font-bold text-sm text-[var(--text)]">Отмена</button>
              <button onClick={handlePair} className="flex-1 py-3 rounded-xl bg-[var(--accent)] font-bold text-sm text-white">Отправить</button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--divider)] p-5 shadow-2xl space-y-3">
            <h3 className="text-lg font-black text-[var(--text)] mb-2">Изменить пароль</h3>
            <input 
              type="password" 
              value={oldPassword} 
              onChange={e => setOldPassword(e.target.value)} 
              className="w-full bg-[var(--surface-2)] border border-[var(--divider)] rounded-xl px-4 py-3 text-[var(--text)] font-medium outline-none"
              placeholder="Текущий пароль"
            />
            <input 
              type="password" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              className="w-full bg-[var(--surface-2)] border border-[var(--divider)] rounded-xl px-4 py-3 text-[var(--text)] font-medium outline-none"
              placeholder="Новый пароль"
            />
            {passwordMsg && <p className={`text-xs font-bold ${passwordMsg.isError ? 'text-rose-500' : 'text-emerald-500'}`}>{passwordMsg.text}</p>}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 rounded-xl bg-[var(--surface-2)] font-bold text-sm text-[var(--text)]">Отмена</button>
              <button onClick={handleChangePassword} className="flex-1 py-3 rounded-xl bg-[var(--accent)] font-bold text-sm text-white">Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-rose-500/30 p-5 shadow-2xl">
            <h3 className="text-lg font-black text-[var(--text)] mb-2">Разорвать союз?</h3>
            <p className="text-xs font-medium text-[var(--text-2)] mb-4">Вы уверены, что хотите разорвать связь с партнёром? Это действие отключит вас друг от друга.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDisconnectModal(false)} className="flex-1 py-3 rounded-xl bg-[var(--surface-2)] font-bold text-sm text-[var(--text)]">Отмена</button>
              <button onClick={handleDisconnect} className="flex-1 py-3 rounded-xl bg-rose-500 font-bold text-sm text-white">Разорвать</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Tests Modal */}
      {showResetTestsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--divider)] p-5 shadow-2xl">
            <h3 className="text-lg font-black text-[var(--text)] mb-2">Сбросить тесты?</h3>
            <p className="text-xs font-medium text-[var(--text-2)] mb-4">Ответы для всех тестов будут очищены.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowResetTestsModal(false)} className="flex-1 py-3 rounded-xl bg-[var(--surface-2)] font-bold text-sm text-[var(--text)]">Отмена</button>
              <button onClick={handleResetTests} className="flex-1 py-3 rounded-xl bg-amber-500 font-bold text-sm text-white">Сбросить</button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy & Security Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl bg-[var(--surface)] border border-[var(--divider)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[var(--text)]">Приватность и безопасность</h3>
                <p className="text-[11px] text-[var(--text-2)]">Защита личного пространства вашей пары</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[var(--text-2)] leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)] space-y-1">
                <p className="font-bold text-[var(--text)]">1. Изоляция данных пары</p>
                <p>Все ваши ответы на тесты, заметки, фото и переписка изолированы и доступны строго двум авторизованным партнёрам союза. Доступ посторонних лиц исключён (IDOR-валидация).</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)] space-y-1">
                <p className="font-bold text-[var(--text)]">2. Криптографическая защита</p>
                <p>Пароли хэшируются с солью односторонним алгоритмом bcrypt. Данные передаются исключительно по защищённому протоколу TLS/HTTPS.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)] space-y-1">
                <p className="font-bold text-[var(--text)]">3. ИИ-психолог Сова</p>
                <p>Запросы к ИИ обезличены. Ваши приватные диалоги не используются для дообучения публичных нейросетей.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--divider)] space-y-1">
                <p className="font-bold text-[var(--text)]">4. Право на удаление и экспорт</p>
                <p>Вы в любой момент можете скачать полную копию данных в JSON через кнопку «Экспорт» или разорвать союз и удалить историю.</p>
              </div>
            </div>

            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full py-3.5 rounded-xl bg-[var(--accent)] font-bold text-xs text-white shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              Понятно и безопасно
            </button>
          </div>
        </div>
      )}

      <IOSInstallPrompt forceOpen={showIOSHelper} onClose={() => setShowIOSHelper(false)} />
    </PageLayout>
  );
};
