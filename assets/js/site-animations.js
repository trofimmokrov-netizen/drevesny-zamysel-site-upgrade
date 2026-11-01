(function () {
  "use strict";
  const motionQuery = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  const reducedMotion = motionQuery && motionQuery.matches;
  if (reducedMotion) return;

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

  // Native fallback also covers browsers where GSAP or its plugin failed to load.
  const animateWithoutGsap = () => {
    const animateIn = (element, delay = 0) => {
      if (!element.animate) return;
      element.animate(
        [{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 560, delay, easing: "cubic-bezier(.2,.7,.2,1)", fill: "both" }
      );
    };

    const heroItems = document.querySelectorAll(
      ".hero-content .hero-label, .hero-content .hero-title, .hero-content .hero-sub, .hero-content .hero-tags, .hero-content .hero-cta-row, .hero-content .hero-stats"
    );
    heroItems.forEach((element, index) => animateIn(element, index * 75));

    const constructorItems = document.querySelectorAll(".intro, .viewer, .controls, .howto");
    constructorItems.forEach((element, index) => animateIn(element, index * 90));

    const revealItems = document.querySelectorAll(revealSelectors);
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries, activeObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateIn(entry.target);
          activeObserver.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
      revealItems.forEach((element) => observer.observe(element));
    } else {
      revealItems.forEach((element) => animateIn(element));
    }
  };

  if (!window.gsap || !window.ScrollTrigger) {
    animateWithoutGsap();
    return;
  }

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const mobile = window.matchMedia("(max-width: 600px)").matches;
  try {
    gsap.registerPlugin(ScrollTrigger);

    const hero = document.querySelector(".hero-content");
    if (hero) {
      const heroItems = hero.querySelectorAll(".hero-label, .hero-title, .hero-sub, .hero-tags, .hero-cta-row, .hero-stats");
      gsap.from(heroItems, {
        autoAlpha: 0,
        y: mobile ? 12 : 20,
        duration: mobile ? 0.5 : 0.72,
        stagger: mobile ? 0.07 : 0.1,
        ease: "power2.out",
        clearProps: "transform"
      });
    }

    gsap.utils.toArray(revealSelectors).forEach((element) => {
      gsap.from(element, {
        autoAlpha: 0,
        y: mobile ? 14 : 24,
        duration: mobile ? 0.48 : 0.65,
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
        y: mobile ? 12 : 20,
        duration: mobile ? 0.5 : 0.65,
        stagger: mobile ? 0.08 : 0.12,
        ease: "power2.out",
        clearProps: "transform"
      });
    }
  } catch (error) {
    // Never leave content hidden if a mobile browser fails during GSAP setup.
    document.querySelectorAll(revealSelectors + ", .hero-content > *, .intro, .viewer, .controls, .howto").forEach((element) => {
      element.style.opacity = "1";
      element.style.visibility = "visible";
      element.style.transform = "none";
    });
    animateWithoutGsap();
    return;
  }

  // Recalculate trigger positions after mobile browsers finish loading fonts
  // and images; their visual viewport can change after the initial parse.
  window.addEventListener("load", () => requestAnimationFrame(() => ScrollTrigger.refresh()), { once: true });
  window.addEventListener("orientationchange", () => {
    window.setTimeout(() => ScrollTrigger.refresh(), 180);
  }, { passive: true });
  window.addEventListener("pageshow", () => requestAnimationFrame(() => ScrollTrigger.refresh()), { passive: true });

  // Mobile browsers resize the visual viewport as their address bar opens or
  // closes. Refresh reveal triggers after that settles so sections animate at
  // the right scroll position instead of appearing to skip their animation.
  if (window.visualViewport) {
    let viewportRefreshTimer = 0;
    window.visualViewport.addEventListener("resize", () => {
      window.clearTimeout(viewportRefreshTimer);
      viewportRefreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 140);
    }, { passive: true });
  }
})();
