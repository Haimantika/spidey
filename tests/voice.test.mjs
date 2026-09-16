import test from 'node:test';
import assert from 'node:assert/strict';
import {VoiceService,voiceStatus,buildAgent} from '../electron/voice.mjs';
const env={AGORA_APP_ID:'a'.repeat(32),AGORA_APP_CERTIFICATE:'b'.repeat(32)};
test('voice remains explicitly unconfigured without credentials',async()=>{assert.equal(voiceStatus({}).configured,false);assert.deepEqual(voiceStatus({}).missing,['AGORA_APP_ID','AGORA_APP_CERTIFICATE']);await assert.rejects(new VoiceService({}).prepare(),/\.env/);});
test('real SDK sends the managed preset and suppresses greeting',async()=>{
 const original=globalThis.fetch;let wire;
 globalThis.fetch=async(_url,init)=>{wire=JSON.parse(init.body);return new Response(JSON.stringify({agent_id:'test-agent'}),{status:200,headers:{'content-type':'application/json'}});};
 try{const session=buildAgent(env).createSession({channel:'test',agentUid:'101',remoteUids:['100']});await session.start();assert.match(wire.preset,/minimax_speech_2_6_turbo/);assert.match(wire.preset,/deepgram_nova_3/);assert.match(wire.preset,/openai_gpt_4o_mini/);assert.equal(wire.properties.llm.greeting_message,'');assert.equal(wire.properties.tts.params.voice_setting.voice_id,'English_captivating_female1');assert.equal(JSON.stringify(wire).includes('_minimaxPresetModel'),false);}finally{globalThis.fetch=original;}
});
test('session lifecycle signs client token, uses unique channel, speaks then stops',async()=>{const calls=[];const mock={createSession:options=>{calls.push(['create',options]);return{start:async()=>calls.push(['start']),say:async(text,options)=>calls.push(['say',text,options]),stop:async()=>calls.push(['stop'])};}};const service=new VoiceService(env,()=>mock);const config=await service.prepare();assert.equal(config.uid,100);assert.ok(config.token.startsWith('007'));assert.equal(config.appCertificate,undefined);assert.deepEqual(calls[0][1].remoteUids,['100']);await service.start();await service.speak('Drink some water.');assert.deepEqual(calls[2],['say','Drink some water.',{priority:'APPEND',interruptable:false}]);await service.stop();assert.equal(calls.at(-1)[0],'stop');assert.equal(service.session,null);});
test('speak enforces UTF-8 byte limit, empty text, and session presence',async()=>{const service=new VoiceService(env);await assert.rejects(service.speak('hello'),/not connected/);await assert.rejects(service.speak('💧'.repeat(129)),/512/);await assert.rejects(service.speak(' '),/512/);});

test('a failed start preserves the cause and cleanup does not stop an unstarted agent',async()=>{
 const original=new Error('Project not enabled');let stops=0;
 const service=new VoiceService(env,()=>({createSession:()=>({start:async()=>{throw original;},stop:async()=>{stops++;throw new Error('Cannot stop session in error state');}})}));
 await service.prepare();await assert.rejects(service.start(),error=>error===original);
 await service.stop();await service.stop();assert.equal(stops,0);assert.equal(service.session,null);
});
test('prepared sessions can be replaced or cancelled without calling remote stop',async()=>{
 let stops=0;
 const service=new VoiceService(env,()=>({createSession:()=>({stop:async()=>{stops++;}})}));
 await service.prepare();await service.prepare();await service.stop();assert.equal(stops,0);
});
