import './units.js';
import './clock.js';
import './timer.js';
import './alarm.js';
import './stopwatch.js';
import './wordcount.js';

/* --- Lazy Script Loader --- */
import { loadScripts, setToolStatus, setFileToolBusy } from './util.js';

const PDF_SCRIPTS = [
  'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js',
  'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js',
];
const CONVERT_SCRIPTS = [
  'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js',
  'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js',
  'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js',
  'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
  'https://cdn.jsdelivr.net/npm/utif@3.1.0/UTIF.js',
];

function setupPdfWorker() {
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  }
}

const _tabLoads = {};
function loadTabModule(tabName) {
  const tool = tabName === 'mr'
    ? { key: 'pdf', prefix: 'mr', label: 'PDF Tools', scripts: PDF_SCRIPTS, load: () => import('./pdf.js') }
    : tabName === 'files'
      ? { key: 'converter', prefix: 'cv', label: 'File Tools', scripts: CONVERT_SCRIPTS, load: () => import('./converter.js') }
      : null;
  if (tool) {
    if (!_tabLoads[tool.key]) {
      let loading = true;
      setFileToolBusy(tool.prefix, true);
      setToolStatus(tool.prefix, `Loading ${tool.label}…`, { state: 'loading', value: 0, max: tool.scripts.length });
      _tabLoads[tool.key] = loadScripts(tool.scripts, (value, max) => {
        if (loading) setToolStatus(tool.prefix, `Loading ${tool.label}… (${value}/${max})`, { state: 'loading', value, max });
      }).then(() => {
        setupPdfWorker();
        setToolStatus(tool.prefix, `Starting ${tool.label}…`, { state: 'loading' });
        return tool.load();
      }).then(() => {
        loading = false;
        setFileToolBusy(tool.prefix, false);
        setToolStatus(tool.prefix);
      }).catch(e => {
        loading = false;
        setFileToolBusy(tool.prefix, false, { disabled: true });
        setToolStatus(tool.prefix, `Could not load ${tool.label.toLowerCase()}. Check your connection and retry.`, { state: 'error', retry: true });
        delete _tabLoads[tool.key];
        console.error(`${tool.label} failed to load`, e);
      });
    }
    return _tabLoads[tool.key];
  } else if (tabName === 'speed') {
    if (!_tabLoads.speed) {
      _tabLoads.speed = import('./speed.js')
        .catch(e => { console.error('Speed load failed', e); delete _tabLoads.speed; });
    }
  }
}

[['cv', 'files'], ['mr', 'mr']].forEach(([prefix, tab]) => {
  const drop = document.getElementById(`${prefix}Dropzone`);
  ['dragover', 'drop'].forEach(type => drop.addEventListener(type, e => {
    if (document.getElementById(`${prefix}FileInput`).disabled) e.preventDefault();
  }));
  document.querySelector(`#${prefix}Status .tool-retry`).addEventListener('click', () => loadTabModule(tab));
});

/* --- Light/Dark Theme Setup --- */
const themeToggle = document.getElementById('theme-toggle');

const sunIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
const moonIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

function setTheme(isLight) {
    document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
    themeToggle.innerHTML = isLight ? moonIcon : sunIcon;
    themeToggle.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
}

let isLightMode = document.documentElement.dataset.theme === 'light';
setTheme(isLightMode);

themeToggle.addEventListener('click', () => {
  isLightMode = !isLightMode;
  setTheme(isLightMode);
  try { localStorage.setItem('knickknacks-theme', isLightMode ? 'light' : 'dark'); } catch (e) { /* The toggle still works without storage. */ }
});
window.addEventListener('storage', e => {
  if (e.key !== 'knickknacks-theme' && e.key !== null) return;
  isLightMode = e.newValue === 'light';
  setTheme(isLightMode);
});

/* --- Tab Management (with hash routing) --- */
const tabButtons = document.querySelectorAll('.tab-btn');
const validTabs = ['home', 'units', 'files', 'words', ...Array.from(tabButtons).map(b => b.dataset.tab)];
const DEFAULT_TAB = 'home';

function revealActiveTab() {
  const active = document.querySelector('.tab-btn.active');
  const links = active?.closest('.tab-links');
  if (!links || links.clientWidth === 0 || links.scrollWidth <= links.clientWidth) return;
  const buttonRect = active.getBoundingClientRect(), linksRect = links.getBoundingClientRect();
  if (buttonRect.left < linksRect.left + 6 || buttonRect.right > linksRect.right - 6) {
    links.scrollLeft += buttonRect.left - linksRect.left - 6;
  }
}
window.addEventListener('resize', () => requestAnimationFrame(revealActiveTab));
document.fonts.ready.then(revealActiveTab);
// Renders a tab as active without touching the URL — used by both the hashchange
// listener and the initial load, so the hash is always the single source of truth.
function activateTab(tabName, focusInput) {
  if (!validTabs.includes(tabName)) tabName = DEFAULT_TAB;
  tabButtons.forEach(b => {
    const active = b.dataset.tab === tabName;
    b.classList.toggle('active', active);
    if (active) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  document.querySelectorAll('.tab-panel').forEach(p => p.hidden = p.id !== 'tab-' + tabName);
  loadTabModule(tabName);
  if (tabName === 'units' && focusInput) document.getElementById('num-in').focus();
  if (tabName === 'words' && focusInput) document.getElementById('wcInput').focus();
  requestAnimationFrame(revealActiveTab);
  return tabName;
}

// Clicking a tab updates the hash (bookmarkable + back/forward friendly). If the
// hash is already correct (e.g. re-clicking the current tab), hashchange won't
// fire on its own, so activate directly in that case. Some sandboxed embeds (e.g.
// an about:srcdoc preview iframe) disallow URL/History changes entirely — fall
// back to just switching the panel so the tabs still work there.
function navigateToTab(tabName) {
  if (location.hash.slice(1) === tabName) { activateTab(tabName, true); return; }
  try { location.hash = tabName; }
  catch (e) { activateTab(tabName, true); }
}

tabButtons.forEach(btn => btn.addEventListener('click', () => {
  navigateToTab(btn.dataset.tab);
}));

document.querySelectorAll('.home-tile').forEach(tile => tile.addEventListener('click', () => {
  navigateToTab(tile.dataset.goto);
}));

const homeFab = document.getElementById('homeFab');
function goHome() {
  if (location.hash.slice(1) === 'home') { activateTab('home', false); return; }
  try { location.hash = 'home'; }
  catch (e) { activateTab('home', false); }
}
homeFab.addEventListener('click', goHome);

window.addEventListener('hashchange', () => activateTab(location.hash.slice(1), true));

// Initial route: honor whatever hash the page was loaded/bookmarked with, defaulting
// to Home. replaceState (not setting location.hash) avoids adding an extra history
// entry, but some sandboxed embeds throw on any History API call — ignore that safely.
const startTab = activateTab(location.hash.slice(1), false);
if (location.hash.slice(1) !== startTab) {
  try { history.replaceState(null, '', '#' + startTab); } catch (e) { /* URL update unavailable in this embed; tab still activated above */ }
}

// Fullscreen Logic
document.querySelectorAll('.fs-btn').forEach(btn => btn.addEventListener('click', e => {
  e.stopPropagation();
  if (btn.disabled) return;
  const p = e.target.closest('.panel');
  if (!document.fullscreenElement) {
      p.closest('.tab-panel').requestFullscreen && p.closest('.tab-panel').requestFullscreen();
      document.querySelectorAll('.fs-tip').forEach(t => t.hidden = true);
  } else {
      document.exitFullscreen && document.exitFullscreen();
  }
}));

document.addEventListener('fullscreenchange', () => {
  const fsEl = document.fullscreenElement;
  document.querySelectorAll('.panel.time-panel, .panel.speed-panel').forEach(p => {
      const btn = p.querySelector('.fs-btn');
      if (fsEl && fsEl.contains(p)) {
          p.classList.add('fs-active');
          if (btn) btn.setAttribute('aria-label', 'Exit Fullscreen');
          if(btn) btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>';
          document.querySelectorAll('.fs-tip').forEach(t => t.hidden = true);
      } else {
          p.classList.remove('fs-active');
          if (btn) btn.setAttribute('aria-label', 'Enter Fullscreen');
          if(btn) btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>';
      }
  });
});

// Only an empty fullscreen backdrop dismisses the view; tool controls stay usable.
document.addEventListener('click', e => {
  const fsEl = document.fullscreenElement;
  if (fsEl && (e.target === fsEl || e.target.matches('.panel.fs-active'))) {
    document.exitFullscreen();
  }
});
