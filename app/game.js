/* Interactive combat simulation. Rendering remains entirely SVG. */
(() => {
  'use strict';
  const S=window.Diorama,AXE=S.axeGeometry;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  const mix=(a,b,t)=>a+(b-a)*t,lerp=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
  const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,k)=>a.map(v=>v*k);
  const unit=v=>mul(v,1/(Math.hypot(...v)||1));
  const rotate=(v,a)=>[v[0]*Math.cos(a)-v[1]*Math.sin(a),v[0]*Math.sin(a)+v[1]*Math.cos(a),v[2]];
  const delta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const facing=a=>[-Math.sin(a.angle),Math.cos(a.angle),0];
  const towards=(a,b)=>Math.atan2(-(b.x-a.x),b.y-a.y);
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const band=(t,a,b,c,d)=>smooth((t-a)/(b-a))*(1-smooth((t-c)/(d-c)));
  const flat=(v,angle)=>[v[2]*Math.cos(angle)+v[1]*Math.sin(angle),v[2]*Math.sin(angle)-v[1]*Math.cos(angle),v[0]];
  const obstacles=[{x:132,y:-86,r:17},{x:135,y:-28,r:16},{x:-131,y:-96,r:15},{x:-155,y:112,r:17},{x:154,y:105,r:18},{x:92,y:149,r:22},{x:-145,y:135,r:12},{x:145,y:135,r:12}];
  class Combat {
    constructor(options={}){this.ai=options.ai!==false;this.reset();}
    reset(starts=null){
      this.time=0;this.started=false;this.phase='ready';this.input={x:0,y:0,block:false};this.events=[];this.flight=null;this.trail=[];this.hitStop=0;this.buffer=null;this.lastInput=[0,0,0];
      const spawn=[[-49,29,-1.95],[26,-13,1.19],[26,85,2.2]];
      this.actors=spawn.map(([x,y,angle],id)=>{
        if(starts?.[id]){x=clamp(starts[id].x,-125,125);y=clamp(starts[id].y,-100,122);angle=starts[id].angle;}
        const a={id,x,y,angle,vx:0,vy:0,speed:0,hp:id?72:100,maxHp:id?72:100,stamina:100,action:null,nextAttack:.9+id*.55,hurtUntil:0,invulnerableUntil:0,deadAt:null,blocking:false,guardBrokenUntil:0,push:[0,0],lastSpend:-2,dodgeReady:0,slamReady:0,combo:0,lastAttack:-4,catchUntil:0,catchAngle:0,nextFoot:0,footReady:0};
        a.feet=[-1,1].map(side=>({point:this._stance(a,side),angle,planted:true,phase:0,plantSince:0,step:null}));return a;
      });
      return this;
    }
    get hero(){return this.actors[0];}
    get enemies(){return this.actors.slice(1);}
    nearest(a=this.hero){return this.enemies.filter(e=>e.hp>0).sort((b,c)=>dist(a,b)-dist(a,c))[0]||null;}
    activate(){this.started=true;if(this.phase==='ready')this.phase='playing';}
    _stance(a,side,lead=0){return add([a.x+a.vx*lead,a.y+a.vy*lead,6],rotate([side*(a.id?4.4:5.1),side===-1?4.5:-4.5,0],a.angle));}
    _spend(amount){const h=this.hero;if(h.stamina<amount)return false;h.stamina-=amount;h.lastSpend=this.time;return true;}
    command(kind,input=this.input){
      this.input=input;const h=this.hero;if(h.hp<=0)return false;this.activate();
      if(kind==='attack'&&h.action?.kind==='attack'&&this.time-h.action.start>.16){this.buffer={kind,expires:h.action.start+h.action.duration+.15};return true;}
      if(kind==='dodge'){
        if(this.time<h.dodgeReady||h.action?.kind==='slam'||!this._spend(25))return false;
        const move=this._movement(input),dir=Math.hypot(move[0],move[1])>.01?unit(move):mul(facing(h),-1);
        h.action={kind,start:this.time,duration:.46,dir,angle:h.angle};h.dodgeReady=this.time+.7;h.blocking=false;return true;
      }
      if(h.action||h.hurtUntil>this.time||this.flight)return false;
      const cost={attack:8,throw:18,slam:38}[kind];if(cost===undefined||kind==='slam'&&this.time<h.slamReady||!this._spend(cost))return false;
      const target=this.nearest(),angle=target&&dist(h,target)<150?towards(h,target):h.angle;
      const duration={attack:.86,throw:2.36,slam:1.47}[kind];
      h.action={kind,start:this.time,duration,angle,target:target?.id??null,hit:false,released:false,flatAngle:angle+Math.PI/2-.3};
      if(kind==='attack'){h.combo=this.time-h.lastAttack<1.65?1-h.combo:0;h.action.combo=h.combo;h.lastAttack=this.time;}
      if(kind==='slam')h.slamReady=this.time+3.2;
      h.blocking=false;return true;
    }
    _movement(input){
      let x=input.x||0,y=input.y||0;const n=Math.hypot(x,y);if(n>1){x/=n;y/=n;}
      // Inverse isometric projection: arrows move in their screen direction.
      return [(x/.8660254+y/.5)*27.5,(-x/.8660254+y/.5)*27.5,0];
    }
    _event(type,x,y){this.events.push({type,x,y,time:this.time});}
    _damageEnemy(e,amount,source){
      if(e.hp<=0)return;e.hp=Math.max(0,e.hp-amount);e.hurtUntil=this.time+.43;e.action=null;e.nextAttack=Math.max(e.nextAttack,this.time+.9);
      const push=unit([e.x-source.x,e.y-source.y]);e.push=[push[0]*48,push[1]*48];
      this._event('hit',e.x,e.y);this.hitStop=Math.max(this.hitStop,.035);
      if(e.hp===0)e.deadAt=this.time;
    }
    _damageHero(enemy){
      const h=this.hero,age=h.action?this.time-h.action.start:0;
      if(h.hp<=0||this.time<h.invulnerableUntil||h.action?.kind==='dodge'&&age<.39)return 'dodged';
      const dir=unit([enemy.x-h.x,enemy.y-h.y]),f=facing(h),front=dir[0]*f[0]+dir[1]*f[1]>.1;
      if(h.blocking&&front&&h.stamina>=14){
        this._spend(14);this._event('block',h.x+dir[0]*10,h.y+dir[1]*10);enemy.hurtUntil=this.time+.26;enemy.nextAttack=this.time+1.2;this.hitStop=.035;return 'blocked';
      }
      if(h.blocking){h.stamina=0;h.guardBrokenUntil=this.time+.75;h.blocking=false;}
      h.hp=Math.max(0,h.hp-14);h.hurtUntil=this.time+.34;h.invulnerableUntil=this.time+.6;h.action=null;this.buffer=null;
      h.push=[-dir[0]*35,-dir[1]*35];this._event('hurt',h.x,h.y);this.hitStop=.04;
      if(h.hp===0){h.deadAt=this.time;this.phase='defeated';}
      return 'hit';
    }
    _hero(dt,input){
      const h=this.hero;let velocity=this._movement(input);if(Math.hypot(...velocity)>.01)this.lastInput=unit(velocity);
      h.blocking=!!input.block&&h.hp>0&&h.hurtUntil<=this.time&&h.guardBrokenUntil<=this.time&&h.stamina>2&&(!h.action||h.action.kind==='throw'&&h.action.released);
      const target=this.nearest();let desired=h.angle;
      if(h.action)desired=h.action.angle;
      else if(h.blocking&&target)desired=towards(h,target);
      else if(Math.hypot(...velocity)>.01)desired=Math.atan2(-velocity[0],velocity[1]);
      h.angle+=delta(h.angle,desired)*Math.min(1,dt*17);
      if(h.blocking){velocity=mul(velocity,.37);h.stamina=Math.max(0,h.stamina-dt);}
      if(h.hurtUntil>this.time||h.hp<=0)velocity=[0,0,0];
      const action=h.action;
      if(action){
        const age=this.time-action.start;
        if(action.kind==='dodge')velocity=mul(action.dir,130*(1-.6*smooth(age/action.duration)));
        else if(action.kind==='attack'){
          velocity=mul(velocity,.2);if(age<.27)velocity=add(velocity,mul(facing(h),12));
          if(age>=.307&&!action.hit){action.hit=true;for(const e of this.enemies){const v=unit([e.x-h.x,e.y-h.y]),f=facing(h);if(e.hp>0&&dist(h,e)<44&&v[0]*f[0]+v[1]*f[1]>.3)this._damageEnemy(e,action.combo?30:26,h);}}
        }else if(action.kind==='slam'){
          velocity=age>.25&&age<.64?mul(facing(h),22):[0,0,0];
          if(age>=.733&&!action.hit){action.hit=true;const f=facing(h),impact={x:h.x+f[0]*24,y:h.y+f[1]*24};action.impact=impact;this._event('slam',impact.x,impact.y);for(const e of this.enemies)if(dist(impact,e)<72)this._damageEnemy(e,42,impact);this.hitStop=.065;}
        }else if(action.kind==='throw'){
          if(age<.3)velocity=mul(velocity,.15);
          if(age>=.3&&!action.released){action.released=true;this._release(action);}
        }
        if(age>=action.duration){h.action=null;if(this.buffer&&this.buffer.expires>=this.time){this.buffer=null;this.command('attack',input);}}
      }
      if(this.time-h.lastSpend>.65&&!h.blocking)h.stamina=Math.min(100,h.stamina+22*dt);
      this._move(h,velocity,dt);
    }
    _enemy(e,dt){
      const h=this.hero;let velocity=[0,0,0];
      if(e.hp<=0||!this.ai||!this.started||h.hp<=0){this._move(e,velocity,dt);return;}
      if(e.hurtUntil>this.time){this._move(e,velocity,dt);return;}
      if(e.action){
        const age=this.time-e.action.start;e.angle+=delta(e.angle,e.action.angle)*Math.min(1,dt*14);
        if(age<.2)velocity=mul(facing(e),7);
        if(age>=.43&&!e.action.hit){e.action.hit=true;const v=unit([h.x-e.x,h.y-e.y]),f=facing(e);if(dist(e,h)<37&&v[0]*f[0]+v[1]*f[1]>.35)this._damageHero(e);}
        if(age>=1.02){e.action=null;e.nextAttack=this.time+1.0+e.id*.2;}
      }else{
        const d=dist(e,h),v=unit([h.x-e.x,h.y-e.y,0]);e.angle+=delta(e.angle,towards(e,h))*Math.min(1,dt*8);
        if(d>31)velocity=mul(v,23+e.id*2);
        else if(d<22)velocity=mul(v,-13);
        else velocity=[-v[1]*(e.id===1?4:-4),v[0]*(e.id===1?4:-4),0];
        if(d<35&&this.time>=e.nextAttack){e.action={kind:'enemyAttack',start:this.time,angle:towards(e,h),hit:false};velocity=[0,0,0];}
      }
      this._move(e,velocity,dt);
    }
    _move(a,velocity,dt){a.x+=(velocity[0]+a.push[0])*dt;a.y+=(velocity[1]+a.push[1])*dt;a.push=a.push.map(v=>v*Math.exp(-10*dt));}
    _radius(a){return a.radius||11;}
    _obstacles(){return obstacles.map(o=>[o.x,o.y,o.r]);}
    _limits(){return [-132,132,-107,128];}
    _bounds(a){
      const [left,right,top,bottom]=this._limits(),radius=this._radius(a),solids=this._obstacles();
      const clampPoint=()=>{a.x=clamp(a.x,left,right);a.y=clamp(a.y,top,bottom);};
      clampPoint();
      for(let pass=0;pass<12;pass++){
        let changed=false;
        for(const [x,y,r] of solids){
          const dx=a.x-x,dy=a.y-y,d=Math.hypot(dx,dy),R=r+radius;
          if(d>=R-1e-7)continue;
          // At an arena edge, choose a feasible escape along the obstacle's
          // circle instead of projecting outside then clamping back inside it.
          const angles=[Math.atan2(dy,dx),0,Math.PI/2,Math.PI,Math.PI*1.5];
          for(const X of [left,right])if(Math.abs(X-x)<=R){const t=Math.acos((X-x)/R);angles.push(t,-t);}
          for(const Y of [top,bottom])if(Math.abs(Y-y)<=R){const t=Math.asin((Y-y)/R);angles.push(t,Math.PI-t);}
          for(const [ox,oy,or] of solids){
            const q=or+radius,cd=Math.hypot(ox-x,oy-y);
            if(cd>1e-6&&cd<R+q&&cd>Math.abs(R-q)){
              const base=Math.atan2(oy-y,ox-x),offset=Math.acos(clamp((R*R+cd*cd-q*q)/(2*R*cd),-1,1));angles.push(base-offset,base+offset);
            }
          }
          const candidates=angles.map(t=>({x:x+Math.cos(t)*R,y:y+Math.sin(t)*R})).filter(p=>p.x>=left-1e-6&&p.x<=right+1e-6&&p.y>=top-1e-6&&p.y<=bottom+1e-6);
          const score=p=>solids.reduce((sum,[ox,oy,or])=>sum+Math.max(0,or+radius-Math.hypot(p.x-ox,p.y-oy)),0)*10000+Math.hypot(p.x-a.x,p.y-a.y);
          candidates.sort((p,q)=>score(p)-score(q));
          if(candidates[0]){a.x=candidates[0].x;a.y=candidates[0].y;changed=true;}
        }
        clampPoint();if(!changed)break;
      }
    }
    _feet(a,dt){
      for(const foot of a.feet){
        if(foot.step){const step=foot.step,u=clamp((this.time-step.start)/step.duration);foot.point=lerp(step.from,step.to,smooth(u));foot.point[2]+=Math.pow(Math.sin(u*Math.PI),1.5)*step.height;foot.angle=step.angle+delta(step.angle,step.toAngle)*smooth(u);foot.phase=u;foot.planted=false;if(u>=1){foot.step=null;foot.planted=true;foot.plantSince=this.time;foot.point[2]=6;}}
      }
      if(this.time<a.footReady)return;
      const duration=clamp(.1+4.5/(a.speed+7),.115,.31);
      const candidates=[a.nextFoot,1-a.nextFoot];
      for(const i of candidates){
        const foot=a.feet[i],target=this._stance(a,i?1:-1);if(foot.step)continue;
        const error=Math.hypot(target[0]-foot.point[0],target[1]-foot.point[1]);
        if(error>4.3||Math.abs(delta(foot.angle,a.angle))>.45){
          const to=this._stance(a,i?1:-1,duration*.7);to[0]=clamp(to[0],-145,145);to[1]=clamp(to[1],-120,140);
          foot.step={start:this.time,duration: error>17?.09:duration,from:[...foot.point],to,angle:foot.angle,toAngle:a.angle,height:clamp(3+a.speed*.035,3,6)};
          foot.planted=false;a.nextFoot=1-i;a.footReady=this.time+duration*(a.speed>35?.52:.9);break;
        }
      }
    }
    _describe(a){
      const hero=a.id===0,action=a.action,age=action?this.time-action.start:0;
      let q=S.poseAt(a.id,0),jump=0,aim=null,flatWeight=0,flatAngle=0;
      q={...q,rh:[...q.rh],lh:[...q.lh],crouch:1.1+Math.sin(this.time*2.1+a.id)*.16};
      if(action){
        if(action.kind==='attack')q=S.poseAt(0,(action.combo?3.12:1.72)+age*1.4);
        else if(action.kind==='dodge')q=S.poseAt(0,4.72+age/.46*1.12);
        else if(action.kind==='slam'){q=S.poseAt(0,9.72+age*1.8);if(age>.378&&age<.733)jump=Math.sin((age-.378)/.355*Math.PI)*18;}
        else if(action.kind==='throw'){const sample=age<.3?7.02+age*1.3:age<2?7.41+(age-.3)/1.7*1.71:9.12+(age-2);q=S.poseAt(0,Math.min(9.47,sample));flatAngle=action.flatAngle;flatWeight=smooth((age-.17)/.13)*(1-smooth((age-2.15)/.2));}
        else if(action.kind==='enemyAttack')q=S.poseAt(a.id,(a.id===1?5.87:4.6)+age);
      }
      if(a.blocking)q=S.poseAt(0,6.23);
      if(a.hurtUntil>this.time){const u=clamp((a.hurtUntil-this.time)/.43);q={...q,lean:-.35*u,bank:a.id===1?-.12:.12,twist:-.2*u,crouch:3+u*2,rh:[12,5,33],lh:[-11,10,37]};}
      let opacity=1;if(a.deadAt!==null){const age=this.time-a.deadAt,fall=smooth(age/.55);q={...q,crouch:3+fall*17,lean:.1+fall*.95,rh:[8,9,25],lh:[-8,8,25]};opacity=hero?1:1-smooth((age-.3)/.5);}
      if(hero&&action?.kind==='attack'){
        const target=this.actors[action.target];if(target&&(dist(a,target)<48&&target.hp>0||this.time-(target.deadAt??-100)<.2)){
          aim={target:[target.x,target.y,40],weight:band(age,.18,.29,.35,.52),point:AXE.contact};
        }
      }
      if(hero&&action?.kind==='slam'){
        const f=facing(a),target=[a.x+f[0]*24,a.y+f[1]*24,3.8];aim={target,weight:band(age,.64,.733,.84,1.07),point:AXE.tip,direction:unit([f[0]*.45,f[1]*.45,-.893]),twoHanded:true};
      }
      if(!hero&&action?.kind==='enemyAttack'){
        const target=this.hero;
        if(dist(a,target)<41){
          const dir=unit([a.x-target.x,a.y-target.y]),f=facing(target);
          const contact=target.blocking&&dir[0]*f[0]+dir[1]*f[1]>.1?S.makeRig(0,this.time,this._describe(target)).arms[0].end:[target.x,target.y,39];
          aim={target:contact,weight:band(age,.27,.41,.48,.68),point:[0,0,27]};
        }
      }
      if(hero&&this.flight){flatAngle=this.flight.angle;flatWeight=1;}
      else if(hero&&this.time<a.catchUntil){flatAngle=a.catchAngle;flatWeight=1-smooth((this.time-(a.catchUntil-.2))/.2);}
      let feet=a.feet.map(f=>({...f,point:[...f.point]}));
      if(jump>0)feet=feet.map(f=>({...f,point:[f.point[0],f.point[1],f.point[2]+jump],planted:false}));
      if(action?.kind==='dodge'){
        const u=clamp(age/.46),hop=Math.sin(u*Math.PI)*2.5,w=smooth(u/.12)*(1-smooth((u-.8)/.2));jump=hop;
        feet=feet.map((f,i)=>({...f,point:lerp(f.point,add([a.x,a.y,6+hop],rotate([i?5:-5,i?-7:7,0],a.angle)),w),planted:false}));
      }
      return {id:a.id,base:{x:a.x,y:a.y,angle:a.angle,speed:a.speed},pose:q,feet,jump,aim,flatAngle,flatWeight,axeVisible:!hero||!this.flight,opacity,hp:a.hp/a.maxHp,warning:action?.kind==='enemyAttack'&&age<.43?smooth(age/.43):0};
    }
    _release(action){
      const rig=S.makeRig(0,this.time,this._describe(this.hero));
      const targets=this.enemies.filter(e=>e.hp>0).sort((a,b)=>dist(this.hero,a)-dist(this.hero,b)).map(e=>e.id);
      this.flight={start:this.time,angle:action.flatAngle,origin:rig.weapon(AXE.pivot),targets,hits:new Set(),anchors:[null,null],duration:1.7,trail:[],forward:facing(this.hero)};
    }
    _flightAt(elapsed){
      const f=this.flight,u=clamp(elapsed/f.duration),spin=f.angle+u*Math.PI*6;
      const orientation=(v,t)=>flat(v,f.angle+clamp(t/f.duration)*Math.PI*6);
      const h=S.makeRig(0,this.time,this._describe(this.hero)),end=h.weapon(AXE.pivot),times=[.52,1.04];
      const first=f.targets[0],second=f.targets[1],side=[-f.forward[1],f.forward[0],0];
      const contactAt=(id,i)=>{
        if(f.anchors[i])return f.anchors[i];
        if(id!==undefined){const e=this.actors[id];return [e.x,e.y,40];}
        return add(f.origin,add(mul(f.forward,i?65:70),mul(side,i?30:-24)));
      };
      const A=sub(contactAt(first,0),orientation(sub(AXE.contact,AXE.pivot),times[0])),B=sub(contactAt(second,1),orientation(sub(AXE.contact,AXE.pivot),times[1]));
      const outside=add(lerp(A,B,.5),mul(f.forward,27)),returning=add(lerp(B,end,.55),mul(side,24));
      const nodes=[[0,f.origin],[.52,A],[.78,outside],[1.04,B],[1.39,returning],[1.7,end]];
      let index=0;while(index<nodes.length-2&&elapsed>nodes[index+1][0])index++;
      const [ta,pa]=nodes[index],[tb,pb]=nodes[index+1],v=clamp((elapsed-ta)/(tb-ta)),v2=v*v,v3=v2*v;
      const tangent=i=>{const a=nodes[Math.max(0,i-1)],b=nodes[Math.min(nodes.length-1,i+1)];return mul(sub(b[1],a[1]),1/(b[0]-a[0]));},ma=tangent(index),mb=tangent(index+1);
      const center=pa.map((p,j)=>(2*v3-3*v2+1)*p+(v3-2*v2+v)*(tb-ta)*ma[j]+(-2*v3+3*v2)*pb[j]+(v3-v2)*(tb-ta)*mb[j]);
      const transform=p=>add(center,flat(sub(p,AXE.pivot),spin));
      return {center,spin,transform,contact:transform(AXE.contact),trail:f.trail};
    }
    _projectile(){
      if(!this.flight)return;const f=this.flight,age=this.time-f.start;
      [.52,1.04].forEach((at,i)=>{
        if(age>=at&&!f.hits.has(i)){f.hits.add(i);const id=f.targets[i];if(id!==undefined){const e=this.actors[id];f.anchors[i]=[e.x,e.y,40];if(e.hp>0)this._damageEnemy(e,26,this.hero);}}
      });
      const frame=this._flightAt(age);f.trail.push({outer:frame.transform(AXE.tip),inner:frame.transform(AXE.trailInner)});if(f.trail.length>9)f.trail.shift();
      if(age>=f.duration){this.hero.catchAngle=f.angle;this.hero.catchUntil=this.time+.2;this.flight=null;}
    }
    step(dt,input={x:0,y:0,block:false}){
      dt=clamp(dt,0,.05);this.input=input;if(input.x||input.y||input.block)this.activate();
      if(this.hitStop>0){this.hitStop=Math.max(0,this.hitStop-dt);return;}
      this.time+=dt;
      const old=this.actors.map(a=>[a.x,a.y]);this._hero(dt,input);this.enemies.forEach(e=>this._enemy(e,dt));
      for(let pass=0;pass<16;pass++){
        this.actors.forEach(a=>this._bounds(a));
        for(let i=0;i<3;i++)for(let j=i+1;j<3;j++){
          const a=this.actors[i],b=this.actors[j];if(a.hp<=0||b.hp<=0||a.airborneCollision||b.airborneCollision)continue;
          const d=dist(a,b),spacing=this._radius(a)+this._radius(b);if(d<spacing){const n=unit(d>.001?[b.x-a.x,b.y-a.y]:[1,.1]),push=(spacing-d)/2;a.x-=n[0]*push;a.y-=n[1]*push;b.x+=n[0]*push;b.y+=n[1]*push;}
        }
      }
      this.actors.forEach((a,i)=>{this._bounds(a);a.vx=(a.x-old[i][0])/(dt||1);a.vy=(a.y-old[i][1])/(dt||1);a.speed=Math.hypot(a.vx,a.vy);this._feet(a,dt);});
      this._projectile();
      if(this.enemies.every(e=>e.hp<=0)&&this.hero.hp>0)this.phase='won';
      this.events=this.events.filter(e=>this.time-e.time<.9);
      if(this.hero.action?.kind==='attack'){
        const r=S.makeRig(0,this.time,this._describe(this.hero));this.trail.push({outer:r.weapon(AXE.tip),inner:r.weapon(AXE.trailInner)});if(this.trail.length>5)this.trail.shift();
      }else this.trail=[];
    }
    frame(){return {time:this.time,actors:this.actors.map(a=>this._describe(a)),flight:this.flight?this._flightAt(this.time-this.flight.start):null,events:this.events,trail:this.trail};}
    render(){const frame=this.frame();S.renderGame(frame);return frame;}
    get state(){return {phase:this.phase,started:this.started,time:this.time,health:this.hero.hp,stamina:this.hero.stamina,axeAway:!!this.flight,remaining:this.enemies.filter(e=>e.hp>0).length};}
  }
  window.MidgardCombat=Combat;
})();
