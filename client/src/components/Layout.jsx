import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

// Map screen needs its own full-height container without padding
const FULL_SCREEN_ROUTES = ['/'];

export default function Layout() {
  const { pathname } = useLocation();
  const isFullScreen = FULL_SCREEN_ROUTES.includes(pathname);

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto relative">
      {/* Header */}
      <header className="flex items-center px-4 h-14 bg-white border-b border-slate-100 shrink-0 z-10">
        <span className="text-xl font-bold text-brand-600 tracking-tight">Bally</span>
        <span className="ml-1 text-xl">🏐</span>
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
