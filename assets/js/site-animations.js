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
  if (mobile && !document.getElementById("site-image-reveal-style")) {
    const imageRevealStyle = document.createElement("style");
    imageRevealStyle.id = "site-image-reveal-style";
    imageRevealStyle.textContent = ".motion-image-pending{opacity:0!important}.motion-image-ready{opacity:1!important;transition:opacity 1.8s cubic-bezier(.22,.61,.36,1)}";
    document.head.appendChild(imageRevealStyle);
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
    ".featured-case", ".epoxy-project-link", ".contact-item",
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
    // Keep the entrance visible on phones, using only opacity and a short
    // translation so older devices do not pay for blur or scale effects.
    ? { duration: lowPowerDevice ? 2.9 : 3.2, lift: lowPowerDevice ? 10 : 14, scale: 1, blur: 0, ease: "power1.inOut", heroStagger: lowPowerDevice ? 0.32 : 0.42, sectionStagger: lowPowerDevice ? 0.24 : 0.32, sectionStaggerMax: lowPowerDevice ? 0.72 : 1.02 }
    : { duration: 2.05, lift: 18, scale: 1, blur: 0, ease: "power2.inOut", heroStagger: 0.34, sectionStagger: 0, sectionStaggerMax: 0 };

  function reveal(element, delay) {
    if (gsap) {
      const from = { autoAlpha: 0, y: motion.lift, scale: motion.scale };
      const to = {
        autoAlpha: 1,
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
    const from = { opacity: 0, transform: mobile ? `translateY(${motion.lift}px)` : `translate3d(0, ${motion.lift}px, 0) scale(${motion.scale})` };
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

  // Mobile scroll reveals follow the user's scroll position instead of
  // starting a timer as soon as an item enters the viewport. This keeps
  // gradual finger scrolling gradual, while remaining lightweight on older
  // phones (opacity + transform only, one shared animation frame loop).
  const activeScrollReveals = new Set();
  let scrollRevealFrame = 0;
  function renderScrollReveals() {
    scrollRevealFrame = 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    // Batch layout reads before style writes to avoid repeated forced layout
    // calculations when several cards enter together on lower-powered phones.
    const updates = Array.from(activeScrollReveals, (entry) => {
      const top = entry.element.getBoundingClientRect().top;
      // Give each reveal more scroll distance. This is especially noticeable
      // with a mouse wheel's small, repeated steps: the content now unfolds
      // across most of the viewport instead of appearing in a short burst.
      // Start just before the card reaches the viewport and let it unfold
      // across most of the screen. This avoids a quick opacity jump during
      // slow, small finger scrolls on phones.
      const raw = Math.max(0, Math.min(1, (viewportHeight - top) / (viewportHeight * 0.82)));
      const smooth = raw * raw * (3 - 2 * raw);
      const children = entry.children.map((child, index) => {
        const start = Math.min(0.34, 0.12 + index * 0.045);
        const childRaw = Math.max(0, Math.min(1, (raw - start) / (1 - start)));
        return { element: child, progress: childRaw * childRaw * (3 - 2 * childRaw) };
      });
      return { entry, raw, smooth, children };
    });
    updates.forEach(({ entry, raw, smooth, children }) => {
      if (raw >= 1) {
        entry.element.style.removeProperty("opacity");
        entry.element.style.removeProperty("transform");
        children.forEach(({ element }) => {
          element.style.removeProperty("opacity");
          element.style.removeProperty("transform");
        });
        activeScrollReveals.delete(entry);
        return;
      }
      entry.element.style.opacity = String(smooth);
      entry.element.style.transform = `translate3d(0, ${(1 - smooth) * 14}px, 0)`;
      children.forEach(({ element, progress }) => {
        element.style.opacity = String(progress);
        element.style.transform = `translate3d(0, ${(1 - progress) * 8}px, 0)`;
      });
    });
  }
  function queueScrollRevealFrame() {
    if (!scrollRevealFrame) scrollRevealFrame = window.requestAnimationFrame(renderScrollReveals);
  }
  if (mobile) {
    window.addEventListener("scroll", queueScrollRevealFrame, { passive: true });
    window.addEventListener("resize", queueScrollRevealFrame, { passive: true });
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
  function waitForImage(image) {
    const decode = () => typeof image.decode === "function"
      ? Promise.resolve().then(() => image.decode()).catch(() => undefined)
      : Promise.resolve();
    if (image.complete) return decode();
    image.classList.add("motion-image-pending");
    return new Promise((resolve) => {
      let timeout;
      let settled = false;
      const cleanup = () => {
        window.clearTimeout(timeout);
        image.removeEventListener("load", onLoad);
        image.removeEventListener("error", onError);
      };
      const onLoad = () => {
        cleanup();
        decode().then(() => {
          window.requestAnimationFrame(() => {
            image.classList.remove("motion-image-pending");
            image.classList.add("motion-image-ready");
            if (!settled) {
              settled = true;
              resolve();
            }
          });
        });
      };
      const onError = () => {
        cleanup();
        image.classList.remove("motion-image-pending");
        if (!settled) {
          settled = true;
          resolve();
        }
      };
      image.addEventListener("load", onLoad, { once: true });
      image.addEventListener("error", onError, { once: true });
      // Keep a broken or very slow image from holding the rest of the page.
      timeout = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        // Never leave a slow image hidden if decoding takes longer than the
        // reveal budget. The card should still become usable and visible.
        image.classList.remove("motion-image-pending");
        image.classList.add("motion-image-ready");
        resolve();
      }, 2400);
    });
  }

  async function revealSceneItem(element, delay, scrollLinked) {
    // On phones, lazy images can finish decoding after the card's fade has
    // completed. That makes the photo look like it flashes on top of the
    // animation. Let visible card images decode first, then reveal the whole
    // card as one smooth unit. Other text-only sections do not wait.
    if (mobile) {
      const group = copyLayers.find(([selector]) => element.matches(selector));
      const children = group ? Array.from(element.querySelectorAll(group[1])) : [];
      const entry = { element, children };
      // Apply the hidden start state before awaiting image decode. Otherwise
      // the card can paint once, disappear when decoding finishes, then fade
      // back in, which looks like a flash during slow scrolling.
      element.style.opacity = "0";
      element.style.transform = "translate3d(0, 14px, 0)";
      children.forEach((child) => {
        child.style.opacity = "0";
        child.style.transform = "translate3d(0, 8px, 0)";
      });
      const images = Array.from(element.querySelectorAll("img"));
      if (images.length) await Promise.all(images.map(waitForImage));
      activeScrollReveals.add(entry);
      queueScrollRevealFrame();
      return;
    }
    const group = copyLayers.find(([selector]) => element.matches(selector));
    if (scrollLinked && gsap && window.ScrollTrigger) {
      // On desktop, let the visitor's wheel or trackpad control the reveal.
      // ScrollTrigger's scrub smoothing removes the abrupt start/stop of a
      // time-only entrance when the page is moved in small increments.
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: element,
          // Use a longer travel and a little more scrub smoothing so slow
          // wheel/trackpad movement controls a calm, gradual reveal.
          start: "top 96%",
          end: () => `+=${Math.round(Math.max(window.innerHeight * 1.9, element.offsetHeight * 1.4))}`,
          scrub: 2.4,
          invalidateOnRefresh: true
        }
      });
      timeline.fromTo(element,
        { autoAlpha: 0, y: motion.lift },
        { autoAlpha: 1, y: 0, duration: 1, ease: "none" },
        0
      );
      if (group) {
        element.querySelectorAll(group[1]).forEach((child, index) => {
          timeline.fromTo(child,
            { autoAlpha: 0, y: 8 },
            { autoAlpha: 1, y: 0, duration: 1.08, ease: "none" },
            0.3 + index * 0.2
          );
        });
      }
      return;
    }
    reveal(element, delay);
    if (!group) return;
    element.querySelectorAll(group[1]).forEach((child, index) => {
      reveal(child, (delay || 0) + 0.18 + index * (lowPowerDevice ? 0.09 : 0.12));
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
          { autoAlpha: 0, y: 7 },
          { autoAlpha: 1, y: 0, duration: lowPowerDevice ? 1.5 : 1.7, stagger: lowPowerDevice ? 0.12 : 0.16, ease: motion.ease, force3D: !lowPowerDevice, clearProps: "opacity,visibility,transform" },
          0
        );
        headerItems.forEach((element) => initialTargets.add(element));
      }
      intro.fromTo(heroItems,
        { autoAlpha: 0, y: motion.lift },
        { autoAlpha: 1, y: 0, duration: motion.duration, stagger: motion.heroStagger, ease: motion.ease, force3D: !lowPowerDevice, clearProps: "opacity,visibility,transform" },
        0.12
      );
      heroItems.forEach((element) => initialTargets.add(element));
      const tags = hero.querySelectorAll(".hero-tags .hero-tag");
      if (tags.length) {
        intro.fromTo(tags,
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: lowPowerDevice ? 1.4 : 1.65, stagger: lowPowerDevice ? 0.11 : 0.15, ease: motion.ease, force3D: !lowPowerDevice, clearProps: "opacity,visibility,transform" },
          1.48
        );
      }
      const actions = hero.querySelectorAll(".hero-cta-row > a");
      if (actions.length) {
        intro.fromTo(actions,
          { autoAlpha: 0, y: 9 },
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
          { autoAlpha: 0, y: 14, scale: 1.035 },
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
    // Keep scroll reveals on older phones too. IntersectionObserver starts
    // each animation only as it enters view; the motion stays transform/opacity only.
    const targets = document.querySelectorAll(revealSelector);
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
        revealSceneItem(entry.target, mobile ? Math.min(index * motion.sectionStagger, motion.sectionStaggerMax) : 0);
        activeObserver.unobserve(entry.target);
      });
    }, { threshold: mobile ? 0.04 : 0.08, rootMargin: mobile ? "0px 0px -2% 0px" : "0px 0px -5% 0px" });
    targets.forEach((element) => { if (!initialTargets.has(element)) observer.observe(element); });
  }

  // Keep viewport detection in IntersectionObserver on phones, where the
  // address bar can change the visual viewport during scroll. Mobile reveals
  // use the browser's Web Animations API; desktop uses GSAP and ScrollTrigger.
  if (mobile || !gsap || !window.ScrollTrigger) {
    try {
      viewportMotion();
    } catch (error) {
      // Animation code must never leave the hero hidden if a browser has a
      // partial Web Animations / GSAP implementation.
      document.querySelectorAll(".site-header .nav-logo, .site-header .burger-btn, .topbar .brand, .hero, .hero *, .intro, .viewer, .mobile-config-nav")
        .forEach((element) => {
          element.style.opacity = "";
          element.style.visibility = "";
          element.style.transform = "";
          element.style.filter = "";
        });
    }
    return;
  }

  try {
    const ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);
    if (heroItems.length) {
      // Treat the opening screen as one composed sequence: the eyebrow and
      // headline arrive first, supporting copy follows, then service tags and
      // calls to action. A small longer pause makes the first impression feel
      // deliberate without holding the visitor up.
      const intro = gsap.timeline({ defaults: { ease: "power2.inOut" } });
      if (headerItems.length) {
        intro.fromTo(headerItems,
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: 1.12, stagger: 0.1, clearProps: "opacity,visibility,transform" },
          0
        );
      }
      intro.fromTo(heroItems,
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, duration: 1.85, stagger: 0.28, clearProps: "opacity,visibility,transform" },
        0.24
      );
      if (hero) {
        const tags = hero.querySelectorAll(".hero-tags .hero-tag");
        const actions = hero.querySelectorAll(".hero-cta-row > a");
        if (tags.length) {
          intro.fromTo(tags,
            { autoAlpha: 0, y: 12 },
            { autoAlpha: 1, y: 0, duration: 1.08, stagger: 0.1, clearProps: "opacity,visibility,transform" },
            1.75
          );
        }
        if (actions.length) {
          intro.fromTo(actions,
            { autoAlpha: 0, y: 14 },
            { autoAlpha: 1, y: 0, duration: 1.22, stagger: 0.14, clearProps: "opacity,visibility,transform" },
            2.42
          );
        }
      }
    }
    const introElements = new Set(heroItems);
    document.querySelectorAll(revealSelector).forEach((element) => {
      if (!introElements.has(element)) revealSceneItem(element, 0, true);
    });
    window.addEventListener("load", () => requestAnimationFrame(() => ScrollTrigger.refresh()), { once: true });
    window.addEventListener("orientationchange", () => setTimeout(() => ScrollTrigger.refresh(), 180), { passive: true });
  } catch (error) {
    viewportMotion();
  }
})();
