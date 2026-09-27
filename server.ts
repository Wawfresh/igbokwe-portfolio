import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './server/routes/api';
import { syncAndRestoreImages, getStoredImage } from './server/imageStore';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function bootstrap() {
  const app = express();

  // Robust CORS configuration for all origins, iframes, Cloud Run, and development previews
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, Range, X-App-Version'
    );
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Basic security and parsing with 50MB capacity
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(cookieParser());

  // Static uploads folder (serve from both process.cwd()/uploads and data/uploads for durability)
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  const persistentUploadsDir = path.resolve(process.cwd(), 'data', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(persistentUploadsDir)) {
    fs.mkdirSync(persistentUploadsDir, { recursive: true });
  }

  // Restore any persistent images from JSON store
  syncAndRestoreImages();

  app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));
  app.use('/uploads', express.static(persistentUploadsDir, { maxAge: '7d' }));

  // Resilient fallback for /uploads requests:
  // 1. Try to revive from persistent JSON image store
  // 2. If still not found, provide intelligent fallback image (never broken 404 image or HTML!)
  app.get('/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
    const stored = getStoredImage(filename);
    if (stored) {
      res.setHeader('Content-Type', stored.mimetype);
      res.setHeader('Cache-Control', 'public, max-age=604800');
      return res.send(stored.buffer);
    }

    // If this was a hero portrait or person photo, serve the official bundled portrait
    const lower = filename.toLowerCase();
    if (lower.includes('hero') || lower.includes('portrait') || lower.includes('igbokwe') || lower.includes('image_006')) {
      const defaultPortraitPath = path.resolve(process.cwd(), 'public', 'hon-igbokwe-constituency.jpg');
      if (fs.existsSync(defaultPortraitPath)) {
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.sendFile(defaultPortraitPath);
      }
    }

    // Graceful SVG image fallback for any other missing image so page never breaks
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0B5D3B"/>
          <stop offset="100%" stop-color="#063B27"/>
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#g)"/>
      <circle cx="400" cy="260" r="70" fill="white" opacity="0.15"/>
      <path d="M370 260 h60 M400 230 v60" stroke="white" stroke-width="6" stroke-linecap="round" opacity="0.6"/>
      <text x="400" y="380" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="22" font-weight="600" letter-spacing="0.5">Hon. Raphael Nnanna Igbokwe</text>
      <text x="400" y="415" text-anchor="middle" fill="#9FE3C5" font-family="system-ui, sans-serif" font-size="14">Official Constituency Portfolio</text>
    </svg>`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(svg);
  });

  // Catch-all for non-GET uploads requests
  app.use('/uploads', (_req, res) => {
    res.status(404).json({ error: 'Uploaded file not found.' });
  });

  // Mount API router
  app.use('/api', apiRouter);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Hon. Raphael Nnanna Igbokwe Portfolio API',
      timestamp: new Date().toISOString(),
    });
  });

  // Any unmatched /api endpoint MUST return clean JSON, never HTML
  app.use('/api', (req, res) => {
    res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
  });

  if (!isProduction) {
    // Development mode with Vite middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hon. Raphael Nnanna Igbokwe Portfolio running at http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
