import React, { useState, useEffect, useRef } from 'react';
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
import { 
  INITIAL_LECTURES, 
  INITIAL_ATTACHMENTS, 
  INITIAL_QUIZZES, 
  INITIAL_CLOUDINARY_CONFIG,
  INITIAL_STUDENTS
} from './data/initialData';
import { Lecture, AttachmentFile, Quiz, CloudinaryConfig, UserProfile, GradeLevel } from './types';
import { SiteConfig, DEFAULT_SITE_CONFIG } from './types/siteConfig';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('mm_theme') === 'dark';
  });

  // Master Site Configuration state (Customizable via © + PIN 2825)
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    const saved = localStorage.getItem('mm_site_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.profileImageUrl === 'string' && parsed.profileImageUrl.includes('/src/assets/')) {
          parsed.profileImageUrl = parsed.profileImageUrl.replace('/src/assets/images/', '/images/');
        }
        return { ...DEFAULT_SITE_CONFIG, ...parsed };
      } catch (e) {
        return DEFAULT_SITE_CONFIG;
      }
    }
    return DEFAULT_SITE_CONFIG;
  });

  // Current logged in user
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('mm_user');
    return saved ? JSON.parse(saved) : null;
  });

  // View state: 'landing' | 'student' | 'teacher'
  const [currentView, setCurrentView] = useState<'landing' | 'student' | 'teacher'>('landing');

  // Modals state
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [secretAdminOpen, setSecretAdminOpen] = useState(false);

  // Curriculum & Uploads state (persisted in localStorage, zeroed out for fresh authentic entries)
  const [lectures, setLectures] = useState<Lecture[]>(() => {
    if (!localStorage.getItem('mm_zeroed_confirmed_v4')) {
      localStorage.removeItem('mm_lectures');
      localStorage.removeItem('mm_attachments');
      localStorage.removeItem('mm_quizzes');
      localStorage.removeItem('mm_registered_students');
      localStorage.setItem('mm_zeroed_confirmed_v4', 'true');
      return [];
    }
    const saved = localStorage.getItem('mm_lectures');
    return saved ? JSON.parse(saved) : [];
  });

  const [attachments, setAttachments] = useState<AttachmentFile[]>(() => {
    if (!localStorage.getItem('mm_zeroed_confirmed_v4')) {
      return [];
    }
    const saved = localStorage.getItem('mm_attachments');
    return saved ? JSON.parse(saved) : [];
  });

  const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
    if (!localStorage.getItem('mm_zeroed_confirmed_v4')) {
      return [];
    }
    const saved = localStorage.getItem('mm_quizzes');
    return saved ? JSON.parse(saved) : [];
  });

  const [students, setStudents] = useState<UserProfile[]>(() => {
    if (!localStorage.getItem('mm_zeroed_confirmed_v4')) {
      return [];
    }
    const saved = localStorage.getItem('mm_registered_students');
    return saved ? JSON.parse(saved) : [];
  });

  const [cloudinaryConfig, setCloudinaryConfig] = useState<CloudinaryConfig>(() => {
    const saved = localStorage.getItem('mm_cloudinary');
    return saved ? JSON.parse(saved) : INITIAL_CLOUDINARY_CONFIG;
  });

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

  // Keep track of database version for real-time live sync across all tabs & incognito
  const lastDbVersionRef = useRef<number>(0);

  // Live Sync Engine: Fetches DB from server and updates all connected browsers immediately
  const syncFromServer = async (initialCheck = false) => {
    try {
      const res = await fetch('/api/db');
      const result = await res.json();
      if (result.success && result.data) {
        if (result.version && result.version === lastDbVersionRef.current && !initialCheck) {
          return; // Database unchanged, avoid re-rendering
        }
        if (result.version) {
          lastDbVersionRef.current = result.version;
        }

        const dbData = result.data;
        if (dbData.siteConfig) {
          setSiteConfig(prev => {
            // Check if user previously saved a Cloudinary or custom photo in local storage
            const localSaved = localStorage.getItem('mm_site_config');
            let localPhoto: string | undefined;
            if (localSaved) {
              try {
                localPhoto = JSON.parse(localSaved)?.profileImageUrl;
              } catch (e) {}
            }

            const isServerDefaultPhoto = 
              !dbData.siteConfig.profileImageUrl || 
              dbData.siteConfig.profileImageUrl === '/images/teacher_mohamed_mostafa_1794141316649.jpg';

            const localHasCustomPhoto = 
              (localPhoto && (localPhoto.includes('cloudinary') || localPhoto.startsWith('http') || localPhoto.startsWith('/uploads/'))) ||
              (prev.profileImageUrl && (prev.profileImageUrl.includes('cloudinary') || prev.profileImageUrl.startsWith('http') || prev.profileImageUrl.startsWith('/uploads/')));

            // If the server has only default photo, but this browser already has the teacher's Cloudinary/uploaded photo:
            // Push the custom photo up to the server immediately so incognito & other browsers get it!
            if (isServerDefaultPhoto && localHasCustomPhoto) {
              const customPhoto = localPhoto || prev.profileImageUrl;
              const merged = { ...DEFAULT_SITE_CONFIG, ...dbData.siteConfig, profileImageUrl: customPhoto };
              fetch('/api/site-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(merged),
              }).catch(e => console.warn('Sync custom photo to server warning:', e));
              return merged;
            }

            return {
              ...DEFAULT_SITE_CONFIG,
              ...dbData.siteConfig,
              profileImageUrl: dbData.siteConfig.profileImageUrl || prev.profileImageUrl,
            };
          });
        }

        if (dbData.cloudinaryConfig) {
          setCloudinaryConfig(dbData.cloudinaryConfig);
        }
        if (Array.isArray(dbData.lectures)) {
          setLectures(dbData.lectures);
        }
        if (Array.isArray(dbData.attachments)) {
          setAttachments(dbData.attachments);
        }
        if (Array.isArray(dbData.quizzes)) {
          setQuizzes(dbData.quizzes);
        }
        if (Array.isArray(dbData.students)) {
          setStudents(dbData.students);
        }
      }
    } catch (err) {
      console.warn('API DB connection warning:', err);
    }
  };

  // Initial load and continuous real-time live polling (every 2.5s)
  useEffect(() => {
    syncFromServer(true);

    // Live polling: Ensures that any change made in any browser/tab appears instantly in incognito and other devices
    const interval = setInterval(() => {
      syncFromServer(false);
    }, 2500);

    // Cross-tab instantaneous sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'mm_site_config' && e.newValue) {
        try {
          setSiteConfig(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === 'mm_lectures' && e.newValue) {
        try {
          setLectures(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Sync siteConfig to localStorage
  useEffect(() => {
    localStorage.setItem('mm_site_config', JSON.stringify(siteConfig));
  }, [siteConfig]);

  // Sync state to localStorage
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

  // Admin permission evaluator (Primary owner mizoo2y2@gmail.com + any added co-admins)
  const isUserAdmin = (user: UserProfile | null) => {
    if (!user) return false;
    if (user.role === 'teacher') return true;
    const email = user.email?.toLowerCase().trim();
    if (email === 'mizoo2y2@gmail.com') return true;
    return Boolean(email && (siteConfig.adminEmails || []).some(e => e.toLowerCase().trim() === email));
  };

  // Strict route guard: strictly lock student and teacher portals without login
  useEffect(() => {
    if (currentView === 'teacher' && !isUserAdmin(currentUser)) {
      setCurrentView('landing');
      setLoginModalOpen(true);
    } else if (currentView === 'student' && !currentUser) {
      setCurrentView('landing');
      setLoginModalOpen(true);
    }
  }, [currentView, currentUser, siteConfig.adminEmails]);

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
    setDarkMode(prev => !prev);
  };

  const handleLoginSuccess = async (user: UserProfile) => {
    const isAdmin = isUserAdmin(user);

    if (isAdmin) {
      const finalAdmin: UserProfile = { ...user, role: 'teacher', profileCompleted: true };
      setCurrentUser(finalAdmin);
      setCurrentView('teacher');
      return;
    }

    // Check if this student has previously completed their profile in DB or local list
    const query = user.email || user.id || user.phone || '';
    let matched: UserProfile | undefined = students.find(s => 
      (user.id && s.id === user.id) || 
      (user.email && s.email && s.email.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
      (user.phone && s.phone && s.phone === user.phone)
    );

    if (!matched && query) {
      try {
        const res = await fetch(`/api/students/lookup?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data && data.found && data.student) {
          matched = data.student;
        }
      } catch (e) {
        console.warn('Student DB lookup error:', e);
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

    // If profile already done, sync it immediately to server DB
    if (finalUser.profileCompleted) {
      fetch('/api/students/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalUser),
      }).catch(err => console.warn('Save student DB error:', err));
    }

    // Also register/update in student list
    setStudents(prev => {
      const existsIdx = prev.findIndex(s => s.id === finalUser.id || (finalUser.email && s.email === finalUser.email));
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
    setCurrentUser(null);
    setCurrentView('landing');
  };

  const handleAddLecture = (newLec: Lecture) => {
    setLectures(prev => [newLec, ...prev]);
    fetch('/api/lectures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLec),
    }).catch(err => console.warn('Add lecture API error:', err));
  };

  const handleDeleteLecture = (id: string) => {
    setLectures(prev => prev.filter(l => l.id !== id));
    fetch(`/api/lectures/${id}`, {
      method: 'DELETE',
    }).catch(err => console.warn('Delete lecture API error:', err));
  };

  const handleUpdateLecture = (updated: Lecture) => {
    setLectures(prev => prev.map(l => l.id === updated.id ? updated : l));
    fetch('/api/lectures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(err => console.warn('Update lecture API error:', err));
  };

  const handleAddAttachment = (newFile: AttachmentFile) => {
    setAttachments(prev => [newFile, ...prev]);
    fetch('/api/attachments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFile),
    }).catch(err => console.warn('Add attachment API error:', err));
  };

  const handleDeleteAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
    fetch(`/api/attachments/${id}`, {
      method: 'DELETE',
    }).catch(err => console.warn('Delete attachment API error:', err));
  };

  const handleAddQuiz = (newQuiz: Quiz) => {
    setQuizzes(prev => [newQuiz, ...prev]);
    fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newQuiz),
    }).catch(err => console.warn('Add quiz API error:', err));
  };

  const handleDeleteQuiz = (id: string) => {
    setQuizzes(prev => prev.filter(q => q.id !== id));
    fetch(`/api/quizzes/${id}`, {
      method: 'DELETE',
    }).catch(err => console.warn('Delete quiz API error:', err));
  };

  const handleAdminDeleteStudent = (studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    fetch(`/api/students/${studentId}`, {
      method: 'DELETE',
    }).catch(err => console.warn('Delete student API error:', err));
  };

  const handleAdminAddStudent = (student: UserProfile) => {
    setStudents(prev => [student, ...prev]);
    fetch('/api/students/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student),
    }).catch(err => console.warn('Add student API error:', err));
  };

  const handleResetAllData = () => {
    setLectures([]);
    setAttachments([]);
    setQuizzes([]);
    setStudents([]);
    localStorage.setItem('mm_lectures', JSON.stringify([]));
    localStorage.setItem('mm_attachments', JSON.stringify([]));
    localStorage.setItem('mm_quizzes', JSON.stringify([]));
    localStorage.setItem('mm_registered_students', JSON.stringify([]));
    fetch('/api/reset-data', {
      method: 'POST',
    }).catch(err => console.warn('Reset data API error:', err));
  };

  const handleUpdateStudentProfile = (updatedUser: UserProfile) => {
    const finalized: UserProfile = { ...updatedUser, profileCompleted: true };
    setCurrentUser(finalized);

    // Permanently remember that this student completed their profile across all devices
    fetch('/api/students/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalized),
    }).catch(err => console.warn('Save student profile DB error:', err));

    if (finalized.email) {
      localStorage.setItem(`mm_profile_done_${finalized.email.toLowerCase().trim()}`, 'true');
    }
    if (finalized.id) {
      localStorage.setItem(`mm_profile_done_${finalized.id}`, 'true');
    }
    if (finalized.phone) {
      localStorage.setItem(`mm_profile_done_${finalized.phone.trim()}`, 'true');
    }

    setStudents(prev => {
      const idx = prev.findIndex(s => s.id === finalized.id || (finalized.email && s.email === finalized.email));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = finalized;
        return copy;
      } else {
        return [finalized, ...prev];
      }
    });
  };

  const handleSaveCloudinaryConfig = (config: CloudinaryConfig) => {
    setCloudinaryConfig(config);
    localStorage.setItem('mm_cloudinary', JSON.stringify(config));
    fetch('/api/cloudinary-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }).catch(err => console.warn('Save cloudinary config API error:', err));
  };

  const handleSaveSiteConfig = (newConfig: SiteConfig) => {
    setSiteConfig(newConfig);
    localStorage.setItem('mm_site_config', JSON.stringify(newConfig));
    fetch('/api/site-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig),
    }).catch(err => console.warn('Save site config API error:', err));
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
    handleUpdateStudentProfile({
      ...currentUser,
      grade: grade,
    });
    setCurrentView('student');
  };

  // Check if onboarding is needed
  const shouldShowOnboarding = Boolean(
    currentUser && 
    currentUser.role !== 'teacher' && 
    !currentUser.profileCompleted
  );

  // Dynamic body font class
  const getBodyFontClass = () => {
    return 'font-cairo';
  };

  return (
    <div className={`min-h-screen flex flex-col font-cairo ${getBodyFontClass()} bg-[#fafffb] dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-teal-500 selection:text-white w-full max-w-full overflow-x-hidden`}>
      
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
            onUpdateStudent={handleUpdateStudentProfile}
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

      {/* Footer */}
      <Footer
        siteConfig={siteConfig}
        onNavigate={handleNavigate}
        onScrollToSection={handleScrollToSection}
        onOpenLogin={() => setLoginModalOpen(true)}
        onOpenSecretAdmin={() => setSecretAdminOpen(true)}
      />

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

      {/* Student Onboarding & Data Completion Modal (Mandatory on student login with zero mock data) */}
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
