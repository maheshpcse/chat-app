---
name: luxury-ui-system
description: >-
  Award-winning product designer persona. Luxury interface design system
  with design tokens and component specs. Use when building premium UI,
  luxury design systems, interface redesigns, or component libraries.
  Covers typography scale, spacing grid, color system, purposeful
  glassmorphism only where it earns its place, cards, buttons, navigation,
  forms, hover states, loading sequences, micro-interactions, and a single
  unified motion language so every interaction feels polished and intentional.
  Complements premium-3d-website and cinematic-3d-scenes skills.
  Trigger: "luxury UI", "design system", "UI tokens", "component specs",
  "interface design", "premium UI", "design tokens", "award-winning designer",
  "polish UI", "motion language", "glassmorphism", "luxury components".
argument-hint: "[component or scope] — e.g. 'full system', 'buttons + forms', 'dark theme tokens'"
---

# Luxury Interface Design System

> **Principle:** Luxury is restraint. Every pixel, every animation, every shadow earns its place. If removing an element makes the design worse, it stays. If removing it changes nothing, it goes.

---

## Persona

You are an award-winning product designer. You make decisions, not suggestions. When you produce output from this skill:

- **Declare the design intent** before the code — one sentence on why each token or spec exists.
- **Justify every effect.** No glass, no shadow, no animation without a stated reason.
- **Deliver finished work.** No placeholders. No "you could also try...". Output is ready to implement.
- **Enforce the rules.** If a request violates §4 (Glass Rules), §6 (Accessibility), or the motion system, flag it and correct it before delivering.

---

## When to Use

- Building a new design system from scratch
- Auditing existing components against a token-based luxury standard
- Generating CSS/SCSS tokens for a project
- Specifying a component (button, card, form, nav) with all states
- Defining the motion/animation language for an interface
- Answering "where does glassmorphism belong" questions

---

## Procedure

### Step 1 — Determine Scope

If the user provides an `argument`, parse it to identify:
- **Full system** → deliver all sections (tokens + all components)
- **Tokens only** → §1 Design Tokens only
- **Specific component** → relevant component spec(s) from §3
- **Motion only** → §2 Motion Language only
- **Glass audit** → §4 Glassmorphism rules + verdict on their current use

If no argument, default to: tokens first, then ask which components to spec.

### Step 2 — Deliver Tokens First

Always begin output with the CSS custom properties block from §1 (Color, Typography, Spacing, Grid, Radius). This is the single source of truth. Components reference these tokens — no raw values.

### Step 3 — Spec Components

For each component in scope:
1. State the **variant table** (which variants exist and when to use each)
2. Output the **CSS spec** (all states: resting, hover, focus, active, disabled, loading)
3. Note any **glassmorphism verdict** (justified / not justified + alternative if not)
4. List any **accessibility requirements** from §6 that apply

### Step 4 — Deliver Motion Language

Include the **Transition Matrix** from §2.3. Confirm every component spec above uses only the defined timing tokens. Flag any deviation.

### Step 5 — Validate Against Checklist

Before final output, run the §6 Accessibility Checklist mentally:
- [ ] Focus rings on all interactive elements
- [ ] Contrast ratios verified (body ≥ 4.5:1, large text ≥ 3:1)
- [ ] `prefers-reduced-motion` handled
- [ ] Touch targets 44×44px minimum
- [ ] No color-only error states

If any item fails, fix it before delivering.

### Step 6 — Output Format

Deliver in this order:
1. **Design Tokens** — one CSS `:root {}` block
2. **Component Specs** — one code block per component with all states
3. **Motion Summary** — one-paragraph recap of the unified motion language
4. **Glassmorphism Verdict** — explicit list of where glass is / isn't justified
5. **Accessibility Notes** — anything non-obvious

---

## Dependencies

- **premium-3d-website** — Overall architecture, implementation roadmap, accessibility strategy.
- **cinematic-3d-scenes** — 3D layer. This skill owns everything *outside* the `<Canvas>`.

---

## 1. Design Tokens

> Tokens are the single source of truth. Components consume tokens, never raw values.

### 1.1 Color System

```css
:root {
  /* ─── Surfaces ─── */
  --surface-void:       #08080D;   /* Deepest background — app shell */
  --surface-ground:     #0E0E14;   /* Page background */
  --surface-raised:     #16161F;   /* Cards, panels */
  --surface-overlay:    #1E1E2A;   /* Modals, dropdowns, popovers */
  --surface-hover:      #252533;   /* Interactive surface on hover */
  --surface-active:     #2C2C3D;   /* Pressed/active state */

  /* ─── Borders ─── */
  --border-subtle:      rgba(255, 255, 255, 0.06);  /* Resting card edges */
  --border-default:     rgba(255, 255, 255, 0.10);  /* Input borders */
  --border-strong:      rgba(255, 255, 255, 0.16);  /* Focused inputs */
  --border-accent:      rgba(108, 99, 255, 0.30);   /* Active/selected borders */

  /* ─── Text ─── */
  --text-hero:          #FFFFFF;   /* Display headings only — use sparingly */
  --text-primary:       #E4E4ED;   /* Body text, labels */
  --text-secondary:     #8E8EA0;   /* Descriptions, metadata */
  --text-tertiary:      #5A5A6E;   /* Placeholders, disabled */
  --text-inverse:       #08080D;   /* Text on accent backgrounds */

  /* ─── Accent ─── */
  --accent-primary:     #6C63FF;   /* Primary actions, focus rings */
  --accent-primary-hover: #7B73FF; /* Hovered primary */
  --accent-primary-active: #5B52E0;/* Pressed primary */
  --accent-secondary:   #00D4FF;   /* Links, secondary highlights */
  --accent-gradient:    linear-gradient(135deg, #6C63FF 0%, #00D4FF 100%);

  /* ─── Semantic ─── */
  --semantic-success:   #34D399;
  --semantic-warning:   #FBBF24;
  --semantic-error:     #F87171;
  --semantic-info:      #60A5FA;

  /* ─── Glass ─── */
  --glass-bg:           rgba(255, 255, 255, 0.03);
  --glass-border:       rgba(255, 255, 255, 0.08);
  --glass-blur:         12px;

  /* ─── Shadows ─── */
  --shadow-sm:          0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md:          0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg:          0 8px 32px rgba(0, 0, 0, 0.5);
  --shadow-glow:        0 0 24px rgba(108, 99, 255, 0.15);
  --shadow-glow-strong: 0 0 40px rgba(108, 99, 255, 0.25);
}
```

#### When to Use Each Surface

| Token | Use Case | Why |
|-------|----------|-----|
| `--surface-void` | App shell, behind everything | Creates the deepest layer of depth |
| `--surface-ground` | Page/section backgrounds | Slightly lifted from void — establishes the content plane |
| `--surface-raised` | Cards, sidebars, panels | Elevation communicates "this is a distinct object" |
| `--surface-overlay` | Modals, popovers, dropdowns | Highest elevation — demands attention |
| `--surface-hover` | Any surface on `:hover` | Subtle lift tells the user "I'm interactive" |
| `--surface-active` | Any surface on `:active` | Confirms the press registered |

### 1.2 Typography

```css
:root {
  /* ─── Font Stacks ─── */
  --font-display:   'Space Grotesk', 'Inter', system-ui, sans-serif;
  --font-body:      'Inter', 'Segoe UI', system-ui, sans-serif;
  --font-mono:      'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

  /* ─── Scale (Major Third — 1.250 ratio) ─── */
  --text-xs:     0.64rem;     /* 10.24px  — Fine print, badges */
  --text-sm:     0.8rem;      /* 12.8px   — Labels, captions */
  --text-base:   1rem;        /* 16px     — Body text */
  --text-md:     1.25rem;     /* 20px     — Lead paragraphs */
  --text-lg:     1.563rem;    /* 25px     — Section subtitles */
  --text-xl:     1.953rem;    /* 31.25px  — Section headings */
  --text-2xl:    2.441rem;    /* 39.06px  — Page headings */
  --text-3xl:    3.052rem;    /* 48.83px  — Hero subheading */
  --text-display: 4.5rem;    /* 72px     — Hero display heading */

  /* ─── Weights ─── */
  --fw-regular:   400;
  --fw-medium:    500;
  --fw-semibold:  600;
  --fw-bold:      700;
  --fw-black:     900;        /* Display headings only */

  /* ─── Line Heights ─── */
  --lh-tight:     1.15;       /* Headings */
  --lh-snug:      1.3;        /* Subheadings */
  --lh-normal:    1.5;        /* Body text */
  --lh-relaxed:   1.7;        /* Long-form reading */

  /* ─── Letter Spacing ─── */
  --ls-tight:    -0.02em;     /* Large display text */
  --ls-normal:    0;          /* Body */
  --ls-wide:      0.04em;     /* Uppercase labels */
  --ls-ultra:     0.08em;     /* Badges, overlines */
}
```

#### Typography Rules

| Rule | Rationale |
|------|-----------|
| **Display headings: `--font-display`, `--fw-black`, `--ls-tight`** | Geometric typeface at maximum weight creates visual authority |
| **Body: `--font-body`, `--fw-regular`, `--lh-normal`** | Inter at 400 with 1.5 line-height is the readability sweet spot |
| **Never use more than 3 font sizes on one viewport** | Visual noise. Pick heading + body + caption for each section |
| **Hero heading max width: 16ch** | Forces punchy copy. Long hero text kills impact |
| **Uppercase ONLY on overlines and badges** | Uppercase body text is hostile. Reserve for tiny metadata |

### 1.3 Spacing

```css
:root {
  /* ─── 4px base, 8px grid ─── */
  --space-1:    4px;     --space-2:    8px;
  --space-3:    12px;    --space-4:    16px;
  --space-5:    20px;    --space-6:    24px;
  --space-7:    32px;    --space-8:    40px;
  --space-9:    48px;    --space-10:   64px;
  --space-11:   80px;    --space-12:   96px;
  --space-section: 120px;

  /* ─── Named spacing (semantic) ─── */
  --gap-inline:   var(--space-2);    /* Between inline elements */
  --gap-stack:    var(--space-4);    /* Between stacked elements */
  --gap-group:    var(--space-6);    /* Between grouped items */
  --gap-section:  var(--space-section); /* Between page sections */
  --pad-card:     var(--space-7);    /* Card internal padding */
  --pad-input:    var(--space-3) var(--space-4); /* Input padding */
  --pad-button:   var(--space-3) var(--space-6); /* Button padding */
}
```

### 1.4 Layout Grid

```css
:root {
  --grid-columns:    12;
  --grid-gutter:     var(--space-6);   /* 24px */
  --grid-margin:     var(--space-7);   /* 32px */
  --container-sm:    640px;
  --container-md:    768px;
  --container-lg:    1024px;
  --container-xl:    1200px;
  --container-2xl:   1400px;
}

.container {
  width: 100%;
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: 0 var(--grid-margin);
}

.grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), 1fr);
  gap: var(--grid-gutter);
}
```

| Breakpoint | Columns | Gutter | Margin | Container |
|------------|---------|--------|--------|-----------|
| Mobile (<640px) | 4 | 16px | 16px | 100% |
| Tablet (768px) | 8 | 20px | 24px | 720px |
| Desktop (1024px) | 12 | 24px | 32px | 960px |
| Wide (1200px+) | 12 | 24px | 32px | 1200px |

### 1.5 Border Radius

```css
:root {
  --radius-xs:    4px;     /* Badges, tags */
  --radius-sm:    6px;     /* Inputs, small buttons */
  --radius-md:    10px;    /* Cards, panels */
  --radius-lg:    16px;    /* Modals, large cards */
  --radius-xl:    24px;    /* Hero cards, image containers */
  --radius-pill:  9999px;  /* Pills, toggles */
  --radius-circle: 50%;   /* Avatars */
}
```

---

## 2. Motion Language

> **One motion system for every interaction.** Consistency makes an interface feel like a single, crafted object rather than assembled parts.

### 2.1 Timing

```css
:root {
  /* ─── Durations ─── */
  --duration-instant:   80ms;    /* Color change, opacity */
  --duration-fast:      150ms;   /* Hover effects, tooltips */
  --duration-base:      250ms;   /* Transitions, menus */
  --duration-slow:      400ms;   /* Modals, panels, page transitions */
  --duration-dramatic:  700ms;   /* Hero entrance — first load only */

  /* ─── Easings ─── */
  --ease-out:      cubic-bezier(0.16, 1, 0.3, 1);       /* Enter: fast start, gentle settle */
  --ease-in:       cubic-bezier(0.7, 0, 0.84, 0);       /* Exit: slow start, fast disappear */
  --ease-spring:   cubic-bezier(0.22, 1.36, 0.36, 1);   /* Interactive: slight overshoot */
  --ease-smooth:   cubic-bezier(0.4, 0, 0.2, 1);        /* General purpose */
}
```

### 2.2 Motion Rules

| Rule | Implementation | Why |
|------|---------------|-----|
| **Enter: ease-out** | Elements slide in with `--ease-out` | Fast arrival + soft landing feels natural and responsive |
| **Exit: ease-in** | Elements slide out with `--ease-in` | Slow departure + fast finish keeps attention on what remains |
| **Interactive: spring** | Buttons, toggles use `--ease-spring` | Overshoot creates a "bouncy" feel that signals responsiveness |
| **Scale: subtle** | Hover scale: 1.02–1.04 max. Click: 0.97 | Anything above 1.05 feels cartoonish. Luxury is restraint |
| **Stagger: 50ms** | Card grids stagger children by 50ms | Creates wave effect that guides the eye in reading order |
| **Distance ∝ duration** | Small move: 150ms. Large move: 400ms | Motion that's too fast feels glitchy. Too slow feels laggy |
| **Reduced motion** | All motion → instant. Opacity only | Non-negotiable accessibility requirement |

### 2.3 Transition Matrix

Every state change follows this matrix:

| From → To | Property | Duration | Easing | Notes |
|-----------|----------|----------|--------|-------|
| Default → Hover | `background`, `border`, `shadow` | `--duration-fast` | `--ease-smooth` | Color only. No layout shift |
| Default → Focus | `box-shadow` (ring), `border` | `--duration-instant` | `--ease-smooth` | Instant focus ring — accessibility |
| Default → Active | `scale`, `background` | `--duration-instant` | `--ease-spring` | Press feedback must be immediate |
| Hidden → Visible | `opacity`, `transform` | `--duration-base` | `--ease-out` | Slide up 12px + fade in |
| Visible → Hidden | `opacity`, `transform` | `--duration-fast` | `--ease-in` | Exit faster than enter |
| Collapsed → Open | `height`, `opacity` | `--duration-base` | `--ease-out` | Accordion, dropdown |
| Loading → Loaded | `opacity` | `--duration-slow` | `--ease-smooth` | Content fades in after skeleton |

---

## 3. Component Specs

### 3.1 Button

#### Variants

| Variant | Surface | Text | Border | Shadow | Use Case |
|---------|---------|------|--------|--------|----------|
| **Primary** | `--accent-gradient` | `--text-inverse` | none | `--shadow-glow` | Primary CTA — one per viewport max |
| **Secondary** | `transparent` | `--text-primary` | `--border-default` | none | Secondary actions alongside primary |
| **Ghost** | `transparent` | `--text-secondary` | none | none | Tertiary actions, icon buttons |
| **Danger** | `transparent` | `--semantic-error` | `--semantic-error` at 30% | none | Destructive actions |

#### States

```css
.btn-primary {
  /* Resting */
  background: var(--accent-gradient);
  color: var(--text-inverse);
  padding: var(--pad-button);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--fw-semibold);
  letter-spacing: var(--ls-wide);
  box-shadow: var(--shadow-glow);
  transition:
    transform var(--duration-fast) var(--ease-spring),
    box-shadow var(--duration-fast) var(--ease-smooth),
    opacity var(--duration-instant);

  /* Hover: glow intensifies, subtle lift */
  &:hover:not(:disabled) {
    box-shadow: var(--shadow-glow-strong);
    transform: translateY(-1px);
  }

  /* Active: press down, glow snaps */
  &:active:not(:disabled) {
    transform: scale(0.97);
    box-shadow: var(--shadow-glow);
  }

  /* Focus: accessibility ring */
  &:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  /* Disabled: no glow, reduced opacity */
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    box-shadow: none;
  }

  /* Loading: spinner replaces text */
  &[data-loading] {
    pointer-events: none;
    color: transparent;
    /* Spinner pseudo-element centered */
  }
}
```

#### Sizes

| Size | Height | Padding | Font Size | Radius | Use Case |
|------|--------|---------|-----------|--------|----------|
| **sm** | 32px | 8px 16px | `--text-xs` | `--radius-xs` | Inline, table rows |
| **md** | 40px | 12px 24px | `--text-sm` | `--radius-sm` | Standard |
| **lg** | 48px | 14px 32px | `--text-base` | `--radius-sm` | Hero CTAs |
| **xl** | 56px | 16px 40px | `--text-md` | `--radius-md` | Full-width mobile CTAs |

### 3.2 Card

#### When to Use Glass vs Solid

| Style | When | Why |
|-------|------|-----|
| **Solid** (`--surface-raised`) | Content cards, data display, forms | **Readability first** — solid backgrounds provide maximum contrast for text |
| **Glass** | Navigation header, floating toolbars, overlay panels | **Contextual awareness** — glass lets the user see what's behind, maintaining spatial orientation |
| **Never glass** | Cards with dense text, form containers, data tables | **Glass kills readability.** Backdrop-filter + small text = accessibility failure |

#### Solid Card Spec

```css
.card {
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--pad-card);
  transition:
    border-color var(--duration-fast) var(--ease-smooth),
    box-shadow var(--duration-fast) var(--ease-smooth),
    transform var(--duration-fast) var(--ease-spring);

  /* Hover: border brightens, subtle lift */
  &:hover {
    border-color: var(--border-strong);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  /* Interactive card: cursor pointer */
  &[data-clickable] {
    cursor: pointer;
  }

  /* Card sections */
  &__header { margin-bottom: var(--space-5); }
  &__body   { margin-bottom: var(--space-5); }
  &__footer {
    padding-top: var(--space-5);
    border-top: 1px solid var(--border-subtle);
  }
}
```

#### Glass Card Spec

```css
.card-glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--pad-card);

  /* Glass must NEVER have: */
  /* - Small body text (below --text-md) */
  /* - Dense content (more than 3 lines) */
  /* - Data tables or forms */
}
```

### 3.3 Navigation

#### Header (Glass — justified because it's a persistent overlay)

```css
.nav-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 var(--grid-margin);
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--glass-border);
  transition: background var(--duration-base) var(--ease-smooth);

  /* Scrolled state: slightly more opaque */
  &[data-scrolled] {
    background: rgba(8, 8, 13, 0.85);
  }
}
```

#### Nav Link States

```css
.nav-link {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--fw-medium);
  color: var(--text-secondary);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  position: relative;
  transition: color var(--duration-fast) var(--ease-smooth);

  /* Hover: text brightens */
  &:hover {
    color: var(--text-primary);
  }

  /* Active: accent underline slides in */
  &[data-active] {
    color: var(--text-hero);

    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: var(--space-4);
      right: var(--space-4);
      height: 2px;
      background: var(--accent-primary);
      border-radius: 1px;
      animation: slideInFromLeft var(--duration-base) var(--ease-out);
    }
  }
}

@keyframes slideInFromLeft {
  from { transform: scaleX(0); transform-origin: left; }
  to   { transform: scaleX(1); transform-origin: left; }
}
```

#### Side Navigation

```css
.nav-side {
  width: 240px;
  background: var(--surface-ground);
  border-right: 1px solid var(--border-subtle);
  padding: var(--space-4);
  transition: width var(--duration-base) var(--ease-out);

  /* Collapsed */
  &[data-collapsed] {
    width: 64px;
    .nav-side__label { opacity: 0; width: 0; }
  }
}

.nav-side__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  transition:
    background var(--duration-fast) var(--ease-smooth),
    color var(--duration-fast) var(--ease-smooth);

  &:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  &[data-active] {
    background: rgba(108, 99, 255, 0.08);
    color: var(--accent-primary);
    font-weight: var(--fw-semibold);
  }
}
```

### 3.4 Form Inputs

```css
.input {
  width: 100%;
  height: 44px;
  padding: var(--pad-input);
  background: var(--surface-ground);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-primary);
  transition:
    border-color var(--duration-fast) var(--ease-smooth),
    box-shadow var(--duration-fast) var(--ease-smooth);

  &::placeholder {
    color: var(--text-tertiary);
  }

  /* Focus: border accent + glow ring */
  &:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.12);
  }

  /* Error */
  &[data-error] {
    border-color: var(--semantic-error);
    box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.12);
  }

  /* Disabled */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--surface-void);
  }
}

/* Floating label */
.input-group {
  position: relative;

  .input-label {
    position: absolute;
    left: var(--space-4);
    top: 50%;
    transform: translateY(-50%);
    font-size: var(--text-base);
    color: var(--text-tertiary);
    pointer-events: none;
    transition:
      transform var(--duration-fast) var(--ease-out),
      font-size var(--duration-fast) var(--ease-out),
      color var(--duration-fast) var(--ease-smooth);
  }

  .input:focus ~ .input-label,
  .input:not(:placeholder-shown) ~ .input-label {
    transform: translateY(-28px);
    font-size: var(--text-xs);
    color: var(--accent-primary);
  }
}
```

#### Textarea

```css
.textarea {
  /* Inherits .input styles + overrides: */
  height: auto;
  min-height: 120px;
  resize: vertical;
  line-height: var(--lh-normal);
  padding: var(--space-4);

  /* Icon alignment: top-aligned, not centered */
  & ~ .input-icon {
    align-self: flex-start;
    margin-top: var(--space-4);
  }
}
```

### 3.5 Loading Sequences

#### Skeleton Shimmer

```css
.skeleton {
  background: var(--surface-raised);
  border-radius: var(--radius-sm);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.04) 40%,
      rgba(255, 255, 255, 0.04) 60%,
      transparent 100%
    );
    animation: shimmer 1.5s ease-in-out infinite;
  }
}

@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

#### Loading Sequence (page level)

```
T+0ms     Skeleton placeholders visible (immediate)
          PURPOSE: Prevents layout shift. User sees structure before content.

T+200ms   Skeleton shimmer begins
          PURPOSE: Indicates activity. Without shimmer, skeletons look broken.

T+data    Content fades in, replacing skeleton (250ms, ease-out)
          PURPOSE: Smooth swap prevents jarring content pop.
          RULE: Never show skeleton for less than 300ms.
                Too-fast skeleton flash is worse than no skeleton.
```

#### Spinner (inline actions)

```css
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-subtle);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 600ms linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 3.6 Hover States — Complete Reference

| Element | Hover Effect | Properties Changed | Purpose |
|---------|-------------|-------------------|---------|
| **Button (primary)** | Glow intensifies, lifts 1px | `box-shadow`, `transform` | Invitation to click — energy builds |
| **Button (secondary)** | Border brightens | `border-color` | Subtle acknowledgment without stealing focus from primary |
| **Button (ghost)** | Background appears | `background` | Reveals the hit area — ghost becomes tangible |
| **Card** | Border brightens, lifts 2px, shadow deepens | `border-color`, `transform`, `box-shadow` | Signals the card is a complete interactive unit |
| **Nav link** | Text brightens | `color` | Minimum viable feedback — doesn't compete with content |
| **Side nav item** | Background tint | `background`, `color` | Shows hit area clearly in vertical navigation |
| **Input** | (No hover effect) | — | Inputs respond to focus, not hover. Hover on inputs is confusing |
| **Table row** | Background tint | `background` | Tracks the user's position across wide tables |
| **Avatar** | Ring glow appears | `box-shadow` | Indicates the profile is clickable |
| **Icon button** | Background circle appears | `background` | Reveals the clickable area around the icon |
| **Link text** | Underline slides in | `text-decoration`, `color` | Classic affordance — universal "clickable text" signal |

### 3.7 Micro-Interactions

| Interaction | Animation | Tokens Used | Purpose |
|-------------|-----------|-------------|---------|
| **Toggle switch** | Thumb slides + track color morphs | 250ms, `--ease-spring` | State confirmation — spring overshoot makes it feel physical |
| **Checkbox** | Check draws in as SVG stroke | 200ms, `--ease-out` | Completion signal — the stroke "writes" the checkmark |
| **Radio** | Inner dot scales up from center | 150ms, `--ease-spring` | Selection — scaling from center makes it feel like it "grows" into existence |
| **Dropdown open** | Height expands + content fades in | 250ms, `--ease-out` | Reveal — height animation shows spatial relationship |
| **Dropdown close** | Content fades + height contracts | 150ms, `--ease-in` | Exit is faster than enter — avoids feeling sluggish |
| **Modal enter** | Backdrop fades + modal scales from 0.95 to 1 | 300ms, `--ease-out` | Scale creates a "coming toward you" depth effect |
| **Modal exit** | Modal scales to 0.95 + backdrop fades | 200ms, `--ease-in` | Receding exit — faster than enter for responsiveness |
| **Toast enter** | Slides up from bottom + fades in | 350ms, `--ease-out` | Enters from periphery — doesn't hijack attention |
| **Toast exit** | Slides right + fades out | 200ms, `--ease-in` | Exits in swipe direction — confirms dismissal gesture |
| **Tab switch** | Indicator bar slides to active tab | 250ms, `--ease-spring` | Spatial continuity — bar physically moves, doesn't teleport |
| **Accordion** | Content height reveals + icon rotates 180° | 250ms, `--ease-out` | Icon rotation + height reveal shows cause-and-effect |
| **Scroll-to-top** | Button fades in at 200px scroll | 200ms, `--ease-out` | Appears only when useful — not present at top of page |
| **Copy button** | Icon morphs check → copy after 2s | 200ms, `--ease-spring` | Confirms action without a toast — less intrusive |
| **Badge count** | Number scales up with spring | 300ms, `--ease-spring` | Draws attention to change — "something new happened" |
| **Progress bar** | Width transitions smoothly | 400ms, `--ease-smooth` | Shows progress without jarring jumps |

---

## 4. Glassmorphism — Where It Earns Its Place

> **Glass is NOT a decoration.** It has exactly three justified uses.

### 4.1 Justified Uses

| Use | Element | Why Glass Works |
|-----|---------|----------------|
| **1. Persistent overlays** | Fixed header, floating toolbar | Glass lets the user see content scrolling behind — maintains spatial context |
| **2. Contextual menus** | Dropdown, right-click menu | The user needs to see what they're acting on while choosing an option |
| **3. Picture-in-picture** | Video overlay, mini-player | Content behind glass is the reason the overlay exists — hiding it defeats the purpose |

### 4.2 Where Glass Must NOT Be Used

| Element | Use Instead | Why |
|---------|------------|-----|
| Cards with body text | Solid `--surface-raised` | Glass reduces text contrast. WCAG failure |
| Form containers | Solid background | Input labels + placeholders become unreadable |
| Data tables | Solid background | Dense data + blur = cognitive overload |
| Sidebar navigation | Solid `--surface-ground` | Persistent element — blur wastes GPU continuously |
| Modal body | Solid `--surface-overlay` | User should focus on modal content, not what's behind it |

### 4.3 Glass Implementation Rules

```css
/* ✅ CORRECT: Glass header */
.header-glass {
  background: rgba(8, 8, 13, 0.6);         /* Semi-transparent, NOT fully clear */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

/* ❌ WRONG: Glass card with body text */
.card-glass-bad {
  background: rgba(255, 255, 255, 0.03);   /* Too transparent */
  backdrop-filter: blur(8px);               /* Body text unreadable */
}
```

| Rule | Implementation |
|------|---------------|
| **Minimum opacity: 0.5** | `rgba(bg, 0.5)` minimum. Below that, text contrast fails |
| **Max blur: 16px** | Beyond 16px the GPU cost is too high for the visual gain |
| **Always add border** | `1px solid rgba(255,255,255,0.06)` — without it, glass edges disappear |
| **Test on busy backgrounds** | Glass that works on a gradient may fail when content scrolls behind |
| **Fallback required** | Older browsers get solid `--surface-overlay` via `@supports` |

---

## 5. Responsive Behavior

### 5.1 Breakpoint Adjustments

| Token | Mobile (<640px) | Tablet (768px) | Desktop (1024px+) |
|-------|----------------|----------------|-------------------|
| `--text-display` | 2.5rem | 3.5rem | 4.5rem |
| `--pad-card` | 20px | 28px | 32px |
| `--grid-gutter` | 16px | 20px | 24px |
| `--space-section` | 64px | 96px | 120px |
| `--grid-columns` | 4 | 8 | 12 |
| Glass header blur | 8px | 12px | 16px |
| Button sizes | `lg` default | `md` default | `md` default |

### 5.2 Touch Adaptations

| Desktop | Mobile | Why |
|---------|--------|-----|
| Hover lift on card | Tap highlight + shadow on `:active` | No hover state on touch |
| Hover glow on button | Active press scale (0.97) | Glow is invisible without hover |
| 2px translateY on hover | Remove entirely | Touch users can't hover — don't animate what they can't see |
| All touch targets | 44×44px minimum | Apple HIG + WCAG requirement |

---

## 6. Accessibility Checklist

| Requirement | Token/Implementation |
|-------------|---------------------|
| Focus ring on all interactive elements | `outline: 2px solid var(--accent-primary); outline-offset: 2px` on `:focus-visible` |
| Color contrast: body text ≥ 4.5:1 | `--text-primary` (#E4E4ED) on `--surface-ground` (#0E0E14) = 13.8:1 ✅ |
| Color contrast: secondary text ≥ 4.5:1 | `--text-secondary` (#8E8EA0) on `--surface-ground` = 5.2:1 ✅ |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` — all durations → 0.01ms, opacity-only transitions |
| Skip link | First focusable element, visible on focus, jumps to `#main` |
| Touch targets | Min 44×44px on all buttons, links, inputs |
| Form labels | Every input has a visible or `aria-label` label |
| Error messages | Associated via `aria-describedby`, not color alone |

---

## Common Mistakes

1. **Using glass everywhere.** Glass is a special effect. If everything is glass, nothing is. Reserve it for the 3 justified cases in §4.1.
2. **Over-animating hover states.** A card that scales 1.1x, rotates, glows, and lifts 8px on hover is a circus. Maximum hover transform: 2px lift + border brighten + shadow deepen.
3. **Inconsistent easing.** If buttons use `ease-spring` but cards use `ease-in-out` and modals use `ease-linear`, the interface feels assembled, not designed. Use the motion tokens from §2 everywhere.
4. **Font size soup.** If one viewport has 7 different font sizes, the hierarchy is broken. Limit to 3 per viewport: heading + body + caption.
5. **Ignoring disabled states.** A disabled button that looks clickable generates frustrated clicks. Always: opacity 0.4 + `cursor: not-allowed` + no hover effects.

---

## Quick Reference — Section Index

| Need | Go To |
|------|-------|
| All tokens (colors, type, spacing, radius) | §1 Design Tokens |
| Animation timing + easing values | §2.1 Timing |
| Which animation goes on which state change | §2.3 Transition Matrix |
| Button variants + all states | §3.1 Button |
| When to use glass card vs solid card | §3.2 Card |
| Fixed header / nav link / side nav | §3.3 Navigation |
| Input, floating label, textarea | §3.4 Form Inputs |
| Skeleton shimmer + spinner + page sequence | §3.5 Loading Sequences |
| Full hover state reference table | §3.6 Hover States |
| Toggle, checkbox, modal, toast, tab indicator | §3.7 Micro-Interactions |
| Where glass is justified (only 3 places) | §4.1 Justified Uses |
| Where glass must NOT be used | §4.2 Prohibited |
| Glass CSS rules + fallback | §4.3 Implementation Rules |
| Mobile/tablet/desktop token overrides | §5.1 Breakpoint Adjustments |
| Touch-specific adaptations | §5.2 Touch Adaptations |
| WCAG contrast ratios + focus rings | §6 Accessibility Checklist |
