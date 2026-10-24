(() => {
  'use strict';
  const scene=window.Diorama,worlds=window.Worlds,catalog=worlds.catalog,$=id=>document.getElementById(id);
  const sceneTabs=catalog.map(p=>$(`scene-tab-${p.id}`));
  let sceneIndex=0,game=worlds.createGame(catalog[0].id);
  let visibleTabCount=5,sceneAnimations=[],exitLayer=null,swipeLayer=null,transitionId=0;
  const previewSource=i=>`assets/${catalog[(i+catalog.length)%catalog.length].id}-preview.svg?v=35`;
  let menuOpen=false,menuActive=-1,menuOptions=[],menuType='',menuTypedAt=0,menuInput='keyboard',helpOpen=false;
  const popovers=new Map();
  function motionValue(name,fallback){
    return window.getComputedStyle(document.documentElement).getPropertyValue(name).trim()||fallback;
  }
  function motionMs(name,fallback){
    const value=motionValue(name,`${fallback}ms`),number=parseFloat(value);
    return Number.isFinite(number)?number*(value.endsWith('ms')?1:1000):fallback;
  }
  // CSS owns interpolation, including reversal halfway through a close.
  // Only a settled close hides the panel; an old cleanup cannot hide a reopened one.
  function transitionPopover(panel,open,animate=true,afterClose=()=>{}){
    const previousState=popovers.get(panel);clearTimeout(previousState?.timer);
    const state={};popovers.set(panel,state);
    const fresh=panel.hidden||!panel.classList.contains('is-open')&&!panel.classList.contains('is-closing');
    const finish=()=>{
      if(popovers.get(panel)!==state)return;
      panel.classList.remove('is-closing');panel.hidden=true;popovers.delete(panel);afterClose();
    };
    panel.inert=!open;
    if(!animate||reduced.matches||!open&&fresh){
      const previousTransition=panel.style.transition;panel.style.transition='none';
      panel.hidden=!open;panel.classList.remove('is-closing');panel.classList.toggle('is-open',open);
      void panel.offsetWidth;panel.style.transition=previousTransition;
      if(!open)finish();return;
    }
    panel.hidden=false;
    if(open){
      if(fresh)void panel.offsetWidth;
      panel.classList.remove('is-closing');panel.classList.add('is-open');
    }else{
      panel.classList.remove('is-open');panel.classList.add('is-closing');
      state.timer=setTimeout(finish,motionMs('--dropdown-close-dur',150));
    }
  }
  function moveSelection(barId,pillId,tab,animate=false){
    const bar=$(barId),pill=$(pillId),bounds=bar.getBoundingClientRect(),target=tab.getBoundingClientRect();
    const left=target.left-bounds.left-(bar.clientLeft||0),width=tab.offsetWidth||target.width;
    const immediate=!animate||reduced.matches||!bar.dataset.motionReady;
    const previousTransition=pill.style.transition;
    if(immediate)pill.style.transition='none';
    pill.style.transform=`translateX(${Number.isFinite(left)?left:0}px)`;pill.style.width=`${width}px`;
    bar.dataset.motionReady='true';
    if(immediate){void pill.offsetWidth;pill.style.transition=previousTransition;}
  }
  function syncModeSelection(animate=false){moveSelection('mode-tabs','mode-selection-pill',$(mode==='game'?'mode-game':'mode-watch'),animate);}
  function setHelpOpen(open,animate=true,restoreFocus=false){
    helpOpen=open;
    if(open){closeSceneMenu();clearInput();$('key-help').open=true;}
    $('help-trigger').setAttribute('aria-expanded',String(open));
    transitionPopover($('help-panel'),open,animate,()=>{$('key-help').open=false;});
    if(restoreFocus)$('help-trigger').focus({preventScroll:true});
  }
  function clearSceneOption(){
    menuActive=-1;menuOptions.forEach(option=>option.classList.remove('is-active'));
    $('scene-menu').removeAttribute('aria-activedescendant');
  }
  function markSceneOption(index,source='keyboard'){
    if(!menuOptions.length)return;
    menuInput=source;menuActive=(index+menuOptions.length)%menuOptions.length;
    menuOptions.forEach((option,i)=>option.classList.toggle('is-active',i===menuActive));
    const active=menuOptions[menuActive];$('scene-menu').setAttribute('aria-activedescendant',active.id);
    if(source==='keyboard')active.scrollIntoView?.({block:'nearest'});
  }
  function openSceneMenu(fromEnd=false,pointer=false){
    if(!menuOptions.length)return;
    setHelpOpen(false,false);clearInput();menuOpen=true;menuType='';
    $('scene-overflow').setAttribute('aria-expanded','true');
    const selected=menuOptions.findIndex(option=>Number(option.dataset.index)===sceneIndex);
    if(pointer){menuInput='pointer';clearSceneOption();}
    else markSceneOption(selected>=0?selected:fromEnd?menuOptions.length-1:0);
    const bounds=$('viewport').getBoundingClientRect(),trigger=$('scene-overflow').getBoundingClientRect(),menu=$('scene-menu');
    if(compact.matches){
      const width=Math.min(300,window.innerWidth-24),above=trigger.top-20,up=above>=180;
      menu.style.width=`${width}px`;menu.style.left=`${Math.max(12,Math.min(window.innerWidth-width-12,trigger.left))}px`;
      menu.style.top=up?'auto':'12px';menu.style.bottom=up?`${window.innerHeight-trigger.top+8}px`:'auto';
      menu.style.maxHeight=`${Math.min(440,up?above:window.innerHeight-24)}px`;menu.dataset.origin=up?'bottom-left':'top-left';
    }else{
      const room=Number.isFinite(bounds.bottom-trigger.bottom)?bounds.bottom-trigger.bottom-20:(window.innerHeight||700)-160;
      menu.style.maxHeight=`${Math.max(100,Math.min(440,room))}px`;
    }
    transitionPopover($('scene-menu'),true,pointer);
    if(!pointer)menuOptions[menuActive]?.scrollIntoView?.({block:'nearest'});
    $('scene-menu').focus({preventScroll:true});
  }
  function closeSceneMenu(restoreFocus=false,animate=false){
    menuOpen=false;$('scene-overflow').setAttribute('aria-expanded','false');$('scene-menu').inert=true;
    transitionPopover($('scene-menu'),false,animate);if(restoreFocus)$('scene-overflow').focus({preventScroll:true});
  }
  function chooseSceneOption(index){closeSceneMenu(true);selectScene(index);}
  function sceneMenuKey(e){
    const trigger=$('scene-overflow'),onTrigger=e.target===trigger||trigger.contains(e.target);
    if(!menuOpen){
      if(onTrigger&&['ArrowDown','ArrowUp','Home','End'].includes(e.code)){
        e.preventDefault();openSceneMenu(e.code==='ArrowUp'||e.code==='End');return true;
      }
      return false;
    }
    if(e.code==='Tab'){closeSceneMenu(true);return true;}
    e.preventDefault();
    if(e.code==='Escape'){closeSceneMenu(true);return true;}
    if(e.code==='ArrowDown')markSceneOption(menuActive+1);
    else if(e.code==='ArrowUp')markSceneOption(menuActive<0?menuOptions.length-1:menuActive-1);
    else if(e.code==='Home')markSceneOption(0);
    else if(e.code==='End')markSceneOption(menuOptions.length-1);
    else if((e.code==='Enter'||e.code==='Space')&&!e.repeat){if(menuActive>=0)chooseSceneOption(Number(menuOptions[menuActive].dataset.index));else markSceneOption(0);}
    else{
      const letter=e.key?.length===1?e.key:/^Key[A-Z]$/.test(e.code)?e.code.slice(3):'';
      if(letter){const now=performance.now();menuType=now-menuTypedAt>700?letter:menuType+letter;menuTypedAt=now;
        let found=menuOptions.findIndex(option=>catalog[Number(option.dataset.index)].title.toLowerCase().startsWith(menuType.toLowerCase()));
        if(found<0){menuType=letter;found=menuOptions.findIndex(option=>catalog[Number(option.dataset.index)].title.toLowerCase().startsWith(letter.toLowerCase()));}
        if(found>=0)markSceneOption(found);
      }
    }
    return true;
  }

  function layoutSelector(animate=false){
    const selector=$('scene-selector'),trigger=$('scene-overflow'),menu=$('scene-menu'),label=$('scene-overflow-label');
    if(menuOpen)closeSceneMenu(true);
    // Reuse one selector and one live status across both layouts.
    const home=compact.matches?$('sheet-heading'):$('site-header');
    if(selector.parentNode!==home){if(compact.matches)home.appendChild(selector);else home.insertBefore(selector,$('site-links'));}
    const modeHome=compact.matches?$('sheet-heading'):$('mode-controls');
    if($('mode-tabs').parentNode!==modeHome)modeHome.appendChild($('mode-tabs'));
    const statusHome=compact.matches?$('restart-controls'):$('control-panel');
    if($('game-status').parentNode!==statusHome)statusHome.appendChild($('game-status'));
    const menuHome=compact.matches?document.body:$('scene-overflow-wrap');
    if(menu.parentNode!==menuHome)menuHome.appendChild(menu);
    menu.dataset.compact=String(compact.matches);
    if(!compact.matches)for(const property of ['width','left','top','bottom','maxHeight'])menu.style[property]='';
    const header=$('site-header').getBoundingClientRect(),brand=$('site-brand').getBoundingClientRect(),links=$('site-links').getBoundingClientRect();
    const viewportWidth=window.innerWidth||1200;
    const gap=viewportWidth<=900?12:20;
    const available=header.width>200?header.width-links.width-brand.width-gap*2:($('viewport').clientWidth||viewportWidth)-32;
    // Measure the real labels with the current font, so tablet layouts don't overflow.
    $('scene-tabs').hidden=false;sceneTabs.forEach(tab=>tab.hidden=false);
    const widths=sceneTabs.map(tab=>tab.getBoundingClientRect?.().width||100);
    let count=compact.matches?0:Math.min(5,catalog.length);
    const moreWidth=()=>{
      label.textContent=sceneIndex>=count?catalog[sceneIndex].title:'More';
      return $('scene-overflow-wrap').getBoundingClientRect?.().width||((sceneIndex>=count?catalog[sceneIndex].title.length:4)*7+32);
    };
    while(count>0&&widths.slice(0,count).reduce((a,b)=>a+b+2,8)+moreWidth()>available)count--;
    const sameLayout=count===visibleTabCount;
    visibleTabCount=count;sceneTabs.forEach((tab,i)=>{tab.hidden=i>=count;tab.setAttribute('tabindex',i===sceneIndex||sceneIndex>=count&&i===0?'0':'-1');});
    $('scene-tabs').hidden=count===0;
    menu.replaceChildren();menuOptions=[];
    for(let i=count;i<catalog.length;i++){
      const option=document.createElement('button');option.type='button';option.className='scene-option';option.id=`scene-option-${catalog[i].id}`;
      option.setAttribute('role','option');option.setAttribute('tabindex','-1');option.setAttribute('aria-selected',String(i===sceneIndex));option.dataset.index=String(i);
      const title=document.createElement('span');title.textContent=catalog[i].title;
      const check=document.createElement('span');check.className='scene-option-check';check.textContent='✓';check.setAttribute('aria-hidden','true');
      option.appendChild(title);option.appendChild(check);option.onclick=()=>chooseSceneOption(i);
      option.addEventListener('pointermove',e=>{if(menuOpen&&e.pointerType!=='touch'&&(menuInput!=='pointer'||menuActive!==i-count))markSceneOption(i-count,'pointer');});
      option.addEventListener('pointerleave',()=>{if(menuInput==='pointer')clearSceneOption();});
      menu.appendChild(option);menuOptions.push(option);
    }
    label.textContent=sceneIndex>=count?catalog[sceneIndex].title:'More';
    trigger.classList.toggle('is-selected',sceneIndex>=count);
    trigger.setAttribute('aria-label',count?`More game scenes${sceneIndex>=count?`: ${catalog[sceneIndex].title}`:''}`:`Game scene: ${catalog[sceneIndex].title}`);
    menu.setAttribute('aria-label',count?'More game scenes':'Game scene');
    menu.dataset.origin=compact.matches?'bottom-left':'top-right';
    selector.dataset.visibleTabs=String(count);
    moveSelection('scene-selector','scene-selection-pill',sceneIndex<count?sceneTabs[sceneIndex]:trigger,animate&&sameLayout);
  }
  function updatePreviews(){
    for(const [side,offset] of [['prev',-1],['next',1]]){
      const i=(sceneIndex+offset+catalog.length)%catalog.length,p=catalog[i];
      if(compact.matches)$(`scene-${side}-image`).removeAttribute('src');else $(`scene-${side}-image`).setAttribute('src',previewSource(i));
      $(`scene-${side}-name`).textContent=p.title;
      $(`scene-${side}`).setAttribute('aria-label',`${side==='prev'?'Previous':'Next'} scene: ${p.title}`);
    }
  }
  function settleSceneMotion(){
    transitionId++;sceneAnimations.forEach(a=>a.cancel());sceneAnimations=[];
    exitLayer?.remove();exitLayer=null;swipeLayer?.remove();swipeLayer=null;
    $('scene-motion').style.transform='';$('scene-motion').style.opacity='';
    $('scene-stage').classList.remove('is-switching','is-swiping');
  }
  function snapshotScene(){
    const layer=document.createElement('div'),copy=$('scene').cloneNode(false);
    for(const child of $('scene').children)if(child.getAttribute('display')!=='none')copy.appendChild(child.cloneNode(true));
    layer.className='scene-exit';layer.setAttribute('aria-hidden','true');
    // A snapshot keeps the actual pose and camera, while remapping SVG filter IDs.
    const prefix=`scene-exit-${transitionId}-`,ids=new Map();
    for(const n of [copy,...copy.querySelectorAll('[id]')]){const id=n.getAttribute('id');if(id){ids.set(id,prefix+id);n.setAttribute('id',prefix+id);}n.removeAttribute('tabindex');}
    copy.querySelectorAll('[display="none"]').forEach(n=>n.remove());
    for(const n of [copy,...copy.querySelectorAll('*')])for(const attr of [...n.attributes]){
      if(attr.value.includes('url(#'))n.setAttribute(attr.name,attr.value.replace(/url\(#([^)]*)\)/g,(all,id)=>`url(#${ids.get(id)||id})`));
    }
    layer.appendChild(copy);$('scene-stage').appendChild(layer);return layer;
  }
  const poseTransform=p=>`translate(${p[0]}px, ${p[1]}px) scale(${p[2]})`;
  const centerPose=[0,0,1,1];
  function scenePose(node){
    const style=window.getComputedStyle(node),matrix=style.transform.match(/^matrix\(([^)]+)\)$/);
    if(matrix){const m=matrix[1].split(',').map(Number);return [m[4],m[5],Math.hypot(m[0],m[1]),Number(style.opacity)];}
    const xy=style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/),scale=style.transform.match(/scale\(([-\d.]+)\)/);
    return [xy?Number(xy[1]):0,xy?Number(xy[2]):0,scale?Number(scale[1]):1,Number(style.opacity)];
  }
  function setScenePose(node,pose){node.style.transform=poseTransform(pose);node.style.opacity=String(pose[3]);}
  function previewPose(side){
    // Use layout dimensions so dragging does not change the preview targets.
    const motion=$('scene-motion'),bounds=motion.getBoundingClientRect(),stage=$('scene-stage').getBoundingClientRect();
    const frame={left:stage.left+(motion.offsetLeft??bounds.left-stage.left),top:stage.top+(motion.offsetTop??bounds.top-stage.top),width:motion.offsetWidth||bounds.width,height:motion.offsetHeight||bounds.height};
    if(compact.matches)return [side*frame.width*.18,0,.96,0];
    const peek=$(side<0?'scene-prev':'scene-next').getBoundingClientRect();
    const sceneWidth=Math.min(frame.width,Math.min(frame.height,950)*1200/880);
    const scale=peek.width/Math.max(1,sceneWidth);
    return [peek.left+peek.width/2-frame.left-frame.width/2,peek.top+peek.height/2-frame.top-frame.height/2,scale,compact.matches?.3:.68];
  }
  function previewTransform(side){return poseTransform(previewPose(side));}
  function settlePose(node,from,to,velocity=[0,0,0,0]){
    if(reduced.matches)return node.animate([{opacity:from[3]},{opacity:to[3]}],{duration:motionMs('--scene-switch-reduced-dur',120),fill:'both'});
    // A critically damped spring sampled into compositor-driven WAAPI frames.
    const duration=motionMs('--scene-switch-dur',500),response=motionMs('--scene-drag-response',300)/1000,omega=2*Math.PI/response;
    const count=Math.ceil(duration/1000*60),frames=[];
    for(let i=0;i<=count;i++){
      const t=i/count*duration/1000;
      const p=from.map((value,j)=>i===count?to[j]:to[j]+((value-to[j])+(velocity[j]+omega*(value-to[j]))*t)*Math.exp(-omega*t));
      p[2]=Math.max(.05,p[2]);p[3]=Math.max(0,Math.min(1,p[3]));
      frames.push({transform:poseTransform(p),opacity:p[3],offset:i/count});
    }
    return node.animate(frames,{duration,easing:'linear',fill:'both'});
  }

  const sessions=new Map();
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)'),compact=window.matchMedia('(max-width: 1024px), (pointer: coarse) and (max-width: 1366px)'),keys=new Set();
  const touchPresses=new Map(),touchBindings={up:'KeyW',left:'KeyA',down:'KeyS',right:'KeyD',attack:'KeyJ',throw:'KeyK',special:'KeyL',dodge:'Space',block:'ShiftLeft'};
  let mode=compact.matches?'watch':'game',modeChosen=false,playing=true,time=0,speed=1,previous=performance.now(),accumulator=0,panelAnimation=null;
  let suppressSceneClickUntil=0;
  const minZoom=.75,maxZoom=2.5;
  const defaultZoom=1,swipeThreshold=.25;
  let zoom=1,lastViewBox='',cameraCenter=null,panGesture=null,pinchGesture=null;
  const cameraTouches=new Map(),cameraZoom=()=>zoom*(compact.matches?1.16:1);
  const movement=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight']);
  const actions={KeyJ:'attack',KeyK:'throw',KeyL:'slam',Space:'dodge'};
  const touchHeld=code=>[...touchPresses.values()].some(press=>(press.codes||[press.code]).includes(code));
  const held=code=>keys.has(code)||touchHeld(code);
  const input=()=>({x:(held('KeyD')||held('ArrowRight')?1:0)-(held('KeyA')||held('ArrowLeft')?1:0),y:(held('KeyS')||held('ArrowDown')?1:0)-(held('KeyW')||held('ArrowUp')?1:0),block:held('ShiftLeft')||held('ShiftRight')});
  const renderWatch=()=>worlds.renderWatch(catalog[sceneIndex].id,time);
  function applySceneUI(animate=false){
    const p=catalog[sceneIndex];
    document.title=`${p.title} — rpg-diorama`;
    $('current-game-name').textContent=p.title;
    document.body.dataset.world=p.id;
    $('theme-color').setAttribute('content',p.bg[1]);
    ['center','middle','edge'].forEach((key,i)=>document.body.style.setProperty(`--bg-${key}`,p.bg[i]));
    document.body.style.setProperty('--scene-accent',p.accent);
    Object.entries(window.ScenePalette(p.id)).forEach(([key,value])=>document.body.style.setProperty(`--${key}`,value));
    sceneTabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===sceneIndex));tab.setAttribute('tabindex',i===sceneIndex?'0':'-1');});
    $('scene-motion').setAttribute('aria-labelledby',`scene-tab-${p.id}`);
    layoutSelector(animate);updatePreviews();
    $('scene').setAttribute('aria-label',`${p.hero} — ${p.place}`);
    $('scene-description').textContent=`${p.hero} in ${p.place}. Move with the touch direction pad, WASD or arrows. J: ${p.help[0]}. K: ${p.help[1]}. L: ${p.help[2]}. Space: ${p.help[3]}. Shift: ${p.help[4]}. ${compact.matches?'Use the left and right buttons or scene menu to change games. Drag to pan; pinch or use the zoom buttons to zoom.':'Swipe left or right at least a quarter of the view to change scenes at 100 percent zoom or below. Zoom in to drag and pan.'} Press 0 to recenter and reset zoom.` ;
    const shortLabels={'shootdodge':'shoot dodge','immobilize':'freeze','acrobatic combo':'combo','breaching hammer':'hammer','grapnel takedown':'grapnel'};
    ['attack','throw','special','dodge','block'].forEach((key,i)=>{$(`hint-${key}`).textContent=p.labels[i];$(`help-${key}`).textContent=p.help[i];$(`touch-label-${key}`).textContent=shortLabels[p.labels[i]]||p.labels[i];$(`touch-${key}`).setAttribute('aria-label',p.help[i]);});
    $('help-special-detail').textContent=p.specialDetails;
    $('scene-prev').setAttribute('aria-label',`Previous scene: ${catalog[(sceneIndex+catalog.length-1)%catalog.length].title}`);
    $('scene-next').setAttribute('aria-label',`Next scene: ${catalog[(sceneIndex+1)%catalog.length].title}`);
  }
  function selectScene(index,direction,swipe){
    const next=((Math.trunc(index)%catalog.length)+catalog.length)%catalog.length;if(!Number.isFinite(next)||next===sceneIndex)return;
    endPan();
    const forward=(next-sceneIndex+catalog.length)%catalog.length;
    direction=direction|| (forward<=catalog.length/2?1:-1);
    const motion=$('scene-motion'),current=window.getComputedStyle(motion),from=current.transform,fromOpacity=current.opacity||'1';
    settleSceneMotion();const token=transitionId;
    const outgoing=snapshotScene(),enter=previewTransform(direction),leave=previewTransform(-direction);
    exitLayer=outgoing;$('scene-stage').classList.add('is-switching');
    sessions.set(catalog[sceneIndex].id,{game,time,cameraCenter});clearInput();
    sceneIndex=next;const p=catalog[next],session=sessions.get(p.id);game=session?.game||worlds.createGame(p.id);time=session?.time||0;cameraCenter=compact.matches||zoom>defaultZoom+.001?session?.cameraCenter||null:null;
    worlds.activate(p.id);applySceneUI(true);previous=performance.now();
    if(mode==='game')game.render();else renderWatch();update();
    const options={duration:reduced.matches?motionMs('--scene-switch-reduced-dur',120):motionMs('--scene-switch-dur',500),easing:motionValue('--scene-switch-ease','cubic-bezier(.32,.72,0,1)'),fill:'both'};
    const previewOpacity=compact.matches?0:.68;
    const incoming=swipe&&!reduced.matches?settlePose(motion,swipe.incoming,centerPose,swipe.incomingVelocity):motion.animate(reduced.matches?[{opacity:0},{opacity:1}]:[{transform:enter,opacity:previewOpacity},{transform:'translate(0px, 0px) scale(1)',opacity:1}],options);
    const exiting=swipe&&!reduced.matches?settlePose(outgoing,swipe.outgoing,swipe.leave,swipe.velocity):outgoing.animate(reduced.matches?[{opacity:fromOpacity},{opacity:0}]:[{transform:from==='none'?'translate(0px, 0px) scale(1)':from,opacity:fromOpacity},{transform:leave,opacity:previewOpacity}],options);
    sceneAnimations=[incoming,exiting];
    incoming.onfinish=()=>{if(token===transitionId)settleSceneMotion();};
  }
  function syncTouchPresses(){
    for(const [name,code] of Object.entries(touchBindings))$(`touch-${name}`).classList.toggle('is-pressed',touchHeld(code));
  }
  function clearInput(){
    keys.clear();accumulator=0;game.input={x:0,y:0,block:false};
    const released=[...touchPresses];touchPresses.clear();
    for(const [id,p] of released){clearTimeout(p.timer);if(typeof id==='number'&&p.button.hasPointerCapture?.(id))p.button.releasePointerCapture(id);}
    syncTouchPresses();
  }
  function syncSceneFrame(){
    // Preserve the original composition, but clip only at the page boundary.
    const rect=$('viewport').getBoundingClientRect(),style=window.getComputedStyle($('viewport'));
    const width=window.innerWidth||document.documentElement.clientWidth,height=window.innerHeight||document.documentElement.clientHeight;
    if(![rect.top,rect.left,rect.width,rect.height,width,height].every(Number.isFinite))return;
    const header=$('site-header').getBoundingClientRect();
    const top=compact.matches?Math.max(rect.top,(header.bottom||rect.top+48)+10):rect.top+(parseFloat(style.paddingTop)||42);
    const bottom=rect.top+rect.height-(parseFloat(style.paddingBottom)||0);
    const frame={top,right:Math.max(0,width-rect.left-rect.width),bottom:Math.max(0,height-bottom),left:Math.max(0,rect.left)};
    Object.entries(frame).forEach(([key,value])=>$('scene-stage').style.setProperty(`--scene-frame-${key}`,`${value}px`));
    const controls=$(compact.matches?'control-panel':'scene-controls').getBoundingClientRect();
    if(Number.isFinite(controls.top))document.body.style.setProperty('--controls-clearance',`${Math.max(120,height-controls.top+32)}px`);
  }
  function cameraFocus(){
    // Dragging takes manual control until Reset view; gameplay continues normally.
    if(cameraCenter&&(compact.matches||zoom>defaultZoom+.001))return cameraCenter;
    const actor=mode==='game'?game.hero:scene.rigs[0]?.base;
    const focus=actor?scene.project([actor.x,actor.y,28]):[600,440];
    const follow=Math.max(0,Math.min(1,(zoom-1)/.65));
    return {x:600+(focus[0]-600)*follow,y:440+(focus[1]-440)*follow};
  }
  function updateCamera(){
    const {x:cx,y:cy}=cameraFocus(),w=1200/cameraZoom(),h=880/cameraZoom();
    const box=[cx-w/2,cy-h/2,w,h].map(v=>v.toFixed(3)).join(' ');
    if(box!==lastViewBox){$('scene').setAttribute('viewBox',box);lastViewBox=box;}
    const overlay=String(zoom>1.001||!!cameraCenter);
    if(document.body.dataset.cameraOverlay!==overlay)document.body.dataset.cameraOverlay=overlay;
  }
  function beginPan(e){
    if(e.button!==undefined&&e.button!==0||e.ctrlKey||e.metaKey||e.altKey)return;
    if(['scene-prev','scene-next','site-header','control-panel'].some(id=>$(id).contains(e.target)))return;
    if(![e.clientX,e.clientY].every(Number.isFinite))return;
    if(compact.matches&&e.pointerType==='touch'){
      if(cameraTouches.size>=2&&!cameraTouches.has(e.pointerId))return;
      cameraTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});$('scene-stage').setPointerCapture?.(e.pointerId);
      if(cameraTouches.size===2){
        const [a,b]=[...cameraTouches.values()],rect=$('scene').getBoundingClientRect(),scale=Math.min(rect.width/1200,rect.height/880)*cameraZoom(),center=cameraFocus();
        pinchGesture={distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),zoom,anchor:{x:center.x+((a.x+b.x)/2-rect.left-rect.width/2)/scale,y:center.y+((a.y+b.y)/2-rect.top-rect.height/2)/scale}};
        panGesture=null;settleSceneMotion();$('scene-stage').classList.add('is-panning');e.preventDefault();return;
      }
    }else if(e.isPrimary===false)return;
    if(panGesture)return;
    const base=scenePose($('scene-motion'));settleSceneMotion();
    const rect=$('scene').getBoundingClientRect(),scale=Math.min(rect.width/1200,rect.height/880)*cameraZoom();
    if(!Number.isFinite(scale)||scale<=0)return;
    const swipe=!compact.matches&&zoom<=defaultZoom+.001;
    panGesture={id:e.pointerId,x:e.clientX,y:e.clientY,center:{...cameraFocus()},scale,active:false,swipe,base,dx:0,dy:0,vertical:compact.matches,extent:compact.matches?$('viewport').getBoundingClientRect().height:$('scene-stage').getBoundingClientRect().width,pose:base,velocity:[0,0,0,0],incomingVelocity:[0,0,0,0],lastTime:performance.now()};

    if(swipe)setScenePose($('scene-motion'),base);
    $('scene-stage').setPointerCapture?.(e.pointerId);
    if(mode==='game')$('scene').focus({preventScroll:true});
    e.preventDefault();
  }
  function movePan(e,releasing=false){
    if(cameraTouches.has(e.pointerId))cameraTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pinchGesture){
      const [a,b]=[...cameraTouches.values()];if(!b)return;
      const next=Math.max(minZoom,Math.min(maxZoom,pinchGesture.zoom*Math.hypot(a.x-b.x,a.y-b.y)/pinchGesture.distance));
      const rect=$('scene').getBoundingClientRect(),scale=Math.min(rect.width/1200,rect.height/880)*next*1.16;
      cameraCenter={x:Math.max(0,Math.min(1200,pinchGesture.anchor.x-((a.x+b.x)/2-rect.left-rect.width/2)/scale)),y:Math.max(0,Math.min(880,pinchGesture.anchor.y-((a.y+b.y)/2-rect.top-rect.height/2)/scale))};
      setZoom(next,true);e.preventDefault();return;
    }
    if(!panGesture||panGesture.id!==e.pointerId)return;
    if(!releasing&&e.pointerType==='mouse'&&e.buttons===0){endPan(e);return;}
    const dx=e.clientX-panGesture.x,dy=e.clientY-panGesture.y;
    if(!Number.isFinite(dx)||!Number.isFinite(dy))return;
    if(panGesture.swipe){
      const g=panGesture;
      if(dx===g.dx&&dy===g.dy)return;
      g.dx=dx;g.dy=dy;
      const delta=g.vertical?dy:dx,cross=g.vertical?dx:dy,axis=g.vertical?1:0;
      if(!g.axis&&Math.hypot(dx,dy)>=8)g.axis=Math.abs(delta)>Math.abs(cross)*1.2?'scene':'cross';
      if(g.axis!=='scene')return;
      g.active=true;$('scene-stage').classList.add('is-panning','is-swiping');
      const direction=delta<0?1:-1;
      if(g.direction!==direction){
        g.direction=direction;g.enter=previewPose(direction);g.leave=previewPose(-direction);
        g.enter[2]/=zoom;g.leave[2]/=zoom;
        g.incoming=g.enter;g.incomingVelocity=[0,0,0,0];
        if(!reduced.matches){
          if(!swipeLayer){swipeLayer=document.createElement('div');swipeLayer.className='scene-swipe';swipeLayer.setAttribute('aria-hidden','true');const img=document.createElement('img');img.setAttribute('alt','');img.setAttribute('draggable','false');swipeLayer.appendChild(img);$('scene-stage').appendChild(swipeLayer);}
          swipeLayer.children[0].setAttribute('src',previewSource(sceneIndex+direction));swipeLayer.children[0].style.transform=`scale(${zoom})`;
        }
      }
      const travel=Math.max(1,Math.abs(g.leave[axis])),progress=Math.min(1,Math.abs(delta)/travel),extra=Math.max(0,Math.abs(delta)-travel);
      const distance=Math.min(Math.abs(delta),travel)+extra*travel*.55/(travel+extra*.55);
      const pose=reduced.matches?[0,0,1,1-.08*progress]:g.base.map((v,j)=>j===axis?v+Math.sign(delta)*distance:v+(g.leave[j]-v)*progress);
      const incoming=g.enter.map((v,j)=>v+(centerPose[j]-v)*progress),now=performance.now(),dt=(now-g.lastTime)/1000;
      if(dt>0&&dt<.12){
        const limits=[g.extent*3,g.extent*3,4,2];
        g.velocity=pose.map((v,j)=>Math.max(-limits[j],Math.min(limits[j],(v-g.pose[j])/dt)));
        g.incomingVelocity=incoming.map((v,j)=>Math.max(-limits[j],Math.min(limits[j],(v-g.incoming[j])/dt)));
      }else{g.velocity=[0,0,0,0];g.incomingVelocity=[0,0,0,0];}
      g.pose=pose;g.incoming=incoming;g.lastTime=now;
      setScenePose($('scene-motion'),pose);if(swipeLayer)setScenePose(swipeLayer,incoming);
      e.preventDefault();return;
    }
    if(!panGesture.active&&Math.hypot(dx,dy)<4)return;
    panGesture.active=true;$('scene-stage').classList.add('is-panning');
    cameraCenter={x:Math.max(0,Math.min(1200,panGesture.center.x-dx/panGesture.scale)),y:Math.max(0,Math.min(880,panGesture.center.y-dy/panGesture.scale))};
    updateCamera();e.preventDefault();
  }
  function endPan(e,commit=false){
    if(!e){
      const ids=[...cameraTouches.keys()];cameraTouches.clear();pinchGesture=null;
      for(const id of ids)if($('scene-stage').hasPointerCapture?.(id))$('scene-stage').releasePointerCapture(id);
      $('scene-stage').classList.remove('is-panning');
    }
    if(!panGesture||e&&e.pointerId!==panGesture.id)return;
    if(commit)movePan(e,true);
    const g=panGesture,id=g.id;panGesture=null;
    $('scene-stage').classList.remove('is-panning');
    if($('scene-stage').hasPointerCapture?.(id))$('scene-stage').releasePointerCapture(id);
    if(!g.swipe)return;
    if(!e){settleSceneMotion();return;}
    if(!g.active&&g.base.every((v,i)=>Math.abs(v-centerPose[i])<.001)){settleSceneMotion();return;}
    if(performance.now()-g.lastTime>80){g.velocity=[0,0,0,0];g.incomingVelocity=[0,0,0,0];}
    if(g.active)suppressSceneClickUntil=performance.now()+350;
    const delta=g.vertical?g.dy:g.dx,cross=g.vertical?g.dx:g.dy;
    if(commit&&g.active&&Math.abs(delta)>=g.extent*swipeThreshold&&Math.abs(delta)>Math.abs(cross)*1.2){
      selectScene(sceneIndex+g.direction,g.direction,{outgoing:g.pose,incoming:g.incoming,leave:g.leave,velocity:g.velocity,incomingVelocity:g.incomingVelocity});return;
    }
    const token=transitionId,returning=settlePose($('scene-motion'),g.pose,centerPose,g.velocity);
    sceneAnimations=[returning];if(swipeLayer)sceneAnimations.push(settlePose(swipeLayer,g.incoming,g.enter,g.incomingVelocity));
    returning.onfinish=()=>{if(token===transitionId)settleSceneMotion();};
  }
  function endCameraPointer(e,commit=false){
    if(pinchGesture&&!cameraTouches.has(e.pointerId))return;
    cameraTouches.delete(e.pointerId);
    if(pinchGesture){
      pinchGesture=null;
      if($('scene-stage').hasPointerCapture?.(e.pointerId))$('scene-stage').releasePointerCapture(e.pointerId);
      $('scene-stage').classList.remove('is-panning');
      if(commit&&cameraTouches.size){const [id,p]=[...cameraTouches][0];beginPan({pointerId:id,pointerType:'touch',clientX:p.x,clientY:p.y,target:$('scene'),preventDefault(){}});}
      else endPan();
      return;
    }
    endPan(e,commit);
  }
  function resetView(){
    endPan();cameraCenter=null;setZoom(1);
  }
  function setZoom(value,keepGesture=false){
    if(!Number.isFinite(value))return;
    if(!keepGesture)endPan();
    zoom=Math.max(minZoom,Math.min(maxZoom,value));
    if(!compact.matches&&zoom<=defaultZoom+.001)cameraCenter=null;
    $('help-drag-label').textContent=compact.matches||zoom>defaultZoom+.001?'Pan view':'Previous / next scene';
    $('help-drag-key').textContent=compact.matches?'Drag · pinch to zoom':zoom>defaultZoom+.001?'Drag':'Drag left / right 25%';
    $('zoom-reset').textContent=`${Math.round(zoom*100)}%`;
    $('zoom-reset').setAttribute('aria-label',`Scene zoom ${Math.round(zoom*100)} percent. Recenter and reset to 100 percent`);
    $('zoom-out').disabled=zoom<=minZoom;$('zoom-in').disabled=zoom>=maxZoom;
    updateCamera();
  }
  function update(){
    const live=mode==='game',state=game.state;
    document.body.dataset.mode=mode;
    $('touch-controls').hidden=!live||!compact.matches;
    $('demo-controls').hidden=live;$('game-hud').hidden=!live;$('key-hint').hidden=!live;
    $('mode-game').setAttribute('aria-selected',String(live));$('mode-game').setAttribute('tabindex',live?'0':'-1');
    $('mode-watch').setAttribute('aria-selected',String(!live));$('mode-watch').setAttribute('tabindex',live?'-1':'0');
    $('viewport').setAttribute('aria-labelledby',live?'mode-game':'mode-watch');
    $('scene').setAttribute('role',live?'application':'img');
    if(live)playing=true;
    $('play').hidden=live;$('play').disabled=live;
    $('help-pause-label').hidden=live;$('help-pause-key').hidden=live;
    $('play').setAttribute('aria-label',playing?'Pause video':'Resume video');
    $('play-icon').setAttribute('d',playing?'M4 3h3v10H4zm5 0h3v10H9z':'M4 2.5 13 8 4 13.5Z');
    $('seek').value=time;$('seek').style.setProperty('--progress',`${time/scene.duration*100}%`);
    $('seek').setAttribute('aria-valuetext',`${time.toFixed(1)} seconds`);
    $('time').textContent=`00:${String(Math.floor(time)).padStart(2,'0')} / ${scene.duration}`;
    $('health-fill').style.transform=`scaleX(${state.health/100})`;$('stamina-fill').style.transform=`scaleX(${state.stamina/100})`;
    $('health').setAttribute('aria-valuenow',Math.round(state.health));$('stamina').setAttribute('aria-valuenow',Math.round(state.stamina));
    const restartHint=compact.matches?'Tap restart':'R to restart',separator=' · ';
    const message=live?(state.phase==='won'?`Victory${separator}${restartHint}`:state.phase==='defeated'?`Defeated${separator}${restartHint}`:''):'';
    if($('game-status').textContent!==message)$('game-status').textContent=message;
    if(live&&compact.matches){
      const cooldown=Math.max(0,game.hero.slamReady-game.time),remaining=cooldown>.05?`Ready in ${cooldown.toFixed(1)}s`:`${catalog[sceneIndex].specialCooldown}s cooldown`;
      if($('touch-special-cooldown').textContent!==remaining)$('touch-special-cooldown').textContent=remaining;
      $('touch-special').setAttribute('aria-disabled',String(cooldown>.05));
      $('touch-special').setAttribute('aria-label',`${catalog[sceneIndex].help[2]}. ${remaining}`);
    }
    updateCamera();
  }
  function setMode(next,chosen=true){
    if(chosen)modeChosen=true;
    if(mode===next)return;endPan();
    const before=$('control-panel').getBoundingClientRect(),beforeScene=$('scene-motion').getBoundingClientRect();
    panelAnimation?.cancel();settleSceneMotion();
    mode=next;clearInput();previous=performance.now();playing=true;
    if(mode==='game')game.render();else renderWatch();update();syncSceneFrame();syncModeSelection(true);
    if(compact.matches&&!reduced.matches&&Number.isFinite(before.top)){
      const after=$('control-panel').getBoundingClientRect();
      panelAnimation=$('control-panel').animate([{transform:`translateY(${before.top-after.top}px)`},{transform:'translateY(0)'}],{duration:300,easing:'cubic-bezier(.22,1,.36,1)'});
      const afterScene=$('scene-motion').getBoundingClientRect(),scale=Math.min(beforeScene.width,beforeScene.height*1200/880)/Math.max(1,Math.min(afterScene.width,afterScene.height*1200/880));
      const from=[beforeScene.left+beforeScene.width/2-afterScene.left-afterScene.width/2,beforeScene.top+beforeScene.height/2-afterScene.top-afterScene.height/2,scale,1];
      if(from.every(Number.isFinite)){
        const token=transitionId,animation=settlePose($('scene-motion'),from,centerPose);sceneAnimations.push(animation);
        animation.onfinish=()=>{if(token===transitionId)settleSceneMotion();};
      }
    }
  }
  function togglePause(){if(mode==='game')return;playing=!playing;clearInput();previous=performance.now();update();}
  function frame(now){
    const dt=Math.min((now-previous)/1000,.05);previous=now;
    if(playing&&!$('showcase-dialog').open){
      if(mode==='game'){
        accumulator+=dt;while(accumulator>=1/60){game.step(1/60,input());accumulator-=1/60;}game.render();
      }else{time=(time+dt*speed)%scene.duration;renderWatch();}
      update();
    }
    requestAnimationFrame(frame);
  }
  let showcaseTimer=null;
  function openShowcase(){
    clearTimeout(showcaseTimer);endPan();clearInput();closeSceneMenu();setHelpOpen(false,false);
    const modal=$('showcase-dialog');
    if(!modal.open){
      $('showcase-frame').setAttribute('src','https://www.youtube-nocookie.com/embed/CLH_EomM030?autoplay=1&playsinline=1&rel=0');
      modal.showModal();
    }
    modal.classList.remove('is-closing');void modal.offsetWidth;modal.classList.add('is-open');
    $('youtube-trigger').setAttribute('aria-expanded','true');$('showcase-close').focus({preventScroll:true});
  }
  function closeShowcase(){
    const modal=$('showcase-dialog');if(!modal.open)return;
    clearTimeout(showcaseTimer);modal.classList.remove('is-open');modal.classList.add('is-closing');
    if(reduced.matches)modal.close();
    else showcaseTimer=setTimeout(()=>modal.close(),motionMs('--modal-close-dur',150));
  }
  $('youtube-trigger').onclick=openShowcase;
  $('showcase-close').onclick=closeShowcase;
  $('showcase-dialog').addEventListener('cancel',e=>{e.preventDefault();closeShowcase();});
  $('showcase-dialog').addEventListener('click',e=>{
    if(e.target!==$('showcase-dialog'))return;
    const r=$('showcase-dialog').getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeShowcase();
  });
  $('showcase-dialog').addEventListener('close',()=>{
    clearTimeout(showcaseTimer);$('showcase-dialog').classList.remove('is-open','is-closing');
    $('showcase-frame').removeAttribute('src');$('youtube-trigger').setAttribute('aria-expanded','false');
    previous=performance.now();$('youtube-trigger').focus({preventScroll:true});
  });
  function navigateScene(direction,event){if(event?.detail>0&&performance.now()<suppressSceneClickUntil)return;selectScene(sceneIndex+direction,direction);if(event?.detail>0&&mode==='game')$('scene').focus({preventScroll:true});}
  $('scene-prev').onclick=e=>navigateScene(-1,e);
  $('scene-next').onclick=e=>navigateScene(1,e);
  sceneTabs.forEach((tab,i)=>{tab.onclick=e=>{selectScene(i);if(e?.detail>0&&mode==='game')$('scene').focus({preventScroll:true});};});
  $('scene-overflow').onclick=e=>{if(menuOpen)closeSceneMenu(true,e?.detail>0);else openSceneMenu(false,e?.detail>0);};
  function resizeUI(){endPan();clearInput();panelAnimation?.cancel();settleSceneMotion();closeSceneMenu();setHelpOpen(false,false);if(!modeChosen)setMode(compact.matches?'watch':'game',false);update();layoutSelector();updatePreviews();syncSceneFrame();syncModeSelection();setZoom(zoom);}
  window.addEventListener('resize',resizeUI);compact.addEventListener('change',resizeUI);
  document.fonts?.ready.then(()=>{syncSceneFrame();layoutSelector();syncModeSelection();});
  if(window.ResizeObserver){const observer=new window.ResizeObserver(syncSceneFrame);observer.observe($('viewport'));}
  $('play').onclick=togglePause;
  $('restart').onclick=()=>{clearInput();if(mode==='game'){game.reset();game.render();playing=true;}else{time=0;renderWatch();}update();};
  $('mode-game').onclick=()=>setMode('game');
  $('mode-watch').onclick=()=>setMode('watch');
  $('help-trigger').onclick=e=>{e.preventDefault();setHelpOpen(!helpOpen,e.detail>0);};
  $('seek').addEventListener('input',e=>{time=Number(e.target.value);renderWatch();update();});
  $('speed').onclick=()=>{speed=speed===1?.5:speed===.5?.25:1;$('speed').textContent=`${speed}×`;$('speed').setAttribute('aria-label',`Playback speed: ${speed} times`);};
  $('zoom-in').onclick=()=>setZoom(zoom+.25);
  $('zoom-out').onclick=()=>setZoom(zoom-.25);
  $('zoom-reset').onclick=resetView;
  function releaseTouch(id){
    const press=touchPresses.get(id);if(!press)return;
    touchPresses.delete(id);clearTimeout(press.timer);
    if(typeof id==='number'&&press.button.hasPointerCapture?.(id))press.button.releasePointerCapture(id);
    syncTouchPresses();game.input=input();
  }
  function pressTouch(id,button,code){
    if(!compact.matches||mode!=='game'||touchPresses.has(id))return;
    touchPresses.set(id,{button,code});syncTouchPresses();game.activate();
    if(actions[code])game.command(actions[code],input());
    game.input=input();update();
  }
  for(const [name,code] of Object.entries(touchBindings)){
    const button=$(`touch-${name}`);
    button.addEventListener('pointerdown',e=>{
      if(e.button!==undefined&&e.button!==0)return;e.preventDefault();
      pressTouch(e.pointerId,button,code);if(touchPresses.has(e.pointerId))button.setPointerCapture?.(e.pointerId);
    });
    if(movement.has(code))button.addEventListener('pointermove',e=>{
      const press=touchPresses.get(e.pointerId);if(!press)return;
      const rect=$('touch-dpad').getBoundingClientRect(),x=e.clientX-rect.left-rect.width/2,y=e.clientY-rect.top-rect.height/2;
      const threshold=Math.max(rect.width*.12,Math.max(Math.abs(x),Math.abs(y))*.45);
      press.codes=[];if(Math.abs(x)>threshold)press.codes.push(x>0?'KeyD':'KeyA');if(Math.abs(y)>threshold)press.codes.push(y>0?'KeyS':'KeyW');
      syncTouchPresses();game.input=input();e.preventDefault();
    });
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>releaseTouch(e.pointerId));
    button.addEventListener('keydown',e=>{
      if(!['Enter','Space'].includes(e.code))return;e.preventDefault();e.stopPropagation();
      if(!e.repeat)pressTouch(`keyboard-${name}`,button,code);
    });
    button.addEventListener('keyup',e=>{
      if(!['Enter','Space'].includes(e.code))return;e.preventDefault();e.stopPropagation();releaseTouch(`keyboard-${name}`);
    });
    button.addEventListener('blur',()=>releaseTouch(`keyboard-${name}`));
    button.onclick=e=>{
      // Screen-reader activation has no pointer; give held actions a short pulse.
      if(e.detail!==0)return;const id=`accessible-${name}`;pressTouch(id,button,code);
      const press=touchPresses.get(id);if(press)press.timer=setTimeout(()=>releaseTouch(id),180);
    };
  }
  $('viewport').addEventListener('wheel',e=>{
    if(!e.deltaY||$('site-header').contains(e.target))return;
    e.preventDefault();
    const unit=e.deltaMode===1?16:e.deltaMode===2?880:1,delta=Math.max(-120,Math.min(120,e.deltaY*unit));
    setZoom(zoom*Math.exp(-delta*(e.ctrlKey ? .006 : .002)));
  },{passive:false});
  $('scene-stage').addEventListener('pointerdown',beginPan);
  $('scene-stage').addEventListener('pointermove',movePan);
  $('scene-stage').addEventListener('pointerup',e=>endCameraPointer(e,true));
  ['pointercancel','lostpointercapture'].forEach(type=>$('scene-stage').addEventListener(type,endCameraPointer));
  document.addEventListener('pointerdown',e=>{
    if(menuOpen&&!$('scene-overflow-wrap').contains(e.target)&&!$('scene-menu').contains(e.target))closeSceneMenu(false,true);
    const help=$('key-help');
    if(helpOpen&&!help.contains(e.target))setHelpOpen(false);
  });
  document.addEventListener('keydown',e=>{
    if($('showcase-dialog').open)return;
    if(e.ctrlKey||e.metaKey||e.altKey||e.target.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return;
    if(sceneMenuKey(e))return;
    const sceneTab=sceneTabs.findIndex(tab=>tab===e.target||tab.contains(e.target));
    if(sceneTab!==-1&&['ArrowLeft','ArrowRight','Home','End'].includes(e.code)){
      e.preventDefault();
      if(!e.repeat){const next=e.code==='Home'?0:e.code==='End'?catalog.length-1:sceneTab+(e.code==='ArrowRight'?1:-1);selectScene(next);(sceneIndex<visibleTabCount?sceneTabs[sceneIndex]:$('scene-overflow')).focus({preventScroll:true});}
      return;
    }
    if((e.target===$('mode-game')||e.target===$('mode-watch'))&&['ArrowLeft','ArrowRight','Home','End'].includes(e.code)){
      e.preventDefault();
      if(!e.repeat){
        const next=e.code==='Home'?'game':e.code==='End'?'watch':e.target===$('mode-game')?'watch':'game';
        setMode(next);$(next==='game'?'mode-game':'mode-watch').focus({preventScroll:true});
      }
      return;
    }
    if(['Equal','NumpadAdd','Minus','NumpadSubtract','Digit0','Numpad0'].includes(e.code)){
      e.preventDefault();
      if(e.code==='Digit0'||e.code==='Numpad0')resetView();
      else setZoom(zoom+(['Equal','NumpadAdd'].includes(e.code)?.25:-.25));
      return;
    }
    if(e.code==='Space'&&/^(BUTTON|A|SUMMARY)$/.test(e.target.tagName))return;
    if(e.code==='KeyP'||e.code==='Escape'){if(!e.repeat){e.preventDefault();if(e.code==='Escape'&&helpOpen)setHelpOpen(false,false,true);else togglePause();}return;}
    if(e.code==='KeyR'){if(!e.repeat){e.preventDefault();setMode('game');game.reset();clearInput();playing=true;game.render();update();}return;}
    const relevant=movement.has(e.code)||actions[e.code]||e.code==='ShiftLeft'||e.code==='ShiftRight';
    if(!relevant)return;e.preventDefault();
    modeChosen=true;
    if(mode!=='game')setMode('game');
    keys.add(e.code);if(e.code!=='ShiftLeft'&&e.code!=='ShiftRight')$('scene').focus({preventScroll:true});
    if(playing){game.activate();if(actions[e.code]&&!e.repeat)game.command(actions[e.code],input());}
    update();
  });
  document.addEventListener('focusin',e=>{if(menuOpen&&!$('scene-overflow-wrap').contains(e.target)&&!$('scene-menu').contains(e.target))closeSceneMenu();if(helpOpen&&!$('key-help').contains(e.target))setHelpOpen(false);});
  document.addEventListener('keyup',e=>keys.delete(e.code));
  window.addEventListener('blur',()=>{endPan();closeSceneMenu();setHelpOpen(false,false);clearInput();if(mode==='watch'&&!$('showcase-dialog').open)playing=false;previous=performance.now();update();});
  document.addEventListener('visibilitychange',()=>{endPan();clearInput();previous=performance.now();if(document.hidden&&mode==='watch')playing=false;update();});
  reduced.addEventListener('change',e=>{if(e.matches){endPan();settleSceneMotion();transitionPopover($('scene-menu'),menuOpen,false);setHelpOpen(helpOpen,false);syncModeSelection();moveSelection('scene-selector','scene-selection-pill',sceneIndex<visibleTabCount?sceneTabs[sceneIndex]:$('scene-overflow'));if(mode==='watch'){playing=false;update();}}});
  worlds.activate(catalog[0].id);applySceneUI();if(mode==='game')game.render();else renderWatch();setZoom(1);update();syncSceneFrame();syncModeSelection();requestAnimationFrame(frame);
  window.Player={get game(){return game;},selectScene,get sceneIndex(){return sceneIndex;},get sceneId(){return catalog[sceneIndex].id;},setMode,setZoom,resetView,pause(){if(mode==='watch'){playing=false;clearInput();update();}},play(){playing=true;previous=performance.now();update();},seek(t){setMode('watch');time=Math.max(0,Math.min(scene.duration,t));renderWatch();update();},get playing(){return playing;},get mode(){return mode;},get zoom(){return zoom;}};
})();
