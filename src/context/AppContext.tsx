import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import {
  SiteSettings,
  HeroContent,
  Biography,
  Education,
  CareerTimeline,
  Project,
  GalleryImage,
  Article,
  Publication,
  SocialLink,
  AdminUser,
} from '../types';

interface AppContextType {
  siteSettings: SiteSettings | null;
  hero: HeroContent | null;
  biography: Biography | null;
  education: Education[];
  career: CareerTimeline[];
  projects: Project[];
  featuredProjects: Project[];
  gallery: GalleryImage[];
  articles: Article[];
  publications: Publication[];
  socialLinks: SocialLink[];
  loading: boolean;
  error: string | null;
  currentUser: AdminUser | null;
  token: string | null;
  setCurrentUser: (user: AdminUser | null) => void;
  setToken: (token: string | null) => void;
  refreshSiteData: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  toast: { message: string; type: 'success' | 'error' | 'info'; id: number } | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [hero, setHero] = useState<HeroContent | null>(null);
  const [biography, setBiography] = useState<Biography | null>(null);
  const [education, setEducation] = useState<Education[]>([]);
  const [career, setCareer] = useState<CareerTimeline[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [token, setTokenState] = useState<string | null>(() => {
    return localStorage.getItem('admin_token');
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; id: number } | null>(null);

  const setToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem('admin_token', newToken);
    } else {
      localStorage.removeItem('admin_token');
    }
    setTokenState(newToken);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const refreshSiteData = async () => {
    try {
      const res = await fetch('/api/site-data');
      if (!res.ok) throw new Error('Failed to load site data');
      const data = await res.json();
      setSiteSettings(data.siteSettings);
      setHero(data.hero);
      setBiography(data.biography);
      setEducation(data.education || []);
      setCareer(data.career || []);
      setProjects(data.projects || []);
      setFeaturedProjects(data.featuredProjects || []);
      setGallery(data.gallery || []);
      setArticles(data.articles || []);
      setPublications(data.publications || []);
      setSocialLinks(data.socialLinks || []);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to connect to service');
    } finally {
      setLoading(false);
    }
  };

  // Check current session
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((userData) => {
          if (userData) {
            setCurrentUser(userData);
          } else {
            setToken(null);
            setCurrentUser(null);
          }
        })
        .catch(() => {
          setToken(null);
          setCurrentUser(null);
        });
    }
  }, [token]);

  useEffect(() => {
    refreshSiteData();
  }, []);

  return (
    <AppContext.Provider
      value={{
        siteSettings,
        hero,
        biography,
        education,
        career,
        projects,
        featuredProjects,
        gallery,
        articles,
        publications,
        socialLinks,
        loading,
        error,
        currentUser,
        token,
        setCurrentUser,
        setToken,
        refreshSiteData,
        showToast,
        toast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
