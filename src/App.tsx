/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import SearchModal from './components/SearchModal';
import Lightbox from './components/Lightbox';

// Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import CareerPage from './pages/CareerPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import GalleryPage from './pages/GalleryPage';
import MediaPage from './pages/MediaPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import PublicationsPage from './pages/PublicationsPage';
import ContactPage from './pages/ContactPage';
import DownloadPage from './pages/DownloadPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import { Loader2 } from 'lucide-react';

function SecretDirectLoginHandler({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { setToken, setCurrentUser, showToast } = useApp();
  useEffect(() => {
    fetch('/api/auth/secret-direct-login?key=igbokwe_admin_2026_secret')
      .then((res) => {
        if (!res.ok) throw new Error('Secret login failed');
        return res.json();
      })
      .then((data) => {
        if (data.success && data.token) {
          setToken(data.token);
          if (data.user) setCurrentUser(data.user);
          showToast('Direct admin access granted successfully.');
          onNavigate('/admin');
        } else {
          throw new Error('Invalid response');
        }
      })
      .catch(() => {
        showToast('Secret direct login failed.', 'error');
        onNavigate('/admin/login');
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#063B27] flex flex-col items-center justify-center text-white space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-[#C8A951]" />
      <p className="font-serif font-bold text-lg">Authenticating Secret Admin Access...</p>
    </div>
  );
}

function MainRouter() {
  const { loading, error, currentUser, token } = useApp();

  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [searchOpen, setSearchOpen] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<any | null>(null);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Keyboard shortcut: Cmd+K or Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F9F7] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#063B27] text-[#C8A951] flex items-center justify-center shadow-lg animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="font-serif-title font-bold text-lg text-[#063B27]">
          HON. RAPHAEL NNANNA IGBOKWE
        </p>
        <p className="text-xs uppercase tracking-wider text-[#66736B]">
          Loading Public Records Archive...
        </p>
      </div>
    );
  }

  // Routing render helper
  const renderCurrentView = () => {
    // 0. Secret direct access login
    if (currentPath.startsWith('/admin/direct-access-9988')) {
      return <SecretDirectLoginHandler onNavigate={navigate} />;
    }

    // 1. Admin login
    if (currentPath === '/admin/login') {
      return <AdminLoginPage onNavigate={navigate} />;
    }

    // 2. Admin dashboard (protected)
    if (currentPath.startsWith('/admin')) {
      if (!token) {
        return <AdminLoginPage onNavigate={navigate} />;
      }
      return <AdminDashboard onNavigate={navigate} />;
    }

    // 3. Project detail (/projects/:slug)
    if (currentPath.startsWith('/projects/')) {
      const slug = currentPath.replace('/projects/', '');
      return (
        <ProjectDetailPage
          slug={slug}
          onNavigate={navigate}
          onOpenLightbox={setLightboxItem}
        />
      );
    }

    // 4. Article detail (/media/:slug)
    if (currentPath.startsWith('/media/')) {
      const slug = currentPath.replace('/media/', '');
      return <ArticleDetailPage slug={slug} onNavigate={navigate} />;
    }

    // 5. Standard public pages
    switch (currentPath) {
      case '/about':
        return <AboutPage />;
      case '/career':
        return <CareerPage />;
      case '/achievements':
        return (
          <ProjectsPage
            onNavigate={navigate}
            titleOverride="Works & Legislative Achievements"
            badgeOverride="Constituency Stewardship & Impact"
          />
        );
      case '/projects':
        return <ProjectsPage onNavigate={navigate} />;
      case '/gallery':
        return <GalleryPage onOpenLightbox={setLightboxItem} />;
      case '/media':
        return <MediaPage onNavigate={navigate} />;
      case '/publications':
        return <PublicationsPage onNavigate={navigate} />;
      case '/contact':
        return <ContactPage />;
      case '/download':
        return <DownloadPage />;
      case '/':
      default:
        return (
          <HomePage
            onNavigate={navigate}
            onOpenLightbox={setLightboxItem}
          />
        );
    }
  };

  const isAdminView = currentPath.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F9F7] text-[#17211C] selection:bg-emerald-800 selection:text-white">
      {/* Show public header unless in admin dashboard */}
      {!isAdminView && (
        <Navbar
          currentPath={currentPath}
          onNavigate={navigate}
          onOpenSearch={() => setSearchOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1">{renderCurrentView()}</main>

      {/* Show public footer unless in admin dashboard */}
      {!isAdminView && <Footer onNavigate={navigate} />}

      {/* Global Interactive Modals */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={navigate}
      />

      <Lightbox
        isOpen={!!lightboxItem}
        item={lightboxItem}
        onClose={() => setLightboxItem(null)}
      />

      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainRouter />
    </AppProvider>
  );
}
