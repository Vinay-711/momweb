import React, { useState } from 'react';
import { Download, X, Share, PlusSquare, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, isIOS, promptInstall, dismissPrompt } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isInstallable) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(!showIOSGuide);
    } else {
      setIsInstalling(true);
      await promptInstall();
      setIsInstalling(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Padma's Floral app install prompt"
      className="fixed bottom-20 md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-fade-in"
    >
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-stone-200/90 backdrop-blur-md relative overflow-hidden">
        {/* Subtle decorative gold top rim */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#143D2B] via-[#D4AF37] to-[#C84B5B]" />

        {/* Close / Dismiss Button */}
        <button
          onClick={dismissPrompt}
          className="touch-target-44 absolute top-2.5 right-2.5 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition-colors"
          aria-label="Dismiss app installation prompt"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          {/* App Icon */}
          <div className="w-12 h-12 rounded-2xl bg-[#143D2B] border border-[#D4AF37]/50 flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="font-serif font-bold text-xl text-[#D4AF37]">P</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C84B5B]">
                Mobile App
              </span>
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
            </div>
            <h4 className="font-serif font-bold text-sm text-stone-900 leading-snug">
              Install Padma's Floral App
            </h4>
            <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
              Instant 1-tap ordering, 24/7 service, and convenient flower browsing on your phone.
            </p>
          </div>
        </div>

        {/* iOS Step-by-Step Instructions */}
        {showIOSGuide && (
          <div className="mt-3 p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-700 space-y-2 animate-fade-in">
            <p className="font-bold text-stone-900 text-[11px] uppercase tracking-wide">
              How to add on iPhone / iPad:
            </p>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                1
              </span>
              <span>
                Tap the <Share className="w-3.5 h-3.5 text-[#143D2B] inline mx-1" /> <strong>Share</strong> button in Safari's bottom toolbar.
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                2
              </span>
              <span>
                Scroll down and tap <PlusSquare className="w-3.5 h-3.5 text-[#143D2B] inline mx-1" /> <strong>Add to Home Screen</strong>.
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="touch-target-44 flex-1 bg-[#143D2B] hover:bg-[#1e5a3f] text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all active:scale-98 min-h-[44px]"
          >
            <Download className="w-4 h-4 text-[#D4AF37]" />
            <span>{isIOS ? (showIOSGuide ? 'Hide Instructions' : 'Add to Home Screen') : 'Install App'}</span>
          </button>

          <button
            onClick={dismissPrompt}
            aria-label="Dismiss app installation prompt for now"
            className="touch-target-44 px-3 py-2.5 rounded-xl text-stone-600 hover:text-stone-900 text-xs font-semibold hover:bg-stone-100 transition-colors min-h-[44px]"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};
