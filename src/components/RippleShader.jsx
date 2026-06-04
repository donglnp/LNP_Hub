import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_res;
uniform vec2 u_mouse;
uniform float u_mouseActive;
#define MAX_RIPPLES 4
uniform vec4 u_ripples[MAX_RIPPLES]; // xy = pos (uv), z = startTime, w = strength

// Ocean color palette — deep navy to shallow turquoise
vec3 deepCol    = vec3(0.020, 0.070, 0.140);
vec3 midCol     = vec3(0.040, 0.180, 0.320);
vec3 shallowCol = vec3(0.180, 0.520, 0.620);
vec3 foamCol    = vec3(0.92,  0.97,  1.00);
vec3 skyCol     = vec3(0.55,  0.78,  0.95);

void main() {
  vec2 uv = v_uv;
  float aspect = u_res.x / max(u_res.y, 1.0);
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
  float t = u_time;

  // ---- Ocean: 4 directional sine waves (cheap fake-Gerstner) ----
  // Each wave: h = A * sin(dot(D, p) * K - t * W)
  // dh/dp = D * (A*K*cos(...))
  float h = 0.0;
  vec2  grad = vec2(0.0);

  // wave 1
  vec2  D1 = vec2( 1.00,  0.20); float K1 = 6.0;  float W1 = 1.6;  float A1 = 0.06;
  float ph1 = dot(D1, p) * K1 - t * W1;
  h    += A1 * sin(ph1);
  grad += D1 * (A1 * K1 * cos(ph1));

  // wave 2 — perpendicular cross-swell
  vec2  D2 = vec2( 0.30,  0.95); float K2 = 9.0;  float W2 = 2.1;  float A2 = 0.035;
  float ph2 = dot(D2, p) * K2 - t * W2;
  h    += A2 * sin(ph2);
  grad += D2 * (A2 * K2 * cos(ph2));

  // wave 3 — short choppy detail
  vec2  D3 = vec2(-0.80,  0.55); float K3 = 18.0; float W3 = 3.4;  float A3 = 0.018;
  float ph3 = dot(D3, p) * K3 - t * W3;
  h    += A3 * sin(ph3);
  grad += D3 * (A3 * K3 * cos(ph3));

  // wave 4 — fine ripple
  vec2  D4 = vec2( 0.65, -0.75); float K4 = 32.0; float W4 = 5.0;  float A4 = 0.009;
  float ph4 = dot(D4, p) * K4 - t * W4;
  h    += A4 * sin(ph4);
  grad += D4 * (A4 * K4 * cos(ph4));

  // ---- Mouse-driven concentric ripples (rain-drop on water) ----
  const float K = 36.0;
  const float A = 8.0;
  for (int i = 0; i < MAX_RIPPLES; i++) {
    vec4 r = u_ripples[i];
    if (r.w <= 0.001) continue;
    vec2 rp = vec2((r.x - 0.5) * aspect, r.y - 0.5);
    float age = t - r.z;
    if (age < 0.0 || age > 2.6) continue;
    float life = 1.0 - smoothstep(0.0, 2.6, age);
    vec2 dvec = p - rp;
    float dist = length(dvec) + 1e-5;
    float u = dist - age * 0.55;
    float au = A * u;
    float env = exp(-au * au);
    float ph = K * u - age * 7.0;
    float s = sin(ph);
    float c = cos(ph);
    float w = r.w * life * 0.6;
    h += s * env * w;
    float dhdu = env * (K * c - 2.0 * A * A * u * s) * w;
    grad += dhdu * (dvec / dist);
  }

  // ---- Cursor dome ----
  vec2 mp = vec2((u_mouse.x - 0.5) * aspect, u_mouse.y - 0.5);
  vec2 dm = p - mp;
  float md2 = dot(dm, dm);
  float E = exp(-md2 * 55.0) * u_mouseActive * 0.4;
  h += E;
  grad += dm * (-110.0 * E);

  // ---- Surface normal ----
  vec3 N = normalize(vec3(-grad, 1.0));

  // ---- Shading ----
  // depth gradient (vertical) — deep at bottom, shallower at top
  float depth = clamp(uv.y, 0.0, 1.0);
  vec3 water = mix(deepCol, midCol, depth);
  water = mix(water, shallowCol, smoothstep(0.55, 1.0, depth) * 0.55);

  // sky / sun: light comes from upper-right
  vec3 L = normalize(vec3(0.45, 0.55, 0.70));
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 H = normalize(L + V);

  // Fresnel: at glancing angles, reflect sky; head-on → see water
  float fres = pow(1.0 - max(N.z, 0.0), 3.0);
  vec3 col = mix(water, skyCol, fres * 0.65);

  // Diffuse tint from sun
  float ndl = max(dot(N, L), 0.0);
  col += vec3(0.10, 0.18, 0.25) * ndl * 0.35;

  // Sharp specular sun glints scattered across wave crests
  float spec = pow(max(dot(N, H), 0.0), 96.0);
  col += vec3(1.0, 0.95, 0.85) * spec * 1.6;

  // Foam: appears where the height field is at a crest AND slope is sharp
  float crest = smoothstep(0.045, 0.075, h);
  float slope = smoothstep(0.4, 1.0, length(grad));
  float foam = crest * slope;
  col = mix(col, foamCol, foam * 0.65);

  // Subtle caustic shimmer in the water body (vertical bands modulated by h)
  float caustic = 0.5 + 0.5 * sin(p.x * 22.0 + h * 18.0 + t * 1.2);
  col += vec3(0.10, 0.22, 0.28) * caustic * caustic * 0.10;

  // Soft halo following cursor — like a glow under the water
  col += vec3(0.40, 0.75, 1.0) * exp(-length(dm) * 6.5) * u_mouseActive * 0.30;

  // Vignette so panel blends with surrounding overlays
  float vig = smoothstep(1.15, 0.25, length(uv - 0.5) * 1.45);
  col *= mix(0.55, 1.0, vig);

  gl_FragColor = vec4(col, 1.0);
}
`;

const MAX_RIPPLES = 4;

export default function RippleShader() {
  const canvasRef = useRef(null);
  const ripplesRef = useRef(
    Array.from({ length: MAX_RIPPLES }, () => ({ x: 0, y: 0, t: -10, s: 0 }))
  );
  const ripIdxRef = useRef(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5, active: 0, lastEmit: 0, lx: 0.5, ly: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: true, premultipliedAlpha: false });
    if (!gl) return;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uMouseActive = gl.getUniformLocation(prog, "u_mouseActive");
    const uRipples = gl.getUniformLocation(prog, "u_ripples");

    let width = 0, height = 0;
    // Render at ~0.75x screen, then CSS-scale up. Shader is fill-rate bound;
    // bilinear upscale of a smooth gradient is visually indistinguishable.
    const renderScale = 0.75;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * renderScale));
      canvas.height = Math.max(1, Math.floor(height * renderScale));
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    function onMove(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      const m = mouseRef.current;
      const dx = x - m.lx;
      const dy = y - m.ly;
      const speed = Math.sqrt(dx * dx + dy * dy);
      m.x = x; m.y = y; m.active = 1;
      const now = performance.now() / 1000;
      // emit ripple if movement is significant + throttle
      if (speed > 0.012 && now - m.lastEmit > 0.05) {
        const r = ripplesRef.current[ripIdxRef.current];
        r.x = x; r.y = y; r.t = now;
        r.s = Math.min(1.0, 0.4 + speed * 18.0);
        ripIdxRef.current = (ripIdxRef.current + 1) % MAX_RIPPLES;
        m.lastEmit = now;
      }
      m.lx = x; m.ly = y;
    }
    function onLeave() { mouseRef.current.active = 0; }
    function onClick(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      const r = ripplesRef.current[ripIdxRef.current];
      r.x = x; r.y = y; r.t = performance.now() / 1000; r.s = 1.4;
      ripIdxRef.current = (ripIdxRef.current + 1) % MAX_RIPPLES;
    }

    const parent = canvas.parentElement;
    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseleave", onLeave);
    parent.addEventListener("click", onClick);

    const start = performance.now();
    const ripData = new Float32Array(MAX_RIPPLES * 4);
    let raf = 0;
    function frame() {
      const t = (performance.now() - start) / 1000;
      for (let i = 0; i < MAX_RIPPLES; i++) {
        const r = ripplesRef.current[i];
        ripData[i * 4 + 0] = r.x;
        ripData[i * 4 + 1] = r.y;
        ripData[i * 4 + 2] = r.t;
        ripData[i * 4 + 3] = r.s;
      }
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(uMouseActive, mouseRef.current.active);
      gl.uniform4fv(uRipples, ripData);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
      parent.removeEventListener("click", onClick);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
}
