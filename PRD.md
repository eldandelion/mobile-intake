# Product Requirements Document (PRD)

# Mobile Student Intake & Psychological Screening System (`mobile-intake`)

**Document Version**: 1.0.0  
**Status**: Ready / Implementation Scaffolding  
**Target Repository**: `/Volumes/Files/Programming/mobile-intake`  
**Last Updated**: 2026-09-14  

---

## 1. Executive Summary

The **Mobile Student Intake & Psychological Screening System** (`mobile-intake`) is a dedicated, mobile-first web application engineered to conduct high-volume student onboarding, demographic profile intake, and psychological screening assessments during university orientation and screening windows. Operating as a decoupled, standalone subproject with its own version control repository, the system ensures 100% operational uptime and zero fault propagation from ongoing development on the primary university medical platform.

Students access the application via smartphones (distributed through orientation QR codes or student portal links) and register using core institutional identifiers (Phone Number, Student ID, Full Name, and Password). Once authenticated, they enter a Material Design 3 (MD3) dual-tab interface featuring an Assessment Feed and Personal Center. The questionnaire experience is delivered through a focused, full-screen, card-by-card player with automatic option progression (200ms auto-advance), robust draft resumption, and completion immutability.

The system acts as an upstream Supporting Subdomain to the core university clinical platform. Rather than directly coupling to the core database, it captures raw responses in an isolated SQLite database and produces validated, dual-file CSV exports (`students.csv` and `screening_responses.csv`). The exported dataset strictly adheres to the core system's `StudentImportSchema` (including Excel UTF-8 BOM), enabling administrators to seed active student accounts and historical clinical evaluations into the main system with zero duplicate registration required from students.

---

## 2. Mission & Core Principles

### Mission Statement
To provide incoming university students with a fast, private, and frictionless mobile mental health screening and onboarding experience, while guaranteeing complete operational stability and clean data delivery into the university medical platform.

### Core Principles
1. **Zero Blast Radius & Complete Isolation**: Field intake must run without dependency on core platform runtime availability, schema migrations, or active feature development.
2. **Material Design 3 Parity**: The mobile app strictly inherits the visual identity, tokens, and component patterns established in the main system, creating a seamless institutional brand experience without responsive layout hacks.
3. **Frictionless Mobile UX**: Registration must take under 30 seconds. Questionnaires are presented one item at a time with large touch targets, tactile ripple feedback, auto-advance, and automatic progress saving.
4. **Preservation of Domain Invariants**: The intake tool captures and validates raw Likert responses; it never calculates psychiatric risk scores or exposes clinical labels to students. Clinical scoring authority remains exclusive to the downstream core medical system.
5. **Contract-First Data Bridge**: Data export contracts must strictly conform to the existing Anti-Corruption Layer (`StudentImportSchema`) in the core platform to ensure 100% deterministic, automated ingestion.

---

## 3. Target Users & Personas

| Persona | Role in System | Technical Comfort | Key Needs & Pain Points |
| :--- | :--- | :--- | :--- |
| **Incoming Student** | Assessment respondent & patient | High (Mobile Native) | - Completes surveys quickly on a mobile browser or WeChat webview.<br>- Expects intuitive touch navigation without cluttered desktop tables.<br>- Wants progress saved automatically if interrupted by a phone call.<br>- Values privacy and stigma-free assessment without confusing clinical score labels. |
| **Intake Administrator** | Screening campaign coordinator | Moderate | - Needs reliable, zero-downtime tool during peak orientation weeks.<br>- Requires an export of clean, validated CSV files matching existing bulk import formats.<br>- Wants zero-ops infrastructure without managing complex database containers. |
| **University Counsellor / Doctor** | Downstream clinical evaluator | High | - Expects complete demographic profiles and raw psychological responses in the core system.<br>- Needs accounts pre-seeded so students log into the main system using their intake credentials. |

---

## 4. MVP Scope

### In Scope (MVP) ✅

#### Core Functionality
- ✅ **Lightweight Mobile Registration & Auth**: Minimal registration (<30s) capturing Phone, Student ID, Full Name, and Password. Login via Student ID/Phone and Password with token-based session.
- ✅ **Material Design 3 Bottom Navigation**: Two primary tabs: **问卷测评** (`assignment`) and **个人中心** (`account_circle`).
- ✅ **Assessment Card Feed**: List of assigned intake cards mirroring main system styling with progress bars and status indicators:
  - `Card 0`: 个人基本信息采集 (`demographics_survey` — 13 demographic items)
  - `Card 1`: PHQ-9 抑郁症筛查量表 (9 items)
  - `Card 2`: GAD-7 焦虑症筛查量表 (7 items)
  - `Card 3`: SCL-90 症状自评量表 (90 items)
- ✅ **Focused Card-by-Card Questionnaire Player**:
  - Full-screen takeover with top app bar, question counter, and linear progress indicator.
  - Large tactile option buttons with custom MD3 radio indicator circles.
  - **200ms auto-advance** on option tap with smooth Framer Motion transitions.
  - Bidirectional navigation ("上一题" / "下一题") and exit confirmation dialog.
  - Immutability locking upon final submission (test marked as "已完成").
- ✅ **Session Draft Caching**: Automatic persistence of in-progress answers to `localStorage` and SQLite, allowing seamless resumption if the browser closes.
- ✅ **Profile View**: Display student details, completed scale inventory, and "退出登录" action.

#### Technical & Persistence
- ✅ **Zero-Ops Backend**: Standalone Kotlin 2.3 + Spring Boot 4.1 service backed by embedded **SQLite** with Write-Ahead Logging (`WAL`).
- ✅ **Pure MD3 Component Suite**: Context-free buttons (`PrimaryButton`, `SecondaryButton`, `OutlinedButton`), `<md-dialog>`, `<md-outlined-text-field>`, and `<md-linear-progress>`.
- ✅ **Token Parity**: Shared CSS custom properties (`--md-sys-color-*`) from the CSU theme.

#### Integration & Export
- ✅ **Dual-File CSV Export**:
  - `students.csv`: Direct 1:1 match for core `StudentImportSchema` with UTF-8 BOM (`0xEF, 0xBB, 0xBF`).
  - `screening_responses.csv`: Canonical response records (`student_number, scale_code, question_id, selected_value, completed_at`).
- ✅ **Secured Admin Endpoint**: `GET /api/admin/export/*` protected by shared secret header `X-Admin-Secret`.

### Out of Scope (Deferred) ❌
- ❌ Responsive desktop layouts (mobile viewport enforced via `max-w-md mx-auto`).
- ❌ SMS carrier OTP gateways (phone number acts as identity identifier and contact method).
- ❌ Self-service password reset flows in the mobile intake app.
- ❌ Exposing raw psychological scores, cutoffs, or clinical risk labels to students.
- ❌ Direct cross-database replication or live multi-tenant synchronization.
- ❌ Voluntary arbitrary test selection outside the standard intake battery.

---

## 5. User Stories

### Story 1: Fast Mobile Registration
- **As an** incoming university freshman,
- **I want to** register with my Student ID, Phone Number, Name, and Password in under 30 seconds on my smartphone,
- **So that** I can immediately access and begin my mandatory health screening without tedious setup.
- *Example*: Alex scans the orientation QR code on his phone, enters `Student ID: 2026001`, `Phone: 13812345678`, `Name: 赵子轩`, and sets a password. The app registers the account and opens the Assessment Feed instantly.

### Story 2: Completing the Demographics Questionnaire
- **As a** registered student,
- **I want to** complete my extended demographic profile through the same step-by-step questionnaire interface as the psychological tests,
- **So that** I do not have to fill out a separate, cumbersome desktop form.
- *Example*: Alex taps the first card "个人基本信息采集", answers questions for National ID, Gender, Ethnicity, College, Major, Home Address, and Emergency Contact one by one, and submits.

### Story 3: Seamless Psychological Screening with Auto-Advance
- **As a** student taking the PHQ-9 or SCL-90 questionnaire,
- **I want** the questionnaire to automatically progress to the next question as soon as I tap an option,
- **So that** I can complete long psychological tests (like the 90-item SCL-90) quickly and with minimal thumb fatigue.
- *Example*: Alex taps "好几天" on Question 3 of PHQ-9; the option highlights with ripple feedback and smoothly slides to Question 4 after 200ms.

### Story 4: Progress Resumption After Interruption
- **As a** student who gets interrupted by a phone call mid-assessment,
- **I want** my draft answers saved automatically,
- **So that** when I reopen the link, I can pick up exactly where I left off without losing answers.
- *Example*: Alex is on question 45 of SCL-90 when a call comes in. Upon returning to the browser, the app restores his previous 44 answers and positions him at Question 45.

### Story 5: Immutable Test Completion & Privacy
- **As a** student who has submitted a psychological questionnaire,
- **I want** to see a clean confirmation screen and locked status badge,
- **So that** I know my submission was received without exposing private diagnostic scores that might cause anxiety.
- *Example*: Alex submits PHQ-9. He sees "测评已完成，感谢您的配合！" and the card badge changes to a filled-tonal checkmark "已完成". No raw scores or risk tiers are displayed.

### Story 6: Admin Batch Export for Core Ingestion
- **As a** screening administrator,
- **I want to** download verified CSV files of all registered students and their screening responses,
- **So that** I can upload the cohort directly into the main medical system via the existing bulk import dialog.
- *Example*: Admin Chen runs the export script at the end of orientation week, downloading `students.csv` and `screening_responses.csv`. He uploads `students.csv` into the core portal, instantly creating 3,500 active student accounts.

---

## 6. Core Architecture & Patterns

```
+─────────────────────────────────────────────────────────────────────────────+
|                         MOBILE INTAKE ARCHITECTURE                          |
|                                                                             |
|  [ Mobile Browser / WeChat Webview (max-w-md, 100dvh) ]                    |
|  ┌───────────────────────────────────────────────────────────────────────┐  |
|  │  React 19 + Vite + Tailwind CSS 4 + @material/web + Framer Motion     │  |
|  │                                                                       │  |
|  │  Navigation Shell (<md-navigation-bar>)                               │  |
|  │  ├── Tab 1: 问卷测评 (Assessment Cards Feed)                          │  |
|  │  └── Tab 2: 个人中心 (Profile & Logout)                               │  |
|  │                                                                       │  |
|  │  Questionnaire Player (Card-by-Card, 200ms Auto-Advance)             │  |
|  └───────────────────────────────────┬───────────────────────────────────┘  |
|                                      │ HTTP REST APIs                       |
|                                      ▼ (Bearer JWT / Session Token)         |
|  ┌───────────────────────────────────────────────────────────────────────┐  |
|  │  Spring Boot 4.1 + Kotlin 2.3 Microservice (Port: 8085)               │  |
|  │                                                                       │  |
|  │  ├── AuthController (/api/auth/register, /api/auth/login)             │  |
|  │  ├── ScaleController (/api/scales, /api/scales/{code}/submit)         │  |
|  │  └── AdminExportController (/api/admin/export/students.csv)           │  |
|  │                                                                       │  |
|  │  Domain & Storage Layer:                                              │  |
|  │  ├── Scale Catalog Loader (Shared JSON: phq_9.json, etc.)             │  |
|  │  ├── BCrypt Password Hasher (Main platform compatible)                │  |
|  │  └── SQLite Database via WAL Mode (`intake.db`)                       │  |
|  └───────────────────────────────────┬───────────────────────────────────┘  |
|                                      │ Batch CSV Export                     |
|                                      ▼ (Excel UTF-8 BOM)                    |
|  ┌───────────────────────────────────────────────────────────────────────┐  |
|  │  Downstream Core Medical System (Anti-Corruption Layer)               │  |
|  │  └── StudentImportService & AssessmentScoringEngine                   │  |
|  └───────────────────────────────────────────────────────────────────────┘  |
+─────────────────────────────────────────────────────────────────────────────+
```

### Key Architectural Patterns
1. **Independent Bounded Context**: Operates as a completely separate codebase in `/Volumes/Files/Programming/mobile-intake` with its own Git repository.
2. **Anti-Corruption Layer (ACL) Data Bridge**: Decouples data storage via standardized CSV formats matching `StudentImportSchema.kt` rather than shared database connections.
3. **Zero-Ops Embedded Database**: Embedded SQLite with Write-Ahead Logging (`PRAGMA journal_mode=WAL;`) eliminates external database dependencies while supporting concurrent mobile reads and writes.
4. **Step-Down Component Decomposition**: Avoids large monolithic components by decomposing the questionnaire flow into single-purpose components (`AssessmentQuestionCard`, `AssessmentProgressHeader`, `useAssessmentSession`).
5. **Pure MD3 Component Wrappers**: UI button primitives wrap `@material/web` custom elements with zero dependencies on desktop contexts like `SidebarContext`.

---

## 7. Feature Specifications

### 7.1 Authentication & Registration
- **Input Fields**: Student ID (`studentNumber`), Contact Phone (`phone`), Full Name (`fullName`), Initial Password (`password`).
- **Validation**:
  - Student ID: Non-blank, alphanumeric, 4–20 characters.
  - Phone: Valid 11-digit Chinese mobile format (`^1[3-9]\d{9}$`).
  - Password: Minimum 6 characters.
- **Hashing**: Standard BCrypt hash (strength 10), matching the core platform's credential format.
- **Session**: Generates a signed stateless JWT stored in `localStorage`, sent in the `Authorization: Bearer <token>` header.

### 7.2 Main Navigation & Shell
- **Viewport Constraints**: Enforced mobile container (`max-w-md mx-auto min-h-[100dvh] bg-surface flex flex-col shadow-lg`).
- **Bottom Navigation Bar**: Custom `<md-navigation-bar>`:
  - Tab 0: `问卷测评` with icon `assignment`.
  - Tab 1: `个人中心` with icon `account_circle`.

### 7.3 Assessment Feed Tab
- **Header**: Institutional banner with student greeting ("你好，[姓名]") and overall completion status ("已完成 X / 4 项测评").
- **Cards Feed**: Reuses the styling of [`AssessmentCard.tsx`](file:///Volumes/Files/Programming/medical-system/frontend/src/components/assessments/AssessmentCard.tsx):
  - Initial circle with tertiary container color.
  - Scale Title & Description.
  - Duration estimate (e.g. "约 3 分钟").
  - Status indicator: Outlined chip "未完成" with "开始" button vs. Filled tonal chip "已完成" with checkmark.

### 7.4 Card-by-Card Questionnaire Player
- **Layout**: Full-screen modal or dedicated view (`/test/:code`).
- **Top App Bar**:
  - Close button (`<md-icon-button>` with `close` icon) triggering confirmation dialog if in progress.
  - Questionnaire title.
  - Counter pill: `X / Total` (e.g., `4 / 9`).
- **Progress Indicator**: Pinned `<md-linear-progress>` with value `answeredCount / totalCount`.
- **Question Card**:
  - Question text with high-contrast font and comfortable spacing.
  - Vertical list of tactile option cards.
  - Radio circle indicator filling on selection (`bg-[var(--md-sys-color-secondary-container)]`).
- **Auto-Advance Mechanic**:
  - Tapping an option records the selection, applies visual state change, and triggers a **200ms timer** before sliding forward (`x: 20 -> 0`, Framer Motion duration: `0.2s`).
- **Bottom Navigation**:
  - "上一题" button (disabled on first item).
  - "下一题" button (enabled once current question is answered).
  - On the final item: Prominent "完成并提交" button.
- **Submission & Locking**:
  - Confirmation dialog: "确认提交该问卷？提交后将无法修改作答内容。".
  - Submits payload to backend; upon 200 OK, transitions to Outro screen and locks the test.

### 7.5 Personal Center (Profile Tab)
- Profile avatar card showing initials, Full Name, Student ID, and Phone Number.
- Summary checklist of completed questionnaires.
- Outlined destructive action button: "退出登录" (clears local token and returns to login).

### 7.6 Admin CSV Export Service
- Endpoints secured by `X-Admin-Secret` header:
  - `GET /api/admin/export/students.csv`: Exports all registered students with headers:
    `学号,姓名,专业,入学日期,身份证号,性别,民族,联系电话,电子邮箱,家庭住址,紧急联系人,紧急联系电话,班主任/辅导员工号`
  - `GET /api/admin/export/assessments.csv`: Exports all scale responses with headers:
    `student_number,scale_code,question_id,selected_value,completed_at`
- Prepends UTF-8 Byte Order Mark (`0xEF, 0xBB, 0xBF`) to ensure correct Chinese character display in Excel.

---

## 8. Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | 19.0.0 | User interface runtime |
| **Language & Tooling** | TypeScript | 5.8+ | Type safety & strict contracts |
| **Build Tool** | Vite | 6.2.0 | Mobile bundle compiler & dev server |
| **UI Components** | `@material/web` | 2.4.1 | Google Material Design 3 Web Components |
| **Styling** | Tailwind CSS | 4.1+ | Utility-first CSS & responsive tokens |
| **Animations & Icons** | Motion / Material Symbols | 12.0+ / 0.45+ | Smooth screen transitions & MD3 icons |
| **Backend Framework** | Spring Boot | 4.1.0 | REST API microservice |
| **Backend Language** | Kotlin | 2.3.21 | Type-safe JVM service logic |
| **Embedded Database** | SQLite (`sqlite-jdbc`) | 3.45+ | Zero-ops local single-file storage (`intake.db`) |
| **JPA / ORM** | Hibernate Community Dialects | 6.5+ | SQLite dialect for Spring Data JPA |
| **Security / Crypto** | Spring Security Crypto | 6.3+ | BCrypt password hashing |

---

## 9. Security & Configuration

### Authentication & Authorization Scope
- **Student Auth**: JWT token containing `studentNumber` subject, signed with HMAC-SHA256. Valid for 7 days to survive orientation week interruptions.
- **Admin Auth**: Administrative export routes require the request header `X-Admin-Secret: ${ADMIN_EXPORT_SECRET}` configured via environment variables.

### Configuration Properties (`application.properties`)
```properties
server.port=8085
spring.datasource.url=jdbc:sqlite:intake.db
spring.datasource.driver-class-name=org.sqlite.JDBC
spring.jpa.database-platform=org.hibernate.community.dialect.SQLiteDialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false

# Security & Secrets
intake.security.jwt-secret=medical-system-intake-secret-key-must-be-long-enough-32bytes
intake.security.admin-secret=csu-medical-intake-admin-secret-2026
```

### Security Guardrails
- In-Scope: Parameter validation on student numbers and phone numbers; BCrypt password hashing; preventing student access to admin export endpoints.
- Out-of-Scope: Third-party OAuth/OIDC; SMS carrier OTP verification; dynamic permission matrix.

---

## 10. API Specification

### 10.1 Student Registration & Authentication
#### `POST /api/auth/register`
- **Request Body**:
  ```json
  {
    "studentNumber": "2026001",
    "phone": "13812345678",
    "fullName": "赵子轩",
    "password": "password123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "student": {
      "studentNumber": "2026001",
      "fullName": "赵子轩",
      "phone": "13812345678"
    }
  }
  ```

#### `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "identifier": "2026001",
    "password": "password123"
  }
  ```
- **Response (200 OK)**: Same as registration.

---

### 10.2 Scale & Assessment Catalog
#### `GET /api/scales`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  [
    {
      "code": "demographics_survey",
      "title": "个人基本信息核对",
      "description": "采集身份证号、民族、专业与紧急联系人",
      "questionCount": 13,
      "estimatedMinutes": 3,
      "status": "COMPLETED"
    },
    {
      "code": "phq_9",
      "title": "PHQ-9 抑郁健康问卷",
      "description": "评估过去两周内的心理健康与情绪状况",
      "questionCount": 9,
      "estimatedMinutes": 2,
      "status": "NOT_STARTED"
    }
  ]
  ```

#### `GET /api/scales/{code}`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**: Returns full questions and options array for the questionnaire player.

#### `POST /api/scales/{code}/submit`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "answers": {
      "phq9_1": 1,
      "phq9_2": 0,
      "phq9_3": 2,
      "phq9_9": 0
    }
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "code": "phq_9",
    "status": "COMPLETED",
    "submittedAt": "2026-09-14T17:00:00"
  }
  ```

---

### 10.3 Administrative CSV Export
#### `GET /api/admin/export/students.csv`
- **Headers**: `X-Admin-Secret: <secret>`
- **Response**: `Content-Type: text/csv; charset=UTF-8` with UTF-8 BOM, streaming the formatted CSV file.

#### `GET /api/admin/export/assessments.csv`
- **Headers**: `X-Admin-Secret: <secret>`
- **Response**: `Content-Type: text/csv; charset=UTF-8` with raw responses.

---

## 11. Success Criteria

- ✅ **Zero Downtime**: 100% availability during orientation intake weeks regardless of core platform development state.
- ✅ **Rapid Registration**: Average student registration time under 30 seconds.
- ✅ **Smooth Interaction**: Option selection auto-advances within 200ms with zero jitter or layout shift on iOS Safari and Android Chrome.
- ✅ **Flawless Ingestion**: Exported `students.csv` uploads directly into the core platform's `StudentBulkImportDialog` with zero validation errors.
- ✅ **Visual Parity**: 100% visual consistency with the main platform's Material Design 3 tokens and typography.

---

## 12. Implementation Phases

```
Timeline: 4 Core Phases
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Phase 1: Setup   │ ──► │ Phase 2: Backend │ ──► │ Phase 3: Mobile  │ ──► │ Phase 4: Bridge  │
│ Scaffolding &    │     │ SQLite, Auth,    │     │ MD3 Shell, Cards │     │ CSV Ingestion &  │
│ Dependencies     │     │ Scale Endpoints  │     │ & Player UI      │     │ E2E Verification │
└──────────────────┘     └──────────────────┘     └──────────────────┘     └──────────────────┘
```

### Phase 1: Workspace Scaffolding & Dependencies
- **Goal**: Establish independent Git repository and configure project templates in `/Volumes/Files/Programming/mobile-intake`.
- **Deliverables**:
  - ✅ Git initialization (`git init`) and `.gitignore`.
  - ✅ Backend Maven project with Spring Boot 4.1, Kotlin, and SQLite dependencies.
  - ✅ Frontend Vite project with React 19, Tailwind CSS 4, and `@material/web`.
  - ✅ Shared scale JSON files copied from the core backend.
- **Validation**: Backend boots cleanly on port 8085; Frontend runs on port 3005 with hot reload.

### Phase 2: Backend Domain & API Implementation
- **Goal**: Implement persistent student registration, scale response tracking, and CSV export services.
- **Deliverables**:
  - ✅ `IntakeStudentEntity` and `ScaleSubmissionEntity` JPA mappings for SQLite.
  - ✅ BCrypt auth controller (`/api/auth/register`, `/api/auth/login`).
  - ✅ Scale catalog loader and response submission handler (`/api/scales/{code}/submit`).
  - ✅ `CsvExportService` with UTF-8 BOM generation.
- **Validation**: JUnit 5 integration tests verify registration, scale locking, and CSV output format.

### Phase 3: Mobile MD3 Frontend Implementation
- **Goal**: Build the mobile viewport UI with Material Design 3 components.
- **Deliverables**:
  - ✅ CSS design token configuration matching CSU palette in `index.css`.
  - ✅ Pure MD3 button primitives (`Buttons.tsx`) without desktop sidebar dependencies.
  - ✅ Bottom Navigation Shell (`<md-navigation-bar>`) with dual tabs.
  - ✅ Assessment Feed with `AssessmentCard` items and completion badges.
  - ✅ Card-by-Card Questionnaire Player with 200ms auto-advance and progress header.
  - ✅ Profile tab with student credentials and logout action.
- **Validation**: Tested in mobile device emulator (375px–430px viewports); 100% test completion flow works without errors.

### Phase 4: Data Bridge & Core System Ingestion
- **Goal**: Verify seamless data import into the primary university medical platform.
- **Deliverables**:
  - ✅ Test batch export generated from `mobile-intake`.
  - ✅ Ingestion verification through the core platform's `StudentImportService`.
  - ✅ Assessment batch import endpoint in core platform (`/api/assessments/intake-import`).
- **Validation**: Core system seeds student accounts and calculates correct health profile risk tiers from imported intake data.

---

## 13. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation Strategy |
| :--- | :---: | :---: | :--- |
| **Concurrent SQLite Writes under Peak Load** | High | Low | Enable SQLite Write-Ahead Logging (`WAL`) mode via Hikari connection pool init SQL; intake operations are lightweight inserts with minimal contention. |
| **Student Re-registration Confusion** | High | Low | Exported passwords use identical BCrypt hashing. When the main system launches, announce to students that their intake credentials are their permanent university medical portal login. |
| **Excel Character Encoding Issues** | Medium | Medium | Explicitly prepend UTF-8 Byte Order Mark (`0xEF, 0xBB, 0xBF`) to all exported CSV files to ensure Microsoft Excel on Windows renders Chinese characters cleanly. |
| **Mobile Browser Viewport Shifts** | Medium | High | Use dynamic viewport units (`100dvh`) and `overscroll-behavior: none` to prevent iOS Safari bottom toolbar resizing from disrupting question layout. |

---

## 14. Appendix & References

- **Core Medical System PRD**: [`/Volumes/Files/Programming/medical-system/PRD.md`](file:///Volumes/Files/Programming/medical-system/PRD.md)
- **Core System Coding Conventions**: [`/Volumes/Files/Programming/medical-system/GEMINI.md`](file:///Volumes/Files/Programming/medical-system/GEMINI.md)
- **Core Bulk Import Schema**: [`StudentImportSchema.kt`](file:///Volumes/Files/Programming/medical-system/backend/src/main/kotlin/com/medicalsystem/backend/service/StudentImportSchema.kt)
- **Standard Psychometric Scales**: [`backend/src/main/resources/assessments/`](file:///Volumes/Files/Programming/medical-system/backend/src/main/resources/assessments/) (`phq_9.json`, `gad_7.json`, `scl_90.json`)
- **Target Repository Location**: `/Volumes/Files/Programming/mobile-intake`
