import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { AcademicYearsSection } from './components/AcademicYearsSection';
import { VirtualLabSection } from './components/VirtualLabSection';
import { StudentPortal } from './components/StudentPortal';
import { TeacherDashboard } from './components/TeacherDashboard';
import { AuthModals } from './components/AuthModals';
import { SecretAdminCustomizerModal } from './components/SecretAdminCustomizerModal';
import { Footer } from './components/Footer';
import { 
  INITIAL_LECTURES, 
  INITIAL_ATTACHMENTS, 
  INITIAL_QUIZZES, 
  INITIAL_CLOUDINARY_CONFIG 
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

  const [quizzes] = useState<Quiz[]>(INITIAL_QUIZZES);

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
    if (currentUser) {
      localStorage.setItem('mm_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('mm_user');
    }
  }, [currentUser]);

  const handleToggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === 'teacher') {
      setCurrentView('teacher');
    } else {
      // User requested: "لما اعمل تسجيل الدخول افتح المنصه للطلاب"
      setCurrentView('student');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('landing');
  };

  const handleAddLecture = (newLec: Lecture) => {
    setLectures(prev => [newLec, ...prev]);
  };

  const handleDeleteLecture = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المحاضرة؟')) {
      setLectures(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleAddAttachment = (newFile: AttachmentFile) => {
    setAttachments(prev => [newFile, ...prev]);
  };

  const handleDeleteAttachment = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الملف؟')) {
      setAttachments(prev => prev.filter(a => a.id !== id));
    }
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
    // Open student portal with chosen grade
    setCurrentView('student');
  };

  // Dynamic body font class
  const getBodyFontClass = () => {
    switch (siteConfig.bodyFont) {
      case 'Tajawal': return 'font-tajawal';
      case 'Almarai': return 'font-almarai';
      default: return 'font-cairo';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${getBodyFontClass()} bg-[#fafffb] dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-teal-500 selection:text-white w-full max-w-full overflow-x-hidden`}>
      
      {/* Top Navbar */}
      <Navbar
        siteConfig={siteConfig}
        darkMode={darkMode}
        onToggleTheme={handleToggleTheme}
        currentUser={currentUser}
        onOpenLogin={() => setLoginModalOpen(true)}
        onOpenRegister={() => setRegisterModalOpen(true)}
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
              onJoinNow={() => setRegisterModalOpen(true)}
              onExploreLectures={() => handleScrollToSection('academic-years')}
              onOpenLab={() => handleScrollToSection('virtual-lab')}
            />

            {/* 2. Features Section (4 modern cards) */}
            <FeaturesSection siteConfig={siteConfig} />

            {/* 3. Academic Years Section */}
            <AcademicYearsSection
              onSelectGrade={handleSelectGrade}
              onPreviewCurriculum={(grade) => {
                setCurrentView('student');
              }}
            />

            {/* 4. Virtual Chemistry Lab Interactive Sandbox */}
            <VirtualLabSection />
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
          />
        )}

        {currentView === 'teacher' && (
          <TeacherDashboard
            lectures={lectures}
            onAddLecture={handleAddLecture}
            onDeleteLecture={handleDeleteLecture}
            attachments={attachments}
            onAddAttachment={handleAddAttachment}
            onDeleteAttachment={handleDeleteAttachment}
            cloudinaryConfig={cloudinaryConfig}
            onSaveCloudinaryConfig={handleSaveCloudinaryConfig}
            onBackToHome={() => setCurrentView('landing')}
            onOpenStudentPortal={() => setCurrentView('student')}
            onOpenSecretAdmin={() => setSecretAdminOpen(true)}
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
      />

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
