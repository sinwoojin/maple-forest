'use strict';
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:375,height:812}});
  await page.goto(process.env.BASE_URL||'http://127.0.0.1:8765');
  await page.waitForFunction(()=>window.Game?.UI?.runRest);
  await page.evaluate(()=>{Game.startAdventure();Game.startRun({seed:444,build:'counter'});Game.p.run.phase='rest';Game.p.run.restUsed=false;Game.openRunUI();});
  await page.locator('.reward-card:not(:disabled)').first().click();
  assert.equal(await page.evaluate(()=>Game.p.run.restUsed),true);
  await page.getByRole('button',{name:'야영지 떠나기'}).click();
  assert.equal(await page.evaluate(()=>Game.p.run.phase),'battle');
  console.log('PASS camp selection and continuation using real clicks');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
