import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data-provider';
import { validateStoreSettings } from '@/lib/validations/settings';
import { ALGERIAN_68_WILAYAS } from '@/lib/data/wilayas';
import { getTranslation } from '@/lib/i18n/locales';
import { resolveApiLanguage, buildApiErrorResponse } from '@/app/api/_utils/api-i18n';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const lang = req ? resolveApiLanguage(req) : 'fr';

  try {
    const store = getDataStore();
    const settings = await store.getSettings();

    // Ensure all 68 wilayas are present in wilayaShippingFees
    const fees = { ...(settings.wilayaShippingFees || {}) };
    let hasMissing = false;

    for (const w of ALGERIAN_68_WILAYAS) {
      if (!fees[w.code]) {
        fees[w.code] = {
          homeFee: w.homeDeliveryFee,
          deskFee: w.deskFee,
          active: w.isAvailable ?? true,
        };
        hasMissing = true;
      }
    }

    if (hasMissing) {
      settings.wilayaShippingFees = fees;
    }

    if (settings.freeShippingThreshold === undefined) {
      settings.freeShippingThreshold = 15000;
    }
    if (!settings.communeShippingFees) {
      settings.communeShippingFees = {};
    }

    return NextResponse.json(
      {
        success: true,
        settings,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('[API Settings GET Error]:', error);
    return buildApiErrorResponse(lang, {
      status: 500,
      errorCode: 'INTERNAL_ERROR',
      errorKey: 'api.error.internal',
      frFallback: error?.message || 'Erreur lors de la récupération des paramètres.',
    });
  }
}

export async function PUT(req: NextRequest) {
  const lang = resolveApiLanguage(req);

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return buildApiErrorResponse(lang, {
        status: 400,
        errorCode: 'INVALID_JSON',
        errorKey: 'api.error.invalid_json',
      });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return buildApiErrorResponse(lang, {
        status: 400,
        errorCode: 'INVALID_SETTINGS',
        errorKey: 'api.error.invalid_settings',
      });
    }

    const validation = validateStoreSettings(body, lang);

    if (!validation.valid || !validation.data) {
      return buildApiErrorResponse(lang, {
        status: 400,
        errorCode: validation.errorCode || 'INVALID_SETTINGS',
        errorKey: validation.errorKey || 'api.error.invalid_settings',
        frFallback: validation.error || 'Paramètres invalides.',
        extra: {
          errors: validation.errors,
          errorKeys: validation.errorKeys,
          issues: validation.issues,
        },
      });
    }

    const store = getDataStore();
    const current = await store.getSettings();

    // Deep merge wilayaShippingFees to preserve other wilayas
    const mergedFees = {
      ...(current.wilayaShippingFees || {}),
      ...(validation.data.wilayaShippingFees || {}),
    };

    // Update wilayasDelivery array in tandem if it exists
    const updatedDeliveryArray = (current.wilayasDelivery || ALGERIAN_68_WILAYAS).map((w) => {
      const updatedFee = mergedFees[w.code];
      if (updatedFee) {
        return {
          ...w,
          homeDeliveryFee: updatedFee.homeFee,
          deskFee: updatedFee.deskFee,
          fee: updatedFee.homeFee,
          isAvailable: updatedFee.active,
        };
      }
      return w;
    });

    const updatePayload: any = {
      ...validation.data,
      wilayaShippingFees: mergedFees,
      wilayasDelivery: updatedDeliveryArray,
      ...(validation.data.communeShippingFees !== undefined
        ? { communeShippingFees: validation.data.communeShippingFees }
        : {}),
    };

    const saved = await store.updateSettings(updatePayload);

    return NextResponse.json(
      {
        success: true,
        settings: saved,
        message: getTranslation(lang, 'admin.settings.saved_toast', 'Paramètres enregistrés avec succès.'),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('[API Settings PUT Error]:', error);
    return buildApiErrorResponse(lang, {
      status: 500,
      errorCode: 'INTERNAL_ERROR',
      errorKey: 'api.error.internal',
      frFallback: error?.message || "Erreur lors de l'enregistrement des paramètres.",
    });
  }
}
