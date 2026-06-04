import { useEffect, useRef } from "react";

// Named constellations — normalized coords roughly within [-1, 1].
// Edges reference node indices.
const CONSTELLATIONS = [
  {
    name: "Ursa Major",
    nodes: [
      [-1, 0.2], [-0.55, 0.05], [-0.15, -0.05], [0.15, -0.2],
      [0.3, 0.05], [0.65, 0.15], [1, 0],
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [3, 5]],
  },
  {
    name: "Orion",
    nodes: [
      [-0.7, -0.9], [0.7, -0.7], [-0.4, -0.1], [0, 0], [0.4, 0.1],
      [-0.85, 0.7], [0.85, 0.85], [-0.1, 0.5],
    ],
    edges: [[0, 2], [2, 3], [3, 4], [4, 1], [2, 5], [4, 6], [3, 7]],
  },
  {
    name: "Cassiopeia",
    nodes: [[-1, 0.3], [-0.5, -0.3], [0, 0.3], [0.5, -0.3], [1, 0.2]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    name: "Cygnus",
    nodes: [
      [0, -1], [0, -0.3], [0, 0.2], [0, 0.9],
      [-0.9, -0.1], [0.9, 0],
    ],
    edges: [[0, 1], [1, 2], [2, 3], [4, 1], [1, 5]],
  },
  {
    name: "Leo",
    nodes: [
      [-0.95, -0.4], [-0.6, -0.65], [-0.4, -0.2], [-0.7, 0.05],
      [0.1, -0.1], [0.7, 0.1], [0.95, 0.5], [0.3, 0.55],
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5], [5, 6], [6, 7], [7, 4]],
  },
  {
    name: "Lyra",
    nodes: [[0, -1], [-0.45, -0.1], [0.45, -0.1], [-0.35, 0.7], [0.35, 0.7]],
    edges: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4]],
  },
  {
    name: "Scorpius",
    nodes: [
      [-1, -0.8], [-0.6, -0.6], [-0.2, -0.4], [0, -0.05], [0.1, 0.35],
      [0.4, 0.65], [0.85, 0.6], [1, 0.2],
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]],
  },
  {
    name: "Taurus",
    nodes: [
      [-1, -0.5], [-0.4, -0.15], [0, 0], [0.4, -0.1], [0.95, -0.45],
      [-0.55, 0.4], [0.6, 0.5],
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [3, 6]],
  },
  {
    name: "Gemini",
    nodes: [
      [-0.6, -0.9], [-0.5, -0.3], [-0.4, 0.3], [-0.3, 0.9],
      [0.6, -0.9], [0.5, -0.3], [0.4, 0.3], [0.3, 0.9],
    ],
    edges: [[0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [6, 7], [1, 5]],
  },
  {
    name: "Ursa Minor",
    nodes: [
      [-1, 0.2], [-0.55, 0.1], [-0.15, 0], [0.2, -0.2],
      [0.4, 0.1], [0.7, 0.2], [1, 0],
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]],
  },
  {
    name: "Aquila",
    nodes: [[0, -0.9], [-0.7, 0], [0, 0.1], [0.7, 0], [0, 0.85]],
    edges: [[0, 2], [1, 2], [2, 3], [2, 4]],
  },
  {
    name: "Corona Borealis",
    nodes: [
      [-0.9, 0.3], [-0.55, -0.2], [-0.15, -0.4],
      [0.25, -0.4], [0.6, -0.2], [0.9, 0.3],
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
  },
  {
    name: "Cancer",
    nodes: [[0, -0.9], [-0.05, -0.1], [-0.7, 0.5], [0.7, 0.4]],
    edges: [[0, 1], [1, 2], [1, 3]],
  },
];

export default function Starfield() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, active: 0, lastSpawnX: -9999, lastSpawnY: -9999, cooldown: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    let stars = [];
    let shootingStars = [];
    let nebulaPuffs = [];
    let constellations = [];
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function rand(a, b) {
      return a + Math.random() * (b - a);
    }

    function seed() {
      const count = Math.min(260, Math.floor((w * h) / 2600));
      stars = new Array(count).fill(0).map(() => {
        const depth = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          z: depth,
          r: rand(0.3, 1.6) * (0.5 + depth),
          baseAlpha: rand(0.35, 1),
          twPhase: Math.random() * Math.PI * 2,
          twSpeed: rand(0.4, 1.8),
          hue: Math.random() < 0.15 ? rand(190, 230) : rand(200, 260),
        };
      });
      nebulaPuffs = new Array(5).fill(0).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: rand(180, 360),
        hue: rand(210, 290),
        a: rand(0.05, 0.12),
        drift: rand(0.02, 0.08),
        phase: Math.random() * Math.PI * 2,
      }));
    }

    let lastTemplateIdx = -1;
    function spawnConstellation(cx, cy) {
      // pick a different template than last time
      let idx = Math.floor(Math.random() * CONSTELLATIONS.length);
      if (idx === lastTemplateIdx) {
        idx = (idx + 1) % CONSTELLATIONS.length;
      }
      lastTemplateIdx = idx;
      const tpl = CONSTELLATIONS[idx];

      const scale = rand(90, 140);
      const rot = rand(-0.4, 0.4);
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);

      // bounds after rotation+scale so we can clamp inside canvas
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      const local = tpl.nodes.map(([nx, ny]) => {
        const rx = (nx * cos - ny * sin) * scale;
        const ry = (nx * sin + ny * cos) * scale;
        if (rx < minX) minX = rx;
        if (ry < minY) minY = ry;
        if (rx > maxX) maxX = rx;
        if (ry > maxY) maxY = ry;
        return [rx, ry];
      });
      const pad = 36;
      const ox = Math.max(pad - minX, Math.min(w - pad - maxX, cx));
      const oy = Math.max(pad - minY, Math.min(h - pad - maxY, cy));

      const nodes = local.map(([rx, ry]) => ({ x: ox + rx, y: oy + ry }));
      constellations.push({
        name: tpl.name,
        nodes,
        edges: tpl.edges,
        life: 0,
        ttl: rand(3.4, 4.4),
        hue: rand(200, 250),
        // anchor for label = topmost node
        labelAt: nodes.reduce((a, b) => (b.y < a.y ? b : a), nodes[0]),
      });
    }

    function spawnShootingStar() {
      const fromLeft = Math.random() < 0.5;
      const angle = rand(Math.PI / 7, Math.PI / 4) * (fromLeft ? 1 : -1);
      const speed = rand(520, 780);
      const startY = rand(-20, h * 0.55);
      const startX = fromLeft ? -40 : w + 40;
      shootingStars.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed * (fromLeft ? 1 : -1),
        vy: Math.sin(angle) * speed,
        life: 0,
        ttl: rand(0.9, 1.4),
        len: rand(140, 240),
      });
    }

    let last = performance.now();
    let acc = 0;
    let nextShootIn = rand(2.2, 5.5);

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += dt;

      ctx.fillStyle = "#05080F";
      ctx.fillRect(0, 0, w, h);

      const grad = ctx.createRadialGradient(
        w * 0.7,
        h * 0.3,
        0,
        w * 0.7,
        h * 0.3,
        Math.max(w, h)
      );
      grad.addColorStop(0, "rgba(60, 90, 180, 0.18)");
      grad.addColorStop(0.5, "rgba(20, 30, 70, 0.08)");
      grad.addColorStop(1, "rgba(5, 8, 15, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "lighter";
      for (const n of nebulaPuffs) {
        n.phase += n.drift * dt;
        const px = n.x + Math.cos(n.phase) * 18;
        const py = n.y + Math.sin(n.phase * 0.8) * 14;
        const g = ctx.createRadialGradient(px, py, 0, px, py, n.r);
        g.addColorStop(0, `hsla(${n.hue}, 80%, 60%, ${n.a})`);
        g.addColorStop(1, "hsla(0, 0%, 0%, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const mActive = mouseRef.current.active;

      ctx.globalCompositeOperation = "lighter";
      for (const s of stars) {
        const tw =
          0.55 + 0.45 * Math.sin(acc * s.twSpeed + s.twPhase);
        let dx = 0;
        let dy = 0;
        if (mActive > 0) {
          const ddx = s.x - mx;
          const ddy = s.y - my;
          const d2 = ddx * ddx + ddy * ddy;
          const radius = 160;
          if (d2 < radius * radius) {
            const d = Math.sqrt(d2) || 1;
            const f = (1 - d / radius) * 18 * s.z;
            dx = (ddx / d) * f;
            dy = (ddy / d) * f;
          }
        }
        const px = s.x + dx;
        const py = s.y + dy;
        const alpha = s.baseAlpha * tw;
        const glowR = s.r * (2.2 + tw * 1.6);
        const g = ctx.createRadialGradient(px, py, 0, px, py, glowR);
        g.addColorStop(0, `hsla(${s.hue}, 90%, 85%, ${alpha})`);
        g.addColorStop(0.4, `hsla(${s.hue}, 85%, 70%, ${alpha * 0.35})`);
        g.addColorStop(1, "hsla(0,0%,0%,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, glowR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `hsla(${s.hue}, 100%, 96%, ${Math.min(1, alpha * 1.2)})`;
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Constellations — draw & age
      for (let i = constellations.length - 1; i >= 0; i--) {
        const c = constellations[i];
        c.life += dt;
        const t = c.life / c.ttl;
        if (t >= 1) {
          constellations.splice(i, 1);
          continue;
        }
        // ease: rise then fade
        const fade =
          t < 0.25
            ? t / 0.25
            : t > 0.7
            ? 1 - (t - 0.7) / 0.3
            : 1;
        const reveal = Math.min(1, t / 0.45); // edges draw progressively

        // edges
        ctx.lineCap = "round";
        for (let e = 0; e < c.edges.length; e++) {
          const [ai, bi] = c.edges[e];
          const a = c.nodes[ai];
          const b = c.nodes[bi];
          const segT = Math.max(0, Math.min(1, reveal * c.edges.length - e));
          if (segT <= 0) continue;
          const ex = a.x + (b.x - a.x) * segT;
          const ey = a.y + (b.y - a.y) * segT;
          ctx.strokeStyle = `hsla(${c.hue}, 90%, 80%, ${0.55 * fade})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        }

        // nodes
        for (const n of c.nodes) {
          const r = 1.8;
          const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 10);
          g.addColorStop(0, `hsla(${c.hue}, 100%, 92%, ${0.9 * fade})`);
          g.addColorStop(1, "hsla(0,0%,0%,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 10, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `hsla(${c.hue}, 100%, 98%, ${fade})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
          ctx.fill();
        }

        // label
        if (c.name) {
          ctx.save();
          ctx.globalCompositeOperation = "source-over";
          const labelReveal = Math.max(0, Math.min(1, (t - 0.2) / 0.25));
          const lx = c.labelAt.x;
          const ly = c.labelAt.y - 18;
          ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "alphabetic";
          const text = c.name.toUpperCase();
          const textW = ctx.measureText(text).width;
          ctx.fillStyle = `rgba(5, 8, 15, ${0.45 * fade * labelReveal})`;
          ctx.fillRect(lx - textW / 2 - 6, ly - 10, textW + 12, 14);
          ctx.fillStyle = `hsla(${c.hue}, 100%, 90%, ${fade * labelReveal})`;
          ctx.fillText(text, lx, ly);
          // tracking dot connecting label to its star
          ctx.fillStyle = `hsla(${c.hue}, 100%, 90%, ${0.7 * fade * labelReveal})`;
          ctx.beginPath();
          ctx.arc(lx, ly + 8, 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      nextShootIn -= dt;
      if (nextShootIn <= 0) {
        spawnShootingStar();
        nextShootIn = rand(2.5, 6.5);
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life += dt;
        const t = ss.life / ss.ttl;
        if (t >= 1) {
          shootingStars.splice(i, 1);
          continue;
        }
        const nx = ss.x + ss.vx * dt;
        const ny = ss.y + ss.vy * dt;
        const ang = Math.atan2(ss.vy, ss.vx);
        const tailX = ss.x - Math.cos(ang) * ss.len;
        const tailY = ss.y - Math.sin(ang) * ss.len;
        const fade = Math.sin(Math.PI * t);
        const lg = ctx.createLinearGradient(tailX, tailY, nx, ny);
        lg.addColorStop(0, "rgba(180, 210, 255, 0)");
        lg.addColorStop(1, `rgba(220, 235, 255, ${0.95 * fade})`);
        ctx.strokeStyle = lg;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        const hg = ctx.createRadialGradient(nx, ny, 0, nx, ny, 14);
        hg.addColorStop(0, `rgba(255,255,255,${fade})`);
        hg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(nx, ny, 14, 0, Math.PI * 2);
        ctx.fill();

        ss.x = nx;
        ss.y = ny;
      }
      ctx.globalCompositeOperation = "source-over";

      if (mouseRef.current.active > 0) {
        mouseRef.current.active = Math.max(0, mouseRef.current.active - dt);
      }
      if (mouseRef.current.cooldown > 0) {
        mouseRef.current.cooldown = Math.max(0, mouseRef.current.cooldown - dt);
      }

      raf = requestAnimationFrame(frame);
    }

    function trySpawn(px, py, force = false) {
      const m = mouseRef.current;
      const moved = Math.hypot(px - m.lastSpawnX, py - m.lastSpawnY);
      if ((force || (m.cooldown <= 0 && moved > 110)) && constellations.length < 4) {
        spawnConstellation(px, py);
        m.lastSpawnX = px;
        m.lastSpawnY = py;
        m.cooldown = 0.5 + Math.random() * 0.7;
      }
    }
    function onMove(e) {
      const rect = canvas.getBoundingClientRect();
      const nx = e.clientX - rect.left;
      const ny = e.clientY - rect.top;
      const m = mouseRef.current;
      m.x = nx;
      m.y = ny;
      m.active = 1.2;
      trySpawn(nx, ny);
    }
    function onEnter(e) {
      const rect = canvas.getBoundingClientRect();
      const nx = e.clientX - rect.left;
      const ny = e.clientY - rect.top;
      const m = mouseRef.current;
      m.x = nx;
      m.y = ny;
      m.active = 1.2;
      trySpawn(nx, ny, true);
    }
    function onLeave() {
      mouseRef.current.active = 0;
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseenter", onEnter);
    canvas.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseenter", onEnter);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block"
      aria-hidden="true"
    />
  );
}
