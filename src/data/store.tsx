import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AppData, Purchase, Settings, Subscription } from './types';
import {
  coerceData,
  createId,
  exportData,
  loadData,
  saveData,
} from './repository';
import { fetchCloudData, saveCloudData } from './cloud';
import { supabase } from './supabase';
import { useAuth } from '../auth/AuthProvider';

interface DataContextValue {
  purchases: Purchase[];
  subscriptions: Subscription[];
  settings: Settings;
  addPurchase: (p: Omit<Purchase, 'id'>) => void;
  importPurchases: (list: Omit<Purchase, 'id'>[]) => void;
  updatePurchase: (p: Purchase) => void;
  deletePurchase: (id: string) => void;
  markDelivered: (id: string, deliveredDate: string) => void;
  addSubscription: (s: Omit<Subscription, 'id'>) => void;
  updateSubscription: (s: Subscription) => void;
  deleteSubscription: (id: string) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  exportAll: () => void;
  restoreData: (data: AppData) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [data, setData] = useState<AppData>(() => loadData());
  const [loading, setLoading] = useState(
    auth.cloudEnabled && !!auth.user,
  );
  const loadedRef = useRef(false);
  // Serialised form of the data last known to match the cloud — used to
  // ignore our own realtime echoes and skip redundant saves.
  const syncedRef = useRef('');
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load the signed-in user's library from the cloud. On their very
  // first sign-in (no cloud row yet) the local data is migrated up.
  useEffect(() => {
    if (!auth.cloudEnabled || !auth.user) {
      loadedRef.current = true;
      return;
    }
    const userId = auth.user.id;
    let cancelled = false;
    loadedRef.current = false;
    setLoading(true);
    fetchCloudData(userId)
      .then((cloud) => {
        if (cancelled) return;
        if (cloud) {
          syncedRef.current = JSON.stringify(cloud);
          setData(cloud);
        } else {
          const local = loadData();
          syncedRef.current = JSON.stringify(local);
          setData(local);
          saveCloudData(userId, local).catch(() => {});
        }
      })
      .catch(() => {
        /* keep the local cache if the cloud is unreachable */
      })
      .finally(() => {
        if (cancelled) return;
        loadedRef.current = true;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auth.cloudEnabled, auth.user?.id]);

  // Realtime: apply changes made on the user's other devices at once.
  useEffect(() => {
    if (!supabase || !auth.cloudEnabled || !auth.user) return;
    const userId = auth.user.id;
    const channel = supabase
      .channel(`user_data:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_data',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const incoming = (payload.new as { data?: Partial<AppData> })
            ?.data;
          if (!incoming) return;
          const serialized = JSON.stringify(incoming);
          if (serialized === syncedRef.current) return; // our own echo
          syncedRef.current = serialized;
          setData(coerceData(incoming));
        },
      )
      .subscribe();
    return () => {
      supabase!.removeChannel(channel);
    };
  }, [auth.cloudEnabled, auth.user?.id]);

  // Persist: always cache locally; push to the cloud once loaded.
  useEffect(() => {
    saveData(data);
    if (!loadedRef.current) return;
    if (!auth.cloudEnabled || !auth.user) return;
    const serialized = JSON.stringify(data);
    if (serialized === syncedRef.current) return; // unchanged / from remote
    const userId = auth.user.id;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      syncedRef.current = serialized;
      saveCloudData(userId, data).catch(() => {
        /* offline or transient — local cache keeps the data */
      });
    }, 600);
  }, [data, auth.cloudEnabled, auth.user]);

  const value = useMemo<DataContextValue>(
    () => ({
      purchases: data.purchases,
      subscriptions: data.subscriptions,
      settings: data.settings,
      addPurchase: (p) =>
        setData((d) => ({
          ...d,
          purchases: [...d.purchases, { ...p, id: createId() }],
        })),
      importPurchases: (list) =>
        setData((d) => ({
          ...d,
          purchases: [
            ...d.purchases,
            ...list.map((p) => ({ ...p, id: createId() })),
          ],
        })),
      updatePurchase: (p) =>
        setData((d) => ({
          ...d,
          purchases: d.purchases.map((x) => (x.id === p.id ? p : x)),
        })),
      deletePurchase: (id) =>
        setData((d) => ({
          ...d,
          purchases: d.purchases.filter((x) => x.id !== id),
        })),
      markDelivered: (id, deliveredDate) =>
        setData((d) => ({
          ...d,
          purchases: d.purchases.map((x) =>
            x.id === id
              ? { ...x, status: 'delivered', deliveredDate }
              : x,
          ),
        })),
      addSubscription: (s) =>
        setData((d) => ({
          ...d,
          subscriptions: [
            ...d.subscriptions,
            { ...s, id: createId() },
          ],
        })),
      updateSubscription: (s) =>
        setData((d) => ({
          ...d,
          subscriptions: d.subscriptions.map((x) =>
            x.id === s.id ? s : x,
          ),
        })),
      deleteSubscription: (id) =>
        setData((d) => ({
          ...d,
          subscriptions: d.subscriptions.filter((x) => x.id !== id),
        })),
      updateSettings: (partial) =>
        setData((d) => ({
          ...d,
          settings: { ...d.settings, ...partial },
        })),
      exportAll: () => exportData(data),
      restoreData: (next) => setData(next),
    }),
    [data],
  );

  if (loading) {
    return (
      <div className="splash">
        <div className="splash-logo" aria-hidden>
          📚
        </div>
        <p>Loading your library…</p>
      </div>
    );
  }

  return (
    <DataContext.Provider value={value}>{children}</DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
