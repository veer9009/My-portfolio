# Aligar Veeresh — Portfolio

A static HTML, CSS and GSAP portfolio. The original resume is unchanged. GSAP and ScrollTrigger are served locally from `vendor/`, so production needs no package installation or build step.

## Run locally

With Node.js installed, run `npm.cmd start` on Windows (or `npm start` elsewhere), then open http://127.0.0.1:4173.

## Verify

Run `npm.cmd ci --cache .npm-cache` then `npm.cmd test`. Tests use installed Google Chrome and cover six viewport widths, browser errors, animations, reduced motion, no JavaScript, mobile navigation, and resume downloads.

## Deploy

Upload `index.html`, `styles.css`, `script.js`, `favicon.svg`, the `vendor/` directory, and `Veeresh_Resume_Updated_Dev.pdf` to the existing static host for veereshdev.online. No server application is required. Fonts are hosted locally with their licenses; system font fallbacks remain available.

## Content and motion

Content was verified against the original HTML and PDF. WallOra, ReelWeave and Ansible were omitted because the supplied source does not explicitly establish those projects or that technology. The AWS Cloud Architect MicroDegree item is professional development, not an AWS-issued certification. The delivery pipeline is conceptual. Its terminal commands do not report deployment success.

Motion uses GSAP matchMedia with context cleanup. Reduced-motion users see static content. Mobile disables background parallax. Decorative pipeline motion pauses offscreen and when the tab is hidden. Horizontal scrolling and section pinning are intentionally unnecessary for the single verified personal project. Word reveals preserve heading text and semantics.
