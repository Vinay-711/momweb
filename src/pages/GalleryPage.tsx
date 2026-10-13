import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, MessageCircle, X, Plus, UploadCloud, CheckCircle2 } from 'lucide-react';
import { INITIAL_GALLERY } from '../data/seedData';
import { GalleryItem } from '../types';
import { ImageUploadWidget } from '../components/ImageUploadWidget';
import * as whatsappService from '../services/whatsappService';
import { usePageMeta } from '../hooks/usePageMeta';
import { StructuredData } from '../components/seo/StructuredData';
import { buildTitle, buildBreadcrumbJsonLd, canonicalUrl } from '../utils/seoConfig';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { EmptyState } from '../components/ui/EmptyState';

const STORAGE_KEY_GALLERY = 'padma_floral_gallery';

export const GalleryPage: React.FC = () => {
  usePageMeta({
    title: buildTitle('Gallery – Our Floral Creations'),
    description: "Explore our gallery of fresh flower arrangements, wedding varmalas, puja garlands, and event decorations by Padma's Floral in Ramanagara & Bengaluru.",
    canonicalPath: '/gallery',
  });

  const breadcrumbSchema = useMemo(() => buildBreadcrumbJsonLd([
    { name: 'Home', url: canonicalUrl('/') },
    { name: 'Gallery', url: canonicalUrl('/gallery') },
  ]), []);

  const [filter, setFilter] = useState('All');
  const [items, setItems] = useState<GalleryItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_GALLERY);
      return stored ? JSON.parse(stored) : INITIAL_GALLERY;
    } catch {
      return INITIAL_GALLERY;
    }
  });

  const [activeModalItem, setActiveModalItem] = useState<GalleryItem | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const lastActiveElementRef = React.useRef<HTMLElement | null>(null);
  const [newPhoto, setNewPhoto] = useState<{
    title: string;
    category: string;
    image_url: string;
    description: string;
  }>({
    title: '',
    category: 'Wedding',
    image_url: '',
    description: '',
  });

  const categories = ['All', 'Wedding', 'Traditional', 'Bouquets', 'Events'];

  const filteredItems = filter === 'All'
    ? items
    : items.filter(item => item.category === filter);

  const handleOrderSimilar = (item: GalleryItem) => {
    const message = `Namaskara Padma's Floral! 🌸\nI love this arrangement from your gallery: *${item.title}* (${item.category}).\nCan you make something similar for my upcoming event in Ramanagara / Bengaluru?`;
    const url = whatsappService.getChatUrl(message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenLightbox = (item: GalleryItem) => {
    lastActiveElementRef.current = document.activeElement as HTMLElement;
    setActiveModalItem(item);
  };

  const handleCloseLightbox = () => {
    setActiveModalItem(null);
    lastActiveElementRef.current?.focus();
  };

  const handleOpenUploadModal = () => {
    lastActiveElementRef.current = document.activeElement as HTMLElement;
    setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
    lastActiveElementRef.current?.focus();
  };

  const handleSaveNewGalleryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhoto.title.trim() || !newPhoto.image_url.trim()) return;

    const newItem: GalleryItem = {
      id: `gal-${Date.now()}`,
      title: newPhoto.title.trim(),
      category: newPhoto.category,
      image_url: newPhoto.image_url.trim(),
      description: newPhoto.description.trim() || 'Custom floral arrangement by Padma\'s Floral atelier.',
    };

    const updated = [newItem, ...items];
    setItems(updated);
    try {
      localStorage.setItem(STORAGE_KEY_GALLERY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save gallery to localStorage', err);
    }

    handleCloseUploadModal();
    setNewPhoto({ title: '', category: 'Wedding', image_url: '', description: '' });
  };

  // Keyboard navigation: Escape key closes modals & restores focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeModalItem) handleCloseLightbox();
        if (isUploadModalOpen) handleCloseUploadModal();
      }
    };
    if (activeModalItem || isUploadModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [activeModalItem, isUploadModalOpen]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* SEO Structured Data */}
      <StructuredData data={breadcrumbSchema} />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold text-[#C84B5B] uppercase tracking-wider">
          Visual Portfolio
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
          Padma's Floral Lookbook & Gallery
        </h1>
        <p className="text-sm text-stone-600">
          A glimpse into the real celebrations, weddings, and rituals adorned with our fresh flowers in Ramanagara & Bengaluru.
        </p>

        {/* Upload Button */}
        <div className="pt-2">
          <button
            onClick={handleOpenUploadModal}
            className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 px-4 py-2 rounded-xl text-xs font-semibold transition-colors border border-stone-200 focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
          >
            <UploadCloud className="w-4 h-4 text-[#143D2B]" aria-hidden="true" />
            <span>Upload Photo to Lookbook</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2" role="group" aria-label="Filter gallery by category">
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none ${
              filter === cat
                ? 'bg-[#143D2B] text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
            }`}
            aria-pressed={filter === cat}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Gallery Grid or Empty State */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title="No photos in this collection"
          description="We are constantly photographing fresh garland creations and wedding floral decor. Check back soon or request custom photos on WhatsApp."
          primaryAction={{
            label: 'View All Photos',
            onClick: () => setFilter('All'),
          }}
          secondaryAction={{
            label: 'Request Photos on WhatsApp',
            href: whatsappService.getGreetingUrl('Hello Padma, can you share more photos of your recent floral arrangements?'),
          }}
          className="my-8"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <button
            key={item.id}
            type="button"
            className="group relative bg-white text-left rounded-2xl overflow-hidden border border-stone-200/90 shadow-xs hover:shadow-md hover:border-stone-300 transition-all duration-300 w-full focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
            onClick={() => handleOpenLightbox(item)}
            aria-label={`View photo and details for ${item.title} (${item.category})`}
          >
            <div className="aspect-4/3 overflow-hidden bg-stone-100">
              <img
                src={getOptimizedImageUrl(item.image_url, 480)}
                alt={item.title}
                width="480"
                height="360"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={e => {
                  (e.target as HTMLImageElement).src =
                    '/images/products/flower-decorations.jpg';
                }}
              />
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#a12c3b] uppercase tracking-wider">
                  {item.category}
                </span>
                {item.image_url.includes('supabase.co') && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                    ✓ Supabase Storage
                  </span>
                )}
              </div>
              <h3 className="font-serif font-bold text-base text-stone-900 mt-1 group-hover:text-[#143D2B]">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-xs text-stone-600 mt-1 line-clamp-2">{item.description}</p>
              )}
              <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-[#143D2B] font-semibold">View Details</span>
                <span className="text-stone-600">Ramanagara Atelier</span>
              </div>
            </div>
          </button>
        ))}
      </div>
      )}

      {/* Lightbox Modal */}
      {activeModalItem && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gallery-lightbox-title"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-xl relative animate-fade-in border border-stone-200">
            <button
              type="button"
              onClick={handleCloseLightbox}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-stone-900/60 text-white flex items-center justify-center hover:bg-stone-900 focus-visible:outline-white focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Close photo preview dialog"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="aspect-16/10 bg-stone-100 overflow-hidden">
              <img
                src={getOptimizedImageUrl(activeModalItem.image_url, 900)}
                alt={activeModalItem.title}
                width="900"
                height="560"
                decoding="async"
                className="w-full h-full object-cover"
                onError={e => {
                  (e.target as HTMLImageElement).src =
                    '/images/products/flower-decorations.jpg';
                }}
              />
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs font-bold text-[#a12c3b] uppercase tracking-wider">
                  {activeModalItem.category}
                </span>
                <h3 id="gallery-lightbox-title" className="font-serif font-bold text-xl text-stone-900 mt-1">
                  {activeModalItem.title}
                </h3>
                {activeModalItem.description && (
                  <p className="text-sm text-stone-600 mt-2">{activeModalItem.description}</p>
                )}
              </div>

              <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-stone-600">
                  Crafted by Padma's Floral in Ramanagara
                </span>
                <button
                  type="button"
                  onClick={() => handleOrderSimilar(activeModalItem)}
                  className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:outline-none"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  <span>Inquire Similar on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal (Supabase Storage 'gallery-images') */}
      {isUploadModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gallery-upload-title"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl animate-fade-in border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 id="gallery-upload-title" className="font-serif font-bold text-lg text-stone-900">
                Upload to Lookbook & Gallery
              </h3>
              <button
                type="button"
                onClick={handleCloseUploadModal}
                className="p-1 text-stone-500 hover:text-stone-700 rounded-full focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                aria-label="Close upload dialog"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveNewGalleryItem} className="space-y-4 text-xs">
              <div>
                <label htmlFor="gallery-upload-item-title" className="font-semibold text-stone-700 block mb-1">
                  Title / Event Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="gallery-upload-item-title"
                  type="text"
                  required
                  placeholder="e.g. Traditional Wedding Stage Decor"
                  value={newPhoto.title}
                  onChange={e => setNewPhoto({ ...newPhoto, title: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                />
              </div>

              <div>
                <label htmlFor="gallery-upload-category" className="font-semibold text-stone-700 block mb-1">Category</label>
                <select
                  id="gallery-upload-category"
                  value={newPhoto.category}
                  onChange={e => setNewPhoto({ ...newPhoto, category: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                >
                  <option value="Wedding">Wedding</option>
                  <option value="Traditional">Traditional</option>
                  <option value="Bouquets">Bouquets</option>
                  <option value="Events">Events</option>
                </select>
              </div>

              {/* Upload to gallery-images bucket */}
              <ImageUploadWidget
                currentUrl={newPhoto.image_url}
                bucket="gallery-images"
                nameHint={newPhoto.title || 'lookbook'}
                label="Lookbook Photo (Supabase Storage: gallery-images)"
                onChange={url => setNewPhoto({ ...newPhoto, image_url: url })}
              />

              <div>
                <label htmlFor="gallery-upload-desc" className="font-semibold text-stone-700 block mb-1">Description (Optional)</label>
                <textarea
                  id="gallery-upload-desc"
                  rows={2}
                  placeholder="Flower types used, location, or customer notes..."
                  value={newPhoto.description}
                  onChange={e => setNewPhoto({ ...newPhoto, description: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseUploadModal}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold focus-visible:ring-2 focus-visible:ring-stone-600 focus-visible:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPhoto.image_url}
                  className="px-5 py-2 bg-[#143D2B] hover:bg-[#1e5a3f] disabled:opacity-50 text-white rounded-xl font-semibold shadow-md focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                >
                  Add to Gallery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
