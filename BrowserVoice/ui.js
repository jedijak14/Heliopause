'use strict';
const voice = new HelioLocalVoice();
const $ = id => document.getElementById(id);
voice.onstatus = text => { $('status').textContent = text; };
voice.onsubtitle = text => { $('subtitle').textContent = 'EVA / ' + text; };
function render() {
  $('index').replaceChildren();
  for (const row of [...voice.files.values()].sort((a,b) => a.key.localeCompare(b.key))) {
    const li = document.createElement('li'); li.textContent = `${row.key} — ${row.name} (${Math.ceil(row.blob.size/1024)} KB)`; $('index').append(li);
  }
  if (!voice.files.size) { const li = document.createElement('li'); li.textContent = 'No local files. Tactical events will try installed local voices.'; $('index').append(li); }
}
async function add(files) { await voice.add(files); render(); }
$('files').onchange = e => add(e.target.files);
$('folder').onchange = e => add(e.target.files);
window.addEventListener('dragover', e => { e.preventDefault(); $('drop').classList.add('drag'); });
window.addEventListener('drop', e => { e.preventDefault(); $('drop').classList.remove('drag'); add(e.dataTransfer.files); });
window.addEventListener('dragleave', () => $('drop').classList.remove('drag'));
const events = {
  eva_welcome: 'SV seven Longhaul online. Take the pilot seat on the bridge.',
  eva_alert: 'Warning. Atmospheric containment requires attention.',
  eva_intrusion: 'Unidentified lifeform in the cargo bay. Security response requested.'
};
document.querySelectorAll('[data-event]').forEach(b => { b.onclick = () => voice.enqueue(b.dataset.event, events[b.dataset.event]); });
$('hum').onclick = () => voice.enqueue('ambient_hum', 'Ambient engine sound is not loaded.');
$('stop').onclick = () => { voice.stop(); voice.onstatus('Playback stopped.'); };
$('clear').onclick = async () => {
  try { await voice.clear(); render(); voice.onstatus('Local voice files removed.'); }
  catch (_) { voice.onstatus('Could not clear persistent storage. Use browser site-data settings.'); }
};
window.addEventListener('pagehide', () => voice.stop());
voice.open().then(saved => { render(); if(saved) voice.onstatus('Local index ready. Choose an event to enable playback.'); });
