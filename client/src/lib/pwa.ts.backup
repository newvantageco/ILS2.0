// PWA Service Worker Registration and Management

interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

export function registerServiceWorker(config?: ServiceWorkerConfig) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
        });

        console.log('[PWA] Service Worker registered:', registration.scope);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New content available, please refresh.');
              config?.onUpdate?.(registration);
            }
          });
        });

        // Success callback
        if (registration.active) {
          config?.onSuccess?.(registration);
        }

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour

      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    });

    // Monitor online/offline status
    window.addEventListener('online', () => {
      console.log('[PWA] Back online');
      config?.onOnline?.();
      
      // Trigger background sync if supported
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
          return (registration as any).sync.register('sync-offline-requests');
        }).catch(console.error);
      }
    });

    window.addEventListener('offline', () => {
      console.log('[PWA] Gone offline');
      config?.onOffline?.();
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('[PWA] Service Worker unregistered');
      })
      .catch(console.error);
  }
}

export async function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    console.log('[PWA] Checked for updates');
  }
}

export function isOffline(): boolean {
  return !navigator.onLine;
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[PWA] Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

// Show local notification (doesn't require service worker)
export function showNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      ...options,
    });
  }
}

// Install prompt for PWA
let deferredPrompt: any = null;

export function setupInstallPrompt(
  onInstallable: (installFn: () => void) => void
) {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    deferredPrompt = e;
    
    console.log('[PWA] Install prompt available');

    // Notify that app can be installed
    onInstallable(() => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('[PWA] User accepted install');
          } else {
            console.log('[PWA] User dismissed install');
          }
          deferredPrompt = null;
        });
      }
    });
  });

  // Track if already installed
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed');
    deferredPrompt = null;
  });
}

// Cache management utilities
export async function clearAllCaches() {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log('[PWA] All caches cleared');
  }
}

export async function getCacheSize(): Promise<number> {
  if ('caches' in window && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
  return 0;
}

// Offline queue utilities
export async function getOfflineQueueLength(): Promise<number> {
  if ('caches' in window) {
    try {
      const cache = await caches.open('offline-requests');
      const requests = await cache.keys();
      return requests.length;
    } catch {
      return 0;
    }
  }
  return 0;
}

export async function clearOfflineQueue() {
  if ('caches' in window) {
    try {
      await caches.delete('offline-requests');
      console.log('[PWA] Offline queue cleared');
    } catch (error) {
      console.error('[PWA] Failed to clear offline queue:', error);
    }
  }
}
