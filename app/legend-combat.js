/* Distinct combat rules for the eight expansion scenes, on the shared IK controller. */
(() => {
  'use strict';
  const S=window.Diorama,G=window.MidgardCombat;
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),sm=x=>{x=clamp(x);return x*x*(3-2*x);},band=(t,a,b,c,d)=>sm((t-a)/(b-a))*(1-sm((t-c)/(d-c)));
  const mix=(a,b,t)=>a+(b-a)*t,V=(a,b)=>a.map((x,i)=>x+b[i]),M=(a,n)=>a.map(x=>x*n),L=(a,b,u)=>a.map((x,i)=>mix(x,b[i],u));
  const unit=v=>M(v,1/(Math.hypot(...v)||1)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),angle=(a,b)=>Math.atan2(-(b.x-a.x),b.y-a.y),facing=a=>[-Math.sin(a.angle),Math.cos(a.angle),0];
  const profiles=[
    {id:'duty',title:'Call of Duty',hero:'Ghost',place:'Stormbound cargo deck',bg:['#c3cbd0','#aab8bd','#8f9fa7'],accent:'#5c5e47',palette:'duty',labels:['rifle burst','frag grenade','slide burst','combat dive','brace'],help:['Rifle burst','Frag grenade','Slide and fire','Combat dive','Hold brace'],obstacles:[[-95,-151,78],[88,-150,76],[155,-48,29],[-154,-64,22],[-154,139,24]],ranged:true},
    {id:'payne',title:'Max Payne',hero:'Max Payne',place:'New York after midnight',bg:['#9da7b9','#8b97ac','#828da3'],accent:'#454260',palette:'payne',labels:['dual pistols','shootdodge','bullet time','roll','take cover'],help:['Dual-pistol fire','Shootdodge','Bullet Time (6 seconds)','Defensive roll','Crouch and brace'],obstacles:[[-157,-57,27],[153,-69,29],[147,124,24]],ranged:true},
    {id:'gta',title:'GTA V',hero:'Trevor Philips',place:'Los Santos at golden hour',bg:['#ead7d0','#d6b9b4','#c19caa'],accent:'#785074',palette:'gta',labels:['carbine','grenade','red mist','combat roll','brace'],help:['Carbine burst','Throw grenade','Red Mist (damage / resistance)','Combat roll','Hold brace'],obstacles:[[-148,-67,39],[153,-115,12],[-150,116,12],[157,135,12]],ranged:true},
    {id:'spider',title:'Spider-Man',hero:'Peter Parker',place:'Above the streets of Manhattan',bg:['#e0d5cd','#c5bdc9','#aaaec3'],accent:'#974e59',palette:'spider',labels:['acrobatic combo','web snare','web travel','vault dodge','spider-sense'],help:['Acrobatic combo','Web snare','Web travel (direction + L, 1.2s)','Acrobatic vault','Spider-sense counter'],obstacles:[[-119,-137,25],[139,-74,21],[-148,48,21],[146,66,26]],ranged:false},
    {id:'wukong',title:'Black Myth: Wukong',hero:'The Destined One',place:'Black Wind Mountain shrine',bg:['#d5d2b8','#bab99d','#9d9f86'],accent:'#766334',palette:'wukong',labels:['staff combo','immobilize','pillar smash','perfect dodge','staff spin'],help:['Staff sweep combo','Immobilize (2.6 seconds)','Pillar smash','Perfect dodge','Hold staff spin'],obstacles:[[113,-126,22],[-141,99,14],[126,99,14],[-165,113,12]],ranged:false},
    {id:'siege',title:'Rainbow Six Siege',hero:'Sledge',place:'Clubhouse breach room',bg:['#cbd7dd','#b0c3ce','#93acbd'],accent:'#3c6886',palette:'siege',labels:['rifle burst','stun grenade','breaching hammer','sidestep','brace'],help:['Controlled rifle burst','Stun nearby defenders','Hammer / breach barricade','Tactical sidestep','Crouch and brace'],obstacles:[[148,75,25],[144,116,21],[-147,129,26]],ranged:true},
    {id:'fable',title:'Fable III',hero:'The Hero of Brightwall',place:'Brightwall market square',bg:['#e1dbc8','#c6c6b2','#b1b69f'],accent:'#5c658b',palette:'fable',labels:['sword flourish','flintlock','spell weave','roll','sword guard'],help:['Sword flourish combo','Flintlock pistol shot','Weave fire and lightning','Combat roll','Hold sword guard'],obstacles:[[132,97,23],[-159,88,14],[158,-65,14],[158,8,25],[-144,150,24]],ranged:false},
    {id:'kombat',title:'Mortal Kombat',hero:'Scorpion',place:'The firelit tournament courtyard',bg:['#cdb5a5','#b2978b','#9d8884'],accent:'#874d38',palette:'kombat',labels:['kombat combo','spear pull','hellport','dash evade','guard'],help:['Punch and uppercut combo','Spear pull','Hellport strike','Dash evade','Hold fighting guard'],obstacles:[[-151,-57,18],[149,-56,18],[-145,130,18],[146,130,18]],ranged:false}
  ].map(p=>({...p,expanded:true,contact:[0,0,1],attackRange: p.id==='wukong'?57:p.id==='fable'?45:34}));
  class LegendCombat extends G{
    constructor(profile,options={}){super(options);this.profile=profile;this.reset();}
    reset(starts){
      super.reset(starts);this.realTime=0;this.specialReadyAt=0;this.bullets=[];this.slowUntil=0;this.rageUntil=0;this.breached=false;this.motionTrail=[];
      if(this.profile?.id==='wukong'){
        const boss=this.actors[1];boss.boss='wight';boss.hp=boss.maxHp=260;boss.radius=22;boss.poise=0;boss.combo=0;boss.nextAttack=1.7;
        if(!starts){boss.x=-38;boss.y=-49;boss.angle=angle(boss,this.hero);boss.feet.forEach((f,i)=>{f.point=this._stance(boss,i?1:-1);f.angle=boss.angle;});}
      }
      return this;
    }
    _webRoute(input){
      const h=this.hero,move=this._movement(input),dir=Math.hypot(...move)>.01?unit(move):facing(h);
      let destination={x:h.x,y:h.y};
      // Sweep the whole route so the zip cannot tunnel through rooftop equipment.
      for(let distance=2;distance<=112;distance+=2){
        const point={x:h.x+dir[0]*distance,y:h.y+dir[1]*distance};
        if(point.x< -137||point.x>137||point.y< -104||point.y>136||!this._clear(h,point,8))break;
        if(this.enemies.every(e=>e.hp<=0||dist(e,point)>20))destination=point;
      }
      if(dist(h,destination)<20)return null;
      const anchors=[[-164,-160,98],[167,-160,98],[-164,158,97],[167,158,97],[-119,-137,108]];
      const score=a=>{const v=unit([a[0]-h.x,a[1]-h.y,0]);return (v[0]*dir[0]+v[1]*dir[1])*2-Math.hypot(a[0]-destination.x,a[1]-destination.y)/300;};
      const anchor=anchors.sort((a,b)=>score(b)-score(a))[0];
      return {destination,anchor,dir};
    }
    _obstacles(){return [...(this.profile?.obstacles||[]),...(this.profile?.id==='siege'&&!this.breached?[[47,38,22]]:[])];}
    _clear(a,b,pad=0){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<.01)return true;return this._obstacles().every(([x,y,r])=>{const t=clamp(((x-a.x)*dx+(y-a.y)*dy)/(len*len));return Math.hypot(a.x+dx*t-x,a.y+dy*t-y)>=r+pad-.01;});}
    _target(range=185){return this.enemies.filter(e=>e.hp>0&&dist(this.hero,e)<=range&&this._clear(this.hero,e)).sort((a,b)=>dist(this.hero,a)-dist(this.hero,b))[0]||null;}
    command(kind,input=this.input){
      const h=this.hero,id=this.profile.id;this.input=input;
      if(id==='payne')h.slamReady=this.time+Math.max(0,this.specialReadyAt-this.realTime);
      if(h.hp<=0||this.phase==='won'&&!(id==='spider'&&kind==='slam'))return false;
      if(kind==='dodge'){const ok=super.command(kind,input);if(ok){this.motionTrail=[];this.flight?.type==='spear'&&(this.flight=null);}return ok;}
      if(h.action?.kind==='melee'&&kind==='attack'&&this.time-h.action.start>.17){this.buffer={kind:'attack',expires:h.action.start+h.action.duration+.2};return true;}
      if(h.action||h.hurtUntil>this.time||kind==='throw'&&this.flight||kind==='slam'&&this.time<h.slamReady)return false;
      const types={duty:['ranged','grenade','slide'],payne:['ranged','shootdodge','bulletTime'],gta:['ranged','grenade','rage'],spider:['melee','web','webTravel'],wukong:['melee','immobilize','pillar'],siege:['ranged','flash','hammer'],fable:['melee','flintlock','spell'],kombat:['melee','spear','teleport']};
      const index={attack:0,throw:1,slam:2}[kind];if(index===undefined)return false;
      const type=types[id][index],target=type==='webTravel'?null:this._target(type==='spear'?165:195);
      if(['teleport','immobilize','web','spear'].includes(type)&&!target)return false;
      const route=type==='webTravel'?this._webRoute(input):null;if(type==='webTravel'&&!route)return false;
      let destination=route?.destination||null;
      if(type==='teleport'){
        const f=facing(target);destination={x:target.x-f[0]*24,y:target.y-f[1]*24};
        if(Math.abs(destination.x)>140||destination.y< -105||destination.y>138||!this._obstacles().every(([x,y,r])=>Math.hypot(destination.x-x,destination.y-y)>r+6))return false;
      }
      const cost=type==='webTravel'?14:index===2?34:index===1?18:6;if(!this._spend(cost))return false;
      const durations={ranged:.53,melee:id==='wukong'?.72:.64,grenade:.66,flash:.66,slide:.9,shootdodge:1.15,bulletTime:.12,rage:.4,web:.64,webTravel:.95,immobilize:.62,pillar:1.65,hammer:1.18,flintlock:.65,spell:1.24,spear:1.1,teleport:1.1};
      const movement=this._movement(input),dir=Math.hypot(...movement)>.01?unit(movement):type==='shootdodge'?[Math.cos(h.angle),Math.sin(h.angle),0]:facing(h);
      const combo=this.time-h.lastAttack<1.5?(h.combo+1)%3:0;
      const aim=route?.destination||(type==='hammer'&&!this.breached&&dist(h,{x:47,y:38})<82?{x:47,y:38}:target);
      h.action={kind:type,start:this.time,duration:durations[type],angle:aim?angle(h,aim):h.angle,target:target?.id??null,hit:false,released:false,shots:0,dir,origin:[h.x,h.y,0],destination,anchor:route?.anchor,combo};
      if(index===0){h.combo=combo;h.lastAttack=this.time;}
      if(index===2)h.slamReady=this.time+(type==='webTravel'?1.2:type==='bulletTime'?6:type==='rage'?7:3.4);
      if(['webTravel','pillar','teleport','shootdodge','slide'].includes(type))h.invulnerableUntil=this.time+(type==='pillar'?1.02:type==='webTravel'?.76:type==='teleport'?.57:.6);
      if(type==='bulletTime'){this.slowUntil=this.realTime+6;this.specialReadyAt=this.realTime+6;this._fx('focus',h.x,h.y,{duration:6});}
      if(type==='rage'){this.rageUntil=this.time+4.5;this._fx('rage',h.x,h.y,{duration:4.5});}
      h.blocking=false;this.activate();return true;
    }
    _fx(type,x,y,extra={}){this.events.push({type,x,y,time:this.time,...extra});}
    _shot(a=this.hero,amount=12,dual=false){
      const target=a.id===0?this._target(195):this.hero;
      if(a.id===0&&a.action&&target){a.action.target=target.id;a.action.angle=angle(a,target);a.angle=a.action.angle;}
      const desc=this._describe(a),rig=S.makeRig(a.id,this.time,desc);
      const from=(dual?rig.arms[0]:rig.arms[1]).end,dir=target?unit([target.x-from[0],target.y-from[1],39-from[2]]):facing(a);
      const muzzle=V(from,M(dir, this.profile.id==='payne'?9:this.profile.id==='fable'?13:22));
      const to=target?[target.x,target.y,39]:V(from,M(dir,120));
      if(this.profile.id==='payne'){
        // Fixed flight paths allow a moving target to evade a shot. Clip to props
        // before launch, then resolve swept hits as each bullet travels.
        let end=to;const delta=V(to,M(muzzle,-1)),length=Math.hypot(delta[0],delta[1]);
        const direction=length?M(delta,1/length):[0,1,0];let limit=length;
        for(const [x,y,r] of this._obstacles()){
          const dx=x-muzzle[0],dy=y-muzzle[1],along=dx*direction[0]+dy*direction[1],side=dx*dx+dy*dy-along*along;
          if(side<r*r){const near=along-Math.sqrt(r*r-side);if(near>=0)limit=Math.min(limit,near);}
        }
        if(limit<length)end=V(muzzle,M(direction,limit));
        const duration=Math.max(.025,Math.hypot(...V(end,M(muzzle,-1)))/480);
        this.bullets.push({source:a.id,amount,from:[...muzzle],to:[...end],start:this.time,duration,progress:0});
        this._fx('shot',a.x,a.y,{from:muzzle,to:end,enemy:a.id!==0,travel:duration});return;
      }
      this._fx('shot',a.x,a.y,{from:muzzle,to,enemy:a.id!==0});
      if(target&&this._clear(a,target)&&dist(a,target)<195){if(a.id===0)this._damageEnemy(target,amount,this.hero);else this._damageHero(a);}
    }
    _damageEnemy(e,n,source){
      const action=e.action,next=e.nextAttack;
      super._damageEnemy(e,n*(this.rageUntil>this.time&&source===this.hero?1.65:1),source);
      if(e.boss&&e.hp>0){
        e.poise=(e.poise||0)+n;e.push=e.push.map(v=>v*.2);
        if(e.poise<65&&n<40){e.action=action;e.nextAttack=next;e.hurtUntil=this.time;}else e.poise=0;
      }
    }
    _damageHero(e){
      const h=this.hero,before=h.hp,result=super._damageHero(e),id=this.profile.id;
      if(e.boss&&result==='hit'){
        h.hp=Math.max(0,before-(e.action?.kind==='wightSlam'?26:22));h.push=h.push.map(v=>v*1.4);
        if(h.hp===0){h.deadAt=this.time;this.phase='defeated';}
      }
      if(result==='hit'&&this.rageUntil>this.time){h.hp=Math.max(0,before-7);if(h.hp>0){h.deadAt=null;if(this.phase==='defeated')this.phase='playing';}}
      if(result==='blocked'&&(id==='spider'||id==='wukong')){this._damageEnemy(e,id==='spider'?12:8,h);e.hurtUntil=this.time+.65;}
      return result;
    }
    _hero(dt,input){
      const h=this.hero,a=h.action,age=a?this.time-a.start:0,id=this.profile.id;
      h.airborneCollision=false;
      const mobile=a&&['ranged','flintlock','bulletTime','rage'].includes(a.kind);
      super._hero(dt,a&&a.kind!=='dodge'&&!mobile?{x:0,y:0,block:false}:input);
      if(!a||h.hp<=0)return;
      const kind=a.kind,target=this.actors[a.target];
      if(['ranged','slide','shootdodge'].includes(kind)){
        const times=kind==='shootdodge'?[.28,.43,.61,.77]:[.12,.23,.34];
        while(a.shots<times.length&&age>=times[a.shots]){this._shot(h,kind==='shootdodge'?10:10,a.shots%2===1&&id==='payne');a.shots++;}
      }
      if(kind==='flintlock'&&age>=.2&&!a.hit){a.hit=true;this._shot(h,27);}
      if(kind==='melee'&&age>=.28&&!a.hit){
        a.hit=true;const f=facing(h);for(const e of this.enemies){const d=dist(h,e),v=unit([e.x-h.x,e.y-h.y,0]);if(e.hp>0&&d<this.profile.attackRange&&v[0]*f[0]+v[1]*f[1]>.05&&this._clear(h,e))this._damageEnemy(e,a.combo===2?32:23,h);}
      }
      if((kind==='slide'||kind==='shootdodge')&&age>.08&&age<(kind==='slide'?.63:.8)){
        const move=(kind==='slide'?90:65)*dt*(1-sm(age/a.duration)*.45);h.x+=a.dir[0]*move;h.y+=a.dir[1]*move;
      }
      if(['grenade','flash','web','spear'].includes(kind)&&age>=.23&&!a.released){a.released=true;this._release(a);}
      if(kind==='immobilize'&&age>=.25&&!a.hit){
        a.hit=true;if(target?.hp>0&&dist(h,target)<195&&this._clear(h,target)){target.frozenUntil=this.time+2.6;target.bind='gold';target.action=null;target.push=[0,0];this._fx('bind',target.x,target.y,{color:'#dcc278'});}
      }
      if(kind==='webTravel'){
        const u=sm((age-.16)/.62);h.x=mix(a.origin[0],a.destination.x,u);h.y=mix(a.origin[1],a.destination.y,u);
        h.airborneCollision=age>.18&&age<.75;h.push=[0,0];
      }
      if(kind==='pillar'&&age>=1.03&&!a.hit){a.hit=true;const f=facing(h),spot={x:h.x+f[0]*26,y:h.y+f[1]*26};this._fx('smash',spot.x,spot.y);for(const e of this.enemies)if(e.hp>0&&dist(e,spot)<66&&this._clear(h,e))this._damageEnemy(e,46,h);this.hitStop=.065;}
      if(kind==='hammer'&&age>=.58&&!a.hit){
        a.hit=true;const f=facing(h),spot={x:h.x+f[0]*27,y:h.y+f[1]*27};this._fx('breach',spot.x,spot.y);
        if(!this.breached&&dist(spot,{x:47,y:38})<49){this.breached=true;this._fx('splinters',47,38);}
        for(const e of this.enemies)if(e.hp>0&&dist(h,e)<59&&this._clear(h,e))this._damageEnemy(e,44,h);this.hitStop=.06;
      }
      if(kind==='spell'&&age>=.58&&!a.hit){
        a.hit=true;this._fx('weave',h.x,h.y);for(const e of this.enemies)if(e.hp>0&&dist(h,e)<115&&this._clear(h,e)){this._fx('lightning',e.x,e.y,{from:[h.x,h.y,40]});this._damageEnemy(e,38,h);e.frozenUntil=this.time+1.25;e.bind='electric';}
      }
      if(kind==='teleport'){
        if(age>=.28&&!a.moved){a.moved=true;this._fx('portal',h.x,h.y);h.x=a.destination.x;h.y=a.destination.y;if(target)h.angle=a.angle=angle(h,target);h.feet.forEach((f,i)=>{f.point=this._stance(h,i?1:-1);f.step=null;});this._fx('portal',h.x,h.y);}
        if(age>=.52&&!a.hit){a.hit=true;if(target?.hp>0&&dist(h,target)<40&&this._clear(h,target)){this._damageEnemy(target,43,h);this._fx('firehit',target.x,target.y);}}
      }
      this._bounds(h);
    }
    _release(a){
      const h=this.hero,r=S.makeRig(0,this.time,this._describe(h)),target=this.actors[a.target],f=facing(h);
      const point=target?.hp>0?[target.x,target.y,['web','spear'].includes(a.kind)?38:3.5]:[h.x+f[0]*85,h.y+f[1]*85,3.5];
      this.flight={type:a.kind,start:this.time,origin:[...r.arms[0].end],target:point,targetId:target?.id,duration:['web','spear'].includes(a.kind)?.34:.68,hit:false,pulled:false};
    }
    _flightAt(age){
      const f=this.flight,u=clamp(age/f.duration),position=L(f.origin,f.target,u);if(!['web','spear'].includes(f.type))position[2]+=Math.sin(u*Math.PI)*35;
      const target=this.actors[f.targetId];
      if(f.type==='spear'&&f.hit&&target) return {type:'spear',center:[target.x,target.y,38],origin:S.makeRig(0,this.time,this._describe(this.hero)).arms[0].end,trail:[]};
      return {type:f.type,center:position,origin:f.origin,trail:[]};
    }
    _explode(f,type){
      const [x,y]=f.target||[f.x,f.y],spot={x,y};this._fx(type,x,y);
      for(const e of this.enemies)if(e.hp>0&&dist(e,spot)<(type==='flash'?85:64)&&this._clear(spot,e)){
        if(type==='flash'){e.frozenUntil=this.time+2.5;e.bind='dazed';e.action=null;}else this._damageEnemy(e,40,spot);
      }
    }
    _bullets(){
      this.bullets=this.bullets.filter(b=>{
        const u=clamp((this.time-b.start)/b.duration),from=L(b.from,b.to,b.progress),to=L(b.from,b.to,u);
        const dx=to[0]-from[0],dy=to[1]-from[1],length2=dx*dx+dy*dy;
        const candidates=b.source===0?this.enemies:[this.hero];
        const hits=candidates.filter(a=>a.hp>0).map(a=>{
          const t=length2?clamp(((a.x-from[0])*dx+(a.y-from[1])*dy)/length2):0;
          return {a,t,d:Math.hypot(from[0]+dx*t-a.x,from[1]+dy*t-a.y)};
        }).filter(hit=>hit.d<7).sort((a,b)=>a.t-b.t);
        if(hits.length){const target=hits[0].a,source=this.actors[b.source];if(b.source===0)this._damageEnemy(target,b.amount,source);else this._damageHero(source);return false;}
        b.progress=u;return u<1;
      });
    }
    _projectile(){
      if(this.bullets.length)this._bullets();
      if(!this.flight)return;const f=this.flight,age=this.time-f.start,target=this.actors[f.targetId];
      if(age>=f.duration&&!f.hit){
        f.hit=true;
        if(f.type==='web'){if(target?.hp>0&&dist({x:f.target[0],y:f.target[1]},target)<22&&this._clear(this.hero,target)){this._damageEnemy(target,10,this.hero);target.frozenUntil=this.time+1.9;target.bind='web';target.push=[0,0];}this.flight=null;return;}
        if(f.type==='spear'){if(target?.hp>0&&this._clear(this.hero,target)){this._damageEnemy(target,17,this.hero);target.frozenUntil=this.time+1.1;target.bind='spear';target.push=[0,0];f.pullOrigin=[target.x,target.y];}else{this.flight=null;return;}}
        else{this._explode(f,f.type==='flash'?'flash':'blast');this.flight=null;return;}
      }
      if(f.type==='spear'&&f.hit&&target?.hp>0){
        const u=sm((age-f.duration)/.43),h=this.hero,dir=unit([f.pullOrigin[0]-h.x,f.pullOrigin[1]-h.y]),end=[h.x+dir[0]*26,h.y+dir[1]*26];
        if(this._clear(h,target)){target.x=mix(f.pullOrigin[0],end[0],u);target.y=mix(f.pullOrigin[1],end[1],u);this._bounds(target);}if(u>=1)this.flight=null;
      }else if(f.type==='spear'&&age>1)this.flight=null;
    }
    _enemy(e,dt){
      if(e.frozenUntil>this.time){e.action=null;e.vx=e.vy=0;e.push=[0,0];return;}
      const slow=this.hero.action?.kind==='shootdodge'&&!this.bulletTimeActive ? .3 : 1;
      if(slow<1){if(e.action)e.action.start+=dt*(1-slow);e.nextAttack+=dt*(1-slow);if(e.hurtUntil>this.time)e.hurtUntil+=dt*(1-slow);}
      dt*=slow;
      if(e.boss){this._wight(e,dt);return;}
      if(!this.profile.ranged){super._enemy(e,dt);return;}
      const h=this.hero;if(!this.ai||!this.started||e.hp<=0||h.hp<=0||e.hurtUntil>this.time){this._move(e,[0,0,0],dt);return;}
      const d=dist(e,h),dir=unit([h.x-e.x,h.y-e.y,0]);e.angle+=Math.atan2(Math.sin(angle(e,h)-e.angle),Math.cos(angle(e,h)-e.angle))*Math.min(1,dt*8);
      let velocity=[0,0,0];
      if(e.action){const age=this.time-e.action.start;if(age>=.78&&!e.action.hit){e.action.hit=true;this._shot(e);}if(age>=1.1){e.action=null;e.nextAttack=this.time+1.4+e.id*.3;}}
      else if(d>135||!this._clear(e,h)){velocity=M(dir,18);if(!this._clear(e,{x:e.x+dir[0]*20,y:e.y+dir[1]*20},5))velocity=[-dir[1]*20,dir[0]*20,0];}
      else if(d<60)velocity=M(dir,-13);
      if(!e.action&&d<170&&this.time>=e.nextAttack&&this._clear(e,h))e.action={kind:'enemyShot',start:this.time,angle:e.angle,hit:false};
      this._move(e,velocity,dt);
    }
    _wight(e,dt){
      const h=this.hero;
      if(!this.ai||!this.started||e.hp<=0||h.hp<=0||e.hurtUntil>this.time){this._move(e,[0,0,0],dt);return;}
      const d=dist(e,h),dir=unit([h.x-e.x,h.y-e.y,0]);let velocity=[0,0,0];
      const aim=e.action?.angle??angle(e,h);e.angle+=Math.atan2(Math.sin(aim-e.angle),Math.cos(aim-e.angle))*Math.min(1,dt*4);
      if(e.action){
        const a=e.action,age=this.time-a.start,slam=a.kind==='wightSlam',impact=slam?1.05:.78;
        if(age>=impact&&!a.hit){
          a.hit=true;const f=facing(e),front=f[0]*dir[0]+f[1]*dir[1];
          this._fx(slam?'wightSlam':'wightPalm',e.x,e.y,{angle:e.angle});
          if(d<(slam?86:65)&&(slam||front>.15)&&this._clear(e,h))this._damageHero(e);
        }
        if(age>=a.duration){e.action=null;e.nextAttack=this.time+1.1;}
      }else{
        if(d>51)velocity=M(dir,17);else if(d<35)velocity=M(dir,-9);
        if(d<73&&this.time>=e.nextAttack){const slam=e.combo++%2===1;e.action={kind:slam?'wightSlam':'wightPalm',start:this.time,duration:slam?2.2:1.75,angle:angle(e,h),hit:false};velocity=[0,0,0];}
      }
      this._move(e,velocity,dt);
    }
    _bounds(a){
      a.x=clamp(a.x,-141,141);a.y=clamp(a.y,-108,140);
      for(const [x,y,r] of this._obstacles()){const dx=a.x-x,dy=a.y-y,d=Math.hypot(dx,dy),R=r+(a.boss?22:5);if(d<R){a.x=x+(d?dx/d:1)*R;a.y=y+(d?dy/d:0)*R;}}
      a.x=clamp(a.x,-141,141);a.y=clamp(a.y,-108,140);
    }
    _feet(a,dt){
      const action=a.action,age=action?this.time-action.start:0;
      const airborne=a.id===0&&(['webTravel','shootdodge','pillar','slide'].includes(action?.kind)||action?.kind==='dodge'&&this.profile?.id==='spider');
      if(airborne||a.wasAir){a.feet.forEach((f,i)=>{f.point=this._stance(a,i?1:-1);f.step=null;f.angle=a.angle;f.planted=!airborne;f.phase=0;f.plantSince=this.time;});a.wasAir=airborne;return;}
      super._feet(a,dt);
    }
    _describe(a){
      const d=super._describe(a),id=this.profile?.id,hero=a.id===0,action=a.action,kind=action?.kind,age=action?this.time-action.start:0,q=d.pose;
      d.flatWeight=0;d.aim=null;d.action=kind||null;d.actionAge=age;d.weaponVisible=true;d.variant=id;d.rage=hero&&this.rageUntil>this.time;d.focus=hero&&this.bulletTimeActive;
      d.bound=a.frozenUntil>this.time?a.bind:null;d.boundPhase=this.time;
      if(a.boss){
        d.boss=a.boss;d.name='Wandering Wight';d.healthHeight=133;d.healthWidth=44;d.shadowRadius=27;d.warningRadius=kind==='wightSlam'?86:28;
        d.warning=kind==='wightSlam'||kind==='wightPalm'?Math.sin(clamp(age/(kind==='wightSlam'?1.05:.78))*Math.PI)*.85:0;
        if(a.hp>0&&a.hurtUntil<=this.time){
          q.crouch=3;q.lean=.1;q.rh=[11,14,31];q.lh=[-11,13,32];
          if(kind==='wightPalm'){const u=band(age,.35,.78,.86,1.65);q.rh=L([12,-2,43],[2,24,32],u);q.lh=[-12,7,32];q.twist=-.35+u*.7;q.lean=.1+u*.25;}
          if(kind==='wightSlam'){const u=band(age,.7,1.05,1.22,2.15),raise=band(age,0,.35,.7,1.02);q.rh=[9,12,36+raise*18-u*13];q.lh=[-9,12,36+raise*18-u*13];q.crouch=3+u*10;q.lean=.08+u*.65;}
        }
        return d;
      }
      if(kind==='enemyShot')d.warning=age<.78?clamp(age/.78):0;
      const target=hero?this.actors[action?.target]||this.nearest():this.hero;
      // Carry guns along the body's heading. Only an actual firing action may
      // rotate the barrel independently toward an enemy (including moving shots).
      const firing=['ranged','enemyShot','flintlock','slide','shootdodge'].includes(kind);
      d.gunTarget=firing&&target?.hp>0&&a.hp>0&&a.hurtUntil<=this.time&&!d.bound?[target.x,target.y,39]:null;
      const guns=this.profile?.ranged||hero&&kind==='flintlock';
      if(a.hp<=0||a.hurtUntil>this.time&&!d.bound)return d;
      if(guns){q.rh=[4,14,40];q.lh=id==='payne'?[-9,15,39]:[-2,23,38];q.weapon=-Math.PI/2;q.lean=.08;q.crouch=2.2;
        if(kind==='ranged'||kind==='enemyShot'||kind==='flintlock'){const recoil=Math.max(0,1-(age% .11)/.065)*band(age,.09,.12,.38,.5);q.rh[1]-=recoil*2;q.lh[1]-=recoil; q.lean-=recoil*.045;}
      }else{q.rh=id==='wukong'?[8,10,33]:[9,12,37];q.lh=[-9,13,37];q.weapon=id==='fable'?-.25:id==='wukong'?-.6:0;}
      if(!hero&&kind==='enemyAttack'){
        const u=band(age,.15,.41,.5,.85);q.rh=L([11,-4,41],[2,22,38],u);q.twist=-.4+u*.85;q.weapon=-.5+u;
        if(dist(a,this.hero)<46)d.aim={target:[this.hero.x,this.hero.y,39],weight:u,point:id==='kombat'?[0,0,1]:[0,0,27]};
      }
      if(a.blocking){q.crouch=guns?7:3;q.lh=[-7,16,42];q.rh=[7,16,43];q.lean=.12;if(id==='wukong'){q.rh=[0,16,37];q.lh=[-4,13,34];q.weapon=this.time*20;}}
      if(kind==='melee'){
        const u=band(age,.09,.28,.34,.62);q.rh=L([13,-5,40],[2,22,40],u);q.lh=L([-8,15,39],[-12,8,38],u);q.twist=-.45+u*1.0;q.lean=.04+u*.13;q.weapon=-.8+u*1.5;
        const reach=this.profile.attackRange;
        if(target&&dist(a,target)<reach+6)d.aim={target:[target.x,target.y,target.boss?63:39],weight:u,point:id==='wukong'?[0,0,38]:id==='fable'?[0,0,29]:[0,0,1]};
        if(id==='spider'&&action.combo===2){d.jump=Math.sin(clamp(age/.64)*Math.PI)*7;d.kick=u;q.bank=.24*u;}
        if(id==='kombat'&&action.combo===2){q.crouch=6-5*u;q.rh=[3,18,35+u*12];q.lean=-.12*u;}
      }
      if(['grenade','flash','web','spear','immobilize'].includes(kind)){
        const u=sm(age/.25);q.lh=L([-11,-6,43],[-4,23,42],u);q.rh=[8,10,34];q.twist=-.35+.7*u;d.weaponVisible=false;
      }
      if(kind==='slide'){q.crouch=12*band(age,0,.12,.65,.9);q.lean=-.3;q.rh=[4,17,36];q.lh=[-2,24,35];}
      if(kind==='shootdodge'){
        const u=band(age,.04,.2,.72,1.12);q.crouch=10*u;q.lean=.75*u;q.bank=.55*u;q.twist=-.35*u;q.rh=[9,22,40];q.lh=[-10,21,40];d.jump=Math.sin(clamp((age-.04)/.95)*Math.PI)*11;d.dive=u;
      }
      if(kind==='webTravel'){
        const u=band(age,.12,.32,.65,.92);q.crouch=5*u;q.lean=-.3*u;q.bank=.16*u;q.lh=[-5,18,50+u*6];q.rh=[11,9,37];d.jump=Math.sin(clamp((age-.14)/.72)*Math.PI)*34;d.weaponVisible=false;
        if(age>.03&&age<.77)d.tether={target:action.anchor,u:clamp((age-.03)/.13),color:'#e9e4d9'};
      }
      if(kind==='pillar'){
        d.jump=band(age,.08,.4,.76,1.04)*28;q.crouch=6;q.lean=.04;q.rh=[12,8,42];q.lh=[-12,11,40];d.pillar=age<.82?1:0;
        if(age>.8){q.rh=[5,22,34];q.lh=[-3,19,31];q.lean=.35;const f=facing(a);d.aim={target:[a.x+f[0]*26,a.y+f[1]*26,4],point:[0,0,38],direction:unit([f[0]*.3,f[1]*.3,-.95]),weight:band(age,.82,1.03,1.1,1.4),twoHanded:true};}
      }
      if(kind==='hammer'){
        const u=band(age,.27,.58,.66,1.14);q.rh=L([6,-2,55],[4,22,28],u);q.lh=L([-2,-3,50],[-3,18,28],u);q.crouch=2+u*6;q.lean=.03+u*.3;q.weapon=.2-u*1.5;
        const f=facing(a);d.aim={target:[a.x+f[0]*28,a.y+f[1]*28,12],point:[0,0,28],weight:u,direction:unit([f[0]*.5,f[1]*.5,-.86]),twoHanded:true};
      }
      if(kind==='spell'){const u=band(age,0,.4,.65,1.2);q.rh=[8+u*7,14,42];q.lh=[-8-u*7,14,42];q.twist=0;q.lean=-.1*u;q.crouch=1+u*3;d.magic=u;d.weaponVisible=false;}
      if(kind==='bulletTime'||kind==='rage'){q.rh=[9,11,39];q.lh=[-9,12,39];q.crouch=3;}
      if(kind==='teleport'){
        const fade=1-band(age,.05,.19,.29,.39);d.opacity*=fade;const u=band(age,.35,.52,.6,1);q.rh=L([11,-3,39],[2,22,40],u);q.twist=-.4+.9*u;
        if(target)d.aim={target:[target.x,target.y,39],weight:u,point:[0,0,1]};
      }
      if(kind==='dodge'&&id==='spider'){d.jump=Math.sin(clamp(age/.46)*Math.PI)*15;q.crouch=7;q.bank=.5*Math.sin(age/.46*Math.PI);q.rh=[12,9,41];q.lh=[-12,11,44];}
      if(d.jump>0||d.dive){d.feet=d.feet.map((f,i)=>{let local=[i?5:-5,i?-9:7,6+d.jump];if(d.pillar)local=[i?2:-1,i?1:3,6+d.jump+(i?2:0)];if(d.dive)local=[i?6:-6,-17*d.dive+(i?2:-2),6+d.jump];if(d.kick&&i===1)local=[4,25*d.kick,6+d.jump+14*d.kick];return {...f,point:V([a.x,a.y,0],S.graphics.rotZ(local,a.angle)),planted:false};});}
      return d;
    }
    get bulletTimeActive(){return this.profile?.id==='payne'&&this.realTime<this.slowUntil;}
    step(dt,input={}){
      dt=clamp(dt,0,.05);
      const slowed=this.profile.id==='payne'?clamp(this.slowUntil-this.realTime,0,dt):0;
      this.realTime+=dt;super.step(dt-slowed*.7,input);
      if(this.profile.id==='payne')this.hero.slamReady=this.time+Math.max(0,this.specialReadyAt-this.realTime);
      this.motionTrail=[];if(this.hero.action?.kind==='melee'&&this.profile.id==='wukong'){
      const r=S.makeRig(0,this.time,this._describe(this.hero));this.trail.push({outer:r.weapon([0,0,39]),inner:r.weapon([0,0,12])});if(this.trail.length>5)this.trail.shift();
    }}
    frame(){const f=super.frame();f.worldState={breached:this.breached,bulletTime:this.bulletTimeActive,timeScale:this.bulletTimeActive ? .3 : 1};return f;}
  }
  window.LegendScenes=profiles;window.LegendCombat=LegendCombat;
})();
