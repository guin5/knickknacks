/* --- STOPWATCH --- */
try { (function() {
  let st=0, el=0, intv, run=false, laps=[];
  const big = document.getElementById('swBig'), bTog = document.getElementById('swToggle'), lst = document.getElementById('swLaps');
  const tabSW = document.getElementById('tab-stopwatch');
  const swFsTip = document.getElementById('swFsTip');
  let fsTipTimer = null;
  function showFsTip() { if (!swFsTip) return; swFsTip.hidden = false; clearTimeout(fsTipTimer); fsTipTimer = setTimeout(() => { swFsTip.hidden = true; }, 4000); }
  function hideFsTip() { if (swFsTip) swFsTip.hidden = true; clearTimeout(fsTipTimer); }

  function fmt(ms) { const d=new Date(ms); return String(d.getUTCMinutes()).padStart(2,'0')+':'+String(d.getUTCSeconds()).padStart(2,'0')+'.'+String(Math.floor(d.getUTCMilliseconds()/10)).padStart(2,'0'); }
  function tk() { el = Date.now()-st; big.textContent = fmt(el); }
  bTog.addEventListener('click', () => {
    if(run) { clearInterval(intv); run=false; bTog.textContent='Resume'; hideFsTip(); }
    else { st = Date.now()-el; intv=setInterval(tk, 47); run=true; bTog.textContent='Stop'; showFsTip(); }
  });
  document.getElementById('swLap').addEventListener('click', () => { if(run){ laps.unshift(el); lst.innerHTML = laps.map((l,i) => `<div><span>Lap ${laps.length-i}</span><span>${fmt(l)}</span></div>`).join(''); } });
  document.getElementById('swReset').addEventListener('click', () => { clearInterval(intv); run=false; el=0; laps=[]; bTog.textContent='Start'; big.textContent='00:00.00'; lst.innerHTML=''; hideFsTip(); });
  big.addEventListener('click', (e) => {
    e.stopPropagation();
    if (run) { tabSW.classList.toggle('simple-mode'); hideFsTip(); }
  });
  tabSW.addEventListener('click', (e) => {
    if (tabSW.classList.contains('simple-mode') && e.target !== big && !e.target.closest('.time-controls')) {
      tabSW.classList.remove('simple-mode');
    }
  });
})(); } catch (e) { console.error('Stopwatch failed to init', e); }
