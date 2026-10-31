import React, { useState } from 'react';
import { LandingView } from './LandingView';
import {
  Heart,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  RotateCcw,
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext';

export const AuthView: React.FC = () => {
  const { authLogin, authRegister, authResetPassword } = useCouple();
  const [showLanding, setShowLanding] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const hasToken = localStorage.getItem('loop_auth_token');
      const hasUser = localStorage.getItem('loop_user_login');
      const hasSeen = localStorage.getItem('loop_seen_landing');
      return !hasToken && !hasUser && hasSeen !== 'true';
    } catch {
      return false;
    }
  });

  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [login, setLogin] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const cleanLogin = login.trim().toLowerCase().replace(/^@/, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await authLogin(login, password);
        if (!res.success) {
          setError(res.error || 'Ошибка входа');
        }
      } else if (mode === 'register') {
        const res = await authRegister(login, password, name || undefined, gender);
        if (!res.success) {
          setError(res.error || 'Ошибка регистрации');
        }
      } else if (mode === 'reset') {
        const res = await authResetPassword(login, password);
        if (!res.success) {
          setError(res.error || 'Ошибка сброса пароля');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Не удалось выполнить запрос');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickRegister = async () => {
    if (!cleanLogin || !password) return;
    setError(null);
    setIsLoading(true);
    try {
      const res = await authRegister(cleanLogin, password, name || cleanLogin, gender);
      if (!res.success) {
        setError(res.error || 'Ошибка создания аккаунта');
      }
    } catch (err: any) {
      setError(err?.message || 'Не удалось выполнить запрос');
    } finally {
      setIsLoading(false);
    }
  };

  if (showLanding) {
    return (
      <div className="h-full w-full overflow-y-auto bg-[var(--bg)] selection:bg-[var(--accent)]/20 selection:text-[var(--accent)]">
        <LandingView onEnterApp={() => {
          try {
            localStorage.setItem('loop_seen_landing', 'true');
          } catch {}
          setShowLanding(false);
        }} />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[var(--bg)] flex items-center justify-center p-4 sm:p-6 select-none overflow-y-auto relative">
      {/* Background ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[var(--accent)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--accent-2)]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md app-card p-6 sm:p-8 relative overflow-hidden z-10">
        {/* Glow Header Accent */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-[var(--accent)] opacity-15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-[var(--accent-2)] opacity-15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header Row with About App Link */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <button
            type="button"
            onClick={() => setShowLanding(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-2)] hover:text-[var(--accent)] transition-colors py-1.5 px-3 rounded-full bg-[var(--surface-2)] border border-[var(--divider)] shadow-2xs cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>О приложении</span>
          </button>
        </div>

        {/* Brand Icon & Name */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[var(--accent)] to-[var(--accent-hover)] text-white shadow-md mb-3">
            <Heart className="w-7 h-7 fill-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)] tracking-tight">
            Loop
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-2)] mt-1">
            Приватное пространство гармонии и сближения пары
          </p>
        </div>

        {/* Mode Tabs: Вход / Регистрация */}
        {mode !== 'reset' ? (
          <div className="grid grid-cols-2 p-1 bg-[var(--surface-2)] rounded-2xl border border-[var(--divider)] mb-5">
            <button
              id="auth-tab-login"
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`min-h-[44px] py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                mode === 'login'
                  ? 'bg-[var(--surface)] text-[var(--accent)] shadow-sm'
                  : 'text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              Вход
            </button>
            <button
              id="auth-tab-register"
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`min-h-[44px] py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                mode === 'register'
                  ? 'bg-[var(--surface)] text-[var(--accent)] shadow-sm'
                  : 'text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              Регистрация
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2.5 bg-[var(--surface-2)] rounded-2xl border border-[var(--divider)] mb-5">
            <div className="flex items-center gap-2 pl-2 text-xs font-bold text-[var(--text)]">
              <KeyRound className="w-4 h-4 text-[var(--accent)]" />
              <span>Восстановление / Сброс пароля</span>
            </div>
            <button
              id="auth-back-to-login-btn"
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className="min-h-[44px] text-xs text-[var(--accent)] font-bold px-3 py-1 flex items-center hover:underline"
            >
              Назад
            </button>
          </div>
        )}

        {/* Error Alert with Smart Quick Actions */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex flex-col gap-2.5 animate-shake">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>

            {/* If Account Not Found: 1-click register */}
            {(error.includes('не найден') || error.includes('Не найден')) && mode === 'login' && (
              <div className="pt-2 border-t border-red-500/20 flex flex-col gap-1.5">
                <button
                  id="auth-quick-register-btn"
                  type="button"
                  onClick={handleQuickRegister}
                  disabled={isLoading || !cleanLogin || !password}
                  className="w-full min-h-[44px] py-2 px-3 rounded-xl bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Создать аккаунт @{cleanLogin || 'логин'} прямо сейчас</span>
                </button>
              </div>
            )}

            {/* If Wrong Password: offer reset */}
            {error.includes('парол') && mode === 'login' && (
              <button
                id="auth-error-reset-password-btn"
                type="button"
                onClick={() => {
                  setMode('reset');
                  setError(null);
                }}
                className="self-start text-[11px] font-bold text-[var(--accent)] underline hover:opacity-80 mt-0.5 min-h-[44px] flex items-center"
              >
                Забыли пароль? Нажмите здесь, чтобы задать новый пароль →
              </button>
            )}

            {/* If Already Exists in register mode */}
            {(error.includes('занят') || error.includes('зарегистрирован') || error.includes('существует')) && mode === 'register' && (
              <button
                id="auth-error-switch-to-login-btn"
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="self-start text-[11px] font-bold text-[var(--accent)] underline hover:opacity-80 mt-0.5 min-h-[44px] flex items-center"
              >
                Перейти ко входу с логином @{cleanLogin} →
              </button>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Login Field */}
          <div>
            <label
              htmlFor="auth-login-input"
              className="block text-[11px] font-bold text-[var(--text-2)] mb-1.5"
            >
              Логин
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-2)]">
                <span className="font-bold text-sm">@</span>
              </div>
              <input
                id="auth-login-input"
                type="text"
                required
                autoComplete="username"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full min-h-[44px] pl-8 pr-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--divider)] text-sm font-semibold text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            {mode === 'register' && (
              <p className="text-[10px] text-[var(--text-2)] mt-1.5">
                По этому логину ваш партнёр сможет найти и добавить вас в пару
              </p>
            )}
            {mode === 'reset' && (
              <p className="text-[10px] text-[var(--text-2)] mt-1.5">
                Укажите ваш логин для обновления пароля
              </p>
            )}
          </div>

          {/* Optional Name & Gender in Register Mode */}
          {mode === 'register' && (
            <div className="space-y-3 pt-1 border-t border-[var(--divider)]">
              <div>
                <label
                  htmlFor="auth-name-input"
                  className="block text-[11px] font-bold text-[var(--text-2)] mb-1.5"
                >
                  Как к вам обращаться (Имя)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-2)]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-name-input"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full min-h-[44px] pl-9 pr-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--divider)] text-sm font-semibold text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              </div>

              {/* Gender Selector */}
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-2)] mb-1.5">
                  Тип аккаунта (Пол)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="auth-gender-male-btn"
                    type="button"
                    onClick={() => setGender('male')}
                    className={`min-h-[44px] py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      gender === 'male'
                        ? 'bg-[var(--accent-blue)]/15 border-[var(--accent-blue)] text-[var(--accent-blue)] ring-1 ring-[var(--accent-blue)]/30'
                        : 'bg-[var(--surface-2)] border-[var(--divider)] text-[var(--text-2)] hover:text-[var(--text)]'
                    }`}
                  >
                    <User className="w-4 h-4 text-blue-500" />
                    <span>Мужской (Он)</span>
                  </button>

                  <button
                    id="auth-gender-female-btn"
                    type="button"
                    onClick={() => setGender('female')}
                    className={`min-h-[44px] py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      gender === 'female'
                        ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)] ring-1 ring-[var(--accent)]/30'
                        : 'bg-[var(--surface-2)] border-[var(--divider)] text-[var(--text-2)] hover:text-[var(--text)]'
                    }`}
                  >
                    <User className="w-4 h-4 text-rose-500" />
                    <span>Женский (Она)</span>
                  </button>
                </div>
                <p className="text-[10px] text-[var(--text-2)] mt-1.5">
                  Позволяет Сове и радару персонализировать рекомендации и динамику пары
                </p>
              </div>
            </div>
          )}

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="auth-password-input"
                className="block text-[11px] font-bold text-[var(--text-2)]"
              >
                {mode === 'reset' ? 'Новый пароль' : 'Пароль'}
              </label>
              {mode === 'login' && (
                <button
                  id="auth-forgot-password-btn"
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    setError(null);
                  }}
                  className="min-h-[36px] px-1 text-[10px] font-bold text-[var(--accent)] hover:underline flex items-center"
                >
                  Забыли пароль?
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-2)]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="auth-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[44px] pl-9 pr-11 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--divider)] text-sm font-semibold text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
              <button
                id="auth-toggle-password-btn"
                type="button"
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 w-11 h-full min-h-[44px] flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[48px] mt-3 py-3 px-4 rounded-xl apple-btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>
              {mode === 'register'
                ? 'Создать аккаунт'
                : mode === 'reset'
                ? 'Сохранить новый пароль и войти'
                : 'Войти в аккаунт'}
            </span>
            {mode === 'reset' ? <RotateCcw className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Footer Mode Switch */}
        <div className="mt-5 pt-4 border-t border-[var(--divider)] text-center">
          {mode === 'register' ? (
            <p className="text-xs text-[var(--text-2)]">
              Уже есть аккаунт?{' '}
              <button
                id="auth-switch-to-login-btn"
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="font-bold text-[var(--accent)] hover:underline ml-1 min-h-[44px] inline-flex items-center"
              >
                Войти
              </button>
            </p>
          ) : mode === 'reset' ? (
            <p className="text-xs text-[var(--text-2)]">
              Вспомнили пароль?{' '}
              <button
                id="auth-switch-back-to-login-btn"
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="font-bold text-[var(--accent)] hover:underline ml-1 min-h-[44px] inline-flex items-center"
              >
                Вернуться ко входу
              </button>
            </p>
          ) : (
            <p className="text-xs text-[var(--text-2)]">
              Впервые в Loop?{' '}
              <button
                id="auth-switch-to-register-btn"
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="font-bold text-[var(--accent)] hover:underline ml-1 min-h-[44px] inline-flex items-center"
              >
                Создать аккаунт
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
