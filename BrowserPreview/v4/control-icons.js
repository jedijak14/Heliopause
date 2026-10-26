// Project-authored, self-contained SVG pictograms. No emoji, font glyphs or network icon service.
const paths={
 forward:'M12 20V4m-6 6 6-6 6 6',back:'M12 4v16m-6-6 6 6 6-6',left:'M20 12H4m6-6-6 6 6 6',right:'M4 12h16m-6-6 6 6-6 6',
 yawLeft:'M18 20v-8a6 6 0 0 0-6-6H4m4-4L4 6l4 4',yawRight:'M6 20v-8a6 6 0 0 1 6-6h8m-4-4 4 4-4 4',
 rollLeft:'M5 8a8 8 0 1 1-1 8M5 3v5h5M8 14l4-3 4 3',rollRight:'M19 8a8 8 0 1 0 1 8m-1-13v5h-5m-6 6 4-3 4 3',
 pitchUp:'M3 19h18M12 15V3m-5 5 5-5 5 5M5 15l7-3 7 3',pitchDown:'M3 5h18m-9 4v12m-5-5 5 5 5-5M5 9l7 3 7-3',
 rise:'M3 20h18M8 15V4m-3 3 3-3 3 3m5 8V4m-3 3 3-3 3 3',descend:'M3 20h18M8 3v12m-3-3 3 3 3-3m5-9v12m-3-3 3 3 3-3',
 brake:'M8 3h8l5 5v8l-5 5H8l-5-5V8Z M9 8v8m6-8v8',
 tablet:'M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z M10 18h4',
 pilot:'M7 3v10a3 3 0 0 0 3 3h9M7 8H4v10h14v3M14 4l5 3-5 3Z',
 hand:'M8 12V5a2 2 0 0 1 4 0v6-8a2 2 0 0 1 4 0v8-5a2 2 0 0 1 4 0v9c0 5-3 7-7 7-3 0-5-2-7-5l-3-4a2 2 0 0 1 3-2l2 2',
 camera:'M3 7h4l2-3h6l2 3h4v14H3Z M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
 light:'M8 3h8l-1 7-2 3v8h-2v-8l-2-3Z M9 7h6',
 run:'M14 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4M5 10l5-3 5 4 5 1m-9-4-2 7-5 5m5-5 6 2 2 5',
 crouch:'M14 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4M14 8l-6 5 7 3-4 5h8M8 13l-4-2m10-3 5 4',
 skip:'M4 4l10 8L4 20Z M19 4v16',close:'M5 5l14 14M5 19 19 5',
 undock:'M3 4v16h7M7 12h14m-5-5 5 5-5 5',navigate:'m12 2 8 20-8-5-8 5Z',sample:'M8 3h8m-6 0v7l-6 9a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-9V3M8 16h8',
 rover:'M3 15V8h12l5 7v3H3Z M6 18v3m11-3v3M9 8V4h6',recall:'M3 9a9 9 0 1 1 0 6M3 3v6h6M12 8v8m-3-3 3 3 3-3',
 board:'M14 3h7v18h-7M3 12h13m-5-5 5 5-5 5',manual:'M12 6V2m-4 4h8M6 10h12l3 10H3Z M9 14v3m6-3v3'
};
export function icon(name){if(!paths[name])throw Error('Unknown control icon: '+name);return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name]}"/></svg>`;}
export const controlIconNames=Object.keys(paths);
