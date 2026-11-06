(() => {
  const counterId = 110344922;
  const consentKey = 'site_cookie_choice';
  let initialized = false;

  function enableYandexMetrika() {
    if (initialized || typeof window.ym === 'function') return;
    initialized = true;

    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      for (let j = 0; j < document.scripts.length; j += 1) {
        if (document.scripts[j].src === r) return;
      }
      k = e.createElement(t);
      a = e.getElementsByTagName(t)[0];
      k.async = true;
      k.src = r;
      a.parentNode.insertBefore(k, a);
    })(window, document, 'script', `https://mc.yandex.ru/metrika/tag.js?id=${counterId}`, 'ym');

    window.ym(counterId, 'init', {
      ssr: true,
      webvisor: true,
      trackHash: true,
      clickmap: true,
      referrer: document.referrer,
      url: location.href,
      accurateTrackBounce: true,
      trackLinks: true
    });
  }

  window.enableYandexMetrika = enableYandexMetrika;

  try {
    if (localStorage.getItem(consentKey) === 'accepted') enableYandexMetrika();
  } catch (_) {
    // Analytics stays disabled when the visitor's consent choice cannot be read.
  }
})();
