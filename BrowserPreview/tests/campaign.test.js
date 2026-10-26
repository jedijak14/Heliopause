import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,tick,repair} from '../src/model.js';
import {freshExpedition,action,selectTarget,restoreExpedition,saveExpedition,loadExpedition,pendingCredits} from '../src/exploration.js';
import {startCampaign,campaignCommand,validateCampaign} from '../src/campaign.js';
const state=()=>({...createState(),expedition:freshExpedition()});
function advance(s,predicate,seconds=300){for(let i=0;i<seconds*10&&!predicate();i++)tick(s,.1);assert.ok(predicate(),`timeout at campaign step ${s.expedition.campaign.step}: ${s.expedition.message}`);}
function cues(s){s.expedition.campaign.pending=[];}
function travel(s,index){selectTarget(s.expedition,index);assert.ok(action(s.expedition,'navigate'));advance(s,()=>!s.expedition.autopilot);}
function recover(s){assert.ok(action(s.expedition,'scan'));advance(s,()=>!s.expedition.scanning,10);assert.ok(action(s.expedition,'recover'));tick(s,.1);cues(s);}
test('complete campaign from awakening to ending, with continuous travel and free exploration after credits',()=>{
 const s=state();startCampaign(s);const c=s.expedition.campaign;cues(s);assert.equal(c.step,0);assert.equal(c.shadeOpen,false);
 campaignCommand(s,'tablet');tick(s,.1);cues(s);assert.equal(c.step,1);
 campaignCommand(s,'lights');tick(s,.1);assert.equal(c.step,2);
 assert.equal(campaignCommand(s,'handprint'),false);s.room=1;assert.ok(campaignCommand(s,'handprint'));advance(s,()=>c.step===3,3);cues(s);
 assert.equal(c.step,3);campaignCommand(s,'shade');tick(s,.1);assert.equal(c.step,4);s.seat=true;
 campaignCommand(s,'entry');cues(s);advance(s,()=>c.step===6,160);assert.ok(c.thermalLock);assert.equal(c.shadeOpen,false);cues(s);assert.ok(s.rooms[3].vent);
 repair(s,3);advance(s,()=>c.step===7,100);assert.ok(campaignCommand(s,'climb'));advance(s,()=>c.step===8,160);cues(s);assert.ok(c.altitude>=399);
 travel(s,4);recover(s);assert.equal(c.step,9);travel(s,8);recover(s);assert.equal(c.step,10);travel(s,0);assert.ok(action(s.expedition,'dock'));assert.ok(action(s.expedition,'board'));assert.ok(action(s.expedition,'sell'));tick(s,.1);assert.equal(c.step,11);assert.equal(c.complete,true);assert.deepEqual(c.pending,['eva_final']);assert.equal(s.expedition.credits,1280);
 action(s.expedition,'return');action(s.expedition,'undock');travel(s,5);assert.equal(c.step,11);
});
test('survey-first sale cannot lock out the campaign artifact or pay twice',()=>{const s=state(),e=s.expedition;e.scanned=[4];e.onStation=true;assert.ok(action(e,'sell'));assert.equal(e.credits,280);e.docked=-1;e.onStation=false;e.target=4;e.position=[24,-3,-53.5];assert.ok(action(e,'recover'));assert.equal(pendingCredits(e),250);e.docked=0;e.onStation=true;action(e,'sell');assert.equal(e.credits,530);assert.equal(action(e,'sell'),false);});
test('menu/cinematic pause and mid-prologue reload cannot softlock campaign',()=>{const s=state();startCampaign(s);cues(s);s.inMenu=true;tick(s,1);assert.equal(s.elapsed,0);s.inMenu=false;s.inCutscene=true;tick(s,1);assert.equal(s.elapsed,0);s.inCutscene=false;const c=s.expedition.campaign;c.step=5;c.altitude=130;const e=restoreExpedition(JSON.stringify(s.expedition));assert.ok(e);s.expedition=e;startCampaign(s,true);assert.equal(e.campaign.autopilot,'entry');advance(s,()=>e.campaign.step===6,100);});
test('storage exceptions and malicious campaign numbers fail safely',()=>{const storage={setItem(){throw Error('blocked')},getItem(){throw Error('blocked')}};assert.equal(saveExpedition(freshExpedition(),storage),false);assert.equal(loadExpedition(storage),null);assert.equal(validateCampaign({version:1,step:4,altitude:Infinity}).altitude,400);});
