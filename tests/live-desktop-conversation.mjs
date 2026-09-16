import {_electron as electron,expect} from '@playwright/test';
import {mkdtemp,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const profile=await mkdtemp(path.join(tmpdir(),'spidey-conversation-'));
const fixture=(await readFile(new URL('./fixtures/reminder.wav',import.meta.url))).toString('base64');
const application=await electron.launch({args:['.',`--user-data-dir=${profile}`,'--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'],env});
let codecCollision=false;
application.process().stderr.on('data',chunk=>{if(/codec collision|Bundled payload type collision/.test(chunk.toString())){codecCollision=true;console.log(chunk.toString().split('\n').filter(line=>/codec collision/.test(line)).join('\n'));}});
try{
 await expect.poll(()=>application.windows().filter(p=>p.url().includes('index.html')).length).toBe(2);
 const pet=application.windows().find(p=>p.url().includes('pet=1'));
 await application.evaluate(({app})=>app.commandLine.appendSwitch('use-fake-device-for-media-stream'));
 await pet.addInitScript(base64=>{
  window.capturedTracks=[];
  window.negotiationErrors=[];window.peerConnections=[];
  const NativePeerConnection=window.RTCPeerConnection;
  window.RTCPeerConnection=class extends NativePeerConnection{
   constructor(...args){super(...args);window.peerConnections.push(this);}
   async setLocalDescription(...args){try{return await super.setLocalDescription(...args);}catch(error){window.negotiationErrors.push(String(error));throw error;}}
   async setRemoteDescription(...args){try{return await super.setRemoteDescription(...args);}catch(error){window.negotiationErrors.push(String(error));throw error;}}
  };
  // Never call the hardware getUserMedia implementation in this test.
  navigator.mediaDevices.getUserMedia=async options=>{
   if(options.video)throw new Error('Hardware capture is blocked by the synthetic test.');
   const context=new AudioContext({sampleRate:48000});
   const buffer=await context.decodeAudioData(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer);
   const padded=context.createBuffer(buffer.numberOfChannels,buffer.length+20*buffer.sampleRate,buffer.sampleRate);for(let channel=0;channel<buffer.numberOfChannels;channel++)padded.copyToChannel(buffer.getChannelData(channel),channel,8*buffer.sampleRate);
   const source=context.createBufferSource();source.buffer=padded;source.loop=true;
   const destination=context.createMediaStreamDestination();source.connect(destination);await context.resume();source.start();
   const stream=destination.stream;window.capturedTracks.push(...stream.getTracks());return stream;
  };
 },fixture);
 await pet.reload();await pet.evaluate(()=>{window.voiceEvents=[];window.mochi.onVoice(value=>window.voiceEvents.push(value));});await pet.getByRole('button',{name:'Talk to Spider-Man',exact:true}).click();
 await expect(pet.getByText('Listening · microphone on',{exact:true})).toBeVisible({timeout:55000});
 await expect.poll(()=>pet.evaluate(()=>window.capturedTracks.some(t=>t.readyState==='live'))).toBe(true);console.log('Microphone track published; waiting for the synthetic voice command.');
 await expect.poll(()=>pet.evaluate(async()=>{const state=await window.mochi.getState();return state.tasks.length;}),{timeout:60000,intervals:[1000]}).toBe(1);
 const state=await pet.evaluate(()=>window.mochi.getState());expect(state.tasks[0].title.toLowerCase()).toContain('project');expect(state.tasks[0].nextAt).toBeGreaterThan(Date.now()+8*60000);
 await expect(pet.locator('.task-receipt')).toContainText('Saved:');await pet.screenshot({path:'docs/screenshots/conversation.png',omitBackground:true});
 // A saved task alone verifies only uplink audio. Also require decoded downlink audio.
 await expect.poll(()=>pet.evaluate(async()=>{
  let received=0;for(const pc of window.peerConnections){const stats=await pc.getStats();stats.forEach(report=>{if(report.type==='inbound-rtp'&&report.kind==='audio')received+=report.totalSamplesReceived||0;});}return received;
 }),{timeout:20000}).toBeGreaterThan(0);
 expect(await pet.evaluate(()=>window.negotiationErrors)).toEqual([]);
 expect(codecCollision,'Native Electron codec collision logs').toBe(false);
 const opusParameters=await pet.evaluate(()=>window.peerConnections.flatMap(pc=>[pc.localDescription,pc.remoteDescription].filter(Boolean).flatMap(d=>d.sdp.split(/\r?\n/).filter(line=>/^a=fmtp:111 /.test(line)))));
 expect(opusParameters.length).toBeGreaterThan(0);
 for(const parameters of opusParameters)expect(parameters).not.toMatch(/maxaveragebitrate|maxplaybackrate|sprop-maxcapturerate/);
 await pet.getByRole('button',{name:'End conversation',exact:true}).click();
 await expect.poll(()=>pet.evaluate(()=>window.capturedTracks.every(t=>t.readyState==='ended')),{timeout:5000}).toBe(true);
 await expect(pet.getByText('Microphone off',{exact:true})).toBeVisible({timeout:15000});
 console.log('PASS: synthetic microphone speech → Agora ASR → LLM tool call → saved local reminder; downlink audio received with no SDP negotiation errors; microphone tracks stopped on End chat.');
}catch(error){const pet=application.windows().find(p=>p.url().includes('pet=1'));if(pet){console.log('Visible status:',await pet.locator('.notch-meta').innerText());console.log('Session status events:',await pet.evaluate(()=>window.voiceEvents));console.log('History:',await pet.evaluate(()=>window.mochi.voiceHistory()).catch(()=>[]));}throw error;}finally{await application.close();}
