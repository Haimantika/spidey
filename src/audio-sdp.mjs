// Agora can put different fmtp attributes on the same bundled audio payload.
// Repair only known audio parameters; never alter ICE, DTLS, SSRCs or video.
export function normalizeAudioSdp(sdp) {
 if (!sdp) return sdp;
 const eol=sdp.includes('\r\n')?'\r\n':'\n';
 const sections=sdp.split(/(?=^m=)/m).map(text=>text.split(/\r?\n/));
 const bundles=[...sdp.matchAll(/^a=group:BUNDLE (.+)\r?$/gm)].map(m=>m[1].trim().split(/\s+/));
 for(const mids of bundles){
  const audio=sections.filter(lines=>lines[0].startsWith('m=audio ')&&lines.some(l=>l.startsWith('a=mid:')&&mids.includes(l.slice(6))));
  // Agora may copy Opus fmtp onto any fallback codec (G722, PCMU, PCMA).
  // Retain each fallback's own attributes, including RED payload references.
  for(const lines of audio)for(const line of [...lines]){
   const map=/^a=rtpmap:(\d+) ([^/]+)/i.exec(line);
   if(!map||map[2].toLowerCase()==='opus')continue;
   const index=lines.findIndex(l=>l.startsWith(`a=fmtp:${map[1]} `));
   if(index<0)continue;
   const value=lines[index].slice(lines[index].indexOf(' ')+1).split(';').map(x=>x.trim()).filter(x=>!['minptime','useinbandfec','stereo','sprop-stereo','maxaveragebitrate','maxplaybackrate','sprop-maxcapturerate'].includes(x.split('=')[0])).join(';');
   if(value)lines[index]=`a=fmtp:${map[1]} ${value}`;else lines.splice(index,1);
  }
  const codecs=new Map();
  for(const lines of audio)for(const line of lines){
   const match=/^a=rtpmap:(\d+) (opus\/48000\/2|G722\/8000(?:\/1)?)$/i.exec(line);
   if(!match)continue;
   const key=match[1]+':'+match[2].toLowerCase();
   const entries=codecs.get(key)||[];entries.push({lines,pt:match[1],opus:/^opus/i.test(match[2])});codecs.set(key,entries);
  }
  for(const entries of codecs.values()){
   const allowed=entries[0].opus?new Set(['minptime','useinbandfec','stereo','sprop-stereo','maxaveragebitrate','maxplaybackrate','sprop-maxcapturerate']):new Set();
   const params=new Map();let conflict=false;
   for(const {lines,pt,opus} of entries){
    const value=lines.find(l=>l.startsWith(`a=fmtp:${pt} `))?.split(' ').slice(1).join(' ')||'';
    for(const item of value.split(';').map(x=>x.trim()).filter(Boolean)){
     const [name,...rest]=item.split('=');const val=rest.join('=');
     // These are Opus attributes, not G722 format parameters.
     if(!opus&&['minptime','useinbandfec'].includes(name))continue;
     if(!allowed.has(name)){conflict=true;break;}
     if(params.has(name)&&params.get(name)!==val){conflict=true;break;}
     params.set(name,val);
    }
   }
   if(conflict)continue; // Unknown or contradictory parameters need an SDK fix.
   const value=[...params].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join(';');
   for(const {lines,pt} of entries){
    const index=lines.findIndex(l=>l.startsWith(`a=fmtp:${pt} `));
    if(index>=0)lines.splice(index,1);
    if(value){const mapIndex=lines.findIndex(l=>l.startsWith(`a=rtpmap:${pt} `));lines.splice(mapIndex+1,0,`a=fmtp:${pt} ${value}`);}
   }
  }
 }
 return sections.map(lines=>lines.join(eol)).join('');
}
let installed=false;
export function installAudioSdpCompatibility(){
 if(installed)return;installed=true;
 const prototype=RTCPeerConnection.prototype;
 for(const name of ['setLocalDescription','setRemoteDescription']){
  const original=prototype[name];
  prototype[name]=function(description,...args){
   const next=description?.sdp?{type:description.type,sdp:normalizeAudioSdp(description.sdp)}:description;
   return original.call(this,next,...args);
  };
 }
}
