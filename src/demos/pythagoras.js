import { COLORS, setupCanvas, pointerPos, loopWhileVisible, fmt } from '../canvas.js';

const MIN_LEG = 1;
const MAX_LEG = 8;

export function initPythagoras() {
  const canvas = document.getElementById('py-canvas');
  const animateBtn = document.getElementById('py-animate');
  const resetBtn = document.getElementById('py-reset');
  const readout = document.getElementById('py-readout');

  let a = 3; // vertical leg
  let b = 4; // horizontal leg
  let fill = 1; // 0..1 progress of the "pour" animation
  let animating = false;
  let dragTarget = null;
  let view = null;
  // Zoomed camera: eases toward a fit of the current triangle, frozen while dragging.
  let cam = null;

  // Math coords (units, y up) -> screen px
  function toScreen(x, y) {
    return { x: view.ox + x * view.u, y: view.oy - y * view.u };
  }
  function toUnits(px, py) {
    return { x: (px - view.ox) / view.u, y: (view.oy - py) / view.u };
  }

  const { render, state: canvasState } = setupCanvas(canvas, (ctx, w, h) => {
    if (!cam) cam = fitCamera(w, h);
    view = { u: cam.u, ox: w / 2 - cam.cx * cam.u, oy: h / 2 + cam.cy * cam.u };

    const c = Math.hypot(a, b);
    const O = { x: 0, y: 0 };
    const A = { x: 0, y: a };
    const B = { x: b, y: 0 };

    drawGrid(ctx, w, h, view);

    // Fill progress: first a² and b² fill, then c² fills.
    const legFill = Math.min(fill * 2, 1);
    const hypFill = Math.max(fill * 2 - 1, 0);

    // Square on a (left of vertical leg), square on b (below horizontal leg), square on c (outward).
    drawSquare(ctx, O, A, { x: -1, y: 0 }, a, COLORS.yellow, COLORS.yellowSoft, legFill, [`a = ${fmtArea(a)}`, `a² = ${fmtArea(a * a)}`]);
    drawSquare(ctx, B, O, { x: 0, y: -1 }, b, COLORS.yellow, COLORS.yellowSoft, legFill, [`b = ${fmtArea(b)}`, `b² = ${fmtArea(b * b)}`]);
    drawSquare(ctx, A, B, { x: a / c, y: b / c }, c, COLORS.cyan, COLORS.cyanSoft, hypFill, [`c = ${fmt(c, 2)}`, `c² = ${fmtArea(c * c)}`]);

    // Triangle
    const sO = toScreen(O.x, O.y), sA = toScreen(A.x, A.y), sB = toScreen(B.x, B.y);
    ctx.beginPath();
    ctx.moveTo(sO.x, sO.y); ctx.lineTo(sA.x, sA.y); ctx.lineTo(sB.x, sB.y); ctx.closePath();
    ctx.fillStyle = '#2b2b2b';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = COLORS.text;
    ctx.stroke();

    // Right angle marker
    const m = Math.min(0.6, a / 3, b / 3) * view.u;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sO.x, sO.y - m, m, m);

    // Drag handles
    handle(ctx, sA.x, sA.y);
    handle(ctx, sB.x, sB.y);
  });

  // Bounding box of triangle + its three squares: x in [-a, a+b], y in [-b, a+b].
  function fitCamera(w, h) {
    const pad = 3;
    return { u: Math.min(w / (2 * a + b + pad), h / (a + 2 * b + pad)), cx: b / 2, cy: a / 2 };
  }

  function drawSquare(ctx, P, Q, n, side, stroke, soft, f, lines) {
    const corners = [P, Q, add(Q, n, side), add(P, n, side)].map((p) => toScreen(p.x, p.y));
    const path = (pts) => {
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
    };
    path(corners);
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fill();

    if (f > 0) {
      const level = [P, Q, add(Q, n, side * f), add(P, n, side * f)].map((p) => toScreen(p.x, p.y));
      path(level);
      ctx.fillStyle = soft;
      ctx.fill();
    }

    path(corners);
    ctx.lineWidth = 2;
    ctx.strokeStyle = stroke;
    ctx.stroke();

    const cx = corners.reduce((s, p) => s + p.x, 0) / 4;
    const cy = corners.reduce((s, p) => s + p.y, 0) / 4;
    const size = Math.max(10, Math.min(15, side * view.u * 0.16));
    ctx.font = `bold ${size}px ui-monospace, Menlo, monospace`;
    ctx.fillStyle = stroke;
    lines.forEach((line, i) => {
      const tw = ctx.measureText(line).width;
      ctx.fillText(line, cx - tw / 2, cy + (i - 0.5) * size * 1.3 + size / 3);
    });
  }

  function updateReadout() {
    const c2 = a * a + b * b;
    const c = Math.sqrt(c2);
    const whole = Number.isInteger(a) && Number.isInteger(b) && Math.abs(c - Math.round(c)) < 1e-9;
    readout.innerHTML =
      `<span style="color:#ffd400">a² + b²</span> = ${fmtArea(a * a)} + ${fmtArea(b * b)} = ${fmtArea(c2)}\n` +
      `<span style="color:#4fd1ff">c²</span> = ${fmt(c, 2)}² = ${fmtArea(c2)}` +
      (whole ? `\n<span class="ok">✓ Pythagorean triple: ${a}-${b}-${Math.round(c)}</span>` : '');
  }

  function snap(v) {
    v = Math.min(Math.max(v, MIN_LEG), MAX_LEG);
    const r = Math.round(v);
    return Math.abs(v - r) < 0.15 ? r : Math.round(v * 10) / 10;
  }

  canvas.addEventListener('pointerdown', (e) => {
    const p = pointerPos(canvas, e);
    const sA = toScreen(0, a);
    const sB = toScreen(b, 0);
    const dA = Math.hypot(p.x - sA.x, p.y - sA.y);
    const dB = Math.hypot(p.x - sB.x, p.y - sB.y);
    const hit = 22;
    if (Math.min(dA, dB) > hit) return;
    dragTarget = dA < dB ? 'a' : 'b';
    canvas.setPointerCapture(e.pointerId);
    animating = false;
    fill = 1;
  });
  function dragTo(e) {
    const m = toUnits(...Object.values(pointerPos(canvas, e)));
    if (dragTarget === 'a') a = snap(m.y);
    else b = snap(m.x);
    updateReadout();
    render();
  }

  canvas.addEventListener('pointermove', (e) => {
    const p = pointerPos(canvas, e);
    if (!dragTarget) {
      const sA = toScreen(0, a);
      const sB = toScreen(b, 0);
      const near = Math.min(Math.hypot(p.x - sA.x, p.y - sA.y), Math.hypot(p.x - sB.x, p.y - sB.y)) < 22;
      canvas.style.cursor = near ? 'grab' : 'default';
      return;
    }
    dragTo(e);
  });
  // Pointer moves can arrive one frame late, so apply the release position too.
  canvas.addEventListener('pointerup', (e) => {
    if (!dragTarget) return;
    dragTo(e);
    dragTarget = null;
  });

  animateBtn.addEventListener('click', () => {
    fill = 0;
    animating = true;
  });
  resetBtn.addEventListener('click', () => {
    a = 3;
    b = 4;
    fill = 1;
    animating = false;
    updateReadout();
    render();
  });

  loopWhileVisible(canvas, (dt) => {
    let changed = false;
    if (animating) {
      fill = Math.min(fill + dt / 3, 1);
      if (fill >= 1) animating = false;
      changed = true;
    }
    if (!dragTarget && cam) {
      const { width, height } = canvasState;
      const target = fitCamera(width, height);
      const k = Math.min(dt * 6, 1);
      const diff = Math.abs(target.u - cam.u) + Math.abs(target.cx - cam.cx) + Math.abs(target.cy - cam.cy);
      if (diff > 0.001) {
        cam.u += (target.u - cam.u) * k;
        cam.cx += (target.cx - cam.cx) * k;
        cam.cy += (target.cy - cam.cy) * k;
        changed = true;
      }
    }
    if (changed) render();
  });

  updateReadout();
}

function add(p, n, s) {
  return { x: p.x + n.x * s, y: p.y + n.y * s };
}

function fmtArea(v) {
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

function drawGrid(ctx, w, h, view) {
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = view.ox % view.u; x < w; x += view.u) {
    ctx.moveTo(x, 0); ctx.lineTo(x, h);
  }
  for (let y = view.oy % view.u; y < h; y += view.u) {
    ctx.moveTo(0, y); ctx.lineTo(w, y);
  }
  ctx.stroke();
}

function handle(ctx, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.yellow;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.bg;
  ctx.stroke();
}
