/**
 * Name reveal, after the PlayStation 2 boot logo: the name is never brought in
 * from anywhere. It is already in its place, as smoke. For a few frames the
 * letters are torn, glassy wisps of coloured light; then they snap into sharp
 * white type with a glow around them that dies away.
 *
 * The heading is drawn into a texture and a fragment shader samples it through
 * a fast, small-scale swirl (the tear) at a slightly raised mip level (the
 * softness). Both fall to zero as the reveal completes. The real <h1> fades in
 * underneath at the end, so the canvas can run at low resolution and be
 * thrown away.
 */

const VERT = `#version 300 es
in vec2 p;
out vec2 vUv;
void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform float uP;
uniform float uT;
uniform float uAspect;
uniform float uLod;
uniform float uK;
in vec2 vUv;
out vec4 o;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return v;
}

void main(){
  // The canvas is only a band around the name; uK scales the noise back to hero heights,
  // so the smoke looks the same as it would on a full-screen canvas.
  vec2 q = vec2(vUv.x * uAspect, vUv.y) * uK;
  // 0 while it is smoke, 1 once the type has set.
  float set = smoothstep(0.08, 0.7, uP);
  float chaos = pow(1.0 - set, 1.35);

  // The tear: a coarse swirl that bends whole letters, and a fine one that frays their edges.
  vec2 bend = vec2(fbm(q * 7.0 + vec2(0.0, uT * 2.4)), fbm(q * 7.0 + vec2(4.7, -uT * 2.1))) - 0.5;
  vec2 fray = vec2(fbm(q * 23.0 - uT * 3.1), fbm(q * 23.0 + 2.3 + uT * 2.8)) - 0.5;
  vec2 disp = (bend * 0.11 + fray * 0.035) * chaos / uK;
  disp.x /= uAspect;

  float a = textureLod(uTex, vUv + disp, uLod * 0.42 * chaos).r;

  // Smoke has holes: the letters are not filled in until they set.
  float holes = smoothstep(0.3, 0.62, fbm(q * 11.0 + vec2(uT * 1.7, -uT * 1.3)));
  a *= mix(holes * 1.5, 1.0, smoothstep(0.25, 0.72, uP));

  // The ends of the word show first, the middle fills in after (as on the console).
  float side = abs(vUv.x - 0.5) * 2.0;
  float born = smoothstep(0.0, 0.22, uP - (1.0 - side) * 0.1);
  float v = clamp(a * mix(1.9, 1.0, set), 0.0, 1.0) * born;

  // Deep colour in the thin smoke, pale where it is dense, white once set.
  vec3 smoke = mix(vec3(0.0, 0.4, 0.3), vec3(0.62, 1.0, 0.86), smoothstep(0.15, 0.9, v));
  vec3 col = mix(smoke, vec3(1.0), smoothstep(0.55, 0.85, uP));

  // The glow that hugs the type as it snaps sharp, then fades.
  float halo = textureLod(uTex, vUv, uLod * 0.62).r;
  float flash = smoothstep(0.42, 0.72, uP) * (1.0 - smoothstep(0.76, 1.0, uP));
  vec3 glow = vec3(0.06, 0.73, 0.5) * halo * flash * 1.5;

  // The letters themselves step aside as the real heading comes up underneath; only the glow lingers.
  v *= 1.0 - smoothstep(0.72, 0.84, uP);

  o = vec4(col * v + glow, clamp(v + halo * flash, 0.0, 1.0));
}`;

type Box = { left: number; top: number; width: number; height: number };

function drawName(box: Box, name: HTMLElement, scale: number): HTMLCanvasElement {
  const tex = document.createElement('canvas');
  tex.width = Math.max(2, Math.round(box.width * scale));
  tex.height = Math.max(2, Math.round(box.height * scale));
  const ctx = tex.getContext('2d')!;
  const style = getComputedStyle(name);
  const size = parseFloat(style.fontSize);
  ctx.font = `${style.fontWeight} ${size * scale}px ${style.fontFamily}`;
  if ('letterSpacing' in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${parseFloat(style.letterSpacing) * scale || 0}px`;
  }
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';

  name.querySelectorAll('span').forEach((word) => {
    // A zero-size inline-block sits exactly on the text baseline.
    const probe = document.createElement('i');
    probe.style.cssText = 'display:inline-block;width:0;height:0';
    word.prepend(probe);
    const at = probe.getBoundingClientRect();
    probe.remove();
    const text = word.textContent ?? '';
    ctx.fillText(style.textTransform === 'uppercase' ? text.toUpperCase() : text, (at.left - box.left) * scale, (at.bottom - box.top) * scale);
  });
  return tex;
}

export interface PlasmaHandle {
  /** Resolves when the animation is over or cancelled; false if the GPU context was lost. */
  done: Promise<boolean>;
  cancel: () => void;
}

export function plasmaReveal(
  hero: HTMLElement,
  canvas: HTMLCanvasElement,
  name: HTMLElement,
  duration: number,
  onSharp: () => void,
): PlasmaHandle | null {
  // Dev only: ?hold=0.4 freezes the reveal at that point to inspect a frame.
  const hold = import.meta.env.DEV ? Number(new URLSearchParams(location.search).get('hold')) : 0;
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: hold > 0 });
  if (!gl) return null;

  // Only a band around the name is drawn, not the whole hero: a third of the
  // pixels to shade on every frame, and a third of the texture to upload.
  const stage = hero.getBoundingClientRect();
  const type = name.getBoundingClientRect();
  const pad = Math.max(type.height * 1.2, 70);
  const top = Math.max(stage.top, type.top - pad);
  const bottom = Math.min(stage.bottom, type.bottom + pad);
  const box: Box = { left: stage.left, top, width: stage.width, height: bottom - top };
  canvas.style.top = `${top - stage.top}px`;
  canvas.style.bottom = 'auto';
  canvas.style.height = `${box.height}px`;
  // Sharp enough that the last frames never look upscaled, capped so the shader stays cheap.
  const scale = Math.min(Math.min(window.devicePixelRatio || 1, 2), 1800 / box.width);
  const tex = drawName(box, name, scale);
  canvas.width = tex.width;
  canvas.height = tex.height;

  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return sh;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS) || gl.isContextLost()) return null;
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const uP = gl.getUniformLocation(prog, 'uP');
  const uT = gl.getUniformLocation(prog, 'uT');
  gl.uniform1f(gl.getUniformLocation(prog, 'uAspect'), tex.width / tex.height);
  gl.uniform1f(gl.getUniformLocation(prog, 'uK'), box.height / stage.height);
  // Blur radius follows the texture size, so it looks the same at any resolution.
  gl.uniform1f(gl.getUniformLocation(prog, 'uLod'), Math.max(4, Math.log2(tex.width) - 3.4));
  gl.viewport(0, 0, tex.width, tex.height);

  let raf = 0;
  let stopped = false;
  let sharp = false;
  let finish!: (ok: boolean) => void;
  const done = new Promise<boolean>((resolve) => (finish = resolve));
  const start = performance.now();

  const release = () => cancelAnimationFrame(raf);

  // A lost context leaves an undefined (sometimes solid white) canvas behind:
  // hide it at once and let the caller fall back.
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    if (stopped) return;
    stopped = true;
    release();
    canvas.style.display = 'none';
    finish(false);
  });

  const frame = (now: number) => {
    if (stopped) return;
    const x = hold || Math.min(1, (now - start) / duration);
    gl.uniform1f(uP, x);
    gl.uniform1f(uT, (now - start) / 1000);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!sharp && x > 0.68) {
      sharp = true;
      onSharp();
    }
    if (x < 1) {
      raf = requestAnimationFrame(frame);
    } else {
      stopped = true;
      canvas.style.transition = 'opacity .25s linear';
      canvas.style.opacity = '0';
      setTimeout(() => {
        release();
        finish(true);
      }, 260);
    }
  };
  raf = requestAnimationFrame(frame);

  return {
    done,
    cancel() {
      if (stopped) return;
      stopped = true;
      release();
      finish(true);
    },
  };
}
