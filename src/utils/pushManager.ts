import { apiFetch } from './api';
// Loop Web Push Notifications, Service Worker, and iOS Notification Manager
import { safeGetStorage, safeSetStorage } from './safeStorage';

export interface PushStatus {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isIOS: boolean;
  isStandalone: boolean;
}

export interface InAppNotificationData {
  id?: string;
  title: string;
  body: string;
  icon?: string;
  url?: string;
  timestamp?: number;
}

/**
 * Synthesizes a delicate, pleasant notification chime using Web Audio API
 */
export function playNotificationSound() {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    
    // Tone 1 (High bell)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5

    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.6);

    // Tone 2 (Harmonic overtone)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.08); // D6

    gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.7);
  } catch (err) {
    // Silently ignore if audio context is blocked
  }
}

/**
 * Triggers subtle haptic vibration
 */
export function triggerHaptic(pattern: number[] = [100, 50, 100]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {}
}

/**
 * Registers Service Worker for PWA and Web Push
 */
export async function initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || window.self !== window.top) {
      return null;
    }

    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return registration;
  } catch (err) {
    console.warn('[PushManager] Service Worker registration skipped or failed:', err);
    return null;
  }
}

/**
 * Checks current push notification status and capabilities
 */
export function getPushStatus(): PushStatus {
  try {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return { isSupported: false, permission: 'unsupported', isIOS: false, isStandalone: false };
    }

    const userAgent = (navigator.userAgent || '').toLowerCase();
    const platform = (navigator.platform || '');
    const maxTouchPoints = (navigator.maxTouchPoints || 0);

    const isIOS =
      /ipad|iphone|ipod/.test(userAgent) ||
      (platform === 'MacIntel' && maxTouchPoints > 1);

    const isStandalone =
      (typeof window.matchMedia === 'function' ? window.matchMedia('(display-mode: standalone)').matches : false) ||
      Boolean((navigator as any)?.standalone);

    const isNotificationSupported = 'Notification' in window;
    const isServiceWorkerSupported = 'serviceWorker' in navigator;
    const isSupported = isNotificationSupported || isServiceWorkerSupported;

    let permission: NotificationPermission | 'unsupported' = 'unsupported';
    if (isNotificationSupported) {
      permission = Notification.permission;
    }

    return {
      isSupported,
      permission,
      isIOS,
      isStandalone,
    };
  } catch {
    return { isSupported: false, permission: 'unsupported', isIOS: false, isStandalone: false };
  }
}

/**
 * Trigger real System Web Push Notification (OS / Browser notification)
 */
export async function triggerSystemPush(
  title: string,
  body: string,
  tag: string = 'loop-notification',
  url: string = '/'
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Play delicate chime
  playNotificationSound();
  triggerHaptic([100, 50, 100]);

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready.catch(() => null);
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          body,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag,
          vibrate: [200, 100, 200],
          data: { url },
        } as NotificationOptions);
        return true;
      }
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon.svg',
        tag,
      });
      return true;
    }
  } catch (err) {
    console.warn('System push display notice:', err);
  }

  return false;
}

/**
 * Dispatches notification event (No in-app toast overlays; audio/haptic only if needed)
 */
export function dispatchInAppNotification(data: InAppNotificationData) {
  // Pure push notification architecture requested by user:
  // We do not render in-app toast overlays that overlap screens.
  playNotificationSound();
  triggerHaptic([100, 50, 100]);
  
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    triggerSystemPush(data.title, data.body, data.id || 'loop-event', data.url || '/');
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Requests push permission from browser and registers with backend
 */
export async function requestPushPermission(partnerId?: string, coupleId?: string): Promise<NotificationPermission> {
  if (typeof window === 'undefined') {
    throw new Error('Окружение не поддерживает уведомления');
  }

  // Ensure Service Worker is registered
  await initServiceWorker();

  if (!('Notification' in window)) {
    // If not supported natively (e.g. older iOS tab), return default
    return 'default';
  }

  try {
    const permission = await Notification.requestPermission();
    safeSetStorage('together_push_permission', permission);

    if (permission === 'granted' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.pushManager) {
          // Check existing subscription
          let subscription = await registration.pushManager.getSubscription();

          // If not subscribed yet, fetch backend VAPID public key and subscribe
          if (!subscription) {
            try {
              const keyRes = await apiFetch('/api/push/vapid-public-key');
              if (keyRes.ok) {
                const { publicKey } = await keyRes.json();
                if (publicKey) {
                  subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicKey),
                  });
                }
              }
            } catch (subscribeErr) {
              console.warn('[PushManager] Web push subscribe note:', subscribeErr);
            }
          }

          // Send subscription to backend
          if (subscription) {
            await apiFetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subscription: subscription.toJSON(),
                partnerId: partnerId || 'partner1',
                coupleId: coupleId || 'couple-main',
              }),
            }).catch(() => {});
          }
        }
      } catch (subErr) {
        console.warn('[PushManager] Subscription sync note:', subErr);
      }
    }

    return permission;
  } catch (err) {
    console.error('Push permission request error:', err);
    throw err;
  }
}

/**
 * Triggers a real System Push Notification test (No in-app toast banner)
 */
export async function triggerLocalTestPush(title?: string, body?: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const pushTitle = title || 'Loop • Тестовое push-уведомление';
  const pushBody = body || 'Партнёр оставил(а) тёплую реакцию в вашем общем пространстве Loop';

  // 1. Call backend test endpoint
  apiFetch('/api/push/send-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: pushTitle, body: pushBody }),
  }).catch(() => {});

  // 2. Trigger real system push
  const result = await triggerSystemPush(pushTitle, pushBody, 'loop-test-push', '/');
  return result || true;
}
