/* Costumes, weapons and effects for eight SVG combat casts. All meshes follow IK bones. */
(() => {
  'use strict';
  const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x));
  const palettes={
    duty:{skin:'#b6a68d',cloth:'#646b5a',trim:'#b9aa83',dark:'#344448',metal:'#53656a',hair:'#313d3d',enemy:['#927c64','#6d7b73']},
    payne:{skin:'#c6b0a0',cloth:'#384353',trim:'#c2b7a9',dark:'#293444',metal:'#8e9ba4',hair:'#493f40',enemy:['#806b69','#657184']},
    gta:{skin:'#c4a18a',cloth:'#d0c7b3',trim:'#9b795c',dark:'#555b58',metal:'#59616e',hair:'#706154',enemy:['#64586f','#737f78']},
    spider:{skin:'#c3a68f',cloth:'#a94e52',trim:'#d7d8d1',dark:'#365d84',metal:'#4c687c',hair:'#3f4858',enemy:['#77677b','#758381']},
    wukong:{skin:'#b19a78',cloth:'#46564e',trim:'#ccb472',dark:'#3f4940',metal:'#b19b65',hair:'#514b40',enemy:['#778276','#817259']},
    siege:{skin:'#baa891',cloth:'#4d6377',trim:'#a6a58d',dark:'#2f4358',metal:'#7d939d',hair:'#354650',enemy:['#78817e','#777385']},
    fable:{skin:'#c2aa91',cloth:'#5c7194',trim:'#c5ae76',dark:'#4d535a',metal:'#a5afb0',hair:'#715944',enemy:['#697772','#817360']},
    kombat:{skin:'#baa089',cloth:'#b39955',trim:'#d3b875',dark:'#3e4247',metal:'#998d72',hair:'#343b3e',enemy:['#527c98','#956257']}
  };
  function gun(T,g,kind='rifle'){
    const c=['#788b94','#334953','#475d69'];
    if(kind==='pistol'||kind==='flintlock'){
      g.solidBox(T,-1.1,-.5,-1,2.2,2.2,9,c);g.solidBox(T,-.9,-4,-2,1.8,4,2.8,['#665b51','#38434a','#505c61']);
      g.limb(T,[0,.65,7],[0,.65,kind==='flintlock'?15:10],.65,.65,kind==='flintlock'?['#c5b385','#7d827b']:c,8);
      g.solidBox(T,-.3,1.7,5,.6,.5,1.5,['#bcc4bc','#8a999e']);return;
    }
    g.solidBox(T,-1.2,-1.1,-3,2.4,3,14,c);g.solidBox(T,-1.3,-.7,-10,2.6,3,6,['#5d716f','#2d4246','#41585a']);
    g.solidBox(T,-1,-6,1,2,5,3,['#626d68','#354950','#41565a']);g.solidBox(T,-.8,-4,-2,1.6,3,2,c);
    g.limb(T,[0,.6,10],[0,.6,22],.65,.45,['#778d93','#354c58','#526c78'],8);
    g.solidBox(T,-1.4,-.3,8,2.8,2.4,7,['#667b80','#314b57','#405c68']);
    for(let z=9;z<15;z+=1.4)g.solidBox(T,-1.5,2.1,z,3,.35,.6,['#8b9b98','#586f74']);
    g.solidBox(T,-.8,2.2,3,1.6,2.4,3,['#526b78','#2a424f','#75919b']);
    g.face([[-.6,4.7,3],[-.6,4.7,6],[.6,4.7,6],[.6,4.7,3]].map(T),'#91b6bb');
  }
  function sword(T,g){
    g.limb(T,[0,0,-5],[0,0,4],.8,.8,['#8f7855','#514a40','#b39b6c'],7);g.solidBox(T,-3,-.8,3,6,1.6,1,['#d1bb83','#8c866e']);
    g.face([[0,-1.6,4],[0,1.6,4],[0,1.2,27],[0,0,32]].map(T),'#c2ccc5');g.face([[.5,-1.6,4],[.5,0,5],[.5,0,31],[.5,-1.2,27]].map(T),'#f0dfbc');
  }
  function staff(T,g,length=40){
    g.limb(T,[0,0,-23],[0,0,length],1.05,1.05,['#8b7751','#564e38','#a28b59'],10);
    for(const z of [-23,-19,length-7,length-3])g.limb(T,[0,0,z],[0,0,z+2.8],1.5,1.5,['#dbc27c','#9c8247','#c5a861'],10);
    for(let z=-12;z<20;z+=3.5)g.limb(T,[0,0,z],[0,0,z+.5],1.13,1.13,['#c2aa70','#80704b'],7);
  }
  function hammer(T,g){g.limb(T,[0,0,-7],[0,0,28],.9,.9,['#9b9c83','#4f696d','#728989'],8);for(let z=-6;z<9;z+=1.4)g.limb(T,[0,0,z],[0,0,z+.5],1.1,1.1,['#5d7176','#354c59'],8);g.solidBox(T,-7,-2.8,25,14,5.6,6,['#a6b0ac','#5b707a','#7d9198']);g.solidBox(T,-7.5,-3,25,2,6,6,['#b8c1b6','#6e8389','#8e9f9f']);}
  function maxHead(H,g){
    const {face,loft}=g,F=(points,color)=>face(points.map(H),color,color,.018);
    const surface=(points,color)=>{
      points=points.map(H);
      const a=g.sub(points[1],points[0]),b=g.sub(points[2],points[0]);
      const n=g.norm([a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]);
      if(n[0]+n[1]+n[2]<-.001)return;
      const light=.8+Math.max(0,-n[0]*.249-n[1]*.498+n[2]*.83)*.24;
      const fill='#'+[1,3,5].map(i=>Math.min(255,Math.round(parseInt(color.slice(i,i+2),16)*light)).toString(16).padStart(2,'0')).join('');
      face(points,fill,fill,.045);
    };
    const hairline=a=>{const f=Math.sin(a);return 56+f*(f>0?2.25:1.25)+(f>0?5*f*(1-f):0)+.09*Math.cos(a*3);};
    // Classic noir-era Max: a broad angular jaw, long forehead and a swept-back quiff.
    // This replaces the shared round head and fringe, rather than layering a mask over it.
    const headRings=[[.15,49.1,1.65,1.65],[.15,50.15,2.65,2.25],[-.05,51.6,3.05,2.65],[-.12,53.5,3.35,2.95]].map(([y,z,rx,ry])=>Array.from({length:24},(_,i)=>[Math.cos(i*TAU/24)*rx,y+Math.sin(i*TAU/24)*ry,z]));
    // The skin ends at the actual hairline: no hidden scalp can poke through the hair.
    for(const u of [.5,1])headRings.push(Array.from({length:24},(_,i)=>{const a=i*TAU/24;return [Math.cos(a)*(3.35+(3.39-3.35)*u),-.12-.13*u+Math.sin(a)*(2.95+.05*u),53.5+(hairline(a)-.025-53.5)*u];}));
    for(let j=0;j<headRings.length-1;j++)for(let i=0;i<24;i++)surface([headRings[j][i],headRings[j][(i+1)%24],headRings[j+1][(i+1)%24],headRings[j+1][i]],'#cbb2a0');
    for(const side of [-1,1]){
      const P=points=>points.map(([x,y,z])=>[side*x,y,z]);
      // Cheek planes taper into a square chin instead of a cylindrical lower face.
      F(P([[.8,2.91,53.6],[2.35,2.32,54.0],[3.08,1.44,53.1],[2.8,1.56,51.5],[1.65,2.43,51.25],[1.1,2.85,52.05]]),side>0?'#b69b8c':'#c7aa98');
      F(P([[1.65,2.43,51.25],[2.8,1.56,51.5],[2.55,1.45,50.35],[1.35,2.21,49.75],[.5,2.42,50.2]]),'#ab9589');
      // Ears have a rim and inner fold; the sideburns stop ahead of them.
      loft(H,[[side*3.18,-.22,51.9,.39,.66],[side*3.55,-.12,52.5,.52,.85],[side*3.58,-.2,54.3,.54,.85],[side*3.28,-.25,54.9,.38,.62]],'#bd9e8d',8);
      F(P([[3.7,.34,54.25],[3.86,.19,53.7],[3.72,.37,52.75],[3.47,.52,53.1],[3.54,.5,54.05]]),'#93766e');
      // Narrow eyes, heavy inward-sloping brows and tired lower lids.
      F(P([[.5,3.08,55.0],[1.85,2.8,55.35],[2.7,1.98,55.05],[2.39,2.45,54.15],[.67,3.17,54.2]]),'#977e73');
      F(P([[.64,3.18,54.58],[1.72,2.93,54.76],[2.42,2.43,54.48],[2.03,2.78,54.17],[.79,3.22,54.24]]),'#393337');
      F(P([[.88,3.27,54.39],[1.7,3.04,54.52],[2.08,2.8,54.35],[1.74,3.05,54.18],[.98,3.28,54.2]]),'#c2b8ac');
      F(P([[1.19,3.24,54.4],[1.48,3.17,54.43],[1.5,3.18,54.18],[1.22,3.25,54.17]]),'#323b3b');
      F(P([[.49,3.11,55.02],[1.72,2.96,55.63],[2.64,2.05,55.45],[2.54,2.24,55.09],[1.7,3.04,55.22],[.57,3.2,54.8]]),'#403437');
      F(P([[.79,3.2,53.97],[1.83,2.93,53.93],[2.5,2.27,54.1],[1.99,2.81,53.63],[1.06,3.15,53.7]]),'#af9084');
      F(P([[.4,3.04,55.45],[.57,3.03,55.52],[.78,2.92,56.35],[.62,2.99,56.48]]),'#ac8c80');
      // Nasolabial crease and restrained stubble give the face its worn expression.
      F(P([[.85,3.25,52.7],[1.24,2.98,52.3],[1.76,2.64,51.5],[1.62,2.76,51.4],[1.08,3.08,52.18]]),'#aa887c');
      for(let i=0;i<7;i++){
        const x=.6+i*.26,y=2.65-(x-.5)*.35,z=50.25+(i%3)*.16;
        F(P([[x,y+.12,z],[x+.08,y+.11,z+.22],[x+.17,y+.09,z+.05]]),'#97847e');
      }
    }
    // A projecting bridge and separate alar planes retain the silhouette in side view.
    F([[-.48,3.13,55.05],[.48,3.13,55.05],[.54,3.9,53.1],[.02,4.37,52.7],[-.55,3.9,53.1]],'#d3b3a0');
    F([[.48,3.13,55.05],[.82,3.08,53.2],[1.01,3.6,52.6],[.48,4.13,52.3],[.02,4.37,52.7],[.54,3.9,53.1]],'#af8c7e');
    F([[-.55,3.9,53.1],[.02,4.37,52.7],[-.48,4.13,52.3],[-1.01,3.6,52.6],[-.82,3.08,53.2]],'#c3a18e');
    F([[-.83,3.7,52.55],[-.42,4.16,52.4],[.4,4.16,52.4],[.84,3.7,52.55],[.47,3.68,52.16],[-.45,3.68,52.16]],'#8e6e66');
    F([[-.18,3.04,52.08],[.14,3.05,52.08],[.24,3.06,51.62],[-.2,3.06,51.65]],'#b18d80');
    // Compressed, slightly asymmetric mouth; not an open smile.
    F([[-1.63,2.71,51.46],[-.68,3.04,51.32],[.12,3.11,51.4],[.78,3.02,51.46],[1.57,2.72,51.72],[1.47,2.82,51.46],[.61,3.11,51.19],[-.7,3.12,51.12]],'#765b58');
    F([[-1.21,2.92,51.03],[-.4,3.13,50.94],[.59,3.14,51.02],[1.18,2.97,51.23],[.54,3.17,50.8],[-.52,3.13,50.75]],'#b48b7e');
    F([[-1.04,2.74,50.44],[.98,2.74,50.45],[1.24,2.42,50.0],[.53,2.5,49.7],[-.6,2.5,49.7],[-1.27,2.4,50.0]],'#cbb0a0');
    // Full dark hair with a curved hairline, tapered sides and a raised front sweep.
    const count=24;
    const hairPoint=(theta,ring,extra=0)=>{
      const front=Math.sin(theta),side=Math.cos(theta);
      if(ring===0)return [side*(3.43+extra),-.25+front*(3.04+extra),hairline(theta)];
      if(ring===1)return [side*(3.13+extra)-.12,-.56+front*(2.89+extra),58.87+front*.53];
      if(ring===2)return [side*(2.16+extra)-.27,-.92+front*(2.05+extra),59.95+front*.23];
      return [-.27+side*.25,-1.04+front*.3,60.35];
    };
    for(let ring=0;ring<3;ring++)for(let i=0;i<count;i++){
      const a=i*TAU/count,b=(i+1)*TAU/count;
      surface([hairPoint(a,ring),hairPoint(b,ring),hairPoint(b,ring+1),hairPoint(a,ring+1)],'#302c32');
    }
    F(Array.from({length:count},(_,i)=>hairPoint(i*TAU/count,3)),'#322e34');
    // Subtle brushed locks stay on the scalp surface and taper before the crown.
    for(let i=0;i<9;i++){
      const a=.22+i*.33,w=.012+(i%3)*.004;
      for(let ring=0;ring<2;ring++)F([hairPoint(a,ring,.035),hairPoint(a+w,ring,.035),hairPoint(a+w+.02,ring+1,.04),hairPoint(a+.02,ring+1,.04)],i%3?'#39343c':'#433b44');
    }
    for(const s of [-1,1])F([[s*3.25,.75,56.0],[s*3.31,.8,54.5],[s*3.03,1.09,53.35],[s*3.02,1.25,54.75]],'#3b3036');
  }
  function fableHead(r,g){
    const {H,t,base,q}=r;
    const F=(points,color)=>g.face(points.map(H),color,color,.04);
    const shade=['#73523c','#77553e','#7b5840','#7e5a42','#77543d','#6f4f3a'];
    const surface=(points,color)=>{
      const world=points.map(H),a=g.sub(world[1],world[0]),b=g.sub(world[2],world[0]);
      const n=g.norm([a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]);
      if(n[0]+n[1]+n[2]<-.001)return;
      const light=.81+Math.max(0,-n[0]*.25-n[1]*.5+n[2]*.83)*.25;
      const fill='#'+[1,3,5].map(i=>Math.min(255,Math.round(parseInt(color.slice(i,i+2),16)*light)).toString(16).padStart(2,'0')).join('');
      g.face(world,fill,fill,.045);
    };
    const hairline=a=>55.25+2.25*Math.sin(a)+.22*Math.cos(a*2)+.8*Math.max(0,Math.sin(a))**8;
    // A fitted face terminates at the hairline, underneath a continuous filled crown.
    const rings=[[.15,49.25,1.7,1.8],[.15,50.4,2.55,2.4],[-.02,52,3.05,2.8],[-.14,53.6,3.25,2.96]].map(([y,z,rx,ry])=>Array.from({length:20},(_,i)=>[Math.cos(i*TAU/20)*rx,y+Math.sin(i*TAU/20)*ry,z]));
    rings.push(Array.from({length:20},(_,i)=>{const a=i*TAU/20;return [Math.cos(a)*3.25,-.2+Math.sin(a)*2.98,hairline(a)-.03];}));
    for(let j=0;j<rings.length-1;j++)for(let i=0;i<20;i++)surface([rings[j][i],rings[j][(i+1)%20],rings[j+1][(i+1)%20],rings[j+1][i]],'#c9af92');
    for(const side of [-1,1]){
      const P=points=>points.map(([x,y,z])=>[x*side,y,z]);
      F(P([[.7,3.02,53.55],[2.22,2.35,53.8],[2.92,1.6,52.9],[2.45,1.9,51.4],[1.28,2.71,51.6]]),'#b59a81');
      F(P([[.58,3.12,54.65],[1.7,2.87,54.94],[2.55,2.02,54.72],[2.35,2.25,54.42],[1.62,2.98,54.55],[.63,3.2,54.37]]),'#5b4537');
      F(P([[.72,3.18,54.14],[1.75,2.93,54.3],[2.21,2.54,54.08],[1.8,2.92,53.85],[.85,3.2,53.91]]),'#514c43');
      F(P([[.9,3.23,54.08],[1.76,3,54.19],[1.99,2.81,54.05],[1.72,3.02,53.96],[.98,3.25,53.97]]),'#d0c7ad');
      F(P([[1.25,3.18,54.13],[1.51,3.12,54.16],[1.51,3.13,53.96],[1.25,3.2,53.95]]),'#4f6a66');
      F(P([[.93,3.12,53.6],[1.87,2.81,53.61],[2.36,2.31,53.72],[1.9,2.81,53.43],[1.1,3.1,53.44]]),'#b3967e');
      F(P([[.97,2.9,51.35],[2.28,1.96,51.35],[2.39,1.7,50.6],[1.3,2.2,49.85],[.74,2.49,50.25]]),'#aa927d');
    }
    F([[-.45,3.12,54.5],[.43,3.12,54.5],[.5,3.73,53.03],[0,4.01,52.6],[-.51,3.65,52.95]],'#d6b99b');
    F([[.43,3.12,54.5],[.8,3.18,53.05],[.86,3.56,52.6],[.1,3.97,52.4],[0,4.01,52.6],[.5,3.73,53.03]],'#ad8e74');
    F([[-.76,3.49,52.61],[0,3.98,52.45],[.76,3.49,52.61],[.43,3.57,52.28],[-.4,3.57,52.28]],'#987963');
    F([[-1.25,2.83,51.34],[-.3,3.08,51.41],[.22,3.1,51.39],[1.22,2.83,51.38],[.58,3.04,51.15],[-.58,3.03,51.14]],'#856752');
    F([[-.85,2.94,50.99],[.78,2.98,51.04],[.55,3,50.86],[-.53,3,50.83]],'#bf9a7c');
    // Closed hair volumes: a full crown, solid shoulder-length back, and heavy side locks.
    const capPoint=(a,j)=>{
      const c=Math.cos(a),s=Math.sin(a);
      if(j===0)return [c*3.4,-.2+s*3.1,hairline(a)];
      if(j===1)return [c*3.55,-.45+s*3.17,57.9+s*.3];
      if(j===2)return [c*2.5,-.52+s*2.4,59.57+s*.12];
      return [.2+c*.15,-.65+s*.2,60.28];
    };
    for(let j=0;j<3;j++)for(let i=0;i<24;i++){const a=i*TAU/24,b=(i+1)*TAU/24;surface([capPoint(a,j),capPoint(b,j),capPoint(b,j+1),capPoint(a,j+1)],'#79553c');}
    F(Array.from({length:24},(_,i)=>capPoint(i*TAU/24,3)),'#79553c');
    const sway=(z)=>{
      const loose=clamp((54-z)/10),moving=clamp(base.speed/70);
      const phase=t*TAU/18;
      return [loose*(Math.sin(phase*9)*(.12+.28*moving)+q.twist*.6),-loose*(moving*.7+Math.sin(phase*8)*.12)];
    };
    const levels=[[44.3,3.8,2.9],[46,4.28,3.45],[48,4.4,3.65],[50,4.16,3.65],[52,3.94,3.55],[54,3.72,3.35],[56,3.5,3.15]];
    const hairPoint=(j,i,inner=false)=>{
      const [z,rx,ry]=levels[j],a=Math.PI-.22+i*(Math.PI+.44)/18,loose=clamp((54-z)/10),[dx,dy]=sway(z);
      return [Math.cos(a)*(rx-(inner ? .65 : 0))+dx,-.4+Math.sin(a)*(ry-(inner ? .6 : 0))+dy,z+(j===0?Math.sin(i*1.7)*.6:0)+(inner ? .12 : 0)+loose*.12*Math.sin(i*1.9+t*TAU/3)];
    };
    for(let j=0;j<levels.length-1;j++)for(let i=0;i<18;i++){
      const a=hairPoint(j,i),b=hairPoint(j,i+1),c=hairPoint(j+1,i+1),d=hairPoint(j+1,i);
      F([a,b,c,d],shade[i%shade.length]);
      F([hairPoint(j,i+1,true),hairPoint(j,i,true),hairPoint(j+1,i,true),hairPoint(j+1,i+1,true)],'#644735');
    }
    for(const j of [0,levels.length-1])for(let i=0;i<18;i++)F([hairPoint(j,i),hairPoint(j,i+1),hairPoint(j,i+1,true),hairPoint(j,i,true)],'#76533b');
    for(const i of [0,18])for(let j=0;j<levels.length-1;j++)F([hairPoint(j,i),hairPoint(j+1,i),hairPoint(j+1,i,true),hairPoint(j,i,true)],'#8b6244');
    const lock=(side,offset)=>{
      const rows=[[45.2,3.25,1.35,.22,.25],[47.0,3.75,1.23,.7,.65],[49.5,3.87,1.12,.8,.75],[52,3.65,1.25,.88,.8],[54.4,3.32,1.57,.92,.84],[56.8,2.65,1.86,.95,.76],[58.2,1.65,1.62,.8,.66],[59.3,.5,1.0,.18,.2]];
      const ring=rows.map(([z,x,y,rx,ry])=>Array.from({length:10},(_,i)=>{const a=i*TAU/10,[dx,dy]=sway(z);return [side*(x+Math.cos(a)*rx)+dx,y+offset+Math.sin(a)*ry+dy,z];}));
      for(let j=0;j<ring.length-1;j++)for(let i=0;i<10;i++){
        const quad=[ring[j][i],ring[j][(i+1)%10],ring[j+1][(i+1)%10],ring[j+1][i]];
        surface(side<0?quad.reverse():quad,side<0?'#886044':'#795239');
      }
      F(ring[0],'#6c4b35');F(ring.at(-1),'#926a49');
    };
    lock(-1,0);lock(1,-.15);
  }
  function wukongHead(H,g){
    const F=(points,color)=>g.face(points.map(H),color,color,.025);
    const fur='#514b40',light='#726b56',skin='#b89678';
    // A fully filled fur mantle frames the bare, heart-shaped macaque face.
    const mantle=[[0,-.45,48.8,2.3,2.1],[0,-.65,51,3.5,2.8],[0,-.65,53.5,4.05,3.3],[0,-.7,56,4.25,3.4],[0,-.8,58.3,3.9,3.25],[0,-1.0,60.4,3.1,2.7],[0,-1.2,61.7,1.4,1.5],[0,-1.3,62,.1,.1]].map(([x,y,z,rx,ry])=>Array.from({length:20},(_,i)=>[x+Math.cos(i*TAU/20)*rx,y+Math.sin(i*TAU/20)*ry,z]));
    for(let j=0;j<mantle.length-1;j++)for(let i=0;i<20;i++){
      if(j<3&&Math.sin((i+.5)*TAU/20)>.15)continue;
      g.lit([mantle[j][i],mantle[j][(i+1)%20],mantle[j+1][(i+1)%20],mantle[j+1][i]].map(H),fur);
    }
    g.loft(H,[[0,1.7,49.5,1.8,1.2],[0,2.25,51.2,2.2,1.6],[0,2,53.6,3.0,1.6],[0,1.8,55.5,3.1,1.65],[0,1.5,56.6,2.5,1.35]],skin,16);
    // Swept, solid tufts give the crown and cheek silhouette a distinctly simian outline.
    for(let i=0;i<18;i++){
      const a=i*TAU/18,x=Math.cos(a)*3.4,y=-.7+Math.sin(a)*2.9,z=58.2+Math.sin(a)*.4;
      const tip=[x*1.16,y-.65,60.8+(i%3)*.38];
      F([[x-.8,y,z],[x+.8,y,z],tip],i%2?fur:'#625b49');
      F([[x+.8,y,z],[x+.35,y-.7,z+.4],tip],'#655e4c');
    }
    F([[-2.9,2.24,56.7],[-1.25,3.1,57.05],[0,3.36,56.3],[1.3,3.1,57.05],[2.9,2.24,56.7],[2.7,2.83,54.0],[1.62,3.35,52.7],[-1.62,3.35,52.7],[-2.7,2.83,54]],skin);
    g.loft(H,[[0,2.6,50.0,1.75,1.05],[0,3.05,51.1,2.05,1.25],[0,3.0,52.4,1.8,1.2],[0,2.75,53.0,1.35,.9]],'#b18f70',14);
    for(const side of [-1,1]){
      const P=p=>p.map(([x,y,z])=>[side*x,y,z]);
      g.loft(H,[[side*4.05,-.1,52.5,.7,.7],[side*4.45,-.1,53.2,1.05,.8],[side*4.6,-.2,55.3,1.08,.85],[side*4.1,-.3,56.2,.55,.5]],'#967d61',10);
      F(P([[4.4,.68,53.1],[5.0,.34,53.7],[4.8,.54,55.2],[4.22,.7,54.8]]),'#755c4a');
      F(P([[.55,3.38,55.15],[1.8,3.05,55.72],[2.79,2.47,55.68],[2.52,2.93,55.13],[1.65,3.29,55.25],[.58,3.5,54.9]]),'#514839');
      F(P([[.65,3.46,54.87],[1.74,3.22,55.08],[2.37,2.92,54.88],[1.98,3.18,54.47],[.81,3.53,54.53]]),'#3e3e33');
      F(P([[.86,3.55,54.78],[1.72,3.33,54.93],[2.04,3.17,54.78],[1.67,3.36,54.6],[1.0,3.56,54.59]]),'#c0af8d');
      F(P([[1.22,3.48,54.83],[1.52,3.42,54.88],[1.52,3.43,54.59],[1.25,3.49,54.57]]),'#554836');
      for(let i=0;i<5;i++){
        const z=54.5-i*.9,x=2.65+i*.04;
        F(P([[x,2.7,z+.5],[x+1.3,1.1,z+1],[x+1.5,1.3,z-.6],[x+.5,2.3,z-1.1]]),i%2?'#655e4b':fur);
        F(P([[x+.5,2.3,z+.2],[x+.8,1.8,z+.6],[x+.6,2.15,z-.65]]),'#6b634f');
      }
    }
    F([[-.45,3.45,55.02],[.45,3.45,55.02],[.61,3.9,53.45],[0,4.35,52.9],[-.61,3.9,53.45]],'#bd9a7c');
    F([[-.65,3.94,53.45],[0,4.35,52.9],[.65,3.94,53.45],[.51,4.02,52.7],[0,4.12,52.55],[-.5,4.02,52.7]],'#7b6450');
    F([[-1.45,3.93,51.2],[-.4,4.27,51.14],[.5,4.24,51.14],[1.45,3.93,51.22],[.9,4.1,50.99],[-.95,4.1,50.98]],'#705747');
    for(let i=-3;i<=3;i++){
      const x=i*.55;F([[x-.42,3,50],[x+.42,3,50],[x*.8,2.6,47.9+Math.abs(i)*.3]],i%2?'#70664f':fur);
    }
    // Crown band, central cloud crest and jade accents echo the ornate golden armor.
    g.loft(H,[[0,-.8,59.35,3.65,2.97],[0,-.8,59.83,3.6,2.92]],'#b69a5c',20);
    F([[-1.4,2.1,59.5],[-1.75,1.8,60.7],[-.7,1.7,60.55],[0,1.4,62.6],[.7,1.7,60.55],[1.75,1.8,60.7],[1.4,2.1,59.5]],'#ceb477');
    F([[-.4,2.17,59.8],[0,2.22,60.7],[.4,2.17,59.8],[0,2.25,59.5]],'#6c9b8a');
  }
  function drawWight(r,g){
    const {base,angle,t,live}=r;
    // Keep the feet on their solved ground contacts; enlarge the torso and head above them.
    const T=p=>{const s=1+.55*clamp((p[2]-3)/35);return [base.x+(p[0]-base.x)*s,base.y+(p[1]-base.y)*s,3+(p[2]-3)*1.7];};
    const P=v=>T(r.P(v)),C=v=>T(r.C(v)),H=v=>T(r.H([v[0]*1.35,v[1]*1.15,47+(v[2]-47)*.86]));
    const F=(transform,points,color)=>g.face(points.map(transform),color,color,.025);
    const skin='#5d7f8b',head='#79778f',robe='#6c514e',ref=g.rotZ([0,1,.08],angle);
    r.legs.forEach((b,i)=>{
      g.muscle(T(b.a),T(b.b),[[0,7],[.45,7.4],[1,5.1]],skin,ref,12);
      g.muscle(T(b.b),T(b.end),[[0,5.1],[.45,4.8],[1,3.4]],'#587784',ref,12);
      const foot=r.feet[i],Q=v=>g.vec(T(foot.point),g.rotZ(v,foot.angle));
      g.loft(Q,[[0,1,-3,3.8,6],[0,1,0,4.6,7.3],[0,0,4,3.4,4.5]],'#62828d',12);
      for(let j=0;j<4;j++)g.loft(Q,[[j*1.7-2.8,6.1,-1,.9,1.5],[j*1.7-2.8,6.4,1,.8,1.5]],'#708a90',8);
    });
    g.loft(P,[[0,0,21,7.6,5.1],[0,0,29,8.2,5.9],[0,0,32,7.6,5.4]],'#8d795c',14);
    g.loft(C,[[0,0,28,7,5],[0,1,32,8.5,6.5],[0,.8,36,9.3,6.2],[0,0,42,9.2,5.1],[0,0,46,5.0,3.8]],skin,16);
    for(const side of [-1,1]){
      F(C,[[side*2.5,-5,29],[side*9,-2.9,29],[side*10,-2.5,44],[side*5,-2.9,47],[side*3,-3.9,42]],robe);
      F(C,[[side*3.3,5.7,29],[side*8.4,4.7,30],[side*10,2.9,43],[side*5,3.3,47],[side*4.5,4.7,40]],side<0?'#806258':robe);
      for(let j=0;j<5;j++)F(C,[[side*4.7,5.9,31+j*2],[side*7.5,4.8,31.3+j*2],[side*7.4,4.9,31.7+j*2],[side*4.7,6,31.3+j*2]],'#9a8065');
      F(P,[[side*3,5,27],[side*8,3.8,27],[side*7.5,4,17],[side*5,4.6,18],[side*2.5,5.3,19]],'#78644f');
    }
    r.arms.forEach((b,i)=>{
      g.muscle(T(b.a),T(b.b),[[0,6.5],[.5,7],[1,5.8]],robe,ref,12);
      g.muscle(T(b.b),T(b.end),[[0,5.1],[.6,5.4],[1,3.9]],skin,ref,12);
      const hand=v=>g.vec(T(b.end),g.rotZ(v,angle));
      g.loft(hand,[[0,0,-2.5,3.7,3.2],[0,1,2,4.1,3.6],[0,1.1,5.5,3.0,2.5]],'#658591',12);
      for(let j=0;j<4;j++)g.limb(hand,[j*1.6-2.4,3.1,1],[j*1.6-2.4,3.4,5.6],.85,.8,['#7e96a0','#54717e'],6);
    });
    g.loft(H,[[0,0,46.5,4.5,3.6],[0,0,49,6.4,5.3],[0,.15,52,7.5,6.5],[0,-.1,57,8.5,7.8],[0,-.5,63,9.3,8.4],[0,-.8,68.5,8.6,7.7],[0,-1,72.4,6.4,6],[0,-1,74.5,3.6,3.5],[0,-1,75.0,.2,.2]],head,24);
    for(const side of [-1,1]){
      const Q=p=>p.map(([x,y,z])=>[side*x,y,z]);
      g.loft(H,[[side*8,-.2,51,1.0,1.1],[side*9.4,-.4,53.5,1.5,1.5],[side*10.0,-.6,59,1.7,1.8],[side*9,-.6,63,1.3,1.4]],'#747b91',12);
      F(H,Q([[9.9,.8,59.5],[10.6,.1,58.5],[9.5,1.1,54],[9.1,1.2,55.1]]),'#535e79');
      F(H,Q([[1.1,8.02,60.3],[4.7,7.14,61.3],[7,4.9,60.3],[6.1,6.4,58.4],[1.5,8.08,58.5]]),'#59627d');
      F(H,Q([[1.5,8.2,58.6],[4.3,7.45,58.8],[5.7,6.6,58.3],[4.2,7.53,57.9],[1.7,8.24,58.0]]),'#303f51');
      F(H,Q([[1.6,8.15,57.4],[4.5,7.4,57.1],[6.0,6.15,57.6],[4.8,7.25,56.5],[2.1,8.0,56.65]]),'#8c8ca1');
    }
    g.loft(H,[[0,7.2,54.9,1.8,1.6],[0,7.9,56,2.1,2],[0,7.5,58,1.5,1.6],[0,6.8,60.5,1.1,1.1]],'#7c879c',12);
    F(H,[[-4.3,6.5,53.6],[-1.3,7.75,53.4],[1.4,7.75,53.4],[4.3,6.5,53.6],[2.9,7.2,52.6],[-2.9,7.2,52.6]],'#414f66');
    F(H,[[-3.4,7.0,52.4],[0,7.8,52.1],[3.4,7.0,52.4],[2.5,7.2,51.4],[-2.5,7.2,51.4]],'#8c91a6');
    const cracks=[[[0,4.4,73],[.8,6.3,70],[-.3,7.55,67],[.6,7.9,64],[0,8.05,62]],[[4.2,3.7,72.5],[3.5,6.5,69],[4.6,6.9,66.8],[3.5,7.4,64.4],[4,7.25,62.7]],[[-4,4,72],[-3.5,6.5,69],[-4.6,6.8,66],[-3.3,7.45,63.8],[-3.7,7.2,61.9]]];
    for(const line of cracks)for(let i=0;i<line.length-1;i++)g.limb(H,line[i],line[i+1],.12,.1,['#c3af65','#9e945e'],5);
    for(let i=0;i<13;i++){
      const a=i*TAU/13,x=Math.cos(a)*6.5,y=-.6+Math.sin(a)*5.6,z=71;
      g.limb(H,[x,y,z],[x*1.17,y*1.15,z+2+(i%3)],.12,.035,['#8b7d70','#ad9c7c'],5);
    }
    // Prayer beads and worn cloth folds finish the monk silhouette.
    for(let i=0;i<13;i++){const a=i*Math.PI/12;g.loft(C,[[Math.cos(a)*5.5,4.6+Math.sin(a)*1.5,40-Math.sin(a)*5,.72,.7],[Math.cos(a)*5.5,4.6+Math.sin(a)*1.5,41.2-Math.sin(a)*5,.72,.7]],'#b4a077',8);}
    if(live.bound)for(let j=0;j<6;j++)g.arc(base.x,base.y,42+j*10,18+j%2*2,0,TAU,.55,'#dac27c',.8);
  }
  function draw(r,g,id){
    if(id==='wukong'&&r.live?.boss==='wight'){drawWight(r,g);return;}
    const {P,C,H,legs,arms,feet,angle,q,t}=r,{loft,muscle,face,solidBox,vec,rotZ,lerp3}=g;
    const hero=r.id===0,p=palettes[id],mil=id==='duty'||id==='siege',monkey=hero&&id==='wukong',spider=hero&&id==='spider',ninja=id==='kombat',royal=hero&&id==='fable',max=hero&&id==='payne',trevor=hero&&id==='gta';
    const cloth=hero?p.cloth:p.enemy[r.id-1],skin=hero?p.skin:id==='fable'?'#97aaa1':id==='wukong'?'#919784':'#b8a591',dark=p.dark,ref=rotZ([0,1,.08],angle),live=r.live||{};
    legs.forEach((b,i)=>{
      const pants=spider?dark:trevor?'#8d8b76':max?'#4f5663':cloth;
      muscle(b.a,b.b,[[0,mil?3.8:3.2],[.38,mil?3.9:3.35],[1,2.2]],pants,ref,9);
      muscle(b.b,b.end,[[0,2.4],[.5,2.3],[1,1.45]],spider?cloth:royal||monkey||ninja?dark:pants,ref,9);
      const f=feet[i],F=v=>vec(f.point,rotZ([v[0],v[1],v[2]-3],f.angle));
      loft(F,[[0,1,0,2,3.6],[0,.8,1.6,2.15,3.7],[0,0,4,1.75,2.1],[0,-.1,6.8,1.4,1.7]],spider?cloth:dark,9);
      for(const z of [1,5])face([[-1.8,3.2,z],[1.8,3.2,z],[1.7,3.4,z+.35],[-1.7,3.4,z+.35]].map(F),spider?'#cc7774':'#92968b');
      if(mil){muscle(lerp3(b.a,b.b,.78),b.b,[[0,2.6],[1,2.5]],'#596f73',ref,8);muscle(lerp3(b.a,b.b,.3),lerp3(b.a,b.b,.55),[[0,3.9],[1,3.6]],p.trim,ref,7);}
      if(monkey||ninja||royal)for(let u=.35;u<.9;u+=.17)muscle(lerp3(b.b,b.end,u),lerp3(b.b,b.end,u+.045),[[0,2.45-u],[1,2.4-u]],p.trim,ref,7);
    });
    loft(P,[[0,0,23,5.4,3.4],[0,0,28,6,3.9],[0,0,30,5.6,3.5]],trevor?'#8b8975':max?'#4c5360':spider?dark:cloth,10);
    loft(C,[[0,0,28.5,5,3.3],[0,0,33,5.4,3.4],[0,0,37,6.9,3.8],[0,0,41.3,7.8,3.8],[0,0,43.5,8,3.5],[0,0,46,3.1,2.3]],cloth,12);
    muscle(C([0,0,royal?48.65:44.5]),H([0,0,50]),[[0,2.5],[1,2]],spider?cloth:monkey?p.hair:skin,ref,9);
    if(max)maxHead(H,g);
    else if(royal)fableHead(r,g);
    else if(monkey)wukongHead(H,g);
    else loft(H,[[0,.1,49.5,2.1,2],[0,.3,51.5,2.8,2.7],[0,.1,54.7,3.4,3.1],[0,-.1,57,3.1,2.8],[0,-.2,58.8,1.7,1.7],[0,-.2,59.2,.15,.15]],spider?cloth:mil||ninja?dark:skin,12);
    arms.forEach((b,i)=>{
      muscle(b.a,b.b,[[0,3.2],[.4,3.4],[1,2.15]],spider?cloth:trevor||ninja?skin:cloth,ref,9);
      muscle(b.b,b.end,[[0,2.25],[.4,2.4],[1,1.2]],spider?cloth:ninja||monkey||mil?dark:trevor?skin:cloth,ref,9);
      const hand=v=>vec(b.end,rotZ(v,angle));loft(hand,[[0,0,-1,1.4,1.3],[0,0,1.6,1.6,1.5],[0,0,3,1,1.0]],spider?cloth:mil||ninja?dark:skin,8);
      if(mil||royal||monkey||ninja){muscle(lerp3(b.b,b.end,.5),lerp3(b.b,b.end,.9),[[0,2],[1,1.5]],monkey||royal?p.trim:p.metal,ref,8);}
      if(trevor&&i===0)for(let j=0;j<4;j++)face([vec(lerp3(b.a,b.b,.4+j*.1),[0,1,0]),vec(lerp3(b.a,b.b,.43+j*.1),[1.2,1,0]),vec(lerp3(b.a,b.b,.49+j*.1),[0,1,0])],'#7f786d');
    });
    // Eyelids and nose remain visible at the gameplay scale; mask details are geometry.
    if(!spider&&!mil&&!ninja&&!max&&!royal&&!monkey){
      for(const s of [-1,1]){
        face([[s*.65,3.13,54.6],[s*2.45,2.6,54.6],[s*2.25,2.75,54.15],[s*.7,3.27,54.2]].map(H),'#5d5549');
        face([[s*.85,3.25,53.9],[s*2.1,2.87,53.9],[s*2.0,3,53.65],[s*.9,3.3,53.7]].map(H),'#333e40');
      }
      face([[-.65,3.2,54],[.7,3.2,54],[.7,4,52.5],[0,4.2,52],[-.6,3.6,52.5]].map(H),p.skin);
      face([[-1.3,2.9,51.1],[1.4,2.9,51.1],[.9,3.1,50.8],[-.8,3.1,50.8]].map(H),'#886f5f');
    }
    if(!spider&&!mil&&!ninja&&!monkey&&!max&&!royal){
      loft(H,[[0,-.9,54.5,3.5,2.8],[0,-.5,57.4,3.2,2.9],[0,-.5,59.1,1.8,1.8]],hero?p.hair:'#4e5050',12);
      if(trevor){loft(H,[[0,.5,56.5,2.7,2.5],[0,.4,58.7,1.6,1.6],[0,.3,59.2,.1,.1]],skin,10);face([[-1.8,3.5,51.4],[1.7,3.5,51.4],[1.6,3.2,50.6],[-1.5,3.2,50.6]].map(H),'#8a7969');}
    }
    // Belt, buckle, seams and material breaks.
    loft(P,[[0,0,27.7,6.2,4.1],[0,0,29.3,6.1,4.0]],spider?cloth:dark,10);
    if(!spider)solidBox(P,-1.4,4,28,2.8,.8,1.8,[p.trim,p.metal]);
    if(mil){
      loft(C,[[0,0,31,5.7,4.1],[0,0,40,7.6,4.5],[0,0,44,7,3.7]],id==='duty'?'#7c7d62':'#3d546b',10);
      for(const back of [-1,1]){
        for(let j=0;j<4;j++)for(let k=0;k<3;k++)solidBox(C,-5.5+k*3.7,back*4.6,32+j*2.3,3.1,.6,.7,[p.trim,'#4a5a58','#748179']);
        for(const x of [-4,0,4])solidBox(C,x-1.3,back*4.9,32,2.6,back>0?2:-2,5.5,[p.trim,id==='duty'?'#5b6456':'#415b6e',p.metal]);
      }
      for(const s of [-1,1])face([[s*5,3,45],[s*7,2.6,43],[s*5.5,4.6,35],[s*4.5,4.6,35]].map(C),'#b0a582');
      loft(H,[[0,-.2,54.8,3.75,3.6],[0,-.3,58.4,3.45,3.3],[0,-.2,60,1.5,1.8]],id==='duty'?'#56645c':'#4f6676',12);
      for(const s of [-1,1])solidBox(H,s*3.5-.6,-1.2,53,1.2,2.5,4,['#85928c','#3d555b','#60757a']);
      if(id==='duty'&&hero){
        face([[-2.8,3,55.3],[2.8,3,55.3],[2.6,3.4,52],[1.4,3.3,50.4],[-1.4,3.3,50.4],[-2.6,3.4,52]].map(H),'#d3cdb7');
        for(const s of [-1,1])face([[s*.5,3.5,54.4],[s*2.4,3.2,54.6],[s*2.1,3.5,53.3],[s*.8,3.7,53.4]].map(H),'#344648');
        face([[0,3.7,53.4],[-.5,3.7,52.3],[.6,3.7,52.3]].map(H),'#53635e');
        for(let j=-2;j<3;j++)face([[j*.55,3.5,51.4],[j*.55+.2,3.5,51.4],[j*.55+.2,3.55,50.3],[j*.55,3.55,50.3]].map(H),'#55645a');
      }else if(id==='siege'&&hero){
        for(const s of [-1,1])loft(H,[[s*1.6,2.8,52.7,1.4,1],[s*1.6,3.6,54,1.5,1.3],[s*1.6,3.7,55,1.1,1]],'#728c99',8);
        solidBox(H,-1.5,2.8,49.7,3,2,3,['#93a6aa','#304c5e','#536c78']);
      }else face([[-3,3.1,53.2],[3,3.1,53.2],[3,3.2,55],[-3,3.2,55]].map(H),'#a4b9ba');
      solidBox(C,-5,-5.6,37,4,2,5,['#8c9d98','#415b64','#687d82']);g.limb(C,[-3,-4.8,42],[-3,-4.8,51],.2,.2,['#647e80','#9faea5'],5);
    }else if(spider){
      // Red panels, ink webbing and the white spider are drawn on both sides of the suit.
      for(const side of [-1,1])face([[side*5.5,3.3,30],[side*6.4,3,36],[side*7.2,2.8,40],[side*4.7,3.8,41],[side*3.3,4,32]].map(C),dark);
      for(const back of [-1,1]){
        const y=back*4.1;face([[-.8,y,36],[.8,y,36],[1.2,y,40],[0,y,42],[-1.2,y,40]].map(C),'#e0ddd1');
        for(const side of [-1,1])for(let j=0;j<4;j++)face([[side*.5,y,37+j*.8],[side*(3.5+j*.35),y,36+j*2],[side*(5+j*.3),y,33+j*2.8],[side*(4.4+j*.3),y,33.3+j*2.8],[side*(3.1+j*.35),y,36+j*2],[side*.5,y,37.3+j*.8]].map(C),'#d8d7cc');
      }
      for(let j=0;j<7;j++){const z=30+j*2.2;face([[-3,4.05,z],[3,4.05,z],[3,4.15,z+.18],[-3,4.15,z+.18]].map(C),'#663d49');}
      for(const side of [-1,1]){
        face([[side*.65,3.5,55],[side*3.1,2.4,56.2],[side*2.8,3,53.7],[side*1.2,3.6,53]].map(H),'#314959');
        face([[side*.95,3.65,55],[side*2.7,2.85,55.7],[side*2.4,3.3,54],[side*1.3,3.75,53.6]].map(H),'#eee5d5');
      }
      for(let j=0;j<5;j++)face([[-2.3,2.9,50.6+j*1.65],[0,3.45,50.4+j*1.65],[2.3,2.9,50.6+j*1.65],[0,3.5,50.6+j*1.65]].map(H),'#693e4c');
      face([[-.1,3.5,50],[.1,3.5,50],[.1,3.2,58],[-.1,3.2,58]].map(H),'#693e4c');
    }else if(monkey){
      // Layered gold armor sits over dark jade cloth, with a fur-framed head above.
      for(let row=0;row<5;row++)for(let col=-2;col<=2;col++)solidBox(C,col*2.4-1,3.7,31+row*2.5,2,1.3,2.1,[row%2?'#c5ad6f':'#a78f58','#716646','#9d8a55']);
      for(const side of [-1,1]){
        loft(C,[[side*8,0,41,4.4,4.3],[side*8,0,45,3.7,3.8],[side*7.7,0,46.5,2.1,2.2]],'#b6a168',10);
        for(let j=0;j<4;j++)face([[side*.5,4.5,27-j*3],[side*6.2,3.5,27-j*3],[side*8,4,24-j*3],[side*.5,4.7,24-j*3]].map(P),j%2?'#8a744f':'#ae935e');
      }
      for(const [cx,cy,cz,R] of [[0,5.2,37.2,3.4],[-8,3.8,43.3,2.4],[8,3.8,43.3,2.4]]){
        for(let ring=0;ring<2;ring++)for(let i=0;i<18;i++){
          const a=i*TAU/18,b=(i+1)*TAU/18,outer=R-ring*.85,inner=outer-.27;
          face([[cx+Math.cos(a)*outer,cy,cz+Math.sin(a)*outer],[cx+Math.cos(b)*outer,cy,cz+Math.sin(b)*outer],[cx+Math.cos(b)*inner,cy+.05,cz+Math.sin(b)*inner],[cx+Math.cos(a)*inner,cy+.05,cz+Math.sin(a)*inner]].map(C),ring?'#927b48':'#d4bb78');
        }
        face([[cx-.65,cy+.12,cz],[cx,cy+.2,cz+1.1],[cx+.65,cy+.12,cz],[cx,cy+.24,cz-.8]].map(C),'#6f9c86');
      }
      for(const side of [-1,1])for(let i=0;i<5;i++){
        const z=30+i*2.7,x=side*(5.4-i*.55);
        g.limb(C,[x-.3,4.9,z],[x+.3,5.05,z+.65],.16,.16,['#d7be83','#998454'],6);
      }
      face([[-2,4.5,29],[2,4.5,29],[4+Math.sin(t*2),5,15],[0,5.5,12],[-2,5,21]].map(P),'#9a5340');
      g.limb(P,[-4,-3,26],[-8,-7,22],2.5,2,['#9c7750','#66573f'],8);g.limb(P,[-8,-7,22],[-7,-8,18],2.5,1.2,['#ac8252','#746044'],8);
    }else if(max||royal){
      for(const side of [-1,1]){
        const flutter=Math.sin(t*4+side)*.7+clamp(r.base.speed/70)*3;
        face([C([side*5,-2.7,40]),C([side*.5,-4,40]),P([side*.7,-5-flutter,12]),P([side*9,-4-flutter,15])],max?'#364352':cloth);
        face([[side*.7,4.2,31],[side*4.7,4.2,31],[side*7,3.6,43],[side*3,4,45],[side*1,4.6,41]].map(C),max?'#a99f94':p.trim);
        face([[side*1,4.7,41],[side*3.5,4.5,45],[side*5.8,3.8,43],[side*2.2,4.7,37]].map(C),max?'#506071':cloth);
      }
      if(max){
        for(let z=32;z<41;z+=2.5)face([[-1.8,4.5,z],[1.8,4.5,z],[1.8,4.5,z+.5],[-1.8,4.5,z+.5]].map(C),'#c9c0af');
        // Raised leather collar frames the jaw and keeps the exposed neck in proportion.
        for(const side of [-1,1]){
          face([[side*3.8,-1.8,44.6],[side*2.8,-2.2,48.6],[side*2.7,.9,48.0],[side*4.2,2.2,44.8]].map(C),'#303c4b');
          face([[side*2.7,.9,48],[side*.5,2.6,45.1],[side*1.8,3.6,43.6],[side*4.2,2.2,44.8]].map(C),'#c4b9a9');
        }
      }
      if(royal){
        for(const side of [-1,1])for(let j=0;j<5;j++)solidBox(C,side*3-.4,4.5,32+j*2,.8,.5,.8,['#e0c78c','#9d8a63']);
        loft(C,[[0,-.2,44,4,3],[0,-.3,45.5,3.8,3],[0,-.3,47,3.5,2.95],[0,-.3,48.7,3.2,2.9],[0,-.3,49,3.15,2.9]],'#566c8d',16);
        loft(C,[[0,-.3,48.65,3.23,2.94],[0,-.3,49,3.2,2.94]],'#bba575',16);
      }
    }else if(ninja){
      for(const side of [-1,1]){
        face([[side*1.5,4,29],[side*5.5,4,31],[side*8,2.9,44],[side*4.5,3.4,46],[side*1,4.3,37]].map(C),cloth);
        face([[side*2,-4,29],[side*6,-3.6,31],[side*8,-2.8,44],[side*3,-3.7,45]].map(C),cloth);
        for(let j=0;j<4;j++)face([[side*2.5,4.5,33+j*2.4],[side*5.8,4,33+j*2.4],[side*5.7,4.2,33.7+j*2.4],[side*2.5,4.6,33.7+j*2.4]].map(C),p.trim);
        face([[side*.5,3.6,54.2],[side*2.5,2.9,54.5],[side*2.3,3.1,53.8],[side*.7,3.7,53.7]].map(H),hero?'#e7d098':'#b4cad1');
      }
      face([[-2.7,3.2,53.2],[2.7,3.2,53.2],[2.1,3.8,50],[-2.1,3.8,50]].map(H),cloth);
      for(let j=-2;j<3;j++)face([[j*.7,3.9,50.8],[j*.7+.25,3.9,50.8],[j*.7+.25,3.5,52.7],[j*.7,3.5,52.7]].map(H),p.trim);
      for(const side of [-1,1])face([[side*.4,4.5,27],[side*5,4,27],[side*6.5,4,14],[side*1.3,4.5,16]].map(P),cloth);
      g.limb(C,[-6,-5,31],[6,-5,52],.8,.8,['#baa888','#685f52'],7);
    }else if(trevor){
      for(const side of [-1,1])face([[side*2.2,3.8,44.4],[side*4.2,3.5,45.5],[side*2.4,4,41.5],[side*.5,4,41.5]].map(C),'#b3aa96');
      for(let i=0;i<5;i++)face([[-3+i,4,32],[i-2.6,4.1,32],[i-2.8,4.1,36]].map(C),'#b8b09c');
    }else if(id==='wukong'){
      for(const side of [-1,1])g.face([[side*2,-.5,57],[side*4,-.5,63],[side*4.3,1,56]].map(H),p.hair);
      loft(H,[[0,2,50,2.5,2.6],[0,3,52.5,2,3],[0,2,54,1.7,1.5]],'#a7ac96',9);
      loft(C,[[0,0,35,6.5,4.2],[0,0,42,8.2,4.7],[0,0,45,6.6,3.8]],'#7a806d',10);
    }else if(id==='fable'){
      for(const side of [-1,1])face([[side*.5,3.4,54.3],[side*2.2,2.9,54.6],[side*2.2,3,53.6],[side*.6,3.5,53.6]].map(H),'#b5dbc9');
      for(let j=0;j<4;j++)solidBox(C,-5,3.7,33+j*2.4,10,.8,1.1,['#9ca89c','#576b64']);
    }
    // Render the weapon appropriate to the action, not a recolored axe.
    const gunner=mil||max||trevor||(!hero&&(id==='payne'||id==='gta'))||hero&&live.action==='flintlock';
    const Tgun=(hand)=>{const z=g.norm(g.sub(live.gunTarget||vec(hand,rotZ([0,100,0],angle)),hand)),x=g.norm([-z[1],z[0],0]),y=[-x[1]*z[2],x[0]*z[2],x[1]*z[0]-x[0]*z[1]];return v=>vec(hand,vec(g.mul(x,v[0]),vec(g.mul(y,v[1]),g.mul(z,v[2]))));};
    if(hero&&live.action==='hammer')hammer(r.weapon,g);
    else if(gunner&&live.weaponVisible!==false){gun(Tgun(arms[1].end),g,max?'pistol':live.action==='flintlock'?'flintlock':'rifle');if(max)gun(Tgun(arms[0].end),g,'pistol');}
    else if(monkey){
      if(live.pillar){const offset=rotZ([0,2,0],angle),base=[r.base.x+offset[0],r.base.y+offset[1],3],tip=[base[0],base[1],7+r.jump];g.limb(v=>v,base,tip,1.2,1.2,['#b29b60','#75653e','#d1b577'],10);g.limb(v=>v,vec(tip,[0,0,-2.5]),tip,1.55,1.55,['#d2b773','#aa8f51'],10);}else staff(r.weapon,g);
    }else if((royal||id==='fable'&&!hero)&&live.weaponVisible!==false)sword(r.weapon,g);
    else if(!hero&&(id==='spider'||id==='wukong')){g.limb(r.weapon,[0,0,-4],[0,0,26],1.1,1.9,['#9c9278','#6c705f','#b1a487'],8);}
    if(live.tether){const start=arms[0].end,end=lerp3(start,live.tether.target,live.tether.u);g.limb(v=>v,start,end,.25,.25,['#eeeadf','#c8d4d8'],5);}
    if(live.magic){for(const [i,b] of arms.entries()){const pos=b.end,s=2+live.magic*3;g.loft(v=>vec(pos,v),[[0,0,-s,s,s],[0,0,0,s*1.2,s*1.2],[0,0,s,0,0]],i?'#dcad64':'#9abfd2',8);}}
    if(live.bound){
      const color=live.bound==='web'?'#e1e3d7':live.bound==='gold'?'#dfc17c':live.bound==='electric'?'#b5d5df':'#d8cda9';
      for(let j=0;j<5;j++){
        const z=26+j*5,R=7+Math.sin(j)*2,points=Array.from({length:17},(_,i)=>[r.base.x+Math.cos(i*TAU/16+t)*R,r.base.y+Math.sin(i*TAU/16+t)*R,z]);
        for(let i=0;i<16;i++)g.limb(v=>v,points[i],points[i+1],live.bound==='web'?.19:.12,live.bound==='web'?.19:.12,[color],4);
      }
    }
    if(live.focus||live.rage||spider&&q.crouch>2){g.arc(r.base.x,r.base.y,4,13,0,TAU,live.focus?.5:live.rage?.6:.13,live.rage?'#c98264':live.focus?'#b9c4e2':'#b6b7c8',.9);}
    if(spider&&q.lh[2]>40&&live.action===null)for(let i=0;i<7;i++){const a=i*Math.PI/6,pt=H([Math.cos(a)*6,Math.sin(a)*4,62]);g.fx([pt,vec(pt,[0,0,3]),vec(pt,[.5,0,1])],'#eeecdf',.75);}
  }
  function projectile(f,g,id){
    const p=f.center;
    if(f.type==='spear'){
      const dir=g.norm(g.sub(p,f.origin)),side=g.norm([-dir[1],dir[0],0]);
      for(let i=0;i<18;i++){const a=g.lerp3(f.origin,p,i/18),b=g.lerp3(f.origin,p,(i+1)/18);g.limb(v=>v,a,b,.18,.18,[i%2?'#d3b78b':'#9d927e'],5);}
      g.face([g.vec(p,g.mul(dir,5)),g.vec(p,g.mul(side,1.7)),g.sub(p,g.mul(dir,3)),g.sub(p,g.mul(side,1.7))],'#d9c6a2');return;
    }
    if(f.type==='web'){for(let i=0;i<3;i++)g.arc(p[0],p[1],p[2]+i,2.6,0,TAU,.8,'#efeadc',.8);return;}
    g.loft(v=>g.vec(p,v),[[0,0,-2.5,1.8,1.8],[0,0,1.3,2.1,2.1],[0,0,3,1,1]],f.type==='flash'?'#b6bdaf':'#69745b',8);
  }
  function ambient(t,g,id){
    const rain=['duty','payne'].includes(id),count=id==='payne'?90:rain?52:id==='kombat'?25:24;
    for(let i=0;i<count;i++){
      const phase=((t/(rain?1.5:9))+i*.381966)%1,x=Math.sin(i*17.13)*172+(rain?phase*9:Math.sin(t*.7+i)*4),y=Math.cos(i*9.71)*166,z=rain?(1-phase)*125+8:id==='kombat'?phase*85+8:(1-phase)*100+8;
      if(rain)g.fx([[x,y,z],[x+.4,y,z],[x+2.8,y,z-8],[x+2.4,y,z-8]],id==='payne'?'#bdcbe0':'#cbd5d7',(id==='payne'?.17:.13)+Math.sin(phase*Math.PI)*.15);
      else{const s=id==='wukong'||id==='fable'?1.1:.5,c=id==='kombat'?'#e9b472':id==='wukong'?'#c7b681':id==='gta'?'#e9c5b1':id==='spider'?'#e8ccbe':id==='fable'?'#d2c293':'#cfdbd8';g.fx([[x-s,y,z],[x,y-.4,z+1],[x+s,y,z],[x,y+.4,z-1]],c,Math.sin(phase*Math.PI)*.5);}
    }
  }
  function event(e,t,g,id){
    const age=t-e.time,u=clamp(age/.6);if(age<0)return;
    if(e.type==='wightSlam'&&age<.85){
      const u=clamp(age/.85);g.arc(e.x,e.y,4,15+u*88,0,TAU,(1-u)*.7,'#c6ad72',3*(1-u)+.6);
      g.arc(e.x,e.y,4,8+u*70,0,TAU,(1-u)*.5,'#9392aa',1.5);
      for(let i=0;i<22;i++){const a=i*2.4,R=u*(15+i%5*10),x=e.x+Math.cos(a)*R,y=e.y+Math.sin(a)*R,z=4+Math.sin(u*Math.PI)*(5+i%4*4);g.fx([[x-1.5,y,z],[x,y-1.2,z+3],[x+1.5,y,z],[x,y+1,z-2]],i%2?'#bcb79b':'#858b78',(1-u)*.8);}return;
    }
    if(e.type==='wightPalm'&&age<.35){
      const f=[-Math.sin(e.angle),Math.cos(e.angle)],x=e.x+f[0]*35,y=e.y+f[1]*35;
      g.arc(x,y,36,3+age*30,0,TAU,1-age/.35,'#c2b78e',1.5);return;
    }
    const primary=id==='payne'?'#c6ccdc':id==='spider'?'#e5ddd2':id==='wukong'?'#d5bb77':id==='siege'?'#b4cfdf':id==='fable'?'#bdc9e5':id==='kombat'?'#e6b16d':'#e3c8a1';
    if(e.type==='shot'&&e.travel){
      const dir=g.norm(g.sub(e.to,e.from)),side=g.norm([-dir[1],dir[0],0]);
      if(age<.08)g.fx([e.from,g.vec(e.from,g.mul(side,1.2)),g.vec(e.from,g.mul(dir,7)),g.sub(e.from,g.mul(side,1.2))],e.enemy?'#d7a890':'#f3dca3',1-age/.08);
      if(age<=e.travel){
        const head=g.lerp3(e.from,e.to,clamp(age/e.travel)),tail=g.lerp3(e.from,e.to,clamp((age-.026)/e.travel));
        g.fx([tail,g.vec(tail,g.mul(side,.35)),g.vec(head,g.mul(side,.35)),head],e.enemy?'#d6aaa0':'#f2d4a3',.88);
        g.fx([g.vec(head,g.mul(dir,1.8)),g.vec(head,g.mul(side,.75)),g.sub(head,g.mul(dir,1.8)),g.sub(head,g.mul(side,.75))],'#f5e4c2',.98);
      }return;
    }
    if(e.type==='shot'&&age<.12){
      const dir=g.norm(g.sub(e.to,e.from)),side=g.norm([-dir[1],dir[0],0]);g.fx([e.from,g.vec(e.from,g.mul(side,1.1)),g.vec(e.from,g.mul(dir,8)),g.sub(e.from,g.mul(side,1.1))],e.enemy?'#d7a890':'#f3dca3',1-age/.12);
      const end=g.lerp3(e.from,e.to,clamp(age/.035));g.fx([e.from,g.vec(e.from,g.mul(side,.25)),end,g.sub(end,g.mul(side,.25))],e.enemy?'#c9a69a':'#f0d7a6',(1-age/.12)*.8);return;
    }
    if(['focus','rage'].includes(e.type))return;
    if(e.type==='lightning'&&age<.45){
      const end=[e.x,e.y,38],pts=Array.from({length:9},(_,i)=>{const p=g.lerp3(e.from,end,i/8);p[2]+=Math.sin(i*7.1)*4;return p;});
      for(let i=0;i<8;i++)g.fx([pts[i],g.vec(pts[i],[.4,.4,.5]),pts[i+1],g.vec(pts[i+1],[-.4,-.4,-.5])],'#c6dff0',1-age/.45);return;
    }
    if(['blast','flash','smash','weave','breach','portal'].includes(e.type)&&age<.8){
      const fire=['blast','portal','weave'].includes(e.type),R=(e.type==='flash'?65:e.type==='weave'?98:58)*u;
      g.arc(e.x,e.y,4,5+R,0,TAU,(1-u)*.65,fire?'#e2b071':primary,2.5*(1-u)+.6);
      for(let i=0;i<16;i++){const a=i*2.4,r=(7+i%4*7)*u,x=e.x+Math.cos(a)*r,y=e.y+Math.sin(a)*r,z=4+Math.sin(u*Math.PI)*(e.type==='portal'?50:23),w=(1-u)*3;
        g.fx([[x-w,y,z],[x,y-w,z+7*(1-u)],[x+w,y,z],[x,y+w,z-2]],fire?(i%2?'#efc179':'#cc9663'):primary,(1-u)*.8);}
      return;
    }
    if(e.type==='splinters'&&age<.8){for(let i=0;i<23;i++){const a=i*2.4,R=u*(8+i%5*7),x=e.x+Math.cos(a)*R,y=e.y+Math.sin(a)*R,z=5+Math.sin(u*Math.PI)*(10+i%3*7);g.fx([[x,y,z],[x+4*Math.cos(a),y+4*Math.sin(a),z+2],[x+1,y+1,z-1]],i%2?'#d5be8f':'#a99470',1-u);}return;}
    if(age<.45){for(let i=0;i<9;i++){const a=i*2.4,R=(5+i%4*5)*u,x=e.x+Math.cos(a)*R,y=e.y+Math.sin(a)*R,z=37+Math.sin(u*Math.PI)*5;g.fx([[x,y,z],[x+Math.cos(a)*3,y+Math.sin(a)*3,z+2],[x+1,y,z-1]],e.type==='hurt'?'#c69386':e.type==='firehit'?'#e5ac66':primary,1-age/.45);}}
  }
  window.LegendCharacters={draw,projectile,ambient,event,palettes};
})();
