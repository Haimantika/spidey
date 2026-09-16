const { contextBridge, ipcRenderer } = require('electron');
const subscribe = (channel, fn) => { const listener=(_event,value)=>fn(value); ipcRenderer.on(channel,listener); return ()=>ipcRenderer.removeListener(channel,listener); };
contextBridge.exposeInMainWorld('mochi', {
 getState:()=>ipcRenderer.invoke('state:get'),saveState:state=>ipcRenderer.invoke('state:save',state),onState:fn=>subscribe('state',fn),onNudge:fn=>subscribe('nudge',fn),
 preview:kind=>ipcRenderer.invoke('preview',kind),showPet:()=>ipcRenderer.invoke('pet:show'),openDashboard:()=>ipcRenderer.invoke('dashboard:show'),
 voiceStatus:()=>ipcRenderer.invoke('voice:status'),voicePrepare:()=>ipcRenderer.invoke('voice:prepare'),voiceStart:()=>ipcRenderer.invoke('voice:start'),voiceSpeak:text=>ipcRenderer.invoke('voice:speak',text),voiceStop:()=>ipcRenderer.invoke('voice:stop'),
 reportVoice:status=>ipcRenderer.send('voice:report',status),onVoice:fn=>subscribe('voice:status-change',fn),
});
