import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, Notification, screen, powerMonitor, systemPreferences } from 'electron';
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { defaultState, validateState, tick, messageFor } from './reminders.mjs';
import { VoiceService, voiceStatus } from './voice.mjs';
import { TaskToolBridge } from './task-tools.mjs';
import { safeVoiceError } from './voice-errors.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
dotenv.config({path:path.join(app.isPackaged?app.getPath('userData'):root,'.env'),quiet:true});
let dashboard,pet,tray,state,file,quitting=false;
const toolBridge=new TaskToolBridge({
 getState:()=>state,saveState:value=>{const next=validateState(value);writeFileSync(`${file}.tmp`,JSON.stringify(next,null,2));renameSync(`${file}.tmp`,file);state=next;send('state',state);},
 binary:path.join(app.isPackaged?process.resourcesPath:path.join(root,'.tools'),process.platform==='win32'?'cloudflared.exe':'cloudflared'),
 onAction:result=>send('task:action',result),onError:message=>send('voice:status-change',message),
});
const voice=new VoiceService(process.env,undefined,{toolBridge,onEnd:()=>send('conversation:command','stop')});
const send=(channel,value)=>{for(const win of [dashboard,pet])if(win&&!win.isDestroyed())win.webContents.send(channel,value);};
function persist(){writeFileSync(`${file}.tmp`,JSON.stringify(state,null,2));renameSync(`${file}.tmp`,file);}
function options(){return {preload:path.join(root,'electron/preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false,autoplayPolicy:'no-user-gesture-required'};}
function secure(win){win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',event=>event.preventDefault());win.webContents.session.setPermissionCheckHandler((wc,permission)=>wc===pet?.webContents&&voice.conversation&&permission==='media');win.webContents.session.setPermissionRequestHandler((wc,permission,callback,details)=>callback(wc===pet?.webContents&&voice.conversation&&permission==='media'&&details.mediaTypes?.includes('audio')&&!details.mediaTypes?.includes('video')));}
function showDashboard(){if(dashboard&&!dashboard.isDestroyed()){dashboard.show();return;}dashboard=new BrowserWindow({width:1180,height:850,minWidth:850,minHeight:660,title:'Spidey',backgroundColor:'#f7f8f2',titleBarStyle:'hiddenInset',webPreferences:options()});secure(dashboard);dashboard.loadFile(path.join(root,'dist/index.html'));dashboard.on('close',e=>{if(!quitting){e.preventDefault();dashboard.hide();}});}
function positionPet(){if(!pet||pet.isDestroyed())return;const {x,y,width}=screen.getPrimaryDisplay().bounds;pet.setPosition(Math.round(x+width/2-150),y);}
function createPet(){pet=new BrowserWindow({width:620,height:390,type:'panel',enableLargerThanScreen:true,frame:false,transparent:true,hasShadow:false,resizable:false,alwaysOnTop:true,skipTaskbar:true,webPreferences:options()});secure(pet);pet.setAlwaysOnTop(true,'screen-saver');pet.setVisibleOnAllWorkspaces(true,{visibleOnFullScreen:true});positionPet();pet.loadFile(path.join(root,'dist/index.html'),{query:{pet:'1'}});pet.on('close',event=>{if(!quitting){event.preventDefault();pet.hide();}});screen.on('display-metrics-changed',positionPet);}
function nudge(reminder){const value={...reminder,message:messageFor(reminder,state.language)};pet?.showInactive();send('nudge',value);if(Notification.isSupported()){const note=new Notification({title:'A reminder from Spider-Man',body:value.message,silent:true});note.on('click',showDashboard);note.show();}}
function check(){const result=tick(state);if(result.due.length){state=result.state;persist();send('state',state);for(const r of result.due)nudge(r);}}
function handle(name,fn,petOnly=false){ipcMain.handle(name,async(event,...args)=>{if(![dashboard?.webContents,pet?.webContents].includes(event.sender)||petOnly&&event.sender!==pet?.webContents)throw new Error('Untrusted window.');try{return await fn(...args);}catch(error){if(name.startsWith('voice:')&&!String(error.message).includes('.env'))throw new Error(safeVoiceError(error,name.split(':')[1]));throw error;}});}
if(!app.requestSingleInstanceLock())app.quit();else {
 app.on('second-instance',()=>showDashboard());
 app.whenReady().then(()=>{
  file=path.join(app.getPath('userData'),'reminders.json');try{state=validateState(JSON.parse(readFileSync(file,'utf8')));}catch{state=defaultState();}
  handle('state:get',()=>state);handle('state:save',value=>{state=validateState(value);persist();send('state',state);return state;});
  handle('preview',kind=>{if(!['water','walk','eyes','hello'].includes(kind))throw new Error('Unknown reminder.');nudge({id:'preview',kind,title:'Hello! Your friendly neighborhood Spider-Man here.'});});
  handle('pet:show',()=>pet.showInactive());handle('dashboard:show',showDashboard);
  handle('voice:status',()=>voiceStatus());handle('voice:prepare',async options=>{
  const conversation=options?.conversation===true;
  if(!voiceStatus().configured)return voice.prepare({conversation,language:state.language});
  if(conversation&&process.platform==='darwin'&&!app.commandLine.hasSwitch('use-fake-device-for-media-stream')&&!await systemPreferences.askForMediaAccess('microphone'))throw new Error('Microphone access was denied. Enable it in System Settings → Privacy & Security → Microphone.');
  return voice.prepare({conversation,language:state.language});
 },true);handle('voice:start',()=>voice.start(),true);handle('voice:speak',text=>voice.speak(text),true);handle('voice:stop',()=>voice.stop(),true);
 handle('voice:history',()=>voice.history(),true);handle('voice:think',text=>voice.think(text),true);
 handle('conversation:toggle',()=>{pet.showInactive();pet.webContents.send('conversation:command','toggle');});
 handle('pet:click-through',ignore=>pet.setIgnoreMouseEvents(ignore===true,{forward:true}),true);
 handle('app:quit',()=>app.quit());
  ipcMain.on('voice:report',(event,status)=>{if(event.sender===pet?.webContents&&typeof status==='string'&&status.length<1000)send('voice:status-change',status);});
  showDashboard();createPet();
  const icon=nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGUlEQVQ4T2NkoBAwUqifYdQAhoGBoQFQAwAAGhAAAft8pnEAAAAASUVORK5CYII=');
  tray=new Tray(icon);tray.setTitle('🌱');tray.setToolTip('Spidey — your friendly neighborhood companion');tray.setContextMenu(Menu.buildFromTemplate([{label:'Open Spidey',click:showDashboard},{label:'Talk to Spider-Man',click:()=>{pet.showInactive();pet.webContents.send('conversation:command','toggle');}},{label:'Pause for 1 hour',click:()=>{state.pausedUntil=Date.now()+3_600_000;persist();send('state',state);}},{type:'separator'},{label:'Quit Spidey',click:()=>app.quit()}]));
  setInterval(check,1000);powerMonitor.on('resume',check);app.on('activate',showDashboard);
 });
 app.on('before-quit',event=>{if(quitting)return;event.preventDefault();quitting=true;Promise.race([voice.stop().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,3000))]).finally(()=>app.quit());});
 app.on('window-all-closed',()=>{});
}
