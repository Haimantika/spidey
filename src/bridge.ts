import { defaultState, tick, messageFor, validateState } from '../electron/reminders.mjs';
import type { AppState, Bridge, Nudge } from './types';
const stateListeners = new Set<(state:AppState)=>void>();
const nudgeListeners = new Set<(nudge:Nudge)=>void>();
const previewChannel=!window.mochi?new BroadcastChannel('mochi-preview'):undefined;
previewChannel?.addEventListener('message',event=>{if(event.data?.type==='nudge')nudgeListeners.forEach(fn=>fn(event.data.value));});
function emitNudge(value:Nudge){nudgeListeners.forEach(fn=>fn(value));previewChannel?.postMessage({type:'nudge',value});}
let memory:AppState;
try { memory=validateState(JSON.parse(localStorage.getItem('mochi-state') || 'null')); } catch { memory=defaultState() as AppState; }
const save = async (value:AppState) => { memory=validateState(value); localStorage.setItem('mochi-state',JSON.stringify(memory)); stateListeners.forEach(fn=>fn(memory)); return memory; };
const preview = async (kind:string) => { const r={id:'preview',kind,title:'You’re doing great. Take a tiny break.'}; emitNudge({...r,message:messageFor(r)}); };
const desktopOnly = async ():Promise<never> => { throw new Error('Open the desktop app to connect Agora voice.'); };
export const bridge:Bridge = window.mochi || {
 getState:async()=>memory, saveState:save,
 onState:fn=>{stateListeners.add(fn);return()=>{stateListeners.delete(fn);};},
 onNudge:fn=>{nudgeListeners.add(fn);return()=>{nudgeListeners.delete(fn);};},
 preview, showPet:async()=>{window.open(`${location.pathname}?pet=1`,'mochi-pet','width=360,height=420');},openDashboard:async()=>{location.search='';},
 voiceStatus:async()=>({configured:false,missing:['Desktop app required']}), voicePrepare:desktopOnly, voiceStart:desktopOnly,voiceSpeak:desktopOnly,voiceStop:async()=>{},reportVoice:()=>{},onVoice:()=>()=>{},
};
if(!window.mochi)window.addEventListener('storage',event=>{if(event.key==='mochi-state'&&event.newValue){try{memory=validateState(JSON.parse(event.newValue));stateListeners.forEach(fn=>fn(memory));}catch{/* Ignore invalid preview data. */}}});
if (!window.mochi&&!new URLSearchParams(location.search).has('pet')) setInterval(()=>{ const result=tick(memory); if(result.due.length){void save(result.state); for(const r of result.due) emitNudge({...r,message:messageFor(r)});} },1000);
