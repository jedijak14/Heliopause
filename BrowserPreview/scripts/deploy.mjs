// Publish only the verified, self-contained browser preview, never Unreal source/user files.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const preview = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(preview, '..');
const html = fs.readFileSync(path.join(preview, 'heliopause.html'));
const expected = fs.readFileSync(path.join(preview, 'heliopause.html.sha256'), 'utf8').trim().split(/\s+/)[0];
const actual = crypto.createHash('sha256').update(html).digest('hex');
if (actual !== expected) throw new Error('Standalone HTML checksum mismatch. Rebuild with npm run build in BrowserPreview.');
const output = path.join(root, 'site');
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'index.html'), html);
fs.writeFileSync(path.join(output, 'heliopause.html'), html);
for (const file of ['heliopause.html.sha256', 'THIRD_PARTY_NOTICES.txt']) fs.copyFileSync(path.join(preview, file), path.join(output, file));
console.log(`Verified and published HELIOPAUSE HTML (${html.length} bytes). SHA-256: ${actual}`);
