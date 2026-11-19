import { cookies } from 'next/headers';
import { SupportedLanguage } from '@/lib/i18n/types';

const LANG_COOKIE_NAME = 'vip_tadj_lang';

/**
 * Safely reads the active storefront/SSR language from cookies,
 * defaulting to 'ar' if unset or if cookies() is unavailable (e.g. unit tests).
 */
export function getServerLanguage(): SupportedLanguage {
  try {
    const cookieStore = cookies();
    const rawLang = cookieStore.get(LANG_COOKIE_NAME)?.value;
    if (rawLang === 'fr' || rawLang === 'en' || rawLang === 'ar') {
      return rawLang;
    }
  } catch {
    // Safe fallback outside Next.js request context
  }
  return 'ar';
}
