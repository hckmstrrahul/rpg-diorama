/** Small transparent SVG stills for the circular scene browser. */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
class Element {
  constructor(tag){this.tag=tag;this.attributes={};this.children=[];}
  setAttribute(k,v){this.attributes[k]=String(v);}
  getAttribute(k){return this.attributes[k]??null;}
  appendChild(n){if(n.parentNode)n.parentNode.children=n.parentNode.children.filter(c=>c!==n);this.children.push(n);n.parentNode=this;return n;}
  replaceChildren(...nodes){for(const n of this.children)n.parentNode=null;this.children=[];nodes.forEach(n=>this.appendChild(n));}
  insertBefore(n,b){const i=this.children.indexOf(b);this.children.splice(i<0?this.children.length:i,0,n);return n;}
  xml(){
    if(this.getAttribute('display')==='none'||this.getAttribute('opacity')==='0')return '';
    const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
    return `<${this.tag}${Object.entries(this.attributes).map(([k,v])=>` ${k}="${esc(v)}"`).join('')}>${this.children.map(n=>n.xml()).join('')}</${this.tag}>`;
  }
}
const root=new Element('svg');
Object.entries({xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 1200 880',width:1200,height:880}).forEach(([k,v])=>root.setAttribute(k,v));
const window={},context=vm.createContext({window,Math,document:{getElementById:()=>root,createElementNS:(_,tag)=>new Element(tag)}});
for(const file of ['scene.js','game.js','world-art.js','world-characters.js','legend-art.js','legend-characters.js','legend-combat.js','scene-palettes.js','worlds.js'])vm.runInContext(fs.readFileSync(new URL('../app/'+file,import.meta.url),'utf8'),context);
fs.mkdirSync(new URL('../app/assets/',import.meta.url),{recursive:true});
for(const p of window.Worlds.catalog){
  window.Worlds.activate(p.id);window.Worlds.createGame(p.id).render();
  root.setAttribute('aria-label',p.title);
  const svg=root.xml();assert(!/NaN|Infinity/.test(svg));
  fs.writeFileSync(new URL(`../app/assets/${p.id}-preview.svg`,import.meta.url),svg);
  console.log(`${p.id}: ${Math.round(svg.length/1024)} KB preview`);
}
