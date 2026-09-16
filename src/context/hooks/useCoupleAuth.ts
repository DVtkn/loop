import { useState } from 'react';
import { apiFetch } from '../../utils/api.ts';
import { UserAccount, PairRequest } from '../../types.ts';
import { safeGetStorage, safeSetStorage } from '../../utils/safeStorage.ts';

export interface UseCoupleAuthReturn {
  accountsDb: Record<string, UserAccount & { password?: string }>;
  setAccountsDb: React.Dispatch<React.SetStateAction<Record<string, UserAccount & { password?: string }>>>;
  currentUser: UserAccount | null;
  setCurrentUserState: React.Dispatch<React.SetStateAction<UserAccount | null>>;
  setCurrentUser: (user: UserAccount | null) => void;
  allUsers: UserAccount[];
  isOnboarded: boolean;
  setIsOnboardedState: React.Dispatch<React.SetStateAction<boolean>>;
  setIsOnboarded: (val: boolean) => void;
  authRegister: (
    login: string,
    pass: string,
    name?: string,
    gender?: 'male' | 'female',
    avatarEmoji?: string
  ) => Promise<{ success: boolean; error?: string }>;
  authLogin: (login: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  authResetPassword: (login: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  authLogout: () => void;
  switchAccount: (targetLogin: string) => void;
  updateCoupleStartDate: (date: string) => Promise<void>;
  updateUserProfile: (fields: Partial<UserAccount>) => Promise<void>;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
}

export function useCoupleAuth(
  triggerConfetti: () => void,
  setPairRequests: React.Dispatch<React.SetStateAction<PairRequest[]>>,
  onRegisterResetState?: (safeUser: UserAccount) => void,
  onLogoutResetState?: () => void
): UseCoupleAuthReturn {
  const [accountsDb, setAccountsDb] = useState<Record<string, UserAccount & { password?: string }>>(() => {
    const saved = safeGetStorage<Record<string, UserAccount & { password?: string }>>(
      'together_accounts_registry',
      {}
    );
    const cleaned: Record<string, UserAccount & { password?: string }> = {};
    if (saved && typeof saved === 'object') {
      for (const [k, v] of Object.entries(saved)) {
        if (k !== 'alex' && k !== 'masha' && k !== 'ivan' && k !== 'olga' && v) {
          cleaned[k] = v;
        }
      }
    }
    return cleaned;
  });

  const [currentUser, setCurrentUserState] = useState<UserAccount | null>(() => {
    const saved = safeGetStorage<UserAccount | null>('together_current_user', null);
    if (saved && saved.login) return saved;
    return null;
  });

  const [isOnboarded, setIsOnboardedState] = useState<boolean>(() => {
    return safeGetStorage('together_onboarded', false);
  });

  const setIsOnboarded = (val: boolean) => {
    setIsOnboardedState(val);
    safeSetStorage('together_onboarded', val);
  };

  const setCurrentUser = (user: UserAccount | null) => {
    setCurrentUserState(user);
    safeSetStorage('together_current_user', user);
  };

  const allUsers = Object.values(accountsDb).map(({ password: _, ...u }) => u);

  const authRegister = async (
    login: string,
    pass: string,
    name?: string,
    gender?: 'male' | 'female',
    avatarEmoji?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanLogin = login.trim().toLowerCase().replace(/^@/, '');
    const cleanPass = pass.trim();
    if (!cleanLogin || cleanLogin.length < 2) {
      return { success: false, error: 'Логин должен содержать минимум 2 символа' };
    }
    if (!cleanPass || cleanPass.length < 3) {
      return { success: false, error: 'Пароль должен содержать минимум 3 символа' };
    }

    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: cleanLogin,
          password: cleanPass,
          name: name?.trim() || cleanLogin,
          gender: gender,
          avatarEmoji: avatarEmoji || (gender === 'female' ? 'female' : gender === 'male' ? 'male' : 'user'),
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // non-JSON response (e.g. gateway error HTML or plain text)
      }

      if (!res.ok) {
        return { success: false, error: data?.error || (res.status === 500 ? 'Ошибка сервера при регистрации' : 'Ошибка при регистрации') };
      }

      const safeUser: UserAccount = data.user;
      if (data.token) {
        safeSetStorage('loop_auth_token', data.token);
      }
      let updatedDb = { ...accountsDb, [cleanLogin]: safeUser };
      if (data.partner) {
        updatedDb[data.partner.login.toLowerCase()] = data.partner;
      }
      setAccountsDb(updatedDb);
      safeSetStorage('together_accounts_registry', updatedDb);

      setCurrentUser(safeUser);

      if (!data.alreadyExisted && onRegisterResetState) {
        onRegisterResetState(safeUser);
      } else {
        apiFetch(`/api/pair/status/${cleanLogin}`)
          .then((r) => r.json())
          .then((statusData) => {
            if (statusData.incomingRequests) {
              setPairRequests((prev) => {
                const others = prev.filter((r) => r.toLogin.toLowerCase() !== cleanLogin);
                const merged = [...others, ...statusData.incomingRequests, ...(statusData.outgoingRequests || [])];
                safeSetStorage('together_pair_requests', merged);
                return merged;
              });
            }
          })
          .catch(() => {});
      }

      triggerConfetti();
      return { success: true };
    } catch {
      return { success: false, error: 'Не удалось связаться с сервером. Попробуйте снова.' };
    }
  };

  const authLogin = async (login: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanLogin = login.trim().toLowerCase().replace(/^@/, '');
    const cleanPass = pass.trim();

    if (!cleanLogin || !cleanPass) {
      return { success: false, error: 'Заполните логин и пароль' };
    }

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: cleanLogin, password: cleanPass }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // non-JSON response
      }

      if (!res.ok) {
        return { success: false, error: data?.error || (res.status === 500 ? 'Ошибка сервера при входе' : 'Неверный логин или пароль') };
      }

      const safeUser: UserAccount = data.user;
      if (data.token) {
        safeSetStorage('loop_auth_token', data.token);
      }
      let updatedDb = { ...accountsDb, [cleanLogin]: safeUser };
      if (data.partner) {
        updatedDb[data.partner.login.toLowerCase()] = data.partner;
      }
      setAccountsDb(updatedDb);
      safeSetStorage('together_accounts_registry', updatedDb);

      setCurrentUser(safeUser);
      setIsOnboarded(true);
      triggerConfetti();

      apiFetch(`/api/pair/status/${cleanLogin}`)
        .then((r) => r.json())
        .then((statusData) => {
          if (statusData.incomingRequests) {
            setPairRequests((prev) => {
              const others = prev.filter((r) => r.toLogin.toLowerCase() !== cleanLogin);
              const merged = [...others, ...statusData.incomingRequests, ...(statusData.outgoingRequests || [])];
              safeSetStorage('together_pair_requests', merged);
              return merged;
            });
          }
        })
        .catch(() => {});

      return { success: true };
    } catch {
      return {
        success: false,
        error: 'Не удалось связаться с сервером. Проверьте подключение к сети.',
      };
    }
  };

  const authResetPassword = async (login: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanLogin = login.trim().toLowerCase().replace(/^@/, '');
    const cleanNewPass = newPass.trim();

    if (!cleanLogin) return { success: false, error: 'Введите логин' };
    if (!cleanNewPass || cleanNewPass.length < 3) {
      return { success: false, error: 'Пароль должен содержать минимум 3 символа' };
    }

    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: cleanLogin, newPassword: cleanNewPass }),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // non-JSON
      }
      if (!res.ok) {
        return { success: false, error: data?.error || 'Ошибка сброса пароля' };
      }

      const safeUser: UserAccount = data.user;
      const updatedDb = { ...accountsDb, [cleanLogin]: safeUser };
      setAccountsDb(updatedDb);
      safeSetStorage('together_accounts_registry', updatedDb);

      setCurrentUser(safeUser);
      setIsOnboarded(true);
      triggerConfetti();
      return { success: true };
    } catch {
      return { success: false, error: 'Не удалось связаться с сервером' };
    }
  };

  const authLogout = () => {
    setCurrentUserState(null);
    safeSetStorage('together_current_user', null);
    safeSetStorage('loop_auth_token', null);
    setIsOnboarded(false);
    onLogoutResetState?.();
  };

  const switchAccount = (_targetLogin: string) => {
    authLogout();
  };

  const updateCoupleStartDate = async (date: string) => {
    if (!currentUser) return;
    const cleanLogin = currentUser.login.toLowerCase();
    const existing = accountsDb[cleanLogin];
    if (!existing) return;

    const updated = { ...existing, startDate: date };
    let updatedDb = { ...accountsDb, [cleanLogin]: updated };
    setCurrentUser(updated);

    if (existing.partnerLogin) {
      const partnerLogin = existing.partnerLogin.toLowerCase();
      const existingPartner = accountsDb[partnerLogin];
      if (existingPartner) {
        const updatedPartner = { ...existingPartner, startDate: date };
        updatedDb = { ...updatedDb, [partnerLogin]: updatedPartner };
      }
    }

    setAccountsDb(updatedDb);
    safeSetStorage('together_accounts_registry', updatedDb);

    try {
      await apiFetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: cleanLogin, startDate: date }),
      });
      if (existing.partnerLogin) {
        await apiFetch('/api/auth/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login: existing.partnerLogin, startDate: date }),
        });
      }
    } catch {
      // ignore
    }
  };

  const updateUserProfile = async (fields: Partial<UserAccount>) => {
    if (!currentUser) return;
    const cleanLogin = currentUser.login.toLowerCase();
    const existing = accountsDb[cleanLogin];
    if (!existing) return;

    const updated: UserAccount & { password?: string } = {
      ...existing,
      ...fields,
      login: existing.login,
    };

    const updatedDb = { ...accountsDb, [cleanLogin]: updated };
    setAccountsDb(updatedDb);
    safeSetStorage('together_accounts_registry', updatedDb);

    const { password: _, ...safeUser } = updated;
    setCurrentUser(safeUser);

    try {
      apiFetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: cleanLogin,
          ...fields,
        }),
      }).catch(() => {});
    } catch {}
  };

  const changePassword = async (
    oldPass: string,
    newPass: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Пользователь не авторизован' };
    const cleanLogin = currentUser.login.toLowerCase();
    const user = accountsDb[cleanLogin];
    if (!user) return { success: false, error: 'Аккаунт не найден' };

    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: cleanLogin,
          oldPassword: oldPass,
          newPassword: newPass,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // non-JSON
      }
      if (!res.ok) {
        return { success: false, error: data?.error || 'Ошибка смены пароля' };
      }

      const updated = { ...user, password: newPass.trim() };
      const updatedDb = { ...accountsDb, [cleanLogin]: updated };
      setAccountsDb(updatedDb);
      safeSetStorage('together_accounts_registry', updatedDb);

      return { success: true };
    } catch {
      return { success: false, error: 'Ошибка соединения с сервером' };
    }
  };

  return {
    accountsDb,
    setAccountsDb,
    currentUser,
    setCurrentUserState,
    setCurrentUser,
    allUsers,
    isOnboarded,
    setIsOnboardedState,
    setIsOnboarded,
    authRegister,
    authLogin,
    authResetPassword,
    authLogout,
    switchAccount,
    updateCoupleStartDate,
    updateUserProfile,
    changePassword,
  };
}
