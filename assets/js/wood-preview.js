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
  const dialog = document.createElement("dialog");
  dialog.className = "wood-preview-dialog";
  dialog.setAttribute("aria-label", "Текстура древесины крупным планом");
  dialog.innerHTML = '<button class="wood-preview-dialog__close" type="button" aria-label="Закрыть">×</button><figure><img alt=""><figcaption></figcaption></figure>';
  document.body.appendChild(dialog);
  const image = dialog.querySelector("img");
  const caption = dialog.querySelector("figcaption");

  function open(key) {
    const wood = paths[key] ? key : "oak";
    image.src = paths[wood];
    image.alt = "Фактура древесины: " + names[wood].toLowerCase();
    image.style.filter = filters[wood] || "none";
    caption.textContent = names[wood] + " · фактура материала крупным планом";
    if (!dialog.open) dialog.showModal();
  }

  dialog.querySelector(".wood-preview-dialog__close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

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

  const trigger = document.getElementById("woodPreviewTrigger");
  const select = document.getElementById("wood");
  if (trigger && select) trigger.addEventListener("click", () => open(select.value));
})();
