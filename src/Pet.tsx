import { useId } from 'react';
import type { PetName } from './types';
export function Pet({variant='mochi',speaking=false,sleeping=false,small=false}:{variant?:PetName;speaking?:boolean;sleeping?:boolean;small?:boolean}) {
 const id=useId().replace(/:/g,'');
 const colors={mochi:['#d7f1b0','#9bca82','#537951'],peach:['#ffe0be','#f6aa94','#b57868'],cloud:['#e6dffc','#b9afe3','#7f75a5']}[variant];
 return <svg className={`pet-art ${speaking?'speaking':''} ${sleeping?'sleeping':''} ${small?'small':''}`} viewBox="0 0 320 310" role="img" aria-label={`${variant}, a cute ${sleeping?'sleeping':'smiling'} little companion`}>
  <defs><radialGradient id={`${id}-body`} cx="38%" cy="28%" r="75%"><stop offset="0%" stopColor={colors[0]}/><stop offset="100%" stopColor={colors[1]}/></radialGradient><linearGradient id={`${id}-ear`} x2="0" y2="1"><stop stopColor={colors[0]}/><stop offset="1" stopColor={colors[1]}/></linearGradient><filter id={`${id}-shadow`}><feGaussianBlur stdDeviation="5"/></filter></defs>
  <ellipse className="pet-shadow" cx="160" cy="278" rx="83" ry="10" fill="#3f5749" opacity=".13" filter={`url(#${id}-shadow)`}/>
  <g className="pet-body">
   <path d="M86 132C64 120 60 56 80 43C104 29 127 91 122 120" fill={`url(#${id}-ear)`} stroke={colors[2]} strokeOpacity=".12" strokeWidth="2"/>
   <path d="M198 119C193 83 218 24 238 40C256 54 251 112 231 135" fill={`url(#${id}-ear)`} stroke={colors[2]} strokeOpacity=".12" strokeWidth="2"/>
   <path d="M86 59Q76 77 92 112" fill="none" stroke="white" strokeWidth="9" opacity=".38" strokeLinecap="round"/>
   <path d="M234 58Q240 80 223 108" fill="none" stroke="white" strokeWidth="9" opacity=".3" strokeLinecap="round"/>
   <ellipse cx="106" cy="258" rx="27" ry="16" fill={colors[1]}/><ellipse cx="213" cy="258" rx="27" ry="16" fill={colors[1]}/>
   <path d="M62 183C59 123 98 93 155 94C215 91 252 126 257 187C263 241 228 266 160 267C92 269 58 241 62 183Z" fill={`url(#${id}-body)`} stroke={colors[2]} strokeOpacity=".15" strokeWidth="2"/>
   <path d="M88 134Q114 107 146 112" fill="none" stroke="white" strokeWidth="10" opacity=".32" strokeLinecap="round"/>
   <ellipse cx="160" cy="228" rx="47" ry="28" fill="#fffdf0" opacity=".27"/>
   <path className="pet-arm left" d="M69 190Q36 170 49 205Q55 218 71 218" fill={colors[1]} stroke={colors[2]} strokeWidth="2" strokeOpacity=".12"/>
   <path className="pet-arm right" d="M249 189Q281 167 272 201Q268 216 252 217" fill={colors[1]} stroke={colors[2]} strokeWidth="2" strokeOpacity=".12"/>
   <g className="pet-face">
    {sleeping?<><path d="M111 174q9 9 18 0M191 174q9 9 18 0" fill="none" stroke="#34493a" strokeWidth="5" strokeLinecap="round"/></>:<g className="pet-eyes"><ellipse cx="121" cy="171" rx="7" ry="10" fill="#34493a"/><ellipse cx="199" cy="171" rx="7" ry="10" fill="#34493a"/><circle cx="123" cy="167" r="2" fill="white"/><circle cx="201" cy="167" r="2" fill="white"/></g>}
    <ellipse cx="102" cy="192" rx="15" ry="8" fill="#ee9d94" opacity=".65"/><ellipse cx="216" cy="192" rx="15" ry="8" fill="#ee9d94" opacity=".65"/>
    {speaking?<ellipse className="pet-mouth" cx="160" cy="190" rx="9" ry="10" fill="#526447"/>:<path d="M148 187q5 9 12 1q7 8 12-1" fill="none" stroke="#34493a" strokeWidth="3.5" strokeLinecap="round"/>}
   </g>
   <g transform="translate(146 220)"><path d="M0 0Q13-12 17 0Q26-10 30-3Q27 10 16 12Q6 10 0 0" fill="#658653"/><path d="M16 11V19" stroke="#658653" strokeWidth="3" strokeLinecap="round"/></g>
  </g>
 </svg>;
}
