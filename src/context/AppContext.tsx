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
import {
  INITIAL_SITE_SETTINGS,
  INITIAL_HERO,
  INITIAL_BIOGRAPHY,
  INITIAL_EDUCATION,
  INITIAL_CAREER,
  INITIAL_PROJECTS,
  INITIAL_GALLERY,
  INITIAL_ARTICLES,
  INITIAL_PUBLICATIONS,
  INITIAL_SOCIAL_LINKS,
} from '../data/initialData';

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
  saveSectionData: (key: string, data: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Helper to read initial state with client-side persistence support
  const getInitial = <T,>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(`hon_igbokwe_${key}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return fallback;
  };

  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(() =>
    getInitial('siteSettings', INITIAL_SITE_SETTINGS)
  );
  const [hero, setHero] = useState<HeroContent | null>(() =>
    getInitial('hero', INITIAL_HERO)
  );
  const [biography, setBiography] = useState<Biography | null>(() =>
    getInitial('biography', INITIAL_BIOGRAPHY)
  );
  const [education, setEducation] = useState<Education[]>(() =>
    getInitial('education', INITIAL_EDUCATION)
  );
  const [career, setCareer] = useState<CareerTimeline[]>(() =>
    getInitial('career', INITIAL_CAREER)
  );
  const [projects, setProjects] = useState<Project[]>(() =>
    getInitial('projects', INITIAL_PROJECTS)
  );
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>(() => {
    const list = getInitial('projects', INITIAL_PROJECTS);
    return list.filter((p: Project) => p.featured);
  });
  const [gallery, setGallery] = useState<GalleryImage[]>(() =>
    getInitial('gallery', INITIAL_GALLERY)
  );
  const [articles, setArticles] = useState<Article[]>(() =>
    getInitial('articles', INITIAL_ARTICLES)
  );
  const [publications, setPublications] = useState<Publication[]>(() =>
    getInitial('publications', INITIAL_PUBLICATIONS)
  );
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(() =>
    getInitial('socialLinks', INITIAL_SOCIAL_LINKS)
  );
  const [loading, setLoading] = useState(false);
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
      if (res.ok) {
        const data = await res.json();
        if (data.siteSettings) setSiteSettings(data.siteSettings);
        if (data.hero) setHero(data.hero);
        if (data.biography) setBiography(data.biography);
        if (data.education) setEducation(data.education);
        if (data.career) setCareer(data.career);
        if (data.projects) setProjects(data.projects);
        if (data.featuredProjects) setFeaturedProjects(data.featuredProjects);
        if (data.gallery) setGallery(data.gallery);
        if (data.articles) setArticles(data.articles);
        if (data.publications) setPublications(data.publications);
        if (data.socialLinks) setSocialLinks(data.socialLinks);
        setError(null);
      }
    } catch {
      // Running on pure static hosting (Netlify) without active node server;
      // initial high-definition data is already active and displayed.
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

  const saveSectionData = (key: string, data: any) => {
    try {
      localStorage.setItem(`hon_igbokwe_${key}`, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }

    switch (key) {
      case 'siteSettings':
        setSiteSettings(data);
        break;
      case 'hero':
        setHero(data);
        break;
      case 'biography':
        setBiography(data);
        break;
      case 'education':
        setEducation(data);
        break;
      case 'career':
        setCareer(data);
        break;
      case 'projects':
        setProjects(data);
        setFeaturedProjects(data.filter((p: Project) => p.featured));
        break;
      case 'gallery':
        setGallery(data);
        break;
      case 'articles':
        setArticles(data);
        break;
      case 'publications':
        setPublications(data);
        break;
      case 'socialLinks':
        setSocialLinks(data);
        break;
    }
  };

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
        saveSectionData,
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
