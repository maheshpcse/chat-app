# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project overview

- **Name:** `chat-app` (Angular SPA frontend)
- **Repo:** https://github.com/maheshpcse/chat-app
- **Purpose:** Real-time chat UI — auth, 1:1/group messaging, contacts, notifications, file upload, scheduled messages, admin area
- **Backend (separate repo):** https://github.com/maheshpcse/chat-system  
  Do not assume backend code lives here. API contract is HTTP REST under `/api/v1` plus Socket.IO on the same host.

## Stack and versions (pin these)

| Tool / lib | Version / note |
|------------|----------------|
| Angular | ~10.1.3 |
| Angular CLI | ~10.1.3 |
| TypeScript | ~3.9.7 |
| RxJS | ~6.5.5 |
| Node.js | 18.x (CI uses 18; needs OpenSSL legacy provider) |
| Angular Material / CDK | ~10.2.7 |
| Bootstrap | 5.1.3 (**CSS only** — grid/utilities; no ng-bootstrap JS) |
| socket.io-client | 2.4.0 (+ `@types/socket.io-client` 1.4.36) |
| ngx-toastr | ~13.2.1 |
| ngx-spinner | ~10.0.1 |
| jwt-decode | 3.1.2 |
| Lint | TSLint + codelyzer (`ng lint`) — not ESLint |
| Unit tests | Jasmine + Karma |
| Style | SCSS; component prefix `app` |

Do **not** upgrade Angular major/minor or swap TSLint→ESLint unless the task explicitly asks. This app is intentionally on Angular 10.

## OpenSSL / Node

Angular 10 webpack fails on modern OpenSSL without legacy provider.

- **CI / Linux / macOS:** `export NODE_OPTIONS=--openssl-legacy-provider` (workflow already sets this)
- **`package.json` scripts** use Windows `set NODE_OPTIONS=...` syntax — on Unix shells prefer:

```bash
export NODE_OPTIONS=--openssl-legacy-provider
npx ng serve --port 5200
# or
npx ng build --prod
```

## Common commands

```bash
# Install (prefer lockfile when present)
npm ci          # requires package-lock.json
npm install     # if lockfile missing

# Dev server (package.json targets port 5200; angular.json default serve is 4200)
npm start
# Unix equivalent:
NODE_OPTIONS=--openssl-legacy-provider npx ng serve --port 5200

# Lint (TSLint)
npm run lint

# Unit tests (local interactive Chrome)
npm test
# CI / headless single-run:
npx ng test --watch=false --browsers=ChromeHeadlessCI --code-coverage=false

# Production build → dist/chat-app
npm run build:prod
# GitHub Pages (base-href + deploy-url required — empty publicPath blanks lazy routes):
npm run build:pages
# or:
npx ng build --prod --base-href=/chat-app/ --deploy-url=/chat-app/

# Docker (optional; primary host is GitHub Pages)
docker build --build-arg BASE_HREF=/ -t chat-app-fe .
```

### Validation expectation for agents

After non-trivial code changes, run at least:

1. `npm run lint`
2. Headless tests (`ChromeHeadlessCI`, `--watch=false`)
3. Production build (`ng build --prod`) when routing, `angular.json`, environments, or shared modules change

## Repository layout

```
src/
  app/
    core/           # Singleton: services, guards, interceptors, models, constants, utilities
    shared/         # Reusable UI: components, pipes, directives, validators, animations
    layout/         # Shells: app-layout, chat-layout, header, sidebar, menus
    auth/           # Login, register, forgot-password (lazy)
    chat/           # Chat window, bubbles, input, typing, schedule dialog (lazy under ChatLayout)
    conversation/   # Conversation list / new conversation (lazy)
    contacts/       # Contacts (lazy)
    group/          # Groups create/list/manage (lazy)
    dashboard/      # User dashboard (lazy)
    settings/       # User settings (lazy)
    notifications/  # Notifications page (lazy)
    notification/   # Toast/notification module used from AppModule
    upload/         # File upload feature
    admin/          # Isolated admin app area (own auth tokens)
    landing/        # Public landing
    errors/         # 401/403/404/500/offline pages
  environments/     # environment.ts (dev) / environment.prod.ts (prod fileReplacements)
  assets/
  styles.scss
.github/workflows/angular.yml   # Lint → test → build → GitHub Pages deploy
Dockerfile + nginx.conf         # Optional container deploy
DEPLOYMENT.md                   # Deploy/CI details
ANGULAR-FRONTEND-GUIDE.md / README.md  # Architecture & concept map (may lag code slightly)
```

Feature modules are **lazy-loaded** from `app-routing.module.ts`. Do **not** import feature modules into `AppModule`.

## Architecture rules

### Module boundaries

| Module | Import where | Contains |
|--------|--------------|----------|
| `CoreModule` | **Only** `AppModule` | HTTP interceptors; guards re-export via `providedIn: 'root'` services |
| `SharedModule` | Feature modules that need shared UI | Declare/export shared components, pipes, directives |
| Feature modules | Lazy via `loadChildren` | Screens for one domain |

`CoreModule` throws if imported twice (`@Optional() @SkipSelf()`). Keep that guard.

### Services

- Prefer `@Injectable({ providedIn: 'root' })` for app-wide services under `core/services/`.
- HTTP paths: use `API_ENDPOINTS` from `core/constants/api.constants.ts` + `environment.apiBaseUrl`.
- Socket events: use `SOCKET_EVENTS` from `core/constants/socket-events.constants.ts` + `SocketService`.
- Models/interfaces live in `core/models/` (`IUser`, `IMessage`, etc.). Prefer interfaces over inline types.

### HTTP interceptors (order in CoreModule)

1. `AdminJwtInterceptor` — admin API JWT (`admin_*` token keys)
2. `JwtInterceptor` — user JWT + refresh on 401; **skips** `/admin` paths
3. `ErrorInterceptor` — centralized error → toasts / navigation
4. `LoaderInterceptor` — global loader via `LoaderService`

Do not bypass interceptors with ad-hoc `HttpClient` hacks unless necessary; if you add interceptors, register them in `CoreModule` and document order.

### Auth and tokens

Environment keys (`src/environments/environment*.ts`):

- User: `tokenKey` / `refreshTokenKey` → `chat_access_token` / `chat_refresh_token`
- Admin: `adminTokenKey` / `adminRefreshTokenKey` → separate storage namespace
- `apiBaseUrl`, `socketUrl`, `uploadMaxSize`

Angular does **not** load `.env` at runtime. `.env.example` is documentation only. Change runtime config in `environment.ts` / `environment.prod.ts`.

### Routing

- Public: `''` landing, `auth/*`, `errors/*`, `admin/*`
- Authenticated app shell (`AppLayoutComponent` + `AuthGuard`): `dashboard`, `conversations`, `contacts`, `groups`, `settings`, `notifications`
- Chat shell (`ChatLayoutComponent` + `AuthGuard`): `chat`
- Wildcard → `errors/404`
- Preload: `PreloadAllModules`

Guards: `AuthGuard`, `RoleGuard`, `AdminGuard`, `AdminGuestGuard` under `core/guards/`.

### Real-time

- `SocketService` connects with JWT (`auth.token` + `query.token`), websocket transport, reconnect.
- Expose streams as `public foo$` Observables from Subjects/BehaviorSubjects.
- Components must unsubscribe (`ngOnDestroy` / `takeUntil`) — no leaked socket subscriptions.

### UI stack conventions

- **Material** for interactive controls (forms, dialogs, lists, toolbar, icons, menus).
- **Bootstrap 5 CSS** only for layout utilities (grid, spacing, display, text).
- Global styles: Bootstrap CSS, Material indigo-pink theme, ngx-toastr CSS, `src/styles.scss` (see `angular.json`).
- Toasts: ngx-toastr via notification services — prefer existing patterns over `alert()`.
- Loader: `ngx-spinner` / `LoaderService` + interceptor.

### Component / style conventions

- Selector prefix: `app-`
- Files: `name.component.ts|html|scss` (+ `.spec.ts` when adding tests)
- SCSS per component; respect budget (~12kb warn / 16kb error per component style in prod)
- Indent: 2 spaces (tslint)
- Max line length: 140
- Prefer reactive forms for non-trivial inputs
- Unsubscribe patterns and `OnDestroy` for long-lived streams

## Environment and deploy

| Target | Notes |
|--------|--------|
| Local API default | `http://localhost:3000/api/v1`, socket `http://localhost:3000` |
| Prod placeholders | `environment.prod.ts` — set real API/socket before production use |
| GitHub Pages | `https://maheshpcse.github.io/chat-app/` — build with `--base-href=/chat-app/` |
| CI deploy | Push to `main` only (PRs build but do not deploy) |
| SPA fallback on Pages | CI copies `index.html` → `404.html` and adds `.nojekyll` |
| Docker | Multi-stage Node 18 build + nginx:1.27; `BASE_HREF` build-arg |

See `DEPLOYMENT.md` for full CI/CD narrative.

## CI workflow (agents should match)

File: `.github/workflows/angular.yml`

1. Node 18 + `NODE_OPTIONS=--openssl-legacy-provider`
2. `npm ci`
3. `npm run lint`
4. `npx ng test --watch=false --browsers=ChromeHeadlessCI`
5. `npx ng build --prod --base-href=/chat-app/`
6. Deploy artifact to GitHub Pages (main only)

**Lockfile note:** Dockerfile and CI expect `package-lock.json` + `npm ci`. If lockfile is absent, restore/generate it before relying on CI or Docker; do not delete the lockfile casually.

## What agents should / should not do

**Do**

- Make minimal, surgical changes scoped to the task
- Reuse `core` services, constants, models, shared components
- Keep admin auth isolated from user auth (separate services, interceptors, token keys)
- Follow existing lazy-loading and layout shells when adding routes
- Add or update unit tests near changed logic when practical (`*.spec.ts`, Karma/Jasmine)
- Update `environment.prod.ts` carefully; never commit real secrets
- Keep commits/PR text in normal professional English (repo may use terse chat tone elsewhere)

**Do not**

- Import `CoreModule` outside `AppModule`
- Eager-load feature modules into `AppModule` without a strong reason
- Introduce ng-bootstrap or Bootstrap JS bundles
- Bump Angular/TypeScript/RxJS majors as drive-by upgrades
- Commit `.env`, tokens, `node_modules/`, or `dist/`
- Point production builds at `localhost`
- Change GitHub Pages `base-href` without updating workflow + docs together
- Assume backend routes without checking `api.constants.ts` / backend repo

## Quick domain map

| Domain | Primary UI | Service(s) |
|--------|------------|------------|
| Auth | `auth/` | `AuthService` |
| Chat / messages | `chat/` | `ChatService`, `MessageService`, `SocketService`, `ScheduledMessageService` |
| Conversations | `conversation/` | `ConversationService` |
| Contacts | `contacts/` | `ContactService` |
| Groups | `group/` | `GroupService` |
| Users / profile | settings / shared | `UserService` |
| Uploads | `upload/` | `UploadService` |
| Notifications | `notifications/`, `notification/` | `NotificationService` |
| Presence | layout / chat | `PresenceService`, `SocketService` |
| Admin | `admin/` | `AdminAuthService`, `AdminApiService` |

## Docs map

| File | Use when |
|------|----------|
| `AGENTS.md` (this file) | Agent onboarding and guardrails |
| `README.md` / `ANGULAR-FRONTEND-GUIDE.md` | Intended module structure and Angular concept checklist (verify against `src/` — guide can trail real folders like `admin/`, `contacts/`) |
| `DEPLOYMENT.md` | CI, Pages, Docker, env notes |
| `.github/copilot-instructions.md` | Optional response-style preference for Copilot chat |
| `.env.example` | Document public URL / base-href knobs only |

## PR checklist (agents)

- [ ] Change matches module boundaries and lazy routes
- [ ] API/socket usage goes through constants + services
- [ ] No secrets in diff
- [ ] Lint clean
- [ ] Tests pass headless (or justify gap for pure docs)
- [ ] Prod build succeeds when UI/config touched
- [ ] Pages `base-href` / env URLs still correct if deploy-related
