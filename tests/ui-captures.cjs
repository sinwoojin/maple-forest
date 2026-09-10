'use strict';
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage(),
      errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(process.env.BASE_URL || 'http://127.0.0.1:8765');
    await page.waitForFunction(() => Game.UI.settings);
    const out = process.env.ARTIFACT_DIR || 'test-artifacts';
    fs.mkdirSync(out, { recursive: true });
    for (const [width, height] of [
      [360, 800],
      [390, 844],
      [844, 390]
    ]) {
      await page.setViewportSize({ width, height });
      for (const menu of ['settings', 'inventory', 'codex']) {
        await page.evaluate(menu => {
          Game.UI.close();
          if (menu === 'inventory') Game.awardItem('warrior-2');
          if (menu === 'codex') Game.UI.archive('codex');
          else Game.UI[menu]();
        }, menu);
        await page.evaluate(() => {
          const modal = document.getElementById('modal-body');
          modal.scrollTop = modal.scrollHeight;
          const list = document.querySelector('.inventory-list');
          if (list) list.scrollTop = list.scrollHeight;
        });
        await page.screenshot({ path: `${out}/ui-${width}-${menu}-bottom.png` });
      }
      await page.evaluate(() => {
        Game.UI.close();
        Game.startAdventure();
        Game.startRun({ seed: 444, build: 'counter' });
        Game.enterEncounter('elite');
        Game.p.x = 650;
        Game.paused = true;
        Game.enemies[0].x = 730;
        Game.enemies[0].elite = true;
        Game.warn(Game.enemies[0], 'charge', 650, 610, 115, 10, 1);
        Game.refresh();
      });
      await page.screenshot({ path: `${out}/ui-${width}-danger-elite.png` });
    }
    assert.deepEqual(errors, []);
    console.log('PASS final scrolled menu and mobile hazard/elite captures; no errors');
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
