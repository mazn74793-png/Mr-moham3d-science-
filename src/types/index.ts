export type GradeLevel = 'first' | 'second' | 'third';

export interface Lecture {
  id: string;
  title: string;
  grade: GradeLevel;
  gradeLabel: string;
  chapter: string;
  duration: string;
  videoUrl: string;
  thumbnailUrl: string;
  pdfUrl?: string;
  pdfTitle?: string;
  description: string;
  isFreePreview: boolean;
  viewsCount: number;
  dateAdded: string;
  sessionOrder?: number; // Sequence number (1, 2, 3...)
  quizId?: string; // Connected quiz ID
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  formula?: string;
}

export interface Quiz {
  id: string;
  title: string;
  grade: GradeLevel;
  chapter: string;
  durationMinutes: number;
  lectureId?: string;
  questions: QuizQuestion[];
}

export interface AttachmentFile {
  id: string;
  title: string;
  grade: GradeLevel;
  gradeLabel: string;
  chapter: string;
  fileSize: string;
  fileType: 'pdf' | 'doc' | 'image';
  downloadUrl: string;
  pageCount?: number;
  dateAdded: string;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  role: 'student' | 'teacher';
  grade?: GradeLevel;
  phone: string;
  parentPhone?: string;
  governorate?: string;
  avatarUrl?: string;
  score?: number;
  profileCompleted?: boolean;
  watchedLectureIds?: string[];
  passedQuizIds?: string[];
  quizScores?: Record<string, number>;
  joinedAt?: string;
}

