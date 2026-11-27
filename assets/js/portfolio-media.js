const catalog = document.querySelector('.media-catalog');

catalog?.addEventListener('toggle', ({ target }) => {
  if (target instanceof HTMLDetailsElement && !target.open) {
    target.querySelectorAll('video').forEach((video) => video.pause());
  }
}, true);

const linkedClip = document.getElementById(location.hash.slice(1));
if (linkedClip?.matches('.media-card--video')) {
  const group = linkedClip.closest('.media-more');
  if (group) group.open = true;
  linkedClip.open = true;
}

const viewer = document.querySelector('.media-viewer');
if (catalog && viewer?.showModal) {
  const viewerImage = new Image();
  catalog.addEventListener('click', (event) => {
    const photo = event.target.closest('.media-card--photo > a');
    if (!photo || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    viewerImage.alt = photo.querySelector('img').alt;
    viewerImage.src = photo.href;
    if (!viewerImage.isConnected) viewer.append(viewerImage);
    viewer.showModal();
  });
}

const videoDialog = document.createElement('dialog');
if (catalog && typeof videoDialog.showModal === 'function' && catalog.querySelector('.media-card--video')) {
  videoDialog.className = 'media-video-viewer';
  videoDialog.setAttribute('aria-labelledby', 'media-video-title');
  videoDialog.innerHTML = `
    <form method="dialog"><button class="media-video-viewer__back" type="submit" autofocus><span aria-hidden="true">←</span> К галерее</button></form>
    <h2 id="media-video-title"></h2>
    <div class="media-video-viewer__stage"></div>
    <div class="media-video-viewer__details">
      <p></p>
      <a class="media-video-viewer__link" hidden>Страница видео</a>
    </div>
    <div class="media-video-viewer__nav" role="group" aria-label="Видео раздела" hidden>
      <button type="button" data-video-step="-1">Предыдущее</button>
      <span aria-live="polite"></span>
      <button type="button" data-video-step="1">Следующее</button>
    </div>`;
  document.body.append(videoDialog);

  const stage = videoDialog.querySelector('.media-video-viewer__stage');
  const title = videoDialog.querySelector('h2');
  const description = videoDialog.querySelector('p');
  const watchLink = videoDialog.querySelector('a');
  const navigation = videoDialog.querySelector('.media-video-viewer__nav');
  const counter = navigation.querySelector('span');
  const [previous, next] = navigation.querySelectorAll('button');
  let opener;
  let sourceCard;
  let clips = [];
  let position = 0;

  function restoreClip() {
    const video = stage.querySelector('video');
    if (!video) return;
    video.pause();
    sourceCard.querySelector('summary').after(video);
  }

  function displayClip(index) {
    const card = clips[index];
    const video = card.querySelector(':scope > video');
    const poster = card.querySelector('summary img');
    const link = card.querySelector(':scope > .media-card__link');
    restoreClip();
    sourceCard = card;
    position = index;
    title.textContent = video.getAttribute('aria-label') || card.querySelector('.media-card__title').textContent;
    description.textContent = card.querySelector(':scope > p')?.textContent || '';
    watchLink.hidden = !link;
    if (link) watchLink.href = link.href;
    else watchLink.removeAttribute('href');
    navigation.hidden = clips.length < 2;
    counter.textContent = `${index + 1} / ${clips.length}`;
    previous.disabled = index === 0;
    next.disabled = index === clips.length - 1;
    if (poster && !video.poster) video.poster = poster.currentSrc || poster.src;
    stage.append(video);
    return video;
  }

  catalog.querySelectorAll('.media-card--video > summary').forEach((summary) => {
    if (summary.parentElement.querySelector(':scope > video')) summary.setAttribute('aria-haspopup', 'dialog');
  });

  catalog.addEventListener('click', (event) => {
    const summary = event.target.closest('.media-card--video > summary');
    if (!summary || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const card = summary.parentElement;
    if (!card.querySelector(':scope > video')) return;

    const section = card.closest('section');
    clips = section ? [...section.querySelectorAll('.media-card--video')].filter((clip) => clip.querySelector(':scope > video')) : [card];
    opener = summary;
    videoDialog.showModal();
    event.preventDefault();
    document.documentElement.classList.add('media-video-dialog-open');
    displayClip(clips.indexOf(card)).play().catch(() => {});
  });

  navigation.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-video-step]');
    if (!button || button.disabled) return;
    displayClip(position + Number(button.dataset.videoStep));
    if (button.disabled) (button === next ? previous : next).focus();
  });

  videoDialog.addEventListener('close', () => {
    restoreClip();
    document.documentElement.classList.remove('media-video-dialog-open');
    opener?.focus({ preventScroll: true });
  });
}
