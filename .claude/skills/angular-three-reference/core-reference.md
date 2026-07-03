# angular-three (NGT) — core building blocks reference

Detailed reference for the core `angular-three` library. Each section links its official docs page. Package: `angular-three` (renderer + core) and `angular-three/dom` (DOM canvas). Requires `three` (and `@types/three` for typings).

---

## 1. Setup & wiring

Docs: https://angularthree.org/learn/getting-started/installation/ · https://angularthree.org/learn/basics/app-structure/

Three pieces wire NGT into an Angular app:

1. **`provideNgtRenderer()`** in `app.config.ts` installs the custom renderer.
   ```typescript
   import { provideNgtRenderer } from 'angular-three';
   export const appConfig: ApplicationConfig = {
     providers: [provideNgtRenderer(), /* … */],
   };
   ```

2. **`NgtCanvas`** (from `angular-three/dom`) hosts the WebGL canvas. It creates the 3 core Three.js building blocks — a `WebGLRenderer`, a default `Scene`, and a default `PerspectiveCamera` — auto-sizes to its parent, and exposes the **store** via DI. Scene content is projected with the **`*canvasContent`** structural directive.
   ```typescript
   @Component({
     template: `<ngt-canvas [camera]="{ position: [5, 5, 5] }" [lookAt]="[0, 1, 0]" shadows>
                  <app-scene-graph *canvasContent />
                </ngt-canvas>`,
     imports: [NgtCanvas, SceneGraph],
   })
   export class App {}
   ```
   **Exact inputs** (all optional signal inputs, from `angular-three@4.2.2` type defs — `NgtCanvasImpl`, selector `ngt-canvas`):

   | Input | Type |
   |---|---|
   | `[gl]` | `NgtGLOptions` — WebGLRenderer options / factory |
   | `[size]` | `NgtSize` — override auto-measured canvas size |
   | `[shadows]` | `NgtShadows` — `boolean` \| shadow-map type \| config (coerced) |
   | `[legacy]` | `boolean` — disable r139 ColorManagement (coerced) |
   | `[linear]` | `boolean` — LinearSRGB colorspace (coerced) |
   | `[flat]` | `boolean` — NoToneMapping (coerced) |
   | `[orthographic]` | `boolean` — use an OrthographicCamera as default (coerced) |
   | `[frameloop]` | `NgtFrameloop` — `'always'` \| `'demand'` \| `'never'` |
   | `[performance]` | `Partial<Omit<NgtPerformance,'regress'>>` — adaptive-perf bounds |
   | `[dpr]` | `NgtDpr` — device pixel ratio (`number` or `[min, max]`) |
   | `[raycaster]` | `Partial<THREE.Raycaster>` |
   | `[scene]` | `THREE.Scene` \| `Partial<THREE.Scene>` — override/config default scene |
   | `[camera]` | `NgtCamera \| NgtCameraParameters` — override/config default camera |
   | `[events]` | pointer-events factory (`typeof createPointerEvents`) |
   | `[eventSource]` | `HTMLElement \| ElementRef` — DOM node to bind events to |
   | `[eventPrefix]` | `NgtEventPrefix` — which offset coords to use |
   | `[lookAt]` | `number \| THREE.Vector3 \| [x, y, z]` — point the default camera at |

   **Outputs:** `(created)` → `NgtState` (fires once the renderer/scene/camera exist), `(pointerMissed)` → `MouseEvent` (clicked canvas, hit nothing).

3. **SceneGraph component** — put your scene in a child component rendered with `*canvasContent`. This child sits *inside* NgtCanvas's provider tree, so `injectStore()` and other NGT APIs work there. It needs `schemas: [CUSTOM_ELEMENTS_SCHEMA]`.

> ⚠️ Using `injectStore()` / NGT APIs *outside* the NgtCanvas provider tree throws **"No provider for NGT_STORE"**. The `*canvasContent` directive is what scopes the provider correctly.

**Install:** easiest is the template repo `angular-threejs/template`. Manual: `npm i -D angular-three-plugin` then `ng generate angular-three-plugin:init` (or `nx generate …`). Add auxiliary packages (soba, postprocessing, …) with `ng g angular-three-plugin:aux`. The `:init` schematic also configures the editor to recognize `ngt-*` elements via a `metadata.json`.

---

## 2. The renderer: elements, `extend`, `attach`, bindings

Docs: https://angularthree.org/reference/core/renderer/

### `extend()` — register Three classes as elements
```typescript
import { extend } from 'angular-three';
import * as THREE from 'three';

extend(THREE);                              // register the whole THREE namespace
extend({ Mesh, MeshBasicMaterial, LOD });  // or selectively
extend({ MyMesh: Mesh });                   // alias → <ngt-my-mesh>
```
PascalCase class name → kebab-case tag: `Mesh` → `<ngt-mesh>`, `MeshBasicMaterial` → `<ngt-mesh-basic-material>`. (Acronyms follow the raw casing, e.g. `LOD` → `<ngt-lOD>`.) Host component must set `schemas: [CUSTOM_ELEMENTS_SCHEMA]`.

### `attach` — where a child connects on its parent
```typescript
<ngt-mesh>
  <ngt-box-geometry attach="geometry" />        <!-- auto for all geometries -->
  <ngt-mesh-basic-material attach="material" /> <!-- auto for all materials -->
</ngt-mesh>
```
- **Auto-attach:** geometries → `.geometry`, materials → `.material` (no `attach` needed).
- **Dotted path:** `<ngt-vector2 *args="[2048,2048]" attach="shadow.mapSize" />`.
- **Indexed / array:** `[attach]="['material', $index]"` for multi-material meshes.
- **Function:** `createAttachFunction<Child, Parent>(({ parent, child }) => { …; return () => {/* detach */}; })` for custom attach/detach, then `[attach]="attachFn"`.

### Property binding → Three.js properties
```typescript
<ngt-mesh [position]="[1,2,3]" [scale]="1.5" [rotation]="rot" castShadow />
```
- Vectors accept a tuple `[x,y,z]` or copy from a `Vector3`. Colors accept string / hex / rgb / `Color`.
- **Pierced properties** set nested values directly: `[position.y]="-0.5"`, `[rotation.x]="-Math.PI/2"`. Best for stable built-ins (position/rotation/scale); avoid piercing external material props (timing issues).
- **`[parameters]="{…}"`** bulk-assigns many properties at once: `[parameters]="{ color:'hotpink', side: BackSide, transparent: true }"`.

### Element events
- **Three native events:** `(added)`, `(removed)`, `(childadded)`, `(childremoved)`, `(change)`, `(disposed)`.
- **NGT lifecycle events:** `(created)` (instantiated, pre-attach), `(attached)` (attached to parent — fires even for non-Object3D like materials; `$event` is `NgtAfterAttach` with `{ parent, node }`), `(updated)` (a binding changed).
- **Pointer events:** see §6.

---

## 3. Constructor args — `NgtArgs` (`*args`)

Docs: https://angularthree.org/reference/core/args/

Some Three classes need **constructor arguments** (`BoxGeometry(w,h,d)`, `OrbitControls(camera, dom)`). `*args` supplies them as an array. When the array changes, NGT disposes the old object, detaches it, and re-creates it with the new args.
```typescript
import { NgtArgs } from 'angular-three';

<ngt-box-geometry *args="[width, height, depth]" />
<ngt-instanced-mesh *args="[undefined, undefined, count]">
  <ngt-box-geometry />
  <ngt-mesh-standard-material />
</ngt-instanced-mesh>
<ngt-vector2 *args="[2048, 2048]" attach="shadow.mapSize" />
```
Type it with `ConstructorParameters<typeof THREE.BoxGeometry>`.

---

## 4. `ngt-primitive` and `ngt-value`

**`ngt-primitive`** — Docs: https://angularthree.org/reference/core/primitive/
Wrap a **pre-existing Three.js object** (e.g. a loaded GLTF scene) into the scene graph. Requires `*args="[theObject]"`. Forward props via `[parameters]`. **No automatic disposal** (NGT didn't create it).
```typescript
<ngt-primitive *args="[gltf.scene()]" [parameters]="{ scale: 0.0075 }" />
```

**`ngt-value`** — Docs: https://angularthree.org/reference/core/raw-value/
Declaratively set a **deep/raw property** without a `ViewChild`. Uses `attach` for the path and `[rawValue]` (reactive) for the value.
```typescript
<ngt-mesh [geometry]="gltf.nodes.model.geometry" [material]="gltf.materials.mat">
  <ngt-value rawValue="green" attach="material.color" />
</ngt-mesh>
```

---

## 5. State — `injectStore()` and the store

Docs: https://angularthree.org/reference/core/store/

`const store = injectStore();` gives the canvas store (an ngrx SignalStore). Read as **signals** (`store.gl()`), nested signals (`store.size.width()`), or non-reactive **snapshot** (`store.snapshot.camera`, `store.snapshot.invalidate()`).

| Property | What it is |
|---|---|
| `gl` | `THREE.WebGLRenderer` |
| `scene` | root `THREE.Scene` |
| `camera` | default camera |
| `raycaster` | `THREE.Raycaster` for intersection tests |
| `clock` | `THREE.Clock` |
| `pointer` | normalized pointer coords (`Vector2`) |
| `size` | reactive canvas pixel size |
| `viewport` | reactive size in three units (+ `getCurrentViewport()`) |
| `events` | event manager (handlers, connected nodes; `events.update?.()`) |
| `controls` | active controls or `null` |
| `xr` | XR interface |
| `frameloop` | render-loop flags |
| `performance` | adaptive performance interface |
| `legacy` / `linear` / `flat` | color-management / colorspace / tonemapping flags |
| `invalidate()` | flag the canvas to render (on-demand) |
| `advance()` | render one step |
| `setSize()` / `setDpr()` / `setFrameloop()` / `setEvents()` | manual setters |
| `pointerMissed$` | observable: canvas clicked, nothing hit |
| `previousRoot` / `internal` / `id` | plumbing |

---

## 6. Frame loop — `beforeRender`

Docs: https://angularthree.org/reference/core/before-render/

Register a per-frame callback (the animation loop). The callback gets `NgtRenderState` = the whole store state **plus** `delta` (seconds since last frame) and optional `frame?: XRFrame`.
```typescript
beforeRender(({ delta, camera, clock, gl, scene, pointer }) => {
  mesh.rotation.y += delta;               // frame-rate-independent
});
```
Options: `{ priority }` (lower runs earlier; accepts `Signal<number>`) and `{ injector }` (needed outside an injection context). Auto-unsubscribes via `DestroyRef`.

> Prefer `delta` or `clock.elapsedTime` for time-based motion rather than `Date.now()`.

---

## 7. Pointer events

Docs: https://angularthree.org/learn/basics/handling-events/

Bind like normal Angular events on any raycastable element:
```typescript
<ngt-mesh (click)="onClick($event)" (pointerover)="onOver($event)" />
```
Supported: `click`, `dblclick`, `contextmenu`, `pointerdown`, `pointerup`, `pointermove`, `pointerover`, `pointerout`, `pointerenter`, `pointerleave`, `pointercancel`, `pointermissed`, `wheel`.

`$event` is **`NgtThreeEvent<T>`** with: `eventObject` (handler's object), `intersections`, `unprojectedPoint` (`Vector3`), `pointer` (`Vector2`), `delta`, `ray`, `camera`, `nativeEvent`, `stopped`, and `stopPropagation()`.
```typescript
onOver(e: NgtThreeEvent<PointerEvent>) { e.stopPropagation(); }
// pointer capture:
onDown(e: NgtThreeEvent<PointerEvent>) { e.target.setPointerCapture(e.nativeEvent.pointerId); }
// force a raycast recompute (e.g. moving camera):  beforeRender(({ events }) => events.update?.());
```

---

## 8. Loading assets

Docs: https://angularthree.org/learn/basics/loading-assets/ · https://angularthree.org/reference/core/loader/

### `loaderResource` (core, generic)
Wraps any Three `Loader` in Angular's Resource API — returns a `ResourceRef` with automatic caching.
```typescript
import { loaderResource } from 'angular-three';
gltf = loaderResource(() => GLTFLoader, () => './model.gltf', {
  extensions: (loader) => loader.setDRACOLoader(draco), // configure the loader
  onProgress: (e) => {},
  onLoad: (data) => {},
});
```
- Input can be a single path, an **array**, or a **dictionary** — `value()` mirrors that shape.
- Signals: `value()` (undefined until loaded), `isLoading()`, `error()`, `status()`.
- `loaderResource.preload(GLTFLoader, 'model.gltf')` — preload (raw values, not reactive).
- Guard in template: `@if (gltf.value(); as model) { <ngt-primitive *args="[model.scene]" /> }`.

### soba loaders (recommended for GLTF/textures)
```typescript
import { gltfResource, textureResource } from 'angular-three-soba/loaders';
import { animations } from 'angular-three-soba/misc';

gltf = gltfResource(() => modelUrl);                 // + automatic object-graph traversal
textures = textureResource(() => ({ map: 'albedo.jpg', bumpMap: 'bump.jpg' }), {
  onLoad: (t) => { t.colorSpace = THREE.SRGBColorSpace; },
});
```
For model animations, `animations(gltf.value, gltf.scene)` gives `{ actions, isReady, … }`. To edit model parts, generate components from a GLTF with the `angular-three-plugin:gltf` schematic.

---

## 9. Object inputs — `pick`, `omit`, `mergeInputs`, `is`

Docs: https://angularthree.org/reference/core/pick/ · /omit/ · /is/

Pattern for component options: an object `input()` transformed with `mergeInputs(defaults)`, then split into primitive signals so change detection is cheap.
```typescript
options = input(defaults, { transform: mergeInputs(defaults) });
foo = pick(this.options, 'foo');          // Signal<foo>
both = pick(this.options, ['a', 'b']);    // Signal<{a,b}>  (shallow-equal)
rest = omit(this.options, ['foo', 'bar']); // Signal<object> without those keys
```
Both `pick`/`omit` take an optional custom equality fn as the last arg.

**`is`** — type guards using Three's `is*` flags (no `instanceof`): `is.object3D`, `is.material`, `is.geometry`, `is.camera`, `is.perspectiveCamera`, `is.orthographicCamera`, `is.scene`, `is.renderer`, `is.three(value, 'isMesh')`, and `is.equ(a, b, { arrays, objects, strict })` for deep-equality.

---

## 10. Disposal

Docs: https://angularthree.org/learn/basics/disposing-objects/

NGT calls `.dispose()` automatically on destroyed elements and their children — including elements removed by `@if`/`@for`. Opt out with `[dispose]="null"`. `ngt-primitive` is **not** auto-disposed. Resource functions (`textureResource`, etc.) manage their own disposal. For custom cleanup use `inject(DestroyRef).onDestroy(() => …)`.

---

## 11. Advanced structural blocks

- **`NgtParent`** (`*parent="…"`) — Docs: https://angularthree.org/reference/core/parent/
  Attach a template's objects to a parent *outside* the normal hierarchy (e.g. across a `router-outlet`). Accepts a name string (looked up via `getObjectByName`), `Object3D`, `ElementRef<Object3D>`, or a `Signal` of those. `<ngt-group *parent="parentSignal"> … </ngt-group>`.

- **`NgtPortal`** (`<ngt-portal [container]="scene">`) — Docs: https://angularthree.org/reference/core/portal/
  Off-screen buffer / secondary scene (HUD, mini-map). Creates a *layered store* with its own scene, pointer, raycaster, events, viewport. Content goes in `<ng-template portalContent>`. Add `autoRender` (`NgtPortalAutoRender` directive) for automatic rendering; `[autoRender]` priority: `1` clears+renders main scene first, higher renders on top without clearing.

- **`NgtRoutedScene`** — Docs: https://angularthree.org/reference/core/routed-scene/
  Wraps `RouterOutlet` for routing between 3D scenes. `<ngt-canvas><ngt-routed-scene *canvasContent /></ngt-canvas>` + normal Angular routes.

- **`NgtSelection` / `NgtSelect`** — Docs: https://angularthree.org/reference/core/selection/
  Declarative object selection, usually feeding postprocessing (`NgtpOutline`, selective bloom). Enable via `hostDirectives: [NgtSelectionApi]` (whole graph) or `<ng-container selection>` (scoped). Mark objects with `[select]="bool"` on `ngt-mesh`/`ngt-group` (`ngt-group` selects all children).

---

## 12. Plugin ecosystem (auxiliary packages)

Add with `ng g angular-three-plugin:aux`. Not "core" but the everyday helpers.

| Package | Import pattern | What it gives you |
|---|---|---|
| **angular-three-soba** | `angular-three-soba/<category>` | The big helper kit (see sub-paths below). |
| **angular-three-postprocessing** | `angular-three-postprocessing` | `NgtpEffectComposer` + effects: `NgtpBloom`, `NgtpOutline`, vignette, DoF, chromatic aberration, FXAA, god rays, glitch, pixelation, N8AO, … |
| **angular-three-rapier** | `angular-three-rapier` | Physics (Rapier) integration. |
| **angular-three-theatre** | `angular-three-theatre` | Animation / sequencing (Theatre.js). |
| **angular-three-tweakpane** | `angular-three-tweakpane` | Interactive parameter GUI (Tweakpane). |

### soba sub-paths (classes prefixed `Ngts`, elements `ngts-*`)
```typescript
import { NgtsOrbitControls } from 'angular-three-soba/controls';  // <ngts-orbit-controls />
```
| Sub-path | Contents |
|---|---|
| `angular-three-soba/controls` | `OrbitControls`, `CameraControls`, `PointerLockControls`, … |
| `angular-three-soba/cameras` | `PerspectiveCamera`, `OrthographicCamera`, `CubeCamera` |
| `angular-three-soba/staging` | `Environment`, `Sky`, `Stage`, `Center`, lighting helpers |
| `angular-three-soba/abstractions` | `Text3D`, `RoundedBox`, `Grid`, `Edges`, `Billboard` |
| `angular-three-soba/materials` | `MeshReflectorMaterial`, `CustomShaderMaterial`, `DistortMaterial`, … |
| `angular-three-soba/loaders` | `gltfResource`, `textureResource`, fonts, FBX |
| `angular-three-soba/gizmos` | `TransformControls`, pivot controls |
| `angular-three-soba/performances` | `Instances`, BVH, `AdaptiveDpr` |
| `angular-three-soba/misc` | `animations`, HTML, decals, sampling, shadows |

Docs index: https://angularthree.org/reference/soba/introduction/ (and sibling `/reference/<pkg>/introduction/`).

---

## 13. Testing

`angular-three/testing` provides a harness for unit-testing scenes. Docs under the Core reference sidebar (`angular-three/testing`).
