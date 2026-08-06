# Chat App (Angular) — Deployment & CI/CD

**Repository:** https://github.com/maheshpcse/chat-app  
**Stack:** Angular 10 · GitHub Actions · GitHub Pages · optional Docker/Nginx  
**Backend repo (separate):** https://github.com/maheshpcse/chat-system  

> This document covers **frontend only**. Backend deploy lives in `chat-system` → `DEPLOYMENT.md`.

---

## 1. Project analysis (what we found)

| Item | Value |
|------|--------|
| App name | `chat-app` (`package.json`) |
| Angular | ~10.1.3 |
| Build output | `dist/chat-app` (`angular.json` → `outputPath`) |
| Prod env file | `src/environments/environment.prod.ts` |
| Local API | `http://localhost:3000/api/v1` |
| Scripts | `npm run lint`, `npm test`, `npm run build` / `build:prod` |
| Node note | Needs `NODE_OPTIONS=--openssl-legacy-provider` on Node 17+ |
| Existing workflows | None (only `.github/copilot-instructions.md`) |

Frontend and backend are **two GitHub repos**. CI/CD files are split accordingly.

---

## 2. Files added & where they go

All paths relative to **Chat App** repo root (`chat-app`):

| File | Purpose |
|------|---------|
| [`.github/workflows/angular.yml`](.github/workflows/angular.yml) | CI: cache → install → lint → test → prod build → **maintenance deploy** → app deploy |
| [`maintenance/index.html`](maintenance/index.html) | Premium light-theme maintenance page (app palette; zero framework weight) |
| [`scripts/deploy-with-maintenance.ps1`](scripts/deploy-with-maintenance.ps1) | Local/VPS: maintenance → copy dist → live (PowerShell) |
| [`scripts/deploy-with-maintenance.sh`](scripts/deploy-with-maintenance.sh) | Local/VPS: same flow (bash) |
| [`scripts/docker-entrypoint.sh`](scripts/docker-entrypoint.sh) | Nginx image: `MAINTENANCE_MODE=1` serves maintenance page |
| [`Dockerfile`](Dockerfile) | Multi-stage Node build + Nginx runtime (VPS/Docker alternative to Pages) |
| [`nginx.conf`](nginx.conf) | SPA routing, cache headers, `/health`, no-store on `index.html` |
| [`.dockerignore`](.dockerignore) | Keeps image small / secrets out of build context |
| [`.env.example`](.env.example) | Documents public URLs / base-href (Angular uses `environment.*.ts`, not dotenv) |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | This guide |
| [`src/app/app.component.spec.ts`](src/app/app.component.spec.ts) | Minimal unit test so `ng test` is meaningful in CI |

**Do not commit:** `.env`, secrets, `node_modules/`, `dist/`.

---

## 3. Frontend workflow explained (every step)

Workflow file: `.github/workflows/angular.yml`

### Triggers
- **push** to `main` → full pipeline + deploy  
- **pull_request** to `main` → build/test only (no deploy)  
- **workflow_dispatch** → manual run from Actions tab  

### Job `build`
1. **Checkout** — clone commit SHA that triggered the run.  
2. **Setup Node 18** — matches project guidance.  
3. **Cache `~/.npm`** — key = OS + `package-lock.json` hash (fast reinstalls).  
4. **`npm ci`** — clean install from lockfile (reproducible).  
5. **`npm run lint`** — TSLint via Angular CLI.  
6. **`ng test --watch=false --browsers=ChromeHeadless`** — unit tests, single run.  
7. **`ng build --prod --base-href=/chat-app/`** — AOT production bundle for project Pages URL.  
8. **Copy `index.html` → `404.html`** — SPA deep-link fallback on GitHub Pages.  
9. **Upload artifact** `angular-dist` — hand-off to deploy job.

### Job `deploy-maintenance` (push to `main` only)
1. Checkout repo (needs `maintenance/index.html`).  
2. Stage a **tiny static site**: copy maintenance HTML → `index.html` + `404.html`, add `.nojekyll` + `.maintenance` marker.  
3. **configure-pages / upload-pages-artifact / deploy-pages** — visitors now see the premium hold screen.  
4. **Sleep ~20s** so Pages/CDN can pick up maintenance before the app bundle overwrites it.

### Job `deploy` (push to `main` only)
1. Download Angular `angular-dist` artifact.  
2. **configure-pages / upload-pages-artifact / deploy-pages** — production SPA replaces maintenance.  
3. Maintenance page auto-reload script detects `app-root` and refreshes users into the new app.

### Why maintenance during deploy?
| Question | Answer |
|----------|--------|
| Possible on GitHub Pages? | **Yes** — two sequential `deploy-pages` jobs (maintenance first, app second). |
| What users see mid-deploy? | Light premium page: arctic/mint/nocturnal/forsytha tokens, “We’ll be right back”. |
| After cutover? | Page probes `index.html`; when Angular shell is live, full reload. |
| Docker/VPS? | `MAINTENANCE_MODE=1` or `scripts/deploy-with-maintenance.*` |

### Caching strategy (frontend)
- npm download cache via `actions/cache` on `~/.npm`.  
- Browser: hashed JS/CSS → long-cache (when using `nginx.conf` Docker path).  
- GitHub Actions concurrency group cancels superseded runs on same branch.

### Production optimizations
- `angular.json` production: `optimization`, `buildOptimizer`, `outputHashing: all`, `sourceMap: false`, `vendorChunk: false`.  
- `NODE_OPTIONS=--openssl-legacy-provider` for Angular 10 on Node 18.  
- Artifact retention 7 days (rollback source — see below).

---

## 4. GitHub Pages setup (one-time)

1. Repo **Settings → Pages**.  
2. **Source:** GitHub Actions (not “Deploy from branch”).  
3. Ensure Actions permissions: **Settings → Actions → General → Workflow permissions → Read and write** (deploy-pages needs `pages: write`).  
4. After first green deploy, site URL:  
   `https://maheshpcse.github.io/chat-app/`  
5. Update `src/environments/environment.prod.ts`:

```ts
apiBaseUrl: 'https://YOUR-RENDER-HOST/api/v1',
socketUrl: 'https://YOUR-RENDER-HOST',
```

6. Backend must allow CORS / Socket origin:  
   `https://maheshpcse.github.io`

If you use a **custom domain** at repo root, set `ANGULAR_BASE_HREF: /` in the workflow `env:` block and rebuild.

---

## 5. GitHub Secrets (frontend)

GitHub Pages deploy via `actions/deploy-pages` needs **no classic secrets** when using the default `GITHUB_TOKEN` + `permissions: pages: write`.

Optional:

| Name | When |
|------|------|
| None required | Default Pages deploy |
| Custom domain DNS only | Repo Pages settings |

Backend secrets belong in **chat-system**, not this repo.

---

## 6. Commit & push deployment files

In VS Code terminal (Chat App root):

```bash
git status
git add .github/workflows/angular.yml Dockerfile nginx.conf .dockerignore .env.example DEPLOYMENT.md src/app/app.component.spec.ts
git commit -m "ci: add Angular GitHub Actions, Pages deploy, Docker/Nginx"
git push origin main
```

Do **not** commit `node_modules` or `dist`.

---

## 7. How GitHub Actions starts after every push

1. `git push origin main` sends commits to GitHub.  
2. GitHub sees `on.push.branches: [main]` in `angular.yml`.  
3. Actions queues a workflow run on a hosted runner.  
4. You do **not** start the runner manually.  

Same for PRs targeting `main` (build only).

---

## 8. Monitor deployment logs

1. Open https://github.com/maheshpcse/chat-app/actions  
2. Click the latest **Angular CI/CD** run.  
3. Expand jobs **Lint, Test & Build** and **Deploy to GitHub Pages**.  
4. Each step shows stdout/stderr (npm, ng build, deploy).  
5. Job summary appears at bottom when `notify` finishes.  
6. Pages URL also appears under the `github-pages` environment on the run.

---

## 9. Troubleshoot failed deployments

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `npm ci` fails | Lockfile out of sync | Run `npm install` locally, commit `package-lock.json` |
| Lint fails | TSLint errors | Fix reported files; run `npm run lint` locally |
| Tests fail | Spec/TestBed errors | Run `npx ng test --watch=false --browsers=ChromeHeadless` |
| Build OpenSSL error | Missing legacy provider | Workflow already sets `NODE_OPTIONS`; ensure not overridden |
| Blank page on Pages | Wrong `base-href` | Must be `/chat-app/` for project pages |
| 404 on refresh | Missing `404.html` | Workflow copies `index.html` → `404.html` |
| Deploy job skipped | Event is PR or not `main` | Merge to `main` or run `workflow_dispatch` |
| Deploy permission error | Pages not Actions-based / token perms | Enable Pages → GitHub Actions; workflow write perms |
| API calls fail from Pages | CORS / wrong `environment.prod.ts` | Point prod env to Render URL; set backend CORS |

Re-run failed job: Actions → run → **Re-run failed jobs**.

---

## 10. Rollback strategy (frontend)

1. **Actions artifact:** download previous successful `angular-dist` (7-day retention) and redeploy manually if needed.  
2. **Git revert:**  
   ```bash
   git revert HEAD
   git push origin main
   ```  
   Triggers a new green pipeline with last known good tree.  
3. **Pages:** each deploy replaces site contents; previous commit rebuild is the rollback.  
4. **Docker tag (if used):** keep previous image tag; `docker pull` + recreate container.

---

## 11. Optional Docker frontend (not Pages)

```bash
docker build --build-arg BASE_HREF=/ -t chat-app-fe .
docker run --rm -p 8080:80 chat-app-fe
# http://localhost:8080  health: http://localhost:8080/health

# Temporary maintenance without rebuild:
docker run --rm -p 8080:80 -e MAINTENANCE_MODE=1 chat-app-fe
```

### Local / VPS file deploy with maintenance window

```powershell
# Dry-run
.\scripts\deploy-with-maintenance.ps1

# Apply to a web root (after you already have dist/chat-app)
.\scripts\deploy-with-maintenance.ps1 -TargetPath 'C:\inetpub\wwwroot\chat-app'

# Optional: script may run build if you pass -Build (agent does not run ng build by default)
```

```bash
chmod +x scripts/deploy-with-maintenance.sh scripts/docker-entrypoint.sh
./scripts/deploy-with-maintenance.sh --target /var/www/chat-app
```

### Preview maintenance page locally (no build)

Open `maintenance/index.html` in a browser, or:

```bash
npx --yes serve maintenance -p 4173
# http://localhost:4173
```

---

## 12. End-to-end CI/CD (VS Code → Live)

```text
VS Code
  └─ edit Angular source
  └─ git add / commit
  └─ git push origin main
        │
        ▼
GitHub (maheshpcse/chat-app)
  └─ webhook → Actions
        │
        ▼
GitHub Actions (angular.yml)
  ├─ cache npm
  ├─ npm ci
  ├─ lint
  ├─ unit tests (ChromeHeadless)
  ├─ ng build --prod --base-href=/chat-app/
  ├─ 404.html + .nojekyll
  ├─ deploy-pages #1 → maintenance/index.html  (browsers see hold screen)
  ├─ short hold (~20s)
  └─ deploy-pages #2 → dist/chat-app           (live SPA)
        │
        ▼
GitHub Pages
  └─ https://maheshpcse.github.io/chat-app/
        │
        ├─ mid-deploy: premium maintenance page
        ├─ after cutover: SPA (auto-refresh from maintenance)
        └─ API/WebSocket → Render backend (chat-system)
```

**Live checklist**
1. Backend healthy: `GET https://<render>/api/v1/health`  
2. `environment.prod.ts` API URLs match backend  
3. Backend `CORS_ORIGIN` + `SOCKET_CORS_ORIGIN` include Pages origin  
4. Frontend Actions run green  
5. Hard-refresh browser on Pages URL  

---

## 13. Security best practices (frontend)

- Never put JWT secrets or DB passwords in Angular code (client is public).  
- Only public API base URLs in `environment.prod.ts`.  
- Prefer HTTPS API only in production.  
- Keep dependencies updated; review Actions third-party action versions (`@v4`).  
- Restrict who can push to `main` (branch protection + required status checks).  
- Enable Dependabot for npm + GitHub Actions.

---

## 14. Local verify (optional — do not auto-serve in agent)

```bash
set NODE_OPTIONS=--openssl-legacy-provider
npm ci
npm run lint
npx ng test --watch=false --browsers=ChromeHeadless
npm run build:prod
```

Start dev server only when you choose: `npm start` → http://localhost:5200
