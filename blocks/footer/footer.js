import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // Group authored headings and retain a fallback for the legacy
  // four-paragraph fragment.
  const footerContent = fragment.querySelector('.default-content-wrapper');
  const footerChildren = [...(footerContent?.children || [])];
  const hasAuthoredGroups = footerChildren.some((child) => (
    /^H[2-6]$/.test(child.tagName)
  ));
  if (hasAuthoredGroups) {
    let group;
    footerChildren.forEach((child) => {
      if (/^H[2-6]$/.test(child.tagName)) {
        group = document.createElement('div');
        group.className = 'footer-column';
        const heading = child.textContent.toLowerCase();
        if (heading.includes('newsletter')) group.classList.add('footer-newsletter');
        else if (heading.includes('vorteile')) group.classList.add('footer-benefits');
        else if (heading.includes('zahlung')) group.classList.add('footer-payments');
        else if (heading.includes('recht')) group.classList.add('footer-legal');
        child.replaceWith(group);
        group.append(child);
      } else if (group) group.append(child);
    });
  } else {
    const groupNames = ['STIHL', 'Rechtliches', 'Service', 'Social Media'];
    [...fragment.querySelectorAll('.default-content-wrapper p')].forEach((paragraph, index) => {
      const column = document.createElement('div');
      column.className = 'footer-column';
      const heading = document.createElement('h2');
      heading.textContent = groupNames[index] || 'Weitere Links';
      paragraph.replaceWith(column);
      column.append(heading, paragraph);
    });
  }

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);
}
