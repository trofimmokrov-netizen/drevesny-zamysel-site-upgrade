(function () {
  "use strict";

  // Keep the page usable in older embedded/mobile browsers too. If motion
  // preferences cannot be queried, continue with the regular reveal path.
  const matchesMedia = (query) => typeof window.matchMedia === "function"
    && window.matchMedia(query).matches;
  const reduceMotion = matchesMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion) return;

  const mobile = matchesMedia("(max-width: 720px), (pointer: coarse)")
    || (typeof window.matchMedia !== "function" && window.innerWidth <= 720);
  const lowPowerDevice = mobile && (
    (typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4)
    || (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4)
  );
  if (lowPowerDevice) document.documentElement.classList.add("motion-lite");
  const hero = document.querySelector(".hero");
  if (hero && "IntersectionObserver" in window) {
    const heroMotionObserver = new IntersectionObserver(([entry]) => {
      document.documentElement.classList.toggle("hero-motion-active", entry.isIntersecting);
    }, { threshold: 0.01 });
    heroMotionObserver.observe(hero);
  } else if (hero) {
    document.documentElement.classList.add("hero-motion-active");
  }
  // Let touch scrolling take priority over decorative hero movement. This
  // avoids animating a full-bleed image on every frame while an older phone
  // is already compositing the page during a finger scroll.
  if (mobile && hero) {
    let heroScrollResumeTimer = 0;
    const pauseHeroWhileScrolling = () => {
      document.documentElement.classList.add("hero-scroll-paused");
      window.clearTimeout(heroScrollResumeTimer);
      heroScrollResumeTimer = window.setTimeout(() => {
        document.documentElement.classList.remove("hero-scroll-paused");
      }, 220);
    };
    window.addEventListener("scroll", pauseHeroWhileScrolling, { passive: true });
  }
  const homeHeroItems = document.querySelectorAll(
    ".hero-content .hero-label, .hero-content .hero-title, .hero-content .hero-sub, .hero-content .hero-note, .hero-content .hero-stats"
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
    ".featured-case", ".epoxy-project-link", ".contact-item", ".training-card", ".training-points li", ".training-offer", ".training-note", ".dealer-note",
    ".spec", ".gallery figure", ".videos > div", ".price-card", ".end-cta",
    ".article-header > *", ".article-cover", ".article-summary", ".article-toc", ".article-section", ".article-checklist", ".article-faq", ".article-related", ".article-aside", ".article-index__intro > *", ".article-index-card"
  ].join(",");
  // On entry-level phones, native opacity/position transitions are cheaper
  // than building a GSAP timeline for every item in the opening sequence.
  const gsap = mobile && lowPowerDevice ? null : window.gsap;
  const cssMotionFallback = !gsap && typeof Element.prototype.animate !== "function";
  if (cssMotionFallback) document.documentElement.classList.add("motion-css-fallback");

  // Add a restrained camera response to the hero photo on desktop. Like the
  // floating phone animation in the reference site, the visual reacts to the
  // visitor, but only the image layer moves; text and controls stay steady.
  // It is deliberately disabled on touch devices and reduced-power phones.
  if (hero && !mobile && gsap && matchesMedia("(hover: hover) and (pointer: fine)")) {
    const moveCamera = (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      const bounds = hero.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * -12;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -8;
      gsap.to(hero, {
        "--hero-pointer-x": `${x.toFixed(1)}px`,
        "--hero-pointer-y": `${y.toFixed(1)}px`,
        duration: 1.15,
        ease: "power2.out",
        overwrite: "auto"
      });
    };
    const resetCamera = () => gsap.to(hero, {
      "--hero-pointer-x": "0px",
      "--hero-pointer-y": "0px",
      duration: 1.5,
      ease: "power2.out",
      overwrite: "auto"
    });
    hero.addEventListener("pointermove", moveCamera, { passive: true });
    hero.addEventListener("pointerleave", resetCamera, { passive: true });
  }

  const motion = mobile
    // Keep phone content readable during the entrance; a short translation
    // supplies the motion without fading copy or applying a blur.
    ? { duration: lowPowerDevice ? 1.15 : 1.35, lift: lowPowerDevice ? 8 : 10, scale: 1, blur: 0, ease: "power2.out", heroStagger: lowPowerDevice ? 0.16 : 0.2, sectionStagger: lowPowerDevice ? 0.1 : 0.13, sectionStaggerMax: lowPowerDevice ? 0.28 : 0.4 }
    : { duration: 1.2, lift: 14, scale: 1, blur: 0, ease: "power2.out", heroStagger: 0.24, sectionStagger: 0, sectionStaggerMax: 0 };

  function reveal(element, delay) {
    const reviewCard = element.matches(".review-card");
    const revealLift = motion.lift + (reviewCard ? 8 : 0);
    const revealScale = reviewCard ? 0.985 : motion.scale;
    if (gsap) {
      if (!mobile) {
        const startDelay = delay || 0;
        // Keep desktop content fully legible throughout the reveal. The
        // screenshot-based review showed opacity made entire sections look
        // washed out while they entered; a small lift carries the motion alone.
        gsap.set(element, { autoAlpha: 1, y: revealLift, scale: revealScale });
        gsap.to(element, {
          y: 0,
          scale: 1,
          duration: motion.duration,
          delay: startDelay,
          ease: motion.ease,
          force3D: true,
          clearProps: "transform"
        });
        return;
      }
      // Keep mobile copy legible throughout the entrance; motion comes from
      // the short lift only, never from fading the text out.
      gsap.set(element, { autoAlpha: 1 });
      const from = { y: revealLift, scale: revealScale };
      const to = {
        y: 0,
        scale: 1,
        duration: motion.duration,
        delay: delay || 0,
        ease: motion.ease,
        force3D: !mobile,
        clearProps: mobile ? "opacity,visibility,transform" : "opacity,visibility,transform,filter"
      };
      if (!mobile) {
        from.filter = `blur(${motion.blur}px)`;
        to.filter = "blur(0px)";
      }
      gsap.fromTo(element, from, to);
      return;
    }
    if (!element.animate) {
      element.classList.add("motion-css-reveal");
      const fallbackDelay = Math.max(24, (delay || 0) * 1000);
      window.setTimeout(() => element.classList.add("motion-css-visible"), fallbackDelay);
      window.setTimeout(() => element.classList.remove("motion-css-reveal", "motion-css-visible"), fallbackDelay + motion.duration * 1000 + 80);
      return;
    }
    const from = { opacity: 1, transform: mobile ? `translateY(${revealLift}px) scale(${revealScale})` : `translate3d(0, ${revealLift}px, 0) scale(${revealScale})` };
    const to = { opacity: 1, transform: mobile ? "translateY(0)" : "translate3d(0, 0, 0) scale(1)" };
    if (!mobile) {
      from.filter = `blur(${motion.blur}px)`;
      to.filter = "blur(0px)";
    }
    const animation = element.animate([from, to], {
      duration: motion.duration * 1000,
      delay: (delay || 0) * 1000,
      easing: "cubic-bezier(.4,0,.2,1)",
      fill: "both"
    });
    animation.onfinish = () => animation.cancel();
  }

  // Let a card's message arrive in a small reading order: heading, explanation,
  // supporting points, then actions. Staggering only these few text layers adds
  // depth without animating every character or making long pages feel busy.
  const copyLayers = [
    [".product-card", ".product-body > h3, .product-body > p, .product-fit, .product-body > .btn-card"],
    [".why-item", "h3, p"],
    [".process-card", "h3, p, ul"],
    [".review-card", ".review-card__meta, blockquote, .review-card__source"]
  ];

  function revealSceneItem(element, delay) {
    // Reveal once when the item enters view. Keep text and photos at full
    // opacity; the restrained lift carries the motion without reducing contrast.
    const group = copyLayers.find(([selector]) => element.matches(selector));
    reveal(element, delay || 0);
    if (!group) return;
    element.querySelectorAll(group[1]).forEach((child, index) => {
      reveal(child, (delay || 0) + 0.12 + index * (lowPowerDevice ? 0.07 : 0.09));
    });
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
          { autoAlpha: 1, y: 7 },
          { autoAlpha: 1, y: 0, duration: lowPowerDevice ? 1.5 : 1.7, stagger: lowPowerDevice ? 0.12 : 0.16, ease: motion.ease, force3D: !lowPowerDevice, clearProps: "opacity,visibility,transform" },
          0
        );
        headerItems.forEach((element) => initialTargets.add(element));
      }
      intro.fromTo(heroItems,
        { autoAlpha: 1, y: motion.lift },
        { autoAlpha: 1, y: 0, duration: motion.duration, stagger: motion.heroStagger, ease: motion.ease, force3D: !lowPowerDevice, clearProps: "opacity,visibility,transform" },
        0.12
      );
      heroItems.forEach((element) => initialTargets.add(element));
      const tags = hero.querySelectorAll(".hero-tags .hero-tag");
      if (tags.length) {
        intro.fromTo(tags,
          { autoAlpha: 1, y: 8 },
          { autoAlpha: 1, y: 0, duration: lowPowerDevice ? 1.4 : 1.65, stagger: lowPowerDevice ? 0.11 : 0.15, ease: motion.ease, force3D: !lowPowerDevice, clearProps: "opacity,visibility,transform" },
          1.48
        );
      }
      const actions = hero.querySelectorAll(".hero-cta-row > a");
      if (actions.length) {
        intro.fromTo(actions,
          { autoAlpha: 1, y: 9 },
          { autoAlpha: 1, y: 0, duration: lowPowerDevice ? 1.5 : 1.75, stagger: lowPowerDevice ? 0.12 : 0.16, ease: motion.ease, force3D: !lowPowerDevice, clearProps: "opacity,visibility,transform" },
          2.12
        );
      }
    } else {
      headerItems.forEach((element, index) => reveal(element, 0.03 + index * 0.04));
      heroItems.forEach((element, index) => reveal(element, mobile ? 0.1 + index * motion.heroStagger : 0.18 + index * motion.heroStagger));
      if (mobile && heroItems.length) {
        hero.querySelectorAll(".hero-tags .hero-tag").forEach((element, index) => reveal(element, 0.72 + index * 0.045));
        hero.querySelectorAll(".hero-cta-row > a").forEach((element, index) => reveal(element, 0.94 + index * 0.06));
      }
    }
    if (mobile && heroMedia) {
      initialTargets.add(heroMedia);
      if (mobile && gsap && heroItems.length) {
        gsap.fromTo(heroMedia,
          { autoAlpha: 1, y: 14, scale: 1.035 },
          { autoAlpha: 1, y: 0, scale: 1, duration: lowPowerDevice ? 1.45 : 1.7, delay: 0.48, ease: motion.ease, force3D: !lowPowerDevice, clearProps: "opacity,visibility,transform" }
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
    // Reveal each section once when it enters view. Motion is a brief lift,
    // independent of scroll distance, so slow wheel or finger movement never
    // leaves content half-revealed.
    // Keep the catalog static and immediately readable. Its cards were
    // appearing washed out on some desktop scroll paths even though the reveal
    // only animates transforms; other sections retain their normal motion.
    const targets = Array.from(document.querySelectorAll(revealSelector))
      .filter((element) => !element.closest("#products"));
    if (!("IntersectionObserver" in window)) {
      if (cssMotionFallback) {
        const pending = Array.from(targets).filter((element) => !initialTargets.has(element));
        let frameQueued = false;
        const revealVisible = () => {
          frameQueued = false;
          const visible = pending.filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.top < window.innerHeight * 0.94 && rect.bottom > 0;
          });
          visible.forEach((element, index) => {
            pending.splice(pending.indexOf(element), 1);
            reveal(element, mobile ? Math.min(index * motion.sectionStagger, motion.sectionStaggerMax) : 0);
          });
          if (!pending.length) {
            window.removeEventListener("scroll", queueReveal);
            window.removeEventListener("resize", queueReveal);
          }
        };
        const queueReveal = () => {
          if (frameQueued) return;
          frameQueued = true;
          window.requestAnimationFrame(revealVisible);
        };
        window.addEventListener("scroll", queueReveal, { passive: true });
        window.addEventListener("resize", queueReveal, { passive: true });
        queueReveal();
        return;
      }
      targets.forEach((element) => { if (!initialTargets.has(element)) reveal(element); });
      return;
    }
    const observer = new IntersectionObserver((entries, activeObserver) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      visibleEntries.forEach((entry, index) => {
        const reviewCard = entry.target.matches(".review-card");
        const stagger = reviewCard ? (lowPowerDevice ? 0.1 : 0.14) : motion.sectionStagger;
        const staggerMax = reviewCard ? 0.42 : motion.sectionStaggerMax;
        revealSceneItem(entry.target, Math.min(index * stagger, staggerMax));
        activeObserver.unobserve(entry.target);
      });
    }, { threshold: mobile ? 0.04 : 0.08, rootMargin: mobile ? "0px 0px -2% 0px" : "0px 0px -5% 0px" });
    targets.forEach((element) => { if (!initialTargets.has(element)) observer.observe(element); });
  }

  // IntersectionObserver starts each reveal on entry; the animation then
  // completes independently of wheel distance on desktop and finger motion.
  try {
    viewportMotion();
  } catch (error) {
    // Animation code must never leave content hidden if a browser has a
    // partial Web Animations / IntersectionObserver implementation.
    document.querySelectorAll(".site-header .nav-logo, .site-header .burger-btn, .topbar .brand, .hero, .hero *, .intro, .viewer, .mobile-config-nav")
      .forEach((element) => {
        element.style.opacity = "";
        element.style.visibility = "";
        element.style.transform = "";
        element.style.filter = "";
      });
  }
})();
