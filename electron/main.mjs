import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, Notification, screen, powerMonitor } from 'electron';
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { defaultState, validateState, tick, messageFor } from './reminders.mjs';
import { VoiceService, voiceStatus } from './voice.mjs';
import { safeVoiceError } from './voice-errors.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
dotenv.config({path:path.join(app.isPackaged?app.getPath('userData'):root,'.env'),quiet:true});
let dashboard,pet,tray,state,file,quitting=false;
const voice=new VoiceService();
const send=(channel,value)=>{for(const win of [dashboard,pet])if(win&&!win.isDestroyed())win.webContents.send(channel,value);};
function persist(){writeFileSync(`${file}.tmp`,JSON.stringify(state,null,2));renameSync(`${file}.tmp`,file);}
function options(){return {preload:path.join(root,'electron/preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false,autoplayPolicy:'no-user-gesture-required'};}
function secure(win){win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',event=>event.preventDefault());win.webContents.session.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));}
function showDashboard(){if(dashboard&&!dashboard.isDestroyed()){dashboard.show();return;}dashboard=new BrowserWindow({width:1180,height:850,minWidth:850,minHeight:660,title:'Mochi',backgroundColor:'#f7f8f2',titleBarStyle:'hiddenInset',webPreferences:options()});secure(dashboard);dashboard.loadFile(path.join(root,'dist/index.html'));dashboard.on('close',e=>{if(!quitting){e.preventDefault();dashboard.hide();}});}
function createPet(){const {x,y,width,height}=screen.getPrimaryDisplay().workArea;pet=new BrowserWindow({width:340,height:410,x:x+width-360,y:y+height-430,frame:false,transparent:true,hasShadow:false,resizable:false,alwaysOnTop:true,skipTaskbar:true,webPreferences:options()});secure(pet);pet.setVisibleOnAllWorkspaces(true,{visibleOnFullScreen:true});pet.loadFile(path.join(root,'dist/index.html'),{query:{pet:'1'}});pet.on('close',event=>{if(!quitting){event.preventDefault();pet.hide();}});}
function nudge(reminder){const value={...reminder,message:messageFor(reminder)};pet?.showInactive();send('nudge',value);if(Notification.isSupported()){const note=new Notification({title:'A little nudge from Mochi',body:value.message,silent:true});note.on('click',showDashboard);note.show();}}
function check(){const result=tick(state);if(result.due.length){state=result.state;persist();send('state',state);for(const r of result.due)nudge(r);}}
function handle(name,fn,petOnly=false){ipcMain.handle(name,async(event,...args)=>{if(![dashboard?.webContents,pet?.webContents].includes(event.sender)||petOnly&&event.sender!==pet?.webContents)throw new Error('Untrusted window.');try{return await fn(...args);}catch(error){if(name.startsWith('voice:')&&!String(error.message).includes('.env'))throw new Error(safeVoiceError(error,name.split(':')[1]));throw error;}});}
if(!app.requestSingleInstanceLock())app.quit();else {
 app.on('second-instance',()=>showDashboard());
 app.whenReady().then(()=>{
  file=path.join(app.getPath('userData'),'reminders.json');try{state=validateState(JSON.parse(readFileSync(file,'utf8')));}catch{state=defaultState();}
  handle('state:get',()=>state);handle('state:save',value=>{state=validateState(value);persist();send('state',state);return state;});
  handle('preview',kind=>{if(!['water','walk','eyes','hello'].includes(kind))throw new Error('Unknown reminder.');nudge({id:'preview',kind,title:'Hello! I’m Mochi. A little friend for your everyday.'});});
  handle('pet:show',()=>pet.showInactive());handle('dashboard:show',showDashboard);
  handle('voice:status',()=>voiceStatus());handle('voice:prepare',()=>voice.prepare(),true);handle('voice:start',()=>voice.start(),true);handle('voice:speak',text=>voice.speak(text),true);handle('voice:stop',()=>voice.stop(),true);
  ipcMain.on('voice:report',(event,status)=>{if(event.sender===pet?.webContents&&typeof status==='string'&&status.length<1000)send('voice:status-change',status);});
  showDashboard();createPet();
  const icon=nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGUlEQVQ4T2NkoBAwUqifYdQAhoGBoQFQAwAAGhAAAft8pnEAAAAASUVORK5CYII=');
  tray=new Tray(icon);tray.setTitle('🌱');tray.setToolTip('Mochi — your little desktop companion');tray.setContextMenu(Menu.buildFromTemplate([{label:'Open Mochi',click:showDashboard},{label:'Show desktop pet',click:()=>pet.showInactive()},{label:'Pause for 1 hour',click:()=>{state.pausedUntil=Date.now()+3_600_000;persist();send('state',state);}},{type:'separator'},{label:'Quit Mochi',click:()=>app.quit()}]));
  setInterval(check,1000);powerMonitor.on('resume',check);app.on('activate',showDashboard);
 });
 app.on('before-quit',event=>{if(quitting)return;event.preventDefault();quitting=true;Promise.race([voice.stop().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,3000))]).finally(()=>app.quit());});
 app.on('window-all-closed',()=>{});
}
