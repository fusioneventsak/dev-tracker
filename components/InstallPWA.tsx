'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    console.log('InstallPWA component mounted');

    const handler = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      console.log('Previously dismissed:', dismissed);

      if (!dismissed) {
        console.log('Showing install prompt');
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    console.log('App is standalone:', isStandalone);

    if (isStandalone) {
      console.log('App already installed, hiding prompt');
      setShowInstallPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.log('No deferred prompt available');
      return;
    }

    try {
      console.log('Showing install prompt...');
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('User choice:', outcome);

      if (outcome === 'accepted') {
        console.log('PWA installed successfully');
      } else {
        console.log('PWA installation dismissed');
      }

      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg shadow-2xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Install Dev Tracker</h3>
              <p className="text-sm text-blue-100">
                Add to home screen for quick access
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleInstall}
            className="flex-1 bg-white text-blue-600 hover:bg-blue-50"
          >
            Install
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            Not Now
          </Button>
        </div>
      </div>
    </div>
  );
}
