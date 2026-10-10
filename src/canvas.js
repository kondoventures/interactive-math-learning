export const COLORS = {
  bg: '#141414',
  grid: '#232323',
  axis: '#555',
  yellow: '#ffd400',
  yellowSoft: 'rgba(255, 212, 0, 0.18)',
  cyan: '#4fd1ff',
  cyanSoft: 'rgba(79, 209, 255, 0.18)',
  text: '#f5f5f5',
  muted: '#a3a3a3',
};

/**
 * Keeps a canvas sharp on high-DPI screens and resized with its container.
 * `draw(ctx, width, height)` is called with CSS-pixel dimensions.
 */
export function setupCanvas(canvas, draw) {
  const ctx = canvas.getContext('2d');
  const state = { width: 0, height: 0 };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    state.width = rect.width;
    state.height = rect.height;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
  }

  function render() {
    ctx.clearRect(0, 0, state.width, state.height);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, state.width, state.height);
    draw(ctx, state.width, state.height);
  }

  new ResizeObserver(resize).observe(canvas);
  resize();
  return { ctx, state, render };
}

/** Pointer position in CSS pixels relative to the canvas. */
export function pointerPos(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

/** Runs `step(dt)` every frame only while the element is on screen. */
export function loopWhileVisible(el, step) {
  let visible = false;
  let last = 0;
  function frame(t) {
    if (!visible) return;
    const dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
    last = t;
    step(dt);
    requestAnimationFrame(frame);
  }
  new IntersectionObserver(([entry]) => {
    const wasVisible = visible;
    visible = entry.isIntersecting;
    if (visible && !wasVisible) {
      last = 0;
      requestAnimationFrame(frame);
    }
  }).observe(el);
}

export const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function fmt(n, digits = 2) {
  const v = Number(n.toFixed(digits));
  return (Object.is(v, -0) ? 0 : v).toFixed(digits);
}
