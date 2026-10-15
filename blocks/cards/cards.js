import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const rows = [...block.children];
  const productCards = rows.some((row) => row.querySelector('h3')
    && /Verfügbarkeit|\d[.,]\d{2}\s*€/.test(row.textContent));
  const categoryCards = !productCards && rows.length >= 6 && rows.every((row) => row.querySelector('picture, img')
    && row.querySelector('a') && !row.querySelector('h3'));

  /* change to ul, li */
  const ul = document.createElement('ul');
  rows.forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPicture = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    const optimizedImage = optimizedPicture.querySelector('img');
    if (img.hasAttribute('width') && img.hasAttribute('height')) {
      optimizedImage.width = img.width;
      optimizedImage.height = img.height;
    }
    img.closest('picture').replaceWith(optimizedPicture);
  });
  block.replaceChildren(ul);

  if (productCards || categoryCards) {
    const label = productCards ? 'Produkte' : 'Kategorien';
    block.classList.add(productCards ? 'cards-products' : 'cards-categories');
    ul.setAttribute('aria-label', label);
    ul.setAttribute('aria-roledescription', productCards ? 'Produktkarussell' : 'Kategorienkarussell');

    if (productCards) {
      // Product imports can include a small image for a battery or other item in the set.
      // Keep it with its product, but don't let it render like a second full-size card image.
      ul.querySelectorAll(':scope > li').forEach((card) => {
        const body = card.querySelector('.cards-card-body');
        const title = body.querySelector('h3');
        const badgeMatch = title?.textContent.match(/^(Neu|Angebot):\s*/i);
        if (badgeMatch) {
          const badge = document.createElement('span');
          badge.className = 'cards-product-badge';
          badge.textContent = badgeMatch[1].toUpperCase();
          title.before(badge);
          title.textContent = title.textContent.slice(badgeMatch[0].length);
        }

        const accessoryParagraphs = [...body.querySelectorAll(':scope > p')]
          .filter((paragraph) => paragraph.querySelector('picture'));
        if (!accessoryParagraphs.length) return;

        const accessories = document.createElement('div');
        accessories.className = 'cards-card-accessories';
        accessories.setAttribute('aria-label', 'Set-Bestandteile');
        accessoryParagraphs.forEach((paragraph) => {
          [...paragraph.querySelectorAll('picture')].forEach((picture) => accessories.append(picture));
          paragraph.remove();
        });
        card.querySelector('.cards-card-image')?.append(accessories);
      });
    }

    const controls = document.createElement('div');
    controls.className = 'cards-carousel-controls';
    controls.innerHTML = `
      <button type="button" class="cards-carousel-previous" aria-label="${label} nach links schieben"><span aria-hidden="true">‹</span></button>
      <button type="button" class="cards-carousel-next" aria-label="${label} nach rechts schieben"><span aria-hidden="true">›</span></button>`;
    const previous = controls.querySelector('.cards-carousel-previous');
    const next = controls.querySelector('.cards-carousel-next');
    const updateControls = () => {
      controls.hidden = ul.scrollWidth <= ul.clientWidth + 1;
      previous.disabled = ul.scrollLeft <= 30;
      next.disabled = ul.scrollLeft + ul.clientWidth >= ul.scrollWidth - 1;
    };
    const scroll = (direction) => {
      const firstCard = ul.querySelector(':scope > li');
      const gap = parseFloat(getComputedStyle(ul).columnGap) || 0;
      ul.scrollBy({ left: direction * ((firstCard?.getBoundingClientRect().width || ul.clientWidth) + gap), behavior: 'smooth' });
    };
    previous.addEventListener('click', () => scroll(-1));
    next.addEventListener('click', () => scroll(1));
    ul.addEventListener('scroll', updateControls, { passive: true });
    window.addEventListener('resize', updateControls);
    block.append(controls);
    requestAnimationFrame(updateControls);
  }
}
