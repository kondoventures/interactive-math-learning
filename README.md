# MathPlay — interactive-math-learning

Website that allows students to learn math concepts in an interactive way. Black and yellow theme. Built with [Vite](https://vite.dev).

## Animations

| # | Topic | What you can do |
|---|-------|-----------------|
| 1 | **Unit Circle & Sine Waves** (trigonometry) | Play/pause, change speed, drag the point on the circle or scrub the wave. See `sin θ` and `cos θ` live. |
| 2 | **Pythagorean Theorem** (geometry) | Drag the two yellow corners to resize the right triangle. Squares show `a²`, `b²`, `c²`. "Animate proof" fills the areas. Whole-number triples are detected. |
| 3 | **Parabola Explorer** (algebra) | Move the `a`, `b`, `c` sliders or drag the vertex. See vertex, roots, axis of symmetry and the discriminant `b² − 4ac`. |

Each demo has a short challenge for the student.

## Run

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
npm run preview  # serve the build
```

## Structure

```
index.html              landing page + demo sections
src/style.css           black/yellow theme
src/canvas.js           shared canvas helpers (HiDPI, resize, animation loop)
src/demos/unitCircle.js
src/demos/pythagoras.js
src/demos/parabola.js
```

No framework, no runtime dependencies. Animations pause when off screen. Works on touch devices.
