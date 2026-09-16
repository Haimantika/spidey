import test from 'node:test';
import assert from 'node:assert/strict';
import {safeVoiceError} from '../electron/voice-errors.mjs';
test('diagnostics preserve HTTP status and API reason without dumping response bodies',()=>{
 const error={statusCode:403,body:{message:'Service is not enabled',token:'sensitive-token'},message:'Forbidden'};
 const text=safeVoiceError(error,'start',{});assert.match(text,/HTTP 403/);assert.match(text,/Service is not enabled/);assert.ok(!text.includes('sensitive-token'));
});
test('diagnostics redact local secrets and RTC tokens from messages',()=>{
 const secret='my-local-secret',token='007'+'A'.repeat(70);
 const text=safeVoiceError(new Error(`Invalid ${secret} ${token} ${'a'.repeat(32)}`),'start',{AGORA_APP_CERTIFICATE:secret});
 assert.ok(!text.includes(secret));assert.ok(!text.includes(token));assert.ok(!text.includes('a'.repeat(32)));
});
test('network diagnostics expose the failure code',()=>{
 const error=new Error('fetch failed',{cause:{code:'ENOTFOUND'}});assert.match(safeVoiceError(error,'start',{}),/ENOTFOUND/);
});
