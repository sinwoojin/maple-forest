'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..'), output=path.join(root,'public');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const assets=[...html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css))"/g)].map(m=>m[1]);
const files=[...new Set(['index.html',...assets])];
for(const name of files)if(!/^[a-zA-Z0-9-]+\.(html|css|js)$/.test(name)||!fs.statSync(path.join(root,name)).isFile())throw Error('Invalid public asset: '+name);
fs.mkdirSync(output,{recursive:true});
for(const entry of fs.readdirSync(output)){if(!fs.statSync(path.join(output,entry)).isFile())throw Error('Unexpected directory in public output');fs.unlinkSync(path.join(output,entry));}
for(const name of files)fs.copyFileSync(path.join(root,name),path.join(output,name));
console.log('Packaged '+files.length+' public game assets.');
