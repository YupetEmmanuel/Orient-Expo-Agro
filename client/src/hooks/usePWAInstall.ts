import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isiOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    
    setIsIOS(isiOS);
    setIsAndroid(isAndroidDevice);

    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkInstalled();

    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      return false;
    }

    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    
    if (choiceResult.outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
      return true;
    }
    
    return false;
  };

  const shareApp = async (): Promise<{ success: boolean; cancelled?: boolean; method?: 'share' | 'clipboard' }> => {
    const shareData = {
      title: 'Orient - Vendor Marketplace',
      text: 'Check out Orient, a marketplace connecting farmers and food vendors with customers!',
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return { success: true, method: 'share' };
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return { success: false, cancelled: true };
        }
        console.error('Error sharing:', err);
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.origin);
      return { success: true, method: 'clipboard' };
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      return { success: false };
    }
  };

  return {
    isInstallable,
    isIOS,
    isAndroid,
    isInstalled,
    installApp,
    shareApp,
  };
}
