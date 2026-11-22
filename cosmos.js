// Three.js background: starfield, nebula glow and a golden armillary sphere
// that orbits the hero photo. Purely decorative; the page works without it.
import * as THREE from "./vendor/three.module.min.js";

const canvas = document.getElementById("cosmos");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const GOLD = new THREE.Color("#d9b45a");
const GOLD_LIGHT = new THREE.Color("#f4dc95");

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return; // No WebGL: the CSS background is enough
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.z = 14;

  // ---------- Textures ----------
  const dotTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.25, "rgba(255,255,255,0.8)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();

  const glowTex = (rgb) => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, `rgba(${rgb},0.9)`);
    grd.addColorStop(0.35, `rgba(${rgb},0.25)`);
    grd.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  };

  // ---------- Starfield ----------
  const makeStars = (count, spread, size, opacity) => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [new THREE.Color("#ffffff"), new THREE.Color("#fff1c9"), new THREE.Color("#c9c2ff"), GOLD_LIGHT];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 1.6;
      pos[i * 3 + 2] = -Math.random() * 90 + 4;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col.set([c.r, c.g, c.b], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size, map: dotTex, vertexColors: true, transparent: true, opacity,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    });
    return new THREE.Points(geo, mat);
  };
  const starsFar = makeStars(2600, 160, 0.32, 0.85);
  const starsNear = makeStars(260, 70, 0.55, 0.9);
  scene.add(starsFar, starsNear);

  // ---------- Nebula glows ----------
  const nebulae = new THREE.Group();
  [
    { rgb: "139,124,255", x: -22, y: 6, z: -40, s: 55, o: 0.35 },
    { rgb: "217,180,90", x: 20, y: -10, z: -45, s: 50, o: 0.22 },
    { rgb: "90,80,200", x: 6, y: -34, z: -50, s: 70, o: 0.3 },
    { rgb: "217,120,160", x: -14, y: -60, z: -55, s: 60, o: 0.18 },
  ].forEach((n) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex(n.rgb), transparent: true, opacity: n.o, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    sp.position.set(n.x, n.y, n.z);
    sp.scale.setScalar(n.s);
    nebulae.add(sp);
  });
  scene.add(nebulae);

  // ---------- Armillary sphere ----------
  const armillary = new THREE.Group();
  const spin = new THREE.Group(); // inner group that rotates continuously
  armillary.add(spin);
  scene.add(armillary);

  const ringMat = (opacity = 0.85) => new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity, depthWrite: false });
  const ring = (r, tube, rx, ry, rz, opacity) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 240), ringMat(opacity));
    m.rotation.set(rx, ry, rz);
    return m;
  };
  const rings = [
    ring(3, 0.02, Math.PI / 2, 0, 0, 0.9), // equator
    ring(3, 0.016, 0, 0, 0, 0.7), // meridian
    ring(3, 0.016, 0, Math.PI / 2, 0, 0.55), // prime vertical
    ring(3.02, 0.014, Math.PI / 2 + 0.41, 0, 0, 0.75), // ecliptic tilt
    ring(2.2, 0.01, Math.PI / 2, 0, 0.9, 0.45),
  ];
  rings.forEach((r) => spin.add(r));

  // Zodiac band with names and ticks, drawn to a texture
  const bandTex = (() => {
    const S = 1024, c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d");
    const cx = S / 2;
    g.translate(cx, cx);
    g.strokeStyle = "rgba(244,220,149,0.9)";
    g.fillStyle = "rgba(244,220,149,0.95)";
    g.lineWidth = 2;
    g.beginPath(); g.arc(0, 0, 508, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(0, 0, 440, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 360; i += 5) {
      const a = (i * Math.PI) / 180, long = i % 30 === 0;
      g.lineWidth = long ? 3 : 1.5;
      g.beginPath();
      g.moveTo(Math.cos(a) * (long ? 440 : 492), Math.sin(a) * (long ? 440 : 492));
      g.lineTo(Math.cos(a) * 508, Math.sin(a) * 508);
      g.stroke();
    }
    const names = ["MESHA", "VRISHABHA", "MITHUNA", "KARKA", "SIMHA", "KANYA", "TULA", "VRISHCHIKA", "DHANU", "MAKARA", "KUMBHA", "MEENA"];
    g.font = "600 30px Inter, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    names.forEach((n, i) => {
      const mid = ((i * 30 + 15) * Math.PI) / 180;
      g.save();
      g.rotate(mid);
      g.translate(0, -470);
      g.fillText(n, 0, 0);
      g.restore();
    });
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const band = new THREE.Mesh(
    new THREE.RingGeometry(3.4, 4.0, 128, 1),
    new THREE.MeshBasicMaterial({ map: bandTex, transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: 0.95 }),
  );
  band.rotation.x = -Math.PI / 2 + 0.35;
  armillary.add(band);

  // Dotted outer orbit
  const orbit = (() => {
    const n = 180, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pos.set([Math.cos(a) * 4.6, 0, Math.sin(a) * 4.6], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(geo, new THREE.PointsMaterial({ color: GOLD_LIGHT, size: 0.07, map: dotTex, transparent: true, opacity: 0.8, depthWrite: false }));
    p.rotation.x = 0.35;
    p.rotation.z = -0.2;
    return p;
  })();
  armillary.add(orbit);

  // Axis
  const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 7.4, 6), ringMat(0.6));
  axis.rotation.z = 0.41;
  spin.add(axis);

  // Glowing sun at the centre
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex("244,220,149"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  sunGlow.scale.setScalar(3.2);
  armillary.add(sunGlow);

  // Orbiting planets
  const planets = [
    { r: 4.6, speed: 0.22, size: 0.14, rgb: "244,220,149", tilt: 0.35, phase: 0 },
    { r: 3.02, speed: -0.35, size: 0.1, rgb: "180,170,255", tilt: -0.41, phase: 2 },
    { r: 2.2, speed: 0.5, size: 0.08, rgb: "255,190,150", tilt: 0, phase: 4 },
  ].map((p) => {
    const holder = new THREE.Group();
    holder.rotation.x = p.tilt;
    const body = new THREE.Mesh(new THREE.SphereGeometry(p.size, 16, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(`rgb(${p.rgb})`) }));
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(p.rgb), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.setScalar(p.size * 9);
    body.add(glow);
    holder.add(body);
    armillary.add(holder);
    return { ...p, body };
  });

  // ---------- Layout: keep the armillary centred on the hero photo ----------
  const anchor = document.querySelector(".tilt-card");
  let W = 0, H = 0, worldPerPx = 1;
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    const visibleH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    worldPerPx = visibleH / H;
  }
  resize();
  window.addEventListener("resize", resize);

  // ---------- Input ----------
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.tx = (e.clientX / W) * 2 - 1;
    mouse.ty = (e.clientY / H) * 2 - 1;
  }, { passive: true });

  // ---------- Render loop ----------
  const clock = new THREE.Clock();
  let intro = reduceMotion ? 1 : 0;
  let running = true;

  function frame() {
    const t = clock.getElapsedTime();
    const scrollY = window.scrollY;

    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    // Camera drifts with scroll for parallax through the starfield
    camera.position.x = mouse.x * 0.5;
    camera.position.y = -scrollY * 0.004 - mouse.y * 0.3;
    camera.lookAt(camera.position.x * 0.5, camera.position.y, 0);

    starsFar.rotation.z = t * 0.004;
    starsNear.rotation.z = -t * 0.006;
    starsNear.material.opacity = 0.65 + Math.sin(t * 1.3) * 0.25;
    nebulae.rotation.z = t * 0.003;

    if (anchor) {
      const r = anchor.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      armillary.position.x = camera.position.x * 0.5 + (cx - W / 2) * worldPerPx;
      armillary.position.y = camera.position.y + -(cy - H / 2) * worldPerPx;
      const target = (r.width * (W < 700 ? 0.56 : 0.66) * worldPerPx) / 3;
      intro = Math.min(1, intro + 0.012);
      const ease = 1 - Math.pow(1 - intro, 3);
      armillary.scale.setScalar(target * (0.6 + 0.4 * ease));
      armillary.visible = r.bottom > -H * 0.5 && r.top < H * 1.5;
    }
    const scrollSpin = scrollY * 0.0025;
    spin.rotation.y = t * 0.12 + scrollSpin;
    spin.rotation.x = 0.15 + mouse.y * 0.15;
    band.rotation.z = -t * 0.05 - scrollSpin * 0.5;
    orbit.rotation.y = t * 0.03;
    armillary.rotation.y = mouse.x * 0.25;
    armillary.rotation.x = -mouse.y * 0.1;
    sunGlow.material.opacity = 0.8 + Math.sin(t * 2) * 0.15;
    planets.forEach((p) => {
      const a = t * p.speed + p.phase;
      p.body.position.set(Math.cos(a) * p.r, 0, Math.sin(a) * p.r);
    });

    renderer.render(scene, camera);
  }

  function loop() {
    if (!running) return;
    frame();
    requestAnimationFrame(loop);
  }

  if (reduceMotion) {
    // Static scene: redraw only when layout changes
    const draw = () => requestAnimationFrame(frame);
    draw();
    window.addEventListener("scroll", draw, { passive: true });
    window.addEventListener("resize", draw);
  } else {
    loop();
    document.addEventListener("visibilitychange", () => {
      running = !document.hidden;
      if (running) { clock.getDelta(); loop(); }
    });
  }
}

init();
