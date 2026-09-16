import {_electron as electron,expect} from '@playwright/test';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {normalizeAudioSdp} from '../src/audio-sdp.mjs';
const env={...process.env,AGORA_APP_ID:'',AGORA_APP_CERTIFICATE:''};delete env.ELECTRON_RUN_AS_NODE;
const profile=await mkdtemp(path.join(tmpdir(),'spidey-sdp-'));
const app=await electron.launch({args:['.',`--user-data-dir=${profile}`],env});
let diagnostics='';app.process().stderr.on('data',chunk=>{diagnostics+=chunk.toString();});
try{
 const page=await app.firstWindow();await page.waitForLoadState();
 for(const codec of ['opus','G722','PCMU','PCMA']){
  const broken=await page.evaluate(async codec=>{
   window.testPC=new RTCPeerConnection();const pc=new RTCPeerConnection();
   pc.addTransceiver('audio');pc.addTransceiver('audio');
   const offer=await pc.createOffer();
   const parts=offer.sdp.split(/(?=^m=)/m);
   const target=parts.findIndex(p=>p.startsWith('m=audio'));
   const pt=new RegExp('a=rtpmap:(\\d+) '+codec+'/', 'i').exec(parts[target])[1];
   const re=new RegExp('a=fmtp:'+pt+' ([^\\r\\n]+)');
   if(re.test(parts[target]))parts[target]=parts[target].replace(re,(_,p)=>`a=fmtp:${pt} ${p};stereo=1;sprop-stereo=1`);
   else parts[target]=parts[target].replace(new RegExp('(a=rtpmap:'+pt+' [^\\r\\n]+)'),`$1\r\na=fmtp:${pt} minptime=10;useinbandfec=1`);
   pc.close();return {type:offer.type,sdp:parts.join('')};
  },codec);
  diagnostics='';
  const rejection=await page.evaluate(async offer=>{try{await window.testPC.setRemoteDescription(offer);return '';}catch(e){return e.message;}},broken);
  await expect.poll(()=>diagnostics).toMatch(/codec collision/);
  diagnostics='';
  await page.evaluate(()=>{window.testPC.close();window.testPC=new RTCPeerConnection();});
  const repaired={type:'offer',sdp:normalizeAudioSdp(broken.sdp)};
  await page.evaluate(async offer=>{await window.testPC.setRemoteDescription(offer);window.testPC.close();},repaired);
  expect(diagnostics).not.toMatch(/codec collision/);
  console.log(`PASS: reproduced native ${codec} collision diagnostic; repaired SDP accepted without that diagnostic or microphone capture.`);
 }
}finally{await app.close();}
