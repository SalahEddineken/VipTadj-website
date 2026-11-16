'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { getDataStore } from '@/lib/data-provider';
import { orderAudioChime } from '@/lib/utils/orderAudioChime';

export interface AdminNotificationContextValue {
  pendingCount: number;
  isMuted: boolean;
  toggleMuted: () => boolean;
  refreshPendingCount: () => Promise<number>;
  lastAlertTime: Date | null;
}

const AdminNotificationContext = createContext<AdminNotificationContextValue | undefined>(undefined);

export function AdminNotificationProvider({ children }: { children: React.ReactNode }) {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [lastAlertTime, setLastAlertTime] = useState<Date | null>(null);
  const previousPendingRef = useRef<number | null>(null);

  useEffect(() => {
    setIsMuted(orderAudioChime.getMuted());
  }, []);

  const refreshPendingCount = useCallback(async (): Promise<number> => {
    try {
      let count = 0;

      // In browser runtime, query live server API to reflect real storefront orders
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
        try {
          const res = await fetch('/api/orders?status=pending', { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            count = Array.isArray(data.orders)
              ? data.orders.length
              : typeof data.total === 'number'
              ? data.total
              : 0;
          } else {
            const store = getDataStore();
            const orders = await store.getOrders({ status: 'pending' });
            count = orders.length;
          }
        } catch {
          const store = getDataStore();
          const orders = await store.getOrders({ status: 'pending' });
          count = orders.length;
        }
      } else {
        const store = getDataStore();
        const orders = await store.getOrders({ status: 'pending' });
        count = orders.length;
      }

      if (previousPendingRef.current !== null && count > previousPendingRef.current) {
        // New order arrived! Play chime & trigger alert
        await orderAudioChime.onIncomingOrder();
        setLastAlertTime(new Date());
      }

      previousPendingRef.current = count;
      setPendingCount(count);
      return count;
    } catch (err) {
      console.error('[VIP TADJ Admin] Failed to query pending orders count:', err);
      return 0;
    }
  }, []);

  useEffect(() => {
    refreshPendingCount();

    // 30-second live order detector polling loop
    const interval = setInterval(() => {
      refreshPendingCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshPendingCount]);

  const toggleMuted = useCallback((): boolean => {
    const newState = orderAudioChime.toggleMuted();
    setIsMuted(newState);
    return newState;
  }, []);

  return (
    <AdminNotificationContext.Provider
      value={{
        pendingCount,
        isMuted,
        toggleMuted,
        refreshPendingCount,
        lastAlertTime,
      }}
    >
      {children}
    </AdminNotificationContext.Provider>
  );
}

export function useAdminNotification(): AdminNotificationContextValue {
  const ctx = useContext(AdminNotificationContext);
  if (!ctx) {
    return {
      pendingCount: 0,
      isMuted: false,
      toggleMuted: () => false,
      refreshPendingCount: async () => 0,
      lastAlertTime: null,
    };
  }
  return ctx;
}
