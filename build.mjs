// Builds the static site into ./docs (served by GitHub Pages) from ./src and the design system.
// Run: node build.mjs   (no dependencies, Node 18+)
//
// Pages: src/pages/<lang>/<key>.html hold only the <main> content. This script wraps each one in
// the shared head, header (with NL | EN switch) and footer, and expands {{placeholders}}.
// The design system stays the source of truth: its CSS, fonts, icons, contours and brand marks
// are copied or inlined at build time.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DS = resolve(here, '../Design system/Design system setup');
const SRC = join(here, 'src');
const OUT = join(here, 'docs');

const SITE = {
  domain: 'https://www.guydemaesjanssens.nl',
  email: 'guydmj@gmail.com',
  phone: '+31 6 45 72 62 38',
  phoneHref: 'tel:+31645726238',
  kvk: '95511326',
  btw: 'NL005159247B71',
};

// One entry per page; each exists in both languages. Dutch is the default language.
const PAGES = {
  home: { nl: '/', en: '/en/' },
  tech: { nl: '/tech-lead/', en: '/en/tech-lead/' },
  advies: { nl: '/advies/', en: '/en/consulting/' },
};
const LANGS = ['nl', 'en'];

// Interface text (page copy lives in the page files).
const T = {
  nl: {
    skip: 'Naar de inhoud', menu: 'Menu', close: 'Sluiten', mainNav: 'Hoofdmenu', langNav: 'Taal',
    nav: { home: 'Over mij', tech: 'Tech lead', advies: 'Advies' },
    cta: 'Contact', toDark: 'Donkere weergave', home: 'Guy de Maes Janssens, naar de homepage',
    footerLine: 'Tech lead en onafhankelijk IT-adviseur. Rotterdam.',
    footerContact: 'Contact', footerPages: 'Pagina’s',
    kvk: 'KvK', btw: 'BTW',
  },
  en: {
    skip: 'Skip to content', menu: 'Menu', close: 'Close', mainNav: 'Main', langNav: 'Language',
    nav: { home: 'About me', tech: 'Tech lead', advies: 'Consulting' },
    cta: 'Contact', toDark: 'Dark mode', home: 'Guy de Maes Janssens, home',
    footerLine: 'Tech lead and independent IT consultant. Rotterdam, the Netherlands.',
    footerContact: 'Contact', footerPages: 'Pages',
    kvk: 'Chamber of Commerce', btw: 'VAT',
  },
};

const { CONTOURS } = await import(pathToFileURL(join(DS, 'components/brand/contourData.js')));
const { MONOGRAM } = await import(pathToFileURL(join(DS, 'components/brand/brandPaths.js')));
const { ICONS } = await import(pathToFileURL(join(DS, 'components/brand/iconPaths.js')));
const GLOSSARY = JSON.parse(readFileSync(join(SRC, 'glossary.json'), 'utf8'));

rmSync(OUT, { recursive: true, force: true });
for (const d of ['css', 'js', 'fonts']) mkdirSync(join(OUT, d), { recursive: true });

// CSS: flatten the design system's @import chain, then append page layout.
function flatten(file) {
  return readFileSync(file, 'utf8').replace(/@import url\("([^"]+)"\);/g, (_, rel) => flatten(join(dirname(file), rel)));
}
writeFileSync(join(OUT, 'css/site.css'), [
  flatten(join(DS, 'styles.css')),
  readFileSync(join(DS, 'templates/templates.css'), 'utf8'),
  readFileSync(join(SRC, 'site.css'), 'utf8'),
].join('\n')); // tokens/fonts.css uses ../fonts/, which resolves to docs/fonts from docs/css.

for (const f of readdirSync(join(DS, 'fonts'))) copyFileSync(join(DS, 'fonts', f), join(OUT, 'fonts', f));
for (const f of ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'])
  copyFileSync(join(DS, 'assets/brand', f), join(OUT, f));
copyFileSync(join(SRC, 'site.js'), join(OUT, 'js/site.js'));

// ---------- building blocks ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function contours(variant, flags, cls) {
  const v = CONTOURS[variant];
  if (!v) throw new Error('Unknown contour variant: ' + variant);
  const f = new Set(flags.split(',').filter(Boolean));
  const classes = ['g-contours', f.has('drift') && 'g-contours--drift', cls].filter(Boolean).join(' ');
  const route = f.has('route') && v.w === 1600 && v.h === 900
    ? `<path d="${CONTOURS.route}" style="stroke:var(--route-stroke);stroke-width:var(--stroke-route)" stroke-linecap="round"/>` : '';
  return `<div class="${classes}" aria-hidden="true"><svg viewBox="0 0 ${v.w} ${v.h}" preserveAspectRatio="xMidYMid slice" fill="none" focusable="false">`
    + `<g style="stroke:var(--contour-stroke);stroke-opacity:var(--contour-opacity);stroke-width:var(--stroke-contour)" stroke-linecap="round" stroke-linejoin="round">`
    + v.p.map((d) => `<path d="${d}"/>`).join('')
    + `<g style="stroke-opacity:var(--contour-index-opacity)">` + v.x.map((d) => `<path d="${d}"/>`).join('') + `</g></g>`
    + route + `</svg></div>`;
}
function monogram(size) {
  const sw = size < 40 ? 6 : 3;
  return `<svg viewBox="0 0 256 256" width="${size}" height="${size}" class="g-monogram" aria-hidden="true" focusable="false">`
    + `<g fill="none" stroke="currentColor" stroke-width="${sw}">` + MONOGRAM.rings.map((d) => `<path d="${d}"/>`).join('') + `</g>`
    + `<path d="${MONOGRAM.letters}" fill="currentColor"/></svg>`;
}
function icon(name, size = 24) {
  if (!ICONS[name]) throw new Error('Unknown icon: ' + name);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
}

// IT terms: {{term:key}} or {{term:key|shown text}} → a button with a plain-language explanation
// that opens on hover, keyboard focus and tap. Explanations live in src/glossary.json.
let termCount = 0;
function term(spec, lang) {
  const [key, shown] = spec.split('|');
  const g = GLOSSARY[key] && GLOSSARY[key][lang];
  if (!g || key.startsWith('_')) throw new Error(`Unknown glossary term "${key}" for ${lang}`);
  const id = 'term-' + key + '-' + (++termCount);
  return `<span class="s-term"><button type="button" class="s-term__btn" aria-describedby="${id}">${shown || g.label}</button>`
    + `<span class="s-term__tip" role="tooltip" id="${id}"><span class="s-term__name">${esc(g.label)}</span>${esc(g.text)}</span></span>`;
}

function expand(html, lang) {
  return html.replace(/\{\{([^}]+)\}\}/g, (_, tag) => {
    const [kind, ...a] = tag.split(':');
    switch (kind) {
      case 'term': return term(a.join(':'), lang);
      case 'contours': return contours(a[0], a[1] || '', a[2] || '');
      case 'monogram': return monogram(Number(a[0]));
      case 'icon': return icon(a[0], Number(a[1] || 24));
      case 'href': { const p = PAGES[a[0]]; if (!p) throw new Error('Unknown page: ' + a[0]); return p[lang] + (a[1] ? '#' + a[1] : ''); }
      case 'email': return SITE.email;
      case 'phone': return SITE.phone;
      case 'phoneHref': return SITE.phoneHref;
      case 'year': return String(new Date().getFullYear());
      default: throw new Error('Unknown placeholder: ' + tag);
    }
  });
}

// ---------- page shell ----------
function header(key, lang) {
  const t = T[lang];
  const links = (cls) => `<ul class="${cls}">` + Object.keys(PAGES).map((k) =>
    `<li><a href="${PAGES[k][lang]}" class="g-header__link"${k === key ? ' aria-current="page"' : ''}>${t.nav[k]}</a></li>`).join('') + `</ul>`;
  const langSwitch = (cls = '') => `<nav class="g-lang ${cls}" aria-label="${t.langNav}">`
    + LANGS.map((l) => `<a class="g-lang__item" href="${PAGES[key][l]}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="true"' : ''}>`
      + `<span aria-hidden="true">${l.toUpperCase()}</span><span class="g-visually-hidden">${l === 'nl' ? 'Nederlands' : 'English'}</span></a>`).join('<span class="g-lang__sep" aria-hidden="true">|</span>')
    + `</nav>`;
  const themeBtn = (cls, size, label) => `<button type="button" class="${cls}" data-theme-toggle>`
    + `<span class="s-icon-light">${icon('moon', size)}</span><span class="s-icon-dark">${icon('sun', size)}</span>${label ? `<span data-theme-label>${t.toDark}</span>` : ''}</button>`;
  return `<header class="g-header">
  <a href="#main" class="g-skip-link">${t.skip}</a>
  <div class="g-container g-header__bar">
    <a href="${PAGES.home[lang]}" class="g-wordmark g-header__brand" style="font-size:21px" aria-label="${t.home}"><span class="g-wordmark__text"><span class="g-wordmark__name">Guy de Maes Janssens</span></span></a>
    <nav aria-label="${t.mainNav}" class="g-header__nav">${links('g-header__links')}</nav>
    <div class="g-header__tools">
      ${langSwitch('s-lang-top')}
      ${themeBtn('g-theme-btn g-header__theme', 22)}
      <a href="#contact" class="g-btn g-btn--primary g-btn--sm g-header__cta">${t.cta}</a>
      <button type="button" class="g-header__menu-btn" aria-expanded="false" aria-controls="g-header-panel" data-menu>
        <span class="s-menu-open">${icon('menu', 22)}</span><span class="s-menu-close">${icon('x', 22)}</span><span data-menu-label>${t.menu}</span>
      </button>
    </div>
  </div>
  <div id="g-header-panel" class="g-header__panel" hidden>
    <div class="g-container">
      <nav aria-label="${t.mainNav}">${links('g-header__panel-links')}</nav>
      <div class="g-header__panel-tools">${langSwitch()}${themeBtn('g-btn g-btn--secondary g-btn--sm', 20, true)}</div>
      <a href="#contact" class="g-btn g-btn--primary g-btn--block">${t.cta}</a>
    </div>
  </div>
</header>`;
}

function footer(lang) {
  const t = T[lang];
  return `<footer class="g-footer">
  <div class="g-container">
    <div class="g-footer__grid">
      <div class="g-footer__brand">
        <span class="g-wordmark" style="font-size:22px">${monogram(44)}<span class="g-wordmark__text"><span class="g-wordmark__name">Guy de Maes Janssens</span></span></span>
        <p class="g-footer__line">${t.footerLine}</p>
      </div>
      <div class="g-footer__col">
        <p class="g-label g-footer__h">${t.footerContact}</p>
        <ul class="g-footer__list">
          <li><a class="g-footer__contact" href="mailto:${SITE.email}">${icon('mail', 20)}${SITE.email}</a></li>
          <li><a class="g-footer__contact" href="${SITE.phoneHref}">${icon('phone', 20)}${SITE.phone}</a></li>
        </ul>
      </div>
      <div class="g-footer__col">
        <p class="g-label g-footer__h">${t.footerPages}</p>
        <ul class="g-footer__list">${Object.keys(PAGES).map((k) => `<li><a class="g-footer__contact" href="${PAGES[k][lang]}">${t.nav[k]}</a></li>`).join('')}</ul>
      </div>
    </div>
    <div class="g-footer__legal">
      <span>© ${new Date().getFullYear()} Guy de Maes Janssens</span>
      <span>${t.kvk} ${SITE.kvk}</span>
      <span>${t.btw} ${SITE.btw}</span>
    </div>
  </div>
</footer>`;
}

function page(key, lang) {
  const raw = readFileSync(join(SRC, 'pages', lang, key + '.html'), 'utf8');
  const m = raw.match(/^<!--\s*(\{[\s\S]*?\})\s*-->\s*/);
  if (!m) throw new Error(`Missing meta comment in pages/${lang}/${key}.html`);
  const meta = JSON.parse(m[1]);
  const body = expand(raw.slice(m[0].length), lang);
  const url = SITE.domain + PAGES[key][lang];
  const alt = LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE.domain + PAGES[key][l]}">`).join('\n')
    + `\n<link rel="alternate" hreflang="x-default" href="${SITE.domain + PAGES[key].nl}">`;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}">
<meta name="color-scheme" content="light dark">
<link rel="canonical" href="${url}">
${alt}
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:locale" content="${lang === 'nl' ? 'nl_NL' : 'en_GB'}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/Newsreader-normal-200-800-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/InstrumentSans-normal-400-700-latin.woff2" as="font" type="font/woff2" crossorigin>
<script>try{var m=localStorage.getItem('gdmj-theme');if(m==='light'||m==='dark')document.documentElement.dataset.theme=m}catch(e){}</script>
<link rel="stylesheet" href="/css/site.css">
</head>
<body>
${header(key, lang)}
<main id="main" tabindex="-1">
${body}
</main>
${footer(lang)}
<script src="/js/site.js" defer></script>
</body>
</html>
`;
}

let count = 0;
for (const key of Object.keys(PAGES)) {
  for (const lang of LANGS) {
    const dir = join(OUT, PAGES[key][lang]);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), page(key, lang));
    count++;
  }
}

// GitHub Pages: custom domain, and serve files as-is (no Jekyll).
writeFileSync(join(OUT, 'CNAME'), 'www.guydemaesjanssens.nl\n');
writeFileSync(join(OUT, '.nojekyll'), '');
console.log(`Built ${count} pages into`, OUT);
