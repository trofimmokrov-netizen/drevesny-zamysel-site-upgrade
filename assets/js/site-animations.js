(function () {
  "use strict";

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const mobile = window.matchMedia("(max-width: 720px), (pointer: coarse)").matches;
  const hero = document.querySelector(".hero");
  const heroItems = document.querySelectorAll(
    ".hero-content .hero-label, .hero-content .hero-title, .hero-content .hero-sub, .hero-content .hero-tags, .hero-content .hero-cta-row, .hero-content .hero-stats"
  );
  const revealSelector = [
    ".section-label", ".section-title", ".section-sub", ".product-card", ".why-item", ".why-times li",
    ".step", ".process-right", ".process-card", ".material-card", ".materials-advice", ".article-card", ".review-card", ".reviews-card",
    ".form-section", ".builder-entry", ".intro", ".viewer", ".controls", ".howto"
  ].join(",");
  const gsap = window.gsap;

  function reveal(element, delay) {
    if (gsap) {
      gsap.fromTo(element,
        { autoAlpha: 0, y: 18 },
        {
          autoAlpha: 1,
          y: 0,
          duration: mobile ? 0.48 : 0.62,
          delay: delay || 0,
          ease: "power2.out",
          clearProps: "opacity,visibility,transform"
        }
      );
      return;
    }
    if (!element.animate) return;
    const animation = element.animate(
      [
        { opacity: 0, transform: "translate3d(0, 18px, 0)" },
        { opacity: 1, transform: "translate3d(0, 0, 0)" }
      ],
      { duration: mobile ? 480 : 620, delay: (delay || 0) * 1000, easing: "cubic-bezier(.2,.7,.2,1)", fill: "both" }
    );
    animation.onfinish = () => animation.cancel();
  }

  function viewportMotion() {
    heroItems.forEach((element, index) => reveal(element, index * 0.065));
    const targets = document.querySelectorAll(revealSelector);
    if (!("IntersectionObserver" in window)) {
      targets.forEach((element) => reveal(element));
      return;
    }
    const observer = new IntersectionObserver((entries, activeObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        activeObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -5% 0px" });
    targets.forEach((element) => observer.observe(element));
  }

  // A restrained scroll-linked drift gives the first screen a little depth on
  // touch devices without running a continuous animation or affecting layout.
  function mobileHeroDrift() {
    if (!mobile || !hero) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const progress = Math.max(0, Math.min(1, -hero.getBoundingClientRect().top / Math.max(hero.offsetHeight, 1)));
      hero.style.setProperty("--hero-text-drift", `${Math.round(progress * 14)}px`);
      hero.style.setProperty("--hero-image-drift", `${Math.round(progress * 12)}px`);
    };
    window.addEventListener("scroll", () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  // Keep viewport detection in IntersectionObserver on phones, where the
  // address bar can change the visual viewport during scroll. GSAP still
  // handles the motion itself when it is available.
  if (mobile || !gsap || !window.ScrollTrigger) {
    viewportMotion();
    mobileHeroDrift();
    return;
  }

  try {
    const ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);
    if (hero) {
      gsap.to(hero, {
        "--hero-image-drift": "7px",
        duration: 7.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }
    if (heroItems.length) {
      gsap.from(heroItems, {
        autoAlpha: 0, y: 22, duration: 0.72, stagger: 0.1,
        ease: "power2.out", clearProps: "transform"
      });
    }
    gsap.utils.toArray(revealSelector).forEach((element) => {
      gsap.from(element, {
        autoAlpha: 0, y: 24, duration: 0.65, ease: "power2.out",
        clearProps: "transform",
        scrollTrigger: { trigger: element, start: "top 88%", once: true }
      });
    });
    window.addEventListener("load", () => requestAnimationFrame(() => ScrollTrigger.refresh()), { once: true });
    window.addEventListener("orientationchange", () => setTimeout(() => ScrollTrigger.refresh(), 180), { passive: true });
  } catch (error) {
    viewportMotion();
  }
})();
