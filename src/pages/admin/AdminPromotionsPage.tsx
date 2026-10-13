import React, { useState, useEffect, useMemo, useRef } from 'react';
import { sanitizeErrorMessage } from '../../utils/errorUtils';
import { Link } from 'react-router-dom';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  ChevronRight,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Truck,
  Percent,
  DollarSign,
  X,
  AlertTriangle
} from 'lucide-react';
import { Promotion, DiscountType } from '../../types';
import { promotionService } from '../../services/promotionService';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

// Preset banner options for quick floral imagery selection
const PRESET_BANNERS = [
  {
    name: 'Jasmine & Garlands',
    url: '/images/products/jasmine-garland.jpg',
  },
  {
    name: 'Festive Roses & Carnations',
    url: '/images/products/carnation-rose-bunch.jpg',
  },
  {
    name: 'Grand Wedding Florals',
    url: '/images/products/wedding-varmala.jpg',
  },
  {
    name: 'Sacred Pooja Blooms & Petals',
    url: '/images/products/marigold-puja-string.jpg',
  },
];

type StatusFilter = 'all' | 'active' | 'scheduled' | 'expired' | 'inactive';

export const AdminPromotionsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Partial<Promotion> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const modalTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Close modal on Escape and return focus
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        modalTriggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load promotions from database / service
  const loadPromotions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await promotionService.getAllPromotionsAdmin();
      setPromotions(data);
    } catch (err: any) {
      console.error('[AdminPromotionsPage] Failed to load promotions:', err);
      setError(sanitizeErrorMessage(err, 'Failed to load promotions from database.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, []);

  // Compute status of a promotion
  const getPromotionStatus = (p: Promotion): {
    label: string;
    type: 'active' | 'scheduled' | 'expired' | 'inactive';
    color: string;
  } => {
    if (!p.is_active) {
      return { label: 'Paused', type: 'inactive', color: 'bg-stone-100 text-stone-600 border-stone-200' };
    }
    const now = new Date();
    const start = new Date(p.start_date);
    const end = p.end_date ? new Date(p.end_date) : null;

    if (start > now) {
      return { label: 'Scheduled', type: 'scheduled', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (end && end < now) {
      return { label: 'Expired', type: 'expired', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    return { label: 'Active Now', type: 'active', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
  };

  // Filtered list
  const filteredPromotions = useMemo(() => {
    return promotions.filter(p => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesDesc = (p.description || '').toLowerCase().includes(q);
        const matchesCode = (p.code || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCode) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const status = getPromotionStatus(p);
        if (status.type !== statusFilter) return false;
      }

      return true;
    });
  }, [promotions, searchQuery, statusFilter]);

  // Summary counts
  const summaryCounts = useMemo(() => {
    let active = 0;
    let scheduled = 0;
    let expired = 0;
    let inactive = 0;

    promotions.forEach(p => {
      const status = getPromotionStatus(p);
      if (status.type === 'active') active++;
      else if (status.type === 'scheduled') scheduled++;
      else if (status.type === 'expired') expired++;
      else inactive++;
    });

    return { total: promotions.length, active, scheduled, expired, inactive };
  }, [promotions]);

  // Open Create Modal
  const handleOpenCreate = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      modalTriggerRef.current = e.currentTarget;
    } else {
      modalTriggerRef.current = document.activeElement as HTMLButtonElement;
    }
    const now = new Date();
    const inThirtyDays = new Date(now.getTime() + 30 * 86400000);

    setEditingPromotion({
      title: '',
      description: '',
      banner_image: PRESET_BANNERS[0].url,
      discount_type: 'percentage',
      discount_value: 10,
      start_date: now.toISOString().slice(0, 16),
      end_date: inThirtyDays.toISOString().slice(0, 16),
      is_active: true,
      code: '',
      min_order_amount: 0,
      display_order: promotions.length + 1,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Promotion, e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      modalTriggerRef.current = e.currentTarget;
    } else {
      modalTriggerRef.current = document.activeElement as HTMLButtonElement;
    }
    setEditingPromotion({
      ...p,
      start_date: p.start_date ? new Date(p.start_date).toISOString().slice(0, 16) : '',
      end_date: p.end_date ? new Date(p.end_date).toISOString().slice(0, 16) : '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Toggle Active/Inactive
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const newActive = !currentActive;
      await promotionService.toggleActive(id, newActive);
      setPromotions(prev => prev.map(p => (p.id === id ? { ...p, is_active: newActive } : p)));
    } catch (err: any) {
      alert('Failed to update promotion status: ' + err.message);
    }
  };

  // Delete Promotion
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      await promotionService.deletePromotion(id);
      setPromotions(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert('Failed to delete promotion: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Handle Form Submit
  const handleSubmitPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromotion) return;
    setFormError(null);

    if (!editingPromotion.title?.trim()) {
      setFormError('Promotion title is required.');
      return;
    }

    if (editingPromotion.discount_type === 'percentage') {
      const val = Number(editingPromotion.discount_value);
      if (isNaN(val) || val <= 0 || val > 100) {
        setFormError('Percentage discount must be between 1% and 100%.');
        return;
      }
    } else if (editingPromotion.discount_type === 'fixed_amount') {
      const val = Number(editingPromotion.discount_value);
      if (isNaN(val) || val <= 0) {
        setFormError('Fixed amount discount must be greater than ₹0.');
        return;
      }
    }

    if (editingPromotion.start_date && editingPromotion.end_date) {
      const start = new Date(editingPromotion.start_date);
      const end = new Date(editingPromotion.end_date);
      if (end < start) {
        setFormError('End date cannot be earlier than start date.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<Promotion> = {
        ...editingPromotion,
        title: editingPromotion.title.trim(),
        description: editingPromotion.description?.trim() || null,
        banner_image: editingPromotion.banner_image?.trim() || null,
        discount_value: editingPromotion.discount_type === 'none' ? 0 : Number(editingPromotion.discount_value) || 0,
        start_date: editingPromotion.start_date ? new Date(editingPromotion.start_date).toISOString() : new Date().toISOString(),
        end_date: editingPromotion.end_date ? new Date(editingPromotion.end_date).toISOString() : null,
        code: editingPromotion.code?.trim() ? editingPromotion.code.trim().toUpperCase() : null,
        min_order_amount: Number(editingPromotion.min_order_amount) || 0,
      };

      const saved = await promotionService.savePromotion(payload);

      setPromotions(prev => {
        const idx = prev.findIndex(p => p.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [saved, ...prev];
      });

      setIsModalOpen(false);
      setEditingPromotion(null);
      modalTriggerRef.current?.focus();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save promotion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-600 mb-1">
            <Link to="/admin" className="hover:text-stone-800 transition-colors">Admin</Link>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400" aria-hidden="true" />
            <span className="font-semibold text-stone-800">Promotions & Marketing</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 flex items-center gap-2.5">
            <span>Promotions & Offers</span>
            <span className="text-xs font-sans font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Database Validated
            </span>
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Manage storefront hero promotions, seasonal collections, discounts, and future coupon codes
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={loadPromotions}
            disabled={loading}
            aria-label="Refresh promotions from database"
            className="touch-target-44 px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all active:scale-95 disabled:opacity-60"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Refresh</span>
          </button>

          <button
            onClick={(e) => handleOpenCreate(e)}
            className="touch-target-44 px-4 py-2 rounded-xl bg-[#143D2B] text-white hover:bg-[#1e5a3f] text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
            <span>Create Promotion</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div role="alert" aria-live="assertive" className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-red-800 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" aria-hidden="true" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={loadPromotions}
            className="inline-flex items-center gap-1.5 bg-[#143D2B] hover:bg-[#1e5a3f] text-white font-bold px-4 py-2 rounded-xl transition-all active:scale-95 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 1. Summary Status Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">Total Campaigns</span>
          <p className="font-mono text-xl sm:text-2xl font-bold text-stone-900">{summaryCounts.total}</p>
          <p className="text-[11px] text-stone-600">Configured promotions</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Live On Homepage</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          </div>
          <p className="font-mono text-xl sm:text-2xl font-bold text-emerald-800">{summaryCounts.active}</p>
          <p className="text-[11px] text-stone-600">Passing database criteria</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Upcoming / Scheduled</span>
          <p className="font-mono text-xl sm:text-2xl font-bold text-blue-800">{summaryCounts.scheduled}</p>
          <p className="text-[11px] text-stone-600">Future start date</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">Expired / Paused</span>
          <p className="font-mono text-xl sm:text-2xl font-bold text-stone-700">{summaryCounts.expired + summaryCounts.inactive}</p>
          <p className="text-[11px] text-stone-600">Hidden from storefront</p>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <label htmlFor="admin-promo-search" className="sr-only">
              Search promotions by title, description or code
            </label>
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              id="admin-promo-search"
              type="text"
              placeholder="Search promotions by title, description or code..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-800 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#143D2B]"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Promotion status filters">
            {[
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active Now' },
              { id: 'scheduled', label: 'Scheduled' },
              { id: 'expired', label: 'Expired' },
              { id: 'inactive', label: 'Paused' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setStatusFilter(opt.id as StatusFilter)}
                aria-pressed={statusFilter === opt.id}
                className={`touch-target-44 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === opt.id
                    ? 'bg-[#143D2B] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Promotions Listing */}
      {loading ? (
        <CardSkeleton count={4} height="h-48" />
      ) : filteredPromotions.length === 0 ? (
        <div className="p-8">
          <EmptyState
            icon={Tag}
            title="No promotions found"
            description={
              searchQuery || statusFilter !== 'all'
                ? 'No promotions match your filter criteria. Try clearing search or filters.'
                : 'Create your first promotion to highlight festival specials, discounts, and floral showcases.'
            }
            primaryAction={{
              label: 'Create New Promotion',
              onClick: handleOpenCreate,
            }}
            secondaryAction={
              searchQuery || statusFilter !== 'all'
                ? {
                    label: 'Clear Filters',
                    onClick: () => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    },
                  }
                : undefined
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPromotions.map(promo => {
            const status = getPromotionStatus(promo);
            const badgeText = promotionService.getDiscountBadgeText(promo);

            return (
              <div
                key={promo.id}
                className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-stone-300 transition-all group"
              >
                {/* Banner Thumbnail & Badges */}
                <div className="relative h-44 w-full overflow-hidden bg-stone-100">
                  {promo.banner_image ? (
                    <img
                      src={promo.banner_image}
                      alt={promo.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                  {/* Top Floating Status Pills */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-xs backdrop-blur-md ${status.color}`}>
                      {status.label}
                    </span>

                    {badgeText && (
                      <span className="bg-[#143D2B] text-[#D4AF37] border border-[#D4AF37]/40 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono shadow-xs">
                        {badgeText}
                      </span>
                    )}
                  </div>

                  {/* Bottom Title on Image */}
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <h3 className="font-serif text-lg font-bold drop-shadow-sm truncate">
                      {promo.title}
                    </h3>
                    {promo.code && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-stone-300">Code:</span>
                        <span className="font-mono text-[11px] font-bold text-[#D4AF37] bg-black/50 px-1.5 py-0.5 rounded">
                          {promo.code}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {promo.description ? (
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {promo.description}
                      </p>
                    ) : (
                      <p className="text-xs text-stone-400 italic">No description provided</p>
                    )}

                    {/* Meta info */}
                    <div className="pt-2 border-t border-stone-100 space-y-1 text-[11px] text-stone-500 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">Type:</span>
                        <span className="font-semibold text-stone-700 capitalize">
                          {promo.discount_type === 'none' ? 'Curated Showcase' : promo.discount_type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">Start Date:</span>
                        <span>{new Date(promo.start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">End Date:</span>
                        <span>{promo.end_date ? new Date(promo.end_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Ongoing (No expiry)'}</span>
                      </div>
                      {promo.min_order_amount ? (
                        <div className="flex items-center justify-between">
                          <span className="text-stone-400">Min Order:</span>
                          <span>₹{promo.min_order_amount}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    {/* Toggle Active Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(promo.id, promo.is_active)}
                      aria-label={`Toggle active status for ${promo.title}`}
                      className={`touch-target-44 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        promo.is_active
                          ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {promo.is_active ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-stone-500" aria-hidden="true" />
                          <span>Paused</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEdit(promo, e)}
                        className="touch-target-44 p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                        title="Edit promotion"
                        aria-label={`Edit ${promo.title}`}
                      >
                        <Edit2 className="w-4 h-4" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(promo.id)}
                        disabled={deletingId === promo.id}
                        className="touch-target-44 p-2 rounded-xl text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors disabled:opacity-50"
                        title="Delete promotion"
                        aria-label={`Delete ${promo.title}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Create / Edit Modal */}
      {isModalOpen && editingPromotion && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="promo-modal-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div>
                <h3 id="promo-modal-title" className="font-serif text-lg font-bold text-stone-900">
                  {editingPromotion.id ? 'Edit Promotion' : 'Create New Promotion'}
                </h3>
                <p className="text-xs text-stone-600">
                  Database authoritatively validates active dates & conditions
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  modalTriggerRef.current?.focus();
                }}
                className="touch-target-44 p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitPromotion} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div role="alert" aria-live="assertive" className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" aria-hidden="true" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label htmlFor="promo-form-title" className="block text-xs font-semibold text-stone-700 mb-1">
                  Promotion Title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="promo-form-title"
                  type="text"
                  required
                  placeholder="e.g. Festival Flowers, Weekend Special, Wedding Season"
                  value={editingPromotion.title || ''}
                  onChange={e => setEditingPromotion({ ...editingPromotion, title: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#143D2B]"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="promo-form-desc" className="block text-xs font-semibold text-stone-700 mb-1">
                  Description
                </label>
                <textarea
                  id="promo-form-desc"
                  rows={2}
                  placeholder="Brief enticing description for the storefront banner..."
                  value={editingPromotion.description || ''}
                  onChange={e => setEditingPromotion({ ...editingPromotion, description: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#143D2B]"
                />
              </div>

              {/* Banner Image URL & Presets */}
              <div className="space-y-2">
                <label htmlFor="promo-form-banner" className="block text-xs font-semibold text-stone-700">
                  Banner Image URL
                </label>
                <input
                  id="promo-form-banner"
                  type="url"
                  placeholder="https://..."
                  value={editingPromotion.banner_image || ''}
                  onChange={e => setEditingPromotion({ ...editingPromotion, banner_image: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#143D2B]"
                />

                {/* Preset quick pickers */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[10px] text-stone-600 font-semibold uppercase tracking-wider">Presets:</span>
                  {PRESET_BANNERS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditingPromotion({ ...editingPromotion, banner_image: preset.url })}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label htmlFor="promo-form-type" className="block text-xs font-semibold text-stone-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    id="promo-form-type"
                    value={editingPromotion.discount_type || 'none'}
                    onChange={e => setEditingPromotion({ ...editingPromotion, discount_type: e.target.value as DiscountType })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#143D2B]"
                  >
                    <option value="none">None (Curated Collection Showcase)</option>
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="fixed_amount">Fixed Amount Discount (₹)</option>
                    <option value="free_delivery">Free Delivery</option>
                  </select>
                  <p className="text-[10px] text-stone-600 mt-1">
                    Choose 'None' for collections like Pooja or Wedding showcases without invented discounts.
                  </p>
                </div>

                <div>
                  <label htmlFor="promo-form-value" className="block text-xs font-semibold text-stone-700 mb-1">
                    Discount Value {editingPromotion.discount_type === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    id="promo-form-value"
                    type="number"
                    min="0"
                    max={editingPromotion.discount_type === 'percentage' ? '100' : '10000'}
                    disabled={editingPromotion.discount_type === 'none' || editingPromotion.discount_type === 'free_delivery'}
                    value={editingPromotion.discount_value ?? 0}
                    onChange={e => setEditingPromotion({ ...editingPromotion, discount_value: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#143D2B] disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="promo-form-start" className="block text-xs font-semibold text-stone-700 mb-1">
                    Start Date & Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="promo-form-start"
                    type="datetime-local"
                    required
                    value={editingPromotion.start_date || ''}
                    onChange={e => setEditingPromotion({ ...editingPromotion, start_date: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#143D2B]"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="promo-form-end" className="block text-xs font-semibold text-stone-700">
                      End Date & Time
                    </label>
                    {editingPromotion.end_date && (
                      <button
                        type="button"
                        onClick={() => setEditingPromotion({ ...editingPromotion, end_date: null })}
                        className="text-[10px] text-stone-600 hover:text-stone-900 underline"
                      >
                        Set to Ongoing (No Expiry)
                      </button>
                    )}
                  </div>
                  <input
                    id="promo-form-end"
                    type="datetime-local"
                    value={editingPromotion.end_date || ''}
                    onChange={e => setEditingPromotion({ ...editingPromotion, end_date: e.target.value || null })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#143D2B]"
                  />
                  <p className="text-[10px] text-stone-600 mt-1">Leave blank for ongoing year-round collections.</p>
                </div>
              </div>

              {/* Extensibility: Coupon Code & Min Order */}
              <div className="pt-2 border-t border-stone-100 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                  <Tag className="w-3.5 h-3.5 text-[#143D2B]" aria-hidden="true" />
                  <span>Coupon Code & Qualification (Extensible)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="promo-form-code" className="block text-xs font-semibold text-stone-700 mb-1">
                      Coupon Code (Optional)
                    </label>
                    <input
                      id="promo-form-code"
                      type="text"
                      placeholder="e.g. FESTIVAL10, WEEKEND100"
                      value={editingPromotion.code || ''}
                      onChange={e => setEditingPromotion({ ...editingPromotion, code: e.target.value.toUpperCase() })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs font-mono uppercase text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#143D2B]"
                    />
                  </div>

                  <div>
                    <label htmlFor="promo-form-min-order" className="block text-xs font-semibold text-stone-700 mb-1">
                      Minimum Order Amount (₹)
                    </label>
                    <input
                      id="promo-form-min-order"
                      type="number"
                      min="0"
                      value={editingPromotion.min_order_amount ?? 0}
                      onChange={e => setEditingPromotion({ ...editingPromotion, min_order_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#143D2B]"
                    />
                  </div>
                </div>
              </div>

              {/* Active Toggle Switch */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-stone-900">Campaign Status</span>
                  <span className="block text-[11px] text-stone-600">
                    If enabled, the database evaluates dates to display this on the storefront
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPromotion({ ...editingPromotion, is_active: !editingPromotion.is_active })}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] ${
                    editingPromotion.is_active ? 'bg-[#143D2B]' : 'bg-stone-300'
                  }`}
                  role="switch"
                  aria-checked={editingPromotion.is_active}
                  aria-label="Campaign status toggle"
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      editingPromotion.is_active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Live Banner Preview in Modal */}
              <div className="pt-3 border-t border-stone-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                    <span>Storefront Live Banner Preview</span>
                  </span>
                  <span className="text-[10px] text-stone-600">Updates as you type</span>
                </div>
                <div className="relative overflow-hidden rounded-2xl bg-[#0B2419] text-white p-4 sm:p-5 border border-[#D4AF37]/40 shadow-sm min-h-[110px] flex flex-col justify-between">
                  {editingPromotion.banner_image && (
                    <img
                      src={editingPromotion.banner_image}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover opacity-25"
                    />
                  )}
                  <div className="relative z-10 space-y-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Special Promotion
                      </span>
                      {editingPromotion.discount_type === 'percentage' && (editingPromotion.discount_value || 0) > 0 && (
                        <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono">
                          {editingPromotion.discount_value}% OFF
                        </span>
                      )}
                      {editingPromotion.discount_type === 'fixed_amount' && (editingPromotion.discount_value || 0) > 0 && (
                        <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono">
                          ₹{editingPromotion.discount_value} OFF
                        </span>
                      )}
                      {editingPromotion.discount_type === 'free_delivery' && (
                        <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          Free Delivery
                        </span>
                      )}
                      {editingPromotion.discount_type === 'none' && (
                        <span className="bg-white/10 text-stone-200 px-2 py-0.5 rounded-full text-[10px] font-medium">
                          Curated Collection (No fake discount)
                        </span>
                      )}
                    </div>
                    <h4 className="font-serif font-bold text-base sm:text-lg text-white">
                      {editingPromotion.title || 'Promotion Title'}
                    </h4>
                    {editingPromotion.description && (
                      <p className="text-xs text-stone-200/90 line-clamp-2 font-light">
                        {editingPromotion.description}
                      </p>
                    )}
                    {editingPromotion.code && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-[11px] text-stone-300">Code:</span>
                        <span className="font-mono text-xs font-bold text-[#D4AF37] bg-black/40 border border-[#D4AF37]/50 px-2 py-0.5 rounded">
                          {editingPromotion.code}
                        </span>
                        {editingPromotion.min_order_amount ? (
                          <span className="text-[10px] text-stone-400">
                            (Min order ₹{editingPromotion.min_order_amount})
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    modalTriggerRef.current?.focus();
                  }}
                  className="touch-target-44 px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#143D2B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="touch-target-44 px-5 py-2.5 rounded-xl bg-[#143D2B] hover:bg-[#1e5a3f] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[#143D2B]"
                >
                  {isSubmitting ? 'Saving...' : editingPromotion.id ? 'Update Promotion' : 'Create Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
