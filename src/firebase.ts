import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Lecture, AttachmentFile, Quiz, UserProfile, CloudinaryConfig } from './types';
import { SiteConfig, DEFAULT_SITE_CONFIG } from './types/siteConfig';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Strip undefined properties recursively so Firestore payloads stay clean
function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      out[k] = v;
    }
  }
  return out as Partial<T>;
}

const ALLOWED_SITE_CONFIG_KEYS: (keyof SiteConfig)[] = [
  'teacherName', 'teacherTitle', 'tagline', 'heroDescription', 'heroBadge',
  'profileImageUrl', 'calligraphyFont', 'bodyFont', 'primaryColor', 'googleClientId',
  'phone1', 'phone2', 'whatsappNumber', 'facebookUrl', 'youtubeUrl', 'telegramUrl',
  'centerBranches', 'developerName', 'developerHandle', 'developerUrl', 'footerBio',
  'footerQuickLinks', 'gradeFirstTitleAr', 'gradeFirstTitleEn', 'gradeFirstBadgeAr',
  'gradeFirstDescAr', 'gradeSecondTitleAr', 'gradeSecondTitleEn', 'gradeSecondBadgeAr',
  'gradeSecondDescAr', 'gradeThirdTitleAr', 'gradeThirdTitleEn', 'gradeThirdBadgeAr',
  'gradeThirdDescAr', 'feature1Title', 'feature1Desc', 'feature2Title', 'feature2Desc',
  'feature3Title', 'feature3Desc', 'feature4Title', 'feature4Desc',
];

export async function savePublicSiteConfigToCloud(config: SiteConfig): Promise<void> {
  const path = 'publicConfig/site';
  try {
    const cleanPayload: Record<string, any> = {};
    for (const key of ALLOWED_SITE_CONFIG_KEYS) {
      const val = config[key];
      if (val !== undefined) {
        cleanPayload[key] = val;
      }
    }
    if (!cleanPayload.teacherName) cleanPayload.teacherName = DEFAULT_SITE_CONFIG.teacherName;
    if (!cleanPayload.teacherTitle) cleanPayload.teacherTitle = DEFAULT_SITE_CONFIG.teacherTitle;
    if (cleanPayload.profileImageUrl === undefined) cleanPayload.profileImageUrl = '';

    await setDoc(doc(db, 'publicConfig', 'site'), {
      ...cleanPayload,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveAdminConfigToCloud(
  adminEmails: string[],
  cloudinaryConfig: CloudinaryConfig,
  googleClientId?: string
): Promise<void> {
  const path = 'adminConfig/settings';
  try {
    const cleanEmails = Array.from(
      new Set(
        ['mizoo2y2@gmail.com', ...(adminEmails || [])]
          .map((e) => e.toLowerCase().trim())
          .filter(Boolean)
      )
    ).slice(0, 25);

    const payload: Record<string, any> = {
      adminEmails: cleanEmails,
      cloudName: cloudinaryConfig.cloudName || 'chemistry-egypt',
      uploadPreset: cloudinaryConfig.uploadPreset || 'chemistry_uploads',
      updatedAt: serverTimestamp(),
    };
    if (googleClientId) {
      payload.googleClientId = googleClientId;
    }

    await setDoc(doc(db, 'adminConfig', 'settings'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveLectureToCloud(lecture: Lecture): Promise<void> {
  const path = `lectures/${lecture.id}`;
  try {
    const ref = doc(db, 'lectures', lecture.id);
    const clean = stripUndefined({
      id: lecture.id,
      title: lecture.title,
      grade: lecture.grade,
      gradeLabel: lecture.gradeLabel,
      chapter: lecture.chapter || '',
      duration: lecture.duration || '45 دقيقة',
      videoUrl: lecture.videoUrl || '',
      thumbnailUrl: lecture.thumbnailUrl || '/images/chemistry_lab_visual_1794141316456.jpg',
      pdfUrl: lecture.pdfUrl || undefined,
      pdfTitle: lecture.pdfTitle || undefined,
      description: lecture.description || '',
      isFreePreview: Boolean(lecture.isFreePreview),
      viewsCount: Number(lecture.viewsCount) || 0,
      dateAdded: lecture.dateAdded || new Date().toISOString().split('T')[0],
      sessionOrder: lecture.sessionOrder !== undefined ? Number(lecture.sessionOrder) : undefined,
      quizId: lecture.quizId || undefined,
    });

    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ...clean,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        ...clean,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteLectureFromCloud(id: string): Promise<void> {
  const path = `lectures/${id}`;
  try {
    await deleteDoc(doc(db, 'lectures', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveAttachmentToCloud(file: AttachmentFile): Promise<void> {
  const path = `attachments/${file.id}`;
  try {
    const ref = doc(db, 'attachments', file.id);
    const clean = stripUndefined({
      id: file.id,
      title: file.title,
      grade: file.grade,
      gradeLabel: file.gradeLabel,
      chapter: file.chapter || '',
      fileSize: file.fileSize || '1.0 MB',
      fileType: file.fileType || 'pdf',
      downloadUrl: file.downloadUrl,
      pageCount: file.pageCount !== undefined ? Number(file.pageCount) : undefined,
      dateAdded: file.dateAdded || new Date().toISOString().split('T')[0],
    });

    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ...clean,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        ...clean,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAttachmentFromCloud(id: string): Promise<void> {
  const path = `attachments/${id}`;
  try {
    await deleteDoc(doc(db, 'attachments', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveQuizToCloud(quiz: Quiz): Promise<void> {
  const path = `quizzes/${quiz.id}`;
  try {
    const ref = doc(db, 'quizzes', quiz.id);
    const clean = stripUndefined({
      id: quiz.id,
      title: quiz.title,
      grade: quiz.grade,
      chapter: quiz.chapter || '',
      durationMinutes: Number(quiz.durationMinutes) || 15,
      lectureId: quiz.lectureId || undefined,
      questions: Array.isArray(quiz.questions) ? quiz.questions.slice(0, 200) : [],
    });

    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ...clean,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        ...clean,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteQuizFromCloud(id: string): Promise<void> {
  const path = `quizzes/${id}`;
  try {
    await deleteDoc(doc(db, 'quizzes', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveStudentToCloud(student: UserProfile, authUid?: string): Promise<void> {
  const docId = student.id;
  const path = `students/${docId}`;
  try {
    const ref = doc(db, 'students', docId);
    const uid = authUid || auth.currentUser?.uid || docId;
    const clean = stripUndefined({
      id: docId,
      uid,
      name: student.name || 'طالب منصة',
      email: student.email || '',
      role: student.role || 'student',
      grade: student.grade || 'third',
      phone: student.phone || '',
      parentPhone: student.parentPhone || '',
      governorate: student.governorate || 'القاهرة',
      avatarUrl: student.avatarUrl || '',
      score: Number(student.score) || 0,
      profileCompleted: Boolean(student.profileCompleted),
      watchedLectureIds: Array.isArray(student.watchedLectureIds) ? student.watchedLectureIds.slice(0, 500) : [],
      passedQuizIds: Array.isArray(student.passedQuizIds) ? student.passedQuizIds.slice(0, 500) : [],
      quizScores: student.quizScores || {},
      joinedAt: student.joinedAt || new Date().toISOString().split('T')[0],
    });

    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ...clean,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        ...clean,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteStudentFromCloud(studentId: string): Promise<void> {
  const path = `students/${studentId}`;
  try {
    await deleteDoc(doc(db, 'students', studentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getStudentFromCloud(studentId: string): Promise<UserProfile | null> {
  const path = `students/${studentId}`;
  try {
    const snap = await getDoc(doc(db, 'students', studentId));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}
