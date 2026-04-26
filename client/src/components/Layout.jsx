import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import BottomNav from './BottomNav';
import { useAuth } from '../context/AuthContext';

// Map screen needs its own full-height container without padding
const FULL_SCREEN_ROUTES = ['/'];

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const isFullScreen = FULL_SCREEN_ROUTES.includes(pathname);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto relative">
      {/* Header */}
      <header className="flex items-center px-4 h-14 bg-white border-b border-slate-100 shrink-0 z-10">
        <span className="text-xl font-bold text-brand-600 tracking-tight">Bally</span>
        <span className="ml-1 text-xl">🏐</span>
        <button
          onClick={handleLogout}
          className="ml-auto p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Log out"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Content */}
      <main
        className={`flex-1 overflow-hidden ${isFullScreen ? '' : 'overflow-y-auto'}`}
        style={{ paddingBottom: isFullScreen ? '4rem' : '4.5rem' }}
      >
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
