import { Lecture, Quiz, AttachmentFile, CloudinaryConfig, UserProfile } from '../types';

export const INITIAL_CLOUDINARY_CONFIG: CloudinaryConfig = {
  cloudName: 'chemistry-egypt',
  uploadPreset: 'mohamed_mostafa_preset',
};

// Real data stores - Zeroed out and completely empty on admin demand
export const INITIAL_LECTURES: Lecture[] = [];

export const INITIAL_ATTACHMENTS: AttachmentFile[] = [];

export const INITIAL_QUIZZES: Quiz[] = [];

// Real registered students (empty by default for strict authentic accounting)
export const INITIAL_STUDENTS: UserProfile[] = [];

export interface LabReagent {
  id: string;
  name: string;
  formula: string;
  color: string;
  type: 'acid' | 'base' | 'salt' | 'indicator' | 'metal';
  pH: number;
}

export const LAB_REAGENTS: LabReagent[] = [
  { id: 'hcl', name: 'حمض الهيدروكلوريك', formula: 'HCl (aq)', color: '#e0f2fe', type: 'acid', pH: 1 },
  { id: 'naoh', name: 'هيدروكسيد الصوديوم', formula: 'NaOH (aq)', color: '#ecfdf5', type: 'base', pH: 13 },
  { id: 'cuso4', name: 'كبريتات النحاس (II)', formula: 'CuSO4 (aq)', color: '#38bdf8', type: 'salt', pH: 6 },
  { id: 'fecl3', name: 'كلوريد الحديد (III)', formula: 'FeCl3 (aq)', color: '#fef08a', type: 'salt', pH: 3 },
  { id: 'phph', name: 'دليل الفينولفثالين', formula: 'C20H14O4', color: '#ffffff', type: 'indicator', pH: 7 },
  { id: 'fe_powder', name: 'برادة الحديد', formula: 'Fe (s)', color: '#64748b', type: 'metal', pH: 7 },
];
