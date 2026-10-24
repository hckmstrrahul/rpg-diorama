import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
class Element{
  constructor(tag){this.tag=tag;this.attributes={};this.children=[];}
  setAttribute(k,v){this.attributes[k]=String(v);}getAttribute(k){return this.attributes[k]??null;}
  appendChild(n){if(n.parentNode)n.parentNode.children=n.parentNode.children.filter(c=>c!==n);this.children.push(n);n.parentNode=this;return n;}
  insertBefore(n,b){this.appendChild(n);this.children.splice(this.children.indexOf(n),1);const i=this.children.indexOf(b);this.children.splice(i<0?this.children.length:i,0,n);return n;}
  replaceChildren(...nodes){for(const n of this.children)n.parentNode=null;this.children=[];nodes.forEach(n=>this.appendChild(n));}
  all(){return [this,...this.children.flatMap(n=>n.all())];}
}
const svg=new Element('svg'),window={},context=vm.createContext({window,Math,document:{getElementById:()=>svg,createElementNS:(_,tag)=>new Element(tag)}});
for(const name of ['scene','game','world-art','world-characters','legend-art','legend-characters','legend-combat','scene-palettes','worlds'])vm.runInContext(fs.readFileSync(new URL(`../app/${name}.js`,import.meta.url),'utf8'),context);
const W=window.Worlds;
let probes=0,frames=0;
const clear=(g,a)=>{
 const [l,r,t,b]=g._limits();assert(a.x>=l-1e-5&&a.x<=r+1e-5&&a.y>=t-1e-5&&a.y<=b+1e-5,`${g.profile?.id||'midgard'}: outside arena`);
 for(const [x,y,radius] of g._obstacles())assert(Math.hypot(a.x-x,a.y-y)>=radius+g._radius(a)-.015,`${g.profile?.id||'midgard'}: prop penetration at ${a.x},${a.y} into ${x},${y}`);
};
for(const profile of W.catalog){
 const g=W.createGame(profile.id,{ai:false});W.activate(profile.id);
 // Every reachable edge, plus deliberately invalid starts inside solid props.
 for(let x=-141;x<=141;x+=12)for(let y=-108;y<=140;y+=12){const a={x,y,id:0};g._bounds(a);clear(g,a);probes++;}
 for(const [x,y] of g._obstacles()){const a={x,y,id:0};g._bounds(a);clear(g,a);probes++;}
 // Crowded bodies separate, including the large Wight, without entering scenery.
 for(const [x,y] of [[0,0],[125,120],[-125,120],[100,-80]]){
  g.reset([{x,y,angle:0},{x,y,angle:2},{x,y,angle:-2}]);
  for(let i=0;i<20;i++)g.step(1/60);
  for(const a of g.actors)clear(g,a);
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert(Math.hypot(g.actors[i].x-g.actors[j].x,g.actors[i].y-g.actors[j].y)>=g._radius(g.actors[i])+g._radius(g.actors[j])-.03,`${profile.id}: crowding merges bodies`);
 }
 g.reset();
 for(let frame=0;frame<240;frame++){
  g.hero.hp=100;g.step(1/60,{x:Math.sin(frame*.03),y:Math.cos(frame*.027)});
  for(const a of g.actors)clear(g,a);frames++;
 }
 // Rendering each character into one SVG group prevents interleaved body parts.
 g.render();const layer=svg.all().find(n=>n.getAttribute('id')==='actors');
 for(const a of g.actors){const group=layer.children.find(n=>n.getAttribute('data-actor')===String(a.id));assert(group&&group.children.length>50,`${profile.id}: incomplete character layer`);}
 const props=W.themes.get(profile.id)?.environment.entities||[];
 for(const prop of props)assert(layer.children.includes(prop.node),`${profile.id}: solid prop missing from entity layer`);
 // Walking from behind to in front of a prop changes its occlusion order.
 const prop=props.find(p=>Math.abs(p.x)<165&&p.y>0);
 if(prop){
  const actor=()=>layer.children.findIndex(n=>n.getAttribute('data-actor')==='0');
  g.hero.x=prop.x-35;g.hero.y=prop.y-35;g.render();assert(actor()<layer.children.indexOf(prop.node));
  g.hero.x=prop.x+35;g.hero.y=prop.y+35;g.render();assert(actor()>layer.children.indexOf(prop.node));
 }
}
for(const id of ['arkham','payne','spider']){
 W.activate(id);
 const fan=()=>svg.all().filter(n=>n.getAttribute('data-fan-blade')===id||id==='payne'&&n.getAttribute('data-turbine-blade')==='true');
 const g=W.createGame(id,{ai:false});g.render();const blades=fan();assert(blades.length>=5,`${id}: missing rotor`);
 const start=blades.map(n=>n.getAttribute('d'));for(let i=0;i<20;i++)g.step(1/60);g.render();assert(blades.some((n,i)=>n.getAttribute('d')!==start[i]),`${id}: Game fan is static`);
 W.renderWatch(id,1);const video=blades.map(n=>n.getAttribute('d'));W.renderWatch(id,1.3);assert(blades.some((n,i)=>n.getAttribute('d')!==video[i]),`${id}: Video fan is static`);
}
console.log(`Spatial audit passed: ${W.catalog.length} scenes, ${probes} obstacle/edge probes, ${frames} movement frames, crowd separation, prop occlusion, and all rooftop fans.`);
