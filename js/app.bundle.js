(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require2() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // js/util.js
  function loadScript(url) {
    const cache = loadScript._cache;
    if (cache[url]) return cache[url];
    cache[url] = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = url;
      s.crossOrigin = "anonymous";
      s.onload = resolve;
      s.onerror = () => {
        delete cache[url];
        reject(new Error("Failed to load " + url));
      };
      document.head.appendChild(s);
    });
    return cache[url];
  }
  function loadScripts(urls, onProgress = () => {
  }) {
    let completed = 0;
    return Promise.all(urls.map((url) => loadScript(url).then(() => onProgress(++completed, urls.length))));
  }
  function setToolStatus(prefix, message = "", { state = "working", value = null, max = 1, retry = false } = {}) {
    const status = document.getElementById(`${prefix}Status`);
    status.hidden = !message;
    status.dataset.state = state;
    status.querySelector(".tool-status-message").textContent = message;
    status.querySelector(".tool-retry").hidden = !retry;
    const progress = status.querySelector("progress");
    progress.hidden = !message || state === "error" || state === "success";
    progress.max = Math.max(1, max);
    if (value === null) progress.removeAttribute("value");
    else progress.value = value;
  }
  function setFileToolBusy(prefix, busy, { disabled = busy } = {}) {
    document.getElementById(`${prefix}Dropzone`).setAttribute("aria-busy", String(busy));
    document.getElementById(`${prefix}FileInput`).disabled = disabled;
    document.getElementById(`${prefix}BrowseBtn`).disabled = disabled;
  }
  function yieldToBrowser() {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }
  function getDeviceRamGB() {
    return navigator.deviceMemory && navigator.deviceMemory > 0 ? navigator.deviceMemory : 4;
  }
  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }
  function checkFileSize(file, maxMb) {
    const maxBytes = maxMb * 1024 * 1024;
    if (file.size > maxBytes) {
      return `File is ${formatBytes(file.size)} \u2014 the limit for this tool is ${maxMb} MB. Try a smaller file.`;
    }
    return null;
  }
  function formatBytes(bytes) {
    if (!bytes) return "0 KB";
    const units = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + " " + units[i];
  }
  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }
  function getExt(filename) {
    return filename.toLowerCase().split(".").pop() || "";
  }
  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  }
  function createFsTipController(fsTipEl) {
    let fsTipTimer = null;
    return {
      show() {
        if (!fsTipEl) return;
        fsTipEl.hidden = false;
        clearTimeout(fsTipTimer);
        fsTipTimer = setTimeout(() => {
          fsTipEl.hidden = true;
        }, 4e3);
      },
      hide() {
        if (fsTipEl) fsTipEl.hidden = true;
        clearTimeout(fsTipTimer);
      }
    };
  }
  function wireDropzone(drop, input2, btn, cb) {
    drop.addEventListener("click", (e) => {
      if (!input2.disabled && e.target !== input2) input2.click();
    });
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!input2.disabled) input2.click();
    });
    drop.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (!input2.disabled) drop.classList.add("dragover");
    });
    drop.addEventListener("dragleave", () => drop.classList.remove("dragover"));
    drop.addEventListener("drop", (e) => {
      e.preventDefault();
      drop.classList.remove("dragover");
      if (!input2.disabled && e.dataTransfer.files.length) cb(e.dataTransfer.files);
    });
    input2.addEventListener("change", (e) => {
      if (!input2.disabled && e.target.files.length) cb(e.target.files);
      input2.value = "";
    });
  }
  var RAM_GB, MAX_CONVERT_MB, MAX_MERGE_MB, MAX_RASTER_MP;
  var init_util = __esm({
    "js/util.js"() {
      loadScript._cache = {};
      RAM_GB = getDeviceRamGB();
      MAX_CONVERT_MB = 50;
      MAX_MERGE_MB = clamp(Math.round(RAM_GB * 25), 50, 200);
      MAX_RASTER_MP = clamp(Math.round(RAM_GB * 30), 25, 200);
    }
  });

  // js/pdf.js
  var pdf_exports = {};
  var init_pdf = __esm({
    "js/pdf.js"() {
      init_util();
      try {
        (function() {
          const THUMB_WINDOW = 15;
          let documents = [];
          let docMap = {};
          let busy = false;
          const docList = document.getElementById("docList");
          const btn = document.getElementById("mrExportBtn");
          const mrErr = document.getElementById("mrError");
          function showMrError(msg) {
            if (mrErr) {
              mrErr.textContent = msg;
              mrErr.hidden = false;
            }
          }
          function totalPages() {
            return documents.reduce((n, d) => n + d.pages.length, 0);
          }
          function syncControls() {
            btn.disabled = busy || totalPages() === 0;
            btn.classList.toggle("is-empty", totalPages() === 0);
          }
          function setBusy(value) {
            busy = value;
            setFileToolBusy("mr", value);
            docList.inert = value;
            docList.setAttribute("aria-busy", String(value));
            syncControls();
          }
          function isWindowIndex(i, n) {
            return n <= THUMB_WINDOW * 2 || i < THUMB_WINDOW || i >= n - THUMB_WINDOW;
          }
          function makePageCard(page, windowed, loaded) {
            const card = document.createElement("div");
            card.className = "page-card";
            card.dataset.homeDoc = page.homeDocId;
            card.dataset.pageIdx = page.pageIdx;
            card.dataset.origNum = page.origNum;
            if (windowed) {
              if (loaded) card.dataset.imgSrc = page.imgSrc;
              card.classList.add(loaded ? "has-thumb" : "page-loading");
              card.innerHTML = `
        ${loaded ? `<img src="${page.imgSrc}" alt="Page ${page.origNum}">` : '<img alt="Page ' + page.origNum + '">'}
        <span class="thumb-badge">p.${page.origNum}</span>
        <button type="button" class="thumb-remove" data-action="remove-page" aria-label="Remove page">&times;</button>`;
            } else {
              card.classList.add("page-placeholder");
              card.innerHTML = `
        <span class="page-ellipsis">&hellip;</span>
        <span class="thumb-badge">p.${page.origNum}</span>
        <button type="button" class="thumb-remove" data-action="remove-page" aria-label="Remove page">&times;</button>`;
            }
            return card;
          }
          function renderDoc(doc) {
            const card = document.createElement("div");
            card.className = "doc-card" + (doc.expanded ? " expanded" : "");
            card.dataset.docId = doc.id;
            const head = document.createElement("div");
            head.className = "doc-header";
            head.innerHTML = `
      <span class="doc-toggle" title="Expand / collapse" role="button" aria-label="Expand or collapse">${doc.expanded ? "\u25BE" : "\u25B8"}</span>
      <span class="doc-handle" title="Drag to reorder PDF">&#8942;&#8942;</span>
      <span class="doc-info">
        <p class="doc-name">${escapeHtml(doc.name)}</p>
        <p class="doc-meta">${doc.pages.length} page${doc.pages.length !== 1 ? "s" : ""} &middot; ${formatBytes(doc.size)}</p>
      </span>
      <button type="button" class="icon-btn doc-remove" data-action="remove-doc" aria-label="Remove PDF" title="Remove PDF">&times;</button>`;
            const body = document.createElement("div");
            body.className = "pages";
            body.hidden = !doc.expanded;
            const n = doc.pages.length;
            doc.pages.forEach((p, i) => {
              const windowed = isWindowIndex(i, n);
              body.appendChild(makePageCard(p, windowed, !!p.imgSrc));
            });
            card.appendChild(head);
            card.appendChild(body);
            head.querySelector(".doc-toggle").addEventListener("click", () => toggleDoc(card));
            docList.appendChild(card);
            if (doc.expanded && typeof Sortable !== "undefined") {
              body._sortable = new Sortable(body, { group: "mr-pages", draggable: ".page-card", animation: 150, onEnd: syncFromDOM });
            }
            return card;
          }
          async function generateThumbs(card, doc) {
            const body = card.querySelector(".pages");
            const id = doc.id;
            const n = doc.pages.length;
            for (let i = 0; i < n; i++) {
              if (!isWindowIndex(i, n)) continue;
              const pc = body.children[i];
              if (!pc || !pc.classList.contains("page-loading")) continue;
              const p = doc.pages[i];
              try {
                const pg = await docMap[id].pdfjsDoc.getPage(p.pageIdx + 1);
                const vp = pg.getViewport({ scale: 0.5 });
                const canvas = document.createElement("canvas");
                canvas.width = vp.width;
                canvas.height = vp.height;
                await pg.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
                const url = canvas.toDataURL("image/jpeg", 0.8);
                p.imgSrc = url;
                pc.dataset.imgSrc = url;
                pc.classList.remove("page-loading");
                pc.classList.add("has-thumb");
                const img = pc.querySelector("img");
                if (img) img.src = url;
              } catch (e) {
              }
            }
          }
          function setEmptyState() {
            if (!documents.length) {
              docList.innerHTML = "";
            }
          }
          function syncFromDOM() {
            const next = [];
            docList.querySelectorAll(":scope > .doc-card").forEach((card) => {
              const id = card.dataset.docId;
              const pages = [];
              card.querySelectorAll(".pages .page-card").forEach((pc) => {
                pages.push({
                  homeDocId: pc.dataset.homeDoc,
                  pageIdx: parseInt(pc.dataset.pageIdx, 10),
                  origNum: parseInt(pc.dataset.origNum, 10),
                  imgSrc: pc.dataset.imgSrc || null
                });
              });
              if (!pages.length) {
                card.remove();
                return;
              }
              next.push({ id, name: docMap[id].name, size: docMap[id].size, origCount: docMap[id].numPages, expanded: card.classList.contains("expanded"), pages });
            });
            documents = next;
            documents.forEach((d) => {
              const card = docList.querySelector(`.doc-card[data-doc-id="${d.id}"]`);
              if (card) {
                const meta = card.querySelector(".doc-meta");
                if (meta) meta.textContent = `${d.pages.length} page${d.pages.length !== 1 ? "s" : ""} \xB7 ${formatBytes(d.size)}`;
              }
            });
            syncControls();
            setEmptyState();
          }
          function toggleDoc(card) {
            const id = card.dataset.docId;
            const doc = documents.find((d) => d.id === id);
            if (!doc) return;
            doc.expanded = !doc.expanded;
            card.classList.toggle("expanded", doc.expanded);
            const body = card.querySelector(".pages");
            body.hidden = !doc.expanded;
            card.querySelector(".doc-toggle").textContent = doc.expanded ? "\u25BE" : "\u25B8";
            if (doc.expanded) {
              if (!body._sortable && typeof Sortable !== "undefined") {
                body._sortable = new Sortable(body, { group: "mr-pages", draggable: ".page-card", animation: 150, onEnd: syncFromDOM });
              }
            } else if (body._sortable) {
              body._sortable.destroy();
              body._sortable = null;
            }
          }
          function updateSizePreview() {
            const el = document.getElementById("mrSizePreview");
            const originalTotal = documents.reduce((n, d) => n + d.origCount, 0);
            const multi = documents.length > 1;
            const deleted = totalPages() < originalTotal;
            if (!multi && !deleted) {
              el.hidden = true;
              return;
            }
            el.hidden = false;
            const bytes = documents.reduce((n, d) => n + d.size, 0);
            el.textContent = `Combined size: \u2248 ${formatBytes(bytes)}`;
          }
          docList.addEventListener("click", (e) => {
            const t = e.target.closest("[data-action]");
            if (!t) return;
            if (t.dataset.action === "remove-doc") {
              const card = t.closest(".doc-card");
              const id = card.dataset.docId;
              card.remove();
              delete docMap[id];
              documents = documents.filter((d) => d.id !== id);
              syncControls();
              updateSizePreview();
              setEmptyState();
              return;
            }
            if (t.dataset.action === "remove-page") {
              t.closest(".page-card").remove();
              syncFromDOM();
              updateSizePreview();
            }
          });
          wireDropzone(document.getElementById("mrDropzone"), document.getElementById("mrFileInput"), document.getElementById("mrBrowseBtn"), async (files) => {
            if (busy) return;
            const pdfFiles = Array.from(files).filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
            if (!pdfFiles.length) {
              showMrError("Choose a PDF file to merge or reorder.");
              return;
            }
            if (mrErr) mrErr.hidden = true;
            setBusy(true);
            let completed = 0, added = 0;
            try {
              for (const file of pdfFiles) {
                setToolStatus("mr", `Reading ${file.name}\u2026 (${completed + 1}/${pdfFiles.length})`, { value: completed, max: pdfFiles.length });
                await yieldToBrowser();
                try {
                  const sizeErr = checkFileSize(file, MAX_MERGE_MB);
                  if (sizeErr) throw new Error(sizeErr);
                  const buf = await file.arrayBuffer();
                  const srcPdf = await PDFLib.PDFDocument.load(buf, { ignoreEncryption: true });
                  const pdfjsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
                  const id = "d" + Math.random().toString(36).slice(2);
                  docMap[id] = { srcPdf, pdfjsDoc, numPages: pdfjsDoc.numPages, name: file.name, size: file.size };
                  const pages = [];
                  for (let i = 1; i <= pdfjsDoc.numPages; i++) pages.push({ homeDocId: id, pageIdx: i - 1, origNum: i, imgSrc: null });
                  const docObj = { id, name: file.name, size: file.size, expanded: true, origCount: pdfjsDoc.numPages, pages };
                  documents.push(docObj);
                  const card = renderDoc(docObj);
                  await generateThumbs(card, docObj);
                  added++;
                } catch (e) {
                  showMrError(`Could not add ${file.name}: ${e.message || e}`);
                }
                completed++;
                setToolStatus("mr", `Reading PDFs\u2026 (${completed}/${pdfFiles.length})`, { value: completed, max: pdfFiles.length });
              }
              updateSizePreview();
              if (added) setToolStatus("mr", `${added} PDF${added === 1 ? "" : "s"} Added${added < pdfFiles.length ? `; ${pdfFiles.length - added} Skipped` : ""}`, { state: "success" });
              else setToolStatus("mr");
            } finally {
              setBusy(false);
            }
          });
          const mrMaxEl = document.querySelector("#mrMaxSize .upload-size");
          if (mrMaxEl) mrMaxEl.textContent = `${MAX_MERGE_MB} MB`;
          if (typeof Sortable !== "undefined") {
            new Sortable(docList, { group: "mr-docs", draggable: ".doc-card", handle: ".doc-handle", animation: 150, onEnd: syncFromDOM });
          }
          btn.addEventListener("click", async () => {
            if (busy || !totalPages()) return;
            if (mrErr) mrErr.hidden = true;
            const total = totalPages();
            let completed = 0;
            setBusy(true);
            btn.textContent = "Merging\u2026";
            setToolStatus("mr", `Merging Pages\u2026 (0/${total})`, { value: 0, max: total });
            try {
              await yieldToBrowser();
              const out = await PDFLib.PDFDocument.create();
              for (const d of documents) {
                for (const p of d.pages) {
                  const src = docMap[p.homeDocId].srcPdf;
                  const [copied] = await out.copyPages(src, [p.pageIdx]);
                  out.addPage(copied);
                  completed++;
                  setToolStatus("mr", `Merging Pages\u2026 (${completed}/${total})`, { value: completed, max: total });
                  if (completed % 5 === 0) await yieldToBrowser();
                }
              }
              setToolStatus("mr", "Preparing Download\u2026");
              await yieldToBrowser();
              triggerDownload(new Blob([await out.save()], { type: "application/pdf" }), "merged.pdf");
              setToolStatus("mr", "Download Started", { state: "success" });
            } catch (e) {
              setToolStatus("mr");
              showMrError("Merge failed: " + e.message);
            } finally {
              setBusy(false);
              btn.textContent = "Merge & Download";
            }
          });
          setEmptyState();
          syncControls();
        })();
      } catch (e) {
        console.error("Merge/Reorder failed to init", e);
        throw e;
      }
    }
  });

  // js/converter.js
  var converter_exports = {};
  var init_converter = __esm({
    "js/converter.js"() {
      init_util();
      try {
        (function() {
          let curr = null, sizes = {}, bmpCache = null;
          let fileVersion = 0;
          const info = document.getElementById("cvFileInfo"), acts = document.getElementById("cvActions"), err = document.getElementById("cvError");
          const RASTER = ["png", "jpg", "jpeg", "webp", "bmp", "gif", "ico", "tif", "tiff", "heic", "heif"];
          function clearError() {
            err.hidden = true;
          }
          function showError(msg) {
            err.hidden = false;
            err.textContent = msg;
          }
          function targetsFor(ext) {
            if (RASTER.includes(ext)) return [{ fmt: "png", label: "PNG" }, { fmt: "jpeg", label: "JPEG" }, { fmt: "webp", label: "WEBP" }];
            if (ext === "pdf") return [{ fmt: "md", label: "MD" }, { fmt: "txt", label: "TXT" }];
            if (ext === "txt" || ext === "md") return [{ fmt: "pdf", label: "PDF" }];
            if (ext === "html" || ext === "htm" || ext === "docx") return [{ fmt: "txt", label: "TXT" }, { fmt: "md", label: "MD" }, { fmt: "pdf", label: "PDF" }];
            if (ext === "xlsx") return [{ fmt: "csv", label: "CSV" }, { fmt: "txt", label: "TXT" }];
            if (ext === "pptx") return [{ fmt: "txt", label: "TXT" }, { fmt: "md", label: "MD" }];
            return [];
          }
          async function getBitmap(f) {
            if (bmpCache && bmpCache.file === f) return bmpCache.bmp;
            const ext = getExt(f.name);
            let blob = f;
            if (ext === "heic" || ext === "heif") blob = [].concat(await heic2any({ blob: f, toType: "image/png" }))[0];
            else if (ext === "tif" || ext === "tiff") blob = await tiffToBlob(f);
            const bmp = await createImageBitmap(blob);
            if (curr === f) bmpCache = { file: f, bmp };
            return bmp;
          }
          async function tiffToBlob(f) {
            if (typeof UTIF === "undefined") throw new Error("TIFF support failed to load. Try PNG/JPEG instead.");
            const buf = new Uint8Array(await f.arrayBuffer()), ifds = UTIF.decode(buf);
            UTIF.decodeImage(buf, ifds[0]);
            const rgba = UTIF.toRGBA8(ifds[0]);
            const c = document.createElement("canvas");
            c.width = ifds[0].width;
            c.height = ifds[0].height;
            const ctx = c.getContext("2d"), img = ctx.createImageData(c.width, c.height);
            img.data.set(rgba);
            ctx.putImageData(img, 0, 0);
            return await new Promise((r) => c.toBlob(r, "image/png"));
          }
          async function rasterTo(fmt, f) {
            const bmp = await getBitmap(f), c = document.createElement("canvas");
            c.width = bmp.width;
            c.height = bmp.height;
            const ctx = c.getContext("2d");
            if (fmt === "jpeg") {
              ctx.fillStyle = "#fff";
              ctx.fillRect(0, 0, c.width, c.height);
            }
            ctx.drawImage(bmp, 0, 0);
            const blob = await new Promise((r) => c.toBlob(r, "image/" + fmt, 0.92));
            if (!blob) throw new Error("This browser cannot encode " + fmt.toUpperCase());
            return blob;
          }
          async function pdfPages(f) {
            if (typeof pdfjsLib === "undefined") throw new Error("PDF library failed to load. Check your connection and try again.");
            const doc = await pdfjsLib.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise, pages = [];
            for (let i = 1; i <= doc.numPages; i++) {
              let p = "";
              (await (await doc.getPage(i)).getTextContent()).items.forEach((it) => p += (p && !p.endsWith(" ") ? " " : "") + it.str);
              pages.push(p);
            }
            return pages;
          }
          async function docxHtml(f) {
            if (typeof mammoth === "undefined") throw new Error("DOCX library failed to load. Check your connection and try again.");
            return (await mammoth.convertToHtml({ arrayBuffer: await f.arrayBuffer() })).value;
          }
          async function htmlOf(f, ext) {
            if (ext === "html" || ext === "htm") return await f.text();
            if (ext === "docx") return await docxHtml(f);
            throw new Error("Not an HTML source");
          }
          function stripHtml(html) {
            const d = document.createElement("div");
            d.innerHTML = html;
            d.querySelectorAll("br").forEach((e) => e.replaceWith("\n"));
            d.querySelectorAll("p,div,li,tr,h1,h2,h3,h4,h5,h6,section,article").forEach((e) => {
              e.appendChild(document.createTextNode("\n"));
            });
            return (d.textContent || "").replace(/\n{3,}/g, "\n\n").replace(/[ \t]+\n/g, "\n").trim();
          }
          let _td;
          async function toMd(html) {
            if (!_td) {
              await loadScript("https://cdn.jsdelivr.net/npm/turndown@7.2.0/dist/turndown.min.js");
              _td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-" });
            }
            return _td.turndown(html);
          }
          async function pptxText(f) {
            if (typeof JSZip === "undefined") throw new Error("PPTX library failed to load. Check your connection and try again.");
            const zip = await JSZip.loadAsync(await f.arrayBuffer());
            const slides = Object.keys(zip.files).filter((n) => /ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => +a.match(/slide(\d+)/)[1] - +b.match(/slide(\d+)/)[1]);
            const out = [];
            for (const s of slides) {
              const xml = await zip.files[s].async("string");
              const runs = xml.match(/<a:t>([\s\S]*?)<\/a:t>/g) || [];
              out.push(runs.map((x) => x.replace(/<a:t>|<\/a:t>/g, "")).join(" ").trim());
            }
            return out.map((t, i) => `## Slide ${i + 1}

${t}`).join("\n\n");
          }
          async function xlsxText(f, asCsv) {
            if (typeof XLSX === "undefined") throw new Error("XLSX library failed to load. Check your connection and try again.");
            const wb = XLSX.read(await f.arrayBuffer(), { type: "array" }), out = [];
            wb.SheetNames.forEach((n) => {
              out.push("# " + n);
              XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: "" }).forEach((r) => out.push(r.join(asCsv ? "," : "	")));
            });
            return out.join("\n");
          }
          async function textToPdf(text, baseName) {
            if (typeof PDFLib === "undefined") throw new Error("PDF library failed to load. Check your connection and try again.");
            const doc = await PDFLib.PDFDocument.create(), font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
            const size = 12, lineH = 16, margin = 40, maxW = 595 - margin * 2;
            let page = doc.addPage([595, 842]), y = page.getHeight() - margin, line = "";
            const newPage = () => {
              page = doc.addPage([595, 842]);
              y = page.getHeight() - margin;
            };
            for (const w of text.split(/\s+/)) {
              const test = line ? line + " " + w : w;
              if (font.widthOfTextAtSize(test, size) > maxW) {
                page.drawText(line, { x: margin, y, size, font, maxWidth: maxW, lineHeight: lineH });
                y -= lineH;
                line = w;
                if (y < margin) newPage();
              } else line = test;
            }
            if (line) page.drawText(line, { x: margin, y, size, font, maxWidth: maxW, lineHeight: lineH });
            return new Blob([await doc.save()], { type: "application/pdf" });
          }
          async function produceFromPdf(fmt, f) {
            const pages = await pdfPages(f);
            if (fmt === "md") return new Blob([pages.map((p, i) => `## Page ${i + 1}

${p}`).join("\n\n")], { type: "text/markdown" });
            if (fmt === "txt") return new Blob([pages.map((p, i) => `Page ${i}
${"-".repeat(20)}
${p}`).join("\n\n")], { type: "text/plain" });
            throw new Error("Unsupported conversion");
          }
          async function produceFromText(fmt, f) {
            if (fmt !== "pdf") throw new Error("Unsupported conversion");
            return textToPdf(await f.text(), f.name);
          }
          async function produceFromHtml(fmt, f) {
            const ext = getExt(f.name);
            const html = await htmlOf(f, ext);
            if (fmt === "txt") return new Blob([stripHtml(html)], { type: "text/plain" });
            if (fmt === "md") return new Blob([await toMd(html)], { type: "text/markdown" });
            if (fmt === "pdf") return textToPdf(stripHtml(html), f.name);
            throw new Error("Unsupported conversion");
          }
          async function produceFromXlsx(fmt, f) {
            if (fmt === "csv") return new Blob([await xlsxText(f, true)], { type: "text/csv" });
            if (fmt === "txt") return new Blob([await xlsxText(f, false)], { type: "text/plain" });
            throw new Error("Unsupported conversion");
          }
          async function produceFromPptx(fmt, f) {
            const txt = await pptxText(f);
            if (fmt === "txt") return new Blob([txt], { type: "text/plain" });
            if (fmt === "md") return new Blob([txt], { type: "text/markdown" });
            if (fmt === "pdf") return textToPdf(txt, f.name);
            throw new Error("Unsupported conversion");
          }
          async function produce(fmt, f) {
            const ext = getExt(f.name);
            if (RASTER.includes(ext)) return rasterTo(fmt, f);
            if (ext === "pdf") return produceFromPdf(fmt, f);
            if (ext === "txt" || ext === "md") return produceFromText(fmt, f);
            if (ext === "html" || ext === "htm" || ext === "docx") return produceFromHtml(fmt, f);
            if (ext === "xlsx") return produceFromXlsx(fmt, f);
            if (ext === "pptx") return produceFromPptx(fmt, f);
            throw new Error("Unsupported conversion");
          }
          const EXT = { jpeg: "jpg", png: "png", webp: "webp", md: "md", txt: "txt", pdf: "pdf", csv: "csv" };
          async function setFile(f) {
            const version = ++fileVersion;
            curr = f;
            sizes = {};
            bmpCache = null;
            clearError();
            acts.innerHTML = "";
            setToolStatus("cv");
            if (!f) {
              info.hidden = true;
              setFileToolBusy("cv", false);
              return;
            }
            setFileToolBusy("cv", true);
            try {
              const sizeErr = checkFileSize(f, MAX_CONVERT_MB);
              if (sizeErr) {
                showError(sizeErr);
                info.hidden = true;
                curr = null;
                return;
              }
              info.hidden = false;
              document.getElementById("cvFileName").textContent = f.name;
              document.getElementById("cvFileMeta").textContent = formatBytes(f.size);
              setToolStatus("cv", `Reading ${f.name}\u2026`);
              await yieldToBrowser();
              if (version !== fileVersion) return;
              let ext = getExt(f.name);
              if (!targetsFor(ext).length) {
                const head = (await f.slice(0, 512).text()).trim().toLowerCase();
                if (/^<!doctype html|<html|<\?xml/.test(head)) ext = "html";
              }
              if (version !== fileVersion) return;
              const targets = targetsFor(ext);
              if (!targets.length) {
                showError("Unsupported file type" + (ext ? ` (.${ext})` : "") + ".");
                return;
              }
              if (RASTER.includes(ext)) {
                const bmp = await getBitmap(f);
                if (version !== fileVersion) return;
                const px = bmp.width * bmp.height, maxPx = MAX_RASTER_MP * 1e6;
                if (px > maxPx) {
                  const width = bmp.width, height = bmp.height;
                  bmp.close();
                  bmpCache = null;
                  curr = null;
                  showError(`Image is ${width}\xD7${height} (${(px / 1e6).toFixed(0)} MP) \u2014 the limit for this tool is ${MAX_RASTER_MP} MP. Try a smaller or lower-resolution image.`);
                  return;
                }
              }
              let completed = 0, successful = 0;
              acts.innerHTML = targets.map((t) => `<button class="format-btn calcing" data-fmt="${t.fmt}" disabled>${t.label}<span class="fmt-size">\u2026</span></button>`).join("");
              setToolStatus("cv", `Preparing Formats\u2026 (0/${targets.length})`, { value: 0, max: targets.length });
              await yieldToBrowser();
              if (version !== fileVersion) return;
              await Promise.all(targets.map(async (t) => {
                const btn = acts.querySelector(`.format-btn[data-fmt="${t.fmt}"]`);
                try {
                  const blob = await produce(t.fmt, f);
                  if (version !== fileVersion) return;
                  sizes[t.fmt] = blob;
                  btn.querySelector(".fmt-size").textContent = " \xB7 " + formatBytes(blob.size);
                  successful++;
                } catch (e) {
                  if (version !== fileVersion) return;
                  btn.querySelector(".fmt-size").textContent = " \xB7 n/a";
                  btn.classList.add("failed");
                  btn.title = e.message || "This format could not be prepared.";
                } finally {
                  if (version === fileVersion) {
                    completed++;
                    btn.classList.remove("calcing");
                    setToolStatus("cv", `Preparing Formats\u2026 (${completed}/${targets.length})`, { value: completed, max: targets.length });
                  }
                }
              }));
              if (version !== fileVersion) return;
              acts.querySelectorAll(".format-btn:not(.failed)").forEach((btn) => btn.disabled = false);
              if (successful) setToolStatus("cv", targets.length === 1 ? "Format Ready to Download" : `${successful} of ${targets.length} Formats Ready to Download`, { state: "success" });
              else {
                setToolStatus("cv");
                showError("Could not prepare this file. Try another file or format.");
              }
            } catch (e) {
              if (version === fileVersion) {
                setToolStatus("cv");
                acts.innerHTML = "";
                curr = null;
                showError("Could not read this file: " + (e.message || e));
              }
            } finally {
              if (version === fileVersion) {
                if (!err.hidden) setToolStatus("cv");
                setFileToolBusy("cv", false);
              }
            }
          }
          wireDropzone(document.getElementById("cvDropzone"), document.getElementById("cvFileInput"), document.getElementById("cvBrowseBtn"), (files) => setFile(files[0]));
          const cvMaxEl = document.querySelector("#cvMaxSize .upload-size");
          if (cvMaxEl) cvMaxEl.textContent = `${MAX_CONVERT_MB} MB`;
          document.getElementById("cvClearBtn").addEventListener("click", () => setFile(null));
          acts.addEventListener("click", async (e) => {
            const btn = e.target.closest(".format-btn");
            if (!btn || btn.disabled || !curr) return;
            const version = fileVersion, file = curr;
            const fmt = btn.dataset.fmt, base = file.name.replace(/\.[^.]+$/, "");
            clearError();
            setFileToolBusy("cv", true);
            setToolStatus("cv", "Preparing Download\u2026");
            acts.querySelectorAll(".format-btn").forEach((button) => button.disabled = true);
            btn.classList.add("calcing");
            try {
              await yieldToBrowser();
              if (version !== fileVersion) return;
              const blob = sizes[fmt] || await produce(fmt, file);
              if (version !== fileVersion) return;
              triggerDownload(blob, `${base}.${EXT[fmt] || fmt}`);
              setToolStatus("cv", "Download Started", { state: "success" });
            } catch (er) {
              if (version === fileVersion) {
                setToolStatus("cv");
                showError("Conversion error: " + er.message);
              }
            } finally {
              if (version === fileVersion) {
                setFileToolBusy("cv", false);
                acts.querySelectorAll(".format-btn:not(.failed)").forEach((button) => button.disabled = false);
                btn.classList.remove("calcing");
              }
            }
          });
        })();
      } catch (e) {
        console.error("Convert files failed to init", e);
        throw e;
      }
    }
  });

  // js/speed.js
  var require_speed = __commonJS({
    "js/speed.js"() {
      (async function() {
        const { default: SpeedTest } = await import("https://cdn.jsdelivr.net/npm/@cloudflare/speedtest/+esm");
        const canvas = document.getElementById("speedCanvas");
        const ctx = canvas.getContext("2d");
        const pEl = document.getElementById("speedPing");
        const dEl = document.getElementById("speedDown");
        const uEl = document.getElementById("speedUp");
        const speedPhase = document.getElementById("speedPhase");
        const runBtn = document.getElementById("speedRunBtn");
        const noteEl = document.getElementById("speedNote");
        const COL_DOWN = "#2374AB", COL_UP = "#2AA67A", COL_PING = "#D98E32";
        pEl.style.color = COL_PING;
        dEl.style.color = COL_DOWN;
        uEl.style.color = COL_UP;
        const PHASE_DURATION_MS = 1e4;
        let colBorder, colMuted;
        function cacheColors() {
          const s = getComputedStyle(document.documentElement);
          colBorder = s.getPropertyValue("--border").trim();
          colMuted = s.getPropertyValue("--muted").trim();
        }
        cacheColors();
        new MutationObserver(cacheColors).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
        let downData = [], upData = [];
        let testStart = 0, upStart = 0;
        let downTarg = 0, downCur = 0, downVel = 0;
        let upTarg = 0, upCur = 0, upVel = 0;
        let testRunning = false;
        let finishing = false;
        let aborted = false;
        let phase = "ping";
        let cachedSize = null;
        function ease(cur, targ, vel) {
          vel = (vel + (targ - cur) * 0.14) * 0.72;
          return [cur + vel, vel];
        }
        function sizeCanvas() {
          const dpr = window.devicePixelRatio || 1;
          const rect = canvas.getBoundingClientRect();
          if (!rect.width || !rect.height) return null;
          if (cachedSize && cachedSize.w === rect.width && cachedSize.h === rect.height) return cachedSize;
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          cachedSize = { w: rect.width, h: rect.height };
          return cachedSize;
        }
        function niceStep(range, target) {
          if (range <= 0) return 1;
          const rough = range / target;
          const mag = Math.pow(10, Math.floor(Math.log10(rough)));
          const n = rough / mag;
          return (n <= 1.5 ? 1 : n <= 3 ? 2 : n <= 7 ? 5 : 10) * mag;
        }
        function draw() {
          const sz = sizeCanvas();
          if (!sz) return;
          const { w, h } = sz;
          const pad = { top: 12, right: 16, bottom: 28, left: 46 };
          const pw = w - pad.left - pad.right;
          const ph = h - pad.top - pad.bottom;
          ctx.clearRect(0, 0, w, h);
          const maxT = 10;
          let maxSpeed = 10;
          for (const p of downData) if (p.v > maxSpeed) maxSpeed = p.v;
          for (const p of upData) if (p.v > maxSpeed) maxSpeed = p.v;
          maxSpeed = Math.max(maxSpeed * 1.2, 10);
          const yStep = niceStep(maxSpeed, 4);
          const xStep = niceStep(maxT, 5);
          ctx.font = `10px ${getComputedStyle(canvas).fontFamily}`;
          ctx.fillStyle = colMuted;
          ctx.textAlign = "right";
          ctx.textBaseline = "middle";
          for (let v = 0; v <= maxSpeed; v += yStep) {
            const y = pad.top + ph - v / maxSpeed * ph;
            ctx.strokeStyle = colBorder;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(pad.left + pw, y);
            ctx.stroke();
            ctx.fillText(v === Math.round(v) ? "" + v : v.toFixed(1), pad.left - 6, y);
          }
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          for (let t = 0; t <= maxT; t += xStep) {
            const x = pad.left + t / maxT * pw;
            ctx.strokeStyle = colBorder;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, pad.top);
            ctx.lineTo(x, pad.top + ph);
            ctx.stroke();
            ctx.fillText(t + "s", x, pad.top + ph + 6);
          }
          function plotLine(data, color) {
            if (data.length === 0) return;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.beginPath();
            for (let i = 0; i < data.length; i++) {
              const x = pad.left + data[i].t / maxT * pw;
              const y = pad.top + ph - data[i].v / maxSpeed * ph;
              i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
            const last = data[data.length - 1];
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(pad.left + last.t / maxT * pw, pad.top + ph - last.v / maxSpeed * ph, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
          plotLine(downData, COL_DOWN);
          plotLine(upData, COL_UP);
        }
        function tick() {
          if (!testRunning) return;
          [downCur, downVel] = ease(downCur, downTarg, downVel);
          [upCur, upVel] = ease(upCur, upTarg, upVel);
          const t = Math.min((performance.now() - testStart) / 1e3, 10);
          const upT = upStart ? Math.min((performance.now() - upStart) / 1e3, 10) : 0;
          if (finishing) {
            upData.push({ t: upT, v: Math.max(0, upCur) });
          } else if (phase === "down") {
            downData.push({ t, v: Math.max(0, downCur) });
          } else if (phase === "up") {
            upData.push({ t: upT, v: Math.max(0, upCur) });
          }
          dEl.textContent = downCur > 0.05 || downTarg > 0.05 ? Math.max(0, downCur).toFixed(1) + " Mbps" : "\u2014";
          uEl.textContent = upCur > 0.05 || upTarg > 0.05 ? Math.max(0, upCur).toFixed(1) + " Mbps" : "\u2014";
          draw();
          if (finishing) {
            const dClose = Math.abs(downCur - downTarg) < 0.2;
            const uClose = upTarg <= 0 || Math.abs(upCur - upTarg) < 0.2;
            if (dClose && uClose) {
              downCur = downTarg;
              upCur = upTarg;
              dEl.textContent = downTarg > 0 ? downTarg.toFixed(1) + " Mbps" : "\u2014";
              uEl.textContent = upTarg > 0 ? upTarg.toFixed(1) + " Mbps" : "\u2014";
              testRunning = false;
              finishing = false;
              speedPhase.textContent = "Test Complete";
              runBtn.disabled = false;
              runBtn.textContent = "Run Again";
              draw();
              return;
            }
          }
          requestAnimationFrame(tick);
        }
        function resetAll() {
          downData = [];
          upData = [];
          downTarg = downCur = downVel = 0;
          upTarg = upCur = upVel = 0;
          finishing = false;
          upStart = 0;
          phase = "ping";
          testStart = performance.now();
          pEl.textContent = "\u2014";
          dEl.textContent = "\u2014";
          uEl.textContent = "\u2014";
          draw();
        }
        async function runTimedTransferTest(durationMs, chunkBytes, direction, onSpeedUpdate, concurrency = 6) {
          let totalBytes = 0;
          let stopped = false;
          const start = performance.now();
          let lastReportBytes = 0;
          let lastReportTime = start;
          const worker = async () => {
            while (!stopped && !aborted) {
              const remaining = durationMs - (performance.now() - start);
              if (remaining <= 0) break;
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), Math.min(remaining, 5e3));
              try {
                if (direction === "down") {
                  const resp = await fetch(`https://speed.cloudflare.com/__down?bytes=${chunkBytes}`, {
                    cache: "no-store",
                    signal: controller.signal
                  });
                  const blob = await resp.blob();
                  totalBytes += blob.size;
                } else {
                  await fetch("https://speed.cloudflare.com/__up", {
                    method: "POST",
                    body: new Blob([new Uint8Array(chunkBytes)]),
                    cache: "no-store",
                    signal: controller.signal
                  });
                  totalBytes += chunkBytes;
                }
              } catch (e) {
                if (e.name !== "AbortError") break;
              } finally {
                clearTimeout(timeout);
              }
            }
          };
          const workers = Array.from({ length: concurrency }, worker);
          while (!stopped && !aborted && performance.now() - start < durationMs) {
            await new Promise((r) => setTimeout(r, 250));
            const now = performance.now();
            const elapsed2 = (now - lastReportTime) / 1e3;
            if (elapsed2 >= 0.5) {
              onSpeedUpdate((totalBytes - lastReportBytes) * 8 / 1e6 / elapsed2);
              lastReportBytes = totalBytes;
              lastReportTime = now;
            }
          }
          stopped = true;
          await Promise.all(workers);
          const elapsed = (performance.now() - start) / 1e3;
          return elapsed > 0 ? totalBytes * 8 / 1e6 / elapsed : 0;
        }
        const runDownloadTest = (durationMs, onSpeedUpdate) => runTimedTransferTest(durationMs, 1e7, "down", onSpeedUpdate, 6);
        const runUploadTest = (durationMs, onSpeedUpdate) => runTimedTransferTest(durationMs, 1e6, "up", onSpeedUpdate, 4);
        async function measurePingFallback() {
          try {
            const t0 = performance.now();
            await fetch("https://cloudflare.com/cdn-cgi/trace", { mode: "no-cors", cache: "no-store" });
            pEl.textContent = Math.round(performance.now() - t0) + " ms";
          } catch (e) {
            pEl.textContent = "\u2014";
          }
        }
        async function measureLatency() {
          pEl.textContent = "...";
          await new Promise((resolve) => {
            try {
              const test = new SpeedTest({ measurements: [{ type: "latency", numPackets: 20 }] });
              test.onFinish = (results) => {
                const latency = results.getSummary().latency;
                pEl.textContent = latency != null ? Math.round(latency) + " ms" : "\u2014";
                resolve();
              };
              test.onError = () => {
                measurePingFallback().then(resolve);
              };
            } catch (e) {
              measurePingFallback().then(resolve);
            }
          });
        }
        async function runFullTest() {
          speedPhase.textContent = "Testing Ping...";
          await measureLatency();
          if (aborted) return;
          phase = "down";
          testStart = performance.now();
          speedPhase.textContent = "Testing Download...";
          const downMbps = await runDownloadTest(PHASE_DURATION_MS, (speed) => {
            downTarg = speed;
          });
          if (aborted) return;
          downTarg = downMbps > 0 ? downMbps : 0;
          if (!downData.length || downData[downData.length - 1].t < 10) {
            downData.push({ t: 10, v: downTarg });
          }
          phase = "up";
          upStart = performance.now();
          speedPhase.textContent = "Testing Upload...";
          const upMbps = await runUploadTest(PHASE_DURATION_MS, (speed) => {
            upTarg = speed;
          });
          if (aborted) return;
          upTarg = upMbps > 0 ? upMbps : 0;
          finishing = true;
          if (downTarg <= 0 && upTarg <= 0) {
            noteEl.hidden = false;
            noteEl.textContent = "Test unavailable. Check network restrictions.";
          } else if (upTarg <= 0) {
            noteEl.hidden = false;
            noteEl.textContent = "Limited test \u2014 upload speed isn\u2019t measurable in this environment.";
          }
        }
        runBtn.addEventListener("click", function() {
          if (testRunning) {
            aborted = true;
            testRunning = false;
            finishing = false;
            this.textContent = "Start Test";
            speedPhase.textContent = "Test Stopped";
            return;
          }
          aborted = false;
          this.textContent = "Stop";
          testRunning = true;
          resetAll();
          noteEl.hidden = true;
          speedPhase.textContent = "Testing Ping...";
          requestAnimationFrame(tick);
          runFullTest();
        });
        window.addEventListener("resize", () => {
          cachedSize = null;
          draw();
        });
        document.addEventListener("fullscreenchange", () => {
          cachedSize = null;
          draw();
        });
        requestAnimationFrame(() => draw());
        if ("IntersectionObserver" in window) {
          new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) {
              cachedSize = null;
              draw();
            }
          }).observe(canvas);
        }
      })();
    }
  });

  // js/units.js
  try {
    (function() {
      const catNames = { length: "length", mass: "weight", temp: "temperature", time: "time", currency: "currency", volume: "volume" };
      const unitDB = {
        meter: { cat: "length", factor: 1, names: ["m", "meter", "meters", "metre", "metres"], display: "meters" },
        kilometer: { cat: "length", factor: 1e3, names: ["km", "kilometer", "kilometers", "k"], display: "kilometers" },
        centimeter: { cat: "length", factor: 0.01, names: ["cm", "centimeter", "centimeters"], display: "centimeters" },
        millimeter: { cat: "length", factor: 1e-3, names: ["mm", "millimeter", "millimeters"], display: "millimeters" },
        mile: { cat: "length", factor: 1609.344, names: ["mi", "mile", "miles"], display: "miles" },
        yard: { cat: "length", factor: 0.9144, names: ["yd", "yard", "yards"], display: "yards" },
        foot: { cat: "length", factor: 0.3048, names: ["ft", "foot", "feet"], display: "feet" },
        inch: { cat: "length", factor: 0.0254, names: ["in", "inch", "inches"], display: "inches" },
        lightyear: { cat: "length", factor: 9460730472580800, names: ["ly", "lightyear", "lightyears", "light year", "light years"], display: "lightyears" },
        gram: { cat: "mass", factor: 1, names: ["g", "gram", "grams"], display: "grams" },
        kilogram: { cat: "mass", factor: 1e3, names: ["kg", "kilogram", "kilograms", "kilo", "kilos"], display: "kilograms" },
        pound: { cat: "mass", factor: 453.59237, names: ["lb", "lbs", "pound", "pounds"], display: "pounds" },
        ounce: { cat: "mass", factor: 28.34952, names: ["oz", "ounce", "ounces"], display: "ounces" },
        liter: { cat: "volume", factor: 1, names: ["l", "liter", "liters", "litre", "litres"], display: "liters" },
        milliliter: { cat: "volume", factor: 1e-3, names: ["ml", "milliliter", "milliliters", "millilitre", "millilitres"], display: "milliliters" },
        gallon: { cat: "volume", factor: 3.78541, names: ["gal", "gallon", "gallons"], display: "gallons" },
        celsius: { cat: "temp", names: ["c", "celsius"], display: "\xB0C" },
        fahrenheit: { cat: "temp", names: ["f", "fahrenheit"], display: "\xB0F" },
        kelvin: { cat: "temp", names: ["k", "kelvin"], display: "K" },
        second: { cat: "time", factor: 1, names: ["s", "sec", "second", "seconds"], display: "seconds" },
        minute: { cat: "time", factor: 60, names: ["min", "minute", "minutes"], display: "minutes" },
        hour: { cat: "time", factor: 3600, names: ["h", "hr", "hour", "hours"], display: "hours" },
        day: { cat: "time", factor: 86400, names: ["d", "day", "days"], display: "days" },
        usd: { cat: "currency", factor: 1, names: ["usd", "$", "dollar", "dollars", "us", "american", "america", "united states"], display: "USD" },
        eur: { cat: "currency", factor: 1.09, names: ["eur", "\u20AC", "euro", "euros", "eu", "european", "europe"], display: "EUR" },
        gbp: { cat: "currency", factor: 1.34, names: ["gbp", "\xA3", "pound", "pounds", "uk", "british", "britain", "england", "english"], display: "GBP" }
      };
      const numIn = document.getElementById("num-in");
      const numMeasure = document.getElementById("num-measure");
      const resultDisplay = document.getElementById("result-display");
      const historyContainer = document.getElementById("history-container");
      const srcState = { input: document.getElementById("src-in"), ghost: document.getElementById("src-ghost"), measure: document.getElementById("src-measure"), query: "", matches: [], selectedIdx: 0, acceptedUnit: null };
      const destState = { input: document.getElementById("dest-in"), ghost: document.getElementById("dest-ghost"), measure: document.getElementById("dest-measure"), query: "", matches: [], selectedIdx: 0, acceptedUnit: null };
      updateMeasure(numIn, numMeasure, null);
      updateUI(srcState);
      updateUI(destState);
      function findMatches(query) {
        if (!query) return [];
        let results = [];
        for (const [unitId, data] of Object.entries(unitDB)) {
          for (const name of data.names) if (name.startsWith(query.toLowerCase())) results.push({ unitId, matchStr: name, cat: data.cat });
        }
        return results.sort((a, b) => a.matchStr.length - b.matchStr.length || a.matchStr.localeCompare(b.matchStr));
      }
      function updateMeasure(inputEl, measureEl, fullText) {
        measureEl.textContent = fullText || inputEl.value || (inputEl.id === "num-in" ? "0" : "unit");
      }
      function updateUI(state) {
        let typed = state.query || "", remainder = "", placeholderText = "unit";
        if (state.matches.length > 0 && typed) {
          remainder = state.matches[state.selectedIdx].matchStr.substring(typed.length);
        } else if (!typed && state === destState && srcState.acceptedUnit) {
          remainder = getDefaultDestAbbrev(srcState.acceptedUnit, unitDB[srcState.acceptedUnit].cat);
        }
        state.ghost.innerHTML = !typed && !remainder ? `<span style="color: var(--border)">${placeholderText}</span>` : `<span style="color: var(--text)">${typed}</span><span style="color: var(--ghost)">${remainder}</span>`;
        updateMeasure(state.input, state.measure, typed + remainder || placeholderText);
      }
      function acceptCompletion(state, autoAdvanceTo) {
        let accepted = null;
        if (state.matches.length > 0) {
          accepted = state.matches[state.selectedIdx];
          state.acceptedUnit = accepted.unitId;
          state.input.value = accepted.matchStr;
          state.query = accepted.matchStr;
        } else if (state === destState && !state.query && srcState.acceptedUnit) {
          const matches = findMatches(getDefaultDestAbbrev(srcState.acceptedUnit, unitDB[srcState.acceptedUnit].cat));
          if (matches.length > 0) {
            accepted = matches[0];
            state.acceptedUnit = accepted.unitId;
            state.input.value = accepted.matchStr;
            state.query = accepted.matchStr;
          }
        } else if (state.acceptedUnit) {
          accepted = { unitId: state.acceptedUnit, cat: unitDB[state.acceptedUnit].cat };
        }
        state.matches = [];
        updateUI(state);
        if (autoAdvanceTo) autoAdvanceTo.focus();
        return accepted;
      }
      const defaultDestinations = {
        mass: { srcToDest: { pound: "kg", ounce: "kg", stone: "kg" }, default: "lb" },
        length: { srcToDest: { foot: "m", inch: "m", mile: "m", yard: "m" }, default: "ft" },
        temp: { srcToDest: { celsius: "f" }, default: "c" },
        time: { srcToDest: { minute: "h", millisecond: "h" }, default: "min" },
        currency: { srcToDest: { usd: "eur" }, default: "usd" },
        volume: { srcToDest: { gallon: "l", cup: "l" }, default: "gal" }
      };
      function getDefaultDestAbbrev(srcUnitId, cat) {
        const cfg = defaultDestinations[cat];
        return cfg ? cfg.srcToDest[srcUnitId] || cfg.default : "m";
      }
      function handleUnitInputEvent(e, state) {
        let val = state.input.value;
        if (state === srcState) {
          const lowerVal = val.toLowerCase();
          if (lowerVal.endsWith("to") || lowerVal.endsWith(" to")) {
            const prefix = val.slice(0, -(lowerVal.endsWith(" to") ? 3 : 2)).trim();
            if (prefix.length > 0 && findMatches(prefix).length > 0) {
              state.input.value = prefix;
              state.query = prefix;
              state.matches = findMatches(prefix);
              state.selectedIdx = 0;
              const accepted = acceptCompletion(state, destState.input);
              if (accepted) {
                if (destState.acceptedUnit && unitDB[destState.acceptedUnit].cat !== accepted.cat) {
                  destState.input.value = "";
                  destState.query = "";
                  destState.acceptedUnit = null;
                }
              }
              calculate();
              return;
            }
          }
        }
        state.query = val;
        state.acceptedUnit = null;
        state.matches = findMatches(state.query);
        state.selectedIdx = 0;
        updateUI(state);
        calculate();
      }
      function handleUnitKeydown(e, state, nextEl, prevEl, isDest) {
        if (e.key === "Tab" || e.key === "Enter" || e.key === " ") {
          if (isDest && (e.key === "Enter" || e.key === "Tab")) {
            e.preventDefault();
            acceptCompletion(state, nextEl);
            calculate();
            commitToHistory();
            return;
          }
          e.preventDefault();
          const accepted = acceptCompletion(state, nextEl);
          if (!isDest && accepted) {
            if (destState.acceptedUnit && unitDB[destState.acceptedUnit].cat !== accepted.cat) {
              destState.input.value = "";
              destState.query = "";
              destState.acceptedUnit = null;
            }
          }
          calculate();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          if (state.matches.length > 0) {
            state.selectedIdx = (state.selectedIdx + 1) % state.matches.length;
            updateUI(state);
            calculate();
          }
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          if (state.matches.length > 0) {
            state.selectedIdx = (state.selectedIdx - 1 + state.matches.length) % state.matches.length;
            updateUI(state);
            calculate();
          }
        } else if (e.key === "Backspace" && state.input.value === "") {
          e.preventDefault();
          if (prevEl) prevEl.focus();
        }
      }
      function doMath(val, srcUnitId, destUnitId) {
        const src = unitDB[srcUnitId], dest = unitDB[destUnitId];
        if (src.cat === "temp") {
          let c = val;
          if (srcUnitId === "fahrenheit") c = (val - 32) * 5 / 9;
          else if (srcUnitId === "kelvin") c = val - 273.15;
          if (destUnitId === "celsius") return c;
          if (destUnitId === "fahrenheit") return c * 9 / 5 + 32;
          if (destUnitId === "kelvin") return c + 273.15;
        }
        return val * (src.factor / dest.factor);
      }
      function calculate() {
        resultDisplay.classList.remove("error", "preview", "show", "bounce");
        const val = parseFloat(numIn.value);
        let srcUnitId = srcState.acceptedUnit;
        if (!srcUnitId && srcState.matches.length > 0) srcUnitId = srcState.matches[srcState.selectedIdx].unitId;
        if (isNaN(val) || !srcUnitId) return;
        let destUnitId = destState.acceptedUnit, isPreview = !srcState.acceptedUnit || !destState.acceptedUnit;
        if (!destUnitId) {
          if (destState.matches.length > 0) {
            destUnitId = destState.matches[destState.selectedIdx].unitId;
            isPreview = true;
          } else if (destState.query === "") {
            destUnitId = findMatches(getDefaultDestAbbrev(srcUnitId, unitDB[srcUnitId].cat))[0]?.unitId;
            isPreview = true;
          } else return;
        }
        if (!destUnitId || unitDB[srcUnitId].cat !== unitDB[destUnitId].cat) return;
        const outVal = doMath(val, srcUnitId, destUnitId), formatted = outVal < 1e-6 || outVal > 999999999 ? outVal.toExponential(4) : parseFloat(outVal.toPrecision(8)).toString();
        resultDisplay.textContent = `${formatted} ${unitDB[destUnitId].display}`;
        if (isPreview) resultDisplay.classList.add("preview");
        resultDisplay.classList.add("show");
      }
      function commitToHistory() {
        const val = parseFloat(numIn.value);
        if (isNaN(val) || !srcState.acceptedUnit || !destState.acceptedUnit) return;
        const src = unitDB[srcState.acceptedUnit], dest = unitDB[destState.acceptedUnit];
        if (src.cat !== dest.cat) {
          resultDisplay.classList.remove("preview");
          resultDisplay.textContent = `Hmm, mismatched categories.`;
          resultDisplay.classList.add("error", "show", "bounce");
          return;
        }
        const outVal = doMath(val, srcState.acceptedUnit, destState.acceptedUnit), formatted = outVal < 1e-6 || outVal > 999999999 ? outVal.toExponential(4) : parseFloat(outVal.toPrecision(8)).toString();
        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `<span class="src-part">${numIn.value} ${srcState.input.value}</span><span class="equals">=</span><span class="dest-part">${formatted} ${destState.input.value}</span>`;
        historyContainer.prepend(item);
        numIn.value = "";
        srcState.input.value = "";
        destState.input.value = "";
        srcState.query = "";
        destState.query = "";
        srcState.acceptedUnit = null;
        destState.acceptedUnit = null;
        updateUI(srcState);
        updateUI(destState);
        updateMeasure(numIn, numMeasure, null);
        numIn.focus();
        resultDisplay.classList.remove("preview");
        resultDisplay.classList.add("bounce");
        setTimeout(() => {
          resultDisplay.classList.remove("bounce");
          calculate();
        }, 400);
      }
      numIn.addEventListener("input", () => {
        let match = numIn.value.match(/^([-0-9.]+)([a-zA-Z$€£¥₹]+)$/);
        if (match) {
          numIn.value = match[1];
          srcState.input.value = match[2];
          srcState.query = match[2];
          srcState.matches = findMatches(srcState.query);
          srcState.input.focus();
          updateUI(srcState);
        }
        updateMeasure(numIn, numMeasure, null);
        calculate();
      });
      numIn.addEventListener("keydown", (e) => {
        if (e.key === "Tab" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (numIn.value) srcState.input.focus();
        }
      });
      srcState.input.addEventListener("input", (e) => handleUnitInputEvent(e, srcState));
      srcState.input.addEventListener("keydown", (e) => handleUnitKeydown(e, srcState, destState.input, numIn, false));
      destState.input.addEventListener("input", (e) => handleUnitInputEvent(e, destState));
      destState.input.addEventListener("keydown", (e) => handleUnitKeydown(e, destState, null, srcState.input, true));
    })();
  } catch (e) {
    console.error("Units converter failed to init", e);
  }

  // js/clock.js
  init_util();
  try {
    (function() {
      const big = document.getElementById("clockBig");
      const zoneEl = document.getElementById("clockZone");
      const worldEl = document.getElementById("clockWorld");
      const tabClock = document.getElementById("tab-clock");
      const z = [{ l: "New York", t: "America/New_York" }, { l: "London", t: "Europe/London" }, { l: "Delhi", t: "Asia/Kolkata" }, { l: "Tokyo", t: "Asia/Tokyo" }];
      let localZoneLabel = "";
      try {
        localZoneLabel = Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop().replace(/_/g, " ");
      } catch (e) {
      }
      const tipCtrl = createFsTipController(document.getElementById("clockFsTip"));
      let enlarged = null;
      function tk() {
        const d = /* @__PURE__ */ new Date();
        if (enlarged) {
          const parts = d.toLocaleTimeString("en-US", { timeZone: enlarged.t, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).split(" ");
          big.innerHTML = parts[0] + '<span class="ampm">' + (parts[1] || "") + "</span>";
          zoneEl.textContent = enlarged.l;
        } else {
          const h = d.getHours();
          big.innerHTML = String(h % 12 || 12).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") + ":" + String(d.getSeconds()).padStart(2, "0") + '<span class="ampm">' + (h >= 12 ? "PM" : "AM") + "</span>";
          zoneEl.textContent = localZoneLabel;
        }
        document.getElementById("clockDate").textContent = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
        worldEl.innerHTML = z.map((x, i) => `<div class="world-chip" data-idx="${i}" title="Click to enlarge"><span class="world-time">${d.toLocaleTimeString("en-US", { timeZone: x.t, hour: "2-digit", minute: "2-digit", hour12: true })}</span><span class="world-label">${x.l}</span></div>`).join("");
      }
      tk();
      setInterval(tk, 1e3);
      tipCtrl.show();
      big.addEventListener("click", (e) => {
        e.stopPropagation();
        if (document.fullscreenElement) return;
        tipCtrl.hide();
        if (tabClock.classList.contains("simple-mode")) {
          tabClock.classList.remove("simple-mode");
        } else {
          tabClock.classList.add("simple-mode");
        }
        enlarged = null;
        tk();
      });
      tabClock.addEventListener("click", (e) => {
        if (tabClock.classList.contains("simple-mode") && e.target !== big && !e.target.closest(".world-chip") && !e.target.closest(".time-controls")) {
          tabClock.classList.remove("simple-mode");
          enlarged = null;
          tk();
        }
      });
      worldEl.addEventListener("click", (e) => {
        const chip = e.target.closest(".world-chip");
        if (!chip) return;
        enlarged = z[parseInt(chip.dataset.idx, 10)];
        tabClock.classList.add("simple-mode");
        tk();
      });
    })();
  } catch (e) {
    console.error("Clock failed to init", e);
  }

  // js/audio.js
  var audioCtx;
  var isMuted = false;
  document.querySelectorAll(".muteToggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      isMuted = !isMuted;
      document.querySelectorAll(".muteToggle").forEach((b) => b.classList.toggle("muted", isMuted));
      document.querySelectorAll(".icon-unmuted").forEach((el) => {
        isMuted ? el.setAttribute("hidden", "") : el.removeAttribute("hidden");
      });
      document.querySelectorAll(".icon-muted").forEach((el) => {
        !isMuted ? el.setAttribute("hidden", "") : el.removeAttribute("hidden");
      });
    });
  });
  function ensureAudioContext() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }
  function playBeep() {
    if (isMuted) return;
    const ctx = ensureAudioContext();
    const playOsc = (freq, time, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + time);
      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + dur);
    };
    playOsc(880, 0, 0.2);
    playOsc(880, 0.3, 0.2);
    playOsc(1100, 0.6, 0.4);
  }

  // js/timer.js
  init_util();
  try {
    (function() {
      let rem = 0, intv, running = false, alarmInterval = null, permissionRequested = false;
      const btn = document.getElementById("timerToggle"), tH = document.getElementById("tH"), tM = document.getElementById("tM"), tS = document.getElementById("tS");
      const tabTimer = document.getElementById("tab-timer");
      const timerInputs = document.getElementById("timerInputs");
      const timerFsBtn = document.getElementById("timerFsBtn");
      const tipCtrl = createFsTipController(document.getElementById("timerFsTip"));
      function syncFullscreenButton() {
        if (timerFsBtn) timerFsBtn.disabled = !running && !document.fullscreenElement?.contains(tabTimer);
      }
      document.addEventListener("fullscreenchange", syncFullscreenButton);
      timerInputs.addEventListener("click", (e) => {
        e.stopPropagation();
        if (document.fullscreenElement) return;
        if (running) {
          tabTimer.classList.toggle("simple-mode");
          tipCtrl.hide();
        }
      });
      tabTimer.addEventListener("click", (e) => {
        if (tabTimer.classList.contains("simple-mode") && !timerInputs.contains(e.target) && !e.target.closest(".time-controls") && !e.target.closest(".controls-row")) {
          tabTimer.classList.remove("simple-mode");
        }
      });
      [tH, tM, tS].forEach((inp) => {
        inp.addEventListener("blur", () => {
          if (!inp.value) inp.value = "00";
          else inp.value = String(parseInt(inp.value)).padStart(2, "0");
        });
        inp.addEventListener("input", () => {
          if (inp.value.length > 2) inp.value = inp.value.slice(-2);
        });
        inp.addEventListener("keydown", (e) => {
          if (e.key === "Enter") startTimer();
        });
      });
      function setInputsReadonly(isRO) {
        tH.disabled = isRO;
        tM.disabled = isRO;
        tS.disabled = isRO;
      }
      function stopAlarm() {
        clearInterval(alarmInterval);
        alarmInterval = null;
        btn.textContent = "Start";
        running = false;
        tH.value = "00";
        tM.value = "00";
        tS.value = "00";
        syncFullscreenButton();
      }
      function tk() {
        if (rem <= 0) {
          clearInterval(intv);
          running = false;
          setInputsReadonly(false);
          btn.textContent = "Stop Alarm";
          tH.value = "00";
          tM.value = "00";
          tS.value = "00";
          playBeep();
          alarmInterval = setInterval(playBeep, 1200);
          if ("Notification" in window && Notification.permission === "granted") new Notification("Timer finished!");
          syncFullscreenButton();
          tipCtrl.hide();
          return;
        }
        rem--;
        tH.value = String(Math.floor(rem / 3600)).padStart(2, "0");
        tM.value = String(Math.floor(rem % 3600 / 60)).padStart(2, "0");
        tS.value = String(rem % 60).padStart(2, "0");
      }
      function pauseTimer() {
        clearInterval(intv);
        btn.textContent = "Resume";
        running = false;
        setInputsReadonly(false);
        syncFullscreenButton();
        tipCtrl.hide();
      }
      function resumeTimer() {
        if (rem === 0) rem = parseInt(tH.value || 0) * 3600 + parseInt(tM.value || 0) * 60 + parseInt(tS.value || 0);
        if (rem <= 0) return;
        running = true;
        btn.textContent = "Pause";
        setInputsReadonly(true);
        intv = setInterval(tk, 1e3);
        syncFullscreenButton();
        tipCtrl.show();
      }
      function startTimer() {
        if (!permissionRequested && "Notification" in window) {
          Notification.requestPermission();
          permissionRequested = true;
        }
        ensureAudioContext();
        if (alarmInterval) {
          stopAlarm();
          return;
        }
        if (running) {
          pauseTimer();
          return;
        }
        resumeTimer();
      }
      btn.addEventListener("click", startTimer);
      document.getElementById("timerReset").addEventListener("click", () => {
        clearInterval(intv);
        if (alarmInterval) clearInterval(alarmInterval);
        alarmInterval = null;
        running = false;
        rem = 0;
        btn.textContent = "Start";
        setInputsReadonly(false);
        tH.value = "00";
        tM.value = "00";
        tS.value = "00";
        syncFullscreenButton();
        tipCtrl.hide();
      });
    })();
  } catch (e) {
    console.error("Timer failed to init", e);
  }

  // js/alarm.js
  init_util();
  try {
    (function() {
      const h = document.getElementById("aH"), m = document.getElementById("aM"), ampm = document.getElementById("aAmPm"), btn = document.getElementById("alarmToggle");
      let intv, active = false, ringing = false, ringIntv, permissionRequested = false;
      const tipCtrl = createFsTipController(document.getElementById("alarmFsTip"));
      [h, m].forEach((inp) => {
        inp.addEventListener("blur", () => {
          if (!inp.value) inp.value = "00";
          else inp.value = String(parseInt(inp.value)).padStart(2, "0");
        });
        inp.addEventListener("input", () => {
          if (inp.value.length > 2) inp.value = inp.value.slice(-2);
        });
      });
      function setInputsReadonly(isRO) {
        h.disabled = isRO;
        m.disabled = isRO;
        ampm.disabled = isRO;
      }
      function checkAlarm() {
        const now = /* @__PURE__ */ new Date();
        let targetH = parseInt(h.value) % 12;
        if (ampm.value === "PM") targetH += 12;
        if (now.getHours() === targetH && now.getMinutes() === parseInt(m.value) && now.getSeconds() === 0) {
          clearInterval(intv);
          ringing = true;
          btn.textContent = "Stop Alarm";
          playBeep();
          ringIntv = setInterval(playBeep, 1200);
          if ("Notification" in window && Notification.permission === "granted") new Notification("Alarm Ringing!");
        }
      }
      btn.addEventListener("click", () => {
        if (!permissionRequested && "Notification" in window) {
          Notification.requestPermission();
          permissionRequested = true;
        }
        ensureAudioContext();
        if (ringing) {
          clearInterval(ringIntv);
          ringing = false;
          active = false;
          btn.textContent = "Set Alarm";
          setInputsReadonly(false);
          tipCtrl.hide();
        } else if (active) {
          clearInterval(intv);
          active = false;
          btn.textContent = "Set Alarm";
          setInputsReadonly(false);
          tipCtrl.hide();
        } else {
          active = true;
          btn.textContent = "Cancel Alarm";
          setInputsReadonly(true);
          intv = setInterval(checkAlarm, 1e3);
          tipCtrl.show();
        }
      });
    })();
  } catch (e) {
    console.error("Alarm failed to init", e);
  }

  // js/stopwatch.js
  init_util();
  try {
    (function() {
      let st = 0, el = 0, intv, run = false, laps = [];
      const big = document.getElementById("swBig"), bTog = document.getElementById("swToggle"), lst = document.getElementById("swLaps");
      const tabSW = document.getElementById("tab-stopwatch");
      const tipCtrl = createFsTipController(document.getElementById("swFsTip"));
      function fmt(ms) {
        const d = new Date(ms);
        return String(d.getUTCMinutes()).padStart(2, "0") + ":" + String(d.getUTCSeconds()).padStart(2, "0") + "." + String(Math.floor(d.getUTCMilliseconds() / 10)).padStart(2, "0");
      }
      function tk() {
        el = Date.now() - st;
        big.textContent = fmt(el);
      }
      bTog.addEventListener("click", () => {
        if (run) {
          clearInterval(intv);
          run = false;
          bTog.textContent = "Resume";
          tipCtrl.hide();
        } else {
          st = Date.now() - el;
          intv = setInterval(tk, 47);
          run = true;
          bTog.textContent = "Stop";
          tipCtrl.show();
        }
      });
      document.getElementById("swLap").addEventListener("click", () => {
        if (run) {
          laps.unshift(el);
          lst.innerHTML = laps.map((l, i) => `<div><span>Lap ${laps.length - i}</span><span>${fmt(l)}</span></div>`).join("");
        }
      });
      document.getElementById("swReset").addEventListener("click", () => {
        clearInterval(intv);
        run = false;
        el = 0;
        laps = [];
        bTog.textContent = "Start";
        big.textContent = "00:00.00";
        lst.innerHTML = "";
        tipCtrl.hide();
      });
      big.addEventListener("click", (e) => {
        e.stopPropagation();
        if (document.fullscreenElement) return;
        if (run || tabSW.classList.contains("simple-mode")) {
          tabSW.classList.toggle("simple-mode");
          tipCtrl.hide();
        }
      });
      tabSW.addEventListener("click", (e) => {
        if (tabSW.classList.contains("simple-mode") && e.target !== big && !e.target.closest(".time-controls, .controls-row")) {
          tabSW.classList.remove("simple-mode");
        }
      });
    })();
  } catch (e) {
    console.error("Stopwatch failed to init", e);
  }

  // js/wordcount.js
  var input = document.getElementById("wcInput");
  var highlight = document.getElementById("wcHighlight");
  var wcWords = document.getElementById("wcWords");
  var wcChars = document.getElementById("wcChars");
  var wcCharsNoSpace = document.getElementById("wcCharsNoSpace");
  var wcSentences = document.getElementById("wcSentences");
  var wcParagraphs = document.getElementById("wcParagraphs");
  var wcReadTime = document.getElementById("wcReadTime");
  var wcWordLimit = document.getElementById("wcWordLimit");
  var wcCharLimit = document.getElementById("wcCharLimit");
  function escapeHtml2(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function syncScroll() {
    highlight.scrollTop = input.scrollTop;
    highlight.scrollLeft = input.scrollLeft;
  }
  function renderHighlight(text, wordLimit, charLimit) {
    let splitIndex = text.length;
    if (charLimit > 0 && charLimit < splitIndex) splitIndex = charLimit;
    if (wordLimit > 0) {
      let wordCount = 0, inWord = false;
      for (let i = 0; i < text.length; i++) {
        const isSpace = text[i] === " " || text[i] === "\n" || text[i] === "	" || text[i] === "\r";
        if (!isSpace && !inWord) {
          wordCount++;
          inWord = true;
        } else if (isSpace) {
          inWord = false;
        }
        if (wordCount >= wordLimit && (isSpace || i === text.length - 1)) {
          splitIndex = Math.min(splitIndex, i + 1);
          break;
        }
      }
    }
    if (splitIndex > 0 && splitIndex < text.length) {
      highlight.innerHTML = "<mark>" + escapeHtml2(text.slice(0, splitIndex)) + "</mark>" + escapeHtml2(text.slice(splitIndex));
    } else {
      highlight.innerHTML = "";
    }
  }
  function count() {
    const text = input.value;
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, "").length;
    const sentences = trimmed ? trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0).length : 0;
    const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length : 0;
    const readSec = Math.round(words / 200 * 60);
    const readTime = readSec < 60 ? readSec + "s" : readSec < 600 ? Math.floor(readSec / 60) + "m " + readSec % 60 + "s" : Math.round(readSec / 60) + "m";
    const wl = parseInt(wcWordLimit.value, 10) || 0;
    const cl = parseInt(wcCharLimit.value, 10) || 0;
    renderHighlight(text, wl, cl);
    wcWords.textContent = words;
    wcChars.textContent = chars;
    wcCharsNoSpace.textContent = charsNoSpace;
    wcSentences.textContent = sentences;
    wcParagraphs.textContent = paragraphs;
    wcReadTime.textContent = readTime;
  }
  input.addEventListener("input", count);
  input.addEventListener("scroll", syncScroll);
  wcWordLimit.addEventListener("input", count);
  wcCharLimit.addEventListener("input", count);

  // js/app.js
  init_util();
  var PDF_SCRIPTS = [
    "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js",
    "https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js",
    "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js"
  ];
  var CONVERT_SCRIPTS = [
    "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js",
    "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js",
    "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js",
    "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js",
    "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
    "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js",
    "https://cdn.jsdelivr.net/npm/utif@3.1.0/UTIF.js"
  ];
  function setupPdfWorker() {
    if (typeof pdfjsLib !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
    }
  }
  var _tabLoads = {};
  function loadTabModule(tabName) {
    const tool = tabName === "mr" ? { key: "pdf", prefix: "mr", label: "PDF Tools", scripts: PDF_SCRIPTS, load: () => Promise.resolve().then(() => (init_pdf(), pdf_exports)) } : tabName === "files" ? { key: "converter", prefix: "cv", label: "File Tools", scripts: CONVERT_SCRIPTS, load: () => Promise.resolve().then(() => (init_converter(), converter_exports)) } : null;
    if (tool) {
      if (!_tabLoads[tool.key]) {
        let loading = true;
        setFileToolBusy(tool.prefix, true);
        setToolStatus(tool.prefix, `Loading ${tool.label}\u2026`, { state: "loading", value: 0, max: tool.scripts.length });
        _tabLoads[tool.key] = loadScripts(tool.scripts, (value, max) => {
          if (loading) setToolStatus(tool.prefix, `Loading ${tool.label}\u2026 (${value}/${max})`, { state: "loading", value, max });
        }).then(() => {
          setupPdfWorker();
          setToolStatus(tool.prefix, `Starting ${tool.label}\u2026`, { state: "loading" });
          return tool.load();
        }).then(() => {
          loading = false;
          setFileToolBusy(tool.prefix, false);
          setToolStatus(tool.prefix);
        }).catch((e) => {
          loading = false;
          setFileToolBusy(tool.prefix, false, { disabled: true });
          setToolStatus(tool.prefix, `Could not load ${tool.label.toLowerCase()}. Check your connection and retry.`, { state: "error", retry: true });
          delete _tabLoads[tool.key];
          console.error(`${tool.label} failed to load`, e);
        });
      }
      return _tabLoads[tool.key];
    } else if (tabName === "speed") {
      if (!_tabLoads.speed) {
        _tabLoads.speed = Promise.resolve().then(() => __toESM(require_speed())).catch((e) => {
          console.error("Speed load failed", e);
          delete _tabLoads.speed;
        });
      }
    }
  }
  [["cv", "files"], ["mr", "mr"]].forEach(([prefix, tab]) => {
    const drop = document.getElementById(`${prefix}Dropzone`);
    ["dragover", "drop"].forEach((type) => drop.addEventListener(type, (e) => {
      if (document.getElementById(`${prefix}FileInput`).disabled) e.preventDefault();
    }));
    document.querySelector(`#${prefix}Status .tool-retry`).addEventListener("click", () => loadTabModule(tab));
  });
  var themeToggle = document.getElementById("theme-toggle");
  var sunIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  var moonIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  function setTheme(isLight) {
    document.documentElement.setAttribute("data-theme", isLight ? "light" : "dark");
    themeToggle.innerHTML = isLight ? moonIcon : sunIcon;
    themeToggle.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
  }
  var isLightMode = document.documentElement.dataset.theme === "light";
  setTheme(isLightMode);
  themeToggle.addEventListener("click", () => {
    isLightMode = !isLightMode;
    setTheme(isLightMode);
    try {
      localStorage.setItem("knickknacks-theme", isLightMode ? "light" : "dark");
    } catch (e) {
    }
  });
  window.addEventListener("storage", (e) => {
    if (e.key !== "knickknacks-theme" && e.key !== null) return;
    isLightMode = e.newValue === "light";
    setTheme(isLightMode);
  });
  var tabButtons = document.querySelectorAll(".tab-btn");
  var validTabs = ["home", "units", "files", "words", ...Array.from(tabButtons).map((b) => b.dataset.tab)];
  var DEFAULT_TAB = "home";
  function revealActiveTab() {
    const active = document.querySelector(".tab-btn.active");
    const links = active?.closest(".tab-links");
    if (!links || links.clientWidth === 0 || links.scrollWidth <= links.clientWidth) return;
    const buttonRect = active.getBoundingClientRect(), linksRect = links.getBoundingClientRect();
    if (buttonRect.left < linksRect.left + 6 || buttonRect.right > linksRect.right - 6) {
      links.scrollLeft += buttonRect.left - linksRect.left - 6;
    }
  }
  window.addEventListener("resize", () => requestAnimationFrame(revealActiveTab));
  document.fonts.ready.then(revealActiveTab);
  function activateTab(tabName, focusInput) {
    if (!validTabs.includes(tabName)) tabName = DEFAULT_TAB;
    tabButtons.forEach((b) => {
      const active = b.dataset.tab === tabName;
      b.classList.toggle("active", active);
      if (active) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    document.querySelectorAll(".tab-panel").forEach((p) => p.hidden = p.id !== "tab-" + tabName);
    loadTabModule(tabName);
    if (tabName === "units" && focusInput) document.getElementById("num-in").focus();
    if (tabName === "words" && focusInput) document.getElementById("wcInput").focus();
    requestAnimationFrame(revealActiveTab);
    return tabName;
  }
  function navigateToTab(tabName) {
    if (location.hash.slice(1) === tabName) {
      activateTab(tabName, true);
      return;
    }
    try {
      location.hash = tabName;
    } catch (e) {
      activateTab(tabName, true);
    }
  }
  tabButtons.forEach((btn) => btn.addEventListener("click", () => {
    navigateToTab(btn.dataset.tab);
  }));
  document.querySelectorAll(".home-tile").forEach((tile) => tile.addEventListener("click", () => {
    navigateToTab(tile.dataset.goto);
  }));
  var homeFab = document.getElementById("homeFab");
  function goHome() {
    if (location.hash.slice(1) === "home") {
      activateTab("home", false);
      return;
    }
    try {
      location.hash = "home";
    } catch (e) {
      activateTab("home", false);
    }
  }
  homeFab.addEventListener("click", goHome);
  window.addEventListener("hashchange", () => activateTab(location.hash.slice(1), true));
  var startTab = activateTab(location.hash.slice(1), false);
  if (location.hash.slice(1) !== startTab) {
    try {
      history.replaceState(null, "", "#" + startTab);
    } catch (e) {
    }
  }
  document.querySelectorAll(".fs-btn").forEach((btn) => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (btn.disabled) return;
    const p = e.target.closest(".panel");
    if (!document.fullscreenElement) {
      p.closest(".tab-panel").requestFullscreen && p.closest(".tab-panel").requestFullscreen();
      document.querySelectorAll(".fs-tip").forEach((t) => t.hidden = true);
    } else {
      document.exitFullscreen && document.exitFullscreen();
    }
  }));
  document.addEventListener("fullscreenchange", () => {
    const fsEl = document.fullscreenElement;
    document.querySelectorAll(".panel.time-panel, .panel.speed-panel").forEach((p) => {
      const btn = p.querySelector(".fs-btn");
      if (fsEl && fsEl.contains(p)) {
        p.classList.add("fs-active");
        if (btn) btn.setAttribute("aria-label", "Exit Fullscreen");
        if (btn) btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>';
        document.querySelectorAll(".fs-tip").forEach((t) => t.hidden = true);
      } else {
        p.classList.remove("fs-active");
        if (btn) btn.setAttribute("aria-label", "Enter Fullscreen");
        if (btn) btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>';
      }
    });
  });
  document.addEventListener("click", (e) => {
    const fsEl = document.fullscreenElement;
    if (fsEl && (e.target === fsEl || e.target.matches(".panel.fs-active"))) {
      document.exitFullscreen();
    }
  });
})();
