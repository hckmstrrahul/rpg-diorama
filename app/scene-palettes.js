/* The entire shared interface adopts its world's materials; layout stays identical. */
(() => {
  'use strict';
  // ink, secondary ink, surface, recessed surface, border, accent, health, energy.
  const themes={
    midgard:['#303d35','#54674d','#f3f5eb','#d9e1ce','#b5c3aa','#40543a','#a34840','#557c48'],
    tsushima:['#493c32','#755943','#f8efe0','#e6d6bb','#cbb397','#8b5540','#ad404a','#326b62'],
    arkham:['#263d4c','#16232c','#d3dfe1','#96acb8','#6f8b9b','#344f61','#aa3e58','#326f93'],
    assassin:['#4e3e31','#725944','#fbefdc','#e7d5b9','#c8ad8d','#8a5843','#a94543','#396c92'],
    persia:['#344d50','#416261','#f6ecd7','#e6d5b5','#bca782','#447a78','#a2434b','#297b80'],
    duty:['#303c43','#384a50','#dbe2df','#b4c2c4','#899c9f','#505b50','#a53e48','#346c84'],
    payne:['#292e43','#272f42','#dbe0e9','#aeb9cc','#8091ac','#4e5277','#b34456','#4854ab'],
    gta:['#4e344a','#5f465c','#f4e0db','#debfca','#bb91aa','#84517d','#b1454d','#794ba4'],
    spider:['#393f58','#544862','#efe3df','#d2c4cd','#a899b0','#964e5d','#b53b4b','#346db5'],
    wukong:['#414737','#494a36','#e6e3c9','#c5c7a5','#9a9f7a','#746237','#a83e43','#3c775e'],
    siege:['#294355','#305068','#e2eaf0','#b4cad7','#8baabb','#3c6886','#ab414b','#2b7895'],
    fable:['#3b4054','#4a4f60','#eeebdc','#cccdbd','#a4ad9f','#626f97','#aa434b','#4d62a9'],
    kombat:['#48372f','#403027','#eee0cb','#ceb7a0','#b09980','#8c5039','#ad3b42','#397d68']
  };
  const rgb=hex=>hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255);
  const hex=values=>'#'+values.map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('');
  const luminance=color=>color.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  // Keep the authored hue, lowering its lightness only as far as the actual
  // surfaces require. Page labels and panel labels need different ink colors.
  function readable(color,backgrounds,minimum,opacity=1){
    const source=rgb(color),surfaces=backgrounds.map(rgb);
    for(let shade=0;shade<=255;shade++){
      const candidate=hex(source.map(v=>v*(1-shade/255))),ink=rgb(candidate);
      if(surfaces.every(bg=>contrast(ink.map((v,i)=>v*opacity+bg[i]*(1-opacity)),bg)>=minimum))return candidate;
    }
    return '#000000';
  }
  window.ScenePalette=id=>{
    const [ink,secondary,panel,well,line,accent,heart,power]=themes[id];
    const background=window.Worlds?.byId.get(id)?.bg||[well],surfaces=[panel,well];
    const muted=readable(secondary,surfaces,4.7,.8),sceneInk=readable(ink,background,4.7,.8);
    const primary=readable(accent,[...surfaces,'#fff8ef'],4.7),focus=readable(accent,[...surfaces,...background],3.3);
    const track=panel;
    const health=readable(readable(heart,background,3.3),[track],4.7),energy=readable(readable(power,background,3.3),[track],4.7);
    return {ink,muted,line,panel,well,selected:panel,hover:well,'scene-accent':primary,primary,'primary-hover':ink,'on-primary':'#fff8ef',health,energy,track,key:panel,'key-edge':line,focus,shadow:ink+'18','on-scene':sceneInk,'meter-edge':readable(ink,[well,...background],3.3)};
  };
})();
