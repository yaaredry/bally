import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MapHome from './pages/MapHome';
import GameDetail from './pages/GameDetail';
import CreateGame from './pages/CreateGame';
import Profile from './pages/Profile';
import MyGames from './pages/MyGames';
import HostDashboard from './pages/HostDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import UserDetail from './pages/admin/UserDetail';
import Games from './pages/admin/Games';
import AdminGameDetail from './pages/admin/GameDetail';
import Locations from './pages/admin/Locations';
import Ratings from './pages/admin/Ratings';
import Matching from './pages/admin/Matching';

function AdminProtectedRoute() {
  const { admin, loading } = useAdminAuth();
  if (loading) return null;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return <AdminLayout />;
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-brand-50">
        <div className="text-center">
          <div className="text-4xl mb-2">🏐</div>
          <p className="text-brand-600 font-semibold">Bally</p>
        </div>
      </div>
    );
  }

  return (
    <AdminAuthProvider>
      <Routes>
        {/* Player app */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<MapHome />} />
            <Route path="/games/:id" element={<GameDetail />} />
            <Route path="/create" element={<CreateGame />} />
            <Route path="/my-games" element={<MyGames />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/host/:gameId" element={<HostDashboard />} />
          </Route>
        </Route>

        {/* Admin app */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminProtectedRoute />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="games" element={<Games />} />
          <Route path="games/:id" element={<AdminGameDetail />} />
          <Route path="locations" element={<Locations />} />
          <Route path="ratings" element={<Ratings />} />
          <Route path="matching" element={<Matching />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminAuthProvider>
  );
}
