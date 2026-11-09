# guydemaesjanssens.nl

One-page site: resume, consulting offer, personal interests and contact. Built on the design system in `../Design system/Design system setup`.

## Edit and build

- Copy lives in `src/index.html`. Page layout CSS in `src/site.css`, behaviour (menu, theme toggle, route animation) in `src/site.js`.
- `{{contours:…}}`, `{{icon:name:size}}`, `{{monogram:size}}` and `{{year}}` are filled in at build time from the design system.
- Build into `docs/` (no dependencies, Node 18+):

```bash
node build.mjs
```

- Preview locally:

```bash
python3 -m http.server 4173 --directory docs
```

`docs/` is the whole website. Commit it: GitHub Pages serves `main` → `/docs` at www.guydemaesjanssens.nl.

## Still to fill in

- Start date of the Rabobank role (shown as "2024 – now", estimated from "2.5 years").
- Earlier roles: innovation lead, product development, and anything before Rabobank.
- LinkedIn URL, portrait, education/certifications.
- Dutch version (the design system defaults to NL).
- OG/social image and a privacy statement.
