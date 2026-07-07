# SIRILAND Professional 2026 Architecture

Current public site stays GitHub Pages compatible: `index.html`, `style.css`, `script.js`, `properties.js`, `images/`.

Professional CMS foundation added:

- `admin.html` — browser CMS for adding/editing listings and exporting ZIP.
- `data/properties.json` — clean data mirror for future tools.
- `src/core/parser.js` — Facebook post text parser.
- `src/core/validator.js` — required-field and 4-language validation.
- `src/core/exporter.js` — `properties.js` / JSON generator.
- `src/core/imageMatcher.js` — safe image naming.

Rule: `properties.js` is the file used by GitHub Pages. Every export must create a valid `properties.js` and put selected images under `images/`.
