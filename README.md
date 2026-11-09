# Knickknacks

Open `index.html` in a browser, or serve this directory with a static web server.
The checked-in `js/app.bundle.js` supports both ways of opening the site.
File conversion, PDF tools, and the EPUB reader load their third-party libraries on demand and
require an internet connection.

## EPUB reader

Open **Reader** from the home screen or tool bar, then choose or drop an
unencrypted `.epub` file (up to 50 MB). Books are read locally in the browser.
Read the book as one continuous vertical scroll, or jump using the chapter menu.
The text-size controls scale publisher-styled text as well as headings. Font
options include Book default, Georgia, Palatino, Sans serif, and Monospace. Choose
Match site, Light, Dark, Sepia, or Sage for the reading colors. The floating Home
button is hidden while reading; the wordmark still links home.
Books open in fullscreen by default, including when reopened from Recent books.
Use **Exit Fullscreen** or Escape to return to the regular layout, or **Close Book**
to return to Recent books. A full-window reading view is used when browser
fullscreen is unavailable.
The menu button on the left opens a hidden-by-default drawer with chapter jumps,
font, color, text width, alignment, fullscreen, and close controls. A slim horizontal
bar at the bottom shows whole-book reading progress without a percentage label.
Left-aligned mode removes publisher first-line indents so paragraphs sit flush left.

Close a book to see **Recent books**. Click a title to reopen it, or use its small
× button to remove the saved copy and reading position. Up to ten recent EPUBs
are kept locally in this browser using IndexedDB, with a session-only fallback
when browser storage is unavailable. Font, text size, reading colors, text width,
alignment, and your place are remembered when local storage is available.

## Updating JavaScript

Edit the source modules in `js/`, then rebuild the browser bundle:

```sh
npm install
npm run build
```

Include the updated `js/app.bundle.js` when publishing source changes. The bundle
keeps tool initialization lazy while avoiding local-file module restrictions.
