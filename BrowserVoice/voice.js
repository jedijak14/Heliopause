/* Offline only: no fetch, endpoints, CDNs or remote speech voices. */
(function (scope) {
  'use strict';
  const LIMIT = 16 * 1024 * 1024, TOTAL = 64 * 1024 * 1024;
  const keyOf = name => name.replace(/\.(mp3|wav|ogg)$/i, '').toLowerCase();
  class LocalVoice {
    constructor(env = scope) {
      this.env = env; this.files = new Map(); this.queue = [];
      this.active = null; this.generation = 0; this.db = null;
      this.onstatus = () => {}; this.onsubtitle = () => {};
    }
    async open() {
      if (!this.env.indexedDB) return false;
      try {
        this.db = await new Promise((resolve, reject) => {
          const r = this.env.indexedDB.open('heliopause-local-voice', 1);
          r.onupgradeneeded = () => r.result.createObjectStore('files', { keyPath: 'key' });
          r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
        });
        const rows = await new Promise((resolve, reject) => {
          const r = this.db.transaction('files').objectStore('files').getAll();
          r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
        });
        for (const row of rows) this.files.set(row.key, row);
        return true;
      } catch (_) { this.onstatus('Local persistence unavailable. Files work for this session.'); return false; }
    }
    async save(row) {
      if (!this.db) return;
      try {
        await new Promise((resolve, reject) => {
          const tx = this.db.transaction('files', 'readwrite');
          tx.objectStore('files').put(row); tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
        });
      } catch (_) { this.onstatus('Storage quota reached. This file is available for this session only.'); }
    }
    async add(files) {
      for (const blob of files) {
        if (!/\.(wav|mp3|ogg)$/i.test(blob.name) || blob.size > LIMIT || !blob.size) continue;
        const key = keyOf(blob.name);
        const used = [...this.files.values()].reduce((sum, f) => sum + f.blob.size, 0) - (this.files.get(key)?.blob.size || 0);
        if (used + blob.size > TOTAL) { this.onstatus('64 MB index limit reached.'); break; }
        const row = { key, name: blob.name, blob }; this.files.set(key, row); await this.save(row);
      }
    }
    enqueue(key, text) {
      if (this.queue.some(e => e.key === key && e.text === text)) return;
      if (this.queue.length >= 8) this.queue.shift();
      this.queue.push({ key: key.toLowerCase(), text }); this.pump();
    }
    pump() {
      if (this.active || !this.queue.length) return;
      const event = this.queue.shift(), generation = this.generation;
      this.onsubtitle(event.text);
      const token = { timer: null, audio: null, url: null, utterance: null };
      this.active = token;
      const finish = () => {
        if (generation !== this.generation || this.active !== token) return;
        this.cleanup(token); this.active = null; this.pump();
      };
      const speak = () => {
        if (generation !== this.generation || this.active !== token || token.fallbackStarted) return;
        token.fallbackStarted = true;
        if (token.audio) { token.audio.pause(); token.audio.onended = token.audio.onerror = null; token.audio = null; }
        if (token.url) { this.env.URL.revokeObjectURL(token.url); token.url = null; }
        const synth = this.env.speechSynthesis;
        const voice = synth?.getVoices().find(v => v.localService && /^en(?:-|$)/i.test(v.lang)) || synth?.getVoices().find(v => v.localService);
        if (!voice || !this.env.SpeechSynthesisUtterance) {
          this.onstatus('No installed local voice exposed by this browser. Subtitles remain available.');
          token.timer = this.env.setTimeout(finish, 2500); return;
        }
        const utterance = new this.env.SpeechSynthesisUtterance(event.text);
        token.utterance = utterance; utterance.voice = voice; utterance.lang = voice.lang;
        utterance.onend = utterance.onerror = finish;
        this.onstatus('Speaking with installed local voice: ' + voice.name);
        token.timer = this.env.setTimeout(() => { synth.cancel(); finish(); }, 45000);
        try { synth.speak(utterance); } catch (_) { finish(); }
      };
      const file = this.files.get(event.key);
      if (!file) { speak(); return; }
      token.url = this.env.URL.createObjectURL(file.blob);
      const audio = new this.env.Audio(token.url); token.audio = audio;
      audio.onended = finish; audio.onerror = speak;
      this.onstatus('Playing local file: ' + file.name);
      token.timer = this.env.setTimeout(() => { audio.pause(); finish(); }, 120000);
      const failure = () => { this.env.clearTimeout(token.timer); token.timer = null; speak(); };
      audio.onerror = failure;
      try { const play = audio.play(); if (play?.catch) play.catch(failure); } catch (_) { failure(); }
    }
    cleanup(token) {
      this.env.clearTimeout(token.timer);
      if (token.audio) { token.audio.onended = token.audio.onerror = null; token.audio.pause(); }
      if (token.utterance) token.utterance.onend = token.utterance.onerror = null;
      if (token.url) this.env.URL.revokeObjectURL(token.url);
    }
    stop() {
      this.generation++; this.queue.length = 0;
      if (this.active) this.cleanup(this.active);
      this.active = null; this.env.speechSynthesis?.cancel();
    }
    async clear() {
      this.stop(); this.files.clear();
      if (this.db) await new Promise((resolve, reject) => {
        const tx = this.db.transaction('files', 'readwrite'); tx.objectStore('files').clear();
        tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
      });
    }
  }
  scope.HelioLocalVoice = LocalVoice;
})(globalThis);
