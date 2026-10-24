/* Eight material-rich, hand-built SVG dioramas. No external assets at runtime. */
(() => {
  'use strict';
  const E=window.WorldArt.Environment,TAU=Math.PI*2;
  const colors={
    duty:['#68767a','#7d8a89','#394a52','#556065'],payne:['#58616d','#737e86','#343d4b','#454d5a'],
    gta:['#887c7c','#b2a09a','#665f68','#766e73'],spider:['#8c7775','#baa096','#655a62','#7a6870'],
    wukong:['#858778','#a4a68d','#525e52','#6b745f'],siege:['#8a8c85','#b0b0a1','#575f62','#707875'],
    fable:['#a19b88','#c6bda3','#777868','#8f917b'],kombat:['#79706c','#a7947e','#49454a','#635b59']
  };
  function depth(e,draw){
    // Local painter sorting keeps wheels, curved tanks and overlapping foliage solid.
    const back=e.back,group=e.node('g',{},back),poly=e.poly,line=e.line,faces=[];
    e.back=group;
    const record=(fn,points,args)=>{const n=fn.call(e,points,...args);faces.push({n,z:points.reduce((s,p)=>s+p[0]+p[1]+p[2],0)/points.length});return n;};
    e.poly=(points,...args)=>record(poly,points,args);e.line=(points,...args)=>record(line,points,args);
    try{draw();}finally{e.poly=poly;e.line=line;e.back=back;}
    const nodes=faces.sort((a,b)=>a.z-b.z).map(f=>f.n);
    if(group.replaceChildren)group.replaceChildren(...nodes);else group.children=nodes;
  }
  function floor(e,id,style='stone'){
    const [mid,light,dark,shade]=colors[id];
    e.terrainEdge('roof',{top:shade,side:[dark,shade,mid,dark],chips:[light,mid,shade,'#c2b5a0'],flecks:[mid,light,shade,dark]});
    e.poly([[-175,-175,2],[175,-175,2],[175,175,2],[-175,175,2]],dark);
    if(style==='asphalt')e.poly([[-173,-173,2.6],[173,-173,2.6],[173,173,2.6],[-173,173,2.6]],mid);
    else for(let row=0,y=-173;y<172;y+=style==='wood'?10:style==='cobble'?11:25,row++)for(let x=-173;x<172;){
      const w=Math.min(style==='wood'?e.rand(40,70):style==='cobble'?e.rand(10,18):e.pick([24,34,41]),173-x),d=Math.min(style==='wood'?10:style==='cobble'?11:25,173-y);
      if(w>3){
        if(style==='wood'){
          e.poly([[x+.4,y+.4,3],[x+w-.4,y+.4,3],[x+w-.4,y+d-.4,3],[x+.4,y+d-.4,3]],e.pick([mid,shade,mid]));
          for(let j=0;j<4;j++)e.line([[x+2,y+1+j*2,3.1],[x+w*.4,y+1.4+j*2,3.1],[x+w-2,y+1+j*2,3.1]],j%2?light:dark,.4,e.back,{opacity:'.25'});
          for(const X of [x+1.8,x+w-1.8])e.disk(X,y+2,3.2,.3,.3,dark);
        }else e.slab(x+.6,y+.5,w-1.3,d-1.1,[e.pick([mid,shade,mid]),light,dark]);
      }x+=w;
    }
    for(let i=0;i<1100;i++){
      const x=e.rand(-174,174),y=e.rand(-174,174),r=e.rand(.2,1.25);
      e.poly([[x,y,3.1],[x+r,y-.2,3.1],[x+r*.8,y+.6,3.1]],e.pick([light,dark,shade]),e.back,{opacity:'.3'});
    }
    for(let i=0;i<25;i++){
      const x=e.rand(-165,155),y=e.rand(-165,155),z=3.15;
      e.line([[x,y,z],[x+3,y+5,z],[x+1,y+8,z],[x+6,y+12,z]],dark,.65,e.back,{opacity:'.6'});
    }
    if(style==='asphalt'){
      for(let i=0;i<37;i++)e.patch(e.rand(-170,170),e.rand(-168,168),3.17,e.rand(3,19),e.rand(2,10),e.pick([dark,light,shade]),e.back,12).setAttribute('opacity','.11');
      for(let i=0;i<3200;i++){const x=e.rand(-174,174),y=e.rand(-174,174),r=e.rand(.13,.65);e.poly([[x,y,3.2],[x+r,y+.1,3.2],[x+r*.4,y+r,3.2]],e.pick([light,dark]),e.back,{opacity:'.2'});}
    }
    surfaceDetails(e,id);
  }
  function surfaceDetails(e,id){
    const z=3.25;
    if(['duty','payne','gta','spider'].includes(id))for(const [x,y] of [[-99,126],[112,-103]]){
      e.box(x,y,z,23,11,.3,['#6c7c80','#3f535e','#526873']);
      for(let j=0;j<9;j++)e.line([[x+2+j*2.4,y+1,z+.5],[x+2+j*2.4,y+10,z+.5]],'#283e4a',1.2);
    }
    if(id==='gta'){
      for(const x of [-44,-32])e.line(Array.from({length:30},(_,i)=>[x+Math.sin(i*.08)*16,-125+i*8,z]),'#5a565e',1.2,e.back,{opacity:'.26'});
      e.disk(62,55,z,10,10,'#64656a');e.disk(62,55,z+.1,8.5,8.5,'#8e8b87');
      for(let j=-6;j<7;j+=3)e.line([[56,55+j,z+.2],[68,55+j,z+.2]],'#62656a',.7);
    }
    if(id==='duty'){
      for(let y=-149;y<164;y+=52)for(let x=-159;x<163;x+=58){
        e.line([[x,y,z],[x+54,y,z],[x+54,y+47,z]],'#3b515b',.6,e.back,{opacity:'.55'});
        for(const X of [x+2,x+51])for(const Y of [y+2,y+44])e.disk(X,Y,z+.1,.65,.65,'#b7b8a5');
      }
      e.line([[-173,-87,z+1],[-128,-82,z+1],[-111,-65,z+1],[-115,-37,z+1],[-137,-29,z+1],[-152,-43,z+1]],'#344b54',1.8);
    }
    if(id==='payne'){
      e.poly([[-173,-157,z],[170,-157,z],[164,-119,z],[-120,-132,z]],'#293c4e',e.back,{opacity:'.17'});
      for(let i=0;i<25;i++){const x=e.rand(-165,150),y=e.rand(-155,160);if(i%2)e.patch(x,y,z+1,4,3,'#414c5a',e.back,7);else{const n=e.poly([[x,y,z+1],[x+6,y-1,z+1],[x+7,y+5,z+1],[x+1,y+6,z+1]],'#b2b4ac');for(let j=0;j<4;j++)e.line([[x+1,y+j,z+1.1],[x+5,y+j-.5,z+1.1]],'#717f86',.3);}}
    }
    if(id==='spider')for(let i=0;i<22;i++){const x=e.rand(-170,170),y=e.rand(-165,160);e.patch(x,y,z,e.rand(2,6),e.rand(1,4),e.pick(['#af9482','#646773','#9a827b']),e.back,7).setAttribute('opacity','.35');}
    if(id==='wukong'||id==='fable'){
      for(let i=0;i<(id==='wukong'?560:200);i++){
        const x=e.rand(-179,179),y=e.rand(-179,179);if(Math.abs(x)<115&&Math.abs(y)<110&&i%6)continue;
        const s=e.rand(.6,2.4),a=e.rand(0,TAU),c=e.pick(id==='wukong'?['#b4ab7d','#9a9669','#7c895c','#c2b487']:['#c5b18a','#a2a76f','#8a985f']);
        e.poly([[x-Math.cos(a)*s,y-Math.sin(a)*s,z+.2],[x-Math.sin(a)*s*.4,y+Math.cos(a)*s*.4,z+.3],[x+Math.cos(a)*s,y+Math.sin(a)*s,z+.2],[x+Math.sin(a)*s*.4,y-Math.cos(a)*s*.4,z+.3]],c);
        if(i%4===0)e.line([[x-Math.cos(a)*s,y-Math.sin(a)*s,z+.35],[x+Math.cos(a)*s,y+Math.sin(a)*s,z+.35]],'#d0c496',.3);
      }
    }
    if(id==='kombat'){
      for(let i=0;i<36;i++){const a=i*TAU/36;e.line([[Math.cos(a)*115,Math.sin(a)*115,z+.1],[Math.cos(a)*133,Math.sin(a)*133,z+.1]],'#342f34',.55,e.back,{opacity:'.5'});}
      for(const [x,y] of [[-151,-57],[149,-56],[-145,130],[146,130]])e.patch(x,y,z,27,24,'#4a4141',e.back,21).setAttribute('opacity','.23');
    }
  }
  function debris(e,id,count=60){const c=colors[id];for(let i=0;i<count;i++){
    const x=e.rand(-180,180),y=e.rand(-175,177);if(Math.abs(x)<127&&Math.abs(y)<125)continue;
    if(i%4===0)e.rock(x,y,e.rand(1,4),e.rand(3.5,7),[c[1],c[0],c[2]]);else e.patch(x,y,3.2,e.rand(1,4),e.rand(.5,2),e.pick(c),e.back,5);
  }}
  function puddles(e,count,color){for(let i=0;i<count;i++){
    const x=e.rand(-150,155),y=e.rand(-148,155),rx=e.rand(8,23),ry=e.rand(3,10);
    e.patch(x,y,3.3,rx,ry,color,e.back,18).setAttribute('opacity','.38');
    for(let j=0;j<3;j++)e.line([[x-rx*.55,y+j*1.5,3.4],[x+rx*.65,y+j*1.5,3.4]],'#bac3bc',.5,e.back,{opacity:'.3'});
  }}
  function crate(e,x,y,w=22,z=3,c=['#a38b68','#6c604e','#827257']){
    e.box(x,y,z,w,w*.8,w*.65,c);for(let i=1;i<4;i++)e.line([[x,y+w*.8,z+i*w*.16],[x+w,y+w*.8,z+i*w*.16]],c[2],.7);
    for(const dx of [2,w-4])e.box(x+dx,y+w*.8,z,2,1,w*.65,[c[0],c[2],c[1]]);
    e.line([[x+2,y+w*.8+1,z+2],[x+w-3,y+w*.8+1,z+w*.6]],c[0],2);
  }
  function barrel(e,x,y,c=['#6e8585','#445d64','#8c9b92'],s=1){
    e.lathe(x,y,3,[[0,7*s],[2*s,8*s],[19*s,8*s],[21*s,7*s]],c);
    for(const h of [5,16])e.lathe(x,y,3,[[h*s,8.3*s],[(h+1)*s,8.3*s]],[c[2],c[1],c[0]]);
    e.disk(x+2*s,y,24*s,1.2*s,1.2*s,c[1]);
  }
  function lamp(e,x,y,h=94){
    e.shadow(x+10,y+5,10,7,.17);e.box(x-3,y-3,3,6,6,4,['#77848a','#47565d','#56676d']);
    e.cylinder(x,y,7,1.5,h-7,['#72858d','#3e515c','#52636c'],e.back,8);e.tube([x,y,h],[x+14,y,h],1,1,['#697a82','#a8ada1']);
    e.box(x+7,y-5,h-3,14,10,3,['#87969a','#c8c9ac','#52636b']);
    e.poly([[x+7,y-5,h-3],[x+21,y-5,h-3],[x+21,y+5,h-3],[x+7,y+5,h-3]],'#efe3b5');
    e.patch(x+17,y+5,3.3,26,20,'#e2cd91').setAttribute('opacity','.11');
  }
  function brickWall(e,x,y,w,h,c){
    e.box(x,y,3,w,9,h,c);e.masonry(x,y+9.1,3,w,h,[c[1],c[2],c[1],c[0]],e.back,6,13);
    e.box(x-2,y-2,h+3,w+4,13,3,[c[0],c[1],c[2]]);
    for(let i=0;i<35;i++){const X=x+e.rand(2,w-2),Z=e.rand(5,h);e.line([[X,y+9.2,Z],[X+e.rand(1,4),y+9.2,Z+.4]],c[0],.45,e.back,{opacity:'.45'});}
    for(let i=0;i<160;i++){const X=x+e.rand(1,w-2),Z=e.rand(4,h);e.poly([[X,y+9.3,Z],[X+e.rand(.2,1.7),y+9.3,Z],[X+.3,y+9.3,Z+.6]],e.pick(c),e.back,{opacity:'.4'});}
    for(let i=0;i<11;i++){const X=x+e.rand(2,w-5);e.poly([[X,y+9.4,4],[X+e.rand(2,5),y+9.4,4],[X+1,y+9.4,e.rand(8,20)]],c[2],e.back,{opacity:'.35'});}
  }
  function windowPane(e,x,y,z,w,h,glow='#a9b8ba'){
    e.box(x-1,y-1,z-1,w+2,3,h+2,['#9b9e99','#525d64','#424e59']);
    e.poly([[x,y+2.1,z],[x+w,y+2.1,z],[x+w,y+2.1,z+h],[x,y+2.1,z+h]],'#273e4a');
    for(let row=0;row<2;row++)for(let col=0;col<2;col++)e.poly([[x+col*w/2+1,y+2.2,z+row*h/2+1],[x+(col+1)*w/2-1,y+2.2,z+row*h/2+1],[x+(col+1)*w/2-1,y+2.2,z+(row+1)*h/2-1],[x+col*w/2+1,y+2.2,z+(row+1)*h/2-1]],glow,e.back,{opacity:row?'.8':'.55'});
    e.box(x-2,y-1,z-3,w+4,6,2,['#b0aaa0','#696d6a','#81847c']);
  }
  function container(e,x,y,w,d,h,c,z=3){
    e.shadow(x+w*.6,y+d+15,w*.5,20,.22);e.box(x,y,z,w,d,h,c);
    for(let X=x+4;X<x+w-2;X+=5){e.box(X,y+d,z+3,1.7,1.3,h-6,[c[0],c[2],c[1]]);e.line([[X,y+2,z+h+.1],[X,y+d-2,z+h+.1]],c[2],1);}
    for(let Y=y+4;Y<y+d-2;Y+=5)e.line([[x+w+.1,Y,z+2],[x+w+.1,Y,z+h-2]],c[0],1.3);
    for(const Z of [z+1,z+h-2])e.box(x-1,y+d,Z,w+2,2,1.6,[c[0],c[2],c[1]]);
    for(const X of [x+6,x+w*.5,x+w-6]){e.line([[X,y+d+1.6,z+4],[X,y+d+1.6,z+h-4]],'#a2a69c',1.1);for(const Z of [z+6,z+h-7])e.box(X-1.3,y+d+1.4,Z,2.6,1,2,['#b7b7a6','#717d7e','#919994']);}
    e.poly([[x+10,y+d+2,z+11],[x+21,y+d+2,z+11],[x+15.5,y+d+2,z+21]],'#d7b773');
    e.line([[x+15.5,y+d+2.1,z+14],[x+15.5,y+d+2.1,z+18]],c[1],.8);
    for(let i=0;i<65;i++){const X=e.rand(x+2,x+w-2),Z=e.rand(z+2,z+h-2);e.poly([[X,y+d+1.5,Z],[X+e.rand(.5,3),y+d+1.5,Z+.3],[X+.5,y+d+1.5,Z+e.rand(1,3)]],e.pick(['#996a4e','#ceac7b',c[0]]),e.back,{opacity:'.55'});}
  }
  function chainFence(e,x,y,w,h=42){
    for(let X=x;X<=x+w;X+=w/4)e.cylinder(X,y,3,.9,h,['#9baba8','#576c74'],e.back,6);
    for(const Z of [5,h+2])e.line([[x,y,Z],[x+w,y,Z]],'#788f94',1.4);
    for(let k=-h;k<w;k+=7){let a=Math.max(0,k),b=Math.min(w,k+h);if(b>a)e.line([[x+a,y,4+a-k],[x+b,y,4+b-k]],'#80949b',.45);}
    for(let k=0;k<w+h;k+=7){let a=Math.max(0,k-h),b=Math.min(w,k);if(b>a)e.line([[x+a,y,4+k-a],[x+b,y,4+k-b]],'#758c94',.45);}
  }
  function duty(){const e=new E('duty',8123);floor(e,'duty','asphalt');puddles(e,19,'#a3b6bd');
    for(const x of [-100,93])e.line([[x,-135,3.5],[x,166,3.5]],'#d0b578',2.1,e.back,{opacity:'.65'});
    for(let y=-130;y<160;y+=18)e.poly([[-175,y,3.4],[-164,y+6,3.4],[-164,y+10,3.4],[-175,y+4,3.4]],'#c4a669');
    container(e,-168,-172,132,43,57,['#788e91','#486771','#3a5662']);
    container(e,-118,-169,80,39,43,['#a17e61','#835d49','#634d43'],60);
    container(e,15,-171,144,43,63,['#ae7754','#8b543f','#6e473e']);
    lamp(e,-170,-125,115);lamp(e,167,-151,113);
    crate(e,-165,-80,24);crate(e,-164,-79,22,19);barrel(e,-150,-29);barrel(e,-167,-42);
    container(e,139,-83,31,69,28,['#708f86','#4a706a','#365556']);
    for(let i=0;i<5;i++)crate(e,149,86+i*13,15);
    e.box(-171,121,3,43,29,12,['#ac9d79','#817654','#6b654c']);
    for(let j=0;j<3;j++)for(let k=0;k<3;k++)e.lathe(-166+k*13,125+j*7,15+j*1.4,[[0,6],[3,7],[5,5]],['#b7aa84','#8d8564','#9c9270'],e.back,8);
    for(let i=0;i<12;i++)e.line([[-130+i*23,170,3.6],[-125+i*23,170,3.6]],'#d6c49c',2);
    for(let i=0;i<4;i++){e.tube([-167,-116+i*17,6],[-140,-116+i*17,6],1.1,1.1,['#899a9a','#536b75']);}
    debris(e,'duty',85);return e;}
  function payne(){const e=new E('payne',2961);floor(e,'payne','asphalt');puddles(e,27,'#929fae');
    brickWall(e,-172,-176,342,98,['#8e7971','#594f52','#6a5b5c']);
    for(const x of [-149,-102,81,126])windowPane(e,x,-165,56,24,27,x<0?'#a8b7bf':'#d7ad77');
    e.box(-57,-165,3,112,3,54,['#6d7884','#394954','#283d49']);
    for(let z=7;z<55;z+=4)e.line([[-55,-161.5,z],[53,-161.5,z]],'#72848b',.8);
    e.box(-62,-167,57,122,11,4,['#a49d8d','#646d70','#4f5c63']);
    e.box(-58,-162,61,112,2,13,['#686f76','#2c3e4b','#566573']);
    // Broken neon tubes over a dock door, built from strokes rather than image lettering.
    for(let i=0;i<8;i++){const tube=e.line([[-48+i*12,-159.5,64],[-48+i*12,-159.5,71],[-42+i*12,-159.5,71]],i%3?'#d9a27f':'#6e6665',1.3,e.back,{'data-animated':'true'});if(i===4)e.animators.push(t=>tube.setAttribute('opacity',Math.sin(t*TAU/3)>.92?.25:.9));}
    for(const x of [-159,149]){e.tube([x,-159,10],[x,-159,93],1.4,1.4,['#9c9c95','#565e66']);e.tube([x,-159,93],[x+14,-159,93],1.4,1.4,['#888e8d','#535e65']);}
    e.box(-151,-159,37,55,24,3,['#8d9090','#505a63','#35414c']);
    for(let x=-149;x<-93;x+=8)e.line([[x,-135,40],[x,-135,55]],'#535f66',1);e.line([[-150,-135,55],[-95,-135,55]],'#949f9f',1.1);
    for(let z=8;z<40;z+=5)e.line([[-107,-135,z],[-95,-135,z]],'#849196',1.3);
    for(let i=0;i<3;i++)crate(e,-169,-91+i*23,25);crate(e,-167,-87,22,20);
    e.box(138,-92,3,33,51,27,['#667c72','#36554f','#29443f']);for(let z=8;z<28;z+=6)e.line([[139,-40,z],[169,-40,z]],'#5d7b70',.65);
    for(let i=0;i<6;i++)e.rock(132+e.rand(-9,8),-49+e.rand(-7,15),e.rand(4,7),e.rand(8,12),['#5b6870','#344650','#455761']);
    lamp(e,166,54,100);turbine(e,146,124);e.syncState=state=>{e.fanTime=state?.fanTime??null;};
    for(let i=0;i<14;i++){const x=e.rand(-145,155),y=e.rand(-120,160);e.poly([[x,y,3.5],[x+4,y+1,3.5],[x+3,y+6,3.5],[x-1,y+5,3.5]],'#a8a99e',e.back,{opacity:'.7'});}
    debris(e,'payne');return e;}
  function turbine(e,x,y){
    e.box(x-19,y-19,3,38,38,20,['#89949c','#53626f','#3c4c59']);
    for(let i=0;i<6;i++)e.line([[x-15,y+19.2,7+i*2],[x+15,y+19.2,7+i*2]],'#34434e',.9);
    e.disk(x,y,23.2,16.5,16.5,'#33424e');e.disk(x,y,23.3,14.8,14.8,'#243641');
    const rotor=e.node('g',{'data-turbine':'true'},e.back);
    const blades=Array.from({length:5},(_,i)=>e.poly([[x,y,24],[x+13,y,24],[x+9,y+6,24]],i===0?'#ada98c':i%2?'#9eafb6':'#7c909c',rotor,{'data-animated':'true','data-turbine-blade':'true'}));
    e.animators.push(t=>blades.forEach((n,i)=>{
      const a=i*TAU/5+(e.fanTime??t)*TAU/2,point=(r,offset)=>[x+Math.cos(a+offset)*r,y+Math.sin(a+offset)*r,24];
      n.setAttribute('d',e.d([point(3,-.2),point(11,-.21),point(14,.08),point(13,.49),point(7,.42),point(3,.5)]));
    }));
    // A raised wire guard leaves enough open space to see each swept blade.
    for(const radius of [8,15.8])e.line(Array.from({length:41},(_,i)=>[x+Math.cos(i*TAU/40)*radius,y+Math.sin(i*TAU/40)*radius,25.3]),'#a2afb0',.55);
    for(let i=0;i<4;i++){const a=i*TAU/4;e.line([[x+Math.cos(a)*3,y+Math.sin(a)*3,26],[x+Math.cos(a)*16,y+Math.sin(a)*16,25]],'#697b83',.8);}
    e.cylinder(x,y,24,3.4,2,['#b0b8b5','#5d7180','#8799a0'],e.back,10);
    for(const dx of [-16,16])for(const dy of [-16,16])e.disk(x+dx,y+dy,23.2,.8,.8,'#b7bdb7');
  }
  function palm(e,x,y,h=115){
    const bark=['#aa8d6b','#76664e','#8d795b'];for(let j=0;j<12;j++){const z=3+j*h/12,dx=j*j*.025;e.cylinder(x+dx,y,z,3.5-j*.13,h/12+.3,bark,e.back,8);}
    for(let k=0;k<9;k++){const a=k*TAU/9,len=34+5*Math.sin(k),start=[x+4,y,h];
      const p=u=>[start[0]+Math.cos(a)*len*u,start[1]+Math.sin(a)*len*u,h+Math.sin(u*Math.PI)*12-u*17];
      e.line(Array.from({length:10},(_,i)=>p(i/9)),'#a5aa73',1.2);
      for(let j=1;j<12;j++){const u=j/12,c=p(u),w=Math.sin(u*Math.PI)*(9-j*.35);for(const s of [-1,1])e.poly([c,[c[0]+Math.cos(a+.8*s)*w,c[1]+Math.sin(a+.8*s)*w,c[2]-3],p(Math.min(1,u+.15))],k%2?'#667b60':'#87966c');}
    }
  }
  function vehicleWheel(e,x,y,z,side){
    const group=e.node('g',{'data-vehicle-wheel':side>0?'near':'far'},e.back),n=24;
    const point=(axial,r,a)=>[x+axial,y+Math.cos(a)*r,z+Math.sin(a)*r];
    const ring=(axial,r)=>Array.from({length:n},(_,i)=>point(axial,r,i*TAU/n));
    const face=(points,fill,part)=>e.poly(points,fill,group,{'data-wheel-part':part,stroke:fill,'stroke-width':.12,'stroke-linejoin':'round'});
    const visible=points=>{
      const a=points[1].map((v,i)=>v-points[0][i]),b=points[2].map((v,i)=>v-points[0][i]);
      return a[1]*b[2]-a[2]*b[1]+a[2]*b[0]-a[0]*b[2]+a[0]*b[1]-a[1]*b[0]>0;
    };
    // A closed, bevelled tyre replaces the open tube. Backface culling avoids
    // rear tread facets cutting across the visible sidewall in SVG paint order.
    const profile=[[-2.4,5.9],[-1.8,6.75],[-1.1,7],[1.1,7],[1.8,6.75],[2.4,5.9]];
    for(let j=0;j<profile.length-1;j++)for(let i=0;i<n;i++){
      const a=i*TAU/n,b=(i+1)*TAU/n,[u,r]=profile[j],[v,s]=profile[j+1];
      const points=[point(u,r,a),point(u,r,b),point(v,s,b),point(v,s,a)];
      if(visible(points))face(points,Math.sin((a+b)/2)>.55?'#414953':Math.sin((a+b)/2)>-.25?'#303740':'#242b32','tread');
    }
    // The positive-X cap faces the camera on either side of the car; the
    // far-side wheel shows its dark inner face, behind the bodywork.
    face(ring(2.4,5.9),'#30363d','sidewall');
    for(let i=0;i<n;i++){
      const a=(i+.38)*TAU/n,b=a+.035;
      if(Math.cos(a)+Math.sin(a)>0)face([point(-.9,7.025,a),point(-.9,7.025,b),point(.9,7.025,b),point(.9,7.025,a)],'#20272e','groove');
    }
    if(side<0)return;
    face(ring(2.44,4.15),'#222a31','bead');
    face(ring(2.49,3.7),'#a3adaf','rim');
    face(ring(2.53,3.08),'#46515a','brake-disc');
    for(let i=0;i<5;i++){
      const a=i*TAU/5+.18;
      face([point(2.58,1,a-.24),point(2.58,2.96,a-.12),point(2.58,2.96,a+.12),point(2.58,1,a+.24)],i<3?'#9ba6ab':'#7b8991','spoke');
    }
    face(ring(2.62,1.05),'#b3babc','hub');
    for(let i=0;i<5;i++){
      const a=i*TAU/5,center=point(2.66,.66,a);
      face(Array.from({length:6},(_,j)=>[center[0],center[1]+Math.cos(j*TAU/6)*.16,center[2]+Math.sin(j*TAU/6)*.16]),'#59656c','lug');
    }
  }
  function car(e,x,y){
    e.shadow(x+12,y+32,24,40,.24);
    // Wheel/body overlap needs explicit layers: far wheels, body, near wheels.
    // Sorting a whole door panel against small wheel faces exposes the ground.
    for(const Y of [14,54])vehicleWheel(e,x-15.2,y+Y,13,-1);
    depth(e,()=>{
    const c=['#a0acb7','#566c80','#3f5368'];e.box(x-15,y,10,30,68,12,c);
    e.poly([[x-13,y+17,22],[x+13,y+17,22],[x+11,y+23,35],[x-11,y+23,35]],'#a4b9c1');
    e.poly([[x-13,y+48,22],[x+13,y+48,22],[x+11,y+43,35],[x-11,y+43,35]],'#526b7b');
    e.poly([[x-11,y+23,35],[x+11,y+23,35],[x+11,y+43,35],[x-11,y+43,35]],'#a5b4bf');
    for(const side of [-1,1]){
      e.poly([[x+side*13,y+17,22],[x+side*13,y+48,22],[x+side*11,y+43,35],[x+side*11,y+23,35]],c[side===1?1:2]);
      e.poly([[x+side*12.85,y+21,24],[x+side*12.85,y+45,24],[x+side*11.3,y+42,33.5],[x+side*11.3,y+24,33.5]],'#324a5d');
      e.line([[x+side*12.9,y+33,24],[x+side*11.4,y+33,33.5]],'#a5b6bb',1.2);
      e.box(x+side*10-2,y+67,15,5,1,3,['#e7c3a3','#d25d57','#a44750']);
    }
    e.box(x-14,y-1,11,28,2,3,['#b8bdb8','#89969a','#6d7e8e']);e.box(x-14,y+67,11,28,2,3,['#b8bdb8','#89969a','#6d7e8e']);
    e.line([[x-9,y+7,22.1],[x+9,y+7,22.1]],'#c4c4b7',.7);
    });
    for(const Y of [14,54])vehicleWheel(e,x+15.2,y+Y,13,1);
  }
  function gta(){const e=new E('gta',6612);floor(e,'gta','asphalt');
    for(const x of [-4,4])e.line([[x,-173,3.5],[x,173,3.5]],'#dabf7d',1.4);
    for(let i=0;i<8;i++)e.poly([[-100+i*25,98,3.6],[-85+i*25,98,3.6],[-85+i*25,111,3.6],[-100+i*25,111,3.6]],'#d3c4b0',e.back,{opacity:'.75'});
    for(const x of [-172,132]){e.box(x,-174,3,40,348,3,['#c7b29f','#928575','#a39584']);for(let y=-170;y<175;y+=20)e.line([[x,y,6.1],[x+40,y,6.1]],'#a89989',.65);}
    brickWall(e,-173,-175,169,80,['#d2b395','#ad8974','#b9937c']);
    for(const x of [-160,-115,-70]){windowPane(e,x,-163,12,31,37,'#b4a6a0');e.box(x-4,-166,51,39,15,2,['#d8b698','#875c62','#b97673']);for(let k=0;k<5;k++)e.poly([[x-4+k*8,-151,51],[x+k*8,-151,51],[x+k*8,-166,53],[x-4+k*8,-166,53]],'#e6ccb0');}
    e.box(25,-174,3,141,16,67,['#ccac9d','#a77d7d','#8d6b73']);
    for(const x of [38,85,131])windowPane(e,x,-156,18,23,31,'#caac9e');
    e.box(36,-154,55,111,2,8,['#cfb48c','#714f65','#aa7b81']);
    for(let i=0;i<12;i++)e.line([[40+i*8,-151.8,57],[40+i*8,-151.8,61]],'#e6c3a5',1);
    car(e,-148,-101);palm(e,153,-115,126);palm(e,-150,116,110);palm(e,157,135,119);
    e.cylinder(-170,-111,7,2,96,['#776456','#504d48'],e.back,8);e.tube([-178,-111,94],[-156,-111,94],1,1,['#6b5e53','#96816a']);
    e.line([[-165,-111,95],[-80,-158,83],[55,-165,80],[161,-144,94]],'#685b62',.7);
    e.cylinder(160,43,7,1.4,62,['#a3a69a','#6c7d78'],e.back,8);e.box(156,40,59,8,6,18,['#767d6d','#465852','#384c48']);
    for(let i=0;i<3;i++)e.poly([[158,46.1,62+i*5],[162,46.1,62+i*5],[162,46.1,65+i*5],[158,46.1,65+i*5]],i===2?'#dfb575':'#647563');
    for(let i=0;i<8;i++)e.grass(167+e.rand(-5,5),-25+i*13,7,.5,e.back,['#8b9373','#b6b58a','#727f64']);
    debris(e,'gta',32);return e;}
  function tank(e,x,y){
    const c=['#aa8d75','#6c6057','#8b7661'];
    for(const dx of [-13,13])for(const dy of [-13,13])e.box(x+dx-1,y+dy-1,3,2,2,41,['#869094','#455966','#60717b']);
    for(const side of [-1,1])e.line([[x-13,y+side*13,4],[x+13,y+side*13,39]],'#6f7f83',1.3);
    e.cylinder(x,y,40,21,43,c,e.back,24);for(const z of [44,55,72,80])e.lathe(x,y,0,[[z,21.5],[z+1,21.5]],['#9aa19b','#596a70','#79878a']);
    e.cone(x,y,84,24,17,['#9d8d7d','#6d6d66','#808173'],e.back,16);
    for(let z=7;z<85;z+=5)e.line([[x+22,y-4,z],[x+22,y+4,z]],'#b4b3a4',.9);
    for(const yy of [-4,4])e.line([[x+22,y+yy,5],[x+22,y+yy,87]],'#7c8b8f',1.1);
  }
  function fan(e,x,y){
    e.box(x-15,y-15,3,30,30,13,['#a5a5a0','#677b85','#526775']);e.disk(x,y,16.2,11,11,'#435967');
    const rotor=e.node('g',{},e.back);const blades=Array.from({length:5},()=>e.poly([[x,y,17],[x+9,y,17],[x+4,y+4,17]],'#8b9b9d',rotor,{'data-animated':'true'}));
    e.animators.push(t=>blades.forEach((n,i)=>{const a=i*TAU/5+t*TAU/3;n.setAttribute('d',e.d([[x,y,17],[x+Math.cos(a)*10,y+Math.sin(a)*10,17],[x+Math.cos(a+.5)*6,y+Math.sin(a+.5)*6,17]]));}));
    for(let i=-9;i<=9;i+=3)e.line([[x+i,y-9,18],[x+i,y+9,18]],'#4a5e6a',.65);
  }
  function spider(){const e=new E('spider',8024);floor(e,'spider');
    for(let y=-160;y<160;y+=31)e.line([[-164,y,3.4],[166,y,3.4]],'#b9a79b',.45);
    for(const [x,y,w] of [[-178,-178,356],[-178,168,130],[105,168,73]])brickWall(e,x,y,w,13,['#c1a18a','#8e7069','#a98473']);
    tank(e,-119,-137);brickWall(e,16,-172,151,63,['#bc927b','#84615c','#a07765']);
    e.box(48,-160,3,40,3,44,['#7e8c91','#405d70','#2e4d60']);windowPane(e,107,-160,22,31,27,'#b9c7c5');
    for(let i=0;i<5;i++)e.box(44,-154+i*5,3,49,5,8-i*1.3,['#a1a4a0','#7e8688','#5c6f7c']);
    fan(e,139,-74);fan(e,-148,48);e.box(130,42,3,31,49,12,['#b0b0a4','#71868c','#4d6977']);
    for(let y=47;y<85;y+=3)e.line([[131,y,15.1],[160,y,15.1]],'#3d5a6a',.65);
    e.tube([148,-96,3],[148,-96,42],2,2,['#b7b5a6','#69818b']);e.tube([148,-96,42],[130,-96,42],2,2,['#a6aba0','#5a7481']);
    for(const x of [-164,167])e.cylinder(x,-160,17,1,83,['#9da8a7','#5d7483'],e.back,7);
    // Rooftop aerials give the directional web travel a visible anchor on either side.
    for(const x of [-164,167]){
      e.cylinder(x,158,4,1.1,93,['#9da8a7','#5d7483'],e.back,7);
      e.line([[x-7,158,88],[x+7,158,88]],'#778b96',1);
      e.line([[x-4,158,94],[x+4,158,94]],'#9aa8aa',.9);
      e.box(x-3,155,3,6,6,5,['#b7b8ac','#6b7e8b','#8f9a9d']);
    }
    e.line([[-164,-160,98],[-70,-160,77],[57,-160,75],[167,-160,98]],'#4e6473',.9);
    for(let i=0;i<14;i++){const x=-151+i*22,z=78+Math.pow((x-2)/170,2)*19;e.disk(x,-160,z,1.4,1.4,'#ead0a4');}
    for(const [x,y] of [[-146,131],[-128,143]]){
      e.lathe(x,y,4,[[0,2],[3,3],[6,2]],['#aab1af','#778d97','#94a3a5'],e.back,8);e.lathe(x,y+1,10,[[0,1.4],[3,1.5]],['#a9bab8','#657e8c'],e.back,8);
      e.poly([[x-.7,y+2,12],[x+.7,y+2,12],[x,y+4,12]],'#c4af8d');
    }
    for(let i=0;i<8;i++)e.line([[103+i*7,166,17],[103+i*7,166,32]],'#526b79',1);e.line([[103,166,32],[159,166,32]],'#94a4a7',1.3);
    debris(e,'spider',45);return e;}
  function templeRoof(e,x,y,w,d,z){
    for(let side of [-1,1])for(let row=0;row<7;row++)for(let col=0;col<Math.ceil(w/7);col++){
      const X=x+col*7,Y=y+side*row*d/14,Y2=y+side*(row+1)*d/14,Z=z-row*2.5+Math.pow(row/6,3)*7,Z2=z-(row+1)*2.5+Math.pow((row+1)/6,3)*7;
      e.poly([[X,Y,Z],[X+7,Y,Z],[X+7,Y2,Z2],[X,Y2,Z2]],e.pick(['#747e75','#65736c','#899184','#53645e']));e.line([[X,Y,Z+.2],[X,Y2,Z2+.2]],'#a1a491',.7);
    }
    e.tube([x-5,y,z+1],[x+w+5,y,z+1],2,2,['#959a85','#5a6c5f']);
    for(const X of [x,x+w])for(const side of [-1,1])e.line([[X,y+side*d/2,z-10],[X+ (X===x?-5:5),y+side*(d/2+5),z-5]],'#a1a487',2);
  }
  function pine(e,x,y,h=128){
    const c=['#7b785b','#565944','#97906d'];e.tube([x,y,3],[x+4,y,h],3.5,1,c);
    for(let j=0;j<9;j++){const z=h*.44+j*7,R=30-j*2.7,a=j*2.4,tip=[x+Math.cos(a)*R,y+Math.sin(a)*R,z+3];e.tube([x+2,y,z-4],tip,1.7,.5,c);for(let k=0;k<8;k++){const X=tip[0]+e.rand(-15,15),Y=tip[1]+e.rand(-12,12),Z=z+e.rand(0,5),r=e.rand(6,12);e.patch(X,Y,Z,r,r*.6,e.pick(['#596b52','#6d7d5d','#81906a','#485e4a']),e.back,15);
      for(let n=0;n<14;n++){const a=e.rand(0,TAU),R=e.rand(0,r),xx=X+Math.cos(a)*R,yy=Y+Math.sin(a)*R*.65;e.poly([[xx,yy,Z+.2],[xx+e.rand(-2,3),yy+1,Z+e.rand(2,4)],[xx+e.rand(1,3),yy+2,Z+.3]],e.pick(['#8d9c72','#6d835d','#a0aa7b','#536f50']));}
    }}
  }
  function wukong(){const e=new E('wukong',9953);floor(e,'wukong');
    for(let i=0;i<130;i++){const x=e.rand(-175,175),y=e.rand(-175,175);if(Math.abs(x)<125&&Math.abs(y)<128)continue;e.patch(x,y,3.5,e.rand(3,10),e.rand(2,6),e.pick(['#73855b','#8a986c','#a2a77b']));}
    pine(e,-156,-117,143);pine(e,156,-140,151);pine(e,-165,113,110);
    for(let i=0;i<4;i++)e.box(-98,-169+i*10,3,165,11,13-i*2.5,['#adb099','#7b846f','#65725f']);
    for(const x of [-87,51]){
      e.lathe(x,-144,3,[[0,10],[6,10],[9,6],[15,5]],['#989d83','#666f5a','#7f886c']);e.cylinder(x,-144,18,4,74,['#887b5c','#5a5842','#a18f67'],e.back,10);
      for(let i=0;i<4;i++)e.box(x-10,-150,75+i*4,20,13,2,['#9a8d6b','#686347','#7a7151']);
    }
    e.box(-94,-149,88,153,10,5,['#a49774','#736d50','#5e6149']);templeRoof(e,-112,-144,192,62,113);
    e.box(-32,-137,70,24,4,16,['#9d895b','#5b6348','#756e49']);
    for(const x of [-141,126]){e.lathe(x,99,3,[[0,11],[4,11],[6,7],[20,5],[24,10],[28,9],[32,5],[35,4]],['#b1ad8c','#818a6b','#64765e']);e.disk(x,99,38,5,5,'#e6bd78');for(let i=0;i<3;i++)e.tube([x-3+i*3,99,37],[x-3+i*3,99,47],.25,.25,['#b89b68','#d0b985']);}
    // Worn seated shrine figure, with carved folds, halo and lotus plinth.
    depth(e,()=>{e.lathe(113,-126,3,[[0,19],[5,19],[8,15],[12,16]],['#aaa68b','#7c856e','#92977b']);
    e.dome(113,-126,15,16,16,['#969f85','#7f8c73','#aeb399']);e.lathe(113,-127,26,[[0,11],[15,9],[25,6]],['#9ba58b','#74856e','#b0b69a']);
    e.lathe(113,-128,51,[[0,4],[3,6],[10,6],[14,4],[15,1]],['#b0b69b','#84967d','#9ca88d']);
    for(const side of [-1,1])e.tube([113+side*8,-124,45],[113+side*13,-117,25],3.5,2.5,['#98a488','#6f8068','#b0b698']);
    for(let j=0;j<6;j++)e.line([[103+j*3,-113,18],[107+j*2,-119,39]],'#66775f',.55);});
    for(let i=0;i<18;i++){const x=e.rand(-172,172),y=e.pick([-173,159])+e.rand(-6,6);e.rock(x,y,e.rand(4,10),e.rand(8,18),['#a3a88c','#747f67','#5a6c57']);}
    debris(e,'wukong',100);return e;}
  function siege(){const e=new E('siege',6823);floor(e,'siege','wood');
    brickWall(e,-177,-178,353,83,['#b5a18c','#7f716b','#958076']);
    e.box(-177,-176,3,8,176,65,['#aab0a5','#768580','#5e6e70']);
    for(let z=7;z<67;z+=8)e.line([[-168.8,-170,z],[-168.8,-3,z]],'#a3ada3',.45,e.back,{opacity:'.5'});
    e.tube([-168,-143,16],[-168,-143,57],1.1,1.1,['#b7c0b3','#647a80']);e.tube([-168,-143,57],[-168,-62,57],1.1,1.1,['#a7b5ad','#6d8186']);
    e.box(-171,-62,47,4,20,15,['#a5b3ad','#59717c','#849b9f']);
    for(let z=12;z<78;z+=10)e.line([[-175,-168,z],[173,-168,z]],'#686e6c',.6);
    for(const x of [-159,-145,-131,-117]){e.box(x,-166,3,12,15,52,['#a0aba8','#657c81','#4a6069']);for(let z=43;z<51;z+=2)e.line([[x+2,-150.8,z],[x+10,-150.8,z]],'#364f5e',.7);e.box(x+9,-150.5,27,1,1,5,['#b3b6ac','#81928e','#6d817e']);}
    for(const x of [36,94]){e.box(x,-165,3,43,21,65,['#8d999a','#3b515c','#2b424f']);for(let z=8;z<62;z+=6){e.box(x+3,-143.5,z,37,1,4,['#879598','#526a75','#394d5b']);for(let k=0;k<3;k++){const led=e.poly([[x+5+k*4,-142.3,z+1],[x+7+k*4,-142.3,z+1],[x+7+k*4,-142.3,z+2],[x+5+k*4,-142.3,z+2]],k?'#5c9cbb':'#ddab70',e.back,{'data-animated':'true'});e.animators.push(t=>led.setAttribute('opacity',.45+.5*Math.sin(t*TAU/3+z+k)**2));}}}
    for(const x of [-72,-13]){e.box(x,-162,3,43,5,57,['#a3a9a1','#5e747c','#425b67']);for(let X=x+2;X<x+41;X+=6)e.line([[X,-156.8,5],[X,-156.8,58]],'#91a19f',1);}
    // Destructible tabletop barricade: state is updated per frame, including seeking.
    const board=e.node('g',{'data-barricade':'true'},e.back),broken=e.node('g',{'data-barricade-rubble':'true'},e.back);
    e.barricade={x:47,y:38,r:21,intact:board,broken};
    for(const x of [27,64])e.box(x,34,3,3,7,42,['#a29375','#796e59','#635c4c'],board);
    for(let i=0;i<6;i++)e.box(26,35,5+i*6,42,4,5.5,['#bea67d','#907f60','#776b55'],board);
    e.line([[30,39.3,9],[64,39.3,37]],'#d4bc70',2.7,board);e.line([[30,39.3,37],[64,39.3,9]],'#d4bc70',2.7,board);
    for(let i=0;i<22;i++){const x=47+e.rand(-24,24),y=38+e.rand(-14,15);e.poly([[x,y,3.7],[x+e.rand(4,13),y+1,3.7],[x+3,y+4,4.5]],e.pick(['#b29b75','#8f7c5e','#ceb78e']),broken);}
    broken.setAttribute('opacity','0');board.setAttribute('data-animated','true');broken.setAttribute('data-animated','true');
    e.syncState=state=>{board.setAttribute('opacity',state?.breached?'0':'1');broken.setAttribute('opacity',state?.breached?'1':'0');};
    e.box(130,56,3,32,33,21,['#939f9c','#65777a','#52666d']);e.box(134,59,24,24,16,2,['#bbb9a3','#7b8a88','#687c7e']);
    for(const x of [137,151])e.cylinder(x,112,3,7,32,['#c5b578','#93845b','#726c50'],e.back,12);
    e.tube([137,112,34],[151,112,34],.7,.7,['#4e6367','#82928b']);
    for(let i=0;i<4;i++)e.line([[133+i*6,105,3],[133+i*6,105,34]],'#5b717a',1);
    e.box(-166,109,3,38,39,21,['#a6a799','#6d7f7f','#546c72']);
    for(let i=0;i<18;i++){const x=e.rand(-160,160),y=e.rand(-135,160);e.poly([[x,y,3.4],[x+5,y,3.4],[x+6,y+8,3.4],[x+1,y+8,3.4]],'#d7d3bd',e.back,{opacity:'.6'});}
    e.tube([-167,-160,73],[163,-160,73],1.2,1.2,['#d0c7ae','#8b9185']);debris(e,'siege');return e;}
  function cottage(e,x,y,w=105){
    const d=38,h=64;e.box(x,y,3,w,d,h,['#d4c6a7','#b3ac8e','#9e9d85']);
    const timber=['#86775b','#5b5b47','#6c654e'];for(const X of [x+2,x+w*.5,x+w-5])e.box(X,y+d,3,3,2,h,timber);
    for(const Z of [7,37,65])e.box(x,y+d,Z,w,2,3,timber);
    for(const X of [x+5,x+w/2+3])e.line([[X,y+d+1,41],[X+w*.42,y+d+1,63]],'#6a644d',3);
    for(const X of [x+12,x+w-37])windowPane(e,X,y+d+1,14,19,19,'#d6c095');
    e.poly([[x-5,y-3,68],[x+w+5,y-3,68],[x+w/2,y-3,103]],'#c8bb99');
    for(const s of [-1,1])for(let row=0;row<9;row++)for(let col=0;col<9;col++){
      const X=x+w/2+s*row*(w/2+6)/9,X2=x+w/2+s*(row+1)*(w/2+6)/9,Y=y-5+col*(d+10)/9,Z=103-row*4.2,Z2=103-(row+1)*4.2;
      e.poly([[X,Y,Z],[X2,Y,Z2],[X2,Y+6,Z2],[X,Y+6,Z]],e.pick(['#777d75','#68736d','#8a8c7c','#596a63']));e.line([[X,Y,Z+.1],[X2,Y,Z2+.1]],'#a0a18c',.5);
    }
    e.box(x+w*.7,y+4,79,13,14,35,['#a8a28a','#7c8370','#626e5e']);for(let z=83;z<114;z+=5)e.line([[x+w*.7,y+18,z],[x+w*.7+13,y+18,z]],'#b7b099',.6);
  }
  function oak(e,x,y){e.tube([x,y,3],[x+4,y,78],4,2,['#8f8061','#5f624b','#a0926a']);for(let i=0;i<10;i++){const a=i*2.4,px=x+Math.cos(a)*e.rand(8,30),py=y+Math.sin(a)*e.rand(8,27),z=72+e.rand(-8,22);e.tube([x+2,y,52],[px,py,z-8],1.6,.6,['#7a7657','#555c44']);for(let j=0;j<5;j++){
    const X=px+e.rand(-8,8),Y=py+e.rand(-8,8),Z=z+e.rand(-2,5);e.patch(X,Y,Z,e.rand(10,18),e.rand(7,13),e.pick(['#88956b','#a0a875','#697e5e','#b3b780']),e.back,15);
    for(let k=0;k<20;k++){const xx=X+e.rand(-12,12),yy=Y+e.rand(-8,8),s=e.rand(.7,2);e.poly([[xx-s,yy,Z+1],[xx,yy-s,Z+2],[xx+s,yy,Z+1],[xx,yy+s,Z+1]],e.pick(['#a9b17d','#c0c38e','#829c68','#748c60']));}
  }}}
  function fable(){const e=new E('fable',4719);floor(e,'fable','cobble');
    for(let i=0;i<80;i++){const x=e.rand(-175,175),y=e.rand(-175,175);if(Math.abs(x)<140&&Math.abs(y)<132)continue;e.patch(x,y,3.4,e.rand(3,9),e.rand(2,5),e.pick(['#869369','#a3ac7d','#768a61']));}
    cottage(e,-170,-177,118);cottage(e,17,-177,140);oak(e,-159,88);oak(e,158,-65);
    e.box(-32,-160,3,43,40,12,['#c8bfa3','#989b81','#7e8d72']);e.arch(-31,-158,41,65,10,['#c2b99a','#90987c','#a8aa8b']);
    e.lathe(132,97,3,[[0,20],[5,20],[7,17],[11,17],[15,18],[18,18]],['#bbb99a','#8e9a7e','#74896e']);e.disk(132,97,19,14,14,'#809f9b');
    e.lathe(132,97,19,[[0,3],[14,3],[17,7],[20,8]],['#c1c1a1','#94a58b','#7c927e']);
    const water=e.disk(132,97,19.5,11,11,'none');water.setAttribute('stroke','#c1d4bd');water.setAttribute('stroke-width','.7');water.setAttribute('data-animated','true');e.animators.push(t=>water.setAttribute('opacity',.2+.4*Math.sin(t*TAU/3)**2));
    for(const [x,y] of [[-117,139],[146,145],[-137,-93],[115,-108]])e.lamp(x,y,e.back,'#e6c582');
    crate(e,147,-10,21);barrel(e,159,21,['#aa9270','#736c50','#8e805d']);
    e.box(-163,139,3,36,22,9,['#c0ab80','#968567','#7c765a']);
    for(let i=0;i<14;i++){const x=e.rand(-172,172),y=e.pick([-170,164])+e.rand(-4,4);e.grass(x,y,3.2,.6);for(let j=0;j<3;j++)e.disk(x+e.rand(-3,3),y+e.rand(-3,3),7,1,1,e.pick(['#d4bb92','#a89ab8','#c6ce9a']));}
    debris(e,'fable');return e;}
  function brazier(e,x,y){
    const c=['#aa8c59','#6f6150','#8c7650'];e.lathe(x,y,3,[[0,12],[4,12],[7,7],[26,5],[30,14],[34,16],[37,14]],c);e.disk(x,y,40,11,11,'#d28b43');
    const flame=e.poly([[x-6,y,39],[x+2,y,57],[x+6,y,42],[x,y+4,39]],'#edb25e',e.back,{'data-animated':'true'});
    e.animators.push(t=>flame.setAttribute('d',e.d([[x-7,y,39],[x-3+Math.sin(t*TAU/2+x)*2,y,49],[x+2+Math.sin(t*TAU/3)*3,y,62],[x+8,y,45],[x+3,y+3,39]])));
    e.disk(x,y,3.5,24,19,'#e0a05a').setAttribute('opacity','.1');
  }
  function kombat(){const e=new E('kombat',7541);floor(e,'kombat');
    for(const r of [87,90,112,115])e.line(Array.from({length:97},(_,i)=>[Math.cos(i*TAU/96)*r,Math.sin(i*TAU/96)*r,3.7]),'#b19b73',.7);
    // A continuous dragon inlay, with tapering tail, carved scales and antlered head.
    const body=Array.from({length:69},(_,i)=>{const a=i*.089,R=22+i*.62,w=1+i*.08;return [Math.cos(a)*(R+w),Math.sin(a)*(R+w),3.6];});
    const inner=Array.from({length:69},(_,i)=>{const j=68-i,a=j*.089,R=22+j*.62,w=1+j*.08;return [Math.cos(a)*(R-w),Math.sin(a)*(R-w),3.6];});e.poly([...body,...inner],'#a88f65');
    for(let i=5;i<67;i+=2){const a=i*.089,R=22+i*.62;e.line([[Math.cos(a)*(R-2),Math.sin(a)*(R-2),3.7],[Math.cos(a+.03)*R,Math.sin(a+.03)*R,3.7],[Math.cos(a)*(R+2),Math.sin(a)*(R+2),3.7]],'#796b53',.6);}
    e.poly([[51,-24,3.7],[64,-28,3.7],[70,-22,3.7],[80,-23,3.7],[77,-17,3.7],[66,-17,3.7],[73,-10,3.7],[67,-5,3.7],[55,-11,3.7],[47,-14,3.7]],'#b29a6e');
    e.line([[58,-22,3.8],[55,-32,3.8],[48,-35,3.8]],'#b29a6e',1.4);e.line([[63,-23,3.8],[64,-34,3.8],[60,-39,3.8]],'#b29a6e',1.4);e.disk(64,-21,3.8,1,1,'#4b4640');
    for(let i=0;i<3;i++)e.box(-135,-174+i*9,3,273,11,11-i*2.5,['#a49683','#746c65','#5a5654']);
    for(const x of [-115,115]){
      e.lathe(x,-148,3,[[0,16],[5,16],[9,12],[16,10],[94,9],[99,14],[103,14]],['#b49b78','#7e6d58','#948064']);
      for(let j=0;j<12;j++){const a=j*.7,z=20+j*6;e.tube([x+Math.cos(a)*10,-148+Math.sin(a)*10,z],[x+Math.cos(a+.7)*10,-148+Math.sin(a+.7)*10,z+6],1.7,1.7,['#bca16c','#8f794d','#d0b580']);}
      e.box(x-19,-163,105,38,30,4,['#a99169','#6b604d','#87744f']);
    }
    e.box(-136,-158,110,272,20,7,['#ab906e','#785c4e','#624c43']);
    templeRoof(e,-147,-150,294,55,132);
    for(const x of [-72,72]){e.box(x-12,-161,47,24,4,43,['#8c6d54','#684c44','#453f3c']);e.banner(x-11,-155,88,22,42,'#9b4c3c');}
    for(const [x,y] of [[-151,-57],[149,-56],[-145,130],[146,130]])brazier(e,x,y);
    for(const x of [-172,163])for(let y=0;y<110;y+=24)e.box(x,y,3,8,19,11,['#a3957d','#726c5d','#5d5d52']);
    debris(e,'kombat',100);return e;}
  const B=barrel,T=tank,R=templeRoof,H=cottage,P=pine,O=oak,F=brazier;
  barrel=(e,...args)=>depth(e,()=>B(e,...args));tank=(e,...args)=>depth(e,()=>T(e,...args));
  templeRoof=(e,...args)=>depth(e,()=>R(e,...args));pine=(e,...args)=>depth(e,()=>P(e,...args));oak=(e,...args)=>depth(e,()=>O(e,...args));brazier=(e,...args)=>depth(e,()=>F(e,...args));
  Object.assign(window.WorldArt.build,{duty,payne,gta,spider,wukong,siege,fable,kombat});
})();
