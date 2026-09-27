export interface AdminUser {
  id: string;
  username: string;
  mustChangePassword?: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface SiteSettings {
  id: string;
  siteName: string;
  fullName: string;
  titleTag: string;
  subtitle: string;
  email: string;
  phone: string;
  address: string;
  officeLocation: string;
  footerText: string;
  copyright: string;
  primaryColor: string;
  secondaryColor: string;
  goldColor: string;
}

export interface HeroSlide {
  id: string;
  imageUrl: string;
  title: string;
  caption?: string;
  tag?: string;
  order: number;
}

export interface HeroContent {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  buttonOneText: string;
  buttonOneLink: string;
  buttonTwoText: string;
  buttonTwoLink: string;
  scrollIndicatorText: string;
  slides?: HeroSlide[];
}

export interface Biography {
  id: string;
  fullName: string;
  shortBio: string;
  fullBio: string;
  placeOfOrigin: string;
  constituency: string;
  educationSummary: string;
  professionalBackground: string;
  legislativeExperience: string;
  publicServiceExperience: string;
  communityInvolvement: string;
  imageUrl?: string;
  updatedAt: string;
}

export interface Education {
  id: string;
  institution: string;
  qualification: string;
  field: string;
  year: string;
  description: string;
  order: number;
}

export interface CareerTimeline {
  id: string;
  year: string;
  position: string;
  title: string;
  institution: string;
  description: string;
  imageUrl?: string;
  sourceLink?: string;
  order: number;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  category:
    | 'Education'
    | 'Infrastructure'
    | 'Youth Development'
    | 'Community Development'
    | 'Legislative Work'
    | 'Empowerment'
    | 'Health'
    | 'Social Development'
    | 'Other';
  location: string;
  date: string;
  description: string;
  publicServiceContext?: string;
  featured: boolean;
  status: 'Completed' | 'Ongoing' | 'Public Record';
  coverImage: string;
  additionalImages?: string[];
  documents?: { name: string; url: string }[];
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryImage {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  featured: boolean;
  fileSize?: string;
  dimensions?: string;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage: string;
  author: string;
  category: string;
  source: string;
  sourceUrl?: string;
  published: boolean;
  featured: boolean;
  publishedAt: string;
  createdAt: string;
}

export interface Publication {
  id: string;
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  coverImage?: string;
  fileSize?: string;
  fileType?: string;
  publishedAt: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface SocialLink {
  id: string;
  platform: 'Facebook' | 'X/Twitter' | 'Instagram' | 'YouTube' | 'LinkedIn' | 'WhatsApp' | 'Telegram' | string;
  url: string;
  icon: string;
  enabled: boolean;
  order: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  administrator: string;
  affectedItem: string;
  details?: string;
  timestamp: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalGalleryImages: number;
  totalArticles: number;
  totalPublications: number;
  totalMessages: number;
  unreadMessages: number;
}
