
  // Smooth scroll for nav links & mobile menu handling
  const burgerBtn = document.querySelector('.burger-btn');
  const mobileMenu = document.getElementById('mobileMenu');
  const getScrollBehavior = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

  function toggleBurgerMenu(forceOpen) {
    const isOpen = typeof forceOpen === 'boolean' ? forceOpen : !mobileMenu.classList.contains('active');
    burgerBtn.classList.toggle('active', isOpen);
    mobileMenu.classList.toggle('active', isOpen);
    burgerBtn.setAttribute('aria-expanded', String(isOpen));
    burgerBtn.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    mobileMenu.inert = !isOpen;
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (isOpen) {
      mobileMenu.querySelector('.mobile-nav-links a')?.focus({ preventScroll: true });
    }
  }
  document.addEventListener('keydown', event => {
    if (!mobileMenu.classList.contains('active')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      toggleBurgerMenu(false);
      burgerBtn.focus();
      return;
    }
    if (event.key === 'Tab') {
      const focusable = [...mobileMenu.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  burgerBtn.addEventListener('click', toggleBurgerMenu);

  const portfolioFilm = document.querySelector('.home-project-film__player');
  portfolioFilm?.addEventListener('toggle', () => {
    if (!portfolioFilm.open) portfolioFilm.querySelector('video')?.pause();
  });
  const filmSummary = portfolioFilm?.querySelector('summary');
  const filmVideo = portfolioFilm?.querySelector('video');
  const filmDialog = document.querySelector('.home-project-film__dialog');
  if (filmSummary && filmVideo && typeof filmDialog?.showModal === 'function') {
    const filmStage = filmDialog.querySelector('.home-project-film__stage');
    filmSummary.setAttribute('aria-haspopup', 'dialog');
    filmSummary.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      filmDialog.showModal();
      event.preventDefault();
      document.documentElement.classList.add('home-project-film-dialog-open');
      filmVideo.poster ||= filmSummary.querySelector('img').src;
      filmStage.append(filmVideo);
      filmVideo.play().catch(() => {});
    });
    filmDialog.addEventListener('close', () => {
      filmVideo.pause();
      filmSummary.after(filmVideo);
      document.documentElement.classList.remove('home-project-film-dialog-open');
      filmSummary.focus({ preventScroll: true });
    });
  }

  function focusSection(target, instant) {
    // Keep keyboard and assistive-technology users with the destination.
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    }
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: instant ? 'instant' : getScrollBehavior(), block: 'start' });
    if (instant) {
      // Re-align after nearby offscreen sections have been laid out.
      setTimeout(() => {
        if (document.activeElement === target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
      }, 100);
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const hash = a.getAttribute('href');
      const compactLayout = window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
      const articlesJump = hash === '#articles' && compactLayout;
      const formJump = hash === '#request-form';
      const target = articlesJump ? document.getElementById('articles-heading')
        : hash && hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
      const menuWasOpen = mobileMenu.classList.contains('active');
      if (menuWasOpen) toggleBurgerMenu(false);
      if (target) {
        e.preventDefault();
        if (formJump) prepareLeadForm(a);
        // On compact layouts, sections can resize as a long scroll passes them.
        focusSection(target, compactLayout);
      }
    });
  });

  // Track only menu sections. Nested galleries and dialogs cannot steal the active tab.
  const navLinks = [...document.querySelectorAll('.header-nav a[href^="#"]')];
  const navTargets = [...new Map(navLinks.map(link => [link.hash, document.querySelector(link.hash)]))]
    .filter(([, target]) => target)
    .map(([hash, target]) => ({ hash, target }));
  let navTicking = false;
  function updateActiveNavigation() {
    navTicking = false;
    if (!navTargets.length) return;
    const headerBottom = document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0;
    const activationLine = headerBottom + Math.min(96, window.innerHeight * .14);
    // offsetTop is relative to an element's offsetParent and can misorder
    // sections when layout wrappers differ. Use viewport geometry so the
    // active link follows the section actually passing the fixed header.
    const orderedTargets = navTargets
      .map(item => ({ ...item, top: item.target.getBoundingClientRect().top }))
      .sort((a, b) => a.top - b.top);
    let activeHash = '#why';
    for (const item of orderedTargets) {
      if (item.top <= activationLine) activeHash = item.hash;
    }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      activeHash = orderedTargets[orderedTargets.length - 1].hash;
    }
    navLinks.forEach(link => {
      const active = link.hash === activeHash;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function scheduleActiveNavigation() {
    if (navTicking) return;
    navTicking = true;
    window.requestAnimationFrame(updateActiveNavigation);
  }
  window.addEventListener('scroll', scheduleActiveNavigation, { passive: true });
  window.addEventListener('resize', scheduleActiveNavigation);
  scheduleActiveNavigation();

  // A visitor arriving from the 3D configurator should see the matching
  // request context, and the same topic should be attached to the Bitrix lead.
  const entryParams = new URLSearchParams(window.location.search);
  const incomingStairConfig = entryParams.get('stair_config');
  const entryServiceTitles = new Map([
    ['electrical', 'Электроснабжение'],
    ['lighting', 'Подсветка лестницы']
  ]);
  if (incomingStairConfig) {
    window.setSiteLeadInterest?.('Расчёт лестницы');
    const contactNote = document.querySelector('#contact .contact-start-note');
    if (contactNote) {
      contactNote.textContent = 'Вы перешли из 3D-конструктора. Параметры лестницы приложены к заявке — оставьте телефон, и менеджер свяжется с вами для уточнения проекта.';
    }
  }

  // Keep the selected service visible when a visitor asks for a quote.
  function prepareLeadForm(link) {
    const productTitle = link?.closest('.product-card')?.querySelector('h3');
    const entryTitle = !link && !incomingStairConfig ? entryServiceTitles.get(entryParams.get('service')) : undefined;
    const contactNote = document.querySelector('#contact .contact-start-note');
    const title = link?.dataset.leadService || entryTitle || productTitle?.textContent.trim();
    window.setSiteLeadInterest?.(title || 'Расчёт лестницы');
    if (title && contactNote) {
      contactNote.textContent = `Вы выбрали направление «${title}». Оставьте контакты — менеджер уточнит детали и поможет с расчётом.`;
    } else if (contactNote && !incomingStairConfig) {
      contactNote.textContent = 'Для первого разговора достаточно описать задачу. Подскажем, с чего начать и какие варианты подойдут.';
    }
    window.loadBitrixLeadForm?.();
  }

  window.addEventListener('pageshow', (event) => {
    if (event.persisted || window.location.hash !== '#request-form') return;
    const target = document.getElementById('request-form');
    if (!target) return;
    prepareLeadForm();
    focusSection(target, true);
  });

  document.querySelectorAll('a[href="#contact"]:not([data-training-cta]):not([data-partnership-cta])').forEach((link) => {
    link.addEventListener('click', () => {
      window.setSiteLeadInterest?.(incomingStairConfig ? 'Расчёт лестницы' : 'Обсуждение проекта');
      // A previous service-specific click must not leave stale instructions in
      // the form when the visitor later chooses the general project CTA.
      if (!incomingStairConfig) {
        const contactNote = document.querySelector('#contact .contact-start-note');
        if (contactNote) contactNote.textContent = 'Для первого разговора достаточно описать задачу. Подскажем, с чего начать и какие варианты подойдут.';
      }
    });
  });

  document.querySelectorAll('[data-training-cta]').forEach((link) => {
    link.addEventListener('click', () => {
      const contactNote = document.querySelector('#contact .contact-start-note');
      window.setSiteLeadInterest?.('Обучение столярному делу');
      if (contactNote) contactNote.textContent = 'Запрос по недельному курсу столярного дела на производстве. Стоимость — 55 000 ₽; оплату сразу или частями можно обсудить при записи.';
    });
  });
  document.querySelectorAll('[data-partnership-cta]').forEach((link) => {
    link.addEventListener('click', () => {
      const contactNote = document.querySelector('#contact .contact-start-note');
      const topic = link.dataset.interest || 'Партнёрство / будущая франшиза';
      window.setSiteLeadInterest?.(topic);
      if (contactNote) contactNote.textContent = link.dataset.contactNote || 'Запрос по будущей партнёрской программе или франшизе. Оставьте контакты, чтобы обсудить интерес и формат сотрудничества.';
    });
  });

  // Кнопка «Примеры работ» открывает соответствующую существующую галерею каталога.
  document.querySelectorAll('[data-open-gallery]').forEach((button) => {
    button.addEventListener('click', () => {
      const galleryButton = document.getElementById(button.dataset.openGallery);
      if (galleryButton) {
        galleryButton.click();
      }
    });
  });

  function closeSiblingDetails(group, opened) {
    const siblings = [...group.querySelectorAll(':scope > details[open]')].filter((detail) => detail !== opened);
    siblings.forEach((detail) => { detail.open = false; });
    return siblings.length > 0;
  }

  document.querySelectorAll('[data-open-direction]').forEach((button) => {
    button.addEventListener('click', () => {
      const detail = document.getElementById(button.dataset.openDirection);
      if (!detail) return;
      closeSiblingDetails(detail.parentElement, detail);
      detail.open = true;
      const summary = detail.querySelector('summary');
      summary?.focus({ preventScroll: true });
      summary?.scrollIntoView({ behavior: getScrollBehavior(), block: 'center' });
    });
  });

  // Keep the explanatory mini-panels compact: one open panel per card/group.
  document.querySelectorAll('.cooperation-overview__card, .training-details, .direction-details').forEach((group) => {
    group.addEventListener('toggle', (event) => {
      const opened = event.target;
      if (!(opened instanceof HTMLDetailsElement) || !opened.open) return;
      const collapsedSibling = closeSiblingDetails(group, opened);
      if (collapsedSibling && group.matches('.direction-details')) {
        requestAnimationFrame(() => {
          const summary = opened.querySelector('summary');
          if (!opened.open || !summary) return;
          const bounds = summary.getBoundingClientRect();
          const headerBottom = document.querySelector('.site-header').getBoundingClientRect().bottom;
          if (bounds.top < headerBottom || bounds.bottom > window.innerHeight) {
            summary.scrollIntoView({ behavior: 'instant', block: 'center' });
          }
        });
      }
    }, true);
  });

  // Toggle the header shadow only when crossing the threshold. Avoid writing
  // an inline style on every scroll event, which adds work during touch scroll.
  const header = document.querySelector('.site-header');
  let headerScrolled = null;
  const updateHeaderScrollState = () => {
    const isScrolled = window.scrollY > 10;
    if (isScrolled === headerScrolled) return;
    headerScrolled = isScrolled;
    header.classList.toggle('is-scrolled', isScrolled);
  };
  window.addEventListener('scroll', updateHeaderScrollState, { passive: true });
  updateHeaderScrollState();

  // Cookie consent
  const cookieBanner = document.getElementById('cookieBanner');
  const cookieAcceptButton = document.getElementById('cookieAcceptButton');
  const cookieRejectButton = document.getElementById('cookieRejectButton');
  const cookieConsentKey = 'site_cookie_choice';
  let cookieConsentChoice = '';
  try {
    cookieConsentChoice = localStorage.getItem(cookieConsentKey) || '';
  } catch (error) {
    // Keep the notice usable when browser storage is blocked.
  }

  if (!['accepted', 'rejected'].includes(cookieConsentChoice)) {
    cookieBanner.classList.add('is-visible');
    document.body.classList.add('cookie-banner-visible');
  }

  function saveCookieChoice(choice) {
    const previousChoice = cookieConsentChoice;
    cookieConsentChoice = choice;
    try {
      localStorage.setItem(cookieConsentKey, choice);
    } catch (error) {
      // Dismissing the notice should not depend on browser storage availability.
    }
    cookieBanner.classList.remove('is-visible');
    document.body.classList.remove('cookie-banner-visible');
    if (choice === 'accepted') {
      window.enableOptionalSiteServices?.();
      window.enableYandexMetrika?.();
    }
    if (choice === 'rejected' && previousChoice === 'accepted') window.location.reload();
  }
  cookieAcceptButton.addEventListener('click', () => saveCookieChoice('accepted'));
  cookieRejectButton.addEventListener('click', () => saveCookieChoice('rejected'));
  document.getElementById('cookieSettingsButton')?.addEventListener('click', () => {
    cookieBanner.classList.add('is-visible');
    document.body.classList.add('cookie-banner-visible');
    cookieBanner.querySelector('#cookieRejectButton')?.focus();
  });



  // Category galleries are rendered from local image paths so buttons work in file:// previews too.
  const woodGalleryDetails = {
    "./assets/images/portfolio/branded/custom-woodwork-03.webp": { label: "Синяя тумба с филёнчатыми дверцами и ящиками", size: [720, 512] },
    "./assets/images/portfolio/branded/custom-woodwork-05.webp": { label: "Белые шкафы под лестницей с золотистыми ручками", size: [540, 720] },
    "./assets/images/portfolio/branded/custom-woodwork-06.webp": { label: "Зелёный шкаф с открытой деревянной нишей", size: [540, 720] },
    "./assets/images/portfolio/branded/custom-woodwork-07.webp": { label: "Светлый встроенный шкаф с нишей и ящиками", size: [540, 720] },
    "./assets/images/portfolio/stories/shkafy-pod-lestnitsey.webp": { label: "Шкафы и выдвижные ящики под лестницей", size: [382, 680] },
    "./assets/images/portfolio/stories/derevyannyy-stol-i-taburety.webp": { label: "Деревянный стол и три табурета с фигурными опорами", size: [382, 680] },
    "./assets/images/portfolio/stories/servirovochnyy-stolik-na-kolesah.webp": { label: "Тёмный деревянный сервировочный столик на колёсах", size: [382, 680] },
    "./assets/images/portfolio/stories/kvadratnyy-stolik-na-karkase.webp": { label: "Квадратный столик на чёрном металлическом каркасе", size: [382, 680] },
    "./assets/images/portfolio/stories/stol-s-siney-vstavkoy-na-podstole.webp": { label: "Круглый стол из слэба с тёмно-синей заливкой", size: [382, 680] },
    "./assets/images/portfolio/stories/kruglyy-stol-s-derevyannym-krayem.webp": { label: "Круглый стол с широкой деревянной кромкой на треугольных опорах", size: [382, 680] },
    "./assets/images/portfolio/stories/stoleshnitsa-s-goluboy-smoloy.webp": { label: "Круглая деревянная столешница с голубой смолой", size: [382, 680] },
    "./assets/images/portfolio/stories/sleb-s-temnoy-vstavkoy.webp": { label: "Столешница из слэба с тёмной прозрачной вставкой", size: [382, 680] },
    "./assets/images/portfolio/stories/dlinnaya-stoleshnitsa-s-prirodnym-krayem.webp": { label: "Длинная столешница с естественной кромкой", size: [382, 680] },
    "./assets/images/portfolio/stories/derevyannaya-stoyka-v-interere.webp": { label: "Деревянный письменный стол с двумя тумбами", size: [382, 680] }
  };
  const categoryGalleryImages = {
    "closedType": [
      "./assets/images/portfolio/branded/closed-staircase-step-lighting.webp",
      "./assets/images/portfolio/branded/closed-staircase-wood-vertical-rails.webp",
      "./assets/images/portfolio/branded/closed-staircase-gray-steps.webp",
      "./assets/images/portfolio/branded/closed-staircase-dark-steps-glass.webp",
      "./assets/images/portfolio/branded/closed-staircase-white-risers-metal-balusters.webp",
      "./assets/images/portfolio/branded/closed-staircases-01.webp",
      "./assets/images/portfolio/branded/closed-staircases-02.webp",
      "./assets/images/portfolio/branded/closed-staircases-03.webp",
      "./assets/images/portfolio/branded/closed-staircases-04.webp",
      "./assets/images/portfolio/branded/closed-staircases-05.webp",
      "./assets/images/portfolio/branded/closed-staircases-06.webp",
      "./assets/images/portfolio/branded/closed-staircases-07.webp",
      "./assets/images/portfolio/branded/closed-staircases-08.webp",
      "./assets/images/portfolio/branded/closed-staircases-09.webp",
      "./assets/images/portfolio/branded/closed-staircases-10.webp",
      "./assets/images/portfolio/branded/closed-staircases-11.webp",
      "./assets/images/portfolio/branded/closed-staircases-12.webp",
      "./assets/images/portfolio/branded/closed-staircases-13.webp",
      "./assets/images/portfolio/branded/closed-staircases-14.webp",
      "./assets/images/portfolio/branded/closed-staircases-15.webp",
      "./assets/images/portfolio/branded/closed-staircases-16.webp",
      "./assets/images/portfolio/branded/closed-staircases-17.webp",
      "./assets/images/portfolio/branded/closed-staircases-18.webp",
      "./assets/images/portfolio/branded/closed-staircases-19.webp",
      "./assets/images/portfolio/branded/closed-staircases-20.webp"
    ],
    "openType": [
      "./assets/images/portfolio/branded/open-staircase-turn-at-window.webp",
      "./assets/images/portfolio/branded/open-staircase-two-flights.webp",
      "./assets/images/portfolio/branded/open-staircases-01.webp",
      "./assets/images/portfolio/branded/open-staircases-02.webp",
      "./assets/images/portfolio/branded/open-staircases-03.webp",
      "./assets/images/portfolio/branded/open-staircases-04.webp",
      "./assets/images/portfolio/branded/open-staircases-05.webp",
      "./assets/images/portfolio/branded/open-staircases-06.webp",
      "./assets/images/portfolio/branded/open-staircases-07.webp",
      "./assets/images/portfolio/branded/open-staircases-08.webp",
      "./assets/images/portfolio/branded/open-staircases-09.webp",
      "./assets/images/portfolio/branded/open-staircases-10.webp",
      "./assets/images/portfolio/branded/open-staircases-11.webp",
      "./assets/images/portfolio/branded/open-staircases-12.webp",
      "./assets/images/portfolio/branded/open-staircases-13.webp",
      "./assets/images/portfolio/branded/open-staircases-14.webp",
      "./assets/images/portfolio/branded/open-staircases-15.webp",
      "./assets/images/portfolio/branded/open-staircases-16.webp",
      "./assets/images/portfolio/branded/open-staircases-17.webp",
      "./assets/images/portfolio/branded/open-staircases-18.webp",
      "./assets/images/portfolio/branded/open-staircases-19.webp",
      "./assets/images/portfolio/branded/open-staircases-20.webp",
      "./assets/images/portfolio/branded/open-staircases-21.webp",
      "./assets/images/portfolio/branded/open-staircases-22.webp",
      "./assets/images/portfolio/branded/open-staircases-23.webp",
      "./assets/images/portfolio/branded/open-staircases-24.webp",
      "./assets/images/portfolio/branded/open-staircases-25.webp"
    ],
    "covering": [
      "./assets/images/portfolio/branded/preview-staircase-cladding.webp",
      "./assets/images/portfolio/branded/staircase-cladding-01.webp",
      "./assets/images/portfolio/branded/staircase-cladding-02.webp",
      "./assets/images/portfolio/branded/staircase-cladding-03.webp",
      "./assets/images/portfolio/branded/staircase-cladding-04.webp",
      "./assets/images/portfolio/branded/staircase-cladding-05.webp",
      "./assets/images/portfolio/branded/staircase-cladding-06.webp",
      "./assets/images/portfolio/branded/staircase-cladding-07.webp"
    ],
    "fences": [
      "./assets/images/portfolio/branded/railing-metal-rectangular-pattern.webp",
      "./assets/images/portfolio/branded/railing-wood-vertical-balusters.webp",
      "./assets/images/portfolio/branded/railing-forged-wood-handrail.webp",
      "./assets/images/portfolio/branded/stair-railings-01.webp",
      "./assets/images/portfolio/branded/stair-railings-02.webp",
      "./assets/images/portfolio/branded/stair-railings-03.webp",
      "./assets/images/portfolio/branded/stair-railings-04.webp",
      "./assets/images/portfolio/branded/stair-railings-05.webp",
      "./assets/images/portfolio/branded/stair-railings-06.webp",
      "./assets/images/portfolio/branded/stair-railings-07.webp",
      "./assets/images/portfolio/branded/stair-railings-08.webp",
      "./assets/images/portfolio/branded/stair-railings-09.webp",
      "./assets/images/portfolio/branded/stair-railings-10.webp",
      "./assets/images/portfolio/branded/stair-railings-11.webp",
      "./assets/images/portfolio/branded/stair-railings-12.webp",
      "./assets/images/portfolio/branded/stair-railings-13.webp",
      "./assets/images/portfolio/branded/stair-railings-14.webp",
      "./assets/images/portfolio/branded/stair-railings-15.webp",
      "./assets/images/portfolio/branded/stair-railings-16.webp",
      "./assets/images/portfolio/branded/stair-railings-17.webp",
      "./assets/images/portfolio/branded/stair-railings-18.webp",
      "./assets/images/portfolio/branded/stair-railings-19.webp",
      "./assets/images/portfolio/branded/stair-railings-20.webp",
      "./assets/images/portfolio/branded/stair-railings-21.webp",
      "./assets/images/portfolio/branded/stair-railings-22.webp",
      "./assets/images/portfolio/branded/stair-railings-23.webp",
      "./assets/images/portfolio/branded/stair-railings-24.webp"
    ],
    "wood": [
      "./assets/images/portfolio/branded/cabinet-vertical-wood-grain.webp",
      "./assets/images/portfolio/branded/wooden-table-wide-legs.webp",
      "./assets/images/portfolio/branded/wooden-sideboard-with-drawers.webp",
      "./assets/images/portfolio/branded/custom-woodwork-01.webp",
      "./assets/images/portfolio/branded/custom-woodwork-08.webp",
      "./assets/images/portfolio/branded/custom-woodwork-09.webp",
      ...Object.keys(woodGalleryDetails)
    ]
  };
  // Standard thumbnails are 540 × 720. Keep the original framing for other proportions.
  const categoryThumbnailSizes = {
    "closed-staircase-wood-vertical-rails.webp": [720, 540],
    "closed-staircases-03.webp": [720, 540],
    "closed-staircases-04.webp": [720, 540],
    "closed-staircases-10.webp": [575, 720],
    "closed-staircases-12.webp": [405, 720],
    "closed-staircases-15.webp": [405, 720],
    "closed-staircases-18.webp": [578, 720],
    "closed-staircases-19.webp": [720, 720],
    "closed-staircases-20.webp": [640, 720],
    "open-staircases-03.webp": [720, 540],
    "open-staircases-11.webp": [405, 720],
    "open-staircases-12.webp": [720, 405],
    "open-staircases-14.webp": [720, 540],
    "open-staircases-15.webp": [534, 720],
    "open-staircases-19.webp": [720, 540],
    "open-staircases-20.webp": [405, 720],
    "preview-staircase-cladding.webp": [720, 720],
    "staircase-cladding-07.webp": [720, 540],
    "railing-metal-rectangular-pattern.webp": [720, 540],
    "railing-forged-wood-handrail.webp": [720, 540],
    "stair-railings-01.webp": [720, 540],
    "stair-railings-03.webp": [720, 540],
    "stair-railings-07.webp": [720, 540],
    "stair-railings-08.webp": [720, 540],
    "stair-railings-09.webp": [421, 720],
    "stair-railings-10.webp": [720, 540],
    "stair-railings-11.webp": [720, 540],
    "stair-railings-12.webp": [720, 540],
    "stair-railings-14.webp": [528, 720],
    "stair-railings-18.webp": [720, 720],
    "stair-railings-19.webp": [720, 720],
    "stair-railings-21.webp": [720, 405],
    "wooden-sideboard-with-drawers.webp": [720, 540],
    "custom-woodwork-08.webp": [720, 540],
  };
  const categoryNames = {closedType:'Лестницы закрытого типа',openType:'Лестницы открытого типа',covering:'Отделка лестниц деревом',fences:'Ограждения для лестниц',wood:'Изделия из дерева'};
  const categoryImageDescriptions = {closedType:'Лестница закрытого типа с отделкой деревом',openType:'Лестница на металлическом каркасе с открытыми ступенями',covering:'Отделка лестницы деревом по бетонному основанию',fences:'Деревянное или металлическое ограждение лестницы',wood:'Изделие из массива дерева мастерской Древесный Замысел'};
  function formatPhotoCount(count) {
    const mod100 = count % 100;
    const mod10 = count % 10;
    const word = mod100 >= 11 && mod100 <= 14 ? 'фотографий' : mod10 === 1 ? 'фотография' : mod10 >= 2 && mod10 <= 4 ? 'фотографии' : 'фотографий';
    return `${count} ${word}`;
  }
  const categoryDialog = document.getElementById('categoryLightbox');
  const categoryGrid = document.getElementById('categoryLightboxGrid');
  let categoryGalleryRevealObserver=null;
  let categoryPreviewImages = []; let categoryPreviewIndex = 0;
  const categoryPreview = document.getElementById('categoryPhotoPreview');
  const categoryPreviewImage = document.getElementById('categoryPreviewImage');
  const categoryPreviewCaption = document.getElementById('categoryPreviewCaption');
  const categoryPreviewPreloaded=new Set();
  function preloadCategoryPreviewNeighbors(){
    const connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
    if(!categoryPreview.open||categoryPreviewImages.length<2||(connection&&(connection.saveData||/^(slow-2g|2g)$/.test(connection.effectiveType||''))))return;
    [-1,1].forEach(offset=>{
      const neighborIndex=(categoryPreviewIndex+offset+categoryPreviewImages.length)%categoryPreviewImages.length;
      const src=categoryPreviewImages[neighborIndex];
      if(categoryPreviewPreloaded.has(src))return;
      categoryPreviewPreloaded.add(src);
      const image=new Image();
      image.decoding='async';
      if('fetchPriority' in image)image.fetchPriority='low';
      image.src=src;
    });
  }
  function showCategoryPreview(index) {
    if (!categoryPreviewImages.length) return;
    // JavaScript's remainder stays negative for -1; normalize it so «назад»
    // from the first photo correctly wraps to the last photo.
    categoryPreviewIndex=((index % categoryPreviewImages.length)+categoryPreviewImages.length)%categoryPreviewImages.length;
    categoryPreviewImage.src=categoryPreviewImages[categoryPreviewIndex];
    const categoryKey=document.getElementById('categoryLightboxTitle').dataset.key;
    const description=woodGalleryDetails[categoryPreviewImages[categoryPreviewIndex]]?.label || categoryImageDescriptions[categoryKey];
    categoryPreviewImage.alt=`${description}, пример работы ${categoryPreviewIndex+1}`;
    categoryPreviewImage.title=`${description} — пример ${categoryPreviewIndex+1}`;
    categoryPreviewCaption.textContent=`${description} · Фото ${categoryPreviewIndex+1} из ${categoryPreviewImages.length}`;
    if(!categoryPreview.open) categoryPreview.showModal();
    if(categoryPreviewImage.decode){
      categoryPreviewImage.decode().then(preloadCategoryPreviewNeighbors).catch(()=>{});
    }else{
      categoryPreviewImage.addEventListener('load',preloadCategoryPreviewNeighbors,{once:true});
    }
  }
  document.querySelectorAll('[id^="btn-gallery-"]').forEach(button => {
    if (typeof categoryDialog.showModal !== 'function') return;
    button.setAttribute('aria-haspopup','dialog');
    button.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); event.stopImmediatePropagation();
      const key = button.id.replace('btn-gallery-','');
      const images = categoryGalleryImages[key] || [];
      document.getElementById('categoryLightboxTitle').textContent = categoryNames[key] || 'Примеры работ';
      document.getElementById('categoryLightboxTitle').dataset.key=key;
      document.getElementById('categoryLightboxCount').textContent = formatPhotoCount(images.length);
      categoryPreviewImages=images;
      if(categoryGalleryRevealObserver){categoryGalleryRevealObserver.disconnect();categoryGalleryRevealObserver=null;}
      categoryGrid.replaceChildren();
      let galleryRevealOrder=0;
      const revealCardWhenReady=(item,img)=>{
        let entered=false;
        let revealed=false;
        let imageRevealQueued=false;
        const revealCard=()=>{
          if(!entered||revealed)return;
          revealed=true;
          item.style.transitionDelay=`${Math.min(galleryRevealOrder++*55,275)}ms`;
          window.requestAnimationFrame(()=>item.classList.add('gallery-card-visible'));
        };
        const revealImage=()=>{
          if(imageRevealQueued)return;
          imageRevealQueued=true;
          const ready=()=>window.requestAnimationFrame(()=>{
            // Reveal the image once it has decoded.
            img.classList.remove('gallery-image-loading');
            img.classList.add('gallery-image-ready');
            revealCard();
          });
          if(typeof img.decode==='function'){
            img.decode().then(ready).catch(ready);
          }else{
            ready();
          }
        };
        img.addEventListener('load',revealImage);
        const enter=()=>{
          entered=true;
          // Assign the image source only when the thumbnail approaches the
          // visible gallery area. Native lazy loading alone may fetch several
          // screens of images at once, especially inside a long modal on mobile.
          if(!img.dataset.requested){
            img.dataset.requested='1';
            // Use the observer as the loading gate where available. Legacy
            // browsers keep their native lazy-load behavior as a fallback.
            img.loading=categoryGalleryRevealObserver?'eager':'lazy';
            img.src=img.dataset.src;
          }
          // Show the card promptly even when a thumbnail is slow; the image
          // fades in as soon as decode finishes, without a long blank pause.
          window.setTimeout(revealCard,900);
          if(img.complete){
            if(img.naturalWidth){revealImage();} else revealCard();
          }
        };
        return enter;
      };
      categoryGalleryRevealObserver='IntersectionObserver' in window
        ? new IntersectionObserver(entries=>entries.forEach(entry=>{
            if(!entry.isIntersecting)return;
            if(!categoryGalleryRevealObserver)return;
            categoryGalleryRevealObserver.unobserve(entry.target);
            entry.target._enterGalleryCard();
          }),{root:categoryGrid,rootMargin:'180px 0px',threshold:0.01})
        : null;
      images.forEach((src,index) => {
        const details=woodGalleryDetails[src];
        const description=details?.label || categoryImageDescriptions[key];
        const item=document.createElement('button'); item.type='button'; item.className='category-lightbox__item gallery-card-entering';
        item.setAttribute('aria-label',`Открыть фото ${index+1}: ${description}`);
        const img=document.createElement('img');
        img.className='gallery-image-loading';
        const fileName = src.slice(src.lastIndexOf('/') + 1);
        const [width, height] = details?.size || categoryThumbnailSizes[fileName] || [540, 720];
        img.width = width;
        img.height = height;
        img.style.setProperty('--gallery-photo-ratio', width + ' / ' + height);
        img.alt=`${description}, пример работы ${index+1}`;
        img.title=`${description} — пример ${index+1}`;
        img.loading='lazy'; img.decoding='async';
        const enterGalleryCard=revealCardWhenReady(item,img);
        item._enterGalleryCard=enterGalleryCard;
        img.dataset.fallbacks=JSON.stringify([src]);
        img.dataset.fallbackIndex='0';
        img.onerror=()=>{
          // Use the branded full-size photo if its thumbnail fails.
          const fallbacks=JSON.parse(img.dataset.fallbacks||'[]');
          const fallbackIndex=Number(img.dataset.fallbackIndex||0);
          if(fallbackIndex<fallbacks.length){
            img.dataset.fallbackIndex=String(fallbackIndex+1);
            img.src=fallbacks[fallbackIndex];
            return;
          }
          img.classList.remove('gallery-image-loading');
          img.classList.add('gallery-image-ready');
          img.alt=`${description}, изображение временно недоступно`;
          item.disabled=true;
          item.setAttribute('aria-label',`Фото временно недоступно: ${description}`);
          item.classList.add('gallery-image-unavailable');
          enterGalleryCard();
        };
        // Load a proportionally scaled WebP for the grid; the lightbox uses
        // `src` from categoryGalleryImages and therefore retains full detail.
        img.dataset.src=src.slice(0,src.lastIndexOf('/')+1)+'thumbs/'+fileName;
        item.appendChild(img); item.addEventListener('click',()=>showCategoryPreview(index));
        categoryGrid.appendChild(item);
        if(categoryGalleryRevealObserver) categoryGalleryRevealObserver.observe(item); else enterGalleryCard();
      });
      categoryDialog.showModal();
      document.documentElement.classList.add('gallery-open');
      document.body.classList.add('gallery-open');
      if(window.gsap && !window.matchMedia("(prefers-reduced-motion: reduce)").matches && !window.matchMedia('(max-width:720px), (pointer:coarse)').matches){
        gsap.fromTo(categoryDialog,{opacity:0,scale:.99},{opacity:1,scale:1,duration:.55,ease:"power3.out"});
      }
    });
  });
  function closeCategoryGallery(){
    if(window.gsap && categoryDialog.open && !window.matchMedia("(prefers-reduced-motion: reduce)").matches){
      gsap.to(categoryDialog,{opacity:0,duration:.18,ease:"power1.in",onComplete:()=>{categoryDialog.close();categoryDialog.style.opacity="";}});
    }else categoryDialog.close();
  }
  categoryDialog.addEventListener('close',()=>{document.documentElement.classList.remove('gallery-open');document.body.classList.remove('gallery-open');categoryDialog.style.opacity='';if(categoryGalleryRevealObserver){categoryGalleryRevealObserver.disconnect();categoryGalleryRevealObserver=null;}categoryGrid.replaceChildren();});
  categoryDialog.querySelector('.category-lightbox__close').addEventListener('click',closeCategoryGallery);
  categoryDialog.addEventListener('click',event=>{if(event.target===categoryDialog)closeCategoryGallery();});
  categoryPreview.querySelector('.leonid-lightbox__close').addEventListener('click',()=>categoryPreview.close());
  categoryPreview.querySelector('.category-preview-prev').addEventListener('click',()=>showCategoryPreview(categoryPreviewIndex-1));
  categoryPreview.querySelector('.category-preview-next').addEventListener('click',()=>showCategoryPreview(categoryPreviewIndex+1));
  categoryPreview.addEventListener('click',event=>{if(event.target===categoryPreview)categoryPreview.close();});
  // Listen at document level: focus may move from the dialog to its arrow/close
  // buttons, and some browsers then do not deliver keydown to the dialog itself.
  document.addEventListener('keydown',event=>{
    if(!categoryPreview.open || event.altKey || event.ctrlKey || event.metaKey) return;
    const target=event.target;
    if(target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
    if(event.key==='ArrowLeft'){
      event.preventDefault();
      showCategoryPreview(categoryPreviewIndex-1);
    }else if(event.key==='ArrowRight'){
      event.preventDefault();
      showCategoryPreview(categoryPreviewIndex+1);
    }
  });
  let categoryTouchStart=null;
  categoryPreview.addEventListener('touchstart',event=>{
    if(event.touches.length!==1){categoryTouchStart=null;return;}
    const touch=event.changedTouches[0];
    categoryTouchStart={x:touch.clientX,y:touch.clientY};
  },{passive:true});
  categoryPreview.addEventListener('touchend',event=>{
    if(!categoryTouchStart)return;
    const touch=event.changedTouches[0];
    const dx=touch.clientX-categoryTouchStart.x;
    const dy=touch.clientY-categoryTouchStart.y;
    categoryTouchStart=null;
    if(Math.abs(dx)>48 && Math.abs(dx)>Math.abs(dy)*1.25) showCategoryPreview(categoryPreviewIndex+(dx<0?1:-1));
  },{passive:true});
  categoryPreview.addEventListener('touchcancel',()=>{categoryTouchStart=null;},{passive:true});
  categoryPreview.addEventListener('close',()=>categoryPreviewPreloaded.clear());

  // Bitrix exposes setCustomData for information shown to the operator; it does not
  // provide a supported way to prefill the visitor's chat composer. Copy the message
  // for the visitor and pass the same request details to the operator.
  window.siteBitrixLiveChatWidget = null;
  window.sitePendingChatContext = null;
  window.addEventListener('onBitrixLiveChat', function(event) {
    const widget = event.detail && event.detail.widget;
    if (!widget) return;
    window.siteBitrixLiveChatWidget = widget;
    if (window.sitePendingChatContext && typeof widget.setCustomData === 'function') {
      widget.setCustomData(window.sitePendingChatContext);
    }
    (window.siteBitrixChatWaiters || []).splice(0).forEach(resolve => resolve(widget));
  });
  window.ensureSiteBitrixChat = function() {
    if (window.siteBitrixLiveChatWidget) return Promise.resolve(window.siteBitrixLiveChatWidget);
    return new Promise(resolve => {
      let settled = false;
      const finish = widget => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve(widget || null);
      };
      window.siteBitrixChatWaiters = window.siteBitrixChatWaiters || [];
      window.siteBitrixChatWaiters.push(finish);
      const timeout = setTimeout(() => finish(null), 10000);
      if (!document.querySelector('script[data-site-bitrix-chat]')) {
        const script = document.createElement('script');
        script.async = true;
        script.dataset.siteBitrixChat = 'true';
        script.src = 'https://cdn-ru.bitrix24.ru/b38606320/crm/site_button/loader_1_mxd7ow.js?' + (Date.now() / 60000 | 0);
        document.head.appendChild(script);
      }
    });
  };
  const trainingChatDialog = document.getElementById('trainingChatDialog');
  const trainingChatForm = document.getElementById('trainingChatForm');
  const trainingChatPartnerFields = document.getElementById('trainingChatPartnerFields');
  const chatHandoffToast = document.getElementById('chatHandoffToast');
  const chatHandoffTitle = document.getElementById('chatHandoffTitle');
  const chatHandoffMessage = document.getElementById('chatHandoffMessage');
  const chatHandoffManual = document.getElementById('chatHandoffManual');
  const chatHandoffRecopy = chatHandoffToast.querySelector('.chat-handoff-toast__recopy');
  let chatHandoffText = '';
  let trainingChatInterest = '';
  async function copyChatHandoffText(value) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (_) {
      const temporary = document.createElement('textarea');
      temporary.value = value;
      temporary.setAttribute('readonly', '');
      temporary.style.position = 'fixed';
      temporary.style.opacity = '0';
      document.body.appendChild(temporary);
      temporary.select();
      const copied = document.execCommand('copy');
      temporary.remove();
      return copied;
    }
  }
  function showChatHandoff(message, copied, chatOpened) {
    chatHandoffText = message;
    chatHandoffManual.value = message;
    chatHandoffManual.hidden = copied;
    chatHandoffTitle.textContent = copied ? 'Запрос скопирован' : 'Чат готов к сообщению';
    chatHandoffMessage.textContent = copied
      ? `${chatOpened ? 'Чат открыт.' : 'Нажмите синюю кнопку чата.'} Вставьте запрос в поле сообщения${/Android|iPhone|iPad/i.test(navigator.userAgent) ? ' (на телефоне — нажмите поле и выберите «Вставить»)' : ' (Ctrl+V)'} и отправьте его.`
      : 'Тема и телефон переданы менеджеру. Скопируйте запрос кнопкой ниже, затем вставьте его в поле сообщения чата.';
    chatHandoffToast.hidden = false;
  }
  chatHandoffRecopy.addEventListener('click', async () => {
    const copied = chatHandoffText ? await copyChatHandoffText(chatHandoffText) : false;
    chatHandoffManual.hidden = copied;
    chatHandoffTitle.textContent = copied ? 'Запрос скопирован' : 'Не удалось скопировать';
    chatHandoffMessage.textContent = copied
      ? 'Теперь нажмите поле сообщения в чате, выберите «Вставить» и отправьте запрос.'
      : 'Нажмите на текст ниже, выделите его и выберите «Копировать», затем вставьте в чат.';
    if (!copied) {
      chatHandoffManual.focus();
      chatHandoffManual.select();
    }
  });
  chatHandoffManual.addEventListener('click', () => chatHandoffManual.select());
  chatHandoffToast.querySelector('.chat-handoff-toast__close').addEventListener('click', () => { chatHandoffToast.hidden = true; });
  document.querySelectorAll('[data-chat-interest]').forEach(button => button.addEventListener('click', () => {
    trainingChatInterest = button.dataset.chatInterest || 'Вопрос менеджеру';
    document.getElementById('trainingChatTopic').textContent = trainingChatInterest;
    const isPartnershipRequest = /партнёр|партнер|франшиз/i.test(trainingChatInterest);
    const guidance = /обучен/i.test(trainingChatInterest)
      ? 'Менеджер уточнит ближайшие даты, наличие мест, формат занятий и оплату. Запрос не обязывает записываться: сначала можно обсудить детали курса.'
      : /франшиз/i.test(trainingChatInterest)
        ? 'Франшиза пока прорабатывается. Менеджер зафиксирует предварительный интерес и уточнит ваш регион и опыт; заявка не означает подключение к программе или согласование условий.'
        : /регион/i.test(trainingChatInterest)
          ? 'Сначала обсудим ваш регион, опыт команды и возможность начать с пилотного проекта. Территория, вложения и постоянные обязательства этой заявкой не устанавливаются.'
          : isPartnershipRequest
            ? 'Менеджер уточнит объект, этап работ и возможную роль мастерской. Состав работ, сроки, расчёты и ответственность согласуются отдельно.'
            : 'Оставьте телефон — менеджер свяжется, чтобы ответить на ваш вопрос и уточнить дальнейшие шаги.';
    document.getElementById('trainingChatGuidance').textContent = guidance;
    trainingChatPartnerFields.hidden = !isPartnershipRequest;
    trainingChatForm.elements.city.value = '';
    trainingChatForm.elements.experience.value = '';
    trainingChatForm.elements.privacyConsent.checked = false;
    document.getElementById('trainingChatStatus').textContent = '';
    trainingChatDialog.showModal();
    document.getElementById('trainingChatPhone').focus();
  }));
  trainingChatDialog.querySelector('.training-chat-dialog__close').addEventListener('click', () => trainingChatDialog.close());
  trainingChatDialog.addEventListener('click', event => { if (event.target === trainingChatDialog) trainingChatDialog.close(); });
  trainingChatForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!trainingChatForm.reportValidity()) return;
    const phone = trainingChatForm.elements.phone.value.trim();
    const city = trainingChatForm.elements.city.value.trim();
    const experience = trainingChatForm.elements.experience.value.trim();
    const partnerContext = [city && `Регион: ${city}`, experience && `Опыт/команда: ${experience}`].filter(Boolean).join('. ');
    const message = `Здравствуйте, Анна! Меня интересует: ${trainingChatInterest}.${partnerContext ? ` ${partnerContext}.` : ''} Мой телефон: ${phone}. Пожалуйста, свяжитесь со мной.`;
    const status = document.getElementById('trainingChatStatus');
    const copied = await copyChatHandoffText(message);
    const customData = [{ GRID: [
      { NAME: 'Тема обращения', VALUE: trainingChatInterest, DISPLAY: 'LINE' },
      { NAME: 'Текст запроса', VALUE: message, DISPLAY: 'LINE' },
      { NAME: 'Телефон для связи', VALUE: phone, DISPLAY: 'LINE' },
      ...(city ? [{ NAME: 'Город или регион', VALUE: city, DISPLAY: 'LINE' }] : []),
      ...(experience ? [{ NAME: 'Опыт или команда', VALUE: experience, DISPLAY: 'LINE' }] : [])
    ] }];
    window.sitePendingChatContext = customData;
    status.textContent = copied ? 'Запрос готов. Подключаем чат…' : 'Открываем чат менеджера…';
    const widget = await window.ensureSiteBitrixChat();
    if (widget && typeof widget.open === 'function') {
      if (typeof widget.setCustomData === 'function') widget.setCustomData(customData);
      widget.open();
      trainingChatDialog.close();
      showChatHandoff(message, copied, true);
    } else {
      document.querySelector('.b24-widget-button-openline_livechat, .b24-widget-button-openline')?.click();
      trainingChatDialog.close();
      showChatHandoff(message, copied, false);
    }
  });

  const certificateDialog = document.getElementById('dealerCertificateDialog');
  const certificateZoom = certificateDialog.querySelector('.dealer-certificate-dialog__zoom');
  document.querySelector('.dealer-certificate-trigger').addEventListener('click', () => {
    const certificateImage = certificateDialog.querySelector('.dealer-certificate-dialog__viewport img');
    if (certificateImage && !certificateImage.hasAttribute('src') && certificateImage.dataset.src) {
      certificateImage.src = certificateImage.dataset.src;
    }
    certificateDialog.showModal();
  });
  certificateDialog.querySelector('.dealer-certificate-dialog__close').addEventListener('click', () => certificateDialog.close());
  certificateDialog.addEventListener('click', event => { if (event.target === certificateDialog) certificateDialog.close(); });
  certificateZoom.addEventListener('click', () => {
    const enlarged = certificateZoom.getAttribute('aria-pressed') !== 'true';
    certificateZoom.setAttribute('aria-pressed', String(enlarged));
    certificateDialog.classList.toggle('is-zoomed', enlarged);
    certificateZoom.textContent = enlarged ? 'Уменьшить' : 'Увеличить';
  });
  certificateDialog.addEventListener('close', () => {
    certificateDialog.classList.remove('is-zoomed');
    certificateZoom.setAttribute('aria-pressed', 'false');
    certificateZoom.textContent = 'Увеличить';
  });

  // Carry the stair configurator summary into the contact section without
  // pretending that the cross-origin Bitrix form has received it automatically.
  const stairConfigFromUrl = new URLSearchParams(window.location.search).get('stair_config');
  if (stairConfigFromUrl) {
    const contactStartNote = document.querySelector('#contact .contact-start-note');
    if (contactStartNote) {
      const handoff = document.createElement('div');
      handoff.className = 'stair-config-handoff';
      const title = document.createElement('strong');
      title.textContent = 'Параметры для обсуждения';
      const details = document.createElement('p');
      details.className = 'stair-config-handoff__details';
      details.textContent = stairConfigFromUrl.slice(0, 500);
      const note = document.createElement('p');
      note.className = 'stair-config-handoff__note';
      note.textContent = 'Нажмите кнопку: параметры скопируются, а чат с менеджером откроется. Менеджер также увидит конфигурацию.';
      const copyButton = document.createElement('button');
      copyButton.className = 'stair-config-handoff__copy';
      copyButton.type = 'button';
      copyButton.textContent = 'Скопировать и открыть чат';
      copyButton.addEventListener('click', async () => {
        const copied = await copyChatHandoffText(details.textContent);
        const customData = [{ GRID: [
          { NAME: 'Параметры лестницы', VALUE: details.textContent, DISPLAY: 'LINE' }
        ] }];
        window.sitePendingChatContext = customData;
        const widget = await window.ensureSiteBitrixChat();
        if (widget && typeof widget.open === 'function') {
          if (typeof widget.setCustomData === 'function') widget.setCustomData(customData);
          widget.open();
          copyButton.textContent = copied ? 'Параметры скопированы · чат открыт' : 'Чат открыт';
          showChatHandoff(details.textContent, copied, true);
        } else {
          document.querySelector('.b24-widget-button-openline_livechat, .b24-widget-button-openline')?.click();
          copyButton.textContent = copied ? 'Параметры скопированы · нажмите синюю кнопку чата' : 'Нажмите синюю кнопку чата';
          showChatHandoff(details.textContent, copied, false);
        }
      });
      handoff.append(title, details, note, copyButton);
      contactStartNote.after(handoff);
    }
  }

