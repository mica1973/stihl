import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Closes the open nav dropdown (desktop) or the nav menu (mobile) on Escape
 * @param {KeyboardEvent} e keydown event
 */
function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

/**
 * Closes the open nav dropdown (desktop) or the nav menu (mobile) when focus leaves the nav
 * @param {FocusEvent} e focusout event
 */
function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean|string} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-drop > button').forEach((button) => {
    button.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  // the desktop nav is always expanded, so aria-expanded only applies to the mobile menu
  if (isDesktop.matches) nav.removeAttribute('aria-expanded');
  else nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Navigation öffnen' : 'Navigation schließen');

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navTools = nav.querySelector('.nav-tools');
  const utility = document.createElement('div');
  utility.className = 'nav-utility';
  if (navTools) {
    navTools.remove();
    const toolsParagraph = navTools.querySelector('.default-content-wrapper > p');
    const [dealerLink, ...actionLinks] = [...(toolsParagraph?.querySelectorAll(':scope > a') || [])];
    if (toolsParagraph && dealerLink) {
      const dealer = document.createElement('span');
      dealer.className = 'nav-utility-dealer';
      dealer.append(dealerLink);
      const actions = document.createElement('span');
      actions.className = 'nav-utility-actions';
      actionLinks.forEach((link, index) => {
        if (index) actions.append(document.createTextNode(' | '));
        actions.append(link);
      });
      [
        ['Wunschliste', 'https://www.stihl.de/de/merkliste'],
        ['Warenkorb', 'https://www.stihl.de/de/warenkorb'],
        ['Produktsuche', 'https://www.stihl.de/de/suche'],
      ].forEach(([text, href]) => {
        actions.append(document.createTextNode(' | '));
        const link = document.createElement('a');
        // Other destination pages are intentionally not imported into this one-page EDS site.
        link.href = new URL(href, 'https://www.stihl.de').href;
        link.textContent = text;
        actions.append(link);
      });
      toolsParagraph.replaceChildren(dealer, actions);
    }
    utility.append(navTools);
  }

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  // A migrated nav fragment may contain only the STIHL name as text. Restore the
  // visual wordmark and anniversary mark without making authors maintain raw SVG markup.
  const logoLink = navBrand.querySelector('a');
  if (logoLink && !logoLink.querySelector('img')) {
    logoLink.replaceChildren();
    logoLink.setAttribute('aria-label', 'STIHL Startseite');
    const logo = document.createElement('img');
    logo.src = 'https://www.stihl.de/content/experience-fragments/stihl/de/de/main_navigation/master_msm_moved/_jcr_content/root/mainnav/logo.coreimg.svg/1643645266502/stihl-logo.svg';
    logo.alt = 'STIHL';
    logoLink.append(logo);

    const anniversaryLink = document.createElement('a');
    anniversaryLink.href = 'https://www.stihl.de/de/campaign/one-time-campaigns/100-jahre-stihl';
    anniversaryLink.setAttribute('aria-label', '100 Jahre STIHL');
    const anniversary = document.createElement('img');
    anniversary.src = 'https://www.stihl.de/content/experience-fragments/stihl/de/de/main_navigation/master_msm_moved/_jcr_content/root/mainnav/logo-new.coreimg.svg/1768401828403/stihl-100-years-logo-rgb-navi-orange-de.svg';
    anniversary.alt = '100 Jahre STIHL';
    anniversaryLink.append(anniversary);
    logoLink.parentElement.append(anniversaryLink);
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    const menuList = navSections.querySelector(':scope .default-content-wrapper > ul');
    const missingSections = [
      {
        title: 'Zubehör',
        links: [
          ['Zubehör für Kettensägen', '/de/ac/kettensaegen-zubehoer-motorsaegenzubehoer-98285'],
          ['Akkus und Ladegeräte', '/de/ac/akku-geraete-zubehoer-99386'],
          ['Betriebsstoffe', '/de/ac/betriebsstoffe-98280'],
          ['Persönliche Schutzausrüstung', '/de/ac/persoenliche-schutzausruestung-98284'],
          ['Übersicht Produktzubehör', '/de/products/produktzubehoer'],
        ],
      },
      {
        title: 'Profis',
        links: [
          ['Alle Profi-Produkte', '/de/professional/alle-profi-produkte'],
          ['Online Produktberater', '/de/produktberater'],
          ['Services für Firmenkunden', '/de/professional/serviceleistungen'],
          ['ALLPRO-System', '/de/technologie/akku-technologie/allpro-system'],
          ['Alle Profi-Themen', '/de/professional'],
        ],
      },
    ];
    missingSections.forEach(({ title, links }) => {
      const exists = [...(menuList?.querySelectorAll(':scope > li') || [])]
        .some((item) => item.textContent.trim().startsWith(title));
      if (exists || !menuList) return;
      const item = document.createElement('li');
      const label = document.createElement('p');
      label.textContent = title;
      const subList = document.createElement('ul');
      links.forEach(([text, href]) => {
        const entry = document.createElement('li');
        const paragraph = document.createElement('p');
        const link = document.createElement('a');
        // Keep non-homepage destinations on the source site; they are not imported here.
        link.href = new URL(href, 'https://www.stihl.de').href;
        link.textContent = text;
        paragraph.append(link);
        entry.append(paragraph);
        subList.append(entry);
      });
      item.append(label, subList);
      menuList.append(item);
    });

    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      const subList = navSection.querySelector(':scope > ul');
      if (!subList) return;
      navSection.classList.add('nav-drop');
      // wrap the dropdown label in a button so it is announced as expandable
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-expanded', false);
      [...navSection.childNodes].forEach((node) => {
        if (node !== subList) button.append(node);
      });
      navSection.prepend(button);
      button.addEventListener('click', () => {
        const expanded = button.getAttribute('aria-expanded') === 'true';
        if (isDesktop.matches) {
          button.focus();
          toggleAllNavSections(navSections);
        }
        button.setAttribute('aria-expanded', !expanded);
      });
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  const promotion = document.createElement('a');
  promotion.className = 'nav-promo';
  promotion.href = 'https://www.stihl.de/de/gratis-akku';
  promotion.textContent = 'JETZT SET AUS DEM AS-SYSTEM KAUFEN UND GRATIS AS 2 AKKUS SICHERN!';
  promotion.setAttribute('aria-label', promotion.textContent);
  navWrapper.append(promotion, utility, nav);
  block.append(navWrapper);
}
