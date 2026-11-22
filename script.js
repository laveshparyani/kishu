// ---------- Config: replace with real contact details ----------
const WHATSAPP_NUMBER = "910000000000"; // country code + number, digits only

// Load the popover polyfill only where native support is missing
if (!Object.hasOwn(HTMLElement.prototype, "popover")) {
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@oddbird/popover-polyfill@0.5.2/dist/popover.min.js";
  document.head.append(s);
}

const header = document.querySelector(".site-header");
const inner = header.querySelector(".header-inner");
const menu = document.getElementById("site-menu");

// ---------- Responsive nav: inline when it fits, popover when it doesn't ----------
let lastWidth = 0;
function layoutNav() {
  const width = inner.clientWidth;
  const wasWide = header.classList.contains("is-wide");
  if (!wasWide && width <= lastWidth) { lastWidth = width; return; }
  lastWidth = width;

  const wasOpen = menu.matches(":popover-open, .\\:popover-open");
  header.classList.add("is-measuring", "is-wide");
  menu.removeAttribute("popover");
  const fits = inner.scrollWidth <= inner.clientWidth;

  if (!fits) {
    header.classList.remove("is-wide");
    menu.setAttribute("popover", "auto");
    if (wasOpen) menu.showPopover?.();
  }
  requestAnimationFrame(() => header.classList.remove("is-measuring"));
}
const ro = new ResizeObserver(layoutNav);
ro.observe(header);
ro.observe(menu);

// Close the mobile menu after choosing a link
menu.addEventListener("click", (e) => {
  if (e.target.closest("a") && menu.hasAttribute("popover")) menu.hidePopover?.();
});

// ---------- Header border on scroll ----------
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// ---------- Highlight the section in view ----------
const navLinks = [...menu.querySelectorAll('a[href^="#"]:not(.btn)')];
const sections = navLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
const spy = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    for (const a of navLinks) {
      if (a.getAttribute("href") === `#${entry.target.id}`) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    }
  }
}, { rootMargin: "-45% 0px -50% 0px" });
sections.forEach((s) => spy.observe(s));

// ---------- Scroll reveal ----------
const reveals = document.querySelectorAll(".reveal");
const revealer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add("in");
      revealer.unobserve(entry.target);
    }
  }
}, { rootMargin: "0px 0px -8% 0px" });
reveals.forEach((el) => revealer.observe(el));

// ---------- Plan buttons preselect the consultation ----------
const serviceSelect = document.getElementById("f-service");
document.querySelectorAll("[data-plan]").forEach((btn) => {
  btn.addEventListener("click", () => { serviceSelect.value = btn.dataset.plan; });
});

// ---------- Booking form -> WhatsApp ----------
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
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  window.open(url, "_blank", "noopener");
});

document.getElementById("year").textContent = new Date().getFullYear();
