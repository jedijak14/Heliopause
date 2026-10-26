import script from '../../Shared/story.json' with { type:'json' };
export const storyLines=Object.fromEntries(script.lines.map(l=>[l.id,l]));
export const objectives=[
 'Open your tablet — T or Ship systems.',
 'Switch on the crew-quarters lights in Ship systems.',
 'Go to crew quarters and complete the handprint scan.',
 'Open the crew-quarters thermal curtain.',
 'Take the pilot seat. Flight → Entry survey.',
 'Complete the atmospheric survey. EVA controls the thermal shades.',
 'Seal the engine-room thermal vent using repair controls or MENDER.',
 'Flight → Climb to orbit. Return to 400 km.',
 'Navigate to Kestrel Wreck. Survey it and recover its recorder.',
 'Navigate to Pilgrim Vault. Survey it and recover the archive.',
 'Dock at Asterion Anchorage. Walk to the exchange and archive both discoveries.',
 'A Long Way Home — story complete. Free exploration is available.'
];
export function freshCampaign(){return {version:1,mode:'free',started:false,step:0,tablet:false,lights:[true,false,true,true],shadeOpen:false,shadeMemory:false,handprint:false,scanTime:-1,altitude:400,velocity:7640,pitch:0,targetPitch:0,heat:0,thermalLock:false,autopilot:'manual',surveyTime:0,surveyed:false,engineIncident:false,complete:false,pending:[]};}
export function validateCampaign(c){if(!c||c.version!==1||!Number.isInteger(c.step)||c.step<0||c.step>11)return freshCampaign();const out={...freshCampaign(),...c,pending:[],scanTime:-1,autopilot:'manual'};out.lights=Array.isArray(c.lights)&&c.lights.length===4?c.lights.map(Boolean):[true,false,true,true];for(const [k,lo,hi]of [['altitude',55,40000],['velocity',1500,9000],['pitch',-15,15],['targetPitch',-15,15],['heat',0,1],['surveyTime',0,20]])out[k]=Number.isFinite(c[k])?Math.max(lo,Math.min(hi,c[k])):freshCampaign()[k];out.mode=c.mode==='story'?'story':'free';out.complete=out.step===11;return out;}
export function startCampaign(s,resume=false){const e=s.expedition;if(!resume||!e.campaign?.started)e.campaign=freshCampaign();const c=e.campaign;c.mode='story';c.started=true;if(!resume)c.pending=['eva_intro'];if(c.step<8){e.docked=-1;e.onStation=false;e.autopilot=false;e.velocity=[0,0,0];}if(resume&&c.step===5)c.autopilot=c.altitude<=61?'hold':'entry';if(resume&&c.step===6)s.rooms[3].vent=true;if(resume&&c.step===7)c.altitude=Math.min(c.altitude,398);s.throttle=0;s.mode='hold';}
export function campaignCommand(s,type){const c=s.expedition?.campaign;if(!c)return false;
 if(type==='tablet'){c.tablet=true;return true;}
 if(type==='lights'){c.lights[1]=!c.lights[1];return true;}
 if(type==='handprint'){if(c.scanTime>=0||!c.lights[1]||s.room!==1)return false;c.scanTime=0;return true;}
 if(type==='shade'){if(c.thermalLock)return false;c.shadeOpen=!c.shadeOpen;return true;}
 if(type==='entry'){if(!s.seat||c.altitude<=61||(c.mode==='story'&&c.step!==4&&c.step!==5))return false;c.autopilot='entry';s.expedition.autopilot=false;s.mode='hold';if(c.mode==='story'&&c.step===4)c.pending.push('eva_entry');return true;}
 if(type==='climb'){if(!s.seat||c.altitude>=399||s.rooms[3].vent||(c.mode==='story'&&c.step!==7))return false;c.autopilot='climb';return true;}
 return false;
}
export function tickCampaign(s,dt){const c=s.expedition?.campaign;if(!c||s.inCutscene||s.inMenu)return;dt=Math.max(0,Math.min(.1,dt));
 if(c.scanTime>=0){c.scanTime+=dt;if(c.scanTime>=1.3){c.scanTime=-1;c.handprint=true;s.doors[0]=true;}}
 let warp=1;
 if(c.autopilot==='entry'){c.targetPitch=-6;warp=12;if(c.altitude<=60.5){c.altitude=60;c.autopilot='hold';c.surveyTime=0;}}
 if(c.autopilot==='climb'){c.targetPitch=8;warp=12;c.velocity=Math.min(7640,c.velocity+dt*warp*40);if(c.altitude>=400){c.altitude=400;c.autopilot='manual';c.targetPitch=0;}}
 if(c.autopilot==='hold'){c.targetPitch=0;warp=4;c.surveyTime+=dt;if(c.surveyTime>=5)c.surveyed=true;}
 c.pitch+=(c.targetPitch-c.pitch)*Math.min(1,dt*.9);const density=c.altitude<140?Math.exp(-(c.altitude-60)/25):0;
 if(c.autopilot!=='climb')c.velocity=Math.max(1800,c.velocity-density*c.velocity*.012*dt*warp);
 if(c.autopilot==='entry'||c.autopilot==='climb')c.altitude=Math.max(55,Math.min(40000,c.altitude+c.velocity*Math.sin(c.pitch*Math.PI/180)/1000*dt*warp));
 c.heat+=(Math.min(1,density*(c.velocity/7640)**2*1.5)-c.heat)*Math.min(1,dt*.6);
 if(c.heat>.35&&!c.thermalLock){c.thermalLock=true;c.shadeMemory=c.shadeOpen;c.shadeOpen=false;}
 if(c.heat<.15&&c.thermalLock){c.thermalLock=false;c.shadeOpen=c.shadeMemory;}
 if(c.mode!=='story'||c.complete||c.pending.length)return;
 const e=s.expedition;
 const conditions=[c.tablet,c.lights[1],c.handprint,c.shadeOpen,c.autopilot==='entry',c.surveyed,!s.rooms[3].vent&&s.rooms[3].temp<65,c.altitude>=399&&c.autopilot==='manual',e.recovered.includes(4),e.recovered.includes(8),(e.artifactSold||[]).includes(4)&&(e.artifactSold||[]).includes(8)&&e.docked===0];
 if(!conditions[c.step])return;const previous=c.step;c.step++;
 const events={0:'eva_quarters',2:'eva_view',5:'eva_hold',7:'eva_departure',8:'eva_discovery',9:'eva_return',10:'eva_final'};
 if(events[previous])c.pending.push(events[previous]);
 if(previous===5){s.rooms[3].vent=true;c.engineIncident=true;c.pending.push('eva_repair');}
 if(previous===7){e.docked=-1;e.target=4;e.position=[45,-12,-129.5];e.velocity=[0,0,0];}
 if(previous===8)e.target=8;if(previous===9)e.target=0;
 if(c.step===11)c.complete=true;
}
