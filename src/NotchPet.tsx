import {useEffect,useRef,useState} from 'react';
import {Mic,MicOff,Settings2,X,Check,Send,Power,Volume2,VolumeX} from 'lucide-react';
import {Pet} from './Pet';
import {bridge} from './bridge';
import type {AppState,Nudge} from './types';
import type {ConversationState} from './voice';
export function NotchPet({state,nudge,speaking,setSpeaking,dismiss,done,snooze,patch}:{state:AppState;nudge:Nudge|null;speaking:boolean;setSpeaking:(value:boolean)=>void;dismiss:()=>void;done:()=>void;snooze:()=>void;patch:(value:Partial<AppState>)=>Promise<void>}){
 const [conversation,setConversation]=useState<ConversationState>({phase:'idle',message:'Tap to talk',transcript:[]}),[receipt,setReceipt]=useState(''),[text,setText]=useState('');
 const active=['listening','speaking'].includes(conversation.phase),connecting=conversation.phase==='connecting';
 const [bannerOpen,setBannerOpen]=useState(true);
 useEffect(()=>{if(nudge||active||connecting)setBannerOpen(true);},[nudge,active,connecting]);
 const previousLanguage=useRef(state.language);
 useEffect(()=>{
  let unsubscribe=()=>{};let disposed=false;
  void import('./voice').then(m=>{if(!disposed)unsubscribe=m.onConversation(setConversation);});
  const off=bridge.onConversationCommand(command=>{void import('./voice').then(m=>command==='stop'?m.stopConversation():m.toggleConversation(setSpeaking));});
  const offVoice=bridge.onVoice(message=>{if(/task connection|callback|helper stopped/i.test(message))setReceipt(message);});
  const actions=bridge.onTaskAction(result=>setReceipt(result.action==='added'?`Saved: ${result.task?.title} · ${new Date(result.task!.nextAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`:result.action==='complete'?`Completed: ${result.task?.title}`:`Snoozed: ${result.task?.title}`));
  let ignored=false;
  const move=(event:MouseEvent)=>{const target=document.elementFromPoint(event.clientX,event.clientY);const ignore=!target?.closest('.notch-interactive');if(ignore!==ignored){ignored=ignore;void bridge.setClickThrough(ignore);}};
  document.addEventListener('mousemove',move);
  return()=>{disposed=true;unsubscribe();off();offVoice();actions();document.removeEventListener('mousemove',move);};
 },[]);
 useEffect(()=>{if(previousLanguage.current!==state.language){previousLanguage.current=state.language;void import('./voice').then(m=>m.stopConversation('Language changed. Tap to start a new conversation.'));}},[state.language]);
 useEffect(()=>{if(!active)setSpeaking(false);},[active]);
 async function toggle(){setReceipt('');const m=await import('./voice');await m.toggleConversation(setSpeaking);}
 const heard=conversation.transcript.filter(t=>t.role==='user').at(-1)?.content;
 const latest=conversation.transcript.filter(t=>t.role==='assistant').at(-1)?.content;
 return <div className="notch-pet"><div className="notch-cap"/><div className="notch-descent"><div className="hanging-hero notch-interactive" onDoubleClick={()=>void toggle()}><Pet speaking={speaking}/></div><button className="banner-handle notch-interactive" aria-label={bannerOpen?'Roll up banner':'Open banner'} aria-expanded={bannerOpen} onClick={()=>setBannerOpen(!bannerOpen)}/>

 <div inert={!bannerOpen} className={`notch-bubble hand-banner notch-interactive ${bannerOpen?'banner-open':'banner-closed'} ${active?'conversation-open':''}`}><div className="notch-bubble-heading"><span className={`mic-dot ${active?'live':''}`}/><strong>{active?'YOUR FRIENDLY NEIGHBORHOOD LISTENER':nudge?'A FRIENDLY REMINDER':'YOUR FRIENDLY NEIGHBORHOOD SPIDER-MAN'}</strong>{nudge&&<button aria-label="Dismiss reminder" onClick={dismiss}><X size={14}/></button>}</div>
 {nudge?<><p className="notch-message">{nudge.message}</p><div className="notch-actions"><button onClick={done}>Done <Check size={12}/></button><button onClick={snooze}>In 5 minutes</button></div></>:<><p className="notch-message">{latest&&active?latest:connecting?'Getting our conversation ready…':active?(state.language==='hi'?'मैं सुन रहा हूँ। आपको क्या याद दिलाऊँ?':'I’m listening. What should I remind you about?'):state.language==='hi'?'आपके काम, मेरे ज़िम्मे। बात करें?':'Your to-dos. My spider-sense. Want to talk?'}</p>{!active&&!connecting&&<span className="notch-example">{state.language==='hi'?'“दस मिनट में पानी पीने की याद दिलाना।”':'“Remind me to drink water in ten minutes.”'}</span>}</>}
 {active&&heard&&<p className="heard-transcript">Heard: {heard}</p>}
 {active&&<div className="microphone-controls"><label>Microphone<select aria-label="Microphone input" value={conversation.microphoneId||''} onChange={e=>void import('./voice').then(m=>m.selectMicrophone(e.target.value))}><option value="">System default</option>{conversation.microphones?.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}</select></label><meter aria-label="Microphone level" min={0} max={1} value={conversation.inputLevel||0}/></div>}
 {active&&conversation.warning&&<p className="voice-warning" role="status">{conversation.warning}</p>}
 {receipt&&<div className="task-receipt" role="status"><Check size={13}/>{receipt}</div>}
 <div className="notch-meta"><span>{conversation.message}</span><select aria-label="Conversation language" value={state.language} onChange={e=>void patch({language:e.target.value as 'en'|'hi'})}><option value="en">English</option><option value="hi">हिन्दी</option></select></div>
 {active&&<form className="conversation-text" onSubmit={e=>{e.preventDefault();if(!text.trim())return;void import('./voice').then(m=>m.sendConversationText(text)).then(()=>setText('')).catch(error=>setReceipt(error.message));}}><input aria-label="Message Spider-Man" placeholder={state.language==='hi'?'या यहाँ लिखें…':'Or type a message…'} value={text} onChange={e=>setText(e.target.value)} maxLength={1500}/><button aria-label="Send message"><Send size={14}/></button></form>}
 </div></div>
 <div className="notch-toolbar notch-interactive"><button title="Open dashboard" onClick={()=>void bridge.openDashboard()}><Settings2 size={15}/></button><button className={`talk-button ${active?'live':''}`} onClick={()=>void toggle()} aria-label={active||connecting?'End conversation':'Talk to Spider-Man'}>{active||connecting?<MicOff size={15}/>:<Mic size={15}/>}<span>{connecting?'Cancel':active?'End chat':'Talk'}</span></button><button title="Mute speaker" onClick={()=>void patch({voiceEnabled:!state.voiceEnabled})}>{state.voiceEnabled?<Volume2 size={15}/>:<VolumeX size={15}/>}</button><button title="Quit app" onClick={()=>void bridge.quit()}><Power size={14}/></button></div>
 </div>;
}
