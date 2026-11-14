import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory & uploads directory
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded media files publicly with immutable browser caching across all sessions
app.use(
  '/uploads',
  express.static(UPLOADS_DIR, {
    maxAge: '365d',
    immutable: true,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  })
);

const CHUNKS_ROOT = path.resolve(UPLOADS_DIR, '.chunks');
if (!fs.existsSync(CHUNKS_ROOT)) {
  fs.mkdirSync(CHUNKS_ROOT, { recursive: true });
}

// ==========================================
// API ROUTES
// ==========================================

// 1. Fast Parallel Chunk Upload (Avoids single huge request RAM/proxy stalls)
app.post(
  '/api/upload-chunk',
  express.raw({ type: 'application/octet-stream', limit: '10mb' }),
  async (req, res) => {
    try {
      const uploadIdRaw = typeof req.query.uploadId === 'string' ? req.query.uploadId : '';
      const uploadId = uploadIdRaw.replace(/[^a-zA-Z0-9_-]/g, '');
      const index = Number(req.query.index);

      if (!uploadId || !Number.isInteger(index) || index < 0) {
        return res.status(400).json({ success: false, error: 'بيانات الجزء غير صالحة' });
      }

      const chunkBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
      if (chunkBuffer.length === 0) {
        return res.status(400).json({ success: false, error: 'جزء فارغ' });
      }

      const uploadDir = path.resolve(CHUNKS_ROOT, uploadId);
      await fs.promises.mkdir(uploadDir, { recursive: true });
      await fs.promises.writeFile(path.resolve(uploadDir, `part_${index}`), chunkBuffer);

      return res.json({ success: true, index });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'فشل حفظ جزء الملف' });
    }
  }
);

app.post('/api/upload-complete', async (req, res) => {
  try {
    const uploadIdRaw = typeof req.body?.uploadId === 'string' ? req.body.uploadId : '';
    const uploadId = uploadIdRaw.replace(/[^a-zA-Z0-9_-]/g, '');
    const rawName = typeof req.body?.filename === 'string' ? req.body.filename : `upload_${Date.now()}`;
    const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_') || `upload_${Date.now()}`;
    const totalChunks = Number(req.body?.totalChunks);

    if (!uploadId || !Number.isInteger(totalChunks) || totalChunks <= 0) {
      return res.status(400).json({ success: false, error: 'بيانات دمج الملف غير مكتملة' });
    }

    const uploadDir = path.resolve(CHUNKS_ROOT, uploadId);
    const uniqueName = `${Date.now()}_${safeName}`;
    const targetPath = path.resolve(UPLOADS_DIR, uniqueName);

    const writeStream = fs.createWriteStream(targetPath);
    for (let i = 0; i < totalChunks; i++) {
      const partPath = path.resolve(uploadDir, `part_${i}`);
      const partData = await fs.promises.readFile(partPath);
      if (!writeStream.write(partData)) {
        await new Promise<void>((resolve) => writeStream.once('drain', resolve));
      }
    }
    await new Promise<void>((resolve, reject) => {
      writeStream.on('error', reject);
      writeStream.end(() => resolve());
    });

    fs.promises.rm(uploadDir, { recursive: true, force: true }).catch(() => {});

    return res.json({
      success: true,
      url: `/uploads/${uniqueName}`,
      filename: uniqueName,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل دمج الملف على السيرفر' });
  }
});

// 2. Raw Binary Stream Upload (Small files <= 1.5 MB)
app.post(
  '/api/upload-raw',
  express.raw({ type: 'application/octet-stream', limit: '250mb' }),
  async (req, res) => {
    try {
      const rawName = typeof req.query.filename === 'string' ? req.query.filename : `upload_${Date.now()}`;
      const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_') || `upload_${Date.now()}`;
      const fileBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);

      if (fileBuffer.length === 0) {
        return res.status(400).json({ success: false, error: 'لم يتم استلام بيانات الملف' });
      }

      const uniqueName = `${Date.now()}_${safeName}`;
      const targetPath = path.resolve(UPLOADS_DIR, uniqueName);
      await fs.promises.writeFile(targetPath, fileBuffer);

      return res.json({
        success: true,
        url: `/uploads/${uniqueName}`,
        filename: uniqueName,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'فشل حفظ الملف على السيرفر' });
    }
  }
);

// 3. Universal Direct File Upload (Legacy JSON/Base64 support)
app.post('/api/upload', async (req, res) => {
  try {
    const { filename, dataUrl, base64 } = req.body;
    let fileBuffer: Buffer;
    let safeName = filename ? filename.replace(/[^a-zA-Z0-9._-]/g, '_') : `upload_${Date.now()}`;

    if (dataUrl && typeof dataUrl === 'string') {
      const parts = dataUrl.split(';base64,');
      const rawBase64 = parts[1] || parts[0];
      fileBuffer = Buffer.from(rawBase64, 'base64');
      if (!path.extname(safeName) && parts[0].includes('image/')) {
        const ext = parts[0].split('image/')[1]?.split(';')[0] || 'jpg';
        safeName = `${safeName}.${ext}`;
      }
    } else if (base64 && typeof base64 === 'string') {
      fileBuffer = Buffer.from(base64, 'base64');
    } else {
      return res.status(400).json({ success: false, error: 'No file data provided' });
    }

    const uniqueName = `${Date.now()}_${safeName}`;
    const targetPath = path.resolve(UPLOADS_DIR, uniqueName);
    await fs.promises.writeFile(targetPath, fileBuffer);

    const publicUrl = `/uploads/${uniqueName}`;
    return res.json({
      success: true,
      url: publicUrl,
      filename: uniqueName,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Legacy unauthenticated shared JSON DB routes disabled for strict session & Firestore security
app.all('/api/db*', (_req, res) => {
  res.status(410).json({ success: false, error: 'Disabled: Firestore per-session auth is enforced.' });
});

app.all(
  ['/api/students*', '/api/site-config', '/api/cloudinary-config', '/api/lectures*', '/api/attachments*', '/api/quizzes*', '/api/reset-data'],
  (_req, res) => {
    res.status(410).json({ success: false, error: 'Disabled: Use authenticated Firebase session.' });
  }
);

// ==========================================
// VITE DEV SERVER / STATIC PRODUCTION MOUNT
// ==========================================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = Number(process.env.PORT) || 3000;

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Educational Platform Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
