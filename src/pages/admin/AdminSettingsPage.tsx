import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Phone,
  MessageCircle,
  MapPin,
  Truck,
  Sparkles,
  Clock,
  Calendar,
  Globe,
  AlertCircle,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { useCart } from '../../context/CartContext';
import { BusinessSettings } from '../../types';
import {
  getDefaultOperatingSchedule,
  getStoreOperatingStatus,
  DEFAULT_TIMEZONE,
  DEFAULT_OPEN_TIME,
  DEFAULT_CLOSE_TIME,
  DEFAULT_CLOSED_EXPLANATION,
} from '../../utils/operatingHoursUtils';

export const AdminSettingsPage: React.FC = () => {
  const { refreshSettings: refreshCartSettings } = useCart();
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      const data = await orderService.getBusinessSettings();
      if (data) {
        const genOpen = data.opening_time || DEFAULT_OPEN_TIME;
        const genClose = data.closing_time || DEFAULT_CLOSE_TIME;
        const schedule =
          data.operating_schedule && data.operating_schedule.length === 7
            ? data.operating_schedule
            : getDefaultOperatingSchedule(genOpen, genClose);

        setSettings({
          ...data,
          opening_time: genOpen,
          closing_time: genClose,
          timezone: data.timezone || DEFAULT_TIMEZONE,
          closed_notice: data.closed_notice || DEFAULT_CLOSED_EXPLANATION,
          operating_schedule: schedule,
        });
      }
      setLoading(false);
    };
    loadSettings();
  }, []);

  const liveStatus = useMemo(
    () => (settings ? getStoreOperatingStatus(settings) : null),
    [settings]
  );

  const handleDayToggle = (dayIndex: number, isOpen: boolean) => {
    if (!settings?.operating_schedule) return;
    const updated = [...settings.operating_schedule];
    updated[dayIndex] = { ...updated[dayIndex], isOpen };
    setSettings({ ...settings, operating_schedule: updated });
  };

  const handleDayTimeChange = (
    dayIndex: number,
    field: 'openTime' | 'closeTime',
    value: string
  ) => {
    if (!settings?.operating_schedule) return;
    const updated = [...settings.operating_schedule];
    updated[dayIndex] = { ...updated[dayIndex], [field]: value };
    setSettings({ ...settings, operating_schedule: updated });
  };

  const handleApplyGeneralHoursToAllDays = () => {
    if (!settings) return;
    const genOpen = settings.opening_time || DEFAULT_OPEN_TIME;
    const genClose = settings.closing_time || DEFAULT_CLOSE_TIME;
    const updated = (
      settings.operating_schedule || getDefaultOperatingSchedule()
    ).map(s => ({
      ...s,
      isOpen: true,
      openTime: genOpen,
      closeTime: genClose,
    }));
    setSettings({ ...settings, operating_schedule: updated });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    await orderService.updateBusinessSettings(settings);
    await refreshCartSettings();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  if (loading || !settings) {
    return (
      <div className="p-12 text-center text-stone-400 text-xs animate-pulse">
        Loading business settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {savedToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 z-50 bg-[#143D2B] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in border border-[#D4AF37]/40"
        >
          <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
          Business & Store Settings
        </h1>
        <p className="text-xs text-stone-600 mt-1">
          Configure delivery fees, contact information, and customer announcements
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4 sm:space-y-6" aria-label="Business and store settings form">
        {/* Contact Info Card */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="font-serif font-bold text-sm sm:text-base text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
            <Phone className="w-4 h-4 text-[#143D2B] flex-shrink-0" aria-hidden="true" />
            <span>Store Contact & Location</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label htmlFor="settings-store-name" className="font-semibold text-stone-700 block mb-1">
                Business Name
              </label>
              <input
                id="settings-store-name"
                type="text"
                value={settings.store_name}
                onChange={e => setSettings({ ...settings, store_name: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm min-h-[44px] focus:ring-2 focus:ring-[#143D2B]"
              />
            </div>

            <div>
              <label htmlFor="settings-phone" className="font-semibold text-stone-700 block mb-1">
                Calling Phone Number
              </label>
              <input
                id="settings-phone"
                type="tel"
                value={settings.phone}
                onChange={e => setSettings({ ...settings, phone: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm min-h-[44px] focus:ring-2 focus:ring-[#143D2B]"
              />
            </div>

            <div>
              <label htmlFor="settings-whatsapp" className="font-semibold text-stone-700 block mb-1">
                WhatsApp Ordering Number
              </label>
              <input
                id="settings-whatsapp"
                type="tel"
                value={settings.whatsapp}
                onChange={e => setSettings({ ...settings, whatsapp: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm min-h-[44px] focus:ring-2 focus:ring-[#143D2B]"
              />
            </div>

            <div>
              <label htmlFor="settings-address" className="font-semibold text-stone-700 block mb-1">
                Base Location Address
              </label>
              <input
                id="settings-address"
                type="text"
                value={settings.address}
                onChange={e => setSettings({ ...settings, address: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm min-h-[44px] focus:ring-2 focus:ring-[#143D2B]"
              />
            </div>

            <div>
              <label htmlFor="settings-instagram" className="font-semibold text-stone-700 block mb-1">
                Instagram Handle / URL
              </label>
              <input
                id="settings-instagram"
                type="text"
                value={settings.instagram_url || ''}
                placeholder="e.g. __vinxy_ or https://www.instagram.com/__vinxy_/"
                onChange={e => setSettings({ ...settings, instagram_url: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm min-h-[44px] focus:ring-2 focus:ring-[#143D2B]"
              />
            </div>
          </div>
        </div>

        {/* Delivery Rates Card */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="font-serif font-bold text-sm sm:text-base text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
            <Truck className="w-4 h-4 text-[#C84B5B] flex-shrink-0" aria-hidden="true" />
            <span>Delivery Fees & Thresholds</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label htmlFor="settings-ramanagara-fee" className="font-semibold text-stone-700 block mb-1">
                Ramanagara Local Delivery Fee (₹)
              </label>
              <input
                id="settings-ramanagara-fee"
                type="number"
                min="0"
                value={settings.ramanagara_delivery_fee}
                onChange={e => setSettings({ ...settings, ramanagara_delivery_fee: Number(e.target.value) })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm min-h-[44px] focus:ring-2 focus:ring-[#143D2B]"
              />
            </div>

            <div>
              <label htmlFor="settings-bengaluru-fee" className="font-semibold text-stone-700 block mb-1">
                Bengaluru Express Delivery Fee (₹)
              </label>
              <input
                id="settings-bengaluru-fee"
                type="number"
                min="0"
                value={settings.bengaluru_delivery_fee}
                onChange={e => setSettings({ ...settings, bengaluru_delivery_fee: Number(e.target.value) })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm min-h-[44px] focus:ring-2 focus:ring-[#143D2B]"
              />
            </div>

            <div>
              <label htmlFor="settings-free-threshold" className="font-semibold text-stone-700 block mb-1">
                Free Delivery Order Threshold (₹)
              </label>
              <input
                id="settings-free-threshold"
                type="number"
                min="0"
                value={settings.free_delivery_threshold}
                onChange={e => setSettings({ ...settings, free_delivery_threshold: Number(e.target.value) })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm min-h-[44px] focus:ring-2 focus:ring-[#143D2B]"
              />
            </div>
          </div>
        </div>

        {/* Announcements & Store Open Toggle */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="font-serif font-bold text-sm sm:text-base text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
            <Sparkles className="w-4 h-4 text-[#D4AF37] flex-shrink-0" aria-hidden="true" />
            <span>Customer Announcement Banner</span>
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label htmlFor="settings-announcement" className="font-semibold text-stone-700 block mb-1">
                Banner Announcement Text
              </label>
              <input
                id="settings-announcement"
                type="text"
                value={settings.announcement_banner}
                onChange={e => setSettings({ ...settings, announcement_banner: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm min-h-[44px] focus:ring-2 focus:ring-[#143D2B]"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl">
              <div>
                <p className="font-bold text-stone-900 text-xs sm:text-sm">Accepting Online Orders</p>
                <p className="text-[11px] text-stone-600">Toggle whether customers can submit orders</p>
              </div>
              <label className="touch-target-44 relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center" htmlFor="settings-store-open">
                <span className="sr-only">Accept Online Orders</span>
                <input
                  id="settings-store-open"
                  type="checkbox"
                  checked={settings.is_store_open}
                  onChange={e => setSettings({ ...settings, is_store_open: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[4px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#143D2B]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Business Operating Hours & Weekly Availability Card */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
            <h2 className="font-serif font-bold text-sm sm:text-base text-stone-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#143D2B] flex-shrink-0" aria-hidden="true" />
              <span>Business Operating Hours & Weekly Schedule</span>
            </h2>

            {/* Live Status Indicator Badge */}
            {liveStatus && (
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs ${
                    liveStatus.isOpen
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-50 text-amber-900 border border-amber-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      liveStatus.isOpen ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <span>Currently {liveStatus.isOpen ? 'OPEN' : 'CLOSED'}</span>
                  <span className="text-[10px] opacity-75 font-normal">
                    (Customer sees: "{liveStatus.statusText}")
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Timezone and Live Store Time Banner */}
          {liveStatus && (
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-stone-700">
                <Globe className="w-4 h-4 text-[#143D2B]" />
                <span>
                  Store Timezone: <strong>{liveStatus.timezone}</strong> (IST) • Local Store Time: <strong>{liveStatus.currentTimeString}</strong>
                </span>
              </div>
              <div className="text-[11px] text-stone-500 font-medium">
                Today ({liveStatus.currentDayLabel}): {liveStatus.todayHoursDisplay}
              </div>
            </div>
          )}

          {/* General Open/Close & Timezone Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label htmlFor="settings-open-time" className="font-semibold text-stone-700 block mb-1">
                Standard Opening Time
              </label>
              <input
                id="settings-open-time"
                type="time"
                value={settings.opening_time || '06:00'}
                onChange={e => setSettings({ ...settings, opening_time: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm min-h-[44px] focus:ring-2 focus:ring-[#143D2B]"
              />
              <p className="text-[11px] text-stone-500 mt-1">Default start for orders</p>
            </div>

            <div>
              <label htmlFor="settings-close-time" className="font-semibold text-stone-700 block mb-1">
                Standard Closing Time
              </label>
              <input
                id="settings-close-time"
                type="time"
                value={settings.closing_time || '21:00'}
                onChange={e => setSettings({ ...settings, closing_time: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm min-h-[44px] focus:ring-2 focus:ring-[#143D2B]"
              />
              <p className="text-[11px] text-stone-500 mt-1">Orders disabled afterwards</p>
            </div>

            <div>
              <label htmlFor="settings-timezone" className="font-semibold text-stone-700 block mb-1">
                Store Timezone
              </label>
              <select
                id="settings-timezone"
                value={settings.timezone || 'Asia/Kolkata'}
                onChange={e => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm min-h-[44px] focus:ring-2 focus:ring-[#143D2B] cursor-pointer"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST - Indian Standard Time)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST +04:00)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT +08:00)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
              </select>
              <p className="text-[11px] text-stone-500 mt-1">Operating hours are evaluated in this timezone</p>
            </div>
          </div>

          {/* Closed Explanation Notice Message */}
          <div>
            <label htmlFor="settings-closed-notice" className="font-semibold text-stone-700 block mb-1 text-xs">
              Closed Ordering Notice Explanation (Shown to customers when closed)
            </label>
            <input
              id="settings-closed-notice"
              type="text"
              value={settings.closed_notice || "We're currently closed. Please check our opening hours."}
              onChange={e => setSettings({ ...settings, closed_notice: e.target.value })}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm min-h-[44px] focus:ring-2 focus:ring-[#143D2B]"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              Exact customer message when ordering is disabled outside business hours
            </p>
          </div>

          {/* Day-Specific Availability Section */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
              <div>
                <h3 className="font-serif font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#C84B5B]" />
                  <span>Day-Specific Availability (Monday – Sunday)</span>
                </h3>
                <p className="text-[11px] text-stone-600">
                  Configure specific opening & closing times or mark individual days as closed
                </p>
              </div>

              <button
                type="button"
                onClick={handleApplyGeneralHoursToAllDays}
                className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold px-3 py-1.5 rounded-lg border border-stone-200 transition-colors self-start sm:self-auto cursor-pointer"
              >
                Apply Standard Hours to All Days
              </button>
            </div>

            {/* Schedule Rows */}
            <div className="space-y-2 border border-stone-200 rounded-2xl p-3 bg-stone-50/50">
              {(settings.operating_schedule || []).map((daySched, idx) => (
                <div
                  key={daySched.day}
                  className={`p-3 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    daySched.isOpen
                      ? 'bg-white border-stone-200'
                      : 'bg-stone-100/60 border-stone-200 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:w-40">
                    <label className="relative inline-flex items-center cursor-pointer min-h-[32px]">
                      <input
                        type="checkbox"
                        checked={daySched.isOpen}
                        onChange={e => handleDayToggle(idx, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[6px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#143D2B]"></div>
                    </label>
                    <span className="font-bold text-xs sm:text-sm text-stone-900">
                      {daySched.label}
                    </span>
                    {!daySched.isOpen && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                        Closed
                      </span>
                    )}
                  </div>

                  {daySched.isOpen ? (
                    <div className="flex items-center gap-2 text-xs flex-1 sm:justify-end">
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-500 font-medium">Open:</span>
                        <input
                          type="time"
                          value={daySched.openTime}
                          onChange={e => handleDayTimeChange(idx, 'openTime', e.target.value)}
                          className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-stone-800 focus:ring-1 focus:ring-[#143D2B]"
                        />
                      </div>
                      <span className="text-stone-400">–</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-500 font-medium">Close:</span>
                        <input
                          type="time"
                          value={daySched.closeTime}
                          onChange={e => handleDayTimeChange(idx, 'closeTime', e.target.value)}
                          className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-stone-800 focus:ring-1 focus:ring-[#143D2B]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-stone-500 italic sm:text-right flex-1">
                      Store closed for orders on this day (browsing still enabled)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Number Format Configuration */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="font-serif font-bold text-sm sm:text-base text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
            <Settings className="w-4 h-4 text-[#143D2B] flex-shrink-0" aria-hidden="true" />
            <span>Order Reference & Numbering Format</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs items-center">
            <div>
              <label htmlFor="settings-order-prefix" className="font-semibold text-stone-700 block mb-1">
                Configurable Order Prefix
              </label>
              <input
                id="settings-order-prefix"
                type="text"
                maxLength={6}
                value={settings.order_number_prefix || 'FL'}
                onChange={e => setSettings({ ...settings, order_number_prefix: e.target.value.toUpperCase() })}
                placeholder="e.g. FL, PF"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm font-mono font-bold uppercase tracking-wider min-h-[44px] focus:ring-2 focus:ring-[#143D2B]"
              />
              <p className="text-[11px] text-stone-600 mt-1">
                Custom prefix for business orders (e.g. FL, PF, PADMA)
              </p>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl">
              <p className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
                Live Generated Format Preview
              </p>
              <p className="font-mono text-base font-bold text-[#143D2B]">
                {(settings.order_number_prefix || 'FL').toUpperCase()}-{new Date().getFullYear()}-0001
              </p>
              <p className="text-[10px] text-stone-600 mt-1">
                Database-guaranteed unique human-friendly order numbering
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="touch-target-44 w-full sm:w-auto bg-[#143D2B] hover:bg-[#1e5a3f] text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 min-h-[48px] active:scale-98 transition-all focus-visible:ring-2 focus-visible:ring-[#143D2B]"
        >
          <Save className="w-4 h-4" aria-hidden="true" />
          <span>Save Changes</span>
        </button>
      </form>
    </div>
  );
};
