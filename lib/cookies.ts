// Cookie consent management utilities
export const COOKIE_CONSENT_KEY = 'cookie_consent';
export const COOKIE_CONSENT_DATE_KEY = 'cookie_consent_date';

export type CookieConsent = 'accepted' | 'rejected' | null;

export interface CookiePreferences {
  essential: boolean;
  advertising: boolean;
  analytics: boolean;
}

// Ezoic consent handling removed for simpler implementation

/**
 * Get current cookie consent status
 */
export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
  return consent as CookieConsent;
}

/**
 * Check if user has given Consent for advertising cookies
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

// Ezoic consent handling removed for simpler implementation