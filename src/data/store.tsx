import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppData, Purchase, Settings, Subscription } from './types';
import { createId, exportData, loadData, saveData } from './repository';

interface DataContextValue {
  purchases: Purchase[];
  subscriptions: Subscription[];
  settings: Settings;
  addPurchase: (p: Omit<Purchase, 'id'>) => void;
  updatePurchase: (p: Purchase) => void;
  deletePurchase: (id: string) => void;
  markDelivered: (id: string, deliveredDate: string) => void;
  addSubscription: (s: Omit<Subscription, 'id'>) => void;
  updateSubscription: (s: Subscription) => void;
  deleteSubscription: (id: string) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  exportAll: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

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
    }),
    [data],
  );

  return (
    <DataContext.Provider value={value}>{children}</DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
