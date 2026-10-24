/* Four hand-built SVG worlds. All positions are in the shared isometric world. */
(() => {
  'use strict';
  const S=window.Diorama,NS='http://www.w3.org/2000/svg';
  const add=(a,b)=>a.map((v,i)=>v+b[i]),mix=(a,b,u)=>a+(b-a)*u;
  class Environment {
    constructor(id,seed){
      this.id=id;this.seed=seed;this.animators=[];this.casts=[];this.castReady=false;
      this.cast=this.node('g',{'data-shadow-world':id,'pointer-events':'none','aria-hidden':'true'});S.svg.insertBefore(this.cast,S.environmentAnchors.shadow);
      this.back=this.node('g',{'data-world':id});this.front=this.node('g',{'data-world':id});
      S.svg.insertBefore(this.back,S.environmentAnchors.back);S.svg.insertBefore(this.front,S.environmentAnchors.front);
    }
    node(tag,attrs={},parent){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(parent)parent.appendChild(n);return n;}
    rand(a=0,b=1){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return a+(b-a)*this.seed/4294967296;}
    pick(a){return a[Math.floor(this.rand(0,a.length))];}
    d(points,close=true){return points.map((v,i)=>{const q=S.project(v);return `${i?'L':'M'}${q.map(x=>x.toFixed(2)).join(',')}`;}).join('')+(close?'Z':'');}
    poly(points,fill,parent=this.back,attrs={}){if(!this.castReady){const cast=S.castPath(points);if(cast)this.casts.push(cast);}return this.node('path',{d:this.d(points),fill,...attrs},parent);}
    line(points,color,width=1,parent=this.back,attrs={}){return this.node('path',{d:this.d(points,false),fill:'none',stroke:color,'stroke-width':width,'stroke-linecap':'round',...attrs},parent);}
    box(x,y,z,w,d,h,c,parent=this.back){
      this.poly([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]],c[1],parent);
      this.poly([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],c[2],parent);
      this.poly([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],c[0],parent);
    }
    disk(x,y,z,rx,ry,c,parent=this.back){return this.poly(Array.from({length:32},(_,i)=>[x+Math.cos(i*Math.PI/16)*rx,y+Math.sin(i*Math.PI/16)*ry,z]),c,parent);}
    cone(x,y,z,r,h,colors,parent=this.back,n=10){const ring=Array.from({length:n},(_,i)=>[x+Math.cos(i/n*Math.PI*2)*r,y+Math.sin(i/n*Math.PI*2)*r,z]);for(let i=0;i<n;i++)this.poly([ring[i],ring[(i+1)%n],[x,y,z+h]],colors[i%colors.length],parent);}
    dome(x,y,z,r,h,colors,parent=this.back){for(let row=0;row<7;row++)for(let i=0;i<20;i++){const point=(v,u)=>[x+Math.cos(u*Math.PI/10)*Math.cos(v*Math.PI/14)*r,y+Math.sin(u*Math.PI/10)*Math.cos(v*Math.PI/14)*r,z+Math.sin(v*Math.PI/14)*h];this.poly([point(row,i),point(row,i+1),point(row+1,i+1),point(row+1,i)],colors[i%colors.length],parent);}}
    cylinder(x,y,z,r,h,colors,parent=this.back,n=12){const ring=Array.from({length:n},(_,i)=>[x+Math.cos(i/n*Math.PI*2)*r,y+Math.sin(i/n*Math.PI*2)*r,z]);for(let i=0;i<n;i++)this.poly([ring[i],ring[(i+1)%n],add(ring[(i+1)%n],[0,0,h]),add(ring[i],[0,0,h])],colors[i%colors.length],parent);this.poly(ring.map(v=>add(v,[0,0,h])),colors[0],parent);}
    floor(colors,edge,pattern='stone'){
      this.box(-180,-180,-15,360,360,17,edge);
      for(let row=0;row<15;row++)for(let col=0;col<15;col++){
        const x=-178+col*23.7,y=-178+row*23.7,z=2.3;
        const chip=this.rand(.4,2);const tile=[[x+chip,y+.8,z],[x+21.7,y+.5,z],[x+23,y+chip,z],[x+23,y+21,z],[x+21,y+22.8,z],[x+.4,y+22.8,z],[x+.4,y+2,z]];
        this.poly(tile,this.pick(colors));
        for(let j=0;j<3;j++){const X=x+this.rand(3,20),Y=y+this.rand(3,20),w=this.rand(.5,1.7);this.poly([[X,Y,z+.1],[X+w,Y+.2,z+.1],[X+w*.8,Y+.8,z+.1],[X,Y+.7,z+.1]],j===0?edge[2]:edge[0],this.back,{opacity:'.32'});}
        if((row+col)%3===0)this.line([[x+2,y+1,z+.1],[x+21,y+1,z+.1]],edge[0],.4);
        if(pattern==='stone'&&this.rand()>.65)this.line([[x+11,y+1,2.5],[x+7,y+8,2.5],[x+13,y+13,2.5]],edge[2],.45);
      }
      for(let i=0;i<15;i++){this.line([[-180+i*24,180,-15],[-180+i*24,180,2]],edge[2],.55);this.line([[180,-180+i*24,-15],[180,-180+i*24,2]],edge[2],.55);}
    }
    rock(x,y,r,h,c,parent=this.back){const a=Array.from({length:7},(_,i)=>[x+Math.cos(i/7*Math.PI*2)*r,y+Math.sin(i/7*Math.PI*2)*r,3]);const b=a.map(v=>[x+(v[0]-x)*.6,y+(v[1]-y)*.6,h]);for(let i=0;i<7;i++)this.poly([a[i],a[(i+1)%7],b[(i+1)%7],b[i]],c[i%c.length],parent);this.poly(b,c[0],parent);}
    // Static detail stays in the environment layers, outside the per-frame mesh.
    patch(x,y,z,rx,ry,color,parent=this.back,n=13){
      const pts=Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2,r=this.rand(.72,1.15);return[x+Math.cos(a)*rx*r,y+Math.sin(a)*ry*r,z];});return this.poly(pts,color,parent);
    }
    shadow(x,y,rx,ry,opacity=.15){return this.patch(x,y,3.08,rx,ry,'#293529',this.back,17).setAttribute('opacity',opacity);}
    slab(x,y,w,d,c,z=2.7,parent=this.back){
      const chip=this.rand(.5,2.1),pts=[[x+chip,y+.5,z],[x+w-1,y+.5,z],[x+w,y+chip,z],[x+w-.3,y+d-1,z],[x+w-2,y+d,z],[x+.8,y+d,z],[x,y+d-2,z],[x,y+2,z]];
      this.poly(pts.map(v=>[v[0],v[1],v[2]-.9]),c[2],parent);this.poly(pts,c[0],parent);
      this.line([pts[0],pts[1],pts[2]],c[1],.65,parent);this.line([pts[3],pts[4],pts[5]],c[2],.6,parent);
      if(this.rand()<.28){const X=x+w*this.rand(.25,.65);this.line([[X,y+.6,z+.1],[X-2,y+d*.3,z+.1],[X+2,y+d*.48,z+.1],[X,y+d*.68,z+.1]],c[2],.45,parent,{opacity:'.6'});}
      for(let i=0;i<2;i++){const X=x+this.rand(2,w-2),Y=y+this.rand(2,d-2);this.poly([[X,Y,z+.1],[X+1.5,Y-.4,z+.1],[X+2.1,Y+.6,z+.1],[X+.6,Y+1.2,z+.1]],i?c[1]:c[2],parent,{opacity:'.27'});}
    }
    terrainEdge(kind,material=null){
      // Keep the existing paving, plants and architecture on their original seed.
      const seed=this.seed;
      const materials={
        garden:{top:'#7c8567',side:['#657052','#71785b','#788063','#5f694e'],chips:['#a6ad8a','#bac09d','#697b54','#8e9b72','#d0c7a0'],flecks:['#73855d','#86986c','#a5ae85','#bbc0a0','#5e704f']},
        roof:{top:'#536973',side:['#344d5c','#3e5664','#49616c','#2e4655'],chips:['#82969b','#627d85','#a3ada5','#3c5663','#738c8e'],flecks:['#627c82','#49686e','#8b9c98','#9fa99e','#3a555f']},
        florence:{top:'#b09f83',side:['#8d7e65','#a18c70','#a89679','#84755e'],chips:['#d3bc96','#9b886c','#bb956f','#c7af8c','#e0cda8'],flecks:['#bca889','#cdbb98','#91856b','#a6a27b','#d9c5a1']},
        palace:{top:'#b9a47e',side:['#9e865e','#ad9369','#b39c74','#8f7958'],chips:['#d5bc8e','#c8ad7e','#9e8c64','#e5d0a5','#b2a476'],flecks:['#c6b083','#ddc596','#a3946a','#b8a075','#e7d2aa']}
      },m=material||materials[kind],boundary=[];
      for(let side=0;side<4;side++)for(let i=0;i<26;i++){
        const u=i/26,along=-188+376*u,rough=Math.sin(i*.81+side*2.1)*2+this.rand(-2.8,2.8),edge=188+rough;
        boundary.push(side===0?[along,-edge,1.6]:side===1?[edge,along,1.6]:side===2?[-along,edge,1.6]:[-edge,-along,1.6]);
      }
      const underside=boundary.map(([x,y])=>[x+this.rand(-1,1),y+this.rand(-1,1),-this.rand(12,19)]);
      const foundation=this.node('g',{'data-terrain-edge':kind},this.back);
      for(let i=26;i<78;i++){
        const a=boundary[i],b=boundary[i+1],A=underside[i],B=underside[i+1];
        this.poly([a,b,B,A],this.pick(m.side),foundation);
        if(i%3===0){
          const p=(u,z)=>[mix(a[0],b[0],u),mix(a[1],b[1],u),z];
          this.poly([p(.08,.8),p(.57,1),p(.38,-3),p(.16,-2)],this.pick(m.chips),foundation,{opacity:'.45'});
          this.line([p(.7,-2),p(.55,-6),p(.65,-10)],m.side[3],.5,foundation,{opacity:'.65'});
        }
      }
      this.poly(boundary,m.top,foundation);
      const defs=this.node('defs',{},foundation),clip=this.node('clipPath',{id:`${this.id}-terrain-clip`},defs);
      this.poly(boundary,'#fff',clip);
      const texture=this.node('g',{'clip-path':`url(#${this.id}-terrain-clip)`},foundation);
      for(let i=0;i<4700;i++){
        const x=this.rand(-194,194),y=this.rand(-194,194);
        if(Math.abs(x)<166&&Math.abs(y)<166)continue;
        const w=this.rand(.4,2.8),d=this.rand(.4,1.8);
        this.poly([[x,y,1.75],[x+w,y+.15,1.75],[x+w-.2,y+d,1.75],[x-.15,y+d-.1,1.75]],this.pick(m.flecks),texture);
      }
      // Small broken fragments and lichen interrupt the rim at several scales.
      for(let i=0;i<150;i++){
        const side=i%4,along=this.rand(-186,186),edge=this.rand(177,192);
        const [x,y]=side===0?[along,-edge]:side===1?[edge,along]:side===2?[along,edge]:[-edge,along];
        const r=this.rand(.6,3.3),c=this.pick(m.chips);
        this.poly([[x-r,y,1.8],[x-r*.3,y-r*.6,1.8],[x+r,y-r*.35,1.8],[x+r*.6,y+r*.7,1.8],[x-r*.6,y+r*.6,1.8]],c,texture);
        if(i%4===0)this.line([[x-r*.5,y,1.9],[x+r*.6,y+r*.15,1.9]],m.side[0],.35,texture);
      }
      if(kind==='garden'||kind==='florence')for(let i=0;i<38;i++){
        const side=i%4,along=this.rand(-180,180),edge=this.rand(181,189),[x,y]=side===0?[along,-edge]:side===1?[edge,along]:side===2?[along,edge]:[-edge,along];
        this.grass(x,y,1.8,this.rand(.17,.32),texture,['#7d8b61','#a2ad80','#697c55']);
      }
      this.seed=seed;
    }
    paving(kind){
      const schemes={garden:[['#a2a690','#b5b5a0','#969e8b','#aeb19b'],'#c3c4ad','#737e6d'],roof:[['#485965','#50626b','#465962','#586872'],'#71818a','#344956'],florence:[['#bdac91','#c6b69b','#b5a48c','#cabb9f'],'#dfcfb2','#9a8d76'],palace:[['#cfba95','#d7c4a1','#c8b38e','#dac9aa'],'#ead8b5','#ac9878']},[colors,light,dark]=schemes[kind];
      const garden=kind==='garden',roof=kind==='roof';
      this.terrainEdge(kind);
      const bound=garden?148:167,dy=roof?39:kind==='florence'?17:kind==='palace'?32:27;
      if(garden)this.poly([[-177,-177,2.1],[177,-177,2.1],[177,177,2.1],[-177,177,2.1]],'#81886b');
      for(let row=0,y=-bound;y<bound;row++,y+=dy){
        const widths=roof?[58,72,48]:kind==='florence'?[28,39,24]:kind==='palace'?[32]:[30,44,23,37];
        for(let x=-bound;x<bound;){const w=Math.min(this.pick(widths),bound-x);if(w>3)this.slab(x+.7,y+.8,w-1.5,Math.min(dy-1.4,bound-y-.5),[this.pick(colors),light,dark]);x+=w;}
      }
      // Border stones and a layered, worn foundation instead of a flat plate.
      for(let i=0;i<18;i++){
        const x=-180+i*20;
        if(!garden){this.slab(x+.5,-179,19,10,[light,light,dark]);this.slab(x+.5,169,19,10,[light,light,dark]);this.slab(-179,x+.5,10,19,[light,light,dark]);this.slab(169,x+.5,10,19,[light,light,dark]);}
      }
    }
    lathe(x,y,z,rings,colors,parent=this.back,n=12){
      for(let j=0;j<rings.length-1;j++)for(let i=0;i<n;i++){
        const p=(row,a)=>[x+Math.cos(a/n*Math.PI*2)*rings[row][1],y+Math.sin(a/n*Math.PI*2)*rings[row][1],z+rings[row][0]];
        this.poly([p(j,i),p(j,i+1),p(j+1,i+1),p(j+1,i)],colors[i%colors.length],parent);
      }
      const [h,r]=rings.at(-1);this.disk(x,y,z+h,r,r,colors[0],parent);
    }
    tube(a,b,ra,rb,colors,parent=this.back,n=7){
      const d=b.map((v,i)=>v-a[i]),len=Math.hypot(...d),u=d.map(v=>v/len),cross=(p,q)=>[p[1]*q[2]-p[2]*q[1],p[2]*q[0]-p[0]*q[2],p[0]*q[1]-p[1]*q[0]];
      let v=cross(u,Math.abs(u[2])>.9?[1,0,0]:[0,0,1]);const vl=Math.hypot(...v);v=v.map(x=>x/vl);const w=cross(u,v);
      const ring=(p,r,i)=>p.map((x,k)=>x+r*(v[k]*Math.cos(i/n*Math.PI*2)+w[k]*Math.sin(i/n*Math.PI*2)));
      for(let i=0;i<n;i++)this.poly([ring(a,ra,i),ring(a,ra,i+1),ring(b,rb,i+1),ring(b,rb,i)],colors[i%colors.length],parent);
    }
    masonry(x,y,z,w,h,colors,parent=this.back,rowH=8,blockW=17){
      for(let row=0;row<Math.ceil(h/rowH);row++)for(let col=-1;col<Math.ceil(w/blockW);col++){
        const X=Math.max(x,x+col*blockW+(row%2)*blockW*.5),R=Math.min(x+w,x+(col+1)*blockW+(row%2)*blockW*.5),Z=z+row*rowH,H=Math.min(rowH-.6,z+h-Z);
        if(R-X<1||H<=0)continue;this.poly([[X+.3,y,Z+.2],[R-.3,y,Z+.2],[R-.3,y,Z+H],[X+.3,y,Z+H]],this.pick(colors),parent);this.line([[X+.5,y+.1,Z+H],[R-.5,y+.1,Z+H]],colors[0],.4,parent);
      }
    }
    urn(x,y,s=1,parent=this.back,c=['#c3976f','#ac7958','#91674d']){
      this.lathe(x,y,3,[[0,3*s],[2*s,4*s],[5*s,7*s],[11*s,7.5*s],[15*s,4*s],[17*s,3.5*s],[18*s,4.8*s],[19*s,4.8*s]],c,parent);this.disk(x,y,3+19*s,3.5*s,3.5*s,'#504b3c',parent);
      for(const z of [7,15])this.lathe(x,y,3,[[z*s,(z===7?7.6:4.4)*s],[(z+.6)*s,(z===7?7.6:4.4)*s]],[c[0],c[0],c[1]],parent);
    }
    grass(x,y,z,s=1,parent=this.back,colors=['#737f55','#94a073','#5f7250']){
      for(let i=0;i<5;i++){const a=this.rand(0,6.28),r=this.rand(2,6)*s,h=this.rand(4,11)*s;this.poly([[x-.5*s,y,z],[x+Math.cos(a)*r,y+Math.sin(a)*r,z+h],[x+.7*s,y+.4,z]],this.pick(colors),parent);}
    }
    arch(x,y,w,h,depth,c,parent=this.back){
      const thick=6,spring=h-w*.46;
      this.box(x,y,3,thick,depth,spring,c,parent);this.box(x+w-thick,y,3,thick,depth,spring,c,parent);
      for(let i=0;i<13;i++){
        const a=Math.PI-i/13*Math.PI,b=Math.PI-(i+1)/13*Math.PI,center=x+w/2,R=w/2;
        const q=[[center+Math.cos(a)*R,y+depth,spring+3+Math.sin(a)*R],[center+Math.cos(b)*R,y+depth,spring+3+Math.sin(b)*R],[center+Math.cos(b)*(R-thick),y+depth,spring+3+Math.sin(b)*(R-thick)],[center+Math.cos(a)*(R-thick),y+depth,spring+3+Math.sin(a)*(R-thick)]];
        this.poly(q,c[i%3],parent);this.poly([q[0],q[1],add(q[1],[0,-depth,0]),add(q[0],[0,-depth,0])],c[0],parent);
      }
    }
    lamp(x,y,parent=this.back,color='#f1c67b'){
      this.box(x-6,y-6,3,12,12,3,['#8a8170','#6d665a','#585b50'],parent);
      this.box(x-1.5,y-1.5,6,3,3,17,['#645d50','#4d5046','#41453f'],parent);
      this.box(x-4,y-4,23,8,8,9,[color,color,'#c39d5e'],parent);this.cone(x,y,33,8,4,['#766f5c','#5b6252','#8c8f72'],parent);
      const halo=this.disk(x,y,3.2,14,10,color,parent);halo.setAttribute('opacity','.10');halo.setAttribute('data-animated','true');
      this.animators.push(t=>halo.setAttribute('opacity',(.09+Math.sin(t*3+x)*.025).toFixed(3)));
    }
    banner(x,y,z,w,h,color,parent=this.back,axis='x'){
      const n=this.poly([[x,y,z],[x+w,y,z],[x+w,y,z-h],[x,y,z-h]],color,parent);n.setAttribute('data-animated','true');
      this.animators.push(t=>{const points=[];for(let i=0;i<=6;i++){const u=i/6,wave=Math.sin(t*2+u*3+x)*u*3;points.push(axis==='x'?[x+w*u,y+wave,z-u*1.5]:[x+wave,y+w*u,z-u*1.5]);}for(let i=6;i>=0;i--){const u=i/6,wave=Math.sin(t*2+u*3+x+.6)*3;points.push(axis==='x'?[x+w*u,y+wave,z-h+Math.cos(u*5)*2]:[x+wave,y+w*u,z-h+Math.cos(u*5)*2]);}n.setAttribute('d',this.d(points));});return n;
    }
    animate(t){this.animators.forEach(fn=>fn(t));}
    show(visible){if(visible&&!this.castReady){S.paintCast(this.cast,this.casts);this.castReady=true;this.casts=[];}for(const n of [this.cast,this.back,this.front])n.setAttribute('display',visible?'inline':'none');}
  }
  function mapleLeaf(e,x,y,z,s,color,parent=e.back,a=0){
    const shape=[[-.25,0],[-1.1,.25],[-.8,-.22],[-1.25,-.75],[-.45,-.62],[-.35,-1.2],[0,-.8],[.45,-1.5],[.65,-.55],[1.1,-.85],[.8,-.15],[1.2,.2],[.3,.3],[0,.7]];
    return e.poly(shape.map(([X,Y])=>[x+(X*Math.cos(a)-Y*Math.sin(a))*s,y+(X*Math.sin(a)+Y*Math.cos(a))*s,z]),color,parent);
  }
  function maple(e,x,y,h,r,colors){
    const bark=['#73644a','#514d3c','#8b7957','#62543f'],base=[x,y,3],bend=[x-6,y+1,h*.45],fork=[x+2,y-4,h*.72];
    for(let i=0;i<6;i++){const a=i*1.047;e.tube([x+Math.cos(a)*12,y+Math.sin(a)*10,3],base,1.1,4,bark);}
    e.tube(base,bend,6,4.8,bark);e.tube(bend,fork,4.8,3.2,bark);
    const clouds=[];
    for(let i=0;i<9;i++){
      const a=i*2.4,R=r*(i===0?.12:e.rand(.45,.83)),tip=[x+Math.cos(a)*R,y+Math.sin(a)*R,h-e.rand(0,19)];
      const mid=[mix(fork[0],tip[0],.56),mix(fork[1],tip[1],.56),tip[2]-12];
      e.tube(fork,mid,2.7,1.7,bark);e.tube(mid,tip,1.7,.5,bark);
      for(let j=0;j<6;j++)clouds.push({x:tip[0]+e.rand(-13,13),y:tip[1]+e.rand(-13,13),z:tip[2]+e.rand(-5,9),r:e.rand(8,16)});
    }
    clouds.sort((a,b)=>(a.x+a.y-a.z*.6)-(b.x+b.y-b.z*.6));
    for(const q of clouds){
      const pts=Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,R=q.r*e.rand(.7,1.2);return[q.x+Math.cos(a)*R,q.y+Math.sin(a)*R,q.z+e.rand(-2,3)];});
      e.poly(pts,colors[0]);
      for(let i=0;i<6;i++)e.poly([pts[i*2],pts[(i*2+1)%12],pts[(i*2+2)%12],[q.x,q.y,q.z+5]],e.pick(colors));
      for(let i=0;i<12;i++){const a=e.rand(0,6.28),R=e.rand(0,q.r);mapleLeaf(e,q.x+Math.cos(a)*R,q.y+Math.sin(a)*R,q.z+e.rand(4,7),e.rand(1.3,2.3),e.pick(colors),e.back,a);}
    }
  }
  function stoneLantern(e,x,y,parent=e.back){
    const c=['#a1a58a','#7d8770','#626e5d','#b0b198'];
    e.box(x-9,y-9,3,18,18,3,c,parent);e.lathe(x,y,6,[[0,7],[2,5],[5,3.1],[20,3.1],[23,7.5],[25,8]],c,parent,8);
    e.box(x-5,y-5,31,10,10,10,c,parent);
    e.poly([[x-3,y+5.1,33],[x+3,y+5.1,33],[x+3,y+5.1,38],[x-3,y+5.1,38]],'#e2bc7a',parent);
    e.poly([[x+5.1,y-3,33],[x+5.1,y+3,33],[x+5.1,y+3,38],[x+5.1,y-3,38]],'#bba06b',parent);
    e.lathe(x,y,41,[[0,11],[2,9],[5,5],[6,3]],c,parent,8);e.lathe(x,y,47,[[0,2],[3,3],[5,1.5],[7,0]],c,parent,8);
    e.patch(x-3,y-2,44,5,3,'#7a8860',parent);
  }
  function tsushima(){
    const e=new Environment('tsushima',919);e.paving('garden');
    // Uneven moss, gravel, roots and leaf drifts enclose the stone duelling court.
    for(let i=0;i<230;i++){
      const x=e.rand(-177,177),y=e.rand(-177,177);if(Math.abs(x)<142&&Math.abs(y)<142)continue;
      e.patch(x,y,3,e.rand(2,8),e.rand(1,5),e.pick(['#6f7d56','#8d9470','#a4a683','#747e60']),e.back,7);
    }
    for(let i=0;i<450;i++){
      const x=e.rand(-179,179),y=e.rand(-179,179);if(Math.abs(x)<145&&Math.abs(y)<145)continue;
      e.poly([[x,y,3.2],[x+e.rand(.5,2),y+.2,3.2],[x+1,y+1.5,3.2]],e.pick(['#bbc0a2','#adb193','#535f4b','#d0c8a0']));
    }
    for(let i=0;i<60;i++){
      const edge=i%4,x=edge<2?(edge?166:-166)+e.rand(-10,8):e.rand(-170,170),y=edge>1?(edge===2?166:-166)+e.rand(-8,8):e.rand(-170,170);
      if(i%3===0)e.rock(x,y,e.rand(2,5),e.rand(4,7),['#a8ac94','#828c75','#6e7a67']);else e.grass(x,y,3,e.rand(.3,.65));
    }
    for(let i=0;i<7;i++)e.line([[-121,-168+i*2.2,3.2],[40,-168+i*2.2,3.2]],'#c3bd9e',.55);
    // Soft canopy shadows and broad gate shadows anchor every tall object.
    e.shadow(-116,-68,48,33,.13);e.shadow(133,-112,37,27,.15);
    e.poly([[-94,-137,3.1],[-83,-137,3.1],[-45,-81,3.1],[-54,-80,3.1]],'#48533d',e.back,{opacity:'.16'});
    e.poly([[14,-137,3.1],[24,-137,3.1],[59,-81,3.1],[50,-81,3.1]],'#48533d',e.back,{opacity:'.16'});
    e.poly([[-92,-83,3.1],[56,-83,3.1],[62,-72,3.1],[-87,-72,3.1]],'#48533d',e.back,{opacity:'.11'});
    // Tall, branching maple crowns, with a darker interior and individual leaf silhouettes.
    maple(e,-151,-106,120,42,['#81533b','#ad643d','#bf7944','#d19b50','#dfb561']);
    // Weathered stepped approach under the torii.
    for(let i=0;i<3;i++){e.box(-100,-160+i*9,3,133,12,8-i*2,['#b9b59c','#8e927c','#78836e']);for(let j=0;j<7;j++)e.line([[-99+j*19,-148+i*9,3],[-99+j*19,-148+i*9,11-i*2]],'#78836e',.65);}
    for(const x of [-87,19]){
      e.lathe(x,-139,3,[[0,8],[3,8],[5,6.5],[11,6.5]],['#7c8270','#555f51','#68725f']);
      e.tube([x,-139,12],[x+(x<0?3:-3),-139,102],5.3,4.5,['#b95e44','#8c4335','#d37b51','#a5503a']);
      for(let i=0;i<12;i++){const z=e.rand(14,95);e.line([[x-1.5,-133.5,z],[x-1,-133.5,z+e.rand(2,5)]],'#e2a16b',.5,e.back,{opacity:'.65'});}
      e.box(x-10,-144,73,20,10,4,['#c37850','#9e4e37','#87402f']);
    }
    e.box(-104,-145,78,140,12,7,['#c5744c','#a5523b','#834333']);
    e.box(-37,-144,84,7,10,19,['#c77852','#a6543c','#824333']);
    // Curved, layered lintel, with slightly lifted end caps.
    for(const [z,depth,color] of [[99,20,'#a55c43'],[103,23,'#4c5041'],[106,24,'#646447']]){
      const pts=[];for(let i=0;i<=16;i++){const x=-112+i*10,u=(i-8)/8;pts.push([x,-139+depth*.5,z+u*u*5]);}for(let i=16;i>=0;i--){const x=-112+i*10,u=(i-8)/8;pts.push([x,-139-depth*.5,z+u*u*5]);}e.poly(pts,color);
      e.line(pts.slice(0,17),color==='#4c5041'?'#303b32':'#c08a5a',1.3);
    }
    e.box(-42,-132,83,18,3,18,['#746d4c','#494e3b','#343f34']);
    e.line([[-38,-128.7,86],[-38,-128.7,98],[-29,-128.7,98],[-29,-128.7,86],[-38,-128.7,86]],'#b5a375',.7);
    e.line([[-34,-128.5,88],[-34,-128.5,96]],'#d4ba7b',1.2);e.line([[-36,-128.5,93],[-31,-128.5,93]],'#d4ba7b',.8);
    const rope=[];for(let i=0;i<=30;i++){const u=i/30;rope.push([-82+97*u,-132,76-Math.sin(u*Math.PI)*8]);}e.line(rope,'#bfa477',2.2);
    for(let i=0;i<4;i++){const x=-68+i*24,z=76-Math.sin((i*.247+.14)*Math.PI)*8;e.poly([[x,-131,z],[x+3,-131,z-2],[x+1,-131,z-5],[x+4,-131,z-7],[x+1,-131,z-11],[x-1,-131,z-8],[x+1,-131,z-6],[x-2,-131,z-3]],'#e5dfc3');}
    // A small roofed shrine and bamboo grove at the far edge.
    e.box(78,-172,3,53,35,7,['#b8b79d','#8e947b','#6b7966']);
    e.box(83,-169,10,42,27,44,['#85724f','#695d42','#4f523b']);
    for(let i=0;i<10;i++)e.line([[86+i*3.9,-141.8,14],[86+i*3.9,-141.8,50]],'#a18c60',.65);
    e.box(81,-171,50,46,31,4,['#a09168','#756d4c','#5c5b41']);
    for(const side of [-1,1]){const X=104,tip=side<0?72:137;e.poly([[X,-176,70],[X,-132,70],[tip,-132,54],[tip,-176,54]],side<0?'#686f55':'#485949');for(let i=0;i<12;i++)e.line([[X,-176+i*4,70],[tip,-176+i*4,54]],'#899173',.7);}
    e.box(102,-179,70,4,50,3,['#919676','#68755c','#4e604e']);
    for(let i=0;i<13;i++){
      const x=143+i%4*7,y=-169+Math.floor(i/4)*8,h=e.rand(67,100);e.tube([x,y,3],[x-3,y,h],1.5,1.1,['#7e8c56','#526e45','#a3aa71'],e.back,5);
      for(let z=15;z<h;z+=13){e.line([[x-2,y+1,z],[x+1,y+1,z]],'#c2c091',.6);for(let j=0;j<3;j++){const side=j%2?1:-1;e.poly([[x-1,y,z],[x+side*(8+j*2),y+2,z+7-j],[x+side*5,y+1,z+1]],j%2?'#526e47':'#7c925d');}}
    }
    maple(e,149,-145,99,29,['#8c4936','#a84e36','#bd6540','#d08447','#bc793f']);
    for(const [x,y,r,h] of [[-139,78,15,13],[148,-70,14,16],[-154,-38,9,11]]){e.shadow(x+3,y+3,r*1.15,r*.8,.18);e.rock(x,y,r,h,['#b0b299','#7c8974','#929c82']);e.patch(x-2,y,h+.05,r*.45,r*.3,'#849166');e.grass(x-8,y+7,3,.7);}
    stoneLantern(e,-132,-123);stoneLantern(e,-146,128,e.front);stoneLantern(e,147,127,e.front);
    // Low shrubs and silver grass form small, dense islands along the moss edge.
    for(const [x,y] of [[-161,-47],[-161,39],[162,-29],[-154,106],[143,152]]){
      e.patch(x,y,3.5,12,9,'#61724e');
      for(let i=0;i<32;i++){const a=i*2.4,R=e.rand(0,10),X=x+Math.cos(a)*R,Y=y+Math.sin(a)*R,Z=4+(10-R)*.45;e.patch(X,Y,Z,2.8,1.5,e.pick(['#5a714c','#748651','#93a16b','#83935d']),e.back,5);}
      for(let i=0;i<5;i++){const X=x+e.rand(-6,6),Y=y+e.rand(-5,5),h=e.rand(12,22),tip=[X+3,Y+1,h];e.line([[X,Y,3],tip],'#8b9670',.65);for(let j=0;j<5;j++)e.poly([[tip[0],tip[1],h-j*1.2],[tip[0]+2,tip[1]+.5,h-j*1.2-3],[tip[0]-1.7,tip[1]-.5,h-j*1.2-2]],'#c8c4a0');}
    }
    for(let i=0;i<550;i++){
      const x=e.rand(-174,174),y=e.rand(-173,171),nearTree=Math.hypot(x+147,y+100)<77||Math.hypot(x-145,y+133)<64;
      if(!nearTree&&Math.abs(x)<134&&Math.abs(y)<115&&e.rand()<.86)continue;
      mapleLeaf(e,x,y,3.6,e.rand(.65,1.7),e.pick(['#aa653d','#c08a48','#d5af61','#9c5635','#c77940']),e.back,e.rand(0,6.28));
    }
    return e;
  }
  function gargoyle(e,x,y,parent){
    const c=['#7a9296','#506d79','#3c5767','#94a5a3'];
    e.box(x-11,y-11,3,22,22,4,c,parent);e.box(x-9,y-9,7,18,18,8,c,parent);e.box(x-11,y-11,15,22,22,3,c,parent);
    e.lathe(x,y,18,[[0,5],[8,6],[16,4.5],[20,3]],c,parent,8);
    for(const side of [-1,1]){
      e.tube([x+side*3,y,29],[x+side*7,y+4,21],2.7,2.3,c,parent);e.tube([x+side*7,y+4,21],[x+side*6,y+9,19],2.3,1.4,c,parent);
      e.tube([x+side*3,y+1,35],[x+side*5,y+8,24],1.7,1.3,c,parent);
      for(let j=0;j<3;j++)e.tube([x+side*5+j*.7,y+8,24],[x+side*5+j*.7,y+11,23],.5,.2,c,parent,5);
      const pts=[[x+side*3,y-2,35],[x+side*11,y-5,47],[x+side*25,y-5,52],[x+side*21,y-3,41],[x+side*19,y,32],[x+side*14,y-1,35],[x+side*10,y+1,28],[x+side*6,y,31]];
      e.poly(pts,side===1?'#66838e':'#4d6d7d',parent);for(let j=3;j<8;j++)e.poly([pts[0],pts[1],pts[j]],j%2?'#5f7c89':'#78929a',parent);e.line(pts.slice(0,4),'#9cafa9',.65,parent);
    }
    e.lathe(x,y+1,36,[[0,3],[4,4.4],[8,3.4],[10,1.7]],c,parent,7);
    e.box(x-3,y+3,38,6,5,3,c,parent);e.cone(x-2.8,y,44,1.4,5,c,parent,5);e.cone(x+2.8,y,44,1.4,5,c,parent,5);
    e.line([[x-2.5,y+5.3,43],[x-1,y+5.3,42]],'#263e4c',1,parent);e.line([[x+1,y+5.3,42],[x+2.5,y+5.3,43]],'#263e4c',1,parent);
  }
  function gotham(){
    const e=new Environment('arkham',420);e.paving('roof');
    // Asphalt repairs, seams, grates and rainwater break up the roof surface.
    for(let i=0;i<80;i++){const x=e.rand(-164,165),y=e.rand(-164,164);e.patch(x,y,2.95,e.rand(2,12),e.rand(1,6),e.pick(['#41545f','#64767b','#3d535e']),e.back,8).setAttribute('opacity','.35');}
    for(const x of [-142,139]){
      e.line([[x,-171,3.05],[x,160,3.05]],'#2e4653',2);e.line([[x+1,-171,3.06],[x+1,160,3.06]],'#75858a',.6);
      for(let y=-95;y<160;y+=73){e.box(x-5,y,3.1,10,14,1,['#344b56','#223d4b','#253e4d']);for(let k=0;k<5;k++)e.line([[x-4,y+2+k*2.4,4.2],[x+4,y+2+k*2.4,4.2]],'#7c8c8f',.65);}
    }
    for(const [x,y,rx,ry] of [[-109,59,24,10],[70,-86,32,14],[96,117,28,10],[-46,-80,22,8],[18,111,32,13]]){
      e.patch(x,y,3.2,rx+2,ry+2,'#334b57',e.back,19);e.patch(x,y,3.3,rx,ry,'#7995a1',e.back,19).setAttribute('opacity','.36');
      for(let i=0;i<4;i++)e.line([[x-rx*.5+i*2,y-ry*.4+i*2,3.4],[x+rx*.65-i*3,y-ry*.4+i*2,3.4]],i%2?'#98adb1':'#587c8d',.7,e.back,{opacity:'.5'});
      const ripple=e.line([], '#b7c8c7',.5,e.back,{'data-animated':'true'});e.animators.push(t=>{const u=(t*.5+x*.013+10)%1;const pts=Array.from({length:19},(_,j)=>[x+Math.cos(j*Math.PI/9)*(1+u*4),y+Math.sin(j*Math.PI/9)*(1+u*4),3.5]);ripple.setAttribute('d',e.d(pts,false));ripple.setAttribute('opacity',((1-u)*.4).toFixed(3));});
    }
    e.shadow(-76,-107,48,19,.25);e.shadow(55,-113,26,18,.25);
    // Layered brick parapets with oxidized copper coping.
    e.box(-180,-180,3,360,9,15,['#627f85','#354e5d','#2b4252']);e.masonry(-179,-170.8,4,358,13,['#526b78','#3f5967','#48616f','#536875'],e.back,5,13);
    e.box(-182,-182,18,364,13,2.5,['#78958f','#4b6f73','#365a63']);
    e.box(171,-169,3,9,283,15,['#647e86','#4a6271','#354e60']);e.box(169,-169,18,13,283,2.5,['#76978f','#507478','#355c67']);
    for(let y=-163;y<109;y+=19)e.line([[180.1,y,4],[180.1,y,17]],'#6b8289',.5);
    for(const x of [-174,-64,62,171]){e.box(x-4,-180,3,8,12,25,['#7c9096','#536d7e','#3c586b']);e.box(x-6,-182,28,12,16,3,['#91a6a7','#597b83','#426875']);}
    // Gotham clock tower: rusticated base, lancet recesses, copper mansard and spire.
    const c=['#819296','#536d7c','#3d586a'];
    e.box(-137,-173,3,78,57,5,c);e.box(-132,-168,8,68,46,76,c);e.masonry(-132,-121.9,4,68,78,['#617885','#526b7c','#4d6575','#6c818a'],e.back,7,15);
    for(const x of [-132,-70]){e.box(x,-125,3,6,7,83,['#87999c','#6a808b','#465f71']);for(let z=10;z<80;z+=12)e.box(x-1,-126,z,8,9,2,['#91a2a3','#697f8a','#516c79']);}
    e.box(-137,-173,84,78,57,4,c);e.box(-140,-176,88,84,63,3,['#94a6a7','#687f89','#4d6878']);
    // Door and stone pointed surrounds.
    e.poly([[-117,-121.6,8],[-82,-121.6,8],[-82,-121.6,43],[-99.5,-121.6,54],[-117,-121.6,43]],'#304a59');
    e.line([[-120,-121.3,8],[-120,-121.3,44],[-99.5,-121.3,58],[-79,-121.3,44],[-79,-121.3,8]],'#9baca9',2);
    e.box(-113,-121,7,27,1,35,['#536b75','#3c5561','#2c4655']);for(let i=0;i<6;i++)e.line([[-110+i*4,-119.8,9],[-110+i*4,-119.8,39]],'#6b7e83',.55);
    e.line([[-91,-119.5,23],[-88,-119.5,23]],'#b7a67a',1.4);
    // The side wall has its own weathered brick joints and Gothic recess.
    for(let z=14;z<80;z+=7){
      e.line([[-63.8,-166,z],[-63.8,-123,z]],'#607b88',.5);
      for(let y=-164+(z%2)*6;y<-125;y+=14)e.line([[-63.7,y,z],[-63.7,y,z+6]],'#6c838d',.45);
    }
    e.poly([[-63.6,-155,35],[-63.6,-133,35],[-63.6,-133,61],[-63.6,-144,74],[-63.6,-155,61]],'#2c4758');
    e.line([[-63.4,-155,35],[-63.4,-155,61],[-63.4,-144,74],[-63.4,-133,61],[-63.4,-133,35]],'#829a9d',1.1);
    for(const y of [-149,-143,-137])e.line([[-63.2,y,36],[-63.2,y,62]],'#6a8a91',.85);
    e.line([[-62.8,-163,9],[-62.8,-163,83]],'#91a09b',2.3);e.line([[-62.6,-162.6,9],[-62.6,-162.6,83]],'#456879',.8);
    // Clock face in the facade plane, with raised stone voussoirs.
    const clock=(r)=>Array.from({length:32},(_,i)=>[-99+Math.cos(i*Math.PI/16)*r,-120.9,69+Math.sin(i*Math.PI/16)*r]);
    e.poly(clock(12),'#a6ad9c');e.poly(clock(10),'#324e5d');e.poly(clock(8.8),'#c5c9ac');
    for(let i=0;i<12;i++){const a=i*Math.PI/6;e.line([[-99+Math.cos(a)*7.4,-120.7,69+Math.sin(a)*7.4],[-99+Math.cos(a)*8.7,-120.7,69+Math.sin(a)*8.7]],'#536775',.85);}
    e.line([[-104,-120.4,72],[-99,-120.4,69],[-97,-120.4,75]],'#344d59',1.1);
    e.poly([[-140,-113,91],[-129,-124,112],[-70,-124,112],[-56,-113,91]],'#517873');
    e.poly([[-56,-113,91],[-70,-124,112],[-70,-161,112],[-56,-176,91]],'#365d64');
    e.poly([[-129,-161,112],[-70,-161,112],[-70,-124,112],[-129,-124,112]],'#688f84');
    for(let i=0;i<12;i++)e.line([[-138+i*7,-113,91],[-128+i*5.1,-124,112]],'#86a091',.7);
    for(let i=0;i<8;i++)e.line([[-56,-115-i*8,91],[-70,-124-i*5.2,112]],'#648a83',.65);
    e.box(-107,-149,112,15,14,6,c);e.cone(-99.5,-142,118,9,22,['#668b83','#345b65','#87a297'],e.back,4);e.line([[-99.5,-142,139],[-99.5,-142,148]],'#8ba59f',1.4);
    // Braced water tower: separate wooden staves, hoops, ladder and pipework.
    for(const dx of [-13,13])for(const dy of [-13,13])e.tube([32+dx,-149+dy,3],[32+dx,-149+dy,45],1.5,1.5,['#71828a','#365361','#506c77']);
    for(const y of [-162,-136]){e.line([[19,y,7],[45,y,42]],'#4b6976',1.7);e.line([[45,y,7],[19,y,42]],'#587481',1.7);}
    e.cylinder(32,-149,41,21,40,['#6c796f','#4d6867','#72877a','#3d5b60'],e.back,24);
    for(let i=0;i<24;i++){const a=i*Math.PI/12;e.line([[32+Math.cos(a)*21.1,-149+Math.sin(a)*21.1,42],[32+Math.cos(a)*21.1,-149+Math.sin(a)*21.1,80]],'#334f54',.45);}
    for(const z of [46,57,69,78])for(let i=0;i<12;i++){const p=(j,Z)=>[32+Math.cos(-Math.PI*.25+j*Math.PI/12)*21.6,-149+Math.sin(-Math.PI*.25+j*Math.PI/12)*21.6,Z];e.poly([p(i,z),p(i+1,z),p(i+1,z+1.6),p(i,z+1.6)],i<6?'#526e78':'#8b9c97');}e.cone(32,-149,81,23,14,['#758e8b','#52767c','#385c6b'],e.back,16);
    for(const x of [47,53])e.line([[x,-131,3],[x,-131,86]],'#789093',1.2);for(let z=6;z<85;z+=6)e.line([[47,-131,z],[53,-131,z]],'#a0aaa0',.9);
    e.line([[26,-126,44],[26,-120,44],[26,-120,8],[80,-120,8]],'#314b58',4);e.line([[26,-126,44],[26,-120,44],[26,-120,8],[80,-120,8]],'#6e8b8f',2);
    // HVAC housing, actual fan cage, access panels and fasteners.
    e.box(83,-147,3,47,34,24,['#8d9fa2','#5c7682','#415e6f']);e.box(81,-149,27,51,38,2,['#a3b3b0','#6b8791','#496a7b']);
    for(let i=0;i<11;i++)e.line([[87+i*3.9,-112.8,7],[87+i*3.9,-112.8,23]],'#2f4e5f',1.3);
    e.cylinder(106,-131,29,13,2,['#3a5765','#82999d','#4c6c7a']);
    for(let i=0;i<5;i++){const a=i*1.256;e.poly([[106,-131,31.2],[106+Math.cos(a)*11,-131+Math.sin(a)*11,31.2],[106+Math.cos(a+.65)*8,-131+Math.sin(a+.65)*8,31.2]],'#879fa2');}
    for(const r of [4,8,12])e.line(Array.from({length:25},(_,i)=>[106+Math.cos(i*Math.PI/12)*r,-131+Math.sin(i*Math.PI/12)*r,32]),'#344e5f',.75);
    for(const x of [86,126])for(const y of [-144,-116])e.disk(x,y,29.1,.8,.8,'#ced2b8');
    e.box(132,-142,3,8,22,12,['#7e9398','#506e7d','#345568']);
    // Roof cable, scraps, utility luminaires and their wet reflections.
    e.line([[-145,-114,3.8],[-85,-92,3.8],[-35,-103,3.8],[4,-96,3.8],[77,-113,3.8]],'#253e4c',1.5);
    for(const x of [-149,151]){e.box(x-6,-168,20,12,4,8,['#a6b2a5','#485d69','#334b5a']);e.box(x-4,-163.8,22,8,.4,4,['#ebd092','#e6c386','#cfac6d']);e.patch(x,-150,3.5,13,21,'#d7b87a').setAttribute('opacity','.12');}
    for(let i=0;i<32;i++){const x=e.rand(-169,168),y=e.rand(-166,162);if(Math.abs(x)<110&&Math.abs(y)<100)continue;e.poly([[x,y,3.4],[x+3,y+.7,3.5],[x+2,y+4,3.5],[x-1,y+3,3.4]],e.pick(['#859590','#b0b5a2','#344d58']));}
    // An oxidized aerial with aviation light.
    e.line([[146,-158,20],[146,-158,101]],'#506e7b',2);for(const z of [64,81,94]){e.line([[135,-158,z],[157,-158,z]],'#9aaca8',1);e.line([[146,-158,z-8],[153,-158,z]],'#627f88',.9);}
    e.lathe(146,-158,101,[[0,1.8],[3,1.8],[4,0]],['#c78970','#b17160']);
    gargoyle(e,-154,117,e.front);gargoyle(e,150,125,e.front);
    return e;
  }
  function cypress(e,x,y,h){
    e.tube([x,y,3],[x+1,y,h*.65],3,1,['#7d7154','#5b5e44','#938060']);
    for(let i=0;i<18;i++){const z=15+i*h*.043,r=(1-i/19)*10+2;e.cone(x+Math.sin(i*1.4)*1.3,y+Math.cos(i)*1.2,z,r,h*.24,['#506848','#5b7450','#354f3e','#698157'],e.back,7);}
  }
  function tiledRoof(e,x,y,z,w,d,rise,colors=['#b77954','#a26349','#cb9063','#995a43']){
    // Each bent barrel tile has a dark channel, convex cap and an overlapping lip.
    const cols=Math.ceil(w/5),rows=Math.ceil(Math.abs(d)/8),cw=w/cols,rd=d/rows;
    for(let row=rows-1;row>=0;row--)for(let col=0;col<cols;col++){
      const X=x+col*cw,Y=y+row*rd,Z=z+(row/rows)*rise,H=rise/rows;
      e.poly([[X,Y,Z],[X+cw,Y,Z],[X+cw,Y+rd,Z+H],[X,Y+rd,Z+H]],colors[1]);
      e.poly([[X+.4,Y,Z+.3],[X+cw*.5,Y,Z+1.2],[X+cw*.5,Y+rd+.35,Z+H+1.2],[X+.4,Y+rd+.35,Z+H+.3]],e.pick(colors));
      e.poly([[X+cw*.5,Y,Z+1.2],[X+cw-.2,Y,Z+.3],[X+cw-.2,Y+rd+.35,Z+H+.3],[X+cw*.5,Y+rd+.35,Z+H+1.2]],colors[col%2?0:2]);
      e.line([[X+.5,Y,Z+.4],[X+cw*.5,Y,Z+1.25],[X+cw-.3,Y,Z+.4]],'#dbab7a',.5);
    }
  }
  function roundWindow(e,x,y,z,w,h,color='#626657'){
    const r=w*.5,spring=z+h-r,pts=[[x,y,z],[x+w,y,z],[x+w,y,spring]];
    for(let i=0;i<=12;i++){const a=i*Math.PI/12;pts.push([x+w*.5+Math.cos(a)*r,y,spring+Math.sin(a)*r]);}e.poly(pts,color);
    e.line([...pts,pts[0]],'#ded0b2',1.5);return pts;
  }
  function assassin(){
    const e=new Environment('assassin',1502);e.paving('florence');
    const c=['#e1cfaf','#bba488','#9a876f'],white='#e4d7bd',green='#7c8876',pink='#bb9181';
    // Pale stone courses surround a warm, irregular brick terrace.
    for(const inset of [18,23])e.line([[-180+inset,-180+inset,3.1],[180-inset,-180+inset,3.1],[180-inset,180-inset,3.1],[-180+inset,180-inset,3.1],[-180+inset,-180+inset,3.1]],inset===18?'#e1cfab':'#8d927c',1.1);
    for(let i=0;i<4;i++){const a=i*Math.PI*.5;for(let j=0;j<10;j++){const x=-117+j*24,y=145;const X=x*Math.cos(a)-y*Math.sin(a),Y=x*Math.sin(a)+y*Math.cos(a);e.poly([[X-2,Y,3.2],[X,Y-2,3.2],[X+2,Y,3.2],[X,Y+2,3.2]],'#73816b');}}
    e.shadow(-79,-93,47,25,.14);e.shadow(113,-119,34,15,.12);
    e.box(-180,-180,3,360,9,15,c);e.masonry(-179,-170.8,4,358,13,['#c3b195','#b5a186','#cebb9d'],e.back,6,22);e.box(-182,-182,18,364,13,3,c);
    e.box(171,-169,3,9,285,15,c);e.box(169,-169,18,13,285,3,c);
    // Florentine campanile: inlaid green and rose marble, recessed panels and bifora.
    e.box(-133,-164,3,61,45,102,c);
    e.masonry(-133,-118.9,4,61,25,['#bdac91','#c8b69a','#ad997f'],e.back,7,18);
    for(const z of [28,62,99]){e.box(-135,-166,z,65,49,3,[white,'#cab99b','#a7957d']);e.box(-134,-165,z+3,63,47,1.5,[white,'#a4aa91','#8e987f']);}
    for(const x of [-131,-78])e.box(x,-122,30,4,4,69,[white,'#d8c8a9','#ab9c80']);
    for(const x of [-123,-105,-87]){
      e.poly([[x,-118.7,35],[x+11,-118.7,35],[x+11,-118.7,57],[x,-118.7,57]],green);
      e.poly([[x+1.5,-118.5,36.5],[x+9.5,-118.5,36.5],[x+9.5,-118.5,55.5],[x+1.5,-118.5,55.5]],white);
      e.poly([[x+3,-118.3,39],[x+8,-118.3,39],[x+8,-118.3,53],[x+3,-118.3,53]],pink);
      e.poly([[x+5.5,-118.1,43],[x+8,-118.1,46],[x+5.5,-118.1,49],[x+3,-118.1,46]],'#d5c3a6');
    }
    // Deep arched openings, slender central colonettes and a bronze bell.
    for(const x of [-124,-101]){
      roundWindow(e,x,-118.4,70,19,25,'#5e6658');
      e.line([[x+9.5,-118.1,71],[x+9.5,-118.1,90]],white,1.5);
      e.line([[x+3,-118.1,69],[x+16,-118.1,69]],white,1.3);
    }
    e.lathe(-113,-117,73,[[0,5],[2,4.3],[8,2.5],[10,2]],['#a68a4d','#796b3f','#c8ae6b']);e.line([[-113,-116,71],[-113,-116,76]],'#5b5438',1);
    // Side facade has its own marble panels and recessed windows.
    for(const z of [36,72])for(const y of [-157,-141]){
      e.poly([[-71.9,y,z],[-71.9,y+11,z],[-71.9,y+11,z+20],[-71.9,y,z+20]],green);
      e.poly([[-71.8,y+1.5,z+2],[-71.8,y+9.5,z+2],[-71.8,y+9.5,z+18],[-71.8,y+1.5,z+18]],z===72?'#626c5b':'#c6b298');
      e.line([[-71.6,y+5.5,z+2],[-71.6,y+5.5,z+18]],white,.9);
    }
    for(let i=0;i<12;i++)e.box(-133+i*5.3,-122,103,2.5,3,4,[white,'#b5a488','#9f9077']);
    e.box(-138,-169,107,71,55,4,[white,'#c5b497','#a28e74']);
    tiledRoof(e,-143,-111,111,81,-34,23);tiledRoof(e,-143,-179,111,81,34,23,['#9d654c','#82503f','#b27854','#aa6d4e']);
    e.tube([-143,-145,135],[-62,-145,135],1.7,1.7,['#ca966b','#a97152','#e0ad7c'],e.back,6);
    // A roofed Renaissance loggia with capitals, arch stones and corbelled eaves.
    for(let x=-44;x<132;x+=44){
      e.arch(x,-156,43,58,13,c);
      for(const X of [x+3,x+40]){e.box(X-5,-159,3,10,19,3,c);e.box(X-4,-157,36,8,15,3,c);e.lathe(X,-149,6,[[0,3],[2,2.5],[29,2.4],[31,3.8]],['#d8c7a8','#b5a68b','#9a8f76'],e.back,8);}
      for(let i=0;i<10;i++){const a=Math.PI-i/9*Math.PI; e.line([[x+21.5+Math.cos(a)*15.7,-142.7,41+Math.sin(a)*15.7],[x+21.5+Math.cos(a)*21.5,-142.7,41+Math.sin(a)*21.5]],'#f0dfbd',.5);}
    }
    e.box(-48,-160,61,183,24,4,c);for(let x=-45;x<135;x+=9)e.box(x,-139,57,3,5,4,c);
    tiledRoof(e,-53,-132,65,192,-39,14);e.tube([-54,-171,80],[140,-171,80],1.7,1.7,['#d8a177','#af7757','#c08a63']);
    e.banner(27,-139,58,24,42,'#904c3e');
    // A small embroidered lily, drawn as geometry instead of text.
    e.line([[39,-135.5,29],[39,-135.5,49]],'#d6bc80',1);e.poly([[39,-135.4,50],[35,-135.4,45],[39,-135.4,38],[43,-135.4,45]],'#d8bf85');for(const s of [-1,1])e.poly([[39,-135.4,39],[39+s*6,-135.4,45],[39+s*8,-135.4,40],[39+s*4,-135.4,35]],'#ccb17a');
    cypress(e,-154,-91,96);cypress(e,154,-161,103);
    // A lower tiled roof and shuttered service wall make the terrace feel inhabited.
    e.box(-177,12,3,25,67,17,c);tiledRoof(e,-180,9,20,30,74,12);e.line([[-178,83,33],[-150,83,33]],'#d1a176',1.5);
    for(let i=0;i<4;i++)e.box(-153,23+i*13,4,2,8,10,['#8e8b65','#6a7053','#565f47']);
    // Draped linen, crates, barrels and roof pottery at the side of the arena.
    for(const [x,y] of [[123,37],[169,37],[123,78],[169,78]])e.tube([x,y,3],[x,y,42],1.1,1.1,['#967b55','#6b6047','#b19b70']);
    for(let i=0;i<8;i++){
      const X=121+i*6;e.poly([[X,35,45],[X+6,35,45],[X+6,59,39],[X+6,83,39],[X,83,39],[X,59,39]],i%2?'#c8b18a':'#a36f53');
      e.poly([[X,83,39],[X+6,83,39],[X+5,83,35],[X+1,83,35]],i%2?'#c6ad83':'#96654c');
    }
    for(const [x,y,z] of [[138,55,3],[151,59,3],[146,61,17]]){e.box(x,y,z,14,14,14,['#b99b6b','#94764f','#7b6447']);for(let i=0;i<4;i++)e.line([[x+i*3.5,y+14.1,z],[x+i*3.5,y+14.1,z+14]],'#6d5c42',.5);e.line([[x,y+14.3,z],[x+14,y+14.3,z+14]],'#c4a479',1.2);}
    e.urn(-156,103,.8,e.back);e.urn(155,110,.8,e.back);
    for(const [x,y] of [[-156,73],[145,121]]){e.urn(x,y,.85,e.front);for(let i=0;i<7;i++)e.grass(x+e.rand(-3,3),y+e.rand(-3,3),19,.6,e.front,['#5a744c','#87915b','#697f50']);}
    e.box(-146,127,3,31,24,6,c,e.front);e.box(-144,129,9,27,20,7,['#9a9f70','#898b60','#657249'],e.front);e.box(-148,125,15,35,28,2,c,e.front);
    e.poly([[-144,129,17.1],[-117,129,17.1],[-117,149,17.1],[-144,149,17.1]],'#646849',e.front);
    for(let i=0;i<25;i++){const x=e.rand(-142,-120),y=e.rand(131,147);e.grass(x,y,18,.55,e.front);e.disk(x,y,24+e.rand(1,3),1.1,1.1,e.pick(['#c6ab87','#b4847b','#d1bc95']),e.front);}
    for(let i=0;i<42;i++){const x=e.rand(-170,169),y=e.rand(-165,170);if(Math.abs(x)>145||Math.abs(y)>145)e.patch(x,y,3.5,2,1.5,'#939773',e.back,5);}
    return e;
  }
  function palm(e,x,y,h){
    const c=['#a68a5b','#887347','#c2a372'],bend=[x-4,y-2,h*.55],top=[x+3,y-5,h];
    e.tube([x,y,3],bend,4,2.9,c);e.tube(bend,top,2.9,2.5,c);
    for(let z=8;z<h-3;z+=4.3){const u=z/h,X=x+(u<.55?-4*u/.55:-4+(u-.55)/.45*7),Y=y-u*5;for(let i=0;i<4;i++){const a=i*Math.PI*.5;e.poly([[X+Math.cos(a)*3,Y+Math.sin(a)*3,z],[X+Math.cos(a+.65)*3.5,Y+Math.sin(a+.65)*3.5,z+2.4],[X+Math.cos(a+1.3)*3,Y+Math.sin(a+1.3)*3,z]],i%2?'#8e764d':'#c3aa76');}}
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6,dx=Math.cos(a),dy=Math.sin(a),side=[-dy,dx],L=36+(i%3)*5;
      const point=u=>[top[0]+dx*L*u,top[1]+dy*L*u,top[2]+Math.sin(u*Math.PI)*12-u*u*24];
      const line=Array.from({length:11},(_,j)=>point(j/10));e.line(line,i%2?'#91a271':'#6e8c63',1);
      for(let j=1;j<13;j++){const u=j/14,b=point(u),width=Math.sin(u*Math.PI)*8.5;for(const s of [-1,1]){
        e.poly([b,[b[0]+side[0]*width*s+dx*3,b[1]+side[1]*width*s+dy*3,b[2]-4],[b[0]+dx*L*.06,b[1]+dy*L*.06,b[2]-.8]],(i+j+s)%3===0?'#7f9a65':s<0?'#487456':'#5e875e');
      }}
    }
    for(let i=0;i<4;i++)e.lathe(top[0]+Math.cos(i*1.57)*2,top[1]+Math.sin(i*1.57)*2,top[2]-4,[[0,1],[2,2],[4,1]],['#9c8b4e','#71683e'],e.back,6);
  }
  function palaceArch(e,x,y,w,h,depth){
    const c=['#e4d0a7','#c3a77c','#9f8966'],z=3,leg=h*.53,thick=7;
    // A pointed arch with a broad carved surround and visible soffit depth.
    const contour=(inset=0)=>{
      const X=x+w*.5,R=w*.5-inset,spring=z+leg;
      const a=[];for(let i=0;i<=20;i++){const u=i/20,q=(u-.5)*2;const zz=spring+(h-leg-inset)*Math.pow(1-Math.abs(q),.72);a.push([X+q*R,y+depth,zz]);}return a;
    };
    const outer=contour(),inner=contour(thick);
    for(const X of [x,x+w-thick]){e.box(X,y,z,thick,depth,leg,c);e.box(X-2,y-2,3,thick+4,depth+4,4,c);e.box(X-2,y-2,leg,thick+4,depth+4,4,c);}
    for(let i=0;i<20;i++){
      e.poly([outer[i],outer[i+1],inner[i+1],inner[i]],i%3?'#d9c49c':'#ead7b0');
      e.poly([inner[i],inner[i+1],add(inner[i+1],[0,-depth,0]),add(inner[i],[0,-depth,0])],i<10?'#aa946f':'#bba37b');
      e.line([outer[i],inner[i]],'#b9a27e',.45);
    }
    e.line(inner,'#5d9691',1.5);e.line(contour(3),'#c4a36b',.7);
    // Narrow geometric borders and inlaid column medallions.
    for(const X of [x+3.5,x+w-3.5]){
      for(let Z=15;Z<leg-5;Z+=10){e.poly([[X,y+depth+.2,Z-3],[X+2,y+depth+.2,Z],[X,y+depth+.2,Z+3],[X-2,y+depth+.2,Z]],'#5d8a80');e.poly([[X,y+depth+.3,Z-1.3],[X+1,y+depth+.3,Z],[X,y+depth+.3,Z+1.3],[X-1,y+depth+.3,Z]],'#d8be87');}
      e.line([[X-2.7,y+depth+.2,10],[X-2.7,y+depth+.2,leg-3]],'#d9c28f',.7);
    }
    return inner;
  }
  function lattice(e,x,y,z,w,h){
    e.poly([[x,y,z],[x+w,y,z],[x+w,y,z+h],[x,y,z+h]],'#716f58');
    for(let row=0;row<Math.floor(h/7);row++)for(let col=0;col<Math.floor(w/6);col++){
      const X=x+col*6+3,Z=z+row*7+3.5;e.poly([[X,y+.15,Z-2.7],[X+2.2,y+.15,Z],[X,y+.15,Z+2.7],[X-2.2,y+.15,Z]],'#c9b184');e.poly([[X,y+.3,Z-1.8],[X+1.2,y+.3,Z],[X,y+.3,Z+1.8],[X-1.2,y+.3,Z]],'#5e6e61');
    }
    e.line([[x,y+.4,z],[x+w,y+.4,z],[x+w,y+.4,z+h],[x,y+.4,z+h],[x,y+.4,z]],'#d8c49c',1.5);
  }
  function persia(){
    const e=new Environment('persia',1001);e.paving('palace');
    const c=['#e5cfaa','#c7ab80','#a18c68'];
    // A broad tessellated border, with sandstone repairs and eroded corners.
    for(let j=0;j<4;j++)for(let i=0;i<28;i++){
      const a=j*Math.PI/2,x=-154+i*11.4,y=154,rot=(X,Y)=>[X*Math.cos(a)-Y*Math.sin(a),X*Math.sin(a)+Y*Math.cos(a),3.15];
      e.poly([[x-4,y],[x,y-4],[x+4,y],[x,y+4]].map(([X,Y])=>rot(X,Y)),i%2?'#b49a64':'#5d9390');
      e.poly([[x-1.6,y],[x,y-1.6],[x+1.6,y],[x,y+1.6]].map(([X,Y])=>rot(X,Y)),'#e7d0a4');
    }
    for(const inset of [19,32])e.line([[-180+inset,-180+inset,3.2],[180-inset,-180+inset,3.2],[180-inset,180-inset,3.2],[-180+inset,180-inset,3.2],[-180+inset,-180+inset,3.2]],'#c3a264',1.4);
    // Eight-point stone and turquoise medallion, kept low contrast beneath combat.
    const star=(R,r,z=3.3)=>Array.from({length:16},(_,i)=>{const a=i*Math.PI/8;return[Math.cos(a)*(i%2?r:R),Math.sin(a)*(i%2?r:R),z];});
    e.poly(star(86,64),'#b79e75');e.poly(star(83,61),'#719a8c');e.poly(star(79,57),'#d9c5a2');
    for(let i=0;i<8;i++){const a=i*Math.PI/4,b=a+Math.PI/8,d=a-Math.PI/8;e.poly([[Math.cos(a)*76,Math.sin(a)*76,3.35],[Math.cos(b)*49,Math.sin(b)*49,3.35],[Math.cos(a)*32,Math.sin(a)*32,3.35],[Math.cos(d)*49,Math.sin(d)*49,3.35]],i%2?'#c1ac85':'#cbb88f');}
    e.line([...star(47,33),star(47,33)[0]],'#bda16c',1);e.poly(star(19,8),'#73978b');e.poly(star(14,6),'#d5c099');
    // Narrow water rills at the edges leave the playable centre uninterrupted.
    for(const x of [-162,162]){
      e.box(x-4,-105,2.8,8,207,1.8,['#8b9b87','#a58f65','#8a805e']);e.poly([[x-2.5,-104,4.7],[x+2.5,-104,4.7],[x+2.5,101,4.7],[x-2.5,101,4.7]],'#5c9b99');
      for(let y=-99;y<99;y+=12)e.line([[x-1.6,y,4.8],[x+1.8,y+6,4.8]],'#b3ccba',.5);
    }
    e.shadow(-67,-99,65,26,.12);e.shadow(106,-113,46,21,.14);
    // Richly patterned palace screens sit behind the carved arcade.
    for(const x of [-121,-27,67]){
      e.box(x-4,-168,3,86,8,101,c);e.masonry(x-4,-159.8,4,86,99,['#c3ac85','#ccb58d','#bba47f'],e.back,11,21);
      lattice(e,x+10,-159.5,12,54,47);
      const pts=[];for(let i=0;i<=24;i++){const u=i/24;pts.push([x+9+56*u,-159.4,59+30*Math.pow(1-Math.abs(u-.5)*2,.72)]);}e.poly([[x+9,-159.4,58],...pts,[x+65,-159.4,58]],'#697769');
      for(let i=0;i<8;i++){const X=x+15+i*6;e.line([[X,-159.1,60],[X,-159.1,66+17*Math.sin((i+1)/9*Math.PI)]],'#bea674',.7);}
      // Gathered emerald fabric echoes the palace's draped garden pavilions.
      for(const side of [-1,1]){
        const X=x+(side<0?10:64);e.poly([[X,-157,86],[X-side*14,-157,79],[X-side*5,-157,51],[X-side*2,-157,25],[X+side*4,-157,24]],side<0?'#5b806b':'#496e61');
        e.line([[X-side*2,-156.8,83],[X-side*7,-156.8,77],[X-side*2,-156.8,51],[X+side,-156.8,27]],'#9eaa7b',.65);
        e.line([[X-side*4,-156.6,52],[X+side*1,-156.6,52]],'#d5b777',1.3);
      }
      palaceArch(e,x,-151,76,101,14);
      e.box(x-7,-162,106,90,30,5,c);e.box(x-8,-163,111,92,32,2,['#e8d5ae','#c9b087','#ab966f']);
      // Repeating carved frieze below the roof line.
      for(let i=0;i<14;i++){const X=x-4+i*6;e.poly([[X,-131.8,107],[X+3,-131.8,109.5],[X+5.5,-131.8,107],[X+3,-131.8,106]],'#7c9b88');}
      for(let i=0;i<9;i++){const X=x-5+i*10;e.box(X,-157,113,6,19,4,c);e.cone(X+3,-147.5,117,4.2,4,c,e.back,4);}
    }
    // A ribbed turquoise dome and a gilded finial above the side pavilion.
    e.cylinder(105,-149,116,26,5,['#c8b18a','#e1cba5','#a68f69'],e.back,24);e.dome(105,-149,121,25,25,['#57958c','#3f7e7a','#78aa9b','#4e8c83']);
    for(let i=0;i<12;i++){const a=i*Math.PI/6;e.line(Array.from({length:13},(_,j)=>{const b=j*Math.PI/24;return[105+Math.cos(a)*Math.cos(b)*25, -149+Math.sin(a)*Math.cos(b)*25,121+Math.sin(b)*25];}),'#a6be9d',.65);}
    e.lathe(105,-149,146,[[0,2.5],[2,1.1],[4,1.7],[6,0.8],[10,0]],['#d9bc74','#a58b50','#e8d096'],e.back,8);
    // Palm fronds are feathered, arcing leaves instead of solid fans.
    palm(e,-151,-91,105);palm(e,154,-97,107);
    // Cascading two-tier fountain with carved basin and water ripples.
    e.lathe(7,-108,3,[[0,24],[2,24],[4,22],[7,22],[8,24]],c,e.back,16);e.disk(7,-108,11.1,20,20,'#5e9692');
    for(let i=0;i<16;i++){const a=i*Math.PI/8,x=7+Math.cos(a)*23,y=-108+Math.sin(a)*23;e.poly([[x-1,y,7],[x,y,9],[x+1,y,7],[x,y,5]],'#69998c');}
    e.lathe(7,-108,11,[[0,5],[3,3.5],[13,2.5],[15,11],[17,12],[19,12]],c,e.back,12);e.disk(7,-108,30.1,10,10,'#85b5a6');
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3,x=7+Math.cos(a)*11,y=-108+Math.sin(a)*11,n=e.line([], '#b9d3bd',.8,e.back,{'data-animated':'true'});
      e.animators.push(t=>{const pts=[];for(let j=0;j<7;j++){const u=j/6;pts.push([x+Math.cos(a)*u*3+Math.sin(t*3+u*7+i)*.3,y+Math.sin(a)*u*3,30-u*19]);}n.setAttribute('d',e.d(pts,false));n.setAttribute('opacity',(.55+Math.sin(t*4+i)*.13).toFixed(3));});
    }
    for(let i=0;i<3;i++){
      const ripple=e.line([],'#bdd0b5',.65,e.back,{'data-animated':'true'});e.animators.push(t=>{const u=(t*.35+i/3)%1,r=6+u*13;ripple.setAttribute('d',e.d(Array.from({length:25},(_,j)=>[7+Math.cos(j*Math.PI/12)*r,-108+Math.sin(j*Math.PI/12)*r,11.2]),false));ripple.setAttribute('opacity',((1-u)*.45).toFixed(3));});
    }
    // Low carved balustrade and a blue upholstered resting bench.
    for(let y=-68;y<112;y+=17){e.box(172,y,3,8,8,3,c);e.lathe(176,y+4,6,[[0,3],[2,2],[5,3],[9,2],[12,3]],c,e.back,8);}
    e.box(170,-69,18,12,191,3,c);
    e.box(132,49,3,24,51,9,c);e.box(133,49,12,23,51,4,['#729b8c','#447a76','#326666']);
    for(let y=52;y<99;y+=7)e.poly([[134,y,16.1],[143,y+3,16.1],[155,y,16.1],[143,y-3,16.1]],'#c5b079');
    for(const [x,y] of [[-146,128],[146,126]]){
      const p=e.front;e.lathe(x,y,3,[[0,9],[3,9],[5,6],[7,4],[10,2],[27,2],[29,5]],['#c5ad75','#987e4e','#dfc38a'],p);
      e.lathe(x,y,32,[[0,6],[3,7],[10,5],[13,3],[15,0]],['#d8b477','#af8c51','#efd09a'],p,8);
      for(let i=0;i<8;i++){const a=i*Math.PI/4;e.line([[x+Math.cos(a)*6,y+Math.sin(a)*6,35],[x+Math.cos(a)*4,y+Math.sin(a)*4,43]],'#7d754d',.65,p);}
    }
    for(const [x,y,s] of [[-148,65,1],[-150,86,.7],[149,123,.8]])e.urn(x,y,s,x+y>100?e.front:e.back);
    // Sand, broken masonry and planting soften the pristine geometric patterns.
    for(let i=0;i<60;i++){const x=e.rand(-174,174),y=e.rand(-170,168);if(Math.abs(x)<138&&Math.abs(y)<130)continue;e.patch(x,y,3.6,e.rand(1,5),e.rand(1,3),e.pick(['#b6a27a','#dcc49a','#a8ab7b']),e.back,6);}
    for(const [x,y] of [[-160,-115],[-166,-74],[158,-62],[-163,15],[164,26]])for(let i=0;i<5;i++)e.grass(x+e.rand(-4,4),y+e.rand(-5,5),3,e.rand(.5,1.1),e.back,['#6c885d','#8d9a67','#50764f']);
    for(let i=0;i<10;i++){const x=-163+e.rand(-6,10),y=-21+e.rand(-13,13);e.rock(x,y,e.rand(2,4.5),e.rand(4,7),['#dbc39b','#af9976','#c5ac84']);}
    return e;
  }
  window.WorldArt={Environment,build:{tsushima,arkham:gotham,assassin,persia}};
})();
