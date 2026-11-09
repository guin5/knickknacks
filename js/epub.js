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
const fullscreen = document.getElementById('epubFullscreenBtn');
const smaller = document.getElementById('epubFontDown');
const larger = document.getElementById('epubFontUp');
const fontOutput = document.getElementById('epubFontSize');
const progress = document.getElementById('epubProgress');
const bookProgress = document.getElementById('epubBookProgress');
const progressFill = document.getElementById('epubBookProgressFill');
const options = document.getElementById('epubSettings');
const optionsToggle = document.getElementById('epubOptionsBtn');
const optionsClose = document.getElementById('epubOptionsClose');
const optionsBackdrop = document.getElementById('epubOptionsBackdrop');
const recents = document.getElementById('epubRecents');
const recentList = document.getElementById('epubRecentList');
const FONT_KEY = 'knickknacks-epub-font-size';
const FONT_FAMILY_KEY = 'knickknacks-epub-font-family';
const THEME_KEY = 'knickknacks-epub-theme';
const WIDTH_KEY = 'knickknacks-epub-text-width';
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
  dark: { paper: '#16181E', ink: '#E8EAEF', link: '#72B9E8', scheme: 'dark' },
  sepia: { paper: '#F4ECD8', ink: '#4A3B2B', link: '#875020', scheme: 'light' },
  sage: { paper: '#E7EFDF', ink: '#2E3E2F', link: '#356742', scheme: 'light' },
};
const MAX_EPUB_MB = 50;
let book = null, rendition = null, location = null, positionKey = '', busy = false;
let fontData = new WeakMap();
let nativeFullscreen = false;
let stableCfi = '', resizeAnchor = '', pendingResize = null, resizing = false;
let fontSize = 100;
try {
  const saved = Number(localStorage.getItem(FONT_KEY));
  if (saved >= 80 && saved <= 200) fontSize = saved;
  const savedFont = localStorage.getItem(FONT_FAMILY_KEY);
  if (Object.hasOwn(FONT_FAMILIES, savedFont)) fontFamily.value = savedFont;
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === 'auto' || Object.hasOwn(PALETTES, savedTheme)) theme.value = savedTheme;
  const savedWidth = Number(localStorage.getItem(WIDTH_KEY));
  if (savedWidth >= 40 && savedWidth <= 100) textWidth.value = String(savedWidth);
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
  chapters.disabled = busy || !rendition || !chapters.options.length;
  fontFamily.disabled = busy || !rendition;
  theme.disabled = busy || !rendition;
  textWidth.disabled = busy || !rendition;
  alignment.disabled = busy || !rendition;
  close.disabled = busy;
  fullscreen.disabled = busy || !rendition;
  smaller.disabled = busy || !rendition || fontSize <= 80;
  larger.disabled = busy || !rendition || fontSize >= 200;
  recentList.querySelectorAll('button').forEach(button => { button.disabled = busy; });
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

function syncLocation() {
  if (!book || !rendition?.manager?.isRendered()) return;
  const currentLocation = rendition.currentLocation();
  if (currentLocation?.start) updateLocation(book, currentLocation);
}

function setFullscreenLayout(enabled) {
  const changed = tab.classList.contains('epub-fullscreen') !== enabled;
  if (changed && !busy) syncLocation();
  tab.classList.toggle('epub-fullscreen', enabled);
  fullscreen.textContent = enabled ? 'Exit Fullscreen' : 'Enter Fullscreen';
  fullscreen.setAttribute('aria-pressed', String(enabled));
  if (changed) queueReaderResize(viewport.clientWidth, viewport.clientHeight);
}

function enterFullscreen() {
  if (tab.hidden) return;
  setFullscreenLayout(true);
  // Request while the file selection/recent-book click still has user activation.
  // The full-window layout also works in browsers or embeds without the Fullscreen API.
  if (tab.requestFullscreen && document.fullscreenElement !== tab) {
    try { Promise.resolve(tab.requestFullscreen()).catch(() => {}); } catch (e) { /* Keep the full-window reader. */ }
  }
}

function exitFullscreen() {
  setFullscreenLayout(false);
  if (document.fullscreenElement === tab && document.exitFullscreen) {
    try { Promise.resolve(document.exitFullscreen()).catch(() => {}); } catch (e) { /* The regular layout is already restored. */ }
  }
}

function exitOnEscape(event) {
  if (event.key !== 'Escape' || tab.hidden) return false;
  if (!options.hidden) {
    event.preventDefault();
    setOptionsOpen(false);
    return true;
  }
  if (!tab.classList.contains('epub-fullscreen')) return false;
  event.preventDefault();
  exitFullscreen();
  return true;
}

function setOptionsOpen(open, restoreFocus = true) {
  options.hidden = !open;
  optionsBackdrop.hidden = !open;
  optionsToggle.setAttribute('aria-expanded', String(open));
  optionsToggle.inert = open;
  viewport.inert = open;
  if (open) optionsClose.focus({ preventScroll: true });
  else if (restoreFocus && !reader.hidden) optionsToggle.focus({ preventScroll: true });
}

function readingSections(currentBook) {
  return currentBook.spine.spineItems.filter(section => section.linear !== false && section.linear !== 'no');
}

function resetBook() {
  setOptionsOpen(false, false);
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
  exitFullscreen();
  if (oldBook) oldBook.destroy();
  viewport.replaceChildren();
  chapters.replaceChildren();
  progress.textContent = '';
  progressFill.style.transform = 'scaleX(0)';
  bookProgress.setAttribute('aria-valuenow', '0');
  bookProgress.setAttribute('aria-valuetext', 'Start of book');
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
  if (theme.value !== 'auto') return PALETTES[theme.value];
  const styles = getComputedStyle(document.documentElement);
  return {
    paper: styles.getPropertyValue('--surface').trim(),
    ink: styles.getPropertyValue('--text').trim(),
    link: document.documentElement.dataset.theme === 'dark' ? PALETTES.dark.link : styles.getPropertyValue('--accent').trim(),
    scheme: document.documentElement.dataset.theme,
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
      width: `${availableWidth * Number(textWidth.value) / 100}px !important`,
      margin: '0 auto !important',
      padding: '24px clamp(16px, 4vw, 40px) !important',
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
  reader.style.setProperty('--epub-link', palette.link);
  viewport.style.setProperty('color-scheme', palette.scheme);
  if (rendition) rendition.getContents().forEach(styleContents);
}

function populateChapters(currentBook, navigation) {
  const addItems = (items, depth = 0) => {
    items.forEach(item => {
      if (item.href && currentBook.spine.get(item.href)) {
        const option = document.createElement('option');
        option.value = item.href;
        option.textContent = `${'— '.repeat(depth)}${item.label.trim() || 'Untitled chapter'}`;
        chapters.appendChild(option);
      }
      if (item.subitems?.length) addItems(item.subitems, depth + 1);
    });
  };
  addItems(navigation.toc || []);
  if (!chapters.options.length) {
    readingSections(currentBook).forEach((section, index) => {
      const option = document.createElement('option');
      option.value = section.href;
      option.textContent = `Section ${index + 1}`;
      chapters.appendChild(option);
    });
  }
}

function updateLocation(currentBook, currentLocation) {
  if (book !== currentBook || !currentLocation?.start) return;
  location = currentLocation;
  const href = location.start.href.split('#')[0];
  if (chapters.value.split('#')[0] !== href) {
    const option = Array.from(chapters.options).find(item => item.value.split('#')[0] === href);
    chapters.value = option?.value || '';
  }
  const sections = readingSections(currentBook);
  const index = sections.findIndex(section => section.index === location.start.index);
  progress.textContent = index >= 0 ? `Chapter ${index + 1} of ${sections.length}` : 'Book';
  updateBookProgress(currentBook, currentLocation);
  updateControls();
  if (!busy) {
    stableCfi = location.start.cfi;
    try { localStorage.setItem(positionKey, location.start.cfi); } catch (e) { /* Storage is optional. */ }
  }
}

function updateBookProgress(currentBook, currentLocation) {
  if (book !== currentBook || !currentLocation?.start) return;
  const sections = readingSections(currentBook);
  const index = sections.findIndex(section => section.index === currentLocation.start.index);
  const displayed = currentLocation.start.displayed;
  const chapterFraction = Math.max(0, (displayed.page - 1) / Math.max(1, displayed.total));
  let fraction = (Math.max(0, index) + chapterFraction) / Math.max(1, sections.length);
  if (currentBook.locations.length() > 1) {
    fraction = currentBook.locations.percentageFromCfi(currentLocation.start.cfi);
  }
  if (currentLocation.atStart) fraction = 0;
  else if (currentLocation.atEnd) fraction = 1;
  fraction = Math.max(0, Math.min(1, fraction || 0));
  progressFill.style.transform = `scaleX(${fraction})`;
  bookProgress.setAttribute('aria-valuenow', String(Math.round(fraction * 1000) / 10));
  bookProgress.setAttribute('aria-valuetext', progress.textContent || 'Reading progress');
}

async function indexBookProgress(currentBook) {
  const locations = [];
  for (const section of readingSections(currentBook)) {
    if (book !== currentBook) return;
    const contents = await section.load(currentBook.load.bind(currentBook));
    if (book !== currentBook) return;
    locations.push(...currentBook.locations.parse(contents, section.cfiBase, 1000));
    // Keep in-flight/visible sections intact; release indexing-only documents as we go.
    if (!rendition.views().all().some(view => view.section === section)) section.unload();
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  if (book === currentBook && locations.length > 1) {
    currentBook.locations.load(locations);
    updateBookProgress(currentBook, location);
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
  current.manager.container.scrollTop = view.element.offsetTop + offset.top;
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
  setBusy(true);
  enterFullscreen();
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
    let savedPosition = null;
    try { savedPosition = localStorage.getItem(positionKey); } catch (e) { /* Storage is optional. */ }
    populateChapters(currentBook, currentBook.navigation);
    dropzone.hidden = true;
    recents.hidden = true;
    // Remove loading chrome before measuring the reader so becoming ready does not
    // trigger another resize that could overwrite the user's first scroll.
    setToolStatus('epub');
    reader.hidden = false;

    lastWidth = viewport.clientWidth;
    lastHeight = viewport.clientHeight;
    rendition = currentBook.renderTo(viewport, {
      // ResizeObserver owns sizing so browser fullscreen changes do not race a second
      // EPUB.js window-resize handler and restore an out-of-date reading position.
      width: lastWidth,
      height: lastHeight,
      spread: 'none',
      manager: 'continuous',
      flow: 'scrolled-continuous',
      gap: 0,
      allowScriptedContent: false,
      allowPopups: false,
    });
    rendition.hooks.content.register(contents => {
      if (book !== currentBook) return;
      contentFonts(contents);
      styleContents(contents);
      scaleContents(contents);
    });
    rendition.on('started', () => {
      const manager = rendition.manager;
      const moveTo = manager.moveTo.bind(manager);
      // EPUB.js supplies window-relative iframe coordinates; this reader sits below the header.
      manager.moveTo = offset => {
        const bounds = manager.container.getBoundingClientRect();
        moveTo({ top: offset.top - bounds.top, left: offset.left - bounds.left });
      };
    });
    rendition.on('attached', () => {
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
    rendition.on('rendered', (section, view) => {
      view.iframe?.setAttribute('title', metadata.title || 'EPUB book');
      // Leave room to align the last chapter at the top even when it is shorter than the screen.
      if (section.index === readingSections(currentBook).at(-1)?.index) view.element.classList.add('epub-final-section');
    });
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
    indexBookProgress(currentBook).catch(() => {});
    setToolStatus('epub');
    if (!tab.hidden) viewport.focus({ preventScroll: true });
  } catch (e) {
    resetBook();
    setToolStatus('epub');
    showError(`Could not read this EPUB. The file may be damaged or DRM-protected. ${e.message || ''}`.trim());
  } finally {
    setBusy(false);
  }
}

async function navigate(action) {
  if (busy || !rendition) return;
  showError();
  setBusy(true);
  try {
    await withTimeout(action(), 'This page could not be loaded. Try reopening the file.');
  } catch (e) {
    showError(`Could not move to this part of the book. ${e.message || ''}`.trim());
  } finally {
    setBusy(false);
  }
}

function handleKeydown(event) {
  if (exitOnEscape(event)) return;
  if (tab.hidden || reader.hidden || busy || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
  if (event.target.closest?.('button, a, input, select, textarea, [contenteditable="true"]')) return;
  const scroller = viewport.querySelector('.epub-container');
  if (!scroller) return;
  const distance = {
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
chapters.addEventListener('change', () => {
  if (!chapters.value) return;
  const target = chapters.value;
  setOptionsOpen(false, false);
  viewport.focus({ preventScroll: true });
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
fullscreen.addEventListener('click', () => {
  setOptionsOpen(false, false);
  syncLocation();
  if (tab.classList.contains('epub-fullscreen')) exitFullscreen();
  else enterFullscreen();
  viewport.focus({ preventScroll: true });
});
optionsToggle.addEventListener('click', () => setOptionsOpen(true));
optionsClose.addEventListener('click', () => setOptionsOpen(false));
optionsBackdrop.addEventListener('click', () => setOptionsOpen(false));
options.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const controls = options.querySelectorAll('button:not(:disabled), select:not(:disabled), input:not(:disabled)');
  const first = controls[0], last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
document.addEventListener('keydown', exitOnEscape);
document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement === tab) {
    nativeFullscreen = true;
    // A fast failed load or close can finish before the browser's fullscreen request.
    if (!tab.classList.contains('epub-fullscreen')) exitFullscreen();
  } else if (nativeFullscreen) {
    nativeFullscreen = false;
    setFullscreenLayout(false);
  }
});
close.addEventListener('click', () => {
  syncLocation();
  resetBook();
  showError();
  setToolStatus('epub');
  setBusy(false);
  document.getElementById('epubBrowseBtn').focus();
});
viewport.addEventListener('keydown', handleKeydown);
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
