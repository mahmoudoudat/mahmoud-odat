# Mahmoud Aloudat - architect portfolio website

A static website: plain HTML, CSS and JavaScript. No build step, no framework, no server code.

## What's inside

```
index.html            Home: hero, selected work, about, contact
project.html          One template that renders every project (project.html?p=hospital)
css/style.css         All styling. Colour tokens are at the top (light and dark themes)
js/content.js         ALL the text and image paths. Edit this file to change content
js/main.js            Theme toggle, smooth scroll, cursor, page wipe, drawing viewer
js/home.js            Home page animations
js/project.js         Project page rendering and animations
js/vendor/            GSAP + ScrollTrigger and Lenis (local copies, nothing loads from a CDN)
assets/img/           Project images (WebP) and drawings rendered from your original vector sheets
assets/fonts/         Poppins (WOFF2)
assets/cv.pdf         Your CV (linked from the nav and contact section)
assets/portfolio.pdf  Your PDF portfolio (linked from the contact section)
```

## Try it on your computer

For a faithful preview run a tiny local server in this folder (needs Node.js):

    npx serve .

Double-clicking `index.html` also works, but browsers block local font files, so you will see a fallback font instead of Poppins. Once the site is on any web host the font loads normally.

## Put it online (any free static host works)

Upload the contents of this folder (not the folder's parent) to:

- Cloudflare Pages: create a project and choose direct upload
- Netlify: drag the folder onto the Netlify "Drop" page
- GitHub Pages: push the folder to a repository and turn on Pages in its settings

Then, once you know your address:

1. In `index.html` and `project.html`, change `assets/img/og.jpg` in the `og:image` tag to the full address,
   e.g. `https://yourname.com/assets/img/og.jpg`, so link previews show the image.
2. Optionally add a `<link rel="canonical" href="https://yourname.com/">` to `index.html`.

## Editing

- Text, specs, captions and the order of projects: `js/content.js`. Each project has `story`, `glance` (the small facts table), `scope` (the "What it covers" list) and `home` (the images shown on the home page; `span` is the width in a 12-column grid)
- Replace an image: overwrite the file in `assets/img/` (keep the same name), or change its path in `content.js`.
  If the new image has different proportions, update its `w` and `h` numbers in `content.js`.
- Replace the CV or PDF portfolio: overwrite `assets/cv.pdf` / `assets/portfolio.pdf`.
- Colours: the `:root` and `html[data-theme="dark"]` blocks at the top of `css/style.css`.

## Accessibility and performance notes

- The splash screen (a building drawn level by level while the name rises) plays once per browser session. Open the site in a new private window to see it again. Click or press a key to speed it up.
- Respects the visitor's reduced-motion setting (animations are skipped, content stays visible).
- Keyboard friendly: skip link, visible focus, the drawing viewer supports arrow keys, + / -, 0 and Esc.
- Drawings open in a zoomable viewer (scroll or pinch to zoom, drag to pan, double-click to zoom in).
- Images are lazy-loaded and sized to avoid layout jumps.

## Licences

GSAP and ScrollTrigger (GreenSock standard licence), Lenis (MIT), Poppins (SIL Open Font Licence).
