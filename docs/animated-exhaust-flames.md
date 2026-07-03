# Animated exhaust flames — build guide

Add a flickering flame to the bottom of the spaceship's engine.
Everything below lives in `src/app/stars/scene-graph.ts` and hangs off the
existing `<ngt-group #ship>`.

## The core concept: fake fire is cheap

Real fire in a 3D engine means particles or a custom shader — a big jump in
concepts. We're going to **fake it** with one trick that carries most of the
look: an inverted cone that **glows** via *additive blending* and **flickers**
by mutating its scale every frame. That's the whole idea. Two new Three.js
concepts, no new geometry types:

- **Additive blending** — instead of the flame's color *replacing* what's
  behind it, its RGB is *added* to the pixels underneath. Bright-on-dark reads
  as light emitting from the flame, and overlapping flame brightens toward
  white-hot. This is how almost every cheap glow/fire/laser effect is done.
- **Per-frame scale flicker** — you already spin and bob the ship in
  `beforeRender`. Flicker is the same move applied to `scale`.

`Mesh`, `ConeGeometry`, and `MeshBasicMaterial` are **already registered** and
`NgtArgs` is already imported — nothing new to `extend()`.

---

## Step 1 — orient a cone to point *down*

The nose cone taught us: a `ConeGeometry` points **+Y by default** (tip up).
The flame is the same cone flipped so the tip trails **down and away** from the
engine — rotate it 180° about X.

`Math` isn't available in templates (see the flying-spaceship gotcha), so define
the constant as a class field:

```ts
protected readonly flip = Math.PI; // 180° — points the flame cone downward
```

## Step 2 — position it at the exhaust

The body cylinder is height `0.5` centered at the origin, so its **bottom sits
at `y = -0.25`** in the ship's local space. Give the flame a cone of height
`0.3` — after flipping, its base is on the `+Y` side, so to seat the base flush
against the body bottom, put the mesh center half a flame lower:
`-0.25 - 0.15 = -0.4`.

Drop this **inside** `<ngt-group #ship>` (so it inherits the ship's bob and
spin for free), after the fins:

```html
<!-- exhaust flame: an inverted cone at the engine bottom -->
<ngt-mesh #flame [position]="[0, -0.4, 0]" [rotation]="[flip, 0, 0]">
  <ngt-cone-geometry *args="[0.08, 0.3, 16]" />
  <ngt-mesh-basic-material
    color="orange"
    [transparent]="true"
    [opacity]="0.9"
    [depthWrite]="false"
    [blending]="additiveBlending"
  />
</ngt-mesh>
```

Why those three material flags travel together for glows:

- `transparent: true` + `opacity` — lets what's behind show through.
- `depthWrite: false` — a transparent flame shouldn't stamp the depth buffer,
  or it'll punch a hole over things drawn after it. Standard for glow sprites.
- `blending` — the additive constant below.

## Step 3 — turn on additive blending

`AdditiveBlending` is a numeric constant exported from `three` (not a class, so
it's not `extend`ed — you just bind its value). Add to the import and expose it:

```ts
import { AdditiveBlending /* ...existing three imports */ } from 'three';
```

```ts
protected readonly additiveBlending = AdditiveBlending;
```

At this point you have a static orange glowing cone. Now make it live.

## Step 4 — make it flicker (`beforeRender`)

Grab the flame mesh with a `viewChild`, same as `shipRef`:

```ts
private flameRef = viewChild.required<ElementRef<Mesh>>('flame');
```

Then animate its scale. The look comes from mixing **two motions**: a steady
`Math.sin` pulse (regular breathing) plus **per-frame `Math.random()` jitter**
(the irregular, alive-looking flicker). Add a `beforeRender` (or fold it into an
existing one):

```ts
beforeRender(({ clock }) => {
  const flame = this.flameRef().nativeElement;
  const t = clock.elapsedTime;

  // length: steady pulse + random jitter → an unsteady, licking flame
  flame.scale.y = 1 + Math.sin(t * 25) * 0.2 + Math.random() * 0.15;

  // width wobbles on a different frequency so it doesn't feel rigid
  flame.scale.x = flame.scale.z = 1 + Math.sin(t * 17) * 0.1;
});
```

`clock.elapsedTime` (total seconds) drives the sine; `Math.random()` is fine in
the render loop (unlike in a template). Different multipliers on the sines
(`25` vs `17`) keep length and width from moving in lockstep.

---

## Optional — a hot inner core

Additive blending's payoff: overlap two flames and the shared area brightens.
Nest a smaller, brighter cone inside the first to fake a white-hot core — same
mesh, smaller radius/height, yellow, and give it its own `#flame` ref or let it
ride the outer one's transform. This is the single best reason to bother with
additive blending, so it's worth seeing.

```html
<ngt-mesh [position]="[0, 0.04, 0]" [scale]="0.6">
  <ngt-cone-geometry *args="[0.08, 0.3, 16]" />
  <ngt-mesh-basic-material
    color="yellow" [transparent]="true" [opacity]="0.9"
    [depthWrite]="false" [blending]="additiveBlending"
  />
</ngt-mesh>
```

Nest it *inside* the outer `#flame` mesh so it flickers with the parent — the
child's transform is relative to the parent (the same Group lesson, applied to a
mesh).

## Gotchas

- **All-white flame?** Additive blending never darkens — on a bright background
  it just washes out. It only reads as fire against a **dark** scene (which the
  starfield gives you). Keep colors punchy; additive shifts everything lighter.
- **Flame looks like it's cutting through the ship or stars?** That's the depth
  buffer — confirm `depthWrite: false` is set. If it still z-fights, it's being
  drawn in an odd order; nudge the flame slightly forward or lower its opacity.
- **`Math` in the template.** Same rule as before — `[rotation]="[Math.PI,0,0]"`
  won't compile. Bind the `flip` field. `Math.random()`/`Math.sin()` in the
  `.ts` render loop are fine.
- **Flicker too twitchy or too calm?** It's all in the numbers: bigger
  `Math.random()` coefficient = more chaos; higher sine multiplier = faster
  pulse; smaller amplitudes = a steadier burn.
```
