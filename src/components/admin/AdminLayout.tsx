import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Users,
  Settings,
  LogOut,
  Store,
  Menu,
  X,
  BarChart3,
  Tag,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  // Handle Escape key to close mobile nav
  React.useEffect(() => {
    if (!isMobileNavOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileNavOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileNavOpen]);

  const navItems = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Sales & Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Promotions & Offers', path: '/admin/promotions', icon: Tag },
    { label: 'Orders & Deliveries', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Products & Catalog', path: '/admin/products', icon: Package },
    { label: 'Inventory & Stock', path: '/admin/inventory', icon: Layers },
    { label: 'Customer Directory', path: '/admin/customers', icon: Users },
    { label: 'Business Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row">
      {/* Skip to Main Content Link for Keyboard Users */}
      <a href="#admin-main-content" className="skip-link">
        Skip to admin content
      </a>

      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#143D2B] text-white px-3 py-2.5 flex items-center justify-between shadow sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-serif text-[#D4AF37] font-bold" aria-hidden="true">
            P
          </div>
          <span className="font-serif font-bold text-sm">Padma's Floral Admin</span>
        </div>
        <button
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="touch-target-44 p-2 rounded-xl text-stone-200 hover:text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:outline-none"
          aria-label={isMobileNavOpen ? 'Close admin menu' : 'Open admin menu'}
          aria-expanded={isMobileNavOpen}
          aria-controls="admin-sidebar"
        >
          {isMobileNavOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        id="admin-sidebar"
        aria-label="Admin Navigation Sidebar"
        className={`w-full md:w-64 bg-[#0B2419] text-stone-300 flex-shrink-0 flex flex-col justify-between transition-all ${
          isMobileNavOpen ? 'block' : 'hidden md:flex'
        }`}
      >
        <div className="p-4 sm:p-6 space-y-6">
          {/* Logo */}
          <Link to="/admin" className="flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:outline-none rounded-xl">
            <div className="w-10 h-10 rounded-full bg-[#143D2B] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] shadow flex-shrink-0" aria-hidden="true">
              <span className="font-serif text-xl font-bold">P</span>
            </div>
            <div>
              <span className="font-serif text-lg font-bold text-white block">
                Padma's Floral
              </span>
              <span className="text-[10px] text-[#D4AF37] uppercase tracking-widest block font-semibold">
                Owner Dashboard
              </span>
            </div>
          </Link>

          {/* Nav items */}
          <nav aria-label="Admin Portal Navigation" className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin'}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:outline-none ${
                      isActive
                        ? 'bg-[#143D2B] text-white shadow-xs'
                        : 'text-stone-300 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-stone-800/80 space-y-2">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-2.5 text-xs text-stone-300 hover:text-white py-2.5 px-2 rounded-xl hover:bg-white/5 transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:outline-none"
            aria-label="Visit Customer Storefront in new tab"
          >
            <Store className="w-4 h-4 text-[#D4AF37] flex-shrink-0" aria-hidden="true" />
            <span>Visit Customer Store</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 text-xs text-red-400 hover:text-red-300 py-2.5 px-2 rounded-xl hover:bg-red-500/10 transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>Sign Out ({user?.email?.split('@')[0] || 'Admin'})</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main id="admin-main-content" tabIndex={-1} className="flex-1 p-3 sm:p-6 lg:p-10 max-w-7xl w-full overflow-x-hidden focus:outline-none">
        <Outlet />
      </main>
    </div>
  );
};
