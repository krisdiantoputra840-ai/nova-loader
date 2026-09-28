import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Home, Clock, Settings, Menu, X, Play } from 'lucide-react';
import { useServerStatus } from '../hooks/useServerStatus';

const navLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/history', label: 'History', icon: Clock },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { status: serverStatus } = useServerStatus();

  return (
    <header className="border-b border-border-subtle bg-bg-base sticky top-0 z-50">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            aria-label="NOVA — Home"
          >
            {/* Play icon */}
            <div className="w-7 h-7 rounded-[6px] bg-accent flex items-center justify-center shrink-0 group-hover:bg-accent-hover transition-colors duration-150">
              <Play size={13} strokeWidth={0} fill="white" className="translate-x-[1px]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-text-primary font-semibold text-[15px] tracking-[-0.01em]">
                NOVA
              </span>
              <span className="text-text-muted text-[12px] hidden sm:inline">
                Universal media downloader
              </span>
              <span className="text-[10px] text-text-muted/50 hidden sm:inline">
                · by CheeseChis
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center" aria-label="Main navigation">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative flex items-center gap-1.5 px-4 py-4 text-[13.5px] transition-colors duration-150 ${
                    isActive
                      ? 'text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Icon size={14} strokeWidth={1.75} />
                  {link.label}
                  {/* Active underline */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent rounded-t-full" />
                  )}
                </Link>
              );
            })}

            {/* Live Server Indicator */}
            <Link
              to="/settings"
              className={`flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                serverStatus === 'online'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15'
                  : serverStatus === 'checking'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/15'
                  : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/15'
              }`}
              title="Click to view Backend Settings"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  serverStatus === 'online'
                    ? 'bg-emerald-400 animate-pulse'
                    : serverStatus === 'checking'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-red-400'
                }`}
              />
              <span>Server {serverStatus === 'online' ? 'Online' : serverStatus === 'checking' ? 'Checking' : 'Offline'}</span>
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            className="sm:hidden p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors duration-150"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav
            className="sm:hidden border-t border-border-subtle py-2 animate-fade-in"
            aria-label="Mobile navigation"
          >
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded text-[13.5px] transition-colors duration-150 ${
                    isActive
                      ? 'text-text-primary bg-bg-elevated'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                  }`}
                >
                  <Icon size={15} strokeWidth={1.75} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
