# Flying spaceship — build guide

Add a spaceship that hovers and spins at the center of the `stars` scene.
Everything below lives in `src/app/stars/scene-graph.ts`.

## The core concept: a Group

A spaceship is several meshes (nose, body, wings) that must move as one. That's
`THREE.Group` — an `Object3D` with **no geometry of its own**, just a container.
Child transforms are **relative to the group's local space**, so you position each
part relative to the ship, then fly the whole ship by animating the group.

`<ngt-group>` is already registered (the starfield uses it).

---

## Step 1 — register the new geometries

Nose = cone, body = cylinder, wings = boxes. Every `<ngt-*>` element needs its
class registered with `extend()` first. Update the imports and the `extend` call:

```ts
import { Mesh, BoxGeometry, MeshBasicMaterial, ConeGeometry, CylinderGeometry, Group } from 'three';
```

```ts
extend({ Mesh, BoxGeometry, MeshBasicMaterial, ConeGeometry, CylinderGeometry });
```

## Step 2 — enable constructor args (`*args`)

Geometries take constructor arguments (a cylinder is
`radiusTop, radiusBottom, height, radialSegments`). In NGT you pass them with the
`*args` structural directive. Import it and add it to the component `imports`:

```ts
import { NgtArgs } from 'angular-three';
```

```ts
imports: [
  NgtsPointsBuffer,
  NgtsPointMaterial,
  NgtsOrbitControls,
  NgtArgs,
],
```

Geometry and material **auto-attach** to their parent mesh — no `attach=` needed.

## Step 3 — build the ship (template)

Cones and cylinders both point along **+Y by default** (cone tip up, cylinder axis
vertical) — that's why the nose needs no rotation, you just stack it on top of the
body along Y. Drop this inside the template, after the `<ngt-group>` starfield:

```html
<ngt-group #ship>
  <!-- body: vertical cylinder centered at origin -->
  <ngt-mesh>
    <ngt-cylinder-geometry *args="[0.1, 0.1, 0.5, 16]" />
    <ngt-mesh-basic-material color="silver" />
  </ngt-mesh>

  <!-- nose: cone sits on top of the body -->
  <!-- y = half body (0.25) + half cone (0.125) = 0.375 -->
  <ngt-mesh [position]="[0, 0.375, 0]">
    <ngt-cone-geometry *args="[0.1, 0.25, 16]" />
    <ngt-mesh-basic-material color="crimson" />
  </ngt-mesh>

  <!-- wings: two boxes offset on ±X -->
  <ngt-mesh [position]="[0.2, -0.15, 0]">
    <ngt-box-geometry *args="[0.3, 0.02, 0.15]" />
    <ngt-mesh-basic-material color="steelblue" />
  </ngt-mesh>
  <ngt-mesh [position]="[-0.2, -0.15, 0]">
    <ngt-box-geometry *args="[0.3, 0.02, 0.15]" />
    <ngt-mesh-basic-material color="steelblue" />
  </ngt-mesh>
</ngt-group>
```

The nose `y` is worked out from local space: body height `0.5` → its top is at
`y=0.25`; cone height `0.25` → its center sits half a cone higher → `0.375`.

## Step 4 — make it fly (`beforeRender`)

Grab the group with a `viewChild` (like `pointsBufferRef`), then animate it.
Two time sources, and which you use matters:

- **`delta`** = seconds since last frame → spin (`delta * speed` is frame-rate independent).
- **`clock.elapsedTime`** = total seconds → feed `Math.sin()` for a smooth bob.

Add the field:

```ts
private shipRef = viewChild.required<ElementRef<Group>>('ship');
```

```ts
import { CUSTOM_ELEMENTS_SCHEMA, Component, viewChild, ElementRef } from '@angular/core';
```

Then animate — either add these lines to the existing `beforeRender`, or add a
second `beforeRender` call:

```ts
beforeRender(({ delta, clock }) => {
  const ship = this.shipRef().nativeElement;
  ship.rotation.y += delta * 0.5;                      // slow spin
  ship.position.y = Math.sin(clock.elapsedTime) * 0.1; // hover bob
});
```

---

## Gotchas

- **`Math` isn't available in templates.** You can't write `[rotation]="[Math.PI/2, 0, 0]"`
  inline. If you need a rotation constant in the template, define it as a class field
  (`protected readonly halfPi = Math.PI / 2;`) and bind that. In the `.ts` render loop, `Math` is fine.
- **Too big?** Camera is at `z=1`, so a ~0.75-tall ship at the origin fills the view.
  Add `[scale]="0.5"` on the `<ngt-group>` — another thing a group gives you for free.
