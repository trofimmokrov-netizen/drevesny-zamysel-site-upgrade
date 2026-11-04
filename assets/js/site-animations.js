(function () {
  "use strict";

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const mobile = window.matchMedia("(max-width: 720px), (pointer: coarse)").matches;
  const hero = document.querySelector(".hero");
  const homeHeroItems = document.querySelectorAll(
    ".hero-content .hero-label, .hero-content .hero-title, .hero-content .hero-sub, .hero-content .hero-tags, .hero-content .hero-cta-row, .hero-content .hero-note, .hero-content .hero-stats"
  );
  const projectHeroItems = hero && !hero.querySelector(".hero-content")
    ? hero.querySelectorAll(".hero-copy .eyebrow, .hero-copy h1, .hero-copy > p:not(.eyebrow), .hero-copy .price-note, .hero-copy .jump")
    : [];
  const heroItems = homeHeroItems.length ? homeHeroItems : projectHeroItems;
  const heroMedia = document.querySelector(".hero-media");
  const headerItems = document.querySelectorAll(".site-header .nav-logo, .site-header .burger-btn, .topbar .brand");
  const revealSelector = [
    ".section-label", ".section-title", ".section-sub", ".product-card", ".why-item", ".why-times li",
    ".step", ".process-right", ".process-card", ".material-card", ".materials-advice", ".article-card", ".review-card", ".reviews-card",
    ".form-section", ".builder-entry", ".intro", ".viewer", ".spec-strip", ".space-estimate", ".comfort-note", ".controls", ".howto", ".hero-media", ".ticker-wrap",
    ".featured-case", ".epoxy-project-link", ".contact-item",
    ".spec", ".gallery figure", ".videos > div", ".price-card", ".end-cta",
    ".article-header > *", ".article-cover", ".article-summary", ".article-toc", ".article-section", ".article-checklist", ".article-faq", ".article-related", ".article-aside", ".article-index__intro > *", ".article-index-card"
  ].join(",");
  const gsap = window.gsap;

  const motion = mobile
    // Use one calm, readable entrance on phones: the copy arrives in order,
    // while movement stays short enough that the page feels immediately usable.
    ? { duration: 0.68, lift: 14, scale: 0.995, blur: 0, ease: "power3.out", heroStagger: 0.075, sectionStagger: 0.035, sectionStaggerMax: 0.105 }
    : { duration: 0.62, lift: 18, scale: 1, blur: 0, ease: "power2.out", heroStagger: 0.065, sectionStagger: 0, sectionStaggerMax: 0 };

  function reveal(element, delay) {
    if (gsap) {
      gsap.fromTo(element,
        { autoAlpha: 0, y: motion.lift, scale: motion.scale, filter: motion.blur ? `blur(${motion.blur}px)` : "blur(0px)" },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: motion.duration,
          delay: delay || 0,
          ease: motion.ease,
          force3D: true,
          clearProps: "opacity,visibility,transform,filter"
        }
      );
      return;
    }
    if (!element.animate) return;
    const animation = element.animate(
      [
        { opacity: 0, filter: `blur(${motion.blur}px)`, transform: `translate3d(0, ${motion.lift}px, 0) scale(${motion.scale})` },
        { opacity: 1, filter: "blur(0px)", transform: "translate3d(0, 0, 0) scale(1)" }
      ],
      { duration: motion.duration * 1000, delay: (delay || 0) * 1000, easing: mobile ? "cubic-bezier(.16,1,.3,1)" : "cubic-bezier(.2,.7,.2,1)", fill: "both" }
    );
    animation.onfinish = () => animation.cancel();
  }

  function viewportMotion() {
    const initialTargets = new Set();
    if (mobile && heroItems.length && gsap) {
      // A single timeline keeps the mobile first screen coherent on reload:
      // brand first, then headline/copy/actions, with small cascades inside
      // the tag and action rows.
      const intro = gsap.timeline();
      if (headerItems.length) {
        intro.fromTo(headerItems,
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: 0.52, stagger: 0.06, ease: "power3.out", force3D: true, clearProps: "opacity,visibility,transform" },
          0
        );
        headerItems.forEach((element) => initialTargets.add(element));
      }
      intro.fromTo(heroItems,
        { autoAlpha: 0, y: motion.lift },
        { autoAlpha: 1, y: 0, duration: motion.duration, stagger: motion.heroStagger, ease: motion.ease, force3D: true, clearProps: "opacity,visibility,transform" },
        0.08
      );
      heroItems.forEach((element) => initialTargets.add(element));
      const tags = hero.querySelectorAll(".hero-tags .hero-tag");
      if (tags.length) {
        intro.fromTo(tags,
          { autoAlpha: 0, y: 7 },
          { autoAlpha: 1, y: 0, duration: 0.46, stagger: 0.05, ease: "power3.out", force3D: true, clearProps: "opacity,visibility,transform" },
          0.68
        );
      }
      const actions = hero.querySelectorAll(".hero-cta-row > a");
      if (actions.length) {
        intro.fromTo(actions,
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.075, ease: "power3.out", force3D: true, clearProps: "opacity,visibility,transform" },
          0.92
        );
      }
    } else {
      headerItems.forEach((element, index) => reveal(element, 0.03 + index * 0.04));
      heroItems.forEach((element, index) => reveal(element, mobile ? 0.1 + index * motion.heroStagger : 0.18 + index * motion.heroStagger));
    }
    if (mobile && heroMedia) {
      initialTargets.add(heroMedia);
      if (mobile && gsap && heroItems.length) {
        gsap.fromTo(heroMedia,
          { autoAlpha: 0, y: 14, scale: 1.035 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 1.05, delay: 0.24, ease: "power3.out", force3D: true, clearProps: "opacity,visibility,transform" }
        );
      } else {
        reveal(heroMedia, homeHeroItems.length ? 0.14 : 0.12);
      }
    }
    if (mobile && !heroItems.length) {
      [document.querySelector(".intro"), document.querySelector(".viewer"), document.querySelector(".mobile-config-nav")]
        .filter(Boolean)
        .forEach((element, index) => {
          initialTargets.add(element);
          reveal(element, 0.1 + index * 0.1);
        });
    }
    const targets = document.querySelectorAll(revealSelector);
    if (!("IntersectionObserver" in window)) {
      targets.forEach((element) => { if (!initialTargets.has(element)) reveal(element); });
      return;
    }
    const observer = new IntersectionObserver((entries, activeObserver) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      visibleEntries.forEach((entry, index) => {
        reveal(entry.target, mobile ? Math.min(index * motion.sectionStagger, motion.sectionStaggerMax) : 0);
        activeObserver.unobserve(entry.target);
      });
    }, { threshold: mobile ? 0.04 : 0.08, rootMargin: mobile ? "0px 0px -2% 0px" : "0px 0px -5% 0px" });
    targets.forEach((element) => { if (!initialTargets.has(element)) observer.observe(element); });
  }

  // Keep viewport detection in IntersectionObserver on phones, where the
  // address bar can change the visual viewport during scroll. GSAP still
  // handles the motion itself when it is available.
  if (mobile || !gsap || !window.ScrollTrigger) {
    viewportMotion();
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
        autoAlpha: 0, y: 18, duration: 0.92, delay: 0.16, stagger: 0.12,
        ease: "power3.out", clearProps: "transform"
      });
    }
    gsap.utils.toArray(revealSelector).forEach((element) => {
      gsap.from(element, {
        autoAlpha: 0, y: 18, duration: 0.82, ease: "power3.out",
        clearProps: "transform",
        scrollTrigger: { trigger: element, start: "top 90%", once: true, invalidateOnRefresh: true }
      });
    });
    window.addEventListener("load", () => requestAnimationFrame(() => ScrollTrigger.refresh()), { once: true });
    window.addEventListener("orientationchange", () => setTimeout(() => ScrollTrigger.refresh(), 180), { passive: true });
  } catch (error) {
    viewportMotion();
  }
})();
