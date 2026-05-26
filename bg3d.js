// ==========================================
// 3D PROFESSIONAL BACKGROUND ENGINE
// Canvas-based: Particle Network + 3D Grid + Orbs
// ==========================================

(function () {
  'use strict';

  /* ── Canvas Setup ─────────────────────────────── */
  const canvas = document.getElementById('bg3d-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W = window.innerWidth;
  let H = window.innerHeight;
  let mouse = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  /* ── Mouse Tracking ───────────────────────────── */
  window.addEventListener('mousemove', (e) => {
    mouse.vx = e.clientX - mouse.x;
    mouse.vy = e.clientY - mouse.y;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  /* ── Color Palette — Refined Premium ─────────── */
  const COLORS = {
    indigo: { r: 99,  g: 102, b: 241 },   // #6366f1
    violet: { r: 139, g: 92,  b: 246 },   // #8b5cf6
    cyan:   { r: 6,   g: 182, b: 212 },   // #06b6d4
    emerald:{ r: 16,  g: 185, b: 129 },   // #10b981
    amber:  { r: 245, g: 158, b: 11  },   // #f59e0b
  };

  function rgba(c, a) {
    return `rgba(${c.r},${c.g},${c.b},${a})`;
  }

  /* ── Utility ──────────────────────────────────── */
  const rand  = (a, b) => Math.random() * (b - a) + a;
  const lerp  = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /* ═══════════════════════════════════════════════
     1. PARTICLE NETWORK
  ═══════════════════════════════════════════════ */
  const PARTICLE_COUNT = Math.min(80, Math.floor(W * H / 20000));
  const LINK_DIST = 150;

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x  = rand(0, W);
      this.y  = rand(0, H);
      this.z  = rand(0.2, 1);
      this.vx = rand(-0.25, 0.25) * this.z;
      this.vy = rand(-0.25, 0.25) * this.z;
      this.r  = rand(1.2, 3) * this.z;
      const keys = Object.keys(COLORS);
      this.color = COLORS[keys[Math.floor(rand(0, keys.length))]];
      this.alpha = rand(0.35, 0.85);
      this.pulse = rand(0, Math.PI * 2);
      this.pulseSpeed = rand(0.008, 0.025);
    }
    update() {
      this.pulse += this.pulseSpeed;

      // Gentle mouse attraction
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 180) {
        this.vx += (dx / dist) * 0.006 * this.z;
        this.vy += (dy / dist) * 0.006 * this.z;
      }

      this.vx *= 0.992;
      this.vy *= 0.992;

      this.x += this.vx;
      this.y += this.vy;

      // Wrap around
      if (this.x < -20) this.x = W + 20;
      if (this.x > W + 20) this.x = -20;
      if (this.y < -20) this.y = H + 20;
      if (this.y > H + 20) this.y = -20;
    }
    draw() {
      const pulseFactor = 0.7 + 0.3 * Math.sin(this.pulse);
      const radius = this.r * pulseFactor;
      const alpha  = this.alpha * pulseFactor;

      // Glow
      const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, radius * 3.5);
      grd.addColorStop(0, rgba(this.color, alpha * 0.8));
      grd.addColorStop(1, rgba(this.color, 0));

      ctx.beginPath();
      ctx.arc(this.x, this.y, radius * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = rgba(this.color, Math.min(1, alpha + 0.15));
      ctx.fill();
    }
  }

  const particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());

  function drawLinks() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          const t = 1 - dist / LINK_DIST;
          const depthFactor = (a.z + b.z) / 2;

          const blendR = Math.round(lerp(a.color.r, b.color.r, 0.5));
          const blendG = Math.round(lerp(a.color.g, b.color.g, 0.5));
          const blendB = Math.round(lerp(a.color.b, b.color.b, 0.5));

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${blendR},${blendG},${blendB},${t * 0.3 * depthFactor})`;
          ctx.lineWidth = t * depthFactor * 1.2;
          ctx.stroke();
        }
      }
    }
  }

  /* ═══════════════════════════════════════════════
     2. 3D PERSPECTIVE GRID
  ═══════════════════════════════════════════════ */
  let gridOffset = 0;

  function project(x3d, y3d, z3d) {
    const fov = 420;
    const cx = W / 2 + (mouse.x - W / 2) * 0.012;
    const cy = H / 2 + (mouse.y - H / 2) * 0.012;
    const scale = fov / (fov + z3d);
    return { x: cx + x3d * scale, y: cy + y3d * scale, scale };
  }

  function drawGrid() {
    const COLS = 14, ROWS = 10;
    const cellW = 220, cellH = 200;
    const halfW = (COLS * cellW) / 2;
    const halfH = (ROWS * cellH) / 2;
    const depth = 650;

    gridOffset = (gridOffset + 0.35) % cellH;

    // Horizontal lines
    for (let r = 0; r <= ROWS + 1; r++) {
      const y3d = r * cellH - halfH - gridOffset;
      const p0 = project(-halfW, y3d, depth);
      const p1 = project( halfW, y3d, depth);
      if (p0 && p1) {
        const alpha = clamp((p0.scale - 0.1) * 0.45, 0, 0.14);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = rgba(COLORS.indigo, alpha);
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }

    // Vertical lines
    for (let c = 0; c <= COLS; c++) {
      const x3d = c * cellW - halfW;
      const p0 = project(x3d, -halfH - gridOffset, depth);
      const p1 = project(x3d,  halfH - gridOffset + cellH, depth);
      if (p0 && p1) {
        const alpha = clamp((p0.scale - 0.1) * 0.45, 0, 0.14);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = rgba(COLORS.violet, alpha);
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }

    // Intersection dots
    for (let r = 0; r <= ROWS + 1; r++) {
      for (let c = 0; c <= COLS; c++) {
        const x3d = c * cellW - halfW;
        const y3d = r * cellH - halfH - gridOffset;
        const p = project(x3d, y3d, depth);
        if (p) {
          const alpha = clamp((p.scale - 0.1) * 0.7, 0, 0.3);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.2 * p.scale, 0, Math.PI * 2);
          ctx.fillStyle = rgba(COLORS.indigo, alpha);
          ctx.fill();
        }
      }
    }
  }

  /* ═══════════════════════════════════════════════
     3. FLOATING GLOWING ORBS
  ═══════════════════════════════════════════════ */
  const ORB_DEFS = [
    { cx: 0.10, cy: 0.15, r: 300, color: COLORS.indigo,  alpha: 0.10, speed: 0.0004 },
    { cx: 0.85, cy: 0.70, r: 350, color: COLORS.cyan,    alpha: 0.08, speed: 0.0003 },
    { cx: 0.50, cy: 0.88, r: 240, color: COLORS.violet,  alpha: 0.07, speed: 0.0005 },
    { cx: 0.78, cy: 0.12, r: 200, color: COLORS.emerald, alpha: 0.06, speed: 0.0006 },
    { cx: 0.28, cy: 0.55, r: 170, color: COLORS.amber,   alpha: 0.05, speed: 0.0007 },
  ];

  let orbTime = 0;

  function drawOrbs() {
    orbTime += 1;
    ORB_DEFS.forEach((orb, i) => {
      const freq = orb.speed * orbTime;
      const ox = Math.sin(freq * 1.3 + i) * 70;
      const oy = Math.cos(freq       + i) * 50;
      const px = orb.cx * W + ox + (mouse.x - W / 2) * 0.015;
      const py = orb.cy * H + oy + (mouse.y - H / 2) * 0.015;

      const grd = ctx.createRadialGradient(px, py, 0, px, py, orb.r);
      grd.addColorStop(0,   rgba(orb.color, orb.alpha));
      grd.addColorStop(0.5, rgba(orb.color, orb.alpha * 0.35));
      grd.addColorStop(1,   rgba(orb.color, 0));

      ctx.beginPath();
      ctx.arc(px, py, orb.r, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    });
  }

  /* ═══════════════════════════════════════════════
     4. FLOATING 3D GEOMETRIC SHAPES
  ═══════════════════════════════════════════════ */
  class GeoShape {
    constructor() { this.reset(); }
    reset() {
      this.x  = rand(0.05, 0.95) * W;
      this.y  = rand(0.05, 0.95) * H;
      this.z  = rand(0, 1);
      this.size = rand(16, 48) * (0.5 + this.z * 0.5);
      this.type = Math.floor(rand(0, 3)); // 0=triangle, 1=hex, 2=diamond
      const keys = Object.keys(COLORS);
      this.color = COLORS[keys[Math.floor(rand(0, keys.length))]];
      this.alpha = rand(0.03, 0.12) * this.z;
      this.angle = rand(0, Math.PI * 2);
      this.rotSpeed = rand(-0.002, 0.002);
      this.vy = rand(-0.12, -0.04) * (0.5 + this.z);
      this.vx = rand(-0.06, 0.06);
      this.pulse = rand(0, Math.PI * 2);
      this.pulseSpeed = rand(0.006, 0.018);
    }
    update() {
      this.angle += this.rotSpeed;
      this.x += this.vx;
      this.y += this.vy;
      this.pulse += this.pulseSpeed;
      if (this.y < -80) this.reset();
    }
    draw() {
      const s = this.size * (0.85 + 0.15 * Math.sin(this.pulse));
      const a = this.alpha * (0.7 + 0.3 * Math.sin(this.pulse));

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.strokeStyle = rgba(this.color, a * 3);
      ctx.lineWidth = 1;
      ctx.fillStyle = rgba(this.color, a);

      ctx.beginPath();
      if (this.type === 0) {
        for (let i = 0; i < 3; i++) {
          const ang = (i / 3) * Math.PI * 2 - Math.PI / 2;
          const fx = Math.cos(ang) * s, fy = Math.sin(ang) * s;
          i === 0 ? ctx.moveTo(fx, fy) : ctx.lineTo(fx, fy);
        }
      } else if (this.type === 1) {
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          const fx = Math.cos(ang) * s, fy = Math.sin(ang) * s;
          i === 0 ? ctx.moveTo(fx, fy) : ctx.lineTo(fx, fy);
        }
      } else {
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.6, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.6, 0);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  const shapes = Array.from({ length: 18 }, () => new GeoShape());

  /* ═══════════════════════════════════════════════
     5. SUBTLE SCANLINES
  ═══════════════════════════════════════════════ */
  function drawScanlines() {
    ctx.fillStyle = 'rgba(0,0,0,0.01)';
    for (let y = 0; y < H; y += 4) {
      ctx.fillRect(0, y, W, 1);
    }
  }

  /* ═══════════════════════════════════════════════
     MAIN RENDER LOOP
  ═══════════════════════════════════════════════ */
  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Layer 1 — perspective grid (deepest)
    drawGrid();

    // Layer 2 — glowing orbs
    drawOrbs();

    // Layer 3 — geometric shapes
    shapes.forEach(s => { s.update(); s.draw(); });

    // Layer 4 — particle network
    drawLinks();
    particles.forEach(p => { p.update(); p.draw(); });

    // Layer 5 — subtle scanlines
    drawScanlines();

    requestAnimationFrame(render);
  }

  render();

  console.log('%c🌌 3D Background Engine Active', 'color: #6366f1; font-weight:bold; font-size:13px');
})();
