import { Lecture, Quiz, UserProfile } from '../types';
import { GradeItem, GradeUnit } from '../types/siteConfig';

export function normalizeUnitKey(value?: string): string {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function slugifyUnitId(title: string): string {
  const clean = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const suffix = Date.now().toString(36);
  return clean ? `unit_${clean.slice(0, 24)}_${suffix}` : `unit_${suffix}`;
}

export function deriveChapterUnitId(title?: string): string {
  const chKey = normalizeUnitKey(title || '');
  return chKey ? `chapter_${chKey.replace(/\s+/g, '_').slice(0, 32)}` : '';
}

function unitMatchesChapterKey(lecChapter: string | undefined, unit: GradeUnit): boolean {
  const lecKey = normalizeUnitKey(lecChapter || '');
  if (!lecKey) return unit.id === '__uncategorized__';
  if (normalizeUnitKey(unit.titleAr) === lecKey) return true;
  if (
    Array.isArray(unit.legacyTitles) &&
    unit.legacyTitles.some((legacy) => normalizeUnitKey(legacy) === lecKey)
  ) {
    return true;
  }
  const derivedId = deriveChapterUnitId(lecChapter);
  return Boolean(derivedId && derivedId === unit.id);
}

export function lectureBelongsToUnit(lec: Lecture, unit: GradeUnit): boolean {
  if (lec.unitId) return lec.unitId === unit.id;
  return unitMatchesChapterKey(lec.chapter, unit);
}

/**
 * Resolves all units for a grade by combining admin-configured `grade.units`
 * with any implicit `chapter` names already used in lectures of that grade.
 */
export function resolveUnitsForGrade(
  grade: GradeItem | undefined,
  gradeLectures: Lecture[]
): GradeUnit[] {
  const explicitUnits: GradeUnit[] = Array.isArray(grade?.units)
    ? grade.units.map((u, idx) => ({
        ...u,
        isIndependent: u.isIndependent !== false,
        order: u.order ?? idx + 1,
      }))
    : [];

  const result: GradeUnit[] = [...explicitUnits];
  const knownIds = new Set(result.map((u) => u.id));
  const knownTitles = new Set<string>();
  for (const u of result) {
    const tKey = normalizeUnitKey(u.titleAr);
    if (tKey) knownTitles.add(tKey);
    if (Array.isArray(u.legacyTitles)) {
      for (const lt of u.legacyTitles) {
        const lKey = normalizeUnitKey(lt);
        if (lKey) knownTitles.add(lKey);
      }
    }
  }

  // Discover any existing lecture chapters/unitIds not yet in explicitUnits
  for (const lec of gradeLectures) {
    const chTitle = (lec.chapter || '').trim();
    const chKey = normalizeUnitKey(chTitle);

    if (lec.unitId && knownIds.has(lec.unitId)) {
      continue;
    }

    if (!lec.unitId && chKey && knownTitles.has(chKey)) {
      continue;
    }

    if (!chKey && !lec.unitId) {
      if (!knownIds.has('__uncategorized__')) {
        knownIds.add('__uncategorized__');
        result.push({
          id: '__uncategorized__',
          titleAr: 'محاضرات عامة',
          titleEn: 'General Sessions',
          isIndependent: true,
          order: result.length + 1,
        });
      }
      continue;
    }

    const derivedId = lec.unitId || deriveChapterUnitId(chTitle);
    if (!knownIds.has(derivedId)) {
      knownIds.add(derivedId);
      if (chKey) knownTitles.add(chKey);
      result.push({
        id: derivedId,
        titleAr: chTitle || 'وحدة جديدة',
        isIndependent: true,
        order: result.length + 1,
      });
    }
  }

  // Sort by explicit order
  result.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  return result;
}

export function getUnitForLecture(lec: Lecture, units: GradeUnit[]): GradeUnit | undefined {
  if (lec.unitId) {
    const byId = units.find((u) => u.id === lec.unitId);
    if (byId) return byId;
  }
  const chKey = normalizeUnitKey(lec.chapter || '');
  if (!chKey) {
    return units.find((u) => u.id === '__uncategorized__');
  }
  const byTitle = units.find((u) => normalizeUnitKey(u.titleAr) === chKey);
  if (byTitle) return byTitle;

  const byLegacyTitle = units.find(
    (u) =>
      Array.isArray(u.legacyTitles) &&
      u.legacyTitles.some((legacy) => normalizeUnitKey(legacy) === chKey)
  );
  if (byLegacyTitle) return byLegacyTitle;

  const derivedId = deriveChapterUnitId(lec.chapter);
  if (derivedId) {
    return units.find((u) => u.id === derivedId);
  }
  return undefined;
}

export function getLecturesInUnit(gradeLectures: Lecture[], unit: GradeUnit): Lecture[] {
  return gradeLectures
    .filter((lec) => lectureBelongsToUnit(lec, unit))
    .sort(
      (a, b) =>
        (a.sessionOrder ?? 9999) - (b.sessionOrder ?? 9999) ||
        (a.dateAdded || '').localeCompare(b.dateAdded || '')
    );
}

/**
 * Unit-aware sequential & points-gated lecture unlock check.
 * Independent units unlock their Session #1 immediately without waiting on older units
 * in the same academic year.
 */
export function isLectureUnlockedForStudent(
  lec: Lecture,
  gradeLectures: Lecture[],
  gradeUnits: GradeUnit[],
  currentUser: UserProfile | null,
  isTeacher: boolean
): boolean {
  if (isTeacher) return true;
  const pointsCost = lec.pointsCost || 0;
  if (pointsCost > 0) {
    return Boolean(currentUser?.unlockedLectureIds?.includes(lec.id));
  }

  const unit = getUnitForLecture(lec, gradeUnits);
  const unitLectures = unit ? getLecturesInUnit(gradeLectures, unit) : gradeLectures;
  const idxInUnit = unitLectures.findIndex((l) => l.id === lec.id);

  let prevLec: Lecture | null = null;
  if (idxInUnit > 0) {
    prevLec = unitLectures[idxInUnit - 1];
  } else if (idxInUnit === 0 && unit && unit.isIndependent === false) {
    // Only chain to previous unit if admin explicitly marked this unit as sequential (isIndependent === false)
    const unitIdx = gradeUnits.findIndex((u) => u.id === unit.id);
    if (unitIdx > 0) {
      for (let i = unitIdx - 1; i >= 0; i--) {
        const prevUnitLecs = getLecturesInUnit(gradeLectures, gradeUnits[i]);
        if (prevUnitLecs.length > 0) {
          prevLec = prevUnitLecs[prevUnitLecs.length - 1];
          break;
        }
      }
    }
  }

  if (!prevLec) return true;

  const prevWatched = Boolean(currentUser?.watchedLectureIds?.includes(prevLec.id));
  const prevQuizId = prevLec.quizId;
  let prevQuizPassed = true;
  if (prevQuizId) {
    const isPassedInList = currentUser?.passedQuizIds?.includes(prevQuizId);
    const score = currentUser?.quizScores?.[prevQuizId] ?? 0;
    prevQuizPassed = Boolean(isPassedInList || score >= 60);
  }

  return Boolean(prevWatched && prevQuizPassed);
}

export function getLecturePrerequisiteDetails(
  lec: Lecture,
  gradeLectures: Lecture[],
  gradeUnits: GradeUnit[],
  quizzes: Quiz[],
  currentUser: UserProfile | null
) {
  const unit = getUnitForLecture(lec, gradeUnits);
  const unitLectures = unit ? getLecturesInUnit(gradeLectures, unit) : gradeLectures;
  const idxInUnit = unitLectures.findIndex((l) => l.id === lec.id);

  let prevLec: Lecture | null = null;
  if (idxInUnit > 0) {
    prevLec = unitLectures[idxInUnit - 1];
  } else if (idxInUnit === 0 && unit && unit.isIndependent === false) {
    const unitIdx = gradeUnits.findIndex((u) => u.id === unit.id);
    if (unitIdx > 0) {
      for (let i = unitIdx - 1; i >= 0; i--) {
        const prevUnitLecs = getLecturesInUnit(gradeLectures, gradeUnits[i]);
        if (prevUnitLecs.length > 0) {
          prevLec = prevUnitLecs[prevUnitLecs.length - 1];
          break;
        }
      }
    }
  }

  if (!prevLec) return null;

  const prevWatched = Boolean(currentUser?.watchedLectureIds?.includes(prevLec.id));
  const prevQuiz = quizzes.find((q) => q.id === prevLec!.quizId) || null;
  const prevQuizPassed = prevQuiz
    ? Boolean(
        currentUser?.passedQuizIds?.includes(prevQuiz.id) ||
          (currentUser?.quizScores?.[prevQuiz.id] ?? 0) >= 60
      )
    : true;

  return { prevLec, prevWatched, prevQuiz, prevQuizPassed };
}
