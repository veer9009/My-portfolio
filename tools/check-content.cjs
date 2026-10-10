const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const normalize = value => value.toString('utf8').replace(/\r\n/g, '\n');
const original = file => execFileSync('git', ['show', `HEAD:${file}`], { maxBuffer: 8 * 1024 * 1024 });
let html = normalize(fs.readFileSync('index.html'));
html = html.replace('<script type="module" src="av-intro.js"></script>\n', '')
  .replace(/<div class="av-intro" hidden>\n[\s\S]*?<\/div>\n(?=<a class="skip-link")/, '');
assert.equal(html, normalize(original('index.html')), 'Original HTML content must remain unchanged');
assert.ok(normalize(fs.readFileSync('styles.css')).startsWith(normalize(original('styles.css'))), 'Existing portfolio styles must remain unchanged');
for (const file of ['script.js', 'hero-3d.js', 'hero-scene.js', 'project-depth.js', 'tests/portfolio.spec.cjs', 'vendor/three.module.min.js', 'vendor/three.core.min.js', 'vendor/gsap.min.js', 'vendor/ScrollTrigger.min.js']) {
  assert.equal(normalize(fs.readFileSync(file)), normalize(original(file)), `${file} must remain unchanged`);
}
assert.deepEqual(fs.readFileSync('Veeresh_Resume_Updated_Dev.pdf'), original('Veeresh_Resume_Updated_Dev.pdf'));
console.log('PASS: existing HTML, styles, content, links, Phase 1 scenes, animation scripts, vendor libraries, portfolio tests and resume preserved.');
