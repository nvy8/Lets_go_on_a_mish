# Authentication & users

How identity, sessions, and access control work in Sleuth — and where the actual user records live.

> **Scope:** this document covers the auth *model* (schemas, cookies, tokens, env vars) as derived from the code in [lib/auth.ts](../lib/auth.ts), [lib/db.ts](../lib/db.ts), and the routes under [app/api/teacher/](../app/api/teacher/) and [app/api/m/](../app/api/m/). The *list of registered teachers* lives only in MongoDB Atlas — see [§ Live user data](#live-user-data) for how to read it safely.

---

## TL;DR

| Role | How they identify | Stored where | Cookie | TTL |
|---|---|---|---|---|
| **Teacher** | email + password (bcrypt) | `TEMP_HACKATHON.teachers` | `sleuth_teacher` (HttpOnly JWT) | 7 days |
| **Kid (student)** | display name only — no email, no password, no PII | `TEMP_HACKATHON.sessions` | `sleuth_session` (HttpOnly JWT) | 1 day |

There is no admin role, no SSO, no OAuth, no email verification, no password reset. The hackathon scope is intentionally minimal.

---

## 1. Teacher accounts

### Registration — `POST /api/teacher/register`

Code: [app/api/teacher/register/route.ts](../app/api/teacher/register/route.ts)

- Accepts `{ email, password }` JSON.
- Requires `password.length >= 8` — no other complexity rule.
- Lowercases the email, then `findOne` on `teachers` collection.
- If the email already exists → `409 Email already registered`.
- Otherwise hashes the password with `bcrypt` (cost factor 10) and inserts:
  ```js
  {
    email: string,         // lowercased
    password: string,      // bcrypt hash, never the plaintext
    created_at: Date,
    last_login: Date,
  }
  ```
- Signs a JWT and sets the `sleuth_teacher` cookie. The teacher is logged in immediately on register.

### Login — `POST /api/teacher/login`

Code: [app/api/teacher/login/route.ts](../app/api/teacher/login/route.ts)

- Accepts `{ email, password }`.
- Lowercases email, looks up the teacher, runs `bcrypt.compare`.
- On success: updates `last_login`, signs a JWT, sets the `sleuth_teacher` cookie.
- On failure: `401 Invalid credentials` (same message for unknown email and wrong password — no user enumeration).

### Session helper — `getCurrentTeacher()`

Code: [lib/auth.ts:55](../lib/auth.ts)

- Reads `sleuth_teacher` cookie, verifies the JWT with `JWT_SECRET`.
- Confirms `payload.kind === 'teacher'`.
- Looks up the teacher document by `_id` and returns it (including the bcrypt hash field — callers must not echo this back to the client).

### Logout / me

- `POST /api/teacher/logout` — clears the `sleuth_teacher` cookie.
- `GET /api/teacher/me` — returns the current teacher (used by the dashboard layout to gate access, and by the login page to auto-redirect already-authenticated visitors).

### Auto-redirect from `/teacher/login` when already authenticated

Added 2026-05-24. Before this change, a teacher with a valid `sleuth_teacher` cookie who navigated to `/teacher/login` saw the login form again — confusing, and tempted them to re-enter credentials they didn't need.

Now, on mount, [app/teacher/login/page.tsx](../app/teacher/login/page.tsx) does:

1. `setSessionStatus("checking")` and renders *"Checking your session…"* (so the form never flashes for authenticated users).
2. `fetch("/api/teacher/me", { cache: "no-store" })`.
3. If `200 OK`: `router.replace("/teacher/dashboard")` and switches to *"Taking you to your dashboard…"*. Uses `replace` (not `push`) so the browser back-stack does not bounce the user back to login.
4. If `401`: `setSessionStatus("anon")` and renders the actual login form.
5. Network failure: defaults to `"anon"` so the user can still try to log in manually.

Successful login + register now also use `router.replace("/teacher/dashboard")` for the same back-stack-safety reason.

### Verification matrix (2026-05-24)

API contracts verified end-to-end with a fresh `autotest-<ts>@sleuth.local` account via curl + cookie jar:

| # | Step | Expected | Observed |
|---|---|---|---|
| 1 | `POST /api/teacher/register` (new email + ≥8-char password) | `200`, `Set-Cookie: sleuth_teacher=...; HttpOnly; SameSite=lax; Max-Age=604800` | ✅ |
| 2 | `GET /api/teacher/me` *with* cookie | `200 { teacher: { id, email } }` | ✅ |
| 3 | `GET /api/teacher/me` *without* cookie | `401 { teacher: null }` | ✅ |
| 4 | `POST /api/teacher/logout` *with* cookie | `200 { ok: true }`, cookie cleared | ✅ |
| 5 | `GET /api/teacher/me` after logout | `401` | ✅ |
| 6 | `POST /api/teacher/login` (re-login same creds) | `200 { ok, teacherId }`, cookie re-set | ✅ |
| 7 | `GET /api/teacher/me` after re-login | `200`, same teacher id as register | ✅ |

Client-side auto-redirect — confirm visually in a browser tab (both MCP browsers were unavailable for automated capture):

| # | Step | Expected |
|---|---|---|
| A | Open `/teacher/login` while not logged in | Brief *"Checking your session…"* then the login form |
| B | Submit valid credentials | URL changes to `/teacher/dashboard`, missions list renders, cookie set |
| C | Hit back button after login | Should land on the page *before* login, not on the login form again (because of `router.replace`) |
| D | Open `/teacher/login` while authenticated | Brief *"Checking your session…"* then *"Taking you to your dashboard…"*, URL flips to `/teacher/dashboard` automatically |
| E | Click "Log out" from dashboard | Cookie cleared, back to `/teacher/login`, form renders |
| F | Visit `/teacher/dashboard` without cookie | Dashboard's existing 401 check redirects to `/teacher/login` |

### Known issues (already in [reviews/CODE_REVIEW.md](reviews/CODE_REVIEW.md))

- **#15 — no typecheck on `email`/`password`.** Sending `email: { $regex: '.*' }` causes a noisy 500 because `.toLowerCase()` is called before any validation. Not a NoSQL injection (it errors before hitting Mongo) but ugly.
- **#11 — raw error messages echoed to client.** Internal `MongoError` / `JsonWebTokenError` text reaches the browser on any failure.

---

## 2. Kid (student) sessions

### Join — `POST /api/m/[shareToken]/join`

Code: [app/api/m/[shareToken]/join/route.ts](../app/api/m/%5BshareToken%5D/join/route.ts)

- Teacher creates a Mission, gets a `share_token` (random URL-safe string).
- Kid opens `/m/<shareToken>` → types a `display_name` → POST.
- The route inserts a `sessions` document with:
  ```js
  {
    mission_id: ObjectId,        // FK to missions collection
    display_name: string,        // whatever the kid typed
    session_token: string,       // signed JWT, also set as cookie
    current_stage: 1,
    badges: [],
    notepad: { ... },            // per-stage scratchpad (LLM I/O)
    created_at: Date,
    last_active_at: Date,        // TTL index → auto-delete after 30 days idle
  }
  ```
- Signs a `sleuth_session` JWT (`kind: 'session'`, `sub: sessionId`, `mid: missionId`) and sets it as a cookie.

### No PII collected

- No email, no last name, no age, no school, no IP-derived geo, no third-party trackers.
- The display name is whatever the kid types. The UI explicitly tells them "no last names, no emails, pick something fun" — see [components/stages/Stage1.tsx](../components/stages/Stage1.tsx) and the kid-join page.
- A privacy notice ("Your teacher can see your name and your work on this mission") was added in [changelog/2026-05-23-kid-flow-design-pass.md](changelog/2026-05-23-kid-flow-design-pass.md).

### Session helper — `getCurrentSession()`

Code: [lib/auth.ts:72](../lib/auth.ts)

- Reads `sleuth_session` cookie, verifies JWT, looks up session by `_id`.
- Returns `null` if the cookie is missing, invalid, or the session no longer exists.

### Auto-expiry

- Cookie TTL: **1 day** (kid sessions are short-lived by design).
- Mongo TTL index on `last_active_at`: **30 days** (`lib/db.ts:53`). Idle session documents are cleaned up by Mongo's background TTL monitor.

---

## 3. Cookies

Both cookies use the same options block ([lib/auth.ts:45](../lib/auth.ts)):

| Cookie | TTL | HttpOnly | SameSite | Secure |
|---|---|---|---|---|
| `sleuth_teacher` | 7 days | ✅ | `lax` | ✅ in production, ❌ in dev |
| `sleuth_session` | 1 day | ✅ | `lax` | ✅ in production, ❌ in dev |

- `HttpOnly` blocks `document.cookie` access from JS — XSS can't lift the token.
- `SameSite=lax` blocks cross-site POSTs from carrying the cookie.
- `Secure` is gated on `NODE_ENV === 'production'` so local `http://localhost` still works.

---

## 4. JWT tokens

| Claim | Teacher token | Session token |
|---|---|---|
| `sub` | teacher `_id` | session `_id` |
| `kind` | `'teacher'` | `'session'` |
| `email` | teacher email | — |
| `mid` | — | mission `_id` |
| `exp` | +7 days | +1 day |

Signing & verification both use `process.env.JWT_SECRET`. Helper rejects any secret shorter than 16 characters at runtime ([lib/auth.ts:11](../lib/auth.ts)).

---

## 5. Required environment variables

Defined in `.env.local` at the project root.

| Var | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | ✅ | Connection string to MongoDB Atlas (or any cluster). `TEMP_HACKATHON` DB auto-creates. |
| `JWT_SECRET` | ✅ | Min 16 chars (current value is a 64-char hex string). Rotating this invalidates **every** active teacher and kid session. |
| `CLAUDE_BIN` | — | Optional override of the `claude` CLI binary path. Defaults to `claude` (must be on `PATH`). |

> **`.env.local` is gitignored** (rules `.env*`, `.env.local`, `.env*.local` in [../.gitignore](../.gitignore)) and has never been committed (`git log -- .env.local` is empty). Safe as a local/demo setup. If this ever ships beyond local demo use, still rotate the Mongo password and `JWT_SECRET` — and consider adding a `.env.local.example` template so onboarding doesn't tempt anyone to share the real file.

---

## 6. Authorization model (who can do what)

There is **no role hierarchy** beyond teacher-or-not. Specifically:

- A teacher can only see / mutate their own missions (`teacher_id` filter on every route under `/api/missions[/id]`).
- A kid session is bound to one mission via `mission_id` on the session document. A session cookie from mission A cannot read mission B's data.
- The `current_stage` field gates which stage routes will accept input — but **early-stage transitions don't verify the prerequisite was completed** ([reviews/CODE_REVIEW.md](reviews/CODE_REVIEW.md) #8). A kid could in principle bounce `current_stage` around with crafted POSTs. Today nothing checks for that.
- There is no rate limiting, no CAPTCHA, no account lockout, no audit log.

---

## 7. Live user data

The list of *actual* registered teachers and the count of kid sessions lives in MongoDB Atlas, **not in the repo**. The hackathon uses an Atlas cluster connected via the URI in `.env.local`, database name `TEMP_HACKATHON`, collections `teachers` / `missions` / `sessions`.

To enumerate teachers locally (PowerShell, in the project root):

```powershell
# Read JWT_SECRET / MONGODB_URI from .env.local first.
$env:MONGODB_URI = (Get-Content .env.local | Where-Object {$_ -match '^MONGODB_URI='}) -replace '^MONGODB_URI=', ''

node -e "const {MongoClient}=require('mongodb');(async()=>{const c=new MongoClient(process.env.MONGODB_URI);await c.connect();const t=await c.db('TEMP_HACKATHON').collection('teachers').find({},{projection:{email:1,created_at:1,last_login:1}}).toArray();console.log(JSON.stringify(t,null,2));await c.close();})();"
```

To get the count of missions and active sessions:

```powershell
node -e "const {MongoClient}=require('mongodb');(async()=>{const c=new MongoClient(process.env.MONGODB_URI);await c.connect();const db=c.db('TEMP_HACKATHON');console.log('teachers:',await db.collection('teachers').countDocuments());console.log('missions:',await db.collection('missions').countDocuments());console.log('sessions:',await db.collection('sessions').countDocuments());await c.close();})();"
```

> **Do not paste the live teacher list into this repo.** Even though the bcrypt hashes are not directly reversible, treating registered emails as data-at-rest only (not source-tree material) avoids accidental publication via `git log` or PR diffs.

---

## 8. Hardening checklist (before any non-hackathon use)

Roughly in order of urgency:

1. **Gitignore `.env.local`** and rotate `MONGODB_URI` password + `JWT_SECRET`.
2. **Add input typeguards** on `email` / `password` (CODE_REVIEW #15).
3. **Stop echoing raw error messages** to the client (CODE_REVIEW #11).
4. **Tighten stage transitions** so kids can't replay/rewind (CODE_REVIEW #8).
5. **Sparse / partial index** on `sessions.session_token` so concurrent joins don't collide on `null` (CODE_REVIEW #5).
6. **Add password reset + email verification** for teachers if real users start registering.
7. **Add rate limiting** on `/api/teacher/login` (5/min/IP is fine).
8. **Add an audit log collection** (`teacher_id`, action, timestamp) — even a minimal one — so abuse is detectable later.

---

*Last reviewed: 2026-05-24.*
