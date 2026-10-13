import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import * as whatsappService from '../../services/whatsappService';
import {
  ShoppingBag,
  Phone,
  MessageCircle,
  Search,
  Menu,
  X,
  MapPin,
  Sparkles,
  ShieldCheck,
  Clock,
  Navigation
} from 'lucide-react';
import { Instagram } from '../ui/InstagramIcon';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { OpeningHoursModal } from '../ui/OpeningHoursModal';
import {
  BUSINESS_ADDRESS,
  BUSINESS_PHONE,
  BUSINESS_WHATSAPP,
  BUSINESS_INSTAGRAM,
  BUSINESS_INSTAGRAM_URL,
  BUSINESS_HOURS,
  GOOGLE_MAPS_DIRECTIONS_URL
} from '../../utils/seoConfig';

export const Navbar: React.FC = () => {
  const { totalItems, setIsCartOpen, selectedCity, setSelectedCity, operatingStatus } = useCart();
  const { isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const mobileToggleRef = React.useRef<HTMLButtonElement>(null);

  // Close mobile navigation on Escape key and return focus
  React.useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        mobileToggleRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/catalog' },
    { name: 'Flower Decorations', path: '/catalog?category=flower' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Track Order', path: '/track' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-stone-50/95 backdrop-blur-md border-b border-stone-200 transition-all">
      {/* Top Banner */}
      <div className="bg-[#143D2B] text-[#FCF9F6] text-xs py-2 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 font-medium overflow-hidden whitespace-nowrap text-ellipsis">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0 animate-pulse" />
            <span className="truncate">All types of flower decorations • Delivery in Ramanagara & Bengaluru • Open 24/7</span>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-stone-200 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsHoursModalOpen(true)}
              className="flex items-center gap-1.5 text-stone-200 hover:text-white transition-colors cursor-pointer"
              title="Click to check operating hours"
              aria-label={`Store hours: ${BUSINESS_HOURS}. Click to check opening hours.`}
            >
              <Clock className="w-3 h-3 text-[#D4AF37]" aria-hidden="true" />
              <span className="flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[#D4AF37]">Hours:</span>
              </span>
              <span>{BUSINESS_HOURS}</span>
            </button>
            <span className="text-stone-500">•</span>
            <a
              href={GOOGLE_MAPS_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-stone-300 hover:text-white transition-colors"
            >
              <MapPin className="w-3 h-3 text-rose-400" />
              <span>{BUSINESS_ADDRESS}</span>
            </a>
            <span className="text-stone-500">•</span>
            <a
              href={BUSINESS_INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-pink-300 hover:text-pink-200 transition-colors"
            >
              <Instagram className="w-3 h-3" />
              <span>@{BUSINESS_INSTAGRAM}</span>
            </a>
            <span className="text-stone-500">•</span>
            <a href={`tel:${BUSINESS_PHONE}`} className="flex items-center gap-1 hover:text-white transition-colors">
              <Phone className="w-3 h-3 text-[#D4AF37]" />
              <span>{BUSINESS_PHONE}</span>
            </a>
            <span className="text-stone-500">•</span>
            <a
              href={whatsappService.getGreetingUrl('Hello Padma\'s Floral, I would like to order flower decorations.')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-emerald-300 hover:text-emerald-200 transition-colors"
            >
              <MessageCircle className="w-3 h-3" />
              <span>WhatsApp: {BUSINESS_WHATSAPP}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#143D2B] flex items-center justify-center text-[#D4AF37] shadow-md group-hover:scale-105 transition-transform">
              <span className="font-serif text-xl sm:text-2xl font-bold">P</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1 sm:gap-1.5">
                <span className="font-serif text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#143D2B]">
                  Padma's
                </span>
                <span className="font-serif text-lg sm:text-xl md:text-2xl font-light italic text-[#C84B5B]">
                  Floral
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] tracking-widest uppercase text-stone-500 font-semibold -mt-0.5 sm:-mt-1">
                Flower Decorations • Ramanagara Town
              </p>
            </div>
          </Link>

          {/* Desktop Search */}
          <div className="hidden lg:flex flex-1 max-w-sm mx-8">
            <form onSubmit={handleSearchSubmit} className="relative w-full" role="search">
              <label htmlFor="desktop-search-input" className="sr-only">
                Search flower decorations
              </label>
              <input
                id="desktop-search-input"
                type="text"
                aria-label="Search flower decorations"
                placeholder="Search flower decorations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-stone-100/90 border border-stone-200 rounded-xl py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#143D2B] focus:bg-white transition-all"
              />
              <button
                type="submit"
                className="touch-target-44 absolute right-1 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#143D2B] transition-colors"
                aria-label="Submit search"
              >
                <Search className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>
          </div>

          {/* City Selector & Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Delivery City Selector (Desktop / Tablet) */}
            <div className="hidden sm:flex items-center gap-1.5 bg-stone-100 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-medium text-stone-700">
              <MapPin className="w-3.5 h-3.5 text-[#C84B5B]" aria-hidden="true" />
              <label htmlFor="navbar-desktop-city-select" className="sr-only">
                Delivering to
              </label>
              <span>Delivering to:</span>
              <select
                id="navbar-desktop-city-select"
                aria-label="Delivery destination city"
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value as any)}
                className="bg-transparent font-semibold text-[#143D2B] focus:outline-none cursor-pointer"
              >
                <option value="Ramanagara">Ramanagara</option>
                <option value="Bengaluru">Bengaluru</option>
              </select>
            </div>

            {/* Direct WhatsApp Callout Button */}
            <a
              href={whatsappService.getGreetingUrl('Hello Padma\'s Floral, I would like to inquire about flower decorations.')}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs hover:shadow-sm transition-colors border border-emerald-600/30 min-h-[40px]"
              aria-label="Inquire and order flower decorations via WhatsApp"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              <span>WhatsApp Order</span>
            </a>

            {/* Cart Button with 44px tap area */}
            <button
              id="navbar-cart-trigger"
              onClick={() => setIsCartOpen(true)}
              className="touch-target-44 relative p-2.5 rounded-lg text-stone-700 hover:bg-stone-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B]"
              aria-label={totalItems > 0 ? `Shopping cart with ${totalItems} items` : 'Shopping cart is empty'}
            >
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-[#143D2B]" aria-hidden="true" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 bg-[#C84B5B] text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Admin link badge */}
            <Link
              to={isAdmin ? '/admin' : '/admin/login'}
              className="touch-target-44 p-2 rounded-lg text-stone-500 hover:text-[#143D2B] hover:bg-stone-100 transition-colors"
              title={isAdmin ? 'Admin Dashboard' : 'Owner Login'}
              aria-label={isAdmin ? 'Open Admin Dashboard' : 'Florist Owner Login'}
            >
              <ShieldCheck className={`w-5 h-5 ${isAdmin ? 'text-[#143D2B]' : 'text-stone-400'}`} aria-hidden="true" />
            </Link>

            {/* Mobile menu toggle with 44px tap area */}
            <button
              ref={mobileToggleRef}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden touch-target-44 p-2 rounded-xl text-stone-700 hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-[#143D2B]"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav aria-label="Main Navigation" className="hidden lg:flex items-center justify-center gap-8 py-2.5 border-t border-stone-200/60 text-sm font-medium text-stone-600">
          {navLinks.map(link => {
            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname + location.search === link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                aria-current={isActive ? 'page' : undefined}
                className={`transition-colors hover:text-[#143D2B] pb-0.5 ${
                  isActive ? 'text-[#143D2B] font-semibold border-b-2 border-[#143D2B]' : ''
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="lg:hidden bg-stone-50 border-b border-stone-200 px-4 pt-3 pb-6 animate-fade-in shadow-xl max-h-[85vh] overflow-y-auto"
        >
          {/* Mobile search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full mb-3" role="search">
            <label htmlFor="mobile-search-input" className="sr-only">
              Search flower decorations
            </label>
            <input
              id="mobile-search-input"
              type="text"
              aria-label="Search flower decorations"
              placeholder="Search flower decorations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-stone-100 border border-stone-300 rounded-xl py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#143D2B]"
            />
            <button
              type="submit"
              className="touch-target-44 absolute right-1 top-1/2 -translate-y-1/2 text-stone-500 hover:text-[#143D2B]"
              aria-label="Submit search"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>

          {/* Mobile city selector */}
          <div className="flex items-center justify-between p-3 bg-stone-100 rounded-xl mb-3 text-sm">
            <span className="flex items-center gap-2 text-stone-600 font-medium text-xs">
              <MapPin className="w-4 h-4 text-[#C84B5B] flex-shrink-0" aria-hidden="true" />
              <label htmlFor="navbar-mobile-city-select">Delivery Destination:</label>
            </span>
            <select
              id="navbar-mobile-city-select"
              aria-label="Delivery destination city"
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value as any)}
              className="bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-[#143D2B] min-h-[36px]"
            >
              <option value="Ramanagara">Ramanagara</option>
              <option value="Bengaluru">Bengaluru</option>
            </select>
          </div>

          <nav aria-label="Mobile Navigation Links" className="flex flex-col space-y-1 font-medium text-stone-700">
            {navLinks.map(link => {
              const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname + location.search === link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className="flex items-center px-3 rounded-xl hover:bg-stone-200/60 hover:text-[#143D2B] transition-colors min-h-[44px] text-sm"
                >
                  {link.name}
                </Link>
              );
            })}
            {/* Local Store & Workshop Info Card */}
            <div className="mt-3 p-3.5 bg-stone-100 rounded-2xl border border-stone-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900">Padma's Floral</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Open 24/7
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-stone-600">
                <MapPin className="w-3.5 h-3.5 text-[#C84B5B] flex-shrink-0 mt-0.5" />
                <span>{BUSINESS_ADDRESS}, Ramanagara</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsHoursModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200/80 text-stone-700 hover:bg-stone-100 transition-colors text-left"
                aria-label={`Store hours: ${BUSINESS_HOURS}. Click to check opening hours.`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#143D2B]" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{BUSINESS_HOURS}</span>
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Open around the clock
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#143D2B] underline">
                  View Hours
                </span>
              </button>
            </div>

            {/* Core Local CTAs for Mobile */}
            <div className="pt-3 border-t border-stone-200 grid grid-cols-2 gap-2">
              <a
                href={whatsappService.getGreetingUrl('Hello Padma\'s Floral, I would like to order flower decorations.')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 bg-[#25D366] text-white py-2.5 px-3 rounded-xl font-bold shadow-xs min-h-[44px] text-xs active:scale-98 text-center"
                aria-label="WhatsApp Padma's Floral"
              >
                <MessageCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span>WhatsApp</span>
              </a>

              <a
                href={`tel:${BUSINESS_PHONE}`}
                className="flex items-center justify-center gap-1.5 bg-[#143D2B] text-white py-2.5 px-3 rounded-xl font-bold shadow-xs min-h-[44px] text-xs active:scale-98 text-center"
                aria-label={`Call Florist at ${BUSINESS_PHONE}`}
              >
                <Phone className="w-4 h-4 text-[#D4AF37] flex-shrink-0" aria-hidden="true" />
                <span>Call Now</span>
              </a>

              <a
                href={GOOGLE_MAPS_DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 border border-stone-300 bg-white text-stone-800 py-2.5 px-3 rounded-xl font-bold min-h-[44px] text-xs active:scale-98 text-center"
                aria-label="Get Directions to Ramanagara Town on Google Maps"
              >
                <Navigation className="w-4 h-4 text-[#EA4335] flex-shrink-0" aria-hidden="true" />
                <span>Directions</span>
              </a>

              <Link
                to="/catalog"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 bg-[#D4AF37] text-[#0B2419] py-2.5 px-3 rounded-xl font-bold shadow-xs min-h-[44px] text-xs active:scale-98 text-center"
                aria-label="Shop flowers in catalog"
              >
                <ShoppingBag className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span>Products</span>
              </Link>
            </div>
          </nav>
        </div>
      )}

      {/* Store Operating Hours Modal */}
      <OpeningHoursModal
        isOpen={isHoursModalOpen}
        onClose={() => setIsHoursModalOpen(false)}
        status={operatingStatus}
      />
    </header>
  );
};
