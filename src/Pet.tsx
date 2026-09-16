import {useId} from 'react';
import type {PetName} from './types';
export function Pet({speaking=false,sleeping=false,small=false}:{variant?:PetName;speaking?:boolean;sleeping?:boolean;small?:boolean}){
 const id=useId().replace(/:/g,'');
 const red=`url(#${id}red)`,blue=`url(#${id}blue)`;
 return <svg className={`spider-art ${speaking?'speaking':''} ${sleeping?'sleeping':''} ${small?'small':''}`} viewBox="0 0 240 310" role="img" aria-label={`Spider-Man hanging upside down from a web${speaking?', speaking':''}`}>
 <defs>
 <radialGradient id={`${id}red`} cx=".32" cy=".25" r=".85"><stop stopColor="#ff655e"/><stop offset=".5" stopColor="#ec3447"/><stop offset="1" stopColor="#a51d3b"/></radialGradient>
 <linearGradient id={`${id}blue`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#3979b2"/><stop offset="1" stopColor="#152e59"/></linearGradient>
 <clipPath id={`${id}mask`}><path d="M73 205C70 174 88 159 119 159C151 159 170 177 167 207C165 240 146 264 120 267C94 264 76 240 73 205Z"/></clipPath>
 </defs>
 <g className="spider-swing" stroke="#55283e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
 <path d="M120-70V72" fill="none" stroke="#d7e5f4" strokeWidth="3"/><path d="M119-70V72" stroke="white" strokeWidth=".8"/>
 <g className="spider-figure">
 {/* Bent legs and crossed boots gripping the hanging web. */}
 <path d="M102 134C88 125 80 105 87 85L106 79L120 112L134 79L153 86C160 107 149 126 138 135Z" fill={blue}/>
 <path d="M87 88L85 71Q88 60 98 63L119 77L137 60Q148 57 153 70L151 87L134 95L118 85L104 96Z" fill={red}/>
 <path d="M92 72L106 83M92 82L103 89M139 70L128 81M147 77L136 87" fill="none" strokeWidth="1.1" opacity=".65"/>
 <path d="M100 125Q120 133 140 125L152 167Q119 184 88 167Z" fill={blue}/>
 {/* One hand waves; the other holds the banner. */}
 <path d="M96 140Q77 133 68 151L59 179L74 186L91 162M143 143Q159 137 171 149L191 163L219 160L225 177L190 184Q180 184 166 175L151 167" fill={red}/>
 <path d="M157 151L169 166L190 174L212 169M72 150L68 170" stroke="#ff8a7e" strokeWidth="3" fill="none" opacity=".55"/>
 <path d="M61 176L54 167Q51 163 48 166Q46 168 49 175L53 185L48 181Q42 178 42 183L49 196Q56 204 65 199L76 188L73 180Z" fill={red}/>
 <path d="M55 184L58 189M61 181L65 186M68 179L71 184" fill="none" strokeWidth="1.2"/>
 <path d="M101 130Q120 137 138 130L145 164Q120 176 94 164Z" fill={red}/>
 <g fill="none" stroke="#28243a" strokeWidth="2"><path d="M116 145L108 140L105 134M114 149L104 146L99 139M115 154L106 157L103 164M125 145L133 140L136 134M127 149L137 146L141 139M126 154L135 157L138 164"/><ellipse cx="120" cy="150" rx="4" ry="7" fill="#28243a"/></g>
 <g className="spider-head">
 <path d="M73 205C70 174 88 159 119 159C151 159 170 177 167 207C165 240 146 264 120 267C94 264 76 240 73 205Z" fill={red} strokeWidth="3"/>
 <g clipPath={`url(#${id}mask)`} fill="none" stroke="#76263c" strokeWidth="1.1" opacity=".7">
 <path d="M120 228V155M120 228L87 158M120 228L64 183M120 228L62 223M120 228L80 263M120 228V273M120 228L162 263M120 228L179 223M120 228L177 183M120 228L153 158"/>
 <path d="M72 179Q96 191 120 177Q146 191 171 179M68 199Q94 211 120 198Q147 211 174 199M72 223Q97 234 120 221Q145 234 170 223M84 247Q103 245 120 255Q139 245 156 247"/>
 </g>
 <g className="spider-eyes" fill="#fffef5" stroke="#25283d" strokeWidth="4.5"><path d="M83 192Q95 194 112 211Q106 227 91 222Q82 211 83 192Z"/><path d="M158 188Q144 193 128 211Q137 225 150 219Q159 208 158 188Z"/></g>
 <path d="M87 179Q97 169 110 169" stroke="#ffc0a8" strokeWidth="3.5" fill="none" opacity=".65"/>
 <path d="M110 254Q120 258 130 254" stroke="#ff776e" strokeWidth="2" fill="none" opacity=".6"/>
 </g>
 <g className="banner-grip"><path d="M218 160Q220 151 225 153L228 160L235 158Q242 159 238 166L234 178Q226 184 218 177Z" fill={red}/><path d="M225 164L235 166M224 170L233 173" strokeWidth="1.2" fill="none"/></g>
 </g></g></svg>;
}
