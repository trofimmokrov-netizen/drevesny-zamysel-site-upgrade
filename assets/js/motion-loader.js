(function () {
  "use strict";

  var loaderScript = document.currentScript;
  if (!loaderScript || !loaderScript.src) return;

  var assetRoot = new URL("../", loaderScript.src);
  var animationUrl = new URL("js/site-animations.js?v=20261108-motion-v10", assetRoot);
  var gsapUrl = new URL("vendor/gsap.min.js", assetRoot);
  var matchesMedia = function (query) {
    return typeof window.matchMedia === "function" && window.matchMedia(query).matches;
  };
  var mobile = matchesMedia("(max-width: 720px), (pointer: coarse)")
    || (typeof window.matchMedia !== "function" && window.innerWidth <= 720);
  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var constrainedConnection = !!connection && (
    connection.saveData === true
    || /^(slow-2g|2g|3g)$/.test(connection.effectiveType || "")
  );
  var lowPowerPhone = mobile && (
    (typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4)
    || (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4)
    || constrainedConnection
  );
  var reducedMotion = matchesMedia("(prefers-reduced-motion: reduce)");

  function loadScript(url) {
    return new Promise(function (resolve) {
      var script = document.createElement("script");
      script.src = url.href;
      script.onload = function () { resolve(true); };
      script.onerror = function () { resolve(false); };
      document.body.appendChild(script);
    });
  }

  (async function () {
    // Modern phones get the same composed GSAP intro as desktop. Keep the
    // native, lighter reveal path for reduced-motion preferences and phones
    // identified as low-power so older devices do not pay the animation cost.
    if (!lowPowerPhone && !reducedMotion) await loadScript(gsapUrl);
    await loadScript(animationUrl);
  })();
})();
