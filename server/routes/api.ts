import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { getDatabase, saveDatabase, logActivity } from '../db';
import { registerUploadedFile } from '../imageStore';
import {
  requireAuth,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
  generateToken,
  AuthenticatedRequest,
} from '../auth';
import {
  Project,
  CareerTimeline,
  Education,
  GalleryImage,
  Article,
  Publication,
  ContactMessage,
  SocialLink,
  SiteSettings,
  HeroContent,
  HeroSlide,
  Biography,
} from '../../src/types/index';

const router = express.Router();

// Upload configuration: ensure both local and persistent directories exist
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const PERSISTENT_UPLOADS_DIR = path.resolve(process.cwd(), 'data', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(PERSISTENT_UPLOADS_DIR)) {
  fs.mkdirSync(PERSISTENT_UPLOADS_DIR, { recursive: true });
}

export function syncUploadedFile(file: Express.Multer.File) {
  try {
    const dest = path.join(PERSISTENT_UPLOADS_DIR, file.filename);
    if (file.path && fs.existsSync(file.path)) {
      fs.copyFileSync(file.path, dest);
    }
    registerUploadedFile(file.filename, file.path, file.originalname, file.mimetype);
  } catch (err) {
    console.error('Failed to sync upload to persistent storage:', err);
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    cb(null, `${uniqueSuffix}_${cleanName}`);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/jfif',
    'image/pjpeg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (
    file.mimetype.startsWith('image/') ||
    allowedMimes.includes(file.mimetype) ||
    file.originalname.match(/\.(jfif|jpe?g|png|webp|gif|svg)$/i)
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: JPG, JFIF, PNG, WEBP, GIF, PDF, DOC, DOCX.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter,
});

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// ==========================================
// 1. PUBLIC ENDPOINTS
// ==========================================

// Aggregated public site data for initial page render
router.get('/site-data', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json({
    siteSettings: db.siteSettings,
    hero: db.hero,
    biography: db.biography,
    education: db.education.sort((a, b) => a.order - b.order),
    career: db.career.sort((a, b) => a.order - b.order),
    featuredProjects: db.projects.filter((p) => p.featured),
    projects: db.projects,
    gallery: db.gallery,
    articles: db.articles.filter((a) => a.published),
    publications: db.publications,
    socialLinks: db.socialLinks.filter((s) => s.enabled).sort((a, b) => a.order - b.order),
  });
});

// Projects
router.get('/projects', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.projects);
});

router.get('/projects/:slug', (req: Request, res: Response) => {
  const db = getDatabase();
  const project = db.projects.find((p) => p.slug === req.params.slug || p.id === req.params.slug);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json(project);
});

// Career
router.get('/career', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.career.sort((a, b) => a.order - b.order));
});

// Education
router.get('/education', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.education.sort((a, b) => a.order - b.order));
});

// Gallery
router.get('/gallery', (req: Request, res: Response) => {
  const db = getDatabase();
  const category = req.query.category as string;
  if (category && category !== 'All') {
    res.json(db.gallery.filter((g) => g.category.toLowerCase() === category.toLowerCase()));
  } else {
    res.json(db.gallery);
  }
});

// Media / Articles
router.get('/articles', (req: Request, res: Response) => {
  const db = getDatabase();
  const category = req.query.category as string;
  let articles = db.articles.filter((a) => a.published);
  if (category && category !== 'All') {
    articles = articles.filter((a) => a.category.toLowerCase() === category.toLowerCase());
  }
  res.json(articles);
});

router.get('/articles/:slug', (req: Request, res: Response) => {
  const db = getDatabase();
  const article = db.articles.find((a) => a.slug === req.params.slug || a.id === req.params.slug);
  if (!article) {
    res.status(404).json({ error: 'Article not found' });
    return;
  }
  res.json(article);
});

// Publications
router.get('/publications', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.publications);
});

// Global Site Search
router.get('/search', (req: Request, res: Response) => {
  const query = ((req.query.q as string) || '').toLowerCase().trim();
  if (!query) {
    res.json({ projects: [], articles: [], publications: [], gallery: [] });
    return;
  }

  const db = getDatabase();
  const projects = db.projects.filter(
    (p) =>
      p.title.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.location.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
  );

  const articles = db.articles.filter(
    (a) =>
      a.published &&
      (a.title.toLowerCase().includes(query) ||
        a.summary.toLowerCase().includes(query) ||
        a.content.toLowerCase().includes(query) ||
        a.category.toLowerCase().includes(query))
  );

  const publications = db.publications.filter(
    (pub) =>
      pub.title.toLowerCase().includes(query) ||
      pub.description.toLowerCase().includes(query) ||
      pub.category.toLowerCase().includes(query)
  );

  const gallery = db.gallery.filter(
    (g) =>
      g.title.toLowerCase().includes(query) ||
      g.description.toLowerCase().includes(query) ||
      g.location.toLowerCase().includes(query) ||
      g.category.toLowerCase().includes(query)
  );

  res.json({ projects, articles, publications, gallery });
});

// Contact message submission
router.post('/contact', (req: Request, res: Response) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !message) {
    res.status(400).json({ error: 'Please provide your name, valid email, and message.' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }

  const db = getDatabase();
  const newMessage: ContactMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim().slice(0, 100),
    email: email.trim().toLowerCase().slice(0, 100),
    phone: phone ? phone.trim().slice(0, 30) : undefined,
    subject: (subject || 'General Inquiry').trim().slice(0, 150),
    message: message.trim().slice(0, 3000),
    read: false,
    createdAt: new Date().toISOString(),
  };

  db.messages.unshift(newMessage);
  saveDatabase(db);

  res.status(201).json({
    success: true,
    message: 'Thank you. Your message has been received securely.',
  });
});

// Direct Hero Portrait Upload (allows uploading portrait directly from UI)
router.post(
  '/hero/upload-image',
  (req: Request, res: Response, next: NextFunction) => {
    upload.any()(req, res, (err) => {
      if (err) {
        if ((err as any).code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Image exceeds 50 MB limit.' });
        }
        return res.status(400).json({ error: err.message || 'Image upload failed.' });
      }
      next();
    });
  },
  (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0 && (req as any).file) {
      files.push((req as any).file);
    }
    const file = files[0];
    if (!file) {
      res.status(400).json({ error: 'No image file uploaded.' });
      return;
    }

    const db = getDatabase();
    const imageUrl = `/uploads/${file.filename}`;
    db.hero.imageUrl = imageUrl;
    saveDatabase(db);
    logActivity('hero_portrait_updated', 'User/Admin', 'Homepage Hero', `Updated hero portrait to ${file.originalname}`);

    res.json({
      success: true,
      message: 'Hero portrait updated successfully.',
      imageUrl,
      hero: db.hero,
    });
  }
);

// Direct Hero Portrait URL update
router.put('/hero/image-url', (req: Request, res: Response) => {
  const { imageUrl } = req.body;
  if (!imageUrl || typeof imageUrl !== 'string') {
    res.status(400).json({ error: 'Please provide a valid image URL.' });
    return;
  }

  const db = getDatabase();
  db.hero.imageUrl = imageUrl.trim();
  saveDatabase(db);
  logActivity('hero_portrait_url_updated', 'User/Admin', 'Homepage Hero', `Updated hero portrait URL to ${imageUrl.trim()}`);

  res.json({
    success: true,
    message: 'Hero portrait URL updated successfully.',
    imageUrl: db.hero.imageUrl,
    hero: db.hero,
  });
});

// ==========================================
// 2. AUTHENTICATION ENDPOINTS
// ==========================================

router.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const rateLimitKey = `${ip}_${username || 'anon'}`;

  // Check rate limiting
  const rateCheck = checkLoginRateLimit(rateLimitKey);
  if (!rateCheck.allowed) {
    res.status(429).json({
      error: `Too many failed login attempts. Please wait ${rateCheck.waitMinutes} minute(s) before trying again.`,
    });
    return;
  }

  if (!username || !password) {
    recordFailedLogin(rateLimitKey);
    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }

  const db = getDatabase();
  const user = db.adminUsers.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());

  if (!user) {
    recordFailedLogin(rateLimitKey);
    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }

  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isPasswordValid) {
    recordFailedLogin(rateLimitKey);
    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }

  // Clear rate limits on success
  clearLoginAttempts(rateLimitKey);

  // Update last login
  user.lastLogin = new Date().toISOString();
  saveDatabase(db);

  logActivity('login', user.username, 'Administration Portal', 'Administrator logged in successfully.');

  const token = generateToken({
    userId: user.id,
    username: user.username,
  });

  // Set HTTP-only cookie
  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      mustChangePassword: user.mustChangePassword ?? false,
      lastLogin: user.lastLogin,
    },
  });
});

// Secret direct login endpoint (bypass public admin login page)
router.get('/auth/secret-direct-login', (req: Request, res: Response) => {
  const key = req.query.key as string;
  if (key !== 'igbokwe_admin_2026_secret') {
    return res.status(403).json({ error: 'Invalid secret key.' });
  }
  const db = getDatabase();
  const user = db.adminUsers[0];
  if (!user) {
    return res.status(404).json({ error: 'Admin user not found.' });
  }
  const token = generateToken({
    userId: user.id,
    username: user.username,
  });
  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      mustChangePassword: user.mustChangePassword ?? false,
    },
  });
});

router.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const user = db.adminUsers.find((u) => u.id === req.user?.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    mustChangePassword: user.mustChangePassword ?? false,
    lastLogin: user.lastLogin,
  });
});

router.post('/auth/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  logActivity('logout', req.user?.username || 'Admin', 'Administration Portal', 'User logged out.');
  res.clearCookie('admin_token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

router.post('/auth/change-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Please provide both current and new password.' });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    return;
  }

  const db = getDatabase();
  const user = db.adminUsers.find((u) => u.id === req.user?.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const isCurrentValid = bcrypt.compareSync(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    res.status(400).json({ error: 'Current password does not match our records.' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  user.passwordHash = bcrypt.hashSync(newPassword, salt);
  user.mustChangePassword = false;
  user.updatedAt = new Date().toISOString();

  saveDatabase(db);
  logActivity('password_changed', user.username, 'Admin Account', 'Password updated successfully.');

  const token = generateToken({
    userId: user.id,
    username: user.username,
  });

  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    message: 'Password changed successfully.',
    token,
    user: {
      id: user.id,
      username: user.username,
      mustChangePassword: user.mustChangePassword ?? false,
      lastLogin: user.lastLogin,
    },
  });
});

// Update Administrative Username
router.post('/auth/change-username', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { newUsername, currentPassword } = req.body;
  if (!newUsername || !currentPassword) {
    res.status(400).json({ error: 'Please provide both your new username and current password.' });
    return;
  }

  const cleanUsername = String(newUsername).trim();
  if (cleanUsername.length < 3 || cleanUsername.length > 40) {
    res.status(400).json({ error: 'Username must be between 3 and 40 characters long.' });
    return;
  }

  if (!/^[a-zA-Z0-9._@-]+$/.test(cleanUsername)) {
    res.status(400).json({
      error: 'Username can only contain letters, numbers, underscores, hyphens, periods, and @ symbols.',
    });
    return;
  }

  const db = getDatabase();
  const user = db.adminUsers.find((u) => u.id === req.user?.userId);
  if (!user) {
    res.status(404).json({ error: 'Admin account not found.' });
    return;
  }

  if (user.username.toLowerCase() === cleanUsername.toLowerCase()) {
    res.status(400).json({ error: 'New username must be different from your current username.' });
    return;
  }

  const isTaken = db.adminUsers.some(
    (u) => u.id !== user.id && u.username.toLowerCase() === cleanUsername.toLowerCase()
  );
  if (isTaken) {
    res.status(400).json({ error: `The username "${cleanUsername}" is already taken by another account.` });
    return;
  }

  const isCurrentValid = bcrypt.compareSync(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    res.status(400).json({ error: 'Current password does not match our records.' });
    return;
  }

  const oldUsername = user.username;
  user.username = cleanUsername;
  user.updatedAt = new Date().toISOString();

  saveDatabase(db);
  logActivity(
    'username_changed',
    user.username,
    'Admin Account',
    `Administrator username changed from "${oldUsername}" to "${cleanUsername}".`
  );

  const newToken = generateToken({
    userId: user.id,
    username: user.username,
  });

  res.cookie('admin_token', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    message: `Username updated from "${oldUsername}" to "${cleanUsername}" successfully.`,
    token: newToken,
    user: {
      id: user.id,
      username: user.username,
      mustChangePassword: user.mustChangePassword ?? false,
      lastLogin: user.lastLogin,
    },
  });
});

// Update Administrative Credentials (Both or Either)
router.post('/auth/update-credentials', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { newUsername, newPassword, currentPassword } = req.body;
  if (!currentPassword) {
    res.status(400).json({ error: 'Current password is required to verify identity.' });
    return;
  }

  const db = getDatabase();
  const user = db.adminUsers.find((u) => u.id === req.user?.userId);
  if (!user) {
    res.status(404).json({ error: 'Admin account not found.' });
    return;
  }

  const isCurrentValid = bcrypt.compareSync(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    res.status(400).json({ error: 'Current password does not match our records.' });
    return;
  }

  let usernameChanged = false;
  let passwordChanged = false;
  const oldUsername = user.username;

  if (newUsername && newUsername.trim()) {
    const cleanUsername = String(newUsername).trim();
    if (cleanUsername.length < 3 || cleanUsername.length > 40) {
      res.status(400).json({ error: 'Username must be between 3 and 40 characters long.' });
      return;
    }
    if (!/^[a-zA-Z0-9._@-]+$/.test(cleanUsername)) {
      res.status(400).json({
        error: 'Username can only contain letters, numbers, underscores, hyphens, periods, and @ symbols.',
      });
      return;
    }
    if (cleanUsername.toLowerCase() !== user.username.toLowerCase()) {
      const isTaken = db.adminUsers.some(
        (u) => u.id !== user.id && u.username.toLowerCase() === cleanUsername.toLowerCase()
      );
      if (isTaken) {
        res.status(400).json({ error: `The username "${cleanUsername}" is already taken.` });
        return;
      }
      user.username = cleanUsername;
      usernameChanged = true;
    }
  }

  if (newPassword && newPassword.trim()) {
    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      return;
    }
    const salt = bcrypt.genSaltSync(10);
    user.passwordHash = bcrypt.hashSync(newPassword, salt);
    user.mustChangePassword = false;
    passwordChanged = true;
  }

  if (!usernameChanged && !passwordChanged) {
    res.status(400).json({ error: 'No changes were specified. Provide a new username or new password.' });
    return;
  }

  user.updatedAt = new Date().toISOString();
  saveDatabase(db);

  const changesList = [];
  if (usernameChanged) changesList.push(`Username updated to "${user.username}"`);
  if (passwordChanged) changesList.push('Password updated');
  logActivity('credentials_updated', user.username, 'Admin Account', changesList.join(' and '));

  const newToken = generateToken({
    userId: user.id,
    username: user.username,
  });

  res.cookie('admin_token', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    message: `${changesList.join(' and ')} successfully.`,
    token: newToken,
    user: {
      id: user.id,
      username: user.username,
      mustChangePassword: user.mustChangePassword ?? false,
      lastLogin: user.lastLogin,
    },
  });
});

// ==========================================
// 3. ADMIN CMS PROTECTED ENDPOINTS
// ==========================================

// Dashboard stats
router.get('/admin/stats', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  res.json({
    totalProjects: db.projects.length,
    totalGalleryImages: db.gallery.length,
    totalArticles: db.articles.length,
    totalPublications: db.publications.length,
    totalMessages: db.messages.length,
    unreadMessages: db.messages.filter((m) => !m.read).length,
    recentProjects: db.projects.slice(0, 5),
    recentArticles: db.articles.slice(0, 5),
    recentMessages: db.messages.slice(0, 5),
    recentUploads: db.gallery.slice(0, 5),
  });
});

// Activity logs
router.get('/admin/activity-logs', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  res.json(db.activityLogs);
});

// File upload endpoint (supports drag & drop, multiple files, any field name)
router.post(
  '/admin/upload',
  requireAuth,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    upload.any()(req, res, (err) => {
      if (err) {
        if ((err as any).code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'File size exceeds 50 MB limit.' });
          return;
        }
        res.status(400).json({ error: err.message || 'File upload failed.' });
        return;
      }
      next();
    });
  },
  (req: AuthenticatedRequest, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0 && (req as any).file) {
      files.push((req as any).file);
    }
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files provided for upload.' });
      return;
    }

    files.forEach(syncUploadedFile);

    const uploaded = files.map((file) => {
      const url = `/uploads/${file.filename}`;
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      return {
        url,
        filename: file.filename,
        originalName: file.originalname,
        size: sizeMB,
        mimetype: file.mimetype,
      };
    });

    logActivity(
      'image_uploaded',
      req.user?.username || 'Admin',
      'Media Library',
      `Uploaded ${uploaded.length} file(s): ${uploaded.map((u) => u.filename).join(', ')}`
    );

    res.json({
      success: true,
      message: 'Image uploaded successfully.',
      imageUrl: uploaded[0]?.url,
      files: uploaded,
    });
  }
);

// Site Settings
router.put('/admin/site-settings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  db.siteSettings = { ...db.siteSettings, ...req.body };
  saveDatabase(db);
  logActivity('settings_changed', req.user?.username || 'Admin', 'Site Settings', 'Site settings updated.');
  res.json({ success: true, siteSettings: db.siteSettings });
});

// Hero Content
router.put('/admin/hero', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  db.hero = { ...db.hero, ...req.body };
  saveDatabase(db);
  logActivity('hero_updated', req.user?.username || 'Admin', 'Homepage Hero', 'Hero text and image updated.');
  res.json({ success: true, hero: db.hero });
});

// Dedicated Hero Portrait update (immediate auto-save upon upload)
router.post('/admin/hero/portrait', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { imageUrl } = req.body;
  if (!imageUrl || typeof imageUrl !== 'string') {
    return res.status(400).json({ error: 'Valid imageUrl is required.' });
  }
  const db = getDatabase();
  db.hero.imageUrl = imageUrl;
  saveDatabase(db);
  logActivity('hero_updated', req.user?.username || 'Admin', 'Homepage Hero Portrait', `Updated hero portrait to ${imageUrl}`);
  return res.json({ success: true, hero: db.hero });
});

// Hero Slides CRUD
router.put('/admin/hero/slides', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { slides } = req.body;
  if (!Array.isArray(slides)) {
    res.status(400).json({ error: 'Slides must be an array.' });
    return;
  }
  const db = getDatabase();
  db.hero.slides = slides;
  saveDatabase(db);
  logActivity('hero_slides_updated', req.user?.username || 'Admin', 'Homepage Hero', `Updated showcase slides (${slides.length} slides)`);
  res.json({ success: true, slides: db.hero.slides });
});

router.post('/admin/hero/slides', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { imageUrl, title, caption, tag, order } = req.body;
  if (!imageUrl || !title) {
    res.status(400).json({ error: 'Image URL and title are required for slide.' });
    return;
  }
  const db = getDatabase();
  if (!db.hero.slides) db.hero.slides = [];
  const newSlide: HeroSlide = {
    id: `slide_${Date.now()}`,
    imageUrl,
    title,
    caption: caption || '',
    tag: tag || 'Leadership & Service',
    order: Number(order) || (db.hero.slides.length + 1),
  };
  db.hero.slides.push(newSlide);
  saveDatabase(db);
  logActivity('hero_slide_added', req.user?.username || 'Admin', 'Homepage Hero', `Added slide: ${title}`);
  res.status(201).json({ success: true, slide: newSlide, slides: db.hero.slides });
});

router.put('/admin/hero/slides/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  if (!db.hero.slides) db.hero.slides = [];
  const index = db.hero.slides.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Slide not found' });
    return;
  }
  db.hero.slides[index] = {
    ...db.hero.slides[index],
    ...req.body,
    order: req.body.order !== undefined ? Number(req.body.order) : db.hero.slides[index].order,
  };
  saveDatabase(db);
  logActivity('hero_slide_edited', req.user?.username || 'Admin', 'Homepage Hero', `Updated slide: ${db.hero.slides[index].title}`);
  res.json({ success: true, slide: db.hero.slides[index], slides: db.hero.slides });
});

router.delete('/admin/hero/slides/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  if (!db.hero.slides) db.hero.slides = [];
  const slide = db.hero.slides.find((s) => s.id === req.params.id);
  db.hero.slides = db.hero.slides.filter((s) => s.id !== req.params.id);
  saveDatabase(db);
  logActivity('hero_slide_deleted', req.user?.username || 'Admin', 'Homepage Hero', `Deleted slide: ${slide?.title || req.params.id}`);
  res.json({ success: true, slides: db.hero.slides });
});

// Dedicated Hero Slide Image Upload
router.post(
  '/admin/hero/slides/upload',
  requireAuth,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    upload.any()(req, res, (err) => {
      if (err) {
        if ((err as any).code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Image exceeds 50 MB limit.' });
        }
        return res.status(400).json({ error: err.message || 'File upload failed.' });
      }
      next();
    });
  },
  (req: AuthenticatedRequest, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0 && (req as any).file) {
      files.push((req as any).file);
    }
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }
    files.forEach(syncUploadedFile);
    const file = files[0];
    const imageUrl = `/uploads/${file.filename}`;
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

    logActivity('slide_image_uploaded', req.user?.username || 'Admin', 'Homepage Hero', `Uploaded slide image: ${file.originalname}`);

    return res.json({
      success: true,
      message: 'Slide photo uploaded successfully.',
      imageUrl,
      url: imageUrl,
      files: [
        {
          url: imageUrl,
          filename: file.filename,
          originalName: file.originalname,
          size: sizeMB,
          mimetype: file.mimetype,
        },
      ],
    });
  }
);

// Upload directly to replace image on an existing slide ID
router.post(
  '/admin/hero/slides/:id/upload',
  requireAuth,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    upload.any()(req, res, (err) => {
      if (err) {
        if ((err as any).code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Image exceeds 50 MB limit.' });
        }
        return res.status(400).json({ error: err.message || 'File upload failed.' });
      }
      next();
    });
  },
  (req: AuthenticatedRequest, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0 && (req as any).file) {
      files.push((req as any).file);
    }
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }
    files.forEach(syncUploadedFile);
    const db = getDatabase();
    if (!db.hero.slides) db.hero.slides = [];
    const slide = db.hero.slides.find((s) => s.id === req.params.id);
    if (!slide) {
      return res.status(404).json({ error: 'Slide not found.' });
    }
    const file = files[0];
    const imageUrl = `/uploads/${file.filename}`;
    slide.imageUrl = imageUrl;
    saveDatabase(db);
    logActivity('hero_slide_edited', req.user?.username || 'Admin', 'Homepage Hero', `Updated photograph for slide: ${slide.title}`);
    return res.json({
      success: true,
      message: 'Slide photograph updated successfully.',
      imageUrl,
      slide,
      slides: db.hero.slides,
    });
  }
);

// Biography Content
router.put('/admin/biography', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  db.biography = {
    ...db.biography,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  saveDatabase(db);
  logActivity('biography_updated', req.user?.username || 'Admin', 'About Hon. Igbokwe', 'Biography fields updated.');
  res.json({ success: true, biography: db.biography });
});

// Career Timeline CRUD
router.post('/admin/career', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { year, title, position, institution, organization, description, imageUrl, sourceLink, order } = req.body;
  const careerTitle = title || position;
  if (!year || !careerTitle) {
    res.status(400).json({ error: 'Year and title are required.' });
    return;
  }

  const db = getDatabase();
  const newItem: CareerTimeline = {
    id: `career_${Date.now()}`,
    year,
    title: careerTitle,
    position: careerTitle,
    institution: institution || organization || 'Public Record',
    description: description || 'Information to be updated.',
    imageUrl: imageUrl || '',
    sourceLink: sourceLink || '',
    order: Number(order) || db.career.length + 1,
  };

  db.career.push(newItem);
  saveDatabase(db);
  logActivity('career_created', req.user?.username || 'Admin', 'Career Timeline', `Added career item: ${careerTitle}`);
  res.status(201).json({ success: true, item: newItem });
});

router.put('/admin/career/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const index = db.career.findIndex((c) => c.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Career item not found' });
    return;
  }

  db.career[index] = { ...db.career[index], ...req.body };
  saveDatabase(db);
  logActivity('career_edited', req.user?.username || 'Admin', 'Career Timeline', `Updated: ${db.career[index].title}`);
  res.json({ success: true, item: db.career[index] });
});

router.delete('/admin/career/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const item = db.career.find((c) => c.id === req.params.id);
  db.career = db.career.filter((c) => c.id !== req.params.id);
  saveDatabase(db);
  logActivity('career_deleted', req.user?.username || 'Admin', 'Career Timeline', `Deleted: ${item?.title || req.params.id}`);
  res.json({ success: true, message: 'Career item deleted successfully.' });
});

// Education CRUD
router.post('/admin/education', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { institution, qualification, field, year, description, order } = req.body;
  if (!institution || !qualification) {
    res.status(400).json({ error: 'Institution and qualification are required.' });
    return;
  }

  const db = getDatabase();
  const newItem: Education = {
    id: `edu_${Date.now()}`,
    institution,
    qualification,
    field: field || 'General',
    year: year || 'Public Record',
    description: description || 'Information to be updated.',
    order: Number(order) || db.education.length + 1,
  };

  db.education.push(newItem);
  saveDatabase(db);
  logActivity('education_created', req.user?.username || 'Admin', 'Education', `Added education item: ${institution}`);
  res.status(201).json({ success: true, item: newItem });
});

router.put('/admin/education/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const index = db.education.findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Education item not found' });
    return;
  }

  db.education[index] = { ...db.education[index], ...req.body };
  saveDatabase(db);
  logActivity('education_edited', req.user?.username || 'Admin', 'Education', `Updated education: ${db.education[index].institution}`);
  res.json({ success: true, item: db.education[index] });
});

router.delete('/admin/education/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const item = db.education.find((e) => e.id === req.params.id);
  db.education = db.education.filter((e) => e.id !== req.params.id);
  saveDatabase(db);
  logActivity('education_deleted', req.user?.username || 'Admin', 'Education', `Deleted education: ${item?.institution || req.params.id}`);
  res.json({ success: true, message: 'Education item deleted successfully.' });
});

// Projects / Works CRUD
router.post('/admin/projects', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { title, category, location, date, description, publicServiceContext, featured, status, coverImage, additionalImages, sourceUrl } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Project title is required.' });
    return;
  }

  const db = getDatabase();
  const slug = slugify(title) + '-' + Math.random().toString(36).substring(2, 6);
  const newProject: Project = {
    id: `proj_${Date.now()}`,
    title,
    slug,
    category: category || 'Community Development',
    location: location || 'Imo State, Nigeria',
    date: date || 'Recent',
    description: description || 'Information to be updated.',
    publicServiceContext: publicServiceContext || '',
    featured: Boolean(featured),
    status: status || 'Completed',
    coverImage: coverImage || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1000&q=80',
    additionalImages: additionalImages || [],
    sourceUrl: sourceUrl || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.projects.unshift(newProject);
  saveDatabase(db);
  logActivity('project_created', req.user?.username || 'Admin', 'Works / Projects', `Created: ${title}`);
  res.status(201).json({ success: true, message: 'Project published successfully.', project: newProject });
});

router.put('/admin/projects/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const index = db.projects.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const updatedFeatured = req.body.featured !== undefined
    ? (req.body.featured === true || req.body.featured === 'true' || Boolean(req.body.featured))
    : db.projects[index].featured;

  db.projects[index] = {
    ...db.projects[index],
    ...req.body,
    featured: updatedFeatured,
    updatedAt: new Date().toISOString(),
  };
  saveDatabase(db);
  logActivity('project_edited', req.user?.username || 'Admin', 'Works / Projects', `Updated: ${db.projects[index].title}`);
  res.json({ success: true, message: 'Project updated successfully.', project: db.projects[index] });
});

router.patch('/admin/projects/:id/feature', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const index = db.projects.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  const nextFeatured = req.body.featured !== undefined 
    ? Boolean(req.body.featured) 
    : !db.projects[index].featured;
  db.projects[index].featured = nextFeatured;
  db.projects[index].updatedAt = new Date().toISOString();
  saveDatabase(db);
  logActivity('project_feature_toggled', req.user?.username || 'Admin', 'Works / Projects', `${nextFeatured ? 'Featured' : 'Unfeatured'}: ${db.projects[index].title}`);
  res.json({ success: true, featured: nextFeatured, project: db.projects[index] });
});

router.patch('/admin/projects/:id/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  if (!status) {
    res.status(400).json({ error: 'Status is required' });
    return;
  }
  const db = getDatabase();
  const index = db.projects.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  db.projects[index].status = status;
  db.projects[index].updatedAt = new Date().toISOString();
  saveDatabase(db);
  logActivity('project_status_updated', req.user?.username || 'Admin', 'Works / Projects', `Updated status to ${status}: ${db.projects[index].title}`);
  res.json({ success: true, status, project: db.projects[index] });
});

router.patch('/admin/projects/:id/image', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    res.status(400).json({ error: 'Image URL is required' });
    return;
  }
  const db = getDatabase();
  const index = db.projects.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  db.projects[index].coverImage = imageUrl;
  db.projects[index].updatedAt = new Date().toISOString();
  saveDatabase(db);
  logActivity('project_image_updated', req.user?.username || 'Admin', 'Works / Projects', `Updated cover photo: ${db.projects[index].title}`);
  res.json({ success: true, project: db.projects[index] });
});

router.delete('/admin/projects/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const proj = db.projects.find((p) => p.id === req.params.id);
  db.projects = db.projects.filter((p) => p.id !== req.params.id);
  saveDatabase(db);
  logActivity('project_deleted', req.user?.username || 'Admin', 'Works / Projects', `Deleted: ${proj?.title || req.params.id}`);
  res.json({ success: true, message: 'Project deleted successfully.' });
});

// Gallery CRUD
router.post('/admin/gallery', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { imageUrl, title, description, category, location, date, featured } = req.body;
  if (!imageUrl || !title) {
    res.status(400).json({ error: 'Image URL and title are required.' });
    return;
  }

  const db = getDatabase();
  const newImage: GalleryImage = {
    id: `gal_${Date.now()}`,
    imageUrl,
    title,
    description: description || '',
    category: category || 'Public Events',
    location: location || 'Imo State, Nigeria',
    date: date || 'Recent',
    featured: Boolean(featured),
    fileSize: 'Optimized',
    createdAt: new Date().toISOString(),
  };

  db.gallery.unshift(newImage);
  saveDatabase(db);
  logActivity('image_uploaded', req.user?.username || 'Admin', 'Gallery', `Added gallery image: ${title}`);
  res.status(201).json({ success: true, message: 'Image added to gallery.', image: newImage });
});

router.put('/admin/gallery/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const index = db.gallery.findIndex((g) => g.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Image not found' });
    return;
  }

  const updatedFeatured = req.body.featured !== undefined
    ? (req.body.featured === true || req.body.featured === 'true' || Boolean(req.body.featured))
    : db.gallery[index].featured;

  db.gallery[index] = { 
    ...db.gallery[index], 
    ...req.body,
    featured: updatedFeatured,
  };
  saveDatabase(db);
  logActivity('image_edited', req.user?.username || 'Admin', 'Gallery', `Updated image info: ${db.gallery[index].title}`);
  res.json({ success: true, image: db.gallery[index] });
});

router.patch('/admin/gallery/:id/feature', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const index = db.gallery.findIndex((g) => g.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Image not found' });
    return;
  }
  const nextFeatured = req.body.featured !== undefined ? Boolean(req.body.featured) : !db.gallery[index].featured;
  db.gallery[index].featured = nextFeatured;
  saveDatabase(db);
  logActivity('gallery_feature_toggled', req.user?.username || 'Admin', 'Gallery', `${nextFeatured ? 'Featured' : 'Unfeatured'}: ${db.gallery[index].title}`);
  res.json({ success: true, featured: nextFeatured, image: db.gallery[index] });
});

router.delete('/admin/gallery/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const img = db.gallery.find((g) => g.id === req.params.id);
  db.gallery = db.gallery.filter((g) => g.id !== req.params.id);
  saveDatabase(db);
  logActivity('image_deleted', req.user?.username || 'Admin', 'Gallery', `Deleted image: ${img?.title || req.params.id}`);
  res.json({ success: true, message: 'Image deleted successfully.' });
});

// Articles CRUD
router.post('/admin/articles', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { title, summary, content, coverImage, author, category, source, sourceUrl, published, featured } = req.body;
  if (!title || !content) {
    res.status(400).json({ error: 'Title and article content are required.' });
    return;
  }

  const db = getDatabase();
  const slug = slugify(title) + '-' + Math.random().toString(36).substring(2, 6);
  const newArticle: Article = {
    id: `art_${Date.now()}`,
    title,
    slug,
    summary: summary || title,
    content,
    coverImage: coverImage || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1000&q=80',
    author: author || 'Hon. Raphael Nnanna Igbokwe',
    category: category || 'Media Release',
    source: source || 'Press Office',
    sourceUrl: sourceUrl || '',
    published: published !== false,
    featured: Boolean(featured),
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  db.articles.unshift(newArticle);
  saveDatabase(db);
  logActivity('article_created', req.user?.username || 'Admin', 'Media & Articles', `Published article: ${title}`);
  res.status(201).json({ success: true, message: 'Article published successfully.', article: newArticle });
});

router.put('/admin/articles/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const index = db.articles.findIndex((a) => a.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Article not found' });
    return;
  }

  db.articles[index] = { ...db.articles[index], ...req.body };
  saveDatabase(db);
  logActivity('article_edited', req.user?.username || 'Admin', 'Media & Articles', `Updated article: ${db.articles[index].title}`);
  res.json({ success: true, message: 'Article updated successfully.', article: db.articles[index] });
});

router.delete('/admin/articles/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const art = db.articles.find((a) => a.id === req.params.id);
  db.articles = db.articles.filter((a) => a.id !== req.params.id);
  saveDatabase(db);
  logActivity('article_deleted', req.user?.username || 'Admin', 'Media & Articles', `Deleted article: ${art?.title || req.params.id}`);
  res.json({ success: true, message: 'Article deleted successfully.' });
});

// Publications CRUD
router.post('/admin/publications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { title, description, category, fileUrl, coverImage, fileType, fileSize, publishedAt } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Title is required.' });
    return;
  }

  const db = getDatabase();
  const newPub: Publication = {
    id: `pub_${Date.now()}`,
    title,
    description: description || 'Information to be updated.',
    category: category || 'Legislative Brief',
    fileUrl: fileUrl || '#',
    coverImage: coverImage || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
    fileSize: fileSize || 'PDF Document',
    fileType: fileType || 'PDF',
    publishedAt: publishedAt || new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  db.publications.unshift(newPub);
  saveDatabase(db);
  logActivity('publication_created', req.user?.username || 'Admin', 'Publications', `Added publication: ${title}`);
  res.status(201).json({ success: true, publication: newPub });
});

router.put('/admin/publications/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const index = db.publications.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Publication not found' });
    return;
  }

  db.publications[index] = { ...db.publications[index], ...req.body };
  saveDatabase(db);
  logActivity('publication_edited', req.user?.username || 'Admin', 'Publications', `Updated: ${db.publications[index].title}`);
  res.json({ success: true, publication: db.publications[index] });
});

router.delete('/admin/publications/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const pub = db.publications.find((p) => p.id === req.params.id);
  db.publications = db.publications.filter((p) => p.id !== req.params.id);
  saveDatabase(db);
  logActivity('publication_deleted', req.user?.username || 'Admin', 'Publications', `Deleted: ${pub?.title || req.params.id}`);
  res.json({ success: true, message: 'Publication deleted successfully.' });
});

// Messages management
router.get('/admin/messages', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  res.json(db.messages);
});

router.patch('/admin/messages/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const msg = db.messages.find((m) => m.id === req.params.id);
  if (msg) {
    msg.read = true;
    saveDatabase(db);
  }
  res.json({ success: true });
});

router.delete('/admin/messages/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  db.messages = db.messages.filter((m) => m.id !== req.params.id);
  saveDatabase(db);
  res.json({ success: true, message: 'Message deleted successfully.' });
});

// Social links
router.put('/admin/social-links', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { socialLinks } = req.body;
  if (!Array.isArray(socialLinks)) {
    res.status(400).json({ error: 'socialLinks array required.' });
    return;
  }

  const db = getDatabase();
  db.socialLinks = socialLinks;
  saveDatabase(db);
  logActivity('settings_changed', req.user?.username || 'Admin', 'Social Links', 'Social media links updated.');
  res.json({ success: true, socialLinks: db.socialLinks });
});

// Export & Backup
router.get('/admin/export', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  // Strip password hashes from export
  const exportData = {
    ...db,
    adminUsers: db.adminUsers.map((u) => ({
      id: u.id,
      username: u.username,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      lastLogin: u.lastLogin,
    })),
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=hon_igbokwe_backup_${Date.now()}.json`);
  res.send(JSON.stringify(exportData, null, 2));
});

// Upload alias for /api/upload
router.post('/upload', (req, res, next) => {
  req.url = '/admin/upload';
  (router as any).handle(req, res, next);
});

// Fallback for unhandled /api routes
router.use((req: Request, res: Response) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Global API error handler ensuring JSON response
router.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled API error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
});

export default router;
