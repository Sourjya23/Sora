import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, User, LogOut } from 'lucide-react';
import { NAV_ITEMS, NavSectionKey, SORA_SITE_METADATA } from '../data/soraContent';

interface NavbarProps {
  activeSection: NavSectionKey | null;
  scrolled: boolean;
  hidden?: boolean;
  onSelectSection: (section: NavSectionKey) => void;
  onScrollTop: () => void;
}

export function Navbar({
  activeSection,
  scrolled,
  hidden = false,
  onSelectSection,
  onScrollTop,
}: NavbarProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    setToken(storedToken);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    setUser(null);
    setToken(null);
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin-dashboard';
    if (user.role === 'interviewer') return '/interviewer-dashboard';
    return '/candidate-dashboard';
  };

  const handleNavClick = (key: NavSectionKey) => {
    onSelectSection(key);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 transition-all duration-300 ${
        hidden ? 'pointer-events-none -translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      } ${
        scrolled
          ? 'border-b border-white/10 bg-[#041b2d]/85 backdrop-blur-md'
          : 'bg-transparent'
      }`}
    >
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 sm:px-8 sm:py-5"
      >
        <a
          href="#top"
          onClick={(event) => {
            event.preventDefault();
            setMobileMenuOpen(false);
            onScrollTop();
          }}
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          className="shrink-0 whitespace-nowrap text-3xl tracking-tight text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          {SORA_SITE_METADATA.brandName}
          <sup className="ml-0.5 text-xs text-white/70">®</sup>
        </a>

        {/* Limelight Navigation Rail */}
        <div className="relative hidden items-center gap-1 rounded-full border border-white/12 bg-black/20 px-2 py-1 backdrop-blur-md md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.key;
            return (
              <a
                key={item.key}
                href={`#${item.key}`}
                onClick={(event) => {
                  event.preventDefault();
                  handleNavClick(item.key);
                }}
                aria-current={isActive ? 'true' : undefined}
                className={`relative shrink-0 cursor-pointer whitespace-nowrap px-4 py-2 text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${
                  isActive ? 'font-medium text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isActive && (
                  <span
                    className="pointer-events-none absolute inset-x-3 -top-[5px] flex flex-col items-center animate-fade-rise"
                    aria-hidden="true"
                  >
                    <span className="h-[2px] w-full rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.85)]" />
                    <span
                      className="h-7 w-full opacity-35"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%)',
                        clipPath: 'polygon(14% 0%, 86% 0%, 100% 100%, 0% 100%)',
                      }}
                    />
                  </span>
                )}
                {item.label}
              </a>
            );
          })}
        </div>

        {/* Right Action Rail - Only Log In Button */}
        <div className="flex shrink-0 items-center gap-2.5">
          {token ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(getDashboardPath())}
                className="cursor-pointer whitespace-nowrap rounded-full bg-white/10 border border-white/20 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-medium text-white hover:bg-white/20 transition-all flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>{user?.name?.split(' ')[0] || 'Dashboard'}</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="cursor-pointer whitespace-nowrap rounded-full border border-white/15 bg-black/20 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-medium text-zinc-300 hover:text-white hover:border-white/30 transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="cursor-pointer whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-4 py-1.5 sm:px-5 sm:py-2 text-xs font-medium text-white hover:border-white/40 hover:bg-white/20 transition-all shadow-sm"
              >
                Log In
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/25 text-white backdrop-blur-md md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="mx-6 mb-3 rounded-2xl border border-white/15 bg-[#041b2d]/95 p-4 shadow-2xl backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.key;
              return (
                <a
                  key={item.key}
                  href={`#${item.key}`}
                  onClick={(event) => {
                    event.preventDefault();
                    handleNavClick(item.key);
                  }}
                  className={`flex min-h-[44px] w-full cursor-pointer items-center justify-between rounded-xl px-3 text-left text-sm transition-colors ${
                    isActive
                      ? 'bg-white/10 font-medium text-white'
                      : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />}
                </a>
              );
            })}

            <div className="border-t border-white/10 my-2 pt-2 flex flex-col gap-1.5">
              {token ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate(getDashboardPath());
                    }}
                    className="flex min-h-[40px] items-center gap-2 rounded-xl px-3 text-sm text-white font-medium hover:bg-white/5"
                  >
                    <User className="w-4 h-4" />
                    <span>My Dashboard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex min-h-[40px] items-center gap-2 rounded-xl px-3 text-sm text-rose-300 hover:bg-white/5 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-[40px] items-center rounded-xl px-3 text-sm font-medium text-white hover:bg-white/5"
                >
                  Log In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
