/* Scene catalog, combat variants, and deterministic watch performances. */
(() => {
  'use strict';
  const S=window.Diorama,G=window.MidgardCombat,chars=window.WorldCharacters;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  const mix=(a,b,t)=>a+(b-a)*t,lerp=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),unit=v=>v.map(n=>n/(Math.hypot(...v)||1));
  const add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,k)=>a.map(v=>v*k),facing=a=>[-Math.sin(a.angle),Math.cos(a.angle),0];
  const band=(t,a,b,c,d)=>smooth((t-a)/(b-a))*(1-smooth((t-c)/(d-c)));
  const catalog=[
    {id:'midgard',title:'God of War',hero:'Kratos',place:'The Wildwoods',bg:['#edf0e7','#e2e7db','#d5ddce'],accent:'#40543a',labels:['strike / combo','throw','frost slam','dodge','hold to block'],help:['Axe combo','Boomerang throw','Frost slam','Dodge','Hold shield']},
    {id:'tsushima',title:'Ghost of Tsushima',hero:'Jin Sakai',place:'Maple courtyard',bg:['#eee7d9','#e3ddcb','#d5d1bb'],accent:'#8b5540',labels:['katana combo','kunai','heavenly strike','sidestep','hold to parry'],help:['Katana combo','Kunai volley','Heavenly strike','Sidestep','Hold sword guard'],attackRange:43,contact:[0,1.2,28],obstacles:[[-139,78,19],[148,-70,18],[-146,128,14],[147,127,14]]},
    {id:'arkham',title:'Batman: Arkham',hero:'Batman',place:'Gotham rooftops',bg:['#879da5','#7a919c','#7a8f9c'],accent:'#344f61',labels:['punch / combo','batarang','grapnel takedown','evade','hold to counter'],help:['Punch combo','Returning batarang','Grapnel takedown','Evade','Hold counter guard'],attackRange:33,contact:[0,0,1],obstacles:[[106,-131,25],[-99,-142,42],[32,-149,27],[-154,117,15],[150,125,15]]},
    {id:'assassin',title:'Assassin’s Creed',hero:'Ezio',place:'The bell tower terrace',bg:['#f0e5d3','#e6d8c0','#d7c9ad'],accent:'#8a5843',labels:['sword combo','throwing knife','hidden blade','dodge','hold to parry'],help:['Sword combo','Throwing knife','Hidden blade lunge','Dodge','Hold parry'],attackRange:42,contact:[0,0,28],obstacles:[[146,57,28],[-131,139,23],[-156,73,11],[145,121,11]]},
    {id:'persia',title:'Prince of Persia',hero:'The Prince',place:'Palace of the sands',bg:['#f0e4cf','#e4d4b5','#d3c3a0'],accent:'#467e7c',labels:['scimitar combo','dagger cast','rewind time','vault dodge','hold to guard'],help:['Scimitar combo','Dagger cast','Rewind position / health','Vault dodge','Hold blade guard'],attackRange:44,contact:[0,3,28],obstacles:[[7,-108,26],[144,75,24],[-148,75,14],[-146,128,13],[146,126,13]]}
  ].concat(window.LegendScenes||[]);
  catalog.forEach(p=>{
    const cooldown=p.id==='payne'?6:p.id==='gta'?7:p.id==='spider'?1.2:p.id==='persia'?5:p.expanded?3.4:3.2;
    const energy=p.id==='spider'?14:p.expanded?34:38;
    p.specialDetails=`${cooldown}s cooldown · ${energy} energy`+(p.id==='payne'?' · 6s at 30% speed. Cooldown starts on activation.':p.id==='gta'?' · 4.5s of increased damage and resistance.':'');
  });
  const byId=new Map(catalog.map(c=>[c.id,c])),themes=new Map(),watchCache=new Map();let activeId='midgard';
  class SceneCombat extends G {
    constructor(profile,options={}){super(options);this.profile=profile;}
    reset(starts){super.reset(starts);this.history=[];this.weaponTrail=[];return this;}
    command(kind,input=this.input){
      if(kind==='slam'){
        const h=this.hero,bat=this.profile.id==='arkham',target=bat?this._grapnelTarget():this.nearest();
        if(h.hp<=0||h.action||this.flight||h.hurtUntil>this.time||this.time<h.slamReady||bat&&!target||!this._spend(38))return false;
        this.activate();h.action={kind:'special',start:this.time,duration:this.profile.id==='tsushima'?1.05:1.15,angle:target?Math.atan2(-(target.x-h.x),target.y-h.y):h.angle,target:target?.id,hit:false};h.slamReady=this.time+(this.profile.id==='persia'?5:3.2);h.invulnerableUntil=this.time+(bat?.54:.35);return true;
      }
      const ok=super.command(kind,input);
      if(ok&&kind==='throw')this.hero.action.duration=this.profile.id==='arkham'?1.65:1.05;
      return ok;
    }
    _grapnelTarget(){
      const h=this.hero;
      return this.enemies.filter(e=>e.hp>0&&dist(h,e)<=170).sort((a,b)=>dist(h,a)-dist(h,b)).find(e=>{
        const d=dist(h,e),travel=Math.max(0,d-24),v=unit([e.x-h.x,e.y-h.y]);
        // The pull stops short of the enemy and cannot pass through rooftop props.
        return this.profile.obstacles.every(([x,y,r])=>{
          const t=clamp((x-h.x)*v[0]+(y-h.y)*v[1],0,travel);
          return Math.hypot(x-h.x-v[0]*t,y-h.y-v[1]*t)>=r+5-.001;
        });
      });
    }
    _damageEnemy(e,amount,source){
      if(source===this.hero&&this.hero.action?.kind==='attack'&&dist(this.hero,e)>this.profile.attackRange)return;
      super._damageEnemy(e,amount,source);
    }
    _damageHero(enemy){
      const result=super._damageHero(enemy);
      if(result==='blocked'&&this.profile.id==='arkham'){enemy.hurtUntil=this.time+.65;enemy.nextAttack=this.time+1.5;}
      return result;
    }
    _hero(dt,input){
      const h=this.hero,a=h.action,id=this.profile.id,age=a?this.time-a.start:0;
      super._hero(dt,a?.kind==='special'?{x:0,y:0,block:false}:input);
      if(a?.kind!=='special'||h.hp<=0)return;
      if(id==='arkham'){
        const target=this.actors[a.target];
        if(!target||target.hp<=0)return;
        const d=dist(h,target);
        a.angle=Math.atan2(-(target.x-h.x),target.y-h.y);
        if(age>=.18&&age<.48){
          if(a.pullDistance===undefined)a.pullDistance=Math.max(0,d-24);
          const u=smooth((age-.18)/.3),previous=smooth((age-dt-.18)/.3),move=Math.min(Math.max(0,d-24),a.pullDistance*(u-previous));
          const dir=unit([target.x-h.x,target.y-h.y]);h.x+=dir[0]*move;h.y+=dir[1]*move;this._bounds(h);
        }
        if(age>=.48&&!a.hit){
          a.hit=true;
          if(dist(h,target)<37){
            this._event('special',target.x,target.y);this._damageEnemy(target,48,h);
            target.hurtUntil=this.time+.8;target.nextAttack=this.time+1.15;this.hitStop=.065;
          }
        }
        return;
      }
      const f=facing(h);
      if((id==='tsushima'||id==='assassin')&&age>.12&&age<.37){h.x+=f[0]*135*dt;h.y+=f[1]*135*dt;}
      const contact=id==='persia'?.2:.36;
      if(age>=contact&&!a.hit){
        a.hit=true;this._event('special',h.x,h.y);
        if(id==='persia'){
          const old=this.history.find(s=>s.time>=this.time-2)||this.history[0];
          if(old){h.x=old.x;h.y=old.y;h.angle=old.angle;h.hp=Math.min(100,Math.max(h.hp,old.hp));h.vx=h.vy=0;h.push=[0,0];h.feet.forEach((foot,i)=>{foot.point=this._stance(h,i?1:-1);foot.step=null;foot.angle=h.angle;foot.planted=true;foot.plantSince=this.time;});}
          h.invulnerableUntil=this.time+1;this.enemies.forEach(e=>{e.hurtUntil=this.time+.9;e.nextAttack=this.time+1.3;});
        }else{
          const targets=id==='assassin'?[this.actors[a.target]].filter(Boolean):this.enemies;
          for(const e of targets)if(e.hp>0&&dist(h,e)<68)this._damageEnemy(e,id==='assassin'?50:42,h);
        }
      }
    }
    _bounds(a){
      a.x=clamp(a.x,-141,141);a.y=clamp(a.y,-109,139);
      for(const [x,y,r] of this.profile?.obstacles||[]){const dx=a.x-x,dy=a.y-y,d=Math.hypot(dx,dy),R=r+5;if(d<R){a.x=x+(d?dx/d:1)*R;a.y=y+(d?dy/d:0)*R;}}
      a.x=clamp(a.x,-141,141);a.y=clamp(a.y,-109,139);
    }
    _feet(a,dt){
      const age=this.time-(a.action?.start??0);
      const airborne=a.id===0&&this.profile?.id==='arkham'&&a.action?.kind==='special'&&age>=.18&&age<.62;
      if(airborne||a.grapnelAirborne){
        a.feet.forEach((foot,i)=>{foot.point=this._stance(a,i?1:-1);foot.step=null;foot.angle=a.angle;foot.planted=!airborne;foot.phase=0;foot.plantSince=this.time;});
        a.grapnelAirborne=airborne;a.footReady=this.time+.03;return;
      }
      super._feet(a,dt);
    }
    _describe(a){
      const d=super._describe(a),hero=a.id===0,id=this.profile?.id,action=a.action,age=action?this.time-action.start:0,q=d.pose;
      d.flatWeight=0;d.weaponVisible=true;d.action=action?.kind||null;d.actionAge=age;
      if(!hero)return d;
      if(!action&&!a.blocking&&a.hurtUntil<=this.time){
        q.rh=id==='arkham'?[10,11,38]:[7,10,34];q.lh=id==='tsushima'?[3,7,28]:id==='arkham'?[-10,13,37]:[-8,9,32];q.weapon=id==='tsushima'?.1:-.25;
      }
      if(action?.kind==='attack'){
        if(d.aim)d.aim.point=this.profile.contact;
        if(id==='arkham'){
          const wind=smooth(age/.18),strike=band(age,.17,.29,.35,.65);
          q.rh=lerp([13,-2,40],[3,21,40],strike);q.lh=[-10,13,38];q.twist=-.35*wind+.95*strike;q.weapon=0;
        }else if(id==='tsushima')q.lh=lerp([4,6,28],[-1,15,34],band(age,.16,.3,.4,.6));
      }
      if(action?.kind==='throw'){
        q.rh=lerp([12,-7,40],[3,19,39],smooth(age/.3));q.lh=[-9,10,35];q.twist=-.4+.9*smooth(age/.3);q.lean=.1;d.aim=null;d.weaponVisible=false;
      }
      if(a.blocking){q.lh=[-7,16,41];q.rh=id==='arkham'?[8,14,41]:[8,14,38];q.twist=-.2;q.weapon=-.55;}
      if(action?.kind==='special'){
        const u=band(age,0,.18,.45,1.05);q.crouch=2+u*(id==='assassin'?7:4);q.lean=.08+u*.24;q.twist=-.45+u*.85;
        q.rh=id==='arkham'?[10,10,30]:id==='persia'?[5,14,43]:[4,17,34];q.lh=id==='persia'?[-3,15,45]:[-8,10,35];q.weapon=-.6;
        if(id==='tsushima'||id==='assassin'){
          const target=this.actors[action.target];if(target&&dist(a,target)<65)d.aim={target:[target.x,target.y,39],weight:band(age,.22,.33,.41,.6),point:id==='assassin'?[0,0,7]:this.profile.contact};
          const w=band(age,.06,.13,.45,.65),hop=Math.sin(clamp((age-.06)/.59)*Math.PI)*1.8;
          d.jump=hop;d.feet=d.feet.map((foot,i)=>({...foot,point:lerp(foot.point,add([a.x,a.y,6+hop],S.graphics.rotZ([i?5:-5,i?-9:9,0],a.angle)),w),planted:w>0?false:foot.planted}));
          if(id==='assassin')d.weaponVisible=false;
        }
        if(id==='persia')d.weaponVisible=false;
        if(id==='arkham'){
          const target=this.actors[action.target],pull=band(age,.14,.24,.48,.65),strike=band(age,.32,.48,.54,.82);
          q.crouch=1.2+band(age,.54,.64,.75,1.1)*3;q.lean=.04+pull*.24;q.twist=-.32*pull+.78*strike;q.weapon=0;
          q.lh=lerp([-8,18,41],[-9,10,36],smooth((age-.27)/.3));q.rh=lerp([12,-3,40],[4,20,39],strike);
          d.jump=age>.18&&age<.62?7*Math.sin((age-.18)/.44*Math.PI):0;d.weaponVisible=false;
          if(age>=.18&&age<.62)d.feet=d.feet.map((foot,i)=>({...foot,point:add(foot.point,[0,0,d.jump+(i?1.6:0)*pull]),planted:false}));
          if(target){
            if(dist(a,target)<45)d.aim={target:[target.x,target.y,39],weight:band(age,.34,.47,.54,.76),point:[0,0,1]};
            if(age>.06&&age<.49&&target.hp>0)d.grapnel={target:[target.x,target.y,39],extension:clamp((age-.06)/.12),tension:smooth((age-.15)/.07)};
          }
        }
      }
      return d;
    }
    _release(action){
      const rig=S.makeRig(0,this.time,this._describe(this.hero)),id=this.profile.id;
      let targets=this.enemies.filter(e=>e.hp>0).sort((a,b)=>dist(this.hero,a)-dist(this.hero,b)).map(e=>e.id);
      if(id!=='tsushima'&&id!=='arkham')targets=targets.slice(0,1);
      this.flight={start:this.time,origin:[...rig.hand],targets,points:targets.map(i=>[this.actors[i].x,this.actors[i].y,40]),duration:id==='arkham'?1.1:.48,hits:new Set(),trail:[],id};
    }
    _flightAt(elapsed){
      const f=this.flight,u=clamp(elapsed/f.duration),targets=f.targets.map((id,i)=>f.hits.has(i)?f.points[i]:[this.actors[id].x,this.actors[id].y,40]);
      if(f.id!=='arkham'){
        const bolts=(targets.length?targets:[add(f.origin,mul(facing(this.hero),90))]).map(target=>({from:f.origin,target,position:lerp(f.origin,target,u)}));
        return {center:bolts[0].position,bolts,trail:[]};
      }
      const end=S.makeRig(0,this.time,this._describe(this.hero)).hand,forward=facing(this.hero);
      const A=targets[0]||add(f.origin,mul(forward,70)),B=targets[1]||add(A,[-forward[1]*30,forward[0]*30,0]);
      const nodes=[f.origin,A,B,end],segment=Math.min(2,Math.floor(u*3)),v=u*3-segment,a=nodes[segment],b=nodes[segment+1],side=[-(b[1]-a[1]),b[0]-a[0],0],n=unit(side);
      const center=add(lerp(a,b,v),mul(n,Math.sin(v*Math.PI)*(segment===2?22:6))),angle=u*Math.PI*8;
      const transform=p=>[center[0]+p[0]*Math.cos(angle)-p[1]*Math.sin(angle),center[1]+p[0]*Math.sin(angle)+p[1]*Math.cos(angle),center[2]+p[2]];
      return {center,transform,trail:f.trail.map(p=>({...p}))};
    }
    _projectile(){
      if(!this.flight)return;const f=this.flight,age=this.time-f.start,at=f.id==='arkham'?[f.duration/3,f.duration*2/3]:[f.duration*.9,f.duration*.9];
      f.targets.forEach((id,i)=>{if(age>=at[i]&&!f.hits.has(i)){f.hits.add(i);const e=this.actors[id];f.points[i]=[e.x,e.y,40];this._damageEnemy(e,f.id==='tsushima'?22:26,this.hero);}});
      const frame=this._flightAt(age);f.trail.push({outer:add(frame.center,[2,2,0]),inner:add(frame.center,[-2,-2,0])});if(f.trail.length>8)f.trail.shift();
      if(age>=f.duration)this.flight=null;
    }
    step(dt,input={}){
      const before=this.time;super.step(dt,input);
      if(this.time!==before){
        this.history.push({time:this.time,x:this.hero.x,y:this.hero.y,angle:this.hero.angle,hp:this.hero.hp});while(this.history.length&&this.history[0].time<this.time-3)this.history.shift();
        if(this.hero.action?.kind==='attack'){
          const rig=S.makeRig(0,this.time,this._describe(this.hero)),fist=this.profile.id==='arkham';
          this.weaponTrail.push({outer:rig.weapon(fist?[0,0,1]:[0,2,32]),inner:rig.weapon([0,0,fist?-2:5])});if(this.weaponTrail.length>5)this.weaponTrail.shift();
        }else this.weaponTrail=[];
      }
    }
    frame(){const f=super.frame();f.events=f.events.map(e=>({...e}));f.trail=this.weaponTrail.map(p=>({...p}));return f;}
  }
  function activate(id){
    const profile=byId.get(id);if(!profile)throw new Error(`Unknown scene: ${id}`);
    themes.forEach(t=>t.environment.show(false));activeId=id;
    if(id==='midgard'){S.setTheme(null);return profile;}
    let theme=themes.get(id);
    if(!theme){const artists=profile.expanded?window.LegendCharacters:chars;theme={environment:window.WorldArt.build[id](),drawCharacter:(r,g)=>artists.draw(r,g,id),drawProjectile:(f,g)=>artists.projectile(f,g,id),drawAmbient:(t,g)=>artists.ambient(t,g,id),drawEvent:(e,t,g)=>artists.event(e,t,g,id)};themes.set(id,theme);}
    theme.environment.show(true);S.setTheme(theme);return profile;
  }
  function createGame(id,options={}){const p=byId.get(id);return id==='midgard'?new G(options):p.expanded?new window.LegendCombat(p,options):new SceneCombat(p,options);}
  function prepareWatch(id){
    if(watchCache.has(id))return watchCache.get(id);
    const g=createGame(id),frames=[],schedule=[[1.6,'attack'],[3.0,'attack'],[4.5,'throw'],[6.3,'dodge'],[8.1,'attack'],[10.2,'slam'],[12.1,'throw'],[14,'attack']],sent=new Set();
    for(let i=0;i<1080;i++){
      const t=i/60,h=g.hero,target=g.nearest();let input={x:0,y:0,block:t>7&&t<8};
      if(t>.5&&t<15.5&&target&&!h.action&&!input.block){
        const ranged=byId.get(id).ranged,breach=id==='siege'&&t>8.6&&t<10.4;
        const goal=breach?{x:47,y:38}:target,d=dist(h,goal),dx=goal.x-h.x,dy=goal.y-h.y;
        const retreat=(id==='arkham'||id==='spider')&&t>9&&t<10.2||ranged&&!breach&&d<72;
        if(d>(breach?47:ranged?105:27)||retreat){const m=Math.max(1,Math.hypot(dx,dy)),direction=retreat?-1:1;input.x=(dx-dy)*.866/m*direction;input.y=(dx+dy)*.5/m*direction;}
      }
      for(let j=0;j<schedule.length;j++)if(!sent.has(j)&&t>=schedule[j][0]&&t<schedule[j][0]+1.3){if(g.command(schedule[j][1],input)){sent.add(j);if(byId.get(id).expanded&&schedule[j][1]==='slam')h.invulnerableUntil=g.time+h.action.duration;}}
      g.step(1/60,input);h.hp=100;for(const e of g.enemies){if(e.hp<=0){e.hp=40;e.deadAt=null;}else e.hp=Math.max(12,e.hp);}g.phase='playing';
      const f=g.frame(),fade=Math.min(1,smooth(t/.55),smooth((18-t)/1.1));f.actors.forEach(a=>{a.opacity*=fade;a.hp=1;});f.watch=true;frames.push(f);
    }
    if(id==='payne'){
      // Close the ambient cycles cleanly while preserving the 30% speed change.
      const origin=frames[0].time,span=frames.at(-1).time-origin+1/60;
      const fanCycles=Math.max(1,Math.round(span/2))*2,rainCycles=Math.max(1,Math.round(span/1.5))*1.5;
      frames.forEach(frame=>{const phase=(frame.time-origin)/span;frame.worldState.fanTime=phase*fanCycles;frame.ambientTime=phase*rainCycles;});
    }
    watchCache.set(id,frames);return frames;
  }
  function renderWatch(id,time){if(id==='midgard'){S.render(time);return;}const frames=prepareWatch(id),t=((time%18)+18)%18;S.renderGame(frames[Math.min(1079,Math.floor(t*60))]);}
  window.Worlds={catalog,byId,activate,createGame,renderWatch,prepareWatch,SceneCombat,get activeId(){return activeId;},get themes(){return themes;}};
})();
