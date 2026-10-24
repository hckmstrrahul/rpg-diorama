import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Geometry and keyboard integration without a browser or graphics dependency.
class Element {
  constructor(tagName='DIV'){this.tagName=tagName;this.attributes={};Object.defineProperty(this.attributes,Symbol.iterator,{value:function*(){for(const [name,value] of Object.entries(this))yield {name,value};}});this.children=[];Object.defineProperty(this,'parentNode',{value:null,writable:true});this.handlers={};this.style={setProperty(k,v){this[k]=String(v);}};this.dataset={};this.textContent='';this.classList={values:new Set(),add(...v){v.forEach(x=>this.values.add(x));},remove(...v){v.forEach(x=>this.values.delete(x));},toggle(v,on){if(on)this.add(v);else this.remove(v);},contains(v){return this.values.has(v);}};}
  setAttribute(k,v){this.attributes[k]=String(v);}
  getAttribute(k){return this.attributes[k]??null;}
  appendChild(n){if(n.parentNode)n.parentNode.children=n.parentNode.children.filter(c=>c!==n);this.children.push(n);n.parentNode=this;return n;}
  insertBefore(n,b){if(n.parentNode)n.parentNode.children=n.parentNode.children.filter(c=>c!==n);const i=this.children.indexOf(b);this.children.splice(i<0?this.children.length:i,0,n);n.parentNode=this;return n;}
  removeAttribute(k){delete this.attributes[k];}
  remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(n=>n!==this);}
  replaceChildren(...nodes){this.children=nodes;nodes.forEach(n=>n.parentNode=this);}
  cloneNode(deep){const n=new Element(this.tagName);Object.entries(this.attributes).forEach(([k,v])=>n.setAttribute(k,v));if(deep)this.children.forEach(c=>n.appendChild(c.cloneNode(true)));return n;}
  querySelectorAll(selector){const all=this.children.flatMap(n=>[n,...n.querySelectorAll('*')]);return selector==='*'?all:selector==='[id]'?all.filter(n=>n.getAttribute('id')):all.filter(n=>n.getAttribute('display')==='none');}
  getBoundingClientRect(){const id=this.getAttribute('id');if(id==='scene-stage')return {left:0,top:0,width:window.innerWidth,height:window.innerHeight};if(id==='scene-motion'||id==='scene')return {left:0,top:60,width:window.innerWidth,height:700};if(id==='viewport')return {left:0,top:18,width:window.innerWidth,height:742,bottom:760};if(id==='scene-controls')return {top:780};if(id==='scene-prev'||id==='scene-next'){const width=240;return {left:id==='scene-prev'?-76.8:window.innerWidth-163.2,top:304,width,height:176};}if(id==='scene-overflow-wrap')return {width:(document.getElementById('scene-overflow-label').textContent.length)*7+32};return {width:100};}
  contains(n){return this===n||this.children.some(c=>c.contains(n));}
  animate(frames,options){this.lastAnimation={frames,options,cancelled:false,cancel(){this.cancelled=true;}};return this.lastAnimation;}
  addEventListener(k,fn){this.handlers[k]=fn;}
  focus(){document.activeElement=this;}
  setPointerCapture(id){this.capturedPointer=id;}
  hasPointerCapture(id){return this.capturedPointer===id;}
  releasePointerCapture(id){if(this.capturedPointer===id)this.capturedPointer=null;}
}
const nodes=new Map(),listeners={},windowListeners={};
const document={getElementById(id){if(!nodes.has(id))nodes.set(id,new Element());nodes.get(id).setAttribute('id',id);return nodes.get(id);},createElement:tag=>new Element(tag.toUpperCase()),createElementNS:(_,tag)=>new Element(tag),addEventListener(k,fn){listeners[k]=fn;},hidden:false};
document.body=new Element('BODY');document.documentElement=new Element('HTML');
const mediaPreference={matches:false,addEventListener(k,fn){this[k]=fn;}};
const motionTokens={};
const compactPreference={get matches(){return window.innerWidth<=1024;},addEventListener(){}};
const window={innerWidth:1200,innerHeight:920,getComputedStyle:n=>({transform:n.computedTransform||n.style.transform||'none',opacity:n.computedOpacity||n.style.opacity||'1',getPropertyValue:k=>motionTokens[k]||''}),addEventListener(k,fn){windowListeners[k]=fn;},matchMedia:query=>query.includes('max-width')?compactPreference:mediaPreference};
let clock=0,raf,timerId=0;
const timers=new Map();
const flushTimers=()=>{const pending=[...timers.values()];timers.clear();pending.forEach(t=>t.fn());};
const context=vm.createContext({window,document,Math,performance:{now:()=>clock},requestAnimationFrame(fn){raf=fn;},setTimeout(fn,delay){timers.set(++timerId,{fn,delay});return timerId;},clearTimeout(id){timers.delete(id);}});
for(const file of ['scene.js','game.js','world-art.js','world-characters.js','legend-art.js','legend-characters.js','legend-combat.js','scene-palettes.js','worlds.js'])vm.runInContext(fs.readFileSync(new URL('../app/'+file,import.meta.url),'utf8'),context);
const {Diorama:scene,MidgardCombat:Combat}=window;
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const step=(g,seconds,input={})=>{for(let i=0;i<Math.ceil(seconds*60);i++)g.step(1/60,input);};
const point=a=>[a.x,a.y,0];
const fixture=(enemyY=30)=>new Combat({ai:false}).reset([{x:0,y:0,angle:0},{x:0,y:enemyY,angle:Math.PI},{x:110,y:110,angle:Math.PI}]);

// Screen-relative movement, equal diagonal speed, release, and arena boundaries.
for(const [input,sign,axis] of [[{x:1},1,0],[{x:-1},-1,0],[{y:1},1,1],[{y:-1},-1,1]]){
  const g=fixture(100),before=scene.project(point(g.hero));step(g,.2,input);const after=scene.project(point(g.hero));
  assert((after[axis]-before[axis])*sign>0,'Movement must follow screen direction');
  assert(Math.abs(after[1-axis]-before[1-axis])<1e-5,'Cardinal input drifts across the screen');
  const stopped=point(g.hero);step(g,.2);assert(distance(stopped,point(g.hero))<1e-8,'Movement sticks after release');
}
const straight=fixture(100),diagonal=fixture(100);step(straight,.2,{x:1});step(diagonal,.2,{x:1,y:1});
const origin=scene.project([0,0,0]);
assert(Math.abs(distance(origin,scene.project(point(straight.hero)))-distance(origin,scene.project(point(diagonal.hero))))<1e-5,'Diagonal input moves faster');
step(straight,15,{x:1});assert(straight.hero.x<=132&&straight.hero.y>=-107,'Kratos leaves the courtyard');

// Melee contact, buffered second strike, range, costs, and recovery.
let g=fixture();assert(g.command('attack'));assert.equal(g.hero.stamina,92);step(g,.2);assert.equal(g.enemies[0].hp,72,'Damage occurs before contact');
g.command('attack');step(g,.25);assert.equal(g.enemies[0].hp,46);step(g,.8);assert.equal(g.enemies[0].hp,16,'Buffered combo failed');
g=fixture(100);g.command('attack');step(g,1);assert.equal(g.enemies[0].hp,72,'Melee hits outside its range');
g.hero.stamina=0;assert.equal(g.command('throw'),false);step(g,1.2);assert(g.hero.stamina>0,'Stamina does not recover');

// Shield covers the front; it spends stamina. Dodge has an invulnerable window.
g=fixture();step(g,.02,{block:true});assert.equal(g._damageHero(g.enemies[0]),'blocked');assert.equal(g.hero.hp,100);assert(g.hero.stamina<86.1);
g=fixture();step(g,.02,{block:true});g.enemies[0].y=-30;assert.equal(g._damageHero(g.enemies[0]),'hit');assert.equal(g.hero.hp,86,'Shield blocks an attack from behind');
g=fixture();g.hero.stamina=10;step(g,.02,{block:true});g._damageHero(g.enemies[0]);assert.equal(g.hero.hp,86);assert.equal(g.hero.stamina,0,'Guard break should exhaust stamina');
g=fixture();assert(g.command('dodge',{x:1}));step(g,.18);assert.equal(g._damageHero(g.enemies[0]),'dodged');assert.equal(g.hero.hp,100);step(g,.35);assert.equal(g._damageHero(g.enemies[0]),'hit');

// Real AI closes distance, telegraphs, attacks, and can be defended against.
g=new Combat();step(g,2);assert.equal(g.hero.hp,100);assert.equal(g.started,false,'Enemies attack before first input');
g.activate();step(g,7);assert(g.hero.hp<100,'Enemy AI never attacks');
g=new Combat();step(g,7,{block:true});assert(g.hero.hp>=86,'Front-facing guard fails during actual AI combat');

// Moving throw: both targets hit once, rigid horizontal spin, and exact catch.
g=new Combat({ai:false});g.command('throw');let hitCount=0,caught=false;
for(let i=0;i<180;i++){
  const previous=g.flight;g.step(1/60,{x:-.2,y:.1});
  if(g.flight){
    const f=g.frame().flight,a=f.transform([0,0,0]),b=f.transform([0,0,20]);
    assert(Math.abs(a[2]-b[2])<1e-7,'Thrown axe tilts out of the horizontal plane');
    assert(Math.abs(distance(a,b)-20)<1e-7,'Thrown axe scales');
    const end=g._flightAt(1.7),held=scene.makeRig(0,g.time,g._describe(g.hero));
    for(const p of [scene.axeGeometry.tip,scene.axeGeometry.pivot,[0,0,-7]])assert(distance(end.transform(p),held.weapon(p))<1e-7,'Catch does not meet the moving hand');
    hitCount=Math.max(hitCount,g.flight.hits.size);
  }
  if(previous&&!g.flight)caught=true;
}
assert(caught);assert.equal(hitCount,2);assert.deepEqual(Array.from(g.enemies,e=>e.hp),[46,46]);assert.equal(g.hero.action,null);
// Dodge can interrupt the throwing pose without losing the returning weapon.
g=new Combat({ai:false});g.command('throw');step(g,.4);assert(g.flight);g.command('dodge',{x:-1});step(g,2.3);assert.equal(g.flight,null);assert(g.frame().actors[0].axeVisible);

// Slam, enemy defeat, victory, player defeat, and a fresh restart.
g=fixture();g.command('slam');step(g,.7);assert.equal(g.enemies[0].hp,72);step(g,.12);assert.equal(g.enemies[0].hp,30);step(g,1);assert.equal(g.command('slam'),false,'Slam ignores its cooldown');
g=new Combat({ai:false});for(let i=0;i<3;i++){assert(g.command('throw'));step(g,2.7);}assert.equal(g.phase,'won');step(g,1);assert(g.frame().actors.slice(1).every(a=>a.opacity===0),'Dead enemies remain standing');
g=new Combat();g.activate();step(g,40);assert.equal(g.phase,'defeated');assert.equal(g.hero.hp,0);assert.equal(g.command('attack'),false);g.reset();assert.equal(g.phase,'ready');assert.equal(g.hero.hp,100);assert.equal(g.hero.stamina,100);

// Exercise turning, running, fighting and collisions: bones stay rigid and feet reachable.
let checked=0,previousFeet=null;
g=new Combat();g.hero.hp=10000;
for(let i=0;i<2400;i++){
  const t=i/60,input={x:Math.sign(Math.sin(t*2)),y:Math.sign(Math.cos(t*2)),block:i%500>400};
  if(i%130===0)g.command(['attack','dodge','throw','slam'][Math.floor(i/130)%4],input);
  g.step(1/60,input);const frame=g.frame();
  for(const d of frame.actors){
    const r=scene.makeRig(d.id,g.time,d);
    for(const b of [...r.arms,...r.legs]){assert([...b.a,...b.b,...b.end].every(Number.isFinite));assert(Math.abs(distance(b.a,b.b)-b.lengths[0])<1e-7);assert(Math.abs(distance(b.b,b.end)-b.lengths[1])<1e-7);}
    for(const l of r.legs)assert(l.reachError<1e-6,'Live foot falls outside leg reach');
    d.feet.forEach((f,j)=>{const old=previousFeet?.[d.id][j];if(old?.planted&&f.planted&&old.plantSince===f.plantSince)assert(distance(old.point,f.point)<1e-7,'Planted live foot slides');});
  }
  previousFeet=frame.actors.map(a=>a.feet);checked++;
  if(i%60===0){g.render();assert(!JSON.stringify(nodes.get('scene')).includes('NaN'),'Non-finite rendered path');}
}
assert.equal(scene.shieldScale,1.2);

// Exercise the actual keyboard controller, including focus and held-key cleanup.
vm.runInContext(fs.readFileSync(new URL('../app/player.js',import.meta.url),'utf8'),context);
const player=window.Player;
const key=(code,options={})=>{const event={code,target:new Element(),preventDefault(){this.prevented=true;},repeat:false,...options};listeners.keydown(event);return event;};
const advance=seconds=>{for(let i=0;i<seconds*60;i++){clock+=1000/60;raf(clock);}};
const release=code=>listeners.keyup({code});
assert.equal(player.mode,'game');assert.equal(document.getElementById('demo-controls').hidden,true);
const start=point(player.game.hero);key('KeyW');advance(.1);release('KeyW');assert(player.game.hero.y<start[1]);
key('KeyR');const reset=point(player.game.hero);key('ArrowRight');advance(.1);release('ArrowRight');assert(player.game.hero.x>reset[0]);
key('KeyR');key('KeyJ');assert.equal(player.game.hero.action.kind,'attack');advance(.2);key('KeyJ',{repeat:true});assert.equal(player.game.buffer,null,'Auto-repeat queues attacks');
key('KeyR');key('KeyK');assert.equal(player.game.hero.action.kind,'throw');
key('KeyR');key('KeyL');assert.equal(player.game.hero.action.kind,'slam');
key('KeyR');key('Space');assert.equal(player.game.hero.action.kind,'dodge');assert.equal(player.playing,true,'Space pauses instead of dodging');
key('KeyR');key('ShiftLeft');advance(.03);assert(player.game.hero.blocking);release('ShiftLeft');advance(.03);assert.equal(player.game.hero.blocking,false);
key('KeyP');assert.equal(player.playing,true);key('Escape');assert.equal(player.playing,true);player.pause();assert.equal(player.playing,true,'Game API can still pause');
assert(document.getElementById('play').hidden&&document.getElementById('play').disabled);
key('KeyD');advance(.1);release('KeyD');const paused=point(player.game.hero);key('KeyW');windowListeners.blur();assert.equal(player.playing,true);advance(.1);assert(distance(paused,point(player.game.hero))<1e-8,'Blur retains held keys');
player.setMode('watch');assert.equal(document.getElementById('play').hidden,false);key('Escape');assert.equal(player.playing,false);key('Escape');assert.equal(player.playing,true);windowListeners.blur();assert.equal(player.playing,false);player.setMode('game');assert.equal(player.playing,true);
key('KeyR');const onInput=key('KeyJ',{target:new Element('INPUT')});assert.equal(player.game.hero.action,null);assert.equal(onInput.prevented,undefined);
key('Space',{target:new Element('BUTTON')});assert.equal(player.game.hero.action,null,'Space steals native button activation');
key('KeyJ',{metaKey:true});assert.equal(player.game.hero.action,null);
player.setMode('watch');assert.equal(document.getElementById('game-hud').hidden,true);advance(.03);key('ArrowLeft');assert.equal(player.mode,'game');release('ArrowLeft');
document.hidden=true;listeners.visibilitychange();assert.equal(player.playing,true);document.hidden=false;key('KeyR');assert.equal(player.playing,true);assert.equal(player.game.state.phase,'ready');

// Zoom changes the SVG camera, keeps gameplay intact, and follows the hero up close.
const box=()=>document.getElementById('scene').getAttribute('viewBox').split(' ').map(Number);
assert.equal(player.zoom,1);assert.deepEqual(box(),[0,0,1200,880]);
document.getElementById('zoom-in').onclick();assert.equal(player.zoom,1.25);assert.equal(box()[2],960);assert.equal(player.game.started,false,'Zoom starts combat');
document.getElementById('zoom-out').onclick();assert.equal(player.zoom,1);
key('Equal');assert.equal(player.zoom,1.25);key('NumpadAdd');assert.equal(player.zoom,1.5);
key('Minus');key('NumpadSubtract');assert.equal(player.zoom,1);
for(let i=0;i<10;i++)key('Minus');assert.equal(player.zoom,.75);assert(document.getElementById('zoom-out').disabled);assert.equal(box()[2],1600);
for(let i=0;i<20;i++)key('Equal');assert.equal(player.zoom,2.5);assert(document.getElementById('zoom-in').disabled);assert.equal(box()[2],480);
key('KeyD');advance(.12);release('KeyD');
const center=[box()[0]+box()[2]/2,box()[1]+box()[3]/2],hero=scene.project([player.game.hero.x,player.game.hero.y,28]);
assert(distance(center,hero)<.001,'Zoomed camera loses Kratos');
key('Escape');assert.equal(player.playing,true);const position=point(player.game.hero);
document.getElementById('zoom-reset').onclick();assert.equal(player.zoom,1);assert.deepEqual(box(),[0,0,1200,880]);assert.equal(player.playing,true,'Game should keep running during zoom');assert(distance(position,point(player.game.hero))<1e-8);
const wheel={deltaY:-50,deltaMode:0,preventDefault(){this.prevented=true;}};
document.getElementById('viewport').handlers.wheel(wheel);assert(player.zoom>1);assert(wheel.prevented);key('Digit0');assert.equal(player.zoom,1);
document.getElementById('viewport').handlers.wheel({...wheel,deltaY:2,deltaMode:1});assert(player.zoom<1);key('Numpad0');assert.equal(player.zoom,1);
key('Equal',{ctrlKey:true});assert.equal(player.zoom,1,'Scene zoom steals browser zoom shortcut');
key('Equal',{target:new Element('INPUT')});assert.equal(player.zoom,1,'Typing in a field changes scene zoom');
player.setZoom(NaN);assert.equal(player.zoom,1);player.setMode('watch');player.seek(8);key('Equal');assert.equal(player.mode,'watch');assert.equal(player.zoom,1.25);assert(box().every(Number.isFinite));key('Digit0');

// Pointer panning owns only the camera, with capture and a stable manual view.
key('KeyR');player.setZoom(1.75);
const surface=document.getElementById('scene-stage'),cameraSvg=document.getElementById('scene');
const pointer=(type,x,y,options={})=>{const event={pointerId:1,pointerType:'mouse',button:0,buttons:1,isPrimary:true,clientX:x,clientY:y,target:cameraSvg,preventDefault(){this.prevented=true;},...options};surface.handlers[type](event);return event;};
const initialCamera=box(),panHero=point(player.game.hero),panHealth=player.game.state.health;
pointer('pointerdown',400,350);assert.equal(surface.capturedPointer,1);pointer('pointermove',402,351);assert.deepEqual(box(),initialCamera,'A click-sized movement pans the camera');
pointer('pointermove',500,410);const pannedCamera=box();assert(pannedCamera[0]<initialCamera[0]&&pannedCamera[1]<initialCamera[1],'Dragging right/down moves the scenery in the opposite direction');
assert(surface.classList.contains('is-panning'));assert.deepEqual(point(player.game.hero),panHero);assert.equal(player.game.started,false);assert.equal(player.game.state.health,panHealth);
pointer('pointerup',500,410);assert.equal(surface.capturedPointer,null);assert(!surface.classList.contains('is-panning'));advance(.05);assert.deepEqual(box(),pannedCamera,'Automatic following overrides a manually positioned camera');
key('KeyD');advance(.1);release('KeyD');assert(player.game.hero.x!==panHero[0]);assert.deepEqual(box(),pannedCamera,'Gameplay moves the manual camera');
player.selectScene(1);assert.notDeepEqual(box(),pannedCamera);player.selectScene(0);assert.deepEqual(box(),pannedCamera,'Returning to a scene forgets its manual camera');
key('Digit0');assert.deepEqual(box(),[0,0,1200,880]);assert.equal(document.body.dataset.cameraOverlay,'false');
const navigationClick=pointer('pointerdown',20,300,{target:document.getElementById('scene-prev')});assert.equal(navigationClick.prevented,undefined);assert.equal(surface.capturedPointer,null);
pointer('pointerdown',400,300,{button:2});assert.equal(surface.capturedPointer,null,'Right click starts a pan');
pointer('pointerdown',400,300,{pointerId:2,pointerType:'touch'});pointer('pointermove',460,310,{pointerId:3,pointerType:'touch',isPrimary:false});assert.deepEqual(box(),[0,0,1200,880]);
pointer('pointermove',450,340,{pointerId:2,pointerType:'touch'});pointer('pointercancel',450,340,{pointerId:2,pointerType:'touch'});assert.equal(surface.capturedPointer,null);assert(!surface.classList.contains('is-panning'));
player.resetView();player.setZoom(1.25);player.setMode('watch');player.pause();pointer('pointerdown',500,300);pointer('pointermove',600,300);pointer('pointerup',600,300);assert.equal(player.mode,'watch');assert.equal(player.playing,false,'Panning resumes a paused video');
player.setMode('game');pointer('pointerdown',500,300);pointer('pointermove',600,300);windowListeners.blur();assert.equal(surface.capturedPointer,null);assert(!surface.classList.contains('is-panning'));assert.equal(player.playing,true);
player.resetView();player.setZoom(1.25);pointer('pointerdown',400,350);pointer('pointermove',100000,100000);pointer('pointerup',100000,100000);assert(box().every(Number.isFinite));assert.deepEqual(box().slice(0,2),[-480,-352],'Panning can lose the entire scene without a bound');
document.getElementById('zoom-reset').onclick();assert.deepEqual(box(),[0,0,1200,880]);
windowListeners.resize();assert.equal(surface.style['--scene-frame-top'],'60px');assert.equal(surface.style['--scene-frame-bottom'],'160px');assert.equal(surface.style['--scene-frame-left'],'0px');assert.equal(surface.style['--scene-frame-right'],'0px');

// Default/minimum zoom navigates only after a deliberate horizontal quarter-width drag.
{
player.selectScene(0);player.resetView();key('KeyR');
const motion=document.getElementById('scene-motion');
const finishScene=()=>motion.lastAnimation?.onfinish?.();
pointer('pointerdown',600,350);pointer('pointermove',301,350);
assert.equal(player.sceneId,'midgard','Scene changes before release');
assert(motion.style.transform.includes('-299px'),'The scene does not follow a horizontal drag');
assert.deepEqual(box(),[0,0,1200,880],'Default-zoom dragging pans the camera');
pointer('pointerup',301,350);assert.equal(player.sceneId,'midgard','A sub-threshold drag switches scenes');
finishScene();assert.equal(motion.style.transform,'');assert.equal(surface.children.length,0);
const swipeFight=player.game;swipeFight.hero.hp=83;
pointer('pointerdown',600,350);pointer('pointermove',300,350);pointer('pointerup',300,350);
assert.equal(player.sceneId,'tsushima');assert.equal(player.game.started,false,'Swiping starts combat');
finishScene();pointer('pointerdown',300,350);pointer('pointermove',620,350);pointer('pointerup',620,350);
assert.equal(player.sceneId,'midgard');assert.equal(player.game,swipeFight);assert.equal(swipeFight.hero.hp,83,'Swiping resets the saved fight');finishScene();
player.setZoom(.75);
pointer('pointerdown',300,350,{pointerType:'touch'});pointer('pointermove',620,350,{pointerType:'touch'});pointer('pointerup',620,350,{pointerType:'touch'});
assert.equal(player.sceneId,'kombat','Minimum-zoom swipe fails to wrap backward');assert.equal(player.zoom,.75);finishScene();
pointer('pointerdown',600,350,{pointerType:'pen'});pointer('pointermove',280,350,{pointerType:'pen'});pointer('pointerup',280,350,{pointerType:'pen'});
assert.equal(player.sceneId,'midgard','Minimum-zoom swipe fails to wrap forward');finishScene();
pointer('pointerdown',600,350);pointer('pointermove',590,390);pointer('pointermove',200,850);pointer('pointerup',200,850);
assert.equal(player.sceneId,'midgard','A vertical gesture navigates');finishScene();
for(const cancel of ['pointercancel','lostpointercapture']){
  pointer('pointerdown',600,350);pointer('pointermove',200,350);pointer(cancel,200,350);
  assert.equal(player.sceneId,'midgard',`${cancel} commits a swipe`);finishScene();assert.equal(surface.capturedPointer,null);
}
pointer('pointerdown',600,350);pointer('pointermove',200,350);pointer('pointermove',650,350);pointer('pointerup',650,350);
assert.equal(player.sceneId,'midgard','Crossing the threshold then reversing still switches scenes');finishScene();
pointer('pointerdown',600,350);pointer('pointermove',200,350);windowListeners.blur();
assert.equal(player.sceneId,'midgard');assert.equal(surface.children.length,0);assert.equal(motion.style.transform,'');
pointer('pointerdown',600,350);pointer('pointermove',200,350);player.setZoom(1.25);
assert.equal(player.sceneId,'midgard','Zooming during a swipe commits it');assert.equal(surface.capturedPointer,null);
const beforeZoomPan=box();pointer('pointerdown',600,350);pointer('pointermove',100,400);pointer('pointerup',100,400);
assert.equal(player.sceneId,'midgard','A zoomed-in pan navigates');assert.notDeepEqual(box(),beforeZoomPan);
player.setZoom(1);assert.deepEqual(box(),[0,0,1200,880],'Returning to default zoom keeps a displaced camera');
player.setMode('watch');player.pause();pointer('pointerdown',600,350);pointer('pointermove',200,350);pointer('pointerup',200,350);
assert.equal(player.sceneId,'tsushima');assert.equal(player.mode,'watch');assert.equal(player.playing,false,'Swiping resumes paused Video mode');finishScene();
player.selectScene(0);finishScene();player.setMode('game');player.resetView();
mediaPreference.matches=true;
pointer('pointerdown',600,350);pointer('pointermove',200,350);
assert.equal(motion.style.transform,'translate(0px, 0px) scale(1)','Reduced motion translates/scales a swipe');
pointer('pointerup',200,350);assert.equal(player.sceneId,'tsushima');
assert(motion.lastAnimation.frames.every(frame=>!('transform' in frame)),'Reduced motion animates a scene slide');finishScene();
mediaPreference.matches=false;player.selectScene(0);finishScene();player.resetView();
}

// Mode tabs preserve the fight and consume their own arrow-key navigation.
key('KeyR');const playTab=document.getElementById('mode-game'),watchTab=document.getElementById('mode-watch');
assert.equal(playTab.getAttribute('aria-selected'),'true');assert.equal(watchTab.getAttribute('tabindex'),'-1');
const currentFight=player.game.hero;
watchTab.onclick();assert.equal(player.mode,'watch');assert.equal(watchTab.getAttribute('aria-selected'),'true');assert.equal(document.getElementById('viewport').getAttribute('aria-labelledby'),'mode-watch');
key('ArrowLeft',{target:watchTab});assert.equal(player.mode,'game');assert.equal(document.activeElement,playTab);advance(.05);assert.equal(player.game.started,false,'Tab navigation starts combat');assert.equal(player.game.hero,currentFight,'Mode switch resets the fight');
key('ArrowRight',{target:playTab});assert.equal(player.mode,'watch');assert.equal(document.activeElement,watchTab);
key('ArrowRight',{target:watchTab,repeat:true});assert.equal(player.mode,'watch','Holding an arrow rapidly switches modes');
key('Home',{target:watchTab});assert.equal(player.mode,'game');key('End',{target:playTab});assert.equal(player.mode,'watch');
playTab.onclick();assert.equal(player.mode,'game');assert.equal(playTab.getAttribute('tabindex'),'0');assert.equal(watchTab.getAttribute('aria-selected'),'false');
// Every new world has real combat, a reachable live rig, and its own watch performance.
const worlds=window.Worlds;
for(const profile of worlds.catalog.slice(1).filter(p=>!p.expanded)){
  worlds.activate(profile.id);let fight=worlds.createGame(profile.id,{ai:false});
  fight.command('throw');step(fight,2);assert(fight.enemies.some(e=>e.hp<72),`${profile.id}: ranged attack misses`);assert.equal(fight.flight,null);
  fight.reset([{x:0,y:0,angle:0},{x:0,y:30,angle:Math.PI},{x:90,y:90,angle:Math.PI}]);
  step(fight,.03,{block:true});assert.equal(fight._damageHero(fight.enemies[0]),'blocked');
  fight.reset([{x:0,y:0,angle:0},{x:0,y:30,angle:Math.PI},{x:90,y:90,angle:Math.PI}]);
  fight.command('attack');step(fight,.5);assert(fight.enemies[0].hp<72,`${profile.id}: melee does no damage`);
  fight.reset();step(fight,2.3,{x:.4});fight.hero.hp=50;const beforeSpecial=point(fight.hero);assert(fight.command('slam'));step(fight,.5);
  if(profile.id==='persia'){assert(fight.hero.hp>50,'Rewind fails to restore health');assert(distance(beforeSpecial,point(fight.hero))>8,'Rewind fails to restore position');}
  assert(fight.events.some(e=>e.type==='special'),`${profile.id}: special did not activate`);
  fight.reset();fight.hero.hp=10000;
  for(let i=0;i<900;i++){
    const input={x:Math.sin(i/37),y:Math.cos(i/41),block:i%250>220};
    if(i%130===0)fight.command(['attack','dodge','throw','slam'][Math.floor(i/130)%4],input);
    fight.step(1/60,input);
    for(const d of fight.frame().actors){const r=scene.makeRig(d.id,fight.time,d);for(const b of [...r.arms,...r.legs]){assert([...b.a,...b.b,...b.end].every(Number.isFinite),`${profile.id}: invalid joint`);assert(Math.abs(distance(b.a,b.b)-b.lengths[0])<1e-7);assert(Math.abs(distance(b.b,b.end)-b.lengths[1])<1e-7);}for(const b of r.legs)assert(b.reachError<1e-6,`${profile.id}: unreachable foot ${JSON.stringify({i,id:d.id,error:b.reachError,base:d.base,feet:d.feet.map(f=>f.point),action:fight.actors[d.id].action})}`);}
    if(i%90===0)fight.render();
  }
  const frames=worlds.prepareWatch(profile.id);assert.equal(frames.length,1080);assert(frames.some(f=>f.events.some(e=>e.type==='special')),`${profile.id}: watch omits special move`);
  for(const t of [0,2.3,5,8.5,11,17.9])worlds.renderWatch(profile.id,t);
  assert(!JSON.stringify(nodes.get('scene')).includes('NaN'),`${profile.id}: invalid SVG`);
}
// Batman's grapnel is a targeted approach and physical strike, including cancellation.
const batFixture=()=>worlds.createGame('arkham',{ai:false}).reset([{x:0,y:0,angle:0},{x:0,y:100,angle:Math.PI},{x:95,y:110,angle:Math.PI}]);
let bat=batFixture();assert(bat.command('slam'));assert.equal(bat.hero.stamina,62);assert.equal(bat.command('slam'),false);
step(bat,.15);assert(bat.frame().actors[0].grapnel,'Grapnel cable never fires');assert.equal(bat.enemies[0].hp,72,'Grapnel deals damage before the strike');
step(bat,.2);assert(bat.hero.y>20&&bat.hero.y<76,'Grapnel must pull Batman gradually toward the target');assert(bat.frame().actors[0].jump>0);
let contactChecked=false;
for(let i=0;i<70;i++){
  bat.step(1/60);const frame=bat.frame(),rig=scene.makeRig(0,bat.time,frame.actors[0]);
  for(const leg of rig.legs)assert(leg.reachError<1e-6,'Grapnel leaves a foot outside leg reach');
  if(!contactChecked&&bat.enemies[0].hp<72){
    assert(distance(rig.hand,[bat.enemies[0].x,bat.enemies[0].y,39])<3,'Grapnel strike does not meet the enemy');contactChecked=true;
  }
}
assert(contactChecked);assert.equal(bat.enemies[0].hp,24);assert.equal(bat.enemies[1].hp,72,'Grapnel damages an untargeted enemy');assert.equal(bat.hero.action,null);
assert(!bat.frame().actors[0].grapnel,'Cable remains after recovery');assert.equal(bat.command('slam'),false,'Grapnel ignores cooldown');
for(const positions of [[[-65,-65],[55,55]],[[65,65],[-55,-55]],[[-70,20],[80,20]]]){
  bat=worlds.createGame('arkham',{ai:false}).reset([{x:positions[0][0],y:positions[0][1],angle:0},{x:positions[1][0],y:positions[1][1],angle:0},{x:120,y:120,angle:0}]);bat.enemies[1].hp=0;assert(bat.command('slam'));
  for(let i=0;i<80;i++){bat.step(1/60);const d=bat.frame().actors[0],rig=scene.makeRig(0,bat.time,d);for(const leg of rig.legs)assert(leg.reachError<1e-6,'Long grapnel pull breaks foot reach');}
  assert.equal(bat.enemies[0].hp,24,'Long grapnel pull fails to connect');
}
bat=batFixture();bat.hero.stamina=37;assert.equal(bat.command('slam'),false);assert.equal(bat.hero.stamina,37);
bat=batFixture();bat.enemies.forEach(e=>e.hp=0);assert.equal(bat.command('slam'),false);assert.equal(bat.hero.stamina,100);
bat=worlds.createGame('arkham',{ai:false}).reset([{x:-120,y:-95,angle:0},{x:125,y:122,angle:0},{x:120,y:115,angle:0}]);
assert.equal(bat.command('slam'),false,'Grapnel accepts an out-of-range target');assert.equal(bat.hero.stamina,100);
bat=worlds.createGame('arkham',{ai:false}).reset([{x:-125,y:-100,angle:0},{x:-58,y:-100,angle:0},{x:100,y:120,angle:0}]);bat.enemies[1].hp=0;
assert.equal(bat.command('slam'),false,'Grapnel pulls through the clock tower');assert.equal(bat.hero.stamina,100);
bat=worlds.createGame('arkham',{ai:false}).reset([{x:-99,y:-88,angle:0},{x:-99,y:-15,angle:Math.PI},{x:100,y:120,angle:0}]);bat.enemies[1].hp=0;
assert(bat.command('slam'),'Touching a prop prevents grappling away from it');step(bat,1);assert.equal(bat.enemies[0].hp,24);
bat=batFixture();bat.command('slam');step(bat,.3);assert(bat.command('dodge',{x:1}));assert(!bat.frame().actors[0].grapnel);step(bat,1);assert.equal(bat.enemies[0].hp,72,'Cancelled grapnel still hits');
bat=batFixture();bat.command('slam');step(bat,.3);bat.enemies[0].hp=0;bat.enemies[0].deadAt=bat.time;step(bat,1);assert(!bat.frame().actors[0].grapnel);assert.equal(bat.enemies[1].hp,72,'Grapnel retargets after its target dies');
bat=batFixture();bat.ai=true;bat.command('slam');step(bat,1);assert.equal(bat.enemies[0].hp,24,'Grapnel fails against an approaching enemy');
assert(worlds.prepareWatch('arkham').some(f=>f.actors[0].grapnel),'Watch mode omits the new grapnel animation');
worlds.activate('midgard');player.setMode('game');key('KeyR');const originalGame=player.game;originalGame.hero.hp=73;
document.getElementById('scene-prev').onclick();assert.equal(player.sceneId,'kombat','Previous scene must wrap');
document.getElementById('scene-next').onclick();assert.equal(player.sceneId,'midgard');assert.equal(player.game,originalGame);assert.equal(player.game.hero.hp,73,'Returning to a scene loses progress');
for(let i=1;i<=worlds.catalog.length;i++){document.getElementById('scene-next').onclick();assert.equal(player.sceneId,worlds.catalog[i%worlds.catalog.length].id);assert.equal(document.getElementById(`scene-tab-${worlds.catalog[i%worlds.catalog.length].id}`).getAttribute('aria-selected'),'true');}
player.selectScene(1);key('KeyW');advance(.1);player.selectScene(2);const batStart=point(player.game.hero);advance(.05);assert(distance(batStart,point(player.game.hero))<1e-8,'Held movement leaks into the next scene');
assert.equal(document.getElementById('hint-special').textContent,'grapnel takedown');assert.equal(document.getElementById('help-special').textContent,'Grapnel takedown');
key('KeyR');key('KeyL');assert.equal(player.game.hero.action?.kind,'special');advance(.15);assert(player.game.frame().actors[0].grapnel,'L does not fire the grapnel');
player.setMode('watch');player.selectScene(3);assert.equal(player.mode,'watch');assert.equal(document.getElementById('game-hud').hidden,true);assert.equal(document.getElementById('hint-special').textContent,'hidden blade');
player.selectScene(4);assert.equal(document.getElementById('hint-special').textContent,'rewind time');
player.selectScene(0);player.setMode('game');assert.equal(document.getElementById('hint-special').textContent,'frost slam');
const entry=document.getElementById('scene-motion').lastAnimation;assert(entry.frames[0].transform.includes('translate(')&&entry.frames[0].transform.includes('scale('));assert.equal(entry.options.duration,500);
player.selectScene(1);assert(entry.cancelled,'Changing scenes leaves an old animation running');
const lastMotion=document.getElementById('scene-motion').lastAnimation;mediaPreference.matches=true;player.selectScene(2);assert(document.getElementById('scene-motion').lastAnimation.frames.every(f=>!f.transform),'Reduced motion still scales the scene');assert(lastMotion.cancelled);
mediaPreference.matches=false;document.getElementById('scene-next').onclick({detail:1});assert.equal(document.activeElement,document.getElementById('scene'),'Pointer navigation does not return gameplay focus');
key('Space',{target:document.getElementById('scene')});assert.equal(player.game.hero.action?.kind,'dodge');
player.selectScene(0);
// Scene tabs share the carousel state, preserve fights, and own their arrow keys.
key('KeyR');const sceneTabs=worlds.catalog.map(p=>document.getElementById(`scene-tab-${p.id}`));
sceneTabs.forEach(tab=>{tab.tagName='BUTTON';document.getElementById('scene-tabs').appendChild(tab);});
const preserved=player.game;preserved.hero.hp=81;player.setZoom(1.25);
sceneTabs[2].onclick({detail:1});assert.equal(player.sceneId,'arkham');assert.equal(player.zoom,1.25);assert.equal(document.activeElement,document.getElementById('scene'));
assert.equal(sceneTabs[2].getAttribute('aria-selected'),'true');assert.equal(sceneTabs[0].getAttribute('tabindex'),'-1');
assert.equal(document.getElementById('scene-motion').getAttribute('aria-labelledby'),'scene-tab-arkham');
sceneTabs[0].onclick({detail:0});assert.equal(player.game,preserved);assert.equal(player.game.hero.hp,81);
key('KeyR');key('ArrowLeft',{target:sceneTabs[0]});assert.equal(player.sceneId,'kombat');assert.equal(document.activeElement,document.getElementById('scene-overflow'));
key('ArrowRight',{target:sceneTabs.at(-1)});assert.equal(player.sceneId,'midgard');advance(.05);assert.equal(player.game.started,false,'Scene tab arrow navigation starts combat');
key('End',{target:sceneTabs[0]});assert.equal(player.sceneId,'kombat');key('Home',{target:sceneTabs.at(-1)});assert.equal(player.sceneId,'midgard');
key('ArrowRight',{target:sceneTabs[0],repeat:true});assert.equal(player.sceneId,'midgard','Holding an arrow rapidly changes scenes');
key('Space',{target:sceneTabs[0]});assert.equal(player.game.hero.action,null,'Scene tabs steal native Space activation');
document.getElementById('site-header').appendChild(document.getElementById('scene-selector'));
document.getElementById('scene-selector').appendChild(document.getElementById('scene-tabs'));
const tabsWheel={deltaY:30,target:sceneTabs[0],preventDefault(){this.prevented=true;}};document.getElementById('viewport').handlers.wheel(tabsWheel);assert.equal(player.zoom,1.25);assert.equal(tabsWheel.prevented,undefined,'Scrolling scene tabs zooms the game');
player.setMode('watch');sceneTabs[1].onclick({detail:0});assert.equal(player.mode,'watch');assert.equal(sceneTabs.filter(t=>t.getAttribute('aria-selected')==='true').length,1);
player.selectScene(0);player.setMode('game');player.setZoom(1);
// Preview direction, wraparound, snapshot filters, and interrupted transition cleanup.
document.getElementById('scene-prev').onclick();
let moving=document.getElementById('scene-motion').lastAnimation;
assert(moving.frames[0].transform.startsWith('translate(-'),'Previous preview enters from the wrong side');
const staleFinish=moving.onfinish;
let leaving=document.getElementById('scene-stage').children.at(-1);
assert(!leaving.lastAnimation.frames[1].transform.startsWith('translate(-'),'Current scene exits toward the wrong neighbor');
const snapshot=leaving.children[0],snapshotIds=new Set([snapshot,...snapshot.querySelectorAll('[id]')].map(n=>n.getAttribute('id')));
for(const n of snapshot.querySelectorAll('*'))for(const attr of n.attributes)for(const match of attr.value.matchAll(/url\(#([^)]*)\)/g))assert(snapshotIds.has(match[1]),'Snapshot has a broken SVG filter reference');
document.getElementById('scene-next').onclick();moving=document.getElementById('scene-motion').lastAnimation;
assert(!moving.frames[0].transform.startsWith('translate(-'),'Next preview enters from the wrong side');
staleFinish();assert(document.getElementById('scene-stage').classList.contains('is-switching'),'An old completion interrupts the new transition');
assert.equal(document.getElementById('scene-stage').children.length,1,'Interrupted scene snapshots accumulate');
// Responsive selector: five desktop tabs, fewer when needed, one custom menu on phones.
window.innerWidth=1400;windowListeners.resize();assert.equal(document.getElementById('scene-selector').dataset.visibleTabs,'5');
assert.equal(sceneTabs.filter(t=>!t.hidden).length,5);assert.equal(document.getElementById('scene-menu').children.length,8);
window.innerWidth=600;windowListeners.resize();assert(Number(document.getElementById('scene-selector').dataset.visibleTabs)<5);
window.innerWidth=390;windowListeners.resize();assert.equal(sceneTabs.filter(t=>!t.hidden).length,0);assert.equal(document.getElementById('scene-menu').children.length,13);assert.equal(document.getElementById('scene-overflow-label').textContent,'God of War');
document.getElementById('scene-menu').children[11].onclick();assert.equal(player.sceneId,'fable');assert.equal(document.getElementById('scene-overflow-label').textContent,'Fable III');
assert.equal(document.getElementById('scene-prev-image').getAttribute('src'),null);assert.equal(document.getElementById('scene-next-image').getAttribute('src'),null);assert(document.getElementById('scene-prev').getAttribute('aria-label').includes('Rainbow Six Siege'));
const completed=document.getElementById('scene-motion').lastAnimation;completed.onfinish();assert(!document.getElementById('scene-stage').classList.contains('is-switching'));
player.selectScene(0);window.innerWidth=1400;windowListeners.resize();
// The themed menu owns its keys, restores focus, and dismisses outside.
const menu=document.getElementById('scene-menu'),trigger=document.getElementById('scene-overflow'),wrap=document.getElementById('scene-overflow-wrap');
wrap.appendChild(trigger);wrap.appendChild(menu);document.getElementById('scene-selector').appendChild(wrap);
trigger.onclick({detail:0});assert.equal(trigger.getAttribute('aria-expanded'),'true');assert.equal(document.activeElement,menu);assert.equal(menu.hidden,false);
// Opening with the pointer must not pretend that the first overflow scene is selected.
key('Escape',{target:menu});trigger.onclick({detail:1});
const activeRows=()=>menu.children.filter(option=>option.classList.contains('is-active'));
assert.equal(activeRows().length,0);assert.equal(menu.getAttribute('aria-activedescendant'),null);
assert.equal(menu.children.filter(option=>option.getAttribute('aria-selected')==='true').length,0);
menu.children[1].handlers.pointermove({pointerType:'mouse'});assert.equal(activeRows().length,1);assert.equal(activeRows()[0],menu.children[1]);
key('ArrowDown',{target:menu});assert.equal(activeRows().length,1);assert.equal(activeRows()[0],menu.children[2]);
menu.children[1].handlers.pointermove({pointerType:'mouse'});assert.equal(activeRows().length,1);assert.equal(activeRows()[0],menu.children[1]);
menu.children[1].handlers.pointerleave();assert.equal(activeRows().length,0);
menu.children[0].handlers.pointermove({pointerType:'touch'});assert.equal(activeRows().length,0);
key('ArrowUp',{target:menu});assert.equal(activeRows()[0],menu.children.at(-1));
key('End',{target:menu});assert.equal(menu.getAttribute('aria-activedescendant'),'scene-option-kombat');
key('KeyM',{target:menu,key:'m'});assert.equal(menu.getAttribute('aria-activedescendant'),'scene-option-payne');assert.equal(player.game.hero.action,null,'Menu typeahead triggers combat');
key('Enter',{target:menu});assert.equal(player.sceneId,'payne');assert.equal(trigger.getAttribute('aria-expanded'),'false');assert.equal(document.activeElement,trigger);
assert(document.getElementById('help-special-detail').textContent.includes('6s cooldown'));assert(document.getElementById('help-special-detail').textContent.includes('6s at 30%'));
key('ArrowDown',{target:trigger});key('ArrowDown',{target:menu});key('Escape',{target:menu});assert.equal(player.sceneId,'payne');assert.equal(document.activeElement,trigger);assert.equal(player.playing,true);
trigger.onclick({detail:0});const tabEvent=key('Tab',{target:menu});assert.equal(tabEvent.prevented,undefined);assert.equal(trigger.getAttribute('aria-expanded'),'false');
trigger.onclick({detail:0});listeners.pointerdown({target:document.getElementById('scene')});assert.equal(trigger.getAttribute('aria-expanded'),'false');
trigger.onclick({detail:0});listeners.focusin({target:document.getElementById('restart')});assert.equal(trigger.getAttribute('aria-expanded'),'false');
trigger.onclick({detail:1});assert(menu.classList.contains('is-open'));trigger.onclick({detail:1});assert(menu.classList.contains('is-closing'));assert.equal(menu.inert,true);assert.equal(menu.hidden,false);
const staleMenuClose=[...timers.values()].at(-1).fn;
trigger.onclick({detail:1});staleMenuClose();assert.equal(menu.hidden,false);assert.equal(menu.inert,false);assert(menu.classList.contains('is-open'));assert(!menu.classList.contains('is-closing'),'A reopened dropdown retains its close state');
window.innerWidth=390;windowListeners.resize();assert.equal(menu.hidden,true);assert.equal(menu.children.length,13);assert.equal(document.getElementById('scene-overflow-label').textContent,'Max Payne');
player.selectScene(0);window.innerWidth=1400;windowListeners.resize();
// Popover reversal, focus restoration, and reduced-motion changes are UI-only.
motionTokens['--dropdown-close-dur']='0.21s';
trigger.onclick({detail:1});trigger.onclick({detail:1});
assert.equal([...timers.values()].at(-1).delay,210,'Popover cleanup ignores its CSS duration');
flushTimers();assert.equal(menu.hidden,true);assert.equal(menu.inert,true);assert(!menu.classList.contains('is-closing'));
delete motionTokens['--dropdown-close-dur'];
const help=document.getElementById('key-help'),helpTrigger=document.getElementById('help-trigger'),helpPanel=document.getElementById('help-panel');
help.appendChild(helpTrigger);help.appendChild(helpPanel);
const clickHelp=(detail=1)=>helpTrigger.onclick({detail,preventDefault(){this.prevented=true;}});
const fightBeforeHelp=player.game;
clickHelp();assert.equal(help.open,true);assert.equal(helpTrigger.getAttribute('aria-expanded'),'true');assert.equal(helpPanel.inert,false);
listeners.pointerdown({target:helpPanel});assert.equal(helpTrigger.getAttribute('aria-expanded'),'true','Clicking inside the help panel dismisses it');
listeners.pointerdown({target:document.getElementById('scene')});assert.equal(helpTrigger.getAttribute('aria-expanded'),'false');assert.equal(helpPanel.inert,true);assert.equal(help.open,true,'Help content disappears before its exit finishes');
const staleHelpClose=[...timers.values()].at(-1).fn;
clickHelp();staleHelpClose();assert.equal(help.open,true);assert.equal(helpPanel.hidden,false);assert(helpPanel.classList.contains('is-open'));
clickHelp();flushTimers();assert.equal(help.open,false);assert.equal(helpPanel.hidden,true);assert.equal(player.game,fightBeforeHelp);assert.equal(player.playing,true);
player.setMode('watch');clickHelp(0);key('Escape',{target:helpTrigger});assert.equal(help.open,false);assert.equal(document.activeElement,helpTrigger);assert.equal(player.playing,true,'Dismissing help pauses the video');
clickHelp();trigger.onclick({detail:1});assert.equal(help.open,false);assert.equal(menu.hidden,false,'Opening the scene menu leaves the help panel open');
clickHelp();assert.equal(menu.hidden,true);assert.equal(help.open,true);
listeners.focusin({target:document.getElementById('restart')});flushTimers();assert.equal(help.open,false);
player.setMode('game');player.selectScene(1);const inFlight=document.getElementById('scene-motion').lastAnimation;
clickHelp();clickHelp();mediaPreference.matches=true;mediaPreference.change({matches:true});
assert(inFlight.cancelled,'Changing the motion preference leaves a scene transition running');assert.equal(help.open,false);assert.equal(helpPanel.hidden,true);assert.equal(player.playing,true);
clickHelp();clickHelp();assert.equal(help.open,false);assert.equal(timers.size,0,'Reduced motion still schedules delayed dismissals');
mediaPreference.matches=false;player.selectScene(0);windowListeners.resize();

// Selection pills follow measured controls, including after fonts/layout change.
const modeBar=document.getElementById('mode-tabs'),modePill=document.getElementById('mode-selection-pill');
modeBar.getBoundingClientRect=()=>({left:100,width:180});modeBar.clientLeft=1;
playTab.getBoundingClientRect=()=>({left:104,width:76});watchTab.getBoundingClientRect=()=>({left:182,width:80});
player.setMode('watch');assert.equal(modePill.style.transform,'translateX(81px)');assert.equal(modePill.style.width,'80px');
player.setMode('game');assert.equal(modePill.style.transform,'translateX(3px)');assert.equal(modePill.style.width,'76px');
playTab.getBoundingClientRect=()=>({left:104,width:64});windowListeners.resize();assert.equal(modePill.style.width,'64px','Resize leaves the active pill at a stale width');
const selector=document.getElementById('scene-selector'),scenePill=document.getElementById('scene-selection-pill');
selector.getBoundingClientRect=()=>({left:200,width:800});selector.clientLeft=1;
sceneTabs[2].getBoundingClientRect=()=>({left:413,width:95});player.selectScene(2);assert.equal(scenePill.style.transform,'translateX(212px)');assert.equal(scenePill.style.width,'95px');
trigger.getBoundingClientRect=()=>({left:204,width:182});window.innerWidth=390;windowListeners.resize();assert.equal(scenePill.style.transform,'translateX(3px)');assert.equal(scenePill.style.width,'182px');assert.equal(menu.dataset.origin,'bottom-left');
window.innerWidth=1400;windowListeners.resize();assert.equal(menu.dataset.origin,'top-right');
const motion=document.getElementById('scene-motion');motion.computedOpacity='.79';motion.computedTransform='matrix(.8, 0, 0, .8, 20, 0)';
player.selectScene(1);const interruptedExit=document.getElementById('scene-stage').children.at(-1).lastAnimation.frames[0];
assert.equal(interruptedExit.opacity,'.79');assert.equal(interruptedExit.transform,motion.computedTransform,'An interrupted scene snaps to its full-size pose');
delete motion.computedOpacity;delete motion.computedTransform;player.selectScene(0);windowListeners.resize();
// The sparse snowfall moves continuously and repeats with the watch cycle.
worlds.activate('midgard');
const effects=nodes.get('scene').children.find(n=>n.getAttribute('id')==='effects');
const snow=()=>effects.children.filter(n=>Number(n.getAttribute('opacity'))>0).slice(-56).map(n=>[n.getAttribute('d'),n.getAttribute('fill'),n.getAttribute('opacity')]);
scene.render(0);const firstSnow=snow();assert(firstSnow.length>=40,'Snowfall is missing');scene.render(3);assert.notDeepEqual(snow(),firstSnow,'Snow does not fall');scene.render(18);assert.deepEqual(snow(),firstSnow,'Snow jumps at the loop boundary');
// A fresh compact session opens in Video, with a multi-pointer controller in Game.
window.innerWidth=390;window.innerHeight=844;
for(const [side,top] of [['prev',80],['next',650]])document.getElementById(`scene-${side}`).getBoundingClientRect=()=>({left:125,top,width:140,height:102});
vm.runInContext(fs.readFileSync(new URL('../app/player.js',import.meta.url),'utf8'),context);
const mobile=window.Player;
const finishCompactScene=()=>document.getElementById('scene-motion').lastAnimation?.onfinish?.();
assert.equal(mobile.mode,'watch');assert(mobile.playing);assert(document.getElementById('touch-controls').hidden);
mobile.setMode('game');assert.equal(document.getElementById('touch-controls').hidden,false);
const touch=(name,type,id=10,extra={})=>{
 const button=document.getElementById(`touch-${name}`),e={pointerId:id,pointerType:'touch',isPrimary:id===10,button:0,preventDefault(){},...extra};button.handlers[type](e);return button;
};
mobile.selectScene(6);mobile.game.ai=false;mobile.game.reset();
const touchStart=point(mobile.game.hero);
touch('right','pointerdown');advance(.15);assert(distance(point(mobile.game.hero),touchStart)>1,'Held direction does not move the hero');
touch('attack','pointerdown',11);assert.equal(mobile.game.hero.action.kind,'ranged');assert.equal(mobile.game.input.x,1,'Second finger cancels held movement');
touch('attack','pointerup',11);assert.equal(mobile.game.input.x,1);touch('right','pointerup');assert.equal(mobile.game.input.x,0);
assert(!document.getElementById('touch-right').classList.contains('is-pressed'));
// Sliding the same finger across the pad can steer diagonally or return to neutral.
document.getElementById('touch-dpad').getBoundingClientRect=()=>({left:0,top:0,width:132,height:132});
touch('up','pointerdown');touch('up','pointermove',10,{clientX:110,clientY:22});assert.equal(mobile.game.input.x,1);assert.equal(mobile.game.input.y,-1);
touch('up','pointermove',10,{clientX:66,clientY:66});assert.equal(mobile.game.input.x,0);assert.equal(mobile.game.input.y,0);touch('up','pointerup');
// Keyboard release must not cancel a separate finger holding the same direction.
key('KeyD');touch('right','pointerdown');release('KeyD');advance(.05);assert.equal(mobile.game.input.x,1);touch('right','pointercancel');assert.equal(mobile.game.input.x,0);
mobile.game.reset();touch('block','pointerdown');advance(.05);assert(mobile.game.hero.blocking);touch('block','lostpointercapture');advance(.05);assert(!mobile.game.hero.blocking);
mobile.game.reset();touch('special','pointerdown');touch('special','pointerup');assert(mobile.game.bulletTimeActive);advance(.1);
assert.equal(document.getElementById('touch-special').getAttribute('aria-disabled'),'true');assert(document.getElementById('touch-special-cooldown').textContent.endsWith('s'));
for(const exit of ['mode','scene','blur','resize','hidden']){
 mobile.setMode('game');touch('left','pointerdown');assert.equal(mobile.game.input.x,-1);
 if(exit==='mode')mobile.setMode('watch');if(exit==='scene')mobile.selectScene(7);if(exit==='blur')windowListeners.blur();if(exit==='resize')windowListeners.resize();if(exit==='hidden'){document.hidden=true;listeners.visibilitychange();document.hidden=false;}
 assert.equal(mobile.game.input.x,0,`${exit} leaves a touch direction held`);assert(!document.getElementById('touch-left').classList.contains('is-pressed'));assert.equal(document.getElementById('touch-left').capturedPointer,null);
}
mobile.setMode('game');mobile.selectScene(7);mobile.game.ai=false;mobile.game.reset();touch('throw','pointerdown');touch('throw','pointerup');assert.equal(mobile.game.hero.action.kind,'grenade');
mobile.setMode('watch');mobile.pause();mobile.selectScene(0);mobile.resetView();finishCompactScene();
assert.equal(document.getElementById('scene-selector').parentNode,document.getElementById('sheet-heading'));
assert.equal(document.getElementById('game-status').parentNode,document.getElementById('restart-controls'));
assert.equal(menu.parentNode,document.body);trigger.onclick({detail:1});listeners.pointerdown({target:menu});assert.equal(menu.inert,false,'Portal menu closes on its own pointer events');closeMenu();
function closeMenu(){key('Escape',{target:menu});}
// Both axes pan at every compact zoom level, without navigating or resuming Video.
for(const mode of ['watch','game'])for(const zoom of [.75,1,1.25]){
 mobile.setMode(mode);if(mode==='watch')mobile.pause();mobile.resetView();mobile.setZoom(zoom);
 const initial=box();pointer('pointerdown',190,300,{pointerType:'touch'});pointer('pointermove',100,400,{pointerType:'touch'});pointer('pointerup',100,400,{pointerType:'touch'});
 assert.equal(mobile.sceneIndex,0);assert.notDeepEqual(box(),initial,`${mode} ${zoom}: compact drag does not pan`);const manual=box();advance(.05);assert.deepEqual(box(),manual,'Manual pan is discarded at default zoom');if(mode==='watch')assert.equal(mobile.playing,false);
}
mobile.setMode('watch');mobile.pause();mobile.resetView();
const arrowDown=pointer('pointerdown',20,300,{pointerType:'touch',target:document.getElementById('scene-prev')});assert.equal(arrowDown.prevented,undefined);assert.equal(surface.capturedPointer,null);
document.getElementById('scene-prev').onclick();assert.equal(mobile.sceneId,'kombat','Previous arrow does not wrap');finishCompactScene();
document.getElementById('scene-next').onclick();assert.equal(mobile.sceneId,'midgard');finishCompactScene();
// Two fingers zoom about their midpoint; lifting one continues a smooth pan.
pointer('pointerdown',100,300,{pointerType:'touch'});pointer('pointerdown',200,300,{pointerType:'touch',pointerId:2,isPrimary:false});
pointer('pointermove',300,300,{pointerType:'touch',pointerId:2,isPrimary:false});assert.equal(mobile.zoom,2);assert.equal(mobile.sceneIndex,0);assert(box().every(Number.isFinite));
pointer('pointerup',300,300,{pointerType:'touch',pointerId:2,isPrimary:false});const pinched=box();pointer('pointermove',130,330,{pointerType:'touch'});pointer('pointerup',130,330,{pointerType:'touch'});assert.notDeepEqual(box(),pinched);assert.equal(surface.capturedPointer,null);
mobile.resetView();pointer('pointerdown',100,300,{pointerType:'touch'});pointer('pointerdown',200,300,{pointerType:'touch',pointerId:2,isPrimary:false});windowListeners.blur();assert.equal(surface.capturedPointer,null);assert(!surface.classList.contains('is-panning'));assert.equal(mobile.sceneIndex,0);
// Trackpad and wheel zoom only; they never change a compact scene.
const compactWheel=delta=>document.getElementById('viewport').handlers.wheel({deltaY:delta,deltaMode:0,target:cameraSvg,preventDefault(){}});
mobile.resetView();compactWheel(-60);assert(mobile.zoom>1);compactWheel(90);compactWheel(50);assert.equal(mobile.sceneIndex,0);
mobile.setMode('game');mobile.game.reset();advance(.05);assert.equal(document.getElementById('touch-special-cooldown').textContent,'3.2s cooldown');
mobile.setMode('watch');
window.innerWidth=1200;windowListeners.resize();assert.equal(mobile.mode,'watch','Responsive resize overwrites an explicit mode choice');assert(document.getElementById('touch-controls').hidden);assert.equal(document.getElementById('scene-selector').parentNode,document.getElementById('site-header'));assert.equal(menu.parentNode,wrap);
console.log('Compact controls passed: Video default, multi-touch, held input cleanup, cooldown labels, camera pan/pinch, arrow navigation and selector relocation.');
console.log(`Original five combat suites and all thirteen scene controls passed: combat, live rig geometry, watch performances, scene wraparound, saved fights, input cleanup, shared controls and per-scene action labels.`);
