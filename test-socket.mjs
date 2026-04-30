import { chromium } from 'playwright';

const ADMIN_URL = 'http://localhost:5173/?view=admin';
const PART_URL = 'http://localhost:5173/';

async function run() {
  const browser = await chromium.launch({ headless: true });
  
  // Two separate contexts (like incognito)
  const adminCtx = await browser.newContext();
  const partCtx = await browser.newContext();

  const adminPage = await adminCtx.newPage();
  const partPage = await partCtx.newPage();

  // Collect socket events on participant
  const partEvents = [];
  partPage.on('console', msg => {
    if (msg.text().includes('socket') || msg.text().includes('Socket') || 
        msg.text().includes('connect') || msg.text().includes('event')) {
      partEvents.push(msg.text());
    }
  });

  await partPage.goto(PART_URL, { waitUntil: 'networkidle', timeout: 10000 });
  await adminPage.goto(ADMIN_URL, { waitUntil: 'networkidle', timeout: 10000 });

  console.log('Both pages loaded');

  // Click "Iniciar Interrogatorio" on admin
  const startBtn = adminPage.locator('button:has-text("Iniciar Interrogatorio")');
  await startBtn.waitFor({ timeout: 5000 });
  await startBtn.click();
  console.log('Clicked Iniciar on admin');

  // Wait 2 seconds for socket round-trip
  await partPage.waitForTimeout(2000);

  // Check participant page state
  const partText = await partPage.textContent('body');
  const hasEnVivo = partText.includes('EN VIVO');
  const hasPregunta = partText.includes('¿Te gusta');

  console.log('Participant shows EN VIVO:', hasEnVivo);
  console.log('Participant shows question:', hasPregunta);
  console.log('Part events captured:', partEvents.slice(0, 5));

  await browser.close();
  
  if (hasEnVivo && hasPregunta) {
    console.log('\n✅ TEST PASSED: Admin → Participant socket works!');
    process.exit(0);
  } else {
    console.log('\n❌ TEST FAILED: Participant not receiving admin events');
    process.exit(1);
  }
}

run().catch(e => { console.error(e); process.exit(1); });
