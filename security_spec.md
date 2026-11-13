# Security Specification & Payload-First TDD

## 1. Data Invariants
1. **Default Deny Safety Net**: Any path not explicitly matched is completely denied (`allow read, write: if false`).
2. **Admin Authorization**: Only verified Google users (`request.auth.token.email_verified == true`) whose email is the primary owner (`mizoo2y2@gmail.com`) or explicitly listed in `/adminConfig/settings.adminEmails` may write to `publicConfig`, `adminConfig`, `lectures`, `attachments`, or `quizzes`.
3. **Public Homepage Sync**: `/publicConfig/site`, `/lectures`, and `/attachments` metadata may be read by homepage visitors and students so admin changes propagate immediately in real time (`onSnapshot`) to everyone.
4. **PII Isolation (`students`)**: Student records contain PII (`phone`, `parentPhone`, `email`, `governorate`). A student may ONLY read/write their own document (`request.auth.uid == studentId` and `resource.data.uid == request.auth.uid`), and NEVER list other students. Role escalation (`role: 'teacher'`) is strictly blocked for non-admins.
5. **Strict Schema & Bounds**: Every string field enforces `.size() <= maxLength`, every array enforces `.size() <= MAX`, and every document ID matches `^[a-zA-Z0-9_\-]+$`.
6. **Temporal Integrity**: `createdAt` and `updatedAt` must equal `request.time`, and `createdAt` is immutable on update.

## 2. The "Dirty Dozen" Attack Payloads
1. **Shadow Field Injection on `students`**: Student creates profile with `{ ..., isAdmin: true }` -> DENIED (`keys().hasOnly(...)`).
2. **Role Escalation on `students` Create**: Student sets `role: 'teacher'` -> DENIED (`incoming().role == 'student'`).
3. **Role Escalation on `students` Update**: Student updates own profile changing `role: 'teacher'` -> DENIED (`incoming().role == existing().role` and `affectedKeys().hasOnly(...)`).
4. **UID Spoofing on `students`**: Signed-in user A tries to create `/students/userB` with `uid: 'userB'` -> DENIED (`request.auth.uid == studentId && incoming().uid == request.auth.uid`).
5. **Unverified Email Admin Spoof**: User with `email: 'mizoo2y2@gmail.com'` and `email_verified: false` tries to write `/publicConfig/site` -> DENIED (`email_verified == true`).
6. **Non-Admin Site Defacement**: Signed-in student tries to overwrite `/publicConfig/site` `profileImageUrl` -> DENIED (`isAdmin()`).
7. **Non-Admin Lecture Deletion**: Student tries to delete `/lectures/lec-1` -> DENIED (`isAdmin()`).
8. **PII Blanket Listing**: Student runs `getDocs(collection(db, 'students'))` without `where('uid', '==', auth.uid)` -> DENIED (`resource.data.uid == request.auth.uid`).
9. **PII Cross-User Read**: Student A runs `getDoc(doc(db, 'students', 'studentB'))` -> DENIED (`request.auth.uid == studentId`).
10. **ID Poisoning**: Attacker writes document with 200-char ID or invalid characters `../admin` -> DENIED (`isValidId(id)`).
11. **Value Poisoning / Denial of Wallet**: Attacker writes 100KB string in `teacherName` or `name` -> DENIED (`.size() <= 150`).
12. **Timestamp Forgery**: Client sends past/future `updatedAt` instead of `serverTimestamp()` -> DENIED (`incoming().updatedAt == request.time`).
