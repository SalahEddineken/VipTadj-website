import { NextRequest, NextResponse } from 'next/server';
import { SupportedLanguage } from '@/lib/i18n/types';
import { getTranslation, formatTranslation } from '@/lib/i18n/locales';

const LANG_COOKIE_NAME = 'vip_tadj_lang';

function normalizeLangTag(raw?: string | null): SupportedLanguage | null {
  if (!raw || typeof raw !== 'string') return null;
  const primary = raw.trim().toLowerCase().split('-')[0].split('_')[0];
  if (primary === 'fr' || primary === 'en' || primary === 'ar') {
    return primary;
  }
  return null;
}

/**
 * Resolves the API request language in priority order:
 * 1. `x-lang` header
 * 2. `vip_tadj_lang` cookie
 * 3. `Accept-Language` header primary tag
 * 4. `'fr'` default (preserves 100% backward compatibility with headerless/cookieless Vitest API tests)
 */
export function resolveApiLanguage(req: NextRequest): SupportedLanguage {
  const xLang = normalizeLangTag(req.headers.get('x-lang'));
  if (xLang) return xLang;

  try {
    const cookieLang = normalizeLangTag(req.cookies?.get(LANG_COOKIE_NAME)?.value);
    if (cookieLang) return cookieLang;
  } catch {
    // Ignore cookie read issues on synthetic Request objects
  }

  const acceptLang = req.headers.get('accept-language');
  if (acceptLang) {
    const parts = acceptLang.split(',');
    for (const part of parts) {
      const primary = part.split(';')[0]?.trim().toLowerCase().split('-')[0];
      const matched = normalizeLangTag(primary);
      if (matched) return matched;
    }
  }

  return 'fr';
}

export interface ApiErrorOptions {
  status: number;
  errorCode: string;
  errorKey: string;
  errorParams?: Record<string, string | number>;
  frFallback?: string;
  code?: string;
  extra?: Record<string, unknown>;
}

/**
 * Builds a structured localized NextResponse error payload.
 * When `lang !== 'fr'`, `error` is strictly localized via `getTranslation` so raw FR/EN
 * strings never leak into AR/EN responses. When `lang === 'fr'`, `frFallback` (if provided)
 * can preserve granular French contract substrings.
 */
export function buildApiErrorResponse(
  lang: SupportedLanguage,
  opts: ApiErrorOptions
): NextResponse {
  const translated = formatTranslation(
    getTranslation(lang, opts.errorKey, opts.frFallback || ''),
    opts.errorParams || {}
  );
  const errorMessage =
    lang === 'fr' && opts.frFallback ? opts.frFallback : translated;

  const payload: Record<string, unknown> = {
    success: false,
    error: errorMessage,
    errorCode: opts.errorCode,
    errorKey: opts.errorKey,
    ...(opts.errorParams ? { errorParams: opts.errorParams } : {}),
    ...(opts.code ? { code: opts.code } : {}),
    ...(opts.extra || {}),
  };

  return NextResponse.json(payload, { status: opts.status });
}

export function getApiLocalizedMessage(
  lang: SupportedLanguage,
  messages: Record<SupportedLanguage, string>
): string {
  return messages[lang] || messages.fr;
}
