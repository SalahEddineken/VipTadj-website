'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StoreSettings } from '@/types';

const DEFAULT_FALLBACK_PHONE = '+213 (0) 550 00 00 00';
const DEFAULT_FALLBACK_WHATSAPP = '+213550000000';

interface StoreSettingsContextValue {
  settings: StoreSettings | null;
  phone: string;
  whatsappNumber: string;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const StoreSettingsContext = createContext<StoreSettingsContextValue>({
  settings: null,
  phone: DEFAULT_FALLBACK_PHONE,
  whatsappNumber: DEFAULT_FALLBACK_WHATSAPP,
  loading: true,
  refreshSettings: async () => {},
});

export function StoreSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.success && data.settings) {
        setSettings(data.settings);
      }
    } catch {
      // Keep fallback settings if network request fails
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();

    const handleSettingsUpdated = () => {
      refreshSettings();
    };

    window.addEventListener('vip-settings-updated', handleSettingsUpdated);
    return () => {
      window.removeEventListener('vip-settings-updated', handleSettingsUpdated);
    };
  }, [refreshSettings]);

  const phone = settings?.phone?.trim() || DEFAULT_FALLBACK_PHONE;
  const whatsappNumber = settings?.whatsappNumber?.trim() || DEFAULT_FALLBACK_WHATSAPP;

  return (
    <StoreSettingsContext.Provider
      value={{
        settings,
        phone,
        whatsappNumber,
        loading,
        refreshSettings,
      }}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}
