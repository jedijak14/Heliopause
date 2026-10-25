import './style.css';
import { createScene } from './scene.js';
import { createState, tick, fault, repair, log, setFlight, doorLocked, unsafe, timecode, roomNames } from './model.js';
import '../../BrowserVoice/voice.js';
import humUrl from '../../Content/Audio/ambient_hum.wav';
import confirmUrl from '../../Content/Audio/ui_confirm.wav';
const icons={
 sun:'<circle cx="12" cy="12" r="5"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/><circle cx="12" cy="12" r="9" opacity=".35"/>',
 sound:'<path d="M11 4 6 8H3v8h3l5 4V4Z"/><path d="M15 8c2 2 2 6 0 8m3-11c4 4 4 10 0 14"/>',
 mute:'<path d="M11 4 6 8H3v8h3l5 4V4Z"/><path d="m16 9 5 6m0-6-5 6"/>',
 keys:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M5 9h1m3 0h1m3 0h1m3 0h1M5 12h1m3 0h1m3 0h1m3 0h1M7 16h10"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="m10 2-1 3-3 1-3-1-2 4 2 2v3l-2 2 2 4 3-1 3 1 1 3h4l1-3 3-1 3 1 2-4-2-2v-3l2-2-2-4-3 1-3-1-1-3Z"/>',
 expand:'<path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/>',close:'<path d="m5 5 14 14M19 5 5 19"/>',
 eye:'<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 bridge:'<path d="m3 18 2-12 7-3 7 3 2 12H3Zm4-8 5-3 5 3M7 14h10m-5-7v11"/>',
 crew:'<path d="M3 20V4m18 16V9H3m0 7h18M6 9V5h7v4m-10 8h18"/>',
 cargo:'<path d="m3 7 9-5 9 5v11l-9 4-9-4V7Zm0 0 9 5 9-5m-9 5v10m-5-17 10 5v5"/>',
 engine:'<path d="M9 2h6v4h3v12h-3v4H9v-4H6V6h3V2ZM3 8h3m12 0h3M3 16h3m12 0h3m-9-8v8"/>',
 signal:'<path d="M3 16v4m4-8v8m5-13v13m5-17v17m4-20v20"/>',cursor:'<path d="m4 3 6 17 3-7 7-3L4 3Z"/>',
 drone:'<path d="M7 8h10l2 3v6H5v-6l2-3Z"/><path d="M2 7h3v11H2V7Zm17 0h3v11h-3V7ZM8 11h8v3H8v-3ZM9 4h6v4H9V4Z"/>',
};
const svg=(name,cls='')=>`<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.signal}</svg>`;
const wave='<svg class="mini-wave" viewBox="0 0 58 18" fill="none" aria-hidden="true"><path d="M0 9h8l3-5 3 11 4-13 4 15 4-12 3 7 3-3h8l3-3 3 6 3-3h9" stroke="currentColor" stroke-width="1"/></svg>';
const state=createState();
let roomSelected=0,scene,toastTimer,uiAccumulator=0,lastFrame=performance.now(),lastLog='',renderedView='bridge';
let panelHTML='';
const names={bridge:'Flight deck',pilot:'Pilot link active',port:'Port hull sensor',starboard:'Starboard hull sensor',front:'Forward sensor',crew:'Crew quarters',cargo:'Cargo bay',engine:'Engine room',drone:'Remote drone link'};
const app=document.querySelector('#app');
app.innerHTML=`
<header><div class="brand">${svg('sun','brand-mark')}<div><div class="wordmark">HELIOPAUSE</div><small>A LONG WAY OUT · SV-7</small></div></div>
<nav class="topnav" aria-label="Tablet pages">${['Flight deck','Ship systems','Drone link','Mission log'].map((n,i)=>`<button data-tab="${['flight','systems','drones','log'][i]}" class="${i===0?'active':''}"><span class="nav-num">0${i+1}</span>${n}</button>`).join('')}</nav>
<div class="header-right"><span class="clock"><i class="dot"></i><span id="clock">00:00:00</span> MET</span><button class="icon-button" data-action="audio" aria-label="Enable audio" title="Enable audio">${svg('mute')}</button><button class="icon-button help-button" data-dialog="help" aria-label="Controls" title="Controls">${svg('keys')}</button><button class="icon-button settings-button" data-dialog="settings" aria-label="Settings and local voice" title="Settings and local voice">${svg('settings')}</button><button class="icon-button" data-action="fullscreen" aria-label="Toggle fullscreen" title="Toggle fullscreen">${svg('expand')}</button></div></header>
<canvas id="scene" tabindex="0" aria-label="Interactive three-dimensional spacecraft. Drag to look; use the controls below to change views."></canvas><div class="vignette"></div>
<section class="mission"><div class="eyebrow"><i class="dot"></i><span id="mission-eyebrow">ASTERION SYSTEM / SECTOR 04</span></div><h1>A long<br><span>way out.</span></h1><p id="directive">At the edge of the familiar.<br>Your ship. Your systems.<br>Everything between you and the void.</p><div class="divider"></div><div class="eyebrow distance-label">DISTANCE FROM SOL</div><div class="range"><strong>142.86</strong><span>AU</span></div></section>
<div class="compass"><div class="compass-scale"><span>030</span><span>045</span><span>060</span><span>075</span><span>090</span></div><div class="compass-ticks"></div><div class="compass-marker"></div><strong>HDG 060.4</strong></div>
<div class="planet-label"><div><strong>ASTERION IV</strong><span>HIGH ORBIT · 428 KM</span></div></div><div class="crosshair"></div>
<aside class="sidepanel" id="panel" aria-label="Bridge tablet"></aside>
<div class="comms"><div class="comms-top">${svg('signal')}<span>EVA</span><span style="opacity:.4">/</span><span style="color:#688b92">SHIP INTELLIGENCE</span></div><p id="eva-text">“All systems nominal, Commander.<br>We have a long way ahead of us.”</p></div>
<div class="view-label"><span id="view-kind">INTERNAL OPTICS / DECK 01</span><strong id="view-name">FLIGHT DECK</strong></div><div class="scene-help">${svg('cursor')}<span id="scene-hint">DRAG TO LOOK AROUND</span></div>
<footer class="deck"><div class="sensor-row"><div class="sensor-label">${svg('eye')}SENSOR ARRAY</div><div class="sensor-buttons">${[['bridge','Bridge'],['port','Port hull'],['starboard','Starboard hull'],['front','Forward']].map(([id,n],i)=>`<button data-view="${id}" class="${!i?'active':''}"><small>0${i+1}</small>${n}</button>`).join('')}</div><span class="offline"><i class="dot"></i>LOCAL SIMULATION</span></div><div class="command-row"><div class="ship-id"><span>VESSEL REGISTRY</span><strong>SV–7 LONGHAUL</strong></div><nav class="room-nav" aria-label="Compartment views">${[['bridge','Bridge','bridge'],['crew','Crew quarters','crew'],['cargo','Cargo bay','cargo'],['engine','Engine room','engine']].map(([id,n,ic],i)=>`<button data-room="${id}" class="${!i?'active':''}">${svg(ic)}<div><strong>${n}</strong><small>DECK 0${i+1}</small></div></button>`).join('')}</nav><button class="secondary mobile-control" data-dialog="help">Controls</button><button class="primary" data-action="seat" id="seat-button">Take pilot seat <kbd>E</kbd></button></div></footer>
<div class="touch-movement hidden" aria-label="Movement controls"><button data-move="KeyW" aria-label="Move forward">↑</button><button data-move="KeyA" aria-label="Move left">←</button><button data-move="KeyS" aria-label="Move backward">↓</button><button data-move="KeyD" aria-label="Move right">→</button></div><div class="toast" role="status" aria-live="polite"></div><div class="static-cut"><h2>SIGNAL LOST<small>RETURNING TO CREW CHANNEL</small></h2></div>
<dialog id="help-dialog"><div class="dialog-head"><h2>YOUR SHIP. YOUR CONTROLS.</h2><button class="icon-button" data-close aria-label="Close controls">${svg('close')}</button></div><div class="dialog-body"><div class="keyboard-grid">${[['DRAG','Look around'],['W A S D','Move in exploration / drone mode'],['E','Pilot seat / explore / bulkhead'],['T','Ship systems tablet'],['V','Cycle fixed sensors'],['1','Scan compartment'],['2','Repair compartment'],['3','Security pulse'],['ESC','Close dialog / release link'],['SHIFT','Run in exploration mode']].map(([key,label])=>`<div class="key-row"><kbd>${key}</kbd>${label}</div>`).join('')}</div><p>Use the lower deck selector to inspect each compartment. Select <strong>Explore compartment</strong> to walk, or link to a drone. In the pilot seat, W/S adjusts thrust. Hull sensors are fixed and do not respond to mouse look.</p><button class="secondary" data-dialog="settings">Audio, voice & display settings →</button></div></dialog>
<dialog id="settings-dialog"><div class="dialog-head"><h2>ONBOARD PREFERENCES</h2><button class="icon-button" data-close aria-label="Close settings">${svg('close')}</button></div><div class="dialog-body"><div class="setting-row"><span>Rendering quality</span><select id="quality" aria-label="Rendering quality"><option value="high">High · cinematic bloom</option><option value="low">Efficient · native lighting</option></select></div><div class="setting-row"><span>Ambient audio & local voice</span><button class="secondary" data-action="audio" id="audio-setting">Enable audio</button></div><h3 class="eyebrow" style="margin-top:24px">LOCAL VOICE LIBRARY</h3><p>Your recordings take priority over installed system voices. Use event filenames such as <code>eva_alert.mp3</code>, <code>eva_status.wav</code>, or <code>eva_intrusion.mp3</code>. No uploads. No cloud speech.</p><label class="dropzone" id="dropzone">Drop your audio files here<input type="file" id="voice-files" multiple accept="audio/*,.mp3,.wav,.ogg" aria-label="Choose local voice files"></label><ul id="voice-index" class="file-list"></ul><div class="button-grid"><button class="secondary" data-action="test-voice">Test EVA alert</button><button class="secondary" data-action="clear-voice">Forget local files</button></div><p id="voice-status" aria-live="polite"></p><p class="small-note">Browser-native interactive preview · Three.js / WebGL2<br>This is not Unreal Pixel Streaming. All geometry, fonts and ambient audio are bundled locally. No external assets are fetched.</p></div></dialog>
<div class="load-screen"><div class="wordmark">HELIOPAUSE</div><div class="load-line"></div><span>ESTABLISHING BRIDGE LINK</span></div>`;
const $=sel=>document.querySelector(sel);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const voice=new globalThis.HelioLocalVoice();
voice.onsubtitle=text=>{$('#eva-text').textContent=`“${text}”`;};voice.onstatus=text=>{$('#voice-status').textContent=text;};voice.open().then(refreshVoiceList);
const ambient=new Audio(humUrl);ambient.loop=true;ambient.volume=.16;
const confirm=new Audio(confirmUrl);confirm.volume=.14;
function clickSound(){if(state.muted)return;confirm.currentTime=0;confirm.play().catch(()=>{});}
function refreshVoiceList(){const ul=$('#voice-index');ul.replaceChildren();for(const row of voice.files.values()){const li=document.createElement('li');li.textContent=`${row.key} · ${Math.ceil(row.blob.size/1024)} KB`;ul.append(li);}if(!voice.files.size){const li=document.createElement('li');li.textContent='No recordings added. Installed local voices are the fallback.';ul.append(li);}}
let lastAnnouncement={text:'',at:-10};
function announce(text,key='eva_status'){$('#eva-text').textContent=`“${text}”`;if(!state.muted&&(lastAnnouncement.text!==text||state.elapsed-lastAnnouncement.at>3)){voice.enqueue(key,text);lastAnnouncement={text,at:state.elapsed};}}
function toast(text){const el=$('.toast');el.textContent=text;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3400);}
function showDialog(name){document.querySelectorAll('dialog[open]').forEach(d=>d.close());$(`#${name}-dialog`).showModal();}
function meter(percent,amber=false){return `<div class="meter ${amber?'amber':''}">${Array.from({length:18},(_,i)=>`<i class="${i/18*100<percent?'filled':''}"></i>`).join('')}</div>`;}
function metric(name,value,percent,amber=false){return `<div class="metric"><div class="metric-label"><span>${name}</span><b>${value}</b></div>${meter(percent,amber)}</div>`;}
// Patch text/attributes in place so live telemetry never detaches focused controls.
function reconcile(parent, incoming){
  const oldNodes=[...parent.childNodes],newNodes=[...incoming.childNodes];
  newNodes.forEach((fresh,i)=>{
    const old=oldNodes[i];
    if(!old){parent.append(fresh.cloneNode(true));return;}
    if(old.nodeType!==fresh.nodeType||old.nodeName!==fresh.nodeName){old.replaceWith(fresh.cloneNode(true));return;}
    if(old.nodeType===Node.TEXT_NODE){if(old.textContent!==fresh.textContent)old.textContent=fresh.textContent;return;}
    if(old.nodeType===Node.ELEMENT_NODE){
      for(const attr of [...old.attributes])if(!fresh.hasAttribute(attr.name))old.removeAttribute(attr.name);
      for(const attr of fresh.attributes)if(old.getAttribute(attr.name)!==attr.value)old.setAttribute(attr.name,attr.value);
      reconcile(old,fresh);
    }
  });
  oldNodes.slice(newNodes.length).forEach(n=>n.remove());
}
function renderPanel(){
  const selected=state.rooms[roomSelected],r=state.rooms[state.room],mode=state.mode;let html='';
  if(state.tab==='flight'){
    html=`<div class="panel-head"><h2>VESSEL STATUS</h2><span class="panel-index">SYS / 01</span></div><div class="panel-body"><div class="status-heading"><i class="dot"></i>${mode==='emergency'?'EMERGENCY LOCKDOWN':state.rooms.some(unsafe)?'ATTENTION REQUIRED':'ALL SYSTEMS NOMINAL'}</div>${metric('Hull integrity','100%',100)}${metric('Life support',`${r.pressure.toFixed(0)}%`,r.pressure)}${metric('Reactor output',`${(1.6+state.throttle*.044).toFixed(2)} GW`,65+state.throttle*.3,true)}<div class="stat-grid"><div><small>CABIN PRESSURE</small><strong>${(r.pressure*1.013).toFixed(1)}<em>kPa</em></strong></div><div><small>TEMPERATURE</small><strong>${r.temp.toFixed(1)}<em>°C</em></strong></div><div><small>ARTIFICIAL GRAVITY</small><strong>1.00<em>g</em></strong></div><div><small>SIM. VELOCITY</small><strong>${state.speed.toFixed(2)}<em>km/s</em></strong></div></div>`;
    if(state.seat)html+=`<div class="mode-controls"><div class="eyebrow">PILOT AUTHORITY / ACTIVE</div><div class="button-grid"><button class="secondary ${mode==='dock'?'active':''}" data-mode="dock">Station keeping</button><button class="secondary ${mode==='cruise'?'active':''}" data-mode="cruise">Engage cruise</button></div><div class="throttle-label" style="margin-top:16px"><span>THRUST COMMAND</span><span>${state.throttle.toFixed(0)}%</span></div><input class="throttle" type="range" min="0" max="100" value="${state.throttle}" id="throttle" aria-label="Thrust command"><button class="secondary danger" style="width:100%" data-mode="emergency">Emergency lockdown</button></div>`;
    html+=`<div class="panel-footer">${wave}<span>${mode==='dock'?'STATION KEEPING':mode==='cruise'?'CRUISE VECTOR LOCKED':'BULKHEADS SEALED'}</span></div></div>`;
  }else if(state.tab==='systems'){
    html=`<div class="panel-head"><h2>COMPARTMENT SYSTEMS</h2><span class="panel-index">SYS / 02</span></div><div class="panel-body"><div class="eyebrow">SELECT A COMPARTMENT</div><svg class="system-map" viewBox="0 0 240 80" aria-label="Ship compartment diagram"><path d="M9 40H230" stroke="#50656b"/>${roomNames.map((name,i)=>`<g data-select-room="${i}" class="${roomSelected===i?'selected':''} ${unsafe(state.rooms[i])?'fault':''}" tabindex="0" role="button" aria-label="Inspect ${name}"><rect x="${5+i*59}" y="${i===0?18:12}" width="51" height="${i===0?44:56}" rx="${i===0?12:3}"/><text x="${21+i*59}" y="37">0${i+1}</text><text x="${12+i*59}" y="51">${['BRDG','CREW','CRGO','ENGN'][i]}</text></g>`).join('')}</svg><div class="room-details"><div class="eyebrow">DECK 0${roomSelected+1} / ${unsafe(selected)?'ISOLATED':'PRESSURIZED'}</div><h3>${selected.name}</h3><div class="readouts"><span>${selected.pressure.toFixed(0)}% PRESSURE</span><span>${selected.temp.toFixed(1)}°C</span></div>${metric('Containment',unsafe(selected)?'ALERT':'STABLE',selected.pressure,unsafe(selected))}<div class="system-label"><span>${roomSelected===3?'EXTERNAL AIRLOCK':'AFT BULKHEAD'}</span><span>${doorLocked(state,roomSelected)?'LOCKED':state.doors[roomSelected]?'OPEN':'SEALED'}</span></div><button class="secondary" style="width:100%" data-action="door">${doorLocked(state,roomSelected)?'Safety interlock active':state.doors[roomSelected]?'Close bulkhead':'Open bulkhead'}</button><div class="mode-controls"><div class="eyebrow">DIAGNOSTIC CONTROLS</div><div class="button-grid"><button class="secondary danger" data-fault="breach">Pressure breach</button><button class="secondary danger" data-fault="thermal">Thermal vent</button><button class="secondary wide" data-action="repair">${selected.breach||selected.vent?'Seal fault & restore':'Run maintenance cycle'}</button></div><p class="small-note">Faults isolate adjacent rooms. Restore safe conditions to release the interlock.</p></div></div></div>`;
  }else if(state.tab==='drones'){
    html=`<div class="panel-head"><h2>AUTONOMOUS CREW</h2><span class="panel-index">SYS / 03</span></div><div class="panel-body"><div class="eyebrow"><i class="dot"></i>LOCAL CHANNEL / ENCRYPTED</div>${state.drones.map((d,i)=>`<div class="drone-card ${d.health<=0?'dead':''}"><div class="drone-heading">${svg('drone')}<div><strong>${d.name}</strong><small>${d.role} / D0${d.room+1}</small></div><span class="drone-health">${d.health.toFixed(0)}%</span></div>${meter(d.health)}<div class="button-grid"><button class="secondary" data-drone="${i}" ${d.health<=0?'disabled':''}>${state.controlled===i?'Release link':'Take control'}</button><button class="secondary danger" data-damage="${i}" ${d.health<=0?'disabled':''}>Test hit −50</button></div></div>`).join('')}<div class="system-label"><span>UNKNOWN LIFE SIGNS</span><span>${state.intruders.toString().padStart(2,'0')}</span></div><button class="secondary danger" style="width:100%" data-action="intrusion">Simulate boarding</button><p class="small-note">Remote links support WASD and drag-to-look. Damage can destroy the link. Use 3 for a security pulse.</p></div>`;
  }else html=`<div class="panel-head"><h2>MISSION LOG</h2><span class="panel-index">SYS / 04</span></div><div class="panel-body"><div class="eyebrow">SV–7 / LOCAL RECORDER</div>${state.logs.slice(0,12).map(l=>`<div class="log-entry ${l.type}"><time>${timecode(l.time)} / ${l.type.toUpperCase()}</time><p>${escape(l.text)}</p></div>`).join('')}<div class="log-count">${state.logs.length} EVENTS · SESSION LOCAL</div></div>`;
  const p=$('#panel');if(panelHTML!==html&&document.activeElement?.id!=='throttle'){const template=document.createElement('template');template.innerHTML=html;reconcile(p,template.content);panelHTML=html;}
}
function changeView(view){
  if(state.controlled>=0&&view!=='drone'){state.controlled=-1;state.walking=false;}
  state.view=view;state.room=view==='drone'?state.drones[state.controlled].room:({crew:1,cargo:2,engine:3}[view]||0);
  if(['crew','cargo','engine'].includes(view)){state.seat=false;state.walking=false;}
  scene?.setView(view);renderedView=view;renderUI();
}
function renderUI(){
  $('.touch-movement').classList.toggle('hidden',!state.walking&&state.view!=='drone');
  document.querySelectorAll('[data-tab]').forEach(b=>{const active=b.dataset.tab===state.tab;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
  document.querySelectorAll('[data-view]').forEach(b=>{const active=b.dataset.view===state.view||(b.dataset.view==='bridge'&&state.view==='pilot');b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
  document.querySelectorAll('[data-room]').forEach((b,i)=>{const active=i===state.room&&!['port','starboard','front'].includes(state.view);b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
  $('#clock').textContent=timecode(state.elapsed);$('#view-name').textContent=(names[state.view]||'FLIGHT DECK').toUpperCase();
  $('#view-kind').textContent=state.view==='drone'?`AUTONOMOUS SYSTEMS / ${state.drones[state.controlled]?.name||'DISCONNECTED'}`:['port','starboard','front'].includes(state.view)?'HULL-MOUNTED OPTICS / FIXED':'INTERNAL OPTICS / DECK 0'+(state.room+1);
  $('#scene-hint').textContent=['port','starboard','front'].includes(state.view)?'FIXED SENSOR · V TO CYCLE':state.walking||state.view==='drone'?'WASD TO MOVE · DRAG TO LOOK':'DRAG TO LOOK AROUND';
  $('.planet-label').classList.toggle('hidden',!['bridge','pilot','front'].includes(state.view));
  $('#seat-button').innerHTML=`${state.controlled>=0?'Return to crew':state.seat?'Leave pilot seat':state.room>0?(state.walking?'Use nearest bulkhead':'Explore compartment'):'Take pilot seat'} <kbd>E</kbd>`;
  $('#mission-eyebrow').textContent=state.rooms.some(unsafe)?'ONBOARD ALERT / CHECK SYSTEMS':'ASTERION SYSTEM / SECTOR 04';
  const directive=state.mission===2?'Thermal alert in engineering. Seal the vent or send a maintenance drone.':state.mission>=3?'Systems restored. Return to station keeping when ready.':state.mission===1?'Cruise vector confirmed. Monitor ship systems as the Longhaul heads out.':null;
  if(directive)$('#directive').textContent=directive;$('.static-cut').classList.toggle('visible',state.staticUntil>state.elapsed);renderPanel();
}
function useSeat(){
  if(state.controlled>=0){state.controlled=-1;state.walking=false;changeView(state.seat?'pilot':'bridge');announce('Remote link released. Welcome back.');return;}
  if(state.room>0){
    if(!state.walking){state.walking=true;toast('Exploration active. WASD to move, drag to look. E near a bulkhead to pass.');renderUI();return;}
    const z=scene.camera.position.z-state.room*22;if(Math.abs(z)<4.5){toast('Approach a bulkhead at either end of the compartment.');return;}
    const next=state.room+(z>0?1:-1),door=z>0?state.room:state.room-1;if(next>3){toast('External airlock. Use station keeping to release the interlock.');return;}
    if(doorLocked(state,door)){toast('Bulkhead locked. Resolve atmosphere or flight interlock first.');return;}
    state.doors[door]=true;changeView(['bridge','crew','cargo','engine'][next]);state.walking=true;toast(`Entered ${roomNames[next]}.`);return;
  }
  state.seat=!state.seat;state.walking=false;state.tab='flight';changeView(state.seat?'pilot':'bridge');announce(state.seat?'Pilot authority confirmed. The Longhaul is yours.':'Pilot link disengaged. Holding current flight state.');
}
function destroyLink(i){state.drones[i].health=Math.max(0,state.drones[i].health-50);if(state.drones[i].health===0){log(state,`${state.drones[i].name}: unit destroyed. Remote signal lost.`,'warn');if(state.controlled===i){state.controlled=-1;state.staticUntil=state.elapsed+2;changeView(state.seat?'pilot':'bridge');announce('Drone signal lost. Returning to crew channel.','eva_alert');}}}
function toggleAudio(){state.muted=!state.muted;if(state.muted){ambient.pause();voice.stop();}else{const userHum=voice.files.get('ambient_hum');if(userHum){if(ambient.dataset.blob)URL.revokeObjectURL(ambient.dataset.blob);ambient.src=URL.createObjectURL(userHum.blob);ambient.dataset.blob=ambient.src;}ambient.play().catch(()=>toast('Audio playback was blocked. Try the audio button again.'));announce('SV seven Longhaul online. All systems ready.','eva_welcome');}const b=$('header [data-action="audio"]');b.innerHTML=svg(state.muted?'mute':'sound');b.setAttribute('aria-label',state.muted?'Enable audio':'Mute audio');b.title=state.muted?'Enable audio':'Mute audio';b.classList.toggle('active',!state.muted);$('#audio-setting').textContent=state.muted?'Enable audio':'Mute audio';}
app.addEventListener('click',e=>{
  const el=e.target.closest('button,[data-select-room]');if(!el)return;clickSound();
  if(el.dataset.tab){state.tab=el.dataset.tab;renderUI();}if(el.dataset.view)changeView(el.dataset.view==='bridge'&&state.seat?'pilot':el.dataset.view);if(el.dataset.room)changeView(el.dataset.room);
  if(el.dataset.dialog)showDialog(el.dataset.dialog);if(el.hasAttribute('data-close'))el.closest('dialog').close();
  if(el.dataset.selectRoom!==undefined){roomSelected=Number(el.dataset.selectRoom);renderPanel();}
  if(el.dataset.mode){if(setFlight(state,el.dataset.mode)){announce(state.logs[0].text);toast(state.logs[0].text);}else toast('Take the pilot seat before changing flight mode.');renderUI();}
  if(el.dataset.fault){fault(state,roomSelected,el.dataset.fault==='thermal');announce(state.logs[0].text,'eva_alert');renderUI();}
  if(el.dataset.drone!==undefined){const i=Number(el.dataset.drone);if(state.controlled===i){state.controlled=-1;changeView(state.seat?'pilot':'bridge');}else if(state.drones[i].health>0){state.controlled=i;state.walking=true;changeView('drone');announce(`${state.drones[i].name} remote link established.`);}}
  if(el.dataset.damage!==undefined){destroyLink(Number(el.dataset.damage));renderUI();}
  const action=el.dataset.action;if(action==='seat')useSeat();if(action==='audio')toggleAudio();
  if(action==='fullscreen'){if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});else document.documentElement.requestFullscreen?.().catch(()=>toast('Fullscreen is unavailable in this embedded preview. Open it in a new tab.'));}
  if(action==='door'){if(doorLocked(state,roomSelected))toast('Safety interlock: repair the atmosphere or change flight mode.');else{state.doors[roomSelected]=!state.doors[roomSelected];toast(`${roomNames[roomSelected]} bulkhead ${state.doors[roomSelected]?'opened':'sealed'}.`);}renderUI();}
  if(action==='repair'){repair(state,roomSelected);announce(state.logs[0].text,'eva_repair');renderUI();}
  if(action==='intrusion'){state.intruders=Math.min(4,state.intruders+1);log(state,'Unidentified lifeform in cargo bay. Security response requested.','warn');announce(state.logs[0].text,'eva_intrusion');toast('Boarding event detected. Inspect Cargo bay or link to KESTREL.');renderUI();}
  if(action==='test-voice'){if(state.muted)toggleAudio();voice.enqueue('eva_alert','Warning. Atmospheric containment requires attention.');}
  if(action==='clear-voice')voice.clear().then(()=>{if(ambient.dataset.blob){URL.revokeObjectURL(ambient.dataset.blob);delete ambient.dataset.blob;ambient.src=humUrl;if(!state.muted)ambient.play().catch(()=>{});}refreshVoiceList();toast('Local voice library cleared.');}).catch(()=>toast('Unable to clear persistent storage. Check browser site data.'));
});
app.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-move]');if(b){e.preventDefault();b.setPointerCapture(e.pointerId);scene?.setMove(b.dataset.move,true);}});
for(const event of ['pointerup','pointercancel','lostpointercapture'])app.addEventListener(event,e=>{const b=e.target.closest('[data-move]');if(b)scene?.setMove(b.dataset.move,false);});
app.addEventListener('input',e=>{if(e.target.id==='throttle'){state.throttle=Number(e.target.value);$('.throttle-label span:last-child').textContent=state.throttle+'%';}});
app.addEventListener('change',e=>{if(e.target.id==='quality'){state.quality=e.target.value;scene?.quality(state.quality);}});
$('#voice-files').addEventListener('change',async e=>{await voice.add(e.target.files);refreshVoiceList();});
$('#dropzone').addEventListener('dragover',e=>e.preventDefault());$('#dropzone').addEventListener('drop',async e=>{e.preventDefault();await voice.add(e.dataTransfer.files);refreshVoiceList();});
window.addEventListener('keydown',e=>{
  if(e.target.matches('input,select,textarea'))return;if((e.key==='Enter'||e.key===' ')&&e.target.dataset.selectRoom!==undefined){e.preventDefault();roomSelected=Number(e.target.dataset.selectRoom);renderPanel();return;}if(document.querySelector('dialog[open]'))return;
  if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.repeat&&e.code!=='KeyW'&&e.code!=='KeyS')return;
  if(e.code==='KeyE')useSeat();if(e.code==='KeyT'){state.tab=state.tab==='systems'?'flight':'systems';renderUI();}if(e.code==='KeyV'){const views=['bridge','port','starboard','front'];changeView(views[(views.indexOf(state.view)+1)%4]);}if(e.code==='KeyH')showDialog('help');
  if(state.seat&&(e.code==='KeyW'||e.code==='KeyS')){state.throttle=Math.max(0,Math.min(100,state.throttle+(e.code==='KeyW'?2:-2)));renderPanel();}
  if(e.code==='Digit1')toast(`${state.rooms[state.room].name}: ${state.rooms[state.room].pressure.toFixed(0)}% atmosphere, ${state.rooms[state.room].temp.toFixed(1)}°C.`);
  if(e.code==='Digit2'){repair(state,state.room);announce(state.logs[0].text,'eva_repair');renderUI();}
  if(e.code==='Digit3'){if(state.room===2&&state.intruders>0){state.intruders--;log(state,'Security pulse: lifeform contained.','good');toast('Target contained.');}else toast('Security scan clear. No target in this compartment.');renderUI();}
  if(e.code==='Escape'&&state.controlled>=0){state.controlled=-1;changeView(state.seat?'pilot':'bridge');}
});
window.addEventListener('pagehide',()=>{ambient.pause();voice.stop();});document.addEventListener('visibilitychange',()=>{lastFrame=performance.now();if(document.hidden){ambient.pause();voice.stop();}else if(!state.muted)ambient.play().catch(()=>{});});
renderUI();
async function initialize(){try{await document.fonts.ready;scene=createScene($('#scene'),state);window.heliopause={state,scene,version:'0.2.0'};
  function frame(now){const dt=Math.min(.1,(now-lastFrame)/1000);lastFrame=now;if(!document.hidden){tick(state,dt);if(state.view!==renderedView)changeView(state.view);scene.update(dt,state.elapsed);uiAccumulator+=dt;if(uiAccumulator>.3){uiAccumulator=0;renderUI();const newest=state.logs[0],signature=newest.time+newest.text;if(signature!==lastLog&&newest.time>0){lastLog=signature;if(newest.type==='warn')announce(newest.text,'eva_alert');}}}requestAnimationFrame(frame);}
  requestAnimationFrame(frame);setTimeout(()=>$('.load-screen').classList.add('hidden'),350);
}catch(error){console.error(error);$('.load-screen').innerHTML=`<div class="wordmark">HELIOPAUSE</div><div class="error-message">The flight deck requires WebGL2 with hardware acceleration. Enable it in your browser, then reload.<br><br>${escape(error.message)}</div>`;}}
initialize();
