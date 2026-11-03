(function () {
  "use strict";
  const paths = {
    oak: "./assets/images/materials/oak.jpg",
    ash: "./assets/images/materials/yasen.jpg",
    larch: "./assets/images/materials/listvennitsa.jpg",
    walnut: "./assets/images/materials/american-walnut.jpg"
  };
  const filters = {};
  const names = { oak: "Дуб", ash: "Ясень", larch: "Лиственница", walnut: "Американский орех" };
  const select = document.getElementById("wood");
  const trigger = document.getElementById("woodPreviewTrigger");
  const dialog = document.createElement("dialog");
  dialog.className = "wood-preview-dialog";
  dialog.setAttribute("aria-label", "Текстура древесины крупным планом");
  dialog.innerHTML = '<button class="wood-preview-dialog__close" type="button" aria-label="Закрыть">×</button><figure><img alt=""><figcaption></figcaption></figure>' +
    (select ? '<button class="wood-preview-dialog__select" type="button">Выбрать материал</button>' : "");
  document.body.appendChild(dialog);
  const image = dialog.querySelector("img");
  const caption = dialog.querySelector("figcaption");
  let previewKey = "oak";

  function open(key) {
    const wood = paths[key] ? key : "oak";
    previewKey = wood;
    image.src = paths[wood];
    image.alt = "Фактура древесины: " + names[wood].toLowerCase();
    image.style.filter = filters[wood] || "none";
    caption.textContent = names[wood] + " · фактура материала крупным планом";
    const selectButton = dialog.querySelector(".wood-preview-dialog__select");
    if (selectButton) selectButton.textContent = "Выбрать: " + names[wood];
    const wasOpen = dialog.open;
    if (!wasOpen) dialog.showModal();
    if (!wasOpen && window.gsap && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.gsap.fromTo(dialog, { autoAlpha: 0, scale: 0.985 }, {
        autoAlpha: 1, scale: 1, duration: 0.28, ease: "power2.out", clearProps: "opacity,visibility,transform"
      });
    }
  }

  function closePreview() {
    if (!dialog.open) return;
    if (window.gsap && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.gsap.to(dialog, {
        autoAlpha: 0, scale: 0.99, duration: 0.16, ease: "power1.in",
        onComplete: () => { dialog.close(); dialog.style.opacity = ""; dialog.style.visibility = ""; dialog.style.transform = ""; }
      });
    } else dialog.close();
  }

  dialog.querySelector(".wood-preview-dialog__close").addEventListener("click", closePreview);
  dialog.addEventListener("click", (event) => { if (event.target === dialog) closePreview(); });
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); closePreview(); });

  document.querySelectorAll(".material-card .material-img img").forEach((img) => {
    const card = img.closest(".material-card");
    const title = card?.querySelector("h3")?.textContent.trim() || img.alt;
    const key = Object.keys(names).find((item) => names[item].toLowerCase() === title.toLowerCase()) ||
      Object.keys(paths).find((item) => img.src.toLowerCase().includes(item) || img.src.toLowerCase().includes({ ash: "yasen", larch: "listvennitsa" }[item] || item)) || "oak";
    img.setAttribute("loading", "lazy");
    img.setAttribute("title", "Нажмите, чтобы рассмотреть фактуру " + title.toLowerCase());
    img.setAttribute("tabindex", "0");
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", "Рассмотреть фактуру: " + title);
    img.addEventListener("click", () => open(key));
    img.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(key); }
    });
  });

  if (trigger && select) {
    const options = document.createElement("div");
    options.className = "wood-material-options";
    options.setAttribute("role", "group");
    options.setAttribute("aria-label", "Быстрый выбор породы дерева");
    Object.keys(paths).forEach((key) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "wood-material-option";
      option.dataset.wood = key;
      option.setAttribute("aria-pressed", String(select.value === key));
      option.innerHTML = '<img src="' + paths[key] + '" alt="" loading="lazy" decoding="async"><span>' + names[key] + '</span>';
      option.addEventListener("click", () => {
        select.value = key;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        open(key);
      });
      options.appendChild(option);
    });
    (select.closest(".field") || select).insertAdjacentElement("afterend", options);
    select.addEventListener("change", () => {
      options.querySelectorAll(".wood-material-option").forEach((option) => {
        option.setAttribute("aria-pressed", String(option.dataset.wood === select.value));
      });
    });
    trigger.addEventListener("click", () => open(select.value));
    dialog.querySelector(".wood-preview-dialog__select").addEventListener("click", () => {
      select.value = previewKey;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      closePreview();
    });
  }
})();
