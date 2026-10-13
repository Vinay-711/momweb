import React, { useEffect, useRef } from 'react';

interface StructuredDataProps {
  /** The JSON-LD data object (must be a valid Schema.org object). */
  data: object | object[];
}

/**
 * Injects JSON-LD structured data into <head> as a <script type="application/ld+json">.
 * Cleans up on unmount to prevent duplicate schemas during SPA navigation.
 *
 * Usage:
 *   <StructuredData data={buildLocalBusinessJsonLd({ name: "...", phone: "..." })} />
 *   <StructuredData data={[schema1, schema2]} />
 */
export const StructuredData: React.FC<StructuredDataProps> = ({ data }) => {
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // Create and inject the script element
    const script = document.createElement('script');
    script.type = 'application/ld+json';

    // Support both single objects and arrays of schemas
    const jsonLd = Array.isArray(data) ? data : data;
    script.textContent = JSON.stringify(jsonLd, null, 0);

    document.head.appendChild(script);
    scriptRef.current = script;

    // Cleanup on unmount or data change
    return () => {
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, [data]);

  return null; // This component renders nothing visible
};
