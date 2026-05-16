import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Purchases from './pages/Purchases';
import AddEditPurchase from './pages/AddEditPurchase';
import Library from './pages/Library';
import Subscriptions from './pages/Subscriptions';
import SubscriptionDetail from './pages/SubscriptionDetail';
import Settings from './pages/Settings';
import ImportCsv from './pages/ImportCsv';
import { useData } from './data/store';
import { applyTheme } from './utils/theme';

export default function AppRoutes() {
  const { settings } = useData();

  useEffect(() => {
    applyTheme(settings.themeColor, settings.darkMode);
  }, [settings.themeColor, settings.darkMode]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/purchases/new" element={<AddEditPurchase />} />
        <Route path="/purchases/:id/edit" element={<AddEditPurchase />} />
        <Route path="/library" element={<Library />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route
          path="/subscriptions/:id"
          element={<SubscriptionDetail />}
        />
        <Route path="/settings" element={<Settings />} />
        <Route path="/import" element={<ImportCsv />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
