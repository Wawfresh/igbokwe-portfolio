import { useState, useEffect } from 'react';
import { Menu, X, Search, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenSearch: () => void;
}

export default function Navbar({ currentPath, onNavigate, onOpenSearch }: NavbarProps) {
  const { siteSettings, currentUser } = useApp();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Career', path: '/career' },
    { label: 'Works', path: '/achievements' },
    { label: 'Projects', path: '/projects' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Media', path: '/media' },
    { label: 'Publications', path: '/publications' },
  ];

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isActive = (path: string) => {
    if (path === '/' && currentPath === '/') return true;
    if (path !== '/' && currentPath.startsWith(path)) return true;
    return false;
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm py-2.5 border-b border-gray-100'
          : 'bg-white py-4 border-b border-emerald-900/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand identity */}
          <div
            onClick={() => handleNavClick('/')}
            className="cursor-pointer group flex flex-col justify-center min-w-0 pr-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#0B5D3B] shrink-0 group-hover:scale-125 transition-transform"></span>
              <h1 className="font-serif-title font-bold text-sm sm:text-lg lg:text-xl xl:text-2xl text-[#063B27] tracking-tight group-hover:text-[#0B5D3B] transition-colors truncate">
                {siteSettings?.fullName || 'HON. NNANNA RAPHAEL IGBOKWE'}
              </h1>
            </div>
            <p className="hidden sm:block text-[10px] sm:text-[11px] font-semibold tracking-wider text-[#66736B] uppercase pl-4 mt-0.5 truncate">
              PUBLIC SERVICE • LEGISLATIVE EXPERIENCE • COMMUNITY
            </p>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-3 xl:gap-6">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`text-xs xl:text-sm font-medium transition-colors relative py-1 cursor-pointer whitespace-nowrap ${
                  isActive(item.path)
                    ? 'text-[#0B5D3B] font-semibold'
                    : 'text-[#17211C] hover:text-[#0B5D3B]'
                }`}
              >
                {item.label}
                {isActive(item.path) && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0B5D3B] rounded-full"></span>
                )}
              </button>
            ))}
          </nav>

          {/* Right Action Icons & Buttons */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
            {/* Search Button */}
            <button
              onClick={onOpenSearch}
              aria-label="Search portfolio"
              className="p-2 text-[#66736B] hover:text-[#0B5D3B] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Admin Badge if logged in */}
            {currentUser && (
              <button
                onClick={() => handleNavClick('/admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#063B27] hover:bg-[#0B5D3B] rounded-lg transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#C8A951]" />
                Admin Panel
              </button>
            )}

            {/* Outlined Contact Button */}
            <button
              onClick={() => handleNavClick('/contact')}
              className={`px-3.5 xl:px-4 py-1.5 xl:py-2 text-xs xl:text-sm font-semibold rounded-lg border-2 transition-all cursor-pointer ${
                isActive('/contact')
                  ? 'bg-[#0B5D3B] text-white border-[#0B5D3B]'
                  : 'text-[#0B5D3B] border-[#0B5D3B] hover:bg-[#0B5D3B] hover:text-white'
              }`}
            >
              Contact
            </button>
          </div>

          {/* Mobile buttons */}
          <div className="flex items-center gap-1 sm:gap-2 lg:hidden shrink-0">
            <button
              onClick={onOpenSearch}
              aria-label="Search"
              className="p-2 text-[#66736B] hover:text-[#0B5D3B] rounded-lg"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="p-2 text-[#063B27] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 pt-3 pb-6 animate-in slide-in-from-top-4 duration-200 shadow-lg">
          <nav className="flex flex-col space-y-1.5 mb-4">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive(item.path)
                    ? 'bg-emerald-50 text-[#0B5D3B] font-semibold'
                    : 'text-[#17211C] hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => handleNavClick('/contact')}
              className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive('/contact')
                  ? 'bg-emerald-50 text-[#0B5D3B] font-semibold'
                  : 'text-[#17211C] hover:bg-gray-50'
              }`}
            >
              Contact
            </button>
            {currentUser && (
              <button
                onClick={() => handleNavClick('/admin')}
                className="text-left px-3 py-2.5 rounded-lg text-sm font-medium bg-[#063B27] text-white flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-[#C8A951]" />
                Go to Admin Dashboard
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
