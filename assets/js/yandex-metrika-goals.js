(() => {
  'use strict';

  const counterId = 110344922;
  const consentKey = 'site_cookie_choice';

  function reachGoal(goal) {
    try {
      if (window.localStorage.getItem(consentKey) !== 'accepted') return;
    } catch (_) {
      return;
    }

    if (typeof window.ym === 'function') {
      window.ym(counterId, 'reachGoal', goal);
    }
  }

  document.addEventListener('click', (event) => {
    const control = event.target.closest('a, button');
    if (!control) return;

    if (control.matches('a[href^="tel:"]')) {
      reachGoal('phone_click');
      return;
    }

    if (control.matches('.location-route-link')) {
      reachGoal('yandex_route_open');
      return;
    }

    // Only the quote CTA opens the estimate form; the sibling portfolio CTA
    // shares `.btn-card` but is not a request for a quote.
    if (control.matches('button.btn-card[onclick*="openForm"]')) {
      reachGoal('estimate_form_open');
      return;
    }

    if (control.matches('[data-chat-interest]')) {
      const interest = control.dataset.chatInterest || '';
      if (/франшиз/i.test(interest)) reachGoal('franchise_request_open');
      else if (/партнёр|партнер|регион/i.test(interest)) reachGoal('partnership_request_open');
      else if (/обучен/i.test(interest)) reachGoal('training_request_open');
      return;
    }

    if (control.matches('a[href*="constructor.html"]')) {
      reachGoal('configurator_open');
      return;
    }

    if (control.matches('a[href="#contact"]') && !control.closest('.site-header, .mobile-menu nav')) {
      reachGoal('project_request_open');
    }
  });

  // This is a prepared handoff, not a confirmed Bitrix lead: the visitor
  // still has to send the copied message in the chat.
  window.addEventListener('site:request-handoff-prepared', (event) => {
    const interest = event.detail?.interest || '';
    if (/франшиз/i.test(interest)) reachGoal('franchise_request_prepared');
    else if (/партнёр|партнер|регион/i.test(interest)) reachGoal('partnership_request_prepared');
    else if (/обучен/i.test(interest)) reachGoal('training_request_prepared');
  });
})();
