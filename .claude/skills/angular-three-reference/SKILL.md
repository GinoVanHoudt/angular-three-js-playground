---
name: angular-three-reference
description: Use when working with the angular-three (NGT) library in this playground — building or explaining a scene, or looking up NGT building blocks like NgtCanvas, extend, provideNgtRenderer, the *canvas custom elements, attach, *args/NgtArgs, beforeRender, injectStore + store properties, pointer events, loaderResource / soba gltfResource, pick/omit/is, disposal, portals, or the soba/postprocessing/rapier/theatre/tweakpane packages.
---

# angular-three (NGT) reference

Reference for the **basic building blocks** of the `angular-three` (NGT) library. Extracted from the official docs at https://angularthree.org. Use it to answer "how do I …" and "what is …" questions and to write correct NGT code in this playground.

## Mental model

NGT is a **custom Angular renderer**: your Angular *template* IS the Three.js scene graph.

- A `<ngt-*>` element is a Three.js class, kebab-cased (`Mesh` → `<ngt-mesh>`). It must be registered with `extend()` first, and the host component needs `schemas: [CUSTOM_ELEMENTS_SCHEMA]`.
- Nesting attaches: a geometry/material inside a mesh auto-attaches to `.geometry`/`.material`.
- Element **inputs map to Three.js properties** (`[position]="[x,y,z]"`, `color="hotpink"`).
- Shared render loop via `beforeRender(cb)`; shared state via `injectStore()`.
- The renderer disposes Three.js objects automatically when elements leave the DOM.

If you understand those five lines, everything below is detail.

## Where things live

| You want to… | Building block | Import from |
|---|---|---|
| Install the renderer | `provideNgtRenderer()` | `angular-three` (in `app.config.ts`) |
| Host the WebGL canvas | `NgtCanvas` + `*canvasContent` | `angular-three/dom` |
| Register Three classes as elements | `extend()` | `angular-three` |
| Pass constructor args to an element | `NgtArgs` → `*args="[...]"` | `angular-three` |
| Run code every frame | `beforeRender(cb)` | `angular-three` |
| Read canvas state (scene/camera/gl/size…) | `injectStore()` | `angular-three` |
| Wrap an existing Three object | `<ngt-primitive *args="[obj]">` | `angular-three` (NgtArgs) |
| Set a deep/raw property declaratively | `<ngt-value [rawValue]="…" attach="…">` | `angular-three` |
| Attach outside the template tree | `NgtParent` → `*parent="…"` | `angular-three` |
| Render a second scene (HUD/mini-map) | `NgtPortal` / `NgtPortalAutoRender` | `angular-three` |
| Route between 3D scenes | `NgtRoutedScene` | `angular-three` |
| Load assets (generic) | `loaderResource(...)` | `angular-three` |
| Load GLTF / textures (recommended) | `gltfResource` / `textureResource` | `angular-three-soba/loaders` |
| Derive signals from object inputs | `pick()`, `omit()`, `mergeInputs()` | `angular-three` |
| Type-guard Three objects | `is.*` | `angular-three` |
| Selection for postprocessing effects | `NgtSelection` / `NgtSelect` | `angular-three` |

## Quick reference — custom elements

```
Three.js class            →  element
Mesh                      →  <ngt-mesh>
BoxGeometry               →  <ngt-box-geometry>
MeshStandardMaterial      →  <ngt-mesh-standard-material>
AmbientLight / SpotLight  →  <ngt-ambient-light> / <ngt-spot-light>
Vector2 (as an arg)       →  <ngt-vector2 *args="[...]">
```
Register first: `extend(THREE)` (whole lib) or `extend({ Mesh, BoxGeometry })` (selective).

## Minimal scene skeleton

```typescript
// app.config.ts
providers: [provideNgtRenderer()]

// app.ts  (imports: [NgtCanvas, SceneGraph])
template: `<ngt-canvas [camera]="{ position: [5,5,5] }"><app-scene-graph *canvasContent /></ngt-canvas>`

// scene-graph.ts  (schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [NgtArgs])
template: `
  <ngt-ambient-light [intensity]="0.5" />
  <ngt-mesh [position]="[0,1,0]" (click)="clicked.set(!clicked())">
    <ngt-box-geometry *args="[1,1,1]" />
    <ngt-mesh-standard-material color="mediumpurple" />
  </ngt-mesh>`
// in the class:  beforeRender(({ delta }) => this.meshRef().nativeElement.rotation.y += delta);
```

## Detailed reference

For the full API of every building block — exact signatures, the complete store property list, all pointer events + `NgtThreeEvent` fields, `attach` variants (dotted paths, arrays, `createAttachFunction`), pierced properties, loaders, portals, disposal, and the plugin ecosystem (soba / postprocessing / rapier / theatre / tweakpane) — read **[core-reference.md](./core-reference.md)**.

Every section there links to its official docs page under https://angularthree.org for anything not covered.

## Teaching note

This is a *learning* playground (see project CLAUDE.md). When answering, explain the Three.js/NGT concept behind the API before or alongside the code, and prefer guiding the user to the right APIs over dropping in complete solutions — unless they ask you to just write it.
