export type GradeLevel = string;

export interface Lecture {
  id: string;
  title: string;
  grade: GradeLevel;
  gradeLabel: string;
  chapter: string;
  unitId?: string;
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
  pointsCost?: number; // 0 or undefined = regular/free; >0 = unlockable via student points
}

export interface QuizQuestion {
  id: string;
  question: string;
  imageUrl?: string;
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
  warningMinutes?: number;
  passingScore?: number;
  requireAgreement?: boolean;
  examInstructions?: string[];
  proctoringEnabled?: boolean;
  maxViolations?: number;
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
  pointsCost?: number; // 0 or undefined = free; >0 = unlockable via student points
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

export interface PointsHistoryEntry {
  id: string;
  type: 'redeem' | 'unlock_lecture' | 'unlock_file' | 'claim_reward' | 'admin_grant';
  title: string;
  delta: number;
  code?: string;
  date: string;
}

export interface RedeemCode {
  id: string;
  code: string;
  points: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  label?: string;
  createdBy?: string;
  createdAtDate: string;
}

export interface PointReward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: 'perk' | 'badge' | 'discount' | 'material';
  grade: string; // 'all' or specific gradeId
  active: boolean;
  dateAdded: string;
}

export interface QuizViolationRecord {
  count: number;
  reasons: string[];
  lastAt: string;
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
  points?: number;
  unlockedLectureIds?: string[];
  unlockedAttachmentIds?: string[];
  claimedRewardIds?: string[];
  pointsHistory?: PointsHistoryEntry[];
  isBlocked?: boolean;
  blockReason?: string;
  cancelledQuizIds?: string[];
  quizViolations?: Record<string, QuizViolationRecord>;
}

export interface ExamSecurityAlert {
  id: string;
  studentUid: string;
  studentName: string;
  studentPhone?: string;
  studentEmail?: string;
  grade?: GradeLevel;
  quizId: string;
  quizTitle: string;
  violationCount: number;
  maxViolations: number;
  reasons: string[];
  actionTaken: 'warning' | 'cancelled';
  resolved: boolean;
  resolvedNote?: string;
  createdAtDate: string;
}

export type NotificationCategory = 'announcement' | 'exam' | 'lecture' | 'urgent' | 'congrats';
export type NotificationCtaTab = 'lectures' | 'quizzes' | 'files' | 'points';

export interface PlatformNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  grade: string; // 'all' or specific gradeId
  pinned: boolean;
  active: boolean;
  authorName: string;
  dateAdded: string;
  ctaLabel?: string;
  ctaTab?: NotificationCtaTab;
}

