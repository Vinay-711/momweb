import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Flower2, ShoppingBag, MessageCircle, PhoneCall } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import * as whatsappService from '../../services/whatsappService';

export const MobileNav: React.FC = () => {
  const { totalItems, setIsCartOpen } = useCart();

  return (
    <nav
      aria-label="Mobile Quick Bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.06)]"
    >
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {/* Home */}
        <NavLink
          to="/"
          aria-label="Home page"
          className={({ isActive }) =>
            `touch-target-44 flex flex-col items-center justify-center h-full text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] rounded-lg ${
              isActive ? 'text-[#143D2B] font-bold' : 'text-stone-600 hover:text-stone-900'
            }`
          }
        >
          <Home className="w-5 h-5 mb-0.5" aria-hidden="true" />
          <span>Home</span>
        </NavLink>

        {/* Collections */}
        <NavLink
          to="/catalog"
          aria-label="Flower catalog"
          className={({ isActive }) =>
            `touch-target-44 flex flex-col items-center justify-center h-full text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] rounded-lg ${
              isActive ? 'text-[#143D2B] font-bold' : 'text-stone-600 hover:text-stone-900'
            }`
          }
        >
          <Flower2 className="w-5 h-5 mb-0.5" aria-hidden="true" />
          <span>Flowers</span>
        </NavLink>

        {/* WhatsApp Highlight Button in Center */}
        <a
          href={whatsappService.getGreetingUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center -mt-5 touch-target-44 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] rounded-full"
          aria-label="Order fresh flowers on WhatsApp"
        >
          <div className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg border-2 border-white active:scale-95 transition-transform">
            <MessageCircle className="w-6 h-6" aria-hidden="true" />
          </div>
          <span className="text-[10px] font-bold text-[#143D2B] mt-0.5">WhatsApp</span>
        </a>

        {/* Cart */}
        <button
          id="mobile-nav-cart-trigger"
          onClick={() => setIsCartOpen(true)}
          className="touch-target-44 relative flex flex-col items-center justify-center h-full text-[11px] font-medium text-stone-600 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] rounded-lg"
          aria-label={totalItems > 0 ? `Shopping basket with ${totalItems} items` : 'Shopping basket is empty'}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 mb-0.5" aria-hidden="true" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-[#C84B5B] text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
          <span>Cart</span>
        </button>

        {/* Call Store */}
        <a
          href="tel:9740030159"
          className="touch-target-44 flex flex-col items-center justify-center h-full text-[11px] font-medium text-stone-600 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] rounded-lg"
          aria-label="Call Florist Padma at 9740030159"
        >
          <PhoneCall className="w-5 h-5 mb-0.5 text-[#143D2B]" aria-hidden="true" />
          <span>Call Us</span>
        </a>
      </div>
    </nav>
  );
};
