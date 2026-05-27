#!/usr/bin/env node
/**
 * Generate the Pet Filter poster (1080×1080 PNG) by puppeteering the
 * dev server's /poster.html and writing the result into the games
 * registry posters/ folder.
 *
 * Per feedback_splash_poster_render.md: viewport = output/2 + dsf=2
 * so CSS clamps don't collapse at full output dims.
 */
import puppeteer from 'puppeteer';

const URL = process.argv[2] || 'http://localhost:5183/pet-filter/poster.html';
const OUT = process.argv[3] || '/Users/yin/code/games/games/posters/pet-filter.png';
const W = 540, H = 540, DSF = 2;

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: DSF });
  console.log('  navigating…');
  await page.goto(URL, { waitUntil: 'load', timeout: 20000 });
  console.log('  loaded — waiting for fonts + images');
  await new Promise((r) => setTimeout(r, 2500));
  console.log('  screenshotting…');
  await page.screenshot({
    path: OUT,
    type: 'png',
    fullPage: false,
    captureBeyondViewport: false,
  });
  console.log(`✓ ${OUT}`);
} catch (err) {
  console.error('FAILED:', err.message);
  throw err;
} finally {
  await browser.close();
}
