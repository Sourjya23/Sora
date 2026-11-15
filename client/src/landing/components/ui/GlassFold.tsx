import { useEffect, useRef } from 'react';
import { parseCssColorToVec3 } from '../../utils/glassFoldColor';

export interface GlassFoldProps {
  /** The body of each glass pane. */
  color1?: string;
  /** The background. */
  color2?: string;
  /** The lit edges. */
  color3?: string;
  /** Animation speed. 0 freezes it. */
  speed?: number;
  /** How tightly the folds are packed. Higher is more, smaller folds. */
  scale?: number;
  /** Film grain, 0 to 0.5. */
  noise?: number;
  className?: string;
}

const VERTEX = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT = `
  precision highp float;

  uniform float u_time;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform vec3 u_color3;
  uniform float u_scale;
  uniform float u_noise;
  uniform vec2 u_resolution;
  varying vec2 vUv;

  float grain(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
  }

  vec2 centered(vec2 uv) {
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / max(u_resolution.y, 1.0);
    return p;
  }

  mat2 rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
  }

  vec3 shade(vec2 uv, float time) {
    vec2 q = rot(0.6) * centered(uv) * 2.0 * u_scale;
    float t = time * 0.6;
    float pixel = 2.0 * u_scale / max(u_resolution.y, 1.0);

    vec3 color = mix(u_color2, u_color2 * 0.45, clamp(length(centered(uv)) * 1.3, 0.0, 1.0));

    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      float bend = mod(fi, 2.0) * 2.0 - 1.0;

      float crease = (fi - 2.5) * 0.4
                   + 0.26 * sin(q.x * (1.05 + 0.12 * fi) + fi * 1.9 + t * (0.25 + 0.05 * fi))
                   + 0.1 * bend * q.x * q.x;
      float s = q.y - crease;
      float pane = smoothstep(-pixel, pixel, s);
      float back = max(s, 0.0);

      float body = exp(-back * 1.7);
      float fresnel = exp(-back * 8.0);
      float rim = exp(-back * 80.0);
      float inner = exp(-pow((back - 0.045) / 0.014, 2.0));
      float bloom = exp(-abs(s) * 20.0);

      vec3 tint = mix(u_color1, u_color3, clamp(fresnel * 0.6 + 0.08 + 0.14 * sin(fi * 2.1 + q.x * 0.8 + t * 0.2), 0.0, 1.0));
      vec3 light = tint * pane * (body * 0.42 + fresnel * 0.4)
                 + u_color3 * (pane * (rim * 0.6 + inner * 0.12) + bloom * 0.1);

      color += light * (1.0 - color);
    }

    return clamp(color, 0.0, 1.0);
  }

  void main() {
    vec3 color = shade(vUv, u_time);
    if (u_noise > 0.001) {
      float g = grain(vUv * 200.0 + u_time * 0.1);
      color *= 1.0 - u_noise * 0.4 + u_noise * g * 0.4;
    }
    gl_FragColor = vec4(color, 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

export function GlassFold({
  color1 = '#0e5b8c',
  color2 = '#041826',
  color3 = '#8cd3ff',
  speed = 0.45,
  scale = 1,
  noise = 0.08,
  className,
}: GlassFoldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef({ color1, color2, color3, speed, scale, noise });
  propsRef.current = { color1, color2, color3, speed, scale, noise };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) return;

    const vert = compileShader(gl, gl.VERTEX_SHADER, VERTEX);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vert || !frag || !program) return;

    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const u = {
      time: uniform('u_time'),
      color1: uniform('u_color1'),
      color2: uniform('u_color2'),
      color3: uniform('u_color3'),
      scale: uniform('u_scale'),
      noise: uniform('u_noise'),
      resolution: uniform('u_resolution'),
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
    };

    let elapsed = 0;
    let last: number | null = null;
    let frame = 0;
    let inView = true;

    const draw = (now: number) => {
      const p = propsRef.current;
      if (last !== null) elapsed += Math.min((now - last) / 1000, 0.1) * p.speed;
      last = now;

      resize();
      gl.uniform1f(u.time, elapsed);
      gl.uniform3fv(u.color1, parseCssColorToVec3(p.color1));
      gl.uniform3fv(u.color2, parseCssColorToVec3(p.color2));
      gl.uniform3fv(u.color3, parseCssColorToVec3(p.color3));
      gl.uniform1f(u.scale, p.scale);
      gl.uniform1f(u.noise, p.noise);
      gl.uniform2f(u.resolution, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const shouldAnimate = () => !motionQuery.matches && inView;

    const loop = (now: number) => {
      draw(now);
      if (shouldAnimate()) {
        frame = requestAnimationFrame(loop);
      } else {
        frame = 0;
      }
    };

    const startLoop = () => {
      if (frame !== 0) return;
      last = null;
      frame = requestAnimationFrame(loop);
    };

    const stopLoop = () => {
      if (frame !== 0) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      last = null;
    };

    // Paint initial frame immediately, then manage rAF based on visibility & reduced-motion
    draw(performance.now());
    if (shouldAnimate()) {
      startLoop();
    }

    const resizeObserver = new ResizeObserver(() => {
      if (!shouldAnimate()) draw(performance.now());
    });
    resizeObserver.observe(canvas);

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        inView = entry.isIntersecting;
        if (shouldAnimate()) {
          startLoop();
        } else {
          stopLoop();
        }
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(canvas);

    const handleMotionChange = () => {
      if (shouldAnimate()) {
        startLoop();
      } else {
        stopLoop();
        draw(performance.now());
      }
    };
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      stopLoop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      motionQuery.removeEventListener('change', handleMotionChange);
      gl.deleteBuffer(buffer);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="glass-fold-canvas"
      aria-hidden="true"
      className={className}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
