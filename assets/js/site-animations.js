(function () {
  "use strict";

  // Keep the page usable in older embedded/mobile browsers too. If motion
  // preferences cannot be queried, continue with the regular reveal path.
  const matchesMedia = (query) => typeof window.matchMedia === "function"
    && window.matchMedia(query).matches;
  const reduceMotion = matchesMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion) return;

  // Stop decorative motion while the page is in a background tab. Browsers
  // throttle timers inconsistently, so an explicit root class also pauses CSS
  // animations and avoids wasting battery on mobile devices.
  const syncPageVisibility = () => {
    document.documentElement.classList.toggle("page-hidden", document.hidden);
  };
  syncPageVisibility();
  document.addEventListener("visibilitychange", syncPageVisibility, { passive: true });

  const mobile = matchesMedia("(max-width: 720px), (pointer: coarse)")
    || (typeof window.matchMedia !== "function" && window.innerWidth <= 720);
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const hardwareHintsUnavailable = typeof navigator.deviceMemory !== "number"
    && typeof navigator.hardwareConcurrency !== "number";
  const constrainedConnection = !!connection && (
    connection.saveData === true
    || /^(slow-2g|2g|3g)$/.test(connection.effectiveType || "")
  );
  const lowPowerDevice = mobile && (
    (typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4)
    || (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4)
    || hardwareHintsUnavailable
    || constrainedConnection
  );
  if (lowPowerDevice) document.documentElement.classList.add("motion-lite");
  // The main page carries these rules inline, but article and project pages
  // share this animation module without loading that page's stylesheet. Add
  // the same lightweight reveal rules there so low-power devices get the
  // intended short entrance instead of an unstyled marker class.
  if (lowPowerDevice && !document.getElementById("motion-css-fallback")) {
    const lightMotionStyles = document.createElement("style");
    lightMotionStyles.id = "motion-css-fallback";
    lightMotionStyles.textContent = `
      @keyframes motion-lite-rise { from { transform:translate3d(0,8px,0); } to { transform:translate3d(0,0,0); } }
      .motion-lite .motion-lite-reveal { animation:motion-lite-rise .78s cubic-bezier(.22,.61,.36,1) var(--motion-lite-delay,0s) both; }
      @media(prefers-reduced-motion:reduce) { .motion-lite .motion-lite-reveal { animation:none !important; } }
    `;
    document.head.appendChild(lightMotionStyles);
  }
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
      if (!document.documentElement.classList.contains("hero-motion-active")) return;
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
    ".cooperation-overview__card", ".cooperation-start", ".training-benefits li",
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
    // Reuse one setter per axis instead of allocating a fresh tween for every
    // pointer event. Browsers can dispatch pointermove more often than they
    // paint; batching to one animation frame keeps the camera response smooth
    // without building up redundant tweens during quick mouse movement.
    const pointerX = typeof gsap.quickTo === "function"
      ? gsap.quickTo(hero, "--hero-pointer-x", { duration: 1.15, ease: "power2.out" })
      : (value) => gsap.to(hero, { "--hero-pointer-x": value, duration: 1.15, ease: "power2.out", overwrite: "auto" });
    const pointerY = typeof gsap.quickTo === "function"
      ? gsap.quickTo(hero, "--hero-pointer-y", { duration: 1.15, ease: "power2.out" })
      : (value) => gsap.to(hero, { "--hero-pointer-y": value, duration: 1.15, ease: "power2.out", overwrite: "auto" });
    let pointerFrame = 0;
    let latestPointerEvent = null;
    const moveCamera = (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      latestPointerEvent = event;
      if (pointerFrame) return;
      pointerFrame = window.requestAnimationFrame(() => {
        pointerFrame = 0;
        const pointer = latestPointerEvent;
        latestPointerEvent = null;
        if (!pointer) return;
        const bounds = hero.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        const x = ((pointer.clientX - bounds.left) / bounds.width - 0.5) * -12;
        const y = ((pointer.clientY - bounds.top) / bounds.height - 0.5) * -8;
        pointerX(`${x.toFixed(1)}px`);
        pointerY(`${y.toFixed(1)}px`);
      });
    };
    const resetCamera = () => {
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      latestPointerEvent = null;
      pointerX("0px");
      pointerY("0px");
    };
    hero.addEventListener("pointermove", moveCamera, { passive: true });
    hero.addEventListener("pointerleave", resetCamera, { passive: true });
  }

  const motion = mobile
    // Keep phone content readable during the entrance; a short translation
    // supplies the motion without fading copy or applying a blur.
    ? { duration: lowPowerDevice ? 0.78 : 0.96, lift: lowPowerDevice ? 7 : 8, scale: 1, blur: 0, ease: "power2.out", heroStagger: lowPowerDevice ? 0.12 : 0.16, sectionStagger: lowPowerDevice ? 0.06 : 0.09, sectionStaggerMax: lowPowerDevice ? 0.16 : 0.24 }
    : { duration: 1.2, lift: 14, scale: 1, blur: 0, ease: "power2.out", heroStagger: 0.24, sectionStagger: 0, sectionStaggerMax: 0 };

  function reveal(element, delay) {
    const reviewCard = element.matches(".review-card");
    // Keep review cards close to their final position on phones. The former
    // extra lift and scale made the cards appear to jump while the visitor was
    // slowly scrolling through the review section.
    const revealLift = motion.lift + (reviewCard ? (mobile ? 3 : 8) : 0);
    const revealScale = reviewCard ? (mobile ? 1 : 0.985) : motion.scale;
    if (lowPowerDevice) {
      // Entry-level phones use one short CSS transform per content block.
      // Avoid allocating a Web Animations object for every text layer/card.
      element.style.setProperty("--motion-lite-delay", `${Math.min(Math.max(delay || 0, 0), 0.28)}s`);
      element.classList.add("motion-lite-reveal");
      element.addEventListener("animationend", function finishLiteReveal(event) {
        if (event.target !== element || event.animationName !== "motion-lite-rise") return;
        element.classList.remove("motion-lite-reveal");
        element.style.removeProperty("--motion-lite-delay");
        element.removeEventListener("animationend", finishLiteReveal);
      });
      return;
    }
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
      // Match the site's CSS reveal and interaction curve. Keeping the native
      // Web Animations path in sync makes the entrance feel consistent on
      // touch browsers and in the CSS fallback.
      easing: "cubic-bezier(.22,.61,.36,1)",
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
    // On phones, animate the card as one unit. Animating its heading, copy,
    // and actions separately creates competing transforms during scroll and
    // makes the reveal feel jittery on touch devices.
    if (!group || mobile || lowPowerDevice) return;
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
          { autoAlpha: 1, y: 0, duration: lowPowerDevice ? 0.9 : 1.08, stagger: lowPowerDevice ? 0.1 : 0.13, ease: motion.ease, force3D: !lowPowerDevice, clearProps: "opacity,visibility,transform" },
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
          { autoAlpha: 1, y: 0, duration: lowPowerDevice ? 0.82 : 1.02, stagger: lowPowerDevice ? 0.08 : 0.11, ease: motion.ease, force3D: !lowPowerDevice, clearProps: "opacity,visibility,transform" },
          1.48
        );
      }
      const actions = hero.querySelectorAll(".hero-cta-row > a");
      if (actions.length) {
        intro.fromTo(actions,
          { autoAlpha: 1, y: 9 },
          { autoAlpha: 1, y: 0, duration: lowPowerDevice ? 0.9 : 1.08, stagger: lowPowerDevice ? 0.1 : 0.13, ease: motion.ease, force3D: !lowPowerDevice, clearProps: "opacity,visibility,transform" },
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
          { autoAlpha: 1, y: 0, scale: 1, duration: lowPowerDevice ? 0.86 : 1.05, delay: 0.32, ease: motion.ease, force3D: !lowPowerDevice, clearProps: "opacity,visibility,transform" }
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
    const lowPowerRevealSelector = [
      ".section-label", ".section-title", ".section-sub", ".product-card", ".why-item",
      ".step", ".process-card", ".material-card", ".article-card", ".review-card",
      ".form-section", ".builder-entry", ".intro", ".viewer", ".controls",
      ".featured-case", ".training-card", ".training-offer", ".training-note",
      ".dealer-note", ".price-card", ".end-cta", ".cooperation-overview__card",
      ".cooperation-start", ".article-cover", ".article-toc", ".article-section",
      ".article-related", ".article-index-card"
    ].join(",");
    // Phones animate one useful layer per block: headings, cards and major
    // sections. Leaving nested rows and decorative copy static cuts the number
    // of simultaneous Web Animations on touch devices while keeping the page
    // lively. Desktop retains the more detailed reveal sequence.
    const activeRevealSelector = mobile ? lowPowerRevealSelector : revealSelector;
    const targets = Array.from(document.querySelectorAll(activeRevealSelector))
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
    const observedTargets = targets.filter((element) => !initialTargets.has(element));
    if (!observedTargets.length) return;
    let remainingTargets = observedTargets.length;
    const observer = new IntersectionObserver((entries, activeObserver) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      visibleEntries.forEach((entry, index) => {
        const reviewCard = entry.target.matches(".review-card");
        const stagger = reviewCard ? (lowPowerDevice ? 0.05 : 0.07) : motion.sectionStagger;
        const staggerMax = reviewCard ? 0.2 : motion.sectionStaggerMax;
        revealSceneItem(entry.target, Math.min(index * stagger, staggerMax));
        activeObserver.unobserve(entry.target);
        remainingTargets -= 1;
      });
      // The observer has no more work once every section has appeared. Drop
      // its registrations instead of keeping an idle observer for the life
      // of a long page on mobile.
      if (remainingTargets <= 0) activeObserver.disconnect();
    // Start the short reveal early enough that it is already moving when a
    // block reaches the screen, especially during slow touch scrolling. The
    // motion remains time based and independent from the finger or wheel.
    }, { threshold: mobile ? 0.01 : 0.04, rootMargin: mobile ? "0px 0px 20% 0px" : "0px 0px 5% 0px" });
    observedTargets.forEach((element) => observer.observe(element));
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
