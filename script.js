// ---------- Config: replace with real contact details ----------
const WHATSAPP_NUMBER = "910000000000"; // country code + number, digits only

const root = document.documentElement;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

// Load the popover polyfill only where native support is missing
if (!Object.hasOwn(HTMLElement.prototype, "popover")) {
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@oddbird/popover-polyfill@0.5.2/dist/popover.min.js";
  document.head.append(s);
}

/* =========================================================
   Navigation: inline when it fits, popover when it doesn't
   ========================================================= */
const header = document.querySelector(".site-header");
const inner = header.querySelector(".header-inner");
const menu = document.getElementById("site-menu");

let lastWidth = 0;
function layoutNav() {
  const width = inner.clientWidth;
  const wasWide = header.classList.contains("is-wide");
  if (!wasWide && width <= lastWidth) { lastWidth = width; return; }
  lastWidth = width;

  const wasOpen = menu.matches(":popover-open, .\\:popover-open");
  header.classList.add("is-measuring", "is-wide");
  menu.removeAttribute("popover");
  if (inner.scrollWidth > inner.clientWidth) {
    header.classList.remove("is-wide");
    menu.setAttribute("popover", "auto");
    if (wasOpen) menu.showPopover?.();
  }
  requestAnimationFrame(() => header.classList.remove("is-measuring"));
}
const ro = new ResizeObserver(layoutNav);
ro.observe(header);
ro.observe(menu);

menu.addEventListener("click", (e) => {
  if (e.target.closest("a") && menu.hasAttribute("popover")) menu.hidePopover?.();
});

const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// Highlight the section in view
const navLinks = [...menu.querySelectorAll('a[href^="#"]:not(.btn)')];
const spy = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    for (const a of navLinks) {
      if (a.getAttribute("href") === `#${entry.target.id}`) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    }
  }
}, { rootMargin: "-45% 0px -50% 0px" });
navLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean).forEach((s) => spy.observe(s));

/* =========================================================
   Pointer effects (no movement for reduced motion)
   ========================================================= */
// Glow that follows the pointer inside cards (colour only, not motion)
document.querySelectorAll("[data-glow]").forEach((el) => {
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});

if (finePointer && !reduceMotion) {
  // Cursor halo
  const glow = document.querySelector(".cursor-glow");
  let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
  window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; glow.classList.add("on"); }, { passive: true });
  (function follow() {
    gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
    glow.style.translate = `${gx}px ${gy}px`;
    requestAnimationFrame(follow);
  })();

  // 3D tilt on the hero photo
  const visual = document.querySelector(".hero-visual");
  const card = visual.querySelector("[data-tilt]");
  const shine = card.querySelector(".tilt-inner");
  visual.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    card.style.setProperty("--ry", `${(px - 0.5) * 14}deg`);
    card.style.setProperty("--rx", `${(0.5 - py) * 12}deg`);
    shine.style.setProperty("--sx", `${px * 100}%`);
    shine.style.setProperty("--sy", `${py * 100}%`);
  });
  visual.addEventListener("pointerleave", () => {
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--rx", "0deg");
  });
}

/* =========================================================
   GSAP animations
   ========================================================= */
function initAnimations() {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger || reduceMotion) {
    root.classList.remove("js-anim");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  root.classList.add("anim-ready");

  // Hero entrance
  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
  tl.fromTo(".hero-title .line > span", { yPercent: 110, opacity: 1 }, { yPercent: 0, opacity: 1, duration: 1.3, stagger: 0.12 })
    .fromTo(".hero-visual", { opacity: 0, scale: 0.85, rotateY: -18 }, { opacity: 1, scale: 1, rotateY: 0, duration: 1.6 }, 0.1)
    .fromTo(".hero-anim", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, 0.35);

  // Counters
  document.querySelectorAll(".count").forEach((el) => {
    const to = parseFloat(el.dataset.to);
    const decimals = +(el.dataset.decimals || 0);
    const obj = { v: 0 };
    gsap.to(obj, {
      v: to, duration: 2.2, ease: "power2.out", delay: 0.8,
      onUpdate: () => {
        el.textContent = el.dataset.format === "comma"
          ? Math.round(obj.v).toLocaleString("en-IN")
          : obj.v.toFixed(decimals);
      },
    });
  });

  // Section reveals
  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    gsap.fromTo(el, { opacity: 0, y: 40 }, {
      opacity: 1, y: 0, duration: 1, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });
  gsap.utils.toArray("[data-reveal-group]").forEach((group) => {
    gsap.fromTo(group.children, { opacity: 0, y: 50, rotateX: -12 }, {
      opacity: 1, y: 0, rotateX: 0, duration: 1, ease: "power3.out", stagger: 0.09,
      scrollTrigger: { trigger: group, start: "top 85%" },
    });
  });

  // Parallax layers
  gsap.utils.toArray(".parallax").forEach((el) => {
    const speed = parseFloat(el.dataset.speed || "0.1");
    gsap.fromTo(el, { y: () => -speed * 400 }, {
      y: () => speed * 400, ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
    });
  });

  // Rashi ring: pin the section and spin the ring with scroll
  const ring = document.querySelector(".ring");
  if (ring) {
    gsap.fromTo(ring, { "--rot": "20deg" }, {
      "--rot": "-340deg", ease: "none",
      scrollTrigger: { trigger: ".rashis", start: "top top", end: "+=1800", scrub: 0.8, pin: true, anticipatePin: 1 },
    });
  }

  // Timeline line draws as you scroll
  gsap.fromTo(".timeline", { "--progress": 0 }, {
    "--progress": 1, ease: "none",
    scrollTrigger: { trigger: ".timeline", start: "top 75%", end: "bottom 55%", scrub: true },
  });

  // Footer wordmark rises in
  gsap.fromTo(".footer-big", { yPercent: 40, opacity: 0 }, {
    yPercent: 0, opacity: 1, ease: "power3.out", duration: 1.2,
    scrollTrigger: { trigger: ".site-footer", start: "top 90%" },
  });

  // Magnetic buttons
  if (finePointer) {
    document.querySelectorAll(".magnetic").forEach((btn) => {
      const xTo = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3" });
      const yTo = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3" });
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
      });
      btn.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  // Recalculate once fonts and images have settled
  window.addEventListener("load", () => ScrollTrigger.refresh());
}
initAnimations();

/* =========================================================
   Booking form -> WhatsApp
   ========================================================= */
const serviceSelect = document.getElementById("f-service");
document.querySelectorAll("[data-plan]").forEach((btn) => {
  btn.addEventListener("click", () => { serviceSelect.value = btn.dataset.plan; });
});

const form = document.getElementById("book-form");
const formError = document.getElementById("form-error");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    formError.hidden = false;
    form.querySelector(":invalid")?.focus();
    return;
  }
  formError.hidden = true;
  const d = Object.fromEntries(new FormData(form));
  const lines = [
    "Namaste Krishna ji, I'd like to book a consultation.",
    "",
    `Name: ${d.name}`,
    `Phone: ${d.phone}`,
    `Consultation: ${d.service}`,
    `Date of birth: ${d.dob}`,
    `Time of birth: ${d.tob || "Not known"}`,
    `Place of birth: ${d.pob}`,
  ];
  if (d.message.trim()) lines.push("", `Question: ${d.message.trim()}`);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
});

document.getElementById("year").textContent = new Date().getFullYear();
