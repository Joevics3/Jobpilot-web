// Cookie consent management utilities
export const COOKIE_CONSENT_KEY = 'cookie_consent';
export const COOKIE_CONSENT_DATE_KEY = 'cookie_consent_date';

export type CookieConsent = 'accepted' | 'rejected' | null;

export interface CookiePreferences {
  essential: boolean;
  advertising: boolean;
  analytics: boolean;
}

/**
 * Get the current cookie consent status
 */
export function getCookieConsent(): CookieConsent {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(COOKIE_CONSENT_KEY) as CookieConsent;
}

/**
 * Check if user has given consent for advertising cookies
 */
export function hasAdvertisingConsent(): boolean {
  const consent = getCookieConsent();
  return consent === 'accepted';
}

/**
 * Check if user has rejected all non-essential cookies
 */
export function hasRejectedCookies(): boolean {
  const consent = getCookieConsent();
  return consent === 'rejected';
}

/**
 * Set cookie consent preference
 */
export function setCookieConsent(consent: CookieConsent): void {
  if (typeof window === 'undefined') return;
  
  if (consent) {
    localStorage.setItem(COOKIE_CONSENT_KEY, consent);
    localStorage.setItem(COOKIE_CONSENT_DATE_KEY, new Date().toISOString());
  } else {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    localStorage.removeItem(COOKIE_CONSENT_DATE_KEY);
  }
}

/**
 * Clear all non-essential localStorage data when cookies are rejected
 */
export function clearNonEssentialData(): void {
  if (typeof window === 'undefined') return;
  
  // Keep essential app data, clear analytics/advertising related data
  const keysToRemove = [
    'cached_jobs',
    'jobs_cache',
    'jobs_cache_timestamp',
    // Add any other analytics/advertising related localStorage keys
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
}

/**
 * Handle Ezoic script loading based on consent
 */
export function handleEzoicConsent(): void {
  if (typeof window === 'undefined') return;
  
  const consent = getCookieConsent();
  
  if (consent === 'rejected') {
    // User rejected non-essential cookies
    // Signal to Ezoic that user has opted out
    if (window.ezstandalone) {
      window.ezstandalone.cmd = window.ezstandalone.cmd || [];
      window.ezstandalone.cmd.push(() => {
        // Disable personalized ads
        window.ezstandalone.setDisablePersonalizedStatistics(true);
      });
    }
  } else if (consent === 'accepted') {
    // User accepted cookies - Ezoic scripts already loaded
    // Enable personalized ads
    if (window.ezstandalone) {
      window.ezstandalone.cmd = window.ezstandalone.cmd || [];
      window.ezstandalone.cmd.push(() => {
        window.ezstandalone.setDisablePersonalizedStatistics(false);
      });
    }
  }
}

// Extend Window interface for Ezoic
declare global {
  interface Window {
    ezstandalone?: {
      cmd: Array<() => void>;
      setDisablePersonalizedStatistics: (disable: boolean) => void;
    };
  }
}