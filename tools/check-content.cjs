const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const normalize = value => value.toString('utf8').replace(/\r\n/g, '\n');
const original = file => execFileSync('git', ['show', `HEAD:${file}`], { maxBuffer: 8 * 1024 * 1024 });
let html = normalize(fs.readFileSync('index.html'));
html = html.replace('<script type="module" src="hero-3d.js"></script>\n', '')
  .replace('<script defer src="project-depth.js"></script>\n', '')
  .replace('<div class="hero-scene" aria-hidden="true"><canvas class="hero-canvas" tabindex="-1"></canvas></div>\n', '');
assert.equal(html, normalize(original('index.html')), 'Original HTML content must remain unchanged');
for (const file of ['script.js', 'tests/portfolio.spec.cjs', 'vendor/gsap.min.js', 'vendor/ScrollTrigger.min.js']) {
  assert.equal(normalize(fs.readFileSync(file)), normalize(original(file)), `${file} must remain unchanged`);
}
assert.deepEqual(fs.readFileSync('Veeresh_Resume_Updated_Dev.pdf'), original('Veeresh_Resume_Updated_Dev.pdf'));
console.log('PASS: original HTML, factual content, links, animation script, existing tests, GSAP assets and resume preserved.');
