/**
 * VIP TADJ — Catalog Seeding API Route Handler
 * Endpoint: /api/seed
 * Methods: GET (dev-friendly), POST (admin/cli)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data-provider';
import { runCatalogSeed } from '@/lib/seed/seed-runner';
import { resolveApiLanguage, buildApiErrorResponse } from '@/app/api/_utils/api-i18n';

function isAuthorized(request: NextRequest): boolean {
  // Always allowed in development mode
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    return true;
  }

  const configuredSecret = process.env.SEED_SECRET;
  // In production, an unset SEED_SECRET must deny authorization to prevent unauthenticated database wipes
  if (process.env.NODE_ENV === 'production' && !configuredSecret) {
    console.error('[API /api/seed] Access denied: SEED_SECRET is not configured in production.');
    return false;
  }

  if (!configuredSecret) {
    return true;
  }

  const headerSecret = request.headers.get('x-seed-secret');
  const querySecret = request.nextUrl.searchParams.get('secret');

  return headerSecret === configuredSecret || querySecret === configuredSecret;
}

export async function POST(request: NextRequest) {
  const lang = resolveApiLanguage(request);

  if (!isAuthorized(request)) {
    return buildApiErrorResponse(lang, {
      status: 401,
      errorCode: 'UNAUTHORIZED',
      errorKey: 'api.error.unauthorized',
      frFallback: 'Non autorisé. Fournissez le secret de peuplement via x-seed-secret ou ?secret=.',
    });
  }

  try {
    const dataStore = getDataStore();
    const force = request.nextUrl.searchParams.get('force') !== 'false';
    const result = await runCatalogSeed(dataStore, force);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error('[API /api/seed] Erreur lors du peuplement:', error);
    return buildApiErrorResponse(lang, {
      status: 500,
      errorCode: 'INTERNAL_ERROR',
      errorKey: 'api.error.internal',
      frFallback: error?.message || 'Erreur interne du serveur lors du peuplement.',
    });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
