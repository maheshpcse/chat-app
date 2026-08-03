---
name: cinematic-3d-scenes
description: >-
  Deep-dive scene direction spec for cinematic 3D web experiences. Covers
  scroll-driven storytelling with camera choreography, parallax layer
  systems, lighting rigs, particle systems, depth transitions, and
  interactive scene design. Every effect is purpose-justified — zero
  decoration for its own sake. Complements the premium-3d-website skill.
  Trigger: "cinematic 3D", "3D scenes", "scroll storytelling",
  "camera animation", "3D scene direction", "cinematic website".
---

# Cinematic 3D Scene Direction — Web Experience Spec

> **Constraint:** Every effect must serve the story. Zero decoration for its own sake. If you can't state why an effect exists in one sentence, delete it.

## Dependencies

- **premium-3d-website** — Use for overall architecture, design tokens, component structure, and accessibility. This skill focuses exclusively on the 3D cinematic layer.

---

## 1. Storytelling Framework

### 1.1 The Narrative Arc

A cinematic website follows the same structure as a film. Each scroll section maps to an act:

```
SCROLL PROGRESS ──────────────────────────────────────────────────▶

ACT I: HOOK           ACT II: BUILD           ACT III: RESOLVE
(0% – 20%)            (20% – 70%)             (70% – 100%)
┌──────────────┐  ┌─────────────────────┐  ┌──────────────────┐
│              │  │                     │  │                  │
│  Establish   │  │  Reveal features    │  │  Prove value     │
│  world +     │  │  through spatial    │  │  and convert     │
│  intrigue    │  │  exploration        │  │                  │
│              │  │                     │  │                  │
└──────────────┘  └─────────────────────┘  └──────────────────┘
 Hero scene         Showcase scenes          Proof + CTA scenes
 Camera pulls in    Camera orbits/dollies    Camera settles
 Particles sparse   Particles react          Particles converge
 Lighting: moody    Lighting: reveals        Lighting: warm
```

### 1.2 Scene-to-Content Mapping

Every scene must answer **one question** the visitor has at that point in their journey:

| Scene | Scroll Range | Visitor Question | Scene Answer | Camera Move |
|-------|-------------|------------------|--------------|-------------|
| **1. Arrival** | 0–15% | "What is this?" | Brand identity + mood | Static → slow push-in |
| **2. Promise** | 15–30% | "What does it do for me?" | Core value proposition | Dolly left, reveal text |
| **3. Showcase A** | 30–45% | "Show me how" | Feature demonstration | Orbit around model |
| **4. Showcase B** | 45–55% | "What else?" | Secondary features | Crane up, wider view |
| **5. Evidence** | 55–70% | "Prove it works" | Metrics + social proof | Pull back to see scale |
| **6. Voices** | 70–82% | "Who else uses it?" | Testimonials | Slow pan across cards |
| **7. Decision** | 82–100% | "What do I do next?" | CTA + pricing | Camera settles, glow builds |

---

## 2. Camera Choreography

### 2.1 Camera Movement Types

| Move | Code Pattern | When to Use | Story Purpose |
|------|-------------|-------------|---------------|
| **Push-in** | `camera.position.z` decreases on scroll | Opening scene | **Draws visitor into the world** — creates intimacy and focus |
| **Pull-back** | `camera.position.z` increases on scroll | Metrics/scale section | **Reveals scope** — pulling back shows the bigger picture |
| **Dolly** | `camera.position.x` shifts laterally | Feature reveals | **Progressive disclosure** — sliding past content mimics a museum walk |
| **Orbit** | `camera.position` circles target on Y-axis | Product showcase | **Full understanding** — seeing all sides builds trust and familiarity |
| **Crane** | `camera.position.y` rises | Transition between acts | **Perspective shift** — rising above creates narrative breathing room |
| **Track** | Camera follows a spline path | Long narrative sequences | **Guided tour** — visitor is led through a curated path |
| **Static hold** | Camera stops moving | CTA / decision point | **Demands attention** — stillness after motion creates focus |

### 2.2 Camera Implementation

```typescript
// Scroll-driven camera rig using R3F + Lenis
function ScrollCamera({ scenes }: { scenes: CameraKeyframe[] }) {
  const { scroll } = useScroll();
  const cameraRef = useRef<THREE.PerspectiveCamera>();

  useFrame(() => {
    const progress = scroll.current; // 0 to 1
    const { position, lookAt, fov } = interpolateKeyframes(scenes, progress);

    if (cameraRef.current) {
      cameraRef.current.position.lerp(position, 0.08); // Damped for smoothness
      cameraRef.current.lookAt(lookAt);
      cameraRef.current.fov = THREE.MathUtils.lerp(cameraRef.current.fov, fov, 0.05);
      cameraRef.current.updateProjectionMatrix();
    }
  });

  return <perspectiveCamera ref={cameraRef} fov={45} />;
}

// Keyframe definition — one per scene
const cameraKeyframes: CameraKeyframe[] = [
  { scroll: 0.00, position: [0, 0, 12],  lookAt: [0, 0, 0],  fov: 45 }, // Arrival: wide
  { scroll: 0.15, position: [0, 0, 6],   lookAt: [0, 0, 0],  fov: 45 }, // Push-in: intimate
  { scroll: 0.30, position: [-4, 0, 6],  lookAt: [0, 0, 0],  fov: 50 }, // Dolly left: reveal
  { scroll: 0.45, position: [-2, 1, 8],  lookAt: [0, 0, 0],  fov: 45 }, // Orbit start
  { scroll: 0.55, position: [2, 2, 8],   lookAt: [0, 0, 0],  fov: 45 }, // Crane up
  { scroll: 0.70, position: [0, 3, 14],  lookAt: [0, 0, 0],  fov: 40 }, // Pull back: scale
  { scroll: 0.85, position: [0, 1, 10],  lookAt: [0, -1, 0], fov: 45 }, // Pan down
  { scroll: 1.00, position: [0, 0, 8],   lookAt: [0, 0, 0],  fov: 45 }, // Settle: CTA
];
```

### 2.3 Camera Rules

1. **Never move the camera without purpose.** Every movement reveals content, creates depth, or guides the eye.
2. **Damping is mandatory.** Raw scroll-to-camera mapping feels mechanical. Always `lerp` with factor 0.05–0.1.
3. **Match speed to content density.** Dense content = slow camera. Simple visuals = faster moves.
4. **Hold the camera still at decision points.** When the visitor needs to read or click, the camera stops.
5. **Limit FOV changes.** FOV shifts feel like zooming and cause nausea. Keep changes under ±10° total.

---

## 3. Parallax Layer System

### 3.1 Layer Architecture

```
CAMERA (viewer)
    │
    ▼
┌─────────────────────────────────────────────┐  z = 0   (foreground)
│  Layer 0: UI elements (fixed, no parallax)  │
├─────────────────────────────────────────────┤  z = -2  (near)
│  Layer 1: Cards, text blocks                │  speed: 1.0x (normal scroll)
├─────────────────────────────────────────────┤  z = -5  (mid)
│  Layer 2: 3D model / hero element           │  speed: 0.7x (slower)
├─────────────────────────────────────────────┤  z = -10 (far)
│  Layer 3: Ambient particles                 │  speed: 0.4x (much slower)
├─────────────────────────────────────────────┤  z = -20 (deep)
│  Layer 4: Background gradient / stars       │  speed: 0.1x (near-static)
└─────────────────────────────────────────────┘
```

### 3.2 Speed Ratios

| Layer | Scroll Speed | Content Type | Purpose |
|-------|-------------|--------------|---------|
| **0 — Fixed** | 0x (pinned) | Navigation, progress indicator | **Anchors the UI** — gives the visitor a stable reference frame |
| **1 — Content** | 1x (normal) | Text, cards, CTAs | **Readable layer** — moves at expected speed for readability |
| **2 — Subject** | 0.6–0.8x | 3D models, hero images | **Creates depth** — slightly slower movement separates subject from text |
| **3 — Atmosphere** | 0.3–0.5x | Particles, decorative shapes | **Environmental depth** — slow-moving elements feel far away |
| **4 — Background** | 0.05–0.15x | Gradients, star fields, nebula | **Infinite depth** — near-static background creates vast space illusion |

### 3.3 Implementation

```typescript
// CSS parallax (simple, performant)
function ParallaxLayer({ speed, children }: { speed: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const y = window.scrollY * (1 - speed); // speed < 1 = slower
      ref.current.style.transform = `translate3d(0, ${y}px, 0)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [speed]);

  return <div ref={ref} style={{ willChange: 'transform' }}>{children}</div>;
}

// 3D parallax (inside R3F canvas)
function ParallaxGroup({ speed, children }: { speed: number; children: React.ReactNode }) {
  const { scroll } = useScroll();
  const groupRef = useRef<THREE.Group>();

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.y = scroll.current * speed * 10;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}
```

---

## 4. Lighting Design

### 4.1 Lighting Rigs Per Act

> Lighting tells the visitor how to **feel**. It shifts between acts to match the emotional tone.

| Act | Mood | Key Light | Fill Light | Accent | Purpose |
|-----|------|-----------|-----------|--------|---------|
| **I: Hook** | Mysterious, intriguing | Dim spot from above (0.3) | Cool ambient (0.1) | Rim light on hero model (cyan) | **Creates intrigue** — low light invites exploration, like entering a dark theater |
| **II: Build** | Confident, revealing | Spot brightens (0.6) | Warm ambient (0.2) | Accent shifts to gold on features | **Builds confidence** — brighter light = nothing to hide, product is revealed |
| **III: Resolve** | Warm, decisive | Full key (0.8) | Warm fill (0.4) | CTA glows with accent gradient | **Drives action** — warm, full lighting feels safe and inviting for commitment |

### 4.2 Lighting Transitions

```typescript
// Scroll-driven lighting shift
function DynamicLighting() {
  const { scroll } = useScroll();
  const spotRef = useRef<THREE.SpotLight>();
  const ambientRef = useRef<THREE.AmbientLight>();

  useFrame(() => {
    const p = scroll.current;

    // Key light: dim → bright as visitor progresses
    if (spotRef.current) {
      spotRef.current.intensity = THREE.MathUtils.lerp(0.3, 0.8, p);
      // Shift color temperature: cool blue → warm gold
      const color = new THREE.Color().lerpColors(
        new THREE.Color('#4488FF'), // Act I: cool
        new THREE.Color('#FFD700'), // Act III: warm
        p
      );
      spotRef.current.color = color;
    }

    // Fill light: builds with scroll
    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(0.1, 0.4, p);
    }
  });

  return (
    <>
      <spotLight ref={spotRef} position={[0, 10, 5]} penumbra={1} castShadow />
      <ambientLight ref={ambientRef} />
    </>
  );
}
```

### 4.3 Lighting Rules

1. **Never use flat ambient-only lighting.** It kills depth. Always have at least one directional/spot light.
2. **Rim/back light separates subjects from background.** Without it, dark objects merge into dark backgrounds.
3. **Light changes must be gradual.** Abrupt shifts feel like bugs. Always lerp over 10–20% scroll range.
4. **Light guides the eye.** The brightest point in the scene should be where you want the visitor to look.
5. **Shadows create grounding.** Objects without shadows float unnaturally. Use contact shadows (low-cost) at minimum.

---

## 5. Particle Systems

### 5.1 Particle Types and Their Narrative Role

| Particle Type | Visual | Behavior | Story Purpose |
|--------------|--------|----------|---------------|
| **Ambient dust** | Tiny white dots, low opacity | Slow random drift | **World-building** — makes the space feel inhabited, not a void |
| **Energy trails** | Colored streaks along paths | Follow spline curves | **Guides the eye** — trails lead toward the next content section |
| **Attraction field** | Dots near cursor cluster toward it | Repel/attract on proximity | **Signals interactivity** — the world responds to the visitor |
| **Convergence burst** | Scattered dots fly to a focal point | Triggered on CTA visibility | **Focuses attention** — particles converge on the action point |
| **Data rain** | Vertical falling glyphs/dots | Constant downward flow | **Tech atmosphere** — communicates data/intelligence theme |
| **Constellation** | Connected dots forming shapes | Static with subtle pulse | **Structure revelation** — shows hidden connections in data |

### 5.2 Particle Budget

```
┌──────────────────────────────────────────────┐
│  PARTICLE LIMITS (for 60 FPS target)         │
│                                              │
│  Mobile:    200 particles max, no trails     │
│  Tablet:    500 particles, short trails      │
│  Desktop:   1500 particles, full trails      │
│  Low-perf:  0 particles (CSS gradient bg)    │
│                                              │
│  Per-particle cost:  1 draw call (instanced) │
│  Use InstancedMesh, NOT individual meshes    │
│  Texture:   Single 4x4 soft-circle atlas    │
│  Blending:  AdditiveBlending (glow effect)   │
└──────────────────────────────────────────────┘
```

### 5.3 Implementation Pattern

```typescript
function AmbientParticles({ count = 500 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>();
  const { scroll } = useScroll();
  const prefersReducedMotion = useReducedMotion();

  // Pre-compute random positions and velocities
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 10
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.002,
        Math.random() * 0.003,
        (Math.random() - 0.5) * 0.001
      ),
      scale: Math.random() * 0.5 + 0.1,
    }));
  }, [count]);

  useFrame(({ clock }) => {
    if (prefersReducedMotion || !mesh.current) return;

    const dummy = new THREE.Object3D();
    const time = clock.elapsedTime;

    particles.forEach((p, i) => {
      // Gentle sine-wave drift
      dummy.position.copy(p.position);
      dummy.position.x += Math.sin(time * 0.3 + i) * 0.5;
      dummy.position.y += Math.cos(time * 0.2 + i * 0.7) * 0.3;
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });

    mesh.current.instanceMatrix.needsUpdate = true;
  });

  if (prefersReducedMotion) return null;

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <circleGeometry args={[0.03, 6]} />
      <meshBasicMaterial
        color="#6C63FF"
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
```

### 5.4 Particle Rules

1. **Particles are environmental, not decorative.** They build atmosphere like fog in a film.
2. **Never let particles block content.** Keep opacity ≤ 0.4 and apply `depthWrite={false}`.
3. **Particles must respond to scroll or mouse.** Static random dots add nothing. Movement creates life.
4. **Kill particles on reduced-motion.** Replace with a subtle CSS gradient background.
5. **Use instanced rendering.** Individual particle meshes will destroy frame rate.

---

## 6. Depth Transitions

### 6.1 Scene-to-Scene Transitions

When the camera moves between scenes, transitions maintain spatial continuity:

| Transition | From → To | Effect | Purpose |
|-----------|-----------|--------|---------|
| **Depth dissolve** | Scene A → Scene B | Scene A fades while camera pushes through it | **Maintains spatial illusion** — visitor moves forward in space, not "page-changing" |
| **Fog reveal** | Hidden content | Fog density decreases on scroll, revealing objects | **Discovery** — content emerging from fog creates an "unveiling" moment |
| **Portal pass** | Act I → Act II | Camera moves through a geometric frame/ring | **Act break** — clear visual marker that the story has shifted |
| **Scale shift** | Micro → macro | Object grows from small detail to full scene | **Perspective change** — shows the same thing at different scales |
| **Light wipe** | Dark scene → lit scene | Light beam sweeps across, revealing the next section | **Dramatic reveal** — theatrical lighting change signals importance |

### 6.2 Implementation: Fog-Based Depth Transition

```typescript
function FogTransition({ startScroll, endScroll }: { startScroll: number; endScroll: number }) {
  const { scroll } = useScroll();
  const fogRef = useRef<THREE.Fog>();

  useFrame(() => {
    if (!fogRef.current) return;
    const p = scroll.current;

    if (p >= startScroll && p <= endScroll) {
      const localProgress = (p - startScroll) / (endScroll - startScroll);
      // Fog recedes as visitor scrolls through this range
      fogRef.current.near = THREE.MathUtils.lerp(0, 15, localProgress);
      fogRef.current.far = THREE.MathUtils.lerp(5, 50, localProgress);
    }
  });

  return <fog ref={fogRef} attach="fog" args={['#0A0A0F', 0, 5]} />;
}
```

### 6.3 Transition Rules

1. **Every transition must feel like movement through space.** Never hard-cut between scenes.
2. **Transitions happen over 5–15% scroll range.** Too fast = jarring. Too slow = boring.
3. **Maintain one constant element across transitions.** (e.g., particles persist, or a logo stays pinned). This prevents disorientation.
4. **Sound cues are welcome.** A subtle ambient tone shift on transition reinforces the spatial change. Keep sounds optional and respect muted preferences.

---

## 7. Interactive Scene Design

### 7.1 Interactive Elements

| Element | Interaction | Feedback | Story Purpose |
|---------|-------------|----------|---------------|
| **Hero model** | Mouse parallax (±2° tilt) | Model tilts toward cursor | **Engagement hook** — the first thing visitors do is move their mouse, and the world responds |
| **Feature hotspots** | Click to expand | Part highlights + info panel slides in | **Detail on demand** — visitors choose what to learn more about |
| **Material picker** | Click color swatch | 3D model material updates in real-time | **Personalization** — visitor sees the product in their preferred style |
| **Drag-rotate viewer** | Pointer drag | Model orbits with momentum + damping | **Ownership** — controlling the view creates a sense of possession |
| **Scroll speed zones** | Scroll velocity changes | Camera speed varies per section | **Pacing** — dense content slows the camera; transitions speed it up |
| **Hover reveal** | Pointer enters area | Hidden elements fade in with glow | **Rewarded curiosity** — exploring the scene reveals hidden details |

### 7.2 Interaction Design Rules

1. **First interaction must happen within 3 seconds.** The hero scene should respond to mouse movement immediately.
2. **Provide visual affordance.** If something is clickable, it should glow, pulse, or have a cursor change.
3. **Feedback must be instant (<100ms).** Delayed responses feel broken, not cinematic.
4. **Allow escape from every interaction.** Click-to-expand must have a clear close. Drag must release cleanly.
5. **Touch ≠ mouse.** On mobile: swap hover for tap, drag for swipe, parallax for gyroscope.

---

## 8. Scene Blueprints

### Scene 1: Arrival (0–15% scroll)

```
PURPOSE: Establish the world. Create intrigue. Hook in 3 seconds.

┌──────────────────────────────────────────────────┐
│                                                  │
│            [PARTICLES: sparse, drifting]          │
│                                                  │
│                ┌──────────────┐                   │
│                │  3D MODEL    │  ← idle float     │
│                │  (hero)      │  ← mouse parallax │
│                └──────────────┘                   │
│                                                  │
│         HEADLINE (slides up at T+400ms)           │
│         Subtitle (fades in at T+600ms)            │
│         [CTA Button] (fades in at T+800ms)        │
│                                                  │
│         ▼ Scroll indicator (pulses)               │
└──────────────────────────────────────────────────┘

CAMERA: Static at z=12, slowly pushes to z=8 as user scrolls
LIGHTING: Single cool-blue spot from above, dim ambient
PARTICLES: 30% of budget, slow drift, low opacity
INTERACTION: Model responds to mouse, CTA has hover glow
SOUND: Optional — low ambient hum fades in
```

### Scene 2: Promise (15–30% scroll)

```
PURPOSE: Answer "What does this do for me?" with a clear value prop.

┌──────────────────────────────────────────────────┐
│                                                  │
│    ┌────────────────┐    VALUE PROP TEXT          │
│    │  3D Model      │    ────────────────         │
│    │  rotates to    │    "One sentence benefit"   │
│    │  show feature  │                             │
│    │  angle         │    Supporting detail text    │
│    └────────────────┘                             │
│                                                  │
└──────────────────────────────────────────────────┘

CAMERA: Dolly left, revealing text alongside the model
LIGHTING: Key light brightens 30%, warm shift begins
PARTICLES: Energy trails flow from model toward text (guides eye)
TRANSITION IN: Fog lifts to reveal this section
```

### Scene 3–4: Showcase (30–55% scroll)

```
PURPOSE: Demonstrate features through spatial exploration.

┌──────────────────────────────────────────────────┐
│                                                  │
│   Feature 1          ┌───────────┐               │
│   description ──────▶│  MODEL    │               │
│                      │  rotates  │               │
│                      │  to show  │◀────── Feature 2
│                      │  each     │        description
│                      │  angle    │               │
│                      └───────────┘               │
│                                                  │
│   [Hotspot A]  [Hotspot B]  [Hotspot C]          │
│                                                  │
└──────────────────────────────────────────────────┘

CAMERA: Orbit around model, pausing at each feature angle
LIGHTING: Accent spot highlights active feature region
PARTICLES: Constellation lines connect feature dots
INTERACTION: Click hotspots → exploded view of that area
```

### Scene 5: Evidence (55–70% scroll)

```
PURPOSE: Build trust with numbers and proof.

┌──────────────────────────────────────────────────┐
│                                                  │
│   ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐           │
│   │ 99% │  │ 50K │  │ 4.9 │  │ 24h │           │
│   │ ▲▲▲ │  │ ▲▲▲ │  │ ▲▲▲ │  │ ▲▲▲ │           │
│   │uptime│  │users│  │stars│  │ sla │           │
│   └─────┘  └─────┘  └─────┘  └─────┘           │
│                                                  │
│        [Logo wall / trust badges]                │
│                                                  │
└──────────────────────────────────────────────────┘

CAMERA: Pulls back to wide shot (showing scale)
LIGHTING: Even, bright — nothing hidden
PARTICLES: Converge from edges toward the metrics
COUNTERS: Tick up from 0 when visible (2s, ease-out-expo)
```

### Scene 7: Decision (82–100% scroll)

```
PURPOSE: Convert. Camera stops. All focus on the CTA.

┌──────────────────────────────────────────────────┐
│                                                  │
│                                                  │
│           "Ready to get started?"                │
│                                                  │
│           ┌───────────────────────┐              │
│           │   ✨ START NOW ✨     │ ← pulsing     │
│           │      (CTA)           │   glow        │
│           └───────────────────────┘              │
│                                                  │
│           Secondary link                         │
│                                                  │
│      [ALL PARTICLES CONVERGE ON CTA]             │
│                                                  │
└──────────────────────────────────────────────────┘

CAMERA: Completely still. Settled at z=8.
LIGHTING: Warmest point in entire journey. Full key + fill.
PARTICLES: All remaining particles slowly drift toward CTA position.
INTERACTION: CTA has enhanced glow on hover, ripple on click.
PURPOSE OF STILLNESS: After minutes of camera movement, sudden
stillness creates dramatic weight. The visitor's attention has
nowhere to go except the CTA.
```

---

## 9. Performance Safeguards

### 9.1 Adaptive Quality Pipeline

```typescript
function useAdaptiveScene() {
  const quality = useAdaptiveQuality(); // from premium-3d-website skill

  return {
    particleCount: { high: 1500, medium: 500, low: 0 }[quality],
    shadows: quality !== 'low',
    postProcessing: quality === 'high',
    parallaxLayers: quality !== 'low' ? 4 : 2,
    cameraLerp: { high: 0.08, medium: 0.06, low: 0.1 }[quality],
    fogEnabled: quality !== 'low',
  };
}
```

### 9.2 Loading Strategy

| Phase | What Loads | When | Visible to User |
|-------|-----------|------|-----------------|
| **Critical** | HTML, CSS, fonts, hero image fallback | Immediately | Styled page in <1.5s |
| **3D Init** | Three.js core, canvas, basic geometry | After FCP | Placeholder → 3D fade-in |
| **Scene 1** | Hero model (Draco-compressed .glb) | After canvas ready | Loading shimmer → model appears |
| **Scene 2–4** | Showcase models, textures | When scroll > 10% | Lazy-loaded, fog hides loading |
| **Post-effects** | Bloom, vignette shaders | When scroll > 5% | Gradual intensity increase |

---

## Common Mistakes

1. **Moving the camera constantly.** Camera movement without content to reveal is nauseating. Every move must show something new.
2. **Too many particles.** More particles ≠ more premium. 500 well-placed particles beat 5000 random ones.
3. **Flat lighting.** If your entire scene uses only `ambientLight`, it will look like a PowerPoint. Use spots, rims, and color temperature shifts.
4. **Ignoring the hold.** The most powerful camera technique is **stopping**. Hold still at the CTA. Silence after noise commands attention.
5. **Forgetting mobile.** If the scene only works with a mouse, you've lost 60%+ of visitors. Design touch-first, enhance for mouse.
