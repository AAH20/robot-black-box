import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {context} from '../../packages/robot-black-box-cli/src/index.mjs';
import {canonical} from '../../packages/robot-black-box-contract/src/index.mjs';
import {atomicWrite} from '../../packages/robot-black-box-recorder/src/index.mjs';
import {governanceReplay} from './governance-execute.mjs';
const root=resolve(process.argv[2]??'.rbb/governance-demo');const receipt=JSON.parse(readFileSync(process.argv[3]??'.rbb/langgraph-executed/execution.json','utf8'));const ctx=context(join(root,'custody'));
try{const result=governanceReplay(ctx,{case_id:'G20',run_id:'demo-G20',out:join(root,'cases/G20'),runtime:receipt});atomicWrite(join(root,'custody/witness/latest-heads.json'),canonical(ctx.witness.snapshot()));atomicWrite(join(root,'runtime-binding.json'),canonical({schema:'rbb.runtime.binding.v1',result,scope:'Real local LangGraph SDK checkpoint receipt bound into signed synthetic governance bundle; model/twins/biometric/Cognee remain fixtures.'}));console.log(JSON.stringify(result,null,2));}finally{ctx.witness.close();}
