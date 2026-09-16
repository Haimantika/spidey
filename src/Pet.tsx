import {useId} from 'react';
import type {PetName} from './types';
export function Pet({speaking=false,sleeping=false,small=false}:{variant?:PetName;speaking?:boolean;sleeping?:boolean;small?:boolean}){
 const id=useId().replace(/:/g,'');
 return <svg className={`spider-art ${speaking?'speaking':''} ${sleeping?'sleeping':''} ${small?'small':''}`} viewBox="0 0 240 310" role="img" aria-label={`Spider-Man hanging upside down from a web${speaking?', speaking':''}`}>
 <defs><linearGradient id={`${id}red`} x2=".9" y2="1"><stop stopColor="#f46359"/><stop offset=".55" stopColor="#d52f3c"/><stop offset="1" stopColor="#9b2039"/></linearGradient><linearGradient id={`${id}blue`} x2="1" y2="1"><stop stopColor="#416886"/><stop offset="1" stopColor="#182b48"/></linearGradient><clipPath id={`${id}mask`}><path d="M68 187C66 153 86 139 120 139S174 155 172 187L168 215C164 249 142 269 120 269S76 249 72 215Z"/></clipPath></defs>
 <g className="spider-swing">
 <path className="web-thread" d="M120-65V73" fill="none" stroke="#dfe5ee" strokeWidth="2.5"/>
 <path d="M120-65V73" fill="none" stroke="white" strokeWidth=".7"/>
 <g className="spider-figure">
 <path d="M119 91C111 87 83 95 81 111L83 151L101 159L109 113L120 113L131 115L141 159L159 151L159 110C156 97 132 86 119 91" fill={`url(#${id}blue)`} stroke="#20364b" strokeWidth="3"/>
 <path d="M94 102L88 82Q92 63 108 66L120 78L132 66Q148 63 152 82L146 102L129 94L120 91L111 94Z" fill={`url(#${id}red)`} stroke="#652a3a" strokeWidth="2.5"/>
 <path d="M116 70L116 91M124 70L124 91M92 80L108 85M133 85L149 80" stroke="#6b2a3c" strokeWidth="1.5" fill="none"/>
 <path d="M84 122C71 116 62 123 62 137L57 166L75 172L84 148" fill={`url(#${id}red)`} stroke="#722c3a" strokeWidth="2"/>
 <path d="M156 122C169 116 178 123 178 137L183 166L165 172L156 148" fill={`url(#${id}red)`} stroke="#722c3a" strokeWidth="2"/>
 <path d="M83 120Q120 134 157 120L153 163Q120 177 87 163Z" fill={`url(#${id}red)`} stroke="#6c293c" strokeWidth="2.5"/>
 <path d="M105 146L96 137M105 151L94 148M106 156L96 163M135 146L144 137M135 151L146 148M134 156L144 163" stroke="#253346" strokeWidth="3" fill="none" strokeLinecap="round"/>
 <ellipse cx="120" cy="150" rx="7" ry="10" fill="#243246"/><path d="M113 147L105 146M113 151L105 151M114 155L106 156M127 147L135 146M127 151L135 151M126 155L134 156" stroke="#243246" strokeWidth="3"/>
 <path d="M68 187C66 153 86 139 120 139S174 155 172 187L168 215C164 249 142 269 120 269S76 249 72 215Z" fill={`url(#${id}red)`} stroke="#79293d" strokeWidth="3"/>
 <g clipPath={`url(#${id}mask)`} fill="none" stroke="#752b3c" strokeWidth="1.5" opacity=".65">
 <path d="M120 229V131M120 229L77 135M120 229L56 169M120 229L52 215M120 229L77 275M120 229V280M120 229L166 275M120 229L190 215M120 229L189 169M120 229L164 135"/>
 <path d="M67 163Q91 184 120 167Q147 184 174 163M63 187Q92 207 120 193Q148 207 177 187M64 213Q94 226 120 215Q146 226 178 213M76 245Q96 238 120 249Q144 238 165 245"/>
 </g>
 <g className="spider-eyes" fill="#fcfcf4" stroke="#27303e" strokeWidth="5" strokeLinejoin="round"><path d="M82 184Q99 188 111 207Q96 221 83 211Q78 199 82 184Z"/><path d="M158 184Q141 188 129 207Q144 221 157 211Q162 199 158 184Z"/></g>
 <path d="M84 165Q95 151 110 150" fill="none" stroke="#ffb9a8" opacity=".4" strokeWidth="4" strokeLinecap="round"/>
 <path d="M57 160Q50 171 55 182Q68 189 77 177L75 162M183 160Q190 171 185 182Q172 189 163 177L165 162" fill={`url(#${id}red)`} stroke="#752b3c" strokeWidth="2.5"/>
 </g></g></svg>;
}
