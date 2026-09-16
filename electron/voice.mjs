import { randomUUID } from 'node:crypto';
import { Agent, AgoraClient, Area, DeepgramSTT, OpenAI, MiniMaxTTS, generateRtcToken } from 'agora-agents';

export function voiceStatus(env = process.env) {
 const missing=['AGORA_APP_ID','AGORA_APP_CERTIFICATE'].filter(key=>!env[key]?.trim());
 return {configured:missing.length===0,missing};
}
export function buildAgent(env = process.env) {
 const client=new AgoraClient({appId:env.AGORA_APP_ID,appCertificate:env.AGORA_APP_CERTIFICATE,area:env.AGORA_AREA==='eu'?Area.EU:env.AGORA_AREA==='ap'?Area.AP:Area.US});
 if(env.AGORA_PIPELINE_ID) return new Agent({client,pipelineId:env.AGORA_PIPELINE_ID});
 return new Agent({client})
  .withStt(new DeepgramSTT({model:'nova-3',language:'en-US'}))
  .withLlm(new OpenAI({model:'gpt-4o-mini',systemMessages:[{role:'system',content:'You are Mochi, a gentle desktop pet. Give brief, warm reminders. Do not initiate conversation unless asked.'}],greetingMessage:'',maxHistory:2}))
  .withTts(new MiniMaxTTS({model:'speech-2.6-turbo',voiceId:'English_captivating_female1'}));
}
export class VoiceService {
 constructor(env=process.env, factory=buildAgent) {this.env=env;this.factory=factory;this.session=null;this.timeout=null;this.started=false;}
 async prepare() {
  if(!voiceStatus(this.env).configured) throw new Error('Add your Agora App ID and App Certificate to .env, then restart Mochi.');
  await this.stop();
  const channel=`mochi-${randomUUID()}`, uid=100;
  this.session=this.factory(this.env).createSession({name:channel,channel,agentUid:'101',remoteUids:[String(uid)],idleTimeout:60,expiresIn:300});
  this.armTimeout();
  return {appId:this.env.AGORA_APP_ID,channel,uid,token:generateRtcToken({appId:this.env.AGORA_APP_ID,appCertificate:this.env.AGORA_APP_CERTIFICATE,channel,uid,expirySeconds:300})};
 }
 armTimeout(){clearTimeout(this.timeout);this.timeout=setTimeout(()=>{void this.stop().catch(()=>{});},90_000);this.timeout.unref?.();}
 async start(){
  if(!this.session)throw new Error('Prepare a voice session first.');
  const pending=this.session;
  try {
   await pending.start();
   if(this.session!==pending){await pending.stop();throw new Error('Voice session was cancelled.');}
   this.started=true;this.armTimeout();
  } catch(error) {
   if(this.session===pending){clearTimeout(this.timeout);this.session=null;this.started=false;}
   throw error;
  }
 }
 async speak(text){
  if(typeof text!=='string'||!text.trim()||Buffer.byteLength(text,'utf8')>512)throw new Error('Spoken reminders must fit within 512 UTF-8 bytes.');
  if(!this.session)throw new Error('Voice session is not connected.');
  await this.session.say(text,{priority:'APPEND',interruptable:false});this.armTimeout();
 }
 async stop(){clearTimeout(this.timeout);const previous=this.session,wasStarted=this.started;this.session=null;this.started=false;if(previous&&wasStarted)await previous.stop();}
}
