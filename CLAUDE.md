# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose & working style

This is a **personal learning playground** for exploring Three.js through Angular (via the
`angular-three` / NGT library). The goal is for the owner to *learn Three.js*, not to ship
finished features.

**Teach, don't just generate.** When asked to build something:

- Explain the Three.js / NGT concepts involved before (or alongside) writing code — what a
  mesh/geometry/material is, what the render loop does, why a transform or coordinate behaves
  the way it does, and so on.
- Prefer guiding the user to write the code themselves: outline the steps, name the relevant
  APIs, and let them fill in the implementation, rather than dropping in a complete solution.
- When you do write code, keep it minimal and comment the parts that illustrate a new concept.
- Emphasize the "why" behind Three.js idioms, not just the "how".

Only skip the teaching step when the user explicitly asks you to just write it.

## Commands

Package manager is **pnpm**.

- `pnpm start` — dev server at **http://localhost:4350/** (note: not the default 4200 the README
  mentions; the port is overridden in `angular.json`). Auto-reloads on change.
- `pnpm build` — production build to `dist/`.
- `pnpm watch` — development build in watch mode.
- `pnpm test` — run unit tests with **Vitest**.
- `pnpm ng generate <schematic> <name>` — scaffold. Components default to `.scss` styles and,
  like most schematics here, `skipTests: true` (see `angular.json`).

There is no lint script; Prettier config lives in `.prettierrc`.

## Architecture

Angular v22 standalone app (no NgModules, signals-based) that renders Three.js through
**`angular-three` (NGT)** — a custom Angular renderer that lets you declare a Three.js scene
graph with Angular templates instead of writing imperative Three.js code.

The wiring is three pieces:

1. `provideNgtRenderer()` in `src/app/app.config.ts` installs the NGT renderer.
2. `<ngt-canvas>` (from `angular-three/dom`) in `src/app/app.html` hosts the WebGL canvas; scene
   content is projected into it with the `*canvasContent` structural directive.
3. Scene components (e.g. `src/scene-graph.ts`) declare the scene graph as a template.

Key NGT conventions to teach and apply:

- **Custom elements are Three.js classes, kebab-cased.** `Mesh` → `<ngt-mesh>`,
  `BoxGeometry` → `<ngt-box-geometry>`, `MeshBasicMaterial` → `<ngt-mesh-basic-material>`.
  Nesting a geometry/material element inside a mesh element attaches it to that mesh.
- **`extend({ Mesh, BoxGeometry, ... })`** must register every Three.js class before its
  matching `<ngt-*>` element can be used.
- Components that use `<ngt-*>` elements need **`schemas: [CUSTOM_ELEMENTS_SCHEMA]`**.
- **`beforeRender(cb)`** registers a per-frame callback (the animation loop). Its `delta`
  argument is seconds since the last frame — use it for frame-rate-independent animation.
- Reach the underlying Three.js object via **`viewChild.required<ElementRef<Mesh>>('ref')`**
  then `.nativeElement`.
- Element inputs map to Three.js properties (`color="hotpink"`, `[position]="[x, y, z]"`).

For anything beyond these basics — the full NGT building-block reference (exact signatures, the
`NgtCanvas` input list, `attach`/`*args`, `injectStore` + store properties, events, loaders,
`pick`/`omit`/`is`, portals, and the soba/postprocessing/rapier/theatre/tweakpane packages) — use
the **`angular-three-reference`** skill (`.claude/skills/angular-three-reference/`). Prefer it over
recalling NGT APIs from memory when looking up or explaining a building block.

Angular and TypeScript coding conventions are defined in **`.claude/CLAUDE.md`** — follow them.
