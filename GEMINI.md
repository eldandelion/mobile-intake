# GEMINI.md

## Project Overview
The **Mobile Student Intake & Psychological Screening System** (`mobile-intake`) is a standalone, mobile-first web application designed to handle high-volume student onboarding, demographic profile intake, and psychological screening assessments during university orientation and screening windows.

It operates as an independent subproject outside the main medical system to ensure 100% operational uptime and zero fault propagation from active development on the primary platform.

### Repository Structure
```text
/Volumes/Files/Programming/mobile-intake/
├── frontend/             # Mobile React 19 + TypeScript + Vite 6 + Tailwind 4 + MD3
├── backend/              # Lightweight Spring Boot 4.1 + Kotlin 2.3 + SQLite microservice
├── PRD.md                # Comprehensive Product Requirements Document
├── GEMINI.md             # Project standards, coding guidelines & architecture rules
└── .gitignore            # Version control exclusions
```

---

## Tech Stack & Build Tools

### Frontend (`/frontend`)
- **Framework & Core**: React 19, TypeScript 5.8 (Target ES2022, bundler module resolution)
- **Build Tool & Dev Server**: Vite 6 (`@vitejs/plugin-react`), Port: `3005`
- **Styling**: Tailwind CSS 4 (`@tailwindcss/vite`), Material Design 3 Web Components (`@material/web`), Roboto & Noto Sans fonts, Material Symbols Outlined
- **Animations & Icons**: Motion (Framer Motion), Lucide React, Material Symbols
- **Viewport Constraints**: Enforced mobile container (`max-w-md mx-auto min-h-[100dvh] bg-surface flex flex-col shadow-xl`)

### Backend & Database (`/backend`)
- **Framework**: Spring Boot 4.1, Spring Data JPA, Spring Web, Spring Validation
- **Language & Runtime**: Kotlin 2.3 (JVM 17), Jackson Kotlin Module
- **Build Tool**: Apache Maven (wrapper: `./mvnw`), Port: `8085`
- **Database**: Embedded SQLite (`sqlite-jdbc` + `hibernate-community-dialects`), single-file database (`intake.db`) with Write-Ahead Logging (`WAL`) mode enabled
- **Security & Crypto**: Spring Security Crypto (BCrypt password hashing matching core platform), JJWT (stateless token authentication)

---

## Architecture & Code Organization

### Frontend Architecture
- **Mobile Navigation Shell**: Dual-tab navigation via Material Web `<md-navigation-bar>`:
  - Tab 0: **问卷测评** (`assignment`) — Card-based assessment list
  - Tab 1: **个人中心** (`account_circle`) — Student identity & logout
- **Focused Questionnaire Player (`/test/:code`)**:
  - Full-screen takeover with top app bar, question counter pill (`X / Total`), and pinned `<md-linear-progress>`
  - Tactile option cards with custom MD3 radio indicator circles
  - **200ms auto-advance** on option tap with smooth slide transitions (`duration: 0.2`)
  - Automatic draft state synchronization to `localStorage` and backend for seamless interruption resumption
  - Immutability locking upon final submission (test marked as "已完成" with checkmark)
- **Pure Component Primitives**:
  - Button components (`PrimaryButton`, `SecondaryButton`, `OutlinedButton`, `TertiaryButton`) must remain **pure context-free presentation components** with 48px touch targets (`min-h-[48px]`), never coupled to desktop layouts or sidebars.

### Backend Architecture (Domain-Driven Design)
- **Supporting Subdomain Role**: Acts as an upstream data collection tool. Strictly captures and validates raw Likert responses (`Map<QuestionCode, Int>`).
- **Separation of Clinical Authority**: The intake backend **MUST NOT** calculate psychological diagnostic risk scores, severity tiers, or cutoffs. Authority to evaluate psychiatric risk belongs strictly to the downstream Core Medical System upon batch import.
- **Model Isolation**: Use ubiquitous terms: `IntakeStudent`, `ScreeningSession`, and `ScaleResponseSet`. Never reuse core platform concepts like `AssessmentAssignment`.
- **Anti-Corruption Layer (ACL) Export**:
  - `GET /api/admin/export/students.csv`: Direct 1:1 match for core `StudentImportSchema` (`学号,姓名,专业,入学日期,身份证号,性别,民族,联系电话,电子邮箱,家庭住址,紧急联系人,紧急联系电话,班主任/辅导员工号`).
  - `GET /api/admin/export/assessments.csv`: Canonical response records (`student_number,scale_code,question_id,selected_value,completed_at`).
  - Both CSV exports MUST prepend the UTF-8 Byte Order Mark (`0xEF, 0xBB, 0xBF`) for native Microsoft Excel compatibility on Windows and macOS.

---

## Coding Conventions & Formatting

### Naming Conventions
- **Classes, Interfaces, Types, React Components**: `PascalCase` (e.g., `IntakeController`, `AssessmentCard`, `IntakeStudentEntity`)
- **Functions, Methods, Variables, Properties**: `camelCase` (e.g., `studentNumber`, `submitScale`, `recordScaleAnswers`)
- **Enums & Constants**: `SCREAMING_SNAKE_CASE` (e.g., `IntakeStatus.COMPLETED`, `ScaleStatus.NOT_STARTED`)
- **Database Columns**: `snake_case` (e.g., `student_number`, `password_hash`, `completed_at`)

### Formatting
- **Frontend**: 2-space indentation, semicolons enabled, single quotes, strict TypeScript (`tsc --noEmit`).
- **Backend**: 4-space indentation, standard Kotlin conventions, trailing commas supported.

### Magic Strings & Presentation Strings
- **No UI Presentation Strings in Backend**: The backend MUST remain strictly language-agnostic. Return standardized codes, booleans, or enums (e.g. `code: "phq_9"`, `status: "COMPLETED"`). Let the frontend define all localized UI text.
- **No Magic Constants**: Extract questions, scale codes, and schema keys to canonical constants or shared JSON catalog files.

---

## Error Handling & Resilience

### Frontend
- **Network Interruptions**: In-progress answers are cached locally in `localStorage` keyed by `studentNumber` + `scaleCode`. If mobile connectivity drops, the user can reload and continue without losing answers.
- **Form Validation**: Clean inline validation on registration (11-digit Chinese phone number, 4–20 character student ID, minimum 6-character password).
- **Confirmation Modals**: Premature exit and final submission are guarded by `<md-dialog>` confirmation prompts.

### Backend
- **Input Validation**: Bean Validation (`@Valid`, `@NotBlank`, `@Pattern`) on all incoming request DTOs.
- **Centralized Exception Handling**: `@RestControllerAdvice` maps exceptions to uniform JSON responses:
  - `400 BAD_REQUEST`: Parameter or validation failure with details.
  - `401 UNAUTHORIZED`: Invalid credentials or missing bearer token.
  - `403 FORBIDDEN`: Invalid `X-Admin-Secret` on export endpoints.
  - `404 NOT_FOUND`: Scale or student not found.
  - `409 CONFLICT`: Duplicate student registration attempt.

---

## SQLite Database Best Practices

1. **Write-Ahead Logging (`WAL`)**:
   Always initialize connections with `PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;` via Hikari connection pool configuration to allow concurrent non-blocking reads during peak intake writes.
2. **File Location**:
   The SQLite database file (`intake.db`) lives in the backend root and is excluded from git tracking.
3. **Deterministic Timestamps**:
   All timestamps stored as ISO-8601 strings or UTC epoch milliseconds.

---

## Common Development & Build Commands

### Frontend (`/frontend`)
- Install dependencies: `npm install`
- Start dev server (port 3005): `npm run dev`
- Run type check / lint: `npm run lint` (`tsc --noEmit`)
- Production build: `npm run build` (`tsc && vite build`)

### Backend (`/backend`)
- Compile project: `./mvnw clean compile`
- Run unit & integration tests: `./mvnw test`
- Run local development server (port 8085): `./mvnw spring-boot:run`
- Package standalone JAR: `./mvnw clean package`

### Docker & Deployment
- Start containers locally: `docker compose up --build -d`
- Stop containers: `docker compose down`
- Check container logs: `docker compose logs -f`
- Data persistence: SQLite database persists in Docker named volume `intake-data` mounted at `/app/data/intake.db`

---

## PRD and Context Reference
- Complete product requirements and feature breakdown: [`PRD.md`](file:///Volumes/Files/Programming/mobile-intake/PRD.md)
- Core platform reference & bulk import schema: [`/Volumes/Files/Programming/medical-system/PRD.md`](file:///Volumes/Files/Programming/medical-system/PRD.md)
