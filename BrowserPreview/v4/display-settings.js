export const DISPLAY_KEY='heliopause-display-v1';
export const QUALITY_LEVELS=[.2,.35,.4,.55,.75,1];
export function touchDevice(){return (globalThis.navigator?.maxTouchPoints||0)>0||!!globalThis.matchMedia?.('(any-pointer: coarse)').matches;}
export function normalizeDisplay(raw={},touch=false){return {scale:QUALITY_LEVELS.includes(Number(raw.scale))?Number(raw.scale):(touch?.55:1),touch:['auto','on','off'].includes(raw.touch)?raw.touch:'auto',sensitivity:Number.isFinite(Number(raw.sensitivity))?Math.max(.4,Math.min(1.6,Number(raw.sensitivity))):.8};}
export function loadDisplay(storage,touch=touchDevice()){try{return normalizeDisplay(JSON.parse((storage??globalThis.localStorage).getItem(DISPLAY_KEY))||{},touch);}catch{return normalizeDisplay({},touch);}}
export function saveDisplay(value,storage){try{(storage??globalThis.localStorage).setItem(DISPLAY_KEY,JSON.stringify(value));}catch{/* Private browsing and denied storage must not prevent play. */}}
export function rasterSize(width,height,dpr,scale,touch,softwareLimit=1){const ratio=Math.min(dpr||1,touch?1:1.5)*Math.min(scale,softwareLimit);return [Math.max(2,Math.floor(width*ratio)),Math.max(2,Math.floor(height*ratio))];}
