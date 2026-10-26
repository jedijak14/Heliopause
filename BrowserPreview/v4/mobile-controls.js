import {icon} from './control-icons.js';
import {touchDevice,saveDisplay} from './display-settings.js';
export function mountMobileControls({canvas,keys,state,look,zoom,actions,settings,onDisplayChange}){
 const root=document.createElement('div');root.id='mobileControls';root.setAttribute('aria-label','Touch movement and flight controls');document.body.append(root);
 const held=new Map(),views=new Map();let context='',lastDistance=0;
 const enabled=()=>settings.touch==='on'||(settings.touch==='auto'&&touchDevice());
 function release(id){const hold=held.get(id);if(!hold)return;held.delete(id);keys[hold.key]=[...held.values()].some(h=>h.key===hold.key);hold.button.classList.toggle('pressed',[...held.values()].some(h=>h.button===hold.button));}
 function clear(){for(const id of [...held.keys()])release(id);views.clear();lastDistance=0;}
 const markup=(key,pictogram,label)=>`<button type="button" data-hold="${key}" aria-label="${label}" title="${label}">${icon(pictogram)}<span>${label}</span></button>`;
 function actionButton(name,pictogram,label){return `<button type="button" data-touch-action="${name}" aria-label="${label}" title="${label}">${icon(pictogram)}<span>${label}</span></button>`;}
 const skip=document.createElement('button');skip.id='touchSkip';skip.type='button';skip.innerHTML=icon('skip')+'<span>Skip scene</span>';skip.setAttribute('aria-label','Skip cutscene');skip.onclick=()=>actions.skip();document.body.append(skip);
 for(const [id,pictogram,label]of [['quickTablet','tablet','Tablet'],['quickPilot','pilot','Pilot'],['quickInteract','hand','Interact']]){const b=document.getElementById(id);b.innerHTML=icon(pictogram)+`<span>${label}</span>`;b.setAttribute('aria-label',label);}
 const quality=document.getElementById('displayQuality'),touch=document.getElementById('touchPreference'),sensitivity=document.getElementById('lookSensitivity');
 quality.value=String(settings.scale);touch.value=settings.touch;sensitivity.value=String(settings.sensitivity);
 function preferences(){settings.scale=Number(quality.value);settings.touch=touch.value;settings.sensitivity=Number(sensitivity.value);saveDisplay(settings);clear();onDisplayChange();sync();}
 for(const el of [quality,touch,sensitivity])el.addEventListener('input',preferences);
 for(const [selector,pictogram,label]of [['[data-flight="undock"]','undock','Undock'],['[data-flight="navigate"]','navigate','Autopilot'],['[data-flight="manual"]','manual','Manual'],['[data-flight="brake"]','brake','Brake'],['[data-surface="sample"]','sample','Sample'],['[data-surface="rover"]','rover','Skimmer'],['[data-surface="recall"]','recall','Pickup'],['[data-surface="ascend"]','board','Reboard']]){const b=document.querySelector(selector);if(b){b.innerHTML=icon(pictogram)+`<span>${label}</span>`;b.setAttribute('aria-label',label);}}
 function sync(){const s=state(),active=enabled();document.body.classList.toggle('touch-ui',active);document.body.classList.toggle('touch-panel',active&&s.tab);document.body.classList.toggle('touch-playing',active&&s.mode==='play');skip.hidden=!active||!['cut','scene'].includes(s.mode);root.hidden=!active||s.mode!=='play'||s.tab;
  const next=[active,s.mode,s.tab,s.pilot,s.camera].join(':');if(next===context)return;clear();context=next;const tablet=document.getElementById('quickTablet');tablet.innerHTML=icon(s.tab?'close':'tablet')+`<span>${s.tab?'Close':'Tablet'}</span>`;tablet.setAttribute('aria-label',s.tab?'Close tablet':'Tablet');
  if(root.hidden)return;
  root.innerHTML=`<div class="move-pad" role="group" aria-label="${s.pilot?'Thrust and yaw':'Walk'}">${markup('KeyW','forward',s.pilot?'Forward':'Walk')}${markup('KeyA',s.pilot?'yawLeft':'left',s.pilot?'Yaw left':'Left')}${markup('KeyS','back','Reverse')}${markup('KeyD',s.pilot?'yawRight':'right',s.pilot?'Yaw right':'Right')}</div><div class="trim-pad" role="group" aria-label="${s.pilot?'Flight attitude':'Crew actions'}">${s.pilot?markup('KeyR','pitchUp','Pitch up')+markup('KeyF','pitchDown','Pitch down')+markup('KeyQ','rollLeft','Roll left')+markup('KeyE','rollRight','Roll right')+markup('ShiftLeft','rise','Rise')+markup('ControlLeft','descend','Descend')+markup('KeyZ','left','Strafe left')+markup('KeyX','right','Strafe right')+markup('KeyB','brake','Brake'):markup('ShiftLeft','run','Run')+markup('KeyC','crouch','Crouch')+actionButton('flash','light','Light')}${actionButton('camera','camera','Camera')}</div>`;
 }
 root.addEventListener('pointerdown',e=>{const button=e.target.closest('[data-hold]');if(!button||root.hidden)return;e.preventDefault();button.setPointerCapture(e.pointerId);held.set(e.pointerId,{key:button.dataset.hold,button});keys[button.dataset.hold]=true;button.classList.add('pressed');if(button.dataset.hold==='KeyB')actions.brake();});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])root.addEventListener(name,e=>release(e.pointerId));
 root.addEventListener('click',e=>{const name=e.target.closest('[data-touch-action]')?.dataset.touchAction;if(name)actions[name]();sync();});
 const distance=()=>{const a=[...views.values()];return a.length<2?0:Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);};
 canvas.addEventListener('pointerdown',e=>{const s=state();if(e.pointerType!=='touch'||!enabled()||s.tab||s.mode!=='play'||![0,4].includes(s.camera))return;e.preventDefault();canvas.setPointerCapture(e.pointerId);views.set(e.pointerId,[e.clientX,e.clientY]);lastDistance=distance();});
 canvas.addEventListener('pointermove',e=>{const previous=views.get(e.pointerId);if(!previous)return;e.preventDefault();views.set(e.pointerId,[e.clientX,e.clientY]);if(state().camera===4&&views.size>1){const d=distance();if(lastDistance&&d)zoom(lastDistance/d);lastDistance=d;}else if(views.size===1)look(e.clientX-previous[0],e.clientY-previous[1],settings.sensitivity);});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>{views.delete(e.pointerId);lastDistance=distance();});
 addEventListener('blur',clear);addEventListener('resize',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});sync();
 return {sync,clear,refreshQuality(){quality.value=String(settings.scale);},get held(){return [...held.values()].map(h=>h.key);}};
}
