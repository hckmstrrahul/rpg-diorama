/** Reproducible transfer-size estimates; gzip each file as a separate response. */
import fs from 'node:fs';
import {gzipSync} from 'node:zlib';
const app=new URL('../app/',import.meta.url);
const runtime=fs.readdirSync(app).filter(name=>/\.(html|css|js)$/.test(name));
const previews=fs.readdirSync(new URL('assets/',app)).filter(name=>name.endsWith('-preview.svg')).map(name=>'assets/'+name);
const entry=['assets/kombat-preview.svg','assets/tsushima-preview.svg'];
const measure=files=>files.reduce((sum,name)=>{
 const bytes=fs.readFileSync(new URL(name,app));
 return {files:sum.files+1,raw:sum.raw+bytes.length,gzip:sum.gzip+gzipSync(bytes,{level:6}).length};
},{files:0,raw:0,gzip:0});
const format=n=>n>=1024*1024?`${(n/1024/1024).toFixed(2)} MiB`:`${(n/1024).toFixed(1)} KiB`;
console.table(Object.fromEntries([
 ['Runtime HTML / CSS / JS',runtime],
 ['First two scene previews',entry],
 ['Initial load estimate',[...runtime,...entry]],
 ['All 13 scene previews',previews]
].map(([name,files])=>{const m=measure(files);return [name,{files:m.files,uncompressed:format(m.raw),'gzip estimate':format(m.gzip)}];})));
console.log('Compression is an estimate, not a measured browser transfer. Only neighboring previews load as you browse. Artwork exports and videos are excluded.');
