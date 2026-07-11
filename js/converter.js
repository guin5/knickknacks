import { formatBytes, getExt, triggerDownload, wireDropzone } from './app.js';

/* --- CONVERT FILES --- */
try { (function() {
  let curr = null; const info = document.getElementById('cvFileInfo'), acts = document.getElementById('cvActions'), err = document.getElementById('cvError');
  const IMGS = ['png','jpg','jpeg','webp','bmp','svg','heic','heif','gif'], DOCS = ['pdf','txt','md'];
  function setFile(f) {
    curr = f; if(!f) { info.hidden = true; acts.innerHTML = ''; err.hidden = true; return; }
    info.hidden = false; document.getElementById('cvFileName').textContent = f.name; document.getElementById('cvFileMeta').textContent = formatBytes(f.size);
    const ext = getExt(f.name);
    if (IMGS.includes(ext)) acts.innerHTML = `<button class="format-btn" data-fmt="png">PNG</button><button class="format-btn" data-fmt="jpeg">JPEG</button><button class="format-btn" data-fmt="webp">WEBP</button><button class="format-btn blurred" disabled>GIF</button><button class="format-btn blurred" disabled>HEIC</button>`;
    else if (DOCS.includes(ext)) acts.innerHTML = ext === 'pdf' ? `<button class="format-btn" data-fmt="md">MD</button><button class="format-btn" data-fmt="txt">TXT</button>` : `<button class="format-btn" data-fmt="pdf">PDF</button>`;
    else { err.hidden = false; err.textContent = "Unsupported file type."; }
  }
  wireDropzone(document.getElementById('cvDropzone'), document.getElementById('cvFileInput'), document.getElementById('cvBrowseBtn'), files => setFile(files[0]));
  document.getElementById('cvClearBtn').addEventListener('click', () => setFile(null));
  acts.addEventListener('click', async e => {
    const btn = e.target.closest('.format-btn'); if(!btn || btn.disabled || !curr) return;
    const fmt = btn.dataset.fmt, base = curr.name.replace(/\.[^.]+$/, ''), orig = btn.textContent; btn.disabled = true; btn.textContent = '…';
    try {
      if (['png','jpeg','webp'].includes(fmt)) {
        let b = curr; if (['heic','heif'].includes(getExt(curr.name))) b = [].concat(await heic2any({ blob: curr, toType: 'image/png' }))[0];
        const img = await createImageBitmap(b), c = document.createElement('canvas'), ctx = c.getContext('2d');
        c.width = img.width; c.height = img.height; if (fmt === 'jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0,0,c.width,c.height); }
        ctx.drawImage(img, 0, 0); img.close();
        triggerDownload(await new Promise(r => c.toBlob(r, `image/${fmt}`, 0.92)), `${base}.${fmt === 'jpeg' ? 'jpg' : fmt}`);
      } else if (['md','txt'].includes(fmt)) {
        if (typeof pdfjsLib === 'undefined') throw new Error('PDF library failed to load. Check your connection and try again.');
        const doc = await pdfjsLib.getDocument({ data: new Uint8Array(await curr.arrayBuffer()) }).promise, pages = [];
        for (let i=1; i<=doc.numPages; i++) {
          let pTxt = ''; (await (await doc.getPage(i)).getTextContent()).items.forEach(it => pTxt += (pTxt && !pTxt.endsWith(' ') ? ' ' : '') + it.str);
          pages.push(fmt === 'md' ? `## Page ${i}\n\n${pTxt}` : `Page ${i}\n${'-'.repeat(20)}\n${pTxt}`);
        }
        triggerDownload(new Blob([pages.join('\n\n')], { type: 'text/plain' }), `${base}.${fmt}`);
      } else if (fmt === 'pdf') {
        const txt = await curr.text();
        const outDoc = await PDFLib.PDFDocument.create();
        const page = outDoc.addPage();
        const font = await outDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        page.drawText(txt, { x: 40, y: page.getHeight() - 40, size: 12, font: font, maxWidth: page.getWidth() - 80, lineHeight: 16 });
        triggerDownload(new Blob([await outDoc.save()], { type: 'application/pdf' }), `${base}.pdf`);
      }
    } catch(er) { alert('Conversion error: ' + er.message); } finally { btn.disabled = false; btn.textContent = orig; }
  });
})(); } catch (e) { console.error('Convert files failed to init', e); }
