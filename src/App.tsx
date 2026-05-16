import { useAuth } from './auth/AuthProvider';
import { DataProvider } from './data/store';
import AppRoutes from './AppRoutes';
import Login from './pages/Login';

export default function App() {
  const auth = useAuth();

  if (!auth.ready) {
    return (
      <div className="splash">
        <div className="splash-logo" aria-hidden>
          📚
        </div>
        <p>Loading…</p>
      </div>
    );
  }

  if (auth.cloudEnabled && !auth.user) {
    return <Login />;
  }

  return (
    <DataProvider key={auth.user?.id ?? 'local'}>
      <AppRoutes />
    </DataProvider>
  );
}
