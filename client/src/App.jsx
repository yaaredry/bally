import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
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
    <Routes>
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
