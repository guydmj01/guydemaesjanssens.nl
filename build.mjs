// Builds the static site into ./public from ./src and the design system.
// Run: node build.mjs   (no dependencies)
// The design system stays the source of truth: its CSS, fonts, icons, contours and brand
// marks are copied/inlined at build time, so a change there shows up on the next build.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DS = resolve(here, '../Design system/Design system setup');
const SRC = join(here, 'src');
const OUT = join(here, 'docs'); // GitHub Pages serves this folder

const { CONTOURS } = await import(pathToFileURL(join(DS, 'components/brand/contourData.js')));
const { MONOGRAM } = await import(pathToFileURL(join(DS, 'components/brand/brandPaths.js')));
const { ICONS } = await import(pathToFileURL(join(DS, 'components/brand/iconPaths.js')));

rmSync(OUT, { recursive: true, force: true });
for (const d of ['css', 'js', 'fonts']) mkdirSync(join(OUT, d), { recursive: true });

// CSS: flatten the design system's @import chain, then append page layout.
function flatten(file) {
  return readFileSync(file, 'utf8').replace(/@import url\("([^"]+)"\);/g, (_, rel) => flatten(join(dirname(file), rel)));
}
const css = [
  flatten(join(DS, 'styles.css')),
  readFileSync(join(DS, 'templates/templates.css'), 'utf8'),
  readFileSync(join(SRC, 'site.css'), 'utf8'),
].join('\n');
// tokens/fonts.css uses ../fonts/, which resolves to public/fonts from public/css.
writeFileSync(join(OUT, 'css/site.css'), css);

// Fonts, icons for the browser tab, and the script.
for (const f of readdirSync(join(DS, 'fonts'))) copyFileSync(join(DS, 'fonts', f), join(OUT, 'fonts', f));
for (const f of ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'])
  copyFileSync(join(DS, 'assets/brand', f), join(OUT, f));
copyFileSync(join(SRC, 'site.js'), join(OUT, 'js/site.js'));

// HTML: expand {{...}} placeholders into inline SVG.
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
function icon(name, size) {
  if (!ICONS[name]) throw new Error('Unknown icon: ' + name);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
}

const html = readFileSync(join(SRC, 'index.html'), 'utf8').replace(/\{\{([^}]+)\}\}/g, (_, tag) => {
  const [kind, ...a] = tag.split(':');
  if (kind === 'contours') return contours(a[0], a[1] || '', a[2] || '');
  if (kind === 'monogram') return monogram(Number(a[0]));
  if (kind === 'icon') return icon(a[0], Number(a[1] || 24));
  if (kind === 'year') return String(new Date().getFullYear());
  throw new Error('Unknown placeholder: ' + tag);
});
writeFileSync(join(OUT, 'index.html'), html);
// GitHub Pages: custom domain, and serve files as-is (no Jekyll).
writeFileSync(join(OUT, 'CNAME'), 'www.guydemaesjanssens.nl\n');
writeFileSync(join(OUT, '.nojekyll'), '');
console.log('Built', OUT);
