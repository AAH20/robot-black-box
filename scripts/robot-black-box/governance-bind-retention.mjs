import {readFileSync,cpSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {context} from '../../packages/robot-black-box-cli/src/index.mjs';
import {canonical,digest} from '../../packages/robot-black-box-contract/src/index.mjs';
import {atomicWrite} from '../../packages/robot-black-box-recorder/src/index.mjs';
import {governanceReplay} from './governance-execute.mjs';
const root=resolve(process.argv[2]??'.rbb/governance-demo'),runtime=resolve(process.argv[3]??'.rbb/context-retention-executed');
const retention=JSON.parse(readFileSync(join(runtime,'execution.json'))),retentionTrust=JSON.parse(readFileSync(join(runtime,'retention-trust.json'))),ctx=context(join(root,'custody'));
try{
 const result=governanceReplay(ctx,{case_id:'G24',run_id:'demo-G24',out:join(root,'cases/G24'),retention,retentionTrust});
 if(result.integrity!=='valid'||result.governance!=='unknown')throw Error('RETENTION_BINDING_FAILED');
 atomicWrite(join(root,'custody/witness/latest-heads.json'),canonical(ctx.witness.snapshot()));
 const dest=resolve('examples/robot-black-box-governance/executed');cpSync(join(root,'cases/G24'),join(dest,'cases/G24'),{recursive:true});cpSync(join(root,'custody/trust.json'),join(dest,'trust.json'));cpSync(join(root,'custody/witness/latest-heads.json'),join(dest,'latest-heads.json'));
 atomicWrite(join(dest,'context-retention-execution.json'),canonical(retention));atomicWrite(join(dest,'context-retention-trust.json'),canonical(retentionTrust));atomicWrite(join(dest,'retention-binding.json'),canonical({schema:'rbb.context.retention.binding.v1',receipt_digest:digest(canonical(retention)),result,scope:retention.scope,limitations:retention.limitations}));console.log(JSON.stringify(result));
}finally{ctx.witness.close();}
