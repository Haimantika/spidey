import AgoraRTC, {type IAgoraRTCClient, type IRemoteAudioTrack} from 'agora-rtc-sdk-ng';
import { bridge } from './bridge';
AgoraRTC.setLogLevel(3);
let queue=Promise.resolve(), client:IAgoraRTCClient|undefined,track:IRemoteAudioTrack|undefined;
let volume=75,enabled=true;
export function setAudioOptions(active:boolean,value:number){enabled=active;volume=value;track?.setVolume(active?value:0);}
export function speakThroughAgora(text:string,onSpeaking:(speaking:boolean)=>void) {
 queue=queue.then(async()=>{
  if(!enabled)return;
  let meter:ReturnType<typeof setInterval>|undefined;
  try {
   bridge.reportVoice('Connecting to Agora…');
   const config=await bridge.voicePrepare();
   client=AgoraRTC.createClient({mode:'rtc',codec:'vp8'});
   let resolveAudio:()=>void=()=>{},rejectAudio:(error:Error)=>void=()=>{};
   const audioReady=new Promise<void>((resolve,reject)=>{resolveAudio=resolve;rejectAudio=reject;});
   // Attach rejection handling before joining to avoid an unhandled rejection.
   void audioReady.catch(()=>{});
   client.on('user-published',async(user,mediaType)=>{
    if(mediaType!=='audio'||!client)return;
    try{await client.subscribe(user,mediaType);track=user.audioTrack;track?.setVolume(enabled?volume:0);track?.play();resolveAudio();}catch{rejectAudio(new Error('Unable to play Agora audio.'));}
   });
   await client.join(config.appId,config.channel,config.token,config.uid);
   await bridge.voiceStart();
   let readyTimeout:ReturnType<typeof setTimeout>|undefined;
   try{await Promise.race([audioReady,new Promise<never>((_,reject)=>{readyTimeout=setTimeout(()=>reject(new Error('Agora audio did not connect. Check your agent configuration.')),20000);})]);}finally{clearTimeout(readyTimeout);}
   if(!enabled)return;
   await bridge.voiceSpeak(text);
   bridge.reportVoice('Voice connected');
   // End after real audio goes quiet, with a hard limit if no audio arrives.
   const heardSpeech=await new Promise<boolean>(resolve=>{
    const start=Date.now();let lastSound=start,heard=false;
    meter=setInterval(()=>{
     const loud=enabled&&(track?.getVolumeLevel()||0)>.015;
     onSpeaking(loud);
     if(loud){if(!heard)bridge.reportVoice('Speaking');heard=true;lastSound=Date.now();}
     if(!enabled||heard&&Date.now()-lastSound>2500||Date.now()-start>30000)resolve(heard);
    },100);
   });
   if(enabled&&!heardSpeech)throw new Error('Agora connected, but no speech audio was received. Check the TTS voice in your agent configuration.');
   bridge.reportVoice('Voice ready');
  }catch(error){bridge.reportVoice(error instanceof Error?error.message.replace(/^Error invoking remote method '[^']+': Error: /,''):'Could not connect Agora voice.');}
  finally{clearInterval(meter);onSpeaking(false);track?.stop();track=undefined;await client?.leave().catch(()=>{});client=undefined;await bridge.voiceStop().catch(()=>{});}
 });
 return queue;
}
