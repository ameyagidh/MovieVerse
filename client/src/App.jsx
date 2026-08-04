import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import HomePage from './pages/HomePage.jsx';
import BrowsePage from './pages/BrowsePage.jsx';
import MovieDetailPage from './pages/MovieDetailPage.jsx';
import WatchlistPage from './pages/WatchlistPage.jsx';

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: '2rem' }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div>
      <Navbar />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedLayout>
            <HomePage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/browse"
        element={
          <ProtectedLayout>
            <BrowsePage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/movies/:id"
        element={
          <ProtectedLayout>
            <MovieDetailPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/watchlist"
        element={
          <ProtectedLayout>
            <WatchlistPage />
          </ProtectedLayout>
        }
      />
    </Routes>
  );
}
