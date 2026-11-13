// Security Rules Verification Suite (Dirty Dozen + Legitimate Flows)
// Documents expected behavior of firestore.rules across all collections.

export const DIRTY_DOZEN_SECURITY_TESTS = [
  {
    name: '1. Shadow Field Injection on students',
    operation: 'create',
    path: '/students/uid_123',
    payload: { id: 'uid_123', uid: 'uid_123', name: 'Student', role: 'student', phone: '010', profileCompleted: true, isAdmin: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '2. Role Escalation on students create',
    operation: 'create',
    path: '/students/uid_123',
    payload: { id: 'uid_123', uid: 'uid_123', name: 'Student', role: 'teacher', phone: '010', profileCompleted: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '3. Role Escalation on students update',
    operation: 'update',
    path: '/students/uid_123',
    payload: { role: 'teacher' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '4. UID Spoofing on students create',
    operation: 'create',
    path: '/students/victim_uid',
    payload: { id: 'victim_uid', uid: 'victim_uid', name: 'Attacker', role: 'student', phone: '010', profileCompleted: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '5. Unverified Email Admin Spoof',
    operation: 'update',
    path: '/publicConfig/site',
    auth: { uid: 'spoof', token: { email: 'mizoo2y2@gmail.com', email_verified: false } },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '6. Non-Admin Site Defacement',
    operation: 'update',
    path: '/publicConfig/site',
    auth: { uid: 'student_1', token: { email: 'student@gmail.com', email_verified: true } },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '7. Non-Admin Lecture Deletion',
    operation: 'delete',
    path: '/lectures/lec_1',
    auth: { uid: 'student_1', token: { email: 'student@gmail.com', email_verified: true } },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '8. PII Blanket Listing on students',
    operation: 'list',
    path: '/students',
    auth: { uid: 'student_1', token: { email: 'student@gmail.com', email_verified: true } },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '9. PII Cross-User Read on students',
    operation: 'get',
    path: '/students/student_2',
    auth: { uid: 'student_1', token: { email: 'student@gmail.com', email_verified: true } },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '10. ID Poisoning (>128 chars)',
    operation: 'create',
    path: `/lectures/${'a'.repeat(200)}`,
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '11. Value Poisoning (>150 chars teacherName)',
    operation: 'update',
    path: '/publicConfig/site',
    payload: { teacherName: 'x'.repeat(500) },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '12. Timestamp Forgery (non-request.time)',
    operation: 'create',
    path: '/lectures/lec_99',
    payload: { updatedAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
];
