const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector("#site-nav");
const progressBar = document.querySelector("#progress-bar");
const year = document.querySelector("#year");
const intro = document.querySelector("#portfolio-intro");
const introEnter = document.querySelector(".intro-enter");
const introProgress = document.querySelector("#intro-progress");
const introProgressFill = document.querySelector("#intro-progress-fill");
const hero = document.querySelector("#home");
const heroScreen = document.querySelector(".hero-screen");
const heroVideo = document.querySelector("#hero-video");
const heroPlay = document.querySelector("#hero-play");
const heroScrubFill = document.querySelector(".hero-scroll-progress span");
const heroReaction = document.querySelector("#hero-reaction");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (year) year.textContent = new Date().getFullYear();

if (intro) {
  const introStartedAt = performance.now();
  let pageLoaded = document.readyState === "complete";
  let introClosed = false;

  window.addEventListener("load", () => { pageLoaded = true; }, { once: true });

  function closeIntro() {
    if (introClosed) return;
    introClosed = true;
    intro.classList.add("is-leaving");
    intro.setAttribute("aria-hidden", "true");
    window.setTimeout(() => intro.remove(), 750);
  }

  function updateIntroProgress(now) {
    if (introClosed) return;
    const elapsed = now - introStartedAt;
    const loadingProgress = Math.min(94, Math.floor(94 * (1 - Math.exp(-elapsed / 560))));
    const readyProgress = pageLoaded && elapsed >= 1150
      ? Math.min(100, 94 + Math.floor((elapsed - 1150) / 70))
      : loadingProgress;

    introProgress.querySelector("span").textContent = String(readyProgress);
    introProgress.setAttribute("aria-valuenow", String(readyProgress));
    introProgressFill.style.transform = `scaleX(${readyProgress / 100})`;

    if (readyProgress === 100) {
      window.setTimeout(closeIntro, 250);
      return;
    }
    window.requestAnimationFrame(updateIntroProgress);
  }

  window.requestAnimationFrame(updateIntroProgress);
  introEnter?.addEventListener("click", closeIntro, { once: true });
  document.querySelector(".skip-link")?.addEventListener("click", closeIntro, { once: true });
}

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
  nav.classList.toggle("open", !isOpen);
});

nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
    nav.classList.remove("open");
  }
});

const revealItems = document.querySelectorAll(".section-kicker, .section-heading, .about-grid, .about-stats > div, .expertise-card, .skill-panel, .timeline-item, .project, .recognition-grid, .education-grid article, .contact-layout > div");
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("reveal", "is-visible");
        activeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -28px 0px" });
  revealItems.forEach((item) => {
    item.classList.add("reveal");
    observer.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

let progressPending = false;
const heroContext = document.querySelector("#hero-context");
let heroZone = "idle";
let heroAnimationFrame = 0;
let heroZoneTimer = 0;
let greetingTimers = [];
let lastSeekAt = 0;

function setHeroProgress(value) {
  if (heroScrubFill) heroScrubFill.style.width = `${Math.min(1, Math.max(0, value)) * 100}%`;
}

function animateHeroFrame(targetTime, duration = 650, onComplete) {
  cancelAnimationFrame(heroAnimationFrame);
  if (!heroVideo || heroVideo.readyState < 1 || !Number.isFinite(heroVideo.duration)) {
    onComplete?.();
    return;
  }
  heroVideo.pause();
  const startTime = heroVideo.currentTime;
  const startAt = performance.now();
  const endTime = Math.max(0, Math.min(heroVideo.duration - 0.04, targetTime));
  if (reducedMotion.matches) {
    heroVideo.currentTime = endTime;
    setHeroProgress(endTime / heroVideo.duration);
    onComplete?.();
    return;
  }
  function step(now) {
    const raw = Math.min(1, (now - startAt) / duration);
    const eased = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
    if (now - lastSeekAt >= 45 || raw === 1) {
      try { heroVideo.currentTime = startTime + (endTime - startTime) * eased; } catch { /* Wait for the next decoded frame. */ }
      lastSeekAt = now;
    }
    setHeroProgress((startTime + (endTime - startTime) * eased) / heroVideo.duration);
    if (raw < 1) heroAnimationFrame = requestAnimationFrame(step);
    else onComplete?.();
  }
  heroAnimationFrame = requestAnimationFrame(step);
}

function clearGreetingTimers() {
  greetingTimers.forEach(window.clearTimeout);
  greetingTimers = [];
}

function setHeroContext(message) {
  if (heroContext) heroContext.textContent = message;
}

function resetHeroReaction(zone) {
  animateHeroFrame(0.08, 700, () => {
    if (heroZone !== zone) return;
    heroZone = "idle";
    hero.dataset.zone = "idle";
    hero.classList.remove("is-alt");
    setHeroContext("// BUILDING RELIABLE SYSTEMS");
    setHeroProgress(0);
  });
}

function finishCenterGreeting() {
  resetHeroReaction("center");
}

function enterHeroZone(zone) {
  if (!hero || !heroVideo || zone === heroZone) return;
  clearGreetingTimers();
  window.clearTimeout(heroZoneTimer);
  cancelAnimationFrame(heroAnimationFrame);
  heroVideo.onended = null;
  heroZone = zone;
  hero.dataset.zone = zone;
  hero.classList.toggle("is-alt", zone === "right");

  if (zone === "left" || zone === "right") {
    setHeroContext(zone === "left" ? "Anyone here on the left?" : "Anyone here on the right?");
    const clipDuration = Number.isFinite(heroVideo.duration) ? heroVideo.duration : 7;
    animateHeroFrame(clipDuration * (zone === "left" ? 0.24 : 0.53), 720, () => {
      heroZoneTimer = window.setTimeout(() => resetHeroReaction(zone), 2500);
    });
    return;
  }

  hero.classList.remove("is-alt");
  setHeroContext("Hey, it’s you!");
  if (heroVideo.readyState >= 1) {
    heroVideo.pause();
    try { heroVideo.currentTime = 0; } catch { /* The opening work frame is the fallback. */ }
    if (!reducedMotion.matches) {
      heroVideo.play().then(() => { if (heroPlay) heroPlay.hidden = true; }).catch(() => { if (heroPlay) heroPlay.hidden = false; });
      heroVideo.onended = finishCenterGreeting;
    }
  }
  greetingTimers.push(window.setTimeout(() => { if (heroZone === "center") setHeroContext("Hiiii!"); }, 1500));
  greetingTimers.push(window.setTimeout(() => { if (heroZone === "center") setHeroContext("Check out the portfolio"); }, 3800));
  if (reducedMotion.matches) greetingTimers.push(window.setTimeout(finishCenterGreeting, 6000));
}

function updateHeroZone(clientX) {
  if (!heroScreen) return;
  const bounds = heroScreen.getBoundingClientRect();
  const x = (clientX - bounds.left) / bounds.width;
  const zone = window.matchMedia("(max-width: 760px)").matches
    ? "center"
    : x < 1 / 3 ? "left" : x > 2 / 3 ? "right" : "center";
  enterHeroZone(zone);
}

heroVideo?.addEventListener("loadedmetadata", () => {
  heroVideo.pause();
  try { heroVideo.currentTime = 0.08; } catch { /* The first decoded frame is the work pose. */ }
  setHeroProgress(0);
  if (heroZone === "center" && !reducedMotion.matches) {
    heroVideo.currentTime = 0;
    heroVideo.onended = finishCenterGreeting;
    heroVideo.play().catch(() => { if (heroPlay) heroPlay.hidden = false; });
  }
}, { once: true });
heroVideo?.addEventListener("timeupdate", () => {
  if (heroZone === "center" && Number.isFinite(heroVideo.duration)) setHeroProgress(heroVideo.currentTime / heroVideo.duration);
});
heroPlay?.addEventListener("click", () => enterHeroZone("center"));
heroScreen?.addEventListener("pointermove", (event) => updateHeroZone(event.clientX));
heroScreen?.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "touch") updateHeroZone(event.clientX);
});
heroScreen?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") { event.preventDefault(); enterHeroZone("left"); }
  if (event.key === "ArrowRight") { event.preventDefault(); enterHeroZone("right"); }
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); enterHeroZone("center"); }
});
window.addEventListener("scroll", () => {
  if (progressPending) return;
  progressPending = true;
  requestAnimationFrame(() => {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const progress = height > 0 ? window.scrollY / height * 100 : 0;
    progressBar.style.width = `${progress}%`;
    progressPending = false;
  });
}, { passive: true });
