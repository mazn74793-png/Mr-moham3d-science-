import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { onAuthStateChanged, signOut, getRedirectResult, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { AcademicYearsSection } from './components/AcademicYearsSection';
import { Footer, AppView } from './components/Footer';
import { useLanguage } from './context/LanguageContext';
import { INITIAL_CLOUDINARY_CONFIG } from './data/initialData';
import {
  Lecture,
  AttachmentFile,
  Quiz,
  CloudinaryConfig,
  UserProfile,
  GradeLevel,
  RedeemCode,
  PointReward,
} from './types';
import { SiteConfig, DEFAULT_SITE_CONFIG } from './types/siteConfig';
import {
  auth,
  db,
  savePublicSiteConfigToCloud,
  saveAdminConfigToCloud,
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
  saveRedeemCodeToCloud,
  saveRedeemCodesBatchToCloud,
  toggleRedeemCodeActiveInCloud,
  deleteRedeemCodeFromCloud,
  savePointRewardToCloud,
  deletePointRewardFromCloud,
  redeemCodeForStudent,
  unlockLectureWithPoints,
  unlockAttachmentWithPoints,
  claimRewardWithPoints,
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
const SecretAdminCustomizerModal = lazy(() =>
  import('./components/SecretAdminCustomizerModal').then((m) => ({
    default: m.SecretAdminCustomizerModal,
  }))
);

function sanitizeProfileImageUrl(url?: string): string {
  if (!url) return '';
  if (url.includes('teacher_mohamed_mostafa_1794141316649')) return '';
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

  // Purge legacy cross-tab sensitive keys from localStorage on boot so every session/tab stays isolated
  useEffect(() => {
    try {
      localStorage.removeItem('mm_user');
      localStorage.removeItem('mm_last_view');
      localStorage.removeItem('mm_registered_students');
      localStorage.removeItem('mm_redeem_codes');
      localStorage.removeItem('mm_cloudinary');
      localStorage.removeItem('mm_auth_redirect_pending');
      localStorage.removeItem('mm_auth_redirect_ts');
    } catch {}
  }, []);

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
    const saved = sessionStorage.getItem('mm_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserProfile;
        // Require a live Firebase Auth session for teacher/admin accounts — never trust stale local teacher state
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

  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');
  const [secretAdminOpen, setSecretAdminOpen] = useState(false);

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

  const adminBootstrappedRef = useRef(false);
  const adminEmailsRef = useRef<string[]>(siteConfig.adminEmails || ['mizoo2y2@gmail.com']);
  const siteConfigRef = useRef(siteConfig);
  const cloudinaryConfigRef = useRef(cloudinaryConfig);
  const studentsRef = useRef(students);
  const currentUserRef = useRef(currentUser);
  const hasManualNavigatedRef = useRef(false);
  const lastLoginHydratedRef = useRef<{ uid: string; ts: number } | null>(null);

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

  const isEmailAdmin = useCallback((email?: string | null, extraEmails?: string[]) => {
    if (!email) return false;
    const clean = email.toLowerCase().trim();
    if (clean === 'mizoo2y2@gmail.com') return true;
    const list = extraEmails || adminEmailsRef.current || [];
    return list.some((e) => e.toLowerCase().trim() === clean);
  }, []);

  const isUserAdmin = useCallback(
    (user: UserProfile | null) => {
      if (!firebaseUser || !firebaseUser.email || !firebaseUser.emailVerified) return false;
      if (!user || user.role !== 'teacher') return false;
      return isEmailAdmin(firebaseUser.email);
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
      } else {
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
            watchedLectureIds: [],
            passedQuizIds: [],
            quizScores: {},
            joinedAt: new Date().toISOString().split('T')[0],
          };
        });
      }

      // Restore portal view ONLY within the same isolated tab session
      const savedLastView = sessionStorage.getItem('mm_last_view');
      if (options?.fromRedirect) {
        const target = optimisticAdmin ? 'teacher' : 'student';
        setCurrentView(target);
        sessionStorage.setItem('mm_last_view', target);
      } else if (!hasManualNavigatedRef.current && savedLastView) {
        if (savedLastView === 'teacher' && optimisticAdmin) {
          setCurrentView('teacher');
        } else if (savedLastView === 'student') {
          setCurrentView('student');
        }
      }

      // Avoid duplicate Firestore fetches if handleLoginSuccess already triggered them within 2s
      const now = Date.now();
      const skipDuplicateViewSwap =
        lastLoginHydratedRef.current &&
        lastLoginHydratedRef.current.uid === fbUser.uid &&
        now - lastLoginHydratedRef.current.ts < 3000;

      // 2. Single deduplicated background Firestore verification & sync (capped at 2.5s timeout)
      const [adminCfg, cloudStudent] = await Promise.all([
        fbUser.emailVerified ? fetchAdminConfigIfAuthorized(2500) : Promise.resolve(null),
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
        Boolean(fbUser.emailVerified) &&
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

        if (!skipDuplicateViewSwap && (options?.fromRedirect || savedLastView === 'teacher')) {
          setCurrentView('teacher');
          sessionStorage.setItem('mm_last_view', 'teacher');
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
                  siteConfigRef.current.adminEmails || ['mizoo2y2@gmail.com'],
                  cloudinaryConfigRef.current
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
          });
        }
      }
    },
    [isEmailAdmin]
  );

  // 1. Unified Firebase Auth Listener + Unconditional Redirect & Tab-Return Recovery
  useEffect(() => {
    let mounted = true;
    let redirectCheckDone = false;

    const handleRedirectCheck = async () => {
      const pendingBefore = hasPendingRedirectFlag();
      try {
        // Always call getRedirectResult unconditionally so OAuth returns work even if sessionStorage was reset
        const res = await getRedirectResult(auth);
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
            await auth.authStateReady().catch(() => {});
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
        } else if (code) {
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

  // 2. Public Real-Time Firestore Listeners
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

    return () => {
      unsubSite();
      unsubLectures();
      unsubAttachments();
      unsubQuizzes();
      unsubRewards();
    };
  }, []);

  // 3. Authenticated Real-Time Firestore Listeners
  useEffect(() => {
    if (!firebaseUser) return;

    const unsubscribers: Array<() => void> = [];
    const userIsAdmin =
      Boolean(firebaseUser.emailVerified) && isEmailAdmin(firebaseUser.email);

    if (userIsAdmin) {
      unsubscribers.push(
        onSnapshot(
          doc(db, 'adminConfig', 'settings'),
          (snap) => {
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
          }
        )
      );

      unsubscribers.push(
        onSnapshot(
          collection(db, 'students'),
          (snap) => {
            const list = snap.docs.map((d) => d.data() as UserProfile);
            setStudents(list);
          },
          (error) => {
            console.warn('Students admin listener error:', error.message);
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
    } else {
      const ownStudentQuery = query(
        collection(db, 'students'),
        where('uid', '==', firebaseUser.uid)
      );
      unsubscribers.push(
        onSnapshot(
          ownStudentQuery,
          (snap) => {
            if (!snap.empty) {
              const docData = snap.docs[0].data() as UserProfile;
              setCurrentUser((prev) => ({
                ...docData,
                avatarUrl: prev?.avatarUrl || docData.avatarUrl || '',
                profileCompleted: Boolean(docData.profileCompleted),
              }));
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
  }, [firebaseUser, isEmailAdmin, currentUser?.role]);

  // Persist public non-sensitive cache in localStorage (never store adminEmails), keep session state in sessionStorage ONLY
  useEffect(() => {
    const publicSiteCache: Partial<SiteConfig> = { ...siteConfig };
    delete publicSiteCache.adminEmails;
    localStorage.setItem('mm_site_config', JSON.stringify(publicSiteCache));
  }, [siteConfig]);

  useEffect(() => {
    localStorage.setItem('mm_lectures', JSON.stringify(lectures));
  }, [lectures]);

  useEffect(() => {
    localStorage.setItem('mm_attachments', JSON.stringify(attachments));
  }, [attachments]);

  useEffect(() => {
    localStorage.setItem('mm_quizzes', JSON.stringify(quizzes));
  }, [quizzes]);

  useEffect(() => {
    localStorage.setItem('mm_rewards', JSON.stringify(rewards));
  }, [rewards]);

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('mm_user', JSON.stringify(currentUser));
    } else if (authReady) {
      sessionStorage.removeItem('mm_user');
    }
  }, [currentUser, authReady]);

  const openAuthPage = useCallback((tab: 'login' | 'register' = 'login') => {
    hasManualNavigatedRef.current = true;
    setAuthInitialTab(tab);
    setCurrentView('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Strict route guard
  useEffect(() => {
    if (!authReady) return;
    if (currentView === 'teacher' && !isUserAdmin(currentUser)) {
      openAuthPage('login');
    } else if ((currentView === 'student' || currentView === 'onboarding') && !currentUser) {
      openAuthPage('login');
    }
  }, [authReady, currentView, currentUser, isUserAdmin, openAuthPage]);

  // Execute an admin Firestore write reliably using live session
  const executeAdminCloudWrite = async (
    action: () => Promise<void>,
    successMsg?: string
  ): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      showNotice(
        'error',
        lang === 'en'
          ? 'No internet connection — check your network to save changes.'
          : 'لا يوجد اتصال بالإنترنت — تأكد من الشبكة لحفظ التغييرات.'
      );
      return false;
    }

    if (!auth.currentUser) {
      openAuthPage('login');
      showNotice(
        'error',
        lang === 'en'
          ? 'Admin session expired. Please sign in with Google to continue.'
          : 'انتهت جلسة المشرف، يرجى تسجيل الدخول بحساب Google مرة واحدة للمتابعة.'
      );
      return false;
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
      showNotice(
        'error',
        'هذا الحساب غير مفعل كمشرف في قاعدة البيانات السحابية. تأكد من إضافته في قائمة المشرفين.'
      );
      return false;
    }

    try {
      await action();
      if (successMsg) {
        showNotice('success', successMsg);
      }
      return true;
    } catch (err) {
      console.error('Cloud write error:', err);
      showNotice(
        'error',
        'حدث خطأ أثناء الحفظ في قاعدة البيانات، يرجى التحقق من الاتصال والمحاولة مرة أخرى.'
      );
      return false;
    }
  };

  const handleNavigate = (view: AppView) => {
    hasManualNavigatedRef.current = true;
    if (view === 'teacher') {
      if (!isUserAdmin(currentUser)) {
        openAuthPage('login');
        return;
      }
      setCurrentView('teacher');
      sessionStorage.setItem('mm_last_view', 'teacher');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (view === 'student') {
      if (!currentUser) {
        openAuthPage('login');
        return;
      }
      setCurrentView('student');
      sessionStorage.setItem('mm_last_view', 'student');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (view === 'auth') {
      openAuthPage('login');
      return;
    }
    if (view === 'landing') {
      sessionStorage.setItem('mm_last_view', 'landing');
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  const handleLoginSuccess = async (user: UserProfile) => {
    hasManualNavigatedRef.current = true;
    const fbUser = auth.currentUser;
    if (fbUser) {
      setFirebaseUser(fbUser);
      lastLoginHydratedRef.current = { uid: fbUser.uid, ts: Date.now() };
    }

    const verifiedEmail =
      fbUser && fbUser.emailVerified && fbUser.email
        ? fbUser.email.toLowerCase().trim()
        : '';
    const isInstantVerifiedAdmin =
      Boolean(verifiedEmail) &&
      (user.role === 'teacher' || isEmailAdmin(verifiedEmail));

    // Fast path for verified admins: transition immediately with zero blocking wait
    if (isInstantVerifiedAdmin && fbUser) {
      const finalAdmin: UserProfile = {
        ...user,
        id: fbUser.uid,
        email: fbUser.email || user.email,
        role: 'teacher',
        profileCompleted: true,
      };
      setCurrentUser(finalAdmin);
      setCurrentView('teacher');
      sessionStorage.setItem('mm_last_view', 'teacher');
      return;
    }

    // For students or newly-added co-admins: finish immediately if already resolved in AuthModals (deduplicated 1.5s cache)
    let isCloudAdmin = false;
    if (fbUser && fbUser.emailVerified && verifiedEmail) {
      const adminCfg = await fetchAdminConfigIfAuthorized(1500);
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
        isCloudAdmin = mergedEmails.includes(verifiedEmail);
      }
    }

    if (isCloudAdmin && fbUser) {
      const finalAdmin: UserProfile = {
        ...user,
        id: fbUser.uid,
        email: fbUser.email || user.email,
        role: 'teacher',
        profileCompleted: true,
      };
      setCurrentUser(finalAdmin);
      setCurrentView('teacher');
      sessionStorage.setItem('mm_last_view', 'teacher');
      return;
    }

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

    const finalUser: UserProfile = {
      ...sanitizedStudentInput,
      ...matched,
      name: matched.name || sanitizedStudentInput.name,
      avatarUrl: sanitizedStudentInput.avatarUrl || matched.avatarUrl,
      role: 'student',
      profileCompleted: isMarkedDone,
    };

    setCurrentUser(finalUser);
    setCurrentView('student');
    sessionStorage.setItem('mm_last_view', 'student');

    if (finalUser.profileCompleted && fbUser && fbUser.emailVerified) {
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
    signOut(auth).catch((e) => console.warn('Sign out warning:', e));
    adminEmailsRef.current = ['mizoo2y2@gmail.com'];
    setSiteConfig((prev) => ({
      ...prev,
      adminEmails: ['mizoo2y2@gmail.com'],
    }));
    setCloudinaryConfig(INITIAL_CLOUDINARY_CONFIG);
    setStudents([]);
    setRedeemCodes([]);
    setFirebaseUser(null);
    setCurrentUser(null);
    setCurrentView('landing');
  };

  const handleAddLecture = async (newLec: Lecture): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(
      () => saveLectureToCloud(newLec),
      'تم نشر المحاضرة وحفظها في السحابة!'
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
      'تم تحديث المحاضرة وحفظها في السحابة!'
    );
    if (ok) {
      setLectures((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    }
    return ok;
  };

  const handleAddAttachment = async (newFile: AttachmentFile): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(
      () => saveAttachmentToCloud(newFile),
      'تم نشر المذكرة وحفظها في السحابة!'
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
      'تم تحديث بيانات المذكرة وحفظ التعديلات في السحابة!'
    );
    if (ok) {
      setAttachments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    }
    return ok;
  };

  const handleAddQuiz = async (newQuiz: Quiz): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(
      () => saveQuizToCloud(newQuiz),
      'تم حفظ ونشر الامتحان في السحابة!'
    );
    if (ok) {
      setQuizzes((prev) => [newQuiz, ...prev.filter((q) => q.id !== newQuiz.id)]);
    }
    return ok;
  };

  const handleUpdateQuiz = async (updatedQuiz: Quiz): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(
      () => saveQuizToCloud(updatedQuiz),
      'تم تحديث الامتحان والأسئلة وحفظ التعديلات في السحابة!'
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
      `تم حفظ كود (${codeItem.code}) في قاعدة البيانات!`
    );
    if (ok) {
      setRedeemCodes((prev) => [codeItem, ...prev.filter((c) => c.id !== codeItem.id)]);
    }
    return ok;
  };

  const handleCreateRedeemCodesBatch = async (items: RedeemCode[]): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(
      () => saveRedeemCodesBatchToCloud(items),
      `تم توليد وحفظ ${items.length} أكواد جديدة في السحابة!`
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
      'تم حفظ المكافأة ونشرها في متجر الطلاب!'
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
      throw new Error('يرجى تسجيل الدخول أولاً.');
    }
    const result = await redeemCodeForStudent(rawCode, currentUser);
    syncUpdatedStudentLocally(result.updatedStudent);
    showNotice('success', `تمت إضافة +${result.pointsAdded} نقطة إلى رصيدك!`);
    return {
      pointsAdded: result.pointsAdded,
      newBalance: result.newBalance,
      code: result.code,
    };
  };

  const handleStudentUnlockLecture = async (lecture: Lecture) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    const updated = await unlockLectureWithPoints(lecture, currentUser);
    syncUpdatedStudentLocally(updated);
    showNotice('success', `تم فتح محاضرة "${lecture.title}" بنجاح!`);
  };

  const handleStudentUnlockAttachment = async (file: AttachmentFile) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    const updated = await unlockAttachmentWithPoints(file, currentUser);
    syncUpdatedStudentLocally(updated);
    showNotice('success', `تم فتح مذكرة "${file.title}" بنجاح!`);
  };

  const handleStudentClaimReward = async (reward: PointReward) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول أولاً.');
    const updated = await claimRewardWithPoints(reward, currentUser);
    syncUpdatedStudentLocally(updated);
    showNotice('success', `مبروك! حصلت على مكافأة "${reward.title}"!`);
  };

  const handleResetAllData = async (): Promise<boolean> => {
    const lecIds = lectures.map((l) => l.id);
    const attIds = attachments.map((a) => a.id);
    const quizIds = quizzes.map((q) => q.id);
    const stuIds = students.map((s) => s.id);

    const ok = await executeAdminCloudWrite(async () => {
      await Promise.all([
        ...lecIds.map((id) => deleteLectureFromCloud(id)),
        ...attIds.map((id) => deleteAttachmentFromCloud(id)),
        ...quizIds.map((id) => deleteQuizFromCloud(id)),
        ...stuIds.map((id) => deleteStudentFromCloud(id)),
      ]);
    }, 'تم تصفير كافة الدروس والملفات والامتحانات في السحابة بنجاح.');

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
      auth.currentUser.emailVerified &&
      (auth.currentUser.uid === finalized.id || isUserAdmin(currentUser))
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
      () => saveAdminConfigToCloud(siteConfig.adminEmails || ['mizoo2y2@gmail.com'], config),
      'تم حفظ إعدادات Cloudinary ومزامنتها في السحابة.'
    );
    if (ok) {
      setCloudinaryConfig(config);
    }
    return ok;
  };

  const handleSaveSiteConfig = async (newConfig: SiteConfig): Promise<boolean> => {
    const cleanEmails = Array.from(
      new Set(
        ['mizoo2y2@gmail.com', ...(newConfig.adminEmails || [])]
          .map((e) => e.toLowerCase().trim())
          .filter(Boolean)
      )
    );
    const sanitized: SiteConfig = {
      ...newConfig,
      adminEmails: cleanEmails,
      profileImageUrl: sanitizeProfileImageUrl(newConfig.profileImageUrl),
    };

    const ok = await executeAdminCloudWrite(async () => {
      await savePublicSiteConfigToCloud(sanitized);
      await saveAdminConfigToCloud(cleanEmails, cloudinaryConfig);
    }, 'تم حفظ ونشر التعديلات مباشرة للجميع.');

    if (ok) {
      adminEmailsRef.current = cleanEmails;
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

  const shouldShowOnboarding = Boolean(
    currentUser && currentUser.role !== 'teacher' && !currentUser.profileCompleted
  );

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

        {(currentView === 'onboarding' || (currentView === 'student' && shouldShowOnboarding)) &&
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

        {currentView === 'student' && currentUser && !shouldShowOnboarding && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <StudentPortal
              currentUser={currentUser}
              siteConfig={siteConfig}
              cloudinaryConfig={cloudinaryConfig}
              lectures={lectures}
              quizzes={quizzes}
              attachments={attachments}
              rewards={rewards}
              onBackToHome={() => handleNavigate('landing')}
              onOpenTeacherDashboard={() => handleNavigate('teacher')}
              onUpdateStudentProfile={handleUpdateStudentProfile}
              onRedeemCode={handleStudentRedeemCode}
              onUnlockLecture={handleStudentUnlockLecture}
              onUnlockAttachment={handleStudentUnlockAttachment}
              onClaimReward={handleStudentClaimReward}
            />
          </Suspense>
        )}

        {currentView === 'teacher' && isUserAdmin(currentUser) && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <TeacherDashboard
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
              onUpdateStudent={handleAdminUpdateStudent}
              onDeleteStudent={handleAdminDeleteStudent}
              onAddStudent={handleAdminAddStudent}
              cloudinaryConfig={cloudinaryConfig}
              onSaveCloudinaryConfig={handleSaveCloudinaryConfig}
              siteConfig={siteConfig}
              onSaveSiteConfig={handleSaveSiteConfig}
              onBackToHome={() => handleNavigate('landing')}
              onOpenStudentPortal={() => handleNavigate('student')}
              onResetAllData={handleResetAllData}
              redeemCodes={redeemCodes}
              rewards={rewards}
              onCreateRedeemCode={handleCreateRedeemCode}
              onCreateRedeemCodesBatch={handleCreateRedeemCodesBatch}
              onToggleRedeemCode={handleToggleRedeemCode}
              onDeleteRedeemCode={handleDeleteRedeemCode}
              onSaveReward={handleSaveReward}
              onDeleteReward={handleDeleteReward}
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

      <div className={currentView === 'student' ? 'hidden lg:block' : ''}>
        <Footer
          siteConfig={siteConfig}
          onNavigate={handleNavigate}
          onScrollToSection={handleScrollToSection}
          onOpenLogin={() => openAuthPage('login')}
          onOpenSecretAdmin={() => {
            if (isUserAdmin(currentUser)) {
              setSecretAdminOpen(true);
            } else {
              openAuthPage('login');
            }
          }}
        />
      </div>

      {secretAdminOpen && isUserAdmin(currentUser) && (
        <Suspense fallback={null}>
          <SecretAdminCustomizerModal
            isOpen={secretAdminOpen}
            onClose={() => setSecretAdminOpen(false)}
            siteConfig={siteConfig}
            onSaveSiteConfig={handleSaveSiteConfig}
            cloudinaryConfig={cloudinaryConfig}
          />
        </Suspense>
      )}
    </div>
  );
}
