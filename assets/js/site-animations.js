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
    imageRevealStyle.textContent = ".motion-image-pending{opacity:0!important}.motion-image-ready{opacity:1!important;transition:opacity .68s cubic-bezier(.16,1,.3,1)}";
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
    ? { duration: lowPowerDevice ? 1.4 : 1.72, lift: lowPowerDevice ? 16 : 26, scale: 1, blur: 0, ease: "power3.out", heroStagger: lowPowerDevice ? 0.16 : 0.24, sectionStagger: lowPowerDevice ? 0.1 : 0.17, sectionStaggerMax: lowPowerDevice ? 0.28 : 0.52 }
    : { duration: 1.32, lift: 22, scale: 1, blur: 0, ease: "power3.out", heroStagger: 0.2, sectionStagger: 0, sectionStaggerMax: 0 };

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
      easing: mobile ? "cubic-bezier(.16,1,.3,1)" : "cubic-bezier(.2,.7,.2,1)",
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
        resolve();
      }, 2400);
    });
  }

  async function revealSceneItem(element, delay) {
    // On phones, lazy images can finish decoding after the card's fade has
    // completed. That makes the photo look like it flashes on top of the
    // animation. Let visible card images decode first, then reveal the whole
    // card as one smooth unit. Other text-only sections do not wait.
    if (mobile) {
      const images = Array.from(element.querySelectorAll("img"));
      if (images.length) await Promise.all(images.map(waitForImage));
    }
    reveal(element, delay);
    const group = copyLayers.find(([selector]) => element.matches(selector));
    if (!group) return;
    element.querySelectorAll(group[1]).forEach((child, index) => {
      reveal(child, (delay || 0) + 0.12 + index * (lowPowerDevice ? 0.055 : 0.085));
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
          { autoAlpha: 1, y: 0, duration: lowPowerDevice ? 0.78 : 0.98, stagger: lowPowerDevice ? 0.07 : 0.1, ease: "power3.out", force3D: !lowPowerDevice, clearProps: "opacity,visibility,transform" },
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
          { autoAlpha: 1, y: 0, duration: lowPowerDevice ? 0.78 : 0.98, stagger: lowPowerDevice ? 0.06 : 0.09, ease: "power3.out", force3D: !lowPowerDevice, clearProps: "opacity,visibility,transform" },
          0.92
        );
      }
      const actions = hero.querySelectorAll(".hero-cta-row > a");
      if (actions.length) {
        intro.fromTo(actions,
          { autoAlpha: 0, y: 9 },
          { autoAlpha: 1, y: 0, duration: lowPowerDevice ? 0.82 : 1.02, stagger: lowPowerDevice ? 0.07 : 0.1, ease: "power3.out", force3D: !lowPowerDevice, clearProps: "opacity,visibility,transform" },
          1.24
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
          { autoAlpha: 1, y: 0, scale: 1, duration: lowPowerDevice ? 0.7 : 0.95, delay: 0.24, ease: "power3.out", force3D: !lowPowerDevice, clearProps: "opacity,visibility,transform" }
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
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (headerItems.length) {
        intro.fromTo(headerItems,
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: 0.78, stagger: 0.07, clearProps: "opacity,visibility,transform" },
          0
        );
      }
      intro.fromTo(heroItems,
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, duration: 1.28, stagger: 0.2, clearProps: "opacity,visibility,transform" },
        0.24
      );
      if (hero) {
        const tags = hero.querySelectorAll(".hero-tags .hero-tag");
        const actions = hero.querySelectorAll(".hero-cta-row > a");
        if (tags.length) {
          intro.fromTo(tags,
            { autoAlpha: 0, y: 12 },
            { autoAlpha: 1, y: 0, duration: 0.72, stagger: 0.075, clearProps: "opacity,visibility,transform" },
            1.12
          );
        }
        if (actions.length) {
          intro.fromTo(actions,
            { autoAlpha: 0, y: 14 },
            { autoAlpha: 1, y: 0, duration: 0.86, stagger: 0.11, clearProps: "opacity,visibility,transform" },
            1.48
          );
        }
      }
    }
    ScrollTrigger.batch(gsap.utils.toArray(revealSelector), {
      start: "top 90%",
      once: true,
      invalidateOnRefresh: true,
      batchMax: 7,
      onEnter: (batch) => batch.forEach((element, index) => {
        revealSceneItem(element, index * 0.07);
      })
    });
    window.addEventListener("load", () => requestAnimationFrame(() => ScrollTrigger.refresh()), { once: true });
    window.addEventListener("orientationchange", () => setTimeout(() => ScrollTrigger.refresh(), 180), { passive: true });
  } catch (error) {
    viewportMotion();
  }
})();
