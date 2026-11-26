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
