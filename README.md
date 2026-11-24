# Knickknacks

Open `index.html` in a browser, or serve this directory with a static web server.
The checked-in `js/app.bundle.js` supports both ways of opening the site.
File conversion, PDF tools, and the EPUB reader load their third-party libraries on demand and
require an internet connection.

## EPUB reader

Open **Reader** from the home screen or tool bar, then choose or drop an
unencrypted `.epub` file (up to 50 MB). Books are read locally in the browser.
An open book fills the browser content area. Use the layout button to cycle
between continuous scrolling, one page, and two pages. Two pages display as one
on narrow screens. Click or tap either side, or use the left and right arrow keys,
to turn pages. Click or tap the center to toggle the toolbar. The toolbar includes book search and a table of
contents. Click or tap the upper-right corner to save a place, and open or remove saved
bookmarks from the table of contents. Bookmarks are stored locally for each book.
The **A** menu controls text size, font, reading colors, alignment, and scroll-mode
text width. **Library** returns to recent books.
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
