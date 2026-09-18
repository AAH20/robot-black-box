import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url));const [major,minor]=process.versions.node.split('.').map(Number);
if(major<22||(major===22&&minor<23))throw Error('Node >=22.23 required; tested exact Node 22.23.0');
function run(command,args,cwd=root){const r=spawnSync(command,args,{cwd,stdio:'inherit'});if(r.status!==0)process.exit(r.status??1);}
mkdirSync(join(root,'.rbb'),{recursive:true,mode:0o700});writeFileSync(join(root,'.rbb','.gitignore'),'*\n!.gitignore\n');
run(process.execPath,['scripts/robot-black-box/build.mjs']);
run(process.execPath,['--test','scripts/test-robot-black-box.mjs','scripts/test-robot-black-box-governance.mjs']);
if(process.argv.includes('--bridge')){
 if(!existsSync(join(root,'node_modules','typescript')))run('npm',['ci','--ignore-scripts','--no-audit','--no-fund']);
 run('npm',['run','build','-w','@grc-claw/evidence']);run('npm',['run','test:physical-ai-assurance']);
}
if(process.argv.includes('--media'))run('npm',['ci','--ignore-scripts','--workspaces=false','--no-audit','--no-fund'],join(root,'media','robot-black-box-demo'));
console.log('Core bootstrap passed. --bridge builds existing GRC reports; --media installs exact locked renderer. Commercial HTTP tests need permission to bind loopback in restricted environments.');
