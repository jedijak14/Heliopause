'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
require('../BrowserVoice/voice.js');
function harness(voices = [{localService:true,lang:'en-US',name:'Offline'}]) {
  const calls = [], timers = new Map(); let id = 0;
  const env = {
    setTimeout: fn => { timers.set(++id, fn); return id; }, clearTimeout: i => timers.delete(i),
    URL: { createObjectURL: () => 'blob:local', revokeObjectURL: u => calls.push(['revoke',u]) },
    Audio: class { constructor(url) { this.url=url; env.lastAudio=this; } play() { calls.push(['audio']); } pause() { calls.push(['pause']); } },
    SpeechSynthesisUtterance: class { constructor(text) { this.text=text; } },
    speechSynthesis: { getVoices: () => voices, speak: u => { calls.push(['speech',u]); }, cancel: () => calls.push(['cancel']) }
  };
  const voice = new HelioLocalVoice(env); return { voice, env, calls, timers };
}
test('local filename wins over native voice; playback revokes blob URL', async () => {
  const {voice,env,calls}=harness();
  await voice.add([{name:'EVA_ALERT.mp3',size:1024}]); voice.enqueue('eva_alert','Alert');
  assert.equal(calls.filter(c=>c[0]==='audio').length,1);
  assert.equal(calls.filter(c=>c[0]==='speech').length,0);
  env.lastAudio.onended(); assert.ok(calls.some(c=>c[0]==='revoke')); assert.equal(voice.active,null);
});
test('missing media uses only installed local voices', () => {
  const {voice,calls}=harness(); voice.enqueue('missing','Pressure low');
  assert.equal(calls.find(c=>c[0]==='speech')[1].text,'Pressure low');
  const remote=harness([{localService:false,lang:'en-US',name:'Cloud'}]); remote.voice.enqueue('missing','Alert');
  assert.equal(remote.calls.filter(c=>c[0]==='speech').length,0);
});
test('queue bounded and duplicates suppressed; stop invalidates old callbacks', () => {
  const {voice,calls}=harness(); voice.enqueue('first','First');
  const old=calls.find(c=>c[0]==='speech')[1].onend;
  for(let i=0;i<30;i++) voice.enqueue('event'+i,'Text'+i);
  assert.equal(voice.queue.length,8); voice.enqueue('event29','Text29'); assert.equal(voice.queue.length,8);
  voice.stop(); old(); assert.equal(voice.queue.length,0); assert.equal(voice.active,null);
});
test('corrupt media falls back once and cleans up', async () => {
  const {voice,env,calls}=harness(); await voice.add([{name:'eva_alert.wav',size:25}]);
  voice.enqueue('eva_alert','Fallback'); const fail=env.lastAudio.onerror; fail(); fail();
  assert.equal(calls.filter(c=>c[0]==='speech').length,1); assert.equal(calls.filter(c=>c[0]==='revoke').length,1);
});
test('file and total byte limits prevent unbounded cache growth', async () => {
  const {voice}=harness();
  await voice.add([{name:'x.exe',size:1},{name:'big.wav',size:17*1024*1024},{name:'empty.wav',size:0}]);
  assert.equal(voice.files.size,0);
  await voice.add(Array.from({length:8},(_,i)=>({name:`sound${i}.wav`,size:16*1024*1024})));
  assert.equal(voice.files.size,4);
});
test('clear removes active playback and in-memory index', async () => {
  const {voice}=harness(); await voice.add([{name:'eva_alert.wav',size:25}]); voice.enqueue('eva_alert','Alert');
  await voice.clear(); assert.equal(voice.active,null); assert.equal(voice.files.size,0);
});
