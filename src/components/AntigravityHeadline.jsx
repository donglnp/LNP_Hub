import { useEffect, useRef, useState } from "react";

/**
 * Ambient silk-wave animation with antigravity-style cursor interaction.
 * - Moving the pointer attracts the waves toward it (a "gravity well" pulls each layer up).
 * - Movement spawns ripples that expand outward and distort the wave surface.
 */
export default function AmbientWaves({ className = "" }) {
  const canvasRef = useRef(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = (e) => setReduced(e.matches);
    mq.addEventListener?.("change", fn);
    return () => mq.removeEventListener?.("change", fn);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let mounted = true;

    // pointer state
    const ptr = {
      x: 0, y: 0,
      tx: 0, ty: 0,
      active: false,
      lastSpawn: 0,
      lastMoveX: 0, lastMoveY: 0,
    };
    // expanding ripples spawned by movement
    const ripples = [];

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
      ptr.x = ptr.tx = width / 2;
      ptr.y = ptr.ty = height / 2;
    }

    const LAYERS = [
      { amp: 0.10, freq: 0.0042, speed: 0.00018, phase: 0.0, yBase: 0.30, hue: 205, sat: 80, light: 60, alpha: 0.10, pullStrength: 0.08 },
      { amp: 0.08, freq: 0.0035, speed: 0.00022, phase: 1.7, yBase: 0.45, hue: 220, sat: 85, light: 65, alpha: 0.09, pullStrength: 0.12 },
      { amp: 0.12, freq: 0.0028, speed: 0.00015, phase: 3.1, yBase: 0.55, hue: 260, sat: 70, light: 60, alpha: 0.08, pullStrength: 0.16 },
      { amp: 0.09, freq: 0.0050, speed: 0.00025, phase: 4.8, yBase: 0.65, hue: 195, sat: 90, light: 70, alpha: 0.07, pullStrength: 0.20 },
      { amp: 0.07, freq: 0.0038, speed: 0.00020, phase: 6.2, yBase: 0.78, hue: 280, sat: 65, light: 60, alpha: 0.06, pullStrength: 0.24 },
    ];

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    function onMove(e) {
      const rect = canvas.getBoundingClientRect();
      ptr.tx = e.clientX - rect.left;
      ptr.ty = e.clientY - rect.top;
      ptr.active = true;

      // throttle: spawn a ripple every ~70ms while moving
      const now = performance.now();
      const dx = ptr.tx - ptr.lastMoveX;
      const dy = ptr.ty - ptr.lastMoveY;
      const dist = Math.hypot(dx, dy);
      if (now - ptr.lastSpawn > 70 && dist > 6) {
        ripples.push({
          x: ptr.tx,
          y: ptr.ty,
          r: 4,
          maxR: 260 + Math.random() * 80,
          life: 0,
          maxLife: 1400,
          strength: Math.min(1, dist / 50),
        });
        if (ripples.length > 24) ripples.shift();
        ptr.lastSpawn = now;
        ptr.lastMoveX = ptr.tx;
        ptr.lastMoveY = ptr.ty;
      }
    }
    function onLeave() {
      ptr.active = false;
    }
    function onDown(e) {
      const rect = canvas.getBoundingClientRect();
      // big click ripple
      ripples.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        r: 8,
        maxR: 500,
        life: 0,
        maxLife: 1800,
        strength: 1.6,
      });
    }
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onDown);

    function rippleOffset(x, y, now) {
      // sum sine-decay influence from all live ripples
      let dy = 0;
      for (let i = 0; i < ripples.length; i++) {
        const rp = ripples[i];
        const dist = Math.hypot(x - rp.x, y - rp.y);
        const k = rp.life / rp.maxLife;
        const decay = 1 - k;
        // band of influence around the expanding radius
        const band = Math.exp(-Math.pow((dist - rp.r) / 50, 2));
        dy += Math.sin((dist - rp.r) * 0.08 - now * 0.005) * band * decay * 7 * rp.strength;
      }
      return dy;
    }

    function drawWave(layer, t, now) {
      const stepX = 12;
      const pts = [];
      // pointer attraction: bend the layer toward cursor (antigravity well)
      let attractX = null, attractY = null, attractRadius = 280;
      if (ptr.active) {
        attractX = ptr.x;
        attractY = ptr.y;
      }

      for (let x = -20; x <= width + 20; x += stepX) {
        let y =
          layer.yBase * height +
          Math.sin(x * layer.freq + t * layer.speed + layer.phase) * layer.amp * height +
          Math.sin(x * layer.freq * 1.7 + t * layer.speed * 0.6 + layer.phase * 0.5) *
            layer.amp *
            height *
            0.35;

        // antigravity well: pull surface UP toward the cursor
        if (attractX !== null) {
          const dx = x - attractX;
          const falloff = Math.exp(-(dx * dx) / (attractRadius * attractRadius));
          // distance from layer to cursor in y — only pull if cursor is above
          const target = attractY;
          const lift = (y - target) * falloff * layer.pullStrength * 0.25;
          y -= lift;
        }

        // ripple displacement
        y += rippleOffset(x, y, now);

        pts.push([x, y]);
      }

      // filled band
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const xc = (pts[i][0] + pts[i + 1][0]) / 2;
        const yc = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc);
      }
      ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
      ctx.lineTo(width + 20, height + 20);
      ctx.lineTo(-20, height + 20);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, layer.yBase * height - 40, 0, height);
      grad.addColorStop(0, `hsla(${layer.hue}, ${layer.sat}%, ${layer.light}%, ${layer.alpha})`);
      grad.addColorStop(1, `hsla(${layer.hue}, ${layer.sat}%, 30%, 0)`);
      ctx.fillStyle = grad;
      ctx.fill();

      // crest line
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const xc = (pts[i][0] + pts[i + 1][0]) / 2;
        const yc = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc);
      }
      ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
      ctx.strokeStyle = `hsla(${layer.hue}, 100%, 85%, ${layer.alpha * 1.5})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    function drawRippleRings(now) {
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < ripples.length; i++) {
        const rp = ripples[i];
        const k = rp.life / rp.maxLife;
        const alpha = (1 - k) * 0.35 * rp.strength;
        if (alpha <= 0) continue;
        // outer ring
        ctx.beginPath();
        ctx.strokeStyle = `hsla(200, 90%, 80%, ${alpha})`;
        ctx.lineWidth = 1.2;
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
        // inner soft glow
        const g = ctx.createRadialGradient(rp.x, rp.y, 0, rp.x, rp.y, rp.r);
        g.addColorStop(0, `hsla(220, 90%, 75%, ${alpha * 0.18})`);
        g.addColorStop(1, "hsla(220, 90%, 75%, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    }

    function drawCursorHalo() {
      if (!ptr.active) return;
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(ptr.x, ptr.y, 0, ptr.x, ptr.y, 160);
      g.addColorStop(0, "hsla(210, 100%, 80%, 0.18)");
      g.addColorStop(0.5, "hsla(260, 100%, 70%, 0.06)");
      g.addColorStop(1, "hsla(260, 100%, 70%, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ptr.x, ptr.y, 160, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }

    let lastFrame = performance.now();
    function step(now) {
      if (!mounted) return;
      const dt = Math.min(64, now - lastFrame);
      lastFrame = now;

      // smooth pointer follow
      ptr.x += (ptr.tx - ptr.x) * 0.12;
      ptr.y += (ptr.ty - ptr.y) * 0.12;

      // advance ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.life += dt;
        const k = rp.life / rp.maxLife;
        rp.r = 4 + (rp.maxR - 4) * (1 - Math.pow(1 - k, 2));
        if (rp.life >= rp.maxLife) ripples.splice(i, 1);
      }

      // soft trail
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(6,9,15,0.12)";
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < LAYERS.length; i++) {
        drawWave(LAYERS[i], now, now);
      }
      ctx.globalCompositeOperation = "source-over";

      drawRippleRings(now);
      drawCursorHalo();

      raf = requestAnimationFrame(step);
    }

    if (reduced) {
      ctx.fillStyle = "#06090f";
      ctx.fillRect(0, 0, width, height);
      for (let i = 0; i < LAYERS.length; i++) drawWave(LAYERS[i], 0, 0);
      return () => {
        mounted = false;
        ro.disconnect();
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerleave", onLeave);
        canvas.removeEventListener("pointerdown", onDown);
      };
    }

    raf = requestAnimationFrame(step);
    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={"absolute inset-0 w-full h-full block " + className}
    />
  );
}
