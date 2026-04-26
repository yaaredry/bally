import { NavLink, useNavigate } from 'react-router-dom';

function MapIcon() {
  return <svg width={22} height={22} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4l5-1 6 2 5-1v12l-5 1-6-2-5 1z"/><path d="M7 3v15M13 5v15"/></svg>;
}
function CardsIcon() {
  return <svg width={22} height={22} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><rect x="3" y="3" width="14" height="6" rx="1.5"/><rect x="3" y="11" width="14" height="6" rx="1.5"/></svg>;
}
function PlusIcon() {
  return <svg width={22} height={22} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 4v12M4 10h12"/></svg>;
}
function ChatIcon() {
  return <svg width={22} height={22} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v7a2 2 0 01-2 2H8l-4 3v-3a2 2 0 01-1-2z"/></svg>;
}
function UserIcon() {
  return <svg width={22} height={22} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="7" r="3.2"/><path d="M3 17c0-3.5 3-6 7-6s7 2.5 7 6"/></svg>;
}

export default function BottomNav() {
  const navigate = useNavigate();

  const linkClass = (isActive) =>
    `flex flex-col items-center justify-center gap-0.5 transition-colors min-h-[44px] px-3 ${isActive ? 'text-ink' : 'text-ink-35'}`;

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.78)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '0.5px solid rgba(31,26,20,0.08)',
        paddingTop: 10,
        paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        zIndex: 50,
      }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto px-4">
        <NavLink to="/" end className={({ isActive }) => linkClass(isActive)}>
          <MapIcon />
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: -0.1 }}>Games</span>
        </NavLink>

        <NavLink to="/my-games" className={({ isActive }) => linkClass(isActive)}>
          <CardsIcon />
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: -0.1 }}>Mine</span>
        </NavLink>

        {/* Host FAB */}
        <button
          onClick={() => navigate('/create')}
          style={{
            width: 46, height: 46, borderRadius: 23,
            background: 'linear-gradient(180deg, #ee8856 0%, #d85e3a 100%)',
            boxShadow: '0 6px 18px rgba(216,89,59,0.30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', border: 'none', cursor: 'pointer',
          }}
        >
          <PlusIcon />
        </button>

        <NavLink to="/chats" className={({ isActive }) => linkClass(isActive)}>
          <ChatIcon />
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: -0.1 }}>Chats</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => linkClass(isActive)}>
          <UserIcon />
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: -0.1 }}>Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}
