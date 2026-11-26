# Build Spec: AI-Powered Interactive Employee Induction Platform

Version 1.1 · 25 November 2026

> **Changes from v1.0 (requested 25 Nov 2026):**
> - **No Docker.** Local development uses the PostgreSQL already installed on the machine.
> - **No single sign-on for now.** Authentication is the dev email-only provider behind the `AuthProvider` interface. SSO moves to "later".
> - **Avatar motions and emotions.** Scripts are stored as segments, each with an emotion and a gesture (Section 7.1).

> **Changes from v1.1 (requested 25 Nov 2026, "build end to end, free speech, own avatar"):**
> - **Built-in presenters replace Azure avatar video.** Each avatar is an SVG character drawn and animated in the browser (`apps/web/src/avatar`): 9 emotions drive the face, 15 gestures drive the arms and head, and the mouth moves with speech. An avatar stores its look (`appearance`), voice profile and manner instead of Azure character settings.
> - **Free speech replaces Azure AI Speech.** Scripts are spoken by the browser's own voices (Web Speech API, `apps/web/src/speech/narrator.ts`). No key and no cost. Voice quality depends on the browser and operating system; with no voice available the player falls back to a silent, captioned run at speaking pace.
> - **Quiz "clips" are spoken lines** (`{ text, emotion, gesture }`), not video files.
> - **Not built because nothing needs them now:** the avatar job pipeline (pg-boss, `StorageService`, batch synthesis), Howler and Lottie. Sound effects and music are synthesised with the Web Audio API. The `MediaAsset` and `AvatarJob` tables remain in the schema, unused. Sections 5, 11 and M6 below describe the original Azure design and are kept for reference only.
> - **All milestones were built in one pass** at the user's request (no stop between milestones).

> **Changes from v1.2 (requested 25 Nov 2026, "Admin panel and HR panel"):**
> - **New `ADMIN` role and Admin panel (`/admin`).** The admin designs presenters, sets and updates content, manages the follow-up questions (the question bank), runs the review workflow, uses the AI assistant, and creates sign-in details for HR and other staff. The admin also sees every HR report.
> - **`HR_ADMIN` is now the HR panel (`/hr`), shown as "HR".** HR invites candidates and reads the dashboard and reports. HR no longer edits content, presenters or accounts. Where sections below give `HR_ADMIN` content or user management, read `ADMIN`.
> - **Candidate invitations.** HR enters an employee id and an email (name optional, otherwise taken from the email). The system creates the candidate, sets a default password and creates an invitation link (`/invite/:token`, valid 14 days). HR shares the link, the sign-in details, or both. HR can issue a new link or a new default password, and block a candidate.
> - **Password sign-in.** `POST /auth/login` takes email and password. A system-set default password must be replaced at first sign-in; nothing else opens until it is. Passwords are stored as scrypt hashes and invite tokens as SHA-256 hashes; the readable values are returned once and never logged. The one-click email sign-in is now `POST /auth/dev-login` and exists only in development.
> - **Candidate performance.** The Performance report shows, per candidate, sessions attended and right and wrong answers; a candidate's detail view (`GET /dashboard/employees/:id`) lists every session and every question with its outcome.
> - **New endpoints:** `/auth/invite`, `/auth/change-password`, `/hr/candidates` (list, create, `:id/invite`, `:id/reset-password`, `:id/active`), `/admin/users/:id/reset-password`.
> - **Not built:** sending the invitation by email. HR copies the link or the ready-made message and sends it through their own channel.

> **Changes from v1.3 (requested 25 Nov 2026, "2D AI-powered animated character"):**
> - **Presenters are now fuller 2D animated characters**, still drawn in the browser with no outside service or artwork: shaded face and outfit, irises that follow a gaze, eyelids and lashes, breathing, a slight head turn toward where the presenter points or looks, and a brow lift and nod on stressed words (long words, numbers, exclamations).
> - **Cartoon drawing style (default).** `appearance.style` is `cartoon` (TV-cartoon look: big head, thick ink outlines, flat colours with one hard shadow, big oval eyes, squash and stretch) or `classic` (the shaded look). The cartoon presenter is full-body (sweater, trousers in the new `appearance.pants` colour, shoes) and rigged like a cut-out puppet: round shoulder and elbow joints keep the sleeves attached at any angle, hands have a palm, thumb and fingers, the shoulders lift on raised arms and shrugs, and the upper body leans into each gesture and shifts its weight while idle (`apps/web/src/avatar/body.tsx`). Existing presenters become cartoon automatically; admins can switch on the Presenters page. The characters are original designs, not copies of any existing cartoon character.
> - **Lip-sync from visemes.** Each spoken word is turned into a timed sequence of 14 mouth shapes (now `apps/web/src/character/visemes.ts`): lips close on M/B/P, teeth touch the lip on F/V, lips round on O/U/W and spread on E/S. If a browser voice gives no word timing, the mouth falls back to a generic talking rhythm.
> - **"Direct with AI".** In the script editor (Content and AI assistant pages) an admin can ask Azure OpenAI to choose the emotion and gesture for every segment of an existing script (`POST /admin/ai/direct`). The words are never changed, nothing is saved until the admin saves the step, and the usual review workflow still applies. The button appears only when the AI assistant is configured.

> **Changes from v1.4 (requested 25 Nov 2026, "Advanced 2D cartoon character animation system"):**
> - **New character engine (`apps/web/src/character`)** replaces the old avatar drawing. Original designs only; no existing cartoon characters are copied. No new dependencies (no GSAP): own SVG rig and animation code.
> - **Skeletal rig.** A flat `Pose` record (`pose.ts`) holds every animatable value. `rig/skeleton.ts` solves it into joints: pelvis, spine, neck, head; shoulder, elbow and wrist on each arm (forward kinematics, or two-bone IK to reach a point); hip, knee and ankle on each leg (IK to planted feet, so hips can sway and the body can crouch, jump and sit). Limbs are drawn as joint-circle hulls, inked in two passes, so joints never show gaps.
> - **Hands** have a palm, a thumb and four fingers that curl separately (open, relaxed, fist, point, wave, thumbs up, counting 1 to 3, presenting) and show the palm or the back.
> - **Face:** eyes with lids, lashes, pupils and gaze; brows; nose; a mouth shaped by smile, open, wide and round values, with teeth and tongue; jaw; blush, tears and sweat. Expressions: normal, talking, friendly, happy, cheerful, excited, laughing, proud, hopeful, encouraging, empathetic, sad, crying, serious, angry, surprised, confused.
> - **Clothing as separate parts:** tops `polo`, `tee`, `sweater`, `shirt` (tucked, with belt) and `jacket` (with inner shirt and lapels); short or long sleeves with cuffs; bottoms `trousers`, `shorts` or `skirt`; socks and shoes. `appearance` gains `figure` (masculine or feminine, defaulting from the voice gender), `build` (slim, regular, broad), `top`, `bottom` and `shoes` colour; `style` is removed. Stored as JSON with defaults, so no migration.
> - **Animation:** keyframe and procedural clips (`anim/clip.ts`) on three mixer layers (body, gesture, face) with crossfades and priorities (`anim/mixer.ts`). Body clips: idle, walking, running, walkIn, walkOut, jump, sit, stand. Gesture clips cover every stored gesture plus listen, laugh, cheer, scratchHead, greet and a talking beat.
> - **Controller** (`controller.ts`): `play(name)`, `stop()`, `setExpression(name)`, `lookAt(target)`, `blink()`, `setSpeaking()`, `speakWord(text, ms)`. It adds breathing, blinking, glances, emphasis and viseme lip-sync with jaw movement, and skips big moves for viewers who prefer reduced motion.
> - **Player:** the presenter walks in at the start of each module and out at its end, listens while the learner answers, jumps and cheers on a right answer and scratches their head on a wrong one.

> **Changes from v1.5 (requested 26 Nov 2026, "separate candidate landing page"):**
> - **Two sign-in pages.** `/candidate` is the candidate landing page (email and password); `/login` is for Admin, HR and Legal staff. `POST /auth/login` takes an optional `portal` (`candidate` or `staff`) and refuses accounts that belong to the other page. Signing out returns each person to their own page, and signed-out visitors to candidate pages are sent to `/candidate`.
> - **Invitation links land on the candidate page.** `/invite/:token` greets the candidate by first name (`POST /auth/invite/check`, which signs nobody in) and starts the induction when they click "Start my induction" (`POST /auth/invite`). A link that has expired or been replaced shows the email-and-password form instead.
> - **Sign-in details name the right page.** `CredentialsDto.signInUrl` is `/candidate` for candidates and `/login` for staff, and the ready-made message includes it.

---

## 0. Instructions for Claude

- **Role:** You are the lead full-stack engineer building this application from scratch.
- **Order:** Build milestone by milestone (Section 13). Stop after each milestone, summarize what was built, and wait for review.
- **Decided stack:** Use only the stack in Section 3. Ask before adding any other major dependency.
- **TypeScript:** Strict mode everywhere. Validate every API input with Zod.
- **Secrets:** Never hard-code keys, endpoints or passwords. Read them from environment variables. `.env` is git-ignored; maintain `.env.example` with placeholder values only.
- **Test data:** Use synthetic seed data only. No real employee data at any stage of development.
- **Quiz integrity:** Answer evaluation happens on the server. Never send which option is correct to the client until the server returns a REVEAL result.
- **Tests:** Write unit tests for the quiz engine, progress logic and role guards.
- **Avoid:** Refactoring unrelated code, adding features not in this spec, and placeholder "TODO" logic in completed milestones.

---

## 1. Product Summary

An avatar-led induction web application. New employees watch a sequence of AI avatars, each presenting one part of the company. Avatars pause to ask multiple-choice questions, give hints on wrong answers, and reveal the answer in an engaging way after a second wrong attempt. Transitions between avatars are cinematic. HR manages content and tracks completion through a custom dashboard.

### Goals

- Make new employees feel personally welcomed and guided.
- Replace passive reading with active participation.
- Confirm understanding through supportive, non-exam questions.
- Give HR a consistent, trackable, easy-to-update induction.

---

## 2. Scope

### Phase 1 (build now)

- Seven avatar-led modules with cinematic transitions
- Avatars that express emotion and motion per script segment
- Multiple-choice quiz engine with hint and reveal logic
- Progress tracking, resume and learner controls
- Digital acknowledgments for Policies and Compliance modules
- End-of-session completion screen with score summary and feedback
- Admin content management with review and approval workflow
- Avatar video generation pipeline (Azure AI Speech)
- AI authoring assistant for HR (Azure OpenAI)
- Custom HR dashboard

### Not in Phase 1

- Single sign-on (dev email-only login for now)
- Docker / containerized local setup
- Completion certificate
- Email/Teams invites and reminders
- HRMS/LMS integrations (users are added by CSV import or manually)
- "Ask the Avatar" free-text chat (Phase 2, see Section 14)
- Role-specific job training

---

## 3. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React + TypeScript (Vite), Tailwind CSS, React Router, TanStack Query, Zustand | Learner app, admin and HR dashboard |
| Transitions | Framer Motion, Lottie (`lottie-react`) | Cinematic transitions, quiz pop-ups, placeholder avatar motion |
| Audio | Howler.js | Background music, sound effects |
| Avatar + voice | Azure AI Speech: text-to-speech avatar + neural voices | Talking avatars with lip-sync, gestures and voice styles |
| LLM | Azure OpenAI via the `openai` npm package (`AzureOpenAI` client) | AI authoring assistant; Phase 2 Q&A |
| Backend | Node.js + TypeScript, NestJS | APIs, quiz engine, progress tracking |
| ORM | Prisma | Database access and migrations |
| Database | PostgreSQL (local install in development) | All application data |
| Vector search | pgvector extension | Phase 2 "Ask the Avatar" retrieval (not enabled yet) |
| Job queue | pg-boss (runs on PostgreSQL) | Background avatar video generation |
| HR dashboard | Recharts, TanStack Table, SheetJS | Charts, data grids, Excel export |
| Validation | Zod (shared package) | Request and form validation |

Local development uses the machine's own PostgreSQL service on `127.0.0.1:5432`. No Docker.

---

## 4. Repository Structure

```
(repo root)
├── apps/
│   ├── web/                 # React + Vite (learner app, admin, HR dashboard)
│   └── api/                 # NestJS + Prisma
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── seed.ts          # synthetic users + progress
│       └── src/content/
│           ├── seed-content.ts     # default induction scripts, questions, avatars
│           └── default-content.ts  # builds it for the seed and "Reset to default"
├── packages/
│   └── shared/              # shared types and Zod schemas
├── Data/                    # source notes the induction content is written from
├── docs/
│   └── SPEC.md              # this file
├── .env.example
├── CLAUDE.md
└── package.json             # npm workspaces
```

---

## 5. Pluggable Services (decide later, build interfaces now)

Build each behind an interface with a development implementation so work is not blocked.

| Service | Interface | Dev implementation | Production (to be decided) |
|---|---|---|---|
| Authentication | `AuthProvider` | Seeded users, email-only login (dev only) | To be decided (SSO removed for now) |
| File storage | `StorageService` (`put`, `getUrl`, `delete`) | Local filesystem, served by the API | Cloud blob storage |
| Hosting | n/a | Local | To be decided |
| Secrets | Environment variables | `.env` (git-ignored) | Vault or platform secret store |

Sessions use a signed JWT in an httpOnly, secure cookie.

### Roles

| Role | Access |
|---|---|
| `LEARNER` | Induction player only |
| `ADMIN` | Presenters, content and follow-up questions, review workflow, HR and staff accounts, all reports |
| `HR_ADMIN` | Candidate invitations, HR dashboard and reports (no content editing) |
| `LEGAL_REVIEWER` | Review and approve Compliance and Policies content |

---

## 6. Induction Content

| # | Module | Presenter | Topics | Acknowledgment |
|---|---|---|---|---|
| 1 | Company Introduction | Company Avatar | Who we are, what we do, company overview, milestones, achievements | No |
| 2 | Founders' Introduction | Founders' Avatars | Founders' introduction, vision, founding journey, growth story, future goals | No |
| 3 | Company Culture | Culture Avatar | Values, behaviours, ways of working, collaboration, professional environment | No |
| 4 | Company Policies | Policies Avatar | Leave, attendance and working hours, conduct, expectations, HR guidelines | Yes |
| 5 | Compliance and Workplace Safety | Compliance Avatar | POSH, information security, data protection and privacy, ethics, compliance responsibilities | Yes, per topic |
| 6 | Business Units | Business Units Avatar | Each business unit, services and operations, how teams work together, business structure | No |
| 7 | Induction Conclusion | Closing Avatar | Summary, key takeaways, congratulations, next steps, feedback | No |

Target total duration: about 40-45 minutes.

**Personalization (Phase 1):** Show the employee's first name on screen. In Module 6, present the employee's own business unit first (business-unit steps use the topic `bu-<slug>`).

**Source content:** `Data/Company`, `Data/Founders`, `Data/Culture`, `Data/Policies`, `Data/Compliance`.

---

## 7. Core Concept: Steps

Each module is an ordered list of **steps**. The player runs steps in sequence.

| Step type | Behaviour |
|---|---|
| `VIDEO` | Plays an avatar video clip. |
| `QUESTION` | Plays the avatar's "ask" clip, then shows the MCQ overlay and runs the quiz engine. |
| `TRANSITION` | Plays the current avatar's handover clip, an animated transition, then the next avatar's entry clip. |
| `ACKNOWLEDGMENT` | Shows a modal with policy text and an "I have read and understood" checkbox. Required to continue. |

Every step can set a background asset and a music track. A step may override the module's presenter (`Step.avatarId`), which is how the two founders share Module 2.

### 7.1 Avatar expression: emotions and motions

A step's script is stored as an ordered list of **segments**. Each segment is one spoken chunk with the emotion and the motion that go with it:

```json
{ "text": "Hello, and a very warm welcome to LevelShift!", "emotion": "CHEERFUL", "gesture": "WAVE" }
```

| Field | Values |
|---|---|
| `emotion` | `NEUTRAL`, `FRIENDLY`, `CHEERFUL`, `EXCITED`, `PROUD`, `HOPEFUL`, `EMPATHETIC`, `SERIOUS`, `ENCOURAGING` |
| `gesture` | `NONE`, `WAVE`, `NOD`, `THUMBS_UP`, `APPLAUD`, `OPEN_ARMS`, `POINT_LEFT`, `POINT_RIGHT`, `SHOW_FRONT`, `COUNT_ONE`, `COUNT_TWO`, `COUNT_THREE`, `THINK`, `HAND_ON_HEART`, `CAUTION` |

Rules:

- Emotion and gesture names are **abstract**. They are defined once in `packages/shared` and mirrored as Prisma enums.
- **Azure mode (M6):** the pipeline turns each segment into SSML. The emotion maps to a voice speaking style, and the gesture maps to an avatar gesture marker at the start of the segment. If the chosen avatar character or voice has no match, fall back to neutral / no gesture. Confirm the supported styles and gestures in Microsoft's current documentation before building the mapping.
- **Placeholder mode (M3):** the player animates the still avatar from the same data: a facial expression and stage tint per emotion, and a Framer Motion / Lottie motion per gesture, timed to the segment.
- Each avatar has a personality: `defaultEmotion`, `entryGesture`, `exitGesture` and `energy` (0.5 calm to 1.5 lively).
- Each step also has a dominant `emotion` used for the stage mood.
- Quiz feedback uses fixed defaults: praise = `EXCITED` + `THUMBS_UP`, hint = `ENCOURAGING` + `THINK`, reveal = `EMPATHETIC` + `SHOW_FRONT`. Praise clips can override these.
- The AI authoring assistant (M7) must output segments with an emotion and gesture for each.

---

## 8. Quiz Engine

### Question selection

- A `QUESTION` step points to a question pool (module + topic).
- The server picks one `PUBLISHED` question at random for each user and stores the choice, so a resumed session shows the same question.

### Answer logic (server-side)

| Attempt | Result | Server returns | Client behaviour |
|---|---|---|---|
| 1 | Correct | `CORRECT` + praise clip | Play praise clip, continue |
| 1 | Wrong | `HINT` + hint clip + hint text | Play hint clip, grey out the chosen option, allow second attempt |
| 2 | Correct | `CORRECT` + praise clip | Play praise clip, continue |
| 2 | Wrong | `REVEAL` + correct option id + reveal clip + explanation | Highlight correct answer, play reveal clip, continue |

### Rules

- Maximum two attempts per question.
- Never blocks progress: the learner always continues after a REVEAL.
- Every attempt is stored.
- Praise clips are reusable: each avatar has 3-5 generic praise clips, chosen at random.
- Hint and reveal clips are specific to each question.

### Done when

- Unit tests cover all four rows of the answer logic, a third-attempt request (rejected), and a resumed session (same question returned).

---

## 9. Data Model

Source of truth: `apps/api/prisma/schema.prisma`.

| Entity | Key fields |
|---|---|
| `User` | id, email, firstName, lastName, department, location, businessUnitId, role, joiningDate, isActive |
| `BusinessUnit` | id, slug, name, description, order |
| `Avatar` | id, name, title, azureCharacter, azureStyle, voiceName, themeColor, personalityNotes, defaultEmotion, entryGesture, exitGesture, energy |
| `AvatarPraiseClip` | id, avatarId, text, emotion, gesture, mediaAssetId |
| `Module` | id, order, slug, title, description, avatarId, requiresAcknowledgment, status, version |
| `Step` | id, moduleId, order, type, title, topic, avatarId (override), script, segments, emotion, ackText, mediaAssetId, questionPoolTopic, backgroundAssetId, musicAssetId |
| `Question` | id, moduleId, topic, text, hint, explanation, askClipId, hintClipId, revealClipId, status, version |
| `QuestionOption` | id, questionId, text, isCorrect, order |
| `UserQuestion` | userId, stepId, questionId (the question chosen for this user) |
| `Attempt` | id, userId, questionId, optionId, attemptNo, isCorrect, createdAt |
| `Enrollment` | id, userId, status, startedAt, completedAt, currentModuleId, currentStepId |
| `ModuleProgress` | userId, moduleId, status, completedAt |
| `Acknowledgment` | id, userId, moduleId, topic, contentVersion, acknowledgedAt |
| `Feedback` | id, userId, rating (1-5), comment, createdAt |
| `MediaAsset` | id, kind, storageKey, mimeType, durationSec, captionsKey, sourceScriptHash, status |
| `AvatarJob` | id, mediaAssetId, azureJobId, status, error, createdAt, updatedAt |
| `ContentReview` | id, entityType, entityId, version, status, reviewerId, comment, createdAt |
| `AuditLog` | id, actorId, action, entityType, entityId, details, createdAt |

### Enums

- `Role`: LEARNER, ADMIN, HR_ADMIN, LEGAL_REVIEWER
- `StepType`: VIDEO, QUESTION, TRANSITION, ACKNOWLEDGMENT
- `ContentStatus`: DRAFT, IN_REVIEW, APPROVED, PUBLISHED, ARCHIVED
- `EnrollmentStatus`: NOT_STARTED, IN_PROGRESS, COMPLETED
- `MediaKind`: AVATAR_VIDEO, BACKGROUND, MUSIC, SFX, LOTTIE
- `JobStatus`: QUEUED, RUNNING, SUCCEEDED, FAILED
- `Emotion`, `Gesture`: see Section 7.1

---

## 10. API (REST, prefix `/api/v1`)

### Auth

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/auth/login` | Public | Dev provider login |
| POST | `/auth/logout` | Any | End session |
| GET | `/auth/me` | Any | Current user and role |

### Learner

| Method | Path | Purpose |
|---|---|---|
| GET | `/induction` | Modules, order and the learner's progress |
| GET | `/modules/:id/steps` | Steps with media URLs, captions and segments (no correct answers) |
| POST | `/progress` | Mark a step complete; update current position |
| GET | `/steps/:stepId/question` | The question chosen for this user (options without `isCorrect`) |
| POST | `/questions/:id/attempts` | Submit `{ optionId }`; returns CORRECT, HINT or REVEAL |
| POST | `/acknowledgments` | Record `{ moduleId, topic }` |
| POST | `/feedback` | Submit `{ rating, comment }` |
| GET | `/summary` | Completion screen data: modules completed, first-attempt score |

### Admin (`ADMIN`; review actions also `LEGAL_REVIEWER`)

| Method | Path | Purpose |
|---|---|---|
| CRUD | `/admin/modules`, `/admin/steps`, `/admin/questions`, `/admin/avatars`, `/admin/business-units` | Content management |
| POST | `/admin/content/:type/:id/submit` | DRAFT → IN_REVIEW |
| POST | `/admin/content/:type/:id/approve` | IN_REVIEW → APPROVED (Policies and Compliance need `LEGAL_REVIEWER`) |
| POST | `/admin/content/:type/:id/publish` | APPROVED → PUBLISHED |
| POST | `/admin/ai/generate-script` | Draft a step script (segments) from source text |
| POST | `/admin/ai/generate-questions` | Draft questions with options, hint and explanation |
| POST | `/admin/media/avatar-jobs` | Queue avatar video generation for a script |
| GET | `/admin/media/avatar-jobs` | Job status list |
| POST | `/admin/media/upload` | Upload backgrounds, music, sound effects, Lottie files |
| POST | `/admin/users/import` | CSV import of new joiners |
| CRUD | `/admin/users` | Manage users and roles |

### HR Dashboard (`HR_ADMIN`, `ADMIN`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/dashboard/summary` | Totals by status, average first-attempt accuracy, average rating |
| GET | `/dashboard/employees` | Paged list with filters (department, location, business unit, joining date, status) |
| GET | `/dashboard/quiz-analytics` | Accuracy per module and most-missed questions |
| GET | `/dashboard/acknowledgments` | Who acknowledged what, and when |
| GET | `/dashboard/feedback` | Ratings and comments |

All admin and dashboard writes create an `AuditLog` entry.

Also available: `GET /health` (setup check: database status and content counts).

---

## 11. Azure Integrations

### 11.1 Avatar video pipeline (Azure AI Speech)

1. HR approves and publishes a script (step, question ask/hint/reveal, or praise line).
2. The API queues a pg-boss job with the script segments, avatar character, style and voice.
3. The worker builds SSML from the segments (voice style per emotion, gesture marker per gesture), submits an avatar **batch synthesis** request to Azure AI Speech and polls until complete.
4. The worker downloads the video, saves it through `StorageService`, and updates `MediaAsset` and `AvatarJob`.
5. Captions: generate a WebVTT file using Azure's sentence-boundary or subtitle output. Confirm the current option in Microsoft's documentation.
6. Store `sourceScriptHash` (hash of the segments, including emotion and gesture) so unchanged scripts are not regenerated.

Notes:

- Use the current API version from Microsoft's documentation for avatar batch synthesis.
- Prebuilt avatars are used until custom avatars are approved. Custom avatars and custom voices (e.g., founders) are Limited Access and need Microsoft approval plus recorded consent.
- **Placeholder mode:** If `AVATAR_MODE=placeholder`, generate a still image with neural TTS audio instead, so frontend work is never blocked. The player animates the still from the segment emotions and gestures.

### 11.2 AI authoring assistant (Azure OpenAI)

- Use the `AzureOpenAI` client from the `openai` npm package with a deployment name from env.
- The key stays on the server. Never expose it to the browser (no `VITE_` prefix).
- Inputs: source text pasted by HR, module, topic, number of items.
- Use structured JSON output with a schema. Validate the response with Zod before saving.
- Script output: segments, each with text, emotion and gesture.
- Question output per item: text, four options, one correct, hint, explanation written as an engaging story or fun fact.
- Everything AI-generated is saved as `DRAFT` and must go through review before publishing.
- The LLM is never used to grade answers.

---

## 12. Frontend

### Learner routes

| Route | Screen |
|---|---|
| `/login` | Staff sign-in (Admin, HR, Legal) |
| `/candidate` | Candidate sign-in |
| `/invite/:token` | Candidate invitation landing page |
| `/` | Welcome: greeting by first name, module overview, start/resume button |
| `/induction` | Player |
| `/complete` | Completion: summary, key takeaways, next steps, feedback form |

### Player requirements

- **Layout:** Full-width avatar video stage; themed background per module; progress bar showing modules completed and remaining.
- **Controls:** Play/pause, replay current step, volume/mute, captions on/off.
- **Expression:** In placeholder mode, the avatar shows the current segment's emotion and plays its gesture.
- **MCQ overlay:** Animated pop-up over the video with four options; disables the greyed-out option after a HINT; highlights the correct option on REVEAL.
- **Transitions:** Handover clip → Framer Motion transition (zoom/wipe) → background cross-fade → next avatar entry clip. Music cross-fades with Howler.js; sound effects on transitions and answers.
- **Navigation:** Modules unlock in order on first viewing; any completed module can be replayed.
- **Resume:** Reloading the page returns to the current step.
- **Accessibility:** Keyboard-operable controls and options; captions; readable contrast; respect reduced-motion preferences.
- **Performance:** Preload the next step's media while the current one plays.

### Admin and HR routes

| Route | Screen |
|---|---|
| `/admin/dashboard` | Summary cards and charts |
| `/admin/employees` | Employee table with filters and Excel export |
| `/admin/quiz-analytics` | Accuracy per module; most-missed questions |
| `/admin/acknowledgments` | Acknowledgment records with Excel export |
| `/admin/feedback` | Ratings and comments |
| `/admin/content` | Modules, steps (segment editor with emotion and gesture), questions, avatars, business units; review workflow |
| `/admin/ai-assistant` | Generate draft scripts and questions |
| `/admin/media` | Uploads and avatar job status |
| `/admin/users` | Users, roles and CSV import |

PDF export of dashboard pages uses a print stylesheet (`window.print()`); no PDF library.

---

## 13. Milestones

| # | Milestone | Done when | Status |
|---|---|---|---|
| M0 | **Setup:** npm workspaces, Vite + NestJS apps, shared package, ESLint/Prettier, local PostgreSQL, Prisma schema, seed (7 modules, avatars, sample questions, 30 synthetic users) | `npm run dev` starts both apps; seed runs cleanly | Done 25 Nov 2026 |
| M1 | **Auth and roles:** `AuthProvider` interface, dev provider, JWT cookie, role guards | Each role can only reach its own routes; guard tests pass | Done 25 Nov 2026 |
| M2 | **Content management:** CRUD for modules, steps, questions, avatars, business units; review workflow; audit log | HR can build a module end to end; Policies/Compliance need Legal approval to publish | Done 25 Nov 2026 |
| M3 | **Player:** step sequencer, video playback with placeholder media, avatar emotions and gestures, progress bar, controls, captions, resume, transitions, music | A learner can play all 7 modules with placeholder media and resume after reload | Done 25 Nov 2026 |
| M4 | **Quiz engine:** question selection, server-side evaluation, overlay UI, praise/hint/reveal clips | All quiz tests in Section 8 pass; flow works in the player | Done 25 Nov 2026 |
| M5 | **Acknowledgments, completion and feedback** | Policies and Compliance cannot be completed without acknowledgment; completion screen shows correct score | Done 25 Nov 2026 |
| M6 | **Avatar pipeline:** `StorageService`, pg-boss worker, Azure avatar batch synthesis with emotion and gesture mapping, captions, placeholder mode | Publishing a script produces a playable avatar video with captions; failures show in job status | Replaced by built-in presenters and browser speech (see change note) |
| M7 | **AI authoring assistant:** script and question generation with schema validation | Generated questions save as DRAFT and pass Zod validation; invalid AI output is rejected with a clear error | Done 25 Nov 2026 |
| M8 | **HR dashboard:** summary, employees, quiz analytics, acknowledgments, feedback, Excel export | Numbers match seed data; filters and exports work | Done 25 Nov 2026 |
| M9 | **Hardening:** test coverage on core logic, accessibility pass, performance (media preloading), security review | No secrets in repository; all tests pass; keyboard-only run-through of the player works | Done 25 Nov 2026 |

---

## 14. Phase 2 (do not build yet)

- **Ask the Avatar:** Free-text questions answered from approved content. Retrieval with pgvector embeddings (Azure OpenAI embeddings model), answer by Azure OpenAI, spoken by a real-time Azure avatar over WebRTC.
- Single sign-on
- Completion certificate
- Email/Teams invites and reminders
- HRMS/LMS integration
- Multi-language content

---

## 15. Environment Variables (`.env.example`)

```
# Database (local PostgreSQL, no Docker). Must use the postgresql:// scheme.
DATABASE_URL=postgresql://user:password@127.0.0.1:5432/LevelShift_Induction

# Auth (dev email-only login; SSO removed for now)
AUTH_PROVIDER=dev
JWT_SECRET=change-me

# Storage
STORAGE_DRIVER=local
STORAGE_LOCAL_PATH=./storage

# Azure OpenAI (server-side only - do NOT prefix with VITE_)
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT=
AZURE_OPENAI_API_VERSION=

# Azure AI Speech
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=
AVATAR_MODE=placeholder   # placeholder | azure

# App
APP_URL=http://localhost:5173
API_URL=http://localhost:3000
API_PORT=3000
```

---

## 16. Open Decisions

| # | Decision | Owner |
|---|---|---|
| 1 | Production hosting | TBD |
| 2 | Production file storage for videos | TBD |
| 3 | Production authentication (SSO removed for now) | TBD |
| 4 | Prebuilt vs. custom avatars (founders' consent) | TBD |
| 5 | Final duration per module | TBD |
| 6 | Whether Compliance needs a minimum score | TBD |
| 7 | Official business unit list for Module 6 (seed uses a draft list) | TBD |
| 8 | Founders' sign-off on the first-person scripts spoken by their avatars | TBD |
| 9 | Official mission, vision, values and founding story (source notes disagree) | TBD |
