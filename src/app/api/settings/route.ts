import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data-provider';
import { updateStoreSettingsSchema } from '@/lib/validations/settings';
import { ALGERIAN_58_WILAYAS } from '@/lib/data/wilayas';

export async function GET() {
  try {
    const store = getDataStore();
    const settings = await store.getSettings();

    // Ensure all 58 wilayas are present in wilayaShippingFees
    const fees = { ...(settings.wilayaShippingFees || {}) };
    let hasMissing = false;

    for (const w of ALGERIAN_58_WILAYAS) {
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

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('[API Settings GET Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la récupération des paramètres.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = updateStoreSettingsSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0] ? String(issue.path[0]) : 'general';
        errors[field] = issue.message;
      }
      return NextResponse.json(
        { success: false, error: 'Paramètres invalides.', errors },
        { status: 400 }
      );
    }

    const store = getDataStore();
    const current = await store.getSettings();

    // Deep merge wilayaShippingFees to preserve other 57 wilayas
    const mergedFees = {
      ...(current.wilayaShippingFees || {}),
      ...(validation.data.wilayaShippingFees || {}),
    };

    // Update wilayasDelivery array in tandem if it exists
    const updatedDeliveryArray = (current.wilayasDelivery || ALGERIAN_58_WILAYAS).map((w) => {
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
    };

    const saved = await store.updateSettings(updatePayload);

    return NextResponse.json({
      success: true,
      settings: saved,
      message: 'Paramètres enregistrés avec succès.',
    });
  } catch (error: any) {
    console.error('[API Settings PUT Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de l\'enregistrement des paramètres.' },
      { status: 500 }
    );
  }
}
