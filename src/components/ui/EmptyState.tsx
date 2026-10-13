import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, Flower2 } from 'lucide-react';

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  to?: string;
  href?: string;
  icon?: LucideIcon;
  target?: string;
}

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  suggestions?: string[];
  onSelectSuggestion?: (suggestion: string) => void;
  className?: string;
  role?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Flower2,
  title,
  description,
  primaryAction,
  secondaryAction,
  suggestions,
  onSelectSuggestion,
  className = '',
  role = 'region',
}) => {
  const renderAction = (action: EmptyStateAction, isPrimary: boolean) => {
    const IconComp = action.icon;
    const baseClass = isPrimary
      ? 'touch-target-44 inline-flex items-center justify-center gap-2 bg-[#143D2B] hover:bg-[#1e5a3f] text-white px-6 py-3 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors'
      : 'touch-target-44 inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors';

    const content = (
      <>
        <span>{action.label}</span>
        {IconComp && <IconComp className="w-4 h-4 flex-shrink-0" aria-hidden="true" />}
      </>
    );

    if (action.to) {
      return (
        <Link to={action.to} className={baseClass}>
          {content}
        </Link>
      );
    }

    if (action.href) {
      return (
        <a
          href={action.href}
          target={action.target || '_blank'}
          rel="noopener noreferrer"
          className={baseClass}
        >
          {content}
        </a>
      );
    }

    return (
      <button type="button" onClick={action.onClick} className={baseClass}>
        {content}
      </button>
    );
  };

  return (
    <div
      role={role}
      aria-label={title}
      className={`text-center py-12 sm:py-16 px-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4 max-w-xl mx-auto animate-fade-in ${className}`}
    >
      {/* Icon Badge */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-stone-100/90 border border-stone-200/60 flex items-center justify-center text-[#143D2B] shadow-inner">
        <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-stone-500" aria-hidden="true" />
      </div>

      {/* Text Container */}
      <div className="space-y-2 max-w-md mx-auto">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Suggested Search Terms / Category Chips */}
      {suggestions && suggestions.length > 0 && (
        <div className="pt-2 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
            Suggested Collections:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-sm mx-auto">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectSuggestion?.(s)}
                className="touch-target-44 text-[11px] font-medium bg-stone-100 hover:bg-[#143D2B]/10 hover:text-[#143D2B] text-stone-700 px-3 py-1.5 rounded-full border border-stone-200 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {(primaryAction || secondaryAction) && (
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          {primaryAction && renderAction(primaryAction, true)}
          {secondaryAction && renderAction(secondaryAction, false)}
        </div>
      )}
    </div>
  );
};
