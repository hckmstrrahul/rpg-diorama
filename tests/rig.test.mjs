import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Geometry-only runtime: no browser, graphics driver, or dependencies required.
class Element {
  constructor(){this.attributes={};this.children=[];}
  setAttribute(k,v){this.attributes[k]=String(v);}
  getAttribute(k){return this.attributes[k]??null;}
  appendChild(n){this.children.push(n);}
}
const root=new Element(),window={};
vm.runInNewContext(fs.readFileSync(new URL('../app/scene.js',import.meta.url),'utf8'),{window,Math,document:{getElementById:()=>root,createElementNS:()=>new Element()}});
const {Diorama:scene}=window,distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
let previous=null,maxLengthError=0,maxSlip=0,minBladeHeight=Infinity;
for(let frame=0;frame<1080;frame++){
  scene.render(frame/60);
  for(const r of scene.rigs){
    for(const bone of [...r.arms,...r.legs]){
      const error=Math.max(Math.abs(distance(bone.a,bone.b)-bone.lengths[0]),Math.abs(distance(bone.b,bone.end)-bone.lengths[1]));
      maxLengthError=Math.max(maxLengthError,error);assert(error<1e-7,'A bone changes length');
      assert([...bone.a,...bone.b,...bone.end].every(Number.isFinite),'Non-finite joint position');
    }
    r.legs.forEach(l=>assert(l.reachError<1e-6,'A foot is outside the leg reach'));
    r.feet.forEach((foot,i)=>{
      const prior=previous?.[r.id][i];
      if(prior?.planted&&foot.planted&&prior.plantSince===foot.plantSince){
        const slip=distance(prior.point,foot.point);maxSlip=Math.max(maxSlip,slip);assert(slip<1e-7,'A planted foot slides');
      }
      assert(foot.point[2]>=6-1e-7,'A foot goes through the ground');
    });
    // The weapon frame must be orthonormal even during blended contact poses.
    const origin=r.weapon([0,0,0]);
    for(const unit of [[1,0,0],[0,1,0],[0,0,1]])assert(Math.abs(distance(origin,r.weapon(unit))-1)<1e-7,'Weapon scales during a blend');
  }
  for(const point of [scene.axeGeometry.tip,scene.axeGeometry.heel,[0,0,-7]])minBladeHeight=Math.min(minBladeHeight,scene.rigs[0].weapon(point)[2]);
  previous=scene.rigs.map(r=>r.feet);
}
assert(minBladeHeight>=3,'Axe intersects the floor');
for(const t of [2.15,3.55]){
  scene.render(t);const [hero,enemy]=scene.rigs;
  assert(distance(hero.weapon(scene.axeGeometry.contact),enemy.C([0,0,39]))<3,'Axe strike misses the opponent');
}
scene.render(6.3);
assert(distance(scene.rigs[1].weapon([0,0,27]),scene.rigs[0].arms[0].end)<.1,'The blocked sword misses the shield');
scene.render(11.04);
assert(Math.abs(scene.rigs[0].weapon(scene.axeGeometry.tip)[2]-3.8)<.1,'Slam misses the ground contact');
scene.render(17.99999);const end=scene.rigs.map(r=>[r.H([0,0,54]),...r.feet.map(f=>f.point)]);
scene.render(0);
scene.rigs.forEach((r,i)=>[r.H([0,0,54]),...r.feet.map(f=>f.point)].forEach((point,j)=>assert(distance(point,end[i][j])<.001,'Rig jumps at the loop boundary')));
console.log(JSON.stringify({framesChecked:1080,maxBoneLengthError:maxLengthError,plantedFootSlippage:maxSlip,minAxeHeight:minBladeHeight,contacts:'Both axe strikes, shield block, ground slam',loop:'Head and feet match across the boundary'},null,2));

// The thrown axe must hit both enemies while spinning in the horizontal plane.
const {release,firstHit,secondHit,catch:catchTime,turns}=scene.throwTiming;
const pivot=scene.axeGeometry.pivot;
for(const [time,id] of [[firstHit,1],[secondHit,2]]){
  scene.render(time);
  assert(distance(scene.axeFlightAt(time).contact,scene.rigs[id].C([0,0,39]))<1e-6,'Boomerang misses an enemy');
}
for(let i=0;i<=180;i++){
  const f=scene.axeFlightAt(release+(catchTime-release)*i/180);
  const a=f.transform([0,0,0]),b=f.transform([0,0,23]),c=f.transform(scene.axeGeometry.contact);
  assert(Math.abs(a[2]-b[2])<1e-7&&Math.abs(a[2]-c[2])<1e-7,'Axe tumbles out of its horizontal plane');
  assert(Math.abs(distance(a,b)-23)<1e-7,'Thrown axe changes scale');
}
for(const time of [release,catchTime]){
  scene.render(time);
  const flight=scene.axeFlightAt(time),held=scene.rigs[0].weapon;
  for(const point of [[0,0,0],pivot,scene.axeGeometry.tip])assert(distance(flight.transform(point),held(point))<1e-6,'Axe jumps at release or catch');
}
assert(Math.abs(scene.axeFlightAt(catchTime).spin-scene.axeFlightAt(release).spin-Math.PI*2*turns)<1e-7,'Wrong spin count');
const first=scene.axeFlightAt(firstHit).center,second=scene.axeFlightAt(secondHit).center;
assert(scene.axeFlightAt(8.19).center[0]>Math.max(first[0],second[0])+20,'Outbound path does not bow around the enemies');
assert(scene.axeFlightAt(8.82).center[1]>Math.max(first[1],second[1])+20,'Return path retraces the outbound path');
console.log('Boomerang checks passed: two contacts, horizontal spin, rigid scale, curved return, seamless release and catch.');
