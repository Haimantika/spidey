export type PetName = 'mochi' | 'peach' | 'cloud';
export type Reminder = {id:string; title:string; kind:'water'|'walk'|'eyes'; minutes:number; enabled:boolean; nextAt:number};
export type Task = {id:string; title:string; done:boolean; nextAt:number};
export type AppState = {pet:PetName; voiceEnabled:boolean; volume:number; pausedUntil:number; reminders:Reminder[]; tasks:Task[]; history:{id:string;title:string;at:number}[]};
export type Nudge = {id:string; title:string; kind:string; message:string};
export type VoiceStatus = {configured:boolean; missing:string[]};
export type Bridge = {
 getState:()=>Promise<AppState>; saveState:(state:AppState)=>Promise<AppState>;
 onState:(fn:(state:AppState)=>void)=>()=>void; onNudge:(fn:(nudge:Nudge)=>void)=>()=>void;
 preview:(kind:string)=>Promise<void>; showPet:()=>Promise<void>; openDashboard:()=>Promise<void>;
 voiceStatus:()=>Promise<VoiceStatus>; voicePrepare:()=>Promise<{appId:string;channel:string;uid:number;token:string}>;
 voiceStart:()=>Promise<void>; voiceSpeak:(text:string)=>Promise<void>; voiceStop:()=>Promise<void>;
 reportVoice:(status:string)=>void; onVoice:(fn:(status:string)=>void)=>()=>void;
};
declare global { interface Window { mochi?:Bridge } }
