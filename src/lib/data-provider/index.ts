import { IDataStore } from './interface';
import { FirestoreDataProvider } from './firestore-provider';
import { MockSeedDataProvider } from './mock-provider';
import { isFirebaseConfigured } from '@/lib/firebase/config';

const globalForDataStore = globalThis as unknown as {
  __vipTadjDataStore?: IDataStore;
};

export function getDataStore(): IDataStore {
  if (globalForDataStore.__vipTadjDataStore) {
    return globalForDataStore.__vipTadjDataStore;
  }

  if (isFirebaseConfigured()) {
    try {
      const store = new FirestoreDataProvider();
      console.info('[VIP TADJ DB] Active Provider: Cloud Firestore.');
      globalForDataStore.__vipTadjDataStore = store;
      return store;
    } catch (err) {
      console.warn(
        '[VIP TADJ DB] Failed to initialize FirestoreDataProvider, falling back to Mock:',
        err
      );
    }
  }

  console.info('[VIP TADJ DB] Active Provider: Zero-Config In-Memory Mock Seed Provider.');
  const store = new MockSeedDataProvider();
  globalForDataStore.__vipTadjDataStore = store;
  return store;
}

// Named exports for explicit testing or targeted consumption
export { FirestoreDataProvider, MockSeedDataProvider };
export * from './interface';
