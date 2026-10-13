import React, { useEffect, useRef } from 'react';
import { X, Clock, Calendar, Phone, MessageCircle, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { StoreOperatingStatus, formatTime12Hour } from '../../utils/operatingHoursUtils';
import * as whatsappService from '../../services/whatsappService';

interface OpeningHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: StoreOperatingStatus;
}

export const OpeningHoursModal: React.FC<OpeningHoursModalProps> = ({
  isOpen,
  onClose,
  status,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap & Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="opening-hours-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 flex flex-col animate-scale-in"
      >
        {/* Header */}
        <div className="bg-[#143D2B] text-white p-5 sm:p-6 rounded-t-3xl relative">
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="touch-target-44 absolute top-4 right-4 text-stone-300 hover:text-white rounded-full p-2 hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close operating hours modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" aria-hidden="true" />
            <span>Store Schedule & Hours</span>
          </div>

          <h2 id="opening-hours-modal-title" className="font-serif text-xl sm:text-2xl font-bold">
            Business Operating Hours
          </h2>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs ${
                status.isOpen
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  status.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>{status.badgeLabel}</span>
            </span>

            <span className="text-[11px] text-stone-300 bg-white/10 px-2.5 py-1 rounded-full">
              Timezone: {status.timezone} (IST)
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Explanation Alert when Closed */}
          {!status.isOpen && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" aria-hidden="true" />
                <span>{status.explanation}</span>
              </div>
              <p className="text-xs text-amber-800">
                {status.nextOpenDisplay}
              </p>
            </div>
          )}

          {/* Browsing Reassurance Notice */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 text-stone-700 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-stone-900">Browsing is always available</p>
              <p className="text-stone-600 leading-relaxed">
                You are welcome to browse all flower decoration collections and prepare your order at any time. We are open 24/7.
              </p>
            </div>
          </div>

          {/* 7-Day Weekly Schedule Table */}
          <div>
            <h3 className="font-serif font-bold text-sm text-stone-900 mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#143D2B]" aria-hidden="true" />
              <span>Weekly Availability</span>
            </h3>

            <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100 text-xs">
              {status.fullSchedule.map(sched => {
                const isCurrentDay = sched.day === status.currentDay;
                return (
                  <div
                    key={sched.day}
                    className={`flex items-center justify-between px-3.5 py-2.5 transition-colors ${
                      isCurrentDay
                        ? 'bg-[#143D2B]/5 font-bold text-[#143D2B]'
                        : 'bg-white text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{sched.label}</span>
                      {isCurrentDay && (
                        <span className="text-[10px] bg-[#143D2B] text-white px-2 py-0.5 rounded-full font-bold">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      {sched.isOpen ? (
                        <span className={isCurrentDay ? 'text-[#143D2B]' : 'text-stone-800'}>
                          {formatTime12Hour(sched.openTime)} – {formatTime12Hour(sched.closeTime)}
                        </span>
                      ) : (
                        <span className="text-stone-600 font-semibold">Closed</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact Direct Assistance */}
          <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row gap-2.5">
            <a
              href="tel:9740030159"
              className="touch-target-44 flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#143D2B]" aria-hidden="true" />
              <span>Call 9740030159</span>
            </a>

            <a
              href={whatsappService.getGreetingUrl("Hello Padma's Floral! I am checking your operating hours.")}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target-44 flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>WhatsApp Inquiries</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 rounded-b-3xl flex justify-end">
          <button
            onClick={onClose}
            className="touch-target-44 bg-[#143D2B] hover:bg-[#1e5a3f] text-white px-6 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
};
