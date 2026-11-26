# AI-Powered Interactive Employee Induction Platform

The build spec is in [docs/SPEC.md](docs/SPEC.md). Read it, including the change notes at the top, before changing anything, and follow its "Instructions for Claude" (Section 0).

## Current state

- All milestones are built: auth and roles, content management with review workflow, player, quiz engine, acknowledgments, completion and feedback, AI assistant, HR dashboard.
- Three staff panels: **Admin** (`/admin`: presenters, content and follow-up questions, review, HR and staff accounts, plus all reporting), **HR** (`/hr`: candidate invitations and performance reporting only), **Legal** (`/admin/review`).
- No Docker, no SSO, no Azure Speech or Azure avatar video. Presenters are original 2D cartoon characters drawn in SVG and animated in the browser by the engine in `apps/web/src/character` (skeletal rig with IK, separate fingers, clothing parts, keyframe and procedural clips, expressions, viseme lip-sync); speech uses the browser's built-in voices. Admins can have the AI choose each segment's emotion and gesture ("Direct with AI").

## Commands (run from the repo root)

| Command | What it does |
|---|---|
| `npm run dev` | Builds the shared package, then starts API (`:3000`), staff web app (`:5173`) and candidate web app (`:5174`) in watch mode |
| `npm run build` | Production build of shared, API and web |
| `npm run typecheck` | Type-checks shared, API and web |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm test` | Unit tests in every workspace (Vitest) |
| `npm run db:migrate` | Applies Prisma migrations (creates one after a schema change) |
| `npm run db:seed` | Wipes and re-seeds content and synthetic users |
| `npm run db:reset` | Drops the database, re-applies migrations (destructive) |

Staff sign in at `http://localhost:5173/login`. Candidates use a separate web app, `http://localhost:5174` (same code, built with `vite --mode candidate`, see `apps/web/src/lib/portal.ts`): sign-in at `/candidate`, and HR's invitation links (`http://localhost:5174/invite/:token`) land on a candidate welcome page with a "Start my induction" button. In development the login page lists demo accounts that sign in with one click: `admin@example.com` (Admin), `hr.admin@example.com` (HR), `legal.reviewer@example.com` (Legal) and three sample candidates. Everyone else signs in with email and password, or a candidate opens their invitation link.

## Where things are

- `apps/api/src`: `auth` (JWT cookie, guards, passwords, invite links), `hr` (candidate invitations), `learner` (induction, progress, quiz, acknowledgments), `admin` (content, review workflow, users, CSV import, AI assistant), `dashboard`.
- `apps/web/src`: `hr` (candidates screen), `avatar` (the SVG presenter and its poses), `speech` (narrator, sound effects, presenter hook), `pages` (login, welcome, player, completion), `admin` (HR and Legal screens).
- `packages/shared/src`: `base.ts` (enums, script segments) and `contracts.ts` (request schemas and response types).

## Things to know

- **Database:** the machine's own PostgreSQL 18 service on `127.0.0.1:5432`, database `LevelShift_Induction`. `DATABASE_URL` lives in the root `.env` and must use the `postgresql://` scheme.
- **Migrations:** `prisma migrate dev` refuses data-loss prompts when run non-interactively. Generate the SQL with `prisma migrate diff --from-schema-datasource ... --script` into a new migration folder, then run `prisma migrate deploy`.
- **Secrets:** never read out, print or commit values from `.env`. Keep `.env.example` in step with any new variable. Azure keys are server-side only. The API reads `AZURE_OPENAI_*` and falls back to the older `VITE_AZURE_OPENAI_*` names; the web app must never read either.
- **Shared package:** the API consumes its compiled output (`dist`); the web app aliases straight to its source.
- **Enums live in two places:** `packages/shared/src/base.ts` and `apps/api/prisma/schema.prisma`. Change both together.
- **Avatar expression:** scripts are lists of segments, each `{ text, emotion, gesture }` (spec Section 7.1). `Step.script` is derived from the segments; do not edit it on its own. A new emotion needs an expression in `character/anim/clips/expressions.ts` (`EMOTION_TO_EXPRESSION`) and a voice entry in `speech/narrator.ts`; a new gesture needs a clip in `character/anim/clips/gestures.ts` (`GESTURE_TO_CLIP`).
- **Character engine (`apps/web/src/character`):** `pose.ts` (the flat `Pose`, the only contract between animation and drawing), `rig/` (IK and skeleton solver), `anim/` (clips, mixer, clip libraries), `controller.ts` (`play`, `stop`, `setExpression`, `lookAt`, `blink`, `setSpeaking`, `speakWord`), `useCharacter.ts` (rAF loop), `render/` (Head, Body, Hand, Character; pure SVG from a pose), `visemes.ts` (lip-sync). `avatar/Avatar.tsx` adapts the app's props (emotion, gesture cue, `action` cue, speaking, word) to the controller; `usePresenter().act(...)` cues clips such as `walkIn` or `jump` + `cheer`. Appearance: `figure`, `build`, `hairStyle`, `top`, `bottom` and colours (`packages/shared/src/contracts.ts`).
- **Roles:** `ADMIN` designs the induction and creates HR accounts; `HR_ADMIN` (shown as "HR") invites candidates and reads reports but cannot edit content; `LEGAL_REVIEWER` approves policy modules; `LEARNER` is shown as "Candidate".
- **Credentials:** the system generates default passwords and invite links and returns them once (`CredentialsDto`); sign-in uses a scrypt hash of the password and a SHA-256 hash of the invite token. Exception (owner-approved): the default password is also kept AES-256-GCM encrypted in `User.defaultPasswordEnc`, and a candidate's invite token in `User.inviteTokenEnc` (`auth/secret-box.ts`, key from `CREDENTIALS_KEY` or derived from `JWT_SECRET`), so admins see staff passwords on Employee Accounts and HR sees a candidate's password and link behind the eye button on Candidates (`GET /hr/candidates/:id/credentials`, audited without values). The password copy is wiped when the user sets their own; the link copy is shown only while valid and wiped when the candidate is blocked. Never log or audit the readable values. A default password must be changed at first sign-in: the session carries a flag and the guard blocks every route not marked `@AllowDefaultPassword()`. Invite links work for candidates only, for 14 days, until HR issues a new one or blocks the candidate.
- **Two web apps, two sessions:** browsers share cookies across ports, so candidates get `induction_candidate_session` and staff `induction_session`. Every web request sends `x-portal: staff|candidate`; the guard reads that app's cookie and refuses a user of the other kind. Invitation and candidate sign-in links use `CANDIDATE_APP_URL`. Sessions are also per browser tab: each tab sends its own id in `x-session` and gets its own cookie (`<name>_<id>`); a new tab copies the latest tab's session through `POST /auth/fork` (`apps/web/src/lib/tabSession.ts`), so signing in or out in one tab never changes another.
- **Dev sign-in:** `POST /auth/dev-login` (the demo buttons) exists only when `NODE_ENV` is not production and `AUTH_PROVIDER=dev`.
- **Quiz integrity:** answers are checked on the server; the correct option is never sent before a question is settled.
- **Audit log (`apps/api/src/audit`, page `admin/AuditPage.tsx` at `/admin/audit` and `/hr/audit`):** follows Super Admin > Admin > HR. The Super Admin (or every Admin when `SUPER_ADMIN_EMAIL` is unset) sees everything; an Admin sees their own entries plus HR, Legal and candidates; HR sees their own plus candidates; Legal and candidates have none. A database trigger copies the actor's role, name and email onto each entry at insert (`actorRole`, `actorName`, `actorEmail`), so entries keep their place after the account changes or is deleted. Sign-in, failed sign-in (known active accounts only) and sign-out are audited in `auth.controller.ts`. A new audited action needs a category in `audit.logic.ts` (`categoryOf`/`categoryWhere`) and a sentence in `summarize`. Never put passwords, tokens or links in `details`.
- **Review workflow:** any edit to a module, its steps or a question returns it to draft. An admin submits, approves and publishes; modules marked as policy or compliance need a Legal reviewer to approve.
- **Player testing:** in dev only, `/induction?speed=20` plays silently at 20x so a full run-through takes about a minute.
- **Induction content:** written in `apps/api/src/content/seed-content.ts` from the notes in `Data/`; the seed and the Content page's "Reset to default" button both build it through `default-content.ts`. Users are synthetic (`@example.com`); never seed real employee data.
- **Windows:** long multi-file shell heredocs have failed to parse here. Write files with the file tools instead.
