(function () {
  "use strict";

  const allowedSlugs = new Set([
    "metallicheskiy-karkas", "porody-drevesiny", "zamer-lestnicy",
    "otkrytaya-ili-zakrytaya", "skolko-mesta-zanimaet", "kogda-planirovat",
    "ograzhdenie-poruchen", "obshivka-betonnoy-lestnicy", "podsvetka-stupeney",
    "uhod-za-derevyannymi-stupenyami"
  ]);

  const config = window.DZ_ARTICLE_COMMENTS || {};
  const baseUrl = String(config.projectUrl || "").replace(/\/+$/, "");

  document.querySelectorAll("[data-article-comments]").forEach((root) => {
    const slug = root.dataset.pageId;
    const status = root.querySelector("[data-comments-status]");
    const list = root.querySelector("[data-comments-list]");
    const form = root.querySelector("[data-comment-form]");
    const endpoint = baseUrl ? `${baseUrl}/functions/v1/article-comments` : "";

    if (!allowedSlugs.has(slug) || !form || !status || !list) return;

    if (!endpoint) {
      status.textContent = "Комментарии подключаются. Пока можно задать вопрос по теме статьи через форму проекта.";
      return;
    }

    const setStatus = (message, kind) => {
      status.textContent = message;
      status.dataset.state = kind || "info";
    };

    const appendComment = (comment) => {
      const item = document.createElement("article");
      item.className = "article-comment";
      const label = document.createElement("p");
      label.className = "article-comment__author";
      label.textContent = "Читатель";
      const body = document.createElement("p");
      body.className = "article-comment__body";
      body.textContent = comment.body;
      const date = document.createElement("time");
      date.className = "article-comment__date";
      const created = new Date(comment.created_at);
      date.dateTime = Number.isNaN(created.getTime()) ? "" : created.toISOString();
      date.textContent = Number.isNaN(created.getTime())
        ? ""
        : new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(created);
      item.append(label, body, date);
      list.append(item);
    };

    const loadComments = async () => {
      try {
        const response = await fetch(`${endpoint}?article=${encodeURIComponent(slug)}`, {
          headers: { Accept: "application/json" }
        });
        if (!response.ok) throw new Error("comments unavailable");
        const comments = await response.json();
        list.replaceChildren();
        comments.forEach(appendComment);
        if (!comments.length) setStatus("Пока нет опубликованных комментариев. Будьте первым.");
        else setStatus(`Опубликовано комментариев: ${comments.length}. Новые проходят модерацию.`, "success");
      } catch (_) {
        setStatus("Не удалось загрузить комментарии. Попробуйте обновить страницу позже.", "error");
      }
    };

    form.hidden = false;
    loadComments();
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const submit = form.querySelector("button[type=submit]");
      const data = new FormData(form);
      const payload = {
        article: slug,
        email: String(data.get("email") || "").trim(),
        body: String(data.get("body") || "").trim(),
        website: String(data.get("website") || ""),
        consent: data.get("consent") === "on"
      };
      submit.disabled = true;
      setStatus("Отправляем комментарий…");
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Не удалось отправить комментарий.");
        form.reset();
        setStatus("Спасибо. Комментарий появится после проверки модератором.", "success");
      } catch (error) {
        setStatus(error.message || "Не удалось отправить комментарий. Попробуйте позже.", "error");
      } finally {
        submit.disabled = false;
      }
    });
  });
})();
