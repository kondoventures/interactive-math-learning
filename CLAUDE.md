# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MathPlay: a single-page site where students learn math through interactive canvas animations. Black and yellow theme. Vanilla JS + Vite, no framework, no runtime dependencies.

## Commands

```bash
npm install
npm run dev      # Vite dev server
npm run build    # production build to dist/
npm run preview  # serve dist/
```

There are no tests, linter, or formatter configured. Use `npm run build` to check that the code compiles.

## Architecture

- `index.html` holds all page markup, including each demo's controls (buttons, sliders, readout, challenge text). Demos find their elements by ID, with a per-demo prefix: `uc-` (unit circle), `py-` (Pythagoras), `pa-` (parabola).
- `src/main.js` imports the CSS and calls one `init*()` function per demo.
- `src/demos/*.js` each export one `init*()` function. All state is local to that closure. Each demo draws through the helpers in `src/canvas.js`.
- `src/canvas.js` shared helpers:
  - `setupCanvas(canvas, draw)` handles HiDPI scaling and resizing (ResizeObserver). It clears the canvas, fills the background, then calls `draw(ctx, w, h)` in CSS pixels. Call the returned `render()` after a state change.
  - `loopWhileVisible(el, step)` runs `step(dt)` on each frame only while the element is on screen (IntersectionObserver). `dt` is in seconds, capped at 0.05.
  - `pointerPos(canvas, e)` gives pointer coordinates in CSS pixels. Demos use pointer events with `setPointerCapture` so that drag works on touch screens.
  - `prefersReducedMotion` and `fmt(n, digits)` (formats a number and removes `-0`).
- The theme colors exist in two places: `COLORS` in `src/canvas.js` (canvas drawing) and the `:root` CSS variables in `src/style.css` (page). If you change one, change the other.

## Adding a demo

1. Add a `<section class="demo">` to `index.html`. Use a new ID prefix, and add `reverse` to the class to alternate the layout. Add a nav link.
2. Create `src/demos/<name>.js` that exports `init<Name>()` and uses `setupCanvas`, plus `loopWhileVisible` if the demo animates.
3. Call it from `src/main.js`.
4. Update the animations table in `README.md`. Each demo has a short challenge for the student.
