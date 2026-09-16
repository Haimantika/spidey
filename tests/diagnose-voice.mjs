import dotenv from 'dotenv';
import { VoiceService, voiceStatus } from '../electron/voice.mjs';
import { safeVoiceError } from '../electron/voice-errors.mjs';
dotenv.config({quiet:true});
const status=voiceStatus();
console.log('Credential fields:',status.configured?'present':`missing ${status.missing.join(', ')}`);
console.log('Agent configuration:',process.env.AGORA_PIPELINE_ID?'published Studio pipeline':'default managed models');
const service=new VoiceService();
try {
 await service.prepare();
 await service.start();
 console.log('PASS: Agora accepted the agent start.');
} catch(error) {
 console.log(safeVoiceError(error,'start'));
 process.exitCode=1;
} finally {
 try {await service.stop();}catch(error){console.log(safeVoiceError(error,'cleanup'));}
}
