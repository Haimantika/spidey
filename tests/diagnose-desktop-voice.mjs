import { _electron as electron, expect } from '@playwright/test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const profile=await mkdtemp(path.join(tmpdir(),'mochi-live-voice-'));
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const application=await electron.launch({args:['.',`--user-data-dir=${profile}`],env});
try {
 await expect.poll(()=>application.windows().filter(p=>p.url().includes('index.html')).length).toBe(2);
 const dashboard=application.windows().find(p=>!p.url().includes('pet=1'));
 await dashboard.waitForFunction(()=>Boolean(window.mochi));
 await dashboard.evaluate(()=>{window.voiceEvents=[];window.mochi.onVoice(value=>window.voiceEvents.push(value));});
 await dashboard.evaluate(()=>window.mochi.preview('water'));
 await expect.poll(()=>dashboard.evaluate(()=>window.voiceEvents.some(v=>v==='Voice ready'||v.startsWith('Agora ')||v.includes('did not connect'))),{timeout:75000,intervals:[1000]}).toBe(true);
 const events=await dashboard.evaluate(()=>window.voiceEvents);
 console.log('Desktop voice status:',events);
 expect(events).toContain('Speaking');
 expect(events).toContain('Voice ready');
}finally{await application.close();}
