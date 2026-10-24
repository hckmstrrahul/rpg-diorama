/* Character meshes and effects use the same fixed-length IK skeleton as Kratos. */
(() => {
  'use strict';
  const palettes={
    tsushima:{skin:'#c0a080',cloth:'#354751',trim:'#9d4e3d',metal:'#727d79',hair:'#34352f',enemy:['#78604b','#79744e']},
    arkham:{skin:'#c4ac93',cloth:'#59646b',trim:'#b39e63',metal:'#3a4f5d',hair:'#2a3e4b',enemy:['#6b617c','#61786b']},
    assassin:{skin:'#c2a68d',cloth:'#e4e0cf',trim:'#9d493e',metal:'#807970',hair:'#544638',enemy:['#8b4e45','#7a6560']},
    persia:{skin:'#b99a75',cloth:'#d9cfb7',trim:'#a75542',metal:'#b49b63',hair:'#443c33',enemy:['#8e9b8c','#b29971']}
  };
  function blade(T,kind,g){
    const {limb,solidBox,face}=g;
    if(kind==='fist')return;
    if(kind==='club'){limb(T,[0,0,-3],[0,0,27],1.2,2,['#82796a','#665f56','#a09683'],6);return;}
    const gold=kind==='scimitar',katana=kind==='katana';
    limb(T,[0,0,-5],[0,0,4],.8,.8,[gold?'#a9894c':'#514735','#72654d','#9d8a61'],6);
    for(let z=-4.5;z<3;z+=1.4)limb(T,[0,0,z],[0,0,z+.45],.86,.86,[katana?'#b7aa86':'#b49d6a','#807154','#cfb681'],6);
    solidBox(T,-(katana?2.1:3),-.8,3.8,katana?4.2:6,1.6,1.2,[gold?'#d4b676':'#b6b4a0','#8d8467']);
    const shape=gold?[[-1.3,5],[1.3,5],[2.2,19],[6,29],[3.6,31],[-.6,22]]:katana?[[-.8,5],[.8,5],[1.4,25],[2.8,32],[.5,30],[-.8,24]]:[[-1.4,5],[1.4,5],[1.3,26],[0,32],[-1.3,26]];
    face(shape.map(([y,z])=>T([.35,y,z])),gold?'#b9cfca':'#a9b9b5');face(shape.map(([y,z])=>T([-.35,y,z])),gold?'#e4dfb6':'#e0e3d6');
    face([[.4,shape[1][0],5],[.4,shape[2][0],shape[2][1]],[.4,shape[3][0],shape[3][1]],[-.4,shape[3][0],shape[3][1]],[-.4,shape[2][0],shape[2][1]]].map(T),'#f2ecda');
    if(katana)for(const side of [-1,1])face([[side*.39,-.45,7],[side*.39,-.3,24],[side*.39,.7,29],[side*.39,.1,24]].map(T),'#7f9ca2');
    if(gold)for(const side of [-1,1])face([[side*.4,-.1,6],[side*.4,.5,15],[side*.4,1.4,19],[side*.4,.9,15]].map(T),'#d5b775');
  }
  function drawCharacter(r,g,id){
    const {P,C,H,legs,arms,feet,angle,q,t}=r,{loft,muscle,face,lit,solidBox,vec,rotZ,lerp3}=g;
    const hero=r.id===0,p=palettes[id],bat=id==='arkham'&&hero,assassin=id==='assassin'&&hero,samurai=id==='tsushima',prince=id==='persia'&&hero;
    const cloth=hero?p.cloth:p.enemy[r.id-1],skin=hero?p.skin:id==='arkham'?'#c5b9a2':id==='persia'?'#bbb598':'#b99e82',leather=bat?'#222d34':prince?'#494337':'#5a4c3d',ref=rotZ([0,1,.08],angle);
    // Cloth legs and rigid boots follow the solved ankles.
    legs.forEach((b,i)=>{
      muscle(b.a,b.b,[[0,samurai?3.9:3.3],[.45,samurai?4.0:3.4],[1,2.3]],bat?cloth:hero?p.cloth:cloth,ref,8);
      muscle(b.b,b.end,[[0,2.45],[.35,2.5],[1,1.5]],bat||prince?leather:samurai?'#535b54':cloth,ref,8);
      const f=feet[i],F=v=>vec(f.point,rotZ([v[0],v[1],v[2]-3],f.angle));
      loft(F,[[0,1,0,2,3.7],[0,.7,1.5,2.2,3.8],[0,-.1,4.5,1.7,2.3],[0,-.2,7,1.4,1.5]],leather,8);
      if(!bat&&!prince)for(const u of [.42,.62,.82])muscle(lerp3(b.b,b.end,u),lerp3(b.b,b.end,u+.06),[[0,2.6-u],[1,2.5-u]],samurai?'#a6a28a':'#8d8066',ref,6);
    });
    loft(P,[[0,0,23,5.4,3.6],[0,0,28,6.1,4],[0,0,30,5.7,3.6]],cloth,10);
    loft(C,[[0,0,28.5,5,3.3],[0,0,33,5.4,3.4],[0,0,35,6.1,3.63],[0,0,37,6.9,3.87],[0,0,39,7.6,4.1],[0,0,41.2,7.8,3.86],[0,0,43.5,8,3.6],[0,0,46,3.2,2.3]],prince?skin:cloth,10);
    muscle(C([0,0,44.5]),H([0,0,50]),[[0,2.5],[1,2]],bat?leather:skin,ref,8);
    loft(H,[[0,.1,49.6,2.1,2],[0,.3,51.5,2.8,2.7],[0,.1,54,3.4,3.1],[0,-.1,55.3,3.3,3.05]],skin,12);
    const cap=bat?leather:assassin?'#e1dfce':hero?p.hair:samurai?p.metal:id==='persia'?cloth:id==='arkham'?'#605546':'#8f8b7c';
    loft(H,[[0,-.1,55.2,3.4,3.1],[0,-.1,57.2,3.1,2.9],[0,-.1,58.8,1.8,1.8],[0,-.1,59.2,.1,.1]],cap,12);
    // Readable brows, eyes, nose and jaw at miniature scale.
    for(const side of [-1,1]){
      face([[side*.7,3.3,54.3],[side*2.5,2.8,54.2],[side*2.4,2.95,53.8],[side*.8,3.4,53.9]].map(H),p.hair);
      face([[side*.8,3.42,53.7],[side*2.0,3.1,53.7],[side*2.0,3.12,53.3],[side*.8,3.44,53.3]].map(H),bat?'#e2e8d8':!hero&&id==='persia'?'#e8bc68':'#403c34');
    }
    lit([[-.65,3.1,54],[.65,3.1,54],[.65,4.1,52.5],[0,4.2,52.2],[-.65,4.1,52.5]].map(H),skin);
    arms.forEach((b,i)=>{
      const bare=prince||(!hero&&id==='arkham'),sleeve=bat?cloth:bare?skin:cloth;
      muscle(b.a,b.b,[[0,3.4],[.35,3.55],[1,1.9]],sleeve,ref,8);
      muscle(b.b,b.end,[[0,2.1],[.3,2.4],[1,1.4]],bare?skin:sleeve,ref,8);
      muscle(lerp3(b.b,b.end,.45),lerp3(b.b,b.end,.98),[[0,2.6],[1,1.8]],leather,ref,8);
      const W=v=>vec(b.end,rotZ(v,angle+q.hip+q.twist));loft(W,[[0,0,-1.2,1.5,1.6],[0,.3,1,1.8,1.8],[0,.3,2,1.3,1.3]],bat?leather:skin,6);
      if(bat)for(const u of [.5,.7,.9]){const a=lerp3(b.b,b.end,u);face([vec(a,rotZ([2,0,0],angle)),vec(a,rotZ([5,-1,3],angle)),vec(a,rotZ([2,0,3],angle))],leather);}
    });
    // Waist, buckles and outfit-specific silhouettes.
    loft(P,[[0,0,27.5,6.3,4.1],[0,0,29.5,6.2,4.1]],hero?p.trim:'#786248',12);
    solidBox(P,-1.5,4,27.4,3,.7,2.3,['#c6b17e','#93845c']);
    if(bat){
      // A sculpted graphite cowl: solid ears, brow ridge, cheek guards and jaw opening.
      loft(H,[[0,-.45,50.1,2.5,2.35],[0,-.45,52.5,3.3,2.9],[0,-.35,55.5,3.55,3.2],[0,-.4,57.6,3.2,2.95],[0,-.5,59.3,2.3,2.2],[0,-.5,59.9,.8,.9]],leather,16);
      for(const side of [-1,1]){
        const a=[side*2.5,-.8,57],b=[side*3.1,-1.2,64.5],c=[side*1.8,.8,58],d=[side*3.3,.2,57.8];
        face([a,b,c].map(H),'#34434d');face([b,d,c].map(H),'#1b252b');face([a,d,b].map(H),'#52616a');
        face([[side*.5,3.13,55.8],[side*2.8,2.5,55.7],[side*3.05,2.5,54.8],[side*.65,3.5,54.5]].map(H),'#41515b');
        face([[side*.65,3.48,54.6],[side*2.6,2.96,55],[side*2.45,3.07,54.3],[side*.8,3.53,54.1]].map(H),'#111d24');
        face([[side*.85,3.56,54.45],[side*2.28,3.2,54.69],[side*2.13,3.27,54.42],[side*1,3.58,54.22]].map(H),'#d2d8ce');
        face([[side*1.5,3.43,54.57],[side*1.75,3.38,54.62],[side*1.75,3.4,54.36],[side*1.5,3.45,54.32]].map(H),'#516367');
        face([[side*2.8,2.6,54.4],[side*3.15,2.45,52.1],[side*2.05,3.13,50.8],[side*2.15,3.4,53.2]].map(H),'#293840');
      }
      face([[-.65,3.4,55.1],[.65,3.4,55.1],[.75,4.2,53],[0,4.52,52.7],[-.75,4.2,53]].map(H),'#34444d');
      face([[0,3.6,55.1],[.65,3.4,55.1],[.75,4.2,53],[0,4.52,52.7]].map(H),'#1d2a32');
      // Mouth and broad chin remain exposed, with subtle stubble and cheek planes.
      face([[-2.05,3.23,52.7],[-.65,3.88,52.4],[.65,3.88,52.4],[2.05,3.23,52.7],[1.85,3.3,50.5],[.9,3.55,49.8],[-.9,3.55,49.8],[-1.85,3.3,50.5]].map(H),'#c0aa92');
      face([[-1.85,3.32,51.4],[1.85,3.32,51.4],[1.5,3.45,50.35],[.75,3.62,49.95],[-.75,3.62,49.95],[-1.5,3.45,50.35]].map(H),'#9c9181');
      face([[-1.35,3.69,51.65],[0,3.91,51.52],[1.35,3.69,51.65],[1.1,3.73,51.34],[0,3.94,51.3],[-1.1,3.73,51.34]].map(H),'#6b655d');
      face([[-.95,3.73,50.7],[.95,3.73,50.7],[.65,3.79,50.35],[-.65,3.79,50.35]].map(H),'#c8b59e');
      // Curved pectorals and articulated plates sit on a darker flexible undersuit.
      for(const side of [-1,1]){
        loft(C,[[side*3.35,3.2,37.6,2.3,.8],[side*3.5,3.65,39.4,3.3,1.45],[side*3.6,3.25,42.2,3.25,1.3],[side*3.25,2.8,43.5,2.4,.7]],'#626f77',12);
        for(let j=0;j<3;j++)loft(C,[[side*1.8,3.15,30.8+j*2.3,1.55,.75],[side*1.8,3.5,32.3+j*2.3,1.6,.9],[side*1.8,3.15,32.7+j*2.3,1.35,.65]],j%2?'#47565f':'#52616a',8);
        const arm=arms[side<0?1:0];muscle(arm.a,lerp3(arm.a,arm.b,.42),[[0,3.2],[.35,4.1],[.8,3.8],[1,2.9]],'#495961',ref,12);
        const leg=legs[side<0?0:1];muscle(lerp3(leg.a,leg.b,.35),lerp3(leg.a,leg.b,.83),[[0,3.45],[.7,3],[1,2.6]],'#52616a',ref,10);
        muscle(lerp3(leg.a,leg.b,.92),lerp3(leg.b,leg.end,.15),[[0,2.7],[.4,3],[1,2.25]],'#2e3d46',ref,10);
        for(let j=0;j<4;j++)face([[side*5.2,3,32+j*1.3],[side*5.65,2.7,32+j*1.3],[side*6.25,2.7,33+j*1.3],[side*5.8,3,33+j*1.3]].map(C),'#34444c');
      }
      // The emblem is proud of the chest plates, so it cannot disappear inside them.
      face([[-6.5,5.15,41.2],[-4,5.8,41.9],[-2.1,5.9,40.7],[-.8,6,42],[0,6,41],[.8,6,42],[2.1,5.9,40.7],[4,5.8,41.9],[6.5,5.15,41.2],[4.3,5.9,39],[2.6,6,39.8],[1.4,6.1,38.6],[0,6.2,37.5],[-1.4,6.1,38.6],[-2.6,6,39.8],[-4.3,5.9,39]].map(C),'#18262e');
      for(let i=-2;i<=2;i++){
        const x=i*2.55;solidBox(P,x-1,3.65,27,2,1.5,3,['#baa16b','#887348','#a18b58']);
        solidBox(P,x-.8,5.18,28.8,1.6,.22,.55,['#c4ad7e','#9c875a']);
      }
      solidBox(P,-1.2,5.35,27.55,2.4,.5,1.8,['#d2bc89','#a48b53']);
      // A continuous, scalloped cape, attached at the shoulders with broad fabric folds.
      const cape=(u,v)=>{
        const ripple=Math.sin(t*3.3+u*3)*v*v*.65,trail=Math.min(7,r.base.speed*.055)*v*v;
        const hem=(1-Math.cos(u*Math.PI*6))*1.6*v*v*v;
        const x=u*(8.1+v*6),y=-4.7-v*5-trail+ripple-Math.cos(u*Math.PI*6)*v*.7,z=45-v*37+hem;
        return v<.3?C([x,y,z]):P([x,y,z]);
      };
      const shades=['#202f39','#273843','#2c3e49','#25353f','#1e2c35','#263741'];
      for(let i=0;i<24;i++)for(let j=0;j<10;j++){const a=-1+i/12,b=a+1/12,v=j/10,V=(j+1)/10;face([cape(a,v),cape(b,v),cape(b,V),cape(a,V)],shades[i%6]);}
    }else if(assassin){
      // Beaked hood, open face, red sash and split white coat tails.
      loft(H,[[0,-.9,50,4.2,3.6],[0,-.6,55,4.0,3.6],[0,-.3,58.5,3.2,3],[0,-.2,60,1.2,1.5]],'#e1dfce',10);
      face([[-2.1,3.25,55.4],[2.1,3.25,55.4],[2.1,3.3,51.6],[0,3.8,50.7],[-2.1,3.3,51.6]].map(H),'#b49e83');
      face([[-2.5,3.3,57.2],[2.5,3.3,57.2],[0,5.0,55.2]].map(H),'#f1eedc');
      face([[-6.8,3,44],[-4.5,4,43.5],[4.4,4,29],[2,4.5,29]].map(C),'#73614e');
      for(const side of [-1,1])face([[side*.7,4,27],[side*6,3.8,27],[side*7.5,4,13],[side*2,5,16]].map(P),side===1?'#e6e0cc':'#cac7b7');
      face([[-2,4.4,29],[2,4.4,29],[3,5,17],[-1.4,5.2,14]].map(P),'#9e4c40');
      face([C([-8,-2,44]),C([-3,-4,43]),P([-3,-6,19]),P([-11,-6,20])],'#994e43');
      // Brocade seams, a fitted collar, leather harness and the engraved bracer.
      loft(C,[[0,-.2,44.5,3.7,2.7],[0,-.3,48.4,2.7,2.3]],'#ddd9c7',10);
      for(const side of [-1,1]){
        face([[side*6.5,3,43.7],[side*4,4.3,43],[side*1.5,4,33],[side*3.2,4.1,34]].map(C),'#c1bca8');
        face([[side*4,4.4,42],[side*3.6,4.5,41.6],[side*1.4,4.1,33.6],[side*1.8,4.2,33.4]].map(C),'#b5a374');
        face([[side*.9,4.5,25.5],[side*5.5,4.4,25.5],[side*6.7,4.5,14.7],[side*5.9,4.7,15],[side*4.9,4.7,24.5],[side*.9,4.8,24.5]].map(P),'#b6a77c');
      }
      face([[-6.4,-3.7,44],[-4.8,-4.1,44],[4,-4.5,29],[2.3,-4.6,29]].map(C),'#756451');
      for(let i=0;i<3;i++)solidBox(P,2.2+i*1.5,-4.5,27,1.2,1,2,['#a9946d','#705d47']);
      face([[-1.9,4.8,28],[-.7,4.8,30],[0,4.8,29],[.7,4.8,30],[1.9,4.8,28],[.8,4.8,27.5],[0,4.8,29],[-.8,4.8,27.5]].map(P),'#c6c2a7');
    }else if(samurai){
      loft(H,[[0,-.5,55,3.5,3.1],[0,-.5,57.8,2.8,2.7],[0,-.8,58.8,1.8,1.7]],p.hair,10);
      if(hero){loft(H,[[0,-1,58,1.2,1.2],[0,-1.8,61,1.6,1.4]],p.hair,8);face([[-3.1,1.8,55.3],[3.1,1.8,55.3],[3.0,2.4,56],[-3,2.4,56]].map(H),'#aba68d');}
      else{loft(H,[[0,0,55,4,3.6],[0,0,58,3,3],[0,0,60,1.4,1.6]],p.metal,10);}
      for(let row=0;row<4;row++)for(let col=-2;col<=2;col++){const x=col*2.5,z=32+row*2.6;solidBox(C,x-1.1,3.6,z,2.2,1.1,2.2,[hero?'#53616a':'#93856a',hero?'#30444d':'#6e6652']);}
      for(const side of [-1,1]){
        for(let j=0;j<3;j++)face([[side*5.7,3.8,27-j*2.7],[side*.8,4.5,27-j*2.7],[side*.8,5,24.8-j*2.7],[side*7,4.2,24.8-j*2.7]].map(P),hero?'#364a53':'#77674d');
        loft(C,[[side*8,0,42,4.5,4],[side*8.8,0,45,3.8,3.5]],hero?'#3c4f57':'#827157',8);
      }
      for(const x of [-4,0,4])face([[x-.4,4.9,32],[x+.4,4.9,32],[x+.4,4.7,42],[x-.4,4.7,42]].map(C),hero?'#a66850':'#b3a076');
      // Lacquered back plates, laced shoulder scales and a raised kimono collar.
      loft(C,[[0,-.3,43.6,3.8,2.8],[0,-.3,48.5,2.5,2.3]],hero?'#304650':'#655c48',10);
      for(let row=0;row<5;row++){
        const z=31+row*2.3,w=5+row*.3;
        face([[-w,-3.6,z],[w,-3.6,z],[w+.25,-4.1,z+1.7],[-w-.25,-4.1,z+1.7]].map(C),row%2?'#30434b':'#4c6065');
        for(const x of [-3.5,0,3.5])face([[x-.3,-4.25,z],[x+.3,-4.25,z],[x+.3,-4.25,z+1.6],[x-.3,-4.25,z+1.6]].map(C),hero?'#b89d6c':'#aa9570');
      }
      for(const side of [-1,1])for(let j=0;j<4;j++){
        const x=side*(7+j*.55),z=44-j*1.4;face([[x-side*1.9,-3.9,z],[x+side*2,-3.9,z],[x+side*2.4,3.9,z-.3],[x-side*1.7,3.9,z-.3]].map(C),hero?(j%2?'#354b54':'#52666a'):'#8e7c5c');
        for(const y of [-2,1.8])solidBox(C,x-.25,y,z+.1,.5,1,.45,['#c0a576','#9a6d4a']);
      }
      if(hero){
        face([[-2,-4.35,38],[0,-4.5,40],[2,-4.35,38],[0,-4.5,36]].map(C),'#c5b88e');
        face([[-1.1,-4.55,38],[0,-4.65,39.1],[1.1,-4.55,38],[0,-4.65,36.9]].map(C),'#324952');
        face([[2.3,-2.9,56],[3.4,-3.3,55.5],[4+Math.sin(t*3)*.8,-7,53],[3,-8,53.5]].map(H),'#bbb08a');
      }
      // Black lacquer saya at the left hip.
      g.limb(P,[-5,-1,28],[-8,-15,11],1,1,['#3c403b','#666957'],6);
    }else if(prince){
      loft(H,[[0,-1.9,49.4,3.4,2],[0,-.7,55.5,3.7,3.2],[0,-.7,58.1,2.8,2.6]],p.hair,10);
      face([[-2.4,3.2,56.8],[2.5,3.2,56.8],[1,3.5,54.8],[-2.1,3.6,54.6]].map(H),p.hair);
      for(const side of [-1,1])face([[side*2,4,29],[side*6,3.5,31],[side*8,2.2,44],[side*4,3.5,45]].map(C),'#3b7982');
      // Blue brocade continues around the back; bare chest and split vest stay readable.
      for(const side of [-1,1]){
        face([[side*.4,-3.7,29],[side*5.3,-3.9,30],[side*7.8,-3.1,43.4],[side*3.5,-3.7,45],[side*.5,-3.8,39]].map(C),'#326c79');
        face([[side*2,4.15,29],[side*2.5,4.2,29],[side*4.4,3.7,44.7],[side*4,3.8,45]].map(C),'#bf9e62');
        loft(C,[[side*3.3,3,37.8,2.8,1],[side*3.4,3.3,40,3.0,1.4],[side*3.4,2.7,42.5,2.8,.9]],skin,8);
      }
      face([[-5,-3.9,43],[-3.6,-4.1,43],[4.3,-4.1,29],[2.8,-4.3,29]].map(C),'#7d6345');
      for(let j=0;j<4;j++)face([[-1.4,4.25,28+j*.5],[1.8,4.25,28+j*.5],[1.8,4.5,28.3+j*.5],[-1.4,4.5,28.3+j*.5]].map(P),'#cc9870');
      face([[-2.3,4.3,28],[2.5,4.3,28],[4+Math.sin(t*3),5,16],[-1,5,14]].map(P),'#ab5e47');
      g.limb(P,[-5,1,29],[-7,3,19],.8,.6,['#ddc385','#a9915e'],6);
    }else if(id==='persia'){
      loft(H,[[0,0,55,4,3.7],[0,0,58,3.8,3.4],[0,0,60,1.7,2]],cloth,10);
      for(const side of [-1,1])loft(C,[[side*7.8,0,42,3.7,3.7],[side*8,0,45,3.2,3]],'#b19b70',8);
      face([[-5.3,4,41],[5.3,4,41],[4,4.5,33],[-4,4.5,33]].map(C),'#baaa7e');
    }else if(id==='arkham'){
      loft(H,[[0,-.6,55,3.5,3.2],[0,-.4,58,2.4,2.3]],r.id===1?'#71826a':'#605546',10);
      face([[-2.6,3,53],[2.6,3,53],[2.2,3.3,50],[-2.2,3.3,50]].map(H),'#b8b2a2');
    }else{
      loft(H,[[0,0,55,3.8,3.5],[0,0,58,3.5,3.2],[0,0,60,1.3,1.5]],'#8f8b7c',10);
      face([[-5,4,41],[5,4,41],[4.5,4.5,32],[-4.5,4.5,32]].map(C),'#9d8d79');
    }
    if(r.live?.weaponVisible!==false)blade(r.weapon,hero?(id==='tsushima'?'katana':id==='arkham'?'fist':id==='persia'?'scimitar':'sword'):(id==='arkham'?'club':id==='persia'?'scimitar':'sword'),g);
    if(hero&&r.live?.action==='special'&&(assassin||prince)){
      face([[-.8,0,0],[.8,0,0],[.6,0,5],[0,0,8],[-.6,0,5]].map(r.weapon),prince?'#eed18d':'#d4dfd7');
      if(prince)face([[-1,0,-3],[1,0,-3],[1,0,0],[-1,0,0]].map(r.weapon),'#b29658');
    }
    if(bat&&r.live?.grapnel){
      const {target,extension,tension}=r.live.grapnel,hand=arms[0].end,dir=g.norm(g.sub(target,hand)),side=g.norm([-dir[1],dir[0],0]);
      const up=[-side[1]*dir[2],side[0]*dir[2],side[1]*dir[0]-side[0]*dir[1]],T=v=>vec(hand,vec(g.mul(side,v[0]),vec(g.mul(up,v[1]),g.mul(dir,v[2]))));
      solidBox(T,-1,-1,-1,2,2,5,['#75909a','#334d5c','#4d6875']);solidBox(T,-.65,-2.5,-.5,1.3,2.2,1.4,['#4a6470','#293f4b']);
      const origin=T([0,0,4]),tip=lerp3(origin,target,extension),point=u=>{const p=lerp3(origin,tip,u);p[2]-=Math.sin(u*Math.PI)*(1-tension)*3;return p;};
      for(let i=0;i<12;i++){
        const a=point(i/12),b=point((i+1)/12),edge=g.mul(side,.24);
        face([vec(a,edge),vec(b,edge),g.sub(b,edge),g.sub(a,edge)],i%2?'#9bb1b6':'#617f8d');
      }
      // A small hooked head remains visible at the extending end of the cable.
      for(const s of [-1,1])face([tip,vec(tip,vec(g.mul(side,s*1.8),g.mul(dir,-2.8))),vec(tip,g.mul(dir,-1.3))],'#bdcac5');
    }
  }
  function projectile(f,g,id){
    if(id==='arkham'){
      const T=f.transform;g.face([[-9,0,0],[-4,-2,0],[-1,-1,0],[0,-3,0],[1,-1,0],[4,-2,0],[9,0,0],[4,3,0],[2,1,0],[0,2,0],[-2,1,0],[-4,3,0]].map(T),'#7e9dac');
    }else for(const bolt of f.bolts||[]){
      const dir=g.norm(g.sub(bolt.target,bolt.from)),side=g.norm([-dir[1],dir[0],0]),v=bolt.position;
      g.face([g.vec(v,g.mul(dir,6)),g.vec(v,g.mul(side,1.5)),g.sub(v,g.mul(dir,5)),g.sub(v,g.mul(side,1.5))],id==='persia'?'#e8ce88':'#ccd5ce');
      g.fx([g.sub(v,g.mul(dir,12)),g.vec(v,g.mul(side,.6)),g.sub(v,g.mul(dir,2)),g.sub(v,g.mul(side,.6))],id==='persia'?'#e0bb78':'#d9dccf',.45);
    }
  }
  function ambient(t,g,id){
    for(let i=0;i<26;i++){
      const phase=(t/(id==='arkham'?1.2:12)+i*.381)%1,X=Math.sin(i*13.4)*166+phase*18,Y=Math.cos(i*7.7)*151,Z=(1-phase)*115+5;
      if(id==='arkham')g.fx([[X,Y,Z],[X+1,Y,Z],[X+4,Y+1,Z-9],[X+3,Y+1,Z-9]],'#a1bbc3',.10+Math.sin(phase*Math.PI)*.12);
      else{const s=id==='tsushima'?1.6:.55,w=Math.sin(t*2+i)*s;g.fx([[X-s,Y,Z],[X,Y-w,Z+s],[X+s,Y,Z],[X,Y+w,Z-s]],id==='tsushima'?['#bb6e45','#ce9458','#a44e3c'][i%3]:id==='persia'?'#e6cc9b':'#d6c5a4',Math.sin(phase*Math.PI)*.7);}
    }
  }
  function event(e,t,g,id){
    const age=t-e.time;if(age<0||age>1.5)return;
    const colors={tsushima:'#e4c390',arkham:'#9bb4bd',assassin:'#dbc7a1',persia:'#e4bd70'},color=colors[id];
    if(e.type==='special'){
      if(id==='arkham'){
        if(age>.28)return;
        const u=age/.28;
        for(let i=0;i<7;i++){const a=i*Math.PI*2/7,r=3+u*14,x=e.x+Math.cos(a)*r,y=e.y+Math.sin(a)*r,z=39+Math.sin(a*2)*3;g.fx([[x,y,z],[x+Math.cos(a)*3,y+Math.sin(a)*3,z+2],[x-Math.sin(a)*.7,y+Math.cos(a)*.7,z]],i%2?'#d8d6b7':'#a5c1c7',(1-u)*.85);}
      }
      else if(id==='persia'){for(let j=0;j<3;j++)g.arc(e.x,e.y,5+j*5,10+age*(35+j*8),0,Math.PI*2,(1-age/1.5)*.4,color,2);}
      else g.arc(e.x,e.y,29,12+age*35,-.3,Math.PI*1.5,(1-age/1.5)*.4,color,2);
    }else if(age<.5){
      for(let i=0;i<10;i++){const a=i*2.4,r=(5+i%4*4)*age/.5,z=33+Math.sin(age/.5*Math.PI)*8;const x=e.x+Math.cos(a)*r,y=e.y+Math.sin(a)*r;g.fx([[x-1,y,z],[x,y,z+3],[x+1,y,z],[x,y,z-1]],e.type==='hurt'?'#c08b76':color,1-age/.5);}
    }
  }
  window.WorldCharacters={draw:drawCharacter,projectile,ambient,event};
})();
