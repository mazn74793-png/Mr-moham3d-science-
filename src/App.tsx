import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { onAuthStateChanged, signOut, getRedirectResult, reload, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { Clock3, XCircle, MessageCircle, LogOut, ShieldCheck, Wrench } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { AcademicYearsSection } from './components/AcademicYearsSection';
import { Footer, AppView } from './components/Footer';
import { useLanguage } from './context/LanguageContext';
import { INITIAL_CLOUDINARY_CONFIG } from './data/initialData';
import { buildWhatsAppSupportUrl, isStudentApproved } from './utils/whatsapp';
import {
  Lecture,
  AttachmentFile,
  Quiz,
  CloudinaryConfig,
  UserProfile,
  GradeLevel,
  RedeemCode,
  PointReward,
  PlatformNotification,
  ExamSecurityAlert,
} from './types';
import {
  SiteConfig,
  DEFAULT_SITE_CONFIG,
  DEFAULT_TEACHER_PORTRAIT,
  getGradeDisplayName,
  getResolvedFeatureFlags,
} from './types/siteConfig';
import { LinkPasswordSetup } from './components/LinkPasswordSetup';
import { DashboardLayoutSkeleton } from './components/teacher/DashboardSkeleton';
import {
  auth,
  db,
  extractFirestoreErrorDetails,
  fetchAllStudentsAsAdmin,
  isGoogleUserWithoutPassword,
  savePublicSiteConfigToCloud,
  saveAdminConfigToCloud,
  saveAdminEmailsToCloud,
  saveLectureToCloud,
  deleteLectureFromCloud,
  saveAttachmentToCloud,
  deleteAttachmentFromCloud,
  saveQuizToCloud,
  deleteQuizFromCloud,
  saveStudentToCloud,
  deleteStudentFromCloud,
  getStudentFromCloud,
  fetchAdminConfigIfAuthorized,
  clearAdminConfigCache,
  saveRedeemCodeToCloud,
  saveRedeemCodesBatchToCloud,
  toggleRedeemCodeActiveInCloud,
  deleteRedeemCodeFromCloud,
  savePointRewardToCloud,
  deletePointRewardFromCloud,
  saveNotificationToCloud,
  deleteNotificationFromCloud,
  redeemCodeForStudent,
  unlockLectureWithPoints,
  unlockAttachmentWithPoints,
  claimRewardWithPoints,
  createExamSecurityAlertToCloud,
  updateExamSecurityAlertInCloud,
  deleteExamSecurityAlertFromCloud,
} from './firebase';

// Lazy-load heavy views and modals for ultra-fast initial landing page load
const StudentPortal = lazy(() =>
  import('./components/StudentPortal').then((m) => ({ default: m.StudentPortal }))
);
const TeacherDashboard = lazy(() =>
  import('./components/TeacherDashboard').then((m) => ({ default: m.TeacherDashboard }))
);
const AuthModals = lazy(() =>
  import('./components/AuthModals').then((m) => ({ default: m.AuthModals }))
);
const StudentOnboardingModal = lazy(() =>
  import('./components/StudentOnboardingModal').then((m) => ({ default: m.StudentOnboardingModal }))
);

function sanitizeProfileImageUrl(url?: string): string {
  if (!url || !url.trim()) return DEFAULT_TEACHER_PORTRAIT;
  if (url.includes('teacher_mohamed_mostafa_1794141316649')) return DEFAULT_TEACHER_PORTRAIT;
  return url;
}

const ViewLoadingFallback = () => {
  const { lang } = useLanguage();
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3 text-teal-600 dark:text-teal-400">
        <div className="w-10 h-10 border-4 border-teal-500/30 border-t-teal-600 rounded-full animate-spin" />
        <span className="text-xs font-bold font-cairo">
          {lang === 'en' ? 'Loading workspace...' : 'جاري التحميل...'}
        </span>
      </div>
    </div>
  );
};

export default function App() {
  const { lang, isRtl } = useLanguage();
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('mm_theme') === 'dark';
  });

  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    const saved = localStorage.getItem('mm_site_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SITE_CONFIG,
          ...parsed,
          adminEmails: DEFAULT_SITE_CONFIG.adminEmails,
          profileImageUrl: sanitizeProfileImageUrl(parsed?.profileImageUrl),
        };
      } catch {
        return DEFAULT_SITE_CONFIG;
      }
    }
    return DEFAULT_SITE_CONFIG;
  });

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [resolvingAuth, setResolvingAuth] = useState<boolean>(() => {
    try {
      const pending = sessionStorage.getItem('mm_auth_redirect_pending') === '1';
      const ts = Number(sessionStorage.getItem('mm_auth_redirect_ts') || '0');
      return pending && Date.now() - ts < 5 * 60 * 1000;
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('mm_user') || sessionStorage.getItem('mm_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserProfile;
        // Require Firebase Auth confirmation before elevating to teacher role
        if (parsed?.role === 'teacher') return null;
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [syncNotice, setSyncNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [studentsSyncError, setStudentsSyncError] = useState<string | null>(null);
  const [adminCloudError, setAdminCloudError] = useState<string | null>(null);
  const [lastCloudError, setLastCloudError] = useState<string | null>(null);

  const [currentView, setCurrentView] = useState<AppView>(() => {
    const savedView = localStorage.getItem('mm_last_view');
    const savedUser = localStorage.getItem('mm_user');
    if (savedView === 'student' && savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as UserProfile;
        if (parsed && parsed.role !== 'teacher') return 'student';
      } catch {}
    }
    return 'landing';
  });
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');
  const [teacherInitialTab, setTeacherInitialTab] = useState<'overview' | 'site-customizer'>('overview');
  const [inExamFocusMode, setInExamFocusMode] = useState(false);

  const [lectures, setLectures] = useState<Lecture[]>(() => {
    const saved = localStorage.getItem('mm_lectures');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [attachments, setAttachments] = useState<AttachmentFile[]>(() => {
    const saved = localStorage.getItem('mm_attachments');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
    const saved = localStorage.getItem('mm_quizzes');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [students, setStudents] = useState<UserProfile[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [cloudinaryConfig, setCloudinaryConfig] = useState<CloudinaryConfig>(
    INITIAL_CLOUDINARY_CONFIG
  );

  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>([]);

  const [rewards, setRewards] = useState<PointReward[]>(() => {
    const saved = localStorage.getItem('mm_rewards');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState<PlatformNotification[]>(() => {
    const saved = localStorage.getItem('mm_notifications');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [examAlerts, setExamAlerts] = useState<ExamSecurityAlert[]>([]);

  const [passwordPromptDismissedUids, setPasswordPromptDismissedUids] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem('mm_skip_pw_uids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const adminBootstrappedRef = useRef(false);
  const adminEmailsRef = useRef<string[]>(siteConfig.adminEmails || ['mizoo2y2@gmail.com']);
  const siteConfigRef = useRef(siteConfig);
  const cloudinaryConfigRef = useRef(cloudinaryConfig);
  const studentsRef = useRef(students);
  const currentUserRef = useRef(currentUser);
  const currentViewRef = useRef<AppView>(currentView);
  const hasManualNavigatedRef = useRef(false);
  const lastLoginHydratedRef = useRef<{ uid: string; ts: number } | null>(null);
  const justSignedInAuthRef = useRef<number>(0);
  const examAlertsHydratedRef = useRef(false);
  const knownExamAlertIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    adminEmailsRef.current = siteConfig.adminEmails || ['mizoo2y2@gmail.com'];
    siteConfigRef.current = siteConfig;
  }, [siteConfig]);

  useEffect(() => {
    cloudinaryConfigRef.current = cloudinaryConfig;
  }, [cloudinaryConfig]);

  useEffect(() => {
    studentsRef.current = students;
  }, [students]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  const isEmailAdmin = useCallback((email?: string | null, extraEmails?: string[]) => {
    if (!email) return false;
    const clean = email.toLowerCase().trim();
    if (clean === 'mizoo2y2@gmail.com') return true;
    const list = extraEmails || [
      ...(adminEmailsRef.current || []),
      ...(siteConfigRef.current?.adminEmails || []),
    ];
    return list.some((e) => e.toLowerCase().trim() === clean);
  }, []);

  const isUserAdmin = useCallback(
    (user: UserProfile | null) => {
      const activeFbUser = firebaseUser || auth.currentUser;
      if (!activeFbUser || !activeFbUser.email) return false;
      const hasGoogle = Boolean(
        activeFbUser.providerData?.some((p) => p.providerId === 'google.com')
      );
      if (!activeFbUser.emailVerified && !hasGoogle) return false;
      if (!user || user.role !== 'teacher') return false;
      return isEmailAdmin(activeFbUser.email);
    },
    [isEmailAdmin, firebaseUser]
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mm_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mm_theme', 'light');
    }
  }, [darkMode]);

  const showNotice = useCallback((type: 'success' | 'error', message: string) => {
    setSyncNotice({ type, message });
  }, []);

  useEffect(() => {
    if (!syncNotice) return;
    const t = setTimeout(() => setSyncNotice(null), 4000);
    return () => clearTimeout(t);
  }, [syncNotice]);

  const hasPendingRedirectFlag = useCallback(() => {
    try {
      const urlHasAuth =
        window.location.search.includes('apiKey=') ||
        window.location.search.includes('state=');
      if (urlHasAuth) return true;
      const pending = sessionStorage.getItem('mm_auth_redirect_pending') === '1';
      if (!pending) return false;
      const ts = Number(sessionStorage.getItem('mm_auth_redirect_ts') || '0');
      return ts === 0 || Date.now() - ts < 5 * 60 * 1000;
    } catch {
      return false;
    }
  }, []);

  const clearRedirectFlags = useCallback(() => {
    try {
      sessionStorage.removeItem('mm_auth_redirect_pending');
      sessionStorage.removeItem('mm_auth_redirect_ts');
    } catch {}
  }, []);

  const hydrateFirebaseUser = useCallback(
    async (fbUser: FirebaseUser, options?: { fromRedirect?: boolean }) => {
      setFirebaseUser(fbUser);

      const email = fbUser.email || '';
      const cleanEmail = email.toLowerCase().trim();
      const cfg = siteConfigRef.current;
      const isMidAuthFlow =
        currentViewRef.current === 'auth' ||
        Boolean(options?.fromRedirect) ||
        Date.now() - justSignedInAuthRef.current < 10000;

      // 1. Instant optimistic user hydration BEFORE awaiting Firestore so returning users are logged in immediately
      const optimisticAdmin =
        Boolean(fbUser.emailVerified) && isEmailAdmin(cleanEmail);

      if (optimisticAdmin) {
        setCurrentUser((prev) => ({
          id: fbUser.uid,
          name: cfg.teacherName ? `أ/ ${cfg.teacherName}` : 'أ/ محمد مصطفى',
          email,
          role: 'teacher',
          grade: 'third',
          phone: cfg.phone1 || '01002345678',
          parentPhone: '',
          avatarUrl: fbUser.photoURL || prev?.avatarUrl || '',
          score: 0,
          profileCompleted: true,
          watchedLectureIds: [],
          passedQuizIds: [],
          quizScores: {},
          joinedAt: prev?.joinedAt || new Date().toISOString().split('T')[0],
        }));
      } else if (!isMidAuthFlow) {
        const localMatch = studentsRef.current.find(
          (s) =>
            s.id === fbUser.uid ||
            (cleanEmail && s.email && s.email.toLowerCase().trim() === cleanEmail)
        );
        const isDoneLocally =
          Boolean(localMatch?.profileCompleted) ||
          Boolean(cleanEmail && localStorage.getItem(`mm_profile_done_${cleanEmail}`) === 'true') ||
          localStorage.getItem(`mm_profile_done_${fbUser.uid}`) === 'true';

        setCurrentUser((prev) => {
          if (prev && prev.id === fbUser.uid && prev.role === 'teacher') {
            return prev;
          }
          if (prev && prev.id === fbUser.uid && prev.role === 'student') {
            return {
              ...prev,
              avatarUrl: fbUser.photoURL || prev.avatarUrl || '',
              profileCompleted: prev.profileCompleted || isDoneLocally,
            };
          }
          if (localMatch) {
            return {
              ...localMatch,
              role: 'student',
              avatarUrl: fbUser.photoURL || localMatch.avatarUrl || '',
              profileCompleted: isDoneLocally,
            };
          }
          return {
            id: fbUser.uid,
            name: fbUser.displayName || email.split('@')[0] || 'طالب منصة',
            email,
            role: 'student',
            grade: 'third',
            phone: '',
            parentPhone: '',
            governorate: 'القاهرة',
            avatarUrl: fbUser.photoURL || '',
            score: 0,
            profileCompleted: isDoneLocally,
            approvalStatus: isDoneLocally ? 'approved' : 'pending',
            watchedLectureIds: [],
            passedQuizIds: [],
            quizScores: {},
            joinedAt: new Date().toISOString().split('T')[0],
          };
        });
      }

      // Restore portal view persistently across reloads until explicit logout
      const savedLastView =
        localStorage.getItem('mm_last_view') || sessionStorage.getItem('mm_last_view');
      if (options?.fromRedirect && optimisticAdmin) {
        setCurrentView('teacher');
        localStorage.setItem('mm_last_view', 'teacher');
      } else if (!hasManualNavigatedRef.current && savedLastView) {
        if (savedLastView === 'teacher' && optimisticAdmin) {
          setCurrentView('teacher');
        } else if (savedLastView === 'student' && !isMidAuthFlow) {
          setCurrentView('student');
        }
      }

      // Avoid duplicate Firestore fetches if handleLoginSuccess already triggered them within 5s
      const now = Date.now();
      const recentlyHandledByLogin =
        lastLoginHydratedRef.current &&
        lastLoginHydratedRef.current.uid === fbUser.uid &&
        now - lastLoginHydratedRef.current.ts < 5000;

      if (recentlyHandledByLogin) {
        return;
      }

      const hasGoogle = Boolean(fbUser.providerData?.some((p) => p.providerId === 'google.com'));

      // 2. Bounded deduplicated background Firestore verification & sync
      const [adminCfg, cloudStudent] = await Promise.all([
        fbUser.emailVerified || hasGoogle
          ? fetchAdminConfigIfAuthorized(3500)
          : Promise.resolve(null),
        !optimisticAdmin ? getStudentFromCloud(fbUser.uid, 2500) : Promise.resolve(null),
      ]);

      if (adminCfg) {
        const mergedEmails = Array.from(
          new Set(
            ['mizoo2y2@gmail.com', ...(adminCfg.adminEmails || [])]
              .map((e) => e.toLowerCase().trim())
              .filter(Boolean)
          )
        );
        adminEmailsRef.current = mergedEmails;
        setSiteConfig((prev) => ({
          ...prev,
          adminEmails: mergedEmails,
        }));
        if (adminCfg.cloudName && adminCfg.uploadPreset) {
          const nextCloud: CloudinaryConfig = {
            cloudName: adminCfg.cloudName,
            uploadPreset: adminCfg.uploadPreset,
          };
          setCloudinaryConfig(nextCloud);
        }
      }

      const verifiedIsAdmin =
        Boolean((auth.currentUser || fbUser).emailVerified || hasGoogle) &&
        (cleanEmail === 'mizoo2y2@gmail.com' ||
          Boolean(adminCfg && isEmailAdmin(cleanEmail, adminCfg.adminEmails)));

      if (verifiedIsAdmin) {
        setCurrentUser((prev) => ({
          id: fbUser.uid,
          name: cfg.teacherName ? `أ/ ${cfg.teacherName}` : 'أ/ محمد مصطفى',
          email,
          role: 'teacher',
          grade: 'third',
          phone: cfg.phone1 || '01002345678',
          parentPhone: '',
          avatarUrl: fbUser.photoURL || prev?.avatarUrl || '',
          score: 0,
          profileCompleted: true,
          watchedLectureIds: [],
          passedQuizIds: [],
          quizScores: {},
          joinedAt: prev?.joinedAt || new Date().toISOString().split('T')[0],
        }));

        const shouldEnterTeacherView =
          Boolean(options?.fromRedirect) ||
          currentViewRef.current === 'auth' ||
          Date.now() - justSignedInAuthRef.current < 12000 ||
          savedLastView === 'teacher';

        if (shouldEnterTeacherView) {
          setCurrentView('teacher');
          localStorage.setItem('mm_last_view', 'teacher');
        }

        if (!adminBootstrappedRef.current) {
          adminBootstrappedRef.current = true;
          Promise.all([
            getDoc(doc(db, 'publicConfig', 'site')),
            getDoc(doc(db, 'adminConfig', 'settings')),
          ])
            .then(async ([siteSnap, adminSnap]) => {
              if (!siteSnap.exists()) {
                await savePublicSiteConfigToCloud({
                  ...siteConfigRef.current,
                  profileImageUrl: sanitizeProfileImageUrl(
                    siteConfigRef.current.profileImageUrl
                  ),
                });
              }
              if (!adminSnap.exists()) {
                await saveAdminConfigToCloud(
                  adminEmailsRef.current || siteConfigRef.current.adminEmails || ['mizoo2y2@gmail.com'],
                  cloudinaryConfigRef.current,
                  undefined,
                  { preserveExistingAdmins: true }
                );
              }
            })
            .catch((err) => {
              console.warn('Admin bootstrap warning:', err);
            });
        }
      } else {
        setCurrentView((v) => (v === 'teacher' ? 'student' : v));
        if (cloudStudent) {
          setCurrentUser({
            ...cloudStudent,
            role: 'student',
            avatarUrl: fbUser.photoURL || cloudStudent.avatarUrl || '',
            profileCompleted: Boolean(cloudStudent.profileCompleted),
            approvalStatus:
              cloudStudent.approvalStatus ??
              (cloudStudent.profileCompleted ? 'approved' : 'pending'),
          });
        }
      }
    },
    [isEmailAdmin]
  );

  // 1. Unified Firebase Auth Listener + Non-Blocking Redirect Recovery
  useEffect(() => {
    let mounted = true;
    const pendingRedirectAtBoot = hasPendingRedirectFlag();
    let redirectCheckDone = !pendingRedirectAtBoot;

    if (!pendingRedirectAtBoot) {
      const hasSavedLogin = Boolean(
        localStorage.getItem('mm_user') || localStorage.getItem('mm_last_view')
      );
      if (hasSavedLogin && typeof auth.authStateReady === 'function') {
        Promise.race([
          auth.authStateReady().catch(() => {}),
          new Promise<void>((resolve) => window.setTimeout(resolve, 1200)),
        ]).then(() => {
          if (mounted) setAuthReady(true);
        });
      } else {
        setAuthReady(true);
      }
    }

    const handleRedirectCheck = async () => {
      const pendingBefore = hasPendingRedirectFlag();
      try {
        const redirectPromise = getRedirectResult(auth);
        const res = pendingBefore
          ? await Promise.race([
              redirectPromise,
              new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 2500)),
            ])
          : await redirectPromise;
        if (!mounted) return;
        if (res?.user) {
          clearRedirectFlags();
          showNotice(
            'success',
            lang === 'en' ? 'Signed in with Google successfully!' : 'تم تسجيل الدخول بحساب Google بنجاح!'
          );
          await hydrateFirebaseUser(res.user, { fromRedirect: true });
        } else if (pendingBefore) {
          if (typeof auth.authStateReady === 'function') {
            await Promise.race([
              auth.authStateReady().catch(() => {}),
              new Promise<void>((resolve) => window.setTimeout(resolve, 1500)),
            ]);
          }
          if (!mounted) return;
          if (auth.currentUser) {
            clearRedirectFlags();
            await hydrateFirebaseUser(auth.currentUser, { fromRedirect: true });
          } else {
            clearRedirectFlags();
          }
        }
      } catch (err: any) {
        if (!mounted) return;
        clearRedirectFlags();
        const code = err?.code || '';
        if (code === 'auth/unauthorized-domain') {
          showNotice(
            'error',
            lang === 'en'
              ? `Domain (${window.location.hostname}) is not in Firebase Authorized domains.`
              : `النطاق (${window.location.hostname}) غير مضاف في Authorized domains داخل Firebase Authentication.`
          );
        } else if (code === 'auth/network-request-failed') {
          showNotice(
            'error',
            lang === 'en'
              ? 'Could not reach sign-in servers. Check your connection and retry.'
              : 'تعذر الاتصال بخدمة تسجيل الدخول، تأكد من الاتصال ثم أعد المحاولة.'
          );
        } else if (pendingBefore && code) {
          showNotice(
            'error',
            lang === 'en'
              ? 'Could not complete browser sign-in. Please try again.'
              : 'تعذر إتمام تسجيل الدخول في المتصفح، يرجى المحاولة مرة أخرى.'
          );
          setCurrentView('auth');
        }
      } finally {
        redirectCheckDone = true;
        if (mounted) {
          setResolvingAuth(false);
          setAuthReady(true);
        }
      }
    };

    handleRedirectCheck();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!mounted) return;

      if (!fbUser) {
        setFirebaseUser(null);
        setCurrentUser((prev) => (prev && prev.role === 'teacher' ? null : prev));
        if (redirectCheckDone) {
          setAuthReady(true);
        }
        return;
      }

      const wasRedirectPending = hasPendingRedirectFlag();
      if (wasRedirectPending) {
        clearRedirectFlags();
      }

      await hydrateFirebaseUser(fbUser, { fromRedirect: wasRedirectPending });
      if (mounted) {
        setResolvingAuth(false);
        setAuthReady(true);
      }
    });

    // Re-sync session automatically when user returns from another tab/app (mobile OAuth / bfcache)
    const handleReturnToSite = () => {
      if (document.visibilityState === 'hidden') return;
      if (auth.currentUser && !currentUserRef.current) {
        const pending = hasPendingRedirectFlag();
        if (pending) clearRedirectFlags();
        hydrateFirebaseUser(auth.currentUser, { fromRedirect: pending });
      } else if (!auth.currentUser && hasPendingRedirectFlag()) {
        handleRedirectCheck();
      }
    };

    document.addEventListener('visibilitychange', handleReturnToSite);
    window.addEventListener('pageshow', handleReturnToSite);

    return () => {
      mounted = false;
      unsubscribe();
      document.removeEventListener('visibilitychange', handleReturnToSite);
      window.removeEventListener('pageshow', handleReturnToSite);
    };
  }, [clearRedirectFlags, hasPendingRedirectFlag, hydrateFirebaseUser, showNotice]);

  // 2A. Critical Landing Real-Time Firestore Listeners (Site Config, Lectures, Handouts)
  useEffect(() => {
    const unsubSite = onSnapshot(
      doc(db, 'publicConfig', 'site'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<SiteConfig>;
          setSiteConfig((prev) => ({
            ...DEFAULT_SITE_CONFIG,
            ...prev,
            ...data,
            profileImageUrl: sanitizeProfileImageUrl(data.profileImageUrl ?? ''),
            adminEmails: prev.adminEmails || DEFAULT_SITE_CONFIG.adminEmails,
          }));
        }
      },
      (error) => {
        console.warn('Public siteConfig listener error:', error.message);
      }
    );

    const lecturesQuery = query(collection(db, 'lectures'), where('grade', '!=', ''));
    const unsubLectures = onSnapshot(
      lecturesQuery,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Lecture);
        list.sort(
          (a, b) =>
            (a.sessionOrder ?? 9999) - (b.sessionOrder ?? 9999) ||
            (b.dateAdded || '').localeCompare(a.dateAdded || '')
        );
        setLectures(list);
      },
      (error) => {
        console.warn('Lectures listener error:', error.message);
      }
    );

    const attachmentsQuery = query(collection(db, 'attachments'), where('grade', '!=', ''));
    const unsubAttachments = onSnapshot(
      attachmentsQuery,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as AttachmentFile);
        list.sort((a, b) => (b.dateAdded || '').localeCompare(a.dateAdded || ''));
        setAttachments(list);
      },
      (error) => {
        console.warn('Attachments listener error:', error.message);
      }
    );

    return () => {
      unsubSite();
      unsubLectures();
      unsubAttachments();
    };
  }, []);

  // 2B. Secondary Portal Listeners (Quizzes, Rewards, Notifications) — deferred slightly on landing boot
  const [secondaryCollectionsReady, setSecondaryCollectionsReady] = useState<boolean>(
    () => currentView !== 'landing'
  );

  useEffect(() => {
    if (secondaryCollectionsReady) return;
    if (currentView !== 'landing') {
      setSecondaryCollectionsReady(true);
      return;
    }
    const timer = window.setTimeout(() => {
      setSecondaryCollectionsReady(true);
    }, 850);
    return () => window.clearTimeout(timer);
  }, [currentView, secondaryCollectionsReady]);

  useEffect(() => {
    if (!secondaryCollectionsReady) return;

    const quizzesQuery = query(collection(db, 'quizzes'), where('grade', '!=', ''));
    const unsubQuizzes = onSnapshot(
      quizzesQuery,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Quiz);
        setQuizzes(list);
      },
      (error) => {
        console.warn('Quizzes listener error:', error.message);
      }
    );

    const rewardsQuery = query(collection(db, 'rewards'), where('grade', '!=', ''));
    const unsubRewards = onSnapshot(
      rewardsQuery,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as PointReward);
        list.sort((a, b) => (b.dateAdded || '').localeCompare(a.dateAdded || ''));
        setRewards(list);
      },
      (error) => {
        console.warn('Rewards listener error:', error.message);
      }
    );

    const notificationsQuery = query(collection(db, 'notifications'), where('grade', '!=', ''));
    const unsubNotifications = onSnapshot(
      notificationsQuery,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as PlatformNotification);
        list.sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return (b.dateAdded || '').localeCompare(a.dateAdded || '');
        });
        setNotifications(list);
      },
      (error) => {
        console.warn('Notifications listener error:', error.message);
      }
    );

    return () => {
      unsubQuizzes();
      unsubRewards();
      unsubNotifications();
    };
  }, [secondaryCollectionsReady]);

  // 3. Authenticated Real-Time Firestore Listeners
  useEffect(() => {
    const activeFbUser = firebaseUser || auth.currentUser;
    if (!activeFbUser) {
      setStudentsSyncError(null);
      setAdminCloudError(null);
      return;
    }

    const unsubscribers: Array<() => void> = [];
    const hasGoogle = Boolean(
      activeFbUser.providerData?.some((p) => p.providerId === 'google.com')
    );
    const userIsAdmin =
      Boolean(activeFbUser.email) &&
      Boolean(activeFbUser.emailVerified || hasGoogle || currentUser?.role === 'teacher') &&
      isEmailAdmin(activeFbUser.email);

    if (userIsAdmin) {
      let cancelled = false;
      setStudentsLoading(true);

      const attachAdminListeners = async () => {
        if (!activeFbUser.emailVerified) {
          try {
            await reload(activeFbUser);
            await activeFbUser.getIdToken(true);
          } catch {}
        }
        if (cancelled) {
          setStudentsLoading(false);
          return;
        }

        const refreshedUser = auth.currentUser || activeFbUser;
        if (!refreshedUser.emailVerified) {
          setStudentsLoading(false);
          const msg =
            lang === 'en'
              ? `Account (${refreshedUser.email}) is not email-verified yet, so cloud security rules block reading students & admin settings. Verify your email or sign in with Google.`
              : `حساب (${refreshedUser.email}) غير مؤكد بالبريد الإلكتروني بعد، لذلك تمنع قواعد الأمان عرض الطلاب والمشرفين. يرجى تأكيد البريد الإلكتروني أو تسجيل الدخول بحساب Google.`;
          setAdminCloudError(msg);
          setStudentsSyncError(msg);
          return;
        }

        unsubscribers.push(
          onSnapshot(
            doc(db, 'adminConfig', 'settings'),
            (snap) => {
              setAdminCloudError(null);
              if (snap.exists()) {
                const data = snap.data() as {
                  adminEmails?: string[];
                  cloudName?: string;
                  uploadPreset?: string;
                };
                if (data.cloudName && data.uploadPreset) {
                  const nextCloud: CloudinaryConfig = {
                    cloudName: data.cloudName,
                    uploadPreset: data.uploadPreset,
                  };
                  setCloudinaryConfig(nextCloud);
                }
                if (Array.isArray(data.adminEmails) && data.adminEmails.length > 0) {
                  const cleanEmails = Array.from(
                    new Set(
                      ['mizoo2y2@gmail.com', ...data.adminEmails]
                        .map((e) => e.toLowerCase().trim())
                        .filter(Boolean)
                    )
                  );
                  adminEmailsRef.current = cleanEmails;
                  setSiteConfig((prev) => ({
                    ...prev,
                    adminEmails: cleanEmails,
                  }));
                }
              }
            },
            (error) => {
              console.warn('AdminConfig listener error:', error.message);
              const details = extractFirestoreErrorDetails(error);
              setAdminCloudError(
                details.isPermissionDenied
                  ? lang === 'en'
                    ? 'Cloud permissions check failed for admin settings. Confirm this email is verified & listed in Co-Admins.'
                    : 'تعذر التحقق من صلاحيات المشرف في السحابة لقراءة قائمة المدراء. تأكد من تأكيد البريد الإلكتروني أو أن الحساب مضاف من المالك الرئيسي.'
                  : lang === 'en'
                  ? `Could not sync admin list: ${details.rawMessage}`
                  : `تعذر مزامنة قائمة المشرفين: ${details.rawMessage}`
              );
            }
          )
        );

        unsubscribers.push(
          onSnapshot(
            collection(db, 'students'),
            (snap) => {
              setStudentsLoading(false);
              setStudentsSyncError(null);
              const list = snap.docs.map((d) => d.data() as UserProfile);
              setStudents(list);
            },
            (error) => {
              setStudentsLoading(false);
              console.warn('Students admin listener error:', error.message);
              const details = extractFirestoreErrorDetails(error);
              setStudentsSyncError(
                details.isPermissionDenied
                  ? lang === 'en'
                    ? 'Could not load students because Firestore rejected admin permissions for this session. Verify your email or refresh credentials.'
                    : 'تعذر تحميل سجل الطلاب لأن السحابة رفضت التحقق من صلاحيات الجلسة الحالية (ليس معناها أن الطلاب اتمسحوا!). تأكد من تأكيد البريد أو اضغط تحديث الصلاحيات.'
                  : lang === 'en'
                  ? `Could not load students directory: ${details.rawMessage}`
                  : `تعذر تحميل بيانات الطلاب من السحابة: ${details.rawMessage}`
              );
            }
          )
        );

        unsubscribers.push(
          onSnapshot(
            collection(db, 'redeemCodes'),
            (snap) => {
              const list = snap.docs.map((d) => d.data() as RedeemCode);
              list.sort((a, b) => (b.createdAtDate || '').localeCompare(a.createdAtDate || ''));
              setRedeemCodes(list);
            },
            (error) => {
              console.warn('RedeemCodes admin listener error:', error.message);
            }
          )
        );

        unsubscribers.push(
          onSnapshot(
            collection(db, 'examAlerts'),
            (snap) => {
              const list = snap.docs.map((d) => d.data() as ExamSecurityAlert);
              list.sort(
                (a, b) =>
                  (b.createdAtDate || '').localeCompare(a.createdAtDate || '') ||
                  (b.id || '').localeCompare(a.id || '')
              );
              setExamAlerts(list);

              if (!examAlertsHydratedRef.current) {
                examAlertsHydratedRef.current = true;
                list.forEach((a) => knownExamAlertIdsRef.current.add(a.id));
                return;
              }

              const freshUnresolved = list.filter(
                (a) => !a.resolved && !knownExamAlertIdsRef.current.has(a.id)
              );
              list.forEach((a) => knownExamAlertIdsRef.current.add(a.id));

              if (freshUnresolved.length > 0) {
                const newest = freshUnresolved[0];
                const lastReason =
                  newest.reasons?.[newest.reasons.length - 1] ||
                  (lang === 'en' ? 'Exam security breach' : 'محاولة غش أو مغادرة صفحة الاختبار');
                showNotice(
                  'error',
                  lang === 'en'
                    ? `PROCTORING ALERT: ${newest.studentName} (${newest.violationCount}/${newest.maxViolations}) in "${newest.quizTitle}" — ${lastReason}`
                    : `🚨 تنبيه لجنة فوري: الطالب «${newest.studentName}» (${newest.violationCount}/${newest.maxViolations}) في «${newest.quizTitle}» — ${lastReason}`
                );
                try {
                  const AudioCtx =
                    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                  if (AudioCtx) {
                    const ctx = new AudioCtx();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(880, ctx.currentTime);
                    gain.gain.setValueAtTime(0.06, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.25);
                  }
                } catch {}
              }
            },
            (error) => {
              console.warn('ExamAlerts admin listener error:', error.message);
            }
          )
        );
      };

      attachAdminListeners();

      return () => {
        cancelled = true;
        setStudentsLoading(false);
        unsubscribers.forEach((unsub) => unsub());
      };
    } else {
      const ownStudentQuery = query(
        collection(db, 'students'),
        where('uid', '==', activeFbUser.uid)
      );
      unsubscribers.push(
        onSnapshot(
          ownStudentQuery,
          (snap) => {
            if (isEmailAdmin(activeFbUser.email) || currentUserRef.current?.role === 'teacher') {
              return;
            }
            if (!snap.empty) {
              const docData = snap.docs[0].data() as UserProfile;
              setCurrentUser((prev) => {
                if (prev?.role === 'teacher') return prev;
                return {
                  ...docData,
                  avatarUrl: prev?.avatarUrl || docData.avatarUrl || '',
                  profileCompleted: Boolean(docData.profileCompleted),
                };
              });
            }
          },
          (error) => {
            console.warn('Own student listener error:', error.message);
          }
        )
      );
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [firebaseUser, isEmailAdmin, currentUser?.role, lang]);

  // Persist non-sensitive public cache with debounced writes so rapid updates never block the main thread
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const publicSiteCache: Partial<SiteConfig> = { ...siteConfig };
        delete publicSiteCache.adminEmails;
        localStorage.setItem('mm_site_config', JSON.stringify(publicSiteCache));
        localStorage.setItem('mm_lectures', JSON.stringify(lectures));
        localStorage.setItem('mm_attachments', JSON.stringify(attachments));
        localStorage.setItem('mm_quizzes', JSON.stringify(quizzes));
        localStorage.setItem('mm_rewards', JSON.stringify(rewards));
        localStorage.setItem('mm_notifications', JSON.stringify(notifications));
      } catch {}
    }, 400);
    return () => window.clearTimeout(timer);
  }, [siteConfig, lectures, attachments, quizzes, rewards, notifications]);

  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem('mm_user', JSON.stringify(currentUser));
      } catch {}
    } else if (authReady && !auth.currentUser && !firebaseUser) {
      try {
        localStorage.removeItem('mm_user');
      } catch {}
    }
  }, [currentUser, authReady, firebaseUser]);

  const openAuthPage = useCallback((tab: 'login' | 'register' = 'login') => {
    hasManualNavigatedRef.current = true;
    setAuthInitialTab(tab);
    setCurrentView('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (currentView !== 'student') {
      setInExamFocusMode(false);
    }
  }, [currentView]);

  // Strict route guard
  useEffect(() => {
    if (!authReady) return;
    if (currentView === 'teacher' && !isUserAdmin(currentUser)) {
      openAuthPage('login');
    } else if ((currentView === 'student' || currentView === 'onboarding') && !currentUser) {
      openAuthPage('login');
    }
  }, [authReady, currentView, currentUser, isUserAdmin, openAuthPage]);

  const handleRetryAdminCloudSync = async () => {
    const activeUser = auth.currentUser || firebaseUser;
    if (!activeUser) {
      openAuthPage('login');
      return;
    }
    try {
      await reload(activeUser);
      await activeUser.getIdToken(true);
      setFirebaseUser(auth.currentUser || activeUser);
    } catch {}

    const refreshed = auth.currentUser || activeUser;
    if (!refreshed.emailVerified) {
      const msg =
        lang === 'en'
          ? `Email (${refreshed.email}) is still unverified. Click the verification link in your inbox or sign in with Google once.`
          : `البريد (${refreshed.email}) لم يتم تأكيده بعد. افتح رسالة التأكيد في بريدك أو سجل الدخول بحساب Google لتفعيل الصلاحيات فوراً.`;
      setAdminCloudError(msg);
      setStudentsSyncError(msg);
      showNotice('error', msg);
      return;
    }

    clearAdminConfigCache();
    const adminCfg = await fetchAdminConfigIfAuthorized(4500);
    if (adminCfg?.adminEmails?.length) {
      const merged = Array.from(
        new Set(
          ['mizoo2y2@gmail.com', ...adminCfg.adminEmails]
            .map((e) => e.toLowerCase().trim())
            .filter(Boolean)
        )
      );
      adminEmailsRef.current = merged;
      setSiteConfig((prev) => ({ ...prev, adminEmails: merged }));
      setAdminCloudError(null);
    }

    try {
      const list = await fetchAllStudentsAsAdmin();
      setStudents(list);
      setStudentsSyncError(null);
      setLastCloudError(null);
      showNotice(
        'success',
        lang === 'en'
          ? `Cloud permissions verified and synced (${list.length} students loaded).`
          : `تم التحقق من الصلاحيات ومزامنة السحابة بنجاح (${list.length} طالب).`
      );
    } catch (err) {
      const details = extractFirestoreErrorDetails(err);
      const errMsg = details.isPermissionDenied
        ? lang === 'en'
          ? 'Firestore denied admin list access. Ensure this email is verified and added to Co-Admins by the primary owner.'
          : 'السحابة رفضت صلاحية القراءة لهذا الحساب. تأكد أن البريد مؤكد ومضاف في قائمة المشرفين من المالك الرئيسي (mizoo2y2@gmail.com).'
        : details.rawMessage;
      setStudentsSyncError(errMsg);
      showNotice('error', errMsg);
    }
  };

  // Execute an admin Firestore write reliably using live session & automatic token-refresh retry
  const executeAdminCloudWrite = async (
    action: () => Promise<void>,
    successMsg?: string
  ): Promise<boolean> => {
    setLastCloudError(null);

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      const msg =
        lang === 'en'
          ? 'No internet connection — check your network to save changes.'
          : 'لا يوجد اتصال بالإنترنت — تأكد من الشبكة لحفظ التغييرات.';
      setLastCloudError(msg);
      showNotice('error', msg);
      return false;
    }

    if (!auth.currentUser) {
      openAuthPage('login');
      const msg =
        lang === 'en'
          ? 'Admin session expired. Please sign in to continue.'
          : 'انتهت جلسة المشرف، يرجى تسجيل الدخول للمتابعة.';
      setLastCloudError(msg);
      showNotice('error', msg);
      return false;
    }

    if (!auth.currentUser.emailVerified) {
      try {
        await reload(auth.currentUser);
        await auth.currentUser.getIdToken(true);
      } catch {}
      if (!auth.currentUser.emailVerified) {
        const msg =
          lang === 'en'
            ? `Cannot save to cloud because (${auth.currentUser.email}) is not email-verified yet. Click the verification link in your email or sign in once with Google.`
            : `لا يمكن الحفظ في السحابة لأن بريد هذا الحساب (${auth.currentUser.email}) غير مؤكد بعد. قم بتأكيد البريد من رسالتك أو سجل الدخول بحساب Google مرة واحدة.`;
        setLastCloudError(msg);
        setAdminCloudError(msg);
        showNotice('error', msg);
        return false;
      }
    }

    let authorized = isEmailAdmin(auth.currentUser.email);
    if (!authorized) {
      const adminCfg = await fetchAdminConfigIfAuthorized();
      if (adminCfg) {
        authorized = true;
        const merged = Array.from(
          new Set(
            ['mizoo2y2@gmail.com', ...(adminCfg.adminEmails || [])]
              .map((e) => e.toLowerCase().trim())
              .filter(Boolean)
          )
        );
        adminEmailsRef.current = merged;
      }
    }

    if (!authorized) {
      const msg =
        lang === 'en'
          ? `Account (${auth.currentUser.email}) is not enabled as an admin in the cloud database.`
          : `حساب (${auth.currentUser.email}) غير مفعل كمشرف في قاعدة البيانات السحابية. يجب إضافته أولاً من المالك الرئيسي (mizoo2y2@gmail.com).`;
      setLastCloudError(msg);
      showNotice('error', msg);
      return false;
    }

    try {
      await auth.currentUser.getIdToken().catch(() => '');
      await action();
      setLastCloudError(null);
      if (successMsg) {
        showNotice('success', successMsg);
      }
      return true;
    } catch (err) {
      const details = extractFirestoreErrorDetails(err);
      if ((details.isPermissionDenied || details.isUnauthenticated) && auth.currentUser) {
        try {
          await reload(auth.currentUser);
          await auth.currentUser.getIdToken(true);
          await action();
          setLastCloudError(null);
          if (successMsg) {
            showNotice('success', successMsg);
          }
          return true;
        } catch (retryErr) {
          const retryDetails = extractFirestoreErrorDetails(retryErr);
          console.error('Cloud write error after token refresh:', retryErr);
          const msg = retryDetails.isPermissionDenied
            ? lang === 'en'
              ? `Cloud rejected write permissions for (${auth.currentUser.email}). Verify this email is confirmed and listed in Co-Admins.`
              : `رفضت قواعد الأمان السحابية التعديل لحساب (${auth.currentUser.email}). تأكد أن الحساب مؤكد البريد ومدرج في قائمة المشرفين بالسحابة.`
            : lang === 'en'
            ? `Cloud save failed: ${retryDetails.rawMessage}`
            : `تعذر الحفظ في السحابة: ${retryDetails.rawMessage}`;
          setLastCloudError(msg);
          showNotice('error', msg);
          return false;
        }
      }

      console.error('Cloud write error:', err);
      const msg = details.isNetworkError
        ? lang === 'en'
          ? 'Network error connecting to cloud database. Please check your internet connection.'
          : 'تعذر الاتصال بقاعدة البيانات السحابية، تأكد من جودة الإنترنت وحاول مرة أخرى.'
        : lang === 'en'
        ? `Failed to save changes to cloud: ${details.rawMessage}`
        : `حدث خطأ أثناء الحفظ في قاعدة البيانات: ${details.rawMessage}`;
      setLastCloudError(msg);
      showNotice('error', msg);
      return false;
    }
  };

  const handleNavigate = (view: AppView) => {
    hasManualNavigatedRef.current = true;
    if (view === 'teacher') {
      const activeFbUser = firebaseUser || auth.currentUser;
      const hasGoogle = Boolean(
        activeFbUser?.providerData?.some((p) => p.providerId === 'google.com')
      );
      const liveVerifiedAdmin =
        Boolean(activeFbUser?.email) &&
        Boolean(activeFbUser?.emailVerified || hasGoogle) &&
        isEmailAdmin(activeFbUser?.email);

      if (liveVerifiedAdmin && activeFbUser) {
        if (!currentUser || currentUser.role !== 'teacher') {
          const cfg = siteConfigRef.current;
          setCurrentUser((prev) => ({
            id: activeFbUser.uid,
            name: cfg.teacherName ? `أ/ ${cfg.teacherName}` : 'أ/ محمد مصطفى',
            email: activeFbUser.email || prev?.email || '',
            role: 'teacher',
            grade: prev?.grade || 'third',
            phone: cfg.phone1 || '01002345678',
            parentPhone: '',
            avatarUrl: activeFbUser.photoURL || prev?.avatarUrl || '',
            score: 0,
            profileCompleted: true,
            watchedLectureIds: [],
            passedQuizIds: [],
            quizScores: {},
            joinedAt: prev?.joinedAt || new Date().toISOString().split('T')[0],
          }));
        }
        setCurrentView('teacher');
        localStorage.setItem('mm_last_view', 'teacher');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (activeFbUser?.email && isEmailAdmin(activeFbUser.email) && !activeFbUser.emailVerified) {
        showNotice(
          'error',
          lang === 'en'
            ? 'Please verify your email address or sign in with Google once to unlock the Admin Dashboard.'
            : 'يرجى تأكيد بريدك الإلكتروني من الرسالة المرسلة لك أو الدخول بحساب Google لفتح لوحة الإدارة.'
        );
      }

      if (!isUserAdmin(currentUser)) {
        openAuthPage('login');
        return;
      }
      setCurrentView('teacher');
      localStorage.setItem('mm_last_view', 'teacher');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (view === 'student') {
      if (!currentUser) {
        openAuthPage('login');
        return;
      }
      setCurrentView('student');
      localStorage.setItem('mm_last_view', 'student');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (view === 'auth') {
      openAuthPage('login');
      return;
    }
    if (view === 'landing') {
      localStorage.setItem('mm_last_view', 'landing');
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  const handleLoginSuccess = async (user: UserProfile) => {
    hasManualNavigatedRef.current = true;
    justSignedInAuthRef.current = Date.now();
    const fbUser = auth.currentUser;
    if (fbUser) {
      setFirebaseUser(fbUser);
      lastLoginHydratedRef.current = { uid: fbUser.uid, ts: Date.now() };
    }

    const hasGoogle = Boolean(fbUser?.providerData?.some((p) => p.providerId === 'google.com'));
    const verifiedEmail =
      fbUser && (fbUser.emailVerified || hasGoogle) && fbUser.email
        ? fbUser.email.toLowerCase().trim()
        : '';
    const isInstantVerifiedAdmin =
      Boolean(verifiedEmail) &&
      (user.role === 'teacher' || isEmailAdmin(verifiedEmail));

    // Fast path for verified admins & co-admins already validated by AuthModals (zero blocking wait)
    if (isInstantVerifiedAdmin && fbUser) {
      if (verifiedEmail && !adminEmailsRef.current.includes(verifiedEmail)) {
        const nextEmails = Array.from(
          new Set(['mizoo2y2@gmail.com', ...adminEmailsRef.current, verifiedEmail])
        );
        adminEmailsRef.current = nextEmails;
        setSiteConfig((prev) => ({ ...prev, adminEmails: nextEmails }));
      }
      const finalAdmin: UserProfile = {
        ...user,
        id: fbUser.uid,
        email: fbUser.email || user.email,
        role: 'teacher',
        profileCompleted: true,
      };
      setCurrentUser(finalAdmin);
      setCurrentView('teacher');
      localStorage.setItem('mm_last_view', 'teacher');
      fetchAdminConfigIfAuthorized(3500)
        .then((adminCfg) => {
          if (adminCfg?.adminEmails?.length) {
            const merged = Array.from(
              new Set(
                ['mizoo2y2@gmail.com', ...adminCfg.adminEmails]
                  .map((e) => e.toLowerCase().trim())
                  .filter(Boolean)
              )
            );
            adminEmailsRef.current = merged;
            setSiteConfig((prev) => ({ ...prev, adminEmails: merged }));
          }
        })
        .catch(() => {});
      return;
    }

    // Immediate non-blocking transition for students (AuthModals already verified admin status in parallel)
    const sanitizedStudentInput: UserProfile = {
      ...user,
      role: 'student',
    };

    const matchedLocal: UserProfile | undefined = students.find(
      (s) =>
        (sanitizedStudentInput.id && s.id === sanitizedStudentInput.id) ||
        (sanitizedStudentInput.email &&
          s.email &&
          s.email.toLowerCase().trim() === sanitizedStudentInput.email.toLowerCase().trim()) ||
        (sanitizedStudentInput.phone && s.phone && s.phone === sanitizedStudentInput.phone)
    );

    const matched = matchedLocal || sanitizedStudentInput;
    const isMarkedDone =
      Boolean(sanitizedStudentInput.profileCompleted) ||
      Boolean(matched?.profileCompleted) ||
      Boolean(
        sanitizedStudentInput.email &&
          localStorage.getItem(
            `mm_profile_done_${sanitizedStudentInput.email.toLowerCase().trim()}`
          ) === 'true'
      ) ||
      Boolean(
        sanitizedStudentInput.id &&
          localStorage.getItem(`mm_profile_done_${sanitizedStudentInput.id}`) === 'true'
      );

    const resolvedLoginFlags = getResolvedFeatureFlags(siteConfigRef.current);
    const defaultApprovalStatus =
      matched?.profileCompleted || !resolvedLoginFlags.requireStudentApproval ? 'approved' : 'pending';

    const finalUser: UserProfile = {
      ...sanitizedStudentInput,
      ...matched,
      name: matched.name || sanitizedStudentInput.name,
      avatarUrl: sanitizedStudentInput.avatarUrl || matched.avatarUrl,
      role: 'student',
      profileCompleted: isMarkedDone,
      approvalStatus:
        matched?.approvalStatus === 'rejected'
          ? 'rejected'
          : matched?.approvalStatus ?? sanitizedStudentInput.approvalStatus ?? defaultApprovalStatus,
    };

    setCurrentUser(finalUser);
    setCurrentView('student');
    localStorage.setItem('mm_last_view', 'student');

    if (finalUser.profileCompleted && fbUser) {
      saveStudentToCloud(finalUser, fbUser.uid).catch((err) =>
        console.warn('Cloud student save warning:', err)
      );
    }

    setStudents((prev) => {
      const existsIdx = prev.findIndex(
        (s) => s.id === finalUser.id || (finalUser.email && s.email === finalUser.email)
      );
      if (existsIdx >= 0) {
        const copy = [...prev];
        copy[existsIdx] = finalUser;
        return copy;
      }
      return [finalUser, ...prev];
    });
  };

  const handleLogout = () => {
    hasManualNavigatedRef.current = true;
    try {
      sessionStorage.removeItem('mm_last_view');
      sessionStorage.removeItem('mm_user');
      sessionStorage.removeItem('mm_registered_students');
      localStorage.removeItem('mm_last_view');
      localStorage.removeItem('mm_user');
      localStorage.removeItem('mm_registered_students');
      localStorage.removeItem('mm_redeem_codes');
      localStorage.removeItem('mm_cloudinary');
    } catch {}
    clearRedirectFlags();
    clearAdminConfigCache();
    signOut(auth).catch((e) => console.warn('Sign out warning:', e));
    adminBootstrappedRef.current = false;
    adminEmailsRef.current = ['mizoo2y2@gmail.com'];
    setSiteConfig((prev) => ({
      ...prev,
      adminEmails: ['mizoo2y2@gmail.com'],
    }));
    setCloudinaryConfig(INITIAL_CLOUDINARY_CONFIG);
    setStudents([]);
    setRedeemCodes([]);
    setExamAlerts([]);
    setStudentsSyncError(null);
    setAdminCloudError(null);
    setLastCloudError(null);
    setInExamFocusMode(false);
    setFirebaseUser(null);
    setCurrentUser(null);
    setCurrentView('landing');
  };

  const handleAddLecture = async (newLec: Lecture): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(
      () => saveLectureToCloud(newLec),
      lang === 'en' ? 'Lecture published and saved to cloud!' : 'تم نشر المحاضرة وحفظها في السحابة!'
    );
    if (ok) {
      setLectures((prev) => [newLec, ...prev.filter((l) => l.id !== newLec.id)]);
    }
    return ok;
  };

  const handleDeleteLecture = async (id: string): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(() => deleteLectureFromCloud(id));
    if (ok) {
      setLectures((prev) => prev.filter((l) => l.id !== id));
    }
    return ok;
  };

  const handleUpdateLecture = async (updated: Lecture): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(
      () => saveLectureToCloud(updated),
      lang === 'en' ? 'Lecture updated and synced!' : 'تم تحديث المحاضرة وحفظها في السحابة!'
    );
    if (ok) {
      setLectures((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    }
    return ok;
  };

  const handleAddAttachment = async (newFile: AttachmentFile): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(
      () => saveAttachmentToCloud(newFile),
      lang === 'en' ? 'Handout published and saved to cloud!' : 'تم نشر المذكرة وحفظها في السحابة!'
    );
    if (ok) {
      setAttachments((prev) => [newFile, ...prev.filter((a) => a.id !== newFile.id)]);
    }
    return ok;
  };

  const handleDeleteAttachment = async (id: string): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(() => deleteAttachmentFromCloud(id));
    if (ok) {
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    }
    return ok;
  };

  const handleUpdateAttachment = async (updated: AttachmentFile): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(
      () => saveAttachmentToCloud(updated),
      lang === 'en' ? 'Handout updated and synced!' : 'تم تحديث بيانات المذكرة وحفظ التعديلات في السحابة!'
    );
    if (ok) {
      setAttachments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    }
    return ok;
  };

  const handleAddQuiz = async (newQuiz: Quiz): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(
      () => saveQuizToCloud(newQuiz),
      lang === 'en' ? 'Quiz saved and published!' : 'تم حفظ ونشر الامتحان في السحابة!'
    );
    if (ok) {
      setQuizzes((prev) => [newQuiz, ...prev.filter((q) => q.id !== newQuiz.id)]);
    }
    return ok;
  };

  const handleUpdateQuiz = async (updatedQuiz: Quiz): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(
      () => saveQuizToCloud(updatedQuiz),
      lang === 'en'
        ? 'Quiz and questions updated in cloud!'
        : 'تم تحديث الامتحان والأسئلة وحفظ التعديلات في السحابة!'
    );
    if (ok) {
      setQuizzes((prev) => prev.map((q) => (q.id === updatedQuiz.id ? updatedQuiz : q)));
    }
    return ok;
  };

  const handleDeleteQuiz = async (id: string): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(() => deleteQuizFromCloud(id));
    if (ok) {
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    }
    return ok;
  };

  const handleAdminDeleteStudent = async (studentId: string): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(() => deleteStudentFromCloud(studentId));
    if (ok) {
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
    }
    return ok;
  };

  const handleAdminAddStudent = async (student: UserProfile): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(() => saveStudentToCloud(student, student.id, true));
    if (ok) {
      setStudents((prev) => [student, ...prev.filter((s) => s.id !== student.id)]);
    }
    return ok;
  };

  const handleAdminUpdateStudent = async (student: UserProfile): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(() => saveStudentToCloud(student, student.id, true));
    if (ok) {
      setStudents((prev) => {
        const idx = prev.findIndex((s) => s.id === student.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = student;
          return copy;
        }
        return [student, ...prev];
      });
    }
    return ok;
  };

  // Redeem Codes & Rewards Admin Handlers
  const handleCreateRedeemCode = async (codeItem: RedeemCode): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(
      () => saveRedeemCodeToCloud(codeItem),
      lang === 'en'
        ? `Code (${codeItem.code}) saved to cloud database!`
        : `تم حفظ كود (${codeItem.code}) في قاعدة البيانات!`
    );
    if (ok) {
      setRedeemCodes((prev) => [codeItem, ...prev.filter((c) => c.id !== codeItem.id)]);
    }
    return ok;
  };

  const handleCreateRedeemCodesBatch = async (items: RedeemCode[]): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(
      () => saveRedeemCodesBatchToCloud(items),
      lang === 'en'
        ? `Generated and saved ${items.length} new codes!`
        : `تم توليد وحفظ ${items.length} أكواد جديدة في السحابة!`
    );
    if (ok) {
      setRedeemCodes((prev) => {
        const newIds = new Set(items.map((i) => i.id));
        return [...items, ...prev.filter((c) => !newIds.has(c.id))];
      });
    }
    return ok;
  };

  const handleToggleRedeemCode = async (codeId: string, active: boolean): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(() => toggleRedeemCodeActiveInCloud(codeId, active));
    if (ok) {
      setRedeemCodes((prev) => prev.map((c) => (c.id === codeId ? { ...c, active } : c)));
    }
    return ok;
  };

  const handleDeleteRedeemCode = async (codeId: string): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(() => deleteRedeemCodeFromCloud(codeId));
    if (ok) {
      setRedeemCodes((prev) => prev.filter((c) => c.id !== codeId));
    }
    return ok;
  };

  const handleSaveReward = async (reward: PointReward): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(
      () => savePointRewardToCloud(reward),
      lang === 'en'
        ? 'Reward saved and published to the student store!'
        : 'تم حفظ المكافأة ونشرها في متجر الطلاب!'
    );
    if (ok) {
      setRewards((prev) => [reward, ...prev.filter((r) => r.id !== reward.id)]);
    }
    return ok;
  };

  const handleDeleteReward = async (rewardId: string): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(() => deletePointRewardFromCloud(rewardId));
    if (ok) {
      setRewards((prev) => prev.filter((r) => r.id !== rewardId));
    }
    return ok;
  };

  const handleSaveNotification = async (notif: PlatformNotification): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(
      () => saveNotificationToCloud(notif),
      lang === 'en'
        ? 'Notification saved and synced for students!'
        : 'تم حفظ الإشعار ونشره للطلاب في السحابة!'
    );
    if (ok) {
      setNotifications((prev) => {
        const filtered = prev.filter((n) => n.id !== notif.id);
        const next = [notif, ...filtered];
        next.sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return (b.dateAdded || '').localeCompare(a.dateAdded || '');
        });
        return next;
      });
    }
    return ok;
  };

  const handleDeleteNotification = async (id: string): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(
      () => deleteNotificationFromCloud(id),
      lang === 'en' ? 'Notification deleted.' : 'تم حذف الإشعار بنجاح.'
    );
    if (ok) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
    return ok;
  };

  // Exam Anti-Cheat Security Alert Handlers
  const handleReportExamAlert = async (alert: ExamSecurityAlert): Promise<void> => {
    setExamAlerts((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)]);
    try {
      await createExamSecurityAlertToCloud(alert);
    } catch (err) {
      console.warn('Exam alert cloud write warning:', err);
    }
  };

  const handleResolveExamAlert = async (alert: ExamSecurityAlert): Promise<boolean> => {
    const updated: ExamSecurityAlert = { ...alert, resolved: true };
    const ok = await executeAdminCloudWrite(
      () => updateExamSecurityAlertInCloud(updated),
      lang === 'en' ? 'Alert marked as reviewed.' : 'تمت مراجعة وتأكيد التنبيه الأمني.'
    );
    if (ok) {
      setExamAlerts((prev) => prev.map((a) => (a.id === alert.id ? updated : a)));
    }
    return ok;
  };

  const handleDeleteExamAlert = async (alertId: string): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(
      () => deleteExamSecurityAlertFromCloud(alertId),
      lang === 'en' ? 'Security alert deleted.' : 'تم حذف سجل المخالفة.'
    );
    if (ok) {
      setExamAlerts((prev) => prev.filter((a) => a.id !== alertId));
    }
    return ok;
  };

  // Student Points & Unlocking Atomic Handlers
  const syncUpdatedStudentLocally = (updated: UserProfile) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...updated, role: prev.role } : updated));
    setStudents((prev) => {
      const idx = prev.findIndex((s) => s.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...updated };
        return copy;
      }
      return prev;
    });
  };

  const handleStudentRedeemCode = async (rawCode: string) => {
    if (!currentUser) {
      throw new Error(lang === 'en' ? 'Please sign in first.' : 'يرجى تسجيل الدخول أولاً.');
    }
    const result = await redeemCodeForStudent(rawCode, currentUser);
    syncUpdatedStudentLocally(result.updatedStudent);
    showNotice(
      'success',
      lang === 'en'
        ? `Added +${result.pointsAdded} points to your wallet!`
        : `تمت إضافة +${result.pointsAdded} نقطة إلى رصيدك!`
    );
    return {
      pointsAdded: result.pointsAdded,
      newBalance: result.newBalance,
      code: result.code,
    };
  };

  const handleStudentUnlockLecture = async (lecture: Lecture) => {
    if (!currentUser) {
      throw new Error(lang === 'en' ? 'Please sign in first.' : 'يرجى تسجيل الدخول أولاً.');
    }
    const updated = await unlockLectureWithPoints(lecture, currentUser);
    syncUpdatedStudentLocally(updated);
    showNotice(
      'success',
      lang === 'en'
        ? `Unlocked "${lecture.title}" successfully!`
        : `تم فتح محاضرة "${lecture.title}" بنجاح!`
    );
  };

  const handleStudentUnlockAttachment = async (file: AttachmentFile) => {
    if (!currentUser) {
      throw new Error(lang === 'en' ? 'Please sign in first.' : 'يرجى تسجيل الدخول أولاً.');
    }
    const updated = await unlockAttachmentWithPoints(file, currentUser);
    syncUpdatedStudentLocally(updated);
    showNotice(
      'success',
      lang === 'en'
        ? `Unlocked "${file.title}" successfully!`
        : `تم فتح مذكرة "${file.title}" بنجاح!`
    );
  };

  const handleStudentClaimReward = async (reward: PointReward) => {
    if (!currentUser) {
      throw new Error(lang === 'en' ? 'Please sign in first.' : 'يرجى تسجيل الدخول أولاً.');
    }
    const updated = await claimRewardWithPoints(reward, currentUser);
    syncUpdatedStudentLocally(updated);
    showNotice(
      'success',
      lang === 'en'
        ? `Congrats! You claimed "${reward.title}"!`
        : `مبروك! حصلت على مكافأة "${reward.title}"!`
    );
  };

  const handleResetAllData = async (): Promise<boolean> => {
    const lecIds = lectures.map((l) => l.id);
    const attIds = attachments.map((a) => a.id);
    const quizIds = quizzes.map((q) => q.id);
    const stuIds = students.map((s) => s.id);

    const ok = await executeAdminCloudWrite(
      async () => {
        await Promise.all([
          ...lecIds.map((id) => deleteLectureFromCloud(id)),
          ...attIds.map((id) => deleteAttachmentFromCloud(id)),
          ...quizIds.map((id) => deleteQuizFromCloud(id)),
          ...stuIds.map((id) => deleteStudentFromCloud(id)),
        ]);
      },
      lang === 'en'
        ? 'All lectures, quizzes, handouts, and student records cleared.'
        : 'تم تصفير كافة الدروس والملفات والامتحانات في السحابة بنجاح.'
    );

    if (ok) {
      setLectures([]);
      setAttachments([]);
      setQuizzes([]);
      setStudents([]);
      localStorage.setItem('mm_lectures', JSON.stringify([]));
      localStorage.setItem('mm_attachments', JSON.stringify([]));
      localStorage.setItem('mm_quizzes', JSON.stringify([]));
      localStorage.removeItem('mm_registered_students');
      sessionStorage.removeItem('mm_registered_students');
    }
    return ok;
  };

  const handleUpdateStudentProfile = (updatedUser: UserProfile, successMessage?: string) => {
    const finalized: UserProfile = { ...updatedUser, profileCompleted: true };
    setCurrentUser(finalized);

    if (
      auth.currentUser &&
      (auth.currentUser.uid === finalized.id || (auth.currentUser.emailVerified && isUserAdmin(currentUser)))
    ) {
      saveStudentToCloud(finalized, auth.currentUser.uid).catch((err) =>
        console.warn('Cloud student profile save warning:', err)
      );
    }

    if (finalized.email) {
      localStorage.setItem(`mm_profile_done_${finalized.email.toLowerCase().trim()}`, 'true');
    }
    if (finalized.id) {
      localStorage.setItem(`mm_profile_done_${finalized.id}`, 'true');
    }
    if (finalized.phone) {
      localStorage.setItem(`mm_profile_done_${finalized.phone.trim()}`, 'true');
    }

    setStudents((prev) => {
      const idx = prev.findIndex(
        (s) => s.id === finalized.id || (finalized.email && s.email === finalized.email)
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = finalized;
        return copy;
      }
      return [finalized, ...prev];
    });

    if (successMessage) {
      showNotice('success', successMessage);
    }
  };

  const handleSaveCloudinaryConfig = async (config: CloudinaryConfig): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(
      () =>
        saveAdminConfigToCloud(
          adminEmailsRef.current || siteConfig.adminEmails || ['mizoo2y2@gmail.com'],
          config,
          undefined,
          { preserveExistingAdmins: true }
        ),
      lang === 'en'
        ? 'Cloudinary settings saved and synced.'
        : 'تم حفظ إعدادات Cloudinary ومزامنتها في السحابة.'
    );
    if (ok) {
      clearAdminConfigCache();
      setCloudinaryConfig(config);
    }
    return ok;
  };

  const handleSaveAdminEmails = async (adminEmails: string[]): Promise<boolean> => {
    let savedEmails: string[] = [];
    const ok = await executeAdminCloudWrite(
      async () => {
        savedEmails = await saveAdminEmailsToCloud(adminEmails, cloudinaryConfigRef.current);
      },
      lang === 'en'
        ? 'Co-Admin permissions saved to cloud!'
        : 'تم حفظ صلاحيات المشرفين في السحابة بنجاح!'
    );
    if (ok && savedEmails.length > 0) {
      clearAdminConfigCache();
      adminEmailsRef.current = savedEmails;
      setSiteConfig((prev) => ({
        ...prev,
        adminEmails: savedEmails,
      }));
    }
    return ok;
  };

  const handleSaveSiteConfig = async (newConfig: SiteConfig): Promise<boolean> => {
    const preservedEmails = Array.from(
      new Set(
        ['mizoo2y2@gmail.com', ...(adminEmailsRef.current || siteConfig.adminEmails || [])]
          .map((e) => e.toLowerCase().trim())
          .filter(Boolean)
      )
    );
    const sanitized: SiteConfig = {
      ...newConfig,
      adminEmails: preservedEmails,
      profileImageUrl: sanitizeProfileImageUrl(newConfig.profileImageUrl),
    };

    const ok = await executeAdminCloudWrite(
      async () => {
        await savePublicSiteConfigToCloud(sanitized);
      },
      lang === 'en'
        ? 'Site updates published live for everyone.'
        : 'تم حفظ ونشر التعديلات مباشرة للجميع.'
    );

    if (ok) {
      setSiteConfig(sanitized);
    }
    return ok;
  };

  const handleScrollToSection = (sectionId: string) => {
    if (currentView !== 'landing') {
      setCurrentView('landing');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectGrade = (grade: GradeLevel) => {
    if (!currentUser) {
      openAuthPage('login');
      return;
    }
    if (currentUser.profileCompleted) {
      handleUpdateStudentProfile({
        ...currentUser,
        grade,
      });
    } else {
      setCurrentUser({
        ...currentUser,
        grade,
      });
    }
    setCurrentView('student');
  };

  const featureFlags = getResolvedFeatureFlags(siteConfig);

  const isStudentMaintenanceBlocked = Boolean(
    currentView === 'student' &&
      currentUser &&
      !isUserAdmin(currentUser) &&
      featureFlags.maintenanceMode
  );

  const shouldShowOnboarding = Boolean(
    currentUser &&
      currentUser.role !== 'teacher' &&
      !currentUser.profileCompleted &&
      !isStudentMaintenanceBlocked
  );

  const isPendingOrRejectedStudent = Boolean(
    currentUser &&
      currentUser.role !== 'teacher' &&
      !isEmailAdmin(firebaseUser?.email || currentUser.email) &&
      currentUser.profileCompleted &&
      !isStudentApproved(currentUser, siteConfig)
  );

  const shouldPromptPasswordLink = Boolean(
    (currentView === 'student' || currentView === 'onboarding') &&
      !isStudentMaintenanceBlocked &&
      featureFlags.allowManualEmailAuth &&
      firebaseUser &&
      !isEmailAdmin(firebaseUser.email) &&
      isGoogleUserWithoutPassword(firebaseUser) &&
      !passwordPromptDismissedUids.includes(firebaseUser.uid)
  );

  const hideChromeForExam =
    currentView === 'student' &&
    !isStudentMaintenanceBlocked &&
    inExamFocusMode &&
    !shouldShowOnboarding &&
    !isPendingOrRejectedStudent &&
    !shouldPromptPasswordLink;

  const dismissPasswordLinkPrompt = (uid: string) => {
    setPasswordPromptDismissedUids((prev) => {
      if (prev.includes(uid)) return prev;
      const next = [...prev, uid];
      try {
        sessionStorage.setItem('mm_skip_pw_uids', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const getBodyFontClass = () => {
    if (siteConfig.bodyFont === 'Tajawal') return 'font-sans';
    return 'font-cairo';
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`min-h-screen flex flex-col font-cairo ${getBodyFontClass()} bg-[#fafffb] dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-teal-500 selection:text-white w-full max-w-full overflow-x-hidden`}
    >
      {resolvingAuth && (
        <div
          dir={isRtl ? 'rtl' : 'ltr'}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[95] px-4 py-2 rounded-xl bg-teal-900/95 text-white border border-teal-400/40 shadow-xl backdrop-blur-md flex items-center gap-2.5 text-xs font-bold font-cairo animate-fade-in"
        >
          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
          <span>
            {lang === 'en'
              ? 'Completing Google Sign-In...'
              : 'جاري استكمال تسجيل الدخول بحساب Google...'}
          </span>
        </div>
      )}

      {/* Non-blocking Cloud Sync Toast */}
      {syncNotice && (
        <div
          dir={isRtl ? 'rtl' : 'ltr'}
          className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[100] p-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-start justify-between gap-3 animate-fade-in ${
            syncNotice.type === 'success'
              ? 'bg-emerald-900/95 border-emerald-500/40 text-white'
              : 'bg-rose-950/95 border-rose-500/50 text-rose-50'
          }`}
        >
          <p className="text-xs sm:text-sm font-bold leading-relaxed font-sans">{syncNotice.message}</p>
          <button
            type="button"
            onClick={() => setSyncNotice(null)}
            className="text-xs px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 shrink-0 cursor-pointer"
          >
            {lang === 'en' ? 'Close' : 'إغلاق'}
          </button>
        </div>
      )}

      {!hideChromeForExam && (
        <Navbar
          siteConfig={siteConfig}
          darkMode={darkMode}
          onToggleTheme={handleToggleTheme}
          currentUser={currentUser}
          onOpenLogin={() => openAuthPage('login')}
          onOpenRegister={() => openAuthPage('register')}
          onLogout={handleLogout}
          currentView={currentView}
          onNavigate={handleNavigate}
          onScrollToSection={handleScrollToSection}
        />
      )}

      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {currentView === 'landing' && (
          <>
            <HeroSection
              siteConfig={siteConfig}
              onJoinNow={() => {
                if (currentUser) {
                  setCurrentView('student');
                } else {
                  openAuthPage('login');
                }
              }}
              onExploreLectures={() => handleScrollToSection('academic-years')}
            />

            <FeaturesSection siteConfig={siteConfig} />

            <AcademicYearsSection
              siteConfig={siteConfig}
              lectures={lectures}
              attachments={attachments}
              onSelectGrade={handleSelectGrade}
              onPreviewCurriculum={(grade) => {
                handleSelectGrade(grade);
              }}
            />
          </>
        )}

        {currentView === 'auth' && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <AuthModals
              loginOpen={authInitialTab === 'login'}
              registerOpen={authInitialTab === 'register'}
              onClose={() => handleNavigate('landing')}
              onLoginSuccess={handleLoginSuccess}
              onSwitchToRegister={() => setAuthInitialTab('register')}
              onSwitchToLogin={() => setAuthInitialTab('login')}
              siteConfig={siteConfig}
            />
          </Suspense>
        )}

        {shouldPromptPasswordLink && firebaseUser && (
          <LinkPasswordSetup
            firebaseUser={firebaseUser}
            variant="page"
            onLinkedSuccess={(updatedFbUser) => {
              setFirebaseUser(updatedFbUser);
              dismissPasswordLinkPrompt(updatedFbUser.uid);
              showNotice(
                'success',
                lang === 'en'
                  ? 'Password saved! You can now sign in manually with Email & Password anytime.'
                  : 'تم حفظ كلمة المرور! يمكنك الآن الدخول يدوياً بالبريد وكلمة المرور من أي جهاز.'
              );
            }}
            onSkip={() => dismissPasswordLinkPrompt(firebaseUser.uid)}
          />
        )}

        {!shouldPromptPasswordLink &&
          (currentView === 'onboarding' || (currentView === 'student' && shouldShowOnboarding)) &&
          currentUser &&
          shouldShowOnboarding && (
            <Suspense fallback={<ViewLoadingFallback />}>
              <StudentOnboardingModal
                isOpen={true}
                currentUser={currentUser}
                siteConfig={siteConfig}
                onSaveProfile={handleUpdateStudentProfile}
                onCancel={handleLogout}
              />
            </Suspense>
          )}

        {isStudentMaintenanceBlocked && currentUser && (
          <section className="min-h-[75vh] flex flex-col items-center justify-center p-4 sm:p-8 font-cairo">
            <div className="max-w-lg w-full rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-300/80 dark:border-amber-700/70 shadow-lg p-6 sm:p-9 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto">
                <Wrench className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200">
                  <Wrench className="w-3.5 h-3.5" />
                  {lang === 'en' ? 'Scheduled Maintenance' : 'وضع الصيانة المؤقت'}
                </span>

                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {lang === 'en'
                    ? 'Student Portal Temporarily Under Maintenance'
                    : 'المنصة قيد التحديث والصيانة حالياً'}
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {lang === 'en'
                    ? 'The teacher/admin team is currently performing updates on lectures and exams. Access will resume automatically once maintenance ends.'
                    : 'تقوم الإدارة حالياً بتحديث المحاضرات والاختبارات لتحسين تجربتك. ستفتح بوابة الطالب تلقائياً فور انتهاء الصيانة.'}
                </p>
              </div>

              {featureFlags.enableWhatsAppSupport && (
                <a
                  href={buildWhatsAppSupportUrl(
                    siteConfig,
                    lang === 'en'
                      ? `Hello Support Team, I am student ${currentUser.name} checking on platform maintenance.`
                      : `السلام عليكم فريق الدعم، أنا الطالب ${currentUser.name} وأستفسر عن موعد عودة المنصة بعد الصيانة.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <MessageCircle className="w-5 h-5 shrink-0" />
                  <span>
                    {lang === 'en'
                      ? 'Contact Support Team on WhatsApp'
                      : 'تواصل مع فريق الدعم على واتساب'}
                  </span>
                </a>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleNavigate('landing')}
                  className="w-full sm:flex-1 min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  {lang === 'en' ? 'Back to Home' : 'العودة للرئيسية'}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full sm:flex-1 min-h-[42px] px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 hover:bg-rose-100 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Sign Out' : 'تسجيل الخروج'}</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {!isStudentMaintenanceBlocked &&
          !shouldPromptPasswordLink &&
          currentView === 'student' &&
          currentUser &&
          !shouldShowOnboarding &&
          isPendingOrRejectedStudent && (
            <section className="min-h-[75vh] flex flex-col items-center justify-center p-4 sm:p-8 font-cairo">
              <div className="max-w-lg w-full rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-300/80 dark:border-amber-700/70 shadow-lg p-6 sm:p-9 text-center space-y-5">
                {currentUser.approvalStatus === 'rejected' ? (
                  <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center mx-auto">
                    <XCircle className="w-8 h-8" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto">
                    <Clock3 className="w-8 h-8" />
                  </div>
                )}

                <div className="space-y-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                      currentUser.approvalStatus === 'rejected'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {currentUser.approvalStatus === 'rejected'
                      ? lang === 'en'
                        ? 'Registration Not Approved'
                        : 'الحساب غير مفعّل من الإدارة'
                      : lang === 'en'
                      ? 'Pending Admin Approval'
                      : 'بانتظار موافقة وتفعيل الإدارة'}
                  </span>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    {currentUser.approvalStatus === 'rejected'
                      ? lang === 'en'
                        ? 'Account Access Denied'
                        : 'عذراً، لم يتم قبول هذا الحساب للدخول حالياً'
                      : lang === 'en'
                      ? `Welcome, ${currentUser.name.split(' ')[0]}! Waiting for Activation`
                      : `أهلاً بك يا ${currentUser.name.split(' ')[0]}! حسابك قيد المراجعة الآن`}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {currentUser.approvalStatus === 'rejected'
                      ? lang === 'en'
                        ? 'Only authorized students may access lectures and quizzes. Contact our WhatsApp support team if you believe this is a mistake.'
                        : 'الدخول إلى المنصة مقتصر على الطلاب المعتمدين فقط. إذا كنت من طلاب الأستاذ محمد مصطفى فتواصل مع فريق الدعم على واتساب لمراجعة حسابك.'
                      : lang === 'en'
                      ? 'Your registration has been sent to the teacher/admin team. Once approved, your student portal will unlock automatically without refreshing — or message our support team on WhatsApp to activate faster.'
                      : 'تم استلام طلب تسجيلك وإرساله للإدارة للمراجعة. بمجرد موافقة الأدمن ستفتح منصة الطالب تلقائياً فوراً، كما يمكنك التواصل مع فريق الدعم على واتساب لتفعيل حسابك.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-start text-xs space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white">{currentUser.name}</div>
                  <div className="text-slate-600 dark:text-slate-300 font-mono" dir="ltr">
                    {currentUser.email || currentUser.id}
                  </div>
                  <div className="text-teal-700 dark:text-teal-300 font-semibold">
                    {getGradeDisplayName(currentUser.grade, siteConfig, lang === 'en' ? 'en' : 'ar')}
                    {currentUser.phone ? ` · ${currentUser.phone}` : ''}
                  </div>
                </div>

                {featureFlags.enableWhatsAppSupport && (
                  <a
                    href={buildWhatsAppSupportUrl(
                      siteConfig,
                      lang === 'en'
                        ? `Hello Support Team, please approve my student account:\nName: ${currentUser.name}\nEmail: ${currentUser.email || '-'}\nPhone: ${currentUser.phone || '-'}\nGrade: ${getGradeDisplayName(currentUser.grade, siteConfig, 'en')}`
                        : `السلام عليكم فريق الدعم، أرجو تفعيل حسابي على منصة أ/ محمد مصطفى:\nالاسم: ${currentUser.name}\nالبريد: ${currentUser.email || '-'}\nالهاتف: ${currentUser.phone || '-'}\nالصف: ${getGradeDisplayName(currentUser.grade, siteConfig, 'ar')}`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 shrink-0" />
                    <span>
                      {lang === 'en'
                        ? 'Contact Support Team on WhatsApp'
                        : 'تواصل مع فريق الدعم على واتساب'}
                    </span>
                  </a>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleNavigate('landing')}
                    className="w-full sm:flex-1 min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    {lang === 'en' ? 'Back to Home' : 'العودة للرئيسية'}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full sm:flex-1 min-h-[42px] px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 hover:bg-rose-100 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Sign Out' : 'تسجيل الخروج'}</span>
                  </button>
                </div>
              </div>
            </section>
          )}

        {!isStudentMaintenanceBlocked &&
          !shouldPromptPasswordLink &&
          currentView === 'student' &&
          currentUser &&
          !shouldShowOnboarding &&
          !isPendingOrRejectedStudent && (
            <Suspense fallback={<ViewLoadingFallback />}>
              <StudentPortal
                currentUser={currentUser}
                siteConfig={siteConfig}
                cloudinaryConfig={cloudinaryConfig}
                lectures={lectures}
                quizzes={quizzes}
                attachments={attachments}
                rewards={rewards}
                notifications={notifications}
                onBackToHome={() => handleNavigate('landing')}
                onOpenTeacherDashboard={() => handleNavigate('teacher')}
                onUpdateStudentProfile={handleUpdateStudentProfile}
                onRedeemCode={handleStudentRedeemCode}
                onUnlockLecture={handleStudentUnlockLecture}
                onUnlockAttachment={handleStudentUnlockAttachment}
                onClaimReward={handleStudentClaimReward}
                onReportExamAlert={handleReportExamAlert}
                onExamFocusModeChange={setInExamFocusMode}
              />
            </Suspense>
          )}

        {!shouldPromptPasswordLink && currentView === 'teacher' && isUserAdmin(currentUser) && (
          <Suspense fallback={<DashboardLayoutSkeleton />}>
            <TeacherDashboard
              initialTab={teacherInitialTab}
              lectures={lectures}
              onAddLecture={handleAddLecture}
              onDeleteLecture={handleDeleteLecture}
              onUpdateLecture={handleUpdateLecture}
              attachments={attachments}
              onAddAttachment={handleAddAttachment}
              onUpdateAttachment={handleUpdateAttachment}
              onDeleteAttachment={handleDeleteAttachment}
              quizzes={quizzes}
              onAddQuiz={handleAddQuiz}
              onUpdateQuiz={handleUpdateQuiz}
              onDeleteQuiz={handleDeleteQuiz}
              students={students}
              studentsLoading={studentsLoading}
              onUpdateStudent={handleAdminUpdateStudent}
              onDeleteStudent={handleAdminDeleteStudent}
              onAddStudent={handleAdminAddStudent}
              cloudinaryConfig={cloudinaryConfig}
              onSaveCloudinaryConfig={handleSaveCloudinaryConfig}
              siteConfig={siteConfig}
              onSaveSiteConfig={handleSaveSiteConfig}
              onSaveAdminEmails={handleSaveAdminEmails}
              onBackToHome={() => {
                setTeacherInitialTab('overview');
                handleNavigate('landing');
              }}
              onOpenStudentPortal={() => {
                setTeacherInitialTab('overview');
                handleNavigate('student');
              }}
              onResetAllData={handleResetAllData}
              redeemCodes={redeemCodes}
              rewards={rewards}
              onCreateRedeemCode={handleCreateRedeemCode}
              onCreateRedeemCodesBatch={handleCreateRedeemCodesBatch}
              onToggleRedeemCode={handleToggleRedeemCode}
              onDeleteRedeemCode={handleDeleteRedeemCode}
              onSaveReward={handleSaveReward}
              onDeleteReward={handleDeleteReward}
              notifications={notifications}
              onSaveNotification={handleSaveNotification}
              onDeleteNotification={handleDeleteNotification}
              studentsSyncError={studentsSyncError}
              adminCloudError={adminCloudError}
              lastCloudError={lastCloudError}
              onRetryCloudSync={handleRetryAdminCloudSync}
              examAlerts={examAlerts}
              onResolveExamAlert={handleResolveExamAlert}
              onDeleteExamAlert={handleDeleteExamAlert}
            />
          </Suspense>
        )}

        {(currentView === 'privacy' || currentView === 'terms') && (
          <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-6 font-cairo">
            <button
              type="button"
              onClick={() => handleNavigate('landing')}
              className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <span>{lang === 'en' ? '← Back to Home' : '→ العودة للصفحة الرئيسية'}</span>
            </button>

            <article className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 space-y-5 shadow-xs">
              <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="text-xs font-mono text-teal-600 dark:text-teal-400 font-bold">
                  {lang === 'en' ? 'LEGAL & COMPLIANCE · 2026' : 'السياسات والأحكام · 2026'}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {currentView === 'privacy'
                    ? lang === 'en'
                      ? 'Privacy Policy'
                      : 'سياسة الخصوصية وحماية البيانات'
                    : lang === 'en'
                    ? 'Terms of Use & Platform Guidelines'
                    : 'شروط الاستخدام والالتزام'}
                </h1>
              </div>

              {currentView === 'privacy' ? (
                <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {lang === 'en' ? (
                    <>
                      <p>
                        We treat student privacy and personal contact information (name, student phone number, parent WhatsApp number, and academic grade) as strictly confidential.
                      </p>
                      <p>
                        Contact details are used exclusively to synchronize lecture access, send guardian academic reports, and display the anti-piracy protective watermark during streaming sessions.
                      </p>
                      <p>
                        Every browser tab maintains an isolated login session so signing in on shared or multi-user devices never exposes accounts across sessions.
                      </p>
                      <p className="pt-2 text-xs text-slate-500 dark:text-slate-400">
                        For account inquiries, contact support at{' '}
                        <span className="font-mono font-bold text-teal-600" dir="ltr">
                          {siteConfig.phone1}
                        </span>{' '}
                        or <span className="font-mono font-bold text-teal-600">mizoo2y2@gmail.com</span>.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        نلتزم بحماية خصوصية بيانات الطلاب (الاسم الثلاثي، أرقام الهواتف، ولي الأمر، والسجل الأكاديمي) بأعلى معايير الأمان والتشفير.
                      </p>
                      <p>
                        تُستخدم البيانات المسجلة حصرياً لتأكيد الحضور، ومشاركة تقارير المستوى والدرجات مع ولي الأمر، وحماية البث بالعلامة المائية.
                      </p>
                      <p>
                        كل جلسة دخول معزولة بشكل مستقل لكل متصفح وجهاز لضمان عدم تداخل الحسابات أو الصلاحيات.
                      </p>
                      <p className="pt-2 text-xs text-slate-500 dark:text-slate-400">
                        لأي استفسار يخص بياناتك تواصل معنا عبر{' '}
                        <span className="font-mono font-bold text-teal-600" dir="ltr">
                          {siteConfig.phone1}
                        </span>{' '}
                        أو <span className="font-mono font-bold text-teal-600">mizoo2y2@gmail.com</span>.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {lang === 'en' ? (
                    <>
                      <p>
                        All chemistry video lectures, PDF handouts, question banks, and interactive explanations are exclusive intellectual property of Mr. Mohamed Mostafa.
                      </p>
                      <p>
                        Screen recording, redistributing video files, or sharing personal account credentials outside the authorized student scope is strictly prohibited.
                      </p>
                      <p>
                        Lecture points, redeem codes, and sequential quizzes are personal to each student account and are automatically verified in real time.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        جميع المحاضرات المصورة، المذكرات الرقمية PDF، وبنوك الأسئلة حقوق ملكية فكرية حصرية للأستاذ محمد مصطفى.
                      </p>
                      <p>
                        يُحظر تماماً تسجيل الشاشة أو إعادة رفع المحتوى أو مشاركة بيانات الحساب خارج الاستخدام الشخصي للطالب المشترك.
                      </p>
                      <p>
                        نقاط المحفظة وأكواد الشحن مخصصة لحساب الطالب المسجل فقط وتخضع للتحقق التلقائي الفوري.
                      </p>
                    </>
                  )}
                </div>
              )}
            </article>
          </section>
        )}
      </main>

      {!hideChromeForExam && (
        <div className={currentView === 'student' ? 'hidden lg:block' : ''}>
          <Footer
            siteConfig={siteConfig}
            onNavigate={handleNavigate}
            onScrollToSection={handleScrollToSection}
            onOpenLogin={() => openAuthPage('login')}
            onOpenSecretAdmin={() => {
              if (isUserAdmin(currentUser)) {
                setTeacherInitialTab('site-customizer');
                handleNavigate('teacher');
              } else {
                openAuthPage('login');
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
