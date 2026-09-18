import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
for(const name of readdirSync(root+'packages').filter(x=>x.startsWith('robot-black-box-'))){const result=spawnSync(process.execPath,['--check',root+'packages/'+name+'/src/index.mjs'],{stdio:'inherit'});if(result.status!==0)process.exit(result.status??1);}
console.log('All Robot Black Box ESM workspace entry points passed Node syntax checks. No generated dist or root tsconfig edits required.');
