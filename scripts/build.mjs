/** Dependency-free SVG build. Runs the geometry against an in-memory SVG tree. */
import fs from 'node:fs';
import vm from 'node:vm';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';

class Element {
  constructor(tag){this.tag=tag;this.attributes={};this.children=[];}
  setAttribute(k,v){this.attributes[k]=String(v);}
  getAttribute(k){return this.attributes[k]??null;}
  appendChild(n){this.children.push(n);return n;}
  all(){return [this,...this.children.flatMap(c=>c.all())];}
  xml(){const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');return `<${this.tag}${Object.entries(this.attributes).map(([k,v])=>` ${k}="${escape(v)}"`).join('')}>${this.children.map(n=>n.xml()).join('')}</${this.tag}>`;}
}
fs.mkdirSync(new URL('../artwork-exports/',import.meta.url),{recursive:true});
const root=new Element('svg');
Object.entries({xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 1200 880',width:'1200',height:'880',role:'img','aria-label':'Kratos fights two draugr in an isometric Norse courtyard. Animated SVG fan art.'}).forEach(([k,v])=>root.setAttribute(k,v));
const window={};
vm.runInNewContext(fs.readFileSync(new URL('../app/scene.js',import.meta.url),'utf8'),{document:{getElementById:()=>root,createElementNS:(_,tag)=>new Element(tag)},window,Math});
const {render,duration}=window.Diorama;
const FPS=30,N=duration*FPS;
// Populate all lazily allocated geometry before the snapshot. No browser is needed.
for(let i=0;i<N;i++)render(i/FPS);
const dynamic=root.children.filter(n=>['actors','effects','shadows'].includes(n.getAttribute('id'))).flatMap(n=>n.all().filter(c=>c.tag==='path'));
// Flames can live in either depth layer; collect their tagged groups directly.
dynamic.push(...root.all().filter(n=>n.getAttribute('data-flame')==='true').flatMap(n=>n.all().filter(c=>c.tag==='path')));
const attrs=['d','fill','opacity'];
const values=dynamic.map(()=>Object.fromEntries(attrs.map(a=>[a,[]])));
console.log(`Baking ${dynamic.length} animated paths, ${N} frames…`);
let bounds=[Infinity,Infinity,-Infinity,-Infinity];
for(let i=0;i<=N;i++){
  render(i===N?0:i/FPS);
  dynamic.forEach((node,j)=>{
    attrs.forEach(a=>{
      let value=node.getAttribute(a)|| (a==='opacity'?'1':a==='fill'?'none':'');
      if(a==='d'){
        assert(!/NaN|Infinity/.test(value),`Non-finite path at frame ${i}`);
        value=value.replace(/-?\d+\.\d+/g,n=>String(Math.round(Number(n)*10)/10));
        const nums=value.match(/-?\d+(?:\.\d+)?/g)?.map(Number)||[];
        for(let k=0;k<nums.length;k+=2){bounds[0]=Math.min(bounds[0],nums[k]);bounds[1]=Math.min(bounds[1],nums[k+1]);bounds[2]=Math.max(bounds[2],nums[k]);bounds[3]=Math.max(bounds[3],nums[k+1]);}
      }
      values[j][a].push(value);
    });
  });
}
render(0);
const staticPaths=root.all().filter(n=>n.tag==='path');
for(const n of staticPaths){const d=n.getAttribute('d');if(d)assert(!/NaN|Infinity/.test(d));}
// SVG exports include a useful still image in viewers that disable animation.
fs.writeFileSync(new URL('../artwork-exports/midgard-poster.svg',import.meta.url),'<?xml version="1.0" encoding="UTF-8"?>\n'+root.xml());
let animations=0;
dynamic.forEach((node,j)=>attrs.forEach(a=>{
  const list=values[j][a];
  assert.equal(list[0],list.at(-1),'Loop endpoints differ');
  if(list.every(v=>v===list[0]))return;
  const selected=[],times=[];
  // A stepped track only needs keys where the value changes.
  for(let i=0;i<list.length;i++)if(i===0||i===N||list[i]!==list[i-1]){selected.push(list[i]);times.push((i/N).toFixed(6));}
  const animation=new Element('animate');
  Object.entries({attributeName:a,dur:`${duration}s`,repeatCount:'indefinite',calcMode:'discrete',keyTimes:times.join(';'),values:selected.join(';')}).forEach(([k,v])=>animation.setAttribute(k,v));
  node.setAttribute(a,list[0]);node.appendChild(animation);animations++;
}));
const result='<?xml version="1.0" encoding="UTF-8"?>\n<!-- Original SVG fan-art study. Native SMIL animation; no JavaScript, raster images, fonts, or external dependencies. -->\n'+root.xml();
fs.writeFileSync(new URL('../artwork-exports/midgard.svg',import.meta.url),result);
fs.writeFileSync(new URL('../artwork-exports/midgard.svgz',import.meta.url),zlib.gzipSync(result,{level:9}));
assert(bounds[0]>=0&&bounds[1]>=0&&bounds[2]<=1200&&bounds[3]<=880,'Animated content leaves the viewBox');
console.log(JSON.stringify({frames:N,animatedPaths:dynamic.length,animationTracks:animations,totalPaths:staticPaths.length,animatedBounds:bounds,svgMB:+(Buffer.byteLength(result)/1e6).toFixed(2),loop:'All tracks have identical endpoints',geometry:'All frames finite and within viewBox'},null,2));
