import { COLORS, setupCanvas, pointerPos, loopWhileVisible, prefersReducedMotion, fmt } from '../canvas.js';

const TAU = Math.PI * 2;

export function initUnitCircle() {
  const canvas = document.getElementById('uc-canvas');
  const playBtn = document.getElementById('uc-play');
  const speedInput = document.getElementById('uc-speed');
  const angleInput = document.getElementById('uc-angle');
  const readout = document.getElementById('uc-readout');

  let theta = 0;
  let playing = !prefersReducedMotion;
  let dragging = false;
  let layout = null;

  function computeLayout(w, h) {
    const r = Math.min(w * 0.17, h * 0.36);
    const cx = r + 28;
    const cy = h / 2;
    const waveX0 = cx + r + 40;
    const waveX1 = w - 20;
    return { r, cx, cy, waveX0, waveX1 };
  }

  const { render } = setupCanvas(canvas, (ctx, w, h) => {
    layout = computeLayout(w, h);
    const { r, cx, cy, waveX0, waveX1 } = layout;
    const waveW = waveX1 - waveX0;
    const px = cx + r * Math.cos(theta);
    const py = cy - r * Math.sin(theta);
    const waveX = waveX0 + (theta / TAU) * waveW;

    // Axes
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - r - 16, cy); ctx.lineTo(waveX1, cy);
    ctx.moveTo(cx, cy - r - 16); ctx.lineTo(cx, cy + r + 16);
    ctx.moveTo(waveX0, cy - r - 10); ctx.lineTo(waveX0, cy + r + 10);
    ctx.stroke();

    // Wave guide lines at +1 / -1
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(waveX0, cy - r); ctx.lineTo(waveX1, cy - r);
    ctx.moveTo(waveX0, cy + r); ctx.lineTo(waveX1, cy + r);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.fillStyle = COLORS.muted;
    ctx.font = '12px ui-monospace, Menlo, monospace';
    ctx.fillText('1', waveX0 - 14, cy - r + 4);
    ctx.fillText('-1', waveX0 - 20, cy + r + 4);
    ['π/2', 'π', '3π/2', '2π'].forEach((label, i) => {
      const x = waveX0 + ((i + 1) / 4) * waveW;
      ctx.fillText(label, x - ctx.measureText(label).width / 2, cy + r + 24);
    });

    // Circle
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.stroke();

    // Full faint sine wave
    ctx.strokeStyle = '#3a3a3a';
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const t = (i / 200) * TAU;
      const x = waveX0 + (t / TAU) * waveW;
      const y = cy - r * Math.sin(t);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();

    // Traced sine wave up to theta
    ctx.strokeStyle = COLORS.yellow;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const steps = Math.max(2, Math.ceil(200 * (theta / TAU)));
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * theta;
      const x = waveX0 + (t / TAU) * waveW;
      const y = cy - r * Math.sin(t);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();

    // Angle arc
    ctx.strokeStyle = COLORS.muted;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.22, 0, -theta, true);
    ctx.stroke();
    ctx.fillStyle = COLORS.muted;
    ctx.font = 'italic 14px serif';
    ctx.fillText('θ', cx + r * 0.27 * Math.cos(theta / 2), cy - r * 0.27 * Math.sin(theta / 2) + 4);

    // Radius
    ctx.strokeStyle = COLORS.text;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(px, py);
    ctx.stroke();

    // cos (horizontal) and sin (vertical) legs
    ctx.lineWidth = 4;
    ctx.strokeStyle = COLORS.cyan;
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(px, cy);
    ctx.stroke();
    ctx.strokeStyle = COLORS.yellow;
    ctx.beginPath();
    ctx.moveTo(px, cy); ctx.lineTo(px, py);
    ctx.stroke();

    // Connector from circle point to wave
    ctx.strokeStyle = 'rgba(255, 212, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(px, py); ctx.lineTo(waveX, py);
    ctx.stroke();
    ctx.setLineDash([]);

    // Points
    dot(ctx, waveX, py, 6, COLORS.yellow);
    dot(ctx, px, py, 9, COLORS.yellow, COLORS.bg);

    ctx.font = 'bold 13px ui-monospace, Menlo, monospace';
    ctx.fillStyle = COLORS.yellow;
    ctx.fillText('sin θ', Math.min(px + 8, cx + r + 2), (py + cy) / 2 + 4);
    ctx.fillStyle = COLORS.cyan;
    ctx.fillText('cos θ', (cx + px) / 2 - 18, cy + (Math.sin(theta) >= 0 ? 18 : -10));
  });

  function updateReadout() {
    const deg = (theta * 180) / Math.PI;
    const s = Math.sin(theta);
    const c = Math.cos(theta);
    const match = Math.abs(s - c) < 0.02 ? '  <span class="ok">✓ sin θ = cos θ</span>' : '';
    readout.innerHTML =
      `θ = ${fmt(deg, 0)}°  (${fmt(theta, 2)} rad)\n` +
      `<span style="color:#ffd400">sin θ = ${fmt(s, 3)}</span>   ` +
      `<span style="color:#4fd1ff">cos θ = ${fmt(c, 3)}</span>${match}`;
    angleInput.value = String(Math.round(deg));
  }

  function setPlaying(p) {
    playing = p;
    playBtn.textContent = playing ? 'Pause' : 'Play';
  }

  playBtn.addEventListener('click', () => setPlaying(!playing));
  angleInput.addEventListener('input', () => {
    setPlaying(false);
    theta = (Number(angleInput.value) * Math.PI) / 180;
    updateReadout();
    render();
  });

  function angleFromPointer(e) {
    const { x, y } = pointerPos(canvas, e);
    const { cx, cy, waveX0, waveX1 } = layout;
    if (x >= waveX0) {
      // Dragging on the wave scrubs the angle directly
      theta = Math.min(Math.max((x - waveX0) / (waveX1 - waveX0), 0), 1) * TAU;
    } else {
      theta = (Math.atan2(cy - y, x - cx) + TAU) % TAU;
    }
  }

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    setPlaying(false);
    angleFromPointer(e);
    updateReadout();
    render();
  });
  canvas.addEventListener('pointermove', (e) => {
    canvas.style.cursor = 'grab';
    if (!dragging) return;
    angleFromPointer(e);
    updateReadout();
    render();
  });
  canvas.addEventListener('pointerup', () => (dragging = false));

  loopWhileVisible(canvas, (dt) => {
    if (!playing) return;
    theta = (theta + dt * Number(speedInput.value)) % TAU;
    updateReadout();
    render();
  });

  setPlaying(playing);
  updateReadout();
}

function dot(ctx, x, y, r, fill, stroke) {
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
