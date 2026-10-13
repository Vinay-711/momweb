import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Send,
  Sparkles,
  CheckCircle2,
  Navigation,
  ExternalLink,
  ShoppingBag
} from 'lucide-react';
import { Instagram } from '../components/ui/InstagramIcon';
import * as whatsappService from '../services/whatsappService';
import { usePageMeta } from '../hooks/usePageMeta';
import { StructuredData } from '../components/seo/StructuredData';
import { GoogleBusinessSection } from '../components/local/GoogleBusinessSection';
import {
  buildTitle,
  buildBreadcrumbJsonLd,
  buildLocalBusinessJsonLd,
  canonicalUrl,
  BUSINESS_ADDRESS,
  BUSINESS_HOURS,
  BUSINESS_PHONE,
  BUSINESS_WHATSAPP,
  BUSINESS_INSTAGRAM,
  BUSINESS_INSTAGRAM_URL,
  GOOGLE_MAPS_SEARCH_URL,
  GOOGLE_MAPS_DIRECTIONS_URL,
  DEFAULT_DESCRIPTION
} from '../utils/seoConfig';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Ramanagara');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  usePageMeta({
    title: buildTitle('Contact Us – WhatsApp, Phone & Visit'),
    description: "Contact Padma's Floral for all types of flower decorations. Delivery in Ramanagara and Bengaluru. Open 24/7. Prices depend on the seasons.",
    canonicalPath: '/contact',
  });

  const breadcrumbSchema = useMemo(() => buildBreadcrumbJsonLd([
    { name: 'Home', url: canonicalUrl('/') },
    { name: 'Contact', url: canonicalUrl('/contact') },
  ]), []);

  const localBusinessSchema = useMemo(() => buildLocalBusinessJsonLd({
    name: "Padma's Floral",
    phone: BUSINESS_PHONE,
    city: 'Ramanagara',
    description: DEFAULT_DESCRIPTION,
  }), []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;

    // Compose WhatsApp message directly so user inquiry is never lost
    const inquiryUrl = whatsappService.getContactInquiryUrl(name, phone, city, message);
    window.open(inquiryUrl, '_blank', 'noopener,noreferrer');
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* SEO Structured Data */}
      <StructuredData data={breadcrumbSchema} />
      <StructuredData data={localBusinessSchema} />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 bg-[#143D2B]/10 text-[#143D2B] px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Padma's Floral • Ramanagara & Bengaluru</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#143D2B]">
          Get in Touch with Padma's Floral
        </h1>
        <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
          All types of flower decorations. Serving Ramanagara and Bengaluru with 24/7 service. Located in Ramanagara Town. Prices depend on the seasons.
        </p>
      </div>

      {/* QUICK LOCAL BUSINESS ACTION STRIP */}
      <div className="bg-stone-50/80 border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-stone-800">Operating Hours:</span>
            <span className="text-stone-600">{BUSINESS_HOURS}</span>
          </div>
          <div className="text-stone-500 text-xs">
            Address: <strong className="text-stone-800">{BUSINESS_ADDRESS}</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <a
            href={`tel:${BUSINESS_PHONE}`}
            className="touch-target-44 min-h-[44px] flex items-center justify-center gap-2 bg-[#143D2B] hover:bg-[#1b4e37] text-white px-3 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-[#143D2B]"
          >
            <Phone className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
            <span>Call Now</span>
          </a>

          <a
            href={whatsappService.getGreetingUrl('Hello Padma\'s Floral, I would like to inquire about flower decorations.')}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target-44 min-h-[44px] flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-[#25D366]"
          >
            <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>WhatsApp Us</span>
          </a>

          <a
            href={GOOGLE_MAPS_DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target-44 min-h-[44px] flex items-center justify-center gap-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 px-3 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-[#143D2B]"
          >
            <Navigation className="w-3.5 h-3.5 text-[#EA4335]" aria-hidden="true" />
            <span>Get Directions</span>
          </a>

          <Link
            to="/catalog"
            className="touch-target-44 min-h-[44px] flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#c29f2f] text-[#0B2419] px-3 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-[#143D2B]"
          >
            <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Shop Flowers</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Contact Info Cards */}
        <div className="lg:col-span-5 space-y-6">
          {/* WhatsApp Direct */}
          <div className="bg-[#25D366]/10 border border-[#25D366]/30 p-6 rounded-2xl space-y-3">
            <div className="flex items-center gap-3 text-[#25D366]">
              <div className="w-12 h-12 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-xs" aria-hidden="true">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">WhatsApp</h3>
                <p className="text-xs text-stone-600">Direct booking & inquiries</p>
              </div>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Message us on WhatsApp for flower decoration inquiries, photos, and orders.
            </p>
            <a
              href={whatsappService.getGreetingUrl('Hello Padma\'s Floral, I would like to inquire about flower decorations.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-[#25D366]"
            >
              <span>Chat on {BUSINESS_WHATSAPP}</span>
            </a>
          </div>

          {/* Call Store */}
          <div className="bg-white border border-stone-200/90 p-6 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#143D2B] text-[#D4AF37] flex items-center justify-center shadow-xs" aria-hidden="true">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">Direct Phone Line</h3>
                <p className="text-xs text-stone-600">Available 24/7</p>
              </div>
            </div>
            <a
              href={`tel:${BUSINESS_PHONE}`}
              className="text-lg font-bold text-[#143D2B] block hover:underline"
            >
              {BUSINESS_PHONE}
            </a>
          </div>

          {/* Location & Workshop with Get Directions */}
          <div className="bg-white border border-stone-200/90 p-6 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-stone-100 text-[#C84B5B] flex items-center justify-center" aria-hidden="true">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">Workshop & Store</h3>
                  <p className="text-xs text-stone-600">{BUSINESS_ADDRESS}, Ramanagara</p>
                </div>
              </div>
              <a
                href={GOOGLE_MAPS_DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="touch-target-44 inline-flex items-center gap-1.5 bg-[#4285F4] hover:bg-[#3367d6] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                aria-label="Get Directions to Ramanagara Town on Google Maps"
              >
                <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Directions</span>
              </a>
            </div>
            <div className="pt-2 border-t border-stone-100 text-xs text-stone-600 space-y-1">
              <p className="font-bold text-stone-800">Delivery Areas:</p>
              <p>• Ramanagara</p>
              <p>• Bengaluru</p>
            </div>
          </div>

          {/* Instagram Profile Card */}
          <div className="bg-white border border-stone-200/90 p-6 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-xs" aria-hidden="true">
                <Instagram className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">Instagram</h3>
                <p className="text-xs text-stone-600">Follow our latest work</p>
              </div>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Check out photos of flower decorations on our official Instagram page.
            </p>
            <div className="pt-1">
              <a
                href={BUSINESS_INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E1306C] hover:underline"
              >
                <span>@{BUSINESS_INSTAGRAM} on Instagram</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="bg-white border border-stone-200/90 p-6 rounded-2xl shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-stone-800 font-bold text-sm">
              <Clock className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
              <span>Operating Hours</span>
            </div>
            <p className="text-xs text-stone-600">
              Monday through Sunday: <strong>{BUSINESS_HOURS}</strong>
            </p>
            <p className="text-[11px] text-stone-500">
              Prices depend on the seasons.
            </p>
          </div>
        </div>

        {/* Contact & Inquiry Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/90 shadow-sm space-y-6">
          <div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900">
              Send a Message or Custom Inquiry
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              We respond promptly with personalized quotes and flower options.
            </p>
          </div>

          {submitted ? (
            <div
              role="status"
              aria-live="polite"
              className="p-8 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3"
            >
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" aria-hidden="true" />
              <h3 className="font-serif font-bold text-lg text-emerald-900">
                Inquiry Forwarded to Padma's Floral!
              </h3>
              <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                Thank you, {name}! Your inquiry has been routed to our WhatsApp florist. We will follow up with you promptly.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="text-xs font-bold text-emerald-800 underline mt-2"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="contact-name" className="text-xs font-semibold text-stone-700 block mb-1">
                  Your Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="e.g. Anjali Gowda"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#143D2B] min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-phone" className="text-xs font-semibold text-stone-700 block mb-1">
                    Phone / WhatsApp Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    inputMode="tel"
                    required
                    autoComplete="tel"
                    placeholder="e.g. 9845012345"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#143D2B] min-h-[44px]"
                  />
                </div>

                <div>
                  <label htmlFor="contact-city" className="text-xs font-semibold text-stone-700 block mb-1">
                    Destination City <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="contact-city"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-[#143D2B] min-h-[44px]"
                  >
                    <option value="Ramanagara">Ramanagara</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Other">Other (Bidadi, Kanakapura, etc.)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="contact-message" className="text-xs font-semibold text-stone-700 block mb-1">
                  How can we help you? (Occasion, date, flower preferences) <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  placeholder="e.g. Need flower stage decoration for wedding reception in Ramanagara on Friday, plus entrance arch and puja garlands..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-[#143D2B]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#143D2B] hover:bg-[#1e5a3f] text-white py-3.5 rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98 min-h-[48px]"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>Send via WhatsApp Florist</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Google Business Profile Section */}
      <div className="pt-6">
        <GoogleBusinessSection />
      </div>
    </div>
  );
};
