import {readFileSync,cpSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {context} from '../../packages/robot-black-box-cli/src/index.mjs';
import {canonical} from '../../packages/robot-black-box-contract/src/index.mjs';
import {atomicWrite} from '../../packages/robot-black-box-recorder/src/index.mjs';
import {governanceReplay} from './governance-execute.mjs';
const root=resolve(process.argv[2]??'.rbb/governance-demo');
const simulation=JSON.parse(readFileSync('.rbb/simulation-executed/execution.json','utf8'));
const contextReceipt=JSON.parse(readFileSync('.rbb/cognee-verified-intake/execution.json','utf8'));
const ctx=context(join(root,'custody'));
try{
 const result=governanceReplay(ctx,{case_id:'G21',run_id:'demo-G21',out:join(root,'cases/G21'),simulation,contextReceipt});
 if(result.integrity!=='valid'||result.governance!=='unknown')throw Error('LOCAL_RUNTIME_BOUNDARY_FAILED');
 atomicWrite(join(root,'custody/witness/latest-heads.json'),canonical(ctx.witness.snapshot()));
 const report={schema:'rbb.local.runtime.binding.v1',result,scope:'Actual MuJoCo metrics and Cognee intake/deletion receipt bound to signed synthetic governance evidence. Missing sim-to-real assessment and unavailable semantic retrieval keep governance unknown.'};
 atomicWrite(join(root,'local-runtime-binding.json'),canonical(report));
 const dest=resolve('examples/robot-black-box-governance/executed');
 cpSync(join(root,'cases/G21'),join(dest,'cases/G21'),{recursive:true});
 cpSync(join(root,'custody/trust.json'),join(dest,'trust.json'));
 cpSync(join(root,'custody/witness/latest-heads.json'),join(dest,'latest-heads.json'));
 for(const [file,data]of [['simulation-execution.json',simulation],['cognee-intake-execution.json',contextReceipt],['local-runtime-binding.json',report]])atomicWrite(join(dest,file),canonical(data));
 console.log(JSON.stringify(report,null,2));
}finally{ctx.witness.close();}
