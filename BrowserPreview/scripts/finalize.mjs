import fs from 'node:fs';
import crypto from 'node:crypto';
const license=fs.readFileSync('THIRD_PARTY_NOTICES.txt','utf8').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const html=fs.readFileSync('build/index.html','utf8').replace('</body>',`<template id="third-party-notices"><pre>${license}</pre></template></body>`);
fs.writeFileSync('heliopause.html',html);
const hash=crypto.createHash('sha256').update(html).digest('hex');
fs.writeFileSync('heliopause.html.sha256',`${hash}  heliopause.html\n`);
console.log(`Standalone preview saved: ${(Buffer.byteLength(html)/1024/1024).toFixed(2)} MiB; licenses embedded.\nSHA-256: ${hash}`);
