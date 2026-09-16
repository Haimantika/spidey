import dotenv from 'dotenv';
import assert from 'node:assert/strict';
import path from 'node:path';
import {VoiceService} from '../electron/voice.mjs';
import {TaskToolBridge} from '../electron/task-tools.mjs';
import {defaultState} from '../electron/reminders.mjs';
import {safeVoiceError} from '../electron/voice-errors.mjs';
dotenv.config({quiet:true});let state=defaultState();
let complete;const added=new Promise(resolve=>{complete=resolve;});
const toolBridge=new TaskToolBridge({getState:()=>state,saveState:value=>{state=value;},binary:path.resolve('.tools/cloudflared'),onAction:result=>{console.log('Task tool executed:',result.action);complete(result);}});
const voice=new VoiceService(process.env,undefined,{toolBridge});
try{
 await voice.prepare({conversation:true,language:process.argv.includes('--hindi')?'hi':'en'});
 await voice.start();console.log('Agora conversation started with task tools.');
 await voice.think(process.argv.includes('--hindi')?'मुझे दस मिनट में पानी पीने की याद दिलाना। कृपया टास्क सेव करो।':'Please add a task to drink water in ten minutes. Save it now.');
 let timer;try{const result=await Promise.race([added,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('No task callback received within 45 seconds.')),45000);})]);assert.equal(result.ok,true);assert.equal(state.tasks.length,1);assert.ok(state.tasks[0].nextAt>Date.now());console.log('PASS: Agora interpreted the request and saved a scheduled task through the authenticated callback.');}finally{clearTimeout(timer);}
}catch(error){console.log(safeVoiceError(error,'conversation'));try{console.log('Conversation history:',await voice.history());}catch{}process.exitCode=1;}finally{await voice.stop().catch(error=>console.log(safeVoiceError(error,'stop')));}
