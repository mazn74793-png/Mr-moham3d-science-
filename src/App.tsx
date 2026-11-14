import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { onAuthStateChanged, signOut, getRedirectResult, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { AcademicYearsSection } from './components/AcademicYearsSection';
import { Footer } from './components/Footer';
import { INITIAL_CLOUDINARY_CONFIG } from './data/initialData';
import { Lecture, AttachmentFile, Quiz, CloudinaryConfig, UserProfile, GradeLevel } from './types';
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

const ViewLoadingFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center p-8">
    <div className="flex flex-col items-center gap-3 text-teal-600 dark:text-teal-400">
      <div className="w-10 h-10 border-4 border-teal-500/30 border-t-teal-600 rounded-full animate-spin" />
      <span className="text-xs font-bold font-kufi">جاري التحميل بسرعة فائقة...</span>
    </div>
  </div>
);

export default function App() {
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

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('mm_user');
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

  const [currentView, setCurrentView] = useState<'landing' | 'student' | 'teacher'>('landing');
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
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

  const [students, setStudents] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('mm_registered_students');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cloudinaryConfig, setCloudinaryConfig] = useState<CloudinaryConfig>(() => {
    const saved = localStorage.getItem('mm_cloudinary');
    try {
      return saved ? JSON.parse(saved) : INITIAL_CLOUDINARY_CONFIG;
    } catch {
      return INITIAL_CLOUDINARY_CONFIG;
    }
  });

  const adminBootstrappedRef = useRef(false);
  const adminEmailsRef = useRef<string[]>(siteConfig.adminEmails || ['mizoo2y2@gmail.com']);
  useEffect(() => {
    adminEmailsRef.current = siteConfig.adminEmails || ['mizoo2y2@gmail.com'];
  }, [siteConfig.adminEmails]);

  const isEmailAdmin = useCallback((email?: string | null, extraEmails?: string[]) => {
    if (!email) return false;
    const clean = email.toLowerCase().trim();
    if (clean === 'mizoo2y2@gmail.com') return true;
    const list = extraEmails || adminEmailsRef.current || [];
    return list.some((e) => e.toLowerCase().trim() === clean);
  }, []);

  const isUserAdmin = useCallback(
    (user: UserProfile | null) => {
      if (!user) return false;
      if (user.role === 'teacher') return Boolean(firebaseUser);
      return Boolean(firebaseUser) && isEmailAdmin(user.email);
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

  // 1. Unified Firebase Auth Listener + Redirect recovery
  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      if (err?.code) {
        console.warn('Redirect sign-in warning:', err.code);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      setAuthReady(true);

      if (!fbUser) {
        setCurrentUser((prev) => (prev && prev.role === 'teacher' ? null : prev));
        return;
      }

      const email = fbUser.email || '';
      const adminCfg = await fetchAdminConfigIfAuthorized();
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
          localStorage.setItem('mm_cloudinary', JSON.stringify(nextCloud));
        }
      }

      const isAdmin = Boolean(adminCfg) || isEmailAdmin(email);

      if (isAdmin) {
        setCurrentUser((prev) => ({
          id: fbUser.uid,
          name: siteConfig.teacherName ? `أ/ ${siteConfig.teacherName}` : 'أ/ محمد مصطفى',
          email,
          role: 'teacher',
          grade: 'third',
          phone: siteConfig.phone1 || '01002345678',
          parentPhone: '',
          avatarUrl: fbUser.photoURL || prev?.avatarUrl || '',
          score: 0,
          profileCompleted: true,
          watchedLectureIds: [],
          passedQuizIds: [],
          quizScores: {},
          joinedAt: prev?.joinedAt || new Date().toISOString().split('T')[0],
        }));

        if (!adminBootstrappedRef.current) {
          adminBootstrappedRef.current = true;
          try {
            const [siteSnap, adminSnap] = await Promise.all([
              getDoc(doc(db, 'publicConfig', 'site')),
              getDoc(doc(db, 'adminConfig', 'settings')),
            ]);

            if (!siteSnap.exists()) {
              await savePublicSiteConfigToCloud({
                ...siteConfig,
                profileImageUrl: sanitizeProfileImageUrl(siteConfig.profileImageUrl),
              });
            }
            if (!adminSnap.exists()) {
              await saveAdminConfigToCloud(
                siteConfig.adminEmails || ['mizoo2y2@gmail.com'],
                cloudinaryConfig
              );
            }
          } catch (err) {
            console.warn('Admin bootstrap warning:', err);
          }
        }
      } else {
        try {
          const cloudStudent = await getStudentFromCloud(fbUser.uid);
          if (cloudStudent) {
            setCurrentUser({
              ...cloudStudent,
              avatarUrl: fbUser.photoURL || cloudStudent.avatarUrl || '',
              profileCompleted: Boolean(cloudStudent.profileCompleted),
            });
          } else {
            setCurrentUser((prev) => {
              if (prev && prev.id === fbUser.uid) return prev;
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
                profileCompleted: false,
                watchedLectureIds: [],
                passedQuizIds: [],
                quizScores: {},
                joinedAt: new Date().toISOString().split('T')[0],
              };
            });
          }
        } catch (err) {
          console.warn('Student cloud fetch warning:', err);
        }
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmailAdmin]);

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

    return () => {
      unsubSite();
      unsubLectures();
      unsubAttachments();
      unsubQuizzes();
    };
  }, []);

  // 3. Authenticated Real-Time Firestore Listeners
  useEffect(() => {
    if (!firebaseUser) return;

    const unsubscribers: Array<() => void> = [];
    const userIsAdmin = isEmailAdmin(firebaseUser.email) || currentUser?.role === 'teacher';

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
                localStorage.setItem('mm_cloudinary', JSON.stringify(nextCloud));
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

  // Persist local cache
  useEffect(() => {
    localStorage.setItem('mm_site_config', JSON.stringify(siteConfig));
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
    localStorage.setItem('mm_registered_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('mm_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('mm_user');
    }
  }, [currentUser]);

  // Strict route guard
  useEffect(() => {
    if (!authReady) return;
    if (currentView === 'teacher' && !isUserAdmin(currentUser)) {
      setCurrentView('landing');
      setLoginModalOpen(true);
    } else if (currentView === 'student' && !currentUser) {
      setCurrentView('landing');
      setLoginModalOpen(true);
    }
  }, [authReady, currentView, currentUser, isUserAdmin]);

  // Execute an admin Firestore write reliably using live session
  const executeAdminCloudWrite = async (
    action: () => Promise<void>,
    successMsg?: string
  ): Promise<boolean> => {
    if (!auth.currentUser) {
      setLoginModalOpen(true);
      showNotice('error', 'انتهت جلسة المشرف، يرجى تسجيل الدخول بحساب Google مرة واحدة للمتابعة.');
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
      showNotice('error', 'حدث خطأ أثناء الحفظ في قاعدة البيانات، يرجى التحقق من الاتصال والمحاولة مرة أخرى.');
      return false;
    }
  };

  const handleNavigate = (view: 'landing' | 'student' | 'teacher') => {
    if (view === 'teacher') {
      if (!isUserAdmin(currentUser)) {
        setLoginModalOpen(true);
        return;
      }
      setCurrentView('teacher');
      return;
    }
    if (view === 'student') {
      if (!currentUser) {
        setLoginModalOpen(true);
        return;
      }
      setCurrentView('student');
      return;
    }
    setCurrentView(view);
  };

  const handleToggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  const handleLoginSuccess = async (user: UserProfile) => {
    let isAdmin = user.role === 'teacher' || isEmailAdmin(user.email);
    if (!isAdmin && auth.currentUser) {
      const adminCfg = await fetchAdminConfigIfAuthorized();
      if (adminCfg) {
        isAdmin = true;
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
      }
    }

    if (isAdmin) {
      const finalAdmin: UserProfile = { ...user, role: 'teacher', profileCompleted: true };
      setCurrentUser(finalAdmin);
      setCurrentView('teacher');
      return;
    }

    let matched: UserProfile | undefined = students.find(
      (s) =>
        (user.id && s.id === user.id) ||
        (user.email && s.email && s.email.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
        (user.phone && s.phone && s.phone === user.phone)
    );

    if (!matched && auth.currentUser) {
      try {
        const cloudStudent = await getStudentFromCloud(auth.currentUser.uid);
        if (cloudStudent) matched = cloudStudent;
      } catch (e) {
        console.warn('Cloud student lookup error:', e);
      }
    }

    const isMarkedDone =
      Boolean(user.profileCompleted) ||
      Boolean(matched?.profileCompleted) ||
      Boolean(
        user.email && localStorage.getItem(`mm_profile_done_${user.email.toLowerCase().trim()}`) === 'true'
      ) ||
      Boolean(user.id && localStorage.getItem(`mm_profile_done_${user.id}`) === 'true');

    const finalUser: UserProfile = matched
      ? {
          ...matched,
          avatarUrl: user.avatarUrl || matched.avatarUrl,
          name: matched.name || user.name,
          profileCompleted: isMarkedDone,
        }
      : {
          ...user,
          profileCompleted: isMarkedDone,
        };

    setCurrentUser(finalUser);

    if (finalUser.profileCompleted && auth.currentUser && auth.currentUser.emailVerified) {
      saveStudentToCloud(finalUser, auth.currentUser.uid).catch((err) =>
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

    setCurrentView('student');
  };

  const handleLogout = () => {
    signOut(auth).catch((e) => console.warn('Sign out warning:', e));
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
    const ok = await executeAdminCloudWrite(() => saveStudentToCloud(student, student.id));
    if (ok) {
      setStudents((prev) => [student, ...prev.filter((s) => s.id !== student.id)]);
    }
    return ok;
  };

  const handleAdminUpdateStudent = async (student: UserProfile): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(() => saveStudentToCloud(student, student.id));
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
      localStorage.setItem('mm_registered_students', JSON.stringify([]));
    }
    return ok;
  };

  const handleUpdateStudentProfile = (updatedUser: UserProfile) => {
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
    } else {
      fetch('/api/students/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalized),
      }).catch(() => {});
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
  };

  const handleSaveCloudinaryConfig = async (config: CloudinaryConfig): Promise<boolean> => {
    const ok = await executeAdminCloudWrite(
      () => saveAdminConfigToCloud(siteConfig.adminEmails || ['mizoo2y2@gmail.com'], config),
      'تم حفظ إعدادات Cloudinary ومزامنتها في السحابة.'
    );
    if (ok) {
      setCloudinaryConfig(config);
      localStorage.setItem('mm_cloudinary', JSON.stringify(config));
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
      localStorage.setItem('mm_site_config', JSON.stringify(sanitized));
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
      setLoginModalOpen(true);
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
      className={`min-h-screen flex flex-col font-cairo ${getBodyFontClass()} bg-[#fafffb] dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-teal-500 selection:text-white w-full max-w-full overflow-x-hidden`}
    >
      {/* Non-blocking Cloud Sync Toast */}
      {syncNotice && (
        <div
          dir="rtl"
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
            إغلاق
          </button>
        </div>
      )}

      <Navbar
        siteConfig={siteConfig}
        darkMode={darkMode}
        onToggleTheme={handleToggleTheme}
        currentUser={currentUser}
        onOpenLogin={() => setLoginModalOpen(true)}
        onOpenRegister={() => setLoginModalOpen(true)}
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
                  setLoginModalOpen(true);
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

        {currentView === 'student' && currentUser && (
          <Suspense fallback={<ViewLoadingFallback />}>
            <StudentPortal
              currentUser={currentUser}
              siteConfig={siteConfig}
              lectures={lectures}
              quizzes={quizzes}
              attachments={attachments}
              onBackToHome={() => setCurrentView('landing')}
              onOpenTeacherDashboard={() => handleNavigate('teacher')}
              onUpdateStudentProfile={handleUpdateStudentProfile}
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
              onDeleteAttachment={handleDeleteAttachment}
              quizzes={quizzes}
              onAddQuiz={handleAddQuiz}
              onDeleteQuiz={handleDeleteQuiz}
              students={students}
              onUpdateStudent={handleAdminUpdateStudent}
              onDeleteStudent={handleAdminDeleteStudent}
              onAddStudent={handleAdminAddStudent}
              cloudinaryConfig={cloudinaryConfig}
              onSaveCloudinaryConfig={handleSaveCloudinaryConfig}
              siteConfig={siteConfig}
              onSaveSiteConfig={handleSaveSiteConfig}
              onBackToHome={() => setCurrentView('landing')}
              onOpenStudentPortal={() => handleNavigate('student')}
              onResetAllData={handleResetAllData}
            />
          </Suspense>
        )}
      </main>

      <div className={currentView === 'student' ? 'hidden lg:block' : ''}>
        <Footer
          siteConfig={siteConfig}
          onNavigate={handleNavigate}
          onScrollToSection={handleScrollToSection}
          onOpenLogin={() => setLoginModalOpen(true)}
          onOpenSecretAdmin={() => setSecretAdminOpen(true)}
        />
      </div>

      {(loginModalOpen || registerModalOpen) && (
        <Suspense fallback={null}>
          <AuthModals
            loginOpen={loginModalOpen}
            registerOpen={registerModalOpen}
            onClose={() => {
              setLoginModalOpen(false);
              setRegisterModalOpen(false);
            }}
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={() => {
              setLoginModalOpen(false);
              setRegisterModalOpen(true);
            }}
            onSwitchToLogin={() => {
              setRegisterModalOpen(false);
              setLoginModalOpen(true);
            }}
            siteConfig={siteConfig}
          />
        </Suspense>
      )}

      {currentUser && shouldShowOnboarding && (
        <Suspense fallback={null}>
          <StudentOnboardingModal
            isOpen={shouldShowOnboarding}
            currentUser={currentUser}
            siteConfig={siteConfig}
            onSaveProfile={handleUpdateStudentProfile}
          />
        </Suspense>
      )}

      {secretAdminOpen && (
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
