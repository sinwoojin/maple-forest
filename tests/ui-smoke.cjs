'use strict';
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
(async () => {
  const browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL || 'chrome',
    headless: true
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } }),
      errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.BASE_URL || 'http://127.0.0.1:8765');
    await page.waitForFunction(() => window.Game?.UI?.runDashboard);
    await page.locator('#expedition-start').click();
    assert.equal(await page.getByRole('button', { name: '저장된 원정 재개' }).count(), 0);
    await page.getByRole('button', { name: '새 원정 시작', exact: true }).click();
    await page.locator('.job-card.warrior').click();
    assert.equal(await page.locator('.reward-card').count(), 3);
    await page.locator('.reward-card').first().click();
    assert.deepEqual(
      await page.evaluate(() => ({
        phase: Game.p.run.phase,
        build: Game.p.run.build,
        running: Game.running,
        paused: Game.paused
      })),
      { phase: 'battle', build: 'counter', running: true, paused: false }
    );
    await page.locator('#sound').click();
    assert.equal(await page.locator('#modal-title').textContent(), '소리와 화면 설정');
    await page.getByLabel('효과음', { exact: true }).check();
    assert.equal(await page.evaluate(() => Game.settings.sfx), true);
    await page.locator('#close-modal').click();
    await page.evaluate(() => {
      Game.p.run.phase = 'rest';
      Game.p.run.nextEncounter = 'defeat';
      Game.p.run.restUsed = false;
      Game.openRunUI();
    });
    await page.locator('.reward-card:not(:disabled)').first().click();
    assert.equal(await page.evaluate(() => Game.p.run.restUsed), true);
    await page.getByRole('button', { name: '야영지 떠나기' }).click();
    assert.equal(await page.evaluate(() => Game.p.run.phase), 'battle');
    await page.evaluate(() => {
      Game.failRun('x'.repeat(101));
      Game.UI.archive();
    });
    for (const [width, height] of [
      [360, 800],
      [390, 844],
      [844, 390],
      [1280, 900]
    ]) {
      await page.setViewportSize({ width, height });
      const rows = await page
        .locator('.record-row')
        .evaluateAll(elements =>
          elements.map(row => ({ width: row.clientWidth, content: row.scrollWidth }))
        );
      assert(rows.length > 0);
      assert(
        rows.every(row => row.content <= row.width),
        'history text must remain inside its card'
      );
      assert((await page.locator('.archive-list').textContent()).includes('x'.repeat(99) + '…'));
      if (process.env.ARTIFACT_DIR)
        await page.screenshot({
          path: process.env.ARTIFACT_DIR + '/history-long-' + width + '.png'
        });
    }
    assert.deepEqual(errors, []);
    console.log(
      'PASS fresh start, build selection, settings, camp continuation, fixture long-name history at four sizes; no browser errors'
    );
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
