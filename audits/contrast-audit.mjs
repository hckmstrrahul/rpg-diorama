/** Audit the shipped UI colors, including opacity and every gradient interval. */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const appRoot=new URL('../app/',import.meta.url);
function load(){
  const window={MidgardCombat:class{},Diorama:{},WorldCharacters:{}};
  const context=vm.createContext({window,Math});
  for(const file of ['legend-combat.js','scene-palettes.js','worlds.js'])vm.runInContext(fs.readFileSync(new URL(file,appRoot),'utf8'),context);
  return window;
}
const rgb=c=>c.slice(1).match(/../g).map(n=>parseInt(n,16)/255);
const blend=(a,b,alpha)=>a.map((v,i)=>v*alpha+b[i]*(1-alpha));
const hex=c=>'#'+c.map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('');
const luminance=c=>c.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function lab(color){
  const [r,g,b]=rgb(color).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  const xyz=[(r*.4124564+g*.3575761+b*.1804375)/.95047,r*.2126729+g*.7151522+b*.072175,(r*.0193339+g*.119192+b*.9503041)/1.08883];
  const [x,y,z]=xyz.map(v=>v>216/24389?Math.cbrt(v):(24389/27*v+16)/116);
  return [116*y-16,500*(x-y),200*(y-z)];
}
const colorDistance=(a,b)=>{a=lab(a);b=lab(b);return Math.hypot(...a.map((v,i)=>v-b[i]));};
function audit(window){return window.Worlds.catalog.map(profile=>{
  const colors=window.ScenePalette(profile.id),page=[];
  for(let i=0;i<2;i++)for(let j=0;j<=20;j++)page.push(hex(blend(rgb(profile.bg[i]),rgb(profile.bg[i+1]),j/20)));
  const surfaces=[colors.panel,colors.well,colors.selected,colors.hover],checks=[];
  function check(name,foreground,backgrounds,minimum,opacity=1){
    const results=backgrounds.map(bg=>({background:bg,ratio:contrast(blend(rgb(foreground),rgb(bg),opacity),rgb(bg))}));
    const worst=results.reduce((a,b)=>a.ratio<b.ratio?a:b);
    checks.push({name,foreground,opacity,background:worst.background,ratio:+worst.ratio.toFixed(3),minimum,pass:worst.ratio>=minimum});
  }
  const onScene=colors['on-scene']||colors.muted,accent=colors['scene-accent']||profile.accent;
  check('Control labels (80% opacity)',onScene,page,4.5,.8);
  check('Status, time and speed',onScene,page,4.5);
  check('Scene preview captions',colors['on-scene']||accent,page,4.5,colors['on-scene']?.8:.68);
  check('Panel text',colors.ink,surfaces,4.5);
  check('Website heading',colors['on-scene']||accent,page,4.5);
  check('Website subtitle',colors['on-scene']||accent,page,4.5);
  check('GitHub pill',colors.ink,[colors.selected],4.5);
  check('Secondary panel text',colors.muted,surfaces,4.5);
  check('Selected / hover text',accent,surfaces,4.5);
  check('Key text (80% opacity)',colors.muted,[colors.key],4.5,.8);
  check('Primary control glyph',colors['on-primary'],[colors.primary,colors['primary-hover']],3);
  check('Health icon and fill',colors.health,[...page,colors.track],3);
  check('Energy icon and fill',colors.energy,[...page,colors.track],3);
  check('Timeline boundary',colors['meter-edge']||colors.track,colors['meter-edge']?[...page,colors.track]:page,3);
  check('Health fill / empty track',colors.health,[colors.track],4.5);
  check('Energy fill / empty track',colors.energy,[colors.track],4.5);
  check('Focus and timeline thumb',colors.focus,[...page,...surfaces,colors.track],3);
  const delta=colorDistance(colors.health,colors.energy);
  return {id:profile.id,title:profile.title,background:profile.bg,colors,checks,meterDifference:{deltaE76:+delta.toFixed(2),minimum:25,pass:delta>=25}};
});}
const scenes=audit(load());
const report={method:'sRGB relative luminance; 42 gradient samples per scene; opacity composited before measuring. Active UI tokens only; this is not a full accessibility conformance assessment. Meter hue separation uses a design target of Delta E 76 >= 25, independently of contrast.',references:['https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html','https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html'],scenes};
if(process.argv.includes('--write'))fs.writeFileSync(new URL('./contrast-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
for(const scene of scenes){
  const failures=scene.checks.filter(c=>!c.pass);
  console.log(`${scene.title}: ${scene.checks.length-failures.length}/${scene.checks.length} contrast checks pass; meter ΔE ${scene.meterDifference.deltaE76}${failures.length?' — '+failures.map(c=>`${c.name} ${c.ratio}`).join(', '):''}`);
}
const failures=scenes.flatMap(scene=>scene.checks.filter(c=>!c.pass).map(c=>`${scene.id}: ${c.name} ${c.ratio}:1`));
for(const scene of scenes)if(!scene.meterDifference.pass)failures.push(`${scene.id}: meter colors too similar (Delta E ${scene.meterDifference.deltaE76})`);
assert.equal(failures.length,0,failures.join('\n'));
console.log(`All ${scenes.length} scenes pass: ${scenes.reduce((sum,scene)=>sum+scene.checks.length,0)} contrast checks and ${scenes.length} meter color-separation checks.`);
