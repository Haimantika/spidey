import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeAudioSdp} from '../src/audio-sdp.mjs';
const section=(mid,opus,g722)=>`m=audio 9 UDP/TLS/RTP/SAVPF 111 9\r\na=mid:${mid}\r\na=rtpmap:111 opus/48000/2\r\na=fmtp:111 ${opus}\r\na=rtpmap:9 G722/8000\r\n${g722?'a=fmtp:9 '+g722+'\r\n':''}`;
const base='v=0\r\na=group:BUNDLE 0 1\r\na=fingerprint:sha-256 unchanged\r\n';
test('repairs reported Opus and G722 collisions across bundled media',()=>{
 const input=base+section('0','minptime=10;useinbandfec=1;stereo=1;maxaveragebitrate=56000','minptime=10;useinbandfec=1')+section('1','minptime=10;useinbandfec=1','');
 const output=normalizeAudioSdp(input);
 const fmtp=[...output.matchAll(/^a=fmtp:111 (.+)$/gm)].map(m=>m[1]);
 assert.equal(fmtp.length,2);assert.equal(fmtp[0],fmtp[1]);assert.ok(!output.includes('a=fmtp:9'));
 assert.ok(output.includes('a=fingerprint:sha-256 unchanged'));assert.equal(normalizeAudioSdp(output),output);
});
test('leaves unbundled media and unknown format parameters untouched',()=>{
 const media=section('0','unknown=7','');assert.equal(normalizeAudioSdp(media),media);
 const input=base+media+section('1','unknown=8','');assert.equal(normalizeAudioSdp(input),input);
});

test('removes misplaced Opus attributes from PCMU, PCMA and RED without losing RED references',()=>{
 const sdp=base+'m=audio 9 UDP/TLS/RTP/SAVPF 0 8 63\r\na=mid:0\r\na=rtpmap:0 PCMU/8000\r\na=fmtp:0 minptime=10;useinbandfec=1\r\na=rtpmap:8 PCMA/8000\r\na=fmtp:8 minptime=10;useinbandfec=1\r\na=rtpmap:63 red/48000/2\r\na=fmtp:63 111/111;minptime=10;useinbandfec=1\r\n';
 const output=normalizeAudioSdp(sdp);assert.ok(!output.includes('minptime'));assert.ok(!output.includes('useinbandfec'));assert.ok(output.includes('a=fmtp:63 111/111'));assert.equal(normalizeAudioSdp(output),output);
});
