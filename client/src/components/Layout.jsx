import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

const FULL_SCREEN_ROUTES = ['/'];

export default function Layout() {
  const { pathname } = useLocation();
  const isFullScreen = FULL_SCREEN_ROUTES.includes(pathname);

  return (
    <div
      className="flex flex-col h-full max-w-lg mx-auto relative"
      style={{ background: '#fbf7ef' }}
    >
      <main
        className={`flex-1 ${isFullScreen ? 'overflow-hidden' : 'overflow-y-auto'}`}
        style={{ paddingBottom: isFullScreen ? 0 : 'calc(4.5rem + env(safe-area-inset-bottom))' }}
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
