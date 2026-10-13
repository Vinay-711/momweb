import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  RefreshCw,
  Link as LinkIcon,
  HardDrive
} from 'lucide-react';
import { storageService, StorageBucket } from '../services/storageService';

interface ImageUploadWidgetProps {
  currentUrl?: string;
  bucket?: StorageBucket;
  nameHint?: string;
  label?: string;
  onChange: (url: string) => void;
  className?: string;
}

export const ImageUploadWidget: React.FC<ImageUploadWidgetProps> = ({
  currentUrl,
  bucket = 'product-images',
  nameHint = 'flower',
  label = 'Product Image',
  onChange,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [stats, setStats] = useState<{ original: string; compressed: string; savings: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [manualUrl, setManualUrl] = useState(currentUrl || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const processAndUploadFile = async (file: File) => {
    setErrorMsg('');
    setStats(null);

    // 1. Client-side validation
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setErrorMsg('Invalid file format. Please upload JPG, PNG, WebP, AVIF, or GIF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(`File is ${(file.size / (1024 * 1024)).toFixed(2)} MB. Maximum allowed size is 5.00 MB.`);
      return;
    }

    try {
      setOptimizing(true);
      setUploading(true);

      // 2. Upload via storage service with client-side downscaling & compression
      const result = await storageService.uploadImage(bucket, file, nameHint, {
        optimize: true,
        upsert: true,
      });

      if (result.originalSize > result.uploadedSize) {
        const savings = Math.round(((result.originalSize - result.uploadedSize) / result.originalSize) * 100);
        setStats({
          original: formatSize(result.originalSize),
          compressed: formatSize(result.uploadedSize),
          savings,
        });
      }

      setManualUrl(result.url);
      onChange(result.url);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to upload photo to Supabase Storage.');
    } finally {
      setOptimizing(false);
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAndUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processAndUploadFile(e.target.files[0]);
    }
  };

  const handleManualUrlSubmit = () => {
    if (manualUrl.trim()) {
      onChange(manualUrl.trim());
      setErrorMsg('');
    }
  };

  const handleRemoveImage = () => {
    setManualUrl('');
    setStats(null);
    setErrorMsg('');
    onChange('');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label and Tab Selector */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-stone-700 text-xs block" id={`label-${bucket}-${nameHint}`}>
          {label}
        </span>
        <div role="tablist" aria-label="Image source options" className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg text-[10px] font-semibold text-stone-600">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'upload'}
            aria-controls={`panel-upload-${bucket}-${nameHint}`}
            id={`tab-upload-${bucket}-${nameHint}`}
            onClick={() => setActiveTab('upload')}
            className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-all ${
              activeTab === 'upload' ? 'bg-white text-[#143D2B] shadow-xs' : 'hover:text-stone-900'
            }`}
          >
            <UploadCloud className="w-3 h-3" aria-hidden="true" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'url'}
            aria-controls={`panel-url-${bucket}-${nameHint}`}
            id={`tab-url-${bucket}-${nameHint}`}
            onClick={() => setActiveTab('url')}
            className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-all ${
              activeTab === 'url' ? 'bg-white text-[#143D2B] shadow-xs' : 'hover:text-stone-900'
            }`}
          >
            <LinkIcon className="w-3 h-3" aria-hidden="true" />
            <span>URL</span>
          </button>
        </div>
      </div>

      {/* Upload Zone Tab */}
      {activeTab === 'upload' ? (
        <div
          role="tabpanel"
          id={`panel-upload-${bucket}-${nameHint}`}
          aria-labelledby={`tab-upload-${bucket}-${nameHint}`}
          className="space-y-2"
        >
          <div
            tabIndex={0}
            role="button"
            aria-label={`Upload photo for ${label}. Click or press Enter to browse files`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!uploading) fileInputRef.current?.click();
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none ${
              isDragging
                ? 'border-[#143D2B] bg-[#143D2B]/5'
                : 'border-stone-200 hover:border-[#143D2B]/40 bg-stone-50/60'
            } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              aria-label={`Select photo file for ${label}`}
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />

            {uploading ? (
              <div role="status" aria-live="polite" className="py-4 space-y-2 flex flex-col items-center justify-center">
                <RefreshCw className="w-6 h-6 text-[#143D2B] animate-spin" aria-hidden="true" />
                <span className="text-xs font-bold text-stone-700">
                  {optimizing ? 'Optimizing & Compressing Bloom Photo...' : 'Uploading to Supabase Storage...'}
                </span>
                <span className="text-[10px] text-stone-600">
                  Converting to high-fidelity WebP for instant mobile loading
                </span>
              </div>
            ) : (
              <div className="py-2 space-y-1.5 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-[#143D2B]/10 text-[#143D2B] flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-800">
                    Click to select or drag photo here
                  </p>
                  <p className="text-[10px] text-stone-600">
                    JPG, PNG, WebP or AVIF • Max 5MB • Auto-compressed for mobile
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Manual URL Tab */
        <div
          role="tabpanel"
          id={`panel-url-${bucket}-${nameHint}`}
          aria-labelledby={`tab-url-${bucket}-${nameHint}`}
          className="flex gap-2 items-center"
        >
          <label htmlFor={`image-manual-url-${bucket}-${nameHint}`} className="sr-only">
            Image URL for {label}
          </label>
          <input
            id={`image-manual-url-${bucket}-${nameHint}`}
            type="url"
            placeholder="https://images.unsplash.com/... or Supabase URL"
            value={manualUrl}
            onChange={e => setManualUrl(e.target.value)}
            onBlur={handleManualUrlSubmit}
            className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
          />
          <button
            type="button"
            aria-label={`Apply image URL for ${label}`}
            onClick={handleManualUrlSubmit}
            className="bg-stone-200 hover:bg-stone-300 text-stone-700 px-3 py-2 rounded-xl text-xs font-semibold focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
          >
            Apply
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div role="alert" aria-live="assertive" className="bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-center gap-2 text-xs text-red-700 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Compression Savings Badge */}
      {stats && stats.savings > 0 && (
        <div role="status" aria-live="polite" className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs text-emerald-800 animate-fade-in">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
            <span>Optimized: {stats.original} ➔ {stats.compressed}</span>
          </div>
          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            -{stats.savings}% Smaller
          </span>
        </div>
      )}

      {/* Preview Card */}
      {currentUrl && (
        <div className="relative group rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 p-2 flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-200 shrink-0 border border-stone-300">
            <img
              src={currentUrl}
              alt={`Active preview for ${label}`}
              className="w-full h-full object-cover"
              onError={e => {
                (e.target as HTMLImageElement).src =
                  '/images/products/jasmine-garland.jpg';
              }}
            />
          </div>

          <div className="flex-1 min-w-0 text-xs">
            <p className="font-semibold text-stone-800 flex items-center gap-1.5 truncate">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>Active Image Set</span>
            </p>
            <p className="text-[10px] text-stone-600 truncate mt-0.5" title={currentUrl}>
              {currentUrl.includes('supabase.co') ? '✓ Hosted on Supabase Storage' : currentUrl}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label={`Replace photo for ${label}`}
              className="p-1.5 text-stone-500 hover:text-[#143D2B] hover:bg-stone-200 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleRemoveImage}
              aria-label={`Remove photo for ${label}`}
              className="p-1.5 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:outline-none"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
