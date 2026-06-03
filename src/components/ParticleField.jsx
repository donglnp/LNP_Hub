import { useEffect, useRef } from "react";

export default function ParticleField() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const pointerRef = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: false });

  // ----- custom fade-in / fade-out loop refs -----
  const currentTimeRef = useRef(0);          // ms inside the current cycle
  const durationRef = useRef(12000);         // length of a cycle (ms)
  const fadeInRef = useRef(500);             // 0.5s fade in
  const fadeOutRef = useRef(500);            // 0.5s fade out
  const isPlayingRef = useRef(true);
  const opacityRef = useRef(0);
  const lastFrameRef = useRef(0);
  const pauseTimerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    // ----- big, slow ribbons (the "time rivers") -----
    const RIBBON_COUNT = 6;
    let ribbons = [];
    let particles = [];
    let pulses = [];
    let supernovas = [];

    function seed() {
      ribbons = Array.from({ length: RIBBON_COUNT }, (_, i) => {
        const layer = i / (RIBBON_COUNT - 1);
        return {
          yBase: ((i + 0.5) / RIBBON_COUNT) * height,
          amp1: height * (0.12 + Math.random() * 0.10),
          amp2: height * (0.05 + Math.random() * 0.06),
          freq1: 0.0005 + Math.random() * 0.0005,
          freq2: 0.0012 + Math.random() * 0.0010,
          phase1: Math.random() * Math.PI * 2,
          phase2: Math.random() * Math.PI * 2,
          driftSpeed: 0.0010 + Math.random() * 0.0010,
          flow: 0.18 + Math.random() * 0.22 + layer * 0.35,
          alpha: 0.06 + layer * 0.12,
          // ⬆⬆ much bigger ribbon widths
          width: 2.5 + layer * 3.5,
          hue: 205 + Math.round((Math.random() - 0.5) * 30 + layer * 25),
          layer,
        };
      });

      const total = Math.floor(Math.min(380, (width * height) / 3000));
      particles = Array.from({ length: total }, () => spawnParticle());

      pulses = [];
      supernovas = [];
    }

    function spawnParticle() {
      const ribIdx = Math.floor(Math.random() * RIBBON_COUNT);
      const rib = ribbons[ribIdx];
      return {
        ribIdx,
        x: Math.random() * width,
        offset: (Math.random() - 0.5) * 110,
        offsetTarget: 0,
        speedMul: 0.7 + Math.random() * 1.4,
        size: 0.6 + Math.random() * 1.6 + rib.layer * 0.8,
        bright: 0.35 + Math.random() * 0.55,
        trail: 28 + Math.random() * 80,
        depth: rib.layer,
      };
    }

    function ribbonY(rib, x, t) {
      const wob = Math.sin(t * rib.driftSpeed) * 0.6;
      return (
        rib.yBase +
        Math.sin(x * rib.freq1 + rib.phase1 + t * 0.0028) * rib.amp1 +
        Math.sin(x * rib.freq2 + rib.phase2 - t * 0.0017) * rib.amp2 * wob
      );
    }

    function spawnPulse() {
      const ribIdx = Math.floor(Math.random() * RIBBON_COUNT);
      pulses.push({
        ribIdx,
        x: -30,
        speed: 1.8 + Math.random() * 2.2,
        life: 0,
        maxLife: 700,
        intensity: 0.85 + Math.random() * 0.4,
      });
    }

    function spawnSupernova(x, y) {
      supernovas.push({
        x,
        y,
        r: 6,
        maxR: 140 + Math.random() * 100,
        life: 0,
        maxLife: 80,
      });
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    function onPointer(e) {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.tx = (e.clientX - rect.left) / rect.width;
      pointerRef.current.ty = (e.clientY - rect.top) / rect.height;
      pointerRef.current.active = true;
    }
    function onLeave() {
      pointerRef.current.active = false;
    }
    function onClick(e) {
      const rect = canvas.getBoundingClientRect();
      spawnSupernova(e.clientX - rect.left, e.clientY - rect.top);
    }
    canvas.addEventListener("pointermove", onPointer);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onClick);

    // ----- fade-loop control -----
    function play() {
      isPlayingRef.current = true;
      currentTimeRef.current = 0;
      lastFrameRef.current = performance.now();
    }

    function endCycle() {
      // event ended: opacity -> 0, wait 100ms, reset, play() again
      isPlayingRef.current = false;
      opacityRef.current = 0;
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = setTimeout(() => {
        play();
      }, 100);
    }

    function computeOpacity() {
      const ct = currentTimeRef.current;
      const dur = durationRef.current;
      const fi = fadeInRef.current;
      const fo = fadeOutRef.current;
      if (!isPlayingRef.current) return 0;
      if (ct < fi) return ct / fi;                  // fade in
      if (ct > dur - fo) return Math.max(0, (dur - ct) / fo); // fade out
      return 1;
    }

    let t = 0;
    let pulseTimer = 0;
    lastFrameRef.current = performance.now();

    function step(now) {
      const dt = Math.min(64, now - lastFrameRef.current);
      lastFrameRef.current = now;
      t += dt * 0.06; // animation clock (frame-independent-ish)

      if (isPlayingRef.current) {
        currentTimeRef.current += dt;
        if (currentTimeRef.current >= durationRef.current) {
          endCycle();
        }
      }
      const fade = computeOpacity();
      opacityRef.current = fade;

      const ptr = pointerRef.current;
      ptr.x += (ptr.tx - ptr.x) * 0.08;
      ptr.y += (ptr.ty - ptr.y) * 0.08;
      const px = ptr.x * width;
      const py = ptr.y * height;

      // background wash — keep base dark even when fade=0 so panel never flashes
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(5, 8, 14, 0.20)";
      ctx.fillRect(0, 0, width, height);

      // everything below honors the cycle fade
      ctx.globalAlpha = fade;

      // ---- aurora wash ----
      const wash = ctx.createLinearGradient(0, 0, width, height);
      wash.addColorStop(0, "rgba(40, 80, 180, 0.06)");
      wash.addColorStop(0.5, "rgba(96, 165, 250, 0.03)");
      wash.addColorStop(1, "rgba(140, 90, 230, 0.07)");
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, width, height);

      // ---- big ribbon curves: smooth bezier through sampled points ----
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let li = 0; li < ribbons.length; li++) {
        const rib = ribbons[li];

        // sample points with finer step for smoother curves
        const stepX = 36;
        const pts = [];
        for (let x = -40; x <= width + 40; x += stepX) {
          pts.push([x, ribbonY(rib, x, t)]);
        }

        // helper to draw smooth path
        function tracePath() {
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length - 1; i++) {
            const xc = (pts[i][0] + pts[i + 1][0]) / 2;
            const yc = (pts[i][1] + pts[i + 1][1]) / 2;
            ctx.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc);
          }
          ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
        }

        // outer soft glow — much thicker
        ctx.strokeStyle = `hsla(${rib.hue}, 90%, 65%, ${rib.alpha * 0.55})`;
        ctx.lineWidth = rib.width * 14;
        tracePath();
        ctx.stroke();

        // mid glow
        ctx.strokeStyle = `hsla(${rib.hue}, 95%, 70%, ${rib.alpha * 0.9})`;
        ctx.lineWidth = rib.width * 5;
        tracePath();
        ctx.stroke();

        // bright core line
        ctx.strokeStyle = `hsla(${rib.hue}, 100%, 88%, ${Math.min(1, rib.alpha * 3.5)})`;
        ctx.lineWidth = rib.width * 1.4;
        tracePath();
        ctx.stroke();

        // crisp inner highlight
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.7, rib.alpha * 2.2)})`;
        ctx.lineWidth = Math.max(0.6, rib.width * 0.45);
        tracePath();
        ctx.stroke();
      }

      // ---- pulses ----
      pulseTimer++;
      if (pulseTimer > 80) {
        pulseTimer = 0;
        if (pulses.length < 6) spawnPulse();
      }

      ctx.globalCompositeOperation = "lighter";
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pu = pulses[i];
        const rib = ribbons[pu.ribIdx];
        pu.x += pu.speed;
        pu.life++;
        if (pu.x > width + 60 || pu.life > pu.maxLife) {
          pulses.splice(i, 1);
          continue;
        }
        const y = ribbonY(rib, pu.x, t);

        const tailLen = 180;
        const grad = ctx.createLinearGradient(pu.x - tailLen, 0, pu.x, 0);
        grad.addColorStop(0, "rgba(120, 180, 255, 0)");
        grad.addColorStop(1, `rgba(230, 240, 255, ${pu.intensity})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = rib.width * 2.4;
        ctx.beginPath();
        for (let x = pu.x - tailLen; x <= pu.x; x += 8) {
          const yy = ribbonY(rib, x, t);
          if (x === pu.x - tailLen) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${pu.intensity})`;
        ctx.arc(pu.x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = `rgba(140, 200, 255, ${pu.intensity * 0.4})`;
        ctx.arc(pu.x, y, 18, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---- particles ----
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const rib = ribbons[p.ribIdx];
        let speed = rib.flow * p.speedMul;

        if (ptr.active) {
          const y0 = ribbonY(rib, p.x, t) + p.offset;
          const dx = p.x - px;
          const dy = y0 - py;
          const d2 = dx * dx + dy * dy;
          if (d2 < 28000) {
            const f = (28000 - d2) / 28000;
            speed *= 1 - f * 0.6;
            p.offset += (dy > 0 ? 1 : -1) * f * 1.6;
          }
        }

        p.x += speed;
        p.offset *= 0.992;

        if (p.x > width + 60) {
          p.x = -20;
          p.ribIdx = Math.floor(Math.random() * RIBBON_COUNT);
          p.depth = ribbons[p.ribIdx].layer;
          p.offset = (Math.random() - 0.5) * 110;
        }

        const rib2 = ribbons[p.ribIdx];
        const y = ribbonY(rib2, p.x, t) + p.offset;
        const yPrev = ribbonY(rib2, p.x - p.trail, t) + p.offset;

        const grad = ctx.createLinearGradient(p.x - p.trail, yPrev, p.x, y);
        grad.addColorStop(0, "rgba(96, 165, 250, 0)");
        grad.addColorStop(1, `rgba(200, 225, 255, ${p.bright * 0.65})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = p.size * 1.2;
        ctx.beginPath();
        ctx.moveTo(p.x - p.trail, yPrev);
        const midX = p.x - p.trail / 2;
        const midY = ribbonY(rib2, midX, t) + p.offset;
        ctx.quadraticCurveTo(midX, midY, p.x, y);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = `rgba(235, 245, 255, ${p.bright})`;
        ctx.arc(p.x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = `rgba(96, 165, 250, ${p.bright * 0.22})`;
        ctx.arc(p.x, y, p.size * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---- supernovas ----
      for (let i = supernovas.length - 1; i >= 0; i--) {
        const s = supernovas[i];
        s.life++;
        const k = s.life / s.maxLife;
        if (k >= 1) {
          supernovas.splice(i, 1);
          continue;
        }
        const r = s.r + (s.maxR - s.r) * k;
        const alpha = (1 - k) * 0.8;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(190, 220, 255, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.stroke();
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
        g.addColorStop(0, `rgba(140, 200, 255, ${alpha * 0.25})`);
        g.addColorStop(1, "rgba(96, 165, 250, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // cursor halo
      if (ptr.active) {
        const cg = ctx.createRadialGradient(px, py, 0, px, py, 200);
        cg.addColorStop(0, "rgba(180, 215, 255, 0.22)");
        cg.addColorStop(0.4, "rgba(96, 165, 250, 0.07)");
        cg.addColorStop(1, "rgba(96, 165, 250, 0)");
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(px, py, 200, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;

      // cinematic vignettes — always full opacity so framing stays
      const vg1 = ctx.createLinearGradient(0, 0, 0, 160);
      vg1.addColorStop(0, "rgba(5,8,14,0.9)");
      vg1.addColorStop(1, "rgba(5,8,14,0)");
      ctx.fillStyle = vg1;
      ctx.fillRect(0, 0, width, 160);
      const vg2 = ctx.createLinearGradient(0, height - 160, 0, height);
      vg2.addColorStop(0, "rgba(5,8,14,0)");
      vg2.addColorStop(1, "rgba(5,8,14,0.9)");
      ctx.fillStyle = vg2;
      ctx.fillRect(0, height - 160, width, 160);
      const vgL = ctx.createLinearGradient(0, 0, 90, 0);
      vgL.addColorStop(0, "rgba(5,8,14,0.7)");
      vgL.addColorStop(1, "rgba(5,8,14,0)");
      ctx.fillStyle = vgL;
      ctx.fillRect(0, 0, 90, height);

      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onClick);
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
