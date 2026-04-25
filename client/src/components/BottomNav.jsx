import { NavLink, useNavigate } from 'react-router-dom';
import { MapPin, CalendarDays, Plus, User } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 safe-bottom z-10">
      <div className="flex items-center justify-around px-2 h-16 max-w-lg mx-auto">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors ${
              isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <MapPin size={22} />
          <span className="text-xs font-medium">Map</span>
        </NavLink>

        <NavLink
          to="/my-games"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors ${
              isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <CalendarDays size={22} />
          <span className="text-xs font-medium">My Games</span>
        </NavLink>

        <button
          onClick={() => navigate('/create')}
          className="flex items-center justify-center w-14 h-14 bg-accent-500 rounded-full shadow-lg shadow-accent-500/30 hover:bg-accent-600 active:scale-95 transition-all -mt-5"
        >
          <Plus size={26} className="text-white" />
        </button>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors ${
              isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <User size={22} />
          <span className="text-xs font-medium">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}
