/** Bake each additional watch performance into a standalone, script-free SVG. */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
class Element {
  constructor(tag){this.tag=tag;this.attributes={};this.children=[];}
  setAttribute(k,v){this.attributes[k]=String(v);}
  getAttribute(k){return this.attributes[k]??null;}
  appendChild(n){this.children.push(n);return n;}
  insertBefore(n,b){const i=this.children.indexOf(b);this.children.splice(i<0?this.children.length:i,0,n);return n;}
  all(){return [this,...this.children.flatMap(c=>c.all())];}
  xml(){const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');return `<${this.tag}${Object.entries(this.attributes).map(([k,v])=>` ${k}="${esc(v)}"`).join('')}>${this.children.map(n=>n.xml()).join('')}</${this.tag}>`;}
}
fs.mkdirSync(new URL('../artwork-exports/',import.meta.url),{recursive:true});
for(const id of (process.argv.slice(2).length?process.argv.slice(2):['tsushima','arkham','assassin','persia','duty','payne','gta','spider','wukong','siege','fable','kombat'])){
  const root=new Element('svg');for(const [k,v] of Object.entries({xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 1200 880',width:1200,height:880,role:'img'}))root.setAttribute(k,v);
  const window={},context=vm.createContext({window,Math,document:{getElementById:()=>root,createElementNS:(_,tag)=>new Element(tag)}});
  for(const file of ['scene.js','game.js','world-art.js','world-characters.js','legend-art.js','legend-characters.js','legend-combat.js','scene-palettes.js','worlds.js'])vm.runInContext(fs.readFileSync(new URL('../app/'+file,import.meta.url),'utf8'),context);
  const p=window.Worlds.activate(id),render=t=>window.Worlds.renderWatch(id,t),N=432,FPS=24;
  root.setAttribute('aria-label',`${p.title}: ${p.hero} in ${p.place}. Animated SVG fan art.`);
  root.children=root.children.filter(n=>n.getAttribute('display')!=='none');
  const gradient=new Element('radialGradient');gradient.setAttribute('id','world-background');gradient.setAttribute('cy','40%');gradient.setAttribute('r','75%');
  p.bg.forEach((color,i)=>{const stop=new Element('stop');stop.setAttribute('offset',`${i*50}%`);stop.setAttribute('stop-color',color);gradient.appendChild(stop);});root.children[0].appendChild(gradient);
  const background=new Element('rect');for(const [k,v] of Object.entries({width:1200,height:880,fill:'url(#world-background)'}))background.setAttribute(k,v);root.insertBefore(background,root.children[1]);
  for(let i=0;i<N;i++)render(i/FPS);
  const dynamic=root.children.filter(n=>['actors','effects','shadows'].includes(n.getAttribute('id'))).flatMap(n=>n.all().filter(c=>c.tag==='path'));
  dynamic.push(...root.all().filter(n=>n.getAttribute('data-animated')==='true'));
  const attrs=['d','fill','opacity','stroke','stroke-width'],values=dynamic.map(()=>Object.fromEntries(attrs.map(a=>[a,[]])));
  for(let i=0;i<=N;i++){
    render(i===N?0:i/FPS);
    dynamic.forEach((node,j)=>attrs.forEach(a=>{let v=node.getAttribute(a)||(a==='opacity'?'1':a==='fill'||a==='stroke'?'none':a==='stroke-width'?'.4':'');assert(!/NaN|Infinity/.test(v),`${id}: non-finite geometry`);if(a==='d')v=v.replace(/-?\d+\.\d+/g,n=>String(Math.round(Number(n)*10)/10));values[j][a].push(v);}));
  }
  render(1.2);fs.writeFileSync(new URL(`../artwork-exports/${id}-poster.svg`,import.meta.url),root.xml());render(0);
  let tracks=0;
  dynamic.forEach((node,j)=>attrs.forEach(a=>{const list=values[j][a];assert.equal(list[0],list.at(-1));if(list.every(v=>v===list[0]))return;const selected=[],times=[];for(let i=0;i<=N;i++)if(i===0||i===N||list[i]!==list[i-1]){selected.push(list[i]);times.push((i/N).toFixed(6));}const anim=new Element('animate');for(const [k,v] of Object.entries({attributeName:a,dur:'18s',repeatCount:'indefinite',calcMode:'discrete',keyTimes:times.join(';'),values:selected.join(';')}))anim.setAttribute(k,v);node.setAttribute(a,list[0]);node.appendChild(anim);tracks++;}));
  const xml='<?xml version="1.0" encoding="UTF-8"?>\n'+root.xml();fs.writeFileSync(new URL(`../artwork-exports/${id}.svg`,import.meta.url),xml);
  console.log(JSON.stringify({scene:id,frames:N,paths:dynamic.length,tracks,MB:+(Buffer.byteLength(xml)/1e6).toFixed(2)}));
}
