import { useEffect } from 'react';

// Google Analytics Measurement ID
// Replace with your actual GA4 Measurement ID (format: G-XXXXXXXXXX)
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

export function GoogleAnalytics() {
  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof window === 'undefined') {
      return;
    }

    // Load Google Analytics script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script1);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      page_path: window.location.pathname,
    });

    // Make gtag available globally
    (window as any).gtag = gtag;

    return () => {
      // Cleanup: Remove script if component unmounts
      const existingScript = document.querySelector(`script[src*="${GA_MEASUREMENT_ID}"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return null;
}

// Helper function to track page views
export function trackPageView(path: string) {
  if (typeof window !== 'undefined' && (window as any).gtag && GA_MEASUREMENT_ID) {
    (window as any).gtag('config', GA_MEASUREMENT_ID, {
      page_path: path,
    });
  }
}

// Helper function to track events
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== 'undefined' && (window as any).gtag && GA_MEASUREMENT_ID) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// Declare global types for TypeScript
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

