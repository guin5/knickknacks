import { checkFileSize, getExt, setFileToolBusy, setToolStatus, wireDropzone } from './util.js';
import { forgetBook, getRecentBook, getRecentBooks, rememberBook } from './epub-library.js';

/* --- EPUB Reader --- */
const tab = document.getElementById('tab-epub');
const dropzone = document.getElementById('epubDropzone');
const reader = document.getElementById('epubReader');
const viewport = document.getElementById('epubViewport');
const error = document.getElementById('epubError');
const chapters = document.getElementById('epubChapters');
const fontFamily = document.getElementById('epubFontFamily');
const theme = document.getElementById('epubTheme');
const textWidth = document.getElementById('epubTextWidth');
const widthOutput = document.getElementById('epubTextWidthValue');
const alignment = document.getElementById('epubAlignment');
const close = document.getElementById('epubCloseBtn');
const layoutButton = document.getElementById('epubLayoutBtn');
const appearance = document.getElementById('epubAppearance');
const searchToggle = document.getElementById('epubSearchBtn');
const searchPanel = document.querySelector('.epub-search-panel');
const searchForm = document.getElementById('epubSearchForm');
const searchInput = document.getElementById('epubSearchInput');
const searchStatus = document.getElementById('epubSearchStatus');
const searchResults = document.getElementById('epubSearchResults');
const toolbar = document.querySelector('.epub-toolbar');
const contentsToggle = document.getElementById('epubContentsBtn');
const bookmarkButton = document.getElementById('epubBookmarkBtn');
const bookmarkNotice = document.getElementById('epubBookmarkNotice');
const bookmarkSection = document.getElementById('epubBookmarks');
const bookmarkList = document.getElementById('epubBookmarkList');
const optionsTitle = document.getElementById('epubOptionsTitle');
let layout = 'scroll';
let pageTurning = false;
let queuedPageTurn = 0;
const hint = document.getElementById('epubHint');
const smaller = document.getElementById('epubFontDown');
const larger = document.getElementById('epubFontUp');
const fontOutput = document.getElementById('epubFontSize');
const progress = document.getElementById('epubProgress');
const options = document.getElementById('epubSettings');
const optionsClose = document.getElementById('epubOptionsClose');
const recents = document.getElementById('epubRecents');
const recentList = document.getElementById('epubRecentList');
const FONT_KEY = 'knickknacks-epub-font-size';
const FONT_FAMILY_KEY = 'knickknacks-epub-font-family';
const THEME_KEY = 'knickknacks-epub-theme';
const WIDTH_KEY = 'knickknacks-epub-text-width';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let pageSlide;
const LAYOUT_KEY = 'knickknacks-epub-layout';
const ALIGNMENT_KEY = 'knickknacks-epub-alignment';
const FONT_FAMILIES = {
  book: '',
  georgia: 'Georgia, "Times New Roman", serif',
  palatino: '"Palatino Linotype", Palatino, "Book Antiqua", serif',
  sans: 'Arial, Helvetica, sans-serif',
  mono: '"Courier New", Courier, monospace',
};
const PALETTES = {
  light: { paper: '#FFFFFF', ink: '#262626', link: '#1B5A85', scheme: 'light' },
  'black-gray': { paper: '#000000', ink: '#B3B3B3', link: '#82C9FF', scheme: 'dark' },
  'black-white': { paper: '#000000', ink: '#FFFFFF', link: '#82C9FF', scheme: 'dark' },
  sepia: { paper: '#F4ECD8', ink: '#4A3B2B', link: '#875020', scheme: 'light' },
};
const MAX_EPUB_MB = 50;
let book = null, rendition = null, location = null, positionKey = '', busy = false;
let bookmarks = [];
const sessionBookmarks = new Map();
const sessionRemovedBookmarks = new Set();
let currentFile = null;
let searchGeneration = 0;
let fontData = new WeakMap();
let stableCfi = '', resizeAnchor = '', pendingResize = null, resizing = false;
let fontSize = 100;
try {
  const saved = Number(localStorage.getItem(FONT_KEY));
  if (saved >= 80 && saved <= 200) fontSize = saved;
  const savedFont = localStorage.getItem(FONT_FAMILY_KEY);
  if (Object.hasOwn(FONT_FAMILIES, savedFont)) fontFamily.value = savedFont;
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === 'auto' || savedTheme === 'dark' || Object.hasOwn(PALETTES, savedTheme)) theme.value = savedTheme;
  const savedWidth = Number(localStorage.getItem(WIDTH_KEY));
  if (savedWidth >= 40 && savedWidth <= 100) textWidth.value = String(savedWidth);
  const savedLayout = localStorage.getItem(LAYOUT_KEY);
  if (savedLayout === 'single' || savedLayout === 'spread') layout = savedLayout;
  const savedAlignment = localStorage.getItem(ALIGNMENT_KEY);
  if (savedAlignment === 'left' || savedAlignment === 'justify') alignment.value = savedAlignment;
} catch (e) { /* Reading still works when storage is unavailable. */ }
fontOutput.textContent = `${fontSize}%`;
widthOutput.textContent = `${textWidth.value}%`;

function showError(message = '') {
  error.textContent = message;
  error.hidden = !message;
}

function updateControls() {
  const controlsBusy = busy && !pageTurning;
  for (const chapter of chapters.querySelectorAll("button")) chapter.disabled = controlsBusy || !rendition;
  fontFamily.disabled = controlsBusy || !rendition;
  theme.disabled = controlsBusy || !rendition;
  textWidth.disabled = controlsBusy || !rendition || layout !== 'scroll';
  alignment.disabled = controlsBusy || !rendition;
  close.disabled = controlsBusy;
  bookmarkButton.disabled = controlsBusy || !rendition || !location?.start?.cfi;
  updateBookmarkState();
  layoutButton.disabled = controlsBusy || !rendition;
  const labels = { scroll: 'Continuous scroll', single: 'One page', spread: 'Two pages' };
  const next = { scroll: 'single', single: 'spread', spread: 'scroll' };
  const layoutLabel = 'Layout: ' + labels[layout] + '. Switch to ' + labels[next[layout]].toLowerCase();
  layoutButton.setAttribute('aria-label', layoutLabel);
  layoutButton.title = layoutLabel;
  layoutButton.querySelectorAll('[data-layout-icon]').forEach(icon => {
    icon.toggleAttribute('hidden', icon.dataset.layoutIcon !== layout);
  });
  smaller.disabled = controlsBusy || !rendition || fontSize <= 80;
  larger.disabled = controlsBusy || !rendition || fontSize >= 200;
  recentList.querySelectorAll('button').forEach(button => { button.disabled = controlsBusy; });
}

async function refreshRecentBooks() {
  const entries = await getRecentBooks();
  recentList.replaceChildren();
  for (const entry of entries) {
    const row = document.createElement('li');
    row.className = 'epub-recent';
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'epub-recent-open';
    open.dataset.openBook = entry.id;
    const title = document.createElement('span');
    title.className = 'epub-recent-title';
    title.textContent = entry.title;
    const author = document.createElement('span');
    author.className = 'epub-recent-author';
    author.textContent = entry.author || entry.filename;
    open.append(title, author);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'epub-recent-remove';
    remove.dataset.removeBook = entry.id;
    remove.textContent = '×';
    remove.title = 'Remove from recent books';
    remove.setAttribute('aria-label', `Remove ${entry.title} from recent books`);
    row.append(open, remove);
    recentList.appendChild(row);
  }
  recents.hidden = !reader.hidden || entries.length === 0;
  updateControls();
}

function setBusy(value) {
  busy = value;
  setFileToolBusy('epub', value);
  viewport.setAttribute('aria-busy', String(value));
  if (!value) {
    syncLocation();
    // A silent move to the same offset emits no scroll event to clear EPUB.js's ignore flag.
    if (rendition?.manager) rendition.manager.ignore = false;
  }
  updateControls();
  if (!value) flushReaderResize();
}

function focusViewport() {
  viewport.classList.add('programmatic-focus');
  viewport.focus({ preventScroll: true });
}

function syncLocation() {
  if (!book || !rendition?.manager?.isRendered()) return;
  const currentLocation = rendition.currentLocation();
  if (currentLocation?.start) updateLocation(book, currentLocation);
}

function readingSections(currentBook) {
  return currentBook.spine.spineItems.filter(section => section.linear !== false && section.linear !== 'no');
}

function resetBook() {
  searchGeneration++;
  currentFile = null;
  searchInput.value = '';
  searchResults.replaceChildren();
  searchStatus.textContent = '';
  bookmarks = [];
  bookmarkList.replaceChildren();
  bookmarkSection.hidden = true;
  bookmarkNotice.hidden = true;
  options.close();
  appearance.open = false;
  toolbar.classList.remove('is-hidden');
  pageSlide?.cancel();
  // Clearing the reference first also ignores late location events from an old book.
  const oldBook = book;
  book = null;
  rendition = null;
  location = null;
  positionKey = '';
  stableCfi = '';
  resizeAnchor = '';
  pendingResize = null;
  resizing = false;
  fontData = new WeakMap();
  if (oldBook) oldBook.destroy();
  viewport.replaceChildren();
  chapters.replaceChildren();
  progress.textContent = '';
  reader.hidden = true;
  dropzone.hidden = false;
  recents.hidden = recentList.children.length === 0;
}

async function withTimeout(promise, message) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((resolve, reject) => { timer = setTimeout(() => reject(new Error(message)), 30000); }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function readingPalette() {
  const root = document.documentElement;
  const scheme = theme.value === 'auto' ? root.dataset.theme : theme.value;
  if (theme.value !== 'auto' && scheme !== 'dark') return PALETTES[scheme];

  const styles = getComputedStyle(root);
  if (scheme === 'dark') {
    const ink = styles.getPropertyValue('--dark-text').trim();
    return { paper: styles.getPropertyValue('--dark-bg').trim(), ink, link: ink, scheme };
  }
  return {
    paper: styles.getPropertyValue('--surface').trim(),
    ink: styles.getPropertyValue('--text').trim(),
    link: styles.getPropertyValue('--accent').trim(),
    scheme,
  };
}

function contentFonts(contents) {
  const doc = contents.document;
  if (!fontData.has(doc)) {
    const elements = [doc.body, ...doc.body.querySelectorAll('*')].filter(element =>
      element.namespaceURI === 'http://www.w3.org/1999/xhtml' && !element.matches('script, style, link, meta'));
    const normalize = 18 / (parseFloat(contents.window.getComputedStyle(doc.body).fontSize) || 16);
    // Snapshot every size before writing any styles, including publisher px/pt and inline sizes.
    const sizes = elements.map(element => {
      const styles = contents.window.getComputedStyle(element);
      const size = parseFloat(styles.fontSize) || 16;
      const lineHeight = parseFloat(styles.lineHeight) || size * (element.matches('h1, h2, h3, h4, h5, h6') ? 1.25 : 1.65);
      return { element, size: size * normalize, lineHeight: lineHeight * normalize, family: styles.fontFamily, indent: styles.textIndent };
    });
    fontData.set(doc, sizes);
  }
  return fontData.get(doc);
}

function scaleContents(contents) {
  for (const { element, size, lineHeight, family } of contentFonts(contents)) {
    element.style.setProperty('font-size', `${size * fontSize / 100}px`, 'important');
    element.style.setProperty('line-height', `${lineHeight * fontSize / 100}px`, 'important');
    element.style.setProperty('font-family', FONT_FAMILIES[fontFamily.value] || family, 'important');
  }
}

function styleContents(contents) {
  const palette = readingPalette();
  const doc = contents.document;
  const availableWidth = rendition.manager.viewSettings.width || viewport.clientWidth;
  for (const { element, indent } of contentFonts(contents)) {
    element.style.setProperty('color', element.localName === 'a' ? palette.link : 'inherit', 'important');
    if (element.localName === 'a' && element.hasAttribute('href')) {
      element.style.setProperty('text-decoration-line', 'underline', 'important');
    }
    element.style.setProperty('background-color', 'transparent', 'important');
    if (element.matches('body, p, li, blockquote, div, section, article, td')) {
      element.style.setProperty('text-align', alignment.value, 'important');
      element.style.setProperty('text-align-last', alignment.value === 'left' ? 'left' : 'auto', 'important');
      // Publisher first-line indents otherwise keep paragraphs offset in left-aligned mode.
      element.style.setProperty('text-indent', alignment.value === 'left' ? '0' : indent, 'important');
    }
  }
  doc.documentElement.style.setProperty('background-color', palette.paper, 'important');
  doc.documentElement.style.setProperty('color-scheme', palette.scheme);
  doc.body.style.setProperty('color', palette.ink, 'important');
  doc.body.style.setProperty('background-color', palette.paper, 'important');
  contents.addStylesheetRules({
    body: {
      'max-width': 'none !important',
      // EPUB.js initially measures a zero-width iframe. A concrete text width prevents
      // a huge temporary height and the resulting scroll jumps when its iframe expands.
      ...(reader.dataset.layout === 'scroll' && {
        width: `${availableWidth * Number(textWidth.value) / 100}px !important`,
        margin: '0 auto !important',
        padding: '24px clamp(16px, 4vw, 40px) !important',
      }),
      'box-sizing': 'border-box !important',
      'overflow-wrap': 'anywhere',
    },
    'img, svg, video': { 'max-width': '100% !important', 'object-fit': 'contain' },
    pre: { 'white-space': 'pre-wrap !important' },
  }, 'knickknacks-reader');
}

function applyTheme() {
  const palette = readingPalette();
  viewport.style.setProperty('--epub-paper', palette.paper);
  reader.style.setProperty('--epub-paper', palette.paper);
  reader.style.setProperty('--epub-ink', palette.ink);
  viewport.style.setProperty('color-scheme', palette.scheme);
  if (rendition) rendition.getContents().forEach(styleContents);
}

function populateChapters(currentBook, navigation) {
  function appendChapter(href, label, depth) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.href = href;
    button.textContent = label;
    button.style.setProperty('--chapter-depth', String(Math.min(depth, 6)));
    item.append(button);
    chapters.append(item);
  }
  function addItems(items, depth) {
    for (const item of items) {
      if (item.href && currentBook.spine.get(item.href)) appendChapter(item.href, item.label.trim() || 'Untitled chapter', depth);
      if (item.subitems?.length) addItems(item.subitems, depth + 1);
    }
  }
  addItems(navigation.toc || [], 0);
  if (!chapters.children.length) {
    readingSections(currentBook).forEach((section, index) => appendChapter(section.href, "Section " + (index + 1), 0));
  }
}

function currentChapter() {
  return chapters.querySelector('[aria-current]');
}

function updateLocation(currentBook, currentLocation) {
  if (book !== currentBook || !currentLocation?.start) return;
  location = currentLocation;
  const href = location.start.href.split('#')[0];
  const previous = currentChapter();
  const entries = Array.from(chapters.querySelectorAll('button')).filter(button => button.dataset.href.split('#')[0] === href);
  const view = entries.length > 1 && rendition.views().all().find(item => item.section.index === location.start.index);
  const compare = view?.contents && new window.ePub.CFI();
  const current = compare ? entries.findLast(button => {
    const fragment = button.dataset.href.split('#')[1];
    if (!fragment) return true;
    const target = view.contents.document.getElementById(fragment);
    return target && compare.compare(view.contents.cfiFromNode(target), location.start.cfi) <= 0;
  }) || entries[0] : entries[0];
  if (current !== previous) {
    previous?.removeAttribute('aria-current');
    current?.setAttribute('aria-current', 'location');
  }
  const sections = readingSections(currentBook);
  const index = sections.findIndex(section => section.index === location.start.index);
  progress.textContent = index >= 0 ? `Chapter ${index + 1} of ${sections.length}` : 'Book';
  updateControls();
  if (!busy) {
    stableCfi = location.start.cfi;
    try { localStorage.setItem(positionKey, location.start.cfi); } catch (e) { /* Storage is optional. */ }
  }
}

async function display(target) {
  const current = rendition;
  // EPUB.js emits displayError for chapter load errors without rejecting display().
  let rejectDisplay;
  const failed = new Promise((resolve, reject) => { rejectDisplay = reject; });
  current.on('displayError', rejectDisplay);
  try {
    const rendered = (async () => {
      await current.display(target);
      await new Promise(resolve => requestAnimationFrame(resolve));
      current.views().all().forEach(view => { if (view.contents) view.expand(); });
      await settleLayout(current);
      if (reader.dataset.layout !== 'scroll') {
        if (target) await current.display(target);
        return;
      }
      // Reapply the target after publisher text has been restyled and neighboring chapters sized.
      if (target) await current.display(target);
      await settleLayout(current);
      alignReadingTarget(current, target);
      await current.manager.fill();
      await settleLayout(current);
      alignReadingTarget(current, target);
      await new Promise(resolve => requestAnimationFrame(resolve));
    })();
    await withTimeout(Promise.race([rendered, failed]), 'This part of the book could not be displayed. Try reopening the file.');
  } finally {
    current.off('displayError', rejectDisplay);
  }
}

function alignReadingTarget(current, target) {
  if (!target) return;
  const section = current.book.spine.get(target);
  const view = current.views().all().find(item => item.section === section && item.contents);
  if (!view) return;
  const offset = view.contents.locationOf(target);
  // Use chapter-local coordinates after adjacent chapters have finished expanding.
  // Keep the target visible below the toolbar and account for line-height rounding.
  current.manager.container.scrollTop = Math.max(0, view.element.offsetTop + offset.top - 64);
}

async function settleLayout(current) {
  await Promise.all(current.getContents().map(contents => contents.document.fonts?.ready));
  let previous = '', stable = 0;
  for (let frame = 0; frame < 30 && stable < 3; frame++) {
    await new Promise(resolve => requestAnimationFrame(resolve));
    const scroller = current.manager.container;
    const size = `${scroller.scrollHeight}:${scroller.scrollTop}`;
    stable = size === previous ? stable + 1 : 0;
    previous = size;
  }
}

function createReadingRendition(currentBook) {
  lastWidth = viewport.clientWidth;
  lastHeight = viewport.clientHeight;
  const paged = layout !== 'scroll';
  const metadata = currentBook.packaging.metadata;
  reader.dataset.layout = layout;
  hint.textContent = paged ? 'Click either side or use the arrow keys to turn pages. Click the center to toggle the toolbar.' : 'Scroll to read. Click the center to toggle the toolbar.';
  rendition = currentBook.renderTo(viewport, {
    width: lastWidth,
    height: lastHeight,
    spread: layout === 'spread' ? 'both' : 'none',
    minSpreadWidth: 680,
    manager: paged ? 'default' : 'continuous',
    flow: paged ? 'paginated' : 'scrolled-continuous',
    gap: paged ? undefined : 0,
    allowScriptedContent: false,
    allowPopups: false,
  });
  rendition.hooks.content.register(contents => {
    if (book !== currentBook) return;
    contentFonts(contents);
    styleContents(contents);
    scaleContents(contents);
  });
  if (!paged) rendition.on('started', () => {
    const manager = rendition.manager;
    const moveTo = manager.moveTo.bind(manager);
    // EPUB.js supplies window-relative iframe coordinates; this reader sits below the header.
    manager.moveTo = offset => {
      const bounds = manager.container.getBoundingClientRect();
      moveTo({ top: offset.top - bounds.top, left: offset.left - bounds.left });
    };
  });
  if (!paged) rendition.on('attached', () => {
    const manager = rendition.manager;
    // A resize can leave a silent-scroll flag set; idle scrolling must still report progress
    // and load neighboring chapters. Capture runs before the library's scroll listener.
    manager.container.addEventListener('scroll', () => {
      if (book === currentBook && !busy) manager.ignore = false;
    }, { capture: true, passive: true });
  });
  applyTheme();
  rendition.on('relocated', currentLocation => updateLocation(currentBook, currentLocation));
  rendition.on('keydown', handleKeydown);
  rendition.on('click', handlePageClick);
  rendition.on('rendered', (section, view) => {
    view.iframe?.setAttribute('title', metadata.title || 'EPUB book');
    // Leave room to align the last chapter at the top even when it is shorter than the screen.
    if (!paged && section.index === readingSections(currentBook).at(-1)?.index) view.element.classList.add('epub-final-section');
  });
}

async function openBook(file) {
  if (busy) return;
  showError();
  if (getExt(file.name) !== 'epub' && file.type !== 'application/epub+zip') {
    showError('Choose an EPUB (.epub) file to read.');
    return;
  }
  const sizeError = checkFileSize(file, MAX_EPUB_MB);
  if (sizeError) { showError(sizeError); return; }

  resetBook();
  currentFile = file;
  setBusy(true);
  setToolStatus('epub', `Opening ${file.name}…`);
  try {
    const data = await file.arrayBuffer();
    const currentBook = window.ePub({ replacements: 'blobUrl' });
    book = currentBook;
    await withTimeout((async () => {
      await currentBook.open(data, 'binary');
      await currentBook.opened;
      await currentBook.loaded.navigation;
    })(), 'This EPUB could not be opened. Try another file.');
    if (!readingSections(currentBook).length) {
      throw new Error('This EPUB has no readable sections.');
    }

    const metadata = currentBook.packaging.metadata;
    document.getElementById('epubTitle').textContent = metadata.title || file.name.replace(/\.epub$/i, '');
    document.getElementById('epubAuthor').textContent = metadata.creator || '';
    positionKey = `knickknacks-epub-position:${metadata.identifier || file.name}:${file.size}`;
    loadBookmarks();
    let savedPosition = null;
    try { savedPosition = localStorage.getItem(positionKey); } catch (e) { /* Storage is optional. */ }
    populateChapters(currentBook, currentBook.navigation);
    dropzone.hidden = true;
    recents.hidden = true;
    // Remove loading chrome before measuring the reader so becoming ready does not
    // trigger another resize that could overwrite the user's first scroll.
    setToolStatus('epub');
    reader.hidden = false;

    createReadingRendition(currentBook);
    try {
      await display(savedPosition || undefined);
    } catch (e) {
      if (!savedPosition) throw e;
      await display();
    }
    await rememberBook({
      id: positionKey,
      title: document.getElementById('epubTitle').textContent,
      author: metadata.creator || '',
      filename: file.name,
      file,
    });
    await refreshRecentBooks();
    setToolStatus('epub');
    if (!tab.hidden) focusViewport();
  } catch (e) {
    resetBook();
    setToolStatus('epub');
    showError(`Could not read this EPUB. The file may be damaged or DRM-protected. ${e.message || ''}`.trim());
  } finally {
    setBusy(false);
  }
}

async function navigate(action, { pageTurn = false } = {}) {
  if (busy || !rendition) return;
  showError();
  pageTurning = pageTurn;
  if (pageTurn) busy = true;
  else setBusy(true);
  try {
    await withTimeout(action(), 'This page could not be loaded. Try reopening the file.');
  } catch (e) {
    showError(`Could not move to this part of the book. ${e.message || ''}`.trim());
  } finally {
    pageTurning = false;
    setBusy(false);
    if (queuedPageTurn) {
      const direction = queuedPageTurn;
      queuedPageTurn = 0;
      turnPage(direction);
    }
  }
}

function handleKeydown(event) {
  if (event.key === 'Tab') viewport.classList.remove('programmatic-focus');
  if (options.open && event.key === 'Escape' && !event.defaultPrevented) {
    options.close();
    return;
  }
  if (appearance.open && event.key === 'Escape') {
    appearance.open = false;
    appearance.querySelector('summary').focus();
    return;
  }
  if (tab.hidden || reader.hidden || options.open || appearance.open || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
  if (event.target.closest?.('input, select, textarea, [contenteditable="true"]')) return;
  if (event.key === ' ' && event.target.closest?.('button, a')) return;
  if (reader.dataset.layout !== 'scroll') {
    const direction = { ArrowLeft: -1, ArrowRight: 1, PageUp: -1, PageDown: 1, ' ': event.shiftKey ? -1 : 1 }[event.key];
    if (direction) {
      event.preventDefault();
      turnPage(direction);
    }
    return;
  }
  const scroller = viewport.querySelector('.epub-container');
  if (!scroller) return;
  const distance = {
    ArrowLeft: -scroller.clientHeight * .9,
    ArrowRight: scroller.clientHeight * .9,
    ArrowDown: 64,
    ArrowUp: -64,
    PageDown: scroller.clientHeight * .9,
    PageUp: -scroller.clientHeight * .9,
    ' ': scroller.clientHeight * .9 * (event.shiftKey ? -1 : 1),
  }[event.key];
  if (distance === undefined) return;
  event.preventDefault();
  scroller.scrollBy({ top: distance });
}

function turnPage(direction) {
  if (pageTurning) {
    queuedPageTurn = direction;
    return;
  }
  if (!rendition || busy) return;
  const rtl = book.packaging.metadata.direction === 'rtl';
  const forward = direction * (rtl ? -1 : 1) > 0;
  navigate(async () => {
    const current = rendition;
    const container = current.manager.container;
    const previousOffset = container.scrollLeft;
    const previousView = current.views().first();
    await (forward ? current.next() : current.prev());
    if (rendition !== current || reducedMotion.matches) return;
    const nextView = current.views().first();
    const distance = previousView === nextView
      ? container.scrollLeft - previousOffset
      : direction * container.clientWidth;
    if (!distance || !nextView?.element) return;
    pageSlide?.cancel();
    pageSlide = nextView.element.animate(
      [{ transform: 'translateX(' + distance + 'px)' }, { transform: 'translateX(0)' }],
      { duration: 390, easing: 'cubic-bezier(.32, .1, .25, 1)' },
    );
    try { await pageSlide.finished; } catch (e) { /* The book or animation was replaced. */ }
  }, { pageTurn: true });
}

function handlePageClick(event) {
  if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (options.open || appearance.open) {
    options.close();
    appearance.open = false;
    focusViewport();
    return;
  }
  if (event.target.closest?.('a, button, input, select, textarea') || event.view?.getSelection()?.toString()) return;
  const frameLeft = event.view?.frameElement?.getBoundingClientRect().left || 0;
  const bounds = viewport.getBoundingClientRect();
  const horizontal = (event.clientX + frameLeft - bounds.left) / bounds.width;
  if (horizontal >= .37 && horizontal <= .63) {
    if (toolbar.classList.toggle('is-hidden')) focusViewport();
    return;
  }
  if (reader.dataset.layout !== 'scroll') turnPage(horizontal < .5 ? -1 : 1);
}

function changeFont(amount) {
  if (busy || !rendition) return;
  fontSize = Math.max(80, Math.min(200, fontSize + amount));
  fontOutput.textContent = `${fontSize}%`;
  try { localStorage.setItem(FONT_KEY, String(fontSize)); } catch (e) { /* Storage is optional. */ }
  reflowText();
}

function reflowText() {
  const target = location?.start.cfi;
  navigate(async () => {
    rendition.getContents().forEach(contents => {
      styleContents(contents);
      scaleContents(contents);
    });
    rendition.views().all().forEach(view => { if (view.contents) view.expand(); });
    await new Promise(resolve => requestAnimationFrame(resolve));
    await display(target);
  });
}

wireDropzone(dropzone, document.getElementById('epubFileInput'), document.getElementById('epubBrowseBtn'), files => openBook(files[0]));
chapters.addEventListener('click', event => {
  const chapter = event.target.closest('button[data-href]');
  if (!chapter || busy) return;
  const target = chapter.dataset.href;
  options.close();
  focusViewport();
  navigate(() => display(target));
});
fontFamily.addEventListener('change', () => {
  try { localStorage.setItem(FONT_FAMILY_KEY, fontFamily.value); } catch (e) { /* Storage is optional. */ }
  reflowText();
});
theme.addEventListener('change', () => {
  try { localStorage.setItem(THEME_KEY, theme.value); } catch (e) { /* Storage is optional. */ }
  applyTheme();
});
textWidth.addEventListener('input', () => { widthOutput.textContent = `${textWidth.value}%`; });
textWidth.addEventListener('change', () => {
  try { localStorage.setItem(WIDTH_KEY, textWidth.value); } catch (e) { /* Storage is optional. */ }
  reflowText();
});
alignment.addEventListener('change', () => {
  try { localStorage.setItem(ALIGNMENT_KEY, alignment.value); } catch (e) { /* Storage is optional. */ }
  reflowText();
});
smaller.addEventListener('click', () => changeFont(-10));
larger.addEventListener('click', () => changeFont(10));
async function changeLayout(nextLayout) {
  if (busy || !rendition || nextLayout === layout) return;
  const target = stableCfi || location?.start.cfi;
  const previous = layout;
  layout = nextLayout;
  pendingResize = null;
  resizeAnchor = '';
  await navigate(async () => {
    rendition.destroy();
    try {
      createReadingRendition(book);
      await display(target);
    } catch (error) {
      rendition?.destroy();
      layout = previous;
      createReadingRendition(book);
      await display(target);
      throw error;
    }
    try { localStorage.setItem(LAYOUT_KEY, layout); } catch (e) { /* Storage is optional. */ }
  });
  focusViewport();
}
layoutButton.addEventListener('click', () => {
  const next = { scroll: 'single', single: 'spread', spread: 'scroll' };
  changeLayout(next[layout]);
});
function openOptions(trigger, panel) {
  appearance.open = false;
  if (options.open && options.dataset.panel === panel) {
    options.close();
    return;
  }
  if (options.open && options.dataset.panel === 'search') searchGeneration++;
  options.dataset.panel = panel;
  optionsTitle.textContent = panel === 'contents' ? 'Table of contents' : 'Search';
  searchPanel.hidden = panel !== 'search';
  contentsToggle.setAttribute('aria-expanded', String(panel === 'contents'));
  searchToggle.setAttribute('aria-expanded', String(panel === 'search'));
  if (!options.open) {
    trigger.focus({ preventScroll: true });
    options.show();
  }
  if (panel === 'contents') {
    const chapter = currentChapter() || chapters.querySelector('button');
    if (chapter) {
      chapter.focus({ preventScroll: true });
      const item = chapter.parentElement;
      chapters.scrollTop = item.offsetTop + (item.offsetHeight - chapters.clientHeight) / 2;
    }
  }
  if (panel === 'search') searchInput.focus({ preventScroll: true });
}
contentsToggle.addEventListener('click', () => openOptions(contentsToggle, 'contents'));
searchToggle.addEventListener('click', () => openOptions(searchToggle, 'search'));
document.addEventListener('pointerdown', event => {
  if (appearance.open && !appearance.contains(event.target)) appearance.open = false;
  if (options.open && !options.contains(event.target) && !contentsToggle.contains(event.target) && !searchToggle.contains(event.target)) options.close();
});
optionsClose.addEventListener('click', () => options.close());
options.addEventListener('close', () => {
  if (options.open) return;
  contentsToggle.setAttribute('aria-expanded', 'false');
  searchToggle.setAttribute('aria-expanded', 'false');
  if (options.dataset.panel === 'search') searchGeneration++;
});
window.addEventListener('hashchange', () => {
  if (tab.hidden) {
    options.close();
    appearance.open = false;
  }
});
close.addEventListener('click', () => {
  if (busy) return;
  const previousBook = recentList.querySelector('button[data-open-book="' + CSS.escape(positionKey) + '"]');
  syncLocation();
  resetBook();
  showError();
  setToolStatus('epub');
  setBusy(false);
  (previousBook || document.getElementById('epubBrowseBtn')).focus();
});
document.addEventListener('keydown', handleKeydown);
viewport.addEventListener('click', handlePageClick);
function bookmarkPrefix() {
  return 'knickknacks-epub-bookmark:' + encodeURIComponent(positionKey) + ':';
}

function bookmarkKey(cfi) {
  return bookmarkPrefix() + encodeURIComponent(cfi);
}

function activeBookmark() {
  if (!location?.start?.cfi || !location?.end?.cfi || !window.ePub?.CFI) return null;
  const compare = new window.ePub.CFI();
  return bookmarks.find(item => {
    try {
      return compare.compare(location.start.cfi, item.cfi) <= 0 && compare.compare(item.cfi, location.end.cfi) <= 0;
    } catch (error) {
      return false;
    }
  }) || null;
}

function updateBookmarkState() {
  const marked = Boolean(activeBookmark());
  bookmarkButton.setAttribute('aria-pressed', String(marked));
  const title = marked ? 'Remove bookmark' : 'Bookmark this page';
  bookmarkButton.title = title;
}

function renderBookmarks() {
  bookmarkList.replaceChildren();
  bookmarkSection.hidden = bookmarks.length === 0;
  for (const item of bookmarks) {
    const row = document.createElement('li');
    const open = document.createElement('button');
    const chapter = document.createElement('span');
    const excerpt = document.createElement('span');
    const remove = document.createElement('button');
    open.type = remove.type = 'button';
    open.className = 'epub-bookmark-open';
    open.dataset.bookmarkAction = 'open';
    open.dataset.cfi = item.cfi;
    chapter.textContent = item.chapter || 'Book';
    excerpt.textContent = item.excerpt || 'Saved place';
    open.append(chapter, excerpt);
    remove.className = 'epub-bookmark-remove';
    remove.dataset.bookmarkAction = 'remove';
    remove.dataset.cfi = item.cfi;
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', 'Remove bookmark: ' + (item.chapter || 'Book') + (item.excerpt ? ', ' + item.excerpt : ''));
    row.append(open, remove);
    bookmarkList.append(row);
  }
}

function loadBookmarks() {
  if (!positionKey) return;
  const prefix = bookmarkPrefix();
  const found = new Map();
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!key?.startsWith(prefix) || sessionRemovedBookmarks.has(key)) continue;
      try {
        const item = JSON.parse(localStorage.getItem(key));
        if (typeof item?.cfi !== 'string' || !item.cfi.startsWith('epubcfi(')) continue;
        const parsed = new window.ePub.CFI(item.cfi);
        if (!parsed.path?.steps || !Number.isFinite(parsed.spinePos)) continue;
        found.set(item.cfi, item);
      } catch (error) { /* Ignore malformed saved bookmarks. */ }
    }
  } catch (error) { /* Session bookmarks still work without storage. */ }
  for (const [key, item] of sessionBookmarks) {
    if (key.startsWith(prefix) && !sessionRemovedBookmarks.has(key)) found.set(item.cfi, item);
  }
  const compare = new window.ePub.CFI();
  bookmarks = Array.from(found.values()).sort((a, b) => compare.compare(a.cfi, b.cfi));
  renderBookmarks();
  updateBookmarkState();
}

function removeBookmark(item) {
  const key = bookmarkKey(item.cfi);
  sessionBookmarks.delete(key);
  try {
    localStorage.removeItem(key);
    sessionRemovedBookmarks.delete(key);
  } catch (error) {
    sessionRemovedBookmarks.add(key);
    bookmarkNotice.textContent = 'Bookmark removed for this session.';
    bookmarkNotice.hidden = false;
  }
  loadBookmarks();
}

function bookmarkExcerpt(cfi) {
  const view = rendition.views().all().find(item => item.section.index === location.start.index);
  if (!view?.contents) return '';
  try {
    const range = view.contents.range(cfi);
    const node = range.startContainer;
    const text = node.nodeType === Node.TEXT_NODE ? node.textContent.slice(range.startOffset) : node.textContent;
    return text.replace(/\s+/g, ' ').trim().slice(0, 120);
  } catch (error) {
    return '';
  }
}

function toggleBookmark() {
  if (busy || !rendition || !positionKey) return;
  syncLocation();
  if (!location?.start?.cfi) return;
  const existing = activeBookmark();
  if (existing) {
    removeBookmark(existing);
    return;
  }
  const item = {
    cfi: location.start.cfi,
    chapter: currentChapter()?.textContent || progress.textContent || 'Book',
    excerpt: bookmarkExcerpt(location.start.cfi),
  };
  const key = bookmarkKey(item.cfi);
  sessionRemovedBookmarks.delete(key);
  try {
    localStorage.setItem(key, JSON.stringify(item));
    sessionBookmarks.delete(key);
    bookmarkNotice.hidden = true;
  } catch (error) {
    sessionBookmarks.set(key, item);
    bookmarkNotice.textContent = 'Bookmark saved for this session only.';
    bookmarkNotice.hidden = false;
  }
  loadBookmarks();
}

bookmarkButton.addEventListener('click', toggleBookmark);
bookmarkList.addEventListener('click', event => {
  const button = event.target.closest('button[data-bookmark-action]');
  if (!button || busy) return;
  const item = bookmarks.find(mark => mark.cfi === button.dataset.cfi);
  if (!item) return;
  if (button.dataset.bookmarkAction === 'remove') {
    removeBookmark(item);
    (bookmarkList.querySelector('.epub-bookmark-open') || chapters).focus();
    return;
  }
  options.close();
  focusViewport();
  navigate(() => display(item.cfi));
});
window.addEventListener('storage', event => {
  if (positionKey && (!event.key || event.key.startsWith(bookmarkPrefix()))) loadBookmarks();
});
searchForm.addEventListener('submit', async event => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query || !currentFile) return;
  const pattern = Array.from(query.replace(/\s+/g, ' '), character =>
    '\\^$.*+?()[]{}|'.includes(character) ? '\\' + character : character
  ).join('');
  const matchesQuery = new RegExp('(' + pattern + ')', 'giu');
  const generation = ++searchGeneration;
  const file = currentFile;
  let searchBook;
  let total = 0;
  let skipped = 0;
  searchResults.replaceChildren();
  searchStatus.textContent = 'Searching…';
  try {
    const data = await file.arrayBuffer();
    if (generation !== searchGeneration) return;
    searchBook = window.ePub({ replacements: 'blobUrl' });
    await searchBook.open(data, 'binary');
    await searchBook.opened;
    const sections = readingSections(searchBook);
    for (const [index, section] of sections.entries()) {
      if (generation !== searchGeneration) return;
      try {
        await section.load(searchBook.load.bind(searchBook));
        if (generation !== searchGeneration) return;
        const seen = new Set();
        const matches = [...section.find(query), ...section.search(query)];
        const fragment = document.createDocumentFragment();
        for (const match of matches) {
          if (seen.has(match.cfi)) continue;
          seen.add(match.cfi);
          const item = document.createElement('li');
          const button = document.createElement('button');
          const sectionName = document.createElement('span');
          const excerpt = document.createElement('span');
          button.type = 'button';
          button.className = 'epub-search-result';
          button.dataset.cfi = match.cfi;
          sectionName.textContent = 'Section ' + (index + 1);
          const pieces = match.excerpt.trim().replace(/\s+/g, ' ').split(matchesQuery);
          pieces.forEach((piece, index) => {
            if (index % 2 === 0) {
              excerpt.append(piece);
            } else {
              const bold = document.createElement('strong');
              bold.textContent = piece;
              excerpt.append(bold);
            }
          });
          button.append(sectionName, excerpt);
          item.append(button);
          fragment.append(item);
          total++;
          if (total >= 300) break;
        }
        searchResults.append(fragment);
      } catch (error) {
        skipped++;
      } finally {
        section.unload();
      }
      if (total >= 300) break;
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (generation !== searchGeneration) return;
    const count = total === 1 ? '1 result' : total + ' results';
    const limit = total >= 300 ? 'Showing the first 300 results.' : count + '.';
    searchStatus.textContent = skipped ? limit + ' Some sections could not be searched.' : limit;
  } catch (error) {
    if (generation === searchGeneration) searchStatus.textContent = 'Could not search this book. Try again.';
  } finally {
    searchBook?.destroy();
  }
});
searchResults.addEventListener('click', event => {
  const result = event.target.closest('button[data-cfi]');
  if (!result || busy) return;
  const target = result.dataset.cfi;
  options.close();
  focusViewport();
  navigate(() => display(target));
});
recentList.addEventListener('click', async event => {
  const button = event.target.closest('button');
  if (!button || busy) return;
  if (button.dataset.removeBook) {
    setBusy(true);
    const id = button.dataset.removeBook;
    await forgetBook(id);
    try { localStorage.removeItem(id); } catch (e) { /* Storage is optional. */ }
    await refreshRecentBooks();
    setBusy(false);
    (recentList.querySelector('button') || document.getElementById('epubBrowseBtn')).focus();
  } else if (button.dataset.openBook) {
    const entry = await getRecentBook(button.dataset.openBook);
    if (entry) openBook(new File([entry.file], entry.filename, { type: 'application/epub+zip' }));
  }
});
new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

// A tab can be hidden while a book is open; only resize when it has real dimensions.
let lastWidth = 0, lastHeight = 0;
function queueReaderResize(width, height) {
  if (!rendition?.manager?.isRendered() || width <= 0 || height <= 0) return;
  if (width === lastWidth && height === lastHeight) {
    pendingResize = null;
    return;
  }
  pendingResize = { width, height };
  if (!resizeAnchor) resizeAnchor = stableCfi || location?.start.cfi;
  flushReaderResize();
}

function flushReaderResize() {
  if (!pendingResize || busy || resizing || !rendition) return;
  const currentBook = book;
  const { width, height } = pendingResize;
  const target = resizeAnchor;
  pendingResize = null;
  lastWidth = width;
  lastHeight = height;
  resizing = true;
  navigate(async () => {
    rendition.resize(width, height, target);
    await display(target);
  }).then(() => {
    if (book !== currentBook) return;
    resizing = false;
    if (pendingResize) flushReaderResize();
    else resizeAnchor = '';
  });
}

new ResizeObserver(entries => {
  const width = Math.round(entries[0].contentRect.width);
  const height = Math.round(entries[0].contentRect.height);
  if (width <= 0 || height <= 0) {
    lastWidth = 0;
    lastHeight = 0;
    return;
  }
  queueReaderResize(width, height);
}).observe(viewport);
updateControls();
refreshRecentBooks();
