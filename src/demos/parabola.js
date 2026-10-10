import { COLORS, setupCanvas, pointerPos, loopWhileVisible, fmt } from '../canvas.js';

const X_RANGE = 8; // x from -8 to 8

export function initParabola() {
  const canvas = document.getElementById('pa-canvas');
  const inputs = {
    a: document.getElementById('pa-a'),
    b: document.getElementById('pa-b'),
    c: document.getElementById('pa-c'),
  };
  const outputs = {
    a: document.getElementById('pa-a-v'),
    b: document.getElementById('pa-b-v'),
    c: document.getElementById('pa-c-v'),
  };
  const wiggleBtn = document.getElementById('pa-wiggle');
  const readout = document.getElementById('pa-readout');

  let wiggling = false;
  let wiggleT = 0;
  let wiggleBase = 0;
  let draggingVertex = false;
  let view = null;

  const get = (k) => Number(inputs[k].value);

  function toScreen(x, y) {
    return { x: view.ox + x * view.u, y: view.oy - y * view.u };
  }
  function toUnits(px, py) {
    return { x: (px - view.ox) / view.u, y: (view.oy - py) / view.u };
  }

  function vertexOf(a, b, c) {
    if (a === 0) return null;
    const h = -b / (2 * a);
    return { x: h, y: a * h * h + b * h + c };
  }

  function rootsOf(a, b, c) {
    if (a === 0) return b === 0 ? [] : [-c / b];
    const d = b * b - 4 * a * c;
    if (d < -1e-9) return [];
    if (Math.abs(d) < 1e-9) return [-b / (2 * a)];
    const s = Math.sqrt(d);
    return [(-b - s) / (2 * a), (-b + s) / (2 * a)];
  }

  const { render } = setupCanvas(canvas, (ctx, w, h) => {
    const u = w / (X_RANGE * 2);
    view = { u, ox: w / 2, oy: h / 2 };
    const a = get('a'), b = get('b'), c = get('c');
    const yMax = h / 2 / u;

    // Grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -X_RANGE; i <= X_RANGE; i++) {
      const p = toScreen(i, 0);
      ctx.moveTo(p.x, 0); ctx.lineTo(p.x, h);
    }
    for (let j = -Math.ceil(yMax); j <= Math.ceil(yMax); j++) {
      const p = toScreen(0, j);
      ctx.moveTo(0, p.y); ctx.lineTo(w, p.y);
    }
    ctx.stroke();

    // Axes
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, view.oy); ctx.lineTo(w, view.oy);
    ctx.moveTo(view.ox, 0); ctx.lineTo(view.ox, h);
    ctx.stroke();

    ctx.fillStyle = COLORS.muted;
    ctx.font = '11px ui-monospace, Menlo, monospace';
    for (let i = -X_RANGE + 2; i < X_RANGE; i += 2) {
      if (i === 0) continue;
      const p = toScreen(i, 0);
      ctx.fillText(String(i), p.x - 4, p.y + 14);
    }

    const v = vertexOf(a, b, c);

    // Axis of symmetry
    if (v) {
      const top = toScreen(v.x, yMax);
      ctx.strokeStyle = 'rgba(255, 212, 0, 0.4)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(top.x, 0); ctx.lineTo(top.x, h);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Curve
    ctx.strokeStyle = COLORS.yellow;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    let started = false;
    for (let px = 0; px <= w; px += 2) {
      const x = (px - view.ox) / u;
      const y = a * x * x + b * x + c;
      const py = view.oy - y * u;
      if (py < -h || py > 2 * h) { started = false; continue; }
      started ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      started = true;
    }
    ctx.stroke();

    // y-intercept
    const yi = toScreen(0, c);
    marker(ctx, yi.x, yi.y, 5, COLORS.text);

    // Roots (label skipped when it would sit on the vertex label)
    rootsOf(a, b, c).forEach((r) => {
      const p = toScreen(r, 0);
      marker(ctx, p.x, p.y, 7, COLORS.cyan);
      if (v && Math.hypot(p.x - toScreen(v.x, v.y).x, p.y - toScreen(v.x, v.y).y) < 40) return;
      ctx.fillStyle = COLORS.cyan;
      ctx.font = 'bold 12px ui-monospace, Menlo, monospace';
      ctx.fillText(fmt(r, 2), p.x - 14, p.y + 22);
    });

    // Vertex (draggable)
    if (v) {
      const p = toScreen(v.x, v.y);
      marker(ctx, p.x, p.y, 10, COLORS.yellow, COLORS.bg);
      const label = `(${fmt(v.x, 1)}, ${fmt(v.y, 1)})`;
      const ly = p.y + (a > 0 ? 18 : -10);
      ctx.font = 'bold 12px ui-monospace, Menlo, monospace';
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(p.x + 10, ly - 12, ctx.measureText(label).width + 8, 16);
      ctx.fillStyle = COLORS.yellow;
      ctx.fillText(label, p.x + 14, ly);
    }

    ctx.fillStyle = COLORS.muted;
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('Tip: drag the yellow vertex', 12, 20);
  });

  function updateReadout() {
    const a = get('a'), b = get('b'), c = get('c');
    for (const k of ['a', 'b', 'c']) outputs[k].textContent = fmt(get(k), 1);

    const sign = (n) => (n < 0 ? '− ' : '+ ') + fmt(Math.abs(n), 1);
    const disc = b * b - 4 * a * c;
    const roots = rootsOf(a, b, c);
    const v = vertexOf(a, b, c);
    let rootsText;
    if (a === 0) rootsText = 'a = 0 → this is a straight line, not a parabola';
    else if (roots.length === 0) rootsText = 'no real roots (curve misses the x-axis)';
    else if (roots.length === 1) rootsText = `one root at x = ${fmt(roots[0], 2)} <span class="ok">✓ touches once!</span>`;
    else rootsText = `two roots: x = ${fmt(roots[0], 2)}, ${fmt(roots[1], 2)}`;

    readout.innerHTML =
      `y = ${fmt(a, 1)}x² ${sign(b)}x ${sign(c)}\n` +
      (v ? `vertex = (${fmt(v.x, 2)}, ${fmt(v.y, 2)}) · opens ${a > 0 ? 'up ∪' : 'down ∩'}\n` : '') +
      `b² − 4ac = ${fmt(disc, 2)}\n` +
      `<span style="color:#4fd1ff">${rootsText}</span>`;
  }

  function refresh() {
    updateReadout();
    render();
  }

  Object.values(inputs).forEach((el) =>
    el.addEventListener('input', () => {
      stopWiggle();
      refresh();
    })
  );

  function stopWiggle() {
    if (!wiggling) return;
    wiggling = false;
    wiggleBtn.textContent = 'Animate c';
  }

  wiggleBtn.addEventListener('click', () => {
    if (wiggling) return stopWiggle();
    wiggling = true;
    wiggleT = 0;
    wiggleBase = get('c');
    wiggleBtn.textContent = 'Stop';
  });

  // Drag the vertex: keep a, solve for b and c so the vertex lands at the pointer.
  canvas.addEventListener('pointerdown', (e) => {
    const v = vertexOf(get('a'), get('b'), get('c'));
    if (!v) return;
    const p = pointerPos(canvas, e);
    const s = toScreen(v.x, v.y);
    if (Math.hypot(p.x - s.x, p.y - s.y) > 24) return;
    draggingVertex = true;
    stopWiggle();
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = pointerPos(canvas, e);
    const a = get('a');
    if (!draggingVertex) {
      const v = vertexOf(a, get('b'), get('c'));
      const s = v && toScreen(v.x, v.y);
      canvas.style.cursor = s && Math.hypot(p.x - s.x, p.y - s.y) < 24 ? 'grab' : 'default';
      return;
    }
    const m = toUnits(p.x, p.y);
    const hx = Math.round(m.x * 10) / 10;
    const ky = Math.round(m.y * 10) / 10;
    inputs.b.value = String(-2 * a * hx);
    inputs.c.value = String(ky + a * hx * hx);
    refresh();
  });
  canvas.addEventListener('pointerup', () => (draggingVertex = false));

  loopWhileVisible(canvas, (dt) => {
    if (!wiggling) return;
    wiggleT += dt;
    const c = wiggleBase + 3 * Math.sin(wiggleT * 1.2);
    inputs.c.value = String(Math.round(c * 10) / 10);
    refresh();
  });

  refresh();
}

function marker(ctx, x, y, r, fill, stroke) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}
