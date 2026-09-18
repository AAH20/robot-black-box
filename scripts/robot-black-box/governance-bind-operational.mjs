import {readFileSync,cpSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {context} from '../../packages/robot-black-box-cli/src/index.mjs';
import {canonical,digest} from '../../packages/robot-black-box-contract/src/index.mjs';
import {atomicWrite} from '../../packages/robot-black-box-recorder/src/index.mjs';
import {governanceReplay} from './governance-execute.mjs';
const root=resolve(process.argv[2]??'.rbb/governance-demo'),runtime=resolve(process.argv[3]??'.rbb/assurance-executed'),operational=JSON.parse(readFileSync(join(runtime,'execution.json'))),ctx=context(join(root,'custody'));
try{const result=governanceReplay(ctx,{case_id:'G25',run_id:'demo-G25',out:join(root,'cases/G25'),operational});if(result.integrity!=='valid'||result.governance!=='unknown')throw Error('OPERATIONAL_BINDING_FAILED');atomicWrite(join(root,'custody/witness/latest-heads.json'),canonical(ctx.witness.snapshot()));const dest=resolve('examples/robot-black-box-governance/executed');cpSync(join(root,'cases/G25'),join(dest,'cases/G25'),{recursive:true});cpSync(join(root,'custody/trust.json'),join(dest,'trust.json'));cpSync(join(root,'custody/witness/latest-heads.json'),join(dest,'latest-heads.json'));atomicWrite(join(dest,'operational-assurance-execution.json'),canonical(operational));atomicWrite(join(dest,'operational-binding.json'),canonical({schema:'rbb.operational.binding.v1',result,receipt_digest:digest(canonical(operational)),scope:operational.scope}));console.log(JSON.stringify(result));}finally{ctx.witness.close();}
