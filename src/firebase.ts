import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  browserPopupRedirectResolver,
  setPersistence,
  GoogleAuthProvider,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  linkWithCredential,
  updatePassword,
  updateProfile,
  sendEmailVerification,
  reauthenticateWithPopup,
  reload,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import {
  initializeFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  serverTimestamp,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  Lecture,
  AttachmentFile,
  Quiz,
  UserProfile,
  CloudinaryConfig,
  RedeemCode,
  PointReward,
  PointsHistoryEntry,
  PlatformNotification,
  ExamSecurityAlert,
} from './types';
import { SiteConfig, DEFAULT_SITE_CONFIG } from './types/siteConfig';

const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
const useSameOriginAuthDomain = currentHost === 'moham3d-mostafa.vercel.app';

const runtimeFirebaseConfig = {
  ...firebaseConfig,
  authDomain: useSameOriginAuthDomain ? currentHost : firebaseConfig.authDomain,
};

const app = initializeApp(runtimeFirebaseConfig);
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true,
  },
  firebaseConfig.firestoreDatabaseId
);

function createPersistentAuth(): Auth {
  try {
    return initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
      ],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    const existingAuth = getAuth(app);
    setPersistence(existingAuth, browserLocalPersistence).catch(() => {});
    return existingAuth;
  }
}

export const auth = createPersistentAuth();
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function hasPasswordLinked(fbUser?: FirebaseUser | null): boolean {
  if (!fbUser) return false;
  return Boolean(fbUser.providerData?.some((p) => p.providerId === 'password'));
}

export function isGoogleUserWithoutPassword(fbUser?: FirebaseUser | null): boolean {
  if (!fbUser || !fbUser.email) return false;
  const hasGoogle = Boolean(fbUser.providerData?.some((p) => p.providerId === 'google.com'));
  return hasGoogle && !hasPasswordLinked(fbUser);
}

export async function signInManualWithEmail(
  email: string,
  password: string
): Promise<FirebaseUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
  return cred.user;
}

export async function sendPasswordReset(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  await sendPasswordResetEmail(auth, cleanEmail);
}

export async function registerManualWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<FirebaseUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  if (displayName && displayName.trim()) {
    withTimeout(
      updateProfile(cred.user, { displayName: displayName.trim().slice(0, 120) }),
      1500,
      undefined
    ).catch(() => {});
  }
  // Dispatch verification email in the background so registration never blocks on slow mail servers
  sendEmailVerification(cred.user).catch(() => {});
  return cred.user;
}

export async function linkPasswordToCurrentUser(
  newPassword: string,
  options: { allowPopupReauth?: boolean } = {}
): Promise<FirebaseUser> {
  const { allowPopupReauth = true } = options;
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('NO_ACTIVE_AUTH_USER');
  }
  const cleanPass = newPassword.trim();
  const alreadyLinked = hasPasswordLinked(user);

  const performOperation = async (targetUser: FirebaseUser) => {
    if (alreadyLinked) {
      await updatePassword(targetUser, cleanPass);
    } else {
      const credential = EmailAuthProvider.credential(targetUser.email!, cleanPass);
      await linkWithCredential(targetUser, credential);
    }
  };

  try {
    await performOperation(user);
  } catch (err: any) {
    if (err?.code === 'auth/requires-recent-login') {
      const hasGoogle = Boolean(user.providerData?.some((p) => p.providerId === 'google.com'));
      if (hasGoogle && allowPopupReauth) {
        const reauthRes = await reauthenticateWithPopup(user, googleProvider);
        await performOperation(reauthRes.user);
      } else {
        throw err;
      }
    } else if (err?.code === 'auth/provider-already-linked') {
      await updatePassword(user, cleanPass);
    } else {
      throw err;
    }
  }

  try {
    if (auth.currentUser) {
      await reload(auth.currentUser);
    }
  } catch {}

  return auth.currentUser || user;
}

export async function resendVerificationEmail(): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('NO_ACTIVE_AUTH_USER');
  }
  await sendEmailVerification(auth.currentUser);
}

export async function reloadCurrentAuthUser(): Promise<FirebaseUser | null> {
  if (!auth.currentUser) return null;
  await reload(auth.currentUser);
  return auth.currentUser;
}

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

export function extractFirestoreErrorDetails(err: unknown): {
  rawMessage: string;
  isPermissionDenied: boolean;
  isUnauthenticated: boolean;
  isNetworkError: boolean;
} {
  const code = (err as any)?.code || '';
  let rawMessage = err instanceof Error ? err.message : String(err || '');
  try {
    const parsed = JSON.parse(rawMessage);
    if (parsed && typeof parsed.error === 'string') {
      rawMessage = parsed.error;
    }
  } catch {}
  const lower = `${code} ${rawMessage}`.toLowerCase();
  return {
    rawMessage,
    isPermissionDenied:
      code === 'permission-denied' ||
      lower.includes('permission-denied') ||
      lower.includes('missing or insufficient permissions'),
    isUnauthenticated:
      code === 'unauthenticated' || lower.includes('unauthenticated'),
    isNetworkError:
      code === 'unavailable' ||
      lower.includes('unavailable') ||
      lower.includes('network') ||
      lower.includes('offline'),
  };
}

async function runWithAdminTokenRetry<T>(operation: () => Promise<T>): Promise<T> {
  const user = auth.currentUser;
  if (user) {
    await withTimeout(user.getIdToken(), 2500, '');
  }
  try {
    return await operation();
  } catch (err: any) {
    const details = extractFirestoreErrorDetails(err);
    if ((details.isPermissionDenied || details.isUnauthenticated) && auth.currentUser) {
      try {
        await reload(auth.currentUser);
      } catch {}
      await withTimeout(auth.currentUser.getIdToken(true), 3000, '');
      await new Promise((r) => setTimeout(r, 250));
      return await operation();
    }
    throw err;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(fallback);
      }
    }, ms);
    promise
      .then((val) => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          resolve(val);
        }
      })
      .catch(() => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          resolve(fallback);
        }
      });
  });
}

// Strip undefined properties recursively (including nested arrays and maps) so Firestore never rejects payloads
function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      if (v !== undefined) {
        out[k] = stripUndefinedDeep(v);
      }
    }
    return out as T;
  }
  return value;
}

const ALLOWED_SITE_CONFIG_KEYS: (keyof SiteConfig)[] = [
  'teacherName', 'teacherTitle', 'tagline', 'heroDescription', 'heroBadge',
  'profileImageUrl', 'calligraphyFont', 'bodyFont', 'primaryColor', 'googleClientId',
  'phone1', 'phone2', 'whatsappNumber', 'facebookUrl', 'youtubeUrl', 'telegramUrl',
  'centerBranches', 'developerName', 'developerHandle', 'developerUrl', 'footerBio',
  'footerQuickLinks', 'grades', 'gradeFirstTitleAr', 'gradeFirstTitleEn', 'gradeFirstBadgeAr',
  'gradeFirstDescAr', 'gradeSecondTitleAr', 'gradeSecondTitleEn', 'gradeSecondBadgeAr',
  'gradeSecondDescAr', 'gradeThirdTitleAr', 'gradeThirdTitleEn', 'gradeThirdBadgeAr',
  'gradeThirdDescAr', 'feature1Title', 'feature1Desc', 'feature2Title', 'feature2Desc',
  'feature3Title', 'feature3Desc', 'feature4Title', 'feature4Desc',
];

export interface AdminCloudConfig {
  adminEmails?: string[];
  cloudName?: string;
  uploadPreset?: string;
  googleClientId?: string;
}

let inflightAdminConfigFetch: {
  uid: string;
  promise: Promise<AdminCloudConfig | null>;
} | null = null;

let adminConfigCache: {
  uid: string;
  ts: number;
  data: AdminCloudConfig | null;
} | null = null;

export function clearAdminConfigCache(): void {
  adminConfigCache = null;
  inflightAdminConfigFetch = null;
}

/**
 * Fast, session-cached query of protected adminConfig/settings without blocking student logins
 * with redundant reloads or permission-denied retry sleeps.
 */
export async function fetchAdminConfigIfAuthorized(
  timeoutMs = 3500
): Promise<AdminCloudConfig | null> {
  const user = auth.currentUser;
  if (!user || !user.email) return null;

  const hasGoogle = Boolean(user.providerData?.some((p) => p.providerId === 'google.com'));
  if (!user.emailVerified && !hasGoogle) {
    return null;
  }

  const currentEmail = user.email.toLowerCase().trim();
  const now = Date.now();

  if (
    adminConfigCache &&
    adminConfigCache.uid === user.uid &&
    now - adminConfigCache.ts < 60000
  ) {
    return adminConfigCache.data;
  }

  if (inflightAdminConfigFetch && inflightAdminConfigFetch.uid === user.uid) {
    return inflightAdminConfigFetch.promise;
  }

  const runFetch = async (): Promise<AdminCloudConfig | null> => {
    try {
      await withTimeout(user.getIdToken(), 1500, '');

      const readSettingsDoc = async () => {
        try {
          return await getDoc(doc(db, 'adminConfig', 'settings'));
        } catch (err: any) {
          const code = err?.code || '';
          // Only refresh token on unauthenticated; regular students get permission-denied legitimately and must return immediately
          if (code === 'unauthenticated') {
            await withTimeout(user.getIdToken(true), 2000, '');
            return await getDoc(doc(db, 'adminConfig', 'settings'));
          }
          throw err;
        }
      };

      const snap = await withTimeout(readSettingsDoc(), timeoutMs, null);
      if (snap && snap.exists()) {
        const data = snap.data() as AdminCloudConfig;
        const allowedList = Array.from(
          new Set(
            ['mizoo2y2@gmail.com', ...(data.adminEmails || [])]
              .map((e) => String(e).toLowerCase().trim())
              .filter(Boolean)
          )
        );
        const resolved = allowedList.includes(currentEmail)
          ? { ...data, adminEmails: allowedList }
          : null;
        adminConfigCache = { uid: user.uid, ts: Date.now(), data: resolved };
        return resolved;
      }
      const fallback =
        currentEmail === 'mizoo2y2@gmail.com'
          ? { adminEmails: ['mizoo2y2@gmail.com'] }
          : null;
      adminConfigCache = { uid: user.uid, ts: Date.now(), data: fallback };
      return fallback;
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'permission-denied') {
        const fallback =
          currentEmail === 'mizoo2y2@gmail.com'
            ? { adminEmails: ['mizoo2y2@gmail.com'] }
            : null;
        adminConfigCache = { uid: user.uid, ts: Date.now(), data: fallback };
        return fallback;
      }
      return currentEmail === 'mizoo2y2@gmail.com'
        ? { adminEmails: ['mizoo2y2@gmail.com'] }
        : null;
    }
  };

  const promise = runFetch().finally(() => {
    if (inflightAdminConfigFetch?.promise === promise) {
      inflightAdminConfigFetch = null;
    }
  });
  inflightAdminConfigFetch = { uid: user.uid, promise };
  return promise;
}

export async function savePublicSiteConfigToCloud(config: SiteConfig): Promise<void> {
  const path = 'publicConfig/site';
  try {
    const cleanPayload: Record<string, any> = {};
    for (const key of ALLOWED_SITE_CONFIG_KEYS) {
      const val = config[key];
      if (val !== undefined) {
        cleanPayload[key] = stripUndefinedDeep(val);
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
  googleClientId?: string,
  options?: { preserveExistingAdmins?: boolean }
): Promise<void> {
  const path = 'adminConfig/settings';
  try {
    await runWithAdminTokenRetry(async () => {
      const ref = doc(db, 'adminConfig', 'settings');
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const existingData = snap.exists() ? (snap.data() as AdminCloudConfig) : null;

        const baseEmails =
          options?.preserveExistingAdmins && existingData?.adminEmails?.length
            ? existingData.adminEmails
            : adminEmails || [];

        const cleanEmails = Array.from(
          new Set(
            ['mizoo2y2@gmail.com', ...baseEmails]
              .map((e) => e.toLowerCase().trim())
              .filter(Boolean)
          )
        ).slice(0, 25);

        const payload: Record<string, any> = {
          adminEmails: cleanEmails,
          cloudName: (
            cloudinaryConfig.cloudName ||
            existingData?.cloudName ||
            'chemistry-egypt'
          ).slice(0, 150),
          uploadPreset: (
            cloudinaryConfig.uploadPreset ||
            existingData?.uploadPreset ||
            'chemistry_uploads'
          ).slice(0, 150),
          updatedAt: serverTimestamp(),
        };
        const resolvedGoogleClient = googleClientId || existingData?.googleClientId;
        if (resolvedGoogleClient) {
          payload.googleClientId = String(resolvedGoogleClient).slice(0, 300);
        }

        tx.set(ref, payload);
      });
    });
    clearAdminConfigCache();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveAdminEmailsToCloud(
  adminEmails: string[],
  fallbackCloudinary: CloudinaryConfig
): Promise<string[]> {
  const path = 'adminConfig/settings';
  try {
    const cleanEmails = Array.from(
      new Set(
        ['mizoo2y2@gmail.com', ...(adminEmails || [])]
          .map((e) => e.toLowerCase().trim())
          .filter(Boolean)
      )
    ).slice(0, 25);

    await runWithAdminTokenRetry(async () => {
      const ref = doc(db, 'adminConfig', 'settings');
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const existingData = snap.exists() ? (snap.data() as AdminCloudConfig) : null;

        const payload: Record<string, any> = {
          adminEmails: cleanEmails,
          cloudName: (
            existingData?.cloudName ||
            fallbackCloudinary.cloudName ||
            'chemistry-egypt'
          ).slice(0, 150),
          uploadPreset: (
            existingData?.uploadPreset ||
            fallbackCloudinary.uploadPreset ||
            'chemistry_uploads'
          ).slice(0, 150),
          updatedAt: serverTimestamp(),
        };
        if (existingData?.googleClientId) {
          payload.googleClientId = String(existingData.googleClientId).slice(0, 300);
        }

        tx.set(ref, payload);
      });
    });

    clearAdminConfigCache();
    return cleanEmails;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchAllStudentsAsAdmin(): Promise<UserProfile[]> {
  const path = 'students';
  try {
    return await runWithAdminTokenRetry(async () => {
      const snap = await getDocs(collection(db, 'students'));
      return snap.docs.map((d) => d.data() as UserProfile);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveLectureToCloud(lecture: Lecture): Promise<void> {
  const path = `lectures/${lecture.id}`;
  try {
    const ref = doc(db, 'lectures', lecture.id);
    const cleanUnitId = lecture.unitId ? String(lecture.unitId).trim().slice(0, 128) : undefined;
    const clean = stripUndefinedDeep({
      id: lecture.id,
      title: lecture.title,
      grade: lecture.grade,
      gradeLabel: lecture.gradeLabel || lecture.grade,
      unitId: cleanUnitId,
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
      pointsCost: Math.max(0, Math.min(100000, Math.round(Number(lecture.pointsCost) || 0))),
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
        unitId: cleanUnitId ? cleanUnitId : deleteField(),
        pdfUrl: lecture.pdfUrl ? lecture.pdfUrl : deleteField(),
        pdfTitle: lecture.pdfTitle ? lecture.pdfTitle : deleteField(),
        sessionOrder: lecture.sessionOrder !== undefined ? Number(lecture.sessionOrder) : deleteField(),
        quizId: lecture.quizId ? lecture.quizId : deleteField(),
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
    const clean = stripUndefinedDeep({
      id: file.id,
      title: file.title,
      grade: file.grade,
      gradeLabel: file.gradeLabel || file.grade,
      chapter: file.chapter || '',
      fileSize: file.fileSize || '1.0 MB',
      fileType: file.fileType || 'pdf',
      downloadUrl: file.downloadUrl,
      pageCount: file.pageCount !== undefined ? Number(file.pageCount) : undefined,
      dateAdded: file.dateAdded || new Date().toISOString().split('T')[0],
      pointsCost: Math.max(0, Math.min(100000, Math.round(Number(file.pointsCost) || 0))),
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
    const cleanInstructions = Array.isArray(quiz.examInstructions)
      ? quiz.examInstructions.map((s) => String(s).trim()).filter(Boolean).slice(0, 25)
      : undefined;
    const clean = stripUndefinedDeep({
      id: quiz.id,
      title: quiz.title,
      grade: quiz.grade,
      chapter: quiz.chapter || '',
      durationMinutes: Math.max(1, Math.min(600, Number(quiz.durationMinutes) || 15)),
      warningMinutes:
        quiz.warningMinutes !== undefined
          ? Math.max(0, Math.min(120, Math.round(Number(quiz.warningMinutes) || 0)))
          : undefined,
      passingScore:
        quiz.passingScore !== undefined
          ? Math.max(0, Math.min(100, Math.round(Number(quiz.passingScore) || 60)))
          : undefined,
      requireAgreement: quiz.requireAgreement !== undefined ? Boolean(quiz.requireAgreement) : undefined,
      examInstructions: cleanInstructions,
      proctoringEnabled:
        quiz.proctoringEnabled !== undefined ? Boolean(quiz.proctoringEnabled) : undefined,
      maxViolations:
        quiz.maxViolations !== undefined
          ? Math.max(1, Math.min(20, Math.round(Number(quiz.maxViolations) || 3)))
          : undefined,
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
        lectureId: quiz.lectureId ? quiz.lectureId : deleteField(),
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

export async function saveStudentToCloud(
  student: UserProfile,
  authUid?: string,
  allowPointsOverride = false
): Promise<void> {
  const docId = student.id;
  const path = `students/${docId}`;
  try {
    const ref = doc(db, 'students', docId);
    const uid = authUid || auth.currentUser?.uid || docId;
    const cleanGrade =
      (student.grade || 'third').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 64) || 'third';
    const baseClean = stripUndefinedDeep({
      id: docId,
      uid,
      name: (student.name || '').trim().slice(0, 200) || 'طالب منصة',
      email: (student.email || '').trim().slice(0, 200),
      role: student.role === 'teacher' ? 'teacher' : 'student',
      grade: cleanGrade,
      phone: (student.phone || '').trim().slice(0, 50),
      parentPhone: (student.parentPhone || '').trim().slice(0, 50),
      governorate: (student.governorate || 'القاهرة').trim().slice(0, 150),
      avatarUrl: (student.avatarUrl || '').slice(0, 2000),
      score: Number(student.score) || 0,
      profileCompleted: Boolean(student.profileCompleted),
      watchedLectureIds: Array.isArray(student.watchedLectureIds)
        ? student.watchedLectureIds.slice(0, 500)
        : [],
      passedQuizIds: Array.isArray(student.passedQuizIds)
        ? student.passedQuizIds.slice(0, 500)
        : [],
      quizScores: student.quizScores || {},
      cancelledQuizIds: Array.isArray(student.cancelledQuizIds)
        ? student.cancelledQuizIds.slice(0, 200)
        : undefined,
      quizViolations: student.quizViolations || undefined,
      joinedAt: (student.joinedAt || new Date().toISOString().split('T')[0]).slice(0, 50),
    });

    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const initialAdminPayload = allowPointsOverride
        ? stripUndefinedDeep({
            points: Math.max(0, Math.round(Number(student.points) || 0)),
            unlockedLectureIds: Array.isArray(student.unlockedLectureIds)
              ? student.unlockedLectureIds.slice(0, 500)
              : [],
            unlockedAttachmentIds: Array.isArray(student.unlockedAttachmentIds)
              ? student.unlockedAttachmentIds.slice(0, 500)
              : [],
            claimedRewardIds: Array.isArray(student.claimedRewardIds)
              ? student.claimedRewardIds.slice(0, 500)
              : [],
            pointsHistory: Array.isArray(student.pointsHistory)
              ? student.pointsHistory.slice(0, 50)
              : [],
            isBlocked: Boolean(student.isBlocked),
            blockReason: student.blockReason ? student.blockReason.trim().slice(0, 500) : undefined,
          })
        : {
            points: 0,
            unlockedLectureIds: [],
            unlockedAttachmentIds: [],
            claimedRewardIds: [],
            pointsHistory: [],
          };

      await setDoc(ref, {
        ...baseClean,
        ...initialAdminPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const updatePayload: Record<string, any> = {
        ...baseClean,
        updatedAt: serverTimestamp(),
      };
      // Only admin updates should include wallet or block status fields on profile save;
      // student updates omit them so Zero-Trust Action 1 affectedKeys rule passes.
      if (allowPointsOverride) {
        updatePayload.points = Math.max(0, Math.round(Number(student.points) || 0));
        if (Array.isArray(student.unlockedLectureIds)) {
          updatePayload.unlockedLectureIds = student.unlockedLectureIds.slice(0, 500);
        }
        if (Array.isArray(student.unlockedAttachmentIds)) {
          updatePayload.unlockedAttachmentIds = student.unlockedAttachmentIds.slice(0, 500);
        }
        if (Array.isArray(student.claimedRewardIds)) {
          updatePayload.claimedRewardIds = student.claimedRewardIds.slice(0, 500);
        }
        if (Array.isArray(student.pointsHistory)) {
          updatePayload.pointsHistory = stripUndefinedDeep(student.pointsHistory.slice(0, 50));
        }
        if (student.isBlocked !== undefined) {
          updatePayload.isBlocked = Boolean(student.isBlocked);
        }
        if (student.blockReason !== undefined) {
          updatePayload.blockReason = student.blockReason.trim()
            ? student.blockReason.trim().slice(0, 500)
            : deleteField();
        }
      }
      await updateDoc(ref, updatePayload);
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

let inflightStudentFetch: {
  uid: string;
  ts: number;
  promise: Promise<UserProfile | null>;
} | null = null;

export async function getStudentFromCloud(
  studentId: string,
  timeoutMs = 2500
): Promise<UserProfile | null> {
  const now = Date.now();
  if (
    inflightStudentFetch &&
    inflightStudentFetch.uid === studentId &&
    now - inflightStudentFetch.ts < 3000
  ) {
    return inflightStudentFetch.promise;
  }

  const runFetch = async (): Promise<UserProfile | null> => {
    try {
      const snap = await withTimeout(
        getDoc(doc(db, 'students', studentId)),
        timeoutMs,
        null
      );
      if (snap && snap.exists()) {
        return snap.data() as UserProfile;
      }
      return null;
    } catch {
      return null;
    }
  };

  const promise = runFetch();
  inflightStudentFetch = { uid: studentId, ts: now, promise };
  return promise;
}

// ==========================================
// REDEEM CODES & STUDENT POINTS SYSTEM
// ==========================================

export function normalizeRedeemCodeInput(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9_\-]/g, '')
    .slice(0, 64);
}

export async function saveRedeemCodeToCloud(item: RedeemCode): Promise<void> {
  const cleanCode = normalizeRedeemCodeInput(item.code || item.id);
  const path = `redeemCodes/${cleanCode}`;
  try {
    const ref = doc(db, 'redeemCodes', cleanCode);
    const clean = stripUndefinedDeep({
      id: cleanCode,
      code: cleanCode,
      points: Math.max(1, Math.min(100000, Math.round(Number(item.points) || 10))),
      maxUses: Math.max(1, Math.min(100000, Math.round(Number(item.maxUses) || 1))),
      usedCount: Math.max(0, Math.round(Number(item.usedCount) || 0)),
      active: Boolean(item.active),
      label: item.label?.trim() ? item.label.trim().slice(0, 150) : undefined,
      createdBy: item.createdBy?.trim()
        ? item.createdBy.trim().slice(0, 150)
        : auth.currentUser?.email || 'admin',
      createdAtDate: item.createdAtDate || new Date().toISOString().split('T')[0],
    });

    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ...clean,
        usedCount: 0,
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

export async function saveRedeemCodesBatchToCloud(items: RedeemCode[]): Promise<void> {
  if (items.length === 0) return;
  try {
    const batch = writeBatch(db);
    for (const item of items) {
      const cleanCode = normalizeRedeemCodeInput(item.code || item.id);
      if (!cleanCode) continue;
      const ref = doc(db, 'redeemCodes', cleanCode);
      const clean = stripUndefinedDeep({
        id: cleanCode,
        code: cleanCode,
        points: Math.max(1, Math.min(100000, Math.round(Number(item.points) || 10))),
        maxUses: Math.max(1, Math.min(100000, Math.round(Number(item.maxUses) || 1))),
        usedCount: 0,
        active: Boolean(item.active),
        label: item.label?.trim() ? item.label.trim().slice(0, 150) : undefined,
        createdBy: auth.currentUser?.email || 'admin',
        createdAtDate: item.createdAtDate || new Date().toISOString().split('T')[0],
      });
      batch.set(ref, {
        ...clean,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'redeemCodes/batch');
  }
}

export async function toggleRedeemCodeActiveInCloud(
  codeId: string,
  active: boolean
): Promise<void> {
  const cleanCode = normalizeRedeemCodeInput(codeId);
  const path = `redeemCodes/${cleanCode}`;
  try {
    await updateDoc(doc(db, 'redeemCodes', cleanCode), {
      active: Boolean(active),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteRedeemCodeFromCloud(codeId: string): Promise<void> {
  const cleanCode = normalizeRedeemCodeInput(codeId);
  const path = `redeemCodes/${cleanCode}`;
  try {
    await deleteDoc(doc(db, 'redeemCodes', cleanCode));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function savePointRewardToCloud(reward: PointReward): Promise<void> {
  const path = `rewards/${reward.id}`;
  try {
    const ref = doc(db, 'rewards', reward.id);
    const clean = stripUndefinedDeep({
      id: reward.id,
      title: reward.title.trim().slice(0, 300),
      description: (reward.description || '').trim().slice(0, 1500),
      pointsCost: Math.max(1, Math.min(100000, Math.round(Number(reward.pointsCost) || 50))),
      category: reward.category || 'perk',
      grade: reward.grade || 'all',
      active: Boolean(reward.active),
      dateAdded: reward.dateAdded || new Date().toISOString().split('T')[0],
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

export async function deletePointRewardFromCloud(rewardId: string): Promise<void> {
  const path = `rewards/${rewardId}`;
  try {
    await deleteDoc(doc(db, 'rewards', rewardId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

async function ensureStudentCloudDocExists(student: UserProfile): Promise<string> {
  const fbUser = auth.currentUser;
  if (!fbUser) {
    throw new Error('يرجى تسجيل الدخول أولاً لتفعيل الأكواد واستخدام محفظة النقاط بأمان.');
  }
  const uid = fbUser.uid;
  const studentRef = doc(db, 'students', uid);
  const snap = await getDoc(studentRef);
  if (!snap.exists()) {
    await saveStudentToCloud(
      {
        ...student,
        id: uid,
        email: fbUser.email || student.email || '',
        avatarUrl: fbUser.photoURL || student.avatarUrl || '',
        role: 'student',
      },
      uid,
      false
    );
  }
  return uid;
}

export async function redeemCodeForStudent(
  rawCode: string,
  student: UserProfile
): Promise<{
  pointsAdded: number;
  newBalance: number;
  code: string;
  updatedStudent: UserProfile;
}> {
  const cleanCode = normalizeRedeemCodeInput(rawCode);
  if (!cleanCode || cleanCode.length < 3) {
    throw new Error('من فضلك أدخل كود شحن صحيح (مثال: CHEM-2026).');
  }

  const uid = await ensureStudentCloudDocExists(student);
  const codeRef = doc(db, 'redeemCodes', cleanCode);
  const redemptionRef = doc(db, 'redeemCodes', cleanCode, 'redemptions', uid);
  const studentRef = doc(db, 'students', uid);

  const txResult = await runTransaction(db, async (tx) => {
    const [codeSnap, redemptionSnap, studentSnap] = await Promise.all([
      tx.get(codeRef),
      tx.get(redemptionRef),
      tx.get(studentRef),
    ]);

    if (!codeSnap.exists()) {
      throw new Error('كود الشحن غير صحيح أو غير موجود، تأكد من كتابة الأحرف بشكل سليم.');
    }

    const codeData = codeSnap.data() as RedeemCode;
    if (!codeData.active) {
      throw new Error('هذا الكود متوقف حالياً من قبل الإدارة.');
    }
    if ((codeData.usedCount || 0) >= (codeData.maxUses || 1)) {
      throw new Error('عذراً، تم استهلاك الحد الأقصى لاستخدامات هذا الكود بالكامل.');
    }
    if (redemptionSnap.exists()) {
      throw new Error('لقد قمت بشحن هذا الكود من قبل في حسابك.');
    }
    if (!studentSnap.exists()) {
      throw new Error('تعذر العثور على ملف الطالب السحابي.');
    }

    const currentStudent = studentSnap.data() as UserProfile;
    const currentPoints = Number(currentStudent.points) || 0;
    const rewardPoints = Number(codeData.points) || 0;
    const newBalance = currentPoints + rewardPoints;

    const historyEntry: PointsHistoryEntry = stripUndefinedDeep({
      id: `pt-${Date.now()}`,
      type: 'redeem',
      title: codeData.label ? `شحن كود (${codeData.label})` : `شحن كود: ${cleanCode}`,
      delta: rewardPoints,
      code: cleanCode,
      date: new Date().toISOString().split('T')[0],
    });
    const nextHistory = [historyEntry, ...(currentStudent.pointsHistory || [])].slice(0, 50);

    tx.set(redemptionRef, {
      uid,
      studentName: (currentStudent.name || student.name || 'طالب').slice(0, 200),
      code: cleanCode,
      points: rewardPoints,
      redeemedAt: serverTimestamp(),
    });

    tx.update(codeRef, {
      usedCount: (codeData.usedCount || 0) + 1,
      updatedAt: serverTimestamp(),
    });

    tx.update(studentRef, {
      points: newBalance,
      lastRedeemedCode: cleanCode,
      pointsHistory: nextHistory,
      updatedAt: serverTimestamp(),
    });

    return {
      pointsAdded: rewardPoints,
      newBalance,
      code: cleanCode,
      updatedStudent: {
        ...currentStudent,
        id: uid,
        points: newBalance,
        pointsHistory: nextHistory,
      },
    };
  });

  return txResult;
}

export async function unlockLectureWithPoints(
  lecture: Lecture,
  student: UserProfile
): Promise<UserProfile> {
  const cost = Math.max(0, Math.round(Number(lecture.pointsCost) || 0));
  if (cost <= 0) {
    throw new Error('هذه المحاضرة لا تتطلب نقاط لفتحها.');
  }

  const uid = await ensureStudentCloudDocExists(student);
  const studentRef = doc(db, 'students', uid);

  return await runTransaction(db, async (tx) => {
    const studentSnap = await tx.get(studentRef);
    if (!studentSnap.exists()) {
      throw new Error('تعذر الوصول لبيانات المحفظة السحابية.');
    }

    const currentStudent = studentSnap.data() as UserProfile;
    const unlockedIds = currentStudent.unlockedLectureIds || [];
    if (unlockedIds.includes(lecture.id)) {
      return { ...currentStudent, id: uid };
    }

    const currentPoints = Number(currentStudent.points) || 0;
    if (currentPoints < cost) {
      throw new Error(
        `رصيدك الحالي (${currentPoints} نقطة) غير كافٍ — مطلوب ${cost} نقطة لفتح هذه المحاضرة.`
      );
    }

    const newBalance = currentPoints - cost;
    const nextUnlocked = Array.from(new Set([...unlockedIds, lecture.id])).slice(0, 500);
    const entry: PointsHistoryEntry = {
      id: `pt-${Date.now()}`,
      type: 'unlock_lecture',
      title: `فتح محاضرة: ${lecture.title}`,
      delta: -cost,
      date: new Date().toISOString().split('T')[0],
    };
    const nextHistory = [entry, ...(currentStudent.pointsHistory || [])].slice(0, 50);

    tx.update(studentRef, {
      points: newBalance,
      unlockedLectureIds: nextUnlocked,
      pointsHistory: nextHistory,
      lastSpendTargetType: 'lecture',
      lastSpendTargetId: lecture.id,
      updatedAt: serverTimestamp(),
    });

    return {
      ...currentStudent,
      id: uid,
      points: newBalance,
      unlockedLectureIds: nextUnlocked,
      pointsHistory: nextHistory,
    };
  });
}

export async function unlockAttachmentWithPoints(
  file: AttachmentFile,
  student: UserProfile
): Promise<UserProfile> {
  const cost = Math.max(0, Math.round(Number(file.pointsCost) || 0));
  if (cost <= 0) {
    throw new Error('هذه المذكرة مجانية ولا تتطلب نقاط.');
  }

  const uid = await ensureStudentCloudDocExists(student);
  const studentRef = doc(db, 'students', uid);

  return await runTransaction(db, async (tx) => {
    const studentSnap = await tx.get(studentRef);
    if (!studentSnap.exists()) {
      throw new Error('تعذر الوصول لبيانات المحفظة السحابية.');
    }

    const currentStudent = studentSnap.data() as UserProfile;
    const unlockedIds = currentStudent.unlockedAttachmentIds || [];
    if (unlockedIds.includes(file.id)) {
      return { ...currentStudent, id: uid };
    }

    const currentPoints = Number(currentStudent.points) || 0;
    if (currentPoints < cost) {
      throw new Error(
        `رصيدك الحالي (${currentPoints} نقطة) غير كافٍ — مطلوب ${cost} نقطة لفتح المذكرة.`
      );
    }

    const newBalance = currentPoints - cost;
    const nextUnlocked = Array.from(new Set([...unlockedIds, file.id])).slice(0, 500);
    const entry: PointsHistoryEntry = {
      id: `pt-${Date.now()}`,
      type: 'unlock_file',
      title: `فتح مذكرة: ${file.title}`,
      delta: -cost,
      date: new Date().toISOString().split('T')[0],
    };
    const nextHistory = [entry, ...(currentStudent.pointsHistory || [])].slice(0, 50);

    tx.update(studentRef, {
      points: newBalance,
      unlockedAttachmentIds: nextUnlocked,
      pointsHistory: nextHistory,
      lastSpendTargetType: 'attachment',
      lastSpendTargetId: file.id,
      updatedAt: serverTimestamp(),
    });

    return {
      ...currentStudent,
      id: uid,
      points: newBalance,
      unlockedAttachmentIds: nextUnlocked,
      pointsHistory: nextHistory,
    };
  });
}

export async function claimRewardWithPoints(
  reward: PointReward,
  student: UserProfile
): Promise<UserProfile> {
  const cost = Math.max(1, Math.round(Number(reward.pointsCost) || 0));
  const uid = await ensureStudentCloudDocExists(student);
  const studentRef = doc(db, 'students', uid);

  return await runTransaction(db, async (tx) => {
    const studentSnap = await tx.get(studentRef);
    if (!studentSnap.exists()) {
      throw new Error('تعذر الوصول لبيانات المحفظة السحابية.');
    }

    const currentStudent = studentSnap.data() as UserProfile;
    const claimedIds = currentStudent.claimedRewardIds || [];
    if (claimedIds.includes(reward.id)) {
      throw new Error('لقد قمت باستبدال هذه المكافأة بالفعل.');
    }

    const currentPoints = Number(currentStudent.points) || 0;
    if (currentPoints < cost) {
      throw new Error(
        `رصيدك الحالي (${currentPoints} نقطة) غير كافٍ — مطلوب ${cost} نقطة للحصول على هذه المكافأة.`
      );
    }

    const newBalance = currentPoints - cost;
    const nextClaimed = Array.from(new Set([...claimedIds, reward.id])).slice(0, 500);
    const entry: PointsHistoryEntry = {
      id: `pt-${Date.now()}`,
      type: 'claim_reward',
      title: `استبدال مكافأة: ${reward.title}`,
      delta: -cost,
      date: new Date().toISOString().split('T')[0],
    };
    const nextHistory = [entry, ...(currentStudent.pointsHistory || [])].slice(0, 50);

    tx.update(studentRef, {
      points: newBalance,
      claimedRewardIds: nextClaimed,
      pointsHistory: nextHistory,
      lastSpendTargetType: 'reward',
      lastSpendTargetId: reward.id,
      updatedAt: serverTimestamp(),
    });

    return {
      ...currentStudent,
      id: uid,
      points: newBalance,
      claimedRewardIds: nextClaimed,
      pointsHistory: nextHistory,
    };
  });
}

// ==========================================
// ADMIN ANNOUNCEMENTS & NOTIFICATIONS CRUD
// ==========================================

export async function saveNotificationToCloud(notif: PlatformNotification): Promise<void> {
  const safeId = (notif.id || `notif_${Date.now()}`).replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 128);
  const path = `notifications/${safeId}`;
  try {
    const ref = doc(db, 'notifications', safeId);
    const validCategories = ['announcement', 'exam', 'lecture', 'urgent', 'congrats'];
    const validTabs = ['lectures', 'quizzes', 'files', 'points'];

    const cleanGrade = (notif.grade || 'all').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 64) || 'all';
    const cleanCtaLabel = notif.ctaLabel?.trim() ? notif.ctaLabel.trim().slice(0, 80) : undefined;
    const cleanCtaTab =
      notif.ctaTab && validTabs.includes(notif.ctaTab) ? notif.ctaTab : undefined;

    const clean = stripUndefinedDeep({
      id: safeId,
      title: (notif.title || 'إعلان جديد').trim().slice(0, 200),
      message: (notif.message || '').trim().slice(0, 3000),
      category: validCategories.includes(notif.category) ? notif.category : 'announcement',
      grade: cleanGrade,
      pinned: Boolean(notif.pinned),
      active: Boolean(notif.active),
      authorName: (notif.authorName || 'أ/ محمد مصطفى').trim().slice(0, 150),
      dateAdded: (notif.dateAdded || new Date().toISOString().split('T')[0]).slice(0, 50),
      ctaLabel: cleanCtaLabel,
      ctaTab: cleanCtaTab,
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
        ctaLabel: cleanCtaLabel ? cleanCtaLabel : deleteField(),
        ctaTab: cleanCtaTab ? cleanCtaTab : deleteField(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteNotificationFromCloud(id: string): Promise<void> {
  const safeId = id.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 128);
  const path = `notifications/${safeId}`;
  try {
    await deleteDoc(doc(db, 'notifications', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// REAL-TIME EXAM SECURITY & ANTI-CHEAT ALERTS
// ==========================================

export async function createExamSecurityAlertToCloud(
  alert: ExamSecurityAlert
): Promise<void> {
  const fbUser = auth.currentUser;
  if (!fbUser) return;
  const safeId = (alert.id || `alert_${Date.now()}`)
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 128);
  const path = `examAlerts/${safeId}`;
  try {
    const clean = stripUndefinedDeep({
      id: safeId,
      studentUid: fbUser.uid,
      studentName: (alert.studentName || 'طالب').trim().slice(0, 200) || 'طالب',
      studentPhone: alert.studentPhone ? alert.studentPhone.trim().slice(0, 50) : undefined,
      studentEmail: alert.studentEmail ? alert.studentEmail.trim().slice(0, 200) : undefined,
      grade: alert.grade
        ? alert.grade.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 64) || 'third'
        : undefined,
      quizId: alert.quizId.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 128),
      quizTitle: (alert.quizTitle || 'اختبار').trim().slice(0, 300) || 'اختبار',
      violationCount: Math.max(1, Math.min(100, Math.round(Number(alert.violationCount) || 1))),
      maxViolations: Math.max(1, Math.min(20, Math.round(Number(alert.maxViolations) || 3))),
      reasons: (Array.isArray(alert.reasons) && alert.reasons.length > 0
        ? alert.reasons
        : ['مخالفة لائحة اللجنة']
      )
        .map((r) => String(r).trim().slice(0, 200))
        .filter(Boolean)
        .slice(0, 30),
      actionTaken: alert.actionTaken === 'cancelled' ? 'cancelled' : 'warning',
      resolved: false,
      createdAtDate: alert.createdAtDate || new Date().toISOString().split('T')[0],
    });
    await setDoc(doc(db, 'examAlerts', safeId), {
      ...clean,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('Exam security alert write failed:', error);
  }
}

export async function updateExamSecurityAlertInCloud(
  alert: ExamSecurityAlert
): Promise<void> {
  const safeId = alert.id.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 128);
  const path = `examAlerts/${safeId}`;
  try {
    await runWithAdminTokenRetry(async () => {
      await updateDoc(doc(db, 'examAlerts', safeId), {
        resolved: Boolean(alert.resolved),
        resolvedNote: alert.resolvedNote ? alert.resolvedNote.trim().slice(0, 500) : deleteField(),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteExamSecurityAlertFromCloud(alertId: string): Promise<void> {
  const safeId = alertId.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 128);
  const path = `examAlerts/${safeId}`;
  try {
    await runWithAdminTokenRetry(async () => {
      await deleteDoc(doc(db, 'examAlerts', safeId));
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}


