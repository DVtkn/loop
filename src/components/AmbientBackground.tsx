import React from 'react';
import { useCouple } from '../context/CoupleContext';

export const AmbientBackground: React.FC = () => {
  const { theme, activeTab } = useCouple();
  const isDark = theme === 'night';

  // Luminous, warm, and vibrant ambient romance accents by tab
  const getTabGradient = () => {
    switch (activeTab) {
      case 'us':
      case 'tests':
      case 'report':
      case 'care':
        return {
          glowPrimary: isDark ? 'rgba(255, 46, 99, 0.16)' : 'rgba(255, 46, 99, 0.085)',
          glowSecondary: isDark ? 'rgba(168, 85, 247, 0.14)' : 'rgba(244, 114, 182, 0.075)',
          glowTertiary: isDark ? 'rgba(236, 72, 153, 0.10)' : 'rgba(253, 164, 175, 0.07)',
        };
      case 'dates':
        return {
          glowPrimary: isDark ? 'rgba(255, 90, 50, 0.16)' : 'rgba(255, 90, 50, 0.085)',
          glowSecondary: isDark ? 'rgba(251, 146, 60, 0.14)' : 'rgba(253, 186, 116, 0.08)',
          glowTertiary: isDark ? 'rgba(255, 46, 99, 0.12)' : 'rgba(255, 99, 132, 0.07)',
        };
      case 'chat':
      case 'owl':
        return {
          glowPrimary: isDark ? 'rgba(255, 46, 99, 0.14)' : 'rgba(255, 46, 99, 0.075)',
          glowSecondary: isDark ? 'rgba(99, 102, 241, 0.14)' : 'rgba(129, 140, 248, 0.07)',
          glowTertiary: isDark ? 'rgba(236, 72, 153, 0.10)' : 'rgba(192, 132, 252, 0.06)',
        };
      case 'profile':
      case 'settings':
        return {
          glowPrimary: isDark ? 'rgba(255, 77, 121, 0.14)' : 'rgba(255, 77, 121, 0.075)',
          glowSecondary: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(252, 211, 77, 0.07)',
          glowTertiary: isDark ? 'rgba(255, 46, 99, 0.10)' : 'rgba(254, 205, 211, 0.06)',
        };
      default:
        // Dashboard / Home
        return {
          glowPrimary: isDark ? 'rgba(255, 46, 99, 0.16)' : 'rgba(255, 46, 99, 0.085)',
          glowSecondary: isDark ? 'rgba(251, 113, 133, 0.14)' : 'rgba(254, 205, 211, 0.08)',
          glowTertiary: isDark ? 'rgba(251, 146, 60, 0.12)' : 'rgba(254, 215, 170, 0.07)',
        };
    }
  };

  const currentGlow = getTabGradient();

  // HIGH PERFORMANCE RENDER: removed CSS blur filters which cause huge paint lag on mobile.
  // Using multi-stop radial gradients that render natively with zero compositing lag.
  return (
    <div
      id="app-ambient-background"
      className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0"
      aria-hidden="true"
    >
      {/* 1. Base Solid Theme Canvas */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: isDark ? '#0C0A0E' : '#FAF9F6',
        }}
      />

      {/* 2. Seamless, Luminous Diffused Ambient Mesh */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? `
              radial-gradient(ellipse 130% 75% at 50% -12%, ${currentGlow.glowPrimary} 0%, rgba(255, 46, 99, 0.04) 50%, transparent 80%),
              radial-gradient(ellipse 100% 65% at 90% 25%, ${currentGlow.glowSecondary} 0%, transparent 70%),
              radial-gradient(ellipse 110% 70% at 10% 80%, ${currentGlow.glowTertiary} 0%, transparent 75%)
            `
            : `
              radial-gradient(ellipse 130% 65% at 50% -10%, ${currentGlow.glowPrimary} 0%, rgba(255, 240, 243, 0.4) 50%, transparent 80%),
              radial-gradient(ellipse 95% 55% at 85% 20%, ${currentGlow.glowSecondary} 0%, transparent 68%),
              radial-gradient(ellipse 105% 65% at 15% 85%, ${currentGlow.glowTertiary} 0%, transparent 72%)
            `,
        }}
      />

      {/* 3. Minimal Apple Dot Grid Texture Overlay */}
      <div
        className={`absolute inset-0 apple-bg-grid pointer-events-none ${
          isDark ? 'opacity-15 mix-blend-screen' : 'opacity-12 mix-blend-soft-light'
        }`}
      />
    </div>
  );
};
