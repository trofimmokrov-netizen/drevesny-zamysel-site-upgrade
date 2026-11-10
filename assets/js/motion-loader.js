(function () {
  "use strict";

  var loaderScript = document.currentScript;
  if (!loaderScript || !loaderScript.src) return;

  var assetRoot = new URL("../", loaderScript.src);
  var animationUrl = new URL("js/site-animations.js?v=20261110-motion-v26", assetRoot);
  var gsapUrl = new URL("vendor/gsap.min.js", assetRoot);
  var matchesMedia = function (query) {
    return typeof window.matchMedia === "function" && window.matchMedia(query).matches;
  };
  var mobile = matchesMedia("(max-width: 720px), (pointer: coarse)")
    || (typeof window.matchMedia !== "function" && window.innerWidth <= 720);
  var hasHeroMotion = !!document.querySelector(".hero");
  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var hardwareHintsUnavailable = typeof navigator.deviceMemory !== "number"
    && typeof navigator.hardwareConcurrency !== "number";
  var constrainedConnection = !!connection && (
    connection.saveData === true
    || /^(slow-2g|2g|3g)$/.test(connection.effectiveType || "")
  );
  var lowPowerPhone = mobile && (
    (typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4)
    || (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4)
    || hardwareHintsUnavailable
    || constrainedConnection
  );
  var reducedMotion = matchesMedia("(prefers-reduced-motion: reduce)");

  // Honor the operating-system preference before requesting any animation
  // code. The page's default styles are already fully visible without it.
  if (reducedMotion) return;

  // Set the lightweight mode before the animation module is requested so
  // low-power phones skip the full-screen hero image movement immediately.
  if (lowPowerPhone) document.documentElement.classList.add("motion-lite");

  function loadScript(url, preserveOrder) {
    return new Promise(function (resolve) {
      var script = document.createElement("script");
      script.src = url.href;
      // Dynamic scripts are async by default. Setting async=false keeps their
      // execution order while still letting the browser download both files
      // in parallel, avoiding an extra network round trip before animations.
      if (preserveOrder) script.async = false;
      script.onload = function () { resolve(true); };
      script.onerror = function () { resolve(false); };
      document.body.appendChild(script);
    });
  }

  (async function () {
    // Use native Web Animations/CSS reveals on touch devices and pages without
    // hero motion. GSAP stays on desktop home/project pages for parallax and
    // richer sequences; reduced-motion users do not need the bundle either.
    if (!mobile && !lowPowerPhone && !constrainedConnection && hasHeroMotion) {
      var gsapLoad = loadScript(gsapUrl, true);
      var animationLoad = loadScript(animationUrl, true);
      await Promise.all([gsapLoad, animationLoad]);
      return;
    }
    await loadScript(animationUrl);
  })();
})();
