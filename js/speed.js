(async function () {
  const { default: SpeedTest } = await import('https://cdn.jsdelivr.net/npm/@cloudflare/speedtest/+esm');

  const path = document.getElementById('speedGaugePath'),
        pEl = document.getElementById('speedPing'),
        dEl = document.getElementById('speedDown'),
        uEl = document.getElementById('speedUp'),
        speedPhase = document.getElementById('speedPhase'),
        progCont = document.getElementById('speedProgressCont'),
        progFill = document.getElementById('speedProgress'),
        runBtn = document.getElementById('speedRunBtn'),
        noteEl = document.getElementById('speedNote');

  // Arc gauge fill state
  let gTarg = 0, gCur = 0, gVel = 0;
  // Smoothed on-screen numbers, so incoming samples ease in instead of jumping/flashing
  let downTarg = 0, downCur = 0, downVel = 0;
  let upTarg = 0, upCur = 0, upVel = 0;
  let finished = true; // true whenever no test is actively running

  function ease(cur, targ, vel) {
    vel = (vel + (targ - cur) * 0.14) * 0.72;
    return [cur + vel, vel];
  }

  function anim() {
    [gCur, gVel] = ease(gCur, gTarg, gVel);
    const max = Math.max(10, gTarg * 1.2), pct = Math.max(0, Math.min(1, gCur / max));
    path.style.strokeDashoffset = 235.6 * (1 - (isNaN(pct) ? 0 : pct));

    if (!finished) {
      [downCur, downVel] = ease(downCur, downTarg, downVel);
      [upCur, upVel] = ease(upCur, upTarg, upVel);
      dEl.textContent = (downTarg > 0.05 || downCur > 0.05) ? Math.max(0, downCur).toFixed(1) : '—';
      uEl.textContent = (upTarg > 0.05 || upCur > 0.05) ? Math.max(0, upCur).toFixed(1) : '—';
    }
    requestAnimationFrame(anim);
  }
  requestAnimationFrame(anim);

  function resetDisplay() {
    gTarg = gCur = gVel = 0;
    downTarg = downCur = downVel = 0;
    upTarg = upCur = upVel = 0;
    pEl.textContent = '—'; dEl.textContent = '—'; uEl.textContent = '—';
  }

  function setFinal(download, upload, latency) {
    downTarg = downCur = download;
    upTarg = upCur = upload;
    gTarg = gCur = Math.max(download, upload);
    dEl.textContent = download.toFixed(1);
    uEl.textContent = isNaN(upload) ? 'N/A' : upload.toFixed(1);
    pEl.textContent = Math.round(latency) + ' ms';
  }

  async function fallbackSpeedTest(btnEl, pIntv) {
    pEl.textContent = '...';
    try {
      let t0 = performance.now();
      await fetch('https://cloudflare.com/cdn-cgi/trace', { mode: 'no-cors', cache: 'no-store' });
      let ping = performance.now() - t0; pEl.textContent = Math.round(ping) + ' ms';
      speedPhase.textContent = 'Testing Download...';
      t0 = performance.now();
      const resp = await fetch('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js?_cb=' + Date.now());
      const blob = await resp.blob();
      let mbps = (blob.size * 8 / 1000000) / ((performance.now() - t0) / 1000);

      // Rough upload estimate: time a same-size POST back to a CORS-friendly echo
      // endpoint. If that's blocked too (common in sandboxed embeds), fall back to
      // labeling it unavailable rather than showing a bare, unexplained "N/A".
      let upMbps = NaN;
      try {
        const payload = new Blob([new Uint8Array(2_000_000)]);
        const tUp0 = performance.now();
        await fetch('https://speed.cloudflare.com/__up', { method: 'POST', body: payload, cache: 'no-store' });
        upMbps = (payload.size * 8 / 1000000) / ((performance.now() - tUp0) / 1000);
      } catch (upErr) { /* leave upMbps as NaN — reported as unavailable below */ }

      finished = true;
      clearInterval(pIntv);
      downTarg = downCur = mbps; gTarg = gCur = mbps;
      dEl.textContent = mbps.toFixed(1);
      if (!isNaN(upMbps) && upMbps > 0) { uEl.textContent = upMbps.toFixed(1); upTarg = upCur = upMbps; }
      else { uEl.textContent = 'N/A'; noteEl.hidden = false; noteEl.textContent = 'Limited test — upload speed isn\u2019t measurable in this environment.'; }
      progFill.style.width = '100%'; speedPhase.textContent = 'Test Complete';
    } catch(e) {
      finished = true;
      clearInterval(pIntv);
      noteEl.hidden = false; noteEl.textContent = 'Test unavailable. Check network restrictions.';
      progCont.style.display = 'none'; speedPhase.textContent = 'Ready to test';
    }
    btnEl.disabled = false; btnEl.textContent = 'Run again';
  }

  runBtn.addEventListener('click', function() {
    this.disabled = true; this.textContent = 'Testing…';
    finished = false;
    resetDisplay();
    noteEl.hidden = true;
    speedPhase.textContent = 'Testing Ping...';

    progCont.style.display = 'block'; progFill.style.width = '0%';
    let fakeProgress = 0;
    // Cap the fake progress short of 100% — only a real completion should fill the bar all the way,
    // so the bar and the "Test Complete" label always agree.
    const pIntv = setInterval(() => { fakeProgress += 1; progFill.style.width = Math.min(96, (fakeProgress / 220) * 100) + '%'; }, 100);

    try {
      const test = new SpeedTest();
      test.onResultsChange = () => {
          if (finished) return; // ignore any late events that arrive after we've already finalized
          const s = test.results.getSummary();
          if (s.latency) pEl.textContent = Math.round(s.latency) + ' ms';
          if (s.upload && s.upload > 0) {
              speedPhase.textContent = 'Testing Upload...';
              upTarg = s.upload / 1e6; downTarg = s.download / 1e6; gTarg = upTarg;
          } else if (s.download && s.download > 0) {
              speedPhase.textContent = 'Testing Download...';
              downTarg = s.download / 1e6; gTarg = downTarg;
          } else {
              speedPhase.textContent = 'Testing Ping...';
          }
      };
      test.onFinish = () => {
          const s = test.results.getSummary();
          // Guard against a premature/partial finish event — only declare completion once every metric is in.
          if (s.download == null || s.upload == null || s.latency == null) return;
          finished = true;
          clearInterval(pIntv);
          progFill.style.width = '100%';
          speedPhase.textContent = 'Test Complete';
          setFinal(s.download / 1e6, s.upload / 1e6, s.latency);
          this.disabled = false; this.textContent = 'Run again';
      };
      test.onError = () => fallbackSpeedTest(this, pIntv);
    } catch (e) { fallbackSpeedTest(this, pIntv); }
  });
})();
