import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/penduduk', label: 'Penduduk' },
  { to: '/kk', label: 'Kartu Keluarga' },
  { to: '/surat', label: 'Surat' },
];

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white flex flex-col flex-shrink-0">
        <div className="p-5 text-xl font-bold border-b border-gray-700 tracking-wide">
          SIDESA
        </div>

        <nav className="flex-1 py-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`block px-5 py-2.5 text-sm transition-colors ${
                location.pathname === item.to
                  ? 'bg-gray-700 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
          {user && (user.role === 'ADMIN' || user.role === 'RT') && (
            <Link
              to="/surat/create"
              className={`block px-5 py-2.5 text-sm transition-colors ${
                location.pathname === '/surat/create'
                  ? 'bg-gray-700 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Buat Surat
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-gray-400 mb-3">{user?.role}</p>
          <button
            onClick={handleLogout}
            className="w-full text-sm px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
