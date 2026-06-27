# Angular 10 Chat Application - Frontend Guide

## 1. Angular 10 Compatibility Notes

| Package | Compatible Version |
|---------|-------------------|
| Angular CLI | 10.1.3 |
| Node.js | 18.13.0 |
| NPM | 8.19.3 |
| TypeScript | ~3.9.7 |
| RxJS | ~6.5.5 |
| Angular Material | @angular/material@10.2.7 |
| Angular CDK | @angular/cdk@10.2.7 |
| Bootstrap | 5.1.3 (CSS only, no ng-bootstrap) |
| Socket.IO Client | socket.io-client@2.4.0 |
| @types/socket.io-client | 1.4.36 |
| ngx-toastr | 13.2.1 |
| ngx-spinner | 10.0.1 |

## 2. Package Installation Commands

```bash
# Create Angular 10 project
npx @angular/cli@10.1.3 new chat-app --routing=true --style=scss --skipTests=false

cd chat-app

# Angular Material 10
ng add @angular/material@10.2.7

# Bootstrap 5 (CSS only)
npm install bootstrap@5.1.3

# Socket.IO Client
npm install socket.io-client@2.4.0
npm install @types/socket.io-client@1.4.36 --save-dev

# Toast notifications
npm install ngx-toastr@13.2.1

# Spinner/Loader
npm install ngx-spinner@10.0.1

# JWT decode
npm install jwt-decode@3.1.2
```

## 3. Angular Project Creation Commands

```bash
# Step 1: Install Angular CLI 10.1.3 globally
npm install -g @angular/cli@10.1.3

# Step 2: Create project
ng new chat-app --routing=true --style=scss

# Step 3: Navigate into project
cd chat-app

# Step 4: Generate modules
ng generate module core
ng generate module shared
ng generate module layout
ng generate module auth --routing
ng generate module chat --routing
ng generate module conversation --routing
ng generate module message
ng generate module group --routing
ng generate module upload
ng generate module notification
ng generate module user --routing
```

## 4. Bootstrap 5 Setup

Add to `angular.json` under `styles`:
```json
"styles": [
  "node_modules/bootstrap/dist/css/bootstrap.min.css",
  "src/styles.scss"
]
```

Bootstrap 5 is used ONLY for:
- Grid system (container, row, col)
- Spacing utilities (m-, p-)
- Display utilities (d-flex, d-none)
- Text utilities

## 5. Angular Material Setup

Angular Material 10.2.7 is used for:
- MatToolbar - Header/navigation
- MatSidenav - Sidebar chat list
- MatList - Conversation list items
- MatCard - Message cards, profile cards
- MatFormField - All form inputs
- MatInput - Text inputs
- MatButton - All buttons
- MatIcon - Icons throughout app
- MatBadge - Unread count badges
- MatMenu - Context menus
- MatDialog - Modals (create group, etc.)
- MatSnackBar - Quick notifications
- MatProgressSpinner - Loading states
- MatChips - Group member tags
- MatAutocomplete - User search
- MatTab - Profile tabs

## 6. Complete Angular Folder Structure

```
src/
├── app/
│   ├── core/
│   │   ├── core.module.ts
│   │   ├── constants/
│   │   │   ├── api.constants.ts
│   │   │   ├── socket-events.constants.ts
│   │   │   └── app.constants.ts
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   └── role.guard.ts
│   │   ├── interceptors/
│   │   │   ├── jwt.interceptor.ts
│   │   │   ├── error.interceptor.ts
│   │   │   └── loader.interceptor.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── socket.service.ts
│   │   │   ├── chat.service.ts
│   │   │   ├── message.service.ts
│   │   │   ├── conversation.service.ts
│   │   │   ├── group.service.ts
│   │   │   ├── upload.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── notification.service.ts
│   │   │   └── loader.service.ts
│   │   ├── models/
│   │   │   ├── user.model.ts
│   │   │   ├── message.model.ts
│   │   │   ├── conversation.model.ts
│   │   │   ├── group.model.ts
│   │   │   ├── auth.model.ts
│   │   │   ├── notification.model.ts
│   │   │   └── api-response.model.ts
│   │   └── utilities/
│   │       ├── date.utility.ts
│   │       └── validation.utility.ts
│   ├── shared/
│   │   ├── shared.module.ts
│   │   ├── components/
│   │   │   ├── loader/
│   │   │   ├── notification-toast/
│   │   │   ├── confirm-dialog/
│   │   │   └── avatar/
│   │   ├── pipes/
│   │   │   ├── time-ago.pipe.ts
│   │   │   ├── truncate.pipe.ts
│   │   │   └── file-size.pipe.ts
│   │   ├── directives/
│   │   │   ├── auto-scroll.directive.ts
│   │   │   ├── click-outside.directive.ts
│   │   │   └── debounce-click.directive.ts
│   │   └── validators/
│   │       ├── match-password.validator.ts
│   │       └── no-whitespace.validator.ts
│   ├── layout/
│   │   ├── layout.module.ts
│   │   ├── main-layout/
│   │   │   ├── main-layout.component.ts
│   │   │   ├── main-layout.component.html
│   │   │   └── main-layout.component.scss
│   │   ├── header/
│   │   │   ├── header.component.ts
│   │   │   ├── header.component.html
│   │   │   └── header.component.scss
│   │   └── sidebar/
│   │       ├── sidebar.component.ts
│   │       ├── sidebar.component.html
│   │       └── sidebar.component.scss
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth-routing.module.ts
│   │   ├── login/
│   │   │   ├── login.component.ts
│   │   │   ├── login.component.html
│   │   │   └── login.component.scss
│   │   └── register/
│   │       ├── register.component.ts
│   │       ├── register.component.html
│   │       └── register.component.scss
│   ├── chat/
│   │   ├── chat.module.ts
│   │   ├── chat-routing.module.ts
│   │   ├── chat-container/
│   │   │   ├── chat-container.component.ts
│   │   │   ├── chat-container.component.html
│   │   │   └── chat-container.component.scss
│   │   ├── chat-window/
│   │   │   ├── chat-window.component.ts
│   │   │   ├── chat-window.component.html
│   │   │   └── chat-window.component.scss
│   │   ├── message-bubble/
│   │   │   ├── message-bubble.component.ts
│   │   │   ├── message-bubble.component.html
│   │   │   └── message-bubble.component.scss
│   │   ├── message-input/
│   │   │   ├── message-input.component.ts
│   │   │   ├── message-input.component.html
│   │   │   └── message-input.component.scss
│   │   └── typing-indicator/
│   │       ├── typing-indicator.component.ts
│   │       ├── typing-indicator.component.html
│   │       └── typing-indicator.component.scss
│   ├── conversation/
│   │   ├── conversation.module.ts
│   │   ├── conversation-routing.module.ts
│   │   ├── conversation-list/
│   │   │   ├── conversation-list.component.ts
│   │   │   ├── conversation-list.component.html
│   │   │   └── conversation-list.component.scss
│   │   └── conversation-item/
│   │       ├── conversation-item.component.ts
│   │       ├── conversation-item.component.html
│   │       └── conversation-item.component.scss
│   ├── group/
│   │   ├── group.module.ts
│   │   ├── group-routing.module.ts
│   │   ├── group-list/
│   │   │   ├── group-list.component.ts
│   │   │   ├── group-list.component.html
│   │   │   └── group-list.component.scss
│   │   ├── group-create/
│   │   │   ├── group-create.component.ts
│   │   │   ├── group-create.component.html
│   │   │   └── group-create.component.scss
│   │   └── group-manage/
│   │       ├── group-manage.component.ts
│   │       ├── group-manage.component.html
│   │       └── group-manage.component.scss
│   ├── user/
│   │   ├── user.module.ts
│   │   ├── user-routing.module.ts
│   │   └── profile/
│   │       ├── profile.component.ts
│   │       ├── profile.component.html
│   │       └── profile.component.scss
│   ├── notification/
│   │   ├── notification.module.ts
│   │   ├── notification-list/
│   │   │   ├── notification-list.component.ts
│   │   │   ├── notification-list.component.html
│   │   │   └── notification-list.component.scss
│   │   └── notification-item/
│   │       ├── notification-item.component.ts
│   │       ├── notification-item.component.html
│   │       └── notification-item.component.scss
│   ├── upload/
│   │   ├── upload.module.ts
│   │   └── file-upload/
│   │       ├── file-upload.component.ts
│   │       ├── file-upload.component.html
│   │       └── file-upload.component.scss
│   ├── app.module.ts
│   ├── app.component.ts
│   ├── app.component.html
│   ├── app.component.scss
│   └── app-routing.module.ts
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
├── assets/
│   ├── images/
│   └── icons/
├── styles.scss
└── index.html
```

## 7. Angular Concepts Usage Map

| # | Concept | Where Used |
|---|---------|-----------|
| 1 | Routing | app-routing.module.ts, feature routing modules |
| 2 | Feature Modules | auth, chat, conversation, group, user, notification |
| 3 | Lazy Loading | All feature modules loaded lazily |
| 4 | Shared Module | Common components, pipes, directives |
| 5 | Core Module | Services, guards, interceptors (singleton) |
| 6 | Components | Every UI piece is a component |
| 7 | Services | API communication, socket, state management |
| 8 | Auth Guard | Protect authenticated routes |
| 9 | Role Guard | Admin-only routes (group management) |
| 10 | HTTP Interceptors | JWT token, error handling, loader |
| 11 | Reactive Forms | Login, Register, Message input, Group create |
| 12 | Form Validations | Required, email, minLength, pattern |
| 13 | Custom Validators | Password match, no whitespace |
| 14 | Pipes | date formatting, file size |
| 15 | Custom Pipes | timeAgo, truncate, fileSize |
| 16 | Directives | Auto-scroll chat, click-outside |
| 17 | Custom Directives | autoScroll, clickOutside, debounceClick |
| 18 | RxJS | All HTTP calls, socket events |
| 19 | Subjects | Notification events, typing events |
| 20 | BehaviorSubject | Current user, online users, active conversation |
| 21 | Observables | API responses, socket streams |
| 22 | Subscriptions | Component-level socket listeners |
| 23 | Lifecycle Hooks | ngOnInit, ngOnDestroy, ngAfterViewInit |
| 24 | Utility Files | Date formatting, validation helpers |
| 25 | Environment Files | API URL, socket URL per environment |
| 26 | Models/Interfaces | Type safety for all entities |
| 27 | Error Handling | Error interceptor + toast notification |
| 28 | Loader/Spinner | Loader interceptor + LoaderService |
| 29 | Toast Handling | NotificationService with ngx-toastr |
| 30 | Socket.IO | Real-time messaging, typing, presence |

## 8. Step-by-Step Development Roadmap

1. Create Angular 10 project with CLI
2. Install all dependencies
3. Set up environments
4. Create Core module (services, guards, interceptors, models)
5. Create Shared module (pipes, directives, validators, common components)
6. Create Layout module (header, sidebar, main-layout)
7. Create Auth module (login, register)
8. Create Conversation module (list, item)
9. Create Chat module (window, bubble, input, typing)
10. Create Group module (list, create, manage)
11. Create User module (profile)
12. Create Upload module (file upload component)
13. Create Notification module (list, item)
14. Set up routing with lazy loading
15. Connect Socket.IO service
16. Test all features end-to-end
