(function () {
  "use strict";

  var builder = document.querySelector(".builder");
  var wrap = document.getElementById("canvasWrap");
  var loading = document.getElementById("canvasLoading");
  var error = document.getElementById("canvasError");
  var loaderBase = document.currentScript && document.currentScript.src
    ? document.currentScript.src
    : new URL("assets/js/constructor-loader.js", document.baseURI).href;
  var observer;
  var started = false;

  if (!builder || !wrap) return;

  function showFailure() {
    wrap.setAttribute("aria-busy", "false");
    if (loading) loading.hidden = true;
    if (error) error.hidden = false;
  }

  function addScript(src, onload, onerror) {
    var script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = onload;
    script.onerror = onerror || showFailure;
    document.head.appendChild(script);
  }

  function loadViewer() {
    if (started) return;
    started = true;
    if (observer) observer.disconnect();
    if (loading) loading.hidden = false;

    var threeUrl = new URL("../vendor/three-0.159.0.min.js", loaderBase).href;
    var appUrl = new URL("stair-configurator.js?v=20261110-mobile-performance-v6", loaderBase).href;

    addScript(threeUrl, function () {
      var appRuntimeFailed = false;
      var appPath = appUrl.split("?")[0];
      function captureAppRuntimeError(event) {
        if (!event.filename || event.filename.split("?")[0] !== appPath) return;
        appRuntimeFailed = true;
        showFailure();
      }
      function finishAppLoad() {
        window.removeEventListener("error", captureAppRuntimeError, true);
        if (appRuntimeFailed) return;
        wrap.setAttribute("aria-busy", "false");
        if (loading) loading.hidden = true;
      }
      function failAppLoad() {
        window.removeEventListener("error", captureAppRuntimeError, true);
        showFailure();
      }

      // Script load events also fire after a runtime exception. Watch errors
      // from this file so the loader does not hide its fallback for a blank
      // canvas on browsers with different WebGL behavior.
      window.addEventListener("error", captureAppRuntimeError, true);
      addScript(appUrl, finishAppLoad, failAppLoad);
    });
  }

  if ("IntersectionObserver" in window) {
    // Start close enough to the viewport to hide startup latency, but don't
    // build the WebGL scene hundreds of pixels before the visitor reaches it.
    // This keeps the constructor page lighter during the initial mobile scroll.
    var compactViewport = typeof window.matchMedia === "function"
      && window.matchMedia("(max-width: 720px)").matches;
    var prewarmDistance = compactViewport ? 180 : 320;
    observer = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) loadViewer();
    }, { rootMargin: prewarmDistance + "px 0px" });
    observer.observe(builder);
  } else {
    loadViewer();
  }
})();
