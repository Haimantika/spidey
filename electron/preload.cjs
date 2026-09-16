const { contextBridge, ipcRenderer } = require('electron');
const subscribe = (channel, fn) => { const listener=(_event,value)=>fn(value); ipcRenderer.on(channel,listener); return ()=>ipcRenderer.removeListener(channel,listener); };
contextBridge.exposeInMainWorld('mochi', {
 getState:()=>ipcRenderer.invoke('state:get'),saveState:state=>ipcRenderer.invoke('state:save',state),onState:fn=>subscribe('state',fn),onNudge:fn=>subscribe('nudge',fn),
 preview:kind=>ipcRenderer.invoke('preview',kind),showPet:()=>ipcRenderer.invoke('pet:show'),openDashboard:()=>ipcRenderer.invoke('dashboard:show'),
 voiceStatus:()=>ipcRenderer.invoke('voice:status'),voicePrepare:options=>ipcRenderer.invoke('voice:prepare',options),voiceStart:()=>ipcRenderer.invoke('voice:start'),voiceSpeak:text=>ipcRenderer.invoke('voice:speak',text),voiceStop:()=>ipcRenderer.invoke('voice:stop'),
 voiceHistory:()=>ipcRenderer.invoke('voice:history'),voiceThink:text=>ipcRenderer.invoke('voice:think',text),toggleConversation:()=>ipcRenderer.invoke('conversation:toggle'),onConversationCommand:fn=>subscribe('conversation:command',fn),onTaskAction:fn=>subscribe('task:action',fn),setClickThrough:ignore=>ipcRenderer.invoke('pet:click-through',ignore),quit:()=>ipcRenderer.invoke('app:quit'),
 reportVoice:status=>ipcRenderer.send('voice:report',status),onVoice:fn=>subscribe('voice:status-change',fn),
});
