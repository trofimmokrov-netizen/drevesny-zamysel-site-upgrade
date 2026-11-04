(function () {
  "use strict";

  const desktopPointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!desktopPointer.matches || reducedMotion.matches) return;

  const cursor = document.createElement("div");
  cursor.className = "stair-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML = '<span class="stair-cursor__orb"><svg class="stair-cursor__icon" viewBox="0 0 24 24"><path d="M4 19h5v-5h5V9h6"/><path d="M4 19V7m5 12v-5m5 0V9m5 0V5"/></svg></span>';
  document.body.append(cursor);

  const offset = 21;
  let frame = 0;
  let x = -100;
  let y = -100;
  let targetX = x;
  let targetY = y;
  let visible = false;
  const gsap = window.gsap;
  const moveX = gsap && gsap.quickTo ? gsap.quickTo(cursor, "x", { duration: .17, ease: "power3.out" }) : null;
  const moveY = gsap && gsap.quickTo ? gsap.quickTo(cursor, "y", { duration: .17, ease: "power3.out" }) : null;

  function follow() {
    frame = 0;
    x += (targetX - x) * .28;
    y += (targetY - y) * .28;
    cursor.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    if (Math.abs(targetX - x) > .2 || Math.abs(targetY - y) > .2) frame = requestAnimationFrame(follow);
  }

  document.addEventListener("pointermove", function (event) {
    if (event.pointerType !== "mouse") return;
    targetX = event.clientX - offset;
    targetY = event.clientY - offset;
    if (!visible) {
      visible = true;
      cursor.classList.add("is-visible");
    }
    cursor.classList.toggle("is-active", Boolean(event.target.closest("a, button, [role='button'], input, select, summary, label")));
    if (moveX && moveY) {
      moveX(targetX);
      moveY(targetY);
    } else if (!frame) {
      frame = requestAnimationFrame(follow);
    }
  }, { passive: true });

  document.addEventListener("pointerdown", function () { cursor.classList.add("is-pressed"); }, { passive: true });
  window.addEventListener("pointerup", function () { cursor.classList.remove("is-pressed"); }, { passive: true });
  window.addEventListener("blur", function () { cursor.classList.remove("is-visible", "is-active", "is-pressed"); visible = false; });
  document.documentElement.addEventListener("mouseleave", function () { cursor.classList.remove("is-visible", "is-active"); visible = false; });
  document.documentElement.addEventListener("mouseenter", function (event) {
    if (event.pointerType === "mouse" && visible) cursor.classList.add("is-visible");
  });

  desktopPointer.addEventListener?.("change", function (event) {
    if (!event.matches) cursor.remove();
  });
  reducedMotion.addEventListener?.("change", function (event) {
    if (event.matches) cursor.remove();
  });
})();
