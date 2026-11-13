import React, { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, signOut, signInWithPopup, signInWithRedirect, getRedirectResult, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { AcademicYearsSection } from './components/AcademicYearsSection';
import { StudentPortal } from './components/StudentPortal';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentOnboardingModal } from './components/StudentOnboardingModal';
import { AuthModals } from './components/AuthModals';
import { SecretAdminCustomizerModal } from './components/SecretAdminCustomizerModal';
import { Footer } from './components/Footer';
import { INITIAL_CLOUDINARY_CONFIG } from './data/initialData';
import { Lecture, AttachmentFile, Quiz, CloudinaryConfig, UserProfile, GradeLevel } from './types';
import { SiteConfig, DEFAULT_SITE_CONFIG } from './types/siteConfig';
import {
  auth,
  db,
  googleProvider,
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
} from './firebase';

function sanitizeProfileImageUrl(url?: string): string {
  if (!url) return '';
  if (url.includes('teacher_mohamed_mostafa_1794141316649')) return '';
  return url;
}

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('mm_theme') === 'dark';
  });

  // Master Site Configuration state
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

  // Firebase Auth user state
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Current logged in user
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('mm_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Non-blocking sync/auth banner for admin writes
  const [syncNotice, setSyncNotice] = useState<{
    type: 'success' | 'error' | 'auth_needed';
    message: string;
  } | null>(null);

  // View state: 'landing' | 'student' | 'teacher'
  const [currentView, setCurrentView] = useState<'landing' | 'student' | 'teacher'>('landing');

  // Modals state
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [secretAdminOpen, setSecretAdminOpen] = useState(false);

  // Curriculum & Uploads state (hydrated live from Firestore onSnapshot)
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
  const pendingAdminActionRef = useRef<(() => Promise<void>) | null>(null);
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
      if (user.role === 'teacher') return true;
      return isEmailAdmin(user.email);
    },
    [isEmailAdmin]
  );

  // Sync theme to <html> tag
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mm_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mm_theme', 'light');
    }
  }, [darkMode]);

  // Helper to show transient sync notice
  const showNotice = useCallback((type: 'success' | 'error' | 'auth_needed', message: string) => {
    setSyncNotice({ type, message });
  }, []);

  useEffect(() => {
    if (!syncNotice || syncNotice.type === 'auth_needed') return;
    const t = setTimeout(() => setSyncNotice(null), 4000);
    return () => clearTimeout(t);
  }, [syncNotice]);

  // 1. Firebase Auth Listener + Redirect recovery: keeps session verified & bootstraps cloud config on first admin login
  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      if (err?.code) {
        console.warn('Redirect sign-in warning:', err.code);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (!fbUser) {
        const isGisActive = sessionStorage.getItem('mm_gis_active') === 'true';
        if (!isGisActive) {
          setCurrentUser((prev) => (prev && prev.role === 'teacher' ? null : prev));
        }
        return;
      }

      const email = fbUser.email || '';
      const isAdmin = isEmailAdmin(email);

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

        // Bootstrap publicConfig/site & adminConfig/settings in Firestore once if they don't exist yet
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
                cloudinaryConfig,
                siteConfig.googleClientId
              );
            }
          } catch (err) {
            console.warn('Admin bootstrap warning:', err);
          }
        }
      } else {
        // Hydrate student profile from Firestore so onboarding & progress persist across all devices
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

  // 2. Public Real-Time Firestore Listeners (Active for ALL visitors, logged in or not, incognito, mobile, shared URL)
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

    const lecturesQuery = query(
      collection(db, 'lectures'),
      where('grade', 'in', ['first', 'second', 'third'])
    );
    const unsubLectures = onSnapshot(
      lecturesQuery,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Lecture);
        list.sort((a, b) => (a.sessionOrder ?? 9999) - (b.sessionOrder ?? 9999) || (b.dateAdded || '').localeCompare(a.dateAdded || ''));
        setLectures(list);
      },
      (error) => {
        console.warn('Lectures listener error:', error.message);
      }
    );

    const attachmentsQuery = query(
      collection(db, 'attachments'),
      where('grade', 'in', ['first', 'second', 'third'])
    );
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

    const quizzesQuery = query(
      collection(db, 'quizzes'),
      where('grade', 'in', ['first', 'second', 'third'])
    );
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

  // 3. Authenticated Real-Time Firestore Listeners (Admin Config, Student Records)
  useEffect(() => {
    if (!firebaseUser) return;

    const unsubscribers: Array<() => void> = [];

    const userIsAdmin = isEmailAdmin(firebaseUser.email);
    const isPrimary = firebaseUser.email?.toLowerCase().trim() === 'mizoo2y2@gmail.com';

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
                googleClientId?: string;
              };
              if (data.cloudName && data.uploadPreset) {
                const nextCloud: CloudinaryConfig = {
                  cloudName: data.cloudName,
                  uploadPreset: data.uploadPreset,
                };
                setCloudinaryConfig(nextCloud);
                localStorage.setItem('mm_cloudinary', JSON.stringify(nextCloud));
              }
              if (Array.isArray(data.adminEmails) || data.googleClientId) {
                setSiteConfig((prev) => ({
                  ...prev,
                  adminEmails: Array.isArray(data.adminEmails) && data.adminEmails.length > 0 ? data.adminEmails : prev.adminEmails,
                  googleClientId: data.googleClientId || prev.googleClientId,
                }));
              }
            }
          },
          (error) => {
            console.warn('AdminConfig listener error:', error.message);
          }
        )
      );

      if (isPrimary) {
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
      }
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
  }, [firebaseUser, isEmailAdmin]);

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

  // Strict route guard: lock student & teacher portals without login
  useEffect(() => {
    if (currentView === 'teacher' && !isUserAdmin(currentUser)) {
      setCurrentView('landing');
      setLoginModalOpen(true);
    } else if (currentView === 'student' && !currentUser) {
      setCurrentView('landing');
      setLoginModalOpen(true);
    }
  }, [currentView, currentUser, isUserAdmin]);

  // Prompt Google sign-in if teacher session lacks live Firebase Auth token
  const handleQuickAdminGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email || '';
      if (isEmailAdmin(email)) {
        if (pendingAdminActionRef.current) {
          const pending = pendingAdminActionRef.current;
          pendingAdminActionRef.current = null;
          await pending();
        }
        showNotice('success', 'تم تفعيل الاتصال السحابي وحفظ التعديلات للجميع بنجاح!');
      } else {
        showNotice('error', 'هذا البريد غير مسجل كمشرف في المنصة.');
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch {}
      }
      showNotice(
        'error',
        code === 'auth/unauthorized-domain'
          ? `النطاق (${window.location.hostname}) غير مضاف في Authorized domains بمشروع Firebase.`
          : `تعذر تأكيد دخول المشرف (${code || 'popup'}). يرجى السماح بالنوافذ المنبثقة والمحاولة مرة أخرى.`
      );
    }
  };

  // Run an admin cloud operation safely
  const executeAdminCloudWrite = async (action: () => Promise<void>, successMsg?: string) => {
    if (!auth.currentUser || !isEmailAdmin(auth.currentUser.email)) {
      pendingAdminActionRef.current = action;
      showNotice(
        'auth_needed',
        'لحفظ التغييرات على قاعدة البيانات ومزامنتها فوراً لجميع المستخدمين، اضغط على الزر بالأسفل لتأكيد حساب المشرف.'
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
      showNotice('error', 'حدث خطأ أثناء الحفظ في السحابة، يرجى التحقق من الاتصال والصلاحيات.');
      return false;
    }
  };

  // Centralized navigation guard
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
    const isAdmin = isUserAdmin(user);

    if (isAdmin) {
      const finalAdmin: UserProfile = { ...user, role: 'teacher', profileCompleted: true };
      setCurrentUser(finalAdmin);
      setCurrentView('teacher');
      return;
    }

    // Lookup existing student record (Firestore if Firebase signed in, else local)
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
      Boolean(user.email && localStorage.getItem(`mm_profile_done_${user.email.toLowerCase().trim()}`) === 'true') ||
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
    sessionStorage.removeItem('mm_gis_active');
    signOut(auth).catch((e) => console.warn('Sign out warning:', e));
    setCurrentUser(null);
    setCurrentView('landing');
  };

  const handleAddLecture = (newLec: Lecture) => {
    setLectures((prev) => [newLec, ...prev]);
    executeAdminCloudWrite(() => saveLectureToCloud(newLec));
  };

  const handleDeleteLecture = (id: string) => {
    setLectures((prev) => prev.filter((l) => l.id !== id));
    executeAdminCloudWrite(() => deleteLectureFromCloud(id));
  };

  const handleUpdateLecture = (updated: Lecture) => {
    setLectures((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    executeAdminCloudWrite(() => saveLectureToCloud(updated));
  };

  const handleAddAttachment = (newFile: AttachmentFile) => {
    setAttachments((prev) => [newFile, ...prev]);
    executeAdminCloudWrite(() => saveAttachmentToCloud(newFile));
  };

  const handleDeleteAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    executeAdminCloudWrite(() => deleteAttachmentFromCloud(id));
  };

  const handleAddQuiz = (newQuiz: Quiz) => {
    setQuizzes((prev) => [newQuiz, ...prev]);
    executeAdminCloudWrite(() => saveQuizToCloud(newQuiz));
  };

  const handleDeleteQuiz = (id: string) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
    executeAdminCloudWrite(() => deleteQuizFromCloud(id));
  };

  const handleAdminDeleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    executeAdminCloudWrite(() => deleteStudentFromCloud(studentId));
  };

  const handleAdminAddStudent = (student: UserProfile) => {
    setStudents((prev) => [student, ...prev]);
    executeAdminCloudWrite(() => saveStudentToCloud(student, student.id));
  };

  const handleAdminUpdateStudent = (student: UserProfile) => {
    setStudents((prev) => {
      const idx = prev.findIndex((s) => s.id === student.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = student;
        return copy;
      }
      return [student, ...prev];
    });
    executeAdminCloudWrite(() => saveStudentToCloud(student, student.id));
  };

  const handleResetAllData = () => {
    const lecIds = lectures.map((l) => l.id);
    const attIds = attachments.map((a) => a.id);
    const quizIds = quizzes.map((q) => q.id);
    const stuIds = students.map((s) => s.id);

    setLectures([]);
    setAttachments([]);
    setQuizzes([]);
    setStudents([]);
    localStorage.setItem('mm_lectures', JSON.stringify([]));
    localStorage.setItem('mm_attachments', JSON.stringify([]));
    localStorage.setItem('mm_quizzes', JSON.stringify([]));
    localStorage.setItem('mm_registered_students', JSON.stringify([]));

    executeAdminCloudWrite(async () => {
      await Promise.all([
        ...lecIds.map((id) => deleteLectureFromCloud(id)),
        ...attIds.map((id) => deleteAttachmentFromCloud(id)),
        ...quizIds.map((id) => deleteQuizFromCloud(id)),
        ...stuIds.map((id) => deleteStudentFromCloud(id)),
      ]);
    }, 'تم تصفير كافة الدروس والملفات والامتحانات في السحابة بنجاح.');
  };

  const handleUpdateStudentProfile = (updatedUser: UserProfile) => {
    const finalized: UserProfile = { ...updatedUser, profileCompleted: true };
    setCurrentUser(finalized);

    if (auth.currentUser && auth.currentUser.emailVerified && (auth.currentUser.uid === finalized.id || isUserAdmin(currentUser))) {
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

  const handleSaveCloudinaryConfig = (config: CloudinaryConfig) => {
    setCloudinaryConfig(config);
    localStorage.setItem('mm_cloudinary', JSON.stringify(config));
    executeAdminCloudWrite(
      () => saveAdminConfigToCloud(siteConfig.adminEmails || ['mizoo2y2@gmail.com'], config, siteConfig.googleClientId),
      'تم حفظ إعدادات Cloudinary ومزامنتها في السحابة.'
    );
  };

  const handleSaveSiteConfig = (newConfig: SiteConfig) => {
    const sanitized: SiteConfig = {
      ...newConfig,
      profileImageUrl: sanitizeProfileImageUrl(newConfig.profileImageUrl),
    };
    setSiteConfig(sanitized);
    localStorage.setItem('mm_site_config', JSON.stringify(sanitized));
    executeAdminCloudWrite(async () => {
      await savePublicSiteConfigToCloud(sanitized);
      await saveAdminConfigToCloud(
        sanitized.adminEmails || ['mizoo2y2@gmail.com'],
        cloudinaryConfig,
        sanitized.googleClientId
      );
    }, 'تم نشر التعديلات مباشرة للجميع.');
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

  // Check if onboarding is needed
  const shouldShowOnboarding = Boolean(
    currentUser &&
      currentUser.role !== 'teacher' &&
      !currentUser.profileCompleted
  );

  const getBodyFontClass = () => {
    if (siteConfig.bodyFont === 'Tajawal') return 'font-sans';
    return 'font-cairo';
  };

  return (
    <div className={`min-h-screen flex flex-col font-cairo ${getBodyFontClass()} bg-[#fafffb] dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-teal-500 selection:text-white w-full max-w-full overflow-x-hidden`}>
      {/* Non-blocking Cloud Sync / Admin Verification Notice */}
      {syncNotice && (
        <div
          dir="rtl"
          className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[100] p-4 rounded-2xl shadow-2xl border backdrop-blur-md flex flex-col gap-2.5 animate-fade-in ${
            syncNotice.type === 'success'
              ? 'bg-emerald-900/95 border-emerald-500/40 text-white'
              : syncNotice.type === 'auth_needed'
              ? 'bg-amber-950/95 border-amber-500/50 text-amber-50'
              : 'bg-rose-950/95 border-rose-500/50 text-rose-50'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs sm:text-sm font-bold leading-relaxed font-sans">{syncNotice.message}</p>
            <button
              type="button"
              onClick={() => setSyncNotice(null)}
              className="text-xs px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 shrink-0 cursor-pointer"
            >
              إغلاق
            </button>
          </div>
          {syncNotice.type === 'auth_needed' && (
            <button
              type="button"
              onClick={handleQuickAdminGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-kufi transition-colors cursor-pointer"
            >
              تسجيل الدخول بحساب Google للمشرف الآن
            </button>
          )}
        </div>
      )}

      {/* Top Navbar */}
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

      {/* Main Content Router */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {currentView === 'landing' && (
          <>
            {/* 1. Hero Section */}
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

            {/* 2. Features Section (4 modern cards) */}
            <FeaturesSection siteConfig={siteConfig} />

            {/* 3. Academic Years Section */}
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
          <StudentPortal
            currentUser={currentUser}
            lectures={lectures}
            quizzes={quizzes}
            attachments={attachments}
            onBackToHome={() => setCurrentView('landing')}
            onOpenTeacherDashboard={() => handleNavigate('teacher')}
            onUpdateStudentProfile={handleUpdateStudentProfile}
          />
        )}

        {currentView === 'teacher' && isUserAdmin(currentUser) && (
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
        )}
      </main>

      {/* Footer (hidden on mobile in student portal for clean app-like bottom navigation) */}
      <div className={currentView === 'student' ? 'hidden lg:block' : ''}>
        <Footer
          siteConfig={siteConfig}
          onNavigate={handleNavigate}
          onScrollToSection={handleScrollToSection}
          onOpenLogin={() => setLoginModalOpen(true)}
          onOpenSecretAdmin={() => setSecretAdminOpen(true)}
        />
      </div>

      {/* Auth Modals */}
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
        onUpdateGoogleClientId={(id) => handleSaveSiteConfig({ ...siteConfig, googleClientId: id })}
      />

      {/* Student Onboarding & Data Completion Modal */}
      {currentUser && (
        <StudentOnboardingModal
          isOpen={shouldShowOnboarding}
          currentUser={currentUser}
          onSaveProfile={handleUpdateStudentProfile}
        />
      )}

      {/* Secret Admin Master Customizer Modal (© symbol + PIN 2825) */}
      <SecretAdminCustomizerModal
        isOpen={secretAdminOpen}
        onClose={() => setSecretAdminOpen(false)}
        siteConfig={siteConfig}
        onSaveSiteConfig={handleSaveSiteConfig}
        cloudinaryConfig={cloudinaryConfig}
      />
    </div>
  );
}

