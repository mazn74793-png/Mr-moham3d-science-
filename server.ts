import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory & DB file
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default configuration
const DEFAULT_SITE_CONFIG = {
  teacherName: 'محمد مصطفى',
  teacherTitle: 'Mr. Mohamed Mostafa',
  tagline: 'كيمياء ولغات · دفعة 2026',
  heroDescription: 'المنصة التعليمية الأولى المتخصصة في تدريس الكيمياء والعلوم لمدارس اللغات والتجريبي وفق أحدث معايير الامتحانات الحديثة 2026.',
  heroBadge: 'دفعة 2026 · مدارس اللغات والتجريبي',
  profileImageUrl: '/images/teacher_mohamed_mostafa_1794141316649.jpg',
  calligraphyFont: 'Cairo',
  bodyFont: 'Cairo',
  primaryColor: '#0d9488',
  adminEmails: ['mizoo2y2@gmail.com'],
  phone1: '0100 234 5678',
  phone2: '0111 987 6543',
  whatsappNumber: '201002345678',
  facebookUrl: 'https://facebook.com',
  youtubeUrl: 'https://youtube.com',
  telegramUrl: 'https://t.me',
  centerBranches: 'القاهرة (مدينة نصر، المعادي، مصر الجديدة) والجيزة (الدقي، المهندسين، فيصل، الهرم).',
  developerName: 'Mazen Mohamed',
  developerHandle: '@mazenmohamed',
  developerUrl: 'https://wa.me/201002345678',
  footerBio: 'مع أ. محمد الكيمستري تبان من منظور تاني. شرح واضح، أمثلة من الواقع، وتجارب عملية تخلّيك واثق في الامتحان ومقفل المادة. انضم للكورسات وابدأ من دلوقتي مع أقوى نظام متابعة وتدريبات شاملة.',
  feature1Title: 'شرح مبسط وتأسيس عميق',
  feature1Desc: 'تفكيك أصعب المفاهيم الكيميائية ومسائل المول والمعادلات المعقدة بأسلوب سلس يرسخ المعلومة في ذهنك.',
  feature2Title: 'نظام امتحانات دوري وتقييم فوري',
  feature2Desc: 'كويزات بعد كل محاضرة بتصحيح ذكي فوري وتفسير دقيق للإجابات لمعرفة نقاط القوة والضعف ومعالجتها فوراً.',
  feature3Title: 'متابعة شخصية مستمرة ومذكرات PDF',
  feature3Desc: 'بنك أسئلة شامل ومذكرات ملونة عالية الجودة مع متابعة مستمرة للواجبات ومستوى الطالب الدراسي دورياً.',
  feature4Title: 'تجارب تفاعلية ومعمل افتراضي',
  feature4Desc: 'محاكاة بصرية تفاعلية للتفاعلات الكيميائية ومشاهدة تغيرات الألوان وسلوك الغازات عملياً لربط النظري بالواقع.',
};

const DEFAULT_CLOUDINARY_CONFIG = {
  cloudName: 'chemistry-egypt',
  uploadPreset: 'mohamed_mostafa_preset',
};

// In-Memory Database Cache with Persistence
interface DatabaseState {
  siteConfig: any;
  cloudinaryConfig: any;
  lectures: any[];
  attachments: any[];
  quizzes: any[];
  students: any[];
}

function loadDB(): DatabaseState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        siteConfig: { ...DEFAULT_SITE_CONFIG, ...(parsed.siteConfig || {}) },
        cloudinaryConfig: { ...DEFAULT_CLOUDINARY_CONFIG, ...(parsed.cloudinaryConfig || {}) },
        lectures: Array.isArray(parsed.lectures) ? parsed.lectures : [],
        attachments: Array.isArray(parsed.attachments) ? parsed.attachments : [],
        quizzes: Array.isArray(parsed.quizzes) ? parsed.quizzes : [],
        students: Array.isArray(parsed.students) ? parsed.students : [],
      };
    }
  } catch (err) {
    console.error('Failed to load DB file, using defaults:', err);
  }

  const initial: DatabaseState = {
    siteConfig: DEFAULT_SITE_CONFIG,
    cloudinaryConfig: DEFAULT_CLOUDINARY_CONFIG,
    lectures: [],
    attachments: [],
    quizzes: [],
    students: [],
  };
  saveDB(initial);
  return initial;
}

function saveDB(state: DatabaseState): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save DB file:', err);
  }
}

let db = loadDB();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==========================================
// API ROUTES
// ==========================================

// 1. Get entire database state
app.get('/api/db', (_req, res) => {
  res.json({
    success: true,
    data: db,
  });
});

// 2. Save / Update student profile (Persists permanently across all devices)
app.post('/api/students/save', (req, res) => {
  try {
    const student = req.body;
    if (!student || (!student.email && !student.id && !student.phone)) {
      return res.status(400).json({ success: false, error: 'Student identifier required' });
    }

    const email = student.email ? String(student.email).toLowerCase().trim() : '';
    const phone = student.phone ? String(student.phone).trim() : '';
    const id = student.id ? String(student.id) : '';

    const existingIndex = db.students.findIndex((s: any) => {
      const sEmail = s.email ? String(s.email).toLowerCase().trim() : '';
      const sPhone = s.phone ? String(s.phone).trim() : '';
      const sId = s.id ? String(s.id) : '';
      return (email && sEmail === email) || (id && sId === id) || (phone && sPhone === phone);
    });

    const finalizedStudent = {
      ...student,
      profileCompleted: true,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      db.students[existingIndex] = {
        ...db.students[existingIndex],
        ...finalizedStudent,
      };
    } else {
      db.students.unshift(finalizedStudent);
    }

    saveDB(db);
    return res.json({ success: true, student: finalizedStudent });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Find student by email / id / phone
app.get('/api/students/lookup', (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q).toLowerCase().trim() : '';
    if (!q) {
      return res.json({ found: false, student: null });
    }

    const student = db.students.find((s: any) => {
      const sEmail = s.email ? String(s.email).toLowerCase().trim() : '';
      const sPhone = s.phone ? String(s.phone).trim() : '';
      const sId = s.id ? String(s.id).toLowerCase().trim() : '';
      return sEmail === q || sPhone === q || sId === q;
    });

    if (student) {
      return res.json({ found: true, student });
    }
    return res.json({ found: false, student: null });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Save Site Configuration (preserves uploaded Cloudinary teacher photo)
app.post('/api/site-config', (req, res) => {
  try {
    const newConfig = req.body;
    db.siteConfig = {
      ...db.siteConfig,
      ...newConfig,
    };
    saveDB(db);
    return res.json({ success: true, siteConfig: db.siteConfig });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Save Cloudinary Configuration
app.post('/api/cloudinary-config', (req, res) => {
  try {
    const newConfig = req.body;
    db.cloudinaryConfig = {
      ...db.cloudinaryConfig,
      ...newConfig,
    };
    saveDB(db);
    return res.json({ success: true, cloudinaryConfig: db.cloudinaryConfig });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Lectures CRUD
app.post('/api/lectures', (req, res) => {
  try {
    const lecture = req.body;
    const existingIndex = db.lectures.findIndex((l: any) => l.id === lecture.id);
    if (existingIndex >= 0) {
      db.lectures[existingIndex] = lecture;
    } else {
      db.lectures.unshift(lecture);
    }
    saveDB(db);
    return res.json({ success: true, lecture, lectures: db.lectures });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/lectures/:id', (req, res) => {
  try {
    const id = req.params.id;
    db.lectures = db.lectures.filter((l: any) => l.id !== id);
    saveDB(db);
    return res.json({ success: true, lectures: db.lectures });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Attachments CRUD
app.post('/api/attachments', (req, res) => {
  try {
    const attachment = req.body;
    const existingIndex = db.attachments.findIndex((a: any) => a.id === attachment.id);
    if (existingIndex >= 0) {
      db.attachments[existingIndex] = attachment;
    } else {
      db.attachments.unshift(attachment);
    }
    saveDB(db);
    return res.json({ success: true, attachment, attachments: db.attachments });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/attachments/:id', (req, res) => {
  try {
    const id = req.params.id;
    db.attachments = db.attachments.filter((a: any) => a.id !== id);
    saveDB(db);
    return res.json({ success: true, attachments: db.attachments });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Quizzes CRUD
app.post('/api/quizzes', (req, res) => {
  try {
    const quiz = req.body;
    const existingIndex = db.quizzes.findIndex((q: any) => q.id === quiz.id);
    if (existingIndex >= 0) {
      db.quizzes[existingIndex] = quiz;
    } else {
      db.quizzes.unshift(quiz);
    }
    saveDB(db);
    return res.json({ success: true, quiz, quizzes: db.quizzes });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/quizzes/:id', (req, res) => {
  try {
    const id = req.params.id;
    db.quizzes = db.quizzes.filter((q: any) => q.id !== id);
    saveDB(db);
    return res.json({ success: true, quizzes: db.quizzes });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Students Delete endpoint
app.delete('/api/students/:id', (req, res) => {
  try {
    const id = req.params.id;
    db.students = db.students.filter((s: any) => s.id !== id);
    saveDB(db);
    return res.json({ success: true, students: db.students });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Reset All Data (Empty lectures, attachments, quizzes, students on demand)
app.post('/api/reset-data', (_req, res) => {
  try {
    db.lectures = [];
    db.attachments = [];
    db.quizzes = [];
    db.students = [];
    saveDB(db);
    return res.json({ success: true, message: 'All curriculum and student data zeroed out' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

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
