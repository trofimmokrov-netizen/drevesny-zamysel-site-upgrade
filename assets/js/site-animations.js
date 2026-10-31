(function () {
  "use strict";
  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const hero = document.querySelector(".hero-content");
  if (hero) {
    const heroItems = hero.querySelectorAll(".hero-label, .hero-title, .hero-sub, .hero-tags, .hero-cta-row, .hero-stats");
    gsap.from(heroItems, {
      autoAlpha: 0,
      y: 20,
      duration: 0.72,
      stagger: 0.1,
      ease: "power2.out",
      clearProps: "transform"
    });
  }

  const revealSelectors = [
    ".product-card",
    ".portfolio-card",
    ".why-item",
    ".process-item",
    ".material-card",
    ".article-card",
    ".reviews-card",
    ".form-section",
    ".builder-entry"
  ].join(",");

  gsap.utils.toArray(revealSelectors).forEach((element) => {
    gsap.from(element, {
      autoAlpha: 0,
      y: 24,
      duration: 0.65,
      ease: "power2.out",
      clearProps: "transform",
      scrollTrigger: {
        trigger: element,
        start: "top 88%",
        once: true
      }
    });
  });

  if (document.querySelector(".intro, .viewer, .controls, .howto")) {
    gsap.from([".intro", ".viewer", ".controls", ".howto"], {
      autoAlpha: 0,
      y: 20,
      duration: 0.65,
      stagger: 0.12,
      ease: "power2.out",
      clearProps: "transform"
    });
  }
})();
