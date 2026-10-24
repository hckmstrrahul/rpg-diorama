/* All artwork is SVG geometry. No canvas, WebGL, images, fonts or runtime libraries. */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.getElementById('scene');
  let activeTheme=null;const midgardEntities=[];
  const S = 1.66, OX = 600, OY = 485, DURATION = 18;
  const el = (tag, attrs = {}, parent = svg) => { const n = document.createElementNS(NS, tag); for (const [k,v] of Object.entries(attrs)) n.setAttribute(k,v); parent.appendChild(n); return n; };
  const p = ([x,y,z = 0]) => [OX + (x-y)*.8660254*S, OY + (x+y)*.5*S - z*S];
  const fmt = n => Math.round(n*100)/100;
  const path = pts => pts.map((v,i) => {const q=p(v);return `${i?'L':'M'}${fmt(q[0])},${fmt(q[1])}`;}).join('')+'Z';
  const line = pts => pts.map((v,i) => {const q=p(v);return `${i?'L':'M'}${fmt(q[0])},${fmt(q[1])}`;}).join('');
  let seed = 71819;
  const rand = () => {seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const rng=(a,b)=>a+rand()*(b-a), pick=a=>a[Math.floor(rand()*a.length)];
  const mix=(a,b,t)=>a+(b-a)*t, clamp=t=>Math.max(0,Math.min(1,t));
  const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
  const vec=(a,b)=>a.map((v,i)=>v+b[i]), sub=(a,b)=>a.map((v,i)=>v-b[i]), mul=(a,s)=>a.map(v=>v*s);
  const norm=a=>mul(a,1/(Math.hypot(...a)||1));
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const defs=el('defs');
  // Project the actual static geometry onto a lower receiving plane. The light
  // comes from screen upper-left; taller objects cast longer shadows to the right.
  const castGradient=el('linearGradient',{id:'cast-shadow-fade',gradientUnits:'userSpaceOnUse',x1:720,y1:400,x2:1260,y2:790},defs);
  for(const [offset,opacity] of [[0,.8],[.45,.38],[1,0]])el('stop',{offset,'stop-color':'#41463f','stop-opacity':opacity},castGradient);
  for(const [id,blur] of [['cast-shadow-near',8],['cast-shadow-soft',22]]){
    const filter=el('filter',{id,filterUnits:'userSpaceOnUse',x:-240,y:-180,width:1900,height:1450,'color-interpolation-filters':'sRGB'},defs);
    el('feGaussianBlur',{stdDeviation:blur},filter);
  }
  function castPath(points){
    if(points.length<3||!points.some(v=>v[2]>5||v[2]<0))return '';
    const projected=points.map(([x,y,z=0])=>{const h=Math.max(0,z+18);return [x+h*1.15,y-h*.35,-18];});
    // Consistent winding gives one solid silhouette, without overlap seams.
    const area=projected.reduce((sum,v,i)=>{const w=projected[(i+1)%projected.length];return sum+v[0]*w[1]-w[0]*v[1];},0);
    if(area<0)projected.reverse();return path(projected);
  }
  function paintCast(parent,paths){
    const d=paths.join('');
    // A broad penumbra carries the shape; a faint inner layer anchors the island.
    el('path',{d,fill:'url(#cast-shadow-fade)',opacity:.12,filter:'url(#cast-shadow-soft)'},parent);
    el('path',{d,fill:'url(#cast-shadow-fade)',opacity:.045,filter:'url(#cast-shadow-near)'},parent);
  }
  const environmentShadow=el('g',{id:'environment-shadow','pointer-events':'none','aria-hidden':'true'}),midgardCasts=[];
  const ground=el('g',{id:'ground'}), backdrop=el('g',{id:'backdrop'}), shadows=el('g',{id:'shadows'}), actors=el('g',{id:'actors'}), effects=el('g',{id:'effects','pointer-events':'none'}), front=el('g',{id:'foreground'});
  const poly=(pts,fill,parent=ground,attrs={})=>{const cast=castPath(pts);if(cast)midgardCasts.push(cast);return el('path',{d:path(pts),fill,...attrs},parent);};
  const stroke=(pts,color,width=.65,parent=ground,attrs={})=>el('path',{d:line(pts),fill:'none',stroke:color,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round',...attrs},parent);
  const flat=(x,y,w,h,z=0)=>[[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z]];
  function box(x,y,z,w,d,h,colors,parent=ground){
    poly([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]],colors[1],parent);
    poly([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],colors[2],parent);
    poly(flat(x,y,w,d,z+h),colors[0],parent);
  }
  function ellipseWorld(x,y,rx,ry,z,color,parent=ground,attrs={}){return poly(Array.from({length:48},(_,i)=>{const a=i/48*Math.PI*2;return[x+Math.cos(a)*rx,y+Math.sin(a)*ry,z];}),color,parent,attrs);}
  // An irregular cut of earth, stone and frosted moss. The seed makes exports reproducible.
  const boundary=[];
  for(let i=0;i<=24;i++)boundary.push([-181+i*15.1,-184+rng(-3,3),-1]);
  for(let i=0;i<=24;i++)boundary.push([183+rng(-3,3),-181+i*15.1,-1]);
  for(let i=0;i<=24;i++)boundary.push([181-i*15.1,184+rng(-3,3),-1]);
  for(let i=0;i<=24;i++)boundary.push([-183+rng(-3,3),181-i*15.1,-1]);
  for(let i=24;i<72;i++){let a=boundary[i],b=boundary[i+1];poly([a,b,[b[0],b[1],-12-rand()*4],[a[0],a[1],-13-rand()*4]],pick(['#5d6250','#696b56','#73735c','#777963','#656a55']));}
  poly(boundary,'#7e8870');
  for(let i=0;i<3800;i++){
    const x=rng(-187,187),y=rng(-187,187);if(Math.abs(x)<157&&Math.abs(y)<157)continue;
    poly(flat(x,y,rng(.7,3),rng(.7,3),rng(0,1)),pick(['#667858','#758764','#8a9878','#9da58a','#aeb39a','#586e51','#bbc2aa','#c6cbbb']));
  }
  // Laid stone slabs: individually chipped edges, shallow bevels, veins and lichen.
  box(-159,-157,-1,318,314,3,['#59645e','#515c54','#404d47']);
  for(let row=0;row<12;row++)for(let col=0;col<12;col++){
    const x=-157+col*26.2,y=-155+row*25.8,w=24.7,d=24.4,z=2+rng(-.2,.7);
    const c=pick(['#8c9588','#929b90','#a2a89b','#89958a','#a0a699','#97a192','#90998b','#a9ad9f']);
    const pts=[[x+1,y+1,z],[x+w-2,y,z],[x+w,y+3,z],[x+w-1,y+d-2,z],[x+w-4,y+d,z],[x+1,y+d-1,z],[x,y+3,z]];
    poly(pts,c);stroke([pts[0],pts[1],pts[2]],'#c4c8b6',.6);stroke([pts[3],pts[4],pts[5]],'#68796e',.7);
    for(let j=0;j<5;j++)poly(flat(x+rng(2,w-4),y+rng(2,d-4),rng(.4,2.8),rng(.4,1.5),z+.1),pick(['#849184','#b4bcaa','#7c897b','#c1c6b4']));
    if(rand()<.4){const k=rng(5,17);stroke([[x+k,y,z+.2],[x+k-3,y+7,z+.2],[x+k+2,y+11,z+.2],[x+k,y+17,z+.2]],'#66796c',.65);}
  }
  // Inlaid circular sanctuary and broken radial runes.
  for(const r of [110,107,91,88]){
    const points=Array.from({length:101},(_,i)=>[Math.cos(i/100*Math.PI*2)*r,Math.sin(i/100*Math.PI*2)*r,3.1]);
    stroke(points,r===107||r===88?'#b6bdab':'#6c7d70',r===110?1.6:.85);
  }
  for(let i=0;i<24;i++){
    const a=i/24*Math.PI*2;const tr=(u,v)=>[(98+u)*Math.cos(a)-v*Math.sin(a),(98+u)*Math.sin(a)+v*Math.cos(a),3.2];
    stroke([tr(-4,0),tr(4,0)],'#657b70',1.05);stroke([tr(-3,0),tr(0,-3),tr(2,0),tr(4,3)],'#657b70',1.05);
  }
  const omega=[];for(let i=0;i<=32;i++){const a=-.2*Math.PI+i/32*1.4*Math.PI;omega.push([Math.cos(a)*24,Math.sin(a)*24,3.2]);}stroke(omega,'#778e80',2.4);
  stroke([[-25,-14,3.2],[-29,-20,3.2],[-17,-20,3.2]],'#778e80',2.4);stroke([[25,-14,3.2],[29,-20,3.2],[17,-20,3.2]],'#778e80',2.4);
  // Moss spilling into the paving, and little pockets of snow.
  for(let i=0;i<650;i++){
    let x=rng(-180,180),y=rng(-180,180);if(Math.abs(x)<131&&Math.abs(y)<130)continue;
    if(rand()>.5)poly(flat(x,y,rng(1,4.5),rng(.7,3),3.3),pick(['#70856a','#7d916e','#8a9e7c','#a8b79a']));
    else if(x+y<20)poly(flat(x,y,rng(1.5,5.5),rng(1,4),3.4),pick(['#e2e7dc','#eaf0e5','#d3ded3']));
  }
  function rock(x,y,r,h,parent=backdrop){
    const pts=[[x-r,y-r*.4,2],[x-r*.2,y-r,2],[x+r*.8,y-r*.5,2],[x+r,y+r*.3,2],[x+r*.2,y+r,2],[x-r*.7,y+r*.6,2]];
    const top=pts.map(v=>[x+(v[0]-x)*.65,y+(v[1]-y)*.65,h+rng(-1,1)]);
    for(let i=0;i<6;i++)poly([pts[i],pts[(i+1)%6],top[(i+1)%6],top[i]],['#8e9989','#a6ad9b','#8b9788','#65796c','#738471','#96a28d'][i],parent);
    poly(top,'#b2bba7',parent);poly(top.slice(0,4).map(v=>[v[0],v[1],v[2]+.2]),'#dce5d6',parent);
  }
  function pine(x,y,h,w,parent=backdrop){
    ellipseWorld(x+14,y+10,w*.9,w*.5,3,'#455c48',ground,{opacity:.15});
    box(x-2.2,y-2.2,0,4.4,4.4,h*.7,['#8c8970','#655f4e','#4e5d49'],parent);
    for(let tier=0;tier<7;tier++){
      const z=12+tier*h*.105,r=w*(1-tier*.115),peak=z+h*.39;
      const ring=Array.from({length:12},(_,i)=>{const a=i/12*Math.PI*2;return[x+Math.cos(a)*r*(i%2?.84:1),y+Math.sin(a)*r*(i%2?.84:1),z+rng(-1.5,1.5)];});
      for(let i=0;i<12;i++)poly([ring[i],ring[(i+1)%12],[x+r*.04,y-r*.04,peak]],['#5f7b69','#628271','#52715f','#3c6052','#345a4c','#355849','#416451','#466b57','#65836b','#79917b','#7c9781','#698976'][i],parent);
      for(let j=0;j<7;j++){
        const a=j/7*Math.PI*2,rr=r*.7;const X=x+Math.cos(a)*rr,Y=y+Math.sin(a)*rr;
        poly([[X,Y,z+4],[X-Math.sin(a)*r*.17,Y+Math.cos(a)*r*.17,z+6],[x+Math.cos(a)*r*.3,y+Math.sin(a)*r*.3,z+h*.22],[X+Math.sin(a)*r*.13,Y-Math.cos(a)*r*.13,z+4]],pick(['#cbd9ce','#dde6da','#b7cbbf']),parent);
      }
    }
  }
  function pillar(x,y,h,parent=backdrop){
    box(x-13,y-13,2,26,26,5,['#b8bca6','#8f9a84','#768775'],parent);
    box(x-9,y-9,7,18,18,h,['#a6af9a','#8b9985','#718775'],parent);
    for(let z=17;z<h;z+=14){stroke([[x-9,y+9,z],[x+9,y+9,z],[x+9,y-9,z]],'#617e6d',.8,parent);}
    box(x-12,y-12,h+7,24,24,5,['#ccd0b9','#9fae95','#849780'],parent);
    poly([[x-12,y-12,h+12.2],[x+12,y-12,h+12.2],[x+12,y+3,h+12.2],[x-9,y+11,h+12.2]],'#e2e9dc',parent);
    if(h>45){stroke([[x+9.1,y-4,18],[x+9.1,y-4,h-7],[x+9.1,y+3,h-15],[x+9.1,y-4,h-24]],'#a9c4ad',1.7,parent);stroke([[x-4,y+9.1,28],[x-4,y+9.1,h-8],[x+3,y+9.1,h-18],[x-4,y+9.1,h-27]],'#becdb0',1.4,parent);}
  }
  // Background silhouettes are deliberately kept away from the combat floor.
  pine(-146,-170,115,31);pine(-95,-166,94,24);pine(158,-175,117,28);pine(174,-155,82,23);pine(-172,-84,89,24);
  for(let i=0;i<11;i++)box(-139+i*25,-137,3,24,16,rng(13,23),['#a7b39e','#869a83','#70866e'],backdrop);
  pillar(-113,-128,70);pillar(-35,-128,81);
  // A fractured lintel, with its missing piece resting by the wall.
  box(-126,-140,85,57,24,11,['#bdc7b0','#97aa91','#7e947c'],backdrop);
  box(-61,-140,94,39,24,10,['#c2c9b5','#92a58b','#789079'],backdrop);
  stroke([[-117,-115.8,90],[-106,-115.8,90],[-106,-115.8,94],[-98,-115.8,88],[-88,-115.8,92],[-80,-115.8,90]],'#c4d2b4',1.2,backdrop);
  pillar(132,-86,39);pillar(135,-28,18);rock(-131,-96,11,12);rock(-72,-113,13,8);rock(-156,58,15,14);rock(155,76,12,10);
  for(let i=0;i<28;i++){const x=rng(-155,155),y=-120+rng(-9,14);if(x>-19&&x<93)rock(x,y,rng(2,4),rng(3,7));}
  // Four matching braziers mark the corners of the paved courtyard.
  const fires=[];
  function brazier(x,y,parent=backdrop){
    const group=el('g',{class:'brazier','data-world-x':x,'data-world-y':y},parent);
    box(x-5,y-5,2,10,10,3,['#9ca993','#73816c','#627360'],group);
    box(x-1.7,y-1.7,5,3.4,3.4,18,['#6c6c51','#444e3e','#394737'],group);
    const bowl=Array.from({length:9},(_,i)=>[x+Math.cos(i/8*Math.PI*2)*7,y+Math.sin(i/8*Math.PI*2)*7,24]);
    poly(bowl,'#5c6250',group);for(let i=0;i<8;i++)poly([bowl[i],bowl[i+1],[x,y,19]],i<4?'#6e7155':'#3f5142',group);
    fires.push({x,y,node:el('g',{'data-flame':'true'},group)});
  }
  brazier(-145,-135);brazier(145,-135);
  function midgardEntity(x,y,draw){const node=el('g',{'data-prop':`midgard-${midgardEntities.length}`},actors);midgardEntities.push({node,x,y});draw(node);}
  // Edge dressing in front: low enough never to hide the fighters.
  midgardEntity(-155,112,n=>rock(-155,112,17,10,n));midgardEntity(154,105,n=>{rock(154,105,14,11,n);rock(149,114,7,6,n);});
  midgardEntity(92,149,n=>{box(74,141,2,35,10,7,['#b6c0aa','#82997f','#6e886e'],n);box(89,151,2,12,12,15,['#c6cdb9','#95a98c','#788e77'],n);});
  for(let i=0;i<95;i++){
    const x=rng(-180,180),y=rng(155,182),h=rng(1,5);stroke([[x,y,1],[x+rng(-2,2),y+rng(-1,1),h]],pick(['#819976','#687e5e','#a9b49b']),.8,front);
  }

  midgardEntity(-145,135,n=>brazier(-145,135,n));midgardEntity(145,135,n=>brazier(145,135,n));

  paintCast(environmentShadow,midgardCasts);

  // Dynamic geometry uses a little painter's algorithm over SVG paths.
  // The camera is orthographic; every point is projected by the same isometric basis.
  let mesh=[],meshOpacity=1,meshOwner=null;
  const actorLayers=new Map();let paintedOrder=[];
  function face(points,fill,strokeColor=null,width=.4){mesh.push({points,fill,stroke:strokeColor,width,opacity:meshOpacity,owner:meshOwner,depth:points.reduce((a,v)=>a+v[0]+v[1]+v[2],0)/points.length});}
  function solidBox(T,x,y,z,w,d,h,c){
    const q=[[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z],[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]].map(T);
    [[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]].forEach((f,i)=>face(f.map(j=>q[j]),c[i%c.length]));
  }
  function limb(T,a,b,ra,rb,colors,n=6){
    const axis=norm(sub(b,a));let u=norm(cross(axis,[0,1,.05])),v=cross(axis,u);
    const ring=(center,r)=>Array.from({length:n},(_,i)=>vec(center,vec(mul(u,Math.cos(i/n*Math.PI*2)*r),mul(v,Math.sin(i/n*Math.PI*2)*r))));
    const A=ring(a,ra).map(T),B=ring(b,rb).map(T);
    for(let i=0;i<n;i++)face([A[i],A[(i+1)%n],B[(i+1)%n],B[i]],colors[i%colors.length]);
    face(B,colors[0]);
  }
  function head(T,c,r,colors,n=8){
    const ring=(z,f)=>Array.from({length:n},(_,i)=>T([c[0]+Math.cos(i/n*Math.PI*2)*r*f,c[1]+Math.sin(i/n*Math.PI*2)*r*f,c[2]+z]));
    const A=ring(-r*.85,.68),B=ring(r*.3,1),C=ring(r*.9,.65);
    for(let i=0;i<n;i++){face([A[i],A[(i+1)%n],B[(i+1)%n],B[i]],colors[i%colors.length]);face([B[i],B[(i+1)%n],C[(i+1)%n],C[i]],colors[(i+1)%colors.length]);}face(C,colors[0]);
  }
  const skin=['#d4d1bf','#a8a99c','#c3c3af','#dfddc9','#ecead5','#bebfac'];
  const dead=['#8c9473','#657558','#818b69','#a7ab83','#b4b593','#7b8965'];
  const leather=['#655344','#4c4137','#7c6850','#8a7658','#5d4e3f','#6d5943'];
  const iron=['#84928a','#5c706a','#a6b7a9','#c4d0bb','#73887c','#8b9d8c'];
  const red=['#9e4338','#803b32','#b35344','#913c33','#bb5a49','#854237'];
  const boot=['#594d3b','#3e3c30','#75664b','#807252','#554c38','#62583f'];
  // Head geometry is scaled around the eye; the haft and grip keep their size.
  const axeHeadPoint=([x,y,z])=>[x*.8,y*.8,21+(z-21)*.8];
  const AXE={headScale:.8,pivot:[0,2.6,15],tip:axeHeadPoint([0,15,29]),contact:axeHeadPoint([0,12,24]),heel:axeHeadPoint([0,11,16]),trailInner:axeHeadPoint([0,7,22])};
  const THROW={release:7.41,firstHit:7.94,secondHit:8.47,catch:9.12,turns:3};
  function axe(T,hand,angle=0){
    const A=([x,y,z])=>T([hand[0]+x,hand[1]+y*Math.cos(angle)-z*Math.sin(angle),hand[2]+y*Math.sin(angle)+z*Math.cos(angle)]);
    const H=v=>A(axeHeadPoint(v));
    limb(A,[0,0,-7],[0,0,23],1.05,.85,['#92764d','#6b573d','#b79b69','#c6ad7c'],5);
    for(let z=-5;z<10;z+=3)limb(A,[0,0,z],[0,0,z+1],1.15,1.15,['#3c544d','#49645a','#638071'],5);
    solidBox(H,-1.8,-2,17,3.6,4,5,iron);
    const blade=[[-1,17],[5,15],[11,16],[15,21],[15,29],[11,28],[7,24],[-1,23]];
    face(blade.map(([y,z])=>H([1.8,y,z])),'#a0c0c1');
    face(blade.map(([y,z])=>H([-1.8,y,z])),'#d4e0d4');
    face([[1.8,11,16],[1.8,15,21],[1.8,15,29],[-1.8,15,29],[-1.8,15,21],[-1.8,11,16]].map(H),'#e4f7ec');
    face([[-1.85,5,19],[-1.85,9,18],[-1.85,12,22],[-1.85,12,25],[-1.85,8,22]].map(H),'#649dac');
    face([[1.85,5,19],[1.85,9,18],[1.85,12,22],[1.85,12,25],[1.85,8,22]].map(H),'#66b3c2');
  }
  function sword(T,hand,angle){
    const A=([x,y,z])=>T([hand[0]+x,hand[1]+y*Math.cos(angle)-z*Math.sin(angle),hand[2]+y*Math.sin(angle)+z*Math.cos(angle)]);
    limb(A,[0,0,-3],[0,0,5],.9,.9,leather,5);solidBox(A,-3,-1,4,6,2,1.3,iron);
    face([[-1.8,0,5],[1.8,0,5],[1.3,0,25],[0,0,29]].map(A),'#9caa98');face([[-1.8,0,5],[0,0,5],[0,0,29],[-1.5,0,25]].map(A),'#c7cdb7');
    face([[.2,.1,7],[.7,.1,7],[.6,.1,24],[.2,.1,25]].map(A),'#dd8f48');
  }
  function shield(T,c,open=0){
    const n=12,r=(6.5+open*2)*1.2;
    const A=Array.from({length:n},(_,i)=>T([c[0]-1,c[1]+Math.cos(i/n*Math.PI*2)*r,c[2]+Math.sin(i/n*Math.PI*2)*r]));
    for(let i=0;i<n;i++){face([A[i],A[(i+1)%n],T([c[0]-3,c[1],c[2]])],i%2?'#957f52':'#b59a60');}
    head(T,[c[0]-3.2,c[1],c[2]],1.5,['#aab2a0','#6e8277','#c8c7a8'],6);
  }
  // Anatomical meshes, rigid bone lengths, and a two-bone IK solve for each limb.
  const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
  const lerp3=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
  const rotZ=(v,a)=>[v[0]*Math.cos(a)-v[1]*Math.sin(a),v[0]*Math.sin(a)+v[1]*Math.cos(a),v[2]];
  const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const shadeCache=new Map();
  function lit(points,color){
    const normal=norm(cross(sub(points[1],points[0]),sub(points[2],points[0])));
    if(normal[0]+normal[1]+normal[2]<-.001)return;
    const light=[-.24913644,-.49827288,.8304548];
    const level=Math.round((.77+Math.max(0,dot(normal,light))*.31)*28);
    const key=color+level;let fill=shadeCache.get(key);
    if(!fill){fill='#'+[1,3,5].map(i=>Math.min(255,Math.round(parseInt(color.slice(i,i+2),16)*level/28)).toString(16).padStart(2,'0')).join('');shadeCache.set(key,fill);}
    face(points,fill);
  }
  function loft(T,rings,color,n=10){
    const points=rings.map(([x,y,z,rx,ry])=>Array.from({length:n},(_,i)=>T([x+Math.cos(i/n*Math.PI*2)*rx,y+Math.sin(i/n*Math.PI*2)*ry,z])));
    for(let j=0;j<points.length-1;j++)for(let i=0;i<n;i++)lit([points[j][i],points[j][(i+1)%n],points[j+1][(i+1)%n],points[j+1][i]],color);
    lit(points.at(-1),color);
  }
  function muscle(a,b,radii,color,ref=[0,1,.07],n=8){
    const axis=norm(sub(b,a)),u=norm(cross(axis,ref)),v=cross(axis,u);
    const rings=radii.map(([t,r])=>Array.from({length:n},(_,i)=>vec(lerp3(a,b,t),vec(mul(u,Math.cos(i/n*Math.PI*2)*r),mul(v,Math.sin(i/n*Math.PI*2)*r*.88)))));
    for(let j=0;j<rings.length-1;j++)for(let i=0;i<n;i++)lit([rings[j][i],rings[j][(i+1)%n],rings[j+1][(i+1)%n],rings[j+1][i]],color);
    lit(rings.at(-1),color);
  }
  function ik(a,target,pole,l1,l2){
    const delta=sub(target,a),distance=Math.hypot(...delta),d=Math.min(l1+l2-.025,Math.max(Math.abs(l1-l2)+.025,distance));
    const axis=norm(delta),end=vec(a,mul(axis,d)),hint=sub(pole,a),bend=norm(sub(hint,mul(axis,dot(hint,axis))));
    const along=(l1*l1-l2*l2+d*d)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-along*along));
    return {a,b:vec(a,vec(mul(axis,along),mul(bend,height))),end,lengths:[l1,l2],reachError:Math.abs(distance-d)};
  }
  function samplePose(t,keys){
    if(t<=keys[0][0])return keys[0][1];if(t>=keys.at(-1)[0])return keys.at(-1)[1];
    let i=0;while(t>keys[i+1][0])i++;
    const [a,A]=keys[i],[b,B]=keys[i+1],u=smooth((t-a)/(b-a));
    return Object.fromEntries(Object.keys(A).map(k=>[k,Array.isArray(A[k])?lerp3(A[k],B[k],u):mix(A[k],B[k],u)]));
  }
  const guard={hip:-.12,twist:.12,lean:.07,bank:0,crouch:1.1,shift:0,rh:[9,8,29],lh:[-9,11,32],weapon:-.22,weaponYaw:.12,shield:0};
  const pose=(base,changes)=>({...base,...changes});
  function action(t,start,keys,current){
    if(t<start||t>start+keys.at(-1)[0])return current;
    return samplePose(t-start,keys.map(([dt,v])=>[dt,pose(current,v)]));
  }
  function poseAt(id,t){
    const hero=id===0,phase=t/18*Math.PI*2*6+id*2;
    let q=pose(guard,{crouch:1.1+Math.sin(phase)*.18,lean:hero?.07:.16,rh:hero?[9,8,29]:[8,10,30],lh:hero?[-9,11,32]:[-9,7,28]});
    if(hero){
      q=action(t,1.72,[[0,{}],[.23,{hip:-.4,twist:-.65,lean:-.05,crouch:2.5,rh:[11,-7,49],lh:[-7,10,35],weapon:.85}], [.36,{hip:-.05,twist:-.15,lean:.12,crouch:2,rh:[7,10,47],weapon:-.2}], [.43,{hip:.3,twist:.62,lean:.23,crouch:3,rh:[2,18,34],lh:[-9,7,37],weapon:-1.55}], [.56,{hip:.4,twist:.9,lean:.25,crouch:4,rh:[-11,12,27],lh:[-12,4,36],weapon:-1.8}], [.83,{hip:.2,twist:.5,lean:.16,crouch:2.7,rh:[-5,9,27],weapon:-1.1}], [1.18,{}]],q);
      q=action(t,3.12,[[0,{}],[.22,{hip:.28,twist:.7,bank:-.12,crouch:3,rh:[-9,8,47],lh:[-7,9,34],weapon:.65,weaponYaw:-.3}], [.43,{hip:-.3,twist:-.55,lean:.22,bank:.08,crouch:3.2,rh:[9,18,35],lh:[-8,7,35],weapon:-1.55,weaponYaw:.45}], [.59,{hip:-.4,twist:-.8,lean:.21,rh:[14,7,26],lh:[-4,14,36],weapon:-1.6,weaponYaw:.4}], [.85,{hip:-.24,twist:-.3,rh:[12,6,27],weapon:-.9}], [1.15,{}]],q);
      q=action(t,4.72,[[0,{}],[.14,{crouch:5,lean:.2,bank:.16,lh:[-5,14,39],rh:[8,5,31],weapon:-.7}], [.38,{crouch:10,lean:.35,bank:.24,hip:.25,twist:-.2,lh:[-4,13,42],rh:[8,-3,35],weapon:.25}], [.65,{crouch:7,lean:.25,bank:-.1,lh:[-6,12,38],rh:[9,5,31]}],[1.12,{}]],q);
      q=action(t,6.03,[[0,{}],[.2,{crouch:3,hip:.2,twist:-.28,lean:.12,lh:[-3,16,40],rh:[10,-1,31],shield:1,weapon:.2}], [.28,{crouch:5,lean:-.11,hip:.3,twist:-.4,lh:[-2,12,40],rh:[11,-2,33],shield:1,weapon:.3}], [.5,{crouch:4,lean:.02,lh:[-4,15,40],shield:.8}], [.88,{}]],q);
      q=action(t,7.02,[[0,{}],[.24,{hip:-.4,twist:-.7,lean:.04,rh:[14,-6,37],lh:[-9,12,34],weapon:-1.1}], [.39,{hip:.3,twist:.6,lean:.12,rh:[3,18,39],lh:[-11,8,35],weapon:-1.5}], [.6,{hip:.3,twist:.78,lean:.16,rh:[-5,17,35],weapon:-1.5}], [.95,{rh:[6,15,34],weapon:-.6}], [1.55,{rh:[7,15,35],weapon:-.3}], [1.95,{rh:[7,15,37],weapon:-.1}], [2.10,{crouch:2.5,lean:-.06,rh:[9,11,35],weapon:.05}], [2.45,{}]],q);
      q=action(t,9.72,[[0,{}],[.48,{crouch:5,lean:.19,rh:[6,7,45],lh:[2,7,38],weapon:.12}], [.68,{crouch:5.5,lean:.12,rh:[4,1,57],lh:[3,2,50],weapon:.35}], [.95,{crouch:1,lean:-.05,rh:[3,-2,60],lh:[2,0,53],weapon:.4}], [1.17,{crouch:1.5,lean:.08,rh:[3,5,57],lh:[2,8,50],weapon:-.25}], [1.32,{crouch:8.5,lean:.3,hip:.1,twist:.1,rh:[2,18,43],lh:[2,12,48],weapon:-2.1}], [1.48,{crouch:9.5,lean:.3,rh:[2,17,43],lh:[2,11,48],weapon:-2.1}], [1.9,{crouch:7,lean:.23,rh:[5,14,38],lh:[-3,10,34],weapon:-1.5}], [2.65,{}]],q);
    } else {
      const start=id===1?5.87:4.6;
      q=action(t,start,[[0,{}],[.27,{crouch:3,twist:-.55,hip:-.25,lean:-.08,rh:[9,-4,49],lh:[-9,6,35],weapon:.7}], [.43,{crouch:4,twist:.6,hip:.3,lean:.24,rh:[4,19,35],lh:[-10,7,33],weapon:-1.6}], [.65,{crouch:5,twist:.85,lean:.31,rh:[-8,15,25],weapon:-1.9}], [1.02,{}]],q);
      const hits=id===1?[2.15,3.55,THROW.firstHit,11.12]:[THROW.secondHit,11.48];
      for(const at of hits)q=action(t,at,[[0,{}],[.07,{lean:-.4,bank:id===1?-.16:.2,twist:-.35,crouch:2,rh:[13,5,36],lh:[-14,7,39],weapon:.7}], [.22,{lean:-.46,bank:.12,twist:-.3,crouch:5,rh:[12,3,30],lh:[-12,9,35],weapon:.5}], [.48,{lean:-.2,crouch:7,rh:[10,10,26],lh:[-8,13,31]}], [.83,{lean:.2,crouch:4,rh:[8,10,28]}], [1.2,{}]],q);
    }
    return q;
  }
  // Footsteps are planned ahead in world coordinates. During stance a foot's
  // position is exactly constant; only the hip and knee move over that contact.
  function makeRig(id,t,live=null){
    const hero=id===0,q=live?{...live.pose,rh:[...live.pose.rh],lh:[...live.pose.lh]}:poseAt(id,t),base=live?live.base:motionAt(id,t),angle=base.angle;
    const jump=live?(live.jump||0):(hero&&t>10.4&&t<11.04?Math.sin((t-10.4)/.64*Math.PI)*18:0);
    const dodgeAir=live?0:(hero&&t>4.9&&t<5.45?Math.sin((t-4.9)/.55*Math.PI)*2.8:0);
    const feet=live?live.feet.map(f=>({...f,point:[...f.point]})):[-1,1].map(side=>footAt(id,side,t));
    if(!live&&jump>0){
      const u=(t-10.4)/.64,w=smooth(u/.12)*(1-smooth((u-.83)/.17));
      feet.forEach((f,i)=>{const side=i?1:-1,point=vec([base.x,base.y,3],rotZ([side*5,i?-6:7,3+jump+Math.sin(u*Math.PI)*(i?6:2)],angle));f.point=lerp3(f.point,point,w);f.planted=false;});
    }
    if(dodgeAir>0){feet.forEach(f=>{f.point[2]+=dodgeAir;f.planted=false;});}
    // Transfer weight over the supporting leg; pelvis and chest counter-rotate.
    const walking=clamp(base.speed/24)*(jump>0?0:1),forward=rotZ([0,1,0],angle);
    const stride=dot(sub(feet[1].point,feet[0].point),forward);
    const hipSwing=Math.max(-1,Math.min(1,stride/15))*.095*walking;
    q.hip+=hipSwing;q.twist-=hipSwing*.85;
    const balance=Math.max(-1,Math.min(1,(feet[0].point[2]-feet[1].point[2])/5));
    const weightShift=rotZ([balance*.8*walking,0,0],angle);
    q.rh=[q.rh[0],q.rh[1],q.rh[2]+balance*.35*walking];
    q.lh=[q.lh[0],q.lh[1],q.lh[2]-balance*.25*walking];
    // Leg reach also limits pelvis height, just as a character controller's IK does.
    let crouch=q.crouch+.45*walking*(1-clamp((feet[0].point[2]+feet[1].point[2]-12)/5));
    for(let i=0;i<feet.length;i++){const f=feet[i],offset=vec(rotZ([i?4:-4,0,0],angle+q.hip),weightShift);const d=Math.hypot(f.point[0]-base.x-offset[0],f.point[1]-base.y-offset[1]);const available=Math.sqrt(Math.max(25,26.8*26.8-d*d));crouch=Math.max(crouch,27+jump+dodgeAir-available-(f.point[2]-3));}
    const leanTravel=Math.min(1,base.speed/40)*.04;
    const P=v=>vec([base.x+weightShift[0],base.y+weightShift[1],3-crouch+jump+dodgeAir],rotZ(v,angle+q.hip));
    const C=v=>{
      let w=rotZ([v[0],v[1],v[2]-31],q.twist);
      const lean=q.lean+leanTravel;
      w=[w[0]+w[2]*Math.sin(q.bank),w[1]*Math.cos(lean)+w[2]*Math.sin(lean),w[2]*Math.cos(lean)-w[1]*Math.sin(lean)];
      return P([w[0],w[1],w[2]+31]);
    };
    const neck=C([0,0,47.5]);
    const H=v=>vec(neck,rotZ([v[0],v[1]+(v[2]-47.5)*q.lean*.2,v[2]-47.5],angle+q.hip*.3+q.twist*.16));
    const legs=feet.map((f,i)=>{const side=i?1:-1;return ik(P([side*4,0,27]),f.point,P([side*6,14,14]),13.6,13.4);});
    let rightTarget=C(q.rh),leftTarget=C(q.lh),aim=null,aimWeight=0;
    const windowWeight=(a,b,c,d)=>smooth((t-a)/(b-a))*(1-smooth((t-c)/(d-c)));
    // Contact poses solve to the opponent's chest; the windup and follow-through
    // remain authored. This prevents a dramatic swing that visibly misses its hit.
    if(hero&&!live){
      const slash=Math.max(windowWeight(2.0,2.11,2.2,2.43),windowWeight(3.4,3.53,3.6,3.83));
      const slam=windowWeight(10.88,11.04,11.25,11.65);
      if(slash>0||slam>0){
        aimWeight=Math.max(slash,slam);
        const opponent=track(slam>0?11.04:t,A),forward=norm([opponent[0]-base.x,opponent[1]-base.y,0]);
        const target=slam>0?vec([base.x,base.y,3.8],mul(forward,24)):[opponent[0],opponent[1],40];
        const contact=(slam>0?AXE.tip:AXE.contact).slice(1),length=Math.hypot(...contact);
        const direction=norm([forward[0]*(slam>0?.45:.984),forward[1]*(slam>0?.45:.984),slam>0?-.893:-.18]);
        const requestedHand=sub(target,mul(direction,length));
        const up=norm(sub([0,0,1],mul(direction,direction[2]))),s=contact[0]/length,c=contact[1]/length;
        const Y=sub(mul(direction,s),mul(up,c)),Z=vec(mul(direction,c),mul(up,s)),X=cross(Y,Z);
        aim={X,Y,Z};rightTarget=lerp3(rightTarget,requestedHand,aimWeight);
        if(slam>0)leftTarget=lerp3(leftTarget,sub(requestedHand,mul(Z,6.2)),slam);
      }
    }
    if(!hero&&!live){
      const start=id===1?5.87:4.6,w=windowWeight(start+.27,start+.41,start+.48,start+.68);
      if(w>0){
        const target=id===1?makeRig(0,t).arms[0].end:[...track(4.75,K),40];
        const forward=norm([target[0]-base.x,target[1]-base.y,0]),Z=norm([forward[0],forward[1],-.16]);
        const Y=norm(sub([0,0,1],mul(Z,Z[2]))),X=cross(Y,Z);
        rightTarget=lerp3(rightTarget,sub(target,mul(Z,27)),w);aim={X,Y,Z};aimWeight=w;
      }
    }
    if(live?.aim&&live.aim.weight>0){
      const {target,weight,twoHanded=false}=live.aim,contact=live.aim.point||(hero?AXE.contact:[0,0,27]);
      const forward=norm([target[0]-base.x,target[1]-base.y,0]);
      const direction=live.aim.direction||norm([forward[0],forward[1],-.18]);
      const length=Math.hypot(contact[1],contact[2]),requestedHand=sub(target,mul(direction,length));
      const up=norm(sub([0,0,1],mul(direction,direction[2]))),sin=contact[1]/length,cos=contact[2]/length;
      const Y=sub(mul(direction,sin),mul(up,cos)),Z=vec(mul(direction,cos),mul(up,sin));
      aim={X:cross(Y,Z),Y,Z};aimWeight=weight;rightTarget=lerp3(rightTarget,requestedHand,weight);
      if(twoHanded)leftTarget=lerp3(leftTarget,sub(requestedHand,mul(Z,6.2)),weight);
    }
    const arms=[-1,1].map(side=>ik(C([side*(hero?8.2:7.2),0,43.5]),side===1?rightTarget:leftTarget,C([side*19,-7,33]),hero?11.2:10.8,hero?10.5:10.2));
    const hand=arms[1].end;
    const normalWeapon=v=>{
      const a=q.weapon,local=rotZ([v[0],v[1]*Math.cos(a)-v[2]*Math.sin(a),v[1]*Math.sin(a)+v[2]*Math.cos(a)],q.weaponYaw);
      return sub(C(vec(q.rh,local)),C(q.rh));
    };
    // A sidearm release and catch keep the blade flat in the ground plane.
    if(hero&&!live){
      const flat=Math.max(smooth((t-7.18)/.23)*(1-smooth((t-THROW.release)/.16)),smooth((t-8.94)/.18)*(1-smooth((t-9.3)/.15)));
      if(flat>0){
        const theta=motionAt(0,THROW.release).angle+Math.PI/2-.3;
        aim={X:[0,0,1],Y:[Math.sin(theta),-Math.cos(theta),0],Z:[Math.cos(theta),Math.sin(theta),0]};aimWeight=flat;
      }
    }
    if(live&&live.flatWeight>0){
      const theta=live.flatAngle;
      aim={X:[0,0,1],Y:[Math.sin(theta),-Math.cos(theta),0],Z:[Math.cos(theta),Math.sin(theta),0]};aimWeight=live.flatWeight;
    }
    // Re-orthogonalize the blended grip frame so even transition frames keep the axe rigid.
    const Z=norm(aim?lerp3(normalWeapon([0,0,1]),aim.Z,aimWeight):normalWeapon([0,0,1]));
    const roughY=aim?lerp3(normalWeapon([0,1,0]),aim.Y,aimWeight):normalWeapon([0,1,0]);
    const X=norm(cross(roughY,Z)),Y=cross(Z,X);
    const weapon=v=>vec(hand,vec(mul(X,v[0]),vec(mul(Y,v[1]),mul(Z,v[2]))));
    return {id,t,q,base,angle,P,C,H,legs,arms,feet,weapon,hand,jump,crouch,live,axeVisible:live?live.axeVisible:!(t>THROW.release&&t<THROW.catch),opacity:live?.opacity??1,hp:live?.hp??1};
  }
  function character(r){
    if(activeTheme){activeTheme.drawCharacter(r,graphics);return r;}
    const {id,t,q,P,C,H,legs,arms,feet,angle,weapon}=r,hero=id===0;
    const flesh=hero?'#d7d2bd':'#879575',hide=hero?'#66513c':'#514c38',ref=rotZ([0,1,.08],angle);
    const ring=(T,c,rx,ry,h,color)=>loft(T,[[...vec(c,[0,0,-h*.8]),rx*.55,ry*.6],[...c,rx,ry],[...vec(c,[0,0,h*.65]),rx*.7,ry*.75]],color,10);
    // Proportioned legs: distinct thighs, knees, tapered calves and articulated boots.
    legs.forEach((leg,i)=>{
      const {a,b,end}=leg;
      muscle(a,b,[[0,3.6],[.36,3.7],[1,2.25]],hide,ref);
      muscle(b,end,[[0,2.45],[.28,2.8],[1,1.5]],'#685944',ref);
      const foot=feet[i],pitch=foot.planted?0:-Math.sin(foot.phase*Math.PI*2)*Math.pow(Math.sin(foot.phase*Math.PI),.7)*.3;
      const F=v=>vec(foot.point,rotZ([v[0],v[1]*Math.cos(pitch)-(v[2]-3)*Math.sin(pitch),v[1]*Math.sin(pitch)+(v[2]-3)*Math.cos(pitch)],foot.angle));
      loft(F,[[0,.8,0,2.0,3.5],[0,1,1.3,2.2,3.8],[0,.3,3.5,1.65,2.3],[0,-.2,5.1,1.4,1.6]],'#493f32',8);
      for(const u of [.25,.43,.61])muscle(lerp3(b,end,u),lerp3(b,end,u+.07),[[0,mix(2.7,1.6,u)+.16],[1,mix(2.7,1.6,u)+.16]],hero?'#998264':'#68664d',ref,8);
      muscle(lerp3(a,b,.84),lerp3(b,end,.12),[[0,2.55],[.5,2.8],[1,2.4]],'#695a41',ref,8);
    });
    loft(P,[[0,0,23,5.2,3.5],[0,0,27,6.2,3.9],[0,0,30,5.7,3.5]],hide,10);
    // Ribcage and abdomen have separate volume, so twisting doesn't bend the pelvis.
    loft(C,[[0,0,28.5,4.9,3.2],[0,0,33,5.4,3.3],[0,0,36,6.6,3.7],[0,0,40.5,8.1,3.9],[0,-.15,43.5,7.6,3.3],[0,-.1,46,3.3,2.2]],flesh,12);
    for(const side of [-1,1]){
      loft(C,[[side*3.5,2.9,37.5,2.6,1.1],[side*3.5,3.25,39.5,3.5,1.65],[side*3.5,2.5,42.8,3.3,1.1]],flesh,8);
      for(const z of [31.5,34,36])loft(C,[[side*1.45,3.05,z-.8,1.15,.48],[side*1.45,3.25,z+.3,1.15,.7],[side*1.45,3.05,z+1,1.0,.4]],hero?'#c9c3ad':'#879072',6);
    }
    muscle(C([0,0,44.5]),H([0,0,50]),[[0,2.65],[1,2.05]],flesh,ref,10);
    // Leather belt, layered panels and a cloth flap that follows the hips with lag.
    loft(P,[[0,0,27.5,6.25,3.9],[0,0,29,6.25,3.9]],'#514433',12);
    for(let i=0;i<10;i++){
      const a=i/10*Math.PI*2,b=(i+1)/10*Math.PI*2,lag=q.twist*.75+Math.sin(t/18*Math.PI*12)*.1;
      lit([[Math.cos(a)*6,Math.sin(a)*3.9,27.5],[Math.cos(b)*6,Math.sin(b)*3.9,27.5],[Math.cos(b)*6.9+lag,Math.sin(b)*4.8,19.5+i%2],[Math.cos(a)*6.9+lag,Math.sin(a)*4.8,19.5]].map(P),i%2?'#776047':'#554735');
    }
    if(hero){
      lit([[-2.1,4.2,27.5],[2.1,4.2,27.5],[2.8+q.twist,5.2,16.5],[-1.9+q.twist,5.2,17.8]].map(P),'#8f3d30');
      solidBox(P,-1.4,4,27.1,2.8,.7,2.3,['#a68c5b','#867047','#c0a674']);
      // Tattoo follows the actual surface of the near pectoral and shoulder.
      face([[-6.3,3.1,43.4],[-4.3,3.9,43.4],[-2.6,4.95,39.7],[-3.7,4.8,37.8],[-4.3,3.6,33.3],[-6.1,3.4,34.5],[-5.7,4.4,38.8]].map(C),'#a43c30');
      face([[-6.3,-2.8,43.4],[-4.3,-3.3,43.4],[-3.1,-3.8,37],[-4.8,-3.6,34],[-6.3,-3.4,38]].map(C),'#a43c30');
      face([[6.5,2.5,44],[4.8,3.7,44],[-4.7,3.5,29],[-2.3,3.9,29]].map(C),'#65503b');
      face([[6.5,-2.5,44],[4.8,-3.2,44],[-4.7,-3.5,29],[-2.3,-3.9,29]].map(C),'#5b4b38');
    }else{
      face([[-6.8,3,43],[6,3.2,41.5],[4.2,4,38],[-5.2,4,39]].map(C),'#535c43');
      for(const s of [-1,1])face([[-1.3,s*3.6,38],[-.2,s*3.85,35.7],[-1,s*3.55,33],[.1,s*3.5,31],[.8,s*3.6,33.5],[.6,s*3.8,36],[-.5,s*3.7,38]].map(C),'#d98c4c');
    }
    // Smaller, anatomically shaped head: jaw, cheekbones, brow and cranium.
    loft(H,[[0,.15,49.6,2.1,2.1],[0,.35,51.4,2.7,2.7],[0,.1,54,3.55,3.15],[0,-.1,56.5,3.4,3.1],[0,-.1,58.1,2.4,2.35],[0,-.1,58.6,1.1,1.3]],flesh,12);
    for(const side of [-1,1]){
      ring(H,[side*3.25,.1,53],.7,.7,1.2,flesh);
      face([[side*.65,3.23,54.5],[side*2.6,2.64,54.4],[side*2.55,2.83,53.9],[side*.7,3.38,54]].map(H),hero?'#736957':'#4f5a42');
      face([[side*.9,3.36,53.8],[side*2.05,3.0,53.8],[side*2.05,3.04,53.4],[side*.9,3.4,53.4]].map(H),hero?'#514d3f':'#f4ab59');
    }
    lit([[-.75,3.07,54.2],[.75,3.07,54.2],[.7,4.15,52.4],[0,4.3,52.1],[-.7,4.15,52.4]].map(H),flesh);
    if(hero){
      face([[-1.9,-1.2,58.2],[-.8,-1.6,58.5],[-.1,2.1,58.2],[-1.45,2.25,58.2]].map(H),'#b33e32');
      face([[-1.45,2.25,58.2],[-.1,2.1,58.2],[-1.0,3.2,56.4],[-1.5,3.15,54.4],[-2.25,2.95,53.6],[-2.6,2.5,55]].map(H),'#a2372d');
      face([[-2.4,-.8,58.1],[-2.2,.7,58.1],[-3.5,1.1,55.7],[-3.55,.3,53.1],[-3.3,-.6,53.1],[-3.6,-.4,55.3]].map(H),'#a53a2f');
      loft(H,[[0,1.8,48.2,1.2,1.4],[0,1.7,49.4,2.25,2.25],[0,1.2,51.3,2.8,2.6],[0,1.3,52.3,2.55,2.2]],'#554634',10);
      face([[-1.1,3.55,51.7],[1.1,3.55,51.7],[.9,3.9,51.3],[-.9,3.9,51.3]].map(H),'#39372b');
      for(const side of [-1,1])face([[side*2.8,1.5,53.4],[side*3.1,1.4,52.1],[side*2.5,3.0,50.5],[side*2.3,2.5,52.1]].map(H),'#5f4f3a');
    }else{
      loft(H,[[0,-.5,55.6,3.6,3],[0,-.6,57,3.6,2.9],[0,-.7,58,2.5,2.3]],'#4d5e45',10);
      lit([[-1,-1.4,57],[0,-2,61],[1.5,-.6,58],[1.7,.3,56]].map(H),'#737e5d');
    }
    // Deltoid, biceps, elbow and forearm volumes are attached to the solved skeleton.
    arms.forEach((arm,i)=>{
      const side=i?1:-1,{a,b,end}=arm;
      muscle(a,b,[[0,hero?3.65:2.9],[.32,hero?3.9:2.9],[.68,hero?3.2:2.4],[1,1.85]],flesh,ref,8);
      muscle(b,end,[[0,2.1],[.28,hero?2.65:2.15],[1,1.45]],flesh,ref,8);
      if(hero&&side===1)muscle(lerp3(a,b,-.04),lerp3(a,b,.4),[[0,4],[.4,4.5],[1,3.8]],'#66523a',ref,8);
      if(hero&&side===-1)muscle(lerp3(a,b,.25),lerp3(a,b,.43),[[0,3.95],[1,3.75]],'#a74333',ref,8);
      muscle(lerp3(b,end,.46),lerp3(b,end,.96),[[0,2.5],[1,1.9]],hide,ref,8);
      const W=v=>vec(end,rotZ(v,angle+q.hip+q.twist));ring(W,[0,.3,0],1.65,1.7,2.0,flesh);
    });
    if(hero){
      const hand=arms[0].end,theta=angle+q.hip+q.twist-q.shield*1.25;
      const W=v=>vec(hand,rotZ([v[0]-.6,v[1],v[2]+1],theta));shield(W,[0,0,0],q.shield*.4);
      if(r.axeVisible)axe(weapon,[0,0,0],0);
    }else sword(weapon,[0,0,0],0);
    return r;
  }

  const actorShadows=Array.from({length:3},()=>el('path',{fill:'#344f43',opacity:'.20'},shadows));
  const contactShadows=Array.from({length:6},()=>el('path',{fill:'#2f463b',opacity:'.33'},shadows));
  const shadowShape=(x,y,r,dy=0)=>path(Array.from({length:20},(_,i)=>{const a=i/20*Math.PI*2;return[x+10+Math.cos(a)*r,y+9+Math.sin(a)*r*.57,3.3];}));
  const flameNodes=fires.map(f=>Array.from({length:3},(_,j)=>el('path',{fill:['#d17433','#efa64d','#ffe1a0'][j]},f.node)));
  const fxPool=[];let fxCount=0;
  function fx(pts,fill,opacity=1,outline=null,width=1){
    let n=fxPool[fxCount];if(!n){n=el('path',{},effects);fxPool.push(n);}fxCount++;
    n.setAttribute('d',path(pts));n.setAttribute('fill',fill);n.setAttribute('opacity',fmt(opacity));n.setAttribute('stroke',outline||'none');n.setAttribute('stroke-width',width);
  }
  function arc(x,y,z,r,start,end,opacity,color='#bfe4e7',thickness=3){
    let pts=[];for(let i=0;i<=24;i++){let a=mix(start,end,i/24);pts.push([x+Math.cos(a)*r,y+Math.sin(a)*r,z+Math.sin(i/24*Math.PI)*7]);}
    for(let i=24;i>=0;i--){let a=mix(start,end,i/24);pts.push([x+Math.cos(a)*(r-thickness),y+Math.sin(a)*(r-thickness),z+Math.sin(i/24*Math.PI)*7]);}fx(pts,color,opacity);
  }
  function burst(t,start,x,y,frost=false){
    const dt=t-start;if(dt<0||dt>.7)return;
    const k=dt/.7;
    for(let i=0;i<18;i++){
      const a=i*2.39996,travel=(13+i%5*5)*k;
      const X=x+Math.cos(a)*travel,Y=y+Math.sin(a)*travel,Z=34+(i%4)*3+Math.sin(k*Math.PI)*(9+i%3*5)-k*17;
      const size=(1-k)*1.6+.2;
      fx([[X-size,Y,Z],[X,Y-size,Z+size*3],[X+size,Y,Z],[X,Y+size,Z-size]],frost?['#daeeee','#8dbfc6','#b6d8d8'][i%3]:['#e9cf94','#cd9a56','#f2dfb0'][i%3],1-k);
    }
  }
  const track=(t,keys)=>{
    let i=0;while(i<keys.length-2&&t>keys[i+1][0])i++;
    const a=keys[i],b=keys[i+1],q=smooth((t-a[0])/(b[0]-a[0]));return [mix(a[1],b[1],q),mix(a[2],b[2],q)];
  };
  const heading=(a,b)=>Math.atan2(-(b[0]-a[0]),b[1]-a[1]);
  const K=[[0,-50,30],[.65,-50,30],[1.5,-29,18],[1.92,-28,17],[2.16,-21,13],[2.85,-21,13],[3.3,-20,13],[3.56,-11,10],[4.05,-11,10],[4.65,-8,19],[4.88,-8,19],[5.17,-28,43],[5.46,-39,47],[5.9,-37,45],[6.2,-31,40],[6.75,-31,40],[7.32,-27,34],[9.4,-27,34],[10.25,-5,18],[10.55,5,10],[11.04,14,3],[12.2,14,3],[13.1,6,8],[14.2,-16,23],[15.8,-50,30],[18,-50,30]];
  const A=[[0,26,-13],[.8,26,-13],[1.6,8,-3],[2.15,8,-3],[2.38,19,-10],[2.85,19,-10],[3.33,16,-7],[3.55,16,-7],[3.82,30,-16],[4.4,30,-16],[5.3,8,5],[6.06,-12,23],[6.6,-12,23],[7.2,0,16],[7.7,15,6],[7.94,20,2],[8.19,32,-5],[8.6,32,-5],[9.5,39,-10],[11.12,39,-10],[11.49,62,-20],[12.7,62,-20],[14.2,40,-22],[16,26,-13],[18,26,-13]];
  const B=[[0,26,85],[.6,26,85],[2.2,22,65],[3.9,13,42],[4.65,6,34],[5.5,6,34],[6.5,9,41],[7.9,26,46],[8.47,26,46],[8.75,39,51],[8.95,39,51],[9.8,38,33],[11.48,38,33],[11.83,60,57],[12.9,60,57],[14.3,43,76],[16.1,26,85],[18,26,85]];
  const paths=[K,A,B],HZ=120;
  const motionTables=paths.map((keys,id)=>{
    let angle=heading(track(0,keys),track(0,id===0?A:K));const initial=angle,table=[];
    for(let i=0;i<=18*HZ;i++){
      const t=i/HZ,pt=track(t,keys);let target;
      if(id===0){const a=track(t,A),b=track(t,B),weight=smooth((t-4.05)/.6)*(1-smooth((t-9.3)/.7))*(1-.6*smooth((t-6.95)/.4)*(1-smooth((t-9.05)/.4)));target=lerp3([...a,0],[...b,0],weight);}
      else target=track(id===2&&t>4.6&&t<5.5?4.75:t,K);
      const desired=heading(pt,target),delta=angleDelta(angle,desired);
      angle+=Math.max(-3.8/HZ,Math.min(3.8/HZ,delta*(1-Math.exp(-11/HZ))));
      if(t>16.5)angle+=angleDelta(angle,initial)*smooth((t-16.5)/1.5);
      const before=track(Math.max(0,t-.015),keys),after=track(Math.min(18,t+.015),keys);
      table.push({x:pt[0],y:pt[1],angle,speed:Math.hypot(after[0]-before[0],after[1]-before[1])/.03});
    }
    table.at(-1).angle=initial;return table;
  });
  function motionAt(id,t){
    const f=clamp(t/18)*18*HZ,i=Math.min(18*HZ-1,Math.floor(f)),a=motionTables[id][i],b=motionTables[id][i+1],u=f-i;
    return {x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),angle:a.angle+angleDelta(a.angle,b.angle)*u,speed:mix(a.speed,b.speed,u)};
  }
  const stance=(id,side,t)=>{const b=motionAt(id,t);return vec([b.x,b.y,6],rotZ([side*(id===0?5.1:4.4),side===-1?4.5:-4.5,0],b.angle));};
  const footPlans=paths.map((_,id)=>{
    const plans=[[],[]],positions=[stance(id,-1,0),stance(id,1,0)],angles=[motionAt(id,0).angle,motionAt(id,0).angle],active=[null,null];
    let nextSide=0,readyAt=.1;
    for(let tick=0;tick<16.6*HZ;tick++){
      const t=tick/HZ;
      for(let i=0;i<2;i++)if(active[i]&&t>=active[i].end){positions[i]=active[i].to;angles[i]=active[i].toAngle;active[i]=null;}
      if(t<readyAt)continue;
      const b=motionAt(id,t),duration=Math.max(.115,Math.min(.32,.1+4.5/(b.speed+7)));
      const target=[stance(id,-1,t),stance(id,1,t)],errors=target.map((v,i)=>Math.hypot(v[0]-positions[i][0],v[1]-positions[i][1]));
      let side=!active[nextSide]&&errors[nextSide]>4.3?nextSide:!active[1-nextSide]&&errors[1-nextSide]>5?1-nextSide:-1;
      if(side<0&&!active[nextSide]&&Math.abs(angleDelta(angles[nextSide],b.angle))>.5)side=nextSide;
      if(side<0)continue;
      const end=t+duration,to=stance(id,side===0?-1:1,Math.min(16.6,end)),toAngle=motionAt(id,end).angle;
      const node={start:t,end,from:[...positions[side]],to,fromAngle:angles[side],toAngle,height:Math.min(6,3+b.speed*.035)};
      plans[side].push(node);active[side]=node;nextSide=1-side;
      readyAt=t+duration*(b.speed>35?.56:.94);
    }
    for(let i=0;i<2;i++){
      const to=stance(id,i===0?-1:1,0),last=plans[i].at(-1),from=last?last.to:positions[i];
      plans[i].push({start:16.85+i*.42,end:17.19+i*.42,from:[...from],to,fromAngle:last?last.toAngle:angles[i],toAngle:motionAt(id,0).angle,height:2.6});
    }
    return plans;
  });
  function footAt(id,side,t){
    const plans=footPlans[id][side===-1?0:1];let point=stance(id,side,0),angle=motionAt(id,0).angle,plantSince=0;
    for(const n of plans){
      if(t<n.start)break;
      if(t<n.end){
        const u=(t-n.start)/(n.end-n.start),q=smooth(u);
        point=lerp3(n.from,n.to,q);point[2]+=Math.pow(Math.sin(u*Math.PI),1.5)*n.height;
        return {point,angle:n.fromAngle+angleDelta(n.fromAngle,n.toAngle)*q,planted:false,phase:u,plantSince:n.end};
      }
      point=[...n.to];angle=n.toAngle;plantSince=n.end;
    }
    return {point:[...point],angle,planted:true,phase:0,plantSince};
  }
  function combatTime(t){
    for(const [at,hold] of [[2.15,.05],[3.55,.06],[6.3,.045],[THROW.firstHit,.035],[THROW.secondHit,.035],[11.04,.085]]){
      if(t>=at&&t<at+hold)return at;
      if(t>=at+hold&&t<at+hold+.16)return t-hold*(1-smooth((t-at-hold)/.16));
    }
    return t;
  }
  let throwRoute=null;
  const flatAxeVector=(v,theta)=>[v[2]*Math.cos(theta)+v[1]*Math.sin(theta),v[2]*Math.sin(theta)-v[1]*Math.cos(theta),v[0]];
  function axeFlightAt(time){
    const t=Math.max(THROW.release,Math.min(THROW.catch,time));
    if(!throwRoute){
      const launch=makeRig(0,THROW.release),catcher=makeRig(0,THROW.catch);
      const phase=motionAt(0,THROW.release).angle+Math.PI/2-.3;
      const spinAt=time=>phase+(time-THROW.release)/(THROW.catch-THROW.release)*Math.PI*2*THROW.turns;
      const strikePoint=(id,time)=>{
        const contact=makeRig(id,time).C([0,0,39]);
        return sub(contact,flatAxeVector(sub(AXE.contact,AXE.pivot),spinAt(time)));
      };
      const start=launch.weapon(AXE.pivot),first=strikePoint(1,THROW.firstHit),second=strikePoint(2,THROW.secondHit),end=catcher.weapon(AXE.pivot);
      const outside=[Math.max(first[0],second[0])+30,(first[1]+second[1])/2,(first[2]+second[2])/2];
      const returning=[Math.min(start[0],end[0])-18,Math.max(first[1],second[1])+24,(second[2]+end[2])/2];
      const nodes=[[THROW.release,start],[THROW.firstHit,first],[8.19,outside],[THROW.secondHit,second],[8.82,returning],[THROW.catch,end]];
      // Time-aware Hermite tangents give one continuous loop through both contacts.
      const tangents=nodes.map((node,i)=>{
        const a=nodes[Math.max(0,i-1)],b=nodes[Math.min(nodes.length-1,i+1)];
        return mul(sub(b[1],a[1]),1/(b[0]-a[0]));
      });
      throwRoute={nodes,tangents,phase};
    }
    const {nodes,tangents,phase}=throwRoute;
    let i=0;while(i<nodes.length-2&&t>nodes[i+1][0])i++;
    const [a,A]=nodes[i],[b,B]=nodes[i+1],u=(t-a)/(b-a),u2=u*u,u3=u2*u;
    const center=A.map((v,j)=>(2*u3-3*u2+1)*v+(u3-2*u2+u)*(b-a)*tangents[i][j]+(-2*u3+3*u2)*B[j]+(u3-u2)*(b-a)*tangents[i+1][j]);
    const spin=phase+(t-THROW.release)/(THROW.catch-THROW.release)*Math.PI*2*THROW.turns;
    // Only world-Z rotation: the entire axe stays horizontal, without a cartwheel.
    const transform=v=>vec(center,flatAxeVector(sub(v,AXE.pivot),spin));
    return {t,center,spin,transform,contact:transform(AXE.contact),normal:[0,0,1]};
  }
  function drawActor(r){meshOwner=r.id;character(r);meshOwner=null;}
  function flushMesh(){
    // Anatomical faces may interleave within one rig, never between two bodies.
    const batches=new Map();
    for(const f of mesh){const key=f.owner??'projectile';if(!batches.has(key))batches.set(key,[]);batches.get(key).push(f);}
    const order=[];
    for(const [key,faces] of batches){
      let layer=actorLayers.get(key);
      if(!layer){layer={node:el('g',{'data-actor':key},actors),pool:[]};actorLayers.set(key,layer);}
      const rig=rigState.find(r=>r.id===key);
      order.push({node:layer.node,depth:rig?rig.base.x+rig.base.y:faces.reduce((sum,f)=>sum+f.depth,0)/faces.length});
      faces.sort((a,b)=>a.depth-b.depth);
      faces.forEach((f,i)=>{
        let n=layer.pool[i];if(!n){n=el('path',{},layer.node);layer.pool.push(n);}
        const d=path(f.points);if(n._d!==d){n.setAttribute('d',d);n._d=d;}if(n._fill!==f.fill){n.setAttribute('fill',f.fill);n._fill=f.fill;}if(n._stroke!==f.stroke){n.setAttribute('stroke',f.stroke||'none');n._stroke=f.stroke;}
        n.setAttribute('stroke-width',f.width);n.setAttribute('opacity',f.opacity??1);
      });
      for(let i=faces.length;i<layer.pool.length;i++)layer.pool[i].setAttribute('opacity','0');
    }
    for(const [key,layer] of actorLayers)if(!batches.has(key))layer.node.setAttribute('display','none');else layer.node.setAttribute('display','inline');
    for(const entity of activeTheme?.environment.entities||midgardEntities)order.push({node:entity.node,depth:entity.x+entity.y});
    order.sort((a,b)=>a.depth-b.depth);
    const nodes=order.map(e=>e.node);
    if(nodes.length!==paintedOrder.length||nodes.some((n,i)=>n!==paintedOrder[i])){
      if(actors.replaceChildren)actors.replaceChildren(...nodes);else actors.children=nodes;
      paintedOrder=nodes;
    }
  }
  function drawFires(t){
    if(activeTheme){activeTheme.environment?.animate(t);return;}
    fires.forEach((f,i)=>{
      for(let j=0;j<3;j++){
        const sway=Math.sin(t/18*Math.PI*2*29+i*4+j*2)*1.4,h=10+Math.sin(t/18*Math.PI*2*37+j*3+i)*2-j*2;
        flameNodes[i][j].setAttribute('d',path([[f.x-4+j,f.y,24],[f.x-3+j,f.y+1,29],[f.x+sway,f.y,24+h],[f.x+1+j,f.y-1,28],[f.x+4-j,f.y,24]]));
      }
    });
  }
  function drawContacts(ct){
    rigState.forEach((r,id)=>r.feet.forEach((f,i)=>{
      const n=contactShadows[id*2+i],pt=f.point,height=Math.max(0,pt[2]-6);
      n.setAttribute('d',path(Array.from({length:16},(_,j)=>[pt[0]+Math.cos(j/16*Math.PI*2)*2.8,pt[1]+Math.sin(j/16*Math.PI*2)*2.5,3.3])));
      n.setAttribute('opacity',fmt(.32*Math.max(0,1-height/8)*(r.opacity??1)));
      const dt=ct-f.plantSince;
      if(dt>0&&dt<.24&&f.plantSince>.1&&r.base.speed>5)for(let j=0;j<4;j++){
        const u=dt/.24,a=j*2.399+id,dx=Math.cos(a)*(1+u*4),dy=Math.sin(a)*(1+u*4),z=3.5+Math.sin(u*Math.PI)*2;
        fx([[pt[0]+dx-.7,pt[1]+dy,z],[pt[0]+dx,pt[1]+dy-.7,z+1],[pt[0]+dx+.7,pt[1]+dy,z]],'#c0c4ae',(1-u)*.5);
      }
    }));
  }
  function drawSnow(t){
    if(activeTheme){activeTheme.drawAmbient(t,graphics);return;}
    const loop=((t%DURATION)+DURATION)%DURATION;
    for(let i=0;i<56;i++){
      // One or two falls per 18-second cycle; respawns fade out before wrapping.
      const phase=(loop/DURATION*(i%3===0?1:2)+i*.381966)%1;
      const X=Math.sin(i*13.4)*164+Math.sin(phase*Math.PI*2+i)*3+phase*9;
      const Y=Math.cos(i*7.7)*158+Math.sin(loop/DURATION*Math.PI*2+i)*2,Z=5+(1-phase)*110;
      const size=.45+(i%5)*.13,opacity=smooth(phase/.1)*(1-smooth((phase-.84)/.16))*(.48+(i%3)*.12);
      fx([[X-size,Y,Z],[X,Y-size,Z+size*.7],[X+size,Y,Z],[X,Y+size,Z-size*.7]],i%4?'#f0f5ed':'#dce8e3',opacity);
    }
  }
  let lastTime=0,rigState=[],flightState=null;
  function render(t){
    t=((t%DURATION)+DURATION)%DURATION;lastTime=t;mesh=[];fxCount=0;meshOpacity=1;hideHealthBars();
    const ct=combatTime(t);
    rigState=[0,1,2].map(id=>makeRig(id,ct));
    rigState.forEach(drawActor);
    const k=[rigState[0].base.x,rigState[0].base.y],a=[rigState[1].base.x,rigState[1].base.y],b=[rigState[2].base.x,rigState[2].base.y];
    flightState=ct>THROW.release&&ct<THROW.catch?axeFlightAt(ct):null;
    if(flightState){
      if(activeTheme)activeTheme.drawProjectile(flightState,graphics);else axe(flightState.transform,[0,0,0]);
      const outer=[],inner=[];
      for(let i=0;i<10;i++){
        const f=axeFlightAt(Math.max(THROW.release,ct-i*.012));
        outer.push(f.transform(AXE.tip));inner.push(f.transform(AXE.trailInner));
      }
      fx([...outer,...inner.reverse()],'#c2e6e8',.38);
      // A short wake makes the broad outbound and returning curves easy to read.
      const left=[],right=[];
      for(let i=0;i<12;i++){
        const sample=Math.max(THROW.release,ct-i*.018),f=axeFlightAt(sample),g=axeFlightAt(Math.max(THROW.release,sample-.006));
        const tangent=norm(sub(f.center,g.center)),side=[-tangent[1],tangent[0],0],width=(1-i/12)*1.5;
        left.push(vec(f.center,mul(side,width)));right.push(sub(f.center,mul(side,width)));
      }
      fx([...left,...right.reverse()],'#a8d3da',.30);
    }
    flushMesh();
    [k,a,b].forEach((v,i)=>{actorShadows[i].setAttribute('d',shadowShape(v[0],v[1],i===0?13:11));actorShadows[i].setAttribute('opacity','.20');});
    drawFires(t);
    // Blade trails sample the weapon's actual swept path, rather than an arbitrary arc.
    for(const [start,end] of [[2.02,2.42],[3.4,3.81],[10.93,11.28]])if(t>start&&t<end){
      const outer=[],inner=[];
      for(let i=0;i<8;i++){
        const r=makeRig(0,combatTime(Math.max(start,t-i*.017)));
        outer.push(r.weapon(AXE.tip));inner.push(r.weapon(AXE.trailInner));
      }
      fx([...outer,...inner.reverse()],'#d3eded',Math.sin((t-start)/(end-start)*Math.PI)*.44);
    }
    // Contact shadows and tiny landing puffs make planted feet legible at miniature scale.
    drawContacts(ct);
    burst(t,2.15,a[0]-3,a[1]+2,true);burst(t,3.55,a[0]-3,a[1]+2,true);burst(t,6.3,k[0],k[1],false);burst(t,THROW.firstHit,a[0],a[1],true);burst(t,THROW.secondHit,b[0],b[1],true);
    const dt=t-11.04;
    if(dt>=0&&dt<1.4){
      const u=dt/1.4,r=8+u*100,impact=makeRig(0,11.04).weapon(AXE.tip);
      arc(impact[0],impact[1],3.8,r,0,Math.PI*2,(1-u)*.8,'#b4d8dc',3*(1-u)+1);
      arc(impact[0],impact[1],4,r*.8,0,Math.PI*2,(1-u)*.25,'#e7f5ed',5);
      for(let i=0;i<24;i++){
        const a=i/24*Math.PI*2,R=15+(i%5)*7,X=impact[0]+Math.cos(a)*R,Y=impact[1]+Math.sin(a)*R,H=Math.sin(Math.min(1,u*2)*Math.PI)*((i%3)*5+8);
        if(H>.1)fx([[X-1.9,Y,3],[X,Y-1.5,3],[X+.6,Y,3+H],[X+2,Y+1.5,3]],i%2?'#b9d9d9':'#e1efe6',(1-u)*.85);
      }
      burst(t,11.04,impact[0],impact[1],true);
    }
    // Drifting snow is sparse, deterministic and limited to the diorama's footprint.
    drawSnow(t);
    for(let i=fxCount;i<fxPool.length;i++)fxPool[i].setAttribute('opacity','0');
  }
  const healthLayer=el('g',{id:'combat-health','pointer-events':'none'});
  const healthBars=[1,2].map(()=>{const g=el('g',{opacity:0},healthLayer),track=el('rect',{width:26,height:2,rx:1,fill:'#4e5f51',opacity:'.25'},g);return {group:g,track,fill:el('rect',{width:26,height:2,rx:1,fill:'#a65e45'},g)};});
  function hideHealthBars(){healthBars.forEach(b=>b.group.setAttribute('opacity',0));}
  function renderGame(frame){
    const t=frame.time;lastTime=t;mesh=[];fxCount=0;meshOpacity=1;
    activeTheme?.environment.syncState?.(frame.worldState);
    rigState=frame.actors.map(d=>makeRig(d.id,t,d));flightState=frame.flight||null;
    rigState.forEach(r=>{if(r.opacity>.005){meshOpacity=r.opacity;drawActor(r);}});meshOpacity=1;
    if(flightState){
      if(activeTheme)activeTheme.drawProjectile(flightState,graphics);else axe(flightState.transform,[0,0,0]);
      const trail=flightState.trail||[];
      if(trail.length>1)fx([...trail.map(v=>v.outer),...trail.map(v=>v.inner).reverse()],'#c2e6e8',.38);
    }
    if(frame.trail?.length>1)fx([...frame.trail.map(v=>v.outer),...frame.trail.map(v=>v.inner).reverse()],'#d3eded',.36);
    flushMesh();drawFires(t);drawContacts(t);
    rigState.forEach((r,i)=>{actorShadows[i].setAttribute('d',shadowShape(r.base.x,r.base.y,r.live?.shadowRadius||(i?11:13)));actorShadows[i].setAttribute('opacity',.2*r.opacity);});
    for(const event of frame.events||[]){
      if(activeTheme){activeTheme.drawEvent(event,t,graphics);continue;}
      const age=t-event.time;
      if(event.type==='slam'&&age>=0&&age<.85){
        const u=age/.85;arc(event.x,event.y,3.8,8+u*70,0,Math.PI*2,(1-u)*.8,'#b4d8dc',3*(1-u)+1);
        burst(t,event.time,event.x,event.y,true);
      }else if(age>=0&&age<.7)burst(t,event.time,event.x,event.y,event.type!=='block'&&event.type!=='hurt');
    }
    frame.actors.forEach(d=>{
      if(d.warning>0&&d.opacity>0)arc(d.base.x,d.base.y,3.6,d.warningRadius||10,0,Math.PI*2,d.warning*.65,'#c38a59',d.boss?1.6:1.2);
    });
    drawSnow(frame.ambientTime??t);
    for(let i=fxCount;i<fxPool.length;i++)fxPool[i].setAttribute('opacity','0');
    healthBars.forEach((bar,i)=>{
      const r=rigState[i+1],visible=r.hp<.999&&r.opacity>0;
      const width=r.live?.healthWidth||26,pos=p(r.live?.healthHeight?[r.base.x,r.base.y,r.live.healthHeight]:r.H([0,0,65]));bar.group.setAttribute('transform',`translate(${fmt(pos[0]-width/2)} ${fmt(pos[1])})`);
      bar.group.setAttribute('aria-label',`${r.live?.name||'Enemy'} health`);bar.track.setAttribute('width',width);
      bar.group.setAttribute('opacity',visible?r.opacity:0);bar.fill.setAttribute('width',width*Math.max(0,r.hp));
    });
  }
  const graphics={face,lit,loft,muscle,solidBox,limb,head,vec,sub,mul,norm,rotZ,lerp3,fx,arc,burst};
  function setTheme(theme){activeTheme=theme;[environmentShadow,ground,backdrop,front].forEach(n=>n.setAttribute('display',theme?'none':'inline'));}
  render(0);
  window.Diorama={render,renderGame,makeRig,poseAt,project:p,setTheme,graphics,castPath,paintCast,environmentAnchors:{shadow:ground,back:shadows,front:healthLayer,entities:actors},shieldScale:1.2,duration:DURATION,svg,get time(){return lastTime;},get rigs(){return rigState;},get flight(){return flightState;},footPlans,axeGeometry:AXE,throwTiming:THROW,axeFlightAt};
})();
