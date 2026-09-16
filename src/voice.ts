import AgoraRTC,{type IAgoraRTCClient,type IRemoteAudioTrack,type IMicrophoneAudioTrack} from 'agora-rtc-sdk-ng';
import {bridge} from './bridge';
import {installAudioSdpCompatibility} from './audio-sdp.mjs';
installAudioSdpCompatibility();
AgoraRTC.setLogLevel(3);
export type ConversationState={phase:'idle'|'connecting'|'listening'|'speaking'|'error';message:string;transcript:{role:string;content:string}[];inputLevel?:number;microphones?:{id:string;label:string}[];microphoneId?:string;warning?:string};
let queue=Promise.resolve(),client:IAgoraRTCClient|undefined,track:IRemoteAudioTrack|undefined,mic:IMicrophoneAudioTrack|undefined;
let volume=75,enabled=true,conversational=false,cancelled=false,meter:ReturnType<typeof setInterval>|undefined,expiry:ReturnType<typeof setTimeout>|undefined;
let snapshot:ConversationState={phase:'idle',message:'Tap to talk',transcript:[]};
let selectedMicrophone='',lastInputAt=0;
const listeners=new Set<(value:ConversationState)=>void>();
function update(value:Partial<ConversationState>){snapshot={...snapshot,...value};listeners.forEach(fn=>fn(snapshot));}
export function onConversation(fn:(value:ConversationState)=>void){listeners.add(fn);fn(snapshot);return()=>{listeners.delete(fn);};}
export function setAudioOptions(active:boolean,value:number){enabled=active;volume=value;track?.setVolume(active?value:0);}
function serial(fn:()=>Promise<void>){const next=queue.then(fn);queue=next.catch(()=>{});return next;}
function errorMessage(error:unknown){return error instanceof Error?error.message.replace(/^Error invoking remote method '[^']+': Error: /,''):'Could not connect Agora.';}
async function disconnect(){clearInterval(meter);clearTimeout(expiry);mic?.close();mic=undefined;track?.stop();track=undefined;const previous=client;client=undefined;conversational=false;update({inputLevel:0,microphones:[],warning:''});await previous?.leave().catch(()=>{});await bridge.voiceStop().catch(()=>{});}
async function connect(conversation:boolean){
 const config=await bridge.voicePrepare({conversation});
 if(cancelled)throw new Error('Conversation cancelled.');
 const rtc=client=AgoraRTC.createClient({mode:'rtc',codec:'vp8'});
 rtc.on('user-published',async(user,type)=>{if(type!=='audio'||rtc!==client)return;try{await rtc.subscribe(user,type);track=user.audioTrack;track?.setVolume(enabled?volume:0);track?.play();}catch(error){update({message:errorMessage(error)});}});
 rtc.on('user-left',user=>{if(String(user.uid)==='101'&&conversational)void stopConversation('Conversation ended. Tap to reconnect.');});
 rtc.on('connection-state-change',state=>{if(state==='DISCONNECTED'&&conversational)void stopConversation('Connection lost. Tap to reconnect.');});
 await rtc.join(config.appId,config.channel,config.token,config.uid);
 // Match Agora's receive-side Opus stereo parameters across bundled audio sections.
 // Do not use a named preset: it adds bitrate/sample-rate fmtp parameters
 // absent from receive audio, which Electron rejects for a shared payload type.
 if(conversation){mic=await AgoraRTC.createMicrophoneAudioTrack({encoderConfig:{stereo:true},...(selectedMicrophone?{microphoneId:selectedMicrophone}:{}),AEC:true,ANS:true,AGC:true});if(cancelled){mic.close();mic=undefined;throw new Error('Conversation cancelled.');}await rtc.publish(mic);await refreshMicrophones();}
 await bridge.voiceStart();
 if(cancelled)throw new Error('Conversation cancelled.');
 // Agents may publish audio only when they have speech to deliver.
}
async function refreshMicrophones(){
 const devices=await AgoraRTC.getMicrophones(true).catch(()=>[]);
 update({microphones:devices.map((d,i)=>({id:d.deviceId,label:d.label||`Microphone ${i+1}`})),microphoneId:mic?.getMediaStreamTrack().getSettings().deviceId||selectedMicrophone});
}
export function selectMicrophone(id:string){return serial(async()=>{
 if(!mic||!conversational)return;
 try{await mic.setDevice(id);selectedMicrophone=id;lastInputAt=Date.now();update({warning:''});await refreshMicrophones();}
 catch(error){update({warning:`Could not switch microphone: ${errorMessage(error)}`});}
});}
export function startConversation(onSpeaking:(value:boolean)=>void){
 cancelled=false;return serial(async()=>{
  if(conversational)return;
  update({phase:'connecting',message:'Connecting to Agora…',transcript:[]});
  try{
   await disconnect();await connect(true);conversational=true;lastInputAt=Date.now();
   update({phase:'listening',message:'Listening · microphone on'});bridge.reportVoice('Conversation active');
   let polling=false,lastPoll=0;
   meter=setInterval(()=>{
    const inputLevel=mic?.getVolumeLevel()||0;if(inputLevel>.01)lastInputAt=Date.now();
    const loud=(track?.getVolumeLevel()||0)>.015;onSpeaking(loud);update({phase:loud?'speaking':'listening',inputLevel});
    if(!polling&&Date.now()-lastPoll>2500){polling=true;lastPoll=Date.now();void bridge.voiceHistory().then(transcript=>{if(conversational)update({transcript});}).catch(()=>{if(conversational)update({warning:'Could not read conversation captions. End chat and reconnect if replies stop.'});}).finally(()=>{polling=false;});}
   if(Date.now()-lastInputAt>10000&&!snapshot.warning)update({warning:'No microphone sound detected. Choose another microphone below, or check its mute switch.'});
    else if(Date.now()-lastInputAt<1000&&snapshot.warning?.startsWith('No microphone'))update({warning:''});
   },150);
   expiry=setTimeout(()=>{void stopConversation('15-minute session ended. Tap to talk again.');},15*60000);
  }catch(error){await disconnect();const message=errorMessage(error);update({phase:cancelled?'idle':'error',message});bridge.reportVoice(message);}
 });
}
export function stopConversation(message='Microphone off'){
 cancelled=true;mic?.close();mic=undefined;update({message:'Ending conversation · microphone off'});
 return serial(async()=>{await disconnect();update({phase:'idle',message});bridge.reportVoice(message);});
}
export function toggleConversation(onSpeaking:(value:boolean)=>void){return conversational||snapshot.phase==='connecting'?stopConversation():startConversation(onSpeaking);}
export async function sendConversationText(text:string){if(!conversational)throw new Error('Start a conversation first.');await bridge.voiceThink(text);}
export function speakThroughAgora(text:string,onSpeaking:(value:boolean)=>void){return serial(async()=>{
 if(!enabled)return;
 if(conversational){await bridge.voiceSpeak(text).catch(error=>bridge.reportVoice(errorMessage(error)));return;}
 cancelled=false;
 try{
  bridge.reportVoice('Connecting to Agora…');await connect(false);await bridge.voiceSpeak(text);bridge.reportVoice('Voice connected');
  const heard=await new Promise<boolean>(resolve=>{const start=Date.now();let lastSound=start,heard=false;meter=setInterval(()=>{const loud=enabled&&(track?.getVolumeLevel()||0)>.015;onSpeaking(loud);if(loud){if(!heard)bridge.reportVoice('Speaking');heard=true;lastSound=Date.now();}if(!enabled||cancelled||heard&&Date.now()-lastSound>2500||Date.now()-start>30000)resolve(heard);},100);});
  if(enabled&&!cancelled&&!heard)throw new Error('Agora connected, but no speech audio was received.');bridge.reportVoice('Voice ready');
 }catch(error){bridge.reportVoice(errorMessage(error));}finally{onSpeaking(false);await disconnect();}
 });}
