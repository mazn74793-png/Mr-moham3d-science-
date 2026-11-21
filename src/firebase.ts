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
  getDocFromServer,
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
import {
  SiteConfig,
  DEFAULT_SITE_CONFIG,
  DEFAULT_TEACHER_PORTRAIT,
  DEFAULT_GRADES,
  DEFAULT_FEATURE_FLAGS,
  PlatformFeatureFlags,
} from './types/siteConfig';

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

let lastCloudWriteError: string | null = null;

export function getLastCloudWriteError(): string | null {
  return lastCloudWriteError;
}

export function setLastCloudWriteError(msg: string | null): void {
  lastCloudWriteError = msg;
}

async function testConnection(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration (client offline).');
    }
  }
}
testConnection();

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
  code: string;
  path: string | null;
  operationType: string | null;
  isPermissionDenied: boolean;
  isUnauthenticated: boolean;
  isNetworkError: boolean;
} {
  let code = String((err as any)?.code || '');
  let rawMessage = err instanceof Error ? err.message : String(err || '');
  let path: string | null = null;
  let operationType: string | null = null;
  try {
    const parsed = JSON.parse(rawMessage);
    if (parsed && typeof parsed.error === 'string') {
      rawMessage = parsed.error;
    }
    if (parsed && typeof parsed.path === 'string') {
      path = parsed.path;
    }
    if (parsed && typeof parsed.operationType === 'string') {
      operationType = parsed.operationType;
    }
  } catch {}
  const lower = `${code} ${rawMessage}`.toLowerCase();
  const isPermissionDenied =
    code === 'permission-denied' ||
    lower.includes('permission-denied') ||
    lower.includes('missing or insufficient permissions');
  const isUnauthenticated =
    code === 'unauthenticated' || lower.includes('unauthenticated');
  const isNetworkError =
    code === 'unavailable' ||
    lower.includes('unavailable') ||
    lower.includes('network') ||
    lower.includes('offline');
  if (!code && isPermissionDenied) code = 'permission-denied';
  else if (!code && isUnauthenticated) code = 'unauthenticated';
  else if (!code && isNetworkError) code = 'unavailable';

  return {
    rawMessage,
    code,
    path,
    operationType,
    isPermissionDenied,
    isUnauthenticated,
    isNetworkError,
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

// Strip undefined, null, and non-finite numbers recursively while preserving Firestore FieldValue sentinels
function isPlainObject(val: unknown): val is Record<string, any> {
  if (val === null || typeof val !== 'object' || Array.isArray(val)) return false;
  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null;
}

function stripUndefinedDeep<T>(value: T): T {
  if (value === null || value === undefined) {
    return undefined as unknown as T;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    return undefined as unknown as T;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefinedDeep(item))
      .filter((item) => item !== undefined) as unknown as T;
  }
  if (isPlainObject(value)) {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      const cleaned = stripUndefinedDeep(v);
      if (cleaned !== undefined) {
        out[k] = cleaned;
      }
    }
    return out as T;
  }
  return value;
}

function sanitizeDocId(raw: string | undefined, fallbackPrefix: string, maxLen = 128): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, maxLen);
  if (cleaned.length > 0) return cleaned;
  return `${fallbackPrefix}_${Date.now()}`.slice(0, maxLen);
}

function sanitizeGradeId(raw: string | undefined, fallback = 'third'): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 64);
  return cleaned.length > 0 ? cleaned : fallback;
}

const ALLOWED_CALLIGRAPHY_FONTS = ['Reem Kufi', 'Aref Ruqaa', 'Amiri', 'Cairo'] as const;
const ALLOWED_BODY_FONTS = ['Cairo', 'Tajawal', 'Almarai'] as const;
const ALLOWED_FEATURE_FLAG_KEYS: (keyof PlatformFeatureFlags)[] = [
  'requireStudentApproval',
  'allowPublicRegistration',
  'allowGoogleAuth',
  'allowManualEmailAuth',
  'enableQuizzes',
  'enableExamAntiCheat',
  'enableHandouts',
  'enablePointsSystem',
  'enableNotifications',
  'enableWhatsAppSupport',
  'maintenanceMode',
];

const SITE_CONFIG_STRING_LIMITS: Partial<Record<keyof SiteConfig, number>> = {
  teacherName: 150,
  teacherTitle: 150,
  tagline: 300,
  heroDescription: 2000,
  heroBadge: 200,
  profileImageUrl: 2000,
  primaryColor: 30,
  googleClientId: 300,
  phone1: 50,
  phone2: 50,
  whatsappNumber: 50,
  facebookUrl: 500,
  youtubeUrl: 500,
  telegramUrl: 500,
  centerBranches: 1000,
  developerName: 150,
  developerHandle: 150,
  developerUrl: 500,
  footerBio: 2000,
  gradeFirstTitleAr: 200,
  gradeFirstTitleEn: 200,
  gradeFirstBadgeAr: 150,
  gradeFirstDescAr: 1000,
  gradeSecondTitleAr: 200,
  gradeSecondTitleEn: 200,
  gradeSecondBadgeAr: 150,
  gradeSecondDescAr: 1000,
  gradeThirdTitleAr: 200,
  gradeThirdTitleEn: 200,
  gradeThirdBadgeAr: 150,
  gradeThirdDescAr: 1000,
  feature1Title: 200,
  feature1Desc: 1000,
  feature2Title: 200,
  feature2Desc: 1000,
  feature3Title: 200,
  feature3Desc: 1000,
  feature4Title: 200,
  feature4Desc: 1000,
};

const ALLOWED_SITE_CONFIG_KEYS: (keyof SiteConfig)[] = [
  'teacherName', 'teacherTitle', 'tagline', 'heroDescription', 'heroBadge',
  'profileImageUrl', 'calligraphyFont', 'bodyFont', 'primaryColor', 'googleClientId',
  'phone1', 'phone2', 'whatsappNumber', 'facebookUrl', 'youtubeUrl', 'telegramUrl',
  'centerBranches', 'developerName', 'developerHandle', 'developerUrl', 'footerBio',
  'footerQuickLinks', 'grades', 'gradeFirstTitleAr', 'gradeFirstTitleEn', 'gradeFirstBadgeAr',
  'gradeFirstDescAr', 'gradeSecondTitleAr', 'gradeSecondTitleEn', 'gradeSecondBadgeAr',
  'gradeSecondDescAr', 'gradeThirdTitleAr', 'gradeThirdTitleEn', 'gradeThirdBadgeAr',
  'gradeThirdDescAr', 'feature1Title', 'feature1Desc', 'feature2Title', 'feature2Desc',
  'feature3Title', 'feature3Desc', 'feature4Title', 'feature4Desc', 'featureFlags',
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
    const mergedSource: SiteConfig = {
      ...DEFAULT_SITE_CONFIG,
      ...config,
    };

    const cleanPayload: Record<string, any> = {};
    for (const key of ALLOWED_SITE_CONFIG_KEYS) {
      const rawVal = mergedSource[key];
      if (rawVal === undefined || rawVal === null) continue;

      if (key in SITE_CONFIG_STRING_LIMITS) {
        const limit = SITE_CONFIG_STRING_LIMITS[key]!;
        let strVal = String(rawVal).slice(0, limit);
        if (key === 'profileImageUrl') {
          if (strVal.startsWith('data:') && strVal.length > 1800) {
            strVal = DEFAULT_TEACHER_PORTRAIT;
          } else if (strVal.length > 2000) {
            strVal = DEFAULT_TEACHER_PORTRAIT;
          }
        }
        cleanPayload[key] = strVal;
        continue;
      }

      if (key === 'calligraphyFont') {
        const candidate = String(rawVal) as SiteConfig['calligraphyFont'];
        cleanPayload.calligraphyFont = ALLOWED_CALLIGRAPHY_FONTS.includes(candidate)
          ? candidate
          : DEFAULT_SITE_CONFIG.calligraphyFont;
        continue;
      }

      if (key === 'bodyFont') {
        const candidate = String(rawVal) as SiteConfig['bodyFont'];
        cleanPayload.bodyFont = ALLOWED_BODY_FONTS.includes(candidate)
          ? candidate
          : DEFAULT_SITE_CONFIG.bodyFont;
        continue;
      }

      if (key === 'grades') {
        const rawGrades = Array.isArray(rawVal) ? rawVal : [];
        const sanitizedGrades = rawGrades
          .map((g) => stripUndefinedDeep(g))
          .filter((g): g is NonNullable<typeof g> => isPlainObject(g) && typeof g.id === 'string' && g.id.trim().length > 0)
          .slice(0, 20);
        cleanPayload.grades = sanitizedGrades.length > 0 ? sanitizedGrades : DEFAULT_GRADES;
        continue;
      }

      if (key === 'footerQuickLinks') {
        const rawLinks = (Array.isArray(rawVal) ? rawVal : []) as unknown[];
        cleanPayload.footerQuickLinks = rawLinks
          .filter((l): l is Record<string, unknown> => isPlainObject(l))
          .map((l, idx) => ({
            id: String(l.id || `link-${idx + 1}`).slice(0, 80),
            title: String(l.title || '').trim().slice(0, 150),
            url: String(l.url || '#').trim().slice(0, 500),
          }))
          .filter((l) => l.title.length > 0)
          .slice(0, 20);
        continue;
      }

      if (key === 'featureFlags') {
        const rawFlags = (isPlainObject(rawVal) ? rawVal : {}) as Record<string, any>;
        const cleanFlags: Partial<PlatformFeatureFlags> = {};
        for (const fk of ALLOWED_FEATURE_FLAG_KEYS) {
          const fv = rawFlags[fk];
          if (typeof fv === 'boolean') {
            cleanFlags[fk] = fv;
          } else {
            cleanFlags[fk] = DEFAULT_FEATURE_FLAGS[fk];
          }
        }
        cleanPayload.featureFlags = cleanFlags;
        continue;
      }
    }

    cleanPayload.teacherName =
      String(cleanPayload.teacherName || '').trim().slice(0, 150) || DEFAULT_SITE_CONFIG.teacherName;
    cleanPayload.teacherTitle =
      String(cleanPayload.teacherTitle || '').trim().slice(0, 150) || DEFAULT_SITE_CONFIG.teacherTitle;
    if (typeof cleanPayload.profileImageUrl !== 'string') {
      cleanPayload.profileImageUrl = '';
    }
    if (!Array.isArray(cleanPayload.grades) || cleanPayload.grades.length === 0) {
      cleanPayload.grades = DEFAULT_GRADES;
    }

    await runWithAdminTokenRetry(async () => {
      await setDoc(doc(db, 'publicConfig', 'site'), {
        ...cleanPayload,
        updatedAt: serverTimestamp(),
      });
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
  const safeId = sanitizeDocId(lecture.id, 'lec');
  const path = `lectures/${safeId}`;
  try {
    await runWithAdminTokenRetry(async () => {
      const ref = doc(db, 'lectures', safeId);
      const cleanUnitId =
        typeof lecture.unitId === 'string' && lecture.unitId.trim()
          ? lecture.unitId.trim().slice(0, 128)
          : undefined;
      const cleanGrade = sanitizeGradeId(lecture.grade, 'third');
      const cleanPdfUrl =
        typeof lecture.pdfUrl === 'string' && lecture.pdfUrl.trim()
          ? lecture.pdfUrl.trim().slice(0, 2000)
          : undefined;
      const cleanPdfTitle =
        typeof lecture.pdfTitle === 'string' && lecture.pdfTitle.trim()
          ? lecture.pdfTitle.trim().slice(0, 300)
          : undefined;
      const cleanQuizId =
        typeof lecture.quizId === 'string' && lecture.quizId.trim()
          ? sanitizeDocId(lecture.quizId, 'quiz', 128)
          : undefined;
      const cleanSessionOrder =
        lecture.sessionOrder !== undefined &&
        lecture.sessionOrder !== null &&
        Number.isFinite(Number(lecture.sessionOrder))
          ? Math.round(Number(lecture.sessionOrder))
          : undefined;

      const clean = stripUndefinedDeep({
        id: safeId,
        title: String(lecture.title || 'محاضرة جديدة').trim().slice(0, 300) || 'محاضرة جديدة',
        grade: cleanGrade,
        gradeLabel:
          String(lecture.gradeLabel || cleanGrade).trim().slice(0, 150) || cleanGrade,
        unitId: cleanUnitId,
        chapter: String(lecture.chapter || '').trim().slice(0, 250),
        duration: String(lecture.duration || '45 دقيقة').trim().slice(0, 100) || '45 دقيقة',
        videoUrl: String(lecture.videoUrl || '').trim().slice(0, 2000),
        thumbnailUrl:
          String(lecture.thumbnailUrl || '/images/chemistry_lab_visual_1794141316456.jpg')
            .trim()
            .slice(0, 2000) || '/images/chemistry_lab_visual_1794141316456.jpg',
        pdfUrl: cleanPdfUrl,
        pdfTitle: cleanPdfTitle,
        description: String(lecture.description || '').trim().slice(0, 3000),
        isFreePreview: Boolean(lecture.isFreePreview),
        viewsCount: Math.max(0, Math.round(Number(lecture.viewsCount) || 0)),
        dateAdded:
          String(lecture.dateAdded || new Date().toISOString().split('T')[0]).slice(0, 50),
        sessionOrder: cleanSessionOrder,
        quizId: cleanQuizId,
        pointsCost: Math.max(0, Math.min(100000, Math.round(Number(lecture.pointsCost) || 0))),
      });

      const snap = await getDoc(ref);
      const existingCreatedAt = snap.exists() ? snap.data()?.createdAt : undefined;
      await setDoc(ref, {
        ...clean,
        createdAt: existingCreatedAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteLectureFromCloud(id: string): Promise<void> {
  const safeId = sanitizeDocId(id, 'lec');
  const path = `lectures/${safeId}`;
  try {
    await runWithAdminTokenRetry(async () => {
      await deleteDoc(doc(db, 'lectures', safeId));
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveAttachmentToCloud(file: AttachmentFile): Promise<void> {
  const safeId = sanitizeDocId(file.id, 'att');
  const path = `attachments/${safeId}`;
  try {
    await runWithAdminTokenRetry(async () => {
      const ref = doc(db, 'attachments', safeId);
      const cleanGrade = sanitizeGradeId(file.grade, 'third');
      const cleanFileType =
        file.fileType === 'doc' || file.fileType === 'image' ? file.fileType : 'pdf';
      const cleanPageCount =
        file.pageCount !== undefined &&
        file.pageCount !== null &&
        Number.isFinite(Number(file.pageCount))
          ? Math.max(0, Math.round(Number(file.pageCount)))
          : undefined;
      const clean = stripUndefinedDeep({
        id: safeId,
        title: String(file.title || 'ملف جديد').trim().slice(0, 300) || 'ملف جديد',
        grade: cleanGrade,
        gradeLabel: String(file.gradeLabel || cleanGrade).trim().slice(0, 150) || cleanGrade,
        chapter: String(file.chapter || '').trim().slice(0, 250),
        fileSize: String(file.fileSize || '1.0 MB').trim().slice(0, 50) || '1.0 MB',
        fileType: cleanFileType,
        downloadUrl: String(file.downloadUrl || '#').trim().slice(0, 2000) || '#',
        pageCount: cleanPageCount,
        dateAdded: String(file.dateAdded || new Date().toISOString().split('T')[0]).slice(0, 50),
        pointsCost: Math.max(0, Math.min(100000, Math.round(Number(file.pointsCost) || 0))),
      });

      const snap = await getDoc(ref);
      const existingCreatedAt = snap.exists() ? snap.data()?.createdAt : undefined;
      await setDoc(ref, {
        ...clean,
        createdAt: existingCreatedAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAttachmentFromCloud(id: string): Promise<void> {
  const safeId = sanitizeDocId(id, 'att');
  const path = `attachments/${safeId}`;
  try {
    await runWithAdminTokenRetry(async () => {
      await deleteDoc(doc(db, 'attachments', safeId));
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveQuizToCloud(quiz: Quiz): Promise<void> {
  const safeId = sanitizeDocId(quiz.id, 'quiz');
  const path = `quizzes/${safeId}`;
  try {
    await runWithAdminTokenRetry(async () => {
      const ref = doc(db, 'quizzes', safeId);
      const cleanInstructions = Array.isArray(quiz.examInstructions)
        ? quiz.examInstructions
            .map((s) => String(s ?? '').trim().slice(0, 500))
            .filter(Boolean)
            .slice(0, 25)
        : undefined;
      const cleanQuestions = Array.isArray(quiz.questions)
        ? quiz.questions
            .map((q) => stripUndefinedDeep(q))
            .filter((q) => isPlainObject(q))
            .slice(0, 200)
        : [];
      const cleanLectureId =
        typeof quiz.lectureId === 'string' && quiz.lectureId.trim()
          ? sanitizeDocId(quiz.lectureId, 'lec', 128)
          : undefined;

      const clean = stripUndefinedDeep({
        id: safeId,
        title: String(quiz.title || 'اختبار جديد').trim().slice(0, 300) || 'اختبار جديد',
        grade: sanitizeGradeId(quiz.grade, 'third'),
        chapter: String(quiz.chapter || '').trim().slice(0, 250),
        durationMinutes: Math.max(1, Math.min(600, Math.round(Number(quiz.durationMinutes) || 15))),
        warningMinutes:
          quiz.warningMinutes !== undefined && quiz.warningMinutes !== null
            ? Math.max(0, Math.min(120, Math.round(Number(quiz.warningMinutes) || 0)))
            : undefined,
        passingScore:
          quiz.passingScore !== undefined && quiz.passingScore !== null
            ? Math.max(0, Math.min(100, Math.round(Number(quiz.passingScore) || 60)))
            : undefined,
        requireAgreement:
          quiz.requireAgreement !== undefined && quiz.requireAgreement !== null
            ? Boolean(quiz.requireAgreement)
            : undefined,
        examInstructions: cleanInstructions,
        proctoringEnabled:
          quiz.proctoringEnabled !== undefined && quiz.proctoringEnabled !== null
            ? Boolean(quiz.proctoringEnabled)
            : undefined,
        maxViolations:
          quiz.maxViolations !== undefined && quiz.maxViolations !== null
            ? Math.max(1, Math.min(20, Math.round(Number(quiz.maxViolations) || 3)))
            : undefined,
        lectureId: cleanLectureId,
        questions: cleanQuestions,
      });

      const snap = await getDoc(ref);
      const existingCreatedAt = snap.exists() ? snap.data()?.createdAt : undefined;
      await setDoc(ref, {
        ...clean,
        createdAt: existingCreatedAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteQuizFromCloud(id: string): Promise<void> {
  const safeId = sanitizeDocId(id, 'quiz');
  const path = `quizzes/${safeId}`;
  try {
    await runWithAdminTokenRetry(async () => {
      await deleteDoc(doc(db, 'quizzes', safeId));
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveStudentToCloud(
  student: UserProfile,
  authUid?: string,
  allowPointsOverride = false
): Promise<void> {
  const docId = sanitizeDocId(student.id, 'std');
  const path = `students/${docId}`;
  try {
    const executeWrite = async () => {
      const ref = doc(db, 'students', docId);
      const snap = await getDoc(ref);
      const existingData = snap.exists() ? (snap.data() as Record<string, any>) : null;
      const uid =
        String(existingData?.uid || (student as { uid?: string }).uid || authUid || auth.currentUser?.uid || docId)
          .trim()
          .slice(0, 128) || docId;
      const cleanGrade = sanitizeGradeId(student.grade, 'third');
      const cleanCancelledQuizIds = Array.isArray(student.cancelledQuizIds)
        ? student.cancelledQuizIds.map((x) => String(x)).filter(Boolean).slice(0, 200)
        : undefined;
      const cleanQuizScores = isPlainObject(student.quizScores)
        ? stripUndefinedDeep(student.quizScores)
        : {};
      const cleanQuizViolations = isPlainObject(student.quizViolations)
        ? stripUndefinedDeep(student.quizViolations)
        : undefined;

      const baseClean = stripUndefinedDeep({
        id: docId,
        uid,
        name: String(student.name || '').trim().slice(0, 200) || 'طالب منصة',
        email: String(student.email || '').trim().slice(0, 200),
        role: student.role === 'teacher' ? 'teacher' : 'student',
        grade: cleanGrade,
        phone: String(student.phone || '').trim().slice(0, 50),
        parentPhone: String(student.parentPhone || '').trim().slice(0, 50),
        governorate: String(student.governorate || 'القاهرة').trim().slice(0, 150),
        avatarUrl: String(student.avatarUrl || '').slice(0, 2000),
        score: Number.isFinite(Number(student.score)) ? Number(student.score) : 0,
        profileCompleted: Boolean(student.profileCompleted),
        watchedLectureIds: Array.isArray(student.watchedLectureIds)
          ? student.watchedLectureIds.map((x) => String(x)).filter(Boolean).slice(0, 500)
          : [],
        passedQuizIds: Array.isArray(student.passedQuizIds)
          ? student.passedQuizIds.map((x) => String(x)).filter(Boolean).slice(0, 500)
          : [],
        quizScores: cleanQuizScores,
        cancelledQuizIds: cleanCancelledQuizIds,
        quizViolations: cleanQuizViolations,
        joinedAt: String(
          student.joinedAt || existingData?.joinedAt || new Date().toISOString().split('T')[0]
        ).slice(0, 50),
      });

      const validApproval =
        student.approvalStatus === 'pending' ||
        student.approvalStatus === 'approved' ||
        student.approvalStatus === 'rejected'
          ? student.approvalStatus
          : existingData?.approvalStatus === 'pending' ||
              existingData?.approvalStatus === 'approved' ||
              existingData?.approvalStatus === 'rejected'
            ? existingData.approvalStatus
            : 'approved';

      const cleanBlockReason =
        typeof student.blockReason === 'string' && student.blockReason.trim()
          ? student.blockReason.trim().slice(0, 500)
          : undefined;

      if (allowPointsOverride) {
        // Full whitelisted write for Admin saves so legacy null/extra fields are scrubbed cleanly
        const resolvedUnlockedLectures = Array.isArray(student.unlockedLectureIds)
          ? student.unlockedLectureIds
          : Array.isArray(existingData?.unlockedLectureIds)
            ? existingData.unlockedLectureIds
            : [];
        const resolvedUnlockedAttachments = Array.isArray(student.unlockedAttachmentIds)
          ? student.unlockedAttachmentIds
          : Array.isArray(existingData?.unlockedAttachmentIds)
            ? existingData.unlockedAttachmentIds
            : [];
        const resolvedClaimedRewards = Array.isArray(student.claimedRewardIds)
          ? student.claimedRewardIds
          : Array.isArray(existingData?.claimedRewardIds)
            ? existingData.claimedRewardIds
            : [];
        const resolvedPointsHistory = Array.isArray(student.pointsHistory)
          ? student.pointsHistory
          : Array.isArray(existingData?.pointsHistory)
            ? existingData.pointsHistory
            : [];

        const rawSpendType = existingData?.lastSpendTargetType;
        const validSpendType =
          rawSpendType === 'lecture' || rawSpendType === 'attachment' || rawSpendType === 'reward'
            ? rawSpendType
            : undefined;
        const validSpendTargetId =
          typeof existingData?.lastSpendTargetId === 'string' && existingData.lastSpendTargetId.trim()
            ? existingData.lastSpendTargetId.trim().slice(0, 128)
            : undefined;
        const validRedeemedCode =
          typeof existingData?.lastRedeemedCode === 'string' && existingData.lastRedeemedCode.trim()
            ? existingData.lastRedeemedCode.trim().slice(0, 128)
            : undefined;

        const adminPayload = stripUndefinedDeep({
          ...baseClean,
          points: Math.max(0, Math.min(10000000, Math.round(Number(student.points ?? existingData?.points) || 0))),
          unlockedLectureIds: resolvedUnlockedLectures
            .map((x: any) => String(x))
            .filter(Boolean)
            .slice(0, 500),
          unlockedAttachmentIds: resolvedUnlockedAttachments
            .map((x: any) => String(x))
            .filter(Boolean)
            .slice(0, 500),
          claimedRewardIds: resolvedClaimedRewards
            .map((x: any) => String(x))
            .filter(Boolean)
            .slice(0, 500),
          pointsHistory: resolvedPointsHistory
            .map((entry: any) => stripUndefinedDeep(entry))
            .filter((entry: any) => isPlainObject(entry))
            .slice(0, 50),
          lastRedeemedCode: validRedeemedCode,
          lastSpendTargetType: validSpendType,
          lastSpendTargetId: validSpendTargetId,
          isBlocked:
            student.isBlocked !== undefined
              ? Boolean(student.isBlocked)
              : Boolean(existingData?.isBlocked),
          blockReason: cleanBlockReason,
          approvalStatus: validApproval,
        });

        await setDoc(ref, {
          ...adminPayload,
          createdAt: existingData?.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return;
      }

      if (!snap.exists()) {
        await setDoc(ref, {
          ...baseClean,
          points: 0,
          unlockedLectureIds: [],
          unlockedAttachmentIds: [],
          claimedRewardIds: [],
          pointsHistory: [],
          approvalStatus:
            student.role === 'teacher' || student.approvalStatus === 'approved'
              ? 'approved'
              : 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, {
          ...baseClean,
          updatedAt: serverTimestamp(),
        });
      }
    };

    if (allowPointsOverride) {
      await runWithAdminTokenRetry(executeWrite);
    } else {
      await executeWrite();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteStudentFromCloud(studentId: string): Promise<void> {
  const safeId = sanitizeDocId(studentId, 'std');
  const path = `students/${safeId}`;
  try {
    await runWithAdminTokenRetry(async () => {
      await deleteDoc(doc(db, 'students', safeId));
    });
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
    await runWithAdminTokenRetry(async () => {
      const ref = doc(db, 'redeemCodes', cleanCode);
      const snap = await getDoc(ref);
      const existingData = snap.exists() ? (snap.data() as Record<string, any>) : null;
      const resolvedMaxUses = Math.max(1, Math.min(100000, Math.round(Number(item.maxUses) || 1)));
      const rawUsed = snap.exists() ? Number(item.usedCount ?? existingData?.usedCount ?? 0) : 0;
      const resolvedUsed = Math.max(0, Math.min(resolvedMaxUses, Math.round(rawUsed || 0)));

      const clean = stripUndefinedDeep({
        id: cleanCode,
        code: cleanCode,
        points: Math.max(1, Math.min(100000, Math.round(Number(item.points) || 10))),
        maxUses: resolvedMaxUses,
        usedCount: resolvedUsed,
        active: Boolean(item.active),
        label:
          typeof item.label === 'string' && item.label.trim()
            ? item.label.trim().slice(0, 150)
            : undefined,
        createdBy:
          typeof item.createdBy === 'string' && item.createdBy.trim()
            ? item.createdBy.trim().slice(0, 150)
            : String(existingData?.createdBy || auth.currentUser?.email || 'admin').slice(0, 150),
        createdAtDate: String(
          item.createdAtDate || existingData?.createdAtDate || new Date().toISOString().split('T')[0]
        ).slice(0, 50),
      });

      await setDoc(ref, {
        ...clean,
        createdAt: existingData?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveRedeemCodesBatchToCloud(items: RedeemCode[]): Promise<void> {
  if (items.length === 0) return;
  try {
    await runWithAdminTokenRetry(async () => {
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
          label:
            typeof item.label === 'string' && item.label.trim()
              ? item.label.trim().slice(0, 150)
              : undefined,
          createdBy: String(auth.currentUser?.email || 'admin').slice(0, 150),
          createdAtDate: String(
            item.createdAtDate || new Date().toISOString().split('T')[0]
          ).slice(0, 50),
        });
        batch.set(ref, {
          ...clean,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    });
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
    await runWithAdminTokenRetry(async () => {
      const ref = doc(db, 'redeemCodes', cleanCode);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data() as Record<string, any>;
        const maxUses = Math.max(1, Math.min(100000, Math.round(Number(d.maxUses) || 1)));
        const usedCount = Math.max(0, Math.min(maxUses, Math.round(Number(d.usedCount) || 0)));
        const clean = stripUndefinedDeep({
          id: cleanCode,
          code: cleanCode,
          points: Math.max(1, Math.min(100000, Math.round(Number(d.points) || 10))),
          maxUses,
          usedCount,
          active: Boolean(active),
          label:
            typeof d.label === 'string' && d.label.trim()
              ? d.label.trim().slice(0, 150)
              : undefined,
          createdBy:
            typeof d.createdBy === 'string' && d.createdBy.trim()
              ? d.createdBy.trim().slice(0, 150)
              : String(auth.currentUser?.email || 'admin').slice(0, 150),
          createdAtDate: String(d.createdAtDate || new Date().toISOString().split('T')[0]).slice(0, 50),
        });
        await setDoc(ref, {
          ...clean,
          createdAt: d.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, {
          active: Boolean(active),
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteRedeemCodeFromCloud(codeId: string): Promise<void> {
  const cleanCode = normalizeRedeemCodeInput(codeId);
  const path = `redeemCodes/${cleanCode}`;
  try {
    await runWithAdminTokenRetry(async () => {
      await deleteDoc(doc(db, 'redeemCodes', cleanCode));
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function savePointRewardToCloud(reward: PointReward): Promise<void> {
  const safeId = sanitizeDocId(reward.id, 'rew');
  const path = `rewards/${safeId}`;
  try {
    await runWithAdminTokenRetry(async () => {
      const ref = doc(db, 'rewards', safeId);
      const validCategories = ['perk', 'badge', 'discount', 'material'];
      const cleanCategory = validCategories.includes(reward.category) ? reward.category : 'perk';
      const clean = stripUndefinedDeep({
        id: safeId,
        title: String(reward.title || 'مكافأة جديدة').trim().slice(0, 300) || 'مكافأة جديدة',
        description: String(reward.description || '').trim().slice(0, 1500),
        pointsCost: Math.max(1, Math.min(100000, Math.round(Number(reward.pointsCost) || 50))),
        category: cleanCategory,
        grade: sanitizeGradeId(reward.grade, 'all'),
        active: Boolean(reward.active),
        dateAdded: String(reward.dateAdded || new Date().toISOString().split('T')[0]).slice(0, 50),
      });

      const snap = await getDoc(ref);
      const existingCreatedAt = snap.exists() ? snap.data()?.createdAt : undefined;
      await setDoc(ref, {
        ...clean,
        createdAt: existingCreatedAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePointRewardFromCloud(rewardId: string): Promise<void> {
  const safeId = sanitizeDocId(rewardId, 'rew');
  const path = `rewards/${safeId}`;
  try {
    await runWithAdminTokenRetry(async () => {
      await deleteDoc(doc(db, 'rewards', safeId));
    });
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
  const safeId = sanitizeDocId(notif.id, 'notif');
  const path = `notifications/${safeId}`;
  try {
    await runWithAdminTokenRetry(async () => {
      const ref = doc(db, 'notifications', safeId);
      const validCategories = ['announcement', 'exam', 'lecture', 'urgent', 'congrats'];
      const validTabs = ['lectures', 'quizzes', 'files', 'points', 'study-hub'];

      const cleanGrade = sanitizeGradeId(notif.grade, 'all');
      const cleanCtaLabel =
        typeof notif.ctaLabel === 'string' && notif.ctaLabel.trim()
          ? notif.ctaLabel.trim().slice(0, 80)
          : undefined;
      const cleanCtaTab =
        notif.ctaTab && validTabs.includes(notif.ctaTab) ? notif.ctaTab : undefined;

      const clean = stripUndefinedDeep({
        id: safeId,
        title: String(notif.title || 'إعلان جديد').trim().slice(0, 200) || 'إعلان جديد',
        message: String(notif.message || 'تنويه هام للطلاب').trim().slice(0, 3000) || 'تنويه هام للطلاب',
        category: validCategories.includes(notif.category) ? notif.category : 'announcement',
        grade: cleanGrade,
        pinned: Boolean(notif.pinned),
        active: Boolean(notif.active),
        authorName:
          String(notif.authorName || 'أ/ محمد مصطفى').trim().slice(0, 150) || 'أ/ محمد مصطفى',
        dateAdded: String(notif.dateAdded || new Date().toISOString().split('T')[0]).slice(0, 50),
        ctaLabel: cleanCtaLabel,
        ctaTab: cleanCtaTab,
      });

      const snap = await getDoc(ref);
      const existingCreatedAt = snap.exists() ? snap.data()?.createdAt : undefined;
      await setDoc(ref, {
        ...clean,
        createdAt: existingCreatedAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteNotificationFromCloud(id: string): Promise<void> {
  const safeId = sanitizeDocId(id, 'notif');
  const path = `notifications/${safeId}`;
  try {
    await runWithAdminTokenRetry(async () => {
      await deleteDoc(doc(db, 'notifications', safeId));
    });
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
  const safeId = sanitizeDocId(alert.id, 'alert');
  try {
    const clean = stripUndefinedDeep({
      id: safeId,
      studentUid: fbUser.uid,
      studentName: String(alert.studentName || 'طالب').trim().slice(0, 200) || 'طالب',
      studentPhone:
        typeof alert.studentPhone === 'string' && alert.studentPhone.trim()
          ? alert.studentPhone.trim().slice(0, 50)
          : undefined,
      studentEmail:
        typeof alert.studentEmail === 'string' && alert.studentEmail.trim()
          ? alert.studentEmail.trim().slice(0, 200)
          : undefined,
      grade: alert.grade ? sanitizeGradeId(alert.grade, 'third') : undefined,
      quizId: sanitizeDocId(alert.quizId, 'quiz'),
      quizTitle: String(alert.quizTitle || 'اختبار').trim().slice(0, 300) || 'اختبار',
      violationCount: Math.max(1, Math.min(100, Math.round(Number(alert.violationCount) || 1))),
      maxViolations: Math.max(1, Math.min(20, Math.round(Number(alert.maxViolations) || 3))),
      reasons: (Array.isArray(alert.reasons) && alert.reasons.length > 0
        ? alert.reasons
        : ['مخالفة لائحة اللجنة']
      )
        .map((r) => String(r ?? '').trim().slice(0, 200))
        .filter(Boolean)
        .slice(0, 30),
      actionTaken: alert.actionTaken === 'cancelled' ? 'cancelled' : 'warning',
      resolved: false,
      createdAtDate: String(
        alert.createdAtDate || new Date().toISOString().split('T')[0]
      ).slice(0, 50),
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
  const safeId = sanitizeDocId(alert.id, 'alert');
  const path = `examAlerts/${safeId}`;
  try {
    await runWithAdminTokenRetry(async () => {
      const ref = doc(db, 'examAlerts', safeId);
      const snap = await getDoc(ref);
      const d = snap.exists() ? (snap.data() as Record<string, any>) : null;
      const source = { ...(d || {}), ...alert };
      const resolvedReasons = (
        Array.isArray(source.reasons) && source.reasons.length > 0
          ? source.reasons
          : ['مخالفة لائحة اللجنة']
      )
        .map((r: any) => String(r ?? '').trim().slice(0, 200))
        .filter(Boolean)
        .slice(0, 30);

      const clean = stripUndefinedDeep({
        id: safeId,
        studentUid: String(source.studentUid || d?.studentUid || 'unknown').slice(0, 128),
        studentName: String(source.studentName || 'طالب').trim().slice(0, 200) || 'طالب',
        studentPhone:
          typeof source.studentPhone === 'string' && source.studentPhone.trim()
            ? source.studentPhone.trim().slice(0, 50)
            : undefined,
        studentEmail:
          typeof source.studentEmail === 'string' && source.studentEmail.trim()
            ? source.studentEmail.trim().slice(0, 200)
            : undefined,
        grade: source.grade ? sanitizeGradeId(source.grade, 'third') : undefined,
        quizId: sanitizeDocId(source.quizId, 'quiz'),
        quizTitle: String(source.quizTitle || 'اختبار').trim().slice(0, 300) || 'اختبار',
        violationCount: Math.max(1, Math.min(100, Math.round(Number(source.violationCount) || 1))),
        maxViolations: Math.max(1, Math.min(20, Math.round(Number(source.maxViolations) || 3))),
        reasons: resolvedReasons.length > 0 ? resolvedReasons : ['مخالفة لائحة اللجنة'],
        actionTaken: source.actionTaken === 'cancelled' ? 'cancelled' : 'warning',
        resolved: Boolean(alert.resolved),
        resolvedNote:
          typeof alert.resolvedNote === 'string' && alert.resolvedNote.trim()
            ? alert.resolvedNote.trim().slice(0, 500)
            : undefined,
        createdAtDate: String(
          source.createdAtDate || new Date().toISOString().split('T')[0]
        ).slice(0, 50),
      });

      await setDoc(ref, {
        ...clean,
        createdAt: d?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteExamSecurityAlertFromCloud(alertId: string): Promise<void> {
  const safeId = sanitizeDocId(alertId, 'alert');
  const path = `examAlerts/${safeId}`;
  try {
    await runWithAdminTokenRetry(async () => {
      await deleteDoc(doc(db, 'examAlerts', safeId));
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}


