(() => {
  const consentKey = 'site_cookie_choice';
  const currentScript = document.currentScript;
  const siteRoot = currentScript ? new URL('../..', currentScript.src) : new URL('./', location.href);
  const policyUrl = new URL('privacy.html', siteRoot).href;
  let choice = '';

  try { choice = localStorage.getItem(consentKey) || ''; } catch (_) { /* Keep consent controls usable if storage is blocked. */ }

  let banner = document.getElementById('cookieBanner');
  if (!banner) {
    banner = document.createElement('section');
    banner.className = 'cookie-consent-banner';
    banner.id = 'cookieBanner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Настройки cookie и внешних сервисов');
    banner.innerHTML = `<div><strong class="cookie-consent-banner__title">Настройки cookie и внешних сервисов</strong><span>Яндекс Метрика (статистика и Вебвизор), чат и карта загружаются после разрешения. Выбор можно изменить в настройках внизу страницы. Форма заявки остаётся доступна; её согласие оформляется отдельно.</span> <a class="cookie-consent-banner__policy" href="${policyUrl}">Политика обработки данных</a>.</div><div class="cookie-consent-banner__actions"><button class="cookie-consent-banner__button cookie-consent-banner__button--reject" id="cookieRejectButton" type="button">Отклонить необязательные</button><button class="cookie-consent-banner__button" id="cookieAcceptButton" type="button">Разрешить сервисы</button></div>`;
    document.body.append(banner);
  }

  if (!document.getElementById('cookieSettingsButton')) {
    const host = document.querySelector('footer, .article-shell, main') || document.body;
    const wrapper = document.createElement('p');
    wrapper.className = 'cookie-consent-preferences';
    wrapper.innerHTML = '<button class="cookie-consent-preferences__button" id="cookieSettingsButton" type="button">Настройки cookie</button>';
    host.append(wrapper);
  }

  const showBanner = () => banner.classList.add('is-visible');
  const hideBanner = () => banner.classList.remove('is-visible');
  if (!['accepted', 'rejected'].includes(choice)) showBanner();

  function saveChoice(nextChoice) {
    const previousChoice = choice;
    choice = nextChoice;
    try { localStorage.setItem(consentKey, nextChoice); } catch (_) { /* The banner can still be dismissed for this visit. */ }
    hideBanner();
    if (nextChoice === 'accepted') {
      window.enableOptionalSiteServices?.();
      window.enableYandexMetrika?.();
    } else if (previousChoice === 'accepted') {
      location.reload();
    }
  }

  banner.querySelector('#cookieAcceptButton')?.addEventListener('click', () => saveChoice('accepted'));
  banner.querySelector('#cookieRejectButton')?.addEventListener('click', () => saveChoice('rejected'));
  document.getElementById('cookieSettingsButton')?.addEventListener('click', () => {
    showBanner();
    banner.querySelector('#cookieRejectButton')?.focus({ preventScroll: true });
  });
})();
