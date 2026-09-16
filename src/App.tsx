import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CoupleProvider, useCouple } from './context/CoupleContext.tsx';
import { Header } from './components/Header.tsx';
import { Navigation } from './components/Navigation.tsx';
import { AuthView } from './components/AuthView.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { IOSInstallPrompt } from './components/IOSInstallPrompt.tsx';
import { AmbientBackground } from './components/AmbientBackground.tsx';
import { NavigationTab } from './types.ts';
import { PartnerTouchToast } from './components/PartnerTouchToast.tsx';

// Code splitting / lazy loading for non-initial views
const UsView = lazy(() => import('./components/UsView.tsx').then((m) => ({ default: m.UsView })));
const DatesView = lazy(() => import('./components/DatesView.tsx').then((m) => ({ default: m.DatesView })));
const ChatView = lazy(() => import('./components/ChatView.tsx').then((m) => ({ default: m.ChatView })));
const SettingsView = lazy(() => import('./components/SettingsView.tsx').then((m) => ({ default: m.SettingsView })));
const TestsView = lazy(() => import('./components/TestsView.tsx').then((m) => ({ default: m.TestsView })));
const CareBaseView = lazy(() => import('./components/CareBaseView.tsx').then((m) => ({ default: m.CareBaseView })));
const DeepTalkView = lazy(() => import('./components/DeepTalkView.tsx').then((m) => ({ default: m.DeepTalkView })));
const AchievementsModal = lazy(() => import('./components/AchievementsModal.tsx').then((m) => ({ default: m.AchievementsModal })));
const OnboardingViewLazy = lazy(() => import('./components/OnboardingView.tsx').then((m) => ({ default: m.OnboardingView })));

const ViewLoadingFallback: React.FC = () => (
  <div className="flex-1 flex items-center justify-center min-h-[300px] p-6 animate-pulse">
    <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
  </div>
);

const MainLayout: React.FC = () => {
  const { isOnboarded, currentUser, activeTab, setActiveTab, activePartnerTouch, dismissPartnerTouch, sendTouchAction } = useCouple();
  const [showAchievementsModal, setShowAchievementsModal] = useState<boolean>(false);

  // Hook to handle visualViewport height & keyboard open state like Telegram
  useEffect(() => {
    const isChat = activeTab === 'chat' || activeTab === 'owl';
    document.body.classList.toggle('in-chat-view', isChat);
  }, [activeTab]);

  useEffect(() => {
    const handleViewport = () => {
      const vv = window.visualViewport;
      if (vv) {
        document.documentElement.style.setProperty('--viewport-height', `${vv.height}px`);
        document.documentElement.style.setProperty('--viewport-offset-top', `${vv.offsetTop}px`);
        
        const isKeyboard =
          window.innerHeight - vv.height > 100 ||
          (typeof window.screen !== 'undefined' && window.screen.height - vv.height > 200 && vv.height < window.innerHeight * 0.88);
        document.body.classList.toggle('keyboard-open', !!isKeyboard);
        document.body.classList.toggle('keyboard-visible', !!isKeyboard);
      } else {
        document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
        document.documentElement.style.setProperty('--viewport-offset-top', '0px');
      }
    };

    handleViewport();
    window.visualViewport?.addEventListener('resize', handleViewport);
    window.visualViewport?.addEventListener('scroll', handleViewport);
    window.addEventListener('resize', handleViewport);
    window.addEventListener('orientationchange', handleViewport);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewport);
      window.visualViewport?.removeEventListener('scroll', handleViewport);
      window.removeEventListener('resize', handleViewport);
      window.removeEventListener('orientationchange', handleViewport);
    };
  }, []);

  if (!currentUser) {
    return (
      <div className="h-full w-full text-[var(--text)] selection:bg-[var(--accent)]/20 selection:text-[var(--accent)] transition-colors overflow-hidden relative">
        <AmbientBackground />
        <AuthView />
        <IOSInstallPrompt />
      </div>
    );
  }
  if (!isOnboarded) {
    return (
      <div className="h-full w-full text-[var(--text)] selection:bg-[var(--accent)]/20 selection:text-[var(--accent)] transition-colors overflow-hidden relative">
        <AmbientBackground />
        <Suspense fallback={<ViewLoadingFallback />}>
          <OnboardingViewLazy onComplete={() => {}} />
        </Suspense>
        <IOSInstallPrompt />
      </div>
    );
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
      case 'dashboard':
        return <DashboardView setActiveTab={setActiveTab} />;
      case 'us':
        return (
          <Suspense fallback={<ViewLoadingFallback />}>
            <UsView />
          </Suspense>
        );
      case 'tests':
        return (
          <Suspense fallback={<ViewLoadingFallback />}>
            <TestsView initialMode="catalog" />
          </Suspense>
        );
      case 'report':
        return (
          <Suspense fallback={<ViewLoadingFallback />}>
            <TestsView initialMode="report" />
          </Suspense>
        );
      case 'care':
        return (
          <Suspense fallback={<ViewLoadingFallback />}>
            <CareBaseView />
          </Suspense>
        );
      case 'deeptalk':
        return (
          <Suspense fallback={<ViewLoadingFallback />}>
            <DeepTalkView onBack={() => setActiveTab('us')} />
          </Suspense>
        );
      case 'dates':
        return (
          <Suspense fallback={<ViewLoadingFallback />}>
            <DatesView />
          </Suspense>
        );
      case 'chat':
      case 'owl':
        return (
          <Suspense fallback={<ViewLoadingFallback />}>
            <ChatView />
          </Suspense>
        );
      case 'profile':
      case 'settings':
        return (
          <Suspense fallback={<ViewLoadingFallback />}>
            <SettingsView />
          </Suspense>
        );
      default:
        return <DashboardView setActiveTab={setActiveTab} />;
    }
  };

  const isChatTab = activeTab === 'chat' || activeTab === 'owl';

  return (
    <div className="h-full w-full text-[var(--text)] flex font-sans selection:bg-[var(--accent)]/20 selection:text-[var(--accent)] transition-colors overflow-hidden relative">
      {/* Dynamic Apple Ambient Aurora Mesh Background */}
      <AmbientBackground />
      
      {/* Sidebar Navigation for Desktop */}
      <div className="hidden md:flex shrink-0">
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onTabChange={setActiveTab}
          onOpenAchievements={() => setShowAchievementsModal(true)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-0">
        {!isChatTab && (
          <div className="shrink-0 z-10">
            <Header 
              onOpenAchievements={() => setShowAchievementsModal(true)}
              onOpenSettings={() => setActiveTab('profile')}
            />
          </div>
        )}

        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={isChatTab ? 'chat' : activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="flex-1 flex flex-col min-h-0 h-full w-full"
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
        
        {/* Mobile Navigation Tab Bar */}
        <div className="md:hidden shrink-0 z-10">
          <Navigation 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            onTabChange={setActiveTab}
            onOpenAchievements={() => setShowAchievementsModal(true)}
          />
        </div>
      </div>
      
      {/* iOS Home Screen Install Helper Banner */}
      <IOSInstallPrompt />

      {/* Real-time Partner Touch In-App Toast */}
      <PartnerTouchToast
        touch={activePartnerTouch}
        onDismiss={dismissPartnerTouch}
        onSendBack={() => {
          sendTouchAction('hug', {
            title: `${currentUser.name} отправил(а) объятие в ответ`,
            subtitle: 'Взаимное нежное касание ❤️',
          });
          dismissPartnerTouch();
        }}
      />

      <AnimatePresence>
        {showAchievementsModal && (
          <Suspense fallback={null}>
            <AchievementsModal
              isOpen={showAchievementsModal}
              onClose={() => setShowAchievementsModal(false)}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <CoupleProvider>
      <MainLayout />
    </CoupleProvider>
  );
}
