import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
class Element{
 constructor(tag){this.tag=tag;this.attributes={};this.children=[];}
 setAttribute(k,v){this.attributes[k]=String(v);}getAttribute(k){return this.attributes[k]??null;}
 appendChild(n){this.children.push(n);return n;}insertBefore(n,b){const i=this.children.indexOf(b);this.children.splice(i<0?this.children.length:i,0,n);return n;}
 all(){return [this,...this.children.flatMap(n=>n.all())];}
}
const svg=new Element('svg'),window={},context=vm.createContext({window,Math,document:{getElementById:()=>svg,createElementNS:(_,tag)=>new Element(tag)}});
for(const file of ['scene.js','game.js','world-art.js','world-characters.js','legend-art.js','legend-characters.js','legend-combat.js','scene-palettes.js','worlds.js'])vm.runInContext(fs.readFileSync(new URL('../app/'+file,import.meta.url),'utf8'),context);
const W=window.Worlds,S=window.Diorama;
const step=(g,seconds,input={})=>{for(let i=0;i<Math.ceil(seconds*60);i++)g.step(1/60,input);};
const fixture=(id,y=85)=>W.createGame(id,{ai:false}).reset([{x:0,y:0,angle:0},{x:0,y,angle:Math.PI},{x:-105,y:95,angle:0}]);
const distance=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
// Opponent positions must not steer an idle/moving character's held weapon.
for(const p of W.catalog){
 W.activate(p.id);
 for(const input of [{x:1},{x:-1},{y:1},{y:-1},{x:1,y:1},{x:-1,y:1},{x:1,y:-1},{x:-1,y:-1}]){
  const game=fixture(p.id);step(game,.35,input);
  const d=game.frame().actors[0],rig=S.makeRig(0,game.time,d),tip=rig.weapon([0,0,25]);
  assert.equal(d.gunTarget??null,null,`${p.id}: moving weapon tracks an enemy`);
  assert.equal(d.aim??null,null,`${p.id}: idle melee weapon tracks an enemy`);
  if(p.ranged){
   const barrels=[],graphics={...S.graphics,face(){},loft(){},muscle(){},solidBox(){},limb(T,a,b){
    if(a[0]===0&&((a[1]===.6&&a[2]===10&&b[2]===22)||(a[1]===.65&&a[2]===7&&b[2]===10)))barrels.push(S.graphics.norm(S.graphics.sub(T(b),T(a))));
   }};
   window.LegendCharacters.draw(rig,graphics,p.id);
   assert.equal(barrels.length,p.id==='payne'?2:1,`${p.id}: missing rendered barrel`);
   for(const direction of barrels)assert(distance(direction,[-Math.sin(game.hero.angle),Math.cos(game.hero.angle),0])<1e-8,`${p.id}: barrel does not follow the body`);
  }
  game.enemies.forEach((e,i)=>{e.x=i?90:-110;e.y=i?-90:-75;});
  const changed=game.frame().actors[0];
  assert.equal(changed.gunTarget??null,null);assert(distance(S.makeRig(0,game.time,changed).weapon([0,0,25]),tip)<1e-8,`${p.id}: moving an enemy rotates the held weapon`);
  step(game,.3);assert.equal(game.frame().actors[0].gunTarget??null,null,`${p.id}: stopping movement restores auto-aim`);
 }
}
// Firing still targets enemies; ending/cancelling it restores the carrying direction.
for(const [id,command] of [['duty','attack'],['payne','attack'],['gta','attack'],['siege','attack'],['fable','throw'],['duty','slam'],['payne','throw']]){
 const game=fixture(id);assert(game.command(command));
 assert(game.frame().actors[0].gunTarget,`${id}: shooting lost its aim`);
 step(game,.1);assert(game.command('dodge',{x:1}));
 assert.equal(game.frame().actors[0].gunTarget,null,`${id}: cancelling a shot leaves aim locked`);
}
for(const id of ['duty','payne','gta','siege']){
 const game=fixture(id),enemy=game.enemies[0];
 assert.equal(game.frame().actors[1].gunTarget,null);
 enemy.action={kind:'enemyShot',start:game.time,angle:enemy.angle};
 assert(game.frame().actors[1].gunTarget,`${id}: enemy shooting lost its aim`);
 enemy.action=null;assert.equal(game.frame().actors[1].gunTarget,null);
}
let g=fixture('duty');assert(g.command('attack'));step(g,.09);assert.equal(g.enemies[0].hp,72,'Rifle hits before firing');step(g,.5);assert.equal(g.enemies[0].hp,42,'Burst must fire three actual shots');assert.equal(g.enemies[1].hp,72);
g=fixture('duty');assert(g.command('throw'));step(g,.6);assert.equal(g.enemies[0].hp,72,'Grenade explodes before impact');step(g,.65);assert.equal(g.enemies[0].hp,32);assert.equal(g.flight,null);
g=fixture('duty');g.command('slam',{x:1});step(g,.65);assert(Math.hypot(g.hero.x,g.hero.y)>20,'Slide does not move');assert(g.enemies[0].hp<72);
// Shot line of sight is blocked by the actual Siege barricade.
g=fixture('siege');g.hero.x=47;g.hero.y=-20;g.enemies[0].x=47;g.enemies[0].y=90;g.enemies[1].hp=0;assert.equal(g._target(),null);g.command('attack');step(g,.7);assert.equal(g.enemies[0].hp,72,'Gun fires through cover');
g=fixture('siege');g.hero.x=47;g.hero.y=-15;assert(g.command('slam'));step(g,.5);assert.equal(g.breached,false);step(g,.3);assert(g.breached,'Hammer does not breach');assert(!g._obstacles().some(([x,y])=>x===47&&y===38));W.activate('siege');g.render();assert.equal(W.themes.get('siege').environment.barricade.intact.getAttribute('opacity'),'0');g.reset();g.render();assert.equal(W.themes.get('siege').environment.barricade.intact.getAttribute('opacity'),'1');
// Max uses one slowed simulation clock, with real-time duration and cooldown.
let normal=fixture('payne',120),slow=fixture('payne',120);normal.ai=slow.ai=true;normal.activate();slow.command('slam');normal.enemies.forEach(e=>e.nextAttack=100);slow.enemies.forEach(e=>e.nextAttack=100);normal.hero.y=slow.hero.y=-65;normal.enemies[0].y=slow.enemies[0].y=110;step(normal,.7);step(slow,.7);assert(110-slow.enemies[0].y<(110-normal.enemies[0].y)*.65,'Bullet Time does not slow AI');
g=fixture('payne');g.command('throw',{x:1});step(g,.6);assert(Math.hypot(g.hero.x,g.hero.y)>15);assert(g.frame().actors[0].jump>0);assert(g.enemies[0].hp<72);step(g,1);assert.equal(g.hero.action,null);
// Walking, actions, bullets, fan and rain use the same 30% world clock.
normal=fixture('payne',125);slow=fixture('payne',125);normal.ai=slow.ai=false;slow.command('slam');
const normalStart=[normal.hero.x,normal.hero.y],slowStart=[slow.hero.x,slow.hero.y];step(normal,.6,{x:1});step(slow,.6,{x:1});
assert(Math.abs(distance([slow.hero.x,slow.hero.y],slowStart)/distance([normal.hero.x,normal.hero.y],normalStart)-.3)<.01,'Max movement is not slowed');
assert(Math.abs(slow.time/normal.time-.3)<.001,'Shared simulation clock is not slowed');
assert.equal(slow.frame().worldState.timeScale,.3);assert(slow.frame().actors[0].focus);
// A new shot has a traveling head and applies damage only when it reaches a target.
g=fixture('payne',125);g.command('attack');step(g,.13);assert.equal(g.enemies[0].hp,72,'Max still deals hitscan damage');assert(g.bullets.length);const bullet=g.bullets[0];assert(bullet.duration>.15);step(g,.3);assert(g.enemies[0].hp<72,'Traveling bullet never hits');
normal=fixture('payne',125);slow=fixture('payne',125);slow.command('slam');step(slow,.42);normal.command('attack');slow.command('attack');
step(normal,.35);step(slow,.35);assert(normal.events.some(e=>e.type==='shot'));assert(!slow.events.some(e=>e.type==='shot'),'Slow fire cadence has normal timing');
step(slow,.09);assert(slow.bullets.length);assert.equal(slow.enemies[0].hp,72,'Slowed bullet hits at firing time');
const shot=slow.events.find(e=>e.type==='shot'),beforeProgress=slow.bullets[0].progress;step(slow,.15);
assert(slow.bullets[0].progress-beforeProgress<.35,'Bullet travel does not slow');assert.equal(slow.enemies[0].hp,72);step(slow,.65);assert(slow.enemies[0].hp<72);
// Hostile shots also travel before damage, and an active roll can evade impact.
g=fixture('payne',125);g._shot(g.enemies[0]);step(g,.1);assert.equal(g.hero.hp,100);step(g,.25);assert(g.hero.hp<100);
g=fixture('payne',125);g._shot(g.enemies[0]);g.command('dodge',{x:1});step(g,.4);assert.equal(g.hero.hp,100);
// A target can leave a fixed trajectory; damage is resolved from swept movement.
g=fixture('payne',125);g._shot();g.enemies[0].x=50;step(g,.6);assert.equal(g.enemies[0].hp,72,'A missed bullet homes onto the target');
// Six real seconds of dilation; the existing six-second cooldown ends with it.
g=fixture('payne',125);assert(g.command('slam'));step(g,5.9);assert(g.bulletTimeActive);assert.equal(g.command('slam'),false);step(g,.12);assert(!g.bulletTimeActive);const restored=g.time;step(g,.2);assert(Math.abs(g.time-restored-.2)<1e-6,'Normal clock does not resume');assert(g.command('slam'),'Six-second real-time cooldown was stretched by slow motion');g.reset();assert.equal(g.bullets.length,0);assert(!g.bulletTimeActive);assert.equal(g.specialReadyAt,0);
W.activate('payne');const environment=W.themes.get('payne').environment,rotor=environment.back.all().filter(n=>n.getAttribute('data-turbine-blade')==='true');assert.equal(rotor.length,5);environment.animate(0);const fanStart=rotor[0].getAttribute('d');environment.animate(.5);assert.notEqual(rotor[0].getAttribute('d'),fanStart);environment.animate(2);assert.equal(rotor[0].getAttribute('d'),fanStart,'Fan should complete one revolution in two seconds');
normal=fixture('payne');slow=fixture('payne');slow.command('slam');step(normal,.5);step(slow,.5);slow.render();const slowBlade=rotor[0].getAttribute('d');environment.animate(normal.time*.3);assert.equal(rotor[0].getAttribute('d'),slowBlade,'Fan ignores slow simulation time');environment.animate(normal.time);assert.notEqual(rotor[0].getAttribute('d'),slowBlade);
const drops=[];window.LegendCharacters.ambient(slow.time,{fx:(points)=>drops.push(points)},'payne');assert.equal(drops.length,90);const equivalent=[];window.LegendCharacters.ambient(normal.time*.3,{fx:(points)=>equivalent.push(points)},'payne');assert(distance(drops[0][0],equivalent[0][0])<1e-6,'Rain ignores the slowed clock');
// GTA throws a grenade: it arcs through the air, then explodes without a second K.
g=fixture('gta');assert(g.command('throw'));assert.equal(g.hero.stamina,82);step(g,.6);
assert.equal(g.flight.type,'grenade');assert(g.frame().flight.center[2]>g.flight.target[2]);assert.equal(g.enemies[0].hp,72,'Grenade explodes before landing');
assert.equal(g.command('throw'),false,'A second K should not detonate a grenade in flight');step(g,.65);
assert.equal(g.flight,null);assert.equal(g.enemies[0].hp,32,'Grenade must explode automatically');assert.equal(g.enemies[1].hp,72,'Blast damages an enemy outside its radius');
const energy=g.hero.stamina;assert(g.command('throw'));assert.equal(g.hero.stamina,energy-18,'A later K must throw a new grenade');
g=fixture('gta');g.command('slam');step(g,.5);g.command('attack');step(g,.6);assert(g.enemies[0].hp<30,'Red Mist does not boost damage');g.hero.action=null;g.hero.invulnerableUntil=0;g._damageHero(g.enemies[1]);assert.equal(g.hero.hp,93,'Red Mist does not reduce damage');
// Web restraints freeze one target; L is directional traversal, independent of enemies.
g=fixture('spider');g.command('throw');step(g,.65);assert.equal(g.enemies[0].bind,'web');assert(g.enemies[0].frozenUntil>g.time);assert.equal(g.enemies[1].frozenUntil,undefined);const old=[g.enemies[0].x,g.enemies[0].y];g.ai=true;step(g,1);assert.deepEqual([g.enemies[0].x,g.enemies[0].y],old);step(g,1.3);assert(g.enemies[0].frozenUntil<g.time);
g=fixture('spider',120);assert(g.command('slam'));assert.equal(g.hero.stamina,86);step(g,.5);assert(g.frame().actors[0].tether);assert(g.frame().actors[0].jump>10);step(g,.6);assert.equal(g.enemies[0].hp,72);assert(Math.hypot(g.hero.x,g.hero.y)>60);assert.equal(g.hero.action,null);assert(!g.frame().actors[0].tether);
// Empty rooftops and victory still allow traversal, with a short, enforced cooldown.
g=fixture('spider');g.enemies.forEach(e=>{e.hp=0;e.deadAt=0;});g.phase='won';assert(g.command('slam',{x:1}));const destination={...g.hero.action.destination};step(g,1);assert(Math.hypot(g.hero.x-destination.x,g.hero.y-destination.y)<.001);assert.equal(g.command('slam',{x:-1}),false);step(g,.21);assert(g.command('slam',{x:-1}));
for(const input of [{x:1},{x:-1},{y:1},{y:-1},{x:1,y:1},{x:1,y:-1},{x:-1,y:1},{x:-1,y:-1}]){
 g=fixture('spider');g.enemies.forEach(e=>e.hp=0);assert(g.command('slam',input));const origin=[g.hero.x,g.hero.y],end={...g.hero.action.destination},anchor=[...g.hero.action.anchor];
 for(let i=0;i<62;i++){g.step(1/60);assert(g.hero.x>=-141&&g.hero.x<=141&&g.hero.y>=-108&&g.hero.y<=140);assert(g._obstacles().every(([x,y,r])=>Math.hypot(g.hero.x-x,g.hero.y-y)>=r+4.9));const tether=g.frame().actors[0].tether;if(tether)assert.deepEqual([...tether.target],anchor);}
 assert(Math.hypot(g.hero.x-origin[0],g.hero.y-origin[1])>20);assert(Math.hypot(g.hero.x-end.x,g.hero.y-end.y)<.001);
}
g=fixture('spider');g.hero.x=137;g.hero.y=136;const blockedEnergy=g.hero.stamina;assert.equal(g.command('slam',{y:1}),false);assert.equal(g.hero.stamina,blockedEnergy);assert.equal(g.hero.slamReady,0);
// Immobilize does not deal arbitrary damage, and pillar has an airborne anticipation.
g=fixture('wukong');g.command('throw');step(g,.4);assert.equal(g.enemies[0].hp,260);assert(g.enemies[0].frozenUntil>g.time+2);assert.equal(g.frame().actors[1].bound,'gold');
g=fixture('wukong',35);g.command('slam');step(g,.6);assert(g.frame().actors[0].jump>20);assert.equal(g.enemies[0].hp,260);step(g,.65);assert.equal(g.enemies[0].hp,214);
// The Wight is a durable, collidable boss with telegraphed heavy attacks.
g=fixture('wukong',50);assert.equal(g.enemies[0].boss,'wight');assert.equal(g.enemies[0].maxHp,260);assert.equal(g.frame().actors[1].healthWidth,44);assert(g.frame().actors[1].healthHeight>120);g.ai=true;g.activate();g.enemies[1].hp=0;g.enemies[0].nextAttack=0;step(g,.3);assert.equal(g.enemies[0].action.kind,'wightPalm');assert(g.frame().actors[1].warning>0);assert.equal(g.hero.hp,100);step(g,.55);assert.equal(g.hero.hp,78);assert(g.events.some(e=>e.type==='wightPalm'));
g=fixture('wukong',50);g.ai=true;g.activate();g.enemies[1].hp=0;g.enemies[0].combo=1;g.enemies[0].nextAttack=0;step(g,.8);assert.equal(g.hero.hp,100);assert.equal(g.frame().actors[1].warningRadius,86);step(g,.35);assert.equal(g.hero.hp,74);assert(g.events.some(e=>e.type==='wightSlam'));
g=fixture('wukong',50);g.ai=true;g.activate();g.enemies[1].hp=0;g.enemies[0].nextAttack=0;step(g,.15);g.hero.x=-100;g.hero.y=-90;step(g,1.1);assert.equal(g.hero.hp,100,'Dodging away must avoid the heavy palm');
g=fixture('wukong',50);g.ai=true;g.activate();g.enemies[1].hp=0;g.enemies[0].nextAttack=0;step(g,.1);const heavy=g.enemies[0].action;g._damageEnemy(g.enemies[0],23,g.hero);assert.equal(g.enemies[0].action,heavy,'One light attack should not stun-lock the boss');g._damageEnemy(g.enemies[0],46,g.hero);assert.equal(g.enemies[0].action,null,'A heavy attack should stagger the boss');g._damageEnemy(g.enemies[0],1000,g.hero);step(g,.1);assert.equal(g.phase,'won');g.reset();assert.equal(g.enemies[0].hp,260);assert.equal(g.enemies[0].action,null);
g=fixture('fable',45);g.command('slam');step(g,.4);assert.equal(g.enemies[0].hp,72);step(g,.4);assert.equal(g.enemies[0].hp,34);assert(g.enemies[0].frozenUntil>g.time);assert(g.events.some(e=>e.type==='lightning'));
// Spear pulls its selected target, then Hellport lands behind an actual rival.
g=fixture('kombat',115);g.command('throw');step(g,1.15);assert.equal(g.enemies[0].hp,55);assert(Math.hypot(g.hero.x-g.enemies[0].x,g.hero.y-g.enemies[0].y)<38);assert.equal(g.enemies[1].hp,72);
g=fixture('kombat');g.command('slam');step(g,.2);assert.equal(g.hero.y,0);step(g,.6);assert(g.hero.y>85,'Hellport does not cross behind the enemy');assert.equal(g.enemies[0].hp,29);
// Cancelling a dash stops its delayed strike; target-requiring actions reject safely.
g=fixture('spider',120);g.command('slam');step(g,.24);g.command('dodge',{x:-1});step(g,1.2);assert.equal(g.enemies[0].hp,72);assert(!g.frame().actors[0].tether);
for(const id of ['spider','wukong','kombat']){g=fixture(id);g.enemies.forEach(e=>e.hp=0);const energy=g.hero.stamina;assert.equal(g.command('throw'),false);assert.equal(g.hero.stamina,energy);}
const special={duty:'slide',payne:'bulletTime',gta:'rage',spider:'webTravel',wukong:'pillar',siege:'hammer',fable:'spell',kombat:'teleport'};
let framesChecked=0;
for(const p of W.catalog.filter(p=>p.expanded)){
 W.activate(p.id);g=W.createGame(p.id,{ai:false});g.hero.hp=10000;
 for(let i=0;i<960;i++){
  const input={x:Math.sin(i/42),y:Math.cos(i/51),block:i%260>230};
  if(i%111===0)g.command(['attack','throw','slam','dodge'][Math.floor(i/111)%4],input);
  g.step(1/60,input);
  for(const d of g.frame().actors){const r=S.makeRig(d.id,g.time,d);for(const b of [...r.legs,...r.arms]){assert([...b.a,...b.b,...b.end].every(Number.isFinite),`${p.id}: invalid joint`);assert(Math.abs(distance(b.a,b.b)-b.lengths[0])<1e-7);assert(Math.abs(distance(b.b,b.end)-b.lengths[1])<1e-7);}for(const b of r.legs)assert(b.reachError<1e-6,`${p.id}: unreachable foot ${JSON.stringify({i,error:b.reachError,kind:g.actors[d.id].action?.kind})}`);}
  if(i%80===0)g.render();framesChecked++;
 }
 const watch=W.prepareWatch(p.id);assert(watch.some(f=>f.actors[0].action===special[p.id]),`${p.id}: missing watch special`);if(p.id==='siege')assert(watch.some(f=>f.worldState.breached),'Watch fails to demonstrate breach');
 for(const f of watch)for(const a of f.actors)if(a.gunTarget)assert(['ranged','enemyShot','flintlock','slide','shootdodge'].includes(a.action),`${p.id}: Video mode aims outside a shooting action`);
 for(const t of [0,4.9,10.6,11.2,17.95])W.renderWatch(p.id,t);
 const visible=svg.all().filter(n=>n.getAttribute('data-world')===p.id);assert.equal(visible.length,2);
 assert(!svg.all().some(n=>/NaN|Infinity/.test(n.getAttribute('d')||'')),`${p.id}: non-finite SVG`);
 const theme=window.ScenePalette(p.id);assert(theme.panel&&theme.energy&&theme.key&&theme.primary);assert.notEqual(theme.primary,'#40543a',`${p.id}: inherited green interface`);
 console.log(`${p.title}: mechanics, geometry, watch, artwork and palette passed`);
}
assert.equal(W.catalog.length,13);assert.equal(new Set(W.catalog.map(p=>p.id)).size,13);
console.log(`${framesChecked} expansion gameplay frames verified.`);
