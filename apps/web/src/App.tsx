import { Route, Routes, Link, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useGetHelloMessageQuery } from './store/apiSlice';
import type { RootState, AppDispatch } from './store';
import { clearCredentials } from './store/authSlice';
import { InstrumentsPage } from './pages/InstrumentsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { WatchlistPage } from './pages/WatchlistPage';

const DashboardPage = () => {
  const { data, isLoading, isError } = useGetHelloMessageQuery();

  if (isLoading) {
    return <p>Loading greeting from API...</p>;
  }

  if (isError || !data) {
    return <p>Could not load greeting from API.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        Trading Platform Dashboard (Skeleton)
      </h1>
      <p>{data.message}</p>
      <p className="mt-2 text-sm text-gray-600">
        This confirms the frontend, backend, and proxy are all wired together.
      </p>
    </div>
  );
};

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const authToken = useSelector((state: RootState) => state.auth.token);
  const location = useLocation();

  if (!authToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export const App = () => {
  const authState = useSelector((state: RootState) => state.auth);
  const dispatchFunction = useDispatch<AppDispatch>();

  function handleLogoutClick() {
    dispatchFunction(clearCredentials());
  }

  return (
    <div className="p-4">
      <nav className="mb-4 flex items-center justify-between gap-4">
        <div className="flex gap-4">
          <Link to="/" className="font-semibold">
            Dashboard
          </Link>
          <Link to="/instruments" className="font-semibold">
            Instruments
          </Link>
          <Link to="/watchlists" className="font-semibold">
            Watchlists
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {authState.user ? (
            <>
              <span className="text-sm">
                Signed in as <strong>{authState.user.displayName}</strong>
              </span>
              <button
                className="border rounded px-3 py-1 text-sm"
                onClick={handleLogoutClick}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm underline">
                Log in
              </Link>
              <Link to="/register" className="text-sm underline">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/instruments"
          element={
            <RequireAuth>
              <InstrumentsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/watchlists"
          element={
            <RequireAuth>
              <WatchlistPage />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </div>
  );
};

export default App;
