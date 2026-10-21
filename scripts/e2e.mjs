// End-to-end smoke test: plays a full 5-player game in a mobile viewport.
// Usage: npm run build && npx vite preview --port 4173 & node scripts/e2e.mjs [screenshotDir]
import { chromium } from 'playwright-core';

const URL = process.env.E2E_URL ?? 'http://localhost:4173/';
const shots = process.argv[2];
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

let n = 0;
const snap = async (name) => shots && (await page.waitForTimeout(900), await page.screenshot({ path: `${shots}/${String(++n).padStart(2, '0')}-${name}.png` }));
const click = (text) => page.getByRole('button', { name: text, exact: false }).first().click();
const body = () => page.textContent('body');
const assert = (c, msg) => { if (!c) throw new Error('ASSERT: ' + msg); };
const pick = (name) => page.locator("main button").filter({ hasText: new RegExp(`^.?\\s*${name}`) }).first();

await page.goto(URL);
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('avalon.lang', 'en'); });
await page.reload();
await snap('home');
await click('New Game');
await page.getByRole('button', { name: '5', exact: true }).click();
await snap('count');
await click('Continue');
const names = ['Alex', 'Ben', 'Cindy', 'David', 'Emma'];
// duplicate name validation
const inputs = page.locator('input');
for (let i = 0; i < 5; i++) await inputs.nth(i).fill(i === 4 ? 'alex' : names[i]);
await click('Continue to Character Setup');
assert((await body()).includes('Duplicate name'), 'duplicate name rejected');
await inputs.nth(4).fill('Emma');
await snap('names');
await click('Continue to Character Setup');
await click('Advanced');
await snap('config');
await click('Shuffle');
await snap('dealt');
await click('Begin Private Reveal');

const roles = {};
for (let i = 0; i < 5; i++) {
  assert((await body()).includes(`${i} of 5 players completed`), 'progress shown');
  if (i === 0) await snap('handover');
  if (i === 1) {
    // Refresh mid-reveal: must land on a neutral handover, never the open card.
    await click(`I Am ${names[i]}`);
    await page.reload();
    await click('Resume Game');
    assert((await body()).includes(`Pass the phone to${names[i]}`) || (await body()).includes(names[i]), 'resume to handover');
    assert(!(await body()).includes('Hide Character'), 'restored without private info');
  }
  await click(`I Am ${names[i]}`);
  const h1 = await page.locator('h1').first().textContent();
  roles[names[i]] = h1.trim();
  if (i === 0) await snap('reveal');
  await click('Hide Character');
}
console.log('roles', roles);
await snap('ready');
await click('Start Game');
await snap('dashboard');

const evilNames = Object.entries(roles).filter(([, r]) => /ASSASSIN|MORGANA|MINION|MORDRED|OBERON/i.test(r)).map(([n]) => n);
const goodNames = names.filter((x) => !evilNames.includes(x));

async function playMission(teamSize, failingEvil) {
  await click('Choose Mission');
  // pick good players first (so successes are guaranteed), then evil if needed
  const order = failingEvil ? [failingEvil, ...goodNames] : [...goodNames, ...evilNames];
  for (const nm of order.slice(0, teamSize)) await pick(nm).click();
  await snap('team-select');
  await click('Confirm Mission Team');
  await snap('mission-team');
  // One vote per mission: straight into the secret Success/Fail vote, team members only.
  await click('Begin Secret Mission');
  for (let i = 0; i < teamSize; i++) {
    assert((await body()).includes(`${i} of ${teamSize} mission cards submitted`), `mission vote progress ${i}/${teamSize}`);
    await click('Submit Mission Card');
    // Free choice: every voter sees both cards and may play either.
    assert((await page.getByRole('button', { name: /FAIL/ }).count()) === 1, 'Fail card shown to every voter');
    const voter = (await page.locator('.label').first().textContent()).split('·').pop().trim();
    const playFail = failingEvil && voter.toLowerCase() === failingEvil.toLowerCase();
    await page.getByRole('button', { name: playFail ? /FAIL/ : /SUCCESS/ }).click();
    assert(!(await body()).includes('you must play'), 'no restriction message');
    await click('Submit Card');
  }
  assert((await body()).includes('All mission cards are in'), 'exactly teamSize ballots');
  await click('Reveal Mission Result');
  await page.waitForTimeout(1500);
  await snap('mission-result');
  await click('Continue');
}

// Mission 1 (2 players), with a team change before confirming; leader rotates after.
await click('Choose Mission');
const leader1 = await page.locator('text=Leader').locator('..').textContent();
await pick('Alex').click();
await pick('Ben').click();
await click('Confirm Mission Team');
await click('Change Team');
await click('Confirm Mission Team'); // previous picks are kept
await page.getByRole('button', { name: 'Home', exact: true }).click();
await click('Resume Game');
await click('Begin Secret Mission');
for (let i = 0; i < 2; i++) {
  await click('Submit Mission Card');
  await page.getByRole('button', { name: /SUCCESS/ }).click();
  await click('Submit Card');
}
await click('Reveal Mission Result');
await page.waitForTimeout(1200);
await click('Continue');
const leader2 = await page.locator('text=Leader').locator('..').textContent();
assert(leader1 !== leader2, 'leader rotated');

await playMission(3, evilNames[0]); // mission 2 fails
assert((await body()).includes('Mission 3'), 'on mission 3');
await playMission(3); // mission 3: same size as mission 2
await playMission(4, evilNames[0]); // mission 4: 4 players (+1); one Fail is not enough, so Good reaches 3 wins
// Assassin phase
assert((await body()).includes('Three Missions'), 'assassin intro');
await snap('assassin-intro');
await click('Begin Assassin Phase');
await click('I Am the Assassin');
await snap('assassin');
const merlin = Object.entries(roles).find(([, r]) => /MERLIN/i.test(r))[0];
await pick(merlin).click();
await click('Assassinate Selected Player');
await page.getByRole('dialog').getByRole('button', { name: 'Assassinate' }).click();
await page.waitForTimeout(800);
assert((await body()).includes('EVIL WINS'), 'evil wins on merlin hit');
await snap('final');
await click('Reveal All Characters');
await page.getByRole('dialog').getByRole('button', { name: 'Reveal' }).click();
await page.waitForTimeout(800);
await snap('final-reveal');
// Header Home button exits to the main screen; Resume returns to the results.
await page.getByRole('button', { name: 'Home', exact: true }).click();
assert((await body()).includes('The Battle of Loyalty'), 'home from final results');
await click('Resume Game');
await click('Play Again');
assert((await body()).includes('The cards are dealt'), 'play again deals');

console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'E2E PASSED, no runtime errors');
await browser.close();
process.exit(errors.length ? 1 : 0);
