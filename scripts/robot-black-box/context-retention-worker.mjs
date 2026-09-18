import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {ContextRetention} from '../../packages/robot-black-box-governance/src/context-retention.mjs';
const root=resolve(process.argv[2]);const request=JSON.parse(readFileSync(0,'utf8'));const manager=new ContextRetention(join(root,'owned'),{allowedBase:resolve('.rbb'),trust:JSON.parse(readFileSync(join(root,'retention-trust.json'),'utf8'))});
try{
 const result=manager.purge(request.actor,request.source,request.approval,{fault:request.fault??null,cleanup:runtime=>{
  const r=spawnSync(resolve('.rbb/cognee-runtime/bin/python'),['scripts/robot-black-box/context-store-probe.py',runtime,'cleanup',request.source_digest],{encoding:'utf8',timeout:30000,maxBuffer:2*1024*1024});if(r.status!==0)throw Error('BACKEND_CLEANUP_FAILED');return JSON.parse(r.stdout);
 }});console.log(JSON.stringify({pid:process.pid,result}));
}catch(e){console.log(JSON.stringify({pid:process.pid,status:'refused_or_interrupted',code:e.code??e.message}));if(e.message.startsWith('INJECTED_'))process.exit(99);process.exitCode=3;}
finally{manager.close();}
