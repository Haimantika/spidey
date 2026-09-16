import {createServer} from 'node:http';
import {randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';

export function executeTaskTool(input,state,now=Date.now()) {
 if(!input||typeof input!=='object')throw new Error('Invalid task request.');
 const next=structuredClone(state);
 if(input.action==='list')return {state:next,result:{ok:true,now:new Date(now).toISOString(),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,tasks:next.tasks.map(t=>({id:t.id,title:t.title,done:t.done,due_at:new Date(t.nextAt).toISOString()}))}};
 if(input.action==='add'){
  if(typeof input.title!=='string'||!input.title.trim()||input.title.length>120)throw new Error('Task title must contain 1–120 characters.');
  if(next.tasks.length>=100)throw new Error('Task list is full.');
  const delay=input.delay_minutes;
  const at=typeof input.due_at==='string'&&input.due_at?Date.parse(input.due_at):typeof delay==='number'&&Number.isFinite(delay)&&delay>=1?now+delay*60_000:NaN;
  if(!Number.isFinite(at)||at<=now||at>now+366*86400000)throw new Error('Ask for a reminder time in the future, within one year.');
  if(input.due_at&&!/(Z|[+-]\d{2}:\d{2})$/.test(input.due_at))throw new Error('Use an ISO date with an explicit timezone offset.');
  const task={id:randomUUID(),title:input.title.trim(),done:false,nextAt:at};
  next.tasks.push(task);return {state:next,result:{ok:true,action:'added',task:{...task,due_at:new Date(at).toISOString()}}};
 }
 const task=next.tasks.find(t=>t.id===input.task_id);
 if(!task)throw new Error('Task not found. List tasks first and use the exact ID.');
 if(input.action==='complete')task.done=true;
 else if(input.action==='snooze'){
  if(!Number.isFinite(input.delay_minutes)||input.delay_minutes<1||input.delay_minutes>1440)throw new Error('Snooze must be 1–1440 minutes.');
  task.done=false;task.nextAt=now+input.delay_minutes*60000;
 }else throw new Error('Unknown task action.');
 return {state:next,result:{ok:true,action:input.action,task}};
}
export function toolDefinition(url,token) {
 return {type:'function',function:{name:'manage_tasks',description:'Read the current time and saved tasks, add a reminder, complete a task, or snooze it. Call list first for current time and exact IDs. Never claim a task is saved before ok:true. Ask the user for a time if missing.',parameters:{type:'object',properties:{action:{type:'string',enum:['list','add','complete','snooze']},title:{type:'string'},delay_minutes:{type:'number',description:'Minutes from now, for a relative reminder or snooze.'},due_at:{type:'string',description:'Absolute ISO 8601 timestamp WITH timezone offset. Empty for relative reminders.'},task_id:{type:'string'}},required:['action','title','delay_minutes','due_at','task_id']}},server:{method:'POST',url:`${url}/tasks`,headers:{Authorization:`Bearer ${token}`},body:{call_id:'{{tool_call_id}}',action:'{{args.action}}',title:'{{args.title}}',delay_minutes:'{{args.delay_minutes}}',due_at:'{{args.due_at}}',task_id:'{{args.task_id}}'},timeout_ms:10000}};
}
export class TaskToolBridge {
 constructor({getState,saveState,binary,onAction=()=>{},onError=()=>{}}){Object.assign(this,{getState,saveState,binary,onAction,onError});this.server=null;this.child=null;this.cache=new Map();}
 async listen(){
  this.token=randomBytes(32).toString('hex');this.cache.clear();let count=0,windowAt=Date.now();
  this.server=createServer(async(req,res)=>{
   res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
   const supplied=Buffer.from(req.headers.authorization||''),expected=Buffer.from(`Bearer ${this.token}`);
   if(req.method!=='POST'||req.url!=='/tasks'||supplied.length!==expected.length||!timingSafeEqual(supplied,expected)){res.writeHead(401);res.end('{"error":"Unauthorized"}');return;}
   if(Date.now()-windowAt>60000){count=0;windowAt=Date.now();}
   if(++count>60){res.writeHead(429);res.end('{"error":"Too many requests"}');return;}
   try{
    let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>8192)throw new Error('Request too large.');}
    const input=JSON.parse(body);
    if(typeof input.call_id!=='string'||input.call_id.length<1||input.call_id.length>200)throw new Error('A tool call ID is required.');
    if(this.cache.has(input.call_id)){res.end(JSON.stringify(this.cache.get(input.call_id)));return;}
    const {state,result}=executeTaskTool(input,this.getState());
    if(input.action!=='list')this.saveState(state);
    this.cache.set(input.call_id,result);if(this.cache.size>1024)this.cache.delete(this.cache.keys().next().value);
    if(input.action!=='list')this.onAction(result);
    res.end(JSON.stringify(result));
   }catch(error){res.end(JSON.stringify({ok:false,error:error.message}));}
  });
  this.server.requestTimeout=10000;
  await new Promise((resolve,reject)=>{this.server.once('error',reject);this.server.listen(0,'127.0.0.1',resolve);});
  return this.server.address().port;
 }
 async start(){
  await this.stop();if(!existsSync(this.binary))throw new Error('Install the conversation helper with npm run setup:conversation.');
  const port=await this.listen();
  try{
   const url=await new Promise((resolve,reject)=>{
    let log='';const child=this.child=spawn(this.binary,['tunnel','--url',`http://127.0.0.1:${port}`,'--no-autoupdate','--protocol','http2'],{stdio:['ignore','ignore','pipe']});
    const timer=setTimeout(()=>reject(new Error('The conversation callback could not connect. Check your network.')),35000);
    const fail=()=>{clearTimeout(timer);reject(new Error('The conversation helper stopped unexpectedly.'));};
    child.once('error',fail);child.once('exit',()=>{fail();if(this.child===child)this.onError('Task connection lost. End the conversation and reconnect.');});
    child.stderr.on('data',chunk=>{log=(log+chunk.toString()).slice(-16000);const match=log.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);if(match&&/Registered tunnel connection/.test(log)){clearTimeout(timer);resolve(match[0]);}});
   });
   return [toolDefinition(url,this.token)];
  }catch(error){await this.stop();throw error;}
 }
 async stop(){const child=this.child;this.child=null;child?.kill();this.token='';if(this.server){this.server.closeAllConnections();await new Promise(resolve=>this.server.close(resolve));this.server=null;}this.cache.clear();}
}
