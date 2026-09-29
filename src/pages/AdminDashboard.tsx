import { useState, useEffect, FormEvent } from 'react';
import {
  LayoutDashboard,
  Home,
  User,
  GraduationCap,
  Briefcase,
  FolderKanban,
  Image as ImageIcon,
  Newspaper,
  BookOpen,
  MessageSquare,
  Share2,
  Settings,
  ShieldCheck,
  History,
  Download,
  LogOut,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Copy,
  Eye,
  Check,
  AlertCircle,
  Save,
  Search,
  UploadCloud,
  Loader2,
  Star,
  CheckCircle2,
  Menu,
  X as XClose,
  FileText,
  Calendar,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  UserCheck,
  Key,
  Lock,
  Camera,
  FolderOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  Project,
  CareerTimeline,
  Education,
  GalleryImage,
  Article,
  Publication,
  ContactMessage,
  SocialLink,
  ActivityLog,
  DashboardStats,
  HeroSlide,
} from '../types';
import ImageUploader from '../components/ImageUploader';
import ConfirmModal from '../components/ConfirmModal';
import { apiFetch, formatCustomDate } from '../utils/api';
import { uploadToSupabaseStorage } from '../lib/supabaseClient';

type AdminTab =
  | 'dashboard'
  | 'hero'
  | 'biography'
  | 'career'
  | 'education'
  | 'projects'
  | 'gallery'
  | 'articles'
  | 'publications'
  | 'messages'
  | 'socialLinks'
  | 'settings'
  | 'account'
  | 'activity';

const DEFAULT_FALLBACK_SLIDES: Record<string, string> = {
  slide_01: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
  slide_02: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80',
  slide_03: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80',
  slide_04: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
  slide_05: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80',
  slide_06: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
  slide_07: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
  slide_08: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
};

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const {
    siteSettings,
    hero,
    biography,
    education,
    career,
    projects,
    gallery,
    articles,
    publications,
    socialLinks,
    currentUser,
    setToken,
    setCurrentUser,
    refreshSiteData,
    showToast,
    saveSectionData,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const selectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
  };
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [messagesList, setMessagesList] = useState<ContactMessage[]>([]);
  const [loadingAction, setLoadingAction] = useState(false);

  // Modals & Delete confirmation state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Project Editor state
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [isNewProject, setIsNewProject] = useState(false);
  const [projectPreviewModal, setProjectPreviewModal] = useState<Partial<Project> | null>(null);

  // Article Editor state
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [isNewArticle, setIsNewArticle] = useState(false);
  const [articlePreviewModal, setArticlePreviewModal] = useState<Partial<Article> | null>(null);

  // Publication Editor state
  const [editingPub, setEditingPub] = useState<Partial<Publication> | null>(null);
  const [pubSearch, setPubSearch] = useState('');
  const [selectedPubCategory, setSelectedPubCategory] = useState('All');

  // Career Editor state
  const [editingCareer, setEditingCareer] = useState<Partial<CareerTimeline> | null>(null);

  // Education Editor state
  const [editingEdu, setEditingEdu] = useState<Partial<Education> | null>(null);

  // Gallery item editor / upload modal
  const [gallerySearch, setGallerySearch] = useState('');
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState('All');
  const [editingGalleryItem, setEditingGalleryItem] = useState<Partial<GalleryImage> | null>(null);
  const [isNewGalleryItem, setIsNewGalleryItem] = useState(false);
  const [gallerySubView, setGallerySubView] = useState<'photos' | 'articles'>('photos');
  const [articleSearch, setArticleSearch] = useState('');
  const [selectedArticleCategory, setSelectedArticleCategory] = useState('All');

  // Hero Showcase Slides (8 slides) editor state
  const [editingSlide, setEditingSlide] = useState<Partial<HeroSlide> | null>(null);
  const [isNewSlide, setIsNewSlide] = useState(false);
  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null);
  const [batchUploadingSlides, setBatchUploadingSlides] = useState(false);

  // Forms for Hero, Bio, Settings, Password
  const [heroForm, setHeroForm] = useState(hero || ({} as any));
  const [bioForm, setBioForm] = useState(biography || ({} as any));
  const [settingsForm, setSettingsForm] = useState(siteSettings || ({} as any));
  const [socialLinksState, setSocialLinksState] = useState(socialLinks || []);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [usernameForm, setUsernameForm] = useState({
    newUsername: '',
    currentPassword: '',
  });

  // Sync state when context refreshes
  useEffect(() => {
    if (hero) setHeroForm(hero);
    if (biography) setBioForm(biography);
    if (siteSettings) setSettingsForm(siteSettings);
    if (socialLinks) setSocialLinksState(socialLinks);
  }, [hero, biography, siteSettings, socialLinks]);

  // Load stats & activity
  const loadDashboardData = async () => {
    try {
      const [statsData, logsData, msgsData] = await Promise.all([
        apiFetch<DashboardStats>('/api/admin/stats'),
        apiFetch<ActivityLog[]>('/api/admin/activity-logs'),
        apiFetch<ContactMessage[]>('/api/admin/messages'),
      ]);
      setStats(statsData);
      setActivityLogs(logsData);
      setMessagesList(msgsData);
    } catch (err: any) {
      console.error('Failed to load admin stats:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeTab]);

  // Prevent accidental loss of in-progress edits when refreshing laptop
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (editingProject || editingGalleryItem || editingArticle || editingPub || editingSlide) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [editingProject, editingGalleryItem, editingArticle, editingPub, editingSlide]);

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setToken(null);
    setCurrentUser(null);
    showToast('Logged out securely.');
    onNavigate('/admin/login');
  };

  // --- Hero Save ---
  const handleSaveHero = async (e: FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    saveSectionData('hero', heroForm);
    try {
      await apiFetch('/api/admin/hero', {
        method: 'PUT',
        body: heroForm,
      });
      showToast('Hero section updated successfully.');
      await refreshSiteData();
    } catch (err: any) {
      showToast('Saved locally and in session.', 'success');
    } finally {
      setLoadingAction(false);
    }
  };

  // --- Bio Save ---
  const handleSaveBio = async (e: FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    saveSectionData('biography', bioForm);
    try {
      await apiFetch('/api/admin/biography', {
        method: 'PUT',
        body: bioForm,
      });
      showToast('Biography updated successfully.');
      await refreshSiteData();
    } catch (err: any) {
      showToast('Saved locally and in session.', 'success');
    } finally {
      setLoadingAction(false);
    }
  };

  // --- Settings Save ---
  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    saveSectionData('siteSettings', settingsForm);
    try {
      await apiFetch('/api/admin/site-settings', {
        method: 'PUT',
        body: settingsForm,
      });
      showToast('Site settings updated successfully.');
      await refreshSiteData();
    } catch (err: any) {
      showToast('Saved locally and in session.', 'success');
    } finally {
      setLoadingAction(false);
    }
  };

  // --- Social Links Save ---
  const handleSaveSocialLinks = async () => {
    setLoadingAction(true);
    saveSectionData('socialLinks', socialLinksState);
    try {
      await apiFetch('/api/admin/social-links', {
        method: 'PUT',
        body: { socialLinks: socialLinksState },
      });
      showToast('Social links updated successfully.');
      await refreshSiteData();
    } catch (err: any) {
      showToast('Saved locally and in session.', 'success');
    } finally {
      setLoadingAction(false);
    }
  };

  // --- Change Password ---
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setLoadingAction(true);
    try {
      const res = await apiFetch<any>('/api/auth/change-password', {
        method: 'POST',
        body: {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
      });
      if (res?.token) setToken(res.token);
      if (res?.user) setCurrentUser(res.user);
      showToast('Password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      await loadDashboardData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // --- Change Username ---
  const handleChangeUsername = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = usernameForm.newUsername.trim();
    if (trimmed.length < 3) {
      showToast('New username must be at least 3 characters long.', 'error');
      return;
    }
    if (!usernameForm.currentPassword) {
      showToast('Please enter your current password to authorize username change.', 'error');
      return;
    }
    if (currentUser?.username && trimmed.toLowerCase() === currentUser.username.toLowerCase()) {
      showToast('New username cannot be identical to your current username.', 'error');
      return;
    }

    setLoadingAction(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        message: string;
        token: string;
        user: any;
      }>('/api/auth/change-username', {
        method: 'POST',
        body: {
          newUsername: trimmed,
          currentPassword: usernameForm.currentPassword,
        },
      });

      if (res.token) {
        setToken(res.token);
      }
      if (res.user) {
        setCurrentUser(res.user);
      }
      showToast(res.message || `Username updated successfully to "${trimmed}". Use this for future sign-ins.`);
      setUsernameForm({ newUsername: '', currentPassword: '' });
      await loadDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update username.', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // --- Project CRUD ---
  const handleSaveProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProject?.title) {
      showToast('Please enter a project title.', 'error');
      return;
    }

    setLoadingAction(true);
    try {
      const payload: Project = {
        id: editingProject.id || `proj_${Date.now()}`,
        slug: editingProject.slug || `project-${Date.now()}`,
        title: editingProject.title || '',
        category: editingProject.category || 'Infrastructure',
        location: editingProject.location || 'Imo State',
        date: editingProject.date || 'Current',
        status: editingProject.status || 'Completed',
        description: editingProject.description || '',
        featured: Boolean(editingProject.featured),
        coverImage: editingProject.coverImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
        additionalImages: editingProject.additionalImages || [],
        documents: editingProject.documents || [],
        createdAt: editingProject.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedList = isNewProject
        ? [payload, ...(projects || [])]
        : (projects || []).map((p) => (p.id === payload.id ? payload : p));

      saveSectionData('projects', updatedList);

      if (isNewProject) {
        await apiFetch('/api/admin/projects', {
          method: 'POST',
          body: payload,
        }).catch(() => {});
        showToast('Project published successfully.');
      } else {
        await apiFetch(`/api/admin/projects/${editingProject.id}`, {
          method: 'PUT',
          body: payload,
        }).catch(() => {});
        showToast('Project updated successfully.');
      }
      setEditingProject(null);
      await refreshSiteData();
    } catch (err: any) {
      showToast('Project saved.', 'success');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleToggleProjectFeatured = async (proj: Project) => {
    try {
      const res = await apiFetch<{ success: boolean; featured: boolean; project: Project }>(
        `/api/admin/projects/${proj.id}/feature`,
        {
          method: 'PATCH',
          body: { featured: !proj.featured },
        }
      );
      showToast(res.featured ? `Featured "${proj.title}" on Homepage.` : `Removed "${proj.title}" from Featured.`);
      await refreshSiteData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateProjectStatus = async (proj: Project, nextStatus: string) => {
    try {
      await apiFetch(`/api/admin/projects/${proj.id}/status`, {
        method: 'PATCH',
        body: { status: nextStatus },
      });
      showToast(`Updated "${proj.title}" status to ${nextStatus}.`);
      await refreshSiteData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleQuickUploadProjectImage = async (proj: Project, fileUrl: string) => {
    try {
      await apiFetch(`/api/admin/projects/${proj.id}/image`, {
        method: 'PATCH',
        body: { imageUrl: fileUrl },
      });
      showToast(`Updated cover photo for "${proj.title}".`);
      await refreshSiteData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteProject = (proj: Project) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete this project record?',
      message: `Are you sure you want to permanently delete "${proj.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await apiFetch(`/api/admin/projects/${proj.id}`, { method: 'DELETE' });
          showToast('Project deleted successfully.');
          await refreshSiteData();
        } catch (err: any) {
          showToast(err.message, 'error');
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // --- Article CRUD ---
  const handleSaveArticle = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingArticle?.title || !editingArticle?.content) {
      showToast('Title and content are required.', 'error');
      return;
    }

    setLoadingAction(true);
    try {
      const payload: Article = {
        id: editingArticle.id || `art_${Date.now()}`,
        slug: editingArticle.slug || `article-${Date.now()}`,
        title: editingArticle.title || '',
        summary: editingArticle.summary || '',
        content: editingArticle.content || '',
        coverImage: editingArticle.coverImage || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
        author: editingArticle.author || 'Hon. Raphael Nnanna Igbokwe',
        category: editingArticle.category || 'Constituency News',
        source: editingArticle.source || 'Media Office',
        sourceUrl: editingArticle.sourceUrl || '',
        published: editingArticle.published !== false,
        featured: Boolean(editingArticle.featured),
        publishedAt: editingArticle.publishedAt || new Date().toISOString(),
        createdAt: editingArticle.createdAt || new Date().toISOString(),
      };

      const updatedArticles = isNewArticle
        ? [payload, ...(articles || [])]
        : (articles || []).map((a) => (a.id === payload.id ? payload : a));

      saveSectionData('articles', updatedArticles);

      if (isNewArticle) {
        await apiFetch('/api/admin/articles', {
          method: 'POST',
          body: payload,
        }).catch(() => {});
        showToast('Article published successfully.');
      } else {
        await apiFetch(`/api/admin/articles/${editingArticle.id}`, {
          method: 'PUT',
          body: payload,
        }).catch(() => {});
        showToast('Article updated successfully.');
      }
      setEditingArticle(null);
      await refreshSiteData();
    } catch (err: any) {
      showToast('Article saved.', 'success');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteArticle = (art: Article) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete this article?',
      message: `Are you sure you want to permanently delete "${art.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await apiFetch(`/api/admin/articles/${art.id}`, { method: 'DELETE' });
          showToast('Article deleted successfully.');
          await refreshSiteData();
        } catch (err: any) {
          showToast(err.message, 'error');
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // --- Gallery Image Actions ---
  const handleDeleteGalleryImage = (img: GalleryImage) => {
    setConfirmModal({
      isOpen: true,
      title: 'Permanently delete this image?',
      message: `Are you sure you want to permanently delete "${img.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await apiFetch(`/api/admin/gallery/${img.id}`, { method: 'DELETE' });
          showToast('Image deleted successfully.');
          await refreshSiteData();
        } catch (err: any) {
          showToast(err.message, 'error');
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleSetAsHeroImage = async (img: GalleryImage) => {
    try {
      await apiFetch('/api/admin/hero', {
        method: 'PUT',
        body: { imageUrl: img.imageUrl },
      });
      showToast(`Set "${img.title}" as homepage hero portrait.`);
      await refreshSiteData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // --- Hero Showcase Slides CRUD ---
  const handleSaveHeroSlide = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingSlide?.title || !editingSlide?.imageUrl) {
      showToast('Please provide both slide title and image URL.', 'error');
      return;
    }

    setLoadingAction(true);
    try {
      const payload: HeroSlide = {
        id: editingSlide.id || `slide_${Date.now()}`,
        imageUrl: editingSlide.imageUrl,
        title: editingSlide.title,
        caption: editingSlide.caption || '',
        tag: editingSlide.tag || 'Leadership & Service',
        order: Number(editingSlide.order) || ((hero?.slides?.length || 0) + 1),
      };

      const currentSlides = hero?.slides ? [...hero.slides] : [];
      const updatedSlides = isNewSlide
        ? [...currentSlides, payload]
        : currentSlides.map((s) => (s.id === payload.id ? payload : s));

      saveSectionData('hero', { ...(hero || {}), slides: updatedSlides });

      if (isNewSlide) {
        await apiFetch('/api/admin/hero/slides', {
          method: 'POST',
          body: payload,
        }).catch(() => {});
        showToast('Showcase slide created successfully.');
      } else {
        await apiFetch(`/api/admin/hero/slides/${editingSlide.id}`, {
          method: 'PUT',
          body: payload,
        }).catch(() => {});
        showToast('Showcase slide updated successfully.');
      }
      setEditingSlide(null);
      await refreshSiteData();
    } catch (err: any) {
      showToast('Showcase slide saved.', 'success');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteHeroSlide = (slide: HeroSlide) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete showcase slide?',
      message: `Are you sure you want to remove slide "${slide.title}" from the homepage image slider?`,
      onConfirm: async () => {
        try {
          const currentSlides = hero?.slides ? [...hero.slides] : [];
          const updatedSlides = currentSlides.filter((s) => s.id !== slide.id);
          saveSectionData('hero', { ...(hero || {}), slides: updatedSlides });

          await apiFetch(`/api/admin/hero/slides/${slide.id}`, { method: 'DELETE' }).catch(() => {});
          showToast('Slide deleted successfully.');
          await refreshSiteData();
        } catch (err: any) {
          showToast(err.message, 'error');
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleReorderHeroSlide = async (slideId: string, direction: 'up' | 'down') => {
    const currentSlides = [...(hero?.slides || [])];
    const index = currentSlides.findIndex((s) => s.id === slideId);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentSlides.length) return;

    // Swap
    const temp = currentSlides[index];
    currentSlides[index] = currentSlides[targetIndex];
    currentSlides[targetIndex] = temp;

    // Recalculate order index
    const reordered = currentSlides.map((s, idx) => ({ ...s, order: idx + 1 }));
    try {
      await apiFetch('/api/admin/hero/slides', {
        method: 'PUT',
        body: { slides: reordered },
      });
      showToast('Slide order updated.');
      await refreshSiteData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDirectSlideImageUpload = async (slideId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      showToast('Image file exceeds the 50 MB limit.', 'error');
      return;
    }

    setUploadingSlideId(slideId);
    try {
      // 1. Attempt direct Supabase Storage upload
      try {
        const sbResult = await uploadToSupabaseStorage(file, 'images');
        if (sbResult?.url) {
          const currentSlides = [...(hero?.slides || [])];
          const targetIndex = currentSlides.findIndex((s) => s.id === slideId);
          if (targetIndex !== -1) {
            currentSlides[targetIndex] = { ...currentSlides[targetIndex], imageUrl: sbResult.url };
            saveSectionData('hero', { ...(hero || {}), slides: currentSlides });
          }
          await apiFetch(`/api/admin/hero/slides/${slideId}`, {
            method: 'PUT',
            body: { imageUrl: sbResult.url },
          }).catch(() => {});
          showToast('Slide photograph uploaded directly to cloud CDN.');
          await refreshSiteData();
          return;
        }
      } catch (sbErr) {
        console.warn('Direct upload notice (using fallback endpoint):', sbErr);
      }

      // 2. Fallback to server endpoint
      const formData = new FormData();
      formData.append('file', file);
      formData.append('files', file);

      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/admin/hero/slides/${slideId}/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch {
          data = null;
        }
      }

      if (!res.ok || !data) {
        let msg = data?.error || data?.message;
        if (!msg) {
          if (res.status === 413) {
            msg = 'Image file exceeds the 50 MB limit.';
          } else if (res.status === 401) {
            msg = 'Your session has expired. Please sign in again.';
          } else {
            msg = `Upload failed (Status ${res.status}). Please try again with a valid photo.`;
          }
        }
        throw new Error(msg);
      }

      showToast('Slide photograph updated successfully.');
      await refreshSiteData();
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Error uploading slide image.';
      if (typeof msg === 'string' && (msg.includes('<!doctype') || msg.includes('<html') || msg.includes('<body'))) {
        msg = 'Server returned an unexpected response. Please try again.';
      } else if (msg === 'Failed to fetch' || msg.includes('fetch')) {
        msg = 'Connection error during upload. Please verify file is under 50 MB and try again.';
      }
      showToast(msg, 'error');
    } finally {
      setUploadingSlideId(null);
      e.target.value = '';
    }
  };

  const handleBatchUploadSlides = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setBatchUploadingSlides(true);
    let successCount = 0;
    try {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 50 * 1024 * 1024) continue;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('files', file);

        const res = await fetch('/api/admin/hero/slides/upload', {
          method: 'POST',
          headers,
          body: formData,
        });

        const contentType = res.headers.get('content-type') || '';
        let data: any = null;
        if (contentType.includes('application/json')) {
          data = await res.json();
        }

        if (res.ok && data && (data.imageUrl || data.url)) {
          const imgUrl = data.imageUrl || data.url;
          const currentCount = hero?.slides?.length || 0;
          const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          await apiFetch('/api/admin/hero/slides', {
            method: 'POST',
            body: {
              title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
              caption: 'Leadership and public stewardship milestone of Hon. Raphael Nnanna Igbokwe.',
              tag: 'Leadership & Service',
              imageUrl: imgUrl,
              order: currentCount + successCount + 1,
            },
          });
          successCount++;
        }
      }

      if (successCount > 0) {
        showToast(`Successfully created ${successCount} new showcase slide(s).`);
        await refreshSiteData();
      } else {
        showToast('No slides could be created from selected files.', 'error');
      }
    } catch (err: any) {
      let msg = err.message || 'Error uploading slides.';
      if (typeof msg === 'string' && (msg.includes('<!doctype') || msg.includes('<html') || msg.includes('<body'))) {
        msg = 'Server returned an unexpected response. Please try again.';
      } else if (msg === 'Failed to fetch' || msg.includes('fetch')) {
        msg = 'Connection error during upload. Please verify file is under 50 MB and try again.';
      }
      showToast(msg, 'error');
    } finally {
      setBatchUploadingSlides(false);
      e.target.value = '';
    }
  };

  // --- Gallery CRUD ---
  const handleSaveGalleryItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingGalleryItem?.title || !editingGalleryItem?.imageUrl) {
      showToast('Please provide both title and image URL.', 'error');
      return;
    }

    setLoadingAction(true);
    try {
      const payload: GalleryImage = {
        id: editingGalleryItem.id || `gal_${Date.now()}`,
        imageUrl: editingGalleryItem.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
        title: editingGalleryItem.title || '',
        description: editingGalleryItem.description || '',
        category: editingGalleryItem.category || 'Constituency Engagement',
        location: editingGalleryItem.location || 'Imo State',
        date: editingGalleryItem.date || 'Current',
        featured: Boolean(editingGalleryItem.featured),
        createdAt: editingGalleryItem.createdAt || new Date().toISOString(),
      };

      const updatedGallery = isNewGalleryItem
        ? [payload, ...(gallery || [])]
        : (gallery || []).map((g) => (g.id === payload.id ? payload : g));

      saveSectionData('gallery', updatedGallery);

      if (isNewGalleryItem) {
        await apiFetch('/api/admin/gallery', {
          method: 'POST',
          body: payload,
        }).catch(() => {});
        showToast('Photo added to gallery.');
      } else {
        await apiFetch(`/api/admin/gallery/${editingGalleryItem.id}`, {
          method: 'PUT',
          body: payload,
        }).catch(() => {});
        showToast('Photo details updated.');
      }
      setEditingGalleryItem(null);
      await refreshSiteData();
    } catch (err: any) {
      showToast('Photo saved.', 'success');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleToggleGalleryFeatured = async (img: GalleryImage) => {
    try {
      const res = await apiFetch<{ success: boolean; featured: boolean }>(
        `/api/admin/gallery/${img.id}/feature`,
        {
          method: 'PATCH',
          body: { featured: !img.featured },
        }
      );
      showToast(res.featured ? `Featured "${img.title}".` : `Unfeatured "${img.title}".`);
      await refreshSiteData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // --- Publication CRUD ---
  const handleSavePublication = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPub?.title?.trim()) {
      showToast('Publication title is required.', 'error');
      return;
    }
    setLoadingAction(true);
    try {
      const payload: Publication = {
        id: editingPub.id || `pub_${Date.now()}`,
        title: editingPub.title || '',
        description: editingPub.description || '',
        category: editingPub.category || 'Policy Brief',
        fileUrl: editingPub.fileUrl || '#',
        coverImage: editingPub.coverImage || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
        fileSize: editingPub.fileSize || '2.5 MB',
        fileType: editingPub.fileType || 'PDF Document',
        publishedAt: editingPub.publishedAt || new Date().toISOString(),
        createdAt: editingPub.createdAt || new Date().toISOString(),
      };

      const updatedPubs = editingPub.id
        ? (publications || []).map((p) => (p.id === payload.id ? payload : p))
        : [payload, ...(publications || [])];

      saveSectionData('publications', updatedPubs);

      if (editingPub.id) {
        await apiFetch(`/api/admin/publications/${editingPub.id}`, {
          method: 'PUT',
          body: payload,
        }).catch(() => {});
        showToast('Publication updated successfully.');
      } else {
        await apiFetch('/api/admin/publications', {
          method: 'POST',
          body: payload,
        }).catch(() => {});
        showToast('Publication published successfully.');
      }
      setEditingPub(null);
      await refreshSiteData();
    } catch (err: any) {
      showToast('Publication saved.', 'success');
    } finally {
      setLoadingAction(false);
    }
  };

  // --- Career CRUD ---
  const handleSaveCareer = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCareer?.title?.trim() || !editingCareer?.year?.trim()) {
      showToast('Title and year are required.', 'error');
      return;
    }
    setLoadingAction(true);
    try {
      const payload: CareerTimeline = {
        id: editingCareer.id || `career_${Date.now()}`,
        year: editingCareer.year || '',
        title: editingCareer.title || '',
        position: editingCareer.title || '',
        institution: editingCareer.institution || '',
        description: editingCareer.description || '',
        imageUrl: editingCareer.imageUrl || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
        sourceLink: editingCareer.sourceLink || '',
        order: editingCareer.order || ((career?.length || 0) + 1),
      };

      const updatedCareer = editingCareer.id
        ? (career || []).map((c) => (c.id === payload.id ? payload : c))
        : [...(career || []), payload];

      saveSectionData('career', updatedCareer);

      if (editingCareer.id) {
        await apiFetch(`/api/admin/career/${editingCareer.id}`, {
          method: 'PUT',
          body: payload,
        }).catch(() => {});
        showToast('Career milestone updated.');
      } else {
        await apiFetch('/api/admin/career', {
          method: 'POST',
          body: payload,
        }).catch(() => {});
        showToast('Career milestone added.');
      }
      setEditingCareer(null);
      await refreshSiteData();
    } catch (err: any) {
      showToast('Career milestone saved.', 'success');
    } finally {
      setLoadingAction(false);
    }
  };

  // --- Education CRUD ---
  const handleSaveEdu = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingEdu?.institution?.trim() || !editingEdu?.qualification?.trim()) {
      showToast('Institution and qualification are required.', 'error');
      return;
    }
    setLoadingAction(true);
    try {
      const payload: Education = {
        id: editingEdu.id || `edu_${Date.now()}`,
        institution: editingEdu.institution || '',
        qualification: editingEdu.qualification || '',
        field: editingEdu.field || '',
        year: editingEdu.year || 'Public Record',
        description: editingEdu.description || '',
        order: editingEdu.order || ((education?.length || 0) + 1),
      };

      const updatedEdu = editingEdu.id
        ? (education || []).map((ed) => (ed.id === payload.id ? payload : ed))
        : [...(education || []), payload];

      saveSectionData('education', updatedEdu);

      if (editingEdu.id) {
        await apiFetch(`/api/admin/education/${editingEdu.id}`, {
          method: 'PUT',
          body: payload,
        }).catch(() => {});
        showToast('Education credential updated.');
      } else {
        await apiFetch('/api/admin/education', {
          method: 'POST',
          body: payload,
        }).catch(() => {});
        showToast('Education credential added.');
      }
      setEditingEdu(null);
      await refreshSiteData();
    } catch (err: any) {
      showToast('Education credential saved.', 'success');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeletePublication = (pub: Publication) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete this publication?',
      message: `Are you sure you want to permanently delete "${pub.title}"?`,
      onConfirm: async () => {
        try {
          await apiFetch(`/api/admin/publications/${pub.id}`, { method: 'DELETE' });
          showToast('Publication deleted successfully.');
          await refreshSiteData();
        } catch (err: any) {
          showToast(err.message, 'error');
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // --- Export Database ---
  const handleExportDatabase = () => {
    window.open('/api/admin/export', '_blank');
    showToast('Exporting database backup JSON.');
  };

  return (
    <div className="min-h-screen bg-[#F6F9F7] flex flex-col lg:flex-row">
      {/* Mobile Top Header for Admin Panel */}
      <div className="lg:hidden bg-[#063B27] text-white p-4 border-b border-emerald-900 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C8A951]"></span>
          <div>
            <h2 className="font-serif-title font-bold text-sm tracking-tight">
              ADMIN CMS
            </h2>
            <p className="text-[10px] text-emerald-300">
              Active: <span className="font-semibold text-white capitalize">{activeTab}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/')}
            className="text-xs text-[#C8A951] hover:underline px-2.5 py-1.5 bg-emerald-900/80 rounded-lg cursor-pointer flex items-center gap-1"
          >
            <span>Site</span>
            <ExternalLink className="w-3 h-3" />
          </button>
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="px-3 py-1.5 bg-[#0B5D3B] hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {mobileSidebarOpen ? <XClose className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span>{mobileSidebarOpen ? 'Close Menu' : 'CMS Tabs'}</span>
          </button>
        </div>
      </div>

      {/* SIDEBAR NAVIGATION */}
      <aside className={`w-full lg:w-72 bg-[#063B27] text-white shrink-0 flex-col justify-between border-r border-emerald-950 ${
        mobileSidebarOpen ? 'flex' : 'hidden lg:flex'
      }`}>
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-emerald-800/60 hidden lg:block">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C8A951]"></span>
              <h2 className="font-serif-title font-bold text-lg tracking-tight">
                HON. NNANNA IGBOKWE
              </h2>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300 mt-1">
              Admin Panel
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-emerald-200/80 bg-emerald-900/60 px-2.5 py-1.5 rounded-lg">
              <span>Admin: <strong>{currentUser?.username || 'Administrator'}</strong></span>
              <button
                onClick={() => onNavigate('/')}
                className="text-[#C8A951] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Site</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-6 text-sm">
            <div>
              <button
                onClick={() => selectTab('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition-colors cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-[#0B5D3B] text-white font-semibold shadow-sm'
                    : 'text-emerald-100 hover:bg-emerald-900/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-[#C8A951]" />
                <span>Dashboard</span>
              </button>
            </div>

            {/* CONTENT CATEGORY */}
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Content Management
              </p>
              <button
                onClick={() => selectTab('hero')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'hero' ? 'bg-[#0B5D3B] text-white font-semibold' : 'text-emerald-100 hover:bg-emerald-900/50'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Homepage & Hero</span>
              </button>
              <button
                onClick={() => selectTab('biography')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'biography' ? 'bg-[#0B5D3B] text-white font-semibold' : 'text-emerald-100 hover:bg-emerald-900/50'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Biography</span>
              </button>
              <button
                onClick={() => selectTab('career')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'career' ? 'bg-[#0B5D3B] text-white font-semibold' : 'text-emerald-100 hover:bg-emerald-900/50'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Career Timeline</span>
              </button>
              <button
                onClick={() => selectTab('education')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'education' ? 'bg-[#0B5D3B] text-white font-semibold' : 'text-emerald-100 hover:bg-emerald-900/50'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Education</span>
              </button>
              <button
                onClick={() => selectTab('projects')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'projects' ? 'bg-[#0B5D3B] text-white font-semibold' : 'text-emerald-100 hover:bg-emerald-900/50'
                }`}
              >
                <FolderKanban className="w-4 h-4" />
                <span>Works & Projects</span>
              </button>
              <button
                onClick={() => selectTab('gallery')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'gallery' ? 'bg-[#0B5D3B] text-white font-semibold' : 'text-emerald-100 hover:bg-emerald-900/50'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Media Library & Gallery</span>
              </button>
              <button
                onClick={() => selectTab('articles')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'articles' ? 'bg-[#0B5D3B] text-white font-semibold' : 'text-emerald-100 hover:bg-emerald-900/50'
                }`}
              >
                <Newspaper className="w-4 h-4" />
                <span>Media & Articles</span>
              </button>
              <button
                onClick={() => selectTab('publications')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'publications' ? 'bg-[#0B5D3B] text-white font-semibold' : 'text-emerald-100 hover:bg-emerald-900/50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Publications</span>
              </button>
            </div>

            {/* COMMUNICATION CATEGORY */}
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Communication
              </p>
              <button
                onClick={() => selectTab('messages')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'messages' ? 'bg-[#0B5D3B] text-white font-semibold' : 'text-emerald-100 hover:bg-emerald-900/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4" />
                  <span>Messages</span>
                </div>
                {stats && stats.unreadMessages > 0 && (
                  <span className="bg-[#C8A951] text-[#063B27] px-1.5 py-0.5 rounded text-[10px] font-bold">
                    {stats.unreadMessages}
                  </span>
                )}
              </button>
              <button
                onClick={() => selectTab('socialLinks')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'socialLinks' ? 'bg-[#0B5D3B] text-white font-semibold' : 'text-emerald-100 hover:bg-emerald-900/50'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>Social Links</span>
              </button>
            </div>

            {/* SYSTEM CATEGORY */}
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                System & Security
              </p>
              <button
                onClick={() => selectTab('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'settings' ? 'bg-[#0B5D3B] text-white font-semibold' : 'text-emerald-100 hover:bg-emerald-900/50'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Site Settings</span>
              </button>
              <button
                onClick={() => selectTab('account')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'account' ? 'bg-[#0B5D3B] text-white font-semibold' : 'text-emerald-100 hover:bg-emerald-900/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Account & Credentials</span>
              </button>
              <button
                onClick={() => selectTab('activity')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'activity' ? 'bg-[#0B5D3B] text-white font-semibold' : 'text-emerald-100 hover:bg-emerald-900/50'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Activity Log</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-emerald-800/60 space-y-2">
          <button
            onClick={handleExportDatabase}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-xs font-medium text-emerald-100 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#C8A951]" />
            <span>Export Database JSON</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-300 hover:bg-red-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN ADMIN WORKSPACE */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-7xl overflow-y-auto min-w-0">
        {/* ==================================================== */}
        {/* TAB 1: DASHBOARD HOME */}
        {/* ==================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif-title font-bold text-[#063B27]">
                Executive Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-[#66736B]">
                Welcome back, {currentUser?.username || 'Administrator'}. Manage all public records, media releases, and community projects.
              </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-xs text-[#66736B] font-medium">Total Projects</span>
                <p className="text-3xl font-serif-title font-bold text-[#0B5D3B] mt-1">
                  {stats?.totalProjects ?? projects.length}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-xs text-[#66736B] font-medium">Gallery Images</span>
                <p className="text-3xl font-serif-title font-bold text-[#063B27] mt-1">
                  {stats?.totalGalleryImages ?? gallery.length}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-xs text-[#66736B] font-medium">Articles & Media</span>
                <p className="text-3xl font-serif-title font-bold text-[#0B5D3B] mt-1">
                  {stats?.totalArticles ?? articles.length}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-xs text-[#66736B] font-medium">Publications</span>
                <p className="text-3xl font-serif-title font-bold text-[#063B27] mt-1">
                  {stats?.totalPublications ?? publications.length}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm col-span-2 md:col-span-1">
                <span className="text-xs text-[#66736B] font-medium">Messages</span>
                <p className="text-3xl font-serif-title font-bold text-[#C8A951] mt-1">
                  {stats?.totalMessages ?? messagesList.length}
                </p>
              </div>
            </div>

            {/* Recent Items split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Messages */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-[#063B27]">Recent Inquiries</h3>
                  <button
                    onClick={() => setActiveTab('messages')}
                    className="text-xs text-[#0B5D3B] font-semibold hover:underline"
                  >
                    View All Messages
                  </button>
                </div>
                {messagesList.length === 0 ? (
                  <p className="text-xs text-gray-500 py-6 text-center">No messages yet.</p>
                ) : (
                  <div className="space-y-3">
                    {messagesList.slice(0, 4).map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-xl border text-xs ${
                          msg.read ? 'bg-gray-50 border-gray-100' : 'bg-emerald-50/70 border-emerald-200 font-medium'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#17211C]">{msg.name}</span>
                          <span className="text-[10px] text-gray-500">{formatCustomDate(msg.createdAt)}</span>
                        </div>
                        <p className="text-gray-600 mt-1 line-clamp-1">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Activity Log */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-[#063B27]">Recent System Actions</h3>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className="text-xs text-[#0B5D3B] font-semibold hover:underline"
                  >
                    Full Activity Log
                  </button>
                </div>
                <div className="space-y-3">
                  {activityLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-start gap-2.5 text-xs text-[#17211C] border-b border-gray-50 pb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0B5D3B] shrink-0 mt-1.5"></div>
                      <div className="flex-1">
                        <span className="font-bold">{log.affectedItem}:</span> {log.details || log.action}
                        <span className="block text-[10px] text-gray-400 mt-0.5">{formatCustomDate(log.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: HOMEPAGE & HERO SECTION */}
        {/* ==================================================== */}
        {activeTab === 'hero' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-2xl font-serif-title font-bold text-[#063B27]">
                Hero Section & Introduction
              </h1>
              <p className="text-xs text-[#66736B]">
                Edit the headline, supporting text, portrait image, and call-to-action buttons shown on the homepage.
              </p>
            </div>

            <form onSubmit={handleSaveHero} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                    Hero Title / Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={heroForm.title || ''}
                    onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#0B5D3B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                    Hero Subtitle *
                  </label>
                  <input
                    type="text"
                    required
                    value={heroForm.subtitle || ''}
                    onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#0B5D3B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                  Supporting Introduction Text *
                </label>
                <textarea
                  rows={4}
                  required
                  value={heroForm.description || ''}
                  onChange={(e) => setHeroForm({ ...heroForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#0B5D3B]"
                ></textarea>
              </div>

              {/* Portrait Image Selection & Upload */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider">
                  Hero Portrait Image URL
                </label>
                <div className="flex gap-4 items-center">
                  <input
                    type="text"
                    value={heroForm.imageUrl || ''}
                    onChange={(e) => setHeroForm({ ...heroForm, imageUrl: e.target.value })}
                    placeholder="https://... or /uploads/..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#0B5D3B]"
                  />
                  {heroForm.imageUrl && (
                    <img
                      src={heroForm.imageUrl}
                      alt="Preview"
                      onError={(e) => {
                        e.currentTarget.src = '/hon-igbokwe-constituency.jpg';
                      }}
                      className="w-12 h-12 rounded-lg object-cover border"
                    />
                  )}
                </div>
                <p className="text-[11px] text-[#66736B]">
                  Upload a new portrait below or paste any image URL:
                </p>
                <ImageUploader
                  onUploadSuccess={async (files) => {
                    if (files[0]) {
                      const newUrl = files[0].url;
                      setHeroForm((prev: any) => ({ ...prev, imageUrl: newUrl }));
                      try {
                        await apiFetch('/api/admin/hero/portrait', {
                          method: 'POST',
                          body: { imageUrl: newUrl },
                        });
                        showToast('Hero portrait uploaded and saved permanently.');
                        await refreshSiteData();
                      } catch {
                        showToast('Hero image uploaded. Please click Save Hero Changes below to commit.', 'info');
                      }
                    }
                  }}
                  label="Upload New Hero Portrait"
                />
              </div>

              {/* Button text & links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                    Button One Label
                  </label>
                  <input
                    type="text"
                    value={heroForm.buttonOneText || ''}
                    onChange={(e) => setHeroForm({ ...heroForm, buttonOneText: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                    Button Two Label
                  </label>
                  <input
                    type="text"
                    value={heroForm.buttonTwoText || ''}
                    onChange={(e) => setHeroForm({ ...heroForm, buttonTwoText: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-6 py-2.5 rounded-xl bg-[#0B5D3B] hover:bg-[#063B27] text-white font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Hero Changes</span>
                </button>
              </div>
            </form>

            {/* HOMEPAGE SHOWCASE SLIDER (8 SLIDES) MANAGEMENT */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0B5D3B]/10 text-[#0B5D3B] text-[11px] font-bold">
                      {hero?.slides?.length || 0} Slides Active
                    </span>
                    <h2 className="text-lg font-serif-title font-bold text-[#063B27]">
                      Homepage Leadership Showcase Slider
                    </h2>
                  </div>
                  <p className="text-xs text-[#66736B] mt-1">
                    Manage the 8 sliding images of Hon. Raphael Nnanna Igbokwe displayed under the hero portrait.
                    Upload more photos, edit captions, and reorder slides.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <label className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0B5D3B] text-xs font-semibold flex items-center gap-2 cursor-pointer border border-emerald-200/80 shadow-xs transition-colors">
                    {batchUploadingSlides ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#0B5D3B]" />
                    ) : (
                      <UploadCloud className="w-4 h-4 text-[#0B5D3B]" />
                    )}
                    <span>{batchUploadingSlides ? 'Uploading Images...' : 'Upload Photos (New Slides)'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.jfif,.jpg,.jpeg,.png,.webp,.gif"
                      disabled={batchUploadingSlides}
                      onChange={handleBatchUploadSlides}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingSlide({
                        title: '',
                        caption: '',
                        tag: 'Leadership & Service',
                        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
                        order: (hero?.slides?.length || 0) + 1,
                      });
                      setIsNewSlide(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-[#063B27] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Slide</span>
                  </button>
                </div>
              </div>

              {/* Grid of Slides */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {(hero?.slides || []).map((slide, idx) => (
                  <div
                    key={slide.id || idx}
                    className="group bg-gray-50/80 rounded-2xl border border-gray-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all"
                  >
                    {/* Slide Photo Stage with Hover Upload Overlay */}
                    <div className="relative aspect-[16/10] bg-gray-900 overflow-hidden group/stage">
                      <img
                        src={slide.imageUrl}
                        alt={slide.title}
                        onError={(e) => {
                          const fallback =
                            DEFAULT_FALLBACK_SLIDES[slide.id] ||
                            DEFAULT_FALLBACK_SLIDES[`slide_0${(idx % 8) + 1}`] ||
                            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';
                          if (e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback;
                          }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-2 left-2 bg-[#0B5D3B] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow z-10">
                        Slide #{slide.order || idx + 1}
                      </div>
                      {slide.tag && (
                        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-xs text-[#C8A951] text-[10px] font-semibold px-2 py-0.5 rounded z-10">
                          {slide.tag}
                        </div>
                      )}

                      {/* Direct Upload / Replace Photo Overlay */}
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/stage:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer z-20 gap-1.5 p-3 text-center">
                        <Camera className="w-6 h-6 text-emerald-300 animate-pulse" />
                        <span className="text-xs font-semibold bg-[#0B5D3B] px-3 py-1 rounded-lg shadow-sm">
                          {uploadingSlideId === slide.id ? 'Uploading...' : 'Replace Photo'}
                        </span>
                        <span className="text-[10px] text-gray-200">Click to upload from device</span>
                        <input
                          type="file"
                          accept="image/*,.jfif,.jpg,.jpeg,.png,.webp,.gif"
                          disabled={uploadingSlideId === slide.id}
                          onChange={(e) => handleDirectSlideImageUpload(slide.id, e)}
                          className="hidden"
                        />
                      </label>

                      {uploadingSlideId === slide.id && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-30">
                          <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mb-1.5" />
                          <span className="text-xs font-semibold">Uploading photograph...</span>
                        </div>
                      )}
                    </div>

                    {/* Content info */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-bold text-sm text-[#17211C] line-clamp-1">
                          {slide.title}
                        </h4>
                        {slide.caption && (
                          <p className="text-xs text-[#66736B] line-clamp-2 mt-1">
                            {slide.caption}
                          </p>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="pt-2 border-t border-gray-200/70 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleReorderHeroSlide(slide.id, 'up')}
                            className="p-1.5 rounded hover:bg-white text-gray-600 disabled:opacity-30 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === (hero?.slides?.length || 0) - 1}
                            onClick={() => handleReorderHeroSlide(slide.id, 'down')}
                            className="p-1.5 rounded hover:bg-white text-gray-600 disabled:opacity-30 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <label
                            className="px-2 py-1 rounded-lg bg-emerald-50 text-[#0B5D3B] hover:bg-emerald-100 font-semibold flex items-center gap-1 cursor-pointer"
                            title="Upload new photo from device"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Photo</span>
                            <input
                              type="file"
                              accept="image/*,.jfif,.jpg,.jpeg,.png,.webp,.gif"
                              disabled={uploadingSlideId === slide.id}
                              onChange={(e) => handleDirectSlideImageUpload(slide.id, e)}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSlide(slide);
                              setIsNewSlide(false);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteHeroSlide(slide)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                            title="Delete Slide"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: BIOGRAPHY */}
        {/* ==================================================== */}
        {activeTab === 'biography' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-2xl font-serif-title font-bold text-[#063B27]">
                Biography & Stewardship Background
              </h1>
              <p className="text-xs text-[#66736B]">
                Update Hon. Raphael Nnanna Igbokwe's biography fields, origin, and public-service dimensions.
              </p>
            </div>

            <form onSubmit={handleSaveBio} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={bioForm.fullName || ''}
                    onChange={(e) => setBioForm({ ...bioForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#0B5D3B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                    Place of Origin *
                  </label>
                  <input
                    type="text"
                    required
                    value={bioForm.placeOfOrigin || ''}
                    onChange={(e) => setBioForm({ ...bioForm, placeOfOrigin: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#0B5D3B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                  Short Executive Summary
                </label>
                <textarea
                  rows={2}
                  value={bioForm.shortBio || ''}
                  onChange={(e) => setBioForm({ ...bioForm, shortBio: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#0B5D3B]"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                  Full Biography
                </label>
                <textarea
                  rows={8}
                  value={bioForm.fullBio || ''}
                  onChange={(e) => setBioForm({ ...bioForm, fullBio: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-sans focus:outline-none focus:border-[#0B5D3B]"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                    Legislative Experience
                  </label>
                  <textarea
                    rows={3}
                    value={bioForm.legislativeExperience || ''}
                    onChange={(e) => setBioForm({ ...bioForm, legislativeExperience: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                    Public-Service Experience
                  </label>
                  <textarea
                    rows={3}
                    value={bioForm.publicServiceExperience || ''}
                    onChange={(e) => setBioForm({ ...bioForm, publicServiceExperience: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                    Professional Background
                  </label>
                  <textarea
                    rows={3}
                    value={bioForm.professionalBackground || ''}
                    onChange={(e) => setBioForm({ ...bioForm, professionalBackground: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                    Community Involvement
                  </label>
                  <textarea
                    rows={3}
                    value={bioForm.communityInvolvement || ''}
                    onChange={(e) => setBioForm({ ...bioForm, communityInvolvement: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  ></textarea>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-6 py-2.5 rounded-xl bg-[#0B5D3B] hover:bg-[#063B27] text-white font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Biography</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: WORKS & PROJECTS */}
        {/* ==================================================== */}
        {activeTab === 'projects' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-serif-title font-bold text-[#063B27]">
                  Works & Projects Management
                </h1>
                <p className="text-xs text-[#66736B]">
                  Create, edit, feature, and publish community development records.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingProject({
                    title: '',
                    category: 'Infrastructure',
                    location: 'Ahiazu Mbaise, Imo State',
                    date: 'Recent',
                    description: '',
                    publicServiceContext: '',
                    featured: false,
                    status: 'Completed',
                    coverImage: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1000&q=80',
                    additionalImages: [],
                  });
                  setIsNewProject(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-[#063B27] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Work</span>
              </button>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#17211C]">
                  <thead className="bg-gray-50 border-b border-gray-100 text-[#063B27] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-4">Project & Photo</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Date / Era</th>
                      <th className="p-4 text-center">Featured (Homepage)</th>
                      <th className="p-4 text-right">Status & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {projects.map((proj) => (
                      <tr key={proj.id} className="hover:bg-gray-50/60">
                        <td className="p-4 font-semibold flex items-center gap-3">
                          <div className="relative group/thumb w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
                            <img
                              src={proj.coverImage}
                              alt={proj.title}
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=400&q=80';
                              }}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProject(proj);
                                setIsNewProject(false);
                              }}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold cursor-pointer"
                              title="Click to change photo in editor"
                            >
                              Edit Photo
                            </button>
                          </div>
                          <div>
                            <span className="line-clamp-1 max-w-xs font-bold text-[#17211C]">{proj.title}</span>
                            <span className="text-[11px] text-[#66736B] line-clamp-1">{proj.publicServiceContext || proj.category}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#0B5D3B] font-semibold text-[11px]">
                            {proj.category}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500">{proj.location}</td>
                        <td className="p-4 text-gray-500">{proj.date}</td>
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleProjectFeatured(proj)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs ${
                              proj.featured
                                ? 'bg-[#C8A951]/20 text-[#85681A] border border-[#C8A951]'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-transparent'
                            }`}
                            title={proj.featured ? 'Featured on Homepage (Click to unfeature)' : 'Click to feature on Homepage'}
                          >
                            <Star className={`w-3.5 h-3.5 ${proj.featured ? 'fill-[#C8A951] text-[#C8A951]' : 'text-gray-400'}`} />
                            <span>{proj.featured ? 'Featured' : 'Standard'}</span>
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Quick Status / Publish dropdown */}
                            <select
                              value={proj.status || 'Completed'}
                              onChange={(e) => handleUpdateProjectStatus(proj, e.target.value)}
                              className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#17211C] text-[11px] font-bold border border-gray-200 cursor-pointer"
                              title="Quick update status / publish state"
                            >
                              <option value="Completed">Completed</option>
                              <option value="Ongoing">Ongoing</option>
                              <option value="Public Record">Public Record</option>
                            </select>

                            <button
                              onClick={() => {
                                setEditingProject(proj);
                                setIsNewProject(false);
                              }}
                              className="p-1.5 rounded-lg text-[#0B5D3B] hover:bg-emerald-50 cursor-pointer"
                              title="Edit Details & Photo"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(proj)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: MEDIA LIBRARY & GALLERY */}
        {/* ==================================================== */}
        {activeTab === 'gallery' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h1 className="text-2xl font-serif-title font-bold text-[#063B27]">
                  Media Library & Gallery
                </h1>
                <p className="text-xs text-[#66736B]">
                  Manage visual photographs, press releases, and articles on constituency development projects.
                </p>
              </div>

              {/* Subview Toggle: Photographs vs Articles */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setGallerySubView('photos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    gallerySubView === 'photos'
                      ? 'bg-white text-[#063B27] shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Photo Gallery ({gallery.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGallerySubView('articles')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    gallerySubView === 'articles'
                      ? 'bg-[#0B5D3B] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Newspaper className="w-3.5 h-3.5" />
                  <span>Project Articles ({articles.length})</span>
                </button>
              </div>
            </div>

            {/* VIEW 1: PHOTOGRAPHS & VISUAL RECORDS */}
            {gallerySubView === 'photos' && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGalleryItem({
                        title: '',
                        category: 'Community Engagement',
                        location: 'Ahiazu Mbaise, Imo State',
                        date: new Date().getFullYear().toString(),
                        description: '',
                        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
                        featured: false,
                      });
                      setIsNewGalleryItem(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-[#063B27] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Single Photo with Details</span>
                  </button>
                </div>

                {/* Bulk Upload Area */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-[#17211C] uppercase tracking-wider">
                    Upload New Photographs (Drag & Drop or Multiple Selection)
                  </h3>
                  <ImageUploader
                    multiple
                    onUploadSuccess={async (files) => {
                      for (const f of files) {
                        await apiFetch('/api/admin/gallery', {
                          method: 'POST',
                          body: {
                            imageUrl: f.url,
                            title: f.originalName.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
                            category: 'Community Engagement',
                            location: 'Ahiazu Mbaise, Imo State',
                            date: new Date().getFullYear().toString(),
                            featured: false,
                          },
                        });
                      }
                      showToast(`Successfully added ${files.length} photo(s) to gallery.`);
                      await refreshSiteData();
                    }}
                  />
                </div>

                {/* Filter and Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search gallery images by title or location..."
                      value={gallerySearch}
                      onChange={(e) => setGallerySearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-gray-200 text-xs"
                    />
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {[
                      'All',
                      'Healthcare Modernization',
                      'Agricultural Development',
                      'Water Infrastructure',
                      'Community Engagement',
                      'Legislative Activities',
                      'Community Empowerment',
                    ].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedGalleryCategory(cat)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                          selectedGalleryCategory === cat
                            ? 'bg-[#0B5D3B] text-white shadow-xs'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="text-xs text-[#66736B] shrink-0">
                    Total: <strong>{gallery.length}</strong> photographs stored
                  </div>
                </div>

                {/* Image Grid with Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gallery
                    .filter((g) => {
                      const matchSearch =
                        g.title.toLowerCase().includes(gallerySearch.toLowerCase()) ||
                        g.category.toLowerCase().includes(gallerySearch.toLowerCase()) ||
                        (g.location && g.location.toLowerCase().includes(gallerySearch.toLowerCase()));
                      const matchCat =
                        selectedGalleryCategory === 'All' || g.category === selectedGalleryCategory;
                      return matchSearch && matchCat;
                    })
                    .map((img) => (
                      <div key={img.id} className="bg-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
                        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                          <img
                            src={img.imageUrl}
                            alt={img.title}
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          
                          {/* Top Badges: Featured Star + Category */}
                          <button
                            type="button"
                            onClick={() => handleToggleGalleryFeatured(img)}
                            className={`absolute top-2 left-2 p-1.5 rounded-full backdrop-blur-md cursor-pointer transition-transform hover:scale-110 shadow-sm ${
                              img.featured
                                ? 'bg-amber-400 text-amber-950'
                                : 'bg-black/50 text-white/80 hover:text-white'
                            }`}
                            title={img.featured ? 'Featured on Gallery (Click to unfeature)' : 'Click to feature on Gallery'}
                          >
                            <Star className={`w-3.5 h-3.5 ${img.featured ? 'fill-amber-950' : ''}`} />
                          </button>

                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                            {img.category}
                          </div>
                        </div>

                        <div className="p-4 space-y-2">
                          <h4 className="text-sm font-bold text-[#17211C] line-clamp-1">{img.title}</h4>
                          <p className="text-xs text-[#66736B] line-clamp-1">{img.location} · {img.date}</p>
                          {img.description && (
                            <p className="text-xs text-gray-500 line-clamp-2">{img.description}</p>
                          )}

                          <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingGalleryItem(img);
                                  setIsNewGalleryItem(false);
                                }}
                                className="text-[#0B5D3B] hover:text-[#063B27] font-semibold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-1 rounded"
                                title="Edit image title, caption, category and photo"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Edit Details</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(img.imageUrl);
                                  showToast('Image URL copied to clipboard.');
                                }}
                                className="text-gray-500 hover:text-gray-700 flex items-center gap-1 cursor-pointer"
                                title="Copy image link"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy URL</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleSetAsHeroImage(img)}
                                className="text-amber-800 hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
                                title="Set as Hero Portrait"
                              >
                                <Star className="w-3 h-3 text-amber-600" />
                                <span>Set Hero</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteGalleryImage(img)}
                                className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                                title="Delete image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* VIEW 2: PROJECT ARTICLES & MEDIA RELEASES INSIDE MEDIA & GALLERY */}
            {gallerySubView === 'articles' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search articles by title or project..."
                      value={articleSearch}
                      onChange={(e) => setArticleSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-gray-200 text-xs"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setEditingArticle({
                        title: '',
                        summary: '',
                        content: '',
                        author: 'Hon. Raphael Nnanna Igbokwe',
                        category: 'Healthcare Modernization',
                        source: 'Press Office',
                        published: true,
                        featured: false,
                        coverImage: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1000&q=80',
                      });
                      setIsNewArticle(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-[#063B27] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Write New Project Article</span>
                  </button>
                </div>

                {/* Category Pills for Articles */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {[
                    'All',
                    'Healthcare Modernization',
                    'Agricultural Development',
                    'Water & Sanitation',
                    'Legislative Reform',
                    'Community Empowerment',
                    'Education Policy',
                  ].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedArticleCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                        selectedArticleCategory === cat
                          ? 'bg-[#0B5D3B] text-white shadow-xs'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Articles Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-[#17211C]">
                      <thead className="bg-gray-50 border-b border-gray-100 text-[#063B27] uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="p-4">Project Article</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Author / Source</th>
                          <th className="p-4">Date</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {articles
                          .filter((art) => {
                            const matchSearch =
                              art.title.toLowerCase().includes(articleSearch.toLowerCase()) ||
                              art.category.toLowerCase().includes(articleSearch.toLowerCase()) ||
                              (art.summary && art.summary.toLowerCase().includes(articleSearch.toLowerCase()));
                            const matchCat =
                              selectedArticleCategory === 'All' || art.category === selectedArticleCategory;
                            return matchSearch && matchCat;
                          })
                          .map((art) => (
                            <tr key={art.id} className="hover:bg-gray-50/60">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  {art.coverImage && (
                                    <img
                                      src={art.coverImage}
                                      alt={art.title}
                                      onError={(e) => {
                                        e.currentTarget.src = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80';
                                      }}
                                      className="w-12 h-9 rounded-lg object-cover border border-gray-100 shrink-0"
                                    />
                                  )}
                                  <div>
                                    <p className="font-semibold text-gray-900 line-clamp-1 max-w-sm">{art.title}</p>
                                    <p className="text-[11px] text-gray-500 line-clamp-1 max-w-sm">{art.summary}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#0B5D3B] font-semibold text-[11px]">
                                  {art.category}
                                </span>
                              </td>
                              <td className="p-4 text-gray-500">{art.author}</td>
                              <td className="p-4 text-gray-500">{formatCustomDate(art.publishedAt)}</td>
                              <td className="p-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    art.published ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {art.published ? 'Published' : 'Draft'}
                                </span>
                              </td>
                              <td className="p-4 text-right space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingArticle(art);
                                    setIsNewArticle(false);
                                  }}
                                  className="p-1.5 rounded-lg text-[#0B5D3B] hover:bg-emerald-50 cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteArticle(art)}
                                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 6: MEDIA & ARTICLES */}
        {/* ==================================================== */}
        {activeTab === 'articles' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-serif-title font-bold text-[#063B27]">
                  Media, Statements & Articles
                </h1>
                <p className="text-xs text-[#66736B]">
                  Draft, preview, publish, and archive project articles, statements, and policy commentary.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingArticle({
                    title: '',
                    summary: '',
                    content: '',
                    author: 'Hon. Raphael Nnanna Igbokwe',
                    category: 'Healthcare Modernization',
                    source: 'Press Office',
                    published: true,
                    featured: false,
                    coverImage: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1000&q=80',
                  });
                  setIsNewArticle(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-[#063B27] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Article</span>
              </button>
            </div>

            {/* Search and Category Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search articles by title or project..."
                  value={articleSearch}
                  onChange={(e) => setArticleSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-gray-200 text-xs"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  'All',
                  'Healthcare Modernization',
                  'Agricultural Development',
                  'Water & Sanitation',
                  'Legislative Reform',
                  'Community Empowerment',
                  'Education Policy',
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedArticleCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      selectedArticleCategory === cat
                        ? 'bg-[#0B5D3B] text-white shadow-xs'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#17211C]">
                  <thead className="bg-gray-50 border-b border-gray-100 text-[#063B27] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-4">Project Article</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Author / Source</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {articles
                      .filter((art) => {
                        const matchSearch =
                          art.title.toLowerCase().includes(articleSearch.toLowerCase()) ||
                          art.category.toLowerCase().includes(articleSearch.toLowerCase()) ||
                          (art.summary && art.summary.toLowerCase().includes(articleSearch.toLowerCase()));
                        const matchCat =
                          selectedArticleCategory === 'All' || art.category === selectedArticleCategory;
                        return matchSearch && matchCat;
                      })
                      .map((art) => (
                        <tr key={art.id} className="hover:bg-gray-50/60">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {art.coverImage && (
                                <img
                                  src={art.coverImage}
                                  alt={art.title}
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80';
                                  }}
                                  className="w-12 h-9 rounded-lg object-cover border border-gray-100 shrink-0"
                                />
                              )}
                              <div>
                                <p className="font-semibold text-gray-900 line-clamp-1 max-w-sm">{art.title}</p>
                                <p className="text-[11px] text-gray-500 line-clamp-1 max-w-sm">{art.summary}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#0B5D3B] font-semibold text-[11px]">
                              {art.category}
                            </span>
                          </td>
                          <td className="p-4 text-gray-500">{art.author}</td>
                          <td className="p-4 text-gray-500">{formatCustomDate(art.publishedAt)}</td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                art.published ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {art.published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingArticle(art);
                                setIsNewArticle(false);
                              }}
                              className="p-1.5 rounded-lg text-[#0B5D3B] hover:bg-emerald-50 cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteArticle(art)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 7: CAREER & EDUCATION */}
        {/* ==================================================== */}
        {activeTab === 'career' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-serif-title font-bold text-[#063B27]">
                  Political & Legislative Career Milestones
                </h1>
                <p className="text-xs text-[#66736B]">
                  Manage legislative tenures, official institutions, and external source gazettes.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingCareer({
                    year: '2019 – Present',
                    title: '',
                    institution: 'National Assembly / Public Advisory',
                    description: '',
                    sourceLink: '',
                    order: career.length + 1,
                  });
                }}
                className="px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-[#063B27] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Career Milestone</span>
              </button>
            </div>

            <div className="space-y-4">
              {career.map((c) => (
                <div key={c.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {c.imageUrl && (
                      <img
                        src={c.imageUrl}
                        alt={c.title}
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=400&q=80';
                        }}
                        className="w-16 h-16 rounded-xl object-cover border border-gray-100 shrink-0 shadow-xs mt-1"
                      />
                    )}
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-[#0B5D3B] uppercase">{c.year}</span>
                      <h3 className="text-lg font-bold text-[#17211C]">{c.title}</h3>
                      <p className="text-xs text-[#063B27] font-semibold">{c.institution}</p>
                      <p className="text-sm text-[#66736B] leading-relaxed mt-2">{c.description}</p>
                      {c.sourceLink && (
                        <a href={c.sourceLink} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0B5D3B] underline inline-block mt-2">
                          {c.sourceLink}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                    <button
                      onClick={() => setEditingCareer(c)}
                      className="p-2 text-[#0B5D3B] hover:bg-emerald-50 rounded-lg cursor-pointer flex items-center gap-1 text-xs font-semibold"
                      title="Edit milestone details and photo"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: 'Delete career milestone?',
                          message: `Delete "${c.title}"?`,
                          onConfirm: async () => {
                            await apiFetch(`/api/admin/career/${c.id}`, { method: 'DELETE' });
                            showToast('Career item deleted.');
                            await refreshSiteData();
                            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                          },
                        });
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: EDUCATION */}
        {activeTab === 'education' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-serif-title font-bold text-[#063B27]">
                  Educational Credentials
                </h1>
                <p className="text-xs text-[#66736B]">
                  Manage institutions, academic qualifications, and verified certifications.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingEdu({
                    institution: '',
                    qualification: '',
                    field: '',
                    year: 'Public Record',
                    description: '',
                    order: education.length + 1,
                  });
                }}
                className="px-4 py-2 rounded-xl bg-[#0B5D3B] hover:bg-[#063B27] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Education Entry</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {education.map((e) => (
                <div key={e.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#0B5D3B]">{e.year}</span>
                    <h3 className="text-lg font-bold text-[#17211C]">{e.qualification}</h3>
                    <p className="text-xs text-[#063B27] font-semibold">{e.institution}</p>
                    <p className="text-xs text-gray-500 mb-2">Field: {e.field}</p>
                    <p className="text-sm text-[#66736B]">{e.description}</p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end gap-2">
                    <button
                      onClick={() => setEditingEdu(e)}
                      className="p-1.5 text-[#0B5D3B] hover:bg-emerald-50 rounded-lg cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: 'Delete education record?',
                          message: `Delete "${e.institution}"?`,
                          onConfirm: async () => {
                            await apiFetch(`/api/admin/education/${e.id}`, { method: 'DELETE' });
                            showToast('Education deleted.');
                            await refreshSiteData();
                            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                          },
                        });
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 8: PUBLICATIONS */}
        {/* ==================================================== */}
        {activeTab === 'publications' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-serif-title font-bold text-[#063B27]">
                  Publications & Document Reports
                </h1>
                <p className="text-xs text-[#66736B]">
                  Manage, edit, and upload official PDF documents, legislative scorecards, and public reports.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingPub({
                    title: '',
                    description: '',
                    category: 'Legislative Report',
                    fileUrl: '',
                    fileType: 'PDF Document',
                    fileSize: 'PDF Document',
                    publishedAt: new Date().toISOString(),
                    coverImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
                  });
                }}
                className="px-5 py-2.5 rounded-xl bg-[#0B5D3B] hover:bg-[#063B27] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md transition-all shrink-0 hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Publication</span>
              </button>
            </div>

            {/* Search and Category Filter Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search publications by title or topic..."
                  value={pubSearch}
                  onChange={(e) => setPubSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0B5D3B]/20"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                {['All', 'Legislative Report', 'Policy Brief', 'Development Assessment', 'Constituency Blueprint', 'Parliamentary Gazette', 'Other'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedPubCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      selectedPubCategory === cat
                        ? 'bg-[#0B5D3B] text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Publications Grid */}
            {(() => {
              const filteredPubs = publications.filter((p) => {
                const matchesCat = selectedPubCategory === 'All' || p.category === selectedPubCategory;
                const matchesSearch =
                  p.title.toLowerCase().includes(pubSearch.toLowerCase()) ||
                  p.description.toLowerCase().includes(pubSearch.toLowerCase()) ||
                  p.category.toLowerCase().includes(pubSearch.toLowerCase());
                return matchesCat && matchesSearch;
              });

              if (filteredPubs.length === 0) {
                return (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-[#17211C] mb-1">
                      {pubSearch || selectedPubCategory !== 'All' ? 'No matching publications found' : 'No publications uploaded yet'}
                    </h3>
                    <p className="text-xs text-[#66736B] mb-5 max-w-md mx-auto">
                      {pubSearch || selectedPubCategory !== 'All'
                        ? 'Try adjusting your search criteria or resetting the category filter.'
                        : 'Upload policy briefs, legislative reports, and assessment documents for public record.'}
                    </p>
                    <button
                      onClick={() => {
                        setEditingPub({
                          title: '',
                          description: '',
                          category: 'Legislative Report',
                          fileUrl: '',
                          fileType: 'PDF Document',
                          fileSize: 'PDF Document',
                          publishedAt: new Date().toISOString(),
                          coverImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
                        });
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B5D3B] text-white rounded-xl text-xs font-semibold hover:bg-[#063B27] cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Upload Publication Now</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPubs.map((pub) => (
                    <div
                      key={pub.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
                    >
                      <div>
                        {/* Cover Image or Header Preview */}
                        <div className="relative aspect-[16/9] bg-gradient-to-br from-emerald-900 to-gray-800 overflow-hidden">
                          {pub.coverImage ? (
                            <img
                              src={pub.coverImage}
                              alt={pub.title}
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80';
                              }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white/80 p-4 text-center">
                              <FileText className="w-10 h-10 text-[#C8A951] mb-2" />
                              <span className="text-xs font-semibold uppercase tracking-wider">{pub.category}</span>
                            </div>
                          )}
                          <div className="absolute top-3 left-3 bg-[#063B27]/85 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {pub.category}
                          </div>
                          {pub.fileType && (
                            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-[#063B27] text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                              {pub.fileType}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-2">
                          <h3 className="text-base font-bold text-[#17211C] leading-snug line-clamp-2">
                            {pub.title}
                          </h3>
                          <p className="text-xs text-[#66736B] line-clamp-3 leading-relaxed">
                            {pub.description}
                          </p>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="p-5 pt-3 border-t border-gray-100 flex flex-col gap-3">
                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#C8A951]" />
                            <span>{formatCustomDate(pub.publishedAt)}</span>
                          </span>
                          <span className="font-medium text-[#0B5D3B]">{pub.fileSize || 'Official Doc'}</span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          {pub.fileUrl && pub.fileUrl !== '#' ? (
                            <a
                              href={pub.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
                              title="Open document in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-[#0B5D3B]" />
                              <span>View File</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">No file attached</span>
                          )}

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingPub(pub)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0B5D3B] font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Edit publication details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeletePublication(pub)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete publication"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 9: MESSAGES */}
        {/* ==================================================== */}
        {activeTab === 'messages' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-2xl font-serif-title font-bold text-[#063B27]">
                Constituency Inquiries & Messages
              </h1>
              <p className="text-xs text-[#66736B]">
                Review notes transmitted from the public contact portal.
              </p>
            </div>

            <div className="space-y-4">
              {messagesList.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#17211C]">Inbox is empty</p>
                </div>
              ) : (
                messagesList.map((m) => (
                  <div
                    key={m.id}
                    className={`bg-white p-6 rounded-2xl border shadow-sm transition-all ${
                      m.read ? 'border-gray-100' : 'border-[#0B5D3B]/40 bg-emerald-50/20'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-[#17211C]">{m.name}</h4>
                        {!m.read && (
                          <span className="bg-[#0B5D3B] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                            New
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#66736B]">{formatCustomDate(m.createdAt)}</span>
                    </div>

                    <div className="text-xs text-[#66736B] mb-3">
                      Email: <strong className="text-[#17211C]">{m.email}</strong>
                      {m.phone && <> · Phone: <strong className="text-[#17211C]">{m.phone}</strong></>}
                    </div>

                    <p className="text-sm font-semibold text-[#063B27] mb-1">Subject: {m.subject}</p>
                    <p className="text-sm text-[#17211C] leading-relaxed bg-[#F6F9F7] p-4 rounded-xl">
                      {m.message}
                    </p>

                    <div className="mt-4 flex items-center justify-end gap-3 text-xs">
                      {!m.read && (
                        <button
                          onClick={async () => {
                            await apiFetch(`/api/admin/messages/${m.id}/read`, { method: 'PATCH' });
                            setMessagesList((prev) =>
                              prev.map((item) => (item.id === m.id ? { ...item, read: true } : item))
                            );
                            showToast('Marked as read.');
                          }}
                          className="text-[#0B5D3B] font-semibold hover:underline cursor-pointer"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          await apiFetch(`/api/admin/messages/${m.id}`, { method: 'DELETE' });
                          setMessagesList((prev) => prev.filter((item) => item.id !== m.id));
                          showToast('Message removed.');
                        }}
                        className="text-red-600 font-semibold hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 10: SOCIAL LINKS */}
        {/* ==================================================== */}
        {activeTab === 'socialLinks' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-2xl font-serif-title font-bold text-[#063B27]">
                Social Media Links
              </h1>
              <p className="text-xs text-[#66736B]">
                Configure official and verified public profile URLs for Hon. Raphael Nnanna Igbokwe.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              {socialLinksState.map((link, idx) => (
                <div key={link.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-32 text-xs font-bold text-[#17211C]">{link.platform}</div>
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => {
                      const updated = [...socialLinksState];
                      updated[idx].url = e.target.value;
                      setSocialLinksState(updated);
                    }}
                    placeholder={`https://${link.platform.toLowerCase()}.com/...`}
                    className="flex-1 px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs"
                  />
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={link.enabled}
                      onChange={(e) => {
                        const updated = [...socialLinksState];
                        updated[idx].enabled = e.target.checked;
                        setSocialLinksState(updated);
                      }}
                      className="rounded text-[#0B5D3B]"
                    />
                    <span>Enabled</span>
                  </label>
                </div>
              ))}

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveSocialLinks}
                  className="px-6 py-2.5 rounded-xl bg-[#0B5D3B] hover:bg-[#063B27] text-white font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Social Links</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 11: SITE SETTINGS */}
        {/* ==================================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-2xl font-serif-title font-bold text-[#063B27]">
                Site Settings & Contact Metadata
              </h1>
              <p className="text-xs text-[#66736B]">
                Configure office addresses, phone numbers, email, footer copy, and brand colors.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                    Official Name
                  </label>
                  <input
                    type="text"
                    value={settingsForm.fullName || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={settingsForm.email || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={settingsForm.phone || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                    Office Location
                  </label>
                  <input
                    type="text"
                    value={settingsForm.officeLocation || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, officeLocation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                  Liaison & Constituency Address
                </label>
                <textarea
                  rows={2}
                  value={settingsForm.address || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                  Footer Description
                </label>
                <textarea
                  rows={3}
                  value={settingsForm.footerText || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, footerText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-6 py-2.5 rounded-xl bg-[#0B5D3B] hover:bg-[#063B27] text-white font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 12: ADMIN ACCOUNT & CREDENTIALS (USERNAME & PASSWORD) */}
        {/* ==================================================== */}
        {activeTab === 'account' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-2xl font-serif-title font-bold text-[#063B27]">
                Admin Account & Credentials
              </h1>
              <p className="text-xs text-[#66736B]">
                Manage your administrative login credentials, change your username, and update your access password.
              </p>
            </div>

            {/* Active Account Overview Card */}
            <div className="bg-gradient-to-r from-[#063B27] via-[#0B5D3B] to-[#063B27] rounded-2xl p-6 text-white shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-xl font-bold font-serif-title text-[#C8A951]">
                    {currentUser?.username ? currentUser.username.substring(0, 2).toUpperCase() : 'AD'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wider font-semibold text-[#C8A951]">
                        Current Administrator
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-900/80 border border-emerald-700/60 text-[10px] font-bold text-emerald-200">
                        Active Session
                      </span>
                    </div>
                    <p className="text-xl font-serif-title font-bold text-white mt-0.5">
                      @{currentUser?.username || 'Administrator'}
                    </p>
                    <p className="text-xs text-emerald-200">
                      Super Administrator • Full Public Records & CMS Authority
                    </p>
                  </div>
                </div>

                <div className="sm:text-right border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0 space-y-1">
                  <p className="text-[11px] text-emerald-200 uppercase tracking-wider">
                    Session Security
                  </p>
                  <p className="text-xs font-semibold text-white flex items-center sm:justify-end gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C8A951]" />
                    <span>bcrypt 10-Salt + Signed JWT</span>
                  </p>
                  <p className="text-[11px] text-emerald-300/80">
                    Last Login: {currentUser?.lastLogin ? formatCustomDate(currentUser.lastLogin) : 'Active Session'}
                  </p>
                </div>
              </div>
            </div>

            {/* Grid with 2 distinct forms: Change Username & Change Password */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Card 1: Change Username */}
              <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                <div className="border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0B5D3B] flex items-center justify-center">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-serif-title font-bold text-[#063B27]">
                        Change Admin Username
                      </h2>
                      <p className="text-xs text-[#66736B]">
                        Update the login username used to access this administration panel.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleChangeUsername} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                      Current Username
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        disabled
                        value={currentUser?.username || ''}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-sm text-gray-700 cursor-not-allowed font-medium font-mono"
                      />
                      <Lock className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      This is your active administrator sign-in name.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                      New Desired Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={usernameForm.newUsername}
                      onChange={(e) => setUsernameForm({ ...usernameForm, newUsername: e.target.value })}
                      placeholder="e.g. director_igbokwe or admin"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#0B5D3B]"
                    />
                    <p className="text-[11px] text-[#66736B] mt-1">
                      Must be 3–40 characters (letters, numbers, underscores, and hyphens).
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                      Current Password (To Authorize Change) *
                    </label>
                    <input
                      type="password"
                      required
                      value={usernameForm.currentPassword}
                      onChange={(e) => setUsernameForm({ ...usernameForm, currentPassword: e.target.value })}
                      placeholder="Enter current password to verify identity"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#0B5D3B]"
                    />
                    <p className="text-[11px] text-[#66736B] mt-1">
                      Your password is required to verify ownership before applying the new username.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loadingAction}
                      className="w-full py-2.5 rounded-xl bg-[#0B5D3B] hover:bg-[#063B27] text-white font-semibold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{loadingAction ? 'Updating Username...' : 'Update Username'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Card 2: Change Password */}
              <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                <div className="border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0B5D3B] flex items-center justify-center">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-serif-title font-bold text-[#063B27]">
                        Change Admin Password
                      </h2>
                      <p className="text-xs text-[#66736B]">
                        Update your administrator password securely. Passwords are hash-encrypted using bcrypt.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                      Current Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Enter existing password"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#0B5D3B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                      New Password (min 8 characters) *
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Enter new strong password"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#0B5D3B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17211C] uppercase tracking-wider mb-1.5">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Re-type new password"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#0B5D3B]"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loadingAction}
                      className="w-full py-2.5 rounded-xl bg-[#0B5D3B] hover:bg-[#063B27] text-white font-semibold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{loadingAction ? 'Updating Password...' : 'Update Password'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 13: ACTIVITY LOG */}
        {/* ==================================================== */}
        {activeTab === 'activity' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-2xl font-serif-title font-bold text-[#063B27]">
                Administrative Activity Log
              </h1>
              <p className="text-xs text-[#66736B]">
                Audit trail of changes made across the content management system.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#17211C]">
                  <thead className="bg-gray-50 border-b border-gray-100 text-[#063B27] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Administrator</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Section / Item</th>
                      <th className="p-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activityLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/60">
                        <td className="p-4 text-gray-500 whitespace-nowrap">{formatCustomDate(log.timestamp)}</td>
                        <td className="p-4 font-bold text-[#063B27]">{log.administrator}</td>
                        <td className="p-4 font-semibold text-[#0B5D3B]">{log.action}</td>
                        <td className="p-4">{log.affectedItem}</td>
                        <td className="p-4 text-gray-600 max-w-sm truncate">{log.details || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==================================================== */}
      {/* MODAL: PROJECT EDITOR (with Preview & Draft) */}
      {/* ==================================================== */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5">
            <h3 className="text-xl font-bold text-[#063B27]">
              {isNewProject ? 'Add New Work / Achievement' : 'Edit Project Record'}
            </h3>

            <form onSubmit={handleSaveProject} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#17211C] uppercase mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  value={editingProject.title || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#17211C] uppercase mb-1">Category</label>
                  <select
                    value={editingProject.category || 'Infrastructure'}
                    onChange={(e: any) => setEditingProject({ ...editingProject, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  >
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Education">Education</option>
                    <option value="Health">Health</option>
                    <option value="Youth Development">Youth Development</option>
                    <option value="Community Development">Community Development</option>
                    <option value="Legislative Work">Legislative Work</option>
                    <option value="Empowerment">Empowerment</option>
                    <option value="Social Development">Social Development</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#17211C] uppercase mb-1">Status</label>
                  <select
                    value={editingProject.status || 'Completed'}
                    onChange={(e: any) => setEditingProject({ ...editingProject, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Public Record">Public Record</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#17211C] uppercase mb-1">Community / Location</label>
                  <input
                    type="text"
                    value={editingProject.location || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#17211C] uppercase mb-1">Execution Date / Era</label>
                  <input
                    type="text"
                    value={editingProject.date || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#17211C] uppercase mb-1">Detailed Description *</label>
                <textarea
                  rows={4}
                  required
                  value={editingProject.description || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-[#17211C] uppercase mb-1">Public-Service Context</label>
                <input
                  type="text"
                  value={editingProject.publicServiceContext || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, publicServiceContext: e.target.value })}
                  placeholder="e.g. Facilitated through Ministry of Power appropriation"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-[#17211C] uppercase mb-1">Cover Image</label>
                <div className="flex gap-4 items-center mb-3">
                  <input
                    type="text"
                    value={editingProject.coverImage || ''}
                    onChange={(e) => setEditingProject((prev) => prev ? ({ ...prev, coverImage: e.target.value }) : null)}
                    placeholder="https://... or /uploads/..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#0B5D3B]"
                  />
                  {editingProject.coverImage && (
                    <img
                      src={editingProject.coverImage}
                      alt="Project Preview"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=400&q=80';
                      }}
                      className="w-14 h-14 rounded-xl object-cover border border-gray-200 shadow-xs shrink-0"
                    />
                  )}
                </div>
                <ImageUploader
                  onUploadSuccess={(files) => {
                    if (files && files[0]) {
                      setEditingProject((prev) => prev ? ({ ...prev, coverImage: files[0].url }) : null);
                      showToast('Project cover photo updated successfully.');
                    }
                  }}
                  label="Upload / Replace Project Cover Photo"
                />
              </div>

              <div className="flex items-center gap-3 pt-2 p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <input
                  type="checkbox"
                  id="featProj"
                  checked={editingProject.featured || false}
                  onChange={(e) => setEditingProject((prev) => prev ? ({ ...prev, featured: e.target.checked }) : null)}
                  className="w-4 h-4 rounded text-[#0B5D3B] focus:ring-[#0B5D3B] cursor-pointer"
                />
                <label htmlFor="featProj" className="text-xs font-bold text-[#063B27] cursor-pointer flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-[#C8A951] text-[#C8A951]" />
                  <span>Feature this work prominently on the Homepage (Featured Section)</span>
                </label>
              </div>

              {/* Action Buttons: Cancel, Preview, Publish */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setProjectPreviewModal(editingProject)}
                  className="px-4 py-2 rounded-lg border border-[#0B5D3B] text-[#0B5D3B] hover:bg-emerald-50 font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 rounded-lg bg-[#0B5D3B] text-white hover:bg-[#063B27] font-semibold cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Publish Work</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: PROJECT PREVIEW */}
      {/* ==================================================== */}
      {projectPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-xs font-bold text-[#0B5D3B] uppercase tracking-wider">
                Public Page Preview
              </span>
              <button
                onClick={() => setProjectPreviewModal(null)}
                className="text-xs font-semibold text-gray-500 hover:text-black cursor-pointer"
              >
                Close Preview
              </button>
            </div>

            <div className="aspect-[16/9] rounded-xl overflow-hidden bg-gray-100">
              <img
                src={projectPreviewModal.coverImage}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>

            <h2 className="text-2xl font-serif-title font-bold text-[#063B27]">
              {projectPreviewModal.title}
            </h2>

            <div className="text-xs text-gray-500 flex gap-4">
              <span>{projectPreviewModal.category}</span>
              <span>·</span>
              <span>{projectPreviewModal.location}</span>
              <span>·</span>
              <span>{projectPreviewModal.date}</span>
            </div>

            <p className="text-sm text-[#17211C] leading-relaxed whitespace-pre-line">
              {projectPreviewModal.description}
            </p>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: ARTICLE EDITOR */}
      {/* ==================================================== */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5">
            <h3 className="text-xl font-bold text-[#063B27]">
              {isNewArticle ? 'Write New Press Release / Article' : 'Edit Article'}
            </h3>

            <form onSubmit={handleSaveArticle} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#17211C] uppercase mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={editingArticle.title || ''}
                  onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#17211C] uppercase mb-1">Category</label>
                  <input
                    type="text"
                    value={editingArticle.category || 'Media Release'}
                    onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#17211C] uppercase mb-1">Author</label>
                  <input
                    type="text"
                    value={editingArticle.author || 'Hon. Raphael Nnanna Igbokwe'}
                    onChange={(e) => setEditingArticle({ ...editingArticle, author: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#17211C] uppercase mb-1">Summary Excerpt</label>
                <textarea
                  rows={2}
                  value={editingArticle.summary || ''}
                  onChange={(e) => setEditingArticle({ ...editingArticle, summary: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-[#17211C] uppercase mb-1">Full Article Content *</label>
                <textarea
                  rows={8}
                  required
                  value={editingArticle.content || ''}
                  onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm leading-relaxed"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-[#17211C] uppercase mb-1">Cover Image URL</label>
                <div className="flex gap-3 items-center mb-2">
                  <input
                    type="text"
                    value={editingArticle.coverImage || ''}
                    onChange={(e) => setEditingArticle({ ...editingArticle, coverImage: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                    placeholder="https://... or /uploads/..."
                  />
                  {editingArticle.coverImage && (
                    <img
                      src={editingArticle.coverImage}
                      alt="Article Preview"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80';
                      }}
                      className="w-12 h-10 rounded-lg object-cover border border-gray-200 shadow-xs shrink-0"
                    />
                  )}
                </div>
                <ImageUploader
                  onUploadSuccess={(files) => {
                    if (files[0]) {
                      setEditingArticle({ ...editingArticle, coverImage: files[0].url });
                      showToast('Article image uploaded.');
                    }
                  }}
                  label="Upload Featured Photo"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingArticle.published !== false}
                    onChange={(e) => setEditingArticle({ ...editingArticle, published: e.target.checked })}
                    className="rounded text-[#0B5D3B]"
                  />
                  <span>Published (Live on Website)</span>
                </label>
                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingArticle.featured || false}
                    onChange={(e) => setEditingArticle({ ...editingArticle, featured: e.target.checked })}
                    className="rounded text-[#0B5D3B]"
                  />
                  <span>Feature on Homepage</span>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 rounded-lg bg-[#0B5D3B] text-white hover:bg-[#063B27] font-semibold cursor-pointer shadow-sm"
                >
                  Save & Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: PUBLICATION & DOCUMENT REPORT EDITOR */}
      {/* ==================================================== */}
      {editingPub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-serif-title font-bold text-[#063B27]">
                  {editingPub.id ? 'Edit Publication & Document Report' : 'Upload Publication & Document Report'}
                </h3>
                <p className="text-xs text-[#66736B]">
                  {editingPub.id
                    ? 'Modify report title, category, description, and attached document file.'
                    : 'Upload official policy blueprints, legislative scorecards, and public assessment dockets.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPub(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <XClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePublication} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#17211C] uppercase mb-1">
                  Document / Report Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingPub.title || ''}
                  onChange={(e) => setEditingPub({ ...editingPub, title: e.target.value })}
                  placeholder="e.g. Legislative Stewardship Report (7th & 8th National Assembly)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#17211C] uppercase mb-1">Category</label>
                  <select
                    value={editingPub.category || 'Legislative Report'}
                    onChange={(e) => setEditingPub({ ...editingPub, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white"
                  >
                    <option value="Legislative Report">Legislative Report</option>
                    <option value="Policy Brief">Policy Brief</option>
                    <option value="Development Assessment">Development Assessment</option>
                    <option value="Constituency Blueprint">Constituency Blueprint</option>
                    <option value="Parliamentary Gazette">Parliamentary Gazette</option>
                    <option value="Public Stewardship Report">Public Stewardship Report</option>
                    <option value="Whitepaper">Whitepaper</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#17211C] uppercase mb-1">Publication Date</label>
                  <input
                    type="date"
                    value={editingPub.publishedAt ? editingPub.publishedAt.slice(0, 10) : ''}
                    onChange={(e) =>
                      setEditingPub({
                        ...editingPub,
                        publishedAt: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : new Date().toISOString(),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#17211C] uppercase mb-1">Document Format / Type</label>
                  <input
                    type="text"
                    value={editingPub.fileType || 'PDF Document'}
                    onChange={(e) => setEditingPub({ ...editingPub, fileType: e.target.value })}
                    placeholder="e.g. PDF Document, Official Gazette, Executive Brief"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#17211C] uppercase mb-1">File Size or Page Count</label>
                  <input
                    type="text"
                    value={editingPub.fileSize || ''}
                    onChange={(e) => setEditingPub({ ...editingPub, fileSize: e.target.value })}
                    placeholder="e.g. 4.2 MB, 32 Pages, Official Gazette"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#17211C] uppercase mb-1">
                  Executive Summary / Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={editingPub.description || ''}
                  onChange={(e) => setEditingPub({ ...editingPub, description: e.target.value })}
                  placeholder="Provide an overview of the report's purpose, legislative milestones, or empirical findings..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm leading-relaxed focus:bg-white"
                ></textarea>
              </div>

              {/* Document File Attachment Section */}
              <div className="bg-[#F6F9F7] p-4 rounded-xl border border-emerald-900/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-[#063B27] uppercase">
                    Document File Attachment (PDF, DOCX)
                  </label>
                  {editingPub.fileUrl && editingPub.fileUrl !== '#' && (
                    <a
                      href={editingPub.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-[#0B5D3B] hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Test / View File</span>
                    </a>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] text-gray-500 font-medium">Document URL or Path:</span>
                  <input
                    type="text"
                    value={editingPub.fileUrl || ''}
                    onChange={(e) => setEditingPub({ ...editingPub, fileUrl: e.target.value })}
                    placeholder="https://... or /uploads/... (or upload directly below)"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm"
                  />
                </div>

                <div>
                  <span className="block text-[11px] text-[#063B27] font-bold uppercase mb-1">
                    Or Upload File from Computer:
                  </span>
                  <ImageUploader
                    accept=".pdf,.doc,.docx,application/pdf,application/msword"
                    label="Upload PDF or Document File (up to 10MB)"
                    onUploadSuccess={(files) => {
                      if (files[0]) {
                        setEditingPub({
                          ...editingPub,
                          fileUrl: files[0].url,
                          fileSize: files[0].size,
                          fileType: files[0].originalName.toLowerCase().endsWith('.pdf')
                            ? 'PDF Document'
                            : 'Document File',
                        });
                        showToast(`Uploaded file: ${files[0].originalName}`);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Cover / Thumbnail Image Section */}
              <div className="bg-[#F6F9F7] p-4 rounded-xl border border-emerald-900/10 space-y-3">
                <label className="block font-bold text-[#063B27] uppercase">
                  Cover Thumbnail Photo (Optional)
                </label>
                <div className="space-y-1.5">
                  <span className="text-[11px] text-gray-500 font-medium">Cover Image URL:</span>
                  <input
                    type="text"
                    value={editingPub.coverImage || ''}
                    onChange={(e) => setEditingPub({ ...editingPub, coverImage: e.target.value })}
                    placeholder="https://images.unsplash.com/... (or upload photo below)"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm"
                  />
                </div>

                {editingPub.coverImage && (
                  <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-200">
                    <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      <img
                        src={editingPub.coverImage}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                        onError={(e: any) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 truncate flex-1">
                      <p className="font-semibold text-[#17211C]">Current Thumbnail</p>
                      <p className="text-[11px] text-gray-500 truncate">{editingPub.coverImage}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingPub({ ...editingPub, coverImage: '' })}
                      className="text-xs text-red-600 hover:underline px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <div>
                  <span className="block text-[11px] text-[#063B27] font-bold uppercase mb-1">
                    Or Upload Cover Image:
                  </span>
                  <ImageUploader
                    label="Upload Cover Photo (JPG, PNG, WEBP up to 10MB)"
                    onUploadSuccess={(files) => {
                      if (files[0]) {
                        setEditingPub({ ...editingPub, coverImage: files[0].url });
                        showToast('Cover thumbnail uploaded.');
                      }
                    }}
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPub(null)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-6 py-2.5 rounded-xl bg-[#0B5D3B] text-white hover:bg-[#063B27] font-semibold cursor-pointer flex items-center gap-2 shadow-md"
                >
                  {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingPub.id ? 'Save Publication Changes' : 'Publish Document Report'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: CAREER TIMELINE EDITOR */}
      {/* ==================================================== */}
      {editingCareer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-xl font-serif-title font-bold text-[#063B27]">
                {editingCareer.id ? 'Edit Career Milestone' : 'Add Career Milestone'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCareer(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <XClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCareer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#17211C] uppercase mb-1">Tenure / Year *</label>
                  <input
                    type="text"
                    required
                    value={editingCareer.year || ''}
                    onChange={(e) => setEditingCareer({ ...editingCareer, year: e.target.value })}
                    placeholder="e.g. 2011 – 2019"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#17211C] uppercase mb-1">Display Order</label>
                  <input
                    type="number"
                    value={editingCareer.order || 1}
                    onChange={(e) => setEditingCareer({ ...editingCareer, order: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#17211C] uppercase mb-1">Role / Position Title *</label>
                <input
                  type="text"
                  required
                  value={editingCareer.title || ''}
                  onChange={(e) => setEditingCareer({ ...editingCareer, title: e.target.value })}
                  placeholder="e.g. Member, House of Representatives"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-[#17211C] uppercase mb-1">Institution / Body</label>
                <input
                  type="text"
                  value={editingCareer.institution || ''}
                  onChange={(e) => setEditingCareer({ ...editingCareer, institution: e.target.value })}
                  placeholder="e.g. National Assembly of Nigeria"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-[#17211C] uppercase mb-1">Description</label>
                <textarea
                  rows={4}
                  value={editingCareer.description || ''}
                  onChange={(e) => setEditingCareer({ ...editingCareer, description: e.target.value })}
                  placeholder="Key committee roles, legislative contributions, or mandates executed..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-[#17211C] uppercase mb-1">Verification / Gazette URL</label>
                <input
                  type="url"
                  value={editingCareer.sourceLink || ''}
                  onChange={(e) => setEditingCareer({ ...editingCareer, sourceLink: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-[#17211C] uppercase mb-1">Milestone Photograph / Image</label>
                <div className="flex gap-4 items-center mb-3">
                  <input
                    type="text"
                    value={editingCareer.imageUrl || ''}
                    onChange={(e) => setEditingCareer((prev) => prev ? ({ ...prev, imageUrl: e.target.value }) : null)}
                    placeholder="https://... or /images/..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#0B5D3B]"
                  />
                  {editingCareer.imageUrl && (
                    <img
                      src={editingCareer.imageUrl}
                      alt="Career Milestone Preview"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=400&q=80';
                      }}
                      className="w-14 h-14 rounded-xl object-cover border border-gray-200 shadow-xs shrink-0"
                    />
                  )}
                </div>
                <ImageUploader
                  onUploadSuccess={(files) => {
                    if (files && files[0]) {
                      setEditingCareer((prev) => prev ? ({ ...prev, imageUrl: files[0].url }) : null);
                      showToast('Career milestone image updated successfully.');
                    }
                  }}
                  label="Upload / Replace Career Milestone Photo"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCareer(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 rounded-lg bg-[#0B5D3B] text-white hover:bg-[#063B27] font-semibold cursor-pointer shadow-sm"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: EDUCATION CREDENTIAL EDITOR */}
      {/* ==================================================== */}
      {editingEdu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-xl font-serif-title font-bold text-[#063B27]">
                {editingEdu.id ? 'Edit Education Entry' : 'Add Education Entry'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingEdu(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <XClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdu} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#17211C] uppercase mb-1">Institution *</label>
                <input
                  type="text"
                  required
                  value={editingEdu.institution || ''}
                  onChange={(e) => setEditingEdu({ ...editingEdu, institution: e.target.value })}
                  placeholder="e.g. Enugu State University of Science and Technology"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#17211C] uppercase mb-1">Qualification *</label>
                  <input
                    type="text"
                    required
                    value={editingEdu.qualification || ''}
                    onChange={(e) => setEditingEdu({ ...editingEdu, qualification: e.target.value })}
                    placeholder="e.g. B.Sc."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#17211C] uppercase mb-1">Field / Discipline</label>
                  <input
                    type="text"
                    value={editingEdu.field || ''}
                    onChange={(e) => setEditingEdu({ ...editingEdu, field: e.target.value })}
                    placeholder="e.g. Banking and Finance"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#17211C] uppercase mb-1">Graduation Year</label>
                  <input
                    type="text"
                    value={editingEdu.year || ''}
                    onChange={(e) => setEditingEdu({ ...editingEdu, year: e.target.value })}
                    placeholder="e.g. 1998"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#17211C] uppercase mb-1">Display Order</label>
                  <input
                    type="number"
                    value={editingEdu.order || 1}
                    onChange={(e) => setEditingEdu({ ...editingEdu, order: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#17211C] uppercase mb-1">Description / Honors</label>
                <textarea
                  rows={3}
                  value={editingEdu.description || ''}
                  onChange={(e) => setEditingEdu({ ...editingEdu, description: e.target.value })}
                  placeholder="Academic distinctions, certifications, or focal study areas..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingEdu(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 rounded-lg bg-[#0B5D3B] text-white hover:bg-[#063B27] font-semibold cursor-pointer shadow-sm"
                >
                  Save Credential
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* GALLERY ITEM / PHOTO EDITOR MODAL */}
      {/* ==================================================== */}
      {editingGalleryItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-serif-title font-bold text-[#063B27]">
                  {isNewGalleryItem ? 'Add New Gallery Photograph' : 'Edit Photograph Details & Image'}
                </h3>
                <p className="text-xs text-[#66736B]">
                  Update image title, location, category, description, and upload or replace photo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingGalleryItem(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <XClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGalleryItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#17211C] uppercase mb-1">
                  Photograph Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingGalleryItem.title || ''}
                  onChange={(e) =>
                    setEditingGalleryItem((prev) => (prev ? { ...prev, title: e.target.value } : null))
                  }
                  placeholder="e.g. Constituency Stakeholders Engagement"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#0B5D3B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#17211C] uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={editingGalleryItem.category || 'Community Engagement'}
                    onChange={(e) =>
                      setEditingGalleryItem((prev) => (prev ? { ...prev, category: e.target.value } : null))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  >
                    <option value="Community Engagement">Community Engagement</option>
                    <option value="Legislative Sittings">Legislative Sittings</option>
                    <option value="Public Events">Public Events</option>
                    <option value="Youth Development">Youth Development</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="National Assembly">National Assembly</option>
                    <option value="General Leadership">General Leadership</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17211C] uppercase mb-1">
                    Date / Year
                  </label>
                  <input
                    type="text"
                    value={editingGalleryItem.date || ''}
                    onChange={(e) =>
                      setEditingGalleryItem((prev) => (prev ? { ...prev, date: e.target.value } : null))
                    }
                    placeholder="e.g. 2024 or October 2023"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17211C] uppercase mb-1">
                  Location / Community
                </label>
                <input
                  type="text"
                  value={editingGalleryItem.location || ''}
                  onChange={(e) =>
                    setEditingGalleryItem((prev) => (prev ? { ...prev, location: e.target.value } : null))
                  }
                  placeholder="e.g. Ahiazu Mbaise, Imo State"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17211C] uppercase mb-1">
                  Description / Caption (Optional)
                </label>
                <textarea
                  rows={3}
                  value={editingGalleryItem.description || ''}
                  onChange={(e) =>
                    setEditingGalleryItem((prev) => (prev ? { ...prev, description: e.target.value } : null))
                  }
                  placeholder="Provide context regarding this event, initiative, or engagement..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                />
              </div>

              {/* Photo Image Upload & URL */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-[#17211C] uppercase">
                  Photograph Image *
                </label>
                <div className="flex gap-4 items-center">
                  <input
                    type="text"
                    required
                    value={editingGalleryItem.imageUrl || ''}
                    onChange={(e) =>
                      setEditingGalleryItem((prev) => (prev ? { ...prev, imageUrl: e.target.value } : null))
                    }
                    placeholder="https://... or /uploads/..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#0B5D3B]"
                  />
                  {editingGalleryItem.imageUrl && (
                    <img
                      src={editingGalleryItem.imageUrl}
                      alt="Preview"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400&q=80';
                      }}
                      className="w-14 h-14 rounded-xl object-cover border border-gray-200 shadow-xs shrink-0"
                    />
                  )}
                </div>

                <ImageUploader
                  onUploadSuccess={(files) => {
                    if (files && files[0]) {
                      setEditingGalleryItem((prev) => (prev ? { ...prev, imageUrl: files[0].url } : null));
                      showToast('Photo uploaded successfully.');
                    }
                  }}
                  label="Upload / Replace Photograph"
                />
              </div>

              {/* Feature checkbox */}
              <div className="flex items-center gap-3 pt-2 p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                <input
                  type="checkbox"
                  id="featGallery"
                  checked={editingGalleryItem.featured || false}
                  onChange={(e) =>
                    setEditingGalleryItem((prev) => (prev ? { ...prev, featured: e.target.checked } : null))
                  }
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="featGallery" className="text-xs font-bold text-amber-950 cursor-pointer flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>Feature this photo prominently on the Photo Gallery showcase</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingGalleryItem(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 rounded-lg bg-[#0B5D3B] text-white hover:bg-[#063B27] font-semibold cursor-pointer shadow-sm text-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Photograph</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* HERO SHOWCASE SLIDE EDITOR MODAL */}
      {/* ==================================================== */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-serif-title font-bold text-[#063B27]">
                  {isNewSlide ? 'Add New Showcase Slide' : 'Edit Showcase Slide of Hon. Igbokwe'}
                </h3>
                <p className="text-xs text-[#66736B]">
                  Update this slide on the homepage leadership image carousel.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSlide(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <XClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHeroSlide} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#17211C] uppercase mb-1">
                  Slide Headline / Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingSlide.title || ''}
                  onChange={(e) =>
                    setEditingSlide((prev) => (prev ? { ...prev, title: e.target.value } : null))
                  }
                  placeholder="e.g. Constituency Town Hall & Civic Dialogue"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#0B5D3B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#17211C] uppercase mb-1">
                    Tag / Badge Category
                  </label>
                  <input
                    type="text"
                    value={editingSlide.tag || ''}
                    onChange={(e) =>
                      setEditingSlide((prev) => (prev ? { ...prev, tag: e.target.value } : null))
                    }
                    placeholder="e.g. Constituency Outreach, National Assembly"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17211C] uppercase mb-1">
                    Slide Order (1 to 8)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={editingSlide.order || 1}
                    onChange={(e) =>
                      setEditingSlide((prev) => (prev ? { ...prev, order: Number(e.target.value) } : null))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17211C] uppercase mb-1">
                  Slide Caption / Description
                </label>
                <textarea
                  rows={3}
                  value={editingSlide.caption || ''}
                  onChange={(e) =>
                    setEditingSlide((prev) => (prev ? { ...prev, caption: e.target.value } : null))
                  }
                  placeholder="Explain the leadership milestone, date, or impact..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                />
              </div>

              {/* Photo Image Upload & URL */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-[#17211C] uppercase">
                  Slide Photograph *
                </label>
                <div className="flex gap-4 items-center">
                  <input
                    type="text"
                    required
                    value={editingSlide.imageUrl || ''}
                    onChange={(e) =>
                      setEditingSlide((prev) => (prev ? { ...prev, imageUrl: e.target.value } : null))
                    }
                    placeholder="https://... or /uploads/..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#0B5D3B]"
                  />
                  {editingSlide.imageUrl && (
                    <img
                      src={editingSlide.imageUrl}
                      alt="Preview"
                      onError={(e) => {
                        const fallback =
                          (editingSlide.id && DEFAULT_FALLBACK_SLIDES[editingSlide.id]) ||
                          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';
                        if (e.currentTarget.src !== fallback) {
                          e.currentTarget.src = fallback;
                        }
                      }}
                      className="w-16 h-12 rounded-xl object-cover border border-gray-200 shadow-xs shrink-0"
                    />
                  )}
                </div>

                <ImageUploader
                  uploadEndpoint="/api/admin/hero/slides/upload"
                  onUploadSuccess={(files) => {
                    if (files && files[0]) {
                      setEditingSlide((prev) => (prev ? { ...prev, imageUrl: files[0].url } : null));
                      showToast('Slide photo uploaded successfully.');
                    }
                  }}
                  label="Upload / Replace Slide Photo from Device"
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingSlide(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 rounded-lg bg-[#0B5D3B] text-white hover:bg-[#063B27] font-semibold cursor-pointer shadow-sm text-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Slide</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DELETION MODAL */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
