import React, { useState, useEffect } from 'react';
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
    return saved ? JSON.parse(saved) : DEFAULT_SITE_CONFIG;
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

  // Curriculum & Uploads state (persisted in localStorage)
  const [lectures, setLectures] = useState<Lecture[]>(() => {
    const saved = localStorage.getItem('mm_lectures');
    return saved ? JSON.parse(saved) : INITIAL_LECTURES;
  });

  const [attachments, setAttachments] = useState<AttachmentFile[]>(() => {
    const saved = localStorage.getItem('mm_attachments');
    return saved ? JSON.parse(saved) : INITIAL_ATTACHMENTS;
  });

  const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
    const saved = localStorage.getItem('mm_quizzes');
    return saved ? JSON.parse(saved) : INITIAL_QUIZZES;
  });

  const [students, setStudents] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('mm_registered_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
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

  // Strict route guard: Teacher Dashboard is invisible and inaccessible unless logged in as mizoo2y2@gmail.com
  useEffect(() => {
    if (currentView === 'teacher' && currentUser?.email?.toLowerCase().trim() !== 'mizoo2y2@gmail.com') {
      setCurrentView('landing');
    }
  }, [currentView, currentUser]);

  const handleToggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    const isAdmin = 
      user.email?.toLowerCase().trim() === 'mizoo2y2@gmail.com' || 
      user.role === 'teacher' || 
      (siteConfig.adminEmails || []).some(e => e.toLowerCase().trim() === user.email?.toLowerCase().trim());

    if (isAdmin) {
      const finalAdmin: UserProfile = { ...user, role: 'teacher', profileCompleted: true };
      setCurrentUser(finalAdmin);
      setCurrentView('teacher');
      return;
    }

    // Check if this student has previously completed their profile
    const savedStudentsRaw = localStorage.getItem('mm_registered_students');
    let existingStudents: UserProfile[] = students;
    if (savedStudentsRaw) {
      try {
        const parsed = JSON.parse(savedStudentsRaw);
        if (Array.isArray(parsed)) existingStudents = parsed;
      } catch (e) {}
    }

    const matched = existingStudents.find(s => 
      (user.id && s.id === user.id) || 
      (user.email && s.email && s.email.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
      (user.phone && s.phone && s.phone === user.phone)
    );

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
  };

  const handleDeleteLecture = (id: string) => {
    setLectures(prev => prev.filter(l => l.id !== id));
  };

  const handleUpdateLecture = (updated: Lecture) => {
    setLectures(prev => prev.map(l => l.id === updated.id ? updated : l));
  };

  const handleAddAttachment = (newFile: AttachmentFile) => {
    setAttachments(prev => [newFile, ...prev]);
  };

  const handleDeleteAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleAddQuiz = (newQuiz: Quiz) => {
    setQuizzes(prev => [newQuiz, ...prev]);
  };

  const handleDeleteQuiz = (id: string) => {
    setQuizzes(prev => prev.filter(q => q.id !== id));
  };

  const handleAdminDeleteStudent = (studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const handleAdminAddStudent = (student: UserProfile) => {
    setStudents(prev => [student, ...prev]);
  };

  const handleUpdateStudentProfile = (updatedUser: UserProfile) => {
    const finalized: UserProfile = { ...updatedUser, profileCompleted: true };
    setCurrentUser(finalized);

    // Permanently remember that this student completed their profile
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
  };

  const handleSaveSiteConfig = (newConfig: SiteConfig) => {
    setSiteConfig(newConfig);
    localStorage.setItem('mm_site_config', JSON.stringify(newConfig));
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
    if (currentUser) {
      handleUpdateStudentProfile({
        ...currentUser,
        grade: grade,
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
        onNavigate={(view) => setCurrentView(view)}
        onScrollToSection={handleScrollToSection}
      />

      {/* Main Content Router */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {currentView === 'landing' && (
          <>
            {/* 1. Hero Section */}
            <HeroSection
              siteConfig={siteConfig}
              onJoinNow={() => setLoginModalOpen(true)}
              onExploreLectures={() => handleScrollToSection('academic-years')}
            />

            {/* 2. Features Section (4 modern cards) */}
            <FeaturesSection siteConfig={siteConfig} />

            {/* 3. Academic Years Section */}
            <AcademicYearsSection
              lectures={lectures}
              attachments={attachments}
              onSelectGrade={handleSelectGrade}
              onPreviewCurriculum={(grade) => {
                handleSelectGrade(grade);
              }}
            />
          </>
        )}

        {currentView === 'student' && (
          <StudentPortal
            currentUser={currentUser}
            lectures={lectures}
            quizzes={quizzes}
            attachments={attachments}
            onBackToHome={() => setCurrentView('landing')}
            onOpenTeacherDashboard={() => setCurrentView('teacher')}
            onUpdateStudentProfile={handleUpdateStudentProfile}
          />
        )}

        {currentView === 'teacher' && (
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
            onOpenStudentPortal={() => setCurrentView('student')}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        siteConfig={siteConfig}
        onNavigate={(view) => setCurrentView(view)}
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
